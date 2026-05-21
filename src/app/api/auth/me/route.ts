export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/auth'
import { success, unauthorized } from '@/lib/api'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return unauthorized()
  }

  return success({ user })
}
