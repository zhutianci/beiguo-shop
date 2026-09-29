/**
 * 充值页（/wallet/topup）的两个纯判断，零依赖、客户端可 import；scripts/check-wallet-b1.ts 直接测（docs/短信接码-设计.md §1.16、§11 B1 验收）。
 */

/** 自定义金额输入框最多收几个字符（显示用；超长照样判不合法，不截断拼接） */
export const CUSTOM_YUAN_MAX_LEN = 12

/**
 * 自定义金额（整数元）→ 分；不合法返回 null（页面显示「请输入 {min}–{max} 之间的整数金额」、「去支付」置灰）。
 *
 * 【B1 评审修复】原来 onChange 里先 `replace(/[^\d]/g, '')` 再判：「12.5」被删掉小数点变成「125」、「0.5」变成「05」，
 * 都能通过「1–7 位数字 + 上下限」，按钮亮着、金额是买家以为的 10 倍（充值余额不能提现、不能退回支付宝）。
 * 现在输入框保留原文，这里只认「去掉首尾空白后是 1–7 位 ASCII 数字」：带小数点 / 逗号 / 负号 / 全角数字一律不合法，不做任何「修正」。
 */
export function parseCustomYuan(text: string, minCents: number, maxCents: number): number | null {
  const s = String(text ?? '').trim()
  if (!/^\d{1,7}$/.test(s)) return null
  const c = Number(s) * 100
  return Number.isSafeInteger(c) && c >= minCents && c <= maxCents ? c : null
}

/**
 * 下单失败后要不要换一个 clientToken（下一次点「去支付」按新的一笔下单）。
 *
 * 【B1 评审修复】BUSY（发起收款失败）与 OPEN_PAYMENTS（每人待付款收款单已满）时，服务端已经在同一请求里把刚建的充值单关掉了
 * （lib/topup-checkout 的 closeQuietly）。原来只在 CLOSED / PAID 时换 token：买家稍后再点，同一个 token 命中那张已取消的单，
 * 得到「这笔充值已取消，请重新充值」——和上一句「这笔充值没有生成，不用处理」自相矛盾，要点第三次才成。
 * 保留 token 的只有「那张单可能还开着、重试应当复用它」的情况：网络异常 / 5xx（没收到明确答复）、PAID_PENDING（钱已到、正在入账）、
 * 参数类错误（TOO_MANY_PENDING / TERMS / AMOUNT / BAD_REQUEST 根本没建单，换不换都一样，保留）。
 */
export const TOPUP_TOKEN_RESET_CODES: readonly string[] = ['CLOSED', 'PAID', 'BUSY', 'OPEN_PAYMENTS']

export function shouldResetTopupToken(code: unknown): boolean {
  return typeof code === 'string' && TOPUP_TOKEN_RESET_CODES.includes(code)
}
