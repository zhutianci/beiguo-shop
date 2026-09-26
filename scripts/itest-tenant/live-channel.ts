/**
 * 渠道分站 · 本地生产构建的 HTTP 主链路冒烟（集成阶段，WP8 名下）。打**运行中的站点**（next start），不是进程内调用：
 * 覆盖 middleware、Host 解析、cookie、同源校验、cron 密钥这些进程内 itest 碰不到的层。
 *
 *   前置：
 *     1) npx next build
 *     2) 开发库已按 WP8 种子建好 lulu（docker exec -i ai-shop-mysql mysql … beiguo_dev < scripts/sql/tenant-seed.sql）
 *     3) 起服务（渠道开关打开、数据密钥就位；平台 webhook 指向本脚本起的假服务器，二期 M3 要数站长群收到了什么）：
 *        CHANNELS_ENABLED=1 TENANT_DATA_KEY=<64 位 hex> VMQ_KEY=local-test-key CARDKEY_SECRET=local-itest-cardkey-secret \
 *          WECOM_WEBHOOK_URL=http://127.0.0.1:39123/hook node node_modules/next/dist/bin/next start -p 3000
 *   运行：
 *     DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" ITEST_BASE=http://localhost:3000 \
 *       VMQ_KEY=local-test-key CARDKEY_SECRET=local-itest-cardkey-secret \
 *       npx tsx scripts/itest-tenant/live-channel.ts [--keep]
 *     （CRON_SECRET 不用传：默认读 .env.local，与 next start 加载的是同一份。假 webhook 端口可用 LIVE_HOOK_PORT 改）
 *
 * 主链路：DRAFT 前台 404 → 站长开业、授权、定进货价、录收款账号、邀请渠道主 → 渠道主在渠道站注册并接受邀请、定售价上架
 *   → 买家在渠道站注册、下单两张（一张结账开票）、付款到账、自动发卡 → 计提（逐分核对设计 10.11）→ 站长开票 → 解冻
 *   → 渠道申请结算 → 站长认领、登记打款 → 渠道看到已打款。
 * 可见性：渠道后台只见本站、对本站客户邮箱不打码；站长后台看全部并标来源站；跨 Host 令牌不通用。
 * 二期（docs/多渠道分销-二期改动.md，第 10–13 节）：M1 渠道前台销量 = Product.sales、两站首页累计销量相同；
 *   M2 站长后台渠道单利润 = 进货净额 − 成本；M3 渠道的纯通知不再推站长群（人工发货 / 待补发照推并带 [lulu]）、推送方式设置；
 *   M4 渠道客服信息在前台生效、清空后回退主站、主站不变。
 *
 * 测试手段上的两处「快进时间」（生产上靠真实时间流逝）：付款后把两张单的 delivered_at 改到 16 天前（冻结期 15 天）；
 * 录入收款账号后把 payee_changed_at 改到 4 天前（冷静期 72 小时）。除此之外全部走 HTTP。
 * 跑完删掉本次建的一切（含种子里的 lulu 行与域名，恢复成只有主站），--keep 则保留现场便于人工翻看。
 * 库名不含 dev / test 拒绝执行。
 */
