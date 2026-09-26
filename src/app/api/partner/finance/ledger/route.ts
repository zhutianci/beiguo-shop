export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { financeLedger } from '@/lib/partner-handlers/finance'

export const GET = partnerRoute('finance.read', financeLedger, { readOnlySafe: true })
