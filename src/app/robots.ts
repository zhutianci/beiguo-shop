export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { getStorefront } from '@/lib/storefront/resolve'

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
/*
 * 【渠道分站（设计 4.8）】robots.txt 按店面输出：
 *  · 主站：原对象抽成 platformRobots() 原样返回（验收 W1-6：与改造前逐字相同）。
 *  · 渠道站：见 channelRobots()。
 * 【为什么靠 getStorefront() 转动态】Next 14.2 的 metadata loader 不转导出 robots.ts 的 segment config，
 * 上面那行 `export const dynamic` 实际不生效，改造前的 robots.txt 很可能是构建期生成的静态文件。
 * 调用 getStorefront()（内部 headers()）是让它按请求生成的唯一可靠办法；也因此**不能包进 try**。
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const sf = await getStorefront()
  if (sf && sf.kind === 'PLATFORM') return platformRobots()
  return channelRobots()
}

/**
 * 渠道站（以及没有店面的 Host）：
 *  · 对 AI 爬虫整站 Disallow：渠道站内容与主站相同，只是价格不同，不给训练 / 答案引擎抓一份「另一个价」；
 *  · 对其他 UA **不写** `Disallow: /`：页面上的 noindex（根布局 robots + nginx X-Robots-Tag）要被抓到才生效，
 *    整站 Disallow 反而会让外链指向的地址以「无摘要」形式留在搜索结果里（与上面主站那段理由相同）；
 *    只挡带令牌 / 私密的路径、渠道后台 /partner 与接口；
 *  · 不输出 sitemap 行（渠道站 sitemap 为空）与 host 行。
 */
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Bytespider']

function channelRobots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_CRAWLERS, disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/receipt/',
          '/invoice-request/',
          '/unsubscribe/',
          '/finance/',
          '/reply/',
          '/pay/',
          '/admin',
          '/partner',
          '/api/',
          '/lookup',
          '/*?s=',
          '/*?n=',
        ],
      },
    ],
  }
}

function platformRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/receipt/', // 带 token 的收据页：收录即泄漏
          '/invoice-request/', // 开票填写链接：令牌即凭证，提交后页面上有抬头税号，同收据页
          '/unsubscribe/', // 营销邮件订阅设置页：令牌即凭证（凭它能改收件人的订阅），页面上还有打码邮箱
          '/finance/', // 财务开票台（企微通知链接）：令牌即凭证，页面上是全部待开发票的抬头税号银行账号
          '/reply/', // 客服快捷回复页（企微通知链接）：令牌即凭证，能看订单留言并以客服身份回复
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
