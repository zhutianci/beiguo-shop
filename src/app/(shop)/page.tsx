'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Shield, Clock, Search, Mail, Network, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TiltCard } from '@/components/tilt-card'
import { Typewriter } from '@/components/typewriter'
import { MouseSpotlight } from '@/components/mouse-spotlight'
import { CountUp } from '@/components/count-up'
import { NewsHotSection } from '@/components/news-hot-section'
import { ipToolGroups, ipToolCount } from '@/lib/iptools'

interface Product {
  id: number
  name: string
  description: string | null
  price: string | number
  originalPrice: string | number | null
  features: string | null
  stock: number
  sales: number
}

const gradients = [
  'from-violet-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-600',
  'from-cyan-600 to-blue-600',
  'from-amber-600 to-orange-600',
]

function getGradient(id: number) {
  return gradients[id % gradients.length]
}

function getTag(name: string) {
  const n = name.toLowerCase()
  if (n.includes('20x')) return 'ULTIMATE'
  if (n.includes('5x')) return '5X POWER'
  if (n.includes('pro') && n.includes('chatgpt')) return 'o1 ACCESS'
  if (n.includes('plus')) return 'GPT-4'
  if (n.includes('pro')) return 'POPULAR'
  return 'NEW'
}

const features = [
  { icon: Zap, title: '极速开通', desc: '最快10分钟' },
  { icon: Shield, title: '安全保障', desc: '正规渠道' },
  { icon: Clock, title: '持续服务', desc: '长期稳定' },
]

