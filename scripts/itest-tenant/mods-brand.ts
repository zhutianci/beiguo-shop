/**
 * 渠道品牌与公告集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-brand.ts
 *   BRAND_BASE_REF=<改动前的提交> …同上…   # 「主站逐字不变」对比的基线，默认 origin/main（本期改动未合入前它就是改动前）
 *
 * 覆盖 docs/多渠道分销-渠道品牌与公告.md：
 *   B1 brand-base 纯函数：字段格式（长度、网址、控制字符、冒充官方 / AI 厂商 / 支付机构）、读出再校验、回退、首字图标转义；站名过邮件禁发词
 *   B2 主站逐字不变：基线版本与工作区在同一进程各渲染一遍（页头、页脚、浮动客服、首页、筹备页）并比 metadata（根布局、首页、登录、隐私、客服中心）；
 *      没有白标的渠道 metadata 也与基线相同
 *   B3 白标渠道前台：页头 / 页脚 / 浮动客服 / 首页标题 / 筹备页换成渠道的；不出现「贝果科技」与贝果 logo；页脚底部保留经营主体小字
 *   B4 白标渠道 metadata：标题、描述、站名、图标、分享图（有 logo / 只有站名两种）；页面标题里的「贝果科技」换成渠道站名
 *   B5 渠道接口：GET / PUT brand（校验、strict、审计只记字段名、没变不写审计、锁定 409、STAFF / 他站 404）、
 *      POST / DELETE brand-logo（只收 png/jpg/webp、≤1MB、换图删旧图、清除、锁定拒绝）；响应键白名单
 *   B6 店面与缓存：storefrontById / getTenantBrand（60 秒缓存、改后失效）
 *   B7 邮件：渠道改名后交易邮件标题与抬头用渠道站名；主站与不合规站名回落「贝果科技」
 *   B8 渠道公告接口：增删改查、公开编号寻址（他站编号 / 乱码 404）、正文字段 body、50 条上限、被下架不能启用；响应键白名单
 *   B9 前台公告接口 /api/announcement：渠道只看到本渠道的、强提醒优先、展示时间、下架不展示、筹备中不给、id 是公开编号；主站不变
 *   B10 超管：查看、恢复默认（清空七个字段、删旧 logo、站内通知、审计）、锁定 / 解锁、公告下架 / 恢复；非超管拒绝
 *
 * 【测试数据】只删本脚本建的行与文件（不调 cleanupAll，理由同 mods-p3）。基线临时目录 scripts/itest-tenant/.brand-base-<run>/ 结束时删除。
 */
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) {
  delete process.env[k]
}

import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import Module from 'module'
import path from 'path'
import React from 'react'
import { NextRequest } from 'next/server'
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
  collectKeys,
  RUN,
  type RouteFn,
  type WorldTenant,
  type WorldUser,
} from './_harness'

;(globalThis as unknown as { React: typeof React }).React = React
const ReactMut = React as unknown as { cache?: <T>(fn: T) => T; useState: typeof React.useState }
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
const BASE_REF = process.env.BRAND_BASE_REF || 'origin/main'
const BASE_DIR_REL = `scripts/itest-tenant/.brand-base-${RUN}`

/** 本期改动过的主站展示点 / metadata 文件（基线版本落盘对比用） */
const DISPLAY_FILES = [
  'src/components/layout/header.tsx',
  'src/components/layout/footer.tsx',
  'src/components/floating-contact.tsx',
  'src/components/storefront/closed-page.tsx',
  'src/app/(shop)/home-client.tsx',
  'src/app/layout.tsx',
  'src/app/(shop)/page.tsx',
  'src/app/(shop)/login/layout.tsx',
  'src/app/(shop)/privacy/page.tsx',
  'src/app/(shop)/support/layout.tsx',
  'src/app/(shop)/products/page.tsx',
]

