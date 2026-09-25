/**
 * 上报数据的归类逻辑。单独成文件是为了能被断言脚本直接测——
 * 归类错了整个仪表盘就是错的，而这种错误在图表上看不出来。
 */

/** 本站域名。判断 referrer 是不是站内跳转用 */
const SELF_HOSTS = ['bigolab.com', 'www.bigolab.com']

/**
 * host 与规则的匹配。两种写法，不要再用 includes：
 *
 *   'chatgpt.com'   精确域名——命中 chatgpt.com 本身及其子域
 *   'google.'       品牌段——host 里有一整段正好等于 google，
 *                   用来覆盖 google.com / google.com.hk / google.co.jp 这种多顶级域的情况
 *
 * 【为什么必须这样写】第一版用的是 `host.includes(needle)`，于是
 * `chatgpt.com` 命中了推特短链 `t.co`（chatgp**t.co**m），ChatGPT 带来的流量
 * 整段被记成「社交/社区」。同类误伤还有 `netflix.com` 命中 `x.com`、
 * `support.com` 命中 `t.co`、`also.com` 命中 `so.com`。
 * 子串匹配在域名上永远是错的，因为域名的边界是点，不是字符。
 */
function hostMatches(host: string, pattern: string): boolean {
  if (pattern.endsWith('.')) return host.split('.').includes(pattern.slice(0, -1))
  return host === pattern || host.endsWith(`.${pattern}`)
}

/**
 * AI 助手 / AI 搜索。
 *
 * 【为什么单独一类，而且要排在搜索引擎前面】
 * 2026-09-19 上线埋点当天，chatgpt.com 就是本站第一大外部来源
 * （12 次浏览 / 3 个访客，超过 Google 与 Bing 之和，其中一个访客一路走到了登录和订单页）。
 * 这批人不是点广告来的，是 ChatGPT 在回答「国内怎么充 ChatGPT Plus」时把本站作为来源引用了。
 * 把它混进「社交」或「外链引荐」，等于看不见一条正在增长的获客渠道。
 *
 * 排在搜索引擎之前是必须的：`gemini.google.com` 会被品牌段规则 `google.` 判成 Google 搜索。
 */
const AI_ASSISTANTS: [string, string][] = [
  ['chatgpt.com', 'chatgpt'],
  ['openai.com', 'chatgpt'], // 老链接 chat.openai.com 现在跳 chatgpt.com，但 referrer 仍可能是它
  ['claude.ai', 'claude'],
  ['gemini.google.com', 'gemini'],
  ['aistudio.google.com', 'gemini'],
  ['copilot.microsoft.com', 'copilot'],
  ['perplexity.ai', 'perplexity'],
  ['grok.com', 'grok'],
  ['x.ai', 'grok'],
  ['deepseek.com', 'deepseek'],
  ['doubao.com', 'doubao'],
  ['kimi.com', 'kimi'],
  ['moonshot.cn', 'kimi'],
  ['yuanbao.tencent.com', 'yuanbao'],
  ['tongyi.com', 'tongyi'],
  ['tongyi.aliyun.com', 'tongyi'],
  ['chatglm.cn', 'zhipu'],
  ['metaso.cn', 'metaso'],
  ['felo.ai', 'felo'],
  ['poe.com', 'poe'],
  ['you.com', 'you'],
  ['phind.com', 'phind'],
]

/**
 * 搜索引擎识别。key 是域名或品牌段（写法见 hostMatches），value 是归一化后的名字。
 * 顺序有意义：先匹配到的算数。
 */
const SEARCH_ENGINES: [string, string][] = [
  ['google.', 'google'],
  ['bing.com', 'bing'],
  ['baidu.com', 'baidu'],
  ['sogou.com', 'sogou'],
  ['so.com', '360'],
  ['yandex.', 'yandex'],
  ['duckduckgo.com', 'duckduckgo'],
  ['ecosia.org', 'ecosia'],
  ['brave.com', 'brave'],
  ['naver.com', 'naver'],
  ['yahoo.', 'yahoo'],
]

