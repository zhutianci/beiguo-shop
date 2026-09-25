export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { resolvePastedUsers } from '@/lib/marketing/audience'
import { readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 手工受众：粘贴「用户 ID 或邮箱」（换行 / 逗号 / 空格分隔）→ 用户 id。
 * 只认注册用户（设计 2.2：不发给非注册邮箱），没找到的原样返回给界面提示。
 */

// 5000 个邮箱 × 平均 40 字节 ≈ 200KB；给到 300KB
const MAX_TEXT = 300 * 1024

const bodySchema = z
  .object({
    text: z.string({ required_error: '请粘贴用户 ID 或邮箱' }).max(MAX_TEXT, '粘贴的内容太长了，一次最多 5000 人'),
  })
  .strip()

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = await readJsonBody(request, MAX_TEXT * 4 + 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = bodySchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    if (!parsed.data.text.trim()) return error('请粘贴用户 ID 或邮箱')

    const r = await resolvePastedUsers(parsed.data.text)
    return success(r)
  } catch (err) {
    console.error('[admin/marketing] 解析粘贴的受众失败:', err)
    return error('解析失败')
  }
}
