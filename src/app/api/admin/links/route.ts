export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { findSameHost } from '@/lib/friend-link'
import { LINK_SLOTS, LINK_STATUSES, hostOf, normalizeLogo, normalizeUrl, parseDateInput } from '@/lib/friend-link-client'

// 鉴权由 src/middleware.ts 统一拦在 /api/admin/* 前面，这里不再重复判断

const PAGE_SIZE = 20

/** 列表：按状态 / 展示位 / 关键词筛选，并附带各状态的条数（后台要在 tab 上显示待审角标） */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || String(PAGE_SIZE)), 1), 100)
    const status = searchParams.get('status')?.trim()
    const slot = searchParams.get('slot')?.trim()
    const keyword = searchParams.get('keyword')?.trim()

    const where: Prisma.FriendLinkWhereInput = {}
    if (status) where.status = status
    if (slot) where.slot = slot
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { url: { contains: keyword } },
        { description: { contains: keyword } },
        { contact: { contains: keyword } },
      ]
    }

    const [rows, total, grouped] = await Promise.all([
      prisma.friendLink.findMany({
        where,
        // 与前台一致按 sortOrder 排，后台调顺序时所见即所得；同序号的新记录在前。
        // 「先处理待审核」交给页面上的状态 tab（counts 会给出角标），不靠这里的排序——
        // status 是字符串，按字典序排出来是 APPROVED/OFFLINE/PENDING/REJECTED，没有业务含义
        orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.friendLink.count({ where }),
      prisma.friendLink.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    const counts: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, OFFLINE: 0 }
    grouped.forEach((g) => {
      counts[g.status] = g._count._all
    })

    return success({
      list: rows.map((r) => ({ ...r, host: hostOf(r.url) })),
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      page,
      pageSize,
      counts,
    })
  } catch (err) {
    console.error('Admin list friend links error:', err)
    return error('获取失败')
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, '站点名称必填').max(60),
  url: z.string().trim().min(4, '站点地址必填').max(300),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const url = normalizeUrl(d.url)
    if (!url) return error('站点地址不合法')

    const logo = normalizeLogo(d.logo)
    if (logo === undefined) return error('logo 地址不合法（只支持 http/https 或本站上传的图片）')

    // 同域名去重：后台手工添加时也挡一道，避免和申请队列里的记录撞车
    const dup = await findSameHost(url)
    if (dup) return error(`该域名已存在记录：${dup.name}（#${dup.id}）`)

    const row = await prisma.friendLink.create({
      data: {
        name: d.name,
        url,
        logo,
        description: d.description || null,
        slot: d.slot || 'FRIEND',
        // 后台自己加的默认直接上线；申请进来的走 /api/links/apply，那条路径恒为 PENDING
        status: d.status || 'APPROVED',
        source: 'ADMIN',
        nofollow: d.nofollow ?? true,
        sortOrder: d.sortOrder ?? 0,
        contact: d.contact || null,
        remark: d.remark || null,
        startAt: parseDateInput(d.startAt),
        endAt: parseDateInput(d.endAt),
      },
      select: { id: true },
    })
    return success({ id: row.id }, '已创建')
  } catch (err) {
    console.error('Admin create friend link error:', err)
    return error('创建失败')
  }
}
