export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import {
  BLOCKED_EMAIL_DOMAINS_KEY,
  TRUSTED_EMAIL_DOMAINS_KEY,
  TRUSTED_PROVIDERS,
  builtinCounts,
  parseDomainList,
  resetEmailDomainCache,
} from '@/lib/security/email-domain'
import { listIpBans, unbanIp } from '@/lib/security/ip-ban'

/**
 * 后台「安全」卡片（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md）：
 *  GET  注册邮箱分级的两份后台名单、当前被封的 IP、最近的安全记录（audit_events 里 sec.* 的行）；
 *  PUT  保存两份名单（{ trusted?, blocked? }，每行一个域名）；
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
      trusted,
      blocked,
      builtin: builtinCounts(),
      ipBans: listIpBans().sort((a, b) => b.until - a.until),
      events,
    })
  } catch (err) {
    console.error('Admin security GET error:', err)
    return error('读取失败')
  }
}

export async function PUT(request: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => ({}))) as { trusted?: unknown; blocked?: unknown }
    const out: { trusted?: string; blocked?: string; ignored?: string[] } = {}
    if (typeof body.trusted === 'string') {
      const list = parseDomainList(body.trusted)
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
    resetEmailDomainCache()
    const note = out.ignored?.length ? `；主流邮箱不能拦截，已忽略：${out.ignored.join('、')}` : ''
    return success(out, `已保存，立即生效${note}`)
  } catch (err) {
    console.error('Admin security PUT error:', err)
    return error('保存失败')
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard()
  if (denied) return denied
  const body = (await request.json().catch(() => ({}))) as { unbanIp?: unknown }
  if (typeof body.unbanIp !== 'string' || !body.unbanIp) return error('缺少 IP')
  unbanIp(body.unbanIp)
  return success({ ipBans: listIpBans() }, '已解封')
}
