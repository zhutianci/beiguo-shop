/**
 * 内容模块下放集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-modules.ts
 *   MODULES_BASE_REF=<改动前的提交> …同上…   # 「主站逐字不变」对比的基线，默认 origin/main
 *
 * 覆盖 docs/多渠道分销-内容模块下放.md：
 *   M1 纯函数：resolveStoreModules（授权必须 true、上架缺省算上架）、storefrontFeatures（只开三个内容模块、筹备 / 停业不开）、channelUrl
 *   M2 默认不授权：渠道 Host 上三个模块的 layout 一律 404、接口一律 404（/api/me、上传也是）；主站照常
 *   M3 超管授权：非超管拒绝；授权后渠道前台打开、features 跟着开；站内通知 + 审计；收回后再关；没授权的模块仍关
 *   M4 渠道上架 / 下架：GET / PUT（strict、没授权 409、他站 / 非店主拒绝）；下架后 404；审计 settings.module；响应键白名单
 *   M5 店铺状态：暂停营业照开，筹备中 / 已停业不开
 *   M6 metadata：主站与基线逐字相同；渠道站 robots noindex、canonical 指主站、metadataBase 是渠道域名；白标站名替换
 *   M7 渠道站上的学习空间：发评论记来源站；积分兑换 / 转化入口接口在渠道站仍 404
 *
 * 【测试数据】只删本脚本建的行（不调 cleanupAll）。基线临时目录 scripts/itest-tenant/.modules-base-<run>/ 结束时删除。
 */
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) {
  delete process.env[k]
}

import { execFileSync } from 'child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import Module from 'module'
import path from 'path'
import React from 'react'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  createTenant,
  createUser,
  signTestToken,
  withRequest,
  callRoute,
  catchNext,
  collectKeys,
  RUN,
  type RouteFn,
  type WorldTenant,
  type WorldUser,
} from './_harness'

;(globalThis as unknown as { React: typeof React }).React = React
const ReactMut = React as unknown as { cache?: <T>(fn: T) => T }
if (typeof ReactMut.cache !== 'function') ReactMut.cache = <T,>(fn: T) => fn
const Mod = Module as unknown as { _load: (r: string, p: unknown, m: boolean) => unknown }
const origLoad = Mod._load
Mod._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request.endsWith('.css')) return {}
  if (request === 'next/font/google') return { Inter: () => ({ className: 'inter' }) }
  return origLoad.call(this, request, parent, isMain)
}

const ROOT = process.cwd()
const MAIN_HOST = 'bigolab.com'
const BASE_REF = process.env.MODULES_BASE_REF || 'origin/main'
const BASE_DIR_REL = `scripts/itest-tenant/.modules-base-${RUN}`

/** 本期改了 metadata 写法的页面（基线版本落盘对比用） */
const META_FILES = [
  'src/app/(shop)/learn/page.tsx',
  'src/app/(shop)/learn/search/page.tsx',
  'src/app/(shop)/prompts/page.tsx',
  'src/app/(shop)/prompts/[idSlug]/page.tsx',
  'src/app/(shop)/guides/page.tsx',
  'src/app/(shop)/apps/page.tsx',
  'src/app/(shop)/news/page.tsx',
  'src/app/(shop)/news/[slug]/page.tsx',
  'src/app/(shop)/forum/layout.tsx',
  'src/app/(shop)/iptools/layout.tsx',
]

