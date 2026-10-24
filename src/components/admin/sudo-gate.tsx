'use client'

/**
 * 后台敏感操作的二次验证弹框（lib/security/sudo.ts 的前端一半）。
 *
 * 在后台外壳里挂一次：把 window.fetch 包一层，后台接口回 403 且带 needSudo 时弹框要登录密码，
 * 验过（POST /api/admin/security/sudo）后自动重放原请求，调用方拿到的就是重放后的结果——各个页面一行都不用改。
 * 同时有几个请求都被拦时只弹一次框，验过后一起重放；点「取消」就把原来的 403 原样还给调用方（页面照常提示失败）。
 */
import { useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

type Waiter = (ok: boolean) => void

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

export function SudoGate() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const waiters = useRef<Waiter[]>([])
  const origFetch = useRef<typeof fetch | null>(null)

  useEffect(() => {
    const w = window as unknown as { __bgSudoPatched?: boolean }
    if (w.__bgSudoPatched) return
    w.__bgSudoPatched = true
    const orig = window.fetch.bind(window)
    origFetch.current = orig
    const ask = () =>
      new Promise<boolean>((resolve) => {
        waiters.current.push(resolve)
        setErr('')
        setOpen(true)
      })
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await orig(input, init)
      if (res.status !== 403) return res
      const url = urlOf(input)
      if (!url.includes('/api/admin/') || url.includes('/api/admin/security/sudo')) return res
      let needSudo = false
      try {
        needSudo = !!(await res.clone().json())?.needSudo
      } catch {
        return res
      }
      if (!needSudo) return res
      const ok = await ask()
      return ok ? orig(input, init) : res
    }
  }, [])

  const finish = (ok: boolean) => {
    const ws = waiters.current
    waiters.current = []
    setOpen(false)
    setPassword('')
    setErr('')
    ws.forEach((w) => w(ok))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setErr('')
    try {
      const f = origFetch.current ?? window.fetch
      const res = await f('/api/admin/security/sudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) finish(true)
      else setErr(d?.error || '验证失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-gray-900">
          <ShieldCheck className="h-5 w-5 text-primary-600" />
          <h3 className="text-base font-semibold">验证身份</h3>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          这是敏感操作（卡密明文、改钱、改权限之类），请再输一次登录密码。验证后 10 分钟内不用再输。
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="登录密码"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => finish(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit" disabled={busy || !password} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
            {busy ? '验证中…' : '确认'}
          </button>
        </div>
      </form>
    </div>
  )
}
