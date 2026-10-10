/**
 * 导入种子内容（内容平台改版 2026-10-06）。读 prisma/seed-content.json（由 scripts/build-seed-bundle.ts 生成）。
 *
 *   DATABASE_URL=... npx tsx prisma/import-seed-content.ts --author admin@example.com [--publish | --schedule] [--uploads-dir public/uploads] [--force-intro] [--refresh-guides [--only-slugs a,b]] [--refresh-apps] [--dry-run]
 *
 * --schedule（内容扩容 10-07，docs/内容平台/扩容基础设施-1007.md）：与 --publish 同一个「能不能公开」的判定，
 *   但够格的条目不立即公开，而是建成 reviewStatus=SCHEDULED（定时放量队列，与待审一样不公开），
 *   之后每天由 /api/cron/content-release 放出 CONTENT_RELEASE_PER_DAY 条（默认 40）。
 *   导入结束时把队列里**全部** SCHEDULED 条目按「类型 + 大类 + 主题」交错重排（release_rank，算法见 prisma/release-order.ts），
 *   保证每天一批都是混合的。--publish 与 --schedule 不能同时用。
 * AI 应用（apps/，10-07）：type=APP + app_specs，原创首发、AI 部分辅助、非自荐；没有截图占位的随 --publish / --schedule 公开 / 排队。
 * --refresh-apps：同 --refresh-guides，已导入的种子应用按新版重写（只动 --author 自己发的）。
 *
 * --publish（第二批起，站长 10-06 要求提示词库上线就要「非常多」）：可以直接公开的提示词建成「已通过」——
 *   图像类要有示例图；视频类、文本类直接可以。教程：站方据官方文档整理完（有 checkedOn、没有截图占位）的直接公开，其余待审。
 * --refresh-guides（10-07）：已导入的种子教程按新版重写正文、插图与核对日期（只动 --author 自己发的）。
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
import { bucketOf, releaseOrder } from './release-order'

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
  apps?: {
    title: string
    slug: string
    name: string
    url: string
    pricing: string
    platforms: string
    trialNote: string | null
    tags: string[]
    excerpt: string
    checkedOn: string
    content: string
    images: string[]
    sources: string[]
  }[]
  guides: {
    title: string
    slug: string
    tags: string[]
    accountTier: string | null
    excerpt: string
    content: string
    /** 站方据官方文档整理、核对资料的日期（不是亲测）；没有则仍按「待实测」处理 */
    checkedOn?: string | null
    /** 正文里 ![说明](seed:文件名) 引用的插图 */
    images?: string[]
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
  const schedule = flag('--schedule')
  if (publish && schedule) throw new Error('--publish 与 --schedule 只能选一个')
  // 够格的条目建成什么状态：--publish 立即公开；--schedule 进定时放量队列；都不带 = 一律待审
  const liveStatus = publish ? 'APPROVED' : 'SCHEDULED'
  const canGoLive = publish || schedule
  const uploadsDir = path.resolve(arg('--uploads-dir') || path.join(process.cwd(), 'public', 'uploads'))
  // --bundle 只给测试用（读临时编译出来的样例包）；正式导入一律读 prisma/seed-content.json
  const bundle = JSON.parse(fs.readFileSync(path.resolve(arg('--bundle') || path.join(__dirname, 'seed-content.json')), 'utf8')) as Bundle

  // 示例图 / 插图必须都在 prisma/seed-assets/（内容扩容 10-07：生产镜像不再带这个目录，见 .dockerignore）。
  // 在 app 容器里直接跑、或临时容器没挂宿主机的 $PWD/prisma 时，这里会缺一大片——缺图的提示词会变成待审、教程插图行会被删掉，
  // 而且不报错。所以缺图直接停手；确实要跳过缺的图时加 --allow-missing-images。
  const referenced = new Set<string>([
    ...bundle.prompts.flatMap((p) => p.images),
    ...bundle.guides.flatMap((g) => g.images ?? []),
    ...(bundle.apps ?? []).flatMap((a) => a.images),
  ])
  const missing = Array.from(referenced).filter((f) => !fs.existsSync(path.join(__dirname, 'seed-assets', f)))
  if (missing.length && !flag('--allow-missing-images')) {
    throw new Error(
      `种子包引用的 ${referenced.size} 张图里有 ${missing.length} 张不在 ${path.join(__dirname, 'seed-assets')}（例如 ${missing.slice(0, 3).join('、')}）。` +
        '生产镜像不带 seed-assets：请在临时容器里挂宿主机仓库的 $PWD/prisma 再跑（docs/内容平台/扩容基础设施-1007.md）；确实要跳过缺的图加 --allow-missing-images',
    )
  }

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
    // 与 src/lib/content/tags.ts 的 CONTENT_BOARDS 一致
    { slug: 'apps', name: 'AI 应用', description: 'AI 应用与工作流分享、作者自荐', icon: '🧩', sortOrder: 92 },
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
  const appBoard = await boardId('apps')
  if (!dry && (!promptBoard || !guideBoard || !appBoard)) throw new Error('内容专用板块不存在')
  const apps = bundle.apps ?? []

  // 已存在的（类型 + slug）一次查出来（内容扩容：两千多条逐条 findFirst 太慢）。含已删除的：删掉的不重新导入
  const existingRows = await prisma.forumPost.findMany({
    where: { type: { in: ['PROMPT', 'GUIDE', 'APP'] }, slug: { not: null } },
    select: { id: true, type: true, slug: true, userId: true, reviewStatus: true },
  })
  const existing = new Map(existingRows.map((r) => [`${r.type}:${r.slug}`, r]))
  // --only-slugs a,b：配合 --refresh-guides，只刷新点名的几篇（没改过的教程不动，免得白白刷新它们的更新时间）
  const onlySlugs = arg('--only-slugs') ? new Set(arg('--only-slugs')!.split(',').map((x) => x.trim()).filter(Boolean)) : null
  const statusOf = (live: boolean, prev?: { reviewStatus: string }) =>
    // 刷新已公开的条目时不把它撤回队列；其余按本次模式
    live ? (prev?.reviewStatus === 'APPROVED' ? 'APPROVED' : liveStatus) : 'PENDING'

  for (const p of bundle.prompts) {
    if (existing.has(`PROMPT:${p.slug}`)) {
      skipped++
      continue
    }
    const urls: string[] = []
    for (const im of p.images) {
      const u = await placeImage(im, uploadsDir, author.id, dry)
      if (u) urls.push(u)
    }
    // 能不能直接公开（或进定时队列）：图像类要有图；视频、文本类可以
    const live = canGoLive && (p.facet !== 'IMAGE' || urls.length > 0)
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
        reviewStatus: statusOf(live),
        reviewedAt: statusOf(live) === 'APPROVED' ? new Date() : null,
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

  // 正文插图：seed:文件名 → 复制进上传目录后的地址；找不到的整行去掉（不留坏图）。教程与应用共用
  const placeBodyImages = async (body: string, images: string[]) => {
    let content = body
    for (const im of images) {
      const u = await placeImage(im, uploadsDir, author.id, dry)
      content = u
        ? content.split(`(seed:${im})`).join(`(${u})`)
        : content
            .split('\n')
            .filter((line) => !line.includes(`(seed:${im})`))
            .join('\n')
    }
    return content
  }

  for (const g of bundle.guides) {
    const prev = existing.get(`GUIDE:${g.slug}`)
    // --refresh-guides：种子教程改版后（换成官方资料与截图）刷新已导入的那几篇——只动导入账号自己发的、还没被改成别的作者的
    if (prev && !(flag('--refresh-guides') && prev.userId === author.id && (!onlySlugs || onlySlugs.has(g.slug)))) {
      skipped++
      continue
    }
    const content = await placeBodyImages(g.content, g.images ?? [])
    const checkedOn = g.checkedOn ? new Date(`${g.checkedOn}T00:00:00Z`) : null
    // 站方据官方文档整理完、没有截图占位的，可以随 --publish 直接公开（--schedule 则进队列）；否则待审
    const live = canGoLive && !!checkedOn && !/【截图[:：]/.test(content)
    if (dry) {
      created++
      if (live) published++
      continue
    }
    const data = {
      title: g.title,
      content,
      excerpt: g.excerpt.slice(0, 300),
      accountTier: g.accountTier,
      checkedOn,
      reviewStatus: statusOf(live, prev),
      reviewedAt: statusOf(live, prev) === 'APPROVED' ? new Date() : null,
      reviewNote: live
        ? null
        : todo([
            g.screenshots.length ? `截图：${g.screenshots.join(' / ')}` : null,
            g.verify.length ? `核对：${g.verify.join(' / ')}` : null,
            checkedOn ? null : '实测后填测试日期',
          ]),
    }
    if (prev) {
      await prisma.forumPost.update({ where: { id: prev.id }, data: { ...data, contentUpdatedAt: new Date() } })
    } else {
      await prisma.forumPost.create({
        data: {
          ...data,
          type: 'GUIDE',
          slug: g.slug,
          categoryId: guideBoard!,
          userId: author.id,
          authorName,
          // 测试日期留空：站长亲自实测后在编辑页填上；只有 checkedOn 的页面写「资料核对于」，不写「实测」
          testedOn: null,
          tags: '',
          lastReplyAt: new Date(),
          originality: 'ORIGINAL_FIRST',
          aiAssist: 'PARTIAL',
          postTags: { create: g.tags.map((s) => tagId.get(s)).filter((x): x is number => !!x).map((id) => ({ tagId: id })) },
        },
      })
    }
    created++
    if (live) published++
  }

  // —— AI 应用（10-07）——
  for (const a of apps) {
    const prev = existing.get(`APP:${a.slug}`)
    if (prev && !(flag('--refresh-apps') && prev.userId === author.id)) {
      skipped++
      continue
    }
    const content = await placeBodyImages(a.content, a.images)
    const checkedOn = new Date(`${a.checkedOn}T00:00:00Z`)
    // checkedOn 在编译时已是必填；有截图占位的先待审
    const live = canGoLive && !/【截图[:：]/.test(content)
    if (dry) {
      created++
      if (live) published++
      continue
    }
    const spec = { name: a.name, url: a.url, pricing: a.pricing, platforms: a.platforms, trialNote: a.trialNote, selfPromo: false, relation: null }
    const data = {
      title: a.title,
      content,
      excerpt: a.excerpt.slice(0, 300),
      checkedOn,
      reviewStatus: statusOf(live, prev),
      reviewedAt: statusOf(live, prev) === 'APPROVED' ? new Date() : null,
      reviewNote: live ? null : todo(['正文还有【截图】占位：补图后再审']),
    }
    if (prev) {
      await prisma.forumPost.update({
        where: { id: prev.id },
        data: { ...data, contentUpdatedAt: new Date(), app: { upsert: { create: spec, update: spec } } },
      })
    } else {
      await prisma.forumPost.create({
        data: {
          ...data,
          type: 'APP',
          slug: a.slug,
          categoryId: appBoard!,
          userId: author.id,
          authorName,
          testedOn: null,
          tags: '',
          lastReplyAt: new Date(),
          originality: 'ORIGINAL_FIRST',
          aiAssist: 'PARTIAL',
          app: { create: spec },
          postTags: { create: a.tags.map((s) => tagId.get(s)).filter((x): x is number => !!x).map((id) => ({ tagId: id })) },
        },
      })
    }
    created++
    if (live) published++
  }

  // 4) 定时放量队列整队重排（--schedule；新旧 SCHEDULED 条目一起交错）
  let queued = 0
  if (schedule && !dry) queued = await rerankScheduled()

  // 5) 站内链接：种子正文里写的是 [标题](/guides/{slug})，而站内地址是 /guides/{id}-{slug}（id 导入后才知道）。
  //    每次导入结束都把这位作者名下正文里的「只有 slug」链接换成真实地址（已导入的旧文也一起纠正）
  const linksFixed = dry ? 0 : await fixInternalLinks(author.id)
  if (linksFixed) console.log(`站内链接：${linksFixed} 篇正文里的 slug 链接已换成带 id 的地址`)

  const liveWord = schedule ? '进入定时放量队列' : '直接公开'
  console.log(
    `${dry ? '[演练] ' : ''}专题介绍写入 ${introWritten} 个；内容新建 / 刷新 ${created} 条（其中${liveWord} ${published} 条，其余待审）、已存在跳过 ${skipped} 条；作者 ${authorName}` +
      (schedule && !dry ? `；队列现有 ${queued} 条，已按类型 / 大类 / 主题交错重排` : ''),
  )
}

