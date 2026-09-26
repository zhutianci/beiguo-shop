/**
 * WP1 集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp1.ts
 *
 * 覆盖实施分包 4.5（能在进程内验证的部分）：
 *   W1-1  lulu cookie 到主站、主站 token 以 Bearer / cookie 打 lulu（getCurrentUser 与 /api/auth/me）→ 未登录
 *   W1-2  老 token（无 aud）主站有效、lulu 无效；JWT_LEGACY_TOKENS=reject 时主站也无效；aud 数组 / tid 不符一律无效
 *   W1-3  lulu 注册：registeredTenantId=lulu、TenantCustomer(REGISTER) 1 行、token aud=lulu、留痕 source=register:<code>；
 *         主站注册：registeredTenantId=1、无客户关系行、token aud=main、留痕 source=register
 *   W1-4  渠道 Host 请求关闭模块的全部 API（38 个 route、全部方法；含 D3 补的 bindings/send-code、bindings/verify）→ 404 JSON；主站同样请求不被拦；
 *         关闭模块的 16 个页面 layout 在渠道 Host notFound、主站照常
 *   W1-5  根布局 generateMetadata：渠道 noindex+follow、metadataBase=渠道 origin、无站长验证；主站与基线（git HEAD 的常量）逐字相同
 *   W1-6  robots：主站与基线（git HEAD 的 robots.ts）逐字相同；渠道对 AI 爬虫整站 Disallow、其他 UA 不写 Disallow: /、无 sitemap 行；
 *         sitemap：渠道 []、主站与基线逐字相同
 *   W1-8  营销受众：lulu 注册且无主站已付单的用户不在受众（ALL / SEGMENT / USERS / 粘贴解析）；在主站付一单后进入；
 *         已付统计与「买过」只看主站订单
 *   W1-9  （进程内替代）渠道 Provider 下渲染页头、页脚、首页与被裁组件：不出现关闭模块的链接与组件；主站渲染照旧
 *   W1-10 ADMIN token（aud=lulu）在 lulu Host 直连调用全部 /api/admin/* route 的全部方法 → 一律非 2xx；经 adminGuard 的为 404；
 *         requireAdmin 在渠道 Host 抛 AdminHostError、主站照常
 *   W1-11 ADMIN 在 lulu 登录 → 拒绝签发；注册 → 已注册；两者都不产生 TenantCustomer；ADMIN 旧 token（aud=lulu）getCurrentUser → null
 *   W1-12 主站老用户在 lulu 登录、浏览、登出 → TenantCustomer 0 行
 *   W1-13 middleware：休眠时 lulu Host 访问 /admin 与改造前逐字相同（跳登录）；开启后 Host 粗分流；/partner 休眠放行
 *   W1-14 (shop) 外壳：SUSPENDED 挂横幅、TERMINATED 挂停业页闸门；DRAFT 非预览 404、预览用户放行
 *   W1-15 渠道 Host 的 /api/mkt/*、/api/invoice-requests/* → 404（并入 W1-4）
 * 不在这里验证（需要起应用或浏览器）：W1-7 prerender-manifest、W1-9 浏览器网络面板、W1-15 两个客户端页面的 HTTP 状态码。
 */
import * as React from 'react'
import Module from 'module'
import { execFileSync } from 'child_process'
import { mkdtempSync, readdirSync, statSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  createWorld,
  createTenant,
  createUser,
  cleanupAll,
  callRoute,
  withRequest,
  catchNext,
  signTestToken,
  mail,
  MAIL_DOMAIN,
  TEST_PASSWORD,
  RUN,
  type World,
  type RouteFn,
} from './_harness'

// ---------------------------------------------------------------------------
// 进程内加载 Next 页面 / 布局模块的最小替身：
//  · 仓库 tsconfig 是 jsx: preserve，tsx 按经典运行时编译 JSX（React.createElement），需要全局 React；
//  · 根布局 import './globals.css' 与 next/font/google（后者只能在 Next 的编译器里调用），这里换成空对象 / 假字体。
// 只影响本测试进程。
// ---------------------------------------------------------------------------
;(globalThis as unknown as { React: typeof React }).React = React
const Mod = Module as unknown as { _load: (r: string, p: unknown, m: boolean) => unknown }
const origLoad = Mod._load
Mod._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request.endsWith('.css')) return {}
  if (request === 'next/font/google') return { Inter: () => ({ className: 'inter' }) }
  return origLoad.call(this, request, parent, isMain)
}
// 测试进程不发任何真实邮件 / 企业微信（register 走「邮件服务未配置」分支，不需要验证码）
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) {
  delete process.env[k]
}
delete process.env.JWT_LEGACY_TOKENS
delete process.env.PLATFORM_HOSTS

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'src').replace(/\\/g, '/')
const MAIN_HOST = 'bigolab.com'

type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** 递归在 React 元素树里找某个组件类型（layout 返回的是未渲染的元素树） */
function findType(node: unknown, type: unknown): boolean {
  if (!node) return false
  if (Array.isArray(node)) return node.some((n) => findType(n, type))
  if (typeof node !== 'object') return false
  const el = node as { type?: unknown; props?: { children?: unknown } }
  if (el.type === type) return true
  return findType(el.props?.children, type)
}

