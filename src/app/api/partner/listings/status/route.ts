export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { batchStatus } from '@/lib/partner-handlers/listings'

export const POST = partnerRoute('listing.write', batchStatus, { rate: { key: 'pl-status', max: 10, windowMs: 60_000 } })
