import Link from 'next/link'
import { Building2, FileSignature, Landmark, ReceiptText, Users } from 'lucide-react'
import { PLATFORM_CONTACT } from '@/lib/contact'
import { TAX_RATE } from '@/lib/invoice'

/**
 * 企业与团队购买区块（2026-10-29，站长要求把「商务合作、团队订单、对公签合同」作为卖点写上首页与充值总览）。
 *
 * 【只写对得上的事实】
 *   · 主体：益阳市赫山区必高科技有限公司（与 /about、Organization.legalName 同一个）；
 *   · 发票：标价不含税、开票另付 6%（lib/invoice TAX_RATE），项目开票时可选（lib/invoice-items）；
 *   · 签合同、对公转账：站长 10-29 提出的卖点，线下由客服对接，站内收银台仍只有支付宝 / 微信支付；
 *   · ChatGPT Business 团队版：/products/39 在售（人工服务、客服对接）。
 *   不写折扣、账期、「官方合作」之类没有依据的话。
 *
 * 【措辞】Google 下拉实测（10-29）：「chatgpt 企业」「claude 企业」各 10 条、「claude 团队」8、「chatgpt 团队」5、
 *   「chatgpt 公司 购买」3；「对公」「企业采购」0 —— 标题用「企业与团队购买」，对公 / 合同放正文。
 *
 * 只在主站渲染（渠道站的合同主体不是必高科技），联系方式用主站客服 PLATFORM_CONTACT。
 */

const BUSINESS_PRODUCT_PATH = '/products/39'

export const BUSINESS_HEADING = '企业与团队购买：签合同、对公付款、开增值税发票'

/** 四张说明卡 + 对接方式。首页包一层卡片外框（BusinessBuySection），充值总览放进落地页的 Section 里 */
export function BusinessBuyBody() {
  const taxPercent = `${Math.round(TAX_RATE * 100)}%`
  const c = PLATFORM_CONTACT
  const items = [
    {
      icon: Users,
      title: '团队订单',
      body: (
        <>
          给多名成员一起开通或续费 ChatGPT、Claude 等会员：把服务、档位和人数整理成一张清单发给客服，统一报价、统一交付，交付后逐个核对到账。
          要 ChatGPT Business 团队版的，见
          <Link href={BUSINESS_PRODUCT_PATH} className="mx-0.5 text-purple-400 hover:text-purple-300">
            ChatGPT Business 定制
          </Link>
          。
        </>
      ),
    },
    {
      icon: FileSignature,
      title: '签订服务合同',
      body: <>由益阳市赫山区必高科技有限公司与贵司签订服务合同，写明服务内容、数量与金额，方便走公司采购与审批流程。</>,
    },
    {
      icon: Landmark,
      title: '对公付款',
      body: <>可以从公司账户对公转账；个人先垫付的，照常在站内用支付宝或微信支付下单，事后开票报销即可。</>,
    },
    {
      icon: ReceiptText,
      title: '增值税发票',
      body: <>销售方为益阳市赫山区必高科技有限公司。标价均不含税，开票另付 {taxPercent} 税费，发票项目开票时可选。</>,
    },
  ]
  return (
    <div className="not-prose">
      <p className="mb-8 max-w-3xl text-sm leading-relaxed text-white/50 lg:text-[15px]">
        公司或团队给多人开通 AI 会员，可以按企业流程来，入账和报销都有凭证。
        本站是独立的第三方服务商，与 OpenAI、Anthropic 等服务提供方没有隶属或授权关系。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Icon className="h-4 w-4 text-purple-300" />
              {title}
            </h3>
            <p className="text-sm leading-[1.9] text-white/55">{body}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm leading-relaxed text-white/60">
        <strong className="text-white/85">怎么对接：</strong>加客服微信{' '}
        <span className="font-mono text-white/85">{c.wechat}</span>
        {c.hours && <>（{c.hours}）</>}，备注「企业采购」，发来公司名称、需要的服务与人数、开票抬头和税号，客服按清单报价并起草合同。
      </p>
    </div>
  )
}

/** 首页用：带「商务合作」眉题与 H2 的整块 */
export function BusinessBuySection({ id = 'business' }: { id?: string }) {
  return (
    <section id={id} className="container relative pb-24" aria-labelledby={`${id}-heading`}>
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:p-10">
        <div className="mb-2 flex items-center gap-2 text-sm text-purple-300/80">
          <Building2 className="h-4 w-4" />
          商务合作
        </div>
        <h2 id={`${id}-heading`} className="mb-3 text-2xl font-bold lg:text-3xl">
          {BUSINESS_HEADING}
        </h2>
        <BusinessBuyBody />
      </div>
    </section>
  )
}
