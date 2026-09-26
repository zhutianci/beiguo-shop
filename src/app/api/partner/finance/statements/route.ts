export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listStatements } from '@/lib/partner-handlers/finance'

export const GET = partnerRoute('finance.read', listStatements, { readOnlySafe: true })
