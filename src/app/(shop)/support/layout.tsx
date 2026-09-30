import type { Metadata } from 'next'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/graph'
import { SITE_NAME } from '@/lib/product-seo'
import { supportFaqs } from '@/lib/support-faq'
import { Breadcrumbs } from '@/components/landing/landing-ui'
import { pageOg } from '@/lib/seo/og'
import { getStorefront } from '@/lib/storefront/resolve'
import { resolveStoreContact } from '@/lib/contact'
import { jiemaSupportData } from '@/lib/jiema/support-zone'
import { storefrontFeatures } from '@/lib/storefront/public'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { JiemaSupportProvider } from './jiema-zone'
import { brandMetadata } from '@/lib/storefront/brand-meta'

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
 *
 * 【短信接码分区（S3，docs/短信接码-设计.md §8.3、§6.6 第 33 条）】只在主站、接码对全部用户开放时（或管理员预览）由 lib/jiema/support-zone 给出数据，
 * 经 JiemaSupportProvider 交给页面渲染 #jiema 分区；**只有对全部用户开放（mode=OPEN）时** 13 条接码问答才并进 FAQPage 结构化数据
 * （管理员预览时普通访客看不到这些问答，不能标记）。渠道站与灰度期普通访客：数据为 null，页面与结构化数据都与改造前逐字相同。
 */
/*
 * 【title 按接码开放状态出两版（docs/SEO-重构/SEO-重构设计.md §3.2-J；§8.2 没分给任何包，A 包评审后按默认认领）】
 * 设计原文是「常见问题与售后：充值、短信接码、退款与开票 - 贝果科技」（灰度期去掉「短信接码」）。这里**去掉了「开票」**：
 * §3.4 / §9.2-3「写到开票必带 6%」对 title 同样生效（check-seo-copy 的 invoice-6pct 逐字段查），title 里放不下完整口径；
 * 开票的完整问答只在 /chongzhi（§3.1），「发票」一簇的搜索需求以台湾电子发票为主、大陆需求未证实（§2.2），去掉它不损失主词。
 * 「短信接码」只在主站、对全部用户开放（jiemaPublicOpen）时进 title：灰度期与渠道站不能在可收录的页面上宣传未开放的业务（D28）。
 * 读不到接码配置按关（fail-closed）：title 退回不带接码的一版，不让 /support 因为接码配置坏了而 500。
 */
const TITLE = `常见问题与售后：充值与退款 - ${SITE_NAME}`
const TITLE_JIEMA = `常见问题与售后：充值、短信接码与退款 - ${SITE_NAME}`
const DESCRIPTION =
  'ChatGPT、Claude 充值与订阅的常见问题：订单查不到怎么办、掉订阅如何退款、账号被封怎么处理、如何续费与换套餐，以及首次登录的分步指引。'

/** 渠道改了站名时 brandMetadata 把标题里的「贝果科技」换掉；主站原样（src/lib/storefront/brand-meta.ts） */
export async function generateMetadata(): Promise<Metadata> {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  const jiemaOpen =
    !!sf && sf.kind === 'PLATFORM' && storefrontFeatures(sf).jiema && jiemaPublicOpen(await readSmsConfigCached().catch(() => null))
  const title = jiemaOpen ? TITLE_JIEMA : TITLE
  return brandMetadata({
    title,
    description: DESCRIPTION,
    alternates: { canonical: '/support' },
    ...pageOg({ title, description: DESCRIPTION, path: '/support' }),
  })
}

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const sf = await getStorefront()
  const contact = sf ? sf.contact : resolveStoreContact(null)
  const jiema = await jiemaSupportData(sf)
  const faqs = jiema?.mode === 'OPEN' ? [...supportFaqs(contact), ...jiema.faqs] : supportFaqs(contact)
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(faqs),
          breadcrumbJsonLd([{ name: '首页', path: '/' }, { name: '常见问题' }]),
        ]}
      />
      {/* 可见面包屑。上面输出了 BreadcrumbList，页面上就必须真的有——
          标记用户看不到的内容是明令禁止的。/support 自己带 page-top，这里只占一行。 */}
      <div className="container relative page-top pb-0">
        <Breadcrumbs crumbs={[{ name: '首页', path: '/' }, { name: '常见问题' }]} />
      </div>
      <JiemaSupportProvider value={jiema}>{children}</JiemaSupportProvider>
    </>
  )
}
