/**
 * 服务端渲染编排：从库里解析商品/券 → 调同构渲染器 → 跑检查。
 * 后台预览、测试发送、launch 冻结快照三处都走这里，保证「所见即所发」。
 *
 * 【实现方：发送引擎】签名是契约。
 */
import { prisma } from '@/lib/db'
import { siteOrigin } from '@/lib/news/format'
import { PUBLIC_PRODUCT_SELECT } from '@/lib/product-select'
import { couponClaimable, parseProductIds } from '@/lib/coupon'
import { footerConfig, getConfig } from './config'
import { grantSpecProblem, MIN_UNTIL_REMAINING_MS } from './coupon'
import { lintContent, lintRendered, safeNickname } from './lint'
import { personalizeSubject } from './personalize'
import { couponViewFor, renderEmail } from './render'
import { bjDateCn, bjDateToEnd } from './time'
import type {
  BlockOf,
  CampaignRefs,
  CatalogResponse,
  CouponView,
  EmailDoc,
  LintIssue,
  MergeTag,
  ProductCard,
  Topic,
} from './types'

/* ============================== 昵称 ============================== */

/**
 * 昵称清洗：可用 → 清洗后的昵称；空 / 不安全 → null（交给占位里写的默认值，如 {{nickname|老朋友}}）。
 * safeNickname 的 fallback 为空时会回落到「朋友」，直接用它会把作者写的默认值盖掉；
 * 这里换两个不同的 fallback 各跑一次：两次都原样返回 fallback，说明原值不可用。
 */
export function cleanNickname(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null
  const A = '①甲'
  const B = '②乙'
  const a = safeNickname(raw, A)
  if (a !== A) return a
  const b = safeNickname(raw, B)
  return b === B ? null : b
}

/* ============================== 商品卡片 ============================== */

/** 邮件里能用的图片格式（QQ/163/Outlook 对 webp 支持不稳，svg 基本不显示） */
const MAIL_IMAGE_EXT_RE = /\.(jpe?g|png|gif)$/i

/**
 * 商品图 → 邮件可用的绝对 URL。相对路径补成站点绝对地址；webp / svg / 没有扩展名 / 外站 http 图 → null
 * （渲染器用品牌色占位）。开发环境 origin 是 http://localhost，本站图片照样放行，方便本地预览。
 */
export function mailImageUrl(raw: string | null | undefined, origin: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  let abs: string
  if (/^https?:\/\//i.test(s)) abs = s
  else if (s.startsWith('//')) abs = `https:${s}`
  else abs = `${origin}${s.startsWith('/') ? '' : '/'}${s}`
  let u: URL
  try {
    u = new URL(abs)
  } catch {
    return null
  }
  if (!MAIL_IMAGE_EXT_RE.test(u.pathname)) return null
  if (u.protocol !== 'https:' && !abs.startsWith(`${origin}/`)) return null
  return u.toString()
}

/** features 是 TEXT 列里的 JSON 字符串数组；只保留字符串项（与 product-client 的 parseFeatures 同口径） */
function parseFeatures(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const v: unknown = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6)
      .map((s) => (s.length > 60 ? s.slice(0, 60) : s))
  } catch {
    return []
  }
}

interface ProductRow {
  id: number
  name: string
  price: unknown
  originalPrice: unknown
  image: string | null
  features: string | null
  status?: number
}

function toCard(p: ProductRow, origin: string): ProductCard {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price).toFixed(2),
    originalPrice: p.originalPrice == null ? null : Number(p.originalPrice).toFixed(2),
    image: mailImageUrl(p.image, origin),
    features: parseFeatures(p.features),
    url: `${origin}/products/${p.id}`,
    status: p.status ?? 1,
  }
}

interface ClaimBatch {
  source: string | null
  status: string
  startAt: Date | null
  endAt: Date | null
  claimed: number
  total: number
}

/**
 * 公开批次在 at 时刻能不能领：'ok'；'not_started' = 其余都满足、只是还没到开始时间；'invalid' = 其余情况。
 * 与领取接口 / 券落地页同一道闸（lib/coupon.ts 的 couponClaimable），外加 source=null、ACTIVE（审查 C12：
 * 以前不看 startAt，邮件写「立即领取」、点进去却是「该活动尚未开始」）
 */
