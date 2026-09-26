import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { NoticesView } from '@/components/partner/notices/notices-view'

/** 通知中心（notice.read）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('notice.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <NoticesView readOnly={ctx.readOnly} />
    </PartnerShell>
  )
}
