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
  Ticket,
  BookUser,
  Gift,
  Loader2,
  X,
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import { useHydrated } from '@/lib/use-hydrated'
import AccountBindings from '@/components/account-bindings'
import MarketingSubscription from '@/components/marketing-subscription'
import { useStorefront } from '@/components/storefront-provider'
// 只取类型：vip-server 带 prisma，值导入会把它打进前端包
import type { OverviewDTO, PlatformOverviewDTO } from '@/lib/vip-server'

/**
 * /api/account/overview 的返回（WP2 定义，按店面两种形状）。金额是 number（服务端已把 Decimal 转好）。
 *  · 主站：{ balance, vip, stats: { paidOrderCount, totalSpent, availableCoupons } }（与改造前相同）
 *  · 渠道站：{ stats: { paidOrderCount, totalSpent } }——余额、会员、券、内推在渠道站全关（设计 7.6），字段本身不下发
 */
type Overview = OverviewDTO

/** 有 vip 字段的是主站形状（与 lib/vip-server 的 isPlatformOverview 同一判据；那边是值导出，这里不能 import） */
function platformOverview(o: Overview | null): PlatformOverviewDTO | null {
  return o && 'vip' in o ? o : null
}

/** 统计格里放不下 ¥123456.78 这种长数字（375px 下一格只有 80px 左右），过万按「万」显示 */
function shortMoney(n: number): string {
  if (n >= 10000) return `${Number((n / 10000).toFixed(2))}万`
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

/**
 * 数字越长字号越小，保证 375px 上 ¥1234.56 这类值不被截断。
 * 行高单独写死：三格字号可能不同，行高跟着字号走的话三个数会上下错开
 */
function statSize(text: string): string {
  const size = text.length > 6 ? 'text-lg sm:text-2xl lg:text-3xl' : 'text-2xl sm:text-3xl lg:text-4xl'
  return `${size} leading-8 sm:leading-9 lg:leading-10`
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, logout } = useUserStore()
  /*
   * 渠道分站（设计 11.2、实施分包 WP1）：渠道站的个人中心不渲染余额、会员、券、推荐有奖、账户绑定、营销订阅——
   * 这些模块在渠道站服务端关闭（接口 404），留着入口会产生 404 请求（验收 W1-9）。主站 features 全开，渲染结果不变。
   */
  const { kind: storefrontKind, features } = useStorefront()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  // 等挂载后再判断登录态：水合那一次渲染里 user 恒为 null，直接判会把已登录的人踢去登录页
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.push('/login?redirect=/profile')
      return
    }
    setFormData({
      nickname: user.nickname || '',
      phone: user.phone || '',
    })
  }, [hydrated, user, router])

  // 等级与统计每次进页面现拉：本地持久化的 user 里没有这些数，有也可能是旧的
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let alive = true
    setOverviewLoading(true)
    fetch('/api/account/overview')
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.success) setOverview(d.data)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setOverviewLoading(false)
      })
    return () => {
      alive = false
    }
  }, [userId])

  if (!hydrated || !user) return null

  // 主站形状才有余额 / 会员 / 券；渠道站形状只有本站订单统计
  const platformOv = platformOverview(overview)

  const startEdit = () => {
    setFormData({ nickname: user.nickname || '', phone: user.phone || '' })
    setSaveError('')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setSaveError('')
    setIsEditing(false)
  }

  /*
   * 此前这里只改了本地 store，刷新后 header 拉 /api/auth/me 就把旧值盖回来 —— 等于没存。
   * 现在走 PATCH /api/account/profile，以服务端返回为准回写 store。
   * 手机号不在这里改：站上没有短信验证，开放自助绑定会被人占用别人的号码（理由见 api/account/profile）。
   */
  const handleSave = async () => {
    const nickname = formData.nickname.trim()
    const body: { nickname?: string } = {}
    if (nickname !== (user.nickname || '')) body.nickname = nickname
    if (Object.keys(body).length === 0) {
      setIsEditing(false)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!d.success) {
        setSaveError(d.error || '保存失败')
        return
      }
      setUser({ ...user, ...d.data })
      setIsEditing(false)
    } catch {
      setSaveError('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  // 6 项正好两行 × 3 列。推荐有奖紧跟「我的订单」：它是新入口，也是除买东西外唯一能让余额变多的地方。
  // 带 feature 的项只在该模块开着的店面出现（渠道站只剩「我的订单」「抬头管理」）
  const allMenuItems = [
    {
      icon: ShoppingBag,
      label: '我的订单',
      desc: '查看历史订单',
      href: '/orders',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Gift,
      label: '推荐有奖',
      desc: '分享链接赚返现',
      href: '/profile/referral',
      gradient: 'from-rose-500 to-red-500',
      show: features.referral,
    },
    {
      icon: Wallet,
      label: '账户余额',
      desc: platformOv ? `余额 ¥${platformOv.balance.toFixed(2)}` : '查看余额详情',
      href: '/wallet',
      gradient: 'from-cyan-500 to-blue-500',
      show: features.wallet,
    },
    {
      icon: Ticket,
      label: '我的优惠券',
      desc: '查看可用的券',
      href: '/coupons',
      gradient: 'from-emerald-500 to-teal-500',
      show: features.coupon,
    },
    {
      icon: BookUser,
      label: '抬头管理',
      desc: '开票抬头一键填',
      href: '/profile/invoice-titles',
      gradient: 'from-sky-500 to-indigo-500',
    },
    {
      icon: Crown,
      label: '会员中心',
      desc: '等级与权益',
      href: '/vip',
      gradient: 'from-amber-500 to-orange-500',
      show: features.vip,
    },
  ]
  const menuItems = allMenuItems.filter((item) => item.show !== false)

  return (
    <div className="min-h-screen page-top pb-20">
      {/* 背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* xl 起放宽到 6xl：右侧信息栏内容很长，1440px 上多出来的宽度能明显减少纵向滚动 */}
      <div className="container relative max-w-5xl xl:max-w-6xl">
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

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 用户信息卡片。
              lg 起吸顶：右栏（账户信息 + 快捷功能 + 绑定 + 统计）在桌面端很长，
              头像卡跟着滚走的话，退出登录等操作就得滚回顶部。
              grid 子项默认 stretch 会让 sticky 失效，所以要配 lg:self-start。 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 lg:sticky lg:top-28 lg:self-start"
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

                {/* 会员等级：此前写死「普通用户」，现在取 /api/account/overview 的真实档位（渠道站不渲染：会员在渠道站关闭） */}
                {features.vip && (
                <div className="mb-6">
                  <Link
                    href="/vip"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:border-amber-400/50 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    {platformOv ? (
                      platformOv.vip.name
                    ) : overviewLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      '会员中心'
                    )}
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </Link>
                  {platformOv?.vip.nextName && (
                    <p className="mt-2 text-xs text-white/40">
                      再消费 ¥{platformOv.vip.remaining.toFixed(2)} 升级为{platformOv.vip.nextName}
                    </p>
                  )}
                </div>
                )}

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

          {/* 右侧内容：账户信息 → 快捷功能 → 绑定账户 → 账户统计 → 邮件订阅。
              内推面板已移到「推荐有奖」页，这里只在快捷功能里留入口 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 账户信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-xl lg:text-2xl font-bold">账户信息</h2>
                {!isEditing ? (
                  <button
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/10 text-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass hover:bg-white/10 text-sm transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      保存
                    </button>
                  </div>
                )}
              </div>

              {saveError && (
                <p className="-mt-2 mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {saveError}
                </p>
              )}

              {/*
                三个字段在桌面端右栏（约 640-720px 宽）单列铺开会又长又空，
                lg 起改两列：邮箱整行、昵称与手机号并排。
                space-y 与 grid gap 会叠加，所以 lg 下把 space-y 归零。
              */}
              <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                <div className="lg:col-span-2">
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
                        maxLength={20}
                        className="min-w-0 flex-1 bg-transparent outline-none text-white placeholder:text-white/30"
                        placeholder="请输入昵称（最多 20 字）"
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
                  {/* 只读：没有短信验证就不开放自助绑定（见 api/account/profile 的注释），需要登记请联系客服 */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <Phone className="w-4 h-4 text-white/40" />
                    <span className="text-white/80">{user.phone || '未绑定'}</span>
                    {isEditing && <span className="ml-auto text-xs text-white/35">如需登记请联系客服</span>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 快捷功能。位置紧跟账户信息 —— 这几个入口是买家最常点的，
                排在绑定/统计这些低频块后面会让人以为个人中心只有一堆设置项 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-5">快捷功能</h2>
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
                          <div className="text-xs lg:text-[13px] text-white/40">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* 内推面板 2026-09-24 起移到独立的「推荐有奖」页（/profile/referral），这里只留快捷入口 */}

            {/* 绑定账户管理（渠道站关闭：设计 11.1 Q16） */}
            {features.bindings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <AccountBindings />
            </motion.div>
            )}

            {/* 账户统计 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass rounded-3xl p-8"
            >
              <h2 className="text-xl lg:text-2xl font-bold mb-6">账户统计</h2>
              {/* 此前三个数写死 0 / ¥0 / 0，「活跃订阅」也没有任何数据来源。
                  现在与会员等级同一口径：已付款且未取消的订单，金额是商品货款（不含开票税费） */}
              {overviewLoading && !overview ? (
                <div className="flex justify-center py-6 text-white/30">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : !overview ? (
                <p className="py-6 text-center text-sm text-white/40">统计加载失败，请刷新重试</p>
              ) : (
                <>
                  {/* 渠道站没有「可用优惠券」这一格（券在渠道站关闭），两格排开 */}
                  <div className={`grid ${platformOv && features.coupon ? 'grid-cols-3' : 'grid-cols-2'} gap-3 sm:gap-6`}>
                    <div className="text-center min-w-0">
                      <div
                        className={`${statSize(String(overview.stats.paidOrderCount))} font-bold tabular-nums gradient-text-accent mb-1 truncate`}
                      >
                        {overview.stats.paidOrderCount}
                      </div>
                      <div className="text-sm lg:text-[15px] text-white/50">已付款订单</div>
                    </div>
                    <div className={`text-center min-w-0 ${platformOv && features.coupon ? 'border-x' : 'border-l'} border-white/10 px-1`}>
                      <div
                        className={`${statSize(`¥${shortMoney(overview.stats.totalSpent)}`)} font-bold tabular-nums gradient-text-accent mb-1 truncate`}
                      >
                        ¥{shortMoney(overview.stats.totalSpent)}
                      </div>
                      <div className="text-sm lg:text-[15px] text-white/50">累计消费</div>
                    </div>
                    {platformOv && features.coupon && (
                    <Link href="/coupons" className="block text-center min-w-0 group">
                      <div
                        className={`${statSize(String(platformOv.stats.availableCoupons))} font-bold tabular-nums gradient-text-accent mb-1 truncate`}
                      >
                        {platformOv.stats.availableCoupons}
                      </div>
                      <div className="text-sm lg:text-[15px] text-white/50 group-hover:text-white/70 transition-colors">
                        可用优惠券
                      </div>
                    </Link>
                    )}
                  </div>
                  <p className="mt-5 text-center text-xs text-white/35">累计消费按商品金额计算，不含开票税费</p>
                </>
              )}
            </motion.div>

            {/* 邮件订阅（营销邮件的开关 / 主题 / 暂停）。低频设置，放在最后；
                退订在邮件底部也能一键完成，这里是给想「少收一点」或想恢复的人用的 */}
            {/* 营销邮件是平台专属（设计 11.3），渠道站不渲染 */}
            {storefrontKind === 'PLATFORM' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <MarketingSubscription />
            </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
