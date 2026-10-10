'use client'

/**
 * 超管渠道详情「内容模块」卡片（docs/多渠道分销-内容模块下放.md）。站长 10-10：AI学习 / AI圈大事记 / IP工具 按渠道授权，
 * 默认不授权；授权后渠道前台默认上架，渠道可在自己的设置中心下架。这里只管授权 / 收回，同时显示渠道的上架状态。
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MODULE_DESC, type ContentModule } from '@/lib/storefront/modules'
import { Badge, api, useApi } from './common'

interface ModuleRow {
  module: ContentModule
  label: string
  granted: boolean
  on: boolean
  live: boolean
}

type Done = (r: { success: boolean; message?: string; error?: string }) => void

export function ModulesCard({ id, onDone }: { id: string; onDone: Done }) {
  const { data, error, reload } = useApi<{ modules: ModuleRow[] }>(`/api/admin/tenants/${id}/modules`)
  const [busy, setBusy] = useState('')

  const grant = async (m: ModuleRow) => {
    if (m.granted && !confirm(`收回「${m.label}」？该渠道前台立即撤下这个模块（渠道会收到站内通知）。`)) return
    setBusy(m.module)
    const r = await api(`/api/admin/tenants/${id}/modules`, { body: { module: m.module, granted: !m.granted } })
    setBusy('')
    onDone(r as { success: boolean; message?: string; error?: string })
    reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容模块</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && !data && <div className="text-sm text-red-600">{error}</div>}
        {!data ? (
          !error && <div className="text-sm text-gray-400">加载中...</div>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              授权后该渠道前台默认上架（导航栏、首页出现入口），渠道可以在自己的设置中心下架。内容与主站是同一份；渠道站上不出充值广告与作者返现链接，积分兑换只在主站。
            </p>
            <div className="divide-y rounded border">
              {data.modules.map((m) => (
                <div key={m.module} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{m.label}</span>
                      {!m.granted ? (
                        <Badge>未授权</Badge>
                      ) : m.live ? (
                        <Badge tone="bg-green-100 text-green-700">展示中</Badge>
                      ) : m.on ? (
                        <Badge tone="bg-amber-100 text-amber-700">已授权（渠道未营业）</Badge>
                      ) : (
                        <Badge tone="bg-gray-100 text-gray-600">已授权，渠道已下架</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{MODULE_DESC[m.module]}</p>
                  </div>
                  <Button size="sm" variant={m.granted ? 'outline' : 'primary'} onClick={() => grant(m)} disabled={!!busy}>
                    {busy === m.module ? '处理中…' : m.granted ? '收回' : '授权'}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
