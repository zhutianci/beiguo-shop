'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Link2, Copy, CheckCircle2, Loader2, Wallet, ChevronRight } from 'lucide-react'

/**
 * 推广链接 + 各商品专属价设置。
 *
 * 2026-09-24 起只挂在「推荐有奖」页（/profile/referral）上，那一页自己有标题、玩法说明
 * 和推广订单汇总，所以这里不再放「我的内推」大标题和三格收益统计（累计返现与页面下方的
 * 「已到账返现」是同一个数，放两遍只会让人找不同）；余额只留一行入口，明细去 /wallet 看。
 */

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
  productTotal: number
  productPage: number
  productPageSize: number
  productTotalPages: number
}

// 商品专属价每页条数（分段懒加载）
const PAGE_SIZE = 20

export default function ReferralPanel() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLInputElement>(null)

  // 拉某一页；append=true 把商品追加到列表尾部
  const load = useCallback(async (targetPage = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/account/referral?page=${targetPage}&pageSize=${PAGE_SIZE}`)
      const d = await res.json()
      if (d.success) {
        const next = d.data as ReferralData
        setData((prev) =>
          append && prev ? { ...next, products: [...prev.products, ...next.products] } : next
        )
        setInputs((prev) => {
          const map: Record<number, string> = append ? { ...prev } : {}
          next.products.forEach((p) => {
            map[p.productId] = p.customPrice != null ? String(p.customPrice) : ''
          })
          return map
        })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 微信内置浏览器 / 非 https 下 clipboard 不可用：选中文本，让用户长按或 Ctrl+C 复制
      linkRef.current?.focus()
      linkRef.current?.select()
    }
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
      setMsgOk(!!d.success)
      if (d.success) {
        setMsg('已保存')
        // 本地同步专属价，避免重新拉取把已「加载更多」的商品丢掉
        setData((prev) =>
          prev
            ? {
                ...prev,
                products: prev.products.map((p) => {
                  const v = (inputs[p.productId] ?? '').trim()
                  return { ...p, customPrice: v === '' ? null : Number(v) }
                }),
              }
            : prev
        )
      } else setMsg(d.error || '保存失败')
    } catch {
      setMsgOk(false)
      setMsg('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Link2 className="w-5 h-5 text-pink-400" />
          推广链接与专属价
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-white/40 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-white/40">加载失败</div>
      ) : (
        <div className="space-y-6">
          {/* 余额入口：返现到账后就在这里，明细与提现说明在 /wallet */}
          <Link
            href="/wallet"
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.08]"
          >
            <span className="flex items-center gap-2 text-sm text-white/60">
              <Wallet className="w-4 h-4 text-cyan-300" />
              账户余额
              <span className="text-lg font-bold tabular-nums gradient-text-accent">¥{data.balance.toFixed(2)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-white/45">
              余额明细 <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* 链接 */}
          <div>
            <label className="block text-sm text-white/50 mb-2">我的专属推广链接</label>
            <div className="flex items-center gap-2">
              <input
                ref={linkRef}
                readOnly
                value={data.link}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-mono"
              />
              <button
                onClick={copy}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium inline-flex items-center gap-1.5"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              好友通过此链接下单按你的专属价付款（没单独设置的商品按网站售价），订单完成后
              「专属价 − 你的基础价」的差额自动计入你的余额。
            </p>
          </div>

          {/* 专属价设置 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-white/50">设置各商品专属价（留空 = 按网站售价；不能低于你的基础价）</label>
            </div>
            <div className="space-y-2">
              {data.products.map((p) => {
                const sell = inputs[p.productId] ? Number(inputs[p.productId]) : p.websitePrice
                const reward = Math.max(0, sell - p.basePrice)
                return (
                  <div
                    key={p.productId}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5"
                  >
                    {/* 375px 上名称 + 输入框 + 返现挤一行会把商品名截得只剩两三个字，窄屏让名称独占一行 */}
                    <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-white/40">网站售价 ¥{p.websitePrice.toFixed(2)} · 我的基础价 ¥{p.basePrice.toFixed(2)}</div>
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
                    <span className="ml-auto text-xs text-emerald-400 whitespace-nowrap w-20 text-right">返 ¥{reward.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>

            {/* 分段加载 */}
            {data.productTotal > data.products.length ? (
              <div className="mt-3 flex flex-col items-center gap-2">
                <button
                  onClick={() => load(data.productPage + 1, true)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingMore ? '加载中...' : '加载更多商品'}
                </button>
                <span className="text-xs text-white/30">
                  已显示 {data.products.length} / {data.productTotal} 个商品
                </span>
              </div>
            ) : (
              data.productTotal > PAGE_SIZE && (
                <p className="mt-3 text-center text-xs text-white/30">
                  已显示全部 {data.productTotal} 个商品
                </p>
              )
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                保存专属价
              </button>
              {msg && <span className={`text-sm ${msgOk ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
