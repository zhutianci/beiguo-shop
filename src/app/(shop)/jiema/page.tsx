import Link from 'next/link'
import { MessageSquareText, Clock, ShieldCheck, Wrench } from 'lucide-react'
import { notFoundOnChannel } from '@/lib/storefront/resolve'
import { jiemaViewer } from '@/lib/jiema/access'
import { catalogSnapshot } from '@/lib/jiema/catalog'
import { JIEMA_ORDER_AVAILABLE } from '@/lib/jiema-config-schema'
import { readWalletConfig, topupOpenFor } from '@/lib/wallet/config'
import { prisma } from '@/lib/db'
import { jiemaFaqs } from '@/lib/support-faq'
import { PLATFORM_CONTACT } from '@/lib/contact'
import { JsonLd } from '@/lib/seo/jsonld'
import { faqJsonLd } from '@/lib/seo/graph'
import { JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE } from '@/lib/terms/jiema-wallet'
import { JiemaClient } from './jiema-client'
import { JiemaActiveBanner } from './active-banner'

export const dynamic = 'force-dynamic'

/**
 * 短信接码主页面 /jiema（docs/短信接码-设计.md §1.4–§1.8、§1.13、§1.14、D24–D28、D44）。
 *
 * 服务端外壳：H1、说明、规则摘要，并**预取服务目录**交给客户端组件（首屏不等网络，搜索全在前端，§1.4）。
 * 对谁开放（lib/jiema-config-schema 的 jiemaAccessFor）：
 *  · 普通用户在对全部用户开放前看到「短信接码即将开放」（§1.14）；配置读不到 / 开放后总开关关了 →「接码服务维护中」；
 *  · 管理员灰度期直接访问可以预览全部交互（选服务、国家/地区、运营商、确认面板），但「去支付」不可用（§11 S1）。
 * 「去支付」（S2b）：接码下单已交付（JIEMA_ORDER_AVAILABLE）&& 总开关开 && （对全部用户开放，或管理员在「仅管理员」灰度期真钱验收）。
 * 余额支付开关（wallet_config.balancePayEnabled，读不到按关）与本人上一张接码单同意过的条款版本在这里读好交给确认面板（§1.8）。
 * 第一行 notFoundOnChannel（layout 已经调过一次；页面这里再调一次，免得以后有人把 layout 改掉），不包进 try。
 * 【S3】顶部「进行中订单提示条」与「我的接码记录 →」（客户端，登录后才请求，§1.4）；维护中 / 即将开放的说明卡片里也挂一份
 * （总开关关了在途单照常推进，E59；买家回来要能找回，E18——S3 评审修复），入口只对有过接码单的账号显示；页尾 FAQ（与客服页 #jiema 同一份 lib/support-faq.jiemaFaqs，
 * 数字取当前配置），**只在对全部用户开放时**输出 FAQPage 结构化数据（§1.3；管理员预览时普通访客看不到，不能标记）。
 * 【2026-09-30】规则卡片与页尾链到《短信接码服务条款》全文（/jiema/terms，§8.6）；付款前每一单弹「下单须知与免责声明」在确认面板里。
 */
