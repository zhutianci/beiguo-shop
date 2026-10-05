import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { PLATFORM_BRAND_NAME } from '@/lib/brand-base'
import { getStorefront } from '@/lib/storefront/resolve'
import { tenantReplyEnabled, verifyTenantReplyToken } from '@/lib/bot/tenant-reply'
import { partnerQuickReplyView, QUICK_REPLY_MAX_LEN } from '@/lib/partner-services/messages'
import { PartnerReplyClient } from './partner-reply-client'

export const dynamic = 'force-dynamic'

/*
 * 渠道快速回复页（docs/微信机器人-设计.md §5.5，站长 Q10）：微信机器人推到分站群的买家留言里带的链接指向这里，
 * 代理在手机上点开就能看这一单的留言、以「本店」身份回一条（买家看到的是「客服」），不用先登录渠道后台。
 *
 * 【放在哪】独立的一级路径 /partner-reply，刻意不在 /partner/ 下：
 *  · middleware 的 matcher（/admin、/api/admin、/partner、/api/partner 四项，都按路径段匹配）命中不了 /partner-reply 与 /api/partner-reply，
 *    这条路径根本不经过 middleware（函数体里 startsWith('/partner') 的粗分流因此也碰不到它），鉴权全在本页与接口自己做；
 *  · 不在 (shop) 路由组里，不套店面外壳（导航、页脚、埋点、实时成交之类的营销组件）——这是内部工具；
 *  · nginx：页面路径不受渠道 /api 白名单约束，照常进应用；主站 Host 的 /partner 拒绝规则是 partner(/|$)，碰不到 /partner-reply，
 *    主站上由本页自己 404（接口 /api/partner-reply 在渠道 /api 白名单里，同样由接口自己对主站 404）。
 * 【服务端第一步校验】店面解析放第一句、不包进 try；与接口 src/app/api/partner-reply/[token]/route.ts 同一口径，改一处要同时改另一处：
 *  BOT_TENANT_REPLY 没开、不是渠道 Host、店面停业或筹备中、令牌验不过、令牌的分站 ≠ 当前店面、订单不属于本店 → 一律 notFound()。
 *  暂停营业（SUSPENDED）的店面只读：能看、不能回。
 * 【只读】打开页面不改任何状态（不标已读）：微信与安全扫描会预取链接。
 * 【元信息】同平台快捷回复页（src/app/reply/[token]/layout.tsx）：URL 里的令牌就是凭证，所以 noindex + nofollow
 *  （渠道站 robots.txt 的 Disallow /partner 按前缀也覆盖 /partner-reply）、referrer: no-referrer（页面上的跳转与资源请求不带出这个地址）、
 *  标题与分享卡片文字中性（微信里转发时预览不出现商品与留言）。
 */
const DESCRIPTION = '订单留言回复'

/** 不包进 try（getStorefront 见 resolve.ts 文件头第 7 条）；站名只用于标题，非渠道 Host 时页面本来就 404 */
export async function generateMetadata(): Promise<Metadata> {
  const sf = await getStorefront()
  const title = `订单留言回复 - ${sf ? sf.brand.name : PLATFORM_BRAND_NAME}`
  return {
    title,
    description: DESCRIPTION,
    keywords: '订单留言',
    openGraph: { title, description: DESCRIPTION },
    twitter: { title, description: DESCRIPTION },
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  }
}

/* 深色独立页（bg-[#0b0d12]），同平台快捷回复页；themeColor 跟页面底色走 */
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0d12',
}

export default async function PartnerReplyPage({ params }: { params: { token: string } }) {
  const sf = await getStorefront() // 第一句、不包进 try
  if (!tenantReplyEnabled() || !sf || sf.kind !== 'CHANNEL' || sf.status === 'TERMINATED' || sf.status === 'DRAFT') notFound()
  const token = String(params.token || '')
  const claim = verifyTenantReplyToken(token)
  if (!claim || claim.tenantId !== sf.id) notFound()
  const view = await partnerQuickReplyView(sf.id, claim.orderNo)
  if (!view) notFound()
  return (
    <PartnerReplyClient
      token={token}
      brandName={sf.brand.name}
      initial={view}
      expiresAt={claim.expiresAt.toISOString()}
      readOnly={sf.status === 'SUSPENDED'}
      maxLen={QUICK_REPLY_MAX_LEN}
    />
  )
}
