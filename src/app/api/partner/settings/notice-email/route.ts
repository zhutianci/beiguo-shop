export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { setNoticeEmail } from '@/lib/partner-handlers/settings'

export const PUT = partnerRoute('settings.write', setNoticeEmail, { rate: { key: 'psetw', max: 30, windowMs: 60_000 } })
