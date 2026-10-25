export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleWebhookNotify, parseAmount, VMQ_KEY } from '@/lib/vmq'
import { notify, notifyWebhookRejected } from '@/lib/notify'
import { noteAbuse } from '@/lib/security/abuse'
import { createSignVerifier, type SignReject } from '@/lib/security/webhook-sign'

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
 *
 * 【签名模式（2026-10-24 第二轮加固 P2，docs/安全-第二轮加固-1024.md 2.1）】token 是静态的：进过一次日志（10-18 发生过）就永久可用。
 * SmsForwarder 的 Webhook 自带「Secret」：填了之后请求体里的 [timestamp] / [sign] 占位符被替换成毫秒时间戳与
 * sign = URL 编码( Base64( HMAC-SHA256(key = secret, msg = timestamp + "\n" + secret) ) )（源码 utils/sender/WebhookUtils.kt）。
 * secret 本身不再出现在请求里；这里只认 SIGN_WINDOW_MS 内的时间戳，每个签名处理成功后作废（重放无效）。
 *   VMQ_WEBHOOK_SECRET        签名密钥（openssl rand -hex 24）。设了 = 签名模式可用
 *   VMQ_WEBHOOK_ACCEPT_TOKEN  设了 SECRET 之后 token 还认不认：默认认（过渡期，每次用到记 vmq_token_auth_at）；两台手机改完后设 0
 * 【来源地区（P3）】VMQ_WEBHOOK_COUNTRIES=CN（逗号分隔，Cloudflare 的 CF-IPCountry）：不在名单里的一律拒。不设 = 不限。
 *   收款手机都在大陆运营商网络上（10-24 核对：两台手机分别走电信 IPv6 与移动 IPv4）；手机开了出境 VPN 会被拒，先在这里放开。
 * 【反复失败封 IP（P4）】token / 签名 / 地区不对的请求记进 security/abuse，同一 IP 10 分钟 5 次 → 封 1 小时并告警。
 *   **本接口自己不看 IP 封禁**：验过的请求照常处理，配错又改好的收款手机不会因为被封而漏单。
 */
const PRIMARY = process.env.VMQ_WEBHOOK_TOKEN || ''
const LEGACY = PRIMARY ? (process.env.VMQ_WEBHOOK_ACCEPT_LEGACY === '1' ? VMQ_KEY : '') : VMQ_KEY
const SIGN_SECRET = process.env.VMQ_WEBHOOK_SECRET || ''
const TOKEN_ACCEPTED = !SIGN_SECRET || process.env.VMQ_WEBHOOK_ACCEPT_TOKEN !== '0'
const COUNTRIES = (process.env.VMQ_WEBHOOK_COUNTRIES || '')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean)
// 所有可能出现在请求里的密钥（抹掉用）：不管认不认，都不能让它进日志
const ALL_SECRETS = [PRIMARY, VMQ_KEY, SIGN_SECRET].filter((s) => s && s.length >= 8)

if (SIGN_SECRET && SIGN_SECRET.length < 32) {
  console.error('[sms-notify] VMQ_WEBHOOK_SECRET 太短（建议 48 位 hex）')
}

// 签名校验与防重放（算法、窗口、作废规则见 lib/security/webhook-sign.ts）
const signer = createSignVerifier(SIGN_SECRET)

if (!PRIMARY) {
  console.error('[sms-notify] 未设置 VMQ_WEBHOOK_TOKEN，暂用 VMQ_KEY 校验到账通知。请用 openssl rand -hex 24 生成后写进 .env.production 并同步到手机端')
} else if (PRIMARY.length < 32) {
  console.error('[sms-notify] VMQ_WEBHOOK_TOKEN 太短（建议 48 位 hex）：这是「伪造到账」的主要屏障')
}

const REJECT_ALERT_INTERVAL_MS = 10 * 60_000
let lastRejectAlertAt = 0
const LEGACY_ALERT_INTERVAL_MS = 60 * 60_000
let lastLegacyAlertAt = 0
let lastTokenAuthWriteAt = 0
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

// 库里的签名占位（settings vmqsig:*）只需活过签名的有效窗口：每小时顺手清一次 1 天前的
let lastSigPruneAt = 0
function pruneSigRows(): void {
  if (Date.now() - lastSigPruneAt < 60 * 60_000) return
  lastSigPruneAt = Date.now()
  void prisma.setting
    .deleteMany({ where: { key: { startsWith: 'vmqsig:' }, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } })
    .catch((e) => console.error('[vmq] 清理签名占位失败', (e as Error)?.message))
}

