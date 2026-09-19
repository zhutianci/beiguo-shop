/**
 * 上报数据的归类逻辑。单独成文件是为了能被断言脚本直接测——
 * 归类错了整个仪表盘就是错的，而这种错误在图表上看不出来。
 */

/** 本站域名。判断 referrer 是不是站内跳转用 */
const SELF_HOSTS = ['bigolab.com', 'www.bigolab.com']

/**
 * 搜索引擎识别。key 是 host 里的特征串，value 是归一化后的名字。
 * 顺序有意义：先匹配到的算数，所以更长、更具体的写在前面。
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

/** 社交/社区来源。这一类在中文场景里是重要的转化来源，不该被塞进 referral 大杂烩 */
const SOCIAL_HOSTS: [string, string][] = [
  ['zhihu.com', 'zhihu'],
  ['weibo.', 'weibo'],
  ['v2ex.com', 'v2ex'],
  ['linux.do', 'linuxdo'],
  ['xiaohongshu.com', 'xiaohongshu'],
  ['bilibili.com', 'bilibili'],
  ['douban.com', 'douban'],
  ['t.co', 'twitter'],
  ['x.com', 'twitter'],
  ['twitter.com', 'twitter'],
  ['t.me', 'telegram'],
  ['qq.com', 'qq'],
  ['csdn.net', 'csdn'],
  ['juejin.cn', 'juejin'],
  ['segmentfault.com', 'segmentfault'],
  ['github.com', 'github'],
  ['reddit.com', 'reddit'],
]

export type TrafficSource = 'search' | 'direct' | 'social' | 'referral' | 'internal'

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
 */
export function classifyReferrer(referrer: string | null | undefined): Classified {
  if (!referrer) return { source: 'direct', engine: null, refHost: null }

  let host: string
  try {
    host = new URL(referrer).host.toLowerCase()
  } catch {
    // referrer 不是合法 URL（少见但真会发生），当直接访问处理，不要因此丢掉整条上报
    return { source: 'direct', engine: null, refHost: null }
  }
  if (!host) return { source: 'direct', engine: null, refHost: null }

  if (SELF_HOSTS.includes(host)) return { source: 'internal', engine: null, refHost: host }

  for (const [needle, name] of SEARCH_ENGINES) {
    if (host.includes(needle)) return { source: 'search', engine: name, refHost: host }
  }
  for (const [needle] of SOCIAL_HOSTS) {
    if (host.includes(needle)) return { source: 'social', engine: null, refHost: host }
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
    path.startsWith('/_next')
  )
}
