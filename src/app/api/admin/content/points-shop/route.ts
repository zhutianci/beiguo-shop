export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { MONTHLY_LIMIT, ShopError, monthStart, optionsSchema, saveShopOptions, shopOptions } from '@/lib/content/shop'

// 后台：积分兑换档位（P3）。GET 档位与本月兑换统计；PUT {options} 保存
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  const [options, month] = await Promise.all([
    shopOptions(),
    prisma.pointRedemption.aggregate({ where: { createdAt: { gte: monthStart() } }, _count: { _all: true }, _sum: { cost: true } }),
  ])
  return success({ options, monthlyLimit: MONTHLY_LIMIT, month: { count: month._count._all, points: month._sum.cost ?? 0 } })
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = await request.json().catch(() => null)
    const parsed = optionsSchema.safeParse(body?.options)
    if (!parsed.success) return error(`档位格式不对：${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`)
    await saveShopOptions(parsed.data)
    return success({ options: parsed.data }, '已保存')
  } catch (err) {
    if (err instanceof ShopError) return error(err.message)
    console.error('Admin points shop error:', err)
    return error('保存失败')
  }
}
