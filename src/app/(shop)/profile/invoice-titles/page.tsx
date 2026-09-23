'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, BookUser, Plus, Pencil, Trash2, Star, X, AlertCircle } from 'lucide-react'

/**
 * 抬头管理（个人中心 → 快捷功能 → 抬头管理）。
 *
 * 【这一页只管「以后想用什么抬头」，不管「历史发票开成了什么样」】
 * 删掉一条抬头不会动已经提交的发票 —— 那些发票把抬头整份快照在 invoices 表里。
 * 页面上把这句话说清楚，否则买家会以为删抬头等于撤销发票。
 */

interface TitleRow {
  id: number
  title: string
  taxNumber: string
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  isDefault: boolean
}

const EMPTY = {
  title: '',
  taxNumber: '',
  address: '',
  phone: '',
  bankName: '',
  bankAccount: '',
  email: '',
}

export default function InvoiceTitlesPage() {
  const [list, setList] = useState<TitleRow[]>([])
  const [limit, setLimit] = useState(30)
  const [loading, setLoading] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)
  const [editing, setEditing] = useState<TitleRow | 'new' | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/invoice-titles')
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      const d = await res.json()
      if (d?.success) {
        setList(d.data.list || [])
        setLimit(d.data.limit || 30)
      }
    } catch {
      /* 网络问题就保持空列表，下面会显示「还没有抬头」 */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setDefault = async (id: number) => {
    await fetch(`/api/invoice-titles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    load()
  }

  const remove = async (row: TitleRow) => {
    if (!confirm(`删除抬头「${row.title}」？\n\n已经提交过的发票不受影响，只是下次开票不再出现在候选里。`)) return
    await fetch(`/api/invoice-titles/${row.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[128px]" />

      <div className="container relative max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          个人中心
        </Link>

        <header className="mb-6 mt-5">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <BookUser className="h-6 w-6 text-indigo-400" />
            抬头管理
          </h1>
          <p className="mt-2 text-sm text-white/45">
            存好常用抬头，下单勾选开发票或事后补开时一键填入，最多 {limit} 条。
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-16 text-white/30">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : needLogin ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">登录后管理你的开票抬头</p>
            <Link
              href="/login?redirect=/profile/invoice-titles"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-medium"
            >
              去登录
            </Link>
          </div>
        ) : (
          <>
            <button
              onClick={() => setEditing('new')}
              disabled={list.length >= limit}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-2.5 text-sm font-medium transition-all hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              新增抬头
            </button>
            {list.length >= limit && (
              <p className="mb-4 text-xs text-amber-300/80">已达上限 {limit} 条，请先删掉不用的。</p>
            )}

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
                <p className="text-sm text-white/45">还没有保存抬头</p>
                <p className="mt-1 text-xs text-white/30">开票时勾选「保存这个抬头」也会自动出现在这里</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {list.map((t) => (
                  <li key={t.id} className="rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[17px] font-semibold text-white/90">{t.title}</span>
                          {t.isDefault && (
                            <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                              默认
                            </span>
                          )}
                        </div>
                        <div className="mt-1 break-all font-mono text-[13px] text-white/50">{t.taxNumber}</div>
                        {(t.address || t.phone) && (
                          <div className="mt-1 truncate text-xs text-white/35">
                            {[t.address, t.phone].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {(t.bankName || t.bankAccount) && (
                          <div className="mt-0.5 truncate text-xs text-white/35">
                            {[t.bankName, t.bankAccount].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {t.email && <div className="mt-0.5 truncate text-xs text-white/35">{t.email}</div>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!t.isDefault && (
                          <button
                            onClick={() => setDefault(t.id)}
                            title="设为默认"
                            className="rounded-lg p-2 text-white/35 transition-colors hover:bg-white/10 hover:text-amber-300"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditing(t)}
                          title="编辑"
                          className="rounded-lg p-2 text-white/35 transition-colors hover:bg-white/10 hover:text-white/80"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(t)}
                          title="删除"
                          className="rounded-lg p-2 text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-6 text-xs leading-relaxed text-white/30">
              这里存的只是「下次开票想用什么」。删除或修改不会影响已经提交的发票 ——
              那些发票在提交时就把抬头完整存档了。
            </p>
          </>
        )}
      </div>

      {editing && (
        <TitleModal
          row={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function TitleModal({
  row,
  onClose,
  onSaved,
}: {
  row: TitleRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState(
    row
      ? {
          title: row.title,
          taxNumber: row.taxNumber,
          address: row.address || '',
          phone: row.phone || '',
          bankName: row.bankName || '',
          bankAccount: row.bankAccount || '',
          email: row.email || '',
        }
      : { ...EMPTY }
  )
  const [isDefault, setIsDefault] = useState(row?.isDefault ?? false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!f.title.trim()) return setErr('请填写抬头')
    if (!f.taxNumber.trim()) return setErr('请填写税号')
    setSaving(true)
    try {
      const res = await fetch(row ? `/api/invoice-titles/${row.id}` : '/api/invoice-titles', {
        method: row ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: f.title.trim(),
          taxNumber: f.taxNumber.trim(),
          address: f.address.trim() || null,
          phone: f.phone.trim() || null,
          bankName: f.bankName.trim() || null,
          bankAccount: f.bankAccount.trim() || null,
          email: f.email.trim() || null,
          isDefault,
        }),
      })
      const d = await res.json()
      if (d?.success) return onSaved()
      setErr(d?.error || '保存失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const field = (
    label: string,
    key: keyof typeof EMPTY,
    opts?: { required?: boolean; placeholder?: string; type?: string }
  ) => (
    <div>
      <label className="mb-1 block text-xs text-white/50">
        {label}
        {opts?.required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        value={f[key]}
        onChange={(e) => setF((v) => ({ ...v, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-500/50"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 lg:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <BookUser className="h-5 w-5 text-indigo-400" />
            {row ? '编辑抬头' : '新增抬头'}
          </h3>
          <button onClick={onClose} className="glass flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{field('抬头', 'title', { required: true, placeholder: '公司名称 / 个人' })}</div>
          <div className="sm:col-span-2">
            {field('税号', 'taxNumber', { required: true, placeholder: '纳税人识别号（带空格会自动去掉）' })}
          </div>
          {field('地址', 'address', { placeholder: '选填' })}
          {field('电话', 'phone', { placeholder: '选填' })}
          {field('开户行', 'bankName', { placeholder: '选填' })}
          {field('卡号', 'bankAccount', { placeholder: '选填' })}
          <div className="sm:col-span-2">
            {field('默认接收邮箱', 'email', { type: 'email', placeholder: '选填，开票时可改' })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDefault((v) => !v)}
          className="mt-3 flex items-center gap-2 text-left text-xs text-white/50 hover:text-white/70"
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              isDefault ? 'border-amber-400 bg-amber-500' : 'border-white/25 bg-white/5'
            }`}
          >
            {isDefault && <Star className="h-2.5 w-2.5" />}
          </span>
          设为默认抬头（开票时自动选中）
        </button>

        {err && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 py-3 font-semibold transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50"
        >
          {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          保存
        </button>
      </div>
    </div>
  )
}
