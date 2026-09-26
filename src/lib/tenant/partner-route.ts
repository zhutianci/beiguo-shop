/**
 * 渠道后台接口的唯一守卫（设计 6.5.4）。每个 src/app/api/partner/**\/route.ts 只能写：
 *
 *   export const dynamic = 'force-dynamic'
 *   export const GET = partnerRoute('order.read', handlers.listOrders)
 *
 * 【授权全在这里重做】middleware 可被绕过（CVE-2025-29927），Host、JWT、成员关系、权限点、店面状态、同源全部在路由内判定。
 * tenantId **只来自这里查库的结果**（店面 id 且必须有该店面的有效成员身份），绝不从 query、body、header、JWT 的 tid 读（设计 6.5.1）。
 *
 * 【判定顺序】（任一不过即返回，后面的查询不执行）
 *   1. 店面：必须是 CHANNEL 且不是 TERMINATED（主站 Host、休眠、未知 Host 一律 404）
 *   2. 写方法同源（tenant/same-origin，比超管侧更严）
 *   3. 按 IP 限流 120 次 / 分钟
 *   4. 登录（getCurrentUser：按店面校验 aud 由 WP1 实现）；未登录 401
 *   5. 非 ADMIN：由 getCurrentUser 保证——渠道店面上 role=ADMIN 一律返回 null（设计 4.7），所以超管在渠道 Host 上
 *      与未登录同样得到 401，不暴露「这是管理员」（主会话 D2 方案 a）。这里不再单独判 ADMIN（原分支永远走不到）。
 *   6. 有效成员（TenantMember status=1，每请求查库）
 *   7. DRAFT 店面只放行 DRAFT_SAFE_PERMS 里的点
 *   8. 权限点：OWNER 拥有全部；STAFF 按 perms，且 OWNER_ONLY_PERMS 永远拒绝 STAFF
 *   9. SUSPENDED 店面只读：只有 opts.readOnlySafe 的接口放行
 *  10. 可选的按「店面 + 用户」限频
 *
 * 【两种拒绝】
 *  · noise（1、2、6）：不逐条写审计，只按「IP + 原因」每分钟汇总一行（S15：防 DENIED 写放大）。返回 404。
 *  · deny（7、8、9）：已确认是本渠道成员却越权，逐条写 authz.denied 审计（异步，审计失败不影响拒绝）。返回 404。
 *  「不存在」与「无权」同一响应体（PARTNER_NOT_FOUND_BODY），渠道无法据此探测。
 *
 * 【不要包进 try】getStorefront() 在构建期抛 DynamicServerError（设计 4.4 第 7 条）；本函数返回的 handler 本身不捕获它。
 * handler 抛出的业务异常也不在这里吞：交给 Next 返回 500（不泄露细节），调用方需要自定义错误就在 handler 里自己 catch。
 */
import { randomUUID } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '../auth'
import { writeAudit } from '../audit'
import { clientIp } from '../news/rate-limit'
import { getStorefront } from '../storefront/resolve'
import { loadActiveMember } from './member'
import { ALL_PARTNER_PERMS, DRAFT_SAFE_PERMS, OWNER_ONLY_PERMS, parsePerms, type PartnerPerm } from './perms'
import { isSameOrigin } from './same-origin'
import { countNoise, throttled } from './throttle'
import { PARTNER_NOT_FOUND_BODY } from './types'

export interface PartnerCtx {
  tenantId: number
  userId: number
  role: 'OWNER' | 'STAFF'
  perms: ReadonlySet<PartnerPerm>
  readOnly: boolean
  requestId: string
}
export type PartnerHandler = (req: NextRequest, ctx: PartnerCtx, params: Record<string, string>) => Promise<Response>
/** 无 ownerOnly / draftSafe：「仅 OWNER」「DRAFT 可用」只由 perms.ts 的两个常量决定 */
export interface PartnerRouteOpts {
  readOnlySafe?: boolean
  rate?: { key: string; max: number; windowMs: number }
}

/** 每 IP 每分钟最多 120 次渠道请求（渠道后台是人手点的，远高于正常用量） */
const IP_RATE = { max: 120, windowMs: 60_000 }

function isWrite(req: Request): boolean {
  const m = req.method.toUpperCase()
  return m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS'
}

function ipOf(req: Request): string {
  return clientIp(req.headers)
}

export function partnerNotFound(): Response {
  return NextResponse.json(PARTNER_NOT_FOUND_BODY, { status: 404 })
}

