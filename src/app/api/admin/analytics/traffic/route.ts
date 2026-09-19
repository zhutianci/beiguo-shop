export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { pathGroup } from '@/lib/analytics/classify'

/**
 * 站级流量分析。数据源 = page_views + visitors（由 /api/track/view 采集）。
 *
 * 【这个接口存在的理由】回答一个问题：这一轮 SEO 值不值。
 * 所以「按来源看流量」和「/chongzhi/* 落地页表现」是主线，其余维度是给这两条主线做背景的。
 * 任何一块如果不能指向一个决策，就不该出现在返回体里。
 *
 * 【为什么大量用 $queryRaw 而不是 prisma.groupBy】
 * UV 的定义是 COUNT(DISTINCT viewer_key)，Prisma 的 groupBy/_count 表达不了它。
 * 用 groupBy 只能退而求其次：要么把 viewer_key 拉回 Node 里 Set 去重（这台机器 1.8G 内存，
 * 一个 180 天区间几十万行就爆了），要么 by:['dayKey','viewerKey'] 把「访客-天」明细拉回来数行数
 * （行数同量级，一样不可接受）。所以去重计数必须留在数据库里做。
 *
 * 【和 cardkeys 分析不同，这里敢用 SQL 聚合】cardkeys 那边刻意避开 $queryRaw，
 * 是因为它要对 DATETIME 做时区换算，DATE()/CONVERT_TZ 的结果会随部署环境漂移。
 * 这里不存在那个问题：day_key / hour_bucket 在写入时就已经按东八区算成字符串了，
 * SQL 里只做字符串比较和分组，没有任何时区语义参与，结果与 MySQL session 时区无关。
 *
 * 【每条 WHERE 都落在索引上】区间过滤一律用 day_key（@@index([dayKey])），
 * 带 source 的用 (source, dayKey)，带 path 的用 (path, dayKey)。
 * 没有一处对列做函数运算后再比较——那样会让索引失效，在这台机器上就是一次超时。
 */

// ---------------------------------------------------------------------------
// 常量与工具
// ---------------------------------------------------------------------------

const DAY_MS = 86400000
const TZ_OFFSET_MIN = 8 * 60

// 单次查询最大跨度。180 天已经够看完一轮 SEO 的完整周期了，
// 再长的区间对决策没有额外价值，却会让每条 COUNT(DISTINCT) 的临时表撑爆这台小机器。
/*
 * 【上限必须和保留期对得上】page_views 按 90 天清理（见 /api/cron/cleanup，
 * 那个数字又和 /privacy 里对买家的承诺绑定）。
 * 上限设成 180 的话，选一个 90 天区间，环比对象是更早的 90 天——那批数据已经被删了，
 * 六张指标卡会一齐显示「上期无数据」，而看的人第一反应是怀疑埋点坏了。
 * 设成 45：区间加上等长的环比区间正好落在 90 天保留期内，任何合法查询都有环比可比。
 */
const MAX_DAYS = 45

// SQL 里的 LIMIT 一律写成字面量，不走 ${} 插值：
// Prisma 的模板插值会变成绑定参数，而 MySQL 对 `LIMIT ?` 的支持在不同驱动/版本上并不一致。
// 这些值全是写死的常量，不存在注入面。

const TOP_PAGES = 30
const TOP_GROUPS = 30
const TOP_LANDINGS = 15
// 落地页逐日折线最多画几条。超过这个数量的折线图没人看得清，
// 完整清单在 chongzhi.pages 里，不会丢信息。
const TOP_LANDING_SERIES = 8

// 落地页专项的口径：/chongzhi 本身 + 它下面所有子页
const LANDING_ROOT = '/chongzhi'
const LANDING_LIKE = '/chongzhi/%'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * MySQL 的 COUNT() 经 Prisma raw 回来是 bigint，SUM() 是 Decimal（或字符串），
 * 两者直接塞进 JSON.stringify 会抛「Do not know how to serialize a BigInt」。
 * 所有从 raw 出来的数字都必须过这一层。
 */
