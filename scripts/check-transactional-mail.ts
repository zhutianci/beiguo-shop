/**
 * 交易/提醒邮件禁发内容自测（纯渲染，不发信、不碰数据库）：
 *   npx tsx scripts/check-transactional-mail.ts
 *
 * 阿里云邮件推送产品规则禁止正文出现微信/QQ/二维码/群/网盘等联系方式，一次投诉就可能冻结
 * 账号下**所有**发信地址 —— 包括发注册验证码的 no-reply，等于全站注册、找回密码一起停摆。
 * 这里用样例数据渲染每一封交易/提醒邮件（lib/mail.ts、lib/reminder.ts），逐封断言
 * 原始 HTML、可见文字、主题都过 findBannedWord（与营销邮件发送前检查同一份词表）。
 *
 * 联系客服只能写「在订单内联系客服」或链到站内 /support；新增邮件模板时在下面 cases 里补一条。
 */
import crypto from 'crypto'
import type { ExternalOrder } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { findBannedWord, visibleTextOf } from '../src/lib/marketing/lint'
import {
  renderVerifyCodeEmail,
  renderOrderPaidEmail,
  renderOrderDeliveredEmail,
  renderInvoiceIssuedEmail,
  renderAccountExistsEmail,
  renderNoAccountEmail,
  renderNoSubscriptionEmail,
  renderOrderReplyEmail,
  renderTenantInviteEmail,
  renderTenantNoticeEmail,
  TENANT_NOTICE_MAIL_FALLBACK,
} from '../src/lib/mail'
import { TENANT_NOTICE_KINDS, TENANT_NOTICE_KIND_LABEL } from '../src/lib/tenant/types'
import { buildReminderEmail, buildRechargeEmail } from '../src/lib/reminder'

