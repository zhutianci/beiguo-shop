export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import type { ExternalOrder, Invoice } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts } from '@/lib/invoice'

// 发票管理：以「订单」为主表，同步展示所有订单的发票状态（无发票记录的默认「未开发票」）
// 性能约定：筛选 / 检索 / 排序 / 分页全部下推到数据库，绝不把整张 external_orders 读进内存。

const ALL_STATUSES = ['UNAPPLIED', 'AWAIT_PAY', 'SUBMITTED', 'ISSUED', 'CANNOT'] as const

// 把「订单 + 可选发票」拼成前端需要的一行（字段与旧版逐个对齐，不可增删）
function buildRow(o: ExternalOrder, iv: Invoice | null) {
  const quote = o.quote == null ? null : Number(o.quote)

  let st: string
  let sellingPrice: number | null
  let invoiceAmount: number | null
  let taxFee: number | null
  let payStatus: string
  if (iv) {
    st = iv.status
    sellingPrice = Number(iv.sellingPrice)
    invoiceAmount = Number(iv.invoiceAmount)
    taxFee = Number(iv.taxFee)
    payStatus = iv.payStatus
  } else {
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
    // 买家申请时的必选项；历史发票与管理员凭空建的记录为 null，前端显示「—」
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
  }
}

// 汇总统计：全部订单口径（不受当前状态/关键词筛选影响），全部走 groupBy / aggregate
async function loadTotals() {
  const linked: Prisma.InvoiceWhereInput = { externalOrderId: { not: null } }
  const [totalOrders, grouped, paidAgg, issuedAgg] = await Promise.all([
    prisma.externalOrder.count(),
    prisma.invoice.groupBy({ by: ['status'], where: linked, _count: { _all: true } }),
    prisma.invoice.aggregate({ _sum: { taxFee: true }, where: { ...linked, payStatus: 'PAID' } }),
    prisma.invoice.aggregate({ _sum: { invoiceAmount: true }, where: { ...linked, status: 'ISSUED' } }),
  ])

  const count: Record<string, number> = {}
  ALL_STATUSES.forEach((s) => (count[s] = 0))
  let nonUnapplied = 0
  for (const g of grouped) {
    count[g.status] = g._count._all
    if (g.status !== 'UNAPPLIED') nonUnapplied += g._count._all
  }
  // 没有发票记录 + 发票记录为 UNAPPLIED 的订单都算「未开发票」
  count.UNAPPLIED = Math.max(totalOrders - nonUnapplied, 0)

  const round2 = (n: number) => Math.round(n * 100) / 100
  return {
    count,
    paidTaxFee: round2(Number(paidAgg._sum.taxFee ?? 0)), // 已支付的发票税费合计
    issuedInvoiceAmount: round2(Number(issuedAgg._sum.invoiceAmount ?? 0)), // 已开具发票金额（含税）合计
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 200)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status')?.trim()
    const skip = (page - 1) * pageSize

    // 关键词永远按「订单」字段检索（发票表里没有闲鱼昵称）
    const keywordWhere: Prisma.ExternalOrderWhereInput = keyword
      ? {
          OR: [
            { claudeAccount: { contains: keyword } },
            { subscriptionType: { contains: keyword } },
            { xianyuNickname: { contains: keyword } },
          ],
        }
      : {}

    let list: ReturnType<typeof buildRow>[] = []
    let total = 0

    if (status && status !== 'UNAPPLIED') {
      // —— 有发票记录的状态：以 Invoice 为主表分页，再 join 回订单 ——
      // 发票表体量远小于订单表，先用它把候选订单圈定，关键词再在候选集里筛（主键 IN，代价可控）
      let invoiceWhere: Prisma.InvoiceWhereInput = { status, externalOrderId: { not: null } }
      if (keyword) {
        const candidates = await prisma.invoice.findMany({
          where: { status, externalOrderId: { not: null } },
          select: { externalOrderId: true },
        })
        const candidateIds = candidates
          .map((c) => c.externalOrderId)
          .filter((v): v is number => v != null)
        const matched = candidateIds.length
          ? await prisma.externalOrder.findMany({
              where: { AND: [{ id: { in: candidateIds } }, keywordWhere] },
              select: { id: true },
            })
          : []
        invoiceWhere = { status, externalOrderId: { in: matched.map((m) => m.id) } }
      }

      const [invoices, cnt] = await Promise.all([
        prisma.invoice.findMany({
          where: invoiceWhere,
          orderBy: [{ submittedAt: 'desc' }, { paidAt: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: pageSize,
        }),
        prisma.invoice.count({ where: invoiceWhere }),
      ])
      total = cnt

      const ids = invoices.map((iv) => iv.externalOrderId).filter((v): v is number => v != null)
      const orders = ids.length
        ? await prisma.externalOrder.findMany({ where: { id: { in: ids } } })
        : []
      const orderMap = new Map(orders.map((o) => [o.id, o]))
      // 订单被删除后发票会成为孤儿记录，旧版同样不展示，这里直接跳过
      list = invoices.reduce<ReturnType<typeof buildRow>[]>((acc, iv) => {
        const o = iv.externalOrderId == null ? undefined : orderMap.get(iv.externalOrderId)
        if (o) acc.push(buildRow(o, iv))
        return acc
      }, [])
    } else {
      // —— 不筛状态 / 筛「未开发票」：以 ExternalOrder 为主表分页，再按本页 id 批量取发票 ——
      const where: Prisma.ExternalOrderWhereInput = { ...keywordWhere }
      if (status === 'UNAPPLIED') {
        // 「未开发票」= 没有发票记录 或 发票记录本身就是 UNAPPLIED，取反集即可
        const others = await prisma.invoice.findMany({
          where: { status: { not: 'UNAPPLIED' }, externalOrderId: { not: null } },
          select: { externalOrderId: true },
        })
        const excludeIds = others
          .map((o) => o.externalOrderId)
          .filter((v): v is number => v != null)
        if (excludeIds.length) where.id = { notIn: excludeIds }
      }

      const [orders, cnt] = await Promise.all([
        prisma.externalOrder.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: pageSize,
        }),
        prisma.externalOrder.count({ where }),
      ])
      total = cnt

      const ids = orders.map((o) => o.id)
      const invoices = ids.length
        ? await prisma.invoice.findMany({ where: { externalOrderId: { in: ids } } })
        : []
      const invMap = new Map(
        invoices
          .filter((iv) => iv.externalOrderId != null)
          .map((iv) => [iv.externalOrderId as number, iv])
      )
      list = orders.map((o) => buildRow(o, invMap.get(o.id) ?? null))
    }

    const totals = await loadTotals()

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize), totals })
  } catch (err) {
    console.error('Admin list invoices error:', err)
    return error('查询失败')
  }
}
