/**
 * WP4 集成测试（超管：订单、售后与全站来源站）：进程内直接调 route handler（不起 Next 服务），连一次性开发库。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp4.ts
 *
 * 覆盖实施分包 7.5：
 *   W4-1  渠道单（已付）取消不带 refund → 400
 *   W4-2  退款弹窗保存：订单 CAS + 冲销分录 + 售后申请 DONE + 审计同一事务；两个管理员同时保存 → 一个 200、一个 409
 *   W4-3  取消未付渠道单时恰好到账（另一事务持锁翻 PAID）→ 409，无写入
 *   W4-4  渠道单从已取消恢复、RELEASED 撤回交付、已付改回 UNPAID、已退款标已交付 → 400
 *   W4-5  渠道单改价低于进货款 → 400；合规改价写审计；改价时订单已被付款 → 409
 *   W4-6  标已付：渠道单缺实收 400；少付缺承担方 400；CHANNEL → short: 分录与 shortCents / shortChargedCents；
 *         PLATFORM 的开票单发票分成按实收税费计；Payment 补建
 *   W4-6a 接码类 CHANNEL 退款：默认 loss = 进货价分摊（不是接码成本）；渠道流水里无接码成本特征值
 *   W4-6b 按件退 1 件后补发卡密 → 不为已退的件补卡
 *   W4-7  订单 / 用户 / 卡密 / 发票 / 收据 / 外部订单 / 兑换日志 / 售后 按来源站筛选的计数与直接 SQL 一致；卡密来源站 = 售出订单的站、未售 = 库存
 *   W4-8  用户详情按站分 tab、渠道拉黑显示操作方「渠道」、超管推翻写 actorKind=PLATFORM 审计；平台备注不出现在渠道响应
 *   W4-8a 把有效渠道成员提为 ADMIN → 400，角色不变
 *   W4-9  仪表盘：主站 / 渠道销售额分列，已付已取消不计入，「全部」= 直接 SQL；卡密分析按来源站拆分
 *   W4-9a 渠道单发票改 CANNOT 不带 taxRefund → 400；带退税费 → 分成冲销；带 keep → 审计；ISSUED 撤回 SUBMITTED 同理；by-order 同理
 *   W4-9b 卡密批量 SET_PRICE 含渠道单的卡 → 拒绝并列出
 *   W4-10 删除有 listing / 订单的商品 → 拒绝；下架 → 已授权渠道收到 PRODUCT_WITHDRAWN
 *   W4-11 渠道 Host 访问全部 WP4 接口、/api/finance、/api/quick-reply、/finance、/reply → 404
 *   W4-12 渠道单「已交付」邮件、财务台「发票已开」邮件链接为渠道 origin（截获发信请求）
 * 另：售后申请处理（驳回 / 已处理 / 清除升级 / 重复 409）、按快照补记、后台回复 senderRole、快捷回复、休眠期主站订单保存照旧（M7）。
 *
 * 【外部副作用】删掉企业微信 webhook 相关环境变量；阿里云发信用假 AccessKey + 截获 fetch（不出网），渠道通知推送换成计数桩。
 * 【清理】测试数据用 @itest-tenant.local 邮箱、ITEST 前缀；结束时先删本包额外产生的外部订单 / 票据，再 cleanupAll()。
 */
for (const k of ['VMQ_KEY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL', 'FINANCE_WEBHOOK_URL']) delete process.env[k]
// 发信：假密钥让 systemEmailConfigured() 为真，真正的 HTTP 由下面的 fetch 桩截获（aliyun.ts 在模块加载时读 env，所以要在 import 之前设）
process.env.ALIYUN_ACCESS_KEY_ID = 'itest-ak'
process.env.ALIYUN_ACCESS_KEY_SECRET = 'itest-sk'
process.env.ALIYUN_DM_NOREPLY = 'no-reply@itest.local'
process.env.ALIYUN_DM_ACCOUNT = 'remind@itest.local'

import { Prisma } from '@prisma/client'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  createWorld,
  cleanupAll,
  callRoute,
  catchNext,
  withRequest,
  signTestToken,
  MARK,
  MAIL_DOMAIN,
  NAME_PREFIX,
  RUN,
  type RouteFn,
  type World,
  type WorldUser,
} from './_harness'

