export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProvider, PUBLIC_SYSTEM_NAME } from '@/lib/redeem/registry'
import RedeemClient from './redeem-client'

/**
 * 站内卡密兑换页。`/redeem/sysa`、`/redeem/sysb`…… 共用这一个动态路由，
 * 接新平台不用加页面。
 *
 * 【买家看不到上游是谁】标题、正文、结果提示一律是「贝果科技 · AI会员自助充值系统」。
 * 上游的品牌、域名、原始 msg 都不会出现在这个页面上 —— 货源是商业信息。
 *
 * 【noindex】兑换页对搜索引擎没有任何价值，被收录反而可能让买家从搜索结果
 * 进到一个没有卡密上下文的空页面。robots.ts 里也可以堵，但页面自己声明更保险。
 */

export function generateMetadata({ params }: { params: { provider: string } }): Metadata {
  if (!getProvider(params.provider)) return { title: '页面不存在' }
  return {
    title: `${PUBLIC_SYSTEM_NAME} - 卡密兑换`,
    description: '输入购买后获得的卡密，填写要充值的账号，即可自助完成会员订阅充值。',
    robots: { index: false, follow: false },
  }
}

export default function RedeemPage({ params }: { params: { provider: string } }) {
  const provider = getProvider(params.provider)
  if (!provider) notFound()

  return (
    <RedeemClient
      providerKey={provider.key}
      systemName={PUBLIC_SYSTEM_NAME}
      // 只把「支不支持重绑」这个布尔值传下去，adminLabel 绝不出现在客户端产物里
      supportsRebind={typeof provider.rebind === 'function'}
    />
  )
}
