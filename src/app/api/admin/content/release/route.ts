export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { MAX_MANUAL_RELEASE, releaseScheduled, releaseStats } from '@/lib/content/release'

/**
 * 后台：定时放量队列（内容扩容 10-07）。GET 看队列现状；POST {count} 立即放出接下来的 N 条
 * （不看每天上限，但计入今天的条数——当天 cron 会相应少放）。adminGuard：查库复核角色 + 同源校验。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success(await releaseStats())
  } catch (err) {
    console.error('Admin release stats error:', err)
    return error('获取失败')
  }
}

const schema = z.object({ count: z.number().int().min(1).max(MAX_MANUAL_RELEASE) })

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(`条数为 1–${MAX_MANUAL_RELEASE}`)
    const r = await releaseScheduled({ mode: 'manual', count: parsed.data.count })
    if (r.reason === 'busy') return error('另一趟放量正在进行，稍后再试', 409)
    return success(r, r.released ? `已放出 ${r.released} 条` : '队列里没有可放出的内容')
  } catch (err) {
    console.error('Admin release error:', err)
    return error('放量失败')
  }
}
