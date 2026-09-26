export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { financeOrders } from '@/lib/partner-handlers/finance'

export const GET = partnerRoute('finance.read', financeOrders, { readOnlySafe: true })
