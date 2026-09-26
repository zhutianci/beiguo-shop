'use client'

/**
 * 渠道后台登录（设计 12.1）：复用 /api/auth/login（渠道 Host 上由 WP1 签 aud=本渠道 的令牌）。
 * 页面本身不渲染任何数据、不要求登录（requireChannelStorefrontPage），所以未登录访问不会重定向循环。
 * 登录成功后整页跳转到 /partner（让服务端页面守卫重新读 cookie）；不是本渠道成员的账号在 /partner 得到 404。
 * 回跳地址只接受 /partner 开头的站内路径（防开放重定向）。
 */
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, Store } from 'lucide-react'
import { inputCls } from '../common/ui'

function safeNext(raw: string | null): string {
  if (!raw) return '/partner'
  // DRAFT 期预览买家的登录入口（WP1 偏差 5，集成阶段补）：DRAFT 店面整个前台对未登录者 404、连 /login 也打不开，
  // 预览买家经 /partner/login?next=/ 登录后回到店面首页（登录后才被识别为预览账号）。只放行根路径这一个值
  if (raw === '/') return '/'
  // 其余只允许 /partner 或 /partner/...；拒绝 //evil.com、/\evil.com、带协议的地址
  if (!/^\/partner(\/[A-Za-z0-9_\-/]*)?(\?[^#]*)?$/.test(raw)) return '/partner'
  return raw
}

/**
 * registerUrl：筹备期（DRAFT）才给——渠道站 DRAFT 期不开放注册，没有账号的渠道主 / 预览买家要先到主站注册（两站同一账号）。
 * 地址由服务端按平台 Tenant.origin 生成（tenantOrigin(1)），不从 Host 拼。
 */
export function PartnerLoginView({ registerUrl }: { registerUrl?: string | null } = {}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setError(json?.error || '登录失败，请重试')
        return
      }
      // 与前台一致：token 同时存一份，供 cookie 不持久化的内置浏览器以 Bearer 兜底（src/components/auth-fetch-patch.tsx 读取同一个键）
      try {
        if (json?.data?.token) window.localStorage.setItem('auth-token', json.data.token)
      } catch {
        /* 隐私模式 */
      }
      const next = safeNext(new URLSearchParams(window.location.search).get('next'))
      window.location.href = next
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">渠道后台登录</h1>
            <p className="text-xs text-gray-500">使用本店店主账号登录</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-600">邮箱</span>
            <input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-600">密码</span>
            <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            登录
          </button>
        </form>
        {registerUrl && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            还没有贝果科技账号？本店筹备期暂不开放注册，请先到{' '}
            <a href={registerUrl} className="font-medium underline" target="_blank" rel="noopener noreferrer">
              主站注册
            </a>
            （用收到邀请的邮箱，两站同一账号），再回到本页登录。
          </p>
        )}
        <div className="mt-4 flex justify-between text-xs text-gray-500">
          <Link href="/forgot-password" className="hover:text-primary-600">
            忘记密码
          </Link>
          <Link href="/" className="hover:text-primary-600">
            返回店铺首页
          </Link>
        </div>
      </div>
    </div>
  )
}
