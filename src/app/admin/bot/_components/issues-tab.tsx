'use client'

/**
 * 「提卡与补货」标签（docs/微信机器人-设计.md §8、§9、§14）：两张表都是机器人写的，这里只读。
 *  · 提卡记录（bot_card_issues）：顶部是今日已提张数 / 金额与每日上限，一眼看出离上限还有多远；
 *    订单号点进后台订单详情（/admin/orders?orderId=<订单 id>，订单页按这个参数直接打开详情弹窗）；
 *  · 补货记录（bot_action_tokens，RESTOCK）：链接状态、谁在哪个群发起、使用时间与 IP、导入结果摘要。
 * 每周抽查一次提卡记录（§19 第 8 条）：发现不认识的记录，立刻到「概览」锁定。
 */
import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IssueListDTO, RestockListDTO, RestockRowDTO, RestockState } from '../types'
import { Badge, bjTime, KIND_LABEL, Note, Pager, TableWrap, tdCls, thCls, useApi, yuan, type Tone } from './shared'

const PAGE_SIZE = 20

const RESTOCK_STATE: Record<RestockState, { text: string; tone: Tone }> = {
  PENDING: { text: '待使用', tone: 'blue' },
  USED: { text: '已使用', tone: 'green' },
  REVOKED: { text: '已作废', tone: 'gray' },
  EXPIRED: { text: '已过期', tone: 'gray' },
}

/** 补货参数 / 结果里常见的键 → 中文；不认识的键原样显示 */
const RESULT_KEY: Record<string, string> = {
  productId: '商品 ID',
  botCode: '货号',
  total: '提交',
  created: '导入',
  imported: '导入',
  skipped: '跳过',
  duplicates: '重复',
  stock: '库存',
  stockAfter: '导入后库存',
  waiting: '等卡订单',
  batch: '批次',
}

function simpleLine(o: Record<string, string | number | boolean | null> | null): string {
  if (!o) return ''
  return Object.keys(o)
    .map((k) => `${RESULT_KEY[k] ?? k}：${o[k] === null ? '—' : typeof o[k] === 'boolean' ? (o[k] ? '是' : '否') : String(o[k])}`)
    .join(' · ')
}

function convLabel(name: string | null, kind: string | null): string {
  const k = kind ? KIND_LABEL[kind] ?? kind : ''
  return `${name || '未命名'}${k ? `（${k}）` : ''}`
}

