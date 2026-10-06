'use client'

/**
 * 后台：策展标签与专题页（内容平台 P1，设计 §7.3）。
 *
 * 每个标签就是一个 hub 页（模型 /prompts/m/x、主题 /prompts/t/x、产品 /guides/p/x）。
 * 「介绍」是 hub 页顶部的站方文字：**没写介绍的 hub 不会被收录**（lib/content/policy 的 isHubIndexable），
 * 介绍要按实测写、带日期，不要写成广告。落地页决定内容页上「去开通」按钮指向哪里。
 */
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Pencil, Plus, X } from 'lucide-react'

interface AdminTag {
  id: number
  slug: string
  name: string
  kind: 'MODEL' | 'TOPIC' | 'PRODUCT'
  intro: string | null
  landingPath: string | null
  sortOrder: number
  status: number
  publicCount: number
}

const KIND_LABEL = { MODEL: '模型', TOPIC: '主题', PRODUCT: '产品' } as const
const hubPath = (t: { kind: string; slug: string }) =>
  t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : t.kind === 'TOPIC' ? `/prompts/t/${t.slug}` : `/guides/p/${t.slug}`

export function ContentTagsCard() {
  const [tags, setTags] = useState<AdminTag[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<AdminTag> | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/content/tags')
    const data = await res.json()
    if (data.success) setTags(data.data)
  }
  useEffect(() => {
    if (open) load()
  }, [open])

  const save = async () => {
    if (!editing) return
    setErr(null)
    setSaving(true)
    try {
      const isNew = !editing.id
      const body = {
        name: editing.name,
        intro: editing.intro ?? null,
        landingPath: editing.landingPath ?? '',
        sortOrder: editing.sortOrder ?? 0,
        ...(isNew ? { slug: editing.slug, kind: editing.kind } : { status: editing.status }),
      }
      const res = await fetch(isNew ? '/api/admin/content/tags' : `/api/admin/content/tags/${editing.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setEditing(null)
        load()
      } else setErr(data.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>策展标签与专题页（提示词 / 教程）</CardTitle>
        <div className="flex gap-2">
          {open && (
            <Button size="sm" onClick={() => setEditing({ kind: 'TOPIC', sortOrder: 0, status: 1 })}>
              <Plus className="w-4 h-4 mr-1" /> 新建标签
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>{open ? '收起' : '展开'}</Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <p className="mb-3 text-xs text-gray-500">
            没写「专题介绍」的专题页不会被搜索引擎收录（主题页还要有 8 条以上可收录的内容，模型 / 产品页 3 条）。介绍请按实测写并注明日期。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs">
                  <th className="pb-2 pr-3">种类</th>
                  <th className="pb-2 pr-3">名称</th>
                  <th className="pb-2 pr-3">slug</th>
                  <th className="pb-2 pr-3">公开内容</th>
                  <th className="pb-2 pr-3">介绍</th>
                  <th className="pb-2 pr-3">落地页</th>
                  <th className="pb-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((t) => (
                  <tr key={t.id} className={`border-b hover:bg-gray-50/60 ${t.status ? '' : 'opacity-50'}`}>
                    <td className="py-2 pr-3 text-xs">{KIND_LABEL[t.kind]}</td>
                    <td className="py-2 pr-3 font-medium">{t.name}{!t.status && <span className="ml-1 text-xs text-gray-400">（停用）</span>}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{t.slug}</td>
                    <td className="py-2 pr-3">{t.publicCount}</td>
                    <td className="py-2 pr-3 text-xs">{t.intro ? `${t.intro.length} 字` : <span className="text-amber-600">未写</span>}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{t.landingPath || '—'}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <a href={hubPath(t)} target="_blank" rel="noreferrer" className="inline-flex text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title="查看专题页">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => setEditing(t)} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50">
                        <Pencil className="w-3 h-3" /> 编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !saving && setEditing(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editing.id ? `编辑标签 · ${editing.slug}` : '新建标签'}</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-gray-900">
              {!editing.id && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">种类（建后不能改）</label>
                    <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as AdminTag['kind'] })} className="w-full px-3 py-2 rounded-lg border border-gray-300">
                      <option value="MODEL">模型</option>
                      <option value="TOPIC">主题</option>
                      <option value="PRODUCT">产品</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">slug（专题页地址，建后不能改）</label>
                    <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="id-photo" className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">名称</label>
                  <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">排序</label>
                  <input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">相关落地页（选填，如 /chongzhi/chatgpt-plus；内容页的「去开通」按钮指向它）</label>
                <input value={editing.landingPath || ''} onChange={(e) => setEditing({ ...editing, landingPath: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">专题介绍（Markdown，200 字以上才可能被收录；写清楚是什么、怎么用、Free 与付费的区别，注明实测日期）</label>
                <textarea value={editing.intro || ''} onChange={(e) => setEditing({ ...editing, intro: e.target.value })} rows={10} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              {editing.id != null && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">状态</label>
                  <select value={editing.status ?? 1} onChange={(e) => setEditing({ ...editing, status: parseInt(e.target.value) })} className="px-3 py-2 rounded-lg border border-gray-300">
                    <option value={1}>启用</option>
                    <option value={0}>停用（专题页 404，内容上不再显示这个标签）</option>
                  </select>
                </div>
              )}
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>取消</Button>
                <Button onClick={save} loading={saving}>保存</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
