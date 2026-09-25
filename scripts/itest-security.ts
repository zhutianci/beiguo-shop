/**
 * 安全修复（2026-09-26 审计 G01–G14、G22）端到端自测：打本地 dev server 的真实接口，数据落一次性开发库。
 *
 *   1) npm run dev（.env.local 指向 beiguo_dev）
 *   2) DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-security.ts
 *
 * ⚠️ 库名不含 dev / test 时拒绝执行。测试数据用 @itest.local 邮箱，跑完清理。
 * 本地没配阿里云邮件，所以验证码不走发信：直接往 email_codes 插一张已知的码（与 createCode 写入的形态一致）。
 * 限流计数在 dev server 进程内存里，每次运行用带时间戳的新邮箱，互不干扰。
 */
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库`)
  process.exit(2)
}

const BASE = process.env.ITEST_BASE || 'http://localhost:3000'
const prisma = new PrismaClient()
const RUN = Date.now().toString(36)
const mail = (n: string) => `${n}-${RUN}@itest.local`
const PW = 'Test123456'
const LEGACY_SEED_HASH = '$2a$10$1nwsaZ4SDtsUmEDBml2MMuGK2WZb1MlJJxmrxQfIexqqV/fHqyiei'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}

type Jar = Map<string, string>
// 本地没有 nginx：clientIp() 直接读 cf-connecting-ip，测试用它模拟「来自某个 IP」
let simulatedIp: string | null = null
async function call(method: string, path: string, body?: unknown, jar?: Jar, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
  if (simulatedIp) headers['cf-connecting-ip'] = simulatedIp
  if (jar && jar.size) headers.Cookie = Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' })
  if (jar) {
    const set = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() || []
    for (const c of set) {
      const [kv] = c.split(';')
      const i = kv.indexOf('=')
      const k = kv.slice(0, i).trim()
      const v = kv.slice(i + 1).trim()
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c) || v === '') jar.delete(k)
      else jar.set(k, v)
    }
  }
  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, data }
}

async function mkUser(email: string, opts: { hash?: string; status?: number; verified?: boolean } = {}) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: opts.hash ?? (await bcrypt.hash(PW, 10)),
      status: opts.status ?? 1,
      emailVerifiedAt: opts.verified ? new Date() : null,
    },
  })
}

async function plantCode(email: string, purpose: string, code: string) {
  // 与 createCode 同形：先作废旧码，再插一张 10 分钟有效的
  await prisma.emailCode.updateMany({ where: { email, purpose, used: false }, data: { expiresAt: new Date() } })
  await prisma.emailCode.create({ data: { email, purpose, code, expiresAt: new Date(Date.now() + 600_000) } })
}

async function login(email: string, password = PW) {
  const jar: Jar = new Map()
  const r = await call('POST', '/api/auth/login', { email, password }, jar)
  return { ...r, jar }
}

async function main() {
  console.log(`BASE=${BASE} DB=${dbName} RUN=${RUN}\n`)
  const today = new Date(new Date().toISOString().slice(0, 10))

  // ---------- 登录：防枚举、禁用、旧种子密码、限流 ----------
  console.log('[登录]')
  const alice = await mkUser(mail('alice'), { verified: true })
  const ghost = mail('ghost')
  const a1 = await login(alice.email!, 'wrong-pass')
  const g1 = await login(ghost, 'wrong-pass')
  ok('存在与不存在的邮箱输错密码：状态码一致', a1.status === g1.status, `${a1.status} vs ${g1.status}`)
  ok('存在与不存在的邮箱输错密码：文案一致', a1.data?.error === g1.data?.error, `${a1.data?.error} | ${g1.data?.error}`)

  const banned = await mkUser(mail('banned'), { status: 0 })
  const b1 = await login(banned.email!, 'wrong-pass')
  ok('禁用账号输错密码：只说「邮箱或密码错误」', b1.data?.error === '邮箱或密码错误', b1.data?.error)
  const b2 = await login(banned.email!)
  ok('禁用账号输对密码：才说「已被禁用」', b2.data?.error === '账号已被禁用', b2.data?.error)

  const legacy = await mkUser(mail('legacy'), { hash: LEGACY_SEED_HASH })
  const l1 = await login(legacy.email!, 'admin123')
  ok('持有旧种子默认密码哈希的账号不能登录', l1.data?.success !== true && l1.data?.error === '邮箱或密码错误', JSON.stringify(l1.data))

  const good = await login(alice.email!)
  ok('正常账号正常登录', good.data?.success === true)

  const throttled = mail('throttle')
  await mkUser(throttled)
  let last = 0
  simulatedIp = '203.0.113.7' // 攻击者的 IP
  for (let i = 0; i < 11; i++) last = (await login(throttled, 'nope')).status
  ok('同一 IP 对同一邮箱第 11 次登录尝试被限流（429）', last === 429, String(last))
  const t2 = await login(throttled)
  ok('该 IP 在限流期间输对密码也是 429', t2.status === 429, String(t2.status))
  simulatedIp = '198.51.100.23' // 真实用户在自己的网络
  const t3 = await login(throttled)
  ok('别人锁不住：真实用户换自己的网络照常登录', t3.data?.success === true, JSON.stringify(t3.data))
  simulatedIp = null

  // ---------- 会话吊销（sessionEpoch） ----------
  console.log('\n[会话吊销]')
  const me1 = await call('GET', '/api/auth/me', undefined, good.jar)
  ok('登录后 /api/auth/me 正常', me1.status === 200 && me1.data?.success === true, String(me1.status))
  await prisma.user.update({ where: { id: alice.id }, data: { sessionEpoch: { increment: 1 } } })
  const me2 = await call('GET', '/api/auth/me', undefined, good.jar)
  ok('会话版本 +1 后旧 token 失效', me2.status === 401 || me2.data?.success === false, String(me2.status))
  const relog = await login(alice.email!)
  const me3 = await call('GET', '/api/auth/me', undefined, relog.jar)
  ok('重新登录后恢复', me3.data?.success === true)

  // ---------- 邮箱查订阅：必须证明归属 ----------
  console.log('\n[邮箱查订阅]')
  const xian = mail('xianyu')
  const ext = await prisma.externalOrder.create({
    data: {
      startDate: today,
      expireDate: new Date(today.getTime() + 30 * 86400000),
      subscriptionType: 'Claude Pro',
      xianyuNickname: '闲鱼昵称不应外泄',
      claudeAccount: xian,
      quote: new Prisma.Decimal(150),
      sourceKey: `itest-${RUN}-x`,
    },
  })
  const anon: Jar = new Map()
  const q1 = await call('POST', '/api/external-orders/lookup', { email: xian }, anon)
  ok('没有证明：401 + needVerify', q1.status === 401 && q1.data?.needVerify === true, `${q1.status} ${JSON.stringify(q1.data)}`)
  const q1g = await call('GET', `/api/external-orders/lookup?email=${encodeURIComponent(xian)}`, undefined, anon)
  ok('兼容的 GET 同样要求证明', q1g.status === 401, String(q1g.status))
  const c1 = await call('GET', `/api/external-orders/contact?email=${encodeURIComponent(xian)}`, undefined, anon)
  ok('提醒联系方式 GET 没有证明被拒', c1.status === 401, String(c1.status))
  const c1p = await call('POST', '/api/external-orders/contact', { claudeAccount: xian, notifyEmail: true, notifyPhone: false }, anon)
  ok('提醒联系方式 POST 没有证明被拒', c1p.status === 401, String(c1p.status))
  const r1 = await call('POST', '/api/receipts', { externalOrderId: ext.id, payerTitle: '冒名公司', showAiWording: false, accountEmail: xian }, anon)
  ok('只「说出邮箱」开收据被拒（403）', r1.status === 403, `${r1.status} ${r1.data?.error}`)

  // 错码 5 次后第 6 次即使码对也作废
  await plantCode(xian, 'LOOKUP', '424242')
  let v = { status: 0, data: null as any }
  for (let i = 0; i < 5; i++) v = await call('POST', '/api/external-orders/lookup/verify', { email: xian, code: '000000' }, anon)
  ok('错码返回「验证码错误」', /验证码错误/.test(v.data?.error || ''), v.data?.error)
  const v6 = await call('POST', '/api/external-orders/lookup/verify', { email: xian, code: '424242' }, anon)
  ok('同一张码错 5 次后，第 6 次输对也作废', v6.data?.success !== true, JSON.stringify(v6.data))
  ok('「错太多次」与「错码」同一句话（不给枚举信号）', v6.data?.error === v.data?.error, `${v6.data?.error} | ${v.data?.error}`)

  await plantCode(xian, 'LOOKUP', '135791')
  const v7 = await call('POST', '/api/external-orders/lookup/verify', { email: xian, code: '135791' }, anon)
  ok('新码验证成功并下发证明 cookie', v7.data?.success === true && anon.has('lk'), JSON.stringify(v7.data))
  const proof = v7.data?.data?.proof
  ok('验证响应里同时给出证明串（App 内置浏览器兜底）', typeof proof === 'string' && proof.length > 20)
  const viaHeader = await call('POST', '/api/external-orders/lookup', { email: xian }, new Map(), { 'X-Email-Proof': proof })
  ok('不带 cookie、只用 X-Email-Proof 头也能查（微信 WebView 兜底）', viaHeader.data?.success === true, JSON.stringify(viaHeader.data)?.slice(0, 200))
  const forgedHeader = await call('POST', '/api/external-orders/lookup', { email: xian }, new Map(), { 'X-Email-Proof': proof.slice(0, -3) + 'AAA' })
  ok('篡改过的证明头无效', forgedHeader.status === 401, String(forgedHeader.status))
  const v8 = await call('POST', '/api/external-orders/lookup/verify', { email: xian, code: '135791' }, anon)
  ok('同一张码不能用两次', v8.data?.success !== true)

  const q2 = await call('POST', '/api/external-orders/lookup', { email: xian }, anon)
  const row = q2.data?.data?.orders?.[0]
  ok('有证明后能查到订阅', q2.data?.success === true && q2.data.data.orders.length === 1, JSON.stringify(q2.data))
  ok('结果不含闲鱼昵称 / 站内订单号 / sourceKey', row && !('xianyuNickname' in row) && !('shopOrderId' in row) && !('sourceKey' in row))
  ok('纯外部订单 ownerOnly=false', row?.ownerOnly === false)
  const c2 = await call('GET', `/api/external-orders/contact?email=${encodeURIComponent(xian)}`, undefined, anon)
  ok('有证明后提醒联系方式可读', c2.data?.success === true, JSON.stringify(c2.data))
  const r2 = await call('POST', '/api/receipts', { externalOrderId: ext.id, payerTitle: '真买家公司', showAiWording: false }, anon)
  ok('有证明后可以开收据', r2.data?.success === true, JSON.stringify(r2.data))

  // 证明只对该邮箱有效
  const other = mail('other')
  const q3 = await call('POST', '/api/external-orders/lookup', { email: other }, anon)
  ok('证明不能拿去查别的邮箱', q3.status === 401, String(q3.status))

  // 伪造 cookie
  const forged: Jar = new Map([['lk', 'eyJoIjpbXSwieCI6OTk5OTk5OTk5OTk5OX0.AAAA']])
  const q4 = await call('POST', '/api/external-orders/lookup', { email: xian }, forged)
  ok('伪造的证明 cookie 无效', q4.status === 401, String(q4.status))

  // ---------- 站内订单背书行：只认下单本人 ----------
  console.log('\n[站内订单背书行]')
  const prod = await prisma.product.findFirst({ where: { status: 1 }, select: { id: true, name: true } })
  const bob = await mkUser(mail('bob'), { verified: true })
  const order = await prisma.order.create({
    data: {
      orderNo: `IT${RUN}`.slice(0, 32),
      userId: bob.id,
      productId: prod!.id,
      productName: prod!.name,
      productPrice: new Prisma.Decimal(100),
      amount: new Prisma.Decimal(100),
      payStatus: 'PAID',
      deliveryStatus: 'DELIVERED',
      paidAt: new Date(),
    },
  })
  const shopExt = await prisma.externalOrder.create({
    data: {
      startDate: today,
      expireDate: new Date(today.getTime() + 30 * 86400000),
      subscriptionType: 'Claude Pro',
      claudeAccount: bob.email!,
      quote: new Prisma.Decimal(100),
      sourceKey: `order:${order.id}`,
      shopOrderId: order.id,
    },
  })
  // 攻击者：证明了 bob 的邮箱？做不到——这里模拟最坏情况：攻击者拿到了 bob 邮箱的证明（例如 bob 自己在网吧验过）
  const att: Jar = new Map()
  await plantCode(bob.email!, 'LOOKUP', '246810')
  await call('POST', '/api/external-orders/lookup/verify', { email: bob.email, code: '246810' }, att)
  const q5 = await call('POST', '/api/external-orders/lookup', { email: bob.email }, att)
  const srow = q5.data?.data?.orders?.find((o: any) => o.id === shopExt.id)
  ok('站内订单背书行标记 ownerOnly=true', srow?.ownerOnly === true, JSON.stringify(srow))
  const r3 = await call('POST', '/api/receipts', { externalOrderId: shopExt.id, payerTitle: '冒名', showAiWording: false }, att)
  ok('非下单本人（即使有邮箱证明）不能给站内订单开收据', r3.status === 403, `${r3.status} ${r3.data?.error}`)
  const bobLogin = await login(bob.email!)
  const r4 = await call('POST', '/api/receipts', { externalOrderId: shopExt.id, payerTitle: 'Bob 公司', showAiWording: false }, bobLogin.jar)
  ok('下单本人登录后可以开', r4.data?.success === true, JSON.stringify(r4.data))

  // ---------- 绑定订阅账户：必须验证 ----------
  console.log('\n[绑定订阅账户]')
  const carol = await mkUser(mail('carol'), { verified: true })
  const cj = (await login(carol.email!)).jar
  const bind = await call('POST', '/api/account/bindings', { accountEmail: xian, platform: 'CLAUDE' }, cj)
  ok('绑定他人邮箱：已添加但未验证', bind.data?.success === true && bind.data.data.verified === false, JSON.stringify(bind.data))
  const list1 = await call('GET', '/api/account/bindings', undefined, cj)
  const b0 = list1.data?.data?.list?.find((b: any) => b.accountEmail === xian)
  ok('未验证的绑定看不到订阅与联系方式', b0 && b0.verified === false && b0.contact === null && b0.recent.length === 0 && b0.orderCount === 0, JSON.stringify(b0))
  const bc = await call('POST', '/api/account/bindings/contact', { accountEmail: xian, notifyEmail: true, notifyPhone: false }, cj)
  ok('未验证的绑定不能改提醒去向', bc.status === 403, `${bc.status} ${bc.data?.error}`)
  const lk = await call('POST', '/api/external-orders/lookup', { email: xian }, cj)
  ok('未验证的绑定不能当查订阅的凭证', lk.status === 401, String(lk.status))
  await plantCode(xian, 'LOOKUP', '112233')
  const bv = await call('POST', '/api/account/bindings/verify', { accountEmail: xian, code: '112233' }, cj)
  ok('验证码通过后绑定变为已验证', bv.data?.success === true, JSON.stringify(bv.data))
  const list2 = await call('GET', '/api/account/bindings', undefined, cj)
  const b1b = list2.data?.data?.list?.find((b: any) => b.accountEmail === xian)
  ok('验证后能看到订阅记录与联系方式', b1b?.verified === true && b1b.orderCount === 1 && b1b.contact !== null, JSON.stringify(b1b))
  const selfBind = await call('POST', '/api/account/bindings', { accountEmail: carol.email, platform: 'CLAUDE' }, cj)
  ok('绑定自己已验证的登录邮箱直接生效', selfBind.data?.data?.verified === true, JSON.stringify(selfBind.data))

  // ---------- 库存与成交滚动 ----------
  console.log('\n[库存与成交]')
  const pl = await call('GET', '/api/products')
  const stocks = new Set<number>((pl.data?.data || []).map((p: any) => p.stock))
  ok('/api/products 的 stock 只有档位代表值', Array.from(stocks).every((s) => [-1, 0, 1, 5, 10, 11].includes(s)), JSON.stringify(Array.from(stocks)))
  const rc = await call('GET', '/api/orders/recent')
  const first = rc.data?.data?.[0]
  ok('/api/orders/recent 不含 createdAt、id 为序号', !first || (!('createdAt' in first) && first.id === 1), JSON.stringify(first))
  const bigQty = await call('POST', '/api/orders', { productId: prod!.id, quantity: 11 }, relog.jar)
  ok('单次购买数量上限 10', bigQty.status === 400 && /最多购买 10 件/.test(bigQty.data?.error || ''), JSON.stringify(bigQty.data))

  // ---------- 清理 ----------
  await prisma.receipt.deleteMany({ where: { externalOrderId: { in: [ext.id, shopExt.id] } } })
  await prisma.accountContact.deleteMany({ where: { claudeAccount: { endsWith: `${RUN}@itest.local` } } })
  await prisma.externalOrder.deleteMany({ where: { id: { in: [ext.id, shopExt.id] } } })
  await prisma.order.deleteMany({ where: { id: order.id } })
  await prisma.emailCode.deleteMany({ where: { email: { endsWith: `${RUN}@itest.local` } } })
  await prisma.user.deleteMany({ where: { email: { endsWith: `${RUN}@itest.local` } } })

  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
