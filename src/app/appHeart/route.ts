export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkHeartSign, touchHeartbeat, closeExpired } from '@/lib/vmq'

// V免签监控端心跳：GET/POST /appHeart?t=<ms>&sign=md5(t+key)
async function handle(req: NextRequest) {
  await closeExpired()
  const p = await readParams(req)
  const t = p.t || ''
  const sign = p.sign || ''
  if (!t || !sign || !checkHeartSign(t, sign)) {
    return NextResponse.json({ code: -1, msg: '签名校验不通过' })
  }
  await touchHeartbeat()
  return NextResponse.json({ code: 1, msg: '成功' })
}

export const GET = handle
export const POST = handle

async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const u = new URL(req.url)
  const p: Record<string, string> = {}
  u.searchParams.forEach((v, k) => (p[k] = v))
  if (req.method === 'POST') {
    try {
      const ct = req.headers.get('content-type') || ''
      if (ct.includes('json')) {
        const j = await req.json()
        for (const k of Object.keys(j)) if (p[k] == null) p[k] = String(j[k])
      } else {
        const f = await req.formData()
        f.forEach((v, k) => {
          if (p[k] == null) p[k] = String(v)
        })
      }
    } catch {
      /* ignore */
    }
  }
  return p
}