let failed = 0
function assert(ok: boolean, name: string, detail = '') {
  if (ok) {
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name} ${detail}`)
  }
}

// 旧模板里写的客服微信号：它本身不在禁发词表里（只是一串字母），单独盯住，防止有人换个说法又写回来
const OLD_SERVICE_ID = 'GenuineMarxist'

const DAY = 86400000
function utcToday(offsetDays = 0): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) + offsetDays * DAY)
}

function externalOrder(expireInDays: number): ExternalOrder {
  return {
    id: 1,
    startDate: utcToday(expireInDays - 30),
    expireDate: utcToday(expireInDays),
    subscriptionType: 'Claude Pro',
    xianyuNickname: null,
    claudeAccount: 'buyer@example.com',
    cost: new Prisma.Decimal(100),
    quote: new Prisma.Decimal(150),
    profit: new Prisma.Decimal(50),
    sourceKey: 'check-transactional-mail',
    // 渠道分站新增列（主会话 D6）：样例是主站行
    tenantId: 1,
    shopOrderId: null,
    importBatch: null,
    remindedExpireDate: null,
    lastRemindedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

const order = { orderNo: 'BG202609250001', productName: 'ChatGPT Plus 月卡', amount: 139 }
/** 渠道店面 origin 样例（实际由 tenantOrigin(tenantId) 从 Tenant.origin 取） */
const CHANNEL_ORIGIN = 'https://lulu.bigolab.com'

const cases: { name: string; mail: { subject: string; html: string }; mustLinkSupport?: boolean }[] = [
  { name: '注册验证码', mail: renderVerifyCodeEmail('123456', 'REGISTER') },
  { name: '找回密码验证码', mail: renderVerifyCodeEmail('654321', 'RESET') },
  { name: '注册 · 邮箱已有账号的说明信', mail: renderAccountExistsEmail() },
  { name: '找回密码 · 邮箱没有账号的说明信', mail: renderNoAccountEmail() },
  { name: '订阅查询验证码', mail: renderVerifyCodeEmail('112233', 'LOOKUP') },
  { name: '订阅查询 · 无记录的说明信', mail: renderNoSubscriptionEmail() },
  {
    name: '支付成功 · 自动发卡（含使用说明、发票税费）',
    mail: renderOrderPaidEmail({
      ...order,
      invoiceTaxFee: 8.34,
      deliveryType: 'AUTO',
      cards: ['ABCD-EFGH-IJKL-MNOP', 'QRST-UVWX-YZ12-3456'],
      cardUsage: '登录后在「设置 → 兑换」里粘贴卡密即可。',
    }),
  },
  { name: '支付成功 · 短信接码', mail: renderOrderPaidEmail({ ...order, deliveryType: 'SMS' }) },
  { name: '支付成功 · 人工处理', mail: renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' }) },
  {
    name: '订单已交付（含交付信息）',
    mail: renderOrderDeliveredEmail({ ...order, deliveryInfo: '账号：buyer@example.com\n已开通至 2026-10-25' }),
  },
  { name: '订单已交付（无交付信息）', mail: renderOrderDeliveredEmail(order) },
  {
    name: '发票已开具',
    mail: renderInvoiceIssuedEmail({
      invoiceNo: '26000000000012345678',
      title: '示例科技有限公司',
      taxNumber: '91110000MA00000000',
      subscriptionType: 'Claude Pro',
      invoiceAmount: 159,
      issuedAt: new Date(),
    }),
  },
  { name: '到期提醒 · 还有 5 天', mail: buildReminderEmail(externalOrder(5)), mustLinkSupport: true },
  { name: '到期提醒 · 今天到期', mail: buildReminderEmail(externalOrder(0)), mustLinkSupport: true },
  { name: '到期提醒 · 已过期 3 天', mail: buildReminderEmail(externalOrder(-3)), mustLinkSupport: true },
  { name: '充值成功确认', mail: buildRechargeEmail(externalOrder(30)), mustLinkSupport: true },
  // 渠道分站新增的两类（WP3；主会话 D9）
  { name: '客服回复提醒', mail: renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName }) },
  {
    name: '渠道后台成员邀请',
    mail: renderTenantInviteEmail({ link: `${CHANNEL_ORIGIN}/partner/invite/AbCdEfGhIjKlMnOpQrStUvWxYz012345`, expiresHours: 24 }, { origin: CHANNEL_ORIGIN }),
  },
]

/*
 * 渠道店面的交易邮件（设计 4.5、11.4；主会话 D9）：链接一律按店面 origin（Tenant.origin，由调用方 tenantOrigin(tenantId) 取），
 * 绝不从 Host 头拼。这里用渠道 origin 渲染每一封会发给渠道买家的信，断言：
 *  · 信里每一个 href 都指向渠道 origin（不能漏一个链回主站——买家在主站没有这张订单）；
 *  · 不合规的 origin（带路径、带引号、javascript:）回落主站常量，绝不原样拼进链接。
 */
const channelCases: { name: string; mail: { subject: string; html: string } }[] = [
  { name: '渠道 · 注册验证码', mail: renderVerifyCodeEmail('123456', 'REGISTER', { origin: CHANNEL_ORIGIN }) },
  { name: '渠道 · 找回密码验证码', mail: renderVerifyCodeEmail('654321', 'RESET', { origin: CHANNEL_ORIGIN }) },
  { name: '渠道 · 邮箱已有账号', mail: renderAccountExistsEmail({ origin: CHANNEL_ORIGIN }) },
  { name: '渠道 · 邮箱没有账号', mail: renderNoAccountEmail({ origin: CHANNEL_ORIGIN }) },
  {
    name: '渠道 · 支付成功（自动发卡、开票）',
    mail: renderOrderPaidEmail({ ...order, invoiceTaxFee: 8.4, deliveryType: 'AUTO', cards: ['ABCD-EFGH'], cardUsage: '粘贴卡密即可。' }, { origin: CHANNEL_ORIGIN }),
  },
  { name: '渠道 · 支付成功（人工）', mail: renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' }, { origin: CHANNEL_ORIGIN }) },
  { name: '渠道 · 订单已交付', mail: renderOrderDeliveredEmail({ ...order, deliveryInfo: '已开通' }, { origin: CHANNEL_ORIGIN }) },
  {
    name: '渠道 · 发票已开具',
    mail: renderInvoiceIssuedEmail(
      { invoiceNo: '26000000000012345678', title: '示例科技有限公司', taxNumber: null, subscriptionType: 'Claude Pro', invoiceAmount: 148.4, issuedAt: new Date() },
      { origin: CHANNEL_ORIGIN },
    ),
  },
  { name: '渠道 · 客服回复提醒', mail: renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName }, { origin: CHANNEL_ORIGIN }) },
]
function hrefsOf(html: string): string[] {
  return Array.from(html.matchAll(/href="([^"]*)"/g), (m) => m[1])
}

console.log('\n[自检] 词表确实能拦住旧写法（防止断言空转）')
assert(findBannedWord('需要续费请联系客服微信：GenuineMarxist') === '微信', '「联系客服微信」被识别为「微信」')
assert(findBannedWord(visibleTextOf('客服微<b>信</b>')) === '微信', '标签拆开的「微<b>信</b>」也能识别')

for (const c of cases) {
  console.log(`\n[${c.name}] ${c.mail.subject}`)
  const { html, subject } = c.mail
  const inHtml = findBannedWord(html)
  assert(inHtml === null, '原始 HTML 无禁发内容', `命中「${inHtml}」`)
  const inText = findBannedWord(visibleTextOf(html))
  assert(inText === null, '可见文字无禁发内容', `命中「${inText}」`)
  const inSubject = findBannedWord(subject)
  assert(inSubject === null, '主题无禁发内容', `命中「${inSubject}」`)
  assert(!html.includes(OLD_SERVICE_ID) && !subject.includes(OLD_SERVICE_ID), `不含旧客服号 ${OLD_SERVICE_ID}`)
  if (c.mustLinkSupport) assert(/href="https?:\/\/[^"]+\/support"/.test(html), '给出了站内客服页 /support 链接')
}

for (const c of channelCases) {
  console.log(`\n[${c.name}] ${c.mail.subject}`)
  const hrefs = hrefsOf(c.mail.html)
  assert(hrefs.length > 0, '至少有一个链接')
  const off = hrefs.filter((h) => !h.startsWith(CHANNEL_ORIGIN + '/') && h !== CHANNEL_ORIGIN)
  assert(off.length === 0, '每个链接都指向渠道 origin', off.join(' '))
  assert(!/\/\/bigolab\.com/.test(c.mail.html), '正文不出现主站地址')
  const banned = findBannedWord(c.mail.html) ?? findBannedWord(visibleTextOf(c.mail.html)) ?? findBannedWord(c.mail.subject)
  assert(banned === null, '无禁发内容', `命中「${banned}」`)
}

console.log('\n[渠道 origin 不合规 → 回落主站常量，绝不原样拼进链接]')
for (const bad of ['https://lulu.bigolab.com/evil', 'https://lulu.bigolab.com"><script>', 'javascript:alert(1)', 'lulu.bigolab.com']) {
  const html = renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName }, { origin: bad }).html
  assert(hrefsOf(html).every((h) => !h.includes('evil') && !h.includes('<script') && !h.startsWith('javascript:') && /^https?:\/\//.test(h)), `origin=${JSON.stringify(bad)} 被拒`)
}

// =====================================================================================
// 二期改动 4.5：渠道交易邮件页脚的客服邮箱（MailOpts.supportEmail，由 tenantMailOpts 给）
// =====================================================================================
const SUPPORT_EMAIL = 'service@lulu-shop.com'
const withSupport = { origin: CHANNEL_ORIGIN, supportEmail: SUPPORT_EMAIL }
const supportCases: { name: string; mail: { subject: string; html: string } }[] = [
  {
    name: '渠道客服邮箱 · 支付成功（自动发卡）',
    mail: renderOrderPaidEmail({ ...order, deliveryType: 'AUTO', cards: ['ABCD-EFGH'], cardUsage: '粘贴卡密即可。' }, withSupport),
  },
  { name: '渠道客服邮箱 · 支付成功（人工）', mail: renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' }, withSupport) },
  { name: '渠道客服邮箱 · 订单已交付', mail: renderOrderDeliveredEmail({ ...order, deliveryInfo: '已开通' }, withSupport) },
  {
    name: '渠道客服邮箱 · 发票已开具',
    mail: renderInvoiceIssuedEmail(
      { invoiceNo: '26000000000012345678', title: '示例科技有限公司', taxNumber: null, subscriptionType: 'Claude Pro', invoiceAmount: 148.4, issuedAt: new Date() },
      withSupport,
    ),
  },
  { name: '渠道客服邮箱 · 客服回复提醒', mail: renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName }, withSupport) },
]
for (const c of supportCases) {
  console.log(`\n[${c.name}] ${c.mail.subject}`)
  assert(visibleTextOf(c.mail.html).includes(`客服邮箱：${SUPPORT_EMAIL}`), '页脚有「客服邮箱：…」')
  const hrefs = hrefsOf(c.mail.html)
  assert(hrefs.every((h) => h === CHANNEL_ORIGIN || h.startsWith(CHANNEL_ORIGIN + '/')), '客服邮箱不做成链接，链接仍只指向渠道 origin', hrefs.join(' '))
  const banned = findBannedWord(c.mail.html) ?? findBannedWord(visibleTextOf(c.mail.html)) ?? findBannedWord(c.mail.subject)
  assert(banned === null, '无禁发内容', `命中「${banned}」`)
  assert(!c.mail.html.includes(OLD_SERVICE_ID), `不含主站客服号 ${OLD_SERVICE_ID}（微信号永远不进邮件）`)
}

console.log('\n[客服邮箱不合规 → 页脚整行不出，与不传完全相同]')
{
  const plain = renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName }, { origin: CHANNEL_ORIGIN }).html
  const bads: (string | null)[] = ['123456@qq.com', 'wechat01@gmail.com', 'vx@abc.com', '"><script>@x.com', 'a b@c.com', 'x'.repeat(115) + '@a.com', 'not-an-email', null, '']
  for (const bad of bads) {
    const html = renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName }, { origin: CHANNEL_ORIGIN, supportEmail: bad }).html
    assert(html === plain, `supportEmail=${String(JSON.stringify(bad)).slice(0, 40)} 不进页脚`)
  }
}

/*
 * 主站邮件逐字不变（二期改动 4.5）：二期改动前（2026-09-26）用同一组样例渲染的 sha256 前 16 位。
 * mail.ts 的 layout / 各模板改动如果影响了不传 supportEmail 的输出，这里立刻失败。
 * APP_URL 取自 NEXT_PUBLIC_APP_URL（默认 https://bigolab.com；本地 .env 常设成 http://localhost:3000，import @prisma/client 时会被加载）：
 * 哈希按默认值生成，所以先把渲染结果里的 APP_URL（含去掉协议的页脚写法）换回 https://bigolab.com 再比；APP_URL 形态不是
 * http(s)://host[:port] 时无法可靠换回，跳过并提示。
 */
console.log('\n[主站邮件逐字不变（与二期改动前的渲染哈希比对）]')
{
  const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
  const norm = (s: string) => (appUrlRaw === 'https://bigolab.com' ? s : s.split(appUrlRaw).join('https://bigolab.com').split(appUrlRaw.replace(/^https?:\/\//, '')).join('bigolab.com'))
  const h = (x: { subject: string; html: string }) => crypto.createHash('sha256').update(norm(x.subject) + '\n' + norm(x.html)).digest('hex').slice(0, 16)
  const fixed = new Date('2026-09-25T08:00:00Z')
  const golden: [string, string, { subject: string; html: string }][] = [
    ['注册验证码', '47ba793b2d47b597', renderVerifyCodeEmail('123456', 'REGISTER')],
    ['邮箱已有账号', 'e1395bf60ba27263', renderAccountExistsEmail()],
    ['邮箱没有账号', 'db0728a53d36ab48', renderNoAccountEmail()],
    ['订阅查询无记录', 'c6282d5f1c8ea257', renderNoSubscriptionEmail()],
    ['支付成功 · 自动发卡', 'adf8e229ba5506e0', renderOrderPaidEmail({ ...order, invoiceTaxFee: 8.34, deliveryType: 'AUTO', cards: ['ABCD-EFGH'], cardUsage: '粘贴即可' })],
    ['支付成功 · 人工', '7b39ae4daee889e3', renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' })],
    ['订单已交付', 'feba527810b0ab4e', renderOrderDeliveredEmail({ ...order, deliveryInfo: '已开通' })],
    [
      '发票已开具',
      '9c9893d4ccecfc1a',
      renderInvoiceIssuedEmail({ invoiceNo: '26000000000012345678', title: '示例科技有限公司', taxNumber: null, subscriptionType: 'Claude Pro', invoiceAmount: 148.4, issuedAt: fixed }),
    ],
    ['客服回复提醒', '1ce62c6acc74cdb7', renderOrderReplyEmail({ orderNo: order.orderNo, productName: order.productName })],
    // 渠道单、未设客服邮箱（tenantMailOpts 只给 origin）：与二期之前也逐字相同
    ['渠道支付成功 · 未设客服邮箱', '7b2c3743be17987f', renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' }, { origin: CHANNEL_ORIGIN })],
  ]
  if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(appUrlRaw)) {
    console.log(`  · 跳过：NEXT_PUBLIC_APP_URL=${appUrlRaw} 不是 http(s)://host[:port]（哈希按默认 https://bigolab.com 生成）`)
  } else {
    for (const [name, want, mail] of golden) assert(h(mail) === want, `${name} 与二期前逐字相同`, `得到 ${h(mail)}`)
  }
  // 主站调用方传 undefined / {} / { supportEmail: undefined } 三种写法输出完全相同
  const a = renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' })
  const b = renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' }, undefined)
  const c = renderOrderPaidEmail({ ...order, deliveryType: 'MANUAL' }, { supportEmail: undefined })
  assert(a.html === b.html && b.html === c.html && a.subject === c.subject, '不传 / undefined / supportEmail:undefined 输出相同')
}

