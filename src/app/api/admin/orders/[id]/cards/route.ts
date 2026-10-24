export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { decryptCardContent } from '@/lib/cardkey'
import { adminGuard } from '@/lib/admin-guard'
import { cardRevealGate } from '@/lib/security/card-reveal'

/**
 * 一张订单已发出的卡密明文（2026-10-24）：后台订单列表只给脱敏值，详情里点「显示明文」才调这里。
 * 二次验证 + 限流 + 留痕（lib/security/card-reveal.ts）。只回这一单 status=USED、orderId 对得上的卡。
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const orderId = parseInt(params.id)
  if (!orderId) return notFound('订单不存在')
  const gate = await cardRevealGate(request, `order:${orderId}`)
  if (gate) return gate
  try {
    const cards = await prisma.cardKey.findMany({
      where: { orderId, status: 'USED' },
      orderBy: { id: 'asc' },
      select: { content: true },
    })
    return success({
      cards: cards.map((c) => {
        try {
          return decryptCardContent(c.content)
        } catch {
          return '(卡密解密失败)'
        }
      }),
    })
  } catch (err) {
    console.error('Admin order cards error:', err)
    return error('读取卡密失败')
  }
}
