/**
 * 商品页「商品介绍」装配自测。**不连数据库**。
 *   npx tsx scripts/check-product-intro.ts
 *
 * 钉住三件事：
 *   1. 每个在售商品都能归到正确的充值落地页（规则与落地页价格表同一套），年费档兜底到 Plus 页；
 *   2. 文案按交付方式分口径——接码（SMS）与人工（MANUAL）商品的介绍里不能出现「会发卡密」的说法；
 *   3. 全站文案红线：不出现「官方」、不承诺「10 分钟」、不提微信支付、税点与支付方式写对。
 *
 * 夹具取自 2026-09-24 线上 /api/products 的公开字段（商品名、分类、交付方式、价格、库存），
 * 包括后台的原样错别字（分类「Gork」、「信用卡冲」）——规则必须对真实数据成立。
 */
import {
  buildProductIntro,
  deliveryKind,
  isFeaturesJson,
  isAccountProduct,
  landingForProduct,
  parseFeatures,
  type IntroCatalogItem,
  type ProductIntro,
} from '../src/lib/product-intro'
import { LANDINGS } from '../src/lib/landing/registry'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  ok(name, a === e, `实际 ${a}，期望 ${e}`)
}

interface Fixture extends IntroCatalogItem {
  deliveryType: string
}

// id, 分类, 交付, 价格, 库存, 商品名
const RAW: [number, string, string, number, number, string][] = [
  [16, 'Claude', 'AUTO', 150, 9, 'Claude pro 自助充值 | iOS订阅充值'],
  [2, 'Claude', 'AUTO', 950, 2, 'Claude Max5x自助充值 | iOS订阅充值'],
  [3, 'Claude', 'AUTO', 1900, 1, 'Claude Max20x自助充值 | iOS订阅充值'],
  [4, 'ChatGPT', 'AUTO', 135, 31, 'ChatGPT Plus自助充值 | 信用卡冲'],
  [21, 'ChatGPT', 'AUTO', 140, 3, 'ChatGPT Plus自助充值 | iOS订阅充值'],
  [29, 'ChatGPT', 'AUTO', 720, 10, 'ChatGPT Pro 5x 自助充值 | 信用卡充值（不可覆盖plus）'],
  [7, 'ChatGPT', 'AUTO', 750, 6, 'ChatGPT Pro 5x 自助充值 | iOS订阅充值（可覆盖plus）'],
  [5, 'ChatGPT', 'AUTO', 1999, 0, 'ChatGPT Pro 20x 自助充值 | iOS订阅充值（可覆盖plus和5x）'],
  [26, 'ChatGPT', 'AUTO', 1250, 2, 'ChatGPT Pro 20x 自助充值 | 信用卡充值（无法覆盖plus和5x）'],
  [23, 'Gork', 'AUTO', 210, 2, 'Grok Super自助充值 | iOS充值 | 30美金/月'],
  [31, 'Gork', 'AUTO', 580, 1, 'Grok Super三个月自助充值 | iOS充值 | 90美金/3月'],
  [30, 'Gork', 'AUTO', 1688, 1, 'Grok Super Heavy自助充值 | iOS充值 （300刀/月）'],
  [27, 'ChatGPT', 'AUTO', 1550, 1, 'ChatGPT Plus【年费】自助充值'],
  [10, '短信接码', 'SMS', 15, -1, 'Codex验证码-美区实体手机卡-单次接码'],
  [8, 'Claude', 'MANUAL', 180, -1, 'Claude KYC活人认证'],
  [28, '短信接码', 'SMS', 8, -1, 'Codex短信接码 | 随机地区'],
  [15, '短信接码', 'SMS', 8, -1, 'Claude注册验证码-荷兰-单次接码（地区选择Netherlands+31）'],
  [24, '谷歌邮箱', 'AUTO', 30, 3, '谷歌邮箱成品号 | 2020-2025年注册 | 2FA登录方式'],
  [14, '短信接码', 'SMS', 15, -1, 'Claude注册验证码-美区实体卡-单次接码'],
]
const FIX: Fixture[] = RAW.map(([id, categoryName, deliveryType, price, stock, name]) => ({
  id,
  categoryName,
  deliveryType,
  price,
  stock,
  name,
}))
const byId = (id: number) => FIX.find((f) => f.id === id)!
const introOf = (id: number) => buildProductIntro(byId(id), FIX)

/** 介绍区里所有买家看得见的文字，拼成一个串方便查红线 */
function allText(i: ProductIntro): string {
  return [
    i.about ?? '',
    ...i.deliveryPoints,
    ...i.steps.flatMap((s) => [s.title, s.body]),
    ...i.pricing,
    ...i.notices,
    ...i.faqs.flatMap((f) => [f.q, f.a]),
    ...i.siblings.map((s) => s.name),
    i.guide?.label ?? '',
  ].join('\n')
}