const LINK_SECTIONS: Record<string, string> = { guides: 'GUIDE', prompts: 'PROMPT', apps: 'APP' }
/** 这些是真实存在的列表页，不是内容 slug：/prompts/text、/apps/showcase 等原样保留 */
const RESERVED_SEGMENTS = new Set(['image', 'video', 'text', 'showcase', 'm', 't', 'p'])

/**
 * 把正文里 `](/guides/{slug})`、`](/prompts/{slug})`、`](/apps/{slug})` 换成 `/{段}/{id}-{slug}`。
 * 找不到目标的去掉链接、保留文字（不留死链）。只改 content，不动更新时间。返回改了几篇。
 */
async function fixInternalLinks(authorId: number): Promise<number> {
  const targets = await prisma.forumPost.findMany({
    where: { type: { in: ['GUIDE', 'PROMPT', 'APP'] }, slug: { not: null }, deletedAt: null },
    select: { id: true, type: true, slug: true },
  })
  const idOf = new Map(targets.map((t) => [`${t.type}:${t.slug}`, t.id]))
  const posts = await prisma.forumPost.findMany({
    where: { userId: authorId, deletedAt: null, OR: [{ content: { contains: '](/guides/' } }, { content: { contains: '](/prompts/' } }, { content: { contains: '](/apps/' } }] },
    select: { id: true, content: true },
  })
  let changed = 0
  for (const post of posts) {
    const next = post.content.replace(/\[([^\]\n]*)\]\(\/(guides|prompts|apps)\/([a-z][a-z0-9-]*)\)/g, (all, text: string, sec: string, slug: string) => {
      if (RESERVED_SEGMENTS.has(slug)) return all
      const id = idOf.get(`${LINK_SECTIONS[sec]}:${slug}`)
      return id ? `[${text}](/${sec}/${id}-${slug})` : text
    })
    if (next !== post.content) {
      await prisma.forumPost.update({ where: { id: post.id }, data: { content: next } })
      changed++
    }
  }
  return changed
}

