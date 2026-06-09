export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { pollAllWaiting } from '@/lib/sms'

// 定时轮询全部等待中的接码（兜底收码 + 超时取消），由 cron 容器每分钟调用
export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (secret) {
      const auth = request.headers.get('authorization')
      const qs = new URL(request.url).searchParams.get('secret')
      if (auth !== `Bearer ${secret}` && qs !== secret) return error('无权限', 401)
    }
    const polled = await pollAllWaiting()
    return success({ polled })
  } catch (err) {
    console.error('Sms poll cron error:', err)
    return error('轮询失败')
  }
}
