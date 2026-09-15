/**
 * 卡密兑换的自测。**不连数据库、不发网络请求**。
 *   npx tsx scripts/check-redeem.ts
 *
 * 这条链路上错一次的代价都不小：
 *  · 凭据发错通道 = 把 Claude 的 sessionKey 发进 GPT 的接口
 *  · 状态映射错 = 让买家对着一张已经消耗掉的卡反复重试，或者以为废卡还能救
 *  · 文案透传 = 把上游品牌漏给买家
 * 这些 tsc 和 next build 一个都拦不住。
 */
import { __test } from '../src/lib/redeem/providers/sysa'
import { getProvider, hasProvider, listProvidersForAdmin, PUBLIC_SYSTEM_NAME } from '../src/lib/redeem/registry'
import { normalizeCdk, validCdkShape } from '../src/lib/redeem/service'

const { fieldsFor, pickAccountArgs, guideFor, STATE_BY_CODE, STATE_BY_USE_STATUS, MESSAGES, TERMINAL_CODES } = __test

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
function throws(name: string, fn: () => unknown) {
  try {
    fn()
    ok(name, false, '期望抛错但没有')
  } catch {
    ok(name, true)
  }
}

console.log('\n【注册表】')
ok('sysa 已注册', hasProvider('sysa'))
ok('大小写与空格容错', hasProvider(' SYSA '))
ok('未注册的平台返回 null', getProvider('sysz') === null)
ok('空值不炸', getProvider(null) === null && getProvider('') === null)
eq('对外系统名固定', PUBLIC_SYSTEM_NAME, '贝果科技 · AI会员自助充值系统')
ok('后台清单带 adminLabel', listProvidersForAdmin().some((p) => p.key === 'sysa' && p.label.length > 0))
ok('后台清单标出支持重绑', listProvidersForAdmin().find((p) => p.key === 'sysa')?.supportsRebind === true)

console.log('\n【卡密输入规范化】')
eq('去首尾空白', normalizeCdk('  ABC-DEF  '), 'ABC-DEF')
ok('保留中间连字符，不做任何改写', normalizeCdk('AAAAA-BBBBB-CCCCC') === 'AAAAA-BBBBB-CCCCC')
ok('空串不合法', !validCdkShape(''))
ok('超长不合法', !validCdkShape('x'.repeat(201)))
ok('含空格不合法（防把整段 JSON 当卡密提交）', !validCdkShape('ABC DEF'))
ok('含换行不合法', !validCdkShape('ABC\nDEF'))
ok('正常卡密合法', validCdkShape('AAAAA-BBBBB-CCCCC'))

console.log('\n【该让买家填什么】')
eq('claude_s 只要 sessionKey', fieldsFor('claude_s').map((f) => f.name), ['session_key'])
ok('claude_s 的 sessionKey 是必填', fieldsFor('claude_s')[0].required)
eq('grok 只要 uid', fieldsFor('grok').map((f) => f.name), ['uid'])
eq('claude 两条通道，推荐项在前', fieldsFor('claude').map((f) => f.name), ['session_key', 'uid'])
// 只看账号字段；force 是开关型，不属于「二选一」的那两条通道
eq(
  'gpt 两条账号通道，推荐项在前',
  fieldsFor('gpt').filter((f) => f.kind !== 'toggle').map((f) => f.name),
  ['session_json', 'uid']
)
ok('二选一的字段都不标必填（由 pickAccountArgs 兜底）', fieldsFor('claude').every((f) => !f.required))
ok('gpt 的账号字段同样都不标必填', fieldsFor('gpt').filter((f) => f.kind !== 'toggle').every((f) => !f.required))
ok('每个字段都有说明文案', ['claude', 'claude_s', 'gpt', 'grok'].every((a) =>
  fieldsFor(a as any).every((f) => f.help.length > 5)))

console.log('\n【凭据发往哪条通道】—— 发错就是把 Claude 的 sk 送进 GPT 接口')
eq('claude + sk → session_info', pickAccountArgs('claude', { session_key: 'sk-ant-sid-x' }), { session_info: 'sk-ant-sid-x' })
eq('claude + uid → uid', pickAccountArgs('claude', { uid: 'u-1' }), { uid: 'u-1' })
/*
 * 上游规定「两个都传时 session 优先、uid 被忽略」。
 * 我们**只发优先的那个**，不把两个都发过去 ——
 * 让买家以为填的 uid 生效、实际充到了 sk 对应的账号上，是最难解释的一类客诉。
 */
