/**
 * 提示词 / 教程的写入校验（内容平台 P1，设计 §5）。发帖 POST 与编辑 PATCH 共用。
 *
 * 只做「这一份输入合不合规」的判断和规整，不落库；落库在路由里（要和审核状态、通知放在一起）。
 * 标签必须是后台建好的、启用中的，并且种类要对得上内容类型——作者不能自己造标签（理由见 schema 的 Tag 注释）。
 */
import { z } from 'zod'
import { prisma } from '../db'
import { ACCOUNT_TIERS, CONTENT_TYPES, type ContentType } from './policy'
import { SKILL_TAG_SLUG } from './skill-lib'

/** AI 应用（设计 §5.3 / §9） */
export const appSchema = z.object({
  name: z.string().trim().min(1, '请填写应用名称').max(60),
  url: z.string().trim().max(500).regex(/^https?:\/\//i, '官网地址需以 http:// 或 https:// 开头'),
  pricing: z.string().trim().max(60).optional().nullable(),
  platforms: z.string().trim().max(100).optional().nullable(),
  trialNote: z.string().trim().max(200).optional().nullable(),
  selfPromo: z.boolean().optional().default(false),
  relation: z.enum(['AUTHOR', 'EMPLOYEE', 'OTHER']).optional().nullable(),
})

export const promptSchema = z.object({
  prompt: z.string().trim().min(10, '提示词至少 10 个字').max(5000, '提示词过长'),
  negativePrompt: z.string().trim().max(2000, '负面提示词过长').optional().nullable(),
  modelLabel: z.string().trim().max(60, '模型版本说明过长').optional().nullable(),
  aspectRatio: z
    .string()
    .trim()
    .max(16)
    .regex(/^(\d{1,2}:\d{1,2})?$/, '画幅比例格式如 3:4')
    .optional()
    .nullable(),
  needsRefImage: z.boolean().optional().default(false),
  useCase: z.string().trim().min(4, '请用一两句话写清楚适合做什么').max(300, '使用场景过长'),
})

/** 发帖与编辑里和内容类型相关的字段（都可选；按类型在 checkTyped 里再收紧） */
export const typedShape = {
  type: z.enum(CONTENT_TYPES).optional(),
  tagIds: z.array(z.number().int().positive()).max(6, '标签最多 6 个').optional(),
  prompt: promptSchema.optional().nullable(),
  app: appSchema.optional().nullable(),
  testedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '测试日期格式不对')
    .optional()
    .nullable()
    .or(z.literal('')),
  accountTier: z.enum(ACCOUNT_TIERS).optional().nullable(),
  excerpt: z.string().trim().max(160, '摘要不超过 160 字').optional().nullable(),
}

export interface TypedInput {
  type?: ContentType
  tagIds?: number[]
  prompt?: z.infer<typeof promptSchema> | null
  app?: z.infer<typeof appSchema> | null
  testedOn?: string | null
  accountTier?: string | null
  excerpt?: string | null
}

/** 每种内容类型允许的标签种类与数量要求 */
const TAG_RULES: Record<'PROMPT' | 'GUIDE' | 'APP', { allowed: string[]; required: Record<string, [number, number]> }> = {
  APP: { allowed: ['TOPIC', 'MODEL', 'PRODUCT'], required: { TOPIC: [0, 3], MODEL: [0, 2], PRODUCT: [0, 2] } },
  PROMPT: { allowed: ['MODEL', 'TOPIC'], required: { MODEL: [1, 1], TOPIC: [0, 3] } },
  GUIDE: { allowed: ['PRODUCT', 'MODEL', 'TOPIC'], required: { PRODUCT: [1, 2], MODEL: [0, 2], TOPIC: [0, 2] } },
}
const KIND_NAMES: Record<string, string> = { MODEL: '模型', TOPIC: '主题', PRODUCT: '产品' }

/** 测试日期：不能晚于今天、不能早于 2022 年（ChatGPT 之前的「实测」不可信） */
export function parseTestedOn(s: string | null | undefined, now: Date = new Date()): Date | null | 'invalid' {
  if (!s) return null
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return 'invalid'
  if (d.getTime() > now.getTime() + 86_400_000 || d.getUTCFullYear() < 2022) return 'invalid'
  return d
}

