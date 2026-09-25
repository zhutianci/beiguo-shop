/**
 * 友链模块里**要碰数据库 / 要发网络请求**的那一半：页面文案配置的读写、
 * 前台数据装配、同域名查重、回链巡检。
 *
 * 纯函数与枚举在 friend-link-client.ts，那边不 import prisma，客户端组件可以直接引。
 * 这个文件只能被 Server Component 与 route handler 引用。
 */

import { prisma } from './db'
import { siteOrigin } from './news/format'
import { hostOf, outboundRel, type PublicLinkDto } from './friend-link-client'
import { assertPublicUrl, safeGet, SafeFetchError, TIMEOUT_MESSAGE, UnsafeTargetError } from './safe-fetch'

// ---------------- 页面文案配置 ----------------

/**
 * 友链页的文案与招商参数，存在 Setting 表的一行 JSON 里。
 *
 * 【为什么不给每条文案单开一个 Setting 键】这些字段永远是一起读、一起改的，
 * 拆成十几个键只会让前台读配置变成十几次查询，后台还要一个个 upsert。
 * 反过来也不该写死成代码常量：招商位的联系方式和权益说明是运营要随时改的东西，
 * 改一行文案就得重新构建镜像（这台机器一次构建 6~7 分钟）完全不划算。
 */
export interface LinksPageConfig {
  /** 页面导语 */
  intro: string
  /** 申请友链的要求，逐条展示 */
  requirements: string[]
  /** 招商区标题与说明 */
  sponsorTitle: string
  sponsorIntro: string
  /** 招商位权益，逐条展示 */
  sponsorBenefits: string[]
  /** 招商位总数。前台用「总数 - 已占用」算出还剩几个空位，空位渲染成「虚位以待」 */
  sponsorSlots: number
  /** 是否开放前台在线申请。关掉后只留联系方式 */
  applyOpen: boolean
  /** 联系方式（微信号 / 邮箱），公开展示 */
  contact: string
  contactNote: string
  /** 本站信息：给对方挂链用，前台提供一键复制 */
  siteName: string
  siteUrl: string
  siteLogo: string
  siteDescription: string
}

const CONFIG_KEY = 'friend_links_page'

/** 默认配置。没在后台配置过时，前台也该是一张完整能看的页面，而不是一堆空白 */
export function defaultLinksConfig(): LinksPageConfig {
  const origin = siteOrigin()
  return {
    intro:
      '我们乐于和内容扎实、访问稳定的站点互相推荐。下面这些站点都是人工逐个看过的，也欢迎你把自己的站点提交过来。',
    requirements: [
      '站点内容合法合规，无赌博、色情、诈骗、刷量等内容',
      '站点可正常访问、有持续更新，不是一次性搭起来的空壳站',
      '已在贵站可见位置挂上本站链接（先挂后申请，审核更快）',
      'AI 工具、开发者服务、效率工具、技术博客等相关主题优先',
    ],
    sponsorTitle: '招商合作位',
    sponsorIntro:
      '页面顶部的固定展位，位置比友链墙更靠前，适合需要长期曝光的品牌与产品。位置有限，先到先得。',
    sponsorBenefits: [
      '友链页首屏置顶，独立大卡片展示',
      '品牌 logo + 一句话介绍，可带专属活动说明',
      '同时在本站论坛与客服话术中作为合作方推荐',
      '按 Google 规范，付费展位统一标记 rel="sponsored"，不影响双方站点健康度',
    ],
    sponsorSlots: 4,
    applyOpen: true,
    contact: '',
    contactNote: '也可以直接加客服微信聊，备注「友链」通过更快。',
    siteName: '贝果科技',
    siteUrl: origin,
    siteLogo: origin + '/logo-square.png',
    siteDescription: '专业的 AI 订阅服务平台，提供 Claude、ChatGPT 等订阅的快速开通与持续保障。',
  }
}

/**
 * 读配置。数据库里存的可能是旧版本（少字段）或被手工改坏的 JSON，
 * 一律与默认值合并后再返回 —— 前台不能因为一行配置坏了就整页 500。
 */
