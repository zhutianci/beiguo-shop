export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const updateSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '开通时间格式错误'),
  expireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '到期时间格式错误'),
  subscriptionType: z.string().min(1, '订阅类型必填'),
  xianyuNickname: z.string().optional().nullable(),
  claudeAccount: z.string().email('账户邮箱格式不正确'),
})

function hashKey(claudeAccount: string, startDate: string, subscriptionType: string): string {
  return crypto
    .createHash('sha1')
    .update(`${claudeAccount.toLowerCase()}|${startDate}|${subscriptionType}`)
    .digest('hex')
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const data = parsed.data
    const claudeAccount = data.claudeAccount.trim().toLowerCase()
    const subscriptionType = data.subscriptionType.trim()
    const newSourceKey = hashKey(claudeAccount, data.startDate, subscriptionType)

    // 同账户+开通时间+订阅类型不能重复（除自己外）
    const conflict = await prisma.externalOrder.findFirst({
      where: { sourceKey: newSourceKey, NOT: { id } },
    })
    if (conflict) {
      return error('已存在相同账户+开通时间+订阅类型的订单，请检查')
    }

    const updated = await prisma.externalOrder.update({
      where: { id },
      data: {
        startDate: new Date(data.startDate),
        expireDate: new Date(data.expireDate),
        subscriptionType,
        xianyuNickname: data.xianyuNickname?.trim() || null,
        claudeAccount,
        sourceKey: newSourceKey,
      },
    })
    return success(updated, '更新成功')
  } catch (err) {
    console.error('Update external order error:', err)
    return error('更新失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    await prisma.externalOrder.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete external order error:', err)
    return error('删除失败')
  }
}
