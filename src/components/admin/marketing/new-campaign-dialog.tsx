'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, LayoutTemplate, Loader2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CampaignDetail, CampaignListItem, TemplateItem } from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { fmtTime, isAbortError, mktFetch } from './api'
import { Modal } from './modal'
import { CampaignStatusBadge } from './status-badge'
import { TemplateCard, templateCreateBody } from './template-gallery'

/**
 * 「新建活动」：从内置模板 / 我保存的模板 / 历史活动 三个来源里挑一个起点。
 * 建好直接跳到活动页（草稿三步引导），编辑器在那里打开。
 */
export function NewCampaignDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState<'template' | 'history'>('template')
  const [templates, setTemplates] = useState<TemplateItem[] | null>(null)
  const [tplErr, setTplErr] = useState('')
  const [picked, setPicked] = useState<string>('preset:blank')
  const [fromId, setFromId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    setName('')
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const r = await mktFetch<{ list: TemplateItem[] }>('/api/admin/marketing/templates', { signal: ctrl.signal })
        if (r.ok && r.data) {
          setTemplates(r.data.list)
          setTplErr('')
          // 默认选中「空白」；没有就选第一个
          const list = r.data.list
          setPicked((cur) => (list.some((t) => t.key === cur) ? cur : list.find((t) => t.key === 'preset:blank')?.key || list[0]?.key || ''))
        } else {
          setTplErr(r.error || '模板加载失败')
        }
      } catch (e) {
        if (!isAbortError(e)) setTplErr('模板加载失败')
      }
    })()
    return () => ctrl.abort()
  }, [open])

  const create = async (keyOverride?: string) => {
    if (creating) return
    let body: Record<string, unknown> = {}
    if (tab === 'template') {
      const b = templateCreateBody(keyOverride ?? picked)
      if (!b) return setErr('请选择一个模板')
      body = { ...b }
    } else {
      if (!fromId) return setErr('请选择要复制的活动')
      body = { fromCampaignId: fromId }
    }
    if (name.trim()) body.name = name.trim().slice(0, 100)
    setCreating(true)
    setErr('')
    try {
      const r = await mktFetch<CampaignDetail>('/api/admin/marketing/campaigns', { body })
      if (!r.ok || !r.data) {
        setErr(r.error || '创建失败')
        return
      }
      router.push(`/admin/marketing/${r.data.id}`)
    } finally {
      setCreating(false)
    }
  }

  const builtIn = (templates || []).filter((t) => t.builtIn)
  const saved = (templates || []).filter((t) => !t.builtIn)

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={creating}
      width="max-w-5xl"
      title="新建活动"
      subtitle="选一个起点：内置模板排版都调好了，改改文字就能发"
      footer={
        <>
          <div className="mr-auto flex min-w-0 flex-1 items-center gap-2">
            <label className="shrink-0 text-sm text-gray-600">活动名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="只在后台显示，不会出现在邮件里；不填自动起名"
              className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          {err && <span className="text-sm text-red-600">{err}</span>}
          <Button variant="outline" onClick={onClose} disabled={creating}>
            取消
          </Button>
          <Button onClick={() => void create()} loading={creating}>
            <Plus className="mr-1 h-4 w-4" />
            创建并编辑
          </Button>
        </>
      }
    >
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(
          [
            { k: 'template', label: '从模板开始', icon: LayoutTemplate },
            { k: 'history', label: '复制历史活动', icon: Copy },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium',
              tab === t.k ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'template' ? (
        tplErr ? (
          <p className="py-10 text-center text-sm text-red-600">{tplErr}</p>
        ) : !templates ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <section>
              <h4 className="mb-2 text-sm font-medium text-gray-700">内置模板</h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {builtIn.map((t) => (
                  <TemplateCard
                    key={t.key}
                    item={t}
                    selected={picked === t.key}
                    onClick={() => setPicked(t.key)}
                    onDoubleClick={() => {
                      setPicked(t.key)
                      void create(t.key)
                    }}
                  />
                ))}
              </div>
            </section>
            <section>
              <h4 className="mb-2 text-sm font-medium text-gray-700">我保存的模板</h4>
              {saved.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-400">
                  还没有。在任意活动页点「另存为模板」，就能把排好的版式存下来反复用。
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {saved.map((t) => (
                    <TemplateCard
                      key={t.key}
                      item={t}
                      selected={picked === t.key}
                      onClick={() => setPicked(t.key)}
                      onDoubleClick={() => {
                        setPicked(t.key)
                        void create(t.key)
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      ) : (
        <HistoryPicker value={fromId} onChange={setFromId} active={open && tab === 'history'} />
      )}
    </Modal>
  )
}

function HistoryPicker({ value, onChange, active }: { value: number | null; onChange: (id: number) => void; active: boolean }) {
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [list, setList] = useState<CampaignListItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    if (!active) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    ;(async () => {
      try {
        const q = new URLSearchParams({ page: '1', pageSize: '30' })
        if (debounced) q.set('keyword', debounced)
        const r = await mktFetch<{ list: CampaignListItem[] }>(`/api/admin/marketing/campaigns?${q}`, { signal: ctrl.signal })
        if (abortRef.current !== ctrl) return
        setList(r.ok && r.data ? r.data.list : [])
      } catch (e) {
        if (!isAbortError(e)) setList([])
      } finally {
        if (abortRef.current === ctrl) setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [active, debounced])

  return (
    <div className="space-y-3">
      <div className="relative w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜活动名或邮件主题"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
        />
      </div>
      <p className="text-xs text-gray-400">复制内容、主题、受众设置为一个新草稿；发送记录与统计不会带过去。</p>
      {list === null || (loading && list.length === 0) ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">{debounced ? '没有匹配的活动' : '还没有历史活动'}</p>
      ) : (
        <ul className={cn('divide-y divide-gray-100 rounded-lg border border-gray-200', loading && 'opacity-60')}>
          {list.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50', value === c.id && 'bg-primary-50')}
              >
                <input type="radio" readOnly checked={value === c.id} className="h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{c.name}</div>
                  <div className="truncate text-xs text-gray-500">{c.subject || '（无主题）'}</div>
                </div>
                <CampaignStatusBadge status={c.status} />
                <span className="w-32 shrink-0 text-right text-xs text-gray-400">{fmtTime(c.completedAt || c.startedAt || c.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
