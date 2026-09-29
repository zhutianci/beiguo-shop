/**
 * 收银台（`pay/vmq/create`）的接码单分支（docs/短信接码-设计.md §6.6 第 26 条、E26、E32、E63、附录 A）。
 *
 * 组合、支付宝单的第一张收款单已在下单请求里发起；这里只处理 [去支付] 的复用与少数需要重新发起的情况：
 *  · SmsOrder 必须是 PENDING_PAY；余额付清（payMode=BALANCE）的拒绝「该订单已用余额付清」（E32）；
 *  · **复用已有收款单（reusing）不拦**：那张二维码可能已经被扫了；
 *  · **新发起**收款单之前依次复核：① now ≤ quoteExpiresAt，否则按 T4 的 tick 路径关单（含释放预扣），409 QUOTE_EXPIRED；
 *    ② checkSellable（与 T1 同一个函数：停售、下架、disabled、线程与在途号码、上游余额够付本单，在途占用不含本单），不通过同样关单，
 *    409 UNAVAILABLE（余额不够）或 409 HOLD（其余一律）。文案按 payMode 分：有预扣的加「预扣的余额已退回」，纯支付宝单不加（E63）。
 */
import { prisma } from '../db'
import { checkSellable } from './sellable'
import { closePending } from './engine'
import { jnow } from './runtime'

export type SmsPayGate = { ok: true } | { ok: false; status: number; code: string; message: string }

export async function smsCashierGate(orderId: number, reusing: boolean): Promise<SmsPayGate> {
  const so = await prisma.smsOrder.findUnique({ where: { orderId } })
  if (!so) return { ok: false, status: 409, code: 'STATE', message: '订单状态刚刚有变化，请刷新号码页' }
  if (so.payMode === 'BALANCE') return { ok: false, status: 409, code: 'BALANCE_PAID', message: '该订单已用余额付清' }
  if (so.state !== 'PENDING_PAY') return { ok: false, status: 409, code: 'STATE', message: '订单状态刚刚有变化，请刷新号码页' }
  if (reusing) return { ok: true }
  const hold = await prisma.balanceHold.findUnique({ where: { orderId }, select: { state: true } })
  const withHold = !!hold && hold.state === 'HELD'
  const tail = withHold ? '，预扣的余额已退回' : ''
  const closeWith = async (reason: string, code: string, message: string): Promise<SmsPayGate> => {
    const r = await closePending(so, { reason, actor: 'BUYER', actorId: so.userId, invalidate: false })
    if (r === 'CLOSED') return { ok: false, status: 409, code, message }
    if (r === 'PAID_PROCESSING') return { ok: false, status: 409, code: 'PAID_PROCESSING', message: '这笔订单已收到付款，系统正在处理，请稍后刷新号码页' }
    return { ok: false, status: 409, code: 'STATE', message: '暂时不能发起支付，请刷新号码页后再试' }
  }
  if (jnow().getTime() > so.quoteExpiresAt.getTime()) {
    return closeWith('QUOTE_EXPIRED', 'QUOTE_EXPIRED', `报价已过期，请重新下单（价格可能有变化）${tail}`)
  }
  const sell = await checkSellable({ service: so.service, country: so.country, capMicro: so.capMicro, selfSmsOrderId: so.id })
  if (!sell.ok) {
    if (sell.code === 'UNAVAILABLE') return closeWith('UNAVAILABLE', 'UNAVAILABLE', `该服务暂不可购买，订单已关闭${tail}`)
    return closeWith('HOLD', 'HOLD', `该组合暂停销售，订单已关闭${tail}`)
  }
  return { ok: true }
}
