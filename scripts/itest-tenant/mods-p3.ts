/**
 * 渠道分站二期 · P3 客服信息集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-p3.ts
 *   P3_BASE_REF=<改动前的提交> …同上…      # 「主站逐字不变」对比的基线，默认 HEAD（二期改动未提交时 HEAD 就是改动前）
 *
 * 覆盖 docs/多渠道分销-二期改动.md 第 4 节里 P3 负责的部分：
 *   P3-1 主站 HTML 在客服展示点**逐字不变**：把基线版本（git show <ref>:<file>）的展示点文件落到临时目录，
 *        与工作区版本在同一进程、同一份开发库数据下各渲染一遍，逐字比较（联系弹窗、浮动客服、页脚、客服中心 + FAQ 结构化数据、
 *        商品列表页、商品详情页（按交付方式各取一个在售商品）、隐私 / 条款页、product-intro 的全部文案、FAQ 数据）
 *   P3-2 渠道展示点按店面取值：四种回退组合下各展示点的微信号 / 二维码 / 邮箱 / 服务时间；不出现主站微信号；
 *        值一律按文本节点转义；渠道客服中心的 FAQ 结构化数据是渠道自己的客服
 *   P3-3 渠道接口：GET / PUT contact（校验、strict 拒 qrUrl、审计只记字段名、没变不写审计）、POST / DELETE contact-qr
 *        （multipart、先查 Content-Length、只收 png/jpg/webp、换图删旧图、清除）；STAFF / 他站 / 暂停营业；响应键白名单
 *   P3-4 超管：PATCH 客服字段（zod 只收合规 qrUrl、禁发词邮箱、他站在用的图拒绝、换图 / 清除后按引用删旧图、审计 publicDiff 只给字段名）、
 *        GET 详情带推送方式只读字段（邮箱掩码）与客服原值；/api/upload scope=contact 仅 ADMIN、2MB、不收 gif
 *
 * 【测试数据】租户 / 用户走 _harness 的前缀（ITEST / @itest-tenant.local），结束时**只删本脚本建的行与文件**（不调 cleanupAll：
 * 二期多包并行跑 itest，全量清理会误删别的包正在用的夹具）。基线临时目录 scripts/itest-tenant/.p3-base-<run>/ 结束时删除。
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

// ---------------------------------------------------------------------------
// 进程内渲染 Next 页面 / 组件的最小替身（同 wp1.ts）：
//  · 仓库 tsconfig 是 jsx: preserve，tsx 按经典运行时编译 JSX（React.createElement），需要全局 React；
//  · 页面 import 的 .css / next/font 换成空对象；
//  · 本仓库的 react 是 18.3（没有 React.cache，Next 运行时用的是自带的 canary）：页面模块在加载时调 cache(fn)，这里补一个直通版。
// 只影响本测试进程。
// ---------------------------------------------------------------------------
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
const BASE_REF = process.env.P3_BASE_REF || 'HEAD'
const BASE_DIR_REL = `scripts/itest-tenant/.p3-base-${RUN}`

/** 本包改动过的主站展示点文件（基线版本落盘对比用）。orders/page.tsx 没有改动（弹窗组件自己按店面取值），不在其中 */
const DISPLAY_FILES = [
  'src/components/contact-modal.tsx',
  'src/components/floating-contact.tsx',
  'src/components/layout/footer.tsx',
  'src/components/legal-page.tsx',
  'src/lib/support-faq.ts',
  'src/lib/product-intro.ts',
  'src/app/(shop)/support/layout.tsx',
  'src/app/(shop)/support/page.tsx',
  'src/app/(shop)/products/page.tsx',
  'src/app/(shop)/products/products-client.tsx',
  'src/app/(shop)/products/[id]/page.tsx',
  'src/app/(shop)/products/[id]/product-client.tsx',
  'src/app/(shop)/privacy/page.tsx',
  'src/app/(shop)/terms/page.tsx',
]

/**
 * 把基线版本落到 scripts/itest-tenant/.p3-base-<run>/<原路径>，并改写 import：
 *  · 指向另一个基线文件的（@/… 或相对路径）→ 指向临时目录里的那一份；
 *  · 其余一律改成指回仓库原文件的相对路径（与工作区版本共用同一个模块实例：StorefrontProvider 的 context、prisma 连接等）。
 * 临时目录在仓库内，裸模块（react、framer-motion…）按父目录照常解析到仓库的 node_modules。
 */
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

/** 从 scripts/itest-tenant/ 出发 import 基线副本 */
const baseImport = (f: string) => import('./' + path.posix.join(`.p3-base-${RUN}`, f.replace(/\.(ts|tsx)$/, '')))

// 1×1 级别的最小合法文件头（sniffImage 只看魔数）
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(80, 1)])
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(80, 2)])
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(80, 3)])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')

