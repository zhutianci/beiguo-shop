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
 *  - AI 应用（apps/，10-07）：字段白名单、长度上限与 app_specs 列宽一致、官网必须 https、正文可读字数 ≥ MIN_APP_CHARS、
 *    不得有联系方式 / 敏感词（格式见 docs/内容平台/扩容基础设施-1007.md §3）
 * js-yaml 是间接依赖（没写进 package.json）：这个脚本只在本地跑。
 */
import fs from 'fs'
import path from 'path'
import { DEFAULT_TAGS } from '../src/lib/content/tags'
import { isValidSlug, promptVariables, ACCOUNT_TIERS, readableLength, contentFlags, MIN_APP_CHARS } from '../src/lib/content/policy'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml') as { load: (s: string) => unknown }

// --root / --out 只给测试用（拿一份临时目录的样例编译到别处，不碰正式的种子包）
const cliArg = (k: string) => {
  const i = process.argv.indexOf(k)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const ROOT = path.resolve(cliArg('--root') ?? path.join(__dirname, '..', 'docs', '内容平台', '种子内容'))
const OUT = path.resolve(cliArg('--out') ?? path.join(__dirname, '..', 'prisma', 'seed-content.json'))
// 示例图（第二批起）：放在 prisma/seed-assets/，随 prisma/ 一起进生产镜像，导入时复制到上传目录
const ASSETS = path.join(__dirname, '..', 'prisma', 'seed-assets')
const warnings: string[] = []

const errors: string[] = []
const tagKind = new Map(DEFAULT_TAGS.map((t) => [t.slug, t.kind]))
const tagFacet = new Map(DEFAULT_TAGS.map((t) => [t.slug, t.facet ?? null]))

function read(dir: string) {
  const full = path.join(ROOT, dir)
  // apps/ 是 10-07 才有的目录：还没有文件时当作空
  if (!fs.existsSync(full)) return []
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
  need(file, fm, ['title', 'slug', 'model', 'useCase', 'prompt'])
  if (!isValidSlug(String(fm.slug ?? ''))) errors.push(`${file}: slug 不合法`)
  if (seen.has(`P:${fm.slug}`)) errors.push(`${file}: slug 重复`)
  seen.add(`P:${fm.slug}`)
  const model = checkTags(file, fm.model, 'MODEL', 1, 1)
  const topics = checkTags(file, fm.topics, 'TOPIC', 0, 3)
  const prompt = String(fm.prompt ?? '').trim()
  for (const v of promptVariables(prompt)) if (v.length > 20) errors.push(`${file}: 变量「${v}」过长`)
  const src = fm.source && typeof fm.source === 'object' ? fm.source : null
  if (src && !src.url) errors.push(`${file}: 有来源但缺 url`)
  const images = list(fm.images)
  for (const im of images) {
    if (!/^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|gif)$/.test(im)) errors.push(`${file}: 示例图文件名不合法「${im}」`)
    else if (!fs.existsSync(path.join(ASSETS, im))) errors.push(`${file}: 示例图不存在 prisma/seed-assets/${im}`)
    else if (fs.statSync(path.join(ASSETS, im)).size > 1.5 * 1024 * 1024) errors.push(`${file}: 示例图超过 1.5MB「${im}」`)
  }
  const facet = tagFacet.get(model[0] ?? '') ?? null
  if (facet === 'IMAGE' && !images.length) warnings.push(`${file}: 图像类但没有示例图（导入后需补图才能发布）`)
  const credit = fm.imageCredit && typeof fm.imageCredit === 'object' ? fm.imageCredit : null
  return {
    facet,
    images,
    imageCredit: credit && images.length ? { by: credit.by ? String(credit.by) : null, url: credit.url ? String(credit.url) : null, license: credit.license ? String(credit.license) : null } : null,
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
      ? { url: String(src.url), author: src.author ? String(src.author) : null, repo: src.repo ? String(src.repo) : null, license: src.license ? String(src.license) : null, changes: src.changes ? String(src.changes) : null }
      : null,
    imageBrief: fm.imageBrief ? String(fm.imageBrief) : null,
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
  // 正文插图写成 ![说明](seed:文件名)，文件放 prisma/seed-assets/，导入时换成上传后的地址
  const images = Array.from(body.matchAll(/!\[[^\]]*\]\(seed:([^)\s]+)\)/g), (m) => m[1])
  for (const im of images) if (!fs.existsSync(path.join(ASSETS, im))) errors.push(`${file}: 插图不存在 prisma/seed-assets/${im}`)
  if (/【截图[:：]/.test(body)) warnings.push(`${file}: 还有【截图】占位`)
  const checkedOn = fm.checkedOn ? String(fm.checkedOn instanceof Date ? fm.checkedOn.toISOString().slice(0, 10) : fm.checkedOn) : null
  if (checkedOn && !/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) errors.push(`${file}: checkedOn 要写成 YYYY-MM-DD`)
  return {
    title: String(fm.title),
    slug: String(fm.slug),
    checkedOn,
    images,
    tags: [...products, ...models],
    accountTier: tier,
    excerpt: String(fm.excerpt),
    content: body,
    sources: list(fm.sources),
    screenshots: list(fm.screenshots),
    verify: list(fm.verify),
  }
})

