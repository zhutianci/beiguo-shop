export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/auth'
import { success, unauthorized } from '@/lib/api'

export async function GET() {
  const user = await getCurrentUser()

  const res = user ? success({ user }) : unauthorized()
  // 绝不缓存登录态，避免 CDN/代理把某次（匿名/401）响应缓存给所有人
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.headers.set('Pragma', 'no-cache')
  return res
}
