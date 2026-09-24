/**
 * 商品页 SEO 装配自测。**不连数据库**。
 *   npx tsx scripts/check-product-seo.ts
 *
 * 这些字符串会直接出现在搜索结果里，也是 Google 判断「每个商品页是不是独立页面」的依据。
 * 2026-09-14 之前全站商品页共用同一份标题与描述，等于所有商品页在搜索引擎眼里是同一页；
 * 这个脚本钉住「不同商品必须产出不同的标题/描述/结构化数据」。
 */
import {
  SITE_NAME,
  productTitle,
  productDescription,
  productJsonLd,
  productPath,
  productUrl,
  type SeoProduct,
} from '../src/lib/product-seo'
import { indexNowKey } from '../src/lib/indexnow'

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

const p = (over: Partial<SeoProduct> = {}): SeoProduct => ({
  id: 3,
  name: 'Claude Max20x自助充值',
  description: 'Claude MAX 20x会员订阅，苹果订阅原价 250 美元/月。质保订阅，不质保封号，介意勿拍。',
  price: 1700,
  originalPrice: 2000,
  stock: 1,
  image: null,
  categoryName: 'Claude',
  ...over,
})

console.log('\n【标题】')
eq('普通商品名追加站名', productTitle(p()), `Claude Max20x自助充值 - ${SITE_NAME}`)
ok(
  '超长商品名不再追加站名（避免被搜索结果截断掉有效信息）',
  !productTitle(p({ name: 'ChatGPT Pro 20x 自助充值 | 信用卡充值（无法覆盖plus和5x）超长名称测试' })).includes(
    `- ${SITE_NAME}`
  )
)
ok('商品名首尾空格被清掉', !productTitle(p({ name: '  Claude Pro  ' })).startsWith(' '))

// 这一条是这次改动的核心：不同商品必须有不同标题
ok(
  '不同商品产出不同标题',
  productTitle(p({ id: 3, name: 'Claude Max20x自助充值' })) !==
    productTitle(p({ id: 5, name: 'ChatGPT Pro 20x 自助充值' }))
)

console.log('\n【描述】')
ok('优先用商品自己的简介', productDescription(p()).startsWith('Claude MAX 20x会员订阅'))
ok('没有简介时按模板兜底且含商品名', productDescription(p({ description: null })).includes('Claude Max20x自助充值'))
ok('没有简介时带上价格', productDescription(p({ description: null })).includes('￥1700.00'))
ok('描述控制在 150 字内', productDescription(p({ description: '啊'.repeat(400) })).length <= 150)
ok('超长描述以省略号收尾', productDescription(p({ description: '啊'.repeat(400) })).endsWith('…'))
ok('换行与多余空白被压平', !productDescription(p({ description: 'a\n\n  b' })).includes('\n'))
ok(
  '不同商品产出不同描述',
  productDescription(p({ description: 'A 商品说明' })) !== productDescription(p({ description: 'B 商品说明' }))
)

/*
 * 【描述模板按交付方式分口径】原来对全部商品一律写「卡密自助兑换」，
 * 而接码（SMS）与人工（MANUAL）商品根本不发卡密——这句假话同时进了 meta 与 JSON-LD。
 */
const auto = productDescription(p({ description: '自助充值', deliveryType: 'AUTO' }))
const sms = productDescription(
  p({ name: 'Codex验证码-美区实体手机卡-单次接码', description: null, price: 15, deliveryType: 'SMS' })
)
const manual = productDescription(
  p({ name: 'Claude KYC活人认证', description: '付款后半小时内完成。', price: 180, deliveryType: 'MANUAL' })
)
const unknown = productDescription(p({ description: null }))
ok('AUTO 模板说卡密自助兑换', auto.includes('卡密自助兑换'), auto)
ok('SMS 模板说自动取号且不发卡密', sms.includes('自动取号') && sms.includes('不发卡密'), sms)
ok('SMS 模板不再声称卡密自助兑换', !sms.includes('卡密自助兑换'), sms)
ok('MANUAL 模板说人工对接且不发卡密', manual.includes('人工') && manual.includes('不发卡密'), manual)
ok('MANUAL 模板不再声称卡密自助兑换', !manual.includes('卡密自助兑换'), manual)
ok('未知交付方式不声称任何交付形式', !unknown.includes('卡密') && !unknown.includes('取号'), unknown)
for (const [name, d] of [['AUTO', auto], ['SMS', sms], ['MANUAL', manual], ['未知', unknown]] as const) {
  ok(`${name} 模板带支付宝与不含税口径`, d.includes('支付宝') && d.includes('不含税'), d)
  ok(`${name} 模板没有「官方」字样`, !d.includes('官方'), d)
}

