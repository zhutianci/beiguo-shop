/**
 * 策展标签与内容专用板块（内容平台 P1，设计 §3.1 / §7.3）。服务端用。
 *
 * 标签只能后台建（作者只能选），首次访问时按下面的默认表补齐——和 lib/forum.ts 的 ensureDefaultCategories 同一个做法。
 * 默认表只决定「有哪些 hub」，不写 intro：hub 页的介绍要站方按实测写（带日期），
 * 没有介绍的 hub 不会被收录（policy.isHubIndexable），所以空着是安全的。
 *
 * 选词依据是 2026-10-06 的 Google 下拉实测（docs/内容平台/关键词实测-原始数据.md）。
 * 不建「破限 / 擦边」类标签（设计 §2「明确不做的」）；Sora 已于 2026-04 关停，只作历史学习内容保留。
 */
import { prisma } from '../db'
import { CONTENT_BOARD_SLUGS } from './policy'

export type TagKind = 'MODEL' | 'TOPIC' | 'PRODUCT'
export const TAG_KINDS: readonly TagKind[] = ['MODEL', 'TOPIC', 'PRODUCT']
export const TAG_KIND_LABELS: Record<TagKind, string> = { MODEL: '模型', TOPIC: '主题', PRODUCT: '产品' }

interface DefaultTag {
  slug: string
  name: string
  kind: TagKind
  landingPath?: string
}

export const DEFAULT_TAGS: readonly DefaultTag[] = [
  // 模型（提示词 hub：/prompts/m/{slug}）
  { slug: 'gpt-image-2', name: 'GPT-Image-2', kind: 'MODEL', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'nano-banana', name: 'Nano Banana', kind: 'MODEL' },
  { slug: 'seedance', name: 'Seedance', kind: 'MODEL' },
  { slug: 'jimeng', name: '即梦', kind: 'MODEL' },
  { slug: 'kling', name: '可灵', kind: 'MODEL' },
  { slug: 'midjourney', name: 'Midjourney', kind: 'MODEL' },
  { slug: 'veo', name: 'Veo', kind: 'MODEL' },
  { slug: 'sora', name: 'Sora（已停服）', kind: 'MODEL' },
  // 主题（/prompts/t/{slug}）
  { slug: 'id-photo', name: '证件照', kind: 'TOPIC' },
  { slug: 'portrait', name: '写真头像', kind: 'TOPIC' },
  { slug: 'ecommerce', name: '电商商品图', kind: 'TOPIC' },
  { slug: 'poster', name: '海报设计', kind: 'TOPIC' },
  { slug: 'figurine', name: '手办与 3D', kind: 'TOPIC' },
  { slug: 'old-photo', name: '老照片修复', kind: 'TOPIC' },
  { slug: 'comic', name: '漫画分镜', kind: 'TOPIC' },
  { slug: 'sticker', name: '表情包', kind: 'TOPIC' },
  { slug: 'ppt', name: 'PPT 配图', kind: 'TOPIC' },
  { slug: 'logo', name: 'Logo 设计', kind: 'TOPIC' },
  // 产品（教程 hub：/guides/p/{slug}）
  { slug: 'chatgpt', name: 'ChatGPT', kind: 'PRODUCT', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'claude', name: 'Claude', kind: 'PRODUCT', landingPath: '/chongzhi/claude-pro' },
  { slug: 'codex', name: 'Codex', kind: 'PRODUCT', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'gemini', name: 'Gemini', kind: 'PRODUCT' },
]

const CONTENT_BOARDS = [
  { slug: CONTENT_BOARD_SLUGS.PROMPT, name: '提示词', description: '可复制、作者实测过的 AI 提示词', icon: '🎨', sortOrder: 90 },
  { slug: CONTENT_BOARD_SLUGS.GUIDE, name: '教程', description: 'ChatGPT / Claude 等的功能教程与使用技巧', icon: '📘', sortOrder: 91 },
]

let ensured = false

/** 补齐默认标签与两个内容专用板块（幂等；进程内只跑一次，失败下次再试） */
export async function ensureContentDefaults(): Promise<void> {
  if (ensured) return
  for (const t of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: { slug: t.slug, name: t.name, kind: t.kind, landingPath: t.landingPath ?? null, sortOrder: DEFAULT_TAGS.indexOf(t) },
    })
  }
  for (const b of CONTENT_BOARDS) {
    await prisma.forumCategory.upsert({ where: { slug: b.slug }, update: {}, create: b })
  }
  ensured = true
}

/** 内容专用板块的 id（发提示词 / 教程时写进 category_id） */
export async function contentBoardId(type: 'PROMPT' | 'GUIDE'): Promise<number> {
  await ensureContentDefaults()
  const b = await prisma.forumCategory.findUniqueOrThrow({ where: { slug: CONTENT_BOARD_SLUGS[type] } })
  return b.id
}

export async function activeTags(kind?: TagKind) {
  await ensureContentDefaults()
  return prisma.tag.findMany({
    where: { status: 1, ...(kind ? { kind } : {}) },
    orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, slug: true, name: true, kind: true, landingPath: true },
  })
}
