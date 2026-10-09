/**
 * 渠道分站 · 跨租户总扫描（WP8，实施分包 11.4 / W8-2；设计 6.6 的 T1–T7、T10–T12）。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/cross-tenant.ts
 *   选项：--no-nginx 跳过 T12 nginx 层（本机没有 docker 时自动跳过并明确打印「未验证」）；--strict 把「待集成」项也算失败
 *
 * 【和各包 itest 的分工】各包的 wpN.ts 只测自己的路由；这里**从目录生成路由清单**，把全部包的路由放进同一个矩阵：
 *   · partner 路由取自 scripts/itest-tenant.routes.json（merge-routes 已与 src/app/api/partner/** 实际目录双向比对），
 *     每条路由必须在下面的 TEMPLATES 里有请求模板——新增路由忘了写模板，本脚本直接失败（不会静默漏测）；
 *   · 其余 /api 路由直接遍历 src/app/api/**\/route.ts 分类（T12），分不进任何一类的也直接失败。
 *
 * 【跑法】进程内（_harness.callRoute：真实执行 partnerRoute / adminGuard / 店面解析 / getCurrentUser），连一次性开发库；
 *   T12 的 nginx 层另起两个临时容器（nginx:alpine 跑仓库里的 nginx.conf + 一个回显上游），不连应用、不碰服务器。
 * 【数据】夹具用 _harness.createWorld()（ITEST 前缀，结束时 cleanupAll()）；本脚本另建的外部订单以 itx8- 开头，一并清理。
 * 【并行】各包 itest 开头都会 cleanupAll()，与本脚本并行会互相清数据（主会话 D10）：集成与终审一律串行跑（run-all.ts）。
 */
// 微信机器人的两个渠道开关（docs/微信机器人-设计.md §5.5、§6.5）也清掉：T12 按「开关关着」断言 track/view 渠道 404，
// 渠道快速回复（tPartnerReply）自己开关 BOT_TENANT_REPLY——外面 shell 里带着这两个变量也不影响结果
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL', 'JWT_LEGACY_TOKENS', 'PLATFORM_HOSTS', 'TRACK_CHANNEL_VIEWS', 'BOT_TENANT_REPLY']) {
  delete process.env[k]
}
if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest-x8-vmq-key'

import * as React from 'react'
import ReactDefault from 'react'
import Module from 'module'
import { execFileSync, spawnSync } from 'child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs'
import http from 'node:http'
import { tmpdir } from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
import { randomBytes } from 'crypto'
import { Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  createWorld,
  cleanupAll,
  callRoute,
  withRequest,
  catchNext,
  MARK,
  RUN,
  TEST_PASSWORD,
  type RouteFn,
  type World,
} from './_harness'

// 页面 / 布局模块的最小替身（同 wp1）：tsx 按经典 JSX 运行时编译，需要全局 React；css 与 next/font 换成空对象
;(globalThis as unknown as { React: typeof React }).React = React
// React.cache 只在 Next 的 react-server 构建里有；遍历加载的路由会间接加载内容平台 lib/content/queries.ts（模块顶层调 cache）。
// 替身挂在 CJS 的 module.exports 上（命名空间 import 是副本，挂上去无效）
const ReactMut = ReactDefault as unknown as { cache?: <T>(fn: T) => T }
if (typeof ReactMut.cache !== 'function') ReactMut.cache = <T,>(fn: T) => fn
const Mod = Module as unknown as { _load: (r: string, p: unknown, m: boolean) => unknown }
const origLoad = Mod._load
Mod._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request.endsWith('.css')) return {}
  if (request === 'next/font/google') return { Inter: () => ({ className: 'inter' }) }
  return origLoad.call(this, request, parent, isMain)
}

type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any
const ROOT = path.resolve(__dirname, '../..')
const API_DIR = path.join(ROOT, 'src/app/api')
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const MAIN_HOST = 'bigolab.com'
const ARGV = process.argv.slice(2)
const STRICT = ARGV.includes('--strict')

// ---------------------------------------------------------------------------
// 「待集成」项：违规成立、由主会话 / 他包在集成阶段处理（主会话 D3、D4 等）。默认只计数并打印，--strict 时按失败算。
// 待办已完成（条件已成立）时提示删掉标记，防止标记表越积越大。
// ---------------------------------------------------------------------------
let pendingOpen = 0
let pendingDone = 0
function pendingCheck(name: string, cond: boolean, owner: string, extra = ''): void {
  if (cond) {
    pendingDone++
    check(`${name}（原「待集成」项已完成：请删掉 cross-tenant.ts 里的 pendingCheck 标记，归 ${owner}）`, !STRICT)
    return
  }
  pendingOpen++
  if (STRICT) check(`${name}（待集成：${owner}）`, false, extra)
  else console.log(`  ⚠ 待集成 ${name} —— 归 ${owner}${extra ? `：${extra}` : ''}`)
}

// ---------------------------------------------------------------------------
// 调用助手
// ---------------------------------------------------------------------------
let ipSeq = 0
const nextIp = () => {
  ipSeq++
  return `10.88.${(ipSeq >> 8) & 255}.${ipSeq & 255}`
}
interface Who {
  host: string
  token?: string | null
  bearer?: boolean
}
interface CallOpts {
  method?: string
  path?: string
  body?: unknown
  params?: Record<string, string>
  headers?: Record<string, string>
  /** false = 不自动补同源头（T7 用） */
  sameOrigin?: boolean
}
async function call(fn: RouteFn, who: Who, o: CallOpts = {}) {
  const method = (o.method || 'GET').toUpperCase()
  const write = method !== 'GET' && method !== 'HEAD'
  const headers: Record<string, string> = { 'cf-connecting-ip': nextIp(), 'user-agent': 'ITEST-UA-x8' }
  if (write && o.sameOrigin !== false) {
    headers.origin = `https://${who.host}`
    headers['sec-fetch-site'] = 'same-origin'
  }
  Object.assign(headers, o.headers || {})
  try {
    return await callRoute(fn, { host: who.host, token: who.token ?? null, bearer: who.bearer, method, path: o.path, body: o.body, params: o.params, headers })
  } catch (e) {
    // handler 抛出未捕获异常 = Next 返回 500（不放行、不泄露）
    return { status: 500, json: null, text: `THROWN ${(e as Error)?.message?.slice(0, 120)}` }
  }
}

const modCache = new Map<string, Record<string, unknown>>()
async function loadRoute(rel: string): Promise<Record<string, unknown>> {
  const hit = modCache.get(rel)
  if (hit) return hit
  const mod = (await import(pathToFileURL(path.join(API_DIR, rel, 'route.ts')).href)) as Record<string, unknown>
  modCache.set(rel, mod)
  return mod
}
async function handler(rel: string, method: string): Promise<RouteFn> {
  const mod = await loadRoute(rel)
  const fn = mod[method]
  if (typeof fn !== 'function') throw new Error(`${rel} 没有导出 ${method}`)
  return fn as RouteFn
}

/** 全部 route.ts（相对 src/app/api，不含 /route.ts） */
function allApiRoutes(): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (name === 'route.ts') out.push(path.relative(API_DIR, d).replace(/\\/g, '/'))
    }
  }
  walk(API_DIR)
  return out.sort()
}
function paramsFor(rel: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const m of Array.from(rel.matchAll(/\[([^\]]+)\]/g))) {
    const k = m[1].replace(/^\.\.\./, '')
    params[k] = /id$/i.test(k) ? '1' : `itest-${k}`
  }
  return params
}

let NOT_FOUND_TEXT = ''
const isNotFoundBody = (r: { status: number; text: string }) => r.status === 404 && r.text === NOT_FOUND_TEXT
const isUnauth = (r: { status: number }) => r.status === 401
const is2xx = (r: { status: number }) => r.status >= 200 && r.status < 300

// ---------------------------------------------------------------------------
// 夹具补充：通知、售后申请、结算单、公告（两个渠道各一份，给 T1 的 noticeNo / requestNo / statementNo / announcementNo 寻址键用）
// ---------------------------------------------------------------------------
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const rnd = (n: number) => Array.from(randomBytes(n), (b) => B32[b & 31]).join('')
const ymd = () => new Date().toISOString().slice(2, 10).replace(/-/g, '')

interface Keys {
  orderNo: string
  listingNo: string
  customerNo: string
  requestNo: string
  statementNo: string
  noticeNo: string
  announcementNo: string
}
interface Extra {
  lulu: Keys
  zz: Keys
  /** zz 各对象的自增 id（渠道侧不该认数字 id） */
  zzIds: Record<keyof Keys, string>
  mainOrderNo: string
}

async function buildExtra(w: World): Promise<Extra> {
  const mk = async (tenantId: number, orderId: number, customerNo: string, orderNo: string, listingNo: string) => {
    const notice = await prisma.tenantNotice.create({ data: { publicNo: rnd(12), tenantId, kind: 'ORDER_PAID', title: 'itest-x8 通知', refType: 'order', refKey: orderNo } })
    const ann = await prisma.tenantAnnouncement.create({ data: { announcementNo: rnd(12), tenantId, title: 'itest-x8 公告', content: 'x', enabled: false } })
    const cust = await prisma.tenantCustomer.findUniqueOrThrow({ where: { publicNo: customerNo } })
    const as = await prisma.tenantAfterSale.create({
      data: { requestNo: `AS${ymd()}${rnd(8)}`, tenantId, orderId, customerId: cust.id, kind: 'REISSUE', activeKey: `o:${orderId}:REISSUE`, reason: 'itest-x8 补发', status: 'PENDING' },
    })
    const st = await prisma.tenantStatement.create({
      data: {
        statementNo: `ST${ymd()}${rnd(8)}`,
        tenantId,
        seq: 1,
        origin: 'MANUAL',
        openKey: null,
        periodEnd: new Date(),
        lineCount: 0,
        goodsCents: 0,
        purchaseCents: 0,
        invShareCents: 0,
        feeCents: 0,
        otherCents: 0,
        grossCents: 0,
        netCents: 0,
        contentHash: '0'.repeat(64),
        state: 'PAID',
        payeeName: 'itest-x8',
        payeeMethod: 'ALIPAY',
        payeeAccountMasked: '138****0000',
      },
    })
    const listing = await prisma.tenantListing.findUniqueOrThrow({ where: { publicNo: listingNo } })
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    return {
      keys: { orderNo, listingNo, customerNo, requestNo: as.requestNo, statementNo: st.statementNo, noticeNo: notice.publicNo, announcementNo: ann.announcementNo },
      ids: { orderNo: String(order.id), listingNo: String(listing.id), customerNo: String(cust.id), requestNo: String(as.id), statementNo: String(st.id), noticeNo: String(notice.id), announcementNo: String(ann.id) },
    }
  }
  const l = await mk(w.lulu.id, w.orders.luluAuto.id, w.customers.luluBuyer1, w.orders.luluAuto.orderNo, w.listings.luluAuto)
  const z = await mk(w.zz.id, w.orders.zzAuto.id, w.customers.zzBuyer1, w.orders.zzAuto.orderNo, w.listings.zzAuto)
  return { lulu: l.keys, zz: z.keys, zzIds: z.ids, mainOrderNo: w.orders.crossMain.orderNo }
}