// 线上 id 4 / 8 / 21 的描述是「…无关。。」：简介自带句号时不能再补一个
ok('简介自带句号时不出现「。。」', !manual.includes('。。'), manual)
ok(
  '简介以感叹号/英文句点结尾也不叠标点',
  !productDescription(p({ description: '质保订阅！', deliveryType: 'AUTO' })).includes('！。') &&
    !productDescription(p({ description: 'short desc.', deliveryType: 'AUTO' })).includes('.。')
)
ok('简介原文仍然保留', manual.includes('付款后半小时内完成'), manual)
// 商品 16：名字里已经有「自助充值」，简介就是这四个字——不在百度那七八十字里说两遍
ok(
  '简介整句已包含在商品名里时不重复',
  productDescription(
    p({ name: 'Claude pro 自助充值 | iOS订阅充值', description: '自助充值', price: 150, deliveryType: 'AUTO' })
  ).split('自助充值').length === 2
)

console.log('\n【结构化数据 Product】')
const ld = productJsonLd(p()) as Record<string, any>
eq('@type', ld['@type'], 'Product')
eq('name', ld.name, 'Claude Max20x自助充值')
eq('sku 用商品 id', ld.sku, '3')
eq('货币是人民币', ld.offers.priceCurrency, 'CNY')
eq('价格两位小数的字符串', ld.offers.price, '1700.00')
eq('有库存 → InStock', ld.offers.availability, 'https://schema.org/InStock')
ok('offers.url 是绝对地址', String(ld.offers.url).startsWith('http'))
ok('image 有兜底（缺图时退回站标）', typeof ld.image === 'string' && ld.image.length > 0)
ok(
  '相对图片地址补成绝对地址',
  (() => {
    const img = String((productJsonLd(p({ image: '/uploads/products/product-3.jpg' })) as any).image)
    return /^https?:\/\//.test(img) && img.endsWith('/uploads/products/product-3.jpg')
  })()
)
// 后台可以直接贴外链图片；absUrl 会拼出 https://bigolab.com/https://… 这种坏地址
eq(
  '绝对图片地址原样保留（不重复加域名前缀）',
  (productJsonLd(p({ image: 'https://cdn.example.com/a.jpg' })) as any).image,
  'https://cdn.example.com/a.jpg'
)
eq(
  '协议相对地址补成 https',
  (productJsonLd(p({ image: '//cdn.example.com/a.jpg' })) as any).image,
  'https://cdn.example.com/a.jpg'
)
eq('分类带上', ld.category, 'Claude')

eq('stock=0 → OutOfStock', (productJsonLd(p({ stock: 0 })) as any).offers.availability, 'https://schema.org/OutOfStock')
eq(
  'stock=-1 视为无限库存 → InStock',
  (productJsonLd(p({ stock: -1 })) as any).offers.availability,
  'https://schema.org/InStock'
)

/*
 * 【绝不能输出评分】站上没有真实评价体系，为富摘要编一个 aggregateRating
 * 是最典型的结构化数据造假，会吃人工处罚，且影响整个域名而不止这一页。
 */
ok('没有 aggregateRating', !('aggregateRating' in ld))
ok('没有 review', !('review' in ld))

console.log('\n【地址】')
eq('canonical 路径不带任何查询参数', productPath(3), '/products/3')
ok('productUrl 是绝对地址', productUrl(3).startsWith('http') && productUrl(3).endsWith('/products/3'))

/*
 * canonical 存在的理由：推广人分享的是 /products/3?ref=CODE，
 * 而带 ref 时接口返回的是专属价（线上有商品是 1700 → 1800）。
 * 不声明 canonical，Google 可能收录带 ref 的副本，
 * 搜索结果里显示的价格比官网还贵。
 */
ok('canonical 里不含 ref', !productPath(3).includes('ref'))

console.log('\n【发账号信息的自动发货商品不写「卡密自助兑换」】')
{
  const acc = productDescription({
    id: 24,
    name: '谷歌邮箱成品号 | 2020-2025年注册 | 2FA登录方式',
    description: '成品号',
    price: 30,
    stock: 3,
    deliveryType: 'AUTO',
    accountLike: true,
  })
  ok('账号类：不出现「兑换」', !acc.includes('兑换'), acc)
  ok('账号类：写明发放账号信息', acc.includes('账号信息'), acc)
  const redeem = productDescription({ id: 4, name: 'ChatGPT Plus 信用卡冲', description: '', price: 135, stock: 5, deliveryType: 'AUTO' })
  ok('充值类（未标 accountLike）：仍是卡密自助兑换', redeem.includes('卡密自助兑换'), redeem)
}

console.log('\n【IndexNow 密钥校验】')
ok('未配置时返回 null', (() => { delete process.env.INDEXNOW_KEY; return indexNowKey() === null })())
ok('非法字符被拒', (() => { process.env.INDEXNOW_KEY = 'zzzz----'; return indexNowKey() === null })())
ok('太短被拒', (() => { process.env.INDEXNOW_KEY = 'abc'; return indexNowKey() === null })())
ok('合法 32 位十六进制通过', (() => { process.env.INDEXNOW_KEY = 'a'.repeat(32); return indexNowKey() === 'a'.repeat(32) })())

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
