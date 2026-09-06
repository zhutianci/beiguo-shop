export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { notifyConfigured, fmtTime } from '@/lib/notify'

/**
 * 发一条测试消息到企业微信群机器人。
 *
 * 不能复用 lib/notify 的 fire-and-forget 通道——那个刻意不返回结果（交易主流程不能被通知拖慢），
 * 而这里恰恰需要把真实的送达结果告诉管理员。企业微信对任何请求都返回 HTTP 200，
 * 所以必须解析返回体的 errcode 才知道是不是真的成功。
 */
export async function POST() {
  if (!notifyConfigured()) {
    return error('未配置 WECOM_WEBHOOK_URL（或旧的 ORDER_MSG_WEBHOOK_URL）', 400)
  }
  const url = process.env.WECOM_WEBHOOK_URL || process.env.ORDER_MSG_WEBHOOK_URL || ''

  let host = ''
  try {
    host = new URL(url).host
  } catch {
    return error('webhook 地址不是合法 URL')
  }

  const now = new Date()
  const md =
    `## ✅ 贝果科技 · 通知联通测试\n` +
    `**时间**：${fmtTime(now)}\n` +
    `**说明**：<font color="info">看到这条说明群机器人已接通</font>\n` +
    `后续会推送：下单、支付、开票申请、税费到账、收据、买家留言、卡密库存告警、新用户注册`
  const plain = `贝果科技 · 通知联通测试\n时间：${fmtTime(now)}\n看到这条说明群机器人已接通。`

  const body = host.includes('qyapi.weixin.qq.com')
    ? { msgtype: 'markdown', markdown: { content: md } }
    : host.includes('oapi.dingtalk.com')
      ? { msgtype: 'text', text: { content: plain } }
      : { title: '通知联通测试', text: plain, content: plain, desp: plain }

  const started = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    const respText = await res.text().catch(() => '')
    let errcode: number | undefined
    let errmsg: string | undefined
    try {
      const j = JSON.parse(respText)
      errcode = j?.errcode
      errmsg = j?.errmsg
    } catch {
      /* 自建接口可能不返回 JSON */
    }

    const ok = res.ok && (errcode === undefined || errcode === 0)
    if (!ok) {
      return error(
        `推送被拒：HTTP ${res.status}${errcode !== undefined ? ` errcode=${errcode}` : ''}${errmsg ? ` ${errmsg}` : ''}`,
        502
      )
    }
    return success({ host, ms: Date.now() - started }, `已发送，请查看群消息（${Date.now() - started}ms）`)
  } catch (e) {
    const cause = (e as { cause?: { code?: string } })?.cause
    const msg = e instanceof Error ? e.message : String(e)
    return error(`推送失败：${msg}${cause?.code ? `（${cause.code}）` : ''}`, 502)
  }
}
