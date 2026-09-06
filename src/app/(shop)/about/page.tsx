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
    desc: '最快10分钟完成开通，不让你等待',
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

const stats = [
  { value: '1000+', label: '服务用户' },
  { value: '99.9%', label: '成功率' },
  { value: '24/7', label: '客服支持' },
  { value: '10min', label: '极速开通' },
]

const team = [
  { name: 'AI 专家团队', role: '资深技术团队', desc: '深耕 AI 领域多年' },
  { name: '客服团队', role: '7×12 小时在线', desc: '专业贴心服务' },
  { name: '运营团队', role: '高效响应', desc: '快速解决问题' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
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
              <div className="text-4xl md:text-5xl font-bold gradient-text-accent mb-2">
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
                成为中国最值得信赖的 AI 服务平台，
                贝果科技以专业、安全、高效的服务，助力每一位用户拥抱 AI 时代。
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
              <span className="gradient-text">专业团队</span>
            </h2>
            <p className="text-white/50 lg:text-lg">为你提供优质服务</p>
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
