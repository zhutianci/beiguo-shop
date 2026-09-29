/**
 * 余额总账每日对账（docs/短信接码-设计.md §9.3、§9.4 的 W 系列；cron /api/cron/wallet-reconcile 每天 03:10）。
 *
 * 只读：任何一条不通过都只推 wallet.alert、写 settings.wallet_reconcile_last，**绝不自动改账**
 * （改账绕开 postInTx 与 bizKey，比不一致本身更危险）。
 *
 *   W1 当天（前两天）有流水的用户：users.balance = Σ delta、users.topup_cents = Σ topup_delta_cents；每周日全量（豁免名单除外）
 *   W2 没有任何一格为负
 *   W3 预扣 ⇔ hold:/release:/refund: 流水（两格分别同额），并核 §9.3 的预扣等式
 *   W4 CAPTURED / REFUNDED 的预扣 ⇔ 订单 Payment 里 BALANCE 行 = 预扣合计、ALIPAY 行 = amount − 预扣合计
 *   W5 HELD 的预扣：订单 UNPAID 且未取消、持续 ≤ 60 分钟（卡住的预扣）
 *   W6 已付款的 TOPUP 订单 ⇔ 恰好一条 topup:<orderId>，金额 = 让它付款的那张收款单的 reallyPrice
 *   W7 LATEPAY 流水 ⇔ handledAs='LATEPAY' 的待核实条目（B1 起才有数据）
 *   W8 全站：Σ balance = Σ delta、Σ topup_cents = Σ topup_delta_cents（豁免名单除外）；负债 = 两格合计 + HELD 合计
 *   W9 载体单（TOPUP / SMS_POOL）没有「已付款 + 已取消」这类非法组合；TOPUP 已付款必是 DELIVERED
 *
 * 【豁免名单】§5.6：旧账核对时站长剔除、不补「历史对齐」流水的用户，写在 settings.wallet_reconcile_exempt
 * （{"userIds":[…],"note":"…"}），W1 / W8 跳过它们并在报告里列出。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify } from '../notify'
import { centsOf, fmtCents } from './buckets'

export const RECONCILE_LAST_KEY = 'wallet_reconcile_last'
export const RECONCILE_EXEMPT_KEY = 'wallet_reconcile_exempt'
/** HELD 预扣的「卡住」阈值（W5）：正常最长约 21 分钟，留足余量 */
export const STUCK_HOLD_MIN = 60

export interface ReconcileItem {
  code: string
  title: string
  ok: boolean
  count: number
  samples: string[]
  note?: string
}

export interface ReconcileReport {
  at: string
  full: boolean
  sinceHours: number
  exemptUserIds: number[]
  liability: { topupCents: number; cashCents: number; heldCents: number; heldCount: number; totalCents: number }
  items: ReconcileItem[]
  ok: boolean
}

const MAX_SAMPLES = 10

function item(code: string, title: string, bad: string[], note?: string): ReconcileItem {
  return { code, title, ok: bad.length === 0, count: bad.length, samples: bad.slice(0, MAX_SAMPLES), ...(note ? { note } : {}) }
}

const n = (v: unknown) => Number(v ?? 0)

export async function readExemptUserIds(): Promise<number[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: RECONCILE_EXEMPT_KEY } })
    if (!row?.value) return []
    const v = JSON.parse(row.value) as { userIds?: unknown }
    return Array.isArray(v.userIds) ? v.userIds.map(Number).filter((x) => Number.isSafeInteger(x) && x > 0) : []
  } catch {
    return []
  }
}