/**
 * 给全部 SCHEDULED 条目重写 release_rank（1 起）。分桶：类型 | 模型大类 | 第一个主题（教程取第一个产品），
 * 「第一个」按标签 id 取最小的（导入时标签的先后没有存，取一个确定的即可）。只更新顺序变了的行。
 */
async function rerankScheduled(): Promise<number> {
  const rows = await prisma.forumPost.findMany({
    where: { reviewStatus: 'SCHEDULED', deletedAt: null },
    select: { id: true, type: true, slug: true, releaseRank: true, postTags: { select: { tag: { select: { id: true, kind: true, facet: true, slug: true } } } } },
  })
  const items = rows.map((r) => {
    const tags = r.postTags.map((pt) => pt.tag).sort((a, b) => a.id - b.id)
    const facet = tags.find((t) => t.kind === 'MODEL')?.facet ?? null
    const first = tags.find((t) => t.kind === (r.type === 'GUIDE' ? 'PRODUCT' : 'TOPIC'))?.slug ?? null
    return { key: `${r.type}:${r.slug ?? r.id}`, bucket: bucketOf(r.type, facet, first), id: r.id, rank: r.releaseRank }
  })
  const ordered = releaseOrder(items)
  const changes = ordered.map((it, i) => ({ id: it.id, rank: i + 1, old: it.rank })).filter((c) => c.rank !== c.old)
  for (let i = 0; i < changes.length; i += 200) {
    await prisma.$transaction(changes.slice(i, i + 200).map((c) => prisma.forumPost.update({ where: { id: c.id }, data: { releaseRank: c.rank } })))
  }
  return rows.length
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
