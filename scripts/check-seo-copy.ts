/**
 * SEO 文案与结构 lint（docs/SEO-重构/SEO-重构设计.md §3.4；A 包新建，之后每个包都跑）。
 *
 *   npx tsx scripts/check-seo-copy.ts                               # 默认抓 http://localhost:3000（本地 next dev / next start）
 *   npx tsx scripts/check-seo-copy.ts --base http://localhost:3200
 *   npx tsx scripts/check-seo-copy.ts --base https://bigolab.com    # 上线后对线上只读抓取：**这是正式验收**
 *
 * 选项：
 *   --max-events N     抽查多少篇大事记详情页（默认 8；LLM 写的标题只抽样告警，不判失败）
 *   --max-products N   最多查多少个商品详情页（默认 40）
 *   --concurrency N    并发抓取数（默认 2；线上是 1.8G 的小机，别调大）
 *   --timeout S        单页超时秒数（默认 90；next dev 首次编译一页要十几秒）
 *   --only a,b         只查这几个路径（调试用；全局规则照跑）
 *   --strict           基线里没有命中任何违规的条目也算失败（清基线时用）
 *   --verbose          把「已知」违规逐条列出（默认只列新增）
 *   --selftest         只跑内置阳性对照，不抓网页
 *   --html-dir <dir>   离线模式：不抓网页，改读一批存档的首包 HTML（文件路径即 URL 路径，index.html = 首页），
 *                      同级目录里有 robots.txt / sitemap.xml 也一并检查。用法：对 O 包的线上快照跑一遍，
 *                      不碰线上就能知道线上现状有哪些违规（docs/SEO-重构/baseline/html）；改前改后各存一份快照也能对比
 *
 * 退出码：出现**不在基线里**的 error 级违规 → 1；只有已知违规 / 告警 → 0。
 *
 * 【为什么是抓 HTML、不 import src/】这份脚本的正式用法是对线上跑（本地种子库的商品名、大事记数据和线上不同，
 * 本地结论只作开发参考，设计 §3.4-0）。抓的是服务端首包 HTML（不执行 JS），和搜索引擎、AI 爬虫第一眼看到的是同一份。
 * 不 import 业务代码也就不连库、不需要 .env，拿到仓库就能跑。
 *
 * 【已知违规基线】仿照 check-tenant-boundary.mjs 的 EXCEPTIONS：BASELINE 里每一条写明规则、页面、匹配什么、为什么、归哪个包。
 * 每个包只要求**不新增违规，并清掉属于本包的基线条目**；不要求一次清零（设计 §8.2 共同验收）。
 * 基线条目一条违规都没命中时打印「过期」提示（--strict 下失败）：修好了就把它删掉，防止基线越积越大。
 * 本地数据和线上不同，所以本地跑出「过期」不一定真的修好了——以 --base https://bigolab.com 的结果为准。
 *
 * 【阳性对照】正则写错一个字符就会静默变成「永远零命中」，每次运行先拿内置样例把每条规则跑一遍（同 check-tenant-boundary 规则 11），
 * 任何一条没命中就直接失败退出。
 */

import fs from 'node:fs'
import nodePath from 'node:path'

// ======================================================================
// 0. 参数
// ======================================================================