console.log('\n【商品 → 落地页】')
const EXPECT: [number, string, boolean][] = [
  [16, 'claude-pro', true],
  [2, 'claude-max', true],
  [3, 'claude-max', true],
  [4, 'chatgpt-plus', true],
  [21, 'chatgpt-plus', true],
  [29, 'chatgpt-pro', true],
  [7, 'chatgpt-pro', true],
  [5, 'chatgpt-pro', true],
  [26, 'chatgpt-pro', true],
  [8, 'claude-kyc', true],
  [14, 'claude-zhuce', true],
  [15, 'claude-zhuce', true],
  [10, 'codex-jiema', true],
  [28, 'codex-jiema', true],
  [24, 'google-zhanghao', true],
  [23, 'grok-super', true],
  [31, 'grok-super', true],
  [30, 'grok-super', true],
  // 年费档被 Plus 页 nameNone:['年费'] 排除在价格表外，兜底归到 Plus 页，但不套用月付档的口径
  [27, 'chatgpt-plus', false],
]
for (const [id, slug, direct] of EXPECT) {
  const hit = landingForProduct(byId(id))
  eq(`商品 ${id} → ${slug}${direct ? '' : '（兜底）'}`, hit ? [hit.def.slug, hit.direct] : null, [slug, direct])
}
ok(
  '匹配忽略大小写与首尾空格（后台改分类名不会让商品页掉链）',
  landingForProduct({ name: '  chatgpt PLUS 自助充值 ', categoryName: ' chatgpt ' })?.def.slug === 'chatgpt-plus'
)
ok('未知分类的商品没有落地页', landingForProduct({ name: 'Midjourney 充值', categoryName: '其他' }) === null)
ok(
  '每个落地页至少有一个在售商品归到它（否则那一页的价格表是空的）',
  LANDINGS.every((l) => FIX.some((f) => landingForProduct(f)?.def.slug === l.slug))
)

console.log('\n【同系列其他档位】')
const pro5 = introOf(29)
ok('不包含自己', !pro5.siblings.some((s) => s.id === 29))
eq('Pro 5x 信用卡 → iOS 5x 与两档 20x（按价格从低到高）', pro5.siblings.map((s) => s.id), [7, 26, 5])
ok('售罄的档位标成补货中', pro5.siblings.find((s) => s.id === 5)?.inStock === false)
eq('Max 5x ↔ Max 20x 互链', introOf(2).siblings.map((s) => s.id), [3])
eq('Plus 月付档也链到年费档', introOf(4).siblings.map((s) => s.id), [21, 27])
eq('年费档链回 Plus 两个月付档', introOf(27).siblings.map((s) => s.id), [4, 21])
eq('注册验证码两个地区互链', introOf(15).siblings.map((s) => s.id), [14])
eq('Grok 三档', introOf(23).siblings.map((s) => s.id), [31, 30])
eq(
  '没有落地页的商品退回同分类（Claude 分类：16 / 2 / 3 / 8）',
  buildProductIntro({ id: 99, name: 'X', categoryName: 'Claude' }, FIX).siblings.map((s) => s.id).sort((a, b) => a - b),
  [2, 3, 8, 16]
)

console.log('\n【完整购买指南链接】')
eq('Claude Max → 兑换前检查那一节', introOf(3).guide, {
  href: '/chongzhi/claude-max#preflight',
  label: '完整购买指南：Claude Max 充值',
})
eq('ChatGPT Pro → 能不能覆盖那一节', introOf(26).guide?.href, '/chongzhi/chatgpt-pro#override')
eq('注册验证码 → 手机号那一节', introOf(14).guide?.href, '/chongzhi/claude-zhuce#phone')
eq('年费档兜底 → Plus 页价格表', introOf(27).guide?.href, '/chongzhi/chatgpt-plus#price')
ok('没有落地页就不给指南链接', buildProductIntro({ id: 99, name: 'X', categoryName: '其他' }, FIX).guide === null)

