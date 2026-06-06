'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, CheckCircle2, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

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

interface VmqConfig {
  configured: boolean
  host: string
  key: string
  configString: string
  qrSvg: string
  timeoutMin: number
  requireMonitor: boolean
  monitor: {
    alive: boolean
    lastHeartAt: string | null
    lastPaidAt: string | null
    pendingCount: number
    paidCount: number
  }
  recent: RecentOrder[]
  diag: {
    lastPush: { price: string; type: number; cents: number; at: number } | null
    lastUnmatched: { price: string; type: number; cents: number; pending: number[]; at: number } | null
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
  const [copied, setCopied] = useState(false)

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
    const id = setInterval(load, 10_000) // 每 10s 刷新监控状态
    return () => clearInterval(id)
  }, [load])

  const copy = () => {
    if (!cfg) return
    navigator.clipboard.writeText(cfg.configString)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const complete = async (id: number) => {
    if (!confirm('确认这笔已到账并完成履约？仅在确实已收到款时操作。')) return
    const res = await fetch('/api/admin/vmq/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '补单失败')
  }

  const m = cfg?.monitor
  const diag = cfg?.diag

  return (
    <div className="space-y-6">
      {/* 监控端状态 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>收款监控状态</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> 刷新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-xl border p-4 ${m?.alive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-2 text-sm">
                {m?.alive ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
                <span className={m?.alive ? 'text-green-700' : 'text-red-700'}>监控端</span>
              </div>
              <div className={`mt-1 text-xl font-bold ${m?.alive ? 'text-green-700' : 'text-red-700'}`}>
                {loading ? '...' : m?.alive ? '在线' : '离线'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-sm text-gray-500">最近心跳</div>
              <div className="mt-1 text-sm font-medium text-gray-900">{fmt(m?.lastHeartAt ?? null)}</div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-sm text-gray-500">待支付 / 已支付</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{m?.pendingCount ?? 0} / {m?.paidCount ?? 0}</div>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="text-sm text-gray-500">最近到账</div>
              <div className="mt-1 text-sm font-medium text-gray-900">{fmt(m?.lastPaidAt ?? null)}</div>
            </div>
          </div>

          {!loading && cfg && !cfg.configured && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              未配置 <code className="mx-1">VMQ_KEY</code>，请在 .env.production 设置后 <code className="mx-1">docker compose up -d</code> 重建容器。
            </div>
          )}
          {!loading && cfg?.configured && !m?.alive && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              监控端当前离线（60 秒内无心跳）。{cfg.requireMonitor ? '此时买家无法下单支付，' : ''}请确认手机上的监控 App 正在运行、已联网、有通知监听权限。
            </div>
          )}
        </CardContent>
      </Card>

      {/* 扫码配置 */}
      <Card>
        <CardHeader>
          <CardTitle>监控端扫码配置</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : !cfg?.configured ? (
            <div className="text-center py-12 text-gray-400">配置 VMQ_KEY 后此处显示扫码二维码</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 items-start">
              <div className="flex flex-col items-center">
                <div className="rounded-xl border border-gray-200 p-3 bg-white" dangerouslySetInnerHTML={{ __html: cfg.qrSvg }} />
                <p className="mt-3 text-xs text-gray-400">用 V免签监控端 App 的「扫码配置」扫描此码</p>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">扫码内容（手动配置时填这个）</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-gray-800">{cfg.configString}</code>
                    <Button variant="outline" size="sm" onClick={copy}>
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 mb-1">通知地址(host)</div>
                    <code className="block break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">{cfg.host}</code>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">通讯密钥(key)</div>
                    <code className="block break-all rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">{cfg.key}</code>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1.5">
                  <div className="font-medium">配置步骤</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>安卓装 V免签监控端 App（VmqApk）</li>
                    <li>点「扫码配置」扫描左侧二维码；或「手动配置」粘贴上面的「扫码内容」</li>
                    <li>开启通知监听 / 辅助服务；支付宝里开启「支付助手 → 接收付款消息提醒」</li>
                    <li>把 支付宝 + 监控端 加入后台白名单、关省电优化，保持常驻在线</li>
                    <li>配置成功后本页「监控端」会变为「在线」（约 10 秒刷新一次）</li>
                  </ol>
                  <div className="pt-1 text-blue-600">订单有效期：{cfg.timeoutMin} 分钟 · 收款码图片需放在 public/vmq-alipay-qr.png</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 到账诊断 + 最近收款单 */}
      <Card>
        <CardHeader>
          <CardTitle>到账诊断与收款单</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 p-3 text-sm">
              <div className="text-gray-500 mb-1">最近一次到账推送</div>
              {diag?.lastPush ? (
                <div className="text-gray-900">
                  ¥{diag.lastPush.price}（type={diag.lastPush.type}）· {fmt(new Date(diag.lastPush.at).toISOString())}
                </div>
              ) : (
                <div className="text-gray-400">尚未收到任何到账推送。若支付后这里一直为空，说明监控端没解析到支付宝「成功收款」通知（多为通知权限/支付助手提醒未开，或通知文案不被识别）。</div>
              )}
            </div>
            <div className="rounded-lg border border-gray-100 p-3 text-sm">
              <div className="text-gray-500 mb-1">最近一次「未匹配」到账</div>
              {diag?.lastUnmatched ? (
                <div className="text-amber-700">
                  收到 ¥{diag.lastUnmatched.price}，但当时待支付金额为 [{diag.lastUnmatched.pending.join(', ') || '空'}] · {fmt(new Date(diag.lastUnmatched.at).toISOString())}
                  <div className="text-xs text-amber-600 mt-1">说明买家付的金额与收银台显示的「唯一金额」不一致，或订单已过期。</div>
                </div>
              ) : (
                <div className="text-gray-400">无</div>
              )}
            </div>
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
                      {o.state !== 1 && (
                        <button
                          onClick={() => complete(o.id)}
                          className="text-xs px-2 py-1 rounded text-green-600 hover:bg-green-50"
                          title="手动确认到账并履约"
                        >
                          补单
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
