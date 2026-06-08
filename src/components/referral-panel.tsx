'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, CheckCircle2, Loader2, Wallet } from 'lucide-react'

interface ProductPrice {
  productId: number
  name: string
  websitePrice: number
  basePrice: number
  customPrice: number | null
}
interface ReferralData {
  code: string
  link: string
  balance: number
  totalReward: number
  rewardCount: number
  products: ProductPrice[]
}

export default function ReferralPanel() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/referral')
      const d = await res.json()
      if (d.success) {
        setData(d.data)
        const map: Record<number, string> = {}
        d.data.products.forEach((p: ProductPrice) => {
          map[p.productId] = p.customPrice != null ? String(p.customPrice) : ''
        })
        setInputs(map)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const copy = () => {
    if (!data) return
    navigator.clipboard.writeText(data.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const save = async () => {
    if (!data) return
    setSaving(true)
    setMsg('')
    try {
      const prices = data.products.map((p) => {
        const v = (inputs[p.productId] ?? '').trim()
        return { productId: p.productId, price: v === '' ? null : Number(v) }
      })
      const res = await fetch('/api/account/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices }),
      })
      const d = await res.json()
      if (d.success) {
        setMsg('已保存')
        load()
      } else setMsg(d.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-400" />
          我的内推
        </h2>
        <span className="text-xs text-white/40">分享专属链接，好友下单赚返现</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-white/40 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-white/40">加载失败</div>
      ) : (
        <div className="space-y-6">
          {/* 收益 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> 余额
              </div>
              <div className="text-2xl font-bold gradient-text-accent">¥{data.balance.toFixed(2)}</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-xs text-white/50 mb-1">累计返现</div>
              <div className="text-2xl font-bold">¥{data.totalReward.toFixed(2)}</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-xs text-white/50 mb-1">成交单数</div>
              <div className="text-2xl font-bold">{data.rewardCount}</div>
            </div>
          </div>

          {/* 链接 */}
          <div>
            <label className="block text-sm text-white/50 mb-2">我的专属推广链接</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={data.link}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-mono"
              />
              <button
                onClick={copy}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium inline-flex items-center gap-1.5"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">别人通过此链接下单(默认按网站售价)并完成后，「售价 − 你的进货价」的差额会自动进你的余额。你也可在下方给商品单独设更高售价。</p>
          </div>

          {/* 专属价设置 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-white/50">设置各商品专属售价（留空=按网站售价卖；不低于你的进货价）</label>
            </div>
            <div className="space-y-2">
              {data.products.map((p) => {
                const sell = inputs[p.productId] ? Number(inputs[p.productId]) : p.websitePrice
                const reward = Math.max(0, sell - p.basePrice)
                return (
                  <div key={p.productId} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-white/40">网站售价 ¥{p.websitePrice.toFixed(2)} · 我的进货价 ¥{p.basePrice.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/40 text-sm">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        value={inputs[p.productId] ?? ''}
                        onChange={(e) => setInputs({ ...inputs, [p.productId]: e.target.value })}
                        placeholder={p.websitePrice.toFixed(2)}
                        className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <span className="text-xs text-emerald-400 whitespace-nowrap w-20 text-right">返 ¥{reward.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                保存专属价
              </button>
              {msg && <span className="text-sm text-green-400">{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
