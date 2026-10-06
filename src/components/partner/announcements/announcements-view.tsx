'use client'

/**
 * 渠道后台「店铺公告」（docs/多渠道分销-渠道品牌与公告.md 第 5 节）：发布只在本店前台弹窗展示的公告。仅 OWNER（settings.write）；
 * 暂停营业时只读。读写 /api/partner/announcements（列表 / 新建）与 /api/partner/announcements/[id]（修改 / 删除）。
 *
 * 前台规则（与主站公告相同）：同一时刻只展示一条——「强提醒」优先，其次最新发布的；普通公告买家看过就不再提示，内容修改后会重新提示；
 * 强提醒每次进入都提示。SEO 重构 B 包起前台不再全屏弹窗，改为页面底部可关闭提示条（components/announcement-modal.tsx）。被平台下架的公告不展示、不能启用。
 */
import { useCallback, useEffect, useState } from 'react'
import { gotoLogin, partnerApi } from '../common/api'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputCls, Loading, Modal, Notice, PageTitle } from '../common/ui'

interface Row {
  announcementNo: string
  title: string
  body: string
  level: 'INFO' | 'WARN' | 'SUCCESS' | string
  enabled: boolean
  pinned: boolean
  blocked: boolean
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
  live: boolean
}

interface Draft {
  no: string | null
  title: string
  body: string
  level: 'INFO' | 'WARN' | 'SUCCESS'
  enabled: boolean
  pinned: boolean
  startAt: string
  endAt: string
}

const LEVEL_LABEL: Record<string, string> = { INFO: '通知', WARN: '警示', SUCCESS: '喜报' }
const EMPTY: Draft = { no: null, title: '', body: '', level: 'INFO', enabled: true, pinned: false, startAt: '', endAt: '' }

/** ISO → datetime-local 的本地时间字符串 */
function toLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : ''
}

export function AnnouncementsView({ readOnly }: { readOnly?: boolean }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState('')
  const writable = !readOnly

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ rows: Row[] }>('/api/partner/announcements')
    if (r.ok) setRows(r.data.rows)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    if (!draft) return
    setBusy('save')
    setMsg(null)
    const body = {
      title: draft.title,
      body: draft.body,
      level: draft.level,
      enabled: draft.enabled,
      pinned: draft.pinned,
      // datetime-local 是本地时间；转成 ISO 交给服务端（空 = 不限）
      startAt: draft.startAt ? new Date(draft.startAt).toISOString() : null,
      endAt: draft.endAt ? new Date(draft.endAt).toISOString() : null,
    }
    const r = draft.no
      ? await partnerApi<{ row: Row }>(`/api/partner/announcements/${draft.no}`, { method: 'PUT', body })
      : await partnerApi<{ row: Row }>('/api/partner/announcements', { method: 'POST', body })
    setBusy('')
    if (r.ok) {
      setDraft(null)
      setMsg({ tone: 'green', text: draft.no ? '公告已修改' : '公告已发布' })
      load()
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  const toggle = async (row: Row) => {
    setBusy(`t${row.announcementNo}`)
    setMsg(null)
    const r = await partnerApi<{ row: Row }>(`/api/partner/announcements/${row.announcementNo}`, {
      method: 'PUT',
      body: { title: row.title, body: row.body, level: row.level, enabled: !row.enabled, pinned: row.pinned, startAt: row.startAt, endAt: row.endAt },
    })
    setBusy('')
    if (r.ok) load()
    else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  const remove = async (row: Row) => {
    if (!confirm(`删除公告「${row.title}」？删除后不可恢复。`)) return
    setBusy(`d${row.announcementNo}`)
    setMsg(null)
    const r = await partnerApi(`/api/partner/announcements/${row.announcementNo}`, { method: 'DELETE', body: {} })
    setBusy('')
    if (r.ok) {
      setMsg({ tone: 'green', text: '已删除' })
      load()
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="店铺公告"
        desc="发布后在本店前台页面底部以提示条展示（只显示标题，点「查看详情」看全文），只有你的店铺能看到。同一时刻只展示一条：强提醒优先，其次最新发布的。"
        extra={
          writable ? (
            <Button variant="primary" onClick={() => setDraft({ ...EMPTY })}>
              发布公告
            </Button>
          ) : null
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Card>
          <Empty text="还没有公告" />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.announcementNo}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{row.title}</span>
                    <Badge tone={row.level === 'WARN' ? 'amber' : row.level === 'SUCCESS' ? 'green' : 'blue'}>{LEVEL_LABEL[row.level] ?? row.level}</Badge>
                    {row.pinned && <Badge tone="red">强提醒</Badge>}
                    {row.blocked ? <Badge tone="red">已被平台下架</Badge> : row.live ? <Badge tone="green">展示中</Badge> : row.enabled ? <Badge>未到 / 已过展示时间</Badge> : <Badge>未启用</Badge>}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-600">{row.body}</p>
                  <div className="text-xs text-gray-400">
                    {row.startAt || row.endAt ? `展示时间：${fmt(row.startAt) || '立即'} 至 ${fmt(row.endAt) || '长期'} · ` : ''}
                    更新于 {fmt(row.updatedAt)}
                  </div>
                </div>
                {writable && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!row.blocked && (
                      <Button size="sm" onClick={() => toggle(row)} loading={busy === `t${row.announcementNo}`}>
                        {row.enabled ? '停用' : '启用'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() =>
                        setDraft({
                          no: row.announcementNo,
                          title: row.title,
                          body: row.body,
                          level: (['INFO', 'WARN', 'SUCCESS'].includes(row.level) ? row.level : 'INFO') as Draft['level'],
                          enabled: row.blocked ? false : row.enabled,
                          pinned: row.pinned,
                          startAt: toLocal(row.startAt),
                          endAt: toLocal(row.endAt),
                        })
                      }
                    >
                      修改
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(row)} loading={busy === `d${row.announcementNo}`}>
                      删除
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!draft}
        title={draft?.no ? '修改公告' : '发布公告'}
        onClose={() => setDraft(null)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDraft(null)}>取消</Button>
            <Button variant="primary" onClick={save} loading={busy === 'save'} disabled={!draft?.title.trim() || !draft?.body.trim()}>
              保存
            </Button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3">
            <Field label="标题" hint={`${Array.from(draft.title.trim()).length}/100`}>
              <input className={inputCls} value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="如：国庆期间发货时间调整" />
            </Field>
            <Field label="内容" hint={`纯文本，换行会原样显示（${Array.from(draft.body.trim()).length}/2000）`}>
              <textarea className={inputCls + ' min-h-[140px]'} value={draft.body} maxLength={4000} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="类型">
                <select className={inputCls} value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as Draft['level'] })}>
                  <option value="INFO">通知</option>
                  <option value="WARN">警示</option>
                  <option value="SUCCESS">喜报</option>
                </select>
              </Field>
              <Field label="开始展示（可空）">
                <input className={inputCls} type="datetime-local" value={draft.startAt} onChange={(e) => setDraft({ ...draft, startAt: e.target.value })} />
              </Field>
              <Field label="结束展示（可空）">
                <input className={inputCls} type="datetime-local" value={draft.endAt} onChange={(e) => setDraft({ ...draft, endAt: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
                启用（保存后立即按展示时间生效）
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} />
                强提醒（买家每次进入都出现底部提示条，不能「不再提示」）
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
