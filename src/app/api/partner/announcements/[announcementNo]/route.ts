export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { deleteAnnouncement, updateAnnouncement } from '@/lib/partner-handlers/brand'

export const PUT = partnerRoute('settings.write', updateAnnouncement, { rate: { key: 'pann', max: 30, windowMs: 60_000 } })
export const DELETE = partnerRoute('settings.write', deleteAnnouncement, { rate: { key: 'pannd', max: 30, windowMs: 60_000 } })
