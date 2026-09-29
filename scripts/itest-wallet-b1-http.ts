/**
 * 短信接码 · B1 —— 接口层端到端自测：打本地 dev server 的真实接口（鉴权、adminGuard、同源、HTTP 状态码、口径），数据落一次性开发库。
 *
 *   1) npm run dev（.env.local 指向 beiguo_dev）
 *   2) set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-wallet-b1-http.ts
 *
 * ⚠️ 库名不含 dev / test 时拒绝执行。业务逻辑的断言在 scripts/itest-wallet-b1.ts（直接调 lib），这里只验接口这一层：
 *   · /api/wallet/topup：未登录 401、跨站 403、受众仅管理员时普通用户 enabled:false / 503、金额 400 AMOUNT（文案按配置）、no-store、成功下单
 *   · /api/wallet/topup/[orderNo]：本人 PENDING → CREDITED、别人 404
 *   · 收银台：/api/pay/vmq/status 对充值单多给 next=/wallet?topup=<单号>；/api/pay/vmq/create 复用同一张收款单
 *   · 第 92 条口径：我的订单、首页实时成交、后台仪表盘营收都不含充值单；仪表盘多一格「今日充值入账」
 *   · 第 125 条：/api/orders/[id]/invoice 与 /receipt 对充值单 409「暂不支持开票，可联系客服开票处理」
 *   · 第 43 条：后台改单对充值单 409；商品后台不能上架 / 改价 / 删除载体商品
 *   · 第 91 条（防御）：后台给充值单插一条客服留言，/api/account/unread 不计它
 *   · 迟到付款：待核实条目标出载体单、「标记已处理」必须选方式、退入买家余额（候选、必填交易号）、补单被拒、迟到付款看板
 *   · cron：vmq-close 顺带兜底清扫；条款页第四节只在充值对全部用户开放时出现《余额与充值规则》
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { PrismaClient, Prisma } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库`)
  process.exit(2)
}
if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest'
for (const k of ['WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) delete process.env[k]
const BASE = process.env.ITEST_BASE || 'http://localhost:3000'
const prisma = new PrismaClient()
const RUN = `iwb1h${Date.now().toString(36)}`
const PW = 'Test123456'
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
const D = (n: number) => new Prisma.Decimal(n.toFixed(2))

type Jar = Map<string, string>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(method: string, p: string, body?: unknown, jar?: Jar, extra: Record<string, string> = {}): Promise<{ status: number; data: any; headers: Headers; text: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
  if (jar && jar.size) headers.Cookie = Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  const res = await fetch(BASE + p, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' })
  if (jar) {
    const set = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() || []
    for (const c of set) {
      const [kv] = c.split(';')
      const i = kv.indexOf('=')
      jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim())
    }
  }
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, data, headers: res.headers, text }
}
async function login(email: string): Promise<Jar> {
  const jar: Jar = new Map()
  const r = await call('POST', '/api/auth/login', { email, password: PW }, jar)
  if (!r.data?.success) throw new Error(`登录失败 ${email}: ${JSON.stringify(r.data)}`)
  return jar
}

async function main() {
  try {
    await fetch(BASE + '/api/health').catch(() => fetch(BASE))
  } catch {
    console.error(`连不上 ${BASE}：先 npm run dev`)
    process.exit(2)
  }
  const vmq = await import('../src/lib/vmq')
  const topup = await import('../src/lib/wallet/topup')
  const config = await import('../src/lib/wallet/config')
  const { centsOf } = await import('../src/lib/wallet/buckets')
  const { WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')

  const hash = await bcrypt.hash(PW, 10)
  const userIds: number[] = []
  const mk = async (name: string, role: 'USER' | 'ADMIN' = 'USER') => {
    const u = await prisma.user.create({ data: { email: `${name}-${RUN}@itest.local`, passwordHash: hash, role, emailVerifiedAt: new Date() } })
    userIds.push(u.id)
    return u
  }
  const KEEP = ['wallet_config', 'vmq_lastpay', 'vmq_lastunmatched', 'vmq_recentraw', 'vmq_lastheart']
  const saved = await prisma.setting.findMany({ where: { key: { in: KEEP } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
  let seeded: { productId: number; categoryId: number | null } | null = null
  const setCfg = (patch: Record<string, unknown>) =>
    prisma.setting.upsert({
      where: { key: 'wallet_config' },
      create: { key: 'wallet_config', value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, ...patch }) },
      update: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, ...patch }) },
    })
  const usedYuan = new Set<number>()
  async function freeYuan(): Promise<number> {
    for (let y = 201; y < 1000; y++) {
      if (usedYuan.has(y)) continue
      if ((await prisma.vmqOrder.count({ where: { reallyPrice: { gte: D(y), lt: D(y + 0.5) } } })) === 0) {
        usedYuan.add(y)
        return y
      }
    }
    throw new Error('找不到空闲金额')
  }

  try {
    // 载体商品：没有就跑种子（dev server 进程里有 5 分钟缓存；种子在它第一次查之前建好）
    if ((await prisma.product.count({ where: { deliveryType: 'TOPUP' } })) === 0) {
      const catBefore = await prisma.category.findFirst({ where: { name: '系统（勿删）' } })
      const sql = fs.readFileSync(path.join(__dirname, 'ops', 'wallet-b1-seed.sql'), 'utf8')
      for (const st of sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').split(/;\s*(?:\n|$)/).map((x) => x.trim()).filter(Boolean)) {
        if (/^SELECT\b/i.test(st)) await prisma.$queryRawUnsafe(st)
        else await prisma.$executeRawUnsafe(st)
      }
      const p = await prisma.product.findFirstOrThrow({ where: { deliveryType: 'TOPUP' } })
      seeded = { productId: p.id, categoryId: catBefore ? null : p.categoryId }
    }
    const carrier = await prisma.product.findFirstOrThrow({ where: { deliveryType: 'TOPUP' } })
    await setCfg({ topupEnabled: true })

    const buyer = await mk('buyer')
    const admin = await mk('admin', 'ADMIN')
    const bj = await login(buyer.email!)
    const aj = await login(admin.email!)

    console.log('\n[/api/wallet/topup：鉴权、受众、金额]')
    ok('GET 未登录：401', (await call('GET', '/api/wallet/topup')).status === 401)
    const gb = await call('GET', '/api/wallet/topup', undefined, bj)
    ok('普通用户（受众仅管理员）：200 enabled:false、no-store', gb.status === 200 && gb.data?.data?.enabled === false && (gb.headers.get('cache-control') || '').includes('no-store'))
    const ga = await call('GET', '/api/wallet/topup', undefined, aj)
    ok('管理员：enabled、档位 ¥5/10/15/20/50、上下限 ¥1–1,000、条款版本', ga.data?.data?.enabled === true && JSON.stringify(ga.data.data.tiersCents) === '[500,1000,1500,2000,5000]' && ga.data.data.minCents === 100 && ga.data.data.maxCents === 100000 && ga.data.data.termsVersion === WALLET_TERMS_VERSION)
    ok('POST 未登录：401', (await call('POST', '/api/wallet/topup', { amountCents: 1000, clientToken: crypto.randomUUID(), termsVersion: WALLET_TERMS_VERSION })).status === 401)
    const xs = await call('POST', '/api/wallet/topup', { amountCents: 1000, clientToken: crypto.randomUUID(), termsVersion: WALLET_TERMS_VERSION }, aj, { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' })
    ok('POST 跨站（Origin 不是本站）：403', xs.status === 403)
    const pb = await call('POST', '/api/wallet/topup', { amountCents: 1000, clientToken: crypto.randomUUID(), termsVersion: WALLET_TERMS_VERSION }, bj)
    ok('普通用户发起（仅管理员）：503 TOPUP_OFF', pb.status === 503 && pb.data?.code === 'TOPUP_OFF')
    const bad = await call('POST', '/api/wallet/topup', { amountCents: 1250, clientToken: crypto.randomUUID(), termsVersion: WALLET_TERMS_VERSION }, aj)
    ok('¥12.5：400 AMOUNT「请输入 1–1000 之间的整数金额」', bad.status === 400 && bad.data?.code === 'AMOUNT' && bad.data?.error === '请输入 1–1000 之间的整数金额')
    await setCfg({ topupEnabled: true, maxCents: 50000 })
    const g500 = await call('GET', '/api/wallet/topup', undefined, aj)
    const b501 = await call('POST', '/api/wallet/topup', { amountCents: 50100, clientToken: crypto.randomUUID(), termsVersion: WALLET_TERMS_VERSION }, aj)
    ok('后台把上限调成 ¥500：GET 下发 maxCents=50000，¥501 被 400、文案「请输入 1–500 之间的整数金额」', g500.data?.data?.maxCents === 50000 && b501.status === 400 && b501.data?.error === '请输入 1–500 之间的整数金额')

    // 对全部用户开放
    await setCfg({ topupEnabled: true, topupAudience: 'ALL' })
    const y = await freeYuan()
    const tok = crypto.randomUUID()
    const pr = await call('POST', '/api/wallet/topup', { amountCents: y * 100, clientToken: tok, termsVersion: WALLET_TERMS_VERSION, returnTo: '/jiema?s=tg&c=6&confirm=1' }, bj)
    ok('受众全部用户：普通用户下单 200 { orderNo, payUrl }、no-store', pr.status === 200 && /^\/pay\/\w+$/.test(pr.data?.data?.payUrl || '') && (pr.headers.get('cache-control') || '').includes('no-store'))
    const orderNo: string = pr.data?.data?.orderNo
    const order = await prisma.order.findUniqueOrThrow({ where: { orderNo } })
    const v0 = await prisma.vmqOrder.findFirstOrThrow({ where: { bizType: 'order', bizId: order.id } })
    const pr2 = await call('POST', '/api/wallet/topup', { amountCents: y * 100, clientToken: tok, termsVersion: WALLET_TERMS_VERSION }, bj)
    ok('同一个 clientToken 再提交：同一张单、同一个收银台', pr2.data?.data?.orderNo === orderNo && pr2.data?.data?.payUrl === pr.data.data.payUrl)

    console.log('\n[充值单状态 / 收银台]')
    const s1 = await call('GET', `/api/wallet/topup/${orderNo}`, undefined, bj)
    ok('本人查充值单：PENDING、带回跳', s1.status === 200 && s1.data?.data?.state === 'PENDING' && s1.data.data.returnTo === '/jiema?s=tg&c=6&confirm=1')
    ok('别人查：404', (await call('GET', `/api/wallet/topup/${orderNo}`, undefined, aj)).status === 404)
    ok('单号格式不对：404', (await call('GET', '/api/wallet/topup/abc', undefined, bj)).status === 404)
    const st = await call('GET', `/api/pay/vmq/status?orderId=${v0.orderId}`)
    ok('收银台状态：充值单多给 next=/wallet?topup=<单号>、carrier=TOPUP、balancePart=0', st.data?.data?.next === `/wallet?topup=${orderNo}` && st.data.data.carrier === 'TOPUP' && st.data.data.balancePart === 0)
    const cr = await call('POST', '/api/pay/vmq/create', { orderNo }, bj)
    ok('pay/vmq/create：复用同一张收款单（跳过上架检查与比价）', cr.status === 200 && cr.data?.data?.payUrl === pr.data.data.payUrl, JSON.stringify(cr.data))

    console.log('\n[我的订单 / 首页实时成交 / 仪表盘口径]')
    const lo = await call('GET', '/api/orders?page=1&pageSize=50', undefined, bj)
    ok('我的订单：不含充值单', lo.status === 200 && !JSON.stringify(lo.data?.data).includes(orderNo))
    const s0 = await call('GET', '/api/admin/stats', undefined, aj)
    const rev0 = s0.data?.data?.totalRevenue
    const top0 = s0.data?.data?.todayTopup?.cents ?? 0
    const ord0 = s0.data?.data?.totalOrders
    await vmq.markPaidByAmount((centsOf(v0.reallyPrice) / 100).toFixed(2), 2, `你已成功收款（${RUN}-${crypto.randomUUID()}）`)
    const s2 = await call('GET', `/api/wallet/topup/${orderNo}`, undefined, bj)
    ok('到账后：CREDITED、入账额 = 实付', s2.data?.data?.state === 'CREDITED' && s2.data.data.creditedCents === centsOf(v0.reallyPrice))
    const s3 = await call('GET', '/api/admin/stats', undefined, aj)
    ok('仪表盘：总收入、总订单不含这张充值单', s3.data?.data?.totalRevenue === rev0 && s3.data?.data?.totalOrders === ord0, `${rev0} → ${s3.data?.data?.totalRevenue}`)
    ok('仪表盘：今日充值入账 + 实付', (s3.data?.data?.todayTopup?.cents ?? 0) - top0 === centsOf(v0.reallyPrice))
    const recent = await call('GET', '/api/orders/recent')
    ok('首页实时成交：没有「余额充值」', recent.status === 200 && !recent.text.includes('余额充值'))
    const lo2 = await call('GET', '/api/orders?page=1&pageSize=50', undefined, bj)
    ok('付款后我的订单仍不含它', !JSON.stringify(lo2.data?.data).includes(orderNo))
    const ov = await call('GET', '/api/account/overview', undefined, bj)
    ok('个人中心：已付款订单数 / 累计消费不含充值单；余额含充值格', ov.data?.data?.stats?.paidOrderCount === 0 && ov.data?.data?.stats?.totalSpent === 0 && Math.round(ov.data?.data?.balance * 100) === centsOf(v0.reallyPrice))
    const ud = await call('GET', `/api/admin/users/${buyer.id}/detail`, undefined, aj)
    ok('后台用户详情：已付款订单数 / 累计付款不含充值单', ud.status === 200 && ud.data?.data?.stats?.paidOrderCount === 0, JSON.stringify(ud.data?.data?.stats))
    const ao = await call('GET', `/api/admin/orders?keyword=${orderNo}`, undefined, aj)
    ok('后台订单列表：列出充值单（只读），流水合计不含它', ao.status === 200 && JSON.stringify(ao.data?.data?.list).includes(orderNo) && ao.data?.data?.totals?.amount === 0 && ao.data?.data?.totals?.orders === 0, JSON.stringify(ao.data?.data?.totals))

    console.log('\n[开票 / 收据入口、后台改单、商品后台]')
    const inv = await call('POST', `/api/orders/${order.id}/invoice`, {}, bj)
    ok('/api/orders/[id]/invoice：409「暂不支持开票，可联系客服开票处理」', inv.status === 409 && inv.data?.error === '暂不支持开票，可联系客服开票处理', `${inv.status} ${inv.data?.error}`)
    const rec = await call('POST', `/api/orders/${order.id}/receipt`, {}, bj)
    ok('/api/orders/[id]/receipt：409 同一句', rec.status === 409 && rec.data?.error === '暂不支持开票，可联系客服开票处理', `${rec.status} ${rec.data?.error}`)
    const put = await call('PUT', `/api/admin/orders/${order.id}`, { deliveryStatus: 'DELIVERED', payStatus: 'PAID' }, aj)
    ok('后台改单：充值单 409（提示去「余额与充值」）', put.status === 409 && String(put.data?.error).includes('余额与充值'))
    const o3 = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    ok('  …订单没被动过', o3.payStatus === 'PAID' && o3.deliveryStatus === 'DELIVERED' && o3.updatedAt.getTime() === (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).updatedAt.getTime())
    const up = await call('PUT', `/api/admin/products/${carrier.id}`, { status: 1 }, aj)
    ok('商品后台：载体商品上架 → 409', up.status === 409)
    ok('商品后台：载体商品改价 → 409', (await call('PUT', `/api/admin/products/${carrier.id}`, { price: 1 }, aj)).status === 409)
    ok('商品后台：载体商品改发货方式 → 409', (await call('PUT', `/api/admin/products/${carrier.id}`, { deliveryType: 'MANUAL' }, aj)).status === 409)
    ok('商品后台：删除载体商品 → 409', (await call('DELETE', `/api/admin/products/${carrier.id}`, undefined, aj)).status === 409)
    const same = await call('PUT', `/api/admin/products/${carrier.id}`, { name: carrier.name, status: 0, price: 0, deliveryType: 'TOPUP' }, aj)
    ok('商品后台：三项与现值相同（编辑弹窗原样带回）→ 200', same.status === 200)
    const cp = await prisma.product.findUniqueOrThrow({ where: { id: carrier.id } })
    ok('  …载体商品仍是下架、价格 0、TOPUP', cp.status === 0 && centsOf(cp.price) === 0 && cp.deliveryType === 'TOPUP')

    console.log('\n[第 91 条防御：充值单上的客服留言不计入页头红点]')
    await prisma.orderMessage.create({ data: { orderId: order.id, sender: 'ADMIN', content: 'itest', readByBuyer: false } })
    const un = await call('GET', '/api/account/unread', undefined, bj)
    ok('/api/account/unread：0', un.data?.data?.messages === 0)

    console.log('\n[迟到付款：待核实条目、标记已处理、退入买家余额、补单被拒]')
    const y2 = await freeYuan()
    const pr3 = await call('POST', '/api/wallet/topup', { amountCents: y2 * 100, clientToken: crypto.randomUUID(), termsVersion: WALLET_TERMS_VERSION }, bj)
    const o4 = await prisma.order.findUniqueOrThrow({ where: { orderNo: pr3.data?.data?.orderNo } })
    const v4 = await prisma.vmqOrder.findFirstOrThrow({ where: { bizType: 'order', bizId: o4.id } })
    await vmq.discardVmqOrder(v4.orderId)
    await topup.closeUnpaidTopup(o4.id)
    await prisma.vmqOrder.update({ where: { id: v4.id }, data: { createdAt: new Date(Date.now() - 40 * 60_000) } })
    const price4 = (centsOf(v4.reallyPrice) / 100).toFixed(2)
    await vmq.markPaidByAmount(price4, 2, `你已成功收款${price4}元（${RUN}-a）`)
    await vmq.markPaidByAmount(price4, 2, `你已成功收款${price4}元（${RUN}-b）`)
    const keys = (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, orderBy: { key: 'asc' }, select: { key: true } })).map((s) => s.key).filter((k) => !unmatchedBefore.has(k))
    ok('两笔迟到到账 → 两条待核实条目（过了冷却期，没自动退）', keys.length === 2)
    const cfgv = await call('GET', '/api/admin/vmq/config', undefined, aj)
    const open = (cfgv.data?.data?.unmatched || []).filter((u: { key: string }) => keys.includes(u.key))
    ok('收款监控：这两条标 carrier=true', open.length === 2 && open.every((u: { carrier?: boolean }) => u.carrier === true))
    const mh = await call('POST', '/api/admin/vmq/unmatched', { key: keys[0] }, aj)
    ok('「标记已处理」不选方式 → 400', mh.status === 400)
    const mb = await call('POST', '/api/admin/vmq/unmatched', { key: keys[0], handledAs: 'IGNORE' }, bj)
    ok('买家调标记接口 → 403', mb.status === 403 || mb.status === 401)
    const tb = await call('GET', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[1])}/to-balance`, undefined, aj)
    ok('退入候选：有这张已关闭的充值单、建议它', tb.status === 200 && tb.data?.data?.candidates?.some((c: { orderNo: string; closed: boolean }) => c.orderNo === o4.orderNo && c.closed) && tb.data.data.suggest === o4.orderNo)
    ok('买家调退入接口 → 403', [401, 403].includes((await call('POST', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[1])}/to-balance`, { orderNo: o4.orderNo, tradeNo: '20260929220014000012121212' }, bj)).status))
    const tn = await call('POST', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[1])}/to-balance`, { orderNo: o4.orderNo, tradeNo: '123' }, aj)
    ok('交易号不合法 → 400 TRADE_NO', tn.status === 400 && tn.data?.code === 'TRADE_NO')
    const tradeNo = `2026${Date.now()}`.padEnd(24, '7')
    const w0 = await call('GET', '/api/account/wallet', undefined, bj)
    const tt = await call('POST', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[1])}/to-balance`, { orderNo: o4.orderNo, tradeNo }, aj)
    ok('退入买家余额：200', tt.status === 200, JSON.stringify(tt.data))
    const w1 = await call('GET', '/api/account/wallet', undefined, bj)
    ok('  …买家充值余额 + 实收，钱包横幅有「关闭后收到一笔付款」', w1.data?.data?.topupCents - w0.data?.data?.topupCents === centsOf(v4.reallyPrice) && w1.data.data.recentLateCredits?.some((c: { cents: number }) => c.cents === centsOf(v4.reallyPrice)))
    const again = await call('POST', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[1])}/to-balance`, { orderNo: o4.orderNo, tradeNo: `${tradeNo.slice(0, 20)}1111` }, aj)
    ok('同一条目再退 → 409', again.status === 409)
    // B1 评审修复（§2.7「页面同时列出之前那几笔」）：另一条的候选逐笔列出刚才那笔退入；手填订单号的查询给同样的明细
    const tb2 = await call('GET', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[0])}/to-balance`, undefined, aj)
    const c2 = tb2.data?.data?.candidates?.find((c: { orderNo: string }) => c.orderNo === o4.orderNo)
    ok('另一条的退入候选：这张单 priorLatepay=1、priorList 带交易号与条目 key', c2?.priorLatepay === 1 && c2.priorList?.[0]?.tradeNo === tradeNo && c2.priorList[0].entryKey === keys[1] && c2.priorList[0].cents === centsOf(v4.reallyPrice))
    const lk = await call('GET', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[0])}/to-balance?orderNo=${encodeURIComponent(o4.orderNo)}`, undefined, aj)
    ok('?orderNo= 手填查询：同样的逐笔明细、carrier=true', lk.status === 200 && lk.data?.data?.lookup?.carrier === true && lk.data.data.lookup.priorList?.[0]?.tradeNo === tradeNo)
    const lk0 = await call('GET', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[0])}/to-balance?orderNo=${RUN}NOPE`, undefined, aj)
    ok('?orderNo= 查不到：lookup=null', lk0.status === 200 && lk0.data?.data?.lookup === null)
    ok('  …买家调查询 → 403', [401, 403].includes((await call('GET', `/api/admin/vmq/unmatched/${encodeURIComponent(keys[0])}/to-balance?orderNo=${encodeURIComponent(o4.orderNo)}`, undefined, bj)).status))
    const ig = await call('POST', '/api/admin/vmq/unmatched', { key: keys[0], handledAs: 'IGNORE' }, aj)
    ok('另一条选「核实不是新到账」→ 200', ig.status === 200)
    const mc = await call('POST', '/api/admin/vmq/complete', { id: v4.id }, aj)
    ok('「补单」对充值单的收款单 → 拒绝、提示用「退入买家余额」', !mc.data?.success && String(mc.data?.error).includes('退入买家余额'))
    ok('  …收款单状态没被改动', (await prisma.vmqOrder.findUniqueOrThrow({ where: { id: v4.id } })).state === -1)
    const lp = await call('GET', '/api/admin/wallet/latepay', undefined, aj)
    ok('「余额与充值 → 迟到付款」：有这笔手动退入（交易号）与 IGNORE 条目', lp.status === 200 && lp.data?.data?.logs?.some((l: { tradeNo: string | null; orderNo: string }) => l.tradeNo === tradeNo && l.orderNo === o4.orderNo) && lp.data.data.handledOther?.some((h: { key: string; handledAs: string }) => h.key === keys[0] && h.handledAs === 'IGNORE'))
    ok('  …买家访问 → 403', [401, 403].includes((await call('GET', '/api/admin/wallet/latepay', undefined, bj)).status))

    console.log('\n[cron 与条款页]')
    const cron = await call('GET', '/api/cron/vmq-close', undefined, undefined, { 'x-cron-secret': process.env.CRON_SECRET || '' })
    ok('vmq-close：200 且带 topupSweep（兜底清扫）', cron.status === 200 && !!cron.data?.data?.topupSweep && typeof cron.data.data.topupSweep.closed === 'number', cron.text.slice(0, 200))
    const tAll = await call('GET', '/terms')
    ok('条款页：充值对全部用户开放时第四节有《余额与充值规则》', tAll.status === 200 && tAll.text.includes('余额与充值规则') && tAll.text.includes('单笔充值金额以充值页为准'))
    // B1 评审修复：接码还没对全部用户开放（开发库没有 sms_config → canUseForJiema=false）时不登「余额可付接码 / 预扣」那一条
    ok('  …「余额能付接码」不成立：不出现第 2 条（余额目前可用于支付短信接码订单）', !tAll.text.includes('余额目前可用于支付短信接码订单'))
    await setCfg({ topupEnabled: true, topupAudience: 'ADMIN_ONLY' })
    const tAdm = await call('GET', '/terms')
    ok('条款页：受众仅管理员（灰度）时不出现', tAdm.status === 200 && !tAdm.text.includes('余额与充值规则'))
    const page = await call('GET', '/wallet/topup', undefined, bj)
    ok('/wallet/topup 页面 200（noindex）', page.status === 200 && /noindex/.test(page.text))
  } finally {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true, orderNo: true } })
    const oids = orders.map((o) => o.id)
    const vmqs = await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: { in: oids } }, select: { id: true, orderId: true } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.balanceHold.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.orderMessage.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.vmqLock.deleteMany({ where: { orderId: { in: vmqs.map((v) => v.orderId) } } })
    await prisma.vmqOrder.deleteMany({ where: { id: { in: vmqs.map((v) => v.id) } } })
    await prisma.auditEvent.deleteMany({ where: { OR: [{ targetId: { in: orders.map((o) => o.orderNo) } }, { actorUserId: { in: userIds } }] } })
    await prisma.order.deleteMany({ where: { id: { in: oids } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    const fresh = (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key).filter((k) => !unmatchedBefore.has(k))
    const marks = (await prisma.setting.findMany({ where: { OR: [{ key: { startsWith: 'latepay_trade:' } }, { key: { startsWith: 'latepay_auto:' } }] }, select: { key: true, value: true } })).filter((m) => fresh.includes(m.value)).map((m) => m.key)
    await prisma.setting.deleteMany({ where: { key: { in: [...fresh, ...marks, ...vmqs.map((v) => `vmqrec:${v.id}`), ...KEEP] } } })
    for (const s of saved) await prisma.setting.create({ data: { key: s.key, value: s.value } })
    if (seeded) {
      await prisma.product.deleteMany({ where: { id: seeded.productId } })
      if (seeded.categoryId) await prisma.category.deleteMany({ where: { id: seeded.categoryId } })
    }
  }
  console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
}

main()
  .catch((e) => {
    console.error(e)
    fail++
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
