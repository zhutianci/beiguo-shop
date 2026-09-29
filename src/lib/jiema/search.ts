/**
 * 短信接码 · 服务与国家/地区搜索（docs/短信接码-设计.md §1.5、§1.6、D25）。前后端同构的纯函数、零依赖，scripts/check-jiema-search.ts 覆盖。
 *
 * 【不匹配上游代码】代码是内部标识，买家看不到，而且和中文拼音缩写大量撞车（wx=Apple、wb=WeChat、dy=Zomato、bd=X5ID、ms=NovaPoshta…）。
 * 搜索只看英文名的每个词、中文名、别名（中文俗称、全拼、拼音首字母、常见英文缩写、国内平台拼音缩写）。
 * 所以本模块的输入类型里**根本没有 code 字段**：调用方传进来的只是展示用的名字与别名，服务的身份由调用方自己的数组下标 / 对象带着。
 *
 * 【打分】完全相等 0 < 前缀 1 < 包含 2 < 模糊 3（查询长度 ≥5 时 Damerau-Levenshtein 距离 ≤1）；同分时热门在前，其次按人气。
 * 【没有「不提供」】v1.2 删除屏蔽词表（D25），任何查询要么命中服务、要么没命中（页面引导「其他服务 Any other」）。
 */

export interface SearchableService {
  /** 英文名（上游 getServicesList 的 name，如 "Google,youtube,Gmail"） */
  en: string
  /** 中文名（种子或后台填的，可能为空） */
  cn?: string | null
  aliases?: readonly string[] | null
  /** 热门序号（小的在前；null = 不是热门） */
  hot?: number | null
  /** 上游人气顺序（小的在前） */
  pop?: number | null
}

export interface SearchHit<T> {
  item: T
  score: 0 | 1 | 2 | 3
}

/**
 * 空白与标点（ASCII 标点、Latin-1 符号、通用标点、CJK 标点、全角标点、中点）。
 * 不用 \p{L} / u 标志：tsconfig 没设 target，TS 5.9 对 u 标志报错；这里列区间，汉字、字母、数字全部保留。
 */
