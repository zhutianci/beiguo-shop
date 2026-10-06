/**
 * 把 docs/内容平台/种子内容/ 下的 Markdown 草稿编译成 prisma/seed-content.json（内容平台改版 2026-10-06）。
 *   npx tsx scripts/build-seed-bundle.ts
 *
 * 为什么分两步：草稿要人改（Markdown + YAML 最好改），而导入要在服务器的临时容器里跑——
 * 那里没有 js-yaml，也不能 import src/（交接文档：运维脚本不能 import src/）。所以本地先编译成 JSON、顺手校验，
 * 导入脚本 prisma/import-seed-content.ts 只读 JSON、只依赖 @prisma/client。
 *
 * 校验（任何一条不过就不写文件、非零退出）：
 *  - frontmatter 能解析、必填字段齐全
 *  - 标签 slug 都在默认标签表里、种类对得上（提示词 1 个模型 + ≤3 主题；教程 1–2 个产品 + ≤2 模型）
 *  - 提示词的 [变量] 1–20 字；slug 是小写 ASCII 且同类型内不重复
 *  - 有来源的提示词必须写清 url / license
 * js-yaml 是间接依赖（没写进 package.json）：这个脚本只在本地跑。
 */
import fs from 'fs'
import path from 'path'
import { DEFAULT_TAGS } from '../src/lib/content/tags'
import { isValidSlug, promptVariables, ACCOUNT_TIERS } from '../src/lib/content/policy'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml') as { load: (s: string) => unknown }

const ROOT = path.join(__dirname, '..', 'docs', '内容平台', '种子内容')
const OUT = path.join(__dirname, '..', 'prisma', 'seed-content.json')

const errors: string[] = []
const tagKind = new Map(DEFAULT_TAGS.map((t) => [t.slug, t.kind]))

function read(dir: string) {
  const full = path.join(ROOT, dir)
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(full, f), 'utf8').replace(/\r\n/g, '\n')
      const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
      if (!m) {
        errors.push(`${dir}/${f}: 没有 frontmatter`)
        return null
      }
      try {
        return { file: `${dir}/${f}`, fm: (yaml.load(m[1]) || {}) as Record<string, any>, body: m[2].trim() }
      } catch (e) {
        errors.push(`${dir}/${f}: YAML 解析失败 ${(e as Error).message.split('\n')[0]}`)
        return null
      }
    })
    .filter((x): x is { file: string; fm: Record<string, any>; body: string } => !!x)
}

function need(file: string, fm: Record<string, any>, keys: string[]) {
  for (const k of keys) if (fm[k] === undefined || fm[k] === null || fm[k] === '') errors.push(`${file}: 缺少 ${k}`)
}

function checkTags(file: string, slugs: unknown, kind: string, min: number, max: number) {
  const list = Array.isArray(slugs) ? slugs : slugs ? [slugs] : []
  for (const s of list) if (tagKind.get(String(s)) !== kind) errors.push(`${file}: 「${s}」不是 ${kind} 标签`)
  if (list.length < min || list.length > max) errors.push(`${file}: ${kind} 标签应为 ${min}–${max} 个，实际 ${list.length}`)
  return list.map(String)
}

const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : [])

// —— 专题介绍 ——
const hubs = read('hubs').map(({ file, fm, body }) => {
  need(file, fm, ['slug', 'kind'])
  if (!tagKind.has(fm.slug)) errors.push(`${file}: 标签「${fm.slug}」不在默认标签表里`)
  else if (tagKind.get(fm.slug) !== fm.kind) errors.push(`${file}: kind 应为 ${tagKind.get(fm.slug)}`)
  if (body.length < 150) errors.push(`${file}: 介绍太短（${body.length} 字符）`)
  return { slug: String(fm.slug), intro: body, sources: list(fm.sources), verify: list(fm.verify) }
})

// —— 提示词 ——
const seen = new Set<string>()
const prompts = read('prompts').map(({ file, fm, body }) => {
  need(file, fm, ['title', 'slug', 'model', 'useCase', 'prompt', 'imageBrief'])
  if (!isValidSlug(String(fm.slug ?? ''))) errors.push(`${file}: slug 不合法`)
  if (seen.has(`P:${fm.slug}`)) errors.push(`${file}: slug 重复`)
  seen.add(`P:${fm.slug}`)
  const model = checkTags(file, fm.model, 'MODEL', 1, 1)
  const topics = checkTags(file, fm.topics, 'TOPIC', 0, 3)
  const prompt = String(fm.prompt ?? '').trim()
  for (const v of promptVariables(prompt)) if (v.length > 20) errors.push(`${file}: 变量「${v}」过长`)
  const src = fm.source && typeof fm.source === 'object' ? fm.source : null
  if (src && (!src.url || !src.license)) errors.push(`${file}: 有来源但缺 url 或 license`)
  return {
    title: String(fm.title),
    slug: String(fm.slug),
    tags: [...model, ...topics],
    prompt,
    negativePrompt: fm.negativePrompt ? String(fm.negativePrompt) : null,
    modelLabel: fm.modelLabel ? String(fm.modelLabel) : null,
    aspectRatio: fm.aspectRatio ? String(fm.aspectRatio) : null,
    needsRefImage: !!fm.needsRefImage,
    useCase: String(fm.useCase),
    content: body,
    source: src
      ? { url: String(src.url), author: src.author ? String(src.author) : null, repo: src.repo ? String(src.repo) : null, license: String(src.license), changes: src.changes ? String(src.changes) : null }
      : null,
    imageBrief: String(fm.imageBrief),
    verify: list(fm.verify),
  }
})

// —— 教程 ——
const guides = read('guides').map(({ file, fm, body }) => {
  need(file, fm, ['title', 'slug', 'products', 'excerpt'])
  if (!isValidSlug(String(fm.slug ?? ''))) errors.push(`${file}: slug 不合法`)
  if (seen.has(`G:${fm.slug}`)) errors.push(`${file}: slug 重复`)
  seen.add(`G:${fm.slug}`)
  const products = checkTags(file, fm.products, 'PRODUCT', 1, 2)
  const models = checkTags(file, fm.models, 'MODEL', 0, 2)
  const tier = fm.accountTier ? String(fm.accountTier) : null
  if (tier && !(ACCOUNT_TIERS as readonly string[]).includes(tier)) errors.push(`${file}: accountTier 不合法`)
  if (String(fm.excerpt ?? '').length > 160) errors.push(`${file}: 摘要超过 160 字`)
  return {
    title: String(fm.title),
    slug: String(fm.slug),
    tags: [...products, ...models],
    accountTier: tier,
    excerpt: String(fm.excerpt),
    content: body,
    sources: list(fm.sources),
    screenshots: list(fm.screenshots),
    verify: list(fm.verify),
  }
})

if (errors.length) {
  console.error(`校验失败 ${errors.length} 处：\n  ${errors.join('\n  ')}`)
  process.exit(1)
}

const bundle = {
  builtAt: new Date().toISOString(),
  tags: DEFAULT_TAGS.map((t, i) => ({ slug: t.slug, name: t.name, kind: t.kind, landingPath: t.landingPath ?? null, sortOrder: i })),
  hubs,
  prompts,
  guides,
}
fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2) + '\n', 'utf8')
console.log(`已写入 ${path.relative(process.cwd(), OUT)}：专题 ${hubs.length}、提示词 ${prompts.length}、教程 ${guides.length}`)
