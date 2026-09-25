/**
 * 到账通知金额解析的纯函数自检（不连库）：npx tsx scripts/check-amount-parse.ts
 * 带期望值断言，不符就 exitCode=1。改 lib/vmq.ts 的 STRONG_SIGNAL / BROADCAST_HINT / parseAmountDetailed 后必跑。
 */
import { parseAmountDetailed, detectChannel } from '../src/lib/vmq'

// 期望：'取用 X' 或 '拒绝 reason'
const cases: [string, string, string][] = [
  ['①上一笔播报（必须拒绝）', '上一笔播报：支付宝到账 1430.00 元。收钱提醒助手正在为您服务', '拒绝 broadcast_rejected'],
  ['②真实到账（必须取用）', '已转入余额 可兑1000收款免费额度>> 你已成功收款1430.00元（老顾客消费）', '取用 1430.00'],
  ['③两条混在一起（应取真实那条）', '你已成功收款1430.00元（老顾客消费） 支付宝 已转入余额 可兑1000收款免费额度>> 你已成功收款1430.00元', '取用 1430.00'],
  ['④只有播报被拼接', '支付宝 上一笔播报：支付宝到账 88.00 元。收钱提醒助手正在为您服务 支付宝到账 88.00 元', '拒绝 broadcast_rejected'],
  ['⑤播报前缀+强信号（应拒绝）', '上一笔播报：你已成功收款999.00元', '拒绝 broadcast_rejected'],
  ['⑥微信到账', '微信支付 你已成功收款12.34元', '取用 12.34'],
  ['⑦无关通知', '您有一条新的系统消息，请注意查收', '拒绝 no_strong_signal'],
  ['⑧带千分位', '你已成功收款1,430.00元', '取用 1430.00'],
  ['⑨小额两位小数', '你已成功收款0.01元', '取用 0.01'],
  // 2026-06-08 线上 vmq_lastwebhook 原文（content + org + from 拼接后）：必须取到 800.00
  [
    '⑩线上真实样本',
    'com.eg.android.AlipayGphone 已转入余额 收钱1笔兑2包纸巾>> 你已成功收款800.00元（老顾客消费） UID：10219 2026-06-08 11:53:44 已转入余额 收钱1笔兑2包纸巾>> com.eg.android.AlipayGphone',
    '取用 800.00',
  ],
  ['⑪同额不同写法', '你已成功收款1430元 你已成功收款1430.00元', '取用 1430'],
  // 备注 / 昵称夹带了另一个「成功收款」金额：不能取第一个
  ['⑫两个不同金额（转人工）', '张三 备注：成功收款140.00元 你已成功收款0.01元（新顾客消费）', '拒绝 ambiguous'],
]

let failed = 0
for (const [name, text, expect] of cases) {
  const r = parseAmountDetailed(text)
  const got = r.ok ? `取用 ${r.amount}` : `拒绝 ${r.reason}`
  const pass = got === expect
  if (!pass) failed++
  const ch = detectChannel(text) === 1 ? '微信' : '支付宝'
  console.log(`${pass ? '✓' : '✗'} ${name.padEnd(24, '　')} => ${got}（${ch}）${pass ? '' : `  期望：${expect}`}`)
}

console.log(failed ? `\n${failed} 条不符合预期` : '\n全部符合预期')
if (failed) process.exitCode = 1
