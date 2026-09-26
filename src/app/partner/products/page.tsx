import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { ProductsView } from '@/components/partner/products/products-view'

/** 商品池（catalog.read；改价 / 上下架由接口按 listing.write 另行鉴权）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('catalog.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <ProductsView readOnly={ctx.readOnly} />
    </PartnerShell>
  )
}
