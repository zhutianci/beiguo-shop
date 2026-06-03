export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rmbCapital } from '@/lib/receipt'

// 按不可枚举的 token 查看收据
export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = (params.token || '').trim()
    if (!token || token.length < 16) return error('收据不存在', 404)

    const r = await prisma.receipt.findUnique({ where: { token } })
    if (!r) return error('收据不存在', 404)

    return success({
      receiptNo: r.receiptNo,
      payerTitle: r.payerTitle,
      payee: r.payee,
      claudeAccount: r.claudeAccount,
      subscriptionType: r.subscriptionType,
      orderStartDate: r.orderStartDate,
      orderExpireDate: r.orderExpireDate,
      amount: Number(r.amount),
      amountCapital: rmbCapital(Number(r.amount)),
      createdAt: r.createdAt,
    })
  } catch (err) {
    console.error('Get receipt error:', err)
    return error('获取失败')
  }
}
