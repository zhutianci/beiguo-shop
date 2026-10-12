/**
 * 热度分。规范见 SKILL.md §3.5。
 *
 * 硬要求：可解释、可复现。每个加分项独立成列，明细落 scoreDebug，
 * 后台能看到「这条为什么排第一」。不做任何玄学加权。
 */

export interface ScoreInput {
  sourceCount: number // 跨源交叉验证（已按 urlHash 去重后的 distinct sourceId 数）
  tier1Count: number // 一手官方源命中数
  hnPoints: number
  viewCount: number // 站内浏览（已按 viewerKey + 小时桶去重）
  shareCount: number
  likeCount: number
  aiScore: number // 模型给的重要性 0-100
  happenedAt: Date
  now?: Date
}

export interface ScoreBreakdown {
  score: number
  base: number
  decay: number
  parts: { key: string; label: string; raw: number; points: number }[]
}

const WEIGHTS = {
  sourceCount: 2.0,
  tier1Count: 1.5,
  hnPoints: 1.2,
  viewCount: 0.6,
  shareCount: 1.0,
  likeCount: 0.5,
  aiScore: 1.5,
}

/** 36 小时半衰期：一天前的事件权重减半，三天前约剩 1/4 */
const HALF_LIFE_HOURS = 36

const log10p = (n: number) => Math.log10(1 + Math.max(0, n))
const r3 = (n: number) => Math.round(n * 1000) / 1000

export function computeScore(input: ScoreInput): ScoreBreakdown {
  const now = input.now ?? new Date()
  const ageHours = Math.max(0, (now.getTime() - input.happenedAt.getTime()) / 3600000)
  const decay = Math.pow(0.5, ageHours / HALF_LIFE_HOURS)

  const parts = [
    { key: 'sourceCount', label: '跨源报道', raw: input.sourceCount, points: input.sourceCount * WEIGHTS.sourceCount },
    { key: 'tier1Count', label: '一手信源', raw: input.tier1Count, points: input.tier1Count * WEIGHTS.tier1Count },
    { key: 'hnPoints', label: 'HN 讨论', raw: input.hnPoints, points: log10p(input.hnPoints) * WEIGHTS.hnPoints },
    { key: 'viewCount', label: '站内浏览', raw: input.viewCount, points: log10p(input.viewCount) * WEIGHTS.viewCount },
    { key: 'shareCount', label: '分享', raw: input.shareCount, points: input.shareCount * WEIGHTS.shareCount },
    { key: 'likeCount', label: '点赞', raw: input.likeCount, points: input.likeCount * WEIGHTS.likeCount },
    { key: 'aiScore', label: 'AI 重要性', raw: input.aiScore, points: (input.aiScore / 100) * WEIGHTS.aiScore },
  ].map((p) => ({ ...p, points: r3(p.points) }))

  const base = r3(parts.reduce((s, p) => s + p.points, 0))
  return { score: r3(base * decay), base, decay: r3(decay), parts }
}

/**
 * 摘要与原材料的重合率。用于幻觉防线：
 * 过低（< OVERLAP_MIN）可能是脱离材料编造，过高（> OVERLAP_MAX）可能是整段抄原文。
 * 用中文 2-gram，对中英混排都够用且零依赖。
 */
export function overlapRatio(summary: string, materials: string): number {
  const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
  const a = norm(summary)
  const b = norm(materials)
  if (a.length < 4 || b.length < 4) return 0

  const grams = (s: string) => {
    const set = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
    return set
  }
  const ga = grams(a)
  const gb = grams(b)
  let hit = 0
  ga.forEach((g) => {
    if (gb.has(g)) hit++
  })
  return ga.size ? hit / ga.size : 0
}

/**
 * 数字回查：摘要里出现的数字/版本号，必须能在原材料里找到。
 * 能力边界见 SKILL.md §7——它拦不住实体关系颠倒，不能宣称零幻觉。
 *
 * 【2026-10-12 补两类等价写法】英文材料写成中文时，数字的「字面」会变而「数值」不变，
 * 原来只比字面，把这两类全判成了「材料里没有的数字」（全文层被整块丢弃的头号原因之一）：
 *   ① 数量级换算：1.3 million → 130 万、1 billion → 10 亿、$500M → 5 亿美元；
 *   ② 月份：October 30th → 10 月 30 日。
 * 自己算出来的数（两个百分比相减得到的「提升 15.4 个百分点」）仍然算材料里没有 —— 那确实是材料里没有的数字。
 */
