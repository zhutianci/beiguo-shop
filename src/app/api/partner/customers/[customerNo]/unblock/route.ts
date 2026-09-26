export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { unblockCustomer } from '@/lib/partner-handlers/customers'

export const POST = partnerRoute('customer.write', unblockCustomer, { rate: { key: 'pcustw', max: 60, windowMs: 60_000 } })
