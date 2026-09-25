/**
 * 快捷回复令牌（lib/quick-reply）与财务操作令牌（lib/action-token）自测，审计 G10。**不连数据库**。
 *   npx tsx scripts/check-action-tokens.ts
 *
 * 重点钉：密钥仍是 JWT_SECRET 原值（刻意不换派生子密钥，理由见 lib/quick-reply），上线前已发出的链接照常可用；
 * 同密钥的登录 JWT 靠格式白名单挡住、不能当令牌用；两类令牌不能互换；篡改 / 过期一律拒；密钥未配置时 fail closed。
 */
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { issueQuickReplyToken, verifyQuickReplyToken } from '../src/lib/quick-reply'
import { issueActionToken, verifyActionToken } from '../src/lib/action-token'

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

const ROOT = 'check-action-tokens-secret-0123456789abcdef0123456789'
process.env.JWT_SECRET = ROOT

const realNow = Date.now
let clock = Date.UTC(2026, 8, 26) // 2026-09-26
Date.now = () => clock

const rootSign = (payload: string) => crypto.createHmac('sha256', ROOT).update(payload).digest('base64url')
const flip = (t: string) => t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A')

console.log('\n快捷回复令牌：')
{
  const t = issueQuickReplyToken(123)
  const c = verifyQuickReplyToken(t)
  ok('新签发可验过', c?.orderId === 123, t)
  const [id, exp, sig] = t.split('.')
  ok('新签发与上线前的旧格式一致（同一把密钥）', sig === rootSign(`${id}.${exp}`))
  ok('改一位签名被拒', verifyQuickReplyToken(flip(t)) === null)
  ok('改 orderId 被拒', verifyQuickReplyToken(`124.${exp}.${sig}`) === null)

  const oldPayload = `77.${(clock + 7 * 86400_000).toString(36)}`
  ok('上线前已发出的链接照常可用', verifyQuickReplyToken(`${oldPayload}.${rootSign(oldPayload)}`)?.orderId === 77)

  const jwtTok = jwt.sign({ userId: 1, email: 'a@b.c', role: 'ADMIN' }, ROOT)
  ok('登录 JWT 不能当快捷回复令牌', verifyQuickReplyToken(jwtTok) === null)
  // 就算把 JWT 各段截短拼成 3 段、长度过关，header 也不是纯数字
  const [h, p, s] = jwtTok.split('.')
  ok('JWT 各段拼成的短令牌也被格式白名单拒', verifyQuickReplyToken(`${h.slice(0, 20)}.${p.slice(0, 8)}.${s}`) === null)

  const short = issueQuickReplyToken(5, 1000)
  clock += 1001
  ok('过期被拒', verifyQuickReplyToken(short) === null)
  clock = Date.UTC(2026, 8, 26)
}

console.log('\n财务操作令牌：')
{
  const t = issueActionToken('invoice', 'pending', 3 * 86400_000)
  const c = verifyActionToken('invoice', t)
  ok('新签发可验过', c?.subject === 'pending', t)
  ok('改一位签名被拒', verifyActionToken('invoice', flip(t)) === null)
  const oldPayload = `invoice.pending.${(clock + 3 * 86400_000).toString(36)}`
  ok('上线前已发给财务的链接照常可用', verifyActionToken('invoice', `${oldPayload}.${rootSign(oldPayload)}`)?.subject === 'pending')
  ok('快捷回复令牌不能当财务令牌', verifyActionToken('invoice', issueQuickReplyToken(1)) === null)
  ok('财务令牌不能当快捷回复令牌', verifyQuickReplyToken(t) === null)
  ok('登录 JWT 不能当财务令牌', verifyActionToken('invoice', jwt.sign({ userId: 1 }, ROOT)) === null)
  let threw = false
  try {
    issueActionToken('invoice', 'a.b', 1000)
  } catch {
    threw = true
  }
  ok('subject 带点号拒绝签发（否则签得出验不过）', threw)
  const short = issueActionToken('invoice', 'pending', 1000)
  clock += 1001
  ok('过期被拒', verifyActionToken('invoice', short) === null)
}

console.log('\n密钥未配置：')
{
  process.env.JWT_SECRET = ''
  ok('验签返回 null 而不是抛错（接口回 403 而非 500）', verifyQuickReplyToken('1.abc.' + 'A'.repeat(43)) === null)
  let threw = false
  try {
    issueQuickReplyToken(1)
  } catch {
    threw = true
  }
  ok('签发抛错（notifyBuyerMessage 会 catch 回落到后台链接）', threw)
  process.env.JWT_SECRET = ROOT
}

Date.now = realNow
console.log(`\n${pass} 通过，${fail} 失败`)
if (fail) process.exit(1)