/** multipart 请求（进程内）：用 Response(FormData) 生成真实的 multipart 字节与边界，再显式带上 Content-Length */
async function callMultipart(
  route: RouteFn,
  o: { host: string; token?: string; path: string; file?: { data: Buffer; type: string; name: string }; fields?: Record<string, string>; declaredLength?: number; contentType?: string },
): Promise<{ status: number; json: any }> {
  const fd = new FormData()
  for (const [k, v] of Object.entries(o.fields || {})) fd.append(k, v)
  if (o.file) fd.append('file', new Blob([new Uint8Array(o.file.data)], { type: o.file.type }), o.file.name)
  const packed = new Response(fd)
  const body = Buffer.from(await packed.arrayBuffer())
  const h = new Headers()
  h.set('host', o.host)
  if (o.token) h.set('cookie', `token=${o.token}`)
  h.set('content-type', o.contentType ?? (packed.headers.get('content-type') as string))
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

async function main() {
  const { renderToString } = await import('react-dom/server')
  const { AppRouterContext } = await import('next/dist/shared/lib/app-router-context.shared-runtime')
  const { PathnameContext, PathParamsContext } = await import('next/dist/shared/lib/hooks-client-context.shared-runtime')
  const { StorefrontProvider } = await import('../../src/components/storefront-provider')
  const pubMod = await import('../../src/lib/storefront/public')
  const resolve = await import('../../src/lib/storefront/resolve')
  const contactLib = await import('../../src/lib/contact')
  const upload = await import('../../src/lib/upload-store')
  const selects = await import('../../src/lib/partner-services/selects')
  const { PLATFORM_CONTACT } = contactLib
  type StoreContact = import('../../src/lib/contact').StoreContact
  type PublicStorefront = import('../../src/lib/storefront/public').PublicStorefront

  const h = React.createElement
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} }
  const platformPub: PublicStorefront = { code: 'main', kind: 'PLATFORM', origin: 'https://bigolab.com', features: pubMod.storefrontFeatures({ kind: 'PLATFORM' }), contact: { ...PLATFORM_CONTACT } }
  const channelPub = (contact: StoreContact): PublicStorefront => ({ code: 'itp3', kind: 'CHANNEL', origin: 'https://itp3.bigolab.com', features: pubMod.storefrontFeatures({ kind: 'CHANNEL' }), contact })
  const render = (pub: PublicStorefront, el: React.ReactElement, pathname = '/', params: Record<string, string> = {}) =>
    renderToString(
      h(StorefrontProvider, {
        value: pub,
        children: h(AppRouterContext.Provider, { value: router as never }, h(PathnameContext.Provider, { value: pathname }, h(PathParamsContext.Provider, { value: params }, el))),
      }),
    )
  /**
   * 浮窗、弹窗的内容在「展开 / 打开」之后才渲染，SSR 默认看不到。渲染期间把 useState(false) 的初值临时换成 true
   * （展开、打开、已复制都变 true），基线与工作区在同一套替换下渲染，比较仍然公平；渲染完立刻还原。
   */
  const origUseState = ReactMut.useState
  const opened = <T,>(fn: () => T): T => {
    ReactMut.useState = ((init: unknown) => origUseState(init === false ? true : (init as never))) as typeof React.useState
    try {
      return fn()
    } finally {
      ReactMut.useState = origUseState
    }
  }

  const createdFiles: string[] = []
  const tenants: WorldTenant[] = []
  const users: WorldUser[] = []
  let baseMade = false

  try {
    setChannelsMode('observe')

    // =======================================================================
    section(`P3-1 主站 HTML 在客服展示点逐字不变（基线 ${BASE_REF} vs 工作区，同一进程同一份数据各渲染一次）`)
    {
      const { same } = materializeBase()
      baseMade = true
      if (same) console.log(`  ⚠ 基线 ${BASE_REF} 与工作区的展示点源码完全相同（已提交？）——请用 P3_BASE_REF 指定二期改动之前的提交再跑一次`)
      const B = {
        modal: await baseImport('src/components/contact-modal.tsx'),
        floating: await baseImport('src/components/floating-contact.tsx'),
        footer: await baseImport('src/components/layout/footer.tsx'),
        faq: await baseImport('src/lib/support-faq.ts'),
        intro: await baseImport('src/lib/product-intro.ts'),
        supportLayout: await baseImport('src/app/(shop)/support/layout.tsx'),
        supportPage: await baseImport('src/app/(shop)/support/page.tsx'),
        productsPage: await baseImport('src/app/(shop)/products/page.tsx'),
        productPage: await baseImport('src/app/(shop)/products/[id]/page.tsx'),
        privacy: await baseImport('src/app/(shop)/privacy/page.tsx'),
        terms: await baseImport('src/app/(shop)/terms/page.tsx'),
      }
      const N = {
        modal: await import('../../src/components/contact-modal'),
        floating: await import('../../src/components/floating-contact'),
        footer: await import('../../src/components/layout/footer'),
        faq: await import('../../src/lib/support-faq'),
        intro: await import('../../src/lib/product-intro'),
        supportLayout: await import('../../src/app/(shop)/support/layout'),
        supportPage: await import('../../src/app/(shop)/support/page'),
        productsPage: await import('../../src/app/(shop)/products/page'),
        productPage: await import('../../src/app/(shop)/products/[id]/page'),
        privacy: await import('../../src/app/(shop)/privacy/page'),
        terms: await import('../../src/app/(shop)/terms/page'),
      }
      const eq = (name: string, a0: string, b0: string, mustInclude: string[] = []) => {
        // 站标地址上的 ?v= 是同批上线的「新 logo」有意改动（layout.tsx ICON_VERSION 注释），与客服信息无关：
        // 比对前把 /logo-*.png?v=N 归一成 /logo-*.png，其余内容仍逐字比
        const norm = (s: string) => s.replace(/(\/logo-[a-z-]+\.png)\?v=\d+/g, '$1')
        const a = norm(a0)
        const b = norm(b0)
        let at = -1
        if (a !== b) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break }
        const miss = mustInclude.filter((x) => !b.includes(x))
        check(
          `${name}：逐字相同（${b.length} 字节）${mustInclude.length ? '，且含 ' + mustInclude.join(' / ') : ''}`,
          a === b && miss.length === 0,
          a === b ? `缺 ${miss.join(',')}` : `首个差异 @${at}：基线「${a.slice(Math.max(0, at - 40), at + 60)}」 vs 现在「${b.slice(Math.max(0, at - 40), at + 60)}」`,
        )
      }
      /** 在主站请求作用域里调用页面 / 布局函数（同步或 async），拿到元素树 */
      const inMain = (fn: () => unknown): Promise<React.ReactElement> => withRequest({ host: MAIN_HOST }, async () => (await fn()) as React.ReactElement)

      eq('联系弹窗（打开）', render(platformPub, h(B.modal.ContactModal, { open: true, onClose() {} })), render(platformPub, h(N.modal.ContactModal, { open: true, onClose() {} })), ['GenuineMarxist', 'wechat-qr.jpg', '9:00 - 22:00'])
      eq(
        '浮动客服（展开）',
        opened(() => render(platformPub, h(B.floating.FloatingContact))),
        opened(() => render(platformPub, h(N.floating.FloatingContact))),
        ['GenuineMarxist', '9:00 - 22:00 在线响应', '查看二维码'],
      )
      eq('页脚', render(platformPub, h(B.footer.Footer)), render(platformPub, h(N.footer.Footer)), ['添加客服微信'])
      eq('没有 Provider 时（改造前的渲染环境）联系弹窗与主站相同', renderToString(h(B.modal.ContactModal, { open: true, onClose() {} })), renderToString(h(N.modal.ContactModal, { open: true, onClose() {} })))

      const bLayout = await inMain(() => B.supportLayout.default({ children: h(B.supportPage.default) }))
      const nLayout = await inMain(() => N.supportLayout.default({ children: h(N.supportPage.default) }))
      const supBase = opened(() => render(platformPub, bLayout, '/support'))
      const supNew = opened(() => render(platformPub, nLayout, '/support'))
      eq('客服中心（公告条、FAQ、底部 CTA、FAQPage 结构化数据）', supBase, supNew, ['客服在线时间 9:00~22:00', '服务时间 9:00 - 22:00', '请联系客服微信 GenuineMarxist', 'FAQPage'])
      check('FAQ 数据：supportFaqs(PLATFORM_CONTACT) 与原常量逐字相同', JSON.stringify(B.faq.supportFaqs) === JSON.stringify(N.faq.supportFaqs(PLATFORM_CONTACT)))

      // 服务端页面是 async 组件：先在请求作用域里取到元素树，再同步渲染（react-dom 18 的 renderToString 不支持 async 组件）
      const plBaseEl = await inMain(() => B.productsPage.default())
      const plNewEl = await inMain(() => N.productsPage.default())
      const plBase = opened(() => render(platformPub, h(React.Fragment, null, plBaseEl), '/products'))
      const plNew = opened(() => render(platformPub, h(React.Fragment, null, plNewEl), '/products'))
      const hasProducts = plNew.includes('标价均为不含税价')
      eq('商品列表页（含底部客服胶囊与价格说明）', plBase, plNew, hasProducts ? ['微信: GenuineMarxist', '或直接联系客服微信 '] : ['微信: GenuineMarxist'])

      // 商品详情：按交付方式各取一个主站在售商品（排除测试夹具）
      const picks = new Map<string, number>()
      const live = await prisma.product.findMany({ where: { status: 1, NOT: { name: { startsWith: 'ITEST' } } }, select: { id: true, deliveryType: true }, orderBy: { id: 'asc' } })
      for (const p of live) {
        const k = p.deliveryType ?? 'AUTO'
        if (!picks.has(k)) picks.set(k, p.id)
      }
      check('开发库里有主站在售商品可对比', picks.size > 0, '开发库没有 status=1 的商品，商品详情对比跳过')
      for (const [kind, id] of Array.from(picks)) {
        const bEl = await inMain(() => B.productPage.default({ params: { id: String(id) } }))
        const nEl = await inMain(() => N.productPage.default({ params: { id: String(id) } }))
        // 详情页不套 opened()：它的 loading 初值是 false，换成 true 会整页渲染成「加载中」，客服那一行就看不到了
        const b = render(platformPub, h(React.Fragment, null, bEl), `/products/${id}`, { id: String(id) })
        const n = render(platformPub, h(React.Fragment, null, nEl), `/products/${id}`, { id: String(id) })
        eq(`商品详情 #${id}（${kind}）`, b, n, ['9:00-22:00 · 微信 GenuineMarxist'])
      }

      const pvBaseEl = await inMain(() => B.privacy.default())
      const pvNewEl = await inMain(() => N.privacy.default())
      eq('隐私政策页', render(platformPub, pvBaseEl), render(platformPub, pvNewEl), ['客服微信 <span class="font-mono text-white/60">GenuineMarxist</span>'])
      const tmBaseEl = await inMain(() => B.terms.default())
      const tmNewEl = await inMain(() => N.terms.default())
      eq('服务条款页', render(platformPub, tmBaseEl), render(platformPub, tmNewEl), ['GenuineMarxist'])

      // product-intro：库里全部商品 + 三种交付方式的合成商品，文案 JSON 逐字相同
      const all = await prisma.product.findMany({ select: { id: true, name: true, deliveryType: true, category: { select: { name: true } } } })
      const items = all.map((p) => ({ id: p.id, name: p.name, categoryName: p.category?.name ?? null, deliveryType: p.deliveryType }))
      items.push(
        { id: 900001, name: 'ITEST 人工服务', categoryName: '其他', deliveryType: 'MANUAL' },
        { id: 900002, name: 'ITEST 接码', categoryName: '其他', deliveryType: 'SMS' },
        { id: 900003, name: 'ITEST 卡密', categoryName: '其他', deliveryType: 'AUTO' },
        { id: 900004, name: 'Claude Pro 月卡', categoryName: 'Claude', deliveryType: 'MANUAL' },
      )
      const catalog = items.map((p) => ({ id: p.id, name: p.name, price: 10, stock: 5, categoryName: p.categoryName }))
      const diffIntro = items.filter((p) => JSON.stringify(B.intro.buildProductIntro(p, catalog)) !== JSON.stringify(N.intro.buildProductIntro(p, catalog, PLATFORM_CONTACT)))
      const diffIntroDefault = items.filter((p) => JSON.stringify(B.intro.buildProductIntro(p, catalog)) !== JSON.stringify(N.intro.buildProductIntro(p, catalog)))
      check(`商品介绍文案（${items.length} 个商品，传 PLATFORM_CONTACT）逐字相同`, diffIntro.length === 0, diffIntro.map((p) => p.id).join(','))
      check('商品介绍文案（不传 contact 的缺省调用）逐字相同', diffIntroDefault.length === 0, diffIntroDefault.map((p) => p.id).join(','))
      const manualTxt = JSON.stringify(N.intro.buildProductIntro({ id: 900001, name: 'x', categoryName: '其他', deliveryType: 'MANUAL' }, []))
      check('主站人工商品介绍仍含「加客服微信 GenuineMarxist 对接」与「客服时间 9:00-22:00」', manualTxt.includes('加客服微信 GenuineMarxist 对接') && manualTxt.includes('客服时间 9:00-22:00'))
    }

    // =======================================================================
    section('P3-2 渠道展示点按店面取值（四种回退组合）；值按文本节点转义')
    {
      const { ContactModal } = await import('../../src/components/contact-modal')
      const { FloatingContact } = await import('../../src/components/floating-contact')
      const ProductsClient = (await import('../../src/app/(shop)/products/products-client')).default
      const SupportPage = (await import('../../src/app/(shop)/support/page')).default
      const { supportFaqs } = await import('../../src/lib/support-faq')
      const { buildProductIntro } = await import('../../src/lib/product-intro')
      const { LegalPage } = await import('../../src/components/legal-page')
      const { ClosedPage } = await import('../../src/components/storefront/closed-page')
      const qr = '/uploads/contact/itp3abc-0123456789ab.png'
      const full: StoreContact = contactLib.resolveStoreContact({ supportWechat: 'lulu_kf', supportQrUrl: qr, supportEmail: 'kf@lulu-shop.com', supportHours: '10:00-20:00' })
      const onlyQr: StoreContact = contactLib.resolveStoreContact({ supportQrUrl: qr })
      const onlyWx: StoreContact = contactLib.resolveStoreContact({ supportWechat: '露露客服' })
      const none: StoreContact = contactLib.resolveStoreContact({})
      const surfaces = (c: StoreContact) => {
        const pub = channelPub(c)
        return {
          modal: render(pub, h(ContactModal, { open: true, onClose() {} })),
          floating: opened(() => render(pub, h(FloatingContact))),
          list: render(pub, h(ProductsClient, { products: [], guides: {} })),
          support: opened(() => render(pub, h(SupportPage), '/support')),
          legal: render(pub, h(LegalPage, { title: 't', updatedAt: '2026-09-26', intro: null, contact: c, children: null })),
          intro: JSON.stringify([
            buildProductIntro({ id: 1, name: 'x', categoryName: '其他', deliveryType: 'MANUAL' }, [], c),
            buildProductIntro({ id: 2, name: 'y', categoryName: '其他', deliveryType: 'AUTO' }, [], c),
          ]),
          faq: JSON.stringify(supportFaqs(c)),
          closed: opened(() => render(pub, h(ClosedPage))),
        }
      }
      const f = surfaces(full)
      const allHtml = (s: Record<string, string>) => Object.values(s).join('\n')
      /** 只看真正的 HTML（intro / faq 是 JSON 文本：null 是合法的 JSON 值、字符串不做 HTML 转义） */
      const htmlOnly = (s: Record<string, string>) => ['modal', 'floating', 'list', 'support', 'legal', 'closed'].map((k) => s[k]).join('\n')
      check('全设：各展示点出现渠道微信号', ['modal', 'floating', 'list', 'support', 'legal', 'intro', 'faq'].every((k) => (f as Record<string, string>)[k].includes('lulu_kf')))
      check('全设：不出现主站微信号 / 主站二维码', !allHtml(f).includes('GenuineMarxist') && !allHtml(f).includes('wechat-qr.jpg'))
      check('全设：弹窗二维码是渠道的上传地址', f.modal.includes(encodeURIComponent(qr)) || f.modal.includes(qr))
      check('全设：客服邮箱出现在弹窗 / 浮窗 / 客服中心 / 商品介绍', ['modal', 'floating', 'support', 'intro'].every((k) => (f as Record<string, string>)[k].includes('kf@lulu-shop.com')))
      check('全设：服务时间按展示点写法（弹窗「10:00 - 20:00」、公告条「10:00~20:00」、介绍「10:00-20:00」）', f.modal.includes('10:00 - 20:00') && f.support.includes('客服在线时间 10:00~20:00') && f.intro.includes('客服时间 10:00-20:00'))
      check('停业页有「联系客服」入口，弹窗是本店客服', f.closed.includes('联系客服') && f.closed.includes('lulu_kf'))

      const q = surfaces(onlyQr)
      check(
        '只设二维码：微信号整组不回退（不出现主站微信号；页面上不出现 null / undefined）',
        !allHtml(q).includes('GenuineMarxist') && !htmlOnly(q).includes('null') && !allHtml(q).includes('undefined') && !q.intro.includes('微信 null'),
      )
      check('只设二维码：弹窗有二维码、没有「微信号」块；浮窗有「查看二维码」', (q.modal.includes(encodeURIComponent(qr)) || q.modal.includes(qr)) && !q.modal.includes('>微信号<') && q.floating.includes('查看二维码'))
      check('只设二维码：客服中心说「微信扫码添加」，FAQ 指向本页联系客服', q.support.includes('微信扫码添加，专属客服 1 对 1 服务') && q.faq.includes('请点本页「联系客服」扫码添加客服'))
      check('只设二维码：商品介绍不写空号码（「或加客服微信对接」）', q.intro.includes('或加客服微信对接') && !q.intro.includes('加客服微信  '))
      check('只设二维码：邮箱 / 服务时间回退主站（主站无邮箱 → 不显示；时间 9:00-22:00）', !q.modal.includes('客服邮箱') && q.modal.includes('9:00 - 22:00'))

      const w = surfaces(onlyWx)
      check('只设微信号：各处是渠道微信号，不出现主站二维码与「查看二维码」', allHtml(w).includes('露露客服') && !allHtml(w).includes('wechat-qr.jpg') && !w.floating.includes('查看二维码') && !w.modal.includes('<img'))
      check('只设微信号：客服中心说「微信搜索」', w.support.includes('微信搜索 '))

      const n = surfaces(none)
      const m = {
        modal: render(platformPub, h(ContactModal, { open: true, onClose() {} })),
        floating: opened(() => render(platformPub, h(FloatingContact))),
      }
      check('都没设：整组回退主站（弹窗、浮窗与主站渲染逐字相同）', n.modal === m.modal && n.floating === m.floating)

      // 值一律是 React 文本节点：即使绕过校验塞进恶意值，也只会被转义（纵深防御；正常路径下校验先挡）
      const evil = { wechat: '<img src=x onerror=alert(1)>', qrUrl: null, email: '"><script>alert(2)</script>', hours: '<b>9</b>' } as StoreContact
      const e = surfaces(evil)
      check('恶意值被转义：页面里不出现未转义的 <script / <img src=x', !htmlOnly(e).includes('<script>alert') && !htmlOnly(e).includes('<img src=x') && htmlOnly(e).includes('&lt;img src=x'))
    }

    // =======================================================================
    // 夹具：两个渠道（A 主测、B 做他站）、各一个 OWNER；A 另有一个 STAFF；一个超管；一个普通用户
    const tA = await createTenant('x')
    tenants.push(tA)
    const tB = await createTenant('z')
    tenants.push(tB)
    const ownerA = await createUser('p3oa', { registeredTenantId: tA.id })
    const staffA = await createUser('p3sa', { registeredTenantId: tA.id })
    const ownerB = await createUser('p3ob', { registeredTenantId: tB.id })
    const sa = await createUser('p3admin', { role: 'ADMIN' })
    const plain = await createUser('p3user')
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

    const contactRoute = await import('../../src/app/api/partner/settings/contact/route')
    const qrRoute = await import('../../src/app/api/partner/settings/contact-qr/route')
    const CPATH = '/api/partner/settings/contact'
    const QPATH = '/api/partner/settings/contact-qr'
    const allowed = selects.PARTNER_ALLOWED_KEYS
    const forbidden = selects.PARTNER_FORBIDDEN_KEYS
    const keysOk = (j: unknown) => {
      const ks = collectKeys(j).map((x) => x.key)
      return ks.every((k) => allowed.has(k) && !forbidden.has(k))
    }
    const audits = (tenantId: number, action: string) => prisma.auditEvent.findMany({ where: { tenantId, action }, orderBy: { id: 'asc' }, select: { diff: true, publicDiff: true, actorKind: true } })
    const rowOf = (id: number) => prisma.tenant.findUnique({ where: { id } })
    const fileOf = (url: string) => path.join(upload.uploadRoot(), 'contact', url.slice('/uploads/contact/'.length))

    // =======================================================================
    section('P3-3a 渠道接口：读取、保存文字信息（校验、strict、审计只记字段名）')
    {
      const g0 = await callRoute(contactRoute.GET as RouteFn, { host: tA.host, token: tokA, path: CPATH })
      check('GET：未设置时四项都是 null（不回退）', g0.status === 200 && JSON.stringify(g0.json?.data?.contact) === JSON.stringify({ supportWechat: null, supportQrUrl: null, supportEmail: null, supportHours: null }), g0.text)
      check('GET：响应键都在白名单内、无禁用键', keysOk(g0.json))
      const before = await rowOf(tA.id)

      const p1 = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body: { wechat: ' lulu_kf ', email: 'KF@Lulu-Shop.com', hours: '10:00-20:00' } })
      const c1 = p1.json?.data?.contact
      check('PUT：保存成功，微信号去空格、邮箱转小写', p1.status === 200 && c1?.supportWechat === 'lulu_kf' && c1?.supportEmail === 'kf@lulu-shop.com' && c1?.supportHours === '10:00-20:00' && c1?.supportQrUrl === null, p1.text)
      check('PUT：响应键都在白名单内', keysOk(p1.json))
      const a1 = await audits(tA.id, 'settings.contact')
      check(
        '审计 settings.contact 一条，diff = publicDiff = 只含字段名（不含值）',
        a1.length === 1 &&
          a1[0].actorKind === 'TENANT' &&
          JSON.stringify(a1[0].diff) === JSON.stringify({ changed: ['supportWechat', 'supportEmail', 'supportHours'] }) &&
          JSON.stringify(a1[0].publicDiff) === JSON.stringify(a1[0].diff) &&
          !JSON.stringify(a1[0]).includes('lulu_kf'),
        JSON.stringify(a1),
      )
      const after = await rowOf(tA.id)
      const untouched = Object.keys(before ?? {}).filter((k) => !['supportWechat', 'supportEmail', 'supportHours', 'updatedAt'].includes(k) && JSON.stringify((before as any)[k]) !== JSON.stringify((after as any)[k]))
      check('只改了客服三列（其余列逐字不变）', untouched.length === 0, untouched.join(','))

      const p2 = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body: { wechat: 'lulu_kf', email: 'kf@lulu-shop.com' } })
      check('PUT 同样的值：200 且不再写审计', p2.status === 200 && (await audits(tA.id, 'settings.contact')).length === 1)

      const bad = async (body: unknown) => (await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body })).status
      check('PUT 带 qrUrl：400（二维码地址只由服务端写入）', (await bad({ qrUrl: '/uploads/contact/x-0123.png' })) === 400)
      check('PUT 带 supportQrUrl / tenantId：400（strict）', (await bad({ supportQrUrl: '/uploads/contact/x-0123.png' })) === 400 && (await bad({ tenantId: tB.id, wechat: 'x' })) === 400)
      check('微信号：网址 / @ / 尖括号 / 超 30 字 → 400', (await bad({ wechat: 'http://evil.com' })) === 400 && (await bad({ wechat: 'a@b' })) === 400 && (await bad({ wechat: '<b>' })) === 400 && (await bad({ wechat: 'a'.repeat(31) })) === 400)
      const qq = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body: { email: '123456789@qq.com' } })
      check('邮箱：命中阿里云禁发词（长数字 QQ 邮箱）→ 400 且提示原因', qq.status === 400 && /违规|禁发|邮件服务商/.test(qq.json?.error ?? ''), qq.text)
      check('邮箱：格式错 / 超 120 字 → 400', (await bad({ email: 'not-an-email' })) === 400 && (await bad({ email: `${'a'.repeat(115)}@x.com` })) === 400)
      check('服务时间：网址 / 标签 / 超 40 字 → 400', (await bad({ hours: 'http://a' })) === 400 && (await bad({ hours: '<b>9</b>' })) === 400 && (await bad({ hours: '9'.repeat(41) })) === 400)
      const txt = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body: 'wechat=x', headers: { 'content-type': 'text/plain' } })
      check('非 JSON 请求体 → 拒绝（同源校验先挡 text/plain）', txt.status >= 400 && txt.status < 500)
      check('失败的请求都没有写库、没有写审计', (await rowOf(tA.id))?.supportWechat === 'lulu_kf' && (await audits(tA.id, 'settings.contact')).length === 1)

      // 前台店面立即生效（每请求按主键取四列）
      const sf = await resolve.resolveStorefrontForHost(tA.host)
      check('店面解析：渠道微信号 + 无二维码（成组不回退）+ 渠道邮箱 / 时间', sf?.contact.wechat === 'lulu_kf' && sf.contact.qrUrl === null && sf.contact.email === 'kf@lulu-shop.com' && sf.contact.hours === '10:00-20:00')
      check('他站（B）店面不受影响：仍整组回退主站', (await resolve.resolveStorefrontForHost(tB.host))?.contact.wechat === 'GenuineMarxist')

      // 渠道客服中心的 FAQ 结构化数据按店面生成
      const SupportLayout = (await import('../../src/app/(shop)/support/layout')).default
      const el = await withRequest({ host: tA.host }, () => SupportLayout({ children: null }))
      const html = renderToString(el as React.ReactElement)
      check('渠道客服中心 FAQPage 结构化数据：是渠道微信号，不是主站的', html.includes('FAQPage') && html.includes('请联系客服微信 lulu_kf') && !html.includes('GenuineMarxist'))
    }

    // =======================================================================
    section('P3-3b 渠道接口：二维码上传 / 更换 / 清除（multipart、先查长度、文件头、删旧图）')
    let qr1 = ''
    {
      const up = (file: { data: Buffer; type: string; name: string } | undefined, extra: { declaredLength?: number; contentType?: string; token?: string; host?: string } = {}) =>
        callMultipart(qrRoute.POST as RouteFn, { host: extra.host ?? tA.host, token: extra.token ?? tokA, path: QPATH, file, declaredLength: extra.declaredLength, contentType: extra.contentType })
      const r1 = await up({ data: PNG, type: 'image/png', name: 'qr.png' })
      qr1 = r1.json?.data?.contact?.supportQrUrl ?? ''
      if (qr1) createdFiles.push(qr1)
      check('上传 PNG：200，地址是服务端生成的 /uploads/contact/<名>.png', r1.status === 200 && contactLib.CONTACT_QR_URL_RE.test(qr1) && qr1.endsWith('.png'), JSON.stringify(r1.json))
      check('文件已落盘在 uploads/contact/ 下', !!qr1 && existsSync(fileOf(qr1)))
      check('上传响应键都在白名单内', keysOk(r1.json))
      const a = await audits(tA.id, 'settings.contact')
      check('审计：上传记一条 { changed: [supportQrUrl] }', a.length === 2 && JSON.stringify(a[1].diff) === JSON.stringify({ changed: ['supportQrUrl'] }))
      const sf = await resolve.resolveStorefrontForHost(tA.host)
      check('店面：二维码换成渠道的', sf?.contact.qrUrl === qr1)

      const r2 = await up({ data: JPG, type: 'image/jpeg', name: 'qr.jpg' })
      const qr2 = r2.json?.data?.contact?.supportQrUrl ?? ''
      if (qr2) createdFiles.push(qr2)
      check('更换为 JPG：200，新地址 .jpg，旧文件已删除', r2.status === 200 && qr2.endsWith('.jpg') && qr2 !== qr1 && existsSync(fileOf(qr2)) && !existsSync(fileOf(qr1)))

      const g = await up({ data: GIF, type: 'image/gif', name: 'a.gif' })
      const s = await up({ data: SVG, type: 'image/svg+xml', name: 'a.svg' })
      const fake = await up({ data: SVG, type: 'image/png', name: 'a.png' })
      check('GIF / SVG / 冒充 PNG 的 SVG：一律 400', g.status === 400 && s.status === 400 && fake.status === 400, `${g.status} ${s.status} ${fake.status}`)
      const big = await up({ data: Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]), type: 'image/png', name: 'big.png' })
      check('超过 2MB：413', big.status === 413, String(big.status))
      const lie = await up({ data: PNG, type: 'image/png', name: 'x.png' }, { declaredLength: 3 * 1024 * 1024 })
      check('声明的 Content-Length 超限：直接 413（不读请求体）', lie.status === 413)
      const noFile = await up(undefined)
      check('没有 file 字段：400', noFile.status === 400)
      const asJson = await callRoute(qrRoute.POST as RouteFn, { host: tA.host, token: tokA, path: QPATH, method: 'POST', body: { url: '/uploads/contact/x-0123.png' } })
      check('JSON 提交 URL：400（客户端不能提交二维码地址）', asJson.status === 400)
      check('以上失败都没有改库', (await rowOf(tA.id))?.supportQrUrl === qr2)

      const d1 = await callRoute(qrRoute.DELETE as RouteFn, { host: tA.host, token: tokA, path: QPATH, method: 'DELETE' })
      check('清除：200，库里置空，文件已删除', d1.status === 200 && d1.json?.data?.contact?.supportQrUrl === null && (await rowOf(tA.id))?.supportQrUrl === null && !existsSync(fileOf(qr2)))
      const nA = (await audits(tA.id, 'settings.contact')).length
      const d2 = await callRoute(qrRoute.DELETE as RouteFn, { host: tA.host, token: tokA, path: QPATH, method: 'DELETE' })
      check('再清除一次：200，不再写审计', d2.status === 200 && (await audits(tA.id, 'settings.contact')).length === nA)
    }

    // =======================================================================
    section('P3-3c 渠道接口：权限、他站、暂停营业')
    {
      const st = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokStaff, path: CPATH, method: 'PUT', body: { wechat: 'staff_x' } })
      const stg = await callRoute(contactRoute.GET as RouteFn, { host: tA.host, token: tokStaff, path: CPATH })
      const stq = await callMultipart(qrRoute.POST as RouteFn, { host: tA.host, token: tokStaff, path: QPATH, file: { data: PNG, type: 'image/png', name: 'q.png' } })
      check('STAFF：读 / 写 / 上传一律 404（settings.write 仅 OWNER）', st.status === 404 && stg.status === 404 && stq.status === 404, `${st.status} ${stg.status} ${stq.status}`)
      const cross = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokBonA, path: CPATH, method: 'PUT', body: { wechat: 'evil' } })
      check('B 的店主在 A 的 Host 上：拒绝（非成员）', cross.status >= 400 && (await rowOf(tA.id))?.supportWechat === 'lulu_kf')
      const bOwn = await callRoute(contactRoute.PUT as RouteFn, { host: tB.host, token: tokB, path: CPATH, method: 'PUT', body: { wechat: 'zz_kf' } })
      check('B 在自己店面改：只改 B，A 不变', bOwn.status === 200 && (await rowOf(tB.id))?.supportWechat === 'zz_kf' && (await rowOf(tA.id))?.supportWechat === 'lulu_kf')
      const onMain = await callRoute(contactRoute.PUT as RouteFn, { host: MAIN_HOST, token: tokPlain, path: CPATH, method: 'PUT', body: { wechat: 'x' } })
      check('主站 Host 上调渠道接口：404', onMain.status === 404)
      const noLogin = await callRoute(contactRoute.GET as RouteFn, { host: tA.host, path: CPATH })
      check('未登录：401', noLogin.status === 401)
      const csrf = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body: { wechat: 'csrf' }, headers: { origin: 'https://bigolab.com' } })
      check('跨站 Origin 的写请求：拒绝', csrf.status >= 400 && (await rowOf(tA.id))?.supportWechat === 'lulu_kf')

      await prisma.tenant.update({ where: { id: tA.id }, data: { status: 'SUSPENDED' } })
      const sg = await callRoute(contactRoute.GET as RouteFn, { host: tA.host, token: tokA, path: CPATH })
      const sp = await callRoute(contactRoute.PUT as RouteFn, { host: tA.host, token: tokA, path: CPATH, method: 'PUT', body: { wechat: 'suspended' } })
      const sd = await callRoute(qrRoute.DELETE as RouteFn, { host: tA.host, token: tokA, path: QPATH, method: 'DELETE' })
      check('暂停营业：可读，写 / 清除被拒（只读）', sg.status === 200 && sp.status >= 400 && sd.status >= 400 && (await rowOf(tA.id))?.supportWechat === 'lulu_kf', `${sg.status} ${sp.status} ${sd.status}`)
      await prisma.tenant.update({ where: { id: tA.id }, data: { status: 'ACTIVE' } })
    }

    // =======================================================================
    section('P3-4a 超管：/api/upload scope=contact（仅 ADMIN、2MB、不收 gif）')
    const uploadRoute = await import('../../src/app/api/upload/route')
    let adminQr = ''
    let adminQr2 = ''
    {
      const up = (token: string, file: { data: Buffer; type: string; name: string }) =>
        callMultipart(uploadRoute.POST as RouteFn, { host: MAIN_HOST, token, path: '/api/upload', file, fields: { scope: 'contact' } })
      const u1 = await up(tokSa, { data: PNG, type: 'image/png', name: 'a.png' })
      adminQr = u1.json?.data?.url ?? ''
      if (adminQr) createdFiles.push(adminQr)
      check('ADMIN 上传 PNG：返回 /uploads/contact/<名>.png', u1.status === 200 && contactLib.CONTACT_QR_URL_RE.test(adminQr), JSON.stringify(u1.json))
      const u2 = await up(tokSa, { data: JPG, type: 'image/jpeg', name: 'b.jpg' })
      adminQr2 = u2.json?.data?.url ?? ''
      if (adminQr2) createdFiles.push(adminQr2)
      check('ADMIN 上传 JPG：200', u2.status === 200 && adminQr2.endsWith('.jpg'))
      const u3 = await up(tokPlain, { data: PNG, type: 'image/png', name: 'c.png' })
      check('普通用户 scope=contact：403', u3.status === 403)
      const u4 = await up(tokSa, { data: GIF, type: 'image/gif', name: 'd.gif' })
      check('ADMIN 传 GIF：400（contact 不收 gif）', u4.status === 400)
      const u5 = await up(tokSa, { data: Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]), type: 'image/png', name: 'e.png' })
      check('ADMIN 传超过 2MB：400', u5.status === 400)
      const u6 = await up(tokSa, { data: SVG, type: 'image/png', name: 'f.png' })
      check('ADMIN 传冒充 PNG 的 SVG：400', u6.status === 400)
      const ch = await callMultipart(uploadRoute.POST as RouteFn, { host: tA.host, token: tokA, path: '/api/upload', file: { data: PNG, type: 'image/png', name: 'g.png' }, fields: { scope: 'contact' } })
      check('渠道 Host 上 /api/upload：拒绝（本模块在渠道站关闭）', ch.status >= 400)
    }

    // =======================================================================
    section('P3-4b 超管：PATCH 渠道客服信息 / GET 详情')
    {
      const tRoute = await import('../../src/app/api/admin/tenants/[id]/route')
      const patch = (id: number, body: unknown) => callRoute(tRoute.PATCH as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${id}`, method: 'PATCH', body, params: { id: String(id) } })
      const bad = ['https://evil.com/a.png', 'javascript:alert(1)', '/uploads/contact/a-0123.gif', '/uploads/contact/a-0123.svg', '/uploads/forum/a-0123.png', '/uploads/contact/../forum/x.png', '/wechat-qr.jpg']
      const badRes = await Promise.all(bad.map((u) => patch(tB.id, { supportQrUrl: u })))
      check('PATCH supportQrUrl：外站 / javascript: / gif / svg / 别的目录 / 目录穿越 / 主站二维码 → 400', badRes.every((r) => r.status === 400), badRes.map((r) => r.status).join(','))
      const qq = await patch(tB.id, { supportEmail: '12345678@qq.com' })
      check('PATCH 禁发词邮箱：400', qq.status === 400)
      const extra = await patch(tB.id, { supportWechat: 'x', unknownField: 1 })
      check('PATCH 多给未知字段：400（strict）', extra.status === 400)

      const nBefore = await prisma.auditEvent.count({ where: { tenantId: tB.id, action: 'tenant.config' } })
      const ok1 = await patch(tB.id, { supportWechat: 'zz_admin', supportQrUrl: adminQr, supportEmail: 'Help@ZZ-Shop.com', supportHours: '' })
      const rb = await rowOf(tB.id)
      check('PATCH 合法值：200，库里是归一后的值（邮箱小写、空串 = 清空）', ok1.status === 200 && rb?.supportWechat === 'zz_admin' && rb.supportQrUrl === adminQr && rb.supportEmail === 'help@zz-shop.com' && rb.supportHours === null, ok1.text)
      const au = await prisma.auditEvent.findMany({ where: { tenantId: tB.id, action: 'tenant.config' }, orderBy: { id: 'desc' }, take: 1, select: { diff: true, publicDiff: true, actorKind: true } })
      const pub = au[0]?.publicDiff as Record<string, unknown> | null
      check(
        '审计 tenant.config：超管 diff 有新旧值；渠道可见 publicDiff 只有 contactFields（字段名）',
        (await prisma.auditEvent.count({ where: { tenantId: tB.id, action: 'tenant.config' } })) === nBefore + 1 &&
          au[0]?.actorKind === 'PLATFORM' &&
          JSON.stringify(au[0]?.diff).includes('zz_admin') &&
          !!pub &&
          JSON.stringify(Object.keys(pub)) === JSON.stringify(['contactFields']) &&
          JSON.stringify(pub.contactFields) === JSON.stringify(['supportWechat', 'supportQrUrl', 'supportEmail']) &&
          !JSON.stringify(pub).includes('zz_admin'),
        JSON.stringify(au[0]),
      )

      const taken = await patch(tA.id, { supportQrUrl: adminQr })
      check('PATCH 别的渠道正在用的二维码：400「已被其他渠道使用」', taken.status === 400 && /其他渠道/.test(taken.json?.error ?? ''), taken.text)

      const swap = await patch(tB.id, { supportQrUrl: adminQr2 })
      check('PATCH 换二维码：旧文件删除、新文件保留', swap.status === 200 && !existsSync(fileOf(adminQr)) && existsSync(fileOf(adminQr2)))
      const clr = await patch(tB.id, { supportQrUrl: null })
      check('PATCH 清除二维码：库里置空、文件删除', clr.status === 200 && (await rowOf(tB.id))?.supportQrUrl === null && !existsSync(fileOf(adminQr2)))

      const sf = await resolve.resolveStorefrontForHost(tB.host)
      check('B 店面：微信号 zz_admin（无二维码）、邮箱 help@zz-shop.com、时间回退主站', sf?.contact.wechat === 'zz_admin' && sf.contact.qrUrl === null && sf.contact.email === 'help@zz-shop.com' && sf.contact.hours === '9:00-22:00')

      await prisma.tenant.update({ where: { id: tB.id }, data: { noticeEmail: 'owner.box@example.com', noticeEmailOn: true, noticeWecomOn: false } })
      const g = await callRoute(tRoute.GET as unknown as RouteFn, { host: MAIN_HOST, token: tokSa, path: `/api/admin/tenants/${tB.id}`, params: { id: String(tB.id) } })
      const t = g.json?.data?.tenant
      check(
        'GET 详情：推送方式只读字段（企业微信已配置 / 已开、邮箱已开 + 掩码地址）',
        g.status === 200 && t?.hasWebhook === false && t?.noticeWecomOn === false && t?.noticeEmailOn === true && t?.noticeEmailMasked === 'ow***@example.com',
        JSON.stringify(t ?? g.text).slice(0, 400),
      )
      check('GET 详情：不回显通知邮箱原文', !g.text.includes('owner.box@example.com'))
      check('GET 详情：客服原值（不回退）', t?.supportWechat === 'zz_admin' && t?.supportQrUrl === null && t?.supportEmail === 'help@zz-shop.com' && t?.supportHours === null)
      const deny = await callRoute(tRoute.PATCH as unknown as RouteFn, { host: MAIN_HOST, token: tokPlain, path: `/api/admin/tenants/${tB.id}`, method: 'PATCH', body: { supportWechat: 'x' }, params: { id: String(tB.id) } })
      check('非超管 PATCH：拒绝，库里不变', deny.status >= 400 && (await rowOf(tB.id))?.supportWechat === 'zz_admin')
    }
  } finally {
    // 只删本脚本建的数据与文件（不调 cleanupAll，理由见文件头）
    if (baseMade) {
      try {
        rmSync(path.join(ROOT, BASE_DIR_REL), { recursive: true, force: true })
      } catch {
        /* 忽略 */
      }
    }
    for (const t of tenants) {
      const tq = await prisma.tenant.findUnique({ where: { id: t.id }, select: { supportQrUrl: true } })
      if (tq?.supportQrUrl) createdFiles.push(tq.supportQrUrl)
    }
    for (const u of createdFiles) await upload.deleteContactUpload(u).catch(() => false)
    const tIds = tenants.map((t) => t.id)
    const uIds = users.map((u) => u.id)
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
