export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookNotify, VMQ_KEY } from '@/lib/vmq'

// SmsForwarder 等「通知转发」App 的 webhook：把支付宝到账通知 POST 到这里
// 兼容 JSON / 表单 / 纯文本 / query；token 可放 header(X-Token) / body / query
const SECRET = process.env.VMQ_WEBHOOK_TOKEN || VMQ_KEY

async function handle(req: NextRequest) {
  const url = new URL(req.url)
  let token = req.headers.get('x-token') || url.searchParams.get('token') || ''
  let content = ''

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
    token = token || (obj.token as string) || (obj.sign as string) || ''
    content = pick(obj, ['content', 'msg', 'text', 'org', 'org_content', 'desp', 'title', 'from'])
    if (!content) content = raw
  } else if (raw) {
    // 尝试按表单解析，否则当纯文本
    try {
      const p = new URLSearchParams(raw)
      token = token || p.get('token') || ''
      const c = ['content', 'msg', 'text', 'org', 'org_content', 'from']
        .map((k) => p.get(k))
        .filter(Boolean)
        .join(' ')
      content = c || raw
    } catch {
      content = raw
    }
  }

  // 合并 query 里的文案（万一用 GET）
  const qc = ['title', 'content', 'msg'].map((k) => url.searchParams.get(k)).filter(Boolean).join(' ')
  if (qc) content = `${content} ${qc}`.trim()

  if (!SECRET || token !== SECRET) {
    console.warn('[vmq] sms-notify token 校验不通过')
    return NextResponse.json({ code: -1, msg: 'token 校验不通过' }, { status: 200 })
  }
  if (!content) {
    return NextResponse.json({ code: -1, msg: '空内容' }, { status: 200 })
  }

  const r = await handleWebhookNotify(content)
  console.log(`[vmq] sms-notify matched=${r.matched} amount=${r.amount} type=${r.type}`)
  // 始终回 200，便于 SmsForwarder 判定成功
  return NextResponse.json({ code: 1, msg: '成功', matched: r.matched, amount: r.amount })
}

export const POST = handle
export const GET = handle
export const PUT = handle
export const PATCH = handle
