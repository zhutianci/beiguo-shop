'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, CheckCircle2, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

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

  const m = cfg?.monitor

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
    </div>
  )
}
