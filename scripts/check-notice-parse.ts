/**
 * 到账通知解析（lib/vmq-notice.ts parseNotice）的纯函数自检：npx tsx scripts/check-notice-parse.ts
 * 带期望值断言，不符就 exitCode=1。改 vmq-notice.ts 的任何正则后必跑。样本说明：
 *  · 支付宝：线上 vmq_unmatched 里的真实原文（2026-09-28 ～ 10-18，24 条全部是「包名 / 已转入余额… / 你已成功收款X元」）；
 *  · 微信：2026-10-18 站长推送的两条「[3条]微信收款助手: 微信支付收款0.01元(朋友到店)」按 SmsForwarder [content] 格式拼出；
 *  · 伪造：聊天消息冒充到账、来源不对、来源缺失。
 */
import { parseNotice, parseAlipayLoose, parseWechatLoose } from '../src/lib/vmq-notice'

const ALI = 'com.eg.android.AlipayGphone'
const WX = 'com.tencent.mm'
// 路由拼出来的 content = [content] + ' ' + [org_content] + ' ' + [from]
const ali = (title: string, text: string, time = '2026-10-18 03:27:26') =>
  `${ALI}\n${title}\n${text}\nUID：10297\n${time} ${title} ${ALI}`
const wx = (title: string, text: string, time = '2026-10-18 08:53:40') => `${WX}\n${title}\n${text}\nUID：10180\n${time} ${text} ${WX}`

