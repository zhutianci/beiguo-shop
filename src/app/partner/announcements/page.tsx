import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { AnnouncementsView } from '@/components/partner/announcements/announcements-view'

/** 店铺公告（settings.write，仅店主；docs/多渠道分销-渠道品牌与公告.md 第 5 节）：只在本店前台弹窗展示的公告。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('settings.write')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <AnnouncementsView readOnly={ctx.readOnly} />
    </PartnerShell>
  )
}
