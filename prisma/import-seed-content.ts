/**
 * 导入种子内容（内容平台改版 2026-10-06）。读 prisma/seed-content.json（由 scripts/build-seed-bundle.ts 生成）。
 *
 *   DATABASE_URL=... npx tsx prisma/import-seed-content.ts --author admin@example.com [--force-intro] [--dry-run]
 *
 * 【放在 prisma/ 的原因】生产镜像只带 prisma/，不带 scripts/ 和 src/（交接文档：运维脚本不能 import src/）。
 * 所以这里只依赖 @prisma/client，标签默认表也从 JSON 里读。
 *
 * 做什么（幂等，可以重复跑）：
 *  1. 补齐标签与两个内容专用板块（已存在的不改）
 *  2. 专题介绍：写进对应标签的 intro——**只写空的**；已经有介绍的跳过（站长可能改过），加 --force-intro 才覆盖
 *  3. 提示词 / 教程：按「类型 + slug」去重，不存在才建。一律建成**待审**（reviewStatus=PENDING）：
 *     提示词没有出图、教程没有实测截图，必须站长补齐、核对完待办清单后在后台审核通过才公开。
 *     待办清单（出图要求 / 截图 / 待核对事实）写进 reviewNote，后台列表里看得到。
 *  4. 来源：改编自开源仓库的提示词记为「转载 / 改编」并带原链接（页面上显示「原文」链接）；原创的记为原创首发。
 *     转载 / 改编的不进收录（policy.isIndexable），这是有意的：站长补上自己的出图和心得后，可在后台改为原创首发——
 *     那时署名行仍保留在正文末尾（CC BY / MIT 要求保留署名与许可证）。
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const flag = (k: string) => args.includes(k)
const arg = (k: string) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}

interface Bundle {
  tags: { slug: string; name: string; kind: string; landingPath: string | null; sortOrder: number }[]
  hubs: { slug: string; intro: string; verify: string[] }[]
  prompts: {
    title: string
    slug: string
    tags: string[]
    prompt: string
    negativePrompt: string | null
    modelLabel: string | null
    aspectRatio: string | null
    needsRefImage: boolean
    useCase: string
    content: string
    source: { url: string; author: string | null; repo: string | null; license: string } | null
    imageBrief: string
    verify: string[]
  }[]
  guides: {
    title: string
    slug: string
    tags: string[]
    accountTier: string | null
    excerpt: string
    content: string
    screenshots: string[]
    verify: string[]
  }[]
}

function todo(parts: (string | null | undefined)[]): string {
  return `【种子草稿待办】${parts.filter(Boolean).join('；')}`.slice(0, 500)
}

async function main() {
  const email = arg('--author')
  if (!email) throw new Error('请用 --author 指定作者账号邮箱（站方编辑的真实账号）')
  const dry = flag('--dry-run')
  const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-content.json'), 'utf8')) as Bundle

  const author = await prisma.user.findUnique({ where: { email }, select: { id: true, nickname: true } })
  if (!author) throw new Error(`找不到账号 ${email}`)
  const authorName = (author.nickname && !author.nickname.includes('@') ? author.nickname : '贝果编辑').slice(0, 50)

  // 1) 标签与板块
  for (const t of bundle.tags) {
    if (!dry) await prisma.tag.upsert({ where: { slug: t.slug }, update: {}, create: t })
  }
  const boards = [
    { slug: 'prompts', name: '提示词', description: '可复制、作者实测过的 AI 提示词', icon: '🎨', sortOrder: 90 },
    { slug: 'guides', name: '教程', description: 'ChatGPT / Claude 等的功能教程与使用技巧', icon: '📘', sortOrder: 91 },
  ]
  for (const b of boards) if (!dry) await prisma.forumCategory.upsert({ where: { slug: b.slug }, update: {}, create: b })
  const tagId = new Map((await prisma.tag.findMany({ select: { id: true, slug: true } })).map((t) => [t.slug, t.id]))
  const boardId = async (slug: string) => (await prisma.forumCategory.findUnique({ where: { slug } }))?.id

  // 2) 专题介绍
  let introWritten = 0
  for (const h of bundle.hubs) {
    const tag = await prisma.tag.findUnique({ where: { slug: h.slug }, select: { id: true, intro: true } })
    if (!tag) continue
    if (tag.intro && !flag('--force-intro')) continue
    if (!dry) await prisma.tag.update({ where: { id: tag.id }, data: { intro: h.intro } })
    introWritten++
  }

  // 3) 内容
  let created = 0
  let skipped = 0
  const promptBoard = await boardId('prompts')
  const guideBoard = await boardId('guides')
  if (!dry && (!promptBoard || !guideBoard)) throw new Error('内容专用板块不存在')

  for (const p of bundle.prompts) {
    if (await prisma.forumPost.findFirst({ where: { type: 'PROMPT', slug: p.slug }, select: { id: true } })) {
      skipped++
      continue
    }
    if (dry) {
      created++
      continue
    }
    await prisma.forumPost.create({
      data: {
        type: 'PROMPT',
        slug: p.slug,
        categoryId: promptBoard!,
        userId: author.id,
        authorName,
        title: p.title,
        content: p.content,
        tags: '',
        lastReplyAt: new Date(),
        reviewStatus: 'PENDING',
        reviewNote: todo([`出图：${p.imageBrief}`, p.verify.length ? `核对：${p.verify.join(' / ')}` : null]),
        originality: p.source ? 'REPOST' : 'ORIGINAL_FIRST',
        sourceUrl: p.source?.url ?? null,
        aiAssist: 'PARTIAL',
        prompt: {
          create: {
            prompt: p.prompt,
            negativePrompt: p.negativePrompt,
            modelLabel: p.modelLabel,
            aspectRatio: p.aspectRatio,
            needsRefImage: p.needsRefImage,
            useCase: p.useCase,
          },
        },
        postTags: { create: p.tags.map((s) => tagId.get(s)).filter((x): x is number => !!x).map((id) => ({ tagId: id })) },
      },
    })
    created++
  }

  for (const g of bundle.guides) {
    if (await prisma.forumPost.findFirst({ where: { type: 'GUIDE', slug: g.slug }, select: { id: true } })) {
      skipped++
      continue
    }
    if (dry) {
      created++
      continue
    }
    await prisma.forumPost.create({
      data: {
        type: 'GUIDE',
        slug: g.slug,
        categoryId: guideBoard!,
        userId: author.id,
        authorName,
        title: g.title,
        content: g.content,
        excerpt: g.excerpt.slice(0, 300),
        accountTier: g.accountTier,
        // 测试日期留空：站长实测后在编辑页填上（教程没有测试日期不会被收录）
        testedOn: null,
        tags: '',
        lastReplyAt: new Date(),
        reviewStatus: 'PENDING',
        reviewNote: todo([
          g.screenshots.length ? `截图：${g.screenshots.join(' / ')}` : null,
          g.verify.length ? `核对：${g.verify.join(' / ')}` : null,
          '实测后填测试日期',
        ]),
        originality: 'ORIGINAL_FIRST',
        aiAssist: 'PARTIAL',
        postTags: { create: g.tags.map((s) => tagId.get(s)).filter((x): x is number => !!x).map((id) => ({ tagId: id })) },
      },
    })
    created++
  }

  console.log(`${dry ? '[演练] ' : ''}专题介绍写入 ${introWritten} 个；内容新建 ${created} 条、已存在跳过 ${skipped} 条（全部为待审，作者 ${authorName}）`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
