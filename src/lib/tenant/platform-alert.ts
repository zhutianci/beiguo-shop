/**
 * 平台（站长）企业微信群告警：渠道单快照断言失败、售价低于进货价被拦、升级给站长、申请全局封禁、对账失败等（设计 8.1、10.12）。
 *
 * 与 lib/notify.ts 用同一个群（WECOM_WEBHOOK_URL，未设则 ORDER_MSG_WEBHOOK_URL）。不复用 notify()：
 * 它的事件名是封闭的联合类型（归 WP3 所有），渠道告警是自由文本，这里单独发一条 markdown / text。
 *
 * 【永不抛】告警失败只写日志，绝不能中断调用方的业务流程（计提永不抛、下单拒单时的附带告警等）。
 * 调用方可以 await（最多等 8 秒），也可以不 await（fire-and-forget）。
 * 这是平台群，可以带订单号与渠道 code；不要带买家邮箱与卡密（群里成员不止站长一人）。
 */

function webhookUrl(): string {
  return (process.env.WECOM_WEBHOOK_URL || process.env.ORDER_MSG_WEBHOOK_URL || '').trim()
}

export async function alertPlatform(text: string): Promise<void> {
  try {
    const msg = `【渠道告警】${String(text ?? '').slice(0, 1500)}`
    console.warn('[platform-alert]', msg)
    const url = webhookUrl()
    if (!url) return
    let host = ''
    try {
      host = new URL(url).host
    } catch {
      console.error('[platform-alert] webhook 地址不合法')
      return
    }
    const body = host.includes('qyapi.weixin.qq.com')
      ? { msgtype: 'markdown', markdown: { content: msg } }
      : host.includes('oapi.dingtalk.com')
        ? { msgtype: 'text', text: { content: msg } }
        : { event: 'tenant.alert', title: '渠道告警', text: msg, content: msg }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    const respText = await res.text().catch(() => '')
    let errcode: number | undefined
    try {
      errcode = JSON.parse(respText)?.errcode
    } catch {
      /* 非 JSON 返回忽略 */
    }
    // 企业微信 / 钉钉对任何请求都回 200，成败在 errcode
    if (!res.ok || (errcode !== undefined && errcode !== 0)) {
      console.error(`[platform-alert] 推送被拒 http=${res.status} errcode=${errcode} resp=${respText.slice(0, 200)}`)
    }
  } catch (e) {
    console.error('[platform-alert] 推送失败', (e as Error)?.message || e)
  }
}