const CN_UNITS: [string, number][] = [
  ['万亿', 1e12], ['千亿', 1e11], ['百亿', 1e10], ['十亿', 1e9], ['亿', 1e8],
  ['千万', 1e7], ['百万', 1e6], ['十万', 1e5], ['万', 1e4], ['千', 1e3],
]
const EN_UNITS: Record<string, number> = {
  thousand: 1e3, k: 1e3, million: 1e6, mn: 1e6, m: 1e6, billion: 1e9, bn: 1e9, b: 1e9, trillion: 1e12, tn: 1e12, t: 1e12,
}
const EN_WORD_NUM: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  half: 0.5, hundred: 100,
}
const EN_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** 材料里所有「带数量级的数」换算成的绝对值（英文 million / billion / k / M / B，中文 万 / 亿 …） */
function magnitudesIn(materials: string): number[] {
  const out: number[] = []
  const s = materials.replace(/[,，]/g, '')
  const en = /(\d+(?:\.\d+)?|\b(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|half)\b)[\s-]*(?:a\s+)?(hundred\s+)?(thousand|million|billion|trillion|mn|bn|tn|k|m|b|t)\b/gi
  let m: RegExpExecArray | null
  while ((m = en.exec(s))) {
    const head = m[1].toLowerCase()
    const base = /^\d/.test(head) ? Number(head) : EN_WORD_NUM[head]
    const unit = EN_UNITS[m[3].toLowerCase()]
    if (base == null || !unit) continue
    out.push(base * (m[2] ? 100 : 1) * unit)
  }
  const cn = /(\d+(?:\.\d+)?)\s*(万亿|千亿|百亿|十亿|亿|千万|百万|十万|万|千)/g
  while ((m = cn.exec(s))) {
    const unit = CN_UNITS.find(([u]) => u === m![2])
    if (unit) out.push(Number(m[1]) * unit[1])
  }
  return out
}

function sameValue(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * 1e-6
}

export function unsupportedNumbers(summary: string, materials: string): string[] {
  const norm = (s: string) => s.replace(/[,，\s]/g, '')
  const mat = norm(materials)
  const matLower = materials.toLowerCase()
  let mags: number[] | null = null
  const bad: string[] = []
  const re = /\d+(?:\.\d+)?%?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(summary))) {
    const raw = m[0]
    const n = norm(raw)
    // 一位数与年份太容易巧合，不作为判据
    if (n.replace(/[.%]/g, '').length <= 1) continue
    if (mat.includes(n)) continue
    const tail = summary.slice(m.index + raw.length, m.index + raw.length + 4).replace(/^\s+/, '')
    // ② 月份：10 月 ←→ October / Oct
    if (/^月/.test(tail) && /^\d{1,2}$/.test(n)) {
      const name = EN_MONTHS[Number(n) - 1]
      if (name && new RegExp(`\\b${name}`, 'i').test(matLower)) continue
    }
    // ① 数量级换算：130 万 ←→ 1.3 million
    if (!raw.endsWith('%')) {
      const unit = CN_UNITS.find(([u]) => tail.startsWith(u))
      if (unit) {
        if (!mags) mags = magnitudesIn(materials)
        const value = Number(n) * unit[1]
        if (mags.some((v) => sameValue(v, value))) continue
      }
    }
    bad.push(raw)
  }
  return Array.from(new Set(bad))
}

/**
 * 连续 N 字重合检测（照抄防线）。overlapRatio 用的是 2-gram 集合相似度，抓不住
 * 「整句照抄但整体改写率不高」的情况，这里补一道连续片段的硬检查。
 *
 * 【只认以中文为主的片段】比较前会去掉空白，所以英文专有名词一长就必然「连续重合」：
 * Andreessen Horowitz、TechCrunch Disrupt 2026、GLM-5.3-Highspeed、论文标题、安装命令……
 * 这些本来就应该原样写，不是照抄。2026-10-12 用线上素材实验，被这一条丢掉的全文里大半是这种误判。
 * 所以一个窗口里中日韩文字不到一半就不算数；中文材料的整句搬运（一半以上是汉字）照样拦得住。
 */
export function sharedRun(text: string, materials: string, n = 20): string | null {
  const a = text.replace(/\s+/g, '')
  const b = materials.replace(/\s+/g, '')
  if (a.length < n || b.length < n) return null
  const isCjk = (c: string) => /[\u3400-\u9fff]/.test(c)
  let cjk = 0
  for (let i = 0; i < n; i++) if (isCjk(a[i])) cjk++
  for (let i = 0; i + n <= a.length; i++) {
    if (i > 0) {
      if (isCjk(a[i - 1])) cjk--
      if (isCjk(a[i + n - 1])) cjk++
    }
    if (cjk * 2 < n) continue
    const g = a.slice(i, i + n)
    if (b.includes(g)) return g
  }
  return null
}