// ---------------------------------------------------------------------------
// T1 请求模板：每条 partner 路由怎么调（寻址键从 Keys 取）。新增路由必须在这里加一行，否则本脚本失败。
// key = 这条路由按哪种公开编号寻址；batch = 键在请求体数组里（他站键应被静默跳过或 404，数据库不变）
// ---------------------------------------------------------------------------
interface Tpl {
  params?: (k: Keys) => Record<string, string>
  body?: (k: Keys) => unknown
  key?: keyof Keys
  batch?: boolean
  /** 他站键的期望：默认 404 同体；notices/read 是批量接口，他站 / 不存在编号静默跳过、同样 204（WP7 报告） */
  foreignExpect?: 'notFound' | 'noContent' | 'noEffect'
}
const TEMPLATES: Record<string, Tpl> = {
  'GET /api/partner/dashboard': {},
  'GET /api/partner/catalog': {},
  'PATCH /api/partner/listings/[listingNo]': { params: (k) => ({ listingNo: k.listingNo }), body: () => ({ sortOrder: 7 }), key: 'listingNo' },
  'POST /api/partner/listings/status': { body: (k) => ({ listingNos: [k.listingNo], status: 0 }), key: 'listingNo', batch: true, foreignExpect: 'noEffect' },
  'POST /api/partner/listings/price/preview': {
    body: (k) => ({ listingNos: [k.listingNo], mode: 'MARKUP_FIXED', value: '1', rounding: 'NONE' }),
    key: 'listingNo',
    batch: true,
    foreignExpect: 'noEffect',
  },
  'POST /api/partner/listings/price/commit': { body: () => ({ listingNos: ['X'], mode: 'MARKUP_FIXED', value: '1', rounding: 'NONE', previewToken: 'itest-x8-bogus' }) },
  'GET /api/partner/orders': {},
  'GET /api/partner/orders/export': {},
  'GET /api/partner/orders/[orderNo]': { params: (k) => ({ orderNo: k.orderNo }), key: 'orderNo' },
  'GET /api/partner/orders/[orderNo]/cards': { params: (k) => ({ orderNo: k.orderNo }), key: 'orderNo' },
  'GET /api/partner/orders/[orderNo]/messages': { params: (k) => ({ orderNo: k.orderNo }), key: 'orderNo' },
  'POST /api/partner/orders/[orderNo]/messages': { params: (k) => ({ orderNo: k.orderNo }), body: () => ({ messageText: 'itest-x8 矩阵回复' }), key: 'orderNo' },
  'POST /api/partner/orders/[orderNo]/read': { params: (k) => ({ orderNo: k.orderNo }), key: 'orderNo' },
  'POST /api/partner/orders/[orderNo]/after-sales': { params: (k) => ({ orderNo: k.orderNo }), body: () => ({ kind: 'REFUND', reason: 'itest-x8 矩阵申请原因' }), key: 'orderNo' },
  'GET /api/partner/after-sales': {},
  'POST /api/partner/after-sales/[requestNo]/cancel': { params: (k) => ({ requestNo: k.requestNo }), key: 'requestNo' },
  'POST /api/partner/invite/accept': { body: () => ({ token: `itest-x8-bogus-${RUN}` }) },
  'GET /api/partner/customers': {},
  'GET /api/partner/customers/export': {},
  'GET /api/partner/customers/[customerNo]': { params: (k) => ({ customerNo: k.customerNo }), key: 'customerNo' },
  'PATCH /api/partner/customers/[customerNo]': { params: (k) => ({ customerNo: k.customerNo }), body: () => ({ note: 'itest-x8' }), key: 'customerNo' },
  'POST /api/partner/customers/[customerNo]/block': { params: (k) => ({ customerNo: k.customerNo }), body: () => ({ reason: 'OTHER' }), key: 'customerNo' },
  'POST /api/partner/customers/[customerNo]/unblock': { params: (k) => ({ customerNo: k.customerNo }), key: 'customerNo' },
  'POST /api/partner/customers/[customerNo]/ban-request': { params: (k) => ({ customerNo: k.customerNo }), body: () => ({ reason: 'itest-x8 矩阵申请原因' }), key: 'customerNo' },
  'GET /api/partner/finance/summary': {},
  'GET /api/partner/finance/ledger': {},
  'GET /api/partner/finance/orders': {},
  'POST /api/partner/finance/apply': { body: () => ({ requestId: `x8${RUN}${rnd(4)}`.slice(0, 32) }) },
  'GET /api/partner/finance/statements': {},
  'GET /api/partner/finance/statements/[statementNo]': { params: (k) => ({ statementNo: k.statementNo }), key: 'statementNo' },
  'GET /api/partner/finance/statements/[statementNo]/export': { params: (k) => ({ statementNo: k.statementNo }), key: 'statementNo' },
  'GET /api/partner/notices': {},
  'POST /api/partner/notices/read': { body: (k) => ({ noticeNos: [k.noticeNo] }), key: 'noticeNo', batch: true, foreignExpect: 'noContent' },
  'GET /api/partner/notices/unread-count': {},
  'GET /api/partner/audit': {},
  'GET /api/partner/settings': {},
  'PUT /api/partner/settings/notice': { body: () => ({ prefs: { ORDER_PAID: true } }) },
  'PUT /api/partner/settings/webhook': { body: () => ({ url: null }) },
  'POST /api/partner/settings/webhook/test': {},
  // 二期（docs/多渠道分销-二期改动.md 3.2 推送方式、4.3 客服信息）：都不按公开编号寻址，只进身份矩阵、T5 与 GET 正例。
  // 请求体取「不会真改出副作用」的值：身份矩阵里本就全部被拒；contact-qr 的 POST 不带 multipart，鉴权先于解析
  'GET /api/partner/settings/contact': {},
  'PUT /api/partner/settings/contact': { body: () => ({ hours: '9:00-22:00' }) },
  'POST /api/partner/settings/contact-qr': {},
  'DELETE /api/partner/settings/contact-qr': {},
  'PUT /api/partner/settings/transport': { body: () => ({ wecomOn: true }) },
  'PUT /api/partner/settings/notice-email': { body: () => ({ email: null }) },
  'POST /api/partner/settings/notice-email/code': { body: () => ({ email: `x8-${RUN}@itest-tenant.local` }) },
  'POST /api/partner/settings/notice-email/test': {},
  // 渠道品牌与公告（docs/多渠道分销-渠道品牌与公告.md）：品牌不按编号寻址；公告按公开编号 announcementNo 寻址（他站编号 / 自增 id 一律 404）
  'GET /api/partner/settings/brand': {},
  'PUT /api/partner/settings/brand': { body: () => ({ heroTitle: null }) },
  'POST /api/partner/settings/brand-logo': {},
  'DELETE /api/partner/settings/brand-logo': {},
  'GET /api/partner/announcements': {},
  'POST /api/partner/announcements': { body: () => ({ title: 'itest-x8 公告', body: 'x', enabled: false }) },
  'PUT /api/partner/announcements/[announcementNo]': { params: (k) => ({ announcementNo: k.announcementNo }), body: () => ({ title: 'itest-x8 公告', body: 'x', enabled: false }), key: 'announcementNo' },
  'DELETE /api/partner/announcements/[announcementNo]': { params: (k) => ({ announcementNo: k.announcementNo }), key: 'announcementNo' },
  // 内容模块下放（docs/多渠道分销-内容模块下放.md）：不按编号寻址；没授权的模块 PUT 409
  'GET /api/partner/settings/modules': {},
  'PUT /api/partner/settings/modules': { body: () => ({ module: 'iptools', on: false }) },
}

