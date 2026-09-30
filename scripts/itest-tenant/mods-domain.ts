/**
 * 渠道自定义域名 · 集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-domain.ts
 *
 * 覆盖 docs/多渠道分销-自定义域名.md 第 6 节（本文件那一部分）：
 *   D-1 classifyTenantHost 正反例：SUB / CUSTOM / IP / 主站 / 多级子域 / .local 等内网名 / 超长 / 大写与端口规范化 / punycode /
 *       生产环境拒绝 .test；isCustomHostShape 与 nginx 正则同口径的几个边界
 *   D-2 店面解析（假库）：自定义域名 → 渠道；停用 → null；未登记 → 观察期也 null（2026-10-01 加固）/ 严格期 null；集合加载失败 → 抛；
 *       IP / 不带点的 Host 不加载集合；并发只加载一次；TTL 过期后失败沿用旧集合（≤5 分钟）、超过宽限期抛；invalidate 后不再兜底
 *   D-3 超管后台（经 route handler）：添加自定义域名；GET 带类型；设为主域名同步 origin、写审计与站内通知；不能停用主域名；
 *       不能把停用的设为主；未登记 404；带 status 的设主请求 400；跨渠道重名 409；并发两次设主只有一个主域名；建站仍只收子域名
 *   D-4 店面解析（真库）：设主前后自定义域名都解析为该渠道；缓存失效后立刻生效；canonicalHost / primaryRedirectOrigin /
 *       requireChannelStorefrontPage().redirectOrigin 在主域名上为 null、在旧子域名上为新主域名
 *   D-5 邮件与邀请链接：设主域名后 tenantOrigin / tenantMailOpts / 邀请链接 / 交易邮件链接都用新域名
 *   D-6 不变量：主站、只有子域名的渠道（lulu 形）、休眠态的解析结果与改造前逐字相同（主站不查库、lulu 无跳转、休眠一律主站）
 *   D-7 连通校验（契约第 9 节）：设主前校验（失联 / 3xx / 编造签名 / 换 Host 转发一律 400、什么都不改）；应答端签名与 404；
 *       cron 复验：失败一趟不降级、两趟降级（邮件 / 邀请 / 跳转改用子域名、站内通知一次）、恢复切回；记录过期 / 缺失 / 错 host / 损坏
 *       一律改用子域名；「重新校验」立即恢复；子域名渠道一次都不校验。传输层换成进程内调 /api/domain-check，签名是真代码
 *       2026-10-01 加固：恢复要连续两趟成功；降级 / 恢复告警各自 6 小时节流、仍降级满 6 小时 realert；TERMINATED 不复验不告警；
 *       复核：恢复途中（降级中第一趟通过）不 realert；渠道站内通知不节流、只跟状态走（抖动时渠道最新一条通知永远是真实状态）；
 *       cron 条件写入（探测期间记录被改 → 放弃）；没有启用中子域名时只停跳转；渠道推送按钮降级时指向子域名；
 *       记录过期 → 站长群告警一次（节流）；手动重新校验恢复也推「已恢复」；通知与告警只写归类原因
 *   D-8 探测本身（本地 http 桩，不连库）：br 解压炸弹 / 超长 body / 声明超长 content-length / 慢速滴灌 / 错误 content-type 一律判失败、
 *       内存不涨；解析到私网 / 回环 / 保留段 → 判失败且一个请求都不发；公网 / 非公网地址判定表
 *
 * 【测试数据】租户 / 用户走 _harness 的前缀（ITEST / @itest-tenant.local）；自定义域名一律用 it<run>-*.test（非生产环境才允许的保留测试后缀）。
 * 结束时只删本脚本建的行（同 mods-p3：不调 cleanupAll）。
 * 【外部副作用】开跑前删掉阿里云邮件与企业微信环境变量：邀请邮件发不出去（返回链接由站长转发），渠道通知推送换成计数桩。
 */
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) {
  delete process.env[k]
}

import { prisma, check, section, summary, setChannelsMode, createTenant, createUser, callRoute, withRequest, catchNext, signTestToken, RUN, mail, type RouteFn, type WorldTenant, type WorldUser } from './_harness'

type AnyRoute = Record<string, unknown>
function h(mod: AnyRoute, method: string): RouteFn {
  const fn = mod[method]
  if (typeof fn !== 'function') throw new Error(`路由没有导出 ${method}`)
  return fn as RouteFn
}
let ipSeq = 0
const nextIp = () => `10.66.${(++ipSeq >> 8) & 255}.${ipSeq & 255}`

const env = process.env as Record<string, string | undefined>
function withNodeEnv<T>(v: string, fn: () => T): T {
  const old = env.NODE_ENV
  env.NODE_ENV = v
  try {
    return fn()
  } finally {
    if (old === undefined) delete env.NODE_ENV
    else env.NODE_ENV = old
  }
}

const MAIN_HOST = 'bigolab.com'
const tag = RUN.toLowerCase()
/** 本脚本用到的自定义域名（全部带 run 前缀，结束时随租户一起删） */
const D = {
  tibo: `it${tag}-tibo.test`,
  www: `www.it${tag}-tibo.test`,
  other: `it${tag}-other.test`,
  race1: `it${tag}-race1.test`,
  race2: `it${tag}-race2.test`,
  never: `it${tag}-never.test`,
  sub2: `it${tag}x2.bigolab.com`,
  zc: `it${tag}-z.test`,
}

