/**
 * 渠道分站公告（docs/多渠道分销-渠道品牌与公告.md 第 5 节）：渠道后台发布，只在该渠道前台弹窗展示。
 *
 * 【与主站公告分开】主站 announcements 表、/api/admin/announcements、主站前台查询一行不改；渠道公告在 tenant_announcements。
 * 前台仍是同一个弹窗组件（components/announcement-modal.tsx）、同一个接口 /api/announcement：接口按店面分流，
 * 渠道 Host 只查本渠道的行，主站 Host 只查 announcements。
 *
 * 【寻址】一律用公开编号 announcementNo（12 位随机 base32）；渠道 DTO 与 URL 里没有全局自增 id（设计 6.3），正文字段叫 body。
 *
 * 【谁能调】
 *  · 渠道：经 partner-facade 再导出（边界检查规则 3：partner-services 只能 import facade）。每个函数第一个参数是 tenantId，
 *    where 里永远带 tenantId，按 id 寻址时 id 不属于本渠道一律按不存在处理（404）。
 *  · 超管：admin-tenants 详情页查看与「下架 / 恢复」（blocked）。被下架的公告前台不展示，渠道不能再启用，只能删除或修改后等平台恢复。
 *  · 前台：liveTenantAnnouncement(tenantId)（形状与主站接口相同，id 给公开编号）。
 *
 * 【内容】纯文本（换行原样展示，弹窗组件用 whitespace-pre-wrap 渲染，不解析 HTML / Markdown）。标题 ≤100、正文 ≤2000 字；
 * 每个渠道最多 50 条（防止无限写入）。
 */
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { newPublicNo, parsePublicNo } from './public-no'
import type { PartnerAnnouncementDTO } from './types'

export const TENANT_ANNOUNCEMENT_MAX = 50
export const TENANT_ANNOUNCEMENT_LEVELS = ['INFO', 'WARN', 'SUCCESS'] as const

/** 控制字符（保留换行与制表）与零宽 / 方向控制字符一律去掉 */
// eslint-disable-next-line no-control-regex
const STRIP_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g
const clean = (s: string) => s.replace(STRIP_RE, '').replace(/\r\n?/g, '\n')

const dateField = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === '') return null
    const d = new Date(v)
    if (isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '时间格式不正确' })
      return z.NEVER
    }
    return d
  })

export const tenantAnnouncementSchema = z
  .object({
    title: z.string().transform(clean).pipe(z.string().trim().min(1, '请填写公告标题').max(100, '标题最多 100 个字')),
    body: z.string().transform(clean).pipe(z.string().trim().min(1, '请填写公告内容').max(2000, '内容最多 2000 个字')),
    level: z.enum(TENANT_ANNOUNCEMENT_LEVELS).default('INFO'),
    enabled: z.boolean().default(false),
    pinned: z.boolean().default(false),
    startAt: dateField,
    endAt: dateField,
  })
  .strict()
  .refine((x) => !x.startAt || !x.endAt || x.endAt > x.startAt, { message: '结束时间要晚于开始时间', path: ['endAt'] })

export type TenantAnnouncementInput = z.input<typeof tenantAnnouncementSchema>

/** 渠道后台与超管看到的一条公告（类型定义在 tenant/types.ts，selects.ts 的键表从那里取） */
export type TenantAnnouncementDTO = PartnerAnnouncementDTO

