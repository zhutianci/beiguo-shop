export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { syncAutoStock } from '@/lib/cardkey'
import { FEATURES_FORMAT_ERROR, isFeaturesJson } from '@/lib/product-intro'
import { adminGuard } from '@/lib/admin-guard'
import { isCarrierType } from '@/lib/order-scope'
import { isBotCodeConflict, notifyProductWithdrawn } from '@/lib/product-status'
import { onProductSaved } from '@/lib/seo/commerce-push'

const updateProductSchema = z.object({
  categoryId: z.number().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().optional().nullable(),
  image: z.string().optional().nullable(),
  stock: z.number().optional(),
  sortOrder: z.number().optional(),
  status: z.number().optional(),
  deliveryType: z.enum(['MANUAL', 'AUTO', 'SMS']).optional(),
  smsService: z.string().trim().max(40).optional().nullable(),
  smsCountry: z.string().trim().max(40).optional().nullable(),
  smsMaxPrice: z.number().nonnegative().optional().nullable(),
  referrerBasePrice: z.number().nonnegative().optional().nullable(),
  cardUsage: z.string().optional().nullable(),
  cardRedeemUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\//i.test(v), '充值链接需以 http:// 或 https:// 开头')
    .optional()
    .nullable(),
  apiSku: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9_.:-]*$/, '对外发卡 SKU 仅允许字母、数字和 _ . - :')
    .optional()
    .nullable(),
  // 微信机器人「货号」（docs/微信机器人-设计.md §8.2）：同新建接口；未提交不动、空串清空、存大写、只对自动发货商品有效
  botCode: z
    .string()
    .trim()
    .max(16, '机器人货号最多 16 位')
    .regex(/^[A-Za-z0-9_-]*$/, '机器人货号仅允许字母、数字和 _ -')
    .optional()
    .nullable(),
  // 同新建接口：必须是 JSON 字符串数组（或留空），理由见 api/admin/products/route.ts
  features: z.string().optional().nullable().refine((v) => isFeaturesJson(v), FEATURES_FORMAT_ERROR),
})

// 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return notFound('商品不存在')
    }

    const body = await request.json()

    /*
     * 【系统载体商品保护】（docs/短信接码-设计.md D14、§6.6 第 19 条、附录 B 第 8 条）接码单（SMS_POOL）与充值单（TOPUP）挂在这两行上，
     * 必须保持下架（status=0）、价格 0、发货方式不变：上架了就会从各个公开列表外泄，改了发货方式整条付款框架就认不出它们。
     * 名称、描述等展示字段照常可改；这三项只要与现值不同就 409（后台编辑弹窗会原样带回 deliveryType，与现值相同的放行）。
     */
    const cur = await prisma.product.findUnique({ where: { id: productId }, select: { deliveryType: true, status: true, price: true } })
    if (cur && isCarrierType(cur.deliveryType) && body && typeof body === 'object') {
      const b = body as { status?: unknown; price?: unknown; deliveryType?: unknown }
      const priceChanged = b.price !== undefined && Math.round(Number(b.price) * 100) !== Math.round(Number(cur.price) * 100)
      const statusChanged = b.status !== undefined && Number(b.status) !== cur.status
      const typeChanged = b.deliveryType !== undefined && b.deliveryType !== cur.deliveryType
      if (priceChanged || statusChanged || typeChanged) {
        return error('这是系统载体商品（短信接码 / 余额充值的订单挂在这里），不能上架、改价或改发货方式', 409)
      }
      delete (body as Record<string, unknown>).deliveryType
    }

    const result = updateProductSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    // apiSku：未提交则不动；提交空串则清空为 null（避免唯一约束下多个 '' 冲突）
    const { apiSku, botCode, ...rest } = result.data
    const base = apiSku === undefined ? rest : { ...rest, apiSku: apiSku ? apiSku : null }
    // botCode 同理：未提交不动、空串清空；存大写。只对（保存后的）自动发货商品有意义，别的类型填了直接拒
    let data: typeof base & { botCode?: string | null } = base
    if (botCode !== undefined) {
      const code = botCode ? botCode.toUpperCase() : null
      if (code && (rest.deliveryType ?? cur?.deliveryType) !== 'AUTO') return error('机器人货号只对自动发货商品有效')
      data = { ...base, botCode: code }
    }

    // 渠道分站：记下改之前是否上架，用来判断这次是不是「下架」（设计 7.3）
    const before = result.data.status !== undefined ? await prisma.product.findUnique({ where: { id: productId }, select: { status: true } }) : null

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    })
    if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)

    /*
     * 【下架通知已授权渠道】（设计 7.3 末行）：通知那一段抽到了 lib/product-status.ts 的 notifyProductWithdrawn，
     * 与微信机器人的「下架 <货号>」共用（docs/微信机器人-设计.md §7.3）。条件、载荷、去重键、失败只记日志都与原来相同。
     */
    if (before && before.status === 1 && product.status !== 1) {
      await notifyProductWithdrawn(product)
    }

    // SEO（批 2 的 G 包，lib/seo/commerce-push.ts）：记 product_edited_<id>（sitemap lastmod 只认它）并推 IndexNow。
    // 不 await：失败只记日志，不拖慢、不影响保存结果。wasListed 用改之前的状态（没改 status 时就是现状）
    void onProductSaved(product.id, { wasListed: (before ? before.status : cur?.status) === 1 })

    return success(product, '商品更新成功')
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return error(isBotCodeConflict(err) ? '机器人货号已被占用，请换一个' : '对外发卡 SKU 已被占用，请换一个')
    }
    console.error('Update product error:', err)
    return error('更新商品失败')
  }
}

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return notFound('商品不存在')
    }

    /*
     * 【删除保护】（设计 12.2：存在 listing、订单、已用卡则只允许下架）
     *  · 渠道 listing：删了商品，渠道的上架行、历史订单快照就指向一个不存在的商品；
     *  · 订单：外键本来就会拒绝，这里提前给一句能看懂的话；
     *  · 已发出的卡：CardKey 对商品是级联删除，删商品会把发货记录（含成本 / 利润）一起抹掉。
     * 这几种情况一律只能下架（status=0）。
     */
    // 系统载体商品不能删（D14）：删了之后接码 / 充值会因为「载体商品不是恰好 1 行」整体停售
    const carrier = await prisma.product.findUnique({ where: { id: productId }, select: { deliveryType: true } })
    if (carrier && isCarrierType(carrier.deliveryType)) return error('这是系统载体商品（短信接码 / 余额充值的订单挂在这里），不能删除', 409)

    const [listings, orders, usedCards] = await Promise.all([
      prisma.tenantListing.count({ where: { productId } }),
      prisma.order.count({ where: { productId } }),
      prisma.cardKey.count({ where: { productId, status: 'USED' } }),
    ])
    if (listings || orders || usedCards) {
      const why = [orders ? `${orders} 张订单` : '', usedCards ? `${usedCards} 张已发出的卡密` : '', listings ? `${listings} 个渠道上架记录` : '']
        .filter(Boolean)
        .join('、')
      return error(`该商品有${why}，不能删除，只能下架`)
    }

    await prisma.product.delete({
      where: { id: productId },
    })

    return success(null, '商品删除成功')
  } catch (err) {
    console.error('Delete product error:', err)
    return error('删除商品失败')
  }
}
