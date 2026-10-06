/**
 * 匿名可达的站内搜索限频（2026-10-07 安全加固）。
 *
 * 站内搜索是 LIKE '%词%' 全表扫（含正文 LONGTEXT），换一个查询词就绕过任何缓存：一个 for 循环就能把
 * 1.8G 机器上的 MySQL 打满，连带下单、收款回调一起变慢。真人一分钟搜不到 20 次；全站阈值远高于真实量，只兜被刷。
 * 进程内计数（lib/news/rate-limit），单容器部署下是准的；IPv6 按 /64 聚合（lib/auth-throttle 的 ipKey）。
 */
import { ipKey } from './auth-throttle'
import { clientIp, rateLimited, type RateRule } from './news/rate-limit'

const SEARCH_IP: RateRule = { windowMs: 60_000, max: 20 }
const SEARCH_ALL: RateRule = { windowMs: 60_000, max: 300 }

/** true = 本次搜索应拒绝（不查库）。scope 是写死的短名（learn / forum），各自分开计数 */
export function searchThrottled(headers: Headers, scope: 'learn' | 'forum'): boolean {
  const ip = clientIp(headers)
  if (ip !== 'unknown' && rateLimited(`search-ip:${scope}|${ipKey(ip)}`, SEARCH_IP)) return true
  return rateLimited(`search-all:${scope}`, SEARCH_ALL)
}
