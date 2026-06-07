export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
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
    const reveal = searchParams.get('reveal') === '1'
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 200)

    const where = { productId, ...(status ? { status } : {}) }
    const [rows, total, unused, used, disabled, product] = await Promise.all([
      prisma.cardKey.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.cardKey.count({ where }),
      prisma.cardKey.count({ where: { productId, status: 'UNUSED' } }),
      prisma.cardKey.count({ where: { productId, status: 'USED' } }),
      prisma.cardKey.count({ where: { productId, status: 'DISABLED' } }),
      prisma.product.findUnique({ where: { id: productId }, select: { cardUsage: true, cardRedeemUrl: true } }),
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
        status: c.status,
        secret,
        orderId: c.orderId,
        batch: c.batch,
        remark: c.remark,
        usedAt: c.usedAt,
        createdAt: c.createdAt,
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      stats: { unused, used, disabled },
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
})

// 批量导入卡密（加密入库，同商品内去重）
export async function POST(request: NextRequest) {
  try {
    if (!cardKeyConfigured()) return error('未配置 CARDKEY_SECRET，无法安全存储卡密', 500)

    const body = await request.json()
    const parsed = importSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { productId, content, batch, remark } = parsed.data

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

    if (fresh.length > 0) {
      await prisma.cardKey.createMany({
        data: fresh.map((i) => ({
          productId,
          content: encryptCardContent(i.plain),
          contentHash: i.hash,
          status: 'UNUSED',
          batch: batch || null,
          remark: remark || null,
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
