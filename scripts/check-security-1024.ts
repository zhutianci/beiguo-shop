/**
 * 2026-10-24 第二轮加固的纯逻辑自测（docs/安全-第二轮加固-1024.md）。**不连数据库**：
 *   npx tsx scripts/check-security-1024.ts
 *
 * 覆盖：收款回调签名（算法 / 时间窗 / 防重放）、反复被拒封 IP（security/abuse）、兑换全站闸只数真卡、
 * 买家写接口路由内同源校验（write-guard）、rateFull、账号打码幂等、收款单号长度与熵、繁体代理拦 /zh-hk/api/**。
 * 后台二次验证（sudo）、卡密打码、越权计数、补货绑定商品等要连库的部分在 itest-security-1015.ts。
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-security-1024-secret-0123456789abcdef'
// 让偶发的审计写入快速失败，不去连真实数据库
process.env.DATABASE_URL = 'mysql://nobody:nobody@127.0.0.1:1/none'

import crypto from 'crypto'
import path from 'path'
import { createRequire } from 'module'
import { createSignVerifier, smsForwarderSign, SIGN_WINDOW_MS } from '../src/lib/security/webhook-sign'
import { ABUSE_RULES, noteAbuse, resetAbuseForTest } from '../src/lib/security/abuse'
import { ipKeyBanned, unbanIp } from '../src/lib/security/ip-ban'
import { redeemCardLimited, redeemRateLimited } from '../src/lib/redeem/service'
import { crossSiteWrite } from '../src/lib/security/write-guard'
import { rateFull, rateLimited } from '../src/lib/news/rate-limit'
import { maskAccount } from '../src/lib/redeem/providers/sysb-lookup'
import { genOrderId } from '../src/lib/vmq'

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

const MIN = 60_000
const h = (ip: string, extra: Record<string, string> = {}) => new Headers({ 'cf-connecting-ip': ip, ...extra })

async function main() {
  console.log('\n收款回调签名（lib/security/webhook-sign，SmsForwarder 算法）：')
  {
    const secret = 'a'.repeat(48)
    const now = 1_800_000_000_000
    const ts = String(now)
    const raw = smsForwarderSign(secret, ts)
    // SmsForwarder 在请求体里放的是 URL 编码后的 Base64
    const encoded = encodeURIComponent(raw)
    const expect = crypto.createHmac('sha256', secret).update(`${ts}\n${secret}`).digest('base64')
    ok('算法与 SmsForwarder 一致：HMAC-SHA256(secret, ts + "\\n" + secret) 的 Base64', raw === expect)
    const v = createSignVerifier(secret)
    const r1 = v.check(ts, encoded, now)
    ok('URL 编码的签名通过', r1.reason === null && !!r1.key)
    ok('已解码的签名也通过（容忍两种写法）', v.check(ts, raw, now).reason === null)
    ok('换了 secret 不通过', createSignVerifier('b'.repeat(48)).check(ts, encoded, now).reason === 'bad_sign')
    ok('篡改时间戳不通过', v.check(String(now + 1), encoded, now).reason === 'bad_sign')
    ok('时间戳过期（超过 10 分钟）→ stale', v.check(ts, encoded, now + SIGN_WINDOW_MS + 1).reason === 'stale')
    ok('时间戳在未来超过 10 分钟 → stale', v.check(ts, encoded, now - SIGN_WINDOW_MS - 1).reason === 'stale')
    ok('缺签名 / 缺时间戳 → no_sign', v.check('', encoded, now).reason === 'no_sign' && v.check(ts, '', now).reason === 'no_sign')
    ok('时间戳不是毫秒数字 → bad_sign', v.check('abc', encoded, now).reason === 'bad_sign' && v.check('1800000000', encoded, now).reason === 'bad_sign')
    ok('坏的百分号编码 → bad_sign', v.check(ts, '%E0%A4%A', now).reason === 'bad_sign')
    v.markUsed(r1.key, now)
    ok('处理成功后同一签名再来 → replay', v.check(ts, encoded, now + 1000).reason === 'replay')
    ok('…已解码写法的同一签名也算重放', v.check(ts, raw, now + 1000).reason === 'replay')
    ok('没配 secret 的校验器一律不通过', createSignVerifier('').check(ts, encoded, now).reason === 'bad_sign')
  }

  console.log('\n反复被拒封 IP（lib/security/abuse）：')
  {
    resetAbuseForTest()
    const A = ABUSE_RULES.AUTH_THROTTLED.max
    for (let i = 0; i < A - 1; i++) noteAbuse(h('198.51.100.20'), 'AUTH_THROTTLED', `x${i}`)
    ok(`登录 / 发码被限流 ${A - 1} 次：还没封`, !ipKeyBanned('198.51.100.20'))
    const fired = noteAbuse(h('198.51.100.20'), 'AUTH_THROTTLED', 'last')
    ok(`第 ${A} 次：封 IP（返回 true）`, fired && ipKeyBanned('198.51.100.20'))
    ok('之后不重复处置（返回 false）', !noteAbuse(h('198.51.100.20'), 'AUTH_THROTTLED', 'again'))
    unbanIp('198.51.100.20')

    const W = ABUSE_RULES.WEBHOOK_AUTH.max
    for (let i = 0; i < W; i++) noteAbuse(h('198.51.100.21'), 'WEBHOOK_AUTH', 'bad_token')
    ok(`回调密钥错 ${W} 次：封 IP`, ipKeyBanned('198.51.100.21'))
    unbanIp('198.51.100.21')

    for (let i = 0; i < W; i++) noteAbuse(h(`2001:db8:1:2::${i + 1}`), 'WEBHOOK_AUTH', 'bad_sign')
    ok('IPv6 同一 /64 换地址仍累计', ipKeyBanned('2001:db8:1:2::/64'))
    unbanIp('2001:db8:1:2::/64')

    for (let i = 0; i < 50; i++) noteAbuse(new Headers(), 'WEBHOOK_AUTH', 'no-ip')
    ok('拿不到 IP 不计数、不抛错', true)

    const realNow = Date.now
    let clock = realNow()
    Date.now = () => clock
    for (let i = 0; i < W - 1; i++) noteAbuse(h('198.51.100.22'), 'WEBHOOK_AUTH', 'bad_token')
    clock += 11 * MIN
    noteAbuse(h('198.51.100.22'), 'WEBHOOK_AUTH', 'bad_token')
    ok('跨过 10 分钟窗口重新计数', !ipKeyBanned('198.51.100.22'))
    Date.now = realNow
  }

  console.log('\n兑换限流：全站闸只数真卡（lib/redeem/service）：')
  {
    let blocked = 0
    // 400 个不同 IP 拿乱填的卡密各试一次（查库之前那一层）：以前第 301 次起全站「人数较多」
    for (let i = 0; i < 400; i++) if (redeemRateLimited('check', null, `10.${Math.floor(i / 250)}.${i % 250}.9`)) blocked++
    ok('查库之前只按 IP 限：400 个 IP 各 1 次，一个都不挡', blocked === 0)
    let realCardBlocked = 0
    for (let i = 0; i < 300; i++) if (redeemCardLimited('check', 100000 + i)) realCardBlocked++
    ok('真卡 300 次（不同卡）不挡', realCardBlocked === 0)
    ok('真卡第 301 次：全站闸生效', redeemCardLimited('check', 200001) === '当前兑换人数较多，请稍后再试')
    let ipBlocked = 0
    for (let i = 0; i < 21; i++) if (redeemRateLimited('check', null, '192.0.2.99')) ipBlocked++
    ok('单 IP 每分钟 20 次照旧（第 21 次挡）', ipBlocked === 1)
  }

  console.log('\n买家写接口路由内同源校验（lib/security/write-guard）：')
  {
    const req = (method: string, p: string, headers: Record<string, string>) => new Request(`https://bigolab.com${p}`, { method, headers: { host: 'bigolab.com', ...headers } })
    ok('同源 POST 放行', crossSiteWrite(req('POST', '/api/orders', { origin: 'https://bigolab.com', 'sec-fetch-site': 'same-origin' })) === null)
    const r = crossSiteWrite(req('POST', '/api/orders', { origin: 'https://lulu.bigolab.com', 'sec-fetch-site': 'same-site' }))
    ok('兄弟子域 POST → 403', !!r && r.status === 403)
    ok('跨站 POST（只有 Sec-Fetch-Site）→ 403', crossSiteWrite(req('PATCH', '/api/account/profile', { 'sec-fetch-site': 'cross-site' }))?.status === 403)
    ok('Origin: null → 403', crossSiteWrite(req('POST', '/api/coupons/claim', { origin: 'null' }))?.status === 403)
    ok('GET 不管', crossSiteWrite(req('GET', '/api/orders', { 'sec-fetch-site': 'cross-site' })) === null)
    ok('两个浏览器头都没有（脚本、服务器回调）放行', crossSiteWrite(req('POST', '/api/orders', {})) === null)
    ok('收款回调豁免', crossSiteWrite(req('POST', '/api/pay/sms-notify', { 'sec-fetch-site': 'cross-site' })) === null)
    const body = r ? await r.json() : null
    ok('拒绝文案与 middleware 相同', body?.error === '请求来源不合法，请刷新页面后重试')
  }

  console.log('\nrateFull（只看不记）：')
  {
    const rule = { windowMs: MIN, max: 3 }
    ok('没有记录时不满', !rateFull('t1024:a', rule))
    rateLimited('t1024:a', rule)
    rateLimited('t1024:a', rule)
    ok('2/3 不满', !rateFull('t1024:a', rule))
    ok('看一眼不计数', !rateFull('t1024:a', rule) && !rateFull('t1024:a', rule))
    rateLimited('t1024:a', rule)
    ok('3/3 满', rateFull('t1024:a', rule))
  }

  console.log('\n账号打码（兑换查询统一处理，maskAccount 幂等）：')
  {
    ok('邮箱打码', maskAccount('tangwei104@163.com') === 'tan***@163.com')
    ok('短邮箱', maskAccount('ab@x.com') === 'a***@x.com')
    ok('非邮箱留头留尾', maskAccount('org-1234567890') === 'org***90')
    ok('打过码的再打一次不变', maskAccount(maskAccount('tangwei104@163.com')) === 'tan***@163.com' && maskAccount(maskAccount('org-1234567890')) === 'org***90')
    ok('空值 → undefined', maskAccount('') === undefined && maskAccount(null) === undefined)
  }

  console.log('\n收款单号（lib/vmq genOrderId）：')
  {
    const ids = Array.from({ length: 200 }, () => genOrderId())
    ok('长度 37，放得进 VarChar(40)', ids.every((x) => x.length === 37))
    ok('13 位毫秒 + 24 位 hex（96 位随机）', ids.every((x) => /^\d{13}[0-9a-f]{24}$/.test(x)))
    ok('200 个互不相同', new Set(ids).size === 200)
  }

  console.log('\n繁体代理拦 /zh-hk/api/**（zhhk/proxy.cjs）：')
  {
    const require_ = createRequire(__filename)
    const proxyMod = require_(path.join(__dirname, '..', 'zhhk', 'proxy.cjs'))
    const conv = { convert: (s: string) => s }
    const p = proxyMod.createProxy({ upstream: 'http://127.0.0.1:1', converter: conv, hosts: new Set(['bigolab.com']) })
    const hit = (url: string): number | null => {
      let status: number | null = null
      const res = {
        headersSent: false,
        writeHead(s: number) {
          status = s
          return res
        },
        end() {},
        setHeader() {},
        destroy() {},
      }
      p.handle({ url, method: 'GET', headers: { host: 'bigolab.com' }, on() {} }, res)
      return status
    }
    for (const u of ['/zh-hk/api/cron/vmq-close', '/zh-hk/api/bot/wxpad/hook/x', '/zh-hk//api/cron/x', '/zh-hk/%61pi/cron/x', '/zh-hk/API/cron/x', '/zh-hk/api', '/zh-hk/admin', '/zh-hk/partner/x']) {
      ok(`${u} → 404`, hit(u) === 404, String(hit(u)))
    }
  }

  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
