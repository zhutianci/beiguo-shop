// 订单留言外推通知：买家在订单内发来消息时，POST 到配置的 webhook 地址。
// 通过环境变量 ORDER_MSG_WEBHOOK_URL 配置（留空则不推送）。
//
// 自动识别接收端并采用其专属格式：
//  - 企业微信群机器人 (qyapi.weixin.qq.com)：{msgtype:"markdown", markdown:{content}}
//  - 钉钉群机器人      (oapi.dingtalk.com)   ：{msgtype:"text", text:{content}}
//  - 其它（自建/Server酱/Bark 等）          ：通用 JSON，含 text/content/desp/message
//
// 注意：企业微信/钉钉对任何请求都返回 HTTP 200，真正成败看返回体 errcode。
// 失败不抛出、不阻塞留言主流程（fire-and-forget）。

interface NotifyPayload {
  orderId: number
  orderNo: string
  productName: string
  buyer: string
  content: string
}

export function notifyBuyerMessage(p: NotifyPayload): void {
  const url = process.env.ORDER_MSG_WEBHOOK_URL
  if (!url) return

  const base = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const adminUrl = base ? `${base}/admin/orders` : '/admin/orders'

  const title = `🔔 新订单留言 · ${p.productName}`
  const text =
    `${title}\n` +
    `订单号：${p.orderNo}\n` +
    `买家：${p.buyer}\n` +
    `内容：${p.content}\n` +
    `处理：${adminUrl}`

  let host = ''
  try {
    host = new URL(url).host
  } catch {
    console.error('[order-notify] ORDER_MSG_WEBHOOK_URL 不是合法地址:', url)
    return
  }

  let body: Record<string, unknown>
  if (host.includes('qyapi.weixin.qq.com')) {
    // 企业微信群机器人：markdown 格式，链接可点击
    const md =
      `## 🔔 新订单留言\n` +
      `**商品**：${p.productName}\n` +
      `**订单号**：${p.orderNo}\n` +
      `**买家**：${p.buyer}\n` +
      `**内容**：<font color="warning">${p.content}</font>\n` +
      `[点此前往后台处理](${adminUrl})`
    body = { msgtype: 'markdown', markdown: { content: md } }
  } else if (host.includes('oapi.dingtalk.com')) {
    // 钉钉群机器人：text 格式
    body = { msgtype: 'text', text: { content: text } }
  } else {
    // 通用：多字段兼容
    body = {
      title,
      text,
      content: text,
      desp: text,
      message: p.content,
      orderId: p.orderId,
      orderNo: p.orderNo,
      productName: p.productName,
      buyer: p.buyer,
      url: adminUrl,
    }
  }

  // 不 await：避免拖慢买家发送响应
  const started = Date.now()
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  })
    .then(async (res) => {
      const respText = await res.text().catch(() => '')
      // 企业微信/钉钉：errcode===0 才算真成功
      let errcode: number | undefined
      try {
        errcode = JSON.parse(respText)?.errcode
      } catch {
        /* 非 JSON 返回（自建接口）忽略 */
      }
      const ok = res.ok && (errcode === undefined || errcode === 0)
      if (ok) {
        console.log(`[order-notify] webhook 已送达 ${res.status} (${Date.now() - started}ms)`)
      } else {
        console.error(
          `[order-notify] webhook 被拒 http=${res.status} errcode=${errcode} resp=${respText.slice(0, 300)}`
        )
      }
    })
    .catch((e) => {
      // undici 的 "fetch failed" 真正原因在 e.cause 里（ENOTFOUND/ECONNREFUSED/证书等）
      const cause = (e as { cause?: unknown }).cause
      console.error('[order-notify] webhook 推送失败 url=' + url, e?.message || e, 'cause=', cause)
    })
}