interface PartnerRoute {
  method: string
  path: string
  rel: string
  tpl: Tpl | undefined
}
function partnerRoutes(): PartnerRoute[] {
  const j = JSON.parse(readFileSync(path.join(ROOT, 'scripts/itest-tenant.routes.json'), 'utf8')) as { routes: { method: string; path: string }[] }
  return j.routes
    .filter((r) => r.path.startsWith('/api/partner/'))
    .map((r) => ({ method: r.method, path: r.path, rel: r.path.replace(/^\/api\//, ''), tpl: TEMPLATES[`${r.method} ${r.path}`] }))
}

// ---------------------------------------------------------------------------
// 数据库指纹：跨站写接口「数据库不变」的判据（不含审计表：越权本来就要写 authz 审计）
// ---------------------------------------------------------------------------
async function fingerprint(w: World): Promise<string> {
  const tIds = [w.lulu.id, w.zz.id]
  const worldOrders = Object.values(w.orders).map((o) => o.id)
  const [listings, customers, afterSales, notices, orders, msgs, stmts, tenants, members, invites] = await Promise.all([
    prisma.tenantListing.findMany({ where: { tenantId: { in: tIds } }, select: { id: true, retailCents: true, status: true, sortOrder: true, supplyCents: true, supplyVersion: true, granted: true }, orderBy: { id: 'asc' } }),
    prisma.tenantCustomer.findMany({ where: { tenantId: { in: tIds } }, select: { id: true, note: true, tags: true, blockedAt: true, blockedByKind: true }, orderBy: { id: 'asc' } }),
    prisma.tenantAfterSale.findMany({ where: { tenantId: { in: tIds } }, select: { id: true, status: true, kind: true }, orderBy: { id: 'asc' } }),
    prisma.tenantNotice.findMany({ where: { tenantId: { in: tIds } }, select: { id: true, readAt: true }, orderBy: { id: 'asc' } }),
    prisma.order.findMany({ where: { id: { in: worldOrders } }, select: { id: true, escalatedAt: true, payStatus: true, deliveryStatus: true, settleVersion: true }, orderBy: { id: 'asc' } }),
    prisma.orderMessage.groupBy({ by: ['orderId'], where: { orderId: { in: worldOrders } }, _count: { _all: true } }),
    prisma.tenantStatement.findMany({ where: { tenantId: { in: tIds } }, select: { id: true, state: true }, orderBy: { id: 'asc' } }),
    prisma.tenant.findMany({ where: { id: { in: tIds } }, select: { id: true, noticePrefs: true, wecomWebhookEnc: true, status: true }, orderBy: { id: 'asc' } }),
    prisma.tenantMember.findMany({ where: { tenantId: { in: tIds } }, select: { id: true, status: true, userId: true }, orderBy: { id: 'asc' } }),
    prisma.tenantInvite.count({ where: { tenantId: { in: tIds } } }),
  ])
  return JSON.stringify({ listings, customers, afterSales, notices, orders, msgs: msgs.map((m) => [m.orderId, m._count._all]), stmts, tenants, members, invites })
}

/** 全库指纹（T4：ADMIN 在渠道 Host 直连全部超管接口之后「无任何写入」）。审计表与限流类表除外 */
async function dbChecksum(): Promise<Map<string, string>> {
  const tables = (await prisma.$queryRawUnsafe<Record<string, string>[]>('SHOW TABLES')).map((r) => Object.values(r)[0])
  const skip = new Set(['audit_events', '_prisma_migrations'])
  const list = tables.filter((t) => !skip.has(t))
  // 列名随驱动不同（Table / Checksum 或 f0 / f1），按位置取
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`CHECKSUM TABLE ${list.map((t) => `\`${t}\``).join(', ')}`)
  return new Map(rows.map((r) => {
    const [t, c] = Object.values(r)
    return [String(t).split('.').pop() as string, String(c)]
  }))
}
function diffChecksum(a: Map<string, string>, b: Map<string, string>): string[] {
  return Array.from(a.keys()).filter((k) => a.get(k) !== b.get(k))
}

// ---------------------------------------------------------------------------
// T10 扫描
// ---------------------------------------------------------------------------
let ALLOWED: ReadonlySet<string>
let FORBIDDEN: ReadonlySet<string>
let CONTEXTUAL: Readonly<Record<string, readonly string[]>>
const BUYER_FORBIDDEN = ['supplyCents', 'supplyUnitPrice', 'feeRateBp', 'invoiceShareRateBp', 'mainPriceAtOrder', 'tenantId', 'shopOrderId', 'senderRole', 'senderUserId', 'readByTenant']

interface Captured {
  label: string
  text: string
  json: Json
  cards: boolean
}
const partnerCaptured: Captured[] = []

function scanPartnerKeys(c: Captured): string[] {
  const bad: string[] = []
  const walk = (v: unknown, parent: string, inDiff: boolean) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, parent, inDiff))
    if (!v || typeof v !== 'object') return
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      const ctx = CONTEXTUAL[k]
      if (ctx) {
        // invoiceInfo.phone 已由集成阶段收进 PARTNER_CONTEXTUAL_KEYS（WP6 偏差 6），不再单列「待集成」
        const ok = ctx.includes(parent) || (k === 'deliveryInfo' && c.cards)
        if (!ok) bad.push(`上下文外 ${parent}.${k}`)
      } else if (FORBIDDEN.has(k) || k === '_count') bad.push(`禁用键 ${parent}.${k}`)
      else if (!inDiff && !ALLOWED.has(k)) bad.push(`未登记键 ${parent}.${k}`)
      walk(x, k, inDiff || k === 'publicDiff')
    }
  }
  walk(c.json, '', false)
  return bad
}

/** 值扫描：收集 (键, 值) 对 */
function valuePairs(v: unknown, key = '', out: [string, unknown][] = []): [string, unknown][] {
  if (Array.isArray(v)) v.forEach((x) => valuePairs(x, key, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) valuePairs(x, k, out)
  else out.push([key, v])
  return out
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
async function main() {
  await cleanupAll()
  await cleanupX8()
  setChannelsMode('observe')
  const w = await createWorld()
  const X = await buildExtra(w)
  const sel = await import('../../src/lib/partner-services/selects')
  ALLOWED = sel.PARTNER_ALLOWED_KEYS
  FORBIDDEN = sel.PARTNER_FORBIDDEN_KEYS
  CONTEXTUAL = sel.PARTNER_CONTEXTUAL_KEYS
  const { PARTNER_NOT_FOUND_BODY } = await import('../../src/lib/tenant/types')
  NOT_FOUND_TEXT = JSON.stringify(PARTNER_NOT_FOUND_BODY)
  const { invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  invalidateStorefrontCache()
  try {
    await t1(w, X)
    await t2t3(w, X)
    await t4(w)
    await t5(w, X)
    await t6(w)
    await t7(w, X)
    await t10(w, X)
    await t11(w)
    await t12app(w)
    await tPartnerReply(w)
    if (ARGV.includes('--no-nginx')) console.log('\n· T12 nginx 层：--no-nginx，未验证')
    else await t12nginx()
  } finally {
    setChannelsMode('dormant')
    await cleanupX8()
    await cleanupAll()
    const left = await prisma.tenant.count({ where: { name: { startsWith: 'ITEST' } } })
    check('清理后无测试租户残留', left === 0)
    await prisma.$disconnect()
  }
  if (pendingOpen || pendingDone) console.log(`\n待集成项：未完成 ${pendingOpen}，已完成待删标记 ${pendingDone}${STRICT ? '（--strict：按失败计）' : '（不计入失败；--strict 时计入）'}`)
  const s = summary()
  process.exit(s.fail === 0 ? 0 : 1)
}

async function cleanupX8() {
  const ext = await prisma.externalOrder.findMany({ where: { sourceKey: { startsWith: 'itx8-' } }, select: { id: true } })
  const ids = ext.map((e) => e.id)
  if (ids.length) {
    await prisma.invoice.deleteMany({ where: { externalOrderId: { in: ids } } })
    await prisma.receipt.deleteMany({ where: { externalOrderId: { in: ids } } })
    await prisma.externalOrder.deleteMany({ where: { id: { in: ids } } })
  }
}

// ===========================================================================
// T1：每个 partner 路由 × 身份 × 按寻址键分类的键集合
// ===========================================================================
async function t1(w: World, X: Extra) {
  section('T1 partner 路由清单（来自 scripts/itest-tenant.routes.json）')
  const routes = partnerRoutes()
  check(`partner 路由 ${routes.length} 条，全部有请求模板`, routes.length >= 30 && routes.every((r) => r.tpl), routes.filter((r) => !r.tpl).map((r) => `${r.method} ${r.path}`).join('；'))
  const orphan = Object.keys(TEMPLATES).filter((k) => !routes.some((r) => `${r.method} ${r.path}` === k))
  check('模板表里没有已删除的路由', orphan.length === 0, orphan.join('；'))

  const L = w.lulu
  const owner: Who = { host: L.host, token: w.token(w.users.luluOwner, L) }
  const identities: [string, Who, (r: { status: number; text: string }) => boolean, string][] = [
    ['本站买家（非成员）', { host: L.host, token: w.token(w.users.luluBuyer1, L) }, isNotFoundBody, '404 同体'],
    ['SA（aud=lulu，D2 视为未登录）', { host: L.host, token: w.token(w.users.sa, L) }, isUnauth, '401'],
    ['匿名', { host: L.host }, isUnauth, '401'],
    ['zz 店主（zz 的令牌）', { host: L.host, token: w.token(w.users.zzOwner, w.zz) }, isUnauth, '401'],
    ['zz 店主（在 lulu 登录，非成员）', { host: L.host, token: w.token(w.users.zzOwner, L) }, isNotFoundBody, '404 同体'],
    ['主站令牌 Bearer（T3）', { host: L.host, token: w.token(w.users.luluOwner, w.main), bearer: true }, isUnauth, '401'],
    ['主站令牌 cookie（T3）', { host: L.host, token: w.token(w.users.luluOwner, w.main) }, isUnauth, '401'],
  ]

  section('T1 身份矩阵：非成员 / 未登录 / 他站令牌 → 404 或 401；数据库不变')
  const fp0 = await fingerprint(w)
  let total = 0
  const bad: string[] = []
  for (const r of routes) {
    if (!r.tpl) continue
    const fn = await handler(r.rel, r.method)
    for (const [label, who, ok, want] of identities) {
      const res = await call(fn, who, { method: r.method, path: r.path, params: r.tpl.params?.(X.lulu), body: r.tpl.body?.(X.lulu) })
      total++
      // 接受邀请不要求成员：非成员带无效令牌 → 404（任何身份都不得 2xx）
      const good = r.path === '/api/partner/invite/accept' ? !is2xx(res) && (want === '401' ? isUnauth(res) : res.status === 404) : ok(res)
      if (!good) bad.push(`${r.method} ${r.path} × ${label} → ${res.status}（期望 ${want}）${res.text.slice(0, 60)}`)
    }
  }
  check(`${total} 个（路由 × 身份）全部拒绝`, bad.length === 0, bad.slice(0, 12).join('；'))
  check('身份矩阵之后两个渠道与主站订单的数据不变', (await fingerprint(w)) === fp0)
  check('身份矩阵没有产生任何成员（接受邀请全部失败）', (await prisma.tenantMember.count({ where: { tenantId: { in: [w.lulu.id, w.zz.id] } } })) === 2)

  section('T1 键矩阵：lulu 店主 × {zz 的键, 主站的键, 随机值, 自增数字, 小写他站键} → 404 同体；写接口数据库不变')
  const fp1 = await fingerprint(w)
  const shuffle = (s: string) => s.slice(0, 2) + rnd(Math.max(0, s.length - 2))
  const keyed = routes.filter((r) => r.tpl?.key)
  let n = 0
  const bad2: string[] = []
  for (const r of keyed) {
    const tpl = r.tpl as Tpl
    const kname = tpl.key as keyof Keys
    const fn = await handler(r.rel, r.method)
    const variants: [string, string][] = [
      ['zz 的', X.zz[kname]],
      ['随机值', shuffle(X.zz[kname])],
      ['自增数字', X.zzIds[kname]],
      ['小写他站键', X.zz[kname].toLowerCase()],
    ]
    if (kname === 'orderNo') variants.push(['主站的', X.mainOrderNo])
    for (const [vlabel, v] of variants) {
      const keys: Keys = { ...X.lulu, [kname]: v }
      const res = await call(fn, owner, { method: r.method, path: r.path, params: tpl.params?.(keys), body: tpl.body?.(keys) })
      n++
      const expect = tpl.foreignExpect ?? 'notFound'
      const good = expect === 'notFound' ? isNotFoundBody(res) : expect === 'noContent' ? res.status === 204 : res.status === 404 || is2xx(res) || res.status === 400
      if (!good) bad2.push(`${r.method} ${r.path} 用${vlabel}${kname} → ${res.status} ${res.text.slice(0, 60)}`)
    }
  }
  check(`${n} 个（路由 × 他站 / 伪造键）全部按不存在处理`, bad2.length === 0, bad2.slice(0, 12).join('；'))
  check('键矩阵之后数据库不变（他站键调写接口零写入）', (await fingerprint(w)) === fp1)

  section('T1 正例：lulu 店主用本站键调全部 GET → 200（响应留给 T10 扫描）')
  const bad3: string[] = []
  for (const r of routes) {
    if (!r.tpl || r.method !== 'GET') continue
    const fn = await handler(r.rel, 'GET')
    const res = await call(fn, owner, { path: r.path, params: r.tpl.params?.(X.lulu) })
    if (res.status !== 200) bad3.push(`${r.path} → ${res.status} ${res.text.slice(0, 60)}`)
    partnerCaptured.push({ label: `GET ${r.path}`, text: res.text, json: res.json, cards: r.path.endsWith('/cards') })
  }
  check('本站键 GET 全部 200', bad3.length === 0, bad3.join('；'))
}

// ===========================================================================
// T2 / T3：会话层分离
// ===========================================================================
async function t2t3(w: World, X: Extra) {
  const { getCurrentUser } = await import('../../src/lib/auth')
  section('T2 lulu 的 cookie 带到主站 / zz → 视为未登录')
  const luluTok = w.token(w.users.crossBuyer, w.lulu)
  for (const host of [MAIN_HOST, w.zz.host]) {
    const u = await withRequest({ host, token: luluTok }, () => getCurrentUser())
    check(`Host ${host}：getCurrentUser = null`, u === null)
    const me = await call(await handler('auth/me', 'GET'), { host, token: luluTok })
    const anon = await call(await handler('auth/me', 'GET'), { host })
    check(`Host ${host}：/api/auth/me 与匿名相同`, me.status === anon.status && me.text === anon.text, `${me.status} ${me.text.slice(0, 60)}`)
    const ol = await call(await handler('orders', 'GET'), { host, token: luluTok })
    check(`Host ${host}：/api/orders → 401`, ol.status === 401, `${ol.status}`)
  }

  section('T3 主站 token（Bearer / cookie）请求 lulu 的全部买家接口 → 与匿名相同')
  const mainTok = w.token(w.users.crossBuyer, w.main)
  const buyerGets: [string, Record<string, string>?][] = [
    ['auth/me'],
    ['account/profile'],
    ['account/unread'],
    ['account/overview'],
    ['orders'],
    ['orders/[id]/messages', { id: String(w.orders.crossLulu.id) }],
    ['orders/[id]/sms', { id: String(w.orders.crossLulu.id) }],
    ['invoices'],
    ['receipts'],
    ['invoice-titles'],
  ]
  const bad: string[] = []
  for (const [rel, params] of buyerGets) {
    let fn: RouteFn
    try {
      fn = await handler(rel, 'GET')
    } catch {
      continue // 该路由没有 GET
    }
    const anon = await call(fn, { host: w.lulu.host }, { params })
    for (const bearer of [true, false]) {
      const r = await call(fn, { host: w.lulu.host, token: mainTok, bearer }, { params })
      if (r.status !== anon.status || (r.json && anon.json && JSON.stringify(r.json) !== JSON.stringify(anon.json))) bad.push(`${rel}（${bearer ? 'Bearer' : 'cookie'}）→ ${r.status} vs 匿名 ${anon.status}`)
    }
  }
  check('主站 token 在 lulu 的买家接口上一律等同匿名', bad.length === 0, bad.join('；'))
  void X
}

// ===========================================================================
// T4：lulu Host 上的全部超管接口（ADMIN 令牌 aud=lulu 与 aud=main 各一遍，带 x-middleware-subrequest）
// ===========================================================================
async function t4(w: World) {
  section('T4 lulu Host 直连全部 /api/admin/*：一律非 2xx、无任何写入')
  const saLulu = w.token(w.users.sa, w.lulu)
  const saMain = w.token(w.users.sa, w.main)
  const admin = allApiRoutes().filter((r) => r.startsWith('admin/'))
  const before = await dbChecksum()
  let total = 0
  let n404 = 0
  const bad: string[] = []
  for (const rel of admin) {
    let mod: Record<string, unknown>
    try {
      mod = await loadRoute(rel)
    } catch (e) {
      bad.push(`${rel} 加载失败：${(e as Error).message.split('\n')[0].slice(0, 80)}`)
      continue
    }
    for (const m of METHODS) {
      const fn = mod[m] as RouteFn | undefined
      if (typeof fn !== 'function') continue
      for (const token of [saLulu, saMain]) {
        total++
        const r = await call(fn, { host: w.lulu.host, token }, {
          method: m,
          path: `/api/${rel}`,
          params: paramsFor(rel),
          body: m === 'GET' || m === 'DELETE' ? undefined : {},
          headers: { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' },
        })
        if (r.status >= 200 && r.status < 400) bad.push(`${m} ${rel} → ${r.status}`)
        if (r.status === 404) n404++
      }
    }
  }
  const after = await dbChecksum()
  check(`${total} 个（超管 handler × 两种 ADMIN 令牌）在 lulu Host 一律非 2xx/3xx`, bad.length === 0 && total > 100, bad.slice(0, 10).join('；'))
  check(`其中 ${n404} 个 404（经 adminGuard / AdminHostError 映射）`, n404 > 0)
  const changed = diffChecksum(before, after)
  check('直连之后全库（审计表除外）逐表 CHECKSUM 不变', changed.length === 0, changed.join('、'))

  section('T4 ADMIN 在 lulu 登录 / 注册 → 拒绝签发')
  const login = await call(await handler('auth/login', 'POST'), { host: w.lulu.host }, { method: 'POST', path: '/api/auth/login', body: { email: w.users.sa.email, password: TEST_PASSWORD } })
  check('ADMIN 在 lulu 登录：不成功', !(login.status === 200 && login.json?.success === true), `${login.status} ${login.text.slice(0, 80)}`)
  check('ADMIN 在 lulu 登录：响应不含 token', !/token/i.test(JSON.stringify(login.json?.data ?? {})), login.text.slice(0, 80))
  const reg = await call(await handler('auth/register', 'POST'), { host: w.lulu.host }, { method: 'POST', path: '/api/auth/register', body: { email: w.users.sa.email, password: TEST_PASSWORD, code: '000000' } })
  check('ADMIN 邮箱在 lulu 注册：不成功', !(reg.status === 200 && reg.json?.success === true), `${reg.status} ${reg.text.slice(0, 80)}`)
  check('ADMIN 没有任何渠道客户关系', (await prisma.tenantCustomer.count({ where: { userId: w.users.sa.id } })) === 0)
}

// ===========================================================================
// T5：主站 Host 与休眠期的 /partner、/api/partner
// ===========================================================================
async function t5(w: World, X: Extra) {
  section('T5 主站 Host 请求全部 /api/partner/* → 404 同体（观察期与休眠期；休眠期 lulu Host 同样 404）')
  const routes = partnerRoutes().filter((r) => r.tpl)
  const ownerMain: Who = { host: MAIN_HOST, token: w.token(w.users.luluOwner, w.main) }
  const bad: string[] = []
  for (const mode of ['observe', 'dormant'] as const) {
    setChannelsMode(mode)
    for (const r of routes) {
      const fn = await handler(r.rel, r.method)
      const tpl = r.tpl as Tpl
      const whos: [string, Who][] = [['主站 Host', ownerMain]]
      if (mode === 'dormant') whos.push(['休眠期 lulu Host', { host: w.lulu.host, token: w.token(w.users.luluOwner, w.lulu) }])
      for (const [label, who] of whos) {
        const res = await call(fn, who, { method: r.method, path: r.path, params: tpl.params?.(X.lulu), body: tpl.body?.(X.lulu) })
        if (!isNotFoundBody(res)) bad.push(`[${mode}] ${label} ${r.method} ${r.path} → ${res.status}`)
      }
    }
  }
  setChannelsMode('observe')
  check('全部 404 同体', bad.length === 0, bad.slice(0, 10).join('；'))

  section('T5 主站 Host 上的 /partner 页面与布局 → notFound')
  const pages: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (name === 'page.tsx' || name === 'layout.tsx') pages.push(p)
    }
  }
  walk(path.join(ROOT, 'src/app/partner'))
  const bad2: string[] = []
  for (const p of pages) {
    const rel = path.relative(ROOT, p).replace(/\\/g, '/')
    const mod = (await import(pathToFileURL(p).href)) as { default: (props: Json) => Promise<unknown> }
    const params = Object.fromEntries(Array.from(rel.matchAll(/\[([^\]]+)\]/g)).map((m) => [m[1], m[1] === 'orderNo' ? X.lulu.orderNo : m[1] === 'customerNo' ? X.lulu.customerNo : m[1] === 'statementNo' ? X.lulu.statementNo : 'itest']))
    for (const mode of ['observe', 'dormant'] as const) {
      setChannelsMode(mode)
      const r = await withRequest({ host: MAIN_HOST, token: w.token(w.users.luluOwner, w.main) }, () => catchNext(() => mod.default({ params, searchParams: {}, children: 'x' })))
      if (r.kind !== 'notFound') bad2.push(`[${mode}] ${rel} → ${r.kind}`)
    }
  }
  setChannelsMode('observe')
  check(`${pages.length} 个 partner 页面 / 布局在主站 Host（观察期与休眠期）一律 notFound`, bad2.length === 0 && pages.length >= 10, bad2.join('；'))
}

// ===========================================================================
// T6：伪造头、未知 Host、停用域名
// ===========================================================================
async function t6(w: World) {
  const { getStorefront, invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  section('T6 伪造 x-tenant-id / x-forwarded-host 被忽略；形如域名的未登记 Host 一律 404、IP 观察期当主站；停用域名 404')
  const forged = { 'x-tenant-id': String(w.zz.id), 'x-forwarded-host': w.zz.host, 'x-tenant-code': w.zz.code }
  const sf1 = await withRequest({ host: w.lulu.host, headers: forged }, () => getStorefront())
  check('lulu Host + 伪造 zz 的头 → 店面仍是 lulu', sf1?.id === w.lulu.id, JSON.stringify(sf1))
  const sf2 = await withRequest({ host: MAIN_HOST, headers: { ...forged, 'x-forwarded-host': w.lulu.host, 'x-tenant-id': String(w.lulu.id) } }, () => getStorefront())
  check('主站 Host + 伪造 lulu 的头 → 店面仍是主站', sf2?.id === 1 && sf2?.kind === 'PLATFORM')
  const dash = await handler('partner/dashboard', 'GET')
  const r1 = await call(dash, { host: MAIN_HOST, token: w.token(w.users.luluOwner, w.lulu) }, { headers: { 'x-forwarded-host': w.lulu.host, 'x-tenant-id': String(w.lulu.id) } })
  check('主站 Host + 伪造 lulu 的头调渠道后台 → 404', isNotFoundBody(r1), `${r1.status}`)

  const unknownBig = `x8u${RUN}.bigolab.com`
  const unknownEvil = `x8-${RUN}.evil.example`
  const disabled = `x8off${RUN}.bigolab.com`
  await prisma.tenantDomain.create({ data: { tenantId: w.lulu.id, host: disabled, isPrimary: false, status: 0 } })
  invalidateStorefrontCache()
  for (const [mode, expectMain] of [
    ['observe', true],
    ['strict', false],
  ] as const) {
    setChannelsMode(mode)
    invalidateStorefrontCache()
    // 形如域名但未登记（*.bigolab.com 一级子域 / 自定义域名形态）：观察期也 404（2026-10-01 加固，绝不回落主站）
    for (const h of [unknownBig, unknownEvil]) {
      const sf = await withRequest({ host: h }, () => getStorefront())
      check(`${mode}：未登记的形如域名 Host ${h.split('.').slice(-2).join('.')} → null（404）`, sf === null, JSON.stringify(sf))
      const pr = await call(dash, { host: h, token: w.token(w.users.luluOwner, w.lulu) })
      check(`${mode}：未知 Host 调渠道后台 → 404`, isNotFoundBody(pr), `${pr.status}`)
    }
    // IP 形态的 Host 永远不可能是渠道域名：观察期仍当主站、严格期 404（与改造前一致）
    const sfIp = await withRequest({ host: '47.100.1.2' }, () => getStorefront())
    check(`${mode}：IP Host → ${expectMain ? '主站' : 'null（404）'}`, expectMain ? sfIp?.id === 1 : sfIp === null, JSON.stringify(sfIp))
    const sfd = await withRequest({ host: disabled }, () => getStorefront())
    check(`${mode}：已登记但停用的渠道域名 → null（404，绝不回落主站）`, sfd === null, JSON.stringify(sfd))
    const noHost = await withRequest({ host: '' }, () => getStorefront())
    check(`${mode}：无 Host → ${expectMain ? '主站' : 'null'}`, expectMain ? noHost?.id === 1 : noHost === null, JSON.stringify(noHost))
  }
  setChannelsMode('observe')
  invalidateStorefrontCache()
}

// ===========================================================================
// T7：跨站写请求
// ===========================================================================
async function t7(w: World, X: Extra) {
  section('T7 跨站 POST（兄弟子域 Origin、主站 Origin、same-site、text/plain）→ 403 / 404，数据库不变')
  const L = w.lulu
  const owner: Who = { host: L.host, token: w.token(w.users.luluOwner, L) }
  const patch = await handler('partner/customers/[customerNo]', 'PATCH')
  const params = { customerNo: X.lulu.customerNo }
  const fp0 = await fingerprint(w)
  const cases: [string, CallOpts][] = [
    ['Origin = zz 子域', { headers: { origin: `https://${w.zz.host}`, 'sec-fetch-site': 'same-site' }, sameOrigin: false }],
    ['Origin = 主站', { headers: { origin: 'https://bigolab.com', 'sec-fetch-site': 'same-site' }, sameOrigin: false }],
    ['Origin = null', { headers: { origin: 'null' }, sameOrigin: false }],
    ['只有 Sec-Fetch-Site: same-site', { headers: { 'sec-fetch-site': 'same-site' }, sameOrigin: false }],
    ['同源但 text/plain', { headers: { 'content-type': 'text/plain' } }],
  ]
  for (const [label, o] of cases) {
    const r = await call(patch, owner, { method: 'PATCH', params, body: { note: 'itest-x8 csrf' }, ...o })
    check(`渠道写接口 ${label} → ${r.status}`, r.status === 403 || r.status === 404, r.text.slice(0, 60))
  }
  check('以上全部零写入', (await fingerprint(w)) === fp0)
  const okr = await call(patch, owner, { method: 'PATCH', params, body: { note: 'itest-x8 同源' } })
  check('对照：同源 JSON → 2xx（写入生效）', is2xx(okr), `${okr.status} ${okr.text.slice(0, 60)}`)

  // 超管侧：主站 Host 上的超管写接口，Origin 是渠道子域 → 403（same-site 的兄弟子域不算本站）
  const adminPatch = await handler('admin/tenants/[id]', 'PATCH')
  const tBefore = await prisma.tenant.findUniqueOrThrow({ where: { id: L.id } })
  const ar = await call(adminPatch, { host: MAIN_HOST, token: w.token(w.users.sa, w.main) }, {
    method: 'PATCH',
    params: { id: String(L.id) },
    body: { name: 'ITEST-TENANT-csrf' },
    headers: { origin: `https://${L.host}`, 'sec-fetch-site': 'same-site' },
    sameOrigin: false,
  })
  const tAfter = await prisma.tenant.findUniqueOrThrow({ where: { id: L.id } })
  check(`超管写接口 Origin = 渠道子域 → ${ar.status}（403 / 404）且不生效`, (ar.status === 403 || ar.status === 404) && tAfter.name === tBefore.name, ar.text.slice(0, 80))
  // 设计 4.6 C4：auth 路由的写接口同源校验「由本项目实现」（WP1 独占 src/app/api/auth/**）。
  // 2026-09-26 WP8 首跑发现 login / register / send-code / reset-password / logout 都没有同源校验（基线 24f5b0f 也没有），
  // 兄弟子域页面可以对渠道站发起登录 CSRF（把受害者登进攻击者账号）；集成阶段已补，这里是正式断言。
  const authBodies: [string, unknown][] = [
    ['auth/login', { email: w.users.luluBuyer1.email, password: TEST_PASSWORD }],
    ['auth/register', { email: `x8-csrf-${RUN}@itest-tenant.local`, password: TEST_PASSWORD, code: '000000' }],
    ['auth/send-code', { email: `x8-csrf-${RUN}@itest-tenant.local`, purpose: 'REGISTER' }],
    ['auth/reset-password', { email: w.users.luluBuyer1.email, code: '000000', password: TEST_PASSWORD }],
    ['auth/logout', {}],
  ]
  for (const [rel, body] of authBodies) {
    let fn: RouteFn
    try {
      fn = await handler(rel, 'POST')
    } catch {
      continue
    }
    const r = await call(fn, { host: L.host, token: rel === 'auth/logout' ? w.token(w.users.luluBuyer1, L) : null }, {
      method: 'POST',
      body,
      headers: { origin: `https://${w.zz.host}`, 'sec-fetch-site': 'same-site' },
      sameOrigin: false,
    })
    // 集成阶段已补（tenant/same-origin 的 authCrossSiteReason）：由「待集成」转为正式断言
    check(`T7 POST /api/${rel}（Origin = zz 子域）→ 403 / 404`, r.status === 403 || r.status === 404, `${r.status} ${r.text.slice(0, 60)}`)
  }
}

// ===========================================================================
// T10：键名扫描 + 值扫描
// ===========================================================================
async function t10(w: World, X: Extra) {
  section('T10 准备：COST 规则批量设进货价、CHANNEL 承担的接码单退款（之后重新拉操作日志、流水与订单明细）')
  const { previewSupply, commitSupply } = await import('../../src/lib/tenant/supply-pricing')
  const pv = await previewSupply(w.lulu.id, { productIds: [w.products.auto] }, { base: 'COST', mode: 'PCT', value: 300 }, 'NONE')
  const cm = await commitSupply(w.lulu.id, pv.previewToken, w.users.sa.id)
  check('COST 规则批量设进货价已提交', !!cm, JSON.stringify(cm).slice(0, 120))
  const { accrueOnPaid, applyRefund } = await import('../../src/lib/tenant/ledger')
  const smsId = w.orders.luluSms.id
  await prisma.$transaction((tx) => accrueOnPaid(tx, smsId))
  const o = await prisma.order.findUniqueOrThrow({ where: { id: smsId } })
  const rf = await prisma.$transaction((tx) =>
    applyRefund(tx, { orderId: smsId, refundGoodsCents: 1500, refundTaxCents: 0, bearer: 'CHANNEL', requestId: `x8-${RUN}-sms`, operatorId: w.users.sa.id, expectedVersion: o.settleVersion, fullStatus: 'REFUNDED' }),
  )
  check('接码单计提 + CHANNEL 承担全额退款成功', o.settleState === 'ACCRUED' && rf.ok === true, `${o.settleState} ${JSON.stringify(rf)}`)
  const owner: Who = { host: w.lulu.host, token: w.token(w.users.luluOwner, w.lulu) }
  for (const [rel, params] of [
    ['partner/audit', undefined],
    ['partner/finance/ledger', undefined],
    ['partner/finance/orders', undefined],
    ['partner/finance/summary', undefined],
    ['partner/dashboard', undefined],
    ['partner/catalog', undefined],
    ['partner/orders', undefined],
    ['partner/orders/export', undefined],
    ['partner/orders/[orderNo]', { orderNo: w.orders.luluSms.orderNo }],
    ['partner/orders/[orderNo]/cards', { orderNo: w.orders.luluSms.orderNo }],
    ['partner/orders/[orderNo]', { orderNo: w.orders.luluManual.orderNo }],
    ['partner/orders/[orderNo]/cards', { orderNo: w.orders.luluManual.orderNo }],
  ] as [string, Record<string, string> | undefined][]) {
    const r = await call(await handler(rel, 'GET'), owner, { params })
    partnerCaptured.push({ label: `GET /api/${rel}${params ? ` ${Object.values(params)[0]}` : ''}（退款后）`, text: r.text, json: r.json, cards: rel.endsWith('/cards') })
  }

  section(`T10 键名扫描：${partnerCaptured.length} 个渠道后台响应（允许键表 = WP0 的 PARTNER_ALLOWED_KEYS，publicDiff 子树只查禁用键）`)
  const badKeys: string[] = []
  for (const c of partnerCaptured) {
    if (!c.json) continue
    const b = scanPartnerKeys(c)
    if (b.length) badKeys.push(`${c.label}：${b.slice(0, 5).join('，')}`)
  }
  check('渠道后台响应零禁用键 / 零未登记键', badKeys.length === 0, badKeys.slice(0, 8).join('；'))

  section('T10 值扫描：成本特征值零命中；进货价只在进货价字段；交付凭据只在 /cards；他站邮箱与主站单号零命中')
  const foreignEmails = [w.users.zzBuyer1.email, w.users.zzBuyer2.email, w.users.zzOwner.email, w.users.mainOldLoginLulu.email, w.users.sa.email]
  const mainOnlyNos = [w.orders.crossMain.orderNo, w.orders.regMainOrder.orderNo, w.orders.zzAuto.orderNo]
  const costHits: string[] = []
  const supplyHits: string[] = []
  const secretHits: string[] = []
  const leakHits: string[] = []
  const COST_VALUES = new Set(['107.13', '10713', '3.17', '317'])
  for (const c of partnerCaptured) {
    const pairs = c.json ? valuePairs(c.json) : []
    for (const [k, v] of pairs) {
      const sv = String(v)
      if (COST_VALUES.has(sv) && !/^(page|pageSize|total|count|sales|quantity)$/.test(k)) costHits.push(`${c.label} ${k}=${sv}`)
      if ((sv === '11037' || sv === '110.37' || sv === '11034' || sv === '110.34') && !/supply|purchase/i.test(k)) supplyHits.push(`${c.label} ${k}=${sv}`)
    }
    // CSV / 非 JSON 响应按文本扫
    if (!c.json && /107\.13|(^|[^0-9])3\.17([^0-9]|$)/.test(c.text)) costHits.push(`${c.label}（文本）`)
    for (const s of [MARK.deliveryInfo, MARK.cardPlain, MARK.smsCode]) if (!c.cards && c.text.includes(s)) secretHits.push(`${c.label} 含 ${s.slice(0, 16)}`)
    for (const e of foreignEmails) if (c.text.includes(e)) leakHits.push(`${c.label} 含他站邮箱 ${e}`)
    for (const no of mainOnlyNos) if (c.text.includes(no)) leakHits.push(`${c.label} 含他站订单号 ${no}`)
  }
  check('卡 cost 107.13、接码 cost 3.17 在任何渠道响应里零命中（含 COST 规则设价后的操作日志、CHANNEL 退款后的流水与明细）', costHits.length === 0, costHits.slice(0, 6).join('；'))
  check('进货价特征值只出现在进货价字段', supplyHits.length === 0, supplyHits.slice(0, 6).join('；'))
  check('deliveryInfo / 卡密明文 / 验证码只出现在 /cards 响应', secretHits.length === 0, secretHits.slice(0, 6).join('；'))
  check('他站买家邮箱、主站与 zz 的订单号零命中', leakHits.length === 0, leakHits.slice(0, 6).join('；'))
  const cardsResp = partnerCaptured.filter((c) => c.cards).map((c) => c.text).join('\n')
  check('对照：/cards 响应里确实有 deliveryInfo 特征串与验证码（值扫描不是空跑）', cardsResp.includes(MARK.deliveryInfo) && cardsResp.includes(MARK.smsCode))

  section('T10 渠道站前台（买家侧）响应：禁用键零命中；价格键的值只能是本店售价（不是站长价 129、不是进货价）')
  const buyer: Who = { host: w.lulu.host, token: w.token(w.users.luluBuyer1, w.lulu) }
  const gets: [string, Record<string, string>?][] = [
    ['products'],
    ['products/[id]', { id: String(w.products.auto) }],
    ['categories'],
    ['orders'],
    ['orders/recent'],
    ['account/overview'],
    ['account/unread'],
    ['account/profile'],
    ['auth/me'],
    ['orders/[id]/messages', { id: String(w.orders.luluAuto.id) }],
    ['orders/[id]/sms', { id: String(w.orders.luluSms.id) }],
    ['invoices'],
    ['receipts'],
  ]
  const badB: string[] = []
  const priceB: string[] = []
  let captured = 0
  for (const [rel, params] of gets) {
    let fn: RouteFn
    try {
      fn = await handler(rel, 'GET')
    } catch {
      continue
    }
    const r = await call(fn, buyer, { params })
    if (!r.json) continue
    captured++
    const keys = new Set<string>()
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object')
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
          keys.add(k)
          walk(x)
        }
    }
    walk(r.json)
    const hit = BUYER_FORBIDDEN.filter((k) => keys.has(k))
    if (hit.length) badB.push(`${rel}：${hit.join(',')}`)
    for (const [k, v] of valuePairs(r.json)) {
      if (!/^(price|priceCents|productPrice|unitPrice)$/.test(k)) continue
      const sv = String(v)
      if (['129', '129.00', '12900', '110.37', '11037', '110.34', '11034', '115', '115.00', '11500'].includes(sv)) priceB.push(`${rel} ${k}=${sv}`)
    }
  }
  check(`${captured} 个前台响应零禁用键`, badB.length === 0 && captured >= 8, badB.join('；'))
  check('前台价格键的值不是站长价 / 进货价 / zz 的售价（WP2：price 键保留、值是本店售价，改为值扫描）', priceB.length === 0, priceB.join('；'))
  void X
}

