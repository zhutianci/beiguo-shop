export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { manualComplete, VmqError } from '@/lib/vmq'

const schema = z.object({ id: z.number().int().positive() })

// 后台手动补单：强制确认某条收款单已到账并履约
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error('参数错误')
    await manualComplete(parsed.data.id)
    return success({ id: parsed.data.id }, '已确认到账并完成履约')
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Vmq manual complete error:', err)
    return error('补单失败')
  }
}
