'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Headphones,
  Sparkles,
  Search,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Bug,
  Shield,
  Mail,
  ChevronDown,
  ArrowRight,
  MessageCircle,
  Clock,
  CheckCircle2,
  Megaphone,
} from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'

interface ServiceCard {
  icon: typeof Search
  title: string
  desc: string
  color: string
  action: 'link' | 'modal' | 'anchor'
  href?: string
  anchor?: string
}

const services: ServiceCard[] = [
  {
    icon: Search,
    title: '订阅查询',
    desc: '输入邮箱即可查看你的订阅类型、开通日期、到期时间和剩余天数',
    color: 'from-purple-500 to-pink-500',
    action: 'link',
    href: '/lookup',
  },
  {
    icon: RefreshCw,
    title: '续费 / 续订',
    desc: '订阅即将到期？联系客服快速续费，无缝衔接不中断',
    color: 'from-cyan-500 to-blue-500',
    action: 'modal',
  },
  {
    icon: BookOpen,
    title: '使用教程',
    desc: 'Claude / ChatGPT 登录、模型选择、常见操作图文指南',
    color: 'from-amber-500 to-orange-500',
    action: 'anchor',
    anchor: 'guides',
  },
  {
    icon: HelpCircle,
    title: '常见问题',
    desc: '登录失败、账号掉线、套餐切换等高频问题与解答',
    color: 'from-emerald-500 to-teal-500',
    action: 'anchor',
    anchor: 'faq',
  },
  {
    icon: Bug,
    title: '故障反馈',
    desc: '账号无法使用、扣费异常等问题请联系客服，承诺 1 小时内响应',
    color: 'from-red-500 to-rose-500',
    action: 'modal',
  },
  {
    icon: Shield,
    title: '账号安全',
    desc: '密码重置、二次验证、账号迁移等敏感问题需人工协助',
    color: 'from-indigo-500 to-violet-500',
    action: 'modal',
  },
]

interface FAQItem {
  q: string
  a: string
}

const faqs: FAQItem[] = [
  {
    q: '刚刚下单了，为什么查询不到订单？',
    a: '订单录入存在一定延迟（通常 1~24 小时）。如果超过 24 小时仍未查询到，请联系客服微信 GenuineMarxist，并提供下单时使用的邮箱、付款截图。',
  },
  {
    q: '账户突然无法登录怎么办？',
    a: '请先检查：(1) 网络是否能访问对应服务；(2) 是否在多端同时登录被踢出；(3) 浏览器 Cookie/缓存。如以上都正常，联系客服反馈，我们会在第一时间排查处理。',
  },
  {
    q: '订阅到期前会有提醒吗？',
    a: '到期前 7 天起，状态会显示「即将到期」黄色提示。你也可以随时在「订阅查询」页面查看剩余天数。建议提前 3 天联系客服续费，避免断服。',
  },
  {
    q: '可以更换订阅套餐吗（如 MAX 5x → MAX 20x）？',
    a: '可以。联系客服说明诉求，我们会按剩余天数折算差价。换套餐需要等当期到期后或补差立即生效，两种方案均支持。',
  },
  {
    q: '一个账号可以多设备同时使用吗？',
    a: 'Claude 和 ChatGPT 官方均允许同一账号多端登录，但同一时刻活跃会话有限制。建议手机 + 电脑同时登录，避免开多个浏览器窗口。',
  },
  {
    q: '出现「Too many requests」/ 速率限制怎么办？',
    a: '这是官方对短时间高频请求的限制，等待 5~10 分钟通常自动恢复。如频繁出现，可能是套餐档位偏低，建议升级到 MAX 20x。',
  },
  {
    q: '账号会不会被官方封禁？',
    a: '我们使用的均为正规渠道注册的合规账号，正常使用不会被封。请勿用于违法用途、批量爬取、自动化脚本等行为。如因不当使用导致封号，需重新购买。',
  },
  {
    q: '到期之后我的对话历史还在吗？',
    a: '对话历史保存在你登录的账户中。若续费同一账号，历史完整保留；若更换账号则不可携带，建议提前导出重要对话。',
  },
]

interface Guide {
  title: string
  product: string
  steps: string[]
}

