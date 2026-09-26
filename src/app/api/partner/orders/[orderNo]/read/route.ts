export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { markRead } from '@/lib/partner-handlers/orders'

export const POST = partnerRoute('order.message', markRead)