function toNum(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'bigint') return Number(v)
  const n = Number(v as string)
  return Number.isFinite(n) ? n : 0
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
/** 百分比，保留一位小数；分母为 0 时给 0 而不是 NaN（NaN 进 JSON 会变成 null，前端画图直接断） */
const pct = (part: number, whole: number) => (whole > 0 ? round1((part / whole) * 100) : 0)

/** YYYY-MM-DD 字符串当成 UTC 零点解析。day_key 本身已是东八区日期，这里只借 UTC 做日期算术 */
const dayMs = (day: string) => Date.parse(`${day}T00:00:00.000Z`)
const msDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** 闭区间逐日展开 */
function eachDay(from: string, to: string): string[] {
  const out: string[] = []
  const end = dayMs(to)
  for (let t = dayMs(from); t <= end; t += DAY_MS) out.push(msDay(t))
  return out
}

/** 正则能过但日期不存在的输入（2026-02-31、2026-13-01）要挡住，否则区间算出来是 NaN */
function isRealDate(day: string): boolean {
  const ms = dayMs(day)
  return Number.isFinite(ms) && msDay(ms) === day
}

/** visitors 表按 first_seen(DATETIME, UTC) 过滤，需要把东八区的日界换算成 UTC 时刻 */
const dayStartUtc = (day: string) => new Date(dayMs(day) - TZ_OFFSET_MIN * 60000)
const dayEndUtc = (day: string) =>
  new Date(Date.parse(`${day}T23:59:59.999Z`) - TZ_OFFSET_MIN * 60000)

// ---------------------------------------------------------------------------
// raw 行类型。数值列一律先按 unknown 收，再过 toNum
// ---------------------------------------------------------------------------

type PvUvRow = { pv: unknown; uv: unknown }
type SummaryRow = PvUvRow & { visitorDays: unknown; bounced: unknown }
type DayRow = PvUvRow & { dayKey: string }
type DayPathRow = DayRow & { path: string }
type PathRow = PvUvRow & { path: string }
type SourceRow = PvUvRow & { source: string }
type EngineRow = PvUvRow & { engine: string | null }
type RefRow = PvUvRow & { refHost: string | null; source: string }
type DeviceRow = PvUvRow & { device: string }
type HourRow = PvUvRow & { hh: string | null }

/** 空区间时各块的兜底值，保证前端拿到的永远是 0 / []，不会是 undefined */
const EMPTY_PERIOD = {
  pv: 0,
  uv: 0,
  newVisitors: 0,
  returningVisitors: 0,
  returningRate: 0,
  pagesPerVisitor: 0,
  visitorDays: 0,
  bouncedVisitorDays: 0,
  bounceRate: 0,
}

/**
 * 一个区间的总览。
 *
 * 【跳出率是近似值，不是标准口径】本站只有 pageview 埋点，没有 session 概念
 * （没有 session id、没有超时切分、没有离开时间），算不出真正的「单页会话占比」。
 * 这里用「同一个 viewerKey 在同一天只访问过 1 个不同 path」的「访客-天」占比来近似。
 * 它与 GA 的 bounce rate 不可比，**只能用来看自己的横向变化趋势**：
 * 比如换了落地页文案之后这个数字降了，说明有更多人愿意往下点。
 * 拿它去跟别家的数字比，或者当成绝对指标汇报，都是错的。
 */