const guides: Guide[] = [
  {
    product: 'Claude',
    title: '首次登录 Claude Pro / MAX',
    steps: [
      '打开 claude.ai，点击右上角 Sign In',
      '选择「Continue with Email」，输入我们发给你的邮箱',
      '查看邮箱接收 6 位验证码（注意检查垃圾邮件）',
      '输入验证码完成登录，进入聊天界面即可使用',
    ],
  },
  {
    product: 'Claude',
    title: '切换不同模型（Sonnet / Opus）',
    steps: [
      '在聊天页面顶部点击当前模型名称',
      '在下拉菜单中选择 Sonnet 4.6 或 Opus 4.7',
      'MAX 套餐用户可使用全部模型，Pro 用户仅 Sonnet',
    ],
  },
  {
    product: 'ChatGPT',
    title: '首次登录 ChatGPT Plus / Pro',
    steps: [
      '打开 chatgpt.com，点击 Log In',
      '输入我们提供的邮箱，按提示完成验证',
      '若提示需要二次验证，请截图发给客服协助处理',
      '登录成功后即可使用 GPT-4、GPT-5 等高级模型',
    ],
  },
  {
    product: 'ChatGPT',
    title: '使用 GPTs 与高级数据分析',
    steps: [
      '左侧菜单点击「Explore GPTs」浏览市场',
      '聊天输入框点击「+」上传图片、PDF、Excel',
      'Pro 用户支持 Sora 视频生成、深度研究等独享功能',
    ],
  },
]

export default function SupportPage() {
  const [contactOpen, setContactOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [activeProduct, setActiveProduct] = useState<'Claude' | 'ChatGPT'>('Claude')
  const router = useRouter()
  const [quickEmail, setQuickEmail] = useState('')
  const faqRef = useRef<HTMLDivElement>(null)
  const guidesRef = useRef<HTMLDivElement>(null)

  const handleServiceClick = (s: ServiceCard) => {
    if (s.action === 'link' && s.href) {
      router.push(s.href)
    } else if (s.action === 'modal') {
      setContactOpen(true)
    } else if (s.action === 'anchor' && s.anchor) {
      const target = s.anchor === 'faq' ? faqRef.current : guidesRef.current
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickEmail.trim()) {
      router.push(`/lookup?email=${encodeURIComponent(quickEmail.trim())}`)
    } else {
      router.push('/lookup')
    }
  }

  const filteredGuides = guides.filter((g) => g.product === activeProduct)

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Headphones className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">客户服务中心</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">购买之后，</span>
            <span className="gradient-text-accent">我们继续陪伴</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            从订阅查询到故障处理，从续费提醒到使用指南 —— 全流程为老客户提供持续保障
          </p>
        </motion.div>

        {/* 公告条 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 flex items-center gap-3 p-4 rounded-2xl glass border border-amber-500/20"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="flex-1 text-sm">
            <span className="text-amber-300 font-semibold mr-2">服务公告</span>
            <span className="text-white/70">客服在线时间 9:00~22:00，紧急问题请微信留言，会在第一时间处理。</span>
          </div>
        </motion.div>

        {/* 快速查询 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-12"
        >
          <form onSubmit={handleQuickLookup}>
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-md opacity-30" />
              <div className="relative flex items-center gap-2 p-2 glass-strong rounded-2xl">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Mail className="w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    placeholder="快速查询订阅状态：输入你的账户邮箱"
                    className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-white/30 py-3"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
                >
                  <Search className="w-4 h-4" />
                  查询
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* 6 个服务卡片 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">服务列表</h2>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>共 {services.length} 项服务</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <motion.button
                key={s.title}
                onClick={() => handleServiceClick(s)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="relative group text-left"
              >
                <div className={`absolute -inset-[1px] bg-gradient-to-br ${s.color} rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity`} />
                <div className="relative h-full glass rounded-2xl p-6 hover:bg-white/[0.04] transition-colors">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} mb-4`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-medium gradient-text-accent">
                    立即前往
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 使用教程 */}
        <motion.div
          ref={guidesRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-400" />
              使用教程
            </h2>
            <div className="flex p-1 glass rounded-full">
              {(['Claude', 'ChatGPT'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActiveProduct(p)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    activeProduct === p
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence mode="wait">
              {filteredGuides.map((g, i) => (
                <motion.div
                  key={`${activeProduct}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative group"
                >
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-md opacity-20" />
                  <div className="relative glass rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4">{g.title}</h3>
                    <ol className="space-y-3">
                      {g.steps.map((step, j) => (
                        <li key={j} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                            {j + 1}
                          </span>
                          <span className="text-white/70 leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          ref={faqRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 scroll-mt-24"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
            常见问题
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${open ? 'text-emerald-400' : 'text-white/30'}`} />
                      <span className={`font-medium ${open ? 'text-white' : 'text-white/80'}`}>{faq.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ml-3 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pl-12 text-sm text-white/60 leading-relaxed">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* 底部联系 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-lg opacity-30" />
          <div className="relative glass-strong rounded-3xl p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-5">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3">没找到你需要的答案？</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              微信扫码或搜索 <span className="font-mono text-purple-400">GenuineMarxist</span>，专属客服 1 对 1 服务
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                联系客服
              </button>
              <Link
                href="/lookup"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass hover:bg-white/10 font-semibold transition-colors"
              >
                <Search className="w-4 h-4" />
                查询订阅
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/40">
              <Clock className="w-4 h-4" />
              <span>服务时间 9:00 - 22:00 · 紧急问题留言会被尽快回复</span>
            </div>
          </div>
        </motion.div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
