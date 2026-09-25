/**
 * 买家主链路冒烟（打本地运行中的站点 + 一次性开发库）：
 *   注册/登录 → 下单 → 发起支付（唯一金额）→ 模拟 SmsForwarder 到账通知 → 订单已付款、自动发卡 → 订单列表能看到卡密
 *
 *   ITEST_BASE=http://localhost:3000 DATABASE_URL=".../beiguo_dev" npx tsx scripts/itest-buyer-journey.ts
 *
 * 用来在每次改动收款、下单、发货相关代码后确认「客户还能正常买到东西」。库名不含 dev/test 拒绝执行。
 * 会临时建一个 AUTO 商品和一张卡密（CARDKEY_SECRET 取本地 .env），跑完清理。
 */
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { encryptCardContent, cardContentHash } from '../src/lib/cardkey'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库`)
  process.exit(2)
}
const BASE = process.env.ITEST_BASE || 'http://localhost:3000'
const TOKEN = process.env.VMQ_WEBHOOK_TOKEN || process.env.VMQ_KEY || ''
const prisma = new PrismaClient()
const RUN = Date.now().toString(36)

let pass = 0
let fail = 0
const ok = (n: string, c: boolean, x = '') => (c ? (pass++, console.log(`  ✓ ${n}`)) : (fail++, console.log(`  ✗ ${n}${x ? ' —— ' + x : ''}`)))

async function call(method: string, path: string, body?: unknown, cookie?: string, extra: Record<string, string> = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const setCookie = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() || []
  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* */
  }
  return { status: res.status, data, setCookie }
}

async function main() {
  if (!TOKEN) throw new Error('需要 VMQ_KEY 或 VMQ_WEBHOOK_TOKEN（与本地站点一致）')
  const email = `buyer-${RUN}@itest.local`
  const user = await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash('Test123456', 10), emailVerifiedAt: new Date() } })
  const cat = await prisma.category.findFirst({ select: { id: true } })
  const product = await prisma.product.create({
    data: { categoryId: cat!.id, name: `冒烟商品-${RUN}`, price: new Prisma.Decimal('88.00'), stock: 1, deliveryType: 'AUTO', status: 1 },
  })
  const secret = `CARD-${RUN}-XYZ`
  await prisma.cardKey.create({ data: { productId: product.id, content: encryptCardContent(secret), contentHash: cardContentHash(secret), cost: new Prisma.Decimal('50.00') } })

  const login = await call('POST', '/api/auth/login', { email, password: 'Test123456' })
  const cookie = login.setCookie.map((c) => c.split(';')[0]).join('; ')
  ok('登录', login.data?.success === true)

  const created = await call('POST', '/api/orders', { productId: product.id, quantity: 1, remark: '支付方式: 支付宝' }, cookie)
  const orderNo = created.data?.data?.order?.orderNo
  ok('下单', created.data?.success === true && !!orderNo, JSON.stringify(created.data))

  const pay = await call('POST', '/api/pay/vmq/create', { orderNo }, cookie)
  const vmqId = pay.data?.data?.orderId
  const really = pay.data?.data?.reallyPrice
  ok('发起支付，拿到唯一金额', pay.data?.success === true && !!vmqId && !!really, JSON.stringify(pay.data))

  // 被拒的几种到账通知：token 在 URL 上、token 错、GET
  const bad1 = await call('POST', `/api/pay/sms-notify?token=${encodeURIComponent(TOKEN)}`, { content: `你已成功收款${really}元` })
  ok('token 放在 URL 上被拒（401）', bad1.status === 401, String(bad1.status))
  const bad2 = await call('POST', '/api/pay/sms-notify', { token: 'wrong', content: `你已成功收款${really}元` })
  ok('token 错被拒（401）', bad2.status === 401, String(bad2.status))
  const stillUnpaid = await prisma.order.findUnique({ where: { orderNo }, select: { payStatus: true } })
  ok('被拒的通知不改订单', stillUnpaid?.payStatus === 'UNPAID')

  // 正常到账：与后台生成的 SmsForwarder 配置同形（POST JSON，token 在 body）
  const good = await call('POST', '/api/pay/sms-notify', {
    token: TOKEN,
    from: 'com.eg.android.AlipayGphone',
    content: `支付宝 你已成功收款${really}元。`,
  })
  ok('到账通知被接受', good.status === 200, `${good.status} ${JSON.stringify(good.data)}`)

  let o: any = null
  for (let i = 0; i < 20; i++) {
    o = await prisma.order.findUnique({ where: { orderNo }, select: { payStatus: true, deliveryStatus: true } })
    if (o?.deliveryStatus === 'DELIVERED') break
    await new Promise((r) => setTimeout(r, 500))
  }
  ok('订单已付款', o?.payStatus === 'PAID', JSON.stringify(o))
  ok('自动发卡后订单已交付', o?.deliveryStatus === 'DELIVERED', JSON.stringify(o))

  const list = await call('GET', '/api/orders?page=1&pageSize=10', undefined, cookie)
  const mine = (list.data?.data?.list || list.data?.data?.orders || []).find((x: any) => x.orderNo === orderNo)
  ok('我的订单里能看到卡密', !!mine && JSON.stringify(mine).includes(secret), JSON.stringify(mine)?.slice(0, 300))

  const again = await call('POST', '/api/pay/sms-notify', { token: TOKEN, from: 'com.eg.android.AlipayGphone', content: `支付宝 你已成功收款${really}元。` })
  const cards = await prisma.cardKey.count({ where: { productId: product.id, status: 'USED' } })
  ok('重复推送不会重复发卡', cards === 1 && again.status === 200, `${again.status} cards=${cards}`)

  // 清理
  const ord = await prisma.order.findUnique({ where: { orderNo }, select: { id: true } })
  if (ord) {
    await prisma.payment.deleteMany({ where: { orderId: ord.id } })
    await prisma.lotteryEntry.deleteMany({ where: { orderId: ord.id } })
    await prisma.vmqOrder.deleteMany({ where: { bizType: 'order', bizId: ord.id } })
    await prisma.order.delete({ where: { id: ord.id } })
  }
  await prisma.vmqLock.deleteMany({ where: { orderId: vmqId || '' } })
  await prisma.cardKey.deleteMany({ where: { productId: product.id } })
  await prisma.product.delete({ where: { id: product.id } })
  await prisma.user.delete({ where: { id: user.id } })
  await prisma.setting.deleteMany({ where: { key: { startsWith: 'vmq_unmatched:' }, value: { contains: RUN } } })

  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
