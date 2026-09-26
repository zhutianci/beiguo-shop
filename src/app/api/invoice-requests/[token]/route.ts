export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import type { ZodError } from 'zod'
import { success, error } from '@/lib/api'
import { BillingError } from '@/lib/order-invoice'
import { invoiceFieldsSchema, normalizeInvoiceFields } from '@/lib/invoice-input'
import {
  INVOICE_REQUEST_TOKEN_RE,
  publicInvoiceRequestView,
  submitInvoiceRequest,
} from '@/lib/invoice-request'
import { notifyInvoiceRequestSubmitted } from '@/lib/notify'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 开票填写链接（公开，免登录）：客户看金额 + 提交抬头信息。
 *
 * 【为什么不要求登录】拿链接的是站外客户，多半不是本站用户。令牌 128-bit 随机、
 * 不可枚举，拿到链接本身就是凭证（与收据页、财务台同一套思路）。
 *
 * 【客户能改什么、不能改什么】只能填抬头/税号/邮箱/是否展示字眼 + 选填的地址电话开户行。
 * 金额与开票内容是管理员定的，这个接口根本不收这两个字段 —— 请求体里带了也会被 zod 丢掉。
 *
 * 【限流】提交是公开写操作，每次成功都会建一张发票并推一条企业微信：
 *   · 按 IP：挡住一个来源对着多个链接狂刷
 *   · 按令牌：挡住同一个链接被并发/重复点击（CAS 已保证只会成功一次，这里是把洪水挡在查库之前）
 * IP 头虽已由 nginx 核实、伪造不了，但换 IP 很便宜（手机流量、IPv6、代理），所以两道闸都要有，不能只靠 IP。
 *
 * 所有响应一律 no-store：已提交的状态里有打码邮箱和抬头，不能让任何中间层缓存。
 */

function noStore<T extends NextResponse>(res: T): T {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.headers.set('Pragma', 'no-cache')
  return res
}

const FIELD_LABELS: Record<string, string> = {
  title: '抬头',
  taxNumber: '税号',
  email: '接收邮箱',
}

/**
 * zod 的首条错误 → 中文提示。invoiceFieldsSchema 对「字段整个缺席」给的是英文 Required，
 * 正常页面不会走到（表单总会带上这些字段），但接口是公开的，报错也得让人看得懂。
 */
function firstError(err: ZodError): string {
  const issue = err.errors[0]
  const key = String(issue.path[0] ?? '')
  if (issue.code === 'invalid_type' && FIELD_LABELS[key] && (issue.received === 'undefined' || issue.received === 'null')) {
    return `${FIELD_LABELS[key]}必填`
  }
  return issue.message
}

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const token = (params.token || '').trim()
    // 格式不对直接当不存在，不查库、也不占限流名额
    if (!INVOICE_REQUEST_TOKEN_RE.test(token)) return noStore(error('链接不存在或已失效', 404))

    // 只读也限一下：令牌不可枚举，这里防的是有人拿脚本把库当压测靶子
    if (rateLimited(`invreq-view:${clientIp(request.headers)}`, { windowMs: 60_000, max: 60 })) {
      return noStore(error('访问太频繁，请稍后再试', 429))
    }

    const view = await publicInvoiceRequestView(token)
    if (!view) return noStore(error('链接不存在或已失效', 404))
    return noStore(success(view))
  } catch (err) {
    console.error('Get invoice request error:', err)
    return noStore(error('获取失败'))
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const token = (params.token || '').trim()
    if (!INVOICE_REQUEST_TOKEN_RE.test(token)) return noStore(error('链接不存在或已失效', 404))

    const ip = clientIp(request.headers)
    if (
      rateLimited(`invreq-submit-ip:${ip}`, { windowMs: 60_000, max: 10 }) ||
      rateLimited(`invreq-submit-token:${token}`, { windowMs: 60_000, max: 5 })
    ) {
      return noStore(error('提交太频繁，请稍后再试', 429))
    }

    const parsed = invoiceFieldsSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return noStore(error(firstError(parsed.error)))

    // 税号去全部空白、去空白后超 20 位直接拦（抛 BillingError → 下面转成 400）
    const fields = normalizeInvoiceFields(parsed.data)

    const r = await submitInvoiceRequest(token, fields, ip === 'unknown' ? null : ip)

    // fire-and-forget：通知挂了不能影响客户看到「已提交」
    notifyInvoiceRequestSubmitted({
      invoiceNo: r.invoiceNo,
      title: fields.title,
      taxNumber: fields.taxNumber,
      invoiceAmount: r.invoiceAmount,
      showAiWording: fields.showAiWording,
      email: fields.email,
    })

    return noStore(
      success({ invoiceNo: r.invoiceNo, invoiceAmount: r.invoiceAmount }, '已提交，发票开具后会发送到你的接收邮箱')
    )
  } catch (err) {
    if (err instanceof BillingError) return noStore(error(err.message, err.status))
    console.error('Submit invoice request error:', err)
    return noStore(error('提交失败，请稍后重试'))
  }
}
