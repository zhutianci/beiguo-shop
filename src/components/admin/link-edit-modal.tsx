'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LINK_SLOTS, LINK_STATUSES, SLOT_LABELS, STATUS_LABELS } from '@/lib/friend-link-client'

/**
 * 后台列表里一行的真实形状，对齐 GET /api/admin/links 的返回。
 *
 * 【为什么字段全是必填】把它们写成可选是为了让「新建时的空表单」也能用同一个类型，
 * 代价是列表侧 row.id 变成 number | undefined，于是全页要撒一串 `as number`——
 * 断言一旦压住了真实的类型缺口，接口哪天少返一个 id，运行期就会去 PATCH
 * /api/admin/links/undefined 而编译期毫无察觉。
 * 仓库既有写法（admin/forum/page.tsx）是「列表类型全必填 + 草稿用 Partial<T>」，这里沿用。
 */
export interface AdminLink {
  id: number
  name: string
  url: string
  host: string
  logo: string | null
  description: string | null
  slot: string
  status: string
  source: string
  nofollow: boolean
  sortOrder: number
  clicks: number
  contact: string | null
  remark: string | null
  backlinkOk: boolean | null
  backlinkNote: string | null
  checkedAt: string | null
  startAt: string | null
  endAt: string | null
  createdAt: string
}

/** 编辑中的草稿：新建时几乎所有字段都还不存在 */
export type AdminLinkDraft = Partial<AdminLink>

/** datetime-local 要「本地时区的 YYYY-MM-DDTHH:mm」，不能用 toISOString（那是 UTC） */
function toLocalInput(s: string | null | undefined): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900'

export function LinkEditModal({
  value,
  onClose,
  onSaved,
}: {
  value: AdminLinkDraft
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<AdminLinkDraft>({
    slot: 'FRIEND',
    status: 'APPROVED',
    nofollow: true,
    sortOrder: 0,
    ...value,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const downOnBackdrop = useRef(false)

  const set = (patch: AdminLinkDraft) => setForm((f) => ({ ...f, ...patch }))

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // scope 决定落在 public/uploads/ 下的哪个子目录，白名单在 /api/upload 里
      fd.append('scope', 'links')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) set({ logo: data.data.url })
      else setErr(data.error || '上传失败')
    } catch {
      setErr('上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /**
   * datetime-local 给的是「不带时区的本地时间串」。原样发给服务端，
   * 服务端 new Date() 会按**服务器时区**去解释它：浏览器在 +8、容器在 UTC 时，
   * 每存一次就往前挪 8 小时，越改越离谱。这里先在浏览器里换成绝对时间再发。
   * 值若本来就是服务端返回的 ISO（用户压根没动这个字段），原样透传。
   */
  const toIso = (v: string | null | undefined): string | null => {
    if (!v) return null
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return v
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }

  const save = async () => {
    setErr(null)
    setSaving(true)
    try {
      const isNew = !form.id
      const res = await fetch(isNew ? '/api/admin/links' : `/api/admin/links/${form.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          logo: form.logo || null,
          description: form.description || null,
          slot: form.slot,
          status: form.status,
          nofollow: !!form.nofollow,
          sortOrder: form.sortOrder ?? 0,
          contact: form.contact || null,
          remark: form.remark || null,
          startAt: toIso(form.startAt),
          endAt: toIso(form.endAt),
        }),
      })
      const data = await res.json()
      if (data.success) onSaved()
      else setErr(data.error || '保存失败')
    } catch {
      setErr('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // 【为什么要记住 mousedown 的落点】只看 click 的话：在输入框里拖选文本、
      // 手滑到面板外才松开，浏览器照样会往遮罩上派发一次 click，整张表单瞬间关掉，
      // 填了一半的内容全没了。要求按下与抬起都落在遮罩上，才算「点了遮罩」。
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (!saving && downOnBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{form.id ? '编辑友链' : '新增友链 / 招商位'}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">站点名称 *</label>
              <input value={form.name || ''} onChange={(e) => set({ name: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">站点地址 *（不带协议会自动补 https）</label>
              <input
                value={form.url || ''}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="https://example.com"
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">一句话简介（前台卡片展示两行）</label>
            <input
              value={form.description || ''}
              onChange={(e) => set({ description: e.target.value })}
              maxLength={200}
              className={INPUT}
            />
          </div>

          {/* Logo：上传到本站 或 直接填外链。
              上传是首选——对方换图/挂站时不会连累我们这边出现裂图 */}
          <div>
            <label className="mb-1 block text-xs text-gray-600">Logo</label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                {form.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo} alt="" className="h-full w-full rounded-lg object-contain p-1" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <input
                value={form.logo || ''}
                onChange={(e) => set({ logo: e.target.value })}
                placeholder="/uploads/links/xxx.png 或 https://..."
                className={INPUT}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <Button
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
                className="shrink-0"
              >
                上传
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-gray-600">展示位</label>
              <select value={form.slot} onChange={(e) => set({ slot: e.target.value })} className={INPUT}>
                {LINK_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {SLOT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">状态</label>
              <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={INPUT}>
                {LINK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">排序（小的在前）</label>
              <input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => set({ sortOrder: parseInt(e.target.value) || 0 })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">出站 rel</label>
              <select
                value={form.nofollow ? '1' : '0'}
                onChange={(e) => set({ nofollow: e.target.value === '1' })}
                disabled={form.slot === 'SPONSOR'}
                className={`${INPUT} disabled:bg-gray-100`}
              >
                <option value="1">nofollow（默认）</option>
                <option value="0">dofollow（传权重）</option>
              </select>
              {form.slot === 'SPONSOR' && (
                <p className="mt-1 text-[11px] text-gray-400">招商位强制 sponsored nofollow，不可改</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">生效时间（留空=立即）</label>
              <input
                type="datetime-local"
                value={toLocalInput(form.startAt)}
                onChange={(e) => set({ startAt: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">到期时间（留空=长期；招商位建议填）</label>
              <input
                type="datetime-local"
                value={toLocalInput(form.endAt)}
                onChange={(e) => set({ endAt: e.target.value })}
                className={INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">联系方式（仅后台可见）</label>
              <input value={form.contact || ''} onChange={(e) => set({ contact: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">备注 / 拒绝理由（仅后台可见）</label>
              <input value={form.remark || ''} onChange={(e) => set({ remark: e.target.value })} className={INPUT} />
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button onClick={save} loading={saving}>
              {saving ? '保存中' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
