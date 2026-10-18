/**
 * 扫码收款的两个渠道（支付宝 / 微信支付）的公共约定。零依赖、纯函数，服务端与浏览器共用。
 *
 * 【数字编号沿用 V免签协议】VmqOrder.type：1 = 微信、2 = 支付宝（历史数据全是 2）。
 * 【两个渠道共用一个金额池】唯一金额（原价 +0.01 递增）按「分」全站唯一，不分渠道（lib/vmq.ts allocateAmount）；
 * 到账也只按金额匹配待支付收款单，不看买家在收银台选的是哪个渠道 —— 渠道只决定显示哪张收款码、
 * 以及付款后流水记成支付宝还是微信（以实际到账的那条通知为准）。
 * 【Payment.payMethod】扫码收款记 ALIPAY 或 WECHAT。凡是「这笔是扫码收来的钱」的判断（钱包对账、接码退款、迟到退入的凭证核对）
 * 都要用 QR_PAY_METHODS / isQrPayMethod，不能只认 ALIPAY。
 */

export type PayChannel = 'alipay' | 'wechat'

export const VMQ_TYPE_WECHAT = 1
export const VMQ_TYPE_ALIPAY = 2

export const PAY_CHANNELS: readonly PayChannel[] = ['alipay', 'wechat']

export const CHANNEL_LABEL: Record<PayChannel, string> = { alipay: '支付宝', wechat: '微信支付' }
/** 「打开 X 扫一扫」里的 App 名 */
export const CHANNEL_APP: Record<PayChannel, string> = { alipay: '支付宝', wechat: '微信' }

export function channelOfType(t: number | null | undefined): PayChannel {
  return t === VMQ_TYPE_WECHAT ? 'wechat' : 'alipay'
}

export function typeOfChannel(c: PayChannel): number {
  return c === 'wechat' ? VMQ_TYPE_WECHAT : VMQ_TYPE_ALIPAY
}

/** 收款单渠道 → 订单 / 流水上记的支付方式 */
export function payMethodOfType(t: number | null | undefined): 'ALIPAY' | 'WECHAT' {
  return t === VMQ_TYPE_WECHAT ? 'WECHAT' : 'ALIPAY'
}

export function parseChannel(v: unknown): PayChannel | null {
  return v === 'alipay' || v === 'wechat' ? v : null
}

/** 扫码收款记的支付方式（Payment.payMethod）。BALANCE 是余额，不在里面 */
export const QR_PAY_METHODS = ['ALIPAY', 'WECHAT'] as const

export function isQrPayMethod(m: unknown): m is 'ALIPAY' | 'WECHAT' {
  return m === 'ALIPAY' || m === 'WECHAT'
}

/** 订单 / 流水上的支付方式中文名（未知的原样返回） */
export function payMethodLabel(m: string | null | undefined): string {
  if (m === 'ALIPAY') return '支付宝'
  if (m === 'WECHAT') return '微信支付'
  if (m === 'BALANCE') return '余额'
  return m || '—'
}
