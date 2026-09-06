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
}

// 验证码邮件
export async function sendVerifyCodeEmail(to: string, code: string, purpose: 'REGISTER' | 'RESET') {
  const label = PURPOSE_LABEL[purpose] || '身份验证'
  const html = layout(
    `${label}验证码`,
    `<p>您正在进行<strong>${label}</strong>操作，验证码为：</p>
     <div style="margin:18px 0;text-align:center;">
       <span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#7c3aed;background:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;padding:12px 22px;">${code}</span>
     </div>
     <p style="color:#6b7280;">验证码 10 分钟内有效，请勿泄露给他人。如非本人操作请忽略本邮件。</p>`
  )
  return sendSystemEmail(to, `【${BRAND}】${label}验证码：${code}`, html)
}

interface OrderInfo {
  orderNo: string
  productName: string
  amount: number | string
  deliveryType?: string | null
  cards?: string[]
  cardUsage?: string | null
  deliveryInfo?: string | null
}

// 订单已支付通知
export async function sendOrderPaidEmail(to: string, o: OrderInfo) {
  const rows = `
    <tr><td style="color:#6b7280;padding:4px 0;">订单号</td><td style="text-align:right;font-family:monospace;">${o.orderNo}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0;">商品</td><td style="text-align:right;">${o.productName}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0;">实付金额</td><td style="text-align:right;font-weight:700;">¥${Number(o.amount).toFixed(2)}</td></tr>`

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
  return sendSystemEmail(to, `【${BRAND}】订单支付成功 · ${o.productName}`, html)
}

// 订单已发货/已完成通知（手工发货交付时）
export async function sendOrderDeliveredEmail(to: string, o: OrderInfo) {
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
  return sendSystemEmail(to, `【${BRAND}】订单已交付 · ${o.productName}`, html)
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

export async function sendInvoiceIssuedEmail(to: string, iv: InvoiceIssuedInfo) {
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
  return sendSystemEmail(to, `【${BRAND}】发票已开具 · ${iv.invoiceNo}`, html)
}
