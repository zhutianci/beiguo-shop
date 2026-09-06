export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { relayConfigured } from '@/lib/news/sources'

/**
 * 信源管理：列表 / 新增 / 改配置与启停（SKILL.md §2、§9）。
 *
 * 后台要能一眼看出三种异常：
 *   failCount > 0            抓取开始不稳（标黄）
 *   !enabled && failCount>=3 连续失败被自动禁用（标红）
 *   viaRelay 但中继未配置    境外源整批失联（标红），这时中文源照常但 tier1/HN 信号会计 0
 */

const AUTO_DISABLE_AT = 3

const createSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, 'key 至少 2 个字符')
    .max(40, 'key 最多 40 个字符')
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'key 只能用小写字母、数字和连字符'),
  name: z.string().trim().min(1, '请填写展示名').max(80, '展示名最多 80 个字符'),
  feedUrl: z.string().trim().min(4, '请填写 feed 地址').max(500, 'feed 地址过长'),
  homepage: z.string().trim().max(300).optional().nullable(),
  kind: z.enum(['RSS', 'ATOM', 'JSON', 'HN', 'GITHUB', 'X']).default('RSS'),
  lang: z.enum(['zh', 'en']).default('zh'),
  tier: z.coerce.number().int().min(1).max(3),
  role: z.enum(['feed', 'signal', 'both']).default('feed'),
  weight: z.coerce.number().min(0).max(9.99).optional(),
  viaRelay: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(80).optional(),
  feedUrl: z.string().trim().min(4).max(500).optional(),
  homepage: z.string().trim().max(300).nullable().optional(),
  kind: z.enum(['RSS', 'ATOM', 'JSON', 'HN', 'GITHUB', 'X']).optional(),
  lang: z.enum(['zh', 'en']).optional(),
  tier: z.coerce.number().int().min(1).max(3).optional(),
  role: z.enum(['feed', 'signal', 'both']).optional(),
  weight: z.coerce.number().min(0).max(9.99).optional(),
  viaRelay: z.boolean().optional(),
  enabled: z.boolean().optional(),
  /** 清空失败计数与错误信息（被自动禁用后手工恢复时用） */
  resetFail: z.boolean().optional(),
})

/** feed 地址：http(s)，或 X 账号的伪协议 x:handle（必须走中继） */
function validFeedUrl(u: string): boolean {
  return /^https?:\/\//i.test(u) || /^x:[A-Za-z0-9_]{1,20}$/.test(u)
}

// ---------- GET 列表 ----------

export async function GET() {
  try {
    const rows = await prisma.newsSource.findMany({
      orderBy: [{ enabled: 'desc' }, { tier: 'asc' }, { key: 'asc' }],
    })

    // itemCount 是管线自己维护的累计值，可能与实际有偏差；这里再取一次真实条目数供对照
    const grouped = await prisma.newsItem.groupBy({
      by: ['sourceId'],
      _count: { _all: true },
    })
    const realMap = new Map(grouped.map((g) => [g.sourceId, g._count._all]))

    const relayOn = relayConfigured()
    const list = rows.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      homepage: s.homepage,
      feedUrl: s.feedUrl,
      kind: s.kind,
      lang: s.lang,
      tier: s.tier,
      role: s.role,
      weight: Number(s.weight),
      viaRelay: s.viaRelay,
      enabled: s.enabled,
      lastFetchAt: s.lastFetchAt,
      lastOkAt: s.lastOkAt,
      failCount: s.failCount,
      lastError: s.lastError,
      itemCount: s.itemCount,
      itemsInDb: realMap.get(s.id) || 0,
      // 连续失败被自动禁用（区别于管理员主动停用）
      autoDisabled: !s.enabled && s.failCount >= AUTO_DISABLE_AT,
      // 需要中继但中继没配：这个源实际上是死的
      relayMissing: s.viaRelay && !relayOn,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    return success({
      list,
      stats: {
        total: list.length,
        enabled: list.filter((s) => s.enabled).length,
        failing: list.filter((s) => s.failCount > 0).length,
        autoDisabled: list.filter((s) => s.autoDisabled).length,
        relayConfigured: relayOn,
        relayPending: list.filter((s) => s.relayMissing).length,
        autoDisableAt: AUTO_DISABLE_AT,
      },
    })
  } catch (err) {
    console.error('List news sources error:', err)
    return error('获取信源列表失败')
  }
}

// ---------- POST 新增 ----------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    if (!validFeedUrl(d.feedUrl)) return error('feed 地址必须以 http(s):// 开头，X 账号用 x:handle 形式')
    if (/^x:/i.test(d.feedUrl) && !d.viaRelay) return error('X 账号源必须勾选「经中继」')

    const dup = await prisma.newsSource.findUnique({ where: { key: d.key }, select: { id: true } })
    if (dup) return error(`key「${d.key}」已存在`)

    const created = await prisma.newsSource.create({
      data: {
        key: d.key,
        name: d.name,
        feedUrl: d.feedUrl,
        homepage: d.homepage || null,
        kind: d.kind,
        lang: d.lang,
        tier: d.tier,
        role: d.role,
        // 权重不传就按分级给默认：一手 1.5 / 专业媒体 1.0 / 社区 0.7
        weight: new Prisma.Decimal(d.weight ?? (d.tier === 1 ? 1.5 : d.tier === 2 ? 1.0 : 0.7)),
        viaRelay: d.viaRelay ?? false,
        enabled: d.enabled ?? true,
      },
    })

    return success({ id: created.id }, '信源已新增（建议先用「立即测试」确认可达）')
  } catch (err) {
    console.error('Create news source error:', err)
    return error('新增信源失败')
  }
}

// ---------- PATCH 改配置 ----------

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const current = await prisma.newsSource.findUnique({ where: { id: d.id }, select: { id: true, feedUrl: true, viaRelay: true } })
    if (!current) return notFound('信源不存在')

    const feedUrl = d.feedUrl ?? current.feedUrl
    const viaRelay = d.viaRelay ?? current.viaRelay
    if (!validFeedUrl(feedUrl)) return error('feed 地址必须以 http(s):// 开头，X 账号用 x:handle 形式')
    if (/^x:/i.test(feedUrl) && !viaRelay) return error('X 账号源必须经中继')

    const updated = await prisma.newsSource.update({
      where: { id: d.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.feedUrl !== undefined ? { feedUrl: d.feedUrl } : {}),
        ...(d.homepage !== undefined ? { homepage: d.homepage || null } : {}),
        ...(d.kind !== undefined ? { kind: d.kind } : {}),
        ...(d.lang !== undefined ? { lang: d.lang } : {}),
        ...(d.tier !== undefined ? { tier: d.tier } : {}),
        ...(d.role !== undefined ? { role: d.role } : {}),
        ...(d.weight !== undefined ? { weight: new Prisma.Decimal(d.weight) } : {}),
        ...(d.viaRelay !== undefined ? { viaRelay: d.viaRelay } : {}),
        ...(d.enabled !== undefined ? { enabled: d.enabled } : {}),
        // 手工恢复被自动禁用的源：清掉失败计数，否则下一次失败就又到阈值
        ...(d.resetFail ? { failCount: 0, lastError: null } : {}),
      },
      select: { id: true, enabled: true, failCount: true },
    })

    return success(updated, '已保存')
  } catch (err) {
    console.error('Update news source error:', err)
    return error('保存失败')
  }
}