/** 同 mods-brand 的 materializeBase：基线文件落到临时目录，import 改写为指向基线副本或仓库原文件 */
function materializeBase(): void {
  const set = new Set(META_FILES)
  const withExt = (t: string): string | null => {
    for (const x of ['', '.ts', '.tsx']) if (set.has(t + x)) return t + x
    return null
  }
  for (const f of META_FILES) {
    const src = execFileSync('git', ['show', `${BASE_REF}:${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    const copyDir = path.posix.join(BASE_DIR_REL, path.posix.dirname(f))
    const out = src.replace(/(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\2/g, (all, lead: string, q: string, spec: string) => {
      let target: string
      if (spec.startsWith('@/')) target = 'src/' + spec.slice(2)
      else if (spec.startsWith('.')) target = path.posix.normalize(path.posix.join(path.posix.dirname(f), spec))
      else return all
      const copied = withExt(target)
      let rel = copied
        ? path.posix.relative(copyDir, path.posix.join(BASE_DIR_REL, copied.replace(/\.(ts|tsx)$/, '')))
        : path.posix.relative(copyDir, target)
      if (!rel.startsWith('.')) rel = './' + rel
      return `${lead}${q}${rel}${q}`
    })
    const abs = path.join(ROOT, BASE_DIR_REL, f)
    mkdirSync(path.dirname(abs), { recursive: true })
    writeFileSync(abs, out, 'utf8')
  }
}
type MetaMod = { metadata?: unknown; generateMetadata?: (p?: unknown) => unknown }
const baseImport = (f: string) => import('./' + path.posix.join(`.modules-base-${RUN}`, f.replace(/\.(ts|tsx)$/, ''))) as Promise<MetaMod>
const workImport = (f: string) => import('../../' + f.replace(/\.(ts|tsx)$/, '')) as Promise<MetaMod>
const metaOf = async (m: MetaMod, props: unknown) => (m.generateMetadata ? await m.generateMetadata(props) : m.metadata)
/** metadata 里的 URL 对象转字符串，便于逐字比较 */
const metaJson = (m: unknown) => JSON.stringify(m, (_k, v) => (v instanceof URL ? v.toString() : v))

type Layout = (p: { children: React.ReactNode }) => Promise<unknown>
const LAYOUTS: Record<'learn' | 'news' | 'iptools', string[]> = {
  learn: ['learn', 'prompts', 'guides', 'apps', 'collections', 'u', 'forum'],
  news: ['news'],
  iptools: ['iptools'],
}

async function main() {
  const modulesLib = await import('../../src/lib/storefront/modules')
  const pubMod = await import('../../src/lib/storefront/public')
  const resolve = await import('../../src/lib/storefront/resolve')
  const { channelUrl } = await import('../../src/lib/storefront/channel-url')
  const selects = await import('../../src/lib/partner-services/selects')

  const layouts: Record<string, Layout> = {}
  for (const d of Object.values(LAYOUTS).flat()) layouts[d] = (await import(`../../src/app/(shop)/${d}/layout`)).default as Layout
  const api = {
    newsList: (await import('../../src/app/api/news/list/route')).GET as unknown as RouteFn,
    newsHot: (await import('../../src/app/api/news/hot/route')).GET as unknown as RouteFn,
    forumCats: (await import('../../src/app/api/forum/categories/route')).GET as unknown as RouteFn,
    contentTags: (await import('../../src/app/api/content/tags/route')).GET as unknown as RouteFn,
    meSummary: (await import('../../src/app/api/me/summary/route')).GET as unknown as RouteFn,
    meFavorites: (await import('../../src/app/api/me/favorites/route')).GET as unknown as RouteFn,
    pointsShop: (await import('../../src/app/api/me/points-shop/route')).GET as unknown as RouteFn,
    upload: (await import('../../src/app/api/upload/route')).POST as unknown as RouteFn,
    comments: (await import('../../src/app/api/forum/posts/[id]/comments/route')).POST as unknown as RouteFn,
    cta: (await import('../../src/app/api/content/[id]/cta/route')).POST as unknown as RouteFn,
  }
  const pRoute = await import('../../src/app/api/partner/settings/modules/route')
  const aRoute = await import('../../src/app/api/admin/tenants/[id]/modules/route')

  const tenants: WorldTenant[] = []
  const users: WorldUser[] = []
  const postIds: number[] = []
  let baseMade = false

  /** 这个 Host 上某个模块的全部 layout：'open' = 都放行，'closed' = 都 404，其余 = 混合 */
  const layoutState = async (host: string, m: keyof typeof LAYOUTS) => {
    const rs = await withRequest({ host }, async () => Promise.all(LAYOUTS[m].map((d) => catchNext(() => layouts[d]({ children: null })))))
    if (rs.every((r) => r.kind === 'ok')) return 'open'
    if (rs.every((r) => r.kind === 'notFound')) return 'closed'
    return rs.map((r) => r.kind).join(',')
  }
  const featuresOn = async (host: string) =>
    withRequest({ host }, async () => {
      const f = pubMod.toPublicStorefront(await resolve.getStorefront()).features
      return { learn: f.forum, news: f.news, iptools: f.iptools, coupon: f.coupon, referral: f.referral }
    })
  const statusOf = (r: { status: number }) => r.status

  try {
    setChannelsMode('observe')

    // =======================================================================
    section('M1 纯函数')
    {
      const r = modulesLib.resolveStoreModules
      check('resolveStoreModules：全缺省 = 全关', JSON.stringify(r({})) === JSON.stringify({ learn: false, news: false, iptools: false }))
      check('授权必须是 true（null / 缺省都算没授权）', !r({ modLearnGranted: null, modLearnOn: true }).learn && r({ modLearnGranted: true }).learn)
      check('上架缺省算上架；明确 false 才下架', r({ modNewsGranted: true, modNewsOn: null }).news && !r({ modNewsGranted: true, modNewsOn: false }).news)
      const sf = (status: string, m: Partial<Record<'learn' | 'news' | 'iptools', boolean>>) =>
        pubMod.storefrontFeatures({ kind: 'CHANNEL', status, modules: { learn: false, news: false, iptools: false, ...m } })
      const f1 = sf('ACTIVE', { learn: true, news: true, iptools: true })
      check('storefrontFeatures：渠道只开三个内容模块（forum/news/iptools），券、余额、接码等照关', f1.forum && f1.news && f1.iptools && !f1.coupon && !f1.wallet && !f1.jiema && !f1.landing && !f1.referral && !f1.links)
      check('storefrontFeatures：暂停营业照开，筹备中 / 已停业不开', sf('SUSPENDED', { news: true }).news && !sf('DRAFT', { news: true }).news && !sf('TERMINATED', { news: true }).news)
      check('storefrontFeatures：主站全开、没有 modules 的渠道全关（旧夹具）', Object.values(pubMod.storefrontFeatures({ kind: 'PLATFORM' })).every(Boolean) && !Object.values(pubMod.storefrontFeatures({ kind: 'CHANNEL' })).some(Boolean))
      check(
        'channelUrl：渠道换域名保留路径与查询；主站 / 没有店面原样',
        channelUrl({ kind: 'CHANNEL', origin: 'https://lulu.bigolab.com' }, 'https://bigolab.com/news/abc?s=p') === 'https://lulu.bigolab.com/news/abc?s=p' &&
          channelUrl({ kind: 'PLATFORM', origin: 'https://bigolab.com' }, 'https://bigolab.com/news/abc') === 'https://bigolab.com/news/abc' &&
          channelUrl(null, 'https://bigolab.com/x') === 'https://bigolab.com/x',
      )
    }

    const tA = await createTenant('x')
    const tB = await createTenant('z')
    tenants.push(tA, tB)
    const ownerA = await createUser(`mod-owner-a-${RUN}`, { registeredTenantId: tA.id })
    const staffA = await createUser(`mod-staff-a-${RUN}`, { registeredTenantId: tA.id })
    const ownerB = await createUser(`mod-owner-b-${RUN}`, { registeredTenantId: tB.id })
    const buyerA = await createUser(`mod-buyer-a-${RUN}`, { registeredTenantId: tA.id })
    const sa = await createUser(`mod-sa-${RUN}`, { role: 'ADMIN' })
    const plain = await createUser(`mod-plain-${RUN}`)
    users.push(ownerA, staffA, ownerB, buyerA, sa, plain)
    await prisma.tenantMember.createMany({
      data: [
        { tenantId: tA.id, userId: ownerA.id, role: 'OWNER', status: 1 },
        { tenantId: tA.id, userId: staffA.id, role: 'STAFF', status: 1 },
        { tenantId: tB.id, userId: ownerB.id, role: 'OWNER', status: 1 },
      ],
    })
    const tokA = signTestToken(ownerA, tA.code, tA.id)
    const tokStaff = signTestToken(staffA, tA.code, tA.id)
    const tokBonA = signTestToken(ownerB, tA.code, tA.id)
    const tokBuyerA = signTestToken(buyerA, tA.code, tA.id)
    const tokSa = signTestToken(sa, 'main')
    const tokPlain = signTestToken(plain, 'main')
    const grant = (tenantId: number, module: string, granted: boolean, token = tokSa) =>
      callRoute(aRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token, path: `/api/admin/tenants/${tenantId}/modules`, method: 'POST', body: { module, granted }, params: { id: String(tenantId) } })
    const pPut = (body: unknown, token = tokA, host = tA.host) => callRoute(pRoute.PUT as unknown as RouteFn, { host, token, path: '/api/partner/settings/modules', method: 'PUT', body })
    const pGet = (token = tokA, host = tA.host) => callRoute(pRoute.GET as unknown as RouteFn, { host, token, path: '/api/partner/settings/modules' })

    // =======================================================================
    section('M2 默认不授权：渠道站三个模块全关，主站照常')
    {
      for (const m of ['learn', 'news', 'iptools'] as const) check(`渠道站 ${m} 的 layout 全部 404`, (await layoutState(tA.host, m)) === 'closed')
      for (const m of ['learn', 'news', 'iptools'] as const) check(`主站 ${m} 的 layout 全部放行`, (await layoutState(MAIN_HOST, m)) === 'open')
      const f = await featuresOn(tA.host)
      check('渠道站 features：forum / news / iptools 全关', !f.learn && !f.news && !f.iptools)
      const g = (r: RouteFn, p: string, token?: string) => callRoute(r, { host: tA.host, token, path: p }).then(statusOf)
      check('渠道站接口 404：news/list、news/hot、forum/categories、content/tags', (await g(api.newsList, '/api/news/list')) === 404 && (await g(api.newsHot, '/api/news/hot')) === 404 && (await g(api.forumCats, '/api/forum/categories')) === 404 && (await g(api.contentTags, '/api/content/tags')) === 404)
      check('渠道站 /api/me/summary、/api/me/favorites（已登录）也 404', (await g(api.meSummary, '/api/me/summary', tokBuyerA)) === 404 && (await g(api.meFavorites, '/api/me/favorites', tokBuyerA)) === 404)
      const up = await callRoute(api.upload, { host: tA.host, token: tokBuyerA, path: '/api/upload', method: 'POST', body: 'x', headers: { origin: `https://${tA.host}` } })
      check('渠道站 /api/upload 404', up.status === 404)
      check('主站 news/list、forum/categories 照常 200', (await callRoute(api.newsList, { host: MAIN_HOST, path: '/api/news/list' })).status === 200 && (await callRoute(api.forumCats, { host: MAIN_HOST, path: '/api/forum/categories' })).status === 200)
    }

    // =======================================================================
    section('M3 超管授权 / 收回')
    {
      const deny = await grant(tA.id, 'learn', true, tokPlain)
      check('非超管授权：拒绝且没改库', deny.status >= 400 && (await prisma.tenant.findUnique({ where: { id: tA.id } }))?.modLearnGranted === false)
      const bad = await callRoute(aRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/modules`, method: 'POST', body: { module: 'jiema', granted: true }, params: { id: String(tA.id) } })
      check('模块名不在三个之内：400', bad.status === 400)
      const extra = await callRoute(aRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/modules`, method: 'POST', body: { module: 'learn', granted: true, x: 1 }, params: { id: String(tA.id) } })
      check('多给字段：400', extra.status === 400)
      const main1 = await grant(1, 'learn', true)
      check('主站（id=1）不能授权：404', main1.status === 404)
      const ok = await grant(tA.id, 'learn', true)
      const row = ok.json?.data?.modules?.find((x: { module: string }) => x.module === 'learn')
      check('授权 AI学习：200，返回 granted / on / live 都是 true', ok.status === 200 && row?.granted === true && row?.on === true && row?.live === true, JSON.stringify(ok.json))
      check('授权后渠道站 learn 的 layout 全部放行', (await layoutState(tA.host, 'learn')) === 'open')
      check('没授权的 news / iptools 仍然 404', (await layoutState(tA.host, 'news')) === 'closed' && (await layoutState(tA.host, 'iptools')) === 'closed')
      check('他站（没授权）不受影响', (await layoutState(tB.host, 'learn')) === 'closed')
      const f = await featuresOn(tA.host)
      check('features：forum 开，news / iptools / coupon / referral 关', f.learn && !f.news && !f.iptools && !f.coupon && !f.referral)
      check('渠道站 forum/categories、content/tags、me/summary 放行', (await callRoute(api.forumCats, { host: tA.host, path: '/api/forum/categories' })).status === 200 && (await callRoute(api.contentTags, { host: tA.host, path: '/api/content/tags' })).status === 200 && (await callRoute(api.meSummary, { host: tA.host, token: tokBuyerA, path: '/api/me/summary' })).status === 200)
      const again = await grant(tA.id, 'learn', true)
      check('重复授权：200、没有变化', again.status === 200 && /没有变化/.test(again.json?.message || ''))
      const notices = await prisma.tenantNotice.findMany({ where: { tenantId: tA.id, kind: 'TENANT_STATUS' } })
      check('给渠道发了一条站内通知（重复授权不再发）', notices.filter((n) => n.title.includes('AI学习')).length === 1)
      const aud = await prisma.auditEvent.findMany({ where: { tenantId: tA.id, action: 'tenant.module_grant' } })
      check('审计 tenant.module_grant 一条，publicDiff 带模块名', aud.length === 1 && JSON.stringify(aud[0].publicDiff).includes('learn'))
      await grant(tA.id, 'news', true)
      check('再授权大事记：news 放行、news/list 200', (await layoutState(tA.host, 'news')) === 'open' && (await callRoute(api.newsList, { host: tA.host, path: '/api/news/list' })).status === 200)
      await grant(tA.id, 'news', false)
      check('收回大事记：news 回到 404', (await layoutState(tA.host, 'news')) === 'closed' && (await callRoute(api.newsList, { host: tA.host, path: '/api/news/list' })).status === 404)
      const get = await callRoute(aRoute.GET as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/modules`, params: { id: String(tA.id) } })
      check('超管 GET：三个模块按 learn / news / iptools 顺序', get.status === 200 && get.json?.data?.modules?.map((x: { module: string }) => x.module).join() === 'learn,news,iptools')
    }

    // =======================================================================
    section('M4 渠道上架 / 下架')
    {
      const g = await pGet()
      check('GET：三个模块，learn 已授权', g.status === 200 && g.json?.data?.modules?.length === 3 && g.json.data.modules[0].granted === true)
      const leaked = collectKeys(g.json).filter((k) => !selects.PARTNER_ALLOWED_KEYS.has(k.key) || selects.PARTNER_FORBIDDEN_KEYS.has(k.key))
      check('响应键都在渠道白名单里', leaked.length === 0, leaked.map((k) => k.key).join())
      check('STAFF 不能看（settings.write 仅店主）', (await pGet(tokStaff)).status >= 400)
      check('他站店主拿本站 Host 拒绝', (await pGet(tokBonA)).status >= 400)
      check('没授权的模块不能上架：409', (await pPut({ module: 'iptools', on: true })).status === 409)
      check('strict：多给字段 400；模块名不对 400', (await pPut({ module: 'learn', on: false, x: 1 })).status === 400 && (await pPut({ module: 'shop', on: false })).status === 400)
      const off = await pPut({ module: 'learn', on: false })
      const row = off.json?.data?.modules?.find((x: { module: string }) => x.module === 'learn')
      check('下架 AI学习：200，on=false、live=false', off.status === 200 && row?.on === false && row?.live === false)
      check('下架后渠道站 learn 的 layout 全部 404、接口 404', (await layoutState(tA.host, 'learn')) === 'closed' && (await callRoute(api.forumCats, { host: tA.host, path: '/api/forum/categories' })).status === 404)
      const aud = await prisma.auditEvent.findMany({ where: { tenantId: tA.id, action: 'settings.module' } })
      const d0 = aud[0]?.diff as { module?: string; on?: boolean } | null
      check('审计 settings.module 一条（diff 带模块与开关；MySQL JSON 会重排键序，按字段比）', aud.length === 1 && d0?.module === 'learn' && d0?.on === false, JSON.stringify(aud.map((x) => x.diff)))
      await pPut({ module: 'learn', on: false })
      check('没变化不再写审计', (await prisma.auditEvent.count({ where: { tenantId: tA.id, action: 'settings.module' } })) === 1)
      await grant(tA.id, 'learn', false)
      await grant(tA.id, 'learn', true)
      check('收回再授权：保留渠道上次「下架」的选择', (await layoutState(tA.host, 'learn')) === 'closed')
      const on = await pPut({ module: 'learn', on: true })
      check('重新上架：放行', on.status === 200 && (await layoutState(tA.host, 'learn')) === 'open')
    }

    // =======================================================================
    section('M5 店铺状态')
    {
      await prisma.tenant.update({ where: { id: tA.id }, data: { status: 'SUSPENDED' } })
      check('暂停营业：照开', (await layoutState(tA.host, 'learn')) === 'open')
      const susp = await pPut({ module: 'learn', on: false })
      check('暂停营业时渠道后台只读：上架 / 下架被拒', susp.status >= 400 && (await layoutState(tA.host, 'learn')) === 'open')
      await prisma.tenant.update({ where: { id: tA.id }, data: { status: 'DRAFT' } })
      check('筹备中：不开（layout 404、接口 404、features 关）', (await layoutState(tA.host, 'learn')) === 'closed' && (await callRoute(api.forumCats, { host: tA.host, path: '/api/forum/categories' })).status === 404 && !(await featuresOn(tA.host)).learn)
      await prisma.tenant.update({ where: { id: tA.id }, data: { status: 'ACTIVE' } })
    }

    // =======================================================================
    section(`M6 metadata（基线 ${BASE_REF}）`)
    {
      materializeBase()
      baseMade = true
      const ev = await prisma.newsEvent.findFirst({ where: { status: 'PUBLISHED' }, select: { slug: true }, orderBy: { id: 'desc' } }).catch(() => null)
      const pr = await prisma.forumPost.findFirst({ where: { type: 'PROMPT', status: 1, reviewStatus: 'APPROVED', deletedAt: null }, select: { id: true }, orderBy: { id: 'desc' } })
      const cases: [string, unknown][] = [
        ['src/app/(shop)/learn/page.tsx', undefined],
        ['src/app/(shop)/learn/search/page.tsx', { searchParams: { q: 'chatgpt' } }],
        ['src/app/(shop)/prompts/page.tsx', { searchParams: {} }],
        ['src/app/(shop)/guides/page.tsx', { searchParams: {} }],
        ['src/app/(shop)/apps/page.tsx', { searchParams: {} }],
        ['src/app/(shop)/news/page.tsx', undefined],
        ['src/app/(shop)/forum/layout.tsx', undefined],
        ['src/app/(shop)/iptools/layout.tsx', undefined],
        ...(ev ? ([['src/app/(shop)/news/[slug]/page.tsx', { params: { slug: ev.slug } }]] as [string, unknown][]) : []),
        ...(pr ? ([['src/app/(shop)/prompts/[idSlug]/page.tsx', { params: { idSlug: String(pr.id) } }]] as [string, unknown][]) : []),
      ]
      if (!ev) console.log('  ⚠ 开发库没有已发布的大事记，跳过 news/[slug] 的对比')
      if (!pr) console.log('  ⚠ 开发库没有公开的提示词，跳过 prompts/[idSlug] 的对比')
      for (const [f, props] of cases) {
        const B = await baseImport(f)
        const N = await workImport(f)
        const [a, b] = await withRequest({ host: MAIN_HOST }, async () => [metaJson(await metaOf(B, props)), metaJson(await metaOf(N, props))])
        check(`主站 ${f.replace('src/app/(shop)/', '')}：metadata 与基线逐字相同`, a === b && a.length > 20, a === b ? '' : `基线 ${a.slice(0, 200)} …\n      现在 ${b.slice(0, 200)}`)
      }
      // 渠道：授权三个模块，白标改名
      await grant(tA.id, 'news', true)
      await grant(tA.id, 'iptools', true)
      await prisma.tenant.update({ where: { id: tA.id }, data: { brandName: '小鹿优选' } })
      for (const [f, props] of cases) {
        const N = await workImport(f)
        const m = (await withRequest({ host: tA.host }, async () => metaOf(N, props))) as {
          robots?: { index?: boolean }
          metadataBase?: URL
          alternates?: { canonical?: string }
          title?: unknown
          openGraph?: { siteName?: string }
        }
        const s = metaJson(m)
        const canonical = m.alternates?.canonical
        check(
          `渠道 ${f.replace('src/app/(shop)/', '')}：noindex、metadataBase 渠道域名、canonical 指主站、不出「贝果科技」`,
          m.robots?.index === false &&
            String(m.metadataBase) === `${tA.origin}/` &&
            (canonical === undefined || String(canonical).startsWith('https://bigolab.com/') || String(canonical).startsWith('http://localhost')) &&
            !s.includes('贝果科技'),
          s.slice(0, 300),
        )
      }
      await prisma.tenant.update({ where: { id: tA.id }, data: { brandName: null } })
    }

    // =======================================================================
    section('M7 渠道站上的学习空间')
    {
      const cat = await prisma.forumCategory.findFirst({ select: { id: true } })
      if (!cat) {
        console.log('  ⚠ 开发库没有论坛分类，跳过发评论')
      } else {
        const post = await prisma.forumPost.create({ data: { categoryId: cat.id, authorName: 'itest', title: `ITEST 模块下放 ${RUN}`, content: '正文', type: 'DISCUSSION', reviewStatus: 'APPROVED' } })
        postIds.push(post.id)
        const c = await callRoute(api.comments, { host: tA.host, token: tokBuyerA, path: `/api/forum/posts/${post.id}/comments`, method: 'POST', body: { content: '渠道站上的一条评论，看看来源站' }, params: { id: String(post.id) }, headers: { origin: `https://${tA.host}` } })
        const row = await prisma.forumComment.findFirst({ where: { postId: post.id }, select: { sourceTenantId: true } })
        check('渠道站发评论：成功，source_tenant_id = 渠道 id', c.status === 200 && row?.sourceTenantId === tA.id, `${c.status} ${c.text.slice(0, 200)}`)
        const cm = await callRoute(api.comments, { host: MAIN_HOST, token: signTestToken(buyerA, 'main'), path: `/api/forum/posts/${post.id}/comments`, method: 'POST', body: { content: '主站上的一条评论，来源应该是主站' }, params: { id: String(post.id) }, headers: { origin: `https://${MAIN_HOST}` } })
        const rows = await prisma.forumComment.findMany({ where: { postId: post.id }, select: { sourceTenantId: true }, orderBy: { id: 'asc' } })
        check('主站发评论：source_tenant_id = 1', cm.status === 200 && rows[1]?.sourceTenantId === 1)
        const cta = await callRoute(api.cta, { host: tA.host, path: `/api/content/${post.id}/cta`, method: 'POST', body: {}, params: { id: String(post.id) }, headers: { origin: `https://${tA.host}` } })
        check('转化入口记录接口（作者返现）在渠道站仍 404', cta.status === 404)
      }
      check('积分兑换接口在渠道站仍 404', (await callRoute(api.pointsShop, { host: tA.host, token: tokBuyerA, path: '/api/me/points-shop' })).status === 404)
    }
  } finally {
    if (baseMade) {
      try {
        rmSync(path.join(ROOT, BASE_DIR_REL), { recursive: true, force: true })
      } catch {
        /* 忽略 */
      }
    }
    const tIds = tenants.map((t) => t.id)
    const uIds = users.map((u) => u.id)
    if (postIds.length) {
      await prisma.forumComment.deleteMany({ where: { postId: { in: postIds } } })
      await prisma.forumPost.deleteMany({ where: { id: { in: postIds } } })
    }
    await prisma.notification.deleteMany({ where: { userId: { in: uIds } } }).catch(() => undefined)
    await prisma.creatorProfile.deleteMany({ where: { userId: { in: uIds } } }).catch(() => undefined)
    await prisma.auditEvent.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { actorUserId: { in: uIds } }] } })
    await prisma.tenantNotice.deleteMany({ where: { tenantId: { in: tIds } } })
    await prisma.tenantMember.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
    await prisma.tenantCustomer.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
    await prisma.tenantDomain.deleteMany({ where: { tenantId: { in: tIds } } })
    await prisma.user.deleteMany({ where: { id: { in: uIds } } })
    await prisma.tenant.deleteMany({ where: { id: { in: tIds } } })
  }
}

main()
  .then(async () => {
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail ? 1 : 0)
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
