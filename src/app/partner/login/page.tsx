import { requireChannelStorefrontPage } from '@/lib/tenant/partner-page'
import { PartnerLoginView } from '@/components/partner/shell/login-view'

/**
 * 渠道后台登录页（设计 6.5.4 的两个例外页之一）：只要求店面是渠道且未终止，**不要求登录与成员身份**，
 * 否则 requirePartnerPage 对未登录用户重定向到本页会无限循环。页面不渲染任何数据。
 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  const { status, mainRegisterUrl } = await requireChannelStorefrontPage()
  // 筹备期渠道站不开放注册：提示没有账号的人先到主站注册（地址由守卫按平台 Tenant.origin 给，不从 Host 拼）
  const registerUrl = status === 'DRAFT' ? mainRegisterUrl : null
  return <PartnerLoginView registerUrl={registerUrl} />
}
