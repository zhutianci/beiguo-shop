export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rmbCapital } from '@/lib/receipt'

// 查看收据数据（用于渲染收据页）
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const r = await prisma.receipt.findUnique({ where: { id } })
    if (!r) return error('收据不存在', 404)
    return success({
      id: r.id,
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
