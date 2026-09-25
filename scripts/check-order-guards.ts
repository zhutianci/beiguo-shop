/**
 * 订单链路几处纯函数闸门的自检（不连库）：npx tsx scripts/check-order-guards.ts
 * 带期望值断言，不符就 exitCode=1。改下面这些函数后必跑：
 *  - lib/sms.ts appendRemark（Order.remark 截断到 255 字，保留最新内容，不切半个 emoji）
 *  - lib/referral.ts referralSellUnit（内推专属价低于当前基础价时按基础价成交）
 *  - lib/auth-throttle.ts ipKey（领券「每 IP 一张」按 IPv6 /64 聚合，IPv4 键值不变）
 */
import { appendRemark } from '../src/lib/sms'
import { referralSellUnit } from '../src/lib/referral'
import { ipKey } from '../src/lib/auth-throttle'

let failed = 0
function check(name: string, ok: boolean, detail = '') {
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail}`}`)
}

// ---------- appendRemark ----------
check('空备注直接返回新内容', appendRemark(null, '接码换号 1/3') === '接码换号 1/3')
check('短备注用「 | 」拼接', appendRemark('支付方式: 支付宝', 'x') === '支付方式: 支付宝 | x')
{
  const old = '旧'.repeat(300)
  const r = appendRemark(old, '【待退款】接码超时未收到验证码')
  check('超长后不超过 255 个字符', Array.from(r).length <= 255, `len=${Array.from(r).length}`)
  check('超长时保留最新内容（以新追加的结尾）', r.endsWith('【待退款】接码超时未收到验证码'))
}
{
  // 255 边界上放一个代理对（emoji 占 2 个 UTF-16 单元），截断不能切出孤立的代理项
  const old = '😀'.repeat(300)
  const r = appendRemark(old, 'abc')
  const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(r)
  check('emoji 不被切成半个代理对', !lone && Array.from(r).length === 255, `len=${Array.from(r).length}`)
}
{
  // 反复追加（模拟站长连点十几次「补发卡密」仍缺货）永远不超长
  let s: string | null = '支付方式: 支付宝'
  for (let i = 0; i < 30; i++) s = appendRemark(s, `卡密库存不足(已发${i}/10)，待人工补发`)
  check('连续追加 30 次仍不超过 255', Array.from(s!).length <= 255)
}

// ---------- referralSellUnit ----------
check('没设专属价 → 网站售价', referralSellUnit(null, 132, 135) === 135)
check('专属价 ≥ 基础价 → 原样', referralSellUnit(150, 132, 135) === 150)
check('专属价 = 基础价 → 原样', referralSellUnit(132, 132, 135) === 132)
check('基础价上调后旧专属价 → 抬到基础价', referralSellUnit(132, 140, 145) === 140)
check('按分比较，不被浮点噪声误判', referralSellUnit(100.1, 100.10000000000001, 120) === 100.1)
check('专属价可以高于网站价（推广人加价）', referralSellUnit(160, 132, 135) === 160)

// ---------- ipKey（领券 IP 限）----------
check('同一 /64 的两个 IPv6 地址聚合成同一个键', ipKey('2001:db8:1:2:aaaa::1') === ipKey('2001:DB8:1:2:bbbb:0:0:2'))
check('IPv6 聚合结果', ipKey('2001:db8:1:2:aaaa::1') === '2001:db8:1:2::/64', ipKey('2001:db8:1:2:aaaa::1'))
check('不同 /64 不同键', ipKey('2001:db8:1:2::1') !== ipKey('2001:db8:1:3::1'))
check('IPv4 原样（历史领取记录哈希不变）', ipKey('1.2.3.4') === '1.2.3.4')
check('IPv4-mapped 还原成 IPv4', ipKey('::ffff:1.2.3.4') === '1.2.3.4')
check('unknown 原样', ipKey('unknown') === 'unknown')

console.log(failed ? `\n${failed} 条不符合预期` : '\n全部符合预期')
if (failed) process.exitCode = 1