export async function getLinksConfig(): Promise<LinksPageConfig> {
  const base = defaultLinksConfig()
  try {
    const row = await prisma.setting.findUnique({ where: { key: CONFIG_KEY } })
    if (!row?.value) return base
    const saved = JSON.parse(row.value) as Partial<LinksPageConfig>
    return {
      ...base,
      ...saved,
      // 数组字段单独兜底：存成 null / 字符串时 {...saved} 会原样带进来，前台 .map 就炸了
      requirements: Array.isArray(saved.requirements) ? saved.requirements : base.requirements,
      sponsorBenefits: Array.isArray(saved.sponsorBenefits) ? saved.sponsorBenefits : base.sponsorBenefits,
      sponsorSlots: Number.isFinite(saved.sponsorSlots) ? Number(saved.sponsorSlots) : base.sponsorSlots,
    }
  } catch (err) {
    console.error('[friend-link] 读取页面配置失败，回落到默认值:', err)
    return base
  }
}

export async function saveLinksConfig(cfg: LinksPageConfig): Promise<void> {
  const value = JSON.stringify(cfg)
  await prisma.setting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value },
    update: { value },
  })
}

// ---------------- 前台数据装配 ----------------

export interface LinksPageData {
  config: LinksPageConfig
  sponsors: PublicLinkDto[]
  friends: PublicLinkDto[]
  /** 剩余招商位，用来渲染「虚位以待 N 席」和空位卡片 */
  sponsorFree: number
}

/**
 * 友链页要的全部数据。由 Server Component 直接调用。
 *
 * 【为什么必须服务端取数】这一页存在的意义，就是让**出站链接真的出现在 HTML 里**：
 * 对方站长验证我们有没有挂他，用的基本都是「纯 HTTP 拉 HTML + 匹配域名」的工具
 * （本项目自己的 checkBacklink 就是这么干的），百度爬虫也基本不执行 JS。
 * 数据一旦改成客户端 fetch，curl 下来就是个空壳：对方查不到链接会把我们撤掉，
 * 招商位买家买到的是一张爬虫看不见的卡片。这条不能为了省一层壳而让步。
 *
 * 【字段是白名单式显式 select】contact / remark / applyIp 是申请人的联系方式与审计信息，
 * 一次 `{...row}` 就会把它们发到公网上。项目在买家订单接口上踩过一次这种坑。
 */
export async function getLinksPageData(): Promise<LinksPageData> {
  const now = new Date()
  const [rows, config] = await Promise.all([
    prisma.friendLink
      .findMany({
        where: {
          status: 'APPROVED',
          // 招商位可以设有效期，到期自动从前台消失，不依赖人工去点下线
          AND: [
            { OR: [{ startAt: null }, { startAt: { lte: now } }] },
            { OR: [{ endAt: null }, { endAt: { gte: now } }] },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          url: true,
          logo: true,
          description: true,
          slot: true,
          nofollow: true,
        },
      })
      // 【数据库抖一下不该让整页 500】友链页大半内容是文案（互链须知、招商说明、本站信息），
      // 这些即使查不到链接也该照常显示。sitemap.ts 里是同一个取舍。
      .catch((e) => {
        console.error('Get friend links query error:', e)
        return []
      }),
    getLinksConfig(),
  ])

  const items: PublicLinkDto[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    host: hostOf(r.url),
    logo: r.logo,
    description: r.description,
    slot: r.slot,
    rel: outboundRel(r.slot, r.nofollow),
  }))

  const sponsors = items.filter((i) => i.slot === 'SPONSOR')
  const friends = items.filter((i) => i.slot !== 'SPONSOR')

  return {
    config,
    sponsors,
    friends,
    // 配置里的总数小于已占用时按 0 处理，不让页面出现负数
    sponsorFree: Math.max(0, config.sponsorSlots - sponsors.length),
  }
}

// ---------------- 同域名查重 ----------------

/**
 * 同域名查重。
 *
 * 【为什么不能只用 `url: { contains: host }`】那是子串匹配：库里已有
 * notexample.com 时，新申请 example.com 会被 `contains 'example.com'` 命中，
 * 一个毫无关系的站点就被判成重复、直接退回。所以数据库那层只当**粗筛**
 * （表很小，几十上百条，LIKE 的代价可以忽略），真正的判定在这里按 host 精确比。
 *
 * 返回命中的那条（含 id / name / status），没有则 null。
 */
