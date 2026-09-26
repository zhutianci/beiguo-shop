export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listMessages, postMessage } from '@/lib/partner-handlers/orders'

export const GET = partnerRoute('order.message', listMessages, { readOnlySafe: true })
export const POST = partnerRoute('order.message', postMessage, { rate: { key: 'pmsg', max: 30, windowMs: 60_000 } })
