'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, CheckCircle2, AlertTriangle, Inbox, Info } from 'lucide-react'
import { PayQrCard } from './pay-qr-card'

interface RecentOrder {
  id: number
  orderId: string
  bizType: string
  bizId: number
  outTradeNo: string
  price: number
  reallyPrice: number
  state: number
  /** 1 微信 / 2 支付宝 */
  type?: number
  createdAt: string
  payDate: string | null
}

// 与 src/lib/vmq-notice.ts 的 NoticeReject 保持一致（前端不 import 服务端模块，这里单独维护一份）
type AmountReject = 'empty' | 'broadcast_rejected' | 'no_strong_signal' | 'ambiguous' | 'untrusted_source' | 'bad_template'

const AMOUNT_REJECT_LABELS: Record<AmountReject, string> = {
  empty: '空内容',
  broadcast_rejected: '播报类通知（上一笔金额），已按规则拒绝',
  no_strong_signal: '不是到账通知（没有「你已成功收款X元」/「微信支付收款X元」），未取用',
  ambiguous: '同一条通知出现多个不同的到账金额，未自动取用（请核实后补单）',
  untrusted_source: '通知来源不是支付宝 / 微信 App（或没带 [from]），未取用',
  bad_template: '金额不在系统到账通知的固定位置上（可能是聊天消息冒充），未自动取用',
}

/** 收款单 / 通知的渠道（1 微信、2 支付宝、0 来源不明） */
function typeLabel(t: number | undefined | null): string {
  return t === 1 ? '微信' : t === 2 ? '支付宝' : '来源不明'
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
  | 'bad_template'

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
  /** B1：处理方式（LATEPAY 退入买家余额 / OFFLINE 线下已原路退回 / IGNORE 核实不是新到账） */
  handledAs?: 'LATEPAY' | 'OFFLINE' | 'IGNORE'
  orderId?: number
  tradeNo?: string
  auto?: boolean
  /** 待处理条目：是否涉及接码单 / 充值单（服务端判定；这类只能退入余额或选 OFFLINE / IGNORE 标记） */
  carrier?: boolean
}

