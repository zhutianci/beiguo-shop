import Link from 'next/link'
import { OPERATOR_NAME, type PortalFiling } from '@/lib/portal'

/**
 * 门户站页脚（docs/门户站-bigoai.md）：主办单位、栏目、联系方式，最底下一行 ICP 备案号与公安备案号。
 * 备案号由环境变量给出（PORTAL_ICP_NO / PORTAL_PSB_NO，见 lib/portal.ts）；备案下来之前不显示那一行。
 * 工信部要求备案号显示在首页底部并链接到 https://beian.miit.gov.cn/，公安备案号链接到全国互联网安全管理服务平台。
 */
export function PortalFooter({ siteName, filing }: { siteName: string; filing: PortalFiling }) {
  const year = new Date().getFullYear()
  return (
    <footer className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />
      <div className="container relative py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/logo-mark.webp?v=3" alt="" width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10" />
              <span className="text-xl font-bold tracking-tight">{siteName}</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/40">
              {siteName}是{OPERATOR_NAME}运营的 AI 学习与资讯网站：整理可复制的 AI 提示词与实测教程，按事件汇总 AI 行业动态并附原文出处。
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white/90">栏目</h4>
            <ul className="space-y-3 text-sm text-white/45">
              <li><Link href="/learn" className="hover:text-white">AI学习</Link></li>
              <li><Link href="/prompts" className="hover:text-white">提示词库</Link></li>
              <li><Link href="/guides" className="hover:text-white">教程</Link></li>
              <li><Link href="/news" className="hover:text-white">AI圈大事记</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white/90">关于</h4>
            <ul className="space-y-3 text-sm text-white/45">
              <li><Link href="/about" className="hover:text-white">关于我们</Link></li>
              <li><Link href="/privacy" className="hover:text-white">隐私政策</Link></li>
              {filing.email && (
                <li>
                  联系邮箱：<a href={`mailto:${filing.email}`} className="hover:text-white">{filing.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-white/35 md:flex-row md:flex-wrap md:items-center md:gap-x-6">
          <span>© {year} {OPERATOR_NAME}</span>
          {filing.icp && (
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              {filing.icp}
            </a>
          )}
          {filing.psb && (
            <a
              href={filing.psbCode ? `https://beian.mps.gov.cn/#/query/webSearch?code=${filing.psbCode}` : 'https://beian.mps.gov.cn/'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70"
            >
              {filing.psb}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