function claimStateAt(c: ClaimBatch, at: Date): 'ok' | 'not_started' | 'invalid' {
  if (c.source != null || c.status !== 'ACTIVE') return 'invalid'
  if (couponClaimable(c, at).ok) return 'ok'
  if (c.startAt && at.getTime() < c.startAt.getTime() && couponClaimable({ ...c, startAt: null }, at).ok) return 'not_started'
  return 'invalid'
}

/**
 * 编辑器用的商品/券目录：在售商品（公开字段白名单）、可领的公开券批次。
 * 渠道分站（设计 11.3）：营销是平台专属，这里列的是 Product 上的主站价、链接用平台 origin（siteOrigin()），
 * 不读任何渠道上架与售价——营销邮件永远只卖主站价。
 */
export async function loadCatalog(): Promise<CatalogResponse> {
  const origin = siteOrigin()
  const now = new Date()
  const [products, coupons] = await Promise.all([
    prisma.product.findMany({
      where: { status: 1 },
      select: PUBLIC_PRODUCT_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: 500,
    }),
    prisma.coupon.findMany({
      where: { source: null, status: 'ACTIVE', OR: [{ endAt: null }, { endAt: { gt: now } }] },
      orderBy: { id: 'desc' },
      take: 200,
    }),
  ])
  return {
    products: products.map((p) => toCard({ ...p, status: 1 }, origin)),
    // 还没开始的批次也列出来：可以配定时发送用（检查 / 发送时按实际开始发送的时刻再核一遍开始时间，审查 C12）
    coupons: coupons
      .filter((c) => claimStateAt(c, now) !== 'invalid')
      .map((c) => ({
        code: c.code,
        name: c.name,
        kind: c.kind === 'PRODUCT' ? 'PRODUCT' : 'THRESHOLD',
        discount: Number(c.discount).toFixed(2),
        minAmount: Number(c.minAmount).toFixed(2),
        remaining: Math.max(0, c.total - c.claimed),
        endAt: c.endAt ? c.endAt.toISOString() : null,
      })),
  }
}

/* ============================== 解析文档引用 ============================== */

function productBlockIds(doc: EmailDoc): { blockId: string; ids: number[] }[] {
  const out: { blockId: string; ids: number[] }[] = []
  for (const b of doc.blocks) {
    if (b.type === 'product') out.push({ blockId: b.id, ids: [b.productId] })
    else if (b.type === 'productGrid') out.push({ blockId: b.id, ids: b.productIds })
  }
  return out
}

function couponBlocks(doc: EmailDoc): BlockOf<'coupon'>[] {
  return doc.blocks.filter((b): b is BlockOf<'coupon'> => b.type === 'coupon')
}

/** 文档里的直发券区块（一个活动最多一个） */
export function grantBlockOf(doc: EmailDoc): BlockOf<'coupon'> | null {
  const b = couponBlocks(doc)[0]
  return b && b.mode === 'grant' ? b : null
}

/**
 * 解析文档里引用的商品与券。商品下架/不存在、领取码不可领、直发券参数不合法 → issues 里给 error。
 * origin 用于把商品图片、商品链接、券链接补成绝对 URL。
 * sendFrom：实际开始发送的时刻（检查 / 发送传 max(现在, 定时)）。给了它，领取券「还没开始」是 error；
 * 不给（编辑器预览、测试发送）只是 warn —— 那时还不知道什么时候发（审查 C12）。
 * couponProductIds：券限定的商品（邮件里写了「适用商品」），冻结进 refs 供发送期间复核（审查 C9）
 */
