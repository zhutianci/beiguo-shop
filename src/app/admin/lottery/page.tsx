'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Gift, History, Info, Loader2, PartyPopper, Plus, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * 下单有奖（抽奖）管理：活动开关与门槛、奖项与概率、抽奖记录与自定义奖品兑现。
 *
 * 【活动开关的口径 —— 页面上必须讲清楚，站长最容易误解的就是这一条】
 * 开关只决定「新订单」有没有抽奖资格：资格在建单那一刻确定并落库（lib/lottery-server.ts
 * 的 createEntryIfEligible），之后开关怎么拨都不影响已经下的单。所以：
 *  · 关闭期间下的单永远没有资格，事后开启也不补
 *  · 关闭活动不会收回已发出的资格，那些订单付款后照样能抽
 *
 * 【概率一律按整数万分比】1 = 0.01%。下面 parseRateToBp / bpToPercentText 是 lib/lottery.ts
 * 的原样拷贝：那个文件 import 了 lib/coupon.ts，后者又引了 prisma 与 node crypto，
 * 进不了浏览器包（同样的原因 purchase-modal 也拷了一份 calcInvoiceAmounts）。
 * 这里只用来做弹窗里的实时合计预览，是否超 100% 以服务端在事务里的校验为准。
 */

const RATE_SCALE = 10000

/** 与 lib/lottery.ts 的 parseRateToBp 一字不差（理由见文件头） */
function parseRateToBp(input: string | number): number | null {
  const s = String(input).trim()
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return null
  const whole = Number(m[1])
  const frac = Number((m[2] || '').padEnd(2, '0'))
  const bp = whole * 100 + frac
  if (bp <= 0 || bp > RATE_SCALE) return null
  return bp
}

/** 与 lib/lottery.ts 的 bpToPercentText 一字不差 */
function bpToPercentText(bp: number): string {
  const v = Math.max(0, Math.trunc(bp))
  const whole = Math.trunc(v / 100)
  const frac = v % 100
  if (frac === 0) return String(whole)
  return `${whole}.${String(frac).padStart(2, '0').replace(/0$/, '')}`
}

