/**
 * JSON-LD 转义自测 + （--base）结构化数据与页面一致性检查。
 *
 * 【为什么值得有这么一个脚本】2026-09-19 引入 lib/seo/jsonld.tsx 时踩了一个坑：
 * 写成 `json.replace(/</g, '<')`（单反斜杠）。这在 TS 里是一个 unicode 转义，
 * 编译出来就是字符 `<` 本身，于是整句是「把 < 换成 <」——一个彻头彻尾的空操作。
 * 代码看上去完全正常、类型检查通过、页面渲染也正常，
 * **唯一能发现它的方式就是断言输出里不含裸的 `</script>`**。
 * 这类 bug 靠 code review 看不出来，所以留下这个脚本。
 *
 * 跑法：npx tsx scripts/check-jsonld.ts
 *       npx tsx scripts/check-jsonld.ts --base http://localhost:3043     # 另抓页面查结构化数据本身（SEO 批 2）
 *       npx tsx scripts/check-jsonld.ts --base https://bigolab.com        # 上线后对线上只读抓取
 *
 * 【--base 模式查什么】（docs/SEO-重构/SEO-重构设计.md §4.1 通用规则、§3.1「结构化数据与可见内容一致」）
 *  · 每段 ld+json 都能解析；
 *  · 页内没有悬空 @id：只有一个 @id 键的对象是「引用」，被引用的 @id 必须在同一页某个节点上定义（§24 教训 #10）；
 *  · FAQPage 的每个问题、BreadcrumbList 的每一级名称，都在页面可见文字里（标记了用户看不到的内容属于违规标记）；
 *  · Product / Offer 只出现在 /products/<id>；全站没有 NewsArticle 一类（大事记不做新闻定性，SKILL.md §1）；
 *  · 渠道站不在这里查（渠道站整站 noindex，Product 等不输出，由 itest-tenant 管）。
 * 抓哪些页：/sitemap.xml（index 时逐个读子地图，另读 /sitemap-content.xml）里除大事记详情、商品、学习平台单条之外全查，
 * 那三类各抽 6 条；外加 /jiema、/news。只发 GET，线上是 1.8G 小机，逐页串行。
 */
import { escapeJsonLd } from '../src/lib/seo/jsonld'

let failed = 0
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) {
    console.log('  ✓', name)
  } else {
    failed++
    console.log('  ✗', name, extra ? `\n      ${extra}` : '')
  }
}

console.log('JSON-LD 转义：')

// ① 最要紧的一条：商品名里塞 </script> 不能逃出 script 标签
const evil = 'a</script><img src=x onerror=alert(1)>b'
const out = escapeJsonLd(JSON.stringify({ name: evil }))
assert('含 </script> 的商品名不会闭合 script 标签', !out.includes('</script>'), out)
assert('输出里没有任何裸的 <', !out.includes('<'), out)
assert('输出里没有任何裸的 >', !out.includes('>'), out)

// ② 转义之后必须还是同一份数据——转义不能改变语义
assert('转义后仍是合法 JSON 且内容等价', JSON.parse(out).name === evil)

// ③ & 与行分隔符：U+2028 / U+2029 在 JSON 里合法，在 JS 源码里是换行
const LS = String.fromCharCode(0x2028)
const PS = String.fromCharCode(0x2029)
const weird = JSON.stringify({ a: 'x&y', b: `p${LS}q${PS}r` })
const wout = escapeJsonLd(weird)
assert('& 被转义', !wout.includes('&'), wout)
assert('U+2028 被转义', !wout.includes(LS), wout)
assert('U+2029 被转义', !wout.includes(PS), wout)
assert('转义后内容仍等价', JSON.parse(wout).b === `p${LS}q${PS}r`)

// ④ 正常内容不应被改动（避免过度转义把中文或引号也动了）
const plain = JSON.stringify({ name: '贝果科技 ChatGPT Plus 充值', price: '135.00' })
assert('不含特殊字符时原样输出', escapeJsonLd(plain) === plain)

// ====================================================================== --base：抓页面查结构化数据
const argv = process.argv.slice(2)
const baseIdx = argv.indexOf('--base')
const BASE = baseIdx >= 0 ? (argv[baseIdx + 1] || '').replace(/\/+$/, '') : ''

type Node = Record<string, unknown>

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/** 可见文字：去掉 script / style / 标签后压空白（只比对是否「包含」，不要求排版一致） */
function visibleText(html: string): string {
  return decode(html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, '')
}

function walk(v: unknown, fn: (o: Node) => void) {
  if (Array.isArray(v)) v.forEach((x) => walk(x, fn))
  else if (v && typeof v === 'object') {
    fn(v as Node)
    for (const x of Object.values(v as Node)) walk(x, fn)
  }
}

function typesOf(o: Node): string[] {
  const t = o['@type']
  return Array.isArray(t) ? t.map(String) : t ? [String(t)] : []
}

