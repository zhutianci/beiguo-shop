import { AlertCircle } from 'lucide-react'
import { botEnabledByEnv } from '@/lib/bot/config'
import { defaultRestockBatch, peekRestockToken, RESTOCK_MAX_LINES } from '@/lib/bot/ops/restock'
import { lastBatchDefaultsAll, listAutoProductsForRestock } from '@/lib/bot/ops/products'
import { listProvidersForAdmin } from '@/lib/redeem/registry'
import { RestockForm, type RestockProductOption } from './restock-form'

export const dynamic = 'force-dynamic'

/**
 * GET 只读（§9.2）：校验令牌后渲染表单，**不改任何状态**——微信的链接预览、腾讯的安全扫描都会预取链接，
 * 预取一次就把链接作废的话管理员永远打不开。真正的校验与作废在 POST /api/bot/x/restock 的事务里。
 */
export default async function BotRestockPage({ params }: { params: { token: string } }) {
  const peek = botEnabledByEnv() ? await peekRestockToken(String(params.token || '')) : ({ ok: false, reason: 'NOT_FOUND' } as const)
  if (!peek.ok) {
    const why = peek.reason === 'USED' ? '这个补货链接已经用过了' : peek.reason === 'EXPIRED' ? '这个补货链接已过期（5 分钟有效）' : '链接已失效'
    return (
      <div className="min-h-screen bg-[#0b0d12] flex flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400/80 mb-3" />
        <p className="text-white/80 text-base">{why}</p>
        <p className="text-white/35 text-xs mt-2 leading-relaxed">需要补货请在管理群里重新发「@贝果助手 补货」</p>
      </div>
    )
  }

  const [products, defaults] = await Promise.all([listAutoProductsForRestock(), lastBatchDefaultsAll()])
  const options: RestockProductOption[] = products.map((p) => {
    const d = defaults.get(p.id)
    return {
      id: p.id,
      name: p.name,
      botCode: p.botCode,
      onSale: p.status === 1,
      stock: p.stock,
      redeemProvider: d?.redeemProvider ?? '',
      redeemUrl: d?.redeemUrl ?? '',
      cost: d?.cost ?? null,
    }
  })
  return (
    <RestockForm
      token={String(params.token)}
      products={options}
      providers={listProvidersForAdmin().map((p) => ({ key: p.key, label: p.label }))}
      initialProductId={peek.productId && options.some((o) => o.id === peek.productId) ? peek.productId : null}
      defaultBatch={defaultRestockBatch()}
      expiresAt={peek.expiresAt.toISOString()}
      adminName={peek.adminName}
      maxLines={RESTOCK_MAX_LINES}
    />
  )
}
