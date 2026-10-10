/**
 * 发票 / 收据的「项目」：买家开票时自选，批量导出时写进税局模板表二的
 * 「项目名称」「商品和服务税收编码」两列，收据「项目」一栏也跟着它走。
 *
 * 【无 node 依赖】下单弹窗、订单页、开票填写链接这些客户端组件直接 import 这份清单，
 * 选项与服务端校验只有这一个来源。
 *
 * 【库里存 key 不存名称】名称与编码是一对，存名称的话以后改一个字就对不上编码了；
 * 存 key 则改文案只动这里。NULL = 这个功能上线前的历史记录 / 没选过，一律按
 * DEFAULT_INVOICE_ITEM（技术咨询服务）开 —— 与上线前的固定值完全一致。
 *
 * 【编码一位都不能错】税局导入按编码校验，错了是整批退回。下面的编码逐字取自站长给的清单；
 * 「信息系统服务」与「服务费」共用 3040203000000000000 也是清单原样。
 */
export const INVOICE_ITEMS = [
  { key: 'TECH_CONSULT', name: '技术咨询服务', taxCode: '3040102000000000000' },
  { key: 'INFO_SYSTEM', name: '信息系统服务', taxCode: '3040203000000000000' },
  { key: 'SOFTWARE', name: '软件服务费', taxCode: '3040201990000000000' },
  { key: 'SERVICE', name: '服务费', taxCode: '3040203000000000000' },
  { key: 'TEST', name: '测试费', taxCode: '3040201040000000000' },
] as const

export type InvoiceItemKey = (typeof INVOICE_ITEMS)[number]['key']
export type InvoiceItem = (typeof INVOICE_ITEMS)[number]

export const DEFAULT_INVOICE_ITEM: InvoiceItemKey = 'TECH_CONSULT'

export const INVOICE_ITEM_KEYS = INVOICE_ITEMS.map((i) => i.key) as [InvoiceItemKey, ...InvoiceItemKey[]]

export function isInvoiceItemKey(v: unknown): v is InvoiceItemKey {
  return typeof v === 'string' && INVOICE_ITEMS.some((i) => i.key === v)
}

/** key → 项目（名称 + 编码）。认不出来的（NULL、历史行、被篡改的入参）一律按默认项目 */
export function invoiceItemOf(key: string | null | undefined): InvoiceItem {
  return INVOICE_ITEMS.find((i) => i.key === key) || INVOICE_ITEMS[0]
}

/** 只要名称（页面展示、通知文案用） */
export function invoiceItemName(key: string | null | undefined): string {
  return invoiceItemOf(key).name
}

/**
 * 入参归一化：合法 key 原样返回，缺省 / 空串回落默认项目，其他值返回 null 让调用方报错。
 *
 * 【缺省不报错】项目是「可选、默认技术咨询服务」，不像「是否展示字眼」那样必选：
 * 上线瞬间还开着旧页面的买家提交时不会带这个字段，应当照旧按技术咨询服务开出来，而不是被拦下。
 */
export function normalizeInvoiceItem(v: unknown): InvoiceItemKey | null {
  if (v === undefined || v === null || v === '') return DEFAULT_INVOICE_ITEM
  return isInvoiceItemKey(v) ? v : null
}