export default async function JiemaPage() {
  await notFoundOnChannel()
  const v = await jiemaViewer()

  if (v.access === 'SOON' || v.access === 'MAINTENANCE' || !v.cfg) {
    const maintenance = v.access === 'MAINTENANCE' || !v.cfg
    return (
      <div className="page-top container max-w-3xl pb-24">
        <div className="glass rounded-3xl px-6 py-16 text-center sm:px-10">
          {maintenance ? <Wrench className="mx-auto h-8 w-8 text-amber-300" /> : <MessageSquareText className="mx-auto h-8 w-8 text-cyan-300" />}
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{maintenance ? '接码服务维护中，预计很快恢复' : '短信接码即将开放'}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
            {maintenance
              ? '已付款的订单照常处理；因服务异常取不到号的，会自动取消并退回余额。'
              : '海外手机号在线接收短信验证码，没收到短信整单退回站内余额。上线后会出现在顶部导航。'}
          </p>
          {/* 在途订单照常推进（E59），买家回来要能找回（E18）：登录后显示进行中提示条与「我的接码记录」（只对有过接码单的人显示入口） */}
          <div className="mx-auto max-w-md text-left">
            <JiemaActiveBanner onlyWithOrders />
          </div>
          {v.isAdmin && !v.cfg && (
            <p className="mx-auto mt-4 max-w-md rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-100/90">
              管理员：sms_config 读取失败（fail-closed）。到后台「短信接码 → 设置」点「填入出厂值」再保存一次即可。
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/products" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-white/75 hover:bg-white/10">
              去看看其他商品
            </Link>
            <Link href="/support" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-white/75 hover:bg-white/10">
              联系客服
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const [snap, wallet, last] = await Promise.all([
    catalogSnapshot(v.cfg),
    readWalletConfig().catch(() => null),
    v.userId
      ? prisma.smsOrder.findFirst({ where: { userId: v.userId }, orderBy: { id: 'desc' }, select: { termsVersion: true, walletTermsVersion: true } }).catch(() => null)
      : Promise.resolve(null),
  ])
  const hot = snap.services.filter((s) => s.hot != null).sort((a, b) => (a.hot ?? 0) - (b.hot ?? 0)).slice(0, 12)
  const orderAvailable = JIEMA_ORDER_AVAILABLE && v.cfg.enabled && (v.access === 'OPEN' || v.isAdmin)
  const balancePayOn = !!wallet && wallet.ok && wallet.config.balancePayEnabled
  // FAQ（S3）：充值开没开按访客算（对全部用户开放时按普通访客——结构化数据给所有人看；管理员预览按管理员）
  const topupOn = !!wallet && wallet.ok && topupOpenFor(wallet.config, v.access !== 'OPEN' && v.isAdmin)
  const faqs = jiemaFaqs({
    maxReplace: v.cfg.maxReplace,
    complaintWindowH: v.cfg.complaintWindowH,
    topup: topupOn && wallet && wallet.ok ? { tiersCents: wallet.config.tiersCents, minCents: wallet.config.minCents, maxCents: wallet.config.maxCents } : null,
    hours: PLATFORM_CONTACT.hours,
  })

  return (
    <div className="page-top container max-w-6xl pb-44 lg:pb-40">
      <header className="mb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <MessageSquareText className="h-7 w-7 text-cyan-300" />
            短信接码
          </h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          海外手机号在线收验证码 · 没收到短信整单退回余额 · 收码前可免费换号 {v.cfg.maxReplace} 次
        </p>
        {/* 进行中订单提示条 + 我的接码记录（登录后才显示，§1.4） */}
        <JiemaActiveBanner />
        {/* 服务端渲染的热门服务链接（首屏可读、可收录；点了由客户端组件接管选择状态） */}
        {hot.length > 0 && (
          <nav aria-label="热门服务" className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/40">
            {hot.map((s) => (
              <a key={s.code} href={`/jiema?s=${encodeURIComponent(s.code)}`} className="hover:text-white/70">
                {s.name}
              </a>
            ))}
          </nav>
        )}
      </header>

      <JiemaClient
        services={snap.services}
        anyOther={snap.anyOther}
        updatedAt={snap.updatedAt}
        stale={snap.stale}
        degraded={snap.degraded}
        maintenance={snap.maintenance}
        preview={v.access === 'ADMIN_PREVIEW'}
        orderAvailable={orderAvailable}
        maxReplace={v.cfg.maxReplace}
        balancePayOn={balancePayOn}
        lastTerms={last ? { jiema: last.termsVersion, wallet: last.walletTermsVersion } : null}
      />

      <section className="mt-10 grid gap-4 text-[13px] leading-relaxed text-white/55 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium text-white/80">
            <Clock className="h-4 w-4 text-cyan-300" />
            号码怎么用
          </div>
          号码 20 分钟有效。取号 2 分钟后可以换号或取消；收码前可免费换号 {v.cfg.maxReplace} 次，收到验证码后不能再换号或取消。
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium text-white/80">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            没收到短信怎么办
          </div>
          号码到期或你主动取消后，本单整单退回站内余额（含支付宝付的部分）；退回的余额不能提现、不退回支付宝，目前可用于短信接码。
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium text-white/80">
            <MessageSquareText className="h-4 w-4 text-purple-300" />
            价格与开票
          </div>
          价格每 10 分钟更新，下单时以实时价格为准。暂不支持开票，可
          <Link href="/support#jiema" className="text-cyan-300/90 hover:underline">
            联系客服
          </Link>
          开票处理。本服务仅限用于学习交流、软件开发测试与本人合法注册验证等合法用途，严禁用于违法犯罪、电信网络诈骗或冒用他人身份，详见
          <Link href={JIEMA_TERMS_PATH} className="text-cyan-300/90 hover:underline">
            《{JIEMA_TERMS_TITLE}》
          </Link>
          。
        </div>
      </section>

      {/* 常见问题（与客服页 #jiema 同一份数据；对全部用户开放时同时输出 FAQPage 结构化数据，文字与这里看得到的一致） */}
      <section aria-labelledby="jiema-faq" className="mt-10">
        <h2 id="jiema-faq" className="mb-3 text-lg font-semibold text-white/85">
          常见问题
        </h2>
        <div className="space-y-2">
          {faqs.map((f) => (
            <details key={f.q} className="glass group rounded-xl px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-white/80 marker:hidden">{f.q}</summary>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">
          更多问题见
          <Link href="/support#jiema" className="mx-1 text-cyan-300/90 hover:underline">
            客服中心
          </Link>
          ，或在号码页点「联系客服」在线留言。下单前请阅读
          <Link href={JIEMA_TERMS_PATH} className="mx-1 text-cyan-300/90 hover:underline">
            《{JIEMA_TERMS_TITLE}》
          </Link>
          （含免责声明与相关法律条文）。
        </p>
      </section>
      {v.access === 'OPEN' && <JsonLd data={[faqJsonLd(faqs)]} />}
    </div>
  )
}