// ===========================================================================
// T11：同一买家两站互不可见；用 lulu 会话调主站订单的买家写接口；跨站 ExternalOrder
// ===========================================================================
async function t11(w: World) {
  section('T11 同一买家（在 lulu 与主站都下过单）：两站互不可见')
  const cb = w.users.crossBuyer
  const L: Who = { host: w.lulu.host, token: w.token(cb, w.lulu) }
  const M: Who = { host: MAIN_HOST, token: w.token(cb, w.main) }
  const ordersFn = await handler('orders', 'GET')
  const gl = await call(ordersFn, L)
  const gm = await call(ordersFn, M)
  const nos = (r: { json: Json }) => ((r.json?.data?.list || []) as Json[]).map((o) => o.orderNo)
  check('lulu 列表只有 lulu 的单', JSON.stringify(nos(gl)) === JSON.stringify([w.orders.crossLulu.orderNo]), nos(gl).join(','))
  check('主站列表只有主站的单', JSON.stringify(nos(gm)) === JSON.stringify([w.orders.crossMain.orderNo]), nos(gm).join(','))

  section('T11 lulu 会话调主站订单的买家写接口（及反向）→ 404、零写入')
  const mid = String(w.orders.crossMain.id)
  const lid = String(w.orders.crossLulu.id)
  const probes: [string, string, unknown?][] = [
    ['orders/[id]/messages', 'POST', { content: 'itest-x8' }],
    ['orders/[id]/sms', 'POST', {}],
    ['orders/[id]/sms/retry', 'POST', {}],
    ['orders/[id]/invoice', 'POST', { title: 'X', taxNumber: '91110000ITEST0008X', email: cb.email, showAiWording: false }],
    ['orders/[id]/receipt', 'POST', { payerTitle: 'X', showAiWording: false }],
  ]
  const msg0 = await prisma.orderMessage.count({ where: { orderId: { in: [w.orders.crossMain.id, w.orders.crossLulu.id] } } })
  const inv0 = await prisma.invoice.count()
  const rc0 = await prisma.receipt.count()
  for (const [rel, method, body] of probes) {
    let fn: RouteFn
    try {
      fn = await handler(rel, method)
    } catch {
      continue
    }
    const a = await call(fn, L, { method, params: { id: mid }, body })
    check(`lulu 会话 ${method} /api/${rel}（主站订单）→ 404`, a.status === 404, `${a.status} ${a.text.slice(0, 80)}`)
    const b = await call(fn, M, { method, params: { id: lid }, body })
    check(`主站会话 ${method} /api/${rel}（lulu 订单）→ 404`, b.status === 404, `${b.status} ${b.text.slice(0, 80)}`)
  }
  const vc = await call(await handler('pay/vmq/create', 'POST'), L, { method: 'POST', body: { orderNo: w.orders.crossMain.orderNo } })
  check('lulu 会话对主站订单发起收款 → 404', vc.status === 404, `${vc.status} ${vc.text.slice(0, 80)}`)
  check(
    '以上零写入（留言、发票、收据）',
    (await prisma.orderMessage.count({ where: { orderId: { in: [w.orders.crossMain.id, w.orders.crossLulu.id] } } })) === msg0 && (await prisma.invoice.count()) === inv0 && (await prisma.receipt.count()) === rc0,
  )

  section('T11 在 lulu Host 用主站 ExternalOrder.id + 正确邮箱提交 /api/receipts、/api/invoices → 404、零写入')
  const extMain = await prisma.externalOrder.create({
    data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'itest', claudeAccount: cb.email, quote: new Prisma.Decimal('129.00'), sourceKey: `itx8-main-${RUN}`, shopOrderId: w.orders.crossMain.id, tenantId: 1 },
  })
  const rcpt = await call(await handler('receipts', 'POST'), L, { method: 'POST', body: { externalOrderId: extMain.id, payerTitle: 'ITEST', showAiWording: false } })
  check('POST /api/receipts（lulu 会话、主站外部订单）→ 404', rcpt.status === 404, `${rcpt.status} ${rcpt.text.slice(0, 80)}`)
  const inv = await call(await handler('invoices', 'POST'), L, { method: 'POST', body: { externalOrderId: extMain.id, title: 'ITEST', taxNumber: '91110000ITEST0008X', email: cb.email, showAiWording: false } })
  check('POST /api/invoices（lulu 会话、主站外部订单）→ 404', inv.status === 404, `${inv.status} ${inv.text.slice(0, 80)}`)
  const anonR = await call(await handler('receipts', 'POST'), { host: w.lulu.host }, { method: 'POST', body: { externalOrderId: extMain.id, payerTitle: 'ITEST', showAiWording: false } })
  check('POST /api/receipts（lulu 匿名、主站外部订单）→ 404', anonR.status === 404, `${anonR.status}`)
  check('外部订单上零收据、零发票', (await prisma.receipt.count({ where: { externalOrderId: extMain.id } })) === 0 && (await prisma.invoice.count({ where: { externalOrderId: extMain.id } })) === 0)
}

