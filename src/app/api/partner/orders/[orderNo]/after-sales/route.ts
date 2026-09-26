export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { requestAfterSale } from '@/lib/partner-handlers/orders'

export const POST = partnerRoute('aftersale.request', requestAfterSale, { rate: { key: 'pas', max: 20, windowMs: 60_000 } })
