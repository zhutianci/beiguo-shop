/**
 * WP6 集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp6.ts
 *
 * 直接 import src/app/api/partner/** 的 route.ts，经 _harness.callRoute 在假的 Next 请求作用域里调用
 * （partnerRoute 守卫、店面解析、getCurrentUser 全部真实执行）。覆盖实施分包 9.5：
 *   W6-1  本包每个路由 × 5 种身份 × 按寻址键分类的键（本渠道 / zz / 主站 / 随机 / 自增数字）；他站键写接口数据库不变
 *   W6-2  T8：PATCH / 批量接口 body 塞 supplyCents / granted / tenantId / productId → 忽略，数据库不变
 *   W6-3  T9：低于进货价、= 0、0.4 元按到元取整为 0、低于下限
 *   W6-4  T25：预览后站长改进货价 → commit 该行 VERSION_CHANGED
 *   W6-5  批量接口 11 次 / 分钟 → 429；201 行 → 400
 *   W6-6  T24：/cards 只给本渠道 USED 卡；按卡密搜 zz 的卡、未售卡、不存在的卡响应相同；每次查看一条 card.view
 *   W6-7  T10：详情 / 列表 / 导出 / 卡密 / 看板 / 商品池等响应键名与值扫描
 *   W6-7a T22：lulu 的邀请在 zz 的 Host 上接受 → 404、不产生成员；过期 / 已用 / 吊销 / 邮箱不符 / ADMIN 全部拒绝
 *   W6-8  「先租户后匹配」：主站订单号、主站买家邮箱搜索 total=0，与不存在一致
 *   W6-9  留言：渠道回复落库口径（sender=ADMIN / senderRole=PARTNER）、买家留言 readByTenant、readByAdmin 不变
 *   W6-10 售后：同类型重复 409；ESCALATE 置 escalatedAt 并推平台群；取消只对 PENDING 有效；全局封禁申请（WP7 用）
 *   W6-11 导出：第 11 次 429 且写审计；首行水印；不含卡密与交付信息
 *   W6-12 页面守卫（静态文本 + 进程内）：无 'use client'、调用 requirePartnerPage / requireChannelStorefrontPage；
 *         未登录访问 login 不重定向；未登录访问成员页 → /partner/login；主站 Host → 404
 * 另：主站 Host / 休眠期全部路由 404（T5）；SUSPENDED 读可写不可；DRAFT 只放行 DRAFT_SAFE 权限点。
 * 说明：看板与订单详情里的结算数字来自 WP3 的 partner-facade，数值对齐（设计 10.11 ②）属于 WP3 × WP6 联调，这里只校验形状与键名。
 */
import { createHash, randomBytes } from 'crypto'
import { readFileSync, readdirSync, statSync } from 'fs'
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
  withRequest,
  catchNext,
  collectKeys,
  createUser,
  MARK,
  RUN,
  type RouteFn,
  type World,
  type WorldTenant,
  type WorldUser,
} from './_harness'
import { invalidateStorefrontCache } from '../../src/lib/storefront/resolve'
import { requireChannelStorefrontPage, requirePartnerPage } from '../../src/lib/tenant/partner-page'
import { PARTNER_ALLOWED_KEYS, PARTNER_CONTEXTUAL_KEYS, PARTNER_FORBIDDEN_KEYS } from '../../src/lib/partner-services/selects'
import { PARTNER_NOT_FOUND_BODY } from '../../src/lib/tenant/types'
import { partnerRequestBan } from '../../src/lib/partner-services/after-sales'
import { partnerListOrders } from '../../src/lib/partner-services/orders'

import * as rDashboard from '../../src/app/api/partner/dashboard/route'
import * as rCatalog from '../../src/app/api/partner/catalog/route'
import * as rListing from '../../src/app/api/partner/listings/[listingNo]/route'
import * as rListingStatus from '../../src/app/api/partner/listings/status/route'
import * as rPreview from '../../src/app/api/partner/listings/price/preview/route'
import * as rCommit from '../../src/app/api/partner/listings/price/commit/route'
import * as rOrders from '../../src/app/api/partner/orders/route'
import * as rExport from '../../src/app/api/partner/orders/export/route'
import * as rOrder from '../../src/app/api/partner/orders/[orderNo]/route'
import * as rCards from '../../src/app/api/partner/orders/[orderNo]/cards/route'
import * as rMessages from '../../src/app/api/partner/orders/[orderNo]/messages/route'
import * as rRead from '../../src/app/api/partner/orders/[orderNo]/read/route'
import * as rOrderAS from '../../src/app/api/partner/orders/[orderNo]/after-sales/route'
import * as rAfterSales from '../../src/app/api/partner/after-sales/route'
import * as rCancel from '../../src/app/api/partner/after-sales/[requestNo]/cancel/route'
import * as rInvite from '../../src/app/api/partner/invite/accept/route'

const RUN_START = new Date()

// ---------------------------------------------------------------------------
// 调用助手：每次请求换一个客户端 IP（partnerRoute 按 IP 限流 120 次 / 分钟，矩阵测试会超）
// ---------------------------------------------------------------------------
let ipSeq = 0
function nextIp(): string {
  ipSeq++
  return `10.66.${(ipSeq >> 8) & 255}.${ipSeq & 255}`
}

type Who = { host: string; token?: string | null }
async function call(
  route: RouteFn,
  who: Who,
  o: { method?: string; path?: string; body?: unknown; params?: Record<string, string>; headers?: Record<string, string> } = {},
) {
  return callRoute(route, {
    host: who.host,
    token: who.token ?? null,
    method: o.method,
    path: o.path,
    body: o.body,
    params: o.params,
    headers: { 'cf-connecting-ip': nextIp(), ...(o.headers || {}) },
  })
}

const notFoundText = JSON.stringify(PARTNER_NOT_FOUND_BODY)
const isNotFound = (r: { status: number; text: string }) => r.status === 404 && r.text === notFoundText
/**
 * 「视为未登录」或「当不存在」都算拒绝：WP1 上线按店面校验 aud 之后，SA 在渠道 Host、zz 的令牌拿到 lulu Host
 * 都由 getCurrentUser 直接判为未登录（401，T2 / T3）；WP1 之前走 partnerRoute 的 ADMIN / 非成员分支（404）。两者都不给任何数据。
 */
const isDenied = (r: { status: number; text: string }) => isNotFound(r) || r.status === 401

// ---------------------------------------------------------------------------
// T10 键名 / 值扫描
// ---------------------------------------------------------------------------
/**
 * 允许 phone 出现的父键：WP0 登记了 sms / invoices；订单详情的 invoiceInfo（结账开票草稿，含电话）同样是本站订单的开票信息，
 * 设计 6.4.1 对渠道明文可见——已请 WP0 把 'invoiceInfo' 加进 PARTNER_CONTEXTUAL_KEYS.phone，这里先按同口径放行。
 */
const PHONE_PARENTS = new Set<string>([...(PARTNER_CONTEXTUAL_KEYS.phone ?? []), 'invoiceInfo'])

function scanKeys(label: string, json: unknown, opts: { cards?: boolean } = {}): void {
  const bad: string[] = []
  collectKeys(json).forEach(({ key, parent }) => {
    if (key === 'phone') {
      if (!PHONE_PARENTS.has(parent)) bad.push(`${parent}.phone`)
      return
    }
    if (key === 'deliveryInfo') {
      if (!opts.cards || parent !== 'data') bad.push(`${parent}.deliveryInfo`)
      return
    }
    if (PARTNER_FORBIDDEN_KEYS.has(key)) bad.push(`禁用键 ${parent}.${key}`)
    else if (!PARTNER_ALLOWED_KEYS.has(key)) bad.push(`未登记键 ${parent}.${key}`)
  })
  check(`T10 键名：${label}`, bad.length === 0, bad.slice(0, 8).join('；'))
}

function scanValues(label: string, text: string, w: World, opts: { cards?: boolean } = {}): void {
  const hits: string[] = []
  const forbid = [MARK.cardCost, MARK.smsCost, String(MARK.costBaseCents), w.users.zzBuyer1.email, w.users.zzBuyer2.email, w.users.zzOwner.email, 'itest-raw', 'IT-ACT-', '10.9.8.7', `IT-REQ-${RUN}`, `IT-REF-${RUN}`]
  if (!opts.cards) forbid.push(MARK.deliveryInfo, MARK.smsCode, MARK.cardPlain)
  forbid.forEach((v) => {
    if (text.includes(v)) hits.push(v)
  })
  check(`T10 值：${label}`, hits.length === 0, hits.join('、'))
}

// ---------------------------------------------------------------------------
// 夹具补充
// ---------------------------------------------------------------------------
async function addMember(t: WorldTenant, name: string, role: 'OWNER' | 'STAFF', perms?: string[]): Promise<WorldUser> {
  const u = await createUser(name, { registeredTenantId: t.id })
  await prisma.tenantMember.create({ data: { tenantId: t.id, userId: u.id, role, status: 1, ...(perms ? { perms } : {}) } })
  return u
}

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex')