const argv = process.argv.slice(2)
function argVal(name: string): string | undefined {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const BASE = (argVal('--base') || process.env.SEO_BASE || 'http://localhost:3000').replace(/\/+$/, '')
const MAX_EVENTS = Number(argVal('--max-events') ?? 8)
const MAX_PRODUCTS = Number(argVal('--max-products') ?? 40)
const CONCURRENCY = Math.max(1, Number(argVal('--concurrency') ?? 2))
const TIMEOUT_MS = Math.max(5, Number(argVal('--timeout') ?? 90)) * 1000
const ONLY = (argVal('--only') || '').split(',').map((s) => s.trim()).filter(Boolean)
const STRICT = argv.includes('--strict')
const VERBOSE = argv.includes('--verbose')
const SELFTEST_ONLY = argv.includes('--selftest')
const HTML_DIR = argVal('--html-dir')
const UA = 'Mozilla/5.0 (compatible; BigoLabSeoLint/1.0; +https://bigolab.com)'
/** 404 探针：一个肯定不存在的地址 */
const PROBE_404 = '/__seo-lint-404-probe__'

// ======================================================================
// 1. 词表（设计 §3.4-2；来源 R5 §1.2、§2.2、§2.4、§3.2、§6）
// ======================================================================

/** 零需求词与自称：全站 title / H1 / description */
const W_ZERO_DEMAND = ['代开', '代购', '代订阅', 'AI会员代充', 'AI 会员代充', 'AI代充']
/** 冒充官方：全站 */
const W_IMPERSONATE = ['官网', '官方渠道', '官方直充', '官方授权', '官方认证', '官方合作伙伴', '官方旗舰', '授权经销商', '合作伙伴', '代理商', '经销商', '正版', '旗舰', '中文版', '国内版', '镜像']
/** 跨境访问：全站 */
const W_CROSS_BORDER = ['翻墙', '梯子', 'VPN', '节点', '机场', '科学上网', '免翻墙', '国内直连']
/** 最高级与承诺：站点模板部分和商业页（首页、/chongzhi*、/products*、/jiema*、/about、/support）。「最」单独处理（白名单：最新、最近） */
const W_SUPERLATIVE = ['最佳', '最好', '最低价', '最便宜', '全网最低', '史上最低', '第一', 'No.1', 'TOP1', '首选', '唯一', '顶级', '顶尖', '极致', '王牌', '全球领先', '100%', '百分百', '绝对', '永久', '万能', '零风险', '无风险', '秒到', '秒充', '秒发', '秒收', '包过', '必过', '不封号', '防封', '保证可用']
const SUPERLATIVE_ZUI_OK = ['最新', '最近']
/** KYC 与账号：全站 */
const W_KYC = ['代实名', '代刷脸', '实名认证代办', '代过', '包过 KYC', '包过KYC', '借用身份', '养号', '老号', '白号']
/** 新闻采编用语：大事记的站点模板部分（分类、话题、日报周报月报的模板字、导语、面包屑）和全站导航 */
const W_NEWS = ['新闻', '快讯', '头条', '要闻', '突发', '时事', '早报', '晚报', '报道', '首发', '独家', '爆料', '记者', '编辑部', '本站原创', '本网讯', '资讯平台', '资讯网']
/** 接码违规用语：只查 /jiema*，以及充值页里的 codex-jiema、claude-zhuce（「API」在充值页豁免） */
const W_JIEMA = ['批量', '接码平台', 'API', '对接', '多开', '群控', '猫池', '卡商', '协议号', '注册机', '租号', '出租', '卖号', '养号', '囤号', '过风控', '免实名', '不用实名', '代实名', '绕过', '匿名', '不留记录', '无法追踪', '长期号', '永久号', '成功率', '必收', '包收', '秒退', '无限换号', '全平台', '免费接码', '全额退款', '原路退回']
const JIEMA_WORD_PAGES_ON_LANDING = ['/chongzhi/codex-jiema', '/chongzhi/claude-zhuce']
/** 推荐与抽奖：全站 */
const W_REFERRAL = ['躺赚', '稳赚', '月入', '必中', '百分百中奖']
/** 上游与竞品品牌：全站（不分大小写） */
const W_UPSTREAM = ['HeroSMS', 'hero-sms', 'SMS-Activate', '5sim', 'smspool']
/**
 * 国内平台名（/jiema* 的 title、description、URL 里不得出现，§3.4-3、D25、Q6）。
 * 对应 src/lib/jiema/seed/services-cn.json 里的国内服务：wb 微信、hw 支付宝/阿里巴巴、za 京东、zp 拼多多、qf 小红书、kf 微博、li 百度、
 * qq QQ/腾讯、xk 滴滴、zs 哔哩哔哩、lf 抖音。注意上游代码 wx 是 Apple 不是微信（设计 #10），这里按中文名匹配，不按代码。
 * 「支付宝」不在表里：它同时是本站的付款方式，设计 §3.3 给 /jiema 定的 description 就写「支付宝或站内余额付款」。
 */
const DOMESTIC_NAMES = ['微信', '阿里巴巴', '京东', '拼多多', '小红书', '微博', '百度', 'QQ', '腾讯', '滴滴', '哔哩哔哩', 'B站', '抖音']
/**
 * 首页与 /jiema 的服务端 HTML 里不得出现的服务名（§0.3 #34、§1.6：Telegram、国内实名类、金融 / 支付 / 加密货币服务、+86）。
 * 这条查的是整份 HTML（含 RSC 负载），所以只放**不会和本站自己的文案撞车**的名字：「支付宝」是本站付款方式、「微信」是客服渠道，
 * 这两个查不了整页，由上面的 DOMESTIC_NAMES 在 title / description 里查。
 */
const SENSITIVE_SERVICE_NAMES = ['Telegram', '电报', '京东', '拼多多', '小红书', '微博', '滴滴', '哔哩哔哩', '抖音', 'PayPal', '贝宝', '币安', 'Binance', 'Coinbase', '汇旺', 'Huione', '+86']
/** 批量买号招揽（§9.4 #21；A 包删掉了 claude-zhuce 里的一句） */
const BULK_SOLICIT = ['需要很多个', '批量购买', '量大从优']

// ======================================================================
// 2. 规则与基线
// ======================================================================

type Level = 'error' | 'warn'
type Violation = { rule: string; path: string; level: Level; detail: string }

/** 规则一览（阳性对照要求每条都能被样例命中） */
const RULES: Record<string, string> = {
  'http-status': '公开页状态码必须是 200（干净地址不该跳转）',
  'title-count': '<title> 必须恰好 1 个',
  'robots-conflict': 'robots / googlebot 的组合里同时出现 index 与 noindex（404 页除外，§6.8）',
  canonical: '可索引页必须有 canonical，且指向自身的干净地址',
  'og-title': 'og:title 与 <title> 主干一致',
  'og-site': 'og:site_name 与 og:locale 都要有',
  h1: 'H1 恰好 1 个且非空',
  'home-loading': '首页服务端 HTML 里没有「加载中」',
  'dup-title': 'title 全站唯一',
  'dup-desc': 'description 全站唯一',
  'not-found': '404 页：状态码 404、中文、有回首页的导航',
  'robots-txt': 'robots.txt：有 Allow: /lookup$；/lookup 可抓、/lookup?… 与带 token 的路径仍被挡',
  'sitemap-forum-games': 'sitemap 里没有 /forum、/games',
  'sitemap-noindex': 'sitemap 里的地址不能是 noindex',
  'forum-games-noindex': '/forum、/games 是 noindex,follow',
  'zero-demand': '零需求词与自称（全站 title / H1 / description）',
  impersonate: '冒充官方用语（全站）',
  'cross-border': '跨境访问用语（全站）',
  superlative: '最高级与承诺（商业页与站点模板）',
  'kyc-account': 'KYC 与账号用语（全站）',
  'news-jargon': '新闻采编用语（大事记模板与全站导航）',
  'jiema-words': '接码违规用语（/jiema*、codex-jiema、claude-zhuce）',
  referral: '推荐与抽奖用语（全站）',
  'upstream-brand': '上游与竞品品牌（全站）',
  'daichong-title': '「代充」不进 title / H1',
  'jiema-domestic': '/jiema* 的 title、description、URL 不出现国内平台名',
  'jiema-region': '/jiema*：「国家」后跟「/地区」；台湾 / 香港 / 澳门前有「中国」（D44）',
  'physical-card': '「实体卡」后面必须紧跟 接码 / 验证码 / 收码',
  'news-ai-meta': '大事记页面必须有 <meta name="ai-generated" content="true">',
  'news-ad-jsonld': '「广告 · 本站服务」区块不能进 Article JSON-LD',
  'invoice-6pct': '非 /jiema 页面写到开票 / 发票，同一字段必须有「6%」',
  'jiema-invoice': '/jiema* 不得出现「可开票」「开发票」（D37 原文是「暂不支持开票，可联系客服开票处理」）',
  'kyc-link': '/jiema*、/news/[slug]、/news/t/* 的正文不链 google-zhanghao、claude-kyc',
  'jiema-link-gray': '接码未对全部用户开放时，公开页 HTML 里没有 href="/jiema',
  'svc-upstream': 'svc= 的值不能是上游代码形态',
  'jiema-s-param': '站内不再生成 /jiema?s= 预选链接（只做旧链接兼容）',
  'sensitive-names': '首页与 /jiema 的服务端 HTML 不出现 Telegram、国内平台、金融/支付/加密货币服务名、+86',
  'news-n-param': '大事记详情页里没有 ?n= 链接',
  'bulk-solicit': '充值页不出现批量买号的招揽',
  'news-ad-block': '大事记详情页的本站商品入口在「广告 · 本站服务」区块里',
}

type BaselineEntry = { rule: string; path: string; match?: string; owner: string; why: string }

/**
 * 已知违规基线。path 支持 * 通配；match 是 detail 里要包含的子串（省略 = 该页该规则的全部违规）。
 * owner 写归哪个施工包（设计 §8.2）：那个包上线时要把自己的条目删掉。
 * 2026-09-30 A 包建立：条目来自本地（beiguo_dev_jiema）与线上基线快照（docs/SEO-重构/baseline/snapshot.md）的并集。
 */
const BASELINE: BaselineEntry[] = [
  // ---- 首页：C 包（§1.10 服务端直出、§3.3 首页 title / H1 / description、§4.2 Organization） ----
  { rule: 'daichong-title', path: '/', owner: 'C', why: '首页 title「充值代充」、H1「充值与代充」，C 包按 §3.3 改' },
  { rule: 'home-loading', path: '/', owner: 'C', why: '「精选服务」是客户端拉取、服务端 HTML 里是「加载中」，C 包改服务端直出（§1.10）' },
  { rule: 'invoice-6pct', path: '*', match: 'JSON-LD Organization', owner: 'C', why: 'Organization.description 没带 6%、还写「代充值」，C 包按 §4.2 改 lib/seo/graph.ts' },
  { rule: 'invoice-6pct', path: '/', match: 'description「', owner: 'C', why: '首页 description / og:description「可开增值税发票」没带 6%，C 包按 §3.3 重写' },
  // ---- 充值落地页：D1b（title / description；AI 引用页第一步要等基线满 4 周） ----
  { rule: 'daichong-title', path: '/chongzhi', owner: 'D1b', why: 'hub title「代充价格表」，AI 引用页第一步（基线满 4 周后）改' },
  { rule: 'daichong-title', path: '/chongzhi/chatgpt-plus', owner: 'D1b', why: 'title「代充值全指南」，AI 引用页第一步改' },
  { rule: 'daichong-title', path: '/chongzhi/claude-pro', owner: 'D1b', why: 'title「代充值指南」，D1b 改' },
  { rule: 'daichong-title', path: '/chongzhi/grok-super', owner: 'D1b', why: 'title「会员代充多少钱」，D1b 改' },
  { rule: 'physical-card', path: '/chongzhi/codex-jiema', owner: 'D1b', why: 'H1「美区实体卡与虚拟号的区别」：「实体卡」后没紧跟接码 / 验证码（§3.3 codex-jiema 行）；D1b 改 title 时一并定 H1（本站不能指定号码类型，D26）' },
  // ---- 对照组：整个测试窗口内一个字不改（§3.3、§7.6），只能永久豁免 ----
  { rule: 'superlative', path: '/chongzhi/claude-kyc', match: '必过', owner: '对照组（不改）', why: 'description「为什么没有所谓的「必过材料清单」」是否定语境；claude-kyc 的 title / description 维持原样（§0.3 #30、§9.4 #21）' },
  // ---- 大事记：E1（日报 / 周报 / 归档的 generateMetadata 由 E1 重写，届时换 pageOg） ----
  { rule: 'og-site', path: '/news/digest/*', owner: 'E1', why: '日报周报的 og 只有 site_name 没有 locale；A 包按任务限定只改 /news 与详情页两个文件' },
  { rule: 'og-site', path: '/news/archive/*', owner: 'E1', why: '月度归档同上' },
  // ---- 短信接码（线上已对全部用户开放）：AJ（元信息、?svc=）、F1（hub 服务端直出的目录） ----
  { rule: 'og-title', path: '/jiema', owner: 'AJ', why: '/jiema 没写 og，og:title 是根 layout 的兜底值（AJ：terms 与 hub 补 og）' },
  { rule: 'og-title', path: '/jiema/terms', owner: 'AJ', why: '同上' },
  { rule: 'jiema-s-param', path: '/jiema', owner: 'AJ', why: '热门服务链接还是 ?s=<上游代码>，AJ 改成 ?svc=<本站 slug>（§1.2）' },
  { rule: 'sensitive-names', path: '/jiema', owner: 'F1', why: '整份目录（含 Telegram、国内平台、金融类）在首包 HTML 里，F1 改为热门区块取 SEO 白名单、其余懒加载（§1.6）' },
]

// ======================================================================
// 3. HTML 解析（零依赖；只解析 Next 服务端首包的写法）
// ======================================================================

type Page = {
  path: string
  status: number
  fromSitemap: boolean
  kind: PageKind
  html: string
  title: string
  titleCount: number
  description: string
  ogTitle: string
  ogDescription: string
  ogSiteName: string
  ogLocale: string
  /** robots 与 googlebot 两条 meta 的 content（小写） */
  robots: string[]
  canonical: string | null
  h1s: string[]
  aiGenerated: boolean
  jsonLd: Record<string, unknown>[]
  /** 正文（去掉 <header>、<footer>）里的 <a href> */
  bodyHrefs: string[]
  /** 整页（含页头页脚）的 <a href> */
  allHrefs: string[]
  /** 页头 + 页脚的可见文字 */
  navText: string
  /** 去掉 <script> 之后的整页 HTML */
  htmlNoScript: string
}

type PageKind =
  | 'home'
  | 'landing'
  | 'products'
  | 'product'
  | 'jiema'
  | 'news-hub'
  | 'news-topic'
  | 'news-event'
  | 'news-digest'
  | 'news-archive'
  | 'trust'
  | 'forum'
  | 'games'
  | 'lookup'
  | 'notfound'
  | 'other'

function kindOf(p: string): PageKind {
  if (p === PROBE_404) return 'notfound'
  if (p === '/') return 'home'
  if (p === '/chongzhi' || p.startsWith('/chongzhi/')) return 'landing'
  if (p === '/products') return 'products'
  if (p.startsWith('/products/')) return 'product'
  if (p === '/jiema' || p.startsWith('/jiema/')) return 'jiema'
  if (p === '/news' || p.startsWith('/news/c/')) return 'news-hub'
  if (p.startsWith('/news/t/')) return 'news-topic'
  if (p.startsWith('/news/archive/')) return 'news-archive'
  if (p.startsWith('/news/digest/')) return 'news-digest'
  if (p.startsWith('/news/')) return 'news-event'
  if (p === '/about' || p === '/support') return 'trust'
  if (p === '/forum' || p.startsWith('/forum/')) return 'forum'
  if (p === '/games' || p.startsWith('/games/')) return 'games'
  if (p === '/lookup') return 'lookup'
  return 'other'
}

const isNews = (k: PageKind) => k.startsWith('news-')
/** 商业页与站点模板（最高级用语的适用范围） */
const isCommercial = (k: PageKind) => ['home', 'landing', 'products', 'product', 'jiema', 'trust'].includes(k)

function decodeEntities(s: string): string {
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

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of Array.from(tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))) out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? '')
  return out
}

