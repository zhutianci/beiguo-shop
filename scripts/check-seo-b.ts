/**
 * SEO 重构 · B 包检查：公告改底部提示条、首帧可见、站标 WebP、framer-motion 移出全站外壳（成交弹窗除外）
 * （docs/SEO-重构/SEO-重构设计.md §6.6 第 1–5 项、§8.2 B 包验收）。
 *
 * 【成交弹窗保留（站长 2026-09-30 决定，2026-10-06 rebase 时改写本脚本）】§6.6-1「下线假成交弹窗」不做：
 * live-order-notification.tsx 与 /api/orders/recent 与 origin/main 逐字相同（含 city、示例订单）。
 * 原来断言「grep 不到 FAKE_CITIES / 恒返回 null / 接口无 city」的几条改成「弹窗仍在、服务端首帧为空」；
 * 弹窗仍引用 framer-motion，所以外壳闭包里 framer-motion 只允许经它进入（其余外壳组件仍必须不引用），
 * --base 模式「落地页加载的 JS 里没有 framer-motion」降为告警。
 * 2026-10-07（性能优化）起外壳经 live-order-notification-lazy.tsx 用 next/dynamic（ssr:false）按需加载弹窗：
 * 组件本体仍逐字不改，framer-motion 成了水合后才取的单独 chunk，--base 的这条恢复为判失败。
 *
 *   npx tsx scripts/check-seo-b.ts                              # 只跑进程内检查（不连库、不起服务）
 *   npx tsx scripts/check-seo-b.ts --base http://localhost:3200 # 再抓一遍服务端 HTML 与页面加载的 JS（next dev / next start 都行）
 *   npx tsx scripts/check-seo-b.ts --base https://bigolab.com   # 上线后对线上只读抓取（只 GET，不登录）
 *
 * 进程内（不连库）：
 *  1. 成交弹窗保留：组件本体与 /api/orders/recent 仍在；接口仍不 select createdAt
 *  2. LiveOrderNotification 服务端首帧为空（弹窗水合后才出现，不进首帧、不是 LCP）；渠道站不渲染
 *  3. 从 (shop)/layout.tsx 与根 layout.tsx 出发沿 import 走一遍：全站外壳（页头、页脚、客服浮窗与弹窗、公告…）
 *     的依赖闭包里，framer-motion 只经成交弹窗进入，且外壳只能按需加载它。--base 模式再看实际加载的 JS
 *  4. 页头、页脚、首页、客服浮窗 / 弹窗的服务端渲染：没有 opacity:0 / translateY(-100…) 的首帧隐藏（aria-hidden 的装饰元素除外）；
 *     站标是 WebP 且 loading="lazy"（React 不再 preload）；页头 Logo 链接与移动端菜单按钮有可读名称
 *  5. 公告：首访不弹全屏（弹层只能由「查看详情」打开）、沿用 announce_seen_<id>、/jiema/* 让位；渠道站渲染为空
 *  6. public/logo-mark.webp（80x80）、public/logo-full.webp（261x256）存在且体积在预算内
 *
 * --base 模式（抓首包 HTML，不执行 JS）：
 *  · 每页 <head> 里没有站标的 image preload；页头页脚站标是 WebP；没有 translateY(-100…)
 *  · 首页服务端 HTML 没有带内容的 opacity:0（FIRST_FRAME_STRICT）；/support、/iptools、/links 还没改，只告警并写明归属的包（FIRST_FRAME_PENDING）
 *  · 大事记详情页的微信缩略图：object-cover + fetchpriority=low，且不被 preload
 *  · /api/orders/recent 的每一项都没有 createdAt（city 随成交弹窗保留）
 *  · 落地页、大事记页首屏加载的 JS 里没有 framer-motion（成交弹窗按需加载）；首页必须能查到——阳性对照
 *
 * 退出码：有任何失败 → 1。
 */
import fs from 'node:fs'
import path from 'node:path'
import React from 'react'

