/**
 * 把管理员输入的「分站」解析成分站（docs/微信机器人-设计.md §4.6）。
 * 输入可能是 tibo.pw、lulu.bigolab.com、https://tiboshop.bigolab.com/x、渠道代码 mysticboy、bigolab.com。
 */
import { prisma } from '../db'
import { normalizeHost, platformHosts } from '../storefront/hosts'
import { resolveStorefrontForHost, storefrontById } from '../storefront/resolve'

export type SiteResolve =
  | { ok: true; tenantId: number; code: string; name: string; status: string; origin: string }
  | { ok: false; error: string }

/** 去掉括号与首尾空白：【分站网站】、[x]、「x」、<x> */
export function stripBrackets(s: string): string {
  return s.replace(/[【】[\]「」『』<>《》()（）]/g, '').trim()
}

export async function resolveSite(input: string): Promise<SiteResolve> {
  let s = stripBrackets(String(input ?? '')).trim()
  if (!s) return { ok: false, error: '请写分站域名或渠道代码，例如：创建 tibo.pw' }
  if (s.length > 200) return { ok: false, error: '分站写得太长了' }

  let tenantId: number | null = null
  if (s.includes('.') || s.includes('://')) {
    if (s.includes('://')) {
      try {
        s = new URL(s).host
      } catch {
        return { ok: false, error: '网址格式不对' }
      }
    } else {
      s = s.split('/')[0]
    }
    const host = normalizeHost(s)
    if (!host) return { ok: false, error: '域名格式不对' }
    if (platformHosts().has(host)) return { ok: false, error: '这是主站域名；分站群只能绑定分站，主站动态在管理群里' }
    const sf = await resolveStorefrontForHost(host).catch(() => null)
    if (!sf || sf.kind !== 'CHANNEL') {
      // 停用的域名在 tenant_domains 里还有行：给出更明确的提示
      const d = await prisma.tenantDomain.findUnique({ where: { host }, select: { status: true } }).catch(() => null)
      if (d && d.status === 0) return { ok: false, error: '该域名已停用' }
      return { ok: false, error: `找不到分站：${host}` }
    }
    tenantId = sf.id
  } else {
    const code = s.toLowerCase()
    if (!/^[a-z0-9-]{1,20}$/.test(code)) return { ok: false, error: '渠道代码格式不对' }
    if (code === 'main') return { ok: false, error: '分站群只能绑定分站' }
    const t = await prisma.tenant.findUnique({ where: { code }, select: { id: true, kind: true } })
    if (!t || t.kind !== 'CHANNEL') return { ok: false, error: `找不到渠道：${code}` }
    tenantId = t.id
  }

  const sf = await storefrontById(tenantId)
  if (!sf || sf.kind !== 'CHANNEL') return { ok: false, error: '找不到该分站' }
  if (sf.status === 'TERMINATED') return { ok: false, error: '该分站已停业，不能绑定' }
  return { ok: true, tenantId: sf.id, code: sf.code, name: sf.brand?.name || sf.code, status: sf.status, origin: sf.origin }
}

export const TENANT_STATUS_LABEL: Record<string, string> = {
  DRAFT: '筹备中',
  ACTIVE: '营业中',
  SUSPENDED: '暂停营业',
  TERMINATED: '已停业',
}