function parsePage(path: string, status: number, html: string, fromSitemap: boolean): Page {
  const headEnd = html.indexOf('</head>')
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html
  const body = headEnd >= 0 ? html.slice(headEnd) : html
  const titles = Array.from(head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)).map((m) => stripTags(m[1]))
  const metas = Array.from(head.matchAll(/<meta\b([^>]*)>/gi)).map((m) => attrs(m[1]))
  const metaBy = (key: 'name' | 'property', v: string) => metas.filter((a) => (a[key] || '').toLowerCase() === v).map((a) => a.content ?? '')
  const canonicalTag = Array.from(head.matchAll(/<link\b([^>]*)>/gi))
    .map((m) => attrs(m[1]))
    .find((a) => (a.rel || '').toLowerCase() === 'canonical')
  const jsonLd: Record<string, unknown>[] = []
  for (const m of Array.from(html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))) {
    try {
      const v = JSON.parse(m[1]) as unknown
      const push = (x: unknown) => {
        if (Array.isArray(x)) x.forEach(push)
        else if (x && typeof x === 'object') {
          const o = x as Record<string, unknown>
          jsonLd.push(o)
          if (Array.isArray(o['@graph'])) (o['@graph'] as unknown[]).forEach(push)
        }
      }
      push(v)
    } catch {
      jsonLd.push({ '@type': '__PARSE_ERROR__' })
    }
  }
  const noScript = html.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  const bodyNoScript = body.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  const h1s = Array.from(bodyNoScript.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)).map((m) => stripTags(m[1]))
  const navBlocks = Array.from(bodyNoScript.matchAll(/<(header|footer)\b[\s\S]*?<\/\1>/gi)).map((m) => m[0])
  const mainOnly = bodyNoScript.replace(/<(header|footer)\b[\s\S]*?<\/\1>/gi, ' ')
  const hrefsOf = (s: string) => Array.from(s.matchAll(/<a\b[^>]*?\bhref="([^"]*)"/gi)).map((m) => decodeEntities(m[1]))
  return {
    path,
    status,
    fromSitemap,
    kind: kindOf(path),
    html,
    title: titles[0] ?? '',
    titleCount: titles.length,
    description: metaBy('name', 'description')[0] ?? '',
    ogTitle: metaBy('property', 'og:title')[0] ?? '',
    ogDescription: metaBy('property', 'og:description')[0] ?? '',
    ogSiteName: metaBy('property', 'og:site_name')[0] ?? '',
    ogLocale: metaBy('property', 'og:locale')[0] ?? '',
    robots: [...metaBy('name', 'robots'), ...metaBy('name', 'googlebot')].map((s) => s.toLowerCase()),
    canonical: canonicalTag ? canonicalTag.href ?? null : null,
    h1s,
    aiGenerated: metaBy('name', 'ai-generated').some((c) => c === 'true'),
    jsonLd,
    bodyHrefs: hrefsOf(mainOnly),
    allHrefs: hrefsOf(bodyNoScript),
    navText: stripTags(navBlocks.join(' ')),
    htmlNoScript: noScript,
  }
}

