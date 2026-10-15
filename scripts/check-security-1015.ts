/**
 * 2026-10-15 攻防加固的纯逻辑自测（docs/安全-攻防加固设计-1015.md）。**不连数据库**：
 *   npx tsx scripts/check-security-1015.ts
 *
 * 覆盖：注册邮箱分级、IP 封禁、蜜罐计数与阈值（不登录的部分）、防栽赃（Sec-Fetch-Site）、新订单推送防刷屏、管理员受信设备。
 * 封号、取消未付单、下单闸门的查库部分在 itest 里（要连本地开发库）。
 * 时间用替换 Date.now 的方式快进，不真等。
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-security-1015-secret-0123456789abcdef'
// 让偶发的审计写入快速失败，不去连真实数据库
process.env.DATABASE_URL = 'mysql://nobody:nobody@127.0.0.1:1/none'

import { NextRequest } from 'next/server'
import { classifyDomain, domainOf, parseDomainList, TRUSTED_PROVIDERS } from '../src/lib/security/email-domain'
import { banIp, ipBlocked, ipKeyBanned, listIpBans, unbanIp } from '../src/lib/security/ip-ban'
import { countable, recordProbe, resetProbeTracksForTest } from '../src/lib/security/probe'
import { orderNotifyMode } from '../src/lib/order/create-guard'
import { adminTokenHours, isTrustedAdminDevice, maskEmail, signAdminDevice } from '../src/lib/security/admin-2fa'

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

const realNow = Date.now
let clock = 1_800_000_000_000
Date.now = () => clock
const advance = (ms: number) => {
  clock += ms
}
const MIN = 60_000

async function main() {
  console.log('\n注册邮箱分级（lib/security/email-domain）：')
  {
    const none = { trusted: new Set<string>(), blocked: new Set<string>() }
    const tier = (d: string, lists = none) => classifyDomain(d, lists).tier
    ok('qq.com / 163.com / 139.com / gmail.com / outlook.com 是主流', ['qq.com', '163.com', '139.com', 'gmail.com', 'outlook.com', 'petalmail.com'].every((d) => tier(d) === 'TRUSTED'))
    ok('21cn.com 在社区清单里，但主流优先 → 信任', tier('21cn.com') === 'TRUSTED')
    ok('10-15 攻击者用的两个域名拦截', tier('maxxspace.com') === 'BLOCKED' && tier('guerrillamailblock.com') === 'BLOCKED')
    ok('上级域命中也拦：a.b.maxxspace.com', tier('a.b.maxxspace.com') === 'BLOCKED')
    ok('清单外的拼音临时邮箱也拦：linshiyouxiang.com', tier('linshiyouxiang.com') === 'BLOCKED')
    ok('企业邮箱 / proton / mail.com 落在 OTHER（能注册，新号受限）', ['transwarp.io', 'pdlaser.cn', 'proton.me', 'mail.com'].every((d) => tier(d) === 'OTHER'))
    ok('真正的 .edu.cn 信任', tier('seu.edu.cn') === 'TRUSTED' && tier('mails.tsinghua.edu.cn') === 'TRUSTED')
    ok('仿冒 edu 不信任：haida-edu.cn 拦截、edu.979786.xyz 只是 OTHER', tier('haida-edu.cn') === 'BLOCKED' && tier('edu.979786.xyz') === 'OTHER')
    const admin = { trusted: new Set(['maxxspace.com', 'acme.cn']), blocked: new Set(['qq.com', 'spam.example']) }
    ok('后台信任能放行清单里的域名', tier('maxxspace.com', admin) === 'TRUSTED' && tier('mail.acme.cn', admin) === 'TRUSTED')
    ok('后台拦截拦不掉主流邮箱（防手滑）', tier('qq.com', admin) === 'TRUSTED')
    ok('后台拦截生效', tier('spam.example', admin) === 'BLOCKED')
    ok('空 / 畸形域名按 OTHER（交给 zod 的邮箱校验）', tier('') === 'OTHER' && tier('localhost') === 'OTHER')
    ok('domainOf 取最后一个 @、小写、去尾点', domainOf(' Foo@Bar.COM. ') === 'bar.com' && domainOf('a@b@c.cn') === 'c.cn')
    ok('名单解析：去 @、小写、去重、丢弃非法行', JSON.stringify(parseDomainList('@Foo.COM, bar.cn；baz\nfoo.com  x..y')) === JSON.stringify(['foo.com', 'bar.cn']))
    ok('主流清单不含匿名 / 低门槛邮箱', !['proton.me', 'mail.com', 'gmx.com', 'yandex.com'].some((d) => TRUSTED_PROVIDERS.has(d)))
  }

  console.log('\nIP 封禁（lib/security/ip-ban）：')
  {
    const h = (ip: string) => new Headers({ 'cf-connecting-ip': ip })
    banIp('203.0.113.7', 60 * MIN, 'TEST')
    ok('封禁后写入口拒绝', ipBlocked(h('203.0.113.7')))
    ok('别的 IP 不受影响', !ipBlocked(h('203.0.113.8')))
    banIp('2001:db8:aa:bb::/64', 60 * MIN, 'TEST')
    ok('IPv6 按 /64 聚合：同段换地址仍被挡', ipBlocked(h('2001:db8:aa:bb::1234')) && !ipBlocked(h('2001:db8:aa:cc::1')))
    ok('拿不到 IP（unknown）不当成被封', !ipBlocked(new Headers()))
    advance(61 * MIN)
    ok('1 小时后自动解封', !ipBlocked(h('203.0.113.7')) && listIpBans().length === 0)
    banIp('198.51.100.1', 60 * MIN, 'TEST')
    unbanIp('198.51.100.1')
    ok('后台手动解封', !ipKeyBanned('198.51.100.1'))
  }

  console.log('\n蜜罐计数（lib/security/probe，未登录部分）：')
  {
    const req = (path: string, ip: string, extra: Record<string, string> = {}) =>
      new NextRequest(`https://bigolab.com${path}`, { method: 'POST', headers: { 'cf-connecting-ip': ip, ...extra } })
    ok('Sec-Fetch-Site：cross-site / same-site 不计数，same-origin / none / 缺省计数',
      !countable(new Headers({ 'sec-fetch-site': 'cross-site' })) &&
        !countable(new Headers({ 'sec-fetch-site': 'same-site' })) &&
        countable(new Headers({ 'sec-fetch-site': 'same-origin' })) &&
        countable(new Headers({ 'sec-fetch-site': 'none' })) &&
        countable(new Headers()))

    resetProbeTracksForTest()
    for (let i = 0; i < 2; i++) await recordProbe(req('/api/pay/notify', '192.0.2.10'), 'PAY_CALLBACK')
    ok('盲猜支付回调 2 次：还没封', !ipKeyBanned('192.0.2.10'))
    await recordProbe(req('/api/pay/vmq/notify', '192.0.2.10'), 'PAY_CALLBACK')
    ok('第 3 次：IP 封 1 小时', ipKeyBanned('192.0.2.10'))

    for (let i = 0; i < 10; i++) await recordProbe(req('/api/pay/notify', '192.0.2.11', { 'sec-fetch-site': 'cross-site' }), 'PAY_CALLBACK')
    ok('跨站伪造的 10 次不计（防恶意网页栽赃访客）', !ipKeyBanned('192.0.2.11'))

    for (let i = 0; i < 30; i++) await recordProbe(req('/api/zzz', '192.0.2.12'), 'API_404')
    ok('同一个不存在的路径打 30 次：不封（数的是不同路径）', !ipKeyBanned('192.0.2.12'))
    for (let i = 0; i < 9; i++) await recordProbe(req(`/api/x${i}`, '192.0.2.13'), 'API_404')
    ok('9 个不同的不存在路径：不封', !ipKeyBanned('192.0.2.13'))
    await recordProbe(req('/api/x9', '192.0.2.13'), 'API_404')
    ok('第 10 个：IP 封 1 小时', ipKeyBanned('192.0.2.13'))

    for (let i = 0; i < 9; i++) await recordProbe(req(`/api/y${i}`, '192.0.2.14'), 'API_404')
    advance(11 * MIN)
    await recordProbe(req('/api/y9', '192.0.2.14'), 'API_404')
    ok('跨过 10 分钟窗口重新计数', !ipKeyBanned('192.0.2.14'))

    for (let i = 0; i < 10; i++) await recordProbe(req(`/api/admin/p${i}`, '192.0.2.15'), 'ADMIN_DENIED')
    ok('未登录打后台不计（站长登录过期的后台页会连着打好几个接口）', !ipKeyBanned('192.0.2.15'))
  }

  console.log('\n新订单推送防刷屏（lib/order/create-guard orderNotifyMode）：')
  {
    const seq = Array.from({ length: 5 }, () => orderNotifyMode(4242))
    ok('5 分钟内：前 2 单逐条推、第 3 单推汇总、之后静默', JSON.stringify(seq) === JSON.stringify(['SEND', 'SEND', 'SUMMARY', 'MUTE', 'MUTE']))
    ok('别的买家不受影响', orderNotifyMode(4243) === 'SEND')
    advance(5 * MIN + 1)
    ok('5 分钟后恢复逐条推', orderNotifyMode(4242) === 'SEND')
  }

  console.log('\n管理员二次验证（lib/security/admin-2fa）：')
  {
    Date.now = realNow // jsonwebtoken 用真实时间签发 / 校验
    const dev = signAdminDevice(1, 3)
    ok('受信设备：同一账号同一会话版本有效', !!dev && isTrustedAdminDevice(dev!, 1, 3))
    ok('重置密码（会话版本 +1）后失效', !isTrustedAdminDevice(dev!, 1, 4))
    ok('换账号无效', !isTrustedAdminDevice(dev!, 2, 3))
    ok('没有 / 伪造的 cookie 无效', !isTrustedAdminDevice(undefined, 1, 3) && !isTrustedAdminDevice('abc.def.ghi', 1, 3))
    ok('管理员 token 时长默认 12 小时', adminTokenHours() === 12)
    process.env.ADMIN_TOKEN_HOURS = '9999'
    ok('非法时长回到默认', adminTokenHours() === 12)
    process.env.ADMIN_TOKEN_HOURS = '24'
    ok('可配置', adminTokenHours() === 24)
    ok('邮箱打码', maskEmail('admin@example.com') === 'ad***@example.com')
  }

  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
