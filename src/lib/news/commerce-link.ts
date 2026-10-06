import { findLanding, landingPath, type LandingSlug } from '@/lib/landing/registry'

/**
 * 大事记详情页「广告 · 本站服务」区块的标签映射（docs/SEO-重构/SEO-重构设计.md §2.5 末行、§7.4、§0.3 #31，批 2 的 C 包）。
 *
 * 【硬规则】
 *  · 只在事件标签明确对应在售产品时出现，**没有「其余 → hub / 全部商品」兜底**：对不上就整块不出现；
 *  · 映射表**永不**指向 claude-kyc、google-zhanghao（账号类与 KYC 不从大事记进入，§2.5、§9.2-2）；
 *  · 链接是干净的落地页 URL（不带 ?n=，不写 localStorage）；区块不进 Article JSON-LD（SKILL.md §1、§6 的定位）。
 * 标签只取 TAG_WHITELIST 里的写法（lib/news/constants.ts），按事件 tags 的顺序取，最多两条。
 */
const RULES: { tags: readonly string[]; slug: LandingSlug; anchor: string }[] = [
  { tags: ['Claude', 'Anthropic'], slug: 'claude-pro', anchor: '本站在售的 Claude 订阅' },
  { tags: ['OpenAI', 'GPT'], slug: 'chatgpt-plus', anchor: '本站在售的 ChatGPT 订阅' },
  { tags: ['xAI'], slug: 'grok-super', anchor: '本站在售的 Grok 订阅' },
]

const FORBIDDEN = new Set<string>(['claude-kyc', 'google-zhanghao'])

export interface CommerceLink {
  href: string
  anchor: string
  /** 落地页短名（「Claude Pro 充值」） */
  label: string
}

export function commerceLinksForTags(tags: readonly string[], max = 2): CommerceLink[] {
  const out: CommerceLink[] = []
  const seen = new Set<string>()
  for (const t of tags) {
    const rule = RULES.find((r) => r.tags.includes(t))
    if (!rule || seen.has(rule.slug) || FORBIDDEN.has(rule.slug)) continue
    seen.add(rule.slug)
    out.push({ href: landingPath(rule.slug), anchor: rule.anchor, label: findLanding(rule.slug).navLabel })
    if (out.length >= max) break
  }
  return out
}