/** 从 git HEAD（基线：改造前的线上版本）取一个源文件，把 @/ 别名改成绝对路径，写进临时目录，返回可 import 的路径 */
let baseDir: string | null = null
function baselineModule(rel: string): string | null {
  try {
    const src = execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf8' })
    if (!baseDir) baseDir = mkdtempSync(path.join(tmpdir(), 'itest-wp1-'))
    const file = path.join(baseDir, rel.replace(/[\\/]/g, '__'))
    writeFileSync(file, src.replace(/from '@\//g, `from '${SRC}/`))
    return file
  } catch (e) {
    console.log(`  （跳过基线比对：取不到 git HEAD:${rel}：${(e as Error).message.split('\n')[0]}）`)
    return null
  }
}

function stable(v: unknown): string {
  return JSON.stringify(v)
}

async function allRouteFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (name === 'route.ts') out.push(p)
    }
  }
  walk(dir)
  return out.sort()
}

/** 路由文件路径 → 动态段参数（[id] → '1'，[token] → 'itest-token'） */
function paramsFor(file: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const m of Array.from(file.replace(/\\/g, '/').matchAll(/\[([^\]]+)\]/g))) {
    const k = m[1].replace(/^\.\.\./, '')
    params[k] = /id$/i.test(k) ? '1' : `itest-${k}`
  }
  return params
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const

async function main() {
  await cleanupAll()
  await cleanupWp1()
  setChannelsMode('observe')
  const w = await createWorld()
  try {
    await testTokens(w)
    await testRegister(w)
    await testLogin(w)
    await testClosedApis(w)
    await testClosedLayouts(w)
    await testMetadataRobots(w)
    await testAudience(w)
    await testClientRender()
    await testAdmin(w)
    await testMiddleware(w)
    await testShopShell(w)
  } finally {
    setChannelsMode('dormant')
    await cleanupWp1()
    await cleanupAll()
    await prisma.$disconnect()
  }
  const { fail } = summary()
  process.exit(fail === 0 ? 0 : 1)
}

/** WP1 自己多写的数据：注册留痕（外键无，但按邮箱清干净） */
async function cleanupWp1(): Promise<void> {
  await prisma.marketingConsentLog.deleteMany({ where: { email: { endsWith: MAIL_DOMAIN } } })
}

// ---------------------------------------------------------------------------
// W1-1 / W1-2：token 按店面隔离
// ---------------------------------------------------------------------------
async function testTokens(w: World) {
  const { getCurrentUser, verifyTokenFor, signToken, verifyToken } = await import('../../src/lib/auth')
  const me = (await import('../../src/app/api/auth/me/route')) as { GET: RouteFn }
  const u = w.users.luluBuyer1
  const secret = process.env.JWT_SECRET as string
  const cur = (host: string, token: string | null, bearer = false) =>
    withRequest({ host, token, bearer }, () => getCurrentUser()).then((x) => x?.id ?? null)

  section('W1-1 lulu 的 token 到主站、主站的 token 到 lulu → 未登录')
  const luluTok = w.token(u, w.lulu)
  const mainTok = w.token(u, w.main)
  check('lulu token @ lulu（cookie）→ 登录', (await cur(w.lulu.host, luluTok)) === u.id)
  check('lulu token @ lulu（Bearer）→ 登录', (await cur(w.lulu.host, luluTok, true)) === u.id)
  check('lulu cookie @ 主站 → 未登录', (await cur(MAIN_HOST, luluTok)) === null)
  check('lulu token Bearer @ 主站 → 未登录', (await cur(MAIN_HOST, luluTok, true)) === null)
  check('主站 token Bearer @ lulu → 未登录', (await cur(w.lulu.host, mainTok, true)) === null)
  check('主站 token cookie @ lulu → 未登录', (await cur(w.lulu.host, mainTok)) === null)
  check('zz token @ lulu → 未登录', (await cur(w.lulu.host, w.token(u, w.zz), true)) === null)
  check('主站 token @ 主站 → 登录', (await cur(MAIN_HOST, mainTok)) === u.id)
  const meLulu = await callRoute(me.GET, { host: w.lulu.host, token: mainTok, bearer: true, path: '/api/auth/me' })
  check('/api/auth/me：主站 token Bearer @ lulu → 401', meLulu.status === 401, String(meLulu.status))
  const meMain = await callRoute(me.GET, { host: MAIN_HOST, token: luluTok, path: '/api/auth/me' })
  check('/api/auth/me：lulu cookie @ 主站 → 401', meMain.status === 401, String(meMain.status))
  const meOk = await callRoute(me.GET, { host: w.lulu.host, token: luluTok, path: '/api/auth/me' })
  check('/api/auth/me：lulu token @ lulu → 200', meOk.status === 200 && meOk.json?.data?.user?.id === u.id)

  section('W1-2 老 token（无 aud）与异常 aud')
  const legacy = jwt.sign({ userId: u.id, email: u.email, role: 'USER', sv: 0 }, secret, { expiresIn: '1h' })
  check('老 token @ 主站 → 登录', (await cur(MAIN_HOST, legacy)) === u.id)
  check('老 token @ localhost（主站白名单）→ 登录', (await cur('localhost:3000', legacy)) === u.id)
  check('老 token @ lulu → 未登录', (await cur(w.lulu.host, legacy)) === null)
  process.env.JWT_LEGACY_TOKENS = 'reject'
  check('JWT_LEGACY_TOKENS=reject：老 token @ 主站 → 未登录', (await cur(MAIN_HOST, legacy)) === null)
  check('JWT_LEGACY_TOKENS=reject：新 token @ 主站仍有效', (await cur(MAIN_HOST, mainTok)) === u.id)
  delete process.env.JWT_LEGACY_TOKENS
  const arr = jwt.sign({ userId: u.id, email: u.email, role: 'USER', ep: 0, aud: ['main', w.lulu.code] }, secret, { expiresIn: '1h' })
  check('aud 数组 @ 主站 → 未登录', (await cur(MAIN_HOST, arr)) === null)
  check('aud 数组 @ lulu → 未登录', (await cur(w.lulu.host, arr)) === null)
  const wrongTid = jwt.sign({ userId: u.id, email: u.email, role: 'USER', ep: 0, aud: w.lulu.code, tid: w.zz.id }, secret, { expiresIn: '1h' })
  check('aud=lulu 但 tid=zz @ lulu → 未登录', (await cur(w.lulu.host, wrongTid)) === null)
  const numAud = jwt.sign({ userId: u.id, email: u.email, role: 'USER', ep: 0, aud: 1 }, secret, { expiresIn: '1h' })
  check('aud 非字符串 @ 主站 → 未登录', (await cur(MAIN_HOST, numAud)) === null)
  const epOnly = jwt.sign({ userId: u.id, email: u.email, role: 'USER', ep: 5, aud: 'main' }, secret, { expiresIn: '1h' })
  check('ep 与库里 sessionEpoch 不符 → 未登录', (await cur(MAIN_HOST, epOnly)) === null)
  const svOnly = jwt.sign({ userId: u.id, email: u.email, role: 'USER', sv: 0, aud: 'main' }, secret, { expiresIn: '1h' })
  check('只有 sv（P0 前置版本签的）且相符 → 登录', (await cur(MAIN_HOST, svOnly)) === u.id)
  check('未知 Host 严格期 → 未登录（没有店面）', await (async () => {
    setChannelsMode('strict')
    try {
      return (await cur('evil.example.com', mainTok)) === null
    } finally {
      setChannelsMode('observe')
    }
  })())

  // signToken / verifyTokenFor 的形状
  const t = signToken({ userId: u.id, email: u.email, role: 'USER', ep: 3 }, { id: w.lulu.id, code: w.lulu.code })
  const p = jwt.decode(t) as Json
  check('signToken：aud=code、tid=id、ep 与 sv 同值', p.aud === w.lulu.code && p.tid === w.lulu.id && p.ep === 3 && p.sv === 3)
  check('verifyTokenFor：签发店面通过、他店拒绝', !!verifyTokenFor(t, { id: w.lulu.id, code: w.lulu.code, kind: 'CHANNEL' }) && !verifyTokenFor(t, { id: 1, code: 'main', kind: 'PLATFORM' }))
  let threw = false
  try {
    signToken({ userId: u.id, email: u.email, role: 'USER', ep: 0 }, null as never)
  } catch {
    threw = true
  }
  check('signToken 不给店面 → 抛错', threw)
  check('verifyToken 拒绝字符串载荷', verifyToken(jwt.sign('plain', secret)) === null)

  section('W1-2 休眠：任何 Host 都是主站')
  setChannelsMode('dormant')
  try {
    check('休眠：lulu Host + 主站 token → 登录（店面是主站）', (await cur(w.lulu.host, mainTok)) === u.id)
    check('休眠：lulu Host + lulu token → 未登录', (await cur(w.lulu.host, luluTok)) === null)
    check('休眠：老 token @ 任意 Host → 登录', (await cur('1.2.3.4', legacy)) === u.id)
  } finally {
    setChannelsMode('observe')
  }
}

// ---------------------------------------------------------------------------
// W1-3：注册写注册站与客户关系
// ---------------------------------------------------------------------------
async function testRegister(w: World) {
  const reg = (await import('../../src/app/api/auth/register/route')) as { POST: RouteFn }
  section('W1-3 注册站与客户关系')
  const luluEmail = mail('wp1-reg-lulu')
  const r1 = await callRoute(reg.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/register', body: { email: luluEmail, password: TEST_PASSWORD } })
  check('lulu 注册成功', r1.status === 200 && r1.json?.success === true, r1.text.slice(0, 200))
  const u1 = await prisma.user.findUnique({ where: { email: luluEmail }, select: { id: true, registeredTenantId: true } })
  check('lulu 注册：registeredTenantId = lulu', u1?.registeredTenantId === w.lulu.id)
  const c1 = u1 ? await prisma.tenantCustomer.findMany({ where: { userId: u1.id } }) : []
  check('lulu 注册：TenantCustomer 恰 1 行、tenant=lulu、via=REGISTER、无下单时间', c1.length === 1 && c1[0].tenantId === w.lulu.id && c1[0].joinedVia === 'REGISTER' && c1[0].firstOrderAt === null)
  const tok1 = jwt.decode(String(r1.json?.data?.token || '')) as Json
  check('lulu 注册：token aud=lulu、tid=lulu', tok1?.aud === w.lulu.code && tok1?.tid === w.lulu.id)
  const log1 = await prisma.marketingConsentLog.findFirst({ where: { email: luluEmail }, select: { source: true } })
  check('lulu 注册：留痕 source = register:<code>（≤24 字）', log1?.source === `register:${w.lulu.code}`.slice(0, 24), String(log1?.source))

  const mainEmail = mail('wp1-reg-main')
  const r2 = await callRoute(reg.POST, { host: MAIN_HOST, method: 'POST', path: '/api/auth/register', body: { email: mainEmail, password: TEST_PASSWORD } })
  check('主站注册成功', r2.status === 200 && r2.json?.success === true, r2.text.slice(0, 200))
  const u2 = await prisma.user.findUnique({ where: { email: mainEmail }, select: { id: true, registeredTenantId: true } })
  check('主站注册：registeredTenantId = 1', u2?.registeredTenantId === 1)
  check('主站注册：无客户关系行', u2 ? (await prisma.tenantCustomer.count({ where: { userId: u2.id } })) === 0 : false)
  const tok2 = jwt.decode(String(r2.json?.data?.token || '')) as Json
  check('主站注册：token aud=main、tid=1', tok2?.aud === 'main' && tok2?.tid === 1)
  const log2 = await prisma.marketingConsentLog.findFirst({ where: { email: mainEmail }, select: { source: true } })
  check('主站注册：留痕 source 仍是 register（与改造前相同）', log2?.source === 'register', String(log2?.source))
  const resp2Keys = Object.keys(r2.json?.data?.user || {}).sort().join(',')
  check('主站注册：响应 user 字段与改造前相同', resp2Keys === 'avatar,email,id,nickname,phone,role', resp2Keys)

  // 渠道店面 DRAFT / TERMINATED 不开放注册（审查意见：直接 POST 能在没开张 / 已停业的站建号、写客户关系、被主站营销排除）；
  // SUSPENDED 是临时状态，照常注册。店面 status 每请求查库，改完即生效
  try {
    for (const st of ['DRAFT', 'TERMINATED'] as const) {
      await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: st } })
      const e = mail(`wp1-reg-${st.toLowerCase()}`)
      const r = await callRoute(reg.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/register', body: { email: e, password: TEST_PASSWORD } })
      const n = await prisma.user.count({ where: { email: e } })
      check(`lulu ${st}：注册被拒（403、不建号）`, r.status === 403 && r.json?.success === false && n === 0, `${r.status} ${r.text.slice(0, 120)}`)
    }
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'SUSPENDED' } })
    const e4 = mail('wp1-reg-suspended')
    const r4 = await callRoute(reg.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/register', body: { email: e4, password: TEST_PASSWORD } })
    const u4 = await prisma.user.findUnique({ where: { email: e4 }, select: { registeredTenantId: true } })
    check('lulu SUSPENDED：照常注册（临时状态）', r4.status === 200 && u4?.registeredTenantId === w.lulu.id, r4.text.slice(0, 120))
  } finally {
    await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'ACTIVE' } })
  }

  // 休眠：lulu Host 注册 → 主站（registeredTenantId=1、无客户关系）
  setChannelsMode('dormant')
  try {
    const e3 = mail('wp1-reg-dormant')
    const r3 = await callRoute(reg.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/register', body: { email: e3, password: TEST_PASSWORD } })
    const u3 = await prisma.user.findUnique({ where: { email: e3 }, select: { id: true, registeredTenantId: true } })
    check('休眠：lulu Host 注册按主站记（registeredTenantId=1、无客户关系）', r3.status === 200 && u3?.registeredTenantId === 1 && (await prisma.tenantCustomer.count({ where: { userId: u3!.id } })) === 0)
  } finally {
    setChannelsMode('observe')
  }
}

// ---------------------------------------------------------------------------
// W1-11 / W1-12：ADMIN 不能在渠道站登录；登录不建客户关系
// ---------------------------------------------------------------------------
async function testLogin(w: World) {
  const login = (await import('../../src/app/api/auth/login/route')) as { POST: RouteFn }
  const logout = (await import('../../src/app/api/auth/logout/route')) as unknown as { POST: RouteFn }
  const reg = (await import('../../src/app/api/auth/register/route')) as { POST: RouteFn }
  const { getCurrentUser } = await import('../../src/lib/auth')
  const sa = w.users.sa

  section('W1-11 ADMIN 在 lulu 登录 / 注册')
  const r1 = await callRoute(login.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/login', body: { email: sa.email, password: TEST_PASSWORD } })
  check('ADMIN @ lulu 登录 → 拒绝签发', r1.json?.success === false && r1.json?.error === '管理员账号请在主站登录' && !r1.json?.data?.token, r1.text.slice(0, 200))
  const r1b = await callRoute(login.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/login', body: { email: sa.email, password: 'wrong-password' } })
  check('ADMIN @ lulu 输错密码 → 与普通账号同一句（不泄露管理员身份）', r1b.json?.error === '邮箱或密码错误')
  const r2 = await callRoute(reg.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/register', body: { email: sa.email, password: TEST_PASSWORD } })
  check('ADMIN @ lulu 注册 → 拒绝（已注册）', r2.json?.success === false && !r2.json?.data?.token)
  check('ADMIN：TenantCustomer 无该用户', (await prisma.tenantCustomer.count({ where: { userId: sa.id } })) === 0)
  const saLulu = w.token(sa, w.lulu)
  check('ADMIN 的 lulu token（夹具伪造）@ lulu getCurrentUser → null', (await withRequest({ host: w.lulu.host, token: saLulu }, () => getCurrentUser())) === null)
  const r3 = await callRoute(login.POST, { host: MAIN_HOST, method: 'POST', path: '/api/auth/login', body: { email: sa.email, password: TEST_PASSWORD } })
  const t3 = jwt.decode(String(r3.json?.data?.token || '')) as Json
  check('ADMIN @ 主站登录照常（aud=main）', r3.json?.success === true && t3?.aud === 'main' && t3?.tid === 1, r3.text.slice(0, 200))

  section('W1-12 主站老用户在 lulu 登录、浏览、登出')
  const old = w.users.mainOldLoginLulu
  const r4 = await callRoute(login.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/login', body: { email: old.email, password: TEST_PASSWORD } })
  const tok = String(r4.json?.data?.token || '')
  const t4 = jwt.decode(tok) as Json
  check('lulu 登录成功，token aud=lulu', r4.json?.success === true && t4?.aud === w.lulu.code, r4.text.slice(0, 200))
  const who = await withRequest({ host: w.lulu.host, token: tok }, () => getCurrentUser())
  check('浏览：lulu 上 getCurrentUser 识别', who?.id === old.id)
  const lo = await callRoute(logout.POST, { host: w.lulu.host, token: tok, method: 'POST', path: '/api/auth/logout' })
  check('登出 200', lo.status === 200)
  // 设计 4.6 C4（集成阶段补）：auth 写接口同源校验。兄弟子域发来的登出 / 登录一律 403，同源照常
  const csrfLo = await callRoute(logout.POST, { host: w.lulu.host, token: tok, method: 'POST', path: '/api/auth/logout', headers: { origin: `https://${w.zz.host}`, 'sec-fetch-site': 'same-site' } })
  check('登出：Origin = 兄弟子域 → 403', csrfLo.status === 403, `${csrfLo.status}`)
  const csrfLi = await callRoute(login.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/login', body: { email: old.email, password: TEST_PASSWORD }, headers: { origin: 'https://bigolab.com', 'sec-fetch-site': 'same-site' } })
  check('渠道站登录：Origin = 主站（兄弟子域）→ 403、不签发', csrfLi.status === 403 && !csrfLi.json?.data?.token, csrfLi.text.slice(0, 120))
  const okLi = await callRoute(login.POST, { host: w.lulu.host, method: 'POST', path: '/api/auth/login', body: { email: old.email, password: TEST_PASSWORD }, headers: { origin: `https://${w.lulu.host}`, 'sec-fetch-site': 'same-origin' } })
  check('渠道站登录：同源 → 照常签发', okLi.json?.success === true, okLi.text.slice(0, 120))
  const mainCsrf = await callRoute(login.POST, { host: MAIN_HOST, method: 'POST', path: '/api/auth/login', body: { email: old.email, password: TEST_PASSWORD }, headers: { origin: `https://${w.lulu.host}`, 'sec-fetch-site': 'same-site' } })
  check('主站登录：Origin = 渠道子域 → 403', mainCsrf.status === 403, `${mainCsrf.status}`)
  const mainOk = await callRoute(login.POST, { host: MAIN_HOST, method: 'POST', path: '/api/auth/login', body: { email: old.email, password: TEST_PASSWORD }, headers: { origin: `https://${MAIN_HOST}`, 'sec-fetch-site': 'same-origin' } })
  check('主站登录：同源 → 照常签发', mainOk.json?.success === true, mainOk.text.slice(0, 120))
  check('TenantCustomer 0 行', (await prisma.tenantCustomer.count({ where: { userId: old.id } })) === 0)
}

// ---------------------------------------------------------------------------
// W1-4 / W1-15：关闭模块的 API
// ---------------------------------------------------------------------------
const CLOSED_API = [
  'coupons/claim', 'coupons/mine', 'lottery/draw', 'lottery/info', 'lottery/mine',
  'account/referral', 'account/referral/orders', 'account/wallet', 'account/vip', 'account/marketing',
  'account/bindings', 'account/bindings/[id]', 'account/bindings/contact',
  // 主会话 D3：P0 前置阶段新增的绑定验证两步（原不在第 13 节），集成阶段补 denyOnChannel() 后并入
  'account/bindings/send-code', 'account/bindings/verify',
  'external-orders/lookup', 'external-orders/contact', 'external-orders/lookup/send-code', 'external-orders/lookup/verify',
  'forum/categories', 'forum/comments/[id]/like', 'forum/comments/[id]', 'forum/posts/[id]/comments', 'forum/posts/[id]/like', 'forum/posts/[id]', 'forum/posts',
  'news/hot', 'news/list', 'news/share', 'news/view',
  'games/[gameId]/leaderboard', 'games/[gameId]/score',
  'links/[id]/click', 'links/apply',
  'announcement', 'track/view', 'upload',
  'mkt/c/[token]/[idx]', 'mkt/o/[token]', 'mkt/prefs/[token]', 'mkt/unsubscribe/[token]',
  'invoice-requests/[token]',
]

async function testClosedApis(w: World) {
  section('W1-4 / W1-15 渠道 Host 请求关闭模块的 API → 404')
  const tok = w.token(w.users.luluBuyer1, w.lulu)
  let total = 0
  let bad: string[] = []
  for (const rel of CLOSED_API) {
    const mod = (await import(`../../src/app/api/${rel}/route`)) as Record<string, unknown>
    const params = paramsFor(rel)
    for (const m of METHODS) {
      const fn = mod[m] as RouteFn | undefined
      if (typeof fn !== 'function') continue
      total++
      const r = await callRoute(fn, { host: w.lulu.host, token: tok, method: m, path: `/api/${rel}`, params, body: m === 'GET' || m === 'HEAD' || m === 'DELETE' ? undefined : {} })
      if (!(r.status === 404 && r.json?.success === false && r.json?.error === '资源不存在')) bad.push(`${m} ${rel} → ${r.status}`)
    }
  }
  check(`渠道 Host：${total} 个 handler 全部 404 JSON`, bad.length === 0 && total >= 55, bad.join('；'))

  // 休眠：同样的请求不被拦（抽几个无副作用的 GET）
  setChannelsMode('dormant')
  try {
    bad = []
    for (const rel of ['forum/categories', 'announcement', 'lottery/info', 'news/list']) {
      const mod = (await import(`../../src/app/api/${rel}/route`)) as { GET: RouteFn }
      const r = await callRoute(mod.GET, { host: w.lulu.host, path: `/api/${rel}` })
      if (r.status === 404 && r.json?.error === '资源不存在') bad.push(`${rel} → ${r.status}`)
    }
    check('休眠：lulu Host 上的关闭模块 API 不被拦（主站行为不变）', bad.length === 0, bad.join('；'))
  } finally {
    setChannelsMode('observe')
  }
  bad = []
  for (const rel of ['forum/categories', 'announcement', 'lottery/info', 'news/list']) {
    const mod = (await import(`../../src/app/api/${rel}/route`)) as { GET: RouteFn }
    const r = await callRoute(mod.GET, { host: MAIN_HOST, path: `/api/${rel}` })
    if (r.status === 404 && r.json?.error === '资源不存在') bad.push(`${rel} → ${r.status}`)
  }
  check('主站 Host：关闭模块 API 照常', bad.length === 0, bad.join('；'))
}

const CLOSED_LAYOUTS = ['news', 'forum', 'games', 'links', 'chongzhi', 'iptools', 'vip', 'wallet', 'coupon', 'coupons', 'lookup', 'profile/referral']

async function testClosedLayouts(w: World) {
  section('W1-4 关闭模块的页面 layout：渠道 notFound、主站照常')
  const bad: string[] = []
  for (const rel of CLOSED_LAYOUTS) {
    const mod = (await import(`../../src/app/(shop)/${rel}/layout`)) as { default: (p: { children: React.ReactNode }) => Promise<unknown> }
    const onChannel = await withRequest({ host: w.lulu.host }, () => catchNext(() => mod.default({ children: 'x' })))
    const onMain = await withRequest({ host: MAIN_HOST }, () => catchNext(() => mod.default({ children: 'x' })))
    if (onChannel.kind !== 'notFound') bad.push(`${rel}@lulu=${onChannel.kind}`)
    if (onMain.kind !== 'ok') bad.push(`${rel}@main=${onMain.kind}`)
  }
  check(`${CLOSED_LAYOUTS.length} 个 layout：渠道 404、主站渲染`, bad.length === 0, bad.join('；'))
  // 主会话 D4：两个平台令牌页（开票填写、营销退订）的 layout 改为异步服务端 layout，第一行 notFoundOnChannel()
  const badT: string[] = []
  for (const rel of ['invoice-request/[token]', 'unsubscribe/[token]']) {
    const mod = (await import(`../../src/app/${rel}/layout`)) as { default: (p: { children: React.ReactNode }) => Promise<unknown> }
    const onChannel = await withRequest({ host: w.lulu.host }, () => catchNext(() => mod.default({ children: 'x' })))
    const onMain = await withRequest({ host: MAIN_HOST }, () => catchNext(() => mod.default({ children: 'x' })))
    if (onChannel.kind !== 'notFound') badT.push(`${rel}@lulu=${onChannel.kind}`)
    if (onMain.kind !== 'ok') badT.push(`${rel}@main=${onMain.kind}`)
  }
  check('平台令牌页 layout（invoice-request、unsubscribe）：渠道 404、主站渲染（D4）', badT.length === 0, badT.join('；'))
  setChannelsMode('dormant')
  try {
    const mod = (await import('../../src/app/(shop)/forum/layout')) as { default: (p: { children: React.ReactNode }) => Promise<unknown> }
    const r = await withRequest({ host: w.lulu.host }, () => catchNext(() => mod.default({ children: 'x' })))
    check('休眠：lulu Host 上的关闭模块页面照常（主站）', r.kind === 'ok')
  } finally {
    setChannelsMode('observe')
  }
}

// ---------------------------------------------------------------------------
// W1-5 / W1-6：metadata、robots、sitemap
// ---------------------------------------------------------------------------
async function testMetadataRobots(w: World) {
  const layout = (await import('../../src/app/layout')) as { generateMetadata: () => Promise<Json>; dynamic?: string }
  const { siteOrigin } = await import('../../src/lib/news/format')
  section('W1-5 根布局 metadata')
  check('根布局 dynamic = force-dynamic', layout.dynamic === 'force-dynamic')
  const ch = await withRequest({ host: w.lulu.host }, () => layout.generateMetadata())
  check('渠道：robots = { index:false, follow:true }', stable(ch.robots) === stable({ index: false, follow: true }))
  check('渠道：metadataBase = 渠道 origin', String(ch.metadataBase) === `${w.lulu.origin}/`, String(ch.metadataBase))
  check('渠道：不输出站长平台验证', !('verification' in ch))
  check('渠道：站名 / 标题与主站相同（统一品牌）', ch.applicationName === '贝果科技' && typeof ch.title === 'string')
  const mainMeta = await withRequest({ host: MAIN_HOST }, () => layout.generateMetadata())
  check('主站：metadataBase = siteOrigin()', String(mainMeta.metadataBase) === new URL(siteOrigin()).toString())
  check('主站：robots index:true', mainMeta.robots?.index === true && mainMeta.robots?.googleBot?.index === true)
  const baseFile = baselineModule('src/app/layout.tsx')
  if (baseFile) {
    const base = (await import(pathToFileURL(baseFile).href)) as { metadata: unknown }
    check('主站：metadata 与改造前（git HEAD）逐字相同', stable(mainMeta) === stable(base.metadata), `${stable(mainMeta).slice(0, 120)} vs ${stable(base.metadata).slice(0, 120)}`)
  }
  setChannelsMode('dormant')
  try {
    const dm = await withRequest({ host: w.lulu.host }, () => layout.generateMetadata())
    check('休眠：lulu Host 的 metadata = 主站', stable(dm) === stable(mainMeta))
  } finally {
    setChannelsMode('observe')
  }

  section('W1-6 robots.txt / sitemap.xml')
  const robots = (await import('../../src/app/robots')).default as () => Promise<Json>
  const sitemap = (await import('../../src/app/sitemap')).default as () => Promise<Json[]>
  const mr = await withRequest({ host: MAIN_HOST }, () => robots())
  const cr = await withRequest({ host: w.lulu.host }, () => robots())
  const rBase = baselineModule('src/app/robots.ts')
  if (rBase) {
    const base = (await import(pathToFileURL(rBase).href)) as { default: () => unknown }
    check('主站 robots 与改造前逐字相同', stable(mr) === stable(base.default()))
  }
  const ai = cr.rules?.[0]
  check('渠道 robots：AI 爬虫整站 Disallow', Array.isArray(ai?.userAgent) && ai.userAgent.includes('GPTBot') && ai.userAgent.includes('ClaudeBot') && ai.userAgent.includes('Bytespider') && ai.disallow === '/')
  const star = cr.rules?.[1]
  check('渠道 robots：* 不写 Disallow: /，但挡 /partner 与 /api/', star?.userAgent === '*' && Array.isArray(star.disallow) && !star.disallow.includes('/') && star.disallow.includes('/partner') && star.disallow.includes('/api/'))
  check('渠道 robots：无 sitemap / host 行', !('sitemap' in cr) && !('host' in cr))
  const cs = await withRequest({ host: w.lulu.host }, () => sitemap())
  check('渠道 sitemap = []', Array.isArray(cs) && cs.length === 0)
  const ms = await withRequest({ host: MAIN_HOST }, () => sitemap())
  const sBase = baselineModule('src/app/sitemap.ts')
  if (sBase) {
    const base = (await import(pathToFileURL(sBase).href)) as { default: () => Promise<unknown> }
    const b = await base.default()
    check('主站 sitemap 与改造前逐字相同', stable(ms) === stable(b), `${(ms as unknown[]).length} vs ${(b as unknown[]).length}`)
  }
}

// ---------------------------------------------------------------------------
// W1-8：营销受众排除「只属于渠道」的用户
// ---------------------------------------------------------------------------
async function testAudience(w: World) {
  const { resolveAudienceUserIds, resolvePastedUsers } = await import('../../src/lib/marketing/audience')
  section('W1-8 营销受众')
  const lb1 = w.users.luluBuyer1 // lulu 注册、只在 lulu 下单
  const lb2 = w.users.luluBuyer2 // lulu 注册、只在 lulu 下单
  const reg = w.users.luluRegMainOrder // lulu 注册、在主站付过款
  const cross = w.users.crossBuyer // 主站注册
  const ids = [lb1.id, lb2.id, reg.id, cross.id]
  const got = new Set(await resolveAudienceUserIds({ type: 'USERS', userIds: ids } as never))
  check('USERS：lulu 注册且无主站已付单的不在受众', !got.has(lb1.id) && !got.has(lb2.id))
  check('USERS：lulu 注册但在主站付过款的在受众', got.has(reg.id))
  check('USERS：主站注册的在受众', got.has(cross.id))
  const all = new Set(await resolveAudienceUserIds({ type: 'ALL', excludeInactive: false } as never))
  check('ALL：同上', !all.has(lb1.id) && all.has(reg.id) && all.has(cross.id))
  const pasted = await resolvePastedUsers(`${lb1.email}\n${cross.email}\n${reg.id}`)
  check('粘贴解析：渠道用户进「没找到」并标注，其余照常', !pasted.userIds.includes(lb1.id) && pasted.userIds.includes(cross.id) && pasted.userIds.includes(reg.id) && pasted.notFound.some((s) => s.startsWith(lb1.email) && s.includes('渠道')))

  // 主站注册、只在 lulu 付过款：在受众（主站客户），但「付过款」分群按主站订单算 → 不命中
  const onlyLulu = await createUser('wp1-only-lulu-paid')
  await prisma.order.create({
    data: {
      orderNo: `IT${RUN.toUpperCase()}W1A`.slice(0, 32),
      userId: onlyLulu.id,
      productId: w.products.auto,
      productName: 'itest',
      productPrice: new Prisma.Decimal('140.00'),
      quantity: 1,
      amount: new Prisma.Decimal('140.00'),
      payStatus: 'PAID',
      deliveryStatus: 'DELIVERED',
      paidAt: new Date(),
      tenantId: w.lulu.id,
    },
  })
  const seg = new Set(await resolveAudienceUserIds({ type: 'SEGMENT', rules: { paid: 'yes' } } as never))
  check('SEGMENT 付过款：只按主站订单算（只在 lulu 付过款的主站用户不命中）', !seg.has(onlyLulu.id) && seg.has(cross.id))
  const segNo = new Set(await resolveAudienceUserIds({ type: 'SEGMENT', rules: { paid: 'no' } } as never))
  check('SEGMENT 未付款：只在 lulu 付过款的主站用户命中', segNo.has(onlyLulu.id))
  const bought = new Set(await resolveAudienceUserIds({ type: 'SEGMENT', rules: { boughtProductIds: [w.products.auto] } } as never))
  check('SEGMENT 买过某商品：只认主站订单', bought.has(cross.id) && !bought.has(onlyLulu.id))

  // lb2 在主站付一单 → 进入受众
  await prisma.order.create({
    data: {
      orderNo: `IT${RUN.toUpperCase()}W1B`.slice(0, 32),
      userId: lb2.id,
      productId: w.products.auto,
      productName: 'itest',
      productPrice: new Prisma.Decimal('129.00'),
      quantity: 1,
      amount: new Prisma.Decimal('129.00'),
      payStatus: 'PAID',
      deliveryStatus: 'DELIVERED',
      paidAt: new Date(),
      tenantId: 1,
    },
  })
  const got2 = new Set(await resolveAudienceUserIds({ type: 'USERS', userIds: ids } as never))
  check('lulu 注册的用户在主站付一单后进入受众', got2.has(lb2.id) && !got2.has(lb1.id))
}

// ---------------------------------------------------------------------------
// W1-9（进程内替代）：渠道 Provider 下的页头、页脚、首页与被裁组件
// ---------------------------------------------------------------------------
async function testClientRender() {
  const { renderToString } = await import('react-dom/server')
  const { StorefrontProvider } = await import('../../src/components/storefront-provider')
  const { storefrontFeatures } = await import('../../src/lib/storefront/public')
  const { PathnameContext } = await import('next/dist/shared/lib/hooks-client-context.shared-runtime')
  const { AppRouterContext } = await import('next/dist/shared/lib/app-router-context.shared-runtime')
  const { Header } = await import('../../src/components/layout/header')
  const { Footer } = await import('../../src/components/layout/footer')
  const HomeClient = (await import('../../src/app/(shop)/home-client')).default
  const AccountBindings = (await import('../../src/components/account-bindings')).default
  const MarketingSubscription = (await import('../../src/components/marketing-subscription')).default
  const { NewsHotSection } = await import('../../src/components/news-hot-section')
  const { LiveOrderNotification } = await import('../../src/components/live-order-notification')
  const { AnnouncementModal } = await import('../../src/components/announcement-modal')
  const { RedPacketButton } = await import('../../src/components/lottery/red-packet-button')
  const { useUserStore } = await import('../../src/store/user')
  const h = React.createElement
  const channel = { code: 'itl', kind: 'CHANNEL' as const, origin: 'https://itl.bigolab.com', features: storefrontFeatures({ kind: 'CHANNEL' }) }
  const platform = { code: 'main', kind: 'PLATFORM' as const, origin: 'https://bigolab.com', features: storefrontFeatures({ kind: 'PLATFORM' }) }
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} }
  const render = (sf: typeof channel | typeof platform | null, el: React.ReactElement) => {
    const inner = h(AppRouterContext.Provider, { value: router as never }, h(PathnameContext.Provider, { value: '/' }, el))
    return renderToString(sf ? h(StorefrontProvider, { value: sf, children: inner }) : inner)
  }
  const CLOSED_HREFS = ['href="/chongzhi', 'href="/news', 'href="/iptools', 'href="/forum', 'href="/links', 'href="/lookup', 'href="/profile/referral', 'href="/wallet', 'href="/coupons', 'href="/vip']
  const hits = (html: string) => CLOSED_HREFS.filter((x) => html.includes(x))

  section('W1-9（进程内）渠道站页头、页脚、首页不出现关闭模块入口')
  // 个人菜单（推荐有奖、钱包）只在已登录时渲染。zustand 4.5 服务端渲染取的是 getInitialState() 返回的那个初始状态对象
  // （未登录），这里临时把它的 user 改成已登录，SSR 才能看到那一段；测完改回 null
  const fakeUser = { id: 1, email: 'x@itest-tenant.local', nickname: 'x', role: 'USER' }
  const initial = (useUserStore as unknown as { getInitialState: () => { user: unknown } }).getInitialState()
  initial.user = fakeUser
  const hc = render(channel, h(Header))
  const hm = render(platform, h(Header))
  const hn = render(null, h(Header))
  check('渠道页头：无新闻 / 论坛 / 友链 / IP 工具 / 充值 / 推荐有奖 / 钱包', hits(hc).length === 0, hits(hc).join(','))
  check('渲染的是已登录页头（有个人菜单）', hc.includes('href="/profile"') && hm.includes('href="/profile"'))
  check('主站页头：入口齐全（含推荐有奖、钱包）', ['href="/chongzhi', 'href="/news', 'href="/iptools', 'href="/forum', 'href="/links', 'href="/profile/referral', 'href="/wallet'].every((x) => hm.includes(x)))
  check('没有 Provider（改造前的渲染环境）与主站 Provider 渲染结果相同', hn === hm)
  initial.user = null
  const fc = render(channel, h(Footer))
  const fm = render(platform, h(Footer))
  check('渠道页脚：无落地页 / IP 工具 / 订阅查询 / 友链', hits(fc).length === 0, hits(fc).join(','))
  check('主站页脚：与无 Provider 时逐字相同', fm === render(null, h(Footer)) && fm.includes('href="/lookup') && fm.includes('href="/chongzhi'))
  const home = (sf: typeof channel | typeof platform) => render(sf, h(HomeClient, { stats: { totalSales: 1, skuCount: 2 } }))
  const homeC = home(channel)
  const homeM = home(platform)
  check('渠道首页：无订阅查询框、无 IP 工具入口、无新闻热点', !homeC.includes('输入邮箱查询订阅状态') && !homeC.includes('href="/iptools') && hits(homeC).length === 0)
  check('主站首页：订阅查询框与 IP 工具入口照旧', homeM.includes('输入邮箱查询订阅状态') && homeM.includes('href="/iptools'))
  const gated: [string, React.ReactElement][] = [
    ['AccountBindings', h(AccountBindings)],
    ['MarketingSubscription', h(MarketingSubscription)],
    ['NewsHotSection', h(NewsHotSection)],
    ['LiveOrderNotification', h(LiveOrderNotification)],
    ['AnnouncementModal', h(AnnouncementModal)],
    ['RedPacketButton', h(RedPacketButton, { view: { state: 'DRAWN', won: true } as never, canDraw: false, onClick: () => {} })],
  ]
  const empty = gated.filter(([, el]) => render(channel, el) !== '').map(([n]) => n)
  check('渠道站：被裁组件渲染为空（不发请求）', empty.length === 0, empty.join(','))
  const rp = render(platform, gated[5][1])
  check('主站：红包按钮照常渲染', rp.includes('已中奖'))
}

// ---------------------------------------------------------------------------
// W1-10：超管接口在渠道 Host 全部失效
// ---------------------------------------------------------------------------
async function testAdmin(w: World) {
  const { requireAdmin } = await import('../../src/lib/auth')
  const { adminGuard } = await import('../../src/lib/admin-guard')
  const { isAdminHostError } = await import('../../src/lib/tenant/admin-host-error')
  section('W1-10 requireAdmin / adminGuard 要求主站店面')
  const saMain = w.token(w.users.sa, w.main)
  const saLulu = w.token(w.users.sa, w.lulu)
  const r1 = await withRequest({ host: w.lulu.host, token: saLulu }, async () => {
    try {
      await requireAdmin()
      return 'ok'
    } catch (e) {
      return isAdminHostError(e) ? 'host' : 'other'
    }
  })
  check('lulu Host：requireAdmin 抛 AdminHostError', r1 === 'host')
  const r1b = await withRequest({ host: w.lulu.host, token: saMain }, async () => {
    try {
      await requireAdmin()
      return 'ok'
    } catch (e) {
      return isAdminHostError(e) ? 'host' : 'other'
    }
  })
  check('lulu Host + 主站 ADMIN token：同样 AdminHostError', r1b === 'host')
  const g1 = await withRequest({ host: w.lulu.host, token: saLulu }, () => adminGuard())
  check('lulu Host：adminGuard → 404', g1?.status === 404)
  const r2 = await withRequest({ host: MAIN_HOST, token: saMain }, () => requireAdmin().then((u) => u.id))
  check('主站 Host：requireAdmin 照常', r2 === w.users.sa.id)
  const g2 = await withRequest({ host: MAIN_HOST, token: saMain }, () => adminGuard())
  check('主站 Host：adminGuard 放行', g2 === null)
  const g3 = await withRequest({ host: MAIN_HOST, token: w.token(w.users.luluBuyer1, w.main) }, () => adminGuard())
  check('主站 Host 非管理员：adminGuard 403（不变）', g3?.status === 403)
  setChannelsMode('dormant')
  try {
    const r3 = await withRequest({ host: w.lulu.host, token: saMain }, () => requireAdmin().then((u) => u.id))
    check('休眠：lulu Host 上 requireAdmin 照常（店面是主站）', r3 === w.users.sa.id)
  } finally {
    setChannelsMode('observe')
  }

  section('W1-10 全部 /api/admin/* 在 lulu Host 直连（ADMIN token aud=lulu）')
  const files = await allRouteFiles(path.join(ROOT, 'src/app/api/admin'))
  let total = 0
  let guard404 = 0
  const bad: string[] = []
  const skipped: string[] = []
  for (const f of files) {
    const rel = path.relative(path.join(ROOT, 'src/app/api'), f).replace(/\\/g, '/')
    let mod: Record<string, unknown>
    try {
      mod = (await import(pathToFileURL(f).href)) as Record<string, unknown>
    } catch (e) {
      skipped.push(`${rel}（${(e as Error).message.split('\n')[0].slice(0, 80)}）`)
      continue
    }
    const params = paramsFor(rel)
    for (const m of METHODS) {
      const fn = mod[m] as RouteFn | undefined
      if (typeof fn !== 'function') continue
      total++
      let status = 0
      try {
        const r = await callRoute(fn, { host: w.lulu.host, token: saLulu, method: m, path: `/api/${rel.replace(/\/route\.ts$/, '')}`, params, body: m === 'GET' || m === 'HEAD' || m === 'DELETE' ? undefined : {} })
        status = r.status
      } catch (e) {
        // 抛出未捕获 = Next 返回 500：同样不放行
        status = 500
      }
      if (status >= 200 && status < 400) bad.push(`${m} ${rel} → ${status}`)
      if (status === 404) guard404++
    }
  }
  if (skipped.length) console.log(`  （${skipped.length} 个路由文件在途、加载失败，跳过：${skipped.join('；')}）`)
  check(`${total} 个超管 handler 在 lulu Host 一律非 2xx/3xx`, bad.length === 0 && total > 50, bad.join('；'))
  check(`其中经 adminGuard 的返回 404（${guard404} 个）`, guard404 > 0)
}

// ---------------------------------------------------------------------------
// W1-13：middleware
// ---------------------------------------------------------------------------
async function testMiddleware(w: World) {
  const { middleware, config } = await import('../../src/middleware')
  const run = (host: string, p: string, token?: string) => {
    const h = new Headers({ host })
    if (token) h.set('cookie', `token=${token}`)
    return middleware(new NextRequest(`http://${host}${p}`, { headers: h }))
  }
  const kind = (r: Response) => (r.headers.get('x-middleware-next') === '1' ? 'next' : r.status >= 300 && r.status < 400 ? `redirect:${new URL(r.headers.get('location') || '', 'http://x').pathname}` : String(r.status))
  const saMain = w.token(w.users.sa, w.main)
  const userTok = w.token(w.users.luluBuyer1, w.main)
  section('W1-13 middleware')
  check('matcher 固定四项', stable(config.matcher) === stable(['/admin/:path*', '/api/admin/:path*', '/partner/:path*', '/api/partner/:path*']))

  setChannelsMode('dormant')
  try {
    const cases: [string, string, string | undefined, string][] = [
      [w.lulu.host, '/admin', undefined, 'redirect:/login'],
      [w.lulu.host, '/admin/orders', userTok, 'redirect:/'],
      [w.lulu.host, '/admin', saMain, 'next'],
      ['1.2.3.4', '/admin', undefined, 'redirect:/login'],
      ['localhost:3000', '/api/admin/stats', undefined, '401'],
      ['app:3000', '/api/admin/stats', saMain, 'next'],
      [w.lulu.host, '/api/admin/stats', userTok, '403'],
      [MAIN_HOST, '/partner', undefined, 'next'],
      [MAIN_HOST, '/api/partner/dashboard', undefined, 'next'],
    ]
    const bad = []
    for (const [host, p, tok, want] of cases) {
      const got = kind(await run(host, p, tok))
      if (got !== want) bad.push(`${host}${p}: ${got}≠${want}`)
    }
    check('休眠：不按 Host 拦截，/admin 与 /api/admin 行为与改造前相同；/partner 放行', bad.length === 0, bad.join('；'))
  } finally {
    setChannelsMode('observe')
  }
  const cases: [string, string, string | undefined, string][] = [
    [w.lulu.host, '/admin', saMain, '404'],
    [w.lulu.host, '/api/admin/stats', saMain, '404'],
    ['1.2.3.4', '/api/admin/stats', saMain, '404'],
    [MAIN_HOST, '/admin', undefined, 'redirect:/login'],
    [MAIN_HOST, '/admin', saMain, 'next'],
    ['www.bigolab.com', '/api/admin/stats', saMain, 'next'],
    ['localhost:3000', '/api/admin/stats', undefined, '401'],
    ['127.0.0.1:3000', '/admin', saMain, 'next'],
    ['app:3000', '/admin', saMain, 'next'],
    [MAIN_HOST, '/partner', undefined, '404'],
    [MAIN_HOST, '/api/partner/dashboard', undefined, '404'],
    [w.lulu.host, '/partner', undefined, 'next'],
    [w.lulu.host, '/api/partner/dashboard', undefined, 'next'],
  ]
  const bad = []
  for (const [host, p, tok, want] of cases) {
    const got = kind(await run(host, p, tok))
    if (got !== want) bad.push(`${host}${p}: ${got}≠${want}`)
  }
  check('开启：非主站 Host 拒 /admin、主站 Host 拒 /partner；主站白名单内照常', bad.length === 0, bad.join('；'))
  const j = await run(w.lulu.host, '/api/admin/stats', saMain)
  check('开启：/api/admin 的 404 是 JSON', (await j.json().catch(() => null))?.error === '资源不存在')
  process.env.PLATFORM_HOSTS = 'bigolab.com,1.2.3.4'
  try {
    check('PLATFORM_HOSTS 含服务器 IP：经 IP 进后台照常', kind(await run('1.2.3.4', '/admin', saMain)) === 'next')
    check('PLATFORM_HOSTS 不含 localhost：localhost 进后台 404', kind(await run('localhost', '/admin', saMain)) === '404')
  } finally {
    delete process.env.PLATFORM_HOSTS
  }
  process.env.PLATFORM_HOSTS = ' , ,'
  try {
    check('PLATFORM_HOSTS 写坏：退回默认值（localhost 照常）', kind(await run('localhost', '/admin', saMain)) === 'next')
  } finally {
    delete process.env.PLATFORM_HOSTS
  }
}

// ---------------------------------------------------------------------------
// W1-14：(shop) 外壳与店面状态
// ---------------------------------------------------------------------------
async function testShopShell(w: World) {
  const ShopLayout = (await import('../../src/app/(shop)/layout')).default as (p: { children: React.ReactNode }) => Promise<unknown>
  const { SuspendedBanner } = await import('../../src/components/storefront/suspended-banner')
  const { ClosedPageGate, isClosedPath } = await import('../../src/components/storefront/closed-page')
  const { PageViewBeacon } = await import('../../src/components/page-view-beacon')
  const { LiveOrderNotification } = await import('../../src/components/live-order-notification')
  const { AnnouncementModal } = await import('../../src/components/announcement-modal')
  const { MailLanding } = await import('../../src/components/mail-landing')
  const { invalidateStorefrontCache } = await import('../../src/lib/storefront/resolve')
  const shell = (host: string, token?: string) => withRequest({ host, token }, () => catchNext(() => ShopLayout({ children: 'CHILD' })))

  section('W1-14 (shop) 外壳')
  const main = await shell(MAIN_HOST)
  const mv = main.kind === 'ok' ? main.value : null
  check('主站：挂实时成交、公告、埋点、邮件落地；无横幅、无停业闸门', !!mv && findType(mv, LiveOrderNotification) && findType(mv, AnnouncementModal) && findType(mv, PageViewBeacon) && findType(mv, MailLanding) && !findType(mv, SuspendedBanner) && !findType(mv, ClosedPageGate))
  const act = await shell(w.lulu.host)
  const av = act.kind === 'ok' ? act.value : null
  check('渠道 ACTIVE：不挂实时成交、公告、埋点、邮件落地；无横幅', !!av && !findType(av, LiveOrderNotification) && !findType(av, AnnouncementModal) && !findType(av, PageViewBeacon) && !findType(av, MailLanding) && !findType(av, SuspendedBanner))

  await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'SUSPENDED' } })
  const sus = await shell(w.lulu.host)
  check('SUSPENDED：外壳照常、挂暂停营业横幅、页面内容照常', sus.kind === 'ok' && findType(sus.value, SuspendedBanner) && !findType(sus.value, ClosedPageGate))
  await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'TERMINATED' } })
  const term = await shell(w.lulu.host)
  check('TERMINATED：外壳照常、挂停业页闸门', term.kind === 'ok' && findType(term.value, ClosedPageGate) && !findType(term.value, SuspendedBanner))
  check('停业页只换首页与商品页', isClosedPath('/') && isClosedPath('/products') && isClosedPath('/products/12') && !isClosedPath('/orders') && !isClosedPath('/redeem') && !isClosedPath('/login') && !isClosedPath('/profile') && !isClosedPath('/productsx'))
  await prisma.tenant.update({ where: { id: w.lulu.id }, data: { status: 'ACTIVE' } })

  const draft = await createTenant('x', { status: 'DRAFT' })
  const preview = await createUser('wp1-preview', { registeredTenantId: 1 })
  await prisma.tenant.update({ where: { id: draft.id }, data: { previewUserIds: [preview.id] } })
  invalidateStorefrontCache()
  const d1 = await shell(draft.host)
  check('DRAFT：未登录 → 404', d1.kind === 'notFound')
  const d2 = await shell(draft.host, signTestToken(w.users.luluBuyer1, draft.code, draft.id))
  check('DRAFT：非预览用户 → 404', d2.kind === 'notFound')
  const d3 = await shell(draft.host, signTestToken(preview, draft.code, draft.id))
  check('DRAFT：预览用户 → 放行', d3.kind === 'ok')
  const d4 = await shell(draft.host, signTestToken(preview, 'main'))
  check('DRAFT：预览用户拿主站 token → 404（aud 不符 = 未登录）', d4.kind === 'notFound')
  await prisma.tenantDomain.deleteMany({ where: { tenantId: draft.id } })
  await prisma.tenant.delete({ where: { id: draft.id } })
  invalidateStorefrontCache()
}

main().catch(async (e) => {
  console.error(e)
  try {
    setChannelsMode('dormant')
    await cleanupWp1()
    await cleanupAll()
  } catch {
    /* ignore */
  }
  process.exit(1)
})
