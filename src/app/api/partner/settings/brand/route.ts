export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { getBrand, setBrand } from '@/lib/partner-handlers/brand'

export const GET = partnerRoute('settings.write', getBrand, { readOnlySafe: true })
export const PUT = partnerRoute('settings.write', setBrand, { rate: { key: 'pbrand', max: 30, windowMs: 60_000 } })
