// 到期提醒核心逻辑：筛选即将到期订单、解析联系人、发送邮件/短信、记录日志、更新提醒状态
import { prisma } from './db'
import { sendDirectMail, sendSms } from './aliyun'
import type { ExternalOrder } from '@prisma/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
const SERVICE_WECHAT = 'GenuineMarxist'
export const REMIND_WITHIN_DAYS = 7

export interface ResolvedContact {
  email: string | null
  phone: string | null
  notifyEmail: boolean
  notifyPhone: boolean
  isDefault: boolean // true 表示用户未填写，使用默认（邮箱=账户邮箱）
}

// 以 UTC 计算的“今天 00:00” 毫秒数（expireDate 为 @db.Date，Prisma 返回 UTC 零点）
function todayUtcMs(): number {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

function dateUtcMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function daysUntilExpire(expire: Date): number {
  return Math.round((dateUtcMs(expire) - todayUtcMs()) / 86400000)
}

export function isSameUtcDate(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return dateUtcMs(a) === dateUtcMs(b)
}

export function formatDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 解析某账户的联系方式（无记录时返回默认：邮箱=账户邮箱）
export function resolveContact(
  claudeAccount: string,
  contact: {
    email: string | null
    phone: string | null
    notifyEmail: boolean
    notifyPhone: boolean
  } | null
): ResolvedContact {
  if (!contact) {
    return {
      email: claudeAccount,
      phone: null,
      notifyEmail: true,
      notifyPhone: false,
      isDefault: true,
    }
  }
  return {
    email: contact.email || claudeAccount,
    phone: contact.phone,
    notifyEmail: contact.notifyEmail,
    notifyPhone: contact.notifyPhone,
    isDefault: false,
  }
}

function buildEmail(order: ExternalOrder): { subject: string; html: string } {
  const days = daysUntilExpire(order.expireDate)
  const expStr = formatDate(order.expireDate)
  const expired = days < 0
  const subject = expired
    ? `【贝果科技】你的 ${order.subscriptionType} 已过期 ${-days} 天，请尽快续费`
    : days === 0
      ? `【贝果科技】你的 ${order.subscriptionType} 今天到期，请及时续费`
      : `【贝果科技】你的 ${order.subscriptionType} 还有 ${days} 天到期，请及时续费`
  const introText = expired ? '你的以下订阅已过期，请尽快续费恢复使用：' : '你好，你的以下订阅即将到期：'
  const daysCell = expired ? `已过期 ${-days} 天` : days === 0 ? '今天到期' : `${days} 天`
  const lookupUrl = `${APP_URL}/lookup?email=${encodeURIComponent(order.claudeAccount)}`
  const html = `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:28px 24px;border-radius:16px 16px 0 0;">
      <div style="color:#fff;font-size:20px;font-weight:700;">贝果科技 · 订阅到期提醒</div>
    </div>
    <div style="border:1px solid #eee;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
      <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">${introText}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;width:90px;">订阅类型</td><td style="padding:8px 0;font-weight:600;">${order.subscriptionType}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">账户</td><td style="padding:8px 0;font-family:monospace;">${order.claudeAccount}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">到期时间</td><td style="padding:8px 0;font-weight:600;color:#dc2626;">${expStr}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">${expired ? '状态' : '剩余'}</td><td style="padding:8px 0;font-weight:600;${expired || days === 0 ? 'color:#dc2626;' : ''}">${daysCell}</td></tr>
      </table>
      <div style="margin:24px 0;text-align:center;">
        <a href="${lookupUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;">查看订阅状态</a>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.7;margin:16px 0 0;">
        需要续费请联系客服微信：<b style="color:#7c3aed;">${SERVICE_WECHAT}</b><br/>
        或访问 <a href="${APP_URL}" style="color:#7c3aed;">${APP_URL.replace(/^https?:\/\//, '')}</a> 重新下单。
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#9ca3af;margin:16px 0;">此邮件由系统自动发送，如有疑问请联系客服。</p>
  </div>`
  return { subject, html }
}

function smsTemplateParam(order: ExternalOrder): Record<string, string> {
  // 阿里云短信模板需在控制台审核通过，变量名需与模板一致。
  // 建议模板示例："您购买的${type}订阅还剩${days}天到期，请及时续费续期。"
  const days = daysUntilExpire(order.expireDate)
  return {
    type: order.subscriptionType,
    days: String(days <= 0 ? 0 : days),
  }
}

export interface SendOutcome {
  orderId: number
  claudeAccount: string
  emailResult?: { ok: boolean; detail: string; target: string }
  smsResult?: { ok: boolean; detail: string; target: string }
  skippedReason?: string // 没有可用渠道时
}

const phoneRe = /^1[3-9]\d{9}$/
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 给单个订单发送提醒（手动/自动通用）。任一渠道成功即更新提醒状态。
export async function sendReminderForOrder(
  order: ExternalOrder,
  contact: ResolvedContact,
  trigger: 'auto' | 'manual'
): Promise<SendOutcome> {
  const outcome: SendOutcome = { orderId: order.id, claudeAccount: order.claudeAccount }
  let anySuccess = false

  const logs: {
    channel: string
    target: string
    status: string
    detail: string
  }[] = []

  // 邮箱渠道
  if (contact.notifyEmail && contact.email && emailRe.test(contact.email)) {
    const { subject, html } = buildEmail(order)
    const r = await sendDirectMail(contact.email, subject, html)
    outcome.emailResult = { ok: r.ok, detail: r.detail, target: contact.email }
    logs.push({ channel: 'email', target: contact.email, status: r.ok ? 'success' : 'failed', detail: r.detail })
    if (r.ok) anySuccess = true
  }

  // 短信渠道
  if (contact.notifyPhone && contact.phone && phoneRe.test(contact.phone)) {
    const r = await sendSms(contact.phone, smsTemplateParam(order))
    outcome.smsResult = { ok: r.ok, detail: r.detail, target: contact.phone }
    logs.push({ channel: 'sms', target: contact.phone, status: r.ok ? 'success' : 'failed', detail: r.detail })
    if (r.ok) anySuccess = true
  }

  if (logs.length === 0) {
    outcome.skippedReason = '该账户未配置可用的提醒渠道'
    return outcome
  }

  // 写日志
  await prisma.reminderLog.createMany({
    data: logs.map((l) => ({
      orderId: order.id,
      claudeAccount: order.claudeAccount,
      channel: l.channel,
      target: l.target,
      trigger,
      status: l.status,
      detail: l.detail.slice(0, 1000),
    })),
  })

  // 任一渠道成功 → 标记已提醒（自动 + 手动都标记，避免重复自动提醒）
  if (anySuccess) {
    await prisma.externalOrder.update({
      where: { id: order.id },
      data: { lastRemindedAt: new Date(), remindedExpireDate: order.expireDate },
    })
  }

  return outcome
}

export interface AutoRunSummary {
  total: number       // 7 日内到期订单总数
  eligible: number    // 本次需要自动提醒的数量（排除已提醒）
  sent: number        // 至少一个渠道成功
  failed: number      // 全部渠道失败
  skipped: number     // 无可用渠道
  outcomes: SendOutcome[]
}

// 自动提醒任务：7 日内到期且未提醒过的订单
export async function runAutoReminders(): Promise<AutoRunSummary> {
  const today = new Date(todayUtcMs())
  const max = new Date(todayUtcMs() + (REMIND_WITHIN_DAYS + 1) * 86400000)

  const orders = await prisma.externalOrder.findMany({
    where: { expireDate: { gte: today, lt: max } },
    orderBy: { expireDate: 'asc' },
  })

  // 排除已针对当前到期日提醒过的（续费后 expireDate 改变会重新生效）
  const eligible = orders.filter(
    (o) => !isSameUtcDate(o.remindedExpireDate, o.expireDate)
  )

  const accounts = Array.from(new Set(eligible.map((o) => o.claudeAccount)))
  const contacts = await prisma.accountContact.findMany({
    where: { claudeAccount: { in: accounts } },
  })
  const contactMap = new Map(contacts.map((c) => [c.claudeAccount, c]))

  const summary: AutoRunSummary = {
    total: orders.length,
    eligible: eligible.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    outcomes: [],
  }

  for (const order of eligible) {
    const contact = resolveContact(order.claudeAccount, contactMap.get(order.claudeAccount) || null)
    const outcome = await sendReminderForOrder(order, contact, 'auto')
    summary.outcomes.push(outcome)
    if (outcome.skippedReason) summary.skipped++
    else if (outcome.emailResult?.ok || outcome.smsResult?.ok) summary.sent++
    else summary.failed++
  }

  return summary
}
