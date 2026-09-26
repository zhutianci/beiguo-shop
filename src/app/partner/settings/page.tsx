import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { SettingsView } from '@/components/partner/settings/settings-view'

/** 设置（settings.write，仅店主）：只读结算配置、通知偏好、企业微信 webhook。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('settings.write')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <SettingsView readOnly={ctx.readOnly} />
    </PartnerShell>
  )
}
