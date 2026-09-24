/**
 * 开票填写链接（站外客户自助填写开票信息）。
 *
 * 流程：管理员填含税金额 → 生成链接 → 发给客户 → 客户填抬头/税号/邮箱/是否展示字眼并提交
 * → 同一个事务里把链接翻成 SUBMITTED、建出一张 MANUAL 发票（SUBMITTED + PAID）进待开清单。
 *
 * 【安全口径】这个链接是**公开可访问**的（客户不一定是本站用户，不能要求登录）：
 *  · 令牌 128-bit 随机，不可枚举；robots 里 Disallow，页面 noindex
 *  · 金额与开票内容由管理员定，客户只能填抬头信息 —— 客户改不了自己要开多少钱的票
 *  · 一个链接只能提交一次：CAS（updateMany where status='PENDING' 且未过期），不是先查后写
 *  · 发票与链接状态同一事务：建发票失败 → 链接仍是 PENDING，客户可以重试
 *  · 公开查询只回显客户自己填过的抬头与打码邮箱，不回显后台备注与客户标识
 */
import crypto from 'crypto'
import { prisma } from './db'
import { TAX_RATE } from './invoice'
import { BillingError, createManualInvoice } from './order-invoice'
import { maskEmail } from './mask'
import type { BuyerInvoiceFields } from './order-invoice'

export type InvoiceRequestStatus = 'PENDING' | 'SUBMITTED' | 'CANCELLED'

/** 128-bit 不可枚举令牌（与收据令牌同强度） */
export function genInvoiceRequestToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

/** 令牌格式：32 位小写十六进制。格式不对直接当不存在，不去查库 */
export const INVOICE_REQUEST_TOKEN_RE = /^[0-9a-f]{32}$/

/** 客户填写页的路径（前台页面在 src/app/invoice-request/[token]） */
export function invoiceRequestPath(token: string): string {
  return `/invoice-request/${token}`
}

export function invoiceRequestUrl(token: string): string {
  const origin = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com').replace(/\/$/, '')
  return `${origin}${invoiceRequestPath(token)}`
}

/** 默认有效期（天）。站外客户经常拖几天才填，给足；过期后管理员可以重新生成 */
export const DEFAULT_REQUEST_VALID_DAYS = 30

export function isExpired(r: { expiresAt: Date | null }, now: Date = new Date()): boolean {
  return !!r.expiresAt && r.expiresAt.getTime() <= now.getTime()
}

/** 链接对外呈现的状态：PENDING 但已过期的，对客户显示为 EXPIRED */
export function effectiveStatus(
  r: { status: string; expiresAt: Date | null },
  now: Date = new Date()
): InvoiceRequestStatus | 'EXPIRED' {
  if (r.status === 'PENDING' && isExpired(r, now)) return 'EXPIRED'
  return (r.status as InvoiceRequestStatus) || 'PENDING'
}

export interface CreateRequestInput {
  /** 开票金额（含税），元，最多两位小数 */
  invoiceAmount: number
  subscriptionType?: string | null
  account?: string | null
  note?: string | null
  /** 有效天数；0 / null = 长期有效 */
  validDays?: number | null
}

export async function createInvoiceRequest(input: CreateRequestInput) {
  const cents = Math.round(Number(input.invoiceAmount) * 100)
  if (!Number.isFinite(cents) || cents <= 0) throw new BillingError('开票金额必须大于 0')
  // 与 createManualInvoice 同口径：由含税金额倒推不含税售价，税费由减法得出，至少要有 1 分售价
  if (Math.round(cents / (1 + TAX_RATE)) <= 0) throw new BillingError('开票金额过小')
  const days = input.validDays == null ? DEFAULT_REQUEST_VALID_DAYS : Math.trunc(input.validDays)
  const expiresAt = days > 0 ? new Date(Date.now() + days * 86400_000) : null

  // 撞令牌的概率可以忽略，但唯一约束仍在；撞了就换一个再试，不把 P2002 抛给管理员
  for (let i = 0; i < 3; i++) {
    try {
      return await prisma.invoiceRequest.create({
        data: {
          token: genInvoiceRequestToken(),
          invoiceAmount: cents / 100,
          subscriptionType: input.subscriptionType?.trim() || null,
          account: input.account?.trim() || null,
          note: input.note?.trim() || null,
          status: 'PENDING',
          expiresAt,
        },
      })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') continue
      throw e
    }
  }
  throw new BillingError('生成链接失败，请重试')
}

