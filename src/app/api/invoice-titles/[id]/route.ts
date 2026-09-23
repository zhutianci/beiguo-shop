export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { BillingError } from '@/lib/order-invoice'
import { assertTaxNumber } from '@/lib/invoice-input'

/**
 * 单条抬头的编辑 / 设为默认 / 删除。
 *
 * 【每一个数据库动作都带 userId】不是先 findUnique 再比对 —— 那种写法多一次
 * 「对象存在与否」的信息泄漏，而且一旦有人漏写比对分支就是越权。
 * 这里一律用 updateMany/deleteMany 把 userId 写进 where，改不到就是 0 行。
 */

const patchSchema = z.object({
  title: z.string().trim().min(1, '抬头必填').max(200).optional(),
  taxNumber: z.string().trim().min(1, '税号必填').max(64).optional(),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().trim().email('邮箱格式不正确').optional().nullable().or(z.literal('')),
  isDefault: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const data: Record<string, unknown> = {}
    if (d.title !== undefined) data.title = d.title.trim()
    if (d.taxNumber !== undefined) data.taxNumber = assertTaxNumber(d.taxNumber)
    if (d.address !== undefined) data.address = d.address?.trim() || null
    if (d.phone !== undefined) data.phone = d.phone?.trim() || null
    if (d.bankName !== undefined) data.bankName = d.bankName?.trim() || null
    if (d.bankAccount !== undefined) data.bankAccount = d.bankAccount?.trim() || null
    if (d.email !== undefined) data.email = d.email?.trim().toLowerCase() || null
    if (d.isDefault !== undefined) data.isDefault = d.isDefault
    if (Object.keys(data).length === 0) return error('没有可更新的内容')

    const r = await prisma.invoiceTitle.updateMany({ where: { id, userId: user.id }, data })
    if (r.count !== 1) return notFound('抬头不存在')

    // 默认抬头同一时刻只能有一条
    if (d.isDefault) {
      await prisma.invoiceTitle
        .updateMany({
          where: { userId: user.id, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        })
        .catch(() => {})
    }
    return success({ id }, '已更新')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Update invoice title error:', err)
    return error('更新失败')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    // 删抬头只影响「下次开票能不能一键带入」。
    // 已经提交的发票把抬头整份快照在 invoices 表里，删这里动不到那边。
    const r = await prisma.invoiceTitle.deleteMany({ where: { id, userId: user.id } })
    if (r.count !== 1) return notFound('抬头不存在')
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Delete invoice title error:', err)
    return error('删除失败')
  }
}
