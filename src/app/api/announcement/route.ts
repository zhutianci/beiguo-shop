export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'
import { liveTenantAnnouncement } from '@/lib/tenant/announcements'

// 公开接口：取当前生效的一条公告，供前台弹窗展示。没有生效公告时返回 null。
// middleware 只保护 /admin 与 /api/admin，这条路由本就应当公开。
export async function GET() {
  /*
   * 按店面分流（docs/多渠道分销-渠道品牌与公告.md 第 5 节）。店面解析在第一行、不包进 try：
   *  · 没有店面（未登记 Host、域名停用）→ 404；
   *  · 渠道 → 只查本渠道的 tenant_announcements（筹备中的渠道不给：前台整站是「暂停访问」页，公告不能先漏出去）；
   *  · 主站（含休眠期任何 Host）→ 原来的 announcements 查询，一行不改。
   */
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  if (sf.kind === 'CHANNEL') {
    if (sf.status === 'DRAFT') return success(null)
    try {
      return success(await liveTenantAnnouncement(sf.id))
    } catch (err) {
      console.error('Get tenant announcement error:', err)
      return error('获取公告失败')
    }
  }
  try {
    const now = new Date()
    const a = await prisma.announcement.findFirst({
      where: {
        enabled: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      // 强提醒优先；同级取最新发布的一条
      orderBy: [{ pinned: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        content: true,
        level: true,
        pinned: true,
        updatedAt: true,
      },
    })

    return success(a)
  } catch (err) {
    console.error('Get announcement error:', err)
    return error('获取公告失败')
  }
}