/** 客户页看到的内容：金额、状态、（已提交时）自己填过的抬头 —— 不含后台备注与客户标识 */
export async function publicInvoiceRequestView(token: string) {
  if (!INVOICE_REQUEST_TOKEN_RE.test(token)) return null
  const r = await prisma.invoiceRequest.findUnique({ where: { token } })
  if (!r) return null
  const amount = Number(r.invoiceAmount)
  let submitted: { title: string | null; taxNumber: string | null; email: string; showAiWording: boolean | null; invoiceNo: string; status: string } | null = null
  if (r.status === 'SUBMITTED' && r.invoiceId) {
    const inv = await prisma.invoice.findUnique({
      where: { id: r.invoiceId },
      select: { title: true, taxNumber: true, email: true, showAiWording: true, invoiceNo: true, status: true },
    })
    if (inv) {
      submitted = {
        title: inv.title,
        taxNumber: inv.taxNumber,
        email: maskEmail(inv.email),
        showAiWording: inv.showAiWording,
        invoiceNo: inv.invoiceNo,
        status: inv.status,
      }
    }
  }
  return {
    status: effectiveStatus(r),
    invoiceAmount: amount,
    /**
     * 开票内容：客户选「展示字眼」时印在规格型号上，页面据此给客户看清楚两种选择的差别。
     * 回落值与 submitInvoiceRequest 落库时一致（历史上允许留空的链接）。
     * 不下发「不含税 + 税额」的拆分：发票票面税额按征收率算，与站内的 6% 口径不同，给客户看只会对不上
     */
    subscriptionType: r.subscriptionType || '技术咨询服务',
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    submitted,
  }
}

/**
 * 客户提交开票信息。fields 由调用方用 invoiceFieldsSchema + normalizeInvoiceFields 校验归一化过
 * （税号去空格、超长拦截、邮箱小写），这里不再重复。
 */
export async function submitInvoiceRequest(token: string, fields: BuyerInvoiceFields, submitIp: string | null) {
  if (!INVOICE_REQUEST_TOKEN_RE.test(token)) throw new BillingError('链接不存在或已失效', 404)
  const r = await prisma.invoiceRequest.findUnique({ where: { token } })
  if (!r) throw new BillingError('链接不存在或已失效', 404)
  const st = effectiveStatus(r)
  if (st === 'SUBMITTED') throw new BillingError('这个链接已经提交过开票信息，如需修改请联系客服', 409)
  if (st === 'CANCELLED') throw new BillingError('这个链接已失效，请联系客服重新获取', 410)
  if (st === 'EXPIRED') throw new BillingError('这个链接已过期，请联系客服重新获取', 410)

  const now = new Date()
  return prisma.$transaction(async (tx) => {
    // 一个链接只能提交一次：CAS。并发的第二次提交在这里拿到 count=0
    const flip = await tx.invoiceRequest.updateMany({
      where: { id: r.id, status: 'PENDING', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      data: { status: 'SUBMITTED', submittedAt: now, submitIp: submitIp?.slice(0, 64) || null },
    })
    if (flip.count !== 1) throw new BillingError('这个链接刚刚已被提交或已失效，请刷新页面查看', 409)

    const inv = await createManualInvoice(
      {
        invoiceAmount: Number(r.invoiceAmount),
        title: fields.title,
        taxNumber: fields.taxNumber,
        address: fields.address,
        phone: fields.phone,
        bankName: fields.bankName,
        bankAccount: fields.bankAccount,
        email: fields.email,
        subscriptionType: r.subscriptionType || '技术咨询服务',
        account: r.account || null,
        showAiWording: fields.showAiWording,
        status: 'SUBMITTED',
      },
      tx
    )
    await tx.invoiceRequest.update({ where: { id: r.id }, data: { invoiceId: inv.id } })
    return { invoiceId: inv.id, invoiceNo: inv.invoiceNo, invoiceAmount: Number(r.invoiceAmount) }
  })
}

/** 管理员作废一个还没提交的链接（CAS，已提交的不能作废 —— 发票已经建出来了，要撤请到发票管理里改状态） */
export async function cancelInvoiceRequest(id: number): Promise<boolean> {
  const r = await prisma.invoiceRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'CANCELLED' } })
  return r.count === 1
}

/**
 * 含税开票金额 → 站内口径的不含税售价 + 6% 税费。与 createManualInvoice 落库时的拆分**同一算法**
 * （售价 = round(含税 / (1+税率))，税费由减法得出，保证 售价 + 税费 === 开票金额）。
 * 只给后台看（列表与生成链接时的预览）：发票票面的税额按征收率算，与这里的 6% 不同，不给客户看。
 */
export function splitInvoiceAmount(invoiceAmount: number): { sellingPrice: number; taxFee: number } {
  const invoiceCents = Math.round(invoiceAmount * 100)
  const sellCents = Math.round(invoiceCents / (1 + TAX_RATE))
  return { sellingPrice: sellCents / 100, taxFee: (invoiceCents - sellCents) / 100 }
}
