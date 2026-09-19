import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'

/**
 * 登录态/私密页面的 metadata。
 *
 * 【为什么光有 robots.txt 不够】robots.txt 的 Disallow 只是「别来抓」，
 * 不是「别收录」。Google 明确说过：被 disallow 的 URL 如果有外链指过来，
 * 仍然可能以「只有标题没有摘要」的形式出现在搜索结果里。
 * 真正让一个页面**退出索引**的只有 noindex。
 *
 * 【Disallow 与 noindex 互斥，不要同时用】这是很容易写错的一点：
 * 一个页面同时被 robots.txt Disallow **又**声明 noindex 时，noindex 是无效的——
 * 爬虫根本不会去抓这个地址，自然也读不到那条指令，结果是它既进不了索引、
 * 也永远清不掉已经被收录的 URL-only 记录。
 * 所以 2026-09-19 把 /orders /profile /login /register /forgot-password
 * 从 robots.ts 的 Disallow 里移出来了，只靠这里的 noindex 生效。
 *
 * 仍然留在 Disallow 里的只有三条，它们的风险是「抓到就可能泄漏」，
 * 宁可承受 URL-only 收录也不能放进去抓：
 *   /receipt/ 与 /pay/ —— URL 里带 token，收录即订单数据泄漏
 *   /lookup           —— query 里会带买家邮箱
 * 给这三条加不加 noindex 都无所谓（读不到），加着是为了万一哪天放开 Disallow。
 *
 * 【顺带把标题写对】这些页此前也全都继承首页标题。就算不进索引，
 * 浏览器标签页、书签、微信分享出去的标题也是买家看得见的东西。
 */
export function privatePageMetadata(pageTitle: string, description?: string): Metadata {
  return {
    title: `${pageTitle} - ${SITE_NAME}`,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  }
}