// ===========================================================================
// T12 应用层：遍历全部 /api 路由在渠道 Host 的响应（分类表）
// ===========================================================================
const CLOSED_RE = [
  /^coupons(\/|$)/,
  /^lottery(\/|$)/,
  /^account\/(referral|wallet|vip|marketing|bindings)(\/|$)/,
  // 短信接码 · B1：余额充值只在主站（docs/短信接码-设计.md D11、§6.6 第 20 条）
  /^wallet(\/|$)/,
  // 短信接码 · S1：目录接口只在主站（docs/短信接码-设计.md D11、§6.6 第 23 条「渠道 404 遍历」）
  /^jiema(\/|$)/,
  /^external-orders(\/|$)/,
  /^forum(\/|$)/,
  /^news(\/|$)/,
  /^games(\/|$)/,
  /^links(\/|$)/,
  // /^announcement$/ 移出（2026-10-05 渠道品牌与公告）：渠道 Host 返回本渠道自己的公告，归 OPEN（nginx 白名单同步放行）
  // track/view（docs/微信机器人-设计.md §6.5）：应用里另有开关 TRACK_CHANNEL_VIEWS，关着时渠道 Host 与改造前逐字相同（404）。
  // 本脚本开头清掉了这个开关，所以应用层仍按关闭模块断言；nginx 白名单已放行它，nginx 层按 GATED_OPEN_RE 核对
  /^track\/view$/,
  /^upload$/,
  // 内容模块下放（docs/多渠道分销-内容模块下放.md）：forum / news / upload 与下面的 content、me 按渠道授权开关（默认不授权）。
  // 本脚本的渠道都没授权，应用层仍按关闭模块断言（授权后的行为由 mods-modules 覆盖）；nginx 层按 GATED_OPEN_RE 核对放行
  /^content(\/|$)/,
  /^me(\/|$)/,
  /^mkt(\/|$)/,
  /^invoice-requests(\/|$)/,
  /^finance(\/|$)/,
  /^quick-reply(\/|$)/,
  // 微信机器人一次性补货（docs/微信机器人-设计.md §9、§12.3）：平台内部工具，第一句 denyOnChannel()，渠道 Host 404
  /^bot\/x(\/|$)/,
]
// bot/wxpad：微信机器人协议服务的回调（docs/微信机器人-设计.md §11.3、§12.3），凭路径密钥鉴权，只走 Docker 内网（nginx 对外一律 404，见 T12 nginx 层）。
// cron/bot-tick、cron/bot-daily 由 cron 一项覆盖（x-cron-secret）；admin/bot/* 由 admin/ 前缀归 ADMIN（每个 handler adminGuard，边界检查规则 6）
const SECRET_RE = [/^cron(\/|$)/, /^inventory(\/|$)/, /^pay\/sms-notify$/, /^bot\/wxpad(\/|$)/]
/** 与 nginx 渠道 /api 白名单同一口径（设计 4.3）；这里独立写一份，nginx 层测试会拿它与 nginx.conf 的实际行为互相核对 */
// domain-check：平台经公网校验自定义域名的应答端（docs/多渠道分销-自定义域名.md 第 9 节），只回签名，渠道 Host 上放行
// partner-reply：分站群留言的渠道快速回复（docs/微信机器人-设计.md §5.5），只在渠道自己的域名上可用（主站 Host 由接口自己 404，见 tPartnerReply）；
// 不能指望上面的 partner 一项：partner(\/|$) 匹配不到 partner-reply
const OPEN_RE = /^(auth|products|categories|orders|pay\/vmq\/(create|status)|receipts|invoices|invoice-titles|redeem|partner|account\/(profile|unread|overview)|domain-check|announcement|partner-reply)(\/|$)/
/**
 * nginx 渠道 /api 白名单已放行、应用层另有开关的路由（docs/微信机器人-设计.md §6.5）：nginx 层按「放行」核对，
 * 应用层仍归 CLOSED（开关关着时 404，见上面 CLOSED_RE 里 track/view 的说明）。开关正式打开后挪进 OPEN_RE、从 CLOSED_RE 删掉。
 */
const GATED_OPEN_RE = /^(track\/view$|(news|content|forum|me|upload)(\/|$))/
/** 主会话 D3：这两个路由待加 denyOnChannel（P0 前置新增、第 13 节无归属） */
/** 主会话 D3：P0 前置新增的两条绑定验证路由，集成阶段补了 denyOnChannel()（原「待集成」项） */
const D3_ROUTES = new Set(['account/bindings/send-code', 'account/bindings/verify'])

