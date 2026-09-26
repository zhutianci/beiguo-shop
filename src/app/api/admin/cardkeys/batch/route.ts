export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { syncAutoStock } from '@/lib/cardkey'
import { hasProvider } from '@/lib/redeem/registry'
import { round2 } from '@/lib/money'
import { adminGuard } from '@/lib/admin-guard'

// 卡密批量操作。
// 规则一律在服务端强制（前端隐藏按钮只是提示，不能当作约束）：
//   REUSE / DISABLE / DELETE  仅对 status !== 'USED' 的卡生效，已发出的一律跳过
//   SET_COST                  任意状态可改；若已发出且有售价快照，同步重算 profit
//   SET_PRICE                 仅对 status === 'USED' 的卡生效（未发出的卡没有售价概念）
//   SET_PROVIDER              任意状态可改；它只是路由标注，不影响库存也不影响金额
const batchSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1, '请先选择卡密').max(500, '单次最多操作 500 条'),
    action: z.enum(['REUSE', 'DISABLE', 'DELETE', 'SET_COST', 'SET_PRICE', 'SET_PROVIDER']),
    cost: z.number().min(0, '成本不能为负').max(999999).optional(),
    soldPrice: z.number().min(0, '售价不能为负').max(999999).optional(),
    // 充值系统标识；显式传 null 表示「清空，回到跳转外链的方式」。
    // 用 nullable 而不是把空串当清空：空串和「没传这个字段」在 JSON 里太容易混淆
    redeemProvider: z.string().trim().max(20).nullable().optional(),
  })
  .refine((v) => v.action !== 'SET_COST' || typeof v.cost === 'number', {
    message: '请填写成本',
  })
  .refine((v) => v.action !== 'SET_PRICE' || typeof v.soldPrice === 'number', {
    message: '请填写售价',
  })
  // 注意判的是 undefined 而不是真值：null 是合法入参（清空）
  .refine((v) => v.action !== 'SET_PROVIDER' || v.redeemProvider !== undefined, {
    message: '请选择充值系统',
  })

