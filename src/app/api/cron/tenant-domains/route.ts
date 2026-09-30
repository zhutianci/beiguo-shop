export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { runDomainHealthCheck } from '@/lib/tenant/domain-verify'

/**
 * 渠道自定义主域名复验（docs/多渠道分销-自定义域名.md 第 9 节；cron 每 10 分钟，POST + x-cron-secret 头）。
 * 主域名是客户自己的域名（tibo.pw）、且没有停业的每个渠道，经公网校验一次「域名仍接在本站」：连续两趟失败 → 店面自动改用子域名
 * （邮件、链接、跳转）+ 平台企业微信告警 + 渠道站内通知；连续两趟成功后自动切回（告警各自 6 小时最多一次）。
 * 没有这类渠道时一次请求都不发、几毫秒返回。探测期间记录被站长改动的渠道本趟放弃写入（items[].skipped，日志里有一行）。
 * 响应只回每个域名通过与否与状态变化，不回校验细节以外的任何配置。
 */
export async function POST(request: NextRequest) {
  const auth = assertCronAuth(request)
  if (!auth.ok) return error(auth.message, auth.status)
  try {
    const r = await runDomainHealthCheck()
    const bad = r.items.filter((i) => !i.healthy)
    if (bad.length) console.warn('[cron/tenant-domains] 不健康', JSON.stringify(bad.map((i) => ({ code: i.code, host: i.host, reason: i.reason }))))
    return success({ at: r.at, total: r.items.length, items: r.items.map((i) => ({ code: i.code, host: i.host, ok: i.ok, healthy: i.healthy, event: i.event, skipped: !!i.skipped })) })
  } catch (err) {
    console.error('[cron/tenant-domains] 执行失败', err)
    return error('自定义域名复验执行失败', 500)
  }
}