// =====================================================================================
// 二期改动 3.2：渠道后台通知邮件 + 通知邮箱验证码
// =====================================================================================
console.log('\n[通知类型中文名不含禁发词（会进邮件主题）]')
for (const k of TENANT_NOTICE_KINDS) {
  const w = findBannedWord(TENANT_NOTICE_KIND_LABEL[k])
  assert(w === null, `${k} → ${TENANT_NOTICE_KIND_LABEL[k]}`, `命中「${w}」`)
}

const noticeCases: { name: string; mail: { subject: string; html: string } }[] = [
  ...TENANT_NOTICE_KINDS.map((k) => ({
    name: `渠道通知 · ${k}`,
    mail: renderTenantNoticeEmail(
      { kind: k, title: `${TENANT_NOTICE_KIND_LABEL[k]}：示例`, body: '示例正文', refKey: 'BG202609250001', path: '/partner/orders/BG202609250001' },
      { origin: CHANNEL_ORIGIN },
    ),
  })),
  {
    name: '渠道通知 · 发送测试',
    mail: renderTenantNoticeEmail(
      { kind: 'TEST', title: '邮件推送测试', body: '这是一条测试消息：收到即表示店铺后台的通知可以推送到本邮箱。', path: '/partner/settings' },
      { origin: CHANNEL_ORIGIN },
    ),
  },
  { name: '通知邮箱绑定验证码（渠道）', mail: renderVerifyCodeEmail('246810', 'NOTICE', { origin: CHANNEL_ORIGIN }) },
]
for (const c of noticeCases) {
  console.log(`\n[${c.name}] ${c.mail.subject}`)
  const hrefs = hrefsOf(c.mail.html)
  assert(hrefs.length > 0 && hrefs.every((h) => h === CHANNEL_ORIGIN || h.startsWith(CHANNEL_ORIGIN + '/')), '链接只指向渠道 origin', hrefs.join(' '))
  const banned = findBannedWord(c.mail.html) ?? findBannedWord(visibleTextOf(c.mail.html)) ?? findBannedWord(c.mail.subject)
  assert(banned === null, '无禁发内容', `命中「${banned}」`)
  assert(!c.mail.html.includes(OLD_SERVICE_ID) && !c.mail.html.includes('wechat-qr'), '不含微信号 / 二维码')
}
{
  const m = renderTenantNoticeEmail({ kind: 'ORDER_PAID', title: '订单已支付', body: 'x', refKey: 'BG1', path: '/partner/orders/BG1' }, { origin: CHANNEL_ORIGIN })
  assert(m.subject === '【贝果科技】店铺后台通知：订单已支付', '主题格式「【贝果科技】店铺后台通知：{类型}」', m.subject)
  assert(hrefsOf(m.html).includes(`${CHANNEL_ORIGIN}/partner/orders/BG1`), '按钮链到 渠道 origin + 后台路径')
}

