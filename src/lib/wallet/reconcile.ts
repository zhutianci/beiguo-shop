/**
 * 余额总账每日对账（docs/短信接码-设计.md §9.3、§9.4 的 W 系列；cron /api/cron/wallet-reconcile 每天 03:10）。
 *
 * 只读：任何一条不通过都只推 wallet.alert、写 settings.wallet_reconcile_last，**绝不自动改账**
 * （改账绕开 postInTx 与 bizKey，比不一致本身更危险）。
 *
 *   W1 当天（前两天）有流水的用户：users.balance = Σ delta、users.topup_cents = Σ topup_delta_cents；每周日全量（豁免名单除外）
 *   W2 没有任何一格为负（豁免名单除外，报告列出）
 *   W3 预扣 ⇔ hold:/release:/refund: 流水（两格分别同额），并核 §9.3 的预扣等式
 *   W4 CAPTURED / REFUNDED 的预扣 ⇔ 订单 Payment 里 BALANCE 行 = 预扣合计、ALIPAY 行 = amount − 预扣合计
 *   W5 HELD 的预扣：订单 UNPAID 且未取消、持续 ≤ 60 分钟（卡住的预扣）
 *   W6 已付款的 TOPUP 订单 ⇔ 恰好一条 topup:<orderId>，金额 = 让它付款的那张收款单的 reallyPrice
 *   W7 LATEPAY 流水 ⇔ handledAs='LATEPAY' 的待核实条目（B1 起才有数据）：手动的 latepay_trade:<交易号>、自动的 latepay_auto:<收款单号>
 *      恰好一行且指向该条目；closed_while_matching / duplicate_payment 的收款单不是任何订单的付款凭证；OFFLINE / IGNORE 条目豁免、只列数
 *   W8 全站：Σ balance = Σ delta、Σ topup_cents = Σ topup_delta_cents（豁免名单除外）；负债 = 两格合计 + HELD 合计
 *   W9 载体单（TOPUP / SMS_POOL）没有「已付款 + 已取消」这类非法组合；TOPUP 已付款必是 DELIVERED
 *
 * 【一致性快照】全部读取在同一个只读事务里（REPEATABLE READ：第一次读建立快照，之后每条查询看到的是同一时刻的库）。
 * 否则两次读之间提交一笔记账（S2 的 tick 每分钟都在释放、退款），就会误报「预扣是 HELD 却有 release 流水」
 * 「Σ 两格 ≠ Σ 流水」并推 wallet.alert。只读事务不加锁，不挡任何写入。
 * 【范围与内存】（§9.4「覆盖前两天」，1.8G 内存）每天只逐行核近 sinceHours（默认 48）小时有变动的预扣、流水、充值单，
 * 外加全部 HELD 预扣（W5 本来就要全看，数量很少）；全量（每周日、后台「全量跑一次」）才逐行核全部历史。
 * 逐行核对一律按 id 游标分批读（每批 RECONCILE_BATCH 行），不把整张表读进内存。
 * 全站恒等式（W3 的 §9.3 等式、W8）每天都全量核，但用 SQL 聚合在库里算，只回几行。
 *
 * 【豁免名单】§5.6：旧账核对时站长剔除、不补「历史对齐」流水的用户，写在 settings.wallet_reconcile_exempt
 * （{"userIds":[…],"note":"…"}），W1 / W2 / W8 跳过它们并在报告里列出。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify } from '../notify'
import { centsOf, fmtCents } from './buckets'

export const RECONCILE_LAST_KEY = 'wallet_reconcile_last'
export const RECONCILE_EXEMPT_KEY = 'wallet_reconcile_exempt'
/** HELD 预扣的「卡住」阈值（W5）：正常最长约 21 分钟，留足余量 */
export const STUCK_HOLD_MIN = 60
/** 逐行核对每批读多少行（内存上界） */
export const RECONCILE_BATCH = 1000
/** 整个对账在一个只读事务里跑；cron 的 curl --max-time 是 240 秒 */
const RECONCILE_TX_TIMEOUT_MS = 200_000

