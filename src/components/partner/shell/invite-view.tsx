'use client'

/**
 * 接受成员邀请（设计 5.2、6.7）。页面不渲染任何数据（requireChannelStorefrontPage，不要求登录）：
 * 被邀请人先用**被邀请的邮箱**在本渠道 Host 登录，再点「接受邀请」→ POST /api/partner/invite/accept。
 * 所有失败（过期、已用、吊销、邮箱不符、不属于本店）服务端都只回 404，这里统一提示，不区分原因。
 */
import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { partnerApi } from '../common/api'
import { Button, Notice } from '../common/ui'

/** registerUrl：主站注册地址（服务端按平台 Tenant.origin 生成）。没有账号的被邀请人先去主站注册（两站同一账号） */
export function PartnerInviteView({ token, registerUrl }: { token: string; registerUrl?: string | null }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'needLogin' | 'invalid' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const accept = async () => {
    setState('loading')
    const r = await partnerApi('/api/partner/invite/accept', { method: 'POST', body: { token } })
    if (r.ok) {
      setState('done')
      window.setTimeout(() => {
        window.location.href = '/partner'
      }, 800)
      return
    }
    if (r.needLogin) return setState('needLogin')
    if (r.status === 404) return setState('invalid')
    setMsg(r.error)
    setState('error')
  }

  const loginHref = `/partner/login?next=${encodeURIComponent(`/partner/invite/${token}`)}`

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <MailCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">加入店铺后台</h1>
            <p className="text-xs text-gray-500">请先用收到邀请的邮箱登录本店，再接受邀请</p>
          </div>
        </div>
        {state === 'done' && <Notice tone="green">已加入，正在进入后台…</Notice>}
        {state === 'needLogin' && (
          <Notice tone="amber">
            请先登录。
            <Link href={loginHref} className="ml-1 font-medium underline">
              去登录
            </Link>
          </Notice>
        )}
        {registerUrl && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
            还没有贝果科技账号？请先到{' '}
            <a href={registerUrl} className="font-medium text-primary-700 underline" target="_blank" rel="noopener noreferrer">
              主站注册
            </a>
            ，用收到邀请的邮箱注册（两站同一账号），再回到此链接登录并接受邀请。
          </p>
        )}
        {state === 'invalid' && <Notice tone="red">邀请无效：可能已过期、已被使用、已撤销，或登录的邮箱与被邀请邮箱不一致。请联系站长重新发送邀请。</Notice>}
        {state === 'error' && <Notice tone="red">{msg}</Notice>}
        <div className="flex gap-2">
          <Button variant="primary" onClick={accept} loading={state === 'loading'} disabled={state === 'done'}>
            接受邀请
          </Button>
          <Link href={loginHref} className="inline-flex items-center rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">
            切换账号登录
          </Link>
        </div>
      </div>
    </div>
  )
}
