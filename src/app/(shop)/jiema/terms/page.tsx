import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { SITE_NAME } from '@/lib/product-seo'
import { notFoundOnChannel, getStorefront } from '@/lib/storefront/resolve'
import { resolveStoreContact } from '@/lib/contact'
import { JIEMA_TERMS, JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE, JIEMA_TERMS_VERSION, WALLET_TERMS_TITLE, WALLET_TERMS_VERSION, walletTermsFor } from '@/lib/terms/jiema-wallet'
import { JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS, LEGAL_ARTICLES, LEGAL_NOTE, TERMS_MISC, articleLabel } from '@/lib/terms/jiema-legal'
import { readWalletConfig, canUseForJiema } from '@/lib/wallet/config'

export const dynamic = 'force-dynamic'

/**
 * 《短信接码服务条款》全文 /jiema/terms（docs/短信接码-设计.md §8.6；站长 2026-09-30 需求）。
 *
 * 正文全部来自 lib/terms（JIEMA_TERMS 第一节 + jiema-legal.ts 第二到八节与法条摘录），与付款前弹窗同一份；版本号 JIEMA_TERMS_VERSION
 * 就是页面的「最后更新」。付款前弹窗、确认面板、/jiema 页尾、条款页第四节都链到这里。
 * 【只在主站】页面组 layout 已调 notFoundOnChannel()，这里再调一次（同 /jiema/records），不包进 try。
 * 【收录】robots 继承 /jiema 页面组 layout（只在对全部用户开放时允许收录）；canonical 是自己。
 * 灰度期（仅管理员）也能打开：管理员真钱验收时弹窗里的链接要能点开；页面只陈述条款，不宣称服务已开放。
 * 附《余额与充值规则》：第 2 条（余额付接码、预扣）随 canUseForJiema 出现（与条款页第四节同一口径；配置读不到按不显示）。
 */
const TITLE = `${JIEMA_TERMS_TITLE} - ${SITE_NAME}`
const DESCRIPTION = '贝果科技短信接码服务条款：服务与退款规则、用途限制、仅供学习交流与测试、使用后果自负、平台的处置与记录留存、责任限制，以及相关法律条文摘录。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: JIEMA_TERMS_PATH },
}

export default async function JiemaTermsPage() {
  await notFoundOnChannel()
  const sf = await getStorefront()
  const contact = sf ? sf.contact : resolveStoreContact(null)
  let jiemaBalance = false
  try {
    jiemaBalance = await canUseForJiema(await readWalletConfig())
  } catch {
    jiemaBalance = false
  }

  return (
    <LegalPage
      title={JIEMA_TERMS_TITLE}
      updatedAt={JIEMA_TERMS_VERSION}
      contact={contact}
      intro={
        <>
          <p>
            本条款是你与益阳市赫山区必高科技有限公司（经营站点 bigolab.com「贝果科技」，以下简称「平台」）之间关于短信接码服务（以下简称「本服务」）的协议，是
            <Link href="/terms" className="mx-0.5 text-purple-400 hover:text-purple-300">
              《服务条款》
            </Link>
            的组成部分。<strong className="text-white">每一单付款前都会弹出「下单须知与免责声明」，勾选同意后才能下单；下单即表示你已阅读并同意本条款。</strong>
            当前版本：{JIEMA_TERMS_VERSION}。
          </p>
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.06] p-4">
            <p className="mb-2 font-semibold text-rose-200">免责声明（要点）</p>
            <ol className="list-decimal space-y-1.5 pl-6 text-white/80">
              {JIEMA_DISCLAIMER.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        </>
      }
    >
      <LegalSection heading="一、服务与退款">
        <ol className="list-decimal space-y-2 pl-6">
          {JIEMA_TERMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </LegalSection>

      {JIEMA_TERMS_SECTIONS.map((s) => (
        <LegalSection key={s.id} heading={s.heading}>
          {s.lead && <p>{s.lead}</p>}
          <ul className="space-y-2">
            {s.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </LegalSection>
      ))}

      <LegalSection heading="七、相关法律条文（摘录）">
        <p className="text-white/55">{LEGAL_NOTE}</p>
        <div className="space-y-5">
          {LEGAL_ARTICLES.map((a) => (
            <section key={a.id} id={a.id} className="scroll-mt-32 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="font-semibold text-white">
                {articleLabel(a)}
                <span className="font-normal text-white/55"> · {a.topic}</span>
              </h3>
              <blockquote className="mt-2 space-y-1.5 border-l-2 border-white/15 pl-3 text-[14px] text-white/75">
                {a.text.map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </blockquote>
              <p className="mt-2 text-xs text-white/45">
                {a.version}。来源：
                <a href={a.source.url} target="_blank" rel="noopener noreferrer" className="break-all text-purple-400 hover:text-purple-300">
                  {a.source.name}
                </a>
                {a.current && (
                  <>
                    ；现行文本：
                    <a href={a.current.url} target="_blank" rel="noopener noreferrer" className="break-all text-purple-400 hover:text-purple-300">
                      {a.current.name}
                    </a>
                  </>
                )}
              </p>
            </section>
          ))}
        </div>
      </LegalSection>

      <LegalSection heading="八、其他">
        <ul className="space-y-2">
          {TERMS_MISC.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>
          关于个人信息的处理与各类记录的保存期限，另见
          <Link href="/privacy" className="mx-0.5 text-purple-400 hover:text-purple-300">
            隐私政策
          </Link>
          。
        </p>
      </LegalSection>

      <LegalSection heading={`附：《${WALLET_TERMS_TITLE}》（版本 ${WALLET_TERMS_VERSION}）`}>
        <p className="text-white/55">没有收到短信的订单，支付宝付的部分同样退入充值余额，所以不论用哪种付款方式下单，都需要同意这份规则。</p>
        <ol className="list-decimal space-y-2 pl-6">
          {walletTermsFor(jiemaBalance).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </LegalSection>
    </LegalPage>
  )
}
