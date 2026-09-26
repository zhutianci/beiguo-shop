export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listAfterSales } from '@/lib/partner-handlers/after-sales'

export const GET = partnerRoute('order.read', listAfterSales, { readOnlySafe: true })
