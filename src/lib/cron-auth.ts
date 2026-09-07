import crypto from 'crypto'
import { NextRequest } from 'next/server'

/**
 * 定时任务接口的统一鉴权。
 *
 * 【为什么要单独抽一层：2026-09-07 的线上事故】
 * `/api/cron/*` 不在 middleware 的拦截范围（middleware 只管 `/api/admin/*`），
 * 每个路由自己查 CRON_SECRET。原来三个路由写的都是：
 *
 *     const secret = process.env.CRON_SECRET
 *     if (secret) { ...校验... }        // ← 密钥没配置时，整个校验块被跳过
 *
 * 而 `.env.production` 里**根本没有 CRON_SECRET 这一行**，docker-compose 又写的是
 * `- CRON_SECRET=${CRON_SECRET}`，于是容器拿到空字符串 → `if (secret)` 为假 →
 * **鉴权完全不执行**。实测（未带任何凭证，经公网入口）：
 *   /api/cron/news?stage=rank  → 200
 *   /api/cron/vmq-close        → 200
 *   /api/cron/sms-poll         → 200
 * 任何人都能反复触发内容管线烧掉 LLM 预算、或者去干扰买家的待支付订单。
 *
 * 同目录下的 `remind` 路由写的是 `if (!secret) return 500`，反而是安全的 ——
 * 差别只在「配置缺失时是放行还是拒绝」。所以这里定死一条规则：
 *
 *   **没有密钥 = 拒绝所有请求**，而不是「没有密钥 = 不需要密钥」。
 *
 * 配置缺失是运维问题，会在日志和监控里暴露出来；静默敞开则不会。
 */

export type CronAuthResult = { ok: true } | { ok: false; status: number; message: string }

/** 定长比较，避免用 `!==` 逐字符短路泄漏密钥前缀 */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

/**
 * 校验一次 cron 调用。接受三种携带方式（历史原因，三个路由各用过一种）：
 *   Authorization: Bearer <secret>
 *   x-cron-secret: <secret>
 *   ?secret=<secret>
 *
 * query 那种会进 nginx access log 与 Cloudflare 日志，属于「能用但不该新用」，
 * 保留只是因为 crontab 里的新闻管线三条任务是这么写的，改动它要同时改 cron 容器。
 */
export function assertCronAuth(request: NextRequest): CronAuthResult {
  const secret = (process.env.CRON_SECRET || '').trim()

  if (!secret) {
    // 故意用 503 而不是 500：这是「服务未正确配置，暂不可用」，不是代码崩了。
    // 日志里留一条明确的话，免得下一个人又以为是偶发故障。
    console.error(
      '[cron-auth] CRON_SECRET 未配置，已拒绝该请求。' +
        '注意：这不是「不需要鉴权」——配置缺失时一律拒绝，请在 .env.production 里补上并重启 app 与 cron 容器。'
    )
    return { ok: false, status: 503, message: '定时任务鉴权未配置，接口已停用' }
  }

  const bearer = request.headers.get('authorization') || ''
  const header = request.headers.get('x-cron-secret') || ''
  let qs = ''
  try {
    qs = new URL(request.url).searchParams.get('secret') || ''
  } catch {
    qs = ''
  }

  const hit =
    (bearer.startsWith('Bearer ') && safeEqual(bearer.slice(7), secret)) ||
    (!!header && safeEqual(header, secret)) ||
    (!!qs && safeEqual(qs, secret))

  return hit ? { ok: true } : { ok: false, status: 401, message: '无权限' }
}
