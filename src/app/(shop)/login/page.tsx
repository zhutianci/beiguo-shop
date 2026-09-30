'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, Sparkles } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { setToken } from '@/lib/auth-token'
import { safeRedirect, withRedirect } from '@/lib/safe-redirect'
import { useHydrated } from '@/lib/use-hydrated'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // 只收站内相对路径：原样 router.push 外部值是开放重定向，javascript: 还会在本站执行脚本
  const redirect = safeRedirect(searchParams.get('redirect'))
  const { setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  /*
   * 【水合前填的字要接住（首帧可见的配套，2026-10-01）】卡片现在水合前就看得见、能输入（见下方 motion.div 的注释），
   * iPhone 慢网下这段可能有 10~40 秒。这时打的字、钥匙串自动填充的账号密码只在 DOM 里：React 水合不改输入框的值、
   * 也不补发 onChange，state 还是空的——不接住的话点登录提交的是空表单，而且下一次重渲染会把输入框清空。
   * 所以：挂载后把 DOM 里已有的值抄进 state；水合完成前登录按钮禁用（服务端与水合那一轮都是禁用，不会不一致；
   * 回车隐式提交也一起挡住），免得原生表单提交把页面刷新成 /login?、丢掉 ?redirect=。
   * 输入框不要加 name：表单没有 method=post，原生 GET 提交会把密码带进地址栏和访问日志。
   */
  const hydrated = useHydrated()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const email = emailRef.current?.value || ''
    const password = passwordRef.current?.value || ''
    if (email || password) {
      setFormData((f) => ({ ...f, email: email || f.email, password: password || f.password }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || '登录失败')
        return
      }

      setToken(data.data.token || null)
      setUser(data.data.user)
      router.push(redirect)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      {/* 背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {/* lite-blob：手机端轻量模式（2026-10-01，站长要求电脑端不变）下大模糊光斑换成渐变遮罩（iOS WebKit 画大模糊太贵，滑动出黑块），规则见 globals.css 末尾 */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[128px] lite-blob pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />

      {/* 【首帧可见 · iPhone「打不开」（2026-09-30）】这层包着整张登录卡片，原来 initial={{ opacity: 0, y: 20 }}：
          服务端 HTML 里整张卡是 opacity:0，iPhone 上的 Safari / Chrome 走 HTTPS（大陆移动网络）时 JS 常晚到 10~40 秒，
          这段时间登录页就是空的。initial={false}（下面的图标同理）：服务端直接按最终状态输出，只少了入场动画 */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* 发光边框 */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-sm opacity-50" />

        <div className="relative glass rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">欢迎回来</h1>
            <p className="text-white/50 text-sm">登录你的账号继续使用</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  ref={emailRef}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  ref={passwordRef}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            <div className="text-right -mt-1">
              <Link href="/forgot-password" className="text-xs text-white/50 hover:text-purple-300 transition-colors">
                忘记密码？
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !hydrated}
              className="group w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-white/30">或</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* 注册链接 */}
          <p className="text-center text-white/50 text-sm">
            还没有账号？
            {/* 注册也带回跳（docs/短信接码-设计.md §6.6 第 30 条）：接码的主力客群是没有账号的首次访客，注册成功后回到确认面板 */}
            <Link href={withRedirect('/register', redirect)} className="ml-1 text-purple-400 hover:text-purple-300 transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
