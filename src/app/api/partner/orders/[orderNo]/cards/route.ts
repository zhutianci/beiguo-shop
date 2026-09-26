export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { orderCards } from '@/lib/partner-handlers/orders'

export const GET = partnerRoute('order.cards', orderCards, { readOnlySafe: true, rate: { key: 'pcards', max: 60, windowMs: 60_000 } })
