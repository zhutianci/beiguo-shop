/**
 * 2026-10-25 第三轮加固的纯逻辑自测（docs/安全-第三轮加固-1025.md）。**不连数据库**：
 *   npx tsx scripts/check-security-1025.ts
 *
 * 覆盖：无感人机验证（浏览器端纯 JS SHA-256 求解与服务端校验一致、签名 / 用途 / 过期 / 一次性 / 难度）、
 * 别名邮箱识别与归一、新密码强度、收款回调签名「验签即占位」、管理员受信设备开关口径、管理员密码连错锁定、
 * 探测计数不再被伪造的 Sec-Fetch-Site 绕开、收款金额永不分配整数原价（静态检查）。
 * 补单交易号、管理员会话绑设备、找回密码对管理员关闭等要连库 / 起服务的部分在 itest-security-1015.ts。
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-security-1025-secret-0123456789abcdef-0123456789'
process.env.DATABASE_URL = 'mysql://nobody:nobody@127.0.0.1:1/none'

import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'
import { checkPow, issuePowChallenge, leadingZeroBits, POW_BITS_NORMAL, resetPowForTest, solvePowForTest } from '../src/lib/security/pow'
import { powSolve } from '../src/lib/pow-client'
import { canonicalEmail, hasSubAddress, isGmail } from '../src/lib/security/email-canonical'
import { passwordProblem } from '../src/lib/security/password-policy'
import { createSignVerifier, smsForwarderSign } from '../src/lib/security/webhook-sign'
import { adminDeviceRequired } from '../src/lib/security/admin-device-policy'
import { adminPasswordLocked, noteAdminPasswordFailure } from '../src/lib/security/admin-2fa'
import { countableRequest } from '../src/lib/security/probe'

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

async function main() {
  console.log('\n无感人机验证（lib/security/pow + lib/pow-client）：')
  {
    const h = new Headers({ 'cf-connecting-ip': '203.0.113.9' })
    const c = issuePowChallenge('login', h)!
    ok('出题：难度为平时档', !!c && c.bits === POW_BITS_NORMAL)
    // 浏览器端纯 JS 求解 vs Node crypto：同一个 nonce 的前导零必须一致
    const t0 = Date.now()
    let jsNonce: string | null = null
    for (let s = 0; !jsNonce && s < 1 << 24; s += 1 << 18) jsNonce = powSolve(c.challenge, c.bits, s, 1 << 18)
    const ms = Date.now() - t0
    ok('浏览器端求解得到结果', !!jsNonce, `${ms}ms`)
    const z = leadingZeroBits(createHash('sha256').update(`${c.challenge}.${jsNonce}`).digest())
    ok('浏览器端算出的 nonce 用 Node 的 SHA-256 复核前导零够数', z >= c.bits, `zeros=${z}`)
    // 再多比几次：JS 实现对不同长度的 nonce（1 块 / 2 块）都和 Node 一致
    let same = true
    for (const n of ['a', 'zz', '1abc', 'zzzzzzz']) {
      const want = leadingZeroBits(createHash('sha256').update(`${c.challenge}.${n}`).digest())
      // powSolve 只在前导零 ≥ bits 时返回：用 bits = want 时它必须恰好在这个 nonce 上命中（n 的 36 进制值）
      const idx = parseInt(n, 36)
      if (powSolve(c.challenge, want, idx, 1) !== n) same = false
      if (want < 32 && powSolve(c.challenge, want + 1, idx, 1) !== null) same = false
    }
    ok('JS SHA-256 与 Node 逐个 nonce 一致（含跨块）', same)
    console.log(`    （本机纯 JS 求解 ${c.bits} 位用了 ${ms} ms）`)

    resetPowForTest()
    ok('正确的解通过', checkPow(`${c.challenge}.${jsNonce}`, 'login') === null)
    ok('同一道题第二次用：reused', checkPow(`${c.challenge}.${jsNonce}`, 'login') === 'reused')
    const c2 = issuePowChallenge('register', h)!
    const n2 = solvePowForTest(c2.challenge, c2.bits)
    ok('用途不对：wrong_purpose', checkPow(`${c2.challenge}.${n2}`, 'login') === 'wrong_purpose')
    ok('没带：missing', checkPow(null, 'register') === 'missing')
    ok('格式不对：malformed', checkPow('abc', 'register') === 'malformed')
    const [v, body, sig] = c2.challenge.split('.')
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), d: 1 })).toString('base64url')
    ok('改低难度：签名不对', checkPow(`${v}.${forged}.${sig}.${n2}`, 'register') === 'bad_sig')
    // 找一个前导零不够的 nonce
    let weakNonce = '0'
    for (let i = 0; i < 1000; i++) {
      if (leadingZeroBits(createHash('sha256').update(`${c2.challenge}.${i.toString(36)}`).digest()) < c2.bits) {
        weakNonce = i.toString(36)
        break
      }
    }
    ok('随便填个 nonce：weak', checkPow(`${c2.challenge}.${weakNonce}`, 'register') === 'weak')
    ok('过期：expired', checkPow(`${c2.challenge}.${n2}`, 'register', Date.now() + 4 * 60_000) === 'expired')
    ok('正解照常通过', checkPow(`${c2.challenge}.${n2}`, 'register') === null)
    process.env.POW_MODE = 'off'
    ok('POW_MODE=off：一律放行（应急开关）', checkPow(null, 'login') === null)
    delete process.env.POW_MODE
  }

  console.log('\n别名邮箱（lib/security/email-canonical）：')
  {
    ok('带 + 的识别出来', hasSubAddress('irontmp+abc@gmail.com') && hasSubAddress('a+b@qq.com') && !hasSubAddress('abc@gmail.com'))
    ok('Gmail 去点去 +、googlemail 统一', canonicalEmail('Iron.Tmp+x@googlemail.com') === 'irontmp@gmail.com')
    ok('非 Gmail 只去 +，点保留', canonicalEmail('a.b+c@outlook.com') === 'a.b@outlook.com')
    ok('isGmail', isGmail('x@gmail.com') && isGmail('x@googlemail.com') && !isGmail('x@qq.com'))
  }

  console.log('\n新密码强度（lib/security/password-policy）：')
  {
    ok('7 位拒绝', !!passwordProblem('abc1234'))
    ok('纯数字拒绝', !!passwordProblem('12345678901'))
    ok('纯字母拒绝', !!passwordProblem('abcdefghij'))
    ok('同字符重复拒绝', !!passwordProblem('11111111'))
    ok('常见密码拒绝', !!passwordProblem('Password123') && !!passwordProblem('woaini1314'))
    ok('正常密码通过', passwordProblem('bigo-2026-Shop') === null && passwordProblem('qq52013hz') === null)
    ok('超长拒绝', !!passwordProblem('a1'.repeat(70)))
  }

  console.log('\n收款回调签名：验签即占位（lib/security/webhook-sign）：')
  {
    const secret = 'c'.repeat(48)
    const now = 1_800_000_000_000
    const ts = String(now)
    const v = createSignVerifier(secret)
    const r = v.check(ts, smsForwarderSign(secret, ts), now)
    ok('验签通过', r.reason === null)
    ok('第一个请求占住', v.claim(r.key, now))
    ok('并发的第二个请求占不到（以前两个都会往下处理）', !v.claim(r.key, now))
    v.release(r.key)
    ok('处理失败放开后可以重试', v.claim(r.key, now))
    v.markUsed(r.key, now)
    ok('处理成功后再来：replay', v.check(ts, smsForwarderSign(secret, ts), now + 1000).reason === 'replay')
  }

  console.log('\n管理员会话绑受信设备的开关口径（lib/security/admin-device-policy）：')
  {
    const keep = { ...process.env }
    process.env.ALIYUN_ACCESS_KEY_ID = 'x'
    process.env.ALIYUN_ACCESS_KEY_SECRET = 'x'
    process.env.ALIYUN_DM_NOREPLY = 'no-reply@x'
    delete process.env.ADMIN_LOGIN_2FA
    delete process.env.ADMIN_DEVICE_BIND
    ok('邮件配好、2FA 开着：要求', adminDeviceRequired())
    process.env.ADMIN_LOGIN_2FA = '0'
    ok('ADMIN_LOGIN_2FA=0：不要求（发不出受信设备，不能把站长锁在外面）', !adminDeviceRequired())
    delete process.env.ADMIN_LOGIN_2FA
    process.env.ADMIN_DEVICE_BIND = '0'
    ok('ADMIN_DEVICE_BIND=0：应急关闭', !adminDeviceRequired())
    delete process.env.ADMIN_DEVICE_BIND
    delete process.env.ALIYUN_ACCESS_KEY_ID
    ok('邮件没配：不要求', !adminDeviceRequired())
    Object.assign(process.env, keep)
  }

  console.log('\n管理员密码连错锁定（lib/security/admin-2fa）：')
  {
    const u = { id: 987654, email: 'a@b.c' }
    const h = new Headers({ 'cf-connecting-ip': '198.51.100.40' })
    for (let i = 0; i < 5; i++) noteAdminPasswordFailure(u, h)
    ok('输错 5 次：还没锁', !adminPasswordLocked(u.id))
    noteAdminPasswordFailure(u, h)
    ok('第 6 次：锁 30 分钟（只挡非受信设备）', adminPasswordLocked(u.id))
  }

  console.log('\n探测计数不再被伪造的 Sec-Fetch-Site 绕开（lib/security/probe countableRequest）：')
  {
    const req = (headers: Record<string, string>) => new NextRequest('https://bigolab.com/api/orders/1', { headers })
    ok('脚本带 cross-site + 登录 cookie + 非导航：算数', countableRequest(req({ 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors', cookie: 'token=abc' })))
    ok('Bearer 头：算数', countableRequest(req({ 'sec-fetch-site': 'cross-site', authorization: 'Bearer x' })))
    ok('真跨站子资源（没 cookie）：不算（防栽赃）', !countableRequest(req({ 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'no-cors' })))
    ok('跨站顶层导航带 cookie：不算（从别的网站点链接过来）', !countableRequest(req({ 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate', cookie: 'token=abc' })))
    ok('兄弟子域 same-site：仍不算（Lax cookie 会带上，防渠道站页面栽赃）', !countableRequest(req({ 'sec-fetch-site': 'same-site', cookie: 'token=abc' })))
  }

  console.log('\n收款金额永不分配整数原价（静态检查 lib/vmq.ts allocateAmount）：')
  {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'vmq.ts'), 'utf8')
    ok('从原价 +1 分起', /let cents = centsOf\(basePrice\) \+ 1/.test(src))
    ok('最多 49 个候选（尾差 ≤ 49 分，迟到退入上界依赖它）', /for \(let i = 0; i < 49; i\+\+\)/.test(src))
  }

  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
