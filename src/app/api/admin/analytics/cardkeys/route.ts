export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { round2 } from '@/lib/money'

/**
 * 卡密数据分析：数据源 = CardKey 表（网站自助下单自动发货 + 外部站调库存 API 领卡），
 * 口径 status='USED' 且 usedAt 落在区间内（usedAt = 发出时间，createdAt = 导入时间，勿混用）。
 *
 * 【绝不解密】统计只读 productId / usedAt / cost / soldPrice / profit / externalRef 六列，
 * 不碰 content，也不调用 decryptCardContent —— 一次解密上千张卡会把接口拖垮。
 *
 * 【为什么在 Node 里分组而不是 $queryRaw】
 * 1. 容器 TZ(Asia/Shanghai) 与 MySQL session 时区未必一致，DATE(used_at) / CONVERT_TZ 的结果
 *    会随部署环境漂移，对不上前端选的日历日；在 Node 里按固定东八区偏移换算是确定性的。
 * 2. totals / daily / byProduct / bySource 四组结果必须自洽（合计 = 每日之和 = 每商品之和），
 *    一次遍历同一批行天然保证一致，分成多条聚合 SQL 反而容易口径打架。
 * 3. 行数可控：先 count，超过 MAX_ROWS 直接要求缩小区间，不会无限拉数据到内存。
 */

// 业务时区固定东八区（docker-compose 里容器 TZ 也是 Asia/Shanghai），
// 不依赖进程 TZ，避免换机器/换镜像后日切点漂移。
const TZ_OFFSET_MIN = 8 * 60
const DAY_MS = 86400000
// 单次分析最多拉取的卡密行数，超过则要求缩小区间（保护内存）
const MAX_ROWS = 100000
// 单次分析最大跨度天数
const MAX_DAYS = 366

/** 业务时区的 YYYY-MM-DD 当天 00:00:00 对应的 UTC 时刻 */
function dayStartUtc(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - TZ_OFFSET_MIN * 60000)
}
/** 业务时区的 YYYY-MM-DD 当天 23:59:59.999 对应的 UTC 时刻 */
function dayEndUtc(day: string): Date {
  return new Date(Date.parse(`${day}T23:59:59.999Z`) - TZ_OFFSET_MIN * 60000)
}
/** 把一个绝对时刻归到业务时区的哪一天 */
function dayKey(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10)
}
/** 闭区间内逐日展开（补零，图表不断档） */
function eachDay(from: string, to: string): string[] {
  const out: string[] = []
  const end = Date.parse(`${to}T00:00:00.000Z`)
  for (let t = Date.parse(`${from}T00:00:00.000Z`); t <= end; t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10))
  }
  return out
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const querySchema = z.object({
  from: z.string().regex(DATE_RE, 'from 日期格式应为 YYYY-MM-DD'),
  to: z.string().regex(DATE_RE, 'to 日期格式应为 YYYY-MM-DD'),
  productId: z.coerce.number().int().positive().optional(),
})

