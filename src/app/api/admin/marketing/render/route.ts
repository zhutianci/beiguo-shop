export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { rateLimited } from '@/lib/news/rate-limit'
import { BLOCK_ID_RE, TOPICS } from '@/lib/marketing/types'
import { renderForAdminPreview } from '@/lib/marketing/snapshot'
import { canonicalDoc, cleanSubjectLine, readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 服务端权威预览：解析商品 / 券之后渲染 preview 模式 HTML，并返回全部检查结果（内容 + 服务端 + 渲染后）。
 * 编辑器的实时预览每次改动都会调（有防抖），所以轻度限流；只读，不落库。
 */

const bodySchema = z
  .object({
    doc: z.unknown(),
    subject: z.string().max(200, '邮件主题最多 200 字').nullable().optional(),
    preheader: z.string().max(200, '预览文字最多 200 字').nullable().optional(),
    topic: z.enum(TOPICS, { errorMap: () => ({ message: '主题分类不正确' }) }),
    // 预览参数宽进：0 / 空串 / 不认识的区块 id 都当「没有」，不因为一个高亮参数让整张预览 400
    previewUserId: z.number().int().nonnegative().nullable().optional(),
    selectedBlockId: z.string().max(64).nullable().optional(),
    imagesOff: z.boolean().nullable().optional(),
  })
  .strip()

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    if (rateLimited(`mkt-render:${me.id}`, { windowMs: 60_000, max: 150 })) {
      return error('预览刷新太频繁了，请稍等几秒', 429)
    }
    const body = await readJsonBody(request, 512 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = bodySchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    if (parsed.data.doc === undefined) return error('缺少邮件内容')

    // 与保存走同一套规范化：预览里看到的就是存下来、发出去的那份
    const c = canonicalDoc(parsed.data.doc)
    if (!c.ok) return error(c.error)

    const d = parsed.data
    const r = await renderForAdminPreview({
      doc: c.doc,
      subject: cleanSubjectLine(d.subject ?? ''),
      preheader: cleanSubjectLine(d.preheader ?? ''),
      topic: d.topic,
      previewUserId: d.previewUserId ? d.previewUserId : null,
      selectedBlockId: d.selectedBlockId && BLOCK_ID_RE.test(d.selectedBlockId) ? d.selectedBlockId : null,
      imagesOff: d.imagesOff === true,
    })
    return success({ html: r.html, sizeBytes: r.sizeBytes, imageCount: r.imageCount, issues: r.issues })
  } catch (err) {
    console.error('[admin/marketing] 渲染预览失败:', err)
    return error('渲染预览失败')
  }
}
