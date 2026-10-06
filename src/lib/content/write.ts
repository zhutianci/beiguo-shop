/**
 * 提示词 / 教程的写入校验（内容平台 P1，设计 §5）。发帖 POST 与编辑 PATCH 共用。
 *
 * 只做「这一份输入合不合规」的判断和规整，不落库；落库在路由里（要和审核状态、通知放在一起）。
 * 标签必须是后台建好的、启用中的，并且种类要对得上内容类型——作者不能自己造标签（理由见 schema 的 Tag 注释）。
 */
import { z } from 'zod'
import { prisma } from '../db'
import { ACCOUNT_TIERS, CONTENT_TYPES, type ContentType } from './policy'

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
  testedOn?: string | null
  accountTier?: string | null
  excerpt?: string | null
}

/** 每种内容类型允许的标签种类与数量要求 */
const TAG_RULES: Record<'PROMPT' | 'GUIDE', { allowed: string[]; required: Record<string, [number, number]> }> = {
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
): Promise<{ error: string } | { tagIds?: number[]; testedOn?: Date | null }> {
  if (type === 'DISCUSSION') {
    if (d.prompt || (d.tagIds && d.tagIds.length)) return { error: '讨论帖不需要提示词与策展标签' }
    return {}
  }

  const out: { tagIds?: number[]; testedOn?: Date | null } = {}

  if (d.tagIds !== undefined || ctx.full) {
    const ids = Array.from(new Set(d.tagIds ?? []))
    const tags = ids.length ? await prisma.tag.findMany({ where: { id: { in: ids }, status: 1 }, select: { id: true, kind: true } }) : []
    if (tags.length !== ids.length) return { error: '有标签不存在或已停用，请刷新后重选' }
    const rule = TAG_RULES[type]
    for (const t of tags) if (!rule.allowed.includes(t.kind)) return { error: `${type === 'PROMPT' ? '提示词' : '教程'}不能用「${KIND_NAMES[t.kind]}」类标签` }
    for (const [kind, [min, max]] of Object.entries(rule.required)) {
      const n = tags.filter((t) => t.kind === kind).length
      if (n < min) return { error: `请选择${KIND_NAMES[kind]}${min > 1 ? `（至少 ${min} 个）` : ''}` }
      if (n > max) return { error: `${KIND_NAMES[kind]}最多选 ${max} 个` }
    }
    out.tagIds = ids
  }

  if (type === 'PROMPT') {
    if (ctx.full && !d.prompt) return { error: '请填写提示词' }
    // 设计 §5.1：至少 1 张作者自己生成的结果
    if (ctx.full && ctx.imageCount < 1) return { error: '请至少上传 1 张你自己用这条提示词生成的效果图' }
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
