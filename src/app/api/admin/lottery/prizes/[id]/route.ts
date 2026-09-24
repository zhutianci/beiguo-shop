export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { success, error, notFound } from '@/lib/api'
import {
  RATE_SCALE,
  bpToPercentText,
  parseRateToBp,
  prizeInputSchema,
  rateSumAfterEdit,
  type PrizeInput,
} from '@/lib/lottery'
import { LotteryError } from '@/lib/lottery-server'

/**
 * 下单有奖 · 单个奖项的编辑 / 停用启用 / 删除。
 *
 * 停用、启用也走 PUT（前端带上整行）：启用一个奖项同样要过「合计 ≤ 100%」这道闸，
 * 单独开一个只改 enabled 的口子就得再写一遍校验，迟早两边不一致。
 *
 * 改奖项只影响**之后**的抽奖：已中奖记录存的是中奖那一刻的快照（LotteryEntry.prizeDetail），
 * 发出去的券是独立的单张批次，都不会跟着变。
 */

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** 与 prizes/route.ts 里的同名函数一字不差 —— route.ts 不能导出非 handler，改一处要同步另一处 */
function checkProductIds(raw: string | null | undefined): { ok: true; ids: number[] } | { ok: false; message: string } {
  const tokens = (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const ids: number[] = []
  for (const t of tokens) {
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

function twoDecimals(v: number): boolean {
  return Math.abs(v * 100 - Math.round(v * 100)) < 1e-6
}

/** 与 prizes/route.ts 里的同名函数一字不差（理由见那边的注释） */
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
  const minAmount = kind === 'THRESHOLD' ? Number(d.couponMinAmount ?? 0) : 0
  if (!Number.isFinite(minAmount) || minAmount < 0) return { ok: false, message: '门槛不能为负数' }
  if (!twoDecimals(minAmount)) return { ok: false, message: '门槛金额最多两位小数' }

  let productIds: string | null = null
  if (kind === 'PRODUCT') {
    const ids = checkProductIds(d.couponProductIds)
    if (!ids.ok) return ids
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

// ---------- PUT 编辑（含停用 / 启用） ----------

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let operator: { id: number; email: string | null }
  try {
    const me = await requireAdmin()
    operator = { id: me.id, email: me.email }
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = parseId(params.id)
    if (!id) return notFound('奖项不存在')

    const body = await request.json().catch(() => ({}))
    const parsed = prizeInputSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const built = await buildPrizeData(parsed.data)
    if (!built.ok) return error(built.message)
    const data = built.data

    try {
      await prisma.$transaction(async (tx) => {
        const all = await tx.lotteryPrize.findMany({ select: { id: true, rateBp: true, enabled: true } })
        if (!all.some((p) => p.id === id)) throw new LotteryError('奖项不存在', 404)
        // 把「正在编辑的这一项」换成改完之后的样子再求和：它原来的概率不能重复计入
        const sum = rateSumAfterEdit(all, id, { rateBp: data.rateBp, enabled: data.enabled !== false })
        if (sum > RATE_SCALE) {
          throw new LotteryError(`启用奖项的中奖概率合计不能超过 100%（保存后将是 ${bpToPercentText(sum)}%）`)
        }
        await tx.lotteryPrize.update({ where: { id }, data })
      })
      console.info('[lottery] 修改奖项', {
        by: operator.email || operator.id,
        id,
        rateBp: data.rateBp,
        enabled: data.enabled,
      })
      return success({ id }, '已保存')
    } catch (e) {
      if (e instanceof LotteryError) return error(e.message, e.status)
      throw e
    }
  } catch (err) {
    console.error('Update lottery prize error:', err)
    return error('保存失败')
  }
}

// ---------- DELETE 删除（仅限从未中出过的） ----------

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  let operator: { id: number; email: string | null }
  try {
    const me = await requireAdmin()
    operator = { id: me.id, email: me.email }
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = parseId(params.id)
    if (!id) return notFound('奖项不存在')

    const cur = await prisma.lotteryPrize.findUnique({ where: { id }, select: { id: true, wonCount: true } })
    if (!cur) return notFound('奖项不存在')

    // 中过奖的奖项不能删：抽奖记录里的 prizeId 会指向一个不存在的奖项，后台按奖项统计就断了。
    // 除了 wonCount 再查一遍记录表 —— wonCount 只是统计列，万一被手工改过也不至于误删
    const refs = cur.wonCount > 0 ? cur.wonCount : await prisma.lotteryEntry.count({ where: { prizeId: id } })
    if (refs > 0) return error('该奖项已有中奖记录，只能停用，不能删除')

    // 条件删除：与抽奖事务并发时（那边会在同一事务里给 wonCount +1），以落库那一刻为准。
    // 抽奖那边若先提交，这里 count=0 → 拒绝；这里若先删掉，那边的 wonCount 自增会失败、
    // 整个抽奖事务回滚成「未抽」，买家重试即可，不会出现发了奖却查不到奖项的记录
    const r = await prisma.lotteryPrize.deleteMany({ where: { id, wonCount: 0 } })
    if (r.count !== 1) return error('该奖项已有中奖记录，只能停用，不能删除')

    console.info('[lottery] 删除奖项', { by: operator.email || operator.id, id })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete lottery prize error:', err)
    return error('删除失败')
  }
}
