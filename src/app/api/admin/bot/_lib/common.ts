/**
 * 后台「微信机器人」接口（/api/admin/bot/*）的公用函数（docs/微信机器人-设计.md §14）。
 *
 * 放在 _lib 私有目录而不是 route.ts 里：route.ts 只能导出 HTTP handler 与 dynamic 等配置；
 * Next 不会把以下划线开头的目录当路由。每个接口的第一行仍然是 adminGuard()，守卫不在这里。
 */
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'

export interface Actor {
  userId: number | null
  /** 写进 lockedBy、企业微信抄送与审计里的「操作人」：用昵称，不带邮箱 */
  label: string
}

/** 当前登录的站内管理员（adminGuard 已经放行，这里只取 id 与显示名） */
export async function currentActor(): Promise<Actor> {
  const u = await getCurrentUser().catch(() => null)
  const name = (u?.nickname || '').replace(/\s+/g, ' ').trim().slice(0, 20) || (u ? `管理员#${u.id}` : '未知')
  return { userId: u?.id ?? null, label: `后台（${name}）` }
}

/** 当前站内账号对应的机器人管理员 id（bot_admins.site_user_id）；没有登记过返回 null。用于 bound_by */
export async function botAdminIdOfUser(userId: number | null): Promise<number | null> {
  if (!userId) return null
  const a = await prisma.botAdmin.findFirst({ where: { siteUserId: userId, enabled: true }, select: { id: true } })
  return a?.id ?? null
}

export interface AuditTarget {
  type: string
  id: string
}

/**
 * 写审计（actorKind='PLATFORM'，action 用 bot.admin.*）。写不进去会抛——需要「审计失败不得放行」的调用方（解锁、认领码）直接用它。
 * 不传 tenantId：渠道侧的审计页按 tenant_id 列出该渠道的行，机器人后台操作不该出现在渠道能看到的列表里；
 * 受影响的分站写在 diff 里（diff 只有超管能看）。
 */
export async function auditStrict(
  req: Request,
  actor: Actor,
  action: string,
  target: AuditTarget,
  diff?: unknown,
  extra?: { result?: 'OK' | 'DENIED' | 'ERROR'; reason?: string }
): Promise<void> {
  await writeAudit(null, {
    actorUserId: actor.userId,
    actorKind: 'PLATFORM',
    action,
    targetType: target.type,
    targetId: target.id,
    diff,
    result: extra?.result,
    reason: extra?.reason,
    req,
  })
}

/** 业务已经成功之后补写审计：写失败只记日志，不把已经生效的操作报成失败 */
export async function auditSoft(
  req: Request,
  actor: Actor,
  action: string,
  target: AuditTarget,
  diff?: unknown,
  extra?: { result?: 'OK' | 'DENIED' | 'ERROR'; reason?: string }
): Promise<void> {
  try {
    await auditStrict(req, actor, action, target, diff, extra)
  } catch (e) {
    console.error(`[bot-admin] 写审计失败 ${action}`, (e as Error)?.message)
  }
}

/** 请求体必须是 JSON 对象；否则 null */
export async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b: unknown = await req.json()
    return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** 路径里的正整数 id；不合法 null */
export function parseId(s: string | null | undefined): number | null {
  if (!s || !/^\d{1,9}$/.test(s)) return null
  const n = Number(s)
  return n >= 1 ? n : null
}

/** 分页参数：page ≥ 1，pageSize 夹在 [1, max] */
export function pageOf(sp: URLSearchParams, def = 30, max = 100): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, Math.min(100000, parseInt(sp.get('page') || '1', 10) || 1))
  const pageSize = Math.max(1, Math.min(max, parseInt(sp.get('pageSize') || String(def), 10) || def))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

/** 带字段级错误的 400（页面把 errors 标在对应输入框上） */
export function failFields(message: string, errors: Record<string, string>, status = 400): Response {
  return Response.json({ success: false, error: message, errors }, { status })
}

/** 带额外字段的失败响应（如 409 + needConfirm） */
export function failWith(message: string, status: number, extra: Record<string, unknown>): Response {
  return Response.json({ success: false, error: message, ...extra }, { status })
}

/** 去掉控制字符、压缩空白、截断（名字、备注一类的短文本） */
export function cleanText(v: unknown, max: number): string {
  // eslint-disable-next-line no-control-regex
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** 数字入参：数字或数字字符串；不是整数 / 越界返回 null */
export function intIn(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : null
}

/** 数字入参（可带小数）：最多 maxDecimals 位小数；越界 / 非数字返回 null */
export function numIn(v: unknown, min: number, max: number, maxDecimals: number): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) return null
  const s = String(n)
  if (s.indexOf('e') >= 0 || s.indexOf('E') >= 0) return null
  const dot = s.indexOf('.')
  const decimals = dot < 0 ? 0 : s.length - dot - 1
  return decimals <= maxDecimals ? n : null
}
