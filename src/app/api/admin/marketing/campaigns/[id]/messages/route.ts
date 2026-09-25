export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MESSAGE_STATUSES, type MessageStatus } from '@/lib/marketing/types'
import { listMessages, messagesCsv } from '@/lib/marketing/stats'
import { bjDateKey } from '@/lib/marketing/time'
import { parseId, parsePaging, totalPages } from '@/lib/marketing/campaign-repo'

/**
 * 收件人明细 / 导出 CSV。
 *
 * filter=clicked_no_order：「点了没买」名单（运营回访用）。format=csv 下载（UTF-8 BOM，最多 20000 行，由 stats 负责）。
 * 导出含收件人邮箱：只记「谁导出了哪个活动、多少字节」，不记内容。
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')

    const { searchParams } = new URL(request.url)
    const rawStatus = (searchParams.get('status') || '').trim()
    const status = (MESSAGE_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as MessageStatus) : null
    const keyword = (searchParams.get('keyword') || '').trim().slice(0, 100) || null
    const filter = searchParams.get('filter') === 'clicked_no_order' ? ('clicked_no_order' as const) : null

    const campaign = await prisma.marketingCampaign.findUnique({ where: { id }, select: { id: true } })
    if (!campaign) return notFound('活动不存在')

    if (searchParams.get('format') === 'csv') {
      let operatorId: number | null = null
      try {
        operatorId = (await requireAdmin()).id
      } catch {
        return error('无管理员权限', 403)
      }
      const csv = await messagesCsv(id, { status, keyword, filter })
      const stamp = bjDateKey().replace(/-/g, '')
      const label = filter === 'clicked_no_order' ? '点了没买' : '收件人'
      const filename = `营销活动${id}-${label}-${stamp}.csv`
      const buf = Buffer.from(csv, 'utf8')
      console.log(`[admin/marketing] 管理员 #${operatorId} 导出活动 #${id} 收件人 CSV（${label}，${buf.length} 字节）`)
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          // filename 只能是 ASCII，中文必须走 RFC 5987 的 filename*；两个都给，老浏览器落到前者
          'Content-Disposition': `attachment; filename="campaign-${id}-${stamp}.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Content-Length': String(buf.length),
          // 含收件人邮箱，任何中间层都不许缓存
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }

    const { page, pageSize } = parsePaging(searchParams, 20, 100)
    const { list, total } = await listMessages(id, { page, pageSize, status, keyword, filter })
    return success({ list, total, page, pageSize, totalPages: totalPages(total, pageSize) })
  } catch (err) {
    console.error(`[admin/marketing] 获取活动 #${params.id} 收件人明细失败:`, err)
    return error('获取收件人明细失败')
  }
}
