/**
 * 后台编辑策展标签的字段校验（新建与修改共用；放 lib 而不是 route.ts，理由同 lib/content/schema.ts）。
 * slug 建好后不能改：它就是 hub 页的 URL。
 */
import { z } from 'zod'

export const tagFieldsShape = {
  name: z.string().trim().min(1).max(40).optional(),
  intro: z.string().trim().max(20000, '介绍过长').optional().nullable(),
  // 只允许指向本站的充值落地页，免得后台手滑填成外链
  landingPath: z
    .string()
    .trim()
    .regex(/^(\/chongzhi\/[a-z0-9-]+)?$/, '落地页只能填 /chongzhi/xxx 形式的站内地址')
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  status: z.number().int().min(0).max(1).optional(),
}
