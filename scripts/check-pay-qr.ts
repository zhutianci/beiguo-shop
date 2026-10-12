/**
 * 收银台收款码配置的纯函数自检（不连库）：npx tsx scripts/check-pay-qr.ts
 * 带期望值断言，不符就 exitCode=1。改 lib/pay-qr-base.ts 后必跑。
 */
import {
  BUILTIN_QR_ID,
  BUILTIN_QR_URL,
  PAY_QR_HISTORY_MAX,
  PAY_QR_MAX_ITEMS,
  PayQrError,
  activatePayQr,
  activePayQrUrl,
  addPayQr,
  emptyPayQrState,
  isCashierQrUrl,
  isValidPayQrUrl,
  normalizePayQrLabel,
  parsePayQrState,
  payQrLabel,
  removePayQr,
  type PayQrItem,
} from '../src/lib/pay-qr-base'

let failed = 0
function ok(name: string, cond: boolean, extra = '') {
  if (!cond) failed++
  console.log(`${cond ? '✓' : '✗'} ${name}${cond || !extra ? '' : `  —— ${extra}`}`)
}
function throws(fn: () => unknown, code: PayQrError['code']): boolean {
  try {
    fn()
    return false
  } catch (e) {
    return e instanceof PayQrError && e.code === code
  }
}

const URL_A = '/uploads/payqr/mfx2k1ab-0a1b2c3d4e5f.png'
const URL_B = '/uploads/payqr/mfx2k1ac-aabbccddeeff.jpg'
const item = (id: string, label: string, url: string): PayQrItem => ({ id, label, url, addedAt: 1_700_000_000_000, addedBy: 1 })
const A = item('0a1b2c3d4e5f', '主号 尾号 1234', URL_A)
const B = item('aabbccddeeff', '备用号', URL_B)

console.log('【地址与名称格式】')
ok('服务端生成的文件名：通过', isValidPayQrUrl(URL_A) && isValidPayQrUrl(URL_B))
ok('别的目录 / 带 ../ / 外链 / svg / gif：一律不认',
  ![
    '/uploads/contact/mfx2k1ab-0a1b2c3d4e5f.png',
    '/uploads/payqr/../forum/mfx2k1ab-0a1b2c3d4e5f.png',
    'https://evil.example/uploads/payqr/mfx2k1ab-0a1b2c3d4e5f.png',
    '//evil.example/uploads/payqr/mfx2k1ab-0a1b2c3d4e5f.png',
    '/uploads/payqr/mfx2k1ab-0a1b2c3d4e5f.svg',
    '/uploads/payqr/mfx2k1ab-0a1b2c3d4e5f.gif',
    '/uploads/payqr/a.png',
    '/uploads/payqr/mfx2k1ab-0a1b2c3d4e5f.png?x=1',
  ].some(isValidPayQrUrl))
ok('收银台只认内置码或 payqr 下的地址', isCashierQrUrl(BUILTIN_QR_URL) && isCashierQrUrl(URL_A) && !isCashierQrUrl('/wechat-qr.jpg') && !isCashierQrUrl(null))
ok('名称：去首尾空白；空 / 超过 30 字 / 带尖括号 / 非字符串 → 不收',
  normalizePayQrLabel('  备用号 ') === '备用号' &&
    normalizePayQrLabel('') === null &&
    normalizePayQrLabel('   ') === null &&
    normalizePayQrLabel('x'.repeat(31)) === null &&
    normalizePayQrLabel('<b>号</b>') === null &&
    normalizePayQrLabel(123) === null)

console.log('\n【读配置】')
ok('从没配置过 → 内置码', activePayQrUrl(parsePayQrState(null)) === BUILTIN_QR_URL && parsePayQrState(undefined).activeId === BUILTIN_QR_ID)
const good = JSON.stringify({ activeId: A.id, items: [A, B], switchedAt: 5, history: [{ at: 5, from: BUILTIN_QR_ID, to: A.id, by: 1 }] })
ok('正常配置 → 生效的那一张', activePayQrUrl(parsePayQrState(good)) === URL_A && parsePayQrState(good).items.length === 2)
ok('不是 JSON → 抛 CORRUPT（不回落内置码）', throws(() => parsePayQrState('{oops'), 'CORRUPT'))
ok('结构不对（数组 / 缺 items）→ 抛 CORRUPT', throws(() => parsePayQrState('[]'), 'CORRUPT') && throws(() => parsePayQrState('{"activeId":"builtin"}'), 'CORRUPT'))
ok('生效的那张不在列表里 → 抛 CORRUPT', throws(() => parsePayQrState(JSON.stringify({ activeId: A.id, items: [B] })), 'CORRUPT'))
const evil = { ...A, url: 'https://evil.example/qr.png' }
ok('生效的那张地址不合规（被人改过库）→ 丢掉它 → 抛 CORRUPT', throws(() => parsePayQrState(JSON.stringify({ activeId: A.id, items: [evil, B] })), 'CORRUPT'))
const mixed = parsePayQrState(JSON.stringify({ activeId: B.id, items: [evil, B, B, { id: 'x' }], history: 'oops' }))
ok('没在用的坏条目 / 重复条目：只丢掉它们', mixed.items.length === 1 && mixed.items[0].id === B.id && mixed.history.length === 0)

