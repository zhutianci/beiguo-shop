export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listCustomers } from '@/lib/partner-handlers/customers'

export const GET = partnerRoute('customer.read', listCustomers, { readOnlySafe: true })
