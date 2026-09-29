export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { runBuyerAction } from '@/lib/jiema/buyer-api'
import { buyerCancel } from '@/lib/jiema/engine'

/**
 * 号码页操作（docs/短信接码-设计.md §6.4）：T11：取消（满 2 分钟、没收到短信）→ 放号 → 上游确认后整单退回余额。409 VERSION / TOO_EARLY{sec}。
 * 输入 `{ version }`；成功返回最新 JiemaOrderView，失败同样带上最新视图。第一行 denyOnChannel（规则 18）。
 */
export async function POST(request: NextRequest, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return runBuyerAction(request, params.orderNo, 'cancel', (so, b) => buyerCancel(so, b.version))
}
