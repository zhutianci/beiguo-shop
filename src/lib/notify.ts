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
  | 'invoice.failed'
  | 'receipt.created'
  | 'message.buyer'
  | 'stock.low'
  | 'user.registered'
  | 'link.applied'
  | 'cardkey.exported'
  | 'lottery.won'
  | 'marketing.started'
  | 'marketing.finished'
  | 'marketing.paused'
  | 'payment.fulfill_failed'
  | 'payment.duplicate'
  | 'vmq.unmatched'

const EVENT_LABELS: Record<NotifyEvent, { emoji: string; title: string }> = {
  'order.created': { emoji: '🛒', title: '新订单' },
  'order.paid': { emoji: '💰', title: '订单已支付' },
  'order.delivered': { emoji: '📦', title: '订单已交付' },
  'invoice.submitted': { emoji: '🧾', title: '新的开票申请' },
  'invoice.paid': { emoji: '✅', title: '发票税费已支付' },
  // 税费已随货款到账、但发票没能落地。默认必须推 —— 不推就没人会发现
  'invoice.failed': { emoji: '🚨', title: '发票落地失败（税费已收）' },
  'receipt.created': { emoji: '📄', title: '新开具收据' },
  'message.buyer': { emoji: '🔔', title: '新订单留言' },
  'stock.low': { emoji: '⚠️', title: '库存告警' },
  'user.registered': { emoji: '👤', title: '新用户注册' },
  'link.applied': { emoji: '🤝', title: '新的友链申请' },
  'cardkey.exported': { emoji: '🔐', title: '卡密被导出' },
  'lottery.won': { emoji: '🧧', title: '下单有奖·有人中奖' },
  'marketing.started': { emoji: '📣', title: '营销邮件开始发送' },
  'marketing.finished': { emoji: '✅', title: '营销邮件发送完成' },
  // 熔断 / 额度用尽 / 反垃圾拒发 / 回执同步中断 —— 默认必须推，否则可能一直停着没人知道
  'marketing.paused': { emoji: '🛑', title: '营销邮件已自动暂停' },
  // 以下三条都是「钱已经进了支付宝、系统却没能自动处理」—— 默认必须推，不推就只剩 docker 日志里的一行
  'payment.fulfill_failed': { emoji: '🚨', title: '到账后履约失败' },
  'payment.duplicate': { emoji: '🚨', title: '疑似重复付款（需人工退款）' },
  'vmq.unmatched': { emoji: '🚨', title: '收款已到账但未匹配订单' },
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
  /**
   * 跳过 notify() 的默认清洗、原样输出（保留换行）。
   * 仅限代码拼装、且内部每一段用户输入都已 mdSafe 过的多行值（目前只有待开发票清单）。绝不能把用户输入原样标 raw
   */
  raw?: boolean
}

// eslint-disable-next-line no-control-regex
const NOTIFY_CTRL_RE = /[\u0000-\u001f\u007f]/g

/**
 * 所有通知值的默认清洗（raw 行除外）。企业微信按 markdown 渲染：值里带换行就能另起一行伪造字段，
 * 带 [ ] 就能伪造可点击链接（昵称填 `[前往后台处理](http://钓鱼)` 就会出现在「新用户注册」卡片里），
 * 带 < > 就能伪造 <font> 高亮。这里只把这几类字符换成全角：没有 [ 就拼不出链接，没有换行 # 和 > 就到不了行首。
 * ( ) _ # * 保留 —— 不用 plainify 那样的全量清洗：商品名里的括号、邮箱里的下划线、抬头里的「(北京)」
 * 都要照常显示，财务照着抄不能抄错。
 * 顺带截断：企业微信 markdown 最多 4096 字节，超了整条推送会被拒（2000 字的留言原来就推不到群里）。
 */
