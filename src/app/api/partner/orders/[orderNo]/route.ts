export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { orderDetail } from '@/lib/partner-handlers/orders'

export const GET = partnerRoute('order.read', orderDetail, { readOnlySafe: true })
