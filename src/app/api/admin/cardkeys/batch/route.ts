export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { syncAutoStock } from '@/lib/cardkey'
import { round2 } from '@/lib/money'

// 卡密批量操作。
// 规则一律在服务端强制（前端隐藏按钮只是提示，不能当作约束）：
//   REUSE / DISABLE / DELETE  仅对 status !== 'USED' 的卡生效，已发出的一律跳过
//   SET_COST                  任意状态可改；若已发出且有售价快照，同步重算 profit
//   SET_PRICE                 仅对 status === 'USED' 的卡生效（未发出的卡没有售价概念）
const batchSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1, '请先选择卡密').max(500, '单次最多操作 500 条'),
    action: z.enum(['REUSE', 'DISABLE', 'DELETE', 'SET_COST', 'SET_PRICE']),
    cost: z.number().min(0, '成本不能为负').max(999999).optional(),
    soldPrice: z.number().min(0, '售价不能为负').max(999999).optional(),
  })
  .refine((v) => v.action !== 'SET_COST' || typeof v.cost === 'number', {
    message: '请填写成本',
  })
  .refine((v) => v.action !== 'SET_PRICE' || typeof v.soldPrice === 'number', {
    message: '请填写售价',
  })

/** 元 → Decimal(10,2)，统一走 round2 再定点，避免浮点尾差 */
function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(round2(n).toFixed(2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = batchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { action, cost, soldPrice } = parsed.data
    const ids = Array.from(new Set(parsed.data.ids))

    const cards = await prisma.cardKey.findMany({
      where: { id: { in: ids } },
      select: { id: true, productId: true, status: true, cost: true, soldPrice: true },
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
    } else {
      // SET_PRICE：只有已发出的卡才有售价
      const priceVal = soldPrice as number
      const usable = cards.filter((c) => c.status === 'USED')
      eligible = usable.length
      const blocked = cards.length - usable.length
      if (blocked > 0) {
        skipped += blocked
        reasons.push(`${blocked} 条未发出的卡密没有售价，已跳过`)
      }
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

    // 兜底对账：并发下有卡在本次筛选之后被领走/删除，updateMany 就打不中，这部分算跳过
    if (affected < eligible) {
      skipped += eligible - affected
      reasons.push(`${eligible - affected} 条在处理期间状态已变化，未生效`)
    }

    // 状态变化会影响自动发货商品的库存，涉及到的商品各同步一次
    for (const pid of productIds) {
      await syncAutoStock(pid)
    }

    return success(
      { affected, skipped, reasons },
      affected > 0 ? `已处理 ${affected} 条${skipped ? `，跳过 ${skipped} 条` : ''}` : '没有可操作的卡密'
    )
  } catch (err) {
    console.error('Batch cardkeys error:', err)
    return error('批量操作失败')
  }
}