function mdSafe(v: unknown, max = 500): string {
  const s = String(v ?? '')
    .replace(NOTIFY_CTRL_RE, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\[/g, '［')
    .replace(/\]/g, '］')
    .replace(/</g, '＜')
    .replace(/>/g, '＞')
    .replace(/`/g, '｀')
    .trim()
  if (!s) return '—'
  return s.length > max ? s.slice(0, max) + '…' : s
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

  // 【整段 try】notify() 的约定是绝不抛异常：有些调用方（如下单接口的 notifyOrderCreated）没有 try 包住，
  // 这里一抛，已经建好的订单会给买家返回错误
  let body: Record<string, unknown>
  try {
    const safe = rows.map((r) => ({ ...r, value: r.raw ? String(r.value ?? '') : mdSafe(r.value) }))
    const meta = EVENT_LABELS[event]
    const extra = opts?.extraTitle ? mdSafe(opts.extraTitle, 60) : ''
    const title = `${meta.emoji} ${meta.title}${extra ? ' · ' + extra : ''}`
    const link = opts?.link ? (opts.link.startsWith('http') ? opts.link : `${adminBase()}${opts.link}`) : ''
    const linkText = opts?.linkText || '前往后台处理'

    const plain =
      `${title}\n` +
      safe.map((r) => `${r.label}：${r.value}`).join('\n') +
      (link ? `\n${linkText}：${link}` : '')

    if (host.includes('qyapi.weixin.qq.com')) {
      const md =
        `## ${title}\n` +
        safe
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
        data: Object.fromEntries(safe.map((r) => [r.label, r.value])),
        url: link,
      }
    }
  } catch (e) {
    console.error(`[notify] ${event} 组装失败`, e)
    return
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
  /** 商品金额（不含税） */
  amount: unknown
  /** 下单时勾了开票的订单随货款一起收的 6%；没勾为空 */
  invoiceTaxFee?: number | null
  paidAt: Date
  stock: number | null
  delivered: boolean
}): void {
  // 勾了开票的单，支付宝到账的是 货款 + 6%。推送只写货款的话，
  // 老板拿着手机对不上银行流水 —— 拆开写，并标明这一单会自动进待开清单
  const tax = Number(p.invoiceTaxFee || 0)
  notify(
    'order.paid',
    [
      { label: '订单号', value: p.orderNo },
      { label: '用户', value: p.buyer },
      { label: '商品', value: `${p.productName}${p.quantity > 1 ? ` × ${p.quantity}` : ''}` },
      ...(tax > 0
        ? [
            { label: '商品金额', value: money(p.amount) },
            { label: '发票税费', value: money(tax), color: 'info' as const },
            { label: '实收金额', value: money(Number(p.amount) + tax), color: 'warning' as const },
            { label: '开票', value: '已随单提交，见待开清单', color: 'info' as const },
          ]
        : [{ label: '金额', value: money(p.amount), color: 'warning' as const }]),
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

/**
 * 「税费收到了，但发票没能落地」告警。
 *
 * 开票落地被刻意包在 try 里，绝不能影响已经完成的发货。代价是失败会静默：
 * 钱进了支付宝、invoices 表里没有行、财务台看不到、买家订单页却显示「已提交开票」。
 * 没有这条推送，就没有任何一方会发现。
 */
export function notifyInvoiceFailed(p: {
  orderNo: string
  taxFee: unknown
  reason: string
}): void {
  notify(
    'invoice.failed',
    [
      { label: '订单号', value: p.orderNo },
      { label: '已收税费', value: money(p.taxFee), color: 'warning' },
      { label: '原因', value: p.reason.slice(0, 200), color: 'warning' },
      { label: '处理', value: '到「订单管理」重新保存该订单即可重试落地' },
    ],
    { link: '/admin/orders', extraTitle: '发票落地失败' }
  )
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
      // 抬头是买家填的：逐条单独清洗并限 40 字，整行才能标 raw 保留换行
      .map((x, i) => `${i + 1}. ${mdSafe(x.invoiceNo, 40)} · ${mdSafe(x.title, 40)} · ${money(x.invoiceAmount)}`)
      .join('\n')
    const more = p.pending.length > 8 ? `\n… 另有 ${p.pending.length - 8} 张，见链接` : ''
    rows.push({ label: '清单', value: '\n' + lines + more, raw: true })
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

/**
 * 友链申请里的站名/简介/联系方式全是陌生人填的，而企业微信这一路是按 markdown 渲染的：
 * 一个 `[点我领奖](http://evil)` 就能在管理员群里伪造出一条可点击链接，
 * 后面紧跟着的还是我们自己的「前往后台处理」，可信度拉满。落地前先把语法字符打断。
 */
function plainify(v: string | null | undefined, max = 120): string {
  if (!v) return '—'
  return v
    .replace(/\s+/g, ' ')
    .replace(/[[\]()<>`*_#|]/g, ' ')
    .trim()
    .slice(0, max)
}

/**
 * 地址同样要防注入，但不能像正文那样把 _ # 之类一并抹掉 —— 那些在 URL 里太常见了，
 * 洗完管理员就点不开。只打断构成 markdown 链接语法的那几个字符和空白。
 */
function plainUrl(v: string | null | undefined, max = 300): string {
  if (!v) return '—'
  return v
    .replace(/\s+/g, '')
    .replace(/[[\]()<>`]/g, '')
    .slice(0, max)
}

export function notifyLinkApplied(p: {
  name: string
  url: string
  slot: string
  contact: string | null
  description: string | null
}): void {
  notify(
    'link.applied',
    [
      { label: '站点', value: plainify(p.name, 60) },
      { label: '地址', value: plainUrl(p.url) },
      { label: '申请位置', value: p.slot === 'SPONSOR' ? '招商位' : '友情链接', color: p.slot === 'SPONSOR' ? 'warning' : undefined },
      { label: '联系方式', value: plainify(p.contact, 100) },
      { label: '简介', value: plainify(p.description, 200), color: 'comment' },
    ],
    { link: '/admin/links', linkText: '前往审核' }
  )
}

/**
 * 卡密导出告警。
 *
 * 【为什么导出这种「只读操作」也要推送】导出来的文件里是明文卡密，
 * 等于把一整批商品本体装进一个可以随手转发的 xlsx。后台没有操作日志表，
 * 这条推送就是唯一的痕迹——真出事时，「什么时候被导走过、导了多少」
 * 比任何事后分析都关键。它也是一层威慑：干这件事会留下声响。
 */
export function notifyCardKeyExported(p: {
  operator: string
  count: number
  scope: string
  masked: boolean
  ip: string
  undecryptable: number
  filters: string
}): void {
  const rows = [
    { label: '操作人', value: plainify(p.operator, 100), color: 'warning' as const },
    { label: '范围', value: plainify(p.scope, 60) },
    { label: '数量', value: `${p.count} 张`, color: 'warning' as const },
    { label: '内容', value: p.masked ? '已脱敏' : '含明文卡密', color: (p.masked ? 'comment' : 'warning') as 'comment' | 'warning' },
    { label: '筛选', value: p.filters ? plainify(p.filters, 120) : '无（全量）' },
    // IP 仅参考（已由 nginx 按连接核实，但对应不到具体的人），追责以操作人为准
    { label: '来源 IP', value: plainify(p.ip, 64) },
    { label: '时间', value: fmtTime(new Date()) },
  ]
  if (p.undecryptable > 0) {
    rows.push({ label: '异常', value: `${p.undecryptable} 张无法解密`, color: 'warning' as const })
  }
  notify('cardkey.exported', rows, { link: '/admin/cardkeys', linkText: '查看卡密管理' })
}

/**
 * 下单有奖中奖通知。
 *
 * 券奖项中奖即自动发到买家「我的优惠券」，这条推送只是知会；
 * **自定义奖品**需要人工兑现（后台「抽奖管理」里标记已兑现），不推送就没人知道有人在等奖。
 * 注意：生产若配置了 NOTIFY_EVENTS 白名单，需把 lottery.won 加进去才会推送。
 */
export function notifyLotteryWon(p: { orderNo: string; prizeName: string; prizeLabel: string; prizeType: string }): void {
  const custom = p.prizeType === 'CUSTOM'
  notify(
    'lottery.won',
    [
      { label: '订单号', value: p.orderNo },
      { label: '奖项', value: plainify(p.prizeName, 60), color: 'warning' },
      { label: '内容', value: plainify(p.prizeLabel, 120) },
      {
        label: '处理',
        value: custom ? '自定义奖品，需人工兑现后在后台标记' : '优惠券已自动发放到买家账户',
        color: custom ? 'warning' : 'comment',
      },
      { label: '时间', value: fmtTime(new Date()) },
    ],
    { link: '/admin/lottery', linkText: '查看抽奖管理', extraTitle: p.prizeName }
  )
}

/**
 * 站外客户通过「开票填写链接」提交了开票信息（lib/invoice-request.ts）。
 *
 * 【为什么这里要推，而 notifyInvoiceReady 的注释说「买家提交申请时不推」】那条规矩防的是
 * 「税费还没付、申请不一定成立」的噪音。这条路不一样：金额是管理员自己定的、钱是线下收过的，
 * 客户一提交，发票就以 SUBMITTED + PAID 直接进了待开清单 —— 这一刻就是「可以开票了」。
 *
 * 抬头、税号、邮箱全是陌生人在公开页面上敲的，企业微信按 markdown 渲染，一律先洗掉语法字符
 * （理由见 plainify 的注释）。邮箱用 plainUrl：zod 已经校验过邮箱格式、里面不可能有链接语法，
 * 而 plainify 会把常见的下划线（john_doe@…）抹成空格，管理员照着抄就抄错了。
 * 注意：生产若配置了 NOTIFY_EVENTS 白名单，需包含 invoice.submitted 才会推送。
 */
export function notifyInvoiceRequestSubmitted(p: {
  invoiceNo: string
  title: string
  taxNumber: string
  invoiceAmount: unknown
  showAiWording: boolean
  email: string
}): void {
  notify(
    'invoice.submitted',
    [
      { label: '发票号', value: p.invoiceNo },
      { label: '来源', value: '开票填写链接（站外客户自助填写）' },
      { label: '抬头', value: plainify(p.title, 100) },
      { label: '税号', value: plainify(p.taxNumber, 64) },
      {
        label: '展示 ChatGPT/Claude 字眼',
        value: p.showAiWording ? '展示' : '不展示（只开「技术咨询服务」）',
        color: p.showAiWording ? undefined : 'warning',
      },
      { label: '开票金额（含税）', value: money(p.invoiceAmount), color: 'warning' },
      { label: '接收邮箱', value: plainUrl(p.email, 120) },
      { label: '提交时间', value: fmtTime(new Date()) },
      { label: '状态', value: '已进入待开清单，可随批量导出一起开具', color: 'info' },
    ],
    { link: '/admin/invoices', linkText: '前往发票管理', extraTitle: '开票填写链接' }
  )
}

/**
 * 营销邮件的三类通知：开始 / 完成 / 自动暂停（含全局急停）。只按活动推，绝不按封推。
 * 不带任何收件人邮箱：statusNote 里可能有阿里云原始报错，先经 plainify 截断。
 * 注意：生产若配置了 NOTIFY_EVENTS 白名单，需包含 marketing.started / marketing.finished / marketing.paused。
 */
export function notifyMarketing(
  kind: 'started' | 'finished' | 'paused',
  p: { campaignId: number | null; campaignName?: string | null; rows?: NotifyRow[]; reason?: string | null }
): void {
  const rows: NotifyRow[] = []
  if (p.campaignName) rows.push({ label: '活动', value: plainify(p.campaignName, 60) })
  if (p.campaignId != null) rows.push({ label: '编号', value: '#' + p.campaignId })
  if (p.reason) rows.push({ label: '原因', value: plainify(p.reason, 200), color: 'warning' })
  for (const r of p.rows || []) rows.push({ ...r, value: plainify(r.value, 120) })
  notify(`marketing.${kind}` as NotifyEvent, rows, {
    link: p.campaignId != null ? `/admin/marketing/${p.campaignId}` : '/admin/marketing/settings',
    linkText: '查看营销推广',
  })
}

/**
 * 到账后履约失败 / 到账对账补不上。
 *
 * 钱已经记在收款单上（state=1），订单却可能停在「待支付」：fulfillOrder 抛错（事务超时、连接池耗尽、
 * mysqld 被 OOM 杀掉）时原来只打一行日志，没有任何路径会自动补救。现在由 cron 的 reconcilePaidVmq
 * 在宽限期后补做；这条推送让站长第一时间知道。
 * 注意：生产若配置了 NOTIFY_EVENTS 白名单，需包含 payment.fulfill_failed。
 */
export function notifyFulfillFailed(p: {
  biz: string
  outTradeNo?: string | null
  amount?: unknown
  stage: string
  reason: string
  action: string
}): void {
  notify(
    'payment.fulfill_failed',
    [
      { label: '业务单', value: `${p.outTradeNo || '—'}（${p.biz}）` },
      ...(p.amount != null ? [{ label: '到账金额', value: money(p.amount), color: 'warning' as const }] : []),
      { label: '环节', value: p.stage },
      { label: '原因', value: p.reason.slice(0, 200), color: 'warning' },
      { label: '处理', value: p.action },
    ],
    { link: '/admin/orders', extraTitle: p.outTradeNo || p.biz }
  )
}

const UNMATCHED_TEXT: Record<string, string> = {
  no_pending_match: '到账金额没有对应的待支付单：买家付错了金额，或收款单已过期后才付款',
  closed_while_matching: '匹配到的收款单恰好在同一时刻被关闭（超时或后台取消），未自动履约',
  ambiguous_match: '同一金额同时命中多张待支付收款单，未自动履约',
  duplicate_payment: '钱记到了这张收款单上，但该单此前已付款/已退款，这笔钱没有产生任何履约',
  ambiguous_amount: '同一条通知里出现多个不同的到账金额，未自动取用',
  untrusted_source: '通知带着「成功收款」金额，但来源不是支付宝 App，未自动取用（若手机端刚换过版本/模板，每笔到账都会这样，请尽快核对）',
  maybe_duplicate:
    '10 分钟内同金额刚到过一笔、这次没有待支付单可对：可能是买家扫同一个码付了两次（需退款），也可能是通知被重复转发（核对支付宝账单是否真有两笔）',
}

/**
 * 收款已到账、但系统没有自动处理（lib/vmq.ts 的 recordUnmatched）。每条都会在后台「收款监控 →
 * 待人工核实的到账」里留一行，直到点「标记已处理」。重复付款单独用 payment.duplicate 事件，
 * 便于站长只订阅其中一类。
 * 注意：生产若配置了 NOTIFY_EVENTS 白名单，需包含 vmq.unmatched 与 payment.duplicate。
 */
/**
 * 收款通知 webhook 的 token 校验不通过（app/api/pay/sms-notify）。调用方已按 10 分钟限流。
 * 复用 vmq.unmatched 事件：NOTIFY_EVENTS 白名单里已经为它放行，不必再加一项。
 */
export function notifyWebhookRejected(p: { inQuery: boolean; amount: string | null }): void {
  const rows: NotifyRow[] = [
    {
      label: '情况',
      value: p.inQuery
        ? '手机端转发的收款通知把 token 放在了 URL 上，服务端已不再接受，到账不会自动处理'
        : '收到一条带「成功收款」金额的通知，但 token 校验不通过，未处理',
      color: 'warning',
    },
  ]
  if (p.amount) rows.push({ label: '通知里的金额', value: `¥${p.amount}`, color: 'warning' })
  rows.push({
    label: '处理',
    value: p.inQuery
      ? '把 SmsForwarder 的 token 改放 JSON 请求体（后台「收款监控」有现成配置）并轮换 VMQ_WEBHOOK_TOKEN；已到账的单在后台补单'
      : '核对 SmsForwarder 的 token 与服务器 VMQ_WEBHOOK_TOKEN 是否一致；若是真实到账，在后台补单。不认识的请求可忽略',
  })
  notify('vmq.unmatched', rows, { link: '/admin/vmq', extraTitle: '收款通知被拒' })
}

export function notifyVmqUnmatched(p: {
  reason: string
  price: string
  type: number
  pending?: number[]
  candidates?: string[]
  vmqOrderId?: string
  biz?: string
  outTradeNo?: string
  from?: string | null
  at: number
}): void {
  const dup = p.reason === 'duplicate_payment'
  const rows: NotifyRow[] = [
    { label: '到账金额', value: `¥${p.price}（${p.type === 1 ? '微信' : '支付宝'}）`, color: 'warning' },
    { label: '时间', value: fmtTime(new Date(p.at)) },
    { label: '情况', value: UNMATCHED_TEXT[p.reason] || p.reason, color: 'warning' },
  ]
  if (p.vmqOrderId) rows.push({ label: '收款单', value: `${p.vmqOrderId}${p.biz ? `（${p.biz}）` : ''}` })
  if (p.outTradeNo) rows.push({ label: '业务单号', value: p.outTradeNo })
  if (p.candidates?.length) rows.push({ label: '命中的收款单', value: p.candidates.slice(0, 5).join('、') })
  if (p.reason === 'no_pending_match') rows.push({ label: '当时待支付金额', value: (p.pending || []).slice(0, 20).join(', ') || '无' })
  if (p.from) rows.push({ label: '通知来源', value: p.from })
  rows.push({
    label: '处理',
    value: dup
      ? '核实支付宝账单后联系买家退款，不要点「补单」；处理完在「收款监控」点「标记已处理」'
      : '核实支付宝账单后在「收款监控」补单或退款，再点「标记已处理」',
  })
  notify(dup ? 'payment.duplicate' : 'vmq.unmatched', rows, {
    link: '/admin/vmq',
    extraTitle: dup ? p.outTradeNo || '需人工退款' : '需人工核实',
  })
}
