/**
 * 防 SSRF 的地址判断（lib/net-guard.ts）+ 新闻回链协议过滤（aihot.ts / format.ts）自测。
 * **不连数据库、不出网**（safeGet 那几条在字面量预检就被拒，不会建连）。
 *   npx tsx scripts/check-net-guard.ts
 *
 * 钉住 2026-09-26 审计 G32 / G33 的几个绕过写法，以后谁改判断逻辑都要先过这里。
 */
import { isPrivateAddress, isBlockedHost, publicUrlProblem } from '../src/lib/net-guard'
import { safeGet, UnsafeTargetError } from '../src/lib/safe-fetch'
import { parseAihotLeads } from '../src/lib/news/aihot'
import { safeHttpUrl } from '../src/lib/news/format'
import { normalizeUrl } from '../src/lib/friend-link-client'

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
  console.log('\nisPrivateAddress（解析出来的 IP）：')
  for (const ip of [
    '127.0.0.1', '10.1.2.3', '172.17.0.2', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.100.100.200', '0.0.0.0', '224.0.0.1', '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '64:ff9b::a9fe:a9fe', '2002:7f00:1::', '::7f00:1',
  ]) {
    ok(`内网 ${ip}`, isPrivateAddress(ip) === true)
  }
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2606:4700:4700::1111', '240e:1::1']) {
    ok(`公网 ${ip}`, isPrivateAddress(ip) === false)
  }
  ok('不是 IP 一律当不安全', isPrivateAddress('example.com') === true)

  console.log('\nisBlockedHost（URL 字面量）：')
  const host = (u: string) => new URL(u).hostname
  for (const u of [
    'http://localhost:3000/', 'http://localhost.:3000/', 'http://app.:3000/', 'http://nginx./', 'http://db/',
    'http://127.0.0.1/', 'http://2130706433/', 'http://0x7f.1/', 'http://[::1]/', 'http://[::ffff:127.0.0.1]/',
    'http://[::7f00:1]/', 'http://100.100.100.200/', 'http://foo.internal/', 'http://printer.local/',
  ]) {
    ok(`拒绝 ${u}`, isBlockedHost(host(u)) === true, host(u))
  }
  for (const u of ['https://fc2.com/', 'https://fdroid.org/', 'https://fcc.gov/', 'https://example.com/x', 'https://blog.google/']) {
    ok(`放行 ${u}（不误伤 fc/fd 开头的域名）`, isBlockedHost(host(u)) === false)
  }

  console.log('\npublicUrlProblem：')
  ok('javascript: 拒绝', publicUrlProblem('javascript://example.com/%0aalert(1)') !== null)
  ok('file: 拒绝', publicUrlProblem('file:///etc/passwd') !== null)
  ok('带账号密码拒绝', publicUrlProblem('https://u:p@example.com/') !== null)
  ok('乱写拒绝', publicUrlProblem('not a url') !== null)
  ok('正常 https 放行', publicUrlProblem('HTTPS://Blog.Google/x') === null)

  console.log('\nsafeGet 在发请求前/建连时拒绝（不出网）：')
  for (const u of ['http://127.0.0.1:9/', 'http://localhost.:9/', 'http://app.:3000/', 'http://[::ffff:127.0.0.1]:9/']) {
    let err: unknown = null
    try {
      await safeGet(u, { timeoutMs: 3000, maxBytes: 1024 })
    } catch (e) {
      err = e
    }
    ok(`拒绝 ${u}`, err instanceof UnsafeTargetError, String(err))
  }

  console.log('\nAIHOT 线索（审计 G32）：')
  const feed = (items: unknown[]) => JSON.stringify({ items })
  const base = { id: 'x1', title: 'OpenAI 发布新模型', source: { name: '官方' }, publishedAt: '2026-09-26T00:00:00Z' }
  {
    const r = parseAihotLeads(feed([{ ...base, links: { original: 'https://openai.com/a', aihot: 'https://aihot.virxact.com/i/1' } }]))
    ok('正常 https 原文 + https 回链：保留', r.length === 1 && r[0].leadUrl === 'https://aihot.virxact.com/i/1', JSON.stringify(r))
  }
  {
    const r = parseAihotLeads(
      feed([{ ...base, links: { original: 'https://openai.com/a' }, attribution: { url: 'javascript://aihot.virxact.com/%0aalert(1)' } }])
    )
    ok('回链是 javascript:（host 恰好是对方域名）：线索保留、leadUrl=null', r.length === 1 && r[0].leadUrl === null, JSON.stringify(r))
  }
  {
    const r = parseAihotLeads(feed([{ ...base, links: { original: 'JaVaScRiPt://blog.google/x' } }]))
    ok('原文是伪协议：整条丢弃', r.length === 0, JSON.stringify(r))
  }
  {
    const r = parseAihotLeads(feed([{ ...base, links: { original: 'HTTPS://Blog.Google/x' } }]))
    ok('原文大写 HTTPS：保留', r.length === 1)
  }

  console.log('\nformat.safeHttpUrl（出口兜底存量数据）：')
  ok('javascript: → null', safeHttpUrl('javascript://aihot.virxact.com/%0aalert(1)') === null)
  ok('data: → null', safeHttpUrl('data://x/,hi') === null)
  ok('空 → null', safeHttpUrl(null) === null && safeHttpUrl('') === null)
  ok('https 原样', safeHttpUrl('https://aihot.virxact.com/i/1') === 'https://aihot.virxact.com/i/1')

  console.log('\n友链申请 normalizeUrl（审计 G33 纵深防御）：')
  ok('结尾带点拒绝', normalizeUrl('http://localhost.:3000/') === null && normalizeUrl('http://app.:3000') === null)
  ok('正常域名放行', normalizeUrl('www.example.com') === 'https://www.example.com/')

  console.log(`\n${pass} 通过，${fail} 失败`)
  process.exit(fail ? 1 : 0)
}

main()
