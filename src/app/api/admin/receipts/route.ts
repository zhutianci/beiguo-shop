export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { createManualReceipt, parseReceiptItems, BillingError } from '@/lib/order-billing'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 200)
    const keyword = searchParams.get('keyword')?.trim()
    const source = searchParams.get('source')?.trim() // BUYER | MANUAL

    const where: Prisma.ReceiptWhereInput = {}
    if (keyword) {
      where.OR = [
        { claudeAccount: { contains: keyword } },
        { payerTitle: { contains: keyword } },
        { receiptNo: { contains: keyword } },
      ]
    }
    if (source === 'BUYER' || source === 'MANUAL') where.source = source

    const [rows, total, buyerCount, manualCount] = await Promise.all([
      prisma.receipt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.receipt.count({ where }),
      prisma.receipt.count({ where: { source: 'BUYER' } }),
      prisma.receipt.count({ where: { source: 'MANUAL' } }),
    ])

    const list = rows.map((r) => ({
      id: r.id,
      receiptNo: r.receiptNo,
      token: r.token,
      source: r.source,
      claudeAccount: r.claudeAccount,
      subscriptionType: r.subscriptionType,
      payerTitle: r.payerTitle,
      payee: r.payee,
      amount: Number(r.amount),
      itemCount: parseReceiptItems(r.items).length,
      remark: r.remark,
      issuedAt: r.issuedAt ?? r.createdAt,
      createdAt: r.createdAt,
    }))

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: { buyer: buyerCount, manual: manualCount },
    })
  } catch (err) {
    console.error('Admin list receipts error:', err)
    return error('查询失败')
  }
}

const manualSchema = z.object({
  receiptNo: z.string().trim().max(32).optional().nullable(),
  payerTitle: z.string().trim().min(1, '请填写付款人(抬头)').max(200),
  account: z.string().trim().max(255).optional().nullable(),
  amount: z.number().positive('金额必须大于 0'),
  issuedAt: z.string().trim().optional().nullable(), // ISO 或 datetime-local 字符串
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1, '条目名称不能为空').max(50),
        value: z.string().trim().max(500),
      })
    )
    .max(30, '自定义条目最多 30 条')
    .optional(),
  remark: z.string().trim().max(500).optional().nullable(),
})

// 管理员手动开具（DIY）收据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = manualSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    let issuedAt: Date | null = null
    if (d.issuedAt) {
      const t = new Date(d.issuedAt)
      if (isNaN(t.getTime())) return error('开具时间格式不正确')
      issuedAt = t
    }

    // 收据号可自定义，但必须全局唯一（receiptNo 有 @unique）
    if (d.receiptNo) {
      const dup = await prisma.receipt.findUnique({ where: { receiptNo: d.receiptNo }, select: { id: true } })
      if (dup) return error('该收据号已存在，请换一个')
    }

    const r = await createManualReceipt({
      receiptNo: d.receiptNo,
      payerTitle: d.payerTitle,
      account: d.account,
      amount: d.amount,
      issuedAt,
      items: d.items,
      remark: d.remark,
    })
    return success(r, '收据已开具')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Manual receipt error:', err)
    return error('开具失败')
  }
}
