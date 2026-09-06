export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'

/**
 * robots.txt。
 *
 * 【为什么这是修数据泄漏而不是做 SEO】
 * 项目此前没有 robots.txt，等于对所有爬虫默认「全站允许收录」。
 * /receipt/[token] 和 /pay/[orderId] 是凭 URL 里的 token 就能看到订单内容的页面——
 * 这类链接会通过邮件、聊天记录、浏览器同步、带 referer 的外链等途径散出去，
 * 被搜索引擎收录一次就是永久可检索的订单数据泄漏。堵这两条是这个文件的首要目的，
 * 排在任何 SEO 收益之前。
 *
 * 注意：robots.txt 只是「请劝退」，不是访问控制。合规爬虫会遵守，恶意抓取不会。
 * 收据页本身的 token 强度与有效期才是真正的防线，这里只负责不主动把它送进索引。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/receipt/', // 带 token 的收据页：收录即泄漏
          '/pay/', // 支付页：含订单号，且对爬虫无意义
          '/admin', // 后台
          '/api/', // 接口
          '/orders', // 我的订单（需登录，收录无意义且可能带参数泄漏）
          '/profile', // 个人中心
          '/lookup', // 订单查询：query 里会带邮箱
          '/login',
          '/register',
          '/forgot-password',
          // 分享渠道（?s=）与新闻归因（?n=）只是同一个页面的带参副本，
          // 内容与不带参时一模一样。放任收录就是自己给自己制造重复内容，
          // 稀释真正那条 URL 的权重。canonical 也会指回去，这里是双保险。
          '/*?s=',
          '/*?n=',
        ],
      },
    ],
    sitemap: absUrl('/sitemap.xml'),
    host: siteOrigin(),
  }
}
