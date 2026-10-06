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
import { CONTENT_BOARD_SLUGS, type TypedSection } from './policy'

export type TagKind = 'MODEL' | 'TOPIC' | 'PRODUCT'
export const TAG_KINDS: readonly TagKind[] = ['MODEL', 'TOPIC', 'PRODUCT']
export const TAG_KIND_LABELS: Record<TagKind, string> = { MODEL: '模型', TOPIC: '主题', PRODUCT: '产品' }

/**
 * 提示词的三大类（facet）：图像 / 视频 / 文本。挂在标签上：
 *  - 模型标签：这个模型产出什么（GPT-Image-2 → IMAGE，Seedance → VIDEO，通用大模型 → TEXT）
 *  - 主题标签：这个场景主要属于哪一类（证件照 → IMAGE，科研数据分析 → TEXT），用于筛选条分组
 * 一条提示词属于哪一类，由它的模型标签决定（/prompts/image、/prompts/video、/prompts/text 按这个筛）。
 */
export type Facet = 'IMAGE' | 'VIDEO' | 'TEXT'
export const FACETS: readonly Facet[] = ['IMAGE', 'VIDEO', 'TEXT']
export const FACET_LABELS: Record<Facet, string> = { IMAGE: '图像', VIDEO: '视频', TEXT: '文本' }
export const FACET_PATH: Record<Facet, string> = { IMAGE: '/prompts/image', VIDEO: '/prompts/video', TEXT: '/prompts/text' }

interface DefaultTag {
  slug: string
  name: string
  kind: TagKind
  facet?: Facet
  landingPath?: string
}

export const DEFAULT_TAGS: readonly DefaultTag[] = [
  // ── 模型（提示词 hub：/prompts/m/{slug}）──
  // 图像
  { slug: 'gpt-image-2', name: 'GPT-Image-2', kind: 'MODEL', facet: 'IMAGE', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'nano-banana', name: 'Nano Banana', kind: 'MODEL', facet: 'IMAGE' },
  { slug: 'midjourney', name: 'Midjourney', kind: 'MODEL', facet: 'IMAGE' },
  { slug: 'jimeng', name: '即梦', kind: 'MODEL', facet: 'IMAGE' },
  // 视频
  { slug: 'seedance', name: 'Seedance', kind: 'MODEL', facet: 'VIDEO' },
  { slug: 'kling', name: '可灵', kind: 'MODEL', facet: 'VIDEO' },
  { slug: 'veo', name: 'Veo', kind: 'MODEL', facet: 'VIDEO' },
  { slug: 'sora', name: 'Sora（已停服）', kind: 'MODEL', facet: 'VIDEO' },
  // 文本（对话模型；slug 不能与下面的产品标签 chatgpt / claude / gemini 重名，slug 全表唯一）
  { slug: 'any-llm', name: '通用大模型', kind: 'MODEL', facet: 'TEXT', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'gpt', name: 'ChatGPT', kind: 'MODEL', facet: 'TEXT', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'claude-llm', name: 'Claude', kind: 'MODEL', facet: 'TEXT', landingPath: '/chongzhi/claude-pro' },
  { slug: 'gemini-llm', name: 'Gemini', kind: 'MODEL', facet: 'TEXT' },
  { slug: 'deepseek', name: 'DeepSeek', kind: 'MODEL', facet: 'TEXT' },

  // ── 主题（/prompts/t/{slug}）──
  // 图像
  { slug: 'id-photo', name: '证件照', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'portrait', name: '写真头像', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'ecommerce', name: '电商商品图', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'poster', name: '海报设计', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'figurine', name: '手办与 3D', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'old-photo', name: '老照片修复', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'comic', name: '漫画分镜', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'sticker', name: '表情包', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'ppt', name: 'PPT 配图', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'logo', name: 'Logo 设计', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'illustration', name: '插画风格', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'photography', name: '摄影写实', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'interior', name: '建筑与室内', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'character', name: '角色设计', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'infographic', name: '信息图', kind: 'TOPIC', facet: 'IMAGE' },
  { slug: 'photo-edit', name: '修图改图', kind: 'TOPIC', facet: 'IMAGE' },
  // 视频
  { slug: 'product-video', name: '产品广告片', kind: 'TOPIC', facet: 'VIDEO' },
  { slug: 'image-to-video', name: '图生视频', kind: 'TOPIC', facet: 'VIDEO' },
  { slug: 'cinematic', name: '电影感镜头', kind: 'TOPIC', facet: 'VIDEO' },
  { slug: 'short-drama', name: '短剧分镜', kind: 'TOPIC', facet: 'VIDEO' },
  { slug: 'motion-graphics', name: '动效与片头', kind: 'TOPIC', facet: 'VIDEO' },
  // 文本
  { slug: 'research-data', name: '科研数据分析', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'research-figure', name: '科研绘图', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'paper-writing', name: '论文写作', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'literature', name: '文献阅读', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'copywriting', name: '文案写作', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'social-media', name: '新媒体运营', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'marketing', name: '营销策划', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'video-script', name: '短视频脚本', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'coding', name: '编程开发', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'data-analysis', name: '数据分析', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'office', name: '职场办公', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'learning', name: '学习教育', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'translation', name: '翻译润色', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'product-design', name: '产品与设计', kind: 'TOPIC', facet: 'TEXT' },
  { slug: 'career', name: '求职面试', kind: 'TOPIC', facet: 'TEXT' },

  // ── 产品（教程 hub：/guides/p/{slug}）──
  { slug: 'chatgpt', name: 'ChatGPT', kind: 'PRODUCT', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'claude', name: 'Claude', kind: 'PRODUCT', landingPath: '/chongzhi/claude-pro' },
  { slug: 'codex', name: 'Codex', kind: 'PRODUCT', landingPath: '/chongzhi/chatgpt-plus' },
  { slug: 'gemini', name: 'Gemini', kind: 'PRODUCT' },
]