console.log('\n【新增 / 切换 / 删除】')
let s = addPayQr(emptyPayQrState(), A)
ok('新增一张：不改变当前生效的', s.items.length === 1 && s.activeId === BUILTIN_QR_ID && activePayQrUrl(s) === BUILTIN_QR_URL)
s = addPayQr(s, B)
const sw = activatePayQr(s, B.id, 7, 1000)
ok('切换到 B：立即生效、记一条历史', sw.changed && activePayQrUrl(sw.state) === URL_B && sw.state.switchedAt === 1000 &&
  sw.state.history.length === 1 && sw.state.history[0].from === BUILTIN_QR_ID && sw.state.history[0].to === B.id && sw.state.history[0].by === 7)
ok('再切一次同一张：changed=false、不记历史', !activatePayQr(sw.state, B.id, 7, 2000).changed && activatePayQr(sw.state, B.id, 7, 2000).state.history.length === 1)
ok('切到不存在的：抛 NOT_FOUND', throws(() => activatePayQr(sw.state, 'ffffffffffff', 7, 2000), 'NOT_FOUND'))
ok('切回内置码', activePayQrUrl(activatePayQr(sw.state, BUILTIN_QR_ID, 7, 3000).state) === BUILTIN_QR_URL)
ok('正在用的不能删', throws(() => removePayQr(sw.state, B.id), 'ACTIVE'))
ok('内置码不能删', throws(() => removePayQr(sw.state, BUILTIN_QR_ID), 'BUILTIN'))
const rm = removePayQr(sw.state, A.id)
ok('删掉没在用的 A：返回被删的那张、B 仍在用', rm.removed.url === URL_A && rm.state.items.length === 1 && activePayQrUrl(rm.state) === URL_B)
ok('已删除的码按 id 显示「已删除」', payQrLabel(rm.state, A.id).startsWith('已删除') && payQrLabel(rm.state, BUILTIN_QR_ID) === '内置收款码' && payQrLabel(rm.state, B.id) === '备用号')
const swA = activatePayQr(sw.state, A.id, 7, 4000).state
const afterDel = parsePayQrState(JSON.stringify(removePayQr(activatePayQr(swA, BUILTIN_QR_ID, 7, 5000).state, A.id).state))
ok('切换记录带当时的名字：码删掉后记录里仍是原名', afterDel.history.some((h) => h.to === A.id && h.toLabel === '主号 尾号 1234') && afterDel.history[0].fromLabel === '内置收款码')
let full = emptyPayQrState()
for (let i = 0; i < PAY_QR_MAX_ITEMS; i++) {
  const id = i.toString(16).padStart(12, '0')
  full = addPayQr(full, item(id, `码${i}`, `/uploads/payqr/mfx2k1ab-${id}.png`))
}
ok(`最多 ${PAY_QR_MAX_ITEMS} 张`, throws(() => addPayQr(full, A), 'FULL'))
ok('名称不合规的条目进不来', throws(() => addPayQr(emptyPayQrState(), { ...A, label: '<x>' }), 'BAD_LABEL'))
let many = s
for (let i = 0; i < PAY_QR_HISTORY_MAX + 5; i++) many = activatePayQr(many, i % 2 ? A.id : B.id, 1, i).state
ok(`切换历史只留最近 ${PAY_QR_HISTORY_MAX} 条`, many.history.length === PAY_QR_HISTORY_MAX)
ok('写回再读：一致', JSON.stringify(parsePayQrState(JSON.stringify(sw.state))) === JSON.stringify(sw.state))

console.log(failed ? `\n${failed} 条不符合预期` : '\n全部符合预期')
if (failed) process.exitCode = 1
