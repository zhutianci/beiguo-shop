import type { Metadata } from 'next'
import { pageOg } from '@/lib/seo/og'
import { aboutContext, aboutDescription } from './about-context'

/**
 * 【为什么 metadata 放在 layout】这一层原本是为了给 'use client' 的 /about 页导出 metadata（客户端组件用不了 generateMetadata）；
 * 2026-09-30 页面改成了服务端组件，metadata 仍留在这里，canonical 与改造前同一处。
 *
 * 【2026-09-30 重写（docs/SEO-重构/SEO-重构设计.md §3.2-J，A 包）】
 *  · title 原来是「关于贝果科技 - AI 会员代充服务商 - 贝果科技」：「代充」不进 title（§3.4），「AI 会员代充」是零需求词（附录 A）。
 *    关于页把品牌放最前（§3.1），「贝果科技 BigoLab」和台湾同名公司区分（§0.3 #5）。
 *  · description 原来写「账号不经手」：ChatGPT Plus 的 iOS 档、Grok 兑换时要提供登录凭据（chatgpt-plus / grok-super 页的问答），
 *    这句话对它们不成立，删掉；开票口径原来是「税费另付」，改成带 6% 的完整口径；接码按开放状态写（about-context.ts）。
 */
const TITLE = '关于我们：贝果科技 BigoLab 的经营主体、付款与售后'

export async function generateMetadata(): Promise<Metadata> {
  const description = aboutDescription(await aboutContext())
  return {
    title: TITLE,
    description,
    alternates: { canonical: '/about' },
    ...pageOg({ title: TITLE, description, path: '/about' }),
  }
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
