export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { cardKeyConfigured, decryptCardContent, maskSecret } from '@/lib/cardkey'
import { CardImportError, cardImportSchema, importCardKeys } from '@/lib/cardkey-import'
import { writeAudit } from '@/lib/audit'
import { getCurrentUser } from '@/lib/auth'
import { adminGuard } from '@/lib/admin-guard'
import { parseTenantFilter, INVALID_TENANT_FILTER, siteOptions, cardSiteWhere, cardSources } from '@/lib/admin/source-site'

// 列表（默认脱敏；reveal=1 返回明文，仅管理员可用，受 middleware 保护）
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
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
    // 来源站 = 售出订单的站；'stock' = 未售（设计 5.5）。不传 = 全部，where 与原来一致
    const site = parseTenantFilter(searchParams, 'tenantId', ['stock'] as const)
    if (site === 'invalid') return error(INVALID_TENANT_FILTER)

    const where: Prisma.CardKeyWhereInput = { productId }
    if (site != null) where.AND = [await cardSiteWhere(site, productId)]
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

    const srcOf = await cardSources(rows)
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
        redeemProvider: c.redeemProvider, // 非空 = 走站内兑换页；空 = 跳转 redeemUrl / 商品默认链接
        usedAt: c.usedAt, // 发出时间
        createdAt: c.createdAt, // 创建/导入时间
        // 来源站：售出订单的站 / 外部站 / 库存（未售）
        source: srcOf(c),
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
      sites: await siteOptions(),
    })
  } catch (err) {
    console.error('List cardkeys error:', err)
    return error('查询失败')
  }
}

// 批量导入卡密（加密入库，同商品内去重）。导入逻辑在 lib/cardkey-import.ts（与微信机器人补货页共用，docs/微信机器人-设计.md §9.3），
// 这里只做鉴权、解析与响应；校验文案、返回字段、错误文案与抽出之前逐字相同。tx 传 null = 函数里照旧同步库存
export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    if (!cardKeyConfigured()) return error('未配置 CARDKEY_SECRET，无法安全存储卡密', 500)

    const body = await request.json()
    const parsed = cardImportSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const r = await importCardKeys(null, parsed.data)

    // 顺带补审计（原来没有）：谁、给哪个商品、导了几张、什么成本与兑换方式。不记卡密内容。审计失败不影响已导入的卡
    const { productId, batch, cost, redeemUrl, redeemProvider } = parsed.data
    const actor = await getCurrentUser().catch(() => null)
    await writeAudit(null, {
      actorUserId: actor?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'cardkey.import',
      targetType: 'product',
      targetId: String(productId),
      diff: {
        total: r.total,
        created: r.created,
        skipped: r.skipped,
        batch: batch || null,
        cost: cost ?? 0,
        redeemProvider: redeemProvider?.trim() || null,
        redeemUrl: redeemUrl?.trim() || null,
      },
      req: request,
    }).catch((e) => console.error('[cardkeys] 导入审计写入失败', productId, e))

    return success({ total: r.total, created: r.created, skipped: r.skipped }, '导入完成')
  } catch (err) {
    if (err instanceof CardImportError) return error(err.message, err.status)
    console.error('Import cardkeys error:', err)
    return error('导入失败')
  }
}