/**
 * 网页版邮箱。营销邮件（以及订单、到期提醒邮件）里的链接被点开时，referrer 是这些域名。
 *
 * 【为什么要排在 AI / 搜索 / 社交之前】QQ 邮箱是 mail.qq.com，会被社交规则 `qq.com` 吞掉；
 * Gmail 是 mail.google.com、雅虎邮箱是 mail.yahoo.com，会被品牌段 `google.` / `yahoo.` 判成搜索。
 * 不先挡住，邮件带来的流量会整段记成「社交」或「Google 自然搜索」—— 图上看不出任何异常。
 *
 * 只列「邮箱」子域，不列品牌根域：qq.com / 163.com / google.com 本身不是邮箱。
 * 客户端（Outlook、iOS 邮件、手机 QQ 邮箱 App）点开链接不带 referrer，那部分靠落地 URL 上的
 * utm_medium=email 识别（见 EMAIL_REFERRER_MARKER）。
 */
const WEBMAIL_HOSTS: string[] = [
  'mail.qq.com',
  'wx.mail.qq.com',
  'exmail.qq.com',
  'mail.163.com',
  'mail.126.com',
  'mail.yeah.net',
  'mail.sina.com.cn',
  'mail.sina.com',
  'mail.sohu.com',
  'mail.aliyun.com',
  'qiye.aliyun.com',
  'mail.google.com',
  'outlook.live.com',
  'outlook.office.com',
  'outlook.office365.com',
  'mail.yahoo.com',
  'mail.139.com',
  'mail.189.cn',
  'mail.foxmail.com',
  'mail.wo.cn',
  'mail.tom.com',
  'mail.icloud.com',
  'mail.proton.me',
  'mail.zoho.com',
  'mail.yandex.ru',
]

/**
 * 伪 referrer：前端发现落地 URL 带 utm_medium=email 时，把本次访问的入口来源记成这个标记
 * （见 components/page-view-beacon.tsx）。邮件客户端点开链接不带 referrer，
 * 没有它，大部分邮件流量会被记成「直接访问」。它不是合法 URL，classifyReferrer 最先认它。
 */
export const EMAIL_REFERRER_MARKER = 'utm:email'

/** 社交/社区来源。这一类在中文场景里是重要的转化来源，不该被塞进 referral 大杂烩 */
const SOCIAL_HOSTS: string[] = [
  'zhihu.com',
  'weibo.',
  'v2ex.com',
  'linux.do',
  'xiaohongshu.com',
  'bilibili.com',
  'douban.com',
  't.co',
  'x.com',
  'twitter.com',
  't.me',
  'qq.com',
  'csdn.net',
  'juejin.cn',
  'segmentfault.com',
  'github.com',
  'reddit.com',
]

export type TrafficSource = 'search' | 'ai' | 'email' | 'direct' | 'social' | 'referral' | 'internal'

export interface Classified {
  source: TrafficSource
  engine: string | null
  refHost: string | null
}

/**
 * 按 referrer 归类来源。
 *
 * 【direct 这个类目名不准确，但沿用行业惯例】它其实是「拿不到 referrer」，
 * 包含直接输网址、从书签进、从 App 内打开、以及从 https 跳到本站时对方设了
 * referrer policy 的情况。看这个数字时心里要有数，它不等于「记住了你网址的人」。
 *
 * @param selfHost 本次请求自己的 Host 头。域名之外还能从公网 IP 直连本站
 *                 （nginx 80 端口对外开着），那种情况下 referrer 是 IP，
 *                 不在 SELF_HOSTS 里，不传这个参数就会把站内跳转记成外链引荐。
 */
