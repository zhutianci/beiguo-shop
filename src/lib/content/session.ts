/**
 * 「我的」类接口的公共入口：取当前登录用户；写操作同时做同源校验（lib/same-origin，审计 G09）。
 * 返回 Response 表示拒绝（未登录 401 / 跨站 403），调用方原样返回。
 */
import { getCurrentUser } from '../auth'
import { error } from '../api'
import { forumCrossSite } from '../forum-server'
import { denyUnlessModule } from '../storefront/resolve'

/**
 * 内容模块下放（docs/多渠道分销-内容模块下放.md）：渠道站没开「AI学习」时一律 404（以前靠 nginx 渠道白名单挡，
 * 白名单放开 /api/me 之后由这里兜底）。主站放行。
 */
export async function meOrDeny(request: Request, write: boolean) {
  const closed = await denyUnlessModule('learn')
  if (closed) return { user: null, denied: closed }
  if (write) {
    const cross = forumCrossSite(request.headers)
    if (cross) return { user: null, denied: cross }
  }
  const user = await getCurrentUser().catch(() => null)
  if (!user) return { user: null, denied: error('请先登录', 401) }
  return { user, denied: null }
}
