export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

// 同步回跳：仅用于把用户带回站内（到账以异步 notify 为准）
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  const outTradeNo = new URL(request.url).searchParams.get('out_trade_no') || ''
  return NextResponse.redirect(`${appUrl}/orders?pay=done&no=${encodeURIComponent(outTradeNo)}`)
}