console.log('\n[通知邮件：禁发词整段降级、邮箱与链接隐藏、路径与编号不合规回落]')
{
  const wx = renderTenantNoticeEmail({ kind: 'TENANT_STATUS', title: '企业微信推送测试', body: '收到即表示可以推送到本群' }, { origin: CHANNEL_ORIGIN })
  assert(visibleTextOf(wx.html).includes(TENANT_NOTICE_MAIL_FALLBACK) && findBannedWord(wx.html) === null, '标题含「微信」→ 摘要降级为「请登录渠道后台查看」')
  const qq = renderTenantNoticeEmail({ kind: 'BUYER_MESSAGE', title: '买家留言', body: '加我 Q Q 群 12345' }, { origin: CHANNEL_ORIGIN })
  assert(findBannedWord(qq.html) === null && visibleTextOf(qq.html).includes(TENANT_NOTICE_MAIL_FALLBACK), '正文含「群」→ 整段降级')
  const pii = renderTenantNoticeEmail(
    { kind: 'ORDER_PAID', title: '订单已支付', body: '买家 buyer.one@example.com 下单；财务台 https://bigolab.com/finance/invoices/abcdef 免登录 https://lulu.bigolab.com/q/xyz' },
    { origin: CHANNEL_ORIGIN },
  )
  const t = visibleTextOf(pii.html)
  assert(!t.includes('buyer.one@example.com') && t.includes('[邮箱已隐藏]'), '正文里的买家邮箱被隐藏')
  assert(!pii.html.includes('/finance/') && !pii.html.includes('/q/xyz') && t.includes('[链接已隐藏]'), '正文里的财务台 / 免登录链接被隐藏')
  assert(!/\/\/bigolab\.com/.test(pii.html), '不出现主站地址')
  const badPath = renderTenantNoticeEmail({ kind: 'ORDER_PAID', title: 'x', path: '//evil.com/partner' }, { origin: CHANNEL_ORIGIN })
  assert(hrefsOf(badPath.html).every((h) => h === CHANNEL_ORIGIN || h === `${CHANNEL_ORIGIN}/partner/notices`), '路径不合规 → /partner/notices')
  const badPath2 = renderTenantNoticeEmail({ kind: 'ORDER_PAID', title: 'x', path: '/admin/orders' }, { origin: CHANNEL_ORIGIN })
  assert(hrefsOf(badPath2.html).every((h) => !h.includes('/admin')), '非 /partner 路径不收')
  const badRef = renderTenantNoticeEmail({ kind: 'ORDER_PAID', title: 'x', refKey: '<script>alert(1)</script>' }, { origin: CHANNEL_ORIGIN })
  assert(!badRef.html.includes('<script>'), '编号不合规不显示')
  const esc = renderTenantNoticeEmail({ kind: 'ORDER_PAID', title: '<img src=x onerror=alert(1)>' }, { origin: CHANNEL_ORIGIN })
  assert(!esc.html.includes('<img src=x'), '标题转义')
  const badOrigin = renderTenantNoticeEmail({ kind: 'ORDER_PAID', title: 'x' }, { origin: 'javascript:alert(1)' })
  assert(hrefsOf(badOrigin.html).every((h) => /^https?:\/\//.test(h)), 'origin 不合规回落主站常量')
}

const total = cases.length + channelCases.length + supportCases.length + noticeCases.length
console.log(failed ? `\n✗ ${failed} 项失败\n` : `\n✓ 全部通过（${total} 封邮件）\n`)
process.exit(failed ? 1 : 0)
