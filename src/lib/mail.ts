import { sendSystemEmail, systemEmailConfigured } from './aliyun'

export { systemEmailConfigured }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
const BRAND = '贝果科技'

/*
 * 【链接的 origin】渠道分站（设计 4.5、11.4）：两站统一品牌，只有链接的域名按「这封信属于哪个店面」变。
 * 每个 render / send 函数都多一个可选的 opts.origin：
 *  · 交易类（已支付、已交付、发票已开、客服回复）由调用方按 order / invoice 的 tenantId 传 tenantOrigin(tenantId)；
 *  · 验证码、找回密码按当前店面 origin 传；
 *  · 不传 = 原来的 APP_URL 常量，**主站调用方不必改、主站邮件逐字不变**（默认值刻意不用 siteOrigin()：
 *    它优先读 NEXT_PUBLIC_SITE_URL，两个环境变量不一致时会改变主站邮件里的链接）。
 * origin 只接受 http(s)://host[:port]（去掉结尾的 /），不合规回落 APP_URL——绝不把外部输入拼进邮件链接。
 */
export interface MailOpts {
  origin?: string
}

function baseOf(opts?: MailOpts): string {
  const raw = (opts?.origin || '').trim().replace(/\/+$/, '')
  if (raw && /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(raw)) return raw
  return APP_URL
}

