export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma, type LotteryPrize } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { success, error } from '@/lib/api'
import {
  RATE_SCALE,
  bpToPercentText,
  parseRateToBp,
  prizeInputSchema,
  prizeLabel,
  rateSumAfterEdit,
  sumEnabledBp,
  type PrizeInput,
} from '@/lib/lottery'
import { LotteryError } from '@/lib/lottery-server'

/**
 * 下单有奖 · 奖项列表与新增。编辑/停用/删除在 prizes/[id]。
 *
 * 【概率一律按整数万分比算】后台填的是百分比文本（如 12.5），进来先 parseRateToBp 转成 1250，
 * 合计校验、存库、抽奖全程只碰整数 —— 浮点 12.5 + 0.1 会得到 12.600000000000001，
 * 「合计不得超过 100%」就会在边界上误判。
 *
 * 【合计校验放在事务里读全表】不是信前端算好的合计：前端拿到的列表可能已经过时
 * （另一个标签页刚加了一个奖项）。残余风险：两个管理员**同时**各加一个奖项，
 * 各自的事务都看不到对方那一行，合计仍可能超过 100%。这里只有站长一个人在配，
 * 而超出的部分在 lib/lottery.ts 的 pickPrize 里是「永远抽不到」而不是越界，
 * 后台列表也会标红提示，所以不为这个场景上表锁（空表上的间隙锁反而容易死锁）。
 */

