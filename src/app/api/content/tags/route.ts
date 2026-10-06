export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { activeTags } from '@/lib/content/tags'

// 发帖表单用：启用中的策展标签（模型 / 主题 / 产品）。作者只能从这里选，不能自己造（schema 的 Tag 注释）
export async function GET() {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const tags = await activeTags()
    return success(tags.map(({ id, slug, name, kind, facet }) => ({ id, slug, name, kind, facet })))
  } catch (err) {
    console.error('List content tags error:', err)
    return error('获取标签失败')
  }
}
