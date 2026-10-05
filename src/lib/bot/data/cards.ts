/**
 * 「查卡」指令的取数（docs/微信机器人-设计.md §7.3，附录 B 第 3、15 条）：一单的卡（打码后）、卡的状态、兑换记录（redeem_logs）。
 * 只读、只给管理群与私聊。
 *
 * 【完整卡密绝不离开这个文件】解密只在这里做，解出来立刻 maskCardSecret 打码，返回值里只有打码后的串；
 * 解不开（密钥没配、密文坏了）给「无法解密」。不拼兑换链接（cdk=…）、不返回密文与哈希。
 * 兑换记录里的提示语是给买家看的文案，可能带账号邮箱：一律过 sanitizeUserText（邮箱、手机号、疑似卡密打码，网址中性化）。
 * 兑换记录不返回 IP 与上游追踪号（request_id）：IP 是买家隐私，追踪号要连同卡密一起给上游才有用，群里用不上。
 */
import { prisma } from '../../db'
import { decryptCardContent } from '../../cardkey'
import { sanitizeUserText, truncate } from '../mask'
import { requirePlatformScope, type BotScope } from './scope'

/**
 * 卡密打码：首尾各最多 4 位、中间「…」，而且至少藏住一半——
 *  · 16 位及以上：首尾各 4 位（例 9D8WA-AVOBY-PJ5P5 → 9D8W…J5P5，与推送里疑似卡密的打码一致）；
 *  · 8–15 位：每端 ⌊长度 / 4⌋ 位（12 位只露首尾各 3 位）；
 *  · 不到 8 位：一个字符都不露。
 * 多行卡（账号 / 密码）先把空白压成一个空格再打码。纯函数，scripts/check-bot-query.ts 覆盖。
 */
export function maskCardSecret(plain: string): string {
  const chars = Array.from(String(plain ?? '').replace(/\s+/g, ' ').trim())
  const n = chars.length
  if (n < 8) return '…'
  const k = Math.min(4, Math.floor(n / 4))
  return `${chars.slice(0, k).join('')}…${chars.slice(n - k).join('')}`
}

export interface CardRedeem {
  at: Date
  /** CHECK 查询 | ACTIVATE 兑换 | REBIND 换绑 */
  action: string
  /** RedeemState：READY / PROCESSING / COMPLETED / … */
  state: string
  provider: string
  /** 已脱敏的提示语（≤ 40 字）；没有为 null */
  message: string | null
}

export interface CardView {
  /** 打码后的卡密，或「无法解密」 */
  masked: string
  /** UNUSED / USED / DISABLED */
  status: string
  usedAt: Date | null
  batch: string | null
  /** 站内兑换平台（sysa / sysb …）；没有为 null */
  redeemProvider: string | null
  /** 最近几条兑换记录（新的在前） */
  redeem: CardRedeem[]
  /** 这张卡的兑换记录总条数 */
  redeemTotal: number
}

export interface OrderCards {
  order: {
    /** 订单内部 id（拼后台深链 /admin/orders?orderId= 用；只在管理群范围出现） */
    id: number
    orderNo: string
    tenantId: number
    productName: string
    quantity: number
    payStatus: string
    deliveryStatus: string
    deliveryType: string
  }
  /** 这一单名下的卡总数（含已停用的）；cards 最多 maxCards 张 */
  totalCards: number
  cards: CardView[]
}

/** 一单的卡与兑换记录。订单不存在返回 null。卡按 id 升序（= 发卡顺序） */
export async function orderCardsView(scope: BotScope, orderNo: string, opts?: { maxCards?: number; redeemPerCard?: number }): Promise<OrderCards | null> {
  requirePlatformScope(scope, '查卡')
  const maxCards = Math.min(Math.max(1, opts?.maxCards ?? 10), 20)
  const perCard = Math.min(Math.max(0, opts?.redeemPerCard ?? 3), 10)
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { id: true, orderNo: true, tenantId: true, productName: true, quantity: true, payStatus: true, deliveryStatus: true, product: { select: { deliveryType: true } } },
  })
  if (!order) return null
  const [totalCards, rows] = await Promise.all([
    prisma.cardKey.count({ where: { orderId: order.id } }),
    prisma.cardKey.findMany({
      where: { orderId: order.id },
      orderBy: { id: 'asc' },
      take: maxCards,
      select: { id: true, content: true, status: true, usedAt: true, batch: true, redeemProvider: true },
    }),
  ])
  const ids = rows.map((r) => r.id)
  const logs = ids.length
    ? await prisma.redeemLog.findMany({
        where: { cardKeyId: { in: ids } },
        orderBy: { id: 'desc' },
        take: 200,
        select: { cardKeyId: true, provider: true, action: true, state: true, message: true, createdAt: true },
      })
    : []
  const counts = ids.length ? await prisma.redeemLog.groupBy({ by: ['cardKeyId'], where: { cardKeyId: { in: ids } }, _count: { _all: true } }) : []
  const totalOf = new Map<number, number>()
  counts.forEach((c) => {
    if (c.cardKeyId != null) totalOf.set(c.cardKeyId, c._count._all)
  })
  const cards = rows.map((r): CardView => {
    let masked: string
    try {
      masked = maskCardSecret(decryptCardContent(r.content))
    } catch {
      masked = '无法解密'
    }
    const mine = logs.filter((l) => l.cardKeyId === r.id).slice(0, perCard)
    return {
      masked,
      status: r.status,
      usedAt: r.usedAt,
      batch: r.batch,
      redeemProvider: r.redeemProvider,
      redeem: mine.map((l) => ({
        at: l.createdAt,
        action: l.action,
        state: l.state,
        provider: l.provider,
        // 整段先脱敏、中性化网址再截断（先截断的话，截在网址中间残留的半截网址认不出来）
        message: l.message ? truncate(sanitizeUserText(l.message, { max: 500 }), 40) || null : null,
      })),
      redeemTotal: totalOf.get(r.id) ?? 0,
    }
  })
  return {
    order: {
      id: order.id,
      orderNo: order.orderNo,
      tenantId: order.tenantId,
      productName: order.productName,
      quantity: order.quantity,
      payStatus: order.payStatus,
      deliveryStatus: order.deliveryStatus,
      deliveryType: order.product?.deliveryType ?? '',
    },
    totalCards,
    cards,
  }
}
