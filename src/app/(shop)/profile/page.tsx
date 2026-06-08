'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Edit3,
  ShoppingBag,
  Wallet,
  Crown,
  LogOut,
  ChevronRight,
  Sparkles,
  Save,
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import AccountBindings from '@/components/account-bindings'
import ReferralPanel from '@/components/referral-panel'

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, logout } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    setFormData({
      nickname: user.nickname || '',
      phone: user.phone || '',
    })
  }, [user, router])

  if (!user) return null

  const handleSave = () => {
    setUser({
      ...user,
      nickname: formData.nickname,
      phone: formData.phone,
    })
    setIsEditing(false)
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      label: '我的订单',
      desc: '查看历史订单',
      href: '/orders',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Wallet,
      label: '账户余额',
      desc: '查看余额详情',
      href: '/wallet',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Crown,
      label: '会员中心',
      desc: '升级专享特权',
      href: '/vip',
      gradient: 'from-amber-500 to-orange-500',
    },
  ]

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* 背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative max-w-5xl">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">个人中心</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">你好，</span>
            <span className="gradient-text-accent">{user.nickname || '朋友'}</span>
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 用户信息卡片 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-30 blur-md" />

              <div className="relative glass rounded-3xl p-8 text-center">
                {/* 头像 */}
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold mx-auto">
                    {(user.nickname || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-xl font-bold mb-1">{user.nickname || '未设置昵称'}</h3>
                <p className="text-sm text-white/40 mb-6">{user.email}</p>

                {/* VIP 标签 */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium mb-6">
                  <Crown className="w-3.5 h-3.5" />
                  普通用户
                </div>

                {/* 退出登录 */}
                <button
                  onClick={() => {
                    logout()
                    router.push('/')
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-white/60 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          </motion.div>

          {/* 右侧内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 账户信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">账户信息</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/10 text-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium"
                  >
                    <Save className="w-3.5 h-3.5" />
                    保存
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-white/50 mb-2">邮箱</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span className="text-white/80">{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/50 mb-2">昵称</label>
                  {isEditing ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50">
                      <User className="w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30"
                        placeholder="请输入昵称"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                      <User className="w-4 h-4 text-white/40" />
                      <span className="text-white/80">{user.nickname || '未设置'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-white/50 mb-2">手机号</label>
                  {isEditing ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50">
                      <Phone className="w-4 h-4 text-white/40" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30"
                        placeholder="请输入手机号"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                      <Phone className="w-4 h-4 text-white/40" />
                      <span className="text-white/80">{user.phone || '未绑定'}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 内推 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <ReferralPanel />
            </motion.div>

            {/* 绑定账户管理 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <AccountBindings />
            </motion.div>

            {/* 快捷功能 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-4">快捷功能</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {menuItems.map((item, i) => (
                  <Link key={i} href={item.href}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group relative glass rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium mb-1">{item.label}</div>
                          <div className="text-xs text-white/40">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* 账户统计 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass rounded-3xl p-8"
            >
              <h2 className="text-xl font-bold mb-6">账户统计</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text-accent mb-1">0</div>
                  <div className="text-sm text-white/50">总订单</div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-3xl font-bold gradient-text-accent mb-1">¥0</div>
                  <div className="text-sm text-white/50">累计消费</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text-accent mb-1">0</div>
                  <div className="text-sm text-white/50">活跃订阅</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
