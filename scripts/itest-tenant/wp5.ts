/**
 * WP5 集成测试（超管：渠道管理与结算后台）：进程内直接调 src/app/api/admin/** 的 route handler（不起 Next 服务），连一次性开发库。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp5.ts
 *
 * 覆盖实施分包 8.5：
 *   W5-1  新建渠道 → 域名（拒绝 bigolab.com、evil.com、多级子域、他站已占用）→ 邀请 OWNER → 在该站接受；
 *         邮箱不符、过期、已用、吊销、lulu 的邀请在 zz 的 Host 上接受（T22）、ADMIN 被邀请 均拒绝
 *   W5-2  批量进货价：按成本加 2.8% 到元取整、按主站价 85%、一口价；无成本跳过；Product.status≠1 不能授权（逐个 400 / 批量 PRODUCT_OFF）；
 *         两次提交结果相同（幂等）；预览后渠道改了售价不影响；另一窗口改了进货价 → 该行 VERSION_CHANGED
 *   W5-2a T10 值扫描：COST 规则批量设进货价后，渠道 /catalog、操作日志（publicDiff）、通知里成本特征值、supplyBase*、规则参数零命中
 *   W5-3  进货价调到高于售价 → 自动下架 + AUTO_DELISTED 通知（逐个与批量）
 *   W5-4  费率改 200 bp：旧订单快照不变、新订单读到 200；审计前后值；越界（2001、601、负数）拒绝；A10 通过
 *   W5-5  状态机：SUSPENDED 渠道后台只读（读 200 / 写 404）、下一次请求生效；有未付单 / 待处理售后 → TERMINATED 409；
 *         TERMINATED→ACTIVE 409；payoutHoldReason 不出现在渠道任何响应与 publicDiff / 通知里
 *   W5-6  结算全流程（经 HTTP handler，最低结算 20 元）：收款缺失 / 冷静期 / 低于最低额 → 生成 → 同 requestId 幂等 → 已有未完结单 409 →
 *         认领 → 金额不守恒 400 → 要求发票缺发票号 400 → 退回（PAYING 须确认未转出）→ 重出 → 带凭证登记 → 退票超额 400 / 状态不符 400 / 重复 409 →
 *         流水号重复 409 → payoutHold 挡认领与出单
 *   W5-7  打款凭证：只经 /proof 流式下载（字节一致）、不在 public/uploads、渠道 Host 404；非法类型 400；补传只一次
 *   W5-8  调账同一 requestId 两次只生效一次，第二次「已处理」；保证金 / 核销幂等与余额不足
 *   W5-9  对账自检：人为删一条 FEE → L5 失败、样例含订单号、置 payoutHold
 *   W5-10 停用成员：不允许零 OWNER；停用后下一次请求 401 / 404、sessionEpoch + 1、未用邀请作废；启用拒绝 ADMIN
 * 另：T4（渠道 Host 上全部新增 /api/admin 路由 404、无写入）、非管理员 403、跨站 403、休眠期后台照常、运营概览与审计查询。
 *
 * 【外部副作用】开跑前删掉企业微信 / 阿里云邮件相关环境变量：邀请邮件发不出去（返回链接由站长转发，这条路径本身也是验收点），
 * 渠道通知推送换成计数桩。打款凭证写到临时目录（PRIVATE_FILES_DIR），结束删除。
 * 【清理】测试数据用 @itest-tenant.local 邮箱、ITEST 前缀；结束时 cleanupAll()。
 */
for (const k of ['VMQ_KEY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL', 'ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY']) delete process.env[k]

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
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
  collectKeys,
  createUser,
  signTestToken,
  MARK,
  NAME_PREFIX,
  RUN,
  type RouteFn,
  type World,
  type WorldTenant,
  type WorldUser,
} from './_harness'

const PRIVATE_DIR = path.join(os.tmpdir(), `itest-wp5-${RUN}`)
process.env.PRIVATE_FILES_DIR = PRIVATE_DIR

type AnyRoute = Record<string, unknown>
const DAY = 86400_000

// ---------------------------------------------------------------------------
// 调用助手
// ---------------------------------------------------------------------------
let ipSeq = 0
const nextIp = () => {
  ipSeq++
  return `10.55.${(ipSeq >> 8) & 255}.${ipSeq & 255}`
}
function h(mod: AnyRoute, method: string): RouteFn {
  const fn = mod[method]
  if (typeof fn !== 'function') throw new Error(`路由没有导出 ${method}`)
  return fn as RouteFn
}
async function call(
  mod: AnyRoute,
  method: string,
  who: { host: string; token?: string | null },
  o: { body?: unknown; params?: Record<string, string>; path?: string; headers?: Record<string, string> } = {},
) {
  return callRoute(h(mod, method), {
    host: who.host,
    token: who.token ?? null,
    method,
    path: o.path ?? '/api/admin/itest',
    body: o.body,
    params: o.params,
    headers: { 'cf-connecting-ip': nextIp(), ...(o.headers || {}) },
  })
}
/** multipart（打款凭证）：自己拼 NextRequest，body 是 FormData 序列化后的字节 */
async function callForm(mod: AnyRoute, method: string, who: { host: string; token: string }, form: FormData, params: Record<string, string>) {
  const probe = new Request('http://x/', { method: 'POST', body: form })
  const buf = Buffer.from(await probe.arrayBuffer())
  const hd = new Headers()
  hd.set('host', who.host)
  hd.set('cookie', `token=${who.token}`)
  hd.set('content-type', probe.headers.get('content-type') as string)
  hd.set('content-length', String(buf.length))
  hd.set('cf-connecting-ip', nextIp())
  const req = new NextRequest(`http://${who.host}/api/admin/itest`, { method, headers: hd, body: buf })
  const res = await withRequest({ host: who.host }, () => h(mod, method)(req, { params }), hd)
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, json, text }
}
/** 二进制响应（凭证下载） */
async function callBin(mod: AnyRoute, who: { host: string; token: string }, params: Record<string, string>) {
  const hd = new Headers({ host: who.host, cookie: `token=${who.token}`, 'cf-connecting-ip': nextIp() })
  const req = new NextRequest(`http://${who.host}/api/admin/itest`, { method: 'GET', headers: hd })
  const res = await withRequest({ host: who.host }, () => h(mod, 'GET')(req, { params }), hd)
  return { status: res.status, type: res.headers.get('content-type'), buf: Buffer.from(await res.arrayBuffer()) }
}

const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'), Buffer.from(`ITEST-PROOF-${RUN}`)])
const PDF = Buffer.from(`%PDF-1.4\n% ITEST ${RUN}\n`)
const fileOf = (buf: Buffer, name: string, type: string) => new File([new Uint8Array(buf)], name, { type })
/** MySQL 的 JSON 列会按自己的规则重排对象键（先按长度再按字典序），比较前统一排序 */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
  return v
}
const sameJson = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))

