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
} from '../src/lib/mail'
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

const total = cases.length + channelCases.length
console.log(failed ? `\n✗ ${failed} 项失败\n` : `\n✓ 全部通过（${total} 封邮件）\n`)
process.exit(failed ? 1 : 0)
