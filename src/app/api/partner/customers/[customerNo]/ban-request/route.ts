export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { banRequest } from '@/lib/partner-handlers/customers'

export const POST = partnerRoute('customer.write', banRequest, { rate: { key: 'pban', max: 20, windowMs: 60_000 } })
