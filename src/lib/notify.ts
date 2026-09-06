/**
 * 站点动态外推通知（企业微信群机器人为主）。
 *
 * 地址：WECOM_WEBHOOK_URL，未设则回落到旧的 ORDER_MSG_WEBHOOK_URL（保持既有配置可用）。
 * 事件开关：NOTIFY_EVENTS，逗号分隔的事件名白名单，留空 = 全开。
 *
 * 自动识别接收端格式：
 *  - 企业微信群机器人 (qyapi.weixin.qq.com)：{msgtype:"markdown", markdown:{content}}
 *  - 钉钉群机器人      (oapi.dingtalk.com)  ：{msgtype:"text", text:{content}}
 *  - 其它（自建/Server酱/Bark 等）         ：通用 JSON
 *
 * 两个坑：
 *  ① 企业微信/钉钉对任何请求都返回 HTTP 200，真正的成败在返回体的 errcode
 *  ② 全部 fire-and-forget，绝不 await、绝不抛出 —— 通知挂了不能拖慢或中断交易主流程
 */

import { quickReplyUrl } from './quick-reply'

export type NotifyEvent =
  | 'order.created'
  | 'order.paid'
  | 'order.delivered'
  | 'invoice.submitted'
  | 'invoice.paid'
  | 'receipt.created'
  | 'message.buyer'
  | 'stock.low'
  | 'user.registered'

const EVENT_LABELS: Record<NotifyEvent, { emoji: string; title: string }> = {
  'order.created': { emoji: '🛒', title: '新订单' },
  'order.paid': { emoji: '💰', title: '订单已支付' },
  'order.delivered': { emoji: '📦', title: '订单已交付' },
  'invoice.submitted': { emoji: '🧾', title: '新的开票申请' },
  'invoice.paid': { emoji: '✅', title: '发票税费已支付' },
  'receipt.created': { emoji: '📄', title: '新开具收据' },
  'message.buyer': { emoji: '🔔', title: '新订单留言' },
  'stock.low': { emoji: '⚠️', title: '库存告警' },
  'user.registered': { emoji: '👤', title: '新用户注册' },
}

function webhookUrl(): string {
  return process.env.WECOM_WEBHOOK_URL || process.env.ORDER_MSG_WEBHOOK_URL || ''
}

export function notifyConfigured(): boolean {
  return !!webhookUrl()
}

function eventEnabled(ev: NotifyEvent): boolean {
  const raw = (process.env.NOTIFY_EVENTS || '').trim()
  if (!raw) return true // 未配置 = 全开
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(ev)
}

function adminBase(): string {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
}

/** 北京时间，格式 2026-09-06 14:32 */
export function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const t = typeof d === 'string' ? new Date(d) : d
  if (isNaN(t.getTime())) return '—'
  return t.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function money(n: unknown): string {
  const v = Number(n)
  return isFinite(v) ? `¥${v.toFixed(2)}` : '—'
}

/** 库存展示：-1 是「无限库存」的约定值 */
export function stockText(stock: number | null | undefined): string {
  if (stock == null) return '—'
  if (stock < 0) return '不限'
  if (stock === 0) return '0（已售罄）'
  return String(stock)
}

export interface NotifyRow {
  label: string
  value: string
  /** 企业微信 markdown 里高亮：warning 橙 / info 蓝 / comment 灰 */
  color?: 'warning' | 'info' | 'comment'
}

/**
 * 发送一条通知。fire-and-forget，不返回 Promise，调用方不需要也不应该 await。
 */
