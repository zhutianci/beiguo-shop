'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ email: '', code: '', password: '', confirm: '' })
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [codeMsg, setCodeMsg] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendCode = async () => {
    setError('')
    setCodeMsg('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('请先填写正确的邮箱')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, purpose: 'RESET' }),
      })
      const data = await res.json()
      if (data.success) {
        setCodeMsg('若该邮箱已注册，验证码已发送（含垃圾箱）')
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
    if (form.password.length < 6) return setError('密码长度不能少于6位')
    if (form.password !== form.confirm) return setError('两次输入的密码不一致')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: form.code, password: form.password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || '重置失败')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 1800)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative w-full max-w-md">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-sm opacity-50" />
        <div className="relative glass rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">找回密码</h1>
            <p className="text-white/50 text-sm">通过邮箱验证码重置密码</p>
          </div>

          {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          {done ? (
            <div className="text-center py-6">
              <div className="text-green-400 text-lg font-semibold mb-2">密码已重置</div>
              <p className="text-white/50 text-sm">正在前往登录…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="注册时使用的邮箱" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">邮箱验证码</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input type="text" inputMode="numeric" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="6 位验证码" />
                  </div>
                  <button type="button" onClick={sendCode} disabled={sending || cooldown > 0}
                    className="shrink-0 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50 whitespace-nowrap">
                    {sending ? '发送中...' : cooldown > 0 ? `${cooldown}s` : '发送验证码'}
                  </button>
                </div>
                {codeMsg && <p className="mt-1.5 text-xs text-green-400">{codeMsg}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">新密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="至少6位" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">确认新密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="再次输入新密码" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="group w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] disabled:opacity-50 transition-all mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>重置密码 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          )}

          <p className="text-center text-white/50 text-sm mt-8">
            想起来了？
            <Link href="/login" className="ml-1 text-cyan-400 hover:text-cyan-300 transition-colors">返回登录</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
