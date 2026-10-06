/**
 * 发帖 / 编辑共用的 zod 片段。放在 lib 而不是 route.ts：route.ts 只能导出 HTTP handler 与少数配置项，
 * 多导出一个常量会让 next build 报「不是合法的 Route export」（交接文档的坑）。
 */
import { z } from 'zod'
import { AI_ASSIST, ORIGINALITY } from './policy'

/** 帖子正文可选的原创 / AI 声明与原文地址（发帖与编辑共用，见 lib/content/policy） */
export const declarationShape = {
  originality: z.enum(ORIGINALITY).optional(),
  sourceUrl: z
    .string()
    .trim()
    .max(500, '原文地址过长')
    .regex(/^https?:\/\//i, '原文地址需以 http:// 或 https:// 开头')
    .optional()
    .nullable()
    .or(z.literal('')),
  aiAssist: z.enum(AI_ASSIST).optional(),
}
