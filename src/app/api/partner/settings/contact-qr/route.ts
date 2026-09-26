export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { clearContactQr, uploadContactQr } from '@/lib/partner-handlers/contact'

export const POST = partnerRoute('settings.write', uploadContactQr, { rate: { key: 'pcontactqr', max: 20, windowMs: 3_600_000 } })
export const DELETE = partnerRoute('settings.write', clearContactQr, { rate: { key: 'pcontactqrd', max: 30, windowMs: 60_000 } })
