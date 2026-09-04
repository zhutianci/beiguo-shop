export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rmbCapital } from '@/lib/receipt'
import { parseReceiptItems } from '@/lib/order-billing'

// 按不可枚举的 token 查看收据
export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = (params.token || '').trim()
    if (!token || token.length < 16) return error('收据不存在', 404)

    const r = await prisma.receipt.findUnique({ where: { token } })
    if (!r) return error('收据不存在', 404)

    return success({
      receiptNo: r.receiptNo,
      source: r.source, // BUYER 买家提交 | MANUAL 手动开具
      payerTitle: r.payerTitle,
      payee: r.payee,
      claudeAccount: r.claudeAccount,
      subscriptionType: r.subscriptionType,
      orderStartDate: r.orderStartDate,
      orderExpireDate: r.orderExpireDate,
      items: parseReceiptItems(r.items), // 手动开具的 DIY 条目，按存储顺序展示
      remark: r.remark,
      amount: Number(r.amount),
      amountCapital: rmbCapital(Number(r.amount)),
      // 手动开具可指定开具时间；买家提交的沿用创建时间
      issuedAt: r.issuedAt ?? r.createdAt,
      createdAt: r.createdAt,
    })
  } catch (err) {
    console.error('Get receipt error:', err)
    return error('获取失败')
  }
}