/**
 * 校验并规整与类型相关的字段。返回错误文案或规整后的结果。
 * `full` = 发帖（必填项都要有）；编辑时只校验传了的字段，但传了 tagIds 就按完整规则校验一遍。
 */
export async function checkTyped(
  type: ContentType,
  d: TypedInput,
  ctx: { full: boolean; imageCount: number; content: string },
): Promise<{ error: string } | { tagIds?: number[]; testedOn?: Date | null; facet?: string | null }> {
  if (type === 'DISCUSSION') {
    if (d.prompt || (d.tagIds && d.tagIds.length)) return { error: '讨论帖不需要提示词与策展标签' }
    return {}
  }

  const out: { tagIds?: number[]; testedOn?: Date | null; facet?: string | null } = {}

  if (d.tagIds !== undefined || ctx.full) {
    const ids = Array.from(new Set(d.tagIds ?? []))
    const tags = ids.length ? await prisma.tag.findMany({ where: { id: { in: ids }, status: 1 }, select: { id: true, slug: true, kind: true, facet: true } }) : []
    if (tags.length !== ids.length) return { error: '有标签不存在或已停用，请刷新后重选' }
    // 「Skill 库」标签只能挂在 AI 应用上：/skills 目录按「应用 + 这个标签」取数，提示词 / 教程挂了它哪儿也不会列出来
    if (type !== 'APP' && tags.some((t) => t.slug === SKILL_TAG_SLUG)) return { error: '「Skill 库」标签只用于 AI 应用' }
    const rule = TAG_RULES[type]
    for (const t of tags) if (!rule.allowed.includes(t.kind)) return { error: `${type === 'PROMPT' ? '提示词' : type === 'APP' ? 'AI 应用' : '教程'}不能用「${KIND_NAMES[t.kind]}」类标签` }
    for (const [kind, [min, max]] of Object.entries(rule.required)) {
      const n = tags.filter((t) => t.kind === kind).length
      if (n < min) return { error: `请选择${KIND_NAMES[kind]}${min > 1 ? `（至少 ${min} 个）` : ''}` }
      if (n > max) return { error: `${KIND_NAMES[kind]}最多选 ${max} 个` }
    }
    out.tagIds = ids
    out.facet = tags.find((t) => t.kind === 'MODEL')?.facet ?? null
  }

  if (type === 'PROMPT') {
    if (ctx.full && !d.prompt) return { error: '请填写提示词' }
    // 设计 §5.1：图像类至少 1 张效果图；视频类封面可选（视频不在站内托管）；文本类（科研、文案……）不需要图
    if (ctx.full && out.facet === 'IMAGE' && ctx.imageCount < 1) return { error: '请至少上传 1 张你自己用这条提示词生成的效果图' }
    if (ctx.full && out.facet === 'TEXT' && ctx.content.trim().length < 20) return { error: '请写一段使用说明或示例输出（文本类提示词没有效果图，靠它说明效果）' }
  }

  if (type === 'APP') {
    if (ctx.full && !d.app) return { error: '请填写应用名称与官网' }
    if (ctx.full && ctx.content.trim().length < 50) return { error: '请写写「我用它解决了什么」（至少 50 字，写得越具体越容易被精选）' }
    if (d.app?.selfPromo) {
      if (!d.app.relation) return { error: '作者自荐请选择你与这个产品的关系' }
      if (!d.app.trialNote?.trim()) return { error: '作者自荐必须写明怎么试用（免费额度、试用链接或演示）' }
    }
  }

  if (type === 'GUIDE') {
    if (ctx.full && !ctx.content.trim()) return { error: '正文不能为空' }
    if (ctx.full && !d.testedOn) return { error: '请填写测试日期（教程要注明是哪天实测的）' }
    if (ctx.full && !d.accountTier) return { error: '请选择测试时用的账号类型' }
  }

  if (d.testedOn !== undefined) {
    const t = parseTestedOn(d.testedOn)
    if (t === 'invalid') return { error: '测试日期不对（不能晚于今天）' }
    out.testedOn = t
  }
  return out
}
