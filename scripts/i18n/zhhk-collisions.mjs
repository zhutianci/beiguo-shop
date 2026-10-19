#!/usr/bin/env node
/**
 * 词组「抢匹配」检查（docs/繁体香港版/设计.md §4.4）。
 *
 * 正向最大匹配有一个固有毛病：前一个字和后一个词的头可能先组成一个不相干的词组，把后面的词截断——
 * 例如「被复制」里「被复」先被当成一个词（→被複），「复制」就只剩「制」，结果是「被複制」。OpenCC 本身也有这个问题。
 * 检查办法：对语料里每个高频词，在每一处出现位置上比较「上下文里转出来的样子」和「这个词单独转出来的样子」，
 * 不一致的就是被抢了，按（上下文三字窗口）汇总。修法是在 vocab-hk.tsv 里补一条更长的词（如 被复制→被複製）。
 *
 * 用法：node scripts/i18n/zhhk-collisions.mjs --db <db-corpus.tsv> [--min 3]
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const { loadDefault } = createRequire(import.meta.url)(path.join(ROOT, 'zhhk', 'convert.cjs'))
const conv = loadDefault()
const arg = (k, d) => {
  const i = process.argv.indexOf(k)
  return i > 0 ? process.argv[i + 1] : d
}
const MIN = Number(arg('--min', 2))

let corpus = ''
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) {
      if (!/^(admin|partner|bot|marketing)$/.test(e.name)) walk(p)
    } else if (/\.tsx?$/.test(e.name)) corpus += '\n' + fs.readFileSync(p, 'utf8')
  }
}
walk(path.join(ROOT, 'src'))
if (arg('--db')) corpus += '\n' + fs.readFileSync(arg('--db'), 'utf8')

// 语料里的高频双字、三字词（只看由汉字组成、单独转换后与逐字不同或在词典里的）
const runs = corpus.match(/[㐀-鿿]{2,}/g) || []
const gram = new Map()
for (const r of runs) {
  for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= r.length; i++) gram.set(r.substr(i, n), (gram.get(r.substr(i, n)) || 0) + 1)
}
const words = [...gram.entries()].filter(([, c]) => c >= 20).map(([w]) => w)
const wordSet = new Set(words)

const bad = new Map() // window → {n, word, ctx, got, want}
for (const r of runs) {
  const out = conv.convert(r)
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i + n <= r.length; i++) {
      const w = r.substr(i, n)
      if (!wordSet.has(w)) continue
      const want = conv.convert(w)
      const got = out.substr(i, n)
      if (got === want) continue
      // 只有「单独转换」本身经过词组（不是逐字）才算被抢；逐字词在上下文里被更长词组覆盖是正常的
      const a = Math.max(0, i - 1)
      const key = r.slice(a, i + n + 1)
      const b = bad.get(key) || { n: 0, word: w, ctx: r.slice(Math.max(0, i - 6), i + n + 6), got: out.slice(a, i + n + 1), want }
      b.n++
      bad.set(key, b)
    }
  }
}
const rows = [...bad.entries()].filter(([, b]) => b.n >= MIN).sort((x, y) => y[1].n - x[1].n)
console.log(`高频词 ${words.length} 个，被上下文改写的窗口 ${bad.size} 个（≥${MIN} 次 ${rows.length} 个）`)
for (const [k, b] of rows.slice(0, Number(arg('--top', 150)))) console.log(`${b.n}\t${k}\t→ ${b.got}\t（「${b.word}」单独是 ${b.want}）\t${b.ctx}`)
