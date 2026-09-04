/**
 * 金额逻辑自测（纯函数，不需要数据库）：
 *   npx tsx scripts/check-money.ts
 *
 * splitAmount 决定每张卡密的售价与利润，算错是静默的（报表数字看起来"合理"但对不上账），
 * 所以这里逐条断言「各卡售价之和必须精确等于订单金额」。
 */
import { splitAmount, round2 } from '../src/lib/money'
import { rmbCapital } from '../src/lib/rmb'

let failed = 0
function assert(ok: boolean, name: string, detail = '') {
  if (ok) {
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name} ${detail}`)
  }
}

console.log('\n[splitAmount] 一单多卡的售价分摊')
const splitCases: [number, number][] = [
  [100, 3],
  [150, 1],
  [0.03, 2],
  [1580, 7],
  [0.01, 1],
  [999.99, 4],
  [145, 6],
]
for (const [total, parts] of splitCases) {
  const arr = splitAmount(total, parts)
  const sum = arr.reduce((a, b) => a + b, 0)
  // 用「分」比较，避免浮点误差把正确结果判成错误
  const ok = Math.round(sum * 100) === Math.round(total * 100) && arr.length === parts
  assert(ok, `${total} 拆 ${parts} 份 => [${arr.join(', ')}] 合计 ${round2(sum)}`, `期望合计 ${total}`)
}
assert(splitAmount(100, 0).length === 0, '份数为 0 时返回空数组')

console.log('\n[splitAmount] 每份都不为负、且差额不超过 1 分')
{
  const arr = splitAmount(100, 3)
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  assert(min >= 0, '没有负数份额')
  assert(Math.round((max - min) * 100) <= 1, '最大份与最小份相差不超过 1 分')
}

console.log('\n[rmbCapital] 收据金额大写')
const rmbCases: [number, string][] = [
  [0, '零元整'],
  [1, '壹元整'],
  [10, '壹拾元整'],
  [1430, '壹仟肆佰叁拾元整'], // 末尾零不读
  [100.5, '壹佰元伍角'],
  [0.01, '零元零壹分'],
  [1004, '壹仟零肆元整'], // 内部连续零合并成一个
  [1040, '壹仟零肆拾元整'],
  [10001, '壹万零壹元整'], // 组间缺高位要补零
  [105000, '壹拾万伍仟元整'], // 低组满四位则不补零
  [100010000, '壹亿零壹万元整'],
  [100000001, '壹亿零壹元整'],
  [1580.06, '壹仟伍佰捌拾元零陆分'], // 有分无角，中间读零
  [1580.66, '壹仟伍佰捌拾元陆角陆分'],
  [-99.9, '负玖拾玖元玖角'],
]
for (const [n, expect] of rmbCases) {
  const got = rmbCapital(n)
  assert(got === expect, `${n} => ${got}`, `期望 ${expect}`)
}

console.log('\n[round2] 浮点收敛')
assert(round2(0.1 + 0.2) === 0.3, '0.1 + 0.2 => 0.3')
assert(round2(1580 * 0.06) === 94.8, '1580 × 0.06 => 94.8（发票税费口径）')

console.log(failed === 0 ? '\n全部通过 ✅\n' : `\n${failed} 项未通过 ❌\n`)
process.exit(failed === 0 ? 0 : 1)
