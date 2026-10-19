#!/usr/bin/env node
/**
 * 让 DeepSeek 审校「简体 → 香港繁体」机器转换（docs/繁体香港版/设计.md §4.3）。
 *
 * DeepSeek 不直接改任何内容：它只回报「哪个词转错了、该怎么写」，汇总成一张表交人工复核；
 * 复核通过的写进 zhhk/vocab-hk.tsv（标 ds），重新生成词典后全站一致生效——同一个错误在 2000 篇内容里只修一次，
 * 也不会出现某篇被模型改写了事实、价格的情况。
 *
 * 输入：zhhk-review-candidates.mjs 产出的 candidates.json。
 * 输出：<out>.json（逐条原始回报）与 <out>.tsv（按建议聚合，供人工复核）。
 *
 * 用法：DEEPSEEK_API_KEY=… node scripts/i18n/zhhk-deepseek-review.mjs --in candidates.json --out review \
 *         [--budget 2]（元，按 deepseek-chat 未命中缓存价估算，超了就停） [--concurrency 4] [--batch 120]
 * 密钥也可用 --key-file 指向一个含 LLM_API_KEY=… 的文件（服务器 .env.production 的同名变量）。
 * 注意：这把密钥同时给 AI圈大事记 用，余额用完大事记会静默停更（memory: beiguo-news-stall），所以默认预算只有 2 元。
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
const IN = arg('--in')
const OUT = arg('--out', 'zhhk-review')
const BUDGET = Number(arg('--budget', 2))
const CONC = Number(arg('--concurrency', 4))
const BATCH = Number(arg('--batch', 120))
const MIN_DB_N = Number(arg('--min-db-n', 3))
let KEY = process.env.DEEPSEEK_API_KEY || ''
if (!KEY && arg('--key-file')) {
  const m = /^LLM_API_KEY=(.*)$/m.exec(fs.readFileSync(arg('--key-file'), 'utf8'))
  KEY = m ? m[1].trim().replace(/^"|"$/g, '') : ''
}
if (!IN || !KEY) {
  console.error('缺 --in 或密钥（DEEPSEEK_API_KEY / --key-file）')
  process.exit(1)
}
const BASE = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
// 元 / 百万 token（未命中缓存的输入价、输出价；宁可高估）
const PRICE_IN = 2
const PRICE_OUT = 8

const cand = JSON.parse(fs.readFileSync(IN, 'utf8'))
const items = [
  ...cand.phrases,
  ...cand.chars.filter((c) => c.code || c.n >= MIN_DB_N),
]
  .map((c, i) => ({ id: i + 1, ...c }))
  .slice(0, Number(arg('--limit', 1e9)))

const SYSTEM = `你是香港的中文编辑，熟悉香港书面语（繁体）与内地简体的差异。
网站背景：贝果科技，面向买家的 AI 订阅充值网站（ChatGPT、Claude 等会员充值、卡密自动发货、短信接码），另有 AI 学习教程、提示词与 AI 新闻。
「发卡」在本站一律指发放卡密（發卡），「卡密」是兑换码。

下面每行是一个由程序把简体转成香港繁体的片段：编号 | 简体片段 | 程序转换结果 | 简体例句。
请找出转换结果在该例句语境下**错误**的地方，包括：
1. 一简对多繁选错字（如 发卡 在本站应为「發卡」而不是「髮卡」；并发送 应为「並發送」而不是「併發送」；后 / 後、干 / 乾 / 幹、面 / 麵、只 / 隻、里 / 裏、系 / 係 / 繫、台 / 颱、复 / 復 / 複、冲 / 沖 / 衝、松 / 鬆、范 / 範、余 / 餘、制 / 製、历 / 歷 / 曆、钟 / 鐘 / 鍾、斗 / 鬥 等）；
2. 香港不用的旧字形（如 覈、瞭解）；
3. 香港人明显不会这样说的内地词汇，且存在**字数相同**的香港通行说法（不确定就不要报）。
不要报：只是习惯不同但香港也常用的写法；标点、空格、英文；例句里与片段无关的部分。

只输出 JSON：{"errors":[{"id":编号,"zh":"简体原词（必须是该行简体例句里连续出现的 2～6 个汉字，且包含出错的字）","hk":"正确的香港繁体（字数必须与 zh 相同）","why":"十字以内的理由"}]}
没有错误就输出 {"errors":[]}。`

let spent = 0
let tokIn = 0
let tokOut = 0
const results = []
let stop = false

async function callBatch(batch, attempt = 1) {
  const lines = batch.map((c) => `${c.id} | ${c.k} | ${c.v} | ${c.ctx.replace(/\s+/g, ' ')}`).join('\n')
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: lines },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    thinking: { type: 'disabled' },
    max_tokens: 4000,
  }
  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    })
    const j = await r.json()
    if (!r.ok) throw new Error(`HTTP ${r.status} ${JSON.stringify(j).slice(0, 200)}`)
    const u = j.usage || {}
    tokIn += u.prompt_tokens || 0
    tokOut += u.completion_tokens || 0
    spent = (tokIn * PRICE_IN + tokOut * PRICE_OUT) / 1e6
    const text = j.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    return Array.isArray(parsed.errors) ? parsed.errors : []
  } catch (e) {
    if (attempt < 3) {
      await new Promise((res) => setTimeout(res, 3000 * attempt))
      return callBatch(batch, attempt + 1)
    }
    console.error('批次失败', batch[0].id, e.message)
    return []
  }
}

const batches = []
for (let i = 0; i < items.length; i += BATCH) batches.push(items.slice(i, i + BATCH))
console.log(`待审 ${items.length} 条，${batches.length} 批，并发 ${CONC}，预算 ${BUDGET} 元`)

let next = 0
async function worker() {
  while (!stop && next < batches.length) {
    const b = batches[next++]
    const errs = await callBatch(b)
    const byId = new Map(b.map((c) => [c.id, c]))
    for (const e of errs) {
      const c = byId.get(Number(e.id))
      if (!c || typeof e.zh !== 'string' || typeof e.hk !== 'string') continue
      // 模型常把「本来就转对了」的词也报上来：建议与现有转换结果相同就丢掉；字数不同的也丢（词典要求等长）
      const zh = e.zh.trim()
      const hk = e.hk.trim()
      if (!zh || [...zh].length !== [...hk].length || conv.convert(zh) === hk) continue
      results.push({ id: c.id, kind: c.kind, k: c.k, v: c.v, ctx: c.ctx, n: c.n, code: c.code, zh, hk, now: conv.convert(zh), why: e.why || '' })
    }
    process.stdout.write(`\r已完成 ${Math.min(next, batches.length)}/${batches.length} 批，回报 ${results.length} 条，约 ${spent.toFixed(3)} 元   `)
    if (spent >= BUDGET) {
      stop = true
      console.log(`\n达到预算 ${BUDGET} 元，停止`)
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
console.log(`\n输入 ${tokIn} token，输出 ${tokOut} token，约 ${spent.toFixed(3)} 元`)

// 聚合：同一条建议（zh→hk）合并，记录出现次数与来源
const agg = new Map()
for (const r of results) {
  const key = `${r.zh}\t${r.hk}`
  const a = agg.get(key) || { zh: r.zh, hk: r.hk, now: r.now, votes: 0, n: 0, code: false, whys: new Set(), ex: [] }
  a.votes++
  a.n += r.n
  a.code = a.code || r.code
  if (r.why) a.whys.add(r.why)
  if (a.ex.length < 2) a.ex.push(r.ctx)
  agg.set(key, a)
}
const rows = [...agg.values()].sort((x, y) => Number(y.code) - Number(x.code) || y.n - x.n)
fs.writeFileSync(`${OUT}.json`, JSON.stringify(results, null, 1))
fs.writeFileSync(
  `${OUT}.tsv`,
  '简体\t现在转成\t建议香港写法\t票数\t语料出现\t源码\t理由\t例句\n' +
    rows.map((a) => [a.zh, a.now, a.hk, a.votes, a.n, a.code ? 'Y' : '', [...a.whys].join('；'), a.ex.join(' ／ ')].join('\t')).join('\n'),
)
console.log(`聚合 ${rows.length} 条建议 → ${OUT}.tsv`)