async function loadPeriod(start: string, end: string) {
  // 派生表一次算清四个数：PV、UV、访客-天、其中只看了一页的访客-天。
  // 分成四条 SQL 的话要扫四遍同一批行，而且口径容易互相打架。
  const rows = await prisma.$queryRaw<SummaryRow[]>`
    SELECT
      SUM(t.pv)                                        AS pv,
      COUNT(DISTINCT t.viewer_key)                     AS uv,
      COUNT(*)                                         AS visitorDays,
      SUM(CASE WHEN t.pages = 1 THEN 1 ELSE 0 END)     AS bounced
    FROM (
      SELECT viewer_key, day_key, COUNT(*) AS pv, COUNT(DISTINCT path) AS pages
      FROM page_views
      WHERE day_key BETWEEN ${start} AND ${end}
      GROUP BY viewer_key, day_key
    ) t
  `

  // 新访客直接查 visitors.first_seen，不从 page_views 反推。
  // 反推要做「这个 key 在区间之前有没有出现过」的反连接，那是一次自连接全扫。
  const newVisitors = await prisma.visitor.count({
    where: { firstSeen: { gte: dayStartUtc(start), lte: dayEndUtc(end) } },
  })

  // 纯聚合查询一定有一行，这里只是兜底：宁可整块归零，也不要让 UV=0 却报出一堆新访客，
  // 那种自相矛盾的数字比没有数字更容易误导人
  const r = rows[0]
  if (!r) return EMPTY_PERIOD

  const pv = toNum(r.pv)
  const uv = toNum(r.uv)
  const visitorDays = toNum(r.visitorDays)
  const bounced = toNum(r.bounced)
  // 新访客取 min：visitors 行由埋点 upsert 创建，理论上 first_seen 落在区间内就必有 PV，
  // 但历史数据补写、时钟回拨这类情况会让它偶尔超过 UV，钳住免得回访率算成负数
  const fresh = Math.min(newVisitors, uv)

  return {
    pv,
    uv,
    newVisitors: fresh,
    returningVisitors: uv - fresh,
    returningRate: pct(uv - fresh, uv),
    pagesPerVisitor: uv > 0 ? round2(pv / uv) : 0,
    visitorDays,
    bouncedVisitorDays: bounced,
    bounceRate: pct(bounced, visitorDays),
  }
}

// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')?.trim() || ''
    const end = searchParams.get('end')?.trim() || ''

    if (!DATE_RE.test(start) || !isRealDate(start)) return error('start 日期格式错误')
    if (!DATE_RE.test(end) || !isRealDate(end)) return error('end 日期格式错误')
    if (start > end) return error('开始日期不能晚于结束日期')

    /*
     * 【先算长度再展开数组】这两行的顺序是有代价的：eachDay 会把区间物化成
     * 一个「每天一个字符串」的数组，传个 1900-01-01 就是几十万个元素。
     * 这台机器只有 1.8G 内存，不能先分配再报错。
     * dayMs 解析的是 UTC 零点，差值必然是 DAY_MS 的整数倍，不存在夏令时误差。
     */
    const span = Math.round((dayMs(end) - dayMs(start)) / DAY_MS) + 1
    if (span > MAX_DAYS) {
      return error(`查询区间最长 ${MAX_DAYS} 天，当前 ${span} 天，请缩小范围`)
    }
    const days = eachDay(start, end)

    // 上一个等长区间，紧挨着当前区间之前。前端拿它算环比。
    const prevEnd = msDay(dayMs(start) - DAY_MS)
    const prevStart = msDay(dayMs(start) - days.length * DAY_MS)

    // 分三批发，不是一次 Promise.all 全打出去：
    // Prisma 连接池就那么几条，一次塞十几个带 COUNT(DISTINCT) 的查询进去，
    // 排队的那些会一直占着 Node 侧的 promise，还可能撞上连接池超时。
    const [current, previous] = await Promise.all([
      loadPeriod(start, end),
      loadPeriod(prevStart, prevEnd),
    ])

    const [dailyRows, sourceRows, engineRows, refRows, pathRows, deviceRows, hourRows, landingRows] =
      await Promise.all([
        // 每日趋势
        prisma.$queryRaw<DayRow[]>`
          SELECT day_key AS dayKey, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
          GROUP BY day_key
          ORDER BY day_key
        `,
        // 来源构成
        prisma.$queryRaw<SourceRow[]>`
          SELECT source, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
          GROUP BY source
          ORDER BY pv DESC
        `,
        // 搜索引擎细分。单独一条而不是 GROUP BY source, engine：
        // 那样写出来的 uv 是「每个引擎各自去重」，跨引擎相加会重复计人，
        // 和上面 bySource 里的 search 行对不上。宁可多一次走 (source, day_key) 索引的查询。
        prisma.$queryRaw<EngineRow[]>`
          SELECT engine, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE source = 'search' AND day_key BETWEEN ${start} AND ${end}
          GROUP BY engine
          ORDER BY pv DESC
        `,
        // 外部来源站。排除 internal（站内跳转不是「来源」），也排除拿不到 referrer 的直接访问
        prisma.$queryRaw<RefRow[]>`
          SELECT ref_host AS refHost, source, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
            AND source <> 'internal'
            AND ref_host IS NOT NULL
          GROUP BY ref_host, source
          ORDER BY pv DESC
          LIMIT 20
        `,
        // 页面明细。一条查询同时喂「热门页面」和「按页面类型归类」两个视图，
        // 归类在 Node 里用 pathGroup() 做——归类规则只能有一处定义，
        // 在 SQL 里再写一遍 CASE WHEN 迟早会和 classify.ts 漂开，而这种错在图上看不出来。
        // LIMIT 2000 是给长尾封顶：新闻详情页每篇一条，再往后的几千条各看一两次的页面
        // 既上不了榜也改变不了归类后的排序，只会让响应体白白胖几百 KB
        prisma.$queryRaw<PathRow[]>`
          SELECT path, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
          GROUP BY path
          ORDER BY pv DESC
          LIMIT 2000
        `,
        // 设备构成
        prisma.$queryRaw<DeviceRow[]>`
          SELECT device, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
          GROUP BY device
          ORDER BY pv DESC
        `,
        // 分时段分布。hour_bucket 是 'YYYY-MM-DDTHH'，末两位就是东八区的小时，
        // 取子串不影响 WHERE 走索引（函数只作用在 SELECT/GROUP BY，不在过滤条件上）
        prisma.$queryRaw<HourRow[]>`
          SELECT RIGHT(hour_bucket, 2) AS hh, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
          GROUP BY hh
          ORDER BY hh
        `,
        // 入口页。这是「第一次进站落在哪」，和热门页面不是一回事：
        // 一个页面可以浏览量很高却几乎不作为入口（站内点进去的），反过来也成立。
        // 只有前者能说明 SEO 把人带到了哪里。
        prisma.visitor.groupBy({
          by: ['landing'],
          where: {
            firstSeen: { gte: dayStartUtc(start), lte: dayEndUtc(end) },
            landing: { not: null },
          },
          _count: { _all: true, landing: true },
          orderBy: { _count: { landing: 'desc' } },
          take: TOP_LANDINGS,
        }),
      ])

    const [landingPageRows, landingDailyRows, landingDayPathRows, landingSourceRows] =
      await Promise.all([
        // 落地页逐页汇总。不从上面的 pathRows 里筛，是因为那条有 LIMIT：
        // 万一某个落地页这段时间没什么量被挤出榜，专项分析里就查无此页了，
        // 而「某个落地页没量」恰恰是最需要看到的结论
        prisma.$queryRaw<PathRow[]>`
          SELECT path, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
            AND (path = ${LANDING_ROOT} OR path LIKE ${LANDING_LIKE})
          GROUP BY path
          ORDER BY pv DESC
        `,
        // 落地页整体逐日。UV 不能由逐页的 UV 相加得到（同一个人看了两页会被算两次），
        // 所以整体趋势必须单独查一次
        prisma.$queryRaw<DayRow[]>`
          SELECT day_key AS dayKey, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
            AND (path = ${LANDING_ROOT} OR path LIKE ${LANDING_LIKE})
          GROUP BY day_key
          ORDER BY day_key
        `,
        // 落地页逐页逐日。行数 = 天数 × 落地页数，最坏 180 × 十几页，可控
        prisma.$queryRaw<DayPathRow[]>`
          SELECT day_key AS dayKey, path, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
            AND (path = ${LANDING_ROOT} OR path LIKE ${LANDING_LIKE})
          GROUP BY day_key, path
          ORDER BY day_key
        `,
        // 落地页的来源构成。这是整个仪表盘最该盯的一行数字：
        // 落地页的量里有多少是 search 带来的，直接回答「这轮 SEO 值不值」
        prisma.$queryRaw<SourceRow[]>`
          SELECT source, COUNT(*) AS pv, COUNT(DISTINCT viewer_key) AS uv
          FROM page_views
          WHERE day_key BETWEEN ${start} AND ${end}
            AND (path = ${LANDING_ROOT} OR path LIKE ${LANDING_LIKE})
          GROUP BY source
          ORDER BY pv DESC
        `,
      ])

    // ---- 每日趋势：补齐缺失日期 ----
    // 缺日期不是「少一个点」，折线图会把 9 月 3 号和 9 月 7 号直接连成一条平滑的线，
    // 看图的人会以为中间四天有稳定流量。补 0 之后那四天是真实的谷底。
    const dailyMap = new Map(dailyRows.map((r) => [r.dayKey, r]))
    const daily = days.map((day) => {
      const r = dailyMap.get(day)
      return { day, pv: toNum(r?.pv), uv: toNum(r?.uv) }
    })

    const bySource = sourceRows.map((r) => ({
      source: r.source,
      pv: toNum(r.pv),
      uv: toNum(r.uv),
    }))
    const sourcePvTotal = bySource.reduce((s, r) => s + r.pv, 0)
    const bySourceWithShare = bySource.map((r) => ({ ...r, share: pct(r.pv, sourcePvTotal) }))

    const byEngine = engineRows.map((r) => ({
      // engine 可能为 null（识别到是搜索引擎但没匹配上具体名字），不要让前端拿到 null 当 key
      engine: r.engine || 'other',
      pv: toNum(r.pv),
      uv: toNum(r.uv),
    }))

    const topReferrers = refRows.map((r) => ({
      host: r.refHost || '(未知)',
      source: r.source,
      pv: toNum(r.pv),
      uv: toNum(r.uv),
    }))

    // ---- 热门页面：原始明细 + 按 pathGroup() 归类 ----
    const allPaths = pathRows.map((r) => ({ path: r.path, pv: toNum(r.pv), uv: toNum(r.uv) }))
    const topPages = allPaths.slice(0, TOP_PAGES)

    const groupMap = new Map<string, { group: string; pv: number; uvSum: number; pages: number }>()
    for (const p of allPaths) {
      const g = pathGroup(p.path)
      const cur = groupMap.get(g) || { group: g, pv: 0, uvSum: 0, pages: 0 }
      cur.pv += p.pv
      // uvSum 是各成员页面 UV 之和，**不是去重后的 UV**：
      // 一个人看了三篇新闻会在 /news/* 里被数三次。做不到精确是因为跨页去重要么在 SQL 里
      // 重写一遍 pathGroup 的规则（规则两处定义必然漂移），要么把 (path, viewer_key) 明细
      // 拉回 Node（这台机器扛不住）。字段名写成 uvSum 就是为了让前端不会把它当 UV 展示。
      cur.uvSum += p.uv
      cur.pages += 1
      groupMap.set(g, cur)
    }
    const topPageGroups = Array.from(groupMap.values())
      .sort((a, b) => b.pv - a.pv)
      .slice(0, TOP_GROUPS)

    const byDevice = deviceRows.map((r) => ({
      device: r.device,
      pv: toNum(r.pv),
      uv: toNum(r.uv),
    }))
    const devicePvTotal = byDevice.reduce((s, r) => s + r.pv, 0)
    const byDeviceWithShare = byDevice.map((r) => ({ ...r, share: pct(r.pv, devicePvTotal) }))

    // ---- 分时段：0-23 全部给齐 ----
    // 若只返回有数据的小时，柱状图的 x 轴会缩成七八根柱子，
    // 「凌晨没人、晚上是高峰」这个形状就看不出来了——而这个形状本身就是要看的东西
    const hourMap = new Map(hourRows.map((r) => [Number(r.hh), r]))
    const byHour = Array.from({ length: 24 }, (_, h) => {
      const r = hourMap.get(h)
      return { hour: h, pv: toNum(r?.pv), uv: toNum(r?.uv) }
    })

    const topLandings = landingRows.map((r) => ({
      path: r.landing || '(未知)',
      visitors: r._count._all,
    }))

    // ---- 落地页专项 ----
    const chongzhiPages = landingPageRows.map((r) => ({
      path: r.path,
      pv: toNum(r.pv),
      uv: toNum(r.uv),
    }))

    const chongzhiDailyMap = new Map(landingDailyRows.map((r) => [r.dayKey, r]))
    const chongzhiDaily = days.map((day) => {
      const r = chongzhiDailyMap.get(day)
      return { day, pv: toNum(r?.pv), uv: toNum(r?.uv) }
    })

    // 逐页折线同样要补齐日期，理由和总趋势一样
    const seriesPaths = chongzhiPages.slice(0, TOP_LANDING_SERIES).map((p) => p.path)
    const dayPathMap = new Map<string, DayPathRow>()
    for (const r of landingDayPathRows) dayPathMap.set(`${r.path}|${r.dayKey}`, r)
    const chongzhiPageSeries = seriesPaths.map((path) => ({
      path,
      points: days.map((day) => {
        const r = dayPathMap.get(`${path}|${day}`)
        return { day, pv: toNum(r?.pv), uv: toNum(r?.uv) }
      }),
    }))

    const chongzhiBySource = landingSourceRows.map((r) => ({
      source: r.source,
      pv: toNum(r.pv),
      uv: toNum(r.uv),
    }))
    const chongzhiPv = chongzhiBySource.reduce((s, r) => s + r.pv, 0)
    const chongzhiSearchPv = chongzhiBySource.find((r) => r.source === 'search')?.pv ?? 0
    const chongzhiSearchUv = chongzhiBySource.find((r) => r.source === 'search')?.uv ?? 0

    return success({
      range: {
        start,
        end,
        days: days.length,
        prevStart,
        prevEnd,
      },
      // 总览 + 上一个等长区间，前端自己算环比（放在前端算是为了它能控制「无上期数据」时的展示）
      summary: { current, previous },
      daily,
      bySource: bySourceWithShare,
      byEngine,
      topReferrers,
      topPages,
      topPageGroups,
      byDevice: byDeviceWithShare,
      byHour,
      topLandings,
      chongzhi: {
        // 只给 PV 合计，不给「落地页整体 UV」：它既不能由逐日 UV 相加（跨天重复计人），
        // 也不能由逐页或各来源的 UV 相加（跨页、跨来源同样重复）。
        // 与其返回一个会被当成人数展示的错数字，不如不给——精确的 UV 在 pages / daily / bySource 各自那一层
        pv: chongzhiPv,
        pages: chongzhiPages,
        daily: chongzhiDaily,
        pageSeries: chongzhiPageSeries,
        bySource: chongzhiBySource,
        // SEO 的直接答案：落地页的流量里有多大比例是搜索引擎带来的
        searchPv: chongzhiSearchPv,
        searchUv: chongzhiSearchUv,
        searchShare: pct(chongzhiSearchPv, chongzhiPv),
      },
    })
  } catch (err) {
    console.error('Traffic analytics error:', err)
    return error('统计失败')
  }
}