export function IssuesTab() {
  const [type, setType] = useState<'issue' | 'restock'>('issue')
  const [page, setPage] = useState(1)
  const res = useApi<IssueListDTO | RestockListDTO>(`/api/admin/bot/issues?type=${type}&page=${page}&pageSize=${PAGE_SIZE}`)
  const data = res.data && res.data.type === type ? res.data : null

  const switchType = (t: 'issue' | 'restock') => {
    if (t === type) return
    setType(t)
    setPage(1)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(
            [
              ['issue', '提卡记录'],
              ['restock', '补货记录'],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={cn('rounded-md px-3 py-1 text-sm', type === t ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800')}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => void res.reload()}>
          <RefreshCw className={cn('mr-1 h-4 w-4', res.loading && 'animate-spin')} /> 刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {res.err && <Note tone="err">{res.err}</Note>}
        {!data ? (
          <div className="py-10 text-center text-gray-400">{res.err ? '加载失败' : '加载中...'}</div>
        ) : data.type === 'issue' ? (
          <IssueTable data={data} />
        ) : (
          <RestockTable data={data} />
        )}
        {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </CardContent>
    </Card>
  )
}

function IssueTable({ data }: { data: IssueListDTO }) {
  const t = data.today
  const caps = data.caps
  const qtyFull = !!caps && t.quantity >= caps.issuePerDay
  const amtFull = !!caps && t.amount >= caps.issueAmountPerDay
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={cn('rounded-xl border p-3', qtyFull ? 'border-red-200 bg-red-50' : 'border-gray-200')}>
          <div className="text-xs text-gray-500">今日已提张数（北京时间）</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {t.quantity}
            {caps && <span className="text-sm font-normal text-gray-500"> / 上限 {caps.issuePerDay} 张</span>}
          </div>
        </div>
        <div className={cn('rounded-xl border p-3', amtFull ? 'border-red-200 bg-red-50' : 'border-gray-200')}>
          <div className="text-xs text-gray-500">今日已提金额</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {yuan(t.amount)}
            {caps && <span className="text-sm font-normal text-gray-500"> / 上限 {yuan(caps.issueAmountPerDay)}</span>}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-3">
          <div className="text-xs text-gray-500">今日提卡次数</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{t.count} 次</div>
          <div className="text-xs text-gray-500">{caps ? `单次最多 ${caps.issuePerCommand} 张` : '配置读取失败，上限未知'}</div>
        </div>
      </div>
      <p className="text-xs text-gray-500">上限在「设置」里改。提卡单计入成交与利润、不发买家邮件、不进首页实时成交；撤销请到订单详情按现有流程取消订单、停用未兑换的卡。</p>
      {data.list.length === 0 ? (
        <div className="py-8 text-center text-gray-400">还没有提卡记录</div>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[960px] text-sm text-gray-800">
            <thead>
              <tr className="border-b">
                <th className={thCls}>时间</th>
                <th className={thCls}>订单号</th>
                <th className={thCls}>商品</th>
                <th className={cn(thCls, 'text-right')}>数量</th>
                <th className={cn(thCls, 'text-right')}>单价</th>
                <th className={cn(thCls, 'text-right')}>金额</th>
                <th className={cn(thCls, 'text-right')}>成本</th>
                <th className={cn(thCls, 'text-right')}>利润</th>
                <th className={thCls}>管理员</th>
                <th className={thCls}>发起的会话</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className={cn(tdCls, 'whitespace-nowrap text-xs text-gray-500')}>{bjTime(r.createdAt, true)}</td>
                  <td className={tdCls}>
                    <Link href={`/admin/orders?orderId=${r.orderId}`} className="font-mono text-xs text-primary-600 hover:underline">
                      {r.orderNo}
                    </Link>
                  </td>
                  <td className={cn(tdCls, 'min-w-[10rem]')}>
                    <div>{r.productName || `商品 #${r.productId}`}</div>
                    {r.botCode && <div className="font-mono text-[11px] text-gray-400">{r.botCode}</div>}
                  </td>
                  <td className={cn(tdCls, 'text-right')}>
                    {r.quantity}
                    {r.cardCount != null && r.cardCount !== r.quantity && <div className="text-[11px] text-red-500">发卡 {r.cardCount} 张</div>}
                  </td>
                  <td className={cn(tdCls, 'text-right whitespace-nowrap')}>{yuan(r.unitPrice)}</td>
                  <td className={cn(tdCls, 'text-right whitespace-nowrap font-medium')}>{yuan(r.amount)}</td>
                  <td className={cn(tdCls, 'text-right whitespace-nowrap text-gray-500')}>{yuan(r.costTotal)}</td>
                  <td className={cn(tdCls, 'text-right whitespace-nowrap', r.profit != null && r.profit < 0 ? 'text-red-600' : 'text-gray-900')}>{yuan(r.profit)}</td>
                  <td className={cn(tdCls, 'whitespace-nowrap')}>{r.adminName || '—'}</td>
                  <td className={cn(tdCls, 'text-xs')}>{convLabel(r.conversationName, r.conversationKind)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  )
}

function RestockTable({ data }: { data: RestockListDTO }) {
  return (
    <>
      <p className="text-xs text-gray-500">补货链接 5 分钟有效、成功提交后作废；锁定机器人、解绑发起的群、停用发起的管理员都会作废还没用的链接。</p>
      {data.list.length === 0 ? (
        <div className="py-8 text-center text-gray-400">还没有补货记录</div>
      ) : (
        <TableWrap>
          <table className="w-full min-w-[900px] text-sm text-gray-800">
            <thead>
              <tr className="border-b">
                <th className={thCls}>发起时间</th>
                <th className={thCls}>状态</th>
                <th className={thCls}>商品</th>
                <th className={thCls}>管理员</th>
                <th className={thCls}>发起的会话</th>
                <th className={thCls}>使用</th>
                <th className={thCls}>结果</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((r) => (
                <RestockRow key={r.id} r={r} />
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </>
  )
}

function RestockRow({ r }: { r: RestockRowDTO }) {
  const st = RESTOCK_STATE[r.state] ?? { text: r.state, tone: 'gray' as Tone }
  const params = simpleLine(r.params)
  const result = simpleLine(r.result)
  return (
    <tr className="border-b">
      <td className={cn(tdCls, 'whitespace-nowrap text-xs text-gray-500')}>
        {bjTime(r.createdAt, true)}
        <div className="text-[11px] text-gray-400">有效至 {bjTime(r.expiresAt)}</div>
      </td>
      <td className={tdCls}>
        <Badge tone={st.tone}>{st.text}</Badge>
        {r.revokedAt && <div className="mt-0.5 text-[11px] text-gray-400">{bjTime(r.revokedAt)} 作废</div>}
      </td>
      <td className={cn(tdCls, 'min-w-[8rem]')}>
        {r.productName || <span className="text-gray-400">{params ? '—' : '未指定（打开后再选）'}</span>}
        {params && <div className="break-words text-[11px] text-gray-400">{params}</div>}
      </td>
      <td className={cn(tdCls, 'whitespace-nowrap')}>{r.adminName || '—'}</td>
      <td className={cn(tdCls, 'text-xs')}>{convLabel(r.conversationName, r.conversationKind)}</td>
      <td className={cn(tdCls, 'whitespace-nowrap text-xs')}>
        {r.usedAt ? (
          <>
            <div>{bjTime(r.usedAt, true)}</div>
            {r.usedIp && <div className="font-mono text-[11px] text-gray-400">{r.usedIp}</div>}
          </>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className={cn(tdCls, 'min-w-[10rem] break-words text-xs text-gray-600')}>{result || <span className="text-gray-400">—</span>}</td>
    </tr>
  )
}
