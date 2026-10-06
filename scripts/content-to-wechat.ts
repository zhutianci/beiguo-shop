/**
 * 把学习平台的精选内容生成公众号稿件（内容平台 P3，设计 §7.6「公众号草稿同步」）。
 *
 *   DATABASE_URL=... npx tsx scripts/content-to-wechat.ts --ids 12,34 [--out ../bigo-wechat/posts] [--site https://bigolab.com]
 *   DATABASE_URL=... npx tsx scripts/content-to-wechat.ts --featured 5          # 最近 5 条精选，每条一篇
 *
 * 只生成 bigo-wechat 流水线的 Markdown 稿件（posts/YYYY-MM-DD-bigolab-c{id}.md），**不调微信接口**。
 * 之后照 bigo-wechat/README 走：`npm run preview -- posts/…` 看效果，`npm run draft -- posts/…` 建草稿；发不发由站长在公众号后台点。
 *
 * 【首发于贝果并回链】（设计 §7.6 加粗的那条）：文首写「首发于贝果 AI 学习」，文末给原文地址，
 * frontmatter 的 source_url 也填原文地址（微信「阅读原文」）。公众号不是收录渠道，回链是为了把读者带回站内。
 * 【图片】微信正文只收 jpg / png（bigo-wechat/src/images.mjs 会拒 webp），这里只挑 jpg / png 的图，挑不到就不放图、
 * 封面也留空并在终端提醒（draft 会因为缺封面拒绝，站长自己配一张）。
 * 只依赖 @prisma/client（脚本不 import src/）。
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const arg = (k: string, d = '') => {
  const i = args.indexOf(k)
  return i >= 0 && args[i + 1] ? args[i + 1] : d
}
const OUT = arg('--out', '../bigo-wechat/posts')
const SITE = arg('--site', 'https://bigolab.com').replace(/\/$/, '')
const IDS = arg('--ids')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0)
const FEATURED = Number(arg('--featured', '0'))

const SECTION: Record<string, string> = { PROMPT: '/prompts', GUIDE: '/guides', APP: '/apps', DISCUSSION: '/forum' }
const pathOf = (type: string, id: number, slug: string | null) => `${SECTION[type] ?? '/forum'}/${id}${slug ? `-${slug}` : ''}`
const cut = (s: string, n: number) => {
  const a = Array.from(s.trim())
  return a.length <= n ? a.join('') : `${a.slice(0, n - 1).join('')}…`
}
const imagesOf = (raw: string | null): string[] => {
  try {
    return raw ? (JSON.parse(raw) as unknown[]).filter((u): u is string => typeof u === 'string') : []
  } catch {
    return []
  }
}
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE}${u}`)

async function main() {
  if (!IDS.length && !FEATURED) {
    console.error('用法：--ids 12,34 或 --featured 5')
    process.exitCode = 1
    return
  }
  const posts = await prisma.forumPost.findMany({
    where: {
      status: 1,
      reviewStatus: 'APPROVED',
      deletedAt: null,
      type: { in: ['PROMPT', 'GUIDE', 'APP'] },
      ...(IDS.length ? { id: { in: IDS } } : { featured: true }),
    },
    orderBy: IDS.length ? { id: 'asc' } : { featuredAt: 'desc' },
    take: IDS.length ? IDS.length : FEATURED,
    include: { prompt: true, app: true, user: { select: { nickname: true } } },
  })
  if (!posts.length) {
    console.error('没有找到公开的内容')
    return
  }
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
  fs.mkdirSync(OUT, { recursive: true })

  for (const p of posts) {
    const url = `${SITE}${pathOf(p.type, p.id, p.slug)}`
    const pics = imagesOf(p.images).filter((u) => /\.(jpe?g|png)$/i.test(u))
    const author = p.user?.nickname && !p.user.nickname.includes('@') ? p.user.nickname : p.authorName
    const intro = p.excerpt || p.prompt?.useCase || ''
    const body: string[] = []
    body.push(`> 首发于贝果 AI 学习 · 作者 ${author}。完整内容与评论见文末原文链接。`)
    body.push('')
    if (intro) body.push(intro, '')
    for (const u of pics.slice(0, 4)) body.push(`![](${abs(u)})`, '')
    if (p.type === 'PROMPT' && p.prompt) {
      body.push('## 提示词', '')
      body.push('```text', p.prompt.prompt.trim(), '```', '')
      if (p.prompt.negativePrompt) body.push('**不要出现**：' + p.prompt.negativePrompt.trim(), '')
      if (p.prompt.aspectRatio) body.push(`**比例**：${p.prompt.aspectRatio}`, '')
    }
    if (p.type === 'APP' && p.app) body.push(`**${p.app.name}**${p.app.pricing ? ` · ${p.app.pricing}` : ''}`, '')
    // 正文：站内相对链接改成绝对地址（公众号里站外链接会被渲染器降级成文末参考链接，这正好）
    const content = p.content.replace(/\]\((\/[^)\s]*)\)/g, (_m, u: string) => `](${SITE}${u})`)
    body.push(p.type === 'PROMPT' ? '## 使用说明' : '', '')
    body.push(content.trim(), '')
    body.push('---', '')
    body.push(`原文：${url}`, '')
    body.push('更多可复制的提示词与 AI 教程，在贝果 AI 学习（bigolab.com/learn）。')

    const front = [
      '---',
      `title: ${JSON.stringify(cut(p.title, 32))}`,
      `digest: ${JSON.stringify(cut(intro || p.title, 120))}`,
      'author: 贝果科技bigo',
      `cover: ${pics[0] ? abs(pics[0]) : ''}`,
      `source_url: ${url}`,
      '---',
      '',
    ]
    const file = path.join(OUT, `${today}-bigolab-c${p.id}.md`)
    fs.writeFileSync(file, front.join('\n') + body.join('\n') + '\n', 'utf8')
    console.log(`✓ ${file}${pics[0] ? '' : '  （没有 jpg/png 图：封面要自己配一张，否则 draft 会拒绝）'}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
