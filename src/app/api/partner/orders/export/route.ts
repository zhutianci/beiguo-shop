export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { exportOrders } from '@/lib/partner-handlers/orders'

export const GET = partnerRoute('order.export', exportOrders, { readOnlySafe: true })
