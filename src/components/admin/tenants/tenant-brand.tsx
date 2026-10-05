'use client'

/**
 * 超管渠道详情「品牌与公告」卡片（docs/多渠道分销-渠道品牌与公告.md 第 6 节）。站长 10-05 拍板：渠道改品牌立即生效，
 * 站长在这里随时能看、一键恢复默认、锁定 / 解锁；渠道公告能看、能下架 / 恢复。只读展示 + 三个动作，不代渠道编辑文案。
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BRAND_LOGO_URL_RE } from '@/lib/brand-base'
import { Badge, api, fmtTime, useApi } from './common'

interface BrandDetail {
  brand: {
    brandName: string | null
    brandLogoUrl: string | null
    brandIntro: string | null
    heroTitle: string | null
    heroSubtitle: string | null
    seoTitle: string | null
    seoDescription: string | null
    locked: boolean
  }
  announcements: {
    announcementNo: string
    title: string
    body: string
    level: string
    enabled: boolean
    pinned: boolean
    blocked: boolean
    startAt: string | null
    endAt: string | null
    updatedAt: string
    live: boolean
  }[]
}

type Done = (r: { success: boolean; message?: string; error?: string }) => void

const ROWS: [keyof BrandDetail['brand'], string][] = [
  ['brandName', '网站名称'],
  ['heroTitle', '首页大标题'],
  ['heroSubtitle', '首页副标题'],
  ['brandIntro', '页脚简介'],
  ['seoTitle', '浏览器标题'],
  ['seoDescription', '分享摘要'],
]

export function BrandCard({ id, onDone }: { id: string; onDone: Done }) {
  const { data, error, reload } = useApi<BrandDetail>(`/api/admin/tenants/${id}/brand`)
  const [busy, setBusy] = useState('')

  const act = async (action: 'reset' | 'lock' | 'unlock') => {
    if (action === 'reset' && !confirm('把该渠道的网站名称、logo、简介、首页标题等全部恢复为平台默认？渠道会收到站内通知。')) return
    setBusy(action)
    const r = await api(`/api/admin/tenants/${id}/brand`, { body: { action } })
    setBusy('')
    onDone(r as { success: boolean; message?: string; error?: string })
    reload()
  }

  const block = async (no: string, blocked: boolean) => {
    if (blocked && !confirm('下架这条公告？下架后前台不再展示，渠道不能再启用。')) return
    setBusy(`a${no}`)
    const r = await api(`/api/admin/tenants/${id}/announcements/${no}`, { method: 'PATCH', body: { blocked } })
    setBusy('')
    onDone(r as { success: boolean; message?: string; error?: string })
    reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>品牌与公告</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && !data && <div className="text-sm text-red-600">{error}</div>}
        {!data ? (
          !error && <div className="text-sm text-gray-400">加载中...</div>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              渠道在自己的设置中心修改，保存后立即生效（每次修改都会发到站长群）。没填的项前台显示平台默认；改了网站名称或 logo 后页脚底部保留「技术与支付服务：益阳市赫山区必高科技有限公司」。
            </p>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                {data.brand.brandLogoUrl && BRAND_LOGO_URL_RE.test(data.brand.brandLogoUrl) ? (
                  <img src={data.brand.brandLogoUrl} alt="渠道 logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400">默认 logo</span>
                )}
              </div>
              <dl className="grid flex-1 grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm">
                {ROWS.map(([k, label]) => (
                  <div key={k} className="contents">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="break-words text-gray-900">{(data.brand[k] as string | null) ?? <span className="text-gray-400">默认</span>}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {data.brand.locked ? <Badge tone="bg-amber-100 text-amber-700">已锁定：渠道不能修改</Badge> : <Badge>渠道可修改</Badge>}
              <Button size="sm" variant="outline" onClick={() => act('reset')} disabled={!!busy}>
                {busy === 'reset' ? '处理中…' : '恢复默认'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(data.brand.locked ? 'unlock' : 'lock')} disabled={!!busy}>
                {busy === 'lock' || busy === 'unlock' ? '处理中…' : data.brand.locked ? '解除锁定' : '锁定（禁止修改）'}
              </Button>
            </div>

            <div className="border-t pt-3">
              <div className="mb-2 text-sm font-medium">渠道公告（{data.announcements.length}）</div>
              {data.announcements.length === 0 ? (
                <div className="text-sm text-gray-400">暂无</div>
              ) : (
                <div className="space-y-2">
                  {data.announcements.map((a) => (
                    <div key={a.announcementNo} className="rounded border p-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{a.title}</span>
                        {a.pinned && <Badge tone="bg-red-100 text-red-700">强提醒</Badge>}
                        {a.blocked ? (
                          <Badge tone="bg-red-100 text-red-700">已下架</Badge>
                        ) : a.live ? (
                          <Badge tone="bg-green-100 text-green-700">展示中</Badge>
                        ) : (
                          <Badge>{a.enabled ? '不在展示时间' : '未启用'}</Badge>
                        )}
                        <span className="ml-auto text-xs text-gray-400">{fmtTime(a.updatedAt)}</span>
                        <Button size="sm" variant="outline" onClick={() => block(a.announcementNo, !a.blocked)} disabled={!!busy}>
                          {busy === `a${a.announcementNo}` ? '处理中…' : a.blocked ? '恢复' : '下架'}
                        </Button>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-gray-600">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
