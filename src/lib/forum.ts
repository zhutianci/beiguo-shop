import { createHmac } from 'crypto'
import { prisma } from './db'
import { getCurrentUser } from './auth'
import { getJwtSecret } from './jwt-secret'

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

/**
 * 会员在论坛的公开显示名。**绝不回落到邮箱的任何片段**（2026-09-26 审计 G48）。
 *
 * 以前没设昵称就拿邮箱 @ 前面那段当作者名，而注册时昵称是选填、大多数人不填；
 * 国内买家大量用 QQ 邮箱，前缀就是 QQ 号，补上 @qq.com 就是完整邮箱——
 * 论坛是公开页面（导航 + sitemap），等于把付费买家的联系方式挂给所有访客和爬虫。
 *
 * 没设昵称、或昵称里含 @（多半是把邮箱复制进来了，口径同 lib/mask）→「会员」+ 6 位稳定短码。
 * 短码用 HMAC(userId) 而不直接用自增 id，免得暴露注册人数；只是显示名，不参与鉴权或去重，
 * 撞名无害。JWT_SECRET 轮换后短码会变，纯属外观。
 * 公开 GET 一律按「会员当前昵称」读取时现算，库里旧的 author_name 快照（可能是邮箱前缀）不再外露。
 */
export function memberDisplayName(nickname: string | null | undefined, userId: number): string {
  const nick = (nickname || '').trim()
  if (nick && !nick.includes('@')) return nick.slice(0, 50)
  const tag = createHmac('sha256', getJwtSecret() || 'bigo-forum-name')
    .update(`forum-name:${userId}`)
    .digest('hex')
    .slice(0, 6)
  return `会员${tag}`
}

// 解析当前操作者：登录用户优先，否则匿名（x-anon-id 头只用来显示「我赞过没有」，不做限流/去重依据，见 forum-throttle）
export async function resolveActor(req: Request): Promise<Actor> {
  const user = await getCurrentUser()
  const anonId = req.headers.get('x-anon-id')?.slice(0, 64) || null
  return {
    userId: user?.id ?? null,
    isAdmin: user?.role === 'ADMIN',
    nickname: user ? memberDisplayName(user.nickname, user.id) : null,
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
