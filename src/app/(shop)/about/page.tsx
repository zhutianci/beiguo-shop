import Link from 'next/link'
import { ArrowRight, Award, CreditCard, FileText, LifeBuoy, MessageCircle, Newspaper, ShieldAlert, Smartphone, Sparkles, Ticket } from 'lucide-react'
import { resolveStoreContact } from '@/lib/contact'
import { JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE } from '@/lib/terms/jiema-wallet'
import { INVOICE_TAX_TEXT, aboutBusinesses, aboutContext } from './about-context'

/**
 * 关于我们（docs/SEO-重构/SEO-重构设计.md §3.2-J，A 包，2026-09-30 重写）。
 *
 * 【按 §3.2-J 的顺序写】我们做什么（各业务一段）→ 不做什么 → 经营主体与执照 → 付款与开票 → 售后与退款 → 出问题找谁。
 * 买家点开关于页是来核验「这家靠不靠谱」的，每一句都要能对照服务条款、商品页或代码核实：
 *  · 删掉「让每一位用户便捷地享受全球顶尖的 AI 服务」一类使命愿景：「顶尖」是最高级用语（§3.4），也核验不了；
 *  · 删掉「账号不经手」「账号始终在你自己手里」「全程不用交出账号」：iOS 订阅档（ChatGPT Plus、Grok）兑换时要提供一段登录凭据，
 *    这几句对它们不成立（chongzhi/chatgpt-plus、grok-super 页的问答）；改成如实说明哪些档位要什么；
 *  · 开票写完整口径「标价不含税，开票另付 6%」（6% 取 lib/invoice.ts 的 TAX_RATE）；接码单写 D37 原文「暂不支持开票，可联系客服开票处理」。
 *  · 退款口径逐字对照 /terms 第四节与 lib/terms/jiema-wallet.ts（接码条款正文一个字不改，这里只做摘要并链过去）。
 *
 * 【接码按开放状态】about-context.ts：只在主站、对全部用户开放时出现，灰度期页面上没有 /jiema 的链接（D28）。
 * 【渠道站】充值落地页、大事记、接码在渠道 Host 上都关着（404），正文不给这些入口；客服用渠道自己的（sf.contact）。
 *
 * 【为什么改成服务端组件】原来整页 'use client'，每一块都是 framer-motion 的 opacity:0 首帧、滚到才淡入；
 * 这一页没有任何交互，服务端直出、首帧可见，也省掉一份 framer-motion 的客户端开销。
 */
