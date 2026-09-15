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

/**
 * 私网 / 回环 / 链路本地地址，不允许服务端去请求。
 *
 * 十进制、八进制、十六进制那些花式 IP 写法（http://2130706433/）不用单独处理：
 * WHATWG 的 URL 解析器会先把它们规范化成点分四段，这里拿到的 hostname 已经是 127.0.0.1。
 * 但 IPv4-mapped IPv6（[::ffff:127.0.0.1]）会被规范成 ::ffff:7f00:1，
 * 点分四段的正则匹配不到，所以要单独还原一次。
 */
function isBlockedHost(hostname: string): boolean {
  let h = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '::1' || h === '::') return true
  // fc00::/7（ULA）与 fe80::/10（链路本地）。必须匹配到冒号：写成 startsWith('fc')
  // 会把 fc2.com、fcc.gov、fdroid.org 这类正经域名一并当成内网地址拒掉，
  // 后台会显示「拒绝请求内网地址」并标红，管理员误以为对方撤了链。
  if (/^f[cd][0-9a-f]{2}:/.test(h) || /^fe[89ab][0-9a-f]:/.test(h)) return true

  // ::ffff:7f00:1 → 127.0.0.1；点分写法（::ffff:127.0.0.1）解析器一般不会保留，兜一手
  const mapped = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mapped) {
    const hi = parseInt(mapped[1], 16)
    const lo = parseInt(mapped[2], 16)
    h = `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
  } else if (h.startsWith('::ffff:')) {
    h = h.slice(7)
  }

  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  if (a === 10 || a === 127 || a === 0) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true // 云厂商的元数据地址就在这一段
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

const MAX_HTML_BYTES = 512 * 1024 // 只读前 512KB：友链一般挂在页脚，够了；再多就是白白吃内存
const CHECK_TIMEOUT_MS = 10000

export interface BacklinkResult {
  ok: boolean
  note: string
}

/**
 * 去对方页面上找本站的链接。
 *
 * 【这不是完整的安全边界】虽然挡了私网地址，但域名解析后仍可能指向内网（DNS rebinding）。
 * 这个接口只有管理员能调、且不把响应体回显给调用方，风险可接受；
 * 要彻底解决得自己实现带 lookup 校验的 undici agent，代价远大于收益。
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
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return { ok: false, note: '仅支持 http/https' }
  }
  if (isBlockedHost(target.hostname)) {
    return { ok: false, note: '拒绝请求内网地址' }
  }

  let ourHost = ''
  try {
    ourHost = new URL(siteOrigin()).host.replace(/^www\./i, '').toLowerCase()
  } catch {
    ourHost = ''
  }
  if (!ourHost) return { ok: false, note: '本站域名未配置（NEXT_PUBLIC_SITE_URL）' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // 不少站点对空 UA 直接 403，这里表明身份并留一个可追溯的地址
        'User-Agent': 'Mozilla/5.0 (compatible; BigolabLinkBot/1.0; +' + siteOrigin() + '/links)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    // 跳转终点也要查一遍：入口地址干干净净、302 到 169.254.169.254 是绕过入口校验的经典手法
    try {
      const finalHost = new URL(res.url || target.toString()).hostname
      if (isBlockedHost(finalHost)) return { ok: false, note: '跳转到了内网地址，已拒绝' }
    } catch {
      /* res.url 拿不到就按原地址算，入口已经查过 */
    }
    if (!res.ok) return { ok: false, note: 'HTTP ' + res.status }

    // 流式读取并在 512KB 处截断：对方页面可能是几十 MB 的单页应用产物，
    // 直接 res.text() 会把这台 1.8G 内存的机器推向 OOM
    let html = ''
    const reader = res.body?.getReader()
    if (reader) {
      const decoder = new TextDecoder('utf-8', { fatal: false })
      let got = 0
      for (;;) {
        const chunk = await reader.read()
        if (chunk.done) break
        got += chunk.value?.length || 0
        html += decoder.decode(chunk.value, { stream: true })
        if (got >= MAX_HTML_BYTES) {
          await reader.cancel()
          break
        }
      }
    } else {
      html = (await res.text()).slice(0, MAX_HTML_BYTES)
    }

    const found = html.toLowerCase().includes(ourHost)
    return found
      ? { ok: true, note: '已找到本站链接（HTTP ' + res.status + '）' }
      : { ok: false, note: '页面可访问，但未出现 ' + ourHost }
  } catch (err) {
    const msg = (err as Error)?.name === 'AbortError' ? '超时（' + CHECK_TIMEOUT_MS / 1000 + 's）' : '无法访问'
    return { ok: false, note: msg }
  } finally {
    clearTimeout(timer)
  }
}
