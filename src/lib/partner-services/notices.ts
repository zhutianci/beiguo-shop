/**
 * 渠道后台：站内通知中心（WP7，设计 5.8 TenantNotice、11.4、12.1）。
 *
 * 通知由 WP0 的 emitTenantNotice 写入（订单支付、买家留言、售后结果、结算单、打款…），本文件只读与标已读：
 *  · 行范围 where 顶层 tenantId；寻址键 noticeNo = TenantNotice.publicNo（随机，不暴露全局通知量）；
 *  · 只写 readAt（设计 6.5.3 partnerMarkNoticesRead）；
 *  · 批量标已读对「不存在 / 他站 / 已读」的编号一律静默跳过、同样返回 204——批量操作不给逐条结果，
 *    所以既不会改到别人的行，也不能拿它探测某个编号是否存在（T1：他站键数据库不变、响应与不存在相同）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { LIMITS, type PartnerNoticeRow, type TenantNoticeKind } from '../tenant/types'
import { parsePublicNo } from '../tenant/public-no'
import { assertTenantId } from './_scope'
import { PARTNER_NOTICE_SELECT } from './selects'
import { iso } from './orders'

/** 一次最多标记的编号数（页面一页最多 100 条） */
export const MARK_READ_MAX = 100

type NoticeRaw = Prisma.TenantNoticeGetPayload<{ select: typeof PARTNER_NOTICE_SELECT }>

function toRow(n: NoticeRaw): PartnerNoticeRow {
  return {
    noticeNo: n.publicNo,
    kind: n.kind as TenantNoticeKind,
    title: n.title,
    body: n.body ?? null,
    refType: n.refType ?? null,
    refKey: n.refKey ?? null,
    createdAt: n.createdAt.toISOString(),
    readAt: iso(n.readAt),
  }
}

export async function partnerListNotices(tenantId: number, f: { unread?: boolean; page: number; pageSize: number }): Promise<{ total: number; rows: PartnerNoticeRow[] }> {
  assertTenantId(tenantId)
  const where: Prisma.TenantNoticeWhereInput = { tenantId, ...(f.unread ? { readAt: null } : {}) }
  const page = Math.max(1, Math.floor(f.page))
  const pageSize = Math.min(LIMITS.pageMax, Math.max(1, Math.floor(f.pageSize)))
  const [total, raws] = await Promise.all([
    prisma.tenantNotice.count({ where }),
    prisma.tenantNotice.findMany({ where, select: PARTNER_NOTICE_SELECT, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
  ])
  return { total, rows: raws.map(toRow) }
}

export async function partnerUnreadNoticeCount(tenantId: number): Promise<number> {
  assertTenantId(tenantId)
  return prisma.tenantNotice.count({ where: { tenantId, readAt: null } })
}

/**
 * 标已读：all=true 标本渠道全部未读；否则只标给出的编号（格式不对的丢弃）。条件恒带 tenantId 与 readAt IS NULL，
 * 已读的不改（readAt 保持第一次读的时间）。返回实际更新的条数（只给服务端与测试用，handler 不输出）。
 */
export async function partnerMarkNoticesRead(tenantId: number, input: { noticeNos?: string[]; all?: boolean }): Promise<number> {
  assertTenantId(tenantId)
  const now = new Date()
  if (input.all === true) {
    const r = await prisma.tenantNotice.updateMany({ where: { tenantId, readAt: null }, data: { readAt: now } })
    return r.count
  }
  const nos = Array.from(new Set((input.noticeNos ?? []).map((n) => parsePublicNo(n)).filter((n): n is string => !!n))).slice(0, MARK_READ_MAX)
  if (nos.length === 0) return 0
  const r = await prisma.tenantNotice.updateMany({ where: { tenantId, publicNo: { in: nos }, readAt: null }, data: { readAt: now } })
  return r.count
}
