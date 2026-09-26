export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { calcInvoiceAmounts } from '@/lib/invoice'
import { shopOrderSourceKey } from '@/lib/order-invoice'
import { invoicesByOrderIds, orderIdFromSourceKey } from '@/lib/order-link'
import { getCurrentUser } from '@/lib/auth'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { emailDigest, hasAccountAccess, readProofDigests } from '@/lib/email-proof'
import { ipKey } from '@/lib/auth-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'

const querySchema = z.object({
  email: z.string().email('请输入正确的邮箱'),
})

// 邮箱放 body 而不是 query：query 会整串进 nginx 访问日志
export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  const body = await request.json().catch(() => null)
  return lookup(request, body?.email)
}

// 兼容：发布窗口里旧页面的 JS 还在用 GET。行为与 POST 完全一样（同样要求邮箱归属证明），下个版本删掉
export async function GET(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return lookup(request, new URL(request.url).searchParams.get('email'))
}

/**
 * 【2026-09-26 起必须证明邮箱归属（审计 G11）】以前只凭邮箱就能查到任何人的全部订阅，
 * 还会下发收据令牌（打开即见付款人抬头与金额）——同行手里有大量客户邮箱，等于客户资料任取。
 * 现在要求：刚用 LOOKUP 验证码验过这个邮箱（cookie 证明）/ 登录邮箱已验证且就是它 / 已验证的绑定。
 * 没证明时回 401 + needVerify，前端引导去收验证码。
 */
