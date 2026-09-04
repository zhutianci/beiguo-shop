/**
 * 卡密成本/售价/利润回填（一次性，可重复执行）
 *
 * 背景：CardKey 新增了 cost / soldPrice / profit 三列。改造前发出的历史卡这三列都是 NULL，
 * 会让卡密列表显示「未知」、让仪表盘的成本与利润统计漏算。
 *
 * 口径（与 src/lib/vmq.ts 的 allocateCards 保持一致）：
 *   1. 全部卡密 cost 为 NULL 的回填为 0（用户口径：现有卡密成本按 0 计算，从今天起再算利润）
 *   2. status='USED' 且 order_id 非空：
 *        soldPrice = 该订单金额按张数「按分」整数分摊（最后一张吃余数）
 *        profit    = soldPrice - cost
 *   3. status='USED' 且只有 external_ref（外部站发卡）：soldPrice / profit 保持 NULL
 *      —— 那条路径拿不到售价，写 0 会让「利润未知」和「利润为零」不可区分，污染报表
 *   4. UNUSED / DISABLED：soldPrice / profit 保持 NULL
 *
 * 只回填 soldPrice IS NULL 的卡，因此可以重复执行，也不会覆盖管理员在后台手工改过的数据。
 *
 * 执行（生产，容器内）：
 *   docker compose exec -T app npx -y tsx prisma/backfill-cardkey-cost.ts
 * 必须在 prisma db push 加完列之后再跑；先跑会直接报「列不存在」。
 *
 * 加 --dry-run 只统计不写库。
 */
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')
const BATCH = 500

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 把总额按「分」整数分摊成 parts 份，最后一份吃余数，保证 Σ === total */
function splitAmount(total: number, parts: number): number[] {
  if (parts <= 0) return []
  const totalCents = Math.round(total * 100)
  const base = Math.trunc(totalCents / parts)
  const out: number[] = []
  let assigned = 0
  for (let i = 0; i < parts - 1; i++) {
    out.push(base / 100)
    assigned += base
  }
  out.push((totalCents - assigned) / 100)
  return out
}

async function main() {
  console.log(`[backfill] 开始${DRY_RUN ? '（dry-run，不写库）' : ''}`)

  // ---- 步骤 1：cost 为 NULL 的一律回填 0，分批避免大事务把 1.8G 内存的机器打爆 ----
  let costFilled = 0
  for (;;) {
    const rows = await prisma.cardKey.findMany({
      where: { cost: null },
      select: { id: true },
      take: BATCH,
      orderBy: { id: 'asc' },
    })
    if (rows.length === 0) break
    if (!DRY_RUN) {
      await prisma.cardKey.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { cost: new Prisma.Decimal('0.00') },
      })
    }
    costFilled += rows.length
    console.log(`[backfill] cost=0 已回填 ${costFilled}`)
    if (DRY_RUN) break // dry-run 不写库，否则这里会死循环
  }

  // ---- 步骤 2：已发出且挂在本站订单上的卡，按订单金额分摊售价并算利润 ----
  // 按 orderId 分组处理：一次取一批订单，把该订单的全部卡一起算，才能正确分摊。
  let cursor = 0
  let cardsPriced = 0
  let ordersDone = 0
  let skippedNoOrder = 0

  for (;;) {
    // 找出还有「未定价」卡密的订单 id（soldPrice IS NULL 且 order_id 非空）
    const pending = await prisma.cardKey.findMany({
      where: { status: 'USED', orderId: { not: null, gt: cursor }, soldPrice: null },
      select: { orderId: true },
      distinct: ['orderId'],
      orderBy: { orderId: 'asc' },
      take: 50,
    })
    if (pending.length === 0) break

    const orderIds = pending.map((p) => p.orderId as number)
    cursor = orderIds[orderIds.length - 1]

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, amount: true, quantity: true },
    })
    const orderMap = new Map(orders.map((o) => [o.id, o]))

    for (const oid of orderIds) {
      const order = orderMap.get(oid)
      if (!order) {
        // 卡上挂着一个已不存在的订单（历史脏数据）：跳过，保持 NULL 而不是瞎写
        skippedNoOrder++
        continue
      }

      // 该订单的全部已发出卡密，按 id 升序确定分摊顺序（与发卡顺序一致，结果可复现）
      const cards = await prisma.cardKey.findMany({
        where: { orderId: oid, status: 'USED' },
        select: { id: true, cost: true, soldPrice: true },
        orderBy: { id: 'asc' },
      })
      if (cards.length === 0) continue

      // 按订单数量分摊。若实际发出的卡少于 quantity（缺货部分发货），
      // 只给已发出的那几张取前 N 份 —— 剩下的钱对应的卡还没发出，不该凭空计入。
      const parts = Math.max(order.quantity, cards.length)
      const prices = splitAmount(Number(order.amount), parts)

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i]
        if (c.soldPrice != null) continue // 已定价（新逻辑发的卡，或管理员手工改过）→ 不覆盖
        const soldPrice = prices[i] ?? 0
        const cost = Number(c.cost ?? 0)
        if (!DRY_RUN) {
          await prisma.cardKey.update({
            where: { id: c.id },
            data: {
              soldPrice: new Prisma.Decimal(soldPrice.toFixed(2)),
              profit: new Prisma.Decimal(round2(soldPrice - cost).toFixed(2)),
            },
          })
        }
        cardsPriced++
      }
      ordersDone++
    }
    console.log(`[backfill] 已处理订单 ${ordersDone}，定价卡密 ${cardsPriced}`)
    if (DRY_RUN) break
  }

  // ---- 汇总 ----
  const [externalPending, stillNull] = await Promise.all([
    prisma.cardKey.count({ where: { status: 'USED', orderId: null, externalRef: { not: null } } }),
    prisma.cardKey.count({ where: { status: 'USED', soldPrice: null } }),
  ])

  console.log('---------------------------------------------')
  console.log(`[backfill] cost 回填为 0        ：${costFilled} 张`)
  console.log(`[backfill] 已定价（售价/利润）  ：${cardsPriced} 张，涉及订单 ${ordersDone} 笔`)
  console.log(`[backfill] 订单已不存在被跳过   ：${skippedNoOrder} 笔`)
  console.log(`[backfill] 外部站发卡（保持 NULL，利润未知）：${externalPending} 张`)
  console.log(`[backfill] 仍无售价的已发出卡密 ：${stillNull} 张（应等于上一行，否则需人工排查）`)
  console.log(`[backfill] 完成${DRY_RUN ? '（dry-run，未写库）' : ''}`)
}

main()
  .catch((e) => {
    console.error('[backfill] 失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
