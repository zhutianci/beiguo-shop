export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import type { ExternalOrder, Invoice } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts } from '@/lib/invoice'
import { createManualInvoice, BillingError } from '@/lib/order-invoice'

// 发票管理：以「订单」为主表，同步展示所有订单的发票状态（无发票记录的默认「未开发票」）
// 性能约定：筛选 / 检索 / 排序 / 分页全部下推到数据库，绝不把整张 external_orders 读进内存。
//
// 【例外：手动录入的发票没有订单】站外客户的发票 externalOrderId 为 NULL，
// 在「以订单为主表」的口径里根本无处安放。它们走独立的 source=MANUAL 分支单独分页，
// 前台对应一个「手动开票」筛选标签。不这么做的话这些行会：进得了批量导出、
// 却在后台列表里查无此人 —— 那是最危险的一种「看不见的数据」。

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

/** 手动录入的发票（没有订单）→ 前端同一行形状。字段与 buildRow 一一对应，缺的置 null */
function buildManualRow(iv: Invoice) {
  return {
    externalOrderId: null as number | null,
    invoiceId: iv.id,
    invoiceNo: iv.invoiceNo,
    claudeAccount: iv.claudeAccount,
    subscriptionType: iv.subscriptionType,
    xianyuNickname: null as string | null,
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
    sellingPrice: iv.sellingPrice == null ? null : Number(iv.sellingPrice),
    invoiceAmount: iv.invoiceAmount == null ? null : Number(iv.invoiceAmount),
    taxFee: iv.taxFee == null ? null : Number(iv.taxFee),
    status: iv.status,
    payStatus: iv.payStatus,
    paidAt: iv.paidAt,
    submittedAt: iv.submittedAt,
    issuedAt: iv.issuedAt,
    createdAt: iv.createdAt,
    /** 前端据此隐藏「按订单改状态」的下拉（那条路要 externalOrderId），改用按发票 id 的接口 */
    manual: true,
  }
}

