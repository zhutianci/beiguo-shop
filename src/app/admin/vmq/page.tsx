'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, CheckCircle2, AlertTriangle, Inbox, Info } from 'lucide-react'

interface RecentOrder {
  id: number
  orderId: string
  bizType: string
  bizId: number
  outTradeNo: string
  price: number
  reallyPrice: number
  state: number
  createdAt: string
  payDate: string | null
}

// 与 src/lib/vmq.ts 的 AmountReject 保持一致（前端不 import 服务端模块，这里单独维护一份）
type AmountReject = 'empty' | 'broadcast_rejected' | 'no_strong_signal' | 'ambiguous' | 'untrusted_source'

const AMOUNT_REJECT_LABELS: Record<AmountReject, string> = {
  empty: '空内容',
  broadcast_rejected: '播报类通知（上一笔金额），已按规则拒绝',
  no_strong_signal: '未出现「你已成功收款X元」强信号，未取用',
  ambiguous: '同一条通知出现多个不同的到账金额，未自动取用（请核实后补单）',
  untrusted_source: '通知来源不是支付宝 App，未取用',
}

// 与 src/lib/vmq.ts 的 UnmatchedReason / UnmatchedEntry 保持一致
type UnmatchedReason =
  | 'no_pending_match'
  | 'closed_while_matching'
  | 'maybe_duplicate'
  | 'ambiguous_match'
  | 'duplicate_payment'
  | 'ambiguous_amount'
  | 'untrusted_source'

interface UnmatchedItem {
  key: string
  reason: UnmatchedReason
  price: string
  type: number
  pending?: number[]
  candidates?: string[]
  vmqOrderId?: string
  biz?: string
  outTradeNo?: string
  from?: string | null
  raw?: string
  repeatForward?: boolean
  at: number
  handledAt?: number | null
  handledBy?: string | number | null
}

/** 每类未匹配到账的说明与处理建议。duplicate_payment 要退款，千万别点「补单」 */
function unmatchedText(u: UnmatchedItem): { title: string; hint: string } {
  const where = u.vmqOrderId ? `收款单 ${u.vmqOrderId}${u.biz ? `（${u.biz}）` : ''}` : ''
  switch (u.reason) {
    case 'closed_while_matching':
      return {
        title: `匹配到的${where}恰好在同一时刻被关闭（超时或后台取消）`,
        hint: '这笔钱已到账但没有自动履约。请核实付款截图后，在下方列表找到该收款单点「补单」，或联系买家退款。',
      }
    case 'maybe_duplicate':
      // 原文与 1 分钟内的通知一字不差：多半是重复转发（不推送），但仍进待处理让站长对一眼账——
      // 模板里没有时间戳，1 分钟内真付两次同样金额的原文也一模一样
      return u.repeatForward
        ? {
            title: `与${where}同金额、原文与 1 分钟内的通知完全相同 —— 判定为重复转发`,
            hint: '多半是手机重复转发（未推送企业微信）。核对支付宝账单：只有一笔就直接标记已处理；确有两笔说明买家重复付款，需要退款。',
          }
        : {
            title: `与${where}同金额、10 分钟内刚到过一笔，这次没有待支付单可对`,
            hint: '可能是买家扫同一个码付了两次。核对支付宝账单：确有两笔就联系买家退款（不要点「补单」）；只有一笔说明是通知重复，直接标记已处理。',
          }
    case 'ambiguous_match':
      return {
        title: `同时命中多张待支付收款单：${(u.candidates || []).join('、')}`,
        hint: '未自动履约。请核实付款人后在下方列表对正确的收款单点「补单」，并作废 / 取消另一张。',
      }
    case 'duplicate_payment':
      return {
        title: `记到了${where}，但该单此前已付款 / 已退款 —— 疑似重复付款`,
        hint: '系统没有为这笔钱做任何履约。请核实支付宝账单后联系买家退款，不要点「补单」。',
      }
    case 'ambiguous_amount':
      return {
        title: '同一条通知里出现多个不同的到账金额，未自动取用',
        hint: '请对照支付宝账单确认实收金额，再在下方列表对对应收款单点「补单」。',
      }
    case 'untrusted_source':
      return {
        title: `通知带着到账金额，但来源（${u.from || '未知'}）不是支付宝 App，未自动取用`,
        hint: '若支付宝账单确有这笔，请补单；若手机端刚换过 SmsForwarder 版本 / 模板，每笔到账都会落到这里，请尽快核对 [from]。',
      }
    default:
      return {
        title: `当时待支付金额为 [${(u.pending || []).join(', ') || '空'}]，没有对得上的`,
        hint: '买家付的金额与收银台显示的「唯一金额」不一致，或收款单已过期后才付款。核实后补单或退款。',
      }
  }
}