/** 与 prizes/[id]/route.ts 里的同名函数一字不差 —— route.ts 不能导出非 handler，改一处要同步另一处 */
function checkProductIds(raw: string | null | undefined): { ok: true; ids: number[] } | { ok: false; message: string } {
  const tokens = (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const ids: number[] = []
  for (const t of tokens) {
    // 严格校验而不是静默丢弃：lib 里的 parseIdsCsv 会把「3a」这类悄悄扔掉，
    // 后台录错一个 id 就少一个可用商品，而站长完全不知道
    if (!/^\d{1,9}$/.test(t) || Number(t) <= 0) {
      return { ok: false, message: `商品 id「${t.slice(0, 20)}」不正确，只能填正整数，用逗号分隔` }
    }
    const n = Number(t)
    if (!ids.includes(n)) ids.push(n)
  }
  if (!ids.length) return { ok: false, message: '商品券必须指定至少一个商品' }
  if (ids.length > 50) return { ok: false, message: '最多指定 50 个商品' }
  return { ok: true, ids }
}

/** 金额最多两位小数（与 lotteryConfigSchema 同口径）。多出来的位数 toFixed 会悄悄四舍五入，宁可报错 */
function twoDecimals(v: number): boolean {
  return Math.abs(v * 100 - Math.round(v * 100)) < 1e-6
}

/**
 * 请求体 → 库里的一行。与 prizes/[id]/route.ts 里的同名函数一字不差。
 * CUSTOM 奖把 coupon* 列全部置空：留着旧值不会被用到，但后台/报表按列读时会误以为它发券。
 */
async function buildPrizeData(
  d: PrizeInput
): Promise<{ ok: true; data: Prisma.LotteryPrizeCreateInput } | { ok: false; message: string }> {
  const rateBp = parseRateToBp(d.rate)
  if (rateBp == null) return { ok: false, message: '中奖概率须在 0.01% ~ 100% 之间，最多两位小数' }

  const base = {
    name: d.name,
    type: d.type,
    rateBp,
    description: d.description || null,
    enabled: d.enabled,
    sortOrder: d.sortOrder,
  }
  if (d.type !== 'COUPON') {
    return {
      ok: true,
      data: {
        ...base,
        couponKind: null,
        couponMinAmount: null,
        couponDiscount: null,
        couponProductIds: null,
        couponValidDays: null,
      },
    }
  }

  const kind = d.couponKind === 'PRODUCT' ? 'PRODUCT' : 'THRESHOLD'
  const discount = Number(d.couponDiscount)
  if (!Number.isFinite(discount) || Math.round(discount * 100) < 1) return { ok: false, message: '券面额至少 0.01 元' }
  if (!twoDecimals(discount)) return { ok: false, message: '券面额最多两位小数' }
  // 商品券的「门槛」没有意义（lib/coupon.ts 对 PRODUCT 不看 minAmount），存 0 免得后台看着像有门槛
  const minAmount = kind === 'THRESHOLD' ? Number(d.couponMinAmount ?? 0) : 0
  if (!Number.isFinite(minAmount) || minAmount < 0) return { ok: false, message: '门槛不能为负数' }
  if (!twoDecimals(minAmount)) return { ok: false, message: '门槛金额最多两位小数' }

  let productIds: string | null = null
  if (kind === 'PRODUCT') {
    const ids = checkProductIds(d.couponProductIds)
    if (!ids.ok) return ids
    // 商品要真的存在，否则中奖的人拿到一张永远用不了的券（与 api/admin/coupons 建券同一道检查）
    // 只在「启用」时要求商品都在：停用必须总能成功 —— 商品被删之后，管理员得能把这个奖项停掉，
    // 而不是被这道检查卡住、让它继续发一张永远用不了的券。重新启用时仍会检查
    if (d.enabled !== false) {
      const n = await prisma.product.count({ where: { id: { in: ids.ids } } })
      if (n !== ids.ids.length) return { ok: false, message: '指定的商品里有不存在的，请检查商品 id' }
    }
    productIds = ids.ids.join(',')
  }

  return {
    ok: true,
    data: {
      ...base,
      couponKind: kind,
      couponMinAmount: new Prisma.Decimal(minAmount.toFixed(2)),
      couponDiscount: new Prisma.Decimal(discount.toFixed(2)),
      couponProductIds: productIds,
      couponValidDays: d.couponValidDays ?? null,
    },
  }
}

function serializePrize(p: LotteryPrize) {
  // Decimal 在 JSON 里是字符串，前端拿去 toFixed 会炸 —— 出接口前一律转 number
  const couponMinAmount = p.couponMinAmount == null ? null : Number(p.couponMinAmount)
  const couponDiscount = p.couponDiscount == null ? null : Number(p.couponDiscount)
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    rateBp: p.rateBp,
    ratePercent: bpToPercentText(p.rateBp),
    label: prizeLabel({
      type: p.type,
      name: p.name,
      couponKind: p.couponKind,
      couponMinAmount,
      couponDiscount,
      couponProductIds: p.couponProductIds,
      couponValidDays: p.couponValidDays,
    }),
    couponKind: p.couponKind,
    couponMinAmount,
    couponDiscount,
    couponProductIds: p.couponProductIds,
    couponValidDays: p.couponValidDays,
    description: p.description,
    enabled: p.enabled,
    sortOrder: p.sortOrder,
    wonCount: p.wonCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

// ---------- GET 列表 ----------

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    // 与抽奖时的遍历顺序一致（lib/lottery.ts 的 orderPrizes：sortOrder 升序、同序按 id），
    // 后台看到的顺序就是奖项在数轴上排开的顺序
    const rows = await prisma.lotteryPrize.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })
    const enabledRateBp = sumEnabledBp(rows)
    const noWinRateBp = Math.max(0, RATE_SCALE - enabledRateBp)
    return success({
      list: rows.map(serializePrize),
      totals: {
        enabledRateBp,
        enabledRatePercent: bpToPercentText(enabledRateBp),
        noWinRateBp,
        noWinRatePercent: bpToPercentText(noWinRateBp),
        // 正常情况下保存时就拦住了；只有并发编辑才可能出现，前台据此标红
        overLimit: enabledRateBp > RATE_SCALE,
      },
    })
  } catch (err) {
    console.error('List lottery prizes error:', err)
    return error('获取奖项列表失败')
  }
}

// ---------- POST 新增 ----------

export async function POST(request: NextRequest) {
  let operator: { id: number; email: string | null }
  try {
    const me = await requireAdmin()
    operator = { id: me.id, email: me.email }
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const parsed = prizeInputSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const built = await buildPrizeData(parsed.data)
    if (!built.ok) return error(built.message)
    const data = built.data

    try {
      const created = await prisma.$transaction(async (tx) => {
        const all = await tx.lotteryPrize.findMany({ select: { id: true, rateBp: true, enabled: true } })
        // enabled 缺省时数据库默认是 true，这里按同一口径算，不能把「没传」当成停用
        const sum = rateSumAfterEdit(all, null, { rateBp: data.rateBp, enabled: data.enabled !== false })
        if (sum > RATE_SCALE) {
          throw new LotteryError(`启用奖项的中奖概率合计不能超过 100%（保存后将是 ${bpToPercentText(sum)}%）`)
        }
        return tx.lotteryPrize.create({ data })
      })
      console.info('[lottery] 新增奖项', { by: operator.email || operator.id, id: created.id, rateBp: created.rateBp })
      return success(serializePrize(created), '已添加')
    } catch (e) {
      if (e instanceof LotteryError) return error(e.message, e.status)
      throw e
    }
  } catch (err) {
    console.error('Create lottery prize error:', err)
    return error('保存失败')
  }
}
