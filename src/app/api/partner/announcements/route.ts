export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { createAnnouncement, listAnnouncements } from '@/lib/partner-handlers/brand'

export const GET = partnerRoute('settings.write', listAnnouncements, { readOnlySafe: true })
export const POST = partnerRoute('settings.write', createAnnouncement, { rate: { key: 'pann', max: 30, windowMs: 60_000 } })
