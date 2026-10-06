import type { ReactNode } from 'react'
import { TAX_RATE } from '@/lib/invoice'

/**
 * 总结句 + 事实卡（docs/SEO-重构/SEO-重构设计.md §4.3-1，批 2 的 D1a）。Server Component。
 *
 * 【放在哪】非 AI 引用页、非对照组的落地页，放在 H1 和导语之后（LandingShell 的 meta 槽）。
 * AI 引用页（/chongzhi、chatgpt-plus）与对照组（claude-kyc、google-zhanghao）**不放**：前者按两步走、后者整个测试窗口不动（§7.6）。
 * 【为什么上面先写一句完整的话】完整陈述句比「标签 : 值」的网格更容易被 AI 摘录（§4.3-1）。
 * 【每一格都有唯一来源】价格 = 页面价格表同一份快照的最低价（实时，以下单页为准）；交付 = 该页正文对交付方式的写法；
 * 付款 = 代码行为（充值只收支付宝、登录后下单）；开票 = lib/invoice 的 TAX_RATE；售后 = /terms 第四节原文；
 * 主体 = 营业执照名称（与 Organization.legalName 同一个）；核对 = 该页自己的 reviewedAt。
 * 不放划线价、原价、「省 X%」，不写「最快」「秒到」这类无法核验的说法（D26、§3.1）。
 */

export const OPERATOR = '益阳市赫山区必高科技有限公司'
export const INVOICE_FACT = `可开增值税发票（标价不含税，开票另付 ${Math.round(TAX_RATE * 100)}%）`
/** /terms 第四节「质保与退款」原文的要点（订阅类商品） */
export const SUBSCRIPTION_AFTERSALE = '订阅期内非因你自身原因掉订阅，按剩余未使用天数折算退款；封号不质保'

export interface Fact {
  label: string
  value: ReactNode
}

export function FactCard({ summary, facts, reviewedAt }: { summary: ReactNode; facts: Fact[]; reviewedAt: string }) {
  const all: Fact[] = [...facts, { label: '经营主体', value: OPERATOR }, { label: '内容核对', value: <time dateTime={reviewedAt}>{reviewedAt}</time> }]
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 lg:p-6">
      <p className="text-[15px] leading-[1.9] text-white/75">{summary}</p>
      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {all.map((f) => (
          <div key={f.label} className="flex gap-3 border-t border-white/[0.06] pt-3">
            <dt className="w-16 shrink-0 text-white/40">{f.label}</dt>
            <dd className="min-w-0 text-white/75">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** 「￥x 起（实时价格，以下单页为准）」；取不到价格时返回 null（整格不出，不写半成品） */
export function priceFact(low: number | null): Fact | null {
  if (low == null) return null
  return { label: '价格', value: `￥${low.toFixed(0)} 起（实时价格，以下单页为准）` }
}

/**
 * 充值落地页用的事实卡：总结句由「产品 + 在售档位数 + 起价 + 付款 + 交付」拼成一句能单独成立的话（不写日期：日期在「内容核对」那一格）。
 * count / low 取自页面价格表同一份在售快照；取不到价格时总结句与价格格都不写数字。
 */
export function LandingFactCard({
  product,
  count,
  low,
  delivery,
  aftersale,
  reviewedAt,
}: {
  product: string
  count: number
  low: number | null
  /** 交付方式：与该页正文的写法一致 */
  delivery: string
  /** 售后口径；订阅类用 SUBSCRIPTION_AFTERSALE，其余按该页正文 */
  aftersale?: string
  reviewedAt: string
}) {
  const price = priceFact(low)
  const summary =
    count > 0
      ? `贝果科技目前在售 ${product} 共 ${count} 个档位${low != null ? `，￥${low.toFixed(0)} 起` : ''}；支付宝付款、登录后下单，${delivery}。`
      : `${product}：支付宝付款、登录后下单，${delivery}。当前价格与库存以下方价格表为准。`
  const facts: Fact[] = [
    ...(price ? [price] : []),
    { label: '交付', value: delivery },
    { label: '付款', value: '支付宝，登录后下单' },
    { label: '开票', value: INVOICE_FACT },
    ...(aftersale ? [{ label: '售后', value: aftersale }] : []),
  ]
  return <FactCard summary={summary} facts={facts} reviewedAt={reviewedAt} />
}
