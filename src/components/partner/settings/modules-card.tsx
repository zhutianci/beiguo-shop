'use client'

/**
 * 设置中心「内容模块」卡片（docs/多渠道分销-内容模块下放.md）：AI学习 / AI圈大事记 / IP工具。
 * 平台开通（超管授权）后默认上架，店主可以在这里下架 / 重新上架；没开通的灰着，写「待平台开通」。
 * 仅 OWNER（settings.write）；暂停营业时只读（服务端同样拒绝）。
 */
import { useCallback, useEffect, useState } from 'react'
import { MODULE_DESC, type ContentModule } from '@/lib/storefront/modules'
import { gotoLogin, partnerApi } from '../common/api'
import { Badge, Button, Card, ErrorBox, Loading, Notice } from '../common/ui'

interface ModuleDTO {
  module: ContentModule
  label: string
  granted: boolean
  on: boolean
  live: boolean
}

export function ModulesCard({ readOnly }: { readOnly?: boolean }) {
  const [rows, setRows] = useState<ModuleDTO[] | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ modules: ModuleDTO[] }>('/api/partner/settings/modules')
    if (r.ok) setRows(r.data.modules)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!rows) return <Loading />

  const toggle = async (m: ModuleDTO) => {
    if (m.on && !confirm(`下架「${m.label}」？下架后前台导航不再显示，页面打开会是 404。随时可以重新上架。`)) return
    setBusy(m.module)
    setMsg(null)
    const r = await partnerApi<{ modules: ModuleDTO[] }>('/api/partner/settings/modules', { method: 'PUT', body: { module: m.module, on: !m.on } })
    setBusy('')
    if (r.ok) {
      setRows(r.data.modules)
      setMsg({ tone: 'green', text: m.on ? `「${m.label}」已下架` : `「${m.label}」已上架，前台刷新后可见` })
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  return (
    <Card title="内容模块">
      <div className="space-y-3 p-4">
        <p className="text-xs text-gray-500">
          平台提供的内容板块，开通后出现在你店铺的导航栏与首页，内容由平台持续更新，顾客可以浏览、发帖、评论、收藏。平台开通后默认上架，你可以随时下架。
        </p>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {rows.map((m) => (
            <div key={m.module} className="flex flex-wrap items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{m.label}</span>
                  {!m.granted ? <Badge>待平台开通</Badge> : m.live ? <Badge tone="green">展示中</Badge> : m.on ? <Badge tone="amber">店铺未营业，暂不展示</Badge> : <Badge tone="gray">已下架</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{MODULE_DESC[m.module]}</p>
              </div>
              {m.granted && (
                <Button size="sm" variant={m.on ? 'secondary' : 'primary'} disabled={readOnly || !!busy} loading={busy === m.module} onClick={() => toggle(m)}>
                  {m.on ? '下架' : '上架'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
