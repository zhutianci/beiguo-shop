import { prisma } from './db'
import { getCurrentUser } from './auth'

// 默认板块（首次访问自动创建）
export const DEFAULT_CATEGORIES = [
  { name: '反馈建议', slug: 'feedback', description: '产品建议、问题反馈，我们会认真查看', icon: '💡', color: 'amber', sortOrder: 1 },
  { name: '使用交流', slug: 'discuss', description: '使用心得、求助答疑、经验分享', icon: '💬', color: 'purple', sortOrder: 2 },
  { name: '官方公告', slug: 'announce', description: '官方公告与产品更新', icon: '📢', color: 'cyan', sortOrder: 3 },
  { name: '灌水闲聊', slug: 'chat', description: '随便聊聊，轻松一下', icon: '☕', color: 'pink', sortOrder: 4 },
]

export async function ensureDefaultCategories() {
  const count = await prisma.forumCategory.count()
  if (count === 0) {
    await prisma.forumCategory.createMany({ data: DEFAULT_CATEGORIES })
  }
}

export interface Actor {
  userId: number | null
  isAdmin: boolean
  nickname: string | null
  anonId: string | null
}

// 解析当前操作者：登录用户优先，否则匿名（用 x-anon-id 头去重）
export async function resolveActor(req: Request): Promise<Actor> {
  const user = await getCurrentUser()
  const anonId = req.headers.get('x-anon-id')?.slice(0, 64) || null
  return {
    userId: user?.id ?? null,
    isAdmin: user?.role === 'ADMIN',
    nickname: user?.nickname || (user?.email ? user.email.split('@')[0] : null),
    anonId,
  }
}

// 规范化标签：逗号/空格分隔，去重，最多 5 个，每个 ≤ 16 字
export function normalizeTags(input?: string | null): string {
  if (!input) return ''
  const tags = input
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.slice(0, 16))
  return Array.from(new Set(tags)).slice(0, 5).join(',')
}
