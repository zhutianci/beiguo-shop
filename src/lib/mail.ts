import { sendSystemEmail, systemEmailConfigured } from './aliyun'

export { systemEmailConfigured }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
const BRAND = '贝果科技'

// 统一邮件外壳
function layout(title: string, bodyHtml: string): string {
  return `<div style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #eceef1;">
    <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:20px 24px;color:#fff;">
      <div style="font-size:18px;font-weight:700;">${BRAND}</div>
      <div style="font-size:13px;opacity:.9;margin-top:2px;">${title}</div>
    </div>
    <div style="padding:24px;color:#1f2937;font-size:14px;line-height:1.7;">
      ${bodyHtml}
    </div>
    <div style="padding:14px 24px;background:#fafbfc;color:#9ca3af;font-size:12px;border-top:1px solid #eceef1;">
      本邮件由系统自动发送，请勿直接回复。 · <a href="${APP_URL}" style="color:#7c3aed;text-decoration:none;">${APP_URL.replace(/^https?:\/\//, '')}</a>
    </div>
  </div>
</div>`
}

const PURPOSE_LABEL: Record<string, string> = {
  REGISTER: '注册验证',
  RESET: '找回密码',
  LOOKUP: '订阅查询',
}

// 每封信都拆成「纯渲染 render* + 发送 send*」：scripts/check-transactional-mail.ts 用样例数据渲染，
// 断言正文不含阿里云禁发内容（微信/QQ/二维码/群/网盘）—— 联系客服一律写「在订单内联系客服」或站内 /support。
interface RenderedMail {
  subject: string
  html: string
}

// 验证码邮件
export function renderVerifyCodeEmail(code: string, purpose: 'REGISTER' | 'RESET' | 'LOOKUP'): RenderedMail {
  const label = PURPOSE_LABEL[purpose] || '身份验证'
  const html = layout(
    `${label}验证码`,
    `<p>您正在进行<strong>${label}</strong>操作，验证码为：</p>
     <div style="margin:18px 0;text-align:center;">
       <span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#7c3aed;background:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;padding:12px 22px;">${code}</span>
     </div>
     <p style="color:#6b7280;">验证码 10 分钟内有效，请勿泄露给他人。如非本人操作请忽略本邮件。</p>`
  )
  return { subject: `【${BRAND}】${label}验证码：${code}`, html }
}

export async function sendVerifyCodeEmail(to: string, code: string, purpose: 'REGISTER' | 'RESET' | 'LOOKUP') {
  const { subject, html } = renderVerifyCodeEmail(code, purpose)
  return sendSystemEmail(to, subject, html)
}

/*
 * 【防枚举的两封说明信】发码接口对「注册时邮箱已存在」「找回密码时邮箱不存在」两种情况，
 * 以前分别直接返回「该邮箱已被注册」与另一句文案——一次请求就能判断一个邮箱是不是本站客户。
 * 现在四种情况都恰好发出一封信、返回同一句话（时延也一样），只在邮箱本人能看到的信里说明实情。
 * 文案不能出现微信/QQ/群等（阿里云禁发，见 scripts/check-transactional-mail.ts）。
 */
export function renderAccountExistsEmail(): RenderedMail {
  const html = layout(
    '注册提醒',
    `<p>有人（可能是你本人）正在用这个邮箱注册${BRAND}账号，但<strong>这个邮箱已经注册过了</strong>，所以没有发送验证码。</p>
     <p>请直接 <a href="${APP_URL}/login" style="color:#7c3aed;">登录</a>；如果忘记了密码，可以 <a href="${APP_URL}/forgot-password" style="color:#7c3aed;">找回密码</a>。</p>
     <p style="color:#6b7280;">如非本人操作请忽略本邮件，你的账号不会有任何变化。</p>`
  )
  return { subject: `【${BRAND}】该邮箱已注册，请直接登录`, html }
}

export async function sendAccountExistsEmail(to: string) {
  const { subject, html } = renderAccountExistsEmail()
  return sendSystemEmail(to, subject, html)
}