// 仓库 tsconfig 是 jsx: preserve，tsx 按经典运行时编译 JSX（React.createElement），被渲染的组件需要全局 React（同 itest-tenant/wp1.ts）
;(globalThis as unknown as { React: typeof React }).React = React

const ROOT = path.resolve(__dirname, '..')
const argv = process.argv.slice(2)
const baseIdx = argv.indexOf('--base')
const BASE = baseIdx >= 0 ? String(argv[baseIdx + 1] || '').replace(/\/+$/, '') : ''
const UA = 'Mozilla/5.0 (compatible; BigoLabSeoLint/1.0; +https://bigolab.com)'

let pass = 0
let fail = 0
let warn = 0
function ok(cond: boolean, name: string, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function note(name: string, extra = '') {
  warn++
  console.log(`  ⚠ ${name}${extra ? ` —— ${extra}` : ''}`)
}
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

// ----------------------------------------------------------------------------
// HTML 小工具：找出「首帧被隐藏的、带内容的元素」
// ----------------------------------------------------------------------------
/** 服务端 HTML 里 style 含 opacity:0 的开始标签（aria-hidden 的装饰元素除外，例如首页鼠标光晕） */
function hiddenFirstFrame(html: string): string[] {
  const out: string[] = []
  const re = /<([a-zA-Z][\w-]*)\b([^>]*?)\sstyle="([^"]*)"([^>]*)>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const style = m[3].replace(/\s+/g, '')
    const attrs = `${m[2]} ${m[4]}`
    if (!/(^|;)opacity:0(\.0+)?(;|$)/.test(style)) continue
    if (/aria-hidden="true"/.test(attrs)) continue
    out.push(`<${m[1]} style="${m[3]}">`)
  }
  return out
}
const offscreenHeader = (html: string) => /translateY\(-100/.test(html)
const imagePreloads = (html: string): string[] => [
  ...(html.match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*>/g) || []),
  ...(html.match(/<link[^>]*as="image"[^>]*rel="preload"[^>]*>/g) || []),
]

// 阳性 / 阴性对照：判据写错会静默变成「永远零命中」
{
  console.log('\n【对照：首帧隐藏判据】')
  ok(hiddenFirstFrame('<h1 class="x" style="opacity:0;transform:translateY(40px)">标题</h1>').length === 1, '阳性：framer 的 opacity:0 会被抓到')
  ok(hiddenFirstFrame('<div style="opacity:0">x</div>').length === 1, '阳性：只有 opacity:0 也会被抓到')
  ok(hiddenFirstFrame('<div aria-hidden="true" class="fixed" style="left:-1000px;opacity:0;transition:opacity 0.4s">').length === 0, '阴性：aria-hidden 的装饰光晕不算')
  ok(hiddenFirstFrame('<h1 style="opacity:1;transform:none">标题</h1>').length === 0, '阴性：opacity:1 不算')
  ok(hiddenFirstFrame('<p style="opacity:0.5">x</p>').length === 0, '阴性：半透明不算')
  ok(offscreenHeader('<header style="transform:translateY(-100px)">') && !offscreenHeader('<header class="fixed">'), '页头移出屏幕判据')
  ok(imagePreloads('<link rel="preload" as="image" href="/logo-full.png?v=3"/>').length === 1, '图片 preload 判据')
}

