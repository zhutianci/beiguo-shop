import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { SettingsView } from '@/components/partner/settings/settings-view'
import { ContactCard } from '@/components/partner/settings/contact-card'

/** 设置（settings.write，仅店主）：只读结算配置、通知偏好、推送方式（企业微信 / 邮箱）；二期加「客服信息」卡片（独立组件、独立接口）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('settings.write')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <div className="space-y-4">
        <SettingsView readOnly={ctx.readOnly} />
        <ContactCard readOnly={ctx.readOnly} />
      </div>
    </PartnerShell>
  )
}
