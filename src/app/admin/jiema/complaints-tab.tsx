'use client'

/**
 * 短信接码后台 ·「售后」（docs/短信接码-设计.md §7.5、E17；S3）：售后申请列表（待处理在前、先到先处理）+ 详情 + 两个操作。
 *
 * 【列表】每条显示订单、组合、买家原因与说明、号码能不能再次收码、**该用户 30 天内已通过 N 次**（号码不支持再次收码的不计入；达到 passLimit 标红，人工酌情）。
 *   顶部规则提示里的售后窗口与次数上限取接口下发的当前配置（complaintWindowH / passLimit），不写死。
 * 【详情】订单与接码单摘要、每个号（能不能再次收码）、短信内容（打开详情写一条 ADMIN_VIEW 事件）、订单留言（复用后台留言面板）、
 *   **向上游申诉的提示与截止时间**（号码已被注册、要求 2FA 这类供应商侧问题，7 天内凭截图和录屏申诉；只给站长看，买家侧绝不提上游）。
 * 【操作】「通过并退款到余额」= T16（先放掉 / 完成还开着的号，再整单原路退回余额，成本照计、利润 = −成本），结果自动发到订单留言；
 *   「驳回」必填回复，同一事务发到订单留言。接口 /api/admin/jiema/complaints/**（第一行 adminGuard，处理写审计 jiema.complaint.*）。
 */
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import OrderChat from '@/components/order-chat'
import { RefreshCw, X } from 'lucide-react'

const STATE_ZH: Record<string, string> = { OPEN: '待处理', APPROVING: '退款中（可再点通过）', REFUNDED: '已通过 · 已退款', REJECTED: '已驳回' }
const ORDER_ZH: Record<string, string> = { RECEIVED: '已收码', FINISHED: '已完成', REFUNDED: '售后退款', MANUAL: '人工', CANCELLED: '已取消' }
const yuan = (c: number | null | undefined) => (c == null ? '—' : `${c < 0 ? '-' : ''}¥${(Math.abs(c) / 100).toFixed(2)}`)
const t = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—')

async function send(method: string, url: string, body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    const d = await res.json().catch(() => null)
    return { ok: !!d?.success, status: res.status, data: d }
  } catch {
    return { ok: false, status: 0, data: { error: '网络异常' } }
  }
}

interface Row {
  id: number
  state: string
  reasonText: string
  detail: string | null
  adminNote: string | null
  createdAt: string
  handledAt: string | null
  orderId: number
  orderNo: string | null
  smsOrderId: number
  orderState: string | null
  combo: string
  priceCents: number | null
  user: { id: number; email: string | null; nickname: string | null }
  noResend: boolean
  passed30d: number
}

