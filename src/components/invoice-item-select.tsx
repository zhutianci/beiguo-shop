'use client'

import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { INVOICE_ITEMS, invoiceItemOf, type InvoiceItemKey } from '@/lib/invoice-items'

/**
 * 发票 / 收据项目选择（下单弹窗、我的订单、邮箱查订阅、开票填写链接、后台手动录入共用）。
 *
 * 【原生 select 而不是一排卡片】五个选项摆成卡片要多占两三行，结算弹窗本来就限高滚动
 * （见 purchase-modal 的注释），手机上原生 select 还会弹系统滚轮，最省地方也最好点。
 * 默认选中「技术咨询服务」= 这个功能上线前所有发票的固定项目，买家不动它就和原来一样。
 */
export function InvoiceItemSelect({
  value,
  onChange,
  theme = 'dark',
  label = '发票项目',
  className = '',
}: {
  value: InvoiceItemKey
  onChange: (v: InvoiceItemKey) => void
  /** dark = 站内暗色玻璃风；light = 开票填写链接、后台这类白底页面 */
  theme?: 'dark' | 'light'
  label?: string
  className?: string
}) {
  const id = useId()
  const item = invoiceItemOf(value)
  const dark = theme === 'dark'
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={dark ? 'mb-1.5 block text-xs text-white/50' : 'mb-1.5 block text-sm font-medium text-gray-700'}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as InvoiceItemKey)}
          className={
            dark
              ? 'w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-sm text-white outline-none focus:border-purple-500/50 [&>option]:bg-neutral-900 [&>option]:text-white'
              : 'w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
          }
        >
          {INVOICE_ITEMS.map((it, i) => (
            <option key={it.key} value={it.key}>
              {it.name}
              {i === 0 ? '（默认）' : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-white/40' : 'text-gray-400'}`}
        />
      </div>
      <p className={dark ? 'mt-1 text-[11px] text-white/35' : 'mt-1 text-xs text-gray-500'}>
        商品和服务税收编码 <span className="font-mono">{item.taxCode}</span>
      </p>
    </div>
  )
}