async function main() {
  const resolve = await import('../../src/lib/storefront/resolve')
  const hosts = await import('../../src/lib/storefront/hosts')
  const origin = await import('../../src/lib/storefront/origin')
  const mailMod = await import('../../src/lib/mail')
  const notice = await import('../../src/lib/tenant/notice')
  const admin = await import('../../src/lib/tenant/admin-tenants')
  const partnerPage = await import('../../src/lib/tenant/partner-page')
  const rDomains = await import('../../src/app/api/admin/tenants/[id]/domains/route')
  const rTenants = await import('../../src/app/api/admin/tenants/route')
  const verify = await import('../../src/lib/tenant/domain-verify')
  const health = await import('../../src/lib/storefront/domain-health')
  const rCheck = await import('../../src/app/api/domain-check/route')
  const rCron = await import('../../src/app/api/cron/tenant-domains/route')
  const { sealText } = await import('../../src/lib/tenant/crypto')
  // 连通校验的传输层（契约第 9 节）：生产走公网 HTTPS；这里换成进程内调用 /api/domain-check 的 route handler，
  // 签名的生成与核对都是真代码。probe.mode 模拟各种「域名不在我们手里」的情形
  type ProbeMode = 'route' | 'down' | 'evil' | 'otherHost' | 'redirect'
  const probe = {
    mode: 'route' as ProbeMode,
    hosts: [] as string[],
    otherHost: '',
    /** 一次性钩子：下一次探测开始时先执行（模拟「cron 探测期间站长点了重新校验」这类并发写） */
    hook: null as null | (() => Promise<void>),
  }
  verify.setDomainProbeTransportForTest(async (host, pq) => {
    probe.hosts.push(host)
    if (probe.hook) {
      const f = probe.hook
      probe.hook = null
      await f()
    }
    if (probe.mode === 'down') throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })
    if (probe.mode === 'redirect') return { status: 301, body: '' }
    // 客户自己的服务器：照抄本站应答的格式，但拿不到密钥，只能编一个 proof
    if (probe.mode === 'evil') return { status: 200, body: JSON.stringify({ success: true, data: { proof: 'A'.repeat(43) } }) }
    // 把请求转给本站、却换成别的 Host（例如 lulu.bigolab.com）：proof 绑定的 host 对不上
    const r = await callRoute(h(rCheck, 'GET'), { host: probe.mode === 'otherHost' ? probe.otherHost : host, method: 'GET', path: pq })
    return { status: r.status, body: r.text }
  })
  if (!process.env.CRON_SECRET) process.env.CRON_SECRET = 'itest-domain-cron-secret-0123456789'
  // 站长群告警：WECOM_WEBHOOK_URL 已删，alertPlatform 只 console.warn('[platform-alert]', 文本)；这里截下来计数、核对文案
  const platformAlerts: string[] = []
  const origWarn = console.warn
  console.warn = (...a: unknown[]) => {
    if (a[0] === '[platform-alert]') platformAlerts.push(String(a[1] ?? ''))
    origWarn(...a)
  }
  // 渠道推送桩：记下每条企业微信 payload（核对「前往渠道后台」按钮的链接）
  const pushes: string[] = []
  notice.setTenantNoticeTransportForTest(async (_url, payload) => {
    pushes.push(JSON.stringify(payload))
    return true
  })

  const tenants: WorldTenant[] = []
  const users: WorldUser[] = []
  try {
    // =======================================================================
    section('D-1 classifyTenantHost 正反例')
    {
      const { classifyTenantHost, isCustomHostShape } = hosts
      const kindOf = (raw: string) => {
        const c = classifyTenantHost(raw)
        return 'error' in c ? `ERR:${c.error}` : `${c.kind}:${c.host}`
      }
      const cases: [string, string, string][] = [
        ['一级子域', 'lulu.bigolab.com', 'SUB:lulu.bigolab.com'],
        ['大写 + 端口 + 尾点规范化（子域）', 'LULU.BigoLab.com.:443', 'SUB:lulu.bigolab.com'],
        ['自定义域名', 'tibo.pw', 'CUSTOM:tibo.pw'],
        ['自定义 www', 'www.tibo.pw', 'CUSTOM:www.tibo.pw'],
        ['大写 + 端口 + 尾点规范化（自定义）', 'TIBO.PW.:8443', 'CUSTOM:tibo.pw'],
        ['自定义多级', 'shop.a.tibo.co.uk', 'CUSTOM:shop.a.tibo.co.uk'],
        ['punycode 顶级域', 'xn--fiqs8s.xn--fiqz9s', 'CUSTOM:xn--fiqs8s.xn--fiqz9s'],
        ['本地 .test（非生产）', 'tibo.test', 'CUSTOM:tibo.test'],
      ]
      for (const [label, raw, want] of cases) check(`${label}：${raw} → ${want}`, kindOf(raw) === want, kindOf(raw))
      const rejects: [string, string][] = [
        ['IPv4', '1.2.3.4'],
        ['IPv4 带端口', '47.100.1.2:80'],
        ['主站裸域', 'bigolab.com'],
        ['主站 www', 'www.bigolab.com'],
        ['主站 localhost', 'localhost'],
        ['不带点（容器名）', 'app'],
        ['多级子域', 'a.b.bigolab.com'],
        ['保留子域', 'admin.bigolab.com'],
        ['.local', 'nas.local'],
        ['.internal', 'db.internal'],
        ['.localhost', 'x.localhost'],
        ['单段', 'tibo'],
        ['顶级域数字', 'tibo.123'],
        ['顶级域 1 位', 'tibo.p'],
        ['标签以连字符开头', '-tibo.pw'],
        ['标签以连字符结尾', 'tibo-.pw'],
        ['下划线', 'ti_bo.pw'],
        ['带协议', 'https://tibo.pw'],
        ['带路径', 'tibo.pw/shop'],
        ['非 ASCII', '贝果.pw'],
        ['空', ''],
        ['超长（> 120）', `${'a'.repeat(60)}.${'b'.repeat(60)}.pw`],
      ]
      for (const [label, raw] of rejects) check(`拒绝 ${label}：${raw.slice(0, 40)}`, kindOf(raw).startsWith('ERR:'), kindOf(raw))
      check('恰好 120 个字符的自定义域名允许', kindOf(`${'a'.repeat(60)}.${'b'.repeat(56)}.pw`).startsWith('CUSTOM:'))
      check('生产环境拒绝 .test', withNodeEnv('production', () => kindOf('tibo.test')).startsWith('ERR:'))
      check('生产环境 tibo.pw 照常', withNodeEnv('production', () => kindOf('tibo.pw')) === 'CUSTOM:tibo.pw')
      check('isCustomHostShape：IP / 子域名 / 不带点都不是', !isCustomHostShape('1.2.3.4') && !isCustomHostShape('lulu.bigolab.com') && !isCustomHostShape('app'))
      check('isCustomHostShape：自定义域名是', isCustomHostShape('tibo.pw') && isCustomHostShape('xn--fiqs8s.xn--fiqz9s'))
    }

    // =======================================================================
    section('D-2 店面解析（假库）：自定义域名集合')
    {
      const X = await createTenant('x')
      tenants.push(X)
      setChannelsMode('observe')
      const calls = { list: 0, domain: 0, tenant: 0 }
      let listImpl: () => Promise<string[]> = async () => [D.tibo, D.other, 'junk.bigolab.com']
      const fake = {
        listCustomHosts: async () => {
          calls.list++
          return listImpl()
        },
        findDomain: async (host: string) => {
          calls.domain++
          if (host === D.tibo || host === X.host) return { tenantId: X.id, status: 1 }
          if (host === D.other) return { tenantId: X.id, status: 0 }
          return null
        },
        findTenant: async (id: number) => {
          calls.tenant++
          return prisma.tenant.findUnique({ where: { id }, select: { id: true, code: true, kind: true, status: true, origin: true } })
        },
      }
      resolve.setStorefrontDbForTest(fake)
      const r1 = await resolve.resolveStorefrontForHost(D.tibo)
      check('登记且启用的自定义域名 → 该渠道', r1?.kind === 'CHANNEL' && r1.id === X.id, JSON.stringify(r1))
      check('渠道的 canonicalHost = origin 的主机名（子域名）', r1?.canonicalHost === X.host)
      check('登记但停用 → null（404，不回落主站）', (await resolve.resolveStorefrontForHost(D.other)) === null)
      const unk = await resolve.resolveStorefrontForHost(D.never)
      // 2026-10-01 加固：形如域名但未登记 → 观察期也 404（不回落主站；nginx 已按 channel 放行这类 Host）
      check('未登记的形如域名 Host → 观察期也 null（404，不回落主站）', unk === null, JSON.stringify(unk))
      check('集合只加载了一次（随机 Host 不逐个查库）', calls.list === 1, `加载 ${calls.list} 次`)
      check('未登记的形如域名 Host 不查 tenant_domains（只对照集合）', calls.domain === 2, `findDomain ${calls.domain} 次`)
      setChannelsMode('strict')
      check('未登记 → 严格期 null', (await resolve.resolveStorefrontForHost(D.never)) === null)
      check('严格期登记且启用 → 渠道', (await resolve.resolveStorefrontForHost(D.tibo))?.id === X.id)
      setChannelsMode('observe')

      // 集合加载失败：从未成功过 → 抛；IP、不带点的 Host 不加载集合
      listImpl = async () => {
        throw new Error('itest: 注入的集合加载错误')
      }
      resolve.invalidateStorefrontCache()
      const before = calls.list
      let threw = false
      try {
        await resolve.resolveStorefrontForHost(D.tibo)
      } catch {
        threw = true
      }
      check('集合加载失败且从未成功 → 抛（500，不当主站渲染）', threw)
      let threw2 = false
      try {
        await resolve.resolveStorefrontForHost('random-scanner.example')
      } catch {
        threw2 = true
      }
      check('集合加载失败时陌生域名同样抛', threw2)
      const ip = await resolve.resolveStorefrontForHost('47.100.1.2')
      const bare = await resolve.resolveStorefrontForHost('app')
      const main = await resolve.resolveStorefrontForHost(MAIN_HOST)
      const sub = await resolve.resolveStorefrontForHost(X.host)
      check('IP / 主站 / 子域名不受集合故障影响', ip?.kind === 'PLATFORM' && bare?.kind === 'PLATFORM' && main?.kind === 'PLATFORM' && sub?.id === X.id)
      check('集合加载失败不缓存（每次都重试）', calls.list - before === 2, `加载 ${calls.list - before} 次`)

      // 并发：同一时刻只有一次加载
      resolve.invalidateStorefrontCache()
      let release: () => void = () => undefined
      const gate = new Promise<void>((r) => (release = r))
      listImpl = async () => {
        await gate
        return [D.tibo]
      }
      const b2 = calls.list
      const ps = Array.from({ length: 20 }, (_, i) => resolve.resolveStorefrontForHost(i % 2 ? D.tibo : `it${tag}-rnd${i}.example`))
      await new Promise((r) => setTimeout(r, 20))
      release()
      const rs = await Promise.all(ps)
      check('20 个并发请求只加载一次集合', calls.list - b2 === 1, `加载 ${calls.list - b2} 次`)
      check('并发结果正确（自定义域名 → 渠道，陌生域名 → null）', rs.every((r, i) => (i % 2 ? r?.id === X.id : r === null)))

      // TTL 过期后加载失败：5 分钟内沿用上一次成功的集合；超过宽限期抛
      const realNow = Date.now
      try {
        listImpl = async () => {
          throw new Error('itest: 注入的集合加载错误')
        }
        Date.now = () => realNow() + 61_000
        const s1 = await resolve.resolveStorefrontForHost(D.tibo)
        check('TTL 过期、加载失败 → 沿用上一次的集合（宽限 5 分钟内）', s1?.id === X.id)
        Date.now = () => realNow() + 61_000 + 5 * 60_000 + 1_000
        let t3 = false
        try {
          await resolve.resolveStorefrontForHost(D.tibo)
        } catch {
          t3 = true
        }
        check('超过 5 分钟宽限 → 抛', t3)
      } finally {
        Date.now = realNow
      }
      // invalidate 之后不再拿旧集合兜底（刚改过域名，旧集合可能已经不对）
      listImpl = async () => [D.tibo]
      await resolve.resolveStorefrontForHost(D.tibo)
      resolve.invalidateStorefrontCache()
      listImpl = async () => {
        throw new Error('itest: 注入的集合加载错误')
      }
      let t4 = false
      try {
        await resolve.resolveStorefrontForHost(D.tibo)
      } catch {
        t4 = true
      }
      check('invalidate 之后加载失败 → 抛（不拿旧集合兜底）', t4)
      resolve.setStorefrontDbForTest(null)
    }

    // =======================================================================
    section('D-3 超管后台：添加 / 设为主域名 / 停用规则 / 重名 / 并发')
    const X = tenants[0]
    const L = await createTenant('l') // 只有子域名的渠道（lulu 形）
    const Z = await createTenant('z')
    tenants.push(L, Z)
    const sa = await createUser(`dom-sa`, { role: 'ADMIN' })
    users.push(sa)
    const saWho = { host: MAIN_HOST, token: signTestToken(sa) }
    const call = (method: string, tenantId: number, body?: unknown) =>
      callRoute(h(rDomains, method), { ...saWho, method, path: `/api/admin/tenants/${tenantId}/domains`, body, params: { id: String(tenantId) }, headers: { 'cf-connecting-ip': nextIp() } })
    setChannelsMode('observe')
    resolve.invalidateStorefrontCache()
    {
      check('解析：登记前的自定义域名 → null（404，先加隧道路由也不会串成主站）', (await resolve.resolveStorefrontForHost(D.tibo)) === null)
      const add = await call('POST', X.id, { host: D.tibo.toUpperCase() + '.', status: 1 })
      check('添加自定义域名 200（规范化存储）', add.status === 200 && (await prisma.tenantDomain.count({ where: { tenantId: X.id, host: D.tibo, status: 1, isPrimary: false } })) === 1, add.text)
      check('缓存失效后立刻生效：刚添加的自定义域名 → 该渠道（真库）', (await resolve.resolveStorefrontForHost(D.tibo))?.id === X.id)
      check('添加 www 200', (await call('POST', X.id, { host: D.www, status: 1 })).status === 200)
      const g = await call('GET', X.id)
      const rows = (g.json?.data ?? []) as { host: string; kind: string; isPrimary: boolean }[]
      check('GET 域名列表带类型（子域名 / 自定义域名）', rows.find((r) => r.host === X.host)?.kind === 'SUB' && rows.find((r) => r.host === D.tibo)?.kind === 'CUSTOM', g.text)
      check('审计 tenant.domain（渠道可见 publicDiff 含 host）', (await prisma.auditEvent.count({ where: { tenantId: X.id, action: 'tenant.domain' } })) >= 2)

      const dup = await call('POST', Z.id, { host: D.tibo, status: 1 })
      check('跨渠道重名 409', dup.status === 409, dup.text)
      for (const [bad, why] of [
        ['1.2.3.4', 'IP'],
        ['a.b.bigolab.com', '多级子域'],
        ['bigolab.com', '主站'],
        ['nas.local', '.local'],
      ] as const) {
        const r = await call('POST', X.id, { host: bad, status: 1 })
        check(`添加拒绝 ${why}（400）`, r.status === 400, `${r.status} ${r.text}`)
      }

      // 建站仍只收子域名（自定义域名一律建站后接入）
      const ct = await callRoute(h(rTenants, 'POST'), { ...saWho, method: 'POST', path: '/api/admin/tenants', body: { code: `itc${tag}`.slice(0, 18), name: 'ITEST-TENANT-dom-bad', origin: `https://${D.never}` }, headers: { 'cf-connecting-ip': nextIp() } })
      check('建站时填自定义域名 → 400', ct.status === 400, ct.text)

      // 主域名不能停用；停用的不能设主；未登记 404；带 status 的设主请求 400
      const offPrimary = await call('POST', X.id, { host: X.host, status: 0 })
      check('停用主域名 → 400「先把其他域名设为主域名再停用」', offPrimary.status === 400 && String(offPrimary.json?.error).includes('先把其他域名设为主域名'), offPrimary.text)
      check('添加并停用 other 200', (await call('POST', X.id, { host: D.other, status: 0 })).status === 200)
      const pOff = await call('POST', X.id, { action: 'primary', host: D.other })
      check('把停用的域名设为主 → 400', pOff.status === 400, pOff.text)
      const pNone = await call('POST', X.id, { action: 'primary', host: D.never })
      check('设未登记的域名为主 → 404', pNone.status === 404, pNone.text)
      const pZ = await call('POST', Z.id, { action: 'primary', host: D.tibo })
      check('设别的渠道的域名为主 → 404', pZ.status === 404, pZ.text)
      const pMixed = await call('POST', X.id, { action: 'primary', host: D.tibo, status: 1 })
      check('设主请求同时带 status → 400（意图不明）', pMixed.status === 400, pMixed.text)
      check('以上失败都没有改 origin', (await prisma.tenant.findUnique({ where: { id: X.id } }))?.origin === X.origin)

      // 连通校验（契约第 9 节）：域名没接到本站 → 400 DOMAIN_NOT_VERIFIED，什么都不改（不改 origin、不写审计、不写校验记录）
      probe.otherHost = X.host
      for (const [mode, why] of [
        ['down', 'DNS 解析不到 / 连不上'],
        ['redirect', '被 3xx 跳走（不跟随）'],
        ['evil', '客户自己的服务器（编造的 proof）'],
        ['otherHost', '转给本站但换成别的 Host'],
      ] as const) {
        probe.mode = mode
        const r = await call('POST', X.id, { action: 'primary', host: D.tibo })
        check(`设主前校验：${why} → 400 DOMAIN_NOT_VERIFIED`, r.status === 400 && r.json?.reason === 'DOMAIN_NOT_VERIFIED', r.text)
      }
      probe.mode = 'route'
      check(
        '校验不通过：origin、审计、校验记录都没动',
        (await prisma.tenant.findUnique({ where: { id: X.id } }))?.origin === X.origin &&
          (await prisma.auditEvent.count({ where: { tenantId: X.id, action: 'tenant.domain_primary' } })) === 0 &&
          (await prisma.setting.count({ where: { key: health.domainHealthKey(X.id) } })) === 0,
      )
      // 没有启用中的子域名的渠道不能把自定义域名设为主（失联时无处可退）：直接写库造一个子域名被停用的渠道
      await prisma.tenantDomain.updateMany({ where: { tenantId: Z.id, host: Z.host }, data: { status: 0 } })
      await prisma.tenantDomain.create({ data: { tenantId: Z.id, host: D.zc, status: 1, isPrimary: false } })
      resolve.invalidateStorefrontCache()
      const pNoSub = await call('POST', Z.id, { action: 'primary', host: D.zc })
      check('没有启用中的子域名 → 设自定义域名为主 400', pNoSub.status === 400 && String(pNoSub.json?.error).includes('子域名'), pNoSub.text)
      await prisma.tenantDomain.deleteMany({ where: { host: D.zc } })
      await prisma.tenantDomain.updateMany({ where: { tenantId: Z.id, host: Z.host }, data: { status: 1 } })

      // 设为主域名
      const since = new Date(Date.now() - 1000)
      probe.hosts.length = 0
      const p1 = await call('POST', X.id, { action: 'primary', host: D.tibo })
      check('设为主域名 200', p1.status === 200 && p1.json?.data?.changed === true, p1.text)
      const tRow = await prisma.tenant.findUnique({ where: { id: X.id } })
      check('Tenant.origin 同步为 https://<新主域名>', tRow?.origin === `https://${D.tibo}`, tRow?.origin)
      check('设主前经传输层请求了该域名（公网校验）', probe.hosts.includes(D.tibo), probe.hosts.join(','))
      const h1 = health.parseDomainHealth((await prisma.setting.findUnique({ where: { key: health.domainHealthKey(X.id) } }))?.value)
      check('同一事务写入新鲜的校验记录（host = 新主域名、fails = 0）', !!h1 && h1.host === D.tibo && h1.fails === 0 && health.isDomainHealthy(h1, D.tibo), JSON.stringify(h1))
      const prim = await prisma.tenantDomain.findMany({ where: { tenantId: X.id, isPrimary: true }, select: { host: true } })
      check('只有一个主域名，且是新域名', prim.length === 1 && prim[0].host === D.tibo, JSON.stringify(prim))
      const au = await prisma.auditEvent.findFirst({ where: { tenantId: X.id, action: 'tenant.domain_primary', at: { gte: since } }, orderBy: { id: 'desc' } })
      // MySQL 的 JSON 列会重排键序，逐字段比较
      const ft = (v: unknown) => {
        const o = (v ?? {}) as Record<string, unknown>
        return Object.keys(o).length === 2 && o.from === X.host && o.to === D.tibo
      }
      check('审计 tenant.domain_primary：diff 与 publicDiff 都是 { from: 旧主域名, to: 新主域名 }', !!au && ft(au.diff) && ft(au.publicDiff), JSON.stringify(au))
      const nt = await prisma.tenantNotice.findFirst({ where: { tenantId: X.id, kind: 'TENANT_STATUS', createdAt: { gte: since } }, orderBy: { id: 'desc' } })
      check('站内通知 TENANT_STATUS「店铺主域名已改为 https://<host>」', nt?.title === `店铺主域名已改为 https://${D.tibo}`, nt?.title)
      const again = await call('POST', X.id, { action: 'primary', host: D.tibo })
      check('重复设同一个主域名 → 200 changed=false，不再写审计', again.status === 200 && again.json?.data?.changed === false && (await prisma.auditEvent.count({ where: { tenantId: X.id, action: 'tenant.domain_primary' } })) === 1)
      const offNew = await call('POST', X.id, { host: D.tibo, status: 0 })
      check('新主域名同样不能停用', offNew.status === 400, offNew.text)
      // 主域名是自定义域名时，最后一个启用中的子域名不能停用：自定义域名失联时要退到它（契约第 9 节）
      const offOld = await call('POST', X.id, { host: X.host, status: 0 })
      check('旧子域名是唯一启用中的子域名 → 停用 400（失联时的退路）', offOld.status === 400 && String(offOld.json?.error).includes('子域名'), offOld.text)
      const sub2 = D.sub2
      check('再加一个子域名 200', (await call('POST', X.id, { host: sub2, status: 1 })).status === 200)
      check('有了第二个子域名，旧子域名可以停用', (await call('POST', X.id, { host: X.host, status: 0 })).status === 200)
      check('重新启用旧子域名', (await call('POST', X.id, { host: X.host, status: 1 })).status === 200)
      await prisma.tenantDomain.deleteMany({ where: { host: sub2 } })
      resolve.invalidateStorefrontCache()

      // 并发两次设主：锁渠道行串行，最后只有一个主域名，且 origin 与之一致
      await call('POST', X.id, { host: D.race1, status: 1 })
      await call('POST', X.id, { host: D.race2, status: 1 })
      const [ra, rb] = await Promise.all([admin.setPrimaryDomain(X.id, D.race1, sa.id), admin.setPrimaryDomain(X.id, D.race2, sa.id)])
      const prim2 = await prisma.tenantDomain.findMany({ where: { tenantId: X.id, isPrimary: true }, select: { host: true } })
      const o2 = (await prisma.tenant.findUnique({ where: { id: X.id } }))?.origin
      check('并发两次设主：两次都成功', ra.changed && rb.changed)
      check('并发两次设主：只有一个主域名，且 origin 指向它', prim2.length === 1 && o2 === `https://${prim2[0].host}`, `${JSON.stringify(prim2)} origin=${o2}`)
      // 恢复：tibo 为主
      await admin.setPrimaryDomain(X.id, D.tibo, sa.id)
      check('恢复 tibo 为主域名', (await prisma.tenant.findUnique({ where: { id: X.id } }))?.origin === `https://${D.tibo}`)
    }

    // =======================================================================
    section('D-4 店面解析（真库）与非主域名跳转')
    {
      resolve.invalidateStorefrontCache()
      const onTibo = await resolve.resolveStorefrontForHost(D.tibo)
      const onWww = await resolve.resolveStorefrontForHost(D.www)
      const onSub = await resolve.resolveStorefrontForHost(X.host)
      check('三个域名都解析为同一个渠道', onTibo?.id === X.id && onWww?.id === X.id && onSub?.id === X.id)
      check('origin / canonicalHost = 新主域名', onSub?.origin === `https://${D.tibo}` && onSub?.canonicalHost === D.tibo)
      const redirOn = (host: string) => withRequest({ host }, async () => {
        const sf = await resolve.getStorefront()
        return sf ? resolve.primaryRedirectOrigin(sf) : 'NO-SF'
      })
      check('在主域名上：不跳转（null）', (await redirOn(D.tibo)) === null)
      check('在主域名上带端口：不跳转（按规范化主机名比较）', (await redirOn(`${D.tibo.toUpperCase()}:3000`)) === null)
      check('在旧子域名上：跳到 https://<新主域名>', (await redirOn(X.host)) === `https://${D.tibo}`)
      check('在 www 上：跳到 https://<新主域名>', (await redirOn(D.www)) === `https://${D.tibo}`)
      const pg = await withRequest({ host: X.host }, () => catchNext(() => partnerPage.requireChannelStorefrontPage()))
      check('渠道后台布局：旧子域名 redirectOrigin = 新主域名', pg.kind === 'ok' && pg.value.redirectOrigin === `https://${D.tibo}`, JSON.stringify(pg))
      const pg2 = await withRequest({ host: D.tibo }, () => catchNext(() => partnerPage.requireChannelStorefrontPage()))
      check('渠道后台布局：主域名上 redirectOrigin = null', pg2.kind === 'ok' && pg2.value.redirectOrigin === null)
      const offOther = await resolve.resolveStorefrontForHost(D.other)
      check('停用的自定义域名 → null（404）', offOther === null)
      setChannelsMode('strict')
      check('严格期：自定义域名照常 → 渠道', (await resolve.resolveStorefrontForHost(D.tibo))?.id === X.id)
      setChannelsMode('observe')
    }

    // =======================================================================
    section('D-5 邮件与邀请链接用新主域名')
    {
      const NEW = `https://${D.tibo}`
      check('tenantOrigin = 新主域名', (await origin.tenantOrigin(X.id)) === NEW)
      check('tenantAbsUrl = 新主域名 + 路径', (await origin.tenantAbsUrl(X.id, '/orders')) === `${NEW}/orders`)
      const mo = await origin.tenantMailOpts(X.id)
      check('tenantMailOpts.origin = 新主域名', mo?.origin === NEW, JSON.stringify(mo))
      const html = mailMod.renderOrderReplyEmail({ orderNo: 'ITDOM1', productName: 'x' }, mo).html
      check('交易邮件里的链接指向新主域名、不含旧子域名', html.includes(NEW) && !html.includes(X.host))
      const inv = await admin.createInvite(X.id, mail('dom-invitee'), 'OWNER', sa.id)
      check('邀请链接 = 新主域名 + /partner/invite/<token>', inv.link.startsWith(`${NEW}/partner/invite/`), inv.link.slice(0, 80))
    }

    // =======================================================================
    section('D-7 连通校验：应答端、cron 复验、失联自动改用子域名、恢复切回（契约第 9 节）')
    {
      const SUBO = `https://${X.host}`
      const NEW = `https://${D.tibo}`
      const setMode = (m: ProbeMode) => {
        probe.mode = m
        probe.hosts.length = 0
      }
      const redirOn = (host: string) => withRequest({ host }, async () => {
        const sf = await resolve.getStorefront()
        return sf ? resolve.primaryRedirectOrigin(sf) : 'NO-SF'
      })
      const itemOf = (r: Awaited<ReturnType<typeof verify.runDomainHealthCheck>>) => r.items.find((i) => i.tenantId === X.id)
      const noticeCount = (title: string) => prisma.tenantNotice.count({ where: { tenantId: X.id, title } })
      /** 渠道最近一条「自定义域名」通知是哪种（down / up / none）：必须与实际状态一致 */
      const lastDomainNotice = async () => {
        const n = await prisma.tenantNotice.findFirst({ where: { tenantId: X.id, title: { startsWith: `自定义域名 ${D.tibo} ` } }, orderBy: { id: 'desc' }, select: { title: true } })
        return !n ? 'none' : n.title.endsWith('暂时无法访问') ? 'down' : n.title.endsWith('已恢复') ? 'up' : n.title
      }

      // 应答端本身
      const nonce = 'itestNonce0123456789abcd'
      const onMain = await callRoute(h(rCheck, 'GET'), { host: MAIN_HOST, method: 'GET', path: `/api/domain-check?n=${nonce}` })
      check('应答端：主站 Host → 404', onMain.status === 404, onMain.text)
      const badN = await callRoute(h(rCheck, 'GET'), { host: D.tibo, method: 'GET', path: '/api/domain-check?n=short' })
      check('应答端：nonce 形状不对 → 400', badN.status === 400, badN.text)
      const okR = await callRoute(h(rCheck, 'GET'), { host: `${D.tibo.toUpperCase()}.:443`, method: 'GET', path: `/api/domain-check?n=${nonce}` })
      check(
        '应答端：签名绑定规范化 host + 渠道代号 + nonce，响应只有 proof',
        okR.status === 200 && okR.json?.data?.proof === verify.domainProof(D.tibo, X.code, nonce) && Object.keys(okR.json?.data ?? {}).length === 1,
        okR.text,
      )
      check('应答端：换一个 Host 签名就不同', okR.json?.data?.proof !== verify.domainProof(X.host, X.code, nonce))
      const offR = await callRoute(h(rCheck, 'GET'), { host: D.other, method: 'GET', path: `/api/domain-check?n=${nonce}` })
      check('应答端：停用的域名 → 404', offR.status === 404, offR.text)

      // cron 路由鉴权
      const noKey = await callRoute(h(rCron, 'POST'), { host: MAIN_HOST, method: 'POST', path: '/api/cron/tenant-domains' })
      check('cron 路由：不带密钥 → 非 2xx', noKey.status >= 400, `${noKey.status}`)
      setMode('route')
      const withKey = await callRoute(h(rCron, 'POST'), { host: MAIN_HOST, method: 'POST', path: '/api/cron/tenant-domains', headers: { 'x-cron-secret': process.env.CRON_SECRET as string } })
      const xi = (withKey.json?.data?.items ?? []).find((i: { host: string }) => i.host === D.tibo)
      check('cron 路由：带密钥 200，本渠道健康', withKey.status === 200 && xi?.ok === true && xi?.healthy === true && xi?.event === null, withKey.text.slice(0, 300))
      check('只有子域名的渠道（lulu 形）一次都不校验', !probe.hosts.includes(L.host) && !probe.hosts.includes(X.host), probe.hosts.join(','))

      // 失联：第一趟失败不降级（滤抖动），第二趟降级
      await prisma.tenant.update({ where: { id: X.id }, data: { wecomWebhookEnc: sealText('webhook', `${notice.WECOM_WEBHOOK_PREFIX}itest-dom-${RUN}`) } })
      const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
      const HOUR = 3_600_000
      const readRec = async () => health.parseDomainHealth((await prisma.setting.findUnique({ where: { key: health.domainHealthKey(X.id) } }))?.value)
      const writeRec = (h: import('../../src/lib/storefront/domain-health').DomainHealth) => verify.writeDomainHealth(prisma, X.id, h)
      const run = async () => itemOf(await verify.runDomainHealthCheck())
      const alertsOf = (kw: string) => platformAlerts.filter((a) => a.includes(D.tibo) && a.includes(kw)).length
      setMode('down')
      const r1 = await run()
      check('失联第 1 趟：记一次失败，仍健康、不告警', r1?.ok === false && r1.healthy === true && r1.event === null, JSON.stringify(r1))
      check('失联第 1 趟：店面仍用自定义主域名', (await origin.tenantOrigin(X.id)) === NEW)
      const r2 = await run()
      check('失联第 2 趟：降级 + 告警（event=degraded）', r2?.ok === false && r2.healthy === false && r2.event === 'degraded', JSON.stringify(r2))
      check('降级：tenantOrigin / tenantMailOpts 改用子域名', (await origin.tenantOrigin(X.id)) === SUBO && (await origin.tenantMailOpts(X.id))?.origin === SUBO)
      const inv2 = await admin.createInvite(X.id, mail('dom-invitee2'), 'OWNER', sa.id)
      check('降级：邀请链接改用子域名', inv2.link.startsWith(`${SUBO}/partner/invite/`), inv2.link.slice(0, 80))
      check('降级：旧子域名不再跳走（null）', (await redirOn(X.host)) === null)
      check('降级：自定义域名上的页面跳回子域名', (await redirOn(D.tibo)) === SUBO)
      const pgD = await withRequest({ host: D.tibo }, () => catchNext(() => partnerPage.requireChannelStorefrontPage()))
      check('降级：渠道后台布局在自定义域名上 redirectOrigin = 子域名', pgD.kind === 'ok' && pgD.value.redirectOrigin === SUBO, JSON.stringify(pgD))
      check('降级：自定义域名照样解析为该渠道（应答端还在，恢复靠它）', (await resolve.resolveStorefrontForHost(D.tibo))?.id === X.id)
      check('降级：库里的 Tenant.origin 不动', (await prisma.tenant.findUnique({ where: { id: X.id } }))?.origin === NEW)
      check('降级：渠道收到一条站内通知', (await noticeCount(`自定义域名 ${D.tibo} 暂时无法访问`)) === 1)
      const det = await admin.tenantDetail(X.id)
      check('渠道详情：primaryHealth 标出不健康与原因', det.primaryHealth?.healthy === false && det.primaryHealth.host === D.tibo && !!det.primaryHealth.reason, JSON.stringify(det.primaryHealth))
      // 通知与告警只写归类原因（契约 9.2）：渠道与站长群看到「解析不到」，看不到 ENOTFOUND；超管详情里有细节
      const degN = await prisma.tenantNotice.findFirst({ where: { tenantId: X.id, title: `自定义域名 ${D.tibo} 暂时无法访问` } })
      check('降级通知只写归类原因（解析不到），不写原始错误码', !!degN?.body?.includes('（解析不到）') && !degN.body.includes('ENOTFOUND'), degN?.body ?? '')
      const degA = platformAlerts.filter((a) => a.includes(D.tibo) && a.includes('连续校验失败'))
      check('站长群降级告警恰好一条，只写归类原因', degA.length === 1 && degA[0].includes('解析不到') && !degA[0].includes('ENOTFOUND'), degA.join(' | ').slice(0, 300))
      check('超管详情的原因带技术细节（ENOTFOUND）', !!det.primaryHealth?.reason?.includes('解析不到') && !!det.primaryHealth.reason.includes('ENOTFOUND'), String(det.primaryHealth?.reason))
      // 渠道推送里的「前往渠道后台」按钮：降级时指向子域名（notice.ts 用 storefrontById，与邮件同源），不把店主带到失联的域名上
      await notice.waitTenantNoticePushesForTest()
      const degP = pushes.find((x) => x.includes('暂时无法访问'))
      check('降级：渠道推送按钮指向子域名、不含自定义域名链接', !!degP && degP.includes(`](${SUBO}/partner/`) && !degP.includes(`${NEW}/partner`), (degP ?? '(没有推送)').slice(0, 300))
      const r3 = await run()
      check('仍失联的第 3 趟：不重复告警（6 小时节流）', r3?.healthy === false && r3.event === null && (await noticeCount(`自定义域名 ${D.tibo} 暂时无法访问`)) === 1 && alertsOf('连续校验失败') === 1, JSON.stringify(r3))

      // 恢复：连续两趟成功才切回（2026-10-01：防晚高峰时通时断来回跳），切回时推一次恢复
      setMode('route')
      const r4 = await run()
      check('恢复第 1 趟：校验通过但仍降级（event=null），仍用子域名', r4?.ok === true && r4.healthy === false && r4.event === null && (await origin.tenantOrigin(X.id)) === SUBO, JSON.stringify(r4))
      const detR = await admin.tenantDetail(X.id)
      check('渠道详情：降级中已通过 1 次（down=true、oks=1、fails=0）', detR.primaryHealth?.down === true && detR.primaryHealth.oks === 1 && detR.primaryHealth.fails === 0, JSON.stringify(detR.primaryHealth))
      const r5 = await run()
      check('恢复第 2 趟：event=recovered，健康', r5?.ok === true && r5.healthy === true && r5.event === 'recovered', JSON.stringify(r5))
      check('恢复：tenantOrigin 切回自定义域名、旧子域名重新跳过去', (await origin.tenantOrigin(X.id)) === NEW && (await redirOn(X.host)) === NEW && (await redirOn(D.tibo)) === null)
      check('恢复：渠道收到恢复通知、站长群一条恢复告警', (await noticeCount(`自定义域名 ${D.tibo} 已恢复`)) === 1 && alertsOf('已恢复') === 1)
      await notice.waitTenantNoticePushesForTest()
      const upP = pushes.find((x) => x.includes('已恢复'))
      check('恢复：渠道推送按钮指回自定义主域名', !!upP && upP.includes(`](${NEW}/partner/`), (upP ?? '(没有推送)').slice(0, 300))
      const r6 = await run()
      check('恢复后再跑：不再告警', r6?.healthy === true && r6.event === null, JSON.stringify(r6))

      // 抖动 + 6 小时节流：刚恢复不久又连续失败两趟 → 照样降级（安全优先）；站长群被节流不再告警，
      // 但渠道上一条通知是「已恢复」，必须再发一条「暂时无法访问」（复核：否则渠道以为店铺还在自定义域名上，实际已改走子域名）
      setMode('down')
      const alertsBefore = platformAlerts.length
      const f1 = await run()
      const f2 = await run()
      check('抖动：6 小时内再次降级 → 店面照样改用子域名，站长群 event=null', f1?.event === null && f1.notice === null && f2?.healthy === false && f2.event === null && (await origin.tenantOrigin(X.id)) === SUBO, `${JSON.stringify(f1)} ${JSON.stringify(f2)}`)
      check('抖动：站长群没有新告警', platformAlerts.length === alertsBefore, platformAlerts.slice(alertsBefore).join(' | '))
      const downN2 = await prisma.tenantNotice.findFirst({ where: { tenantId: X.id, title: `自定义域名 ${D.tibo} 暂时无法访问` }, orderBy: { id: 'desc' } })
      check(
        '抖动：渠道收到第二条「暂时无法访问」（notice=down，原因是归类原因），最新一条通知与实际状态一致',
        f2?.notice === 'down' && (await noticeCount(`自定义域名 ${D.tibo} 暂时无法访问`)) === 2 && !!downN2?.body?.includes('（解析不到）') && (await lastDomainNotice()) === 'down',
        `${JSON.stringify(f2)} ${downN2?.body}`,
      )
      // realert：仍在降级、距上次降级告警 5 小时 → 不提醒；满 6 小时 → 只提醒站长群一次（不再发站内通知）
      const cur1 = (await readRec())!
      await writeRec({ ...cur1, downAlertAt: ago(5 * HOUR) })
      const g1 = await run()
      check('realert：距上次降级告警 5 小时 → 不提醒', g1?.healthy === false && g1.event === null, JSON.stringify(g1))
      const cur2 = (await readRec())!
      await writeRec({ ...cur2, downAlertAt: ago(6 * HOUR + 60_000) })
      const beforeRe = platformAlerts.length
      const g2 = await run()
      const reText = platformAlerts.slice(beforeRe).join(' | ')
      check('realert：满 6 小时 → event=realert，站长群一条「仍未恢复」', g2?.event === 'realert' && reText.includes('仍未恢复') && reText.includes('解析不到') && !reText.includes('ENOTFOUND'), `${JSON.stringify(g2)} ${reText.slice(0, 200)}`)
      check('realert：渠道已知道在降级，不再发站内通知', g2?.notice === null && (await noticeCount(`自定义域名 ${D.tibo} 暂时无法访问`)) === 2)
      const g3 = await run()
      check('realert 之后下一趟：不再提醒（重新计 6 小时）', g3?.event === null, JSON.stringify(g3))
      // 恢复途中不 realert（复核）：仍降级、距上次降级告警已满 6 小时，但本趟校验通过（恢复要两趟，down 仍为 true）
      // → 不推「仍未恢复（未知）」，downAlertAt 不动
      const cur3 = (await readRec())!
      const oldDownAt = ago(6 * HOUR + 60_000)
      await writeRec({ ...cur3, downAlertAt: oldDownAt })
      setMode('route')
      const aK = platformAlerts.length
      const k1 = await run()
      const recK1 = await readRec()
      check(
        '恢复途中：降级满 6 小时后第一趟通过 → event=null、站长群无告警、渠道无通知、downAlertAt 不动，仍用子域名',
        k1?.ok === true && k1.healthy === false && k1.event === null && k1.notice === null && platformAlerts.length === aK && recK1?.downAlertAt === oldDownAt && recK1.down === true,
        `${JSON.stringify(k1)} ${platformAlerts.slice(aK).join(' | ').slice(0, 200)}`,
      )
      // 恢复节流：距上次「已恢复」告警不到 6 小时 → 连续两趟成功照样切回，站长群不推「已恢复」；
      // 渠道上一条是「暂时无法访问」→ 照样收到「已恢复」（不节流），最新一条与实际状态一致
      const k2 = await run()
      check('恢复节流：6 小时内第二次恢复 → 切回，站长群 event=null、不再告警', k2?.healthy === true && k2.event === null && alertsOf('已恢复') === 1 && (await origin.tenantOrigin(X.id)) === NEW, JSON.stringify(k2))
      check('恢复节流：渠道照样收到第二条「已恢复」（notice=up），最新一条通知与实际状态一致', k2?.notice === 'up' && (await noticeCount(`自定义域名 ${D.tibo} 已恢复`)) === 2 && (await lastDomainNotice()) === 'up', JSON.stringify(k2))
      const k3 = await run()
      check('恢复后再跑：渠道已知道恢复，不重复通知', k3?.healthy === true && k3.event === null && k3.notice === null && (await noticeCount(`自定义域名 ${D.tibo} 已恢复`)) === 2, JSON.stringify(k3))

      // 纯状态机回放（复核给的场景，10 分钟一趟）：失败 2、通过 2、失败 38、通过 2。
      // 站长群按 6 小时节流；渠道通知必须一条「暂时无法访问」一条「已恢复」交替，第二次降级（60 分钟）不能漏
      {
        let rec: import('../../src/lib/storefront/domain-health').DomainHealth | null = null
        const t0 = Date.now()
        const seq = [false, false, true, true, ...new Array(38).fill(false), true, true]
        const evs: string[] = []
        const nts: string[] = []
        seq.forEach((ok, i) => {
          const at = t0 + (i + 1) * 10 * 60_000
          const o = health.nextDomainHealth(rec, D.tibo, ok ? { ok: true } : { ok: false, reason: '解析不到', detail: 'ENOTFOUND' }, at)
          rec = o.next
          if (o.event) evs.push(`${(i + 1) * 10}m:${o.event}`)
          if (o.notice) nts.push(`${(i + 1) * 10}m:${o.notice}`)
        })
        check('回放：站长群 degraded@20m / recovered@40m / realert@380m / recovered@440m', evs.join(' ') === '20m:degraded 40m:recovered 380m:realert 440m:recovered', evs.join(' '))
        check('回放：渠道通知 down@20m / up@40m / down@60m / up@440m（交替、不漏第二次降级）', nts.join(' ') === '20m:down 40m:up 60m:down 440m:up', nts.join(' '))
        // 降级中满 6 小时、本趟通过 → 不 realert（复核：否则刚通过就推「仍未恢复（未知）」）
        const downRec = { ...verify.freshHealth(D.tibo, new Date(t0 - 7 * HOUR)), fails: 40, oks: 0, down: true, reason: '解析不到', detail: 'ENOTFOUND', downAlertAt: new Date(t0 - 7 * HOUR).toISOString(), told: 'down' as const }
        const sw = health.nextDomainHealth(downRec, D.tibo, { ok: true }, t0)
        check('纯函数：降级 + downAlertAt 7 小时前 + 一趟通过 → event=null、notice=null、downAlertAt 不动', sw.event === null && sw.notice === null && sw.next.down === true && sw.next.downAlertAt === downRec.downAlertAt, JSON.stringify(sw))
        // 旧记录（told 上线前写的，没有这个字段）：按两个告警时间戳推断渠道最后听到的是什么；写了 null 就信 null
        const legacy = (d: string | null, u: string | null) =>
          health.parseDomainHealth(JSON.stringify({ host: D.tibo, okAt: null, checkedAt: ago(0), fails: 2, oks: 0, down: true, reason: null, detail: null, downAlertAt: d, upAlertAt: u }))?.told
        check(
          '旧记录没有 told：降级告警更新 → down、恢复告警更新 → up、都没有 → null；显式 null 不推断',
          legacy(ago(HOUR), ago(2 * HOUR)) === 'down' && legacy(ago(2 * HOUR), ago(HOUR)) === 'up' && legacy(null, null) === null &&
            health.parseDomainHealth(JSON.stringify({ host: D.tibo, okAt: null, checkedAt: ago(0), fails: 0, told: null, downAlertAt: ago(HOUR) }))?.told === null,
        )
        // 本站算不出期望值（JWT_SECRET 缺失）→「本站校验出错」、一个请求都不发、不重试（复核：先发请求会被应答端的 503 记成「返回内容不符」，冤枉客户域名）
        const savedSecret = process.env.JWT_SECRET
        setMode('route')
        delete process.env.JWT_SECRET
        let lv: Awaited<ReturnType<typeof verify.verifyCustomDomain>>
        const tL = Date.now()
        try {
          lv = await verify.verifyCustomDomain(D.tibo, X.code)
        } finally {
          process.env.JWT_SECRET = savedSecret
        }
        check(
          '缺 JWT_SECRET：归「本站校验出错」、不发请求、不等 3 秒重试',
          !lv.ok && lv.category === 'local' && lv.reason === '本站校验出错' && probe.hosts.length === 0 && Date.now() - tL < 2_000,
          `${JSON.stringify(lv)} hosts=${probe.hosts.join(',')}`,
        )
      }

      // 并发（CAS）：cron 探测期间，校验记录被站长「重新校验」改写 → cron 放弃本次写入，不拿旧计数覆盖新结果
      setMode('down')
      await writeRec({ ...(await readRec())!, fails: 1, oks: 0, reason: '解析不到', detail: 'ENOTFOUND' }) // 再失败一趟就会降级
      const manual = verify.freshHealth(D.tibo)
      probe.hook = async () => {
        await verify.writeDomainHealth(prisma, X.id, manual)
      }
      const cas1 = await run()
      const afterCas = await readRec()
      check(
        'CAS：探测期间记录被改 → skipped、不告警，记录保持站长写入的那份（fails=0，没被打回降级）',
        cas1?.skipped === true && cas1.event === null && afterCas?.fails === 0 && afterCas.okAt === manual.okAt && afterCas.down === false,
        `${JSON.stringify(cas1)} ${JSON.stringify(afterCas)}`,
      )
      const rawBefore = (await prisma.setting.findUnique({ where: { key: health.domainHealthKey(X.id) } }))?.value
      probe.hook = async () => {
        await prisma.tenant.update({ where: { id: X.id }, data: { origin: SUBO } })
      }
      const cas2 = await run()
      const rawAfter = (await prisma.setting.findUnique({ where: { key: health.domainHealthKey(X.id) } }))?.value
      check('CAS：探测期间主域名被换掉 → skipped，记录一字不动', cas2?.skipped === true && rawAfter === rawBefore, JSON.stringify(cas2))
      await prisma.tenant.update({ where: { id: X.id }, data: { origin: NEW } })
      resolve.invalidateStorefrontCache()

      // 已停业（TERMINATED）：cron 不复验（一个请求都不发）、不告警；记录过期也不发「校验记录过期」告警
      await prisma.tenant.update({ where: { id: X.id }, data: { status: 'TERMINATED' } })
      setMode('route')
      const tr = await verify.runDomainHealthCheck()
      check('TERMINATED：cron 不复验（结果里没有它、一个请求都不发）', !itemOf(tr) && !probe.hosts.includes(D.tibo), JSON.stringify(tr.items))
      const staleAt = new Date(Date.now() - health.HEALTH_OK_TTL_MS - 60_000)
      await verify.writeDomainHealth(prisma, X.id, verify.freshHealth(D.tibo, staleAt))
      resolve.invalidateStorefrontCache()
      const aT = platformAlerts.length
      const sfT = await resolve.storefrontById(X.id)
      check('TERMINATED + 记录过期：店面照样改用子域名，但不发「校验记录过期」告警', sfT?.origin === SUBO && platformAlerts.length === aT, platformAlerts.slice(aT).join(' | '))
      await prisma.tenant.update({ where: { id: X.id }, data: { status: 'ACTIVE' } })
      resolve.invalidateStorefrontCache()

      // 记录过期（cron 停了 40 分钟以上）与没有记录：同样改用子域名（fail closed）；过期时站长群告警一次（每渠道 6 小时最多一次）
      const key = health.domainHealthKey(X.id)
      const aS = platformAlerts.length
      check('记录过期（没人复验）→ 改用子域名', (await origin.tenantOrigin(X.id)) === SUBO)
      const staleText = platformAlerts.slice(aS).join(' | ')
      check('记录过期 → 站长群告警一条，提示检查 cron 容器与 /api/cron/tenant-domains', platformAlerts.length - aS === 1 && staleText.includes('40 分钟') && staleText.includes('cron') && staleText.includes('/api/cron/tenant-domains'), staleText.slice(0, 300))
      resolve.invalidateStorefrontCache()
      await origin.tenantOrigin(X.id)
      check('记录过期告警节流：缓存失效后再解析，不重复告警', platformAlerts.length - aS === 1)
      await prisma.setting.deleteMany({ where: { key } })
      resolve.invalidateStorefrontCache()
      check('没有记录 → 改用子域名', (await origin.tenantOrigin(X.id)) === SUBO && (await redirOn(X.host)) === null)
      await verify.writeDomainHealth(prisma, X.id, { ...verify.freshHealth(X.host), host: X.host })
      resolve.invalidateStorefrontCache()
      check('记录的 host 不是当前主域名 → 不算数，改用子域名', (await origin.tenantOrigin(X.id)) === SUBO)
      await prisma.setting.update({ where: { key }, data: { value: '{broken' } })
      resolve.invalidateStorefrontCache()
      check('记录损坏 → 改用子域名', (await origin.tenantOrigin(X.id)) === SUBO)

      // 后台「重新校验」= 对已是主域名的自定义域名再设一次主：校验通过立即恢复（不必等两趟），changed=false、不写审计；原本降级的推「已恢复」
      const auditBefore = await prisma.auditEvent.count({ where: { tenantId: X.id, action: 'tenant.domain_primary' } })
      setMode('down')
      const reBad = await call('POST', X.id, { action: 'primary', host: D.tibo })
      check('重新校验：仍失联 → 400，仍用子域名', reBad.status === 400 && reBad.json?.reason === 'DOMAIN_NOT_VERIFIED' && (await origin.tenantOrigin(X.id)) === SUBO, reBad.text)
      check('重新校验失败提示（只给超管）带归类原因与细节', String(reBad.json?.error).includes('解析不到') && String(reBad.json?.error).includes('ENOTFOUND'), String(reBad.json?.error))
      // 造一条「降级中、上次恢复告警已超过 6 小时」的记录：手动恢复应推一次「已恢复」
      await writeRec({ ...verify.freshHealth(D.tibo, new Date(Date.now() - 30 * 60_000)), fails: 2, oks: 0, down: true, reason: '解析不到', detail: 'ENOTFOUND', downAlertAt: ago(HOUR), upAlertAt: ago(7 * HOUR), told: 'down' })
      const upBefore = await noticeCount(`自定义域名 ${D.tibo} 已恢复`)
      const upAlertBefore = alertsOf('已恢复')
      setMode('route')
      const reOk = await call('POST', X.id, { action: 'primary', host: D.tibo })
      check('重新校验：通过 → 200 changed=false，立即切回自定义域名（不必等两趟）', reOk.status === 200 && reOk.json?.data?.changed === false && (await origin.tenantOrigin(X.id)) === NEW, reOk.text)
      check('重新校验恢复：渠道收到「已恢复」通知、站长群一条恢复告警', (await noticeCount(`自定义域名 ${D.tibo} 已恢复`)) === upBefore + 1 && alertsOf('已恢复') === upAlertBefore + 1)
      const afterManual = await readRec()
      check('重新校验：记录解除降级，保留降级告警时间戳（节流照旧）', afterManual?.down === false && afterManual.fails === 0 && !!afterManual.downAlertAt, JSON.stringify(afterManual))
      check('重新校验不写审计', (await prisma.auditEvent.count({ where: { tenantId: X.id, action: 'tenant.domain_primary' } })) === auditBefore)
      const det2 = await admin.tenantDetail(X.id)
      check('渠道详情：primaryHealth 恢复健康', det2.primaryHealth?.healthy === true, JSON.stringify(det2.primaryHealth))
      const reAgain = await call('POST', X.id, { action: 'primary', host: D.tibo })
      check('本来就健康时再点重新校验：200，不发「已恢复」', reAgain.status === 200 && (await noticeCount(`自定义域名 ${D.tibo} 已恢复`)) === upBefore + 1)
      const detL = await admin.tenantDetail(L.id)
      check('只有子域名的渠道：primaryHealth = null', detL.primaryHealth === null)

      // 降级但本渠道没有启用中的子域名（设主与停用都拦了，只有脏数据会走到）：只停止跳转，链接仍用自定义域名，告警写明
      await prisma.tenantDomain.create({ data: { tenantId: Z.id, host: D.zc, status: 1, isPrimary: true } })
      await prisma.tenantDomain.updateMany({ where: { tenantId: Z.id, host: Z.host }, data: { status: 0, isPrimary: false } })
      await prisma.tenant.update({ where: { id: Z.id }, data: { origin: `https://${D.zc}` } })
      await verify.writeDomainHealth(prisma, Z.id, { ...verify.freshHealth(D.zc), fails: 2, oks: 0, down: true, reason: '连接失败', detail: '超时' })
      resolve.invalidateStorefrontCache()
      try {
        const sfZ = await resolve.storefrontById(Z.id)
        check('没有子域名可退：origin 仍是自定义域名、canonicalHost 置空（停止跳转）', sfZ?.origin === `https://${D.zc}` && sfZ.canonicalHost === '', JSON.stringify(sfZ))
        const zr = await withRequest({ host: D.zc }, async () => {
          const sf = await resolve.getStorefront()
          return sf ? resolve.primaryRedirectOrigin(sf) : 'NO-SF'
        })
        check('没有子域名可退：自定义域名上不挂跳转', zr === null, String(zr))
        check('没有子域名可退：tenantOrigin 仍是自定义域名', (await origin.tenantOrigin(Z.id)) === `https://${D.zc}`)
        const aZ = platformAlerts.length
        await verify.announceDomainEvent(Z.id, Z.code, D.zc, 'degraded', 'down', '连接失败')
        const zText = platformAlerts.slice(aZ).join(' | ')
        const zN = await prisma.tenantNotice.findFirst({ where: { tenantId: Z.id, title: `自定义域名 ${D.zc} 暂时无法访问` } })
        check('没有子域名可退：站长群告警写明「没有启用中的子域名」，渠道通知写「原地址」', zText.includes('没有启用中的子域名') && !!zN?.body?.includes('原地址'), `${zText.slice(0, 200)} / ${zN?.body}`)
      } finally {
        await prisma.tenant.update({ where: { id: Z.id }, data: { origin: Z.origin } })
        await prisma.tenantDomain.updateMany({ where: { tenantId: Z.id, host: Z.host }, data: { status: 1, isPrimary: true } })
        await prisma.tenantDomain.deleteMany({ where: { host: D.zc } })
        await prisma.setting.deleteMany({ where: { key: health.domainHealthKey(Z.id) } })
        resolve.invalidateStorefrontCache()
      }
    }

    // =======================================================================
    section('D-6 不变量：主站、只有子域名的渠道、休眠态逐字不变')
    {
      // 主站：不查库，与 platformStorefront() 完全相同
      const throwing = {
        findDomain: async () => {
          throw new Error('itest: 主站不应查库')
        },
        findTenant: async () => {
          throw new Error('itest: 主站不应查库')
        },
        listCustomHosts: async () => {
          throw new Error('itest: 主站不应查库')
        },
      }
      resolve.setStorefrontDbForTest(throwing)
      for (const hst of ['bigolab.com', 'www.bigolab.com', 'localhost:3000', '127.0.0.1', 'app']) {
        const s = await resolve.resolveStorefrontForHost(hst)
        check(`主站 Host ${hst}：不查库，结果与 platformStorefront() 逐字相同`, JSON.stringify(s) === JSON.stringify(resolve.platformStorefront()))
      }
      resolve.setStorefrontDbForTest(null)
      const ps = resolve.platformStorefront()
      check('主站 canonicalHost = siteOrigin 的规范化主机名', ps.canonicalHost === hosts.normalizeHost(new URL(ps.origin).host), `${ps.canonicalHost} / ${ps.origin}`)
      check('主站永远不跳转', (await withRequest({ host: MAIN_HOST }, async () => resolve.primaryRedirectOrigin((await resolve.getStorefront())!))) === null)

      // 只有子域名的渠道（lulu 形）：解析字段与改造前一致（多一个 canonicalHost = 子域名），不跳转，不加载集合
      resolve.invalidateStorefrontCache()
      const cnt = { list: 0 }
      resolve.setStorefrontDbForTest({
        findDomain: (host: string) => prisma.tenantDomain.findUnique({ where: { host }, select: { tenantId: true, status: true } }),
        findTenant: (id: number) => prisma.tenant.findUnique({ where: { id }, select: { id: true, code: true, kind: true, status: true, origin: true } }),
        listCustomHosts: async () => {
          cnt.list++
          return []
        },
      })
      const sL = await resolve.resolveStorefrontForHost(L.host)
      check(
        'lulu 形渠道：id / code / kind / status / origin 与登记一致，canonicalHost = 子域名',
        sL?.id === L.id && sL.code === L.code && sL.kind === 'CHANNEL' && sL.status === 'ACTIVE' && sL.origin === L.origin && sL.canonicalHost === L.host,
        JSON.stringify(sL),
      )
      check('lulu 形渠道：子域名解析不加载自定义域名集合', cnt.list === 0, `加载 ${cnt.list} 次`)
      resolve.setStorefrontDbForTest(null)
      check('lulu 形渠道：在自己的子域名上不跳转', (await withRequest({ host: L.host }, async () => resolve.primaryRedirectOrigin((await resolve.getStorefront())!))) === null)
      const lp = await withRequest({ host: L.host }, () => catchNext(() => partnerPage.requireChannelStorefrontPage()))
      check('lulu 形渠道：渠道后台布局 redirectOrigin = null', lp.kind === 'ok' && lp.value.redirectOrigin === null)
      check('lulu 形渠道：tenantOrigin 仍是子域名', (await origin.tenantOrigin(L.id)) === L.origin)

      // 休眠态：任何 Host（含已登记的自定义域名）都是主站，不查库
      setChannelsMode('dormant')
      resolve.setStorefrontDbForTest(throwing)
      let allMain = true
      for (const hst of [D.tibo, D.www, X.host, L.host, 'random.example', '1.2.3.4']) {
        allMain = allMain && JSON.stringify(await resolve.resolveStorefrontForHost(hst)) === JSON.stringify(resolve.platformStorefront())
      }
      check('休眠态：任何 Host（含自定义域名）都是主站、不查库', allMain)
      resolve.setStorefrontDbForTest(null)
      setChannelsMode('observe')
    }

    // =======================================================================
    section('D-8 探测本身：解压炸弹 / 超长 / 慢速 / 错误类型 / 非公网地址（本地 http 桩，契约 9.2）')
    {
      const zlib = await import('zlib')
      const httpMod = await import('http')
      // br 炸弹：512 MiB 的 0 流式压成几百 KB（不在测试进程里整块分配 512 MiB）
      const INFLATED_MIB = 512
      const bomb = await new Promise<Buffer>((res, rej) => {
        const z = zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
        const out: Buffer[] = []
        z.on('data', (c: Buffer) => out.push(c))
        z.on('end', () => res(Buffer.concat(out)))
        z.on('error', rej)
        const chunk = Buffer.alloc(1 << 20)
        let n = 0
        const pump = () => {
          while (n < INFLATED_MIB) {
            n++
            if (!z.write(chunk)) {
              z.once('drain', pump)
              return
            }
          }
          z.end()
        }
        pump()
      })
      // brotli 对全 0 的压缩比极高（实测 512 MiB → 约 1 KB）：比 4096 字节的 body 上限还小，只靠「截断 body」挡不住，必须在解压之前拒绝
      check(`br 炸弹：解压后 ${INFLATED_MIB} MiB，压缩后只有 ${bomb.length} 字节`, bomb.length < 64 * 1024)
      // 「炸弹字节当明文 body」用例要超过上限：把炸弹重复拼到 1 MB
      const bombRaw = Buffer.concat(Array.from({ length: Math.ceil((1 << 20) / bomb.length) }, () => bomb))

      const hits: string[] = []
      let endlessBytes = 0
      const sockets = new Set<import('net').Socket>()
      const JSON_OK = '{"success":true,"data":{"proof":"x"}}'
      const server = httpMod.createServer((rq, rs) => {
        hits.push(rq.url ?? '')
        const p = (rq.url ?? '').split('?')[0]
        const json = { 'content-type': 'application/json' }
        rs.on('error', () => undefined)
        switch (p) {
          case '/bomb-br': // 声明 br：探测方在读 body 之前就判失败
            rs.writeHead(200, { ...json, 'content-encoding': 'br' })
            rs.end(bomb)
            return
          case '/bomb-raw': // 不声明编码、直接把炸弹字节（重复拼到 1 MB）当 body：流式读到 4096 字节就断开
            rs.writeHead(200, json)
            rs.end(bombRaw)
            return
          case '/bomb-gzip-lie': // 声明 gzip（与 identity 不符）
            rs.writeHead(200, { ...json, 'content-encoding': 'gzip' })
            rs.end(zlib.gzipSync(Buffer.alloc(4 << 20)))
            return
          case '/huge-cl': // 声明 content-length 10 MB：看到头就判失败
            rs.writeHead(200, { ...json, 'content-length': String(10 * 1024 * 1024) })
            rs.write(Buffer.alloc(1024))
            return
          case '/endless': {
            // 分块无限写：探测方累计超过 4096 字节立即断开
            rs.writeHead(200, json)
            const tick = () => {
              if (rs.destroyed || rs.writableEnded) return
              endlessBytes += 1024
              if (endlessBytes > 64 * 1024 * 1024) return rs.end()
              if (rs.write(Buffer.alloc(1024, 0x20))) setImmediate(tick)
              else rs.once('drain', tick)
            }
            tick()
            return
          }
          case '/slow': // 头很快、body 每 300ms 滴 1 字节：总超时判失败
            rs.writeHead(200, json)
            {
              const iv = setInterval(() => (rs.destroyed ? clearInterval(iv) : rs.write(' ')), 300)
              rs.on('close', () => clearInterval(iv))
            }
            return
          case '/hang': // 连响应头都不给
            return
          case '/html': // 内容是合法 JSON，但 content-type 不是 application/json
            rs.writeHead(200, { 'content-type': 'text/html' })
            rs.end(JSON_OK)
            return
          case '/no-ct':
            rs.writeHead(200)
            rs.end(JSON_OK)
            return
          case '/redirect':
            rs.writeHead(301, { location: 'https://evil.example/' })
            rs.end()
            return
          case '/ok':
            rs.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': String(Buffer.byteLength(JSON_OK)) })
            rs.end(JSON_OK)
            return
          default:
            rs.writeHead(404, json)
            rs.end('{}')
        }
      })
      server.on('connection', (s) => {
        sockets.add(s)
        s.on('close', () => sockets.delete(s))
      })
      await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
      const port = (server.address() as import('net').AddressInfo).port
      const local = { protocol: 'http' as const, port, timeoutMs: 1500, resolveAll: async () => [{ address: '127.0.0.1', family: 4 }], isAllowedAddress: () => true }
      const tryProbe = async (path: string, o: Partial<import('../../src/lib/tenant/domain-verify').NetworkProbeOptions> = {}) => {
        const t0 = Date.now()
        try {
          const r = await verify.probeViaNetwork('itest-stub.example', path, { ...local, ...o })
          return { ok: true as const, r, ms: Date.now() - t0 }
        } catch (e) {
          const c = verify.classifyProbeError(e)
          return { ok: false as const, category: c.category, detail: c.detail, ms: Date.now() - t0 }
        }
      }
      try {
        const mem0 = process.memoryUsage()
        const b1 = await tryProbe('/bomb-br')
        check('br 炸弹（content-encoding: br）→ 返回内容不符，没读 body', !b1.ok && b1.category === 'content' && /content-encoding/.test(b1.detail), JSON.stringify(b1))
        const b2 = await tryProbe('/bomb-raw')
        check('炸弹字节当明文 body → 读到 4096 字节即断开，返回内容不符', !b2.ok && b2.category === 'content' && /body > 4096/.test(b2.detail), JSON.stringify(b2))
        const b3 = await tryProbe('/bomb-gzip-lie')
        check('无视 accept-encoding: identity 回 gzip → 返回内容不符', !b3.ok && b3.category === 'content' && /gzip/.test(b3.detail), JSON.stringify(b3))
        const b4 = await tryProbe('/huge-cl')
        check('content-length 声明 10 MB → 看到头就判失败', !b4.ok && b4.category === 'content' && /content-length/.test(b4.detail), JSON.stringify(b4))
        const b5 = await tryProbe('/endless')
        await new Promise((r) => setTimeout(r, 200))
        check('无限分块 body → 超过 4096 字节立即断开（服务端没能写出 1 MB）', !b5.ok && b5.category === 'content' && endlessBytes < 1024 * 1024, `${JSON.stringify(b5)} 服务端写了 ${endlessBytes} 字节`)
        const mem1 = process.memoryUsage()
        const dRss = (mem1.rss - mem0.rss) / 1048576
        const dHeap = (mem1.heapUsed - mem0.heapUsed) / 1048576
        check(`以上五种之后进程内存不涨（rss +${dRss.toFixed(1)} MB、heap +${dHeap.toFixed(1)} MB，炸弹解压后是 ${INFLATED_MIB} MB）`, dRss < 64 && dHeap < 32)
        const s1 = await tryProbe('/slow')
        check('慢速滴灌 body → 总超时判失败（连接失败 / 超时）', !s1.ok && s1.category === 'connect' && s1.detail === '超时' && s1.ms < 3000, JSON.stringify(s1))
        const s2 = await tryProbe('/hang')
        check('迟迟不给响应头 → 总超时判失败', !s2.ok && s2.category === 'connect' && s2.detail === '超时' && s2.ms < 3000, JSON.stringify(s2))
        const t1 = await tryProbe('/html')
        check('content-type: text/html（内容是合法 JSON）→ 返回内容不符', !t1.ok && t1.category === 'content' && /content-type/.test(t1.detail), JSON.stringify(t1))
        const t2 = await tryProbe('/no-ct')
        check('没有 content-type → 返回内容不符', !t2.ok && t2.category === 'content', JSON.stringify(t2))
        const t3 = await tryProbe('/redirect')
        check('301 → 不跟随，原样返回状态码（上层判「返回内容不符」）', t3.ok && t3.r.status === 301 && t3.r.body === '' && !hits.some((x) => x.includes('evil')), JSON.stringify(t3))
        const t4 = await tryProbe('/ok')
        check('正常应答（application/json; charset=utf-8）→ 原样读出 body', t4.ok && t4.r.status === 200 && t4.r.body === JSON_OK, JSON.stringify(t4))

        // 非公网地址：判失败，而且一个请求都不发（hits 不变）
        const h0 = hits.length
        const p1 = await tryProbe('/ok', { resolveAll: async () => [{ address: '104.16.132.229', family: 4 }, { address: '10.0.0.5', family: 4 }], isAllowedAddress: undefined })
        check('解析结果里有一个私网地址 → 指向了非公网地址、不发请求', !p1.ok && p1.category === 'private' && hits.length === h0, JSON.stringify(p1))
        const p2 = await tryProbe('/ok', { resolveAll: async () => [{ address: '::ffff:127.0.0.1', family: 6 }], isAllowedAddress: undefined })
        check('IPv4 映射的回环地址 → 指向了非公网地址、不发请求', !p2.ok && p2.category === 'private' && hits.length === h0, JSON.stringify(p2))
        const p4 = await (async () => {
          try {
            await verify.probeViaNetwork('localhost', '/ok', { protocol: 'http', port, timeoutMs: 1500 })
            return 'ok'
          } catch (e) {
            return verify.classifyProbeError(e).category
          }
        })()
        check('真实 DNS：localhost（回环）→ 指向了非公网地址、不发请求', p4 === 'private' && hits.length === h0, String(p4))
        const p5 = await tryProbe('/ok', { resolveAll: async () => [] })
        check('解析结果为空 → 解析不到', !p5.ok && p5.category === 'dns', JSON.stringify(p5))
        const p6 = await tryProbe('/ok', { resolveAll: async () => Promise.reject(Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })) })
        check('解析报 ENOTFOUND → 解析不到', !p6.ok && p6.category === 'dns' && p6.detail === 'ENOTFOUND', JSON.stringify(p6))

        // verifyCustomDomain：指向非公网地址不重试（不会 3 秒内变好，也不该再解析一次碰运气）
        let calls = 0
        verify.setDomainProbeTransportForTest(async () => {
          calls++
          throw new verify.ProbeError('private', '10.0.0.1')
        })
        const tv0 = Date.now()
        const vr = await verify.verifyCustomDomain(D.tibo, X.code)
        check('verifyCustomDomain：非公网地址只试一次、归类原因「指向了非公网地址」', !vr.ok && vr.reason === '指向了非公网地址' && calls === 1 && Date.now() - tv0 < 2000, JSON.stringify(vr))
      } finally {
        sockets.forEach((s) => s.destroy())
        await new Promise<void>((r) => server.close(() => r()))
      }

      // 地址判定表（IPv4 与 IPv6）
      const pub = ['1.1.1.1', '8.8.8.8', '104.16.132.229', '172.32.0.1', '100.128.0.1', '2606:4700::6810:84e5', '2400:cb00::1', '::ffff:104.16.0.1', '2002:6810:84e5::1']
      const priv = [
        '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '127.0.0.1', '127.9.9.9', '169.254.169.254', '100.64.0.1', '100.127.255.255', '0.0.0.0', '0.1.2.3',
        '224.0.0.1', '239.255.255.250', '240.0.0.1', '255.255.255.255', '198.18.0.1', '192.0.2.1', '198.51.100.7', '203.0.113.9', '192.0.0.8',
        '::', '::1', 'fe80::1', 'fe80::1%eth0', 'fc00::1', 'fd12:3456::1', 'ff02::1', 'fec0::1', '::ffff:10.0.0.1', '::ffff:127.0.0.1', '::ffff:169.254.169.254',
        '64:ff9b::a00:1', '2002:0a00:0001::1', '2001:db8::1', '2001::1', '100::1', '3fff::1', '::10.0.0.1',
        'not-an-ip', '1.2.3', '256.1.1.1', '',
      ]
      const badPub = pub.filter((ip) => !verify.isPublicAddress(ip))
      const badPriv = priv.filter((ip) => verify.isPublicAddress(ip))
      check(`isPublicAddress：${pub.length} 个公网地址都放行`, badPub.length === 0, badPub.join(', '))
      check(`isPublicAddress：${priv.length} 个私网 / 回环 / 链路本地 / CGNAT / 保留 / 非法地址都拦住`, badPriv.length === 0, badPriv.join(', '))
    }
  } finally {
    await notice.waitTenantNoticePushesForTest().catch(() => undefined)
    notice.setTenantNoticeTransportForTest(null)
    verify.setDomainProbeTransportForTest(null)
    resolve.setStorefrontDbForTest(null)
    console.warn = origWarn
    await prisma.setting.deleteMany({ where: { key: { in: tenants.map((t) => health.domainHealthKey(t.id)) } } })
    const tIds = tenants.map((t) => t.id)
    const uIds = users.map((u) => u.id)
    await prisma.auditEvent.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { actorUserId: { in: uIds } }] } })
    await prisma.tenantNotice.deleteMany({ where: { tenantId: { in: tIds } } })
    await prisma.tenantInvite.deleteMany({ where: { tenantId: { in: tIds } } })
    await prisma.tenantMember.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: uIds } }] } })
    await prisma.tenantDomain.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { host: { in: Object.values(D) } }] } })
    await prisma.tenant.deleteMany({ where: { OR: [{ id: { in: tIds } }, { name: 'ITEST-TENANT-dom-bad' }] } })
    await prisma.user.deleteMany({ where: { id: { in: uIds } } })
    setChannelsMode('dormant')
  }
}

main()
  .then(async () => {
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail ? 1 : 0)
  })
  .catch(async (e) => {
    console.error(e)
    summary()
    await prisma.$disconnect()
    process.exit(1)
  })
