'use client'

/**
 * 一次性补货表单（docs/微信机器人-设计.md §9.1 第 3–5 步）：选商品、粘贴卡密（每行一张）、每张成本、批次名、兑换方式 → 提交。
 * 成功导入后链接作废，页面停在结果上；导入 0 张（全是空行或重复）时链接仍有效，可以改了再交。
 * 不写 localStorage / sessionStorage：卡密与令牌都不留在这台手机上。
 */
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, PackagePlus } from 'lucide-react'

export interface RestockProductOption {
  id: number
  name: string
  botCode: string | null
  onSale: boolean
  stock: number
  redeemProvider: string
  redeemUrl: string
  cost: number | null
}

interface Outcome {
  productName: string
  total: number
  created: number
  skipped: number
  inserted: number
  consumed: boolean
  stock: number | null
  awaiting: number
}

const inputCls =
  'w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-[15px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/60'
const labelCls = 'block text-[12px] text-white/50 mb-1.5'

function countLines(s: string): number {
  const seen = new Set<string>()
  for (const line of s.split(/\r?\n/)) {
    const t = line.trim()
    if (t) seen.add(t)
  }
  return seen.size
}

export function RestockForm(props: {
  token: string
  products: RestockProductOption[]
  providers: { key: string; label: string }[]
  initialProductId: number | null
  defaultBatch: string
  expiresAt: string
  adminName: string | null
  maxLines: number
}) {
  const first = props.products.find((p) => p.id === props.initialProductId) ?? null
  const [productId, setProductId] = useState<number | ''>(first ? first.id : '')
  const [content, setContent] = useState('')
  const [cost, setCost] = useState(first?.cost != null ? String(first.cost) : '')
  const [batch, setBatch] = useState(props.defaultBatch)
  const [provider, setProvider] = useState(first?.redeemProvider ?? '')
  const [redeemUrl, setRedeemUrl] = useState(first?.redeemUrl ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [dead, setDead] = useState(false)
  const [left, setLeft] = useState(() => Math.max(0, Date.parse(props.expiresAt) - Date.now()))

  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, Date.parse(props.expiresAt) - Date.now())), 1000)
    return () => clearInterval(t)
  }, [props.expiresAt])

  const lines = useMemo(() => countLines(content), [content])
  const product = props.products.find((p) => p.id === productId) ?? null
  const expired = left <= 0
  const finished = dead || !!outcome?.consumed

  function pickProduct(v: string) {
    const id = v ? Number(v) : ''
    setProductId(id)
    const p = props.products.find((x) => x.id === id)
    // 换商品就换成那个商品最近一批的成本与兑换方式（§9.1：兑换平台默认沿用该商品最近一批）
    setCost(p?.cost != null ? String(p.cost) : '')
    setProvider(p?.redeemProvider ?? '')
    setRedeemUrl(p?.redeemUrl ?? '')
  }

  async function submit() {
    setErr('')
    if (!productId) return setErr('请先选择商品')
    if (!lines) return setErr('请粘贴卡密，每行一张')
    if (lines > props.maxLines) return setErr(`一次最多 ${props.maxLines} 张，请分批提交`)
    const costNum = cost.trim() === '' ? undefined : Number(cost)
    if (costNum !== undefined && (!Number.isFinite(costNum) || costNum < 0 || costNum > 999999)) return setErr('成本要是 0 到 999999 之间的数字')
    const url = provider ? '' : redeemUrl.trim()
    if (url && !/^https?:\/\//i.test(url)) return setErr('兑换地址要以 http:// 或 https:// 开头')
    setBusy(true)
    try {
      const res = await fetch('/api/bot/x/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: props.token,
          productId,
          content,
          cost: costNum,
          batch: batch.trim() || null,
          redeemProvider: provider || null,
          redeemUrl: url || null,
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.success) {
        if (res.status === 410) setDead(true)
        setErr(j?.error || '提交失败，请稍后再试')
        return
      }
      setOutcome(j.data as Outcome)
      if ((j.data as Outcome).consumed) setContent('')
    } catch {
      setErr('网络出错，请稍后再试（链接没有作废）')
    } finally {
      setBusy(false)
    }
  }

  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d12]/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <PackagePlus className="w-4 h-4 text-blue-300 shrink-0" />
            <span className="text-[15px] font-semibold truncate">补货</span>
            {props.adminName && <span className="text-[11px] text-white/35 truncate">发起人：{props.adminName}</span>}
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] tabular-nums ${expired || finished ? 'border-white/10 text-white/35' : 'border-amber-400/30 text-amber-300'}`}>
            {finished ? '链接已作废' : expired ? '已过期' : `${mm}:${ss} 后失效`}
          </span>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-xl mx-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {outcome && (
          <div className={`rounded-xl border px-3.5 py-3 text-[14px] leading-relaxed ${outcome.consumed ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
            <div className="flex items-center gap-1.5 font-medium">
              {outcome.consumed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {outcome.consumed ? '补货完成' : '没有导入新卡'}
            </div>
            <div className="mt-1 text-[13px] opacity-90">
              {outcome.consumed
                ? `「${outcome.productName}」导入 ${outcome.inserted} 张${outcome.skipped ? `，重复跳过 ${outcome.skipped} 张` : ''}${outcome.stock !== null ? `，当前库存 ${outcome.stock} 张` : ''}。链接已作废，群里会收到回执。`
                : `${outcome.total} 张都已经在库里（重复），链接仍然有效，可以修改后再提交。`}
              {outcome.consumed && outcome.awaiting > 0 && `还有 ${outcome.awaiting} 单付了款在等卡，回群里发「@贝果助手 补发 ${product?.botCode || '<货号>'}」即可补发。`}
            </div>
          </div>
        )}

        {err && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <fieldset disabled={busy || finished || expired} className="space-y-4 disabled:opacity-60">
          <div>
            <label className={labelCls}>商品（只列自动发货商品）</label>
            <select className={inputCls} value={productId} onChange={(e) => pickProduct(e.target.value)}>
              <option value="">请选择</option>
              {props.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.botCode || '无货号'}）· 库存 {p.stock >= 0 ? p.stock : '—'}
                  {p.onSale ? '' : ' · 已下架'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              卡密（每行一张）<span className="ml-2 tabular-nums text-white/35">{lines} 张</span>
            </label>
            <textarea
              className={`${inputCls} font-mono text-[13px] min-h-[180px]`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="每行一张，空行与重复会自动跳过"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>每张成本（元）</label>
              <input className={inputCls} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="不填按 0" />
            </div>
            <div>
              <label className={labelCls}>批次名</label>
              <input className={inputCls} value={batch} maxLength={40} onChange={(e) => setBatch(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>兑换方式</label>
            <select className={inputCls} value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="">不走站内兑换（给买家卡密 + 兑换地址）</option>
              {props.providers.map((p) => (
                <option key={p.key} value={p.key}>
                  站内兑换：{p.label}
                </option>
              ))}
            </select>
          </div>

          {!provider && (
            <div>
              <label className={labelCls}>兑换地址（选填，留空用商品默认）</label>
              <input className={inputCls} value={redeemUrl} maxLength={500} onChange={(e) => setRedeemUrl(e.target.value)} placeholder="https://" />
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            className="w-full rounded-xl bg-blue-500 py-3 text-[15px] font-semibold text-white active:bg-blue-600 disabled:bg-white/10"
            disabled={busy || finished || expired}
          >
            {busy ? '提交中…' : '提交导入'}
          </button>
          <p className="text-[11px] text-white/30 leading-relaxed">
            提交成功后这个链接立即作废；全是重复的卡不算提交，链接仍然有效。一次最多 {props.maxLines} 张。
          </p>
        </fieldset>
      </main>
    </div>
  )
}
