export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { listTemplateItems } from '@/lib/marketing/campaign-repo'

/** 模板列表：内置模板（key = preset:<key>，不可改删）+ 另存的模板（key = tpl:<id>，最近更新在前） */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success({ list: await listTemplateItems() })
  } catch (err) {
    console.error('[admin/marketing] 读取模板列表失败:', err)
    return error('读取模板列表失败')
  }
}