async function t12app(w: World) {
  section('T12 应用层：全部 /api 路由分类（关闭模块 / 平台专用 / 超管 / 密钥鉴权 / 渠道开放）')
  const all = allApiRoutes()
  const cls = (r: string) =>
    r.startsWith('admin/') ? 'ADMIN' : SECRET_RE.some((x) => x.test(r)) ? 'SECRET' : CLOSED_RE.some((x) => x.test(r)) ? 'CLOSED' : OPEN_RE.test(r) ? 'OPEN' : 'UNCLASSIFIED'
  const unc = all.filter((r) => cls(r) === 'UNCLASSIFIED')
  check(`${all.length} 个路由全部归类（新增路由必须先决定它在渠道站开不开）`, unc.length === 0, unc.join('、'))
  const count = (k: string) => all.filter((r) => cls(r) === k).length
  console.log(`  （ADMIN ${count('ADMIN')}、SECRET ${count('SECRET')}、CLOSED ${count('CLOSED')}、OPEN ${count('OPEN')}）`)

  section('T12 应用层：关闭模块与平台专用路由在渠道 Host → 404（denyOnChannel）；主站同样请求不被拦')
  const tok = w.token(w.users.luluBuyer1, w.lulu)
  const bad: string[] = []
  const d3Seen: string[] = []
  let total = 0
  for (const rel of all.filter((r) => cls(r) === 'CLOSED')) {
    const mod = await loadRoute(rel)
    let relBad = false
    for (const m of METHODS) {
      const fn = mod[m] as RouteFn | undefined
      if (typeof fn !== 'function') continue
      total++
      const r = await call(fn, { host: w.lulu.host, token: tok }, { method: m, path: `/api/${rel}`, params: paramsFor(rel), body: m === 'GET' || m === 'DELETE' ? undefined : {} })
      const ok = r.status === 404 && r.json?.success === false && r.json?.error === '资源不存在'
      if (!ok) {
        relBad = true
        bad.push(`${m} ${rel} → ${r.status}`)
      }
    }
    if (D3_ROUTES.has(rel)) d3Seen.push(`${rel}:${relBad ? 'bad' : 'ok'}`)
  }
  // 主会话 D3（集成阶段已补 denyOnChannel()）：两条绑定验证路由必须出现在关闭模块清单里且 404
  check('D3：account/bindings/send-code、verify 被归为关闭模块且在渠道 Host 404', d3Seen.length === D3_ROUTES.size && d3Seen.every((x) => x.endsWith(':ok')), d3Seen.join('；'))
  check(`${total} 个关闭模块 handler 在渠道 Host 一律 404 JSON`, bad.length === 0 && total >= 55, bad.join('；'))
  setChannelsMode('dormant')
  const dormantBad: string[] = []
  for (const rel of ['announcement', 'forum/categories', 'news/list', 'lottery/info']) {
    const r = await call(await handler(rel, 'GET'), { host: w.lulu.host })
    if (r.status === 404 && r.json?.error === '资源不存在') dormantBad.push(rel)
  }
  setChannelsMode('observe')
  check('休眠期：lulu Host 上的关闭模块 GET 不被拦（主站行为不变）', dormantBad.length === 0, dormantBad.join('、'))

  section('T12 应用层：密钥鉴权的例外表（cron / inventory / sms-notify 不看 Host，只由 nginx 层挡住）——无密钥一律非 2xx')
  const bad2: string[] = []
  for (const rel of all.filter((r) => cls(r) === 'SECRET')) {
    const mod = await loadRoute(rel)
    for (const m of METHODS) {
      const fn = mod[m] as RouteFn | undefined
      if (typeof fn !== 'function') continue
      const r = await call(fn, { host: w.lulu.host }, { method: m, path: `/api/${rel}`, body: m === 'GET' ? undefined : {} })
      if (is2xx(r)) bad2.push(`${m} ${rel} → ${r.status}`)
    }
  }
  check('无密钥请求一律非 2xx', bad2.length === 0, bad2.join('；'))

  section('T12 应用层：关闭模块与平台专用页面（layout）在渠道 Host → notFound，主站照常')
  const layouts: [string, string | null][] = [
    ...['news', 'forum', 'games', 'links', 'chongzhi', 'iptools', 'vip', 'wallet', 'jiema', 'coupon', 'coupons', 'lookup', 'profile/referral'].map((x) => [`src/app/(shop)/${x}/layout.tsx`, null] as [string, string | null]),
    ['src/app/finance/[token]/layout.tsx', null],
    ['src/app/reply/[token]/layout.tsx', null],
    // 主会话 D4（集成阶段已改为异步服务端 layout，第一行 await notFoundOnChannel()）
    ['src/app/invoice-request/[token]/layout.tsx', null],
    ['src/app/unsubscribe/[token]/layout.tsx', null],
    // 微信机器人一次性补货页（docs/微信机器人-设计.md §9.2）：平台内部工具，layout 第一行 notFoundOnChannel()
    ['src/app/bot/x/[token]/layout.tsx', null],
  ]
  const badL: string[] = []
  for (const [file, pendingOwner] of layouts) {
    const mod = (await import(pathToFileURL(path.join(ROOT, file)).href)) as { default: (p: Json) => unknown }
    const run = (host: string) => withRequest({ host }, () => catchNext(async () => mod.default({ children: 'x', params: { token: 'itest' } })))
    const onCh = await run(w.lulu.host)
    const onMain = await run(MAIN_HOST)
    const good = onCh.kind === 'notFound' && onMain.kind === 'ok'
    if (pendingOwner) pendingCheck(`T12 ${file} 渠道 notFound / 主站照常`, good, pendingOwner, `渠道=${onCh.kind} 主站=${onMain.kind}`)
    else if (!good) badL.push(`${file}：渠道=${onCh.kind} 主站=${onMain.kind}`)
  }
  check('关闭模块与平台专用 layout：渠道 notFound、主站照常', badL.length === 0, badL.join('；'))

  section('T12 应用层：渠道站营销全关（券 400、ref 忽略、未知字段忽略；渠道单无券 / 推荐人 / 抽奖资格）')
  const post = await handler('orders', 'POST')
  const b = w.users.luluBuyer2
  const who: Who = { host: w.lulu.host, token: w.token(b, w.lulu) }
  const r1 = await call(post, who, { method: 'POST', body: { productId: w.products.auto, quantity: 1, couponGrantId: 12345 } })
  check('带 couponGrantId → 400', r1.status === 400, `${r1.status} ${r1.text.slice(0, 80)}`)
  const r2 = await call(post, who, { method: 'POST', body: { productId: w.products.auto, quantity: 1, ref: 'ITX8REF', payMethod: 'BALANCE', balance: 999, tenantId: 1, supplyCents: 1, amount: 0.01 } })
  const no = r2.json?.data?.order?.orderNo as string | undefined
  check('带 ref 与未知字段 → 照常下单', r2.status === 200 && !!no, `${r2.status} ${r2.text.slice(0, 100)}`)
  if (no) {
    const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: no } })
    check('渠道单：tenantId = lulu、按本店售价、无券、无推荐人、非余额支付', o.tenantId === w.lulu.id && o.amount.toFixed(2) === '140.00' && o.couponGrantId === null && o.referrerId === null && o.payMethod === null)
    check('渠道单没有抽奖资格', (await prisma.lotteryEntry.count({ where: { orderId: o.id } })) === 0)
  }
  const lot = await call(await handler('lottery/info', 'GET'), who)
  check('抽奖接口在渠道 Host → 404', lot.status === 404)
}

// ===========================================================================
// T12 应用层 · 渠道快速回复（docs/微信机器人-设计.md §5.5、§17「渠道快速回复只在本站域名可用」）：
// 接口 /api/partner-reply/<令牌> 与页面 /partner-reply/<令牌> 只在令牌所属分站自己的 Host 上可用；开关没开、主站 / 别的渠道 Host、
// 令牌被改 / 过期 / 订单不属于该分站一律同体 404（页面 notFound）、零写入；回复与渠道后台同一流程；暂停营业只读；每令牌 10 分钟 20 条
// ===========================================================================
async function tPartnerReply(w: World) {
  section('T12 应用层：渠道快速回复（只在本站域名可用、不合格一律同体 404、回复落库口径、暂停营业只读、每令牌限频）')
  const { issueTenantReplyToken } = await import('../../src/lib/bot/tenant-reply')
  const GET = await handler('partner-reply/[token]', 'GET')
  const POST = await handler('partner-reply/[token]', 'POST')
  type PageFn = (p: { params: { token: string } }) => Promise<unknown>
  const page = (await import(pathToFileURL(path.join(ROOT, 'src/app/partner-reply/[token]/page.tsx')).href)) as { default: PageFn }
  const renderPage = (host: string, token: string) => withRequest({ host }, () => catchNext(() => page.default({ params: { token } })))
  const L = w.lulu
  const o = w.orders.luluAuto
  const DAY = 86400_000
  const tok = issueTenantReplyToken(o.orderNo, L.id, DAY)
  const at = (t: string) => ({ path: `/api/partner-reply/${t}`, params: { token: t } })
  const NOT_FOUND_JSON = JSON.stringify({ success: false, error: '资源不存在' })
  const msgCount = () => prisma.orderMessage.count({ where: { orderId: o.id } })
  // 改签名中段的一个字符（末位字符只带 4 个有效比特，换成相邻字符可能解出同样的字节，这里只比字符串也不该依赖它）
  const tamper = (t: string) => {
    const i = t.length - 5
    return t.slice(0, i) + (t[i] === 'A' ? 'B' : 'A') + t.slice(i + 1)
  }
  const saved = process.env.BOT_TENANT_REPLY
  try {
    delete process.env.BOT_TENANT_REPLY
    const off = await call(GET, { host: L.host }, at(tok))
    const offPage = await renderPage(L.host, tok)
    check('BOT_TENANT_REPLY 没开：lulu Host + 有效令牌 → 接口 404、页面 notFound', off.status === 404 && off.text === NOT_FOUND_JSON && offPage.kind === 'notFound', `${off.status} ${offPage.kind}`)

    process.env.BOT_TENANT_REPLY = '1'
    const ok = await call(GET, { host: L.host }, at(tok))
    check('lulu Host + lulu 的令牌 → 200，订单号对得上、留言是数组', ok.status === 200 && ok.json?.data?.order?.orderNo === o.orderNo && Array.isArray(ok.json?.data?.rows), `${ok.status} ${ok.text.slice(0, 120)}`)
    const keys = new Set<string>()
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object')
        for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
          keys.add(k)
          walk(x)
        }
    }
    walk(ok.json)
    const leak = ['email', 'nickname', 'user', 'buyer', 'content', 'senderRole', 'senderUserId', 'readByTenant', 'readByAdmin', 'deliveryInfo', 'id', 'orderId', 'userId', 'tenantId', 'supplyCents', 'supplyUnitPrice', 'mainPriceAtOrder', 'buyerRemark', 'remark'].filter((k) => keys.has(k))
    check(
      '响应字段收窄：无买家邮箱 / 昵称、无卡密与交付信息、无内部 id 与进货价',
      leak.length === 0 && !ok.text.includes(w.users.luluBuyer1.email) && !ok.text.includes(MARK.cardPlain),
      leak.join(','),
    )
    const raw = await withRequest({ host: L.host }, () => GET(new NextRequest(`http://${L.host}/api/partner-reply/${tok}`, { headers: { host: L.host } }), { params: { token: tok } }))
    check('响应 Cache-Control: no-store', raw.headers.get('cache-control') === 'no-store', String(raw.headers.get('cache-control')))
    const okPage = await renderPage(L.host, tok)
    check('页面：lulu Host + 有效令牌 → 正常渲染', okPage.kind === 'ok', okPage.kind === 'error' ? String((okPage as { error: unknown }).error).slice(0, 160) : okPage.kind)

    const variants: [string, string, string][] = [
      ['主站 Host', MAIN_HOST, tok],
      ['zz 的 Host', w.zz.host, tok],
      ['签名被改', L.host, tamper(tok)],
      ['已过期', L.host, issueTenantReplyToken(o.orderNo, L.id, -60_000)],
      ['zz 的订单（令牌签给 lulu）', L.host, issueTenantReplyToken(w.orders.zzAuto.orderNo, L.id, DAY)],
      ['主站订单（令牌签给 lulu）', L.host, issueTenantReplyToken(w.orders.crossMain.orderNo, L.id, DAY)],
      ['登录 JWT 当令牌', L.host, w.token(w.users.luluOwner, L)],
    ]
    const n0 = await msgCount()
    const bad: string[] = []
    for (const [label, host, t] of variants) {
      const g = await call(GET, { host }, at(t))
      const p = await call(POST, { host }, { method: 'POST', ...at(t), body: { content: 'itest-pr 不该落库' } })
      const pg = await renderPage(host, t)
      if (!(g.status === 404 && g.text === NOT_FOUND_JSON)) bad.push(`GET ${label} → ${g.status}`)
      if (!(p.status === 404 && p.text === NOT_FOUND_JSON)) bad.push(`POST ${label} → ${p.status}`)
      if (pg.kind !== 'notFound') bad.push(`页面 ${label} → ${pg.kind}`)
    }
    check(`${variants.length} 种不合格的 Host / 令牌：接口 GET、POST 一律同体 404，页面 notFound`, bad.length === 0, bad.join('；'))
    check('以上零写入', (await msgCount()) === n0)

    setChannelsMode('dormant')
    try {
      const d = await call(GET, { host: L.host }, at(tok))
      check('休眠期（任何 Host 都是主站）：lulu Host + 有效令牌 → 404', d.status === 404 && d.text === NOT_FOUND_JSON, `${d.status}`)
    } finally {
      setChannelsMode('observe')
    }

    // 回复：先放一条渠道未读的买家留言，验证「回复时标渠道已读、站长红点不动」
    const buyerMsg = await prisma.orderMessage.create({ data: { orderId: o.id, sender: 'BUYER', content: 'itest-pr 买家留言', readByTenant: false } })
    const n1 = await msgCount()
    const text = 'itest-pr 渠道快速回复'
    const r = await call(POST, { host: L.host }, { method: 'POST', ...at(tok), body: { content: `  ${text}  ` } })
    check('POST → 200，返回新留言行（本店、去首尾空白）', r.status === 200 && r.json?.data?.row?.sender === 'PARTNER' && r.json?.data?.row?.messageText === text, `${r.status} ${r.text.slice(0, 120)}`)
    const reply = await prisma.orderMessage.findFirst({ where: { orderId: o.id }, orderBy: { id: 'desc' } })
    check(
      '落库：sender=ADMIN、senderRole=PARTNER、senderUserId 留空、readByTenant / readByAdmin=true、readByBuyer=false，只多一行',
      reply?.sender === 'ADMIN' && reply.senderRole === 'PARTNER' && reply.senderUserId === null && reply.content === text && reply.readByTenant === true && reply.readByAdmin === true && reply.readByBuyer === false && (await msgCount()) === n1 + 1,
    )
    const bm = await prisma.orderMessage.findUnique({ where: { id: buyerMsg.id } })
    check('买家留言标渠道已读、readByAdmin 不动（站长红点保留）', bm?.readByTenant === true && bm.readByAdmin === false)
    const audit = await prisma.auditEvent.findFirst({ where: { tenantId: L.id, action: 'order.message' }, orderBy: { id: 'desc' } })
    const diff = audit?.diff as Json
    check(
      '审计：TENANT、actorUserId 留空、targetId = 订单号、diff = { length, via: partner-reply }',
      audit?.actorKind === 'TENANT' && audit.actorUserId === null && audit.targetId === o.orderNo && diff?.via === 'partner-reply' && diff?.length === text.length,
      JSON.stringify(diff),
    )

    const n2 = await msgCount()
    const empty = await call(POST, { host: L.host }, { method: 'POST', ...at(tok), body: { content: '   ' } })
    const long = await call(POST, { host: L.host }, { method: 'POST', ...at(tok), body: { content: 'x'.repeat(1001) } })
    check('空白内容 / 超过 1000 字 → 400、不落库', empty.status === 400 && long.status === 400 && (await msgCount()) === n2, `${empty.status} ${long.status}`)

    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'SUSPENDED' } })
    try {
      const sg = await call(GET, { host: L.host }, at(tok))
      const sp = await call(POST, { host: L.host }, { method: 'POST', ...at(tok), body: { content: 'itest-pr 暂停营业时回复' } })
      const spg = await renderPage(L.host, tok)
      check('暂停营业：能看（GET 200、页面照常）、不能回（POST 403、不落库）', sg.status === 200 && spg.kind === 'ok' && sp.status === 403 && (await msgCount()) === n2, `${sg.status} ${spg.kind} ${sp.status}`)
    } finally {
      await prisma.tenant.update({ where: { id: L.id }, data: { status: 'ACTIVE' } })
    }

    // 每令牌 10 分钟 20 条：换一条新链接（过期时刻不同 = 另一个令牌，不吃上面几次的计数）；call 每次换 IP，碰不到按 IP 的那道
    const tok2 = issueTenantReplyToken(o.orderNo, L.id, DAY + 60_000)
    let stop = 0
    for (let i = 1; i <= 21 && !stop; i++) {
      const x = await call(POST, { host: L.host }, { method: 'POST', ...at(tok2), body: { content: `itest-pr 限频 ${i}` } })
      if (x.status === 429) stop = i
      else if (x.status !== 200) stop = -x.status
    }
    check('同一令牌 10 分钟内前 20 条照常、第 21 条 → 429', stop === 21, String(stop))
  } finally {
    if (saved === undefined) delete process.env.BOT_TENANT_REPLY
    else process.env.BOT_TENANT_REPLY = saved
  }
}