export function ComplaintsTab({ openId, onOpened, onCountChanged, onOpenOrder }: { openId: number | null; onOpened: () => void; onCountChanged: (n: number) => void; onOpenOrder: (smsOrderId: number) => void }) {
  const [state, setState] = useState<'PENDING' | 'DONE' | 'ALL'>('PENDING')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ list: Row[]; total: number; pendingTotal: number; page: number; totalPages: number; complaintWindowH: number; passLimit: number } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    const r = await send('GET', `/api/admin/jiema/complaints?state=${state}&page=${page}&pageSize=20`)
    if (r.ok) {
      setData(r.data.data)
      onCountChanged(Number(r.data.data.pendingTotal) || 0)
    } else setErr(r.data?.error || '加载失败')
  }, [state, page, onCountChanged])
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    if (openId) {
      setDetailId(openId)
      onOpened()
    }
  }, [openId, onOpened])

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 py-4 text-sm">
          {(
            [
              ['PENDING', '待处理'],
              ['DONE', '已处理'],
              ['ALL', '全部'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => {
                setState(k)
                setPage(1)
              }}
              className={`rounded-full border px-3 py-1 ${state === k ? 'border-primary-500 text-primary-700' : 'border-gray-300 text-gray-600'}`}
            >
              {l}
              {k === 'PENDING' && data && data.pendingTotal > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[11px] text-white">{data.pendingTotal}</span>}
            </button>
          ))}
          {/* 数字取接口下发的当前配置（后台「设置」改了售后窗口这里跟着变），不写死 */}
          <span className="ml-auto text-xs text-gray-500">
            E17：收码后 {data ? data.complaintWindowH : '—'} 小时内可申请（sms_config.complaintWindowH）；同一用户 30 天内通过 {data ? data.passLimit : '—'} 次以内正常受理，超出人工酌情；号码不支持再次收码的放宽受理、不计入次数
          </span>
        </CardContent>
      </Card>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <Card>
          <CardContent className="py-4">
            {data.list.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">暂无</div>
            ) : (
              <div className="w-full overflow-x-auto [contain:inline-size]">
                <table className="w-full min-w-[960px] text-xs">
                  <thead className="text-left text-gray-500">
                    <tr>
                      {['状态', '订单号', '用户', '组合 · 售价', '原因与说明', '再次收码', '30 天内已通过', '订单状态', '提交时间'].map((h) => (
                        <th key={h} className="py-2 pr-3 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.list.map((r) => (
                      <tr key={r.id} onClick={() => setDetailId(r.id)} className="cursor-pointer border-t border-gray-100 align-top hover:bg-gray-50">
                        <td className={`py-2 pr-3 ${r.state === 'OPEN' || r.state === 'APPROVING' ? 'font-medium text-red-600' : 'text-gray-500'}`}>{STATE_ZH[r.state] ?? r.state}</td>
                        <td className="py-2 pr-3 font-mono">{r.orderNo ?? `#${r.orderId}`}</td>
                        <td className="py-2 pr-3">{r.user.email ?? r.user.nickname ?? `#${r.user.id}`}</td>
                        <td className="py-2 pr-3">
                          {r.combo} · {yuan(r.priceCents)}
                        </td>
                        <td className="max-w-[260px] py-2 pr-3">
                          <b>{r.reasonText}</b>
                          <div className="line-clamp-2 break-all text-gray-500">{r.detail ?? '（未填写说明）'}</div>
                        </td>
                        <td className={`py-2 pr-3 ${r.noResend ? 'text-amber-700' : 'text-gray-500'}`}>{r.noResend ? '不支持（放宽受理）' : '支持'}</td>
                        <td className={`py-2 pr-3 ${r.passed30d >= data.passLimit ? 'font-medium text-red-600' : ''}`}>
                          {r.passed30d} 次{r.passed30d >= data.passLimit ? `（已达 ${data.passLimit} 次，超出的人工酌情）` : ''}
                        </td>
                        <td className="py-2 pr-3">{ORDER_ZH[r.orderState ?? ''] ?? r.orderState ?? '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{t(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-600">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">
                上一页
              </button>
              <span>
                {data.page} / {data.totalPages}（共 {data.total} 条）
              </span>
              <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">
                下一页
              </button>
            </div>
          </CardContent>
        </Card>
      )}
      {detailId != null && (
        <ComplaintDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onChanged={() => void load()}
          onOpenOrder={(sid) => {
            setDetailId(null)
            onOpenOrder(sid)
          }}
        />
      )}
    </div>
  )
}

function ComplaintDrawer({ id, onClose, onChanged, onOpenOrder }: { id: number; onClose: () => void; onChanged: () => void; onOpenOrder: (smsOrderId: number) => void }) {
  const [d, setD] = useState<any | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  const load = useCallback(async () => {
    const r = await send('GET', `/api/admin/jiema/complaints/${id}`)
    if (r.ok) setD(r.data.data)
    else setErr(r.data?.error || '加载失败')
  }, [id])
  useEffect(() => {
    void load()
  }, [load])

  const act = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && text.trim().length < 2) {
      setMsg({ ok: false, text: '驳回要填回复（会发到买家的订单留言里）' })
      return
    }
    const confirmText =
      action === 'approve'
        ? d?.moneyDone
          ? '这张单的钱已经退过：只把售后申请记为通过，并给买家发「售后审核通过」留言（不再动钱）。确定吗？'
          : '通过并退款到余额：先放掉 / 完成还开着的号，再整单原路退回余额（成本照计、利润 = −成本），结果自动发到订单留言。确定吗？'
        : '驳回：回复会发到买家的订单留言里。确定吗？'
    if (!window.confirm(confirmText)) return
    setBusy(true)
    setMsg(null)
    const r = await send('POST', `/api/admin/jiema/complaints/${id}`, action === 'approve' ? { action, note: text.trim() || null } : { action, reply: text.trim() })
    setBusy(false)
    setMsg({ ok: r.ok, text: r.data?.message || r.data?.error || (r.ok ? '已完成' : '失败') })
    if (r.ok && r.data?.data?.detail) setD(r.data.data.detail)
    else if (r.data?.data) setD(r.data.data)
    else await load()
    if (r.ok) setText('')
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/30" aria-label="关闭" onClick={onClose} />
      <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-white p-5 text-sm text-gray-700 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">售后申请</h2>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="刷新">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {err && <div className="text-red-600">{err}</div>}
        {!d ? (
          !err && <div className="text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-5">
            {msg && <div className={`rounded border px-3 py-2 ${msg.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{msg.text}</div>}
            <section>
              <div className="font-mono text-base text-gray-900">{d.order?.orderNo ?? '—'}</div>
              <div className="text-gray-500">
                {d.so ? `${d.so.serviceName} · ${d.so.countryName} · ${d.so.operator ?? '任意运营商'} · 售价 ${yuan(d.so.priceCents)} · 付款 ${d.so.payMode}` : '—'} · 订单 {d.so?.state ?? '—'}（{d.order?.payStatus}/{d.order?.deliveryStatus}）
              </div>
              <div className="text-gray-500">
                用户 {d.user.email ?? d.user.nickname ?? `#${d.user.id}`} · 首次收码 {t(d.so?.firstCodeAt)} · 成本 {yuan(d.so?.costCents)}
                {d.so?.costFinal ? '（已定稿）' : '（预估）'}
              </div>
              {d.so && (
                <button onClick={() => onOpenOrder(d.so.id)} className="mt-1 text-xs text-primary-600 hover:underline">
                  打开接码订单详情 →
                </button>
              )}
            </section>

            <section className="rounded border border-gray-200 p-3">
              <div className="mb-1">
                状态 <b className={d.complaint.state === 'OPEN' || d.complaint.state === 'APPROVING' ? 'text-red-600' : 'text-gray-900'}>{STATE_ZH[d.complaint.state] ?? d.complaint.state}</b> · 提交 {t(d.complaint.createdAt)}
                {d.complaint.handledAt && ` · 处理 ${t(d.complaint.handledAt)}`}
              </div>
              <div>
                原因 <b>{d.complaint.reasonText}</b>
              </div>
              <div className="mt-1 whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-gray-700">{d.complaint.detail ?? '（买家没有填写说明）'}</div>
              {d.complaint.adminNote && <div className="mt-1 text-gray-500">客服回复 / 备注：{d.complaint.adminNote}</div>}
              <div className={`mt-2 ${d.passed30d >= d.passLimit ? 'font-medium text-red-600' : 'text-gray-600'}`}>
                该用户 30 天内已通过 {d.passed30d} 次{d.passed30d >= d.passLimit ? `（已达 ${d.passLimit} 次，超出的人工酌情）` : ''}（号码不支持再次收码的不计入）
              </div>
              <div className={d.noResend ? 'text-amber-700' : 'text-gray-600'}>
                {d.noResend ? '这张单的号码不支持再次收码：放宽受理，不计入次数（E17）' : '号码支持再次收码：可以先引导买家在目标平台重新发送验证码'}
              </div>
            </section>

            {d.appealDeadline && (
              <section className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                向上游申诉（只给站长看，买家侧绝不提上游）：号码已被注册、要求 2FA 这类供应商侧问题，可在 <b>{t(d.appealDeadline)}</b> 前凭截图和注册过程录屏向上游客服申请退款；
                申诉结果以每日对账为准（history 变成状态 10 的，按 R6 冲回成本）。
              </section>
            )}

            {(d.actions.approve || d.actions.reject) && (
              <section>
                <h3 className="mb-1 font-medium text-gray-900">处理</h3>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="驳回：必填回复（发到买家的订单留言）；通过：可选备注（随「售后审核通过」一起发到订单留言）"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.actions.approve && (
                    <Button size="sm" disabled={busy} onClick={() => void act('approve')}>
                      {d.moneyDone ? '记为通过（钱已退过，不再动钱）' : '通过并退款到余额'}
                    </Button>
                  )}
                  {d.actions.reject && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void act('reject')}>
                      驳回
                    </Button>
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-1 font-medium text-gray-900">号码</h3>
              {d.attempts.map((a: any) => (
                <div key={a.id} className="border-t border-gray-100 py-1 text-xs">
                  第 {a.seq} 个 · {a.phone ?? '—'} · {a.state} · 短信 {a.smsCount} 条 · 能再次收码 {a.canGetAnotherSms == null ? '—' : a.canGetAnotherSms ? '是' : '否'}
                  {a.charged ? ' · 已扣费' : ''} · 取号 {t(a.respondedAt)}
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">短信（{d.messages.length}）</h3>
              {d.messages.map((m: any) => (
                <div key={m.id} className="border-t border-gray-100 py-1 text-xs">
                  <b className="font-mono">{m.code ?? '—'}</b> {m.text ?? (m.purged ? '（已按保存期清除）' : '')} <span className="text-gray-400">· {m.sender ?? '—'} · {t(m.receivedAt)}</span>
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-1 flex items-center gap-2 font-medium text-gray-900">
                订单留言
                {!chatOpen && d.order?.id && (
                  <button onClick={() => setChatOpen(true)} className="text-xs font-normal text-primary-600 hover:underline">
                    展开
                  </button>
                )}
              </h3>
              {chatOpen && d.order?.id ? <OrderChat apiBase={`/api/admin/orders/${d.order.id}/messages`} selfRole="ADMIN" theme="light" /> : null}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