const HANDLED_AS_LABELS: Record<string, string> = {
  LATEPAY: '已退入买家余额',
  OFFLINE: '线下已原路退回支付宝',
  IGNORE: '核实不是新到账',
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
        title: `通知带着到账金额，但来源（${u.from || '没带 [from]'}）不是支付宝 / 微信 App，未自动取用`,
        hint: '若支付宝 / 微信账单确有这笔，请补单；若手机端刚换过 SmsForwarder 版本 / 模板，每笔到账都会落到这里，请尽快核对请求体里的 "from": "[from]"。',
      }
    case 'bad_template':
      return {
        title: `${typeLabel(u.type)}通知里有金额 ¥${u.price}，但不是系统到账通知的格式 —— 可能是有人发聊天消息冒充到账`,
        hint: '先打开支付宝 / 微信的账单核对：确实收到了才补单；没收到就是伪造，标记已处理即可（建议在手机上关闭陌生人消息）。若是真到账却屡屡落到这里，说明手机端模板变了，请把原文发给开发核对。',
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
  /** 请求体模板（不含任何密钥；密钥点「显示密钥」走 /api/admin/vmq/secret） */
  webhookBody: string
  /** primary = 已设强 token；transition = 新旧都认（过渡期）；legacy = 没设 VMQ_WEBHOOK_TOKEN，只有旧的 VMQ_KEY */
  tokenMode?: 'primary' | 'transition' | 'legacy'
  /** sign = 只认签名；sign+token = 过渡期两种都认；token = 还没设签名密钥 */
  authMode?: 'sign' | 'sign+token' | 'token'
  /** 手机端最近一次用旧 token 的时间（毫秒） */
  legacyTokenAt?: number | null
  /** 签名模式开着、手机还在用 token 的最近一次时间（毫秒） */
  tokenAuthAt?: number | null
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
    /** 最近一次被忽略的手机重发（同一条通知此前已处理过） */
    lastResend?: { price: string; type: number; firstAt: number; at: number } | null
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

  // silent：定时刷新不动 loading（否则每 10 秒整页的「加载中」状态都闪一下、依赖它的按钮跟着禁用一瞬）
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/vmq/config')
      const data = await res.json()
      if (data.success) setCfg(data.data)
    } catch {
      /* 定时刷新失败就等下一轮 */
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // 每 10s 刷新转发/收款状态。标签页在后台时不拉（这个接口一次十几条查询，忘关的标签页会一直打库）；切回来立刻补一次
    const tick = () => {
      if (document.visibilityState === 'hidden') return
      load(true)
    }
    const id = setInterval(tick, 10_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  const [copiedKey, setCopiedKey] = useState('')
  // 回调密钥：点「显示密钥」才取（二次验证由后台外壳的 SudoGate 弹框），不跟轮询走
  const [secrets, setSecrets] = useState<{ secret: string | null; token: string | null } | null>(null)
  const revealSecrets = async () => {
    try {
      const res = await fetch('/api/admin/vmq/secret', { method: 'POST' })
      const d = await res.json()
      if (d.success) setSecrets(d.data)
      else alert(d.error || '获取失败')
    } catch {
      alert('网络错误')
    }
  }
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
    // 没到账过的收款单补单必须填交易号（2026-10-25）：逼着先去支付宝 / 微信账单里核对一次，防聊天消息冒充的「到账」
    let tradeNo: string | undefined
    if (!paid) {
      const t = prompt('请填写这笔钱在支付宝 / 微信账单详情里的交易号（「订单号」/「交易单号」，16–32 位数字）。\n在账单里查不到这笔钱就不要补单。')
      if (t === null) return
      tradeNo = t.replace(/\s+/g, '')
      if (!/^\d{16,32}$/.test(tradeNo)) {
        alert('交易号应为 16–32 位数字')
        return
      }
    }
    const res = await fetch('/api/admin/vmq/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeNo ? { id, tradeNo } : { id }),
    })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '补单失败')
  }

  const [handleFor, setHandleFor] = useState<UnmatchedItem | null>(null)
  const [toBalanceFor, setToBalanceFor] = useState<UnmatchedItem | null>(null)

  const postHandled = async (key: string, handledAs?: 'OFFLINE' | 'IGNORE') => {
    const res = await fetch('/api/admin/vmq/unmatched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handledAs ? { key, handledAs } : { key }),
    })
    const data = await res.json().catch(() => null)
    if (data?.success) load()
    else alert(data?.error || '操作失败')
  }

  const markHandled = async (u: UnmatchedItem) => {
    // 涉及接码单 / 充值单的条目必须二选一（docs/短信接码-设计.md §2.7）：退进余额请用「退入买家余额」
    if (u.carrier) {
      setHandleFor(u)
      return
    }
    if (!confirm('确认这笔到账已人工处理完毕（已补单或已退款）？')) return
    await postHandled(u.key)
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
          <Button variant="outline" size="sm" onClick={() => load()}>
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
                ，添加<b>两条</b>「应用通知」转发规则：一条来源选<b>支付宝</b>、一条来源选<b>微信</b>，发送通道都选同一个 <b>Webhook</b>，按下面填写（两条规则用同一份请求体）。
                金额由服务端解析，支付宝和微信共用一个「唯一金额」池，按金额匹配订单。
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
                <div className="text-gray-500 mb-1">
                  认证方式
                  {cfg.authMode === 'sign' && <b className="ml-1 text-green-700">签名模式（只认签名，token 已停用）</b>}
                  {cfg.authMode === 'sign+token' && (
                    <b className="ml-1 text-amber-600">
                      过渡期：签名与 token 都认
                      {cfg.tokenAuthAt ? `（手机最近一次用 token：${fmt(new Date(cfg.tokenAuthAt).toISOString())}）` : '（签名开启后还没有手机用过 token）'}。
                      两台手机都改成签名后，在服务器 .env.production 加 VMQ_WEBHOOK_ACCEPT_TOKEN=0
                    </b>
                  )}
                  {cfg.authMode === 'token' && <b className="ml-1 text-amber-600">token 模式：服务器还没设 VMQ_WEBHOOK_SECRET，建议启用签名</b>}
                  {cfg.tokenMode === 'legacy' && <b className="ml-1 text-red-600">服务器还没设 VMQ_WEBHOOK_TOKEN，正在用旧的 VMQ_KEY —— 请尽快换成强 token</b>}
                </div>
                {/* 密钥不再跟着每 10 秒的轮询发到浏览器（2026-10-24）：点按钮才取，要二次验证 */}
                {!secrets ? (
                  <Button variant="outline" size="sm" onClick={revealSecrets}>
                    显示密钥（需验证身份）
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {secrets.secret && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">签名密钥（填进 SmsForwarder → Webhook 的「Secret」）</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 font-mono">{secrets.secret}</code>
                          <Button variant="outline" size="sm" onClick={() => copyText(secrets.secret || '', 'secret')}>
                            {copiedKey === 'secret' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    {secrets.token && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          校验 token（= VMQ_WEBHOOK_TOKEN{secrets.secret ? '；过渡期还认，改成签名后不再需要' : ''}）
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 font-mono">{secrets.token}</code>
                          <Button variant="outline" size="sm" onClick={() => copyText(secrets.token || '', 'token')}>
                            {copiedKey === 'token' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={() => setSecrets(null)} className="text-xs text-gray-500 hover:underline">
                      隐藏
                    </button>
                  </div>
                )}
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
                  <code>[org_content]</code> 原始内容。
                  {cfg.authMode === 'token' ? (
                    <>
                      <code>token</code> 必须等于上面的校验 token。token 只能放在请求体（或 X-Token 头），<b>不能放在 URL 上</b>（会进访问日志）。
                    </>
                  ) : (
                    <>
                      签名模式：在 SmsForwarder 这个 Webhook 通道的「Secret」里填上面的签名密钥，<code>[timestamp]</code>、<code>[sign]</code>
                      由 SmsForwarder 每次自动计算（密钥本身不随请求发送）；请求体里<b>不要再写 token</b>。手机时间要准（误差超过 10 分钟会被拒）。
                    </>
                  )}
                  请求方式只支持 POST。
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1">
                <div className="font-medium">配置要点</div>
                <div>· 给 SmsForwarder 开启「通知使用权」，并允许读取支付宝、微信通知。</div>
                <div>· 支付宝里开「支付助手 → 接收付款消息提醒」；微信里关注「微信收款助手」并打开它的消息通知。保证到账消息进系统通知栏。</div>
                <div>· 把 支付宝 + 微信 + SmsForwarder 加入后台白名单、关省电优化，避免通知被系统杀掉。</div>
                <div>· 请求体必须原样用上面的模板：<code>content</code> 填 <code>[content]</code>（开头是包名、带到账时间）、<code>from</code> 填 <code>[from]</code>。服务端只认来源是支付宝 / 微信 App、且格式是系统到账通知的金额。</div>
                <div>· 防伪造：在支付宝、微信里关闭陌生人消息（或聊天消息的通知预览）。有人发聊天消息冒充「已成功收款」时不会自动确认，会进「待人工核实」并推送。</div>
                <div>· 配好后先各付一笔小额测试，下方「最近一次通知转发」应出现记录，渠道显示正确。</div>
                <div>· 收款码在下方按渠道上传、切换；支付宝没上传过时用镜像自带的 <code>public/vmq-alipay-qr.png</code>；微信要上传并「设为当前」后收银台才出现微信支付。</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 收款码：支付宝 / 微信各一组，上传多张、一键切换（接口 /api/admin/vmq/qr?channel=） */}
      <PayQrCard channel="alipay" />
      <PayQrCard channel="wechat" />

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
                  （{typeLabel(diag.lastWebhook.type)}）·{' '}
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
                ¥{diag.lastPush.price}（{typeLabel(diag.lastPush.type)}）·{' '}
                {fmt(new Date(diag.lastPush.at).toISOString())}
              </div>
            ) : (
              <div className="text-gray-400">
                尚未从任何通知里取到金额。若支付后这里一直为空，多为通知权限 / 支付助手提醒未开，或通知文案不含「你已成功收款X元」强信号。
              </div>
            )}
            {diag?.lastResend && (
              <div className="mt-1 text-xs text-gray-400">
                最近一次忽略的手机重发：¥{diag.lastResend.price} · {fmt(new Date(diag.lastResend.at).toISOString())}
                （同一条通知首次收到于 {fmt(new Date(diag.lastResend.firstAt).toISOString())}，不是新到账）
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
                            收到 <b>¥{u.price}</b>（{typeLabel(u.type)}）· {fmt(new Date(u.at).toISOString())}
                          </div>
                          <div className="mt-0.5 break-all">{t.title}</div>
                          <div className="text-xs text-amber-700 mt-1">{t.hint}</div>
                          {u.carrier && (
                            <div className="text-xs text-rose-700 mt-1">
                              涉及短信接码 / 余额充值订单：这类订单关了就不复活，<b>不要补单</b>。核对支付宝账单后用「退入买家余额」（填交易号），
                              或已线下原路退回 / 核实不是新到账时点「标记已处理」选对应方式。
                            </div>
                          )}
                          {u.raw && <div className="text-xs text-gray-400 mt-1 break-all">原文：{u.raw}</div>}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => setToBalanceFor(u)} title="接码 / 充值订单关单后才到的钱：按实收退进买家充值余额">
                            退入买家余额
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => markHandled(u)}>
                            标记已处理
                          </Button>
                        </div>
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
                          {u.handledAs === 'LATEPAY' && u.auto
                            ? '已自动退入买家余额'
                            : u.handledBy === 'auto'
                              ? '自动归档'
                              : `已处理（管理员 #${u.handledBy ?? '—'}）`}
                          {u.handledAs && !(u.handledAs === 'LATEPAY' && u.auto) && ` · ${HANDLED_AS_LABELS[u.handledAs] ?? u.handledAs}`}
                          {u.handledAs === 'LATEPAY' && u.orderId && ` · 订单 #${u.orderId}`}
                          {u.tradeNo && ` · 交易号 ${u.tradeNo}`}
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
                  <th className="pb-2 pr-3">渠道</th>
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
                    {/* 待支付 / 过期的是买家选的渠道；已支付的是实际到账的渠道 */}
                    <td className="py-2 pr-3 text-xs">{typeLabel(o.type)}</td>
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
            短信接码 / 余额充值订单关单后才到的钱不能「补单」，请在上面的待核实列表用「退入买家余额」。
          </p>
        </CardContent>
      </Card>

      {handleFor && (
        <HandleAsModal
          item={handleFor}
          onClose={() => setHandleFor(null)}
          onPick={async (as) => {
            const key = handleFor.key
            setHandleFor(null)
            await postHandled(key, as)
          }}
        />
      )}
      {toBalanceFor && (
        <ToBalanceModal
          item={toBalanceFor}
          onClose={() => setToBalanceFor(null)}
          onDone={() => {
            setToBalanceFor(null)
            load()
          }}
        />
      )}
    </div>
  )
}

