export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { runBuyerAction } from '@/lib/jiema/buyer-api'
import { buyerClose } from '@/lib/jiema/engine'

/**
 * 号码页操作（docs/短信接码-设计.md §6.4）：T18：买家取消待支付订单（payMode 不是 BALANCE）。409 PAID_PROCESSING（钱已到账）/ PAYING（另一个页面刚发起了支付）/ VERSION。
 * 输入 `{ version }`；成功返回最新 JiemaOrderView，失败同样带上最新视图。第一行 denyOnChannel（规则 18）。
 */
export async function POST(request: NextRequest, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return runBuyerAction(request, params.orderNo, 'close', (so, b) => buyerClose(so, b.version))
}
