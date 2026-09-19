'use client'

import { LineChart } from 'lucide-react'
import TrafficAnalytics from '@/components/admin/traffic-analytics'

/**
 * 后台 · 网页流量分析。
 *
 * 【为什么单独开一个页面而不是塞进仪表盘】仪表盘上已经有外部订单与卡密两块钱的分析，
 * 它们回答的是「赚了多少」；流量回答的是「人从哪来、值不值得继续投」，
 * 是另一套决策，混在一个滚动条里只会让两边都看不清。
 *
 * 页面本身不取数：全部逻辑在 TrafficAnalytics 里，它自己管区间与请求。
 * 这里只负责标题与口径声明——口径写在最上面，是因为看数的人第一眼就该知道
 * 这些数字不是服务器日志，跟 Cloudflare 面板对不上是正常的。
 */
export default function TrafficAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <LineChart className="h-6 w-6 text-primary-600" />
          网页流量分析
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          数据源：站内埋点（PageView / Visitor），前台页面停留满 3 秒后由 sendBeacon 上报，
          按东八区分天与分小时统计。
        </p>
        <p className="mt-1 text-xs text-gray-400">
          不采集 /admin、/api，以及收据、支付、回复等带凭据的页面；同一访客同一页面同一小时只计一次。
          因此这里的数字天然剔除了绝大部分爬虫与预取，会明显低于 Cloudflare / Nginx 日志里的请求数——
          低的那部分正是不该用来做决策的那部分。
        </p>
      </div>

      <TrafficAnalytics />
    </div>
  )
}
