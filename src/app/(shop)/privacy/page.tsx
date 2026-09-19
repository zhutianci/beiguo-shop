import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { SITE_NAME } from '@/lib/product-seo'

/**
 * 隐私政策。
 *
 * 【内容口径】这一页只写站点**实际在做的事**：收什么、为什么收、给了谁、存多久。
 * 抄一份通用模板塞满「我们高度重视您的隐私」是负资产——条款与实际行为对不上，
 * 一旦被买家或监管对照就是把柄，而且对 Google 的可信度判断也没有任何加分。
 * 每一条都对应代码里真实存在的行为（订单邮箱、支付回调、上游充值平台、邮件提醒）。
 *
 * 改动前先确认站点行为真的变了，并同步 UPDATED_AT。
 */
const UPDATED_AT = '2026-09-19'

const TITLE = `隐私政策 - ${SITE_NAME}`
const DESCRIPTION =
  '贝果科技隐私政策：我们收集哪些信息、为什么收集、与哪些第三方共享、保存多久，以及你如何查询和删除自己的数据。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="隐私政策"
      updatedAt={UPDATED_AT}
      intro={
        <p>
          本政策说明益阳市赫山区必高科技有限公司（下称「我们」，经营站点 bigolab.com「贝果科技」）
          在你使用本站服务时会收集哪些信息、如何使用与共享，以及你可以行使哪些权利。
          请在使用本站前阅读。继续下单即视为你已了解本政策。
        </p>
      }
    >
      <LegalSection heading="一、我们收集哪些信息">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">下单信息</strong>：你在下单时填写的邮箱地址、所购商品与数量、订单金额、
            以及为完成充值所必需的账户标识（例如你要充值的 ChatGPT / Claude 账号邮箱）。
          </li>
          <li>
            <strong className="text-white">账户信息</strong>：若你注册了本站账号，包括邮箱、加密存储的密码、
            余额与消费流水、你主动绑定的联系方式。密码以不可逆的哈希方式存储，我们看不到明文。
          </li>
          <li>
            <strong className="text-white">支付信息</strong>：付款金额、付款时间与平台流水号。
            <strong className="text-white">我们不接触也不存储你的银行卡号、支付密码或任何支付凭证</strong>，
            这些信息由支付宝等支付渠道自行处理。
          </li>
          <li>
            <strong className="text-white">开票信息</strong>：仅在你主动申请开具发票或收据时收集抬头、税号等，
            用途仅限于开具该张票据。
          </li>
          <li>
            <strong className="text-white">技术日志</strong>：访问时间、IP 地址、浏览器与设备类型、访问的页面。
            用于排障、风控与防止刷单，不用于画像广告。
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="二、我们如何使用这些信息">
        <ul className="list-disc pl-6 space-y-2">
          <li>完成你的订单：核验付款、发放卡密、执行充值、处理售后。</li>
          <li>联系你：订单状态、卡密发放、到期提醒等交易类通知（通过邮件或客服微信发送）。</li>
          <li>安全与风控：识别重复下单、异常支付与滥用行为。</li>
          <li>履行法定义务：按税务与会计法规保存交易与票据记录。</li>
        </ul>
        <p>
          我们<strong className="text-white">不会出售你的个人信息</strong>，也不会把你的信息用于与上述目的无关的商业推广。
        </p>
      </LegalSection>

      <LegalSection heading="三、我们与谁共享">
        <p>只在完成服务所必需的范围内共享，且仅限以下几类接收方：</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">上游充值服务商</strong>：本站部分商品通过第三方充值平台完成到账。
            为执行充值，必须向其传递你提供的充值目标账户标识（如账号邮箱或会话凭据）。
            这类信息只传递给执行该笔充值所必需的那一家。
          </li>
          <li>
            <strong className="text-white">支付渠道</strong>：支付宝，用于收款与对账。
          </li>
          <li>
            <strong className="text-white">邮件发送服务</strong>：用于发送订单与到期提醒邮件。
          </li>
          <li>
            <strong className="text-white">依法要求</strong>：在法律法规要求或配合有权机关依法调查时提供。
          </li>
        </ul>
        <p className="text-white/50">
          请注意：你充值的 ChatGPT、Claude 等服务由 OpenAI、Anthropic 等第三方提供，
          你在这些服务上的使用行为受其各自的隐私政策约束，不在本政策范围内。
        </p>
      </LegalSection>

      <LegalSection heading="四、保存多久">
        <p>
          订单、支付与票据记录按法律法规要求的期限保存（一般不少于 5 年）。
          账号信息在你要求注销后删除，但已完成交易的记录因法定留存义务会继续保留。
          技术日志一般保留 90 天以内。
        </p>
      </LegalSection>

      <LegalSection heading="五、Cookie 与本地存储">
        <p>
          本站使用 Cookie 与浏览器本地存储来维持登录状态、记住你的购物与页面偏好。
          <strong className="text-white">本站不投放第三方广告，也不接入广告追踪代码。</strong>
          你可以在浏览器中清除或禁用它们，但禁用后将无法保持登录。
        </p>
      </LegalSection>

      <LegalSection heading="六、你的权利">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">查询</strong>：在{' '}
            <Link href="/lookup" className="text-purple-400 hover:text-purple-300">订阅查询</Link>{' '}
            或登录后的个人中心查看自己的订单与账户信息。
          </li>
          <li><strong className="text-white">更正</strong>：联系客服更正填错的邮箱或开票信息。</li>
          <li>
            <strong className="text-white">删除与注销</strong>：联系客服申请注销账号。
            我们会删除账号相关信息，法定必须留存的交易记录除外。
          </li>
          <li><strong className="text-white">撤回同意</strong>：你可以随时要求停止接收提醒类邮件。</li>
        </ul>
      </LegalSection>

      <LegalSection heading="七、未成年人">
        <p>
          本站服务面向具有完全民事行为能力的个人与企业。
          我们不面向 14 周岁以下未成年人提供服务，也不会主动收集其信息。
        </p>
      </LegalSection>

      <LegalSection heading="八、政策更新">
        <p>
          本政策如有实质性变更，会更新本页顶部的「最后更新」日期。
          建议你在再次下单前查看本页。
        </p>
      </LegalSection>
    </LegalPage>
  )
}
