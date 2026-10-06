'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Shield, Clock, Search, Mail, Network, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Typewriter } from '@/components/typewriter'
import { MouseSpotlight } from '@/components/mouse-spotlight'
import { CountUp } from '@/components/count-up'
import { NewsHotSection } from '@/components/news-hot-section'
import { useStorefront } from '@/components/storefront-provider'
import { useLite } from '@/lib/use-lite'
import { ipToolGroups, ipToolCount } from '@/lib/iptools'
import { STOCK_TONE_CLASS, stockLevel } from '@/lib/stock-level'
import { ProductThumb } from '@/components/products/product-thumb'
import { PRODUCT_GRADIENT, deliveryBadge } from '@/components/products/gradient'

/**
 * 首页「精选服务」那几行。
 *
 * 【为什么改成由服务端传进来】原来这一段是组件自己 useEffect + fetch('/api/products?page=1&pageSize=6')
 * 拉的，于是服务端 HTML 里**一个商品名、一个价格都没有**；而 robots.txt 里 disallow 了 /api/，
 * 爬虫连那个接口都不会去抓——「反正 Google 会执行 JS」这条退路在这里不成立。
 * 现在由 page.tsx 取好传进来：客户端组件同样会被服务端渲染，
 * 这六行的名字、价格、分类从此实实在在出现在首页 HTML 里。顺带省掉了首屏那次「加载中...」。
 * 取哪六个、怎么排（有货优先、再按累计成交）在 page.tsx 那边，这里只负责画。
 *
 * 【stock 是档位代表值不是真实张数】listStorefrontProducts 出口已经过 publicStock，
 * 这里只拿它映射成文案（lib/stock-level.ts），不要拿去做任何校验。
 */
export interface HomeFeatured {
  id: number
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  /** 档位代表值，不是精确库存 */
  stock: number
  sales: number
  image: string | null
  deliveryType: string | null
  categoryName: string | null
}

/** 首页 hero 副标题第一行：固定前缀 + 打字机轮播的短语（占位逻辑见 JSX 里「打字机那一行先把高度占住」） */
const HERO_LEAD = '卡密自助兑换，支付宝付款，'
const HERO_TYPEWRITER = ['无需信用卡', '付款后即时发卡', '可开增值税发票（开票另付 6%）', '未使用卡密长期有效']
/** 最长的一句（中文字宽近似等宽，按字数取即可；以后改短语不用手动同步占位） */
const HERO_TYPEWRITER_LONGEST = HERO_TYPEWRITER.reduce((a, b) => (b.length > a.length ? b : a), '')

const features = [
  // 「最快10分钟」是编的，而且对年费档、接码档、KYC 代办都不成立。
  // 换成真的：卡密档付款后即时发放，这句比原来那句还强。
  { icon: Zap, title: '即时发卡', desc: '付款后立即到账' },
  { icon: Shield, title: '安全保障', desc: '正规渠道' },
  { icon: Clock, title: '持续服务', desc: '长期稳定' },
]

/**
 * 首页信任数据。值由服务端算好传进来（page.tsx 复用 getLandingProducts 的同一份快照，
 * 不额外打库），所以这几个数字会实实在在出现在服务端 HTML 里。
 */
export interface HomeStats {
  /** 累计成交笔数：在售商品 sales 之和，和落地页价格表里那一列同源 */
  totalSales: number
  /** 在售档位数 */
  skuCount: number
}

