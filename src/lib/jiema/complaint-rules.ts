/**
 * 短信接码 · 售后申请的纯函数（docs/短信接码-设计.md E17、§1.10、§6.4、§7.5、§8.2）。
 *
 * 【零依赖、客户端能 import】号码页的申请弹窗、买家接口、后台列表、scripts/check-jiema-s3.ts 共用同一套判定与文案，
 * 免得「能不能申请」「号码不支持再次收码的不计入次数」在页面、接口、后台三处各写一套、口径对不上。
 *
 * 规则（E17）：
 *  · 只对**收到过短信**的单（RECEIVED / FINISHED，退款状态 NONE）受理；没收到短信的单本来就整单自动退回余额，不需要售后；
 *  · 收码后 complaintWindowH（sms_config，出厂 24）小时内可以提交；每单最多一条（sms_complaints.order_id 唯一）；
 *  · 人工审核：通过 = T16 整单原路退回余额（我方承担成本，成本照计）；驳回 = 必填回复，自动发到订单留言；
 *  · 同一用户 30 天内通过 2 次以内正常受理，超出的人工酌情（后台显示这个计数）；**号码不支持再次收码（canGetAnotherSms=false）的不计入**。
 *  · 截图请通过微信客服发送（订单留言本期不支持传图）。
 */

/** 原因（买家单选，只做统计与审核参考；§5.2 的四个值） */
export const COMPLAINT_REASONS: ReadonlyArray<readonly [code: string, label: string]> = Object.freeze([
  ['CODE_INVALID', '验证码无效或提示错误'],
  ['ALREADY_USED', '号码已被注册 / 要求二次验证'],
  ['NO_SMS', '重新发送后没收到新验证码'],
  ['OTHER', '其他'],
] as const)

export type ComplaintReason = 'CODE_INVALID' | 'ALREADY_USED' | 'NO_SMS' | 'OTHER'

export function isComplaintReason(x: unknown): x is ComplaintReason {
  return typeof x === 'string' && COMPLAINT_REASONS.some(([k]) => k === x)
}

export function complaintReasonText(code: string | null | undefined): string {
  return COMPLAINT_REASONS.find(([k]) => k === code)?.[1] ?? '其他'
}

/** 买家说明的上限（sms_complaints.detail VARCHAR(500)） */
export const COMPLAINT_DETAIL_MAX = 500
/** 驳回回复 / 通过备注的上限（sms_complaints.admin_note VARCHAR(500)） */
export const COMPLAINT_NOTE_MAX = 500
/** 30 天内正常受理的通过次数（超出的由人工酌情，后台显示计数；只提示，不拦） */
export const COMPLAINT_PASS_LIMIT = 2
export const COMPLAINT_PASS_WINDOW_MS = 30 * 86400_000
/** 上游允许对「号码已被注册、要求 2FA」这类供应商侧问题在 7 天内申诉退款（调研 §2；只给站长看，§7.5） */
export const UPSTREAM_APPEAL_DAYS = 7

/** 售后申请截止时刻 = 首次收码 + windowH 小时 */
export function complaintDeadline(firstCodeAt: Date, windowH: number): Date {
  return new Date(firstCodeAt.getTime() + Math.max(1, Math.trunc(windowH)) * 3600_000)
}

export type ComplaintBlockCode = 'EXISTS' | 'STATE' | 'NO_CODE' | 'EXPIRED' | 'NOT_PAID'

/**
 * 能不能提交售后申请（null = 可以）。服务端在事务里锁住接码单行后再判一次（与 T16 的退款互斥），号码页的按钮也按它显示。
 * 文案直接给买家看（不出现上游名称）。
 */