const isNoindex = (p: Page) => p.robots.some((r) => /(^|[\s,])(noindex|none)([\s,]|$)/.test(r))
const hasIndex = (p: Page) => p.robots.some((r) => /(^|[\s,])index([\s,]|$)/.test(r))
/** 去掉品牌后缀后的主干（「 - 贝果科技」「 - AI 圈大事记」） */
const trunk = (t: string) => t.replace(/\s*-\s*(贝果科技|AI 圈大事记)\s*$/, '').trim()

// ======================================================================
// 4. 规则
// ======================================================================

type Ctx = { jiemaOpen: boolean }

function wordHits(text: string, words: string[], ci = false): string[] {
  const t = ci ? text.toLowerCase() : text
  return words.filter((w) => t.includes(ci ? w.toLowerCase() : w))
}

function zuiHits(text: string): string[] {
  const out: string[] = []
  for (let i = text.indexOf('最'); i >= 0; i = text.indexOf('最', i + 1)) {
    const two = text.slice(i, i + 2)
    if (!SUPERLATIVE_ZUI_OK.includes(two)) out.push(two)
  }
  return out
}

/** 一页的「文案字段」：title / H1 / description（og 两项和它们同源，一起查）。llm = 由管线 LLM 写的（只告警） */
function copyFields(p: Page): { field: string; text: string; llm: boolean }[] {
  const llmTitle = p.kind === 'news-event'
  const llmDesc = p.kind === 'news-event' || p.kind === 'news-digest'
  const out = [
    { field: 'title', text: p.title, llm: llmTitle },
    { field: 'description', text: p.description, llm: llmDesc },
    { field: 'og:title', text: p.ogTitle, llm: llmTitle },
    { field: 'og:description', text: p.ogDescription, llm: llmDesc },
  ]
  for (const h of p.h1s) out.push({ field: 'H1', text: h, llm: llmTitle })
  return out.filter((f) => f.text)
}

