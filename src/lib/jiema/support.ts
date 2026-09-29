/**
 * 短信接码 · 客服侧的上下文（docs/短信接码-设计.md §8.2「留言会自动带上下文」、§6.6 第 29 条）。
 *
 * 买家在接码单上留言时，企业微信推送（message.buyer）里自动加上服务、国家/地区、运营商、状态、当前号码后 4 位、剩余时间、
 * 付款方式与后台详情链接，买家不需要自己描述订单。**只给站长看**（推送正文），不进任何买家响应；号码只给后 4 位。
 */
import type { NotifyRow } from '../notify'
import { adminLink, fmtTime } from '../notify'
import { prisma } from '../db'
import { fmtYuan } from './pricing'
import { phoneTail } from './machine'
import { stateBadge } from './ui'

const PAY_MODE_TEXT: Record<string, string> = { ALIPAY: '支付宝', BALANCE: '余额付清', MIXED: '余额 + 支付宝' }

export async function jiemaMessageRows(orderId: number): Promise<NotifyRow[]> {
  const so = await prisma.smsOrder.findUnique({ where: { orderId } })
  if (!so) return []
  const [cur, hold, order] = await Promise.all([
    so.currentAttemptId ? prisma.smsAttempt.findUnique({ where: { id: so.currentAttemptId }, select: { phone: true, endsAt: true, seq: true, state: true } }) : Promise.resolve(null),
    prisma.balanceHold.findUnique({ where: { orderId }, select: { topupCents: true, cashCents: true, state: true } }),
    prisma.order.findUnique({ where: { id: orderId }, select: { orderNo: true } }),
  ])
  const pay =
    so.payMode === 'ALIPAY'
      ? `支付宝 ${fmtYuan(so.alipayCents)}${so.alipayPaidCents != null ? `（实收 ${fmtYuan(so.alipayPaidCents)}）` : ''}`
      : `${PAY_MODE_TEXT[so.payMode] ?? so.payMode}：余额 ${fmtYuan(hold ? hold.topupCents + hold.cashCents : so.balanceCents)}` +
        (hold ? `（充值 ${fmtYuan(hold.topupCents)} · 返现 ${fmtYuan(hold.cashCents)} · ${hold.state}）` : '') +
        (so.alipayCents > 0 ? ` + 支付宝 ${fmtYuan(so.alipayCents)}${so.alipayPaidCents != null ? `（实收 ${fmtYuan(so.alipayPaidCents)}）` : ''}` : '')
  const rows: NotifyRow[] = [
    { label: '接码', value: `${so.serviceName} / ${so.countryName}（${so.operator ?? '任意运营商'}）` },
    { label: '状态', value: stateBadge(so.state).label },
  ]
  if (cur?.phone) {
    const left = cur.endsAt ? Math.max(0, Math.floor((cur.endsAt.getTime() - Date.now()) / 60_000)) : null
    rows.push({ label: '号码', value: `尾号 ${phoneTail(cur.phone)}（第 ${cur.seq} 个号${left != null && ['ACTIVE', 'RECEIVED'].includes(cur.state) ? `，剩余约 ${left} 分钟` : ''}）` })
  }
  rows.push({ label: '付款', value: pay })
  rows.push({ label: '下单', value: fmtTime(so.createdAt) })
  rows.push({ label: '后台详情', value: adminLink(`/admin/jiema?tab=orders&q=${encodeURIComponent(order?.orderNo ?? '')}`) })
  return rows
}
