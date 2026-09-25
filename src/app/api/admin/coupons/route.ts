export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { couponLabel, parseProductIds } from '@/lib/coupon'

/**
 * 优惠券批次管理。
 *
 * 鉴权：middleware 拦 /api/admin/*，每个 handler 里再用 requireAdmin 独立验一次 ——
 * Next 14.2.3 的 CVE-2025-29927 能绕过 middleware，这里建券、加量、作废都是动钱的操作。
 *
 * 分页与筛选照抄站内既有后台列表的范式（见 api/admin/news/events/route.ts），
 * 不另起一套 —— 后台十几个列表页长得一样，维护成本才低。
 *
 * 【三类批次分开列】Coupon.source 为 NULL 的是后台建的公开领取批次；'LOTTERY' 是
 * 「下单有奖」中奖时系统自动建的单张批次（一次中奖一批，total=1）；'CAMPAIGN' 是营销邮件
 * 「直发到账户」的批次（一个活动一批，发信前逐人发券，total/claimed 随发券同步 +1）。
 * 默认只列公开批次，否则每中一次奖、每做一场活动列表里就多一行，真正要管的活动会被淹没。
 * ?source=LOTTERY / ?source=CAMPAIGN 单独看后两类。
 *
 * 【source 非空 ≠ 抽奖】以前只有抽奖一种系统批次，代码里「source != null」就等于抽奖。
 * 有了 CAMPAIGN 之后，凡是抽奖专属的逻辑（中奖人、按订单号搜）都显式判断 'LOTTERY'；
 * 两类系统批次共有的规矩（没有公开领取链接、不能加量）才用「source != null」。
 */

const STATUSES = ['ACTIVE', 'PAUSED', 'ENDED']

/** 列表的来源筛选：'' = 公开领取批次（source IS NULL） */
const SOURCES = ['', 'LOTTERY', 'CAMPAIGN'] as const
type SourceFilter = (typeof SOURCES)[number]

/** 短码：只允许小写字母数字与连字符。要进 URL，也要能念得出来 */
const CODE_RE = /^[a-z0-9-]{3,32}$/

/**
 * 营销直发券「到账后 N 天有效」的 N（审查 C25）。days 模式的批次 endAt=null（每张券自己的 expiresAt 管有效期），
 * 天数只在活动冻结的文档里：取文档里 mode='grant' 的券区块的 grant.validity。
 *
 * 只用于列表展示，故意宽松解析（不过严格 zod）：以后文档 schema 收紧时，旧活动冻结的文档过不了新校验，
 * 这里也不该因此显示不出天数。解析不了 → null，页面显示笼统的「按张计算」。
 * （lib/marketing/coupon.ts 的 grantValidityOf 没有导出，且带缓存、按批次逐个查，列表里不合用）
 */