console.log('\n【按交付方式分口径】')
eq('交付方式归一：未知值按人工', [deliveryKind('AUTO'), deliveryKind('SMS'), deliveryKind(undefined), deliveryKind('xx')], [
  'AUTO',
  'SMS',
  'MANUAL',
  'MANUAL',
])
for (const f of FIX) {
  const i = buildProductIntro(f, FIX)
  const t = allText(i)
  if (f.deliveryType === 'AUTO') {
    ok(`商品 ${f.id}（AUTO）介绍里说自动发货`, i.deliveryPoints.some((p) => p.includes('自动发货')))
  } else {
    // 「不发卡密」是唯一允许出现的写法：把它剔掉之后不能再有「卡密」二字
    ok(
      `商品 ${f.id}（${f.deliveryType}）介绍里没有「会发卡密」的说法`,
      !t.split('不发卡密').join('').includes('卡密'),
      t.split('\n').find((l) => l.split('不发卡密').join('').includes('卡密'))
    )
    ok(`商品 ${f.id}（${f.deliveryType}）明说不发卡密`, t.includes('不发卡密'))
  }
  if (f.deliveryType === 'SMS') {
    ok(`商品 ${f.id}（SMS）说明自动取号与超时退款口径`, t.includes('自动') && t.includes('取号') && t.includes('退款'))
  }
  if (f.deliveryType === 'MANUAL') {
    ok(`商品 ${f.id}（MANUAL）指明「与客服在线沟通」入口`, t.includes('与客服在线沟通'))
  }
}
ok('兑换按钮在订单页而不是商品页（会员充值类）', introOf(16).deliveryPoints.join('').includes('不在商品页'))
ok('谷歌成品号发的是账号信息，不让人去「兑换」', !allText(introOf(24)).includes('去充值 / 兑换'))
ok('isAccountProduct：谷歌成品号是账号类', isAccountProduct({ name: '谷歌邮箱成品号 | 2020-2025年注册 | 2FA登录方式', categoryName: '谷歌邮箱', deliveryType: 'AUTO' }))
ok('isAccountProduct：Plus 充值不是账号类', !isAccountProduct({ name: 'ChatGPT Plus 信用卡冲', categoryName: 'ChatGPT', deliveryType: 'AUTO' }))
ok('isAccountProduct：接码商品不是（只看自动发货）', !isAccountProduct({ name: 'Codex 接码（美国实体卡）', categoryName: '短信接码', deliveryType: 'SMS' }))
ok(
  '年费档不套用 Plus 月付档「要求没有有效订阅」的口径（它的商品说明是会覆盖现有套餐）',
  !allText(introOf(27)).includes('没有有效订阅') && introOf(27).about === null
)

console.log('\n【全站文案红线】')
for (const f of FIX) {
  const i = buildProductIntro(f, FIX)
  const t = allText(i)
  ok(`商品 ${f.id} 没有「官方」字样`, !t.includes('官方'), t.split('\n').find((l) => l.includes('官方')))
  ok(`商品 ${f.id} 没有「10 分钟」这类时效承诺`, !/10\s*分钟/.test(t))
  ok(`商品 ${f.id} 不提微信支付`, !t.includes('微信支付'))
  ok(`商品 ${f.id} 不用零需求词当说法`, !/代开|代购|代订阅/.test(t))
  ok(`商品 ${f.id} 不说下单要填邮箱`, !/下单时填|填写.{0,4}邮箱/.test(t))
  ok(`商品 ${f.id} 常见问题 3~5 条`, i.faqs.length >= 3 && i.faqs.length <= 5, String(i.faqs.length))
  ok(`商品 ${f.id} 问题不重复`, new Set(i.faqs.map((q) => q.q)).size === i.faqs.length)
  ok(`商品 ${f.id} 购买步骤 4 步`, i.steps.length === 4)
}
const pricing = introOf(16).pricing.join('')
ok('价格与发票：标价不含税', pricing.includes('不含税'))
ok('价格与发票：税点 6%（取自 lib/invoice.ts TAX_RATE）', pricing.includes('6%') && pricing.includes('1.06'))
ok('价格与发票：结算时可随单开票、付款后也可申请', pricing.includes('结算时') && pricing.includes('付款后'))
ok('价格与发票：只支持支付宝、需要登录', pricing.includes('只支持支付宝') && pricing.includes('登录'))
ok('客服时间统一 9:00-22:00', allText(introOf(16)).includes('9:00-22:00') && !allText(introOf(16)).includes('7×12'))

// cardUsage 是内部发货说明，绝不能进正文。类型上收不进来，这里再用运行时兜一道
const leaky = { ...byId(16), cardUsage: 'SENTINEL-CARD-USAGE 封号99%' } as unknown as Fixture
ok('cardUsage 不会出现在介绍区', !JSON.stringify(buildProductIntro(leaky, FIX)).includes('SENTINEL-CARD-USAGE'))

console.log('\n【features 解析与校验】')
eq('字符串数组原样（去首尾空白、丢空串）', parseFeatures('[" 质保订阅 ","", "iOS 充值"]'), ['质保订阅', 'iOS 充值'])
eq('对象项被丢掉（原来会让 SSR 500）', parseFeatures('[{"title":"x"}, "ok", 1, null]'), ['ok'])
eq('非数组返回空', parseFeatures('{"a":1}'), [])
eq('非法 JSON 返回空', parseFeatures('not json'), [])
eq('null 返回空', parseFeatures(null), [])
ok('校验：空值与空串合法', isFeaturesJson(null) && isFeaturesJson('') && isFeaturesJson('   '))
ok('校验：字符串数组合法', isFeaturesJson('["a","b"]') && isFeaturesJson('[]'))
ok('校验：对象数组不合法', !isFeaturesJson('[{"title":"x"}]'))
ok('校验：混入数字不合法', !isFeaturesJson('["a",1]'))
ok('校验：对象不合法', !isFeaturesJson('{"a":1}'))
ok('校验：非 JSON 不合法', !isFeaturesJson('特性1,特性2'))

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