function checkPage(p: Page, ctx: Ctx): Violation[] {
  const out: Violation[] = []
  const v = (rule: string, detail: string, level: Level = 'error') => out.push({ rule, path: p.path, level, detail })

  if (p.kind === 'notfound') {
    if (p.status !== 404) v('not-found', `状态码 ${p.status}（应为 404）`)
    const text = stripTags(p.htmlNoScript)
    if (!/[一-龥]/.test(p.h1s.join('')) || /could not be found/i.test(text)) v('not-found', `H1 不是中文：${JSON.stringify(p.h1s)}`)
    if (!p.allHrefs.includes('/')) v('not-found', '页面上没有回首页的链接')
    if (!isNoindex(p)) v('not-found', '404 页没有 noindex')
    return out // 404 的两条 robots（Next 自动 noindex + 根 layout 的 index）记为已知无害（§6.8），其余规则不适用
  }
  if (p.status !== 200) {
    // 灰度期的 /jiema 组在主程序里整组跳过；这里是其余公开页打不开（含 3xx：抓取不跟随跳转，干净地址本就不该跳）
    v('http-status', `状态码 ${p.status}`)
    return out
  }

  const noindex = isNoindex(p)

  // ---- 结构 ----
  if (p.titleCount !== 1) v('title-count', `<title> 有 ${p.titleCount} 个`)
  if (noindex && hasIndex(p)) v('robots-conflict', `robots=${JSON.stringify(p.robots)}`)
  if (p.kind === 'forum' || p.kind === 'games') {
    if (!noindex || !p.robots.some((r) => /(^|[\s,])follow([\s,]|$)/.test(r))) v('forum-games-noindex', `robots=${JSON.stringify(p.robots)}`)
  }
  if (p.fromSitemap && noindex) v('sitemap-noindex', `robots=${JSON.stringify(p.robots)}`)
  if (!noindex) {
    if (!p.canonical) v('canonical', '缺 canonical')
    else {
      let cp = ''
      try {
        const u = new URL(p.canonical, BASE)
        cp = (u.pathname.replace(/\/+$/, '') || '/') + u.search
      } catch {
        cp = p.canonical
      }
      if (cp !== p.path) v('canonical', `canonical 指向 ${p.canonical}`)
    }
    if (!p.ogTitle || trunk(p.ogTitle) !== trunk(p.title)) v('og-title', `og:title「${p.ogTitle}」≠ title「${p.title}」`)
    if (!p.ogSiteName || !p.ogLocale) v('og-site', `og:site_name=${JSON.stringify(p.ogSiteName)} og:locale=${JSON.stringify(p.ogLocale)}`)
    if (p.h1s.length !== 1 || !p.h1s[0]) v('h1', `H1 ${p.h1s.length} 个：${JSON.stringify(p.h1s.slice(0, 3))}`)
  }
  if (p.kind === 'home' && stripTags(p.htmlNoScript).includes('加载中')) v('home-loading', '首页服务端 HTML 里有「加载中」')

  // ---- 禁用词（title / H1 / description） ----
  const jiemaWordPage = p.kind === 'jiema' || JIEMA_WORD_PAGES_ON_LANDING.includes(p.path)
  for (const f of copyFields(p)) {
    const lvl: Level = f.llm ? 'warn' : 'error'
    const tag = `${f.field}「${f.text.slice(0, 60)}」`
    for (const w of wordHits(f.text, W_ZERO_DEMAND)) v('zero-demand', `${w} ← ${tag}`, lvl)
    for (const w of wordHits(f.text, W_IMPERSONATE)) v('impersonate', `${w} ← ${tag}`, lvl)
    for (const w of wordHits(f.text, W_CROSS_BORDER)) v('cross-border', `${w} ← ${tag}`, lvl)
    for (const w of wordHits(f.text, W_KYC)) v('kyc-account', `${w} ← ${tag}`, lvl)
    for (const w of wordHits(f.text, W_REFERRAL)) v('referral', `${w} ← ${tag}`, lvl)
    for (const w of wordHits(f.text, W_UPSTREAM, true)) v('upstream-brand', `${w} ← ${tag}`, lvl)
    if (isCommercial(p.kind)) {
      for (const w of [...wordHits(f.text, W_SUPERLATIVE), ...zuiHits(f.text)]) v('superlative', `${w} ← ${tag}`, lvl)
    }
    if (isNews(p.kind)) for (const w of wordHits(f.text, W_NEWS)) v('news-jargon', `${w} ← ${tag}`, lvl)
    if (jiemaWordPage) {
      // 「API」在充值页豁免（claude-code、codex 需要「API 与订阅」「API 按量付费」来区分付费方式，§3.4-2）
      const words = p.kind === 'landing' ? W_JIEMA.filter((w) => w !== 'API') : W_JIEMA
      for (const w of wordHits(f.text, words)) v('jiema-words', `${w} ← ${tag}`, lvl)
    }
    // ---- 分区规则 ----
    if ((f.field === 'title' || f.field === 'H1' || f.field === 'og:title') && f.text.includes('代充')) v('daichong-title', tag, lvl)
    for (const m of Array.from(f.text.matchAll(/实体卡(?!接码|验证码|收码)/g))) v('physical-card', `${m[0]} ← ${tag}`, lvl)
    if (p.kind === 'jiema') {
      if (f.field === 'title' || f.field === 'description' || f.field === 'og:description') {
        for (const w of wordHits(f.text, DOMESTIC_NAMES)) v('jiema-domestic', `${w} ← ${tag}`, lvl)
      }
      for (const m of Array.from(f.text.matchAll(/国家(?!\/地区|／地区)/g))) v('jiema-region', `${m[0]} ← ${tag}`, lvl)
      for (const m of Array.from(f.text.matchAll(/(?<!中国)(台湾|香港|澳门)/g))) v('jiema-region', `${m[0]} ← ${tag}`, lvl)
      for (const w of wordHits(f.text, ['可开票', '开发票'])) v('jiema-invoice', `${w} ← ${tag}`, lvl)
    } else if (/开票|发票/.test(f.text) && !/6\s*%/.test(f.text)) {
      v('invoice-6pct', tag, lvl)
    }
  }
  if (p.kind === 'jiema') for (const w of wordHits(decodeURIComponent(p.path), DOMESTIC_NAMES)) v('jiema-domestic', `${w} ← URL`)
  // JSON-LD 的 description：非 /jiema 写到开票要带 6%；/jiema 不得写成可开票。
  // 只查 description、不查正文与 FAQ：/jiema 的问答「能开发票或收据吗？」是问句，答案是 D37 原文，按字面查正文会误报
  for (const n of p.jsonLd) {
    const d = typeof n.description === 'string' ? n.description : ''
    if (!d) continue
    const tag = `JSON-LD ${String(n['@type'])}.description「${d.slice(0, 60)}」`
    if (p.kind === 'jiema') for (const w of wordHits(d, ['可开票', '开发票'])) v('jiema-invoice', `${w} ← ${tag}`)
    else if (/开票|发票/.test(d) && !/6\s*%/.test(d)) v('invoice-6pct', tag)
  }

  // ---- 大事记 ----
  if (isNews(p.kind) && !p.aiGenerated) v('news-ai-meta', '缺 <meta name="ai-generated" content="true">')
  if (p.kind === 'news-event') {
    for (const n of p.jsonLd.filter((x) => /Article/.test(String(x['@type'])))) {
      const s = JSON.stringify(n)
      // 只认广告区块自己的字样与本站商品链接：事件本身可能就是讲「广告」的（例如某产品上线广告），不能按裸的「广告」二字判
      if (/广告 · 本站服务|本站在售|"(https?:\/\/[^"/]+)?\/(products|chongzhi)(\/[^"]*)?"/.test(s)) v('news-ad-jsonld', 'Article JSON-LD 里有广告区块的内容或商品链接')
    }
    const productLinks = p.bodyHrefs.filter((h) => /^\/(products|chongzhi)(\/|\?|$)/.test(h))
    if (productLinks.length > 0) {
      // 本站商品入口必须在「广告 · 本站服务」区块里：块内的链接数要等于正文里全部商品链接数
      const blocks = Array.from(p.htmlNoScript.matchAll(/<aside\b[^>]*aria-label="广告 · 本站服务"[^>]*>([\s\S]*?)<\/aside>/g)).map((m) => m[1])
      const inBlock = blocks.flatMap((b) => Array.from(b.matchAll(/<a\b[^>]*?\bhref="([^"]*)"/gi)).map((m) => m[1])).filter((h) => /^\/(products|chongzhi)(\/|\?|$)/.test(h))
      if (inBlock.length < productLinks.length) v('news-ad-block', `商品链接 ${productLinks.length} 条，在广告区块里的 ${inBlock.length} 条`)
    }
  }

  // ---- 链接 ----
  if (p.kind === 'jiema' || p.kind === 'news-event' || p.kind === 'news-topic') {
    for (const h of p.bodyHrefs.filter((x) => /^(https?:\/\/[^/]+)?\/chongzhi\/(google-zhanghao|claude-kyc)(?=[/?#]|$)/.test(x))) v('kyc-link', h)
  }
  if (!ctx.jiemaOpen && p.kind !== 'jiema') {
    const n = (p.html.match(/href="\/jiema/g) || []).length
    if (n > 0) v('jiema-link-gray', `${n} 处 href="/jiema…"`)
  }
  for (const h of p.allHrefs) {
    const q = h.includes('?') ? h.slice(h.indexOf('?') + 1).split('#')[0] : ''
    if (!q) continue
    const params = new URLSearchParams(q)
    const svc = params.get('svc')
    if (svc !== null && /^[a-z0-9]{1,3}$/.test(svc)) v('svc-upstream', h)
    if (/^(https?:\/\/[^/]+)?\/jiema(\/)?\?/.test(h) && params.has('s')) v('jiema-s-param', h)
    if (p.kind === 'news-event' && params.has('n')) v('news-n-param', h)
  }
  if (p.kind === 'home' || p.path === '/jiema') {
    for (const w of wordHits(p.html, SENSITIVE_SERVICE_NAMES)) v('sensitive-names', w)
  }
  if (p.kind === 'landing') {
    for (const w of wordHits(p.html, BULK_SOLICIT)) v('bulk-solicit', w)
  }
  return out
}

/** 跨页规则：title / description 唯一；全站导航的采编用语 */
function checkSite(pages: Page[]): Violation[] {
  const out: Violation[] = []
  const indexable = pages.filter((p) => p.status === 200 && p.kind !== 'notfound' && !isNoindex(p))
  for (const [field, rule] of [
    ['title', 'dup-title'],
    ['description', 'dup-desc'],
  ] as const) {
    const by = new Map<string, string[]>()
    for (const p of indexable) {
      const t = p[field]
      if (!t) continue
      by.set(t, [...(by.get(t) || []), p.path])
    }
    for (const [t, paths] of Array.from(by.entries())) {
      if (paths.length < 2) continue
      for (const path of paths) out.push({ rule, path, level: 'error', detail: `「${t.slice(0, 50)}」与 ${paths.filter((x) => x !== path).join('、')} 相同` })
    }
  }
  const home = pages.find((p) => p.kind === 'home' && p.status === 200)
  if (home) for (const w of wordHits(home.navText, W_NEWS)) out.push({ rule: 'news-jargon', path: '/', level: 'error', detail: `${w} ← 页头 / 页脚导航` })
  return out
}

// ---- robots.txt：Google 口径的最小解析器（组匹配 + 最长规则胜出，`*` 通配、`$` 锚尾，同长时 Allow 胜） ----
type RobotsRule = { allow: boolean; pattern: string }
function parseRobots(txt: string): Map<string, RobotsRule[]> {
  const groups = new Map<string, RobotsRule[]>()
  let agents: string[] = []
  let lastWasAgent = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line)
    if (!m) continue
    const key = m[1].toLowerCase()
    const val = m[2].trim()
    if (key === 'user-agent') {
      if (!lastWasAgent) agents = []
      agents.push(val.toLowerCase())
      if (!groups.has(val.toLowerCase())) groups.set(val.toLowerCase(), [])
      lastWasAgent = true
      continue
    }
    lastWasAgent = false
    if ((key === 'allow' || key === 'disallow') && val) for (const a of agents) groups.get(a)!.push({ allow: key === 'allow', pattern: val })
  }
  return groups
}
function robotsAllowed(rules: RobotsRule[], pathAndQuery: string): boolean {
  let best: RobotsRule | null = null
  for (const r of rules) {
    const anchored = r.pattern.endsWith('$')
    const body = anchored ? r.pattern.slice(0, -1) : r.pattern
    const re = new RegExp('^' + body.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''))
    if (!re.test(pathAndQuery)) continue
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow)) best = r
  }
  return best ? best.allow : true
}
function checkRobotsTxt(txt: string): Violation[] {
  const out: Violation[] = []
  const v = (detail: string) => out.push({ rule: 'robots-txt', path: '/robots.txt', level: 'error', detail })
  const star = parseRobots(txt).get('*')
  if (!star) {
    v('没有 User-Agent: * 组')
    return out
  }
  if (!star.some((r) => r.allow && r.pattern === '/lookup$')) v('* 组缺 Allow: /lookup$')
  const expect: [string, boolean][] = [
    ['/lookup', true],
    ['/lookup?email=a%40b.com', false],
    ['/lookup?x=1', false],
    ['/lookup/abc', false],
    ['/receipt/tok', false],
    ['/pay/1', false],
    ['/api/products', false],
    ['/news?s=wx', false],
    ['/products?n=abc', false],
    ['/chongzhi', true],
    ['/', true],
  ]
  for (const [p, allowed] of expect) if (robotsAllowed(star, p) !== allowed) v(`${p} 应${allowed ? '可抓' : '被挡'}，实际${allowed ? '被挡' : '可抓'}`)
  return out
}

// ======================================================================
// 5. 基线匹配
// ======================================================================

function globMatch(glob: string, s: string): boolean {
  return new RegExp('^' + glob.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(s)
}
function baselineFor(v: Violation): BaselineEntry | undefined {
  return BASELINE.find((b) => b.rule === v.rule && globMatch(b.path, v.path) && (!b.match || v.detail.includes(b.match)))
}

// ======================================================================
// 6. 阳性对照（每条规则都要被样例命中）
// ======================================================================

function selftest(): boolean {
  const head = (o: { title?: string; desc?: string; ogTitle?: string; site?: boolean; robots?: string; canonical?: string; ai?: boolean; extraTitle?: boolean }) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"/>` +
    `<title>${o.title ?? 'T - 贝果科技'}</title>${o.extraTitle ? '<title>x</title>' : ''}` +
    `<meta name="description" content="${o.desc ?? 'd'}"/>` +
    (o.robots ? `<meta name="robots" content="${o.robots}"/>` : '') +
    (o.canonical !== undefined ? `<link rel="canonical" href="${o.canonical}"/>` : '') +
    `<meta property="og:title" content="${o.ogTitle ?? o.title ?? 'T - 贝果科技'}"/>` +
    (o.site === false ? '' : `<meta property="og:site_name" content="贝果科技"/><meta property="og:locale" content="zh_CN"/>`) +
    (o.ai ? `<meta name="ai-generated" content="true"/>` : '') +
    `</head><body>`
  const tail = `</body></html>`
  const samples: { path: string; status?: number; html: string; sitemap?: boolean }[] = [
    { path: '/', html: head({ title: 'A 充值代充 - 贝果科技', canonical: '/', extraTitle: true }) + '<header><a href="/news">新闻</a></header><h1>最好 100%</h1><p>加载中</p><a href="/jiema?s=dr">x</a><a href="/jiema?svc=tg">y</a><p>Telegram</p>' + tail },
    { path: '/about', html: head({ title: '关于 - 贝果科技', ogTitle: '别的', site: false, canonical: '/x', robots: 'index, follow' }) + '<h1>a</h1><h1>b</h1>' + tail },
    { path: '/support', html: head({ title: '关于 - 贝果科技', desc: '官网 翻墙 代实名 躺赚 HeroSMS 代开 实体卡 可开增值税发票', canonical: '/support' }) + '<h1>x</h1>' + tail },
    { path: '/forum', html: head({ title: 'F - 贝果科技', robots: 'noindex, follow, index' }) + '<h1>f</h1>' + tail, sitemap: true },
    { path: '/games', html: head({ title: 'G - 贝果科技', robots: 'index, follow', canonical: '/games' }) + '<h1>g</h1>' + tail },
    { path: '/jiema', html: head({ title: '短信接码平台 微信 国家 台湾 - 贝果科技', desc: '可开票', canonical: '/jiema' }) + '<h1>j</h1><a href="/chongzhi/google-zhanghao">k</a>' + tail },
    { path: '/news/abc', html: head({ title: 'x - AI 圈大事记', canonical: '/news/abc' }) + '<h1>x</h1><a href="/products?n=abc">p</a><script type="application/ld+json">{"@type":"Article","description":"广告 · 本站服务","url":"/products"}</script>' + tail },
    { path: '/news/archive/2026-09', html: head({ title: '快讯 - AI 圈大事记', canonical: '/news/archive/2026-09', ai: true }) + '<h1>快讯</h1>' + tail },
    { path: '/chongzhi/claude-zhuce', html: head({ title: 'Z 注册机 - 贝果科技', canonical: '/chongzhi/claude-zhuce' }) + '<h1>z</h1><p>如果你需要很多个</p>' + tail },
    { path: PROBE_404, status: 200, html: head({ title: 'x' }) + '<h1>404 | This page could not be found.</h1>' + tail },
    { path: '/links', status: 500, html: 'Internal Server Error' },
  ]
  const pages = samples.map((s) => parsePage(s.path, s.status ?? 200, s.html, !!s.sitemap))
  const hits = new Set<string>()
  for (const p of pages) for (const x of checkPage(p, { jiemaOpen: false })) hits.add(x.rule)
  for (const x of checkSite(pages)) hits.add(x.rule)
  for (const x of checkRobotsTxt('User-Agent: *\nAllow: /\nDisallow: /lookup\n')) hits.add(x.rule)
  for (const x of checkSitemapPaths(['/forum'])) hits.add(x.rule)
  // 阴性对照：合规的 robots.txt、白名单里的「最新」、「国家/地区」、干净 URL 不得误报
  const neg = [
    ...checkRobotsTxt('User-Agent: *\nAllow: /\nAllow: /lookup$\nDisallow: /lookup\nDisallow: /receipt/\nDisallow: /pay/\nDisallow: /api/\nDisallow: /*?s=\nDisallow: /*?n=\n'),
    ...checkPage(
      parsePage(
        '/news/ad-story',
        200,
        head({ title: 'OpenAI 在 ChatGPT 里测试广告 - AI 圈大事记', canonical: '/news/ad-story', ai: true }) +
          '<h1>OpenAI 在 ChatGPT 里测试广告</h1><aside aria-label="广告 · 本站服务"><a href="/products">p</a></aside>' +
          '<script type="application/ld+json">{"@type":"Article","description":"OpenAI 宣布在免费版里测试广告","url":"https://bigolab.com/news/ad-story"}</script>' +
          tail,
        false,
      ),
      { jiemaOpen: true },
    ),
    ...checkPage(parsePage('/jiema', 200, head({ title: '短信接码：最新 - 贝果科技', desc: '国家/地区 中国香港 暂不支持开票，可联系客服开票处理', canonical: '/jiema' }) + '<h1>短信接码</h1><a href="/jiema?svc=google">g</a>' + tail, false), { jiemaOpen: true }),
  ]
  const missing = Object.keys(RULES).filter((r) => !hits.has(r))
  if (missing.length || neg.length) {
    console.error('[check-seo-copy] 阳性对照失败：')
    for (const r of missing) console.error(`  ✗ 规则 ${r}（${RULES[r]}）没有被样例命中`)
    for (const n of neg) console.error(`  ✗ 阴性样例被误报：${n.rule} ${n.path} ${n.detail}`)
    return false
  }
  console.log(`[check-seo-copy] 阳性对照：${Object.keys(RULES).length} 条规则全部命中，阴性样例零误报`)
  return true
}

function checkSitemapPaths(paths: string[]): Violation[] {
  return paths
    .filter((p) => /^\/(forum|games)(\/|$)/.test(p))
    .map((p) => ({ rule: 'sitemap-forum-games', path: '/sitemap.xml', level: 'error' as Level, detail: p }))
}

// ======================================================================
// 7. 抓取
// ======================================================================

async function fetchText(path: string): Promise<{ status: number; text: string }> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(BASE + path, { headers: { 'user-agent': UA, 'accept-language': 'zh-CN' }, redirect: 'manual', signal: ctl.signal })
    return { status: r.status, text: await r.text() }
  } finally {
    clearTimeout(timer)
  }
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++
        out[k] = await fn(items[k])
      }
    }),
  )
  return out
}

