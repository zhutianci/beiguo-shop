export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { statementDetail } from '@/lib/partner-handlers/finance'

export const GET = partnerRoute('finance.read', statementDetail, { readOnlySafe: true })
