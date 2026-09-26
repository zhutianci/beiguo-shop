/**
 * WP7 集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp7.ts
 *
 * 直接 import src/app/api/partner/{customers,finance,notices,audit,settings}/** 的 route.ts，经 _harness.callRoute 在假的
 * Next 请求作用域里调用（partnerRoute 守卫、店面解析、getCurrentUser 全部真实执行）。覆盖实施分包 10.5：
 *   W7-1 T14：主站独有邮箱与不存在邮箱搜索一致；拉黑 zz 的 / 不存在的 customerNo 404；渠道拉黑后 lulu 下单被拒、主站可下单、
 *        lulu 仍可看订单取卡与留言；平台拉黑渠道解除 404
 *   W7-2 客户详情只含本站订单；无禁用键；只在主站开票 / 退款 → invoiceCount / refundCount = 0
 *   W7-3 lulu 注册、只在主站下单的用户：出现在列表、订单数 0、看不到主站订单；申请全局封禁成功（零订单也可）
 *   W7-4 结算中心三个数按设计 10.11 ② 各时间点逐分对齐（最低结算 20 元）；公式文案随费率变化
 *   W7-5 申请结算：负余额 / 低于最低额 / payoutHold / 收款信息缺失 / 冷静期 / 间隔不足 / 已有未完结单 / 当日次数 → 各自原因；
 *        满足时生成 origin=REQUEST；同一 requestId 幂等；并发两次只成一张
 *   W7-6 流水与结算单接口无 memo / operatorId / eventKey / 自增 id；对账单 CSV 合计 = netCents
 *   W7-7 webhook：非企业微信前缀拒绝；GET 设置不回显 URL；推送载荷不含邮箱与卡密；测试限频
 *   W7-8 操作日志：平台行显示「平台」；只有 publicDiff；COST 规则批量设进货价 / payoutHold（带原因）/ 调账（带内部 memo）之后
 *        不出现成本特征值、原因原文、memo；不含 authz.denied、IP、UA
 *   W7-9 T1 矩阵：本包全部路由 × 身份 × 寻址键（本渠道 / 他渠道 / 随机 / 自增数字）；用他站键调写接口数据库不变
 * 另：T5（主站 Host / 休眠期全部 404）、SUSPENDED 只读、DRAFT 只放行 DRAFT_SAFE、STAFF 碰 OWNER_ONLY 404、导出每日 5 次、页面守卫静态检查。
 */
for (const k of ['WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL', 'ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY']) delete process.env[k]
// vmq 模块在加载时读 VMQ_KEY；被测路由一律在设好之后动态加载（与 wp2 同口径）
if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest-wp7-vmq-key'

import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  createWorld,
  cleanupAll,
  callRoute,
  collectKeys,
  createUser,
  MAIL_DOMAIN,
  MARK,
  NAME_PREFIX,
  RUN,
  signTestToken,
  type RouteFn,
  type World,
  type WorldTenant,
  type WorldUser,
} from './_harness'
import { TENANT_NOTICE_KINDS } from '../../src/lib/tenant/types'
import { deduct, yuan } from '../../src/components/partner/common/format'

type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any

const DAY = 86400_000
const t0 = Date.now()
const at = (days: number, extraMs = 3600_000) => new Date(t0 + days * DAY + extraMs)

// ---------------------------------------------------------------------------
// 调用助手：每次请求换一个客户端 IP（partnerRoute 按 IP 限流 120 次 / 分钟，矩阵测试会超）
// ---------------------------------------------------------------------------
let ipSeq = 0
const nextIp = () => {
  ipSeq++
  return `10.77.${(ipSeq >> 8) & 255}.${ipSeq & 255}`
}
type Who = { host: string; token?: string | null }
async function call(route: RouteFn, who: Who, o: { method?: string; path?: string; body?: unknown; params?: Record<string, string> } = {}) {
  return callRoute(route, {
    host: who.host,
    token: who.token ?? null,
    method: o.method,
    path: o.path,
    body: o.body,
    params: o.params,
    headers: { 'cf-connecting-ip': nextIp(), 'user-agent': 'ITEST-UA-wp7' },
  })
}

let NOT_FOUND_TEXT = ''
const isNotFound = (r: { status: number; text: string }) => r.status === 404 && r.text === NOT_FOUND_TEXT
/** 「视为未登录」（WP1：他站令牌 / SA 在渠道 Host → 401）或「当不存在」（404）都算拒绝，都不给任何数据 */
const isDenied = (r: { status: number; text: string }) => isNotFound(r) || r.status === 401
/** 主会话 D2：渠道 Host 上的超管一律视为未登录，只能是 401（不收 404：404 说明走到了 partnerRoute 的 ADMIN 噪声分支，等于承认它是管理员） */
const isUnauth = (r: { status: number; text: string }) => r.status === 401
const deniedFor = (label: string) => (label === 'SA' ? isUnauth : isDenied)

let ALLOWED: ReadonlySet<string>
let FORBIDDEN: ReadonlySet<string>
let CONTEXTUAL: Readonly<Record<string, readonly string[]>>

/**
 * T10 键名扫描。publicDiff 子树里是各 action 自定的摘要键（设计 5.8 白名单），不在 PARTNER_ALLOWED_KEYS 里：
 * 子树内只查禁用键，不查「未登记键」（WP8 的 T10 需要同样的豁免，已写进最终报告）。
 */
function scanKeys(label: string, json: unknown): void {
  const bad: string[] = []
  const walk = (v: unknown, parent: string, inDiff: boolean) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, parent, inDiff))
    if (!v || typeof v !== 'object') return
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (k === 'phone' && (CONTEXTUAL.phone ?? []).includes(parent)) continue
      if (FORBIDDEN.has(k) || k === '_count' || k === 'deliveryInfo') bad.push(`禁用键 ${parent}.${k}`)
      else if (!inDiff && !ALLOWED.has(k)) bad.push(`未登记键 ${parent}.${k}`)
      walk(x, k, inDiff || k === 'publicDiff')
    }
  }
  walk(json, '', false)
  check(`T10 键名：${label}`, bad.length === 0, bad.slice(0, 8).join('；'))
}
function noValues(label: string, text: string, values: string[]): void {
  const hits = values.filter((v) => v && text.includes(v))
  check(label, hits.length === 0, hits.join('、'))
}

/** 键序无关的 JSON 比较：MySQL 的 JSON 列会按自己的规则重排对象键 */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
  return v
}
const sameJson = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))

/** 极简 CSV 解析（够用：引号包裹、双引号转义、CRLF） */
function parseCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"' && s[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

// ---------------------------------------------------------------------------
// 结算夹具（与 wp3 同口径：渠道单快照 + fulfillOrder 走真实计提）
// ---------------------------------------------------------------------------
let tSeq = 0
async function mkTenant(letter: string, opt: { payee?: boolean; minPayoutCents?: number } = {}): Promise<WorldTenant> {
  tSeq++
  const code = `it7${letter}${RUN}`.slice(0, 20)
  const host = `${code}.bigolab.com`
  const t = await prisma.tenant.create({
    data: {
      code,
      kind: 'CHANNEL',
      name: `${NAME_PREFIX}-w7${letter}`,
      status: 'ACTIVE',
      origin: `https://${host}`,
      holdDays: 7,
      minPayoutCents: opt.minPayoutCents ?? 2000,
      requirePartnerInvoice: false,
      ...(opt.payee === false
        ? {}
        : { payeeName: 'ITEST 收款人', payeeMethod: 'ALIPAY', payeeAccountMasked: 'it***@x.com', payeeAccountEnc: 'enc', payeeChangedAt: new Date(t0 - 10 * DAY) }),
    },
  })
  await prisma.tenantDomain.create({ data: { tenantId: t.id, host, isPrimary: true, status: 1 } })
  return { id: t.id, code, host, origin: `https://${host}` }
}

let catId = 0
let cardSeq = 0
async function mkProduct(name: string): Promise<number> {
  const p = await prisma.product.create({
    data: { categoryId: catId, name: `${NAME_PREFIX} ${name} ${RUN}`, price: new Prisma.Decimal('129.00'), deliveryType: 'AUTO', stock: -1, status: 1 },
  })
  return p.id
}
async function addCards(productId: number, n: number): Promise<void> {
  const ck = await import('../../src/lib/cardkey')
  for (let i = 0; i < n; i++) {
    cardSeq++
    const plain = `ITEST-W7-CARD-${RUN}-${cardSeq}`
    await prisma.cardKey.create({
      data: { productId, content: ck.encryptCardContent(plain), contentHash: ck.cardContentHash(plain), status: 'UNUSED', cost: new Prisma.Decimal(MARK.cardCost), batch: `IT-${RUN}` },
    })
  }
}
let pubSeq = 0
async function mkListing(tenantId: number, productId: number, supply: number, retail: number): Promise<number> {
  pubSeq++
  const l = await prisma.tenantListing.create({
    data: { publicNo: `W7${RUN.toUpperCase()}${String(pubSeq).padStart(4, '0')}`.replace(/[ILOU]/g, 'X').slice(0, 16), tenantId, productId, granted: true, supplyCents: supply, retailCents: retail, status: 1 },
    select: { id: true },
  })
  return l.id
}
let oSeq = 0
async function mkOrder(a: { tenant: WorldTenant; user: WorldUser; productId: number; listingId: number; qty?: number; invoice?: boolean }): Promise<{ id: number; orderNo: string }> {
  oSeq++
  const qty = a.qty ?? 1
  const A = 14000 * qty
  const tax = a.invoice ? Math.round(A * 1.06) - A : 0
  return prisma.order.create({
    data: {
      orderNo: `IW7${RUN.toUpperCase()}${String(oSeq).padStart(3, '0')}`.slice(0, 32),
      userId: a.user.id,
      productId: a.productId,
      productName: `${NAME_PREFIX} 商品 ${oSeq}`,
      productPrice: new Prisma.Decimal('140.00'),
      quantity: qty,
      amount: new Prisma.Decimal((A / 100).toFixed(2)),
      tenantId: a.tenant.id,
      remark: '买家备注 itest',
      buyerRemark: '买家备注 itest',
      ...(a.invoice
        ? { invoiceTaxFee: new Prisma.Decimal((tax / 100).toFixed(2)), invoiceInfo: JSON.stringify({ title: 'ITEST 抬头', taxNumber: '91110000ITEST', email: a.user.email, showAiWording: false, taxFee: tax / 100 }) }
        : {}),
      listingId: a.listingId,
      supplyUnitPrice: new Prisma.Decimal('110.00'),
      supplyCents: 11000 * qty,
      feeRateBp: 150,
      invoiceShareRateBp: 200,
      settleHoldDays: 7,
      mainPriceAtOrder: new Prisma.Decimal('129.00'),
    },
    select: { id: true, orderNo: true },
  })
}

async function extraCleanup(): Promise<void> {
  const users = await prisma.user.findMany({ where: { email: { endsWith: MAIL_DOMAIN } }, select: { id: true } })
  const uIds = users.map((u) => u.id)
  const orders = await prisma.order.findMany({ where: { userId: { in: uIds } }, select: { id: true } })
  const oIds = orders.map((o) => o.id)
  await prisma.invoice.deleteMany({ where: { OR: [{ claudeAccount: { endsWith: MAIL_DOMAIN } }, { shopOrderId: { in: oIds } }] } })
  await prisma.receipt.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
  await prisma.externalOrder.deleteMany({ where: { OR: [{ claudeAccount: { endsWith: MAIL_DOMAIN } }, { shopOrderId: { in: oIds } }] } })
  await prisma.orderMessage.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oIds } } }).catch(() => undefined)
}

