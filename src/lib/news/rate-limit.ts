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
 *
 * 【容量上限】key 里多半带着请求方能随便换的东西（匿名 id、viewerKey、IPv6 地址），
 * 不设上限，任何人用随机 key 刷就能把这张表撑到 app 容器 OOM（mem_limit 1024m）。
 * 以前的「超过 5000 条就全表扫一遍删过期的」挡不住：key 都还在窗口内时一条也删不掉，
 * 反而每个请求都多扫一遍全表；而且扫的时候拿的是「本次调用」的窗口去判断所有 key，
 * 60 秒窗口的调用会把 24 小时窗口的计数（分享去重）提前删掉。现在：
 *  - 按 key 的前缀（第一个冒号之前，如 nv / nv-ip / rd-ip）分桶，每桶最多 MAX_KEYS_PER_SCOPE 个。
 *    分桶是为了隔离：拿随机 viewerKey 刷 /api/news/view 只会挤掉 nv 桶里的旧计数，
 *    挤不掉兑换、开票那些桶——否则「刷满这张表就能把别人的限流计数清零」会变成新的绕过口。
 *  - 桶内按最近使用排序（Map 保持插入顺序，每次访问都挪到队尾），满了从队头淘汰：
 *    先走的是最久没动过的 key；正在被打满的 key 每次命中都会挪回队尾，最不容易被挤掉。
 *    被淘汰的 key 计数归零（放行方向出错），这是有上限必须付的代价，桶足够大时只有被刷时才会发生。
 *  - 每次新建 key 时顺手清掉队头已过期的条目，按各自的窗口判断，平时不需要全表扫描。
 *
 * 【调用约定】key 写成「代码里写死的前缀:可变部分」。前缀里不能拼请求方可控的内容，
 * 否则桶的个数本身就不受控了（超过 MAX_SCOPES 之后新前缀一律挤进同一个溢出桶兜底）。
 */

const MAX_KEYS_PER_SCOPE = 5000
const MAX_SCOPES = 200
const OVERFLOW_SCOPE = '\u0000overflow'

interface Entry {
  hits: number[]
  windowMs: number
}

const scopes = new Map<string, Map<string, Entry>>()

export interface RateRule {
  windowMs: number
  max: number
}

function scopeOf(key: string): string {
  const i = key.indexOf(':')
  return i === -1 ? key : key.slice(0, i)
}

function bucketOf(key: string): Map<string, Entry> {
  let scope = scopeOf(key)
  if (!scopes.has(scope) && scopes.size >= MAX_SCOPES) scope = OVERFLOW_SCOPE
  let bucket = scopes.get(scope)
  if (!bucket) {
    bucket = new Map()
    scopes.set(scope, bucket)
  }
  return bucket
}

function expired(e: Entry, now: number): boolean {
  return e.hits.length === 0 || now - e.hits[e.hits.length - 1] >= e.windowMs
}

/** 为新 key 腾位置：从队头（最久没访问的）起，删掉已过期的；桶满时不论过期与否都删 */
function makeRoom(bucket: Map<string, Entry>, now: number): void {
  // tsconfig 未设 target，不能 for..of 遍历 Map；forEach 又不能中途停，所以手动推迭代器
  const it = bucket.entries()
  for (let r = it.next(); !r.done; r = it.next()) {
    const [k, e] = r.value
    if (bucket.size < MAX_KEYS_PER_SCOPE && !expired(e, now)) break
    bucket.delete(k)
  }
}

/**
 * 返回 true 表示「已超限，应拒绝」。命中不计数，避免被拒的请求把窗口继续撑长。
 */
export function rateLimited(key: string, rule: RateRule): boolean {
  const now = Date.now()
  const bucket = bucketOf(key)
  const prev = bucket.get(key)
  const hits = prev ? prev.hits.filter((t) => now - t < rule.windowMs) : []
  const limited = hits.length >= rule.max
  if (!limited) hits.push(now)

  if (prev) bucket.delete(key) // 删了再 set = 挪到队尾，标记为最近使用
  else makeRoom(bucket, now)
  bucket.set(key, { hits, windowMs: rule.windowMs })
  return limited
}

/**
 * 删掉某个 key 的计数。给「证明了身份之后解除冷却」用——例如重置密码成功后解除该邮箱的登录冷却，
 * 否则别人故意输错就能把一个真实用户锁在门外。
 */
export function rateClear(key: string): void {
  scopes.get(scopeOf(key))?.delete(key)
  scopes.get(OVERFLOW_SCOPE)?.delete(key) // 桶数超过 MAX_SCOPES 时这个 key 落在溢出桶
}

/** 某个前缀的桶里当前有多少个 key（给自测脚本 scripts/check-rate-limit.ts 用） */
export function rateLimitKeyCount(scope: string): number {
  return scopes.get(scope)?.size ?? 0
}

/** 当前有多少个桶（同上，只给自测用） */
export function rateLimitScopeCount(): number {
  return scopes.size
}

/**
 * 客户端 IP。
 *
 * 能直接信这几个头，是因为 nginx 每一跳都会用它核实过的地址把三个头整个覆盖掉
 * （nginx.conf 顶部那段）：走域名的从 cloudflared 那里取 Cloudflare 填的真实 IP，
 * 直连公网 IP 的一律按 TCP 对端地址算。客户端自己带来的值到不了这里。
 * app 只在容器网络里 expose、不对外映射，没有绕过 nginx 的路径。
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
