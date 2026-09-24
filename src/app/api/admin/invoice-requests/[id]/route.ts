export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { cancelInvoiceRequest } from '@/lib/invoice-request'

/**
 * 作废一个开票填写链接。
 *
 * 只有 PENDING（含已过期但还是 PENDING 的）能作废：已提交的链接背后已经有一张发票了，
 * 要撤就到发票管理里改那张发票的状态 —— 在这里把链接翻成 CANCELLED 并不会撤掉发票，
 * 只会让两边对不上。作废本身是 CAS（lib/invoice-request 的 cancelInvoiceRequest），
 * 与客户同时提交撞车时只会有一边成功。
 */
const patchSchema = z.object({
  action: z.literal('CANCEL', { errorMap: () => ({ message: '不支持的操作' }) }),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return error('参数无效')

    const parsed = patchSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const exists = await prisma.invoiceRequest.findUnique({ where: { id }, select: { id: true } })
    if (!exists) return notFound('链接不存在')

    const ok = await cancelInvoiceRequest(id)
    if (!ok) return error('只有待填写的链接可以作废')
    return success({ id }, '已作废，客户将无法再通过该链接提交')
  } catch (err) {
    console.error('Admin cancel invoice request error:', err)
    return error('操作失败')
  }
}
