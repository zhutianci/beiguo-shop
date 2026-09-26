'use client'

/**
 * /admin/audit：审计日志（仅超管，设计 12.2、13.2）。按渠道、身份、动作、结果、对象编号、时间筛选；
 * 顶部两块汇总：近 7 天越权拒绝（DENIED）按动作 / 原因、近 30 天各渠道交付凭据查看量（card.view，S7 追溯卡密被先用时对照）。
 * 这里能看到原始 diff、IP、UA、原因原文——渠道侧的操作日志只有 publicDiff。
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, Modal, Notice, fmtTime, useApi } from './common'

interface Row {
  id: number
  at: string
  actorKind: string
  actorUserId: number | null
  actor: string | null
  tenantId: number | null
  tenantCode: string | null
  action: string
  targetType: string | null
  targetId: string | null
  result: string
  reasonCode: string | null
  reason: string | null
  diff: unknown
  publicDiff: unknown
  ip: string | null
  ua: string | null
}
interface Resp {
  total: number
  rows: Row[]
  summary?: { denied7d: { action: string; reasonCode: string | null; count: number }[]; cardViews30d: { tenantId: number | null; code: string | null; count: number }[] }
}

const KIND_LABEL: Record<string, string> = { PLATFORM: '平台', TENANT: '渠道', SYSTEM: '系统', BUYER: '买家' }

export default function AuditView() {
  const [f, setF] = useState({ tenantId: '', actorKind: '', action: '', result: '', targetId: '' })
  const [applied, setApplied] = useState(f)
  const [page, setPage] = useState(1)
  const qs = new URLSearchParams({ page: String(page), pageSize: '50', summary: page === 1 ? '1' : '0' })
  Object.entries(applied).forEach(([k, v]) => v && qs.set(k, v))
  const { data, error, loading } = useApi<Resp>(`/api/admin/audit?${qs.toString()}`)
  const [show, setShow] = useState<Row | null>(null)
  const pages = data ? Math.max(1, Math.ceil(data.total / 50)) : 1
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="space-y-4">
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>近 7 天越权拒绝（DENIED）</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {data.summary.denied7d.length === 0 ? (
                <div className="text-gray-400">无</div>
              ) : (
                data.summary.denied7d.map((d, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-50 py-1">
                    <span>
                      {d.action} {d.reasonCode && <Badge>{d.reasonCode}</Badge>}
                    </span>
                    <span>{d.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>近 30 天交付凭据查看量（card.view）</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {data.summary.cardViews30d.length === 0 ? (
                <div className="text-gray-400">无</div>
              ) : (
                data.summary.cardViews30d.map((d, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-50 py-1">
                    <span>{d.code ?? `#${d.tenantId}`}</span>
                    <span>{d.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>审计日志</CardTitle>
          <div className="flex flex-wrap gap-2 text-sm">
            <input className="w-24 rounded-lg border border-gray-300 px-2 py-1.5" placeholder="渠道 id" value={f.tenantId} onChange={set('tenantId')} />
            <select className="rounded-lg border border-gray-300 px-2 py-1.5" value={f.actorKind} onChange={set('actorKind')}>
              <option value="">全部身份</option>
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input className="w-36 rounded-lg border border-gray-300 px-2 py-1.5" placeholder="动作前缀，如 listing." value={f.action} onChange={set('action')} />
            <select className="rounded-lg border border-gray-300 px-2 py-1.5" value={f.result} onChange={set('result')}>
              <option value="">全部结果</option>
              <option value="OK">OK</option>
              <option value="DENIED">DENIED</option>
              <option value="ERROR">ERROR</option>
            </select>
            <input className="w-40 rounded-lg border border-gray-300 px-2 py-1.5" placeholder="对象编号" value={f.targetId} onChange={set('targetId')} />
            <Button
              size="sm"
              onClick={() => {
                setApplied(f)
                setPage(1)
              }}
            >
              查询
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Notice kind="error">{error}</Notice>}
          {loading && !data ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">时间</th>
                  <th className="py-2">身份 / 操作人</th>
                  <th className="py-2">渠道</th>
                  <th className="py-2">动作</th>
                  <th className="py-2">对象</th>
                  <th className="py-2">结果</th>
                  <th className="py-2">IP</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-1.5 whitespace-nowrap">{fmtTime(r.at)}</td>
                    <td className="py-1.5">
                      {KIND_LABEL[r.actorKind] ?? r.actorKind} {r.actor && <span className="text-gray-500">{r.actor}</span>}
                    </td>
                    <td className="py-1.5">{r.tenantCode ?? (r.tenantId ? `#${r.tenantId}` : '—')}</td>
                    <td className="py-1.5 font-mono">{r.action}</td>
                    <td className="py-1.5">
                      {r.targetType ?? ''} {r.targetId ?? ''}
                    </td>
                    <td className="py-1.5">
                      {r.result === 'OK' ? <Badge tone="bg-green-100 text-green-700">OK</Badge> : <Badge tone="bg-red-100 text-red-700">{r.result}</Badge>} {r.reasonCode}
                    </td>
                    <td className="py-1.5">{r.ip ?? ''}</td>
                    <td className="py-1.5 text-right">
                      <button className="text-primary-600 hover:underline" onClick={() => setShow(r)}>
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <span className="text-gray-500">
              共 {data?.total ?? 0} 条 · 第 {page}/{pages} 页
            </span>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一页
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>
      {show && (
        <Modal title={`审计 #${show.id} · ${show.action}`} onClose={() => setShow(null)} wide>
          <div className="space-y-3 text-xs">
            <div>原因：{show.reason ?? '—'}</div>
            <div>UA：{show.ua ?? '—'}</div>
            <div>
              <div className="mb-1 font-medium">diff（仅超管）</div>
              <pre className="max-h-72 overflow-auto rounded bg-gray-50 p-2">{JSON.stringify(show.diff, null, 2)}</pre>
            </div>
            <div>
              <div className="mb-1 font-medium">publicDiff（渠道在操作日志里看到的内容）</div>
              <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2">{JSON.stringify(show.publicDiff, null, 2)}</pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
