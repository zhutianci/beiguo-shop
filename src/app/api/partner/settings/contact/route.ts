export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { getContact, setContact } from '@/lib/partner-handlers/contact'

export const GET = partnerRoute('settings.write', getContact, { readOnlySafe: true })
export const PUT = partnerRoute('settings.write', setContact, { rate: { key: 'pcontact', max: 30, windowMs: 60_000 } })