type Bucket = {
  cards: number
  cost: number
  revenue: number
  profit: number
  /** 利润未知（profit IS NULL）的张数，区别于「利润为 0」 */
  unknownProfitCards: number
}
const newBucket = (): Bucket => ({ cards: 0, cost: 0, revenue: 0, profit: 0, unknownProfitCards: 0 })
const sealBucket = (b: Bucket) => ({
  cards: b.cards,
  cost: round2(b.cost),
  revenue: round2(b.revenue),
  profit: round2(b.profit),
  unknownProfitCards: b.unknownProfitCards,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 默认最近 30 天（含今天），按业务时区算
    const todayKey = dayKey(new Date())
    const defaultFrom = new Date(Date.parse(`${todayKey}T00:00:00.000Z`) - 29 * DAY_MS)
      .toISOString()
      .slice(0, 10)

    const rawProductId = searchParams.get('productId')?.trim()
    const parsed = querySchema.safeParse({
      from: searchParams.get('from')?.trim() || defaultFrom,
      to: searchParams.get('to')?.trim() || todayKey,
      ...(rawProductId ? { productId: rawProductId } : {}),
    })
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const { from, to, productId } = parsed.data
    const gte = dayStartUtc(from)
    const lte = dayEndUtc(to)
    if (Number.isNaN(gte.getTime()) || Number.isNaN(lte.getTime())) return error('日期不合法')
    if (gte > lte) return error('开始日期不能晚于结束日期')

    const days = eachDay(from, to)
    if (days.length > MAX_DAYS) return error(`区间最长 ${MAX_DAYS} 天，请缩小范围`)

    const where: Prisma.CardKeyWhereInput = {
      status: 'USED',
      usedAt: { gte, lte },
      ...(productId ? { productId } : {}),
    }

    // 命中 @@index([status, usedAt])
    const totalRows = await prisma.cardKey.count({ where })
    if (totalRows > MAX_ROWS) {
      return error(`区间内卡密 ${totalRows} 张，超过单次统计上限 ${MAX_ROWS} 张，请缩小时间范围`)
    }

    const rows = await prisma.cardKey.findMany({
      where,
      select: {
        productId: true,
        usedAt: true,
        cost: true,
        soldPrice: true,
        profit: true,
        externalRef: true,
      },
      orderBy: { usedAt: 'asc' },
    })

    const dec = (v: Prisma.Decimal | null) => (v == null ? null : Number(v))

    // 三个维度的桶：按天 / 按商品 / 按来源
    const dailyMap = new Map<string, Bucket>()
    for (const d of days) dailyMap.set(d, newBucket())
    const productMap = new Map<number, Bucket>()
    const local = newBucket()
    const external = newBucket()
    const totals = newBucket()
    // 外部站发卡且利润未知的张数（收入没回传，无法计入利润）
    let externalUnknownProfitCards = 0

    for (const r of rows) {
      // cost 为 null 按 0 计（历史卡回填 0，语义上就是「没花钱/未知成本不计」）
      const cost = dec(r.cost) ?? 0
      // revenue / profit 为 null 表示「未知」，绝不当 0 累加，只计数
      const revenue = dec(r.soldPrice)
      const profit = dec(r.profit)
      const isExternal = !!r.externalRef

      const apply = (b: Bucket) => {
        b.cards++
        b.cost += cost
        if (revenue != null) b.revenue += revenue
        if (profit != null) b.profit += profit
        else b.unknownProfitCards++
      }

      apply(totals)
      apply(isExternal ? external : local)
      if (isExternal && profit == null) externalUnknownProfitCards++

      // usedAt 在 where 里已限定非空，这里再兜一层，避免 TS 报 null
      if (r.usedAt) {
        const key = dayKey(r.usedAt)
        const d = dailyMap.get(key)
        // 边界毫秒理论上不会落到区间外，落了就丢弃而不是新建一天，保证 daily 与 range 对齐
        if (d) apply(d)
      }

      let p = productMap.get(r.productId)
      if (!p) {
        p = newBucket()
        productMap.set(r.productId, p)
      }
      apply(p)
    }

    // 商品名（只查用到的那几个）
    const productIds = Array.from(productMap.keys())
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : []
    const nameMap = new Map(products.map((p) => [p.id, p.name]))

    const byProduct = productIds
      .map((id) => ({
        productId: id,
        productName: nameMap.get(id) || `商品#${id}`,
        ...sealBucket(productMap.get(id)!),
      }))
      .sort((a, b) => b.revenue - a.revenue || b.cards - a.cards)

    const daily = days.map((d) => ({ date: d, ...sealBucket(dailyMap.get(d)!) }))

    const t = sealBucket(totals)

    return success({
      range: {
        from,
        to,
        days: days.length,
        // 前端展示用：说明日切点口径
        tzOffsetMinutes: TZ_OFFSET_MIN,
        tzLabel: 'UTC+8',
        productId: productId ?? null,
      },
      totals: {
        cards: t.cards,
        cost: t.cost,
        revenue: t.revenue,
        profit: t.profit,
        // 毛利率 = 已知利润 / 已知流水
        profitMargin: t.revenue > 0 ? round2((t.profit / t.revenue) * 100) : 0,
        // 利润未知的张数（profit IS NULL），其中外部站发卡的部分单列
        unknownProfitCards: t.unknownProfitCards,
        externalUnknownProfitCards,
        externalCards: external.cards,
        externalCost: round2(external.cost),
        localCards: local.cards,
      },
      daily,
      byProduct,
      bySource: {
        local: sealBucket(local),
        external: sealBucket(external),
      },
    })
  } catch (err) {
    console.error('CardKey analytics error:', err)
    return error('统计失败')
  }
}
