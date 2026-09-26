/**
 * 渠道分站二期 · P2「通知路由与推送方式」集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-p2.ts
 *
 * 覆盖 docs/多渠道分销-二期改动.md 第 3 节：
 *   P2-1 渠道纯通知不再推站长 webhook（改调用点）：下单、付款（唯一例外：待人工发货 / 待补发）、收据、买家留言、注册；
 *        主站单照推、内容不变；库存告警照推
 *   P2-2 新通知类型：CUSTOMER_JOINED（渠道站注册）、ORDER_DELIVERED（人工发货 / 标已交付 / 补发完成），正文不含交付内容
 *   P2-3 tenant/notice.ts 推送路由：企业微信开关、邮箱开关、偏好对两者都生效、pushVia、发信失败释放占位、
 *        限频（每小时 20 / 每天 100，按 emailedAt 计数、并发不超发）、当天第一次超限留一条说明（不推送）
 *   P2-4 设置中心接口：GET 带 transport / contact；开关、通知邮箱（登录邮箱直存、其他邮箱验证码）、测试、审计、允许键
 *   P2-5 前台文案：通知类型中文名共用 types.ts 一份
 *
 * 【站长 webhook 用本机 HTTP 桩接】WECOM_WEBHOOK_URL 指向 127.0.0.1 的临时服务（非企业微信域名 → notify() 发通用 JSON，
 * 带 title / data，便于断言）。渠道推送走 notice.ts 的测试桩（企业微信 transport / 邮件 mailer），不发真实请求、不发真实邮件。
 * 【测试数据】租户 / 用户 / 商品走 _harness 的前缀；结束时**只删本脚本建的行**（二期多包并行跑 itest，不调 cleanupAll）。
 */
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL', 'NOTIFY_EVENTS']) {
  delete process.env[k]
}
process.env.LOW_STOCK_THRESHOLD = '3'

import http from 'node:http'
import { readFileSync } from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  createTenant,
  createUser,
  signTestToken,
  callRoute,
  collectKeys,
  mail,
  RUN,
  NAME_PREFIX,
  type RouteFn,
  type WorldTenant,
  type WorldUser,
} from './_harness'

// ---------------------------------------------------------------------------
// 站长 webhook 桩：记录每一条推送（通用 JSON：{ event, title, text, data }）
// ---------------------------------------------------------------------------
type Hook = { event?: string; title?: string; text?: string; data?: Record<string, string> }
const hooks: Hook[] = []
function startHookServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let b = ''
      req.on('data', (c) => (b += c))
      req.on('end', () => {
        try {
          hooks.push(JSON.parse(b))
        } catch {
          hooks.push({ text: b })
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('{"errcode":0}')
      })
    })
    srv.listen(0, '127.0.0.1', () => resolve(srv))
  })
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** 等到有匹配的推送（最多 ms 毫秒）；返回匹配的那些 */
async function hooksMatching(pred: (h: Hook) => boolean, ms = 2500): Promise<Hook[]> {
  const until = Date.now() + ms
  while (Date.now() < until) {
    const got = hooks.filter(pred)
    if (got.length) return got
    await sleep(100)
  }
  return hooks.filter(pred)
}
const hookText = (h: Hook) => JSON.stringify(h)

