export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { listAudit } from '@/lib/partner-handlers/audit'

export const GET = partnerRoute('audit.read', listAudit, { readOnlySafe: true })