eq('claude 两者都填 → 只发 sk，不把 uid 一起发出去', pickAccountArgs('claude', { session_key: 'sk-ant-sid-x', uid: 'u-1' }), {
  session_info: 'sk-ant-sid-x',
})
eq('gpt + session JSON → session_info', pickAccountArgs('gpt', { session_json: '{"a":1}' }), { session_info: '{"a":1}' })
eq('gpt + uid → uid', pickAccountArgs('gpt', { uid: 'u-2' }), { uid: 'u-2' })
eq('gpt 两者都填 → 只发 session', pickAccountArgs('gpt', { session_json: '{"a":1}', uid: 'u-2' }), {
  session_info: '{"a":1}',
})
eq('claude_s 只认 sk', pickAccountArgs('claude_s', { session_key: 'sk-ant-sid-y', uid: 'ignored' }), {
  session_info: 'sk-ant-sid-y',
})
eq('grok 只认 uid', pickAccountArgs('grok', { uid: 'u-3', session_key: 'ignored' }), { uid: 'u-3' })

// 【绝不能把 claude 的 sessionKey 当成 gpt 的 session 发出去】字段名不同，走不到一起
eq('gpt 收到 session_key（填错框）不会被当成 session', pickAccountArgs('gpt', { session_key: 'sk-ant-sid-x', uid: 'u-9' }), {
  uid: 'u-9',
})

throws('claude 两个都没填 → 抛错而不是发空请求', () => pickAccountArgs('claude', {}))
throws('gpt 两个都没填 → 抛错', () => pickAccountArgs('gpt', {}))
throws('grok 没填 uid → 抛错', () => pickAccountArgs('grok', {}))
throws('claude_s 没填 sk → 抛错', () => pickAccountArgs('claude_s', {}))
throws('纯空白等于没填', () => pickAccountArgs('claude', { session_key: '   ', uid: '  ' }))

console.log('\n【状态映射】')
eq('待提交', STATE_BY_CODE['activation.ready'], 'READY')
eq('处理中', STATE_BY_CODE['activation.processing'], 'PROCESSING')
eq('已完成', STATE_BY_CODE['activation.completed'], 'COMPLETED')
/*
 * verify_failed = 充值已完成但未能二次确认到账。归到 COMPLETED 是刻意的：
 * 卡已经消耗、钱已经花了。归到 ERROR 会让买家以为可以再充一次，那是二次损失。
 */
eq('充值完成但未确认 → 仍算已完成，不能让买家再充一次', STATE_BY_CODE['activation.verify_failed'], 'COMPLETED')
eq('冷却', STATE_BY_CODE['activation.cooldown'], 'COOLDOWN')
eq('缺货', STATE_BY_CODE['stock.out_of_stock'], 'OUT_OF_STOCK')
eq('卡密不存在', STATE_BY_CODE['cdk.not_found'], 'NOT_FOUND')
ok('作废/异常/售后/换码 四种都归 VOID',
  ['cdk.voided', 'cdk.abnormal', 'cdk.after_sale_processed', 'cdk.exchanged'].every((c) => STATE_BY_CODE[c] === 'VOID'))

eq('use_status 0', STATE_BY_USE_STATUS[0], 'READY')
eq('use_status -1', STATE_BY_USE_STATUS[-1], 'PROCESSING')
eq('use_status 1', STATE_BY_USE_STATUS[1], 'COMPLETED')
eq('use_status -1000 已作废', STATE_BY_USE_STATUS[-1000], 'VOID')
ok('文档里的 8 个 use_status 全部覆盖',
  [0, -1, 1, -9, -999, -1000, -1001, -1002].every((v) => STATE_BY_USE_STATUS[v] !== undefined))

console.log('\n【能不能重试】—— 废卡和「稍后再试」必须分开')
ok('卡密不存在是终态', TERMINAL_CODES.has('cdk.not_found'))
ok('已作废是终态', TERMINAL_CODES.has('cdk.voided'))
ok('换码作废是终态', TERMINAL_CODES.has('cdk.exchanged'))
ok('需人工处理是终态', TERMINAL_CODES.has('provider.uncredited'))
ok('上游临时故障不是终态（应让买家重试）', !TERMINAL_CODES.has('provider.temporary_error'))
ok('凭据填错不是终态（改一下就能重来）', !TERMINAL_CODES.has('account.session_invalid'))
ok('10 分钟防重不是终态（换个号或等一会儿）', !TERMINAL_CODES.has('account.recent_activation_blocked'))

