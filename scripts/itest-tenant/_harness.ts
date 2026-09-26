/**
 * 渠道分站集成测试的公共夹具与客户端（WP0 独占；各包的 scripts/itest-tenant/wpN.ts 与 WP8 的 cross-tenant.ts 共用）。
 *
 * 【两种跑法】
 *  1. 进程内（不起 Next 服务）：withRequest / callRoute 用 Next 自己的 requestAsyncStorage 造一个请求作用域，
 *     让 headers() / cookies() / getStorefront() / getCurrentUser() / partnerRoute 在 tsx 里直接跑。
 *     本阶段多包并行、禁止 next dev，WP0 的 itest 全部走这条路。
 *  2. HTTP（本地起了应用之后）：http(host, method, path, …) 用 node:http 显式设 Host 头直连 ITEST_BASE（默认 http://127.0.0.1:3000），
 *     不经 nginx（设计 6.6）。这时 JWT_SECRET、CARDKEY_SECRET 必须与应用进程一致（从同一个 .env.local 带进来）。
 *
 * 【库名门禁】DATABASE_URL 的库名不含 dev / test 拒绝运行（照抄 scripts/seed-local-demo.ts）。
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp0.ts
 *
 * 【测试数据可识别、跑完清理】用户邮箱 `…@itest-tenant.local`，租户 name 以 `ITEST` 开头、code 以 `it` 开头，
 * 商品 / 分类名以 `ITEST-TENANT` 开头。cleanupAll() 按这些前缀删干净（含上一次中途崩掉留下的）。
 *
 * 【夹具世界 createWorld()】与设计 6.6 一致：三个租户 main(1)、lulu、zz；每渠道一个 OWNER、两个买家；一个 SA；
 * 一个同时在 lulu 与主站下过单的买家；一个 lulu 注册但只在主站下单的买家；一个只在 lulu 登录、从未下单的主站老用户；
 * 卡 cost 107.13、进货价 11037 分、接码 SmsActivation.cost 3.17 这些特征值；一条 COST 基准的 listing；
 * 一张人工交付单（deliveryInfo 含特征串）与一张接码单。订单直接用 prisma 造（测试夹具，不走 createShopOrder）。
 */
import { randomBytes, randomUUID } from 'crypto'
import http from 'node:http'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Prisma, PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'
import { NextRequest } from 'next/server'

// Next 的服务端运行时启动时会把 AsyncLocalStorage 挂到 globalThis（next/dist/server/node-environment），
// headers() / cookies() 依赖的 requestAsyncStorage 在模块加载时读它。tsx 里没有这一步，这里补上；
// 所以 Next 的内部模块一律在这之后才加载（下面用 require 懒加载，不写成顶层 import）。
const g = globalThis as unknown as { AsyncLocalStorage?: unknown }
if (!g.AsyncLocalStorage) g.AsyncLocalStorage = AsyncLocalStorage

type NextInternals = {
  requestAsyncStorage: { run<T>(store: unknown, fn: () => T): T }
  RequestCookies: new (h: Headers) => unknown
}
let internals: NextInternals | null = null
function nextInternals(): NextInternals {
  if (!internals) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ras = require('next/dist/client/components/request-async-storage.external')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ck = require('next/dist/server/web/spec-extension/cookies')
    internals = { requestAsyncStorage: ras.requestAsyncStorage, RequestCookies: ck.RequestCookies }
  }
  return internals
}

