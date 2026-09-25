'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutTemplate, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CampaignDetail, TemplateItem } from '@/lib/marketing/types'
import { isAbortError, mktFetch } from '@/components/admin/marketing/api'
import { TemplateCard, templateCreateBody, templateIdOf } from '@/components/admin/marketing/template-gallery'

/**
 * 营销推广 · 模板库：内置模板（写在代码里，改不了也删不掉）+ 自己另存的模板（可改名、删除）。
 * 「用此模板新建」直接建一个草稿并跳过去。
 */
export default function MarketingTemplatesPage() {
  const router = useRouter()
  const [list, setList] = useState<TemplateItem[] | null>(null)
  const [err, setErr] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const r = await mktFetch<{ list: TemplateItem[] }>('/api/admin/marketing/templates', { signal: ctrl.signal })
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        setList(r.data.list)
        setErr('')
      } else setErr(r.error || '加载失败')
    } catch (e) {
      if (!isAbortError(e)) setErr('加载失败')
    }
  }, [])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const createFromTemplate = async (t: TemplateItem) => {
    const body = templateCreateBody(t.key)
    if (!body) return
    setBusyKey(t.key)
    try {
      const r = await mktFetch<CampaignDetail>('/api/admin/marketing/campaigns', { body })
      if (!r.ok || !r.data) return alert(r.error || '创建失败')
      router.push(`/admin/marketing/${r.data.id}`)
    } finally {
      setBusyKey(null)
    }
  }

  const rename = async (t: TemplateItem) => {
    const id = templateIdOf(t.key)
    if (!id) return
    const name = prompt('新的模板名称：', t.name)
    if (name == null) return
    const trimmed = name.trim().slice(0, 80)
    if (!trimmed || trimmed === t.name) return
    setBusyKey(t.key)
    try {
      const r = await mktFetch(`/api/admin/marketing/templates/${id}`, { method: 'PUT', body: { name: trimmed } })
      if (!r.ok) return alert(r.error || '改名失败')
      load()
    } finally {
      setBusyKey(null)
    }
  }

  const remove = async (t: TemplateItem) => {
    const id = templateIdOf(t.key)
    if (!id) return
    if (!confirm(`删除模板「${t.name}」？\n\n只删模板本身，用它建过的活动不受影响。`)) return
    setBusyKey(t.key)
    try {
      const r = await mktFetch(`/api/admin/marketing/templates/${id}`, { method: 'DELETE' })
      if (!r.ok) return alert(r.error || '删除失败')
      load()
    } finally {
      setBusyKey(null)
    }
  }

  const builtIn = (list || []).filter((t) => t.builtIn)
  const saved = (list || []).filter((t) => !t.builtIn)

  const footer = (t: TemplateItem) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button size="sm" onClick={() => createFromTemplate(t)} loading={busyKey === t.key} disabled={!!busyKey}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        用此模板新建
      </Button>
      {!t.builtIn && (
        <>
          <button
            type="button"
            title="改名"
            disabled={!!busyKey}
            onClick={() => rename(t)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="删除模板"
            disabled={!!busyKey}
            onClick={() => remove(t)}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            内置模板
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            只用品牌色块与 Logo 排版，不依赖图片素材也好看；都内置了「{'{{nickname|朋友}}'}」尊称（阿里云要求营销邮件带称呼）。
          </p>
        </CardHeader>
        <CardContent>
          {err && !list ? (
            <p className="py-10 text-center text-sm text-red-600">{err}</p>
          ) : !list ? (
            <div className="flex justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : builtIn.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">暂无内置模板</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {builtIn.map((t) => (
                <TemplateCard key={t.key} item={t} footer={footer(t)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>我保存的模板</CardTitle>
          {list && <span className="text-sm text-gray-500">{saved.length} 个</span>}
        </CardHeader>
        <CardContent>
          {!list ? null : saved.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              还没有保存的模板。
              <div className="mt-1 text-xs text-gray-400">
                打开任意活动，点右上角「另存为模板」，就能把排好的版式（含主题与预览文字）存下来反复使用。
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {saved.map((t) => (
                <TemplateCard key={t.key} item={t} footer={footer(t)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
