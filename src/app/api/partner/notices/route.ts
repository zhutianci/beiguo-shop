export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listNotices } from '@/lib/partner-handlers/notices'

export const GET = partnerRoute('notice.read', listNotices, { readOnlySafe: true })
