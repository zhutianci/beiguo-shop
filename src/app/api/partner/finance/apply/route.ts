export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { financeApply } from '@/lib/partner-handlers/finance'

export const POST = partnerRoute('finance.apply', financeApply, { rate: { key: 'papply', max: 10, windowMs: 60_000 } })
