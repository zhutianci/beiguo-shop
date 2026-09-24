/**
 * 后台「发票管理」的一行：列表（GET /api/admin/invoices）与单张（GET /api/admin/invoices/[id]）共用。
 *
 * 【为什么从列表路由里搬出来】深链 /admin/invoices?invoiceId=… 要单独取一张发票来开弹窗。
 * 两个接口各拼一遍行，迟早一边多一个字段、一边少一个 —— 从深链打开的弹窗就会缺东西，
 * 而且缺的恰好是「关联订单」这种排查时最要紧的信息。route.ts 又只能导出 HTTP handler，
 * 所以行的拼装放在 lib。
 *
 * 【关联订单怎么找】Invoice / ExternalOrder / Order 之间没有任何 Prisma 关系，
 * 线索规则统一走 lib/order-link.ts（shopOrderId → 'order:<id>' → 发票上的 sourceKey 快照），
 * 这里不另写一套。
 *
 * 本文件也放「预收税费的订单不许删发票」的判定：by-order 的 PUT/DELETE 与按 id 的 DELETE
 * 三处共用一个口径，任何一处漏掉，就是「收了 6%、票却从待开清单里消失」。
 */
import type { ExternalOrder, Invoice } from '@prisma/client'
import { prisma } from './db'
import { calcInvoiceAmounts } from './invoice'
import { orderIdFromSourceKey, shopOrdersForInvoices, type ShopOrderBrief } from './order-link'

/** 发票挂着的那条「外部订单」的原始信息（闲鱼 / 腾讯文档导入的订单只有这些，没有站内订单） */
export interface AdminInvoiceExtInfo {
  id: number
  claudeAccount: string
  subscriptionType: string
  xianyuNickname: string | null
  /** 'SHOP' 站内订单背书行 | 'WEB' 后台标记已完成时导入 | 其余为腾讯文档导入批次 */
  importBatch: string | null
  startDate: Date
  expireDate: Date
  quote: number | null
  shopOrderId: number | null
}

