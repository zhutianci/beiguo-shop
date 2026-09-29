export const dynamic = 'force-dynamic'

import { denyOnChannel } from '@/lib/storefront/resolve'
import { viewOrder } from '@/lib/jiema/buyer-api'

/**
 * 号码页数据（docs/短信接码-设计.md §6.4 JiemaOrderView、§6.5 惰性推进、§1.10）。本人、本站，不符 404（E34）；每单每秒 2 次。
 * 顺带触发惰性推进（CAS advancedAt ≥3 秒；当前号 ACTIVE 时 getStatus ≥4 秒一次，D10）。总开关关着也照常可看（只挡新单，E59）。
 */
export async function GET(_req: Request, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return viewOrder(params.orderNo)
}