export default function HomePage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const [products, setProducts] = useState<Product[]>([])
  const [lookupEmail, setLookupEmail] = useState('')

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (lookupEmail.trim()) {
      router.push(`/lookup?email=${encodeURIComponent(lookupEmail.trim())}`)
    } else {
      router.push('/lookup')
    }
  }

  useEffect(() => {
    // 首页只展示 6 个精选商品，直接按分页取，避免拉全表
    fetch('/api/products?page=1&pageSize=6')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProducts(data.data.list)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="relative overflow-hidden">
      {/* 全局鼠标跟随光晕 */}
      <MouseSpotlight />

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse-glow" />

        <motion.div
          className="absolute top-20 right-20 w-20 h-20 border border-white/10 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-32 h-32 border border-white/5 rounded-2xl"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div style={{ y }} className="container relative z-10">
          {/* 桌面端：text-display 在 xl 是 9xl(128px)，打字机长句在 max-w-5xl(1024px) 内会临界折行、
              每敲一个字抖一下；xl 起放宽到 6xl 既止住抖动，也让 hero 在 1920 宽屏下不再只占中间一窄条 */}
          <div className="max-w-5xl xl:max-w-6xl mx-auto text-center">
            {/* 徽标在桌面端跟着 hero 一起放大：否则 128px 大标题上顶着一个 12px 小胶囊，比例失衡 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full glass mb-8"
            >
              <Sparkles className="w-4 h-4 lg:w-[18px] lg:h-[18px] text-purple-400" />
              <span className="text-sm lg:text-base text-white/80">AI 订阅服务专家</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-display leading-[0.9] mb-8"
            >
              <span className="gradient-text">解锁</span>
              <br />
              <span className="gradient-text-accent">
                <Typewriter
                  texts={['AI 无限可能', 'Claude 智能体验', 'ChatGPT 顶级服务', '未来生产力']}
                  typeSpeed={150}
                  deleteSpeed={80}
                  pauseTime={2500}
                />
              </span>
            </motion.h1>

            {/* 副标题在 xl 提到 2xl(24px)：text-body-lg 最大只到 20px，压在 128px 标题下面显得断层；
                同时放宽到 3xl，让两行文案在宽屏里保持在舒适行长内 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-body-lg xl:text-2xl max-w-2xl xl:max-w-3xl mx-auto mb-12"
            >
              专业提供 Claude Pro、MAX、ChatGPT Plus、Pro 订阅服务
              <br />
              <span className="text-white/40">快速开通 · 安全可靠 · 售后无忧</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 lg:gap-5 justify-center"
            >
              {/* 主 CTA 在 lg 起放大到 20px/更大内边距：桌面端鼠标点击不需要 44px 触控保底，
                  但在 128px 标题下面，16px 的按钮会显得像个次要链接，撑不起转化入口的分量 */}
              <Link href="/products">
                <button className="group relative px-8 py-4 lg:px-10 lg:py-5 lg:text-lg bg-white text-black font-semibold rounded-full overflow-hidden transition-transform hover:scale-105">
                  <span className="relative z-10 flex items-center gap-2">
                    立即选购
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
              <Link href="/about">
                <button className="px-8 py-4 lg:px-10 lg:py-5 lg:text-lg glass rounded-full font-medium hover:bg-white/10 transition-colors">
                  了解更多
                </button>
              </Link>
            </motion.div>

            {/* 订单查询入口 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="mt-10 flex justify-center"
            >
              {/* 订单查询框：手机端 w-full 才够放下这句 placeholder，桌面端不该继续「占满」，
                  但 max-w-md(448px) 在 16px 字号下又会把 placeholder 挤到省略号，
                  所以 md 起给到 lg(512px) 并同步把字号提到 base —— 宽度是为了容纳文案，不是为了铺满 */}
              <form onSubmit={handleLookup} className="relative w-full max-w-md md:max-w-lg">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-cyan-500/40 rounded-full blur-sm opacity-50" />
                <div className="relative flex items-center gap-1 p-1.5 md:p-2 glass-strong rounded-full">
                  <div className="flex-1 flex items-center gap-2 pl-4">
                    <Mail className="w-4 h-4 md:w-[18px] md:h-[18px] text-white/40 flex-shrink-0" />
                    <input
                      type="email"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      placeholder="已下单？输入邮箱查询订阅状态"
                      className="flex-1 bg-transparent border-0 outline-none text-sm md:text-base text-white placeholder:text-white/40 py-2 min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 md:px-6 md:py-2.5 rounded-full bg-white text-black text-sm md:text-base font-semibold flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    查询
                  </button>
                </div>
              </form>
            </motion.div>

            {/* 三个卖点：手机端换行紧排，桌面端拉开间距并整体放大一档，
                让这一排在 1920 宽屏里成为 hero 的「底座」，而不是缩在中间的一行小字 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-8 lg:gap-14 xl:gap-20 mt-16"
            >
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 lg:gap-4 text-white/60">
                  <feature.icon className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
                  <div className="text-left">
                    <div className="text-sm lg:text-base font-medium text-white">{feature.title}</div>
                    <div className="text-xs lg:text-sm">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-2"
            >
              <div className="w-1 h-2 bg-white/40 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="relative py-32">
        <div className="absolute inset-0 grid-bg opacity-50" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-headline mb-4">
              <span className="gradient-text">精选服务</span>
            </h2>
            <p className="text-white/50 text-lg lg:text-xl">选择适合你的 AI 订阅方案</p>
          </motion.div>

          {products.length === 0 ? (
            <div className="text-center py-20 text-white/40">加载中...</div>
          ) : (
            /* 首页只放 6 个精选，lg 三列正好两行整齐收口，所以 xl 不再加列；
               只把间距在 xl 放大，避免 1280+ 时三张卡贴在一起像一块整板 */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
              {products.map((product, index) => {
                const gradient = getGradient(product.id)
                const tag = getTag(product.name)
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link href={`/products/${product.id}`}>
                      <TiltCard maxTilt={8} scale={1.03} className="group h-full">
                        <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500`} />

                        {/* 卡片内边距/字号在 lg 起加一档：桌面端单卡宽约 400px，
                            继续沿用手机端的 p-6 + text-sm 会显得内容缩在正中、四周全是空白 */}
                        <div className="relative h-full glass rounded-2xl p-6 lg:p-7 xl:p-8">
                          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gradient} mb-4`}>
                            {tag}
                          </div>

                          <h3 className="text-2xl xl:text-3xl font-bold mb-2">{product.name}</h3>
                          <p className="text-white/50 text-sm lg:text-[15px] lg:leading-relaxed mb-6">{product.description}</p>

                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-bold">¥{Number(product.price).toFixed(0)}</span>
                            {product.originalPrice && (
                              <span className="text-white/30 line-through">¥{Number(product.originalPrice).toFixed(0)}</span>
                            )}
                            <span className="text-xs text-white/40">/月</span>
                          </div>

                          {/* 销量 + 库存 */}
                          <div className="flex items-center justify-between text-xs lg:text-sm text-white/40 mb-4 px-1">
                            <span>已售 {product.sales}</span>
                            <span>
                              {product.stock === -1
                                ? '现货充足'
                                : product.stock === 0
                                  ? '已售罄'
                                  : `余量 ${product.stock}`}
                            </span>
                          </div>

                          <div className={`flex items-center justify-center gap-2 py-3 lg:py-3.5 lg:text-[15px] rounded-xl bg-gradient-to-r ${gradient} font-medium group-hover:shadow-lg transition-shadow`}>
                            立即购买
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </TiltCard>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* AI 圈今日热点：内部固定高度 skeleton 占位；接口失败或暂无内容整块静默隐藏，不影响卖货主线 */}
      <NewsHotSection />

      {/* IP 工具入口 */}
      <section className="relative py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-cyan-500/15 rounded-full blur-[128px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/iptools" className="group block">
              <div className="relative glass rounded-3xl p-8 md:p-12 overflow-hidden transition-colors hover:bg-white/[0.07]">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 -z-10" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 lg:gap-12">
                  {/* 文案列限制在 xl 也不超过 2xl(672px)：这是段正文，行长超过 80 字符就难读，
                      多出来的横向空间留给右侧工具标签，而不是把这段拉成一条长线 */}
                  <div className="max-w-xl xl:max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-5">
                      <Network className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-white/70">网络诊断工具合集 · 共 {ipToolCount} 项</span>
                    </div>
                    <h2 className="text-headline mb-3">
                      <span className="gradient-text">IP 工具</span>
                    </h2>
                    <p className="text-white/50 text-base md:text-lg xl:text-xl lg:leading-relaxed mb-6">
                      IP 查询、分流出口、Claude 可用性、DNS / WebRTC 泄露、全球 Ping 与服务状态，一站排查网络环境。
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 font-medium group-hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-shadow">
                      查看全部工具
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* 工具速览标签 */}
                  <div className="flex flex-wrap gap-2 lg:gap-2.5 md:max-w-xs lg:max-w-sm md:justify-end">
                    {ipToolGroups[0].tools.slice(0, 6).map((tool) => (
                      <span
                        key={tool.url}
                        className="inline-flex items-center gap-1 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full glass text-xs lg:text-sm text-white/60"
                      >
                        {tool.name}
                        <ArrowUpRight className="w-3 h-3 text-white/30" />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/5">
        <div className="container">
          {/* 数字统计：手机端 gap-12 已经够挤，桌面端把间距和数字都放大一档，
              让这条横向数据带撑住 1280+ 的容器宽度，而不是四个小数字挤在正中 */}
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 xl:gap-28 text-white/20">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                <CountUp end={1000} duration={2000} suffix="+" />
              </div>
              <div className="text-sm lg:text-base">服务用户</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                <CountUp end={99.9} duration={2200} suffix="%" decimals={1} />
              </div>
              <div className="text-sm lg:text-base">成功率</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm lg:text-base">客服支持</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                <CountUp end={10} duration={1500} suffix="min" />
              </div>
              <div className="text-sm lg:text-base">极速开通</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/20 rounded-full blur-[128px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-headline mb-6">
              准备好开始了吗？
            </h2>
            <p className="text-white/50 text-lg lg:text-xl mb-10">
              立即注册，解锁 AI 的无限可能
            </p>
            <Link href="/register">
              <button className="group px-10 py-5 lg:px-12 lg:py-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg lg:text-xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-shadow">
                <span className="flex items-center gap-3">
                  开始使用
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
