export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { decryptCardContent, syncAutoStock } from '@/lib/cardkey'
import { round2 } from '@/lib/money'

// 查看单条明文（管理员）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const c = await prisma.cardKey.findUnique({ where: { id } })
    if (!c) return notFound('卡密不存在')
    let secret = ''
    try {
      secret = decryptCardContent(c.content)
    } catch {
      secret = '(无法解密)'
    }
    return success({ id: c.id, secret })
  } catch (err) {
    console.error('Reveal cardkey error:', err)
    return error('获取失败')
  }
}

const patchSchema = z
  .object({
    status: z.enum(['UNUSED', 'DISABLED']).optional(),
    cost: z.number().min(0, '成本不能为负').max(999999).optional(),
    soldPrice: z.number().min(0, '售价不能为负').max(999999).optional(),
    remark: z.string().trim().max(255).optional().nullable(),
    redeemUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === '' || /^https?:\/\//i.test(v), '兑换地址需以 http:// 或 https:// 开头')
      .optional()
      .nullable(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      v.cost !== undefined ||
      v.soldPrice !== undefined ||
      v.remark !== undefined ||
      v.redeemUrl !== undefined,
    { message: '没有要修改的内容' }
  )

/** 元 → Decimal(10,2) */
function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(round2(n).toFixed(2))
}

// 编辑单条卡密：状态 / 成本 / 售价 / 备注 / 专属兑换地址
// 规则与批量接口 /api/admin/cardkeys/batch 保持一致：
//   已发出（USED）不可改状态，但可以改成本与售价，利润必须同步重算后落库；
//   未发出的卡没有售价概念，不允许写 soldPrice。
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { status, cost, soldPrice, remark, redeemUrl } = parsed.data

    const c = await prisma.cardKey.findUnique({ where: { id } })
    if (!c) return notFound('卡密不存在')

    const isUsed = c.status === 'USED'
    if (status !== undefined && isUsed) return error('已发出的卡密不可修改状态')
    if (soldPrice !== undefined && !isUsed) return error('未发出的卡密没有售价')

    const data: Prisma.CardKeyUpdateInput = {}
    if (status !== undefined) data.status = status
    if (remark !== undefined) data.remark = remark?.trim() || null
    if (redeemUrl !== undefined) data.redeemUrl = redeemUrl?.trim() || null
    if (cost !== undefined) data.cost = dec(cost)
    if (soldPrice !== undefined) data.soldPrice = dec(soldPrice)

    // 利润是落库列，成本或售价一变就得重算，绝不能留旧值
    if (isUsed && (cost !== undefined || soldPrice !== undefined)) {
      const nextCost = cost !== undefined ? cost : c.cost != null ? Number(c.cost) : 0
      const nextSold = soldPrice !== undefined ? soldPrice : c.soldPrice != null ? Number(c.soldPrice) : null
      if (nextSold != null) data.profit = dec(nextSold - nextCost)
    }

    await prisma.cardKey.update({ where: { id }, data })
    if (status !== undefined) await syncAutoStock(c.productId)
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Update cardkey error:', err)
    return error('更新失败')
  }
}

// 删除（已发出的保留以备查，不删）
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    const c = await prisma.cardKey.findUnique({ where: { id } })
    if (!c) return notFound('卡密不存在')
    if (c.status === 'USED') return error('已发出的卡密不可删除（保留发货记录）')
    await prisma.cardKey.delete({ where: { id } })
    await syncAutoStock(c.productId)
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete cardkey error:', err)
    return error('删除失败')
  }
}
