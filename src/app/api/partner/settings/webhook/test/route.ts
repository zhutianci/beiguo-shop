export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { testWebhook } from '@/lib/partner-handlers/settings'

export const POST = partnerRoute('settings.write', testWebhook, { rate: { key: 'pwhtest', max: 5, windowMs: 3600_000 } })
