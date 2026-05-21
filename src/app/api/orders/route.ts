export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { generateOrderNo } from '@/lib/utils'

const createOrderSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1),
  remark: z.string().optional(),
})

// 获取用户订单列表
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return success(orders)
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}

// 创建订单
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const body = await request.json()
    const result = createOrderSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const { productId, quantity, remark } = result.data

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || product.status !== 1) {
      return error('商品不存在或已下架')
    }

    // 检查库存
    if (product.stock !== -1 && product.stock < quantity) {
      return error('库存不足')
    }

    // 计算金额
    const amount = Number(product.price) * quantity

    // 创建待支付订单（默认 payStatus: UNPAID, deliveryStatus: PENDING）
    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: user.id,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity,
        amount,
        remark,
      },
    })

    // 销量在支付完成后再增加
    return success({ order }, '订单创建成功')
  } catch (err) {
    console.error('Create order error:', err)
    return error('创建订单失败')
  }
}
