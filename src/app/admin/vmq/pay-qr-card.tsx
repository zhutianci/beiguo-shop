'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, QrCode, Trash2, Upload } from 'lucide-react'

interface QrItem {
  id: string
  label: string
  url: string
  addedAt: number | null
  builtin: boolean
}

interface QrView {
  activeId: string
  switchedAt: number | null
  max: number
  items: QrItem[]
  history: { at: number; by: number | null; from: string; to: string }[]
}

/** 等站长输入登录密码后才执行的操作 */
type Pending =
  | { kind: 'switch'; item: QrItem }
  | { kind: 'delete'; item: QrItem }
  | { kind: 'upload'; file: File; label: string }
  | { kind: 'reset' }

function fmtMs(ms: number | null) {
  return ms ? new Date(ms).toLocaleString('zh-CN', { hour12: false }) : '—'
}

/**
 * 收银台收款码：上传多张、一键切换，切换后收银台 3 秒内换成新码（不用重新构建）。
 * 每个写操作都要再输一次登录密码（接口侧强制），并且会推送「收款码变更」。
 */
export function PayQrCard() {
  const [data, setData] = useState<QrView | null>(null)
  const [corrupt, setCorrupt] = useState('')
  const [loadErr, setLoadErr] = useState('')
  const [msg, setMsg] = useState('')
  const [label, setLabel] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const apply = (d: unknown) => {
    const v = d as (QrView & { corrupt?: undefined }) | { corrupt: true; message?: string }
    if (v && 'corrupt' in v && v.corrupt) {
      setCorrupt(v.message || '收款码配置已损坏')
      setData(null)
    } else {
      setCorrupt('')
      setData(v as QrView)
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/vmq/qr')
      const j = await res.json()
      if (j.success) {
        setLoadErr('')
        apply(j.data)
      } else setLoadErr(j.error || '获取收款码失败')
    } catch {
      setLoadErr('获取收款码失败')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (p: Pending, password: string): Promise<string | null> => {
    let res: Response
    if (p.kind === 'upload') {
      const fd = new FormData()
      fd.append('file', p.file)
      fd.append('label', p.label)
      fd.append('password', password)
      res = await fetch('/api/admin/vmq/qr', { method: 'POST', body: fd })
    } else {
      res = await fetch('/api/admin/vmq/qr', {
        method: p.kind === 'delete' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p.kind === 'reset' ? { reset: true, password } : { id: p.item.id, password }),
      })
    }
    const j = await res.json().catch(() => null)
    if (!j?.success) return j?.error || '操作失败'
    apply(j.data)
    setMsg(j.message || '已完成')
    if (p.kind === 'upload') {
      setLabel('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
    }
    return null
  }

  const active = data?.items.find((i) => i.id === data.activeId)
  const uploaded = data ? data.items.filter((i) => !i.builtin).length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" /> 收款码（支付宝）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadErr}</div>}

        {corrupt && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4" /> {corrupt}
            </div>
            <div>收银台现在不显示任何收款码，买家无法付款。点下面的按钮恢复为内置收款码，再重新上传。</div>
            <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'reset' })}>
              恢复为内置收款码
            </Button>
          </div>
        )}

        {data && (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              收银台当前显示：<b>{active?.label ?? '—'}</b>
              {data.switchedAt && <span className="text-green-700">（{fmtMs(data.switchedAt)} 切换）</span>}
            </div>
            {msg && <div className="text-sm text-gray-600">{msg}</div>}

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {data.items.map((it) => {
                const on = it.id === data.activeId
                return (
                  <div key={it.id} className={`rounded-xl border p-3 text-center ${on ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.label} className="mx-auto h-32 w-32 object-contain bg-white rounded" />
                    <div className="mt-2 text-sm font-medium text-gray-900 break-all">{it.label}</div>
                    <div className="text-xs text-gray-400">{it.builtin ? '镜像自带' : `上传于 ${fmtMs(it.addedAt)}`}</div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      {on ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <CheckCircle2 className="w-4 h-4" /> 使用中
                        </span>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => setPending({ kind: 'switch', item: it })}>
                            设为当前
                          </Button>
                          {!it.builtin && (
                            <Button size="sm" variant="outline" title="删除" onClick={() => setPending({ kind: 'delete', item: it })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="text-sm font-medium text-gray-900">
                上传一张新的收款码 <span className="font-normal text-gray-400">（已上传 {uploaded} / {data.max}）</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={30}
                  placeholder="名称，例如：备用号 尾号 5678"
                  className="h-9 w-64 rounded-md border border-gray-300 px-3 text-sm"
                />
                <Button
                  size="sm"
                  disabled={!file || !label.trim() || uploaded >= data.max}
                  onClick={() => file && setPending({ kind: 'upload', file, label: label.trim() })}
                >
                  <Upload className="w-4 h-4 mr-1" /> 上传
                </Button>
              </div>
              <p className="text-xs text-gray-400">PNG / JPG / WebP，不超过 2MB。上传后不会自动生效，核对图片无误再点「设为当前」。</p>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
              <div className="font-medium">切换前请确认</div>
              <div>· 新收款码所属支付宝账号所在的手机，已按上面的方式配置 SmsForwarder 转发；否则钱到了但订单不会自动确认。</div>
              <div>· 切换后收银台约 3 秒内换成新码；已经扫了旧码的买家仍会付到旧账号，旧手机还在转发就照常自动确认。</div>
              <div>· 每次切换 / 上传 / 删除都要输入登录密码，并会推送「收款码变更」。收到不是自己操作的推送，立刻切回并改密码。</div>
            </div>

            {data.history.length > 0 && (
              <div className="text-xs text-gray-500">
                <div className="mb-1 text-gray-400">最近的切换记录</div>
                {data.history.slice(0, 5).map((h, i) => (
                  <div key={i}>
                    {fmtMs(h.at)} · 「{h.from}」→「{h.to}」{h.by ? ` · 管理员 #${h.by}` : ''}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {pending && <PasswordModal pending={pending} onClose={() => setPending(null)} onRun={run} />}
      </CardContent>
    </Card>
  )
}

function PasswordModal({
  pending,
  onClose,
  onRun,
}: {
  pending: Pending
  onClose: () => void
  onRun: (p: Pending, password: string) => Promise<string | null>
}) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const title =
    pending.kind === 'switch'
      ? `把收银台的收款码切换为「${pending.item.label}」`
      : pending.kind === 'delete'
        ? `删除收款码「${pending.item.label}」`
        : pending.kind === 'upload'
          ? `上传收款码「${pending.label}」`
          : '恢复为内置收款码（清空已上传的列表）'

  const submit = async () => {
    if (!password || busy) return
    setBusy(true)
    setErr('')
    const e = await onRun(pending, password).catch(() => '操作失败')
    setBusy(false)
    if (e) setErr(e)
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold text-gray-900">{title}</div>
        {pending.kind === 'switch' && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.item.url} alt={pending.item.label} className="h-24 w-24 object-contain bg-white rounded" />
            <div className="text-xs text-amber-900">
              确认后，买家的钱将付到<b>这张码</b>对应的支付宝账号。请先核对这张图确实是你自己的收款码。
            </div>
          </div>
        )}
        <p className="mt-3 text-sm text-gray-600">请输入当前登录密码确认：</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
        />
        {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button size="sm" onClick={submit} disabled={!password || busy}>
            {busy ? '处理中…' : '确认'}
          </Button>
        </div>
      </div>
    </div>
  )
}
