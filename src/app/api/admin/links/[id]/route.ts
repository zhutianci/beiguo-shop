export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { findSameHost } from '@/lib/friend-link'
import { LINK_SLOTS, LINK_STATUSES, normalizeLogo, normalizeUrl, parseDateInput } from '@/lib/friend-link-client'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  url: z.string().trim().min(4).max(300).optional(),
  logo: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(200).optional().nullable(),
  slot: z.enum(LINK_SLOTS).optional(),
  status: z.enum(LINK_STATUSES).optional(),
  nofollow: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  contact: z.string().trim().max(100).optional().nullable(),
  remark: z.string().trim().max(255).optional().nullable(),
  startAt: z.string().trim().optional().nullable(),
  endAt: z.string().trim().optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    const body = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const data: Prisma.FriendLinkUpdateInput = {}

    if (d.url !== undefined) {
      const url = normalizeUrl(d.url)
      if (!url) return error('站点地址不合法')
      // 换域名时同样查重，否则能靠「改地址」绕开新建时的去重
      const dup = await findSameHost(url, id)
      if (dup) return error(`该域名已存在记录：${dup.name}（#${dup.id}）`)
      data.url = url
    }

    if (d.logo !== undefined) {
      const logo = normalizeLogo(d.logo)
      if (logo === undefined) return error('logo 地址不合法（只支持 http/https 或本站上传的图片）')
      data.logo = logo
    }

    if (d.name !== undefined) data.name = d.name
    if (d.description !== undefined) data.description = d.description || null
    if (d.slot !== undefined) data.slot = d.slot
    if (d.status !== undefined) data.status = d.status
    if (d.nofollow !== undefined) data.nofollow = d.nofollow
    if (d.sortOrder !== undefined) data.sortOrder = d.sortOrder
    if (d.contact !== undefined) data.contact = d.contact || null
    if (d.remark !== undefined) data.remark = d.remark || null
    if (d.startAt !== undefined) data.startAt = parseDateInput(d.startAt)
    if (d.endAt !== undefined) data.endAt = parseDateInput(d.endAt)

    if (Object.keys(data).length === 0) return error('没有要更新的字段')

    await prisma.friendLink.update({ where: { id }, data })
    return success({ id }, '已更新')
  } catch (err) {
    console.error('Admin update friend link error:', err)
    return error('更新失败')
  }
}

/**
 * 删除。
 *
 * 【什么时候该删、什么时候该改状态】对方撤链、赞助到期一律用 OFFLINE，
 * 删除只留给「垃圾申请」这种本来就不该存在的记录 —— 删掉之后同域名可以重新申请，
 * 而 REJECTED 会一直挡着。后台文案里也是这么写的。
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')
    await prisma.friendLink.delete({ where: { id } })
    return success({ id }, '已删除')
  } catch (err) {
    console.error('Admin delete friend link error:', err)
    return error('删除失败')
  }
}
