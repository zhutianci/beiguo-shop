/**
 * 商品上下架的服务函数，与「机器人货号」字段的格式（docs/微信机器人-设计.md §7.3、§8.2）。
 *
 * 【与后台同一段逻辑】「下架 <货号>」要与后台商品下架走同一个服务函数（§7.3）。原来这段写死在
 * PUT /api/admin/products/[id] 里：改 status → AUTO 同步库存 → 由「上架」变成「非上架」时通知已授权该商品的渠道
 * （PRODUCT_WITHDRAWN，多渠道设计 7.3 末行）。现在通知那一段抽成 notifyProductWithdrawn，后台路由改为调用它（行为不变）；
 * 机器人用 setProductStatus：只改 status，其余步骤与后台保存时完全相同。
 *
 * 【系统载体商品】接码单（SMS_POOL）与充值单（TOPUP）挂的两行必须保持下架（短信接码设计 D14），这里同后台一样拒绝改它们的状态。
 */
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { syncAutoStock } from './cardkey'
import { emitTenantNotice } from './tenant/notice'
import { isCarrierType } from './order-scope'

/** 系统载体商品不能改状态（与后台 PUT 的 409 同一句） */
export const CARRIER_PRODUCT_LOCKED_MSG = '这是系统载体商品（短信接码 / 余额充值的订单挂在这里），不能上架、改价或改发货方式'

/**
 * 【下架通知已授权渠道】（多渠道设计 7.3 末行：商品下架时 listing 不改——可售判定已排除 Product.status≠1——
 * 只通知授权了它的渠道 PRODUCT_WITHDRAWN）。通知是附带动作：失败只记日志，不影响保存；
 * 没有授权行（主站休眠期）就是一次空查询。dedupeKey 按「商品 + 这次保存的时间」，同一次下架不重复通知。
 * 调用方负责判断「这次保存是不是由上架变成了非上架」。
 */
export async function notifyProductWithdrawn(product: { id: number; name: string; updatedAt: Date }): Promise<void> {
  try {
    const listings = await prisma.tenantListing.findMany({
      where: { productId: product.id, granted: true },
      select: { tenantId: true, publicNo: true },
    })
    for (const l of listings) {
      await emitTenantNotice(null, {
        tenantId: l.tenantId,
        kind: 'PRODUCT_WITHDRAWN',
        title: '商品停止供货',
        body: `「${product.name}」已被站长下架，本店该商品暂停销售`,
        refType: 'listing',
        refKey: l.publicNo,
        dedupeKey: `pw:${l.publicNo}:${product.updatedAt.getTime()}`,
      })
    }
  } catch (e) {
    console.error('[product] 下架通知渠道失败', product.id, e)
  }
}

export class ProductStatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductStatusError'
  }
}

export interface ProductStatusResult {
  id: number
  name: string
  deliveryType: string
  /** 改之前的状态 */
  before: number
  /** 改之后的状态 */
  status: number
  /** 是否真的改了（原本就是目标状态时 false，什么都不做） */
  changed: boolean
  /** 改完后的库存（AUTO = 未用卡数，已同步） */
  stock: number
}

/**
 * 只改上下架状态（1 上架 / 0 下架）。与后台保存走同样的后续步骤：AUTO 商品同步库存；由上架变下架时通知已授权的渠道。
 * 原本就是目标状态时不写库（不刷新 updatedAt，也就不会重复通知渠道）。
 */
export async function setProductStatus(productId: number, status: 0 | 1): Promise<ProductStatusResult> {
  const cur = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, status: true, deliveryType: true, stock: true },
  })
  if (!cur) throw new ProductStatusError('商品不存在')
  if (isCarrierType(cur.deliveryType)) throw new ProductStatusError(CARRIER_PRODUCT_LOCKED_MSG)
  if (cur.status === status) {
    return { id: cur.id, name: cur.name, deliveryType: cur.deliveryType, before: cur.status, status: cur.status, changed: false, stock: cur.stock }
  }
  const product = await prisma.product.update({ where: { id: productId }, data: { status } })
  if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)
  if (cur.status === 1 && product.status !== 1) await notifyProductWithdrawn(product)
  const fresh = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } })
  return {
    id: product.id,
    name: product.name,
    deliveryType: product.deliveryType,
    before: cur.status,
    status: product.status,
    changed: true,
    stock: fresh?.stock ?? product.stock,
  }
}

// ---------------------------------------------------------------------------
// 机器人货号（products.bot_code，§8.2）：可空、唯一、只允许字母数字与 -_、最长 16、存大写；只对自动发货商品有意义
// ---------------------------------------------------------------------------

export const BOT_CODE_RE = /^[A-Za-z0-9_-]{1,16}$/

/** 货号规范化：去空白、转大写；格式不对返回 null */
export function normalizeBotCode(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return BOT_CODE_RE.test(s) ? s.toUpperCase() : null
}

/** 唯一键冲突是不是撞在货号上（MySQL 的 target 是索引名 products_bot_code_key；也兼容字段名数组） */
export function isBotCodeConflict(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return false
  const target = (e.meta as { target?: unknown } | undefined)?.target
  const s = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return /bot_?code/i.test(s)
}