// ----------------------------------------------------------------------------
// 1. 假成交数据：源码级
// ----------------------------------------------------------------------------
function walkFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walkFiles(p, out)
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) out.push(p)
  }
  return out
}
{
  console.log('\n【1. 成交弹窗保留（站长 2026-09-30 决定，§6.6-1 不做）】')
  // 只核对「还在」，不核对逐字内容：与 origin/main 逐字相同由部署说明里的 git diff 保证
  const hits: string[] = []
  for (const f of walkFiles(path.join(ROOT, 'src'))) {
    const s = fs.readFileSync(f, 'utf8')
    if (s.includes('LiveOrderNotificationInner')) hits.push(path.relative(ROOT, f).replace(/\\/g, '/'))
  }
  ok(hits.includes('src/components/live-order-notification.tsx'), '成交弹窗组件本体 LiveOrderNotificationInner 仍在', hits.join('; '))
  ok(read('src/components/live-order-notification.tsx').includes("fetch('/api/orders/recent')"), '成交弹窗仍从 /api/orders/recent 取数')
  const route = read('src/app/api/orders/recent/route.ts').replace(/\/\/.*$/gm, '')
  ok(/\bcity\b/.test(route), '/api/orders/recent 仍下发 city（弹窗显示城市，未改动）')
  ok(!/createdAt\s*:/.test(route.split('select:')[1] || ''), '/api/orders/recent 仍不 select createdAt（itest-security 的断言）')
}

