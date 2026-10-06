/**
 * 生成 GitHub「awesome」仓库的 README（内容平台 P3，设计 §7.6：攒外链和 star，EvoLinkAI、YouMind 的打法）。
 *
 *   DATABASE_URL=... npx tsx scripts/build-awesome-repo.ts [--out out/awesome-ai-prompts-zh] [--site https://bigolab.com] [--per-topic 12]
 *
 * 只生成文件，不建仓库、不 push —— 仓库开在谁的 GitHub 账号下、叫什么名字，由站长决定后手动发布。
 *
 * 【每条只放缩略图 + 标题 + 一句话 + 链回详情页，不放提示词全文】（设计 §7.6 加粗的那条）：
 * 仓库里放全文，GitHub 的页面权重比本站高，搜「XX 提示词」会排到仓库而不是本站，等于给别人做了内容。
 *
 * 只收公开的、带示例图的图像类提示词与视频提示词，按主题分组；文本类单列一节（只列标题）。
 * 只依赖 @prisma/client（与 prisma/import-seed-content.ts 同理，脚本不 import src/）。
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const arg = (k: string, d: string) => {
  const i = args.indexOf(k)
  return i >= 0 && args[i + 1] ? args[i + 1] : d
}
const OUT = arg('--out', 'out/awesome-ai-prompts-zh')
const SITE = arg('--site', 'https://bigolab.com').replace(/\/$/, '')
const PER_TOPIC = Number(arg('--per-topic', '12'))

const PUBLIC = { status: 1, reviewStatus: 'APPROVED', deletedAt: null } as const

const promptPath = (id: number, slug: string | null) => `/prompts/${id}${slug ? `-${slug}` : ''}`
const md = (s: string) => s.replace(/[|[\]<>]/g, (c) => `\\${c}`).replace(/\s+/g, ' ').trim()
/** GitHub 标题锚点：小写、去标点、空格变连字符（中文原样保留） */
// 用构造函数写 u 标志：tsconfig 的 target 低于 ES6，字面量里的 /u 编译不过
const NOT_WORD = new RegExp('[^\\p{L}\\p{N}\\s-]', 'gu')
const anchor = (h: string) => h.trim().toLowerCase().replace(NOT_WORD, '').replace(/\s/g, '-')
const firstImage = (raw: string | null): string | null => {
  try {
    const a = raw ? (JSON.parse(raw) as unknown[]) : []
    return typeof a[0] === 'string' ? (a[0] as string) : null
  } catch {
    return null
  }
}

