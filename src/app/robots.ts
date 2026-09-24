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
          '/invoice-request/', // 开票填写链接：令牌即凭证，提交后页面上有抬头税号，同收据页
          '/pay/', // 支付页：含订单号，且对爬虫无意义
          '/admin', // 后台
          '/api/', // 接口
          '/lookup', // 订单查询：query 里会带邮箱，属于「抓到就可能泄漏」那一类，必须挡住
          /*
           * 【/orders /profile /login /register /forgot-password 为什么不在这里了】
           * 2026-09-19 从 Disallow 里移出，改为在各自的路由 layout 上声明 noindex
           * （见 src/lib/seo/private-page.ts）。
           *
           * 原因是这两者**互斥而不是双保险**：Disallow 的含义是「别来抓」，
           * Googlebot 根本不会请求这个地址，于是也永远读不到页面上的 noindex——
           * 而 Google 明确说过，被 Disallow 的 URL 只要有外链指过来，
           * 仍然可能以「只有标题没有摘要」的形式留在搜索结果里，且无法通过 noindex 清掉。
           * 真正能让一个页面**退出索引**的只有 noindex，前提是它能被抓到。
           *
           * 这五条既不带 token 也不带隐私参数（背后都是登录态，爬虫看到的就是登录页），
           * 放开抓取没有任何代价。/receipt/ /pay/ /lookup 则相反，保持 Disallow 不动。
           */
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
