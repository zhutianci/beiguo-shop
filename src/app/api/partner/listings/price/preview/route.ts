export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { pricePreview } from '@/lib/partner-handlers/listings'

export const POST = partnerRoute('listing.write', pricePreview, { rate: { key: 'pl-preview', max: 30, windowMs: 60_000 } })