/** 同 mods-p3 的 materializeBase：基线文件落到临时目录，import 改写为指向基线副本或仓库原文件 */
function materializeBase(): { same: boolean } {
  const set = new Set(DISPLAY_FILES)
  const withExt = (t: string): string | null => {
    for (const x of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) if (set.has(t + x)) return t + x
    return null
  }
  let same = true
  for (const f of DISPLAY_FILES) {
    const src = execFileSync('git', ['show', `${BASE_REF}:${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    if (src.replace(/\r\n/g, '\n') !== readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')) same = false
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
  return { same }
}
const baseImport = (f: string) => import('./' + path.posix.join(`.brand-base-${RUN}`, f.replace(/\.(ts|tsx)$/, '')))

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(80, 1)])
const PNG2 = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(90, 7)])
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(80, 3)])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')

async function callMultipart(
  route: RouteFn,
  o: { host: string; token?: string; path: string; file?: { data: Buffer; type: string; name: string }; declaredLength?: number },
): Promise<{ status: number; json: any }> {
  const fd = new FormData()
  if (o.file) fd.append('file', new Blob([new Uint8Array(o.file.data)], { type: o.file.type }), o.file.name)
  const packed = new Response(fd)
  const body = Buffer.from(await packed.arrayBuffer())
  const h = new Headers()
  h.set('host', o.host)
  if (o.token) h.set('cookie', `token=${o.token}`)
  h.set('content-type', packed.headers.get('content-type') as string)
  h.set('content-length', String(o.declaredLength ?? body.length))
  const req = new NextRequest(`http://${o.host}${o.path}`, { method: 'POST', headers: h, body })
  const res = await withRequest({ host: o.host }, () => route(req, { params: {} }), h)
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, json }
}

/** metadata 里的 URL 对象转字符串，便于逐字比较 */
const metaJson = (m: unknown) => JSON.stringify(m, (_k, v) => (v instanceof URL ? v.toString() : v))

async function main() {
  const { renderToString } = await import('react-dom/server')
  const { AppRouterContext } = await import('next/dist/shared/lib/app-router-context.shared-runtime')
  const { PathnameContext, PathParamsContext } = await import('next/dist/shared/lib/hooks-client-context.shared-runtime')
  const { StorefrontProvider } = await import('../../src/components/storefront-provider')
  const pubMod = await import('../../src/lib/storefront/public')
  const resolve = await import('../../src/lib/storefront/resolve')
  const brandLib = await import('../../src/lib/brand')
  const contactLib = await import('../../src/lib/contact')
  const upload = await import('../../src/lib/upload-store')
  const selects = await import('../../src/lib/partner-services/selects')
  const mail = await import('../../src/lib/mail')
  const originLib = await import('../../src/lib/storefront/origin')
  const tenantBrand = await import('../../src/lib/tenant/brand')
  const { PLATFORM_CONTACT } = contactLib
  const { PLATFORM_BRAND, OPERATOR_LINE } = brandLib
  type StoreBrand = import('../../src/lib/brand').StoreBrand
  type PublicStorefront = import('../../src/lib/storefront/public').PublicStorefront

  const h = React.createElement
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} }
  const platformPub: PublicStorefront = { code: 'main', kind: 'PLATFORM', origin: 'https://bigolab.com', features: pubMod.storefrontFeatures({ kind: 'PLATFORM' }), contact: { ...PLATFORM_CONTACT }, brand: { ...PLATFORM_BRAND } }
  const channelPub = (brand: StoreBrand): PublicStorefront => ({ code: 'itbr', kind: 'CHANNEL', origin: 'https://itbr.bigolab.com', features: pubMod.storefrontFeatures({ kind: 'CHANNEL' }), contact: { ...PLATFORM_CONTACT }, brand })
  const render = (pub: PublicStorefront, el: React.ReactElement, pathname = '/') =>
    renderToString(
      h(StorefrontProvider, {
        value: pub,
        children: h(AppRouterContext.Provider, { value: router as never }, h(PathnameContext.Provider, { value: pathname }, h(PathParamsContext.Provider, { value: {} }, el))),
      }),
    )
  const origUseState = ReactMut.useState
  const opened = <T,>(fn: () => T): T => {
    ReactMut.useState = ((init: unknown) => origUseState(init === false ? true : (init as never))) as typeof React.useState
    try {
      return fn()
    } finally {
      ReactMut.useState = origUseState
    }
  }

  const tenants: WorldTenant[] = []
  const users: WorldUser[] = []
  const createdFiles: string[] = []
  let baseMade = false

  try {
    setChannelsMode('observe')

    // =======================================================================
    section('B1 brand-base 纯函数')
    {
      const c = brandLib.checkBrandTextFormat
      const okv = (f: Parameters<typeof c>[0], v: unknown, want: string | null) => {
        const r = c(f, v)
        return r.ok && r.value === want
      }
      const bad = (f: Parameters<typeof c>[0], v: unknown) => !c(f, v).ok
      check('null / 空串 / 全空白 = 清空', okv('brandName', null, null) && okv('brandName', '', null) && okv('heroTitle', '   ', null) && okv('brandIntro', undefined, null))
      check('站名 2–12 字（按码点）', okv('brandName', '小鹿AI', '小鹿AI') && bad('brandName', '鹿') && bad('brandName', '一二三四五六七八九十一二三') && okv('brandName', '一二三四五六七八九十一二', '一二三四五六七八九十一二'))
      check('空白折叠：换行、多个空格变一个空格', okv('heroSubtitle', '你好\n\n  世界', '你好 世界'))
      check('站名字符集：拒绝 < > " 与 emoji', bad('brandName', '小店<b>') && bad('brandName', '小店"x') && bad('brandName', '小店😀'))
      check('站名拒绝冒充官方 / AI 厂商 / 支付机构 / 平台名（不分大小写）', ['ChatGPT小店', 'openai shop', '官方充值', 'Claude坊', '支付宝优选', '必高优选', 'BigoLab'].every((x) => bad('brandName', x)))
      check('其余字段拒绝「官方」「授权代理」，但可以写 ChatGPT、Claude', bad('heroTitle', '官方充值') && bad('brandIntro', '本店为授权代理商家') && okv('heroTitle', 'ChatGPT 充值', 'ChatGPT 充值'))
      check('任何字段拒绝网址', bad('brandIntro', '访问 https://evil.example 了解') && bad('seoDescription', '去 www.abc.com 看看') && bad('heroSubtitle', '加我 abc.top'))
      const zw = String.fromCharCode(0x200b)
      const ctl = String.fromCharCode(7)
      check('拒绝控制字符与零宽字符', bad('heroTitle', '充值' + zw + '中心') && bad('seoTitle', '标题' + ctl))
      check('长度上限按字段', bad('heroTitle', '一'.repeat(21)) && okv('heroTitle', '一'.repeat(20), '一'.repeat(20)) && bad('brandIntro', '一'.repeat(201)) && bad('seoDescription', '一'.repeat(121)))
      check('站名过邮件禁发词（checkBrandText）', !brandLib.checkBrandText('brandName', '微信小店').ok && brandLib.checkBrandText('brandName', '小鹿优选').ok)
      const r0 = brandLib.resolveStoreBrand({})
      check('resolveStoreBrand：全空 = 主站默认（name 贝果科技、custom=false、其余 null）', r0.name === '贝果科技' && !r0.custom && [r0.logoUrl, r0.intro, r0.heroTitle, r0.heroSubtitle, r0.seoTitle, r0.seoDescription].every((x) => x === null))
      const r1 = brandLib.resolveStoreBrand({ brandName: 'ChatGPT官方', brandLogoUrl: 'javascript:alert(1)', heroTitle: '<script>' })
      check('resolveStoreBrand：库里不合规的值按未设置处理', r1.name === '贝果科技' && !r1.custom && r1.logoUrl === null && r1.heroTitle === null)
      const r2 = brandLib.resolveStoreBrand({ brandName: '小鹿优选', brandLogoUrl: '/uploads/brand/abc-123def.png' })
      check('resolveStoreBrand：合规值原样', r2.name === '小鹿优选' && r2.custom && r2.logoUrl === '/uploads/brand/abc-123def.png')
      check('logo 地址只认 /uploads/brand/<名>.(png|jpg|webp)', !brandLib.resolveStoreBrand({ brandLogoUrl: '/uploads/contact/a.png' }).logoUrl && !brandLib.resolveStoreBrand({ brandLogoUrl: '/uploads/brand/a.gif' }).logoUrl && !brandLib.resolveStoreBrand({ brandLogoUrl: '/uploads/brand/../x.png' }).logoUrl)
      check('isWhiteLabel：改名或有 logo 才算', !brandLib.isWhiteLabel(PLATFORM_BRAND) && brandLib.isWhiteLabel(r2) && brandLib.isWhiteLabel({ ...PLATFORM_BRAND, logoUrl: '/uploads/brand/a.png' }))
      const icon = decodeURIComponent(brandLib.initialIconDataUrl('小鹿优选'))
      check('首字图标：SVG data URL，写站名第一个字', icon.startsWith('data:image/svg+xml,<svg') && icon.includes('>小</text>'))
      check('首字图标：去掉 XML 特殊字符', !decodeURIComponent(brandLib.initialIconDataUrl('<&小')).includes('><</text>'))
    }

    // =======================================================================
    section(`B2 主站逐字不变（基线 ${BASE_REF} vs 工作区）`)
    {
      const { same } = materializeBase()
      baseMade = true
      if (same) console.log(`  ⚠ 基线 ${BASE_REF} 与工作区源码完全相同（已合入？）——请用 BRAND_BASE_REF 指定改动之前的提交再跑一次`)
      const eq = (name: string, a: string, b: string, mustInclude: string[] = []) => {
        let at = -1
        if (a !== b) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break }
        const miss = mustInclude.filter((x) => !b.includes(x))
        check(
          `${name}：逐字相同（${b.length} 字节）`,
          a === b && miss.length === 0,
          a === b ? `缺 ${miss.join(',')}` : `首个差异 @${at}：基线「${a.slice(Math.max(0, at - 40), at + 60)}」 vs 现在「${b.slice(Math.max(0, at - 40), at + 60)}」`,
        )
      }
      const B = {
        header: await baseImport('src/components/layout/header.tsx'),
        footer: await baseImport('src/components/layout/footer.tsx'),
        floating: await baseImport('src/components/floating-contact.tsx'),
        closed: await baseImport('src/components/storefront/closed-page.tsx'),
        home: await baseImport('src/app/(shop)/home-client.tsx'),
        root: await baseImport('src/app/layout.tsx'),
        homePage: await baseImport('src/app/(shop)/page.tsx'),
        login: await baseImport('src/app/(shop)/login/layout.tsx'),
        privacy: await baseImport('src/app/(shop)/privacy/page.tsx'),
        support: await baseImport('src/app/(shop)/support/layout.tsx'),
        products: await baseImport('src/app/(shop)/products/page.tsx'),
      }
      const N = {
        header: await import('../../src/components/layout/header'),
        footer: await import('../../src/components/layout/footer'),
        floating: await import('../../src/components/floating-contact'),
        closed: await import('../../src/components/storefront/closed-page'),
        home: await import('../../src/app/(shop)/home-client'),
        root: await import('../../src/app/layout'),
        homePage: await import('../../src/app/(shop)/page'),
        login: await import('../../src/app/(shop)/login/layout'),
        privacy: await import('../../src/app/(shop)/privacy/page'),
        support: await import('../../src/app/(shop)/support/layout'),
        products: await import('../../src/app/(shop)/products/page'),
      }
      eq('页头', render(platformPub, h(B.header.Header)), render(platformPub, h(N.header.Header)), ['贝果科技', '/logo-mark.png?v=3'])
      eq('页脚', render(platformPub, h(B.footer.Footer)), render(platformPub, h(N.footer.Footer)), ['/logo-full.png?v=3', '贝果科技（益阳市赫山区必高科技有限公司）提供'])
      check('主站页脚没有经营主体小字（不是白标）', !render(platformPub, h(N.footer.Footer)).includes(OPERATOR_LINE))
      eq('浮动客服（展开）', opened(() => render(platformPub, h(B.floating.FloatingContact))), opened(() => render(platformPub, h(N.floating.FloatingContact))), ['贝果科技专属客服为你服务'])
      eq('筹备页', render(platformPub, h(B.closed.DraftClosedPage)), render(platformPub, h(N.closed.DraftClosedPage)), ['贝果科技'])
      const stats = { totalSales: 1234, skuCount: 9 }
      eq('首页（hero 标题与副标题）', render(platformPub, h(B.home.default, { stats })), render(platformPub, h(N.home.default, { stats })), ['ChatGPT、Claude', '充值与代充', '卡密自助兑换，支付宝付款，'])
      eq('没有 Provider（改造前的渲染环境）页头与主站相同', renderToString(h(AppRouterContext.Provider, { value: router as never }, h(PathnameContext.Provider, { value: '/' }, h(N.header.Header)))), render(platformPub, h(N.header.Header)))

      const inHost = <T,>(host: string, fn: () => Promise<T> | T) => withRequest({ host }, async () => fn())
      const metaOf = async (mod: Record<string, unknown>, host: string) =>
        typeof mod.generateMetadata === 'function' ? await inHost(host, () => (mod.generateMetadata as () => Promise<unknown>)()) : mod.metadata
      for (const [name, b, n] of [
        ['根布局', B.root, N.root],
        ['首页', B.homePage, N.homePage],
        ['登录', B.login, N.login],
        ['隐私政策', B.privacy, N.privacy],
        ['客服中心', B.support, N.support],
        ['商品列表', B.products, N.products],
      ] as const) {
        eq(`主站 metadata：${name}`, metaJson(await metaOf(b as Record<string, unknown>, MAIN_HOST)), metaJson(await metaOf(n as Record<string, unknown>, MAIN_HOST)))
      }
    }

    // =======================================================================
    // 夹具：渠道 A（白标主测）、B（他站）、C（没有白标的渠道）、D（筹备中）；A 的 OWNER / STAFF，B 的 OWNER，一个超管，一个普通用户
    const tA = await createTenant('x')
    const tB = await createTenant('z')
    const tC = await createTenant('l')
    tenants.push(tA, tB, tC)
    const ownerA = await createUser('bra', { registeredTenantId: tA.id })
    const staffA = await createUser('brs', { registeredTenantId: tA.id })
    const ownerB = await createUser('brb', { registeredTenantId: tB.id })
    const sa = await createUser('bradmin', { role: 'ADMIN' })
    const plain = await createUser('bruser')
    users.push(ownerA, staffA, ownerB, sa, plain)
    await prisma.tenantMember.createMany({
      data: [
        { tenantId: tA.id, userId: ownerA.id, role: 'OWNER', status: 1 },
        { tenantId: tA.id, userId: staffA.id, role: 'STAFF', status: 1, perms: ['order.read', 'customer.read'] },
        { tenantId: tB.id, userId: ownerB.id, role: 'OWNER', status: 1 },
      ],
    })
    const tokA = signTestToken(ownerA, tA.code, tA.id)
    const tokStaff = signTestToken(staffA, tA.code, tA.id)
    const tokB = signTestToken(ownerB, tB.code, tB.id)
    const tokBonA = signTestToken(ownerB, tA.code, tA.id)
    const tokSa = signTestToken(sa, 'main')
    const tokPlain = signTestToken(plain, 'main')
    const allowed = selects.PARTNER_ALLOWED_KEYS
    const forbidden = selects.PARTNER_FORBIDDEN_KEYS
    const keysOk = (j: unknown) => collectKeys(j).every((x) => allowed.has(x.key) && !forbidden.has(x.key))
    const badKeys = (j: unknown) => collectKeys(j).filter((x) => !allowed.has(x.key) || forbidden.has(x.key)).map((x) => x.key).join(',')
    const audits = (tenantId: number, action: string) => prisma.auditEvent.findMany({ where: { tenantId, action }, orderBy: { id: 'asc' }, select: { diff: true, publicDiff: true, actorKind: true } })
    const rowOf = (id: number) => prisma.tenant.findUnique({ where: { id } })
    const fileOf = (url: string) => path.join(upload.uploadRoot(), 'brand', url.slice('/uploads/brand/'.length))

    const brandRoute = await import('../../src/app/api/partner/settings/brand/route')
    const logoRoute = await import('../../src/app/api/partner/settings/brand-logo/route')
    const BPATH = '/api/partner/settings/brand'
    const LPATH = '/api/partner/settings/brand-logo'

    // =======================================================================
    section('B5 渠道接口：店铺品牌')
    {
      const g0 = await callRoute(brandRoute.GET as unknown as RouteFn, { host: tA.host, token: tokA, path: BPATH })
      check('GET：200，全部未设置、未锁定', g0.status === 200 && g0.json?.data?.brand?.brandName === null && g0.json.data.brand.locked === false, JSON.stringify(g0.json))
      check('GET：响应键在白名单内', keysOk(g0.json), badKeys(g0.json))
      const st = await callRoute(brandRoute.GET as unknown as RouteFn, { host: tA.host, token: tokStaff, path: BPATH })
      check('STAFF：404（settings.write 仅 OWNER）', st.status === 404)
      const other = await callRoute(brandRoute.GET as unknown as RouteFn, { host: tA.host, token: tokBonA, path: BPATH })
      check('他站 OWNER 在本站 Host：404', other.status === 404)
      const anon = await callRoute(brandRoute.GET as unknown as RouteFn, { host: tA.host, path: BPATH })
      check('未登录：401', anon.status === 401)

      const put = (body: unknown, token = tokA, host = tA.host) => callRoute(brandRoute.PUT as unknown as RouteFn, { host, token, path: BPATH, method: 'PUT', body })
      const p1 = await put({ brandName: '小鹿优选', heroTitle: 'AI 会员一站购', heroSubtitle: '支付宝付款，即买即用', brandIntro: '小鹿优选专注 AI 会员服务，售后有保障。', seoTitle: '小鹿优选 - AI 会员', seoDescription: '小鹿优选：ChatGPT、Claude 会员即买即用。' })
      check('PUT：200，原值回显', p1.status === 200 && p1.json?.data?.brand?.brandName === '小鹿优选' && p1.json.data.brand.heroTitle === 'AI 会员一站购', JSON.stringify(p1.json))
      check('PUT：响应键在白名单内', keysOk(p1.json), badKeys(p1.json))
      const a1 = await audits(tA.id, 'settings.brand')
      check('审计：一条 settings.brand，只记字段名、不记值', a1.length === 1 && a1[0].actorKind === 'TENANT' && JSON.stringify(a1[0].diff) === JSON.stringify({ changed: ['brandName', 'brandIntro', 'heroTitle', 'heroSubtitle', 'seoTitle', 'seoDescription'] }) && !JSON.stringify(a1[0]).includes('小鹿'), JSON.stringify(a1))
      await put({ brandName: '小鹿优选' })
      check('提交与库里相同：不写审计', (await audits(tA.id, 'settings.brand')).length === 1)
      const strict = await put({ brandName: '小鹿', brandLogoUrl: '/uploads/brand/x.png' })
      check('strict：带 brandLogoUrl 400（logo 只能经上传接口写）', strict.status === 400 && (await rowOf(tA.id))?.brandLogoUrl === null)
      for (const [label, body, frag] of [
        ['冒充官方', { brandName: 'ChatGPT官方店' }, '网站名称不能包含'],
        ['邮件禁发词', { brandName: '微信小店' }, '会进系统邮件标题'],
        ['网址', { brandIntro: '详情见 https://x.example' }, '不能包含网址'],
        ['超长', { heroTitle: '一'.repeat(21) }, '2–20'],
      ] as const) {
        const r = await put(body)
        check(`校验：${label} → 400，提示「${frag}」，库里不变`, r.status === 400 && String(r.json?.error).includes(frag) && (await rowOf(tA.id))?.brandName === '小鹿优选', JSON.stringify(r.json))
      }
      const clr = await put({ heroSubtitle: '' })
      check('空串 = 清空该项', clr.status === 200 && (await rowOf(tA.id))?.heroSubtitle === null)
      await put({ heroSubtitle: '支付宝付款，即买即用' })

      // logo
      const up = (file: { data: Buffer; type: string; name: string } | undefined, token = tokA, declaredLength?: number) =>
        callMultipart(logoRoute.POST as unknown as RouteFn, { host: tA.host, token, path: LPATH, file, declaredLength })
      const u1 = await up({ data: PNG, type: 'image/png', name: 'a.png' })
      const url1 = (await rowOf(tA.id))?.brandLogoUrl as string
      if (url1) createdFiles.push(url1)
      check('上传 PNG：200，地址形如 /uploads/brand/<名>.png，文件落盘', u1.status === 200 && /^\/uploads\/brand\/[0-9a-z-]+\.png$/.test(url1) && existsSync(fileOf(url1)) && u1.json?.data?.brand?.brandLogoUrl === url1, JSON.stringify(u1.json))
      check('上传响应键在白名单内', keysOk(u1.json), badKeys(u1.json))
      const u2 = await up({ data: PNG2, type: 'image/png', name: 'b.png' })
      const url2 = (await rowOf(tA.id))?.brandLogoUrl as string
      if (url2) createdFiles.push(url2)
      check('换图：新地址生效，旧文件已删', u2.status === 200 && url2 !== url1 && existsSync(fileOf(url2)) && !existsSync(fileOf(url1)))
      const ug = await up({ data: GIF, type: 'image/gif', name: 'x.gif' })
      const us = await up({ data: SVG, type: 'image/png', name: 'x.png' })
      check('GIF / 伪装成 PNG 的 SVG：400，库里不变', ug.status === 400 && us.status === 400 && (await rowOf(tA.id))?.brandLogoUrl === url2, `${ug.status} ${us.status}`)
      const ubig = await up({ data: Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]), type: 'image/png', name: 'big.png' })
      check('超过 1MB：拒绝（413 / 400）', ubig.status === 413 || ubig.status === 400, String(ubig.status))
      const ust = await up({ data: PNG, type: 'image/png', name: 'a.png' }, tokStaff)
      check('STAFF 上传：404', ust.status === 404)
      const logoAudits = (await audits(tA.id, 'settings.brand')).filter((a) => JSON.stringify(a.diff).includes('brandLogoUrl'))
      check('logo 每次成功上传各写一条审计（只记字段名）', logoAudits.length === 2)

      // 锁定
      await prisma.tenant.update({ where: { id: tA.id }, data: { brandLocked: true } })
      tenantBrand.invalidateTenantBrand(tA.id)
      const lk = await put({ brandName: '别的名字' })
      check('锁定后 PUT：409，库里不变', lk.status === 409 && (await rowOf(tA.id))?.brandName === '小鹿优选', JSON.stringify(lk.json))
      const lku = await up({ data: PNG, type: 'image/png', name: 'a.png' })
      check('锁定后上传 logo：409，库里不变、不留新文件', lku.status === 409 && (await rowOf(tA.id))?.brandLogoUrl === url2)
      const lkd = await callRoute(logoRoute.DELETE as unknown as RouteFn, { host: tA.host, token: tokA, path: LPATH, method: 'DELETE', body: {} })
      check('锁定后清除 logo：409', lkd.status === 409 && (await rowOf(tA.id))?.brandLogoUrl === url2)
      const lg = await callRoute(brandRoute.GET as unknown as RouteFn, { host: tA.host, token: tokA, path: BPATH })
      check('锁定后 GET：locked=true', lg.json?.data?.brand?.locked === true)
      await prisma.tenant.update({ where: { id: tA.id }, data: { brandLocked: false } })

      // 他站互不影响
      const pb = await put({ brandName: '斑马小站' }, tokB, tB.host)
      check('B 站改自己的名字不影响 A', pb.status === 200 && (await rowOf(tA.id))?.brandName === '小鹿优选' && (await rowOf(tB.id))?.brandName === '斑马小站')
    }

    // =======================================================================
    section('B6 店面与缓存')
    {
      resolve.invalidateStorefrontCache?.()
      const sf = await resolve.storefrontById(tA.id)
      check('storefrontById：brand 按回退规则算出', !!sf && sf.brand.name === '小鹿优选' && sf.brand.custom && /^\/uploads\/brand\//.test(sf.brand.logoUrl ?? '') && sf.brand.heroTitle === 'AI 会员一站购')
      const sfC = await resolve.storefrontById(tC.id)
      check('没有白标的渠道：brand = 主站默认', !!sfC && JSON.stringify(sfC.brand) === JSON.stringify(PLATFORM_BRAND))
      const sfMain = await resolve.storefrontById(1)
      check('主站：brand = 主站默认（不查库）', !!sfMain && JSON.stringify(sfMain.brand) === JSON.stringify(PLATFORM_BRAND))
      const pub = pubMod.toPublicStorefront(sf)
      check('toPublicStorefront：brand 逐字段映射', JSON.stringify(pub.brand) === JSON.stringify(sf!.brand))
      tenantBrand.invalidateTenantBrand(tA.id)
      const b1 = await tenantBrand.getTenantBrand(tA.id)
      await prisma.tenant.update({ where: { id: tA.id }, data: { brandName: '临时名字' } })
      const b2 = await tenantBrand.getTenantBrand(tA.id)
      tenantBrand.invalidateTenantBrand(tA.id)
      const b3 = await tenantBrand.getTenantBrand(tA.id)
      check('getTenantBrand：60 秒缓存，失效后读新值', b1.name === '小鹿优选' && b2.name === '小鹿优选' && b3.name === '临时名字')
      await prisma.tenant.update({ where: { id: tA.id }, data: { brandName: '小鹿优选' } })
      tenantBrand.invalidateTenantBrand(tA.id)
      check('getTenantBrand：主站与不存在的渠道 = 主站默认', (await tenantBrand.getTenantBrand(1)).name === '贝果科技' && (await tenantBrand.getTenantBrand(99999999)).name === '贝果科技')
    }

    // =======================================================================
    section('B3 白标渠道前台展示')
    {
      const sf = await resolve.storefrontById(tA.id)
      const pubA = pubMod.toPublicStorefront(sf)
      const Header = (await import('../../src/components/layout/header')).Header
      const Footer = (await import('../../src/components/layout/footer')).Footer
      const FloatingContact = (await import('../../src/components/floating-contact')).FloatingContact
      const { DraftClosedPage } = await import('../../src/components/storefront/closed-page')
      const HomeClient = (await import('../../src/app/(shop)/home-client')).default
      const hd = render(pubA, h(Header))
      check('页头：渠道站名与 logo，没有「贝果科技」与贝果图标', hd.includes('小鹿优选') && hd.includes(sf!.brand.logoUrl as string) && !hd.includes('贝果科技') && !hd.includes('/logo-mark.png'))
      const ft = render(pubA, h(Footer))
      check('页脚：渠道站名、logo、简介；没有贝果字标图', ft.includes('小鹿优选') && ft.includes('小鹿优选专注 AI 会员服务') && !ft.includes('/logo-full.png') && !ft.includes('贝果科技'))
      check('页脚：底部保留经营主体小字', ft.includes(OPERATOR_LINE))
      const fc = opened(() => render(pubA, h(FloatingContact)))
      check('浮动客服：「小鹿优选专属客服为你服务」', fc.includes('小鹿优选专属客服为你服务') && !fc.includes('贝果科技'))
      const home = render(pubA, h(HomeClient, { stats: { totalSales: 1, skuCount: 1 } }))
      check('首页：大标题与副标题换成渠道的', home.includes('AI 会员一站购') && home.includes('支付宝付款，即买即用') && !home.includes('充值与代充'))
      check('筹备页：渠道站名', render(pubA, h(DraftClosedPage)).includes('小鹿优选'))
      // 公告弹窗外层：渠道站也要挂内层组件（SSR 时弹窗本来就是空串，只能看外层返回了什么元素）
      const { AnnouncementModal } = await import('../../src/components/announcement-modal')
      const mountedType = (pub: PublicStorefront): string => {
        let got: unknown = undefined
        const Probe = () => {
          got = (AnnouncementModal as unknown as () => unknown)()
          return null
        }
        render(pub, h(Probe))
        const t = (got as { type?: { name?: string } } | null)?.type
        return got === null ? 'null' : t?.name ?? String(t)
      }
      check('公告弹窗：渠道站与主站都挂内层组件', mountedType(pubA) === 'AnnouncementModalInner' && mountedType(platformPub) === 'AnnouncementModalInner', `${mountedType(pubA)} / ${mountedType(platformPub)}`)
      // 只改名、没 logo：页头显示首字圆角块，不用贝果图标
      const nameOnly = channelPub({ ...PLATFORM_BRAND, name: '斑马小站', custom: true })
      const hd2 = render(nameOnly, h(Header))
      check('只改名没 logo：页头用首字块，不出现贝果图标', hd2.includes('>斑</span>') && !hd2.includes('/logo-mark.png') && hd2.includes('斑马小站'))
      const ft2 = render(nameOnly, h(Footer))
      check('只改名没 logo：页脚默认简介里的站名换成渠道的，且有经营主体小字', ft2.includes('斑马小站提供 ChatGPT') && ft2.includes(OPERATOR_LINE) && !ft2.includes('贝果科技'))
      // 白标值作为文本节点转义（站名本身已过字符集，这里用 intro 验转义）
      const esc = render(channelPub({ ...PLATFORM_BRAND, name: '斑马小站', custom: true, intro: 'A & B <i>' }), h(Footer))
      check('文本按文本节点转义', esc.includes('A &amp; B &lt;i&gt;') && !esc.includes('<i>'))
      // 没有白标的渠道：与主站完全一样（除了已关闭模块的入口）
      const plainC = channelPub({ ...PLATFORM_BRAND })
      check('没有白标的渠道：页头仍是贝果科技与贝果图标', render(plainC, h(Header)).includes('/logo-mark.png?v=3') && render(plainC, h(Header)).includes('贝果科技'))
      check('没有白标的渠道：页脚没有经营主体小字', !render(plainC, h(Footer)).includes(OPERATOR_LINE))
    }

    // =======================================================================
    section('B4 白标渠道 metadata')
    {
      const root = await import('../../src/app/layout')
      const homePage = await import('../../src/app/(shop)/page')
      const login = await import('../../src/app/(shop)/login/layout')
      const support = await import('../../src/app/(shop)/support/layout')
      resolve.invalidateStorefrontCache?.()
      const m = (await withRequest({ host: tA.host }, () => root.generateMetadata())) as any
      const logo = (await rowOf(tA.id))?.brandLogoUrl as string
      check('根布局：标题 = 渠道浏览器标题、描述 = 分享摘要、站名 = 渠道站名', m.title === '小鹿优选 - AI 会员' && m.description === '小鹿优选：ChatGPT、Claude 会员即买即用。' && m.applicationName === '小鹿优选' && m.openGraph?.siteName === '小鹿优选', metaJson(m).slice(0, 300))
      check('根布局：图标与分享图换成渠道 logo', JSON.stringify(m.icons).includes(logo) && !JSON.stringify(m.icons).includes('favicon.ico') && JSON.stringify(m.openGraph?.images).includes(logo) && !JSON.stringify(m.openGraph).includes('og-default'))
      check('根布局：仍是 noindex、metadataBase 为渠道域名', m.robots?.index === false && String(m.metadataBase) === `https://${tA.host}/`)
      check('根布局：整份 metadata 不含「贝果科技」', !metaJson(m).includes('贝果科技'))
      const hm = (await withRequest({ host: tA.host }, () => homePage.generateMetadata())) as any
      check('首页：渠道浏览器标题与摘要，分享图是 logo', hm.title === '小鹿优选 - AI 会员' && hm.openGraph?.title === '小鹿优选 - AI 会员' && JSON.stringify(hm.openGraph?.images).includes(logo) && !metaJson(hm).includes('贝果科技'))
      const lm = (await withRequest({ host: tA.host }, () => login.generateMetadata())) as any
      check('登录页：「登录 - 小鹿优选」，描述里的站名也换了', lm.title === '登录 - 小鹿优选' && String(lm.description).includes('登录小鹿优选账号'))
      const sm = (await withRequest({ host: tA.host }, () => support.generateMetadata())) as any
      check('客服中心：标题里的站名换了，分享图是 logo', String(sm.title).endsWith('小鹿优选') && !metaJson(sm).includes('贝果科技') && JSON.stringify(sm.openGraph?.images).includes(logo))
      // 只改名、没 logo：图标是首字 SVG，不给分享图
      const mB = (await withRequest({ host: tB.host }, () => root.generateMetadata())) as any
      check('只改名没 logo：图标是首字 SVG，没有分享图', JSON.stringify(mB.icons).includes('data:image/svg+xml') && Array.isArray(mB.openGraph?.images) && mB.openGraph.images.length === 0 && mB.title.includes('斑马小站'))
      // 没有白标的渠道：与改造前同一套（站名仍是贝果科技）
      const mC = (await withRequest({ host: tC.host }, () => root.generateMetadata())) as any
      check('没有白标的渠道：根布局仍是贝果科技、贝果图标', metaJson(mC).includes('贝果科技') && JSON.stringify(mC.icons).includes('favicon.ico'))
    }

    // =======================================================================
    section('B7 邮件')
    {
      const opts = await originLib.tenantMailOpts(tA.id)
      check('tenantMailOpts：改了名的渠道带 brand', opts?.brand === '小鹿优选' && opts?.origin === `https://${tA.host}`)
      const optsC = await originLib.tenantMailOpts(tC.id)
      check('tenantMailOpts：没改名的渠道不带 brand', !!optsC && optsC.brand === undefined)
      check('tenantMailOpts：主站 undefined', (await originLib.tenantMailOpts(1)) === undefined)
      const o = { orderNo: 'ITEST001', productName: '测试商品', amount: '10.00' }
      const r1 = mail.renderOrderPaidEmail(o, opts!)
      check('交易邮件：标题与抬头用渠道站名', r1.subject.startsWith('【小鹿优选】') && r1.html.includes('>小鹿优选</div>') && !r1.subject.includes('贝果科技'))
      const r0 = mail.renderOrderPaidEmail(o)
      check('主站邮件：标题仍是【贝果科技】', r0.subject.startsWith('【贝果科技】') && r0.html.includes('>贝果科技</div>'))
      const rBad = mail.renderOrderPaidEmail(o, { brand: '<script>' })
      check('不合规站名：回落贝果科技', rBad.subject.startsWith('【贝果科技】') && !rBad.html.includes('<script>'))
      const vc = mail.renderVerifyCodeEmail('123456', 'LOGIN' as never, { origin: `https://${tA.host}`, brand: '小鹿优选' })
      check('验证码邮件：标题用渠道站名', vc.subject.startsWith('【小鹿优选】'))
    }

    // =======================================================================
    const annRoute = await import('../../src/app/api/partner/announcements/route')
    const annOne = await import('../../src/app/api/partner/announcements/[announcementNo]/route')
    const pubAnn = await import('../../src/app/api/announcement/route')
    const APATH = '/api/partner/announcements'
    const annBody = (over: Record<string, unknown> = {}) => ({ title: '国庆发货安排', body: '10 月 1 日至 7 日\n人工发货延迟至 24 小时内', level: 'INFO', enabled: true, pinned: false, startAt: null, endAt: null, ...over })
    const createAnn = (body: unknown, token = tokA, host = tA.host) => callRoute(annRoute.POST as unknown as RouteFn, { host, token, path: APATH, method: 'POST', body })
    const listAnn = (token = tokA, host = tA.host) => callRoute(annRoute.GET as unknown as RouteFn, { host, token, path: APATH })
    const putAnn = (no: string, body: unknown, token = tokA, host = tA.host) => callRoute(annOne.PUT as unknown as RouteFn, { host, token, path: `${APATH}/${no}`, method: 'PUT', body, params: { announcementNo: no } })
    const delAnn = (no: string, token = tokA, host = tA.host) => callRoute(annOne.DELETE as unknown as RouteFn, { host, token, path: `${APATH}/${no}`, method: 'DELETE', body: {}, params: { announcementNo: no } })
    const live = (host: string) => callRoute(pubAnn.GET as unknown as RouteFn, { host, path: '/api/announcement' })

    section('B8 渠道公告接口')
    let noA1 = ''
    let noA2 = ''
    {
      const c1 = await createAnn(annBody())
      noA1 = c1.json?.data?.row?.announcementNo
      check('新建：200，公开编号 12 位、正文字段 body、没有 id / content', c1.status === 200 && /^[0-9A-HJKMNP-TV-Z]{12}$/.test(noA1) && c1.json.data.row.body.includes('人工发货') && !('id' in c1.json.data.row) && !('content' in c1.json.data.row), JSON.stringify(c1.json))
      check('新建：响应键在白名单内', keysOk(c1.json), badKeys(c1.json))
      check('新建：live=true（启用且不限时间）', c1.json?.data?.row?.live === true)
      const c2 = await createAnn(annBody({ title: '强提醒：客服时间调整', pinned: true }))
      noA2 = c2.json?.data?.row?.announcementNo
      const ls = await listAnn()
      check('列表：两条、新的在前、键在白名单内', ls.status === 200 && ls.json?.data?.rows?.length === 2 && ls.json.data.rows[0].announcementNo === noA2 && keysOk(ls.json), badKeys(ls.json))
      const st = await listAnn(tokStaff)
      check('STAFF：404', st.status === 404)
      const strict = await createAnn({ ...annBody(), content: 'x' })
      check('strict：带 content 字段 400', strict.status === 400)
      const empty = await createAnn(annBody({ title: '  ' }))
      check('空标题：400', empty.status === 400 && String(empty.json?.error).includes('标题'))
      const long = await createAnn(annBody({ body: '一'.repeat(2001) }))
      check('正文超过 2000 字：400', long.status === 400)
      const badTime = await createAnn(annBody({ startAt: '2026-10-10T00:00:00Z', endAt: '2026-10-09T00:00:00Z' }))
      check('结束早于开始：400', badTime.status === 400 && String(badTime.json?.error).includes('结束时间'))
      const zw = String.fromCharCode(0x200b)
      const cleaned = await createAnn(annBody({ title: '清洗' + zw + '测试' }))
      check('零宽字符被去掉', cleaned.status === 200 && cleaned.json.data.row.title === '清洗测试')
      await delAnn(cleaned.json.data.row.announcementNo)

      const u = await putAnn(noA1, annBody({ title: '国庆发货安排（更新）', enabled: false }))
      check('修改：200，停用后 live=false', u.status === 200 && u.json?.data?.row?.title === '国庆发货安排（更新）' && u.json.data.row.live === false)
      const lower = await putAnn(noA1.toLowerCase(), annBody({ title: '国庆发货安排（更新）', enabled: true }))
      check('编号大小写不敏感', lower.status === 200 && lower.json?.data?.row?.enabled === true)
      const cross = await putAnn(noA1, annBody({ title: '他站改' }), tokB, tB.host)
      check('他站 OWNER 改 A 的公告编号：404，库里不变', cross.status === 404 && (await prisma.tenantAnnouncement.findUnique({ where: { announcementNo: noA1 } }))?.title === '国庆发货安排（更新）')
      const crossDel = await delAnn(noA1, tokB, tB.host)
      check('他站 OWNER 删 A 的公告：404，仍在', crossDel.status === 404 && !!(await prisma.tenantAnnouncement.findUnique({ where: { announcementNo: noA1 } })))
      const junk = await putAnn('../../1', annBody())
      const junk2 = await delAnn('123')
      check('乱码编号：404', junk.status === 404 && junk2.status === 404)

      // 50 条上限
      const n0 = await prisma.tenantAnnouncement.count({ where: { tenantId: tB.id } })
      await prisma.tenantAnnouncement.createMany({ data: Array.from({ length: 50 - n0 }, (_, i) => ({ tenantId: tB.id, announcementNo: `ITB${RUN}`.slice(0, 7).toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z]/g, '0') + String(i).padStart(5, '0'), title: `t${i}`, content: 'x' })) })
      const over = await createAnn(annBody(), tokB, tB.host)
      check('第 51 条：409', over.status === 409 && String(over.json?.error).includes('50'), JSON.stringify(over.json))
      await prisma.tenantAnnouncement.deleteMany({ where: { tenantId: tB.id } })

      // 被下架不能启用
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA1 }, data: { blocked: true, enabled: false } })
      const en = await putAnn(noA1, annBody({ title: '国庆发货安排（更新）', enabled: true }))
      check('被平台下架的公告不能启用：409', en.status === 409 && String(en.json?.error).includes('下架'))
      const edit = await putAnn(noA1, annBody({ title: '修改内容', enabled: false }))
      check('被下架的公告可以修改内容（不启用）', edit.status === 200 && edit.json?.data?.row?.blocked === true)
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA1 }, data: { blocked: false, enabled: true, title: '国庆发货安排（更新）' } })
      const aud = await audits(tA.id, 'settings.announcement')
      check('审计：增删改各有记录，diff 只有操作与编号', aud.length >= 4 && aud.every((a) => { const d = a.diff as Record<string, unknown>; return Object.keys(d).sort().join(',') === 'announcementNo,op' }), JSON.stringify(aud.slice(0, 2)))
    }

    // =======================================================================
    section('B9 前台公告接口 /api/announcement')
    {
      const a = await live(tA.host)
      check('A 站：返回本站强提醒那条，id 是公开编号', a.status === 200 && a.json?.data?.id === noA2 && a.json.data.pinned === true && a.json.data.title.startsWith('强提醒'), JSON.stringify(a.json))
      check('A 站：响应没有 tenantId / announcementNo / 自增 id', !JSON.stringify(a.json).includes('tenantId') && typeof a.json?.data?.id === 'string')
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA2 }, data: { enabled: false } })
      const a2 = await live(tA.host)
      check('强提醒停用后：返回另一条', a2.json?.data?.id === noA1)
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA1 }, data: { startAt: new Date(Date.now() + 3600_000) } })
      const a3 = await live(tA.host)
      check('未到开始时间：不展示（null）', a3.status === 200 && a3.json?.data === null)
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA1 }, data: { startAt: null, endAt: new Date(Date.now() - 60_000) } })
      check('已过结束时间：不展示', (await live(tA.host)).json?.data === null)
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA1 }, data: { endAt: null, blocked: true } })
      check('被下架：不展示', (await live(tA.host)).json?.data === null)
      await prisma.tenantAnnouncement.update({ where: { announcementNo: noA1 }, data: { blocked: false, enabled: true } })
      check('恢复后：展示', (await live(tA.host)).json?.data?.id === noA1)
      const b = await live(tB.host)
      check('B 站看不到 A 站的公告', b.status === 200 && b.json?.data === null)
      // 主站：只查 announcements 表，看不到任何渠道公告
      const m = await live(MAIN_HOST)
      const mainLive = await prisma.announcement.findFirst({ where: { enabled: true }, orderBy: [{ pinned: 'desc' }, { id: 'desc' }], select: { id: true } })
      check('主站：照旧查主站公告表，看不到渠道公告', m.status === 200 && (m.json?.data === null || typeof m.json?.data?.id === 'number') && m.json?.data?.id !== noA1 && (m.json?.data?.id ?? null) === ((await prisma.announcement.findFirst({ where: { enabled: true, AND: [{ OR: [{ startAt: null }, { startAt: { lte: new Date() } }] }, { OR: [{ endAt: null }, { endAt: { gte: new Date() } }] }] }, orderBy: [{ pinned: 'desc' }, { id: 'desc' }], select: { id: true } }))?.id ?? null), `${JSON.stringify(m.json)} mainLive=${mainLive?.id}`)
      // 筹备中
      // createTenant 的编码只按 kind 区分（itx/itz/itl + RUN），三种都已用掉：筹备中的渠道直接建
      const dCode = `itd${RUN}`.slice(0, 20)
      const dRow = await prisma.tenant.create({ data: { code: dCode, kind: 'CHANNEL', name: 'ITEST-TENANT-d', status: 'DRAFT', origin: `https://${dCode}.bigolab.com` } })
      await prisma.tenantDomain.create({ data: { tenantId: dRow.id, host: `${dCode}.bigolab.com`, isPrimary: true, status: 1 } })
      const tD = { id: dRow.id, code: dCode, host: `${dCode}.bigolab.com`, origin: `https://${dCode}.bigolab.com` }
      tenants.push(tD)
      await prisma.tenantAnnouncement.create({ data: { tenantId: tD.id, announcementNo: 'D' + noA1.slice(1), title: '筹备期公告', content: 'x', enabled: true } })
      const d = await live(tD.host)
      check('筹备中的渠道：不给公告（null）', d.status === 200 && d.json?.data === null)
      await prisma.tenantAnnouncement.deleteMany({ where: { tenantId: tD.id } })
      // 未登记 Host
      const u = await live('zz-unreg-brand.example')
      check('未登记的域名：404', u.status === 404)
      // 休眠：任何 Host 都是主站
      setChannelsMode('dormant')
      try {
        const dm = await live(tA.host)
        check('休眠：渠道 Host 也按主站查主站公告表', dm.status === 200 && dm.json?.data?.id !== noA1)
      } finally {
        setChannelsMode('observe')
      }
    }

    // =======================================================================
    section('B10 超管：品牌与公告')
    {
      const bRoute = await import('../../src/app/api/admin/tenants/[id]/brand/route')
      const aRoute = await import('../../src/app/api/admin/tenants/[id]/announcements/[announcementNo]/route')
      const g = await callRoute(bRoute.GET as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/brand`, params: { id: String(tA.id) } })
      check('GET：品牌原值与公告列表', g.status === 200 && g.json?.data?.brand?.brandName === '小鹿优选' && g.json.data.announcements.length === 2, JSON.stringify(g.json).slice(0, 200))
      const deny = await callRoute(bRoute.GET as unknown as RouteFn, { host: MAIN_HOST, token: tokPlain, path: `/api/admin/tenants/${tA.id}/brand`, params: { id: String(tA.id) } })
      check('非超管：拒绝', deny.status >= 400)
      const onChannel = await callRoute(bRoute.GET as unknown as RouteFn, { host: tA.host, token: tokSa, path: `/api/admin/tenants/${tA.id}/brand`, params: { id: String(tA.id) } })
      check('渠道 Host 上调超管接口：拒绝', onChannel.status >= 400)
      const mainG = await callRoute(bRoute.GET as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: '/api/admin/tenants/1/brand', params: { id: '1' } })
      check('主站租户：404（只有渠道有品牌设置）', mainG.status === 404)

      const lock = await callRoute(bRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/brand`, method: 'POST', body: { action: 'lock' }, params: { id: String(tA.id) } })
      check('锁定：200，库里 brandLocked=true，渠道收到通知', lock.status === 200 && (await rowOf(tA.id))?.brandLocked === true && (await prisma.tenantNotice.count({ where: { tenantId: tA.id, title: '平台已锁定店铺品牌设置' } })) === 1)
      const la = await audits(tA.id, 'tenant.brand_lock')
      check('锁定审计：PLATFORM，publicDiff 只有 locked', la.length === 1 && la[0].actorKind === 'PLATFORM' && JSON.stringify(la[0].publicDiff) === JSON.stringify({ locked: true }))
      const again = await callRoute(bRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/brand`, method: 'POST', body: { action: 'lock' }, params: { id: String(tA.id) } })
      check('重复锁定：不再写审计', again.status === 200 && (await audits(tA.id, 'tenant.brand_lock')).length === 1)

      const logoBefore = (await rowOf(tA.id))?.brandLogoUrl as string
      const reset = await callRoute(bRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/brand`, method: 'POST', body: { action: 'reset' }, params: { id: String(tA.id) } })
      const after = await rowOf(tA.id)
      check(
        '恢复默认：七个字段清空、锁定保留、旧 logo 文件已删',
        reset.status === 200 && [after?.brandName, after?.brandLogoUrl, after?.brandIntro, after?.heroTitle, after?.heroSubtitle, after?.seoTitle, after?.seoDescription].every((v) => v === null) && after?.brandLocked === true && !existsSync(fileOf(logoBefore)),
      )
      const ra = await audits(tA.id, 'tenant.brand_reset')
      check('恢复默认审计：diff 记旧站名与 logo，publicDiff 只有 reset', ra.length === 1 && JSON.stringify(ra[0].diff).includes('小鹿优选') && JSON.stringify(ra[0].publicDiff) === JSON.stringify({ reset: true }))
      tenantBrand.invalidateTenantBrand(tA.id)
      check('恢复默认后：店面品牌回到主站默认', JSON.stringify((await resolve.storefrontById(tA.id))?.brand) === JSON.stringify(PLATFORM_BRAND))
      await callRoute(bRoute.POST as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/brand`, method: 'POST', body: { action: 'unlock' }, params: { id: String(tA.id) } })
      check('解锁：brandLocked=false', (await rowOf(tA.id))?.brandLocked === false)

      const blk = await callRoute(aRoute.PATCH as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/announcements/${noA1}`, method: 'PATCH', body: { blocked: true }, params: { id: String(tA.id), announcementNo: noA1 } })
      const r1 = await prisma.tenantAnnouncement.findUnique({ where: { announcementNo: noA1 } })
      check('下架：blocked=true 且停用，前台不再展示', blk.status === 200 && r1?.blocked === true && r1.enabled === false && (await live(tA.host)).json?.data?.id !== noA1)
      check('下架：渠道收到通知', (await prisma.tenantNotice.count({ where: { tenantId: tA.id, title: { startsWith: '平台已下架公告' } } })) === 1)
      const crossBlk = await callRoute(aRoute.PATCH as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tB.id}/announcements/${noA1}`, method: 'PATCH', body: { blocked: false }, params: { id: String(tB.id), announcementNo: noA1 } })
      check('用 B 的渠道 id 操作 A 的公告编号：404', crossBlk.status === 404 && (await prisma.tenantAnnouncement.findUnique({ where: { announcementNo: noA1 } }))?.blocked === true)
      const unb = await callRoute(aRoute.PATCH as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tA.id}/announcements/${noA1}`, method: 'PATCH', body: { blocked: false }, params: { id: String(tA.id), announcementNo: noA1 } })
      const r2 = await prisma.tenantAnnouncement.findUnique({ where: { announcementNo: noA1 } })
      check('恢复：blocked=false，但不自动启用', unb.status === 200 && r2?.blocked === false && r2.enabled === false)
      const ba = await audits(tA.id, 'tenant.announcement_block')
      check('公告下架 / 恢复审计：两条，publicDiff 带编号不带正文', ba.length === 2 && ba.every((a) => JSON.stringify(a.publicDiff).includes(noA1) && !JSON.stringify(a.publicDiff).includes('发货')))
      const denyBlk = await callRoute(aRoute.PATCH as unknown as RouteFn, { host: MAIN_HOST, token: tokPlain, path: `/api/admin/tenants/${tA.id}/announcements/${noA1}`, method: 'PATCH', body: { blocked: true }, params: { id: String(tA.id), announcementNo: noA1 } })
      check('非超管下架：拒绝', denyBlk.status >= 400 && (await prisma.tenantAnnouncement.findUnique({ where: { announcementNo: noA1 } }))?.blocked === false)
    }
  } finally {
    if (baseMade) {
      try {
        rmSync(path.join(ROOT, BASE_DIR_REL), { recursive: true, force: true })
      } catch {
        /* 忽略 */
      }
    }
    for (const t of tenants) {
      const tq = await prisma.tenant.findUnique({ where: { id: t.id }, select: { brandLogoUrl: true } })
      if (tq?.brandLogoUrl) createdFiles.push(tq.brandLogoUrl)
    }
    for (const u of createdFiles) await upload.deleteBrandUpload(u).catch(() => false)
    const tIds = tenants.map((t) => t.id)
    const uIds = users.map((u) => u.id)
    await prisma.tenantAnnouncement.deleteMany({ where: { tenantId: { in: tIds } } })
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
    summary()
    await prisma.$disconnect()
    process.exit(1)
  })
