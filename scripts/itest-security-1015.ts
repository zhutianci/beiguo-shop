/**
 * 2026-10-15 攻防加固端到端自测（docs/安全-攻防加固设计-1015.md）：打本地 dev server 的真实接口，数据落一次性开发库。
 *
 *   1) dev server 指向 beiguo_dev，且**假配**阿里云邮件（让「邮件已配置」的分支生效；发信本身会失败，测试直接往库里插码）：
 *        ALIYUN_ACCESS_KEY_ID=x ALIYUN_ACCESS_KEY_SECRET=x ALIYUN_DM_NOREPLY=no-reply@itest.local npx next dev -p 3100
 *   2) ITEST_BASE=http://localhost:3100 DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-security-1015.ts
 *
 * ⚠️ dev server 首次编译某个路由时会重新加载服务端模块，进程内的封禁 / 计数会被清空：先把用到的路由都访问一遍（或连跑两次），
 *    结果以第二次为准。生产构建没有按需编译，不受影响。
 * ⚠️ 库名不含 dev / test 时拒绝执行。测试数据用 @itest.local 邮箱，跑完清理。IP 用 cf-connecting-ip 模拟，每次运行换末段。
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库`)
  process.exit(2)
}

const BASE = process.env.ITEST_BASE || 'http://localhost:3100'
const CRON_SECRET = process.env.CRON_SECRET || ''
const PRODUCT_ID = Number(process.env.ITEST_PRODUCT_ID || 9)
const prisma = new PrismaClient()
const RUN = Date.now().toString(36)
const OCT = (Date.now() % 200) + 20
const ip = (n: number) => `198.18.${n}.${OCT}`
const mail = (n: string) => `${n}-${RUN}@itest.local`
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
async function call(method: string, path: string, opts: { body?: unknown; jar?: Jar; ip?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Origin: BASE, ...(opts.headers || {}) }
  if (opts.ip) headers['cf-connecting-ip'] = opts.ip
  if (opts.jar && opts.jar.size) headers.Cookie = Array.from(opts.jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  const res = await fetch(BASE + path, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body), redirect: 'manual' })
  const setCookies = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() || []
  if (opts.jar) {
    for (const c of setCookies) {
      const [kv] = c.split(';')
      const i = kv.indexOf('=')
      const k = kv.slice(0, i).trim()
      const v = kv.slice(i + 1).trim()
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c) || v === '') opts.jar.delete(k)
      else opts.jar.set(k, v)
    }
  }
  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, data, setCookies }
}

async function mkUser(email: string, opts: { role?: 'USER' | 'ADMIN'; ageMs?: number } = {}) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(PW, 10),
      role: opts.role ?? 'USER',
      emailVerifiedAt: new Date(),
      createdAt: new Date(Date.now() - (opts.ageMs ?? 0)),
    },
  })
}

async function plantCode(email: string, purpose: string, code: string) {
  await prisma.emailCode.updateMany({ where: { email, purpose, used: false }, data: { expiresAt: new Date() } })
  await prisma.emailCode.create({ data: { email, purpose, code, expiresAt: new Date(Date.now() + 600_000) } })
}

async function login(email: string, ipAddr: string, jar: Jar = new Map(), code?: string) {
  const r = await call('POST', '/api/auth/login', { body: { email, password: PW, ...(code ? { code } : {}) }, jar, ip: ipAddr })
  return { ...r, jar }
}

async function order(jar: Jar, ipAddr: string) {
  return call('POST', '/api/orders', { body: { productId: PRODUCT_ID, quantity: 1, remark: '支付方式: 支付宝' }, jar, ip: ipAddr })
}

const DAY = 86_400_000

async function main() {
  console.log(`BASE=${BASE} DB=${dbName} RUN=${RUN}\n`)
  const product = await prisma.product.findUnique({ where: { id: PRODUCT_ID }, select: { status: true, stock: true } })
  if (!product || product.status !== 1) throw new Error(`商品 ${PRODUCT_ID} 不在售，用 ITEST_PRODUCT_ID 指定一个`)

  // ---------- 蜜罐：盲猜支付回调 ----------
  console.log('[支付回调蜜罐]')
  {
    const A = ip(1)
    const r1 = await call('POST', '/api/pay/notify', { body: { money: 1 }, ip: A })
    ok('盲猜的回调地址回普通 404 JSON', r1.status === 404 && r1.data?.error === '资源不存在', `${r1.status} ${JSON.stringify(r1.data)}`)
    const real = await call('GET', '/api/pay/sms-notify', { ip: A })
    ok('真实回调路由不受影响（GET → 405）', real.status === 405, String(real.status))
    await call('POST', '/api/pay/vmq/notify', { ip: A })
    const pre = await login(mail('nobody'), A)
    ok('命中 2 次：还能正常走登录（回的是密码错误，不是封禁）', pre.status !== 429, `${pre.status} ${pre.data?.error}`)
    await call('GET', '/api/pay/callback', { ip: A })
    const blocked = await login(mail('nobody'), A)
    ok('命中 3 次：该 IP 1 小时内登录被拒（429）', blocked.status === 429, `${blocked.status} ${blocked.data?.error}`)
    const other = await login(mail('nobody'), ip(2))
    ok('别的 IP 不受影响', other.status !== 429, String(other.status))
    const browse = await call('GET', '/api/announcement', { ip: A })
    ok('被封 IP 照常浏览', browse.status === 200, String(browse.status))
    for (let i = 0; i < 5; i++) await call('POST', '/api/pay/notify', { ip: ip(3), headers: { 'Sec-Fetch-Site': 'cross-site' } })
    const x = await login(mail('nobody'), ip(3))
    ok('跨站请求（Sec-Fetch-Site: cross-site）不计数：防恶意网页栽赃访客 IP', x.status !== 429, String(x.status))
  }

  // ---------- 不存在的 API ----------
  console.log('\n[不存在的 API]')
  {
    const B = ip(4)
    const r = await call('GET', '/api/this-does-not-exist', { ip: B })
    ok('回 JSON 404（以前是 11KB 的 HTML 页）', r.status === 404 && r.data?.error === '资源不存在', String(r.status))
    // 上面那一次也算 1 个不同路径
    for (let i = 0; i < 8; i++) await call('GET', `/api/probe-${i}`, { ip: B })
    ok('9 个不同路径：不封', (await login(mail('nobody'), B)).status !== 429)
    await call('GET', '/api/probe-8', { ip: B })
    ok('第 10 个不同路径：封 IP', (await login(mail('nobody'), B)).status === 429)
  }

  // ---------- 普通用户反复试后台 → 自动封号 ----------
  console.log('\n[普通用户试后台]')
  const prober = await mkUser(mail('prober'), { ageMs: 3 * DAY })
  {
    const C = ip(5)
    const { jar } = await login(prober.email!, C)
    const o = await order(jar, C)
    ok('先下一单（待付）', o.data?.success === true, JSON.stringify(o.data))
    const paths = ['/api/admin/orders', '/api/admin/users', '/api/admin/products', '/api/admin/cardkeys', '/api/admin/config']
    const first = await call('GET', paths[0], { jar, ip: C })
    ok('拒绝的响应与以前逐字相同（403 + 无管理员权限）', first.status === 403 && first.data?.error === '无管理员权限', `${first.status} ${JSON.stringify(first.data)}`)
    for (const p of paths.slice(1)) await call('POST', p, { jar, ip: C, body: {} })
    const u = await prisma.user.findUnique({ where: { id: prober.id }, select: { status: true, sessionEpoch: true } })
    ok('第 5 个不同后台路径：账号被禁用、会话版本 +1', u?.status === 0 && u.sessionEpoch === 1, JSON.stringify(u))
    const me = await call('GET', '/api/auth/me', { jar, ip: ip(6) })
    ok('手里的 token 立即失效', me.status === 401, String(me.status))
    const os = await prisma.order.findMany({ where: { userId: prober.id }, select: { payStatus: true, deliveryStatus: true } })
    ok('名下未付单被取消', os.length === 1 && os[0].deliveryStatus === 'CANCELLED', JSON.stringify(os))
    const ev = await prisma.auditEvent.count({ where: { action: 'sec.ban', targetId: String(prober.id) } })
    ok('写了封禁审计', ev === 1, String(ev))
  }
  {
    // 未登录打后台：不计数（站长登录过期的后台页会连着打好几个接口）
    const D = ip(7)
    for (const p of ['/api/admin/a', '/api/admin/b', '/api/admin/c', '/api/admin/d', '/api/admin/e', '/api/admin/f']) await call('GET', p, { ip: D })
    ok('未登录打 6 个后台路径：IP 不封', (await login(mail('nobody'), D)).status !== 429)
  }

  // ---------- 下单闸门 ----------
  console.log('\n[下单闸门]')
  {
    const fresh = await mkUser(mail('fresh'))
    const E = ip(8)
    const { jar } = await login(fresh.email!, E)
    const o1 = await order(jar, E)
    const o2 = await order(jar, E)
    ok('注册不满 1 小时：第 1 单放行', o1.data?.success === true, JSON.stringify(o1.data))
    ok('注册不满 1 小时：第 2 单被拒（新号同时只能 1 笔待付）', o2.status === 429 && /新注册账号/.test(o2.data?.error || ''), `${o2.status} ${o2.data?.error}`)

    const otherMail = await mkUser(mail('corp'), { ageMs: 3 * 3600_000 })
    const F = ip(9)
    const j2 = (await login(otherMail.email!, F)).jar
    const p1 = await order(j2, F)
    const p2 = await order(j2, F)
    ok('非主流邮箱、注册 3 小时：同样只能 1 笔待付', p1.data?.success === true && p2.status === 429, `${p1.status} ${p2.status} ${p2.data?.error}`)

    const old = await mkUser(mail('old'), { ageMs: 3 * DAY })
    const G = ip(10)
    const j3 = (await login(old.email!, G)).jar
    const r = [await order(j3, G), await order(j3, G), await order(j3, G), await order(j3, G)]
    ok('老账号：30 分钟内 3 笔待付放行', r.slice(0, 3).every((x) => x.data?.success === true), r.map((x) => x.status).join(','))
    ok('第 4 笔被拒（以前只数收款单：连下不付款就能一直下）', r[3].status === 429 && /未付款/.test(r[3].data?.error || ''), `${r[3].status} ${r[3].data?.error}`)
    await prisma.order.updateMany({ where: { userId: old.id }, data: { createdAt: new Date(Date.now() - 31 * 60_000) } })
    const after = await order(j3, G)
    ok('30 分钟前的未付单不再占名额（不会永久锁住放弃过订单的买家）', after.data?.success === true, `${after.status} ${after.data?.error}`)

    // 同一出口跨账号：10 分钟 10 单
    const H = ip(11)
    let rejected = 0
    for (let k = 0; k < 4; k++) {
      const u = await mkUser(mail(`ipmate${k}`), { ageMs: 3 * DAY })
      const j = (await login(u.email!, H)).jar
      for (let n = 0; n < 3; n++) if ((await order(j, H)).status === 429) rejected++
    }
    ok('同一出口 4 个老账号各下 3 单：第 11、12 单被 IP 维度拒绝', rejected === 2, String(rejected))
  }

  // ---------- 过期未付单自动取消 ----------
  console.log('\n[过期未付单]')
  if (!CRON_SECRET) {
    ok('（跳过：没有 CRON_SECRET）', true)
  } else {
    const u = await mkUser(mail('abandon'), { ageMs: 3 * DAY })
    const j = (await login(u.email!, ip(12))).jar
    const o = await order(j, ip(12))
    const id = o.data?.data?.order?.id as number
    await prisma.$executeRaw`UPDATE orders SET created_at = NOW(3) - INTERVAL 25 HOUR, updated_at = NOW(3) - INTERVAL 25 HOUR WHERE id = ${id}`
    const fresh = await order(j, ip(12))
    const cron = await call('GET', '/api/cron/vmq-close', { headers: { 'x-cron-secret': CRON_SECRET } })
    const rows = await prisma.order.findMany({ where: { id: { in: [id, fresh.data?.data?.order?.id ?? -1] } }, select: { id: true, deliveryStatus: true } })
    const st = new Map(rows.map((x) => [x.id, x.deliveryStatus]))
    ok('超过 24 小时、从没发起付款的单被取消', cron.status === 200 && st.get(id) === 'CANCELLED', `${cron.status} ${JSON.stringify(cron.data?.data)} ${st.get(id)}`)
    ok('新下的单不受影响', st.get(fresh.data?.data?.order?.id) === 'PENDING', String(st.get(fresh.data?.data?.order?.id)))
  }

  // ---------- 注册邮箱分级 ----------
  console.log('\n[注册邮箱分级]')
  {
    const I = ip(13)
    const s1 = await call('POST', '/api/auth/send-code', { body: { email: `x${RUN}@maxxspace.com`, purpose: 'REGISTER' }, ip: I })
    ok('一次性邮箱发不了注册码', s1.status === 400 && /暂不支持注册/.test(s1.data?.error || ''), `${s1.status} ${s1.data?.error}`)
    const em = `y${RUN}@guerrillamailblock.com`
    await plantCode(em, 'REGISTER', '135790')
    const r1 = await call('POST', '/api/auth/register', { body: { email: em, password: PW, code: '135790' }, ip: I })
    ok('提前拿到码也注册不了', r1.data?.success !== true && /暂不支持注册/.test(r1.data?.error || ''), JSON.stringify(r1.data))
    const s2 = await call('POST', '/api/auth/send-code', { body: { email: `z${RUN}@maxxspace.com`, purpose: 'RESET' }, ip: I })
    ok('找回密码不受影响（老用户哪怕用的是一次性邮箱也能找回）', !/暂不支持注册/.test(s2.data?.error || ''), `${s2.status} ${s2.data?.error}`)
    // 严格白名单（默认）：库里没有 security_email_policy 行也按严格
    const corp = `c${RUN}@transwarp.io`
    await plantCode(corp, 'REGISTER', '246802')
    const r2 = await call('POST', '/api/auth/register', { body: { email: corp, password: PW, code: '246802' }, ip: I })
    ok('严格白名单：没加进信任名单的企业邮箱注册不了', r2.data?.success !== true && /类型暂不支持注册/.test(r2.data?.error || ''), JSON.stringify(r2.data))
    const qq = `q${RUN}@qq.com`
    await plantCode(qq, 'REGISTER', '112358')
    const r3 = await call('POST', '/api/auth/register', { body: { email: qq, password: PW, code: '112358' }, ip: I })
    ok('主流邮箱照常注册', r3.data?.success === true, JSON.stringify(r3.data))
    await prisma.user.deleteMany({ where: { email: { in: [corp, qq] } } })
    await prisma.emailCode.deleteMany({ where: { email: { in: [em, corp, qq, `x${RUN}@maxxspace.com`, `z${RUN}@maxxspace.com`] } } })
  }

  // ---------- 管理员二次验证 ----------
  console.log('\n[管理员二次验证]')
  const admin = await mkUser(mail('admin'), { role: 'ADMIN' })
  {
    const J = ip(14)
    const jar: Jar = new Map()
    const a1 = await login(admin.email!, J, jar)
    ok('新设备只给密码：不签发 token（本地发信必然失败 → 500）', a1.data?.success !== true && !jar.has('token'), `${a1.status} ${JSON.stringify(a1.data)}`)
    await plantCode(admin.email!, 'ADMIN_LOGIN', '112233')
    const bad = await login(admin.email!, J, jar, '000000')
    ok('错码不放行', bad.data?.success !== true && !jar.has('token'), JSON.stringify(bad.data))
    const a2 = await login(admin.email!, J, jar, '112233')
    const tokenCookie = a2.setCookies.find((c) => c.startsWith('token=')) || ''
    ok('密码 + 正确验证码：登录成功并记为受信设备', a2.data?.success === true && jar.has('adm_dev'), JSON.stringify(a2.data))
    ok('管理员 token 只有 12 小时', /max-age=43200/i.test(tokenCookie), tokenCookie.slice(0, 120))
    const a3 = await login(admin.email!, J, jar)
    ok('受信设备再登录只要密码', a3.data?.success === true, JSON.stringify(a3.data))
    const sec = await call('GET', '/api/admin/security', { jar, ip: J })
    ok('后台安全卡片能看到被封的 IP 和安全记录', sec.status === 200 && sec.data?.data?.ipBans?.some((b: { key: string }) => b.key === ip(1)) && sec.data?.data?.events?.length > 0, JSON.stringify(sec.data?.data?.ipBans))
    ok('默认模式是严格白名单', sec.data?.data?.policy === 'STRICT', String(sec.data?.data?.policy))
    const put = await call('PUT', '/api/admin/security', {
      jar,
      ip: J,
      body: { policy: 'STRICT', trusted: 'transwarp.io\nmaxxspace.com', blocked: 'qq.com\nnewspam.example' },
    })
    ok(
      '信任名单里的一次性邮箱、拦截名单里的主流邮箱都被剔除',
      put.data?.data?.trusted === 'transwarp.io' && put.data?.data?.blocked === 'newspam.example' && /maxxspace\.com/.test(put.data?.message || '') && /qq\.com/.test(put.data?.message || ''),
      JSON.stringify(put.data),
    )
    const corp2 = `d${RUN}@transwarp.io`
    await plantCode(corp2, 'REGISTER', '258025')
    const c2 = await call('POST', '/api/auth/register', { body: { email: corp2, password: PW, code: '258025' }, ip: ip(15) })
    ok('后台加进信任名单的企业域名立即能注册', c2.data?.success === true, JSON.stringify(c2.data))
    await call('PUT', '/api/admin/security', { jar, ip: J, body: { policy: 'TIERED' } })
    const s = await call('POST', '/api/auth/send-code', { body: { email: `n${RUN}@newspam.example`, purpose: 'REGISTER' }, ip: ip(15) })
    ok('切到分级：后台拦截名单生效', /暂不支持注册/.test(s.data?.error || ''), `${s.status} ${s.data?.error}`)
    const corp3 = `e${RUN}@pdlaser.cn`
    await plantCode(corp3, 'REGISTER', '369036')
    const c3 = await call('POST', '/api/auth/register', { body: { email: corp3, password: PW, code: '369036' }, ip: ip(15) })
    ok('切到分级：没列名的企业邮箱能注册', c3.data?.success === true, JSON.stringify(c3.data))
    await call('PUT', '/api/admin/security', { jar, ip: J, body: { policy: 'STRICT', trusted: '', blocked: '' } })
    await prisma.user.deleteMany({ where: { email: { in: [corp2, corp3] } } })
    await prisma.emailCode.deleteMany({ where: { email: { in: [corp2, corp3, `n${RUN}@newspam.example`] } } })
    const unban = await call('POST', '/api/admin/security', { jar, ip: J, body: { unbanIp: ip(1) } })
    ok('后台解封 IP', unban.data?.success === true && (await login(mail('nobody'), ip(1))).status !== 429)

    // 后台禁用用户 = 顺带取消未付单
    const victim = await mkUser(mail('victim'), { ageMs: 3 * DAY })
    const vj = (await login(victim.email!, ip(16))).jar
    await order(vj, ip(16))
    const dis = await call('PUT', `/api/admin/users/${victim.id}`, { jar, ip: J, body: { status: 0 } })
    const vo = await prisma.order.findMany({ where: { userId: victim.id }, select: { deliveryStatus: true } })
    ok('后台禁用用户：提示里说清取消了几笔、订单已取消', dis.data?.success === true && /取消其未付款订单 1 笔/.test(dis.data?.message || '') && vo[0]?.deliveryStatus === 'CANCELLED', `${dis.data?.message} ${JSON.stringify(vo)}`)
  }

  // ---------- 社区：看不到的帖子，评论也不给 ----------
  console.log('\n[社区评论可见性]')
  {
    const cat = await prisma.forumCategory.findFirst({ where: { status: 1 }, select: { id: true } })
    const author = await mkUser(mail('author'))
    const hidden = await prisma.forumPost.create({
      data: { categoryId: cat!.id, userId: author.id, authorName: 'a', title: `itest 隐藏帖 ${RUN}`, content: 'x', reviewStatus: 'REJECTED' },
    })
    const c = await prisma.forumComment.create({ data: { postId: hidden.id, userId: author.id, authorName: 'a', content: '评论' } })
    const r = await call('GET', `/api/forum/posts/${hidden.id}/comments?page=1&pageSize=20`, { ip: ip(17) })
    ok('驳回帖子下的评论：匿名读不到（404）', r.status === 404, String(r.status))
    const aj = (await login(author.email!, ip(17))).jar
    const r2 = await call('GET', `/api/forum/posts/${hidden.id}/comments?page=1&pageSize=20`, { jar: aj, ip: ip(17) })
    ok('作者本人照常能看', r2.status === 200, String(r2.status))
    const like = await call('POST', `/api/forum/comments/${c.id}/like`, { jar: aj, ip: ip(17) })
    ok('隐藏帖子下的评论不能点赞（不能拿来探测）', like.status === 404, String(like.status))
    await prisma.forumLike.deleteMany({ where: { commentId: c.id } })
    await prisma.forumComment.deleteMany({ where: { postId: hidden.id } })
    await prisma.forumPost.deleteMany({ where: { id: hidden.id } })
  }

  // ---------- 清理 ----------
  const users = await prisma.user.findMany({ where: { email: { endsWith: `${RUN}@itest.local` } }, select: { id: true } })
  const ids = users.map((u) => u.id)
  const orders = await prisma.order.findMany({ where: { userId: { in: ids } }, select: { id: true } })
  const oids = orders.map((o) => o.id)
  await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oids } } })
  await prisma.vmqLock.deleteMany({ where: { orderId: { in: (await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: { in: oids } }, select: { orderId: true } })).map((v) => v.orderId) } } })
  await prisma.vmqOrder.deleteMany({ where: { bizType: 'order', bizId: { in: oids } } })
  await prisma.order.deleteMany({ where: { id: { in: oids } } })
  await prisma.auditEvent.deleteMany({ where: { OR: [{ actorUserId: { in: ids } }, { targetType: 'user', targetId: { in: ids.map(String) } }, { ip: { startsWith: '198.18.' } }] } })
  await prisma.emailCode.deleteMany({ where: { email: { endsWith: `${RUN}@itest.local` } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  console.log(`\n${pass} 通过，${fail} 失败`)
  await prisma.$disconnect()
  process.exit(fail ? 1 : 0)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