export function complaintBlock(p: {
  state: string
  refundState: string
  firstCodeAt: Date | null
  now: Date
  windowH: number
  hasComplaint: boolean
  orderPaid: boolean
}): { code: ComplaintBlockCode; message: string } | null {
  if (p.hasComplaint) return { code: 'EXISTS', message: '这张订单已经申请过售后，结果会在订单留言里告诉你' }
  if (p.state === 'CANCELLED' || p.state === 'REFUNDING' || p.state === 'CANCELLING') {
    return { code: 'NO_CODE', message: '没收到短信的订单会整单自动退回余额，不需要申请售后' }
  }
  if (p.state === 'REFUNDED' || p.refundState !== 'NONE') return { code: 'STATE', message: '这张订单已经退款，不能再申请售后' }
  if (p.state !== 'RECEIVED' && p.state !== 'FINISHED') return { code: 'STATE', message: '只有收到短信的订单可以申请售后；其他问题请联系客服' }
  if (!p.orderPaid) return { code: 'NOT_PAID', message: '订单状态异常，请联系客服' }
  if (!p.firstCodeAt) return { code: 'NO_CODE', message: '只有收到短信的订单可以申请售后；其他问题请联系客服' }
  const end = complaintDeadline(p.firstCodeAt, p.windowH)
  if (p.now.getTime() > end.getTime()) {
    return { code: 'EXPIRED', message: `已超过收码后 ${Math.max(1, Math.trunc(p.windowH))} 小时的售后申请期限；有疑问请联系客服` }
  }
  return null
}

/** 买家看到的售后状态：APPROVING（管理员正在退款）对买家就是「处理中」 */
export function buyerComplaintState(state: string): 'OPEN' | 'REFUNDED' | 'REJECTED' {
  if (state === 'REFUNDED') return 'REFUNDED'
  if (state === 'REJECTED') return 'REJECTED'
  return 'OPEN'
}

/** 后台「待处理」包含 APPROVING（点了通过、退款还没做完，需要再点一次或等它结束） */
export const COMPLAINT_PENDING_STATES: readonly string[] = Object.freeze(['OPEN', 'APPROVING'])

/**
 * 这一单的号码是不是「不支持再次收码」（E17：放宽受理、不计入 30 天 2 次）：收到过短信的号里有一个上游明确给了 canGetAnotherSms=false。
 * 取号返回 null（上游没给）的不算，照常计数。
 */
export function complaintNoResend(attempts: ReadonlyArray<{ smsCount: number; state: string; codeAt?: Date | null; canGetAnotherSms: boolean | null }>): boolean {
  return attempts.some((a) => (a.smsCount > 0 || a.codeAt != null || a.state === 'RECEIVED' || a.state === 'FINISHED') && a.canGetAnotherSms === false)
}

/** 30 天内已通过的次数（号码不支持再次收码的不计入，E17） */
export function passedCount30d(rows: ReadonlyArray<{ state: string; handledAt: Date | null; noResend: boolean }>, now: Date): number {
  const since = now.getTime() - COMPLAINT_PASS_WINDOW_MS
  return rows.filter((r) => r.state === 'REFUNDED' && r.handledAt != null && r.handledAt.getTime() >= since && !r.noResend).length
}

/** ¥x.xx（零依赖，与 pricing.fmtYuan 同一写法） */
function yuan(cents: number): string {
  const c = Math.max(0, Math.trunc(cents))
  return `¥${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`
}

/** 通过后写给买家的订单留言（与号码页「已退款 · 已退回余额」卡片同一口径：退回余额、不能提现、不退回支付宝） */
export function approveMessageText(topupCents: number, cashCents: number, note: string | null | undefined): string {
  const parts = [topupCents > 0 ? `充值余额 +${yuan(topupCents)}` : null, cashCents > 0 ? `返现余额 +${yuan(cashCents)}` : null].filter(Boolean)
  const head = `售后审核通过：本单实付 ${yuan(topupCents + cashCents)} 已整单退回你的余额${parts.length ? `（${parts.join(' · ')}）` : ''}，下次购买可直接抵扣（目前可用于短信接码）；退回的余额不能提现、不退回支付宝。`
  const n = (note ?? '').trim()
  return n ? `${head}\n客服备注：${n.slice(0, COMPLAINT_NOTE_MAX)}` : head
}

/** 驳回后写给买家的订单留言（回复必填） */
export function rejectMessageText(reply: string): string {
  return `售后申请未通过：${reply.trim().slice(0, COMPLAINT_NOTE_MAX)}\n如有疑问可以直接在这里回复，或加微信客服（截图请用微信发送）。`
}

/** 上游申诉截止（取号时刻 + 7 天；只给站长看） */
export function upstreamAppealDeadline(boughtAt: Date): Date {
  return new Date(boughtAt.getTime() + UPSTREAM_APPEAL_DAYS * 86400_000)
}