/** 纯函数：一页的结构化数据问题（--base 与阳性对照共用） */
function jsonLdProblems(path: string, html: string): string[] {
  const problems: string[] = []
  const blocks = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)).map((m) => m[1])
  const nodes: unknown[] = []
  for (const b of blocks) {
    try {
      nodes.push(JSON.parse(b))
    } catch (e) {
      problems.push(`ld+json 解析失败：${(e as Error).message}`)
    }
  }
  const defined = new Set<string>()
  const refs: string[] = []
  walk(nodes, (o) => {
    const id = typeof o['@id'] === 'string' ? (o['@id'] as string) : null
    if (!id) return
    if (Object.keys(o).length === 1) refs.push(id)
    else defined.add(id)
  })
  for (const r of refs) if (!defined.has(r)) problems.push(`悬空 @id：${r}（被引用，但这一页没有输出它）`)
  const text = visibleText(html)
  const norm = (s: string) => decode(String(s)).replace(/\s+/g, '')
  walk(nodes, (o) => {
    const t = typesOf(o)
    if (t.includes('FAQPage')) {
      const qs = Array.isArray(o.mainEntity) ? (o.mainEntity as Node[]) : []
      for (const q of qs) if (q && typeof q.name === 'string' && !text.includes(norm(q.name))) problems.push(`FAQ 问题不在页面可见文字里：${q.name}`)
    }
    if (t.includes('BreadcrumbList')) {
      const items = Array.isArray(o.itemListElement) ? (o.itemListElement as Node[]) : []
      for (const it of items) {
        const name = typeof it?.name === 'string' ? it.name : ''
        // 末级常是很长的标题，页面上可能被截断显示：只要求前 12 个字可见
        if (name && !text.includes(norm(name).slice(0, 12))) problems.push(`面包屑「${name}」不在页面可见文字里`)
      }
    }
    if ((t.includes('Product') || t.includes('Offer')) && !/^\/products\/\d+$/.test(path)) problems.push(`${t.join('/')} 只该出现在 /products/<id>`)
    if (t.some((x) => /NewsArticle|NewsMediaOrganization|LiveBlogPosting/.test(x))) problems.push(`不该有 ${t.join('/')}（大事记不做新闻定性）`)
  })
  return problems
}

async function fetchText(p: string): Promise<{ status: number; text: string }> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 120_000)
  try {
    const r = await fetch(BASE + p, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; BigoLabJsonLdCheck/1.0)' }, redirect: 'manual', signal: ac.signal })
    return { status: r.status, text: await r.text() }
  } finally {
    clearTimeout(timer)
  }
}

function pathOf(loc: string): string {
  try {
    const u = new URL(loc)
    return (u.pathname.replace(/\/+$/, '') || '/') + u.search
  } catch {
    return loc
  }
}

async function sitemapPaths(): Promise<string[]> {
  const locs = (x: string) => Array.from(x.matchAll(/<loc>([\s\S]*?)<\/loc>/g)).map((m) => pathOf(decode(m[1].trim())))
  const root = await fetchText('/sitemap.xml')
  if (root.status !== 200) return []
  if (!/<sitemapindex\b/.test(root.text)) return locs(root.text)
  const all: string[] = []
  const children = locs(root.text)
  if (!children.includes('/sitemap-content.xml')) children.push('/sitemap-content.xml')
  for (const c of children) {
    const r = await fetchText(c).catch(() => ({ status: 0, text: '' }))
    if (r.status === 200) all.push(...locs(r.text))
  }
  return Array.from(new Set(all))
}

async function crawl() {
  console.log(`\n结构化数据（抓 ${BASE}）：`)
  // 阳性对照：悬空 @id、看不见的 FAQ、商品页以外的 Product、NewsArticle 都要被抓到
  const bad = jsonLdProblems(
    '/x',
    '<script type="application/ld+json">[{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"看不见的问题"}],"publisher":{"@id":"https://e.com/#org"}},{"@type":"Product","name":"p"},{"@type":"NewsArticle","headline":"h"}]</script><p>别的</p>',
  )
  assert('阳性对照：悬空 @id / 看不见的 FAQ / 错位的 Product / NewsArticle 都被抓到', bad.length === 4, bad.join('；'))
  assert(
    '阴性对照：被引用的节点同页输出就不报',
    jsonLdProblems('/x', '<script type="application/ld+json">[{"@type":"Organization","@id":"o","name":"n"},{"@type":"WebSite","publisher":{"@id":"o"}}]</script>').length === 0,
  )
  const all = await sitemapPaths()
  const events = all.filter((p) => /^\/news\/(?!archive\/|digest\/)[^/]+$/.test(p))
  const products = all.filter((p) => /^\/products\/\d+$/.test(p))
  const items = all.filter((p) => /^\/(prompts|guides|apps)\/\d+/.test(p))
  const rest = all.filter((p) => !events.includes(p) && !products.includes(p) && !items.includes(p))
  const targets = Array.from(new Set([...rest, ...events.slice(0, 6), ...products.slice(0, 6), ...items.slice(0, 6), '/jiema', '/news']))
  let pages = 0
  let ldPages = 0
  for (const p of targets) {
    const r = await fetchText(p).catch((e) => ({ status: 0, text: String(e) }))
    if (r.status !== 200) {
      console.log(`  · ${p}：状态码 ${r.status}，跳过`)
      continue
    }
    pages++
    if (r.text.includes('application/ld+json')) ldPages++
    const probs = jsonLdProblems(p, r.text)
    assert(`${p}：结构化数据与页面一致、没有悬空 @id`, probs.length === 0, probs.slice(0, 5).join('；'))
  }
  console.log(`  共查 ${pages} 页，其中 ${ldPages} 页有结构化数据`)
}

;(async () => {
  if (BASE) await crawl()
  console.log(failed === 0 ? '\n全部通过' : `\n失败 ${failed} 条`)
  process.exit(failed === 0 ? 0 : 1)
})()