// ---------------------------------------------------------------------------
// 发信截获：只拦 dm.aliyuncs.com，其余请求原样放行
// ---------------------------------------------------------------------------
const sentMails: { to: string; subject: string; html: string }[] = []
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const u = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  if (u.startsWith('https://dm.aliyuncs.com')) {
    const p = new URLSearchParams(String(init?.body ?? ''))
    sentMails.push({ to: p.get('ToAddress') || '', subject: p.get('Subject') || '', html: p.get('HtmlBody') || '' })
    return new Response(JSON.stringify({ RequestId: 'itest-req', EnvId: 'itest' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  if (u.startsWith('https://dysmsapi.aliyuncs.com') || u.startsWith('https://qyapi.weixin.qq.com')) {
    return new Response(JSON.stringify({ RequestId: 'itest', errcode: 0 }), { status: 200 })
  }
  return realFetch(input as RequestInfo, init)
}) as typeof fetch

type AnyRoute = Record<string, unknown>
const DAY = 86400_000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let ipSeq = 0
const nextIp = () => {
  ipSeq++
  return `10.44.${(ipSeq >> 8) & 255}.${ipSeq & 255}`
}
function h(mod: AnyRoute, method: string): RouteFn {
  const fn = mod[method]
  if (typeof fn !== 'function') throw new Error(`路由没有导出 ${method}`)
  return fn as RouteFn
}
async function call(
  mod: AnyRoute,
  method: string,
  who: { host: string; token?: string | null },
  o: { body?: unknown; params?: Record<string, string>; path?: string; query?: Record<string, string | number> } = {},
) {
  const qs = o.query ? `?${new URLSearchParams(Object.entries(o.query).map(([k, v]) => [k, String(v)])).toString()}` : ''
  return callRoute(h(mod, method), {
    host: who.host,
    token: who.token ?? null,
    method,
    path: (o.path ?? '/api/admin/itest') + qs,
    body: o.body,
    params: o.params,
    headers: { 'cf-connecting-ip': nextIp() },
  })
}
const rid = (tag: string) => `it4${tag}${RUN}${Math.random().toString(36).slice(2, 8)}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60)

// ---------------------------------------------------------------------------
// 夹具：本包自己的渠道单（与 WP3 / WP5 itest 同一套造法：直接写快照，付款事务里 accrueOnPaid）
// ---------------------------------------------------------------------------
let oSeq = 0
type L_ = typeof import('../../src/lib/tenant/ledger')
async function mkOrder(
  L: L_,
  a: {
    tenantId: number
    user: WorldUser
    productId: number
    listingId: number | null
    qty?: number
    priceCents?: number
    supplyUnitCents?: number
    unpaid?: boolean
    release?: boolean
    delivered?: boolean
    invoiceTaxCents?: number
  },
): Promise<{ id: number; orderNo: string }> {
  oSeq++
  const qty = a.qty ?? 1
  const price = a.priceCents ?? 14000
  const supplyUnit = a.supplyUnitCents ?? 11000
  const channel = a.tenantId !== 1
  const o = await prisma.order.create({
    data: {
      orderNo: `IW4${RUN.toUpperCase()}${String(oSeq).padStart(3, '0')}`.slice(0, 32),
      userId: a.user.id,
      productId: a.productId,
      productName: `${NAME_PREFIX} W4 ${oSeq}`,
      productPrice: new Prisma.Decimal((price / 100).toFixed(2)),
      quantity: qty,
      amount: new Prisma.Decimal(((price * qty) / 100).toFixed(2)),
      invoiceTaxFee: a.invoiceTaxCents ? new Prisma.Decimal((a.invoiceTaxCents / 100).toFixed(2)) : null,
      tenantId: a.tenantId,
      remark: '旧备注',
      buyerRemark: 'W4 买家备注',
      ...(channel
        ? {
            listingId: a.listingId,
            supplyUnitPrice: new Prisma.Decimal((supplyUnit / 100).toFixed(2)),
            supplyCents: supplyUnit * qty,
            feeRateBp: 150,
            invoiceShareRateBp: 200,
            settleHoldDays: 7,
            mainPriceAtOrder: new Prisma.Decimal('129.00'),
          }
        : {}),
    },
    select: { id: true, orderNo: true },
  })
  if (a.unpaid) return o
  const old = new Date(Date.now() - 8 * DAY)
  const delivered = a.delivered !== false
  const gross = price * qty + (a.invoiceTaxCents ?? 0)
  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: o.id, payStatus: 'UNPAID' },
      data: { payStatus: 'PAID', paidAt: old, payMethod: 'ALIPAY', deliveryStatus: delivered ? 'DELIVERED' : 'PROCESSING', deliveredAt: delivered ? old : null },
    })
    await tx.payment.create({ data: { orderId: o.id, payMethod: 'ALIPAY', amount: new Prisma.Decimal((gross / 100).toFixed(2)), status: 1 } })
    await L.accrueOnPaid(tx, o.id)
  })
  if (a.release) await L.releaseDue(new Date(), { tenantId: a.tenantId })
  return o
}
const ord = (id: number) => prisma.order.findUniqueOrThrow({ where: { id } })
async function compSum(orderId: number, component: string): Promise<number> {
  const r = await prisma.tenantLedgerEntry.aggregate({ where: { orderId, component }, _sum: { amountCents: true } })
  return r._sum.amountCents ?? 0
}

// ---------------------------------------------------------------------------
async function main() {
  const notice = await import('../../src/lib/tenant/notice')
  notice.setTenantNoticeTransportForTest(async () => true)
  const L = await import('../../src/lib/tenant/ledger')
  const { invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  const { issueQuickReplyToken } = await import('../../src/lib/quick-reply')
  const { issueActionToken } = await import('../../src/lib/action-token')
  const { invalidateSiteOptions } = await import('../../src/lib/admin/source-site')

  const rOrders = await import('../../src/app/api/admin/orders/route')
  const rOrder = await import('../../src/app/api/admin/orders/[id]/route')
  const rDetail = await import('../../src/app/api/admin/orders/[id]/detail/route')
  const rMsgs = await import('../../src/app/api/admin/orders/[id]/messages/route')
  const rRefill = await import('../../src/app/api/admin/orders/[id]/refill/route')
  const rResettle = await import('../../src/app/api/admin/orders/[id]/resettle/route')
  const rAS = await import('../../src/app/api/admin/after-sales/route')
  const rASOne = await import('../../src/app/api/admin/after-sales/[id]/route')
  const rRedeem = await import('../../src/app/api/admin/redeem-logs/route')
  const rUsers = await import('../../src/app/api/admin/users/route')
  const rUser = await import('../../src/app/api/admin/users/[id]/route')
  const rUserDetail = await import('../../src/app/api/admin/users/[id]/detail/route')
  const rUserSite = await import('../../src/app/api/admin/users/[id]/sites/[tenantId]/route')
  const rCards = await import('../../src/app/api/admin/cardkeys/route')
  const rCard = await import('../../src/app/api/admin/cardkeys/[id]/route')
  const rCardOrder = await import('../../src/app/api/admin/cardkeys/[id]/order/route')
  const rCardBatch = await import('../../src/app/api/admin/cardkeys/batch/route')
  const rCardExport = await import('../../src/app/api/admin/cardkeys/export/route')
  const rInvoices = await import('../../src/app/api/admin/invoices/route')
  const rInvoice = await import('../../src/app/api/admin/invoices/[id]/route')
  const rInvExport = await import('../../src/app/api/admin/invoices/export/route')
  const rByOrder = await import('../../src/app/api/admin/invoices/by-order/[externalOrderId]/route')
  const rReceipts = await import('../../src/app/api/admin/receipts/route')
  const rReceipt = await import('../../src/app/api/admin/receipts/[id]/route')
  const rExt = await import('../../src/app/api/admin/external-orders/route')
  const rStats = await import('../../src/app/api/admin/stats/route')
  const rAnaOrders = await import('../../src/app/api/admin/analytics/orders/route')
  const rAnaCards = await import('../../src/app/api/admin/analytics/cardkeys/route')
  const rProduct = await import('../../src/app/api/admin/products/[id]/route')
  const rVmq = await import('../../src/app/api/admin/vmq/complete/route')
  const rFinance = await import('../../src/app/api/finance/invoices/[token]/route')
  const rQuick = await import('../../src/app/api/quick-reply/[token]/route')
  const FinanceLayout = (await import('../../src/app/finance/[token]/layout')).default
  const ReplyLayout = (await import('../../src/app/reply/[token]/layout')).default
  // 渠道侧（只读核对）：流水、客户详情
  const pLedger = await import('../../src/app/api/partner/finance/ledger/route')
  const pCustomer = await import('../../src/app/api/partner/customers/[customerNo]/route')
  const pOrder = await import('../../src/app/api/partner/orders/[orderNo]/route')
  const pAudit = await import('../../src/app/api/partner/audit/route')

  await cleanupAll()
  setChannelsMode('observe')
  invalidateStorefrontCache()
  invalidateSiteOptions()
  const w: World = await createWorld()
  const MAIN = { host: 'bigolab.com' }
  const sa = { ...MAIN, token: w.token(w.users.sa) }
  const LULU = { host: w.lulu.host }
  const luluOwner = { ...LULU, token: w.token(w.users.luluOwner, w.lulu) }
  const P = (id: number | string) => ({ id: String(id) })
  const lid = async (publicNo: string) => (await prisma.tenantListing.findUniqueOrThrow({ where: { publicNo }, select: { id: true } })).id
  const LA = await lid(w.listings.luluAuto)
  const LM = await lid(w.listings.luluManual)
  const LS = await lid(w.listings.luluSms)
  const buyer = w.users.luluBuyer1
  const put = (id: number, body: unknown, who = sa) => call(rOrder, 'PUT', who, { params: P(id), body })

  // =========================================================================
  section('W4-11 渠道 Host 上全部 WP4 接口 404；非管理员 403')
  // =========================================================================
  {
    const onLulu = { host: w.lulu.host, token: signTestToken(w.users.sa, w.lulu.code, w.lulu.id) }
    const oid = String(w.orders.luluAuto.id)
    const matrix: [AnyRoute, string, Record<string, string>, unknown?][] = [
      [rOrders, 'GET', {}],
      [rOrder, 'PUT', P(oid), { deliveryInfo: 'x' }],
      [rDetail, 'GET', P(oid)],
      [rMsgs, 'GET', P(oid)],
      [rMsgs, 'POST', P(oid), { content: 'x' }],
      [rRefill, 'PUT', P(oid)],
      [rResettle, 'POST', P(oid)],
      [rAS, 'GET', {}],
      [rASOne, 'PATCH', P(1), { action: 'REJECT', note: 'x' }],
      [rRedeem, 'GET', {}],
      [rUsers, 'GET', {}],
      [rUser, 'PUT', P(w.users.luluBuyer1.id), { nickname: 'x' }],
      [rUserDetail, 'GET', P(w.users.luluBuyer1.id)],
      [rUserSite, 'PATCH', { id: String(w.users.luluBuyer1.id), tenantId: String(w.lulu.id) }, { unblock: true }],
      [rCards, 'GET', {}],
      [rCardBatch, 'POST', {}, { action: 'SET_PRICE', ids: [1], soldPrice: 1 }],
      [rCardExport, 'GET', {}],
      [rInvoices, 'GET', {}],
      [rInvoice, 'PATCH', P(1), { status: 'CANNOT' }],
      [rInvExport, 'GET', {}],
      [rByOrder, 'PUT', { externalOrderId: '1' }, { status: 'CANNOT' }],
      [rReceipts, 'GET', {}],
      [rReceipt, 'DELETE', P(1)],
      [rExt, 'GET', {}],
      [rStats, 'GET', {}],
      [rAnaOrders, 'GET', {}],
      [rAnaCards, 'GET', {}],
      [rProduct, 'PUT', P(w.products.sms), { status: 0 }],
      [rVmq, 'GET', {}],
      [rVmq, 'POST', {}, { id: 1 }],
    ]
    const bad: string[] = []
    for (const [mod, m, params, body] of matrix) {
      const r = await call(mod, m, onLulu, { params, body })
      if (r.status !== 404) bad.push(`${m} ${Object.keys(mod).join('/')}#${JSON.stringify(params)} → ${r.status}`)
    }
    check(`渠道 Host（SA 持渠道 token）上 ${matrix.length} 个超管接口一律 404`, bad.length === 0, bad.join('；'))
    const bad2: string[] = []
    for (const [mod, m, params, body] of matrix) {
      const r = await call(mod, m, { host: w.lulu.host, token: signTestToken(w.users.sa, 'main') }, { params, body })
      if (r.status !== 404) bad2.push(`${m} ${JSON.stringify(params)} → ${r.status}`)
    }
    check('渠道 Host 上持主站 token 的 SA 同样 404（不暴露是管理员）', bad2.length === 0, bad2.join('；'))
    const fTok = issueActionToken('invoice', 'finance', 3600_000)
    const qTok = issueQuickReplyToken(w.orders.luluAuto.id)
    check('渠道 Host GET /api/finance/invoices/[token] → 404', (await call(rFinance, 'GET', LULU, { params: { token: fTok } })).status === 404)
    check('渠道 Host POST /api/finance/invoices/[token] → 404', (await call(rFinance, 'POST', LULU, { params: { token: fTok }, body: { invoiceId: 1 } })).status === 404)
    check('渠道 Host GET /api/quick-reply/[token] → 404', (await call(rQuick, 'GET', LULU, { params: { token: qTok } })).status === 404)
    const msgBefore = await prisma.orderMessage.count({ where: { orderId: w.orders.luluAuto.id } })
    check('渠道 Host POST /api/quick-reply/[token] → 404', (await call(rQuick, 'POST', LULU, { params: { token: qTok }, body: { content: 'x' } })).status === 404)
    check('……且没有写入留言', (await prisma.orderMessage.count({ where: { orderId: w.orders.luluAuto.id } })) === msgBefore)
    const fl = await withRequest({ host: w.lulu.host }, () => catchNext(() => FinanceLayout({ children: null }) as Promise<unknown>))
    const rl = await withRequest({ host: w.lulu.host }, () => catchNext(() => ReplyLayout({ children: null }) as Promise<unknown>))
    check('渠道 Host 打开 /finance/[token] 页面 → notFound', fl.kind === 'notFound', fl.kind)
    check('渠道 Host 打开 /reply/[token] 页面 → notFound', rl.kind === 'notFound', rl.kind)
    const fm = await withRequest({ host: 'bigolab.com' }, () => catchNext(() => FinanceLayout({ children: null }) as Promise<unknown>))
    // 主站：守卫放行（layout 返回片段；tsx 下 JSX 运行时可能缺 React 全局，只要不是 notFound 就说明守卫放行了）
    check('主站打开 /finance/[token] 守卫放行（不 404）', fm.kind !== 'notFound', fm.kind === 'error' ? String((fm as { error: unknown }).error) : fm.kind)
    // 非管理员
    check('主站未登录改订单 403', (await put(w.orders.luluAuto.id, { deliveryInfo: 'x' }, { ...MAIN, token: null } as never)).status === 403)
    check('主站普通买家看售后列表 403', (await call(rAS, 'GET', { ...MAIN, token: w.token(w.users.crossBuyer) })).status === 403)
  }

  // =========================================================================
  section('M7 休眠期：主站订单保存照旧（refund / shortBearer 被忽略；不写审计与分录）')
  // =========================================================================
  {
    setChannelsMode('dormant')
    invalidateStorefrontCache()
    const mo = await mkOrder(L, { tenantId: 1, user: w.users.crossBuyer, productId: w.products.manual, listingId: null, unpaid: true })
    const auditBefore = await prisma.auditEvent.count()
    const r1 = await put(mo.id, { deliveryInfo: 'W4 主站交付信息', refund: { refundGoodsCents: 1, refundTaxCents: 0, bearer: 'CHANNEL', requestId: rid('m'), expectedVersion: 0 } })
    check('休眠期主站单改交付信息 200（refund 被忽略）', r1.status === 200, r1.text)
    const r2 = await put(mo.id, { deliveryStatus: 'DELIVERED' })
    const o2 = await ord(mo.id)
    check('主站单标已交付自动记已付（实收不填也可以）', r2.status === 200 && o2.payStatus === 'PAID' && o2.paidAt != null, r2.text)
    check('主站单：不填实收 → 不补建 Payment（与原来一致）', (await prisma.payment.count({ where: { orderId: mo.id } })) === 0)
    check('主站单：无分录、快照列为空、settleState 为空', (await prisma.tenantLedgerEntry.count({ where: { orderId: mo.id } })) === 0 && o2.settleState == null && o2.supplyCents == null)
    check('主站单保存不写审计', (await prisma.auditEvent.count()) === auditBefore)
    const mo2 = await mkOrder(L, { tenantId: 1, user: w.users.crossBuyer, productId: w.products.manual, listingId: null, unpaid: true })
    const r3 = await put(mo2.id, { deliveryStatus: 'DELIVERED', receivedCents: 14000 })
    check('主站单标已付选填实收 → 补建 Payment（金额 = 实收）', r3.status === 200 && Number((await prisma.payment.findFirst({ where: { orderId: mo2.id } }))?.amount) === 140, r3.text)
    // 并发保护：带旧的 updatedAt → 409（设计 4.10 ⑤）
    const mo3 = await mkOrder(L, { tenantId: 1, user: w.users.crossBuyer, productId: w.products.manual, listingId: null, unpaid: true })
    const stale = (await ord(mo3.id)).updatedAt.toISOString()
    await sleep(15)
    await prisma.order.update({ where: { id: mo3.id }, data: { deliveryInfo: '别人先保存了' } })
    const r4 = await put(mo3.id, { deliveryInfo: '我后保存', expectedUpdatedAt: stale })
    check('两人同时编辑：后保存的带旧 updatedAt → 409', r4.status === 409 && (await ord(mo3.id)).deliveryInfo === '别人先保存了', r4.text)
    const r5 = await put(mo3.id, { deliveryInfo: '刷新后保存', expectedUpdatedAt: (await ord(mo3.id)).updatedAt.toISOString() })
    check('刷新后（新 updatedAt）保存 200', r5.status === 200, r5.text)
    // 过期弹窗「取消 / 标已付」：409 在作废收款单之前返回，买家还开着的收银台不受影响
    const mo4 = await mkOrder(L, { tenantId: 1, user: w.users.crossBuyer, productId: w.products.manual, listingId: null, unpaid: true })
    const stale4 = (await ord(mo4.id)).updatedAt.toISOString()
    await sleep(15)
    await prisma.order.update({ where: { id: mo4.id }, data: { remark: '别人先改了备注' } })
    const pv4 = await prisma.vmqOrder
      .create({ data: { orderId: `ITV4S${RUN}`.slice(0, 32), bizType: 'order', bizId: mo4.id, outTradeNo: `ITV4S${RUN}`.slice(0, 32), type: 2, price: new Prisma.Decimal('140.00'), reallyPrice: new Prisma.Decimal('140.02'), state: 0 } })
      .catch((e) => {
        console.log('    （收款单夹具建不出来，跳过：', (e as Error).message.split('\n').slice(-1)[0], '）')
        return null
      })
    if (pv4) {
      const rc = await put(mo4.id, { deliveryStatus: 'CANCELLED', expectedUpdatedAt: stale4 })
      const rp = await put(mo4.id, { payStatus: 'PAID', expectedUpdatedAt: stale4 })
      const v4 = await prisma.vmqOrder.findUniqueOrThrow({ where: { id: pv4.id } })
      const o4 = await ord(mo4.id)
      check('过期弹窗取消 / 标已付 → 409，待支付收款单仍有效（state=0）、订单未变', rc.status === 409 && rp.status === 409 && v4.state === 0 && o4.payStatus === 'UNPAID' && o4.deliveryStatus !== 'CANCELLED', `${rc.status} ${rp.status} state=${v4.state}`)
      await prisma.vmqOrder.delete({ where: { id: pv4.id } })
    }
    // 主站单改价仍可用
    const r6 = await put(mo3.id, { amount: 99 })
    check('主站待支付单改价 200', r6.status === 200 && Number((await ord(mo3.id)).amount) === 99, r6.text)
    setChannelsMode('observe')
    invalidateStorefrontCache()
  }

  // =========================================================================
  section('W4-1 / W4-4 渠道单的禁止项')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    const r1 = await put(o.id, { deliveryStatus: 'CANCELLED' })
    check('W4-1 已付渠道单取消不带 refund → 400 REFUND_REQUIRED', r1.status === 400 && r1.json?.code === 'REFUND_REQUIRED', r1.text)
    const r1b = await put(o.id, { payStatus: 'REFUNDED' })
    check('W4-1 已付渠道单标已退款不带 refund → 400', r1b.status === 400, r1b.text)
    const r2 = await put(o.id, { payStatus: 'UNPAID' })
    check('W4-4 已付渠道单改回 UNPAID → 400', r2.status === 400 && (await ord(o.id)).payStatus === 'PAID', r2.text)
    // RELEASED 渠道单撤回交付
    const rel = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, release: true })
    check('夹具：订单已解冻 RELEASED', (await ord(rel.id)).settleState === 'RELEASED')
    const r3 = await put(rel.id, { deliveryStatus: 'PROCESSING' })
    check('W4-4 RELEASED 渠道单撤回交付 → 400', r3.status === 400 && (await ord(rel.id)).deliveryStatus === 'DELIVERED', r3.text)
    // 已取消渠道单恢复（未付取消）
    const un = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, unpaid: true })
    const c = await put(un.id, { deliveryStatus: 'CANCELLED' })
    check('未付渠道单取消 200，写审计 order.cancel', c.status === 200 && (await ord(un.id)).deliveryStatus === 'CANCELLED' && (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'order.cancel', targetId: un.orderNo } })) === 1, c.text)
    const r4 = await put(un.id, { deliveryStatus: 'PROCESSING' })
    check('W4-4 已取消渠道单恢复 → 400', r4.status === 400 && (await ord(un.id)).deliveryStatus === 'CANCELLED', r4.text)
    // 已退款渠道单标已交付（会自动翻回 PAID）
    const rf = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, delivered: false })
    const ov = (await ord(rf.id)).settleVersion
    const full = await put(rf.id, { refund: { refundGoodsCents: 14000, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid('rf'), expectedVersion: ov, fullStatus: 'REFUNDED' } })
    check('夹具：全额退款 → REFUNDED', full.status === 200 && (await ord(rf.id)).payStatus === 'REFUNDED', full.text)
    {
      // 终审第 2 轮：站长直接退款（没有售后申请）也要通知渠道；审计给渠道可见的 publicDiff（设计 5.8）
      const ns = await prisma.tenantNotice.findMany({ where: { tenantId: w.lulu.id, kind: 'ORDER_REFUNDED', refKey: rf.orderNo } })
      check('无售后申请的直接退款 → 渠道收到 ORDER_REFUNDED 一条（订单号、金额、承担方）', ns.length === 1 && ns[0].refType === 'order' && /退货款 ¥140\.00/.test(ns[0].body ?? '') && /按比例分担/.test(ns[0].body ?? '') && !/@/.test(`${ns[0].title}${ns[0].body}`), JSON.stringify(ns))
      const au = await prisma.auditEvent.findFirst({ where: { tenantId: w.lulu.id, action: 'order.refund', targetId: rf.orderNo } })
      check('order.refund 的 publicDiff 只含 退货款 / 退税费 / 件数 / 承担方 / 损失', JSON.stringify(au?.publicDiff, Object.keys((au?.publicDiff ?? {}) as object).sort()) === JSON.stringify({ bearer: 'PROPORTIONAL', lossCents: 0, refundGoodsCents: 14000, refundQty: null, refundTaxCents: 0 }) /* MySQL JSON 列会重排键序，按键名排序后比 */, JSON.stringify(au?.publicDiff))
    }
    const r5 = await put(rf.id, { deliveryStatus: 'DELIVERED', receivedCents: 14000 })
    check('W4-4 已退款渠道单标已交付（会翻回已付）→ 400', r5.status === 400 && (await ord(rf.id)).payStatus === 'REFUNDED', r5.text)
    const r6 = await put(rf.id, { payStatus: 'PAID' })
    check('W4-4 已退款渠道单恢复已付 → 400', r6.status === 400, r6.text)
  }

  // =========================================================================
  section('W4-2 退款弹窗：同一事务 + 并发 409')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, release: true })
    const as = await prisma.tenantAfterSale.create({
      data: { requestNo: `AS${RUN}`.toUpperCase().slice(0, 24), tenantId: w.lulu.id, orderId: o.id, kind: 'REFUND', activeKey: `o:${o.id}:REFUND`, reason: 'itest 退款申请', suggestedBearer: 'CHANNEL', suggestedGoodsCents: 14000 },
    })
    const v0 = (await ord(o.id)).settleVersion
    // 预览：不落库
    const pv = await put(o.id, { refund: { refundGoodsCents: 14000, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid('pv'), expectedVersion: v0, preview: true } })
    check('预览 200、返回应退现金，不落库', pv.status === 200 && pv.json?.data?.preview?.cashRefundCents === 14000 && (await ord(o.id)).settleVersion === v0, pv.text)
    const body = (tag: string) => ({ deliveryStatus: 'CANCELLED', refund: { refundGoodsCents: 14000, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid(tag), expectedVersion: v0, fullStatus: 'CANCELLED', note: '缺货退款' } })
    const [a, b] = await Promise.all([put(o.id, body('a')), put(o.id, body('b'))])
    const codes = [a.status, b.status].sort()
    check('两个管理员同时保存：一个 200、一个 409', codes[0] === 200 && codes[1] === 409, `${a.status} ${a.text} | ${b.status} ${b.text}`)
    const after = await ord(o.id)
    check('订单全额取消、settleVersion 只 +1、settleState = REVERSED', after.deliveryStatus === 'CANCELLED' && after.settleVersion === v0 + 1 && after.settleState === 'REVERSED', `${after.deliveryStatus} v${after.settleVersion} ${after.settleState}`)
    check('冲销分录写入（rev:{oid}:v{n}），货款组剩余归零', (await prisma.tenantLedgerEntry.count({ where: { orderId: o.id, eventKey: `rev:${o.id}:v${v0 + 1}` } })) > 0 && (await compSum(o.id, 'SALE')) === 0, String(await compSum(o.id, 'SALE')))
    const asAfter = await prisma.tenantAfterSale.findUniqueOrThrow({ where: { id: as.id } })
    check('售后申请同一事务结案 DONE、activeKey 清空、退款结果列写入', asAfter.status === 'DONE' && asAfter.activeKey == null && asAfter.refundGoodsCents === 14000 && asAfter.bearer === 'PROPORTIONAL')
    check('审计 order.refund 与 aftersale.handle 各一条', (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'order.refund', targetId: o.orderNo } })) === 1 && (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'aftersale.handle', targetId: as.requestNo } })) === 1)
    check('渠道收到 AFTER_SALE_RESULT 通知', (await prisma.tenantNotice.count({ where: { tenantId: w.lulu.id, kind: 'AFTER_SALE_RESULT', refKey: as.requestNo } })) === 1)
    check('并发两次保存只成一次 → ORDER_REFUNDED 恰好一条（与售后结果通知并存）', (await prisma.tenantNotice.count({ where: { tenantId: w.lulu.id, kind: 'ORDER_REFUNDED', refKey: o.orderNo } })) === 1)
    // 超额退款
    const o2 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    const over = await put(o2.id, { refund: { refundGoodsCents: 14001, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid('ov'), expectedVersion: (await ord(o2.id)).settleVersion } })
    check('超额退款 → 400 OVER_REFUND', over.status === 400 && over.json?.code === 'OVER_REFUND', over.text)
    const empty = await put(o2.id, { refund: { refundGoodsCents: 0, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid('em'), expectedVersion: (await ord(o2.id)).settleVersion } })
    check('退款金额为 0 → 400 EMPTY', empty.status === 400 && empty.json?.code === 'EMPTY', empty.text)
    const notFull = await put(o2.id, { deliveryStatus: 'CANCELLED', refund: { refundGoodsCents: 100, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid('nf'), expectedVersion: (await ord(o2.id)).settleVersion, fullStatus: 'CANCELLED' } })
    check('选了「取消订单」但没退满 → 400 NOT_FULL', notFull.status === 400 && notFull.json?.code === 'NOT_FULL', notFull.text)
    const staleV = await put(o2.id, { refund: { refundGoodsCents: 100, refundTaxCents: 0, bearer: 'PROPORTIONAL', requestId: rid('sv'), expectedVersion: (await ord(o2.id)).settleVersion + 5 } })
    check('expectedVersion 过期 → 409', staleV.status === 409, staleV.text)
    check('上述失败都没有写分录', (await prisma.tenantLedgerEntry.count({ where: { orderId: o2.id, eventKey: { startsWith: 'rev:' } } })) === 0)
  }

  // =========================================================================
  section('W4-3 取消未付渠道单时恰好到账 → 409，无写入')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, unpaid: true })
    let putRes: Awaited<ReturnType<typeof put>> | null = null
    await prisma.$transaction(
      async (tx) => {
        // 模拟到账事务：先持有订单行锁并翻 PAID，后台的取消请求读到旧值（UNPAID）后在 FOR UPDATE 上等待
        await tx.order.update({ where: { id: o.id }, data: { payStatus: 'PAID', paidAt: new Date() } })
        const p = put(o.id, { deliveryStatus: 'CANCELLED' }).then((r) => (putRes = r))
        await sleep(1500)
        void p
      },
      { timeout: 20_000 },
    )
    for (let i = 0; i < 100 && !putRes; i++) await sleep(100)
    const r = putRes as Awaited<ReturnType<typeof put>> | null
    const after = await ord(o.id)
    check('409「状态已变化」', r?.status === 409 && /状态已变化/.test(r?.json?.error || ''), r?.text)
    check('无写入：订单仍是 PAID、未取消、无审计', after.payStatus === 'PAID' && after.deliveryStatus !== 'CANCELLED' && (await prisma.auditEvent.count({ where: { targetId: o.orderNo, action: 'order.cancel' } })) === 0)
  }

  // =========================================================================
  section('W4-5 渠道单改价')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, unpaid: true })
    const r1 = await put(o.id, { amount: 109.99 })
    check('改价低于进货款 110 → 400，金额不变', r1.status === 400 && Number((await ord(o.id)).amount) === 140, r1.text)
    const r2 = await put(o.id, { amount: 120 })
    const a2 = await ord(o.id)
    check('合规改价 200，进货款 / 费率快照不变', r2.status === 200 && Number(a2.amount) === 120 && a2.supplyCents === 11000 && a2.feeRateBp === 150, r2.text)
    check('改价写审计 order.price（前后值）', (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'order.price', targetId: o.orderNo } })) === 1)
    // 改价与到账并发：订单已计提（settleState 非空）→ CAS 失败整单拒绝
    await prisma.order.update({ where: { id: o.id }, data: { settleState: 'ACCRUED' } })
    const r3 = await put(o.id, { amount: 130, deliveryInfo: '不应保存' })
    const a3 = await ord(o.id)
    check('CAS 失败（settleState 非空）→ 409，整单拒绝（其他字段也不保存）', r3.status === 409 && Number(a3.amount) === 120 && a3.deliveryInfo !== '不应保存', r3.text)
    await prisma.order.update({ where: { id: o.id }, data: { settleState: null } })
  }

  // =========================================================================
  section('W4-6 标已付：实收与少付')
  // =========================================================================
  {
    const o1 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, unpaid: true })
    const r1 = await put(o1.id, { deliveryStatus: 'DELIVERED' })
    check('渠道单标已付不填实收 → 400 RECEIVED_REQUIRED', r1.status === 400 && r1.json?.code === 'RECEIVED_REQUIRED' && (await ord(o1.id)).payStatus === 'UNPAID', r1.text)
    const r2 = await put(o1.id, { deliveryStatus: 'DELIVERED', receivedCents: 13500 })
    check('实收 < 应收未选承担方 → 400 SHORT_BEARER_REQUIRED', r2.status === 400 && r2.json?.code === 'SHORT_BEARER_REQUIRED', r2.text)
    const mailsBefore = sentMails.length
    const r3 = await put(o1.id, { deliveryStatus: 'DELIVERED', receivedCents: 13500, shortBearer: 'CHANNEL' })
    const a3 = await ord(o1.id)
    check('CHANNEL 承担：200，已付已交付、ACCRUED', r3.status === 200 && a3.payStatus === 'PAID' && a3.deliveryStatus === 'DELIVERED' && a3.settleState === 'ACCRUED', r3.text)
    check('shortCents = 500、shortChargedCents = 500', a3.shortCents === 500 && a3.shortChargedCents === 500, `${a3.shortCents}/${a3.shortChargedCents}`)
    check('写 short:{oid} 分录，SHORT 合计 −500', (await prisma.tenantLedgerEntry.count({ where: { orderId: o1.id, eventKey: `short:${o1.id}` } })) > 0 && (await compSum(o1.id, 'SHORT')) === -500)
    check('Payment 补建（金额 = 实收 135.00）', Number((await prisma.payment.findFirst({ where: { orderId: o1.id } }))?.amount) === 135)
    check('渠道销量 +1、审计 order.mark_paid', (await prisma.auditEvent.count({ where: { action: 'order.mark_paid', targetId: o1.orderNo } })) === 1)
    // W4-12 已交付邮件：渠道单 → 渠道 origin
    const dm = sentMails.slice(mailsBefore).find((m) => m.to === buyer.email)
    check('W4-12 渠道单「已交付」邮件链接是渠道 origin，不含主站域名', !!dm && dm.html.includes(w.lulu.origin) && !dm.html.includes('https://bigolab.com'), dm ? dm.html.slice(0, 200) : '没有截获到邮件')

    // PLATFORM 承担的开票单：分成按实收税费计（A=14000、T=840、实收 14440 → x=400、T_actual=440 → 280×440/840 = 147）
    const o2 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, unpaid: true, invoiceTaxCents: 840 })
    const r4 = await put(o2.id, { deliveryStatus: 'DELIVERED', receivedCents: 14440, shortBearer: 'PLATFORM' })
    const a4 = await ord(o2.id)
    check('PLATFORM 承担：shortCents = 400、shortChargedCents = 0、无 SHORT 分录', r4.status === 200 && a4.shortCents === 400 && a4.shortChargedCents === 0 && (await compSum(o2.id, 'SHORT')) === 0, r4.text)
    check('发票分成按实收税费计 = 147 分', (await compSum(o2.id, 'INVOICE_SHARE')) === 147, String(await compSum(o2.id, 'INVOICE_SHARE')))
    // 足额实收：不写少付
    const o3 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, unpaid: true })
    const r5 = await put(o3.id, { deliveryStatus: 'DELIVERED', receivedCents: 14000 })
    const a5 = await ord(o3.id)
    check('足额实收：不要求承担方，少付字段为空', r5.status === 200 && (a5.shortCents ?? 0) === 0 && a5.settleState === 'ACCRUED', r5.text)
  }

  // =========================================================================
  section('W4-6a 接码类 CHANNEL 退款：默认 loss = 进货价分摊，不泄露接码成本')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.sms, listingId: LS, priceCents: 1500, supplyUnitCents: 1000 })
    await prisma.smsActivation.create({
      data: { orderId: o.id, activationId: `IT4-ACT-${RUN}`, phone: '+1 555 0101', service: 'OpenAI', country: 'US', status: 'CODE', code: '123456', cost: new Prisma.Decimal(MARK.smsCost), raw: 'itest', numberAt: new Date(), codeAt: new Date(), expireAt: new Date(Date.now() + 600_000) },
    })
    const v = (await ord(o.id)).settleVersion
    const pv = await put(o.id, { refund: { refundGoodsCents: 1500, refundTaxCents: 0, refundQty: 1, bearer: 'CHANNEL', requestId: rid('sp'), expectedVersion: v, preview: true } })
    check('预览默认 loss = 1000（本次冲回的进货款 × 已交付占比），不是接码成本 317', pv.json?.data?.preview?.lossDefaultCents === 1000, pv.text)
    // 未交付的件：默认 0，手填只能下调——填进货款也拒绝（原来只校验「≤ 本次冲回的进货款」，会被接受）
    const ou = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, delivered: false })
    const vu = (await ord(ou.id)).settleVersion
    const pvu = await put(ou.id, { refund: { refundGoodsCents: 14000, refundTaxCents: 0, refundQty: 1, bearer: 'CHANNEL', requestId: rid('up'), expectedVersion: vu, preview: true } })
    check('未交付件 CHANNEL 预览：默认 loss = 0、本次冲回进货款 = 11000', pvu.json?.data?.preview?.lossDefaultCents === 0 && pvu.json?.data?.preview?.reversedPurchaseCents === 11000, pvu.text)
    const hi = await put(ou.id, { refund: { refundGoodsCents: 14000, refundTaxCents: 0, refundQty: 1, bearer: 'CHANNEL', lossCents: 11000, requestId: rid('uh'), expectedVersion: vu, fullStatus: 'REFUNDED' } })
    check('手填 loss 高于默认值 → 400 LOSS_ABOVE_DEFAULT，未写分录、版本不变', hi.status === 400 && hi.json?.code === 'LOSS_ABOVE_DEFAULT' && (await ord(ou.id)).settleVersion === vu && (await compSum(ou.id, 'LOSS')) === 0, hi.text)
    const lo = await put(o.id, { refund: { refundGoodsCents: 1500, refundTaxCents: 0, refundQty: 1, bearer: 'CHANNEL', lossCents: 1001, requestId: rid('sh'), expectedVersion: v, preview: true } })
    check('已交付件手填 1001 > 默认 1000 → 400', lo.status === 400 && lo.json?.code === 'LOSS_ABOVE_DEFAULT', lo.text)
    const dt = await call(rDetail, 'GET', sa, { params: P(o.id) })
    check('详情里「真实成本」只作参考显示（3.17），弹窗不预填', dt.json?.data?.channel?.refundContext?.costRefYuan === 3.17, JSON.stringify(dt.json?.data?.channel?.refundContext))
    const r = await put(o.id, { refund: { refundGoodsCents: 1500, refundTaxCents: 0, refundQty: 1, bearer: 'CHANNEL', requestId: rid('sr'), expectedVersion: v, fullStatus: 'REFUNDED' } })
    check('CHANNEL 退款保存 200，LOSS 分录 = −1000', r.status === 200 && (await compSum(o.id, 'LOSS')) === -1000, `${r.text} LOSS=${await compSum(o.id, 'LOSS')}`)
    const loss = await put(o.id, { refund: { refundGoodsCents: 0, refundTaxCents: 0, bearer: 'CHANNEL', requestId: rid('sx'), expectedVersion: (await ord(o.id)).settleVersion } })
    check('（退满后再退 0 → EMPTY 400）', loss.status === 400)
    {
      const n = await prisma.tenantNotice.findMany({ where: { tenantId: w.lulu.id, kind: 'ORDER_REFUNDED', refKey: o.orderNo } })
      check('CHANNEL 退款通知：写明平台损失 ¥10.00（进货价分摊，不是接码成本）；预览不发通知', n.length === 1 && /平台损失 ¥10\.00/.test(n[0].body ?? '') && !(n[0].body ?? '').includes('3.17'), JSON.stringify(n))
    }
    const pl = await call(pLedger, 'GET', luluOwner, { path: '/api/partner/finance/ledger', query: { pageSize: 100 } })
    const pd = await call(pOrder, 'GET', luluOwner, { path: `/api/partner/orders/${o.orderNo}`, params: { orderNo: o.orderNo } })
    const leak = (t: string) => t.includes(MARK.smsCost) || /"amountCents":-?317\b/.test(t) || /"lossCents":-?317\b/.test(t)
    check('渠道流水里没有接码成本特征值', pl.status === 200 && !leak(pl.text), `${pl.status}`)
    check('渠道订单详情里没有接码成本特征值', pd.status === 200 && !leak(pd.text), `${pd.status}`)
  }

  // =========================================================================
  section('W4-6b 按件退 1 件后补发卡密：不为已退的件补卡')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.auto, listingId: LA, qty: 2, delivered: false })
    const { encryptCardContent, cardContentHash } = await import('../../src/lib/cardkey')
    const mkCard = (plain: string, orderId: number | null) =>
      prisma.cardKey.create({
        data: { productId: w.products.auto, content: encryptCardContent(plain), contentHash: cardContentHash(plain), status: orderId ? 'USED' : 'UNUSED', orderId, usedAt: orderId ? new Date() : null, cost: new Prisma.Decimal('100.00'), soldPrice: orderId ? new Prisma.Decimal('110.00') : null, batch: `IT-${RUN}` },
      })
    await mkCard(`IT4-SOLD-${RUN}`, o.id)
    await mkCard(`IT4-SPARE1-${RUN}`, null)
    await mkCard(`IT4-SPARE2-${RUN}`, null)
    const unusedBefore = await prisma.cardKey.count({ where: { productId: w.products.auto, status: 'UNUSED' } })
    const r = await put(o.id, { refund: { refundGoodsCents: 14000, refundTaxCents: 0, refundQty: 1, bearer: 'PROPORTIONAL', requestId: rid('pq'), expectedVersion: (await ord(o.id)).settleVersion } })
    const a = await ord(o.id)
    check('按件退 1 件：refundedQty = 1；剩余 1 件已交付 → 同事务置 DELIVERED', r.status === 200 && a.refundedQty === 1 && a.deliveryStatus === 'DELIVERED', `${r.text} ${a.refundedQty} ${a.deliveryStatus}`)
    const rf = await call(rRefill, 'PUT', sa, { params: P(o.id) })
    check('补发卡密：应发 = 1，新增 0 张', rf.status === 200 && rf.json?.data?.due === 1 && rf.json?.data?.added === 0, rf.text)
    check('库存卡一张没少', (await prisma.cardKey.count({ where: { productId: w.products.auto, status: 'UNUSED' } })) === unusedBefore)
    // 超管对渠道单的补发 / 改交付要留痕（设计 6.2「补发 / 换卡 / 重新交付 ✔审」、13.2；终审隔离 #2）
    const ra = await prisma.auditEvent.findFirst({ where: { tenantId: w.lulu.id, action: 'order.refill', targetId: o.orderNo }, orderBy: { id: 'desc' } })
    check('渠道单补发写审计 order.refill（PLATFORM，publicDiff 只有 added）', ra?.actorKind === 'PLATFORM' && JSON.stringify(ra?.publicDiff) === JSON.stringify({ added: 0 }) && (ra?.diff as any)?.due === 1, JSON.stringify(ra))
    const secret = `W4-交付内容-${RUN}`
    const rd = await put(o.id, { deliveryInfo: secret })
    const da = await prisma.auditEvent.findFirst({ where: { tenantId: w.lulu.id, action: 'order.deliver', targetId: o.orderNo }, orderBy: { id: 'desc' } })
    check('渠道单改交付内容写审计 order.deliver：只记「内容改过」，不写原文', rd.status === 200 && (da?.diff as any)?.deliveryInfoChanged === true && !JSON.stringify(da).includes(secret), `${rd.text} ${JSON.stringify(da)}`)
  }

  // =========================================================================
  section('W4-7 来源站列与筛选：计数与直接 SQL 一致')
  // =========================================================================
  {
    const tl = w.lulu.id
    const ol = await call(rOrders, 'GET', sa, { query: { tenantId: tl, pageSize: 100 } })
    check('订单：tenantId=lulu 的 total = SQL', ol.json?.data?.total === (await prisma.order.count({ where: { tenantId: tl } })), `${ol.json?.data?.total}`)
    check('订单：每行 source.code = lulu，带 buyerRemarkText', (ol.json?.data?.orders ?? ol.json?.data?.list ?? []).every((r: any) => r.source?.tenantId === tl && r.source?.code === w.lulu.code) && (ol.json?.data?.orders ?? ol.json?.data?.list ?? []).some((r: any) => r.buyerRemarkText === 'W4 买家备注'))
    const om = await call(rOrders, 'GET', sa, { query: { tenantId: 1, pageSize: 1 } })
    check('订单：tenantId=1 的 total = SQL', om.json?.data?.total === (await prisma.order.count({ where: { tenantId: 1 } })))
    const oa = await call(rOrders, 'GET', sa, { query: { pageSize: 1 } })
    check('订单：不筛 = 全部（与原来一致）', oa.json?.data?.total === (await prisma.order.count()))
    check('订单：sites 下拉含主站与 lulu', (oa.json?.data?.sites ?? []).some((s: any) => s.tenantId === 1) && (oa.json?.data?.sites ?? []).some((s: any) => s.tenantId === tl))
    check('订单：tenantId=abc → 400', (await call(rOrders, 'GET', sa, { query: { tenantId: 'abc' } })).status === 400)
    // 用户
    const ur = await call(rUsers, 'GET', sa, { query: { regTenant: tl, pageSize: 100 } })
    check('用户：regTenant=lulu total = SQL', ur.json?.data?.total === (await prisma.user.count({ where: { registeredTenantId: tl } })), `${ur.json?.data?.total}`)
    const ut = await call(rUsers, 'GET', sa, { query: { tenantId: tl, pageSize: 1 } })
    check('用户：通用 tenantId 等同 regTenant', ut.json?.data?.total === ur.json?.data?.total)
    const um = await call(rUsers, 'GET', sa, { query: { member: 1, keyword: MAIL_DOMAIN, pageSize: 100 } })
    const memberIds = new Set((um.json?.data?.list ?? []).map((u: any) => u.id))
    check('用户：member=1 只含有效渠道成员', memberIds.has(w.users.luluOwner.id) && memberIds.has(w.users.zzOwner.id) && !memberIds.has(buyer.id))
    const uc = await call(rUsers, 'GET', sa, { query: { crossSite: 1, keyword: MAIL_DOMAIN, pageSize: 100 } })
    const crossIds = new Set((uc.json?.data?.list ?? []).map((u: any) => u.id))
    check('用户：crossSite=1 含在注册站外下过单的（lulu 注册只在主站下单的）', crossIds.has(w.users.luluRegMainOrder.id) && crossIds.has(w.users.crossBuyer.id) && !crossIds.has(w.users.zzBuyer1.id))
    const row = (uc.json?.data?.list ?? []).find((u: any) => u.id === w.users.crossBuyer.id)
    check('用户行：siteOrderCounts 各站订单数徽章', row && row.siteOrderCounts.some((c: any) => c.tenantId === tl) && row.siteOrderCounts.some((c: any) => c.tenantId === 1))
    // 卡密
    const ck = await call(rCards, 'GET', sa, { query: { productId: w.products.auto, tenantId: tl, pageSize: 200 } })
    const luluOrderIds = (await prisma.order.findMany({ where: { tenantId: tl, productId: w.products.auto }, select: { id: true } })).map((o) => o.id)
    const sqlLuluCards = await prisma.cardKey.count({ where: { productId: w.products.auto, orderId: { in: luluOrderIds } } })
    check('卡密：tenantId=lulu 的 total = 售出订单属于 lulu 的卡数', ck.json?.data?.total === sqlLuluCards && sqlLuluCards > 0, `${ck.json?.data?.total} vs ${sqlLuluCards}`)
    check('卡密：来源站 = 售出订单的站', (ck.json?.data?.list ?? []).every((c: any) => c.source?.tenantId === tl && c.source?.kind === 'ORDER'))
    const cs = await call(rCards, 'GET', sa, { query: { productId: w.products.auto, tenantId: 'stock', pageSize: 200 } })
    const sqlStock = await prisma.cardKey.count({ where: { productId: w.products.auto, orderId: null, externalRef: null } })
    check('卡密：stock = 未售，来源显示「库存」', cs.json?.data?.total === sqlStock && (cs.json?.data?.list ?? []).every((c: any) => c.source?.label === '库存'), `${cs.json?.data?.total} vs ${sqlStock}`)
    const c1 = await call(rCards, 'GET', sa, { query: { productId: w.products.auto, tenantId: 1, pageSize: 200 } })
    const sqlMainCards = await prisma.cardKey.count({ where: { productId: w.products.auto, orderId: { not: null }, NOT: { orderId: { in: (await prisma.order.findMany({ where: { tenantId: { gt: 1 } }, select: { id: true } })).map((o) => o.id) } } } })
    check('卡密：tenantId=1 = 主站售出', c1.json?.data?.total === sqlMainCards, `${c1.json?.data?.total} vs ${sqlMainCards}`)
    const soldCard = await prisma.cardKey.findFirstOrThrow({ where: { orderId: w.orders.luluAuto.id } })
    const co = await call(rCardOrder, 'GET', sa, { params: P(soldCard.id) })
    check('卡密去向：带来源站 lulu', co.json?.data?.source?.tenantId === tl, co.text.slice(0, 200))
    // 兑换日志（卡密使用情况面板）
    const rl = await call(rRedeem, 'GET', sa, { query: { tenantId: tl, pageSize: 100 } })
    const sqlRl = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM redeem_logs r LEFT JOIN card_keys c ON c.id = r.card_key_id LEFT JOIN orders o ON o.id = c.order_id WHERE COALESCE(o.tenant_id, 1) = ${tl}`
    check('兑换日志：tenantId=lulu 的 total = SQL，含全字段（ip / requestId / orderRef）', rl.json?.data?.total === Number(sqlRl[0].n) && (rl.json?.data?.rows ?? []).some((x: any) => x.ip === '10.9.8.7' && x.requestId === `IT-REQ-${RUN}` && x.orderNo === w.orders.luluAuto.orderNo), rl.text.slice(0, 300))
    const rlm = await call(rRedeem, 'GET', sa, { query: { tenantId: 1, cardKeyId: soldCard.id } })
    check('兑换日志：tenantId=1 不含渠道卡的日志', rlm.json?.data?.total === 0)
    const rlc = await call(rRedeem, 'GET', sa, { query: { orderId: w.orders.luluAuto.id } })
    check('兑换日志：按订单筛选（订单详情面板）', rlc.json?.data?.total === 1 && rlc.json.data.rows[0].source?.code === w.lulu.code)
    // 发票 / 收据 / 外部订单
    const iv = await call(rInvoices, 'GET', sa, { query: { tenantId: tl, status: 'SUBMITTED', pageSize: 100 } })
    const sqlIv = await prisma.invoice.count({ where: { tenantId: tl, status: 'SUBMITTED' } })
    check('发票：tenantId=lulu & SUBMITTED 的 total = SQL，行 site = lulu', iv.json?.data?.total === sqlIv && (iv.json?.data?.list ?? []).every((r: any) => r.site?.tenantId === tl), `${iv.json?.data?.total} vs ${sqlIv}`)
    const rc = await call(rReceipts, 'GET', sa, { query: { tenantId: tl, pageSize: 100 } })
    check('收据：tenantId=lulu 的 total = SQL，行 site = lulu', rc.json?.data?.total === (await prisma.receipt.count({ where: { tenantId: tl } })) && (rc.json?.data?.list ?? []).every((r: any) => r.site?.tenantId === tl))
    check('收据：按站筛选时统计也只算该站', rc.json?.data?.stats?.buyer === (await prisma.receipt.count({ where: { tenantId: tl, source: 'BUYER' } })))
    const ex = await call(rExt, 'GET', sa, { query: { tenantId: 1, pageSize: 1 } })
    check('外部订单：tenantId=1 的 total = SQL', ex.json?.data?.total === (await prisma.externalOrder.count({ where: { tenantId: 1 } })))
    const ea = await call(rExt, 'GET', sa, { query: { pageSize: 1 } })
    check('外部订单：不筛 = 全部', ea.json?.data?.total === (await prisma.externalOrder.count()))
  }

  // =========================================================================
  section('W4-8 用户站点关系：按站分 tab、操作方、超管推翻、平台备注不外泄')
  // =========================================================================
  {
    const u = w.users.luluBuyer1
    await prisma.tenantCustomer.update({
      where: { tenantId_userId: { tenantId: w.lulu.id, userId: u.id } },
      data: { blockedAt: new Date(), blockedBy: w.users.luluOwner.id, blockedByKind: 'TENANT', blockReason: '渠道拉黑原因' },
    })
    const d = await call(rUserDetail, 'GET', sa, { params: P(u.id) })
    const s = (d.json?.data?.sites ?? []).find((x: any) => x.tenantId === w.lulu.id)
    check('用户详情按站分 tab：有 lulu 一项（订单数 / 客户关系）', s && s.orderCount > 0 && s.customer?.customerNo, d.text.slice(0, 200))
    check('渠道设的拉黑显示操作方「渠道」', s?.customer?.blocked === true && s?.customer?.blockedByLabel === '渠道')
    const ds = await call(rUserDetail, 'GET', sa, { params: P(u.id), query: { site: w.lulu.id } })
    check('site=lulu 时订单块只看该站', (ds.json?.data?.orders?.list ?? []).every((o: any) => o.tenantId === w.lulu.id) && ds.json?.data?.orders?.list?.length > 0)
    const up = await call(rUserSite, 'PATCH', sa, { params: { id: String(u.id), tenantId: String(w.lulu.id) }, body: { unblock: true, platformNote: `PLATFORM-NOTE-${RUN}` } })
    const c = await prisma.tenantCustomer.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: w.lulu.id, userId: u.id } } })
    check('超管推翻渠道拉黑：已解除、平台备注写入', up.status === 200 && c.blockedAt == null && c.platformNote === `PLATFORM-NOTE-${RUN}`, up.text)
    const au = await prisma.auditEvent.findFirst({ where: { tenantId: w.lulu.id, action: 'customer.unblock' }, orderBy: { id: 'desc' } })
    check('审计 actorKind=PLATFORM，publicDiff 只含 { blocked }', au?.actorKind === 'PLATFORM' && JSON.stringify(au?.publicDiff) === JSON.stringify({ blocked: false }), JSON.stringify(au?.publicDiff))
    const bl = await call(rUserSite, 'PATCH', sa, { params: { id: String(u.id), tenantId: String(w.lulu.id) }, body: { block: { reason: `平台拉黑原因-${RUN}` } } })
    const c2 = await prisma.tenantCustomer.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: w.lulu.id, userId: u.id } } })
    check('平台拉黑：blockedByKind=PLATFORM', bl.status === 200 && c2.blockedByKind === 'PLATFORM', bl.text)
    const pc = await call(pCustomer, 'GET', luluOwner, { path: `/api/partner/customers/${c.publicNo}`, params: { customerNo: c.publicNo } })
    check('渠道客户详情 200，且不含平台备注与平台拉黑原因', pc.status === 200 && !pc.text.includes(`PLATFORM-NOTE-${RUN}`) && !pc.text.includes(`平台拉黑原因-${RUN}`), `${pc.status} ${pc.text.slice(0, 200)}`)
    const noteAu = await prisma.auditEvent.findFirst({ where: { action: 'customer.platform_note', targetId: c.publicNo }, orderBy: { id: 'desc' } })
    check('平台备注审计不挂在渠道名下（tenantId=null），渠道 id 只在 diff 里', noteAu != null && noteAu.tenantId == null && (noteAu.diff as any)?.channelTenantId === w.lulu.id, JSON.stringify(noteAu))
    const pa = await call(pAudit, 'GET', luluOwner, { path: '/api/partner/audit', query: { pageSize: 100 } })
    check('渠道操作日志里看不到 customer.platform_note', pa.status === 200 && !pa.text.includes('platform_note'), `${pa.status} ${pa.text.slice(0, 200)}`)
    check('主站（tenantId=1）没有站点客户关系 → 400', (await call(rUserSite, 'PATCH', sa, { params: { id: String(u.id), tenantId: '1' }, body: { unblock: true } })).status === 400)
    check('不是该渠道客户 → 404（不凭空建行）', (await call(rUserSite, 'PATCH', sa, { params: { id: String(w.users.zzBuyer1.id), tenantId: String(w.lulu.id) }, body: { platformNote: 'x' } })).status === 404)
    await call(rUserSite, 'PATCH', sa, { params: { id: String(u.id), tenantId: String(w.lulu.id) }, body: { unblock: true } })
  }

  // =========================================================================
  section('W4-8a 渠道成员提为 ADMIN → 400')
  // =========================================================================
  {
    const r = await call(rUser, 'PUT', sa, { params: P(w.users.luluOwner.id), body: { role: 'ADMIN' } })
    check('400「该用户是渠道成员，请先移出」，角色不变', r.status === 400 && /渠道成员/.test(r.json?.error || '') && (await prisma.user.findUniqueOrThrow({ where: { id: w.users.luluOwner.id } })).role === 'USER', r.text)
    const r2 = await call(rUser, 'PUT', sa, { params: P(w.users.luluOwner.id), body: { nickname: `it-owner-${RUN}` } })
    check('不提权的保存照常 200', r2.status === 200, r2.text)
  }

  // =========================================================================
  section('W4-9 仪表盘与分析按站拆分')
  // =========================================================================
  {
    const st = await call(rStats, 'GET', sa)
    const d = st.json?.data
    const sql = await prisma.$queryRaw<{ s: Prisma.Decimal | null }[]>`SELECT SUM(amount) AS s FROM orders WHERE pay_status = 'PAID' AND delivery_status <> 'CANCELLED'`
    const sqlMain = await prisma.$queryRaw<{ s: Prisma.Decimal | null }[]>`SELECT SUM(amount) AS s FROM orders WHERE pay_status = 'PAID' AND delivery_status <> 'CANCELLED' AND tenant_id = 1`
    const cents = (v: unknown) => Math.round(Number(v ?? 0) * 100)
    check('「全部」营收 = 直接 SQL（已付且未取消）', cents(d?.totalRevenue) === cents(sql[0].s), `${d?.totalRevenue} vs ${sql[0].s}`)
    check('主站销售额 = SQL(tenant_id=1)，主站 + 渠道 = 全部', cents(d?.mainRevenue) === cents(sqlMain[0].s) && cents(d?.mainRevenue) + cents(d?.channelRevenue) === cents(d?.totalRevenue))
    check('revenueBySite 含 lulu 一组', (d?.revenueBySite ?? []).some((s: any) => s.tenantId === w.lulu.id && s.revenue > 0))
    const cancelledPaid = await prisma.order.aggregate({ where: { tenantId: w.lulu.id, payStatus: 'PAID', deliveryStatus: 'CANCELLED' }, _sum: { amount: true } })
    check('已付已取消的渠道单不计入（夹具里存在这种单）', cents(cancelledPaid._sum.amount) > 0 && cents((d?.revenueBySite ?? []).find((s: any) => s.tenantId === w.lulu.id)?.revenue) === cents((await prisma.order.aggregate({ where: { tenantId: w.lulu.id, payStatus: 'PAID', deliveryStatus: { not: 'CANCELLED' } }, _sum: { amount: true } }))._sum.amount))
    check('最近订单带来源站', (d?.recentOrders ?? []).every((o: any) => o.source?.code))
    const today = new Date()
    const from = new Date(today.getTime() - 30 * DAY).toISOString().slice(0, 10)
    const ac = await call(rAnaCards, 'GET', sa, { query: { from, to: today.toISOString().slice(0, 10) } })
    check('卡密分析：bySite 含 lulu（渠道单按进货价口径的收入）', ac.status === 200 && (ac.json?.data?.bySite ?? []).some((s: any) => s.tenantId === w.lulu.id), ac.text.slice(0, 200))
    const ao = await call(rAnaOrders, 'GET', sa, { query: { start: from, end: today.toISOString().slice(0, 10), tenantId: 'x' } })
    check('订单分析：来源站参数非法 → 400', ao.status === 400)
  }

  // =========================================================================
  section('W4-9a 渠道单发票状态与账本联动')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, invoiceTaxCents: 840 })
    check('夹具：开票单计提了发票分成 280', (await compSum(o.id, 'INVOICE_SHARE')) === 280)
    const mkIv = (no: string, status: string, extra: Partial<Prisma.InvoiceUncheckedCreateInput> = {}) =>
      prisma.invoice.create({
        data: {
          invoiceNo: `ITI${no}${RUN}`.toUpperCase().slice(0, 32),
          claudeAccount: buyer.email,
          subscriptionType: 'itest',
          sellingPrice: new Prisma.Decimal('140.00'),
          invoiceAmount: new Prisma.Decimal('148.40'),
          taxFee: new Prisma.Decimal('8.40'),
          title: 'ITEST 抬头',
          email: buyer.email,
          status,
          payStatus: 'PAID',
          paidAt: new Date(),
          tenantId: w.lulu.id,
          shopOrderId: o.id,
          ...extra,
        },
      })
    const iv = await mkIv('A', 'SUBMITTED')
    const r1 = await call(rInvoice, 'PATCH', sa, { params: P(iv.id), body: { status: 'CANNOT' } })
    check('改 CANNOT 不带 taxRefund → 400 TAX_DECISION_REQUIRED，状态不变', r1.status === 400 && r1.json?.code === 'TAX_DECISION_REQUIRED' && (await prisma.invoice.findUniqueOrThrow({ where: { id: iv.id } })).status === 'SUBMITTED', r1.text)
    const g = await call(rInvoice, 'GET', sa, { params: P(iv.id) })
    const ver = g.json?.data?.channelOrder?.settleVersion
    check('单张发票 GET 带渠道单的 settleVersion 与来源站', typeof ver === 'number' && g.json?.data?.site?.tenantId === w.lulu.id, g.text.slice(0, 200))
    const r2 = await call(rInvoice, 'PATCH', sa, { params: P(iv.id), body: { status: 'CANNOT', taxRefund: { refundTaxCents: 840, expectedVersion: ver, requestId: rid('tx') } } })
    const a2 = await ord(o.id)
    check('带退税费 → 200，发票 CANNOT，订单 refundedTaxCents = 840', r2.status === 200 && (await prisma.invoice.findUniqueOrThrow({ where: { id: iv.id } })).status === 'CANNOT' && a2.refundedTaxCents === 840, r2.text)
    check('发票分成冲销到 0', (await compSum(o.id, 'INVOICE_SHARE')) === 0, String(await compSum(o.id, 'INVOICE_SHARE')))
    check('审计 invoice.tax_refund 一条', (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'invoice.tax_refund', targetId: o.orderNo } })) === 1)
    // keep
    const o2 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM, invoiceTaxCents: 840 })
    const iv2 = await mkIv('B', 'ISSUED', { shopOrderId: o2.id, issuedAt: new Date() })
    const r3 = await call(rInvoice, 'PATCH', sa, { params: P(iv2.id), body: { status: 'SUBMITTED' } })
    check('ISSUED 撤回 SUBMITTED 不带 taxRefund → 400', r3.status === 400 && r3.json?.code === 'TAX_DECISION_REQUIRED', r3.text)
    const r4 = await call(rInvoice, 'PATCH', sa, { params: P(iv2.id), body: { status: 'SUBMITTED', taxRefund: { keep: true, reason: '红冲后重开，税费保留' } } })
    check('带 keep → 200，审计 invoice.tax_kept 一条，分成不动', r4.status === 200 && (await prisma.auditEvent.count({ where: { tenantId: w.lulu.id, action: 'invoice.tax_kept', targetId: o2.orderNo } })) === 1 && (await compSum(o2.id, 'INVOICE_SHARE')) === 280, r4.text)
    const r5 = await call(rInvoice, 'PATCH', sa, { params: P(iv2.id), body: { status: 'CANNOT', taxRefund: { refundTaxCents: 841, expectedVersion: (await ord(o2.id)).settleVersion, requestId: rid('ot') } } })
    check('退税费超过已收 → 400，发票状态回滚', r5.status === 400 && (await prisma.invoice.findUniqueOrThrow({ where: { id: iv2.id } })).status === 'SUBMITTED', r5.text)
    const del = await call(rInvoice, 'DELETE', sa, { params: P(iv2.id) })
    check('删除分成已计提的渠道单发票 → 拒绝', del.status === 400 && (await prisma.invoice.count({ where: { id: iv2.id } })) === 1, del.text)
    // by-order 同一口径
    const ext = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(Date.now() + 30 * DAY), subscriptionType: 'itest', claudeAccount: buyer.email, sourceKey: `order:${o2.id}`, shopOrderId: o2.id, tenantId: w.lulu.id, quote: new Prisma.Decimal('140.00') },
    })
    await prisma.invoice.update({ where: { id: iv2.id }, data: { externalOrderId: ext.id } })
    const b1 = await call(rByOrder, 'PUT', sa, { params: { externalOrderId: String(ext.id) }, body: { status: 'CANNOT' } })
    check('by-order 改 CANNOT 不带 taxRefund → 400', b1.status === 400 && b1.json?.code === 'TAX_DECISION_REQUIRED', b1.text)
    const b2 = await call(rByOrder, 'DELETE', sa, { params: { externalOrderId: String(ext.id) } })
    check('by-order DELETE：分成已计提且未退税费 → 400', b2.status === 400 && (await prisma.invoice.count({ where: { id: iv2.id } })) === 1, b2.text)
    // by-order 凭空建票：tenantId / shopOrderId 按外部订单行指回的站内订单
    const o3 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    const ext3 = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(Date.now() + 30 * DAY), subscriptionType: 'itest', claudeAccount: buyer.email, sourceKey: `order:${o3.id}`, shopOrderId: o3.id, tenantId: w.lulu.id, quote: new Prisma.Decimal('140.00') },
    })
    const b3 = await call(rByOrder, 'PUT', sa, { params: { externalOrderId: String(ext3.id) }, body: { status: 'SUBMITTED' } })
    const iv3 = await prisma.invoice.findUnique({ where: { externalOrderId: ext3.id } })
    check('by-order 凭空建票写 tenantId=lulu、shopOrderId', b3.status === 200 && iv3?.tenantId === w.lulu.id && iv3?.shopOrderId === o3.id, b3.text)
    // 跨站合并：外部订单行在主站、指回的却是渠道单 → 409
    const o4 = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    const ext4 = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(Date.now() + 30 * DAY), subscriptionType: 'itest', claudeAccount: buyer.email, sourceKey: `itest-x-${RUN}`, shopOrderId: o4.id, tenantId: 1, quote: new Prisma.Decimal('140.00') },
    })
    const b4 = await call(rByOrder, 'PUT', sa, { params: { externalOrderId: String(ext4.id) }, body: { status: 'SUBMITTED' } })
    check('by-order 跨站合并 → 409，不建票', b4.status === 409 && (await prisma.invoice.count({ where: { externalOrderId: ext4.id } })) === 0, b4.text)
  }

  // =========================================================================
  section('W4-12 财务台标已开具：「发票已开」邮件用渠道 origin；待开列表带来源站')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    const iv = await prisma.invoice.create({
      data: {
        invoiceNo: `ITIF${RUN}`.toUpperCase().slice(0, 32),
        claudeAccount: buyer.email,
        subscriptionType: 'itest',
        sellingPrice: new Prisma.Decimal('140.00'),
        invoiceAmount: new Prisma.Decimal('148.40'),
        taxFee: new Prisma.Decimal('8.40'),
        title: 'ITEST 抬头',
        email: buyer.email,
        status: 'SUBMITTED',
        payStatus: 'PAID',
        paidAt: new Date(),
        tenantId: w.lulu.id,
        shopOrderId: o.id,
      },
    })
    const tok = issueActionToken('invoice', 'finance', 3600_000)
    const g = await call(rFinance, 'GET', MAIN, { params: { token: tok } })
    const row = (g.json?.data?.pending ?? []).find((x: any) => x.id === iv.id)
    check('主站财务台 GET 200，待开行带来源站 lulu、不含 tenantId 原始列', g.status === 200 && row?.source?.code === w.lulu.code && !('tenantId' in (row ?? {})), g.text.slice(0, 200))
    const gl = await call(rFinance, 'GET', MAIN, { params: { token: tok }, query: { tenantId: w.lulu.id } })
    const g1 = await call(rFinance, 'GET', MAIN, { params: { token: tok }, query: { tenantId: 1 } })
    const gb = await call(rFinance, 'GET', MAIN, { params: { token: tok }, query: { tenantId: 'x' } })
    const listed = (r: typeof g) => (r.json?.data?.pending ?? []) as any[]
    check(
      '财务台 ?tenantId= 筛选：lulu 只含 lulu 行且有本票；1 不含本票；非法值 400',
      gl.status === 200 && listed(gl).some((x) => x.id === iv.id) && listed(gl).every((x) => x.source?.tenantId === w.lulu.id) && g1.status === 200 && !listed(g1).some((x) => x.id === iv.id) && gb.status === 400,
      `${gl.status} ${g1.status} ${gb.status}`,
    )
    const gAll = await call(rFinance, 'GET', MAIN, { params: { token: tok }, query: { tenantId: 'all' } })
    check('?tenantId=all 与不带参数同一清单', JSON.stringify(listed(gAll).map((x) => x.id)) === JSON.stringify(listed(g).map((x) => x.id)))
    const before = sentMails.length
    const p = await call(rFinance, 'POST', MAIN, { params: { token: tok }, body: { invoiceId: iv.id } })
    const m = sentMails.slice(before).find((x) => x.to === buyer.email)
    check('标已开具 200', p.status === 200 && (await prisma.invoice.findUniqueOrThrow({ where: { id: iv.id } })).status === 'ISSUED', p.text)
    check('「发票已开」邮件链接为 lulu origin', !!m && m.html.includes(w.lulu.origin) && !m.html.includes('https://bigolab.com'), m ? m.html.slice(0, 200) : '没有截获到邮件')
  }

  // =========================================================================
  section('W4-9b 卡密批量改售价拒绝渠道单的卡')
  // =========================================================================
  {
    const chCard = await prisma.cardKey.findFirstOrThrow({ where: { orderId: w.orders.luluAuto.id } })
    const { encryptCardContent, cardContentHash } = await import('../../src/lib/cardkey')
    const mainCard = await prisma.cardKey.create({
      data: { productId: w.products.auto, content: encryptCardContent(`IT4-MAIN-${RUN}`), contentHash: cardContentHash(`IT4-MAIN-${RUN}`), status: 'USED', orderId: w.orders.crossMain.id, usedAt: new Date(), cost: new Prisma.Decimal('100.00'), soldPrice: new Prisma.Decimal('129.00'), batch: `IT-${RUN}` },
    })
    const r = await call(rCardBatch, 'POST', sa, { body: { action: 'SET_PRICE', ids: [chCard.id, mainCard.id], soldPrice: 99 } })
    check('渠道单的卡被拒绝并列出', r.status === 200 && (r.json?.data?.rejectedChannelCardIds ?? []).includes(chCard.id) && (r.json?.data?.reasons ?? []).some((s: string) => s.includes(`#${chCard.id}`)), r.text)
    check('渠道卡售价不变、主站卡照改', Number((await prisma.cardKey.findUniqueOrThrow({ where: { id: chCard.id } })).soldPrice) === 110.37 && Number((await prisma.cardKey.findUniqueOrThrow({ where: { id: mainCard.id } })).soldPrice) === 99)
    const one = await call(rCard, 'PATCH', sa, { params: P(chCard.id), body: { soldPrice: 1 } })
    check('单张改渠道卡售价同样拒绝', one.status === 400, one.text)
  }

  // =========================================================================
  section('W4-10 商品删除保护与下架通知')
  // =========================================================================
  {
    const d1 = await call(rProduct, 'DELETE', sa, { params: P(w.products.manual) })
    check('删除有 listing / 订单的商品 → 拒绝', d1.status === 400 && (await prisma.product.count({ where: { id: w.products.manual } })) === 1, d1.text)
    const lone = await prisma.product.create({ data: { categoryId: (await prisma.product.findUniqueOrThrow({ where: { id: w.products.manual } })).categoryId, name: `${NAME_PREFIX} 只挂 listing ${RUN}`, price: new Prisma.Decimal('10.00'), deliveryType: 'MANUAL', stock: -1, status: 1 } })
    await prisma.tenantListing.create({ data: { publicNo: `IT4L${RUN}`.toUpperCase().slice(0, 16), tenantId: w.zz.id, productId: lone.id, granted: true, supplyCents: 800, retailCents: 1000, status: 1 } })
    const d2 = await call(rProduct, 'DELETE', sa, { params: P(lone.id) })
    check('只有渠道 listing（无订单）同样拒绝删除', d2.status === 400 && /渠道/.test(d2.json?.error || ''), d2.text)
    const before = await prisma.tenantNotice.count({ where: { kind: 'PRODUCT_WITHDRAWN', tenantId: { in: [w.lulu.id, w.zz.id] } } })
    const off = await call(rProduct, 'PUT', sa, { params: P(w.products.auto), body: { status: 0 } })
    const got = await prisma.tenantNotice.findMany({ where: { kind: 'PRODUCT_WITHDRAWN', tenantId: { in: [w.lulu.id, w.zz.id] } } })
    check('下架 → lulu 与 zz 各收到一条 PRODUCT_WITHDRAWN', off.status === 200 && got.length - before === 2 && got.some((n) => n.tenantId === w.lulu.id) && got.some((n) => n.tenantId === w.zz.id), off.text)
    const again = await call(rProduct, 'PUT', sa, { params: P(w.products.auto), body: { status: 0 } })
    check('已下架再保存不重复通知', again.status === 200 && (await prisma.tenantNotice.count({ where: { kind: 'PRODUCT_WITHDRAWN', tenantId: { in: [w.lulu.id, w.zz.id] } } })) === got.length)
    await prisma.product.update({ where: { id: w.products.auto }, data: { status: 1 } })
  }

  // =========================================================================
  section('售后申请处理（/admin/after-sales）')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    await prisma.order.update({ where: { id: o.id }, data: { escalatedAt: new Date() } })
    const mk = (kind: string, n: number) =>
      prisma.tenantAfterSale.create({ data: { requestNo: `AS${kind.slice(0, 2)}${n}${RUN}`.toUpperCase().slice(0, 24), tenantId: w.lulu.id, orderId: o.id, kind, activeKey: `o:${o.id}:${kind}`, reason: `itest ${kind}` } })
    const esc = await mk('ESCALATE', 1)
    const reis = await mk('REISSUE', 2)
    const ref = await mk('REFUND', 3)
    const zzAs = await prisma.tenantAfterSale.create({ data: { requestNo: `ASZZ${RUN}`.toUpperCase().slice(0, 24), tenantId: w.zz.id, orderId: w.orders.zzAuto.id, kind: 'REISSUE', activeKey: `o:${w.orders.zzAuto.id}:REISSUE`, reason: 'zz' } })
    const l = await call(rAS, 'GET', sa, { query: { tenantId: w.lulu.id, status: 'PENDING' } })
    check('按渠道 + 状态筛选：total = SQL，行带 tenant.code 与 orderNo', l.json?.data?.total === (await prisma.tenantAfterSale.count({ where: { tenantId: w.lulu.id, status: 'PENDING' } })) && (l.json?.data?.rows ?? []).every((r: any) => r.tenant?.code === w.lulu.code) && (l.json?.data?.rows ?? []).some((r: any) => r.orderNo === o.orderNo), l.text.slice(0, 200))
    const lk = await call(rAS, 'GET', sa, { query: { kind: 'REISSUE' } })
    check('按类型筛选含 zz 的补发申请', (lk.json?.data?.rows ?? []).some((r: any) => r.id === zzAs.id) && (lk.json?.data?.rows ?? []).every((r: any) => r.kind === 'REISSUE'))
    check('类型参数非法 → 400', (await call(rAS, 'GET', sa, { query: { kind: 'X' } })).status === 400)
    const noNote = await call(rASOne, 'PATCH', sa, { params: P(reis.id), body: { action: 'REJECT' } })
    check('驳回不填说明 → 400', noNote.status === 400)
    const rej = await call(rASOne, 'PATCH', sa, { params: P(reis.id), body: { action: 'REJECT', note: '已核实无需补发' } })
    const reisA = await prisma.tenantAfterSale.findUniqueOrThrow({ where: { id: reis.id } })
    check('驳回 → REJECTED、activeKey 清空、resultNote 写入', rej.status === 200 && reisA.status === 'REJECTED' && reisA.activeKey == null && reisA.resultNote === '已核实无需补发', rej.text)
    check('驳回通知渠道 AFTER_SALE_RESULT', (await prisma.tenantNotice.count({ where: { tenantId: w.lulu.id, kind: 'AFTER_SALE_RESULT', refKey: reis.requestNo } })) === 1)
    const au = await prisma.auditEvent.findFirst({ where: { action: 'aftersale.handle', targetId: reis.requestNo } })
    check('审计 publicDiff 只含 requestNo / result / resultNote', !!au && Object.keys((au.publicDiff as object) ?? {}).sort().join(',') === 'requestNo,result,resultNote', JSON.stringify(au?.publicDiff))
    const dup = await call(rASOne, 'PATCH', sa, { params: P(reis.id), body: { action: 'DONE', note: 'x' } })
    check('已处理的再处理 → 409', dup.status === 409, dup.text)
    const refDone = await call(rASOne, 'PATCH', sa, { params: P(ref.id), body: { action: 'DONE', note: 'x' } })
    check('退款申请不能在列表里点 DONE（须走退款弹窗）→ 400', refDone.status === 400 && (await prisma.tenantAfterSale.findUniqueOrThrow({ where: { id: ref.id } })).status === 'PENDING')
    const badEsc = await call(rASOne, 'PATCH', sa, { params: P(ref.id), body: { action: 'CLEAR_ESCALATION', note: 'x' } })
    check('非升级类清除升级 → 400', badEsc.status === 400)
    const ce = await call(rASOne, 'PATCH', sa, { params: P(esc.id), body: { action: 'CLEAR_ESCALATION', note: '站长已电话联系买家' } })
    check('清除升级：escalatedAt 置空、申请 DONE', ce.status === 200 && (await ord(o.id)).escalatedAt == null && (await prisma.tenantAfterSale.findUniqueOrThrow({ where: { id: esc.id } })).status === 'DONE', ce.text)
    const rjRef = await call(rASOne, 'PATCH', sa, { params: P(ref.id), body: { action: 'REJECT', note: '不符合退款条件' } })
    check('退款申请可以驳回', rjRef.status === 200)
    // 详情：渠道单 section
    const dt = await call(rDetail, 'GET', sa, { params: P(o.id) })
    check('订单详情带 channel（结算快照、售后申请、分录）与来源站', dt.json?.data?.source?.tenantId === w.lulu.id && Array.isArray(dt.json?.data?.channel?.afterSales) && dt.json.data.channel.afterSales.length >= 3 && Array.isArray(dt.json?.data?.channel?.ledger) && dt.json.data.channel.ledger.length > 0)
    check('主站单详情 channel = null', (await call(rDetail, 'GET', sa, { params: P(w.orders.crossMain.id) })).json?.data?.channel === null)
  }

  // =========================================================================
  section('按快照补记（resettle）')
  // =========================================================================
  {
    const o = await mkOrder(L, { tenantId: w.lulu.id, user: buyer, productId: w.products.manual, listingId: LM })
    // 造一个「计提失败 → MISSING」：清掉分录、状态改 MISSING
    await prisma.tenantLedgerEntry.deleteMany({ where: { orderId: o.id } })
    await prisma.order.update({ where: { id: o.id }, data: { settleState: 'MISSING', invShareState: null } })
    const r = await call(rResettle, 'POST', sa, { params: P(o.id) })
    check('MISSING → 补记 200，ACCRUED 且有分录', r.status === 200 && (await ord(o.id)).settleState === 'ACCRUED' && (await prisma.tenantLedgerEntry.count({ where: { orderId: o.id } })) > 0, r.text)
    const r2 = await call(rResettle, 'POST', sa, { params: P(o.id) })
    check('再补记 → 409（已不是 NULL / MISSING）', r2.status === 409, r2.text)
    const r3 = await call(rResettle, 'POST', sa, { params: P(w.orders.crossMain.id) })
    check('主站单补记 → 400', r3.status === 400, r3.text)
  }

  // =========================================================================
  section('留言：后台回复与快捷回复记 senderRole=PLATFORM；渠道单给买家发提醒')
  // =========================================================================
  {
    const o = w.orders.luluAuto
    const before = sentMails.length
    const r = await call(rMsgs, 'POST', sa, { params: P(o.id), body: { content: '站长回复 itest' } })
    const m = await prisma.orderMessage.findFirst({ where: { orderId: o.id, content: '站长回复 itest' } })
    check('后台回复：sender=ADMIN、senderRole=PLATFORM、senderUserId=管理员', r.status === 200 && m?.sender === 'ADMIN' && m?.senderRole === 'PLATFORM' && m?.senderUserId === w.users.sa.id, r.text)
    for (let i = 0; i < 30 && sentMails.length === before; i++) await sleep(100)
    const rm = sentMails.slice(before).find((x) => x.to === buyer.email)
    check('渠道单：买家收到客服回复提醒，链接为 lulu origin', !!rm && rm.html.includes(w.lulu.origin), rm ? rm.subject : '没有截获到邮件')
    const mainBefore = sentMails.length
    await call(rMsgs, 'POST', sa, { params: P(w.orders.crossMain.id), body: { content: '主站回复 itest' } })
    await sleep(500)
    check('主站单回复不发新邮件（主站行为不变）', sentMails.length === mainBefore)
    const tok = issueQuickReplyToken(o.id)
    const g = await call(rQuick, 'GET', MAIN, { params: { token: tok } })
    const keys = new Set(Object.keys((g.json?.data?.messages ?? [])[0] ?? {}))
    check('快捷回复 GET：订单带来源站，留言字段显式收窄', g.status === 200 && g.json?.data?.order?.source?.code === w.lulu.code && !keys.has('readByTenant') && !keys.has('senderUserId') && keys.has('senderRole'), g.text.slice(0, 200))
    const p = await call(rQuick, 'POST', MAIN, { params: { token: tok }, body: { content: '快捷回复 itest' } })
    const qm = await prisma.orderMessage.findFirst({ where: { orderId: o.id, content: '快捷回复 itest' } })
    check('快捷回复 POST：senderRole=PLATFORM', p.status === 200 && qm?.senderRole === 'PLATFORM', p.text)
  }

  // =========================================================================
  section('到账补单：确认前显示来源站')
  // =========================================================================
  {
    const v = await prisma.vmqOrder.create({
      data: { orderId: `ITV4${RUN}`.slice(0, 32), bizType: 'order', bizId: w.orders.luluAuto.id, outTradeNo: w.orders.luluAuto.orderNo, type: 2, price: new Prisma.Decimal('140.00'), reallyPrice: new Prisma.Decimal('140.01'), state: -1 },
    }).catch((e) => {
      console.log('    （收款单夹具建不出来，跳过：', (e as Error).message.split('\n').slice(-1)[0], '）')
      return null
    })
    if (v) {
      const r = await call(rVmq, 'GET', sa, { query: { id: v.id } })
      check('GET /api/admin/vmq/complete?id= 返回来源站 lulu 与订单号，不回传收款单令牌', r.status === 200 && r.json?.data?.source?.code === w.lulu.code && r.json?.data?.orderNo === w.orders.luluAuto.orderNo && !r.text.includes(v.orderId), r.text)
      await prisma.vmqOrder.delete({ where: { id: v.id } })
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    check('未捕获异常', false, String((e as Error)?.stack || e))
  })
  .finally(async () => {
    try {
      await prisma.vmqOrder.deleteMany({ where: { orderId: { startsWith: 'ITV4' } } })
      await prisma.invoice.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
      await prisma.receipt.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
      await prisma.externalOrder.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
      await cleanupAll()
    } catch (e) {
      console.error('清理失败', e)
    }
    const r = summary()
    await prisma.$disconnect()
    process.exit(r.fail === 0 ? 0 : 1)
  })
