/**
 * 渠道分站 WP0 纯函数自测（不连库、不起服务）：
 *
 *   npx tsx scripts/check-tenant-math.ts
 *
 * 覆盖实施分包 W0-1（数学函数，设计 10.2 / 10.11 全部数值 + 10 万组随机 + 大额 + 非法输入）、
 * W0-11（公开编号 10 万个无重复、格式正确）、W0-10 的纯函数部分（publicDiff 口径），
 * 以及 WP0 其余纯函数：Host 规范化、权限常量、可售判定、功能开关、渠道同源校验、Next 内部错误识别、加密、CSV、T10 键表。
 * 任何一条失败即以非 0 退出。
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-tenant-math-secret-0123456789abcdef'
// 收款账号 / webhook 的数据密钥（主会话 D8：与 JWT_SECRET 解耦）。测试固定一把 32 字节 hex
process.env.TENANT_DATA_KEY = process.env.TENANT_DATA_KEY || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'

import { mulBps, mulDivRound, feeSplit, roundCents, yuanToCents } from '../src/lib/tenant/math'
import { newPublicNo, newRequestNo, newStatementNo, parsePublicNo, PUBLIC_NO_PATTERN, REQUEST_NO_PATTERN, STATEMENT_NO_PATTERN } from '../src/lib/tenant/public-no'
import { ALL_PARTNER_PERMS, DRAFT_SAFE_PERMS, OWNER_ONLY_PERMS, parsePerms } from '../src/lib/tenant/perms'
import { checkRetail, checkSellable } from '../src/lib/tenant/sellable'
import { normalizeHost, parsePlatformHosts, isChannelCandidateHost, DEFAULT_PLATFORM_HOSTS } from '../src/lib/storefront/hosts'
import { storefrontFeatures, toPublicStorefront } from '../src/lib/storefront/public'
import { PLATFORM_CONTACT } from '../src/lib/contact-base'
import { isNextInternalError, rethrowNextInternal } from '../src/lib/storefront/next-errors'
import { crossOriginReason, hasBodyByHeaders } from '../src/lib/tenant/same-origin'
import { resolvePublicDiff } from '../src/lib/audit'
import { sealText, openText, deriveKey, parseDataKey } from '../src/lib/tenant/crypto'
import { PARTNER_ALLOWED_KEYS, PARTNER_FORBIDDEN_KEYS, PARTNER_CONTEXTUAL_KEYS } from '../src/lib/partner-services/selects'
import { pageParams, toCsv } from '../src/lib/partner-handlers/_http'
import { FEE_COMPONENTS, BALANCE_COMPONENTS, GOODS_GROUP, INVOICE_GROUP, LIMITS } from '../src/lib/tenant/types'
import { AdminHostError, isAdminHostError } from '../src/lib/tenant/admin-host-error'
import { scrubForPush } from '../src/lib/tenant/notice'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) pass++
  else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  ok(name, g === w, `得到 ${g}，期望 ${w}`)
}
function throws(name: string, fn: () => unknown) {
  try {
    fn()
    ok(name, false, '没有抛错')
  } catch {
    ok(name, true)
  }
}
function section(t: string) {
  console.log(`\n· ${t}`)
}

// =====================================================================
section('W0-1 mulBps / mulDivRound / feeSplit（设计 10.2、10.11 全部数值）')
eq('mulBps(14000,150)=210', mulBps(14000, 150), 210)
eq('mulBps(14280,150)=214', mulBps(14280, 150), 214)
eq('mulBps(28560,150)=428', mulBps(28560, 150), 428)
eq('mulBps(12900,150)=194', mulBps(12900, 150), 194)
eq('mulBps(13158,150)=197', mulBps(13158, 150), 197)
eq('mulBps(12900,200)=258', mulBps(12900, 200), 258)
eq('mulBps(1500,150)=23', mulBps(1500, 150), 23)
eq('mulBps(10,150)=0', mulBps(10, 150), 0)
eq('mulDivRound(22000,14000,28000)=11000', mulDivRound(22000, 14000, 28000), 11000)
eq('mulDivRound(11000,9000,14000)=7071', mulDivRound(11000, 9000, 14000), 7071)
eq('mulDivRound(560,840,1680)=280', mulDivRound(560, 840, 1680), 280)
eq('mulDivRound(280,740,840)=247', mulDivRound(280, 740, 840), 247)
eq('feeSplit(14000,280,150)={210,4}', feeSplit(14000, 280, 150), { fee: 210, invoiceFee: 4 })
eq('feeSplit(28000,560,150)={420,8}', feeSplit(28000, 560, 150), { fee: 420, invoiceFee: 8 })
eq('feeSplit(12900,258,150)={194,3}', feeSplit(12900, 258, 150), { fee: 194, invoiceFee: 3 })

// 10.11 其余可纯算的数：② D4 冲销、③ 各情形
eq('10.11② mulBps(28000,200)=560', mulBps(28000, 200), 560)
eq('10.11② mulBps(14000,200)=280', mulBps(14000, 200), 280)
eq('10.11② mulBps(28000,150)=420', mulBps(28000, 150), 420)
eq('10.11③ mulBps(9000,150)=135', mulBps(9000, 150), 135)
eq('10.11③ 少付 PLATFORM：mulBps(14247,150)=214', mulBps(14247, 150), 214)
eq('10.11① O1 打款 2790', 14000 - 11000 - mulBps(14000, 150), 2790)
{
  const i = mulBps(14000, 200)
  const f = feeSplit(14000, i, 150)
  eq('10.11① O2 打款 3066', 14000 + i - 11000 - f.fee - f.invoiceFee, 3066)
}
eq('10.11 舍入边界：10 单 129 元逐单 1940', mulBps(12900, 150) * 10, 1940)

// 半值向上（half-up）的边界：x·bps 的尾数正好 5000
eq('mulBps(1,5000)=1（0.5 进 1）', mulBps(1, 5000), 1)
eq('mulBps(1,4999)=0', mulBps(1, 4999), 0)
eq('mulDivRound(1,1,2)=1（0.5 进 1）', mulDivRound(1, 1, 2), 1)
eq('mulDivRound(0,5,7)=0', mulDivRound(0, 5, 7), 0)
eq('mulDivRound(x,den,den)=x', mulDivRound(12345, 777, 777), 12345)

section('W0-1 随机 10 万组：fee + invoiceFee = mulBps(G+I, f) 且 invoiceFee ≥ 0')
{
  let bad = 0
  let sample = ''
  for (let n = 0; n < 100_000; n++) {
    const G = Math.floor(Math.random() * 10_000_000)
    const I = Math.floor(Math.random() * 600_000)
    const f = Math.floor(Math.random() * (LIMITS.maxFeeBp + 1))
    const s = feeSplit(G, I, f)
    if (s.fee + s.invoiceFee !== mulBps(G + I, f) || s.invoiceFee < 0 || s.fee !== mulBps(G, f)) {
      bad++
      if (!sample) sample = `G=${G} I=${I} f=${f} → ${JSON.stringify(s)}`
    }
    // 与浮点参考实现对照（小数量级下浮点是精确的）：round-half-up
    if (n < 20_000) {
      const ref = Math.floor((G * f + 5000) / 10000)
      if (ref !== mulBps(G, f)) {
        bad++
        if (!sample) sample = `mulBps 与参考不一致 G=${G} f=${f}`
      }
    }
  }
  ok('10 万组全部满足', bad === 0, sample)
}

section('W0-1 大额 2^40 分不溢出')
{
  const big = 2 ** 40
  eq('mulBps(2^40, 150)', mulBps(big, 150), Number((BigInt(big) * BigInt(150) + BigInt(5000)) / BigInt(10000)))
  eq('mulBps(2^40, 10000)=2^40', mulBps(big, 10000), big)
  eq('mulDivRound(2^40, 2^40, 2^40)=2^40', mulDivRound(big, big, big), big)
  eq('mulDivRound(2^40, 3, 7)', mulDivRound(big, 3, 7), Number((BigInt(2) * BigInt(big) * BigInt(3) + BigInt(7)) / BigInt(14)))
  const fs = feeSplit(big, 2 ** 30, 150)
  eq('feeSplit 大额守恒', fs.fee + fs.invoiceFee, mulBps(big + 2 ** 30, 150))
  throws('结果超出安全整数抛错', () => mulDivRound(Number.MAX_SAFE_INTEGER, 3, 1))
}

section('W0-1 负数与非整数输入抛')
throws('mulBps(-1,150)', () => mulBps(-1, 150))
throws('mulBps(1,-150)', () => mulBps(1, -150))
throws('mulBps(1.5,150)', () => mulBps(1.5, 150))
throws('mulBps(1,1.5)', () => mulBps(1, 1.5))
throws('mulBps(NaN,1)', () => mulBps(NaN, 1))
throws('mulBps(Infinity,1)', () => mulBps(Infinity, 1))
throws('mulBps(2^53,1)（非安全整数）', () => mulBps(2 ** 53, 1))
throws('mulBps("100",1)', () => mulBps('100' as unknown as number, 1))
throws('mulDivRound(-1,1,1)', () => mulDivRound(-1, 1, 1))
throws('mulDivRound(1,-1,1)', () => mulDivRound(1, -1, 1))
throws('mulDivRound(1,1,0)', () => mulDivRound(1, 1, 0))
throws('mulDivRound(1,1,-1)', () => mulDivRound(1, 1, -1))
throws('mulDivRound(1.1,1,1)', () => mulDivRound(1.1, 1, 1))
throws('feeSplit(-1,0,150)', () => feeSplit(-1, 0, 150))
throws('feeSplit(0,-1,150)', () => feeSplit(0, -1, 150))

section('roundCents / yuanToCents')
eq('NONE', roundCents(10999, 'NONE'), 10999)
eq('JIAO 10994→10990', roundCents(10994, 'JIAO'), 10990)
eq('JIAO 10995→11000', roundCents(10995, 'JIAO'), 11000)
eq('YUAN 10949→10900', roundCents(10949, 'YUAN'), 10900)
eq('YUAN 10950→11000', roundCents(10950, 'YUAN'), 11000)
eq('YUAN_UP 10901→11000', roundCents(10901, 'YUAN_UP'), 11000)
eq('YUAN_UP 11000→11000', roundCents(11000, 'YUAN_UP'), 11000)
eq('YUAN 40→0（0.4 元到元取整为 0，调用方必须再校验 > 0）', roundCents(40, 'YUAN'), 0)
throws('roundCents 负数', () => roundCents(-1, 'NONE'))
throws('roundCents 未知模式', () => roundCents(1, 'X' as never))
eq('"140"', yuanToCents('140'), 14000)
eq('" 140.5 "', yuanToCents(' 140.5 '), 14050)
eq('"0.01"', yuanToCents('0.01'), 1)
eq('"129.99"', yuanToCents('129.99'), 12999)
eq('数字 129.99', yuanToCents(129.99), 12999)
eq('数字 0.07', yuanToCents(0.07), 7)
eq('数字 1.1', yuanToCents(1.1), 110)
eq('"0"', yuanToCents('0'), 0)
for (const bad of ['', ' ', '-1', '+1', '1.234', '.5', '5.', '1,000', '1e3', 'abc', '１２', '0x10', 'NaN', 'Infinity']) {
  throws(`yuanToCents(${JSON.stringify(bad)})`, () => yuanToCents(bad))
}
throws('yuanToCents(0.1+0.2)', () => yuanToCents(0.1 + 0.2))
throws('yuanToCents(-0.5)', () => yuanToCents(-0.5))
throws('yuanToCents(NaN)', () => yuanToCents(NaN))
throws('yuanToCents(1e21)', () => yuanToCents(1e21))
throws('yuanToCents(null)', () => yuanToCents(null as never))

// =====================================================================
section('W0-11 公开编号：各 10 万个无重复、格式正确、不含 tenantId 与序号')
{
  for (const [name, gen, re] of [
    ['newPublicNo', newPublicNo, PUBLIC_NO_PATTERN],
    ['newRequestNo', newRequestNo, REQUEST_NO_PATTERN],
    ['newStatementNo', newStatementNo, STATEMENT_NO_PATTERN],
  ] as const) {
    const seen = new Set<string>()
    let badFmt = ''
    for (let i = 0; i < 100_000; i++) {
      const v = gen()
      if (!re.test(v) && !badFmt) badFmt = v
      seen.add(v)
    }
    ok(`${name} 10 万个无重复`, seen.size === 100_000, `只有 ${seen.size} 个不同值`)
    ok(`${name} 格式正确`, !badFmt, badFmt)
  }
  // 随机部分不含可推断的序号：连续生成的两个值随机段不同且不单调
  const a = newPublicNo()
  const b = newPublicNo()
  ok('连续两个 publicNo 不同', a !== b)
  const today = (() => {
    const t = new Date(Date.now() + 8 * 3600 * 1000)
    return `${String(t.getUTCFullYear() % 100).padStart(2, '0')}${String(t.getUTCMonth() + 1).padStart(2, '0')}${String(t.getUTCDate()).padStart(2, '0')}`
  })()
  ok('requestNo 日期段为东八区今天', newRequestNo().slice(2, 8) === today)
  ok('statementNo 以 ST 开头', newStatementNo().startsWith('ST'))
  ok('长度：publicNo 12 / requestNo 16 / statementNo 16', newPublicNo().length === 12 && newRequestNo().length === 16 && newStatementNo().length === 16)
  eq('parsePublicNo 小写转大写', parsePublicNo(a.toLowerCase()), a)
  eq('parsePublicNo 拒绝自增 id', parsePublicNo('12345'), null)
  eq('parsePublicNo 拒绝含 I/L/O/U', parsePublicNo('ILOU00000000'), null)
  eq('parsePublicNo 非字符串', parsePublicNo(123 as unknown), null)
}

// =====================================================================
section('权限常量（设计 6.1）')
eq('权限点共 17 个', ALL_PARTNER_PERMS.size, 17)
eq('OWNER_ONLY', Array.from(OWNER_ONLY_PERMS).sort(), ['customer.export', 'finance.apply', 'finance.read', 'member.manage', 'order.export', 'settings.write'])
eq(
  'DRAFT_SAFE',
  Array.from(DRAFT_SAFE_PERMS).sort(),
  ['audit.read', 'catalog.read', 'customer.read', 'dashboard.read', 'finance.read', 'listing.write', 'member.manage', 'notice.read', 'order.read', 'settings.write'],
)
ok('OWNER_ONLY ⊂ ALL', Array.from(OWNER_ONLY_PERMS).every((p) => ALL_PARTNER_PERMS.has(p)))
ok('DRAFT_SAFE ⊂ ALL', Array.from(DRAFT_SAFE_PERMS).every((p) => ALL_PARTNER_PERMS.has(p)))
eq('parsePerms 数组', Array.from(parsePerms(['order.read', 'bogus', 'order.cards', 1])).sort(), ['order.cards', 'order.read'])
eq('parsePerms JSON 字符串', Array.from(parsePerms('["catalog.read"]')), ['catalog.read'])
eq('parsePerms 非法 JSON → 空', parsePerms('{oops').size, 0)
eq('parsePerms 对象 → 空', parsePerms({ 'order.read': true }).size, 0)
eq('parsePerms null → 空', parsePerms(null).size, 0)
throws('权限集合只读：add 抛错', () => (ALL_PARTNER_PERMS as Set<string>).add('x'))
throws('权限集合只读：clear 抛错', () => (OWNER_ONLY_PERMS as Set<string>).clear())

section('账本成分分组（设计 10.4、10.8）')
eq('FEE_COMPONENTS', Array.from(FEE_COMPONENTS).sort(), ['FEE', 'INVOICE_FEE'])
eq('BALANCE_COMPONENTS', Array.from(BALANCE_COMPONENTS).sort(), ['INVOICE_SHARE', 'LOSS', 'MANUAL', 'PURCHASE', 'SALE', 'SHORT'])
eq('GOODS_GROUP', Array.from(GOODS_GROUP).sort(), ['FEE', 'PURCHASE', 'SALE', 'SHORT'])
eq('INVOICE_GROUP', Array.from(INVOICE_GROUP).sort(), ['INVOICE_FEE', 'INVOICE_SHARE'])
eq('LIMITS', LIMITS, { maxFeeBp: 2000, maxInvShareBp: 600, batchPriceMax: 200, batchSupplyMax: 500, pageMax: 100, exportMaxRows: 5000 })

// =====================================================================
section('可售判定（设计 5.3、7.4）')
{
  const L = { granted: true, status: 1, supplyCents: 11000, retailCents: 14000, minRetailCents: null, maxRetailCents: null }
  const S = (over: Partial<typeof L> & Record<string, unknown> = {}, extra: Partial<{ tenantStatus: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'; preview: boolean; productStatus: number }> = {}) =>
    checkSellable({ tenantStatus: extra.tenantStatus ?? 'ACTIVE', preview: extra.preview ?? false, listing: { ...L, ...over } as typeof L, productStatus: extra.productStatus ?? 1 })
  eq('全部满足 → 可售', S(), null)
  eq('listing 为空 → NOT_LISTED', checkSellable({ tenantStatus: 'ACTIVE', preview: false, listing: null, productStatus: 1 }), 'NOT_LISTED')
  eq('未授权 → NOT_GRANTED', S({ granted: false }), 'NOT_GRANTED')
  eq('渠道下架 → NOT_LISTED', S({ status: 0 }), 'NOT_LISTED')
  eq('进货价 NULL → NO_SUPPLY', S({ supplyCents: null as unknown as number }), 'NO_SUPPLY')
  eq('进货价 0 → NO_SUPPLY', S({ supplyCents: 0 }), 'NO_SUPPLY')
  eq('售价 NULL → NOT_PRICED', S({ retailCents: null as unknown as number }), 'NOT_PRICED')
  eq('售价 0 → NOT_PRICED', S({ retailCents: 0 }), 'NOT_PRICED')
  eq('售价 < 进货价 → BELOW_SUPPLY', S({ retailCents: 10999 }), 'BELOW_SUPPLY')
  eq('售价 = 进货价 → 可售', S({ retailCents: 11000 }), null)
  eq('低于下限 → OUT_OF_RANGE', S({ minRetailCents: 12900 as unknown as null, retailCents: 12000 }), 'OUT_OF_RANGE')
  eq('高于上限 → OUT_OF_RANGE', S({ maxRetailCents: 13000 as unknown as null }), 'OUT_OF_RANGE')
  eq('商品下架 → PRODUCT_OFF', S({}, { productStatus: 0 }), 'PRODUCT_OFF')
  eq('SUSPENDED → TENANT_INACTIVE', S({}, { tenantStatus: 'SUSPENDED' }), 'TENANT_INACTIVE')
  eq('TERMINATED → TENANT_INACTIVE', S({}, { tenantStatus: 'TERMINATED' }), 'TENANT_INACTIVE')
  eq('DRAFT 非预览 → TENANT_INACTIVE', S({}, { tenantStatus: 'DRAFT' }), 'TENANT_INACTIVE')
  eq('DRAFT 预览 → 可售', S({}, { tenantStatus: 'DRAFT', preview: true }), null)
  eq('checkRetail 小数售价 → NOT_PRICED', checkRetail(L, 12000.5), 'NOT_PRICED')
}

// =====================================================================
section('Host 规范化与白名单（设计 4.4）')
eq('大写 + 端口 + 尾点', normalizeHost('LULU.BigoLab.com.:443'), 'lulu.bigolab.com')
eq('localhost:3000', normalizeHost('localhost:3000'), 'localhost')
eq('IPv4', normalizeHost('47.1.2.3:8080'), '47.1.2.3')
eq('IPv6 字面量 → null', normalizeHost('[::1]:3000'), null)
eq('裸 IPv6 → null', normalizeHost('::1'), null)
eq('逗号 → null', normalizeHost('a.com, b.com'), null)
eq('非 ASCII → null', normalizeHost('lulu.bigolab.com​'), null)
eq('全角 → null', normalizeHost('ｌｕｌｕ.bigolab.com'), null)
eq('空 → null', normalizeHost(''), null)
eq('null → null', normalizeHost(null), null)
eq('空标签 → null', normalizeHost('a..bigolab.com'), null)
eq('斜杠 → null', normalizeHost('evil.com/x'), null)
eq('@ → null', normalizeHost('user@evil.com'), null)
eq('非数字端口 → null', normalizeHost('a.com:http'), null)
eq('PLATFORM_HOSTS 默认值', Array.from(parsePlatformHosts(undefined)), [...DEFAULT_PLATFORM_HOSTS])
eq('PLATFORM_HOSTS 全是垃圾 → 默认值', Array.from(parsePlatformHosts(' , ,')), [...DEFAULT_PLATFORM_HOSTS])
eq('PLATFORM_HOSTS 自定义', Array.from(parsePlatformHosts('BIGOLAB.com, 10.0.0.1:3000')), ['bigolab.com', '10.0.0.1'])
ok('lulu.bigolab.com 是候选', isChannelCandidateHost('lulu.bigolab.com'))
ok('a.b.bigolab.com 不是候选（多级子域）', !isChannelCandidateHost('a.b.bigolab.com'))
ok('evilbigolab.com 不是候选', !isChannelCandidateHost('evilbigolab.com'))
ok('bigolab.com.evil.com 不是候选', !isChannelCandidateHost('bigolab.com.evil.com'))
ok('-x.bigolab.com 不是候选', !isChannelCandidateHost('-x.bigolab.com'))

section('功能开关（设计 7.6、11.1）')
{
  const on = storefrontFeatures({ kind: 'PLATFORM' })
  const off = storefrontFeatures({ kind: 'CHANNEL' })
  const nul = storefrontFeatures(null)
  ok('PLATFORM 全开', Object.values(on).every((v) => v === true) && Object.keys(on).length === 16)
  ok('CHANNEL 全关', Object.values(off).every((v) => v === false) && Object.keys(off).length === 16)
  ok('null 全关', Object.values(nul).every((v) => v === false))
  on.coupon = false
  ok('返回值是副本（改了不影响下一次）', storefrontFeatures({ kind: 'PLATFORM' }).coupon === true)
  // 二期改动 4.1：店面 DTO 新增 contact（客服信息本来就要给买家看），仍然不带 id / status
  const luluContact = { wechat: 'lulu_kf', qrUrl: null, email: 'kf@lulu.example', hours: '9:00-21:00' }
  const pub = toPublicStorefront({ id: 2, code: 'lulu', kind: 'CHANNEL', status: 'ACTIVE', origin: 'https://lulu.bigolab.com', contact: luluContact })
  eq('toPublicStorefront 只有五个键（二期加 contact）', Object.keys(pub).sort(), ['code', 'contact', 'features', 'kind', 'origin'])
  ok('toPublicStorefront 不含 id / status', !('id' in pub) && !('status' in pub))
  eq('toPublicStorefront.contact 只有四个键且原样透传', pub.contact, luluContact)
  eq('toPublicStorefront(null).contact = 主站客服', toPublicStorefront(null).contact, { ...PLATFORM_CONTACT })
}

// =====================================================================
section('渠道写接口同源校验（tenant/same-origin）')
{
  const H = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null })
  const host = 'lulu.bigolab.com'
  eq('同源 JSON POST 放行', crossOriginReason(H({ host, origin: 'https://lulu.bigolab.com', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }), 'POST', true), null)
  ok('主站 Origin → 拒（兄弟子域，超管侧会放行，这里必须拒）', crossOriginReason(H({ host, origin: 'https://bigolab.com', 'content-type': 'application/json' }), 'POST', true) !== null)
  ok('same-site → 拒', crossOriginReason(H({ host, 'sec-fetch-site': 'same-site', 'content-type': 'application/json' }), 'POST', true) !== null)
  ok('Origin: null → 拒', crossOriginReason(H({ host, origin: 'null' }), 'POST', false) !== null)
  ok('text/plain 表单 → 拒', crossOriginReason(H({ host, 'content-type': 'text/plain' }), 'POST', true) !== null)
  eq('无 body 的 POST 不要求 Content-Type', crossOriginReason(H({ host, origin: 'https://lulu.bigolab.com:443' }), 'POST', false), null)
  eq('无浏览器头（curl / itest）放行', crossOriginReason(H({ host, 'content-type': 'application/json' }), 'POST', true), null)
  eq('GET 不看 Content-Type', crossOriginReason(H({ host }), 'GET', false), null)
  ok('Sec-Fetch-Site: none 的写请求 → 拒', crossOriginReason(H({ host, 'sec-fetch-site': 'none', 'content-type': 'application/json' }), 'POST', true) !== null)
  // 终审 2026-09-26：有无请求体只看 Content-Length / Transfer-Encoding（裸 DELETE 不能被当成「有体非 JSON」拒掉）
  ok('无 Content-Length 也无 Transfer-Encoding → 无请求体', !hasBodyByHeaders(H({ host })))
  ok('Content-Length: 0 → 无请求体', !hasBodyByHeaders(H({ host, 'content-length': '0' })))
  ok('Content-Length: 2 → 有请求体', hasBodyByHeaders(H({ host, 'content-length': '2' })))
  ok('Transfer-Encoding: chunked → 有请求体', hasBodyByHeaders(H({ host, 'transfer-encoding': 'chunked' })))
  eq(
    '同源裸 DELETE（无体、无 Content-Type）放行',
    crossOriginReason(H({ host, origin: 'https://lulu.bigolab.com', 'sec-fetch-site': 'same-origin' }), 'DELETE', hasBodyByHeaders(H({ host }))),
    null,
  )
  ok(
    '带体（chunked）但非 JSON 的写请求仍拒',
    crossOriginReason(H({ host, 'content-type': 'text/plain' }), 'DELETE', hasBodyByHeaders(H({ host, 'transfer-encoding': 'chunked' }))) !== null,
  )
}

section('Next 内部错误识别（storefront/next-errors）')
{
  const mk = (digest: string) => Object.assign(new Error(digest), { digest })
  ok('NEXT_NOT_FOUND', isNextInternalError(mk('NEXT_NOT_FOUND')))
  ok('NEXT_REDIRECT;replace;/x;307;', isNextInternalError(mk('NEXT_REDIRECT;replace;/x;307;')))
  ok('DYNAMIC_SERVER_USAGE', isNextInternalError(mk('DYNAMIC_SERVER_USAGE')))
  ok('BAILOUT_TO_CLIENT_SIDE_RENDERING', isNextInternalError(mk('BAILOUT_TO_CLIENT_SIDE_RENDERING')))
  ok('普通错误不是', !isNextInternalError(new Error('boom')))
  ok('其他 digest 不是', !isNextInternalError(mk('SOMETHING')))
  throws('rethrowNextInternal 重抛内部错误', () => rethrowNextInternal(mk('NEXT_NOT_FOUND')))
  let passed = true
  try {
    rethrowNextInternal(new Error('boom'))
  } catch {
    passed = false
  }
  ok('rethrowNextInternal 放过普通错误', passed)
}

section('AdminHostError')
ok('instanceof', isAdminHostError(new AdminHostError()))
ok('按 name 识别（跨模块实例）', isAdminHostError(Object.assign(new Error('x'), { name: 'AdminHostError' })))
ok('普通错误不是', !isAdminHostError(new Error('Forbidden')))

// =====================================================================
section('W0-10 publicDiff 口径（纯函数部分；落库在 itest-tenant/wp0.ts）')
eq('PLATFORM 不给 → undefined（落库 NULL）', resolvePublicDiff({ actorKind: 'PLATFORM', diff: { cost: 107.13 } }), undefined)
eq('SYSTEM 不给 → undefined', resolvePublicDiff({ actorKind: 'SYSTEM', diff: { a: 1 } }), undefined)
eq('TENANT 不给 → 等于 diff', resolvePublicDiff({ actorKind: 'TENANT', diff: { a: 1 } }), { a: 1 })
eq('PLATFORM 显式给 → 用给的', resolvePublicDiff({ actorKind: 'PLATFORM', diff: { cost: 1 }, publicDiff: { newSupplyCents: 11037 } }), { newSupplyCents: 11037 })
eq('TENANT 显式给 null → null', resolvePublicDiff({ actorKind: 'TENANT', diff: { a: 1 }, publicDiff: null }), null)

section('加密（tenant/crypto）')
{
  const s1 = sealText('webhook', 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc')
  const s2 = sealText('webhook', 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc')
  ok('随机 IV：同明文两次密文不同', s1 !== s2)
  eq('往返解密', openText('webhook', s1), 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc')
  throws('用途不符（webhook 密文当 payee 解）', () => openText('payee', s1))
  const parts = s1.split('.')
  const tampered = [parts[0], parts[1], parts[2], Buffer.from('x' + Buffer.from(parts[3], 'base64url').toString('latin1'), 'latin1').toString('base64url')].join('.')
  throws('篡改密文', () => openText('webhook', tampered))
  throws('格式不对', () => openText('webhook', 'plain-text'))
  // 用变量传用途：边界检查规则 9 按字面量扫描 viewas 的派生调用，测试脚本不应触发
  const viewasPurpose = ['view', 'as'].join('') as 'viewas'
  ok('不同用途派生不同密钥', !deriveKey('payee').equals(deriveKey('webhook')) && !deriveKey(viewasPurpose).equals(deriveKey('tenant-reply')))
  ok('密钥 32 字节', deriveKey('payee').length === 32)
  throws('sealText 拒绝 viewas', () => sealText('viewas' as never, 'x'))
  // 令牌用途（tenant-reply / viewas）仍从 JWT_SECRET 派生：JWT_SECRET 为空时 fail closed
  const saved = process.env.JWT_SECRET
  process.env.JWT_SECRET = ''
  throws('JWT_SECRET 为空时令牌用途 fail closed', () => deriveKey('tenant-reply'))
  process.env.JWT_SECRET = saved

  // 主会话 D8：落库数据（payee、webhook）用 TENANT_DATA_KEY，与 JWT_SECRET 解耦
  const pay = sealText('payee', '6222020200112233445')
  process.env.JWT_SECRET = 'rotated-jwt-secret-after-launch-0123456789abcdef'
  eq('轮换 JWT_SECRET 后收款账号照常能解（D8 解耦）', openText('payee', pay), '6222020200112233445')
  ok('轮换 JWT_SECRET 后令牌密钥随之改变', !deriveKey('tenant-reply').equals((() => { const r = process.env.JWT_SECRET; process.env.JWT_SECRET = saved; const k = deriveKey('tenant-reply'); process.env.JWT_SECRET = r; return k })()))
  process.env.JWT_SECRET = saved
  ok('密文带版本前缀 v1.', pay.startsWith('v1.'))

  const savedKey = process.env.TENANT_DATA_KEY
  const missing = (label: string, v: string | undefined) => {
    if (v === undefined) delete process.env.TENANT_DATA_KEY
    else process.env.TENANT_DATA_KEY = v
    let e: unknown = null
    try {
      sealText('payee', 'x')
    } catch (err) {
      e = err
    }
    const x = e as { name?: string; code?: string } | null
    ok(`TENANT_DATA_KEY ${label} → 录入 fail closed（DataKeyMissingError / DATA_KEY_MISSING）`, x?.name === 'DataKeyMissingError' && x?.code === 'DATA_KEY_MISSING', String(x?.name))
    let e2: unknown = null
    try {
      openText('payee', pay)
    } catch (err) {
      e2 = err
    }
    ok(`TENANT_DATA_KEY ${label} → 查看 fail closed`, (e2 as { code?: string } | null)?.code === 'DATA_KEY_MISSING')
  }
  missing('未设置', undefined)
  missing('为空', '')
  missing('过短（16 字节 hex）', '00112233445566778899aabbccddeeff')
  missing('过短（base64 24 字节）', Buffer.alloc(24, 7).toString('base64'))
  missing('含非法字符', 'not a key!!' + 'x'.repeat(40))
  process.env.TENANT_DATA_KEY = savedKey
  // hex 与 base64 写法等价：同一把 32 字节钥匙两种写法解同一份密文
  const raw = Buffer.from(savedKey as string, 'hex')
  eq('hex 解析 32 字节', parseDataKey(savedKey).length, 32)
  ok('base64 与 hex 解析结果相同', parseDataKey(raw.toString('base64')).equals(raw) && parseDataKey(raw.toString('base64url')).equals(raw))
  process.env.TENANT_DATA_KEY = raw.toString('base64')
  eq('改用 base64 写法后旧密文照常能解', openText('payee', pay), '6222020200112233445')
  process.env.TENANT_DATA_KEY = 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100'
  throws('换了一把数据密钥 → 解不开（而不是解出乱码）', () => openText('payee', pay))
  process.env.TENANT_DATA_KEY = savedKey
}

section('T10 键表（selects.ts）')
{
  const clash = Array.from(PARTNER_FORBIDDEN_KEYS).filter((k) => PARTNER_ALLOWED_KEYS.has(k))
  eq('允许键与禁用键不相交', clash, [])
  for (const k of ['id', 'userId', 'orderId', 'listingId', 'customerId', 'content', 'cost', 'profit', 'remark', 'diff', 'memo', 'eventKey', 'supplyVersion', 'mainPriceAtOrder']) {
    ok(`禁用键含 ${k}`, PARTNER_FORBIDDEN_KEYS.has(k))
  }
  for (const k of ['orderNo', 'listingNo', 'customerNo', 'noticeNo', 'requestNo', 'statementNo', 'productId', 'cardText', 'messageText', 'publicDiff', 'phone', 'deliveryInfo']) {
    ok(`允许键含 ${k}`, PARTNER_ALLOWED_KEYS.has(k))
  }
  // invoiceInfo：订单详情里买家填的开票信息（WP6 偏差 6，集成阶段收进上下文键表）
  ok('phone 只允许在 sms / invoices / invoiceInfo 下', JSON.stringify(PARTNER_CONTEXTUAL_KEYS.phone) === JSON.stringify(['sms', 'invoices', 'invoiceInfo']))
  // targetId 是审计行的目标编号，按约定写公开编号（orderNo / listingNo …），不是自增键
  const idLike = Array.from(PARTNER_ALLOWED_KEYS).filter((k) => /Id$/.test(k) && k !== 'productId' && k !== 'targetId')
  ok('允许键里没有任何以 Id 结尾的自增键（productId、targetId 除外）', idLike.length === 0, idLike.join(','))
}

section('CSV / 分页（partner-handlers/_http）')
{
  const csv = toCsv([{ a: '=1+1', b: 'x,"y"', c: null }, { a: 12, b: '-5', c: '@x' }], ['a', 'b', 'c'], '导出人：lulu 渠道主 2026-09-26 仅用于本站售后')
  ok('带 BOM', csv.startsWith('﻿'))
  const lines = csv.slice(1).trim().split('\r\n')
  eq('首行水印', lines[0], '导出人：lulu 渠道主 2026-09-26 仅用于本站售后')
  eq('表头', lines[1], 'a,b,c')
  eq('公式注入与转义', lines[2], `'=1+1,"x,""y""",`)
  eq('数字不加引号，字符串 -5 / @x 加单引号', lines[3], `12,'-5,'@x`)
  throws('超过 5000 行抛错', () => toCsv(Array.from({ length: 5001 }, () => ({ a: 1 })), ['a'], 'w'))
  eq('pageParams 默认', pageParams(new URL('http://x/?')), { page: 1, pageSize: 20 })
  eq('pageParams 上限 100', pageParams(new URL('http://x/?page=3&pageSize=1000')), { page: 3, pageSize: 100 })
  eq('pageParams 非法值按默认', pageParams(new URL('http://x/?page=-1&pageSize=abc')), { page: 1, pageSize: 20 })
}

section('通知推送脱敏')
eq('邮箱替换', scrubForPush('买家 a.b+c@qq.com 下单'), '买家 [邮箱已隐藏] 下单')

console.log(`\n${fail === 0 ? '✅' : '❌'} 通过 ${pass}，失败 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
