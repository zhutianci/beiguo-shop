export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import type { InvoiceRequest, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { BillingError } from '@/lib/order-invoice'
import {
  createInvoiceRequest,
  effectiveStatus,
  invoiceRequestUrl,
  splitInvoiceAmount,
  DEFAULT_REQUEST_VALID_DAYS,
} from '@/lib/invoice-request'

/**
 * 开票填写链接（后台）：列表 + 生成。
 *
 * 鉴权：middleware 拦 /api/admin/*，这里再用 requireAdmin 验一次 ——
 * 生成出来的链接能直接变成一张进待开清单的发票，不能只靠一层已知可绕过的锁（CVE-2025-29927）。
 *
 * 【EXPIRED 不是库里的状态】库里只有 PENDING / SUBMITTED / CANCELLED，
 * 「已过期」= PENDING 且 expiresAt <= now，由查询条件现算（与 lib/invoice-request 的 effectiveStatus 同一口径）。
 * 不落库的原因：过期是时间的函数，落库就得有定时任务去翻，翻之前的那段时间两边口径不一致。
 */

const STATUS_FILTERS = ['PENDING', 'SUBMITTED', 'CANCELLED', 'EXPIRED', 'all'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

/** 某个筛选对应的 where。now 由调用方传入，保证同一次请求里列表与计数用的是同一个时刻 */
function whereFor(status: StatusFilter, now: Date): Prisma.InvoiceRequestWhereInput {
  switch (status) {
    case 'PENDING':
      return { status: 'PENDING', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
    case 'EXPIRED':
      return { status: 'PENDING', expiresAt: { lte: now } }
    case 'SUBMITTED':
    case 'CANCELLED':
      return { status }
    default:
      return {}
  }
}

/** 库里的一行 → 后台列表行。Decimal 一律转 number，金额拆分与客户页同一算法 */
function toRow(r: InvoiceRequest, inv: { invoiceNo: string; title: string | null } | null, now: Date) {
  const invoiceAmount = Number(r.invoiceAmount)
  const split = splitInvoiceAmount(invoiceAmount)
  return {
    id: r.id,
    status: effectiveStatus(r, now),
    invoiceAmount,
    sellingPrice: split.sellingPrice,
    taxFee: split.taxFee,
    subscriptionType: r.subscriptionType,
    account: r.account,
    note: r.note,
    url: invoiceRequestUrl(r.token),
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    submittedAt: r.submittedAt,
    invoiceId: r.invoiceId,
    invoiceNo: inv?.invoiceNo ?? null,
    title: inv?.title ?? null,
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const sp = request.nextUrl.searchParams
    const rawStatus = (sp.get('status') || 'all').trim()
    if (!(STATUS_FILTERS as readonly string[]).includes(rawStatus)) return error('状态参数无效')
    const status = rawStatus as StatusFilter
    // NaN 安全：?page=abc 时 parseInt 得 NaN，|| 兜回默认值，不让 NaN 流进 skip
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 100)

    const now = new Date()
    const where = whereFor(status, now)
    const [rows, total, pending, expired, submitted, cancelled, all] = await Promise.all([
      prisma.invoiceRequest.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoiceRequest.count({ where }),
      prisma.invoiceRequest.count({ where: whereFor('PENDING', now) }),
      prisma.invoiceRequest.count({ where: whereFor('EXPIRED', now) }),
      prisma.invoiceRequest.count({ where: whereFor('SUBMITTED', now) }),
      prisma.invoiceRequest.count({ where: whereFor('CANCELLED', now) }),
      prisma.invoiceRequest.count(),
    ])

    // 提交后生成的发票：一页一次批量取，不逐行查
    const invoiceIds = rows.map((r) => r.invoiceId).filter((id): id is number => id != null)
    const invoices = invoiceIds.length
      ? await prisma.invoice.findMany({
          where: { id: { in: invoiceIds } },
          select: { id: true, invoiceNo: true, title: true },
        })
      : []
    const invById = new Map(invoices.map((i) => [i.id, i]))

    return success({
      list: rows.map((r) => toRow(r, r.invoiceId != null ? invById.get(r.invoiceId) ?? null : null, now)),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      counts: { PENDING: pending, EXPIRED: expired, SUBMITTED: submitted, CANCELLED: cancelled, all },
    })
  } catch (err) {
    console.error('Admin list invoice requests error:', err)
    return error('获取失败')
  }
}

const createSchema = z.object({
  invoiceAmount: z
    .number({ required_error: '请填写开票金额', invalid_type_error: '请填写正确的开票金额' })
    .positive('开票金额必须大于 0')
    .max(1_000_000, '开票金额不能超过 1,000,000')
    // 最多两位小数：金额按分落库，多出来的小数位会被悄悄四舍五入，管理员看到的与票面对不上
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, '开票金额最多两位小数'),
  // 必填：客户在链接里要选「是否展示 ChatGPT/Claude 字眼」，这里就是「展示」时印在规格型号上的那段文字。
  // 留空的话两个选项开出来都只有「技术咨询服务」，客户的选择形同虚设，页面上却告诉他会展示
  subscriptionType: z
    .string({ required_error: '请填写开票内容（客户选择「展示」时印在规格型号上）' })
    .trim()
    .min(1, '请填写开票内容（客户选择「展示」时印在规格型号上）')
    .max(100, '开票内容最多 100 字'),
  account: z.string().trim().max(255, '客户标识最多 255 字').optional().nullable(),
  note: z.string().trim().max(255, '备注最多 255 字').optional().nullable(),
  // 0 = 长期有效；不传按默认天数
  validDays: z
    .number({ invalid_type_error: '有效期必须是整数天' })
    .int('有效期必须是整数天')
    .min(0, '有效期不能为负')
    .max(365, '有效期最长 365 天')
    .optional()
    .nullable(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const r = await createInvoiceRequest({
      invoiceAmount: d.invoiceAmount,
      subscriptionType: d.subscriptionType,
      account: d.account,
      note: d.note,
      validDays: d.validDays ?? DEFAULT_REQUEST_VALID_DAYS,
    })
    return success(toRow(r, null, new Date()), '链接已生成，复制后发给客户填写')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Admin create invoice request error:', err)
    return error('生成失败')
  }
}
