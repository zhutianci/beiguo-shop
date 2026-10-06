/**
 * 导入种子内容（内容平台改版 2026-10-06）。读 prisma/seed-content.json（由 scripts/build-seed-bundle.ts 生成）。
 *
 *   DATABASE_URL=... npx tsx prisma/import-seed-content.ts --author admin@example.com [--publish] [--uploads-dir public/uploads] [--force-intro] [--dry-run]
 *
 * --publish（第二批起，站长 10-06 要求提示词库上线就要「非常多」）：可以直接公开的提示词建成「已通过」——
 *   图像类要有示例图；视频类、文本类直接可以。教程仍然一律待审（要实测截图）。
 * --uploads-dir：上传根目录（本地 public/uploads；生产临时容器里挂载 forum_uploads 卷后传对应路径）。
 *   示例图复制到 <uploads-dir>/forum/，文件名按内容哈希生成（重复导入不会重复复制），并登记 media_assets（含宽高）。
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
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const flag = (k: string) => args.includes(k)
const arg = (k: string) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}

interface Bundle {
  tags: { slug: string; name: string; kind: string; facet: string | null; landingPath: string | null; sortOrder: number }[]
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
    source: { url: string; author: string | null; repo: string | null; license: string | null } | null
    imageBrief: string | null
    verify: string[]
    facet: string | null
    images: string[]
    imageCredit: { by: string | null; url: string | null; license: string | null } | null
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

/**
 * 读图片宽高（只看文件头）。与 src/lib/image-meta.ts 的 imageSize 同一套逻辑的精简版——
 * 这里不能 import src/（理由见文件头），所以抄一份；只服务于种子图，读不出来就留空。
 */
function sizeOf(buf: Buffer, ext: string): { width: number; height: number } | null {
  try {
    if (ext === 'png') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    if (ext === 'gif') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) }
    if (ext === 'webp') {
      const cc = buf.subarray(12, 16).toString('latin1')
      if (cc === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
      if (cc === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
      if (cc === 'VP8L') {
        const b = buf.readUInt32LE(21)
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }
      }
      return null
    }
    if (ext === 'jpg') {
      let i = 2
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) return null
        const m = buf[i + 1]
        const len = buf.readUInt16BE(i + 2)
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) }
        i += 2 + len
      }
    }
  } catch {
    /* 读不出就算了 */
  }
  return null
}

/** 按文件头判断真实格式（不信扩展名） */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
  if (buf.subarray(0, 4).toString('hex') === '89504e47') return 'png'
  if (buf.subarray(0, 3).toString('latin1') === 'GIF') return 'gif'
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  return null
}

/**
 * 把一张种子图放进上传目录并登记。文件名必须符合 FORUM_IMAGE_URL_RE（src/lib/content/policy.ts）：
 * `<6–12 位 [0-9a-z]>-<12 位十六进制>.<ext>`，否则作者以后编辑这条内容时会被「图片地址无效」拒掉。
 * 这里用内容哈希生成，重复导入得到同一个文件名、不重复复制。
 */
async function placeImage(file: string, uploadsDir: string, userId: number, dry: boolean): Promise<string | null> {
  const src = path.join(__dirname, 'seed-assets', file)
  if (!fs.existsSync(src)) return null
  const buf = fs.readFileSync(src)
  const ext = sniff(buf)
  if (!ext) return null
  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  const name = `seed${sha.slice(0, 4)}-${sha.slice(4, 16)}.${ext}`
  const url = `/uploads/forum/${name}`
  if (dry) return url
  const dir = path.join(uploadsDir, 'forum')
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, name)
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, buf)
  if (!(await prisma.mediaAsset.findUnique({ where: { url } }))) {
    await prisma.mediaAsset.create({
      data: { userId, scope: 'forum', url, bytes: buf.length, sha256: sha, stripped: false, ...(sizeOf(buf, ext) ?? {}) },
    })
  }
  return url
}

async function main() {
  const email = arg('--author')
  if (!email) throw new Error('请用 --author 指定作者账号邮箱（站方编辑的真实账号）')
  const dry = flag('--dry-run')
  const publish = flag('--publish')
  const uploadsDir = path.resolve(arg('--uploads-dir') || path.join(process.cwd(), 'public', 'uploads'))
  const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-content.json'), 'utf8')) as Bundle

  const author = await prisma.user.findUnique({ where: { email }, select: { id: true, nickname: true } })
  if (!author) throw new Error(`找不到账号 ${email}`)
  const authorName = (author.nickname && !author.nickname.includes('@') ? author.nickname : '贝果编辑').slice(0, 50)

  // 1) 标签与板块
  for (const t of bundle.tags) {
    // 已存在的只补 facet（第一批建的标签没有这一列的值）；名称、介绍、落地页以后台为准
    if (!dry) await prisma.tag.upsert({ where: { slug: t.slug }, update: t.facet ? { facet: t.facet } : {}, create: t })
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
  let published = 0
  const promptBoard = await boardId('prompts')
  const guideBoard = await boardId('guides')
  if (!dry && (!promptBoard || !guideBoard)) throw new Error('内容专用板块不存在')

  for (const p of bundle.prompts) {
    if (await prisma.forumPost.findFirst({ where: { type: 'PROMPT', slug: p.slug }, select: { id: true } })) {
      skipped++
      continue
    }
    const urls: string[] = []
    for (const im of p.images) {
      const u = await placeImage(im, uploadsDir, author.id, dry)
      if (u) urls.push(u)
    }
    // 能不能直接公开：图像类要有图；视频、文本类可以
    const live = publish && (p.facet !== 'IMAGE' || urls.length > 0)
    if (dry) {
      created++
      if (live) published++
      continue
    }
    await prisma.forumPost.create({
      data: {
        type: 'PROMPT',
        images: urls.length ? JSON.stringify(urls) : null,
        mediaCredit: urls.length && p.imageCredit ? JSON.stringify(p.imageCredit) : null,
        slug: p.slug,
        categoryId: promptBoard!,
        userId: author.id,
        authorName,
        title: p.title,
        content: p.content,
        tags: '',
        lastReplyAt: new Date(),
        reviewStatus: live ? 'APPROVED' : 'PENDING',
        reviewedAt: live ? new Date() : null,
        reviewNote: live ? null : todo([p.imageBrief ? `出图：${p.imageBrief}` : '补效果图', p.verify.length ? `核对：${p.verify.join(' / ')}` : null]),
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
    if (live) published++
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

  console.log(
    `${dry ? '[演练] ' : ''}专题介绍写入 ${introWritten} 个；内容新建 ${created} 条（其中直接公开 ${published} 条，其余待审）、已存在跳过 ${skipped} 条；作者 ${authorName}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
