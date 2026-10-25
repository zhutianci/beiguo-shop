export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import {
  BLOCKED_EMAIL_DOMAINS_KEY,
  EMAIL_POLICY_KEY,
  TRUSTED_EMAIL_DOMAINS_KEY,
  TRUSTED_PROVIDERS,
  builtinCounts,
  currentEmailPolicy,
  isKnownDisposable,
  parseDomainList,
  resetEmailDomainCache,
} from '@/lib/security/email-domain'
import { listIpBans, unbanIp } from '@/lib/security/ip-ban'
import { requireSudo } from '@/lib/security/sudo'
import { getCurrentUser } from '@/lib/auth'
import { EDGE_WHITELIST_KEY, edgeBanEnabled, edgeUnban, listEdgeBans, resetEdgeWhitelistCache } from '@/lib/security/edge-ban'

/**
 * 后台「安全」卡片（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md）：
 *  GET  注册邮箱模式（严格白名单 / 分级）与两份后台名单、当前被封的 IP、最近的安全记录（audit_events 里 sec.* 的行）；
 *  PUT  保存模式与名单（{ policy?: 'STRICT' | 'TIERED', trusted?, blocked? }，名单每行一个域名）；
 *  POST 解封 IP（{ unbanIp }）。IP 封禁在进程内存里，发版重启本来就会清空。
 * 处理器内再验一次管理员（同 admin/vip/config：middleware 不是唯一守卫）。
 */

async function guard(): Promise<Response | null> {
  try {
    await requireAdmin()
    return null
  } catch {
    return error('无管理员权限', 403)
  }
}

async function readList(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key }, select: { value: true } })
  return row?.value ?? ''
}

export async function GET() {
  const denied = await guard()
  if (denied) return denied
  try {
    const [trusted, blocked, events] = await Promise.all([
      readList(TRUSTED_EMAIL_DOMAINS_KEY),
      readList(BLOCKED_EMAIL_DOMAINS_KEY),
      prisma.auditEvent.findMany({
        where: { action: { startsWith: 'sec.' } },
        orderBy: { id: 'desc' },
        take: 50,
        select: { id: true, at: true, action: true, actorUserId: true, targetType: true, targetId: true, reason: true, ip: true },
      }),
    ])
    return success({
      policy: await currentEmailPolicy(),
      trusted,
      blocked,
      builtin: builtinCounts(),
      ipBans: listIpBans().sort((a, b) => b.until - a.until),
      events,
      // Cloudflare 边缘封禁（lib/security/edge-ban.ts，2026-10-25）
      edge: { enabled: edgeBanEnabled(), bans: await listEdgeBans(), whitelist: await readList(EDGE_WHITELIST_KEY) },
    })
  } catch (err) {
    console.error('Admin security GET error:', err)
    return error('读取失败')
  }
}

export async function PUT(request: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  // 改注册口径 / 解封 IP 也要二次验证（lib/security/sudo.ts，2026-10-24）
  const sudo = await requireSudo()
  if (sudo) return sudo
  try {
    const body = (await request.json().catch(() => ({}))) as { trusted?: unknown; blocked?: unknown; policy?: unknown; edgeWhitelist?: unknown }
    const out: { policy?: string; trusted?: string; blocked?: string; ignored?: string[]; disposable?: string[] } = {}
    if (body.policy === 'STRICT' || body.policy === 'TIERED') {
      out.policy = body.policy
      await prisma.setting.upsert({
        where: { key: EMAIL_POLICY_KEY },
        create: { key: EMAIL_POLICY_KEY, value: body.policy },
        update: { value: body.policy },
      })
    }
    if (typeof body.trusted === 'string') {
      // 一次性邮箱不能被信任（防误加；10-15 那个人用的就是这类域名），保存时剔除并告诉站长
      const all = parseDomainList(body.trusted)
      out.disposable = all.filter((d) => isKnownDisposable(d))
      const list = all.filter((d) => !isKnownDisposable(d))
      out.trusted = list.join('\n')
      await prisma.setting.upsert({
        where: { key: TRUSTED_EMAIL_DOMAINS_KEY },
        create: { key: TRUSTED_EMAIL_DOMAINS_KEY, value: out.trusted },
        update: { value: out.trusted },
      })
    }
    if (typeof body.blocked === 'string') {
      const all = parseDomainList(body.blocked)
      // 内置的主流邮箱拦不掉（防手滑把 qq.com 填进来），保存时直接剔除并告诉站长
      out.ignored = all.filter((d) => TRUSTED_PROVIDERS.has(d))
      out.blocked = all.filter((d) => !TRUSTED_PROVIDERS.has(d)).join('\n')
      await prisma.setting.upsert({
        where: { key: BLOCKED_EMAIL_DOMAINS_KEY },
        create: { key: BLOCKED_EMAIL_DOMAINS_KEY, value: out.blocked },
        update: { value: out.blocked },
      })
    }
    if (typeof body.edgeWhitelist === 'string') {
      // 边缘封禁白名单：每行一个 IP（IPv6 按 /64 整段生效）；只留像 IP 的行
      const lines = body.edgeWhitelist
        .split(/[\s,，;；]+/)
        .map((s) => s.trim())
        .filter((s) => /^[0-9a-f.:]+(\/64)?$/i.test(s) && s.length <= 45)
        .slice(0, 200)
      await prisma.setting.upsert({
        where: { key: EDGE_WHITELIST_KEY },
        create: { key: EDGE_WHITELIST_KEY, value: lines.join('\n') },
        update: { value: lines.join('\n') },
      })
      resetEdgeWhitelistCache()
      ;(out as Record<string, unknown>).edgeWhitelist = lines.join('\n')
    }
    resetEmailDomainCache()
    const note =
      (out.ignored?.length ? `；主流邮箱不能拦截，已忽略：${out.ignored.join('、')}` : '') +
      (out.disposable?.length ? `；一次性邮箱不能信任，已忽略：${out.disposable.join('、')}` : '')
    return success(out, `已保存，立即生效${note}`)
  } catch (err) {
    console.error('Admin security PUT error:', err)
    return error('保存失败')
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  // 改注册口径 / 解封 IP 也要二次验证（lib/security/sudo.ts，2026-10-24）
  const sudo = await requireSudo()
  if (sudo) return sudo
  const body = (await request.json().catch(() => ({}))) as { unbanIp?: unknown; edgeUnban?: unknown }
  // 解除 Cloudflare 边缘封禁（同时解站内封禁）
  if (typeof body.edgeUnban === 'string' && body.edgeUnban) {
    const user = await getCurrentUser()
    const ok = await edgeUnban(body.edgeUnban, `后台手动解封（#${user?.id ?? '?'}）`)
    unbanIp(body.edgeUnban)
    if (!ok) return error('解封失败：Cloudflare 接口没有成功，稍后再试或到 Cloudflare 后台「安全性 → WAF → 工具」里手动删除')
    return success({ edgeBans: await listEdgeBans() }, '已解除边缘封禁')
  }
  if (typeof body.unbanIp !== 'string' || !body.unbanIp) return error('缺少 IP')
  unbanIp(body.unbanIp)
  return success({ ipBans: listIpBans() }, '已解封')
}
