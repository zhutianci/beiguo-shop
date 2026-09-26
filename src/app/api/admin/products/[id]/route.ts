export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { syncAutoStock } from '@/lib/cardkey'
import { FEATURES_FORMAT_ERROR, isFeaturesJson } from '@/lib/product-intro'
import { adminGuard } from '@/lib/admin-guard'
import { emitTenantNotice } from '@/lib/tenant/notice'

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
    const result = updateProductSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    // apiSku：未提交则不动；提交空串则清空为 null（避免唯一约束下多个 '' 冲突）
    const { apiSku, ...rest } = result.data
    const data = apiSku === undefined ? rest : { ...rest, apiSku: apiSku ? apiSku : null }

    // 渠道分站：记下改之前是否上架，用来判断这次是不是「下架」（设计 7.3）
    const before = result.data.status !== undefined ? await prisma.product.findUnique({ where: { id: productId }, select: { status: true } }) : null

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    })
    if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)

    /*
     * 【下架通知已授权渠道】（设计 7.3 末行：商品下架时 listing 不改——可售判定已排除 Product.status≠1——
     * 只通知授权了它的渠道 PRODUCT_WITHDRAWN）。通知是附带动作：失败只记日志，不影响保存；
     * 没有授权行（主站休眠期）就是一次空查询。dedupeKey 按「商品 + 这次保存的时间」，同一次下架不重复通知。
     */
    if (before && before.status === 1 && product.status !== 1) {
      try {
        const listings = await prisma.tenantListing.findMany({
          where: { productId, granted: true },
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
        console.error('[product] 下架通知渠道失败', productId, e)
      }
    }

    return success(product, '商品更新成功')
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return error('对外发卡 SKU 已被占用，请换一个')
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