// ----------------------------------------------------------------------------
// 3. 全站外壳的 import 闭包里没有 framer-motion
// ----------------------------------------------------------------------------
function resolveSpec(fromFile: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(ROOT, 'src', spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else return null
  for (const ext of ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx', '/index.js']) {
    const p = base + ext
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  }
  return null
}
function importClosure(entries: string[]): { files: Map<string, string | null>; bare: Map<string, string[]> } {
  const files = new Map<string, string | null>() // 文件 → 是谁引入的
  const bare = new Map<string, string[]>() // 裸模块 → 引入它的文件
  const queue: [string, string | null][] = entries.map((e) => [path.join(ROOT, e), null])
  while (queue.length) {
    const [f, parent] = queue.shift()!
    if (files.has(f)) continue
    files.set(f, parent)
    const src = fs.readFileSync(f, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
    const re = /(?:\bimport\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?|\bexport\s+[^'"]*?\sfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])([^'"]+)\1/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      if (/^\s*import\s+type\b/.test(src.slice(m.index, m.index + 12))) continue // 纯类型导入不进包
      const spec = m[2]
      const r = resolveSpec(f, spec)
      if (r) queue.push([r, f])
      else if (!spec.startsWith('.') && !spec.startsWith('@/')) {
        const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
        if (!bare.has(name)) bare.set(name, [])
        bare.get(name)!.push(f)
      }
    }
  }
  return { files, bare }
}
function chainOf(files: Map<string, string | null>, f: string): string {
  const chain: string[] = []
  let cur: string | null = f
  while (cur) {
    chain.unshift(path.relative(ROOT, cur).replace(/\\/g, '/'))
    cur = files.get(cur) ?? null
  }
  return chain.join(' → ')
}
{
  console.log('\n【3. framer-motion 移出全站外壳（§6.6-5）】')
  const { files, bare } = importClosure(['src/app/(shop)/layout.tsx', 'src/app/layout.tsx'])
  const shell = ['src/components/layout/header.tsx', 'src/components/layout/footer.tsx', 'src/components/floating-contact.tsx', 'src/components/contact-modal.tsx', 'src/components/announcement-modal.tsx', 'src/components/live-order-notification.tsx']
  const missing = shell.filter((s) => !files.has(path.join(ROOT, s)))
  ok(missing.length === 0, `依赖闭包覆盖了外壳的 ${shell.length} 个组件（共 ${files.size} 个文件）`, `没走到：${missing.join(', ')}`)
  const fm = [...(bare.get('framer-motion') || []), ...(bare.get('motion') || [])]
  // 成交弹窗保留（站长 2026-09-30 决定）：它仍引用 framer-motion，是外壳里唯一允许的来源
  const FM_ALLOWED = new Set(['src/components/live-order-notification.tsx'])
  const fmOther = fm.filter((f) => !FM_ALLOWED.has(path.relative(ROOT, f).replace(/\\/g, '/')))
  ok(fmOther.length === 0, '外壳（(shop)/layout 与根 layout）的依赖闭包里，framer-motion 只经成交弹窗进入', fmOther.map((f) => chainOf(files, f)).join(' ｜ '))
  // 2026-10-07 起成交弹窗由 live-order-notification-lazy.tsx 用 next/dynamic（ssr:false）按需加载：组件本体不变，
  // 但 framer-motion 成了单独的 chunk，不再进外壳的首屏 JS。下面两条守住「外壳只能按需加载它」
  const layoutSrc = read('src/app/(shop)/layout.tsx')
  ok(!/from\s+['"]@\/components\/live-order-notification['"]/.test(layoutSrc) && layoutSrc.includes("from '@/components/live-order-notification-lazy'"), '(shop)/layout 不再静态引用成交弹窗，经按需加载的那一层挂载')
  const lazySrc = read('src/components/live-order-notification-lazy.tsx')
  ok(/dynamic\(\s*\(\)\s*=>\s*import\('@\/components\/live-order-notification'\)/.test(lazySrc) && /ssr:\s*false/.test(lazySrc) && !/^import[^\n]*live-order-notification'/m.test(lazySrc), '成交弹窗按需加载：next/dynamic + ssr:false，没有静态 import')
  if (fm.length > fmOther.length) note('成交弹窗（保留）仍引用 framer-motion，但它是按需加载的单独 chunk（水合后才取），不进外壳首屏 JS')
  for (const f of ['src/components/layout/header.tsx', 'src/components/layout/footer.tsx', 'src/components/floating-contact.tsx', 'src/components/contact-modal.tsx', 'src/components/announcement-modal.tsx'])
    ok(!read(f).includes("from 'framer-motion'"), `${f} 不再引用 framer-motion`)
  // 阳性对照：同一个遍历器从首页组件出发必须能找到 framer-motion（home-client 自己在用），否则说明 import 解析失效
  const home = importClosure(['src/app/(shop)/home-client.tsx'])
  ok((home.bare.get('framer-motion') || []).length > 0, '阳性对照：从 home-client.tsx 出发能找到 framer-motion（遍历器有效）')
}

// ----------------------------------------------------------------------------
// 6. 站标 WebP
// ----------------------------------------------------------------------------
function webpSize(buf: Buffer): { w: number; h: number; kind: string } | null {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null
  const kind = buf.toString('ascii', 12, 16)
  if (kind === 'VP8X') return { kind, w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
  if (kind === 'VP8 ') return { kind, w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21)
    return { kind, w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }
  }
  return null
}
{
  console.log('\n【6. 站标 WebP（§6.6-4）】')
  for (const [file, w, h, maxKb] of [['public/logo-mark.webp', 80, 80, 8], ['public/logo-full.webp', 261, 256, 40]] as const) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) {
      ok(false, `${file} 存在`, '缺文件：跑 python scripts/gen-brand-assets.py')
      continue
    }
    const buf = fs.readFileSync(p)
    const sz = webpSize(buf)
    ok(!!sz && sz.w === w && sz.h === h, `${file} 是 ${w}x${h} 的 WebP`, JSON.stringify(sz))
    ok(buf.length <= maxKb * 1024, `${file} ≤ ${maxKb}KB（实际 ${(buf.length / 1024).toFixed(1)}KB）`)
  }
  const gen = read('scripts/gen-brand-assets.py')
  ok(gen.includes("'logo-mark.webp'") && gen.includes("'logo-full.webp'"), 'gen-brand-assets.py 负责生成这两张 WebP（换 logo 时重跑即可）')
}

// ----------------------------------------------------------------------------
// 2、4、5：服务端渲染（与 itest-tenant/wp1.ts 的 W1-9 同一套渲染环境）
// ----------------------------------------------------------------------------
async function ssrChecks() {
  const { renderToString } = await import('react-dom/server')
  const { StorefrontProvider } = await import('../src/components/storefront-provider')
  const { storefrontFeatures } = await import('../src/lib/storefront/public')
  const { PLATFORM_CONTACT } = await import('../src/lib/contact-base')
  const { PLATFORM_BRAND } = await import('../src/lib/brand-base')
  const { PathnameContext } = await import('next/dist/shared/lib/hooks-client-context.shared-runtime')
  const { AppRouterContext } = await import('next/dist/shared/lib/app-router-context.shared-runtime')
  const { Header } = await import('../src/components/layout/header')
  const { Footer } = await import('../src/components/layout/footer')
  const { FloatingContact } = await import('../src/components/floating-contact')
  const { ContactModal } = await import('../src/components/contact-modal')
  const { LiveOrderNotification } = await import('../src/components/live-order-notification')
  const { AnnouncementModal, hideAnnouncementBarOn, ANNOUNCE_BAR_VAR } = await import('../src/components/announcement-modal')
  const HomeClient = (await import('../src/app/(shop)/home-client')).default
  const h = React.createElement
  const platform = { code: 'main', kind: 'PLATFORM' as const, origin: 'https://bigolab.com', features: storefrontFeatures({ kind: 'PLATFORM' }), contact: { ...PLATFORM_CONTACT }, brand: { ...PLATFORM_BRAND } }
  const channel = { code: 'itl', kind: 'CHANNEL' as const, origin: 'https://itl.bigolab.com', features: storefrontFeatures({ kind: 'CHANNEL' }), contact: { ...PLATFORM_CONTACT }, brand: { ...PLATFORM_BRAND } }
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} }
  const render = (sf: typeof platform | typeof channel, el: React.ReactElement, pathname = '/') =>
    renderToString(h(StorefrontProvider, { value: sf, children: h(AppRouterContext.Provider, { value: router as never }, h(PathnameContext.Provider, { value: pathname }, el)) }))

  console.log('\n【2. 左下角成交弹窗：服务端首帧为空（保留，§6.6-1 不做）】')
  ok(render(platform, h(LiveOrderNotification)) === '', '主站：服务端渲染为空（弹窗水合后几秒才出现，不进首帧、不会成为 LCP）')
  ok(render(channel, h(LiveOrderNotification)) === '', '渠道站：不渲染（features.liveOrders 关，行为与 main 相同）')

  console.log('\n【4. 首帧可见、站标、可读名称（§6.6-3、§6.6-4、§1.9）】')
  const header = render(platform, h(Header))
  ok(!offscreenHeader(header) && hiddenFirstFrame(header).length === 0, '页头服务端 HTML：没有 translateY(-100…)、没有 opacity:0', hiddenFirstFrame(header).join(' '))
  ok(/<header\b(?![^>]*\sstyle=)/.test(header), '<header> 本身不带内联 style（首帧就在原位）')
  ok(/<a [^>]*aria-label="贝果科技首页"[^>]*href="\/"|<a [^>]*href="\/"[^>]*aria-label="贝果科技首页"/.test(header), '页头 Logo 链接 aria-label="贝果科技首页"（主站；渠道改名后按站名出）')
  ok(/<button [^>]*aria-label="打开菜单"/.test(header), '移动端菜单按钮有可读名称')
  ok(/<img [^>]*src="\/logo-mark\.webp[^"]*"[^>]*loading="lazy"/.test(header) && !header.includes('logo-mark.png'), '页头站标：logo-mark.webp + loading="lazy"（不再 preload 256px PNG）')
  ok(!header.includes('navbar-indicator'), '导航高亮不再用 framer 的 layoutId')
  const footer = render(platform, h(Footer))
  ok(/<img [^>]*src="\/logo-full\.webp[^"]*"[^>]*width="261"[^>]*height="256"[^>]*loading="lazy"/.test(footer) && !footer.includes('logo-full.png'), '页脚站标：logo-full.webp（261x256）+ loading="lazy"（head 里不再 preload 640px PNG）')
  const home = render(platform, h(HomeClient, { stats: { totalSales: 12, skuCount: 3 }, featured: [] }))
  const homeHidden = hiddenFirstFrame(home)
  ok(homeHidden.length === 0, '首页服务端 HTML：没有带内容的 opacity:0（hero 徽标、H1、副标题、按钮、查询框、卖点）', homeHidden.slice(0, 3).join(' '))
  ok(/<h1 [^>]*style="opacity:1;transform:none"|<h1 (?![^>]*style=)/.test(home), '首页 H1 首帧就是最终状态')
  // B 包评审修复：hero 垂直居中，打字机换句时副标题在手机上 1↔2 行变化，会把 H1 等整块上下推约 13px（真实用户 CLS）。
  // 现在那一行按「前缀 + 最长短语」占位（::before + data-reserve），这里核对占位用的确实是最长那句
  const heroSrc = read('src/app/(shop)/home-client.tsx')
  const heroArr = heroSrc.match(/const HERO_TYPEWRITER = \[([^\]]*)\]/)
  const heroLead = (heroSrc.match(/const HERO_LEAD = '([^']*)'/) || [])[1] || ''
  const phrases = heroArr ? Array.from(heroArr[1].matchAll(/'([^']*)'/g)).map((m) => m[1]) : []
  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), '')
  ok(phrases.length >= 2 && !!heroLead && home.includes(`data-reserve="${heroLead}${longest}"`), `首页 hero 打字机一行按最长短语「${longest}」占位（换句时 H1 不再上下跳）`)
  ok(/<span class="grid [^"]*before:content-\[attr\(data-reserve\)\]/.test(home) && !/data-reserve="[^"]*"[^>]*>(?:(?!<\/p>)[\s\S])*?<br\/?>/.test(home.split('<h1')[1] || ''), '占位副本走 ::before + 属性（不进正文文本），下一行不再靠 <br> 换行')
  ok(phrases.length > 0 && phrases.filter((t) => /开票|发票/.test(t)).every((t) => /6\s*%/.test(t)), '打字机里写到开票的短语带 6%（设计 §9.2-3）', phrases.join(' / '))
  const floating = render(platform, h(FloatingContact))
  ok(hiddenFirstFrame(floating).length === 0 && !/transform:scale\(0\)/.test(floating), '右下角客服：服务端 HTML 没有 opacity:0 / scale(0)')
  ok(floating.includes(`var(${ANNOUNCE_BAR_VAR}, 0px)`), `右下角客服的底边距跟随 ${ANNOUNCE_BAR_VAR}（公告提示条出现时上抬）`)
  ok(render(platform, h(FloatingContact), '/jiema') === '', '右下角客服在 /jiema 仍然让位（行为不变）')
  const modal = render(platform, h(ContactModal, { open: true, onClose() {} }))
  ok(modal.includes('GenuineMarxist') && hiddenFirstFrame(modal).length === 0, '客服弹窗（打开）：内容照常、没有内联 opacity:0')
  ok(render(platform, h(ContactModal, { open: false, onClose() {} })) === '', '客服弹窗（关闭）：渲染为空')

  console.log('\n【5. 公告：底部提示条（§6.6-2）】')
  ok(render(platform, h(AnnouncementModal)) === '', '主站：服务端不渲染任何公告（客户端拉到数据后才出现提示条，不会成为首帧 LCP）')
  ok(render(channel, h(AnnouncementModal)) === '', '渠道站：服务端同样渲染为空（10-05 起渠道站也挂，客户端只拉本渠道公告）')
  ok(hideAnnouncementBarOn('/jiema') && hideAnnouncementBarOn('/jiema/order/X') && hideAnnouncementBarOn('/jiema/records'), '/jiema/* 让位给下单确认条')
  ok(!hideAnnouncementBarOn('/') && !hideAnnouncementBarOn('/jiemax') && !hideAnnouncementBarOn('/wallet') && !hideAnnouncementBarOn('/chongzhi/chatgpt-plus') && !hideAnnouncementBarOn(null), '其他页面照常显示（含 /wallet、/jiemax 这类前缀相近的路径）')
  const src = read('src/components/announcement-modal.tsx')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  const opens = code.match(/setDetailOpen\(true\)/g) || []
  ok(opens.length === 1 && /onClick=\{\(\) => setDetailOpen\(true\)\}/.test(code), '全文弹层只能由「查看详情」按钮打开（首访、强提醒都不自动全屏弹）')
  ok(/if \(a\.pinned \|\| !hasSeen\(a\)\) setBarOpen\(true\)/.test(code), '出现条件不变：强提醒每次进站都提示，普通公告读过（updatedAt 相同）不再提示')
  ok(code.includes('announce_seen_') && /if \(data && !data\.pinned\) markSeen\(data\)/.test(code), '关闭即已读：沿用 announce_seen_<id> 键，强提醒不记已读')
  ok(/fixed inset-x-0 bottom-0/.test(code) && !/fixed inset-x-0 top-0/.test(code), '提示条固定在页面底部（不压页头、不把内容往下推）')
  ok(!code.includes("from 'framer-motion'"), '公告组件不再引用 framer-motion')
}

