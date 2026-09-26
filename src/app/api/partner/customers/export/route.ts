export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { exportCustomers } from '@/lib/partner-handlers/customers'

export const GET = partnerRoute('customer.export', exportCustomers, { readOnlySafe: true })
