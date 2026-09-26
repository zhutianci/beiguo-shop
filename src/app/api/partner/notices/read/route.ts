export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { markNoticesRead } from '@/lib/partner-handlers/notices'

export const POST = partnerRoute('notice.read', markNoticesRead, { rate: { key: 'pnoticer', max: 60, windowMs: 60_000 } })
