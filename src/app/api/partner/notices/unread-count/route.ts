export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { unreadCount } from '@/lib/partner-handlers/notices'

export const GET = partnerRoute('notice.read', unreadCount, { readOnlySafe: true })