const PUNCT_RE = /[\s\u0000-/:-@[-`{-¿×÷ -⁯←-⯿⸀-⹿　-〿・︐-︟︰-﹏＀-／：-＠［-｀｛-･]+/g

/**
 * 规范化：转小写；NFKD 后去掉变音符；全角转半角；去掉空格和标点。
 * 汉字、字母、数字保留，其余一律去掉（「B站」→「b站」、「Apple ID」→「appleid」、「+44」→「44」、「Ｔｅｌｅｇｒａｍ」→「telegram」）。
 */
export function normalize(s: string): string {
  if (!s) return ''
  let t = s.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/　/g, ' ')
  t = t.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  t = t.toLowerCase()
  return t.replace(PUNCT_RE, '')
}

/** 把一个名字拆成可匹配的片段：整体 + 按空格 / 逗号 / 斜杠 / 加号 / 括号 / 连字符拆出的每个词（「TikTok/Douyin」→ tiktokdouyin、tiktok、douyin） */
export function nameTokens(s: string | null | undefined): string[] {
  if (!s) return []
  const out = new Set<string>()
  const whole = normalize(s)
  if (whole) out.add(whole)
  for (const part of s.split(/[\s,，、/+()（）\-_|·.]+/)) {
    const n = normalize(part)
    if (n) out.add(n)
  }
  return Array.from(out)
}

/** Damerau-Levenshtein（相邻换位算一步）距离，超过 limit 提前返回 limit+1 */
export function dlDistance(a: string, b: string, limit = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  const A = Array.from(a)
  const B = Array.from(b)
  const n = A.length
  const m = B.length
  let prev2: number[] = new Array(m + 1).fill(0)
  let prev: number[] = Array.from({ length: m + 1 }, (_, j) => j)
  for (let i = 1; i <= n; i++) {
    const cur: number[] = new Array(m + 1).fill(0)
    cur[0] = i
    let rowMin = cur[0]
    for (let j = 1; j <= m; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && A[i - 1] === B[j - 2] && A[i - 2] === B[j - 1]) v = Math.min(v, prev2[j - 2] + 1)
      cur[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > limit) return limit + 1
    prev2 = prev
    prev = cur
  }
  return prev[m]
}

/** 一个片段对查询的得分（越小越好；null = 不匹配） */
function tokenScore(q: string, tok: string): 0 | 1 | 2 | 3 | null {
  if (!tok) return null
  if (tok === q) return 0
  if (tok.startsWith(q)) return 1
  if (tok.includes(q)) return 2
  if (Array.from(q).length >= 5 && dlDistance(q, tok, 1) <= 1) return 3
  return null
}

/** 一个服务所有可匹配的片段（英文名每个词、中文名、别名；**不含代码**） */
export function serviceTokens(s: SearchableService): string[] {
  const out = new Set<string>()
  for (const t of nameTokens(s.en)) out.add(t)
  for (const t of nameTokens(s.cn ?? null)) out.add(t)
  for (const a of s.aliases ?? []) {
    const n = normalize(a)
    if (n) out.add(n)
  }
  return Array.from(out)
}

/** 一个服务对查询的最好得分（null = 没命中） */
export function scoreService(qNorm: string, s: SearchableService, tokens?: readonly string[]): 0 | 1 | 2 | 3 | null {
  if (!qNorm) return null
  let best: 0 | 1 | 2 | 3 | null = null
  for (const t of tokens ?? serviceTokens(s)) {
    const sc = tokenScore(qNorm, t)
    if (sc != null && (best == null || sc < best)) best = sc
    if (best === 0) break
  }
  return best
}

const rankOf = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER)

/**
 * 搜服务：返回命中的服务，按「得分 → 热门（有热门序号的在前、序号小的在前）→ 人气」排序。
 * 查询规范化后为空 → 空数组（页面显示默认列表，不是「没命中」）。
 */
export function searchServices<T extends SearchableService>(query: string, list: readonly T[], opts: { limit?: number; tokens?: ReadonlyMap<T, readonly string[]> } = {}): SearchHit<T>[] {
  const q = normalize(query)
  if (!q) return []
  const hits: SearchHit<T>[] = []
  for (const s of list) {
    const sc = scoreService(q, s, opts.tokens?.get(s))
    if (sc != null) hits.push({ item: s, score: sc })
  }
  hits.sort((a, b) => a.score - b.score || rankOf(a.item.hot) - rankOf(b.item.hot) || rankOf(a.item.pop) - rankOf(b.item.pop))
  return opts.limit ? hits.slice(0, opts.limit) : hits
}

/**
 * 输入法组字期间不过滤（§1.5 第 1 条）：组字中返回上一次提交的查询，组字结束（compositionend）再按最终文字过滤。
 * 页面用它决定「当前拿什么去搜」。
 */
export function effectiveQuery(input: string, composing: boolean, lastCommitted: string): string {
  return composing ? lastCommitted : input
}

// ───────────────────────── 国家/地区 ─────────────────────────

export interface SearchableCountry {
  name: string
  en: string
  iso2?: string | null
  dial?: string | null
}

/**
 * 搜国家/地区（§1.6）：中文名、英文名、ISO 代码、区号都可以（「+44」「44」都能命中英国）。
 * 区号只认前缀相等（输入 4 不会命中所有 +4x）：查询是纯数字时按区号完全相等 0 / 前缀 1 计分。
 */
export function scoreCountry(query: string, c: SearchableCountry): 0 | 1 | 2 | 3 | null {
  const q = normalize(query)
  if (!q) return null
  let best: 0 | 1 | 2 | 3 | null = null
  const take = (sc: 0 | 1 | 2 | 3 | null) => {
    if (sc != null && (best == null || sc < best)) best = sc
  }
  if (/^\d+$/.test(q)) {
    const d = normalize(c.dial ?? '')
    if (d) take(d === q ? 0 : d.startsWith(q) ? 1 : null)
    return best
  }
  for (const t of [...nameTokens(c.name), ...nameTokens(c.en)]) take(tokenScore(q, t))
  const iso = normalize(c.iso2 ?? '')
  if (iso && iso === q) take(0)
  return best
}

export function searchCountries<T extends SearchableCountry>(query: string, list: readonly T[]): T[] {
  const q = normalize(query)
  if (!q) return list.slice()
  const scored: { c: T; s: number; i: number }[] = []
  list.forEach((c, i) => {
    const s = scoreCountry(query, c)
    if (s != null) scored.push({ c, s, i })
  })
  scored.sort((a, b) => a.s - b.s || a.i - b.i)
  return scored.map((x) => x.c)
}
