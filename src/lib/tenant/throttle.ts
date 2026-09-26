/**
 * 渠道侧限流与「噪声拒绝」汇总（设计 6.5.4、13.2、13.1 S15）。
 *
 * throttled：直接复用 lib/news/rate-limit 的进程内滑动窗口（按 key 前缀分桶、桶有容量上限，防随机 key 撑爆内存）。
 *   key 约定「写死的前缀:可变部分」，例如 `partner:1.2.3.4`、`pexport:2:17`。前缀里不要拼请求方可控的内容。
 *
 * countNoise：csrf、未登录 / 非成员、主站 Host、ADMIN 这类「噪声拒绝」不逐条写审计（否则一个脚本就能把 audit_events 写爆，S15），
 *   只在进程内按「IP + 原因」计数，每分钟汇总成**一行** console + **一条** SYSTEM 审计（action=authz.noise）。
 *   成员越权（有成员身份却调了没权限的点）不是噪声，由 partnerRoute 逐条写 authz.denied。
 */
import { rateLimited } from '../news/rate-limit'
import { writeAudit } from '../audit'

export function throttled(key: string, max: number, windowMs: number): boolean {
  return rateLimited(key, { max, windowMs })
}

const FLUSH_MS = 60_000
const MAX_KEYS = 1000
let counts = new Map<string, number>()
let windowStart = Date.now()
let timer: ReturnType<typeof setTimeout> | null = null

function flush(): void {
  timer = null
  if (counts.size === 0) return
  const snapshot = counts
  const from = windowStart
  counts = new Map()
  windowStart = Date.now()
  let total = 0
  const rows: { ip: string; reason: string; n: number }[] = []
  snapshot.forEach((n, k) => {
    total += n
    const i = k.lastIndexOf('|')
    rows.push({ ip: k.slice(0, i), reason: k.slice(i + 1), n })
  })
  rows.sort((a, b) => b.n - a.n)
  const top = rows.slice(0, 20)
  console.warn(
    `[partner] 近 ${Math.round((Date.now() - from) / 1000)}s 噪声拒绝 ${total} 次：` + top.map((r) => `${r.ip}/${r.reason}×${r.n}`).join(', '),
  )
  writeAudit(null, {
    actorKind: 'SYSTEM',
    action: 'authz.noise',
    result: 'DENIED',
    reasonCode: 'NOISE',
    diff: { from: new Date(from).toISOString(), total, keys: rows.length, top },
  }).catch((e) => console.error('[partner] 噪声汇总审计写入失败', e))
}

/** 记一次噪声拒绝。永不抛、永不阻塞请求 */
export function countNoise(ip: string, reason: string): void {
  try {
    const key = `${String(ip || 'unknown').slice(0, 64)}|${String(reason).slice(0, 24)}`
    if (!counts.has(key) && counts.size >= MAX_KEYS) {
      // 超过容量的新 key 合并进一个溢出桶，计数不丢、内存不涨
      const k = `*|${String(reason).slice(0, 24)}`
      counts.set(k, (counts.get(k) || 0) + 1)
    } else {
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    if (!timer) {
      timer = setTimeout(flush, FLUSH_MS)
      // 不让这个定时器拖住进程退出（itest、构建期）
      ;(timer as { unref?: () => void }).unref?.()
    }
  } catch {
    /* 计数失败不影响拒绝本身 */
  }
}

/** 仅供测试：立即汇总一次并返回本窗口的计数 */
export function flushNoiseForTest(): Map<string, number> {
  const snap = new Map(counts)
  if (timer) clearTimeout(timer)
  flush()
  return snap
}
