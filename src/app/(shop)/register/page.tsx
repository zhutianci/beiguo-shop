'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, User, Sparkles, ShieldCheck } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { setToken } from '@/lib/auth-token'
import { useStorefront } from '@/components/storefront-provider'
import { safeRedirect, withRedirect } from '@/lib/safe-redirect'
import { useHydrated } from '@/lib/use-hydrated'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useUserStore()
  // 营销邮件是平台专属（设计 11.3）：渠道站不发、个人中心也不渲染订阅开关，注册页就不能写「可能发优惠信息、可在个人中心退订」。
  // 没有 Provider 时回退为主站（storefront-provider.tsx），主站渲染与原来逐字相同
  const isPlatform = useStorefront().kind === 'PLATFORM'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    code: '',
  })
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [codeMsg, setCodeMsg] = useState('')

  /*
   * 【水合前填的字要接住（首帧可见的配套，2026-10-01）】表单现在水合前就看得见、能输入（见下方 motion.div 的注释），
   * iPhone 慢网下这段可能有 10~40 秒。这时打的字、自动填充的值只在 DOM 里：React 水合不改输入框的值、也不补发 onChange，
   * state 还是空的——不接住的话「发送验证码」会说邮箱不对、「创建账号」提交空表单，下一次重渲染还会把输入框清空。
   * 所以：挂载后把 DOM 里已有的值抄进 state；水合完成前两个按钮禁用（服务端与水合那一轮都是禁用，不会不一致；
   * 回车隐式提交也一起挡住），免得原生表单提交把页面刷新成 /register?、丢掉 ?redirect=。
   * 输入框不要加 name：表单没有 method=post，原生 GET 提交会把密码带进地址栏和访问日志。
   */
  const hydrated = useHydrated()
  const emailRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const nicknameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const refs = { email: emailRef, code: codeRef, nickname: nicknameRef, password: passwordRef, confirmPassword: confirmPasswordRef }
    const typed: Partial<Record<keyof typeof refs, string>> = {}
    for (const k of Object.keys(refs) as (keyof typeof refs)[]) {
      const v = refs[k].current?.value
      if (v) typed[k] = v
    }
    if (Object.keys(typed).length > 0) setFormData((f) => ({ ...f, ...typed }))
  }, [])

  /*
   * 注册成功后的回跳（docs/短信接码-设计.md §6.6 第 30 条、D24）：登录页的「注册」链接带着同一个 redirect
   * （例如 /jiema?s=…&c=…&confirm=1），注册成功按 safeRedirect(redirect) 跳转（只收站内相对路径，防开放重定向），
   * 没有 redirect 时回首页（与改造前相同）。挂载后从地址栏读，不用 useSearchParams（免得整页要包 Suspense）。
   */
  const [redirect, setRedirect] = useState('/')
  useEffect(() => {
    try {
      setRedirect(safeRedirect(new URLSearchParams(window.location.search).get('redirect')))
    } catch {
      setRedirect('/')
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendCode = async () => {
    setError('')
    setCodeMsg('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('请先填写正确的邮箱')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, purpose: 'REGISTER' }),
      })
      const data = await res.json()
      if (data.success) {
        // 发码接口对已注册邮箱改发「请直接登录」的说明信（防枚举），提示里要让老用户知道去看那封信
        setCodeMsg('邮件已发送，请查收（含垃圾箱）；若该邮箱已注册过，邮件里会提示你直接登录')
        setCooldown(60)
      } else {
        setError(data.error || '验证码发送失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度不能少于6位')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          code: formData.code,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || '注册失败')
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
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[128px] lite-blob pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />

      {/* 【首帧可见 · iPhone「打不开」（2026-09-30）】这层包着整张注册表单，原来 initial={{ opacity: 0, y: 20 }}：
          服务端 HTML 里整张表单是 opacity:0，iPhone 上的 Safari / Chrome 走 HTTPS（大陆移动网络）时 JS 常晚到 10~40 秒，
          这段时间注册页就是空的。initial={false}（下面的图标同理）：服务端直接按最终状态输出，只少了入场动画 */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* 发光边框 */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-sm opacity-50" />

        <div className="relative glass rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-4"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">创建账号</h1>
            <p className="text-white/50 text-sm">注册后即可享受AI订阅服务</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-white/70 mb-2">邮箱验证码</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="6 位邮箱验证码"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={!hydrated || sending || cooldown > 0}
                  className="shrink-0 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {sending ? '发送中...' : cooldown > 0 ? `${cooldown}s` : '发送验证码'}
                </button>
              </div>
              {codeMsg && <p className="mt-1.5 text-xs text-green-400">{codeMsg}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">昵称（选填）</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  ref={nicknameRef}
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  // 与个人资料页同一口径（最多 20 字）；服务端超长只截断、不报错，这里只是提示
                  maxLength={20}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="请输入昵称（最多 20 字）"
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
                  placeholder="请输入密码（至少6位）"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  ref={confirmPasswordRef}
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !hydrated}
              className="group w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  创建账号
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* 注册告知语（营销邮件，设计文档 10.2）。注册成功时服务端会记一条 NOTICE 留痕，
                证明注册人看到的就是这段话 —— 改这里的措辞要同步改隐私政策并更新 lib/legal.ts 的日期。
                渠道站只保留条款与隐私政策那半句（营销邮件平台专属），留痕文字也按渠道站另记（lib/marketing/consent.ts） */}
            <p className="text-xs leading-relaxed text-white/40">
              注册即表示你同意
              <Link href="/terms" target="_blank" className="text-cyan-400/80 hover:text-cyan-300 transition-colors">
                《服务条款》
              </Link>
              与
              <Link href="/privacy" target="_blank" className="text-cyan-400/80 hover:text-cyan-300 transition-colors">
                《隐私政策》
              </Link>
              {isPlatform ? '。我们可能会向你的邮箱发送优惠活动信息，注册后可在个人中心或邮件底部随时一键退订。' : '。'}
            </p>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-white/30">或</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* 登录链接 */}
          <p className="text-center text-white/50 text-sm">
            已有账号？
            <Link href={withRedirect('/login', redirect)} className="ml-1 text-cyan-400 hover:text-cyan-300 transition-colors">
              立即登录
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