function jsonError(message: string, status: number): Response {
  return NextResponse.json({ success: false, error: message }, { status })
}

function noise(req: Request, reason: string): Response {
  countNoise(ipOf(req), reason)
  return partnerNotFound()
}

function deny(req: Request, tenantId: number, userId: number, perm: PartnerPerm, reason: 'draft' | 'perm' | 'suspended'): Response {
  // 逐条审计；不 await：拒绝本身不依赖审计成败（审计失败只记日志，绝不因此放行）
  writeAudit(null, {
    actorKind: 'TENANT',
    actorUserId: userId,
    tenantId,
    action: 'authz.denied',
    targetType: 'perm',
    targetId: perm,
    result: 'DENIED',
    reasonCode: reason,
    req,
    // 渠道侧永远看不到 authz.denied（PARTNER_AUDIT 查询排除该 action）；这里显式不给 publicDiff
    publicDiff: null,
  }).catch((e) => console.error('[partner] authz.denied 审计写入失败', e))
  return partnerNotFound()
}

export function partnerRoute(
  perm: PartnerPerm,
  handler: PartnerHandler,
  opts: PartnerRouteOpts = {},
): (req: NextRequest, c: { params: Record<string, string> }) => Promise<Response> {
  return async (req, c) => {
    const sf = await getStorefront() // try 之外
    if (!sf || sf.kind !== 'CHANNEL' || sf.status === 'TERMINATED') return noise(req, 'host')
    if (isWrite(req) && !isSameOrigin(req)) return noise(req, 'csrf')
    if (throttled(`partner:${ipOf(req)}`, IP_RATE.max, IP_RATE.windowMs)) return jsonError('请求过于频繁', 429)

    const user = await getCurrentUser()
    if (!user) return jsonError('请先登录', 401) // 渠道 Host 上的 ADMIN 也落在这里（getCurrentUser 返回 null，D2）

    const m = await loadActiveMember(sf.id, user.id)
    if (!m) return noise(req, 'not-member')

    if (sf.status === 'DRAFT' && !DRAFT_SAFE_PERMS.has(perm)) return deny(req, sf.id, user.id, perm, 'draft')
    const perms = m.role === 'OWNER' ? ALL_PARTNER_PERMS : parsePerms(m.perms)
    if (!perms.has(perm) || (OWNER_ONLY_PERMS.has(perm) && m.role !== 'OWNER')) return deny(req, sf.id, user.id, perm, 'perm')

    const readOnly = sf.status === 'SUSPENDED'
    if (readOnly && !opts.readOnlySafe) return deny(req, sf.id, user.id, perm, 'suspended')

    if (opts.rate && throttled(`${opts.rate.key}:${sf.id}:${user.id}`, opts.rate.max, opts.rate.windowMs)) {
      return jsonError('操作过于频繁', 429)
    }

    return handler(req, { tenantId: sf.id, userId: user.id, role: m.role, perms, readOnly, requestId: randomUUID() }, c?.params ?? {})
  }
}

/**
 * 接受邀请专用（设计 5.2、6.5.4）：已登录 + CHANNEL 且非 TERMINATED + 写方法同源 + 非 ADMIN（同上，由 getCurrentUser 保证），**不要求成员**。
 * ctx.tenantId 来自店面。接受邀请的实现（WP6）必须查 TenantInvite where { tokenHash, tenantId: ctx.tenantId }，
 * TenantMember.tenantId 只取 invite.tenantId 并断言等于 ctx.tenantId（lulu 的邀请在 zz 的 Host 上接受 = 不存在）。
 */
export function inviteRoute(
  handler: (req: NextRequest, ctx: { tenantId: number; userId: number; email: string }) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req) => {
    const sf = await getStorefront() // try 之外
    if (!sf || sf.kind !== 'CHANNEL' || sf.status === 'TERMINATED') return noise(req, 'host')
    if (isWrite(req) && !isSameOrigin(req)) return noise(req, 'csrf')
    if (throttled(`pinvite:${ipOf(req)}`, 30, 60_000)) return jsonError('请求过于频繁', 429)
    const user = await getCurrentUser()
    if (!user) return jsonError('请先登录', 401) // 含渠道 Host 上的 ADMIN（D2）
    if (!user.email) return partnerNotFound()
    return handler(req, { tenantId: sf.id, userId: user.id, email: user.email })
  }
}
