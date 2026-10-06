export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { getCurrentUser } from '@/lib/auth'
import { createDigestDraft } from '@/lib/content/digest'

// 生成「本周 AI 学习精选」营销邮件草稿（只建草稿，发送走营销邮件后台的原流程）
export async function POST() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const me = await getCurrentUser()
    const r = await createDigestDraft(me!.id)
    return success({ ...r, href: `/admin/marketing/${r.id}` }, `已生成周报草稿（${r.count} 条内容）`)
  } catch (err) {
    console.error('Digest draft error:', err)
    return error(err instanceof Error ? err.message : '生成失败')
  }
}
