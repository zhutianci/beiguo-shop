export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rmbCapital, receiptProjectLabel } from '@/lib/receipt'
import { parseReceiptItems } from '@/lib/order-billing'
import { getStorefront } from '@/lib/storefront/resolve'

// 按不可枚举的 token 查看收据
export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return error('收据不存在', 404)
  try {
    const token = (params.token || '').trim()
    if (!token || token.length < 16) return error('收据不存在', 404)

    const r = await prisma.receipt.findUnique({ where: { token } })
    // 收据只在它所属的站展示（设计 4.5）：页面层（receipt/[token]/layout.tsx）已按收据的站跳转，
    // 这里是第二道——别的站的 Host 直接调接口，与不存在同一个响应
    if (!r || r.tenantId !== sf.id) return error('收据不存在', 404)

    return success({
      receiptNo: r.receiptNo,
      source: r.source, // BUYER 买家提交 | MANUAL 手动开具
      payerTitle: r.payerTitle,
      payee: r.payee,
      claudeAccount: r.claudeAccount,
      subscriptionType: r.subscriptionType,
      // 「项目」一栏的最终文案由服务端决定（与发票导出同一口径，见 lib/receipt.ts）：
      // 买家选了不展示字眼 → 「技术咨询服务」；历史收据（NULL）与 DIY 收据按原样。
      // 前端只管渲染，不自己拼，免得两处口径漂移
      project: receiptProjectLabel(r.subscriptionType, r.showAiWording),
      showAiWording: r.showAiWording,
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
