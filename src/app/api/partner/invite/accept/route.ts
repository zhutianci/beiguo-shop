export const dynamic = 'force-dynamic'

import { inviteRoute } from '@/lib/tenant/partner-route'
import { acceptInviteHandler } from '@/lib/partner-handlers/invite'

export const POST = inviteRoute(acceptInviteHandler)