function pathOfLoc(loc: string): string {
  try {
    const u = new URL(loc)
    return (u.pathname.replace(/\/+$/, '') || '/') + u.search
  } catch {
    return loc
  }
}

async function main() {
  if (!selftest()) process.exit(1)
  if (SELFTEST_ONLY) return

  const violations: Violation[] = []
  const { pages, locs } = HTML_DIR ? loadHtmlDir(HTML_DIR, violations) : await crawl(violations)
  finish(pages, locs, violations)
}

/** 离线模式：读存档 HTML（见文件头 --html-dir） */
function loadHtmlDir(dir: string, violations: Violation[]): { pages: Page[]; locs: string[] } {
  console.log(`[check-seo-copy] 离线读取 ${dir}（不抓网页）`)
  const parent = nodePath.dirname(nodePath.resolve(dir))
  const robotsFile = nodePath.join(parent, 'robots.txt')
  if (fs.existsSync(robotsFile)) violations.push(...checkRobotsTxt(fs.readFileSync(robotsFile, 'utf8')))
  const smFile = nodePath.join(parent, 'sitemap.xml')
  const locs = fs.existsSync(smFile) ? Array.from(fs.readFileSync(smFile, 'utf8').matchAll(/<loc>([\s\S]*?)<\/loc>/g)).map((m) => pathOfLoc(decodeEntities(m[1].trim()))) : []
  violations.push(...checkSitemapPaths(locs))
  const inSitemap = new Set(locs)
  const files: string[] = []
  const walk = (d: string) => {
    for (const name of fs.readdirSync(d)) {
      const p = nodePath.join(d, name)
      if (fs.statSync(p).isDirectory()) walk(p)
      else if (name.endsWith('.html')) files.push(p)
    }
  }
  walk(dir)
  const pages = files.sort().map((f) => {
    const rel = nodePath.relative(dir, f).replace(/\\/g, '/').replace(/\.html$/, '')
    const path = rel === 'index' ? '/' : `/${rel}`
    return parsePage(path, 200, fs.readFileSync(f, 'utf8'), inSitemap.has(path))
  })
  console.log(`  读了 ${pages.length} 页（sitemap ${locs.length} 条）`)
  return { pages: ONLY.length ? pages.filter((p) => ONLY.includes(p.path) || p.path === '/jiema') : pages, locs }
}