// 统一邮件外壳
function layout(title: string, bodyHtml: string, base: string = APP_URL): string {
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
      本邮件由系统自动发送，请勿直接回复。 · <a href="${base}" style="color:#7c3aed;text-decoration:none;">${base.replace(/^https?:\/\//, '')}</a>
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
export function renderVerifyCodeEmail(code: string, purpose: 'REGISTER' | 'RESET' | 'LOOKUP', opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  const label = PURPOSE_LABEL[purpose] || '身份验证'
  const html = layout(
    `${label}验证码`,
    `<p>您正在进行<strong>${label}</strong>操作，验证码为：</p>
     <div style="margin:18px 0;text-align:center;">
       <span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#7c3aed;background:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;padding:12px 22px;">${code}</span>
     </div>
     <p style="color:#6b7280;">验证码 10 分钟内有效，请勿泄露给他人。如非本人操作请忽略本邮件。</p>`,
    base
  )
  return { subject: `【${BRAND}】${label}验证码：${code}`, html }
}

export async function sendVerifyCodeEmail(to: string, code: string, purpose: 'REGISTER' | 'RESET' | 'LOOKUP', opts: MailOpts = {}) {
  const { subject, html } = renderVerifyCodeEmail(code, purpose, opts)
  return sendSystemEmail(to, subject, html)
}

/*
 * 【防枚举的两封说明信】发码接口对「注册时邮箱已存在」「找回密码时邮箱不存在」两种情况，
 * 以前分别直接返回「该邮箱已被注册」与另一句文案——一次请求就能判断一个邮箱是不是本站客户。
 * 现在四种情况都恰好发出一封信、返回同一句话（时延也一样），只在邮箱本人能看到的信里说明实情。
 * 文案不能出现微信/QQ/群等（阿里云禁发，见 scripts/check-transactional-mail.ts）。
 */
export function renderAccountExistsEmail(opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  const html = layout(
    '注册提醒',
    `<p>有人（可能是你本人）正在用这个邮箱注册${BRAND}账号，但<strong>这个邮箱已经注册过了</strong>，所以没有发送验证码。</p>
     <p>请直接 <a href="${base}/login" style="color:#7c3aed;">登录</a>；如果忘记了密码，可以 <a href="${base}/forgot-password" style="color:#7c3aed;">找回密码</a>。</p>
     <p style="color:#6b7280;">如非本人操作请忽略本邮件，你的账号不会有任何变化。</p>`,
    base
  )
  return { subject: `【${BRAND}】该邮箱已注册，请直接登录`, html }
}

export async function sendAccountExistsEmail(to: string, opts: MailOpts = {}) {
  const { subject, html } = renderAccountExistsEmail(opts)
  return sendSystemEmail(to, subject, html)
}

export function renderNoAccountEmail(opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  const html = layout(
    '找回密码提醒',
    `<p>有人（可能是你本人）申请找回${BRAND}账号的密码，但<strong>本站没有用这个邮箱注册的账号</strong>。</p>
     <p>如果你注册时用的是别的邮箱，请换那个邮箱再试；也可以 <a href="${base}/register" style="color:#7c3aed;">直接注册</a>。</p>
     <p style="color:#6b7280;">如非本人操作请忽略本邮件。</p>`,
    base
  )
  return { subject: `【${BRAND}】找回密码提醒`, html }
}

export async function sendNoAccountEmail(to: string, opts: MailOpts = {}) {
  const { subject, html } = renderNoAccountEmail(opts)
  return sendSystemEmail(to, subject, html)
}

/** 「邮箱查订阅」发码时该邮箱没有任何订阅记录：照样发一封信（与有记录时时延一致、返回同一句话），不发码 */
export function renderNoSubscriptionEmail(opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  const html = layout(
    '订阅查询提醒',
    `<p>有人（可能是你本人）在${BRAND}申请查询这个邮箱的订阅记录，但<strong>本站没有这个邮箱的订阅记录</strong>，所以没有发送验证码。</p>
     <p>如果你购买时填写的是别的账户邮箱，请换那个邮箱再查；刚下单的订单记录可能需要一段时间才会更新。</p>
     <p style="color:#6b7280;">如非本人操作请忽略本邮件。</p>`,
    base
  )
  return { subject: `【${BRAND}】订阅查询提醒`, html }
}

export async function sendNoSubscriptionEmail(to: string, opts: MailOpts = {}) {
  const { subject, html } = renderNoSubscriptionEmail(opts)
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
export function renderOrderPaidEmail(o: OrderInfo, opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
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
     <div style="margin-top:18px;"><a href="${base}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`,
    base
  )
  return { subject: `【${BRAND}】订单支付成功 · ${o.productName}`, html }
}

export async function sendOrderPaidEmail(to: string, o: OrderInfo, opts: MailOpts = {}) {
  const { subject, html } = renderOrderPaidEmail(o, opts)
  return sendSystemEmail(to, subject, html)
}

// 订单已发货/已完成通知（手工发货交付时）
export function renderOrderDeliveredEmail(o: OrderInfo, opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  const html = layout(
    '订单已交付',
    `<p>您的订单已交付完成：</p>
     <table style="width:100%;border-collapse:collapse;margin-top:8px;">
       <tr><td style="color:#6b7280;padding:4px 0;">订单号</td><td style="text-align:right;font-family:monospace;">${o.orderNo}</td></tr>
       <tr><td style="color:#6b7280;padding:4px 0;">商品</td><td style="text-align:right;">${o.productName}</td></tr>
     </table>
     ${o.deliveryInfo ? `<div style="margin-top:14px;"><div style="font-weight:600;margin-bottom:6px;">交付信息</div><div style="font-family:monospace;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(o.deliveryInfo)}</div></div>` : ''}
     <div style="margin-top:18px;"><a href="${base}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`,
    base
  )
  return { subject: `【${BRAND}】订单已交付 · ${o.productName}`, html }
}

export async function sendOrderDeliveredEmail(to: string, o: OrderInfo, opts: MailOpts = {}) {
  const { subject, html } = renderOrderDeliveredEmail(o, opts)
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

export function renderInvoiceIssuedEmail(iv: InvoiceIssuedInfo, opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
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
     <div style="margin-top:18px;"><a href="${base}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`,
    base
  )
  return { subject: `【${BRAND}】发票已开具 · ${iv.invoiceNo}`, html }
}

export async function sendInvoiceIssuedEmail(to: string, iv: InvoiceIssuedInfo, opts: MailOpts = {}) {
  const { subject, html } = renderInvoiceIssuedEmail(iv, opts)
  return sendSystemEmail(to, subject, html)
}

/*
 * 客服回复提醒（渠道分站新增，设计 11.4 售后闭环第 2 条）：订单留言有了客服回复时给买家发一封提醒，
 * 链接按订单所属店面的 origin。**正文不带回复内容**——回复可能含交付信息（账号、卡密），邮件只提醒「去订单里看」。
 * 文案同样不得出现阿里云禁发的联系方式类内容（scripts/check-tenant-ledger.ts 用营销同一份词表断言）。
 */
export interface OrderReplyInfo {
  orderNo: string
  productName: string
}

export function renderOrderReplyEmail(o: OrderReplyInfo, opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  const html = layout(
    '客服已回复',
    `<p>您的订单有新的客服回复：</p>
     <table style="width:100%;border-collapse:collapse;margin-top:8px;">
       <tr><td style="color:#6b7280;padding:4px 0;">订单号</td><td style="text-align:right;font-family:monospace;">${escapeHtml(o.orderNo)}</td></tr>
       <tr><td style="color:#6b7280;padding:4px 0;">商品</td><td style="text-align:right;">${escapeHtml(o.productName)}</td></tr>
     </table>
     <p style="margin-top:14px;color:#6b7280;">为保护您的账号信息，回复内容不在邮件中展示，请到「我的订单 → 订单详情」查看并继续沟通。</p>
     <div style="margin-top:18px;"><a href="${base}/orders" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">查看我的订单</a></div>`,
    base
  )
  return { subject: `【${BRAND}】您的订单有新的客服回复`, html }
}

export async function sendOrderReplyEmail(to: string, o: OrderReplyInfo, opts: MailOpts = {}) {
  const { subject, html } = renderOrderReplyEmail(o, opts)
  return sendSystemEmail(to, subject, html)
}

/*
 * 渠道后台成员邀请（设计 6.7「成员邀请」）：链接 = 渠道 origin + /partner/invite/<32 字节随机令牌>，24 小时有效，
 * 对方须在渠道站用同一邮箱登录后接受。令牌只出现在这封信里（库里只存 sha256）。
 */
export function renderTenantInviteEmail(a: { link: string; expiresHours: number; registerUrl?: string }, opts: MailOpts = {}): RenderedMail {
  const base = baseOf(opts)
  /*
   * 没有账号的被邀请人没有自助路径：筹备期（DRAFT）渠道站不开放注册，只能先到主站注册（两站同一账号，设计 5.1）。
   * 主站注册地址由调用方按平台 Tenant.origin 给（tenantOrigin(1)），绝不从 Host 拼；只写成文字、不做成链接——
   * 这封信里的链接一律指向渠道店面（邀请链接），与其它渠道交易邮件同一条规则（D9）
   */
  const registerTip =
    a.registerUrl && /^https?:\/\/[a-z0-9.-]+(:\d+)?\/register$/i.test(a.registerUrl)
      ? `<p style="color:#6b7280;">还没有${BRAND}账号？请先到 ${escapeHtml(a.registerUrl)} 用收到本邮件的邮箱注册（两站同一账号），再回到上面的链接登录并接受邀请。</p>`
      : ''
  const html = layout(
    '后台成员邀请',
    `<p>你被邀请加入${BRAND}的店铺管理后台。请在 ${a.expiresHours} 小时内打开下面的链接，用<strong>收到本邮件的邮箱</strong>登录后接受邀请：</p>
     <div style="margin-top:18px;"><a href="${escapeHtml(a.link)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">接受邀请</a></div>
     <p style="margin-top:14px;color:#6b7280;word-break:break-all;">如果按钮无法点击，请复制链接到浏览器打开：${escapeHtml(a.link)}</p>
     ${registerTip}
     <p style="color:#6b7280;">如非本人预期，请忽略本邮件，链接过期后自动失效。</p>`,
    base
  )
  return { subject: `【${BRAND}】后台成员邀请`, html }
}

export async function sendTenantInviteEmail(to: string, a: { link: string; expiresHours: number; registerUrl?: string }, opts: MailOpts = {}) {
  const { subject, html } = renderTenantInviteEmail(a, opts)
  return sendSystemEmail(to, subject, html)
}
