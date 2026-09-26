export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { getSettings } from '@/lib/partner-handlers/settings'

export const GET = partnerRoute('settings.write', getSettings, { readOnlySafe: true })