export async function resolveRenderData(
  doc: EmailDoc,
  origin: string,
  opts: { sendFrom?: Date | null } = {}
): Promise<{ products: Record<number, ProductCard>; coupon: CouponView | null; issues: LintIssue[]; couponProductIds: number[] }> {
  const issues: LintIssue[] = []
  const now = new Date()
  const sendFrom = opts.sendFrom && !Number.isNaN(opts.sendFrom.getTime()) ? opts.sendFrom : null
  // 领取券按「开始发送那一刻」判断（定时发送时批次可以晚于现在开始，但不能晚于定时）
  const claimAt = sendFrom && sendFrom.getTime() > now.getTime() ? sendFrom : now
  const shown = productBlockIds(doc)
  const coupons = couponBlocks(doc)
  const first = coupons[0] ?? null

  // 一次取齐：展示的商品 + 直发商品券限定的商品
  const ids = new Set<number>()
  shown.forEach((s) => s.ids.forEach((id) => ids.add(id)))
  if (first?.mode === 'grant' && first.grant?.kind === 'PRODUCT') first.grant.productIds.forEach((id) => ids.add(id))

  let claim: (ClaimBatch & { code: string; kind: string; discount: unknown; minAmount: unknown; productIds: string | null }) | null = null
  if (first?.mode === 'claim' && first.claimCode) {
    claim = await prisma.coupon.findUnique({
      where: { code: first.claimCode },
      select: { code: true, kind: true, discount: true, minAmount: true, startAt: true, endAt: true, productIds: true, source: true, status: true, claimed: true, total: true },
    })
    if (claim?.kind === 'PRODUCT') parseProductIds(claim.productIds).forEach((id) => ids.add(id))
  }

  // 券限定的商品：邮件里写成「适用商品：X」，发送期间下架了券就用不了（审查 C9）
  const couponProductIds =
    first?.mode === 'grant' && first.grant?.kind === 'PRODUCT'
      ? Array.from(new Set(first.grant.productIds))
      : first?.mode === 'claim' && claim?.kind === 'PRODUCT'
        ? parseProductIds(claim.productIds)
        : []

  const rows = ids.size
    ? await prisma.product.findMany({
        where: { id: { in: Array.from(ids) } },
        select: { ...PUBLIC_PRODUCT_SELECT, status: true },
      })
    : []
  const products: Record<number, ProductCard> = {}
  for (const r of rows) products[r.id] = toCard(r, origin)

  for (const s of shown) {
    for (const id of s.ids) {
      const p = products[id]
      if (!p) issues.push({ level: 'error', code: 'PRODUCT_MISSING', message: `商品 #${id} 不存在，请重新选择`, blockId: s.blockId })
      else if (p.status !== 1) issues.push({ level: 'error', code: 'PRODUCT_OFFLINE', message: `商品「${p.name}」已下架`, blockId: s.blockId })
    }
  }

  let coupon: CouponView | null = null
  if (coupons.length > 1) {
    issues.push({ level: 'error', code: 'COUPON_MULTIPLE', message: '一封邮件只能放一个优惠券区块', blockId: coupons[1].id })
  }
  if (first) {
    const nameOf = (id: number) => {
      const n = products[id]?.name || `商品 #${id}`
      return n.length > 20 ? `${n.slice(0, 20)}…` : n
    }
    if (first.mode === 'grant') {
      const problem = grantSpecProblem(first.grant)
      if (problem) issues.push({ level: 'error', code: 'COUPON_GRANT_INVALID', message: problem, blockId: first.id })
      const g = first.grant
      if (g?.kind === 'PRODUCT') {
        for (const id of g.productIds) {
          const p = products[id]
          if (!p || p.status !== 1) {
            issues.push({ level: 'error', code: 'COUPON_PRODUCT_OFFLINE', message: `券适用的商品 #${id} 不存在或已下架`, blockId: first.id })
          }
        }
      }
      if (g?.validity.mode === 'until') {
        const end = bjDateToEnd(g.validity.date)
        if (!Number.isNaN(end.getTime()) && end.getTime() - now.getTime() < MIN_UNTIL_REMAINING_MS) {
          issues.push({ level: 'error', code: 'COUPON_UNTIL_TOO_EARLY', message: '券截止日期太近：至少要比现在晚 48 小时', blockId: first.id })
        }
      }
      coupon = couponViewFor(first, origin, {
        productNames: g?.kind === 'PRODUCT' ? g.productIds.map(nameOf) : [],
      })
    } else {
      const state = claim ? claimStateAt(claim, claimAt) : 'invalid'
      if (!first.claimCode) {
        issues.push({ level: 'error', code: 'COUPON_CLAIM_MISSING', message: '请选择要领取的公开优惠券', blockId: first.id })
      } else if (state === 'not_started' && claim?.startAt) {
        // 单独的提示：批次本身没问题，把定时改到开始时间之后就能发（审查 C12）
        issues.push({
          level: sendFrom ? 'error' : 'warn',
          code: 'COUPON_CLAIM_NOT_STARTED',
          message: `领取券 ${first.claimCode} 在 ${bjDateTimeCn(claim.startAt)} 才开始，早于该时间发送的邮件点进去无法领取${sendFrom ? '：请把定时改到开始时间之后' : '（定时到开始时间之后发送则没有问题）'}`,
          blockId: first.id,
        })
      } else if (state !== 'ok') {
        issues.push({
          level: 'error',
          code: 'COUPON_CLAIM_INVALID',
          message: `领取码 ${first.claimCode} 不是可领取的公开优惠券（不存在、已结束或已领完）`,
          blockId: first.id,
        })
      }
      if (claim?.kind === 'PRODUCT') {
        // 与直发商品券同一口径：写进「适用商品」的商品必须在售（审查 C9）
        for (const id of couponProductIds) {
          const p = products[id]
          if (!p || p.status !== 1) {
            issues.push({ level: 'error', code: 'COUPON_PRODUCT_OFFLINE', message: `券适用的商品 #${id} 不存在或已下架`, blockId: first.id })
          }
        }
      }
      coupon = couponViewFor(first, origin, {
        claim:
          claim && state !== 'invalid'
            ? {
                code: claim.code,
                kind: claim.kind === 'PRODUCT' ? 'PRODUCT' : 'THRESHOLD',
                discount: Number(claim.discount).toFixed(2),
                minAmount: Number(claim.minAmount).toFixed(2),
                endAt: claim.endAt ? claim.endAt.toISOString() : null,
              }
            : null,
        productNames: claim?.kind === 'PRODUCT' ? parseProductIds(claim.productIds).map(nameOf) : [],
      })
    }
  }
  return { products, coupon, issues, couponProductIds }
}

