/**
 * 钱包 B0 —— 接口层端到端自测：打本地 dev server 的真实接口（鉴权、adminGuard、白名单、HTTP 状态码），数据落一次性开发库。
 *
 *   1) npm run dev（.env.local 指向 beiguo_dev）
 *   2) set -a; . ./.env.local; set +a; npx tsx scripts/itest-wallet-http.ts
 *
 * ⚠️ 库名不含 dev / test 时拒绝执行。业务逻辑的断言在 scripts/itest-wallet.ts（直接调 lib），这里只验接口这一层：
 *   · 买家：/api/account/wallet 未登录 401、响应白名单（无 note / bizKey）、no-store、canUseForJiema；overview 返回两格总额；
 *   · 后台：/api/admin/wallet/* 非管理员 403；调整（LATEPAY 400、重放 duplicate）；CSV；配置保存校验与二次确认；对账；
 *     流水详情按类型分支（HOLD 流水不再报「没有找到对应的返现记录」）；内推管理「提现/调整」旧入口改走 ledger；
 *   · cron：/api/cron/wallet-reconcile 无密钥拒绝、带密钥 200。
 */
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { PrismaClient, Prisma } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库`)
  process.exit(2)
}
const BASE = process.env.ITEST_BASE || 'http://localhost:3000'
const prisma = new PrismaClient()
const RUN = `iwh${Date.now().toString(36)}`
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

type Jar = Map<string, string>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(method: string, path: string, body?: unknown, jar?: Jar, extra: Record<string, string> = {}): Promise<{ status: number; data: any; headers: Headers; text: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
  if (jar && jar.size) headers.Cookie = Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' })
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
  const ledger = await import('../src/lib/wallet/ledger')
  const hold = await import('../src/lib/wallet/hold')
  const hash = await bcrypt.hash(PW, 10)
  const userIds: number[] = []
  const mk = async (name: string, role: 'USER' | 'ADMIN' = 'USER') => {
    const u = await prisma.user.create({ data: { email: `${name}-${RUN}@itest.local`, passwordHash: hash, role, emailVerifiedAt: new Date() } })
    userIds.push(u.id)
    return u
  }
  const cat = await prisma.category.create({ data: { name: `${RUN}-cat` } })
  const product = await prisma.product.create({ data: { categoryId: cat.id, name: `${RUN}-p`, price: new Prisma.Decimal('0'), stock: -1, deliveryType: 'MANUAL', status: 0 } })
  const savedCfg = await prisma.setting.findUnique({ where: { key: 'wallet_config' } })

  try {
    const buyer = await mk('buyer')
    const admin = await mk('admin', 'ADMIN')
    // 买家：充值格 3.00（后台补偿）+ 返现格 2.00；一张接码单预扣 1.00（HOLD 流水）
    await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: buyer.id, topupDeltaCents: 300, type: 'ADJUST', bizKey: `adj:${crypto.randomUUID()}`, note: '内部备注-不该给买家看' }))
    await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: buyer.id, cashDeltaCents: 200, type: 'ADJUST', bizKey: `adj:${crypto.randomUUID()}`, note: '内部备注-不该给买家看' }))
    const order = await prisma.order.create({
      data: { orderNo: `${RUN.toUpperCase()}01`, userId: buyer.id, productId: product.id, productName: '短信接码 · Telegram · 印尼', productPrice: new Prisma.Decimal('1'), quantity: 1, amount: new Prisma.Decimal('1') },
    })
    await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: order.id, userId: buyer.id, orderCents: 100 }))
    const holdLog = await prisma.balanceLog.findUniqueOrThrow({ where: { bizKey: `hold:${order.id}` } })

    console.log('\n[买家钱包接口]')
    const anon = await call('GET', '/api/account/wallet')
    ok('未登录：401', anon.status === 401)
    const bj = await login(buyer.email!)
    const w = await call('GET', '/api/account/wallet?page=1&pageSize=20', undefined, bj)
    ok('200 且 Cache-Control: no-store', w.status === 200 && (w.headers.get('cache-control') || '').includes('no-store'))
    const d = w.data?.data
    ok('两格：可用余额 4.00 = 充值 2.00 + 返现 2.00；预扣中 1.00（不在可用余额里）', d?.balanceCents === 400 && d?.topupCents === 200 && d?.cashCents === 200 && d?.holdingCents === 100, JSON.stringify(d && { b: d.balanceCents, t: d.topupCents, c: d.cashCents, h: d.holdingCents }))
    ok('兼容字段 balance = 总额（元）', d?.balance === 4)
    ok('响应里没有 note / bizKey，也没有内部备注的内容', !/"note"|"bizKey"/.test(w.text) && !w.text.includes('内部备注'))
    ok('B0：canUseForJiema=false、topupOpen=false、不显示开票一句', d?.canUseForJiema === false && d?.topupOpen === false && d?.showInvoiceNotice === false)
    ok('HELD 预扣列出号码页链接', d?.holds?.[0]?.href === `/jiema/order/${order.orderNo}`)
    ok('HOLD 流水：接码付款（余额部分）、ref 是本人订单（打码单号）', d?.logs?.[0]?.typeLabel === '接码付款（余额部分）' && d?.logs?.[0]?.ref?.kind === 'SMS' && d?.logs?.[0]?.ref?.orderNoMasked !== order.orderNo)
    const cat2 = await call('GET', '/api/account/wallet?cat=withdraw', undefined, bj)
    ok('分类「提现/调整」只有 ADJUST / WITHDRAW / TOPUP_REFUND', cat2.data?.data?.logs?.length === 2 && cat2.data.data.logs.every((l: { type: string }) => ['ADJUST', 'WITHDRAW', 'TOPUP_REFUND'].includes(l.type)))
    const ov = await call('GET', '/api/account/overview', undefined, bj)
    ok('个人中心 overview：balance = 两格总额 4.00', ov.data?.data?.balance === 4, JSON.stringify(ov.data?.data?.balance))
    const rf = await call('GET', '/api/account/referral', undefined, bj)
    ok('推荐面板：balance = 返现格 2.00、canUseForJiema=false', rf.data?.data?.balance === 2 && rf.data?.data?.canUseForJiema === false)
    const ro = await call('GET', '/api/account/referral/orders', undefined, bj)
    ok('推荐页：canUseForJiema=false', ro.data?.data?.canUseForJiema === false)

    console.log('\n[后台 /api/admin/wallet/*：adminGuard]')
    for (const p of ['/api/admin/wallet/overview', '/api/admin/wallet/users', `/api/admin/wallet/users/${buyer.id}`, '/api/admin/wallet/logs', '/api/admin/wallet/topups', '/api/admin/wallet/holds', '/api/admin/wallet/reconcile', '/api/admin/wallet/config']) {
      const r = await call('GET', p, undefined, bj)
      ok(`买家访问 ${p}：403`, r.status === 403 || r.status === 401, String(r.status))
    }
    const aj = await login(admin.email!)
    const ov2 = await call('GET', '/api/admin/wallet/overview', undefined, aj)
    ok('管理员 overview 200，负债 = 两格 + 预扣', ov2.status === 200 && ov2.data?.data?.liability?.totalCents === ov2.data.data.liability.topupCents + ov2.data.data.liability.cashCents + ov2.data.data.liability.heldCents)
    const us = await call('GET', `/api/admin/wallet/users?q=${RUN}`, undefined, aj)
    ok('用户余额列表：两格与预扣', us.data?.data?.list?.some((u: { id: number; totalCents: number; heldCents: number }) => u.id === buyer.id && u.totalCents === 400 && u.heldCents === 100))
    const ud = await call('GET', `/api/admin/wallet/users/${buyer.id}`, undefined, aj)
    ok('用户详情：后台可见内部备注与 bizKey', ud.data?.data?.logs?.some((l: { note: string; bizKey: string }) => l.note === '内部备注-不该给买家看' && l.bizKey?.startsWith('adj:')))

    console.log('\n[后台调整]')
    const rid = crypto.randomUUID()
    const body = { kind: 'CASH_SUB', userId: buyer.id, amountCents: 150, reason: '提现：已线下打款', requestId: rid }
    const a1 = await call('POST', '/api/admin/wallet/adjust', body, aj)
    const a2 = await call('POST', '/api/admin/wallet/adjust', body, aj)
    ok('提现 1.50：记账；同一请求号再提交：duplicate', a1.data?.success === true && a1.data.data.type === 'WITHDRAW' && a2.data?.data?.duplicate === true, `${a1.text} | ${a2.text}`)
    ok('  …返现格 0.50', (await prisma.user.findUniqueOrThrow({ where: { id: buyer.id } })).balance.toString() === '0.5')
    const late = await call('POST', '/api/admin/wallet/adjust', { ...body, kind: 'LATEPAY', requestId: crypto.randomUUID() }, aj)
    ok('传 LATEPAY：400', late.status === 400)
    const noReason = await call('POST', '/api/admin/wallet/adjust', { ...body, reason: '', requestId: crypto.randomUUID() }, aj)
    ok('不填原因：400', noReason.status === 400)
    const byBuyer = await call('POST', '/api/admin/wallet/adjust', { ...body, kind: 'CASH_ADD', requestId: crypto.randomUUID() }, bj)
    ok('买家打调整接口给自己加钱：403', byBuyer.status === 403 || byBuyer.status === 401)
    const cross = await call('POST', '/api/admin/wallet/adjust', { ...body, kind: 'CASH_ADD', requestId: crypto.randomUUID() }, aj, { Origin: 'https://evil.bigolab.com', 'Sec-Fetch-Site': 'same-site' })
    ok('兄弟子域的跨站 POST（管理员 cookie）：403（同源校验）', cross.status === 403)

    console.log('\n[内推管理「提现/调整」旧入口：只作用于返现格，改走 ledger]')
    const rb = await call('GET', `/api/admin/referrals/balance?userId=${buyer.id}`, undefined, aj)
    ok('GET 多返回 topupCents；balance 仍是返现格', rb.data?.data?.balance === 0.5 && rb.data?.data?.topupCents === 200)
    const rid2 = crypto.randomUUID()
    const p1 = await call('POST', '/api/admin/referrals/balance', { userId: buyer.id, delta: 3, note: '补偿', requestId: rid2 }, aj)
    const p2 = await call('POST', '/api/admin/referrals/balance', { userId: buyer.id, delta: 3, note: '补偿', requestId: rid2 }, aj)
    ok('正数 → ADJUST 记一次；同一请求号重放 → duplicate', p1.data?.data?.balance === 3.5 && p2.data?.data?.duplicate === true && p2.data?.data?.balance === 3.5)
    const p3 = await call('POST', '/api/admin/referrals/balance', { userId: buyer.id, delta: -99 }, aj)
    ok('扣成负数：「余额不足，扣减后不能为负」', p3.status === 400 && p3.data?.error === '余额不足，扣减后不能为负')
    const adjLog = await prisma.balanceLog.findUnique({ where: { bizKey: `adj:${rid2}` } })
    ok('流水带 adj:<requestId> 与 topup_after_cents', adjLog?.type === 'ADJUST' && adjLog.topupAfterCents === 200)

    console.log('\n[流水详情：按类型分支]')
    const hd = await call('GET', `/api/admin/balance-logs/${holdLog.id}`, undefined, aj)
    ok('HOLD 流水详情：不报「没有找到对应的返现记录」，带预扣与本人订单', hd.status === 200 && !(hd.data?.data?.warnings || []).some((x: string) => x.includes('返现记录')) && hd.data?.data?.hold?.state === 'HELD' && hd.data?.data?.log?.orderKind === 'OWN')
    ok('  …两格变动前后（充值格 −1.00：3.00 → 2.00）', hd.data?.data?.log?.topupDeltaCents === -100 && hd.data?.data?.log?.topupBeforeCents === 300 && hd.data?.data?.log?.topupAfterCents === 200)
    const ad = await call('GET', `/api/admin/balance-logs/${adjLog!.id}`, undefined, aj)
    ok('调整流水详情：不报错、没有警告', ad.status === 200 && (ad.data?.data?.warnings || []).length === 0)
    const udd = await call('GET', `/api/admin/users/${buyer.id}/detail`, undefined, aj)
    ok('用户详情接口：wallet 两格、stats.balance = 两格总额', udd.data?.data?.wallet?.topupCents === 200 && udd.data?.data?.stats?.balance === 5.5)
    const ul = await call('GET', `/api/admin/users?keyword=${RUN}`, undefined, aj)
    ok('用户列表接口多返回 topupCents', ul.data?.data?.list?.some((u: { id: number; topupCents: number }) => u.id === buyer.id && u.topupCents === 200))

    console.log('\n[流水 CSV / 配置 / 对账 / cron]')
    const csv = await call('GET', `/api/admin/wallet/logs?userId=${buyer.id}&format=csv`, undefined, aj)
    // fetch 的 text() 会吞掉 BOM，按原始字节看
    const raw = new Uint8Array(await (await fetch(`${BASE}/api/admin/wallet/logs?userId=${buyer.id}&format=csv`, { headers: { Cookie: Array.from(aj.entries()).map(([k, v]) => `${k}=${v}`).join('; ') } })).arrayBuffer())
    ok('CSV：text/csv、UTF-8 BOM、含两格列', (csv.headers.get('content-type') || '').includes('text/csv') && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf && csv.text.includes('充值格变动'))
    await prisma.setting.deleteMany({ where: { key: 'wallet_config' } })
    const c0 = await call('GET', '/api/admin/wallet/config', undefined, aj)
    ok('配置读不到：config=null、reason=MISSING、给出厂值', c0.data?.data?.config === null && c0.data?.data?.reason === 'MISSING' && c0.data?.data?.factory?.maxCents === 100000)
    const { version: _v, ...factory } = c0.data.data.factory
    const bad = await call('PUT', '/api/admin/wallet/config', { config: { ...factory, tiersCents: [550] }, expectVersion: 0 }, aj)
    ok('保存档位 ¥5.5：400 + 逐项 errors', bad.status === 400 && !!bad.data?.errors?.['tiersCents.0'])
    const s1 = await call('PUT', '/api/admin/wallet/config', { config: factory, expectVersion: 0 }, aj)
    ok('保存出厂值：版本 1', s1.data?.data?.config?.version === 1)
    const s2 = await call('PUT', '/api/admin/wallet/config', { config: { ...factory, latepayAuto: false }, expectVersion: 1 }, aj)
    ok('关「迟到付款自动退入」不带确认：409 needConfirm', s2.status === 409 && s2.data?.needConfirm === 'latepayAuto')
    const s3 = await call('PUT', '/api/admin/wallet/config', { config: { ...factory, latepayAuto: false }, expectVersion: 1, confirmLatepay: true }, aj)
    ok('二次确认后保存：版本 2', s3.data?.data?.config?.version === 2 && s3.data.data.config.latepayAuto === false)
    const s4 = await call('PUT', '/api/admin/wallet/config', { config: factory, expectVersion: 1, confirmLatepay: true }, aj)
    ok('拿旧版本号保存：409', s4.status === 409)
    ok('保存写审计', (await prisma.auditEvent.count({ where: { action: 'wallet.config', actorUserId: admin.id } })) === 2)

    console.log('\n[评审修复：坏掉的配置能从「设置」保存修好；B1 起充值开关可以打开]')
    const g0 = await call('GET', '/api/admin/wallet/config', undefined, aj)
    ok('GET：storedVersion = 当前版本 2、topupAvailable=true（B1 已交付）', g0.data?.data?.storedVersion === 2 && g0.data?.data?.topupAvailable === true)
    const on = await call('PUT', '/api/admin/wallet/config', { config: { ...factory, latepayAuto: false, topupEnabled: true }, expectVersion: 2 }, aj)
    ok('打开充值开关：B1 起照常保存（版本 3）', on.status === 200 && on.data?.data?.config?.version === 3 && on.data.data.config.topupEnabled === true)
    await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...c0.data.data.factory, version: 3, maxCents: 200000 }) } })
    const g1 = await call('GET', '/api/admin/wallet/config', undefined, aj)
    ok('库里是「合法 JSON、version=3、校验不过」：config=null、reason=INVALID、storedVersion=3', g1.data?.data?.config === null && g1.data?.data?.reason === 'INVALID' && g1.data?.data?.storedVersion === 3)
    const cp0 = await call('PUT', '/api/admin/wallet/config', { config: factory, expectVersion: 0, confirmLatepay: true }, aj)
    ok('按旧页面的 expectVersion=0 保存：409，conflict=BROKEN（文案说已损坏，不再是「被别人改过」）', cp0.status === 409 && cp0.data?.conflict === 'BROKEN' && String(cp0.data?.error).includes('已损坏'))
    const cp1 = await call('PUT', '/api/admin/wallet/config', { config: factory, expectVersion: g1.data.data.storedVersion, confirmLatepay: true }, aj)
    ok('按 storedVersion 保存：修好（版本 4）', cp1.status === 200 && cp1.data?.data?.config?.version === 4)
    const g2 = await call('GET', '/api/admin/wallet/config', undefined, aj)
    ok('  …再读：config 有值、storedVersion=4', g2.data?.data?.config?.version === 4 && g2.data?.data?.storedVersion === 4)
    const ovw = await call('GET', '/api/admin/wallet/overview', undefined, aj)
    ok('看板 overview 带 topupAvailable=true（B1 已交付）', ovw.data?.data?.topupAvailable === true)
    const brief = await call('GET', '/api/account/wallet?brief=1', undefined, bj)
    ok('买家 brief=1：totals=null（不再给出负的「累计消费」）', brief.status === 200 && brief.data?.data?.totals === null && brief.data?.data?.holdingCents === 100)
    const csvHead = await call('GET', `/api/admin/wallet/logs?userId=${buyer.id}&format=csv`, undefined, aj)
    ok('CSV 时间列按北京时间（表头「时间（北京）」、形如 2026-09-29 12:00:00）', csvHead.text.includes('时间（北京）') && /\r\n\d+,\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},/.test(csvHead.text))
    const longNote = '线下打款说明'.repeat(38) + '12'
    const ln = await call('POST', '/api/admin/referrals/balance', { userId: buyer.id, delta: 0.01, note: longNote, requestId: crypto.randomUUID() }, aj)
    ok('内推管理「提现/调整」230 字备注：照常记账（入参不变，改造前 max 255）', ln.status === 200 && ln.data?.success === true, ln.text.slice(0, 120))
    await call('POST', '/api/admin/referrals/balance', { userId: buyer.id, delta: -0.01, note: '冲回', requestId: crypto.randomUUID() }, aj)

    console.log('\n[评审修复：返现扣回之后，推荐页 / 内推管理 / 用户详情的累计返现与钱包页一致]')
    const promo = await mk('promo')
    const refOrder = await prisma.order.create({
      data: { orderNo: `${RUN.toUpperCase()}R1`, userId: admin.id, productId: product.id, productName: 'x', productPrice: new Prisma.Decimal('50'), quantity: 1, amount: new Prisma.Decimal('50'), payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED', referrerId: promo.id, referralReward: new Prisma.Decimal('5') },
    })
    await prisma.referralReward.create({ data: { orderId: refOrder.id, referrerId: promo.id, buyerId: admin.id, productId: product.id, amount: new Prisma.Decimal('5'), status: 'SETTLED', settledAt: new Date() } })
    await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: promo.id, cashDeltaCents: 500, type: 'REFERRAL', bizKey: null, orderId: refOrder.id, note: `订单#${refOrder.id} 内推返现` }))
    const cb = await call('POST', '/api/admin/wallet/adjust', { kind: 'CLAWBACK', referralOrderId: refOrder.id, reason: '推荐订单事后退款', requestId: crypto.randomUUID() }, aj)
    ok('返现扣回 5.00：记账', cb.data?.success === true && cb.data?.data?.type === 'CLAWBACK', cb.text.slice(0, 160))
    const pj = await login(promo.email!)
    const pw = await call('GET', '/api/account/wallet', undefined, pj)
    const pr = await call('GET', '/api/account/referral', undefined, pj)
    const pro = await call('GET', '/api/account/referral/orders', undefined, pj)
    ok('钱包页「累计返现」0.00', pw.data?.data?.totals?.referral === 0)
    ok('推荐面板 totalReward 0.00（= 已结算 5.00 − 扣回 5.00）、clawedBackReward 5.00', pr.data?.data?.totalReward === 0 && pr.data?.data?.clawedBackReward === 5)
    ok('推荐页「已到账返现」0.00、clawedBackReward 5.00（与钱包页一致）', pro.data?.data?.summary?.settledReward === 0 && pro.data?.data?.summary?.clawedBackReward === 5)
    const ar = await call('GET', '/api/admin/referrals', undefined, aj)
    const arRow = (ar.data?.data?.referrers || []).find((r: { id: number }) => r.id === promo.id)
    ok('内推管理：该推广人「累计返现」0.00、已扣回 5.00；返现笔数不变', !!arRow && arRow.settledTotal === 0 && arRow.clawedBack === 5 && arRow.settledCount === 1, JSON.stringify(arRow))
    const ud2 = await call('GET', `/api/admin/users/${promo.id}/detail`, undefined, aj)
    ok('后台用户详情：内推返现合计 0.00、rewardClawedBack 5.00', ud2.data?.data?.referral?.rewardTotal === 0 && ud2.data?.data?.stats?.referralRewardTotal === 0 && ud2.data?.data?.referral?.rewardClawedBack === 5)

    const rc = await call('POST', '/api/admin/wallet/reconcile', { full: true }, aj)
    ok('手动对账：返回 W1–W9 九项', rc.data?.data?.report?.items?.length === 9)
    const cronNo = await call('GET', '/api/cron/wallet-reconcile')
    ok('cron 不带密钥：拒绝', cronNo.status === 401 || cronNo.status === 403 || cronNo.status === 500, String(cronNo.status))
    if (process.env.CRON_SECRET) {
      const cronOk = await call('GET', '/api/cron/wallet-reconcile', undefined, undefined, { 'x-cron-secret': process.env.CRON_SECRET })
      ok('cron 带 x-cron-secret：200，只回各项计数', cronOk.status === 200 && cronOk.data?.data?.total === 9 && !cronOk.text.includes('Cents'))
    }
  } finally {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } })
    await prisma.referralReward.deleteMany({ where: { OR: [{ referrerId: { in: userIds } }, { orderId: { in: orders.map((o) => o.id) } }] } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.balanceHold.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } })
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.category.delete({ where: { id: cat.id } })
    await prisma.auditEvent.deleteMany({ where: { OR: [{ actorUserId: { in: userIds } }, { targetType: 'user', targetId: { in: userIds.map(String) } }] } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.setting.deleteMany({ where: { key: { in: ['wallet_config', 'wallet_reconcile_last'] } } })
    if (savedCfg) await prisma.setting.create({ data: { key: savedCfg.key, value: savedCfg.value } })
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
