/**
 * 库存档位自测。npx tsx scripts/check-stock-level.ts
 * 边界值最容易写错（1/2、5/6、10/11），逐个钉死。
 */
import { stockLevel, publicStock, STOCK_TONE_CLASS } from '../src/lib/stock-level'

let failed = 0
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) console.log('  ✓', name)
  else { failed++; console.log('  ✗', name, `\n      got = ${JSON.stringify(got)}\n      want= ${JSON.stringify(want)}`) }
}

console.log('档位边界：')
eq('-1 不限量', stockLevel(-1).label, '不限量')
eq('0  补货中', stockLevel(0).label, '补货中')
eq('1  即将售罄', stockLevel(1).label, '即将售罄')
eq('2  少量', stockLevel(2).label, '少量')
eq('5  少量（上边界）', stockLevel(5).label, '少量')
eq('6  充足（下边界）', stockLevel(6).label, '充足')
eq('10 充足（上边界）', stockLevel(10).label, '充足')
eq('11 大量（下边界）', stockLevel(11).label, '大量')
eq('999 大量', stockLevel(999).label, '大量')

console.log('\n可售判定：')
eq('0 不可售', stockLevel(0).available, false)
eq('-1 可售', stockLevel(-1).available, true)
eq('1 可售', stockLevel(1).available, true)
// -2 这种脏数据不该出现，但真出现了要按「不可售」处理，不能当成 -1 放行
eq('负数（非 -1）按不可售', stockLevel(-7).available, false)

console.log('\n绝不能泄露具体数量：')
for (const n of [1, 2, 3, 7, 42, 137, 1000]) {
  const l = stockLevel(n)
  eq(`stock=${n} 的文案里不含数字`, /\d/.test(l.label), false)
}

console.log('\n配色表完整：')
for (const tone of ['none', 'low', 'mid', 'high', 'unlimited'] as const) {
  eq(`${tone} 有对应类名`, typeof STOCK_TONE_CLASS[tone] === 'string' && STOCK_TONE_CLASS[tone].length > 0, true)
}

console.log('\n对外下发的量化库存（publicStock）不改变任何档位，也只落在代表值集合里：')
const REPS = new Set([-1, 0, 1, 5, 10, 11])
let diff = 0
for (let x = -3; x <= 60; x++) {
  const q = publicStock(x)
  if (JSON.stringify(stockLevel(q)) !== JSON.stringify(stockLevel(x)) || !REPS.has(q)) {
    diff++
    eq(`publicStock(${x})`, [q, stockLevel(q)], ['代表值之一', stockLevel(x)])
  }
}
eq('publicStock 在 -3..60 上与 stockLevel 档位完全一致', diff, 0)

console.log(failed === 0 ? '\n全部通过' : `\n失败 ${failed} 条`)
process.exit(failed === 0 ? 0 : 1)
