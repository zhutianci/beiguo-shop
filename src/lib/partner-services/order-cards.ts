/**
 * 渠道后台：交付凭据与卡密使用情况（WP6，设计 6.4.1、6.5.3、T24）。
 *
 * 【全仓唯一允许给渠道解密卡密的文件】（边界检查规则 3：只有本文件可以 import src/lib/cardkey）。
 * 卡密明文、deliveryInfo 全文、接码验证码只经 GET /api/partner/orders/[orderNo]/cards 返回（order.cards 权限），
 * 订单列表、详情、CSV 导出一律不含（Q14）。
 *
 * 【行范围】设计 6.5.3 的字面写法是 `cardKey.findMany({ where: { status:'USED', order: { tenantId } } })`，但 CardKey 与 Order
 * 之间没有 Prisma 关系（schema 铁律：不给现有表加外键），所以按 WP0 约定的等价写法（WP0 报告偏差 2）：
 *   1. findTenantOrder(tenantId, orderNo, …) —— where { orderNo, tenantId }，拿到**本渠道**订单的内部 id；
 *   2. cardKey.findMany({ where: { orderId: 该 id, status: 'USED' } })。
 * 未售卡（UNUSED，orderId 为空）、主站 / zz 的卡永远查不到；卡本身也不按 id 或 hash 寻址（渠道拿不到卡 id）。
 *
 * 【审计】每次查看写一条 card.view（记录看了哪几类：cards / deliveryInfo / smsCode）；**审计写不进去就不给明文**
 * （先写审计、后返回；写失败抛错 → 500）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { cardContentHash, decryptCardContent } from '../cardkey'
import { redeemProviderPublicName } from '../tenant/public-names'
import type { PartnerDeliveryDTO } from '../tenant/types'
import { assertTenantId, findTenantOrder } from './_scope'
import {
  PARTNER_CARD_SELECT,
  PARTNER_DELIVERY_SELECT,
  PARTNER_INTERNAL_CARD_KEY_SELECT,
  PARTNER_INTERNAL_CARD_ORDER_SELECT,
  PARTNER_INTERNAL_ORDER_KEY_SELECT,
  PARTNER_INTERNAL_REDEEM_KEY_SELECT,
  PARTNER_ORDER_LIST_SELECT,
  PARTNER_REDEEM_LOG_SELECT,
  PARTNER_SMS_CODE_SELECT,
} from './selects'

/** 一单的卡密张数上限远小于此；兑换日志只给最近 200 条（渠道客服排查足够） */
const MAX_CARDS = 100
const MAX_REDEEM_LOGS = 200

const CARD_WITH_KEY = { ...PARTNER_CARD_SELECT, ...PARTNER_INTERNAL_CARD_KEY_SELECT } as const
const REDEEM_WITH_KEY = { ...PARTNER_REDEEM_LOG_SELECT, ...PARTNER_INTERNAL_REDEEM_KEY_SELECT } as const
/**
 * orderNo 取库里的规范值写审计：findTenantOrder 的形状校验允许小写，MySQL 默认排序规则又不区分大小写，
 * `/orders/abc123/cards` 能命中 ABC123——审计若记 URL 原文，按单号查操作日志会漏掉这条（审计 targetId 一律记公开编号）。
 */
const ORDER_WITH_DELIVERY = {
  ...PARTNER_INTERNAL_ORDER_KEY_SELECT,
  ...PARTNER_DELIVERY_SELECT,
  orderNo: PARTNER_ORDER_LIST_SELECT.orderNo,
} as const

/** 按卡密明文反查「本渠道已售卡」所在订单用的内部键（selects.ts 的 PARTNER_INTERNAL_CARD_ORDER_SELECT，D15）。只用于拼 where，绝不进 DTO */
const CARD_ORDER_KEY_SELECT = PARTNER_INTERNAL_CARD_ORDER_SELECT

