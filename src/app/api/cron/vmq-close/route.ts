export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { closeExpired, reconcilePaidVmq } from '@/lib/vmq'
import { sweepOrphans } from '@/lib/wallet/topup'
import { cancelAbandonedOrders } from '@/lib/order/abandon'
import { expireEdgeBans } from '@/lib/security/edge-ban'

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
    // 充值单兜底清扫（docs/短信接码-设计.md §6.6 第 20 条、E60）：发起收款失败、同一请求里关单也失败的充值单（没有任何收款单），
    // 建单 10 分钟后在这里用小事务关掉（锁订单行 → 确认没有 0/1 收款单 → CAS 取消）。不新增 cron 行；失败不影响上面两步
    const topupSweep = await sweepOrphans().catch((e) => {
      console.error('[wallet] 充值单兜底清扫失败', e)
      return null
    })
    // 从没发起过付款、已过付款期限（默认 24 小时）的订单 → 已取消（2026-10-15，lib/order/abandon.ts）。失败不影响上面几步
    const abandoned = await cancelAbandonedOrders().catch((e) => {
      console.error('[order] 过期未付订单清理失败', e)
      return null
    })
    // Cloudflare 边缘封禁：到期解封 + 读 nginx 安全日志数扫描器路径（lib/security/edge-ban.ts，2026-10-25）。
    // 进程内每 5 分钟真正跑一次；没配 Cloudflare 时什么都不做。不新增 cron 行；失败不影响上面几步
    const edge = await expireEdgeBans().catch((e) => {
      console.error('[edge-ban] 定时任务失败', e)
      return null
    })
    return success({ closed, reconcile, topupSweep, abandoned, edge })
  } catch (err) {
    console.error('Vmq close cron error:', err)
    return error('清理失败')
  }
}
