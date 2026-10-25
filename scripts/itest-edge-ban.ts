/**
 * Cloudflare 边缘封禁自测（lib/security/edge-ban.ts）：起一个本地假 Cloudflare 接口，连一次性开发库。
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-edge-ban.ts
 * 覆盖：快层（蜜罐 / 越权计数触发 → 推边缘）、慢层 24 小时累计、扫描器日志、白名单（收款手机 / 管理员 / 手动）、
 * 内网与 Cloudflare 地址不封、回调签名错误只封境外、国内与境外时长、惯犯加长、到期自动解封、后台手动解封、Cloudflare 出错不抛。
 */
import http from 'http'
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
if (!/dev|test/i.test(url.split('/').pop() || '')) {
  console.error('拒绝执行：不是一次性开发库')
  process.exit(2)
}

// 假 Cloudflare：记住建了哪些规则
const rules = new Map<string, { id: string; value: string; target: string; notes: string }>()
let failNext = false
let seq = 0
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const send = (code: number, j: unknown) => {
      res.writeHead(code, { 'content-type': 'application/json' })
      res.end(JSON.stringify(j))
    }
    if (req.headers.authorization !== 'Bearer fake-token') return send(403, { success: false, errors: [{ code: 10000, message: 'auth' }] })
    if (failNext) {
      failNext = false
      return send(500, { success: false, errors: [{ code: 1, message: 'boom' }] })
    }
    const u = new URL(req.url || '/', 'http://x')
    if (req.method === 'POST' && u.pathname === '/zones/zone1/firewall/access_rules/rules') {
      const b = JSON.parse(body)
      const exists = Array.from(rules.values()).find((r) => r.value === b.configuration.value)
      if (exists) return send(400, { success: false, errors: [{ code: 10009, message: 'duplicate' }] })
      const id = `r${++seq}`
      rules.set(id, { id, value: b.configuration.value, target: b.configuration.target, notes: b.notes })
      return send(200, { success: true, result: { id } })
    }
    if (req.method === 'GET' && u.pathname === '/zones/zone1/firewall/access_rules/rules') {
      const v = u.searchParams.get('configuration.value')
      return send(200, { success: true, result: Array.from(rules.values()).filter((r) => r.value === v).map((r) => ({ id: r.id, configuration: { value: r.value } })) })
    }
    const m = /^\/zones\/zone1\/firewall\/access_rules\/rules\/(\w+)$/.exec(u.pathname)
    if (req.method === 'DELETE' && m) {
      if (!rules.has(m[1])) return send(404, { success: false, errors: [{ code: 10001, message: 'not found' }] })
      rules.delete(m[1])
      return send(200, { success: true, result: { id: m[1] } })
    }
    send(404, { success: false })
  })
})

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
const has = (v: string) => Array.from(rules.values()).some((r) => r.value === v)