// ---------------------------------------------------------------------------
// 夹具：结算流程用的渠道与订单（与 WP3 itest 同一套造法）
// ---------------------------------------------------------------------------
async function mkChannel(letter: string, opt: { requirePartnerInvoice?: boolean } = {}): Promise<WorldTenant> {
  const code = `it5${letter}${RUN}`.slice(0, 20)
  const host = `${code}.bigolab.com`
  const t = await prisma.tenant.create({
    data: { code, kind: 'CHANNEL', name: `${NAME_PREFIX}-w5${letter}`, status: 'ACTIVE', origin: `https://${host}`, holdDays: 7, minPayoutCents: 2000, requirePartnerInvoice: opt.requirePartnerInvoice ?? true },
  })
  await prisma.tenantDomain.create({ data: { tenantId: t.id, host, isPrimary: true, status: 1 } })
  return { id: t.id, code, host, origin: `https://${host}` }
}
let oSeq = 0
async function mkPaidOrder(L: typeof import('../../src/lib/tenant/ledger'), a: { tenantId: number; user: WorldUser; productId: number; listingId: number; qty?: number; release?: boolean; unpaid?: boolean }) {
  oSeq++
  const qty = a.qty ?? 1
  const o = await prisma.order.create({
    data: {
      orderNo: `IW5${RUN.toUpperCase()}${String(oSeq).padStart(3, '0')}`.slice(0, 32),
      userId: a.user.id,
      productId: a.productId,
      productName: `${NAME_PREFIX} W5 ${oSeq}`,
      productPrice: new Prisma.Decimal('140.00'),
      quantity: qty,
      amount: new Prisma.Decimal((140 * qty).toFixed(2)),
      tenantId: a.tenantId,
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
  if (a.unpaid) return o
  const old = new Date(Date.now() - 8 * DAY)
  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({ where: { id: o.id, payStatus: 'UNPAID' }, data: { payStatus: 'PAID', paidAt: old, payMethod: 'ALIPAY', deliveryStatus: 'DELIVERED', deliveredAt: old } })
    await tx.payment.create({ data: { orderId: o.id, payMethod: 'ALIPAY', amount: new Prisma.Decimal((140 * qty).toFixed(2)), status: 1 } })
    await L.accrueOnPaid(tx, o.id)
  })
  if (a.release !== false) await L.releaseDue(new Date(), { tenantId: a.tenantId })
  return o
}

// ---------------------------------------------------------------------------
async function main() {
  mkdirSync(PRIVATE_DIR, { recursive: true })
  const notice = await import('../../src/lib/tenant/notice')
  notice.setTenantNoticeTransportForTest(async () => true)
  const L = await import('../../src/lib/tenant/ledger')
  const { resolveStorefrontForHost, invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  const { readChannelOrderConfig } = await import('../../src/lib/order/create-shop-order')
  const { applySupplyRule } = await import('../../src/lib/tenant/supply-pricing')
  const { maskAccount, inviteEmailHash } = await import('../../src/lib/tenant/admin-tenants')
  const selects = await import('../../src/lib/partner-services/selects')

  const rTenants = await import('../../src/app/api/admin/tenants/route')
  const rTenant = await import('../../src/app/api/admin/tenants/[id]/route')
  const rDomains = await import('../../src/app/api/admin/tenants/[id]/domains/route')
  const rMembers = await import('../../src/app/api/admin/tenants/[id]/members/route')
  const rInvites = await import('../../src/app/api/admin/tenants/[id]/invites/route')
  const rPayee = await import('../../src/app/api/admin/tenants/[id]/payee/route')
  const rListings = await import('../../src/app/api/admin/tenants/[id]/listings/route')
  const rPreview = await import('../../src/app/api/admin/tenants/[id]/listings/batch/preview/route')
  const rCommit = await import('../../src/app/api/admin/tenants/[id]/listings/batch/commit/route')
  const rLedger = await import('../../src/app/api/admin/tenants/[id]/ledger/route')
  const rBalances = await import('../../src/app/api/admin/tenants/[id]/balances/route')
  const rAdjust = await import('../../src/app/api/admin/tenants/[id]/adjust/route')
  const rDeposit = await import('../../src/app/api/admin/tenants/[id]/deposit/route')
  const rWriteoff = await import('../../src/app/api/admin/tenants/[id]/writeoff/route')
  const rStmts = await import('../../src/app/api/admin/tenants/[id]/statements/route')
  const rStmt = await import('../../src/app/api/admin/statements/[sid]/route')
  const rPaying = await import('../../src/app/api/admin/statements/[sid]/paying/route')
  const rUnpaying = await import('../../src/app/api/admin/statements/[sid]/unpaying/route')
  const rPayout = await import('../../src/app/api/admin/statements/[sid]/payout/route')
  const rReturn = await import('../../src/app/api/admin/statements/[sid]/return/route')
  const rBounce = await import('../../src/app/api/admin/statements/[sid]/bounce/route')
  const rProof = await import('../../src/app/api/admin/statements/[sid]/proof/route')
  const rExport = await import('../../src/app/api/admin/statements/[sid]/export/route')
  const rStmtPayee = await import('../../src/app/api/admin/statements/[sid]/payee/route')
  const rReconcile = await import('../../src/app/api/admin/tenants/reconcile/route')
  const rOverview = await import('../../src/app/api/admin/tenants/overview/route')
  const rAudit = await import('../../src/app/api/admin/audit/route')
  // 渠道侧（WP6）：用来验证邀请接受、SUSPENDED 只读、W5-2a 值扫描
  const pInvite = await import('../../src/app/api/partner/invite/accept/route')
  const pCatalog = await import('../../src/app/api/partner/catalog/route')
  const pDashboard = await import('../../src/app/api/partner/dashboard/route')
  const pOrders = await import('../../src/app/api/partner/orders/route')
  const pOrder = await import('../../src/app/api/partner/orders/[orderNo]/route')
  const pListing = await import('../../src/app/api/partner/listings/[listingNo]/route')

  await cleanupAll()
  setChannelsMode('observe')
  invalidateStorefrontCache()
  const w: World = await createWorld()
  const MAIN = { host: 'bigolab.com' }
  const sa = { ...MAIN, token: w.token(w.users.sa) }
  const P = (id: number | string) => ({ id: String(id) })
  const S = (sid: number | string) => ({ sid: String(sid) })

  // =========================================================================
  section('休眠期 / 鉴权：非管理员 403、跨站 403、渠道 Host 404（T4）')
  // =========================================================================
  setChannelsMode('dormant')
  invalidateStorefrontCache()
  check('休眠期主站后台照常：GET /api/admin/tenants 200', (await call(rTenants, 'GET', sa)).status === 200)
  setChannelsMode('observe')
  invalidateStorefrontCache()
  check('未登录 403', (await call(rTenants, 'GET', MAIN)).status === 403)
  check('普通买家 403', (await call(rTenants, 'GET', { ...MAIN, token: w.token(w.users.crossBuyer) })).status === 403)
  check('跨站 Origin 403', (await call(rTenants, 'POST', sa, { body: { code: 'itx', name: 'x', origin: 'https://x.bigolab.com' }, headers: { origin: 'https://evil.com' } })).status === 403)
  {
    const tenantsBefore = await prisma.tenant.count()
    const onLulu = { host: w.lulu.host, token: signTestToken(w.users.sa, w.lulu.code, w.lulu.id) }
    const matrix: [AnyRoute, string, Record<string, string>][] = [
      [rTenants, 'GET', {}],
      [rTenants, 'POST', {}],
      [rTenant, 'GET', P(w.lulu.id)],
      [rTenant, 'PATCH', P(w.lulu.id)],
      [rDomains, 'POST', P(w.lulu.id)],
      [rMembers, 'PATCH', P(w.lulu.id)],
      [rInvites, 'POST', P(w.lulu.id)],
      [rPayee, 'POST', P(w.lulu.id)],
      [rPayee, 'PUT', P(w.lulu.id)],
      [rListings, 'GET', P(w.lulu.id)],
      [rListings, 'PUT', P(w.lulu.id)],
      [rPreview, 'POST', P(w.lulu.id)],
      [rCommit, 'POST', P(w.lulu.id)],
      [rLedger, 'GET', P(w.lulu.id)],
      [rBalances, 'GET', P(w.lulu.id)],
      [rAdjust, 'POST', P(w.lulu.id)],
      [rDeposit, 'POST', P(w.lulu.id)],
      [rWriteoff, 'POST', P(w.lulu.id)],
      [rStmts, 'GET', P(w.lulu.id)],
      [rStmts, 'POST', P(w.lulu.id)],
      [rStmt, 'GET', S(1)],
      [rPaying, 'POST', S(1)],
      [rUnpaying, 'POST', S(1)],
      [rPayout, 'POST', S(1)],
      [rReturn, 'POST', S(1)],
      [rBounce, 'POST', S(1)],
      [rProof, 'GET', S(1)],
      [rProof, 'POST', S(1)],
      [rExport, 'GET', S(1)],
      [rStmtPayee, 'POST', S(1)],
      [rReconcile, 'GET', {}],
      [rReconcile, 'POST', {}],
      [rOverview, 'GET', {}],
      [rAudit, 'GET', {}],
    ]
    const bad: string[] = []
    for (const [mod, m, params] of matrix) {
      const r = await call(mod, m, onLulu, { params, body: m === 'GET' ? undefined : { code: 'itz', name: 'x', origin: 'https://itz.bigolab.com', amountCents: 1, reasonCode: 'X', reason: 'x', requestId: 'itestitest' } })
      if (r.status !== 404) bad.push(`${m} → ${r.status}`)
    }
    check(`渠道 Host 上 ${matrix.length} 个新增超管 handler 一律 404`, bad.length === 0, bad.join('；'))
    check('渠道 Host 调用后无写入（租户数不变）', (await prisma.tenant.count()) === tenantsBefore)
  }

  // =========================================================================
  section('W5-1 新建渠道、域名、邀请与接受（T22）')
  // =========================================================================
  const code = `itn${RUN}`.slice(0, 20)
  const host = `${code}.bigolab.com`
  const created = await call(rTenants, 'POST', sa, { body: { code, name: `${NAME_PREFIX}-w5n`, origin: `https://${host}`, feeRateBp: 150, invoiceShareRateBp: 200 } })
  check('新建渠道 200', created.status === 200 && Number.isInteger(created.json?.data?.id), created.text)
  const tid: number = created.json?.data?.id
  const tRow = await prisma.tenant.findUnique({ where: { id: tid } })
  check('新渠道 DRAFT、默认首月冻结 15 天、最低结算 100 元', tRow?.status === 'DRAFT' && tRow.holdDays === 15 && tRow.minPayoutCents === 10000)
  check('origin 的主机名登记为主域名', (await prisma.tenantDomain.count({ where: { tenantId: tid, host, isPrimary: true, status: 1 } })) === 1)
  check('审计 tenant.create', (await prisma.auditEvent.count({ where: { tenantId: tid, action: 'tenant.create' } })) === 1)
  check('代号重复 409', (await call(rTenants, 'POST', sa, { body: { code, name: `${NAME_PREFIX}-dup`, origin: `https://${code}x.bigolab.com` } })).status === 409)
  for (const [o, why] of [
    ['https://evil.com', '非 *.bigolab.com'],
    ['https://bigolab.com', '主站域名'],
    ['http://itq.bigolab.com', 'http'],
    ['https://a.b.bigolab.com', '多级子域'],
    ['https://www.bigolab.com', '主站 www'],
  ]) {
    check(`新建渠道拒绝 ${why} 400`, (await call(rTenants, 'POST', sa, { body: { code: `itq${RUN}`.slice(0, 18), name: `${NAME_PREFIX}-bad`, origin: o } })).status === 400)
  }
  for (const [hst, st, why] of [
    ['bigolab.com', 400, '主站域名'],
    ['evil.com', 400, 'evil.com'],
    ['a.b.bigolab.com', 400, '多级子域'],
    [w.lulu.host, 409, '他站已占用'],
  ] as const) {
    const r = await call(rDomains, 'POST', sa, { params: P(tid), body: { host: hst, status: 1 } })
    check(`加域名拒绝 ${why}（${st}）`, r.status === st, `${r.status} ${r.text}`)
  }
  const extraHost = `itn2${RUN}.bigolab.com`
  check('加域名 *.bigolab.com 一级子域 200', (await call(rDomains, 'POST', sa, { params: P(tid), body: { host: extraHost.toUpperCase() + '.', status: 1 } })).status === 200)
  check('域名按规范化存储', (await prisma.tenantDomain.count({ where: { tenantId: tid, host: extraHost } })) === 1)
  check('停用域名 200', (await call(rDomains, 'POST', sa, { params: P(tid), body: { host: extraHost, status: 0 } })).status === 200)
  invalidateStorefrontCache()
  check('停用的域名解析为 404（不回落主站）', (await resolveStorefrontForHost(extraHost)) === null)

  // 开业前必须有 OWNER
  check('没有 OWNER 时开业 409', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'ACTIVE' } })).status === 409)

  const owner = await createUser('w5-owner')
  const other = await createUser('w5-other')
  const NT: WorldTenant = { id: tid, code, host, origin: `https://${host}` }
  const tokenOn = (u: WorldUser, t: WorldTenant) => signTestToken(u, t.code, t.id)
  const invite = async (tenantId: number, email: string) => call(rInvites, 'POST', sa, { params: P(tenantId), body: { email } })
  const tokenOfLink = (link: string) => decodeURIComponent(link.split('/partner/invite/')[1] || '')
  const accept = (t: WorldTenant, u: WorldUser, token: string) => call(pInvite, 'POST', { host: t.host, token: tokenOn(u, t) }, { body: { token }, path: '/api/partner/invite/accept' })

  const inv1 = await invite(tid, owner.email)
  check('发邀请 200；邮件未配置 → mailed=false 并返回链接', inv1.status === 200 && inv1.json?.data?.mailed === false && typeof inv1.json?.data?.link === 'string', inv1.text)
  const link1: string = inv1.json?.data?.link ?? ''
  check('邀请链接 = 渠道 origin + /partner/invite/<令牌>', link1.startsWith(`https://${host}/partner/invite/`))
  const tok1 = tokenOfLink(link1)
  const invRow = await prisma.tenantInvite.findFirst({ where: { tenantId: tid }, orderBy: { id: 'desc' } })
  check('库里只存令牌哈希，不存原文', !!invRow && invRow.tokenHash !== tok1 && invRow.tokenHash.length === 64)
  check('邀请 ADMIN 邮箱 400', (await invite(tid, w.users.sa.email)).status === 400)
  check('非法邮箱 400', (await invite(tid, 'not-an-email')).status === 400)

  check('邮箱不符 → 404', (await accept(NT, other, tok1)).status === 404)
  // lulu 的邀请在 zz 的 Host 上接受（T22）
  const invL = await invite(w.lulu.id, other.email)
  const tokL = tokenOfLink(invL.json?.data?.link ?? '')
  const zzMembersBefore = await prisma.tenantMember.count({ where: { tenantId: w.zz.id } })
  check('lulu 的邀请在 zz 的 Host 上接受 → 404', (await accept(w.zz, other, tokL)).status === 404)
  check('跨站接受不产生任何成员', (await prisma.tenantMember.count({ where: { tenantId: w.zz.id } })) === zzMembersBefore && (await prisma.tenantMember.count({ where: { userId: other.id } })) === 0)
  // 过期
  const invE = await invite(tid, other.email)
  const tokE = tokenOfLink(invE.json?.data?.link ?? '')
  await prisma.tenantInvite.updateMany({ where: { tenantId: tid, id: invE.json?.data?.inviteId }, data: { expiresAt: new Date(Date.now() - 1000) } })
  check('过期邀请 → 404', (await accept(NT, other, tokE)).status === 404)
  // 吊销
  const invR = await invite(tid, other.email)
  const tokR = tokenOfLink(invR.json?.data?.link ?? '')
  check('作废邀请 200', (await call(rInvites, 'PATCH', sa, { params: P(tid), body: { inviteId: invR.json?.data?.inviteId, action: 'revoke' } })).status === 200)
  check('已作废的邀请 → 404', (await accept(NT, other, tokR)).status === 404)
  check('再次作废 409', (await call(rInvites, 'PATCH', sa, { params: P(tid), body: { inviteId: invR.json?.data?.inviteId, action: 'revoke' } })).status === 409)
  // ADMIN 拿着令牌接受（守卫层拒绝）
  check('ADMIN 在渠道 Host 接受邀请 → 拒绝', [401, 404].includes((await accept(NT, w.users.sa, tok1)).status))
  // 正常接受
  const ok1 = await accept(NT, owner, tok1)
  check('本人在本站接受 → 204', ok1.status === 204, `${ok1.status} ${ok1.text}`)
  check('成为 OWNER 且 tenantId = 本站', (await prisma.tenantMember.count({ where: { tenantId: tid, userId: owner.id, role: 'OWNER', status: 1 } })) === 1)
  check('已用的邀请再次接受 → 404', (await accept(NT, owner, tok1)).status === 404)
  const invList = await call(rInvites, 'GET', sa, { params: P(tid) })
  check('邀请列表带邮箱与状态、不含令牌', invList.status === 200 && invList.json.data.some((x: any) => x.email === owner.email && x.state === 'USED') && !invList.text.includes(tok1))
  check('有 OWNER 后开业 200', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'ACTIVE' } })).status === 200)

  // =========================================================================
  section('W5-10 停用成员（sessionEpoch、零 OWNER、作废邀请、ADMIN 不能启用）')
  // =========================================================================
  check('停用唯一的 OWNER → 409（不允许零 OWNER）', (await call(rMembers, 'PATCH', sa, { params: P(tid), body: { userId: owner.id, status: 0 } })).status === 409)
  const owner2 = await createUser('w5-owner2')
  const inv2 = await invite(tid, owner2.email)
  check('第二位 OWNER 接受 204', (await accept(NT, owner2, tokenOfLink(inv2.json?.data?.link ?? ''))).status === 204)
  const oldTok = tokenOn(owner, NT)
  check('停用前：旧 token 看板 200', (await call(pDashboard, 'GET', { host, token: oldTok }, { path: '/api/partner/dashboard' })).status === 200)
  const pendingInv = await invite(tid, owner.email) // 发给他邮箱的未用邀请（应在停用时作废）——他已是成员所以 409
  check('已是有效成员的邮箱再邀请 409', pendingInv.status === 409)
  await prisma.tenantInvite.create({
    data: { tenantId: tid, emailHash: inviteEmailHash(owner.email), tokenHash: `it${RUN}`.padEnd(64, '0').slice(0, 64), role: 'OWNER', expiresAt: new Date(Date.now() + DAY), invitedBy: w.users.sa.id },
  })
  const epochBefore = (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).sessionEpoch
  check('停用 OWNER（还有另一位）200', (await call(rMembers, 'PATCH', sa, { params: P(tid), body: { userId: owner.id, status: 0 } })).status === 200)
  check('sessionEpoch + 1', (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).sessionEpoch === epochBefore + 1)
  check('发给他邮箱的未用邀请已作废', (await prisma.tenantInvite.count({ where: { tenantId: tid, emailHash: inviteEmailHash(owner.email), usedAt: null, revokedAt: null } })) === 0)
  const afterOld = await call(pDashboard, 'GET', { host, token: oldTok }, { path: '/api/partner/dashboard' })
  check('停用后旧 token 下一次请求 → 401（会话吊销）', afterOld.status === 401, String(afterOld.status))
  const newTok = signTestToken({ ...owner, sessionEpoch: epochBefore + 1 }, code, tid)
  check('停用后新 token 下一次请求 → 404（不是成员）', (await call(pDashboard, 'GET', { host, token: newTok }, { path: '/api/partner/dashboard' })).status === 404)
  check('重新启用 200', (await call(rMembers, 'PATCH', sa, { params: P(tid), body: { userId: owner.id, status: 1 } })).status === 200)
  await prisma.tenantMember.create({ data: { tenantId: tid, userId: w.users.sa.id, role: 'STAFF', status: 0 } })
  check('启用 role=ADMIN 的成员行 → 400', (await call(rMembers, 'PATCH', sa, { params: P(tid), body: { userId: w.users.sa.id, status: 1 } })).status === 400)
  await prisma.tenantMember.deleteMany({ where: { tenantId: tid, userId: w.users.sa.id } })
  check('成员列表 200', (await call(rMembers, 'GET', sa, { params: P(tid) })).json?.data?.length === 2)

  // =========================================================================
  section('W5-2 批量进货价（规则、取整、无成本、停售商品、幂等、并发）')
  // =========================================================================
  // 纯函数：设计 7.1 的三个例子
  check('按成本 107 加 2.8% 到元 = 110.00', applySupplyRule({ base: 'COST', mode: 'PCT', value: 280 }, { costCents: 10700, mainPriceCents: 0 }, 'YUAN').cents === 11000)
  check('按主站 129 × 85% = 109.65', applySupplyRule({ base: 'MAIN_PRICE', mode: 'PCT', value: 8500 }, { costCents: null, mainPriceCents: 12900 }, 'NONE').cents === 10965)
  check('无成本 → NO_COST', applySupplyRule({ base: 'COST', mode: 'ADD', value: 100 }, { costCents: null, mainPriceCents: 12900 }, 'NONE').reason === 'NO_COST')
  check('主站价减到 ≤ 0 → NON_POSITIVE（不写 0）', applySupplyRule({ base: 'MAIN_PRICE', mode: 'SUB', value: 13000 }, { costCents: null, mainPriceCents: 12900 }, 'NONE').reason === 'NON_POSITIVE')
  check('0.4 元到元取整为 0 → NON_POSITIVE', applySupplyRule({ base: 'MANUAL', cents: 40 }, { costCents: null, mainPriceCents: 0 }, 'YUAN').reason === 'NON_POSITIVE')

  const lulu = w.lulu
  const pAuto = w.products.auto
  const pManual = w.products.manual
  const pSms = w.products.sms
  const lid = (pid: number) => prisma.tenantListing.findUniqueOrThrow({ where: { tenantId_productId: { tenantId: lulu.id, productId: pid } } })
  const autoBefore = await lid(pAuto)
  const prev1 = await call(rPreview, 'POST', sa, { params: P(lulu.id), body: { scope: { productIds: [pAuto, pManual, pSms] }, rule: { base: 'COST', mode: 'PCT', value: 280 }, rounding: 'YUAN' } })
  check('预览 200', prev1.status === 200, prev1.text)
  const rowOf = (r: any, pid: number) => r.json?.data?.rows?.find((x: any) => x.productId === pid)
  // 夹具：卡密商品未售卡 cost 107.13 → 10713 × 1.028 = 11013.46 → 到元 110.00
  check('COST 行：成本 107.13、基准 10713、到元 110.00', rowOf(prev1, pAuto)?.costCents === MARK.costBaseCents && rowOf(prev1, pAuto)?.newSupplyCents === 11000 && rowOf(prev1, pAuto)?.baseCents === MARK.costBaseCents)
  check('毛利预估 = 进货价 − 成本 + 手续费估算', rowOf(prev1, pAuto)?.marginCents === 11000 - MARK.costBaseCents + 210)
  check('无成本数据的商品跳过（人工交付 / 接码）', rowOf(prev1, pManual)?.skipReason === 'NO_COST' && rowOf(prev1, pSms)?.skipReason === 'NO_COST')
  const com1 = await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev1.json.data.previewToken } })
  check('提交 200：更新 1 行', com1.status === 200 && com1.json.data.updated === 1, com1.text)
  const autoAfter = await lid(pAuto)
  check('写入进货价 110.00、版本 + 1、基准快照 COST / 10713', autoAfter.supplyCents === 11000 && autoAfter.supplyVersion === autoBefore.supplyVersion + 1 && autoAfter.supplyBaseKind === 'COST' && autoAfter.supplyBaseCents === MARK.costBaseCents)
  const com1b = await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev1.json.data.previewToken } })
  check('同一份预览再提交一次：更新 0、unchanged 1（幂等）', com1b.status === 200 && com1b.json.data.updated === 0 && com1b.json.data.unchanged === 1)
  const prev1c = await call(rPreview, 'POST', sa, { params: P(lulu.id), body: { scope: { productIds: [pAuto] }, rule: { base: 'COST', mode: 'PCT', value: 280 }, rounding: 'YUAN' } })
  const com1c = await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev1c.json.data.previewToken } })
  const autoAfter2 = await lid(pAuto)
  check('同一规则重新预览再提交：结果相同、版本不变（从基准重算不滚雪球）', com1c.json?.data?.updated === 0 && autoAfter2.supplyCents === 11000 && autoAfter2.supplyVersion === autoAfter.supplyVersion)
  check('篡改预览令牌 → 400', (await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev1c.json.data.previewToken.slice(0, -2) + 'AA' } })).status === 400)
  check('拿 lulu 的令牌提交到 zz → 400', (await call(rCommit, 'POST', sa, { params: P(w.zz.id), body: { previewToken: prev1c.json.data.previewToken } })).status === 400)

  // 预览后渠道改了售价 → 不影响；另一窗口改了进货价 → VERSION_CHANGED
  const prev2 = await call(rPreview, 'POST', sa, { params: P(lulu.id), body: { scope: { productIds: [pAuto, pSms] }, rule: { base: 'MAIN_PRICE', mode: 'PCT', value: 8500 }, rounding: 'NONE' } })
  check('按主站价 85%：卡密商品 129 → 109.65', rowOf(prev2, pAuto)?.newSupplyCents === 10965)
  await prisma.tenantListing.update({ where: { id: autoAfter.id }, data: { retailCents: 14100 } }) // 渠道改售价（不动版本号）
  const smsL = await lid(pSms)
  const putSms = await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pSms, supplyCents: 1111 } })
  check('另一窗口逐个改进货价 200', putSms.status === 200, putSms.text)
  const com2 = await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev2.json.data.previewToken } })
  check('渠道改售价不影响（卡密商品照常更新）', com2.json?.data?.updated === 1 && (await lid(pAuto)).supplyCents === 10965)
  check('进货价被另一窗口改过的行 → VERSION_CHANGED 跳过', com2.json?.data?.skipped?.some((s: any) => s.productId === pSms && s.reason === 'VERSION_CHANGED'))
  check('被跳过的行保持另一窗口的值', (await lid(pSms)).supplyCents === 1111 && (await lid(pSms)).supplyVersion === smsL.supplyVersion + 1)

  // Product.status≠1 不能授权
  const cat = await prisma.category.findFirstOrThrow({ where: { name: { startsWith: NAME_PREFIX } } })
  const pOff = await prisma.product.create({ data: { categoryId: cat.id, name: `${NAME_PREFIX} W5 停售 ${RUN}`, price: new Prisma.Decimal('50.00'), status: 0 } })
  const pNew = await prisma.product.create({ data: { categoryId: cat.id, name: `${NAME_PREFIX} W5 新品 ${RUN}`, price: new Prisma.Decimal('80.00'), status: 1 } })
  check('逐个授权停售商品 → 400', (await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pOff.id, granted: true } })).status === 400)
  const prev3 = await call(rPreview, 'POST', sa, { params: P(lulu.id), body: { scope: { productIds: [pOff.id, pNew.id] }, rule: { base: 'MANUAL', cents: 6000 }, rounding: 'NONE' } })
  const com3 = await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev3.json.data.previewToken, grant: true } })
  check('批量 + 授权：停售商品 PRODUCT_OFF 跳过', com3.json?.data?.skipped?.some((s: any) => s.productId === pOff.id && s.reason === 'PRODUCT_OFF'))
  check('停售商品没有建上架行', (await prisma.tenantListing.count({ where: { tenantId: lulu.id, productId: pOff.id } })) === 0)
  const newL = await prisma.tenantListing.findUnique({ where: { tenantId_productId: { tenantId: lulu.id, productId: pNew.id } } })
  check('在售新商品：新建上架行、已授权、进货价 60、公开编号 12 位', !!newL && newL.granted && newL.supplyCents === 6000 && /^[0-9A-HJKMNP-TV-Z]{12}$/.test(newL.publicNo) && newL.status === 0)

  // =========================================================================
  section('W5-2a T10 值扫描：COST 规则之后渠道侧零命中成本 / 基准 / 规则')
  // =========================================================================
  {
    const ownerTok = { host: lulu.host, token: w.token(w.users.luluOwner, lulu) }
    const cat1 = await call(pCatalog, 'GET', ownerTok, { path: '/api/partner/catalog' })
    check('渠道商品池 200', cat1.status === 200)
    const forbidden = ['supplyBaseKind', 'supplyBaseCents', 'supplyVersion', 'costCents', 'marginCents', 'rule', 'rounding', 'cost']
    const keys = collectKeys(cat1.json).map((k) => k.key)
    check('商品池无 supplyBase* / 成本 / 规则键', !keys.some((k) => forbidden.includes(k)), keys.filter((k) => forbidden.includes(k)).join(','))
    check('商品池无成本特征值 107.13 / 10713', !cat1.text.includes(MARK.cardCost) && !cat1.text.includes(String(MARK.costBaseCents)))
    // 操作日志：渠道只读 PARTNER_AUDIT_SELECT（不含 diff）；平台行只看 publicDiff
    const audits = await prisma.auditEvent.findMany({ where: { tenantId: lulu.id, action: { not: 'authz.denied' } }, select: selects.PARTNER_AUDIT_SELECT })
    const aText = JSON.stringify(audits)
    check('操作日志（渠道可见列）无成本特征值、无 supplyBase / 规则', !aText.includes(MARK.cardCost) && !aText.includes(String(MARK.costBaseCents)) && !/supplyBase|"rule"|"COST"|rounding|costCents|marginCents/.test(aText))
    const pub = audits.find((a) => a.action === 'listing.batch_supply' && Array.isArray(a.publicDiff) && (a.publicDiff as any[]).some((x) => x.newSupplyCents === 11000))
    check('listing.batch_supply 的 publicDiff 只含 listingNo / productName / 新旧进货价', !!pub && (pub.publicDiff as any[]).every((x) => Object.keys(x).sort().join(',') === 'listingNo,newSupplyCents,oldSupplyCents,productName'))
    const notices = await prisma.tenantNotice.findMany({ where: { tenantId: lulu.id }, select: selects.PARTNER_NOTICE_SELECT })
    const nText = JSON.stringify(notices)
    check('通知无成本特征值', !nText.includes(MARK.cardCost) && !nText.includes(String(MARK.costBaseCents)))
    check('合并发了 SUPPLY_CHANGED 通知', notices.some((n) => n.kind === 'SUPPLY_CHANGED'))
    // WP7 的 /api/partner/audit、/notices 若已落地，再经 HTTP 扫一遍
    for (const [rel, name] of [
      ['../../src/app/api/partner/audit/route', 'audit'],
      ['../../src/app/api/partner/notices/route', 'notices'],
    ] as const) {
      const file = path.join(process.cwd(), `src/app/api/partner/${name}/route.ts`)
      if (!existsSync(file)) {
        console.log(`  · /api/partner/${name} 尚未落地（WP7），跳过 HTTP 扫描`)
        continue
      }
      const mod = await import(rel)
      const r = await call(mod as AnyRoute, 'GET', ownerTok, { path: `/api/partner/${name}` })
      check(`/api/partner/${name} 无成本特征值与 supplyBase / 规则`, r.status === 200 && !r.text.includes(MARK.cardCost) && !r.text.includes(String(MARK.costBaseCents)) && !/supplyBase|"rule"|rounding/.test(r.text), `${r.status}`)
    }
  }

  // =========================================================================
  section('W5-3 进货价高于售价 → 自动下架并通知')
  // =========================================================================
  {
    const man = await lid(pManual)
    check('前置：人工商品上架中、售价 140', man.status === 1 && man.retailCents === 14000)
    const r = await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pManual, supplyCents: 15000 } })
    check('逐个把进货价调到 150 → 200 且提示自动下架', r.status === 200 && r.json?.data?.delisted === true)
    const after = await lid(pManual)
    check('上架行 status=0、delistedReason=SUPPLY_ABOVE_RETAIL', after.status === 0 && after.delistedReason === 'SUPPLY_ABOVE_RETAIL')
    check('渠道收到 AUTO_DELISTED 通知（正文只含新旧进货价）', (await prisma.tenantNotice.count({ where: { tenantId: lulu.id, kind: 'AUTO_DELISTED', refKey: after.publicNo } })) === 1)
    const au = await prisma.auditEvent.findFirst({ where: { tenantId: lulu.id, action: 'listing.supply', targetId: after.publicNo }, orderBy: { id: 'desc' } })
    check('listing.supply 审计 publicDiff = [{ listingNo, productName, 旧 11037, 新 15000 }]', sameJson(au?.publicDiff, [{ listingNo: after.publicNo, productName: (await prisma.product.findUniqueOrThrow({ where: { id: pManual } })).name, oldSupplyCents: MARK.supplyCents, newSupplyCents: 15000 }]))
    // 批量：售价 141 的卡密商品按一口价 150 → 预览标记将下架、提交下架 1
    const prev = await call(rPreview, 'POST', sa, { params: P(lulu.id), body: { scope: { productIds: [pAuto] }, rule: { base: 'MANUAL', cents: 15000 }, rounding: 'NONE' } })
    check('批量预览标记「将自动下架」', rowOf(prev, pAuto)?.willDelist === true)
    const com = await call(rCommit, 'POST', sa, { params: P(lulu.id), body: { previewToken: prev.json.data.previewToken } })
    check('批量提交 delisted = 1', com.json?.data?.delisted === 1)
    check('合并发 AUTO_DELISTED', (await prisma.tenantNotice.count({ where: { tenantId: lulu.id, kind: 'AUTO_DELISTED' } })) >= 2)
    // 售价下限高于现售价 → 同样下架（A2 不留不可售的在售行）；代改售价通知渠道
    await prisma.tenantListing.update({ where: { id: newL!.id }, data: { retailCents: 7000, status: 1 } })
    const rr = await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pNew.id, minRetailCents: 8000 } })
    check('下限调到高于售价 → 自动下架（OUT_OF_RANGE）', rr.status === 200 && (await prisma.tenantListing.findUniqueOrThrow({ where: { id: newL!.id } })).delistedReason === 'OUT_OF_RANGE')
    check('代改售价低于进货价 → 400', (await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pNew.id, retailCents: 5000 } })).status === 400)
    const rp = await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pNew.id, retailCents: 9000 } })
    check('代改售价 200、审计 listing.price publicDiff 只含新旧售价', rp.status === 200 && sameJson((await prisma.auditEvent.findFirst({ where: { tenantId: lulu.id, action: 'listing.price' }, orderBy: { id: 'desc' } }))?.publicDiff, { listingNo: newL!.publicNo, oldRetailCents: 7000, newRetailCents: 9000 }))
    const rv = await call(rListings, 'PUT', sa, { params: P(lulu.id), body: { productId: pNew.id, granted: false } })
    check('撤销授权 → REVOKED + PRODUCT_WITHDRAWN 通知', rv.status === 200 && (await prisma.tenantListing.findUniqueOrThrow({ where: { id: newL!.id } })).delistedReason === 'REVOKED' && (await prisma.tenantNotice.count({ where: { tenantId: lulu.id, kind: 'PRODUCT_WITHDRAWN' } })) === 1)
    const adminList = await call(rListings, 'GET', sa, { params: P(lulu.id), path: '/api/admin/tenants/x/listings?only=listed' })
    check('超管商品授权表 200、带成本（仅超管）', adminList.status === 200 && adminList.json.data.some((x: any) => x.productId === pAuto && x.costCents === MARK.costBaseCents))
  }

  // =========================================================================
  section('W5-4 费率变更只影响新订单；越界拒绝；审计前后值；A10')
  // =========================================================================
  {
    const before = await prisma.order.findUniqueOrThrow({ where: { id: w.orders.luluAuto.id }, select: { feeRateBp: true } })
    for (const [body, why] of [
      [{ feeRateBp: 2001 }, '手续费 2001'],
      [{ invoiceShareRateBp: 601 }, '分成 601'],
      [{ feeRateBp: -1 }, '负数'],
      [{ holdDays: 91 }, '冻结期 91'],
    ] as const) {
      check(`越界拒绝：${why} → 400`, (await call(rTenant, 'PATCH', sa, { params: P(lulu.id), body })).status === 400)
    }
    const r = await call(rTenant, 'PATCH', sa, { params: P(lulu.id), body: { feeRateBp: 200 } })
    check('改手续费 200 bp → 200', r.status === 200, r.text)
    check('之前的订单快照不变（150）', (await prisma.order.findUniqueOrThrow({ where: { id: w.orders.luluAuto.id }, select: { feeRateBp: true } })).feeRateBp === before.feeRateBp && before.feeRateBp === 150)
    const cfg = await prisma.$transaction((tx) => readChannelOrderConfig(tx, lulu.id))
    check('之后的新订单读到 200（下单事务内快照）', cfg.feeRateBp === 200)
    const au = await prisma.auditEvent.findFirst({ where: { tenantId: lulu.id, action: 'tenant.rates' }, orderBy: { id: 'desc' } })
    check('审计 tenant.rates：diff 与 publicDiff 都是 { feeRateBp: {150 → 200} }', sameJson(au?.diff, { feeRateBp: { from: 150, to: 200 } }) && sameJson(au?.publicDiff, { feeRateBp: { from: 150, to: 200 } }))
    const rec = await (await import('../../src/lib/tenant/reconcile')).runReconcile({ tenantId: lulu.id })
    check('A10（费率变更有审计）通过', rec.items.find((i) => i.code === 'A10')?.ok === true)
    await call(rTenant, 'PATCH', sa, { params: P(lulu.id), body: { feeRateBp: 150 } })
  }

  // =========================================================================
  section('W5-5 状态机、只读、停业前置条件、payoutHoldReason 不外泄')
  // =========================================================================
  {
    // 新渠道 NT 上一条可写的上架行
    await call(rListings, 'PUT', sa, { params: P(tid), body: { productId: pAuto, granted: true, supplyCents: 11000 } })
    const ntL = await prisma.tenantListing.findUniqueOrThrow({ where: { tenantId_productId: { tenantId: tid, productId: pAuto } } })
    const o2 = { host, token: tokenOn(owner2, NT) }
    check('ACTIVE：渠道改售价 200', (await call(pListing, 'PATCH', o2, { params: { listingNo: ntL.publicNo }, body: { retailYuan: '140' }, path: `/api/partner/listings/${ntL.publicNo}` })).status === 200)
    check('ACTIVE → SUSPENDED 200', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'SUSPENDED' } })).status === 200)
    check('下一次请求生效：店面状态 SUSPENDED', (await resolveStorefrontForHost(host))?.status === 'SUSPENDED')
    check('SUSPENDED：渠道读接口 200', (await call(pCatalog, 'GET', o2, { path: '/api/partner/catalog' })).status === 200)
    check('SUSPENDED：渠道写接口 404（只读）', (await call(pListing, 'PATCH', o2, { params: { listingNo: ntL.publicNo }, body: { retailYuan: '141' }, path: `/api/partner/listings/${ntL.publicNo}` })).status === 404)
    check('状态变更通知 TENANT_STATUS', (await prisma.tenantNotice.count({ where: { tenantId: tid, kind: 'TENANT_STATUS' } })) >= 1)
    check('审计 tenant.status publicDiff = { from, to }', sameJson((await prisma.auditEvent.findFirst({ where: { tenantId: tid, action: 'tenant.status' }, orderBy: { id: 'desc' } }))?.publicDiff, { from: 'ACTIVE', to: 'SUSPENDED' }))
    check('SUSPENDED → DRAFT 非法 409', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'DRAFT' } })).status === 409)
    const buyer = await createUser('w5-buyer')
    const unpaid = await mkPaidOrder(L, { tenantId: tid, user: buyer, productId: pAuto, listingId: ntL.id, unpaid: true })
    check('有未付款订单 → TERMINATED 409', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'TERMINATED' } })).status === 409)
    await prisma.order.update({ where: { id: unpaid.id }, data: { deliveryStatus: 'CANCELLED' } })
    const as = await prisma.tenantAfterSale.create({ data: { requestNo: `AS${RUN}`.toUpperCase().slice(0, 24), tenantId: tid, orderId: unpaid.id, kind: 'ESCALATE', activeKey: `o:${unpaid.id}:ESCALATE`, reason: 'itest', status: 'PENDING' } })
    check('有待处理售后申请 → TERMINATED 409', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'TERMINATED' } })).status === 409)
    await prisma.tenantAfterSale.update({ where: { id: as.id }, data: { status: 'DONE', activeKey: null } })
    check('SUSPENDED → TERMINATED 200', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'TERMINATED' } })).status === 200)
    check('TERMINATED → ACTIVE 409（终态）', (await call(rTenant, 'PATCH', sa, { params: P(tid), body: { status: 'ACTIVE' } })).status === 409)
    check('TERMINATED：渠道后台 404', (await call(pCatalog, 'GET', o2, { path: '/api/partner/catalog' })).status === 404)
    check('TERMINATED：店面仍解析（买家订单入口照常，停业页由外壳渲染）', (await resolveStorefrontForHost(host))?.status === 'TERMINATED')
    check('停业渠道不能再发邀请 409', (await invite(tid, 'x' + owner.email)).status === 409)

    // payoutHoldReason 绝不出现在渠道任何响应
    const SECRET = `ITEST-HOLD-REASON-${RUN}`
    check('lulu 置 payoutHold（带原因）200', (await call(rTenant, 'PATCH', sa, { params: P(lulu.id), body: { payoutHold: true, payoutHoldReason: SECRET } })).status === 200)
    const lo = { host: lulu.host, token: w.token(w.users.luluOwner, lulu) }
    const texts = [
      (await call(pDashboard, 'GET', lo, { path: '/api/partner/dashboard' })).text,
      (await call(pCatalog, 'GET', lo, { path: '/api/partner/catalog' })).text,
      (await call(pOrders, 'GET', lo, { path: '/api/partner/orders' })).text,
      (await call(pOrder, 'GET', lo, { params: { orderNo: w.orders.luluAuto.orderNo }, path: `/api/partner/orders/${w.orders.luluAuto.orderNo}` })).text,
    ]
    for (const rel of ['settings', 'audit', 'notices']) {
      const file = path.join(process.cwd(), `src/app/api/partner/${rel}/route.ts`)
      if (existsSync(file)) texts.push((await call((await import(`../../src/app/api/partner/${rel}/route`)) as AnyRoute, 'GET', lo, { path: `/api/partner/${rel}` })).text)
    }
    check('渠道响应（看板 / 商品池 / 订单 / 详情 / WP7 已落地的页面）不含暂停原因', texts.every((t) => !t.includes(SECRET)))
    const pubRows = await prisma.auditEvent.findMany({ where: { tenantId: lulu.id }, select: selects.PARTNER_AUDIT_SELECT })
    check('渠道可见的审计列不含暂停原因；tenant.payout_hold 的 publicDiff 只有布尔', !JSON.stringify(pubRows).includes(SECRET) && sameJson(pubRows.find((a) => a.action === 'tenant.payout_hold')?.publicDiff, { payoutHold: true }))
    check('通知不含暂停原因', !JSON.stringify(await prisma.tenantNotice.findMany({ where: { tenantId: lulu.id }, select: selects.PARTNER_NOTICE_SELECT })).includes(SECRET))
    check('超管详情能看到原因', (await call(rTenant, 'GET', sa, { params: P(lulu.id) })).json?.data?.tenant?.payoutHoldReason === SECRET)
    await call(rTenant, 'PATCH', sa, { params: P(lulu.id), body: { payoutHold: false, payoutHoldReason: null } })
  }

  // =========================================================================
  section('W5-6 / W5-7 结算全流程（经 HTTP handler）与打款凭证')
  // =========================================================================
  const ST = await mkChannel('s', { requirePartnerInvoice: true })
  await call(rListings, 'PUT', sa, { params: P(ST.id), body: { productId: pAuto, granted: true, supplyCents: 11000 } })
  const stL = await prisma.tenantListing.findUniqueOrThrow({ where: { tenantId_productId: { tenantId: ST.id, productId: pAuto } } })
  await prisma.tenantListing.update({ where: { id: stL.id }, data: { retailCents: 14000, status: 1 } })
  const buyerS = await createUser('w5-buyer-s')
  await mkPaidOrder(L, { tenantId: ST.id, user: buyerS, productId: pAuto, listingId: stL.id, qty: 1 })
  await mkPaidOrder(L, { tenantId: ST.id, user: buyerS, productId: pAuto, listingId: stL.id, qty: 2 })
  const bal0 = await call(rBalances, 'GET', sa, { params: P(ST.id) })
  check('两单解冻后可结算预计打款 = 2790 + 5580 = 8370', bal0.json?.data?.available?.payoutCents === 8370, JSON.stringify(bal0.json?.data?.available))
  const gen = (origin: 'SCHEDULE' | 'MANUAL', requestId: string) =>
    call(rStmts, 'POST', sa, { params: P(ST.id), body: { origin, requestId, periodEnd: new Date(Date.now() + 1000).toISOString() } })
  const g0 = await gen('SCHEDULE', `rq0${RUN}`)
  check('未录入收款信息 → 400 PAYEE_MISSING', g0.status === 400 && g0.json?.reason === 'PAYEE_MISSING', g0.text)
  const ACCOUNT = `itest-payee-${RUN}@example.com`
  check('录入收款信息 200', (await call(rPayee, 'PUT', sa, { params: P(ST.id), body: { name: 'ITEST 收款人', method: 'ALIPAY', account: ACCOUNT } })).status === 200)
  const stT = await prisma.tenant.findUniqueOrThrow({ where: { id: ST.id } })
  check('账号加密存储、掩码可见、明文不落库', !!stT.payeeAccountEnc && !stT.payeeAccountEnc.includes(ACCOUNT) && stT.payeeAccountMasked === maskAccount(ACCOUNT))
  check('审计 tenant.payee 不含账号明文', !JSON.stringify(await prisma.auditEvent.findMany({ where: { tenantId: ST.id, action: 'tenant.payee' } })).includes(ACCOUNT))
  const pv = await call(rPayee, 'GET', sa, { params: P(ST.id) })
  check('GET 收款信息只给掩码', pv.status === 200 && !pv.text.includes(ACCOUNT) && pv.json.data.payeeCooldownUntil != null)
  const rv = await call(rPayee, 'POST', sa, { params: P(ST.id), body: { action: 'reveal' } })
  check('查看明文 200 且写审计', rv.json?.data?.account === ACCOUNT && (await prisma.auditEvent.count({ where: { tenantId: ST.id, action: 'tenant.payee_reveal' } })) === 1)
  const g1 = await gen('SCHEDULE', `rq1${RUN}`)
  check('收款信息冷静期内 → 400 PAYEE_COOLDOWN', g1.status === 400 && g1.json?.reason === 'PAYEE_COOLDOWN')
  await prisma.tenant.update({ where: { id: ST.id }, data: { payeeChangedAt: new Date(Date.now() - 4 * DAY) } })
  await call(rTenant, 'PATCH', sa, { params: P(ST.id), body: { minPayoutCents: 999_999 } })
  const g2 = await gen('SCHEDULE', `rq2${RUN}`)
  check('低于最低结算额 → 400 BELOW_MIN', g2.status === 400 && g2.json?.reason === 'BELOW_MIN', g2.text)
  await call(rTenant, 'PATCH', sa, { params: P(ST.id), body: { minPayoutCents: 2000 } })
  const g3 = await gen('SCHEDULE', `rq3${RUN}`)
  check('生成结算单 200、打款额 8370', g3.status === 200 && g3.json?.data?.netCents === 8370, g3.text)
  const s1No: string = g3.json?.data?.statementNo
  const s1 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: s1No } })
  const g3b = await gen('SCHEDULE', `rq3${RUN}`)
  check('同一 requestId 再提交 → 同一张单（幂等）', g3b.status === 200 && g3b.json?.data?.statementNo === s1No && (await prisma.tenantStatement.count({ where: { tenantId: ST.id } })) === 1)
  const g4 = await gen('MANUAL', `rq4${RUN}`)
  check('已有未完结单 → 409 OPEN_EXISTS', g4.status === 409 && g4.json?.reason === 'OPEN_EXISTS')
  const payJson = (over: Record<string, unknown> = {}) => ({ amountCents: 8370, withholdCents: 0, method: 'ALIPAY', externalTradeNo: `T1${RUN}`, paidAt: new Date().toISOString(), voucherType: 'INVOICE', partnerInvoiceNo: `INV${RUN}`, partnerInvoiceAmountCents: 8370, ...over })
  check('未认领就登记打款 → 409', (await call(rPayout, 'POST', sa, { params: S(s1.id), body: payJson() })).status === 409)
  check('开始打款（认领）200', (await call(rPaying, 'POST', sa, { params: S(s1.id) })).status === 200)
  check('重复认领 409', (await call(rPaying, 'POST', sa, { params: S(s1.id) })).status === 409)
  const list1 = await call(rStmts, 'GET', sa, { params: P(ST.id) })
  check('列表显示认领人与时间', list1.json?.data?.rows?.[0]?.state === 'PAYING' && !!list1.json.data.rows[0].payingByName)
  check('金额不守恒 → 400 AMOUNT_MISMATCH', (await call(rPayout, 'POST', sa, { params: S(s1.id), body: payJson({ amountCents: 8000 }) })).json?.reason === 'AMOUNT_MISMATCH')
  check('要求发票却没填发票号 → 400 INVOICE_REQUIRED', (await call(rPayout, 'POST', sa, { params: S(s1.id), body: payJson({ partnerInvoiceNo: '' }) })).json?.reason === 'INVOICE_REQUIRED')
  check('打款中退回未确认未转出 → 400', (await call(rReturn, 'POST', sa, { params: S(s1.id), body: { reason: 'itest 退回' } })).status === 400)
  check('确认未转出后退回 200', (await call(rReturn, 'POST', sa, { params: S(s1.id), body: { reason: 'itest 退回', confirmNotTransferred: true } })).status === 200)
  check('退回后可结算回到 8370', (await call(rBalances, 'GET', sa, { params: P(ST.id) })).json?.data?.available?.payoutCents === 8370)
  const g5 = await gen('SCHEDULE', `rq5${RUN}`)
  check('退回后重出：新单、打款额仍为 8370', g5.status === 200 && g5.json?.data?.netCents === 8370 && g5.json.data.statementNo !== s1No)
  const s2 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: g5.json.data.statementNo } })
  await call(rPaying, 'POST', sa, { params: S(s2.id) })
  const form = new FormData()
  for (const [k, v] of Object.entries(payJson())) form.set(k, String(v))
  form.set('proof', fileOf(PNG, 'proof.png', 'image/png'))
  const po = await callForm(rPayout, 'POST', sa, form, S(s2.id))
  check('带凭证登记打款（multipart）200', po.status === 200, po.text)
  const payout = await prisma.tenantPayout.findUniqueOrThrow({ where: { statementId: s2.id } })
  check('结算单 PAID、流水号与凭证键入库', (await prisma.tenantStatement.findUniqueOrThrow({ where: { id: s2.id } })).state === 'PAID' && payout.externalTradeNo === `T1${RUN}` && /^payout\/\d+-[0-9a-f]{16}\.png$/.test(payout.proofFile ?? ''))
  // W5-7
  const onDisk = path.join(PRIVATE_DIR, payout.proofFile as string)
  check('凭证落在私有目录', existsSync(onDisk) && readFileSync(onDisk).equals(PNG))
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const inUploads = existsSync(uploadsDir) && JSON.stringify(readdirSync(uploadsDir, { recursive: true } as any)).includes(path.basename(onDisk))
  check('/uploads 下不存在该凭证', !inUploads)
  const dl = await callBin(rProof, sa, S(s2.id))
  check('只经 /proof 流式下载：200、image/png、字节一致', dl.status === 200 && dl.type === 'image/png' && dl.buf.equals(PNG))
  check('渠道 Host 访问 /proof → 404', (await callBin(rProof, { host: lulu.host, token: signTestToken(w.users.sa, lulu.code, lulu.id) }, S(s2.id))).status === 404)
  check('下载凭证写审计', (await prisma.auditEvent.count({ where: { tenantId: ST.id, action: 'statement.proof_view' } })) === 1)
  // 退票
  check('退票超过打款额 → 400 OVER_AMOUNT', (await call(rBounce, 'POST', sa, { params: S(s2.id), body: { amountCents: 9000, externalNo: `B1${RUN}` } })).json?.reason === 'OVER_AMOUNT')
  check('退票 1 元 200', (await call(rBounce, 'POST', sa, { params: S(s2.id), body: { amountCents: 100, externalNo: `B1${RUN}` } })).status === 200)
  check('同一退票流水号再登记 → 409', (await call(rBounce, 'POST', sa, { params: S(s2.id), body: { amountCents: 100, externalNo: `B1${RUN}` } })).status === 409)
  // 第三张单：状态不符的退票、流水号重复、补传凭证
  await mkPaidOrder(L, { tenantId: ST.id, user: buyerS, productId: pAuto, listingId: stL.id, qty: 1 })
  const g6 = await gen('SCHEDULE', `rq6${RUN}`)
  check('第三张单 = 2790 + 退票 100 = 2890', g6.json?.data?.netCents === 2890, g6.text)
  const s3 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: g6.json.data.statementNo } })
  check('未打款的单登记退票 → 400 BAD_STATE', (await call(rBounce, 'POST', sa, { params: S(s3.id), body: { amountCents: 100, externalNo: `B2${RUN}` } })).json?.reason === 'BAD_STATE')
  await call(rPaying, 'POST', sa, { params: S(s3.id) })
  const p3 = (no: string) => call(rPayout, 'POST', sa, { params: S(s3.id), body: payJson({ amountCents: 2890, partnerInvoiceAmountCents: 2890, externalTradeNo: no }) })
  check('转账流水号重复 → 409 DUP_TRADE_NO', (await p3(`T1${RUN}`)).json?.reason === 'DUP_TRADE_NO')
  check('不带凭证登记 200', (await p3(`T2${RUN}`)).status === 200)
  const txt = new FormData()
  txt.set('proof', fileOf(Buffer.from('hello'), 'a.txt', 'text/plain'))
  check('补传非 png/jpg/pdf → 400', (await callForm(rProof, 'POST', sa, txt, S(s3.id))).status === 400)
  const pdf = new FormData()
  pdf.set('proof', fileOf(PDF, 'a.pdf', 'application/pdf'))
  check('补传 pdf 200', (await callForm(rProof, 'POST', sa, pdf, S(s3.id))).status === 200)
  check('再补传 → 409（只补一次）', (await callForm(rProof, 'POST', sa, pdf, S(s3.id))).status === 409)
  const big = new FormData()
  big.set('proof', fileOf(Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]), 'big.png', 'image/png'))
  check('超过 5MB → 400', (await callForm(rProof, 'POST', sa, big, S(s2.id))).status === 400)
  // 详情、导出、快照账号
  const det = await call(rStmt, 'GET', sa, { params: S(s2.id) })
  check('结算单详情 200、不含 payeeAccountEnc', det.status === 200 && !collectKeys(det.json).some((k) => k.key === 'payeeAccountEnc') && det.json.data.bouncedCents === 100)
  const ex = await call(rExport, 'GET', sa, { params: S(s2.id) })
  check('导出对账单 CSV 含结算单号', ex.status === 200 && ex.text.includes(s2.statementNo))
  // 负数金额（进货款、手续费、PURCHASE / FEE 分录）必须以数值导出：不加防公式注入的单引号，Excel 才能求和对账
  check('CSV 负数金额以数值导出（-330.00 而不是带单引号的文本）', /,-\d+\.\d{2}(,|\r\n)/.test(ex.text) && !/'-\d/.test(ex.text), ex.text.slice(0, 400))
  check('查看结算单快照账号 = 录入的账号（审计）', (await call(rStmtPayee, 'POST', sa, { params: S(s2.id) })).json?.data?.account === ACCOUNT && (await prisma.auditEvent.count({ where: { tenantId: ST.id, action: 'statement.payee_reveal' } })) === 1)
  // payoutHold 挡认领与出单
  await mkPaidOrder(L, { tenantId: ST.id, user: buyerS, productId: pAuto, listingId: stL.id, qty: 1 })
  const g7 = await gen('SCHEDULE', `rq7${RUN}`)
  const s4 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: g7.json?.data?.statementNo } })
  await call(rTenant, 'PATCH', sa, { params: P(ST.id), body: { payoutHold: true, payoutHoldReason: 'itest 暂停' } })
  const ph = await call(rPaying, 'POST', sa, { params: S(s4.id) })
  // 站长手动暂停（原因自己填）：文案带原因、不说「对账异常」（终审完整性 #22）；对账失败置的 hold 才说「对账异常」（D7）
  check('手动 payoutHold 时认领 → 409 HOLD、文案带暂停原因、不冒充对账异常', ph.status === 409 && ph.json?.reason === 'HOLD' && String(ph.json?.error).startsWith('该渠道已暂停打款：itest 暂停') && !/对账/.test(String(ph.json?.error)) && !/payoutHold/.test(ph.text), ph.text)
  await prisma.tenant.update({ where: { id: ST.id }, data: { payoutHoldReason: '对账失败：L5（itest）' } })
  const phr = await call(rPaying, 'POST', sa, { params: S(s4.id) })
  check('对账失败置的 hold 时认领 → 409 HOLD、文案「该渠道已暂停打款（对账异常）」（D7）', phr.status === 409 && phr.json?.reason === 'HOLD' && String(phr.json?.error).startsWith('该渠道已暂停打款（对账异常）：对账失败') && /对账自检/.test(String(phr.json?.error)), phr.text)
  await call(rReturn, 'POST', sa, { params: S(s4.id), body: { reason: 'itest hold' } })
  const g8 = await gen('SCHEDULE', `rq8${RUN}`)
  check('payoutHold 时出单 → 409 HOLD、同一文案（按原因）', g8.status === 409 && g8.json?.reason === 'HOLD' && String(g8.json?.error).startsWith('该渠道已暂停打款（对账异常）：对账失败'), g8.text)
  await call(rTenant, 'PATCH', sa, { params: P(ST.id), body: { payoutHold: false } })
  check('审计：statement.* 的 publicDiff 形如 { statementNo, from, to }', (await prisma.auditEvent.findMany({ where: { tenantId: ST.id, action: { startsWith: 'statement.' }, publicDiff: { not: Prisma.DbNull } }, select: { publicDiff: true } })).every((a) => Object.keys(a.publicDiff as object).sort().join(',') === 'from,statementNo,to'))

  // =========================================================================
  section('W5-8 调账 / 保证金 / 核销 幂等')
  // =========================================================================
  {
    const rid = `adj${RUN}${randomUUID().slice(0, 8)}`
    const body = { amountCents: -500, reasonCode: 'PENALTY', reason: 'itest 内部原因', publicMemo: 'itest 可见说明', requestId: rid }
    const a1 = await call(rAdjust, 'POST', sa, { params: P(ST.id), body })
    const a2 = await call(rAdjust, 'POST', sa, { params: P(ST.id), body })
    check('调账第一次 200 OK', a1.status === 200 && a1.json?.data?.result === 'OK')
    check('同一 requestId 第二次 200「已处理」', a2.status === 200 && a2.json?.data?.result === 'DUPLICATE' && /已处理/.test(a2.json?.message ?? ''))
    check('只入账一次、只审计一次', (await prisma.tenantLedgerEntry.count({ where: { eventKey: `adj:${rid}` } })) === 1 && (await prisma.auditEvent.count({ where: { tenantId: ST.id, action: 'ledger.adjust' } })) === 1)
    check('调账审计 publicDiff 只含金额与可见说明', sameJson((await prisma.auditEvent.findFirst({ where: { tenantId: ST.id, action: 'ledger.adjust' } }))?.publicDiff, { amountCents: -500, publicMemo: 'itest 可见说明' }))
    check('调账金额为 0 → 400', (await call(rAdjust, 'POST', sa, { params: P(ST.id), body: { ...body, amountCents: 0, requestId: `z${rid}` } })).status === 400)
    const d1 = await call(rDeposit, 'POST', sa, { params: P(ST.id), body: { action: 'IN', amountCents: 200000, externalNo: `DEP${RUN}` } })
    const d2 = await call(rDeposit, 'POST', sa, { params: P(ST.id), body: { action: 'IN', amountCents: 200000, externalNo: `DEP${RUN}` } })
    check('收保证金 200，同流水号第二次「已处理」', d1.json?.data?.result === 'OK' && d2.json?.data?.result === 'DUPLICATE')
    check('保证金抵扣超过余额 → 400 INSUFFICIENT', (await call(rDeposit, 'POST', sa, { params: P(ST.id), body: { action: 'APPLY', amountCents: 999999, requestId: `ap${RUN}` } })).json?.reason === 'INSUFFICIENT')
    check('渠道回款 200', (await call(rDeposit, 'POST', sa, { params: P(ST.id), body: { action: 'REPAY', amountCents: 300, externalNo: `RP${RUN}` } })).json?.data?.result === 'OK')
    // 核销只能核掉当前的负数（终审账本 #5）：先读 Σ U（可结算预计打款），余额非负时核销 → 409 INSUFFICIENT
    const payoutNow = async () => (await call(rBalances, 'GET', sa, { params: P(ST.id) })).json?.data?.available?.payoutCents as number
    const u0 = await payoutNow()
    if (u0 >= 0) {
      const wPos = await call(rWriteoff, 'POST', sa, { params: P(ST.id), body: { amountCents: 100, reason: 'itest 核销', requestId: `wop${RUN}abcd` } })
      check('可结算不为负时核销 → 409 INSUFFICIENT、不入账', wPos.status === 409 && wPos.json?.reason === 'INSUFFICIENT' && (await prisma.tenantLedgerEntry.count({ where: { eventKey: `wo:wop${RUN}abcd` } })) === 0, wPos.text)
    }
    // 调到恰好 −10.00，再核：超过负数部分 → 409；核 1.00 → OK；同 requestId 重试 → DUPLICATE（不是 INSUFFICIENT）
    const toNeg = -1000 - u0
    if (toNeg !== 0) await call(rAdjust, 'POST', sa, { params: P(ST.id), body: { amountCents: toNeg, reasonCode: 'OTHER', reason: 'itest 造负余额', requestId: `neg${RUN}abcd` } })
    check('造负余额：可结算（预计打款）= −10.00', (await payoutNow()) === -1000)
    // 可结算为负 → 权威对账（applyHold）给渠道发 NEGATIVE_BALANCE 通知，同一天只一条（终审完整性 #17）
    const negNotices = () => prisma.tenantNotice.count({ where: { tenantId: ST.id, kind: 'NEGATIVE_BALANCE' } })
    const n0 = await negNotices()
    await call(rReconcile, 'POST', sa, { body: { tenantId: ST.id } })
    await call(rReconcile, 'POST', sa, { body: { tenantId: ST.id } })
    check('负余额 → NEGATIVE_BALANCE 通知一条（重复对账不重复发）', (await negNotices()) === n0 + 1, String((await negNotices()) - n0))
    // 本段只测通知；对账若顺带置了 hold（与本段无关），恢复原状，免得影响后面的用例（W5-9 会单独核对钱类全过）
    await prisma.tenant.update({ where: { id: ST.id }, data: { payoutHold: false, payoutHoldReason: null } })
    const wOver = await call(rWriteoff, 'POST', sa, { params: P(ST.id), body: { amountCents: 1001, reason: 'itest 核销', requestId: `woo${RUN}abcd` } })
    check('核销金额超过负数部分 → 409 INSUFFICIENT', wOver.status === 409 && wOver.json?.reason === 'INSUFFICIENT', wOver.text)
    const wo = { amountCents: 100, reason: 'itest 核销', requestId: `wo${RUN}abcd` }
    check('核销 200，同 requestId 第二次「已处理」', (await call(rWriteoff, 'POST', sa, { params: P(ST.id), body: wo })).json?.data?.result === 'OK' && (await call(rWriteoff, 'POST', sa, { params: P(ST.id), body: wo })).json?.data?.result === 'DUPLICATE')
    check('核销后可结算（预计打款）= −9.00', (await payoutNow()) === -900)
    // 恢复到造负之前的数（后面的用例不依赖它，但别让本段改变 ST 的净额）
    if (u0 + 900 !== 0) await call(rAdjust, 'POST', sa, { params: P(ST.id), body: { amountCents: u0 + 900, reasonCode: 'OTHER', reason: 'itest 还原', requestId: `rst${RUN}abcd` } })
    const led = await call(rLedger, 'GET', sa, { params: P(ST.id), path: '/api/admin/tenants/x/ledger?type=ADJUST' })
    check('超管流水带 eventKey / 内部备注 / 操作人', led.status === 200 && led.json.data.rows.some((r: any) => r.eventKey === `adj:${rid}` && r.memo === 'itest 内部原因' && r.operatorName))
    check('渠道不存在 → 404', (await call(rAdjust, 'POST', sa, { params: P(999999), body: { ...body, requestId: `x${rid}` } })).status === 404)
  }

  // =========================================================================
  section('运营概览与审计查询')
  // =========================================================================
  {
    const ov = await call(rOverview, 'GET', sa, { path: '/api/admin/tenants/overview?range=all' })
    const row = ov.json?.data?.rows?.find((r: any) => r.tenantId === ST.id)
    check('概览 200，含结算测试渠道：GMV = 5 件 × 140', ov.status === 200 && row?.gmvCents === 70000, JSON.stringify(row))
    // 设计 10.13 第四列：站长承担退款 Σ(RG − Rg) 与渠道承担损失 −Σ LOSS（终审账本 #6）；本渠道没有退款 → 都是 0
    check('概览含「站长承担退款」「渠道承担损失」两列（整数分）', Number.isInteger(row?.platformBorneRefundCents) && Number.isInteger(row?.lossCents) && row.platformBorneRefundCents >= 0, JSON.stringify(row))
    check('概览：进货款 = 5 × 110、手续费收入 = 5 × 2.10', row?.purchaseCents === 55000 && row?.feeIncomeCents === 1050)
    const lst = await call(rTenants, 'GET', sa)
    check('渠道列表 200、含余额与本月 GMV 字段', lst.status === 200 && lst.json.data.some((t: any) => t.id === ST.id && typeof t.balances?.available?.payoutCents === 'number'))
    const au = await call(rAudit, 'GET', sa, { path: `/api/admin/audit?tenantId=${ST.id}&action=statement.&summary=1` })
    check('审计查询 200：按渠道与动作前缀筛选、带汇总', au.status === 200 && au.json.data.rows.length > 0 && au.json.data.rows.every((r: any) => r.tenantId === ST.id && r.action.startsWith('statement.')) && !!au.json.data.summary)
  }

  // =========================================================================
  section('W5-9 对账自检：篡改分录 → 报错并置 payoutHold')
  // =========================================================================
  {
    const o = await mkPaidOrder(L, { tenantId: ST.id, user: buyerS, productId: pAuto, listingId: stL.id, qty: 1, release: false })
    const clean = await call(rReconcile, 'POST', sa, { body: { tenantId: ST.id, applyHold: false } })
    const moneyFails = (r: any) => (r.json?.data?.items ?? []).filter((i: any) => i.level === 'MONEY' && !i.ok).map((i: any) => i.code)
    check('篡改前钱类对账全过', clean.status === 200 && moneyFails(clean).length === 0, JSON.stringify(moneyFails(clean)))
    await prisma.tenantLedgerEntry.deleteMany({ where: { eventKey: `sale:${o.id}`, component: 'FEE' } })
    const bad = await call(rReconcile, 'POST', sa, { body: { tenantId: ST.id } })
    const l5 = (bad.json?.data?.items ?? []).find((i: any) => i.code === 'L5')
    check('删一条 FEE → L5 失败，样例含订单号', l5 && !l5.ok && l5.samples.includes(o.orderNo), JSON.stringify(l5))
    check('钱类失败 → 该渠道 payoutHold', (await prisma.tenant.findUniqueOrThrow({ where: { id: ST.id } })).payoutHold === true)
    const last = await call(rReconcile, 'GET', sa)
    check('GET 返回上一次结果', last.json?.data?.tenantId === ST.id && last.json.data.items.some((i: any) => i.code === 'L5' && !i.ok))
    check('自检写审计', (await prisma.auditEvent.count({ where: { tenantId: ST.id, action: 'reconcile.run' } })) >= 2)
  }

  // =========================================================================
  section('审查修正：数据密钥 fail closed（D8）、上架行加锁、停业必须先结清（D7）')
  // =========================================================================
  {
    const AT = await import('../../src/lib/tenant/admin-tenants')
    const Z = await mkChannel('z')
    const zAcct = `itest-z-${RUN}@example.com`
    check('Z 录入收款信息 200', (await call(rPayee, 'PUT', sa, { params: P(Z.id), body: { name: 'ITEST Z', method: 'ALIPAY', account: zAcct } })).status === 200)
    const zEnc = (await prisma.tenant.findUniqueOrThrow({ where: { id: Z.id } })).payeeAccountEnc

    // —— D8：没有数据密钥 → 录入 / 查看都 503「未配置数据密钥」，库里不变 ——
    // 同时清空 TENANT_DATA_KEY 与 JWT_SECRET：WP0 改造前 crypto 从 JWT_SECRET 派生，改造后读 TENANT_DATA_KEY，两种实现下都是「没有密钥」
    const envBak = { d: process.env.TENANT_DATA_KEY, j: process.env.JWT_SECRET }
    const errOf = async (fn: () => Promise<unknown>): Promise<any> => {
      try {
        await fn()
        return null
      } catch (e) {
        return e
      }
    }
    let eSet: any, eReveal: any
    try {
      process.env.TENANT_DATA_KEY = ''
      process.env.JWT_SECRET = ''
      eSet = await errOf(() => AT.setPayee(Z.id, { name: 'ITEST Z2', method: 'ALIPAY', account: `x${zAcct}` }, w.users.sa.id))
      eReveal = await errOf(() => AT.revealPayee(Z.id, w.users.sa.id))
    } finally {
      if (envBak.d === undefined) delete process.env.TENANT_DATA_KEY
      else process.env.TENANT_DATA_KEY = envBak.d
      if (envBak.j === undefined) delete process.env.JWT_SECRET
      else process.env.JWT_SECRET = envBak.j
    }
    check('无数据密钥：录入收款账号 → 503「未配置数据密钥」', eSet?.status === 503 && eSet?.code === 'DATA_KEY_MISSING' && /未配置数据密钥/.test(eSet?.message), String(eSet))
    check('无数据密钥：查看收款账号 → 503「未配置数据密钥」', eReveal?.status === 503 && eReveal?.code === 'DATA_KEY_MISSING', String(eReveal))
    const zAfter = await prisma.tenant.findUniqueOrThrow({ where: { id: Z.id } })
    check('失败的录入不落库（密文与收款人不变）', zAfter.payeeAccountEnc === zEnc && zAfter.payeeName === 'ITEST Z')
    check(
      'isDataKeyMissing 识别 WP0 约定的错误特征（name / code），不把解密失败当成缺密钥',
      AT.isDataKeyMissing(Object.assign(new Error('x'), { name: 'DataKeyMissingError' })) && AT.isDataKeyMissing(Object.assign(new Error('x'), { code: 'DATA_KEY_MISSING' })) && !AT.isDataKeyMissing(new Error('Unsupported state or unable to authenticate data')),
    )
    // 密文解不开（数据密钥不符 / 已轮换）→ 409，文案不再提 JWT_SECRET
    const parts = String(zEnc).split('.')
    parts[2] = Buffer.alloc(16, 7).toString('base64url')
    await prisma.tenant.update({ where: { id: Z.id }, data: { payeeAccountEnc: parts.join('.') } })
    const bad = await call(rPayee, 'POST', sa, { params: P(Z.id), body: { action: 'reveal' } })
    check('密文解不开 → 409「数据密钥不符或已轮换」，不提 JWT_SECRET', bad.status === 409 && /数据密钥不符或已轮换/.test(bad.json?.error) && !/JWT_SECRET/.test(bad.text), bad.text)
    await call(rPayee, 'PUT', sa, { params: P(Z.id), body: { name: 'ITEST Z', method: 'ALIPAY', account: zAcct } })
    await prisma.tenant.update({ where: { id: Z.id }, data: { payeeChangedAt: new Date(Date.now() - 4 * DAY) } })

    // —— 上架行加锁：站长改进货价时，渠道刚上架 / 刚改价（未提交）→ 站长的事务等锁，按最新状态判断自动下架，不回写旧售价 ——
    await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pAuto, granted: true, supplyCents: 11000 } })

    // —— 未授权上架行的审计渠道看不到（设计 5.3 / 6.3，终审隔离 #1）：逐个改进货价 / 上下限 / 代改售价、批量含隐藏行 ——
    {
      const { partnerListAudit } = await import('../../src/lib/partner-services/audit')
      await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pManual, supplyCents: 8888 } })
      await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pManual, maxRetailCents: 99900 } })
      const hid = await prisma.tenantListing.findUniqueOrThrow({ where: { tenantId_productId: { tenantId: Z.id, productId: pManual } } })
      check('前提：pManual 在 Z 是未授权行', hid.granted === false && hid.supplyCents === 8888)
      const pvh = await call(rPreview, 'POST', sa, { params: P(Z.id), body: { scope: { productIds: [pAuto, pManual] }, rule: { base: 'MANUAL', cents: 11500 }, rounding: 'NONE' } })
      const cmh = await call(rCommit, 'POST', sa, { params: P(Z.id), body: { previewToken: pvh.json?.data?.previewToken } })
      check('批量（1 可见 + 1 隐藏）提交 200、实际改了 2 行', cmh.status === 200 && cmh.json?.data?.updated === 2, cmh.text)
      const au = await partnerListAudit(Z.id, { page: 1, pageSize: 100 })
      const txt = JSON.stringify(au.rows)
      check('渠道操作日志里没有隐藏上架行的编号', !txt.includes(hid.publicNo), txt.slice(0, 400))
      const batch = au.rows.find((r) => r.action === 'listing.batch_supply')
      check('批量那条的计数只算可见行（batch:1，不是 batch:2）', batch?.targetId === 'batch:1' && Array.isArray(batch?.publicDiff) && (batch?.publicDiff as unknown[]).length === 1, JSON.stringify(batch))
      check('只动隐藏行的逐个操作一条都不出现（listing.supply / listing.range）', !au.rows.some((r) => (r.action === 'listing.supply' || r.action === 'listing.range') && r.targetId === hid.publicNo))
      const saRows = await prisma.auditEvent.count({ where: { tenantId: Z.id, targetType: 'listing_hidden', targetId: hid.publicNo } })
      check('超管审计照常可查（targetType = listing_hidden）', saRows >= 2, String(saRows))
      await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pAuto, supplyCents: 11000 } })
    }
    const zl = await prisma.tenantListing.findUniqueOrThrow({ where: { tenantId_productId: { tenantId: Z.id, productId: pAuto } } })
    await prisma.tenantListing.update({ where: { id: zl.id }, data: { retailCents: 14000, status: 0 } })
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const holder = prisma.$transaction(
      async (tx) => {
        // 模拟渠道：上架并把售价改成 120（渠道侧不动 supplyVersion）
        await tx.tenantListing.update({ where: { id: zl.id }, data: { status: 1, retailCents: 12000 } })
        await gate
      },
      { timeout: 30_000, maxWait: 10_000 },
    )
    await new Promise((r) => setTimeout(r, 300))
    const adminP = call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pAuto, supplyCents: 13000 } })
    await new Promise((r) => setTimeout(r, 500))
    release()
    await holder
    const ra = await adminP
    const zl2 = await prisma.tenantListing.findUniqueOrThrow({ where: { id: zl.id } })
    check('并发：站长改进货价 130 等渠道提交后按最新状态判断 → 自动下架', ra.status === 200 && ra.json?.data?.delisted === true && zl2.status === 0 && zl2.delistedReason === 'SUPPLY_ABOVE_RETAIL', `${ra.text} ${zl2.status} ${zl2.delistedReason}`)
    check('并发：渠道刚改的售价 120 没有被站长的写入覆盖', zl2.retailCents === 12000 && zl2.supplyCents === 13000)
    const v0 = zl2.supplyVersion
    await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pAuto, maxRetailCents: 50000 } })
    const zl3 = await prisma.tenantListing.findUniqueOrThrow({ where: { id: zl.id } })
    check('只改售价上限：版本 +1（渠道基于旧前提的上架 CAS 失败），售价 / 进货价不动', zl3.supplyVersion === v0 + 1 && zl3.retailCents === 12000 && zl3.supplyCents === 13000 && zl3.maxRetailCents === 50000)
    // 批量提交同样先锁：预览之后渠道上架（不动版本）→ 提交时按最新 status 下架
    await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pAuto, supplyCents: 11000 } })
    await prisma.tenantListing.update({ where: { id: zl.id }, data: { status: 0, retailCents: 14000, delistedReason: null } })
    const pv = await call(rPreview, 'POST', sa, { params: P(Z.id), body: { scope: { productIds: [pAuto] }, rule: { base: 'MANUAL', cents: 15000 }, rounding: 'NONE' } })
    check('批量预览：当时未上架 → 不标「将下架」', pv.status === 200 && rowOf(pv, pAuto)?.willDelist === false, pv.text.slice(0, 300))
    await prisma.tenantListing.update({ where: { id: zl.id }, data: { status: 1 } })
    const cm = await call(rCommit, 'POST', sa, { params: P(Z.id), body: { previewToken: pv.json?.data?.previewToken } })
    const zl4 = await prisma.tenantListing.findUniqueOrThrow({ where: { id: zl.id } })
    check('批量提交按提交时的最新状态自动下架', cm.status === 200 && cm.json?.data?.delisted === 1 && zl4.status === 0 && zl4.delistedReason === 'SUPPLY_ABOVE_RETAIL', cm.text)

    // —— 停业必须先结清（D7）——
    await call(rListings, 'PUT', sa, { params: P(Z.id), body: { productId: pAuto, supplyCents: 11000 } })
    await prisma.tenantListing.update({ where: { id: zl.id }, data: { status: 1, retailCents: 14000, delistedReason: null } })
    const buyerZ = await createUser('w5-buyer-z')
    await mkPaidOrder(L, { tenantId: Z.id, user: buyerZ, productId: pAuto, listingId: zl.id, qty: 1 })
    const gz = await call(rStmts, 'POST', sa, { params: P(Z.id), body: { origin: 'MANUAL', requestId: `rqz${RUN}`, periodEnd: new Date(Date.now() + 1000).toISOString() } })
    check('Z 出最后一期（MANUAL）结算单 200', gz.status === 200, gz.text)
    const term = () => call(rTenant, 'PATCH', sa, { params: P(Z.id), body: { status: 'TERMINATED' } })
    const t1 = await term()
    check('有未完结结算单 → TERMINATED 409 OPEN_STATEMENT', t1.status === 409 && t1.json?.reason === 'OPEN_STATEMENT', t1.text)
    const zs = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: gz.json?.data?.statementNo } })
    await call(rReturn, 'POST', sa, { params: S(zs.id), body: { reason: 'itest 终止前退回' } })
    const t2 = await term()
    // 结清判据是「预计打款」（余额 30.00 − 手续费 2.10 = 27.90，设计 10.11），不是余额（终审账本 #4）
    check('未结清 → TERMINATED 409 UNSETTLED，列出可结算（预计打款）', t2.status === 409 && t2.json?.reason === 'UNSETTLED' && /可结算（预计打款） 27\.90 元/.test(t2.json?.error), t2.text)
    check('被拦时状态不变', (await prisma.tenant.findUniqueOrThrow({ where: { id: Z.id } })).status === 'ACTIVE')
    // 余额恰好 0、手续费分录没冲平（预计打款 −2.10）：旧口径只看余额会放行终止，新口径必须拦
    await prisma.tenantLedgerEntry.create({
      data: { tenantId: Z.id, eventKey: `itest-zero-bal:${RUN}`, leg: 'a', type: 'ADJUST', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: -3000, memo: 'itest 余额置 0' },
    })
    const tz = await term()
    check('余额 0 但预计打款 −2.10 → 仍 409 UNSETTLED', tz.status === 409 && tz.json?.reason === 'UNSETTLED' && /可结算（预计打款） -2\.10 元/.test(tz.json?.error), tz.text)
    const t3 = await call(rTenant, 'PATCH', sa, { params: P(Z.id), body: { status: 'TERMINATED', forceUnsettled: true } })
    const zau = await prisma.auditEvent.findFirst({ where: { tenantId: Z.id, action: 'tenant.status' }, orderBy: { id: 'desc' } })
    check(
      'forceUnsettled → 200，审计 diff 记下强制与预计打款快照，publicDiff 仍只有 from / to',
      t3.status === 200 && (zau?.diff as any)?.forceUnsettled === true && (zau?.diff as any)?.unsettledCents?.['可结算（预计打款）'] === -210 && sameJson(zau?.publicDiff, { from: 'ACTIVE', to: 'TERMINATED' }),
      JSON.stringify(zau?.diff),
    )
    check('非法字段仍被 strict 拒绝', (await call(rTenant, 'PATCH', sa, { params: P(Z.id), body: { foo: 1 } })).status === 400)
  }
}

main()
  .catch((e) => {
    console.error(e)
    check('未捕获异常', false, String((e as Error)?.stack || e))
  })
  .finally(async () => {
    try {
      await cleanupAll()
    } catch (e) {
      console.error('清理失败', e)
    }
    try {
      rmSync(PRIVATE_DIR, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
    const r = summary()
    await prisma.$disconnect()
    process.exit(r.fail === 0 ? 0 : 1)
  })