/** 在线模式：抓 BASE */
async function crawl(violations: Violation[]): Promise<{ pages: Page[]; locs: string[] }> {
  console.log(`[check-seo-copy] 抓取 ${BASE}（并发 ${CONCURRENCY}，单页超时 ${TIMEOUT_MS / 1000}s）`)
  const robots = await fetchText('/robots.txt')
  if (robots.status !== 200) violations.push({ rule: 'robots-txt', path: '/robots.txt', level: 'error', detail: `状态码 ${robots.status}` })
  else violations.push(...checkRobotsTxt(robots.text))

  const sm = await fetchText('/sitemap.xml')
  const locs = sm.status === 200 ? Array.from(sm.text.matchAll(/<loc>([\s\S]*?)<\/loc>/g)).map((m) => pathOfLoc(decodeEntities(m[1].trim()))) : []
  if (sm.status !== 200) console.log(`  （sitemap.xml 状态码 ${sm.status}，只查固定页面）`)
  violations.push(...checkSitemapPaths(locs))

  // 选页：sitemap 里除大事记详情 / 日报 / 归档 / 商品之外全查；那几类抽样（线上是小机，别整站扫）
  const events = locs.filter((p) => kindOf(p) === 'news-event')
  const digests = locs.filter((p) => kindOf(p) === 'news-digest')
  const archives = locs.filter((p) => kindOf(p) === 'news-archive')
  const products = locs.filter((p) => kindOf(p) === 'product')
  const sampled = new Set<string>([
    ...locs.filter((p) => !['news-event', 'news-digest', 'news-archive', 'product'].includes(kindOf(p))),
    ...events.slice(0, MAX_EVENTS),
    ...digests.slice(0, 3),
    ...archives.slice(0, 2),
    ...products.slice(0, MAX_PRODUCTS),
  ])
  const inSitemap = new Set(locs)
  // 不在 sitemap 里、但要查的：索引规则（/forum、/games、/lookup）、接码开放状态（/jiema）、404
  const fixed = ['/', '/chongzhi', '/products', '/news', '/about', '/support', '/terms', '/privacy', '/links', '/iptools', '/forum', '/games', '/lookup', '/jiema', '/jiema/terms', PROBE_404]
  for (const f of fixed) sampled.add(f)
  let targets = Array.from(sampled)
  if (ONLY.length) targets = targets.filter((p) => ONLY.includes(p) || p === '/jiema')

  const started = Date.now()
  const pages = await pool(targets, CONCURRENCY, async (path) => {
    try {
      const r = await fetchText(path)
      return parsePage(path, r.status, r.text, inSitemap.has(path))
    } catch (e) {
      return parsePage(path, 0, `<!-- fetch failed: ${(e as Error).message} -->`, inSitemap.has(path))
    }
  })
  console.log(`  抓了 ${pages.length} 页（sitemap ${locs.length} 条，其中大事记详情 ${events.length} 条抽 ${Math.min(MAX_EVENTS, events.length)} 条），用时 ${Math.round((Date.now() - started) / 1000)}s`)
  return { pages, locs }
}