/** 元 → Decimal(10,2)，统一走 round2 再定点，避免浮点尾差 */
function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(round2(n).toFixed(2))
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = await request.json()
    const parsed = batchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { action, cost, soldPrice, redeemProvider } = parsed.data
    const ids = Array.from(new Set(parsed.data.ids))

    const cards = await prisma.cardKey.findMany({
      where: { id: { in: ids } },
      select: { id: true, productId: true, status: true, cost: true, soldPrice: true, orderId: true },
    })

    const reasons: string[] = []
    let skipped = 0
    const missing = ids.length - cards.length
    if (missing > 0) {
      skipped += missing
      reasons.push(`${missing} 条卡密不存在（可能已被删除）`)
    }
    if (cards.length === 0) return success({ affected: 0, skipped, reasons }, '没有可操作的卡密')

    const productIds = Array.from(new Set(cards.map((c) => c.productId)))
    let affected = 0
    let eligible = 0 // 通过规则筛选、本该被改动的条数（用于兜底对账并发变更）
    let rejectedChannelCardIds: number[] = [] // SET_PRICE 被拒的渠道单卡（W4-9b：拒绝并列出）

    if (action === 'REUSE' || action === 'DISABLE' || action === 'DELETE') {
      const usable = cards.filter((c) => c.status !== 'USED')
      eligible = usable.length
      const blocked = cards.length - usable.length
      if (blocked > 0) {
        skipped += blocked
        reasons.push(`${blocked} 条已发出的卡密不可${action === 'DELETE' ? '删除' : '改状态'}（保留发货记录）`)
      }
      if (usable.length > 0) {
        const usableIds = usable.map((c) => c.id)
        if (action === 'DELETE') {
          const r = await prisma.cardKey.deleteMany({ where: { id: { in: usableIds }, status: { not: 'USED' } } })
          affected = r.count
        } else {
          const r = await prisma.cardKey.updateMany({
            where: { id: { in: usableIds }, status: { not: 'USED' } },
            data: { status: action === 'REUSE' ? 'UNUSED' : 'DISABLED' },
          })
          affected = r.count
        }
      }
    } else if (action === 'SET_COST') {
      eligible = cards.length // 成本任意状态都能改
      const costDec = dec(cost as number)
      // 已发出且有售价快照的卡：利润随成本一起重算（利润是落库列，不能留旧值）
      const recalc = cards.filter((c) => c.status === 'USED' && c.soldPrice != null)
      const plain = cards.filter((c) => !(c.status === 'USED' && c.soldPrice != null))

      if (plain.length > 0) {
        const r = await prisma.cardKey.updateMany({
          where: { id: { in: plain.map((c) => c.id) } },
          data: { cost: costDec },
        })
        affected += r.count
      }
      // 按售价分组批量更新，避免 500 条各发一次 update
      const groups = new Map<number, number[]>()
      for (const c of recalc) {
        const sp = Number(c.soldPrice)
        const arr = groups.get(sp) || []
        arr.push(c.id)
        groups.set(sp, arr)
      }
      for (const [sp, groupIds] of Array.from(groups.entries())) {
        const r = await prisma.cardKey.updateMany({
          where: { id: { in: groupIds } },
          data: { cost: costDec, profit: dec(sp - (cost as number)) },
        })
        affected += r.count
      }
      if (recalc.length > 0) reasons.push(`${recalc.length} 条已发出卡密的利润已按新成本重算`)
    } else if (action === 'SET_PROVIDER') {
      /*
       * 改的是「这批卡该去哪个兑换页」，不是钱也不是状态，所以任意状态都能改：
       * 已发出的卡改了，买家订单页的「去充值」立刻指向站内兑换页；
       * 未发出的卡改了，将来发出去就直接带上。
       *
       * 【必须校验平台存在】这个值决定订单页往哪跳、兑换页找哪个适配器。
       * 写进一个没有适配器的 key，买家点过去就是 404，而且要等投诉才会发现。
       */
      const target = redeemProvider?.trim() || null
      if (target && !hasProvider(target)) return error('所选充值系统不存在，请刷新页面后重试')

      eligible = cards.length
      const targetIds = cards.map((c) => c.id)
      await prisma.cardKey.updateMany({
        where: { id: { in: targetIds } },
        data: { redeemProvider: target },
      })

      /*
       * 【不能拿 updateMany 的 count 当「成功条数」】
       * MySQL 的 UPDATE 返回的是**实际改变的行数**，不是匹配的行数
       * （Prisma 的 MySQL 连接器没有开 CLIENT_FOUND_ROWS）。
       * 而「把已经是 sysa 的卡再设成 sysa」正是这个功能最常见的用法 ——
       * 全选一页时必然有几条本来就对。那些行 count 不计，于是
       * affected < eligible，下面的对账会报「N 条在处理期间状态已变化，未生效」：
       * 一次完全成功的操作被说成失败，还附赠一个编造的并发解释。
       *
       * 改成写完之后数一遍「现在确实是目标值的行」。这个数才是站长要的
       * 「有多少条现在是对的」，而且天然幂等 —— 重复执行结果一样。
       */
      affected = await prisma.cardKey.count({
        where: { id: { in: targetIds }, redeemProvider: target },
      })
      reasons.push(target ? `已标注为站内兑换（${target}）` : '已清空充值系统，恢复为跳转兑换链接')
    } else {
      // SET_PRICE：只有已发出的卡才有售价
      const priceVal = soldPrice as number
      const used = cards.filter((c) => c.status === 'USED')
      const blocked = cards.length - used.length
      if (blocked > 0) {
        skipped += blocked
        reasons.push(`${blocked} 条未发出的卡密没有售价，已跳过`)
      }
      /*
       * 【渠道单的卡拒绝改售价】（设计 8.3、W4-9b）渠道单的单卡售价快照 = 进货价分摊，CardKey.profit 才是站长真实卡差价；
       * 改成别的数会让卡密分析的「按进货价的收入」与渠道账对不上。逐条列出被拒的卡，其余照常处理。
       */
      const oids = Array.from(new Set(used.map((c) => c.orderId).filter((v): v is number => v != null)))
      const chOrders = oids.length ? await prisma.order.findMany({ where: { id: { in: oids }, tenantId: { not: 1 } }, select: { id: true } }) : []
      const chSet = new Set(chOrders.map((o) => o.id))
      const channelCards = used.filter((c) => c.orderId != null && chSet.has(c.orderId))
      const usable = used.filter((c) => !(c.orderId != null && chSet.has(c.orderId)))
      if (channelCards.length) {
        skipped += channelCards.length
        const ids = channelCards.map((c) => c.id)
        rejectedChannelCardIds = ids
        reasons.push(`${channelCards.length} 条是渠道订单的卡（售价按进货价分摊，不能修改），已拒绝：#${ids.slice(0, 50).join('、#')}${ids.length > 50 ? ' 等' : ''}`)
      }
      eligible = usable.length
      // 按成本分组批量更新（成本为空按 0 计）
      const groups = new Map<number, number[]>()
      for (const c of usable) {
        const cs = c.cost != null ? Number(c.cost) : 0
        const arr = groups.get(cs) || []
        arr.push(c.id)
        groups.set(cs, arr)
      }
      for (const [cs, groupIds] of Array.from(groups.entries())) {
        const r = await prisma.cardKey.updateMany({
          where: { id: { in: groupIds }, status: 'USED' },
          data: { soldPrice: dec(priceVal), profit: dec(priceVal - cs) },
        })
        affected += r.count
      }
    }

    /*
     * 兜底对账：并发下有卡在本次筛选之后被领走/删除，就会打不中，这部分算跳过。
     *
     * 【原因文案要分支说】带状态条件的那几支（REUSE/DISABLE/DELETE/SET_PRICE）
     * 确实可能因为卡被领走而打不中；SET_PROVIDER 的 where 里**没有状态条件**，
     * 唯一能让它少掉的只有「行被删了」。两种说法混用会把排查引到错误方向。
     */
    if (affected < eligible) {
      skipped += eligible - affected
      reasons.push(
        action === 'SET_PROVIDER'
          ? `${eligible - affected} 条在处理期间已被删除，未生效`
          : `${eligible - affected} 条在处理期间状态已变化，未生效`
      )
    }

    // 状态变化会影响自动发货商品的库存，涉及到的商品各同步一次。
    // SET_PROVIDER / SET_COST / SET_PRICE 不动状态，库存不可能变，跳过这轮写库
    if (action === 'REUSE' || action === 'DISABLE' || action === 'DELETE') {
      for (const pid of productIds) {
        await syncAutoStock(pid)
      }
    }

    return success(
      { affected, skipped, reasons, ...(rejectedChannelCardIds.length ? { rejectedChannelCardIds } : {}) },
      affected > 0 ? `已处理 ${affected} 条${skipped ? `，跳过 ${skipped} 条` : ''}` : '没有可操作的卡密'
    )
  } catch (err) {
    console.error('Batch cardkeys error:', err)
    return error('批量操作失败')
  }
}
