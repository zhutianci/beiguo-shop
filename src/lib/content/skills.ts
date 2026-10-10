/**
 * Skill 库目录（/skills，2026-10-10）的服务端取数。规则（什么算 Skill 库、平台分组、安装命令怎么认）在 skill-lib.ts（纯函数）。
 *
 * 只取公开内容（PUBLIC_WHERE），列表不取正文（同 queries.ts 的 CARD_SELECT 的做法：只取卡片要用的列 + app_specs 的几个短字段）。
 * 目录的量级是几十个库（种子编号 300–399），所以一次取齐、平台筛选与分页都在内存里做——
 * 筛选条上每个平台的条数、当前筛选的结果、分页用的是同一份数据，不会对不上。上限 MAX_LIBRARIES，超了告警。
 */
import { cache } from 'react'
import { prisma } from '../db'
import { contentPath } from './policy'
import { PUBLIC_WHERE, SKILL_WHERE } from './queries'
import { parseInstall, repoLabelOf, skillPlatformsOf, type SkillInstall, type SkillPlatform } from './skill-lib'

const MAX_LIBRARIES = 300

export interface SkillLibraryCard {
  id: number
  /** 详情页地址（仍在 /apps/{id}-{slug}） */
  path: string
  /** 库名（app_specs.name），如 anthropics/skills */
  name: string
  title: string
  excerpt: string
  /** GitHub 仓库或项目主页 */
  url: string
  repoLabel: string
  /** 授权与价格，如「开源免费（MIT）」 */
  pricing: string | null
  /** 适用的 Agent 原文，按 / 拆开展示 */
  platforms: string[]
  platformKeys: SkillPlatform[]
  install: SkillInstall
  featured: boolean
  /** 资料核对日期 YYYY-MM-DD */
  checkedOn: string | null
  createdAt: string
}

/** 全部公开的 Skill 库（精选在前，其余按发布先后——与 /apps 同一个排序）。同一次请求里 metadata 与页面体共用一次查询 */
export const listSkillLibraries = cache(async (): Promise<SkillLibraryCard[]> => {
  const rows = await prisma.forumPost.findMany({
    where: { ...PUBLIC_WHERE, ...SKILL_WHERE },
    orderBy: [{ featured: 'desc' }, { featuredAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    take: MAX_LIBRARIES + 1,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      featured: true,
      checkedOn: true,
      createdAt: true,
      app: { select: { name: true, url: true, pricing: true, platforms: true, trialNote: true } },
      postTags: { select: { tag: { select: { slug: true, kind: true, status: true } } } },
    },
  })
  if (rows.length > MAX_LIBRARIES) {
    console.warn(`[skills] Skill 库超过 ${MAX_LIBRARIES} 个，只列前 ${MAX_LIBRARIES} 个：该把筛选与分页改成数据库里做了`)
    rows.length = MAX_LIBRARIES
  }
  return rows
    .filter((r) => r.app)
    .map((r) => {
      const app = r.app!
      const products = r.postTags.filter((pt) => pt.tag.kind === 'PRODUCT' && pt.tag.status === 1).map((pt) => pt.tag.slug)
      return {
        id: r.id,
        path: contentPath('APP', r.id, r.slug),
        name: app.name,
        title: r.title,
        excerpt: r.excerpt || r.title,
        url: app.url,
        repoLabel: repoLabelOf(app.url),
        pricing: app.pricing,
        platforms: (app.platforms ?? '').split(/\s*[/，、]\s*/).map((s) => s.trim()).filter(Boolean),
        platformKeys: skillPlatformsOf(app.platforms, products),
        install: parseInstall(app.trialNote),
        featured: r.featured,
        checkedOn: r.checkedOn ? r.checkedOn.toISOString().slice(0, 10) : null,
        createdAt: r.createdAt.toISOString(),
      }
    })
})

/** 学习首页的 Skill 库区块：前几个 + 总数。查询失败由调用方（learnHomeData 的 safe）兜底 */
export async function skillLibraryPreview(limit: number): Promise<{ items: SkillLibraryCard[]; total: number }> {
  const all = await listSkillLibraries()
  return { items: all.slice(0, limit), total: all.length }
}

export interface StarterGuide {
  path: string
  title: string
  excerpt: string
}

/** 「新手从这里开始」优先放的两篇（按 slug 找；站方种子教程，见 docs/内容平台/种子内容/guides/） */
const STARTER_SLUGS = ['claude-skills', 'chatgpt-skills']

/**
 * 讲 Skill 的教程：先按 slug 找那两篇入门，再补标题里带 Skill / 技能的（最新的在前）。只取公开的教程；一篇都没有时区块只剩两个 hub 入口。
 * MySQL 默认排序规则不分大小写，contains 'skill' 同时匹配 Skill / Skills / SKILL.md。
 */
export async function skillStarterGuides(limit = 6): Promise<StarterGuide[]> {
  const rows = await prisma.forumPost.findMany({
    where: {
      ...PUBLIC_WHERE,
      type: 'GUIDE',
      OR: [{ slug: { in: STARTER_SLUGS } }, { title: { contains: 'skill' } }, { title: { contains: '技能' } }],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 40,
    select: { id: true, slug: true, title: true, excerpt: true },
  })
  const rank = (slug: string | null) => {
    const i = slug ? STARTER_SLUGS.indexOf(slug) : -1
    return i < 0 ? STARTER_SLUGS.length : i
  }
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r.slug) - rank(b.r.slug) || a.i - b.i)
    .slice(0, limit)
    .map(({ r }) => ({ path: contentPath('GUIDE', r.id, r.slug), title: r.title, excerpt: r.excerpt ?? '' }))
}
