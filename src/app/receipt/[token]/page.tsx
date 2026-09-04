'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ReceiptItem {
  label: string
  value: string
}

interface Receipt {
  receiptNo: string
  source: string // BUYER 买家提交 | MANUAL 手动开具
  payerTitle: string
  payee: string
  claudeAccount: string | null
  subscriptionType: string | null
  orderStartDate: string | null
  orderExpireDate: string | null
  items: ReceiptItem[]
  remark: string | null
  amount: number
  amountCapital: string
  issuedAt: string
  createdAt: string
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function ReceiptPage() {
  const params = useParams()
  const token = String(params.token || '')
  const [r, setR] = useState<Receipt | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading')
  const [sealOk, setSealOk] = useState(true)

  useEffect(() => {
    fetch(`/api/receipts/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setR(data.data)
          setState('ok')
        } else setState('notfound')
      })
      .catch(() => setState('notfound'))
  }, [token])

  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>
  if (state === 'notfound' || !r)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">收据不存在或已被删除</div>

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0">
      {/* 操作栏（打印时隐藏） */}
      <div className="max-w-[760px] mx-auto mb-4 flex justify-end gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
        >
          打印 / 保存为 PDF
        </button>
      </div>

      {/* 收据主体 */}
      <div className="receipt-paper max-w-[760px] mx-auto bg-white shadow-lg print:shadow-none border border-gray-200 print:border-0 px-12 py-10 relative">
        {/* 标题 */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold tracking-[0.3em] text-gray-900" style={{ fontFamily: 'KaiTi, STKaiti, serif' }}>
            收　据
          </h1>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-8 mt-4">
          <span>No. {r.receiptNo}</span>
          <span>开具日期：{fmtDate(r.issuedAt)}</span>
        </div>

        {/* 表格：固定行 + 订单行/DIY 条目，两种来源的展示格式保持一致 */}
        <table className="w-full text-[15px] text-gray-800 border-collapse">
          <tbody>
            <Row label="付款人" value={r.payerTitle} />
            <Row label="收款人" value={r.payee} />
            {r.claudeAccount && <Row label="账户" value={r.claudeAccount} mono />}
            {r.subscriptionType && <Row label="项目" value={`${r.subscriptionType} 会员订阅`} />}
            {r.orderStartDate && <Row label="会员开通日期" value={fmtDate(r.orderStartDate)} />}
            {r.orderExpireDate && <Row label="会员到期日期" value={fmtDate(r.orderExpireDate)} />}
            {/* 手动开具的自定义条目，按管理员拖动排定的顺序渲染 */}
            {r.items.map((it, i) => (
              <Row key={`${it.label}-${i}`} label={it.label} value={it.value} />
            ))}
            <Row label="付款金额（大写）" value={r.amountCapital} />
            <Row label="付款金额（小写）" value={<span className="font-bold text-lg">¥ {r.amount.toFixed(2)}</span>} />
            {r.remark && <Row label="备注" value={r.remark} />}
          </tbody>
        </table>

        {/* 收款方 + 公章 */}
        <div className="mt-12 flex justify-end relative">
          <div className="text-right text-sm text-gray-700 leading-8 relative">
            <div>收款单位：{r.payee}</div>
            <div>开具日期：{fmtDate(r.issuedAt)}</div>
            {sealOk && (
              <img
                src="/seal-bigo.png"
                alt="公章"
                onError={() => setSealOk(false)}
                className="absolute -top-10 right-2 w-40 h-40 object-contain opacity-90 pointer-events-none select-none"
                style={{ transform: 'rotate(-12deg)' }}
              />
            )}
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-400 text-center">本收据为付款凭证，加盖公章后生效。</p>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <tr>
      <td className="border border-gray-300 bg-gray-50 px-4 py-3 w-40 text-gray-500 align-top whitespace-nowrap">{label}</td>
      <td className={`border border-gray-300 px-4 py-3 ${mono ? 'font-mono break-all' : ''}`}>{value}</td>
    </tr>
  )
}
