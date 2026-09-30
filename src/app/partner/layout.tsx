import type { ReactNode } from 'react'
import { requireChannelStorefrontPage } from '@/lib/tenant/partner-page'
import { PrimaryHostRedirect } from '@/components/storefront/primary-host-redirect'

/**
 * 渠道后台根布局（WP6，设计 6.5.4、12.1）。
 *
 * 只做三件事：
 *  1. 店面必须是渠道且未终止——主站 Host、休眠期、未知 Host 访问 /partner/** 一律 404（与 middleware 双重把关，T5 / M11）；
 *  2. 浅色后台主题容器（.admin-area 与站长后台同一套灰阶）；
 *  3. 渠道自定义域名：在非主域名上打开渠道后台时挂 PrimaryHostRedirect 跳到主域名（docs/多渠道分销-自定义域名.md 第 4 节）。
 *     只在当前 Host ≠ 主域名时挂：只有子域名的渠道（lulu、shop）不挂，页面 DOM 不变。跳转只是便利，权限不靠它。
 * **成员身份与权限不在这里判**：layout 在客户端导航时不重新执行，只放 layout 等于没守；每个成员页面自己调
 * requirePartnerPage(perm)，并自己包 PartnerShell（导航）。登录页与邀请页面向非成员，也在这个布局之下。
 * 不渲染任何数据；不进 try（notFound 是异常控制流）。
 */
export const dynamic = 'force-dynamic'

// 不写 `: Metadata` 注解：那要 import 裸模块 'next'，而边界检查规则 1 只放行 `next/*`；对象字面量本身已满足 Next 的类型检查
export const metadata = {
  title: '渠道后台 - 贝果科技',
  robots: { index: false, follow: false, nocache: true },
}

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  const { redirectOrigin } = await requireChannelStorefrontPage()
  return (
    <div className="admin-area min-h-screen bg-gray-100 text-gray-900">
      {redirectOrigin && <PrimaryHostRedirect origin={redirectOrigin} />}
      {children}
    </div>
  )
}