async function main() {
  const srv = await startHookServer()
  const port = (srv.address() as { port: number }).port
  process.env.WECOM_WEBHOOK_URL = `http://127.0.0.1:${port}/hook`

  // 被测模块在改完环境变量之后再加载（aliyun.ts 在加载时读发信配置）
  const notice = await import('../../src/lib/tenant/notice')
  const vmq = await import('../../src/lib/vmq')
  const mailMod = await import('../../src/lib/mail')
  const verify = await import('../../src/lib/verify-code')
  const selects = await import('../../src/lib/partner-services/selects')
  const types = await import('../../src/lib/tenant/types')
  const { sealText } = await import('../../src/lib/tenant/crypto')
  const { encryptCardContent, cardContentHash } = await import('../../src/lib/cardkey')
  const { invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  const rRegister = await import('../../src/app/api/auth/register/route')
  const rMsgs = await import('../../src/app/api/orders/[id]/messages/route')
  const rAdminOrder = await import('../../src/app/api/admin/orders/[id]/route')
  const rRefill = await import('../../src/app/api/admin/orders/[id]/refill/route')
  const rSettings = await import('../../src/app/api/partner/settings/route')
  const rTransport = await import('../../src/app/api/partner/settings/transport/route')
  const rNoticeEmail = await import('../../src/app/api/partner/settings/notice-email/route')
  const rNoticeCode = await import('../../src/app/api/partner/settings/notice-email/code/route')
  const rNoticeTest = await import('../../src/app/api/partner/settings/notice-email/test/route')
  const rWebhookTest = await import('../../src/app/api/partner/settings/webhook/test/route')
  const RF = (fn: unknown) => fn as RouteFn

  // 渠道推送桩
  const wecom: { payload: string }[] = []
  notice.setTenantNoticeTransportForTest(async (_url, payload) => {
    wecom.push({ payload: JSON.stringify(payload) })
    return true
  })
  let mailOk = true
  const mails: { to: string; info: import('../../src/lib/mail').TenantNoticeMailInfo; opts: import('../../src/lib/mail').MailOpts }[] = []
  notice.setTenantNoticeMailerForTest(async (to, info, opts) => {
    mails.push({ to, info, opts })
    return mailOk ? { ok: true } : { ok: false, detail: 'itest-fail' }
  })

  setChannelsMode('observe')
  invalidateStorefrontCache()

  const tenants: WorldTenant[] = []
  const users: WorldUser[] = []
  const productIds: number[] = []
  let categoryId: number | null = null
  const extraEmails: string[] = []

  try {
    // =======================================================================
    // 夹具：一个渠道（OWNER + 买家）、SA、主站买家；商品 AUTO / MANUAL；上架
    // =======================================================================
    const T = await createTenant('x')
    tenants.push(T)
    const owner = await createUser('p2own', { registeredTenantId: T.id })
    const buyer = await createUser('p2buy', { registeredTenantId: T.id })
    const mainBuyer = await createUser('p2main')
    const sa = await createUser('p2sa', { role: 'ADMIN' })
    users.push(owner, buyer, mainBuyer, sa)
    await prisma.tenantMember.create({ data: { tenantId: T.id, userId: owner.id, role: 'OWNER', status: 1 } })
    await prisma.tenant.update({
      where: { id: T.id },
      data: { wecomWebhookEnc: sealText('webhook', `${notice.WECOM_WEBHOOK_PREFIX}itest-p2-${RUN}`) },
    })
    const cat = await prisma.category.create({ data: { name: `${NAME_PREFIX}-p2-${RUN}`, sortOrder: 999 } })
    categoryId = cat.id
    const mk = (name: string, deliveryType: string) =>
      prisma.product.create({ data: { categoryId: cat.id, name: `${NAME_PREFIX} p2${name} ${RUN}`, price: new Prisma.Decimal('129.00'), deliveryType, stock: -1, status: 1 } })
    const pAuto = await mk('卡密', 'AUTO')
    const pManual = await mk('人工', 'MANUAL')
    productIds.push(pAuto.id, pManual.id)
    const pubNo = () => `P2${Math.random().toString(36).slice(2, 12).toUpperCase()}`.padEnd(12, 'X').slice(0, 12)
    const lAuto = await prisma.tenantListing.create({ data: { publicNo: pubNo(), tenantId: T.id, productId: pAuto.id, granted: true, supplyCents: 11037, retailCents: 14000, status: 1 } })
    const lManual = await prisma.tenantListing.create({ data: { publicNo: pubNo(), tenantId: T.id, productId: pManual.id, granted: true, supplyCents: 11037, retailCents: 14000, status: 1 } })
    let seq = 0
    const newOrder = async (a: { tenantId: number; userId: number; productId: number; productName: string; listingId?: number; paid?: boolean; delivery?: 'PENDING' | 'PROCESSING' | 'DELIVERED' }) => {
      seq++
      const channel = a.tenantId !== 1
      const paid = a.paid === true
      const o = await prisma.order.create({
        data: {
          orderNo: `P2${RUN.toUpperCase()}${String(seq).padStart(3, '0')}`.slice(0, 32),
          userId: a.userId,
          productId: a.productId,
          productName: a.productName,
          productPrice: new Prisma.Decimal(channel ? '140.00' : '129.00'),
          quantity: 1,
          amount: new Prisma.Decimal(channel ? '140.00' : '129.00'),
          payStatus: paid ? 'PAID' : 'UNPAID',
          payMethod: paid ? 'ALIPAY' : null,
          paidAt: paid ? new Date() : null,
          deliveryStatus: a.delivery ?? 'PENDING',
          tenantId: a.tenantId,
          ...(channel
            ? {
                listingId: a.listingId ?? null,
                supplyUnitPrice: new Prisma.Decimal('110.37'),
                supplyCents: 11037,
                feeRateBp: 150,
                invoiceShareRateBp: 200,
                settleHoldDays: 7,
                mainPriceAtOrder: new Prisma.Decimal('129.00'),
              }
            : {}),
        },
        select: { id: true, orderNo: true },
      })
      return o
    }
    const addCard = async () => {
      const plain = `ITEST-P2-CARD-${RUN}-${Math.random().toString(36).slice(2, 8)}`
      await prisma.cardKey.create({
        data: { productId: pAuto.id, content: encryptCardContent(plain), contentHash: cardContentHash(plain), status: 'UNUSED', cost: new Prisma.Decimal('100.00'), batch: `IT-P2-${RUN}` },
      })
    }
    const SA = { host: 'bigolab.com', token: signTestToken(sa, 'main') }
    const OWNER = { host: T.host, token: signTestToken(owner, T.code, T.id) }

    // =======================================================================
    section('P2-1a 源码：下单 / 收据的渠道分支不再推站长（改调用点，二期 3.1）')
    {
      const src = (f: string) => readFileSync(path.join(process.cwd(), f), 'utf8')
      const orders = src('src/app/api/orders/route.ts')
      check('orders/route.ts：notifyOrderCreated 只剩主站一处调用', (orders.match(/notifyOrderCreated\(/g) || []).length === 1)
      check('orders/route.ts：渠道分支不再拼 siteTag', !/siteTag\(/.test(orders))
      const billing = src('src/lib/order-billing.ts')
      check('order-billing.ts：notifyReceiptCreated 只在 tenantId === 1 时调用', /if \(tf\.tenantId === 1\) \{\s*notifyReceiptCreated\(/.test(billing) && (billing.match(/notifyReceiptCreated\(/g) || []).length === 1)
      const reg = src('src/app/api/auth/register/route.ts')
      check('register：notifyUserRegistered 只在主站店面调用', /if \(sf\.kind === 'PLATFORM'\) \{\s*notifyUserRegistered\(/.test(reg))
      const msgs = src('src/app/api/orders/[id]/messages/route.ts')
      check('messages：notifyBuyerMessage 只在主站单调用', /if \(order\.tenantId === 1\) \{[\s\S]{0,400}notifyBuyerMessage\(/.test(msgs))
    }

    // =======================================================================
    section('P2-1b channelPendingDelivery：渠道单付款推站长的唯一例外')
    {
      const f = vmq.channelPendingDelivery
      check('自动发货已交付 → 不推', f('AUTO', true, null) === null)
      check('接码（SMS）未交付 → 不推（正常流程）', f('SMS', false, null) === null)
      check('自动发货缺卡 → 待补发（写明已发 / 应发）', f('AUTO', false, { owned: 1, need: 3 })?.title === '渠道单待补发' && /1\/3/.test(f('AUTO', false, { owned: 1, need: 3 })?.reason || ''))
      check('自动发货应发为 0（已按件退完）→ 不推', f('AUTO', false, null) === null)
      check('人工发货 → 待人工发货', f('MANUAL', false, null)?.title === '渠道单待人工发货')
    }

    // =======================================================================
    section('P2-1c 付款（fulfillOrder）：渠道自动发货成功不推站长；人工发货 / 缺卡推精简版；主站照旧')
    {
      // ① 渠道自动发货、卡够 → 不推站长（只有渠道 ORDER_PAID）
      await addCard()
      const o1 = await newOrder({ tenantId: T.id, userId: buyer.id, productId: pAuto.id, productName: pAuto.name, listingId: lAuto.id })
      await vmq.fulfillOrder(o1.id)
      await sleep(1200)
      check('渠道自动发货成功 → 站长群没有任何带本单号的推送', hooks.filter((h) => hookText(h).includes(o1.orderNo)).length === 0, hooks.map(hookText).join(' | ').slice(0, 300))
      check('渠道 ORDER_PAID 站内通知照写', (await prisma.tenantNotice.count({ where: { tenantId: T.id, kind: 'ORDER_PAID', refKey: o1.orderNo } })) === 1)
      const low = hooks.filter((h) => (h.title || '').includes('库存告警'))
      check('库存告警照推站长（卡池是平台的）', low.length >= 1)

      // ② 渠道人工发货 → 推「[code] … 渠道单待人工发货」，不带买家信息
      const o2 = await newOrder({ tenantId: T.id, userId: buyer.id, productId: pManual.id, productName: pManual.name, listingId: lManual.id })
      await vmq.fulfillOrder(o2.id)
      const h2 = await hooksMatching((h) => hookText(h).includes(o2.orderNo))
      check('人工发货渠道单 → 站长收到 1 条', h2.length === 1, `${h2.length} 条`)
      check('标题带渠道标签与「渠道单待人工发货」', (h2[0]?.title || '').includes(`[${T.code}]`) && (h2[0]?.title || '').includes('渠道单待人工发货'), h2[0]?.title)
      check('正文：订单号、商品、件数、金额、原因', !!h2[0]?.data && ['订单号', '商品', '件数', '金额', '原因'].every((k) => k in (h2[0].data as object)))
      check('不带买家信息（邮箱 / 昵称 / 用户行）', !hookText(h2[0] || {}).includes(buyer.email) && !hookText(h2[0] || {}).includes('it-p2buy') && !('用户' in (h2[0]?.data || {})))

      // ③ 渠道自动发货、没卡 → 待补发；补发后 ORDER_DELIVERED（补发完成），站长不再收到
      const pendBefore = hooks.length
      const o3 = await newOrder({ tenantId: T.id, userId: buyer.id, productId: pAuto.id, productName: pAuto.name, listingId: lAuto.id })
      await vmq.fulfillOrder(o3.id)
      const h3 = await hooksMatching((h) => hookText(h).includes(o3.orderNo))
      check('自动发货缺卡渠道单 → 站长收到「渠道单待补发」', h3.length === 1 && (h3[0]?.title || '').includes('渠道单待补发') && /0\/1/.test(h3[0]?.data?.['原因'] || ''), hookText(h3[0] || {}))
      check('此时订单停在 PROCESSING', (await prisma.order.findUniqueOrThrow({ where: { id: o3.id } })).deliveryStatus === 'PROCESSING')
      await addCard()
      mails.length = 0
      await prisma.tenant.update({ where: { id: T.id }, data: { noticeEmail: mail('p2own'), noticeEmailOn: true } })
      const rr = await callRoute(RF(rRefill.PUT), { ...SA, method: 'PUT', path: `/api/admin/orders/${o3.id}/refill`, params: { id: String(o3.id) } })
      check('后台补发卡密 → 200、已交付', rr.status === 200 && rr.json?.data?.deliveryStatus === 'DELIVERED', rr.text.slice(0, 200))
      await notice.waitTenantNoticePushesForTest()
      const d3 = await prisma.tenantNotice.findMany({ where: { tenantId: T.id, kind: 'ORDER_DELIVERED', refKey: o3.orderNo } })
      check('补发完成 → 渠道通知 ORDER_DELIVERED 一条', d3.length === 1)
      check('补发完成通知走了邮箱推送，按钮指向订单详情', mails.some((m) => m.info.kind === 'ORDER_DELIVERED' && m.info.path === `/partner/orders/${o3.orderNo}` && m.opts.origin === T.origin))
      await sleep(600)
      check('补发不再推站长（本单号只出现过付款时那一条）', hooks.slice(pendBefore).filter((h) => hookText(h).includes(o3.orderNo)).length === 1)
      // 再点一次补发（已交付）：不重复通知
      await callRoute(RF(rRefill.PUT), { ...SA, method: 'PUT', path: `/api/admin/orders/${o3.id}/refill`, params: { id: String(o3.id) } })
      await notice.waitTenantNoticePushesForTest()
      check('已交付后再补发 → 不重复写 ORDER_DELIVERED', (await prisma.tenantNotice.count({ where: { tenantId: T.id, kind: 'ORDER_DELIVERED', refKey: o3.orderNo } })) === 1)

      // ③b 首次自动发货的并发者：赢家已翻 PAID、还没发卡（交付状态仍 PENDING），非赢家先抢到行锁发了卡 →
      //     这不是「补发完成」，不得写 ORDER_DELIVERED（审查意见：误报且占邮件名额）
      await addCard()
      const o3b = await newOrder({ tenantId: T.id, userId: buyer.id, productId: pAuto.id, productName: pAuto.name, listingId: lAuto.id, paid: true, delivery: 'PENDING' })
      const w3b = await vmq.fulfillOrder(o3b.id)
      await notice.waitTenantNoticePushesForTest()
      check('并发非赢家（PENDING→已交付）：确为非赢家且发了卡', w3b === false && (await prisma.order.findUniqueOrThrow({ where: { id: o3b.id } })).deliveryStatus === 'DELIVERED')
      check('并发非赢家的首次发货 → 不写 ORDER_DELIVERED', (await prisma.tenantNotice.count({ where: { tenantId: T.id, kind: 'ORDER_DELIVERED', refKey: o3b.orderNo } })) === 0)

      // ④ 主站单：照推 notifyOrderPaid（带用户行、无站点标签）
      await addCard()
      const o4 = await newOrder({ tenantId: 1, userId: mainBuyer.id, productId: pAuto.id, productName: pAuto.name })
      await vmq.fulfillOrder(o4.id)
      const h4 = await hooksMatching((h) => hookText(h).includes(o4.orderNo))
      check('主站单付款 → 站长照收「订单已支付」', h4.length === 1 && (h4[0]?.title || '').includes('订单已支付'))
      check('主站单推送内容与原来一致（用户 / 发货 / 剩余库存行，无站点标签）', !!h4[0]?.data && '用户' in h4[0].data! && '发货' in h4[0].data! && '剩余库存' in h4[0].data! && !(h4[0]?.title || '').includes('['))
      await prisma.tenant.update({ where: { id: T.id }, data: { noticeEmail: null, noticeEmailOn: false } })
    }

    // =======================================================================
    section('P2-2a 站长人工发货 / 标已交付 → ORDER_DELIVERED（正文不含交付内容）')
    {
      const o = await newOrder({ tenantId: T.id, userId: buyer.id, productId: pManual.id, productName: pManual.name, listingId: lManual.id })
      await vmq.fulfillOrder(o.id)
      await notice.waitTenantNoticePushesForTest()
      const secret = `ITEST-P2-DELIVERY-SECRET-${RUN}`
      wecom.length = 0
      const r = await callRoute(RF(rAdminOrder.PUT), { ...SA, method: 'PUT', path: `/api/admin/orders/${o.id}`, params: { id: String(o.id) }, body: { deliveryStatus: 'DELIVERED', deliveryInfo: secret } })
      check('后台标已交付 → 200', r.status === 200, r.text.slice(0, 200))
      await notice.waitTenantNoticePushesForTest()
      const rows = await prisma.tenantNotice.findMany({ where: { tenantId: T.id, kind: 'ORDER_DELIVERED', refKey: o.orderNo } })
      check('写一条 ORDER_DELIVERED', rows.length === 1)
      check('通知正文不含交付内容', !!rows[0] && !`${rows[0].title}${rows[0].body}`.includes(secret))
      check('企业微信推送载荷不含交付内容，带订单链接', wecom.length >= 1 && wecom.every((p) => !p.payload.includes(secret)) && wecom.some((p) => p.payload.includes(`/partner/orders/${o.orderNo}`)))
      // 只改交付内容（已交付 → 已交付）：不再通知
      const r2 = await callRoute(RF(rAdminOrder.PUT), { ...SA, method: 'PUT', path: `/api/admin/orders/${o.id}`, params: { id: String(o.id) }, body: { deliveryInfo: `${secret}-2` } })
      await notice.waitTenantNoticePushesForTest()
      check('已交付后只改交付内容 → 不重复通知', r2.status === 200 && (await prisma.tenantNotice.count({ where: { tenantId: T.id, kind: 'ORDER_DELIVERED', refKey: o.orderNo } })) === 1)
      await sleep(400)
      check('标已交付不推站长群', hooks.filter((h) => hookText(h).includes(o.orderNo)).length === 1 /* 只有付款时「待人工发货」那一条 */)
    }

    // =======================================================================
    section('P2-1d 买家留言：渠道单只写渠道通知，不推站长；主站单照推')
    {
      const oc = await newOrder({ tenantId: T.id, userId: buyer.id, productId: pManual.id, productName: pManual.name, listingId: lManual.id, paid: true, delivery: 'DELIVERED' })
      const r = await callRoute(RF(rMsgs.POST), {
        host: T.host,
        token: signTestToken(buyer, T.code, T.id),
        method: 'POST',
        path: `/api/orders/${oc.id}/messages`,
        params: { id: String(oc.id) },
        body: { content: `itest 留言 ${buyer.email}` },
      })
      check('渠道单留言 → 200', r.status === 200, r.text.slice(0, 200))
      await notice.waitTenantNoticePushesForTest()
      check('渠道 BUYER_MESSAGE 照写', (await prisma.tenantNotice.count({ where: { tenantId: T.id, kind: 'BUYER_MESSAGE', refKey: oc.orderNo } })) === 1)
      await sleep(800)
      check('渠道单留言不推站长群', hooks.filter((h) => hookText(h).includes(oc.orderNo)).length === 0)
      check('渠道单留言仍给站长后台未读红点（readByAdmin=false）', (await prisma.orderMessage.count({ where: { orderId: oc.id, readByAdmin: false } })) === 1)

      const om = await newOrder({ tenantId: 1, userId: mainBuyer.id, productId: pManual.id, productName: pManual.name, paid: true, delivery: 'DELIVERED' })
      const r2 = await callRoute(RF(rMsgs.POST), {
        host: 'bigolab.com',
        token: signTestToken(mainBuyer, 'main'),
        method: 'POST',
        path: `/api/orders/${om.id}/messages`,
        params: { id: String(om.id) },
        body: { content: 'itest 主站留言' },
      })
      const hm = await hooksMatching((h) => hookText(h).includes(om.orderNo))
      check('主站单留言 → 站长照收「新订单留言」、商品名无标签', r2.status === 200 && hm.length === 1 && (hm[0]?.title || '').includes('新订单留言') && !(hm[0]?.data?.['商品'] || '').startsWith('['), hookText(hm[0] || {}))
    }

    // =======================================================================
    section('P2-2b 注册：渠道站 → CUSTOMER_JOINED（不推站长）；主站 → 照推')
    {
      const e1 = mail('p2reg-ch')
      const e2 = mail('p2reg-main')
      extraEmails.push(e1, e2)
      const r1 = await callRoute(RF(rRegister.POST), { host: T.host, method: 'POST', path: '/api/auth/register', body: { email: e1, password: 'Test123456', nickname: 'p2reg' } })
      check('渠道站注册 → 200', r1.status === 200, r1.text.slice(0, 200))
      await notice.waitTenantNoticePushesForTest()
      const u1 = await prisma.user.findUnique({ where: { email: e1 }, select: { id: true } })
      const c1 = u1 ? await prisma.tenantCustomer.findUnique({ where: { tenantId_userId: { tenantId: T.id, userId: u1.id } }, select: { publicNo: true } }) : null
      const n1 = await prisma.tenantNotice.findMany({ where: { tenantId: T.id, kind: 'CUSTOMER_JOINED' } })
      check('写一条 CUSTOMER_JOINED，指向客户详情（公开编号）', n1.length === 1 && n1[0].refType === 'customer' && !!c1 && n1[0].refKey === c1.publicNo)
      check('通知不含邮箱与昵称', n1.length === 1 && !`${n1[0].title}${n1[0].body}`.includes(e1) && !`${n1[0].title}${n1[0].body}`.includes('p2reg'))
      check('企业微信推送链接指向 /partner/customers/<编号>', !!c1 && wecom.some((p) => p.payload.includes(`/partner/customers/${c1.publicNo}`)))
      await sleep(800)
      check('渠道站注册不推站长群', hooks.filter((h) => (h.title || '').includes('新用户注册') && hookText(h).includes(e1)).length === 0)

      const r2 = await callRoute(RF(rRegister.POST), { host: 'bigolab.com', method: 'POST', path: '/api/auth/register', body: { email: e2, password: 'Test123456' } })
      const h2 = await hooksMatching((h) => (h.title || '').includes('新用户注册') && hookText(h).includes(e2))
      check('主站注册 → 站长照收「新用户注册」', r2.status === 200 && h2.length === 1, r2.text.slice(0, 200))
    }

    // =======================================================================
    section('P2-3a 推送路由：开关、偏好、pushVia')
    {
      const emit = (kind: 'SUPPLY_CHANGED' | 'TENANT_STATUS' | 'STATEMENT', tag: string, extra: Record<string, unknown> = {}) =>
        notice.emitTenantNotice(null, { tenantId: T.id, kind, title: `itest ${tag}`, body: `正文 ${buyer.email} https://evil.example.com/x`, dedupeKey: `p2:${RUN}:${tag}`, ...extra })
      const reset = () => {
        wecom.length = 0
        mails.length = 0
      }
      const ne = mail('p2notice')
      await prisma.tenant.update({ where: { id: T.id }, data: { noticeWecomOn: true, noticeEmailOn: false, noticeEmail: ne, noticePrefs: Prisma.JsonNull } })
      reset()
      await emit('STATEMENT', 'a1')
      await notice.waitTenantNoticePushesForTest()
      check('默认（企业微信开、邮箱关）→ 只推企业微信', wecom.length === 1 && mails.length === 0)

      await prisma.tenant.update({ where: { id: T.id }, data: { noticeEmailOn: true } })
      reset()
      await emit('STATEMENT', 'a2')
      await notice.waitTenantNoticePushesForTest()
      check('两种都开 → 两边各一次', wecom.length === 1 && mails.length === 1)
      const m = mails[0]
      check('邮件收件人是通知邮箱，按钮 origin 是渠道店面，路径以 /partner 开头', m?.to === ne && m?.opts.origin === T.origin && (m?.info.path || '').startsWith('/partner'))
      check('发信成功写 emailedAt，企业微信写 pushedAt', !!(await prisma.tenantNotice.findFirst({ where: { dedupeKey: `p2:${RUN}:a2`, emailedAt: { not: null }, pushedAt: { not: null } } })))
      const html = m ? mailMod.renderTenantNoticeEmail(m.info, m.opts).html : ''
      check('邮件正文不含买家邮箱与外链（模板脱敏）', !!html && !html.includes(buyer.email) && !html.includes('evil.example.com'))

      await prisma.tenant.update({ where: { id: T.id }, data: { noticeWecomOn: false } })
      reset()
      await emit('STATEMENT', 'a3')
      await notice.waitTenantNoticePushesForTest()
      check('企业微信关（webhook 仍在）→ 不推企业微信，邮件照发', wecom.length === 0 && mails.length === 1)

      await prisma.tenant.update({ where: { id: T.id }, data: { noticeWecomOn: true, noticePrefs: { SUPPLY_CHANGED: false } } })
      reset()
      await emit('SUPPLY_CHANGED', 'a4')
      await notice.waitTenantNoticePushesForTest()
      check('偏好关掉的类型 → 两种都不推，站内通知照写', wecom.length === 0 && mails.length === 0 && (await prisma.tenantNotice.count({ where: { dedupeKey: `p2:${RUN}:a4` } })) === 1)

      reset()
      await emit('STATEMENT', 'a5', { pushVia: 'wecom' })
      await notice.waitTenantNoticePushesForTest()
      check('pushVia=wecom → 只推企业微信', wecom.length === 1 && mails.length === 0)

      reset()
      mailOk = false
      await emit('STATEMENT', 'a6')
      await notice.waitTenantNoticePushesForTest()
      mailOk = true
      check('发信失败 → 释放占位（emailedAt 为空），不重试', mails.length === 1 && !!(await prisma.tenantNotice.findFirst({ where: { dedupeKey: `p2:${RUN}:a6`, emailedAt: null } })))

      // 恢复默认发信函数：阿里云未配置 → 不占名额
      notice.setTenantNoticeMailerForTest(null)
      reset()
      await emit('STATEMENT', 'a7')
      await notice.waitTenantNoticePushesForTest()
      check('发信未配置 → 不发、不占名额', !!(await prisma.tenantNotice.findFirst({ where: { dedupeKey: `p2:${RUN}:a7`, emailedAt: null } })))
      notice.setTenantNoticeMailerForTest(async (to, info, opts) => {
        mails.push({ to, info, opts })
        return mailOk ? { ok: true } : { ok: false, detail: 'itest-fail' }
      })
      await prisma.tenant.update({ where: { id: T.id }, data: { noticePrefs: Prisma.JsonNull } })
    }

    // =======================================================================
    section('P2-3b 邮件限频：每小时 20、每天 100；并发不超发；当天第一次超限留一条说明（不推送）')
    {
      const { perHour, perDay } = notice.TENANT_NOTICE_MAIL_LIMITS
      check('限额常量 20 / 100', perHour === 20 && perDay === 100)
      // 清掉前面几节留下的 emailedAt（本渠道），从 0 开始数
      await prisma.tenantNotice.updateMany({ where: { tenantId: T.id }, data: { emailedAt: null } })
      await prisma.tenant.update({ where: { id: T.id }, data: { noticeEmailOn: true, noticeWecomOn: false } })
      const now = Date.now()
      const filler = async (n: number, at: Date, tag: string) => {
        const data = Array.from({ length: n }, (_, i) => ({
          publicNo: `Q${RUN.toUpperCase()}${tag}${String(i).padStart(3, '0')}`.slice(0, 16),
          tenantId: T.id,
          kind: 'STATEMENT',
          title: 'itest filler',
          emailedAt: at,
          dedupeKey: `p2fill:${RUN}:${tag}:${i}`,
        }))
        await prisma.tenantNotice.createMany({ data })
      }
      await filler(perHour - 1, new Date(now - 10 * 60_000), 'H')
      mails.length = 0
      await Promise.all(
        Array.from({ length: 5 }, (_, i) => notice.emitTenantNotice(null, { tenantId: T.id, kind: 'STATEMENT', title: `itest 并发 ${i}`, dedupeKey: `p2:${RUN}:c${i}` })),
      )
      await notice.waitTenantNoticePushesForTest()
      const emailedC = await prisma.tenantNotice.count({ where: { tenantId: T.id, dedupeKey: { startsWith: `p2:${RUN}:c` }, emailedAt: { not: null } } })
      check(`已发 ${perHour - 1} 封时并发来 5 条 → 只再发 1 封（总数不超 ${perHour}）`, emailedC === 1 && mails.length === 1, `emailed=${emailedC} mails=${mails.length}`)
      check('超出的 4 条站内通知照写', (await prisma.tenantNotice.count({ where: { tenantId: T.id, dedupeKey: { startsWith: `p2:${RUN}:c` } } })) === 5)
      const caps = await prisma.tenantNotice.findMany({ where: { tenantId: T.id, dedupeKey: { startsWith: `mailcap:${T.id}:` } } })
      check('当天第一次超限 → 站内留一条说明（多次超限只一条）', caps.length === 1 && /每小时最多 20 封/.test(caps[0].body || ''))
      check('超限说明本身不推送（pushedAt / emailedAt 都为空）', caps.length === 1 && !caps[0].pushedAt && !caps[0].emailedAt)

      // 每天 100：把小时内的全挪到 61 分钟前（仍在北京时间今天之内才测，否则跳过）
      const bjNow = new Date(now + 8 * 3600_000)
      const dayStart = Date.UTC(bjNow.getUTCFullYear(), bjNow.getUTCMonth(), bjNow.getUTCDate()) - 8 * 3600_000
      const at = new Date(now - 61 * 60_000)
      if (at.getTime() > dayStart) {
        await prisma.tenantNotice.updateMany({ where: { tenantId: T.id, emailedAt: { not: null } }, data: { emailedAt: at } })
        const have = await prisma.tenantNotice.count({ where: { tenantId: T.id, emailedAt: { not: null } } })
        await filler(perDay - have, at, 'D')
        mails.length = 0
        await notice.emitTenantNotice(null, { tenantId: T.id, kind: 'STATEMENT', title: 'itest 日限', dedupeKey: `p2:${RUN}:day` })
        await notice.waitTenantNoticePushesForTest()
        check(`当天已发 ${perDay} 封（最近 1 小时 0 封）→ 不再发`, mails.length === 0 && !!(await prisma.tenantNotice.findFirst({ where: { dedupeKey: `p2:${RUN}:day`, emailedAt: null } })))
        check('日限超出仍只有一条说明', (await prisma.tenantNotice.count({ where: { tenantId: T.id, dedupeKey: { startsWith: `mailcap:${T.id}:` } } })) === 1)
      } else {
        console.log('  - 北京时间刚过零点不足 1 小时，跳过日限用例')
      }
      await prisma.tenantNotice.deleteMany({ where: { tenantId: T.id, dedupeKey: { startsWith: `p2fill:${RUN}:` } } })
      await prisma.tenantNotice.updateMany({ where: { tenantId: T.id }, data: { emailedAt: null } })
      await prisma.tenant.update({ where: { id: T.id }, data: { noticeEmailOn: false, noticeEmail: null, noticeWecomOn: true } })
    }

    // =======================================================================
    section('P2-4 设置中心接口（OWNER）')
    {
      const g = await callRoute(RF(rSettings.GET), { ...OWNER, method: 'GET', path: '/api/partner/settings' })
      check('GET settings → 200，带 transport 与 contact', g.status === 200 && !!g.json?.data?.transport && !!g.json?.data?.contact, g.text.slice(0, 200))
      check('transport 默认：企业微信开、邮箱关、无地址', g.json?.data?.transport?.noticeWecomOn === true && g.json?.data?.transport?.noticeEmailOn === false && g.json?.data?.transport?.noticeEmail === null)
      const keys = collectKeys(g.json?.data).map((k) => k.key)
      const bad = keys.filter((k) => !selects.PARTNER_ALLOWED_KEYS.has(k))
      check('GET settings 的键全在允许键表里', bad.length === 0, bad.join(','))
      check('通知偏好含两种新类型', g.json?.data?.noticePrefs?.CUSTOMER_JOINED === true && g.json?.data?.noticePrefs?.ORDER_DELIVERED === true)

      const put = (route: unknown, p: string, body: unknown) => callRoute(RF(route), { ...OWNER, method: 'PUT', path: p, body })
      const post = (route: unknown, p: string, body?: unknown) => callRoute(RF(route), { ...OWNER, method: 'POST', path: p, body })

      const r0 = await put(rTransport.PUT, '/api/partner/settings/transport', { emailOn: true })
      check('没有通知邮箱就打开邮箱推送 → 400', r0.status === 400 && /通知邮箱/.test(r0.json?.error || ''), r0.text.slice(0, 200))
      check('transport 多给键（noticeEmail）→ 400', (await put(rTransport.PUT, '/api/partner/settings/transport', { emailOn: false, noticeEmail: 'x@y.com' })).status === 400)
      check('transport 空体 → 400', (await put(rTransport.PUT, '/api/partner/settings/transport', {})).status === 400)

      const c0 = await post(rNoticeCode.POST, '/api/partner/settings/notice-email/code', { email: owner.email.toUpperCase() })
      check('登录邮箱（大小写不同）→ needCode=false、不发信', c0.status === 200 && c0.json?.data?.needCode === false && c0.json?.data?.sent === false, c0.text.slice(0, 200))
      const s0 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: owner.email })
      check('登录邮箱直接保存', s0.status === 200 && s0.json?.data?.transport?.noticeEmail === owner.email.toLowerCase(), s0.text.slice(0, 200))
      const r1 = await put(rTransport.PUT, '/api/partner/settings/transport', { emailOn: true, wecomOn: false })
      check('打开邮箱推送、关企业微信 → 200', r1.status === 200 && r1.json?.data?.transport?.noticeEmailOn === true && r1.json?.data?.transport?.noticeWecomOn === false)
      const aud = await prisma.auditEvent.findFirst({ where: { tenantId: T.id, action: 'settings.notice_transport' }, orderBy: { id: 'desc' } })
      check('开关写审计 settings.notice_transport（只记变化）', !!aud && JSON.stringify(aud.diff).includes('emailOn') && JSON.stringify(aud.diff).includes('wecomOn'))
      const wt = await post(rWebhookTest.POST, '/api/partner/settings/webhook/test')
      check('企业微信推送关着时「发送测试」→ 400', wt.status === 400 && /企业微信推送已关闭/.test(wt.json?.error || ''), wt.text.slice(0, 200))
      await put(rTransport.PUT, '/api/partner/settings/transport', { wecomOn: true })
      wecom.length = 0
      mails.length = 0
      const wt2 = await post(rWebhookTest.POST, '/api/partner/settings/webhook/test')
      await notice.waitTenantNoticePushesForTest()
      check('企业微信测试只推企业微信（不发测试标题带「微信」的邮件）', wt2.status === 204 && wecom.length === 1 && mails.length === 0, `${wt2.status} wecom=${wecom.length} mails=${mails.length}`)

      const other = mail('p2other')
      extraEmails.push(other)
      const c1 = await post(rNoticeCode.POST, '/api/partner/settings/notice-email/code', { email: other })
      check('非登录邮箱发码：平台未配置发信 → 503', c1.status === 503, c1.text.slice(0, 200))
      const s1 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: other })
      check('非登录邮箱不带验证码 → 400', s1.status === 400 && /验证码/.test(s1.json?.error || ''))
      const s2 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: other, code: '000000' })
      check('错误验证码 → 400', s2.status === 400)
      const code = await verify.createCode(other, 'NOTICE')
      const regCode = await verify.createCode(other, 'REGISTER')
      const s3 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: other, code: regCode })
      check('REGISTER 用途的码不能拿来绑通知邮箱', s3.status === 400)
      const s4 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: other, code })
      check('NOTICE 验证码正确 → 保存', s4.status === 200 && s4.json?.data?.transport?.noticeEmail === other, s4.text.slice(0, 200))
      const s5 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: other, code })
      check('同一张码不能再用', s5.status === 400)
      const auds = await prisma.auditEvent.findMany({ where: { tenantId: T.id, action: 'settings.notice_email' } })
      check('通知邮箱写审计，diff 不含地址', auds.length >= 2 && auds.every((a) => !JSON.stringify(a.diff).includes('@')))

      const t0 = await post(rNoticeTest.POST, '/api/partner/settings/notice-email/test')
      check('邮件测试：平台未配置发信 → 503（同步告诉结果）', t0.status === 503, t0.text.slice(0, 200))

      const s6 = await put(rNoticeEmail.PUT, '/api/partner/settings/notice-email', { email: null })
      check('清除通知邮箱 → 邮箱推送一并关闭', s6.status === 200 && s6.json?.data?.transport?.noticeEmail === null && s6.json?.data?.transport?.noticeEmailOn === false)
      const t1 = await post(rNoticeTest.POST, '/api/partner/settings/notice-email/test')
      check('没有通知邮箱时邮件测试 → 400', t1.status === 400)

      // 非成员（买家）碰设置接口 → 404
      const nb = await callRoute(RF(rTransport.PUT), { host: T.host, token: signTestToken(buyer, T.code, T.id), method: 'PUT', path: '/api/partner/settings/transport', body: { wecomOn: false } })
      check('非成员 → 404', nb.status === 404)
      // 暂停营业：写接口只读
      await prisma.tenant.update({ where: { id: T.id }, data: { status: 'SUSPENDED' } })
      invalidateStorefrontCache()
      const sus = await put(rTransport.PUT, '/api/partner/settings/transport', { wecomOn: false })
      check('暂停营业 → 推送方式只读（非 2xx）', sus.status >= 400, String(sus.status))
      await prisma.tenant.update({ where: { id: T.id }, data: { status: 'ACTIVE' } })
      invalidateStorefrontCache()
    }

    // =======================================================================
    section('P2-5 前台文案与邮件模板')
    {
      const nv = readFileSync(path.join(process.cwd(), 'src/components/partner/notices/notices-view.tsx'), 'utf8')
      check('notices-view 的类型中文名取 types.ts 的 TENANT_NOTICE_KIND_LABEL', /NOTICE_KIND_TEXT[^=]*=\s*\{\s*\.\.\.TENANT_NOTICE_KIND_LABEL\s*\}/.test(nv))
      check('notices-view 有客户详情链接', nv.includes("case 'customer':"))
      check('每种通知类型都有中文名', types.TENANT_NOTICE_KINDS.every((k) => !!types.TENANT_NOTICE_KIND_LABEL[k]))
      const { findBannedWord } = await import('../../src/lib/marketing/lint')
      const sub = types.TENANT_NOTICE_KINDS.map((k) => mailMod.renderTenantNoticeEmail({ kind: k, title: 'x', refKey: 'ABC123', path: '/partner/orders/ABC123' }, { origin: T.origin }).subject)
      check('每种类型的邮件主题都不含禁发词', sub.every((s) => findBannedWord(s) === null), sub.filter((s) => findBannedWord(s)).join(','))
      const wx = mailMod.renderTenantNoticeEmail({ kind: 'TENANT_STATUS', title: '企业微信推送测试', body: '收到即表示…' }, { origin: T.origin })
      check('标题带「微信」的通知进邮件 → 摘要降级', wx.html.includes(mailMod.TENANT_NOTICE_MAIL_FALLBACK) && !wx.html.includes('企业微信推送测试'))
    }
  } finally {
    notice.setTenantNoticeTransportForTest(null)
    notice.setTenantNoticeMailerForTest(null)
    await notice.waitTenantNoticePushesForTest().catch(() => undefined)
    // 只删本脚本建的行
    const regUsers = await prisma.user.findMany({ where: { email: { in: extraEmails } }, select: { id: true } })
    const uIds = users.map((u) => u.id).concat(regUsers.map((u) => u.id))
    const tIds = tenants.map((t) => t.id)
    const orders = await prisma.order.findMany({ where: { OR: [{ tenantId: { in: tIds } }, { productId: { in: productIds } }, { userId: { in: uIds } }] }, select: { id: true } })
    const oIds = orders.map((o) => o.id)
    try {
      await prisma.auditEvent.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { actorUserId: { in: uIds } }] } })
      await prisma.tenantNotice.deleteMany({ where: { tenantId: { in: tIds } } })
      await prisma.tenantAfterSale.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { orderId: { in: oIds } }] } })
      await prisma.tenantLedgerEntry.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { orderId: { in: oIds } }] } })
      await prisma.tenantCustomer.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
      await prisma.tenantMember.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
      await prisma.tenantListing.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { productId: { in: productIds } }] } })
      await prisma.tenantDomain.deleteMany({ where: { tenantId: { in: tIds } } })
      const cards = await prisma.cardKey.findMany({ where: { productId: { in: productIds } }, select: { id: true } })
      await prisma.redeemLog.deleteMany({ where: { cardKeyId: { in: cards.map((c) => c.id) } } })
      await prisma.cardKey.deleteMany({ where: { productId: { in: productIds } } })
      await prisma.orderMessage.deleteMany({ where: { orderId: { in: oIds } } })
      await prisma.payment.deleteMany({ where: { orderId: { in: oIds } } })
      await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oIds } } })
      await prisma.referralReward.deleteMany({ where: { orderId: { in: oIds } } })
      await prisma.order.deleteMany({ where: { id: { in: oIds } } })
      await prisma.product.deleteMany({ where: { id: { in: productIds } } })
      if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } })
      await prisma.marketingConsentLog.deleteMany({ where: { userId: { in: uIds } } })
      // 只删本脚本用过的地址（别的包也在用同一个测试域名发码）
      await prisma.emailCode.deleteMany({ where: { email: { in: users.map((u) => u.email).concat(extraEmails) } } })
      await prisma.user.deleteMany({ where: { id: { in: uIds } } })
      await prisma.tenant.deleteMany({ where: { id: { in: tIds } } })
    } catch (e) {
      console.error('清理失败（可稍后跑 cleanupAll 兜底）', e)
    }
    srv.close()
  }
  const { fail } = summary()
  await prisma.$disconnect()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
