export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { sendNoticeEmailCode } from '@/lib/partner-handlers/settings'

export const POST = partnerRoute('settings.write', sendNoticeEmailCode, { rate: { key: 'pnecode', max: 10, windowMs: 3600_000 } })
