export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { DEFAULT_VIP_TIERS, vipTiersSchema } from '@/lib/vip'
import { getVipTiers, saveVipTiers } from '@/lib/vip-server'

/**
 * 会员等级配置（Setting 表 key = vip_tiers）。
 *
 * 【处理器内再验一次管理员】中间件是这类路由唯一的守卫，而 Next 14.2.3 有 CVE-2025-29927
 * （带 x-middleware-subrequest 头可整个绕过中间件），目前只靠 nginx 清掉这个头。
 * 改的是买家可见的等级与权益，按项目约定在处理器里再拦一道。
 */

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    return success({ tiers: await getVipTiers(), defaults: DEFAULT_VIP_TIERS })
  } catch (err) {
    console.error('Admin get vip config error:', err)
    return error('获取配置失败')
  }
}

/**
 * 逐行文本框拆出来的权益先清洗再校验：末尾一个回车就会多出一个空串，
 * 放到校验之后再清洗的话，空行会被 min(1) 打回，还占 max(12) 的名额（同 admin/links/config）。
 */
function cleanTiers(v: unknown): unknown {
  if (!Array.isArray(v)) return v
  return v.map((t) => {
    if (!t || typeof t !== 'object') return t
    const o = t as Record<string, unknown>
    return {
      ...o,
      benefits: Array.isArray(o.benefits) ? o.benefits.map((s) => String(s ?? '').trim()).filter(Boolean) : o.benefits,
    }
  })
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { tiers?: unknown }
    const parsed = vipTiersSchema.safeParse(cleanTiers(body?.tiers))
    if (!parsed.success) {
      const e = parsed.error.errors[0]
      // 字段级错误带上「第几个等级」，否则运营不知道是哪一行填错了；
      // 自定义的整表规则（门槛重复 / 缺基础等级）本身已说清楚，不加前缀
      const idx = typeof e.path[0] === 'number' ? e.path[0] : null
      return error(e.code !== 'custom' && idx != null ? `第 ${idx + 1} 个等级：${e.message}` : e.message)
    }

    const saved = await saveVipTiers(parsed.data.map((t, i) => ({ ...t, level: i })))
    return success({ tiers: saved }, '已保存')
  } catch (err) {
    console.error('Admin save vip config error:', err)
    return error('保存失败')
  }
}
