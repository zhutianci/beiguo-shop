'use client'

/**
 * 「指令日志」标签（docs/微信机器人-设计.md §7.1、§14）：bot_commands 分页，含被忽略的（发送人不是管理员、重复回调等）。
 * 只有 @机器人 的消息、管理员私聊与管理群系统提示会落库——群里的普通聊天从来不记，所以这里没有消息正文，
 * 被忽略的行只有发送人 wxid 与原因。按结果与关键字（指令名 / 发送人 / 原因码 / 参数 / 摘要）筛选。
 */
import { useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CommandListDTO } from '../types'
import { Badge, bjTime, DECISION, inputCls, KIND_LABEL, Note, Pager, REASON_TEXT, TableWrap, tdCls, thCls, useApi } from './shared'

const PAGE_SIZE = 30

export function CommandsTab() {
  const [decision, setDecision] = useState('')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const sp = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  if (decision) sp.set('decision', decision)
  if (q) sp.set('q', q)
  const res = useApi<CommandListDTO>(`/api/admin/bot/commands?${sp.toString()}`)
  const data = res.data

  const search = (e?: React.FormEvent) => {
    e?.preventDefault()
    setQ(qInput.trim())
    setPage(1)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>指令日志</CardTitle>
        <Button variant="outline" size="sm" onClick={() => void res.reload()}>
          <RefreshCw className={cn('mr-1 h-4 w-4', res.loading && 'animate-spin')} /> 刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={search} className="flex flex-wrap items-center gap-2">
          <select
            value={decision}
            onChange={(e) => {
              setDecision(e.target.value)
              setPage(1)
            }}
            className={inputCls}
          >
            <option value="">全部结果</option>
            {Object.keys(DECISION).map((k) => (
              <option key={k} value={k}>
                {DECISION[k].text}（{k}）
              </option>
            ))}
          </select>
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            maxLength={50}
            placeholder="指令名 / 发送人 wxid 或昵称 / 原因码 / 参数"
            className={cn(inputCls, 'min-w-0 flex-1 sm:max-w-sm')}
          />
          <Button type="submit" variant="outline" size="sm">
            <Search className="mr-1 h-4 w-4" /> 搜索
          </Button>
          {(q || decision) && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:underline"
              onClick={() => {
                setQInput('')
                setQ('')
                setDecision('')
                setPage(1)
              }}
            >
              清除筛选
            </button>
          )}
        </form>
        <p className="text-xs text-gray-500">
          「忽略」多是非管理员 @了机器人（不回复、只记一行）；「拒绝」是管理员发的指令没执行（看原因）。出现不认识的「成功」提卡或改设置，立刻到「概览」锁定。
        </p>
        {res.err && <Note tone="err">{res.err}</Note>}

        {!data ? (
          <div className="py-10 text-center text-gray-400">{res.err ? '加载失败' : '加载中...'}</div>
        ) : data.list.length === 0 ? (
          <div className="py-10 text-center text-gray-400">没有记录</div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[960px] text-sm text-gray-800">
              <thead>
                <tr className="border-b">
                  <th className={thCls}>时间</th>
                  <th className={thCls}>会话</th>
                  <th className={thCls}>发送人</th>
                  <th className={thCls}>管理员</th>
                  <th className={thCls}>指令</th>
                  <th className={thCls}>结果</th>
                  <th className={thCls}>说明</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((r) => {
                  const d = DECISION[r.decision] ?? { text: r.decision, tone: 'gray' as const }
                  return (
                    <tr key={r.id} className="border-b">
                      <td className={cn(tdCls, 'whitespace-nowrap text-xs text-gray-500')}>
                        {bjTime(r.createdAt, true)}
                        <div className="text-[11px] text-gray-400">#{r.id}</div>
                      </td>
                      <td className={cn(tdCls, 'min-w-[9rem] max-w-[14rem]')}>
                        {r.conversationId ? (
                          <>
                            <div className="break-words">
                              #{r.conversationId} {r.conversationName || '未命名'}
                            </div>
                            {r.conversationKind && <div className="text-[11px] text-gray-400">{KIND_LABEL[r.conversationKind] ?? r.conversationKind}</div>}
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-gray-500">未登记的会话</div>
                            <div className="break-all font-mono text-[11px] text-gray-400">{r.convExternalId}</div>
                          </>
                        )}
                      </td>
                      <td className={cn(tdCls, 'min-w-[8rem] max-w-[12rem]')}>
                        {r.kind === 'SYSTEM' ? (
                          <span className="text-xs text-gray-500">系统提示</span>
                        ) : (
                          <>
                            {r.senderName && <div className="break-words">{r.senderName}</div>}
                            <div className="break-all font-mono text-[11px] text-gray-400">{r.senderWxid || '—'}</div>
                          </>
                        )}
                      </td>
                      <td className={cn(tdCls, 'whitespace-nowrap')}>{r.adminName || <span className="text-gray-400">—</span>}</td>
                      <td className={cn(tdCls, 'min-w-[8rem] max-w-[14rem]')}>
                        {r.name ? <span className="font-medium">{r.name}</span> : <span className="text-gray-400">—</span>}
                        {r.argsText && <div className="break-all font-mono text-[11px] text-gray-500">{r.argsText}</div>}
                      </td>
                      <td className={cn(tdCls, 'whitespace-nowrap')}>
                        <Badge tone={d.tone}>{d.text}</Badge>
                        {r.reasonCode && <div className="mt-0.5 text-[11px] text-gray-500">{REASON_TEXT[r.reasonCode] ?? r.reasonCode}</div>}
                      </td>
                      <td className={cn(tdCls, 'min-w-[10rem] break-words text-xs text-gray-600')}>{r.resultSummary || <span className="text-gray-400">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
        {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </CardContent>
    </Card>
  )
}
