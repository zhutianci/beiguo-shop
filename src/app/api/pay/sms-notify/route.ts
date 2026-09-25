export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookNotify, parseAmount, VMQ_KEY } from '@/lib/vmq'
import { notifyWebhookRejected } from '@/lib/notify'

// SmsForwarder 等「通知转发」App 的 webhook：把支付宝到账通知 POST 到这里
// 兼容 JSON / 表单 / 纯文本 body；token 只认 X-Token 头 / body 里的 token（JSON 还认 sign）。
// 【刻意不认 ?token=、只收 POST】URL 会原样进 nginx access log（log_format 的 "$request"）和 CF 日志，
// 而这个 token 是「伪造到账」的唯一屏障 —— 同 lib/dispense.ts 不收 ?secret= 的理由。
// GET 还会把正文一起放进 URL。后台生成的配置本来就是 POST + JSON body，按文档配的不受影响。
// 回落 VMQ_KEY 保留：VmqApk 移除后 VMQ_KEY 已无其它用途，不构成密钥复用；
// 线上按文档 VMQ_WEBHOOK_TOKEN 留空，去掉回落会直接断掉到账。
const SECRET = process.env.VMQ_WEBHOOK_TOKEN || VMQ_KEY

/*
 * token 被拒的告警限流（进程内，每 10 分钟最多推一次）。
 * 被拒路径不写库（未鉴权的请求不该能写 settings 表），只靠这条推送让站长知道：
 * 手机端 token 配错 / 仍放在 URL 上时，每一笔真实到账都会被拒，订单超时取消却没人知道。
 * 只在「token 在 URL 上」或「正文里真带着成功收款X元」时推，扫描器的随机请求不会吵醒人。
 */
const REJECT_ALERT_INTERVAL_MS = 10 * 60_000
let lastRejectAlertAt = 0

/** 各自 sha256 成定长再比，长度不同也不短路；非字符串一律不通过（与原 !== 行为一致） */
function tokenOk(provided: unknown): boolean {
  if (!SECRET || typeof provided !== 'string' || !provided) return false
  const a = crypto.createHash('sha256').update(provided).digest()
  const b = crypto.createHash('sha256').update(SECRET).digest()
  return crypto.timingSafeEqual(a, b)
}

async function handle(req: NextRequest) {
  const url = new URL(req.url)
  let token: unknown = req.headers.get('x-token') || ''
  let content = ''
  // 通知来源（SmsForwarder 的 [from]，应用通知时是包名）：单独取出来做来源白名单，见 lib/vmq.ts handleWebhookNotify。
  // content 的拼接保持原样（仍含 from），保证原文日志和渠道判定不变
  let from = ''

  const raw = await req.text().catch(() => '')
  let obj: Record<string, unknown> | null = null
  if (raw) {
    try {
      obj = JSON.parse(raw)
    } catch {
      obj = null
    }
  }

  const pick = (o: Record<string, unknown>, keys: string[]) =>
    keys.map((k) => o[k]).filter((v) => typeof v === 'string' && v).join(' ')

  if (obj && typeof obj === 'object') {
    token = token || obj.token || obj.sign || ''
    from = typeof obj.from === 'string' ? obj.from : ''
    content = pick(obj, ['content', 'msg', 'text', 'org', 'org_content', 'desp', 'title', 'from'])
    if (!content) content = raw
  } else if (raw) {
    // 尝试按表单解析，否则当纯文本
    try {
      const p = new URLSearchParams(raw)
      token = token || p.get('token') || ''
      from = p.get('from') || ''
      const c = ['content', 'msg', 'text', 'org', 'org_content', 'from']
        .map((k) => p.get(k))
        .filter(Boolean)
        .join(' ')
      content = c || raw
    } catch {
      content = raw
    }
  }

  // 合并 query 里的文案（正文不是密钥，留着零风险）
  const qc = ['title', 'content', 'msg'].map((k) => url.searchParams.get(k)).filter(Boolean).join(' ')
  if (qc) content = `${content} ${qc}`.trim()

  if (!tokenOk(token)) {
    const inQuery = url.searchParams.has('token')
    console.warn(
      '[vmq] sms-notify token 校验不通过' +
        (inQuery ? '（token 放在了 URL 上：已不再支持，请改放 JSON body，并轮换 VMQ_WEBHOOK_TOKEN）' : '')
    )
    const amount = parseAmount(content)
    if ((inQuery || amount) && Date.now() - lastRejectAlertAt > REJECT_ALERT_INTERVAL_MS) {
      lastRejectAlertAt = Date.now()
      notifyWebhookRejected({ inQuery, amount }) // fire-and-forget
    }
    // 【回 401 而不是 200】原来回 200 + code:-1，SmsForwarder 当作投递成功、不重试也不标红，
    // 手机端看不出任何异常。回 401 让它在转发日志里标失败并按自身策略重试，站长在手机上也看得到
    return NextResponse.json(
      { code: -1, msg: inQuery ? 'token 不能放在 URL 上，请放在请求体' : 'token 校验不通过' },
      { status: 401 }
    )
  }
  if (!content) {
    return NextResponse.json({ code: -1, msg: '空内容' }, { status: 200 })
  }

  // 注意不要给这里包「一律回 200」的整体 catch：到账记到收款单之前的失败（库挂了）要回 500，
  // 让 SmsForwarder 重试；记到收款单之后的失败 lib/vmq.ts 已自行吞掉并告警，不会再抛到这里
  const r = await handleWebhookNotify(content, { from })
  console.log(`[vmq] sms-notify matched=${r.matched} amount=${r.amount} type=${r.type}`)
  // 始终回 200，便于 SmsForwarder 判定成功
  return NextResponse.json({ code: 1, msg: '成功', matched: r.matched, amount: r.amount })
}

// 只收 POST：GET / PUT / PATCH 由 Next 自动回 405（GET 会把 token 和正文一起放进 URL、进访问日志）
export const POST = handle