export function notify(
  event: NotifyEvent,
  rows: NotifyRow[],
  opts?: { link?: string; linkText?: string; extraTitle?: string }
): void {
  const url = webhookUrl()
  if (!url) return
  if (!eventEnabled(event)) return

  let host = ''
  try {
    host = new URL(url).host
  } catch {
    console.error('[notify] webhook 地址不合法:', url)
    return
  }

  const meta = EVENT_LABELS[event]
  const title = `${meta.emoji} ${meta.title}${opts?.extraTitle ? ' · ' + opts.extraTitle : ''}`
  const link = opts?.link ? (opts.link.startsWith('http') ? opts.link : `${adminBase()}${opts.link}`) : ''
  const linkText = opts?.linkText || '前往后台处理'

  const plain =
    `${title}\n` +
    rows.map((r) => `${r.label}：${r.value}`).join('\n') +
    (link ? `\n${linkText}：${link}` : '')

  let body: Record<string, unknown>
  if (host.includes('qyapi.weixin.qq.com')) {
    const md =
      `## ${title}\n` +
      rows
        .map((r) =>
          r.color
            ? `**${r.label}**：<font color="${r.color}">${r.value}</font>`
            : `**${r.label}**：${r.value}`
        )
        .join('\n') +
      (link ? `\n[${linkText}](${link})` : '')
    body = { msgtype: 'markdown', markdown: { content: md } }
  } else if (host.includes('oapi.dingtalk.com')) {
    body = { msgtype: 'text', text: { content: plain } }
  } else {
    body = {
      event,
      title,
      text: plain,
      content: plain,
      desp: plain,
      data: Object.fromEntries(rows.map((r) => [r.label, r.value])),
      url: link,
    }
  }

  const started = Date.now()
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  })
    .then(async (res) => {
      const respText = await res.text().catch(() => '')
      let errcode: number | undefined
      try {
        errcode = JSON.parse(respText)?.errcode
      } catch {
        /* 非 JSON 返回（自建接口）忽略 */
      }
      const ok = res.ok && (errcode === undefined || errcode === 0)
      if (ok) {
        console.log(`[notify] ${event} 已送达 (${Date.now() - started}ms)`)
      } else {
        console.error(`[notify] ${event} 被拒 http=${res.status} errcode=${errcode} resp=${respText.slice(0, 300)}`)
      }
    })
    .catch((e) => {
      // undici 的 "fetch failed" 真正原因在 e.cause 里（ENOTFOUND / ECONNREFUSED / 证书等）
      const cause = (e as { cause?: unknown }).cause
      console.error(`[notify] ${event} 推送失败`, e?.message || e, 'cause=', cause)
    })
}

// ---------------- 各事件的组装 ----------------

export function notifyOrderCreated(p: {
  orderNo: string
  buyer: string
  productName: string
  quantity: number
  amount: unknown
  createdAt: Date
  stock: number | null
}): void {
  notify(
    'order.created',
    [
      { label: '订单号', value: p.orderNo },
      { label: '用户', value: p.buyer },
      { label: '商品', value: `${p.productName}${p.quantity > 1 ? ` × ${p.quantity}` : ''}` },
      { label: '金额', value: money(p.amount), color: 'warning' },
      { label: '下单时间', value: fmtTime(p.createdAt) },
      { label: '剩余库存', value: stockText(p.stock), color: p.stock != null && p.stock >= 0 && p.stock <= 3 ? 'warning' : undefined },
    ],
    { link: '/admin/orders', extraTitle: p.productName }
  )
}

export function notifyOrderPaid(p: {
  orderNo: string
  buyer: string
  productName: string
  quantity: number
  amount: unknown
  paidAt: Date
  stock: number | null
  delivered: boolean
}): void {
  notify(
    'order.paid',
    [
      { label: '订单号', value: p.orderNo },
      { label: '用户', value: p.buyer },
      { label: '商品', value: `${p.productName}${p.quantity > 1 ? ` × ${p.quantity}` : ''}` },
      { label: '金额', value: money(p.amount), color: 'warning' },
      { label: '支付时间', value: fmtTime(p.paidAt) },
      { label: '发货', value: p.delivered ? '已自动发货' : '待人工处理', color: p.delivered ? 'info' : 'warning' },
      { label: '剩余库存', value: stockText(p.stock), color: p.stock != null && p.stock >= 0 && p.stock <= 3 ? 'warning' : undefined },
    ],
    { link: '/admin/orders', extraTitle: p.productName }
  )
}

/**
 * 发票可开具通知。
 *
 * 刻意不在「买家提交申请」时推送——那时税费还没付、申请不一定成立，
 * 推了只会制造一批需要人工判断「这单到底付没付」的噪音。
 * 只在税费到账时推一次，并且一次给全：本单完整信息 + 当前所有待开清单 +
 * 一条财务可直接操作的链接。
 */
export interface PendingInvoiceBrief {
  invoiceNo: string
  title: string
  subscriptionType: string
  invoiceAmount: number | null
}

