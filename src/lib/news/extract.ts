/**
 * 零依赖正文提取。
 *
 * 为什么需要：只用 RSS 的 description 当素材，摘要的信息量上限就被信源给的
 * 一两句话锁死了——换再强的模型也写不出原文里没有的细节，只会被逼着扩写（=编）。
 * 抓正文是为了「读懂」，输出仍然是自写摘要 + 外链原文，不落库原文、不对外展示原文，
 * 与整篇转载是两回事（见 SKILL.md §1.1）。
 *
 * 为什么不用 jsdom/Readability：那套 100MB+ 的依赖在 1.8G 内存的机器上不划算。
 * 这里用启发式做法——按段落密度挑正文块，对新闻类页面足够，
 * 提不出来就退回 feed 的 description，绝不硬编。
 */
import { fetchText } from './feed'

/** 单篇正文抓取上限，超过就截断——素材再多也喂不进上下文，只是徒增 token */
const MAX_CHARS = 6000
const FETCH_TIMEOUT = 9000

/** 整块移除的标签（连内容一起丢） */
const DROP_BLOCKS =
  /<(script|style|noscript|iframe|svg|form|nav|header|footer|aside|figure|figcaption|video|audio|button|select)\b[^>]*>[\s\S]*?<\/\1>/gi

/** 明显不是正文的容器：导航、评论、推荐、订阅、分享 */
const DROP_BY_CLASS =
  /<(div|section|ul|ol)\b[^>]*(class|id)\s*=\s*["'][^"']*(nav|menu|comment|related|recommend|share|social|subscribe|newsletter|sidebar|breadcrumb|advert|promo|footer|header|tag-list|author-box)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
}

/** 把一段 HTML 压成纯文本，段落之间保留换行 */
function toText(html: string): string {
  return decode(
    html
      .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

/**
 * 从整页 HTML 里挑出正文。
 * 策略：优先认 <article>；否则在所有候选块里挑「文字最多」的那个——
 * 新闻页的正文容器几乎总是纯文本量最大的块，这个启发式比维护一堆站点规则稳。
 */
export function extractMainText(html: string): string {
  let s = html.replace(DROP_BLOCKS, ' ').replace(DROP_BY_CLASS, ' ')

  // 优先 <article>
  const articles = s.match(/<article\b[^>]*>[\s\S]*?<\/article>/gi) || []
  const candidates: string[] = [...articles]

  // 常见正文容器
  const named =
    s.match(
      /<(div|section)\b[^>]*(class|id)\s*=\s*["'][^"']*(article|post|content|entry|story|main|body|detail|rich_media)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi
    ) || []
  candidates.push(...named)

  let best = ''
  for (const c of candidates) {
    const t = toText(c)
    if (t.length > best.length) best = t
  }

  // 全都提不出来就退回整页文本
  if (best.length < 200) {
    const body = s.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)
    best = toText(body ? body[1] : s)
  }

  // 去掉明显的噪音行：过短的、纯符号的、常见的功能性文案
  const lines = best
    .split('\n')
    .filter((l) => l.length >= 12)
    .filter((l) => !/^(分享|评论|登录|注册|下载|广告|相关阅读|推荐阅读|责任编辑|上一篇|下一篇|点击|扫码|关注)/.test(l))

  return lines.join('\n').slice(0, MAX_CHARS)
}

export interface ArticleText {
  url: string
  ok: boolean
  text: string
  error?: string
}

/**
 * 抓一篇原文并提取正文。失败不抛错——素材少一篇只是摘要薄一点，
 * 不该让整个 compose 段挂掉。
 */
export async function fetchArticleText(url: string): Promise<ArticleText> {
  try {
    const html = await fetchText(url, FETCH_TIMEOUT)
    const text = extractMainText(html)
    if (text.length < 120) return { url, ok: false, text: '', error: '正文过短，可能是 SPA 或付费墙' }
    return { url, ok: true, text }
  } catch (e) {
    return { url, ok: false, text: '', error: e instanceof Error ? e.message : '抓取失败' }
  }
}

/**
 * 并发抓多篇（按事件的信源列表）。限制并发数，别把单进程的事件循环堵死。
 */
export async function fetchArticles(urls: string[], concurrency = 3): Promise<ArticleText[]> {
  const out: ArticleText[] = []
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    out.push(...(await Promise.all(batch.map(fetchArticleText))))
    // 主动让出事件循环，避免抓取期间前台卡顿
    await new Promise((r) => setImmediate(r))
  }
  return out
}
