export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { topConverting } from '@/lib/content/attribution'
import { contentPath } from '@/lib/content/policy'

// 后台：内容带单（P3，设计 §13.2）。GET ?days=30
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const days = Math.min(180, Math.max(1, Number(new URL(request.url).searchParams.get('days')) || 30))
  const list = await topConverting(days)
  return success({ days, list: list.map((p) => ({ ...p, path: contentPath(p.type, p.id, p.slug) })) })
}