// ----------------------------------------------------------------------------
// --base：抓服务端 HTML 与页面实际加载的 JS
// ----------------------------------------------------------------------------
async function get(url: string): Promise<{ status: number; text: string }> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 180_000)
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, signal: ctl.signal, redirect: 'follow' })
    return { status: r.status, text: await r.text() }
  } finally {
    clearTimeout(t)
  }
}
/** 页面引用的 JS（<script src> 与 RSC 里带出的 chunk 路径），查里面有没有 framer-motion */
async function framerIn(html: string): Promise<{ hits: string[]; total: number }> {
  const srcs = new Set<string>()
  let m: RegExpExecArray | null
  const reScript = /<script[^>]+src="([^"]+\.js[^"]*)"/g
  while ((m = reScript.exec(html))) srcs.add(m[1])
  const reChunk = /(\/_next\/static\/chunks\/[\w\-./%()[\]@]+?\.js)/g
  while ((m = reChunk.exec(html))) srcs.add(m[1].replace(/\\/g, ''))
  const hits: string[] = []
  for (const s of Array.from(srcs)) {
    const u = s.startsWith('http') ? s : BASE + (s.startsWith('/') ? s : `/${s}`)
    let text = ''
    try {
      text = (await get(u)).text
    } catch {
      continue
    }
    // 开发模式：模块路径原样留在 chunk 里；生产模式：路径被压成数字，用 motion-dom 里的字面量 "framerAppearId" 认它
    if (/node_modules[\\/](framer-motion|motion-dom)[\\/]/.test(text) || text.includes('framerAppearId')) hits.push(s.replace(/^.*\/_next\//, ''))
  }
  return { hits, total: srcs.size }
}
/**
 * 首帧可见（服务端 HTML 里没有带内容的 opacity:0）：
 *  · FIRST_FRAME_STRICT：已经改好的页，有就算失败；
 *  · FIRST_FRAME_PENDING：还没改、已排进施工包的页，只告警并写明归属（B 包评审遗留：这三页 index,follow，
 *    /support 的 H1 本身就包在 opacity:0 里，违反设计 §3.1「H1 服务端直出、首帧可见」）。
 *    负责的包改完后把页面从 PENDING 挪进 STRICT（设计 §8.2 C 包「首帧可见补齐」）。
 */
const FIRST_FRAME_STRICT = ['/']
const FIRST_FRAME_PENDING: Record<string, string> = { '/support': 'C', '/iptools': 'C', '/links': 'C' }

async function htmlChecks() {
  console.log(`\n【--base ${BASE}：服务端 HTML】`)
  const pages = ['/', '/chongzhi', '/chongzhi/chatgpt-plus', '/products', '/news', '/support', '/iptools', '/links', '/about']
  const newsList = await get(`${BASE}/news`)
  const slug = (newsList.text.match(/href="(\/news\/\d{4}-\d{2}-\d{2}-[0-9a-z]+)"/) || [])[1]
  if (slug) pages.push(slug)
  else note('/news 上没找到大事记详情链接，详情页相关检查跳过（本地库没有大事记数据时正常）')
  const htmlOf = new Map<string, string>()
  for (const p of pages) {
    const r = await get(BASE + p)
    htmlOf.set(p, r.text)
    const html = r.text
    const pre = imagePreloads(html).filter((l) => /logo-|news-og|og-default/.test(l))
    ok(r.status === 200, `${p}：200`, String(r.status))
    ok(pre.length === 0, `${p}：<head> 里没有站标 / 分类图的 image preload`, pre.join(' '))
    ok(/<img [^>]*src="\/logo-mark\.webp/.test(html) && /<img [^>]*src="\/logo-full\.webp/.test(html) && !/src="\/logo-(mark|full)\.png/.test(html), `${p}：页头页脚站标是 WebP`)
    ok(!offscreenHeader(html), `${p}：没有 translateY(-100…)（页头首帧在原位）`)
    const hidden = hiddenFirstFrame(html)
    if (FIRST_FRAME_STRICT.includes(p)) ok(hidden.length === 0, `${p}：服务端 HTML 没有带内容的 opacity:0`, hidden.slice(0, 3).join(' '))
    else if (hidden.length && FIRST_FRAME_PENDING[p]) note(`${p}：还有 ${hidden.length} 处 opacity:0 的入场动效（待 ${FIRST_FRAME_PENDING[p]} 包改，改完挪进 FIRST_FRAME_STRICT）`, hidden[0])
    else if (hidden.length) note(`${p}：还有 ${hidden.length} 处 opacity:0 的入场动效（未排进任何包，请记进设计 §6.6-3）`, hidden[0])
    if (p.startsWith('/news/')) {
      ok(/<img [^>]*class="news-wx-thumb object-cover"/.test(html) && /<img [^>]*fetch[pP]riority="low"[^>]*class="news-wx-thumb/.test(html), `${p}：微信缩略图 object-cover + fetchpriority=low`)
    }
  }

  console.log(`\n【--base ${BASE}：/api/orders/recent】`)
  const rc = await get(`${BASE}/api/orders/recent`)
  let list: Record<string, unknown>[] = []
  try {
    list = JSON.parse(rc.text)?.data || []
  } catch {
    /* 下面判失败 */
  }
  ok(rc.status === 200 && Array.isArray(list), '/api/orders/recent 返回 200 + 数组', `${rc.status} ${rc.text.slice(0, 120)}`)
  ok(list.every((x) => !('createdAt' in x)), `每一项都没有 createdAt（共 ${list.length} 项；city 随成交弹窗保留）`, JSON.stringify(list[0]))
  if (list.length === 0) note('本地库没有已付款的普通订单，/api/orders/recent 为空数组：字段检查是空集，以源码检查为准')

  console.log(`\n【--base ${BASE}：页面加载的 JS 里有没有 framer-motion】`)
  const pos = await framerIn(htmlOf.get('/') || '')
  ok(pos.hits.length > 0, `阳性对照：首页（home-client 自己用 framer-motion）能查到（${pos.hits.join(', ') || '无'}）`, '查不到说明判据失效，下面的「没有」不可信')
  for (const p of ['/chongzhi/chatgpt-plus', '/news', ...(slug ? [slug] : [])]) {
    const r = await framerIn(htmlOf.get(p) || '')
    ok(r.total > 0, `${p}：抓到页面加载的 JS（${r.total} 个）`)
    // 2026-10-07 起成交弹窗按需加载（live-order-notification-lazy.tsx），framer-motion 不再进外壳的首屏 JS：判失败而不是告警
    ok(r.hits.length === 0, `${p}：首屏加载的 JS 里没有 framer-motion（成交弹窗按需加载，水合后才取）`, r.hits.join(', '))
  }
}

async function main() {
  await ssrChecks()
  if (BASE) await htmlChecks()
  console.log(`\n${fail === 0 ? '✅' : '❌'} check-seo-b：通过 ${pass}，失败 ${fail}${warn ? `，告警 ${warn}` : ''}${BASE ? '' : '（未带 --base，只跑了进程内检查）'}`)
  process.exit(fail === 0 ? 0 : 1)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
