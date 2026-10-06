export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { sponsorSchema } from '@/lib/content/sponsor'

// 后台：赞助位（P3，设计 §9.3）。GET 列表；POST 新建；PATCH {id, ...} 修改 / 上下架
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  const list = await prisma.sponsorSlot.findMany({ orderBy: [{ endAt: 'desc' }], take: 100 })
  return success({ list })
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = sponsorSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.issues[0]?.message || '参数无效')
    const d = parsed.data
    const row = await prisma.sponsorSlot.create({ data: { ...d, blurb: d.blurb || null, image: d.image || null, active: d.active ?? true } })
    return success({ id: row.id }, '已添加')
  } catch (err) {
    console.error('Admin sponsor create error:', err)
    return error('保存失败')
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = await request.json().catch(() => null)
    const id = z.number().int().positive().safeParse(body?.id)
    if (!id.success) return error('参数无效')
    if (Object.keys(body).length === 2 && typeof body.active === 'boolean') {
      await prisma.sponsorSlot.update({ where: { id: id.data }, data: { active: body.active } })
      return success({ ok: true }, body.active ? '已上架' : '已下架')
    }
    const parsed = sponsorSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues[0]?.message || '参数无效')
    const d = parsed.data
    await prisma.sponsorSlot.update({ where: { id: id.data }, data: { ...d, blurb: d.blurb || null, image: d.image || null } })
    return success({ ok: true }, '已保存')
  } catch (err) {
    console.error('Admin sponsor update error:', err)
    return error('保存失败')
  }
}
