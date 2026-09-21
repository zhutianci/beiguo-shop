/**
 * 公开商品接口的字段白名单自测。
 *
 *   npx tsx scripts/check-product-api.ts
 *
 * 【为什么值得单开一个脚本】2026-09-21 线上实测，这两个接口曾经用 include 把整行
 * 发给外网，公开了 referrerBasePrice（内推底价，等于毛利）和 cardRedeemUrl（上游货源站）。
 * 这类错误不会报错、不会有人投诉、在页面上完全看不出来——只有同行会看见。
 * 所以要有一道断言：**新字段默认不许出现在公开响应里**，要出现必须有人明确加进白名单，
 * 而加的时候会看到这份清单旁边那句「这个值同行看到会怎样」。
 */
import { PUBLIC_PRODUCT_SELECT } from '../src/lib/product-select'

let failed = 0
function ok(name: string, cond: boolean, extra?: unknown) {
  if (cond) console.log('  ✓', name)
  else {
    failed++
    console.log('  ✗', name, extra === undefined ? '' : `\n      ${JSON.stringify(extra)}`)
  }
}

const keys = Object.keys(PUBLIC_PRODUCT_SELECT)

console.log('绝不能出现在公开响应里的字段：')
// 每一条都注明为什么敏感，避免后人觉得「加回去也没关系」
const FORBIDDEN: [string, string][] = [
  ['referrerBasePrice', '内推底价，和售价一比就是毛利'],
  ['cardRedeemUrl', '上游货源站地址'],
  ['redeemProvider', '走的哪家兑换通道'],
  ['apiSku', '上游商品编号'],
  ['smsService', '接码通道名'],
  ['smsMaxPrice', '接码成本上限'],
  ['smsCountry', '接码国家配置'],
  ['cardUsage', '内部发货说明，正文里有上游域名和明文 IP:端口'],
  ['status', '上架状态，判断用，不必发给前台'],
  ['createdAt', '无用途，且能被拿来推算上架节奏'],
  ['updatedAt', '同上'],
]
for (const [k, why] of FORBIDDEN) {
  ok(`不含 ${k}（${why}）`, !keys.includes(k))
}

console.log('\n前台真正要用的字段一个都不能少：')
// 取自 home-client / products-client / product-client 三个 interface 的并集
const REQUIRED = [
  'id',
  'categoryId',
  'name',
  'description',
  'price',
  'originalPrice',
  'features',
  'stock',
  'sales',
  'deliveryType',
  'category',
]
for (const k of REQUIRED) {
  ok(`含 ${k}`, keys.includes(k))
}

console.log('\n结构：')
ok('category 是嵌套 select，不是 true（true 会把整行分类表带出去）',
  typeof (PUBLIC_PRODUCT_SELECT as Record<string, unknown>).category === 'object')
ok('category 只取 id 与 name',
  JSON.stringify((PUBLIC_PRODUCT_SELECT as { category: unknown }).category) ===
    JSON.stringify({ select: { id: true, name: true } }))

console.log(failed === 0 ? '\n全部通过' : `\n失败 ${failed} 条`)
process.exit(failed === 0 ? 0 : 1)