/** 涉及载体单的条目「标记已处理」：必须二选一（线下已原路退回 / 核实不是新到账），二次确认 */
function HandleAsModal({ item, onClose, onPick }: { item: UnmatchedItem; onClose: () => void; onPick: (as: 'OFFLINE' | 'IGNORE') => void }) {
  const pick = (as: 'OFFLINE' | 'IGNORE') => {
    const text =
      as === 'OFFLINE'
        ? `确认这笔 ¥${item.price} 已经线下原路退回给买家的支付宝？`
        : `确认这笔 ¥${item.price} 不是新到账（重复转发，或核对账单只有一笔）？`
    if (confirm(text)) onPick(as)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold text-gray-900">标记已处理：¥{item.price}</div>
        <p className="mt-2 text-sm text-gray-600">
          这笔到账涉及短信接码 / 余额充值订单，请选择处理方式。要把钱退进买家的余额，请关掉这个框、改用「退入买家余额」。
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" onClick={() => pick('OFFLINE')}>
            线下已原路退回支付宝
          </Button>
          <Button variant="outline" onClick={() => pick('IGNORE')}>
            核实不是新到账（重复转发等）
          </Button>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}

interface Candidate {
  orderNo: string
  deliveryType: string
  payStatus: string
  deliveryStatus: string
  closed: boolean
  amountCents: number
  vmqOrderNo: string
  vmqState: number
  vmqCreatedAt: string
  userId: number
  userEmail: string | null
  priorLatepay: number
  priorList?: PriorLatepay[]
  hinted: boolean
}

/** 这张订单之前的一笔 LATEPAY 退入（§2.7：再退一笔要勾「已核对账单」，页面同时列出之前那几笔） */
interface PriorLatepay {
  logId: number
  cents: number
  at: string
  entryKey: string
  reason: string | null
  auto: boolean
  tradeNo: string | null
  vmqOrderNo: string | null
}

interface OrderLookup {
  orderNo: string
  deliveryType: string
  payStatus: string
  deliveryStatus: string
  closed: boolean
  carrier: boolean
  amountCents: number
  userId: number
  userEmail: string | null
  priorLatepay: number
  priorList: PriorLatepay[]
}

/** 之前的退入逐笔：金额、时间、自动（收款单）/ 手动（交易号）、原因、条目 */
function PriorList({ count, list }: { count: number; list: PriorLatepay[] }) {
  if (!count) return null
  return (
    <span className="mt-1 block rounded bg-rose-50 px-2 py-1 text-rose-800">
      <b>这张订单已经退入过 {count} 笔</b>（核对支付宝账单，别把同一笔钱的第二条通知再退一次）：
      {list.map((p) => (
        <span key={p.logId} className="block break-all font-mono text-[11px]">
          ¥{(p.cents / 100).toFixed(2)} · {new Date(p.at).toLocaleString('zh-CN', { hour12: false })} ·{' '}
          {p.auto ? `自动（收款单 ${p.vmqOrderNo ?? '—'}）` : `手动（交易号 ${p.tradeNo ?? '—'}）`} · {p.reason ?? '—'} · {p.entryKey}
        </span>
      ))}
      {list.length < count && <span className="block text-[11px]">……只列出最近 {list.length} 笔</span>}
    </span>
  )
}

/**
 * 「退入买家余额」（docs/短信接码-设计.md §2.7、§6.6 第 15 条）：选订单（候选优先、已关闭的恰好一个时预选「建议」）→ 填支付宝交易号 →
 * 按需勾两个确认 → 退入。入账金额永远是这条到账的实收；同一个交易号只能退一次。
 */
function ToBalanceModal({ item, onClose, onDone }: { item: UnmatchedItem; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(true)
  const [cands, setCands] = useState<Candidate[]>([])
  const [suggest, setSuggest] = useState<string | null>(null)
  const [orderNo, setOrderNo] = useState('')
  const [tradeNo, setTradeNo] = useState('')
  const [billChecked, setBillChecked] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [lookup, setLookup] = useState<{ no: string; data: OrderLookup | null; err?: string } | null>(null)
  const url = `/api/admin/vmq/unmatched/${encodeURIComponent(item.key)}/to-balance`

  // 手填的订单号不在候选里：查出这张订单之前的退入逐笔一并列出（§2.7），停手 400ms 再查
  const typedNo = orderNo.trim()
  const inCands = cands.some((c) => c.orderNo === typedNo)
  useEffect(() => {
    if (!typedNo || inCands || loading) {
      setLookup(null)
      return
    }
    let alive = true
    const t = setTimeout(() => {
      fetch(`${url}?orderNo=${encodeURIComponent(typedNo)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return
          setLookup(d.success ? { no: typedNo, data: d.data.lookup ?? null } : { no: typedNo, data: null, err: d.error || '查询失败' })
        })
        .catch(() => alive && setLookup({ no: typedNo, data: null, err: '查询失败' }))
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [typedNo, inCands, loading, url])

  useEffect(() => {
    let alive = true
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.success) {
          setCands(d.data.candidates || [])
          setSuggest(d.data.suggest || null)
          if (d.data.suggest) setOrderNo(d.data.suggest)
          else if (d.data.candidates?.[0]?.hinted) setOrderNo(d.data.candidates[0].orderNo)
        } else setMsg(d.error || '候选加载失败')
      })
      .catch(() => alive && setMsg('候选加载失败'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [url])

  const submit = async () => {
    setMsg('')
    if (!/^\d{16,32}$/.test(tradeNo.trim())) {
      setMsg('请填写支付宝交易号（16–32 位数字，支付宝账单详情里的「订单号」）')
      return
    }
    if (!orderNo.trim()) {
      setMsg('请选择或填写订单号')
      return
    }
    if (!confirm(`确认把这笔 ¥${item.price} 退进订单 ${orderNo.trim()} 的买家充值余额？`)) return
    setBusy(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: orderNo.trim(), tradeNo: tradeNo.trim(), confirmMismatch: mismatch, confirmBillChecked: billChecked }),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        alert(d.message || '已退入')
        onDone()
      } else setMsg(d?.error || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold text-gray-900">退入买家余额：¥{item.price}</div>
        <p className="mt-1 text-xs text-gray-500">
          只用于短信接码 / 余额充值订单关单后才到、重复付的钱：按这条到账的<b>实收</b>退进买家的充值余额（不可提现），不补单、不改订单。
          {item.repeatForward && <b className="text-rose-600"> 这条疑似重复转发：先核对支付宝账单确有两笔。</b>}
        </p>

        <div className="mt-4 text-sm font-medium text-gray-700">候选订单（近 24 小时同额的接码 / 充值收款单）</div>
        {loading ? (
          <div className="py-4 text-sm text-gray-400">加载中…</div>
        ) : cands.length === 0 ? (
          <div className="py-2 text-sm text-gray-400">没有候选，可以直接填订单号</div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {cands.map((c) => (
              <label
                key={c.orderNo}
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs ${orderNo === c.orderNo ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}
              >
                <input type="radio" className="mt-0.5" checked={orderNo === c.orderNo} onChange={() => setOrderNo(c.orderNo)} />
                <span className="min-w-0">
                  <span className="font-mono">{c.orderNo}</span> · {c.deliveryType === 'TOPUP' ? '余额充值' : '短信接码'} · ¥{(c.amountCents / 100).toFixed(2)} ·{' '}
                  {c.closed ? <b className="text-gray-700">已关闭</b> : `${c.payStatus}/${c.deliveryStatus}`} · {c.userEmail || `用户#${c.userId}`}
                  {suggest === c.orderNo && <span className="ml-1 rounded bg-green-100 px-1 text-green-800">建议</span>}
                  {c.hinted && <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800">条目提示</span>}
                  {c.priorLatepay > 0 && <span className="ml-1 rounded bg-rose-100 px-1 text-rose-700">已退入过 {c.priorLatepay} 笔</span>}
                  <span className="block text-gray-400">
                    收款单 {c.vmqOrderNo}（{c.vmqState === 1 ? '已到账' : c.vmqState === 0 ? '待支付' : '已关闭'}）·{' '}
                    {new Date(c.vmqCreatedAt).toLocaleString('zh-CN', { hour12: false })}
                  </span>
                  <PriorList count={c.priorLatepay} list={c.priorList ?? []} />
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-gray-600">订单号</span>
            <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 font-mono text-sm" />
            {lookup && lookup.no === typedNo && (
              <span className="mt-1 block text-xs text-gray-600">
                {lookup.err ? (
                  <span className="text-rose-600">{lookup.err}</span>
                ) : !lookup.data ? (
                  <span className="text-rose-600">没有这张订单</span>
                ) : (
                  <>
                    {lookup.data.deliveryType === 'TOPUP' ? '余额充值' : lookup.data.deliveryType === 'SMS_POOL' ? '短信接码' : lookup.data.deliveryType} · ¥
                    {(lookup.data.amountCents / 100).toFixed(2)} · {lookup.data.closed ? '已关闭' : `${lookup.data.payStatus}/${lookup.data.deliveryStatus}`} ·{' '}
                    {lookup.data.userEmail || `用户#${lookup.data.userId}`}
                    {!lookup.data.carrier && <b className="block text-rose-600">只能退入主站的短信接码单或余额充值单</b>}
                    <PriorList count={lookup.data.priorLatepay} list={lookup.data.priorList} />
                  </>
                )}
              </span>
            )}
          </label>
          <label className="text-sm">
            <span className="text-gray-600">支付宝交易号（必填）</span>
            <input
              value={tradeNo}
              onChange={(e) => setTradeNo(e.target.value)}
              inputMode="numeric"
              placeholder="支付宝账单详情里的「订单号」"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 font-mono text-sm"
            />
          </label>
        </div>
        <div className="mt-3 space-y-1.5 text-sm text-gray-700">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={billChecked} onChange={(e) => setBillChecked(e.target.checked)} />
            <span>已核对支付宝账单，确实收到这一笔（可能重复 / 重复转发的条目、或这张订单已经退入过时必须勾）</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={mismatch} onChange={(e) => setMismatch(e.target.checked)} />
            <span>金额 / 订单与收款单不一致，确认这笔钱是该买家付的（买家手输错金额、或改指到提示之外的订单时必须勾）</span>
          </label>
        </div>
        {msg && <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{msg}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? '处理中…' : '确认退入'}
          </Button>
        </div>
      </div>
    </div>
  )
}
