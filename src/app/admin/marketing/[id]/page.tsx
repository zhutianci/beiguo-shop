'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, Save, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CampaignDetail, ConfigResponse } from '@/lib/marketing/types'
import { isAbortError, mktFetch } from '@/components/admin/marketing/api'
import { CampaignStatusBadge } from '@/components/admin/marketing/status-badge'
import { HaltBanner } from '@/components/admin/marketing/halt-banner'
import { DraftCampaign } from '@/components/admin/marketing/draft-campaign'
import { CampaignReportView } from '@/components/admin/marketing/campaign-report'

/**
 * 营销活动详情：草稿 → 三步引导（内容 / 受众 / 检查并发送）；已提交 → 报表与控制。
 * 同一个地址，状态变了（提交发送、撤回定时）视图自动切换。
 */
export default function MarketingCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const id = Number(params.id)
  const validId = Number.isInteger(id) && id > 0

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [busy, setBusy] = useState<'dup' | 'tpl' | 'del' | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const flushRef = useRef<(() => Promise<boolean>) | null>(null)

  const loadCampaign = useCallback(async (): Promise<CampaignDetail | null> => {
    if (!validId) return null
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const r = await mktFetch<CampaignDetail>(`/api/admin/marketing/campaigns/${id}`, { signal: ctrl.signal })
      if (abortRef.current !== ctrl) return null
      if (r.ok && r.data) {
        setCampaign(r.data)
        setLoadErr('')
        return r.data
      }
      setLoadErr(r.status === 404 ? '活动不存在（可能已被删除）' : r.error || '加载失败')
      return null
    } catch (e) {
      if (!isAbortError(e)) setLoadErr('网络错误，加载失败')
      return null
    }
  }, [id, validId])

  const loadConfig = useCallback(async () => {
    try {
      const r = await mktFetch<ConfigResponse>('/api/admin/marketing/config')
      if (r.ok && r.data) setConfig(r.data)
    } catch {
      /* 只影响前缀展示与横幅，拿不到不挡操作 */
    }
  }, [])

  useEffect(() => {
    loadCampaign()
    loadConfig()
    return () => abortRef.current?.abort()
  }, [loadCampaign, loadConfig])

  /** 先存盘（草稿的受众改动），存不成功就不继续 */
  const flushFirst = async (): Promise<boolean> => {
    if (!flushRef.current) return true
    const ok = await flushRef.current()
    if (!ok) alert('还有改动没保存成功，先解决保存问题再操作。')
    return ok
  }

  const duplicate = async () => {
    if (!campaign) return
    setBusy('dup')
    try {
      if (!(await flushFirst())) return
      const r = await mktFetch<CampaignDetail>(`/api/admin/marketing/campaigns/${campaign.id}/duplicate`, { body: {} })
      if (!r.ok || !r.data) return alert(r.error || '复制失败')
      router.push(`/admin/marketing/${r.data.id}`)
    } finally {
      setBusy(null)
    }
  }

  const saveTemplate = async () => {
    if (!campaign) return
    const name = prompt('模板名称（只在后台显示）：', campaign.name.slice(0, 80))
    if (name == null) return
    const trimmed = name.trim().slice(0, 80)
    if (!trimmed) return alert('模板名称不能为空')
    setBusy('tpl')
    try {
      if (!(await flushFirst())) return
      const r = await mktFetch<{ id: number }>(`/api/admin/marketing/campaigns/${campaign.id}/save-template`, { body: { name: trimmed } })
      if (!r.ok) return alert(r.error || '保存失败')
      alert(`已另存为模板「${trimmed}」，新建活动时可以在「我保存的模板」里找到。`)
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!campaign) return
    if (!confirm(`删除草稿「${campaign.name}」？\n\n删除后不能恢复。`)) return
    setBusy('del')
    try {
      const r = await mktFetch<null>(`/api/admin/marketing/campaigns/${campaign.id}`, { method: 'DELETE' })
      if (!r.ok) return alert(r.error || '删除失败')
      router.push('/admin/marketing')
    } finally {
      setBusy(null)
    }
  }

  if (!validId || (loadErr && !campaign)) {
    return (
      <Card>
        <CardContent className="space-y-3 py-12 text-center">
          <p className="text-sm text-gray-500">{validId ? loadErr : '活动地址不正确'}</p>
          <Link href="/admin/marketing" className="text-sm text-primary-600 hover:underline">
            ← 返回活动列表
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (!campaign) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const isDraft = campaign.status === 'DRAFT'

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin/marketing" className="hover:text-gray-900">
              营销活动
            </Link>
            <span>/</span>
            <span className="text-gray-400">#{campaign.id}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-all text-xl font-semibold text-gray-900">{campaign.name}</h2>
            {/* 已提交的活动由报表卡片显示实时状态（每 10 秒刷新），这里只在草稿时显示，免得两处不同步 */}
            {isDraft && <CampaignStatusBadge status={campaign.status} note={campaign.statusNote} />}
          </div>
          {isDraft && <p className="mt-1 text-xs text-gray-400">活动名称只在后台显示，不会出现在邮件、券名或链接参数里。在编辑器左上角可以改。</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={duplicate} loading={busy === 'dup'} disabled={!!busy}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            复制
          </Button>
          <Button size="sm" variant="outline" onClick={saveTemplate} loading={busy === 'tpl'} disabled={!!busy}>
            <Save className="mr-1 h-3.5 w-3.5" />
            另存为模板
          </Button>
          {isDraft && (
            <Button size="sm" variant="outline" onClick={remove} loading={busy === 'del'} disabled={!!busy} className="text-red-600 hover:bg-red-50">
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              删除草稿
            </Button>
          )}
        </div>
      </div>

      {config && <HaltBanner enabled={config.config.enabled} halt={config.halt} dryRun={config.sender.dryRun} onChanged={loadConfig} />}

      {isDraft ? (
        <DraftCampaign
          // 换了活动（复制后跳转）要整个重建，避免沿用上一个活动的本地状态
          key={campaign.id}
          campaign={campaign}
          onCampaignChange={setCampaign}
          reload={loadCampaign}
          flushRef={flushRef}
          config={config}
        />
      ) : (
        <CampaignReportView key={campaign.id} campaignId={campaign.id} onChanged={() => void loadCampaign()} />
      )}
    </div>
  )
}