function finish(pages: Page[], locs: string[], violations: Violation[]) {
  void locs
  const jiemaPage = pages.find((p) => p.path === '/jiema')
  const ctx: Ctx = { jiemaOpen: !!jiemaPage && jiemaPage.status === 200 && !isNoindex(jiemaPage) }
  console.log(`  接码开放状态：${ctx.jiemaOpen ? 'OPEN（/jiema 可索引）' : '灰度 / 关闭（/jiema 为 noindex 或不可访问）'}`)

  for (const p of pages) {
    // /jiema 组在灰度期是 noindex，它自己的结构规则不适用（AJ 包的 itest-jiema-terms 负责断言 robots）
    if (!ctx.jiemaOpen && p.kind === 'jiema') continue
    violations.push(...checkPage(p, ctx))
  }
  violations.push(...checkSite(pages.filter((p) => ctx.jiemaOpen || p.kind !== 'jiema')))

  // ---- 汇总 ----
  const fresh: Violation[] = []
  const known: Violation[] = []
  const warns: Violation[] = []
  const usedBaseline = new Set<BaselineEntry>()
  for (const x of violations) {
    const b = baselineFor(x)
    if (b) {
      usedBaseline.add(b)
      known.push(x)
    } else if (x.level === 'warn') warns.push(x)
    else fresh.push(x)
  }
  const stale = BASELINE.filter((b) => !usedBaseline.has(b))
  const show = (x: Violation) => `  [${x.rule}] ${x.path} — ${x.detail}`

  if (warns.length) {
    console.log(`\n告警 ${warns.length} 条（LLM 写的标题 / 摘要，只抽样告警、不判失败；已受管线 score.ts 的禁词约束）：`)
    for (const x of warns) console.log(show(x))
  }
  console.log(`\n已知违规（基线）${known.length} 条${VERBOSE ? '：' : '（--verbose 逐条列出）'}`)
  if (VERBOSE) for (const x of known) console.log(`${show(x)}  ← ${baselineFor(x)!.owner}`)
  if (stale.length) {
    console.log(`\n基线条目本次没有命中 ${stale.length} 条（修好了就删掉；本地数据和线上不同，以 --base https://bigolab.com 为准）：`)
    for (const b of stale) console.log(`  [${b.rule}] ${b.path}${b.match ? ` ~ ${b.match}` : ''} （${b.owner}：${b.why}）`)
  }
  if (fresh.length) {
    console.log(`\n❌ 新增违规 ${fresh.length} 条：`)
    for (const x of fresh) console.log(show(x))
  } else {
    console.log('\n✅ 没有新增违规')
  }
  const fail = fresh.length > 0 || (STRICT && stale.length > 0)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error('[check-seo-copy] 运行失败：', e)
  process.exit(2)
})
