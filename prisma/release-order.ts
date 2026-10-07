/**
 * 定时放量的发布顺序（内容扩容 2026-10-07，docs/内容平台/扩容基础设施-1007.md）。
 *
 * 纯函数、零依赖：prisma/import-seed-content.ts（生产里在临时容器跑，不能 import src/）与 scripts/check-content-policy.ts 共用。
 *
 * 目标：每天放出的那一批是「混合」的——提示词 / 教程 / 应用按总量比例都有，图像 / 视频 / 文本与各个主题也按比例分散，
 * 而不是今天 40 条全是证件照、明天 40 条全是论文写作（那正是「批量生成的规模化内容」的样子）。
 *
 * 做法（分层按比例均匀散布）：分桶键是「类型 | 大类 | 第一个主题（教程取第一个产品）」三层。
 *  - 最里层（同一个主题桶）：按 key 的哈希稳定洗牌；
 *  - 往外每一层：把各子组已经排好的序列合并——大小为 n、相位为 φ 的子组，第 i 条落在位置 (i + φ) / n，按位置归并；
 *    各子组的相位在 (0, 1) 里均匀错开。等大的子组于是轮流出现（轮询），大小不同的按比例穿插。
 * 先在类型层按比例，再在大类层、主题层按比例：任意连续 N 条里，每种类型、每个大类、每个主题桶出现的条数
 * ≈ N × 它的占比（每层误差在 1 条左右）。只在最里层分桶而不分层的话，同样大小的几十个桶会挤在相同位置上，
 * 某一天就会多出一大截文本提示词、另一天几乎没有（check-content-policy 的「按比例」用例就是钉这个的）。
 */

export interface ReleaseItem {
  /** 稳定、唯一：类型 + slug（没有 slug 用 id） */
  key: string
  /** 分桶键，用 bucketOf 生成 */
  bucket: string
}

/** 32 位 FNV-1a */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** [0, 1) 的稳定伪随机数 */
export function hashUnit(s: string): number {
  return fnv1a(s) / 0x100000000
}

export function bucketOf(type: string, facet: string | null | undefined, first: string | null | undefined): string {
  return `${type}|${facet ?? ''}|${first ?? ''}`
}

export function releaseOrder<T extends ReleaseItem>(items: readonly T[]): T[] {
  return orderLevel([...items], 0)
}

const keyCmp = (a: { key: string }, b: { key: string }) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)

function orderLevel<T extends ReleaseItem>(items: T[], level: number): T[] {
  const parts = (it: T) => it.bucket.split('|')
  const depth = items.reduce((d, it) => Math.max(d, parts(it).length), 0)
  if (level >= depth) {
    // 最里层：稳定洗牌（按哈希，并列时按 key 本身，保证全序）
    return items
      .map((it) => ({ it, h: hashUnit(`${it.bucket}#${it.key}`) }))
      .sort((a, b) => a.h - b.h || keyCmp(a.it, b.it))
      .map((x) => x.it)
  }
  const groups = new Map<string, T[]>()
  for (const it of items) {
    const g = parts(it)[level] ?? ''
    const list = groups.get(g)
    if (list) list.push(it)
    else groups.set(g, [it])
  }
  // 各子组的起点相位错开：第 k 个子组（按组名哈希排）相位 (k + 0.5) / 组数。不错开的话，等大的子组会挤在同样的位置上，
  // 排出来是「十个不同组的各一条」连成一串、再「大组的几条」连成一串，摊到每天就是某一天同一个桶出现三四次
  const names = Array.from(groups.keys()).sort((a, b) => hashUnit(`G${level}#${a}`) - hashUnit(`G${level}#${b}`) || (a < b ? -1 : 1))
  const placed: { it: T; pos: number; tie: number }[] = []
  names.forEach((g, k) => {
    const ordered = orderLevel(groups.get(g)!, level + 1)
    const n = ordered.length
    const phase = (k + 0.5) / names.length
    ordered.forEach((it, i) => placed.push({ it, pos: (i + phase) / n, tie: hashUnit(`L${level}#${g}#${i}`) }))
  })
  placed.sort((a, b) => a.pos - b.pos || a.tie - b.tie || keyCmp(a.it, b.it))
  return placed.map((p) => p.it)
}