/** 北京时间「M月D日 HH:mm」（提示文案用） */
function bjDateTimeCn(d: Date): string {
  const bj = new Date(d.getTime() + 8 * 3600_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${bj.getUTCMonth() + 1}月${bj.getUTCDate()}日 ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}`
}

/** 预览 / 测试里 {{coupon_expires}} 的示例值（真实发送时按每个人收券那一刻算） */
function sampleCouponExpires(doc: EmailDoc, now: Date): string {
  const g = grantBlockOf(doc)?.grant
  if (!g) return ''
  if (g.validity.mode === 'days') return bjDateCn(new Date(now.getTime() + g.validity.days * 86400_000))
  const end = bjDateToEnd(g.validity.date)
  return Number.isNaN(end.getTime()) ? '' : bjDateCn(end)
}

/** 合并多路检查结果，去掉完全相同的重复项（lintContent 与服务端补充偶有重叠） */
function mergeIssues(...lists: LintIssue[][]): LintIssue[] {
  const seen = new Set<string>()
  const out: LintIssue[] = []
  for (const list of lists) {
    for (const i of list) {
      const k = `${i.level}|${i.code}|${i.blockId ?? ''}|${i.message}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push(i)
    }
  }
  // 错误排在警告前面
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

/* ============================== 后台预览 ============================== */

export interface AdminPreviewInput {
  doc: EmailDoc
  subject: string
  preheader: string
  topic: Topic
  /** 以某个用户的昵称/邮箱渲染变量；不传用样例值 */
  previewUserId?: number | null
  selectedBlockId?: string | null
  imagesOff?: boolean
  /** 实际开始发送的时刻（发送前检查传 max(现在, 定时)）；编辑器预览不传（审查 C12） */
  sendFrom?: Date | null
}

