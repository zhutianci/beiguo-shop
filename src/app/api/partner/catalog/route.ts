export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { getCatalog } from '@/lib/partner-handlers/catalog'

export const GET = partnerRoute('catalog.read', getCatalog, { readOnlySafe: true })
