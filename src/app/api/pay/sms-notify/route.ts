export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleWebhookNotify, parseAmount, VMQ_KEY } from '@/lib/vmq'
import { notify, notifyWebhookRejected } from '@/lib/notify'

/*
 * SmsForwarder 等「通知转发」App 的 webhook：手机把支付宝 / 微信到账通知 POST 到这里，服务端按金额匹配待支付单。
 * 这个接口能把订单标成已支付，攻击者最想伪造的就是它（2026-10-15 起有人持续盲猜支付回调）。层层设防：
 *  ① token：只认 X-Token 头或请求体里的 token，常量时间比较；**刻意不认 ?token=**（URL 会原样进 nginx / CF 日志）；只收 POST。
 *  ② 来源 App 白名单 + 系统到账通知格式（lib/vmq-notice.ts）：来源不对、聊天消息冒充的都不自动取用，进人工并推送。
 *  ③ 金额全站唯一、只匹配待支付单；同一条通知重发不会二次入账（lib/vmq.ts registerNotice）。
 *  ④ 不把原始请求体当通知内容：原来字段取不到时把整个请求体当正文，手机端模板配错时 token 就跟着进了日志和后台
 *    （2026-10-18 实际发生过）。现在只认 content / org 等字段，并且无论如何先把 token 从正文里抹掉再落库、打日志。
 *
 * 【token 轮换】VMQ_WEBHOOK_TOKEN 是正式 token（openssl rand -hex 24）。没设时退回 VMQ_KEY（旧部署）。
 * 设了之后旧的 VMQ_KEY 只在 VMQ_WEBHOOK_ACCEPT_LEGACY=1 时还认（给手机端改配置的过渡期），每次用到都记时间、每小时推一次提醒；
 * 两台手机都改完后把它删掉（改 .env.production 后 `docker compose --env-file .env.production up -d app`，不用重新构建）。
 */
const PRIMARY = process.env.VMQ_WEBHOOK_TOKEN || ''
const LEGACY = PRIMARY ? (process.env.VMQ_WEBHOOK_ACCEPT_LEGACY === '1' ? VMQ_KEY : '') : VMQ_KEY
// 所有可能出现在请求里的密钥（抹掉用）：不管认不认，都不能让它进日志
const ALL_SECRETS = [PRIMARY, VMQ_KEY].filter((s) => s && s.length >= 8)

if (!PRIMARY) {
  console.error('[sms-notify] 未设置 VMQ_WEBHOOK_TOKEN，暂用 VMQ_KEY 校验到账通知。请用 openssl rand -hex 24 生成后写进 .env.production 并同步到手机端')
} else if (PRIMARY.length < 32) {
  console.error('[sms-notify] VMQ_WEBHOOK_TOKEN 太短（建议 48 位 hex）：这是「伪造到账」的主要屏障')
}

const REJECT_ALERT_INTERVAL_MS = 10 * 60_000
let lastRejectAlertAt = 0
const LEGACY_ALERT_INTERVAL_MS = 60 * 60_000
let lastLegacyAlertAt = 0
// 正文上限：到账通知只有几百字，超长的直接拒（不解析、不落库）
const MAX_BODY_CHARS = 20_000

/** 各自 sha256 成定长再比，长度不同也不短路；非字符串一律不通过 */
function same(provided: string, secret: string): boolean {
  if (!secret || !provided) return false
  const a = crypto.createHash('sha256').update(provided).digest()
  const b = crypto.createHash('sha256').update(secret).digest()
  return crypto.timingSafeEqual(a, b)
}

function tokenKind(provided: unknown): 'primary' | 'legacy' | null {
  if (typeof provided !== 'string' || !provided) return null
  // 两个都比，不因第一个比中而短路（时间上不暴露是哪一个）
  const p = !!PRIMARY && same(provided, PRIMARY)
  const l = !!LEGACY && same(provided, LEGACY)
  return p ? 'primary' : l ? 'legacy' : null
}