function rejectLabel(reason?: string | null) {
  if (!reason) return null
  return AMOUNT_REJECT_LABELS[reason as AmountReject] || `未取用（${reason}）`
}

interface VmqConfig {
  configured: boolean
  timeoutMin: number
  monitor: {
    recentlyActive: boolean
    lastNotifyAt: string | null
    lastPaidAt: string | null
    pendingCount: number
    paidCount: number
  }
  recent: RecentOrder[]
  /** 待人工核实的到账（逐条留存，新的在前） */
  unmatched?: UnmatchedItem[]
  webhookUrl: string
  webhookToken: string
  webhookBody: string
  diag: {
    lastPush: { price: string; type: number; cents: number; at: number } | null
    lastUnmatched: {
      price?: string
      type?: number
      cents?: number
      pending?: number[]
      raw?: string
      reason?: string
      /** reason=closed_while_matching 时：匹配到的收款单号与业务单 */
      vmqOrderId?: string
      biz?: string
      at: number
    } | null
    lastWebhook: {
      raw: string
      amount: string | null
      reason?: string | null
      from?: string | null
      type: number
      at: number
    } | null
  }
}

const STATE_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: '待支付', cls: 'bg-amber-100 text-amber-700' },
  1: { label: '已支付', cls: 'bg-green-100 text-green-700' },
  [-1]: { label: '已过期', cls: 'bg-gray-100 text-gray-500' },
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