function fmt(s: string | null | undefined): string {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============ 类型 ============

interface LotteryConfig {
  enabled: boolean
  minOrderAmount: number
  rules: string
}

interface Stats {
  prizeCount: number
  enabledPrizeCount: number
  enabledRateBp: number
  overLimit: boolean
  entryTotal: number
  drawn: number
  pending: number
  won: number
  customPending: number
  voided: number
}

interface PrizeRow {
  id: number
  name: string
  type: string
  rateBp: number
  ratePercent: string
  label: string
  couponKind: string | null
  couponMinAmount: number | null
  couponDiscount: number | null
  couponProductIds: string | null
  couponValidDays: number | null
  description: string | null
  enabled: boolean
  sortOrder: number
  wonCount: number
}

interface PrizeTotals {
  enabledRateBp: number
  enabledRatePercent: string
  noWinRateBp: number
  noWinRatePercent: string
  overLimit: boolean
}

interface EntryRow {
  id: number
  orderId: number
  orderNo: string
  userId: number
  user: { email: string | null; nickname: string | null } | null
  state: string
  won: boolean | null
  prizeName: string | null
  prizeType: string | null
  prizeLabel: string | null
  couponGrantId: number | null
  coupon: { state: string | null; expiresAt: string | null; orderId: number | null; usedAt: string | null } | null
  fulfillState: string | null
  fulfilledAt: string | null
  fulfillNote: string | null
  drawnAt: string | null
  createdAt: string
}

const ENTRY_STATE: Record<string, { text: string; cls: string }> = {
  PENDING: { text: '待抽', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  DRAWN: { text: '已抽', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  VOID: { text: '已作废', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const COUPON_STATE: Record<string, { text: string; cls: string }> = {
  AVAILABLE: { text: '未使用', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LOCKED: { text: '占用中', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  USED: { text: '已使用', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  EXPIRED: { text: '已过期', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  VOID: { text: '已作废', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const FULFILL_STATE: Record<string, { text: string; cls: string }> = {
  PENDING: { text: '待兑现', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  DONE: { text: '已兑现', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  VOID: { text: '已作废', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

function prizeTypeText(p: { type: string; couponKind: string | null }): string {
  if (p.type === 'CUSTOM') return '自定义奖品'
  return p.couponKind === 'PRODUCT' ? '优惠券 · 商品券' : '优惠券 · 满减'
}

// ============ 页面 ============

export default function AdminLotteryPage() {
  const [config, setConfig] = useState<LotteryConfig | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [prizes, setPrizes] = useState<PrizeRow[]>([])
  const [totals, setTotals] = useState<PrizeTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadOverview = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        fetch('/api/admin/lottery/config').then((r) => r.json()),
        fetch('/api/admin/lottery/prizes').then((r) => r.json()),
      ])
      if (c.success) {
        setConfig(c.data.config)
        setStats(c.data.stats)
      }
      if (p.success) {
        setPrizes(p.data.list)
        setTotals(p.data.totals)
      }
      setLoadError(c.success && p.success ? '' : c.error || p.error || '加载失败')
    } catch {
      setLoadError('网络异常，加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>
      )}
      {config && stats && <ConfigCard saved={config} stats={stats} onSaved={loadOverview} />}
      <PrizesCard prizes={prizes} totals={totals} onChanged={loadOverview} />
      <EntriesCard stats={stats} onChanged={loadOverview} />
    </div>
  )
}

// ============ 活动设置 ============

function ConfigCard({ saved, stats, onSaved }: { saved: LotteryConfig; stats: Stats; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(saved.enabled)
  const [minAmount, setMinAmount] = useState(String(saved.minOrderAmount))
  const [rules, setRules] = useState(saved.rules)
  const [saving, setSaving] = useState(false)

  // 只在「库里的配置真的变了」时重置表单：改奖项也会刷新概览，那时不能把这里没保存的输入冲掉
  const savedKey = JSON.stringify(saved)
  useEffect(() => {
    setEnabled(saved.enabled)
    setMinAmount(String(saved.minOrderAmount))
    setRules(saved.rules)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey])

  const dirty =
    enabled !== saved.enabled || Number(minAmount || 0) !== saved.minOrderAmount || rules !== saved.rules
  const noPrize = stats.enabledPrizeCount === 0 || stats.enabledRateBp <= 0

  const save = async () => {
    const amount = Number(minAmount.trim() || 0)
    if (!Number.isFinite(amount) || amount < 0) return alert('参与门槛请填 0 或正数')
    if (enabled && !saved.enabled) {
      const tip = noPrize
        ? '现在还没有启用的奖项：开启后新订单会获得抽奖资格，但在你启用奖项之前买家拆不开红包（提示「奖池暂未开放」，资格会一直保留）。\n\n确定开启？'
        : '开启后，新下的订单（货款达到门槛）会获得 1 次抽奖机会。\n\n确定开启？'
      if (!confirm(tip)) return
    }
    if (!enabled && saved.enabled) {
      if (
        !confirm(
          '关闭后，新下的订单不再获得抽奖资格。\n\n已经获得资格的订单不受影响：它们仍保留抽奖入口，付款后照样可以抽。\n\n确定关闭？'
        )
      )
        return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/lottery/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, minOrderAmount: amount, rules }),
      })
      const d = await res.json()
      if (!d.success) return alert(d.error || '保存失败')
      if (d.message) alert(d.message)
      onSaved()
    } catch {
      alert('网络异常，保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5" />
          下单有奖 · 活动设置
        </CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          符合条件的订单付款后，买家可以在「我的订单」里抽一次奖。每张订单最多抽一次。
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 开关口径：这是站长最容易误解的一条，放在最显眼的位置 */}
        <div className="flex gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">活动开关只决定「新订单」有没有抽奖资格：</p>
            <ul className="mt-1 space-y-0.5">
              <li>· 开启期间下的订单，货款达到参与门槛，就获得 1 次抽奖机会（付款后才能抽）。</li>
              <li>· 关闭期间下的订单<b>永远没有</b>抽奖资格，之后再开启也不会补发。</li>
              <li>
                · 关闭活动<b>不会收回</b>已经发出的资格：之前符合条件的订单仍保留抽奖入口，付款后照样可以抽，
                按抽奖那一刻启用的奖项和概率抽取。
              </li>
            </ul>
          </div>
        </div>

        {saved.enabled && noPrize && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              活动正在进行，但没有启用的奖项（启用奖项合计 0%）—— 买家现在拆不开红包（提示「奖池暂未开放」），
              抽奖机会会保留到你启用奖项为止。请在下方「奖项设置」里添加或启用奖项。
            </p>
          </div>
        )}
        {!saved.enabled && stats.pending > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
            活动已关闭，但还有 {stats.pending} 张订单的抽奖资格没用掉（开启期间下的单）。这些订单付款后仍然可以抽，
            按抽奖那一刻启用的奖项和概率抽取。把奖项全部停用只会让他们暂时拆不开红包（资格保留，不会记为未中奖），
            之后任何奖项重新启用他们都能抽。要控制成本，请停用高价值奖项、只留低价值奖项或调低概率。
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              enabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-800">{enabled ? '活动开启' : '活动关闭'}</span>
          {enabled !== saved.enabled && <span className="text-xs text-amber-600">（点「保存」后生效）</span>}
        </div>

        <div className="max-w-xs">
          <Input
            label="参与门槛（元）"
            type="number"
            min={0}
            step="0.01"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            0 = 不限。按订单货款判断（用了优惠券的按券后货款），开票税费不计入。
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">活动规则</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="如：活动期间下单、货款满 50 元的订单，付款后可在「我的订单」里抽奖一次；奖品以抽奖结果为准。"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <p className="mt-1 flex justify-between text-xs text-gray-400">
            <span>原样展示在买家的抽奖弹窗里。只写代码真能兑现的规则，不要承诺做不到的事。</span>
            <span className="tabular-nums">{rules.length} / 1000</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} loading={saving} disabled={!dirty}>
            保存
          </Button>
          {!dirty && <span className="text-xs text-gray-400">没有未保存的修改</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ 奖项设置 ============

function PrizesCard({
  prizes,
  totals,
  onChanged,
}: {
  prizes: PrizeRow[]
  totals: PrizeTotals | null
  onChanged: () => void
}) {
  // null = 关闭；'new' = 新增；PrizeRow = 编辑该行
  const [editing, setEditing] = useState<PrizeRow | 'new' | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const toggle = async (p: PrizeRow) => {
    setBusyId(p.id)
    try {
      // 停用/启用也走整行 PUT：启用同样要过「合计 ≤ 100%」的校验，服务端只认这一个入口
      const res = await fetch(`/api/admin/lottery/prizes/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name,
          type: p.type,
          rate: p.ratePercent,
          couponKind: p.couponKind,
          couponMinAmount: p.couponMinAmount,
          couponDiscount: p.couponDiscount,
          couponProductIds: p.couponProductIds,
          couponValidDays: p.couponValidDays,
          description: p.description,
          enabled: !p.enabled,
          sortOrder: p.sortOrder,
        }),
      })
      const d = await res.json()
      if (!d.success) return alert(d.error || '操作失败')
      onChanged()
    } catch {
      alert('网络异常，操作失败')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (p: PrizeRow) => {
    if (!confirm(`确定删除奖项「${p.name}」？\n\n删除后不可恢复。`)) return
    setBusyId(p.id)
    try {
      const res = await fetch(`/api/admin/lottery/prizes/${p.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!d.success) return alert(d.error || '删除失败')
      onChanged()
    } catch {
      alert('网络异常，删除失败')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              奖项设置
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              不限数量，只按概率抽。启用奖项的概率合计不能超过 100%，余下的就是「未中奖」。
              修改奖项只影响之后的抽奖，已中奖的记录与发出的券不变。
            </p>
          </div>
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="mr-1 h-4 w-4" />
            新增奖项
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {prizes.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">还没有奖项，点右上角新增。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-3 py-2">排序</th>
                    <th className="px-3 py-2">名称</th>
                    <th className="px-3 py-2">类型</th>
                    <th className="px-3 py-2">内容</th>
                    <th className="px-3 py-2">中奖概率</th>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2">已中出</th>
                    <th className="px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((p) => (
                    <tr key={p.id} className={`border-b border-gray-100 align-top ${p.enabled ? '' : 'text-gray-400'}`}>
                      <td className="px-3 py-3 tabular-nums">{p.sortOrder}</td>
                      <td className="px-3 py-3">
                        <div className={`font-medium ${p.enabled ? 'text-gray-900' : 'text-gray-500'}`}>{p.name}</div>
                        {p.description && (
                          <div className="mt-0.5 max-w-[240px] whitespace-pre-line text-xs text-gray-400">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{prizeTypeText(p)}</td>
                      <td className="px-3 py-3">
                        <div className="text-gray-700">{p.type === 'COUPON' ? p.label : '线下兑现'}</div>
                        {p.type === 'COUPON' && p.couponKind === 'PRODUCT' && p.couponProductIds && (
                          <div className="mt-0.5 text-xs text-gray-400">限商品 {p.couponProductIds.split(',').join(', ')}</div>
                        )}
                        {p.type === 'COUPON' && !p.couponValidDays && (
                          <div className="mt-0.5 text-xs text-gray-400">长期有效</div>
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium tabular-nums">{p.ratePercent}%</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded border px-2 py-0.5 text-xs ${
                            p.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {p.enabled ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{p.wonCount}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setEditing(p)} disabled={busyId === p.id}>
                            编辑
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggle(p)} disabled={busyId === p.id}>
                            {p.enabled ? '停用' : '启用'}
                          </Button>
                          {p.wonCount === 0 ? (
                            <Button size="sm" variant="outline" onClick={() => remove(p)} disabled={busyId === p.id}>
                              删除
                            </Button>
                          ) : (
                            <span className="self-center text-xs text-gray-400" title="已有中奖记录，只能停用">
                              不可删除
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totals && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                totals.overLimit ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
              }`}
            >
              启用奖项合计 <b className="tabular-nums">{totals.enabledRatePercent}%</b>，未中奖{' '}
              <b className="tabular-nums">{totals.noWinRatePercent}%</b>
              {totals.overLimit && (
                <span className="ml-2">
                  —— 合计超过了 100%，排在后面的奖项实际抽不到，请调低概率或停用部分奖项。
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <PrizeModal
          prize={editing === 'new' ? null : editing}
          all={prizes}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            onChanged()
          }}
        />
      )}
    </>
  )
}

/** 券面预览，与 lib/coupon.ts 的 couponLabel 同口径（那个文件进不了浏览器包，理由见文件头） */
function previewCouponLabel(kind: string, minAmount: number, discount: number): string {
  if (kind === 'PRODUCT') return `指定商品减 ¥${discount.toFixed(2)}`
  if (Math.round(minAmount * 100) <= 0) return `无门槛减 ¥${discount.toFixed(2)}`
  return `满 ¥${minAmount.toFixed(2)} 减 ¥${discount.toFixed(2)}`
}

function PrizeModal({
  prize,
  all,
  onClose,
  onSaved,
}: {
  prize: PrizeRow | null
  all: PrizeRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<'COUPON' | 'CUSTOM'>(prize?.type === 'CUSTOM' ? 'CUSTOM' : 'COUPON')
  const [name, setName] = useState(prize?.name ?? '')
  const [rate, setRate] = useState(prize?.ratePercent ?? '')
  const [kind, setKind] = useState<'THRESHOLD' | 'PRODUCT'>(prize?.couponKind === 'PRODUCT' ? 'PRODUCT' : 'THRESHOLD')
  const [minAmount, setMinAmount] = useState(prize?.couponMinAmount != null ? String(prize.couponMinAmount) : '0')
  const [discount, setDiscount] = useState(prize?.couponDiscount != null ? String(prize.couponDiscount) : '')
  const [productIds, setProductIds] = useState(prize?.couponProductIds ?? '')
  const [validDays, setValidDays] = useState(prize?.couponValidDays != null ? String(prize.couponValidDays) : '')
  const [description, setDescription] = useState(prize?.description ?? '')
  const [enabled, setEnabled] = useState(prize ? prize.enabled : true)
  const [sortOrder, setSortOrder] = useState(prize ? String(prize.sortOrder) : '0')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // 实时合计：把正在编辑的这一项换成改完后的样子再求和（与服务端 rateSumAfterEdit 同口径）
  const bp = parseRateToBp(rate)
  const othersBp = all
    .filter((p) => p.id !== prize?.id && p.enabled && p.rateBp > 0)
    .reduce((s, p) => s + p.rateBp, 0)
  const sumBp = othersBp + (enabled && bp ? bp : 0)
  const over = sumBp > RATE_SCALE

  const discountNum = Number(discount)
  const minNum = Number(minAmount || 0)
  const days = validDays.trim() ? Number(validDays) : null
  const couponPreview =
    type === 'COUPON' && discount.trim() && Number.isFinite(discountNum) && discountNum > 0 && Number.isFinite(minNum)
      ? `${previewCouponLabel(kind, kind === 'THRESHOLD' ? minNum : 0, discountNum)}${
          days && Number.isInteger(days) && days > 0 ? `（${days} 天有效）` : ''
        }`
      : null

  const submit = async () => {
    setMsg('')
    // 数字先在前端拦一道：NaN 传到服务端，zod 回的是英文报错
    if (bp == null) return setMsg('中奖概率须在 0.01% ~ 100% 之间，最多两位小数')
    const sort = Number(sortOrder || 0)
    if (!Number.isInteger(sort) || sort < -9999 || sort > 9999) return setMsg('排序须是 -9999 ~ 9999 的整数')
    if (type === 'COUPON') {
      if (!discount.trim() || !Number.isFinite(discountNum) || discountNum <= 0) return setMsg('请填写大于 0 的券面额')
      if (kind === 'THRESHOLD' && (!Number.isFinite(minNum) || minNum < 0)) return setMsg('门槛请填 0 或正数')
      if (days != null && (!Number.isInteger(days) || days < 1 || days > 3650)) {
        return setMsg('有效天数须是 1 ~ 3650 的整数；留空 = 长期有效')
      }
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        type,
        rate: rate.trim(),
        couponKind: type === 'COUPON' ? kind : null,
        couponMinAmount: type === 'COUPON' && kind === 'THRESHOLD' ? minNum : null,
        couponDiscount: type === 'COUPON' ? discountNum : null,
        // 中文逗号、空格都当分隔符，统一成英文逗号再交给服务端逐个校验
        couponProductIds:
          type === 'COUPON' && kind === 'PRODUCT'
            ? productIds
                .split(/[,，\s]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .join(',')
            : null,
        couponValidDays: type === 'COUPON' ? days : null,
        description: description.trim() || null,
        enabled,
        sortOrder: sort,
      }
      const res = await fetch(prize ? `/api/admin/lottery/prizes/${prize.id}` : '/api/admin/lottery/prizes', {
        method: prize ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!d.success) return setMsg(d.error || '保存失败')
      onSaved()
    } catch {
      setMsg('网络异常，保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold">{prize ? '编辑奖项' : '新增奖项'}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">奖品类型</label>
            <div className="flex gap-2">
              {(
                [
                  { k: 'COUPON', label: '优惠券', hint: '中奖即发到买家「我的优惠券」' },
                  { k: 'CUSTOM', label: '自定义奖品', hint: '线下兑现，后台标记已兑现' },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setType(t.k)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                    type === t.k ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-gray-400">{t.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Input label="奖项名称" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <p className="mt-1 text-xs text-gray-400">买家看到的名字，如「无门槛 5 元券」</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="中奖概率（%）"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="如 12.5"
              />
              <p className="mt-1 text-xs text-gray-400">0.01 ~ 100，最多两位小数</p>
            </div>
            <div>
              <Input
                label="排序（小的在前）"
                type="number"
                step={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          {type === 'COUPON' ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">券类型</label>
                <div className="flex gap-2">
                  {(
                    [
                      { k: 'THRESHOLD', label: '满减券', hint: '门槛填 0 即无门槛' },
                      { k: 'PRODUCT', label: '商品券', hint: '只能用于指定商品' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.k}
                      type="button"
                      onClick={() => setKind(t.k)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                        kind === t.k ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-gray-400">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {kind === 'THRESHOLD' && (
                  <Input
                    label="满多少（0 = 无门槛）"
                    type="number"
                    min={0}
                    step="0.01"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                )}
                <Input
                  label={kind === 'THRESHOLD' ? '减多少' : '优惠金额'}
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              {kind === 'PRODUCT' && (
                <div>
                  <Input
                    label="限定商品 id（逗号分隔）"
                    value={productIds}
                    onChange={(e) => setProductIds(e.target.value)}
                    placeholder="如 3,7,12"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    在「商品管理」里能看到每个商品的 id。只能填正整数，保存时会逐个核对商品是否存在。
                  </p>
                </div>
              )}

              <div>
                <Input
                  label="有效天数"
                  type="number"
                  min={1}
                  step={1}
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  placeholder="留空 = 长期有效"
                />
                <p className="mt-1 text-xs text-gray-400">从中奖那一刻起算；留空 = 长期有效</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">补充说明（可选）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">中奖后展示给买家</p>
              </div>

              {couponPreview && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">买家看到的券面：{couponPreview}</p>
              )}
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                券面额会被限制在「不把订单金额打到 0」的范围内（最低实付 0.01 元）。走推广链接下的订单不能用券。
              </p>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">奖品内容与兑奖方式（必填）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="如：定制周边一份。中奖后请在对应订单内联系客服，提供收货信息兑奖。"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                中奖后原样展示给买家。自定义奖品由人工线下兑现，兑现后在下方「抽奖记录」里标记已兑现。
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4" />
            启用（参与抽奖）
          </label>

          <div className={`rounded-lg px-3 py-2 text-sm ${over ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
            {bp == null ? (
              <span className="text-gray-400">填好中奖概率后，这里显示保存后的合计</span>
            ) : (
              <>
                保存后：启用奖项合计 <b className="tabular-nums">{bpToPercentText(sumBp)}%</b>，未中奖{' '}
                <b className="tabular-nums">{bpToPercentText(Math.max(0, RATE_SCALE - sumBp))}%</b>
                {over && <span className="ml-1">—— 超过 100%，无法保存</span>}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          {msg && <p className="mr-auto text-sm text-red-600">{msg}</p>}
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} loading={saving} disabled={!name.trim() || !rate.trim()}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ 抽奖记录 ============

function EntriesCard({ stats, onChanged }: { stats: Stats | null; onChanged: () => void }) {
  const [list, setList] = useState<EntryRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: '20', filter })
      if (debounced) q.set('keyword', debounced)
      const res = await fetch(`/api/admin/lottery/entries?${q}`, { signal: ac.signal })
      const d = await res.json()
      if (ac.signal.aborted) return
      if (d.success) {
        setList(d.data.list)
        setTotal(d.data.total)
        setTotalPages(d.data.totalPages || 1)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [page, filter, debounced])

  useEffect(() => {
    load()
  }, [load])

  // 筛选变更回到第 1 页，避免筛完停在空白页
  useEffect(() => {
    setPage(1)
  }, [debounced, filter])

  const fulfill = async (r: EntryRow) => {
    const note = prompt(
      `把「${r.prizeName || '自定义奖品'}」（订单 ${r.orderNo}）标记为已兑现。\n\n可填备注（如发放方式、快递单号），留空也可以：`,
      ''
    )
    if (note === null) return
    setBusyId(r.id)
    try {
      const res = await fetch(`/api/admin/lottery/entries/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FULFILL', note: note.trim() || null }),
      })
      const d = await res.json()
      if (!d.success) return alert(d.error || '操作失败')
      load()
      onChanged()
    } catch {
      alert('网络异常，操作失败')
    } finally {
      setBusyId(null)
    }
  }

  const statItems: { label: string; value: number | undefined; cls?: string }[] = [
    { label: '有资格的订单', value: stats?.entryTotal },
    { label: '待抽', value: stats?.pending },
    { label: '已抽', value: stats?.drawn },
    { label: '中奖', value: stats?.won },
    // 这一格是后台真正要处理的待办，有数时标黄
    { label: '自定义奖品待兑现', value: stats?.customPending, cls: stats?.customPending ? 'text-amber-600' : undefined },
    { label: '已作废', value: stats?.voided },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          抽奖记录
        </CardTitle>
        <div className="text-right text-sm text-gray-500">
          共 <span className="font-semibold text-gray-800">{total}</span> 条
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statItems.map((s) => (
            <div key={s.label} className="rounded-lg border border-gray-200 px-3 py-2">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className={`mt-0.5 text-lg font-semibold tabular-nums ${s.cls || 'text-gray-900'}`}>
                {s.value ?? '—'}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜订单号或用户邮箱"
              className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">全部</option>
            <option value="pending">待抽</option>
            <option value="drawn">已抽</option>
            <option value="won">中奖</option>
            <option value="lost">未中奖</option>
            <option value="customPending">自定义奖品待兑现</option>
            <option value="void">已作废</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {debounced || filter !== 'all' ? '没有符合条件的记录' : '还没有订单获得抽奖资格'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-3 py-2">订单号</th>
                  <th className="px-3 py-2">用户</th>
                  <th className="px-3 py-2">资格时间</th>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">结果</th>
                  <th className="px-3 py-2">券状态</th>
                  <th className="px-3 py-2">兑现</th>
                  <th className="px-3 py-2">抽奖时间</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const st = ENTRY_STATE[r.state] || ENTRY_STATE.VOID
                  const cs = r.coupon?.state ? COUPON_STATE[r.coupon.state] : null
                  const fs = r.fulfillState ? FULFILL_STATE[r.fulfillState] : null
                  return (
                    <tr key={r.id} className="border-b border-gray-100 align-top">
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/orders?orderId=${r.orderId}`}
                          className="font-mono text-xs text-primary-600 hover:underline"
                        >
                          {r.orderNo}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <div className="text-gray-800">
                          {r.user?.email || r.user?.nickname || `用户#${r.userId}`}
                        </div>
                        {r.user?.email && r.user?.nickname && (
                          <div className="mt-0.5 text-gray-400">{r.user.nickname}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">{fmt(r.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded border px-2 py-0.5 text-xs ${st.cls}`}>{st.text}</span>
                      </td>
                      <td className="px-3 py-3">
                        {r.state !== 'DRAWN' ? (
                          <span className="text-gray-400">—</span>
                        ) : r.won ? (
                          <>
                            <div className="font-medium text-gray-900">{r.prizeName}</div>
                            {r.prizeLabel && r.prizeLabel !== r.prizeName && (
                              <div className="mt-0.5 text-xs text-gray-500">{r.prizeLabel}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">未中奖</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {cs ? (
                          <>
                            <span className={`rounded border px-2 py-0.5 text-xs ${cs.cls}`}>{cs.text}</span>
                            {r.coupon?.orderId != null && (
                              <div className="mt-1 text-xs">
                                <Link
                                  href={`/admin/orders?orderId=${r.coupon.orderId}`}
                                  className="text-primary-600 hover:underline"
                                >
                                  用于订单 #{r.coupon.orderId}
                                </Link>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {r.prizeType === 'CUSTOM' && fs ? (
                          <div className="space-y-1">
                            <span className={`rounded border px-2 py-0.5 ${fs.cls}`}>{fs.text}</span>
                            {r.fulfillState === 'PENDING' && (
                              <div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fulfill(r)}
                                  disabled={busyId === r.id}
                                >
                                  标记已兑现
                                </Button>
                              </div>
                            )}
                            {r.fulfillState === 'DONE' && r.fulfilledAt && (
                              <div className="text-gray-400">{fmt(r.fulfilledAt)}</div>
                            )}
                            {r.fulfillNote && <div className="max-w-[180px] text-gray-400">{r.fulfillNote}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">{fmt(r.drawnAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </Button>
            <span className="text-sm tabular-nums text-gray-500">
              {page} / {totalPages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              下一页
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
