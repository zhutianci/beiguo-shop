/**
 * 每周精选邮件（内容平台 P2，设计 §7.6）：从近 7 天的精选 / 热门内容生成一封营销邮件**草稿**。
 *
 * 只生成草稿，不发送：站长在「营销邮件」后台照常预览、测试发送、选受众、启动。
 * 这样退订（opt-out 默认可发 + 随时退订，站长 09-25 定的）、去重（CAS + 唯一约束）、每日额度、熔断都沿用营销模块，
 * 内容平台这边不再另起一套发信逻辑。
 */
import { prisma } from '../db'
import { canonicalDoc, auditSafe } from '../marketing/campaign-repo'
import { DEFAULT_AUDIENCE } from '../marketing/types'
import { DEFAULT_SETTINGS } from '../marketing/render'
import { absUrl } from '../news/seo'
import { PUBLIC_WHERE, cardsByIds, listHot, type ContentCard } from './queries'

const para = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] })

/** 近 7 天精选在前，不够用热门补齐，最多 6 条（邮件太长没人看完） */
export async function digestItems(limit = 6): Promise<ContentCard[]> {
  const since = new Date(Date.now() - 7 * 86_400_000)
  const featured = await prisma.forumPost.findMany({
    where: { ...PUBLIC_WHERE, type: { in: ['PROMPT', 'GUIDE'] }, featured: true, featuredAt: { gte: since } },
    orderBy: { featuredAt: 'desc' },
    take: limit,
    select: { id: true },
  })
  const items = await cardsByIds(featured.map((f) => f.id))
  if (items.length < limit) {
    const hot = await listHot({ type: 'PROMPT', page: 1, pageSize: limit * 2 })
    for (const c of hot.items) {
      if (items.length >= limit) break
      if (!items.some((x) => x.id === c.id)) items.push(c)
    }
  }
  return items
}

export async function createDigestDraft(actorId: number): Promise<{ id: number; count: number }> {
  const items = await digestItems()
  if (!items.length) throw new Error('近 7 天没有可放进周报的内容')
  const day = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
  const blocks: Record<string, unknown>[] = [
    {
      id: 'dhero',
      type: 'hero',
      title: '本周 AI 学习精选',
      subtitle: '作者实测、拿来就能用的提示词与教程',
      bg: '#1e1b4b',
      bg2: '#7c3aed',
      color: '#ffffff',
      align: 'center',
    },
    { id: 'dhello', type: 'text', align: 'left', size: 16, content: para('{{nickname|朋友}}，这是本周大家复制最多、被精选的内容：') },
  ]
  items.forEach((c, i) => {
    const href = absUrl(c.path)
    if (c.cover) blocks.push({ id: `dimg${i}`, type: 'image', src: absUrl(c.cover), alt: c.title.slice(0, 120), width: 100, href, align: 'center', radius: 12 })
    blocks.push({ id: `dh${i}`, type: 'heading', level: 3, align: 'left', content: para(c.title.slice(0, 200)) })
    if (c.excerpt) blocks.push({ id: `dt${i}`, type: 'text', align: 'left', size: 15, content: para(c.excerpt.slice(0, 300)) })
    blocks.push({ id: `db${i}`, type: 'button', label: c.type === 'PROMPT' ? '查看并复制提示词' : '阅读教程', href, bg: '#7c3aed', color: '#ffffff', radius: 999, align: 'left', fullWidth: false, size: 'sm' })
    if (i < items.length - 1) blocks.push({ id: `dd${i}`, type: 'divider', color: '#e5e7eb', thickness: 1, widthPct: 100 })
  })
  blocks.push({ id: 'dmore', type: 'button', label: '去 AI 学习平台看更多', href: absUrl('/learn'), bg: '#111827', color: '#ffffff', radius: 999, align: 'center', fullWidth: false, size: 'md' })

  const c = canonicalDoc({ v: 1, settings: { ...DEFAULT_SETTINGS }, blocks })
  if (!c.ok) throw new Error(`周报内容不合法：${c.error}`)
  const row = await prisma.marketingCampaign.create({
    data: {
      name: `AI 学习周报 ${day}`,
      topic: 'NEWS',
      subject: `本周 AI 学习精选：${items[0].title}`.slice(0, 200),
      preheader: `${items.length} 条作者实测的提示词与教程`,
      doc: c.json,
      audience: JSON.stringify(DEFAULT_AUDIENCE),
      status: 'DRAFT',
      createdBy: actorId,
    },
  })
  await auditSafe('CREATE', { actorId, campaignId: row.id, detail: { source: 'content-digest', items: items.map((x) => x.id) } })
  return { id: row.id, count: items.length }
}
