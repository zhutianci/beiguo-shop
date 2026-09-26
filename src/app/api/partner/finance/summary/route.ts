export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { financeSummary } from '@/lib/partner-handlers/finance'

export const GET = partnerRoute('finance.read', financeSummary, { readOnlySafe: true })
