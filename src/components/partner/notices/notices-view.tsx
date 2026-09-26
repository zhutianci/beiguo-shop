'use client'

/**
 * 通知中心（设计 11.4、12.1）：订单支付、买家留言、售后结果、结算单、打款、进货价调整、自动下架等站内通知；
 * 未读筛选、逐条 / 全部标已读；点「查看」跳到对应的订单 / 结算单 / 商品池 / 售后页面（链接只用公开编号）。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { TENANT_NOTICE_KIND_LABEL, type PartnerNoticeRow } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { cnTime } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Loading, Notice, PageTitle, Pager } from '../common/ui'

/**
 * 通知类型中文名：与推送（企业微信 / 邮件主题）共用 types.ts 的一份（二期新增 CUSTOMER_JOINED / ORDER_DELIVERED 不会漏）。
 * types.ts 是纯常量模块（无 import 副作用），客户端组件可以直接引。
 */
export const NOTICE_KIND_TEXT: Record<string, string> = { ...TENANT_NOTICE_KIND_LABEL }

/** 通知 → 后台页面（与 WP0 notice.ts 推送里的链接同一口径） */
function hrefOf(n: PartnerNoticeRow): string | null {
  const k = n.refKey ? encodeURIComponent(n.refKey) : ''
  switch (n.refType) {
    case 'order':
      return k ? `/partner/orders/${k}` : '/partner/orders'
    case 'statement':
      return k ? `/partner/finance/statements/${k}` : '/partner/finance/statements'
    case 'listing':
      return '/partner/products'
    case 'after_sale':
      return '/partner/after-sales'
    case 'customer':
      return k ? `/partner/customers/${k}` : '/partner/customers'
    default:
      return null
  }
}

const PAGE_SIZE = 20

export function NoticesView({ readOnly }: { readOnly?: boolean }) {
  const [unread, setUnread] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: PartnerNoticeRow[] } | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: PartnerNoticeRow[] }>(`/api/partner/notices${qs({ unread: unread ? 1 : null, page, pageSize: PAGE_SIZE })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [unread, page])

  useEffect(() => {
    load()
  }, [load])

  const mark = async (body: { noticeNos?: string[]; all?: true }) => {
    setBusy(true)
    setMsg('')
    const r = await partnerApi('/api/partner/notices/read', { method: 'POST', body })
    setBusy(false)
    if (r.ok) load()
    else if (r.needLogin) gotoLogin()
    else setMsg(r.error)
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="通知"
        desc="配置了企业微信群机器人后，这些通知也会推送到群里（推送内容不含买家邮箱与卡密）。"
        extra={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={unread ? 'primary' : 'secondary'}
              onClick={() => {
                setPage(1)
                setUnread((v) => !v)
              }}
            >
              只看未读
            </Button>
            {!readOnly && (
              <Button size="sm" onClick={() => mark({ all: true })} loading={busy}>
                全部标为已读
              </Button>
            )}
          </div>
        }
      />
      {msg && <Notice tone="red">{msg}</Notice>}
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Card>
          <Empty text={unread ? '没有未读通知' : '暂无通知'} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {data.rows.map((n) => {
              const href = hrefOf(n)
              return (
                <li key={n.noticeNo} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.readAt && <span className="h-2 w-2 rounded-full bg-red-500" />}
                      <Badge tone="blue">{NOTICE_KIND_TEXT[n.kind] ?? n.kind}</Badge>
                      <span className={n.readAt ? 'text-gray-600' : 'font-semibold text-gray-900'}>{n.title}</span>
                    </div>
                    {n.body && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">{n.body}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {cnTime(n.createdAt)}
                      {n.refKey ? ` · ${n.refKey}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {href && (
                      <Link href={href} className="text-sm text-primary-700 hover:underline" onClick={() => !n.readAt && !readOnly && mark({ noticeNos: [n.noticeNo] })}>
                        查看
                      </Link>
                    )}
                    {!n.readAt && !readOnly && (
                      <Button size="sm" variant="ghost" onClick={() => mark({ noticeNos: [n.noticeNo] })}>
                        标为已读
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  )
}