async function handle(req: NextRequest) {
  const url = new URL(req.url)
  const raw = await req.text().catch(() => '')
  if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ code: -1, msg: '请求体过大' }, { status: 413 })

  // 只认 JSON 对象（后台给的模板）与表单（SmsForwarder 不填请求体时的默认格式）；纯文本 / 其它一律不当正文
  const FIELD_KEYS = ['token', 'timestamp', 'sign', 'content', 'msg', 'text', 'org', 'org_content', 'title', 'from']
  let fields: Record<string, string> | null = null
  if (raw) {
    try {
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        fields = {}
        for (const k of FIELD_KEYS) fields[k] = str((obj as Record<string, unknown>)[k])
      }
    } catch {
      if (/^[^{[\s][^\n]*=/.test(raw)) {
        const p = new URLSearchParams(raw)
        fields = {}
        for (const k of FIELD_KEYS) fields[k] = p.get(k) || ''
      }
    }
  }

  // 来源地区（P3）：Cloudflare 填的 CF-IPCountry；没有这个头（服务器本机自测）不拦
  const country = (req.headers.get('cf-ipcountry') || '').trim().toUpperCase()
  if (COUNTRIES.length && country && !COUNTRIES.includes(country)) {
    console.warn('[vmq] sms-notify 来源地区不在名单里，拒绝：', country)
    noteAbuse(req.headers, 'WEBHOOK_AUTH', `地区 ${country}`)
    return NextResponse.json({ code: -1, msg: '来源地区不允许' }, { status: 401 })
  }

  // 认证：签名优先（P2），其次 token（没设签名密钥、或过渡期还认 token 时）
  let signKey = ''
  let signReason: SignReject | null = null
  let signed = false
  if (SIGN_SECRET && fields && (fields.sign || fields.timestamp)) {
    const sr = signer.check(fields.timestamp, fields.sign)
    signReason = sr.reason
    if (!sr.reason) {
      signed = true
      signKey = sr.key
    }
  }
  const kind = signed ? 'primary' : TOKEN_ACCEPTED ? tokenKind(req.headers.get('x-token') || fields?.token || '') : null
  // 正文 = content / msg / text / org / org_content / title，再拼上 from（顺序与原来一致：[content] 在最前，lib/vmq-notice.ts 的格式校验锚在开头）
  const content = fields
    ? redact(['content', 'msg', 'text', 'org', 'org_content', 'title', 'from'].map((k) => fields![k]).filter(Boolean).join(' ').trim())
    : ''

  if (!kind) {
    const inQuery = url.searchParams.has('token')
    console.warn(
      '[vmq] sms-notify 校验不通过' +
        (signReason ? `（签名：${signReason}）` : '') +
        (inQuery ? '（token 放在了 URL 上：不支持，请改放 JSON 请求体，并轮换 VMQ_WEBHOOK_TOKEN）' : '')
    )
    noteAbuse(req.headers, 'WEBHOOK_AUTH', signReason ? `签名 ${signReason}` : 'token 不对')
    if (signReason === 'replay') return NextResponse.json({ code: -1, msg: '签名已使用' }, { status: 401 })
    if (signReason === 'stale') return NextResponse.json({ code: -1, msg: '时间戳过期（请检查手机时间）' }, { status: 401 })
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
  // 签名模式已开、手机还在用 token：记一下最近时间（后台据此判断两台手机是否都改完），10 分钟最多写一次
  if (SIGN_SECRET && !signed && Date.now() - lastTokenAuthWriteAt > 10 * 60_000) {
    lastTokenAuthWriteAt = Date.now()
    await prisma.setting
      .upsert({ where: { key: 'vmq_token_auth_at' }, create: { key: 'vmq_token_auth_at', value: String(Date.now()) }, update: { value: String(Date.now()) } })
      .catch((e) => console.error('[vmq] 记录 token 认证时间失败', e))
  }
  if (!content) {
    if (signed) signer.markUsed(signKey)
    return NextResponse.json({ code: -1, msg: '空内容' }, { status: 200 })
  }

  // 【验签即占位】（2026-10-25 第三轮加固）同一个签名并发进来两次，只有先到的那个往下走；
  // 进程内占位挡并发，库里占位挡「重启后在 10 分钟窗口内重放」（进程内记录随重启清空）
  const dbSigKey = signed ? `vmqsig:${crypto.createHash('sha256').update(signKey).digest('hex').slice(0, 40)}` : ''
  if (signed) {
    if (!signer.claim(signKey)) return NextResponse.json({ code: -1, msg: '签名已使用' }, { status: 401 })
    try {
      await prisma.setting.create({ data: { key: dbSigKey, value: String(Date.now()) } })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') {
        // 库里已有：重启前处理过的签名。保持占位，不放开
        noteAbuse(req.headers, 'WEBHOOK_AUTH', '签名重放')
        return NextResponse.json({ code: -1, msg: '签名已使用' }, { status: 401 })
      }
      signer.release(signKey)
      throw e // 库挂了：回 500 让手机重试
    }
    pruneSigRows()
  }

  // 注意不要给这里包「一律回 200」的整体 catch：到账记到收款单之前的失败（库挂了）要回 500，
  // 让 SmsForwarder 重试；记到收款单之后的失败 lib/vmq.ts 已自行吞掉并告警，不会再抛到这里
  let r: Awaited<ReturnType<typeof handleWebhookNotify>>
  try {
    r = await handleWebhookNotify(content, { from: fields.from })
  } catch (e) {
    // 处理失败要让 SmsForwarder 重试同一签名：放开两处占位（同一条通知的重复入账另有原文摘要去重兜底）
    if (signed) {
      signer.release(signKey)
      await prisma.setting.deleteMany({ where: { key: dbSigKey } }).catch(() => {})
    }
    throw e
  }
  if (signed) signer.markUsed(signKey)
  console.log(`[vmq] sms-notify ${signed ? 'sign' : kind} matched=${r.matched} amount=${r.amount} type=${r.type}`)
  // 始终回 200，便于 SmsForwarder 判定成功
  return NextResponse.json({ code: 1, msg: '成功', matched: r.matched, amount: r.amount })
}

// 只收 POST：GET / PUT / PATCH 由 Next 自动回 405（GET 会把 token 和正文一起放进 URL、进访问日志）
export const POST = handle
