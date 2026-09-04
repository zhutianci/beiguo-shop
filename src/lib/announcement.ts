import { z } from 'zod'

// 公告的校验与时间解析。刻意放在 lib 而不是 route.ts：
// Next.js 的 route 文件只允许导出 HTTP handler 与少数几个配置项，
// 多导出一个 schema 会让 `next build` 直接报「不是合法的 Route export」。

export const ANNOUNCEMENT_LEVELS = ['INFO', 'WARN', 'SUCCESS'] as const
export type AnnouncementLevel = (typeof ANNOUNCEMENT_LEVELS)[number]

export const announcementSchema = z.object({
  title: z.string().trim().min(1, '请填写公告标题').max(200),
  content: z.string().trim().min(1, '请填写公告内容').max(5000),
  level: z.enum(ANNOUNCEMENT_LEVELS).default('INFO'),
  enabled: z.boolean().default(false),
  pinned: z.boolean().default(false),
  startAt: z.string().trim().optional().nullable(), // datetime-local 或 ISO 字符串
  endAt: z.string().trim().optional().nullable(),
})

/** datetime-local / ISO 字符串 → Date；空值按 null 处理；非法值返回 'invalid' 由调用方报错 */
export function parseAnnouncementDate(v: string | null | undefined): Date | null | 'invalid' {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? 'invalid' : d
}
