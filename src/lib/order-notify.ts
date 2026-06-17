// 订单留言外推通知：买家在订单内发来消息时，POST 到配置的 webhook 地址。
// 通过环境变量 ORDER_MSG_WEBHOOK_URL 配置（留空则不推送）。
// 为兼容大多数 webhook 接收端（自建接口 / SmsForwarder / Server酱 等），
// 同时附带多种常见字段名（text/content/desp/message）的人类可读文案。
// 注：钉钉/企业微信群机器人需要特定的嵌套格式，如使用请告知以单独适配。
//
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

  // 多字段兼容：text / content / desp / message + 结构化字段
  const body = {
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

  // 不 await：避免拖慢买家发送响应
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((e) => {
    console.error('[order-notify] webhook 推送失败', e)
  })
}
