export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { vmqConfigured, VmqError } from '@/lib/vmq'
import {
  ensureExternalOrderForShopOrder,
  submitInvoiceForExternalOrder,
  shopOrderSourceKey,
  BillingError,
} from '@/lib/order-billing'
import { settlePrepaidOrderInvoice } from '@/lib/order-invoice'
import { invoicesForOrder } from '@/lib/order-link'
import {
  buyerInvoiceSubmitSchema,
  normalizeInvoiceFields,
  afterInvoiceSubmitted,
} from '@/lib/invoice-input'

// 字段校验统一在 lib/invoice-input（route.ts 不能导出 handler 以外的东西，
// 而三个开票入口必须共用同一套规则 —— 尤其是税号去空格，漏一处等于没做）
const schema = buyerInvoiceSubmitSchema

// 买家从「我的订单」直接申请发票（无需邮箱查询）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!vmqConfigured()) return error('支付未配置，暂无法提交发票', 500)

    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, nickname: true } } },
    })
    if (!order || order.userId !== user.id) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能申请发票')

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const fields = normalizeInvoiceFields(parsed.data)

    /*
     * 【防重复收税】这一单在结账时勾过「同时开发票」，6% 已经跟货款一起收过了。
     * 绝不能再开一张待付税费的收款单 —— 那是向同一个买家收第二遍。
     * 顺手把当初的草稿补落成正式发票（万一履约那一下失败过），
     * 并用这次填的抬头覆盖（票还没开出去时），买家填的内容不会白填。
     */
    const prepaid = await settlePrepaidOrderInvoice(order.id, fields)
    if (prepaid) {
      await afterInvoiceSubmitted(user.id, parsed.data, fields)
      return success(
        { alreadyPaid: true },
        '该订单下单时已选择开发票、税费也已随货款付清，无需再次支付；抬头已按本次填写更新'
      )
    }

    /*
     * 【防重复收税 · 第二道】一张站内订单可能挂两条外部订单：背书行（sourceKey=`order:<id>`）
     * 与管理员「标记已完成」导入的 WEB 行（只有 shopOrderId）。买家从「邮箱查订阅」
     * 在 WEB 行上申请过发票的话，下面的 submitInvoiceForExternalOrder 只查背书行，
     * 会再建一张、再收一次 6%。所以先把这张订单名下所有发票都拉出来看一遍
     * （lib/order-link 两根线索都查）。这些判断都在建背书行之前，拦下来不留任何副作用。
     */
    const linked = await invoicesForOrder(order.id)
    if (linked.some((iv) => iv.status === 'SUBMITTED' || iv.status === 'ISSUED')) {
      return error('该订单已提交过发票申请，请勿重复提交')
    }
    // 税费已经付过、但状态被后台改乱了（如 AWAIT_PAY 且已付）：再走下去就是第二次收款
    if (linked.some((iv) => iv.payStatus === 'PAID')) {
      return error('该订单的发票税费已支付，请勿重复提交；如需修改发票信息请联系客服')
    }
    // 后台在任何一行上标了「不可开」，就是这张订单不开票（与 submitInvoiceForExternalOrder 同一句话）
    if (linked.some((iv) => iv.status === 'CANNOT')) {
      return error('该订单暂不可开具发票，请联系客服')
    }
    // 别的行上有一张待付税费的：让买家去付那一张，不另起一张。
    // 背书行上的 AWAIT_PAY 不拦 —— 那是原有流程：重新提交会就地更新抬头并返回收款链接。
    const awaiting = linked.filter((iv) => iv.status === 'AWAIT_PAY' && iv.externalOrderId != null)
    if (awaiting.length) {
      const backing = await prisma.externalOrder.findUnique({
        where: { sourceKey: shopOrderSourceKey(order.id) },
        select: { id: true },
      })
      const otherExtIds = awaiting.map((iv) => iv.externalOrderId as number).filter((id) => id !== backing?.id)
      if (otherExtIds.length) {
        // 只认外部订单行还在的：行被删掉的孤儿发票在付税费接口那边已经付不了（会回 404），
        // 拦住就是死路一条
        const alive = await prisma.externalOrder.count({ where: { id: { in: otherExtIds } } })
        if (alive > 0) {
          return error('该订单已有一张待支付税费的发票申请，请在订单页「开具发票 / 收据」中继续支付')
        }
      }
    }

    // 为该订单生成/复用背书外部订单，复用现有发票体系
    const ext = await ensureExternalOrderForShopOrder({
      id: order.id,
      productName: order.productName,
      amount: order.amount,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      user: order.user,
    })

    const result = await submitInvoiceForExternalOrder(ext.id, fields, { userId: user.id })
    await afterInvoiceSubmitted(user.id, parsed.data, fields)
    return success(result, '已提交，请支付税费')
  } catch (err) {
    if (err instanceof BillingError) return error(err.message, err.status)
    if (err instanceof VmqError) return error(err.message)
    console.error('Order invoice error:', err)
    return error('提交发票失败')
  }
}
