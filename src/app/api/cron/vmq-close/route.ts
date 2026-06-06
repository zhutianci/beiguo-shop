export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { closeExpired } from '@/lib/vmq'

// 兜底定时清理过期收款单（可由 cron 容器每分钟调用）
export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (secret) {
      const auth = request.headers.get('authorization')
      const qs = new URL(request.url).searchParams.get('secret')
      if (auth !== `Bearer ${secret}` && qs !== secret) return error('无权限', 401)
    }
    const closed = await closeExpired()
    return success({ closed })
  } catch (err) {
    console.error('Vmq close cron error:', err)
    return error('清理失败')
  }
}