export function renderNoAccountEmail(): RenderedMail {
  const html = layout(
    '找回密码提醒',
    `<p>有人（可能是你本人）申请找回${BRAND}账号的密码，但<strong>本站没有用这个邮箱注册的账号</strong>。</p>
     <p>如果你注册时用的是别的邮箱，请换那个邮箱再试；也可以 <a href="${APP_URL}/register" style="color:#7c3aed;">直接注册</a>。</p>
     <p style="color:#6b7280;">如非本人操作请忽略本邮件。</p>`
  )
  return { subject: `【${BRAND}】找回密码提醒`, html }
}

export async function sendNoAccountEmail(to: string) {
  const { subject, html } = renderNoAccountEmail()
  return sendSystemEmail(to, subject, html)
}

/** 「邮箱查订阅」发码时该邮箱没有任何订阅记录：照样发一封信（与有记录时时延一致、返回同一句话），不发码 */
export function renderNoSubscriptionEmail(): RenderedMail {
  const html = layout(
    '订阅查询提醒',
    `<p>有人（可能是你本人）在${BRAND}申请查询这个邮箱的订阅记录，但<strong>本站没有这个邮箱的订阅记录</strong>，所以没有发送验证码。</p>
     <p>如果你购买时填写的是别的账户邮箱，请换那个邮箱再查；刚下单的订单记录可能需要一段时间才会更新。</p>
     <p style="color:#6b7280;">如非本人操作请忽略本邮件。</p>`
  )
  return { subject: `【${BRAND}】订阅查询提醒`, html }
}

export async function sendNoSubscriptionEmail(to: string) {
  const { subject, html } = renderNoSubscriptionEmail()
  return sendSystemEmail(to, subject, html)
}

interface OrderInfo {
  orderNo: string
  productName: string
  /** 商品金额（不含税） */
  amount: number | string
  /** 下单时勾了「同时开发票」的订单，随货款一起收的 6%；没勾为空 */
  invoiceTaxFee?: number | null
  deliveryType?: string | null
  cards?: string[]
  cardUsage?: string | null
  deliveryInfo?: string | null
}

// 订单已支付通知
export function renderOrderPaidEmail(o: OrderInfo): RenderedMail {
  /*
   * 【勾了开票的订单要拆成三行】这封邮件和支付宝账单是买家拿去报销的同一套材料。
   * 「实付金额」若只写不含税的货款，就和他账单上的数字差 6% —— 让报销材料自洽
   * 正是这次改造的出发点，不能在最后一步把它弄丢。
   */
  const tax = Number(o.invoiceTaxFee || 0)
  const rows = `
    <tr><td style="color:#6b7280;padding:4px 0;">订单号</td><td style="text-align:right;font-family:monospace;">${o.orderNo}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0;">商品</td><td style="text-align:right;">${o.productName}</td></tr>
    ${
      tax > 0
        ? `<tr><td style="color:#6b7280;padding:4px 0;">商品金额</td><td style="text-align:right;">¥${Number(o.amount).toFixed(2)}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0;">发票税费（6%）</td><td style="text-align:right;">¥${tax.toFixed(2)}</td></tr>`
        : ''
    }
    <tr><td style="color:#6b7280;padding:4px 0;">实付金额</td><td style="text-align:right;font-weight:700;">¥${(Number(o.amount) + tax).toFixed(2)}</td></tr>
    ${
      tax > 0
        ? `<tr><td colspan="2" style="color:#9ca3af;font-size:12px;padding-top:6px;">发票申请已随本单提交，开具后会发到你填写的接收邮箱。</td></tr>`
        : ''
    }`

  let extra = ''
  if (o.deliveryType === 'AUTO' && o.cards && o.cards.length) {
    extra = `<div style="margin-top:16px;"><div style="font-weight:600;margin-bottom:6px;">卡密（请妥善保管）</div>
      ${o.cards
        .map((c) => `<div style="font-family:monospace;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;margin:6px 0;word-break:break-all;">${escapeHtml(c)}</div>`)
        .join('')}
      ${o.cardUsage ? `<div style="margin-top:10px;color:#6b7280;white-space:pre-wrap;">${escapeHtml(o.cardUsage)}</div>` : ''}</div>`
  } else if (o.deliveryType === 'SMS') {
    extra = `<p style="margin-top:14px;color:#6b7280;">本商品为短信接码，请到「我的订单 → 订单详情」查看号码并接收验证码。</p>`
  } else {
    extra = `<p style="margin-top:14px;color:#6b7280;">我们正在为您处理/开通，完成后会通过本邮箱通知您；如有疑问可在订单内联系客服。</p>`
  }

  const html = layout(
    '支付成功通知',
    `<p>您的订单已支付成功，详情如下：</p>
     <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows}</table>
     ${extra}
     <div style="margin-top:18px;"><a href="${APP_URL}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`
  )
  return { subject: `【${BRAND}】订单支付成功 · ${o.productName}`, html }
}

