export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { priceCommit } from '@/lib/partner-handlers/listings'

export const POST = partnerRoute('listing.write', priceCommit, { rate: { key: 'pl-commit', max: 10, windowMs: 60_000 } })
