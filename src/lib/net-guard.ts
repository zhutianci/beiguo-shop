/**
 * 「这个地址能不能由服务端去请求」的纯判断（防 SSRF），不发任何网络请求。
 * 真正发请求走 lib/safe-fetch.ts：它在建连那一刻再用这里的 isPrivateAddress 校验 DNS 解析结果。
 *
 * 【为什么单独成文件】以前友链巡检（friend-link.ts）和「测试信源」（admin/news/sources/test）
 * 各写了一份内网判断，口径不一：后者用 startsWith('fc'/'fd') 把 fc2.com、fdroid.org 误判成内网；
 * 两份都只看字面量——`http://app.:3000/`、`http://localhost.:3000/` 这种结尾带点的写法
 * 能直接过关，在 docker 内置 DNS 下解析到 app / nginx / db 容器（2026-09-26 审计 G32 / G33）。
 *
 * 只在服务端用（import 了 node:net）。客户端的申请表单校验在 friend-link-client.normalizeUrl。
 */
import net from 'net'

/** 解析失败返回 null（不是合法的点分 IPv4） */
function v4Parts(ip: string): number[] | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return null
  const p = m.slice(1).map(Number)
  return p.every((x) => x <= 255) ? p : null
}

function v4Private([a, b, c]: number[]): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // 100.64/10，含阿里云实例元数据 100.100.100.200
    (a === 169 && b === 254) || // 链路本地，云厂商元数据的常见地址
    (a === 172 && b >= 16 && b <= 31) || // docker 默认网段就在这里
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // 组播与保留段
  )
}

/** IPv6 展开成 8 个 16 位整数；内嵌点分 IPv4（::ffff:1.2.3.4）也折算进去。不合法返回 null */
function v6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase()
  const pct = s.indexOf('%') // 去掉 zone id（fe80::1%eth0）
  if (pct !== -1) s = s.slice(0, pct)
  const lastColon = s.lastIndexOf(':')
  const tail = s.slice(lastColon + 1)
  if (tail.includes('.')) {
    const p = v4Parts(tail)
    if (!p) return null
    s = s.slice(0, lastColon + 1) + ((p[0] << 8) | p[1]).toString(16) + ':' + ((p[2] << 8) | p[3]).toString(16)
  }
  const halves = s.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0
  if (fill < 0) return null
  const all = [...head, ...Array(fill).fill('0'), ...rest]
  if (all.length !== 8 || !all.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null
  return all.map((g) => parseInt(g, 16))
}

/**
 * 纯 IP（不是域名）是否属于内网 / 回环 / 链路本地 / 保留段。
 * 入参必须是 IP：fc / fd 前缀按展开后的数值判断，不会误伤 fc2.com 这类域名。
 * 不是合法 IP 的一律当作不安全（true）。
 */
export function isPrivateAddress(ip: string): boolean {
  const kind = net.isIP(ip)
  if (kind === 4) {
    const p = v4Parts(ip)
    return !p || v4Private(p)
  }
  if (kind !== 6) return true
  const g = v6Groups(ip)
  if (!g) return true
  const zeros = (from: number, to: number) => g.slice(from, to).every((x) => x === 0)
  const embedded = (hi: number, lo: number) => v4Private([hi >> 8, hi & 255, lo >> 8, lo & 255])
  if (zeros(0, 8)) return true // ::
  if (zeros(0, 7) && g[7] === 1) return true // ::1
  if ((g[0] & 0xfe00) === 0xfc00) return true // fc00::/7 ULA
  if ((g[0] & 0xffc0) === 0xfe80 || (g[0] & 0xffc0) === 0xfec0) return true // 链路本地 / 旧站点本地
  if ((g[0] & 0xff00) === 0xff00) return true // 组播
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true // 文档保留段
  // 内嵌 IPv4 的几种写法：映射（::ffff:a.b.c.d）、兼容（::a.b.c.d）、NAT64（64:ff9b::a.b.c.d）
  if (zeros(0, 5) && (g[5] === 0xffff || g[5] === 0)) return embedded(g[6], g[7])
  if (g[0] === 0x64 && g[1] === 0xff9b && zeros(2, 6)) return embedded(g[6], g[7])
  if (g[0] === 0x2002) return embedded(g[1], g[2]) // 6to4
  return false
}

/**
 * 只看 URL.hostname 字面量的预检（域名解析到哪里由 safe-fetch 在建连时再查）。
 * IP 字面量建连时不走 DNS，只能在这里拦。
 *
 * 十进制、八进制、十六进制的花式 IP（http://2130706433/）不用单独处理：WHATWG URL 解析器
 * 已经把它们规范化成点分四段；IPv4-mapped IPv6 会被规范成 ::ffff:7f00:1，由 isPrivateAddress 还原。
 */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '') // 结尾的点：localhost. / app.
  if (!h) return true
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (net.isIP(h)) return isPrivateAddress(h)
  // 不带点的单段主机名：app / db / nginx 这类容器名，公网上不存在
  return !h.includes('.')
}

/** 返回拒绝原因，null 表示字面量层面可以请求 */
export function publicUrlProblem(raw: string | URL): string | null {
  let u: URL
  try {
    u = typeof raw === 'string' ? new URL(raw) : raw
  } catch {
    return '地址格式不正确'
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return '只支持 http / https'
  if (u.username || u.password) return '地址不能带账号密码'
  if (isBlockedHost(u.hostname)) return '拒绝请求内网地址'
  return null
}
