'use client'

/**
 * 后台列表的「来源站」徽章与筛选下拉（设计 5.5、12.2；WP4）。
 *
 * 选项由各列表接口随响应带回（data.sites，服务端 lib/admin/source-site 的 siteOptions，30 秒缓存），
 * 这里不单独请求：只有主站时下拉里就一项「主站」，页面照常可用（休眠期的样子）。
 * 值的约定与接口一致：'' = 全部（接口收 all / 不传），数字字符串 = 某站；卡密页另有 'stock'（库存 = 未售）。
 */

export interface SourceSite {
  tenantId: number
  code: string
}
export interface SiteOption extends SourceSite {
  name: string
  status?: string
}

const PALETTE = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

/** 主站灰色；渠道按 id 取固定颜色（同一渠道在各页面颜色一致，一眼能区分） */
export function SourceBadge({ source, label, className = '' }: { source?: SourceSite | null; label?: string; className?: string }) {
  if (!source) return <span className="text-gray-300">—</span>
  const main = source.tenantId === 1
  const cls = main ? 'bg-gray-100 text-gray-600' : PALETTE[source.tenantId % PALETTE.length]
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${cls} ${className}`}
      title={main ? '主站订单 / 数据' : `渠道分站：${source.code}`}
    >
      {label ?? (main ? '主站' : source.code)}
    </span>
  )
}

export function SourceFilter({
  value,
  onChange,
  options,
  withStock = false,
  className = 'rounded-lg border border-gray-300 px-4 py-2.5 text-sm',
}: {
  value: string
  onChange: (v: string) => void
  options: SiteOption[] | null | undefined
  /** 卡密页：多一个「库存（未售）」 */
  withStock?: boolean
  className?: string
}) {
  const list = options && options.length ? options : [{ tenantId: 1, code: 'main', name: '主站' }]
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} title="按来源站筛选">
      <option value="">全部来源站</option>
      {list.map((o) => (
        <option key={o.tenantId} value={String(o.tenantId)}>
          {o.tenantId === 1 ? '主站' : `${o.code}${o.name && o.name !== o.code ? `（${o.name}）` : ''}`}
        </option>
      ))}
      {withStock && <option value="stock">库存（未售）</option>}
    </select>
  )
}

/** 把下拉值拼进查询串：'' 不带（= 全部） */
export function appendSourceParam(params: URLSearchParams, value: string, key = 'tenantId'): void {
  if (value) params.set(key, value)
}
