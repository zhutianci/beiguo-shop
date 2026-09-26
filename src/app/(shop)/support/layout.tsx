import type { Metadata } from 'next'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/graph'
import { SITE_NAME } from '@/lib/product-seo'
import { supportFaqs } from '@/lib/support-faq'
import { Breadcrumbs } from '@/components/landing/landing-ui'
import { OG_IMAGES, TWITTER_IMAGES } from '@/lib/seo/og'
import { getStorefront } from '@/lib/storefront/resolve'
import { resolveStoreContact } from '@/lib/contact'

/**
 * 客服中心。这一页是全站信息型内容最扎实的一块（8 条真实问答 + 4 份上手指引），
 * 却和首页共用同一个标题，等于把一页现成的长尾流量入口白白扔掉。
 *
 * 【JSON-LD 放在 layout 里】页面本体是 'use client'，注入不了服务端 JSON-LD；
 * layout 是 Server Component，渲染出来的 <script> 就在首屏 HTML 里。
 * 问答数据与页面渲染的是同一份（lib/support-faq.ts），不会出现「标记了看不见的内容」。
 *
 * 【按店面生成（二期改动 4.2）】第 1 条问答里有客服微信号，渠道站要显示渠道自己的客服：
 * 这里用 getStorefront().contact，页面用 useStorefront().contact——同一个店面、同一份数据，JSON-LD 与页面仍逐字对得上。
 * getStorefront 不进 try（店面解析靠异常做控制流）；拿不到店面时 (shop)/layout 已经 404，这里按主站客服兜底。
 */
const TITLE = `常见问题与售后支持 - ChatGPT / Claude 充值答疑 - ${SITE_NAME}`
const DESCRIPTION =
  'ChatGPT、Claude 充值与订阅的常见问题：订单查不到怎么办、掉订阅如何退款、账号被封怎么处理、如何续费与换套餐，以及首次登录的分步指引。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/support' },
  openGraph: { images: OG_IMAGES, type: 'website', title: TITLE, description: DESCRIPTION, url: '/support' },
}

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const sf = await getStorefront()
  const contact = sf ? sf.contact : resolveStoreContact(null)
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(supportFaqs(contact)),
          breadcrumbJsonLd([{ name: '首页', path: '/' }, { name: '常见问题' }]),
        ]}
      />
      {/* 可见面包屑。上面输出了 BreadcrumbList，页面上就必须真的有——
          标记用户看不到的内容是明令禁止的。/support 自己带 page-top，这里只占一行。 */}
      <div className="container relative page-top pb-0">
        <Breadcrumbs crumbs={[{ name: '首页', path: '/' }, { name: '常见问题' }]} />
      </div>
      {children}
    </>
  )
}