// ===========================================================================
// T12 nginx 层（经本地 nginx 容器）+ W8-8：nginx -t、closed 的 Host 只得到停业页、X-Forwarded-Host 不再下发
// 2026-09-26 G1.5 起 lulu 在 map 里是 channel（应用 CHANNELS_ENABLED=1 已上线）；closed 分支仍是紧急下线手段，
// 改用测试副本里注入的 closed 测试 Host 验证，不再要求 lulu 本身是 closed
// ===========================================================================
function docker(args: string[], opts: { input?: string; allowFail?: boolean } = {}): string {
  const r = spawnSync('docker', args, { encoding: 'utf8', input: opts.input, env: { ...process.env, MSYS_NO_PATHCONV: '1' } })
  if (r.status !== 0 && !opts.allowFail) throw new Error(`docker ${args.join(' ')} → ${r.status}: ${(r.stderr || r.stdout || '').slice(0, 300)}`)
  return (r.stdout || '') + (r.stderr || '')
}
function hasDocker(): boolean {
  try {
    // 带超时：Docker Desktop 引擎卡住时 `docker version` 会无限挂起（2026-09-30 集成时整轮 run-all 卡死在这里），
    // 超时按「没有 docker」处理，照常打印「nginx 层未验证」
    execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'pipe', timeout: 15_000 })
    return true
  } catch {
    return false
  }
}
function ngxGet(port: number, host: string, p: string, method = 'GET', headers: Record<string, string> = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string } | { error: string }> {
  return new Promise((resolve) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: p, method, headers: { host, ...headers } }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }))
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(8000, () => {
      req.destroy()
      resolve({ error: 'timeout' })
    })
    req.end()
  })
}
/** 渠道自定义域名的测试 Host（nginx 层只看形状，不需要登记；应用层的登记与解析见 mods-domain.ts） */
const CUSTOM_TEST = 'tibo.test'
/** 测试副本里注入的 closed Host（紧急下线口径的停业页验证用；真实配置里没有它） */
const TEST_CLOSED = 'closed-test.bigolab.com'
const UPSTREAM_CONF = `events {}
http {
  server {
    listen 3000;
    default_type text/plain;
    location / { return 200 "UPSTREAM|host=$host|xfh=$http_x_forwarded_host|xms=$http_x_middleware_subrequest|xti=$http_x_tenant_id|uri=$request_uri\\n"; }
  }
}
`