type Db = Prisma.TransactionClient | typeof prisma

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

export async function readExemptUserIds(db: Db = prisma): Promise<number[]> {
  try {
    const row = await db.setting.findUnique({ where: { key: RECONCILE_EXEMPT_KEY } })
    if (!row?.value) return []
    const v = JSON.parse(row.value) as { userIds?: unknown }
    return Array.isArray(v.userIds) ? v.userIds.map(Number).filter((x) => Number.isSafeInteger(x) && x > 0) : []
  } catch {
    return []
  }
}

/** 负债看板（§7.8、§9.3）：Σ 充值格 + Σ 返现格 + Σ HELD 预扣。W8 与后台概览共用同一个函数 */
export async function liabilityNow(db: Db = prisma) {
  const u = await db.$queryRaw<{ t: unknown; c: unknown }[]>`SELECT COALESCE(SUM(topup_cents),0) AS t, COALESCE(SUM(balance),0) AS c FROM users`
  const h = await db.$queryRaw<{ s: unknown; k: unknown }[]>`SELECT COALESCE(SUM(topup_cents + cash_cents),0) AS s, COUNT(*) AS k FROM balance_holds WHERE state = 'HELD'`
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

/** 按 id 游标分批读：load(afterId, take) 必须按 id 升序返回；每批交给 fn，读完为止 */
async function eachBatch<T extends { id: number }>(load: (afterId: number, take: number) => Promise<T[]>, fn: (rows: T[]) => Promise<void>): Promise<void> {
  let after = 0
  for (;;) {
    const rows = await load(after, RECONCILE_BATCH)
    if (!rows.length) return
    await fn(rows)
    if (rows.length < RECONCILE_BATCH) return
    after = rows[rows.length - 1].id
  }
}

function chunks<T>(arr: T[], size = RECONCILE_BATCH): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

interface Scope {
  now: Date
  since: Date
  sinceHours: number
  full: boolean
}

/** 全部 W 项的读取与核对（在调用方给的只读事务里跑，同一个快照） */
async function collect(tx: Prisma.TransactionClient, s: Scope) {
  const { now, since, sinceHours, full } = s
  const exempt = await readExemptUserIds(tx)
  const exemptSet = new Set(exempt)
  const items: ReconcileItem[] = []
  const exemptNote = (k: number) => (k ? `豁免 ${k} 个用户（${RECONCILE_EXEMPT_KEY}）` : undefined)
  const scopeNote = full ? undefined : `逐行核对近 ${sinceHours} 小时有变动的记录；全量在每周日`

  // ---------- W1：每个用户两格 = 流水之和 ----------
  {
    const rows = full
      ? await tx.$queryRaw<{ id: number; balance: unknown; topup_cents: number; s_cash: unknown; s_topup: unknown }[]>`
          SELECT u.id, u.balance, u.topup_cents, COALESCE(SUM(l.delta),0) AS s_cash, COALESCE(SUM(l.topup_delta_cents),0) AS s_topup
            FROM users u LEFT JOIN balance_logs l ON l.user_id = u.id
           GROUP BY u.id, u.balance, u.topup_cents
          HAVING u.balance <> COALESCE(SUM(l.delta),0) OR u.topup_cents <> COALESCE(SUM(l.topup_delta_cents),0)`
      : await tx.$queryRaw<{ id: number; balance: unknown; topup_cents: number; s_cash: unknown; s_topup: unknown }[]>`
          SELECT u.id, u.balance, u.topup_cents, COALESCE(SUM(l.delta),0) AS s_cash, COALESCE(SUM(l.topup_delta_cents),0) AS s_topup
            FROM users u LEFT JOIN balance_logs l ON l.user_id = u.id
           WHERE u.id IN (SELECT DISTINCT user_id FROM balance_logs WHERE created_at >= ${since})
           GROUP BY u.id, u.balance, u.topup_cents
          HAVING u.balance <> COALESCE(SUM(l.delta),0) OR u.topup_cents <> COALESCE(SUM(l.topup_delta_cents),0)`
    const bad = rows
      .filter((r) => !exemptSet.has(Number(r.id)))
      .map((r) => `用户#${r.id} 返现格 ${fmtCents(centsOf(r.balance))} / 流水 ${fmtCents(centsOf(r.s_cash))}；充值格 ${fmtCents(n(r.topup_cents))} / 流水 ${fmtCents(n(r.s_topup))}`)
    const skipped = rows.filter((r) => exemptSet.has(Number(r.id))).length
    items.push(item('W1', full ? '每个用户两格 = 流水之和（全量）' : `近 ${sinceHours} 小时有流水的用户两格 = 流水之和`, bad, exemptNote(skipped)))
  }

  // ---------- W2：没有负数（豁免名单里的旧账用户只列出，§5.6） ----------
  {
    const rows = await tx.$queryRaw<{ id: number; balance: unknown; topup_cents: number }[]>`
      SELECT id, balance, topup_cents FROM users WHERE balance < 0 OR topup_cents < 0 ORDER BY id LIMIT 500`
    const bad = rows
      .filter((r) => !exemptSet.has(Number(r.id)))
      .map((r) => `用户#${r.id} 返现格 ${fmtCents(centsOf(r.balance))}、充值格 ${fmtCents(n(r.topup_cents))}`)
    items.push(item('W2', '没有任何一格为负', bad, exemptNote(rows.length - bad.length)))
  }

  // ---------- W3 / W4 / W5：预扣（逐行：近 sinceHours 小时有变动的 + 全部 HELD；全量时全部） ----------
  const w3: string[] = []
  const w4: string[] = []
  const w5: string[] = []
  const holdScope: Prisma.BalanceHoldWhereInput = full ? {} : { OR: [{ state: 'HELD' }, { createdAt: { gte: since } }, { updatedAt: { gte: since } }] }
  await eachBatch(
    (after, take) =>
      tx.balanceHold.findMany({
        where: { ...holdScope, id: { gt: after } },
        orderBy: { id: 'asc' },
        take,
        select: { id: true, orderId: true, userId: true, topupCents: true, cashCents: true, state: true, heldAt: true },
      }),
    async (holds) => {
      const keys = holds.flatMap((h) => [`hold:${h.orderId}`, `release:${h.orderId}`, `refund:${h.orderId}`])
      const logs = await tx.balanceLog.findMany({
        where: { bizKey: { in: keys } },
        select: { id: true, type: true, userId: true, bizKey: true, delta: true, topupDeltaCents: true },
      })
      const byKey = new Map(logs.map((l) => [l.bizKey as string, l]))
      // W3 逐行
      for (const h of holds) {
        const hl = byKey.get(`hold:${h.orderId}`)
        if (!hl || hl.type !== 'HOLD') w3.push(`预扣 #${h.id}（订单 #${h.orderId}）没有 hold 流水`)
        else if (hl.topupDeltaCents !== -h.topupCents || centsOf(hl.delta) !== -h.cashCents || hl.userId !== h.userId)
          w3.push(`预扣 #${h.id} 与 hold 流水 #${hl.id} 金额或用户不一致`)
        const rl = byKey.get(`release:${h.orderId}`)
        if (h.state === 'RELEASED') {
          if (!rl || rl.type !== 'RELEASE') w3.push(`已释放的预扣 #${h.id} 没有 release 流水`)
          else if (rl.topupDeltaCents !== h.topupCents || centsOf(rl.delta) !== h.cashCents || rl.userId !== h.userId) w3.push(`预扣 #${h.id} 与 release 流水 #${rl.id} 金额不一致`)
        } else if (rl) w3.push(`预扣 #${h.id} 是 ${h.state}，却有 release 流水 #${rl.id}`)
        const fl = byKey.get(`refund:${h.orderId}`)
        if (h.state === 'REFUNDED') {
          if (!fl || fl.type !== 'REFUND') w3.push(`已退款的预扣 #${h.id} 没有 refund 流水`)
          else if (centsOf(fl.delta) !== h.cashCents || fl.topupDeltaCents < h.topupCents || fl.userId !== h.userId) w3.push(`预扣 #${h.id} 与 refund 流水 #${fl.id} 的余额部分不一致`)
        } else if (fl) w3.push(`预扣 #${h.id} 是 ${h.state}，却有 refund 流水 #${fl.id}`)
      }
      // W4：已确认 / 已退款的预扣 ⇔ 订单支付流水拆分
      const settled = holds.filter((h) => h.state === 'CAPTURED' || h.state === 'REFUNDED')
      if (settled.length) {
        const orders = await tx.order.findMany({
          where: { id: { in: settled.map((h) => h.orderId) } },
          select: { id: true, amount: true, payments: { select: { payMethod: true, amount: true } } },
        })
        const om = new Map(orders.map((o) => [o.id, o]))
        for (const h of settled) {
          const o = om.get(h.orderId)
          if (!o) {
            w4.push(`预扣 #${h.id} 的订单 #${h.orderId} 不存在`)
            continue
          }
          const hc = h.topupCents + h.cashCents
          const bal = o.payments.filter((p) => p.payMethod === 'BALANCE').map((p) => centsOf(p.amount))
          const ali = o.payments.filter((p) => p.payMethod === 'ALIPAY').reduce((a, p) => a + centsOf(p.amount), 0)
          const rest = centsOf(o.amount) - hc
          if (bal.length !== 1 || bal[0] !== hc) w4.push(`订单 #${o.id} 的 BALANCE 支付行应为 1 行 ${fmtCents(hc)}`)
          if (ali !== Math.max(rest, 0)) w4.push(`订单 #${o.id} 的 ALIPAY 支付行应合计 ${fmtCents(Math.max(rest, 0))}，实际 ${fmtCents(ali)}`)
        }
      }
      // W5：HELD 的预扣
      const held = holds.filter((h) => h.state === 'HELD')
      if (held.length) {
        const orders = await tx.order.findMany({ where: { id: { in: held.map((h) => h.orderId) } }, select: { id: true, payStatus: true, deliveryStatus: true } })
        const om = new Map(orders.map((o) => [o.id, o]))
        for (const h of held) {
          const o = om.get(h.orderId)
          const mins = Math.round(Math.abs(now.getTime() - h.heldAt.getTime()) / 60_000)
          if (!o || o.payStatus !== 'UNPAID' || o.deliveryStatus === 'CANCELLED') w5.push(`预扣 #${h.id} 仍是 HELD，但订单 #${h.orderId} 是 ${o ? `${o.payStatus}/${o.deliveryStatus}` : '不存在'}`)
          else if (mins > STUCK_HOLD_MIN) w5.push(`预扣 #${h.id}（订单 #${h.orderId}）已持续 ${mins} 分钟（卡住）`)
        }
      }
    },
  )
  // W3 反向：hold / release 流水必须有对应的预扣行（逐行：近 sinceHours 小时的流水；全量时全部）
  await eachBatch(
    (after, take) =>
      tx.balanceLog.findMany({
        where: { type: { in: ['HOLD', 'RELEASE', 'REFUND'] }, ...(full ? {} : { createdAt: { gte: since } }), id: { gt: after } },
        orderBy: { id: 'asc' },
        take,
        select: { id: true, type: true, orderId: true, bizKey: true },
      }),
    async (logs) => {
      const prefixOf = (t: string) => (t === 'HOLD' ? 'hold:' : t === 'RELEASE' ? 'release:' : 'refund:')
      const oids = Array.from(new Set(logs.map((l) => keyOrderId(l.bizKey, prefixOf(l.type))).filter((x): x is number => !!x)))
      const hs = oids.length ? await tx.balanceHold.findMany({ where: { orderId: { in: oids } }, select: { orderId: true, state: true } }) : []
      const hm = new Map(hs.map((h) => [h.orderId, h]))
      for (const l of logs) {
        const oid = keyOrderId(l.bizKey, prefixOf(l.type))
        if (l.type === 'HOLD' && (!oid || !hm.has(oid))) w3.push(`hold 流水 #${l.id} 没有对应的预扣行`)
        if (l.type === 'RELEASE' && (!oid || hm.get(oid)?.state !== 'RELEASED')) w3.push(`release 流水 #${l.id} 没有对应的已释放预扣`)
        if (oid && l.orderId !== oid) w3.push(`流水 #${l.id} 的 orderId 与 bizKey 不一致`)
      }
    },
  )
  // §9.3 预扣等式（每一格分别成立，全量、SQL 聚合）：Σ HOLD 流水 = Σ 全部预扣行；Σ RELEASE 流水 = Σ RELEASED 预扣行。
  // 再加上逐行核过的「REFUND 流水的余额部分 = REFUNDED 预扣行」，就得出 Σ HOLD − Σ RELEASE − Σ REFUND 的余额部分 = Σ（HELD + CAPTURED）
  {
    const logSums = await tx.$queryRaw<{ type: string; t: unknown; c: unknown }[]>`
      SELECT type, COALESCE(SUM(topup_delta_cents),0) AS t, COALESCE(SUM(delta),0) AS c FROM balance_logs WHERE type IN ('HOLD','RELEASE') GROUP BY type`
    const holdSums = await tx.$queryRaw<{ state: string; t: unknown; c: unknown }[]>`
      SELECT state, COALESCE(SUM(topup_cents),0) AS t, COALESCE(SUM(cash_cents),0) AS c FROM balance_holds GROUP BY state`
    const logOf = (type: string): [number, number] => {
      const r = logSums.find((x) => x.type === type)
      return r ? [n(r.t), centsOf(r.c)] : [0, 0]
    }
    const holdOf = (states: string[]): [number, number] =>
      holdSums.filter((x) => states.includes(x.state)).reduce<[number, number]>((a, x) => [a[0] + n(x.t), a[1] + n(x.c)], [0, 0])
    const [hT, hC] = logOf('HOLD')
    const [rT, rC] = logOf('RELEASE')
    const all = holdOf(['HELD', 'CAPTURED', 'RELEASED', 'REFUNDED'])
    const rel = holdOf(['RELEASED'])
    const bucket = ['充值格', '返现格']
    ;[-hT, -hC].forEach((v, k) => {
      if (v !== all[k]) w3.push(`预扣等式：Σ HOLD 流水（${bucket[k]}）${fmtCents(v)} ≠ Σ 全部预扣行 ${fmtCents(all[k])}`)
    })
    ;[rT, rC].forEach((v, k) => {
      if (v !== rel[k]) w3.push(`预扣等式：Σ RELEASE 流水（${bucket[k]}）${fmtCents(v)} ≠ Σ 已释放预扣行 ${fmtCents(rel[k])}`)
    })
  }
  items.push(item('W3', '预扣 ⇔ hold / release / refund 流水（含 §9.3 预扣等式）', w3, scopeNote))
  items.push(item('W4', '已确认的预扣 ⇔ 订单支付流水拆分', w4, scopeNote))
  items.push(item('W5', `HELD 预扣：订单待支付且持续 ≤ ${STUCK_HOLD_MIN} 分钟`, w5))

  // ---------- W6：充值单 ⇔ topup 流水（逐行：近 sinceHours 小时付款或变动的充值单、近 sinceHours 小时的 TOPUP 流水） ----------
  {
    const bad: string[] = []
    const paidWhere: Prisma.OrderWhereInput = {
      product: { deliveryType: 'TOPUP' },
      payStatus: { in: ['PAID', 'REFUNDED'] },
      ...(full ? {} : { OR: [{ paidAt: { gte: since } }, { updatedAt: { gte: since } }] }),
    }
    await eachBatch(
      (after, take) =>
        tx.order.findMany({
          where: { ...paidWhere, id: { gt: after } },
          orderBy: { id: 'asc' },
          take,
          select: { id: true, payments: { select: { payMethod: true, tradeNo: true } } },
        }),
      async (paid) => {
        const logs = await tx.balanceLog.findMany({
          where: { bizKey: { in: paid.map((o) => `topup:${o.id}`) } },
          select: { id: true, type: true, bizKey: true, topupDeltaCents: true, delta: true },
        })
        const lm = new Map(logs.map((l) => [l.bizKey as string, l]))
        const tradeNos = paid.flatMap((o) => o.payments.filter((p) => p.payMethod === 'ALIPAY' && p.tradeNo).map((p) => p.tradeNo as string))
        const vmqs = tradeNos.length ? await tx.vmqOrder.findMany({ where: { orderId: { in: tradeNos } }, select: { orderId: true, reallyPrice: true, state: true, bizId: true } }) : []
        const vm = new Map(vmqs.map((v) => [v.orderId, v]))
        for (const o of paid) {
          const l = lm.get(`topup:${o.id}`)
          if (!l || l.type !== 'TOPUP') {
            bad.push(`充值单 #${o.id} 没有 topup 流水`)
            continue
          }
          const ali = o.payments.filter((p) => p.payMethod === 'ALIPAY' && p.tradeNo)
          const v = ali.length === 1 ? vm.get(ali[0].tradeNo as string) : undefined
          if (!v || v.state !== 1 || v.bizId !== o.id) bad.push(`充值单 #${o.id} 找不到让它付款的收款单（ALIPAY 行 tradeNo）`)
          else if (l.topupDeltaCents !== centsOf(v.reallyPrice) || centsOf(l.delta) !== 0) bad.push(`充值单 #${o.id} 入账 ${fmtCents(l.topupDeltaCents)} ≠ 实付 ${fmtCents(centsOf(v.reallyPrice))}`)
        }
      },
    )
    await eachBatch(
      (after, take) =>
        tx.balanceLog.findMany({
          where: { type: 'TOPUP', ...(full ? {} : { createdAt: { gte: since } }), id: { gt: after } },
          orderBy: { id: 'asc' },
          take,
          select: { id: true, bizKey: true },
        }),
      async (logs) => {
        const oids: number[] = []
        for (const l of logs) {
          const oid = keyOrderId(l.bizKey, 'topup:')
          if (!oid) bad.push(`TOPUP 流水 #${l.id} 的 bizKey 不合法`)
          else oids.push(oid)
        }
        const ok = oids.length
          ? await tx.order.findMany({ where: { id: { in: oids }, product: { deliveryType: 'TOPUP' }, payStatus: { in: ['PAID', 'REFUNDED'] } }, select: { id: true } })
          : []
        const okSet = new Set(ok.map((o) => o.id))
        for (const l of logs) {
          const oid = keyOrderId(l.bizKey, 'topup:')
          if (oid && !okSet.has(oid)) bad.push(`topup 流水 #${l.id} 对应的订单 #${oid} 不是已付款的充值单`)
        }
      },
    )
    items.push(item('W6', '已付款充值单 ⇔ topup 流水（金额 = 实付）', bad, scopeNote))
  }

  // ---------- W7：LATEPAY ⇔ 已处理为 LATEPAY 的待核实条目（B1 起才有数据；条目本身很少，全量读） ----------
  {
    const bad: string[] = []
    const entries = await tx.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' }, value: { contains: '"handledAs":"LATEPAY"' } }, select: { key: true, value: true } })
    const entryKeys = new Set(entries.map((e) => e.key))
    const logByKey = new Map<string, { id: number; orderId: number | null; topupDeltaCents: number }>()
    for (const part of chunks(entries.map((e) => `latepay:${e.key}`))) {
      const ls = await tx.balanceLog.findMany({ where: { bizKey: { in: part } }, select: { id: true, orderId: true, bizKey: true, topupDeltaCents: true } })
      for (const l of ls) logByKey.set(l.bizKey as string, l)
    }
    // 手动退入：占位行 latepay_trade:<交易号> 恰好一行、指向本条目；自动退入：latepay_auto:<收款单号> 恰好一行、指向本条目（B1）
    const marks: { key: string; entry: string; kind: string }[] = []
    // closed_while_matching / duplicate_payment 的收款单不能是任何订单 ALIPAY 支付流水的 tradeNo（maybe_duplicate、no_pending_match 不查）
    const voucherChecks: { entry: string; vmqOrderId: string }[] = []
    for (const e of entries) {
      const l = logByKey.get(`latepay:${e.key}`)
      let v: { price?: string; orderId?: number; tradeNo?: string; auto?: boolean; reason?: string; vmqOrderId?: string; latepayVmq?: string } = {}
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
      let price = NaN
      try {
        price = centsOf(v.price ?? '0')
      } catch {
        /* 金额坏了按不一致报 */
      }
      if (l.topupDeltaCents !== price) bad.push(`条目 ${e.key} 的实收与流水 #${l.id} 金额不一致`)
      if (v.tradeNo) marks.push({ key: `latepay_trade:${v.tradeNo}`, entry: e.key, kind: '手动退入' })
      else if (v.auto) {
        if (!v.latepayVmq) bad.push(`自动退入的条目 ${e.key} 没有记收款单号`)
        else marks.push({ key: `latepay_auto:${v.latepayVmq}`, entry: e.key, kind: '自动退入' })
      } else bad.push(`条目 ${e.key} 既没有交易号也不是自动退入`)
      if ((v.reason === 'closed_while_matching' || v.reason === 'duplicate_payment') && v.vmqOrderId) voucherChecks.push({ entry: e.key, vmqOrderId: v.vmqOrderId })
    }
    for (const part of chunks(marks)) {
      const found = await tx.setting.findMany({ where: { key: { in: part.map((m) => m.key) } }, select: { key: true, value: true } })
      const fm = new Map(found.map((f) => [f.key, f.value]))
      for (const m of part) {
        const val = fm.get(m.key)
        // 占位行的 value 是条目 key（latepay.creditInTx 写的）；也认 {"entryKey": …} 的写法
        let target = val
        if (val && val.startsWith('{')) {
          try {
            target = String((JSON.parse(val) as { entryKey?: unknown }).entryKey ?? '')
          } catch {
            target = val
          }
        }
        if (val === undefined) bad.push(`${m.kind}缺少占位行 ${m.key}`)
        else if (target !== m.entry) bad.push(`${m.kind}占位行 ${m.key} 指向的不是条目 ${m.entry}`)
      }
    }
    for (const part of chunks(voucherChecks)) {
      const pays = await tx.payment.findMany({ where: { payMethod: 'ALIPAY', tradeNo: { in: part.map((x) => x.vmqOrderId) } }, select: { orderId: true, tradeNo: true } })
      const used = new Set(pays.map((p) => p.tradeNo))
      for (const x of part) if (used.has(x.vmqOrderId)) bad.push(`条目 ${x.entry} 的收款单 ${x.vmqOrderId} 是订单的付款凭证，却又退入了余额`)
    }
    // 同一张收款单的自动退入不超过一次（占位行按 key 唯一，这里再核一遍条目侧）
    {
      const seen = new Map<string, string>()
      for (const m of marks) {
        if (m.kind !== '自动退入') continue
        const prev = seen.get(m.key)
        if (prev) bad.push(`收款单 ${m.key.slice('latepay_auto:'.length)} 被自动退入了两次（条目 ${prev}、${m.entry}）`)
        else seen.set(m.key, m.entry)
      }
    }
    const exemptOther = await tx.setting.count({
      where: { key: { startsWith: 'vmq_unmatched:' }, OR: [{ value: { contains: '"handledAs":"OFFLINE"' } }, { value: { contains: '"handledAs":"IGNORE"' } }] },
    })
    await eachBatch(
      (after, take) =>
        tx.balanceLog.findMany({
          where: { type: 'LATEPAY', ...(full ? {} : { createdAt: { gte: since } }), id: { gt: after } },
          orderBy: { id: 'asc' },
          take,
          select: { id: true, bizKey: true },
        }),
      async (logs) => {
        for (const l of logs) {
          const key = l.bizKey?.startsWith('latepay:') ? l.bizKey.slice('latepay:'.length) : ''
          if (!entryKeys.has(key)) bad.push(`LATEPAY 流水 #${l.id} 没有对应的已处理条目`)
        }
      },
    )
    items.push(item('W7', 'LATEPAY 流水 ⇔ 已处理的待核实条目', bad, exemptOther ? `标为「线下已原路退回 / 核实不是新到账」的载体单条目 ${exemptOther} 条（豁免，只列出）` : undefined))
  }

  // ---------- W8：全站两格 = 流水之和；负债（同一快照、SQL 聚合） ----------
  const liability = await liabilityNow(tx)
  {
    const bad: string[] = []
    const ex = exempt.length ? Prisma.sql`WHERE id NOT IN (${Prisma.join(exempt)})` : Prisma.empty
    const exL = exempt.length ? Prisma.sql`WHERE user_id NOT IN (${Prisma.join(exempt)})` : Prisma.empty
    const u = await tx.$queryRaw<{ t: unknown; c: unknown }[]>`SELECT COALESCE(SUM(topup_cents),0) AS t, COALESCE(SUM(balance),0) AS c FROM users ${ex}`
    const l = await tx.$queryRaw<{ t: unknown; c: unknown }[]>`SELECT COALESCE(SUM(topup_delta_cents),0) AS t, COALESCE(SUM(delta),0) AS c FROM balance_logs ${exL}`
    if (n(u[0]?.t) !== n(l[0]?.t)) bad.push(`Σ 充值格 ${fmtCents(n(u[0]?.t))} ≠ Σ 流水 ${fmtCents(n(l[0]?.t))}`)
    if (centsOf(u[0]?.c ?? 0) !== centsOf(l[0]?.c ?? 0)) bad.push(`Σ 返现格 ${fmtCents(centsOf(u[0]?.c ?? 0))} ≠ Σ 流水 ${fmtCents(centsOf(l[0]?.c ?? 0))}`)
    items.push(item('W8', `全站两格 = 流水之和；负债 ${fmtCents(liability.totalCents)}`, bad, exemptNote(exempt.length)))
  }

  // ---------- W9：载体单的状态组合 ----------
  {
    const rows = await tx.order.findMany({
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
    // S2：联查 sms_orders（B0 实施偏差「联查 sms_orders 的部分留给 S2」）——已付款、接码单非终态的必是 PROCESSING 或 DELIVERED；
    // 收过码（RECEIVED / FINISHED）的必是 DELIVERED（发现被事务后那句无条件 PROCESSING 覆盖回去的即报，§6.6 第 10 条）
    const sms = await tx.$queryRaw<{ id: number; delivery_status: string; state: string }[]>`
      SELECT o.id, o.delivery_status, s.state FROM orders o JOIN sms_orders s ON s.order_id = o.id
       WHERE o.pay_status = 'PAID'
         AND ((s.state IN ('READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'REFUNDING', 'RECEIVED', 'MANUAL') AND o.delivery_status NOT IN ('PROCESSING', 'DELIVERED'))
           OR (s.state IN ('RECEIVED', 'FINISHED') AND o.delivery_status <> 'DELIVERED'))
       LIMIT 100`
    const bad9 = rows.map((o) => `${o.product.deliveryType} 订单 #${o.id}：${o.payStatus}/${o.deliveryStatus}`)
    for (const r of sms) bad9.push(`SMS_POOL 订单 #${Number(r.id)}：PAID/${r.delivery_status}，接码单 ${r.state}`)
    items.push(item('W9', '载体单（充值 / 接码）的付款与交付状态组合合法', bad9))
  }

  return { items, liability, exempt }
}

export async function runWalletReconcile(opts: { full?: boolean; sinceHours?: number; now?: Date; alert?: boolean; save?: boolean } = {}): Promise<ReconcileReport> {
  const now = opts.now ?? new Date()
  const sinceHours = opts.sinceHours ?? 48
  const since = new Date(now.getTime() - sinceHours * 3600_000)
  const full = !!opts.full

  // 一个只读事务 = 一个一致性快照（RR：第一次读建立快照）。不加锁，不挡写入
  const { items, liability, exempt } = await prisma.$transaction((tx) => collect(tx, { now, since, sinceHours, full }), {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    timeout: RECONCILE_TX_TIMEOUT_MS,
    maxWait: 10_000,
  })

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
