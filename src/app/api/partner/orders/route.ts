export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listOrders } from '@/lib/partner-handlers/orders'

export const GET = partnerRoute('order.read', listOrders, { readOnlySafe: true })