export default function HomeClient({ stats, featured }: { stats: HomeStats; featured: HomeFeatured[] }) {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  /*
   * 手机端轻量模式（2026-10-01，站长要求电脑端不变）：iPhone 上首页卡一分钟、滑动出现黑块，
   * 是因为下面这些常驻动画让 iOS WebKit 每秒画四十来帧、每帧都重新模糊压在上面的毛玻璃，主线程与 GPU 一直占满。
   * lite 为 true 时把「一直在转 / 一直在跳」的装饰换成静止的同款元素，版式、文案、链接一概不动。
   * 服务端与水合那次恒为 false（与电脑版完全相同，不会水合不一致），手机上水合后立刻变 true，见 lib/use-lite.ts。
   */
  const lite = useLite()
  const [lookupEmail, setLookupEmail] = useState('')
  /*
   * 渠道分站（设计 11.2、实施分包 WP1）：渠道站首页不渲染已关闭模块的入口——订阅查询（/lookup）、
   * AI 圈热点（/api/news/hot）、IP 工具（/iptools）。这些在渠道 Host 上服务端 404，留着入口就会产生 404 请求
   * （next/link 视口预取、组件自己的 fetch；验收 W1-9）。主站 features 全开，渲染结果不变。
   * 命名为 sfFeatures：本组件里的 features 已是「三个卖点」数组。
   */
  const { features: sfFeatures, brand } = useStorefront()

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (lookupEmail.trim()) {
      router.push(`/lookup?email=${encodeURIComponent(lookupEmail.trim())}`)
    } else {
      router.push('/lookup')
    }
  }

  /*
   * 【水合前填的字要接住（首帧可见的配套，2026-10-01）】hero 的查询框现在水合前就看得见、能输入，
   * iPhone 慢网下这段可能有 10~40 秒。这时打的字只在 DOM 里：React 水合不改输入框的值、也不补发 onChange，
   * lookupEmail 还是空的——不接住的话点查询会丢掉邮箱，而且商品列表拉回来的那次重渲染会把输入框清空。
   * 所以挂载后把 DOM 里已有的值抄进 state。水合前点查询：表单带 action="/lookup"、输入框 name="email"，
   * 浏览器原生跳到 /lookup?email=…，和水合后 router.push 的地址一样（邮箱本来就在这个地址里）。
   */
  const lookupInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const typed = lookupInputRef.current?.value
    if (typed) setLookupEmail(typed)
  }, [])

  return (
    <div className="relative overflow-hidden">
      {/* 全局鼠标跟随光晕 */}
      <MouseSpotlight />

      {/* 手机端轻量模式：lite:pt-24 给固定页头（约 88px）留位置，否则「AI 订阅服务专家」徽标压在站标和「注册」按钮底下；电脑端不变 */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden lite:pt-24">
        <div className="absolute inset-0 grid-bg" />
        {/* lite-blob：手机端轻量模式下 128px 大模糊 + 无限呼吸换成静止的渐变柔光（规则在 globals.css 末尾），电脑端不变 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] lite-blob animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] lite-blob animate-pulse-glow" />

        {/* 手机端轻量模式：两个装饰框换成不转的同款。framer 的 repeat: Infinity 在 JS 里每帧改一次 transform，
            页面永远停不下来（iOS 上每帧还要重绘压在上面的毛玻璃）；卸掉 motion 元素才能停掉这个循环 */}
        {lite ? (
          <>
            <div aria-hidden className="absolute top-20 right-20 w-20 h-20 border border-white/10 rounded-full" />
            <div aria-hidden className="absolute bottom-40 left-20 w-32 h-32 border border-white/5 rounded-2xl" />
          </>
        ) : (
          <>
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
          </>
        )}

        {/* 手机端轻量模式：不做滚动视差（每个滚动帧给整块 hero 连同里面的毛玻璃写一次 transform）。
            lite:!transform-none 从服务端 HTML 第一帧起就生效；这个容器本身不能换掉或重挂载（水合前填的查询框靠它） */}
        <motion.div style={lite ? undefined : { y }} className="container relative z-10 lite:!transform-none">
          {/* 桌面端：text-display 在 xl 是 9xl(128px)，打字机长句在 max-w-5xl(1024px) 内会临界折行、
              每敲一个字抖一下；xl 起放宽到 6xl 既止住抖动，也让 hero 在 1920 宽屏下不再只占中间一窄条 */}
          <div className="max-w-5xl xl:max-w-6xl mx-auto text-center">
            {/*
              【首帧可见 · iPhone「打不开」（2026-09-30）】iPhone 上的 Safari / Chrome 走 HTTPS（大陆移动网络）时
              JS 常晚到 10~40 秒；这段 hero 原来服务端输出 opacity:0、页头又在视口外，水合前整屏只剩深色背景，
              买家看到的就是「打不开」。改法与暂停中的 SEO 重构 B 包逐字相同（那边变基时不冲突），说明见下方 H1 前的注释。
            */}
            {/* 徽标在桌面端跟着 hero 一起放大：否则 128px 大标题上顶着一个 12px 小胶囊，比例失衡 */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full glass mb-8"
            >
              <Sparkles className="w-4 h-4 lg:w-[18px] lg:h-[18px] text-purple-400" />
              <span className="text-sm lg:text-base text-white/80">AI 订阅服务专家</span>
            </motion.div>

            {/*
              【2026-09-19 H1 改静态，打字机下放到副标题】
              原来的 H1 是「解锁」+ <Typewriter>，而 Typewriter 的 charIndex 从 0 起步，
              **服务端渲染出来的 H1 里只有「解锁」两个字加一个光标**（线上实测如此）。
              全站最重要的一个 H1，在 Google 眼里是一个没有信息量的词。
              现在 H1 写死成含主词的一句话，打字机移到副标题——
              动效一点没少，但爬虫和读屏软件拿到的是一句完整的话。
            */}
            {/*
              【首帧可见（SEO 重构 B 包，设计 §6.6-3）】hero 里的徽标、H1、副标题、按钮、查询框、卖点原来都是
              initial={{ opacity: 0 … }}：服务端 HTML 里整块是 style="opacity:0"，要等 JS 下载、水合完再淡入，
              首屏最大的这段文字（LCP 候选）被白白推迟；JS 慢或失败时首屏就是空的。
              改成 initial={false}：服务端直接按最终状态输出，水合后不再播入场动画。
              往下的区块（whileInView）只留位移、不再从透明开始，服务端 HTML 里的内容同样一直可见。
            */}
            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-display leading-[0.9] mb-8"
            >
              {/* 【两行拼起来必须是一句通顺的话】<br> 只是视觉换行，不产生语义停顿——
                  搜索引擎、读屏软件、微信分享标题读到的都是连起来的那一串。
                  所以上行是宾语（产品名）、下行是谓语（动作），连读为
                  「ChatGPT、Claude 充值与代充」，两个同义主词都在。

                  【为什么 H1 里不写 Plus / Pro / Max 这些档位】首页要说的是「这门生意是什么」，
                  写死两个档位会让人以为只做那两档（实际还有 Pro 5x、年费、接码、注册、KYC）。
                  档位词交给 /chongzhi 下面那 7 个子页各自去吃——首页吃宽词、子页吃精确词，
                  这是信息架构该有的分工，不是放弃关键词。
                  副标题里已经把 Plus / Pro / Max 5x / 接码 / KYC 全列了一遍，覆盖不丢。

                  一个已知的不对称：`chatgpt充值` 有 8 条下拉联想，而 `claude充值` 是 0 条
                  —— Claude 侧用户不搜裸品牌词，必须带档位（claude pro充值 才有联想）。
                  所以「Claude 充值」这半句匹配不到真实 query，它在这里的作用是把业务说完整，
                  真正接 Claude 流量的是 /chongzhi/claude-pro 与 /chongzhi/claude-max。 */}
              {/* 渠道白标：渠道设了首页大标题就整句用渠道的（docs/多渠道分销-渠道品牌与公告.md）；没设（含主站）渲染原来的两行 */}
              {brand.heroTitle ? (
                <span className="gradient-text">{brand.heroTitle}</span>
              ) : (
                <>
                  <span className="gradient-text">ChatGPT、Claude</span>
                  <br />
                  <span className="gradient-text-accent">充值与代充</span>
                </>
              )}
            </motion.h1>

            {/* 副标题在 xl 提到 2xl(24px)：text-body-lg 最大只到 20px，压在 128px 标题下面显得断层；
                同时放宽到 3xl，让两行文案在宽屏里保持在舒适行长内 */}
            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-body-lg xl:text-2xl max-w-2xl xl:max-w-3xl mx-auto mb-12"
            >
              {/* 渠道设了首页副标题：整段换成渠道的一句话（不带打字机与服务清单）；没设（含主站）原样 */}
              {brand.heroSubtitle ? brand.heroSubtitle : <>
              {/*
                【打字机那一行先把高度占住（B 包评审修复，电脑端）】这一行在窄窗口里会随短语折成 1 行或 2 行，
                而 hero 是 min-h-screen + items-center 垂直居中：每换一句，H1（LCP 元素）、按钮、查询框、卖点整体上下跳，
                真实用户的 CLS 会一直记这笔账（实验室 PSI 通常在第一次换句之前就结束了，看不到）。
                做法：这一行改成单格 grid，::before 用 content:attr(data-reserve) 放一份「前缀 + 最长短语」的隐形副本，
                和真正的打字机叠在同一格，格高 = 两者较高者，任何宽度下都按最长那句占位，换句时高度不变。
                副本走属性 + 伪元素，不进正文文本（爬虫、读屏读不到重复的字；visibility:hidden 也不进无障碍树）；
                pr-[3px] 对应打字机光标的宽度。
                【手机端轻量模式（2026-10-01，main 的做法优先）】触屏设备上不用占位：外层 lite:block、::before lite:hidden，
                轮换的卖点照 main 单独占一行（lite:block + 不换行），句子长短变化同样不会让副标题跳行。
                最长一句约 14 个字宽，320 宽的屏也放得下。
                【开票短语必须带 6%】设计 §9.2-3「写到开票必带 6%」；和全站口径「开票另付 6%」一致（6% 即 lib/invoice.ts 的 TAX_RATE，
                那个文件引了 node:crypto，客户端组件不能 import，这里写字面量）。
              */}
              <span
                className="grid before:col-start-1 before:row-start-1 before:invisible before:pr-[3px] before:content-[attr(data-reserve)] lite:block lite:before:hidden"
                data-reserve={`${HERO_LEAD}${HERO_TYPEWRITER_LONGEST}`}
              >
                <span className="col-start-1 row-start-1">
                  {HERO_LEAD}
                  <span className="gradient-text-accent lite:block lite:w-fit lite:mx-auto lite:whitespace-nowrap">
                    <Typewriter texts={HERO_TYPEWRITER} typeSpeed={150} deleteSpeed={80} pauseTime={2500} />
                  </span>
                </span>
              </span>
              {/* H1 只说宽词，业务的完整面靠这一行列全——漏一项就等于对外少一门生意。
                  加商品时记得回来补（当前：ChatGPT 三档、Claude 两档、接码、KYC、谷歌账号）。
                  上一行已是块级（grid），这里用 block 另起一行，不再需要 <br>（块后面跟 <br> 会多出一个空行） */}
              <span className="block text-white/40">
                ChatGPT Plus / Pro · Claude Pro / Max 5x · 注册接码 · KYC 认证 · 谷歌账号
              </span>
              </>}
            </motion.p>

            <motion.div
              initial={false}
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

            {/* 订单查询入口（凭邮箱查订阅：渠道站关闭，设计 11.1 Q16） */}
            {sfFeatures.lookup && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="mt-10 flex justify-center"
            >
              {/* 订单查询框：手机端 w-full 才够放下这句 placeholder，桌面端不该继续「占满」，
                  但 max-w-md(448px) 在 16px 字号下又会把 placeholder 挤到省略号，
                  所以 md 起给到 lg(512px) 并同步把字号提到 base —— 宽度是为了容纳文案，不是为了铺满 */}
              <form action="/lookup" onSubmit={handleLookup} className="relative w-full max-w-md md:max-w-lg">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-cyan-500/40 rounded-full blur-sm opacity-50" />
                <div className="relative flex items-center gap-1 p-1.5 md:p-2 glass-strong rounded-full">
                  <div className="flex-1 flex items-center gap-2 pl-4">
                    <Mail className="w-4 h-4 md:w-[18px] md:h-[18px] text-white/40 flex-shrink-0" />
                    <input
                      ref={lookupInputRef}
                      type="email"
                      name="email"
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
            )}

            {/* 三个卖点：手机端换行紧排，桌面端拉开间距并整体放大一档，
                让这一排在 1920 宽屏里成为 hero 的「底座」，而不是缩在中间的一行小字 */}
            <motion.div
              initial={false}
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
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            {/* 手机端轻量模式：同款提示，不再无限上下跳（同上面两个装饰框，是停不下来的 JS 动画循环） */}
            {lite ? (
              <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-white/40 rounded-full" />
              </div>
            ) : (
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-2"
              >
                <div className="w-1 h-2 bg-white/40 rounded-full" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/*
        精选服务。
        【为什么不再是卡片墙】2026-10-06 站长明确要求「不要卡片式」。旧版是六张等宽玻璃卡，
        每张自带一圈边框、一条渐变胶囊、一个整块渐变按钮——同样的装饰在一屏里重复六遍，
        真正要看的三件事（叫什么、多少钱、有没有货）反而被压成最小的字号。
        而且库里的商品描述长短相差十倍，卡片高度参差，右下角留着大片空白。
        现在是编辑式清单：一行一个商品，只有发丝级分隔线，没有边框、没有填充色；
        层级交给字号与留白，颜色只在悬停时以一层极淡的渐变出现，六行共用同一条基线。

        【顺带改掉的两处不实信息】旧版给每一个商品都缀「/月」——接码按次计费、谷歌账号是一次性交付，
        它们不是月费；旧版那几个标签（NEW / GPT-4 / o1 ACCESS / ULTIMATE）是按商品名猜出来编的，
        o1 这个型号早就不在售了。现在价格右侧不写计费周期，标签只显示库里真实的分类名与交付方式。
      */}
      {featured.length > 0 && (
      <section className="relative py-24 lg:py-32" aria-labelledby="home-featured-heading">
        <div className="absolute inset-0 grid-bg opacity-50" />

        <div className="container relative z-10">
          {/* lite:!transform-none：手机端轻量模式下不做上滑入场，服务端 HTML 第一帧起就在最终位置（本页下面几处同理） */}
          <motion.div
            initial={{ y: 40 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-10 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between lg:mb-14 lite:!transform-none"
          >
            <div>
              <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/30">
                <span>Featured</span>
                <span className="h-px w-10 bg-white/15" />
              </div>
              <h2 id="home-featured-heading" className="text-headline">
                <span className="gradient-text">精选服务</span>
              </h2>
              <p className="mt-3 text-base text-white/45 lg:text-lg">按累计成交排序，价格与库存为后台实时数据</p>
            </div>

            <Link
              href="/products"
              className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70 transition-colors hover:border-white/35 hover:text-white sm:self-auto"
            >
              查看全部 {stats.skuCount} 个档位
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>

          <ul className="border-t border-white/[0.08]">
            {featured.map((product, index) => {
              const level = stockLevel(product.stock)
              const delivery = deliveryBadge(product.deliveryType ?? undefined)
              return (
                <li key={product.id} className="border-b border-white/[0.08]">
                  <Link href={`/products/${product.id}`} className="group relative block">
                    {/* 悬停时整行透出一层极淡的品牌渐变（同一商品永远同一个色，按 id 取模）。
                        触屏没有悬停、点一下反而会粘住亮着，所以 lite 下整块不要 */}
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -inset-x-4 inset-y-0 rounded-2xl bg-gradient-to-r ${PRODUCT_GRADIENT(
                        product.id
                      )} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.1] lite:hidden`}
                    />

                    <div className="relative flex items-center gap-4 py-5 sm:gap-6 sm:py-7">
                      {/* 行号只在 lg 起出现：手机上横向每一个像素都要留给商品名 */}
                      <span className="hidden w-8 shrink-0 text-sm tabular-nums text-white/20 transition-colors group-hover:text-white/45 lg:block">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <ProductThumb
                        id={product.id}
                        name={product.name}
                        image={product.image}
                        size={64}
                        sizeClass="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                        className="transition-transform duration-500 group-hover:scale-[1.04]"
                      />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-purple-200 sm:text-lg lg:text-xl">
                          {product.name}
                        </h3>
                        {/* 单行截断：库里的描述从 4 个字到 200 个字都有，不截断就会退回旧版那种参差不齐 */}
                        {product.description && (
                          <p className="mt-1 truncate text-xs text-white/35 sm:text-sm">{product.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          {product.categoryName && (
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/45">
                              {product.categoryName}
                            </span>
                          )}
                          <span className={`rounded-full border px-2 py-0.5 ${delivery.cls}`}>{delivery.label}</span>
                          <span className={`rounded-full border px-2 py-0.5 ${STOCK_TONE_CLASS[level.tone]}`}>
                            {level.label}
                          </span>
                          {product.sales > 0 && <span className="text-white/25">已售 {product.sales}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-xl font-bold tabular-nums text-white sm:text-2xl lg:text-[28px]">
                          ￥{product.price.toFixed(0)}
                        </div>
                        {product.originalPrice != null && product.originalPrice > product.price && (
                          <div className="text-xs tabular-nums text-white/25 line-through">
                            ￥{product.originalPrice.toFixed(0)}
                          </div>
                        )}
                      </div>

                      {/* 手机上不占这 40px：那一列在 390 宽的屏幕里会把价格挤到换行 */}
                      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/10 group-hover:text-white sm:flex">
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
      )}

      {/* AI 圈今日热点：内部固定高度 skeleton 占位；接口失败或暂无内容整块静默隐藏，不影响卖货主线 */}
      {sfFeatures.news && <NewsHotSection />}

      {/* IP 工具入口（渠道站关闭） */}
      {sfFeatures.iptools && (
      <section className="relative py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-cyan-500/15 rounded-full blur-[128px] lite-blob" />

        <div className="container relative z-10">
          <motion.div
            initial={{ y: 40 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lite:!transform-none"
          >
            <Link href="/iptools" className="group block">
              <div className="relative glass rounded-3xl p-8 md:p-12 overflow-hidden transition-colors hover:bg-white/[0.07]">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 -z-10 lite:hidden" />

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
      )}

      <section className="py-20 border-t border-white/5">
        <div className="container">
          {/* 数字统计：手机端 gap-12 已经够挤，桌面端把间距和数字都放大一档，
              让这条横向数据带撑住 1280+ 的容器宽度，而不是四个小数字挤在正中 */}
          {/*
            这四个数字原来是「1000+ 服务用户 / 99.9% 成功率 / 24/7 客服支持 / 10min 极速开通」，
            四个里有三个编不出依据：1000 是拍的、99.9% 没有任何口径、
            「10 分钟开通」对年费档、接码档、KYC 代办全都不成立（那几档本来就要人工或等短信）。
            这不只是 SEO 问题——「最快 10 分钟到账」写在页面上而实际做不到，是可被投诉的表述。
            换成库里真能查到的两个数，宁可少两块。
          */}
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 xl:gap-28 text-white/20">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                <CountUp end={stats.totalSales} duration={2000} suffix="+" />
              </div>
              <div className="text-sm lg:text-base">累计成交</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                <CountUp end={stats.skuCount} duration={1600} />
              </div>
              <div className="text-sm lg:text-base">在售档位</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              {/* 这一条是真的：卡密付款后即时发放，兑换由买家自己发起，不受客服上下班限制 */}
              <div className="text-4xl lg:text-5xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm lg:text-base">自助兑换</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        {/* 手机端轻量模式：lite-blob 的 scale: 1.5 作用在 transform 之外，会把 -translate-x-1/2 一起放大成 -75%、光斑偏到左边；
            轻量模式下改用独立的 translate 属性居中（它排在 scale 外层，不会被放大） */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/20 rounded-full blur-[128px] lite-blob lite:!transform-none lite:[translate:-50%_0]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center lite:!transform-none"
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
