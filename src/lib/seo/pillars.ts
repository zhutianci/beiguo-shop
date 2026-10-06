import { cache } from 'react'
import { getStorefront } from '@/lib/storefront/resolve'
import { storefrontFeatures } from '@/lib/storefront/public'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { canUseForJiema } from '@/lib/wallet/config'
import { INDEXING_OPEN } from '@/lib/content/policy'
import { organizationJsonLd } from '@/lib/seo/graph'

/**
 * 本站几条业务（支柱）此刻在**这个 Host 上**对外开没开（docs/SEO-重构/SEO-重构设计.md §1.10、§2.5、§4.2，批 2 的 C 包）。
 *
 * 首页 title / H1 / description、Organization、页内跨支柱链接都要按它分支，所以收成一个函数，不在每页各算一遍：
 *  · 充值：主站恒有（渠道站有商品页、没有落地页，landing=false）；
 *  · 短信接码：主站 && features.jiema && jiemaPublicOpen(sms_config)。**灰度期全站不出现指向 /jiema 的链接**（D28），读不到配置按关；
 *  · AI 圈大事记：features.news（渠道站关）；
 *  · AI 学习（提示词 / 教程）：features.forum（渠道站关）；learnIndexable 另看内容平台总开关 INDEXING_OPEN，
 *    关着时学习平台整组 noindex，首页等可收录页就不把它写进 title / description（入口链接照常给，那是导航不是宣传）。
 *
 * 【不包 try 的只有 getStorefront】店面解析靠异常转动态（设计 4.4 第 7 条）；其余读取失败一律按「关」。
 * 【React cache】同一次请求里 generateMetadata 与页面体各调一次，只算一回（canUseForJiema 每次都查库）。
 */
export type SitePillars = {
  isPlatform: boolean
  landing: boolean
  jiema: boolean
  /** 接码单能用站内余额付（canUseForJiema）；只在 jiema 为 true 时有意义 */
  jiemaBalancePay: boolean
  news: boolean
  learn: boolean
  learnIndexable: boolean
}

export const sitePillars = cache(async (): Promise<SitePillars> => {
  const sf = await getStorefront()
  const isPlatform = !!sf && sf.kind === 'PLATFORM'
  const f = storefrontFeatures(sf)
  let jiema = false
  let jiemaBalancePay = false
  if (isPlatform && f.jiema) {
    jiema = jiemaPublicOpen(await readSmsConfigCached().catch(() => null))
    if (jiema) jiemaBalancePay = await canUseForJiema().catch(() => false)
  }
  const learn = isPlatform && f.forum
  return { isPlatform, landing: isPlatform && f.landing, jiema, jiemaBalancePay, news: isPlatform && f.news, learn, learnIndexable: learn && INDEXING_OPEN }
})

/** 接码的付款方式口径（设计 §3.3 /jiema 行、§4.3 事实卡）：余额可用写「支付宝或站内余额」，否则只写支付宝 */
export function jiemaPayText(balancePay: boolean): string {
  return balancePay ? '支付宝或站内余额' : '支付宝'
}

/**
 * 当前 Host 的 Organization 节点（SEO 批 2）：主站各页输出的 Organization 是同一个 @id，描述必须处处一致——
 * 不能首页写「充值、接码、大事记」、落地页只写「充值」（同一实体几种说法，是 Google 最在意的主体信息不一致）。
 * 所以统一按 sitePillars 出；渠道站（以及没有店面的 Host）是保守口径（只写充值）。
 */
export async function siteOrganizationJsonLd(): Promise<Record<string, unknown>> {
  const p = await sitePillars()
  return organizationJsonLd(p.isPlatform ? { jiema: p.jiema, news: p.news, learn: p.learnIndexable } : {})
}