/** 负债看板（§7.8、§9.3）：Σ 充值格 + Σ 返现格 + Σ HELD 预扣。W8 与后台概览共用同一个函数 */
export async function liabilityNow(db: Prisma.TransactionClient | typeof prisma = prisma) {
  const [u, h] = await Promise.all([
    db.$queryRaw<{ t: unknown; c: unknown }[]>`SELECT COALESCE(SUM(topup_cents),0) AS t, COALESCE(SUM(balance),0) AS c FROM users`,
    db.$queryRaw<{ s: unknown; k: unknown }[]>`SELECT COALESCE(SUM(topup_cents + cash_cents),0) AS s, COUNT(*) AS k FROM balance_holds WHERE state = 'HELD'`,
  ])
  const topupCents = n(u[0]?.t)
  const cashCents = centsOf(u[0]?.c ?? 0)
  const heldCents = n(h[0]?.s)
  return { topupCents, cashCents, heldCents, heldCount: n(h[0]?.k), totalCents: topupCents + cashCents + heldCents }
}

/** 从 bizKey 里取订单 id（hold:12 → 12） */
function keyOrderId(key: string | null, prefix: string): number | null {
  if (!key || !key.startsWith(prefix)) return null
  const id = Number(key.slice(prefix.length))
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function runWalletReconcile(opts: { full?: boolean; sinceHours?: number; now?: Date; alert?: boolean; save?: boolean } = {}): Promise<ReconcileReport> {
  const now = opts.now ?? new Date()
  const sinceHours = opts.sinceHours ?? 48
  const since = new Date(now.getTime() - sinceHours * 3600_000)
  const full = !!opts.full
  const exempt = await readExemptUserIds()
  const exemptSet = new Set(exempt)
  const items: ReconcileItem[] = []

  // ---------- W1：每个用户两格 = 流水之和 ----------
  {
    const rows = full
      ? await prisma.$queryRaw<{ id: number; balance: unknown; topup_cents: number; s_cash: unknown; s_topup: unknown }[]>`
          SELECT u.id, u.balance, u.topup_cents, COALESCE(SUM(l.delta),0) AS s_cash, COALESCE(SUM(l.topup_delta_cents),0) AS s_topup
            FROM users u LEFT JOIN balance_logs l ON l.user_id = u.id
           GROUP BY u.id, u.balance, u.topup_cents
          HAVING u.balance <> COALESCE(SUM(l.delta),0) OR u.topup_cents <> COALESCE(SUM(l.topup_delta_cents),0)`
      : await prisma.$queryRaw<{ id: number; balance: unknown; topup_cents: number; s_cash: unknown; s_topup: unknown }[]>`
          SELECT u.id, u.balance, u.topup_cents, COALESCE(SUM(l.delta),0) AS s_cash, COALESCE(SUM(l.topup_delta_cents),0) AS s_topup
            FROM users u LEFT JOIN balance_logs l ON l.user_id = u.id
           WHERE u.id IN (SELECT DISTINCT user_id FROM balance_logs WHERE created_at >= ${since})
           GROUP BY u.id, u.balance, u.topup_cents
          HAVING u.balance <> COALESCE(SUM(l.delta),0) OR u.topup_cents <> COALESCE(SUM(l.topup_delta_cents),0)`
    const bad = rows
      .filter((r) => !exemptSet.has(Number(r.id)))
      .map((r) => `用户#${r.id} 返现格 ${fmtCents(centsOf(r.balance))} / 流水 ${fmtCents(centsOf(r.s_cash))}；充值格 ${fmtCents(n(r.topup_cents))} / 流水 ${fmtCents(n(r.s_topup))}`)
    const skipped = rows.filter((r) => exemptSet.has(Number(r.id))).length
    items.push(item('W1', full ? '每个用户两格 = 流水之和（全量）' : `近 ${sinceHours} 小时有流水的用户两格 = 流水之和`, bad, skipped ? `豁免 ${skipped} 个用户（${RECONCILE_EXEMPT_KEY}）` : undefined))
  }

  // ---------- W2：没有负数 ----------
  {
    const rows = await prisma.$queryRaw<{ id: number; balance: unknown; topup_cents: number }[]>`
      SELECT id, balance, topup_cents FROM users WHERE balance < 0 OR topup_cents < 0 LIMIT 100`
    items.push(item('W2', '没有任何一格为负', rows.map((r) => `用户#${r.id} 返现格 ${fmtCents(centsOf(r.balance))}、充值格 ${fmtCents(n(r.topup_cents))}`)))
  }

  // ---------- W3 / W4 / W5：预扣 ----------
  const holds = await prisma.balanceHold.findMany({
    select: { id: true, orderId: true, userId: true, topupCents: true, cashCents: true, state: true, heldAt: true },
  })
  const holdLogs = await prisma.balanceLog.findMany({
    where: { type: { in: ['HOLD', 'RELEASE', 'REFUND'] } },
    select: { id: true, type: true, userId: true, orderId: true, bizKey: true, delta: true, topupDeltaCents: true },
  })
  {
    const bad: string[] = []
    const byKey = new Map<string, (typeof holdLogs)[number]>()
    for (const l of holdLogs) if (l.bizKey) byKey.set(l.bizKey, l)
    const holdByOrder = new Map(holds.map((h) => [h.orderId, h]))
    let sumHold = [0, 0]
    let sumRelease = [0, 0]
    let sumRefundBal = [0, 0]
    let sumLive = [0, 0]
    for (const h of holds) {
      const hl = byKey.get(`hold:${h.orderId}`)
      if (!hl) bad.push(`预扣 #${h.id}（订单 #${h.orderId}）没有 hold 流水`)
      else if (hl.topupDeltaCents !== -h.topupCents || centsOf(hl.delta) !== -h.cashCents || hl.userId !== h.userId)
        bad.push(`预扣 #${h.id} 与 hold 流水 #${hl.id} 金额或用户不一致`)
      else {
        sumHold = [sumHold[0] + h.topupCents, sumHold[1] + h.cashCents]
      }
      const rl = byKey.get(`release:${h.orderId}`)
      if (h.state === 'RELEASED') {
        if (!rl) bad.push(`已释放的预扣 #${h.id} 没有 release 流水`)
        else if (rl.topupDeltaCents !== h.topupCents || centsOf(rl.delta) !== h.cashCents) bad.push(`预扣 #${h.id} 与 release 流水 #${rl.id} 金额不一致`)
        else sumRelease = [sumRelease[0] + h.topupCents, sumRelease[1] + h.cashCents]
      } else if (rl) bad.push(`预扣 #${h.id} 是 ${h.state}，却有 release 流水 #${rl.id}`)
      const fl = byKey.get(`refund:${h.orderId}`)
      if (h.state === 'REFUNDED') {
        if (!fl) bad.push(`已退款的预扣 #${h.id} 没有 refund 流水`)
        else if (centsOf(fl.delta) !== h.cashCents || fl.topupDeltaCents < h.topupCents) bad.push(`预扣 #${h.id} 与 refund 流水 #${fl.id} 的余额部分不一致`)
        else sumRefundBal = [sumRefundBal[0] + h.topupCents, sumRefundBal[1] + h.cashCents]
      } else if (fl) bad.push(`预扣 #${h.id} 是 ${h.state}，却有 refund 流水 #${fl.id}`)
      if (h.state === 'HELD' || h.state === 'CAPTURED') sumLive = [sumLive[0] + h.topupCents, sumLive[1] + h.cashCents]
    }
    for (const l of holdLogs) {
      const oid = keyOrderId(l.bizKey, l.type === 'HOLD' ? 'hold:' : l.type === 'RELEASE' ? 'release:' : 'refund:')
      if (l.type === 'HOLD' && (!oid || !holdByOrder.has(oid))) bad.push(`hold 流水 #${l.id} 没有对应的预扣行`)
      if (l.type === 'RELEASE' && (!oid || holdByOrder.get(oid)?.state !== 'RELEASED')) bad.push(`release 流水 #${l.id} 没有对应的已释放预扣`)
      if (oid && l.orderId !== oid) bad.push(`流水 #${l.id} 的 orderId 与 bizKey 不一致`)
    }
    // §9.3：Σ HOLD − Σ RELEASE − Σ REFUND 的余额部分 = Σ（HELD + CAPTURED）预扣行（每格分别成立）
    for (const k of [0, 1]) {
      if (sumHold[k] - sumRelease[k] - sumRefundBal[k] !== sumLive[k]) bad.push(`预扣等式不成立（${k === 0 ? '充值格' : '返现格'}）`)
    }
    items.push(item('W3', '预扣 ⇔ hold / release / refund 流水', bad))
  }
  {
    const settled = holds.filter((h) => h.state === 'CAPTURED' || h.state === 'REFUNDED')
    const bad: string[] = []
    if (settled.length) {
      const orders = await prisma.order.findMany({
        where: { id: { in: settled.map((h) => h.orderId) } },
        select: { id: true, amount: true, payments: { select: { payMethod: true, amount: true } } },
      })
      const om = new Map(orders.map((o) => [o.id, o]))
      for (const h of settled) {
        const o = om.get(h.orderId)
        if (!o) {
          bad.push(`预扣 #${h.id} 的订单 #${h.orderId} 不存在`)
          continue
        }
        const hc = h.topupCents + h.cashCents
        const bal = o.payments.filter((p) => p.payMethod === 'BALANCE').map((p) => centsOf(p.amount))
        const ali = o.payments.filter((p) => p.payMethod === 'ALIPAY').reduce((a, p) => a + centsOf(p.amount), 0)
        const rest = centsOf(o.amount) - hc
        if (bal.length !== 1 || bal[0] !== hc) bad.push(`订单 #${o.id} 的 BALANCE 支付行应为 1 行 ${fmtCents(hc)}`)
        if (ali !== Math.max(rest, 0)) bad.push(`订单 #${o.id} 的 ALIPAY 支付行应合计 ${fmtCents(Math.max(rest, 0))}，实际 ${fmtCents(ali)}`)
      }
    }
    items.push(item('W4', '已确认的预扣 ⇔ 订单支付流水拆分', bad))
  }
  {
    const held = holds.filter((h) => h.state === 'HELD')
    const bad: string[] = []
    if (held.length) {
      const orders = await prisma.order.findMany({ where: { id: { in: held.map((h) => h.orderId) } }, select: { id: true, payStatus: true, deliveryStatus: true } })
      const om = new Map(orders.map((o) => [o.id, o]))
      for (const h of held) {
        const o = om.get(h.orderId)
        const mins = Math.round(Math.abs(now.getTime() - h.heldAt.getTime()) / 60_000)
        if (!o || o.payStatus !== 'UNPAID' || o.deliveryStatus === 'CANCELLED') bad.push(`预扣 #${h.id} 仍是 HELD，但订单 #${h.orderId} 是 ${o ? `${o.payStatus}/${o.deliveryStatus}` : '不存在'}`)
        else if (mins > STUCK_HOLD_MIN) bad.push(`预扣 #${h.id}（订单 #${h.orderId}）已持续 ${mins} 分钟（卡住）`)
      }
    }
    items.push(item('W5', `HELD 预扣：订单待支付且持续 ≤ ${STUCK_HOLD_MIN} 分钟`, bad))
  }

  // ---------- W6：充值单 ⇔ topup 流水 ----------
  {
    const bad: string[] = []
    const paid = await prisma.order.findMany({
      where: { product: { deliveryType: 'TOPUP' }, payStatus: { in: ['PAID', 'REFUNDED'] } },
      select: { id: true, payments: { select: { payMethod: true, tradeNo: true } } },
    })
    const logs = await prisma.balanceLog.findMany({ where: { type: 'TOPUP' }, select: { id: true, orderId: true, bizKey: true, topupDeltaCents: true, delta: true } })
    const logByOrder = new Map<number, (typeof logs)[number][]>()
    for (const l of logs) {
      const oid = keyOrderId(l.bizKey, 'topup:')
      if (!oid) {
        bad.push(`TOPUP 流水 #${l.id} 的 bizKey 不合法`)
        continue
      }
      logByOrder.set(oid, [...(logByOrder.get(oid) ?? []), l])
    }
    const paidIds = new Set(paid.map((o) => o.id))
    const tradeNos = paid.flatMap((o) => o.payments.filter((p) => p.payMethod === 'ALIPAY' && p.tradeNo).map((p) => p.tradeNo as string))
    const vmqs = tradeNos.length ? await prisma.vmqOrder.findMany({ where: { orderId: { in: tradeNos } }, select: { orderId: true, reallyPrice: true, state: true, bizId: true } }) : []
    const vm = new Map(vmqs.map((v) => [v.orderId, v]))
    for (const o of paid) {
      const ls = logByOrder.get(o.id) ?? []
      if (ls.length !== 1) {
        bad.push(`充值单 #${o.id} 有 ${ls.length} 条 topup 流水`)
        continue
      }
      const ali = o.payments.filter((p) => p.payMethod === 'ALIPAY' && p.tradeNo)
      const v = ali.length === 1 ? vm.get(ali[0].tradeNo as string) : undefined
      if (!v || v.state !== 1 || v.bizId !== o.id) bad.push(`充值单 #${o.id} 找不到让它付款的收款单（ALIPAY 行 tradeNo）`)
      else if (ls[0].topupDeltaCents !== centsOf(v.reallyPrice) || centsOf(ls[0].delta) !== 0) bad.push(`充值单 #${o.id} 入账 ${fmtCents(ls[0].topupDeltaCents)} ≠ 实付 ${fmtCents(centsOf(v.reallyPrice))}`)
    }
    for (const [oid, ls] of Array.from(logByOrder)) if (!paidIds.has(oid)) bad.push(`topup 流水 #${ls[0].id} 对应的订单 #${oid} 不是已付款的充值单`)
    items.push(item('W6', '已付款充值单 ⇔ topup 流水（金额 = 实付）', bad))
  }

  // ---------- W7：LATEPAY ⇔ 已处理为 LATEPAY 的待核实条目（B1 起才有数据） ----------
  {
    const bad: string[] = []
    const logs = await prisma.balanceLog.findMany({ where: { type: 'LATEPAY' }, select: { id: true, orderId: true, bizKey: true, topupDeltaCents: true } })
    const entries = await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' }, value: { contains: '"handledAs":"LATEPAY"' } }, select: { key: true, value: true } })
    const logByKey = new Map(logs.map((l) => [l.bizKey ?? '', l]))
    const entryKeys = new Set(entries.map((e) => e.key))
    for (const l of logs) {
      const key = l.bizKey?.startsWith('latepay:') ? l.bizKey.slice('latepay:'.length) : ''
      if (!entryKeys.has(key)) bad.push(`LATEPAY 流水 #${l.id} 没有对应的已处理条目`)
    }
    const tradeMarks: string[] = []
    for (const e of entries) {
      const l = logByKey.get(`latepay:${e.key}`)
      let v: { price?: string; orderId?: number; tradeNo?: string; auto?: boolean; reason?: string; vmqOrderId?: string } = {}
      try {
        v = JSON.parse(e.value)
      } catch {
        bad.push(`条目 ${e.key} 已损坏`)
        continue
      }
      if (!l) {
        bad.push(`条目 ${e.key} 标成 LATEPAY 却没有流水`)
        continue
      }
      if (l.orderId !== v.orderId) bad.push(`条目 ${e.key} 的 orderId 与流水 #${l.id} 不一致`)
      if (l.topupDeltaCents !== centsOf(v.price ?? '0')) bad.push(`条目 ${e.key} 的实收与流水 #${l.id} 金额不一致`)
      if (v.tradeNo) tradeMarks.push(`latepay_trade:${v.tradeNo}`)
    }
    if (tradeMarks.length) {
      const found = await prisma.setting.findMany({ where: { key: { in: tradeMarks } }, select: { key: true } })
      const fs = new Set(found.map((f) => f.key))
      for (const k of tradeMarks) if (!fs.has(k)) bad.push(`手动退入缺少占位行 ${k}`)
    }
    items.push(item('W7', 'LATEPAY 流水 ⇔ 已处理的待核实条目', bad))
  }

  // ---------- W8：全站两格 = 流水之和；负债 ----------
  const liability = await liabilityNow()
  {
    const bad: string[] = []
    const ex = exempt.length ? Prisma.sql`WHERE id NOT IN (${Prisma.join(exempt)})` : Prisma.empty
    const exL = exempt.length ? Prisma.sql`WHERE user_id NOT IN (${Prisma.join(exempt)})` : Prisma.empty
    const [u, l] = await Promise.all([
      prisma.$queryRaw<{ t: unknown; c: unknown }[]>`SELECT COALESCE(SUM(topup_cents),0) AS t, COALESCE(SUM(balance),0) AS c FROM users ${ex}`,
      prisma.$queryRaw<{ t: unknown; c: unknown }[]>`SELECT COALESCE(SUM(topup_delta_cents),0) AS t, COALESCE(SUM(delta),0) AS c FROM balance_logs ${exL}`,
    ])
    if (n(u[0]?.t) !== n(l[0]?.t)) bad.push(`Σ 充值格 ${fmtCents(n(u[0]?.t))} ≠ Σ 流水 ${fmtCents(n(l[0]?.t))}`)
    if (centsOf(u[0]?.c ?? 0) !== centsOf(l[0]?.c ?? 0)) bad.push(`Σ 返现格 ${fmtCents(centsOf(u[0]?.c ?? 0))} ≠ Σ 流水 ${fmtCents(centsOf(l[0]?.c ?? 0))}`)
    items.push(item('W8', `全站两格 = 流水之和；负债 ${fmtCents(liability.totalCents)}`, bad))
  }

  // ---------- W9：载体单的状态组合 ----------
  {
    const rows = await prisma.order.findMany({
      where: {
        product: { deliveryType: { in: ['TOPUP', 'SMS_POOL'] } },
        OR: [
          { payStatus: 'PAID', deliveryStatus: 'CANCELLED' },
          { payStatus: 'PAID', deliveryStatus: 'PENDING' },
          { payStatus: 'PAID', product: { deliveryType: 'TOPUP' }, deliveryStatus: { not: 'DELIVERED' } },
          { payStatus: 'REFUNDED', deliveryStatus: { not: 'CANCELLED' }, product: { deliveryType: 'SMS_POOL' } },
        ],
      },
      select: { id: true, payStatus: true, deliveryStatus: true, product: { select: { deliveryType: true } } },
      take: 100,
    })
    items.push(item('W9', '载体单（充值 / 接码）的付款与交付状态组合合法', rows.map((o) => `${o.product.deliveryType} 订单 #${o.id}：${o.payStatus}/${o.deliveryStatus}`)))
  }

  const report: ReconcileReport = {
    at: now.toISOString(),
    full,
    sinceHours,
    exemptUserIds: exempt,
    liability,
    items,
    ok: items.every((i) => i.ok),
  }

  if (opts.save !== false) {
    const value = JSON.stringify(report)
    await prisma.setting
      .upsert({ where: { key: RECONCILE_LAST_KEY }, create: { key: RECONCILE_LAST_KEY, value }, update: { value } })
      .catch((e) => console.error('[wallet] 写 wallet_reconcile_last 失败', e))
  }
  if (!report.ok && opts.alert !== false) {
    const failed = items.filter((i) => !i.ok)
    notify(
      'wallet.alert',
      [
        { label: '对账', value: `W 系列 ${failed.length} 项不一致`, color: 'warning' },
        ...failed.slice(0, 6).map((i) => ({ label: i.code, value: `${i.title}：${i.count} 处；例：${i.samples[0] ?? '—'}` })),
        { label: '负债', value: fmtCents(liability.totalCents) },
      ],
      { link: '/admin/wallet?tab=reconcile', extraTitle: '对账不一致' },
    )
  }
  return report
}

export async function lastReconcileReport(): Promise<ReconcileReport | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: RECONCILE_LAST_KEY } })
    return row?.value ? (JSON.parse(row.value) as ReconcileReport) : null
  } catch {
    return null
  }
}
