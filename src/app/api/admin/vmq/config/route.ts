export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { VMQ_KEY, VMQ_TIMEOUT_MIN, recentVmqOrders, getDiag, listUnmatched } from '@/lib/vmq'
import { adminGuard } from '@/lib/admin-guard'
import { carrierFlags } from '@/lib/wallet/latepay'

// 收款监控配置：到账通知统一走 SmsForwarder → POST /api/pay/sms-notify。
// VmqApk（/appHeart + /appPush + 扫码配置二维码）已移除。
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
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

    // unmatched：待人工核实的到账逐条留存（lib/vmq.ts recordUnmatched），取最近 100 条，页面分「待处理 / 已处理」展示
    const [recent, diag, unmatchedRaw] = await Promise.all([recentVmqOrders(15), getDiag(), listUnmatched(100)])
    // 待处理条目标出「涉及接码单 / 充值单」（docs/短信接码-设计.md §2.7）：这类只能「退入买家余额」或选 OFFLINE / IGNORE 标记，不能「补单」。
    // 查不出来按 false（页面照旧显示；标记接口自己还会再判一次）。
    // 这个接口每 10 秒轮询一次：一批条目一起判（carrierFlags 固定至多 3 条查询），不再逐条各查 5–7 次（B1 评审修复）
    const open = unmatchedRaw.filter((u) => !u.handledAt)
    const flags = await carrierFlags(open).catch((e) => {
      console.error('[vmq] 待核实条目的载体判断失败（按 false 显示）', e)
      return open.map(() => false)
    })
    const flagOf = new Map(open.map((u, i) => [u.key, flags[i]]))
    const unmatched = unmatchedRaw.map((u) => (u.handledAt ? u : { ...u, carrier: flagOf.get(u.key) ?? false }))

    return success({
      recent,
      diag,
      unmatched,
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
