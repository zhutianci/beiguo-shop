import Link from 'next/link'
import { OPERATOR_NAME, type PortalFiling } from '@/lib/portal'

/**
 * 门户站（docs/门户站-bigoai.md）的「关于我们」与「隐私政策」正文。
 * 主站那两页写的是充值、付款、开票、订单数据，门户站不卖货、不登录，照搬就是在一个内容站上写一堆它不做的事；
 * 这里只写门户站真实在做的：内容从哪来、谁运营、收集什么（几乎不收集）、怎么联系。
 * 正文里的中文长句写在一行（JSX 跨行会折出多余空格，见主站 about 页注释）。
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-[1.9] text-white/60">{children}</div>
    </section>
  )
}

function Contact({ filing }: { filing: PortalFiling }) {
  return filing.email ? (
    <p>
      联系邮箱：<a href={`mailto:${filing.email}`} className="text-purple-400 hover:text-purple-300">{filing.email}</a>
    </p>
  ) : null
}

export function PortalAbout({ siteName, filing }: { siteName: string; filing: PortalFiling }) {
  return (
    <div className="page-top pb-20">
      <article className="container mx-auto max-w-3xl">
        <h1 className="mb-10 text-3xl font-bold tracking-tight lg:text-4xl">关于{siteName}</h1>

        <Section title="我们做什么">
          <p>{siteName}是一个 AI 学习与资讯网站，主要有两个栏目：</p>
          <p>
            <Link href="/learn" className="text-purple-400 hover:text-purple-300">AI学习</Link>
            ：整理可复制的 AI 提示词、AI 工具的使用教程与应用介绍。提示词附适用模型与效果示例，教程注明测试日期与操作步骤。
          </p>
          <p>
            <Link href="/news" className="text-purple-400 hover:text-purple-300">AI圈大事记</Link>
            ：把每天的 AI 行业动态（模型发布、产品更新、论文与开源工具）按事件归并成一条，由 AI 依据公开信源整理摘要，每条都附原文链接。
          </p>
        </Section>

        <Section title="内容来源与准确性">
          <p>大事记的摘要依据公开发布的信息整理，可能存在遗漏或理解偏差，请以每条所附的原文为准。教程与提示词基于编写时的实测，AI 工具更新频繁，界面和功能可能已经变化。</p>
          <p>本站内容仅供学习参考，不构成任何投资、法律或专业建议。文中提到的第三方产品与商标归其各自权利人所有，本站与其不存在隶属或授权关系。</p>
          <p>如认为本站内容侵犯了你的合法权益，或发现内容有误，请通过下方邮箱联系我们，我们核实后会及时更正或删除。</p>
        </Section>

        <Section title="运营主体">
          <p>本站由{OPERATOR_NAME}运营。</p>
          {filing.icp && (
            <p>
              ICP 备案号：
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">{filing.icp}</a>
            </p>
          )}
          <Contact filing={filing} />
        </Section>
      </article>
    </div>
  )
}

export function PortalPrivacy({ siteName, filing }: { siteName: string; filing: PortalFiling }) {
  return (
    <div className="page-top pb-20">
      <article className="container mx-auto max-w-3xl">
        <h1 className="mb-10 text-3xl font-bold tracking-tight lg:text-4xl">隐私政策</h1>

        <Section title="我们收集哪些信息">
          <p>{siteName}不提供注册、登录、评论或在线交易功能，浏览本站不需要提供任何个人信息。</p>
          <p>与所有网站一样，服务器会自动记录访问日志：IP 地址、访问时间、请求的页面地址、浏览器类型（User-Agent）与来源页面。这些日志只用于保障网站安全（识别恶意访问、排查故障），不用于识别你的身份，也不会出售或提供给第三方，法律法规另有规定的除外。</p>
        </Section>

        <Section title="Cookie 与本地存储">
          <p>本站不使用广告或跨站追踪 Cookie。浏览器本地可能保存少量界面偏好（例如页面阅读设置），只存在你自己的设备上，可随时在浏览器中清除。</p>
        </Section>

        <Section title="外部链接">
          <p>大事记中的原文链接、教程中提到的第三方网站不受本站控制，访问这些网站时请阅读其各自的隐私政策。</p>
        </Section>

        <Section title="保存期限与联系我们">
          <p>访问日志按法律法规要求的期限保存，到期删除。对本政策有任何疑问，或需要查询、删除与你相关的信息，请联系我们。</p>
          <p>运营主体：{OPERATOR_NAME}</p>
          <Contact filing={filing} />
        </Section>
      </article>
    </div>
  )
}
