/**
 * 短信接码 · S1 目录与定价 —— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §11 S1 验收、§12.2 中 S1 能覆盖的部分。
 *
 *   set -a; . ./.env.local; set +a; npx tsx scripts/itest-jiema-catalog.ts
 *
 * ⚠️ 只能对一次性的本地库跑（库名须含 dev / test，由 itest-tenant/_harness 把关）。**不调用真实 hero-sms**：
 * 上游一律是本地假服务（scripts/mock-herosms.ts，只绑 127.0.0.1）；企业微信推送打到本地假 webhook。
 * 接口在进程内调用（harness 的 withRequest / callRoute，与 itest-tenant 同一套），不用起 next dev。
 * sms_* 五张表与 sms_config / sms_catalog_at / sms_operator_names 三行在开始时存档、结束时原样恢复。
 *
 * 覆盖：
 *   · 目录同步：full 不进目录；上游服务与国家/地区**全部 ON**（微信、QQ、支付宝、PayPal、银行、币安、Coinbase、中国 +86 都在，D25、§12.2 第 122 条）；
 *     55 / 14 / 20 →「中国台湾 / 中国香港 / 中国澳门」、台湾无旗帜（D44）；种子只填空字段、按上游英文名核对；首次同步初始化热门；
 *     getPrices 只写 hash 变了的行（第二趟 changed=0）；热门服务的第 ② 层预热；没货的服务 404 → 空行；
 *     后台手动下架 wb（填原因、写审计）→ 目录不再返回 → 下一次同步不改回 ON → 重新上架恢复；55 的中文名改不动
 *   · 三种手动停售都生效、出厂都为空（服务 / 国家 status=OFF、disabled 规则、sms_holds 的 ADMIN 停售），global → 维护
 *   · 接口：渠道 Host 三个接口一律 404；灰度期普通用户 / 匿名 503「即将开放」、管理员预览（private, no-store）；
 *     响应里搜不到 cost / cap / 两个系数 / 加价 / 覆盖规则；sms_config 坏了（只有两个字段）→ 管理员也 503、canUseForJiema=false
 *   · 匿名不触发上游（503 路径与目录快照都不打上游；触发规则 refreshTriggerAllowed 只放行登录用户）；登录用户看过期的服务 → 后台刷新、单飞
 *   · 列表价 = 下单价：同一组合的 GET /api/jiema/catalog/[service] 价格与 quote()（第 ③ 层实时报价）相同（到分 / 到角 / 最低售价 / 覆盖规则 y）
 *   · 0.8 规则：dr:187 配 y=¥4.40 → ¥9.68 ≥「Codex 美区」¥12.00 × 0.8；预览数据带旧单品对照
 *   · 受众为仅管理员 / S2 之前：前台外壳下发 jiemaOpen=false、sitemap 没有 /jiema；保存「全部用户」被拒
 *   · 后台接口：adminGuard（普通用户 403）、配置保存（x < 成本汇率要二次确认、乐观并发）、规则 / 服务 / 国家 / 停售 / 运营商显示名的校验与审计
 *   · getPrices 连续失败 3 次 → 降级（有 offers 的照常、其余「起价以实际为准」）+ 推送；目录超过 60 分钟没同步成功 → sms.alert
 *   · cron 路由：没有密钥拒绝、有密钥跑一趟
 */
import http from 'http'
import React from 'react'
import {
  prisma as hp,
  check,
  section,
  summary,
  setChannelsMode,
  signTestToken,
  withRequest,
  callRoute,
  ensurePlatformTenant,
  createTenant,
  createUser,
  cleanupAll,
  NAME_PREFIX,
  type RouteFn,
} from './itest-tenant/_harness'
import { startMockHeroSms, type MockHandle } from './mock-herosms'

// 仓库 tsconfig 是 jsx: preserve，tsx 按经典运行时编译 JSX（React.createElement），调前台外壳需要全局 React（同 itest-tenant/wp1.ts）
;(globalThis as unknown as { React: typeof React }).React = React

const MAIN_HOST = 'bigolab.com'
const KEY = 'itest-jiema-s1-key'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const SERVICES = [
  { code: 'full', name: 'Full rent' },
  { code: 'wa', name: 'Whatsapp' },
  { code: 'tg', name: 'Telegram' },
  { code: 'go', name: 'Google,youtube,Gmail' },
  { code: 'ig', name: 'Instagram+Threads' },
  { code: 'dr', name: 'OpenAI' },
  { code: 'acz', name: 'Claude ' },
  { code: 'wx', name: 'Apple' },
  { code: 'lf', name: 'TikTok/Douyin' },
  { code: 'wb', name: 'WeChat' },
  { code: 'qq', name: 'Tencent QQ' },
  { code: 'hw', name: 'Alipay/Alibaba/1688' },
  { code: 'kf', name: 'Weibo' },
  { code: 'ts', name: 'PayPal' },
  { code: 'md', name: 'Banks' },
  { code: 'aon', name: 'Binance' },
  { code: 're', name: 'Coinbase' },
  { code: 'dy', name: 'Zomato' },
  { code: 'ds', name: 'Discord' },
  { code: 'ot', name: 'Any other' },
]
const COUNTRIES: Record<number, { eng: string; rus: string; chn: string }> = {
  3: { eng: 'China', rus: 'Китай', chn: '中国' },
  4: { eng: 'Philippines', rus: 'Филиппины', chn: '菲律宾' },
  6: { eng: 'Indonesia', rus: 'Индонезия', chn: '印度尼西亚' },
  14: { eng: 'Hong Kong', rus: 'Гонконг', chn: '香港' },
  16: { eng: 'United Kingdom', rus: 'Великобритания', chn: '英格兰' },
  20: { eng: 'Macao', rus: 'Макао', chn: '澳门' },
  48: { eng: 'Netherlands', rus: 'Нидерланды', chn: '荷兰' },
  52: { eng: 'Thailand', rus: 'Таиланд', chn: '泰国' },
  55: { eng: 'Taiwan', rus: 'Тайвань', chn: '台湾' },
  158: { eng: 'Bhutan', rus: 'Бутан', chn: '丁烷' },
  187: { eng: 'USA', rus: 'США', chn: '美国（物理)' },
}
const PRICES: Record<string, { usd: number; stock: number; defaultCount?: number; tiers?: Array<[number, number]> }> = {
  'ot:6': { usd: 0.024, stock: 330_000 },
  'ot:187': { usd: 0.6, stock: 1000 },
  'dr:187': { usd: 0.66, stock: 1000 },
  'dr:16': { usd: 0.045, stock: 160_000, defaultCount: 63, tiers: [[0.045, 79_335], [0.06, 120_000]] },
  'dr:4': { usd: 0.025, stock: 50 },
  'acz:187': { usd: 0.3, stock: 1000 },
  'acz:48': { usd: 0.06, stock: 1000 },
  'tg:6': { usd: 0.15, stock: 5000 },
  'tg:48': { usd: 0.9, stock: 1000, defaultCount: 0, tiers: [[1.0483, 204], [1.1593, 793], [2.4831, 46_024]] },
  'tg:55': { usd: 0.3, stock: 800 },
  'go:14': { usd: 0.2, stock: 900 },
  'lf:20': { usd: 0.1, stock: 90 },
  'wb:3': { usd: 0.5, stock: 1000 },
  'wb:6': { usd: 0.4, stock: 100 },
  'qq:3': { usd: 0.3, stock: 1000 },
  'hw:3': { usd: 0.35, stock: 1000 },
  'kf:3': { usd: 0.2, stock: 1000 },
  'ts:187': { usd: 0.8, stock: 1000 },
  'md:187': { usd: 1.2, stock: 1000 },
  'aon:187': { usd: 0.9, stock: 1000 },
  're:187': { usd: 0.7, stock: 1000 },
  'ds:52': { usd: 0.01, stock: 1000 },
  'wa:6': { usd: 0.21, stock: 1000 },
}
const OPERATORS = { '6': ['axis', 'byu', 'indosat', 'telkomsel'], '187': ['at_t', 'tmobile', 'verizon', 'some_new_op'], '3': ['china_mobile'] }

