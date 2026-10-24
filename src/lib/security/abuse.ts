/**
 * 「反复被限流 / 反复认证失败」的累计与处置（2026-10-24 第二轮加固 X1 / P4，docs/安全-第二轮加固-1024.md）。
 *
 * 【为什么】限流只能让单次暴力破解变慢，挡不住「换个窗口再来一轮」：10-22 199.102.218.24 在 8 分钟里试了 61 次重置密码
 * （第 31 次起全被 429）、30 次查订阅验证码，然后它随时可以每 10 分钟再来一轮。回调 token 错误以前也只推告警、不封。
 * 这里把「被拒」本身当信号：同一 IP 在窗口内被拒到阈值 → 封 1 小时（lib/security/ip-ban.ts，只挡登录 / 注册 / 发码 / 下单 / 付款 / 上传）、
 * 写 audit_events（sec.ipban）、推安全告警。
 *
 * | 信号 | 调用点 | 阈值 |
 * |---|---|---|
 * | AUTH_THROTTLED 登录 / 发码 / 校验验证码被限流 | lib/auth-throttle.ts 的三个闸门拒绝时 | 10 分钟 15 次 |
 * | WEBHOOK_AUTH 支付回调 token / 签名错误、来源国家不对 | api/pay/sms-notify | 10 分钟 5 次 |
 *
 * 正常用户碰不到阈值：手滑多点两下发码是 1~2 次拒绝；收款手机配错 token 会被封，但它的请求本来就全被拒（配好之后
 * 回调本身不看 IP 封禁，见 sms-notify），被封只影响那个 IP 上的登录 / 下单 1 小时。
 * 进程内计数（发版清零，放行方向）；条目有上限。绝不抛错。
 */
import { clientIp, rateLimited } from '../news/rate-limit'
import { ipKey } from '../ip-key'
import { banIp, ipKeyBanned } from './ip-ban'
import { writeAudit } from '../audit'
import { notify } from '../notify'

export type AbuseKind = 'AUTH_THROTTLED' | 'WEBHOOK_AUTH'

const MIN = 60_000
const BAN_MS = 60 * MIN

export const ABUSE_RULES: Record<AbuseKind, { max: number; windowMs: number; label: string }> = {
  AUTH_THROTTLED: { max: 15, windowMs: 10 * MIN, label: '登录 / 验证码被反复限流（疑似暴力破解）' },
  WEBHOOK_AUTH: { max: 5, windowMs: 10 * MIN, label: '支付回调密钥 / 签名反复错误（疑似伪造到账）' },
}

interface Track {
  first: number
  hits: number
  details: string[]
  acted: boolean
}
const MAX_TRACKS = 5000
const tracks = new Map<string, Track>()

function keyOf(headers: Headers): string | null {
  const ip = clientIp(headers)
  return ip && ip !== 'unknown' ? ipKey(ip) : null
}

/** 记一次「被拒」。到阈值时封 IP + 审计 + 告警；返回 true = 这一次触发了封禁 */
export function noteAbuse(headers: Headers, kind: AbuseKind, detail: string): boolean {
  try {
    const ip = keyOf(headers)
    if (!ip) return false
    const rule = ABUSE_RULES[kind]
    const now = Date.now()
    const k = `${kind}|${ip}`
    let t = tracks.get(k)
    if (t && now - t.first >= rule.windowMs) t = undefined
    if (!t) {
      while (tracks.size >= MAX_TRACKS) {
        const oldest = tracks.keys().next()
        if (oldest.done) break
        tracks.delete(oldest.value)
      }
      t = { first: now, hits: 0, details: [], acted: false }
    } else {
      tracks.delete(k) // 挪到队尾
    }
    t.hits++
    if (t.details.length < 6 && !t.details.includes(detail)) t.details.push(detail.slice(0, 60))
    tracks.set(k, t)
    if (t.acted || t.hits < rule.max) return false
    t.acted = true

    const already = ipKeyBanned(ip)
    if (!already) banIp(ip, BAN_MS, kind)
    const sample = t.details.join('；')
    console.warn('[security] 反复被拒，封 IP', kind, ip, t.hits, sample)
    void writeAudit(null, {
      actorKind: 'SYSTEM',
      action: 'sec.ipban',
      targetType: 'ip',
      targetId: ip.slice(0, 40),
      reasonCode: kind.slice(0, 24),
      reason: `${rule.label}：10 分钟内 ${t.hits} 次（${sample}）`.slice(0, 255),
    }).catch(() => {})
    // 同一 IP 每小时 1 条、全站每小时最多 30 条（与蜜罐告警共用总闸）
    if (!rateLimited(`sec-alert:${kind}:${ip}`, { windowMs: 60 * MIN, max: 1 }) && !rateLimited('sec-alert-all', { windowMs: 60 * MIN, max: 30 })) {
      notify(
        'security.alert',
        [
          { label: '类型', value: rule.label },
          { label: '来源 IP', value: ip },
          { label: '10 分钟内', value: `${t.hits} 次` },
          { label: '样例', value: sample || '—' },
          { label: '处置', value: already ? 'IP 此前已被封禁' : 'IP 已封 1 小时（只挡登录 / 注册 / 下单 / 付款 / 上传）' },
        ],
        { link: '/admin/settings', linkText: '后台查看安全记录' },
      )
    }
    return !already
  } catch (e) {
    console.error('[security] noteAbuse 失败', (e as Error)?.message)
    return false
  }
}

/** 仅供自测 */
export function resetAbuseForTest(): void {
  tracks.clear()
}