export default function AdminVmqPage() {
  const [cfg, setCfg] = useState<VmqConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vmq/config')
      const data = await res.json()
      if (data.success) setCfg(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 10_000) // 每 10s 刷新转发/收款状态
    return () => clearInterval(id)
  }, [load])

  const [copiedKey, setCopiedKey] = useState('')
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 1500)
  }

  const complete = async (id: number, paid = false) => {
    // 渠道分站（设计 12.2）：确认前先查这张收款单对应哪个站的哪张单，写进确认框；查不到不影响补单本身
    let who = ''
    try {
      const r = await fetch(`/api/admin/vmq/complete?id=${id}`)
      const d = await r.json()
      if (d.success) {
        const src = d.data.source?.tenantId === 1 ? '主站' : `渠道 ${d.data.source?.code}`
        const no = d.data.orderNo ? `订单 ${d.data.orderNo}` : d.data.invoiceNo ? `发票 ${d.data.invoiceNo}` : '（关联单据不存在）'
        who = `来源站：${src} · ${no}\n\n`
      }
    } catch {
      /* 预查失败不拦补单 */
    }
    const msg =
      who +
      (paid
        ? '这张收款单已是「已支付」。重新履约只会补做订单还缺的部分（订单仍待支付时改为已付款、自动发货商品补齐卡密），不会重复记账或多发卡。继续？'
        : '确认这笔已到账并完成履约？仅在确实已收到款时操作。')
    if (!confirm(msg)) return
    const res = await fetch('/api/admin/vmq/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '补单失败')
  }

  const markHandled = async (key: string) => {
    if (!confirm('确认这笔到账已人工处理完毕（已补单或已退款）？')) return
    const res = await fetch('/api/admin/vmq/unmatched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    const data = await res.json().catch(() => null)
    if (data?.success) load()
    else alert(data?.error || '操作失败')
  }

  const m = cfg?.monitor
  const diag = cfg?.diag
  const unmatchedOpen = (cfg?.unmatched || []).filter((u) => !u.handledAt)
  const unmatchedDone = (cfg?.unmatched || []).filter((u) => u.handledAt).slice(0, 20)
  // 通知被金额规则拒绝 → 需要醒目提示（有钱进来了但没被取用）
  const webhookRejected = !!diag?.lastWebhook && !diag.lastWebhook.amount

  return (
    <div className="space-y-6">
      {/* 转发状态（SmsForwarder 口径：无心跳，只看最近一次转发） */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>收款监控状态</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> 刷新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className={`rounded-xl border p-4 ${
                m?.recentlyActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <Inbox className={`w-4 h-4 ${m?.recentlyActive ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={m?.recentlyActive ? 'text-green-700' : 'text-gray-500'}>
                  最近一次收到转发
                </span>
              </div>
              <div
                className={`mt-1 text-sm font-semibold ${
                  m?.recentlyActive ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {loading && !cfg ? '...' : fmt(m?.lastNotifyAt ?? null)}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {m?.recentlyActive ? '24 小时内有转发进来' : '24 小时内没有转发记录'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-sm text-gray-500">最近到账</div>
              <div className="mt-1 text-sm font-medium text-gray-900">{fmt(m?.lastPaidAt ?? null)}</div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-sm text-gray-500">待支付 / 已支付</div>
              <div className="mt-1 text-xl font-bold text-gray-900">
                {m?.pendingCount ?? 0} / {m?.paidCount ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-sm text-gray-500">订单有效期</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{cfg?.timeoutMin ?? '—'} 分钟</div>
              <div className="mt-1 text-xs text-gray-400">超时未付自动过期并释放金额</div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            SmsForwarder 无心跳，此处仅表示最近是否有通知转发进来，<b className="mx-1">不影响下单</b>
            ；买家任何时候都能下单支付。
          </div>

          {!loading && cfg && !cfg.configured && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              未配置 <code className="mx-1">VMQ_KEY</code>，请在 .env.production 设置后
              <code className="mx-1">docker compose up -d</code> 重建容器。
            </div>
          )}
        </CardContent>
      </Card>

      {/* SmsForwarder Webhook 配置 */}
      <Card>
        <CardHeader>
          <CardTitle>SmsForwarder 通知转发配置</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !cfg ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : !cfg ? (
            <div className="text-center py-8 text-gray-400">加载失败，请点右上角刷新</div>
          ) : (
            <div className="space-y-4 text-sm">
              <p className="text-gray-500">
                在一台常驻安卓机上装{' '}
                <a
                  href="https://github.com/pppscn/SmsForwarder"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 underline"
                >
                  SmsForwarder
                </a>
                ，添加「应用通知」监听规则（来源选支付宝），发送通道选 <b>Webhook</b>，按下面填写。金额由服务端解析并按「唯一金额」匹配订单。
              </p>

              <div>
                <div className="text-gray-500 mb-1">请求地址（WebServer）· POST</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                    {cfg.webhookUrl}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyText(cfg.webhookUrl, 'url')}>
                    {copiedKey === 'url' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-1">请求头（Headers）</div>
                <code className="block break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                  Content-Type: application/json
                </code>
              </div>

              <div>
                <div className="text-gray-500 mb-1">校验 token（= VMQ_WEBHOOK_TOKEN，留空则复用 VMQ_KEY）</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 font-mono">
                    {cfg.webhookToken || '（未配置）'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!cfg.webhookToken}
                    onClick={() => copyText(cfg.webhookToken, 'token')}
                  >
                    {copiedKey === 'token' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-1">请求体（WebParams，JSON 模板）</div>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 overflow-x-auto rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs">
                    {cfg.webhookBody}
                  </pre>
                  <Button variant="outline" size="sm" onClick={() => copyText(cfg.webhookBody, 'body')}>
                    {copiedKey === 'body' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  <code>[content]</code> 是通知内容(含到账金额)、<code>[from]</code> 来源、
                  <code>[org_content]</code> 原始内容；<code>token</code> 必须等于上面的校验 token。
                  token 只能放在请求体（或 X-Token 头），<b>不能放在 URL 上</b>（会进访问日志）；请求方式只支持 POST。
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1">
                <div className="font-medium">配置要点</div>
                <div>· 给 SmsForwarder 开启「通知使用权」，并允许读取支付宝通知。</div>
                <div>· 支付宝里开「支付助手 → 接收付款消息提醒」，保证到账消息进系统通知栏。</div>
                <div>· 把 支付宝 + SmsForwarder 加入后台白名单、关省电优化，避免通知被系统杀掉。</div>
                <div>· 配好后先用 App 的「测试」发一条，下方「最近一次通知转发」应出现记录。</div>
                <div>· 收款码图片放在 <code>public/vmq-alipay-qr.png</code>，收银台直接展示。</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 金额识别规则 */}
      <Card>
        <CardHeader>
          <CardTitle>金额识别规则</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
            <div className="font-medium mb-1">✓ 只认强信号</div>
            <div className="text-xs">
              通知里必须出现 <b>「你已成功收款 X 元」</b>（含「已成功收款 / 成功收款」+ 紧邻金额）才会取用金额。
              例：<code className="break-all">已转入余额 … 你已成功收款14.30元（老顾客消费）</code>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <div className="font-medium mb-1">✗ 主动拒绝播报类通知</div>
            <div className="text-xs">
              <b>「上一笔播报：支付宝到账 X 元」</b> 这类通知会被直接拒绝——它播报的是<b>上一笔</b>的金额，
              拿来匹配会把别人的订单误标为已支付。出现「上一笔 / 上笔播报 / 历史播报 / 最近一笔」等字样的，
              一律不取用。
            </div>
          </div>
          <p className="text-xs text-gray-500">
            所以：买家务必按收银台显示的<b>唯一金额</b>付款。被拒绝的通知见下方「最近一次通知转发」；
            真实到账却没匹配上的（付错金额、收款单已过期、疑似重复付款等）会逐条进入「待人工核实的到账」并推送企业微信，
            确认确实收到钱后可用「补单」手动履约，处理完点「标记已处理」。
          </p>
        </CardContent>
      </Card>

      {/* 到账诊断 + 最近收款单 */}
      <Card>
        <CardHeader>
          <CardTitle>到账诊断与收款单</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 最近一次通知转发 */}
          <div
            className={`rounded-lg border p-3 text-sm ${
              webhookRejected ? 'border-amber-300 bg-amber-50' : 'border-gray-100'
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-gray-500">最近一次通知转发（SmsForwarder）</span>
              {webhookRejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                  <AlertTriangle className="w-3 h-3" /> 金额未取用
                </span>
              )}
            </div>
            {diag?.lastWebhook ? (
              <div className={webhookRejected ? 'text-amber-900' : 'text-gray-900'}>
                {diag.lastWebhook.amount ? (
                  <>解析金额：¥{diag.lastWebhook.amount}</>
                ) : (
                  <>
                    <b>未取用金额</b>
                    {rejectLabel(diag.lastWebhook.reason) && (
                      <span className="ml-1">· 原因：{rejectLabel(diag.lastWebhook.reason)}</span>
                    )}
                  </>
                )}
                <span className="text-gray-500">
                  {' '}
                  （{diag.lastWebhook.type === 1 ? '微信' : '支付宝'}）·{' '}
                  {fmt(new Date(diag.lastWebhook.at).toISOString())}
                </span>
                <div
                  className={`text-xs mt-1 break-all ${webhookRejected ? 'text-amber-700' : 'text-gray-400'}`}
                >
                  原文：{diag.lastWebhook.raw}
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                尚未收到任何通知转发。若 App 已配置仍为空：检查 SmsForwarder 是否有「应用通知」监听权限、规则是否命中支付宝、Webhook 地址/token 是否正确。
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 p-3 text-sm">
            <div className="text-gray-500 mb-1">最近一次识别到的到账金额</div>
            {diag?.lastPush ? (
              <div className="text-gray-900">
                ¥{diag.lastPush.price}（{diag.lastPush.type === 1 ? '微信' : '支付宝'}）·{' '}
                {fmt(new Date(diag.lastPush.at).toISOString())}
              </div>
            ) : (
              <div className="text-gray-400">
                尚未从任何通知里取到金额。若支付后这里一直为空，多为通知权限 / 支付助手提醒未开，或通知文案不含「你已成功收款X元」强信号。
              </div>
            )}
          </div>

          {/* 待人工核实的到账：每条单独留存，不会被下一条通知冲掉（原来只有一个「最近一次未匹配」框） */}
          <div
            className={`rounded-lg border p-3 text-sm ${
              unmatchedOpen.length ? 'border-amber-300 bg-amber-50' : 'border-gray-100'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-gray-500">待人工核实的到账</span>
              {unmatchedOpen.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                  <AlertTriangle className="w-3 h-3" /> {unmatchedOpen.length} 笔待处理
                </span>
              )}
            </div>
            {unmatchedOpen.length === 0 ? (
              <div className="text-gray-400">无</div>
            ) : (
              <div className="space-y-3">
                {unmatchedOpen.map((u) => {
                  const t = unmatchedText(u)
                  return (
                    <div key={u.key} className="rounded-md border border-amber-200 bg-white/60 p-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 text-amber-900">
                          <div>
                            收到 <b>¥{u.price}</b>（{u.type === 1 ? '微信' : '支付宝'}）· {fmt(new Date(u.at).toISOString())}
                          </div>
                          <div className="mt-0.5 break-all">{t.title}</div>
                          <div className="text-xs text-amber-700 mt-1">{t.hint}</div>
                          {u.raw && <div className="text-xs text-gray-400 mt-1 break-all">原文：{u.raw}</div>}
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => markHandled(u.key)}>
                          标记已处理
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {unmatchedDone.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500">
                  已处理 / 自动归档（最近 {unmatchedDone.length} 条）
                </summary>
                <div className="mt-2 space-y-2">
                  {unmatchedDone.map((u) => {
                    const t = unmatchedText(u)
                    return (
                      <div key={u.key} className="rounded-md border border-gray-100 p-2 text-xs text-gray-500">
                        <div>
                          ¥{u.price} · {fmt(new Date(u.at).toISOString())} ·{' '}
                          {u.handledBy === 'auto' ? '自动归档' : `已处理（管理员 #${u.handledBy ?? '—'}）`}
                        </div>
                        <div className="mt-0.5 break-all">{t.title}</div>
                        {u.reason === 'maybe_duplicate' && <div className="mt-0.5">{t.hint}</div>}
                      </div>
                    )
                  })}
                </div>
              </details>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs">
                  <th className="pb-2 pr-3">类型</th>
                  <th className="pb-2 pr-3">业务单号</th>
                  <th className="pb-2 pr-3 text-right">应付</th>
                  <th className="pb-2 pr-3 text-right">实付(唯一)</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 pr-3">创建</th>
                  <th className="pb-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {(cfg?.recent || []).map((o) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50/60">
                    <td className="py-2 pr-3 text-xs">{o.bizType === 'invoice' ? '发票税费' : '商品订单'}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{o.outTradeNo}</td>
                    <td className="py-2 pr-3 text-right text-gray-500">¥{o.price.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right font-semibold">¥{o.reallyPrice.toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATE_LABELS[o.state]?.cls || ''}`}>
                        {STATE_LABELS[o.state]?.label || o.state}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(o.createdAt)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {o.state !== 1 ? (
                        <button
                          onClick={() => complete(o.id)}
                          className="text-xs px-2 py-1 rounded text-green-600 hover:bg-green-50"
                          title="手动确认到账并履约"
                        >
                          补单
                        </button>
                      ) : (
                        // 已到账、但到账那一次履约失败时订单会停在「待支付」（cron 约 3 分钟内会自动补）。
                        // 超过对账回看窗口（24 小时）的只能在这里手动补；manualComplete / fulfillOrder 幂等
                        <button
                          onClick={() => complete(o.id, true)}
                          className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-50"
                          title="已到账但订单未处理时，重新执行履约（幂等，不会重复记账或多发卡）"
                        >
                          重新履约
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!cfg?.recent || cfg.recent.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">暂无收款单</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            提示：支付成功后商品订单会变为「处理中」（已付款待发货/开通），不会自动变「已完成」——「已完成」需在「订单管理」里交付后才会显示。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
