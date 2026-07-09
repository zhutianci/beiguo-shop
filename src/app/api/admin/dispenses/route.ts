export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { decryptCardContent, maskSecret } from '@/lib/cardkey'

// 外部平台发卡记录（ExternalDispense）：检索 + 筛选 + 分页，含每条实际发出的卡密（默认脱敏）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get('keyword') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const reveal = searchParams.get('reveal') === '1'
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)

    const where: Prisma.ExternalDispenseWhereInput = {}
    if (['PENDING', 'PROCESSING', 'FULFILLED', 'PARTIAL'].includes(status)) {
      where.status = status
    }
    if (keyword) {
      // 商品名检索需先查出匹配的 productId（ExternalDispense 未建 product 关系）
      const matched = await prisma.product.findMany({
        where: { name: { contains: keyword } },
        select: { id: true },
      })
      where.OR = [
        { client: { contains: keyword } },
        { externalNo: { contains: keyword } },
        { apiSku: { contains: keyword } },
        ...(matched.length ? [{ productId: { in: matched.map((p) => p.id) } }] : []),
      ]
    }

    const [rows, total, agg] = await Promise.all([
      prisma.externalDispense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.externalDispense.count({ where }),
      prisma.externalDispense.aggregate({ where, _sum: { delivered: true } }),
    ])

    // 商品名映射
    const productIds = Array.from(new Set(rows.map((r) => r.productId)))
    const products = productIds.length
      ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
      : []
    const nameMap = new Map(products.map((p) => [p.id, p.name]))

    // 该页所有记录涉及的卡密 id → 解密（脱敏或明文）
    const allCardIds = Array.from(
      new Set(rows.flatMap((r) => (r.cardIds ? r.cardIds.split(',').filter(Boolean).map(Number) : [])))
    )
    const secretMap = new Map<number, string>()
    if (allCardIds.length) {
      const cards = await prisma.cardKey.findMany({
        where: { id: { in: allCardIds } },
        select: { id: true, content: true },
      })
      for (const c of cards) {
        let secret = ''
        try {
          const plain = decryptCardContent(c.content)
          secret = reveal ? plain : maskSecret(plain)
        } catch {
          secret = '(无法解密)'
        }
        secretMap.set(c.id, secret)
      }
    }

    const list = rows.map((r) => {
      const ids = r.cardIds ? r.cardIds.split(',').filter(Boolean).map(Number) : []
      return {
        id: r.id,
        client: r.client,
        externalNo: r.externalNo,
        productId: r.productId,
        productName: nameMap.get(r.productId) || `#${r.productId}`,
        apiSku: r.apiSku,
        quantity: r.quantity,
        delivered: r.delivered,
        status: r.status,
        cards: ids.map((id) => secretMap.get(id) || '(已删除)'),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
    })

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      stats: { records: total, delivered: agg._sum.delivered || 0 },
    })
  } catch (err) {
    console.error('List external dispenses error:', err)
    return error('获取发卡记录失败')
  }
}
