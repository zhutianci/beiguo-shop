/**
 * 渠道后台页面守卫（设计 6.5.4）。
 *
 * 每个 src/app/partner/**\/page.tsx 必须是 Server Component，并在第一行调用 requirePartnerPage(perm)：
 * layout 在客户端导航时不重新执行，只放 layout 等于没守（边界检查规则 5）。页面只渲染外壳，数据全部经 /api/partner/* 取。
 * **notFound() / redirect() 不能包进 try**（它们是用异常实现的控制流，见 storefront/next-errors.ts）。
 *
 * 判定与 partnerRoute 同一套（同一个 loadActiveMember、同一组权限常量），差别只在出口：
 *  · 非渠道店面、TERMINATED、非成员、越权 → notFound()（越权额外写 authz.denied 审计）
 *  · 未登录 → redirect('/partner/login')；渠道 Host 上的 ADMIN 也走这里（getCurrentUser 在渠道店面对 ADMIN 返回 null，
 *    与接口层 401 同一口径，不暴露其为管理员，主会话 D2 方案 a）
 *  · SUSPENDED：页面照常渲染（只读），写操作由接口层 partnerRoute 拒绝
 *
 * 两个例外页面向非成员：/partner/login 与 /partner/invite/[token] 调 requireChannelStorefrontPage()
 * （否则 requirePartnerPage 对未登录用户重定向到登录页会无限循环）。
 */
import { randomUUID } from 'crypto'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '../auth'
import { writeAudit } from '../audit'
import { getStorefront } from '../storefront/resolve'
import { tenantOrigin } from '../storefront/origin'
import { loadActiveMember } from './member'
import type { PartnerCtx } from './partner-route'
import { ALL_PARTNER_PERMS, DRAFT_SAFE_PERMS, OWNER_ONLY_PERMS, parsePerms, type PartnerPerm } from './perms'

export async function requirePartnerPage(perm: PartnerPerm): Promise<PartnerCtx> {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'CHANNEL' || sf.status === 'TERMINATED') notFound()
  const user = await getCurrentUser()
  if (!user) redirect('/partner/login')
  const m = await loadActiveMember(sf.id, user.id)
  if (!m) notFound()

  const perms = m.role === 'OWNER' ? ALL_PARTNER_PERMS : parsePerms(m.perms)
  const reason =
    sf.status === 'DRAFT' && !DRAFT_SAFE_PERMS.has(perm)
      ? 'draft'
      : !perms.has(perm) || (OWNER_ONLY_PERMS.has(perm) && m.role !== 'OWNER')
        ? 'perm'
        : null
  if (reason) {
    // 成员越权逐条审计；不 await、失败只记日志（拒绝本身不受影响）
    writeAudit(null, {
      actorKind: 'TENANT',
      actorUserId: user.id,
      tenantId: sf.id,
      action: 'authz.denied',
      targetType: 'page',
      targetId: perm,
      result: 'DENIED',
      reasonCode: reason,
      publicDiff: null,
    }).catch((e) => console.error('[partner] 页面 authz.denied 审计写入失败', e))
    notFound()
  }

  return { tenantId: sf.id, userId: user.id, role: m.role, perms, readOnly: sf.status === 'SUSPENDED', requestId: randomUUID() }
}

/**
 * 仅 /partner/login 与 /partner/invite/[token]：店面不是 CHANNEL 或已 TERMINATED → notFound；不要求登录与成员身份。
 * 返回店面状态与主站注册地址：没有账号的人要先到主站注册（渠道站 DRAFT 期不开放注册；两站同一账号）。
 * 主站地址取平台 Tenant.origin（tenantOrigin(1)，不查库），绝不从 Host 拼。
 */
export async function requireChannelStorefrontPage(): Promise<{ status: string; mainRegisterUrl: string }> {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'CHANNEL' || sf.status === 'TERMINATED') notFound()
  return { status: sf.status, mainRegisterUrl: `${await tenantOrigin(1)}/register` }
}
