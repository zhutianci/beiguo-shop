export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { shopOrderSourceKey } from '@/lib/order-invoice'

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 200)
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status')?.trim() // valid | expired | 空=全部

    const where: Prisma.ExternalOrderWhereInput = {}
    if (keyword) {
      where.OR = [
        { claudeAccount: { contains: keyword } },
        { xianyuNickname: { contains: keyword } },
        { subscriptionType: { contains: keyword } },
      ]
    }
    // 到期时间为 @db.Date（UTC 零点），与前端 new Date(expireDate) < new Date() 的判定一致
    if (status === 'expired') where.expireDate = { lt: new Date() }
    else if (status === 'valid') where.expireDate = { gte: new Date() }

    const [list, total] = await Promise.all([
      prisma.externalOrder.findMany({
        where,
        orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.externalOrder.count({ where }),
    ])

    // 附带发票信息（每笔订单最多关联一张发票）
    const ids = list.map((o) => o.id)
    const invoices = ids.length
      ? await prisma.invoice.findMany({
          where: { externalOrderId: { in: ids } },
          select: { externalOrderId: true, status: true, invoiceNo: true },
        })
      : []
    const invoiceMap = new Map(invoices.map((iv) => [iv.externalOrderId, iv]))

    const enriched = list.map((o) => {
      const iv = invoiceMap.get(o.id)
      return {
        ...o,
        invoiceStatus: iv?.status ?? null,
        invoiceNo: iv?.invoiceNo ?? null,
      }
    })

    return success({
      list: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('Get external orders error:', err)
    return error('查询失败')
  }
}

export async function DELETE() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    /*
     * 【清空之前先把「这张发票属于哪张站内订单」写进发票的 sourceKey 快照】
     * 发票与外部订单行之间没有外键，行删掉后发票上只剩 sourceKey 快照这一根线索；
     * 而管理员「标记已完成」导入的 WEB 行 sourceKey 是 hashKey(...)，里面没有订单号 ——
     * 删掉之后，那张（买家可能已付过 6% 的）发票就再也关联不回订单，订单页又会出现「申请发票」。
     * 快照只经 lib/order-link 的 orderIdFromSourceKey 读，改写成 order:<id> 是安全的。
     */
    const linked = await prisma.externalOrder.findMany({
      where: { shopOrderId: { not: null } },
      select: { id: true, shopOrderId: true },
    })
    const { count } = await prisma.$transaction(async (tx) => {
      for (const r of linked) {
        await tx.invoice.updateMany({
          where: { externalOrderId: r.id },
          data: { sourceKey: shopOrderSourceKey(r.shopOrderId as number) },
        })
      }
      return tx.externalOrder.deleteMany({})
    }, { timeout: 60_000 })
    return success({ deleted: count }, `已删除 ${count} 条记录`)
  } catch (err) {
    console.error('Clear error:', err)
    return error('清空失败')
  }
}
