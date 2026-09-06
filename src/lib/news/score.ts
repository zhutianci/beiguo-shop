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
 */
export function unsupportedNumbers(summary: string, materials: string): string[] {
  const norm = (s: string) => s.replace(/[,，\s]/g, '')
  const mat = norm(materials)
  const found = summary.match(/\d+(?:\.\d+)?%?/g) || []
  const bad: string[] = []
  for (const raw of found) {
    const n = norm(raw)
    // 一位数与年份太容易巧合，不作为判据
    if (n.replace(/[.%]/g, '').length <= 1) continue
    if (!mat.includes(n)) bad.push(raw)
  }
  return Array.from(new Set(bad))
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
