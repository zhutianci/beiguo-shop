export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { getDashboard } from '@/lib/partner-handlers/dashboard'

export const GET = partnerRoute('dashboard.read', getDashboard, { readOnlySafe: true })