/** 后台实时预览（preview 模式渲染 + 全部检查）。issues = 内容检查 + 服务端解析 + 渲染后检查 */
export async function renderForAdminPreview(
  input: AdminPreviewInput
): Promise<{ html: string; sizeBytes: number; imageCount: number; issues: LintIssue[] }> {
  const cfg = await getConfig()
  const origin = siteOrigin()
  const now = new Date()
  const data = await resolveRenderData(input.doc, origin, { sendFrom: input.sendFrom ?? null })

  const vars: Partial<Record<MergeTag, string>> = {}
  const expires = sampleCouponExpires(input.doc, now)
  if (expires) vars.coupon_expires = expires
  if (input.previewUserId) {
    const u = await prisma.user.findUnique({ where: { id: input.previewUserId }, select: { email: true, nickname: true } })
    if (u) {
      // 与真实发送同一套清洗：不安全的昵称回落到占位里写的默认值
      const nick = cleanNickname(u.nickname)
      if (nick) vars.nickname = nick
      if (u.email) vars.email = u.email.toLowerCase()
    }
  }

  const r = renderEmail(input.doc, {
    mode: 'preview',
    subject: input.subject,
    preheader: input.preheader,
    origin,
    footer: footerConfig(cfg),
    products: data.products,
    coupon: data.coupon,
    vars,
    selectedBlockId: input.selectedBlockId ?? null,
    imagesOff: !!input.imagesOff,
  })
  const issues = mergeIssues(
    lintContent({ subject: input.subject, preheader: input.preheader, topic: input.topic, doc: input.doc, subjectPrefix: cfg.subjectPrefix }),
    data.issues,
    lintRendered({ html: r.html, text: r.text, subject: `${cfg.subjectPrefix}${input.subject}`, sizeBytes: r.sizeBytes, imageCount: r.imageCount })
  )
  return { html: r.html, sizeBytes: r.sizeBytes, imageCount: r.imageCount, issues }
}

/* ============================== 测试邮件 ============================== */

/**
 * 测试邮件（test 模式：链接直达原 URL 但带 UTM 与 via=mail、不登记 links；退订指向 /unsubscribe/test、无像素、
 * 券标注「未实际发券」）。via=mail 让落地页清掉本机旧推广码：测试者看到的落地效果才和收件人一样（审查 C11）
 */
export async function buildTestEmail(
  campaign: { id: number; topic: Topic; subject: string; preheader: string | null; doc: EmailDoc },
  recipient: { email: string; nickname: string | null }
): Promise<{ subject: string; html: string; text: string; issues: LintIssue[] }> {
  // 测试邮件会真的发出去：配置读不到就报错，不拿默认页脚（可能缺联系邮箱）去发
  const cfg = await getConfig({ strict: true })
  const origin = siteOrigin()
  const data = await resolveRenderData(campaign.doc, origin)
  const nick = cleanNickname(recipient.nickname)
  const vars: Partial<Record<MergeTag, string>> = { email: recipient.email.toLowerCase() }
  if (nick) vars.nickname = nick
  const expires = sampleCouponExpires(campaign.doc, new Date())
  if (expires) vars.coupon_expires = expires

  const preheader = campaign.preheader || ''
  const r = renderEmail(campaign.doc, {
    mode: 'test',
    subject: campaign.subject,
    preheader,
    origin,
    footer: footerConfig(cfg),
    products: data.products,
    coupon: data.coupon,
    vars,
    // 返回的不是 {{mkt_link:N}}：渲染器原样当 href 用、不登记 links（mailto 不经这里）
    linkWrap: (url: string) => withTracking(url, campaign.id, origin),
  })
  const subject = personalizeSubject(`${cfg.subjectPrefix}[测试] ${campaign.subject}`, { nickname: nick })
  const issues = mergeIssues(
    lintContent({ subject: campaign.subject, preheader, topic: campaign.topic, doc: campaign.doc, subjectPrefix: cfg.subjectPrefix }),
    data.issues,
    lintRendered({ html: r.html, text: r.text, subject, sizeBytes: r.sizeBytes, imageCount: r.imageCount })
  )
  return { subject, html: r.html, text: r.text, issues }
}

/* ============================== launch 冻结 ============================== */

/** MarketingLink.url 列宽 */
const LINK_URL_MAX = 2000
const LINK_LABEL_MAX = 120

function bareHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '')
}

/**
 * 给邮件里的链接追加 UTM（保留原有 query 与 #hash）。
 * 本站链接额外带 via=mail：落地页据此清掉本机旧推广码（D11：推广价与券互斥，旧推广码会让邮件承诺的券不可用）。
 * 外站链接只加 UTM —— via=mail 对别人的站没有意义。mailto: 等非 http(s) 原样返回。
 */