async function makeInvite(t: WorldTenant, email: string, invitedBy: number, extra: Partial<Prisma.TenantInviteUncheckedCreateInput> = {}): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await prisma.tenantInvite.create({
    data: {
      tenantId: t.id,
      emailHash: sha(email.toLowerCase()),
      tokenHash: sha(token),
      role: 'OWNER',
      expiresAt: new Date(Date.now() + 24 * 3600_000),
      invitedBy,
      ...extra,
    },
  })
  return token
}

// ---------------------------------------------------------------------------
async function main() {
  setChannelsMode('observe')
  invalidateStorefrontCache()
  await cleanupAll()
  const w = await createWorld()
  const L = w.lulu
  const Z = w.zz
  const owner: Who = { host: L.host, token: w.token(w.users.luluOwner, L) }
  const buyer: Who = { host: L.host, token: w.token(w.users.luluBuyer1, L) }
  const sa: Who = { host: L.host, token: w.token(w.users.sa, L) }
  const anon: Who = { host: L.host }
  const zzOwnerOnLulu: Who = { host: L.host, token: w.token(w.users.zzOwner, Z) }
  const zzOwner: Who = { host: Z.host, token: w.token(w.users.zzOwner, Z) }

  // 结账开票草稿（含电话，验证 invoiceInfo 白名单输出）与一张 zz 的已售卡、一张 lulu 的未付单
  await prisma.order.update({
    where: { id: w.orders.luluAuto.id },
    data: { invoiceInfo: JSON.stringify({ title: 'ITEST 抬头', taxNumber: '91110000ITEST', phone: '010-1', email: 'inv@itest-tenant.local', secretInternal: 'X' }) },
  })
  const { encryptCardContent, cardContentHash } = await import('../../src/lib/cardkey')
  const zzCardPlain = `ITEST-ZZCARD-${RUN}`
  await prisma.cardKey.create({
    data: { productId: w.products.auto, content: encryptCardContent(zzCardPlain), contentHash: cardContentHash(zzCardPlain), status: 'USED', orderId: w.orders.zzAuto.id, usedAt: new Date(), cost: new Prisma.Decimal(MARK.cardCost) },
  })
  const unpaid = await prisma.order.create({
    data: {
      orderNo: `IU${RUN.toUpperCase()}`.slice(0, 32),
      userId: w.users.luluBuyer2.id,
      productId: w.products.auto,
      productName: 'ITEST 未付单',
      productPrice: new Prisma.Decimal('140.00'),
      quantity: 1,
      amount: new Prisma.Decimal('140.00'),
      tenantId: L.id,
      supplyCents: MARK.supplyCents,
      feeRateBp: 150,
      invoiceShareRateBp: 200,
      settleHoldDays: 7,
    },
    select: { id: true, orderNo: true },
  })
  // zz 的一条售后申请（取消他站申请号时校验数据库不变）
  const zzReqNo = `AS${'260926'}${randomBytes(4).toString('hex').toUpperCase().replace(/[ILOU]/g, 'X')}`.slice(0, 16)
  await prisma.tenantAfterSale.create({ data: { requestNo: zzReqNo, tenantId: Z.id, orderId: w.orders.zzAuto.id, kind: 'REFUND', activeKey: `o:${w.orders.zzAuto.id}:REFUND`, reason: 'itest zz 申请', status: 'PENDING' } })

  // =======================================================================
  section('休眠期与主站 Host：全部路由 404（T5 / M11）')
  {
    const all: [string, RouteFn, string, Record<string, string>][] = [
      ['GET dashboard', rDashboard.GET, 'GET', {}],
      ['GET catalog', rCatalog.GET, 'GET', {}],
      ['PATCH listing', rListing.PATCH, 'PATCH', { listingNo: w.listings.luluAuto }],
      ['GET orders', rOrders.GET, 'GET', {}],
      ['GET order', rOrder.GET, 'GET', { orderNo: w.orders.luluAuto.orderNo }],
      ['GET cards', rCards.GET, 'GET', { orderNo: w.orders.luluAuto.orderNo }],
      ['GET after-sales', rAfterSales.GET, 'GET', {}],
    ]
    for (const [name, fn, method, params] of all) {
      const r = await call(fn, { host: 'bigolab.com', token: w.token(w.users.luluOwner, L) }, { method, params, body: method === 'PATCH' ? { sortOrder: 1 } : undefined })
      check(`主站 Host ${name} → 404`, isNotFound(r), `status=${r.status}`)
    }
    setChannelsMode('dormant')
    invalidateStorefrontCache()
    const r = await call(rOrders.GET, owner)
    check('休眠期 lulu Host GET orders → 404（店面恒为主站）', isNotFound(r), `status=${r.status}`)
    const inv = await call(rInvite.POST as unknown as RouteFn, owner, { method: 'POST', body: { token: 'x'.repeat(40) } })
    check('休眠期 invite/accept → 404', isNotFound(inv))
    setChannelsMode('observe')
    invalidateStorefrontCache()
  }

  // =======================================================================
  section('W6-1 身份 × 寻址键矩阵')
  {
    const orderKeys: [string, string, boolean][] = [
      ['本渠道', w.orders.luluAuto.orderNo, true],
      ['zz 的', w.orders.zzAuto.orderNo, false],
      ['主站的', w.orders.crossMain.orderNo, false],
      ['随机', `IT${randomBytes(6).toString('hex').toUpperCase()}`, false],
      ['自增数字', String(w.orders.luluAuto.id), false],
    ]
    const listingKeys: [string, string, boolean][] = [
      ['本渠道', w.listings.luluAuto, true],
      ['zz 的', w.listings.zzAuto, false],
      ['随机', 'ZZZZZZZZZZZZ', false],
      ['自增数字', '1', false],
    ]
    const orderRoutes: [string, RouteFn][] = [
      ['GET orders/[orderNo]', rOrder.GET],
      ['GET orders/[orderNo]/cards', rCards.GET],
      ['GET orders/[orderNo]/messages', rMessages.GET],
    ]
    const bodies = new Set<string>()
    for (const [rn, fn] of orderRoutes) {
      for (const [kn, key, own] of orderKeys) {
        const r = await call(fn, owner, { params: { orderNo: key } })
        if (own) check(`${rn} OWNER × ${kn} → 200`, r.status === 200, `status=${r.status} ${r.text.slice(0, 120)}`)
        else {
          check(`${rn} OWNER × ${kn} → 404`, isNotFound(r), `status=${r.status}`)
          bodies.add(r.text)
        }
      }
      const key = w.orders.luluAuto.orderNo
      const rb = await call(fn, buyer, { params: { orderNo: key } })
      check(`${rn} 买家 → 404`, isNotFound(rb))
      const rs = await call(fn, sa, { params: { orderNo: key } })
      check(`${rn} SA → 401 / 404`, isDenied(rs), `status=${rs.status}`)
      const ra = await call(fn, anon, { params: { orderNo: key } })
      check(`${rn} 匿名 → 401`, ra.status === 401)
      const rz = await call(fn, zzOwnerOnLulu, { params: { orderNo: key } })
      check(`${rn} zz 的 OWNER（在 lulu Host）→ 401 / 404`, isDenied(rz), `status=${rz.status}`)
      const rz2 = await call(fn, zzOwner, { params: { orderNo: key } })
      check(`${rn} zz 的 OWNER（在 zz Host 用 lulu 单号）→ 404`, isNotFound(rz2))
    }
    for (const [rn, fn] of [
      ['GET orders', rOrders.GET],
      ['GET catalog', rCatalog.GET],
      ['GET dashboard', rDashboard.GET],
      ['GET after-sales', rAfterSales.GET],
    ] as [string, RouteFn][]) {
      check(`${rn} OWNER → 200`, (await call(fn, owner)).status === 200)
      check(`${rn} 买家 → 404`, isNotFound(await call(fn, buyer)))
      check(`${rn} SA → 401 / 404`, isDenied(await call(fn, sa)))
      check(`${rn} 匿名 → 401`, (await call(fn, anon)).status === 401)
      check(`${rn} zz 的 OWNER → 401 / 404`, isDenied(await call(fn, zzOwnerOnLulu)))
    }
    // listingNo 键：PATCH（写接口）他站键 → 404 且数据库不变
    const zzBefore = await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.zzAuto } })
    for (const [kn, key, own] of listingKeys) {
      const r = await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: key }, body: { sortOrder: 7 } })
      if (own) check(`PATCH listings OWNER × ${kn} → 200`, r.status === 200, `status=${r.status} ${r.text.slice(0, 160)}`)
      else {
        check(`PATCH listings OWNER × ${kn} → 404`, isNotFound(r), `status=${r.status}`)
        bodies.add(r.text)
      }
    }
    const zzAfter = await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.zzAuto } })
    check('用 zz 的 listingNo 写：zz 的上架行不变', JSON.stringify(zzBefore) === JSON.stringify(zzAfter))
    check('PATCH listings 买家 → 404', isNotFound(await call(rListing.PATCH, buyer, { method: 'PATCH', params: { listingNo: w.listings.luluAuto }, body: { sortOrder: 1 } })))
    check('PATCH listings 匿名 → 401', (await call(rListing.PATCH, anon, { method: 'PATCH', params: { listingNo: w.listings.luluAuto }, body: { sortOrder: 1 } })).status === 401)
    // requestNo 键：cancel 他站 → 404 且 zz 的申请不变
    const cz = await call(rCancel.POST, owner, { method: 'POST', params: { requestNo: zzReqNo } })
    check('cancel zz 的 requestNo → 404', isNotFound(cz))
    check('cancel 随机 requestNo → 404', isNotFound(await call(rCancel.POST, owner, { method: 'POST', params: { requestNo: 'AS260926ZZZZZZZZ' } })))
    check('cancel 自增数字 → 404', isNotFound(await call(rCancel.POST, owner, { method: 'POST', params: { requestNo: '1' } })))
    check('zz 的申请仍是 PENDING', (await prisma.tenantAfterSale.findUnique({ where: { requestNo: zzReqNo } }))?.status === 'PENDING')
    // 写接口用他站 orderNo：留言 / 已读 / 发起售后 → 404 且无写入
    const zzMsgBefore = await prisma.orderMessage.count({ where: { orderId: w.orders.zzAuto.id } })
    check('POST messages 用 zz 单号 → 404', isNotFound(await call(rMessages.POST, owner, { method: 'POST', params: { orderNo: w.orders.zzAuto.orderNo }, body: { messageText: 'x' } })))
    check('POST read 用 zz 单号 → 404', isNotFound(await call(rRead.POST, owner, { method: 'POST', params: { orderNo: w.orders.zzAuto.orderNo } })))
    check('POST after-sales 用主站单号 → 404', isNotFound(await call(rOrderAS.POST, owner, { method: 'POST', params: { orderNo: w.orders.crossMain.orderNo }, body: { kind: 'ESCALATE', reason: '跨站试探一下' } })))
    check('zz 的订单留言数不变', (await prisma.orderMessage.count({ where: { orderId: w.orders.zzAuto.id } })) === zzMsgBefore)
    check('主站订单没有售后申请', (await prisma.tenantAfterSale.count({ where: { orderId: w.orders.crossMain.id } })) === 0)
    check('「不存在」与「不是你的」响应体完全相同', bodies.size === 1 && bodies.has(notFoundText), Array.from(bodies).join(' | ').slice(0, 200))
  }

  // =======================================================================
  section('W6-2 T8：body 塞内部字段被忽略')
  {
    const before = await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.luluManual } })
    const r = await call(rListing.PATCH, owner, {
      method: 'PATCH',
      params: { listingNo: w.listings.luluManual },
      body: { retailYuan: '150.00', supplyCents: 1, granted: false, tenantId: Z.id, productId: w.products.sms, minRetailCents: 0, supplyVersion: 99 },
    })
    check('PATCH 带内部字段 → 200（未知键被丢弃）', r.status === 200, r.text.slice(0, 200))
    const after = await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.luluManual } })
    check(
      '只改了售价：进货价 / 授权 / 渠道 / 商品 / 下限 / 版本都不变',
      !!before &&
        !!after &&
        after.retailCents === 15000 &&
        after.supplyCents === before.supplyCents &&
        after.granted === before.granted &&
        after.tenantId === before.tenantId &&
        after.productId === before.productId &&
        after.minRetailCents === before.minRetailCents &&
        after.supplyVersion === before.supplyVersion,
    )
    check('PATCH 响应是 PartnerListingDTO（retailCents=15000）', r.json?.data?.retailCents === 15000 && r.json?.data?.listingNo === w.listings.luluManual)
    scanKeys('PATCH listings 响应', r.json)
    const st = await call(rListingStatus.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluManual], status: 1, tenantId: Z.id, granted: true } })
    check('批量上下架带内部字段 → 200', st.status === 200)
    check('zz 的上架行没有被波及', (await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.zzAuto } }))?.retailCents === 14500)
    const nothing = await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluManual }, body: { supplyCents: 1 } })
    check('只带内部字段 → 400（没有可改内容）', nothing.status === 400)
    const textPlain = await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluManual }, body: '{"retailYuan":"160"}', headers: { 'content-type': 'text/plain' } })
    check('text/plain 请求体 → 拒绝', textPlain.status === 404 || textPlain.status === 400)
  }

  // =======================================================================
  section('W6-3 T9：售价校验（取整之后再校验）')
  {
    const p = (body: unknown) => call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluAuto }, body })
    let r = await p({ retailYuan: '110.36' })
    check('售价 < 进货价（110.36 < 110.37）→ 400 BELOW_SUPPLY', r.status === 400 && r.json?.reason === 'BELOW_SUPPLY', r.text)
    r = await p({ retailYuan: '0' })
    check('售价 = 0 → 400 NOT_PRICED', r.status === 400 && r.json?.reason === 'NOT_PRICED', r.text)
    r = await p({ retailYuan: '12.345' })
    check('三位小数 → 400', r.status === 400)
    r = await p({ retailYuan: '-5' })
    check('负数 → 400', r.status === 400)
    await prisma.tenantListing.updateMany({ where: { publicNo: w.listings.luluAuto }, data: { minRetailCents: 15000 } })
    r = await p({ retailYuan: '145' })
    check('低于站长设的下限 → 400 OUT_OF_RANGE', r.status === 400 && r.json?.reason === 'OUT_OF_RANGE', r.text)
    await prisma.tenantListing.updateMany({ where: { publicNo: w.listings.luluAuto }, data: { minRetailCents: null } })
    check('被拒后售价不变（仍 14000）', (await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.luluAuto } }))?.retailCents === 14000)

    // 批量预览：0.4 元一口价按到元取整 = 0 → 拒绝；低于进货价 → 拒绝
    const rule = { listingNos: [w.listings.luluAuto, w.listings.luluSms], mode: 'FIXED', value: '0.4', rounding: 'YUAN' }
    const pv = await call(rPreview.POST, owner, { method: 'POST', body: rule })
    const rows = (pv.json?.data?.rows ?? []) as { listingNo: string; newRetailCents: number | null; reject?: string }[]
    check('预览 0.4 元按到元取整 → 新售价 0 且标 NOT_PRICED', rows.length === 2 && rows.every((x) => x.newRetailCents === 0 && x.reject === 'NOT_PRICED'), JSON.stringify(rows))
    scanKeys('预览响应', pv.json)
    const cm = await call(rCommit.POST, owner, { method: 'POST', body: { ...rule, previewToken: pv.json?.data?.previewToken } })
    check('提交：全部跳过、updated=0', cm.status === 200 && cm.json?.data?.updated === 0 && cm.json?.data?.skipped?.length === 2, cm.text)
    const pv2 = await call(rPreview.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluSms], mode: 'FIXED', value: '9.99', rounding: 'NONE' } })
    check('一口价 9.99 低于进货价 10.00 → BELOW_SUPPLY', pv2.json?.data?.rows?.[0]?.reject === 'BELOW_SUPPLY')
    const pv3 = await call(rPreview.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluSms], mode: 'MARKUP_PCT', value: '12.5', rounding: 'JIAO' } })
    const row3 = pv3.json?.data?.rows?.[0]
    // 1000 × 1.125 = 1125 → 到角 1130；单件余额 130；单件预计打款 1130 − mulBps(1130,150)=17 − 1000 = 113
    check('加价 12.5% 到角：1000 → 1130，余额 130，预计打款 113', row3?.newRetailCents === 1130 && row3?.unitBalanceCents === 130 && row3?.unitPayoutCents === 113, JSON.stringify(row3))
    const cm3 = await call(rCommit.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluSms], mode: 'MARKUP_PCT', value: '12.5', rounding: 'JIAO', previewToken: pv3.json?.data?.previewToken } })
    check('提交成功 updated=1', cm3.json?.data?.updated === 1, cm3.text)
    check('库里售价 = 1130', (await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.luluSms } }))?.retailCents === 1130)
    const tampered = await call(rCommit.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluSms], mode: 'MARKUP_PCT', value: '50', rounding: 'JIAO', previewToken: pv3.json?.data?.previewToken } })
    check('令牌与提交参数不一致（改了数值）→ 400', tampered.status === 400)
    const forged = await call(rCommit.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluSms], mode: 'MARKUP_PCT', value: '12.5', rounding: 'JIAO', previewToken: 'A'.repeat(80) } })
    check('伪造令牌 → 400', forged.status === 400)
    const zzUse = await call(rCommit.POST, zzOwner, { method: 'POST', body: { listingNos: [w.listings.luluSms], mode: 'MARKUP_PCT', value: '12.5', rounding: 'JIAO', previewToken: pv3.json?.data?.previewToken } })
    check('zz 拿 lulu 的令牌提交 → 400', zzUse.status === 400)
    check('令牌里看不到内部 id / 版本号（加密）', typeof pv3.json?.data?.previewToken === 'string' && !Buffer.from(pv3.json.data.previewToken, 'base64url').toString('utf8').includes('"r"'))
    // 上架校验：未定价不能上架
    await prisma.tenantListing.updateMany({ where: { publicNo: w.listings.luluManual }, data: { status: 0, retailCents: null } })
    const up = await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluManual }, body: { status: 1 } })
    check('未定价上架 → 400 NOT_PRICED', up.status === 400 && up.json?.reason === 'NOT_PRICED', up.text)
    const bs = await call(rListingStatus.POST, owner, { method: 'POST', body: { listingNos: [w.listings.luluManual, w.listings.zzAuto], status: 1 } })
    const rej = (bs.json?.data?.rejected ?? []) as { listingNo: string; reason: string }[]
    check('批量上架：未定价行拒绝、他站编号按不存在拒绝', bs.json?.data?.updated === 0 && rej.some((x) => x.listingNo === w.listings.luluManual && x.reason === 'NOT_PRICED') && rej.some((x) => x.listingNo === w.listings.zzAuto && x.reason === 'NOT_LISTED'), bs.text)
    await prisma.tenantListing.updateMany({ where: { publicNo: w.listings.luluManual }, data: { status: 1, retailCents: 14000 } })
  }

  // =======================================================================
  section('W6-4 T25：预览后站长改进货价 → VERSION_CHANGED')
  {
    const rule = { listingNos: [w.listings.luluAuto], mode: 'MARKUP_FIXED', value: '30', rounding: 'NONE' }
    const pv = await call(rPreview.POST, owner, { method: 'POST', body: rule })
    check('预览新售价 = 11037 + 3000 = 14037', pv.json?.data?.rows?.[0]?.newRetailCents === 14037, pv.text.slice(0, 200))
    await prisma.tenantListing.updateMany({ where: { publicNo: w.listings.luluAuto }, data: { supplyCents: 11100, supplyVersion: { increment: 1 } } })
    const cm = await call(rCommit.POST, owner, { method: 'POST', body: { ...rule, previewToken: pv.json?.data?.previewToken } })
    check('提交：该行 VERSION_CHANGED、updated=0', cm.json?.data?.updated === 0 && cm.json?.data?.skipped?.[0]?.reason === 'VERSION_CHANGED', cm.text)
    check('售价未被改动（仍 14000）', (await prisma.tenantListing.findFirst({ where: { publicNo: w.listings.luluAuto } }))?.retailCents === 14000)
    // 单品 PATCH 同样按 supplyVersion CAS：读到之后被改 → 这里无法制造竞态，至少验证改价后按新进货价校验
    const r = await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluAuto }, body: { retailYuan: '110.50' } })
    check('进货价调到 111.00 后，110.50 → 400 BELOW_SUPPLY', r.status === 400 && r.json?.reason === 'BELOW_SUPPLY')
    await prisma.tenantListing.updateMany({ where: { publicNo: w.listings.luluAuto }, data: { supplyCents: MARK.supplyCents, supplyVersion: { increment: 1 } } })
  }

  // =======================================================================
  section('W6-5 批量接口限频与行数上限')
  {
    const o2 = await addMember(L, 'lulu-owner2', 'OWNER')
    const who: Who = { host: L.host, token: w.token(o2, L) }
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const r = await call(rListingStatus.POST, who, { method: 'POST', body: { listingNos: [w.listings.luluManual], status: 1 } })
      statuses.push(r.status)
    }
    check('批量上下架：前 10 次 200、第 11 次 429', statuses.slice(0, 10).every((s) => s === 200) && statuses[10] === 429, statuses.join(','))
    const cstat: number[] = []
    for (let i = 0; i < 11; i++) {
      const r = await call(rCommit.POST, who, { method: 'POST', body: { listingNos: [w.listings.luluManual], mode: 'FIXED', value: '140', rounding: 'NONE', previewToken: 'B'.repeat(60) } })
      cstat.push(r.status)
    }
    check('批量改价提交：前 10 次到达 handler（令牌无效 400）、第 11 次 429', cstat.slice(0, 10).every((s) => s === 400) && cstat[10] === 429, cstat.join(','))
    const many = Array.from({ length: 201 }, () => 'ZZZZZZZZZZZZ')
    const o3 = await addMember(L, 'lulu-owner3', 'OWNER')
    const who3: Who = { host: L.host, token: w.token(o3, L) }
    check('201 行 → 400（批量上下架）', (await call(rListingStatus.POST, who3, { method: 'POST', body: { listingNos: many, status: 0 } })).status === 400)
    check('201 行 → 400（批量改价预览）', (await call(rPreview.POST, who3, { method: 'POST', body: { listingNos: many, mode: 'FIXED', value: '1', rounding: 'NONE' } })).status === 400)
    check('范围三选一：同时给 listingNos 与 all → 400', (await call(rPreview.POST, who3, { method: 'POST', body: { listingNos: [w.listings.luluAuto], all: true, mode: 'FIXED', value: '140', rounding: 'NONE' } })).status === 400)
    const allPv = await call(rPreview.POST, who3, { method: 'POST', body: { all: true, mode: 'FIXED', value: '200', rounding: 'NONE' } })
    const allNos = ((allPv.json?.data?.rows ?? []) as { listingNo: string }[]).map((x) => x.listingNo).sort()
    check('全部已授权 = 本渠道 3 行（不含 zz）', JSON.stringify(allNos) === JSON.stringify([w.listings.luluAuto, w.listings.luluManual, w.listings.luluSms].sort()), allNos.join(','))
  }

  // =======================================================================
  section('W6-6 T24：交付凭据与卡密搜索')
  {
    const before = await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'card.view' } })
    const r = await call(rCards.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })
    const cards = (r.json?.data?.cards ?? []) as { cardText: string; status: string }[]
    check('/cards 只给本单 USED 卡（1 张，明文正确）', r.status === 200 && cards.length === 1 && cards[0].cardText === MARK.cardPlain && cards[0].status === 'USED', r.text.slice(0, 200))
    check('未售卡不出现', !r.text.includes(`ITEST-UNSOLD-${RUN}`))
    const logs = (r.json?.data?.redeemLogs ?? []) as { provider: string; cardIndex: number }[]
    check('兑换日志：provider 给公开名、cardIndex 代替卡 id', logs.length === 1 && logs[0].cardIndex === 1 && logs[0].provider !== 'sysa')
    scanKeys('/cards 响应', r.json, { cards: true })
    scanValues('/cards 响应', r.text, w, { cards: true })
    const r2 = await call(rCards.GET, owner, { params: { orderNo: w.orders.luluManual.orderNo } })
    check('人工交付单：deliveryInfo 只在 /cards 出现', r2.json?.data?.deliveryInfo === MARK.deliveryInfo)
    const r3 = await call(rCards.GET, owner, { params: { orderNo: w.orders.luluSms.orderNo } })
    check('接码单：验证码只在 /cards 出现', r3.json?.data?.smsCode === MARK.smsCode)
    const after = await prisma.auditEvent.findMany({ where: { tenantId: L.id, action: 'card.view' }, orderBy: { id: 'asc' } })
    check('每次查看一条 card.view 审计（3 次 → +3）', after.length - before === 3)
    const kinds = after.map((a) => JSON.stringify(a.diff))
    check('审计记录看了哪几类', kinds.some((k) => k.includes('cards')) && kinds.some((k) => k.includes('deliveryInfo')) && kinds.some((k) => k.includes('smsCode')), kinds.join(' '))
    check('/cards zz 的单 → 404', isNotFound(await call(rCards.GET, owner, { params: { orderNo: w.orders.zzAuto.orderNo } })))
    // URL 里单号小写（MySQL 默认排序规则不区分大小写，照样命中）：card.view 审计必须记库里的规范单号
    const lc = await call(rCards.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo.toLowerCase() } })
    if (lc.status === 200) {
      const last = await prisma.auditEvent.findFirst({ where: { tenantId: L.id, action: 'card.view' }, orderBy: { id: 'desc' } })
      check('小写单号查看交付凭据：card.view 审计 targetId = 规范单号', last?.targetId === w.orders.luluAuto.orderNo, String(last?.targetId))
    } else {
      check('小写单号查看交付凭据：库排序规则区分大小写时按不存在处理', isNotFound(lc), `status=${lc.status}`)
    }

    const search = async (card: string) => call(rOrders.GET, owner, { path: `/api/partner/orders?card=${encodeURIComponent(card)}` })
    const own = await search(MARK.cardPlain)
    check('按本店已售卡搜 → 命中本单', own.json?.data?.total === 1 && own.json?.data?.rows?.[0]?.orderNo === w.orders.luluAuto.orderNo)
    const zzC = await search(zzCardPlain)
    const unsold = await search(`ITEST-UNSOLD-${RUN}`)
    const none = await search(`ITEST-NOPE-${randomBytes(4).toString('hex')}`)
    check('按 zz 的卡 / 未售卡 / 不存在的卡搜：响应完全相同（total=0）', zzC.json?.data?.total === 0 && zzC.text === unsold.text && unsold.text === none.text, `${zzC.text} | ${unsold.text}`)
  }

  // =======================================================================
  section('W6-7 T10：键名与值扫描')
  {
    const d = await call(rOrder.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })
    check('订单详情 200', d.status === 200)
    scanKeys('订单详情', d.json)
    scanValues('订单详情', d.text, w)
    check('详情不含交付凭据（deliveryInfo 键缺席）', d.json?.data && !('deliveryInfo' in d.json.data))
    check('详情含本站发票全字段（抬头、电话）与收据预览链接', d.json?.data?.invoices?.[0]?.title === 'ITEST 抬头' && typeof d.json?.data?.receipts?.[0]?.previewUrl === 'string' && d.json.data.receipts[0].previewUrl.startsWith('/receipt/'))
    check('invoiceInfo 只输出已知键（未知键 secretInternal 被丢弃）', d.json?.data?.invoiceInfo?.title === 'ITEST 抬头' && !('secretInternal' in (d.json?.data?.invoiceInfo ?? {})))
    check('详情 buyer 含邮箱与昵称、不含 id', d.json?.data?.buyer?.email === w.users.luluBuyer1.email && !('id' in (d.json?.data?.buyer ?? {})))
    check('详情有 order.view 审计', (await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'order.view', targetId: w.orders.luluAuto.orderNo } })) === 1)
    const dm = await call(rOrder.GET, owner, { params: { orderNo: w.orders.luluManual.orderNo } })
    scanValues('人工交付单详情', dm.text, w)
    const ds = await call(rOrder.GET, owner, { params: { orderNo: w.orders.luluSms.orderNo } })
    scanKeys('接码单详情', ds.json)
    scanValues('接码单详情', ds.text, w)
    check('接码单详情给号码不给验证码', ds.json?.data?.sms?.phone === '+1 555 0100' && !ds.text.includes(MARK.smsCode))

    const l = await call(rOrders.GET, owner, { path: '/api/partner/orders?pageSize=100' })
    scanKeys('订单列表', l.json)
    scanValues('订单列表', l.text, w)
    const nos = ((l.json?.data?.rows ?? []) as { orderNo: string }[]).map((x) => x.orderNo)
    check(
      '列表只有本渠道订单（含未付单，不含主站 / zz）',
      nos.includes(w.orders.luluAuto.orderNo) && nos.includes(unpaid.orderNo) && !nos.includes(w.orders.zzAuto.orderNo) && !nos.includes(w.orders.crossMain.orderNo),
      nos.join(','),
    )
    for (const [name, fn] of [
      ['看板', rDashboard.GET],
      ['商品池', rCatalog.GET],
      ['售后列表', rAfterSales.GET],
    ] as [string, RouteFn][]) {
      const r = await call(fn, owner)
      scanKeys(name, r.json)
      scanValues(name, r.text, w)
    }
    const cat = await call(rCatalog.GET, owner)
    const row = ((cat.json?.data?.rows ?? []) as { listingNo: string; stockLevel: string; supplyCents: number; mainPriceCents: number }[]).find((x) => x.listingNo === w.listings.luluAuto)
    check('商品池：进货价只给自己的（11037）、主站价参考、库存只给档位', row?.supplyCents === MARK.supplyCents && row?.mainPriceCents === 12900 && row?.stockLevel === '不限量', JSON.stringify(row))
    check('商品池不含 zz 的上架行', !cat.text.includes(w.listings.zzAuto))
    const msgs = await call(rMessages.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })
    scanKeys('留言列表', msgs.json)
  }

  // =======================================================================
  section('W6-8 搜索「先租户后匹配」')
  {
    const q = (qs: string) => call(rOrders.GET, owner, { path: `/api/partner/orders?${qs}` })
    const mainNo = await q(`orderNo=${w.orders.crossMain.orderNo}`)
    const missNo = await q(`orderNo=IT${randomBytes(6).toString('hex').toUpperCase()}`)
    check('主站订单号搜索 total=0，与不存在一致', mainNo.json?.data?.total === 0 && mainNo.text === missNo.text)
    const mainEmail = await q(`email=${encodeURIComponent(w.users.luluRegMainOrder.email)}`)
    const missEmail = await q(`email=${encodeURIComponent(`nobody-${RUN}@itest-tenant.local`)}`)
    check('只在主站下单的买家邮箱 total=0，与不存在一致', mainEmail.json?.data?.total === 0 && mainEmail.text === missEmail.text)
    const zzEmail = await q(`email=${encodeURIComponent(w.users.zzBuyer1.email)}`)
    check('zz 买家邮箱 total=0', zzEmail.json?.data?.total === 0)
    const cross = await q(`email=${encodeURIComponent(w.users.crossBuyer.email)}`)
    check('跨站买家只看到他在本渠道的 1 单', cross.json?.data?.total === 1 && cross.json?.data?.rows?.[0]?.orderNo === w.orders.crossLulu.orderNo)
    check('邮箱少于 3 字符 → 400', (await q('email=ab')).status === 400)
    check('非法枚举 → 400', (await q('payStatus=HACK')).status === 400)
    const viaCustomer = await partnerListOrders(L.id, { customerNo: w.customers.luluRegMainOrder })
    check('partnerListOrders(customerNo)：lulu 注册只在主站下单的客户 → 0 单', viaCustomer.total === 0)
    const viaZzCustomer = await partnerListOrders(L.id, { customerNo: w.customers.zzBuyer1 })
    check('partnerListOrders(zz 的 customerNo) → 0 单', viaZzCustomer.total === 0)
    const viaOwnCustomer = await partnerListOrders(L.id, { customerNo: w.customers.luluBuyer1 })
    check('partnerListOrders(本站客户) → 他在本渠道的 2 单', viaOwnCustomer.total === 2)
  }

  // =======================================================================
  section('W6-9 留言')
  {
    const oid = w.orders.luluAuto.id
    const r = await call(rMessages.POST, owner, { method: 'POST', params: { orderNo: w.orders.luluAuto.orderNo }, body: { messageText: '您好，已为您处理' } })
    check('渠道回复 → 201', r.status === 201, r.text)
    const reply = await prisma.orderMessage.findFirst({ where: { orderId: oid, senderRole: 'PARTNER' }, orderBy: { id: 'desc' } })
    check(
      '落库：sender=ADMIN（买家看到「客服」）、senderRole=PARTNER、senderUserId=成员、readByBuyer=false、readByTenant=true',
      reply?.sender === 'ADMIN' && reply.senderUserId === w.users.luluOwner.id && reply.readByBuyer === false && reply.readByTenant === true,
    )
    const buyerMsg = await prisma.orderMessage.findFirst({ where: { orderId: oid, sender: 'BUYER' } })
    check('买家留言：readByTenant=true、readByAdmin 不变（仍 false，站长红点保留）', buyerMsg?.readByTenant === true && buyerMsg.readByAdmin === false)
    const list = await call(rMessages.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })
    const rows = (list.json?.data?.rows ?? []) as { sender: string; mine: boolean; messageText: string }[]
    check('留言列表：买家 + 本店（mine=true）', rows.length === 2 && rows[0].sender === 'BUYER' && rows[1].sender === 'PARTNER' && rows[1].mine === true)
    await prisma.orderMessage.create({ data: { orderId: oid, sender: 'BUYER', content: 'itest 追问' } })
    const d1 = await call(rOrder.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })
    check('新买家留言 → 详情未读数 1', d1.json?.data?.unreadMessages === 1)
    const rd = await call(rRead.POST, owner, { method: 'POST', params: { orderNo: w.orders.luluAuto.orderNo } })
    check('POST read → 204', rd.status === 204)
    check('已读后未读数 0、readByAdmin 仍未动', (await prisma.orderMessage.count({ where: { orderId: oid, sender: 'BUYER', readByTenant: false } })) === 0 && (await prisma.orderMessage.count({ where: { orderId: oid, sender: 'BUYER', readByAdmin: true } })) === 0)
    check('空回复 → 400', (await call(rMessages.POST, owner, { method: 'POST', params: { orderNo: w.orders.luluAuto.orderNo }, body: { messageText: '   ' } })).status === 400)
    check('超长回复 → 400', (await call(rMessages.POST, owner, { method: 'POST', params: { orderNo: w.orders.luluAuto.orderNo }, body: { messageText: 'x'.repeat(2001) } })).status === 400)
    const lcPost = await call(rMessages.POST, owner, { method: 'POST', params: { orderNo: w.orders.luluAuto.orderNo.toLowerCase() }, body: { messageText: '小写单号回复' } })
    if (lcPost.status === 201) {
      const last = await prisma.auditEvent.findFirst({ where: { tenantId: L.id, action: 'order.message' }, orderBy: { id: 'desc' } })
      check('小写单号回复：order.message 审计 targetId = 规范单号', last?.targetId === w.orders.luluAuto.orderNo, String(last?.targetId))
    } else {
      check('小写单号回复：库排序规则区分大小写时按不存在处理', isNotFound(lcPost), `status=${lcPost.status}`)
    }
  }

  // =======================================================================
  section('W6-10 售后申请')
  {
    const no = w.orders.luluAuto.orderNo
    const post = (body: unknown, orderNo = no) => call(rOrderAS.POST, owner, { method: 'POST', params: { orderNo }, body })
    const r1 = await post({ kind: 'REFUND', reason: '卡密无效，买家要求退款', suggestedBearer: 'PROPORTIONAL', suggestedGoodsYuan: '140.00' })
    check('申请退款 → 200 + requestNo', r1.status === 200 && /^AS\d{6}[0-9A-Z]{8}$/.test(r1.json?.data?.requestNo ?? ''), r1.text)
    const reqNo = r1.json?.data?.requestNo as string
    const r2 = await post({ kind: 'REFUND', reason: '重复提交一次试试' })
    check('同类型重复申请 → 409', r2.status === 409, r2.text)
    const r3 = await post({ kind: 'REISSUE', reason: '也申请一下补发' })
    check('不同类型可以并存 → 200', r3.status === 200)
    // 并发 6 次同类申请（绕过快速路径的竞态）：唯一约束兜底，恰好 1 个成功、其余 409
    const par = await Promise.all(Array.from({ length: 6 }, () => post({ kind: 'REISSUE', reason: '并发补发申请测试' }, w.orders.luluSms.orderNo)))
    check('并发 6 次同类申请：恰好 1 个 200、其余 409', par.filter((x) => x.status === 200).length === 1 && par.filter((x) => x.status === 409).length === 5, par.map((x) => x.status).join(','))
    check('库里只有 1 行', (await prisma.tenantAfterSale.count({ where: { orderId: w.orders.luluSms.id, kind: 'REISSUE' } })) === 1)
    const over = await post({ kind: 'REFUND', reason: '建议金额超过货款', suggestedGoodsYuan: '999' }, w.orders.luluManual.orderNo)
    check('建议退款金额超过货款 → 400', over.status === 400)
    {
      // 部分退款后：上限是「剩余可退货款」而不是订单全额；全额退完后不再接受退款申请
      const mo = await prisma.order.findUnique({ where: { id: w.orders.luluManual.id }, select: { amount: true } })
      const amt = Math.round(Number(mo?.amount ?? 0) * 100)
      await prisma.order.update({ where: { id: w.orders.luluManual.id }, data: { refundedGoodsCents: amt - 1000 } })
      const tooMuch = await post({ kind: 'REFUND', reason: '部分退款后再申请', suggestedGoodsYuan: '10.01' }, w.orders.luluManual.orderNo)
      check('部分退款后：建议金额超过剩余可退（10.00）→ 400', tooMuch.status === 400 && tooMuch.text.includes('10.00'), tooMuch.text)
      const fits = await post({ kind: 'REFUND', reason: '部分退款后再申请', suggestedGoodsYuan: '10.00' }, w.orders.luluManual.orderNo)
      check('部分退款后：建议金额 = 剩余可退 → 200', fits.status === 200, fits.text)
      if (fits.status === 200) await call(rCancel.POST, owner, { method: 'POST', params: { requestNo: fits.json?.data?.requestNo as string } })
      await prisma.order.update({ where: { id: w.orders.luluManual.id }, data: { refundedGoodsCents: amt } })
      check('货款已全部退完：退款申请（不填金额）→ 400', (await post({ kind: 'REFUND', reason: '已经全退了还申请' }, w.orders.luluManual.orderNo)).status === 400)
      check('货款已全部退完：补发申请不受影响 → 200', (await post({ kind: 'REISSUE', reason: '全退之后申请补发' }, w.orders.luluManual.orderNo)).status === 200)
      await prisma.tenantAfterSale.updateMany({ where: { orderId: w.orders.luluManual.id, status: 'PENDING' }, data: { status: 'CANCELLED', activeKey: null } })
      await prisma.order.update({ where: { id: w.orders.luluManual.id }, data: { refundedGoodsCents: null } })
    }
    const shortReason = await post({ kind: 'ESCALATE', reason: '短' })
    check('原因少于 5 字 → 400', shortReason.status === 400)
    check('未付单申请退款 → 400', (await post({ kind: 'REFUND', reason: '还没付款就退款' }, unpaid.orderNo)).status === 400)
    const warns: string[] = []
    const origWarn = console.warn
    console.warn = (...a: unknown[]) => {
      warns.push(a.map(String).join(' '))
    }
    const r4 = await post({ kind: 'ESCALATE', reason: '买家情绪激动，请站长介入' })
    await new Promise((res) => setTimeout(res, 50))
    console.warn = origWarn
    check('升级 → 200', r4.status === 200)
    const o = await prisma.order.findUnique({ where: { id: w.orders.luluAuto.id }, select: { escalatedAt: true, payStatus: true, deliveryStatus: true, amount: true, remark: true } })
    check('升级置 escalatedAt，订单其他字段不变', !!o?.escalatedAt && o.payStatus === 'PAID' && o.deliveryStatus === 'DELIVERED' && o.amount.toString() === '140' && o.remark === '买家备注 itest')
    check('升级推平台群（带渠道 code 与单号，不带买家邮箱）', warns.some((x) => x.includes('[platform-alert]') && x.includes(L.code) && x.includes(no) && !x.includes(w.users.luluBuyer1.email)), warns.join(' | ').slice(0, 300))
    const row = await prisma.tenantAfterSale.findUnique({ where: { requestNo: reqNo } })
    check('申请行：tenantId / orderId / activeKey / 建议值正确', row?.tenantId === L.id && row.orderId === w.orders.luluAuto.id && row.activeKey === `o:${w.orders.luluAuto.id}:REFUND` && row.suggestedGoodsCents === 14000 && row.suggestedBearer === 'PROPORTIONAL')
    const c1 = await call(rCancel.POST, owner, { method: 'POST', params: { requestNo: reqNo } })
    check('取消 PENDING → 204', c1.status === 204, c1.text)
    const c2 = await call(rCancel.POST, owner, { method: 'POST', params: { requestNo: reqNo } })
    check('再次取消（已非 PENDING）→ 409', c2.status === 409)
    const again = await post({ kind: 'REFUND', reason: '取消之后重新申请退款' })
    check('取消后 activeKey 释放，可以重新申请 → 200', again.status === 200)
    const list = await call(rAfterSales.GET, owner, { path: '/api/partner/after-sales?status=PENDING' })
    const rows = (list.json?.data?.rows ?? []) as { requestNo: string; orderNo: string | null; kind: string }[]
    const ownNos = [no, w.orders.luluSms.orderNo]
    check('售后列表只含本渠道、orderNo 为公开单号', rows.length >= 4 && rows.every((x) => x.orderNo !== null && ownNos.includes(x.orderNo)) && !list.text.includes(zzReqNo), JSON.stringify(rows.map((x) => x.orderNo)))
    check('非法筛选 → 400', (await call(rAfterSales.GET, owner, { path: '/api/partner/after-sales?status=HACK' })).status === 400)
    // 全局封禁申请（WP7 用）：零订单客户也能申请；重复 409；他站客户 404
    const ban = await partnerRequestBan(L.id, w.customers.luluRegMainOrder, w.users.luluOwner.id, '疑似盗号，申请全局封禁')
    const banRow = await prisma.tenantAfterSale.findUnique({ where: { requestNo: ban.requestNo } })
    check('封禁申请：kind=BAN_REQUEST、orderId=null、customerId 非空、activeKey=c:{id}:BAN', banRow?.kind === 'BAN_REQUEST' && banRow.orderId === null && !!banRow.customerId && banRow.activeKey === `c:${banRow.customerId}:BAN`)
    let dup = 0
    try {
      await partnerRequestBan(L.id, w.customers.luluRegMainOrder, w.users.luluOwner.id, '再申请一次封禁')
    } catch (e) {
      dup = (e as { status?: number }).status ?? -1
    }
    check('重复封禁申请 → 409', dup === 409)
    let nf = 0
    try {
      await partnerRequestBan(L.id, w.customers.zzBuyer1, w.users.luluOwner.id, '他站客户试探')
    } catch (e) {
      nf = (e as { status?: number }).status ?? -1
    }
    check('封禁他站客户 → 404', nf === 404)
  }

  // =======================================================================
  section('W6-11 导出')
  {
    const first = await call(rExport.GET, owner, { path: '/api/partner/orders/export' })
    const lines = first.text.replace(/^﻿/, '').split('\r\n')
    check('导出 200、text/csv', first.status === 200)
    check('首行是水印（导出人、时间、仅用于本站售后）', lines[0].includes('导出人') && lines[0].includes('仅用于本站售后') && lines[0].includes(w.users.luluOwner.email))
    check('第二行是表头', lines[1].startsWith('订单号,商品'))
    check('CSV 含本渠道订单、不含主站 / zz 订单', first.text.includes(w.orders.luluAuto.orderNo) && !first.text.includes(w.orders.crossMain.orderNo) && !first.text.includes(w.orders.zzAuto.orderNo))
    check('CSV 不含卡密、交付信息、验证码、成本', ![MARK.cardPlain, MARK.deliveryInfo, MARK.smsCode, MARK.cardCost, MARK.smsCost].some((v) => first.text.includes(v)))
    const statuses = [first.status]
    for (let i = 0; i < 10; i++) statuses.push((await call(rExport.GET, owner, { path: '/api/partner/orders/export' })).status)
    check('每日 10 次：第 11 次 429', statuses.slice(0, 10).every((s) => s === 200) && statuses[10] === 429, statuses.join(','))
    const denied = await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'order.export', result: 'DENIED' } })
    check('超限写 DENIED 审计', denied === 1)
    check('导出成功写审计 10 条', (await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'order.export', result: 'OK' } })) === 10)
    // STAFF（带 order.export 也不行：OWNER_ONLY）
    const staff = await addMember(L, 'lulu-staff', 'STAFF', ['order.read', 'order.export'])
    check('STAFF 导出 → 404（仅店主）', isNotFound(await call(rExport.GET, { host: L.host, token: w.token(staff, L) }, { path: '/api/partner/orders/export' })))
    check('STAFF 有 order.read → 列表 200', (await call(rOrders.GET, { host: L.host, token: w.token(staff, L) })).status === 200)
    check('STAFF 无 order.cards → 404', isNotFound(await call(rCards.GET, { host: L.host, token: w.token(staff, L) }, { params: { orderNo: w.orders.luluAuto.orderNo } })))

    // 并发：今日已用 8 次时同时发 6 个导出——放行数不得超过剩余 2 个名额（先占位再复数），其余 429 且留 DENIED
    await prisma.auditEvent.deleteMany({ where: { tenantId: L.id, action: 'order.export' } })
    await prisma.auditEvent.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({ actorKind: 'TENANT', actorUserId: w.users.luluOwner.id, tenantId: L.id, action: 'order.export', targetType: 'order', targetId: `EXITEST${i}`, result: 'OK' })),
    })
    const par = await Promise.all(Array.from({ length: 6 }, () => call(rExport.GET, owner, { path: '/api/partner/orders/export' })))
    const okN = par.filter((x) => x.status === 200).length
    check('并发 6 个导出（剩 2 个名额）：放行 ≤ 2、其余全是 429', okN <= 2 && par.every((x) => x.status === 200 || x.status === 429), par.map((x) => x.status).join(','))
    const okRows = await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'order.export', result: 'OK' } })
    check('并发后当天 OK 审计 ≤ 10 且等于 8 + 放行数', okRows <= 10 && okRows === 8 + okN, `ok=${okRows} pass=${okN}`)
    check('被拒的每一次都留 DENIED 审计', (await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'order.export', result: 'DENIED' } })) === 6 - okN)
    // 保守拒绝不吃名额：之后顺序导出，恰好用满 10 次再 429
    const seq: number[] = []
    for (let i = 0; i < 4; i++) {
      const st = (await call(rExport.GET, owner, { path: '/api/partner/orders/export' })).status
      seq.push(st)
      if (st === 429) break
    }
    check('并发之后顺序导出：名额恰好用满 10 次后 429', seq[seq.length - 1] === 429 && (await prisma.auditEvent.count({ where: { tenantId: L.id, action: 'order.export', result: 'OK' } })) === 10, seq.join(','))
  }

  // =======================================================================
  section('看板：财务数字按 finance.read 裁剪（设计 6.1）')
  {
    const od = await call(rDashboard.GET, owner)
    const ob = od.json?.data?.balances
    check('OWNER 看板：给 balances 与 canApply（布尔）', od.status === 200 && !!ob && typeof ob.available?.payoutCents === 'number' && typeof od.json?.data?.todo?.canApply === 'boolean', od.text.slice(0, 200))
    // STAFF 即使 perms 里写了 finance.read（OWNER_ONLY，partnerRoute 同样不认）也不给
    const sd = await addMember(L, 'lulu-staff-dash', 'STAFF', ['dashboard.read', 'finance.read'])
    const r = await call(rDashboard.GET, { host: L.host, token: w.token(sd, L) })
    check('STAFF 看板 → 200', r.status === 200, r.text.slice(0, 200))
    check('STAFF 看板：balances = null、canApply = null', r.json?.data?.balances === null && r.json?.data?.todo?.canApply === null, JSON.stringify(r.json?.data?.todo))
    check('STAFF 看板：时段统计与其他待办照常给', typeof r.json?.data?.month?.goodsCents === 'number' && typeof r.json?.data?.todo?.unreadMessages === 'number')
    // 主会话 D5：时段里的「余额 / 预计打款」对没有 finance.read 的 STAFF 也隐藏（null）；OWNER 照常是数字
    const periods = ['today', 'd7', 'month'] as const
    check('STAFF 看板：三个时段的 balanceCents / payoutCents 都是 null（D5）',
      periods.every((k) => r.json?.data?.[k]?.balanceCents === null && r.json?.data?.[k]?.payoutCents === null), JSON.stringify(r.json?.data?.month))
    check('OWNER 看板：三个时段的 balanceCents / payoutCents 是数字',
      periods.every((k) => typeof od.json?.data?.[k]?.balanceCents === 'number' && typeof od.json?.data?.[k]?.payoutCents === 'number'), JSON.stringify(od.json?.data?.month))
    check('STAFF 看板响应不含账户级字段（paidTotalCents / inPayoutCents / available）', !/paidTotalCents|inPayoutCents|"available"|"pending"/.test(r.text))
    scanKeys('STAFF 看板', r.json)

    // D5 同口径延伸到订单详情（终审隔离 #3）：否则 STAFF 逐单加总就能还原看板里被隐藏的时段数字
    const so = await addMember(L, 'lulu-staff-ord', 'STAFF', ['order.read', 'finance.read'])
    const orderNo = w.orders.luluAuto.orderNo
    const rd = await call(rOrder.GET, { host: L.host, token: w.token(so, L) }, { params: { orderNo } })
    const ss = rd.json?.data?.settlement
    check('STAFF 订单详情 200，结算视图的余额 / 预计打款 / 手续费 / 桶 / 结算单都是 null（D5）',
      rd.status === 200 && !!ss && ss.balanceCents === null && ss.payoutCents === null && ss.feeCents === null && ss.bucket === null && ss.statementNo === null, JSON.stringify(ss))
    check('STAFF 订单详情：本单成分（货款 / 进货款 / 发票分成）与结算状态照常给', typeof ss?.goodsCents === 'number' && typeof ss?.purchaseCents === 'number' && typeof ss?.invShareCents === 'number' && 'settleState' in (ss ?? {}))
    const ro = await call(rOrder.GET, owner, { params: { orderNo } })
    const os = ro.json?.data?.settlement
    check('OWNER 订单详情：余额 / 预计打款 / 手续费是数字、桶有值', typeof os?.balanceCents === 'number' && typeof os?.payoutCents === 'number' && typeof os?.feeCents === 'number' && typeof os?.bucket === 'string', JSON.stringify(os))
    scanKeys('STAFF 订单详情', rd.json)
  }

  // =======================================================================
  section('订单列表：按商品（listingNo）与未读留言筛选（设计 12.1）')
  {
    const byListing = await call(rOrders.GET, owner, { path: `/api/partner/orders?pageSize=100&listingNo=${encodeURIComponent(w.listings.luluAuto)}` })
    const expectNos = (await prisma.order.findMany({ where: { tenantId: L.id, productId: w.products.auto }, select: { orderNo: true } })).map((o) => o.orderNo).sort()
    const gotNos = (byListing.json?.data?.rows ?? []).map((r: any) => r.orderNo).sort()
    check('按本店上架编号筛 → 200、恰好是本店该商品的全部订单', byListing.status === 200 && gotNos.length > 0 && JSON.stringify(gotNos) === JSON.stringify(expectNos), `${gotNos} vs ${expectNos}`)
    const other = await call(rOrders.GET, owner, { path: `/api/partner/orders?listingNo=${encodeURIComponent(w.listings.zzAuto)}` })
    check('他站的上架编号 → 200 空结果（不报错、不暴露存在性）', other.status === 200 && other.json?.data?.total === 0, other.text.slice(0, 200))
    check('上架编号格式非法 → 400', (await call(rOrders.GET, owner, { path: '/api/partner/orders?listingNo=a%27b' })).status === 400)
    await prisma.orderMessage.updateMany({ where: { order: { tenantId: L.id }, sender: 'BUYER' }, data: { readByTenant: true } })
    await prisma.orderMessage.create({ data: { orderId: w.orders.luluAuto.id, sender: 'BUYER', content: 'itest 未读筛选' } })
    const un = await call(rOrders.GET, owner, { path: '/api/partner/orders?unread=1' })
    check('unread=1 → 只返回有未读买家留言的订单', un.status === 200 && un.json?.data?.total === 1 && un.json.data.rows[0]?.orderNo === w.orders.luluAuto.orderNo, un.text.slice(0, 300))
    check('unread 只接受 1 → 其它值 400', (await call(rOrders.GET, owner, { path: '/api/partner/orders?unread=yes' })).status === 400)
  }

  // =======================================================================
  section('W6-7a T22：邀请')
  {
    const invitee = await createUser('invitee')
    const tok = (u: WorldUser, t: WorldTenant) => w.token(u, t)
    const accept = (host: string, token: string | null, inviteToken: string) =>
      call(rInvite.POST as unknown as RouteFn, { host, token }, { method: 'POST', body: { token: inviteToken } })
    const t1 = await makeInvite(L, invitee.email, w.users.sa.id)
    const onZz = await accept(Z.host, tok(invitee, Z), t1)
    // 同一用户、lulu 签的令牌拿到 zz 的 Host：WP1 之后视为未登录
    check('lulu 的令牌在 zz 的 Host → 401 / 404', isDenied(await accept(Z.host, tok(invitee, L), t1)))
    check('lulu 的邀请在 zz 的 Host 上接受 → 404', isNotFound(onZz), `status=${onZz.status}`)
    check('不产生任何 TenantMember', (await prisma.tenantMember.count({ where: { userId: invitee.id } })) === 0)
    const expired = await makeInvite(L, invitee.email, w.users.sa.id, { expiresAt: new Date(Date.now() - 1000) })
    check('过期 → 404', isNotFound(await accept(L.host, tok(invitee, L), expired)))
    const revoked = await makeInvite(L, invitee.email, w.users.sa.id, { revokedAt: new Date() })
    check('吊销 → 404', isNotFound(await accept(L.host, tok(invitee, L), revoked)))
    const other = await createUser('invitee-other')
    check('登录邮箱与被邀请邮箱不符 → 404', isNotFound(await accept(L.host, tok(other, L), t1)))
    const forAdmin = await makeInvite(L, w.users.sa.email, w.users.sa.id)
    check('ADMIN 接受 → 401 / 404', isDenied(await accept(L.host, tok(w.users.sa, L), forAdmin)))
    check('ADMIN 没有成为成员', (await prisma.tenantMember.count({ where: { userId: w.users.sa.id } })) === 0)
    check('未登录 → 401', (await accept(L.host, null, t1)).status === 401)
    check('主站 Host → 404', isNotFound(await accept('bigolab.com', tok(invitee, L), t1)))
    check('畸形令牌 → 404', isNotFound(await accept(L.host, tok(invitee, L), '../../etc')))
    const ok1 = await accept(L.host, tok(invitee, L), t1)
    check('本店 Host、正确邮箱 → 204', ok1.status === 204, ok1.text)
    const m = await prisma.tenantMember.findUnique({ where: { tenantId_userId: { tenantId: L.id, userId: invitee.id } } })
    check('成员落在邀请所属的渠道（lulu），角色 OWNER', m?.status === 1 && m.role === 'OWNER')
    check('邀请已置 usedAt', !!(await prisma.tenantInvite.findUnique({ where: { tokenHash: sha(t1) } }))?.usedAt)
    check('已用 → 404', isNotFound(await accept(L.host, tok(invitee, L), t1)))
    check('新成员可进后台（GET orders 200）', (await call(rOrders.GET, { host: L.host, token: tok(invitee, L) })).status === 200)
    // 停用成员 → 下一次请求 404（T15）
    await prisma.tenantMember.update({ where: { tenantId_userId: { tenantId: L.id, userId: invitee.id } }, data: { status: 0 } })
    check('停用后 → 404', isNotFound(await call(rOrders.GET, { host: L.host, token: tok(invitee, L) })))
  }

  // =======================================================================
  section('店面状态：DRAFT / SUSPENDED')
  {
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'SUSPENDED' } })
    check('SUSPENDED：GET orders 200（只读）', (await call(rOrders.GET, owner)).status === 200)
    check('SUSPENDED：GET cards 200（已付订单照常可查）', (await call(rCards.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })).status === 200)
    check('SUSPENDED：PATCH listing 404', isNotFound(await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluAuto }, body: { sortOrder: 3 } })))
    check('SUSPENDED：POST messages 404', isNotFound(await call(rMessages.POST, owner, { method: 'POST', params: { orderNo: w.orders.luluAuto.orderNo }, body: { messageText: 'x' } })))
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'DRAFT' } })
    check('DRAFT：catalog 200（开业前选品定价）', (await call(rCatalog.GET, owner)).status === 200)
    check('DRAFT：PATCH listing 200', (await call(rListing.PATCH, owner, { method: 'PATCH', params: { listingNo: w.listings.luluAuto }, body: { sortOrder: 4 } })).status === 200)
    check('DRAFT：cards 404（不在 DRAFT_SAFE）', isNotFound(await call(rCards.GET, owner, { params: { orderNo: w.orders.luluAuto.orderNo } })))
    const cat = await call(rCatalog.GET, owner)
    const row = ((cat.json?.data?.rows ?? []) as { listingNo: string; sellable: boolean; reason?: string }[]).find((x) => x.listingNo === w.listings.luluAuto)
    check('DRAFT：行本身合规时可售原因 = TENANT_INACTIVE', row?.sellable === false && row.reason === 'TENANT_INACTIVE', JSON.stringify(row))
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'TERMINATED' } })
    check('TERMINATED：一律 404', isNotFound(await call(rOrders.GET, owner)))
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'ACTIVE' } })
  }

  // =======================================================================
  section('W6-12 页面守卫')
  {
    const root = path.join(process.cwd(), 'src', 'app', 'partner')
    const pages: string[] = []
    const walk = (d: string) =>
      readdirSync(d).forEach((f) => {
        const p = path.join(d, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (f === 'page.tsx') pages.push(p)
      })
    walk(root)
    const exceptions = [path.join(root, 'login', 'page.tsx'), path.join(root, 'invite', '[token]', 'page.tsx')]
    const bad: string[] = []
    pages.forEach((p) => {
      const src = readFileSync(p, 'utf8')
      if (/^\s*['"]use client['"]/m.test(src)) bad.push(`${p}: use client`)
      const need = exceptions.includes(p) ? 'requireChannelStorefrontPage(' : 'requirePartnerPage('
      if (!src.includes(need)) bad.push(`${p}: 缺 ${need}`)
      if (/try\s*\{[^}]*require(PartnerPage|ChannelStorefrontPage)\(/.test(src)) bad.push(`${p}: 守卫包进了 try`)
    })
    check(`src/app/partner 下 ${pages.length} 个 page.tsx 全部是服务端组件且调用守卫`, pages.length >= 7 && bad.length === 0, bad.join('；'))
    const layoutSrc = readFileSync(path.join(root, 'layout.tsx'), 'utf8')
    check('layout 调 requireChannelStorefrontPage（主站 Host 整棵树 404）', layoutSrc.includes('requireChannelStorefrontPage(') && !/['"]use client['"]/.test(layoutSrc))

    const r1 = await withRequest({ host: L.host }, () => catchNext(() => requireChannelStorefrontPage()))
    check('未登录访问 /partner/login（lulu）→ 正常渲染、不重定向', r1.kind === 'ok')
    const r2 = await withRequest({ host: L.host }, () => catchNext(() => requirePartnerPage('order.read')))
    check('未登录访问成员页 → 重定向 /partner/login', r2.kind === 'redirect' && r2.location === '/partner/login')
    const r3 = await withRequest({ host: 'bigolab.com', token: w.token(w.users.luluOwner, L) }, () => catchNext(() => requirePartnerPage('order.read')))
    check('主站 Host 成员页 → 404', r3.kind === 'notFound')
    const r4 = await withRequest({ host: 'bigolab.com' }, () => catchNext(() => requireChannelStorefrontPage()))
    check('主站 Host 登录页 → 404', r4.kind === 'notFound')
    const r5 = await withRequest({ host: L.host, token: w.token(w.users.luluBuyer1, L) }, () => catchNext(() => requirePartnerPage('dashboard.read')))
    check('买家（非成员）访问成员页 → 404（客户端导航同样经页面守卫）', r5.kind === 'notFound')
    const r6 = await withRequest({ host: L.host, token: w.token(w.users.luluOwner, L) }, () => catchNext(() => requirePartnerPage('order.export')))
    check('OWNER 访问成员页 → 通过', r6.kind === 'ok')
  }
}

main()
  .catch((e) => {
    console.error('itest 异常中止：', e)
    check('itest 未异常中止', false, String((e as Error)?.stack || e).slice(0, 800))
  })
  .finally(async () => {
    setChannelsMode('dormant')
    try {
      await cleanupAll()
      await prisma.auditEvent.deleteMany({ where: { action: 'authz.noise', at: { gte: RUN_START } } })
    } catch (e) {
      console.error('清理失败：', e)
    }
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
