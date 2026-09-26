export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { customerDetail, updateCustomer } from '@/lib/partner-handlers/customers'

export const GET = partnerRoute('customer.read', customerDetail, { readOnlySafe: true })
export const PATCH = partnerRoute('customer.write', updateCustomer, { rate: { key: 'pcustw', max: 60, windowMs: 60_000 } })
