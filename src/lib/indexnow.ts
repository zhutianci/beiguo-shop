/**
 * IndexNow：新页面发布后主动推给搜索引擎，不用等爬虫自己回来。
 *
 * 【先把预期摆正：这个协议 Google 不支持。】
 * 支持方是 Bing、Yandex、Seznam、Naver（提交到任一端点会在成员之间共享）。
 * Google 至今没有加入，它的收录只认 sitemap 的 lastmod 与 Search Console。
 * 所以这个文件解决的是「必应几分钟收录」，不是「谷歌几分钟收录」——
 * 不要因为接了它就以为 Google 那边也变快了。
 *
 * 之所以仍然值得接：站点每小时产出新闻页，这正是 IndexNow 的典型场景；
 * 而且目标客群里用 Bing 的比例不低，成本又只有这一个文件。
 *
 * 【必须 fire-and-forget】推送失败对业务毫无影响，绝不能因为它让发布流程报错或变慢。
 * 所有异常就地吞掉，只留日志。
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow'

/** 一次最多提交多少条。协议上限 10000，这里保守取 100，够一轮发布用 */
const MAX_URLS = 100

/** 超时。推送是锦上添花，不值得为它挂住调用方 */
const TIMEOUT_MS = 8000

export function indexNowKey(): string | null {
  const k = (process.env.INDEXNOW_KEY || '').trim()
  // 协议要求 8-128 位十六进制字符
  if (!/^[a-f0-9]{8,128}$/i.test(k)) return null
  return k
}

export function indexNowConfigured(): boolean {
  return indexNowKey() !== null
}

/**
 * 推送一批 URL。
 *
 * @param urls 绝对地址，必须与 key 同一个 host
 * @returns 实际提交的条数；未配置或失败返回 0
 */
export async function submitUrls(urls: string[], origin: string): Promise<number> {
  const key = indexNowKey()
  if (!key) return 0

  let host: string
  try {
    host = new URL(origin).host
  } catch {
    return 0
  }

  // 去重 + 只保留同 host 的（IndexNow 会因为混入外域地址整批拒绝）
  const list = Array.from(new Set(urls))
    .filter((u) => {
      try {
        return new URL(u).host === host
      } catch {
        return false
      }
    })
    .slice(0, MAX_URLS)

  if (!list.length) return 0

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      // 与 lib/news/feed.ts 同一个理由：App Router 会把裸 fetch 的响应写进磁盘数据缓存
      // 并无限期复用。推送接口被缓存住意味着**第二次之后全是假成功**。
      cache: 'no-store',
      signal: ac.signal,
      body: JSON.stringify({
        host,
        key,
        // 把 key 文件放在固定路径，省得为了「文件名必须等于 key」去开一个通配路由。
        // keyLocation 是协议明确支持的做法。
        keyLocation: `${origin.replace(/\/$/, '')}/indexnow-key.txt`,
        urlList: list,
      }),
    })
    // 200/202 都算受理；4xx 一般是 key 校验不过，值得在日志里看见
    if (res.ok) {
      console.log('[indexnow]', JSON.stringify({ submitted: list.length, status: res.status }))
      return list.length
    }
    console.warn('[indexnow] 被拒绝', res.status, (await res.text().catch(() => '')).slice(0, 200))
    return 0
  } catch (e) {
    console.warn('[indexnow] 推送失败', e instanceof Error ? e.message : String(e))
    return 0
  } finally {
    clearTimeout(timer)
  }
}
