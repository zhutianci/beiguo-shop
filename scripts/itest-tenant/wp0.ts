/**
 * WP0 集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp0.ts
 *
 * 覆盖实施分包 3.5：
 *   W0-2  resolveStorefrontForHost 18 个格子（休眠 / 观察 / 严格 × 6 类 Host），查库报错渠道 Host 抛、主站不查库
 *   W0-3  休眠 + 「租户表不可用」（注入一查就抛的假库）：WP0 的店面、客户、通知、守卫函数在主站全部不碰新表
 *         （页面级「删空 tenants 后主站全站回归」需要起应用，留给 B1 合入后的主站回归 M1–M14）
 *   W0-4  partnerRoute 全部拒绝分支 + 审计口径（成员越权逐条 authz.denied；噪声只进汇总）
 *   W0-5  requirePartnerPage / requireChannelStorefrontPage（「客户端导航到无权页面」属浏览器行为，留给 WP6 W6-12）
 *   W0-6  ensureTenantCustomer 并发 20 次同一 (tenant, user)；另按设计 8.1 真实顺序「先读 → order.create → ensureTenantCustomer」
 *         并发 20 次（首单 / 已有关系各一组，防 users 行 S→X 死锁回归）；账本外键「先 CAS 订单再写分录」并发；publicNo 撞车重试
 *   W0-7  emitTenantNotice 同一 dedupeKey 两次：一行、推送一次；事务回滚不推；偏好关闭不推
 *   W0-8  adminGuard：AdminHostError → 404、其他错误 → 403（requireAdmin 的店面判定归 WP1，这里用模块替身注入）
 *   W0-9  prisma migrate diff（基线 24f5b0f 的 schema → 当前 schema；WP0_SCHEMA_BASE 可改）：只含设计 5.9 的表、列、索引；危险语句计数 0
 *   W0-10 writeAudit：PLATFORM 不给 publicDiff → 库里 NULL；TENANT 不给 → 等于 diff
 *   另：findTenantOrder 跨租户、storefrontById / tenantOrigin、isBlockedInTenant、inviteRoute
 * W0-1、W0-11 在 scripts/check-tenant-math.ts（纯函数）。
 */
import { execFileSync } from 'child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import Module from 'module'
import type { NextRequest } from 'next/server'
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
  createUser,
  RUN,
  type World,
} from './_harness'
import {
  resolveStorefrontForHost,
  setStorefrontDbForTest,
  invalidateStorefrontCache,
  storefrontById,
  getStorefront,
  requireShopStorefront,
  denyOnChannel,
  notFoundOnChannel,
  isPreviewUser,
  platformStorefront,
} from '../../src/lib/storefront/resolve'
import { tenantOrigin, tenantAbsUrl } from '../../src/lib/storefront/origin'
import { partnerRoute, inviteRoute, type PartnerCtx } from '../../src/lib/tenant/partner-route'
import { requirePartnerPage, requireChannelStorefrontPage } from '../../src/lib/tenant/partner-page'
import { ensureTenantCustomer, isBlockedInTenant, setCustomerPublicNoForTest } from '../../src/lib/tenant/customer'
import { newPublicNo } from '../../src/lib/tenant/public-no'
import { emitTenantNotice, setTenantNoticeTransportForTest, waitTenantNoticePushesForTest, WECOM_WEBHOOK_PREFIX } from '../../src/lib/tenant/notice'
import { sealText } from '../../src/lib/tenant/crypto'
import { writeAudit, writeAuditThrottled } from '../../src/lib/audit'
import { flushNoiseForTest } from '../../src/lib/tenant/throttle'
import { findTenantOrder, assertTenantId } from '../../src/lib/partner-services/_scope'
import { PARTNER_ORDER_LIST_SELECT, PARTNER_INTERNAL_ORDER_KEY_SELECT } from '../../src/lib/partner-services/selects'
import { AdminHostError } from '../../src/lib/tenant/admin-host-error'

const RUN_START = new Date()
/**
 * W0-9 的比较基线：WP0 开工时的线上版本（安全修复版 24f5b0f）。WP0 提交之后 HEAD 就已经含新表，
 * 拿 HEAD 比会得到空 diff，所以默认钉在这个提交；需要换基线时设 WP0_SCHEMA_BASE=<commit>。
 */
const SCHEMA_BASE = process.env.WP0_SCHEMA_BASE || '24f5b0f'

type Probe = { kind: 'platform' | 'channel' | 'null' | 'throw'; tenantId?: number }
async function probe(host: string | null): Promise<Probe> {
  try {
    const sf = await resolveStorefrontForHost(host)
    if (!sf) return { kind: 'null' }
    return sf.kind === 'PLATFORM' ? { kind: 'platform' } : { kind: 'channel', tenantId: sf.id }
  } catch {
    return { kind: 'throw' }
  }
}

/** 包一层真库，记录查询次数；throwAll=true 时任何查询都抛（模拟租户表不可用 / 数据库抖动） */
function countingDb(throwAll = false) {
  const calls = { domain: 0, tenant: 0 }
  const db = {
    findDomain: async (host: string) => {
      calls.domain++
      if (throwAll) throw new Error('itest: 注入的查库错误')
      return prisma.tenantDomain.findUnique({ where: { host }, select: { tenantId: true, status: true } })
    },
    findTenant: async (id: number) => {
      calls.tenant++
      if (throwAll) throw new Error('itest: 注入的查库错误')
      return prisma.tenant.findUnique({ where: { id }, select: { id: true, code: true, kind: true, status: true, origin: true } })
    },
  }
  return { db, calls }
}

const okHandler = async (_req: NextRequest, ctx: PartnerCtx) => Response.json({ success: true, data: { tenantOk: true, role: ctx.role, readOnly: ctx.readOnly } }, { status: 200 })

async function deniedCount(userId: number, since: Date): Promise<number> {
  return prisma.auditEvent.count({ where: { actorUserId: userId, action: 'authz.denied', at: { gte: since } } })
}

