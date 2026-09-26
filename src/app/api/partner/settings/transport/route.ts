export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { setNoticeTransport } from '@/lib/partner-handlers/settings'

export const PUT = partnerRoute('settings.write', setNoticeTransport, { rate: { key: 'psetw', max: 30, windowMs: 60_000 } })
