export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { closeExpired, reconcilePaidVmq } from '@/lib/vmq'

// 兜底定时清理过期收款单（可由 cron 容器每分钟调用）
export async function GET(request: NextRequest) {
  try {
    // 鉴权统一走 lib/cron-auth：密钥缺失时**拒绝**而不是放行。
    // 原来这里写的是 `if (secret) {...}`，密钥为空时整块被跳过 = 接口对公网敞开。
    const auth = assertCronAuth(request)
    if (!auth.ok) return error(auth.message, auth.status)
    const closed = await closeExpired()
    // 到账对账：收款单已到账、订单却还停在待支付的（到账那一次履约抛错），宽限期后在这里补做。
    // 只挂在这条每分钟一次的 cron 上 —— closeExpired 会被收银台轮询 / 发起支付并发调用，不能放进去。
    // 失败不影响关单结果，下一分钟再来
    const reconcile = await reconcilePaidVmq().catch((e) => {
      console.error('[vmq] 对账失败', e)
      return null
    })
    return success({ closed, reconcile })
  } catch (err) {
    console.error('Vmq close cron error:', err)
    return error('清理失败')
  }
}
