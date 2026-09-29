/**
 * 订单应付的统一函数（docs/短信接码-设计.md §6.6 第 11 条、附录 B 第 24 条）：
 *
 *   payableCents = amount + invoiceTaxFee − HELD 预扣合计
 *
 * 收款单（收银台）收的永远是它。createOrGetVmqOrder 的锁内复核、pay/vmq/create、后台改单后的收款单金额对齐都用这一个函数，
 * 免得各处各算一套——组合单（余额预扣 + 支付宝）要是有一处按 amount 全额算，就会把收款单改成全额、让买家多付一遍预扣的钱。
 * **没有预扣行时与改造前逐字等价**（amount + invoiceTaxFee，按分算）。
 *
 * Order.amount 永远不含税（税费单独一列），这里只是把两列按分相加，不改任何列。
 * 叶子模块：只依赖 Prisma 类型与 wallet/buckets 的纯函数，不 import vmq / jiema。
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { centsOf } from './wallet/buckets'

type Db = Prisma.TransactionClient | PrismaClient

/** 纯函数：给定订单两列与 HELD 预扣合计（分），算应付（分）。不会小于 0 */
export function payableFrom(o: { amount: unknown; invoiceTaxFee: unknown }, heldCents: number): number {
  const v = centsOf(o.amount) + centsOf(o.invoiceTaxFee ?? 0) - Math.max(0, heldCents)
  return Math.max(0, v)
}

/**
 * 读库算应付（分）。订单不存在返回 null。在事务里调用时读的是事务内看到的订单与预扣行
 * （createOrGetVmqOrder 已先锁订单行；预扣行只由下单事务为它自己新建的订单插入，同订单行一起提交）。
 */
export async function payableCents(db: Db, orderId: number): Promise<number | null> {
  const o = await db.order.findUnique({ where: { id: orderId }, select: { amount: true, invoiceTaxFee: true } })
  if (!o) return null
  const h = await db.balanceHold.findUnique({ where: { orderId }, select: { topupCents: true, cashCents: true, state: true } })
  const held = h && h.state === 'HELD' ? h.topupCents + h.cashCents : 0
  return payableFrom(o, held)
}
