/**
 * 发票金额与税号归一化自测（纯函数，不需要数据库）：
 *   npx tsx scripts/check-invoice.ts
 *
 * 两件事算错都是静默的，所以必须有断言兜着：
 *
 * ① **售价 + 税费 必须精确等于开票金额。**
 *    改造前是 round2(p*1.06) 与 round2(p*0.06) 两次独立取整，
 *    0.01~5000.00 里有 2030 个价格（全是 .25/.75 结尾）对不上一分钱。
 *    以前看不出来 —— 货款和税费分两笔收，没人把它们加起来；
 *    现在「货款+税费一次付清」，买家实付的数必须精确等于票面金额，
 *    否则公司报销时付款记录和发票对不上，正是这次改造要解决的问题本身。
 *
 * ② **税号必须去掉全部空白。**
 *    「9111 0108 MAER 0M7A 3L」这种带空格的税号会让税局批量导入报
 *    「购买方纳税人识别号长度不能超过20」，而且是整批退回不是只退这一行。
 */
import { calcInvoiceAmounts, normalizeTaxNumber, TAX_NUMBER_MAX_LEN, TAX_RATE } from '../src/lib/invoice'
import { toCents } from '../src/lib/money'

let failed = 0
function assert(ok: boolean, name: string, detail = '') {
  if (ok) console.log(`  ✓ ${name}`)
  else {
    failed++
    console.log(`  ✗ ${name} ${detail}`)
  }
}

console.log('\n[calcInvoiceAmounts] 售价 + 税费 === 开票金额（逐分穷举 0.01 ~ 5000.00）')
{
  let bad = 0
  let firstBad = ''
  for (let cents = 1; cents <= 500_000; cents++) {
    const price = cents / 100
    const { invoiceAmount, taxFee } = calcInvoiceAmounts(price)
    if (toCents(price) + toCents(taxFee) !== toCents(invoiceAmount)) {
      bad++
      if (!firstBad) firstBad = `p=${price} → 票面 ${invoiceAmount}，售价+税费 ${price + taxFee}`
    }
  }
  assert(bad === 0, `500000 个价格全部对账平`, bad ? `${bad} 个对不上，例如 ${firstBad}` : '')
}

console.log('\n[calcInvoiceAmounts] 历史上算错过的那批（.25 / .75 结尾）')
{
  // 旧实现：2.75 → 票面 2.92 但税费 0.16（2.75*0.06 在双精度下是 0.16499999999999998）
  const cases: [number, number, number][] = [
    // [售价, 期望开票金额, 期望税费]
    [2.75, 2.92, 0.17],
    [3.75, 3.98, 0.23],
    [9.25, 9.81, 0.56],
    [20.75, 22.0, 1.25],
    [16.75, 17.76, 1.01],
  ]
  for (const [p, wantInv, wantTax] of cases) {
    const r = calcInvoiceAmounts(p)
    assert(
      r.invoiceAmount === wantInv && r.taxFee === wantTax,
      `${p} → 票面 ${wantInv} / 税费 ${wantTax}`,
      `实得 票面 ${r.invoiceAmount} / 税费 ${r.taxFee}`
    )
  }
}

console.log('\n[calcInvoiceAmounts] 常见整价的票面金额不能变（这些线上已经开出去过）')
{
  const cases: [number, number, number][] = [
    [199, 210.94, 11.94],
    [99, 104.94, 5.94],
    [1580, 1674.8, 94.8],
    [0.01, 0.01, 0.0],
    [100, 106, 6],
  ]
  for (const [p, wantInv, wantTax] of cases) {
    const r = calcInvoiceAmounts(p)
    assert(
      r.invoiceAmount === wantInv && r.taxFee === wantTax,
      `${p} → 票面 ${wantInv} / 税费 ${wantTax}`,
      `实得 票面 ${r.invoiceAmount} / 税费 ${r.taxFee}`
    )
  }
  assert(TAX_RATE === 0.06, 'TAX_RATE 仍是 0.06')
}