export default async function AboutPage() {
  const ctx = await aboutContext()
  const { sf, isPlatform, features, jiemaOpen, jiemaBalancePay } = ctx
  const contact = sf ? sf.contact : resolveStoreContact(null)
  const catalogOpen = !sf || sf.status !== 'TERMINATED'
  const businesses = aboutBusinesses(ctx)
  const showLanding = isPlatform && features.landing
  const showNews = isPlatform && features.news

  const facts = [
    { value: '持照经营', label: '益阳市赫山区必高科技有限公司' },
    { value: '支付宝', label: '人民币付款，无需境外信用卡' },
    { value: '可开票', label: `增值税发票，${INVOICE_TAX_TEXT}` },
    { value: '规则公开', label: '质保与退款口径写在服务条款里' },
  ]

  return (
    <div className="min-h-screen page-top pb-20">
      {/* 背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {/* lite-blob：手机端轻量模式（2026-10-01，站长要求电脑端不变）下大模糊光斑换成渐变遮罩（iOS WebKit 画大模糊太贵，滑动出黑块），规则见 globals.css 末尾 */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />

      <div className="container relative">
        {/* Hero */}
        <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">关于我们</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
            <span className="gradient-text">关于贝果科技 BigoLab</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg lg:text-xl leading-relaxed lg:leading-[1.8]">
            贝果科技（bigolab.com）由益阳市赫山区必高科技有限公司运营，提供 {businesses.join('、')}。
            下面把经营主体、怎么付款和开票、出了问题怎么处理写清楚，每一条都能对照服务条款核实。
          </p>
        </div>

        {/* 四项可核验的事实 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20 lg:mb-24">
          {facts.map((f) => (
            <div key={f.value} className="glass rounded-2xl p-5 md:p-6 text-center">
              <div className="text-xl md:text-2xl font-bold gradient-text-accent mb-2">{f.value}</div>
              <div className="text-xs md:text-sm text-white/55">{f.label}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-4xl space-y-16 lg:space-y-20">
          {/* 一、我们做什么 */}
          <section aria-labelledby="about-what">
            <h2 id="about-what" className="text-2xl lg:text-3xl font-bold mb-6">
              <span className="gradient-text">我们做什么</span>
            </h2>
            <div className="grid gap-4 md:gap-5">
              <BizCard icon={<Ticket className="w-5 h-5" />} title="AI 会员充值">
                <p>
                  ChatGPT Plus / Pro、Claude Pro / Max、SuperGrok 等订阅的充值。多数档位付款后自动发放卡密，你在本站的兑换页自己提交充值；
                  iOS 订阅档兑换时需要按商品说明提供一段登录凭据，用途仅限执行这一笔充值。少数需要人工办理的服务，交付方式以各商品页为准。
                </p>
                <p className="mt-3">
                  {showLanding ? (
                    <>
                      各档位的价格、交付方式和兑换前要确认的事，见{' '}
                      <Link href="/chongzhi" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                        AI 会员充值
                      </Link>
                      {catalogOpen && (
                        <>
                          {' '}与{' '}
                          <Link href="/products" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                            全部商品与价格
                          </Link>
                        </>
                      )}
                      。
                    </>
                  ) : catalogOpen ? (
                    <>
                      各档位的价格与交付方式见{' '}
                      <Link href="/products" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                        全部商品
                      </Link>
                      。
                    </>
                  ) : null}
                </p>
              </BizCard>

              {jiemaOpen && (
                <BizCard icon={<Smartphone className="w-5 h-5" />} title="短信接码">
                  <p>
                    选服务、选国家/地区，用海外手机号在线接收短信验证码，按服务和国家/地区实时报价；号码能否通过验证由对应平台决定。
                    没有收到短信的订单整单退回站内余额。仅限本人账号的合法验证，完整规则见
                    <Link href={JIEMA_TERMS_PATH} className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                      《{JIEMA_TERMS_TITLE}》
                    </Link>
                    。
                  </p>
                  <p className="mt-3">
                    入口：
                    <Link href="/jiema" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                      短信接码
                    </Link>
                    。
                  </p>
                </BizCard>
              )}

              {showNews && (
                <BizCard icon={<Newspaper className="w-5 h-5" />} title="AI 圈大事记">
                  <p>
                    按事件聚合 AI 行业动态：模型发布、产品更新、论文与开源工具。内容由 AI 依据公开信源自动整理摘要，每条附原文链接，请以原文为准。
                    其中本站商品的入口单独标注「广告 · 本站服务」。
                  </p>
                  <p className="mt-3">
                    入口：
                    <Link href="/news" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                      AI 圈大事记
                    </Link>
                    。
                  </p>
                </BizCard>
              )}
            </div>
          </section>

          {/* 二、我们不做什么 */}
          <section aria-labelledby="about-not">
            <h2 id="about-not" className="text-2xl lg:text-3xl font-bold mb-6">
              <span className="gradient-text">我们不做什么</span>
            </h2>
            <ul className="glass rounded-2xl p-6 lg:p-8 space-y-4 text-white/70 leading-relaxed lg:text-[17px] lg:leading-[1.85]">
              <li className="flex gap-3">
                <ShieldAlert className="mt-1 w-5 h-5 shrink-0 text-amber-300/80" />
                <span>
                  <strong className="text-white/90">不是官方渠道。</strong>
                  我们不是 OpenAI、Anthropic、xAI 或任何其他 AI 服务商的官方代理、经销商或合作伙伴，与它们没有授权关系；
                  各产品名称与商标归其各自权利人所有。
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldAlert className="mt-1 w-5 h-5 shrink-0 text-amber-300/80" />
                <span>
                  <strong className="text-white/90">质保订阅，不质保封号。</strong>
                  账号被服务商封禁不在质保范围内，这一条写在各商品页和服务条款里。
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldAlert className="mt-1 w-5 h-5 shrink-0 text-amber-300/80" />
                <span>
                  <strong className="text-white/90">不替你保管账号。</strong>
                  需要你提供登录凭据或配合操作的档位，商品页会写明要什么、用在哪一步；除此之外不需要你交出账号密码。
                </span>
              </li>
            </ul>
          </section>

          {/* 三、经营主体与执照 */}
          <section aria-labelledby="about-entity">
            <h2 id="about-entity" className="text-2xl lg:text-3xl font-bold mb-6">
              <span className="gradient-text">经营主体与执照</span>
            </h2>
            <div className="glass rounded-2xl p-6 lg:p-8 flex gap-4 text-white/70 leading-relaxed lg:text-[17px] lg:leading-[1.85]">
              <Award className="mt-1 w-6 h-6 shrink-0 text-purple-300" />
              <p>
                本站由<strong className="text-white/90">益阳市赫山区必高科技有限公司</strong>运营，持营业执照经营。
                增值税发票由这家公司开具，发票上的销售方与经营主体一致。
              </p>
            </div>
          </section>

          {/* 四、付款与开票 */}
          <section aria-labelledby="about-pay">
            <h2 id="about-pay" className="text-2xl lg:text-3xl font-bold mb-6">
              <span className="gradient-text">付款与开票</span>
            </h2>
            <div className="glass rounded-2xl p-6 lg:p-8 space-y-4 text-white/70 leading-relaxed lg:text-[17px] lg:leading-[1.85]">
              <p className="flex gap-3">
                <CreditCard className="mt-1 w-5 h-5 shrink-0 text-purple-300" />
                <span>
                  <strong className="text-white/90">付款：</strong>
                  AI 会员充值只收支付宝，人民币付款，登录后下单，不需要境外信用卡。
                  {jiemaOpen && (jiemaBalancePay ? '短信接码可用支付宝或站内余额付款，余额不够时差额走支付宝。' : '短信接码用支付宝付款。')}
                </span>
              </p>
              <p className="flex gap-3">
                <FileText className="mt-1 w-5 h-5 shrink-0 text-purple-300" />
                <span>
                  <strong className="text-white/90">开票：</strong>
                  AI 会员充值可开增值税发票，{INVOICE_TAX_TEXT}；只要收据的不涉及税费。
                  {jiemaOpen && '短信接码暂不支持开票，可联系客服开票处理。'}
                </span>
              </p>
            </div>
          </section>

          {/* 五、售后与退款 */}
          <section aria-labelledby="about-refund">
            <h2 id="about-refund" className="text-2xl lg:text-3xl font-bold mb-6">
              <span className="gradient-text">售后与退款</span>
            </h2>
            <div className="glass rounded-2xl p-6 lg:p-8 space-y-4 text-white/70 leading-relaxed lg:text-[17px] lg:leading-[1.85]">
              <p>
                <strong className="text-white/90">AI 会员充值：</strong>
                订阅期内非因你自身原因掉订阅的，按剩余未使用天数折算退款；未使用的卡密可申请退款，已成功充值或卡密已被核销的不支持退款。
                完整规则见
                <Link href="/terms" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                  服务条款
                </Link>
                第四节。
              </p>
              {jiemaOpen && (
                <p>
                  <strong className="text-white/90">短信接码：</strong>
                  没有收到短信的订单整单退回站内余额，其中支付宝付的部分退入充值余额（不可提现、不退回支付宝）；收到短信即视为交付完成，不支持取消与退款。
                  完整规则见
                  <Link href={JIEMA_TERMS_PATH} className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                    《{JIEMA_TERMS_TITLE}》
                  </Link>
                  。
                </p>
              )}
            </div>
          </section>

          {/* 六、出了问题找谁 */}
          <section aria-labelledby="about-contact">
            <h2 id="about-contact" className="text-2xl lg:text-3xl font-bold mb-6">
              <span className="gradient-text">出了问题找谁</span>
            </h2>
            <div className="glass rounded-2xl p-6 lg:p-8 space-y-4 text-white/70 leading-relaxed lg:text-[17px] lg:leading-[1.85]">
              <p className="flex gap-3">
                <MessageCircle className="mt-1 w-5 h-5 shrink-0 text-purple-300" />
                <span>
                  <strong className="text-white/90">客服微信：</strong>
                  <span className="font-mono text-white/85">{contact.wechat}</span>
                  {contact.hours && <>（服务时间 {contact.hours}）</>}
                  {contact.email && (
                    <>
                      ；邮箱 <span className="font-mono text-white/85">{contact.email}</span>
                    </>
                  )}
                  。联系时带上订单号，处理得最快。
                </span>
              </p>
              <p className="flex gap-3">
                <LifeBuoy className="mt-1 w-5 h-5 shrink-0 text-purple-300" />
                <span>
                  先自助查：
                  <Link href="/support" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                    常见问题与售后
                  </Link>
                  、
                  <Link href="/orders" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                    我的订单
                  </Link>
                  {isPlatform && features.lookup && (
                    <>
                      、
                      <Link href="/lookup" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                        订阅查询
                      </Link>
                    </>
                  )}
                  ；规则以
                  <Link href="/terms" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                    服务条款
                  </Link>
                  和
                  <Link href="/privacy" className="text-purple-300 hover:text-purple-200 underline-offset-4 hover:underline">
                    隐私政策
                  </Link>
                  为准。
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* CTA */}
        {catalogOpen && (
          <div className="relative mt-20 lg:mt-24">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl opacity-30 blur-xl" />
            <div className="relative glass rounded-3xl p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">看看在售的商品</h2>
              <p className="text-white/55 lg:text-lg mb-8 max-w-xl mx-auto">每个商品页都写明了价格、交付方式和兑换前要确认的事。</p>
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all"
              >
                全部商品与价格
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BizCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6 lg:p-8">
      <h3 className="flex items-center gap-3 text-lg lg:text-xl font-bold mb-3">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">{icon}</span>
        {title}
      </h3>
      <div className="text-white/65 leading-relaxed lg:text-[17px] lg:leading-[1.85]">{children}</div>
    </div>
  )
}
