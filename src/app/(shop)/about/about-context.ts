import { getStorefront, type Storefront } from '@/lib/storefront/resolve'
import { storefrontFeatures, type StorefrontFeatures } from '@/lib/storefront/public'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { canUseForJiema } from '@/lib/wallet/config'
import { TAX_RATE } from '@/lib/invoice'

/**
 * /about 的 layout（metadata）与 page（正文）共用的判定（docs/SEO-重构/SEO-重构设计.md §3.2-J，A 包）。
 *
 * 【接码按开放状态写】短信接码只在「主站 && 对全部用户开放（jiemaPublicOpen）」时出现在描述与正文里：
 * 灰度期（仅管理员）写了就等于在可收录的页面上宣传一个没开放的业务，站内也不能出现指向 /jiema 的链接（设计 D28、§2.5）。
 * 配置读不到按关（fail-closed），不让 /about 因为接码配置坏了而 500。
 * 【渠道站】/about 在渠道 Host 上照常可访问（整站 noindex）；充值落地页、大事记、接码在渠道站都是关的，正文不给这些入口。
 */
export type AboutContext = {
  sf: Storefront | null
  isPlatform: boolean
  features: StorefrontFeatures
  /** 短信接码对全部用户开放（只在主站读） */
  jiemaOpen: boolean
  /** 接码单能用站内余额付（canUseForJiema：余额支付开着 && 接码已开放） */
  jiemaBalancePay: boolean
}

export async function aboutContext(): Promise<AboutContext> {
  // 店面解析不进 try（设计 4.4 第 7 条：靠异常转动态，吞掉会按主站结果预渲染）
  const sf = await getStorefront()
  const isPlatform = !!sf && sf.kind === 'PLATFORM'
  const features = storefrontFeatures(sf)
  let jiemaOpen = false
  let jiemaBalancePay = false
  if (isPlatform && features.jiema) {
    jiemaOpen = jiemaPublicOpen(await readSmsConfigCached().catch(() => null))
    // canUseForJiema 自带 try，读不到按 false
    if (jiemaOpen) jiemaBalancePay = await canUseForJiema()
  }
  return { sf, isPlatform, features, jiemaOpen, jiemaBalancePay }
}

/** 开票口径：「标价不含税，开票另付 6%」。6% 取 lib/invoice.ts 的 TAX_RATE，不在文案里再写死一份 */
export const INVOICE_TAX_TEXT = `标价不含税，开票另付 ${Math.round(TAX_RATE * 100)}%`

/** 业务列表（一句话定义与 description 共用）：充值恒有；大事记跟 features.news（渠道站关）；接码跟开放状态 */
export function aboutBusinesses(ctx: Pick<AboutContext, 'isPlatform' | 'features' | 'jiemaOpen'>): string[] {
  const out = ['ChatGPT、Claude 等 AI 订阅充值']
  if (ctx.jiemaOpen) out.push('短信接码')
  if (ctx.isPlatform && ctx.features.news) out.push('AI 圈大事记')
  return out
}

/** 「A、B与 C」：最后一项以英文或数字开头时，「与」后面补一个空格（和全站中英文之间留空格的写法一致） */
function joinCn(items: string[]): string {
  if (items.length <= 1) return items.join('')
  const last = items[items.length - 1]
  return `${items.slice(0, -1).join('、')}与${/^[A-Za-z0-9]/.test(last) ? ' ' : ''}${last}`
}

/**
 * /about 的 description（§3.2-J：按 §4.2 口径；带「标价不含税，开票另付 6%」；不写「账号不经手」「代充」；接码按开放状态）。
 * 「可开增值税发票」挂在「充值」后面：接码单暂不支持开票（D37），不能读成全站都能开票。
 */
export function aboutDescription(ctx: Pick<AboutContext, 'isPlatform' | 'features' | 'jiemaOpen'>): string {
  return (
    `贝果科技（bigolab.com）由益阳市赫山区必高科技有限公司运营，提供 ${joinCn(aboutBusinesses(ctx))}：` +
    `充值为卡密自助兑换，支付宝付款，可开增值税发票（${INVOICE_TAX_TEXT}）。本页写明经营主体、付款、售后与退款口径。`
  )
}