console.log('\n【文案：不透传上游，也不泄漏货源】')
const docCodes = [
  'activation.ready', 'activation.processing', 'activation.completed', 'activation.cooldown',
  'stock.out_of_stock', 'provider.temporary_error', 'activation.verify_failed', 'provider.uncredited',
  'cdk.not_found', 'cdk.voided', 'cdk.abnormal', 'cdk.after_sale_processed', 'cdk.exchanged',
  'input.uid_required', 'input.uid_invalid', 'input.session_required',
  'account.session_invalid', 'account.workspace_not_supported', 'account.plan_not_allowed',
  'account.recent_activation_blocked', 'account.not_submittable', 'account.idv_required',
  'account.billing_abnormal', 'account.bind_error',
  'gift.not_found', 'gift.inactive', 'gift.unsupported_app', 'server.internal_error',
]
const missing = docCodes.filter((c) => !MESSAGES[c])
ok(`文档里的 ${docCodes.length} 个激活机器码都有自己的中文文案`, missing.length === 0, `缺：${missing.join(', ')}`)

const rebindCodes = [
  'rebind.success', 'rebind.uid_mismatch', 'rebind.order_not_found', 'rebind.not_claude',
  'rebind.no_receipt', 'rebind.session_expired', 'rebind.idv_required', 'rebind.billing_abnormal',
  'rebind.receipt_invalid', 'rebind.account_error', 'rebind.no_entitlement',
  'rebind.transaction_lose_oid', 'rebind.account_disabled', 'rebind.failed',
  'rebind.processing', 'rebind.cooldown',
]
const missingRebind = rebindCodes.filter((c) => !MESSAGES[c])
ok(`文档里的 ${rebindCodes.length} 个重绑机器码都有文案`, missingRebind.length === 0, `缺：${missingRebind.join(', ')}`)

// 货源保护：任何一条买家可见的文案都不能出现上游的品牌或域名
const leaky = Object.entries(MESSAGES).filter(([, v]) => /redeemgpt|gift|礼物/i.test(v))
ok('文案里不出现上游品牌/域名/内部术语', leaky.length === 0, leaky.map(([k]) => k).join(', '))

console.log('\n【取号指引】—— 两个产品路径不同，所以必须按产品给')
eq('Claude 是 6 步', guideFor('claude').steps.length, 6)
eq('claude_s 与 claude 共用同一套', guideFor('claude_s').steps.length, 6)
eq('ChatGPT 是 4 步', guideFor('gpt').steps.length, 4)
ok('每一步都有标题和说明', ['claude', 'gpt', 'grok'].every((a) =>
  guideFor(a as any).steps.every((st: any) => st.title.length > 1 && st.detail.length > 5)))
ok('Claude 指引指向 claude.ai', guideFor('claude').steps.some((st: any) => st.link?.url.includes('claude.ai')))
ok('ChatGPT 指引给出 session 取值地址',
  guideFor('gpt').steps.some((st: any) => st.link?.url === 'https://chatgpt.com/api/auth/session'))
ok('指引里不出现上游品牌',
  ['claude', 'claude_s', 'gpt', 'grok'].every((a) =>
    !/redeemgpt/i.test(JSON.stringify(guideFor(a as any)))))

console.log('\n【GPT 强制充值 force】—— 账号已有订阅时的唯一出路')
ok('gpt 的字段里有 force 开关', fieldsFor('gpt').some((f) => f.name === 'force' && f.kind === 'toggle'))
ok('force 不是必填', fieldsFor('gpt').find((f) => f.name === 'force')?.required === false)
ok('force 文案讲清代价（剩余时间作废）',
  /作废|放弃/.test(fieldsFor('gpt').find((f) => f.name === 'force')?.help || ''))
ok('只有 gpt 有 force', ['claude', 'claude_s', 'grok'].every((a) =>
  !fieldsFor(a as any).some((f) => f.name === 'force')))

eq('勾了 force + session → 带上 force=1', pickAccountArgs('gpt', { session_json: '{"a":1}', force: '1' }), {
  session_info: '{"a":1}', force: '1',
})
eq('没勾 force → 不带这个参数', pickAccountArgs('gpt', { session_json: '{"a":1}' }), { session_info: '{"a":1}' })
// force 对 UID 直充无意义，上游也不参与 plan 校验，带上去只是噪音
eq('UID 直充不带 force', pickAccountArgs('gpt', { uid: 'u-1', force: '1' }), { uid: 'u-1' })
// 【只勾 force 不填账号，必须抛错】否则会带着空凭据提交上去
throws('只勾 force 不填账号 → 抛错', () => pickAccountArgs('gpt', { force: '1' }))

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