async function main() {
  await cleanupAll()
  const w: World = await createWorld()
  const disabledHost = `itd${w.run}.bigolab.com`.slice(0, 120)
  await prisma.tenantDomain.create({ data: { tenantId: w.lulu.id, host: disabledHost, status: 0 } })
  const unknownHost = `itu${w.run}.bigolab.com`

  // =======================================================================
  section('W0-2 店面解析 18 格（休眠 / 观察 / 严格 × 6 类 Host）')
  {
    const hosts: [string, string | null][] = [
      ['主站白名单 Host', 'www.bigolab.com'],
      ['已登记且启用（lulu）', w.lulu.host],
      ['已登记但域名停用', disabledHost],
      ['未登记 *.bigolab.com', unknownHost],
      ['公网 IP / 随机 Host / 无 Host', '47.100.1.2'],
      ['渠道 Host 查库报错', w.lulu.host],
    ]
    const expect: Record<'dormant' | 'observe' | 'strict', Probe['kind'][]> = {
      dormant: ['platform', 'platform', 'platform', 'platform', 'platform', 'platform'],
      observe: ['platform', 'channel', 'null', 'platform', 'platform', 'throw'],
      strict: ['platform', 'channel', 'null', 'null', 'null', 'throw'],
    }
    for (const mode of ['dormant', 'observe', 'strict'] as const) {
      setChannelsMode(mode)
      for (let i = 0; i < hosts.length; i++) {
        const [label, host] = hosts[i]
        const { db, calls } = countingDb(i === 5)
        setStorefrontDbForTest(db)
        const r = await probe(host)
        const want = expect[mode][i]
        let extraOk = true
        let extra = ''
        if (i === 0 || mode === 'dormant' || i === 4) {
          // 主站 / 休眠 / 非 bigolab Host：一次库都不查
          extraOk = calls.domain + calls.tenant === 0
          extra = `查库 ${calls.domain + calls.tenant} 次`
        }
        if (want === 'channel') extraOk = r.tenantId === w.lulu.id
        check(`${mode} · ${label} → ${want}`, r.kind === want && extraOk, `得到 ${r.kind}${r.tenantId ? `(${r.tenantId})` : ''}；${extra}`)
      }
      // 无 Host 与非法 Host 同第 5 类
      setStorefrontDbForTest(countingDb(true).db)
      const none = await probe(null)
      const junk = await probe('evil.com, bigolab.com')
      const wantNone = mode === 'strict' ? 'null' : 'platform'
      check(`${mode} · 无 Host / 非法 Host → ${wantNone}（且不查库）`, none.kind === wantNone && junk.kind === wantNone)
    }
    setStorefrontDbForTest(null)

    // 缓存：正缓存 60 秒内域名改停用不立即生效，invalidate 后立即生效；status 每请求查库
    setChannelsMode('observe')
    const { db, calls } = countingDb()
    setStorefrontDbForTest(db)
    await probe(w.lulu.host)
    await probe(w.lulu.host)
    check('host → 租户映射被缓存（两次解析只查一次域名表）', calls.domain === 1, `域名查询 ${calls.domain} 次`)
    check('tenants 行每次都查（status 立即生效）', calls.tenant === 2, `租户查询 ${calls.tenant} 次`)
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'SUSPENDED' } })
    const s1 = await resolveStorefrontForHost(w.lulu.host)
    check('改 SUSPENDED 后下一次解析立即看到', s1?.status === 'SUSPENDED')
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'ACTIVE' } })
    setStorefrontDbForTest(null)
    invalidateStorefrontCache()
  }

  // =======================================================================
  section('W0-3 休眠：租户表不可用时主站路径零依赖新表')
  {
    setChannelsMode('dormant')
    const { db, calls } = countingDb(true)
    setStorefrontDbForTest(db)
    const hosts = ['bigolab.com', w.lulu.host, unknownHost, '1.2.3.4', 'localhost:3000']
    let allPlatform = true
    for (const h of hosts) allPlatform = allPlatform && (await probe(h)).kind === 'platform'
    check('休眠时任何 Host 都是主站', allPlatform)
    check('storefrontById(1) 不查库', (await storefrontById(1))?.kind === 'PLATFORM')
    check('tenantOrigin(1) = siteOrigin()，不查库', (await tenantOrigin(1)) === platformStorefront().origin)
    check('tenantAbsUrl(1, /orders)', (await tenantAbsUrl(1, '/orders')) === platformStorefront().origin + '/orders')
    let rejected = 0
    for (const bad of ['//evil.com/x', 'https://evil.com', 'orders', '/\\evil.com']) {
      try {
        await tenantAbsUrl(1, bad)
      } catch {
        rejected++
      }
    }
    check('tenantAbsUrl 拒绝非站内路径', rejected === 4)
    check('isPreviewUser(1, …) = false 不查库', (await isPreviewUser(1, w.users.luluBuyer1.id)) === false)
    const denied = await withRequest({ host: w.lulu.host }, () => denyOnChannel())
    check('休眠时 denyOnChannel 在任何 Host 都放行（null）', denied === null)
    const nf = await withRequest({ host: w.lulu.host }, () => catchNext(() => notFoundOnChannel()))
    check('休眠时 notFoundOnChannel 不 404', nf.kind === 'ok')
    const shop = await withRequest({ host: w.lulu.host }, () => catchNext(() => requireShopStorefront({ userId: null })))
    check('休眠时 requireShopStorefront 返回主站', shop.kind === 'ok' && shop.value.kind === 'PLATFORM')
    const r = await callRoute(partnerRoute('order.read', okHandler), { host: w.lulu.host, token: w.token(w.users.luluOwner, w.lulu) })
    check('休眠时 partnerRoute 一律 404（店面是主站）', r.status === 404)
    const before = await prisma.tenantCustomer.count({ where: { userId: w.users.crossBuyer.id } })
    await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: 1, userId: w.users.crossBuyer.id, via: 'ORDER' }))
    check('ensureTenantCustomer(tenantId=1) 不写', (await prisma.tenantCustomer.count({ where: { userId: w.users.crossBuyer.id } })) === before)
    await emitTenantNotice(null, { tenantId: 1, kind: 'ORDER_PAID', title: 'x' })
    check('emitTenantNotice(tenantId=1) 不写', (await prisma.tenantNotice.count({ where: { tenantId: 1 } })) === 0)
    check('isBlockedInTenant(1, …) = false 不查库', (await isBlockedInTenant(prisma, 1, w.users.crossBuyer.id)) === false)
    check('以上全程店面层查库 0 次', calls.domain + calls.tenant === 0, `查库 ${calls.domain + calls.tenant} 次`)
    setStorefrontDbForTest(null)
  }

  // =======================================================================
  section('W0-4 partnerRoute')
  setChannelsMode('observe')
  invalidateStorefrontCache()
  {
    const since = new Date()
    const owner = w.users.luluOwner
    const tOwner = w.token(owner, w.lulu)
    const route = partnerRoute('order.read', okHandler)

    let r = await callRoute(route, { host: w.lulu.host, token: tOwner })
    check('OWNER 在本渠道 Host → 200，ctx 正确', r.status === 200 && r.json?.data?.role === 'OWNER' && r.json?.data?.readOnly === false, `${r.status} ${r.text}`)
    r = await callRoute(route, { host: 'bigolab.com', token: tOwner })
    check('主站 Host → 404', r.status === 404)
    r = await callRoute(route, { host: w.zz.host, token: w.token(owner, w.zz) })
    check('别的渠道 Host（非该渠道成员）→ 404', r.status === 404)
    r = await callRoute(route, { host: w.lulu.host })
    check('未登录 → 401', r.status === 401)

    // 非成员：404 且不产生逐条审计，只进噪声汇总
    const buyer = w.users.luluBuyer1
    r = await callRoute(route, { host: w.lulu.host, token: w.token(buyer, w.lulu), headers: { 'cf-connecting-ip': '10.77.0.1' } })
    check('非成员（本站买家）→ 404', r.status === 404)
    check('非成员不写 authz.denied', (await deniedCount(buyer.id, since)) === 0)
    const noise = flushNoiseForTest()
    check('非成员计入噪声汇总（按 IP + 原因）', (noise.get('10.77.0.1|not-member') || 0) >= 1, JSON.stringify(Array.from(noise.entries())))

    // 响应体：不存在与无权同一响应体
    const r404a = await callRoute(route, { host: 'bigolab.com', token: tOwner })
    const r404b = await callRoute(route, { host: w.lulu.host, token: w.token(buyer, w.lulu) })
    check('「主站 Host」「非成员」两种 404 响应体逐字相同', r404a.text === r404b.text, `${r404a.text} vs ${r404b.text}`)

    // STAFF：无权限点 → 404 + authz.denied；OWNER_ONLY → 404
    const staff = await createUser('lulu-staff', { registeredTenantId: w.lulu.id })
    await prisma.tenantMember.create({ data: { tenantId: w.lulu.id, userId: staff.id, role: 'STAFF', perms: ['order.read', 'order.export', 'finance.read'], status: 1 } })
    const tStaff = w.token(staff, w.lulu)
    r = await callRoute(partnerRoute('order.read', okHandler), { host: w.lulu.host, token: tStaff })
    check('STAFF 有 order.read → 200', r.status === 200 && r.json?.data?.role === 'STAFF')
    r = await callRoute(partnerRoute('customer.read', okHandler), { host: w.lulu.host, token: tStaff })
    check('STAFF 无 customer.read → 404', r.status === 404)
    r = await callRoute(partnerRoute('order.export', okHandler), { host: w.lulu.host, token: tStaff })
    check('STAFF 调 OWNER_ONLY（order.export，即使 perms 里写了）→ 404', r.status === 404)
    r = await callRoute(partnerRoute('finance.read', okHandler), { host: w.lulu.host, token: tStaff })
    check('STAFF 调 OWNER_ONLY（finance.read）→ 404', r.status === 404)
    await new Promise((res) => setTimeout(res, 300)) // authz.denied 是异步写
    check('成员越权逐条写 authz.denied（3 条）', (await deniedCount(staff.id, since)) === 3, `实际 ${await deniedCount(staff.id, since)} 条`)
    const d = await prisma.auditEvent.findFirst({ where: { actorUserId: staff.id, action: 'authz.denied' }, orderBy: { id: 'desc' } })
    check('authz.denied 行：TENANT / DENIED / 本渠道 / publicDiff 为空', !!d && d.actorKind === 'TENANT' && d.result === 'DENIED' && d.tenantId === w.lulu.id && d.publicDiff === null)

    // 停用成员下一次请求 404
    await prisma.tenantMember.updateMany({ where: { tenantId: w.lulu.id, userId: staff.id }, data: { status: 0 } })
    r = await callRoute(partnerRoute('order.read', okHandler), { host: w.lulu.host, token: tStaff })
    check('停用成员 → 404（每请求查库，T15）', r.status === 404)

    // DRAFT：不在 DRAFT_SAFE_PERMS 的点 404，在的点 200
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'DRAFT' } })
    r = await callRoute(partnerRoute('order.cards', okHandler), { host: w.lulu.host, token: tOwner })
    check('DRAFT 下 order.cards → 404', r.status === 404)
    r = await callRoute(partnerRoute('listing.write', okHandler), { host: w.lulu.host, token: tOwner, method: 'POST', body: {} })
    check('DRAFT 下 listing.write → 200（开业前可以定价上架）', r.status === 200, `${r.status} ${r.text}`)

    // SUSPENDED：写接口 404，readOnlySafe 的读接口 200 且 readOnly=true
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'SUSPENDED' } })
    r = await callRoute(partnerRoute('listing.write', okHandler), { host: w.lulu.host, token: tOwner, method: 'POST', body: {} })
    check('SUSPENDED 写接口 → 404', r.status === 404)
    r = await callRoute(partnerRoute('order.read', okHandler, { readOnlySafe: true }), { host: w.lulu.host, token: tOwner })
    check('SUSPENDED 读接口（readOnlySafe）→ 200 且 readOnly', r.status === 200 && r.json?.data?.readOnly === true)

    // TERMINATED：一律 404
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'TERMINATED' } })
    r = await callRoute(partnerRoute('order.read', okHandler, { readOnlySafe: true }), { host: w.lulu.host, token: tOwner })
    check('TERMINATED → 404', r.status === 404)
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'ACTIVE' } })

    // ADMIN：与未登录同为 401（主会话 D2 方案 a：getCurrentUser 在渠道店面对 ADMIN 返回 null，不暴露其为管理员），
    // 即使被错误地加成了成员也进不了 handler
    await prisma.tenantMember.create({ data: { tenantId: w.lulu.id, userId: w.users.sa.id, role: 'OWNER', status: 1 } })
    r = await callRoute(route, { host: w.lulu.host, token: w.token(w.users.sa, w.lulu) })
    check('ADMIN（即使是成员）→ 401（D2：视为未登录）', r.status === 401, `${r.status}`)
    await prisma.tenantMember.deleteMany({ where: { tenantId: w.lulu.id, userId: w.users.sa.id } })

    // 跨站 POST
    const post = partnerRoute('listing.write', okHandler)
    r = await callRoute(post, { host: w.lulu.host, token: tOwner, method: 'POST', body: {}, headers: { origin: 'https://bigolab.com' } })
    check('跨站 POST（Origin=主站，兄弟子域）→ 404', r.status === 404)
    r = await callRoute(post, { host: w.lulu.host, token: tOwner, method: 'POST', body: {}, headers: { 'sec-fetch-site': 'same-site' } })
    check('跨站 POST（Sec-Fetch-Site=same-site）→ 404', r.status === 404)
    r = await callRoute(post, { host: w.lulu.host, token: tOwner, method: 'POST', body: 'a=1', headers: { 'content-type': 'text/plain' } })
    check('text/plain 表单 POST → 404', r.status === 404)
    r = await callRoute(post, { host: w.lulu.host, token: tOwner, method: 'POST', body: {}, headers: { origin: w.lulu.origin, 'sec-fetch-site': 'same-origin' } })
    check('同源 JSON POST → 200', r.status === 200, `${r.status} ${r.text}`)
    // OWNER 的逐条审计只应来自两次「成员越权」：DRAFT 下 order.cards、SUSPENDED 下写接口；
    // 主站 Host、别的渠道 Host、TERMINATED、三次跨站 POST 都是噪声，不逐条写
    await new Promise((res) => setTimeout(res, 300))
    const ownerDenied = await deniedCount(owner.id, since)
    check('噪声类拒绝（主站 Host / TERMINATED / csrf / ADMIN / 非成员）没有逐条审计', ownerDenied === 2 && (await deniedCount(w.users.sa.id, since)) === 0,
      `owner authz.denied=${ownerDenied}（期望 2）`)

    // 路由级限频
    const limited = partnerRoute('order.read', okHandler, { rate: { key: `itrate${w.run}`, max: 2, windowMs: 60_000 } })
    const a = await callRoute(limited, { host: w.lulu.host, token: tOwner })
    const b = await callRoute(limited, { host: w.lulu.host, token: tOwner })
    const c = await callRoute(limited, { host: w.lulu.host, token: tOwner })
    check('opts.rate：第 3 次 429', a.status === 200 && b.status === 200 && c.status === 429)

    // params 透传
    const echo = partnerRoute('order.read', async (_q, _c, p) => Response.json({ success: true, data: { orderNo: p.orderNo ?? null } }))
    r = await callRoute(echo, { host: w.lulu.host, token: tOwner, params: { orderNo: w.orders.luluAuto.orderNo } })
    check('params 透传给 handler', r.json?.data?.orderNo === w.orders.luluAuto.orderNo)

    // inviteRoute：不要求成员；主站 Host / 跨站 404；ADMIN 与未登录同为 401（D2）
    const inv = inviteRoute(async (_q, ctx) => Response.json({ success: true, data: { tenantOk: ctx.tenantId === w.lulu.id } }))
    const ir = (o: Parameters<typeof callRoute>[1]) => callRoute(inv as never, o)
    r = await ir({ host: w.lulu.host, token: w.token(w.users.luluBuyer2, w.lulu), method: 'POST', body: {} })
    check('inviteRoute：非成员登录用户 → 进入 handler，tenantId 来自店面', r.status === 200 && r.json?.data?.tenantOk === true)
    r = await ir({ host: 'bigolab.com', token: w.token(w.users.luluBuyer2), method: 'POST', body: {} })
    check('inviteRoute：主站 Host → 404', r.status === 404)
    r = await ir({ host: w.lulu.host, token: w.token(w.users.sa, w.lulu), method: 'POST', body: {} })
    check('inviteRoute：ADMIN → 401（D2：视为未登录）', r.status === 401, `${r.status}`)
    r = await ir({ host: w.lulu.host, method: 'POST', body: {} })
    check('inviteRoute：未登录 → 401', r.status === 401)
    r = await ir({ host: w.lulu.host, token: w.token(w.users.luluBuyer2, w.lulu), method: 'POST', body: {}, headers: { origin: 'https://evil.bigolab.com' } })
    check('inviteRoute：跨站 → 404', r.status === 404)
  }

  // =======================================================================
  section('W0-5 页面守卫')
  {
    const tOwner = w.token(w.users.luluOwner, w.lulu)
    let r = await withRequest({ host: 'bigolab.com', token: tOwner }, () => catchNext(() => requirePartnerPage('dashboard.read')))
    check('requirePartnerPage：主站 Host → notFound', r.kind === 'notFound')
    r = await withRequest({ host: w.lulu.host }, () => catchNext(() => requirePartnerPage('dashboard.read')))
    check('requirePartnerPage：未登录 → redirect /partner/login', r.kind === 'redirect' && r.location === '/partner/login', JSON.stringify(r))
    r = await withRequest({ host: w.lulu.host, token: w.token(w.users.luluBuyer1, w.lulu) }, () => catchNext(() => requirePartnerPage('dashboard.read')))
    check('requirePartnerPage：非成员 → notFound', r.kind === 'notFound')
    r = await withRequest({ host: w.lulu.host, token: tOwner }, () => catchNext(() => requirePartnerPage('finance.read')))
    check('requirePartnerPage：OWNER → ctx', r.kind === 'ok' && (r.value as PartnerCtx).tenantId === w.lulu.id)
    r = await withRequest({ host: w.lulu.host, token: w.token(w.users.sa, w.lulu) }, () => catchNext(() => requirePartnerPage('dashboard.read')))
    check('requirePartnerPage：ADMIN → redirect /partner/login（D2：视为未登录）', r.kind === 'redirect' && r.location === '/partner/login', JSON.stringify(r))
    let c = await withRequest({ host: 'bigolab.com' }, () => catchNext(() => requireChannelStorefrontPage()))
    check('requireChannelStorefrontPage：主站 Host → notFound', c.kind === 'notFound')
    c = await withRequest({ host: w.lulu.host }, () => catchNext(() => requireChannelStorefrontPage()))
    check('requireChannelStorefrontPage：lulu 未登录 → 正常（不重定向）', c.kind === 'ok')
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'TERMINATED' } })
    c = await withRequest({ host: w.lulu.host }, () => catchNext(() => requireChannelStorefrontPage()))
    check('requireChannelStorefrontPage：TERMINATED → notFound', c.kind === 'notFound')
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'ACTIVE' } })

    // requireShopStorefront：DRAFT 预览
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'DRAFT', previewUserIds: [w.users.luluBuyer2.id] } })
    let s = await withRequest({ host: w.lulu.host }, () => catchNext(() => requireShopStorefront({ userId: w.users.luluBuyer1.id })))
    check('requireShopStorefront：DRAFT 非预览用户 → notFound', s.kind === 'notFound')
    s = await withRequest({ host: w.lulu.host }, () => catchNext(() => requireShopStorefront({ userId: w.users.luluBuyer2.id })))
    check('requireShopStorefront：DRAFT 预览用户 → 店面', s.kind === 'ok')
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'SUSPENDED' } })
    s = await withRequest({ host: w.lulu.host }, () => catchNext(() => requireShopStorefront({ userId: null })))
    check('requireShopStorefront：SUSPENDED 照常返回（外壳显示横幅）', s.kind === 'ok' && (s.value as { status: string }).status === 'SUSPENDED')
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'ACTIVE', previewUserIds: Prisma.DbNull } })

    const deny = await withRequest({ host: w.lulu.host }, () => denyOnChannel())
    check('denyOnChannel：渠道 Host → 404 JSON', deny?.status === 404)
    const allow = await withRequest({ host: 'bigolab.com' }, () => denyOnChannel())
    check('denyOnChannel：主站 Host → null', allow === null)
    const nf = await withRequest({ host: w.lulu.host }, () => catchNext(() => notFoundOnChannel()))
    check('notFoundOnChannel：渠道 Host → notFound', nf.kind === 'notFound')
    // 同一请求内记忆：两次 getStorefront 只解析一次
    const { db, calls } = countingDb()
    setStorefrontDbForTest(db)
    await withRequest({ host: w.lulu.host }, async () => {
      await getStorefront()
      await getStorefront()
    })
    check('getStorefront 按请求记忆（同一请求只查一次租户行）', calls.tenant === 1, `租户查询 ${calls.tenant} 次`)
    setStorefrontDbForTest(null)
    check('storefrontById(lulu) = 数据行 origin', (await storefrontById(w.lulu.id))?.origin === w.lulu.origin)
    check('tenantOrigin(lulu)', (await tenantOrigin(w.lulu.id)) === w.lulu.origin)
    let threw = false
    try {
      await tenantOrigin(999999999)
    } catch {
      threw = true
    }
    check('tenantOrigin(不存在的租户) 抛错而不是回落主站', threw)
  }

  // =======================================================================
  section('W0-6 ensureTenantCustomer 并发 20 次同一 (tenant, user)')
  {
    const u = await createUser('concurrent')
    const base = Date.now()
    const ats = Array.from({ length: 20 }, (_, i) => new Date(base - (i * 7919) % 100_000))
    const results = await Promise.allSettled(
      ats.map((at) => prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId: u.id, via: 'ORDER', at }), { timeout: 30_000 })),
    )
    const errs = results.filter((x) => x.status === 'rejected') as PromiseRejectedResult[]
    check('20 个并发事务全部成功（无死锁、无 P2002）', errs.length === 0, errs.map((e) => String(e.reason?.message || e.reason).slice(0, 120)).join(' | '))
    const rows = await prisma.tenantCustomer.findMany({ where: { tenantId: w.lulu.id, userId: u.id } })
    check('只有 1 行', rows.length === 1)
    const minAt = Math.min(...ats.map((d) => d.getTime()))
    const maxAt = Math.max(...ats.map((d) => d.getTime()))
    check('firstOrderAt = 最早、lastOrderAt = 最晚', rows[0]?.firstOrderAt?.getTime() === minAt && rows[0]?.lastOrderAt?.getTime() === maxAt,
      `${rows[0]?.firstOrderAt?.toISOString()} / ${rows[0]?.lastOrderAt?.toISOString()}`)
    check('joinedVia = ORDER、publicNo 12 位', rows[0]?.joinedVia === 'ORDER' && /^[0-9A-Z]{12}$/.test(rows[0]?.publicNo || ''))

    const u2 = await createUser('concurrent-reg')
    const r2 = await Promise.allSettled(
      Array.from({ length: 20 }, () => prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId: u2.id, via: 'REGISTER' }), { timeout: 30_000 })),
    )
    check('REGISTER 并发 20 次：无异常、1 行', r2.every((x) => x.status === 'fulfilled') && (await prisma.tenantCustomer.count({ where: { userId: u2.id } })) === 1)
    const row2 = await prisma.tenantCustomer.findFirst({ where: { userId: u2.id } })
    check('REGISTER 不写下单时间', row2?.firstOrderAt === null && row2?.lastOrderAt === null)

    // ---- 真实下单链路（设计 8.1 第 6 步的顺序）：同一事务里 ①先读（resolveUnitPrice 那样，建立 RR 一致性快照）
    // ②order.create（orders.user_id 外键给 users 行加 S 锁）③ensureTenantCustomer。
    // 用栅栏让所有事务都插完订单再进入 ③，稳定复现「S 锁在手、再抢 X 锁」的互等；上面的纯并发用例测不出来（审查 W0 #1）。
    let w06Seq = 0
    const orderChain = (userId: number, via: 'ORDER' | 'REGISTER', n: number) => {
      let arrived = 0
      let open!: () => void
      const gate = new Promise<void>((r) => (open = r))
      const timer = setTimeout(() => open(), 3_000) // 连接池比 n 小时，排队的事务不会永远等栅栏
      const one = (i: number) =>
        prisma.$transaction(
          async (tx) => {
            await tx.product.findUnique({ where: { id: w.products.auto }, select: { id: true } })
            await tx.order.create({
              data: {
                orderNo: `ITW6${RUN.toUpperCase()}${++w06Seq}`.slice(0, 32),
                userId,
                productId: w.products.auto,
                productName: 'ITEST-TENANT W0-6',
                productPrice: new Prisma.Decimal('107.13'),
                quantity: 1,
                amount: new Prisma.Decimal('107.13'),
                tenantId: w.lulu.id,
              },
            })
            if (++arrived >= n) open()
            await gate
            await ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId, via, at: new Date(base - i * 1000) })
          },
          { timeout: 30_000, maxWait: 30_000 },
        )
      return Promise.allSettled(Array.from({ length: n }, (_, i) => one(i))).finally(() => clearTimeout(timer))
    }
    const errMsg = (rs: PromiseSettledResult<unknown>[]) =>
      (rs.filter((x) => x.status === 'rejected') as PromiseRejectedResult[]).map((e) => String(e.reason?.message || e.reason).slice(-160)).join(' | ')

    // 首单并发：客户关系行还不存在
    const u3 = await createUser('chain-first')
    const r3 = await orderChain(u3.id, 'ORDER', 20)
    check('下单链路·首单并发 20：全部成功（无 1213 死锁、无「编号连续冲突」）', r3.every((x) => x.status === 'fulfilled'), errMsg(r3))
    const rows3 = await prisma.tenantCustomer.findMany({ where: { tenantId: w.lulu.id, userId: u3.id } })
    check('下单链路·首单并发：1 行、订单 20 张',
      rows3.length === 1 && (await prisma.order.count({ where: { userId: u3.id } })) === 20)
    check('下单链路·首单并发：firstOrderAt = 最早、lastOrderAt = 最晚',
      rows3[0]?.firstOrderAt?.getTime() === base - 19_000 && rows3[0]?.lastOrderAt?.getTime() === base,
      `${rows3[0]?.firstOrderAt?.toISOString()} / ${rows3[0]?.lastOrderAt?.toISOString()}`)

    // 已有客户关系（先 REGISTER）后再并发下单
    const u4 = await createUser('chain-existing')
    await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId: u4.id, via: 'REGISTER' }))
    const r4 = await orderChain(u4.id, 'ORDER', 20)
    check('下单链路·已有关系并发 20：全部成功', r4.every((x) => x.status === 'fulfilled'), errMsg(r4))
    const rows4 = await prisma.tenantCustomer.findMany({ where: { tenantId: w.lulu.id, userId: u4.id } })
    check('下单链路·已有关系：仍 1 行、joinedVia 保持 REGISTER、下单时间已补',
      rows4.length === 1 && rows4[0].joinedVia === 'REGISTER' && rows4[0].firstOrderAt?.getTime() === base - 19_000 && rows4[0].lastOrderAt?.getTime() === base)

    // 账本外键（tenant_ledger_entries.order_id → orders）：按设计 10.5「先 CAS 订单行、再写分录」的顺序并发，恰好一方成功、无死锁
    const lo = w.orders.luluAuto
    const v0 = (await prisma.order.findUniqueOrThrow({ where: { id: lo.id }, select: { settleVersion: true } })).settleVersion
    const r5 = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        prisma.$transaction(
          async (tx) => {
            const cas = await tx.order.updateMany({ where: { id: lo.id, settleVersion: v0 }, data: { settleVersion: v0 + 1 } })
            if (cas.count !== 1) return false
            await tx.tenantLedgerEntry.createMany({
              data: [
                { tenantId: w.lulu.id, eventKey: `itest-w06:${RUN}:v${v0 + 1}`, leg: 'g', type: 'ADJUST', component: 'MANUAL', bucket: 'PENDING', amountCents: 1, orderId: lo.id },
                { tenantId: w.lulu.id, eventKey: `itest-w06:${RUN}:v${v0 + 1}`, leg: 'p', type: 'ADJUST', component: 'MANUAL', bucket: 'PENDING', amountCents: -1, orderId: lo.id },
              ],
              skipDuplicates: true,
            })
            return true
          },
          { timeout: 30_000, maxWait: 30_000 },
        ),
      ),
    )
    const wins = r5.filter((x) => x.status === 'fulfilled' && x.value === true).length
    check('账本外键·先 CAS 再写分录并发 10：无异常、恰好 1 个赢家、2 条分录',
      r5.every((x) => x.status === 'fulfilled') && wins === 1 &&
        (await prisma.tenantLedgerEntry.count({ where: { eventKey: `itest-w06:${RUN}:v${v0 + 1}` } })) === 2, errMsg(r5))
    await prisma.order.update({ where: { id: lo.id }, data: { settleVersion: v0 } })

    // publicNo 撞上别人那一行：ON DUPLICATE KEY 会命中别人的行，UPDATE 子句必须是空操作，然后换编号重试
    const victimKey = { tenantId_userId: { tenantId: w.lulu.id, userId: w.users.luluBuyer1.id } }
    const victimBefore = await prisma.tenantCustomer.findUniqueOrThrow({ where: victimKey })
    const u6 = await createUser('collide')
    let gen = 0
    setCustomerPublicNoForTest(() => (++gen <= 2 ? victimBefore.publicNo : newPublicNo()))
    try {
      await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId: u6.id, via: 'ORDER', at: new Date('2001-01-01T00:00:00Z') }))
      const mine = await prisma.tenantCustomer.findUnique({ where: { tenantId_userId: { tenantId: w.lulu.id, userId: u6.id } } })
      const victimAfter = await prisma.tenantCustomer.findUniqueOrThrow({ where: victimKey })
      check('编号撞车 2 次后第 3 次成功：本行存在且编号不同', gen === 3 && !!mine && mine.publicNo !== victimBefore.publicNo)
      check('编号撞车：别人那一行的下单时间 / updatedAt 原样不动',
        victimAfter.firstOrderAt?.getTime() === victimBefore.firstOrderAt?.getTime() &&
          victimAfter.lastOrderAt?.getTime() === victimBefore.lastOrderAt?.getTime() &&
          victimAfter.updatedAt?.getTime() === victimBefore.updatedAt?.getTime())

      const u7 = await createUser('collide-3x')
      setCustomerPublicNoForTest(() => victimBefore.publicNo)
      let msg = ''
      try {
        await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId: u7.id, via: 'ORDER', at: new Date('2099-01-01T00:00:00Z') }))
      } catch (e) {
        msg = String((e as Error).message)
      }
      const victimAfter2 = await prisma.tenantCustomer.findUniqueOrThrow({ where: victimKey })
      check('编号连撞 3 次 → 抛错、不留行、别人那一行 lastOrderAt 不被改成 2099',
        msg.includes('编号连续冲突') && (await prisma.tenantCustomer.count({ where: { userId: u7.id } })) === 0 &&
          victimAfter2.lastOrderAt?.getTime() === victimBefore.lastOrderAt?.getTime(), msg)
    } finally {
      setCustomerPublicNoForTest(null)
    }

    await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: 1, userId: u.id, via: 'ORDER' }))
    check('tenantId=1 不写', (await prisma.tenantCustomer.count({ where: { userId: u.id, tenantId: 1 } })) === 0)
    await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: w.lulu.id, userId: w.users.sa.id, via: 'ORDER' }))
    check('ADMIN 用户不写', (await prisma.tenantCustomer.count({ where: { userId: w.users.sa.id } })) === 0)
    let threw = false
    try {
      await prisma.$transaction((tx) => ensureTenantCustomer(tx, { tenantId: 0, userId: u.id, via: 'ORDER' }))
    } catch {
      threw = true
    }
    check('tenantId 非法 → 抛', threw)

    // isBlockedInTenant
    check('isBlockedInTenant：未拉黑 → false', (await isBlockedInTenant(prisma, w.lulu.id, u.id)) === false)
    await prisma.tenantCustomer.updateMany({ where: { tenantId: w.lulu.id, userId: u.id }, data: { blockedAt: new Date(), blockedByKind: 'TENANT' } })
    check('isBlockedInTenant：本站拉黑 → true', (await isBlockedInTenant(prisma, w.lulu.id, u.id)) === true)
    check('isBlockedInTenant：别的站不受影响', (await isBlockedInTenant(prisma, w.zz.id, u.id)) === false)
    check('isBlockedInTenant：主站恒 false', (await isBlockedInTenant(prisma, 1, u.id)) === false)
  }

  // =======================================================================
  section('W0-7 emitTenantNotice')
  {
    let pushes = 0
    let lastPayload = ''
    setTenantNoticeTransportForTest(async (_url, payload) => {
      pushes++
      lastPayload = JSON.stringify(payload)
      return true
    })
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { wecomWebhookEnc: sealText('webhook', `${WECOM_WEBHOOK_PREFIX}itest-${w.run}`), noticePrefs: { SUPPLY_CHANGED: false } } })
    const key = `itest:${w.run}:paid`
    const n = { tenantId: w.lulu.id, kind: 'ORDER_PAID' as const, title: '订单已支付', body: `买家 ${w.users.luluBuyer1.email} 付款 140.00`, refType: 'order' as const, refKey: w.orders.luluAuto.orderNo, dedupeKey: key }
    await emitTenantNotice(null, n)
    await emitTenantNotice(null, n)
    await waitTenantNoticePushesForTest()
    check('同一 dedupeKey 两次 → 一行', (await prisma.tenantNotice.count({ where: { dedupeKey: key } })) === 1)
    check('企业微信推送一次', pushes === 1, `推送 ${pushes} 次`)
    check('推送成功记 pushedAt', !!(await prisma.tenantNotice.findFirst({ where: { dedupeKey: key } }))?.pushedAt)
    check('推送载荷不含买家邮箱', !lastPayload.includes(w.users.luluBuyer1.email) && lastPayload.includes('[邮箱已隐藏]'))
    check('推送载荷带渠道后台链接', lastPayload.includes(`${w.lulu.origin}/partner/orders/${w.orders.luluAuto.orderNo}`))

    // 主会话 D8：webhook 密文用 TENANT_DATA_KEY 加密，与 JWT_SECRET 解耦——站长轮换 JWT_SECRET 后推送照常
    {
      const jwtBak = process.env.JWT_SECRET
      process.env.JWT_SECRET = `rotated-${w.run}-0123456789abcdef0123456789abcdef`
      try {
        await emitTenantNotice(null, { ...n, dedupeKey: `itest:${w.run}:rotated` })
        await waitTenantNoticePushesForTest()
        check('轮换 JWT_SECRET 后 webhook 仍能解密并推送（D8）', pushes === 2, `推送 ${pushes} 次`)
      } finally {
        process.env.JWT_SECRET = jwtBak
      }
      pushes = 1
    }

    // 同一事务写入：事务回滚 → 没有行、也不推
    const k2 = `itest:${w.run}:rollback`
    await prisma
      .$transaction(async (tx) => {
        await emitTenantNotice(tx, { ...n, dedupeKey: k2 })
        throw new Error('itest rollback')
      })
      .catch(() => undefined)
    await waitTenantNoticePushesForTest()
    check('业务事务回滚 → 通知不存在', (await prisma.tenantNotice.count({ where: { dedupeKey: k2 } })) === 0)
    check('业务事务回滚 → 不推送', pushes === 1, `推送 ${pushes} 次`)

    // 事务内写入并提交 → 提交后推送
    const k3 = `itest:${w.run}:tx`
    await prisma.$transaction((tx) => emitTenantNotice(tx, { ...n, dedupeKey: k3 }))
    await waitTenantNoticePushesForTest()
    check('事务提交后推送', pushes === 2)

    // 偏好关闭：站内通知照写，不推企业微信
    await emitTenantNotice(null, { tenantId: w.lulu.id, kind: 'SUPPLY_CHANGED', title: '进货价调整', dedupeKey: `itest:${w.run}:supply` })
    await waitTenantNoticePushesForTest()
    check('偏好关闭 → 写站内通知、不推送', (await prisma.tenantNotice.count({ where: { dedupeKey: `itest:${w.run}:supply` } })) === 1 && pushes === 2)
    const row = await prisma.tenantNotice.findFirst({ where: { dedupeKey: key } })
    check('noticeNo 为 12 位随机编号', /^[0-9A-Z]{12}$/.test(row?.publicNo || ''))
    setTenantNoticeTransportForTest(null)
  }

  // =======================================================================
  section('W0-8 adminGuard：AdminHostError → 404，其他错误 → 403')
  {
    // requireAdmin 的「必须主站店面」归 WP1（src/lib/auth.ts）。这里用 Module._load 只给 admin-guard.ts 换一个 auth 替身，
    // 验证 WP0 这一侧的映射；真实链路（lulu Host + ADMIN token → 404）在 WP1 合入后由 W1-10 联调。
    const guardPath = require.resolve('../../src/lib/admin-guard')
    let behavior: 'host' | 'forbidden' | 'ok' = 'host'
    const fakeAuth = {
      requireAdmin: async () => {
        if (behavior === 'host') throw new AdminHostError()
        if (behavior === 'forbidden') throw new Error('Forbidden')
        return { id: 1 }
      },
    }
    const M = Module as unknown as { _load: (req: string, parent: { filename?: string } | null, isMain: boolean) => unknown }
    const origLoad = M._load
    M._load = function (request, parent, isMain) {
      if (request === './auth' && parent?.filename && path.resolve(parent.filename) === path.resolve(guardPath)) return fakeAuth
      return origLoad.call(this, request, parent, isMain)
    }
    delete require.cache[guardPath]
    try {
      const { adminGuard } = require('../../src/lib/admin-guard') as typeof import('../../src/lib/admin-guard')
      const run = () => withRequest({ host: w.lulu.host }, () => adminGuard())
      let res = await run()
      check('AdminHostError → 404', res?.status === 404)
      behavior = 'forbidden'
      res = await run()
      check('其他错误 → 403', res?.status === 403)
      behavior = 'ok'
      res = await run()
      check('管理员 → null（放行）', res === null)
      behavior = 'host'
      res = await withRequest({ host: 'bigolab.com', headers: { origin: 'https://evil.example' } }, () => adminGuard())
      check('跨站请求仍先 403（同源校验在前，P0 前置行为不变）', res?.status === 403)
    } finally {
      M._load = origLoad
      delete require.cache[guardPath]
    }
    const src = readFileSync(guardPath, 'utf8')
    check('admin-guard.ts 只改了一处映射（isAdminHostError → 404）', (src.match(/isAdminHostError/g) || []).length === 2 && src.includes("error('资源不存在', 404)"))
  }

  // =======================================================================
  section(`W0-9 schema 增量（${SCHEMA_BASE} 的 schema → 当前 schema 的 migrate diff）`)
  {
    const dir = mkdtempSync(path.join(tmpdir(), 'wp0-schema-'))
    const head = path.join(dir, 'head.prisma')
    let headSchema = ''
    try {
      headSchema = execFileSync('git', ['show', `${SCHEMA_BASE}:prisma/schema.prisma`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
    } catch {
      /* 非 git 工作区 */
    }
    if (!headSchema) {
      check('读取 HEAD 的 schema.prisma', false, 'git show 失败，跳过 W0-9')
    } else {
      writeFileSync(head, headSchema)
      // 直接用 node 跑本地 prisma CLI（不经 shell，路径里有空格也安全）
      const prismaCli = require.resolve('prisma/build/index.js')
      const sql = execFileSync(process.execPath, [prismaCli, 'migrate', 'diff', '--from-schema-datamodel', head, '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      })
      writeFileSync(path.join(dir, 'preview.sql'), sql)
      check('预览 SQL 非空', sql.trim().length > 0 && !/empty migration/i.test(sql))
      // 设计 5.9 的「语句开头」危险语句闸门
      const danger = sql.split('\n').filter((l) => /^\s*(DROP|MODIFY|CHANGE|RENAME)\b/i.test(l) || /^\s*ALTER\s+TABLE\s+\S+\s+(DROP|RENAME|MODIFY|CHANGE)\b/i.test(l))
      check('危险语句计数 = 0', danger.length === 0, danger.join(' | '))
      const created = Array.from(sql.matchAll(/CREATE TABLE `([a-z_]+)`/g)).map((m) => m[1]).sort()
      const wantTables = [
        'audit_events', 'tenant_after_sales', 'tenant_customers', 'tenant_domains', 'tenant_invites', 'tenant_ledger_entries', 'tenant_listings',
        'tenant_members', 'tenant_notices', 'tenant_payouts', 'tenant_statement_lines', 'tenant_statements', 'tenants',
      ]
      check('恰好 13 条 CREATE TABLE（设计 5.9）', JSON.stringify(created) === JSON.stringify(wantTables), created.join(','))
      // 现有表只 ADD COLUMN
      const addCols: string[] = []
      let table = ''
      for (const line of sql.split('\n')) {
        const m = /^ALTER TABLE `([a-z_]+)` (.*)$/.exec(line)
        const body = m ? m[2] : line.trim()
        if (m) table = m[1]
        const c = /^ADD COLUMN `([a-z_]+)` (.*?)[,;]?$/.exec(body)
        if (c && table) addCols.push(`${table}.${c[1]} ${c[2]}`)
      }
      const colNames = addCols.map((x) => x.split(' ')[0]).sort()
      const wantCols = [
        'external_orders.tenant_id',
        'invoices.shop_order_id', 'invoices.tenant_id',
        'order_messages.read_by_tenant', 'order_messages.sender_role', 'order_messages.sender_user_id',
        ...[
          'buyer_remark', 'escalated_at', 'fee_rate_bp', 'inv_share_state', 'invoice_share_rate_bp', 'listing_id', 'main_price_at_order', 'refunded_goods_cents',
          'refunded_qty', 'refunded_tax_cents', 'settle_bearer', 'settle_exclude_reason', 'settle_hold_days', 'settle_loss_cents', 'settle_refunded_cents',
          'settle_state', 'settle_version', 'short_cents', 'short_charged_cents', 'supply_cents', 'supply_unit_price', 'tenant_id',
        ].map((c) => `orders.${c}`),
        'receipts.shop_order_id', 'receipts.tenant_id',
        'users.registered_tenant_id',
      ].sort()
      check('现有表新增列恰为设计 5.4 / 5.6 清单（Order 22 列）', JSON.stringify(colNames) === JSON.stringify(wantCols), colNames.join(','))
      check('新增列全部「可空」或「NOT NULL DEFAULT」', addCols.every((x) => / NULL$/.test(x) || /NOT NULL DEFAULT /.test(x)), addCols.filter((x) => !(/ NULL$/.test(x) || /NOT NULL DEFAULT /.test(x))).join(' | '))
      const idx = Array.from(sql.matchAll(/^CREATE INDEX `([a-z_]+)` ON `([a-z_]+)`/gm)).map((m) => m[2]).sort()
      const wantIdx = ['external_orders', 'invoices', 'invoices', 'orders', 'orders', 'orders', 'orders', 'receipts', 'receipts'].sort()
      check('现有表新增索引：orders 4、invoices 2、receipts 2、external_orders 1', JSON.stringify(idx) === JSON.stringify(wantIdx), idx.join(','))
      const fks = Array.from(sql.matchAll(/ALTER TABLE `([a-z_]+)` ADD CONSTRAINT `[a-z_]+` FOREIGN KEY \(`([a-z_]+)`\) REFERENCES `([a-z_]+)`/g)).map((m) => `${m[1]}.${m[2]}->${m[3]}`).sort()
      check('外键只有「新表 → 现有表」两条', JSON.stringify(fks) === JSON.stringify(['tenant_customers.user_id->users', 'tenant_ledger_entries.order_id->orders']), fks.join(','))
      const uniqPublicNo = (sql.match(/UNIQUE INDEX `[a-z_]+_public_no_key`/g) || []).length
      check('3 个 public_no 唯一索引', uniqPublicNo === 3)
      check('没有修改任何现有唯一约束 / enum', !/ALTER TABLE `(users|orders|invoices|receipts|external_orders|order_messages)` [^\n]*(MODIFY|UNIQUE|ENUM)/i.test(sql))
    }
  }

  // =======================================================================
  section('W0-10 writeAudit 的 publicDiff 落库口径')
  {
    await writeAudit(null, { actorKind: 'PLATFORM', tenantId: w.lulu.id, action: 'listing.batch_supply', targetType: 'listing', targetId: w.listings.luluAuto, diff: { base: 'COST', costCents: 10713, pct: 3 } })
    await writeAudit(null, { actorKind: 'TENANT', actorUserId: w.users.luluOwner.id, tenantId: w.lulu.id, action: 'listing.price', targetType: 'listing', targetId: w.listings.luluAuto, diff: { oldRetailCents: 14000, newRetailCents: 14500 } })
    await writeAudit(null, { actorKind: 'PLATFORM', tenantId: w.lulu.id, action: 'tenant.payout_hold', diff: { payoutHold: true, reason: '内部原因' }, publicDiff: { payoutHold: true } })
    const rows = await prisma.$queryRaw<{ action: string; public_is_null: number; pd: string | null; df: string | null }[]>`
      SELECT action, (public_diff IS NULL) AS public_is_null, CAST(public_diff AS CHAR) AS pd, CAST(diff AS CHAR) AS df
      FROM audit_events WHERE tenant_id = ${w.lulu.id} AND action IN ('listing.batch_supply','listing.price','tenant.payout_hold') ORDER BY id`
    const byAction = new Map(rows.map((r) => [r.action, r]))
    check('PLATFORM 不给 publicDiff → public_diff IS NULL', Number(byAction.get('listing.batch_supply')?.public_is_null) === 1)
    const t = byAction.get('listing.price')
    check('TENANT 不给 publicDiff → 等于 diff', !!t && JSON.stringify(JSON.parse(t.pd || 'null')) === JSON.stringify(JSON.parse(t.df || 'null')))
    const h = byAction.get('tenant.payout_hold')
    check('PLATFORM 显式给 publicDiff → 只有给的内容（不含原因）', !!h && JSON.stringify(JSON.parse(h.pd || 'null')) === '{"payoutHold":true}' && !(h.pd || '').includes('内部原因'))
    await writeAuditThrottled(`order.view:${w.lulu.id}:${w.run}`, 600_000, { actorKind: 'TENANT', tenantId: w.lulu.id, action: 'order.view', targetType: 'order', targetId: w.orders.luluAuto.orderNo })
    await writeAuditThrottled(`order.view:${w.lulu.id}:${w.run}`, 600_000, { actorKind: 'TENANT', tenantId: w.lulu.id, action: 'order.view', targetType: 'order', targetId: w.orders.luluAuto.orderNo })
    check('writeAuditThrottled 窗口内只写一条', (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'order.view' } })) === 1)
    const req = new Request('http://x/', { headers: { 'cf-connecting-ip': '10.1.2.3', 'user-agent': 'itest-ua' } })
    await writeAudit(null, { actorKind: 'BUYER', tenantId: w.lulu.id, action: 'itest.req', req })
    const withIp = await prisma.auditEvent.findFirst({ where: { tenantId: w.lulu.id, action: 'itest.req' } })
    check('req → ip / ua 落库', withIp?.ip === '10.1.2.3' && withIp?.ua === 'itest-ua')
  }

  // =======================================================================
  section('渠道服务层作用域（_scope.ts）')
  {
    const own = await findTenantOrder(w.lulu.id, w.orders.luluAuto.orderNo, PARTNER_ORDER_LIST_SELECT)
    check('本渠道 orderNo → 取到', own?.orderNo === w.orders.luluAuto.orderNo && own?.user.email === w.users.luluBuyer1.email)
    check('select 白名单生效：结果没有 id / userId / remark / deliveryInfo', !!own && !('id' in own) && !('userId' in own) && !('remark' in own) && !('deliveryInfo' in own))
    check('zz 的 orderNo → null', (await findTenantOrder(w.lulu.id, w.orders.zzAuto.orderNo, PARTNER_INTERNAL_ORDER_KEY_SELECT)) === null)
    check('主站 orderNo → null', (await findTenantOrder(w.lulu.id, w.orders.crossMain.orderNo, PARTNER_INTERNAL_ORDER_KEY_SELECT)) === null)
    check('自增 id 当 orderNo → null', (await findTenantOrder(w.lulu.id, String(w.orders.luluAuto.id), PARTNER_INTERNAL_ORDER_KEY_SELECT)) === null)
    check('畸形 orderNo（注入字符）→ null 且不查库', (await findTenantOrder(w.lulu.id, "x' OR 1=1 --", PARTNER_INTERNAL_ORDER_KEY_SELECT)) === null)
    let threw = 0
    for (const bad of [1, 0, -2, 2.5, '2', null, undefined, NaN]) {
      try {
        assertTenantId(bad)
      } catch {
        threw++
      }
    }
    check('assertTenantId 拒绝主站 1 与一切非法值', threw === 8)
    let t2 = false
    try {
      await findTenantOrder(1, w.orders.crossMain.orderNo, PARTNER_INTERNAL_ORDER_KEY_SELECT)
    } catch {
      t2 = true
    }
    check('findTenantOrder(tenantId=1) 抛（渠道层绝不能查主站数据）', t2)
  }
}

main()
  .catch((e) => {
    console.error('itest 异常中止：', e)
    check('itest 未异常中止', false, String((e as Error)?.stack || e).slice(0, 500))
  })
  .finally(async () => {
    setStorefrontDbForTest(null)
    setChannelsMode('dormant')
    try {
      await cleanupAll()
      // 本次运行产生的噪声汇总行（tenantId 为空，按时间与动作识别）
      await prisma.auditEvent.deleteMany({ where: { action: 'authz.noise', at: { gte: RUN_START } } })
    } catch (e) {
      console.error('清理失败：', e)
    }
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