// ---------------------------------------------------------------------------
// 门禁与环境
// ---------------------------------------------------------------------------
const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName || '(未设置 DATABASE_URL)'}」看起来不是一次性开发库（库名须含 dev 或 test）`)
  process.exit(2)
}
// 进程内跑法需要这两个密钥；HTTP 跑法请从外部传入与应用一致的值
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'itest-tenant-jwt-secret-0123456789abcdef-local'
if (!process.env.CARDKEY_SECRET) process.env.CARDKEY_SECRET = 'itest-tenant-cardkey-secret'
// 渠道收款账号 / webhook 的数据密钥（主会话 D8：与 JWT_SECRET 解耦，tenant/crypto 只读它）；测试固定一把 32 字节 hex
if (!process.env.TENANT_DATA_KEY) process.env.TENANT_DATA_KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90'

export const prisma = new PrismaClient()
export const RUN = Date.now().toString(36)
export const MAIL_DOMAIN = '@itest-tenant.local'
export const NAME_PREFIX = 'ITEST-TENANT'
export const TEST_PASSWORD = 'Test123456'
/** 设计 6.6 的特征值：在任何渠道响应里出现即泄露 */
export const MARK = Object.freeze({
  cardCost: '107.13',
  supplyCents: 11037,
  smsCost: '3.17',
  costBaseCents: 10713,
  deliveryInfo: `ITEST-DELIVERY-SECRET-${RUN}`,
  smsCode: '731946',
  cardPlain: `ITEST-CARD-${RUN}`,
})

export const mail = (name: string) => `${name}-${RUN}${MAIL_DOMAIN}`

// ---------------------------------------------------------------------------
// 断言
// ---------------------------------------------------------------------------
let pass = 0
let fail = 0
export function check(name: string, cond: boolean, extra = ''): boolean {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
  return cond
}
export function section(title: string): void {
  console.log(`\n· ${title}`)
}
export function summary(): { pass: number; fail: number } {
  console.log(`\n${fail === 0 ? '✅' : '❌'} 通过 ${pass}，失败 ${fail}`)
  return { pass, fail }
}

// ---------------------------------------------------------------------------
// 环境开关（进程内跑法）：休眠 / 观察 / 严格
// ---------------------------------------------------------------------------
export function setChannelsMode(mode: 'dormant' | 'observe' | 'strict'): void {
  if (mode === 'dormant') delete process.env.CHANNELS_ENABLED
  else process.env.CHANNELS_ENABLED = '1'
  if (mode === 'strict') process.env.HOST_STRICT = '1'
  else delete process.env.HOST_STRICT
}

// ---------------------------------------------------------------------------
// JWT：签发与应用同形的 token（带 aud / tid，WP1 上线按店面校验后同样可用；sv 与 ep 都写，兼容前后两版）
// ---------------------------------------------------------------------------
export function signTestToken(u: { id: number; email: string | null; role: string; sessionEpoch?: number }, aud = 'main', tid?: number): string {
  const secret = process.env.JWT_SECRET as string
  const ep = u.sessionEpoch ?? 0
  return jwt.sign({ userId: u.id, email: u.email ?? '', role: u.role, sv: ep, ep, aud, ...(tid ? { tid } : {}) }, secret, { expiresIn: '1h' })
}

// ---------------------------------------------------------------------------
// 进程内请求作用域
// ---------------------------------------------------------------------------
export interface ReqOpts {
  host: string
  token?: string | null
  /** true = token 放 Authorization: Bearer；默认放 cookie token= */
  bearer?: boolean
  headers?: Record<string, string>
}

function buildHeaders(o: ReqOpts): Headers {
  const h = new Headers()
  h.set('host', o.host)
  for (const [k, v] of Object.entries(o.headers || {})) h.set(k, v)
  if (o.token) {
    if (o.bearer) h.set('authorization', `Bearer ${o.token}`)
    else h.set('cookie', `token=${o.token}`)
  }
  return h
}

/** 在一个假的 Next 请求作用域里执行 fn：headers() / cookies() 返回 o 描述的请求头 */
export function withRequest<T>(o: ReqOpts, fn: () => Promise<T>, prebuilt?: Headers): Promise<T> {
  const h = prebuilt ?? buildHeaders(o)
  const { requestAsyncStorage, RequestCookies } = nextInternals()
  const cookies = new RequestCookies(h)
  const store = {
    headers: h,
    cookies,
    mutableCookies: cookies,
    draftMode: { isEnabled: false },
    reactLoadableManifest: {},
    assetPrefix: '',
    isHmrRefresh: false,
  }
  return requestAsyncStorage.run(store as never, fn)
}

export type RouteFn = (req: NextRequest, c: { params: Record<string, string> }) => Promise<Response>

/** 在进程内调用一个 route handler（partnerRoute(...) 的返回值、或任意 (req, ctx) => Response 的函数） */
export async function callRoute(
  route: RouteFn,
  o: ReqOpts & { method?: string; path?: string; body?: unknown; params?: Record<string, string> },
): Promise<{ status: number; json: any; text: string }> {
  const method = (o.method || 'GET').toUpperCase()
  const h = buildHeaders(o)
  let body: string | undefined
  if (o.body !== undefined) {
    body = typeof o.body === 'string' ? o.body : JSON.stringify(o.body)
    if (!h.has('content-type')) h.set('content-type', 'application/json')
    h.set('content-length', String(Buffer.byteLength(body)))
  }
  const req = new NextRequest(`http://${o.host}${o.path || '/api/partner/itest'}`, { method, headers: h, body })
  const res = await withRequest(o, () => route(req, { params: o.params || {} }), h)
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, json, text }
}