async function t12nginx() {
  section('T12 nginx 层 / W8-8：本地临时容器跑仓库里的 nginx.conf（上游是回显桩，不连应用）')
  if (!hasDocker()) {
    console.log('  ⚠ 本机没有 docker：nginx 层未验证（部署说明 N3 的临时容器 nginx -t 与本节等价，必须在服务器上补做）')
    return
  }
  const conf = readFileSync(path.join(ROOT, 'nginx/nginx.conf'), 'utf8')
  const confCode = conf.replace(/#[^\n]*/g, '') // 只看指令，不看注释（注释里会引用旧写法）
  check('nginx.conf：lulu 在 map 里是 channel（G1.5 起；紧急下线才改回 closed）', /lulu\.bigolab\.com\s+channel;/.test(confCode))
  // 渠道自定义域名（docs/多渠道分销-自定义域名.md 第 5 节）：形如域名的其余 Host 一律 channel，正则必须带引号（含花括号）
  check(
    'nginx.conf：自定义域名正则在 $site_known 里且按 channel 处理',
    confCode.split('\n').some((l) => l.trim().startsWith('"~^(?!(?:\\d{1,3}\\.){3}\\d{1,3}$)') && l.includes('xn--') && /"\s+channel;\s*$/.test(l)),
  )
  // 8080（公网 IP 直连入口）里必须有 domain-check 的 404：合法校验只走 Cloudflare → 隧道 → 容器 80
  const s8080 = confCode.slice(confCode.indexOf('listen 8080'))
  check('nginx.conf：8080 server 里 location ^~ /api/domain-check { return 404; }', confCode.includes('listen 8080') && /location\s+\^~\s+\/api\/domain-check\s*\{\s*return\s+404;\s*\}/.test(s8080))
  check('nginx.conf：容器 80 server 里没有拦 domain-check（隧道入口要能应答）', !/\/api\/domain-check\s*\{/.test(confCode.slice(0, confCode.indexOf('listen 8080'))))
  check('nginx.conf：不再把 X-Forwarded-Host 设成 $host（替换成置空）', !/proxy_set_header\s+X-Forwarded-Host\s+\$host/i.test(confCode) && /proxy_set_header\s+X-Forwarded-Host\s+"";/.test(confCode))
  const TEST_CH = 'chan-test.bigolab.com'
  const mkConf = (strict: boolean) => {
    // 注入一个 channel 测试 Host 和一个 closed 测试 Host（紧挨 lulu 那一行：lulu 是 channel 还是 closed 都能注入）
    let c = conf.replace(
      /(lulu\.bigolab\.com\s+(?:closed|channel);[^\n]*\n)/,
      `$1        ${TEST_CH}   channel;  # 仅本地测试注入\n        ${TEST_CLOSED}   closed;  # 仅本地测试注入\n`,
    )
    if (strict) c = c.replace(/map \$site_known \$site_kind\s*\{ default \$site_known; "" main; \}/, 'map $site_known $site_kind    { default $site_known; "" ""; }')
    return c
  }
  check('测试副本注入了 channel / closed 测试 Host', mkConf(false).includes(TEST_CH) && mkConf(false).includes(TEST_CLOSED))
  check('严格期副本改写成功（"" "";）', /"" "";/.test(mkConf(true)))
  const dir = mkdtempSync(path.join(tmpdir(), 'x8-ngx-'))
  const net = `x8net-${RUN}`
  const names = { up: `x8up-${RUN}`, ngx: `x8ngx-${RUN}` }
  const port = 18000 + Math.floor(Math.random() * 1000)
  // 容器 80（隧道入口）另映射一个本地端口：/api/domain-check 只在这条路上应答，8080（公网 IP 直连入口）一律 404（契约第 9 节）
  const port80 = port + 1000
  writeFileSync(path.join(dir, 'up.conf'), UPSTREAM_CONF)
  writeFileSync(path.join(dir, 'closed.html'), readFileSync(path.join(ROOT, 'nginx/closed.html')))
  const winDir = dir.replace(/\\/g, '/')
  try {
    docker(['network', 'create', net])
    docker(['run', '-d', '--name', names.up, '--network', net, '--network-alias', 'app', '-v', `${winDir}/up.conf:/etc/nginx/nginx.conf:ro`, 'nginx:alpine'])
    for (const strict of [false, true]) {
      writeFileSync(path.join(dir, 'nginx.conf'), mkConf(strict))
      const mounts = ['-v', `${winDir}/nginx.conf:/etc/nginx/nginx.conf:ro`, '-v', `${winDir}/closed.html:/usr/share/nginx/closed/closed.html:ro`, '-v', `${winDir}:/var/www/uploads:ro`]
      const t = docker(['run', '--rm', '--network', net, ...mounts, 'nginx:alpine', 'nginx', '-t'], { allowFail: true })
      check(`W8-8 nginx -t（${strict ? '严格期' : '观察期'}副本）`, /syntax is ok/.test(t) && /test is successful/.test(t), t.slice(-200))
      docker(['rm', '-f', names.ngx], { allowFail: true })
      docker(['run', '-d', '--name', names.ngx, '--network', net, '-p', `127.0.0.1:${port}:8080`, '-p', `127.0.0.1:${port80}:80`, ...mounts, 'nginx:alpine'])
      // 等 nginx 起来
      for (let i = 0; i < 40; i++) {
        const r = await ngxGet(port, MAIN_HOST, '/')
        if (!('error' in r)) break
        await new Promise((res) => setTimeout(res, 250))
      }
      await (strict ? ngxStrict(port) : ngxObserve(port, TEST_CH, names.ngx, port80))
    }
  } finally {
    docker(['rm', '-f', names.ngx, names.up], { allowFail: true })
    docker(['network', 'rm', net], { allowFail: true })
    rmSync(dir, { recursive: true, force: true })
  }
}

type NgxRes = { status: number; headers: http.IncomingHttpHeaders; text: string } | { error: string }
const up = (r: NgxRes) => !('error' in r) && r.status === 200 && r.text.startsWith('UPSTREAM|')
const st = (r: NgxRes) => ('error' in r ? `ERR ${r.error}` : `${r.status} ${r.text.slice(0, 40).replace(/\n/g, ' ')}`)

async function ngxObserve(port: number, CH: string, ngxName: string, port80: number) {
  // ① closed 的 Host（紧急下线口径）：只得到静态停业页，不进应用
  for (const p of ['/', '/products/1', '/api/products', '/partner', '/api/partner/dashboard', '/admin']) {
    const r = await ngxGet(port, TEST_CLOSED, p)
    check(`closed 测试 Host GET ${p} → 停业页`, !('error' in r) && r.status === 200 && r.text.includes('本站暂停访问') && !r.text.includes('UPSTREAM'), st(r))
  }
  // lulu（G1.5 起 channel）：进应用、带 noindex 头；/admin 仍在 nginx 层 404
  const lr = await ngxGet(port, 'lulu.bigolab.com', '/')
  check('lulu（channel）GET / → 进应用，且带 X-Robots-Tag: noindex, follow', up(lr) && (lr as { headers: http.IncomingHttpHeaders }).headers['x-robots-tag'] === 'noindex, follow', st(lr))
  const la = await ngxGet(port, 'lulu.bigolab.com', '/admin')
  check('lulu（channel）GET /admin → 404', !('error' in la) && la.status === 404 && !la.text.includes('UPSTREAM'), st(la))
  const direct = await ngxGet(port, MAIN_HOST, '/closed.html')
  check('主站直接访问 /closed.html → 不给（internal）', !('error' in direct) && direct.status === 404, st(direct))

  // ② 主站：照常进应用；/partner 404；不可信头被清洗；无 X-Robots-Tag
  const m1 = await ngxGet(port, MAIN_HOST, '/', 'GET', { 'x-forwarded-host': 'evil.example', 'x-middleware-subrequest': 'middleware', 'x-tenant-id': '2' })
  check('主站 / → 进应用', up(m1), st(m1))
  check('X-Forwarded-Host 不再下发给应用（客户端自带的也被丢掉）', up(m1) && (m1 as { text: string }).text.includes('|xfh=|'), st(m1))
  check('x-middleware-subrequest、x-tenant-id 被清空', up(m1) && (m1 as { text: string }).text.includes('|xms=|') && (m1 as { text: string }).text.includes('|xti=|'), st(m1))
  check('主站响应没有 X-Robots-Tag', !('error' in m1) && m1.headers['x-robots-tag'] === undefined)
  for (const p of ['/partner', '/partner/orders', '/api/partner/dashboard', '/api//partner/orders']) {
    const r = await ngxGet(port, MAIN_HOST, p)
    check(`主站 ${p} → 404`, !('error' in r) && r.status === 404, st(r))
  }
  const ma = await ngxGet(port, MAIN_HOST, '/api/admin/stats')
  check('主站 /api/admin/stats → 进应用（后台照常）', up(ma), st(ma))
  const mc = await ngxGet(port, MAIN_HOST, '/api/cron/news')
  check('/api/cron/* 外部入口一律 404（原有规则不变）', !('error' in mc) && mc.status === 404, st(mc))
  // 微信机器人协议服务的回调（docs/微信机器人-设计.md §11.3、附录 B 第 8 条）：只给 Docker 内网直连 app:3000，任何对外入口一律 404；
  // 与 /api/cron/ 同一种 ^~ 前缀写法，合并斜杠、百分号编码的写法也要命中
  for (const H of [MAIN_HOST, '39.96.0.1']) {
    for (const p of ['/api/bot/wxpad/hook/itest', '/api//bot/wxpad/hook/itest', '/api/%62ot/wxpad/hook/itest']) {
      const r = await ngxGet(port, H, p, 'POST', { 'content-type': 'application/json' })
      check(`${H} POST ${p} → 404、不进应用`, !('error' in r) && r.status === 404 && !r.text.includes('UPSTREAM'), st(r))
    }
  }
  const ip = await ngxGet(port, '39.96.0.1', '/api/products')
  check('观察期：服务器 IP 当主站进应用', up(ip), st(ip))

  // ③ channel：/admin 404、/api 白名单外 404、白名单内进应用、X-Robots-Tag
  for (const p of ['/admin', '/admin/orders', '/api/admin/stats', '/api//admin/stats', '/api/%61dmin/stats', '/api/../admin']) {
    const r = await ngxGet(port, CH, p)
    check(`渠道 ${p} → 404`, !('error' in r) && r.status === 404, st(r))
  }
  const c1 = await ngxGet(port, CH, '/')
  check('渠道 / → 进应用，且带 X-Robots-Tag: noindex, follow', up(c1) && (c1 as { headers: http.IncomingHttpHeaders }).headers['x-robots-tag'] === 'noindex, follow', st(c1))
  const cp = await ngxGet(port, CH, '/partner/orders')
  check('渠道 /partner/orders → 进应用', up(cp), st(cp))
  // 渠道快速回复页（docs/微信机器人-设计.md §5.5）：独立一级路径，渠道 Host（子域名与自定义域名）上必须照常进应用；接口那半在下面的白名单遍历里
  for (const H of [CH, CUSTOM_TEST]) {
    const r = await ngxGet(port, H, '/partner-reply/itest')
    check(`${H} /partner-reply/itest → 进应用`, up(r), st(r))
  }

  // 全部 /api 路由（从目录生成）按白名单期望逐条请求。子域名渠道与自定义域名渠道各遍历一遍：
  // 自定义域名同样只能碰到渠道白名单（短信接码、余额、充值等一律 404）
  const all = allApiRoutes()
  for (const [label, H] of [['渠道 Host', CH], ['自定义域名', CUSTOM_TEST]] as const) {
    const bad: string[] = []
    let passN = 0
    let denyN = 0
    for (const rel of all) {
      const url = '/api/' + rel.replace(/\[\.\.\.[^\]]+\]/g, 'x/y').replace(/\[[^\]]+\]/g, (m) => (/id\]$/i.test(m) ? '1' : 'itest'))
      const r = await ngxGet(port, H, url)
      // 这里走的是 8080（公网 IP 直连入口）：domain-check 在这个入口一律 404，隧道入口（容器 80）上的放行见下面单独的断言
      // GATED_OPEN_RE（track/view）：nginx 已放行，应用里由开关决定，所以这一层按放行核对
      const expectPass = (OPEN_RE.test(rel) || GATED_OPEN_RE.test(rel)) && !rel.startsWith('admin/') && !/^domain-check(\/|$)/.test(rel)
      const ok = expectPass ? up(r) : !('error' in r) && r.status === 404 && !r.text.includes('UPSTREAM')
      if (!ok) bad.push(`${url} 期望${expectPass ? '放行' : '404'}，实际 ${st(r)}`)
      else if (expectPass) passN++
      else denyN++
    }
    check(`${label} ${H} 遍历 ${all.length} 个 /api 路由：白名单内 ${passN} 个放行、其余 ${denyN} 个 404`, bad.length === 0, bad.slice(0, 10).join('；'))
  }
  const sms = await ngxGet(port, CH, '/api/pay/sms-notify', 'POST', { 'content-type': 'application/json' })
  check('渠道 Host POST /api/pay/sms-notify → 404（收款回调只走主站 Host）', !('error' in sms) && sms.status === 404, st(sms))
  const smsMain = await ngxGet(port, MAIN_HOST, '/api/pay/sms-notify', 'POST', { 'content-type': 'application/json' })
  check('主站 Host POST /api/pay/sms-notify → 进应用（收款回调不受影响）', up(smsMain), st(smsMain))

  // ④ 渠道自定义域名（docs/多渠道分销-自定义域名.md 第 5 节）：形如域名的 Host → channel，与 *.bigolab.com 子域名同一套防护
  for (const H of [CUSTOM_TEST, `www.${CUSTOM_TEST}`, 'xn--fiqs8s.xn--fiqz9s', `x8-${RUN}.example`]) {
    for (const p of ['/admin', '/admin/tenants', '/api/admin/stats', '/api//admin/stats', '/api/account/wallet', '/api/wallet/topup', '/api/jiema/catalog', '/api/jiema/orders']) {
      const r = await ngxGet(port, H, p)
      check(`自定义域名 ${H} ${p} → 404`, !('error' in r) && r.status === 404 && !r.text.includes('UPSTREAM'), st(r))
    }
    const r1 = await ngxGet(port, H, '/')
    check(`自定义域名 ${H} / → 进应用，且带 X-Robots-Tag: noindex, follow`, up(r1) && (r1 as { headers: http.IncomingHttpHeaders }).headers['x-robots-tag'] === 'noindex, follow', st(r1))
    const r2 = await ngxGet(port, H, '/partner/login')
    check(`自定义域名 ${H} /partner/login → 进应用`, up(r2), st(r2))
    const r3 = await ngxGet(port, H, '/api/products')
    check(`自定义域名 ${H} /api/products（白名单内）→ 进应用`, up(r3), st(r3))
    // 平台经公网校验自定义域名的应答端（契约第 9 节）：隧道入口（容器 80）必须能穿过渠道白名单到应用，否则设主域名与 cron 复验永远失败；
    // 公网 IP 直连入口（8080）一律 404：客户把域名 A 记录直接指到服务器 IP、绕开站长的 Cloudflare，校验不能通过
    const r4 = await ngxGet(port80, H, '/api/domain-check?n=itestNonce0123456789')
    check(`自定义域名 ${H} /api/domain-check 经容器 80（隧道入口）→ 进应用`, up(r4), st(r4))
    const r5 = await ngxGet(port, H, '/api/domain-check?n=itestNonce0123456789')
    check(`自定义域名 ${H} /api/domain-check 经 8080（公网 IP 直连）→ 404、不进应用`, !('error' in r5) && r5.status === 404 && !r5.text.includes('UPSTREAM'), st(r5))
  }
  // 8080 上 domain-check 不论 Host、不论路径写法一律 404；容器 80 上子域名渠道照常放行、主站照常进应用（应用自己回 404）
  for (const H of [MAIN_HOST, CH, 'lulu.bigolab.com', '39.96.0.1', CUSTOM_TEST]) {
    for (const p of ['/api/domain-check?n=itestNonce0123456789', '/api//domain-check?n=itestNonce0123456789', '/api/%64omain-check?n=itestNonce0123456789', '/api/domain-check/']) {
      const r = await ngxGet(port, H, p)
      check(`8080：${H} ${p.split('?')[0]} → 404、不进应用`, !('error' in r) && r.status === 404 && !r.text.includes('UPSTREAM'), st(r))
    }
  }
  const d80 = await ngxGet(port80, CH, '/api/domain-check?n=itestNonce0123456789')
  check('容器 80：子域名渠道 /api/domain-check → 进应用', up(d80), st(d80))
  const d80m = await ngxGet(port80, MAIN_HOST, '/api/domain-check?n=itestNonce0123456789')
  check('容器 80：主站 /api/domain-check → 进应用（主站不在白名单约束内，由应用回 404）', up(d80m), st(d80m))
  // 不变的部分：IP、localhost 仍是 main（/partner 404、无 noindex）；bigolab.com 多级子域仍走 default（观察期当主站）
  for (const H of ['39.96.0.1', 'localhost', 'a.b.bigolab.com']) {
    const r = await ngxGet(port, H, '/')
    check(`${H} / → 当主站进应用、无 X-Robots-Tag`, up(r) && (r as { headers: http.IncomingHttpHeaders }).headers['x-robots-tag'] === undefined, st(r))
    const rp = await ngxGet(port, H, '/partner/login')
    check(`${H} /partner/login → 404（主站口径）`, !('error' in rp) && rp.status === 404, st(rp))
  }

  // ⑤ 观察期未知 Host（map 没命中：不含点的 Host、IP、bigolab.com 多级子域）：当主站 + 记日志。
  // 2026-09-30 起形如域名的陌生 Host 已按 channel 处理（见上），所以这里改用不含点的 Host
  const unk = `x8-unknown-${RUN}`
  const u1 = await ngxGet(port, unk, '/')
  check('观察期未知 Host → 当主站进应用', up(u1), st(u1))
  await new Promise((res) => setTimeout(res, 300))
  // nginx:alpine 里 access.log 是指向 /dev/stdout 的软链（tail 它会一直阻塞），全量日志从 docker logs 看；unknown_host.log 是普通文件
  const unkLog = docker(['exec', ngxName, 'cat', '/var/log/nginx/unknown_host.log'], { allowFail: true })
  // tail 取 300：前面遍历路由与自定义域名的请求很多，50 行不够覆盖到主站那几条（2026-09-30 加 domain-check 用例后溢出）
  const allLog = docker(['logs', '--tail', '300', ngxName], { allowFail: true })
  check('未知 Host 记进 unknown_host.log', unkLog.includes(`host="${unk}"`), unkLog.slice(0, 200))
  check('全量 access.log 仍在写（server 级 access_log 没把它顶掉）', allLog.includes(`host="${unk}"`) && allLog.includes('host="bigolab.com"'), allLog.slice(-300))
  check('已登记 Host 不进 unknown_host.log', !unkLog.includes('host="bigolab.com"'))
}

async function ngxStrict(port: number) {
  const u = await ngxGet(port, `x8-strict-${RUN}`, '/')
  check('严格期未知 Host（不含点）→ 444（连接直接断开，无响应）', 'error' in u, st(u))
  const mb = await ngxGet(port, 'a.b.bigolab.com', '/')
  check('严格期 bigolab.com 多级子域 → 444（不被自定义域名正则吞掉）', 'error' in mb, st(mb))
  const cu = await ngxGet(port, CUSTOM_TEST, '/')
  check('严格期自定义域名照常按 channel 进应用（map 已命中，不是未知 Host）', up(cu), st(cu))
  const ip = await ngxGet(port, '39.96.0.1', '/')
  check('严格期服务器 IP → 444（切严格期前把要用的 Host 都登记进 map）', 'error' in ip, st(ip))
  const m = await ngxGet(port, MAIN_HOST, '/')
  check('严格期主站照常', up(m), st(m))
}

main().catch(async (e) => {
  console.error(e)
  try {
    setChannelsMode('dormant')
    await cleanupX8()
    await cleanupAll()
  } catch {
    /* 尽力清理 */
  }
  process.exit(1)
})
