/**
 * 订单口径的共用 where 帮手（docs/短信接码-设计.md D14、D40、§6.6 第 17 条、附录 B 第 20 条）。纯对象，不连库。
 *
 * 【两种系统载体商品】`deliveryType='SMS_POOL'`（短信接码单）与 `'TOPUP'`（余额充值单）都是下架（status=0）、price=0 的商品，
 * 订单挂在它们上面。现有按 `deliveryType === 'AUTO' / 'SMS'` 分支的代码对它们都走不到。
 *
 * 【充值不计营收】（D40）充值是预收款负债，买家用余额买接码时那张接码单才计营收；两边都计就是同一笔钱记两次。
 * 所以全站营收、订单数、会员累计消费、营销「已购」、个人中心与用户详情累计消费、订单列表流水合计一律 AND 上 excludeTopup()。
 * 首页实时成交排除**两种**载体（excludeCarriers）：接码单单价很低、会刷屏，也不是「成交展示」想要的东西（D12）。
 *
 * 【用法】一律 `{ AND: [原 where, excludeTopup()] }` 或展开到没有 product 键的 where 里——原 where 已经有 product 条件
 * （后台订单列表按分类筛选）时直接展开会被覆盖，所以带 product 条件的地方必须用 AND。
 */
import type { Prisma } from '@prisma/client'

export const TOPUP_DELIVERY = 'TOPUP'
export const SMS_POOL_DELIVERY = 'SMS_POOL'
export const CARRIER_DELIVERY_TYPES = [SMS_POOL_DELIVERY, TOPUP_DELIVERY] as const
export type CarrierDeliveryType = (typeof CARRIER_DELIVERY_TYPES)[number]

/** 这个 deliveryType 是不是系统载体（接码单 / 充值单） */
export function isCarrierType(deliveryType: string | null | undefined): deliveryType is CarrierDeliveryType {
  return deliveryType === SMS_POOL_DELIVERY || deliveryType === TOPUP_DELIVERY
}

/** 排除充值单（营收、订单数、会员、营销、累计消费、流水合计） */
export function excludeTopup(): Prisma.OrderWhereInput {
  return { product: { deliveryType: { not: TOPUP_DELIVERY } } }
}

/** 排除两种载体单（首页实时成交） */
export function excludeCarriers(): Prisma.OrderWhereInput {
  return { product: { deliveryType: { notIn: [...CARRIER_DELIVERY_TYPES] } } }
}

/** 载体单开票 / 收据入口的统一拒绝文案（D37、§6.6 第 18 条；两个接口同一句） */
export const CARRIER_NO_INVOICE_MSG = '暂不支持开票，可联系客服开票处理'
