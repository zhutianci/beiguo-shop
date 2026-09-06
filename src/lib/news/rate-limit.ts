/**
 * 进程内滑动窗口限流。范式抄自 api/upload/route.ts，抽出来给 /api/news/* 共用。
 *
 * 【为什么必须限流】浏览与分享数直接进热度分（SKILL.md §3.5），
 * 不限流就等于开放一个刷榜入口——首页排序是可以被一个 for 循环买断的。
 * 去重靠数据库唯一约束兜底，限流负责在打到数据库之前就把洪水拦住。
 *
 * 【局限】单进程内存计数。standalone 单容器部署下是准的；
 * 将来横向扩到多副本会各算各的（上限变成 N 倍），那时再换 Redis 或落库。
 * 这一点不影响正确性，只影响严格程度，当前 1 个 app 容器不需要提前上分布式。
 */

const hits = new Map<string, number[]>()

export interface RateRule {
  windowMs: number
  max: number
}

/**
 * 返回 true 表示「已超限，应拒绝」。命中不计数，避免被拒的请求把窗口继续撑长。
 */
export function rateLimited(key: string, rule: RateRule): boolean {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < rule.windowMs)
  if (arr.length >= rule.max) {
    hits.set(key, arr)
    return true
  }
  arr.push(now)
  hits.set(key, arr)

  // 顺手清理，避免 Map 无限增长（tsconfig 未设 target，用 forEach 而非 for..of 遍历 Map）
  if (hits.size > 5000) {
    const stale: string[] = []
    hits.forEach((v, k) => {
      if (!v.some((t: number) => now - t < rule.windowMs)) stale.push(k)
    })
    stale.forEach((k) => hits.delete(k))
  }
  return false
}

/** 客户端 IP：Cloudflare Tunnel 在前，cf-connecting-ip 才是真实来源 */
export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
