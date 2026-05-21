import { cookies } from 'next/headers'
import { success } from '@/lib/api'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  return success(null, '已退出登录')
}