import http from 'http'
import { readFileSync, existsSync, rmSync } from 'fs'
import path from 'path'
import { PrismaClient, Prisma } from '@prisma/client'
import { encryptCardContent, cardContentHash } from '../../src/lib/cardkey'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库`)
  process.exit(2)
}

const ROOT = path.resolve(__dirname, '../..')
function envLocal(key: string): string {
  const f = path.join(ROOT, '.env.local')
  if (!existsSync(f)) return ''
  const m = new RegExp(`^${key}=(.*)$`, 'm').exec(readFileSync(f, 'utf8'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}
const BASE = new URL(process.env.ITEST_BASE || 'http://localhost:3000')
const VMQ_TOKEN = process.env.VMQ_KEY || envLocal('VMQ_KEY')
const CRON_SECRET = process.env.CRON_SECRET || envLocal('CRON_SECRET')
const KEEP = process.argv.includes('--keep')
const MAIN_HOST = 'localhost'
const LULU_HOST = 'lulu.bigolab.com'
const LULU_ID = 2
const RUN = Date.now().toString(36)
const PW = 'Test123456'
const MAIL = (n: string) => `live-${n}-${RUN}@itest-live.local`
const NAME = `ITEST-LIVE ${RUN}`

const prisma = new PrismaClient()
type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any

// ---------------------------------------------------------------------------
// 假的平台 webhook（二期 M3）：站点以 WECOM_WEBHOOK_URL=http://127.0.0.1:<端口>/hook 启动，notify() 发来的每条都记下。
// 地址不是 qyapi / dingtalk，notify 走通用 JSON 格式（title / text 字段），这里按原文存。
// ---------------------------------------------------------------------------
const HOOK_PORT = Number(process.env.LIVE_HOOK_PORT || 39123)
const hooks: { title: string; text: string }[] = []
const hookServer = http.createServer((rq, rs) => {
  const chunks: Buffer[] = []
  rq.on('data', (c) => chunks.push(c))
  rq.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    let j: Json = null
    try {
      j = JSON.parse(raw)
    } catch {
      /* 非 JSON 也记原文 */
    }
    hooks.push({ title: String(j?.title ?? ''), text: String(j?.text ?? raw) })
    rs.writeHead(200, { 'content-type': 'application/json' })
    rs.end('{"errcode":0}')
  })
})

let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
const section = (s: string) => console.log(`\n【${s}】`)

// ---------------------------------------------------------------------------
// HTTP：用 node:http 发，才能自己定 Host 头（fetch 会按 URL 覆盖 Host）
// ---------------------------------------------------------------------------
interface Res {
  status: number
  json: Json
  text: string
  cookies: string[]
  location: string | null
}
let ipSeq = 0
function req(
  method: string,
  p: string,
  o: { host: string; token?: string | null; body?: unknown; headers?: Record<string, string>; ip?: string } = { host: MAIN_HOST },
): Promise<Res> {
  const body = o.body === undefined ? undefined : typeof o.body === 'string' ? o.body : JSON.stringify(o.body)
  const headers: Record<string, string> = {
    host: o.host,
    // 每次换一个客户端 IP：partnerRoute / 登录都有按 IP 的限频
    'cf-connecting-ip': o.ip ?? `10.66.${(++ipSeq >> 8) & 255}.${ipSeq & 255}`,
    ...(o.token ? { cookie: `token=${o.token}` } : {}),
    ...(body !== undefined ? { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) } : {}),
    ...(o.headers || {}),
  }
  return new Promise((resolve, reject) => {
    const r = http.request({ hostname: BASE.hostname, port: BASE.port || 80, path: p, method, headers }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let json: Json = null
        try {
          json = JSON.parse(text)
        } catch {
          /* 非 JSON（页面） */
        }
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode || 0, json, text, cookies: Array.isArray(sc) ? sc : sc ? [sc] : [], location: (res.headers.location as string) || null })
      })
    })
    r.on('error', reject)
    if (body !== undefined) r.write(body)
    r.end()
  })
}
const get = (p: string, host: string, token?: string | null, headers?: Record<string, string>) => req('GET', p, { host, token, headers })
const post = (p: string, host: string, token: string | null, body?: unknown, headers?: Record<string, string>) => req('POST', p, { host, token, body: body ?? {}, headers })
const patch = (p: string, host: string, token: string | null, body: unknown) => req('PATCH', p, { host, token, body })
const put = (p: string, host: string, token: string | null, body: unknown) => req('PUT', p, { host, token, body })
const tokenOf = (r: Res): string => {
  const c = r.cookies.map((x) => x.split(';')[0]).find((x) => x.startsWith('token='))
  return c ? c.slice(6) : String(r.json?.data?.token || '')
}
const short = (r: Res) => `${r.status} ${r.text.slice(0, 240)}`
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

// ---------------------------------------------------------------------------
// 清理：本次建的一切 + 种子里的 lulu（恢复成只有主站，其他 itest 的前提）
// ---------------------------------------------------------------------------
async function cleanup(productId: number | null) {
  const users = await prisma.user.findMany({ where: { email: { endsWith: '@itest-live.local' } }, select: { id: true } })
  const uIds = users.map((u) => u.id)
  const pIds = productId ? [productId] : (await prisma.product.findMany({ where: { name: { startsWith: 'ITEST-LIVE' } }, select: { id: true } })).map((p) => p.id)
  const orders = await prisma.order.findMany({ where: { OR: [{ userId: { in: uIds } }, { tenantId: LULU_ID }, { productId: { in: pIds } }] }, select: { id: true, orderNo: true } })
  const oIds = orders.map((o) => o.id)
  const exts = await prisma.externalOrder.findMany({
    where: { OR: [{ shopOrderId: { in: oIds } }, { sourceKey: { in: oIds.map((i) => `order:${i}`) } }, { tenantId: LULU_ID }] },
    select: { id: true },
  })
  const eIds = exts.map((e) => e.id)
  const invs = await prisma.invoice.findMany({ where: { OR: [{ shopOrderId: { in: oIds } }, { externalOrderId: { in: eIds } }, { tenantId: LULU_ID }] }, select: { id: true } })
  const iIds = invs.map((i) => i.id)
  const stmts = await prisma.tenantStatement.findMany({ where: { tenantId: LULU_ID }, select: { id: true } })
  const sIds = stmts.map((s) => s.id)
  const vmq = await prisma.vmqOrder.findMany({ where: { OR: [{ bizType: 'order', bizId: { in: oIds } }, { bizType: 'invoice', bizId: { in: iIds } }] }, select: { orderId: true } })

  await prisma.auditEvent.deleteMany({ where: { OR: [{ tenantId: LULU_ID }, { actorUserId: { in: uIds } }] } })
  await prisma.tenantNotice.deleteMany({ where: { tenantId: LULU_ID } })
  await prisma.tenantAfterSale.deleteMany({ where: { tenantId: LULU_ID } })
  await prisma.tenantStatementLine.deleteMany({ where: { statementId: { in: sIds } } })
  await prisma.tenantPayout.deleteMany({ where: { OR: [{ tenantId: LULU_ID }, { statementId: { in: sIds } }] } })
  await prisma.tenantStatement.deleteMany({ where: { id: { in: sIds } } })
  await prisma.tenantLedgerEntry.deleteMany({ where: { OR: [{ tenantId: LULU_ID }, { orderId: { in: oIds } }] } })
  await prisma.tenantCustomer.deleteMany({ where: { OR: [{ tenantId: LULU_ID }, { userId: { in: uIds } }] } })
  await prisma.tenantMember.deleteMany({ where: { OR: [{ tenantId: LULU_ID }, { userId: { in: uIds } }] } })
  await prisma.tenantInvite.deleteMany({ where: { tenantId: LULU_ID } })
  await prisma.tenantListing.deleteMany({ where: { OR: [{ tenantId: LULU_ID }, { productId: { in: pIds } }] } })
  await prisma.tenantDomain.deleteMany({ where: { tenantId: LULU_ID } })
  await prisma.vmqLock.deleteMany({ where: { orderId: { in: vmq.map((v) => v.orderId) } } })
  await prisma.vmqOrder.deleteMany({ where: { orderId: { in: vmq.map((v) => v.orderId) } } })
  await prisma.payment.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.receipt.deleteMany({ where: { OR: [{ shopOrderId: { in: oIds } }, { externalOrderId: { in: eIds } }] } })
  await prisma.invoice.deleteMany({ where: { id: { in: iIds } } })
  await prisma.externalOrder.deleteMany({ where: { id: { in: eIds } } })
  const cards = await prisma.cardKey.findMany({ where: { productId: { in: pIds } }, select: { id: true } })
  await prisma.redeemLog.deleteMany({ where: { cardKeyId: { in: cards.map((c) => c.id) } } })
  await prisma.cardKey.deleteMany({ where: { productId: { in: pIds } } })
  await prisma.orderMessage.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oIds } } })
  await prisma.order.deleteMany({ where: { id: { in: oIds } } })
  await prisma.product.deleteMany({ where: { id: { in: pIds } } })
  await prisma.category.deleteMany({ where: { name: { startsWith: 'ITEST-LIVE' } } })
  await prisma.invoiceTitle.deleteMany({ where: { userId: { in: uIds } } }).catch(() => undefined)
  await prisma.emailCode.deleteMany({ where: { email: { endsWith: '@itest-live.local' } } })
  await prisma.user.deleteMany({ where: { id: { in: uIds } } })
  await prisma.setting.deleteMany({ where: { key: { startsWith: 'vmq_unmatched:' }, value: { contains: RUN } } })
  // 二期 M4：中途失败时二维码文件可能还在 public/uploads/contact/（只删库里记录的、形状合规的那一个）
  const qr = await prisma.tenant.findUnique({ where: { id: LULU_ID }, select: { supportQrUrl: true } })
  if (qr?.supportQrUrl && /^\/uploads\/contact\/[0-9a-z-]+\.(png|jpg|webp)$/.test(qr.supportQrUrl)) rmSync(path.join(ROOT, 'public', qr.supportQrUrl), { force: true })
  await prisma.tenant.deleteMany({ where: { id: LULU_ID } })
}

async function payOrder(orderNo: string, token: string): Promise<{ really: string; ok: boolean }> {
  const pay = await post('/api/pay/vmq/create', LULU_HOST, token, { orderNo })
  const really = String(pay.json?.data?.reallyPrice ?? '')
  if (!pay.json?.success || !really) return { really, ok: false }
  const n = await post('/api/pay/sms-notify', MAIN_HOST, null, { token: VMQ_TOKEN, from: 'com.eg.android.AlipayGphone', content: `支付宝 你已成功收款${really}元。` })
  if (n.status !== 200) return { really, ok: false }
  for (let i = 0; i < 30; i++) {
    const o = await prisma.order.findUnique({ where: { orderNo }, select: { payStatus: true, deliveryStatus: true, settleState: true } })
    if (o?.payStatus === 'PAID' && o.deliveryStatus === 'DELIVERED' && o.settleState) return { really, ok: true }
    await sleep(500)
  }
  return { really, ok: false }
}

async function main() {
  await new Promise<void>((res, rej) => hookServer.once('error', rej).listen(HOOK_PORT, '127.0.0.1', () => res()))
  if (!VMQ_TOKEN) throw new Error('需要 VMQ_KEY（与站点一致）')
  if (!CRON_SECRET) throw new Error('需要 CRON_SECRET（与站点一致；默认读 .env.local）')
  const up = await get('/robots.txt', MAIN_HOST).catch(() => null)
  if (!up || up.status !== 200) throw new Error(`站点没起来：${BASE.href}`)

  section('0 前提：WP8 种子已建 lulu（id=2、CHANNEL、DRAFT）且渠道开关已打开')
  const lulu0 = await prisma.tenant.findUnique({ where: { id: LULU_ID } })
  check('种子：lulu 是 id=2 的 CHANNEL、DRAFT', lulu0?.code === 'lulu' && lulu0.kind === 'CHANNEL' && lulu0.status === 'DRAFT', JSON.stringify(lulu0 && { code: lulu0.code, kind: lulu0.kind, status: lulu0.status }))
  if (!lulu0) throw new Error('先跑 scripts/sql/tenant-seed.sql')
  const robotsLulu = await get('/robots.txt', LULU_HOST)
  check('渠道开关已开：lulu 的 robots.txt 与主站不同（noindex 口径）', robotsLulu.status === 200 && robotsLulu.text !== (await get('/robots.txt', MAIN_HOST)).text, robotsLulu.text.slice(0, 80))

  section('1 DRAFT：前台对未登录者整站「本站暂停访问」（接口 404）；渠道后台登录页可达；主站 Host 上 /partner 404、渠道 Host 上 /admin 404')
  // 站长 2026-09-26：开业前公网所见须与 nginx 停业页一致，DRAFT 前台由 404 改为暂停访问页（(shop)/layout.tsx）
  for (const p of ['/', '/products', '/products/1', '/login', '/register', '/orders']) {
    const r = await get(p, LULU_HOST)
    check(`DRAFT：lulu ${p} → 200「本站暂停访问」`, r.status === 200 && r.text.includes('本站暂停访问'), `${r.status}`)
  }
  check('DRAFT：暂停访问页不泄露商品数据（不含 "price"、不含主站商品名链接）', !(await get('/', LULU_HOST)).text.includes('/products/'))
  // 商品接口在 DRAFT 对非预览访客返回空列表（可售判定：DRAFT 只对预览账号展示，WP2 listStorefrontProducts），不泄露任何商品
  const draftApi = await get('/api/products', LULU_HOST)
  check('DRAFT：lulu /api/products → 空列表', draftApi.status === 200 && /"data":\[\]/.test(draftApi.text), `${draftApi.status} ${draftApi.text.slice(0, 60)}`)
  check('DRAFT：lulu /partner/login 200', (await get('/partner/login', LULU_HOST)).status === 200)
  check('主站 /partner → 404', (await get('/partner', MAIN_HOST)).status === 404)
  check('主站 /api/partner/dashboard → 404', (await get('/api/partner/dashboard', MAIN_HOST)).status === 404)
  check('lulu /admin → 404（middleware 按 PLATFORM_HOSTS 分流）', (await get('/admin', LULU_HOST)).status === 404)
  check('lulu /api/admin/stats → 404', (await get('/api/admin/stats', LULU_HOST)).status === 404)

  section('2 站长：主站登录后台、建商品、开业、授权、定进货价、录收款账号、邀请渠道主')
  const al = await post('/api/auth/login', MAIN_HOST, null, { email: 'admin@demo.local', password: PW })
  const admin = tokenOf(al)
  check('站长在主站登录（aud=main）', al.json?.success === true && !!admin, short(al))
  const adminOnLulu = await post('/api/auth/login', LULU_HOST, null, { email: 'admin@demo.local', password: PW })
  check('站长在渠道站登录 → 拒绝签发', adminOnLulu.json?.success === false && !tokenOf(adminOnLulu), short(adminOnLulu))

  const cat = await prisma.category.create({ data: { name: NAME, sortOrder: 999 } })
  // sales 起始 50：模拟主站已卖出的量。二期 M1 要求渠道前台显示全站 Product.sales（50 + 本店卖出），不是本店 TenantListing.sales
  const product = await prisma.product.create({ data: { categoryId: cat.id, name: `${NAME} 月卡`, price: new Prisma.Decimal('140.00'), stock: 5, deliveryType: 'AUTO', status: 1, sales: 50 } })
  for (let i = 0; i < 5; i++) {
    const s = `LIVE-${RUN}-${i}-CARD`
    await prisma.cardKey.create({ data: { productId: product.id, content: encryptCardContent(s), contentHash: cardContentHash(s), cost: new Prisma.Decimal('100.00') } })
  }

  const early = await patch(`/api/admin/tenants/${LULU_ID}`, MAIN_HOST, admin, { status: 'ACTIVE' })
  check('还没有渠道主时不能开业（409）', early.status === 409, short(early))
  const grant = await put(`/api/admin/tenants/${LULU_ID}/listings`, MAIN_HOST, admin, { productId: product.id, granted: true, supplyCents: 11000 })
  check('站长授权商品、进货价 110.00', grant.json?.success === true, short(grant))
  const payee = await put(`/api/admin/tenants/${LULU_ID}/payee`, MAIN_HOST, admin, { name: '测试收款人', method: 'ALIPAY', account: '13800001111' })
  check('站长录入收款账号（TENANT_DATA_KEY 已配置）', payee.json?.success === true, short(payee))
  const t1 = await prisma.tenant.findUniqueOrThrow({ where: { id: LULU_ID } })
  check('收款账号落库为密文 + 掩码，不存明文', !!t1.payeeAccountEnc && !t1.payeeAccountEnc.includes('13800001111') && t1.payeeAccountEnc.startsWith('v1.') && t1.payeeAccountMasked === '138****1111', `${t1.payeeAccountMasked}`)
  const reveal = await post(`/api/admin/tenants/${LULU_ID}/payee`, MAIN_HOST, admin, { action: 'reveal' })
  check('站长查看收款账号明文（经数据密钥解密）', JSON.stringify(reveal.json).includes('13800001111'), short(reveal))
  // 快进：收款信息冷静期 72 小时
  await prisma.tenant.update({ where: { id: LULU_ID }, data: { payeeChangedAt: new Date(Date.now() - 4 * 86400_000) } })

  const ownerEmail = MAIL('owner')
  const inv = await post(`/api/admin/tenants/${LULU_ID}/invites`, MAIN_HOST, admin, { email: ownerEmail })
  const link = String(inv.json?.data?.link || '')
  const inviteToken = link.split('/partner/invite/')[1] || ''
  check('站长邀请渠道主：本地未配邮件 → 返回链接供手动转发，链接指向渠道 origin', inv.json?.success === true && link.startsWith('https://lulu.bigolab.com/partner/invite/') && !!inviteToken, short(inv))

  section('3 渠道主（DRAFT 期）：渠道站不开放注册 → 在主站注册（同邮箱同账号），到渠道站 /partner/login 登录、接受邀请、定售价上架')
  const regLulu = await post('/api/auth/register', LULU_HOST, null, { email: ownerEmail, password: PW })
  check('DRAFT 期渠道站注册 → 403「本站暂不开放注册」', regLulu.status === 403, short(regLulu))
  const reg = await post('/api/auth/register', MAIN_HOST, null, { email: ownerEmail, password: PW })
  check('渠道主在主站注册', reg.json?.success === true, short(reg))
  const ownerUser = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } })
  check('注册站 registeredTenantId = 主站', ownerUser.registeredTenantId === 1)
  const ol = await post('/api/auth/login', LULU_HOST, null, { email: ownerEmail, password: PW })
  const owner = tokenOf(ol)
  check('同一账号在渠道站登录（aud=lulu）', ol.json?.success === true && !!owner, short(ol))
  const acc = await post('/api/partner/invite/accept', LULU_HOST, owner, { token: inviteToken })
  check('接受邀请 → 成为 OWNER', acc.status === 204 || acc.json?.success === true, short(acc))
  const dash0 = await get('/api/partner/dashboard', LULU_HOST, owner)
  check('渠道后台看板 200', dash0.status === 200 && dash0.json?.success === true, short(dash0))
  const catalog = await get('/api/partner/catalog', LULU_HOST, owner)
  const row = (catalog.json?.data?.rows || []).find((r: Json) => r.productId === product.id)
  check('商品池里有这件商品、进货价 110.00、主站价 140.00', row?.supplyCents === 11000 && row?.mainPriceCents === 14000, JSON.stringify(row)?.slice(0, 200))
  const lp = await patch(`/api/partner/listings/${row?.listingNo}`, LULU_HOST, owner, { retailYuan: '140', status: 1 })
  check('渠道定售价 140.00 并上架', lp.status === 200 || lp.status === 204 || lp.json?.success === true, short(lp))
  const csrf = await req('PATCH', `/api/partner/listings/${row?.listingNo}`, { host: LULU_HOST, token: owner, body: { retailYuan: '1' }, headers: { origin: 'https://bigolab.com', 'sec-fetch-site': 'same-site' } })
  check('兄弟子域发来的改价 → 404 且不生效', csrf.status === 404 && (await prisma.tenantListing.findFirstOrThrow({ where: { tenantId: LULU_ID, productId: product.id } })).retailCents === 14000, short(csrf))

  const open = await patch(`/api/admin/tenants/${LULU_ID}`, MAIN_HOST, admin, { status: 'ACTIVE', minPayoutCents: 2000 })
  check('站长把 lulu 改为 ACTIVE、最低结算 20 元（设计 10.11 ② 的演示配置）', open.json?.success === true, short(open))

  section('4 买家：渠道站注册、看到本店售价、下两张单（一张结账开票）、付款到账、自动发卡')
  const buyerEmail = MAIL('buyer')
  const breg = await post('/api/auth/register', LULU_HOST, null, { email: buyerEmail, password: PW })
  const buyer = tokenOf(breg)
  check('买家在 lulu 注册', breg.json?.success === true && !!buyer, short(breg))
  check('lulu 首页 200（ACTIVE）', (await get('/', LULU_HOST)).status === 200)
  const pd = await get(`/api/products/${product.id}`, LULU_HOST, buyer)
  check('渠道站商品详情：售价 140.00', Number(pd.json?.data?.price ?? pd.json?.data?.product?.price) === 140, short(pd))
  const oa = await post('/api/orders', LULU_HOST, buyer, { productId: product.id, quantity: 1, remark: '支付方式: 支付宝' })
  const orderA = String(oa.json?.data?.order?.orderNo || '')
  check('下单 A（不开票）', oa.json?.success === true && !!orderA, short(oa))
  const ob = await post('/api/orders', LULU_HOST, buyer, {
    productId: product.id,
    quantity: 1,
    remark: '支付方式: 支付宝',
    invoice: { title: '测试科技有限公司', taxNumber: '91110000MA00000000', email: buyerEmail, showAiWording: false },
  })
  const orderB = String(ob.json?.data?.order?.orderNo || '')
  check('下单 B（结账开票）', ob.json?.success === true && !!orderB, short(ob))
  const rowA = await prisma.order.findUniqueOrThrow({ where: { orderNo: orderA } })
  const rowB = await prisma.order.findUniqueOrThrow({ where: { orderNo: orderB } })
  check('订单 A 快照：tenantId=2、货款 140、进货价 110、费率 150bp', rowA.tenantId === LULU_ID && Number(rowA.amount) === 140 && rowA.supplyCents === 11000 && rowA.feeRateBp === 150, JSON.stringify({ t: rowA.tenantId, a: rowA.amount, s: rowA.supplyCents, f: rowA.feeRateBp }))
  check('订单 B：Order.amount 不含税（140），税费 8.40 另列；发票分成比例快照 200bp', Number(rowB.amount) === 140 && Number(rowB.invoiceTaxFee) === 8.4 && rowB.invoiceShareRateBp === 200, JSON.stringify({ a: rowB.amount, tax: rowB.invoiceTaxFee, r: rowB.invoiceShareRateBp }))
  const pa = await payOrder(orderA, buyer)
  check(`A 付款到账（唯一金额 ${pa.really}）→ 已付、已发卡、已计提`, pa.ok)
  const pb = await payOrder(orderB, buyer)
  check(`B 付款到账（唯一金额 ${pb.really}，货款 + 税费）→ 已付、已发卡、已计提`, pb.ok && Number(pb.really) >= 148.4 - 0.5, pb.really)

  section('5 计提：逐分核对设计 10.11（140 / 110 / 1.5%）')
  const va = (await get(`/api/partner/orders/${orderA}`, LULU_HOST, owner)).json?.data?.settlement
  check('A：货款 14000、进货款 11000、余额 3000、手续费 210、预计打款 2790（余额 30.00、打款 27.90）',
    va?.goodsCents === 14000 && Math.abs(va?.purchaseCents) === 11000 && va?.balanceCents === 3000 && Math.abs(va?.feeCents) === 210 && va?.payoutCents === 2790, JSON.stringify(va))
  const vb = (await get(`/api/partner/orders/${orderB}`, LULU_HOST, owner)).json?.data?.settlement
  check('B：发票分成 280、余额 3280、手续费 214、预计打款 3066（余额 32.80、打款 30.66）',
    vb?.invShareCents === 280 && vb?.balanceCents === 3280 && Math.abs(vb?.feeCents) === 214 && vb?.payoutCents === 3066, JSON.stringify(vb))
  const dash1 = (await get('/api/partner/dashboard', LULU_HOST, owner)).json?.data
  check('看板冻结中：余额 6280、预计打款 5856', dash1?.balances?.pending?.balanceCents === 6280 && dash1?.balances?.pending?.payoutCents === 5856, JSON.stringify(dash1?.balances))

  section('6 站长开票 → 解冻（快进冻结期）→ 可结算')
  const ivB = await prisma.invoice.findFirst({ where: { OR: [{ shopOrderId: rowB.id }, { sourceKey: `order:${rowB.id}` }] }, orderBy: { id: 'asc' } })
  check('B 的发票已建（SUBMITTED，tenantId=2）', ivB?.status === 'SUBMITTED' && ivB?.tenantId === LULU_ID, JSON.stringify(ivB && { s: ivB.status, t: ivB.tenantId }))
  if (ivB) {
    const iss = await patch(`/api/admin/invoices/${ivB.id}`, MAIN_HOST, admin, { status: 'ISSUED' })
    check('站长标记发票已开具', iss.json?.success === true, short(iss))
  }
  await prisma.order.updateMany({ where: { id: { in: [rowA.id, rowB.id] } }, data: { deliveredAt: new Date(Date.now() - 16 * 86400_000) } })
  const noSecret = await post('/api/cron/tenant-release', MAIN_HOST, null, {})
  check('cron 不带密钥 → 非 2xx', noSecret.status >= 400, String(noSecret.status))
  const rel = await post('/api/cron/tenant-release', MAIN_HOST, null, {}, { 'x-cron-secret': CRON_SECRET })
  check('cron 解冻：货款组 2 单、发票分成组 1 单', rel.json?.success === true && rel.json?.data?.released >= 2 && rel.json?.data?.releasedInv >= 1, short(rel))
  const sum1 = (await get('/api/partner/finance/summary', LULU_HOST, owner)).json?.data
  check('结算中心可结算：余额 6280、预计打款 5856（27.90 + 30.66 = 58.56）', sum1?.balances?.available?.balanceCents === 6280 && sum1?.balances?.available?.payoutCents === 5856, JSON.stringify(sum1?.balances))

  section('7 渠道申请结算 → 站长认领、登记打款 → 渠道看到已打款')
  const ap = await post('/api/partner/finance/apply', LULU_HOST, owner, { requestId: `live${RUN}apply` })
  const statementNo = String(ap.json?.data?.statementNo || '')
  check('申请结算 → 出单，打款额 5856', ap.json?.data?.ok === true && ap.json?.data?.netCents === 5856, short(ap))
  const st = await prisma.tenantStatement.findFirst({ where: { tenantId: LULU_ID, statementNo } })
  check('结算单快照收款账号（掩码）', st?.payeeAccountMasked === '138****1111', JSON.stringify(st && { m: st.payeeAccountMasked, s: st.state }))
  if (st) {
    const pay1 = await post(`/api/admin/statements/${st.id}/paying`, MAIN_HOST, admin, {})
    check('站长认领打款（GENERATED → PAYING）', pay1.json?.success === true, short(pay1))
    const po = await post(`/api/admin/statements/${st.id}/payout`, MAIN_HOST, admin, {
      amountCents: 5856,
      withholdCents: 0,
      method: 'ALIPAY',
      externalTradeNo: `LIVE${RUN}`,
      paidAt: new Date().toISOString(),
      voucherType: 'INVOICE',
      partnerInvoiceNo: `LIVEINV${RUN}`,
      partnerInvoiceAmountCents: 5856,
    })
    check('站长登记打款 58.56（PAYING → PAID）', po.json?.success === true, short(po))
  }
  const sum2 = (await get('/api/partner/finance/summary', LULU_HOST, owner)).json?.data
  check('渠道：累计打款 5856、可结算归零、结算中为 0', sum2?.balances?.paidTotalCents === 5856 && sum2?.balances?.available?.payoutCents === 0 && sum2?.balances?.inPayoutCents === 0, JSON.stringify(sum2?.balances))
  const sl = (await get('/api/partner/finance/statements', LULU_HOST, owner)).json?.data?.rows || []
  check('渠道结算单列表：该单已打款', sl.some((r: Json) => r.statementNo === statementNo && r.state === 'PAID'), JSON.stringify(sl).slice(0, 200))

  section('8 可见性：渠道只见本站、本站数据不打码；站长看全部并标来源站；令牌不跨站')
  const custs = (await get('/api/partner/customers', LULU_HOST, owner)).json?.data
  const custRows: Json[] = custs?.rows || custs?.list || []
  check('渠道客户列表：本站买家邮箱明文（不打码）', custRows.some((c) => JSON.stringify(c).includes(buyerEmail)), JSON.stringify(custs).slice(0, 200))
  const pOrders = (await get('/api/partner/orders', LULU_HOST, owner)).json?.data
  const pRows: Json[] = pOrders?.rows || pOrders?.list || []
  const mainOrderNos = new Set((await prisma.order.findMany({ where: { tenantId: 1 }, select: { orderNo: true }, take: 500, orderBy: { id: 'desc' } })).map((o) => o.orderNo))
  check('渠道订单列表：只有本站两单，没有任何主站单', pRows.length === 2 && pRows.every((r) => r.orderNo === orderA || r.orderNo === orderB) && !pRows.some((r) => mainOrderNos.has(r.orderNo)), JSON.stringify(pRows.map((r) => r.orderNo)))
  check('渠道订单列表：买家邮箱明文', JSON.stringify(pRows).includes(buyerEmail))
  const aAll = (await get(`/api/admin/orders?page=1&pageSize=50&search=${encodeURIComponent(orderA)}`, MAIN_HOST, admin)).json?.data
  const aRow = (aAll?.orders || aAll?.list || []).find((r: Json) => r.orderNo === orderA)
  check('站长订单列表（全部）：能看到渠道单并标来源站 lulu', aRow?.source?.code === 'lulu', JSON.stringify(aRow?.source))
  const aLulu = (await get(`/api/admin/orders?page=1&pageSize=50&tenantId=${LULU_ID}`, MAIN_HOST, admin)).json?.data
  const aLuluRows: Json[] = aLulu?.orders || aLulu?.list || []
  check('站长按来源站筛 lulu：恰好这两单', aLuluRows.length === 2 && aLuluRows.every((r) => r.source?.code === 'lulu'), JSON.stringify(aLuluRows.map((r) => r.orderNo)))
  check('买家的 lulu 令牌在主站 Host → 视为未登录（401）', (await get('/api/orders', MAIN_HOST, buyer)).status === 401)
  const bOrdersLulu = (await get('/api/orders?page=1&pageSize=10', LULU_HOST, buyer)).json?.data
  check('买家在 lulu 看得到自己两单', JSON.stringify(bOrdersLulu).includes(orderA) && JSON.stringify(bOrdersLulu).includes(orderB))
  const bLoginMain = await post('/api/auth/login', MAIN_HOST, null, { email: buyerEmail, password: PW })
  const buyerMain = tokenOf(bLoginMain)
  check('同邮箱同账号：买家可在主站登录', bLoginMain.json?.success === true && !!buyerMain)
  const bOrdersMain = (await get('/api/orders?page=1&pageSize=10', MAIN_HOST, buyerMain)).json?.data
  check('主站「我的订单」看不到渠道单（订单按店面隔离）', !JSON.stringify(bOrdersMain).includes(orderA), JSON.stringify(bOrdersMain).slice(0, 160))
  check('站长令牌在 lulu 的渠道后台 → 401（D2：视为未登录）', (await get('/api/partner/dashboard', LULU_HOST, admin)).status === 401)
  check('渠道主令牌在主站 Host 的渠道后台 → 404', (await get('/api/partner/dashboard', MAIN_HOST, owner)).status === 404)
  const ownerAdmin = await get('/api/admin/tenants', MAIN_HOST, owner)
  check('渠道主令牌打超管接口 → 拒绝', ownerAdmin.status === 401 || ownerAdmin.status === 403 || ownerAdmin.status === 404, String(ownerAdmin.status))
  const partnerAudit = (await get('/api/partner/audit', LULU_HOST, owner)).json?.data
  const auditText = JSON.stringify(partnerAudit)
  check('渠道操作日志：不含站长真实成本（卡密成本 100.00）、成本基准与原始 diff', !auditText.includes('"cost"') && !auditText.includes('"diff"') && !auditText.includes('supplyBase') && !auditText.includes('100.00'), auditText.slice(0, 200))
  // D16：平台对渠道的配置类操作也给渠道可见摘要（只含掩码 / 角色，不含明文账号与邮箱）
  const rowsA: Json[] = partnerAudit?.rows || []
  const payeeRow = rowsA.find((r) => r.action === 'tenant.payee')
  check('操作日志 tenant.payee 的摘要只有掩码（D16）', JSON.stringify(payeeRow?.publicDiff ?? null).includes('138****1111') && !auditText.includes('13800001111'), JSON.stringify(payeeRow))
  const invRow = rowsA.find((r) => r.action === 'member.invite')
  check('操作日志 member.invite 的摘要只有角色、不含被邀请邮箱（D16）', invRow?.publicDiff?.role === 'OWNER' && !JSON.stringify(invRow).includes(ownerEmail), JSON.stringify(invRow))
  const mStats = await get('/api/admin/stats', MAIN_HOST, admin)
  check('站长仪表盘照常（主站 Host）', mStats.status === 200, String(mStats.status))

  section('9 集成阶段补的几处（D2 / D3 / D4 / C4）经真实 HTTP 复核')
  check('渠道后台页面：渠道主 200', (await get('/partner', LULU_HOST, owner)).status === 200)
  const anonP = await get('/partner', LULU_HOST)
  check('渠道后台页面：未登录 → 跳 /partner/login', anonP.status === 307 && (anonP.location || '').includes('/partner/login'), `${anonP.status} ${anonP.location}`)
  const admP = await get('/partner', LULU_HOST, admin)
  check('渠道后台页面：站长令牌 → 同未登录（D2）', admP.status === 307 && (admP.location || '').includes('/partner/login'), `${admP.status} ${admP.location}`)
  check('D4：lulu /invoice-request/x → 404', (await get('/invoice-request/x', LULU_HOST)).status === 404)
  check('D4：lulu /unsubscribe/x → 404', (await get('/unsubscribe/x', LULU_HOST)).status === 404)
  check('D4：主站 /unsubscribe/x → 200（页面照常，令牌无效由页面自己提示）', (await get('/unsubscribe/x', MAIN_HOST)).status === 200)
  check('D3：lulu /api/account/bindings/send-code → 404', (await post('/api/account/bindings/send-code', LULU_HOST, buyer, { accountEmail: buyerEmail })).status === 404)
  check('D3：lulu /api/account/bindings/verify → 404', (await post('/api/account/bindings/verify', LULU_HOST, buyer, { accountEmail: buyerEmail, code: '000000' })).status === 404)
  const csrfLogin = await post('/api/auth/login', LULU_HOST, null, { email: buyerEmail, password: PW }, { origin: 'https://evil.bigolab.com', 'sec-fetch-site': 'same-site' })
  check('C4：兄弟子域发起的渠道站登录 → 403、不下发 cookie', csrfLogin.status === 403 && !tokenOf(csrfLogin), short(csrfLogin))
  const okLogin = await post('/api/auth/login', LULU_HOST, null, { email: buyerEmail, password: PW }, { origin: 'http://lulu.bigolab.com', 'sec-fetch-site': 'same-origin' })
  check('C4：同源登录照常', okLogin.json?.success === true, short(okLogin))

  await phase2({ admin, owner, buyer, ownerEmail, buyerEmail, product: { id: product.id }, catId: cat.id, orderA, orderB, rowA: { id: rowA.id }, rowB: { id: rowB.id } })
}

// ===========================================================================
// 二期改动（docs/多渠道分销-二期改动.md）M1–M4 的 HTTP 断言
// ===========================================================================
interface P2Ctx {
  admin: string
  owner: string
  buyer: string
  ownerEmail: string
  buyerEmail: string
  product: { id: number }
  catId: number
  orderA: string
  orderB: string
  rowA: { id: number }
  rowB: { id: number }
}

/** 首页 RSC 载荷里的「累计销量」（HomeClient 的 stats.totalSales；进服务端 HTML 时引号可能被转义） */
function homeTotalSales(html: string): number | null {
  const m = /totalSales\\?"\s*:\s*(\d+)/.exec(html)
  return m ? Number(m[1]) : null
}

/** 渠道站 multipart 上传（只有一个 file 字段）。带同源头：渠道写接口的同源校验对 multipart 同样生效 */
function uploadFile(p: string, host: string, token: string, bytes: Buffer, filename: string, mime: string): Promise<Res> {
  const boundary = `----live${RUN}${Math.random().toString(36).slice(2)}`
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`)
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  const body = Buffer.concat([head, bytes, tail])
  return new Promise((resolve, reject) => {
    const r = http.request(
      {
        hostname: BASE.hostname,
        port: BASE.port || 80,
        path: p,
        method: 'POST',
        headers: {
          host,
          cookie: `token=${token}`,
          'cf-connecting-ip': `10.67.${(++ipSeq >> 8) & 255}.${ipSeq & 255}`,
          origin: `http://${host}`,
          'sec-fetch-site': 'same-origin',
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': String(body.length),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          let json: Json = null
          try {
            json = JSON.parse(text)
          } catch {
            /* 非 JSON */
          }
          resolve({ status: res.statusCode || 0, json, text, cookies: [], location: null })
        })
      },
    )
    r.on('error', reject)
    r.end(body)
  })
}

