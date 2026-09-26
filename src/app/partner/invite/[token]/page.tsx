import { requireChannelStorefrontPage } from '@/lib/tenant/partner-page'
import { PartnerInviteView } from '@/components/partner/shell/invite-view'

/**
 * 接受成员邀请页（设计 6.5.4 的两个例外页之一）：只要求店面是渠道且未终止，不要求登录与成员身份。
 * 页面不查邀请、不渲染任何数据——令牌只在点「接受邀请」时随 POST /api/partner/invite/accept 提交，由服务端校验。
 */
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { token: string } }) {
  // 没有账号的被邀请人先到主站注册（筹备期渠道站不开放注册；两站同一账号）。地址由守卫按平台 Tenant.origin 给，不从 Host 拼
  const { mainRegisterUrl: registerUrl } = await requireChannelStorefrontPage()
  // 令牌形状不对也照样渲染（服务端会按不存在处理）；这里只截断长度，避免把超长路径原样塞进页面
  return <PartnerInviteView token={String(params.token ?? '').slice(0, 256)} registerUrl={registerUrl} />
}