export function classifyReferrer(
  referrer: string | null | undefined,
  selfHost?: string | null
): Classified {
  if (!referrer) return { source: 'direct', engine: null, refHost: null }
  // 落地 URL 带 utm_medium=email 的访问（前端换成的标记，见 EMAIL_REFERRER_MARKER）
  if (referrer === EMAIL_REFERRER_MARKER) return { source: 'email', engine: null, refHost: null }

  let host: string
  try {
    host = new URL(referrer).host.toLowerCase()
  } catch {
    // referrer 不是合法 URL（少见但真会发生），当直接访问处理，不要因此丢掉整条上报
    return { source: 'direct', engine: null, refHost: null }
  }
  if (!host) return { source: 'direct', engine: null, refHost: null }

  const self = selfHost?.toLowerCase().trim()
  if (SELF_HOSTS.includes(host) || (self && host === self)) {
    return { source: 'internal', engine: null, refHost: host }
  }

  // 网页邮箱必须最先判：mail.qq.com 会被社交的 qq.com、mail.google.com 会被搜索的 google. 吞掉
  for (const pattern of WEBMAIL_HOSTS) {
    if (hostMatches(host, pattern)) return { source: 'email', engine: null, refHost: host }
  }
  for (const [pattern, name] of AI_ASSISTANTS) {
    if (hostMatches(host, pattern)) return { source: 'ai', engine: name, refHost: host }
  }
  for (const [pattern, name] of SEARCH_ENGINES) {
    if (hostMatches(host, pattern)) return { source: 'search', engine: name, refHost: host }
  }
  for (const pattern of SOCIAL_HOSTS) {
    if (hostMatches(host, pattern)) return { source: 'social', engine: null, refHost: host }
  }
  return { source: 'referral', engine: null, refHost: host }
}

/**
 * 设备判定。只分 mobile / desktop 两类。
 *
 * 【为什么不细分平板、不记浏览器版本】这个站的运营决策里没有任何一条取决于
 * 「iPad 占比多少」或「Chrome 118 有几个人」。多一个维度就多一列要维护、
 * 多一个会写错的地方，而它永远不会改变任何决定。要看细分去 Cloudflare。
 */
export function classifyDevice(ua: string | null | undefined): 'mobile' | 'desktop' {
  if (!ua) return 'desktop'
  return /Mobile|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(ua)
    ? 'mobile'
    : 'desktop'
}

/**
 * 路径归一化。
 *
 * 【为什么要把动态段收敛】/news/2026-09-19-abc 这类路径每条新闻一个，
 * 全量列出来的话「热门页面」榜上永远是几百条各看了一两次的新闻页，
 * 真正要看的 /chongzhi/* 反而被挤没了。所以详情页按模式归到一类，
 * 同时**保留原始路径**另存一份——两种视角都要有。
 */
export function normalizePath(raw: string): string {
  let p = (raw || '/').split('?')[0].split('#')[0].trim()
  if (!p.startsWith('/')) p = `/${p}`
  // 去掉结尾斜杠（根路径除外），否则 /products 与 /products/ 会算成两页
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  // 超长路径直接截断到列宽，别让一条脏数据把写入打挂
  return p.slice(0, 191)
}

/** 详情页归类，用于「按页面类型看」的那一栏 */
export function pathGroup(path: string): string {
  if (/^\/news\/digest\//.test(path)) return '/news/digest/*'
  if (/^\/news\/archive\//.test(path)) return '/news/archive/*'
  if (/^\/news\/.+/.test(path)) return '/news/*'
  if (/^\/products\/\d+/.test(path)) return '/products/*'
  if (/^\/forum\/\d+/.test(path)) return '/forum/*'
  if (/^\/coupon\//.test(path)) return '/coupon/*'
  if (/^\/redeem\//.test(path)) return '/redeem/*'
  return path
}

/**
 * 不记录的路径。
 *
 * 【为什么要排除】后台自己的访问会把数据彻底污染——站长一天点几十次后台，
 * 在「热门页面」上永远排第一。带 token 的页面更不能记：那些路径本身就是凭据。
 */
export function shouldSkipPath(path: string): boolean {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/api') ||
    path.startsWith('/receipt/') ||
    path.startsWith('/pay/') ||
    path.startsWith('/reply/') ||
    path.startsWith('/finance/') ||
    // 营销邮件的退订页：路径里的 token 就是凭证。页面本身不在 (shop) 里、不挂埋点，这里是第二道
    path.startsWith('/unsubscribe/') ||
    path.startsWith('/_next')
  )
}