/** 把 notFound() / redirect() 这类 Next 控制流异常翻译成结果（页面守卫测试用） */
export async function catchNext<T>(fn: () => Promise<T>): Promise<{ kind: 'ok'; value: T } | { kind: 'notFound' } | { kind: 'redirect'; location: string } | { kind: 'error'; error: unknown }> {
  try {
    return { kind: 'ok', value: await fn() }
  } catch (e) {
    const d = (e as { digest?: unknown })?.digest
    if (d === 'NEXT_NOT_FOUND') return { kind: 'notFound' }
    if (typeof d === 'string' && d.startsWith('NEXT_REDIRECT')) return { kind: 'redirect', location: d.split(';')[2] || '' }
    return { kind: 'error', error: e }
  }
}

// ---------------------------------------------------------------------------
// HTTP 客户端（应用已启动时用；显式 Host 头直连）
// ---------------------------------------------------------------------------
export const ITEST_BASE = process.env.ITEST_BASE || 'http://127.0.0.1:3000'

export function httpCall(
  host: string,
  method: string,
  path: string,
  opts: { token?: string | null; bearer?: boolean; body?: unknown; headers?: Record<string, string> } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string; json: any }> {
  const base = new URL(ITEST_BASE)
  const headers: Record<string, string> = { host, ...(opts.headers || {}) }
  let payload: string | undefined
  if (opts.body !== undefined) {
    payload = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)
    if (!headers['content-type']) headers['content-type'] = 'application/json'
    headers['content-length'] = String(Buffer.byteLength(payload))
  }
  if (opts.token) {
    if (opts.bearer) headers.authorization = `Bearer ${opts.token}`
    else headers.cookie = `token=${opts.token}`
  }
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: base.hostname, port: base.port || 80, path, method, headers }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let json: any = null
        try {
          json = JSON.parse(text)
        } catch {
          /* 非 JSON */
        }
        resolve({ status: res.statusCode || 0, headers: res.headers, text, json })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/** 递归收集 JSON 里的全部键（带父键路径），给 T10 键名扫描用 */
