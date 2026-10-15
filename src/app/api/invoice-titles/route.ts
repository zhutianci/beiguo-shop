export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { BillingError } from '@/lib/order-invoice'
import { assertTaxNumber, INVOICE_TITLE_LIMIT } from '@/lib/invoice-input'
import { getStorefront } from '@/lib/storefront/resolve'

/**
 * 发票抬头档案（个人中心「抬头管理」+ 各处开票弹窗的一键带入）。
 *
 * 全部按登录用户归属，任何查询都带 userId —— 抬头里有税号、开户行和银行账号，
 * 绝不能出现「只凭自增 id 就能读到别人那条」的接口（本站以前在 /api/receipts 上踩过这个坑）。
 *
 * 【只在主站用（2026-10-15 安全复查）】抬头按用户全局存，渠道站的登录态以前也能读写主站存的抬头（税号、开户行账号）。
 * 渠道站上：列表恒为空且带 storable:false（前端据此隐藏「保存抬头」），新增 / 修改 / 删除一律拒绝；下单、开票也不再存抬头。
 */

const bodySchema = z.object({
  title: z.string().trim().min(1, '抬头必填').max(200),
  taxNumber: z.string().trim().min(1, '税号必填').max(64),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().trim().email('邮箱格式不正确').optional().nullable().or(z.literal('')),
  isDefault: z.boolean().optional().default(false),
})

const SELECT = {
  id: true,
  title: true,
  taxNumber: true,
  address: true,
  phone: true,
  bankName: true,
  bankAccount: true,
  email: true,
  isDefault: true,
  lastUsedAt: true,
  createdAt: true,
} as const

/** 默认的排在最前，其次按最近使用，最后按创建时间 —— 开票弹窗第一眼看到的就是最可能要用的那条 */
const ORDER = [
  { isDefault: 'desc' as const },
  { lastUsedAt: 'desc' as const },
  { id: 'desc' as const },
]

export async function GET() {
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  if (sf.kind !== 'PLATFORM') return success({ list: [], limit: INVOICE_TITLE_LIMIT, storable: false })
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const list = await prisma.invoiceTitle.findMany({
      where: { userId: user.id },
      orderBy: ORDER,
      select: SELECT,
      take: INVOICE_TITLE_LIMIT,
    })
    return success({ list, limit: INVOICE_TITLE_LIMIT, storable: true })
  } catch (err) {
    console.error('List invoice titles error:', err)
    return error('获取抬头失败')
  }
}

export async function POST(request: NextRequest) {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') return error('本站暂不支持保存发票抬头', 403)
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const taxNumber = assertTaxNumber(d.taxNumber)
    const title = d.title.trim()

    // 同一税号 + 同一抬头视为同一条，改成更新。口径与 lib/invoice-input.saveInvoiceTitle 一致
    const dup = await prisma.invoiceTitle.findFirst({
      where: { userId: user.id, taxNumber, title },
      select: { id: true },
    })

    const data = {
      title,
      taxNumber,
      address: d.address?.trim() || null,
      phone: d.phone?.trim() || null,
      bankName: d.bankName?.trim() || null,
      bankAccount: d.bankAccount?.trim() || null,
      email: d.email?.trim().toLowerCase() || null,
    }

    if (!dup) {
      const count = await prisma.invoiceTitle.count({ where: { userId: user.id } })
      if (count >= INVOICE_TITLE_LIMIT) {
        return error(`最多保存 ${INVOICE_TITLE_LIMIT} 条抬头，请先删掉不用的`)
      }
      // 第一条自动成为默认，省掉再点一次
      const created = await prisma.invoiceTitle.create({
        data: { userId: user.id, ...data, isDefault: d.isDefault || count === 0 },
        select: SELECT,
      })
      if (created.isDefault) await clearOtherDefaults(user.id, created.id)
      return success(created, '已保存')
    }

    const updated = await prisma.invoiceTitle.update({
      where: { id: dup.id },
      data: { ...data, ...(d.isDefault ? { isDefault: true } : {}) },
      select: SELECT,
    })
    if (updated.isDefault) await clearOtherDefaults(user.id, updated.id)
    return success(updated, '已更新')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    console.error('Create invoice title error:', err)
    return error('保存抬头失败')
  }
}

/** 默认抬头同一时刻只能有一条。updateMany 带 userId，越权改不到别人的行 */
async function clearOtherDefaults(userId: number, keepId: number) {
  await prisma.invoiceTitle
    .updateMany({ where: { userId, isDefault: true, NOT: { id: keepId } }, data: { isDefault: false } })
    .catch(() => {})
}
