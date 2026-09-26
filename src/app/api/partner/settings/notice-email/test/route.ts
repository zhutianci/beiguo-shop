export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { testNoticeEmail } from '@/lib/partner-handlers/settings'

export const POST = partnerRoute('settings.write', testNoticeEmail, { rate: { key: 'pnetest', max: 5, windowMs: 3600_000 } })
