/**
 * 同源校验（lib/same-origin.ts，审计 G09）自测。**不连数据库**，照 scripts/check-rate-limit.ts 的形式。
 *   npx tsx scripts/check-same-origin.ts
 *
 * 重点钉两件事：兄弟子域 / 外站 / Origin:null 一定拒；站长自己的正常后台操作、
 * 以及不带这两个头的机器调用（curl、itest、回调）一定放行。
 */
import { crossSiteReason, hostnameOf } from '../src/lib/same-origin'

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

process.env.NEXT_PUBLIC_APP_URL = 'https://bigolab.com'
delete process.env.APP_URL

const H = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] ?? null })
const allow = (name: string, o: Record<string, string>) => {
  const r = crossSiteReason(H(o))
  ok(`放行：${name}`, r === null, String(r))
}
const deny = (name: string, o: Record<string, string>) => {
  const r = crossSiteReason(H(o))
  ok(`拒绝：${name}`, r !== null, String(r))
}

console.log('\nhostnameOf：')
ok('带协议与端口', hostnameOf('https://BigoLab.com:443/x') === 'bigolab.com')
ok('裸 host:port', hostnameOf('localhost:3000') === 'localhost')
ok('逗号分隔取第一个', hostnameOf('a.com, b.com') === 'a.com')
ok('空值', hostnameOf('') === null && hostnameOf(null) === null)

console.log('\n正常后台操作（必须放行）：')
allow('同源 fetch POST（现代浏览器）', { host: 'bigolab.com', origin: 'https://bigolab.com', 'sec-fetch-site': 'same-origin' })
allow('同源 GET（浏览器不带 Origin）', { host: 'bigolab.com', 'sec-fetch-site': 'same-origin' })
allow('地址栏直开导出链接', { host: 'bigolab.com', 'sec-fetch-site': 'none' })
allow('本地开发 localhost:3000', { host: 'localhost:3000', origin: 'http://localhost:3000', 'sec-fetch-site': 'same-origin' })
allow('http 直连 IP、端口不同', { host: '1.2.3.4', origin: 'http://1.2.3.4:8080' })
allow('老浏览器只带 Origin', { host: 'bigolab.com', origin: 'https://bigolab.com' })
allow('隧道改写了 Host，Origin 命中 APP_URL', { host: 'app:3000', origin: 'https://bigolab.com' })
allow('隧道改写 Host 且带 X-Forwarded-Host（靠 APP_URL 放行，不靠这个头）', { host: 'app:3000', 'x-forwarded-host': 'bigolab.com', origin: 'https://bigolab.com' })

console.log('\n机器调用（不带头，必须放行）：')
allow('curl / itest / 回调', { host: 'bigolab.com' })
allow('连 Host 都没有', {})

console.log('\n跨站 / 同站兄弟子域（必须拒绝）：')
deny('兄弟子域 no-cors POST', { host: 'bigolab.com', origin: 'https://view.bigolab.com', 'sec-fetch-site': 'same-site' })
deny('只带 Sec-Fetch-Site: same-site', { host: 'bigolab.com', 'sec-fetch-site': 'same-site' })
deny('只带兄弟子域 Origin', { host: 'bigolab.com', origin: 'https://lulu.bigolab.com' })
deny('外站', { host: 'bigolab.com', origin: 'https://evil.com', 'sec-fetch-site': 'cross-site' })
deny('外站仿冒后缀', { host: 'bigolab.com', origin: 'https://bigolab.com.evil.com' })
deny('Origin: null', { host: 'bigolab.com', origin: 'null' })
// 渠道分站集成阶段：X-Forwarded-Host 是客户端能自带的头，不再算「本站」（nginx 也把它置空）
deny('自带 X-Forwarded-Host 冒充本站', { host: 'bigolab.com', 'x-forwarded-host': 'lulu.bigolab.com', origin: 'https://lulu.bigolab.com' })
deny('Origin 乱写', { host: 'bigolab.com', origin: '::::' })
deny('Origin 同源但 Sec-Fetch-Site 说跨站（两条都要过）', { host: 'bigolab.com', origin: 'https://bigolab.com', 'sec-fetch-site': 'cross-site' })
deny('Sec-Fetch-Site 说同源但 Origin 是外站', { host: 'bigolab.com', origin: 'https://evil.com', 'sec-fetch-site': 'same-origin' })

console.log(`\n${pass} 通过，${fail} 失败`)
if (fail) process.exit(1)
