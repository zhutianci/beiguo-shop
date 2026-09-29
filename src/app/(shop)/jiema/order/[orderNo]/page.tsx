import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { notFoundOnChannel } from '@/lib/storefront/resolve'
import { JiemaOrderClient } from './order-client'

export const dynamic = 'force-dynamic'

/** 与接口同一个订单号格式（lib/jiema/view.ts 的 JIEMA_ORDER_NO_RE；不 import 它，免得把服务端引擎打进这一页） */
const ORDER_NO_RE = /^[0-9A-Za-z]{8,32}$/

/**
 * 号码页 /jiema/order/[orderNo]（docs/短信接码-设计.md §1.10、§1.3、§8.2、D37）。
 *
 * 【只在主站】第一行 notFoundOnChannel()（页面组 layout 已经调过一次；这里再调一次，免得以后有人把 layout 改掉），不包进 try。
 * 【noindex】号码页是个人订单页，一律不收录（layout 对 /jiema 按灰度状态给 robots，这里覆盖成 noindex）。
 * 【数据全在客户端】需要登录并且是本人（接口按 orderNo + userId + 主站查，不符 404）；接口 Cache-Control: no-store。
 * 订单号格式不对的直接 404（与接口同一个正则），不渲染页面。
 */
export const metadata: Metadata = {
  title: '短信接码 · 我的号码',
  robots: { index: false, follow: false },
}

export default async function JiemaOrderPage({ params }: { params: { orderNo: string } }) {
  await notFoundOnChannel()
  if (!ORDER_NO_RE.test(params.orderNo)) notFound()
  return (
    <div className="page-top container max-w-3xl pb-40">
      <JiemaOrderClient orderNo={params.orderNo} />
    </div>
  )
}