export interface AdminInvoiceRow {
  /** 手动录入的站外发票没有订单，这里是 null */
  externalOrderId: number | null
  invoiceId: number | null
  invoiceNo: string | null
  claudeAccount: string
  subscriptionType: string
  xianyuNickname: string | null
  orderStartDate: Date | null
  orderExpireDate: Date | null
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  /** 买家申请时的必选项；历史发票与管理员凭空建的记录为 null，前端显示「—」 */
  showAiWording: boolean | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  status: string
  payStatus: string
  paidAt: Date | null
  submittedAt: Date | null
  issuedAt: Date | null
  createdAt: Date
  /** 发票来源：'BUYER' | 'MANUAL' | null（历史数据与后台按订单建的空壳） */
  source: string | null
  /** 提交发票的买家（登录态下提交才有） */
  userId: number | null
  /** true = 管理员手动录入的站外客户发票（没有订单）。前端据此改走「按发票 id」的改状态接口 */
  manual: boolean
  /**
   * true = 发票还在，但它挂的外部订单已被删除（没有外键，删订单不会连带删票）。
   * 列表里一直不展示这种行，只有按 id 深链打开时才会出现；改状态同样只能按发票 id。
   */
  orphan: boolean
  /** 关联的站内订单；手动录入、纯外部导入的订单为 null */
  shopOrder: ShopOrderBrief | null
  /** 挂着的外部订单；手动录入 / 孤儿发票为 null */
  ext: AdminInvoiceExtInfo | null
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function extInfo(o: ExternalOrder): AdminInvoiceExtInfo {
  return {
    id: o.id,
    claudeAccount: o.claudeAccount,
    subscriptionType: o.subscriptionType,
    xianyuNickname: o.xianyuNickname,
    importBatch: o.importBatch,
    startDate: o.startDate,
    expireDate: o.expireDate,
    quote: num(o.quote),
    shopOrderId: o.shopOrderId,
  }
}

/** 「外部订单 + 可选发票」拼成一行（旧版字段逐个保留；关联订单由 buildAdminInvoiceRows 批量补上） */
export function buildRow(o: ExternalOrder, iv: Invoice | null): AdminInvoiceRow {
  const quote = num(o.quote)

  let st: string
  let sellingPrice: number | null
  let invoiceAmount: number | null
  let taxFee: number | null
  let payStatus: string
  if (iv) {
    st = iv.status
    sellingPrice = num(iv.sellingPrice)
    invoiceAmount = num(iv.invoiceAmount)
    taxFee = num(iv.taxFee)
    payStatus = iv.payStatus
  } else {
    // 没有发票记录 = 未开发票；金额按当前报价预估（与买家申请时的算法同一个函数）
    st = 'UNAPPLIED'
    payStatus = 'UNPAID'
    if (quote != null) {
      sellingPrice = quote
      const amt = calcInvoiceAmounts(quote)
      invoiceAmount = amt.invoiceAmount
      taxFee = amt.taxFee
    } else {
      sellingPrice = null
      invoiceAmount = null
      taxFee = null
    }
  }

  return {
    externalOrderId: o.id,
    invoiceId: iv?.id ?? null,
    invoiceNo: iv?.invoiceNo ?? null,
    claudeAccount: o.claudeAccount,
    subscriptionType: o.subscriptionType,
    xianyuNickname: o.xianyuNickname,
    orderStartDate: o.startDate,
    orderExpireDate: o.expireDate,
    title: iv?.title ?? null,
    taxNumber: iv?.taxNumber ?? null,
    address: iv?.address ?? null,
    phone: iv?.phone ?? null,
    bankName: iv?.bankName ?? null,
    bankAccount: iv?.bankAccount ?? null,
    email: iv?.email ?? null,
    showAiWording: iv?.showAiWording ?? null,
    sellingPrice,
    invoiceAmount,
    taxFee,
    status: st,
    payStatus,
    paidAt: iv?.paidAt ?? null,
    submittedAt: iv?.submittedAt ?? null,
    issuedAt: iv?.issuedAt ?? null,
    createdAt: iv?.createdAt ?? o.createdAt,
    source: iv?.source ?? null,
    userId: iv?.userId ?? null,
    manual: false,
    orphan: false,
    shopOrder: null,
    ext: extInfo(o),
  }
}

/**
 * 没有外部订单可挂的发票 → 同一行形状，缺的置 null。两种来源：
 *   · source='MANUAL' —— 管理员手动录入的站外客户发票（列表的「手动录入」视图）
 *   · 其余 —— 外部订单被删后留下的孤儿发票（列表不展示，只有按 id 深链时才会走到这里）
 */
export function buildManualRow(iv: Invoice): AdminInvoiceRow {
  const manual = iv.source === 'MANUAL'
  return {
    externalOrderId: null,
    invoiceId: iv.id,
    invoiceNo: iv.invoiceNo,
    claudeAccount: iv.claudeAccount,
    subscriptionType: iv.subscriptionType,
    xianyuNickname: null,
    orderStartDate: iv.orderStartDate,
    orderExpireDate: iv.orderExpireDate,
    title: iv.title,
    taxNumber: iv.taxNumber,
    address: iv.address,
    phone: iv.phone,
    bankName: iv.bankName,
    bankAccount: iv.bankAccount,
    email: iv.email,
    showAiWording: iv.showAiWording,
    sellingPrice: num(iv.sellingPrice),
    invoiceAmount: num(iv.invoiceAmount),
    taxFee: num(iv.taxFee),
    status: iv.status,
    payStatus: iv.payStatus,
    paidAt: iv.paidAt,
    submittedAt: iv.submittedAt,
    issuedAt: iv.issuedAt,
    createdAt: iv.createdAt,
    source: iv.source,
    userId: iv.userId,
    manual,
    orphan: !manual,
    shopOrder: null,
    ext: null,
  }
}

/** 一行的原料：挂订单的发票 / 没开票的外部订单带 ext；手动录入与孤儿发票 ext 为 null */
export interface AdminInvoiceRowSource {
  ext: ExternalOrder | null
  iv: Invoice | null
}

/**
 * 批量拼行，并一次性补上每行的关联站内订单（固定三次查询，与页大小无关）。
 *
 * 【没有发票的行也要找订单】「未开发票」视图以外部订单为主表，大多数行根本没有发票记录，
 * 但它们照样可能是某张站内订单的背书行（'order:<id>' 或带 shopOrderId 的 WEB 行）。
 * shopOrdersForInvoices 只认「发票」，这里给这些行一个**负数**占位 id（-外部订单 id），
 * 让它顺着 externalOrderId 走同一条线索规则：发票 id 是自增正数，负数不会与之相撞，
 * 而且即便那个函数以后改成按 id 回查发票，负数也只会查不到，不会串到别的行上。
 */
export async function buildAdminInvoiceRows(sources: AdminInvoiceRowSource[]): Promise<AdminInvoiceRow[]> {
  const rows: AdminInvoiceRow[] = []
  const lookups: { id: number; externalOrderId: number | null; sourceKey: string | null }[] = []
  for (const s of sources) {
    if (s.ext) {
      rows.push(buildRow(s.ext, s.iv))
      lookups.push({ id: s.iv ? s.iv.id : -s.ext.id, externalOrderId: s.ext.id, sourceKey: s.iv?.sourceKey ?? null })
    } else if (s.iv) {
      rows.push(buildManualRow(s.iv))
      // 手动录入的没有任何线索，查了也是空；孤儿发票还剩 sourceKey 快照可以指回订单
      lookups.push({ id: s.iv.id, externalOrderId: null, sourceKey: s.iv.source === 'MANUAL' ? null : s.iv.sourceKey })
    } else {
      lookups.push({ id: 0, externalOrderId: null, sourceKey: null })
    }
  }

  const wanted = lookups.filter((l) => l.id !== 0 && (l.externalOrderId != null || l.sourceKey))
  const map = wanted.length ? await shopOrdersForInvoices(wanted) : new Map<number, ShopOrderBrief>()
  rows.forEach((r, i) => {
    const key = lookups[i].id
    if (key !== 0) r.shopOrder = map.get(key) ?? null
  })
  return rows
}

// ============ 预收税费的订单：不许删发票 ============

/** 外部订单（及发票上的 sourceKey 快照）指向的站内订单 id；指不到 → null */
export function shopOrderIdOf(
  ext: { shopOrderId: number | null; sourceKey: string | null } | null,
  invoiceSourceKey?: string | null
): number | null {
  return ext?.shopOrderId ?? orderIdFromSourceKey(ext?.sourceKey) ?? orderIdFromSourceKey(invoiceSourceKey)
}

/**
 * 这张站内订单是否在结账时就把发票税费一起收了（勾了「同时开发票」且已付款）。
 *
 * 【是的话，它的发票不能被删、也不能重置成「未开发票」】删掉发票行不会清掉
 * Order.invoiceTaxFee，买家订单页仍显示「已提交开票」、仍然不给「申请发票」的按钮
 * （判据读的是 invoiceTaxFee，见 api/orders/route.ts），而票却从待开清单里消失了 ——
 * 收了钱、没开票、两边都不知道。要停开这张票，用「不可开据」，它留痕且买家看得见。
 */
export async function isPrepaidShopOrder(shopOrderId: number | null): Promise<boolean> {
  if (!shopOrderId) return false
  const hit = await prisma.order.findFirst({
    where: { id: shopOrderId, payStatus: 'PAID', invoiceTaxFee: { not: null } },
    select: { id: true },
  })
  return !!hit
}