/**
 * 长文（全文层）的照抄度量：最长的一段逐字重合有多长、逐字重合的内容占全文多少。
 *
 * 【为什么长文不能沿用「连续 N 字」一刀切】摘要只有两百来字，连续 20 字重合基本就是抄了一句。
 * 全文层有六百到一千多字，材料又是中文时，职位名单（「Agent 评测工程师、LLM 算法工程师」）、
 * 文件与产品的全称（《关于进一步加强……的通知》）、带单位的指标句，本来就该原样写，随手就超过 18 个字。
 * 2026-10-12 用线上素材实验：中文来源的 4 条全文，写两稿都过不了「连续 18 字」，等于中文新闻永远没有全文。
 * 真正要拦的是两件事：**整句搬运**（最长重合段）和**大面积搬运**（重合占比），所以分开量。
 *
 * 口径与 sharedRun 一致：比较前去空白；只统计以中文为主的重合段（英文专有名词不算）。
 * minRun 以下的短重合不计入占比 —— 十来个字以内的重合在同一件事的两种写法里是常态。
 */
export function copiedStats(text: string, materials: string, minRun = 12): { longest: string; ratio: number } {
  const a = text.replace(/\s+/g, '')
  const b = materials.replace(/\s+/g, '')
  if (a.length < minRun || b.length < minRun) return { longest: '', ratio: 0 }
  const isCjk = (c: string) => /[㐀-鿿]/.test(c)
  let longest = ''
  let covered = 0
  let i = 0
  while (i + minRun <= a.length) {
    if (!b.includes(a.slice(i, i + minRun))) {
      i++
      continue
    }
    let len = minRun
    while (i + len < a.length && b.includes(a.slice(i, i + len + 1))) len++
    const run = a.slice(i, i + len)
    let cjk = 0
    for (const c of run) if (isCjk(c)) cjk++
    if (cjk * 2 >= run.length) {
      covered += len
      if (len > longest.length) longest = run
    }
    i += len
  }
  return { longest, ratio: covered / a.length }
}

/**
 * §1.1 禁词回查：页面上出现「记者」「编辑部」「独家」这类字样，等于自证在做采编发布。
 * 提示词里已经写了不许用，但提示词是软约束 —— 这是落库前的硬闸。
 * 命中返回那个词，没命中返回 null。
 */
const FORBIDDEN_WORDS = ['记者', '编辑部', '独家', '爆料', '本站原创', '本网讯', '本报讯', '特约撰稿'] as const

export function forbiddenHit(text: string): string | null {
  const t = (text || '').replace(/\s+/g, '')
  for (const w of FORBIDDEN_WORDS) {
    if (t.includes(w)) return w
  }
  return null
}

/**
 * §1.2 选题黑名单的**兜底**回查（不是主闸，主闸在 triage）。
 *
 * 【为什么需要这一道】triage 判定时看到的只有标题 + feed 的 description；
 * 而 compose 会去抓原文正文，detail 更是直接从正文扩写。
 * 一篇标题看着是「某公司发布新模型」的稿子，正文里完全可能带出出口管制、
 * 监管处罚、大规模裁员 —— 那部分内容 triage 从来没看过。
 *
 * 这里用关键词兜，刻意从严：宁可丢掉一段 detail，也不要让政策解读进正文。
 * 关键词表是 TOPIC_BLOCKLIST 的可机检子集，两者要一起维护。
 */
const BLOCKLIST_KEYWORDS = [
  // 监管与立法
  '监管立法', 'AI 法案', 'AI法案', '算法备案', '行政处罚', '合规罚款', '反垄断调查', '被约谈', '责令整改',
  // 出口管制与制裁
  '出口管制', '实体清单', '制裁', '贸易战', '技术封锁', '禁售', '断供',
  // 国家级与军事
  '国防部', '军方采购', '政府采购', '国家战略', '军事应用', '情报机构',
  // 劳资
  '大规模裁员', '集体诉讼', '罢工', '劳资纠纷',
  // 平台处置
  '应用下架', '被下架', '数据泄露处罚',
] as const

export function blocklistHit(text: string): string | null {
  const t = (text || '').replace(/\s+/g, '')
  for (const w of BLOCKLIST_KEYWORDS) {
    if (t.includes(w.replace(/\s+/g, ''))) return w
  }
  return null
}

/** 是否需要人工复核（全自动发布，但可疑条目不进首页与重点榜） */
export function needsReview(opts: {
  confidence: number
  overlap: number
  unsupported: string[]
  sourceCount: number
  maxTier: number
}): { flag: boolean; reason: string | null } {
  if (opts.confidence < 0.7) return { flag: true, reason: `分诊置信度偏低 ${opts.confidence.toFixed(2)}` }
  if (opts.unsupported.length) return { flag: true, reason: `摘要含原文未出现的数字：${opts.unsupported.slice(0, 3).join('、')}` }
  if (opts.overlap < 0.15) return { flag: true, reason: `与原文重合率过低 ${(opts.overlap * 100).toFixed(0)}%，可能脱离材料` }
  if (opts.overlap > 0.55) return { flag: true, reason: `与原文重合率过高 ${(opts.overlap * 100).toFixed(0)}%，可能接近转载` }
  if (opts.sourceCount === 1 && opts.maxTier >= 3) return { flag: true, reason: '仅单一社区信源，未获交叉验证' }
  return { flag: false, reason: null }
}
