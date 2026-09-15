export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { checkBacklink } from '@/lib/friend-link'

/**
 * 回链巡检：去对方站点上找本站的链接，把结论记到这条友链上。
 *
 * 【只记结论，绝不自动改状态】上/下线永远是人工决定的。
 * 自动下线看着很省事，但对方站点在 Cloudflare 后面返回一次 403、或者临时抖动，
 * 就会把一个正常的合作方悄悄摘掉 —— 友链圈里这是最伤关系的事。
 * 这里只负责把「疑似掉链」标红，剩下的交给人看一眼。
 *
 * 【为什么是一条一条点，而不是一键全量】nginx 的 proxy_read_timeout 只有 90s，
 * 批量抓取几十个站必然超时（服务端还在跑、前端已经 504）。
 * 后台的「一键巡检」在浏览器里串行调这个接口，进度看得见，中途还能停。
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const row = await prisma.friendLink.findUnique({ where: { id }, select: { url: true } })
    if (!row) return error('记录不存在', 404)

    const result = await checkBacklink(row.url)
    await prisma.friendLink.update({
      where: { id },
      data: { backlinkOk: result.ok, backlinkNote: result.note.slice(0, 255), checkedAt: new Date() },
    })

    return success({ id, ok: result.ok, note: result.note })
  } catch (err) {
    console.error('Admin check backlink error:', err)
    return error('检测失败')
  }
}
