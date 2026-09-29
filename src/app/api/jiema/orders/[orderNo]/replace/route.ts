export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { runBuyerAction } from '@/lib/jiema/buyer-api'
import { buyerReplace } from '@/lib/jiema/engine'

/**
 * 号码页操作（docs/短信接码-设计.md §6.4）：T10：换号（满 2 分钟、次数没用完、线程没有受限）。409 VERSION / TOO_EARLY{sec} / NO_LEFT / THREADS；取新号失败保留旧号、回 WAITING。
 * 输入 `{ version, reason?: 'USED'|'REJECTED'|'NO_SMS'|'OTHER' }`；成功返回最新 JiemaOrderView，失败同样带上最新视图。第一行 denyOnChannel（规则 18）。
 */
export async function POST(request: NextRequest, { params }: { params: { orderNo: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return runBuyerAction(request, params.orderNo, 'replace', (so, b) => buyerReplace(so, b.version, b.reason))
}