async function main() {
  await new Promise<void>((r) => server.listen(18611, '127.0.0.1', () => r()))
  process.env.CF_API_BASE = 'http://127.0.0.1:18611'
  process.env.CF_API_TOKEN = 'fake-token'
  process.env.CF_ZONE_ID = 'zone1'
  const prisma = new PrismaClient()
  const E = await import('../src/lib/security/edge-ban')
  const P = await import('../src/lib/security/probe')
  const { NextRequest } = await import('next/server')
  const OCT = (Date.now() % 200) + 20
  const ip = (n: number) => `198.18.${n}.${OCT}`
  const cleanKeys = async () => {
    await prisma.setting.deleteMany({ where: { key: { startsWith: 'edgeban:198.18.' } } })
    await prisma.setting.deleteMany({ where: { key: { startsWith: 'edgeban:2001:db8:' } } })
  }
  await cleanKeys()
  const savedWl = await prisma.setting.findUnique({ where: { key: E.EDGE_WHITELIST_KEY } })
  const savedPhones = await prisma.setting.findUnique({ where: { key: 'vmq_phone_ips' } })
  E.resetEdgeForTest()

  console.log('\n[快层：站内识别触发即推边缘]')
  {
    const req = (path: string, ipAddr: string, country = 'US') => new NextRequest(`https://bigolab.com${path}`, { method: 'POST', headers: { 'cf-connecting-ip': ipAddr, 'cf-ipcountry': country } })
    for (const p of ['/api/pay/notify', '/api/pay/vmq/notify', '/api/pay/callback']) await P.recordProbe(req(p, ip(1)), 'PAY_CALLBACK')
    await new Promise((r) => setTimeout(r, 300))
    const row = await prisma.setting.findUnique({ where: { key: `edgeban:${ip(1)}` } })
    const v = row ? JSON.parse(row.value) : null
    ok('盲猜支付回调 3 次：推到 Cloudflare 封禁', has(ip(1)) && !!v?.ruleId, JSON.stringify(v))
    ok('境外首次封 24 小时', v && Math.abs(v.until - Date.now() - 24 * 3600_000) < 60_000)
    for (const p of ['/api/pay/notify', '/api/pay/a', '/api/pay/b']) await P.recordProbe(req(p, ip(2), 'CN'), 'PAY_CALLBACK')
    await new Promise((r) => setTimeout(r, 300))
    const v2 = JSON.parse((await prisma.setting.findUnique({ where: { key: `edgeban:${ip(2)}` } }))?.value || 'null')
    ok('国内 IP 首次只封 2 小时', v2 && Math.abs(v2.until - Date.now() - 2 * 3600_000) < 60_000, JSON.stringify(v2))
  }

  console.log('\n[不封的地址]')
  {
    ok('内网地址不封', (await E.edgeBan('10.1.2.3', 'PAY_CALLBACK', 't', 'US')) === 'SKIP_RESERVED')
    ok('Cloudflare 自己的地址不封', (await E.edgeBan('172.70.1.1', 'PAY_CALLBACK', 't', 'US')) === 'SKIP_RESERVED' && E.neverBanAddress('2a06:98c0:3600:0::/64'))
    ok('回调签名错误：国内 IP 不封（收款手机都在国内）', (await E.edgeBan(ip(3), 'WEBHOOK_AUTH', 't', 'CN')) === 'SKIP_CN_WEBHOOK')
    ok('回调签名错误：境外 IP 封', (await E.edgeBan(ip(4), 'WEBHOOK_AUTH', 't', 'NL')) === 'BANNED' && has(ip(4)))
    await prisma.setting.upsert({ where: { key: E.EDGE_WHITELIST_KEY }, create: { key: E.EDGE_WHITELIST_KEY, value: `${ip(5)}\n2001:db8:77:1::/64` }, update: { value: `${ip(5)}\n2001:db8:77:1::/64` } })
    await prisma.setting.upsert({ where: { key: 'vmq_phone_ips' }, create: { key: 'vmq_phone_ips', value: JSON.stringify([{ ip: ip(6), at: Date.now() }]) }, update: { value: JSON.stringify([{ ip: ip(6), at: Date.now() }]) } })
    E.resetEdgeWhitelistCache()
    ok('手动白名单（IPv4）不封', (await E.edgeBan(ip(5), 'API_404', 't', 'US')) === 'SKIP_WHITELIST')
    ok('手动白名单（IPv6 整段 /64）不封', (await E.edgeBan('2001:db8:77:1:abcd::9', 'API_404', 't', 'US')) === 'SKIP_WHITELIST')
    ok('收款手机用过的 IP 不封', (await E.edgeBan(ip(6), 'PAY_CALLBACK', 't', 'US')) === 'SKIP_WHITELIST')
    ok('已在封的不重复建规则', (await E.edgeBan(ip(1), 'API_404', 't', 'US')) === 'ACTIVE')
    ok('IPv6 按 /64 整段封', (await E.edgeBan('2001:db8:5:6::1', 'API_404', 't', 'US')) === 'BANNED' && Array.from(rules.values()).some((r) => r.value === '2001:db8:5:6::/64' && r.target === 'ip_range'))
  }

  console.log('\n[慢层：24 小时累计]')
  {
    for (let i = 0; i < 29; i++) E.noteEdgeSignal(ip(7), 'API_404', `/api/x${i}`, 'US')
    await new Promise((r) => setTimeout(r, 200))
    ok('不存在的接口累计 29 个：还没封', !has(ip(7)))
    E.noteEdgeSignal(ip(7), 'API_404', '/api/x29', 'US')
    await new Promise((r) => setTimeout(r, 300))
    ok('第 30 个：封', has(ip(7)))
    E.noteEdgeSignal(ip(8), 'APP_BAN', 'AUTH_THROTTLED', 'US')
    await new Promise((r) => setTimeout(r, 200))
    ok('被站内封过 1 次：不封', !has(ip(8)))
    E.noteEdgeSignal(ip(8), 'APP_BAN', 'AUTH_THROTTLED', 'US')
    await new Promise((r) => setTimeout(r, 300))
    ok('一天内第 2 次：封', has(ip(8)))
  }

  console.log('\n[扫描器路径（nginx 安全日志）]')
  {
    const line = (p: string, ipAddr: string) => `2026-10-25T13:00:00+00:00 ${ipAddr} 404 GET "${p}" bytes=0 rt=0.000 host="bigolab.com" country="PL" peer="172.24.0.6" ua="x" ref="-"`
    ok('解析一行', JSON.stringify(E.parseSecLine(line('/.env', '1.2.3.4'))) === JSON.stringify({ ip: '1.2.3.4', status: 404, path: '/.env', country: 'PL' }))
    ok('识别扫描器路径、放过正常页面与接口', E.isScannerPath('/.env.bak') && E.isScannerPath('/wp-login.php') && E.isScannerPath('/vendor/phpunit/x') && !E.isScannerPath('/products') && !E.isScannerPath('/api/x.php'))
    for (const p of ['/.env', '/.git/config', '/wp-login.php', '/admin.php']) E.noteSecLine(line(p, ip(9)))
    await new Promise((r) => setTimeout(r, 200))
    ok('扫描 4 次：不封', !has(ip(9)))
    E.noteSecLine(line('/phpmyadmin/', ip(9)))
    await new Promise((r) => setTimeout(r, 300))
    ok('10 分钟内第 5 次：封', has(ip(9)))
    for (let i = 0; i < 20; i++) E.noteSecLine(line('/products', ip(10)))
    await new Promise((r) => setTimeout(r, 200))
    ok('正常页面的日志行不计', !has(ip(10)))
  }

  console.log('\n[解封]')
  {
    const before = rules.size
    ok('后台手动解封：删掉 Cloudflare 规则', (await E.edgeUnban(ip(4), 'manual')) && !has(ip(4)) && rules.size === before - 1)
    // 让 ip(1) 到期
    const row = await prisma.setting.findUnique({ where: { key: `edgeban:${ip(1)}` } })
    const v = JSON.parse(row!.value)
    await prisma.setting.update({ where: { key: `edgeban:${ip(1)}` }, data: { value: JSON.stringify({ ...v, until: Date.now() - 1000 }) } })
    const r = await E.expireEdgeBans(true)
    ok('到期自动解封', r.released >= 1 && !has(ip(1)), JSON.stringify(r))
    ok('列表里不再显示', !(await E.listEdgeBans()).some((b) => b.key === ip(1)))
    ok('7 天内再犯：境外封 7 天', (await E.edgeBan(ip(1), 'API_404', 't', 'US')) === 'BANNED')
    const v3 = JSON.parse((await prisma.setting.findUnique({ where: { key: `edgeban:${ip(1)}` } }))!.value)
    ok('…时长 7 天、累计 2 次', Math.abs(v3.until - Date.now() - 7 * 24 * 3600_000) < 60_000 && v3.count === 2, JSON.stringify(v3))
    failNext = true
    ok('Cloudflare 出错：不抛、不记成已封', (await E.edgeBan(ip(11), 'API_404', 't', 'US')) === 'SKIP_CF_ERROR' && !(await prisma.setting.findUnique({ where: { key: `edgeban:${ip(11)}` } })))
    process.env.EDGE_BAN = '0'
    ok('EDGE_BAN=0：整个关掉', (await E.edgeBan(ip(12), 'API_404', 't', 'US')) === 'SKIP_OFF')
    delete process.env.EDGE_BAN
  }

  // 清理
  for (const k of (await E.listEdgeBans()).map((b) => b.key)) if (k.startsWith('198.18.') || k.startsWith('2001:db8:')) await E.edgeUnban(k, 'test cleanup')
  await cleanKeys()
  if (savedWl) await prisma.setting.update({ where: { key: E.EDGE_WHITELIST_KEY }, data: { value: savedWl.value } })
  else await prisma.setting.deleteMany({ where: { key: E.EDGE_WHITELIST_KEY } })
  if (savedPhones) await prisma.setting.update({ where: { key: 'vmq_phone_ips' }, data: { value: savedPhones.value } })
  else await prisma.setting.deleteMany({ where: { key: 'vmq_phone_ips' } })
  await prisma.auditEvent.deleteMany({ where: { action: { in: ['sec.edgeban', 'sec.edgeunban'] }, targetId: { startsWith: '198.18.' } } })
  await prisma.$disconnect()
  server.close()
  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