// ---------------------------------------------------------------------------
let auditBaseline = 0
const residualAudit = () => prisma.auditEvent.count({ where: { OR: [{ action: { startsWith: 'itest' } }, { reason: { contains: 'ITEST' } }, { ua: 'ITEST-UA-wp7' }] } })

async function main() {
  auditBaseline = await residualAudit()
  // ---- 动态加载（环境变量已就位）----
  const selects = await import('../../src/lib/partner-services/selects')
  ALLOWED = selects.PARTNER_ALLOWED_KEYS
  FORBIDDEN = selects.PARTNER_FORBIDDEN_KEYS
  CONTEXTUAL = selects.PARTNER_CONTEXTUAL_KEYS
  const { PARTNER_NOT_FOUND_BODY } = await import('../../src/lib/tenant/types')
  NOT_FOUND_TEXT = JSON.stringify(PARTNER_NOT_FOUND_BODY)
  const { invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  const notice = await import('../../src/lib/tenant/notice')
  const { writeAudit } = await import('../../src/lib/audit')
  const L = await import('../../src/lib/tenant/ledger')
  const S = await import('../../src/lib/tenant/statement')
  const R = await import('../../src/lib/tenant/reconcile')
  const V = await import('../../src/lib/vmq')
  const { sanitizePublicDiff } = await import('../../src/lib/partner-services/audit')
  const { normalizeTags } = await import('../../src/lib/partner-services/customers')

  const rCustomers = await import('../../src/app/api/partner/customers/route')
  const rCustExport = await import('../../src/app/api/partner/customers/export/route')
  const rCustomer = await import('../../src/app/api/partner/customers/[customerNo]/route')
  const rBlock = await import('../../src/app/api/partner/customers/[customerNo]/block/route')
  const rUnblock = await import('../../src/app/api/partner/customers/[customerNo]/unblock/route')
  const rBan = await import('../../src/app/api/partner/customers/[customerNo]/ban-request/route')
  const rSummary = await import('../../src/app/api/partner/finance/summary/route')
  const rLedger = await import('../../src/app/api/partner/finance/ledger/route')
  const rFinOrders = await import('../../src/app/api/partner/finance/orders/route')
  const rApply = await import('../../src/app/api/partner/finance/apply/route')
  const rStmts = await import('../../src/app/api/partner/finance/statements/route')
  const rStmt = await import('../../src/app/api/partner/finance/statements/[statementNo]/route')
  const rStmtCsv = await import('../../src/app/api/partner/finance/statements/[statementNo]/export/route')
  const rNotices = await import('../../src/app/api/partner/notices/route')
  const rNoticeRead = await import('../../src/app/api/partner/notices/read/route')
  const rUnread = await import('../../src/app/api/partner/notices/unread-count/route')
  const rAudit = await import('../../src/app/api/partner/audit/route')
  const rSettings = await import('../../src/app/api/partner/settings/route')
  const rNoticePrefs = await import('../../src/app/api/partner/settings/notice/route')
  const rWebhook = await import('../../src/app/api/partner/settings/webhook/route')
  const rWebhookTest = await import('../../src/app/api/partner/settings/webhook/test/route')
  const ordersRoute = await import('../../src/app/api/orders/route')
  const msgRoute = await import('../../src/app/api/orders/[id]/messages/route')
  const RF = (fn: unknown) => fn as RouteFn

  // 推送通道换成计数桩：记录载荷，不真的发
  const pushed: { url: string; payload: string }[] = []
  notice.setTenantNoticeTransportForTest(async (url, payload) => {
    pushed.push({ url, payload: JSON.stringify(payload) })
    return true
  })

  setChannelsMode('observe')
  invalidateStorefrontCache()
  await extraCleanup()
  await cleanupAll()
  const w: World = await createWorld()
  const LU = w.lulu
  const ZZ = w.zz
  const owner: Who = { host: LU.host, token: w.token(w.users.luluOwner, LU) }
  const buyer: Who = { host: LU.host, token: w.token(w.users.luluBuyer1, LU) }
  const sa: Who = { host: LU.host, token: w.token(w.users.sa, LU) }
  const anon: Who = { host: LU.host }
  const zzOwnerOnLulu: Who = { host: LU.host, token: w.token(w.users.zzOwner, ZZ) }
  const zzOwner: Who = { host: ZZ.host, token: w.token(w.users.zzOwner, ZZ) }
  const mainOwner: Who = { host: 'bigolab.com', token: w.token(w.users.luluOwner, w.main) }
  const C = {
    ...w.customers,
    luluBuyer2: (await prisma.tenantCustomer.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: LU.id, userId: w.users.luluBuyer2.id } } })).publicNo,
  }

  // =========================================================================
  section('页面守卫（静态）：8 个页面都是 Server Component 且调用 requirePartnerPage')
  {
    const pages = [
      'customers/page.tsx',
      'customers/[customerNo]/page.tsx',
      'finance/page.tsx',
      'finance/statements/page.tsx',
      'finance/statements/[statementNo]/page.tsx',
      'notices/page.tsx',
      'audit/page.tsx',
      'settings/page.tsx',
    ]
    for (const p of pages) {
      const src = readFileSync(path.join(process.cwd(), 'src/app/partner', p), 'utf8')
      check(`${p}：无 'use client'、调用 requirePartnerPage、包 PartnerShell`, !/['"]use client['"]/.test(src) && /requirePartnerPage\(/.test(src) && /PartnerShell/.test(src))
    }
    const routes = readFileSync(path.join(process.cwd(), 'scripts/itest-tenant/routes/wp7.json'), 'utf8')
    const list = JSON.parse(routes).routes as { file: string }[]
    for (const r of list) {
      const src = readFileSync(path.join(process.cwd(), r.file), 'utf8')
      const lines = src.split('\n').filter((l) => l.startsWith('export '))
      check(`${r.file}：只导出 dynamic 与 partnerRoute(`, lines.every((l) => l === "export const dynamic = 'force-dynamic'" || /^export const (GET|POST|PUT|PATCH|DELETE) = partnerRoute\(/.test(l)))
    }
  }

  // =========================================================================
  section('操作日志文案全覆盖（静态）：凡写审计的 action 在渠道操作日志页都有中文名')
  {
    /*
     * 终审第 2 轮：ACTION_TEXT 漏了一批平台对渠道的 action（order.refund、tenant.payee_reveal…），页面回退成英文代码。
     * 这里扫描所有调用 writeAudit 的源文件里的 action 字面量（加上 listings.ts 里三元表达式算出来的两个），
     * 减去渠道永远看不到的（authz.*，以及 tenantId=null 写的 customer.platform_note），逐个要求 ACTION_TEXT 有键。
     * 新增一个 action 忘了配文案 → 这里失败。
     */
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []))
    const actions = new Set<string>(['listing.status', 'listing.sort'])
    for (const f of walk(path.join(process.cwd(), 'src'))) {
      const src = readFileSync(f, 'utf8')
      if (!/writeAudit\(/.test(src)) continue
      // 项目 tsconfig 的 target 不支持直接迭代 matchAll / Set，这里用 exec 循环与 Array.from
      const re = /action: ?'([a-z_]+(?:\.[a-z_]+)?)'/g
      for (let m = re.exec(src); m; m = re.exec(src)) actions.add(m[1])
    }
    const NEVER_CHANNEL = new Set(['authz.denied', 'authz.noise', 'customer.platform_note'])
    const viewSrc = readFileSync(path.join(process.cwd(), 'src/components/partner/audit/audit-view.tsx'), 'utf8')
    const block = /export const ACTION_TEXT[^{]*\{([\s\S]*?)\n\}/.exec(viewSrc)?.[1] ?? ''
    const labelled = new Set<string>()
    const keyRe = /^\s+'?([a-z_]+(?:\.[a-z_]+)?)'?:/gm
    for (let m = keyRe.exec(block); m; m = keyRe.exec(block)) labelled.add(m[1])
    const missing = Array.from(actions).filter((a) => !NEVER_CHANNEL.has(a) && !labelled.has(a))
    check(`扫描到 ${actions.size} 个 action，均有中文名`, actions.size >= 60 && missing.length === 0, missing.join(', '))
  }

  // =========================================================================
  section('W7-1 / T14 / T26：客户搜索「先租户后匹配」')
  {
    const list = (q: string, who: Who = owner) => call(RF(rCustomers.GET), who, { path: `/api/partner/customers?q=${encodeURIComponent(q)}` })
    const r0 = await list('')
    check('列表 200', r0.status === 200 && r0.json?.success === true, r0.text.slice(0, 200))
    const emails = (r0.json?.data?.rows ?? []).map((x: Json) => x.email)
    check('列表只含 lulu 客户（买家 1、2、跨站买家、lulu 注册者、店主）', emails.includes(w.users.luluBuyer1.email) && emails.includes(w.users.luluRegMainOrder.email) && !emails.includes(w.users.zzBuyer1.email))
    check('只在 lulu 登录过的主站老用户不在列表（T26）', !emails.includes(w.users.mainOldLoginLulu.email))
    scanKeys('客户列表', r0.json)
    const mainOnly = await list(w.users.mainOldLoginLulu.email)
    const nobody = await list(`nobody-${RUN}${MAIL_DOMAIN}`)
    const zzMail = await list(w.users.zzBuyer1.email)
    check('主站独有邮箱搜索 total=0', mainOnly.json?.data?.total === 0)
    check('主站独有邮箱与不存在邮箱：响应体完全相同', mainOnly.text === nobody.text && mainOnly.status === nobody.status)
    check('他站客户邮箱与不存在邮箱：响应体完全相同', zzMail.text === nobody.text)
    const pre = await list(w.users.luluBuyer1.email.slice(0, 12))
    check('邮箱前缀（含 @ 之前的前缀按昵称/前缀）命中', (pre.json?.data?.rows ?? []).some((x: Json) => x.customerNo === C.luluBuyer1))
    const short = await list('a@')
    check('含 @ 且不足 3 字符 → 400', short.status === 400)
    const nick = await list('it-lulu-buyer1')
    check('按昵称搜索命中', (nick.json?.data?.rows ?? []).length === 1 && nick.json.data.rows[0].customerNo === C.luluBuyer1)
    const long = await list('x'.repeat(129))
    check('搜索词超过 128 字符 → 400', long.status === 400)
  }

  section('W7-1：客户寻址——他站 / 不存在 / 自增数字 404，响应体相同')
  {
    const zzCust = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.zzBuyer1 } })
    for (const [label, key] of [
      ['zz 的 customerNo', C.zzBuyer1],
      ['不存在的 customerNo', 'ZZZZZZZZZZZZ'],
      ['自增数字', String(zzCust.id)],
      ['小写他站编号', C.zzBuyer1.toLowerCase()],
    ] as const) {
      const r = await call(RF(rCustomer.GET), owner, { params: { customerNo: key } })
      check(`GET 详情 ${label} → 404 同体`, isNotFound(r), `${r.status} ${r.text.slice(0, 80)}`)
      const b = await call(RF(rBlock.POST), owner, { method: 'POST', params: { customerNo: key }, body: { reason: 'FRAUD' } })
      check(`拉黑 ${label} → 404 同体`, isNotFound(b))
      const p = await call(RF(rCustomer.PATCH), owner, { method: 'PATCH', params: { customerNo: key }, body: { note: 'x' } })
      check(`PATCH ${label} → 404 同体`, isNotFound(p))
      const u = await call(RF(rUnblock.POST), owner, { method: 'POST', params: { customerNo: key } })
      check(`解除 ${label} → 404 同体`, isNotFound(u))
      const bn = await call(RF(rBan.POST), owner, { method: 'POST', params: { customerNo: key }, body: { reason: '他站客户测试原因' } })
      check(`申请封禁 ${label} → 404 同体`, isNotFound(bn))
    }
    const after = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.zzBuyer1 } })
    check('zz 客户行未被改动（note / blocked / updatedAt）', after.note === zzCust.note && after.blockedAt === null && String(after.updatedAt) === String(zzCust.updatedAt))
    check('没有为他站客户建售后申请', (await prisma.tenantAfterSale.count({ where: { customerId: zzCust.id } })) === 0)
    // 小写本渠道编号可用（parsePublicNo 转大写）
    const lower = await call(RF(rCustomer.GET), owner, { params: { customerNo: C.luluBuyer1.toLowerCase() } })
    check('本渠道编号小写也能寻址', lower.status === 200 && lower.json?.data?.customerNo === C.luluBuyer1)
  }

  section('W7-1：本站拉黑的效果（lulu 下单被拒、主站可下单、lulu 仍可看订单与留言）')
  {
    const blk = await call(RF(rBlock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 }, body: { reason: 'ABUSE', note: '恶意售后', tenantId: ZZ.id, blockedByKind: 'PLATFORM' } })
    check('拉黑 204', blk.status === 204, blk.text.slice(0, 100))
    const row = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.luluBuyer1 } })
    check('落库：blockedByKind=TENANT、原因 ABUSE：恶意售后、body 里的 tenantId / blockedByKind 被忽略（T8）', row.tenantId === LU.id && row.blockedByKind === 'TENANT' && row.blockReason === 'ABUSE：恶意售后' && row.blockedBy === w.users.luluOwner.id)
    const bad = await call(RF(rBlock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 }, body: { reason: 'WHATEVER' } })
    check('原因不在枚举 → 400', bad.status === 400)
    const noReason = await call(RF(rBlock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 }, body: {} })
    check('缺原因 → 400', noReason.status === 400)
    const d = await call(RF(rCustomer.GET), owner, { params: { customerNo: C.luluBuyer1 } })
    check('详情：blocked、非平台、给出渠道自己的原因', d.json?.data?.blocked === true && d.json.data.blockedByPlatform === false && d.json.data.blockReason === 'ABUSE：恶意售后')
    const blockedList = await call(RF(rCustomers.GET), owner, { path: '/api/partner/customers?blocked=yes' })
    check('按「已限制」筛选命中', (blockedList.json?.data?.rows ?? []).map((x: Json) => x.customerNo).join() === C.luluBuyer1)

    const u = w.users.luluBuyer1
    const onLulu = await callRoute(RF(ordersRoute.POST), { host: LU.host, token: w.token(u, LU), method: 'POST', path: '/api/orders', body: { productId: w.products.auto, quantity: 1 }, headers: { 'cf-connecting-ip': nextIp() } })
    check('lulu 下单被拒：中性文案', onLulu.status === 403 && onLulu.json?.error === '该账号暂无法在本站下单，请联系客服', onLulu.text.slice(0, 160))
    const onMain = await callRoute(RF(ordersRoute.POST), { host: 'bigolab.com', token: w.token(u, w.main), method: 'POST', path: '/api/orders', body: { productId: w.products.auto, quantity: 1 }, headers: { 'cf-connecting-ip': nextIp() } })
    check('主站下单不受影响', onMain.json?.success === true, onMain.text.slice(0, 160))
    const list = await callRoute(RF(ordersRoute.GET), { host: LU.host, token: w.token(u, LU), path: '/api/orders?page=1&pageSize=50', headers: { 'cf-connecting-ip': nextIp() } })
    const mine = (list.json?.data?.list ?? []) as Json[]
    const luluAuto = Array.isArray(mine) ? mine.find((o: Json) => o.orderNo === w.orders.luluAuto.orderNo) : null
    check('lulu 仍可查看已购订单并取卡', list.status === 200 && !!luluAuto && JSON.stringify(luluAuto).includes(MARK.cardPlain), list.text.slice(0, 160))
    const msg = await callRoute(RF(msgRoute.POST), {
      host: LU.host,
      token: w.token(u, LU),
      method: 'POST',
      path: `/api/orders/${w.orders.luluAuto.id}/messages`,
      params: { id: String(w.orders.luluAuto.id) },
      body: { content: 'itest 拉黑后留言' },
      headers: { 'cf-connecting-ip': nextIp() },
    })
    check('lulu 仍可留言', msg.status === 200 || msg.status === 201, `${msg.status} ${msg.text.slice(0, 120)}`)

    const un = await call(RF(rUnblock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 } })
    check('解除 204', un.status === 204)
    const un2 = await call(RF(rUnblock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 } })
    check('重复解除（本来就没拉黑）→ 204 幂等', un2.status === 204)
    const r2 = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.luluBuyer1 } })
    check('解除后四列清空', r2.blockedAt === null && r2.blockedBy === null && r2.blockedByKind === null && r2.blockReason === null)
    check('拉黑 / 解除各写一条审计', (await prisma.auditEvent.count({ where: { tenantId: LU.id, action: { in: ['customer.block', 'customer.unblock'] }, targetId: C.luluBuyer1 } })) === 2)

    // 平台设的拉黑：渠道解除 404、再拉黑 409、详情不给平台原因
    await prisma.tenantCustomer.update({ where: { publicNo: C.luluBuyer1 }, data: { blockedAt: new Date(), blockedBy: w.users.sa.id, blockedByKind: 'PLATFORM', blockReason: 'ITEST-PLATFORM-REASON-机密' } })
    const pu = await call(RF(rUnblock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 } })
    check('平台拉黑：渠道解除 → 404 同体', isNotFound(pu))
    const pb = await call(RF(rBlock.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 }, body: { reason: 'OTHER' } })
    check('平台拉黑：渠道再拉黑 → 409，不改写成渠道拉黑', pb.status === 409 && (await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.luluBuyer1 } })).blockedByKind === 'PLATFORM')
    const pd = await call(RF(rCustomer.GET), owner, { params: { customerNo: C.luluBuyer1 } })
    check('平台拉黑：详情 blockedByPlatform=true、blockReason=null、不含平台原因原文', pd.json?.data?.blockedByPlatform === true && pd.json.data.blockReason === null && !pd.text.includes('ITEST-PLATFORM-REASON'))
    const pl = await call(RF(rCustomers.GET), owner, { path: `/api/partner/customers?q=${encodeURIComponent(w.users.luluBuyer1.email)}` })
    check('平台拉黑：列表不含平台原因原文', !pl.text.includes('ITEST-PLATFORM-REASON'))
    await prisma.tenantCustomer.update({ where: { publicNo: C.luluBuyer1 }, data: { blockedAt: null, blockedBy: null, blockedByKind: null, blockReason: null } })
  }

  // =========================================================================
  section('W7-2：客户详情只含本站订单与本站汇总；无禁用键')
  {
    const cross = w.users.crossBuyer
    const crossNo = (await prisma.tenantCustomer.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: LU.id, userId: cross.id } } })).publicNo
    // 该用户只在主站开票、只在主站退款：渠道看到的开票数 / 退款数必须是 0
    await prisma.invoice.create({
      data: {
        invoiceNo: `ITM${RUN}`.toUpperCase().slice(0, 32),
        claudeAccount: cross.email,
        subscriptionType: 'itest',
        sellingPrice: new Prisma.Decimal('129.00'),
        invoiceAmount: new Prisma.Decimal('136.74'),
        taxFee: new Prisma.Decimal('7.74'),
        title: 'ITEST 主站抬头',
        status: 'ISSUED',
        payStatus: 'PAID',
        tenantId: 1,
        shopOrderId: w.orders.crossMain.id,
        userId: cross.id,
      },
    })
    await prisma.order.update({ where: { id: w.orders.crossMain.id }, data: { refundedGoodsCents: 12900, payStatus: 'REFUNDED' } })
    await prisma.tenantCustomer.update({ where: { publicNo: crossNo }, data: { platformNote: 'ITEST-PLATFORM-NOTE-机密' } })
    const r = await call(RF(rCustomer.GET), owner, { params: { customerNo: crossNo } })
    const d = r.json?.data
    check('详情 200', r.status === 200, r.text.slice(0, 200))
    check('只含本站订单（crossLulu），不含主站订单', d?.orders?.length === 1 && d.orders[0].orderNo === w.orders.crossLulu.orderNo && !r.text.includes(w.orders.crossMain.orderNo))
    check('只在主站开票 → invoiceCount = 0', d?.invoiceCount === 0)
    check('只在主站退款 → refundCount = 0', d?.refundCount === 0)
    check('orderCount = 1、paidCents = 14000（只算本站）', d?.orderCount === 1 && d.paidCents === 14000)
    scanKeys('客户详情', r.json)
    check('顶层无 createdAt（User.createdAt 不给）、无 joinedVia / platformNote', d && !('createdAt' in d) && !('joinedVia' in d) && !('platformNote' in d))
    noValues('值扫描：平台备注、主站发票号、他站邮箱、特征成本', r.text, ['ITEST-PLATFORM-NOTE', `ITM${RUN}`.toUpperCase(), w.users.zzBuyer1.email, MARK.cardCost, String(MARK.costBaseCents)])
    const b1 = await call(RF(rCustomer.GET), owner, { params: { customerNo: C.luluBuyer1 } })
    check('luluBuyer1：本站发票 1 张（夹具）、订单 2（卡密 + 接码）', b1.json?.data?.invoiceCount === 1 && b1.json.data.orderCount === 2, JSON.stringify({ i: b1.json?.data?.invoiceCount, o: b1.json?.data?.orderCount }))

    // PATCH：note / tags；未知字段忽略；超长 400
    const p = await call(RF(rCustomer.PATCH), owner, { method: 'PATCH', params: { customerNo: crossNo }, body: { note: '老客户', tags: ['VIP', '回头客', 'VIP'], platformNote: 'HACK', joinedVia: 'HACK', userId: 1 } })
    check('PATCH 204', p.status === 204, p.text.slice(0, 120))
    const row = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: crossNo } })
    check('落库 note、tags 去重；platformNote / joinedVia 未被改（T8）', row.note === '老客户' && JSON.stringify(row.tags) === JSON.stringify(['VIP', '回头客']) && row.platformNote === 'ITEST-PLATFORM-NOTE-机密' && row.joinedVia === 'ORDER')
    const tooMany = await call(RF(rCustomer.PATCH), owner, { method: 'PATCH', params: { customerNo: crossNo }, body: { tags: Array.from({ length: 11 }, (_, i) => `t${i}`) } })
    check('标签 11 个 → 400', tooMany.status === 400)
    const tooLong = await call(RF(rCustomer.PATCH), owner, { method: 'PATCH', params: { customerNo: crossNo }, body: { tags: ['一二三四五六七八九十十一十二'] } })
    check('标签 13 字 → 400', tooLong.status === 400)
    const noteLong = await call(RF(rCustomer.PATCH), owner, { method: 'PATCH', params: { customerNo: crossNo }, body: { note: 'x'.repeat(501) } })
    check('备注 501 字 → 400', noteLong.status === 400)
    const empty = await call(RF(rCustomer.PATCH), owner, { method: 'PATCH', params: { customerNo: crossNo }, body: {} })
    check('空 PATCH → 400', empty.status === 400)
    const textPlain = await callRoute(RF(rCustomer.PATCH), { host: LU.host, token: owner.token, method: 'PATCH', params: { customerNo: crossNo }, body: '{"note":"x"}', headers: { 'content-type': 'text/plain', 'cf-connecting-ip': nextIp() } })
    check('text/plain 写请求被拒（同源第二道）', textPlain.status === 404 || textPlain.status === 400)
    const byTag = await call(RF(rCustomers.GET), owner, { path: `/api/partner/customers?tag=${encodeURIComponent('回头客')}` })
    check('按标签筛选命中（JSON array_contains）', (byTag.json?.data?.rows ?? []).map((x: Json) => x.customerNo).join() === crossNo, byTag.text.slice(0, 200))
    const byTagNone = await call(RF(rCustomers.GET), owner, { path: `/api/partner/customers?tag=${encodeURIComponent('回头')}` })
    check('标签精确匹配（「回头」不命中「回头客」）', byTagNone.json?.data?.total === 0)
    check('normalizeTags 纯函数：去空白 / 去重', JSON.stringify(normalizeTags([' a ', 'a', '', 'b'])) === '["a","b"]')
  }

  // =========================================================================
  section('W7-3：lulu 注册、只在主站下单的用户')
  {
    const u = w.users.luluRegMainOrder
    const r = await call(RF(rCustomers.GET), owner, { path: `/api/partner/customers?q=${encodeURIComponent(u.email)}` })
    const row = r.json?.data?.rows?.[0]
    check('出现在 lulu 客户列表（注册关系）、订单数 0、实付 0', r.json?.data?.total === 1 && row?.customerNo === C.luluRegMainOrder && row.orderCount === 0 && row.paidCents === 0 && row.lastOrderAt === null)
    const d = await call(RF(rCustomer.GET), owner, { params: { customerNo: C.luluRegMainOrder } })
    check('详情看不到主站订单', d.json?.data?.orders?.length === 0 && !d.text.includes(w.orders.regMainOrder.orderNo))
    const ban = await call(RF(rBan.POST), owner, { method: 'POST', params: { customerNo: C.luluRegMainOrder }, body: { reason: 'itest 零订单也能申请全局封禁' } })
    check('零订单客户申请全局封禁 200 + requestNo', ban.status === 200 && /^AS\d{6}[0-9A-Z]{8}$/.test(ban.json?.data?.requestNo ?? ''), ban.text.slice(0, 160))
    const as = await prisma.tenantAfterSale.findUnique({ where: { requestNo: ban.json?.data?.requestNo ?? '-' } })
    check('BAN_REQUEST 落库：orderId 为空、tenantId=lulu', !!as && as.kind === 'BAN_REQUEST' && as.orderId === null && as.tenantId === LU.id && as.status === 'PENDING')
    const again = await call(RF(rBan.POST), owner, { method: 'POST', params: { customerNo: C.luluRegMainOrder }, body: { reason: 'itest 重复申请全局封禁' } })
    check('同一客户重复申请 → 409', again.status === 409)
    const short = await call(RF(rBan.POST), owner, { method: 'POST', params: { customerNo: C.luluBuyer1 }, body: { reason: '短' } })
    check('原因不足 5 字 → 400', short.status === 400)
    scanKeys('申请封禁', ban.json)
  }

  // =========================================================================
  section('客户导出：OWNER；每日 5 次；水印；不含他站行')
  {
    const ex = () => call(RF(rCustExport.GET), owner, { path: '/api/partner/customers/export' })
    const r = await ex()
    check('导出 200 CSV', r.status === 200 && r.text.includes('客户编号'), r.text.slice(0, 120))
    const rows = parseCsv(r.text)
    check('首行水印：导出人、时间、仅用于本站售后', /导出人：.*it-lulu-owner/.test(rows[0]?.[0] ?? '') && (rows[0]?.[0] ?? '').includes('仅用于本站售后'))
    check('含本站客户、不含 zz 客户与主站老用户', r.text.includes(w.users.luluBuyer1.email) && !r.text.includes(w.users.zzBuyer1.email) && !r.text.includes(w.users.mainOldLoginLulu.email))
    noValues('导出值扫描：平台备注、成本特征值', r.text, ['ITEST-PLATFORM-NOTE', MARK.cardCost])
    for (let i = 0; i < 4; i++) await ex()
    const sixth = await ex()
    check('第 6 次 → 429', sixth.status === 429, `${sixth.status}`)
    check('超限写 DENIED 审计', (await prisma.auditEvent.count({ where: { tenantId: LU.id, action: 'customer.export', result: 'DENIED', reasonCode: 'DAILY_LIMIT' } })) === 1)
    check('成功导出恰好 5 次', (await prisma.auditEvent.count({ where: { tenantId: LU.id, action: 'customer.export', result: 'OK' } })) === 5)
  }

  // =========================================================================
  section('通知中心：列表、未读数、标已读（他站编号静默跳过）')
  {
    // 前面的留言会产生 BUYER_MESSAGE 通知（WP2）：先全部置已读，本段只数新写的两条
    await prisma.tenantNotice.updateMany({ where: { tenantId: LU.id, readAt: null }, data: { readAt: new Date() } })
    await notice.emitTenantNotice(null, { tenantId: LU.id, kind: 'ORDER_PAID', title: '订单已支付', body: `买家 ${w.users.luluBuyer1.email} 付款 140.00 元`, refType: 'order', refKey: w.orders.luluAuto.orderNo, dedupeKey: `it7:${RUN}:1` })
    await notice.emitTenantNotice(null, { tenantId: LU.id, kind: 'STATEMENT', title: '结算单已生成', refType: 'statement', dedupeKey: `it7:${RUN}:2` })
    await notice.emitTenantNotice(null, { tenantId: ZZ.id, kind: 'ORDER_PAID', title: 'zz 订单已支付', dedupeKey: `it7:${RUN}:3` })
    await notice.waitTenantNoticePushesForTest()
    const luluNos = (await prisma.tenantNotice.findMany({ where: { tenantId: LU.id, readAt: null }, select: { publicNo: true, id: true } })).map((n) => n.publicNo)
    const zzNotice = await prisma.tenantNotice.findFirstOrThrow({ where: { tenantId: ZZ.id } })
    const cnt = await call(RF(rUnread.GET), owner)
    check('未读数 = 2（只算本渠道）', cnt.json?.data?.count === 2, cnt.text)
    scanKeys('未读数', cnt.json)
    const l = await call(RF(rNotices.GET), owner, { path: '/api/partner/notices?unread=1' })
    check('列表只含本渠道 2 条', l.json?.data?.total === 2 && !l.text.includes('zz 订单已支付'))
    scanKeys('通知列表', l.json)
    const bad = await call(RF(rNotices.GET), owner, { path: '/api/partner/notices?unread=yes' })
    check('unread 参数非法 → 400', bad.status === 400)
    const zzRead = await call(RF(rNoticeRead.POST), owner, { method: 'POST', body: { noticeNos: [zzNotice.publicNo, 'ZZZZZZZZZZZZ', String(zzNotice.id)] } })
    check('用 zz 的 / 不存在 / 自增编号标已读 → 204（批量静默跳过）', zzRead.status === 204)
    check('zz 的通知仍未读（数据库不变）', (await prisma.tenantNotice.findUniqueOrThrow({ where: { id: zzNotice.id } })).readAt === null)
    const one = await call(RF(rNoticeRead.POST), owner, { method: 'POST', body: { noticeNos: [luluNos[0].toLowerCase()] } })
    check('标一条已读 204', one.status === 204 && (await call(RF(rUnread.GET), owner)).json?.data?.count === 1)
    const none = await call(RF(rNoticeRead.POST), owner, { method: 'POST', body: {} })
    check('既无编号也无 all → 400', none.status === 400)
    const all = await call(RF(rNoticeRead.POST), owner, { method: 'POST', body: { all: true, tenantId: ZZ.id } })
    check('全部已读 204；body 里的 tenantId 被忽略（zz 仍未读）', all.status === 204 && (await call(RF(rUnread.GET), owner)).json?.data?.count === 0 && (await prisma.tenantNotice.findUniqueOrThrow({ where: { id: zzNotice.id } })).readAt === null)
  }

  // =========================================================================
  section('W7-7：设置与企业微信 webhook（只写不读回、前缀限制、载荷脱敏、测试限频）')
  {
    const g = await call(RF(rSettings.GET), owner)
    check('设置 200', g.status === 200, g.text.slice(0, 200))
    scanKeys('设置', g.json)
    const t = g.json?.data?.tenant
    check('费率只读字段、payoutHold 布尔、noticePrefs 全量（缺省开）', t?.feeRateBp === 150 && t.payoutHold === false && Object.keys(g.json.data.noticePrefs).length === TENANT_NOTICE_KINDS.length && Object.values(g.json.data.noticePrefs).every((v) => v === true))
    check('未配置 webhook', g.json?.data?.webhookConfigured === false)
    const KEY = `itest-${RUN}-secretkey`
    const URL_OK = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${KEY}`
    for (const u of ['https://example.com/hook', 'http://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=x', 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=', `${URL_OK} x`]) {
      const r = await call(RF(rWebhook.PUT), owner, { method: 'PUT', body: { url: u } })
      check(`非企业微信前缀拒绝：${u.slice(0, 50)}`, r.status === 400, `${r.status}`)
    }
    const noTest = await call(RF(rWebhookTest.POST), owner, { method: 'POST' })
    check('未配置时发送测试 → 400', noTest.status === 400)
    const ok = await call(RF(rWebhook.PUT), owner, { method: 'PUT', body: { url: URL_OK } })
    check('企业微信地址保存 204', ok.status === 204, ok.text)
    const enc = (await prisma.tenant.findUniqueOrThrow({ where: { id: LU.id } })).wecomWebhookEnc
    check('库里存的是密文（不含 key 明文）', !!enc && !enc.includes(KEY))
    const g2 = await call(RF(rSettings.GET), owner)
    check('GET 设置不回显 URL、只给 webhookConfigured=true', g2.json?.data?.webhookConfigured === true && !g2.text.includes(KEY) && !g2.text.includes('qyapi'))
    const aud = await prisma.auditEvent.findFirst({ where: { tenantId: LU.id, action: 'settings.webhook' }, orderBy: { id: 'desc' } })
    check('审计只记「已配置」，不记地址', !!aud && !JSON.stringify(aud.diff).includes(KEY) && !JSON.stringify(aud.publicDiff).includes(KEY))

    pushed.length = 0
    const tst = await call(RF(rWebhookTest.POST), owner, { method: 'POST' })
    await notice.waitTenantNoticePushesForTest()
    check('发送测试 204，推送到所配地址 1 次', tst.status === 204 && pushed.length === 1 && pushed[0].url === URL_OK, `${tst.status} ${pushed.length}`)
    // 一条正文里带买家邮箱的通知：推送载荷必须脱敏
    await notice.emitTenantNotice(null, { tenantId: LU.id, kind: 'BUYER_MESSAGE', title: `买家 ${w.users.luluBuyer2.email} 留言`, body: `卡密 ${MARK.cardPlain} 用不了，联系 ${w.users.luluBuyer2.email}`, refType: 'order', refKey: w.orders.luluManual.orderNo, dedupeKey: `it7:${RUN}:mail` })
    await notice.waitTenantNoticePushesForTest()
    const all = pushed.map((p) => p.payload).join('\n')
    check('推送载荷不含任何邮箱', !/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(all), all.slice(0, 200))
    check('推送载荷不含夹具卡密（通知调用方不传卡密；这里验证测试消息与通道本身不带）', !pushed[0].payload.includes(MARK.cardPlain))
    // 关掉 TENANT_STATUS 推送 → 测试 400；未知类型 400
    const off = await call(RF(rNoticePrefs.PUT), owner, { method: 'PUT', body: { prefs: { TENANT_STATUS: false } } })
    check('通知偏好保存 200，返回全量', off.status === 200 && off.json?.data?.noticePrefs?.TENANT_STATUS === false && off.json.data.noticePrefs.ORDER_PAID === true)
    const tOff = await call(RF(rWebhookTest.POST), owner, { method: 'POST' })
    check('TENANT_STATUS 推送关闭时发送测试 → 400', tOff.status === 400)
    const unk = await call(RF(rNoticePrefs.PUT), owner, { method: 'PUT', body: { prefs: { HACK: true } } })
    check('未知通知类型 → 400', unk.status === 400)
    // 并发：同时各关一种类型（整块 JSON 读—合并—写回），行锁保证谁都不丢；审计条数与实际改动一致
    const raceKinds = ['ORDER_PAID', 'BUYER_MESSAGE', 'AFTER_SALE_RESULT', 'STATEMENT', 'PAYOUT', 'SUPPLY_CHANGED'] as const
    const noticeAuditBefore = await prisma.auditEvent.count({ where: { tenantId: LU.id, action: 'settings.notice' } })
    const race = await Promise.all(raceKinds.map((k) => call(RF(rNoticePrefs.PUT), owner, { method: 'PUT', body: { prefs: { [k]: false } } })))
    const afterRace = (await call(RF(rSettings.GET), owner)).json?.data?.noticePrefs ?? {}
    check('并发各关一种通知类型：全部 200', race.every((r) => r.status === 200), race.map((r) => r.status).join(','))
    check('并发各关一种通知类型：库里 6 种全部关闭（不丢写）', raceKinds.every((k) => afterRace[k] === false), JSON.stringify(afterRace))
    check(
      '并发各关一种通知类型：settings.notice 审计恰好 +6',
      (await prisma.auditEvent.count({ where: { tenantId: LU.id, action: 'settings.notice' } })) === noticeAuditBefore + raceKinds.length,
    )
    await call(RF(rNoticePrefs.PUT), owner, { method: 'PUT', body: { prefs: Object.fromEntries(raceKinds.map((k) => [k, true])) } })
    await call(RF(rNoticePrefs.PUT), owner, { method: 'PUT', body: { prefs: { TENANT_STATUS: true } } })
    let last = 0
    for (let i = 0; i < 5; i++) last = (await call(RF(rWebhookTest.POST), owner, { method: 'POST' })).status
    check('测试每小时 5 次：第 6 次 → 429', last === 429, `${last}`)
    const clr = await call(RF(rWebhook.PUT), owner, { method: 'PUT', body: { url: null } })
    check('清除 webhook 204 → 未配置', clr.status === 204 && (await call(RF(rSettings.GET), owner)).json?.data?.webhookConfigured === false)
  }

  // =========================================================================
  section('W7-8：操作日志（平台行显示「平台」、只给 publicDiff、不含原因原文 / memo / 成本 / authz.denied / IP / UA）')
  {
    const fakeReq = new Request('https://bigolab.com/api/admin/x', { headers: { 'cf-connecting-ip': '10.99.88.77', 'user-agent': 'ITEST-ADMIN-UA' } })
    const lstNo = w.listings.luluAuto
    // 站长用 COST 规则批量设进货价（WP5 的写法：diff 带规则与成本，publicDiff 只给新旧进货价）
    await writeAudit(null, {
      actorKind: 'PLATFORM',
      actorUserId: w.users.sa.id,
      tenantId: LU.id,
      action: 'listing.batch_supply',
      targetType: 'listing',
      targetId: 'batch:1',
      reason: `按成本 ${MARK.costBaseCents} 加价 3%`,
      diff: { rule: { base: 'COST', pct: 300 }, rows: [{ listingNo: lstNo, costCents: MARK.costBaseCents, marginCents: 324, newSupplyCents: MARK.supplyCents }] },
      publicDiff: [{ listingNo: lstNo, productName: 'ITEST 卡密', oldSupplyCents: 11000, newSupplyCents: MARK.supplyCents }],
      req: fakeReq,
    })
    await writeAudit(null, {
      actorKind: 'PLATFORM',
      actorUserId: w.users.sa.id,
      tenantId: LU.id,
      action: 'tenant.payout_hold',
      targetType: 'tenant',
      targetId: String(LU.id),
      reasonCode: '对账差异待人工核查',
      reason: 'ITEST-HOLD-REASON-机密',
      diff: { payoutHold: true, payoutHoldReason: 'ITEST-HOLD-REASON-机密' },
      publicDiff: { payoutHold: true },
      req: fakeReq,
    })
    // 平台行没给 publicDiff：diff 里即使有成本，渠道侧也只能拿到 null
    await writeAudit(null, { actorKind: 'PLATFORM', actorUserId: w.users.sa.id, tenantId: LU.id, action: 'order.resettle', targetType: 'order', targetId: w.orders.luluAuto.orderNo, diff: { cost: MARK.cardCost }, req: fakeReq })
    // 平台行的 publicDiff 写错了（带 memo / cost）：兜底删禁用键
    await writeAudit(null, { actorKind: 'PLATFORM', actorUserId: w.users.sa.id, tenantId: LU.id, action: 'deposit.in', targetType: 'ledger', publicDiff: { amountCents: 100, memo: 'ITEST-MEMO-LEAK', cost: MARK.cardCost }, req: fakeReq })
    // 越权拒绝：渠道永远看不到
    await writeAudit(null, { actorKind: 'TENANT', actorUserId: w.users.luluOwner.id, tenantId: LU.id, action: 'authz.denied', targetType: 'perm', targetId: 'finance.apply', result: 'DENIED', reasonCode: 'perm', req: fakeReq })
    // 用 WP3 的真实调账函数（带内部 memo 与原因）
    const adj = await L.adjust({ tenantId: LU.id, amountCents: 100, reasonCode: 'COMPENSATE', reason: 'ITEST-MEMO-内部原因', publicMemo: '补偿', requestId: `it7-adj-${RUN}`, operatorId: w.users.sa.id })
    check('调账 OK', adj === 'OK')

    const r = await call(RF(rAudit.GET), owner, { path: '/api/partner/audit?pageSize=100' })
    check('操作日志 200', r.status === 200, r.text.slice(0, 200))
    const rows = (r.json?.data?.rows ?? []) as Json[]
    scanKeys('操作日志', r.json)
    noValues('值扫描：成本特征值、原因原文、memo、平台 IP / UA、渠道请求 UA', r.text, [MARK.cardCost, String(MARK.costBaseCents), 'ITEST-HOLD-REASON', 'ITEST-MEMO', '10.99.88.77', 'ITEST-ADMIN-UA', 'ITEST-UA-wp7', '对账差异待人工核查'])
    check('不含 authz.denied / authz.noise', !rows.some((x) => String(x.action).startsWith('authz.')))
    const bs = rows.find((x) => x.action === 'listing.batch_supply')
    check('批量进货价：actor=平台，publicDiff 只有新旧进货价', bs?.actor === '平台' && sameJson(bs.publicDiff, [{ listingNo: lstNo, productName: 'ITEST 卡密', oldSupplyCents: 11000, newSupplyCents: MARK.supplyCents }]), JSON.stringify(bs))
    const hold = rows.find((x) => x.action === 'tenant.payout_hold')
    check('payoutHold：publicDiff={payoutHold:true}，不含原因；targetId（租户自增 id）不给；中文 reasonCode 不给', hold?.actor === '平台' && sameJson(hold.publicDiff, { payoutHold: true }) && hold.targetId === null && hold.reasonCode === null)
    const rs = rows.find((x) => x.action === 'order.resettle')
    check('平台行没有 publicDiff → null（不回落 diff）', rs?.actor === '平台' && rs.publicDiff === null && rs.targetId === w.orders.luluAuto.orderNo)
    const dep = rows.find((x) => x.action === 'deposit.in')
    check('publicDiff 兜底删禁用键（memo / cost）', sameJson(dep?.publicDiff, { amountCents: 100 }), JSON.stringify(dep))
    const ad = rows.find((x) => x.action === 'ledger.adjust')
    check('调账：publicDiff 只有金额与对外说明，reasonCode 为代码', ad?.actor === '平台' && sameJson(ad.publicDiff, { amountCents: 100, publicMemo: '补偿' }) && ad.reasonCode === 'COMPENSATE', JSON.stringify(ad))
    const own = rows.find((x) => x.action === 'customer.block')
    check('渠道自己的操作：actor = 成员昵称、publicDiff = 提交内容', own?.actor === 'it-lulu-owner' && own.publicDiff?.reason === 'ABUSE')
    const f1 = await call(RF(rAudit.GET), owner, { path: '/api/partner/audit?action=customer' })
    check('按前缀筛选 customer.*', (f1.json?.data?.rows ?? []).length > 0 && f1.json.data.rows.every((x: Json) => String(x.action).startsWith('customer.')))
    const f2 = await call(RF(rAudit.GET), owner, { path: '/api/partner/audit?action=authz.denied' })
    check('筛 authz.denied → 空', f2.json?.data?.total === 0)
    const f3 = await call(RF(rAudit.GET), owner, { path: '/api/partner/audit?action=DROP%20TABLE' })
    check('非法 action 参数 → 400', f3.status === 400)
    const zzA = await call(RF(rAudit.GET), zzOwner, { path: '/api/partner/audit?pageSize=100' })
    check('zz 的操作日志看不到 lulu 的任何行', zzA.status === 200 && !zzA.text.includes(lstNo) && !zzA.text.includes(C.luluBuyer1))
    check('sanitizePublicDiff 纯函数：嵌套删除禁用键', sameJson(sanitizePublicDiff({ a: [{ userId: 1, b: 2 }], id: 3 }), { a: [{ b: 2 }] }))
  }

  // =========================================================================
  section('W7-4：结算中心三个数按设计 10.11 ② 逐时点对齐')
  catId = (await prisma.category.create({ data: { name: `${NAME_PREFIX}-W7-${RUN}`, sortOrder: 999 } })).id
  const P = await mkProduct('W7卡密')
  const P3 = await mkProduct('W7卡密少')
  await addCards(P, 20)
  await addCards(P3, 1)
  const F = await mkTenant('f')
  const fOwner = await createUser('w7-f-owner', { registeredTenantId: F.id })
  const fBuyer = await createUser('w7-f-buyer')
  await prisma.tenantMember.create({ data: { tenantId: F.id, userId: fOwner.id, role: 'OWNER', status: 1 } })
  await prisma.tenantCustomer.create({ data: { publicNo: `W7F${RUN}`.toUpperCase().replace(/[ILOU]/g, 'X').padEnd(12, '0').slice(0, 12), tenantId: F.id, userId: fBuyer.id, joinedVia: 'ORDER' } })
  const lF = await mkListing(F.id, P, 11000, 14000)
  const lF3 = await mkListing(F.id, P3, 11000, 14000)
  const fo: Who = { host: F.host, token: signTestToken(fOwner, F.code, F.id) }
  const sum = async () => (await call(RF(rSummary.GET), fo)).json?.data
  const tri = (t: Json) => [t?.balanceCents, t?.feeCents, t?.payoutCents]
  const eq = (name: string, got: unknown, want: unknown) => check(name, JSON.stringify(got) === JSON.stringify(want), `得到 ${JSON.stringify(got)}，期望 ${JSON.stringify(want)}`)
  const refund = async (orderId: number, p: { refundGoodsCents: number; refundTaxCents?: number; refundQty?: number; fullStatus?: 'REFUNDED' }) => {
    const cur = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    return prisma.$transaction((tx) =>
      L.applyRefund(tx, {
        orderId,
        refundGoodsCents: p.refundGoodsCents,
        refundTaxCents: p.refundTaxCents ?? 0,
        refundQty: p.refundQty,
        bearer: 'PROPORTIONAL',
        requestId: `it7-rf-${orderId}-${cur.settleVersion}`,
        operatorId: 1,
        expectedVersion: cur.settleVersion,
        fullStatus: p.fullStatus,
      }),
    )
  }
  let st1No = ''
  {
    const s0 = await sum()
    eq('D0 可结算 0/0/0', tri(s0?.balances?.available), [0, 0, 0])
    check('公式随费率：1.5% / 2%', s0?.formula?.includes('× 1.5%') && s0.formula.includes('× 2%'), s0?.formula)
    check('rates 与渠道配置一致（最低结算 20 元）', s0?.rates?.minPayoutCents === 2000 && s0.rates.feeRateBp === 150 && s0.rates.holdDays === 7)
    check('初始 canApply=false（NEGATIVE：余额不为正）', s0?.canApply === false && s0.applyBlockReason === 'NEGATIVE')
    scanKeys('结算中心概览', { success: true, data: s0 })

    const O1 = await mkOrder({ tenant: F, user: fBuyer, productId: P, listingId: lF })
    const O2 = await mkOrder({ tenant: F, user: fBuyer, productId: P, listingId: lF, invoice: true })
    check('O1 付款', await V.fulfillOrder(O1.id))
    check('O2 付款（结账开票）', await V.fulfillOrder(O2.id))
    let s = await sum()
    eq('D1 可结算 0/0/0', tri(s.balances.available), [0, 0, 0])
    eq('D1 冻结中 6280/424/5856', tri(s.balances.pending), [6280, 424, 5856])
    check('预计可结算日历：D8 一天 5856', s.releaseCalendar.length === 1 && s.releaseCalendar[0].payoutCents === 5856, JSON.stringify(s.releaseCalendar))
    const O3 = await mkOrder({ tenant: F, user: fBuyer, productId: P3, listingId: lF3, qty: 2, invoice: true })
    check('O3 付款（2 件、只有 1 张卡）', await V.fulfillOrder(O3.id))
    s = await sum()
    eq('D2 冻结中 12840/852/11988', tri(s.balances.pending), [12840, 852, 11988])
    const r3 = await refund(O3.id, { refundGoodsCents: 14000, refundTaxCents: 840, refundQty: 1 })
    check('D4 按件退 O3 的 1 件', r3.ok === true, JSON.stringify(r3))
    await prisma.order.update({ where: { id: O3.id }, data: { deliveredAt: at(3, 0) } }) // 模拟 D4 交付
    s = await sum()
    eq('D4 冻结中 9560/638/8922', tri(s.balances.pending), [9560, 638, 8922])
    const fo3 = await call(RF(rFinOrders.GET), fo, { path: `/api/partner/finance/orders?pageSize=100` })
    const v3 = (fo3.json?.data?.rows ?? []).find((x: Json) => x.orderNo === O3.orderNo)
    eq('订单明细 O3 剩余：余额 3280、手续费 214、打款 3066、冻结中', [v3?.balanceCents, v3?.feeCents, v3?.payoutCents, v3?.bucket, v3?.quantity], [3280, 214, 3066, 'PENDING', 2])
    scanKeys('订单结算明细', fo3.json)
    await prisma.invoice.updateMany({ where: { shopOrderId: O2.id }, data: { status: 'ISSUED', issuedAt: new Date() } })
    await L.releaseDue(at(7), { tenantId: F.id })
    s = await sum()
    eq('D8 可结算 6280/424/5856', tri(s.balances.available), [6280, 424, 5856])
    await prisma.invoice.updateMany({ where: { shopOrderId: O3.id }, data: { status: 'ISSUED', issuedAt: new Date() } })
    await L.releaseDue(at(10), { tenantId: F.id })
    s = await sum()
    eq('D11 可结算 9560/638/8922、冻结中归零', [tri(s.balances.available), tri(s.balances.pending)], [[9560, 638, 8922], [0, 0, 0]])
    check('D11 canApply=true（8922 ≥ 2000）', s.canApply === true && !s.applyBlockReason, JSON.stringify({ c: s.canApply, r: s.applyBlockReason }))
    const g1 = await S.generateStatement({ tenantId: F.id, origin: 'SCHEDULE', periodEnd: new Date(Date.now() + 2000), actorUserId: w.users.sa.id, requestId: `it7-${RUN}-g1` })
    check('D12 站长生成结算单 #1 = 8922', g1.ok === true && g1.netCents === 8922, JSON.stringify(g1))
    st1No = (g1 as { statementNo: string }).statementNo
    s = await sum()
    eq('#1 出单后可结算 0/0/0、结算中 8922', [tri(s.balances.available), s.balances.inPayoutCents], [[0, 0, 0], 8922])
    check('有未完结结算单 → canApply=false（OPEN_EXISTS）', s.canApply === false && s.applyBlockReason === 'OPEN_EXISTS')
    const d1 = await call(RF(rStmt.GET), fo, { params: { statementNo: st1No } })
    eq('#1 详情：货款 42000、进货款 −33000、发票分成 560、手续费 −638、余额 9560、打款 8922', [d1.json?.data?.goodsCents, d1.json?.data?.purchaseCents, d1.json?.data?.invShareCents, d1.json?.data?.feeCents, d1.json?.data?.grossCents, d1.json?.data?.netCents], [42000, -33000, 560, -638, 9560, 8922])
    const st1 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: st1No } })
    check('D12 开始打款', (await S.markPaying(st1.id, w.users.sa.id)) === 'OK')
    check('D13 登记打款 8922', (await S.registerPayout(st1.id, w.users.sa.id, { amountCents: 8922, withholdCents: 0, method: 'ALIPAY', externalTradeNo: `IT7X1-${RUN}-4321`, paidAt: new Date(), voucherType: 'SMALL_RECEIPT' })) === 'OK')
    s = await sum()
    eq('累计已打款 8922、结算中 0', [s.balances.paidTotalCents, s.balances.inPayoutCents], [8922, 0])
    const r1 = await refund(O1.id, { refundGoodsCents: 14000, refundQty: 1, fullStatus: 'REFUNDED' })
    check('D20 O1 全额退（已打款）', r1.ok === true, JSON.stringify(r1))
    s = await sum()
    eq('D20 可结算 −3000/−210/−2790、negative', [tri(s.balances.available), s.balances.negative], [[-3000, -210, -2790], true])
    check('D20 canApply=false（NEGATIVE）', s.canApply === false && s.applyBlockReason === 'NEGATIVE')
    {
      /*
       * 终审第 2 轮：退款冲回后页面上的扣减项必须按实际方向显示（进货款、手续费冲回显示「+」），
       * 否则「货款 − 进货款 + 发票分成 ± 调整 = 余额」「余额 − 手续费 = 预计打款」在页面上对不上。
       * 这里按页面实际渲染的字符串（format.ts 的 yuan / deduct）反解成分再求和，与服务端的余额 / 打款逐分比对。
       */
      const shown = (t: string) => {
        const m = /^([−+]?)¥([\d,]+)\.(\d{2})$/.exec(t)
        if (!m) return NaN
        const v = Number(m[2].replace(/,/g, '')) * 100 + Number(m[3])
        return m[1] === '−' ? -v : v
      }
      const c = s.composition.available as Json
      const b = s.balances.available as Json
      const parts = shown(yuan(c.goodsCents)) + shown(deduct(c.purchaseCents)) + shown(yuan(c.invShareCents)) + shown(yuan(c.otherCents))
      eq('D20 页面：进货款冲回显示 +¥110.00、手续费冲回显示 +¥2.10', [deduct(c.purchaseCents), deduct(c.feeCents), deduct(b.feeCents)], ['+¥110.00', '+¥2.10', '+¥2.10'])
      eq('D20 页面：显示的构成求和 = 显示的余额', parts, shown(yuan(b.balanceCents)))
      eq('D20 页面：显示的余额 − 显示的手续费 = 显示的预计打款', shown(yuan(b.balanceCents)) + shown(deduct(b.feeCents)), shown(yuan(b.payoutCents)))
      eq('正常扣减仍显示「−」、零显示 ¥0.00', [deduct(11000), deduct(0), deduct(null)], ['−¥110.00', '¥0.00', '—'])
    }
    const O4 = await mkOrder({ tenant: F, user: fBuyer, productId: P, listingId: lF, qty: 2 })
    check('D20 O4 付款即交付', await V.fulfillOrder(O4.id))
    s = await sum()
    eq('D20 冻结中 6000/420/5580', tri(s.balances.pending), [6000, 420, 5580])
    await L.releaseDue(at(7), { tenantId: F.id })
    s = await sum()
    eq('D27 可结算 3000/210/2790', tri(s.balances.available), [3000, 210, 2790])
    check('D27 canApply=true', s.canApply === true, JSON.stringify({ c: s.canApply, r: s.applyBlockReason }))
    // D28：渠道自己申请结算（W7-5 的成功路径）
    const rid = `it7${RUN}d28`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32)
    const ap = await call(RF(rApply.POST), fo, { method: 'POST', body: { requestId: rid } })
    check('D28 申请结算成功：打款 2790', ap.status === 200 && ap.json?.data?.ok === true && ap.json.data.netCents === 2790, ap.text.slice(0, 200))
    scanKeys('申请结算', ap.json)
    const st2No = ap.json?.data?.statementNo as string
    const ap2 = await call(RF(rApply.POST), fo, { method: 'POST', body: { requestId: rid } })
    check('同一 requestId 重复提交 → 同一张结算单', ap2.json?.data?.ok === true && ap2.json.data.statementNo === st2No)
    const st2 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: st2No } })
    check('#2 origin=REQUEST、seq=2、requestId 带渠道前缀', st2.origin === 'REQUEST' && st2.seq === 2 && st2.requestId === `p${F.id}_${rid}`)
    const d2 = await call(RF(rStmt.GET), fo, { params: { statementNo: st2No } })
    eq('#2 成分：货款 14000、进货款 −11000、手续费 −210、余额 3000、打款 2790', [d2.json?.data?.goodsCents, d2.json?.data?.purchaseCents, d2.json?.data?.feeCents, d2.json?.data?.grossCents, d2.json?.data?.netCents], [14000, -11000, -210, 3000, 2790])
    check('#2 已生成 STATEMENT 通知', (await prisma.tenantNotice.count({ where: { tenantId: F.id, kind: 'STATEMENT', refKey: st2No } })) === 1)
    await S.markPaying(st2.id, w.users.sa.id)
    check('#2 登记打款', (await S.registerPayout(st2.id, w.users.sa.id, { amountCents: 2790, withholdCents: 0, method: 'BANK', externalTradeNo: `IT7X2-${RUN}`, paidAt: new Date(), voucherType: 'SMALL_RECEIPT' })) === 'OK')
    s = await sum()
    check('两期共打款 11712', s.balances.paidTotalCents === 11712)
    // 公式随费率变化
    await prisma.tenant.update({ where: { id: F.id }, data: { feeRateBp: 200, invoiceShareRateBp: 300 } })
    s = await sum()
    check('改费率后公式显示 2% / 3%', s.formula.includes('（货款 + 发票分成）× 2%') && s.formula.includes('× 3%') && s.rates.feeRateBp === 200, s.formula)
    await prisma.tenant.update({ where: { id: F.id }, data: { feeRateBp: 150, invoiceShareRateBp: 200 } })
    const rec = await R.runReconcile({ tenantId: F.id })
    check('F 钱类对账全过', rec.items.filter((i) => i.level === 'MONEY' && !i.ok).length === 0, rec.items.filter((i) => i.level === 'MONEY' && !i.ok).map((i) => i.code).join(','))

    // =========================================================================
    section('W7-6：流水与结算单无内部字段；对账单 CSV 合计 = netCents')
    const lg = await call(RF(rLedger.GET), fo, { path: '/api/partner/finance/ledger?pageSize=100' })
    check('流水 200 且有行', lg.status === 200 && (lg.json?.data?.rows ?? []).length > 10)
    scanKeys('流水', lg.json)
    noValues('流水值扫描：eventKey 形态、调账 memo、成本', lg.text, ['sale:', 'rev:', 'stmt:', 'ITEST-MEMO', MARK.cardCost])
    const lgF = await call(RF(rLedger.GET), fo, { path: '/api/partner/finance/ledger?type=PAYOUT' })
    check('按类型筛选 PAYOUT：2 行', lgF.json?.data?.total === 2, lgF.text.slice(0, 200))
    const lgBad = await call(RF(rLedger.GET), fo, { path: '/api/partner/finance/ledger?type=HACK' })
    check('非法类型 → 400', lgBad.status === 400)
    const sl = await call(RF(rStmts.GET), fo)
    check('结算单列表 2 张、新的在前', sl.json?.data?.total === 2 && sl.json.data.rows[0].statementNo === st2No)
    scanKeys('结算单列表', sl.json)
    check('结算单列表：流水号只给后四位', sl.json?.data?.rows?.[1]?.tradeNoLast4 === '4321' && !sl.text.includes(`IT7X1-${RUN}`))
    scanKeys('结算单详情', d1.json)
    noValues('结算单详情值扫描：加密账号、流水号全文', d1.text, ['"enc"', `IT7X1-${RUN}`])
    for (const no of [st1No, st2No]) {
      const csv = await call(RF(rStmtCsv.GET), fo, { params: { statementNo: no } })
      const rows = parseCsv(csv.text)
      const header = rows[1] ?? []
      const ci = header.indexOf('金额(分)')
      const body = rows.slice(2).filter((r) => r.length === header.length)
      const lines = body.filter((r) => r[0] !== '合计')
      const total = body.find((r) => r[0] === '合计')
      const net = no === st1No ? 8922 : 2790
      const s1 = lines.reduce((a, r) => a + Number(r[ci]), 0)
      check(`对账单 ${no}：明细合计 = 合计行 = netCents ${net}`, csv.status === 200 && s1 === net && Number(total?.[ci]) === net, `${csv.status} ${s1} ${total?.[ci]}`)
      check(`对账单 ${no}：首行水印含结算单号`, (rows[0]?.[0] ?? '').includes(no))
    }
    check('下载对账单写审计', (await prisma.auditEvent.count({ where: { tenantId: F.id, action: 'statement.export' } })) === 2)
  }

  // =========================================================================
  section('W7-5：申请结算的各种拒绝原因、并发只成一张')
  {
    const G = await mkTenant('g')
    const gOwner = await createUser('w7-g-owner', { registeredTenantId: G.id })
    await prisma.tenantMember.create({ data: { tenantId: G.id, userId: gOwner.id, role: 'OWNER', status: 1 } })
    const gOwner2 = await createUser('w7-g-owner2', { registeredTenantId: G.id })
    await prisma.tenantMember.create({ data: { tenantId: G.id, userId: gOwner2.id, role: 'OWNER', status: 1 } })
    const go1: Who = { host: G.host, token: signTestToken(gOwner, G.code, G.id) }
    const go2: Who = { host: G.host, token: signTestToken(gOwner2, G.code, G.id) }
    // 申请结算的路由限频是每店面每人 10 次 / 分钟：前 7 次用店主 1，之后换店主 2（限频本身在后面单独测）
    let n = 0
    let go = go1
    const apply = async (rid?: string) => {
      n++
      if (n > 7) go = go2
      const r = await call(RF(rApply.POST), go, { method: 'POST', body: { requestId: rid ?? `it7g${RUN}n${n}`.slice(0, 32) } })
      return r.status === 200 ? r.json?.data : { httpStatus: r.status, text: r.text.slice(0, 100) }
    }
    const clearAttempts = () => prisma.auditEvent.deleteMany({ where: { tenantId: G.id, action: 'statement.apply' } })
    const gsum = async () => (await call(RF(rSummary.GET), go)).json?.data
    const adj = (c: number, k: string) => L.adjust({ tenantId: G.id, amountCents: c, reasonCode: 'ITEST', reason: 'itest', requestId: `it7-${RUN}-${k}`, operatorId: w.users.sa.id })

    const badId = await call(RF(rApply.POST), go2, { method: 'POST', body: { requestId: 'a b' } })
    check('requestId 格式不对 → 400', badId.status === 400)
    await adj(-500, 'g1')
    eq('余额为负 → NEGATIVE', (await apply())?.reason, 'NEGATIVE')
    check('summary 同样提示 NEGATIVE', (await gsum())?.applyBlockReason === 'NEGATIVE')
    await clearAttempts()
    await adj(1500, 'g2') // 1000
    eq('低于最低结算额 → BELOW_MIN', (await apply())?.reason, 'BELOW_MIN')
    check('summary 同样提示 BELOW_MIN', (await gsum())?.applyBlockReason === 'BELOW_MIN')
    // 余额构成（设计 10.8、12.1；终审完整性 #19）：可结算桶按成分拆开，与三个数恒等
    {
      const sm = await gsum()
      const c = sm?.composition?.available
      const t = sm?.balances?.available
      check('summary 含余额构成：货款 − 进货款 + 发票分成 ± 售后与调整 = 余额，余额 − 手续费 = 预计打款',
        !!c && !!t && c.goodsCents - c.purchaseCents + c.invShareCents + c.otherCents === t.balanceCents && t.balanceCents - c.feeCents === t.payoutCents && c.otherCents === 1000,
        JSON.stringify({ c, t }))
    }
    await clearAttempts()
    await adj(2000, 'g3') // 3000
    await prisma.tenant.update({ where: { id: G.id }, data: { payoutHold: true, payoutHoldReason: 'ITEST-HOLD-机密' } })
    const hs = await gsum()
    eq('payoutHold → HOLD', (await apply())?.reason, 'HOLD')
    check('summary 提示 HOLD、且不含原因原文', hs?.applyBlockReason === 'HOLD' && !JSON.stringify(hs).includes('ITEST-HOLD'))
    await prisma.tenant.update({ where: { id: G.id }, data: { payoutHold: false, payoutHoldReason: null } })
    await clearAttempts()
    await prisma.tenant.update({ where: { id: G.id }, data: { payeeName: null } })
    eq('收款信息未设置 → PAYEE_MISSING', (await apply())?.reason, 'PAYEE_MISSING')
    await prisma.tenant.update({ where: { id: G.id }, data: { payeeName: 'ITEST 收款人', payeeChangedAt: new Date() } })
    await clearAttempts()
    const cs = await gsum()
    eq('收款信息 72 小时冷静期 → PAYEE_COOLDOWN', (await apply())?.reason, 'PAYEE_COOLDOWN')
    check('summary 提示 PAYEE_COOLDOWN，nextApplyAt ≈ 72 小时后', cs?.applyBlockReason === 'PAYEE_COOLDOWN' && Math.abs(new Date(cs.nextApplyAt).getTime() - (Date.now() + 72 * 3600_000)) < 120_000)
    await prisma.tenant.update({ where: { id: G.id }, data: { payeeChangedAt: new Date(t0 - 10 * DAY) } })
    await clearAttempts()
    const gs = await S.generateStatement({ tenantId: G.id, origin: 'SCHEDULE', periodEnd: new Date(Date.now() + 2000), actorUserId: w.users.sa.id, requestId: `it7-${RUN}-gs` })
    check('站长周期出单（未完结）', gs.ok === true)
    eq('已有未完结结算单 → OPEN_EXISTS', (await apply())?.reason, 'OPEN_EXISTS')
    const gsId = (await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: (gs as { statementNo: string }).statementNo } })).id
    check('站长退回 → 金额拆回可结算', (await S.returnStatement(gsId, w.users.sa.id, 'itest', true)) === 'OK')
    await clearAttempts()
    const ok1 = await apply(`it7g${RUN}ok1`)
    check('满足条件 → 生成 REQUEST 结算单 3000', ok1?.ok === true && ok1.netCents === 3000, JSON.stringify(ok1))
    const rq = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: ok1.statementNo } })
    check('origin=REQUEST', rq.origin === 'REQUEST')
    check('渠道自己的申请：审计 statement.apply（TENANT）', (await prisma.auditEvent.count({ where: { tenantId: G.id, action: 'statement.apply', actorKind: 'TENANT', result: 'OK' } })) === 1)
    check('站长退回申请单', (await S.returnStatement(rq.id, w.users.sa.id, 'itest', true)) === 'OK')
    const is = await gsum()
    eq('距上次申请不足间隔 → INTERVAL', (await apply())?.reason, 'INTERVAL')
    check('summary 提示 INTERVAL，nextApplyAt = 上次 + 7 天', is?.applyBlockReason === 'INTERVAL' && Math.abs(new Date(is.nextApplyAt).getTime() - (rq.createdAt.getTime() + 7 * DAY)) < 2000)
    // 当日次数：今天已尝试 2 次（OK + INTERVAL），再来 1 次到 3 次；之后 facade 直接回 INTERVAL，summary 给次日
    await prisma.tenantStatement.update({ where: { id: rq.id }, data: { createdAt: new Date(t0 - 30 * DAY) } }) // 让间隔条件通过
    await adj(-2000, 'g4') // 可结算 1000：第 3 次尝试落在 BELOW_MIN（不出单，避免 OPEN_EXISTS 抢在次数判断之前）
    eq('第 3 次尝试 → BELOW_MIN', (await apply())?.reason, 'BELOW_MIN')
    const lim = await apply()
    check('当日 3 次尝试用完 → INTERVAL', lim?.ok === false && lim.reason === 'INTERVAL', JSON.stringify(lim))
    const ls = await gsum()
    check('summary：次数用完 → INTERVAL，nextApplyAt = 东八区次日 0 点', ls?.applyBlockReason === 'INTERVAL' && new Date(ls.nextApplyAt).getTime() > Date.now() && (new Date(ls.nextApplyAt).getTime() + 8 * 3600_000) % DAY === 0)

    // 路由限频：同一店面同一人 1 分钟内第 11 次 → 429（go1 此前已用 7 次）
    let st429 = 0
    for (let i = 0; i < 4; i++) st429 = (await call(RF(rApply.POST), go1, { method: 'POST', body: { requestId: `it7g${RUN}r${i}` } })).status
    check('申请结算路由限频：1 分钟内第 11 次 → 429', st429 === 429, `${st429}`)

    // 并发：新渠道 H，两个不同 requestId 同时申请 → 恰好一张
    const H = await mkTenant('h')
    const hOwner = await createUser('w7-h-owner', { registeredTenantId: H.id })
    await prisma.tenantMember.create({ data: { tenantId: H.id, userId: hOwner.id, role: 'OWNER', status: 1 } })
    await L.adjust({ tenantId: H.id, amountCents: 5000, reasonCode: 'ITEST', reason: 'itest', requestId: `it7-${RUN}-h1`, operatorId: w.users.sa.id })
    const ho: Who = { host: H.host, token: signTestToken(hOwner, H.code, H.id) }
    const [a1, a2] = await Promise.all([
      call(RF(rApply.POST), ho, { method: 'POST', body: { requestId: `it7h${RUN}c1` } }),
      call(RF(rApply.POST), ho, { method: 'POST', body: { requestId: `it7h${RUN}c2` } }),
    ])
    const oks = [a1, a2].filter((x) => x.json?.data?.ok === true)
    check('并发两次申请：恰好一次成功', oks.length === 1, `${a1.text.slice(0, 100)} | ${a2.text.slice(0, 100)}`)
    check('H 只有一张结算单', (await prisma.tenantStatement.count({ where: { tenantId: H.id } })) === 1)
    const other = [a1, a2].find((x) => x.json?.data?.ok !== true)
    check('另一次返回 OPEN_EXISTS / INTERVAL', ['OPEN_EXISTS', 'INTERVAL'].includes(other?.json?.data?.reason), other?.text.slice(0, 120))

    // DRAFT：finance.apply 不在 DRAFT_SAFE → 404；finance.read 可用
    await prisma.tenant.update({ where: { id: H.id }, data: { status: 'DRAFT' } })
    invalidateStorefrontCache()
    const dr = await call(RF(rApply.POST), ho, { method: 'POST', body: { requestId: `it7h${RUN}d1` } })
    check('DRAFT：申请结算 404', isNotFound(dr))
    const drs = await call(RF(rSummary.GET), ho)
    check('DRAFT：结算中心可读', drs.status === 200)
    await prisma.tenant.update({ where: { id: H.id }, data: { status: 'ACTIVE' } })
    invalidateStorefrontCache()

    // =========================================================================
    section('W7-9：T1 矩阵（结算单编号：本渠道 / 他渠道 / 随机 / 自增数字；身份 5 种）')
    const hStmt = await prisma.tenantStatement.findFirstOrThrow({ where: { tenantId: H.id } })
    const fDetail = await call(RF(rStmt.GET), fo, { params: { statementNo: st1No } })
    check('F 店主看自己的结算单 200', fDetail.status === 200)
    const fBuyerWho: Who = { host: F.host, token: signTestToken(fBuyer, F.code, F.id) }
    const hOnF: Who = { host: F.host, token: signTestToken(hOwner, H.code, H.id) }
    const saOnF: Who = { host: F.host, token: signTestToken(w.users.sa, F.code, F.id) }
    const anonF: Who = { host: F.host }
    const auditBefore = await prisma.auditEvent.count({ where: { action: 'statement.export' } })
    for (const [label, key] of [
      ['他渠道结算单', hStmt.statementNo],
      ['随机编号', 'ST260101ZZZZZZZZ'],
      ['自增数字', String(hStmt.id)],
      ['小写他渠道编号', hStmt.statementNo.toLowerCase()],
    ] as const) {
      check(`F 店主 GET ${label} → 404 同体`, isNotFound(await call(RF(rStmt.GET), fo, { params: { statementNo: key } })))
      check(`F 店主 导出 ${label} → 404 同体`, isNotFound(await call(RF(rStmtCsv.GET), fo, { params: { statementNo: key } })))
    }
    check('他站键导出不写任何审计（数据库不变）', (await prisma.auditEvent.count({ where: { action: 'statement.export' } })) === auditBefore)
    for (const [label, who] of [
      ['买家', fBuyerWho],
      ['SA', saOnF],
      ['匿名', anonF],
      ['H 的店主（他站令牌）', hOnF],
    ] as const) {
      const ok = deniedFor(label)
      const want = label === 'SA' ? '401' : '拒绝'
      const r1 = await call(RF(rStmt.GET), who, { params: { statementNo: st1No } })
      check(`${label} 看 F 的结算单 → ${want}`, ok(r1), `${r1.status}`)
      const r2 = await call(RF(rSummary.GET), who)
      check(`${label} 看 F 的结算中心 → ${want}`, ok(r2), `${r2.status}`)
      const r3 = await call(RF(rApply.POST), who, { method: 'POST', body: { requestId: `it7x${RUN}${label.length}` } })
      check(`${label} 申请 F 的结算 → ${want}`, ok(r3), `${r3.status}`)
    }
  }

  // =========================================================================
  section('W7-9：T1 矩阵（本包全部路由 × 身份）+ T5（主站 Host / 休眠）+ SUSPENDED / STAFF')
  {
    const stmtNo = 'ST260101ZZZZZZZZ'
    const routes: { name: string; fn: RouteFn; method: string; params?: Record<string, string>; body?: unknown; write?: boolean }[] = [
      { name: 'GET customers', fn: RF(rCustomers.GET), method: 'GET' },
      { name: 'GET customers/export', fn: RF(rCustExport.GET), method: 'GET' },
      { name: 'GET customers/[no]', fn: RF(rCustomer.GET), method: 'GET', params: { customerNo: C.luluBuyer2 } },
      { name: 'PATCH customers/[no]', fn: RF(rCustomer.PATCH), method: 'PATCH', params: { customerNo: C.luluBuyer2 }, body: { note: 'MATRIX' }, write: true },
      { name: 'POST block', fn: RF(rBlock.POST), method: 'POST', params: { customerNo: C.luluBuyer2 }, body: { reason: 'OTHER' }, write: true },
      { name: 'POST unblock', fn: RF(rUnblock.POST), method: 'POST', params: { customerNo: C.luluBuyer2 }, write: true },
      { name: 'POST ban-request', fn: RF(rBan.POST), method: 'POST', params: { customerNo: C.luluBuyer2 }, body: { reason: 'MATRIX 原因原因' }, write: true },
      { name: 'GET finance/summary', fn: RF(rSummary.GET), method: 'GET' },
      { name: 'GET finance/ledger', fn: RF(rLedger.GET), method: 'GET' },
      { name: 'GET finance/orders', fn: RF(rFinOrders.GET), method: 'GET' },
      { name: 'POST finance/apply', fn: RF(rApply.POST), method: 'POST', body: { requestId: `it7m${RUN}` }, write: true },
      { name: 'GET finance/statements', fn: RF(rStmts.GET), method: 'GET' },
      { name: 'GET finance/statements/[no]', fn: RF(rStmt.GET), method: 'GET', params: { statementNo: stmtNo } },
      { name: 'GET finance/statements/[no]/export', fn: RF(rStmtCsv.GET), method: 'GET', params: { statementNo: stmtNo } },
      { name: 'GET notices', fn: RF(rNotices.GET), method: 'GET' },
      { name: 'POST notices/read', fn: RF(rNoticeRead.POST), method: 'POST', body: { all: true }, write: true },
      { name: 'GET notices/unread-count', fn: RF(rUnread.GET), method: 'GET' },
      { name: 'GET audit', fn: RF(rAudit.GET), method: 'GET' },
      { name: 'GET settings', fn: RF(rSettings.GET), method: 'GET' },
      { name: 'PUT settings/notice', fn: RF(rNoticePrefs.PUT), method: 'PUT', body: { prefs: { ORDER_PAID: true } }, write: true },
      { name: 'PUT settings/webhook', fn: RF(rWebhook.PUT), method: 'PUT', body: { url: null }, write: true },
      { name: 'POST settings/webhook/test', fn: RF(rWebhookTest.POST), method: 'POST', write: true },
    ]
    const before = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.luluBuyer2 } })
    const asBefore = await prisma.tenantAfterSale.count({ where: { tenantId: LU.id } })
    const stBefore = await prisma.tenantStatement.count({ where: { tenantId: LU.id } })
    for (const rt of routes) {
      for (const [label, who] of [
        ['买家', buyer],
        ['SA', sa],
        ['匿名', anon],
        ['zz 店主（他站令牌）', zzOwnerOnLulu],
        ['主站 Host（T5）', mainOwner],
      ] as const) {
        const r = await call(rt.fn, who, { method: rt.method, params: rt.params, body: rt.body })
        check(`${rt.name} × ${label} → ${label === 'SA' ? '401' : '拒绝'}`, deniedFor(label)(r), `${r.status} ${r.text.slice(0, 80)}`)
      }
    }
    const after = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: C.luluBuyer2 } })
    check('矩阵之后 lulu 客户行未变（note / blocked）', after.note === before.note && after.blockedAt === null)
    check('矩阵之后没有新售后申请 / 结算单', (await prisma.tenantAfterSale.count({ where: { tenantId: LU.id } })) === asBefore && (await prisma.tenantStatement.count({ where: { tenantId: LU.id } })) === stBefore)

    // 休眠期：全部 404
    setChannelsMode('dormant')
    invalidateStorefrontCache()
    let dormantOk = true
    for (const rt of routes) {
      const r = await call(rt.fn, owner, { method: rt.method, params: rt.params, body: rt.body })
      if (!isNotFound(r)) dormantOk = false
    }
    check('休眠期（CHANNELS_ENABLED 未设）：本包全部路由 404', dormantOk)
    setChannelsMode('observe')
    invalidateStorefrontCache()

    // SUSPENDED：读 200、写 404
    await prisma.tenant.update({ where: { id: LU.id }, data: { status: 'SUSPENDED' } })
    invalidateStorefrontCache()
    for (const rt of routes) {
      if (rt.name.includes('export') || rt.name.includes('statements/[no]')) continue
      const r = await call(rt.fn, owner, { method: rt.method, params: rt.params, body: rt.body })
      if (rt.write) check(`SUSPENDED：${rt.name} → 404`, isNotFound(r), `${r.status}`)
      else check(`SUSPENDED：${rt.name} → 200`, r.status === 200, `${r.status} ${r.text.slice(0, 80)}`)
    }
    await prisma.tenant.update({ where: { id: LU.id }, data: { status: 'ACTIVE' } })
    invalidateStorefrontCache()

    // STAFF（P2）：customer.read 放行，OWNER_ONLY（导出、财务、设置）一律 404
    const staff = await createUser('w7-staff', { registeredTenantId: LU.id })
    await prisma.tenantMember.create({ data: { tenantId: LU.id, userId: staff.id, role: 'STAFF', status: 1, perms: ['customer.read', 'customer.export', 'finance.read', 'settings.write', 'notice.read'] } })
    const st: Who = { host: LU.host, token: w.token(staff, LU) }
    check('STAFF：客户列表 200', (await call(RF(rCustomers.GET), st)).status === 200)
    check('STAFF：通知 200', (await call(RF(rNotices.GET), st)).status === 200)
    check('STAFF：客户导出 404（OWNER_ONLY）', isNotFound(await call(RF(rCustExport.GET), st)))
    check('STAFF：结算中心 404（OWNER_ONLY）', isNotFound(await call(RF(rSummary.GET), st)))
    check('STAFF：设置 404（OWNER_ONLY）', isNotFound(await call(RF(rSettings.GET), st)))
    check('STAFF：拉黑 404（未授予 customer.write）', isNotFound(await call(RF(rBlock.POST), st, { method: 'POST', params: { customerNo: C.luluBuyer2 }, body: { reason: 'OTHER' } })))
    await new Promise((r) => setTimeout(r, 800)) // 守卫里的 authz.denied 审计是异步写的（不阻塞拒绝）
    check('STAFF 越权逐条写 authz.denied', (await prisma.auditEvent.count({ where: { tenantId: LU.id, actorUserId: staff.id, action: 'authz.denied' } })) >= 4)
    // 停用成员：下一次请求 404（T15）
    await prisma.tenantMember.updateMany({ where: { tenantId: LU.id, userId: staff.id }, data: { status: 0 } })
    check('停用成员下一次请求 404', isNotFound(await call(RF(rCustomers.GET), st)))
  }
}

main()
  .catch((e) => {
    console.error(e)
    check('未捕获异常', false, String((e as Error)?.stack || e).slice(0, 500))
  })
  .finally(async () => {
    try {
      const notice = await import('../../src/lib/tenant/notice')
      await notice.waitTenantNoticePushesForTest()
      await extraCleanup()
      await cleanupAll()
      const left = await Promise.all([
        prisma.user.count({ where: { email: { endsWith: MAIL_DOMAIN } } }),
        prisma.tenant.count({ where: { name: { startsWith: 'ITEST' } } }),
        residualAudit().then((c) => c - auditBaseline),
        prisma.invoice.count({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } }),
        prisma.externalOrder.count({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } }),
      ])
      check('清理后无残留（用户 / 租户 / 审计 / 发票 / 外部订单）', left.every((n) => n === 0), left.join(','))
    } catch (e) {
      console.error('清理失败', e)
    }
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