function grantDaysOfDoc(docJson: string): number | null {
  try {
    const doc = JSON.parse(docJson) as { blocks?: unknown }
    if (!Array.isArray(doc?.blocks)) return null
    for (const b of doc.blocks as { type?: unknown; mode?: unknown; grant?: { validity?: { mode?: unknown; days?: unknown } } }[]) {
      if (!b || b.type !== 'coupon' || b.mode !== 'grant' || !b.grant) continue
      const v = b.grant.validity
      return v?.mode === 'days' && typeof v.days === 'number' && Number.isInteger(v.days) && v.days > 0 ? v.days : null
    }
    return null
  } catch {
    return null
  }
}

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
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get('keyword') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    // 不认识的取值一律当作公开批次（与以前「不是 LOTTERY 就列公开批次」的行为一致）
    const rawSource = searchParams.get('source') || ''
    const source: SourceFilter = (SOURCES as readonly string[]).includes(rawSource) ? (rawSource as SourceFilter) : ''
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)

    // 批次来源是列表的第一层切分，total 与每行的核销统计都只针对这一类，几类不混算
    const where: Prisma.CouponWhereInput = { source: source || null }
    if (STATUSES.includes(status)) where.status = status
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        // 抽奖券的备注是「下单有奖 · 订单 <订单号>」，按订单号能直接搜到那张券；
        // 营销直发券的备注是「营销活动 #<id>」，按活动编号能搜到那一批
        ...(source === 'LOTTERY' || source === 'CAMPAIGN' ? [{ note: { contains: keyword } }] : []),
      ]
    }

    const [rows, total, normalCount, lotteryCount, campaignCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: [{ id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.coupon.count({ where }),
      prisma.coupon.count({ where: { source: null } }),
      prisma.coupon.count({ where: { source: 'LOTTERY' } }),
      prisma.coupon.count({ where: { source: 'CAMPAIGN' } }),
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

    // 抽奖券一批只发给一个人：列表里直接给出中奖人，后台不用再去用户表里翻。
    // 只对 LOTTERY：营销直发批次一批发给成百上千人，没有「中奖人」这回事（逐人查也会把这里拖慢）
    const winnerMap = new Map<number, { userId: number; email: string | null; nickname: string | null }>()
    const lotteryIds = rows.filter((r) => r.source === 'LOTTERY').map((r) => r.id)
    if (lotteryIds.length) {
      const grants = await prisma.couponGrant.findMany({
        where: { couponId: { in: lotteryIds } },
        select: { couponId: true, userId: true },
      })
      const users = grants.length
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(new Set(grants.map((g) => g.userId))) } },
            select: { id: true, email: true, nickname: true },
          })
        : []
      const userMap = new Map(users.map((u) => [u.id, u]))
      grants.forEach((g) => {
        const u = userMap.get(g.userId)
        winnerMap.set(g.couponId, { userId: g.userId, email: u?.email ?? null, nickname: u?.nickname ?? null })
      })
    }

    // 营销直发批次 → 对应的活动（列表里「已发 N / 已用 M」旁边链到活动报表）。
    // 活动表与券表之间没有外键（营销模块只建新表），靠 marketing_campaigns.coupon_id 反查
    const campaignByCoupon = new Map<number, number>()
    // 审查 C25：days 模式的营销批次 endAt=null，不能按「没有截止 = 长期有效」显示；天数从活动文档里取
    const grantDaysByCoupon = new Map<number, number>()
    const campaignCouponIds = rows.filter((r) => r.source === 'CAMPAIGN').map((r) => r.id)
    // 只有不设截止（days 模式）的批次才要读文档；文档是 LongText，until 模式的不白读
    const daysModeCouponIds = rows.filter((r) => r.source === 'CAMPAIGN' && !r.endAt).map((r) => r.id)
    if (campaignCouponIds.length) {
      const [camps, docs] = await Promise.all([
        prisma.marketingCampaign.findMany({
          where: { couponId: { in: campaignCouponIds } },
          select: { id: true, couponId: true },
        }),
        daysModeCouponIds.length
          ? prisma.marketingCampaign.findMany({
              where: { couponId: { in: daysModeCouponIds } },
              select: { couponId: true, doc: true },
            })
          : Promise.resolve([] as { couponId: number | null; doc: string }[]),
      ])
      camps.forEach((c) => {
        if (c.couponId != null) campaignByCoupon.set(c.couponId, c.id)
      })
      docs.forEach((c) => {
        if (c.couponId == null) return
        const days = grantDaysOfDoc(c.doc)
        if (days != null) grantDaysByCoupon.set(c.couponId, days)
      })
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
          // 「批次没有截止时间」。营销直发批次没截止不代表券长期有效（每张按到账日算，见 grantDays），页面据 source 区分
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
          source: r.source,
          // 系统发给具体买家的券（抽奖、营销直发）没有领取链接（/coupon/<code> 对它们一律 404），不下发，免得被复制出去
          claimPath: r.source == null ? `/coupon/${r.code}` : null,
          winner: r.source === 'LOTTERY' ? winnerMap.get(r.id) ?? null : null,
          // 营销直发：来自哪个活动、已被用掉几张（已发 = claimed，发券与 claimed+1 同事务）
          campaignId: r.source === 'CAMPAIGN' ? campaignByCoupon.get(r.id) ?? null : null,
          usedCount: st.USED || 0,
          // 营销直发 days 模式：每张券到账后 N 天内有效（批次本身没有截止时间，forever 对它不成立）；其余一律 null
          grantDays: r.source === 'CAMPAIGN' ? grantDaysByCoupon.get(r.id) ?? null : null,
        }
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      sourceCounts: { normal: normalCount, lottery: lotteryCount, campaign: campaignCount },
    })
  } catch (err) {
    console.error('List coupons error:', err)
    return error('获取优惠券列表失败')
  }
}

// ---------- POST 建一批 ----------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

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
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const cur = await prisma.coupon.findUnique({ where: { id: d.id } })
    if (!cur) return notFound('优惠券不存在')
    // 系统批次（抽奖：一次中奖一批、只发给中奖人；营销直发：发信前逐人发券，total 随发券 +1）
    // 都是「按人发放」的：加量没有意义，加出来的余量也没有任何入口能领（领取接口拒绝系统批次），
    // 只会让账面对不上 —— 营销批次还会让「已发 N 张」的口径（total=claimed）失真
    if (cur.source != null && d.addTotal) return error('系统发放的券批次（抽奖 / 营销邮件直发）是按人发放的，不能加量')

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