export function withTracking(url: string, campaignId: number, origin: string): string {
  let u: URL
  try {
    u = new URL(url, `${origin}/`)
  } catch {
    return url
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return url
  u.searchParams.set('utm_source', 'bigolab')
  u.searchParams.set('utm_medium', 'email')
  u.searchParams.set('utm_campaign', `mkt${campaignId}`)
  let site = ''
  try {
    site = bareHost(new URL(origin).host)
  } catch {
    site = ''
  }
  if (site && bareHost(u.host) === site) u.searchParams.set('via', 'mail')
  return u.toString()
}

/**
 * launch 时冻结：send 模式渲染（变量留占位、链接登记为 {{mkt_link:N}}）+ 对最终产物再跑检查。
 * 返回待写入 campaign 的快照字段与 links（由调用方在同一事务里落库）。
 */
export async function freezeSnapshot(
  campaign: { id: number; topic: Topic; subject: string; preheader: string | null; doc: EmailDoc },
  couponBatchId: number | null,
  /** sendFrom：实际开始发送的时刻（launch 传定时或现在），领取券的开始时间按它核（审查 C12） */
  opts: { sendFrom?: Date | null } = {}
): Promise<{
  html: string
  text: string
  finalSubject: string
  refs: CampaignRefs
  links: { idx: number; url: string; label: string }[]
  issues: LintIssue[]
}> {
  const cfg = await getConfig({ strict: true })
  const origin = siteOrigin()
  const data = await resolveRenderData(campaign.doc, origin, { sendFrom: opts.sendFrom ?? new Date() })
  const preheader = campaign.preheader || ''

  const links: { idx: number; url: string; label: string }[] = []
  const linkIssues: LintIssue[] = []
  // idx 从 1 开始：避免任何一处把 0 当成「没有」
  const linkWrap = (url: string, label: string): string => {
    if (!/^https?:/i.test(url) && !url.startsWith('/')) return url // mailto: 等不经跳转
    let tracked = withTracking(url, campaign.id, origin)
    if (tracked.length > LINK_URL_MAX) tracked = url.startsWith('/') ? `${origin}${url}` : url
    if (tracked.length > LINK_URL_MAX) {
      linkIssues.push({ level: 'error', code: 'LINK_TOO_LONG', message: `链接过长（超过 ${LINK_URL_MAX} 字符）：${url.slice(0, 60)}…` })
      tracked = tracked.slice(0, LINK_URL_MAX)
    }
    const idx = links.length + 1
    links.push({ idx, url: tracked, label: (label || '').trim().slice(0, LINK_LABEL_MAX) })
    return `{{mkt_link:${idx}}}`
  }

  const r = renderEmail(campaign.doc, {
    mode: 'send',
    subject: campaign.subject,
    preheader,
    origin,
    footer: footerConfig(cfg),
    products: data.products,
    coupon: data.coupon,
    linkWrap,
  })
  const finalSubject = `${cfg.subjectPrefix}${campaign.subject}`
  const issues = mergeIssues(
    lintContent({ subject: campaign.subject, preheader, topic: campaign.topic, doc: campaign.doc, subjectPrefix: cfg.subjectPrefix }),
    data.issues,
    linkIssues,
    lintRendered({ html: r.html, text: r.text, subject: finalSubject, sizeBytes: r.sizeBytes, imageCount: r.imageCount })
  )

  // refs：发送期间每趟复核（下架 / 改价 → 暂停）。只记邮件里「展示了价格」的商品
  const shownIds = new Set<number>()
  productBlockIds(campaign.doc).forEach((s) => s.ids.forEach((id) => shownIds.add(id)))
  const first = couponBlocks(campaign.doc)[0]
  const refs: CampaignRefs = {
    products: Array.from(shownIds)
      .filter((id) => data.products[id])
      .map((id) => ({ id, price: data.products[id].price })),
    couponId: couponBatchId,
    claimCode: first?.mode === 'claim' ? first.claimCode ?? null : null,
    // 券限定的商品（没当商品卡片展示、只写在「适用商品」里）也要复核在售（审查 C9）
    couponProducts: data.couponProductIds,
  }

  return { html: r.html, text: r.text, finalSubject, refs, links, issues }
}