async function main() {
  const posts = await prisma.forumPost.findMany({
    where: { ...PUBLIC, type: 'PROMPT' },
    orderBy: [{ featured: 'desc' }, { copyCount: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      images: true,
      featured: true,
      prompt: { select: { useCase: true } },
      postTags: { select: { tag: { select: { kind: true, name: true, slug: true, facet: true, status: true, sortOrder: true } } } },
    },
    take: 5000,
  })

  type Row = { id: number; title: string; line: string; href: string; img: string | null; model: string | null }
  const visual = new Map<string, { name: string; sort: number; rows: Row[] }>()
  const text: Row[] = []
  let total = 0
  for (const p of posts) {
    const tags = p.postTags.map((x) => x.tag).filter((t) => t.status === 1)
    const model = tags.find((t) => t.kind === 'MODEL')
    const topic = tags.find((t) => t.kind === 'TOPIC')
    const row: Row = {
      id: p.id,
      title: md(p.title),
      line: md((p.excerpt || p.prompt?.useCase || '').slice(0, 60)),
      href: `${SITE}${promptPath(p.id, p.slug)}`,
      img: firstImage(p.images),
      model: model?.name ?? null,
    }
    if (model?.facet === 'TEXT') {
      text.push(row)
      continue
    }
    if (!row.img) continue // 图像 / 视频类没有图的不进仓库：缩略图就是这个仓库的全部价值
    const key = topic?.slug ?? 'other'
    const g = visual.get(key) ?? { name: topic?.name ?? '其他', sort: topic?.sortOrder ?? 999, rows: [] }
    if (g.rows.length < PER_TOPIC) {
      g.rows.push(row)
      total++
    }
    visual.set(key, g)
  }

  const groups = Array.from(visual.values())
    .filter((g) => g.rows.length)
    .sort((a, b) => a.sort - b.sort)
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)

  const lines: string[] = []
  lines.push('# AI 绘画与视频提示词精选（中文）')
  lines.push('')
  lines.push(`> GPT-Image-2、Nano Banana、即梦、Seedance、可灵等模型的中文提示词案例，**每条都附效果图**。点图片查看完整提示词、参数与作者心得。`)
  lines.push('>')
  lines.push(`> 完整提示词库（${posts.length}+ 条，含科研、文案、编程等文本提示词）在 **[贝果 AI 学习](${SITE}/learn)**，持续更新。`)
  lines.push('')
  lines.push(`更新于 ${today} · [English](README_en.md)`)
  lines.push('')
  lines.push('## 目录')
  lines.push('')
  for (const g of groups) lines.push(`- [${g.name}](#${anchor(g.name)})`)
  if (text.length) lines.push('- [文本提示词（ChatGPT / Claude / DeepSeek）](#文本提示词)')
  lines.push('')
  for (const g of groups) {
    lines.push(`## ${g.name}`)
    lines.push('')
    // 三列表格：GitHub 上图文并排最稳的写法（不依赖 HTML 布局，手机上也能看）
    for (let i = 0; i < g.rows.length; i += 3) {
      const chunk = g.rows.slice(i, i + 3)
      lines.push(`| ${chunk.map((r) => `[<img src="${SITE}${r.img}" width="240" alt="${r.title.replace(/"/g, '&quot;')}">](${r.href})`).join(' | ')} |`)
      lines.push(`| ${chunk.map(() => ':---:').join(' | ')} |`)
      lines.push(`| ${chunk.map((r) => `**[${r.title}](${r.href})**${r.model ? `<br>${md(r.model)}` : ''}${r.line ? `<br>${r.line}` : ''}`).join(' | ')} |`)
      lines.push('')
    }
  }
  if (text.length) {
    lines.push('## 文本提示词')
    lines.push('')
    for (const r of text.slice(0, 60)) lines.push(`- [${r.title}](${r.href})${r.line ? ` — ${r.line}` : ''}`)
    if (text.length > 60) lines.push(`- …更多见 [文本提示词大全](${SITE}/prompts/text)`)
    lines.push('')
  }
  lines.push('## 投稿')
  lines.push('')
  lines.push(`欢迎把你的原创提示词与出图投稿到 [贝果 AI 学习](${SITE}/forum/new?type=PROMPT)，被精选的会同步进这个列表并署名。`)
  lines.push('')
  lines.push('## 说明')
  lines.push('')
  lines.push('- 本仓库只收录标题、缩略图与链接，提示词全文、参数与作者心得请点进原页面查看。')
  lines.push('- 部分示例图来自开源提示词仓库，原页面标注了来源与许可证。')
  lines.push('')

  const en: string[] = [
    '# Awesome AI Image & Video Prompts (Chinese)',
    '',
    `A curated, image-first index of Chinese prompts for GPT-Image-2, Nano Banana, Seedance, Kling and more. Every entry links to the full prompt, parameters and notes on [Bigolab AI Learn](${SITE}/learn).`,
    '',
    `- ${total} visual prompts in ${groups.length} topics, ${text.length} text prompts (research, writing, coding…)`,
    `- Updated ${today}`,
    '',
    'See [README.md](README.md) for the full gallery.',
    '',
  ]

  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(path.join(OUT, 'README.md'), lines.join('\n'), 'utf8')
  fs.writeFileSync(path.join(OUT, 'README_en.md'), en.join('\n'), 'utf8')
  console.log(`已生成 ${OUT}/README.md：${groups.length} 个主题、${total} 条带图提示词、${text.length} 条文本提示词`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