export async function sendOrderPaidEmail(to: string, o: OrderInfo) {
  const { subject, html } = renderOrderPaidEmail(o)
  return sendSystemEmail(to, subject, html)
}

// 订单已发货/已完成通知（手工发货交付时）
export function renderOrderDeliveredEmail(o: OrderInfo): RenderedMail {
  const html = layout(
    '订单已交付',
    `<p>您的订单已交付完成：</p>
     <table style="width:100%;border-collapse:collapse;margin-top:8px;">
       <tr><td style="color:#6b7280;padding:4px 0;">订单号</td><td style="text-align:right;font-family:monospace;">${o.orderNo}</td></tr>
       <tr><td style="color:#6b7280;padding:4px 0;">商品</td><td style="text-align:right;">${o.productName}</td></tr>
     </table>
     ${o.deliveryInfo ? `<div style="margin-top:14px;"><div style="font-weight:600;margin-bottom:6px;">交付信息</div><div style="font-family:monospace;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(o.deliveryInfo)}</div></div>` : ''}
     <div style="margin-top:18px;"><a href="${APP_URL}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`
  )
  return { subject: `【${BRAND}】订单已交付 · ${o.productName}`, html }
}

export async function sendOrderDeliveredEmail(to: string, o: OrderInfo) {
  const { subject, html } = renderOrderDeliveredEmail(o)
  return sendSystemEmail(to, subject, html)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// 发票已开具通知。
// 特意提醒查看垃圾箱：发票邮件常带附件与「发票」字样，是垃圾箱的常客，
// 客户找不到就会来问客服，等于把成本转回给自己。
export interface InvoiceIssuedInfo {
  invoiceNo: string
  title: string
  taxNumber: string | null
  subscriptionType: string
  invoiceAmount: number | null
  issuedAt: Date
}

export function renderInvoiceIssuedEmail(iv: InvoiceIssuedInfo): RenderedMail {
  const row = (k: string, v: string) =>
    `<tr><td style="color:#6b7280;padding:4px 0;">${k}</td><td style="text-align:right;">${v}</td></tr>`
  const rows =
    row('发票号', `<span style="font-family:monospace;">${escapeHtml(iv.invoiceNo)}</span>`) +
    row('抬头', escapeHtml(iv.title)) +
    (iv.taxNumber ? row('税号', `<span style="font-family:monospace;">${escapeHtml(iv.taxNumber)}</span>`) : '') +
    row('项目', escapeHtml(iv.subscriptionType)) +
    (iv.invoiceAmount != null
      ? row('开票金额（含税）', `<b>¥${Number(iv.invoiceAmount).toFixed(2)}</b>`)
      : '') +
    row(
      '开具时间',
      iv.issuedAt.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    )

  const html = layout(
    '发票已开具',
    `<p>您申请的发票已开具完成，详情如下：</p>
     <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows}</table>
     <div style="margin-top:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;color:#92400e;">
       <div style="font-weight:600;margin-bottom:4px;">没收到发票邮件？</div>
       电子发票会由开票系统单独发送到本邮箱。若收件箱里没有，请检查
       <b>垃圾邮件 / 广告邮件 / 促销</b> 分类，并搜索关键词「发票」或本发票号。
       仍未找到可在订单内联系客服，我们会重新发送。
     </div>
     <div style="margin-top:18px;"><a href="${APP_URL}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`
  )
  return { subject: `【${BRAND}】发票已开具 · ${iv.invoiceNo}`, html }
}

export async function sendInvoiceIssuedEmail(to: string, iv: InvoiceIssuedInfo) {
  const { subject, html } = renderInvoiceIssuedEmail(iv)
  return sendSystemEmail(to, subject, html)
}
