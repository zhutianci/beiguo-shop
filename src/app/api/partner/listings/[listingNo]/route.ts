export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { patchListing } from '@/lib/partner-handlers/listings'

export const PATCH = partnerRoute('listing.write', patchListing, { rate: { key: 'pl-patch', max: 60, windowMs: 60_000 } })