/**
 * 交付凭据（设计 6.4.1）。不存在 / 不是本渠道的单 → null（handler 统一 404，响应体与无权相同）。
 */
export async function partnerOrderDelivery(tenantId: number, orderNo: string, userId: number, req?: Request): Promise<PartnerDeliveryDTO | null> {
  const o = await findTenantOrder(tenantId, orderNo, ORDER_WITH_DELIVERY)
  if (!o) return null

  const [cards, smsCode] = await Promise.all([
    prisma.cardKey.findMany({ where: { orderId: o.id, status: 'USED' }, select: CARD_WITH_KEY, orderBy: { id: 'asc' }, take: MAX_CARDS }),
    prisma.smsActivation.findUnique({ where: { orderId: o.id }, select: PARTNER_SMS_CODE_SELECT }),
  ])
  const cardIds = cards.map((c) => c.id)
  const logs = cardIds.length
    ? await prisma.redeemLog.findMany({
        where: { cardKeyId: { in: cardIds } },
        select: REDEEM_WITH_KEY,
        orderBy: { createdAt: 'desc' },
        take: MAX_REDEEM_LOGS,
      })
    : []

  const kinds: string[] = []
  if (cards.length) kinds.push('cards')
  if (o.deliveryInfo) kinds.push('deliveryInfo')
  if (smsCode?.code) kinds.push('smsCode')

  // 先留痕、后给明文（审计失败直接抛，不返回任何凭据）
  await writeAudit(null, {
    actorKind: 'TENANT',
    actorUserId: userId,
    tenantId,
    action: 'card.view',
    targetType: 'order',
    targetId: o.orderNo,
    diff: { kinds, cardCount: cards.length },
    req,
  })

  return {
    cards: cards.map((c) => {
      let cardText: string
      try {
        cardText = decryptCardContent(c.content)
      } catch {
        // 解密失败（密钥轮换 / 数据损坏）：不回显密文，给固定提示
        cardText = '（卡密暂时无法显示，请联系站长）'
      }
      return { cardText, usedAt: c.usedAt ? c.usedAt.toISOString() : null, status: c.status }
    }),
    deliveryInfo: o.deliveryInfo ?? null,
    smsCode: smsCode?.code ?? null,
    redeemLogs: logs.map((l) => ({
      // 第几张卡（1 起），代替卡的自增 id
      cardIndex: l.cardKeyId == null ? 0 : cardIds.indexOf(l.cardKeyId) + 1,
      action: l.action,
      state: l.state,
      message: l.message ?? null,
      createdAt: l.createdAt.toISOString(),
      provider: redeemProviderPublicName(l.provider),
    })),
  }
}

/**
 * 订单列表的「卡密」精确搜索（设计 6.4.3）：服务端对输入算 contentHash（盐只在服务端），查**已售**卡所在订单的内部 id。
 * 返回的 id 由调用方与 `tenantId` 一起放进同一个 where（orders.ts buildOrderWhere），所以 zz 的卡、主站的卡、未售卡、
 * 不存在的卡最终都是 total=0，四者不可区分（T24）。
 */
export async function tenantOrderIdsByCardText(tenantId: number, text: string): Promise<number[]> {
  assertTenantId(tenantId)
  const plain = String(text ?? '').trim()
  if (!plain) return []
  const rows = await prisma.cardKey.findMany({
    where: { contentHash: cardContentHash(plain), status: 'USED', orderId: { not: null } },
    select: CARD_ORDER_KEY_SELECT,
    take: 20,
  })
  const ids = rows.map((r) => r.orderId).filter((x): x is number => typeof x === 'number')
  if (ids.length === 0) return []
  // 在这里就按本渠道收窄一次（双保险：即使调用方忘了 tenantId，也拿不到他站订单 id）
  const own = await prisma.order.findMany({ where: { tenantId, id: { in: ids } }, select: PARTNER_INTERNAL_ORDER_KEY_SELECT })
  return own.map((o) => o.id)
}
