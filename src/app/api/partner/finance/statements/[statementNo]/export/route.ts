export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { exportStatement } from '@/lib/partner-handlers/finance'

export const GET = partnerRoute('finance.read', exportStatement, { readOnlySafe: true, rate: { key: 'pstmtcsv', max: 30, windowMs: 60_000 } })