type Want = string // 'ok alipay 5.40' | 'reject <reason>'
const cases: [string, string, string | null, Want][] = [
  // ---- 支付宝：线上真实样本 ----
  ['10-18 事故原文（标题含「收款助手」，必须判支付宝）', ali('已转入余额 开启收款助手，首页就能查账>>', '你已成功收款5.40元（新顾客消费）'), ALI, 'ok alipay 5.40'],
  ['老顾客', ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款135.00元（老顾客消费）'), ALI, 'ok alipay 135.00'],
  ['「元.」结尾', ali('已转入余额 做生意收钱提现免费>>', '你已成功收款8.10元.'), ALI, 'ok alipay 8.10'],
  ['标题带数字和逗号', ali('已转入余额 你有1,280积分可使用，去看看>>', '你已成功收款950.00元（新顾客消费）'), ALI, 'ok alipay 950.00'],
  ['千分位金额', ali('已转入余额 免费自提下单工具>>', '你已成功收款3,400.00元（老顾客消费）'), ALI, 'ok alipay 3400.00'],
  ['上一笔播报（拒绝）', `${ALI}\n上一笔播报：支付宝到账 135.00 元\n收钱提醒助手正在为您服务\nUID：10297\n2026-10-18 09:00:00`, ALI, 'reject broadcast_rejected'],
  ['请调高媒体音量（拒绝）', ali('请调高媒体音量', '收钱语音提醒暂无法为您服务'), ALI, 'reject no_strong_signal'],
  // ---- 支付宝：伪造 ----
  ['聊天消息冒充（标题是对方昵称）', ali('张三', '你已成功收款5.40元（新顾客消费）'), ALI, 'reject bad_template'],
  ['聊天消息：正文里自己写了「已转入余额」', ali('张三', '已转入余额\n你已成功收款5.40元'), ALI, 'reject bad_template'],
  ['聊天消息：多行正文里把整段到账通知抄一遍', ali('张三', `x\n${ALI}\n已转入余额 查看今天有多少新老顾客>>\n你已成功收款5.40元（新顾客消费）`), ALI, 'reject bad_template'],
  ['昵称夹带另一个金额（转人工）', ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款0.01元（新顾客消费） 备注：成功收款140.00元'), ALI, 'reject ambiguous'],
  ['来源是短信（拒绝）', ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款5.40元'), '10690000', 'reject untrusted_source'],
  ['来源缺失（拒绝）', ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款5.40元'), null, 'reject untrusted_source'],
  ['来源是未替换的 [from]（拒绝）', ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款5.40元'), '[from]', 'reject untrusted_source'],
  ['来源说是微信、内容是支付宝（拒绝：微信格式里没有这笔）', ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款5.40元'), WX, 'reject no_strong_signal'],
  ['来源说是支付宝、正文第一行是微信包名（格式不对）', wx('已转入余额 x>>', '你已成功收款5.40元'), ALI, 'reject bad_template'],
  // ---- 微信 ----
  ['微信收款（合并通知）', wx('微信收款助手', '[3条]微信收款助手: 微信支付收款0.01元(朋友到店)'), WX, 'ok wechat 0.01'],
  ['微信收款（单条）', wx('微信收款助手', '微信支付收款1.00元(朋友到店)'), WX, 'ok wechat 1.00'],
  ['微信收款（全角冒号）', wx('微信收款助手', '[2条]微信收款助手：微信支付收款1,200.50元(老顾客消费)'), WX, 'ok wechat 1200.50'],
  ['微信：好友冒充（标题是好友名）', wx('李四', '微信支付收款5.40元(朋友到店)'), WX, 'reject bad_template'],
  ['微信：群聊里冒充（标题是群名）', wx('卡密交流群', '[2条]微信收款助手: 微信支付收款5.40元(朋友到店)'), WX, 'reject bad_template'],
  ['微信：多行正文里把整段通知抄一遍', wx('李四', `${WX}\n微信收款助手\n微信支付收款5.40元(朋友到店)`), WX, 'reject bad_template'],
  ['微信：两个金额（转人工）', wx('微信收款助手', '微信支付收款5.40元 微信支付收款9.90元'), WX, 'reject ambiguous'],
  ['微信：普通消息', wx('张三', '在吗'), WX, 'reject no_strong_signal'],
  ['微信：来源是支付宝包名（拒绝）', wx('微信收款助手', '微信支付收款1.00元(朋友到店)'), ALI, 'reject no_strong_signal'],
  // ---- 10-18 站长那两条测试推送：手机端模板配错，[content] / [from] 没被替换 ----
  ['模板配错（content 是字面量 [content]）', '[content] [3条]微信收款助手: 微信支付收款0.01元(朋友到店)', '[from]', 'reject untrusted_source'],
  ['空内容', '   ', ALI, 'reject empty'],
]

let failed = 0
for (const [name, text, from, want] of cases) {
  const r = parseNotice(text, from)
  const got = r.ok ? `ok ${r.channel} ${r.amount}` : `reject ${r.reason}`
  const pass = got === want
  if (!pass) failed++
  console.log(`${pass ? '✓' : '✗'} ${name}${pass ? '' : `\n    得到：${got}\n    期望：${want}`}`)
}

// 认不出来源时，告警里要带上能认出的金额
const u = parseNotice(ali('已转入余额 查看今天有多少新老顾客>>', '你已成功收款5.40元'), null)
const okAmounts = !u.ok && u.reason === 'untrusted_source' && JSON.stringify(u.amounts) === '["5.40"]'
if (!okAmounts) failed++
console.log(`${okAmounts ? '✓' : '✗'} 来源不明：告警里带上金额 5.40`)
// 格式不对：只带金额给人工，不给 ok
const b = parseNotice(ali('张三', '你已成功收款5.40元'), ALI)
const okBad = !b.ok && b.reason === 'bad_template' && b.channel === 'alipay' && JSON.stringify(b.amounts) === '["5.40"]'
if (!okBad) failed++
console.log(`${okBad ? '✓' : '✗'} 格式不对：进人工时带上渠道与金额`)
// 宽松解析与原 parseAmountDetailed 一致（check-amount-parse.ts 里那 12 条照样跑），这里只抽两条
const l1 = parseAlipayLoose('已转入余额 可兑1000收款免费额度>> 你已成功收款1430.00元（老顾客消费）')
const l2 = parseWechatLoose('微信支付收款0.01元(朋友到店)')
const okLoose = l1.ok && l1.amount === '1430.00' && l2.ok && l2.amount === '0.01'
if (!okLoose) failed++
console.log(`${okLoose ? '✓' : '✗'} 宽松解析：支付宝 1430.00 / 微信 0.01`)

console.log(failed ? `\n${failed} 条不符合预期` : '\n全部符合预期')
if (failed) process.exitCode = 1