/** 把任何密钥从文本里抹掉（防手机端模板配错时 token 跟着正文进日志 / 库 / 后台页面） */
function redact(text: string): string {
  let t = text
  for (const s of ALL_SECRETS) t = t.split(s).join('***')
  return t
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

async function handle(req: NextRequest) {
  const url = new URL(req.url)
  const raw = await req.text().catch(() => '')
  if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ code: -1, msg: '请求体过大' }, { status: 413 })

  // 只认 JSON 对象（后台给的模板）与表单（SmsForwarder 不填请求体时的默认格式）；纯文本 / 其它一律不当正文
  let fields: Record<string, string> | null = null
  if (raw) {
    try {
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        fields = {}
        for (const k of ['token', 'content', 'msg', 'text', 'org', 'org_content', 'title', 'from']) fields[k] = str((obj as Record<string, unknown>)[k])
      }
    } catch {
      if (/^[^{[\s][^\n]*=/.test(raw)) {
        const p = new URLSearchParams(raw)
        fields = {}
        for (const k of ['token', 'content', 'msg', 'text', 'org', 'org_content', 'title', 'from']) fields[k] = p.get(k) || ''
      }
    }
  }

  const kind = tokenKind(req.headers.get('x-token') || fields?.token || '')
  // 正文 = content / msg / text / org / org_content / title，再拼上 from（顺序与原来一致：[content] 在最前，lib/vmq-notice.ts 的格式校验锚在开头）
  const content = fields
    ? redact(['content', 'msg', 'text', 'org', 'org_content', 'title', 'from'].map((k) => fields![k]).filter(Boolean).join(' ').trim())
    : ''

  if (!kind) {
    const inQuery = url.searchParams.has('token')
    console.warn(
      '[vmq] sms-notify token 校验不通过' + (inQuery ? '（token 放在了 URL 上：不支持，请改放 JSON 请求体，并轮换 VMQ_WEBHOOK_TOKEN）' : '')
    )
    const amount = parseAmount(content)
    if ((inQuery || amount) && Date.now() - lastRejectAlertAt > REJECT_ALERT_INTERVAL_MS) {
      lastRejectAlertAt = Date.now()
      notifyWebhookRejected({ inQuery, amount }) // fire-and-forget
    }
    // 回 401：SmsForwarder 在转发日志里标失败并按自身策略重试，站长在手机上也看得到
    return NextResponse.json({ code: -1, msg: inQuery ? 'token 不能放在 URL 上，请放在请求体' : 'token 校验不通过' }, { status: 401 })
  }
  if (kind === 'legacy') {
    console.warn('[vmq] sms-notify 用的是旧 token（VMQ_KEY）：请把手机端改成新的 VMQ_WEBHOOK_TOKEN')
    await prisma.setting
      .upsert({ where: { key: 'vmq_legacy_token_at' }, create: { key: 'vmq_legacy_token_at', value: String(Date.now()) }, update: { value: String(Date.now()) } })
      .catch((e) => console.error('[vmq] 记录旧 token 使用时间失败', e))
    if (Date.now() - lastLegacyAlertAt > LEGACY_ALERT_INTERVAL_MS) {
      lastLegacyAlertAt = Date.now()
      notify(
        'security.alert',
        [
          { label: '情况', value: '手机端转发到账通知时还在用旧的 token（已泄露过、强度不足），过渡期仍照常处理', color: 'warning' },
          { label: '处理', value: '把两台手机 SmsForwarder 里的 token 换成后台「收款监控」显示的新 token；都换完后删掉 VMQ_WEBHOOK_ACCEPT_LEGACY' },
        ],
        { link: '/admin/vmq', extraTitle: '收款回调仍在用旧 token' }
      )
    }
  }
  if (!fields) return NextResponse.json({ code: -1, msg: '请求体须为 JSON（后台「收款监控」有现成模板）' }, { status: 400 })
  if (!content) return NextResponse.json({ code: -1, msg: '空内容' }, { status: 200 })

  // 注意不要给这里包「一律回 200」的整体 catch：到账记到收款单之前的失败（库挂了）要回 500，
  // 让 SmsForwarder 重试；记到收款单之后的失败 lib/vmq.ts 已自行吞掉并告警，不会再抛到这里
  const r = await handleWebhookNotify(content, { from: fields.from })
  console.log(`[vmq] sms-notify matched=${r.matched} amount=${r.amount} type=${r.type}`)
  // 始终回 200，便于 SmsForwarder 判定成功
  return NextResponse.json({ code: 1, msg: '成功', matched: r.matched, amount: r.amount })
}

// 只收 POST：GET / PUT / PATCH 由 Next 自动回 405（GET 会把 token 和正文一起放进 URL、进访问日志）
export const POST = handle
