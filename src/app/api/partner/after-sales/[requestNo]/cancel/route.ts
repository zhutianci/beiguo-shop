export const dynamic = 'force-dynamic'

import { partnerRoute } from '@/lib/tenant/partner-route'
import { cancelAfterSale } from '@/lib/partner-handlers/after-sales'

export const POST = partnerRoute('aftersale.request', cancelAfterSale)
