#!/usr/bin/env node
/**
 * 生成 zhhk/dict.json（简体 → 香港繁体 的单字表 + 词组表），见 docs/繁体香港版/设计.md §4。
 *
 * 来源三层，后者覆盖前者：
 *   1. OpenCC 的 STCharacters + STPhrases（简 → OpenCC 标准繁体，Apache-2.0）
 *   2. 字形调整 GLYPH：OpenCC 标准繁体里有一批「旧字形」（爲、衆、僞、啓…），香港与台湾网页都不用，换成通行字形；
 *      刻意**不用** OpenCC 的 HKVariants（説、户、税、衞…）：那是《常用字字形表》的字形，而香港网页、银行、税局
 *      实际输入的是 Big5 一系的 說、戶、稅、衛（香港用户搜索时打出来的也是这些）
 *   3. zhhk/vocab-hk.tsv：香港用词覆盖（帳號、登入、教學、電郵…），并且**写进所有包含它的 OpenCC 词组**，
 *      否则「设置项」这类长词组会抢先匹配、把覆盖绕过去
 *
 * 每一条都校验 UTF-8 字节数相等（理由见 zhhk/convert.cjs 文件头），不等的 OpenCC 条目丢弃并计数，覆盖表里不等直接报错。
 *
 * 用法（opencc-js 只在生成时需要，不进依赖）：
 *   npm i --no-save opencc-js@1.0.5      # 或 OPENCC_JS_DIR=<已装好的 opencc-js 目录>
 *   node scripts/i18n/gen-zhhk-dict.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = path.join(ROOT, 'zhhk', 'dict.json')
const VOCAB = path.join(ROOT, 'zhhk', 'vocab-hk.tsv')

const occDir = process.env.OPENCC_JS_DIR || path.join(ROOT, 'node_modules', 'opencc-js')
async function loadOcc(name) {
  const file = path.join(occDir, 'dist', 'esm-lib', 'dict', `${name}.js`)
  if (!fs.existsSync(file)) {
    console.error(`找不到 ${file}\n先 npm i --no-save opencc-js@1.0.5，或设 OPENCC_JS_DIR`)
    process.exit(1)
  }
  const mod = await import(pathToFileURL(file).href)
  return mod.default.split('|').map((l) => l.split(' '))
}

/** OpenCC 标准繁体 → 通行字形（取自 OpenCC TWVariants 的子集，去掉台湾独有的 裏→裡、着→著、污→汙、泄→洩 等） */
const GLYPH = {
  爲: '為', 僞: '偽', 衆: '眾', 啓: '啟', 峯: '峰', 羣: '群', 喫: '吃', 擡: '抬',
  牀: '床', 癡: '痴', 祕: '秘', 纔: '才', 脣: '唇', 鍼: '針', 麪: '麵', 嫺: '嫻',
  // 2026-10-19 语料审查补充：OpenCC 把 核对/审核/核实 写成 覈對/審覈/覈實、平台/后台 写成 平臺/後臺，香港都写 核、台
  覈: '核', 臺: '台', 蔘: '參',
}

const bl = (s) => Buffer.byteLength(s, 'utf8')
const glyph = (s) => [...s].map((c) => GLYPH[c] || c).join('')

function readVocab() {
  const rows = []
  const lines = fs.readFileSync(VOCAB, 'utf8').split(/\r?\n/)
  lines.forEach((line, idx) => {
    const body = line.replace(/\s+#.*$/, '').trim()
    if (!body || body.startsWith('#')) return
    const [k, v] = body.split('\t').map((s) => (s || '').trim())
    if (!k || !v) throw new Error(`vocab-hk.tsv 第 ${idx + 1} 行格式不对：${line}`)
    if (bl(k) !== bl(v)) throw new Error(`vocab-hk.tsv 第 ${idx + 1} 行字节数不等（必须同字数）：${k} → ${v}`)
    rows.push([k, v])
  })
  return rows
}

const stChars = await loadOcc('STCharacters')
const stPhrases = await loadOcc('STPhrases')
const vocab = readVocab()

let dropped = 0
const chars = new Map()
for (const [k, vRaw] of stChars) {
  // STCharacters 一个简体字可能对应多个繁体（空格分隔后只取第一个，与 OpenCC 一致）
  const v = glyph(vRaw)
  if (bl(k) !== bl(v)) { dropped++; continue }
  chars.set(k, v)
}
// 简体输入里也会出现旧字形本身（如「着」不是简体专有字）：字形表的键也作为单字条目
for (const [k, v] of Object.entries(GLYPH)) if (!chars.has(k)) chars.set(k, v)

const phrases = new Map()
for (const [k, vRaw] of stPhrases) {
  const v = glyph(vRaw)
  if (bl(k) !== bl(v) || k.length !== v.length) { dropped++; continue }
  phrases.set(k, v)
}

// 覆盖表：单字覆盖进单字表，多字进词组表；并把覆盖写进所有包含它的 OpenCC 词组（按位置替换，词组与值逐字对齐）
const vocabChars = vocab.filter(([k]) => [...k].length === 1)
const vocabPhrases = vocab.filter(([k]) => [...k].length > 1)
for (const [k, v] of vocabChars) chars.set(k, v)
let patched = 0
for (const [pk, pv] of phrases) {
  let arr = [...pv]
  const keyArr = [...pk]
  let changed = false
  // 先单字覆盖（如 账→帳），再词组覆盖（长的先）
  keyArr.forEach((c, i) => {
    const hit = vocabChars.find(([k]) => k === c)
    if (hit && arr[i] !== hit[1]) { arr[i] = hit[1]; changed = true }
  })
  for (const [vk, vv] of [...vocabPhrases].sort((a, b) => b[0].length - a[0].length)) {
    let from = 0
    for (;;) {
      const at = pk.indexOf(vk, from)
      if (at < 0) break
      const ci = [...pk.slice(0, at)].length
      const rep = [...vv]
      for (let j = 0; j < rep.length; j++) if (arr[ci + j] !== rep[j]) { arr[ci + j] = rep[j]; changed = true }
      from = at + vk.length
    }
  }
  if (changed) { phrases.set(pk, arr.join('')); patched++ }
}
for (const [k, v] of vocabPhrases) phrases.set(k, v)

// 自检：覆盖表里的每个词，单独转换必须得到覆盖值
const charsArr = [...chars.entries()]
const phrasesArr = [...phrases.entries()]
const { buildConverter } = await import(pathToFileURL(path.join(ROOT, 'zhhk', 'convert.cjs')).href)
const probe = buildConverter({ chars: charsArr, phrases: phrasesArr })
for (const [k, v] of vocab) {
  const got = probe.convert(k)
  if (got !== v) throw new Error(`覆盖不生效：${k} → 期望 ${v}，实际 ${got}`)
}

const body = JSON.stringify({ chars: charsArr, phrases: phrasesArr })
const version = crypto.createHash('sha256').update(body).digest('hex').slice(0, 10)
fs.writeFileSync(
  OUT,
  JSON.stringify({
    version,
    source: 'OpenCC STCharacters+STPhrases (Apache-2.0, via opencc-js 1.0.5) + GLYPH + zhhk/vocab-hk.tsv',
    chars: charsArr,
    phrases: phrasesArr,
  }),
)
console.log(
  `zhhk/dict.json 已生成：version=${version} 单字 ${charsArr.length} 词组 ${phrasesArr.length}` +
    `（覆盖表 ${vocab.length} 条，写进 OpenCC 词组 ${patched} 条；字节数不等丢弃 ${dropped} 条）` +
    `，文件 ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`,
)
