export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { VMQ_KEY, VMQ_TIMEOUT_MIN, VMQ_REQUIRE_MONITOR, recentVmqOrders, getDiag } from '@/lib/vmq'

// 监控端扫码配置：VmqApk 扫描的二维码内容为 "host/key"
// （App 内部 scanResult.split("/") => tmp[0]=host(纯域名,无 http://), tmp[1]=key）
export async function GET(request: NextRequest) {
  try {
    // 域名：优先用 APP_URL，去掉协议与路径，只留 host[:port]
    let host = ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    try {
      if (appUrl) host = new URL(appUrl).host
    } catch {
      /* ignore */
    }
    if (!host) host = request.headers.get('host') || ''

    const configured = !!VMQ_KEY
    const configString = configured ? `${host}/${VMQ_KEY}` : ''
    let qrSvg = ''
    if (configString) {
      qrSvg = await QRCode.toString(configString, { type: 'svg', margin: 1, width: 240 })
    }

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

    // 监控端状态 + 收款统计
    const [lastHeartS, pendingCount, paidCount, lastPaid] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'vmq_lastheart' } }),
      prisma.vmqOrder.count({ where: { state: 0 } }),
      prisma.vmqOrder.count({ where: { state: 1 } }),
      prisma.vmqOrder.findFirst({ where: { state: 1 }, orderBy: { payDate: 'desc' }, select: { payDate: true } }),
    ])
    const lastHeart = lastHeartS ? Number(lastHeartS.value) : 0
    const alive = lastHeart > 0 && Date.now() - lastHeart < 60_000

    const [recent, diag] = await Promise.all([recentVmqOrders(15), getDiag()])

    return success({
      recent,
      diag,
      webhookUrl,
      webhookToken,
      webhookBody,
      configured,
      host,
      key: VMQ_KEY,
      configString,
      qrSvg,
      timeoutMin: VMQ_TIMEOUT_MIN,
      requireMonitor: VMQ_REQUIRE_MONITOR,
      monitor: {
        alive,
        lastHeartAt: lastHeart ? new Date(lastHeart).toISOString() : null,
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
