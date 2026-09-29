export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { runBuyerAction } from '@/lib/jiema/buyer-api'
import { buyerFinish } from '@/lib/jiema/engine'

/**
 * 号码页操作（docs/短信接码-设计.md §6.4）：T14：「我已用完，释放号码」（页面二次确认之后才调）→ setStatus 6。
 * 输入 `{ version }`；成功返回最新 JiemaOrderView，失败同样带上最新视图。第一行 denyOnChannel（规则 18）。
 */
export async function POST(request: NextRequest, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return runBuyerAction(request, params.orderNo, 'finish', (so, b) => buyerFinish(so, b.version))
}