/** 最小的合法 PNG（1×1）：服务端按文件头判类型 */
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

/** 付款到账但不要求已交付（人工发货商品付款后停在待交付） */
async function payOnly(orderNo: string, token: string): Promise<boolean> {
  const pay = await post('/api/pay/vmq/create', LULU_HOST, token, { orderNo })
  const really = String(pay.json?.data?.reallyPrice ?? '')
  if (!pay.json?.success || !really) return false
  const n = await post('/api/pay/sms-notify', MAIN_HOST, null, { token: VMQ_TOKEN, from: 'com.eg.android.AlipayGphone', content: `支付宝 你已成功收款${really}元。` })
  if (n.status !== 200) return false
  for (let i = 0; i < 30; i++) {
    const o = await prisma.order.findUnique({ where: { orderNo }, select: { payStatus: true, settleState: true } })
    if (o?.payStatus === 'PAID' && o.settleState) return true
    await sleep(500)
  }
  return false
}

async function phase2(c: P2Ctx) {
  const { admin, owner, buyer } = c

  // ---------------------------------------------------------------- M1
  section('10 二期 M1 销量：渠道前台 sales = Product.sales；两站首页累计销量相同；渠道后台同时给本店 / 全站销量')
  const pNow = await prisma.product.findUniqueOrThrow({ where: { id: c.product.id }, select: { sales: true } })
  const lNow = await prisma.tenantListing.findFirstOrThrow({ where: { tenantId: LULU_ID, productId: c.product.id }, select: { sales: true } })
  check('两张渠道单付款后：Product.sales 50 → 52、TenantListing.sales 0 → 2（渠道单同时计入全站与本店）', pNow.sales === 52 && lNow.sales === 2, `${pNow.sales} / ${lNow.sales}`)
  const lp = (await get('/api/products', LULU_HOST, buyer)).json?.data
  const lItems: Json[] = Array.isArray(lp) ? lp : lp?.list || []
  const lItem = lItems.find((x) => x.id === c.product.id)
  check('lulu /api/products：sales = Product.sales（52），不是本店销量 2', lItem?.sales === pNow.sales, JSON.stringify(lItem && { id: lItem.id, sales: lItem.sales }))
  const ld = (await get(`/api/products/${c.product.id}`, LULU_HOST, buyer)).json?.data
  check('lulu /api/products/:id：sales = Product.sales', (ld?.sales ?? ld?.product?.sales) === pNow.sales, JSON.stringify(ld?.sales ?? ld?.product?.sales))
  const mp = (await get('/api/products', MAIN_HOST)).json?.data
  const mItem = (Array.isArray(mp) ? mp : mp?.list || []).find((x: Json) => x.id === c.product.id)
  check('主站 /api/products 同一商品 sales 相同（两站同一个数）', mItem?.sales === pNow.sales, JSON.stringify(mItem?.sales))
  const hl = homeTotalSales((await get('/', LULU_HOST, buyer)).text)
  const hm = homeTotalSales((await get('/', MAIN_HOST)).text)
  const dbTotal = (await prisma.product.aggregate({ where: { status: 1 }, _sum: { sales: true } }))._sum.sales ?? 0
  check('首页累计销量：lulu = 主站 = 全站在售商品 Product.sales 之和', hl !== null && hl === hm && hm === dbTotal, `lulu ${hl} / 主站 ${hm} / 库 ${dbTotal}`)
  const pc = (await get('/api/partner/catalog', LULU_HOST, owner)).json?.data?.rows || []
  const pRow = pc.find((r: Json) => r.productId === c.product.id)
  check('渠道后台商品池：本店销量 sales=2、全站销量 globalSales=52', pRow?.sales === 2 && pRow?.globalSales === 52, JSON.stringify(pRow && { s: pRow.sales, g: pRow.globalSales }))

  // ---------------------------------------------------------------- M2
  section('11 二期 M2 利润：站长后台订单管理的渠道单利润 = 进货净额 − 成本（进货 110、卡密成本 100 → 利润 10）')
  const al = (await get(`/api/admin/orders?page=1&pageSize=50&tenantId=${LULU_ID}`, MAIN_HOST, admin)).json?.data
  const aRows: Json[] = al?.orders || al?.list || []
  for (const [label, no] of [
    ['A', c.orderA],
    ['B（开票单：售价不含税，税费不进这一列）', c.orderB],
  ] as const) {
    const r = aRows.find((x) => x.orderNo === no)
    const cp = r?.channelProfit
    check(`列表 ${label}：channelProfit 进货净额 11000、成本 10000、利润 1000（分）`, cp?.supplyNetCents === 11000 && cp?.ownerGoodsCents === 11000 && cp?.costCents === 10000 && cp?.profitCents === 1000, JSON.stringify(cp))
  }
  const t = al?.totals
  check(
    '汇总：渠道 2 单、渠道流水 280、进货净额 220、渠道成本 200、渠道利润 20、无未登记单',
    t?.channelOrders === 2 && t?.channelAmount === 280 && t?.channelSupplyNet === 220 && t?.channelCost === 200 && t?.channelProfit === 20 && t?.channelProfitUnknown === 0,
    JSON.stringify(t),
  )
  const dt = (await get(`/api/admin/orders/${c.rowA.id}/detail`, MAIN_HOST, admin)).json?.data?.channel
  check('详情 A：渠道结算区 ownerProfit 与列表同一口径（利润 1000 分），带悬停说明', dt?.ownerProfit?.profitCents === 1000 && typeof dt?.ownerProfit?.hint === 'string', JSON.stringify(dt?.ownerProfit)?.slice(0, 200))
  const po = await get(`/api/partner/orders/${c.orderA}`, LULU_HOST, owner)
  check('渠道侧订单详情仍看不到站长成本 / 利润', po.status === 200 && !/channelProfit|ownerProfit|costCents|"cost"/.test(po.text), po.text.slice(0, 160))
  const mainOnly = (await get(`/api/admin/orders?page=1&pageSize=5&tenantId=1`, MAIN_HOST, admin)).json?.data
  check(
    '按主站筛：主站行 channelProfit 恒为 null、汇总渠道单数 0',
    (mainOnly?.list || mainOnly?.orders || []).every((r: Json) => r.channelProfit === null) && mainOnly?.totals?.channelOrders === 0,
    JSON.stringify(mainOnly?.totals),
  )

  // ---------------------------------------------------------------- M3
  section('12 二期 M3 通知路由：渠道的纯通知不再推站长群；人工发货照推并带 [lulu]；渠道通知与推送方式')
  // 对照组：渠道主在主站注册（第 3 节）是主站注册，必须推到站长群 —— 证明假 webhook 接上了，下面的「没推」才有意义
  check('对照：主站注册照推站长群（假 webhook 已接上）', hooks.some((h) => h.title.includes('新用户注册') && h.text.includes(c.ownerEmail)), `共收到 ${hooks.length} 条：${hooks.map((h) => h.title).join(' | ').slice(0, 200)}`)
  const mentionsLulu = (h: { title: string; text: string }) => h.text.includes(c.orderA) || h.text.includes(c.orderB) || h.text.includes(c.buyerEmail)
  check('渠道买家注册、渠道单下单、渠道单付款（自动发货）都没推站长群', !hooks.some((h) => /新用户注册|新订单|订单已支付/.test(h.title) && mentionsLulu(h)), hooks.filter(mentionsLulu).map((h) => h.title).join(' | '))
  const joined = await prisma.tenantNotice.findFirst({ where: { tenantId: LULU_ID, kind: 'CUSTOMER_JOINED' } })
  check('渠道买家注册 → 渠道通知 CUSTOMER_JOINED（载荷不含邮箱）', !!joined && !`${joined.title}${joined.body}`.includes('@'), JSON.stringify(joined && { t: joined.title, b: joined.body }))
  const msgText = `ITEST-LIVE 留言 ${RUN}`
  const bm = await post(`/api/orders/${c.rowA.id}/messages`, LULU_HOST, buyer, { content: msgText })
  check('买家在渠道单留言成功', bm.json?.success === true, short(bm))
  await sleep(1500)
  check('渠道单买家留言不推站长群', !hooks.some((h) => h.text.includes(msgText) || (h.title.includes('新订单留言') && mentionsLulu(h))))
  check('渠道单买家留言 → 渠道通知 BUYER_MESSAGE', (await prisma.tenantNotice.count({ where: { tenantId: LULU_ID, kind: 'BUYER_MESSAGE', refKey: c.orderA } })) >= 1)

  // 人工发货商品：付款后站长必须动手 → 照推，标题带 [lulu]、写明待人工发货，不带买家邮箱
  const manual = await prisma.product.create({ data: { categoryId: c.catId, name: `${NAME} 人工代充`, price: new Prisma.Decimal('60.00'), stock: -1, deliveryType: 'MANUAL', status: 1 } })
  const g2 = await put(`/api/admin/tenants/${LULU_ID}/listings`, MAIN_HOST, admin, { productId: manual.id, granted: true, supplyCents: 5000 })
  check('站长授权人工发货商品、进货价 50.00', g2.json?.success === true, short(g2))
  const pc2 = (await get('/api/partner/catalog', LULU_HOST, owner)).json?.data?.rows || []
  const mRow = pc2.find((r: Json) => r.productId === manual.id)
  const lp2 = await patch(`/api/partner/listings/${mRow?.listingNo}`, LULU_HOST, owner, { retailYuan: '60', status: 1 })
  check('渠道定售价 60.00 并上架', lp2.status === 200 || lp2.status === 204 || lp2.json?.success === true, short(lp2))
  const hooksBeforeC = hooks.length
  const oc = await post('/api/orders', LULU_HOST, buyer, { productId: manual.id, quantity: 1, remark: '支付方式: 支付宝' })
  const orderC = String(oc.json?.data?.order?.orderNo || '')
  check('下单 C（人工发货）', oc.json?.success === true && !!orderC, short(oc))
  check('C 付款到账（已付、已计提；人工发货商品停在待交付）', await payOnly(orderC, buyer))
  await sleep(1500)
  const cHooks = hooks.slice(hooksBeforeC).filter((h) => h.text.includes(orderC))
  const pend = cHooks.find((h) => h.title.includes('订单已支付'))
  check('C 付款 → 站长群收到「[lulu] 订单已支付 · 渠道单待人工发货」', !!pend && pend.title.includes('[lulu]') && pend.title.includes('渠道单待人工发货'), cHooks.map((h) => h.title).join(' | '))
  check('待人工发货推送不带买家信息（邮箱）', !!pend && !pend.text.includes(c.buyerEmail), pend?.text.slice(0, 200))
  check('C 下单（未付款）没有推「新订单」', !cHooks.some((h) => h.title.includes('新订单')))
  const rowC = await prisma.order.findUniqueOrThrow({ where: { orderNo: orderC } })
  const dv = await put(`/api/admin/orders/${rowC.id}`, MAIN_HOST, admin, { deliveryStatus: 'DELIVERED', deliveryInfo: `ITEST-LIVE 交付 ${RUN}` })
  check('站长为渠道单 C 人工发货（标已交付）', dv.json?.success === true, short(dv))
  const dn = await prisma.tenantNotice.findFirst({ where: { tenantId: LULU_ID, kind: 'ORDER_DELIVERED', refKey: orderC } })
  check('→ 渠道通知 ORDER_DELIVERED（正文不含交付内容）', !!dn && !`${dn.title}${dn.body}`.includes('ITEST-LIVE 交付'), JSON.stringify(dn && { t: dn.title, b: dn.body }))
  const al2 = (await get(`/api/admin/orders?page=1&pageSize=50&tenantId=${LULU_ID}`, MAIN_HOST, admin)).json?.data
  const cRow = (al2?.orders || al2?.list || []).find((x: Json) => x.orderNo === orderC)
  check(
    'M2：人工发货单成本未登记 → 利润 null（不显示成 0 或等于进货价），汇总计 1 张未登记',
    cRow?.channelProfit?.costCents === null && cRow?.channelProfit?.profitCents === null && al2?.totals?.channelProfitUnknown === 1,
    JSON.stringify({ cp: cRow?.channelProfit, u: al2?.totals?.channelProfitUnknown }),
  )

  // 推送方式：没有通知邮箱不能开邮箱推送；通知邮箱 = 登录邮箱直接保存；换别的邮箱要验证码；超管只读看到掩码
  const s0 = (await get('/api/partner/settings', LULU_HOST, owner)).json?.data
  check('设置中心 GET 带 transport（默认企业微信开、邮箱关）与 contact', s0?.transport?.noticeWecomOn === true && s0?.transport?.noticeEmailOn === false && !!s0?.contact, JSON.stringify(s0?.transport))
  const eOn0 = await put('/api/partner/settings/transport', LULU_HOST, owner, { emailOn: true })
  check('没有通知邮箱时打开邮箱推送 → 400', eOn0.status === 400, short(eOn0))
  const ne = await put('/api/partner/settings/notice-email', LULU_HOST, owner, { email: c.ownerEmail })
  check('通知邮箱 = 当前登录邮箱 → 直接保存（不需要验证码）', ne.json?.success === true && ne.json?.data?.ok !== false, short(ne))
  const eOn = await put('/api/partner/settings/transport', LULU_HOST, owner, { emailOn: true })
  check('再打开邮箱推送 → 成功', eOn.json?.success === true && JSON.stringify(eOn.json?.data).includes('"noticeEmailOn":true'), short(eOn))
  const neOther = await put('/api/partner/settings/notice-email', LULU_HOST, owner, { email: `other-${RUN}@itest-live.local` })
  const tAfter = await prisma.tenant.findUniqueOrThrow({ where: { id: LULU_ID }, select: { noticeEmail: true } })
  check('通知邮箱换成别的地址、不带验证码 → 不保存（库里仍是登录邮箱）', tAfter.noticeEmail === c.ownerEmail.toLowerCase(), `${short(neOther)} / 库 ${tAfter.noticeEmail}`)
  // 只看推送方式那几个键：详情里的成员列表本来就有店主邮箱（超管可见），不能拿整段响应判「没有明文邮箱」
  const tv = (await get(`/api/admin/tenants/${LULU_ID}`, MAIN_HOST, admin)).json?.data?.tenant
  check(
    '超管渠道详情只读看到推送方式：企业微信开（未配置 webhook）、邮箱已开、通知邮箱只给掩码',
    tv?.noticeWecomOn === true && tv?.hasWebhook === false && tv?.noticeEmailOn === true && typeof tv?.noticeEmailMasked === 'string' && tv.noticeEmailMasked.includes('***@') && tv.noticeEmailMasked !== c.ownerEmail.toLowerCase(),
    JSON.stringify(tv && { w: tv.noticeWecomOn, h: tv.hasWebhook, e: tv.noticeEmailOn, m: tv.noticeEmailMasked }),
  )

  // ---------------------------------------------------------------- M4
  section('13 二期 M4 客服信息：渠道自己设的客服在前台生效；清空后回退主站；主站不变')
  const mainSupport0 = (await get('/support', MAIN_HOST)).text
  const wx = `lulukf_${RUN.slice(-5)}`
  const kfMail = `service-${RUN.slice(-5)}@lulu-shop.example.com`
  const pc0 = await put('/api/partner/settings/contact', LULU_HOST, owner, { wechat: wx, email: kfMail, hours: '10:00-20:00' })
  check('渠道设客服微信号 / 邮箱 / 服务时间', pc0.json?.success === true, short(pc0))
  const bad = await put('/api/partner/settings/contact', LULU_HOST, owner, { wechat: 'https://evil.example/x' })
  check('微信号带 URL → 400', bad.status === 400, short(bad))
  const badQr = await put('/api/partner/settings/contact', LULU_HOST, owner, { qrUrl: '/uploads/contact/x.png' })
  check('客户端提交二维码地址 → 400（只能上传，由服务端写）', badQr.status === 400, short(badQr))
  const ls = (await get('/support', LULU_HOST, buyer)).text
  check('lulu /support：显示渠道微信号、客服邮箱、服务时间', ls.includes(wx) && ls.includes(kfMail) && ls.includes('10:00'), `len ${ls.length}`)
  check('lulu /support：不出现主站微信号与主站二维码（微信号与二维码成组，渠道设了微信号就不混用主站二维码）', !ls.includes('GenuineMarxist') && !ls.includes('/wechat-qr.jpg'))
  const ms = (await get('/support', MAIN_HOST)).text
  check('主站 /support：仍是主站微信号与二维码，不含渠道客服', ms.includes('GenuineMarxist') && ms.includes('/wechat-qr.jpg') && !ms.includes(wx) && !ms.includes(kfMail))
  // 主站页面前后两次渲染含 Next 的随机值，不能整页比；比客服片段的出现次数（逐字对比由 mods-p3 进程内做）
  const cnt = (h: string, k: string) => h.split(k).length - 1
  check(
    '主站 /support：渠道改客服前后，主站客服片段出现次数不变',
    cnt(ms, 'GenuineMarxist') === cnt(mainSupport0, 'GenuineMarxist') && cnt(ms, '/wechat-qr.jpg') === cnt(mainSupport0, '/wechat-qr.jpg') && cnt(ms, '9:00') === cnt(mainSupport0, '9:00'),
  )
  const lpriv = (await get('/privacy', LULU_HOST)).text
  check('lulu /privacy 页脚按店面取客服（渠道微信号）', lpriv.includes(wx) && !lpriv.includes('GenuineMarxist'))
  const up = await uploadFile('/api/partner/settings/contact-qr', LULU_HOST, owner, PNG_1X1, 'qr.png', 'image/png')
  const qrUrl = String(up.json?.data?.contact?.supportQrUrl || '')
  check('上传客服二维码（PNG）→ 服务端生成 /uploads/contact/<随机名>.png', up.json?.success === true && /^\/uploads\/contact\/[0-9a-z-]+\.png$/.test(qrUrl), short(up))
  const svg = await uploadFile('/api/partner/settings/contact-qr', LULU_HOST, owner, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'x.png', 'image/png')
  check('伪装成 png 的 SVG → 400（按文件头判断）', svg.status === 400, short(svg))
  const qrFile = qrUrl ? path.join(ROOT, 'public', qrUrl) : ''
  check('二维码文件已落盘', !!qrFile && existsSync(qrFile), qrFile)
  const ls2 = (await get('/support', LULU_HOST, buyer)).text
  check('lulu /support：显示渠道二维码', !!qrUrl && ls2.includes(qrUrl))
  // 终审 2026-09-26：按浏览器发裸 DELETE 的样子（同源 Origin + Sec-Fetch-Site、无体、无 Content-Length / Content-Type）。
  // 以前同源校验把 Next 挂上的空 body 流当成「有体非 JSON」拒成 404；这条断言防回归。
  const del = await req('DELETE', '/api/partner/settings/contact-qr', {
    host: LULU_HOST,
    token: owner,
    headers: { origin: `https://${LULU_HOST.split(':')[0]}`, 'sec-fetch-site': 'same-origin' },
  })
  check('裸 DELETE（无请求体）清除二维码 → 200，旧文件删除', del.status === 200 && del.json?.success === true && !!qrFile && !existsSync(qrFile), short(del))
  // contact-card 仍带空 JSON 体（兼容换镜像窗口），这种发法也必须照常 200（此时已无二维码，幂等）
  const del2 = await req('DELETE', '/api/partner/settings/contact-qr', { host: LULU_HOST, token: owner, body: {} })
  check('带空 JSON 体的 DELETE 同样 200', del2.status === 200 && del2.json?.success === true, short(del2))
  const au: Json[] = (await get('/api/partner/audit', LULU_HOST, owner)).json?.data?.rows || []
  const auRow = au.find((r) => r.action === 'settings.contact')
  check('渠道操作日志：settings.contact 只记改了哪些字段，不记值', !!auRow && !JSON.stringify(auRow).includes(wx) && !JSON.stringify(auRow).includes(kfMail), JSON.stringify(auRow)?.slice(0, 200))
  const ad2 = JSON.stringify((await get(`/api/admin/tenants/${LULU_ID}`, MAIN_HOST, admin)).json?.data)
  check('超管渠道详情看到渠道客服原值', ad2.includes(wx) && ad2.includes(kfMail))
  const clr = await put('/api/partner/settings/contact', LULU_HOST, owner, { wechat: null, email: null, hours: null })
  check('渠道清空客服信息', clr.json?.success === true, short(clr))
  const ls3 = (await get('/support', LULU_HOST, buyer)).text
  check('清空后 lulu /support 整组回退主站客服', ls3.includes('GenuineMarxist') && ls3.includes('/wechat-qr.jpg') && !ls3.includes(wx) && !ls3.includes(kfMail))
}


let productIdForCleanup: number | null = null
if (process.argv.includes('--cleanup')) {
  cleanup(null)
    .then(() => console.log('已清理（含种子里的 lulu）'))
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect())
} else main()
  .catch((e) => {
    fail++
    console.error('\n✗ 异常中止：', e)
  })
  .finally(async () => {
    if (!KEEP) {
      await cleanup(productIdForCleanup).catch((e) => console.error('清理失败', e))
      const left = await prisma.tenant.count({ where: { id: { not: 1 } } })
      const lu = await prisma.user.count({ where: { email: { endsWith: '@itest-live.local' } } })
      check('清理后开发库只剩主站租户、无测试用户', left === 0 && lu === 0, `tenants≠1: ${left}, users: ${lu}`)
    } else {
      console.log('\n--keep：保留现场（lulu、测试用户、订单、结算单）。')
    }
    console.log(`\n${fail ? '❌' : '✅'} 通过 ${pass}，失败 ${fail}`)
    hookServer.close()
    await prisma.$disconnect()
    process.exit(fail ? 1 : 0)
  })
