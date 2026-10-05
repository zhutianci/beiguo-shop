export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { clearBrandLogo, uploadBrandLogo } from '@/lib/partner-handlers/brand'

export const POST = partnerRoute('settings.write', uploadBrandLogo, { rate: { key: 'pbrandlogo', max: 20, windowMs: 3_600_000 } })
export const DELETE = partnerRoute('settings.write', clearBrandLogo, { rate: { key: 'pbrandlogod', max: 30, windowMs: 60_000 } })
