import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, TWITTER_IMAGES } from '@/lib/seo/og'

/**
 * 服务条款。
 *
 * 【最要紧的一条是「我们不是官方代理」】站点卖的是第三方 AI 订阅的代充值，
 * 与 OpenAI / Anthropic 没有任何授权或代理关系。这句话必须白纸黑字写在这里：
 *   - 对买家：避免「我以为是官方渠道」的纠纷；
 *   - 对搜索引擎：Google 对「冒充品牌官方」的站点有明确的处罚路径，
 *     主动澄清身份是把自己从那一类里摘出来的最直接方式。
 *
 * 【质保与退款口径必须与商品页一致】这里写的规则来自线上商品的 cardUsage 文案
 * （掉订阅后扣除已用天数、按剩余天数折算退款，封号不质保等）。改商品文案时要回来核对这一页，
 * 两处不一致时以对买家更有利的一方为准。
 */
const UPDATED_AT = '2026-09-24'

const TITLE = `服务条款 - ${SITE_NAME}`
const DESCRIPTION =
  '贝果科技服务条款：服务性质说明、下单与交付方式、质保与退款规则、禁止用途、责任范围与争议解决。下单前请阅读。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: { images: OG_IMAGES, type: 'website', title: TITLE, description: DESCRIPTION, url: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="服务条款"
      updatedAt={UPDATED_AT}
      intro={
        <p>
          本条款是你与益阳市赫山区必高科技有限公司（经营站点 bigolab.com「贝果科技」）之间的协议。
          <strong className="text-white">下单即表示你已阅读并接受本条款</strong>，请务必先看完第一节与第四节。
        </p>
      }
    >
      <LegalSection heading="一、服务性质（请先看这一条）">
        <p>
          我们提供的是<strong className="text-white">第三方 AI 订阅服务的代充值与开通协助</strong>，
          具体形式包括发放可自助兑换的充值卡密、代为完成充值操作、以及配套的账号与验证码类辅助商品。
        </p>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-amber-100/80">
          <strong className="text-amber-200">我们不是 OpenAI、Anthropic 或任何其他 AI 服务商的官方代理、经销商或合作伙伴</strong>，
          与上述公司没有任何授权关系。ChatGPT、Claude、OpenAI、Anthropic 等名称与商标归其各自权利人所有，
          本站使用这些名称仅用于说明所代充值服务的对象。
        </p>
        <p>
          你所购买服务的最终可用性、功能范围与账号状态，由相应服务商自行决定，我们无法代其做出承诺。
        </p>
      </LegalSection>

      <LegalSection heading="二、下单与交付">
        <ul className="list-disc pl-6 space-y-2">
          <li>付款确认后，系统按商品设定的方式交付：自助充值类商品发放卡密，其余按商品页说明处理。</li>
          <li>
            卡密类商品交付即视为已履行主要义务。
            <strong className="text-white">未使用的卡密长期有效</strong>，但请按商品页的说明核对使用前提条件。
          </li>
          <li>
            充值有前置条件的商品（例如要求账户当前没有有效订阅、没有未结清账单），
            <strong className="text-white">请在提交前自行核验</strong>。
            因不满足前置条件导致充值失败且卡密已被消耗的，按第四节处理。
          </li>
          <li>下单需要先登录本站账号，卡密与交付通知发到你的账号邮箱（下单时不另填邮箱），请确保该邮箱能正常收信。</li>
        </ul>
      </LegalSection>

      <LegalSection heading="三、价格与支付">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">页面标示价格为不含税价</strong>
            ，以下单时页面显示的实付金额为准。
          </li>
          <li>价格随上游成本与汇率浮动，我们可随时调整，已完成的订单不受后续调价影响。</li>
          <li>
            <strong className="text-white">需要发票的，须在售价之外另行支付 6% 税费。</strong>
            开票金额为「售价 × 1.06」。可以在结算时勾选「同时开具增值税发票」，税费随货款一起支付；
            也可以付款后在「我的订单」里申请，届时单独支付税费。收据不涉及税费，
            可在订单付款后通过站内入口或联系客服申请。发票抬头由你自己填写。
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="四、质保与退款">
        <p>各商品的具体规则以商品页说明为准，通用口径如下：</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">质保订阅，不质保封号。</strong>
            订阅期内非因你自身原因掉订阅的，按剩余未使用天数折算退款；
            账号被服务商封禁的，属于账号本身或使用方式的问题，不在质保范围内。
          </li>
          <li>
            <strong className="text-white">未使用的卡密可申请退款。</strong>
            已成功充值或卡密已被上游核销的，不支持退款。
          </li>
          <li>
            充值失败且经核验卡密未被消耗的，可重新提交或申请更换；
            卡密确已被消耗但未到账的，由我们向上游追查后处理。
          </li>
          <li>
            售后请在发现问题后<strong className="text-white">尽快</strong>联系客服，
            并提供订单号与相关截图。时间越久，向上游追溯的难度越大。
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="五、你的义务与禁止行为">
        <ul className="list-disc pl-6 space-y-2">
          <li>不得将所购服务用于任何违反中国法律法规或服务商使用条款的用途。</li>
          <li>不得用于批量爬取、自动化脚本滥用、转售倒卖或任何可能导致账号被风控的行为。</li>
          <li>不得利用本站漏洞、重复提交、伪造付款凭证等方式获取不当利益。</li>
          <li>不得冒用他人身份下单或申请开票。</li>
        </ul>
        <p>违反上述约定的，我们有权中止服务、不予退款，并保留追究责任的权利。</p>
      </LegalSection>

      <LegalSection heading="六、责任范围">
        <p>
          在法律允许的最大范围内，我们对任何一笔订单承担的责任总额
          <strong className="text-white">不超过你就该笔订单实际支付的金额</strong>。
          我们不对间接损失负责，包括但不限于数据丢失、业务中断、预期收益减少。
        </p>
        <p>
          因服务商政策变更、地区限制、风控策略调整、不可抗力等我们无法控制的原因导致服务受影响的，
          我们会协助处理，但不构成违约。
        </p>
      </LegalSection>

      <LegalSection heading="七、条款变更与争议解决">
        <p>
          本条款可能更新，更新后会修改本页顶部的「最后更新」日期，并自公布之日起生效。
          因本条款产生的争议，双方应先友好协商；协商不成的，提交经营者所在地有管辖权的人民法院解决。
        </p>
        <p>
          关于个人信息的处理，另见{' '}
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
            隐私政策
          </Link>
          。
        </p>
      </LegalSection>
    </LegalPage>
  )
}