export async function findSameHost(
  url: string,
  excludeId?: number
): Promise<{ id: number; name: string; status: string } | null> {
  const host = hostOf(url)
  const candidates = await prisma.friendLink.findMany({
    where: {
      url: { contains: host },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, name: true, status: true, url: true },
  })
  const hit = candidates.find((c) => hostOf(c.url) === host)
  return hit ? { id: hit.id, name: hit.name, status: hit.status } : null
}

// ---------------- 回链巡检 ----------------

const MAX_HTML_BYTES = 512 * 1024 // 只读前 512KB：友链一般挂在页脚，够了；再多就是白白吃内存
const CHECK_TIMEOUT_MS = 10000

export interface BacklinkResult {
  ok: boolean
  note: string
}

/**
 * 去对方页面上找本站的链接。
 *
 * 【内网防护】申请表单是公开的，站长审核时点「检测」会以服务端身份去请求对方填的地址。
 * 以前只查 hostname 字面量、再交给 fetch(redirect:'follow')：解析到内网的域名（127.0.0.1.nip.io）、
 * 结尾带点的容器名（http://app.:3000/）、公网 302 到 100.100.100.200 都能绕过（2026-09-26 审计 G33）。
 * 现在走 lib/safe-fetch：建连那一刻校验 DNS 解析结果（连的就是校验过的 IP，没有 rebinding 时间差），
 * 跳转手动跟、每一跳重新校验，最多 5 跳。
 *
 * 【为什么只看域名出现过没有，而不解析 DOM】对方可能把链接放在 JS 渲染的组件里，
 * 也可能写成 //bigolab.com 这种省略协议的形式。上正则抠 <a href> 反而漏判更多，
 * 而误判的代价只是后台多显示一个绿勾，管理员点开一眼就能复核。
 */
export async function checkBacklink(url: string): Promise<BacklinkResult> {
  let target: URL
  try {
    target = new URL(url)
  } catch {
    return { ok: false, note: '地址不合法' }
  }
  try {
    assertPublicUrl(target)
  } catch (e) {
    return { ok: false, note: (e as Error).message }
  }

  let ourHost = ''
  try {
    ourHost = new URL(siteOrigin()).host.replace(/^www\./i, '').toLowerCase()
  } catch {
    ourHost = ''
  }
  if (!ourHost) return { ok: false, note: '本站域名未配置（NEXT_PUBLIC_SITE_URL）' }

  try {
    // 只读前 512KB（按解压后的字节）：对方页面可能是几十 MB 的单页应用产物，整包读会把这台 1.8G 的机器推向 OOM
    const res = await safeGet(target.toString(), {
      timeoutMs: CHECK_TIMEOUT_MS,
      maxBytes: MAX_HTML_BYTES,
      maxRedirects: 5,
      headers: {
        // 不少站点对空 UA 直接 403，这里表明身份并留一个可追溯的地址
        'User-Agent': 'Mozilla/5.0 (compatible; BigolabLinkBot/1.0; +' + siteOrigin() + '/links)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (res.status < 200 || res.status >= 300) return { ok: false, note: 'HTTP ' + res.status }

    const found = res.body.toLowerCase().includes(ourHost)
    return found
      ? { ok: true, note: '已找到本站链接（HTTP ' + res.status + '）' }
      : { ok: false, note: '页面可访问，但未出现 ' + ourHost }
  } catch (err) {
    if (err instanceof UnsafeTargetError || (err as { code?: string })?.code === 'ESSRF') {
      return { ok: false, note: '拒绝请求内网地址（' + (err as Error).message + '）' }
    }
    if (err instanceof SafeFetchError && err.message === TIMEOUT_MESSAGE) {
      return { ok: false, note: '超时（' + CHECK_TIMEOUT_MS / 1000 + 's）' }
    }
    if (err instanceof SafeFetchError && err.message === '跳转次数过多') return { ok: false, note: '跳转次数过多' }
    return { ok: false, note: '无法访问' }
  }
}
