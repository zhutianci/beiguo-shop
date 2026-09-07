export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { pollAllWaiting } from '@/lib/sms'

// 定时轮询全部等待中的接码（兜底收码 + 超时取消），由 cron 容器每分钟调用
export async function GET(request: NextRequest) {
  try {
    // 鉴权统一走 lib/cron-auth：密钥缺失时**拒绝**而不是放行。
    // 原来这里写的是 `if (secret) {...}`，密钥为空时整块被跳过 = 接口对公网敞开。
    const auth = assertCronAuth(request)
    if (!auth.ok) return error(auth.message, auth.status)
    const polled = await pollAllWaiting()
    return success({ polled })
  } catch (err) {
    console.error('Sms poll cron error:', err)
    return error('轮询失败')
  }
}
