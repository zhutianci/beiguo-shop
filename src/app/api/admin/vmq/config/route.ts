export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { VMQ_KEY, VMQ_TIMEOUT_MIN, recentVmqOrders, getDiag } from '@/lib/vmq'

// 收款监控配置：到账通知统一走 SmsForwarder → POST /api/pay/sms-notify。
// VmqApk（/appHeart + /appPush + 扫码配置二维码）已移除。
export async function GET(request: NextRequest) {
  try {
    // 域名：优先用 APP_URL，去掉协议与路径，只留 host[:port]；供 webhookUrl 兜底
    let host = ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    try {
      if (appUrl) host = new URL(appUrl).host
    } catch {
      /* ignore */
    }
    if (!host) host = request.headers.get('host') || ''

    // SmsForwarder（通知转发）Webhook 配置
    const origin = appUrl || (host ? `https://${host}` : '')
    const webhookToken = process.env.VMQ_WEBHOOK_TOKEN || VMQ_KEY
    const webhookUrl = origin ? `${origin}/api/pay/sms-notify` : '/api/pay/sms-notify'
    // SmsForwarder 用 [xxx] 占位符：[content]=通知内容(含金额)、[from]=来源、[org_content]=原始内容
    const webhookBody = JSON.stringify(
      { token: webhookToken, content: '[content]', from: '[from]', org: '[org_content]' },
      null,
      2
    )

    // 最近一次收到转发的时间 + 收款统计
    const [lastHeartS, pendingCount, paidCount, lastPaid] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'vmq_lastheart' } }),
      prisma.vmqOrder.count({ where: { state: 0 } }),
      prisma.vmqOrder.count({ where: { state: 1 } }),
      prisma.vmqOrder.findFirst({ where: { state: 1 }, orderBy: { payDate: 'desc' }, select: { payDate: true } }),
    ])
    const lastNotify = lastHeartS ? Number(lastHeartS.value) : 0
    // SmsForwarder 没有心跳，只有真实到账才会刷新时间戳，所以这里用 24 小时窗口表示「近期有转发进来」，
    // 且它只是展示信息，不再作为下单门禁。
    const recentlyActive = lastNotify > 0 && Date.now() - lastNotify < 24 * 3600_000

    const [recent, diag] = await Promise.all([recentVmqOrders(15), getDiag()])

    return success({
      recent,
      diag,
      webhookUrl,
      webhookToken,
      webhookBody,
      configured: !!VMQ_KEY,
      host,
      timeoutMin: VMQ_TIMEOUT_MIN,
      monitor: {
        recentlyActive,
        lastNotifyAt: lastNotify ? new Date(lastNotify).toISOString() : null,
        lastPaidAt: lastPaid?.payDate ?? null,
        pendingCount,
        paidCount,
      },
    })
  } catch (err) {
    console.error('Vmq config error:', err)
    return error('获取失败')
  }
}
