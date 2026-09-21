'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Zap, Heart, Users, Award, Target } from 'lucide-react'

const values = [
  {
    icon: Shield,
    title: '安全可靠',
    desc: '所有服务通过正规渠道，账号安全有保障',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Zap,
    title: '极速响应',
    desc: '卡密档付款后即时发放，兑换由你自己发起',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Heart,
    title: '用心服务',
    desc: '7×12小时专属客服，售后无忧',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Award,
    title: '品质保障',
    desc: '长期稳定运营，持续优化服务质量',
    gradient: 'from-cyan-500 to-blue-500',
  },
]

/*
 * 这四个数字原来是「1000+ 服务用户 / 99.9% 成功率 / 24/7 客服支持 / 10min 极速开通」，
 * 没有一个能拿出依据。一个卖 AI 会员的站，买家最大的顾虑就是「会不会被骗」，
 * 而一个关于页上摆着四个编出来的数字，恰好是最容易被识破、也最伤信任的东西。
 * 换成可核验的：经营主体是公开可查的，交付方式和收款方式是页面上就能验证的。
 * 累计成交数不写死在这里——它在首页和各落地页由库里实时取，两处写死迟早会打架。
 */
const stats = [
  { value: '持照经营', label: '益阳市赫山区必高科技有限公司' },
  { value: '卡密交付', label: '账号始终在你自己手里' },
  { value: '支付宝', label: '人民币付款，无需境外支付方式' },
  { value: '可开票', label: '增值税发票与收据（税费另付 6%）' },
]

/*
 * 原来这里是「AI 专家团队 / 资深技术团队 / 深耕 AI 领域多年」三个虚构的团队卡片。
 * 这种东西对这个品类是净负资产：买家点开关于页就是来查你是不是骗子的，
 * 看到三张没有名字、没有任何可核验信息的「团队」卡片，只会更怀疑。
 * 换成这个站真正能说清楚、且买家真正关心的三件事。
 */
const team = [
  { name: '我们做什么', role: '转售 AI 会员充值卡密', desc: '你在本站付人民币，拿到兑换码自己充，全程不用交出账号' },
  { name: '我们不做什么', role: '不代管账号、不保证不封号', desc: '封号不在质保范围内，这一条写在每个商品页和服务条款里' },
  { name: '出了问题找谁', role: '站内工单与客服微信', desc: '订单号可查，经营主体可核验，退款规则公开写在服务条款' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen page-top pb-20">
      {/* 背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-20 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">关于我们</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
            <span className="gradient-text">贝果科技</span>
            <br />
            <span className="gradient-text-accent">让 AI 触手可及</span>
          </h1>
          {/* 导语在桌面端提到 20px：hero 标题已经 72px，17px 的导语会被压得没有存在感 */}
          <p className="text-white/50 text-lg lg:text-xl leading-relaxed lg:leading-[1.8]">
            贝果科技致力于为中国用户提供便捷、安全、可靠的 AI 订阅服务
            <br />
            让每个人都能轻松享受 AI 带来的便利
          </p>
        </motion.div>

        {/* 数据 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center"
            >
              {/* 这四格从「数字 + 标签」改成了「事实 + 说明」，字号要跟着降一档：
                  48px 对四个汉字来说在手机端两列布局里会顶格 */}
              <div className="text-2xl md:text-3xl font-bold gradient-text-accent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* 使命愿景 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-6 mb-32"
        >
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-50 blur-md transition-opacity" />
            <div className="relative glass rounded-3xl p-10 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">我们的使命</h3>
              {/* 卡片在 lg 下约 600px 宽，17px 正文≈35 字/行，正好落在舒适区 */}
              <p className="text-white/60 leading-relaxed lg:text-[17px] lg:leading-[1.9]">
                打破地域和支付的壁垒，让每一位用户都能便捷地享受全球顶尖的 AI 服务，
                推动 AI 技术在中国的普及和应用。
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-50 blur-md transition-opacity" />
            <div className="relative glass rounded-3xl p-10 h-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">我们的愿景</h3>
              <p className="text-white/60 leading-relaxed lg:text-[17px] lg:leading-[1.9]">
                把「谁来付这笔美元」和「谁在用这个账号」拆开，
                让没有境外支付方式的人也能用上这些服务——用人民币，用自己的账号。
              </p>
            </div>
          </div>
        </motion.div>

        {/* 核心价值 */}
        <div className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-headline mb-4">
              <span className="gradient-text">核心价值</span>
            </h2>
            <p className="text-white/50 lg:text-lg">我们坚持的服务理念</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative"
              >
                <div className={`absolute -inset-[1px] bg-gradient-to-r ${value.gradient} rounded-2xl opacity-0 group-hover:opacity-30 blur-md transition-opacity`} />
                <div className="relative glass rounded-2xl p-6 hover-lift h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-4`}>
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg lg:text-xl mb-2">{value.title}</h3>
                  {/* 四列卡片在 lg 下单列约 280px，14px 说明文字偏小，提到 15px 并放开行高 */}
                  <p className="text-sm lg:text-[15px] text-white/50 lg:leading-[1.75]">{value.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 团队 */}
        <div className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-headline mb-4">
              <span className="gradient-text">下单前该知道的三件事</span>
            </h2>
            <p className="text-white/50 lg:text-lg">包括我们不做什么</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg lg:text-xl mb-1">{member.name}</h3>
                <p className="text-sm lg:text-[15px] text-purple-400 mb-3">{member.role}</p>
                <p className="text-sm lg:text-[15px] text-white/50">{member.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl opacity-30 blur-xl" />
          <div className="relative glass rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-white/50 lg:text-lg mb-8 max-w-xl mx-auto">
              选择适合你的 AI 订阅服务，开启智能新时代
            </p>
            <Link href="/products">
              <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all">
                浏览服务
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
