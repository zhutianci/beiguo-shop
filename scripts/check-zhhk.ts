/**
 * 繁体香港版自测（docs/繁体香港版/设计.md §9）：npx tsx scripts/check-zhhk.ts
 *
 * 覆盖：
 *  1. 词典与转换器：每一条字节数相等（RSC 流的长度前缀靠它）；流式转换 ≡ 整段转换；覆盖表与审校修正生效；
 *  2. 路径规则：zhhk/proxy.cjs 的 isPagePath 与 src/lib/i18n/lang.ts 的 isLocalizablePath 逐条一致（两份实现不能漂移）；
 *  3. 访客识别：浏览器语言优先于 IP，没有中文信号不跳；
 *  4. 站点地图：简繁两条互指、收录范围外不写 hreflang；
 *  5. 繁体页 <head>：canonical 补前缀、香港版标题、名单外 noindex、可收录页 hreflang 自指 + 互指。
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import {
  detectPreferredLang,
  isCrawler,
  isLocalizablePath,
  localizePath,
  stripHkPrefix,
  switchHref,
} from '../src/lib/i18n/lang'
import { DEFAULT_PLATFORM_HOSTS } from '../src/lib/storefront/hosts'

const require_ = createRequire(__filename)
const ROOT = path.resolve(__dirname, '..')
const { loadDefault, buildConverter } = require_(path.join(ROOT, 'zhhk', 'convert.cjs'))
const proxyMod = require_(path.join(ROOT, 'zhhk', 'proxy.cjs'))

let fail = 0
let pass = 0
function eq(name: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++
  else {
    fail++
    console.error(`✗ ${name}\n    得到 ${JSON.stringify(got)}\n    期望 ${JSON.stringify(want)}`)
  }
}

// ---------------------------------------------------------------------------
// 1. 词典与转换器
// ---------------------------------------------------------------------------
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'zhhk', 'dict.json'), 'utf8'))
let badBytes = 0
for (const [k, v] of [...dict.chars, ...dict.phrases]) if (Buffer.byteLength(k) !== Buffer.byteLength(v)) badBytes++
eq('词典每一条字节数相等', badBytes, 0)
eq('词典带版本号', typeof dict.version === 'string' && dict.version.length >= 8, true)

const conv = loadDefault()
const cases: [string, string][] = [
  ['付款后即时发卡，不发卡密', '付款後即時發卡，不發卡密'],
  ['平台填入号码并发送验证码', '平台填入號碼並發送驗證碼'],
  ['请先登录账号，设置默认邮箱，上传头像', '請先登入帳號，設定預設電郵，上載頭像'],
  ['请联系客服并提供卡密', '請聯絡客服並提供卡密'],
  ['核对订单后台', '核對訂單後台'],
  ['到账后几分钟内', '到賬後幾分鐘內'],
  ['账号信息与错误信息', '帳號資料與錯誤訊息'],
  ['ChatGPT 教程：视频质量', 'ChatGPT 教學：影片質素'],
  ['隐私政策', '私隱政策'],
  ['已复制，被复制的内容', '已複製，被複製的內容'],
  ['了解更多', '了解更多'],
  ['为什么', '為什麼'],
]
for (const [s, want] of cases) eq(`转换 ${s}`, conv.convert(s), want)

// 字节数不变 + 流式 ≡ 整段：拿全站源码当语料，随机切块
const sample = ['src/app/layout.tsx', 'src/components/layout/header.tsx', 'src/lib/landing/registry.ts']
  .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))
  .join('\n')
  .repeat(3)
const whole = conv.convert(sample)
eq('整段转换后字节数不变', Buffer.byteLength(whole), Buffer.byteLength(sample))
for (const size of [1, 7, 64, 997, 4096]) {
  const st = conv.createStream()
  let out = ''
  for (let i = 0; i < sample.length; i += size) out += st.push(sample.slice(i, i + size))
  out += st.end()
  eq(`流式（块 ${size}）≡ 整段`, out === whole, true)
}
// 全是汉字的超长段：超过上限会被强制切开（不卡死），结果仍是合法转换（长度相等）
{
  const st = conv.createStream(64)
  const longHan = '发'.repeat(500)
  let out = ''
  for (let i = 0; i < longHan.length; i += 50) out += st.push(longHan.slice(i, i + 50))
  out += st.end()
  eq('连续汉字强制切块后长度不变', out.length, longHan.length)
}
// 字节数不等的词条必须被拒绝
{
  let threw = false
  try {
    buildConverter({ chars: [], phrases: [['优盘', 'USB手指']] })
  } catch {
    threw = true
  }
  eq('字节数不等的词条拒绝加载', threw, true)
}

// ---------------------------------------------------------------------------
// 2. 路径规则两份实现一致
// ---------------------------------------------------------------------------
const paths = [
  '/', '/products', '/products/12', '/chongzhi/chatgpt-plus?s=1', '/api/products', '/_next/static/a.js', '/zh-hk', '/zh-hk/x',
  '/admin', '/admin/orders', '/partner/x', '/receipt/abc', '/invoice-request/t', '/favicon.ico', '/logo.png?v=3', '/sitemap.xml',
  '//evil.com', 'https://x.com/', '/uploads/a.png', '/learn/me', '/news/abc-def', '/pay/123', '/#top', '/?q=1',
]
for (const p of paths) eq(`isPagePath 一致：${p}`, proxyMod.isPagePath(p), isLocalizablePath(p))

eq('localizePath 首页', localizePath('/', 'zh-HK'), '/zh-hk/')
eq('localizePath 普通页', localizePath('/products/1?x=2', 'zh-HK'), '/zh-hk/products/1?x=2')
eq('localizePath 接口不加', localizePath('/api/x', 'zh-HK'), '/api/x')
eq('localizePath 已带前缀去掉', localizePath('/zh-hk/about', 'zh-CN'), '/about')
eq('stripHkPrefix', [stripHkPrefix('/zh-hk'), stripHkPrefix('/zh-hk/'), stripHkPrefix('/zh-hk/a?b'), stripHkPrefix('/zh-hkx')], ['/', '/', '/a?b', '/zh-hkx'])
eq('switchHref 去繁体', switchHref('/products', 'zh-HK'), '/zh-hk/products?hl=zh-hk')
eq('switchHref 回简体', switchHref('/zh-hk/products', 'zh-CN'), '/products?hl=zh-cn')
eq('切换链接不被补前缀', proxyMod.isSwitchLink('/products?hl=zh-cn'), true)
// 转换代理的主站默认名单必须与应用的一致：生产不设 PLATFORM_HOSTS，代理靠它挡住渠道站（10-20 上线时漏过一次）
eq('代理默认主站名单 = storefront DEFAULT_PLATFORM_HOSTS', proxyMod.DEFAULT_HOSTS, [...DEFAULT_PLATFORM_HOSTS])

// ---------------------------------------------------------------------------
// 3. 访客识别
// ---------------------------------------------------------------------------
eq('香港 IP、英文浏览器 → 繁体', detectPreferredLang({ country: 'HK', acceptLanguage: 'en-US,en;q=0.9' }), 'zh-HK')
eq('香港 IP、简体浏览器 → 简体（在港的内地访客）', detectPreferredLang({ country: 'HK', acceptLanguage: 'zh-CN,zh;q=0.9' }), 'zh-CN')
eq('美国 IP、zh-HK 浏览器 → 繁体', detectPreferredLang({ country: 'US', acceptLanguage: 'zh-HK,zh;q=0.9,en;q=0.8' }), 'zh-HK')
eq('台湾 → 繁体', detectPreferredLang({ country: 'TW', acceptLanguage: 'zh-TW' }), 'zh-HK')
eq('zh-Hant → 繁体', detectPreferredLang({ acceptLanguage: 'zh-Hant-HK' }), 'zh-HK')
eq('内地 → 简体', detectPreferredLang({ country: 'CN', acceptLanguage: 'zh-CN' }), 'zh-CN')
eq('q 值排序', detectPreferredLang({ acceptLanguage: 'zh-CN;q=0.5,zh-HK;q=0.9' }), 'zh-HK')
eq('无中文信号（Googlebot 美国 IP）→ 不跳', detectPreferredLang({ country: 'US', acceptLanguage: '' }), null)
eq('Googlebot 识别为爬虫', isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true)
eq('微信内置浏览器不是爬虫', isCrawler('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 MicroMessenger/8.0.50'), false)
eq('iPhone Safari 不是爬虫', isCrawler('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'), false)

// ---------------------------------------------------------------------------
// 4. 站点地图
// ---------------------------------------------------------------------------
async function sitemapChecks() {
  process.env.ZHHK_ENABLED = '1'
  const { withHreflang } = await import('../src/lib/i18n/sitemap-hreflang')
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '<url><loc>https://bigolab.com/chongzhi/chatgpt-plus</loc><lastmod>2026-10-01</lastmod></url>\n' +
    '<url><loc>https://bigolab.com/prompts/12-abc</loc></url>\n' +
    '<url><loc>https://bigolab.com/</loc></url>\n</urlset>\n'
  const out = withHreflang(xml)
  eq('加 xhtml 命名空间', out.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), true)
  eq('落地页展开出繁体条目', out.includes('<loc>https://bigolab.com/zh-hk/chongzhi/chatgpt-plus</loc>'), true)
  eq('繁体条目保留 lastmod', /<loc>https:\/\/bigolab\.com\/zh-hk\/chongzhi\/chatgpt-plus<\/loc><lastmod>2026-10-01<\/lastmod>/.test(out), true)
  eq('首页繁体是 /zh-hk/', out.includes('<loc>https://bigolab.com/zh-hk/</loc>'), true)
  eq('互指含 x-default 指简体', out.includes('hreflang="x-default" href="https://bigolab.com/chongzhi/chatgpt-plus"'), true)
  eq('收录范围外（提示词）不展开', out.includes('/zh-hk/prompts/'), false)
  process.env.ZHHK_ENABLED = ''
  eq('总开关关着原样返回', withHreflang(xml), xml)
}

// ---------------------------------------------------------------------------
// 5. 繁体页 <head>
// ---------------------------------------------------------------------------
function headChecks() {
  const p = proxyMod.createProxy({ upstream: 'http://127.0.0.1:1', converter: conv, hosts: new Set(['bigolab.com']) })
  const req = (inner: string) => ({ headers: { host: 'bigolab.com' }, zhhkInner: inner })
  const head = (canon: string, extra = '') =>
    `<head><title>旧标题</title><meta property="og:title" content="旧"/><link rel="canonical" href="${canon}"/>${extra}</head>`

  const a = p.processHead(head('https://bigolab.com/zh-hk/chongzhi/chatgpt-plus'), req('/chongzhi/chatgpt-plus'))
  eq('香港版标题替换', a.includes('<title>ChatGPT Plus 如何訂閱、付款與充值，多少錢 - 貝果科技</title>'), true)
  eq('og:title 一并替换', a.includes('property="og:title" content="ChatGPT Plus 如何訂閱'), true)
  eq('可收录页输出 hreflang 自指', a.includes('hreflang="zh-HK" href="https://bigolab.com/zh-hk/chongzhi/chatgpt-plus"'), true)
  eq('可收录页输出 hreflang 互指', a.includes('hreflang="zh-Hans" href="https://bigolab.com/chongzhi/chatgpt-plus"'), true)

  const b = p.processHead(head('https://bigolab.com/about'), req('/about'))
  eq('绝对 canonical 补前缀', b.includes('rel="canonical" href="https://bigolab.com/zh-hk/about"'), true)

  const c = p.processHead(head('https://bigolab.com/zh-hk/prompts/12-x'), req('/prompts/12-x'))
  eq('名单外 noindex', c.includes('<meta name="robots" content="noindex, follow"/>'), true)
  eq('名单外不写 hreflang', c.includes('hreflang'), false)

  const d = p.processHead(head('https://bigolab.com/zh-hk/guides/1-x', '<meta name="robots" content="noindex, follow"/>'), req('/guides/1-x'))
  eq('页面本身 noindex 时不写 hreflang', d.includes('hreflang'), false)

  const e = p.rewriteAttrs('<a href="/products">x</a><a href="/?hl=zh-cn">s</a><script src="/_next/static/chunks/a.js"></script><a href="/api/x">a</a>')
  eq('HTML 后处理：页面链接加前缀、切换链接与接口不动、脚本走繁体分块', e, `<a href="/zh-hk/products">x</a><a href="/?hl=zh-cn">s</a><script src="/_next-hk/${p.version}/static/chunks/a.js"></script><a href="/api/x">a</a>`)

  // RSC 里的标题：HTML 内联（转义）与 RSC 响应（不转义）两种写法都要换，否则水合后 document.title 被改回自动转换版
  const t = { title: '香港版標題', description: '香港版描述' }
  const inlined = String.raw`[\"$\",\"title\",\"4\",{\"children\":\"舊標題\"}],[\"$\",\"meta\",\"5\",{\"property\":\"og:title\",\"content\":\"舊\"}],[\"$\",\"meta\",\"6\",{\"name\":\"description\",\"content\":\"舊描述\"}]`
  eq(
    'metaSwap：内联 RSC（转义）',
    proxyMod.metaSwap(inlined, t),
    String.raw`[\"$\",\"title\",\"4\",{\"children\":\"香港版標題\"}],[\"$\",\"meta\",\"5\",{\"property\":\"og:title\",\"content\":\"香港版標題\"}],[\"$\",\"meta\",\"6\",{\"name\":\"description\",\"content\":\"香港版描述\"}]`,
  )
  eq(
    'metaSwap：RSC 响应（不转义）',
    proxyMod.metaSwap('["$","title","4",{"children":"舊標題"}],["$","meta","13",{"name":"twitter:title","content":"舊"}]', t),
    '["$","title","4",{"children":"香港版標題"}],["$","meta","13",{"name":"twitter:title","content":"香港版標題"}]',
  )
  eq('metaSwap：没有覆盖时原样', proxyMod.metaSwap('["$","title","4",{"children":"x"}]', null), '["$","title","4",{"children":"x"}]')

  // 接口 JSON：文案转、凭据与会被提交回去的数据不转
  const json = JSON.stringify({
    success: true,
    error: '请先登录',
    data: [{ productName: '发卡商品', cards: ['卡密中文后缀'], cardItems: [{ secret: '账号密码', redeemUrl: 'https://x/兑换' }], buyerRemark: '我的备注', id: 0 }],
  }).replace('"id":0', '"id":12345678901234567890')
  const conv2 = proxyMod.convertJsonText(json, conv.convert)
  const back = JSON.parse(conv2)
  eq('JSON：文案转繁体', [back.error, back.data[0].productName], ['請先登入', '發卡商品'])
  eq('JSON：卡密 / secret / 链接 / 买家备注原样', [back.data[0].cards[0], back.data[0].cardItems[0].secret, back.data[0].cardItems[0].redeemUrl, back.data[0].buyerRemark], ['卡密中文后缀', '账号密码', 'https://x/兑换', '我的备注'])
  eq('JSON：大整数原样（不经 parse/stringify）', conv2.includes('12345678901234567890'), true)
  eq('JSON：键名不转', conv2.includes('"productName"') && !conv2.includes('"productName"'.replace('product', '產品')), true)
  eq('JSON：转义字符不受影响', proxyMod.convertJsonText('{"a":"引号\\"后面\\\\发"}', conv.convert), '{"a":"引號\\"後面\\\\發"}')
  eq('票据 / 资料接口不转', ['/api/invoice-titles', '/api/invoices/3', '/api/receipts?x=1', '/api/account/profile', '/api/redeem/sysb', '/api/orders/9/sms'].every((u) => proxyMod.API_NO_CONVERT.test(u)), true)
  eq('普通接口转', ['/api/products', '/api/orders', '/api/announcement'].some((u) => proxyMod.API_NO_CONVERT.test(u)), false)

  eq('跳转 Location 加前缀', p.rewriteLocation('/login?redirect=%2Forders', req('/')), '/zh-hk/login?redirect=%2Forders')
  eq('跳转到接口不加前缀', p.rewriteLocation('/api/x', req('/')), '/api/x')
}

;(async () => {
  await sitemapChecks()
  headChecks()
  console.log(`\n繁体香港版自测：通过 ${pass}，失败 ${fail}`)
  process.exit(fail ? 1 : 0)
})()