const DTO_SELECT = {
  announcementNo: true,
  title: true,
  content: true,
  level: true,
  enabled: true,
  pinned: true,
  blocked: true,
  startAt: true,
  endAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TenantAnnouncementSelect

type Row = Prisma.TenantAnnouncementGetPayload<{ select: typeof DTO_SELECT }>

function isLive(r: Pick<Row, 'enabled' | 'blocked' | 'startAt' | 'endAt'>, now = new Date()): boolean {
  return r.enabled && !r.blocked && (!r.startAt || r.startAt <= now) && (!r.endAt || r.endAt >= now)
}

function toDTO(r: Row): TenantAnnouncementDTO {
  return {
    announcementNo: r.announcementNo,
    title: r.title,
    body: r.content,
    level: r.level,
    enabled: r.enabled,
    pinned: r.pinned,
    blocked: r.blocked,
    startAt: r.startAt ? r.startAt.toISOString() : null,
    endAt: r.endAt ? r.endAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    live: isLive(r),
  }
}

/** 业务错误：调用方转对应 HTTP 状态；message 是给用户看的中文 */
export class TenantAnnouncementError extends Error {
  constructor(
    public status: 400 | 404 | 409,
    message: string,
  ) {
    super(message)
    this.name = 'TenantAnnouncementError'
  }
}

function assertTenant(tenantId: unknown): asserts tenantId is number {
  if (typeof tenantId !== 'number' || !Number.isInteger(tenantId) || tenantId < 2) throw new Error(`[tenant-announcements] tenantId 非法：${String(tenantId)}`)
}

/** 校验并转成库列（body → content） */
function parse(input: unknown) {
  const r = tenantAnnouncementSchema.safeParse(input)
  if (!r.success) throw new TenantAnnouncementError(400, r.error.issues[0]?.message || '公告内容不正确')
  const { body, ...rest } = r.data
  return { ...rest, content: body }
}

/** 编号先过格式：不合格按不存在处理，不去查库 */
function noOf(raw: unknown): string {
  const no = parsePublicNo(raw)
  if (!no) throw new TenantAnnouncementError(404, '公告不存在')
  return no
}

export async function listTenantAnnouncements(tenantId: number): Promise<TenantAnnouncementDTO[]> {
  assertTenant(tenantId)
  const rows = await prisma.tenantAnnouncement.findMany({ where: { tenantId }, orderBy: { id: 'desc' }, take: TENANT_ANNOUNCEMENT_MAX, select: DTO_SELECT })
  return rows.map(toDTO)
}

export async function createTenantAnnouncement(tenantId: number, userId: number, input: unknown): Promise<TenantAnnouncementDTO> {
  assertTenant(tenantId)
  const d = parse(input)
  return prisma.$transaction(async (tx) => {
    // 计数与插入同一事务，并锁住渠道行：两个成员同时新建不会一起越过上限
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const n = await tx.tenantAnnouncement.count({ where: { tenantId } })
    if (n >= TENANT_ANNOUNCEMENT_MAX) throw new TenantAnnouncementError(409, `每个店铺最多保留 ${TENANT_ANNOUNCEMENT_MAX} 条公告，请先删除不用的`)
    // 编号冲突概率极低（60 bit），靠唯一约束兜底，撞了换一个再试
    for (let i = 0; ; i++) {
      try {
        const r = await tx.tenantAnnouncement.create({ data: { tenantId, announcementNo: newPublicNo(), createdBy: userId, ...d }, select: DTO_SELECT })
        return toDTO(r)
      } catch (e) {
        if (i < 3 && (e as { code?: string })?.code === 'P2002') continue
        throw e
      }
    }
  })
}

export async function updateTenantAnnouncement(tenantId: number, rawNo: unknown, input: unknown): Promise<TenantAnnouncementDTO> {
  assertTenant(tenantId)
  const announcementNo = noOf(rawNo)
  const d = parse(input)
  const cur = await prisma.tenantAnnouncement.findFirst({ where: { announcementNo, tenantId }, select: { blocked: true } })
  if (!cur) throw new TenantAnnouncementError(404, '公告不存在')
  if (cur.blocked && d.enabled) throw new TenantAnnouncementError(409, '这条公告已被平台下架，不能启用；可以修改内容后联系平台恢复，或删除后重新发布')
  const r = await prisma.tenantAnnouncement.updateMany({ where: { announcementNo, tenantId }, data: d })
  if (r.count !== 1) throw new TenantAnnouncementError(404, '公告不存在')
  const row = await prisma.tenantAnnouncement.findFirst({ where: { announcementNo, tenantId }, select: DTO_SELECT })
  if (!row) throw new TenantAnnouncementError(404, '公告不存在')
  return toDTO(row)
}

export async function deleteTenantAnnouncement(tenantId: number, rawNo: unknown): Promise<void> {
  assertTenant(tenantId)
  const announcementNo = noOf(rawNo)
  const r = await prisma.tenantAnnouncement.deleteMany({ where: { announcementNo, tenantId } })
  if (r.count !== 1) throw new TenantAnnouncementError(404, '公告不存在')
}

/** 超管：下架 / 恢复（下架同时置 enabled=false；恢复不自动启用，由渠道自己再启用） */
export async function setTenantAnnouncementBlocked(tenantId: number, rawNo: unknown, blocked: boolean): Promise<TenantAnnouncementDTO> {
  assertTenant(tenantId)
  const announcementNo = noOf(rawNo)
  const data = blocked ? { blocked: true, enabled: false } : { blocked: false }
  const r = await prisma.tenantAnnouncement.updateMany({ where: { announcementNo, tenantId }, data })
  if (r.count !== 1) throw new TenantAnnouncementError(404, '公告不存在')
  const row = await prisma.tenantAnnouncement.findFirst({ where: { announcementNo, tenantId }, select: DTO_SELECT })
  if (!row) throw new TenantAnnouncementError(404, '公告不存在')
  return toDTO(row)
}

/**
 * 前台：本渠道此刻生效的一条公告（形状与主站 /api/announcement 相同，弹窗组件不用改）。
 * 强提醒优先，同级取最新；被下架的不展示。
 */
export async function liveTenantAnnouncement(
  tenantId: number,
): Promise<{ id: string; title: string; content: string; level: string; pinned: boolean; updatedAt: Date } | null> {
  assertTenant(tenantId)
  const now = new Date()
  const a = await prisma.tenantAnnouncement.findFirst({
    where: {
      tenantId,
      enabled: true,
      blocked: false,
      AND: [{ OR: [{ startAt: null }, { startAt: { lte: now } }] }, { OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: [{ pinned: 'desc' }, { id: 'desc' }],
    select: { announcementNo: true, title: true, content: true, level: true, pinned: true, updatedAt: true },
  })
  // 弹窗组件按 id 记「已读」（localStorage，按域名隔离）：给公开编号，不给全局自增 id
  return a ? { id: a.announcementNo, title: a.title, content: a.content, level: a.level, pinned: a.pinned, updatedAt: a.updatedAt } : null
}