const CONTENT_BOARDS = [
  { slug: CONTENT_BOARD_SLUGS.PROMPT, name: '提示词', description: '可复制、作者实测过的 AI 提示词', icon: '🎨', sortOrder: 90 },
  { slug: CONTENT_BOARD_SLUGS.GUIDE, name: '教程', description: 'ChatGPT / Claude 等的功能教程与使用技巧', icon: '📘', sortOrder: 91 },
  { slug: CONTENT_BOARD_SLUGS.APP, name: 'AI 应用', description: 'AI 应用与工作流分享、作者自荐', icon: '🧩', sortOrder: 92 },
]

let ensured = false
/** 正在跑的那一次（性能优化 2026-10-07）：进程刚起时并发进来的几个请求共用它，不再各自串行 upsert 五十多次 */
let ensuring: Promise<void> | null = null

/** 补齐默认标签与两个内容专用板块（幂等；进程内只跑一次，失败下次再试） */
export async function ensureContentDefaults(): Promise<void> {
  if (ensured) return
  if (!ensuring) {
    ensuring = runEnsureContentDefaults().finally(() => {
      ensuring = null
    })
  }
  return ensuring
}

async function runEnsureContentDefaults(): Promise<void> {
  for (const t of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      // 已存在的标签只补 facet（P1 建的老标签没有这一列的值），名称、介绍、落地页以后台为准
      update: t.facet ? { facet: t.facet } : {},
      create: { slug: t.slug, name: t.name, kind: t.kind, facet: t.facet ?? null, landingPath: t.landingPath ?? null, sortOrder: DEFAULT_TAGS.indexOf(t) },
    })
  }
  for (const b of CONTENT_BOARDS) {
    await prisma.forumCategory.upsert({ where: { slug: b.slug }, update: {}, create: b })
  }
  ensured = true
}

/** 内容专用板块的 id（发提示词 / 教程时写进 category_id） */
export async function contentBoardId(type: TypedSection): Promise<number> {
  await ensureContentDefaults()
  const b = await prisma.forumCategory.findUniqueOrThrow({ where: { slug: CONTENT_BOARD_SLUGS[type] } })
  return b.id
}

export async function activeTags(kind?: TagKind) {
  await ensureContentDefaults()
  return prisma.tag.findMany({
    where: { status: 1, ...(kind ? { kind } : {}) },
    orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, slug: true, name: true, kind: true, facet: true, landingPath: true },
  })
}
