/**
 * 新闻 → 成交的归因（客户端）。
 *
 * 想回答的问题只有一个：「哪条新闻带来了成交」。
 * 做法沿用已有的内推码范式（lib/ref.ts）：从 URL 捕获标记 → 写 localStorage →
 * 下单时读出来带上。刻意不种 cookie、不打服务端埋点接口——
 * 归因是运营分析，不值得为它增加一次请求，更不值得引入跨页面追踪。
 *
 * 【30 天窗口】比内推码的口径短：新闻的转化多发生在当次会话或几天内，
 * 窗口开太长会把「一个月前偶然读过一条新闻」的自然流量算成新闻带来的成交，
 * 高估效果反而误导选题。
 *
 * 【只存 slug，不存链路】不记录用户看过哪些页、停留多久。
 * 一旦开始拼装浏览轨迹，性质就从「运营统计」变成「个人信息处理」，
 * 要走告知同意那一整套，成本远超收益。
 *
 * 【落库需要主进程决策】把 slug 写进订单需要改 Order 表（加一列），
 * 本轮不动 schema。当前实现只负责在浏览器侧把标记捕获并保存下来，
 * 下单接口怎么接由主进程定，见交接说明。
 */

import { readChannel } from './share'

const KEY = 'news_ref'
const WINDOW_MS = 30 * 86400000 // 30 天

export interface NewsRef {
  /** 来源新闻的 slug */
  slug: string
  /** 分享渠道单字符编码，见 lib/news/share.ts，可能没有 */
  channel?: string
  /** 捕获时刻 */
  at: number
}

/** slug 有长度上限（schema 里 VarChar(90)），也顺手挡掉塞垃圾进 localStorage 的行为 */
const SLUG_RE = /^[A-Za-z0-9一-龥_-]{1,90}$/

function read(): NewsRef | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as NewsRef
    if (!v || typeof v.slug !== 'string' || typeof v.at !== 'number') return null
    if (Date.now() - v.at > WINDOW_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return v
  } catch {
    return null
  }
}

/**
 * 在商品页/落地页调用：把 URL 上的 ?n=<新闻 slug> 捕获下来。
 * 已有记录会被新的覆盖——「最后一次接触」口径，与内推码一致，避免两套归因打架。
 */
export function captureNewsRef(): NewsRef | null {
  if (typeof window === 'undefined') return null
  try {
    const q = new URLSearchParams(window.location.search)
    const slug = (q.get('n') || '').trim()
    if (slug && SLUG_RE.test(slug)) {
      // 渠道过一遍白名单：URL 参数是外部输入，不校验就直接存进 localStorage
      // 等于让任意人往这条统计里塞任意字符串
      const v: NewsRef = {
        slug,
        channel: readChannel(window.location.search) || undefined,
        at: Date.now(),
      }
      localStorage.setItem(KEY, JSON.stringify(v))
      return v
    }
  } catch {
    // 隐私模式写不进去就算了，归因缺一条不影响下单
  }
  return read()
}

/** 下单时读出来。返回 null 表示这单没有新闻来源 */
export function getNewsRef(): NewsRef | null {
  return read()
}

/** 成交后清掉，避免同一次点击被反复记到后续订单上 */
export function clearNewsRef(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 忽略
  }
}

/**
 * 给新闻页里指向商品的链接加来源标记。
 * 参数名用单字符 `n`，与分享渠道的 `s` 一样是为了控制 URL 长度——
 * 这些链接可能会被塞进海报二维码，长 UTM 会把二维码版本推高、拉低识别率。
 */
export function withNewsRef(href: string, slug: string): string {
  const [base, hash] = href.split('#')
  const [path, query] = base.split('?')
  const params = new URLSearchParams(query || '')
  params.set('n', slug)
  return `${path}?${params.toString()}${hash ? `#${hash}` : ''}`
}