async function lookup(request: NextRequest, rawEmail: unknown) {
  try {
    const result = querySchema.safeParse({ email: rawEmail })
    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const email = result.data.email.trim().toLowerCase()

    const rawIp = clientIp(request.headers)
    const ip = rawIp !== 'unknown' ? ipKey(rawIp) : null // IPv6 按 /64 聚合，换地址绕不过
    if (ip && rateLimited(`lookup-ip:${ip}`, { windowMs: 600_000, max: 60 })) {
      return error('查询过于频繁，请稍后再试', 429)
    }

    const user = await getCurrentUser()
    if (!(await hasAccountAccess(email, user, await readProofDigests()))) {
      // 按邮箱计数只算「没证明归属」的请求：放在鉴权之前的话，知道邮箱的人刷 30 次
      // 就能让真正的主人（已验证、已登录）也一直看到「查询过于频繁」（终审 2026-09-26）
      if (rateLimited(`lookup-mail:${emailDigest(email)}`, { windowMs: 600_000, max: 30 })) {
        return error('查询过于频繁，请稍后再试', 429)
      }
      return NextResponse.json({ success: false, error: '请先验证邮箱', needVerify: true }, { status: 401 })
    }

    const orders = await prisma.externalOrder.findMany({
      where: { claudeAccount: email },
      orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
      select: {
        id: true,
        startDate: true,
        expireDate: true,
        subscriptionType: true,
        claudeAccount: true,
        quote: true,
        shopOrderId: true,
        sourceKey: true, // 只用来判断 ownerOnly，不下发
        createdAt: true,
        updatedAt: true,
      },
    })

    /*
     * 【结账时已预收 6% 的站内订单】它的发票挂在 `order:<id>` 那条背书行上，
     * 而管理员按真实订阅周期导入的那条（sourceKey = hashKey(...)）上没有发票，
     * 于是这一页会把它显示成「未开发票·可申请」，收据金额也按不含税的 quote 报。
     * 买家点进去虽然被服务端的 settlePrepaid* 挡住了不会被重复收钱，
     * 但页面先承诺一个数、提交后又变成另一个数，本身就是这次改造要消除的困惑。
     * 这里按 shopOrderId 反查一次，把状态和金额一次报对。
     */
    const shopOrderIds = orders.map((o) => o.shopOrderId).filter((v): v is number => v != null)
    const prepaidOrderIds = new Set<number>()
    if (shopOrderIds.length) {
      const paid = await prisma.order.findMany({
        where: { id: { in: shopOrderIds }, payStatus: 'PAID', invoiceTaxFee: { not: null } },
        select: { id: true },
      })
      paid.forEach((o) => prepaidOrderIds.add(o.id))
    }

    const orderIds = orders.map((o) => o.id)
    // 发票/收据均以「报价(quote)」为计费基准
    const [invoices, receipts] = await Promise.all([
      orderIds.length
        ? prisma.invoice.findMany({
            where: { externalOrderId: { in: orderIds } },
            select: { id: true, externalOrderId: true, status: true, payStatus: true },
          })
        : Promise.resolve([]),
      orderIds.length
        ? prisma.receipt.findMany({
            where: { externalOrderId: { in: orderIds } },
            select: { token: true, externalOrderId: true },
          })
        : Promise.resolve([]),
    ])
    const invoiceMap = new Map(invoices.map((iv) => [iv.externalOrderId, iv]))
    const receiptMap = new Map(receipts.map((r) => [r.externalOrderId, r]))

    /*
     * 【同一张站内订单的「另一条行」】管理员交付时导入的 WEB 行与买家申请时造的背书行（order:<id>）
     * 指向同一笔货款。发票/收据可能开在另一条行上 —— 那样这一行不能再给「申请」入口
     * （服务端 /api/invoices、/api/receipts 的跨行查重也会拒，这里只是不让按钮出现）。
     * 另一条行上收据的令牌不在这里下发：那张收据可能是站内买家以自己的抬头开的，
     * 凭账户邮箱匿名查询的人不该拿到它的链接。
     */
    const shopIds = Array.from(new Set(orders.map((o) => o.shopOrderId).filter((v): v is number => v != null)))
    const siblingInvoices = shopIds.length ? await invoicesByOrderIds(shopIds) : new Map()
    const siblingReceiptOrderIds = new Set<number>()
    if (shopIds.length) {
      const sibExts = await prisma.externalOrder.findMany({
        where: { OR: [{ shopOrderId: { in: shopIds } }, { sourceKey: { in: shopIds.map(shopOrderSourceKey) } }] },
        select: { id: true, shopOrderId: true, sourceKey: true },
      })
      const extToShop = new Map<number, number>()
      sibExts.forEach((e) => {
        const sid = e.shopOrderId ?? orderIdFromSourceKey(e.sourceKey)
        if (sid) extToShop.set(e.id, sid)
      })
      const sibRecs = extToShop.size
        ? await prisma.receipt.findMany({
            where: { externalOrderId: { in: Array.from(extToShop.keys()) }, source: 'BUYER' },
            select: { externalOrderId: true },
          })
        : []
      sibRecs.forEach((r) => {
        const sid = r.externalOrderId != null ? extToShop.get(r.externalOrderId) : undefined
        if (sid) siblingReceiptOrderIds.add(sid)
      })
    }

    const list = orders.map((o) => {
      const price = o.quote == null ? null : Number(o.quote)
      const existing = invoiceMap.get(o.id)
      /** 这条订阅对应的站内订单在结账时已经把 6% 跟货款一起付清了 */
      const prepaid = o.shopOrderId != null && prepaidOrderIds.has(o.shopOrderId)
      let invoiceStatus: string
      let sellingPrice: number | null = null
      let invoiceAmount: number | null = null
      let taxFee: number | null = null

      // 另一条行上已提交 / 已开具 / 不可开据 / 已付税费的发票（本行自己的发票仍以本行为准）
      const sibling =
        !existing && o.shopOrderId != null
          ? ((siblingInvoices.get(o.shopOrderId) || []) as { externalOrderId: number | null; status: string; payStatus: string; orphan?: boolean }[]).find(
              (iv) =>
                iv.externalOrderId !== o.id &&
                (iv.payStatus === 'PAID' || iv.status === 'SUBMITTED' || iv.status === 'ISSUED' || iv.status === 'CANNOT')
            )
          : undefined
      if (price == null) {
        invoiceStatus = existing ? existing.status : 'CANNOT' // 无报价 → 暂不可开据
      } else if (sibling) {
        sellingPrice = price
        const amt = calcInvoiceAmounts(price)
        invoiceAmount = amt.invoiceAmount
        taxFee = amt.taxFee
        invoiceStatus = sibling.status === 'AWAIT_PAY' ? 'SUBMITTED' : sibling.status
      } else {
        sellingPrice = price
        const amt = calcInvoiceAmounts(price)
        invoiceAmount = amt.invoiceAmount
        taxFee = amt.taxFee
        // 预收过税费的：即使这条行上还没有发票记录也报「已提交开票」，
        // 不给「申请发票」的入口（服务端那道闸也会拒，这里只是不让它出现在眼前）
        invoiceStatus = existing ? existing.status : prepaid ? 'SUBMITTED' : 'UNAPPLIED'
      }

      const receipt = receiptMap.get(o.id)
      const { quote: _quote, shopOrderId: _sid, sourceKey: _sk, ...rest } = o
      // 收据金额：买家已付发票税费(payStatus=PAID) → 含税开票金额；否则售价。
      // 须与 submitReceiptForExternalOrder 中的服务端计费口径保持一致。
      const siblingPaid = !!sibling && sibling.payStatus === 'PAID'
      const receiptAmount =
        (existing?.payStatus === 'PAID' || prepaid || siblingPaid) && invoiceAmount != null
          ? invoiceAmount
          : sellingPrice
      const siblingReceipt = !receipt && o.shopOrderId != null && siblingReceiptOrderIds.has(o.shopOrderId)
      return {
        ...rest,
        canInvoice: price != null && invoiceStatus !== 'CANNOT' && !prepaid && !sibling,
        sellingPrice,
        invoiceAmount,
        taxFee,
        receiptAmount,
        invoiceStatus,
        invoiceId: existing?.id ?? null,
        // 另一条行上已开过收据：同一笔付款只开一张，不再给入口
        canReceipt: price != null && !siblingReceipt,
        receiptToken: receipt?.token ?? null,
        // 背后是站内订单的行：开票 / 开收据 / 付税费只认下单本人登录（lib/order-billing.ts 规则 A），
        // 前端据此在未登录时提示「请登录下单账号」而不是给出点了必然 403 的按钮
        ownerOnly: o.shopOrderId != null || o.sourceKey.startsWith('order:'),
      }
    })

    return success({ orders: list, count: list.length })
  } catch (err) {
    console.error('Lookup error:', err)
    return error('查询失败')
  }
}
