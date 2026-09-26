export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { verifyActionToken } from '@/lib/action-token'
import { sendInvoiceIssuedEmail } from '@/lib/mail'
import { systemEmailConfigured } from '@/lib/aliyun'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { tenantMailOpts } from '@/lib/storefront/origin'
import { sourceMap, sourceOf, parseTenantFilter, INVALID_TENANT_FILTER } from '@/lib/admin/source-site'

/**
 * 财务开票台接口。令牌即凭证，middleware 不拦这条路径，鉴权全在这里自查。
 *
 * 能力被限死在两件事：看待开清单、把某一张标记为已开具。
 * 改不了金额抬头税号、看不到订单与用户、进不了后台。
 *
 * 「待开」的定义：status='SUBMITTED' 且 payStatus='PAID'——
 * 税费已到账、申请正式成立、但还没开出去的那些。
 *
 * 渠道分站（设计 6.4.2 第 5 条、12.2）：财务台是平台内部工具，渠道 Host 上一律 404（令牌也不认）；
 * 待开清单每行带来源站（开票主体仍是必高，只是让财务知道这张票是哪个站的订单）；
 * 标已开具后的「发票已开」邮件按发票 tenantId 取链接 origin（主站不传 = 原来的链接，邮件逐字不变）。
 */

const hits = new Map<string, number[]>()
function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    hits.set(key, arr)
    return true
  }
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 2000) {
    const stale: string[] = []
    hits.forEach((v, k) => {
      if (!v.some((t: number) => now - t < windowMs)) stale.push(k)
    })
    stale.forEach((k) => hits.delete(k))
  }
  return false
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}

const SELECT = {
  id: true,
  invoiceNo: true,
  title: true,
  taxNumber: true,
  address: true,
  phone: true,
  bankName: true,
  bankAccount: true,
  email: true,
  showAiWording: true,
  subscriptionType: true,
  claudeAccount: true,
  orderStartDate: true,
  orderExpireDate: true,
  sellingPrice: true,
  invoiceAmount: true,
  taxFee: true,
  paidAt: true,
  submittedAt: true,
  issuedAt: true,
  status: true,
  tenantId: true,
} as const

const num = (v: unknown) => (v == null ? null : Number(v))

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  // 店面解析不进 try（设计 4.4 第 7 条）：渠道 Host → 404，与「不存在」同一响应
  const deny = await denyOnChannel()
  if (deny) return deny
  const claim = verifyActionToken('invoice', params.token)
  if (!claim) return error('链接无效或已过期，请让管理员重新发送', 403)
  if (limited(`g:${clientIp(request)}`, 60, 60_000)) return error('请求过于频繁', 429)

  // 来源站筛选（契约 7.4：所有列表接口统一 tenantId=<id>|all，默认 all = 原来的清单，逐字不变）
  const site = parseTenantFilter(request.nextUrl.searchParams)
  if (site === 'invalid') return error(INVALID_TENANT_FILTER)

  const [pending, recentIssued] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: 'SUBMITTED', payStatus: 'PAID', ...(site != null ? { tenantId: site } : {}) },
      orderBy: { paidAt: 'asc' }, // 先付先开
      take: 100,
      select: SELECT,
    }),
    prisma.invoice.findMany({
      where: { status: 'ISSUED' },
      orderBy: { issuedAt: 'desc' },
      take: 10,
      select: { invoiceNo: true, title: true, invoiceAmount: true, issuedAt: true },
    }),
  ])

  const srcMap = await sourceMap(pending.map((r) => r.tenantId))
  const shape = ({ tenantId, ...r }: (typeof pending)[number]) => ({
    ...r,
    sellingPrice: num(r.sellingPrice),
    invoiceAmount: num(r.invoiceAmount),
    taxFee: num(r.taxFee),
    // 来源站（主站 / 渠道 code）：只给财务看是哪个站的订单，不含任何渠道配置
    source: sourceOf(srcMap, tenantId),
  })

  return success({
    pending: pending.map(shape),
    recentIssued: recentIssued.map((r) => ({ ...r, invoiceAmount: num(r.invoiceAmount) })),
    expiresAt: claim.expiresAt,
    emailConfigured: systemEmailConfigured(),
  })
}

const markSchema = z.object({
  invoiceId: z.number().int().positive(),
  /** 开完后是否给客户发邮件（默认发） */
  notifyCustomer: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const deny = await denyOnChannel()
  if (deny) return deny
  const claim = verifyActionToken('invoice', params.token)
  if (!claim) return error('链接无效或已过期，请让管理员重新发送', 403)
  if (limited(`p:${params.token}`, 60, 600_000)) return error('操作过于频繁，请稍后再试', 429)

  const body = await request.json().catch(() => null)
  const parsed = markSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.errors[0].message)

  const iv = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId }, select: SELECT })
  if (!iv) return error('发票不存在', 404)
  if (iv.status === 'ISSUED') return error('该发票已标记为已开具，无需重复操作')
  if (iv.status !== 'SUBMITTED') return error(`当前状态为「${iv.status}」，不能直接标记已开具`)

  const issuedAt = new Date()
  // 条件更新：并发下只有第一次能翻转状态，避免重复发邮件给客户
  const flipped = await prisma.invoice.updateMany({
    where: { id: iv.id, status: 'SUBMITTED' },
    data: { status: 'ISSUED', issuedAt },
  })
  if (flipped.count !== 1) return error('该发票状态已被其他人更新，请刷新后查看')

  let mailed = false
  let mailError: string | null = null
  if (parsed.data.notifyCustomer && iv.email) {
    if (!systemEmailConfigured()) {
      mailError = '邮件服务未配置，未发送通知'
    } else {
      try {
        // 渠道订单的发票：邮件里的链接用渠道 origin（设计 11.4「发票已开由财务台路由发出，按发票 tenantId」），
        // 页脚带店面客服邮箱（二期改动 4.5）；主站返回 undefined，邮件逐字不变
        const mailOpts = await tenantMailOpts(iv.tenantId)
        const r = await sendInvoiceIssuedEmail(
          iv.email,
          {
            invoiceNo: iv.invoiceNo,
            title: iv.title || '—',
            taxNumber: iv.taxNumber,
            subscriptionType: iv.subscriptionType,
            invoiceAmount: num(iv.invoiceAmount),
            issuedAt,
          },
          mailOpts,
        )
        mailed = !!r?.ok
        if (!mailed) mailError = r?.detail || '发送失败'
      } catch (e) {
        mailError = e instanceof Error ? e.message : '发送异常'
      }
    }
    // 邮件失败不回滚状态：票确实开出去了，状态就该是已开具；
    // 客户没收到邮件是可以补发的，把状态改回去反而会让财务重复开票。
    if (mailError) console.error(`[finance] 发票 ${iv.invoiceNo} 已开具但邮件未送达：${mailError}`)
  } else if (!iv.email) {
    mailError = '该发票没有留接收邮箱，未发送通知'
  }

  return success(
    { invoiceId: iv.id, issuedAt, mailed, mailError },
    mailed ? '已标记开具，并已邮件通知客户' : `已标记开具${mailError ? `（${mailError}）` : ''}`
  )
}
