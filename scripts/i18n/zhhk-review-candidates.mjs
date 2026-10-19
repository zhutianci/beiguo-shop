#!/usr/bin/env node
/**
 * 从全站文案里找出「机器转繁体可能出错」的地方，供 DeepSeek 审校（docs/繁体香港版/设计.md §4.3）。
 *
 * OpenCC 的错误只会出在「一简对多繁」的字上（发→發/髮、后→後/后、干→乾/幹/干、面→面/麵…）：
 *  A. 词组决定：语料里实际命中的 OpenCC 词组，且词组给出的写法与逐字默认不同（如 发卡→髮卡）——词组本身可能不合本站语境；
 *  B. 逐字默认：没有词组覆盖、按单字默认转换的多义字，取「前后各两字」的小窗口（如 即时发货）。
 * 两类都按出现次数去重排序，输出 JSON 给 zhhk-deepseek-review.mjs。
 *
 * 语料：src 里的源码（去掉注释；后台、渠道后台、机器人、营销邮件不转繁体，不收）+ 可选的数据库导出（TSV，见 --db）。
 * 用法：node scripts/i18n/zhhk-review-candidates.mjs --db <db-corpus.tsv> --out <candidates.json> --occ <opencc-js 目录>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const arg = (k, d) => {
  const i = process.argv.indexOf(k)
  return i > 0 ? process.argv[i + 1] : d
}
const OUT = arg('--out', 'zhhk-candidates.json')
const DB = arg('--db', '')
const OCC = arg('--occ', process.env.OPENCC_JS_DIR || path.join(ROOT, 'node_modules', 'opencc-js'))

const { loadDefault } = await import(pathToFileURL(path.join(ROOT, 'zhhk', 'convert.cjs')).href)
const conv = loadDefault()
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'zhhk', 'dict.json'), 'utf8'))
const charMap = new Map(dict.chars)
const phraseMap = new Map(dict.phrases)
const maxLenByFirst = new Map()
for (const k of phraseMap.keys()) maxLenByFirst.set(k[0], Math.max(maxLenByFirst.get(k[0]) || 0, k.length))

// 一简对多繁的字：opencc-js 的单字表只留了首选写法，所以从词组表里按位置对齐统计——同一个简体字在不同词组里
// 被写成两种以上繁体（发→發/髮、后→後/后、干→乾/幹/干），就是多义字
const variants = new Map()
const note = (k, v) => {
  const ks = [...k]
  const vs = [...v]
  if (ks.length !== vs.length) return
  ks.forEach((c, i) => {
    let set = variants.get(c)
    if (!set) variants.set(c, (set = new Set()))
    set.add(vs[i])
  })
}
for (const [k, v] of dict.phrases) note(k, v)
for (const [k, v] of dict.chars) note(k, v)
const AMBIG = new Set([...variants.entries()].filter(([, set]) => set.size > 1).map(([c]) => c))
void OCC

// ---- 语料 ----
const SKIP_DIR = /[\\/](admin|partner|bot|marketing)[\\/]|[\\/]components[\\/]admin[\\/]/
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (/\.(tsx?|mjs)$/.test(e.name)) yield p
  }
}
const texts = [] // { src, text }
for (const f of walk(path.join(ROOT, 'src'))) {
  if (SKIP_DIR.test(f)) continue
  let s = fs.readFileSync(f, 'utf8')
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:"'`])\/\/.*$/gm, '$1')
  texts.push({ src: 'code:' + path.relative(ROOT, f).replace(/\\/g, '/'), text: s })
}
if (DB) {
  for (const line of fs.readFileSync(DB, 'utf8').split('\n')) {
    // mysql -B 把字段里的制表符、换行写成字面的 \t、\n
    const [kind, a, b] = line.split(/\t|\\t/)
    if (!kind) continue
    texts.push({ src: 'db:' + kind, text: `${a || ''}\n${(b || '').replace(/\\n/g, '\n')}` })
  }
}

const HAN = /[㐀-䶿一-鿿]+/g
const phraseHits = new Map() // key → { v, n, ctx, srcs:Set }
const charHits = new Map() // window → { v, n, ctx }

function scanRun(run, src) {
  const out = conv.convert(run)
  let i = 0
  while (i < run.length) {
    const c = run[i]
    const maxLen = maxLenByFirst.get(c)
    let len = 0
    if (maxLen) {
      for (let l = Math.min(maxLen, run.length - i); l >= 2; l--) {
        if (phraseMap.has(run.substr(i, l))) {
          len = l
          break
        }
      }
    }
    if (len) {
      const k = run.substr(i, len)
      const v = phraseMap.get(k)
      const byChar = [...k].map((ch) => charMap.get(ch) || ch).join('')
      if (v !== byChar) {
        const h = phraseHits.get(k) || { v, n: 0, ctx: '', srcs: new Set() }
        h.n++
        if (!h.ctx) h.ctx = run.slice(Math.max(0, i - 6), i + len + 6)
        if (h.srcs.size < 3) h.srcs.add(src)
        phraseHits.set(k, h)
      }
      i += len
      continue
    }
    if (AMBIG.has(c)) {
      const a = Math.max(0, i - 2)
      const b = Math.min(run.length, i + 3)
      const w = run.slice(a, b)
      const h = charHits.get(w) || { v: out.slice(a, b), n: 0, ctx: '', srcs: new Set() }
      h.n++
      if (!h.ctx) h.ctx = run.slice(Math.max(0, i - 8), i + 9)
      if (h.srcs.size < 3) h.srcs.add(src)
      charHits.set(w, h)
    }
    i++
  }
}

for (const { src, text } of texts) {
  for (const m of text.matchAll(HAN)) scanRun(m[0], src.startsWith('code:') ? 'code' : src)
}

const fmt = (map, kind) =>
  [...map.entries()]
    .map(([k, h]) => ({ kind, k, v: h.v, n: h.n, ctx: h.ctx, ctxHk: conv.convert(h.ctx), code: h.srcs.has('code') }))
    .sort((x, y) => Number(y.code) - Number(x.code) || y.n - x.n)

const phrases = fmt(phraseHits, 'phrase')
const chars = fmt(charHits, 'char')
fs.writeFileSync(OUT, JSON.stringify({ phrases, chars }, null, 0))
console.log(
  `语料 ${texts.length} 段；多义字 ${AMBIG.size} 个；词组决定 ${phrases.length} 个（源码里 ${phrases.filter((p) => p.code).length}）；` +
    `逐字窗口 ${chars.length} 个（源码里 ${chars.filter((p) => p.code).length}，出现≥3 次 ${chars.filter((p) => p.n >= 3).length}）→ ${OUT}`,
)