// 汇总统计：全部订单口径（不受当前状态/关键词筛选影响），全部走 groupBy / aggregate
async function loadTotals() {
  const linked: Prisma.InvoiceWhereInput = { externalOrderId: { not: null } }
  // 【按 source 判定，不按 externalOrderId】两处口径必须一致：
  // 列表分支认 source==='MANUAL'，统计若按 externalOrderId 为 NULL 计数，
  // 状态标签上写着 12 张、点进去只有 11 行 —— 正是本文件头部要避免的「看不见的数据」
  const orphan: Prisma.InvoiceWhereInput = { source: 'MANUAL' }
  const [totalOrders, grouped, manualGrouped, paidAgg, issuedAgg] = await Promise.all([
    prisma.externalOrder.count(),
    prisma.invoice.groupBy({ by: ['status'], where: linked, _count: { _all: true } }),
    prisma.invoice.groupBy({ by: ['status'], where: orphan, _count: { _all: true } }),
    // 金额口径含手动录入的那些：那也是真收到的税费 / 真开出去的票，
    // 排除掉会让「已收税费合计」比实际少
    prisma.invoice.aggregate({ _sum: { taxFee: true }, where: { payStatus: 'PAID' } }),
    prisma.invoice.aggregate({ _sum: { invoiceAmount: true }, where: { status: 'ISSUED' } }),
  ])

  const count: Record<string, number> = {}
  ALL_STATUSES.forEach((s) => (count[s] = 0))
  let nonUnapplied = 0
  for (const g of grouped) {
    count[g.status] = g._count._all
    if (g.status !== 'UNAPPLIED') nonUnapplied += g._count._all
  }
  // 没有发票记录 + 发票记录为 UNAPPLIED 的订单都算「未开发票」。
  // 这一步只能用「有订单」的口径推导 —— 手动录入的发票压根不对应任何订单，
  // 算进 nonUnapplied 会让未开发票数凭空变少
  count.UNAPPLIED = Math.max(totalOrders - nonUnapplied, 0)

  // 手动录入的按状态叠加上去，让状态标签上的数字与点进去看到的行数对得上
  let manualTotal = 0
  for (const g of manualGrouped) {
    count[g.status] = (count[g.status] ?? 0) + g._count._all
    manualTotal += g._count._all
  }

  const round2 = (n: number) => Math.round(n * 100) / 100
  return {
    count,
    manualTotal,
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
    /** 'MANUAL' = 只看手动录入的（站外客户，没有订单）。与 status 互斥 */
    const source = searchParams.get('source')?.trim()
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

    let list: (ReturnType<typeof buildRow> | ReturnType<typeof buildManualRow>)[] = []
    let total = 0

    if (source === 'MANUAL') {
      // —— 手动录入：以 Invoice 为主表，只取没有订单的那些 ——
      // 关键词在发票自己的字段上匹配（这些行没有闲鱼昵称、没有订阅账户可查）
      const where: Prisma.InvoiceWhereInput = {
        // createManualInvoice 写死 externalOrderId=null，这里按 source 过滤即可，
        // 与 loadTotals 的 orphan、与状态分支里 buildManualRow 的判据三处同源
        source: 'MANUAL',
        ...(keyword
          ? {
              OR: [
                { title: { contains: keyword } },
                { taxNumber: { contains: keyword } },
                { invoiceNo: { contains: keyword } },
                { claudeAccount: { contains: keyword } },
                { email: { contains: keyword } },
              ],
            }
          : {}),
      }
      const [invoices, cnt] = await Promise.all([
        prisma.invoice.findMany({ where, orderBy: { id: 'desc' }, skip, take: pageSize }),
        prisma.invoice.count({ where }),
      ])
      total = cnt
      list = invoices.map(buildManualRow)
    } else if (status && status !== 'UNAPPLIED') {
      // —— 有发票记录的状态：以 Invoice 为主表分页，再 join 回订单 ——
      // 发票表体量远小于订单表，先用它把候选订单圈定，关键词再在候选集里筛（主键 IN，代价可控）
      // 不再排除 externalOrderId 为 NULL 的行：手动录入的发票也要出现在状态筛选里，
      // 否则「已提交开票 12 张」点进去只有 9 张，而导出的 xlsx 里是 12 张
      let invoiceWhere: Prisma.InvoiceWhereInput = { status }
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
        // 带关键词时：挂订单的按订单字段匹配，手动录入的按发票自己的字段匹配，两者取并集
        invoiceWhere = {
          status,
          OR: [
            { externalOrderId: { in: matched.map((m) => m.id) } },
            {
              source: 'MANUAL',
              OR: [
                { title: { contains: keyword } },
                { taxNumber: { contains: keyword } },
                { invoiceNo: { contains: keyword } },
                { claudeAccount: { contains: keyword } },
                { email: { contains: keyword } },
              ],
            },
          ],
        }
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
      // externalOrderId 为 NULL 有两种可能，必须区分开：
      //   · source='MANUAL' —— 管理员手动录入的站外客户发票，要展示
      //   · 其余 —— 订单被删除后留下的孤儿记录，旧版就不展示，继续不展示
      // 至于「有 externalOrderId 但订单已删」的，同样按孤儿跳过。
      list = invoices.reduce<(ReturnType<typeof buildRow> | ReturnType<typeof buildManualRow>)[]>(
        (acc, iv) => {
          if (iv.externalOrderId == null) {
            if (iv.source === 'MANUAL') acc.push(buildManualRow(iv))
            return acc
          }
          const o = orderMap.get(iv.externalOrderId)
          if (o) acc.push(buildRow(o, iv))
          return acc
        },
        []
      )
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

/**
 * 管理员手动录入发票申请（站外客户，没有在本站下过单，要和站内的一起批量开）。
 *
 * 金额一栏填的是**开票金额（含税）** —— 客户线下实付多少就填多少，这个数原样进税局模板。
 * 不含税额与税额由服务端按 1.06 倒推，只用于后台展示与「已收税费」统计。
 *
 * 鉴权靠 src/middleware.ts 统一拦 /api/admin/*（全站后台接口都是这个写法）。
 */
const manualSchema = z.object({
  invoiceAmount: z.number().positive('开票金额必须大于 0').max(99999999),
  title: z.string().trim().min(1, '抬头必填').max(200),
  taxNumber: z.string().trim().min(1, '税号必填').max(64),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().trim().email('接收邮箱格式不正确').optional().nullable().or(z.literal('')),
  subscriptionType: z.string().trim().max(100).optional().nullable(),
  account: z.string().trim().max(255).optional().nullable(),
  showAiWording: z.boolean().optional().default(false),
  status: z.enum(['SUBMITTED', 'ISSUED']).optional().default('SUBMITTED'),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = manualSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const r = await createManualInvoice({
      invoiceAmount: d.invoiceAmount,
      title: d.title,
      taxNumber: d.taxNumber,
      address: d.address,
      phone: d.phone,
      bankName: d.bankName,
      bankAccount: d.bankAccount,
      email: d.email || null,
      subscriptionType: d.subscriptionType || '技术咨询服务',
      account: d.account,
      showAiWording: d.showAiWording,
      status: d.status,
    })
    return success(r, d.status === 'ISSUED' ? '已录入（标记为已开具）' : '已录入，将进入待开清单')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Admin create manual invoice error:', err)
    return error('录入失败')
  }
}