export function notifyInvoiceReady(p: {
  invoiceNo: string
  title: string
  taxNumber: string | null
  showAiWording: boolean | null
  subscriptionType: string
  invoiceAmount: unknown
  taxFee: unknown
  email: string | null
  paidAt: Date
  pending: PendingInvoiceBrief[]
  financeUrl: string
}): void {
  const rows: NotifyRow[] = [
    { label: '发票号', value: p.invoiceNo },
    { label: '抬头', value: p.title },
    { label: '税号', value: p.taxNumber || '—' },
    {
      label: '展示 ChatGPT/Claude 字眼',
      value: p.showAiWording == null ? '未选择' : p.showAiWording ? '展示' : '不展示',
      color: p.showAiWording === false ? 'warning' : undefined,
    },
    { label: '商品', value: p.subscriptionType },
    { label: '开票金额（含税）', value: money(p.invoiceAmount), color: 'warning' },
    { label: '已付税费', value: money(p.taxFee) },
    { label: '接收邮箱', value: p.email || '—' },
    { label: '税费到账时间', value: fmtTime(p.paidAt) },
  ]

  // 待开清单：让财务一眼看清还有多少张要开，不用回翻历史消息逐条数
  if (p.pending.length) {
    rows.push({ label: '当前待开发票', value: `${p.pending.length} 张`, color: 'warning' })
    const lines = p.pending
      .slice(0, 8)
      .map((x, i) => `${i + 1}. ${x.invoiceNo} · ${x.title} · ${money(x.invoiceAmount)}`)
      .join('\n')
    const more = p.pending.length > 8 ? `\n… 另有 ${p.pending.length - 8} 张，见链接` : ''
    rows.push({ label: '清单', value: '\n' + lines + more })
  } else {
    rows.push({ label: '当前待开发票', value: '仅本张' })
  }

  notify('invoice.paid', rows, { link: p.financeUrl, linkText: '财务开票台（查看全部并标记已开）' })
}

export function notifyReceiptCreated(p: {
  receiptNo: string
  payerTitle: string
  amount: unknown
  source: string
  account?: string | null
  createdAt: Date
}): void {
  notify(
    'receipt.created',
    [
      { label: '收据号', value: p.receiptNo },
      { label: '付款人', value: p.payerTitle },
      { label: '金额', value: money(p.amount), color: 'warning' },
      { label: '来源', value: p.source === 'MANUAL' ? '手动开具' : '买家提交' },
      ...(p.account ? [{ label: '账户', value: p.account }] : []),
      { label: '开具时间', value: fmtTime(p.createdAt) },
    ],
    { link: '/admin/receipts', linkText: '查看收据' }
  )
}

export function notifyBuyerMessage(p: {
  orderId: number
  orderNo: string
  productName: string
  buyer: string
  content: string
}): void {
  // 群机器人是单向的（只能发、收不到群里的回复），所以带一条免登录的快捷回复链接：
  // 在企微里看到留言 → 点链接 → 手机端直接回，客户在订单页立刻看到。
  let link = '/admin/orders'
  let linkText = '前往后台处理'
  try {
    link = quickReplyUrl(p.orderId)
    linkText = '点此直接回复'
  } catch {
    /* JWT_SECRET 未配置时签不出令牌，回落到后台链接 */
  }
  notify(
    'message.buyer',
    [
      { label: '商品', value: p.productName },
      { label: '订单号', value: p.orderNo },
      { label: '买家', value: p.buyer },
      { label: '内容', value: p.content, color: 'warning' },
    ],
    { link, linkText }
  )
}

export function notifyLowStock(p: { productName: string; stock: number; threshold: number }): void {
  notify(
    'stock.low',
    [
      { label: '商品', value: p.productName },
      { label: '剩余库存', value: String(p.stock), color: 'warning' },
      { label: '告警阈值', value: String(p.threshold) },
    ],
    { link: '/admin/cardkeys', linkText: '前往补货' }
  )
}

export function notifyUserRegistered(p: { email: string; nickname: string | null; createdAt: Date }): void {
  notify(
    'user.registered',
    [
      { label: '邮箱', value: p.email },
      { label: '昵称', value: p.nickname || '—' },
      { label: '注册时间', value: fmtTime(p.createdAt) },
    ],
    { link: '/admin/users', linkText: '查看用户' }
  )
}
