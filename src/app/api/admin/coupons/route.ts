export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { couponLabel, parseProductIds } from '@/lib/coupon'

/**
 * 优惠券批次管理。鉴权由 middleware 兜底（它拦 /api/admin/*）。
 *
 * 分页与筛选照抄站内既有后台列表的范式（见 api/admin/news/events/route.ts），
 * 不另起一套 —— 后台十几个列表页长得一样，维护成本才低。
 */

const STATUSES = ['ACTIVE', 'PAUSED', 'ENDED']

/** 短码：只允许小写字母数字与连字符。要进 URL，也要能念得出来 */
const CODE_RE = /^[a-z0-9-]{3,32}$/

const createSchema = z
  .object({
    code: z.string().trim().toLowerCase().regex(CODE_RE, '短码只能用小写字母、数字与连字符，3-32 位'),
    name: z.string().trim().min(1, '请填写活动名称').max(80),
    kind: z.enum(['THRESHOLD', 'PRODUCT']),
    minAmount: z.coerce.number().min(0).max(999999).default(0),
    discount: z.coerce.number().positive('优惠金额必须大于 0').max(999999),
    productIds: z.array(z.coerce.number().int().positive()).max(50).optional(),
    total: z.coerce.number().int().min(1, '数量至少 1 张').max(100000),
    /** 留空 = 长期有效 */
    startAt: z.string().datetime().nullable().optional(),
    endAt: z.string().datetime().nullable().optional(),
    note: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.kind !== 'PRODUCT' || (d.productIds && d.productIds.length > 0), {
    message: '商品券必须指定至少一个商品',
    path: ['productIds'],
  })
  .refine((d) => !d.startAt || !d.endAt || new Date(d.startAt) < new Date(d.endAt), {
    message: '结束时间必须晚于开始时间',
    path: ['endAt'],
  })

// ---------- GET 列表 ----------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get('keyword') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)

    const where: Prisma.CouponWhereInput = {}
    if (STATUSES.includes(status)) where.status = status
    if (keyword) where.OR = [{ name: { contains: keyword } }, { code: { contains: keyword } }]

    const [rows, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: [{ id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.coupon.count({ where }),
    ])

    // 每批的核销情况。一次 groupBy 拿全，不在循环里逐个查
    const ids = rows.map((r) => r.id)
    const grantStats = ids.length
      ? await prisma.couponGrant.groupBy({
          by: ['couponId', 'state'],
          where: { couponId: { in: ids } },
          _count: { _all: true },
        })
      : []
    const statMap = new Map<number, Record<string, number>>()
    for (const g of grantStats) {
      const m = statMap.get(g.couponId) || {}
      m[g.state] = g._count._all
      statMap.set(g.couponId, m)
    }

    return success({
      list: rows.map((r) => {
        const st = statMap.get(r.id) || {}
        return {
          id: r.id,
          code: r.code,
          name: r.name,
          kind: r.kind,
          minAmount: Number(r.minAmount),
          discount: Number(r.discount),
          label: couponLabel({ kind: r.kind, minAmount: Number(r.minAmount), discount: Number(r.discount) }),
          productIds: parseProductIds(r.productIds),
          total: r.total,
          claimed: r.claimed,
          remaining: Math.max(0, r.total - r.claimed),
          startAt: r.startAt,
          endAt: r.endAt,
          forever: !r.endAt,
          status: r.status,
          note: r.note,
          createdAt: r.createdAt,
          stats: {
            available: st.AVAILABLE || 0,
            locked: st.LOCKED || 0,
            used: st.USED || 0,
            expired: st.EXPIRED || 0,
            void: st.VOID || 0,
          },
          // 领取链接。后台直接复制这一条去推广
          claimPath: `/coupon/${r.code}`,
        }
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('List coupons error:', err)
    return error('获取优惠券列表失败')
  }
}

// ---------- POST 建一批 ----------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    // 商品券要确认商品真的存在，否则建出来是一批永远用不了的券
    if (d.kind === 'PRODUCT' && d.productIds?.length) {
      const n = await prisma.product.count({ where: { id: { in: d.productIds } } })
      if (n !== d.productIds.length) return error('指定的商品里有不存在的，请检查商品 id')
    }

    try {
      const created = await prisma.coupon.create({
        data: {
          code: d.code,
          name: d.name,
          kind: d.kind,
          minAmount: new Prisma.Decimal(d.minAmount.toFixed(2)),
          discount: new Prisma.Decimal(d.discount.toFixed(2)),
          productIds: d.productIds?.length ? d.productIds.join(',') : null,
          total: d.total,
          startAt: d.startAt ? new Date(d.startAt) : null,
          endAt: d.endAt ? new Date(d.endAt) : null,
          note: d.note || null,
        },
      })
      return success(
        { id: created.id, code: created.code, claimPath: `/coupon/${created.code}` },
        `已创建 ${d.total} 张，领取链接 /coupon/${created.code}`
      )
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') return error('这个短码已经被占用了，换一个')
      throw e
    }
  } catch (err) {
    console.error('Create coupon error:', err)
    return error('创建失败')
  }
}

// ---------- PATCH 改状态 ----------

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ENDED']).optional(),
  note: z.string().trim().max(300).nullable().optional(),
  /** 追加发行量。只能加不能减 —— 减到低于已领数量会让账对不上 */
  addTotal: z.coerce.number().int().min(1).max(100000).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const cur = await prisma.coupon.findUnique({ where: { id: d.id } })
    if (!cur) return notFound('优惠券不存在')

    const updated = await prisma.coupon.update({
      where: { id: d.id },
      data: {
        ...(d.status ? { status: d.status } : {}),
        ...(d.note !== undefined ? { note: d.note || null } : {}),
        ...(d.addTotal ? { total: { increment: d.addTotal } } : {}),
      },
    })

    /*
     * ENDED = 活动作废：已经发出去的券一并失效。
     *
     * 【为什么不动 LOCKED 与 USED】LOCKED 的券挂在某张待支付订单上，订单金额已经是
     * 优惠后的了 —— 把券作废掉，买家按优惠价付了款却拿不到对应的核销记录，对账会错。
     * 让它跟着订单自然走完（付款则核销、超时则释放，释放时会因批次 ENDED 而在
     * 前台显示为已失效）。USED 的更不能动，那是历史账。
     */
    let voided = 0
    if (d.status === 'ENDED') {
      const r = await prisma.couponGrant.updateMany({
        where: { couponId: d.id, state: 'AVAILABLE' },
        data: { state: 'VOID' },
      })
      voided = r.count
    }

    return success(
      { id: updated.id, status: updated.status, total: updated.total, voided },
      d.status === 'ENDED' ? `已结束活动，作废未使用的 ${voided} 张（已锁定与已核销的不动）` : '已保存'
    )
  } catch (err) {
    console.error('Update coupon error:', err)
    return error('保存失败')
  }
}
