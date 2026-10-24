/**
 * 限流 / 封禁用的 IP 键：IPv6 按 /64 聚合（一户通常分到整段 /64，按单地址限流等于随手绕过），
 * IPv4 与 IPv4-mapped 原样取 IPv4。
 * 叶子模块（零依赖）：auth-throttle、security/ip-ban、security/abuse 都从这里取，互相之间不再循环 import。
 */
export function ipKey(ip: string): string {
  if (!ip.includes(':')) return ip
  if (ip.includes('.')) return ip.slice(ip.lastIndexOf(':') + 1) // ::ffff:1.2.3.4
  const [head, tail] = ip.toLowerCase().split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  const groups = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t]
  return groups.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, '')).join(':') + '::/64'
}
