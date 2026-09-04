export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import {
  cardKeyConfigured,
  encryptCardContent,
  decryptCardContent,
  cardContentHash,
  maskSecret,
  syncAutoStock,
} from '@/lib/cardkey'

// 列表（默认脱敏；reveal=1 返回明文，仅管理员可用，受 middleware 保护）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = parseInt(searchParams.get('productId') || '0')
    if (!productId) return error('请选择商品')
    const status = searchParams.get('status')?.trim()
    const batch = (searchParams.get('batch') || '').trim()
    const keyword = (searchParams.get('keyword') || '').trim()
    const hasOrder = (searchParams.get('hasOrder') || '').trim() // '1' 已关联订单 | '0' 未关联
    const reveal = searchParams.get('reveal') === '1'
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50') || 50, 1), 200)

    const where: Prisma.CardKeyWhereInput = { productId }
    if (status) where.status = status
    if (batch) where.batch = batch
    if (keyword) {
      // 关键词按备注 / 批次模糊（卡密本身是密文，无法模糊检索）
      where.OR = [{ remark: { contains: keyword } }, { batch: { contains: keyword } }]
    }
    if (hasOrder === '1') where.orderId = { not: null }
    else if (hasOrder === '0') where.orderId = null

    // 统计口径：数量按商品全量（不随筛选变化，便于随时看到总盘子）；
    // 成本合计 = 该商品全部卡密的进货成本；流水/利润合计 = 已发出卡密的售价/利润之和。
    // 利润是落库列，这里只做 aggregate 求和，绝不在应用层逐行现算。
    const [rows, total, unused, used, disabled, costAgg, soldAgg, product] = await Promise.all([
      prisma.cardKey.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cardKey.count({ where }),
      prisma.cardKey.count({ where: { productId, status: 'UNUSED' } }),
      prisma.cardKey.count({ where: { productId, status: 'USED' } }),
      prisma.cardKey.count({ where: { productId, status: 'DISABLED' } }),
      prisma.cardKey.aggregate({ where: { productId }, _sum: { cost: true } }),
      prisma.cardKey.aggregate({
        where: { productId, status: 'USED' },
        _sum: { soldPrice: true, profit: true },
      }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { cardUsage: true, cardRedeemUrl: true },
      }),
    ])

    const list = rows.map((c) => {
      let secret = ''
      try {
        const plain = decryptCardContent(c.content)
        secret = reveal ? plain : maskSecret(plain)
      } catch {
        secret = '(无法解密)'
      }
      return {
        id: c.id,
        productId: c.productId,
        status: c.status,
        secret,
        orderId: c.orderId,
        externalRef: c.externalRef, // 外部站发卡归属：<client>:<orderNo>；有它说明卡不是本站订单发的
        batch: c.batch,
        remark: c.remark,
        cost: c.cost != null ? Number(c.cost) : null,
        soldPrice: c.soldPrice != null ? Number(c.soldPrice) : null,
        profit: c.profit != null ? Number(c.profit) : null, // null = 利润未知，前端不要显示 0
        redeemUrl: c.redeemUrl,
        usedAt: c.usedAt, // 发出时间
        createdAt: c.createdAt, // 创建/导入时间
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      stats: {
        unused,
        used,
        disabled,
        totalCost: Number(costAgg._sum.cost ?? 0),
        totalRevenue: Number(soldAgg._sum.soldPrice ?? 0),
        totalProfit: Number(soldAgg._sum.profit ?? 0),
      },
      cardUsage: product?.cardUsage ?? '',
      cardRedeemUrl: product?.cardRedeemUrl ?? '',
    })
  } catch (err) {
    console.error('List cardkeys error:', err)
    return error('查询失败')
  }
}

const importSchema = z.object({
  productId: z.number().int().positive(),
  content: z.string().min(1, '请粘贴卡密，每行一条'),
  batch: z.string().trim().max(40).optional().nullable(),
  remark: z.string().trim().max(255).optional().nullable(),
  // 本批进货成本（元/张）；不填按 0 记，保证历史口径一致
  cost: z.number().min(0, '成本不能为负').max(999999).optional(),
  // 本批专属兑换地址；留空则买家侧回落到 Product.cardRedeemUrl
  redeemUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), '兑换地址需以 http:// 或 https:// 开头')
    .optional()
    .nullable(),
})

// 批量导入卡密（加密入库，同商品内去重）
export async function POST(request: NextRequest) {
  try {
    if (!cardKeyConfigured()) return error('未配置 CARDKEY_SECRET，无法安全存储卡密', 500)

    const body = await request.json()
    const parsed = importSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { productId, content, batch, remark, cost, redeemUrl } = parsed.data

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) return error('商品不存在')

    // 拆行 + 去空 + 输入内部去重
    const seen = new Set<string>()
    const items: { plain: string; hash: string }[] = []
    for (const line of content.split(/\r?\n/)) {
      const plain = line.trim()
      if (!plain) continue
      const hash = cardContentHash(plain)
      if (seen.has(hash)) continue
      seen.add(hash)
      items.push({ plain, hash })
    }
    if (items.length === 0) return error('没有有效卡密')

    // 跳过已存在
    const existing = await prisma.cardKey.findMany({
      where: { productId, contentHash: { in: items.map((i) => i.hash) } },
      select: { contentHash: true },
    })
    const existsSet = new Set(existing.map((e) => e.contentHash))
    const fresh = items.filter((i) => !existsSet.has(i.hash))

    // 成本按批录入，落库为定点小数；未填按 0（与历史卡回填口径一致）
    const batchCost = new Prisma.Decimal((cost ?? 0).toFixed(2))
    const batchRedeemUrl = redeemUrl?.trim() || null

    if (fresh.length > 0) {
      await prisma.cardKey.createMany({
        data: fresh.map((i) => ({
          productId,
          content: encryptCardContent(i.plain),
          contentHash: i.hash,
          status: 'UNUSED',
          batch: batch || null,
          remark: remark || null,
          cost: batchCost,
          redeemUrl: batchRedeemUrl,
        })),
        skipDuplicates: true,
      })
    }

    await syncAutoStock(productId)

    return success(
      { total: items.length, created: fresh.length, skipped: items.length - fresh.length },
      '导入完成'
    )
  } catch (err) {
    console.error('Import cardkeys error:', err)
    return error('导入失败')
  }
}