const SMS_TABLES = ['sms_services', 'sms_countries', 'sms_offer_cache', 'sms_price_rules', 'sms_holds'] as const
const KEEP_SETTINGS = ['sms_config', 'sms_catalog_at', 'sms_operator_names']

async function main() {
  // ---- 假企业微信 webhook ----
  const bodies: string[] = []
  const hook = http.createServer((req, res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      bodies.push(b)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"errcode":0}')
    })
  })
  await new Promise<void>((r) => hook.listen(0, '127.0.0.1', () => r()))
  for (const k of ['ORDER_MSG_WEBHOOK_URL', 'NOTIFY_EVENTS']) delete process.env[k]
  process.env.WECOM_WEBHOOK_URL = `http://127.0.0.1:${(hook.address() as { port: number }).port}/cgi-bin/webhook/send?key=itest`
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'itest-cron-secret-jiema'

  // ---- 假 hero-sms ----
  const mock: MockHandle = await startMockHeroSms({ key: KEY, config: { services: SERVICES, countries: COUNTRIES, prices: PRICES, operators: OPERATORS } })
  process.env.HEROSMS_BASE = mock.baseUrl
  process.env.HEROSMS_V1_BASE = mock.v1Url
  process.env.HEROSMS_API_KEY = KEY

  const up = await import('../src/lib/jiema/upstream')
  const catalog = await import('../src/lib/jiema/catalog')
  const jcfg = await import('../src/lib/jiema/config')
  const admin = await import('../src/lib/jiema/admin')
  const alert = await import('../src/lib/jiema/alert')
  const schema = await import('../src/lib/jiema-config-schema')
  const walletCfg = await import('../src/lib/wallet/config')
  const { FORBIDDEN_BUYER_KEYS, collectKeyNames } = await import('../src/lib/jiema/dto')
  const { FACTORY_SMS_CONFIG } = schema
  up.resetUpstreamStateForTest()

  // ---- 存档：五张表与三行设置 ----
  const saved: Record<string, unknown[]> = {}
  for (const t of SMS_TABLES) saved[t] = await hp.$queryRawUnsafe(`SELECT * FROM ${t}`)
  const savedSettings = await hp.setting.findMany({ where: { key: { in: KEEP_SETTINGS } } })
  const savedWallet = await hp.setting.findUnique({ where: { key: 'wallet_config' } })
  const wipe = async () => {
    for (const t of SMS_TABLES) await hp.$executeRawUnsafe(`DELETE FROM ${t}`)
    await hp.setting.deleteMany({ where: { key: { in: KEEP_SETTINGS } } })
  }
  const resetCaches = () => {
    catalog.resetCatalogCachesForTest()
    jcfg.invalidateSmsConfigCache()
  }
  const setCfg = async (over: Partial<import('../src/lib/jiema-config-schema').SmsConfig> | string) => {
    const value = typeof over === 'string' ? over : JSON.stringify({ ...FACTORY_SMS_CONFIG, ...over })
    await hp.setting.upsert({ where: { key: 'sms_config' }, create: { key: 'sms_config', value }, update: { value } })
    resetCaches()
  }
  const readCfg = async () => {
    const r = await jcfg.readSmsConfig()
    if (!r.ok) throw new Error('sms_config 读不到')
    return r.config
  }

  let failedHard = false
  try {
    await cleanupAll()
    await wipe()
    await ensurePlatformTenant()
    setChannelsMode('observe')
    const lulu = await createTenant('l')
    const adminU = await createUser('jm-admin', { role: 'ADMIN' })
    const buyer = await createUser('jm-buyer')
    const tAdmin = signTestToken(adminU, 'main')
    const tBuyer = signTestToken(buyer, 'main')
    // 出厂配置用部署种子写（scripts/ops/jiema-s1-seed.sql 的 INSERT；可重复执行）
    const seedSql = (await import('fs')).readFileSync((await import('path')).join(__dirname, 'ops', 'jiema-s1-seed.sql'), 'utf8')
    const insertAt = seedSql.indexOf('INSERT INTO settings')
    const insert = seedSql.slice(insertAt, seedSql.indexOf(';', insertAt))
    await hp.$executeRawUnsafe(insert)
    await hp.$executeRawUnsafe(insert)
    resetCaches()
    const seeded = await jcfg.readSmsConfig()
    check('部署种子：执行两次只有 1 行，读出来 = 出厂值（总开关关、仅管理员）', (await hp.setting.count({ where: { key: 'sms_config' } })) === 1 && seeded.ok && JSON.stringify(seeded.config) === JSON.stringify(FACTORY_SMS_CONFIG))

    const routes = {
      catalog: (await import('../src/app/api/jiema/catalog/route')) as unknown as { GET: RouteFn },
      service: (await import('../src/app/api/jiema/catalog/[service]/route')) as unknown as { GET: RouteFn },
      operators: (await import('../src/app/api/jiema/catalog/[service]/[country]/operators/route')) as unknown as { GET: RouteFn },
      cron: (await import('../src/app/api/cron/jiema-catalog/route')) as unknown as { GET: RouteFn },
      aConfig: (await import('../src/app/api/admin/jiema/config/route')) as unknown as { GET: RouteFn; PUT: RouteFn },
      aRules: (await import('../src/app/api/admin/jiema/rules/route')) as unknown as { GET: RouteFn; POST: RouteFn },
      aRule: (await import('../src/app/api/admin/jiema/rules/[id]/route')) as unknown as { PUT: RouteFn; DELETE: RouteFn },
      aService: (await import('../src/app/api/admin/jiema/services/[code]/route')) as unknown as { PUT: RouteFn },
      aServices: (await import('../src/app/api/admin/jiema/services/route')) as unknown as { GET: RouteFn; POST: RouteFn },
      aCountry: (await import('../src/app/api/admin/jiema/countries/[id]/route')) as unknown as { PUT: RouteFn },
      aHolds: (await import('../src/app/api/admin/jiema/holds/route')) as unknown as { GET: RouteFn; POST: RouteFn; DELETE: RouteFn },
      aPricing: (await import('../src/app/api/admin/jiema/pricing/route')) as unknown as { GET: RouteFn },
      aOps: (await import('../src/app/api/admin/jiema/operators/route')) as unknown as { GET: RouteFn; PUT: RouteFn },
      aOverview: (await import('../src/app/api/admin/jiema/overview/route')) as unknown as { GET: RouteFn },
      aCatalog: (await import('../src/app/api/admin/jiema/catalog/route')) as unknown as { GET: RouteFn; POST: RouteFn },
    }
    const asAdmin = { host: MAIN_HOST, token: tAdmin, headers: { origin: `https://${MAIN_HOST}`, 'sec-fetch-site': 'same-origin' } }
    const asBuyer = { host: MAIN_HOST, token: tBuyer, headers: { origin: `https://${MAIN_HOST}`, 'sec-fetch-site': 'same-origin' } }
    const anon = { host: MAIN_HOST }
    const offersCalls = () => mock.log.filter((l) => l.action === 'v1:offers').length

    // =====================================================================
    section('目录同步：第一趟（静态目录 + getPrices + 预热热门）')
    const j1 = await catalog.runCatalogJob({ now: new Date() })
    check('跑了一趟，静态目录成功', j1.ran && !!j1.static?.ok, JSON.stringify(j1.static?.errors))
    const svcRows = await hp.smsService.findMany()
    const codes = new Set(svcRows.map((s) => s.code))
    check('full（租号）不进 sms_services', !codes.has('full') && codes.size === SERVICES.length - 1, Array.from(codes).join(','))
    check('上游服务全部 ON（D25：微信、QQ、支付宝、微博、PayPal、银行、币安、Coinbase 都在）', svcRows.every((s) => s.status === 'ON') && ['wb', 'qq', 'hw', 'kf', 'ts', 'md', 'aon', 're'].every((c) => codes.has(c)))
    const cty = await hp.smsCountry.findMany()
    const cBy = new Map(cty.map((c) => [c.id, c]))
    check('国家/地区全部 ON，含中国 +86', cty.every((c) => c.status === 'ON') && cBy.get(3)?.nameCn === '中国' && cBy.get(3)?.dialCode === '86')
    check('55 / 14 / 20 →「中国台湾 / 中国香港 / 中国澳门」（D44）', cBy.get(55)?.nameCn === '中国台湾' && cBy.get(14)?.nameCn === '中国香港' && cBy.get(20)?.nameCn === '中国澳门')
    check('上游 chn 字段不用（158 不丹不写成「丁烷」、187 不写成「美国（物理)」）', cBy.get(158)?.nameCn === '不丹' && cBy.get(187)?.nameCn === '美国')
    const sv = new Map(svcRows.map((s) => [s.code, s]))
    check('种子：wb 中文名「微信」、别名含 wx；wx（Apple）是「苹果（Apple ID）」且别名不含 wx', sv.get('wb')?.nameCn === '微信' && (sv.get('wb')?.aliases ?? '').split(',').includes('wx') && sv.get('wx')?.nameCn === '苹果（Apple ID）' && !(sv.get('wx')?.aliases ?? '').split(',').includes('wx'))
    check('acz 英文名去掉尾部空格；dy（Zomato）没有种子', sv.get('acz')?.nameEn === 'Claude' && sv.get('dy')?.nameCn == null)
    check('首次同步按 sms_config.hotServices 初始化热门（dr=1、acz=2、tg=3）', sv.get('dr')?.hotRank === 1 && sv.get('acz')?.hotRank === 2 && sv.get('tg')?.hotRank === 3 && sv.get('wb')?.hotRank == null)
    const pricesRows = await hp.smsOfferCache.count({ where: { kind: 'PRICES' } })
    check('第 ① 层：有货的服务各一行', pricesRows === new Set(Object.keys(PRICES).map((k) => k.split(':')[0])).size, String(pricesRows))
    const offersRows = await hp.smsOfferCache.findMany({ where: { kind: 'OFFERS' }, select: { service: true, data: true } })
    check('第 ② 层：热门服务预热（dr、tg、ot…）', ['dr', 'acz', 'tg', 'wa', 'go', 'ig', 'wx', 'ds', 'ot'].every((c) => offersRows.some((o) => o.service === c)))
    const igRow = offersRows.find((o) => o.service === 'ig')
    check('没货的热门服务（ig）上游 404 → 空行（全部售罄，不是「还没有数据」）', !!igRow && JSON.parse(igRow.data).countries && Object.keys(JSON.parse(igRow.data).countries).length === 0)
    check('运营商（OPS）与例外时长（DUR）已缓存', (await hp.smsOfferCache.count({ where: { service: '*', kind: { in: ['OPS', 'DUR'] } } })) === 2)
    const st1 = await jcfg.readCatalogState()
    check('sms_catalog_at：catalogAt / staticAt / pricesAt 都有、hotInit、counts', !!st1.catalogAt && !!st1.staticAt && !!st1.pricesAt && st1.hotInit && st1.counts?.combos === Object.keys(PRICES).length && st1.pricesFails === 0)

    section('目录同步：第二趟（hash 没变不写；静态目录不到点不跑）')
    const j2 = await catalog.runCatalogJob({ warm: false, now: new Date() })
    check('第 ① 层 changed=0、静态目录没跑', j2.ran && j2.changed === 0 && !j2.static)
    mock.config.prices['wb:3'] = { usd: 0.55, stock: 1000 }
    const j3 = await catalog.runCatalogJob({ warm: false, now: new Date() })
    check('上游价格变了 → 只写那一个服务（changed=1）', j3.changed === 1)
    delete mock.config.prices['kf:3']
    const j4 = await catalog.runCatalogJob({ warm: false, now: new Date() })
    const kfRow = await hp.smsOfferCache.findUnique({ where: { service_kind: { service: 'kf', kind: 'PRICES' } } })
    check('上游不再报价的服务 → 写成空对象（不留旧库存）', j4.changed === 1 && kfRow?.data === '{}')
    mock.config.prices['kf:3'] = { usd: 0.2, stock: 1000 }

    // =====================================================================
    section('接口：渠道 Host 一律 404（D11）')
    for (const [name, r, params, path] of [
      ['catalog', routes.catalog.GET, {}, '/api/jiema/catalog'],
      ['catalog/[service]', routes.service.GET, { service: 'tg' }, '/api/jiema/catalog/tg'],
      ['operators', routes.operators.GET, { service: 'tg', country: '6' }, '/api/jiema/catalog/tg/6/operators'],
    ] as const) {
      const res = await callRoute(r, { host: lulu.host, token: tAdmin, path, params })
      check(`渠道 Host GET ${name} → 404 JSON`, res.status === 404 && res.json?.error === '资源不存在', `${res.status}`)
    }

    section('接口：灰度期（出厂：总开关关、仅管理员）')
    const a1 = await callRoute(routes.catalog.GET, { ...anon, path: '/api/jiema/catalog' })
    const b1 = await callRoute(routes.catalog.GET, { ...asBuyer, path: '/api/jiema/catalog' })
    check('匿名 → 503「短信接码即将开放」', a1.status === 503 && a1.json?.code === 'MAINTENANCE' && a1.json?.soon === true && a1.json?.error === '短信接码即将开放')
    check('普通用户 → 503', b1.status === 503)
    const before = offersCalls()
    for (let i = 0; i < 20; i++) await callRoute(routes.service.GET, { ...anon, path: '/api/jiema/catalog/wb', params: { service: 'wb' } })
    check('匿名 20 次请求国家列表：一次上游都不打', offersCalls() === before)
    const ad = await withRequest(asAdmin, async () => {
      const req = new (await import('next/server')).NextRequest(`http://${MAIN_HOST}/api/jiema/catalog`, { headers: { cookie: `token=${tAdmin}`, host: MAIN_HOST } })
      const res = await routes.catalog.GET(req, { params: {} })
      return { status: res.status, cc: res.headers.get('cache-control'), json: await res.json() }
    })
    check('管理员 → 200 预览（private, no-store）', ad.status === 200 && ad.json?.data?.preview === true && ad.cc === 'private, no-store', `${ad.status} ${ad.cc}`)
    const list = ad.json?.data?.services as Array<{ code: string; fromCents: number | null; approx: boolean; level: string; name: string; aliases: string[] }>
    const L = new Map(list.map((s) => [s.code, s]))
    check('目录：没有 full；微信、支付宝、PayPal、币安、银行都在可售目录里', !L.has('full') && ['wb', 'hw', 'ts', 'aon', 'md', 're', 'qq'].every((c) => L.get(c)?.level === 'OK'))
    check('anyOther 是「其他服务」', ad.json?.data?.anyOther?.code === 'ot' && ad.json?.data?.anyOther?.name === '其他服务')
    const keys = collectKeyNames(ad.json)
    check('目录响应里搜不到 cost / cap / 两个系数 / 加价 / 覆盖规则', FORBIDDEN_BUYER_KEYS.filter((k) => keys.has(k)).length === 0, FORBIDDEN_BUYER_KEYS.filter((k) => keys.has(k)).join(','))
    check('有 offers 的服务「¥x 起」（dr：$0.025 → ¥1.70），只有 getPrices 的写「约」（wb：印尼 $0.4 → ¥4.70）', L.get('dr')?.fromCents === 170 && L.get('dr')?.approx === false && L.get('wb')?.approx === true && L.get('wb')?.fromCents === 470, `dr=${L.get('dr')?.fromCents} wb=${L.get('wb')?.fromCents}/${L.get('wb')?.approx}`)
    check('没货的服务（ig）→ OUT（暂无号码）', L.get('ig')?.level === 'OUT' && L.get('ig')?.fromCents === null)

    const svcRes = await callRoute(routes.service.GET, { ...asAdmin, path: '/api/jiema/catalog/tg', params: { service: 'tg' } })
    const tgC = new Map((svcRes.json?.data?.countries as Array<{ id: number; name: string; flag: string | null; priceCents: number; level: string; stock: number | null; tags: string[] }>).map((c) => [c.id, c]))
    check('tg 国家列表：中国台湾（无旗帜）、印度尼西亚有旗帜', tgC.get(55)?.name === '中国台湾' && tgC.get(55)?.flag === null && tgC.get(6)?.flag === 'id')
    check('tg/48：defaultPrice=0 按最低有货档报价（$1.0483 → ¥9.89）、库存取 cap（$1.3041）内的档位里最大的（793 → 较多）', tgC.get(48)?.priceCents === 989 && tgC.get(48)?.stock === 793 && tgC.get(48)?.level === 'MANY', JSON.stringify(tgC.get(48)))
    check('stockKnown=true、有推荐排序、durationMin=20', svcRes.json?.data?.stockKnown === true && Array.isArray(svcRes.json?.data?.sort?.recommended) && svcRes.json.data.sort.recommended.length === tgC.size && svcRes.json?.data?.durationMin === 20)
    const keys2 = collectKeyNames(svcRes.json)
    check('国家列表响应里同样搜不到被禁止的字段', FORBIDDEN_BUYER_KEYS.filter((k) => keys2.has(k)).length === 0)
    const drRes = await callRoute(routes.service.GET, { ...asAdmin, path: '/api/jiema/catalog/dr', params: { service: 'dr' } })
    const drC = new Map((drRes.json?.data?.countries as Array<{ id: number; stock: number | null; level: string; priceCents: number }>).map((c) => [c.id, c]))
    check('dr/16：库存按 min(defaultPrice, cap 内最大累计值) = 63 → 紧张（不是 getPrices 的 16 万）', drC.get(16)?.stock === 63 && drC.get(16)?.level === 'LOW')
    const wbRes = await callRoute(routes.service.GET, { ...asAdmin, path: '/api/jiema/catalog/wb', params: { service: 'wb' } })
    const wbC = new Map((wbRes.json?.data?.countries as Array<{ id: number; stock: number | null; level: string; priceCents: number; approx: boolean }>).map((c) => [c.id, c]))
    check('wb（只有第 ① 层）：中国 +86 在列表里、只显示「有货」、不给约数、没有推荐排序', wbC.get(3)?.level === 'AVAILABLE' && wbC.get(3)?.stock === null && wbC.get(3)?.approx === true && wbRes.json?.data?.stockKnown === false && wbRes.json.data.sort.recommended.length === 0)

    section('登录用户看过期 / 没有 offers 的服务 → 后台刷新（单飞），匿名不触发')
    check('refreshTriggerAllowed：匿名永远 false、登录用户数据过期才 true', !catalog.refreshTriggerAllowed(true, null) && catalog.refreshTriggerAllowed(true, adminU.id) && !catalog.refreshTriggerAllowed(false, adminU.id))
    // 上面管理员看 wb（没有 OFFERS 行）已经触发了一次后台刷新
    for (let i = 0; i < 40 && !(await hp.smsOfferCache.findUnique({ where: { service_kind: { service: 'wb', kind: 'OFFERS' } } }))?.hash; i++) await sleep(250)
    const wbOffers = await hp.smsOfferCache.findUnique({ where: { service_kind: { service: 'wb', kind: 'OFFERS' } } })
    check('管理员（登录）看 wb → 后台拉到了第 ② 层', !!wbOffers?.hash && JSON.parse(wbOffers.data).countries['3'] != null)
    const [r1, r2] = await Promise.all([catalog.refreshOffers('go'), catalog.refreshOffers('go')])
    check('两个并发刷新同一个服务：一个做、一个 BUSY（refreshingAt 单飞）', [r1, r2].sort().join(',') === 'BUSY,OK', `${r1},${r2}`)

    section('运营商（§1.7）')
    const ops = await callRoute(routes.operators.GET, { ...asAdmin, path: '/api/jiema/catalog/dr/187/operators', params: { service: 'dr', country: '187' } })
    const opn = new Map((ops.json?.data?.operators as Array<{ code: string; name: string }>).map((o) => [o.code, o.name]))
    check('显示名：出厂映射（AT&T、T-Mobile）、没有映射的首字母大写（Some New Op）', opn.get('at_t') === 'AT&T' && opn.get('tmobile') === 'T-Mobile' && opn.get('some_new_op') === 'Some New Op')
    const ops52 = await callRoute(routes.operators.GET, { ...asAdmin, path: '/api/jiema/catalog/ds/52/operators', params: { service: 'ds', country: '52' } })
    check('没有运营商数据的国家 → 空数组（页面不出现「运营商」）', ops52.status === 200 && ops52.json?.data?.operators?.length === 0)
    const opsPut = await callRoute(routes.aOps.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/operators', body: { names: { at_t: 'AT&T（美国）' } } })
    const ops2 = await callRoute(routes.operators.GET, { ...asAdmin, path: '/api/jiema/catalog/dr/187/operators', params: { service: 'dr', country: '187' } })
    check('后台改显示名 → 以后台为准；写审计', opsPut.status === 200 && ops2.json?.data?.operators.find((o: { code: string }) => o.code === 'at_t')?.name === 'AT&T（美国）' && (await hp.auditEvent.count({ where: { action: 'jiema.operators', actorUserId: adminU.id } })) === 1)
    const opsBad = await callRoute(routes.aOps.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/operators', body: { names: { 'AT T!': 'x' } } })
    check('非法运营商代码 → 400', opsBad.status === 400)

    // =====================================================================
    section('列表价 = 下单价（§12.1 第 99 条的集成版；第 ③ 层实时报价走假上游）')
    const cfg0 = await readCfg()
    const listPrice = async (svc: string, cid: number) => {
      catalog.invalidateCatalogSnapshot()
      const r = await catalog.catalogCountries(svc, await readCfg())
      return r?.countries.find((c) => c.id === cid)?.priceCents ?? null
    }
    const q1 = await catalog.quote('dr', 187, cfg0)
    check('到分：dr/187 列表价 = 报价 = ¥6.78（没有规则）', q1.ok && q1.priceCents === 678 && (await listPrice('dr', 187)) === 678, JSON.stringify(q1))
    const ruleRes = await callRoute(routes.aRules.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/rules', body: { scopeKey: 'dr:187', markupCents: 440, note: '单品「Codex 美区」¥12.00 × 0.8 = ¥9.60' } })
    check('后台新增覆盖规则 dr:187 y=¥4.40（写审计）', ruleRes.status === 200 && (await hp.auditEvent.count({ where: { action: 'jiema.rule.create', targetId: 'dr:187' } })) === 1, ruleRes.text.slice(0, 120))
    catalog.resetCatalogCachesForTest()
    const q2 = await catalog.quote('dr', 187, await readCfg())
    check('覆盖规则 y：列表价 = 报价 = ¥9.68（≥ ¥12.00 × 0.8）', q2.ok && q2.priceCents === 968 && (await listPrice('dr', 187)) === 968 && q2.ok && q2.ruleKey === 'dr:187' && q2.capMicro === 825_000)
    await setCfg({ rounding: 'JIAO' })
    catalog.resetCatalogCachesForTest()
    const q3 = await catalog.quote('ot', 6, await readCfg())
    check('到角：ot/6 列表价 = 报价 = ¥1.70（170 已是整角）；dr/187 968 → 970', q3.ok && q3.priceCents === 170 && (await listPrice('ot', 6)) === 170 && (await listPrice('dr', 187)) === 970)
    await setCfg({ markupCents: 30 })
    catalog.resetCatalogCachesForTest()
    const q4 = await catalog.quote('ds', 52, await readCfg())
    check('最低售价兜底：ds/52 $0.01 + y ¥0.30 = 38 分 → ¥1.00（列表价 = 报价）', q4.ok && q4.priceCents === 100 && (await listPrice('ds', 52)) === 100)
    await setCfg({})
    catalog.resetCatalogCachesForTest()
    const q5 = await catalog.quote('ig', 6, await readCfg())
    check('没货的组合报价 → SOLD_OUT（并把第 ② 层标脏）', !q5.ok && q5.code === 'SOLD_OUT')

    section('0.8 规则（D13、Q1）：定价页预览带旧单品对照')
    const cat = await hp.category.create({ data: { name: `${NAME_PREFIX}-jiema`, sortOrder: 1, status: 1 } })
    await hp.product.create({ data: { categoryId: cat.id, name: `${NAME_PREFIX} Codex 美区`, price: '12.00', stock: -1, status: 1, deliveryType: 'SMS', smsService: 'dr', smsCountry: '187' } })
    await hp.product.create({ data: { categoryId: cat.id, name: `${NAME_PREFIX} Codex 随机地区`, price: '8.00', stock: -1, status: 1, deliveryType: 'SMS', smsService: 'dr', smsCountry: null } })
    const pv = await callRoute(routes.aPricing.GET, { ...asAdmin, path: '/api/admin/jiema/pricing' })
    const pvRows = pv.json?.data?.rows as Array<{ service: string; country: number; costMicro: number; legacy: { priceCents: number } | null }>
    const drUs = pvRows?.find((r) => r.service === 'dr' && r.country === 187)
    const drPh = pvRows?.find((r) => r.service === 'dr' && r.country === 4)
    check('预览：dr/187 带「Codex 美区」¥12.00（同国家的 12.00 与随机地区的 8.00 取高）', drUs?.legacy?.priceCents === 1200 && drUs.costMicro === 660_000)
    check('  …dr/菲律宾 只对照随机地区单品 ¥8.00', drPh?.legacy?.priceCents === 800)
    const { resolveRule, priceCombo, meetsLegacyRatio } = await import('../src/lib/jiema/pricing')
    const rulesNow = pv.json?.data?.rules as Array<{ scopeKey: string; markupCents: number | null; tolerancePct: number | null; disabled: boolean }>
    const cfgNow = await readCfg()
    const newPrice = (s: string, c: number, cost: number) => priceCombo(cost, resolveRule(rulesNow, s, c, cfgNow), { ...cfgNow })!.priceCents
    check('  …前端用同一个纯函数算：dr/187 ¥9.68 ✓（≥ ¥9.60）', meetsLegacyRatio(newPrice('dr', 187, drUs!.costMicro), 1200))
    check('  …dr/菲律宾 ¥1.70 ✗（< ¥8.00 × 0.8，要站长再配规则）', !meetsLegacyRatio(newPrice('dr', 4, drPh!.costMicro), 800))
    const pvAll = await callRoute(routes.aPricing.GET, { ...asAdmin, path: '/api/admin/jiema/pricing?service=dr' })
    check('?service=dr → 这个服务的全部国家/地区', (pvAll.json?.data?.rows as unknown[]).length === 3)

    // =====================================================================
    section('三种手动停售（出厂都为空）+ global；§12.2 第 122 条的目录部分')
    const ov0 = await callRoute(routes.aOverview.GET, { ...asAdmin, path: '/api/admin/jiema/overview' })
    check('概览：手动下架 0 个服务、0 个国家、手动停售 0 条、disabled 规则 0 条（出厂都为空）', ov0.json?.data?.manual?.servicesOff === 0 && ov0.json?.data?.manual?.countriesOff === 0 && ov0.json?.data?.manual?.adminHolds === 0 && ov0.json?.data?.manual?.disabledRules === 0)
    const offNoNote = await callRoute(routes.aService.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/services/wb', params: { code: 'wb' }, body: { status: 'OFF' } })
    check('手动下架不填原因 → 400', offNoNote.status === 400 && offNoNote.json?.field === 'offNote')
    const off = await callRoute(routes.aService.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/services/wb', params: { code: 'wb' }, body: { status: 'OFF', offNote: 'itest 运维下架' } })
    check('手动下架 wb（填原因）→ 审计 jiema.service.off', off.status === 200 && (await hp.auditEvent.count({ where: { action: 'jiema.service.off', targetId: 'wb' } })) === 1)
    catalog.resetCatalogCachesForTest()
    const snapOff = await catalog.catalogSnapshot(await readCfg())
    check('目录不再返回 wb；国家列表接口 404', !snapOff.services.some((s) => s.code === 'wb') && (await callRoute(routes.service.GET, { ...asAdmin, path: '/api/jiema/catalog/wb', params: { service: 'wb' } })).status === 404)
    await catalog.runCatalogJob({ forceStatic: true, warm: false })
    check('下一次目录同步不改回 ON', (await hp.smsService.findUnique({ where: { code: 'wb' } }))?.status === 'OFF')
    await callRoute(routes.aService.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/services/wb', params: { code: 'wb' }, body: { status: 'ON' } })
    catalog.resetCatalogCachesForTest()
    check('重新上架后恢复（原因清空）', (await catalog.catalogSnapshot(await readCfg())).services.some((s) => s.code === 'wb') && (await hp.smsService.findUnique({ where: { code: 'wb' } }))?.offNote === null)
    const nameEdit = await callRoute(routes.aService.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/services/dy', params: { code: 'dy' }, body: { nameCn: 'Zomato 外卖', aliases: 'zomato,外卖' } })
    await catalog.runCatalogJob({ forceStatic: true, warm: false })
    check('后台改的中文名 / 别名，之后的同步不覆盖', nameEdit.status === 200 && (await hp.smsService.findUnique({ where: { code: 'dy' } }))?.nameCn === 'Zomato 外卖')
    const tw = await callRoute(routes.aCountry.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/countries/55', params: { id: '55' }, body: { nameCn: 'Taiwan' } })
    check('55 的中文名后台改不动（D44）', tw.status === 400 && (await hp.smsCountry.findUnique({ where: { id: 55 } }))?.nameCn === '中国台湾')
    const cOff = await callRoute(routes.aCountry.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/countries/3', params: { id: '3' }, body: { status: 'OFF', offNote: 'itest' } })
    catalog.resetCatalogCachesForTest()
    const wbNo3 = await catalog.catalogCountries('wb', await readCfg())
    check('国家手动下架 → 所有服务的国家列表里都没有它', cOff.status === 200 && !wbNo3?.countries.some((c) => c.id === 3))
    await callRoute(routes.aCountry.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/countries/3', params: { id: '3' }, body: { status: 'ON' } })
    const dis = await callRoute(routes.aRules.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/rules', body: { scopeKey: 'wb:*', disabled: true, note: 'itest 停售' } })
    catalog.resetCatalogCachesForTest()
    const wbDis = await catalog.catalogCountries('wb', await readCfg())
    const snapDis = await catalog.catalogSnapshot(await readCfg())
    check('disabled 规则 wb:* → 国家列表全部「暂停销售」、起价为空', dis.status === 200 && !!wbDis?.countries.every((c) => c.paused === '暂停销售') && snapDis.services.find((s) => s.code === 'wb')?.fromCents === null)
    const disNoNote = await callRoute(routes.aRules.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/rules', body: { scopeKey: 'qq:*', disabled: true } })
    check('停售规则不写备注 → 400', disNoNote.status === 400)
    await callRoute(routes.aRule.DELETE, { ...asAdmin, method: 'DELETE', path: `/api/admin/jiema/rules/${dis.json.data.rule.id}`, params: { id: String(dis.json.data.rule.id) } })
    const hSvc = await callRoute(routes.aHolds.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/holds', body: { key: 'svc:wb', note: 'itest 手动停售' } })
    const hCty = await callRoute(routes.aHolds.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/holds', body: { key: 'country:187', note: 'itest', until: new Date(Date.now() + 3600_000).toISOString() } })
    catalog.resetCatalogCachesForTest()
    const snapHold = await catalog.catalogSnapshot(await readCfg())
    const tsC = await catalog.catalogCountries('ts', await readCfg())
    check('sms_holds 手动停售 svc:wb、country:187 → wb 起价为空、ts/187「暂停销售，暂停到 …」', hSvc.status === 200 && hCty.status === 200 && snapHold.services.find((s) => s.code === 'wb')?.fromCents === null && /^暂停销售，暂停到 \d\d:\d\d$/.test(tsC?.countries.find((c) => c.id === 187)?.paused ?? ''))
    const hBad = await callRoute(routes.aHolds.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/holds', body: { key: 'threads', note: 'x' } })
    check('threads 不能手动写（它不是停售）→ 400', hBad.status === 400)
    await callRoute(routes.aHolds.DELETE, { ...asAdmin, method: 'DELETE', path: '/api/admin/jiema/holds?key=svc:wb' })
    await callRoute(routes.aHolds.DELETE, { ...asAdmin, method: 'DELETE', path: '/api/admin/jiema/holds?key=country:187' })
    catalog.resetCatalogCachesForTest()
    check('三者都删掉后恢复', (await catalog.catalogSnapshot(await readCfg())).services.find((s) => s.code === 'wb')?.level === 'OK' && (await hp.auditEvent.count({ where: { action: { in: ['jiema.hold.create', 'jiema.hold.delete'] } } })) === 4)
    await hp.smsHold.create({ data: { key: 'global', reason: 'BREAKER', source: 'AUTO' } })
    catalog.resetCatalogCachesForTest()
    const snapG = await catalog.catalogSnapshot(await readCfg())
    const tgG = await catalog.catalogCountries('tg', await readCfg())
    check('global 停售 → 目录标维护、国家列表全部「接码服务维护中」', snapG.maintenance && !!tgG?.countries.every((c) => c.paused === '接码服务维护中，预计很快恢复'))
    await hp.smsHold.delete({ where: { key: 'global' } })
    catalog.resetCatalogCachesForTest()

    // =====================================================================
    section('配置（§5.3）：fail-closed、保存校验、对谁开放')
    await setCfg(JSON.stringify({ enabled: true, audience: 'ALL' }))
    const adBroken = await callRoute(routes.catalog.GET, { ...asAdmin, path: '/api/jiema/catalog' })
    check('sms_config 只有 enabled / audience（校验不过）→ 管理员也 503 维护中', adBroken.status === 503 && adBroken.json?.error === '接码服务维护中，预计很快恢复')
    await hp.setting.upsert({ where: { key: 'wallet_config' }, create: { key: 'wallet_config', value: JSON.stringify(walletCfg.FACTORY_WALLET_CONFIG) }, update: {} })
    check('  …canUseForJiema=false（S1 收口 B0 的已知限制）', (await walletCfg.canUseForJiema()) === false)
    await setCfg({ enabled: true, audience: 'ALL' })
    check('整份有效、enabled + ALL（手改库），但 S2 之前 → 仍不对全部用户开放', schema.JIEMA_ORDER_AVAILABLE === false && !schema.jiemaPublicOpen(await readCfg()) && (await walletCfg.canUseForJiema()) === false)
    const a2 = await callRoute(routes.catalog.GET, { ...anon, path: '/api/jiema/catalog' })
    check('  …匿名仍 503', a2.status === 503)
    // 前台外壳与 sitemap
    const ShopLayout = (await import('../src/app/(shop)/layout')).default as (p: { children: React.ReactNode }) => Promise<unknown>
    const { Header } = await import('../src/components/layout/header')
    const findHeader = (el: unknown): Record<string, unknown> | null => {
      if (!el || typeof el !== 'object') return null
      const e = el as { type?: unknown; props?: { children?: unknown } & Record<string, unknown> }
      if (e.type === Header) return e.props ?? null
      const kids = e.props?.children
      for (const k of Array.isArray(kids) ? kids : [kids]) {
        const f = findHeader(k)
        if (f) return f
      }
      return null
    }
    const shell = await withRequest({ host: MAIN_HOST }, () => ShopLayout({ children: 'x' }))
    check('前台外壳：jiemaOpen=false（导航与页脚看不到「短信接码」）', findHeader(shell)?.jiemaOpen === false)
    const sitemap = (await import('../src/app/sitemap')).default as () => Promise<Array<{ url: string }>>
    const sm = await withRequest({ host: MAIN_HOST }, () => sitemap())
    check('sitemap 里没有 /jiema', sm.length > 0 && !sm.some((x) => x.url.endsWith('/jiema')))
    await setCfg({})
    // 保存
    const g1 = await callRoute(routes.aConfig.GET, { ...asAdmin, path: '/api/admin/jiema/config' })
    const gBuyer = await callRoute(routes.aConfig.GET, { ...asBuyer, path: '/api/admin/jiema/config' })
    check('后台配置接口：普通用户 403、管理员 200（出厂值、orderAvailable=false）', gBuyer.status === 403 && g1.status === 200 && g1.json?.data?.config?.saleCoef4 === 80000 && g1.json?.data?.orderAvailable === false)
    const ver = g1.json.data.storedVersion as number
    const putAll = await callRoute(routes.aConfig.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/config', body: { config: { ...FACTORY_SMS_CONFIG, audience: 'ALL' }, expectVersion: ver } })
    check('保存「全部用户」→ 400（S2 之前）', putAll.status === 400 && !!putAll.json?.errors?.audience)
    const putLow = await callRoute(routes.aConfig.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/config', body: { config: { ...FACTORY_SMS_CONFIG, saleCoef4: 70000 }, expectVersion: ver } })
    check('x < 成本汇率 → 409 要二次确认', putLow.status === 409 && putLow.json?.needConfirm === 'lowCoef')
    const putBadFx = await callRoute(routes.aConfig.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/config', body: { config: { ...FACTORY_SMS_CONFIG, costFx4: 800000 }, expectVersion: ver } })
    check('成本汇率 80.0（填错位置）→ 400 逐项错误', putBadFx.status === 400 && !!putBadFx.json?.errors?.costFx4)
    const putOk = await callRoute(routes.aConfig.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/config', body: { config: { ...FACTORY_SMS_CONFIG, saleCoef4: 75000, markupCents: 200, enabled: true }, expectVersion: ver } })
    check('合法保存 → 版本 +1、写审计', putOk.status === 200 && putOk.json?.data?.config?.version === ver + 1 && (await hp.auditEvent.count({ where: { action: 'jiema.config', actorUserId: adminU.id } })) === 1)
    const putStale = await callRoute(routes.aConfig.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/config', body: { config: FACTORY_SMS_CONFIG, expectVersion: ver } })
    check('旧版本号再保存 → 409（乐观并发）', putStale.status === 409 && putStale.json?.conflict === 'VERSION')
    catalog.resetCatalogCachesForTest()
    const snapNew = await catalog.catalogSnapshot(await readCfg())
    check('改了 x、y 之后列表价按新值（ot/6 $0.024 × 7.50 → 18 + 200 = ¥2.18；ot 的起价）', snapNew.services.find((s) => s.code === 'ot')?.fromCents === 218)
    const putBroken = await setCfg('{"version": 9, "bad": ')
    void putBroken
    const g2 = await callRoute(routes.aConfig.GET, { ...asAdmin, path: '/api/admin/jiema/config' })
    const fix = await callRoute(routes.aConfig.PUT, { ...asAdmin, method: 'PUT', path: '/api/admin/jiema/config', body: { config: FACTORY_SMS_CONFIG, expectVersion: g2.json?.data?.storedVersion } })
    check('坏配置（不是合法 JSON）也能从页面修好（storedVersion=0 → 保存成功）', g2.json?.data?.config === null && g2.json?.data?.reason === 'INVALID' && fix.status === 200)

    // =====================================================================
    section('后台：服务 CSV、热门、同步按钮')
    const csv = await withRequest(asAdmin, async () => {
      const req = new (await import('next/server')).NextRequest(`http://${MAIN_HOST}/api/admin/jiema/services?format=csv`, { headers: { cookie: `token=${tAdmin}`, host: MAIN_HOST, origin: `https://${MAIN_HOST}`, 'sec-fetch-site': 'same-origin' } })
      const res = await routes.aServices.GET(req, { params: {} })
      const buf = Buffer.from(await res.arrayBuffer())
      // res.text() 会按 UTF-8 解码并吃掉 BOM；这里看原始字节（EF BB BF = Excel 认 UTF-8 的标记）
      const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf
      return { status: res.status, ct: res.headers.get('content-type'), bom, text: buf.subarray(bom ? 3 : 0).toString('utf8') }
    })
    check('导出 CSV（带 BOM、表头）', csv.status === 200 && csv.ct?.startsWith('text/csv') === true && csv.bom && csv.text.startsWith('code,nameEn,nameCn,aliases,hotRank,status'), `${csv.status} ${csv.ct} ${JSON.stringify(csv.text.slice(0, 60))}`)
    const imp = await callRoute(routes.aServices.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/services', body: { csv: 'code,nameCn,aliases,hotRank\r\nkf,微博（新浪）,微博|weibo|wb,20\r\nzzzzz,x,,\r\n' } })
    check('导入 CSV：kf 改名与热门、非法代码跳过；写审计', imp.status === 200 && imp.json?.data?.updated === 1 && imp.json?.data?.skipped?.length === 1 && (await hp.smsService.findUnique({ where: { code: 'kf' } }))?.hotRank === 20)
    const sList = await callRoute(routes.aServices.GET, { ...asAdmin, path: '/api/admin/jiema/services?search=wb' })
    check('服务列表搜索（代码 / 名字 / 别名）', sList.status === 200 && (sList.json?.data?.list as Array<{ code: string }>).some((s) => s.code === 'wb'))
    const syncOffers = await callRoute(routes.aCatalog.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/catalog', body: { part: 'offers', service: 'qq' } })
    check('「从上游刷新」单个服务的第 ② 层', syncOffers.status === 200 && !!(await hp.smsOfferCache.findUnique({ where: { service_kind: { service: 'qq', kind: 'OFFERS' } } }))?.hash)
    const syncAll = await callRoute(routes.aCatalog.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/catalog', body: { part: 'prices' } })
    check('「从上游刷新」第 ① 层（与 cron 同一个任务、同一把锁）', syncAll.status === 200 && syncAll.json?.data?.prices?.ok === true)

    // =====================================================================
    section('getPrices 连续失败 3 次 → 降级（E28）；目录过期 → sms.alert')
    alert.resetSmsAlertThrottleForTest()
    bodies.length = 0
    mock.setFaults([{ action: 'getPrices', kind: 'http500', times: 3 }])
    for (let i = 0; i < 3; i++) await catalog.runCatalogJob({ warm: false })
    const stD = await jcfg.readCatalogState()
    catalog.resetCatalogCachesForTest()
    const snapD = await catalog.catalogSnapshot(await readCfg())
    check('pricesFails=3 → 降级', stD.pricesFails === 3 && snapD.degraded)
    check('  …有 offers 的服务（dr）照常「¥x 起」；只有 getPrices 的（kf）→ UNKNOWN「起价以实际为准」', snapD.services.find((s) => s.code === 'dr')?.fromCents != null && snapD.services.find((s) => s.code === 'kf')?.level === 'UNKNOWN')
    await sleep(300)
    check('  …推一次 sms.alert（PRICES_DEGRADED）', bodies.some((b) => b.includes('PRICES_DEGRADED')))
    await catalog.runCatalogJob({ warm: false })
    check('恢复一次 → pricesFails 归零', (await jcfg.readCatalogState()).pricesFails === 0)
    // 目录超过 60 分钟没同步成功
    const stOld = await jcfg.readCatalogState()
    await jcfg.writeCatalogState({ ...stOld, catalogAt: new Date(Date.now() - 2 * 3600_000).toISOString() })
    mock.setFaults([{ action: 'getPrices', kind: 'http500', times: 1 }])
    bodies.length = 0
    alert.resetSmsAlertThrottleForTest()
    await catalog.runCatalogJob({ warm: false })
    await sleep(300)
    check('目录超过 60 分钟没同步成功 → sms.alert（CATALOG_STALE）', bodies.some((b) => b.includes('CATALOG_STALE')))
    await catalog.runCatalogJob({ warm: false })

    section('cron 路由（§6.6 第 23 条）')
    const cronNo = await callRoute(routes.cron.GET, { host: 'app:3000', path: '/api/cron/jiema-catalog' })
    const cronYes = await callRoute(routes.cron.GET, { host: 'app:3000', path: '/api/cron/jiema-catalog', headers: { 'x-cron-secret': process.env.CRON_SECRET as string } })
    check('没有密钥 → 拒绝；有密钥 → 200 跑一趟（响应只有计数）', cronNo.status >= 400 && cronYes.status === 200 && cronYes.json?.data?.ran === true && typeof cronYes.json?.data?.services === 'number')
    const keysCron = collectKeyNames(cronYes.json)
    check('  …响应不回价格', !keysCron.has('costMicro') && !keysCron.has('priceCents'))
  } catch (e) {
    failedHard = true
    console.error('测试异常中断：', e)
  } finally {
    // ---- 恢复 ----
    try {
      for (const t of SMS_TABLES) await hp.$executeRawUnsafe(`DELETE FROM ${t}`)
      for (const t of SMS_TABLES) {
        for (const row of saved[t] as Record<string, unknown>[]) {
          const cols = Object.keys(row)
          await hp.$executeRawUnsafe(`INSERT INTO ${t} (${cols.map((c) => `\`${c}\``).join(',')}) VALUES (${cols.map(() => '?').join(',')})`, ...cols.map((c) => row[c]))
        }
      }
      await hp.setting.deleteMany({ where: { key: { in: KEEP_SETTINGS } } })
      for (const s of savedSettings) await hp.setting.create({ data: { key: s.key, value: s.value } })
      if (savedWallet) await hp.setting.update({ where: { key: 'wallet_config' }, data: { value: savedWallet.value } })
      else await hp.setting.deleteMany({ where: { key: 'wallet_config' } })
      await cleanupAll()
    } catch (e) {
      console.error('恢复失败', e)
      failedHard = true
    }
    setChannelsMode('dormant')
    await mock.close()
    hook.close()
  }
  const s = summary()
  await hp.$disconnect()
  if (failedHard || s.fail) process.exit(1)
  process.exit(0)
}

main()