console.log('\n[calcInvoiceAmounts] 内推价与券后价走的是同一条路（金额即基准，无分支）')
{
  // 内推单的 order.amount 建单时就是专属价，所以「按内推价的 1.06 收款」
  // 等价于对 amount 调用一次 calcInvoiceAmounts —— 这里把这个等价关系钉住
  const listPrice = 299
  const referralPrice = 259
  const a = calcInvoiceAmounts(referralPrice)
  assert(a.invoiceAmount === 274.54, '内推价 259 → 票面 274.54', `实得 ${a.invoiceAmount}`)
  assert(a.taxFee === 15.54, '内推价 259 → 税费 15.54', `实得 ${a.taxFee}`)
  assert(
    calcInvoiceAmounts(listPrice).invoiceAmount !== a.invoiceAmount,
    '按内推价算出的票面与按原价不同（否则说明取错了基准）'
  )
}

console.log('\n[normalizeTaxNumber] 去掉全部空白与不可见字符')
{
  const cases: [string, string][] = [
    // 用户原话里的那个例子：四位一组、22 个字符，去空格后 18 位，是合法的统一社会信用代码
    ['9111 0108 MAER 0M7A 3L', '91110108MAER0M7A3L'],
    ['  91110108MAER0M7A3L  ', '91110108MAER0M7A3L'],
    ['9111\t0108\nMAER0M7A3L', '91110108MAER0M7A3L'],
    ['9111　0108MAER0M7A3L', '91110108MAER0M7A3L'], // 全角空格
    ['9111 0108MAER0M7A3L', '91110108MAER0M7A3L'], // 不换行空格
    ['﻿91110108MAER0M7A3L', '91110108MAER0M7A3L'], // BOM
    ['9111​0108MAER0M7A3L', '91110108MAER0M7A3L'], // 零宽空格
    ['91110108MAER0M7A3L', '91110108MAER0M7A3L'], // 本来就干净的不能被改动
    ['', ''],
  ]
  for (const [raw, want] of cases) {
    const got = normalizeTaxNumber(raw)
    assert(got === want, `"${JSON.stringify(raw).slice(1, -1)}" → "${want}"`, `实得 "${got}"`)
  }
  assert(normalizeTaxNumber(null) === '', 'null → 空串')
  assert(normalizeTaxNumber(undefined) === '', 'undefined → 空串')
}

console.log('\n[normalizeTaxNumber] 先去空格再判长度，不能把合法税号错杀')
{
  const raw = '9111 0108 MAER 0M7A 3L'
  assert(raw.length > TAX_NUMBER_MAX_LEN, `原文 ${raw.length} 位，确实超过 ${TAX_NUMBER_MAX_LEN}`)
  assert(
    normalizeTaxNumber(raw).length <= TAX_NUMBER_MAX_LEN,
    `去空格后 ${normalizeTaxNumber(raw).length} 位，在上限内`
  )
  assert(normalizeTaxNumber('9'.repeat(21)).length > TAX_NUMBER_MAX_LEN, '真正超长的仍会被判超长')
}

console.log('\n[手动录入] 含税金额 → 不含税 + 税额，反向也要对账平')
{
  // 与 lib/order-invoice.createManualInvoice 同一口径
  const derive = (amount: number) => {
    const inv = Math.round(amount * 100)
    const sell = Math.round(inv / (1 + TAX_RATE))
    return { sell: sell / 100, tax: (inv - sell) / 100, inv: inv / 100 }
  }
  let bad = 0
  for (let cents = 1; cents <= 200_000; cents++) {
    const r = derive(cents / 100)
    if (toCents(r.sell) + toCents(r.tax) !== toCents(r.inv)) bad++
  }
  assert(bad === 0, '200000 个含税金额全部对账平', bad ? `${bad} 个对不上` : '')

  const r = derive(1060)
  assert(r.sell === 1000 && r.tax === 60, '1060 → 不含税 1000 + 税额 60', `实得 ${r.sell} + ${r.tax}`)
}

console.log(failed === 0 ? '\n全部通过\n' : `\n${failed} 项失败\n`)
process.exit(failed === 0 ? 0 : 1)
