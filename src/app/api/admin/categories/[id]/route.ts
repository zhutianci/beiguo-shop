import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  status: z.number().optional(),
})

// 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return notFound('分类不存在')
    }

    const body = await request.json()
    const result = updateCategorySchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: result.data,
    })

    return success(category, '分类更新成功')
  } catch (err) {
    console.error('Update category error:', err)
    return error('更新分类失败')
  }
}

// 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return notFound('分类不存在')
    }

    // 检查是否有商品使用该分类
    const productCount = await prisma.product.count({
      where: { categoryId },
    })

    if (productCount > 0) {
      return error(`无法删除，该分类下还有 ${productCount} 个商品`)
    }

    await prisma.category.delete({
      where: { id: categoryId },
    })

    return success(null, '分类删除成功')
  } catch (err) {
    console.error('Delete category error:', err)
    return error('删除分类失败')
  }
}