// —— AI 应用（10-07）——
// 字段白名单：写错键名（topic: / product:）在这里直接报错，而不是被静默忽略
const APP_KEYS = new Set(['title', 'slug', 'name', 'url', 'pricing', 'platforms', 'trialNote', 'products', 'models', 'topics', 'excerpt', 'checkedOn', 'sources', 'verify'])
const dateStr = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? '' : String(v).trim())
const appUrls = new Map<string, string>()
const apps = read('apps').map(({ file, fm, body }) => {
  for (const k of Object.keys(fm)) if (!APP_KEYS.has(k)) errors.push(`${file}: 不认识的字段「${k}」`)
  need(file, fm, ['title', 'slug', 'name', 'url', 'pricing', 'platforms', 'excerpt', 'checkedOn'])
  const str = (k: string) => (fm[k] == null ? '' : String(fm[k]).trim())
  const max = (k: string, n: number) => {
    if (str(k).length > n) errors.push(`${file}: ${k} 超过 ${n} 字（${str(k).length}）`)
  }
  if (!isValidSlug(str('slug'))) errors.push(`${file}: slug 不合法`)
  if (seen.has(`A:${fm.slug}`)) errors.push(`${file}: slug 重复`)
  seen.add(`A:${fm.slug}`)
  max('title', 200)
  max('name', 60)
  max('pricing', 60)
  max('platforms', 100)
  max('trialNote', 200)
  max('excerpt', 160)
  const url = str('url')
  let host = ''
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') errors.push(`${file}: url 必须是 https`)
    if (url.length > 500) errors.push(`${file}: url 超过 500 字符`)
    host = u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '')
  } catch {
    if (url) errors.push(`${file}: url 不是合法地址「${url}」`)
  }
  // 两个代理写了同一个应用：提醒（同一官网的不同产品页是允许的，所以只提醒不报错）
  if (host && appUrls.has(host)) warnings.push(`${file}: 官网与 ${appUrls.get(host)} 相同，确认不是重复条目`)
  else if (host) appUrls.set(host, file)
  const checkedOn = dateStr(fm.checkedOn)
  if (checkedOn && !/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)) errors.push(`${file}: checkedOn 要写成 YYYY-MM-DD`)
  else if (checkedOn && checkedOn > new Date().toISOString().slice(0, 10)) errors.push(`${file}: checkedOn 是未来的日期`)
  const sources = list(fm.sources)
  if (!sources.length) errors.push(`${file}: sources 至少写一个参考链接（官方优先）`)
  for (const s of sources) if (!/^https?:\/\/\S+$/.test(s)) errors.push(`${file}: sources 里有不是链接的「${s}」`)
  const products = checkTags(file, fm.products, 'PRODUCT', 0, 2)
  const models = checkTags(file, fm.models, 'MODEL', 0, 2)
  const topics = checkTags(file, fm.topics, 'TOPIC', 0, 3)
  const images = Array.from(body.matchAll(/!\[[^\]]*\]\(seed:([^)\s]+)\)/g), (m) => m[1])
  for (const im of images) {
    if (!/^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|gif)$/.test(im)) errors.push(`${file}: 插图文件名不合法「${im}」`)
    else if (!fs.existsSync(path.join(ASSETS, im))) errors.push(`${file}: 插图不存在 prisma/seed-assets/${im}`)
    else if (fs.statSync(path.join(ASSETS, im)).size > 1.5 * 1024 * 1024) errors.push(`${file}: 插图超过 1.5MB「${im}」`)
  }
  // 收录门槛（policy.qualityGateReason 的 APP 分支）在这里先卡住：够不上的页面不该导入
  const readable = readableLength(body)
  if (readable < MIN_APP_CHARS) errors.push(`${file}: 正文可读字数 ${readable}，少于 ${MIN_APP_CHARS}`)
  const flags = contentFlags([str('title'), str('excerpt'), str('trialNote'), str('pricing'), body].join('\n'), ['bigolab.com'])
  if (flags.includes('contact')) errors.push(`${file}: 疑似联系方式`)
  if (flags.includes('sensitive')) errors.push(`${file}: 命中敏感词`)
  if (/【截图[:：]/.test(body)) warnings.push(`${file}: 还有【截图】占位（导入后待审）`)
  return {
    title: str('title'),
    slug: str('slug'),
    name: str('name'),
    url,
    pricing: str('pricing'),
    platforms: str('platforms'),
    trialNote: str('trialNote') || null,
    tags: [...products, ...models, ...topics],
    excerpt: str('excerpt'),
    checkedOn,
    content: body,
    images,
    sources,
  }
})

if (errors.length) {
  console.error(`校验失败 ${errors.length} 处：\n  ${errors.join('\n  ')}`)
  process.exit(1)
}

const bundle = {
  builtAt: new Date().toISOString(),
  tags: DEFAULT_TAGS.map((t, i) => ({ slug: t.slug, name: t.name, kind: t.kind, facet: t.facet ?? null, landingPath: t.landingPath ?? null, sortOrder: i })),
  hubs,
  prompts,
  guides,
  apps,
}
fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2) + '\n', 'utf8')
const byFacet = (f: string) => prompts.filter((p) => p.facet === f).length
console.log(
  `已写入 ${path.relative(process.cwd(), OUT)}：专题 ${hubs.length}、提示词 ${prompts.length}` +
    `（图像 ${byFacet('IMAGE')} / 视频 ${byFacet('VIDEO')} / 文本 ${byFacet('TEXT')}，带示例图 ${prompts.filter((p) => p.images.length).length}）、教程 ${guides.length}、AI 应用 ${apps.length}`,
)
if (warnings.length) console.log(`提醒 ${warnings.length} 条：\n  ${warnings.join('\n  ')}`)
