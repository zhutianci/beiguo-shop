/**
 * 个人信息脱敏。纯函数、不连库，scripts/check-mask.ts 直接断言。
 *
 * 【用在哪】凡是「把别人的订单给另一个人看」的地方：
 *   · 推荐有奖页：推广人看通过自己链接下的单（买家是别人）
 *   · 首页滚动的最近成交（api/orders/recent）
 * 原来这两个函数私有地写在 api/orders/recent/route.ts 里，推荐有奖要用同一套口径，
 * 抽到这里 —— 两处各写一份，迟早一处多露几个字符。
 *
 * 【订单号也要打码】订单号不是秘密（邮件、企业微信里都出现），但它是「下单有奖」
 * 与收银台的查询键。推广人没有任何理由拿到别人订单的完整单号，只给首尾便于和客服对账。
 */

/** 邮箱：保留用户名前 2 位与完整域名 → ab***@qq.com。空值 → 匿名用户 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '匿名用户'
  const at = email.lastIndexOf('@')
  if (at <= 0 || at === email.length - 1) return '匿名用户'
  const name = email.slice(0, at)
  const domain = email.slice(at + 1)
  // 用户名只有 1~2 位时只露 1 位，否则「ab***」等于把整个用户名交出去了
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2)
  return `${visible}***@${domain}`
}

/** 昵称：保留首尾，中间最多 3 个星号 → 张*三、小**明。空值 → '' */
export function maskNickname(nickname: string | null | undefined): string {
  if (!nickname) return ''
  // 按码点切，避免把 emoji / 生僻字的代理对劈成半个字符
  const chars = Array.from(nickname.trim())
  if (chars.length === 0) return ''
  if (chars.length === 1) return chars[0] + '*'
  if (chars.length === 2) return chars[0] + '*'
  return chars[0] + '*'.repeat(Math.min(chars.length - 2, 3)) + chars[chars.length - 1]
}

/**
 * 买家显示名：有昵称用打码昵称，否则用打码邮箱。
 * 昵称常常就是邮箱（注册时没填昵称的人会把邮箱复制进去），这种情况按邮箱规则打码。
 */
export function maskBuyer(u: { nickname?: string | null; email?: string | null } | null | undefined): string {
  if (!u) return '匿名用户'
  const nick = (u.nickname || '').trim()
  if (nick && !nick.includes('@')) return maskNickname(nick)
  if (nick.includes('@')) return maskEmail(nick)
  return maskEmail(u.email)
}

/** 订单号：保留前 8 位日期与末 4 位 → 20260911****09C5。过短的整体打码 */
export function maskOrderNo(orderNo: string | null | undefined): string {
  if (!orderNo) return ''
  if (orderNo.length <= 12) return orderNo.slice(0, 4) + '****'
  return `${orderNo.slice(0, 8)}****${orderNo.slice(-4)}`
}
