export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { getModules, setModuleOn } from '@/lib/partner-handlers/modules'

export const GET = partnerRoute('settings.write', getModules, { readOnlySafe: true })
export const PUT = partnerRoute('settings.write', setModuleOn, { rate: { key: 'pmodules', max: 30, windowMs: 60_000 } })
