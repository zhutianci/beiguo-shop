export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { isValidSlug } from '@/lib/content/policy'
import { TAG_KINDS, ensureContentDefaults } from '@/lib/content/tags'
import { PUBLIC_WHERE } from '@/lib/content/queries'
import { tagFieldsShape } from '@/lib/content/tag-admin'

// 后台：策展标签列表（含停用的）与每个标签下的公开内容数
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    await ensureContentDefaults()
    const tags = await prisma.tag.findMany({
      orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { posts: { where: { post: PUBLIC_WHERE } } } } },
    })
    return success(
      tags.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        kind: t.kind,
        intro: t.intro,
        landingPath: t.landingPath,
        sortOrder: t.sortOrder,
        status: t.status,
        publicCount: t._count.posts,
      })),
    )
  } catch (err) {
    console.error('Admin list tags error:', err)
    return error('获取失败')
  }
}

const createSchema = z.object({
  slug: z.string().trim().refine(isValidSlug, 'slug 只能是小写字母、数字和连字符'),
  kind: z.enum(TAG_KINDS as unknown as ['MODEL', 'TOPIC', 'PRODUCT']),
  ...tagFieldsShape,
  name: z.string().trim().min(1, '请填写名称').max(40),
})

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data
    if (await prisma.tag.findUnique({ where: { slug: d.slug } })) return error('这个 slug 已经存在')
    const tag = await prisma.tag.create({
      data: {
        slug: d.slug,
        kind: d.kind,
        name: d.name,
        intro: d.intro || null,
        landingPath: d.landingPath || null,
        sortOrder: d.sortOrder ?? 0,
      },
    })
    return success({ id: tag.id }, '已创建')
  } catch (err) {
    console.error('Admin create tag error:', err)
    return error('创建失败')
  }
}