export function collectKeys(v: unknown, parent = '', out: { key: string; parent: string }[] = []): { key: string; parent: string }[] {
  if (Array.isArray(v)) v.forEach((x) => collectKeys(x, parent, out))
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      out.push({ key: k, parent })
      collectKeys(x, k, out)
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// 夹具
// ---------------------------------------------------------------------------
export interface WorldUser {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
  sessionEpoch: number
}
export interface WorldTenant {
  id: number
  code: string
  host: string
  origin: string
}
export interface World {
  run: string
  main: WorldTenant
  lulu: WorldTenant
  zz: WorldTenant
  users: {
    sa: WorldUser
    luluOwner: WorldUser
    zzOwner: WorldUser
    luluBuyer1: WorldUser
    luluBuyer2: WorldUser
    zzBuyer1: WorldUser
    zzBuyer2: WorldUser
    crossBuyer: WorldUser
    luluRegMainOrder: WorldUser
    mainOldLoginLulu: WorldUser
  }
  products: { auto: number; manual: number; sms: number }
  listings: { luluAuto: string; luluManual: string; luluSms: string; zzAuto: string }
  orders: {
    luluAuto: { id: number; orderNo: string }
    luluManual: { id: number; orderNo: string }
    luluSms: { id: number; orderNo: string }
    crossLulu: { id: number; orderNo: string }
    crossMain: { id: number; orderNo: string }
    regMainOrder: { id: number; orderNo: string }
    zzAuto: { id: number; orderNo: string }
  }
  customers: { luluBuyer1: string; luluRegMainOrder: string; zzBuyer1: string }
  /** 为某个用户在某个店面签 token（aud = 店面 code） */
  token(u: WorldUser, t?: WorldTenant): string
}

let orderSeq = 0
function orderNo(): string {
  orderSeq++
  return `IT${RUN.toUpperCase()}${String(orderSeq).padStart(3, '0')}`.slice(0, 32)
}
function publicNo(): string {
  const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let s = ''
  const b = randomBytes(12)
  for (let i = 0; i < 12; i++) s += A[b[i] & 31]
  return s
}

/** 主站租户行（id=1）。WP8 的种子 SQL 会写同一行；这里保证开发库里有它 */
export async function ensurePlatformTenant(): Promise<void> {
  await prisma.$executeRaw`INSERT INTO tenants (id, code, kind, name, status, origin, fee_rate_bp, invoice_share_rate_bp, hold_days,
    min_payout_cents, request_interval_days, payout_hold, pending_order_cap, max_order_qty, require_partner_invoice, created_at, updated_at)
    VALUES (1, 'main', 'PLATFORM', '主站', 'ACTIVE', 'https://bigolab.com', 0, 0, 0, 0, 0, 0, 1000000, 999, 0, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE id = id`
}

export async function createTenant(kind: 'l' | 'z' | 'x', opt: { status?: string } = {}): Promise<WorldTenant> {
  const code = `it${kind}${RUN}`.slice(0, 20)
  const host = `${code}.bigolab.com`
  const origin = `https://${host}`
  const t = await prisma.tenant.create({
    data: {
      code,
      kind: 'CHANNEL',
      name: `${NAME_PREFIX}-${kind}`,
      status: opt.status ?? 'ACTIVE',
      origin,
      holdDays: 7,
      minPayoutCents: 2000,
    },
  })
  await prisma.tenantDomain.create({ data: { tenantId: t.id, host, isPrimary: true, status: 1 } })
  return { id: t.id, code, host, origin }
}

export async function createUser(name: string, opt: { role?: 'USER' | 'ADMIN'; registeredTenantId?: number } = {}): Promise<WorldUser> {
  const u = await prisma.user.create({
    data: {
      email: mail(name),
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
      nickname: `it-${name}`,
      role: opt.role ?? 'USER',
      registeredTenantId: opt.registeredTenantId ?? 1,
      emailVerifiedAt: new Date(),
    },
  })
  return { id: u.id, email: u.email as string, role: u.role as 'USER' | 'ADMIN', sessionEpoch: u.sessionEpoch }
}

async function createOrder(a: {
  tenantId: number
  userId: number
  productId: number
  productName: string
  priceCents: number
  qty?: number
  listingId?: number | null
  supplyUnitCents?: number | null
  deliveryInfo?: string | null
  paid?: boolean
}): Promise<{ id: number; orderNo: string }> {
  const qty = a.qty ?? 1
  const amount = new Prisma.Decimal(((a.priceCents * qty) / 100).toFixed(2))
  const channel = a.tenantId >= 2
  const o = await prisma.order.create({
    data: {
      orderNo: orderNo(),
      userId: a.userId,
      productId: a.productId,
      productName: a.productName,
      productPrice: new Prisma.Decimal((a.priceCents / 100).toFixed(2)),
      quantity: qty,
      amount,
      payMethod: a.paid === false ? null : 'ALIPAY',
      payStatus: a.paid === false ? 'UNPAID' : 'PAID',
      deliveryStatus: a.paid === false ? 'PENDING' : 'DELIVERED',
      paidAt: a.paid === false ? null : new Date(),
      deliveredAt: a.paid === false ? null : new Date(),
      deliveryInfo: a.deliveryInfo ?? null,
      remark: '买家备注 itest',
      buyerRemark: '买家备注 itest',
      tenantId: a.tenantId,
      ...(channel
        ? {
            listingId: a.listingId ?? null,
            supplyUnitPrice: new Prisma.Decimal(((a.supplyUnitCents ?? MARK.supplyCents) / 100).toFixed(2)),
            supplyCents: (a.supplyUnitCents ?? MARK.supplyCents) * qty,
            feeRateBp: 150,
            invoiceShareRateBp: 200,
            settleHoldDays: 7,
            mainPriceAtOrder: new Prisma.Decimal('129.00'),
          }
        : {}),
    },
    select: { id: true, orderNo: true },
  })
  if (a.paid !== false) {
    await prisma.payment.create({ data: { orderId: o.id, payMethod: 'ALIPAY', amount, status: 1, tradeNo: `IT-${o.orderNo}` } })
  }
  return o
}

async function ensureCustomer(tenantId: number, userId: number, via: 'REGISTER' | 'ORDER'): Promise<string> {
  const no = publicNo()
  await prisma.tenantCustomer.createMany({
    data: [{ publicNo: no, tenantId, userId, joinedVia: via, firstOrderAt: via === 'ORDER' ? new Date() : null, lastOrderAt: via === 'ORDER' ? new Date() : null }],
    skipDuplicates: true,
  })
  const c = await prisma.tenantCustomer.findUniqueOrThrow({ where: { tenantId_userId: { tenantId, userId } }, select: { publicNo: true } })
  return c.publicNo
}

export async function createWorld(): Promise<World> {
  await ensurePlatformTenant()
  const main: WorldTenant = { id: 1, code: 'main', host: 'bigolab.com', origin: 'https://bigolab.com' }
  const lulu = await createTenant('l')
  const zz = await createTenant('z')

  const users = {
    sa: await createUser('sa', { role: 'ADMIN' }),
    luluOwner: await createUser('lulu-owner', { registeredTenantId: lulu.id }),
    zzOwner: await createUser('zz-owner', { registeredTenantId: zz.id }),
    luluBuyer1: await createUser('lulu-buyer1', { registeredTenantId: lulu.id }),
    luluBuyer2: await createUser('lulu-buyer2', { registeredTenantId: lulu.id }),
    zzBuyer1: await createUser('zz-buyer1', { registeredTenantId: zz.id }),
    zzBuyer2: await createUser('zz-buyer2', { registeredTenantId: zz.id }),
    crossBuyer: await createUser('cross-buyer'),
    luluRegMainOrder: await createUser('lulu-reg-main-order', { registeredTenantId: lulu.id }),
    mainOldLoginLulu: await createUser('main-old-login-lulu'),
  }
  await prisma.tenantMember.createMany({
    data: [
      { tenantId: lulu.id, userId: users.luluOwner.id, role: 'OWNER', status: 1 },
      { tenantId: zz.id, userId: users.zzOwner.id, role: 'OWNER', status: 1 },
    ],
  })

  const cat = await prisma.category.create({ data: { name: `${NAME_PREFIX}-${RUN}`, sortOrder: 999 } })
  const mk = (name: string, deliveryType: string, price: string) =>
    prisma.product.create({
      data: { categoryId: cat.id, name: `${NAME_PREFIX} ${name} ${RUN}`, price: new Prisma.Decimal(price), deliveryType, stock: -1, status: 1 },
    })
  const pAuto = await mk('卡密', 'AUTO', '129.00')
  const pManual = await mk('人工', 'MANUAL', '129.00')
  const pSms = await mk('接码', 'SMS', '15.00')

  const listing = async (tenantId: number, productId: number, extra: Partial<Prisma.TenantListingUncheckedCreateInput> = {}) =>
    prisma.tenantListing.create({
      data: { publicNo: publicNo(), tenantId, productId, granted: true, supplyCents: MARK.supplyCents, retailCents: 14000, status: 1, ...extra },
      select: { id: true, publicNo: true },
    })
  const lAuto = await listing(lulu.id, pAuto.id, { supplyBaseKind: 'COST', supplyBaseCents: MARK.costBaseCents })
  const lManual = await listing(lulu.id, pManual.id)
  const lSms = await listing(lulu.id, pSms.id, { supplyCents: 1000, retailCents: 1500 })
  const zAuto = await listing(zz.id, pAuto.id, { supplyCents: 11500, retailCents: 14500 })

  // 订单
  const oLuluAuto = await createOrder({ tenantId: lulu.id, userId: users.luluBuyer1.id, productId: pAuto.id, productName: pAuto.name, priceCents: 14000, listingId: lAuto.id })
  const oLuluManual = await createOrder({
    tenantId: lulu.id,
    userId: users.luluBuyer2.id,
    productId: pManual.id,
    productName: pManual.name,
    priceCents: 14000,
    listingId: lManual.id,
    deliveryInfo: MARK.deliveryInfo,
  })
  const oLuluSms = await createOrder({ tenantId: lulu.id, userId: users.luluBuyer1.id, productId: pSms.id, productName: pSms.name, priceCents: 1500, listingId: lSms.id, supplyUnitCents: 1000 })
  const oCrossLulu = await createOrder({ tenantId: lulu.id, userId: users.crossBuyer.id, productId: pAuto.id, productName: pAuto.name, priceCents: 14000, listingId: lAuto.id })
  const oCrossMain = await createOrder({ tenantId: 1, userId: users.crossBuyer.id, productId: pAuto.id, productName: pAuto.name, priceCents: 12900 })
  const oRegMain = await createOrder({ tenantId: 1, userId: users.luluRegMainOrder.id, productId: pAuto.id, productName: pAuto.name, priceCents: 12900 })
  const oZz = await createOrder({ tenantId: zz.id, userId: users.zzBuyer1.id, productId: pAuto.id, productName: pAuto.name, priceCents: 14500, listingId: zAuto.id, supplyUnitCents: 11500 })

  // 已售卡（cost 107.13 特征值）+ 一张未售卡；兑换日志带 ip / requestId（渠道侧不得出现）
  const { encryptCardContent, cardContentHash } = await import('../../src/lib/cardkey')
  const soldPlain = MARK.cardPlain
  const sold = await prisma.cardKey.create({
    data: {
      productId: pAuto.id,
      content: encryptCardContent(soldPlain),
      contentHash: cardContentHash(soldPlain),
      status: 'USED',
      orderId: oLuluAuto.id,
      usedAt: new Date(),
      cost: new Prisma.Decimal(MARK.cardCost),
      soldPrice: new Prisma.Decimal('110.37'),
      profit: new Prisma.Decimal('3.24'),
      redeemProvider: 'sysa',
      batch: `IT-${RUN}`,
    },
  })
  const unsoldPlain = `ITEST-UNSOLD-${RUN}`
  await prisma.cardKey.create({
    data: { productId: pAuto.id, content: encryptCardContent(unsoldPlain), contentHash: cardContentHash(unsoldPlain), status: 'UNUSED', cost: new Prisma.Decimal(MARK.cardCost), batch: `IT-${RUN}` },
  })
  await prisma.redeemLog.create({
    data: { cardKeyId: sold.id, provider: 'sysa', action: 'CHECK', state: 'OK', message: 'itest', requestId: `IT-REQ-${RUN}`, orderRef: `IT-REF-${RUN}`, ip: '10.9.8.7' },
  })
  // 接码（cost 3.17 特征值）
  await prisma.smsActivation.create({
    data: {
      orderId: oLuluSms.id,
      activationId: `IT-ACT-${RUN}`,
      phone: '+1 555 0100',
      service: 'OpenAI',
      country: 'US',
      status: 'CODE',
      code: MARK.smsCode,
      cost: new Prisma.Decimal(MARK.smsCost),
      raw: 'itest-raw',
      numberAt: new Date(),
      codeAt: new Date(),
      expireAt: new Date(Date.now() + 20 * 60_000),
    },
  })
  // 留言
  await prisma.orderMessage.create({ data: { orderId: oLuluAuto.id, sender: 'BUYER', content: 'itest 买家留言' } })
  // 发票与收据（渠道单：tenantId = lulu、shopOrderId 指回订单）
  await prisma.invoice.create({
    data: {
      invoiceNo: `ITI${RUN}`.toUpperCase().slice(0, 32),
      claudeAccount: users.luluBuyer1.email,
      subscriptionType: 'itest',
      sellingPrice: new Prisma.Decimal('140.00'),
      invoiceAmount: new Prisma.Decimal('148.40'),
      taxFee: new Prisma.Decimal('8.40'),
      title: 'ITEST 抬头',
      phone: '010-00000000',
      status: 'SUBMITTED',
      payStatus: 'PAID',
      tenantId: lulu.id,
      shopOrderId: oLuluAuto.id,
    },
  })
  await prisma.receipt.create({
    data: {
      receiptNo: `ITR${RUN}`.toUpperCase().slice(0, 32),
      token: `itest-${randomUUID()}`,
      payerTitle: 'ITEST 付款人',
      payee: '必高科技',
      amount: new Prisma.Decimal('140.00'),
      tenantId: lulu.id,
      shopOrderId: oLuluAuto.id,
    },
  })

  // 客户关系：lulu 的买家（下过单）、lulu 注册只在主站下单的（REGISTER）、zz 的买家；主站老用户只在 lulu 登录过 → 无行
  const cLuluBuyer1 = await ensureCustomer(lulu.id, users.luluBuyer1.id, 'ORDER')
  await ensureCustomer(lulu.id, users.luluBuyer2.id, 'ORDER')
  await ensureCustomer(lulu.id, users.crossBuyer.id, 'ORDER')
  const cReg = await ensureCustomer(lulu.id, users.luluRegMainOrder.id, 'REGISTER')
  await ensureCustomer(lulu.id, users.luluOwner.id, 'REGISTER')
  const cZz = await ensureCustomer(zz.id, users.zzBuyer1.id, 'ORDER')
  await ensureCustomer(zz.id, users.zzOwner.id, 'REGISTER')

  const world: World = {
    run: RUN,
    main,
    lulu,
    zz,
    users,
    products: { auto: pAuto.id, manual: pManual.id, sms: pSms.id },
    listings: { luluAuto: lAuto.publicNo, luluManual: lManual.publicNo, luluSms: lSms.publicNo, zzAuto: zAuto.publicNo },
    orders: {
      luluAuto: oLuluAuto,
      luluManual: oLuluManual,
      luluSms: oLuluSms,
      crossLulu: oCrossLulu,
      crossMain: oCrossMain,
      regMainOrder: oRegMain,
      zzAuto: oZz,
    },
    customers: { luluBuyer1: cLuluBuyer1, luluRegMainOrder: cReg, zzBuyer1: cZz },
    token: (u, t = main) => signTestToken(u, t.code, t.id === 1 ? undefined : t.id),
  }
  return world
}

/**
 * 删掉全部测试数据（按前缀，含以前中途崩掉的残留）。各包的 itest 在 finally 里调用。
 * 顺序：先删引用方（审计、通知、账本、客户关系、成员、上架、卡密、订单附属），再删订单、商品、用户、租户。
 */
export async function cleanupAll(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { name: { startsWith: 'ITEST' } }, select: { id: true } })
  const tIds = tenants.map((t) => t.id).filter((id) => id !== 1)
  const users = await prisma.user.findMany({ where: { email: { endsWith: MAIL_DOMAIN } }, select: { id: true } })
  const uIds = users.map((u) => u.id)
  const products = await prisma.product.findMany({ where: { name: { startsWith: NAME_PREFIX } }, select: { id: true } })
  const pIds = products.map((p) => p.id)
  const orders = await prisma.order.findMany({ where: { OR: [{ userId: { in: uIds } }, { tenantId: { in: tIds } }, { productId: { in: pIds } }] }, select: { id: true } })
  const oIds = orders.map((o) => o.id)
  const cards = await prisma.cardKey.findMany({ where: { productId: { in: pIds } }, select: { id: true } })
  const cIds = cards.map((c) => c.id)
  const stmts = await prisma.tenantStatement.findMany({ where: { tenantId: { in: tIds } }, select: { id: true } })
  const sIds = stmts.map((s) => s.id)

  await prisma.auditEvent.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { actorUserId: { in: uIds } }] } })
  await prisma.tenantNotice.deleteMany({ where: { tenantId: { in: tIds } } })
  await prisma.tenantAfterSale.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { orderId: { in: oIds } }] } })
  await prisma.tenantStatementLine.deleteMany({ where: { statementId: { in: sIds } } })
  await prisma.tenantPayout.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { statementId: { in: sIds } }] } })
  await prisma.tenantStatement.deleteMany({ where: { id: { in: sIds } } })
  await prisma.tenantLedgerEntry.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { orderId: { in: oIds } }] } })
  await prisma.tenantCustomer.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
  await prisma.tenantMember.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
  await prisma.tenantInvite.deleteMany({ where: { tenantId: { in: tIds } } })
  await prisma.tenantListing.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { productId: { in: pIds } }] } })
  await prisma.tenantDomain.deleteMany({ where: { tenantId: { in: tIds } } })
  await prisma.redeemLog.deleteMany({ where: { cardKeyId: { in: cIds } } })
  await prisma.cardKey.deleteMany({ where: { id: { in: cIds } } })
  await prisma.smsActivation.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.orderMessage.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.payment.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.invoice.deleteMany({ where: { OR: [{ shopOrderId: { in: oIds } }, { invoiceNo: { startsWith: 'ITI' }, claudeAccount: { endsWith: MAIL_DOMAIN } }] } })
  await prisma.receipt.deleteMany({ where: { OR: [{ shopOrderId: { in: oIds } }, { payerTitle: 'ITEST 付款人' }] } })
  await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.order.deleteMany({ where: { id: { in: oIds } } })
  await prisma.product.deleteMany({ where: { id: { in: pIds } } })
  await prisma.category.deleteMany({ where: { name: { startsWith: NAME_PREFIX } } })
  await prisma.user.deleteMany({ where: { id: { in: uIds } } })
  await prisma.tenant.deleteMany({ where: { id: { in: tIds } } })
}
