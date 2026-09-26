import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES } from '@/lib/seo/og'
import { PRIVACY_UPDATED_AT } from '@/lib/legal'
import { getStorefront } from '@/lib/storefront/resolve'
import { storefrontFeatures } from '@/lib/storefront/public'
import { resolveStoreContact } from '@/lib/contact'

/**
 * 隐私政策。
 *
 * 【内容口径】这一页只写站点**实际在做的事**：收什么、为什么收、给了谁、存多久。
 * 抄一份通用模板塞满「我们高度重视您的隐私」是负资产——条款与实际行为对不上，
 * 一旦被买家或监管对照就是把柄，而且对 Google 的可信度判断也没有任何加分。
 * 每一条都对应代码里真实存在的行为（订单邮箱、支付回调、上游充值平台、邮件提醒、营销邮件）。
 *
 * 【2026-09-25 营销邮件改写】上线营销邮件后，原文里「不会用于商业推广」「邮件服务只发订单与到期提醒」
 * 「撤回同意只针对提醒类邮件」等 11 处与新行为矛盾，按 docs/营销推广-设计.md 10.5 逐句改写。
 * 其中的保存期限与代码绑定：营销事件 90 天、发送记录 2 年（api/cron/cleanup），
 * 退订/告知留痕与抑制名单长期保存 —— 改保留期先改这里。
 *
 * 版本号在 lib/legal.ts（PRIVACY_UPDATED_AT）：Page 文件不能导出额外的名字，
 * 而营销告知/退订留痕要引用同一个版本号。改正文必须同步改那个日期。
 */

const TITLE = `隐私政策 - ${SITE_NAME}`
const DESCRIPTION =
  '贝果科技隐私政策：我们收集哪些信息、为什么收集、与哪些第三方共享、保存多久，以及你如何查询、删除自己的数据和退订营销邮件。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: { images: OG_IMAGES, type: 'website', title: TITLE, description: DESCRIPTION, url: '/privacy' },
}

export default async function PrivacyPage() {
  // 「订阅查询」/lookup 在渠道站关闭（设计 11.1、Q16），渠道站的隐私页不给这个死链，改说「个人中心」。
  // 休眠期 getStorefront 恒为主站（不查库），主站渲染逐字不变
  const sf = await getStorefront()
  const lookupOn = storefrontFeatures(sf).lookup
  // 页脚客服按店面取（二期改动 4.2）；拿不到店面时 (shop)/layout 已 404，这里按主站客服兜底
  const contact = sf ? sf.contact : resolveStoreContact(null)
  return (
    <LegalPage
      title="隐私政策"
      updatedAt={PRIVACY_UPDATED_AT}
      contact={contact}
      intro={
        <p>
          本政策说明益阳市赫山区必高科技有限公司（下称「我们」，经营站点 bigolab.com「贝果科技」）
          在你使用本站服务时会收集哪些信息、如何使用与共享，以及你可以行使哪些权利。
          请在使用本站前阅读。注册、下单或继续使用本站，即视为你已了解本政策。
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
            用于排障、风控与防止刷单。
          </li>
          <li>
            <strong className="text-white">营销邮件记录</strong>：向你发送营销邮件时，我们会记录这封邮件是否送达、
            是否被打开、点击了其中哪些链接，以及你的订阅、暂停与退订设置和操作记录。
            挑选收件人时，我们会依据你在本站的注册时间、购买记录、消费档位（会员等级）等信息进行筛选
            （例如只发给近期购买过某类商品的用户），不使用本站以外来源的数据。
            你可以随时一键退订，退订后不会再收到营销邮件。
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="二、我们如何使用这些信息">
        <ul className="list-disc pl-6 space-y-2">
          <li>完成你的订单：核验付款、发放卡密、执行充值、处理售后。</li>
          <li>联系你：订单状态、卡密发放、到期提醒等交易类通知（通过邮件或客服微信发送）。</li>
          <li>
            营销推广：向你的注册邮箱发送优惠活动、新品上架等商业信息（邮件标题标注「AD」），并控制发送频率。
            你可以随时退订，退订立即生效，且不影响订单、验证码、发票等交易邮件。
          </li>
          <li>安全与风控：识别重复下单、异常支付与滥用行为。</li>
          <li>履行法定义务：按税务与会计法规保存交易与票据记录。</li>
        </ul>
        <p>
          我们<strong className="text-white">不会出售你的个人信息</strong>，也不会把它用于本政策未列明的目的。
        </p>
      </LegalSection>

      <LegalSection heading="三、我们与谁共享">
        <p>只在完成服务与本政策所述用途所必需的范围内共享，且仅限以下几类接收方：</p>
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
            <strong className="text-white">邮件发送服务</strong>：阿里云邮件推送，用于发送订单、到期提醒与营销邮件
            （营销邮件只在你未退订时发送）。
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
        <ul className="list-disc pl-6 space-y-2">
          <li>营销邮件的打开与点击明细（每一次打开、点击的时间与浏览器信息）：保留 90 天。</li>
          <li>营销邮件的发送记录（发给了谁、是否送达、首次打开与点击的时间）：保留 2 年。</li>
          <li>
            你的退订记录、注册时的告知记录，以及「不再发送」名单（退信、投诉、无效地址等）：
            为证明我们依法处理、并确保不再向已退订或投诉过的邮箱发送，会长期保存。
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="五、Cookie 与本地存储">
        <p>
          本站使用 Cookie 与浏览器本地存储来维持登录状态、记住你的购物与页面偏好。
          <strong className="text-white">本站不投放第三方广告，也不接入广告追踪代码。</strong>
          你可以在浏览器中清除或禁用它们，但禁用后将无法保持登录。
        </p>
        <p>
          我们发出的营销邮件中含有用于统计打开与点击的链接和一张透明小图片，
          相关数据仅由本站自行记录，不接入任何第三方统计或广告服务。
        </p>
      </LegalSection>

      <LegalSection heading="六、你的权利">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">查询</strong>：
            {lookupOn ? (
              <>
                在{' '}
                <Link href="/lookup" className="text-purple-400 hover:text-purple-300">订阅查询</Link>{' '}
                或登录后的个人中心查看自己的订单与账户信息。
              </>
            ) : (
              <>登录后在个人中心查看自己的订单与账户信息。</>
            )}
          </li>
          <li><strong className="text-white">更正</strong>：联系客服更正填错的邮箱或开票信息。</li>
          <li>
            <strong className="text-white">删除与注销</strong>：联系客服申请注销账号。
            我们会删除账号相关信息，法定必须留存的交易记录除外；
            退订与告知记录、「不再发送」名单也会保留，以确保今后不再向你发送营销邮件。
          </li>
          <li>
            <strong className="text-white">退订营销邮件</strong>：点击任意一封营销邮件底部的「退订营销邮件」，
            或登录后在个人中心的「邮件订阅」里关闭，立即生效。你也可以只关闭部分主题或暂停一段时间。
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
          本政策如有实质性变更，会更新本页顶部的「最后更新」日期；
          重大变更（例如新增营销用途）还会通过站内公告告知。
          建议你在再次下单前查看本页。
        </p>
      </LegalSection>
    </LegalPage>
  )
}
