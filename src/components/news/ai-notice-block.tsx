import { AI_NOTICE, AUTHOR_NAME } from '@/lib/news/constants'
import { currentBrand, withBrandName } from '@/lib/storefront/brand-meta'

/**
 * AI 聚合说明条。
 *
 * 【为什么抽成组件】这是《人工智能生成合成内容标识办法》第四条要求的「文字提示」，
 * SKILL.md §6 列的六处标识之一，属于法定义务而不是文案装饰。
 * 原来 /news 和 /news/[slug] 各写了一份，新增归档页时很容易漏掉第三份 ——
 * 漏掉的后果是那个页面缺一处法定标识，而这种缺失在页面上看不出异常。
 * 收敛成一个组件之后，新增任何列表页只要挂上它就不会漏。
 *
 * 【文案本身不要在这里改】AI_NOTICE 还被分享海报用着（poster.ts 里硬裁 2 行），
 * 改长了会在海报上被省略号截断，等于法定标识残缺。要改先看它的全部消费者。
 *
 * 【渠道站】内容模块下放（docs/多渠道分销-内容模块下放.md）后，改了站名的渠道把整理者里的「贝果科技」换成渠道站名
 * （与分享海报同一口径）；主站与没改名的渠道逐字不变。Server Component（读当前店面），只给服务端页面用。
 */
export async function AiNoticeBlock({
  className = '',
  /** 线索来源标注。有第三方帮我们发现选题时必须标注并回链（授权条件） */
  leadNote,
}: {
  className?: string
  leadNote?: React.ReactNode
}) {
  const author = withBrandName(AUTHOR_NAME, await currentBrand())
  return (
    <div
      className={`flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 lg:px-5 lg:py-3.5 ${className}`}
    >
      <span className="mt-px shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-medium text-purple-200/90">
        AI 聚合
      </span>
      <div className="text-[13px] leading-relaxed text-white/50 lg:text-sm">
        <p>
          {AI_NOTICE}整理者：{author}。
        </p>
        {leadNote ? <p className="mt-1.5 text-white/40">{leadNote}</p> : null}
      </div>
    </div>
  )
}

/**
 * 线索来源标注（授权条件的落地）。
 *
 * 只在真的用到第三方线索时才渲染 —— 没用到还标，等于对读者虚构一个来源。
 * 外链按 SKILL.md §6 带 rel="noopener noreferrer nofollow"。
 */
export function LeadCredit({ href, className = '' }: { href?: string | null; className?: string }) {
  const label = '线索来源：AIHOT'
  if (!href) return <span className={className}>{label}</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/70 ${className}`}
    >
      {label}
    </a>
  )
}
