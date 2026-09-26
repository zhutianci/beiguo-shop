/**
 * 渠道后台：上下架、单品改价、批量改价（WP6，设计 5.3、6.5.3 写函数表、7.2）。
 *
 * 【渠道能写的只有三列】retailCents、status、sortOrder（外加系统列 updatedBy、delistedReason 的清除）。
 * granted、supplyCents、min/maxRetailCents、tenantId、productId 永远不在任何 data 里——body 里塞了也只会被 zod 丢掉（T8）。
 *
 * 【并发：按 supplyVersion CAS】站长改进货价时 supplyVersion + 1（WP5）。渠道每次写售价 / 上架都
 * `updateMany where { id, tenantId, granted: true, supplyVersion: 读到的版本 }`，count≠1 即拒绝：
 * 否则「渠道按旧进货价校验通过 → 站长刚把进货价调到售价之上 → 渠道的写覆盖了自动下架」会留下售价 < 进货价的在售行。
 *
 * 【取整之后再校验】售价 ≥ 进货价、> 0、满足上下限都在取整**之后**判定（acg「0.5 元抹成 0」教训，W6-3）。
 *
 * 【批量改价的 previewToken】预览时把「[listing 内部 id, supplyVersion][] + 入参摘要 + 过期时间」用 AES-256-GCM 加密成令牌：
 *  · GCM 同时提供机密性与完整性：渠道既看不到内部 id 与版本号（设计 6.3「渠道侧不出现自增主键」），也改不了（改一个字节验签即失败）；
 *  · 密钥是进程启动时随机生成的，不落盘、不从任何配置派生：令牌只需要在「预览 → 提交」这几分钟内有效，
 *    服务重启后旧令牌失效，渠道重新预览即可。这样本文件不需要 import tenant/crypto（边界检查规则 3 不允许）。
 *  · 令牌绑定渠道、成员与入参摘要：拿别人的令牌、或预览后改了模式 / 数值再提交，一律验签失败 400。
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { mulBps, roundCents, yuanToCents, type RoundingMode } from '../tenant/math'
import { checkRetail, checkSellable } from '../tenant/sellable'
import { LIMITS, type NotSellableReason, type PartnerListingDTO } from '../tenant/types'
import { parsePublicNo } from '../tenant/public-no'
import { assertTenantId } from './_scope'
import { PARTNER_PRODUCT_SELECT } from './selects'
import { LISTING_WITH_KEY, partnerListingByNo, tenantPricing, unitEconomics, type ListingWithKey, type ProductRaw } from './catalog'
import { notFoundError, PartnerServiceError } from './orders'

export const PRICE_MODES = ['MARKUP_PCT', 'MARKUP_FIXED', 'FIXED'] as const
export type PriceMode = (typeof PRICE_MODES)[number]
export const ROUNDING_MODES = ['NONE', 'JIAO', 'YUAN', 'YUAN_UP'] as const satisfies readonly RoundingMode[]
/** 售价上限护栏：单件 100 万元。远超任何真实商品，只防手滑多打几个 0 */
const MAX_RETAIL_CENTS = 100_000_000
/** 加价百分比上限 1000%（=100000 bp） */
const MAX_MARKUP_BP = 100_000
const SORT_MAX = 99_999
/** previewToken 有效期 */
const PREVIEW_TTL_MS = 15 * 60_000

export type SkipReason = NotSellableReason | 'VERSION_CHANGED'

// ============================================================================
// 目标范围
// ============================================================================

export interface BatchScope {
  listingNos?: string[]
  categoryId?: number
  all?: boolean
}

interface Targets {
  rows: ListingWithKey[]
  /** 按 listingNos 指定但不属于本渠道已授权商品的编号（不存在 / 他站 / 未授权 三者不可区分） */
  missing: string[]
}

async function resolveTargets(tenantId: number, scope: BatchScope): Promise<Targets> {
  assertTenantId(tenantId)
  const given = [scope.listingNos !== undefined, scope.categoryId !== undefined, scope.all === true].filter(Boolean).length
  if (given !== 1) throw new PartnerServiceError(400, '请选择范围：勾选商品、按分类或全部（三选一）')
  const max = LIMITS.batchPriceMax

  if (scope.listingNos !== undefined) {
    if (scope.listingNos.length === 0) throw new PartnerServiceError(400, '请至少勾选一个商品')
    if (scope.listingNos.length > max) throw new PartnerServiceError(400, `单次最多 ${max} 个商品`)
    const nos: string[] = []
    const missing: string[] = []
    scope.listingNos.forEach((raw) => {
      const n = parsePublicNo(raw)
      if (n) {
        if (nos.indexOf(n) < 0) nos.push(n)
      } else missing.push(String(raw).slice(0, 16))
    })
    const rows = nos.length
      ? await prisma.tenantListing.findMany({ where: { tenantId, granted: true, publicNo: { in: nos } }, select: LISTING_WITH_KEY })
      : []
    const found = new Set(rows.map((r) => r.publicNo))
    nos.forEach((n) => {
      if (!found.has(n)) missing.push(n)
    })
    return { rows, missing }
  }

  const where =
    scope.categoryId !== undefined
      ? {
          tenantId,
          granted: true,
          productId: {
            in: (await prisma.product.findMany({ where: { categoryId: scope.categoryId }, select: PARTNER_PRODUCT_SELECT, take: 5000 })).map((p) => p.id),
          },
        }
      : { tenantId, granted: true }
  const count = await prisma.tenantListing.count({ where })
  if (count > max) throw new PartnerServiceError(400, `命中 ${count} 个商品，超过单次上限 ${max} 个，请缩小范围`)
  const rows = await prisma.tenantListing.findMany({ where, select: LISTING_WITH_KEY, orderBy: [{ sortOrder: 'asc' }, { productId: 'asc' }] })
  return { rows, missing: [] }
}

async function productsOf(rows: { productId: number }[]): Promise<Map<number, ProductRaw>> {
  const m = new Map<number, ProductRaw>()
  if (rows.length === 0) return m
  const ps = await prisma.product.findMany({ where: { id: { in: rows.map((r) => r.productId) } }, select: PARTNER_PRODUCT_SELECT })
  ps.forEach((p) => m.set(p.id, p))
  return m
}

// ============================================================================
// 单品：改价 / 上下架 / 排序
// ============================================================================

export interface ListingPatch {
  retailCents?: number
  status?: 0 | 1
  sortOrder?: number
}

/**
 * 单品修改。不存在 / 他站 / 未授权 → 404；售价不合规 → 400 { reason }；进货价刚被站长改动 → 409（刷新重试）。
 * 上架时按完整可售判定（店铺状态除外：DRAFT 期渠道主就要上架，开业前前台本来就只对预览用户可见）。
 */
export async function partnerSetListing(tenantId: number, userId: number, listingNo: string, patch: ListingPatch, req?: Request): Promise<PartnerListingDTO> {
  assertTenantId(tenantId)
  const no = parsePublicNo(listingNo)
  if (!no) throw notFoundError()
  const l = await prisma.tenantListing.findFirst({ where: { publicNo: no, tenantId, granted: true }, select: LISTING_WITH_KEY })
  if (!l) throw notFoundError()
  const p = await prisma.product.findUnique({ where: { id: l.productId }, select: PARTNER_PRODUCT_SELECT })
  if (!p) throw notFoundError()

  if (patch.sortOrder !== undefined && (!Number.isSafeInteger(patch.sortOrder) || patch.sortOrder < 0 || patch.sortOrder > SORT_MAX)) {
    throw new PartnerServiceError(400, `排序需为 0–${SORT_MAX} 的整数`)
  }
  const nextRetail = patch.retailCents !== undefined ? patch.retailCents : l.retailCents
  const nextStatus = patch.status !== undefined ? patch.status : l.status === 1 ? 1 : 0
  const nextSort = patch.sortOrder !== undefined ? patch.sortOrder : l.sortOrder

  if (patch.retailCents !== undefined) {
    if (patch.retailCents > MAX_RETAIL_CENTS) throw new PartnerServiceError(400, '售价过高', { reason: 'OUT_OF_RANGE' })
    const r = checkRetail(l, patch.retailCents)
    if (r) throw new PartnerServiceError(400, retailReasonText(r), { reason: r })
  }
  if (nextStatus === 1) {
    const r = checkSellable({ tenantStatus: 'ACTIVE', preview: false, listing: { ...l, retailCents: nextRetail, status: 1 }, productStatus: p.status })
    if (r) throw new PartnerServiceError(400, `无法上架：${retailReasonText(r)}`, { reason: r })
  }

  const retailChanged = nextRetail !== l.retailCents
  const statusChanged = nextStatus !== l.status
  const sortChanged = nextSort !== l.sortOrder
  if (retailChanged || statusChanged || sortChanged) {
    const action = retailChanged ? 'listing.price' : statusChanged ? 'listing.status' : 'listing.sort'
    const ok = await prisma.$transaction(async (tx) => {
      const r = await tx.tenantListing.updateMany({
        where: { id: l.id, tenantId, granted: true, supplyVersion: l.supplyVersion },
        data: {
          ...(retailChanged ? { retailCents: nextRetail } : {}),
          ...(statusChanged ? { status: nextStatus, delistedReason: null } : {}),
          ...(sortChanged ? { sortOrder: nextSort } : {}),
          updatedBy: userId,
        },
      })
      if (r.count !== 1) return false
      await writeAudit(tx, {
        actorKind: 'TENANT',
        actorUserId: userId,
        tenantId,
        action,
        targetType: 'listing',
        targetId: l.publicNo,
        diff: {
          listingNo: l.publicNo,
          productName: p.name,
          before: { retailCents: l.retailCents, status: l.status, sortOrder: l.sortOrder },
          after: { retailCents: nextRetail, status: nextStatus, sortOrder: nextSort },
        },
        req,
      })
      return true
    })
    if (!ok) throw new PartnerServiceError(409, '进货价或授权刚被站长调整，请刷新后重试')
  }
  const dto = await partnerListingByNo(tenantId, l.publicNo)
  if (!dto) throw notFoundError()
  return dto
}

export function retailReasonText(r: SkipReason): string {
  switch (r) {
    case 'NO_SUPPLY':
      return '站长尚未设置进货价'
    case 'NOT_PRICED':
      return '售价必须大于 0'
    case 'BELOW_SUPPLY':
      return '售价不能低于进货价'
    case 'OUT_OF_RANGE':
      return '售价超出站长设定的范围'
    case 'NOT_GRANTED':
      return '该商品已不在授权范围'
    case 'PRODUCT_OFF':
      return '商品已停售'
    case 'NOT_LISTED':
      return '商品不在本店商品池'
    case 'TENANT_INACTIVE':
      return '店铺未营业'
    case 'VERSION_CHANGED':
      return '进货价已变动，请重新预览'
    default:
      return '不可售'
  }
}

// ============================================================================
// 批量上下架
// ============================================================================

export async function partnerBatchStatus(
  tenantId: number,
  userId: number,
  input: BatchScope & { status: 0 | 1 },
  req?: Request,
): Promise<{ updated: number; rejected: { listingNo: string; reason: SkipReason }[] }> {
  const { rows, missing } = await resolveTargets(tenantId, input)
  const rejected: { listingNo: string; reason: SkipReason }[] = missing.map((n) => ({ listingNo: n, reason: 'NOT_LISTED' as const }))
  const products = await productsOf(rows)

  const candidates: ListingWithKey[] = []
  rows.forEach((l) => {
    if (input.status === 1) {
      const p = products.get(l.productId)
      const r = checkSellable({ tenantStatus: 'ACTIVE', preview: false, listing: { ...l, status: 1 }, productStatus: p ? p.status : 0 })
      if (r) {
        rejected.push({ listingNo: l.publicNo, reason: r })
        return
      }
    }
    if (l.status !== input.status) candidates.push(l)
  })

  let updated = 0
  if (candidates.length) {
    updated = await prisma.$transaction(
      async (tx) => {
        let n = 0
        for (const l of candidates) {
          // 上架逐行按 supplyVersion CAS（校验与写入之间进货价被改 → 这一行跳过）；下架无需校验，但同样逐行写，便于计数
          const r = await tx.tenantListing.updateMany({
            where: { id: l.id, tenantId, granted: true, ...(input.status === 1 ? { supplyVersion: l.supplyVersion } : {}) },
            data: { status: input.status, delistedReason: null, updatedBy: userId },
          })
          if (r.count === 1) n++
          else rejected.push({ listingNo: l.publicNo, reason: 'VERSION_CHANGED' })
        }
        await writeAudit(tx, {
          actorKind: 'TENANT',
          actorUserId: userId,
          tenantId,
          action: 'listing.batch_status',
          targetType: 'listing',
          targetId: `batch:${n}`,
          diff: { status: input.status, updated: n, listingNos: candidates.map((l) => l.publicNo) },
          req,
        })
        return n
      },
      { timeout: 20_000 },
    )
  }
  return { updated, rejected }
}

// ============================================================================
// 批量改价：预览 / 提交
// ============================================================================

export interface PriceRuleInput extends BatchScope {
  mode: PriceMode
  /** MARKUP_PCT：百分比（「12.5」= 12.5%）；MARKUP_FIXED / FIXED：元。最多两位小数 */
  value: string
  rounding: RoundingMode
}

interface ParsedRule {
  mode: PriceMode
  /** MARKUP_PCT 时为 bp，其余为分 */
  n: number
  rounding: RoundingMode
}

function parseRule(input: PriceRuleInput): ParsedRule {
  if (!(PRICE_MODES as readonly string[]).includes(input.mode)) throw new PartnerServiceError(400, '改价方式不正确')
  if (!(ROUNDING_MODES as readonly string[]).includes(input.rounding)) throw new PartnerServiceError(400, '取整方式不正确')
  let n: number
  try {
    // 「12.5」→ 1250：百分比字符串按两位小数解析，正好就是 bp；元 → 分同理
    n = yuanToCents(input.value)
  } catch {
    throw new PartnerServiceError(400, '数值格式不正确（最多两位小数，不能为负）')
  }
  if (input.mode === 'MARKUP_PCT' && n > MAX_MARKUP_BP) throw new PartnerServiceError(400, '加价比例最多 1000%')
  if (input.mode !== 'MARKUP_PCT' && n > MAX_RETAIL_CENTS) throw new PartnerServiceError(400, '金额过大')
  if (input.mode === 'FIXED' && n <= 0) throw new PartnerServiceError(400, '一口价必须大于 0')
  return { mode: input.mode, n, rounding: input.rounding }
}

/** 永远以**当前**进货价为基准计算（设计 7.2），取整后再判定 */
export function computeRetail(rule: ParsedRule, l: { supplyCents: number | null; minRetailCents: number | null; maxRetailCents: number | null }): {
  newRetailCents: number | null
  reject: NotSellableReason | null
} {
  if (rule.mode !== 'FIXED' && (l.supplyCents == null || l.supplyCents <= 0)) return { newRetailCents: null, reject: 'NO_SUPPLY' }
  const s = l.supplyCents ?? 0
  const raw = rule.mode === 'MARKUP_PCT' ? s + mulBps(s, rule.n) : rule.mode === 'MARKUP_FIXED' ? s + rule.n : rule.n
  const v = roundCents(raw, rule.rounding)
  if (v > MAX_RETAIL_CENTS) return { newRetailCents: v, reject: 'OUT_OF_RANGE' }
  return { newRetailCents: v, reject: checkRetail(l, v) }
}

/** 入参摘要：令牌只对「同一范围 + 同一规则」有效 */
function ruleDigest(input: PriceRuleInput): string {
  const scope = input.listingNos
    ? { listingNos: input.listingNos.map((x) => String(x).trim().toUpperCase()).sort() }
    : input.categoryId !== undefined
      ? { categoryId: input.categoryId }
      : { all: true }
  return createHash('sha256').update(JSON.stringify({ scope, mode: input.mode, value: String(input.value).trim(), rounding: input.rounding })).digest('base64url')
}

// —— 令牌加解密（见文件头）——
/**
 * 密钥挂在 globalThis 上而不是模块变量：preview 与 commit 是两个不同的路由入口，Next 构建 / 开发热更新时
 * 同一个模块可能被求值不止一次，模块级 randomBytes 会各生成一把，commit 就验不过 preview 签的令牌。
 * 挂在进程全局上保证同一进程只有一把（与 src/lib/db.ts 的 prisma 单例同一做法）。
 */
const G = globalThis as unknown as { __partnerPreviewTokenKey?: Buffer }
const TOKEN_KEY: Buffer = G.__partnerPreviewTokenKey ?? (G.__partnerPreviewTokenKey = randomBytes(32))

interface TokenBody {
  v: 1
  t: number
  u: number
  e: number
  h: string
  r: [number, number][]
}

function sealToken(body: TokenBody): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', TOKEN_KEY, iv)
  const enc = Buffer.concat([c.update(JSON.stringify(body), 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url')
}

function openToken(token: string): TokenBody | null {
  try {
    if (typeof token !== 'string' || token.length < 40 || token.length > 20_000) return null
    const buf = Buffer.from(token, 'base64url')
    const d = createDecipheriv('aes-256-gcm', TOKEN_KEY, buf.subarray(0, 12))
    d.setAuthTag(buf.subarray(12, 28))
    const plain = Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8')
    const b = JSON.parse(plain) as TokenBody
    if (b.v !== 1 || !Array.isArray(b.r)) return null
    return b
  } catch {
    return null
  }
}

export interface PreviewRow {
  listingNo: string
  name: string
  supplyCents: number | null
  oldRetailCents: number | null
  newRetailCents: number | null
  unitBalanceCents: number | null
  unitPayoutCents: number | null
  reject?: SkipReason
}

export async function partnerBatchPricePreview(
  tenantId: number,
  userId: number,
  input: PriceRuleInput,
): Promise<{ rows: PreviewRow[]; previewToken: string }> {
  const rule = parseRule(input)
  const { rows, missing } = await resolveTargets(tenantId, input)
  const [products, t] = await Promise.all([productsOf(rows), tenantPricing(tenantId)])
  const out: PreviewRow[] = rows.map((l) => {
    const { newRetailCents, reject } = computeRetail(rule, l)
    const econ = reject || newRetailCents == null ? { unitBalanceCents: null, unitPayoutCents: null } : unitEconomics(newRetailCents, l.supplyCents, t.feeRateBp)
    const row: PreviewRow = {
      listingNo: l.publicNo,
      name: products.get(l.productId)?.name ?? '',
      supplyCents: l.supplyCents,
      oldRetailCents: l.retailCents,
      newRetailCents,
      unitBalanceCents: econ.unitBalanceCents,
      unitPayoutCents: econ.unitPayoutCents,
    }
    if (reject) row.reject = reject
    return row
  })
  missing.forEach((n) =>
    out.push({ listingNo: n, name: '', supplyCents: null, oldRetailCents: null, newRetailCents: null, unitBalanceCents: null, unitPayoutCents: null, reject: 'NOT_LISTED' }),
  )
  const previewToken = sealToken({ v: 1, t: tenantId, u: userId, e: Date.now() + PREVIEW_TTL_MS, h: ruleDigest(input), r: rows.map((l) => [l.id, l.supplyVersion]) })
  return { rows: out, previewToken }
}

/**
 * 提交：验签（渠道、成员、入参摘要、有效期）→ 逐行按令牌里的 supplyVersion CAS。版本不符 = VERSION_CHANGED 跳过（T25），
 * 其余按当前进货价重算、取整、校验，不合规的跳过并给原因；一个事务 + 一条审计。
 */
export async function partnerBatchPriceCommit(
  tenantId: number,
  userId: number,
  input: PriceRuleInput & { previewToken: string },
  req?: Request,
): Promise<{ updated: number; skipped: { listingNo: string; reason: SkipReason }[] }> {
  assertTenantId(tenantId)
  const rule = parseRule(input)
  const tok = openToken(input.previewToken)
  if (!tok || tok.t !== tenantId || tok.u !== userId || tok.h !== ruleDigest(input)) {
    throw new PartnerServiceError(400, '预览已失效或与提交内容不一致，请重新预览')
  }
  if (tok.e < Date.now()) throw new PartnerServiceError(400, '预览已过期，请重新预览')
  if (tok.r.length > LIMITS.batchPriceMax) throw new PartnerServiceError(400, `单次最多 ${LIMITS.batchPriceMax} 个商品`)

  const ids = tok.r.map((x) => x[0])
  const current = ids.length ? await prisma.tenantListing.findMany({ where: { tenantId, id: { in: ids } }, select: LISTING_WITH_KEY }) : []
  const byId = new Map<number, ListingWithKey>()
  current.forEach((l) => byId.set(l.id, l))
  const products = await productsOf(current)

  const skipped: { listingNo: string; reason: SkipReason }[] = []
  const plan: { l: ListingWithKey; ver: number; newRetailCents: number }[] = []
  tok.r.forEach(([id, ver]) => {
    const l = byId.get(id)
    if (!l) return // 行被删（正常流程不删上架行）：没有可展示的编号，直接略过
    if (!l.granted) return void skipped.push({ listingNo: l.publicNo, reason: 'NOT_GRANTED' })
    if (l.supplyVersion !== ver) return void skipped.push({ listingNo: l.publicNo, reason: 'VERSION_CHANGED' })
    const { newRetailCents, reject } = computeRetail(rule, l)
    if (reject || newRetailCents == null) return void skipped.push({ listingNo: l.publicNo, reason: reject ?? 'NOT_PRICED' })
    plan.push({ l, ver, newRetailCents })
  })

  const updated = await prisma.$transaction(
    async (tx) => {
      let n = 0
      const changed: { listingNo: string; productName: string; oldRetailCents: number | null; newRetailCents: number }[] = []
      for (const it of plan) {
        const r = await tx.tenantListing.updateMany({
          where: { id: it.l.id, tenantId, granted: true, supplyVersion: it.ver },
          data: { retailCents: it.newRetailCents, updatedBy: userId },
        })
        if (r.count === 1) {
          n++
          changed.push({ listingNo: it.l.publicNo, productName: products.get(it.l.productId)?.name ?? '', oldRetailCents: it.l.retailCents, newRetailCents: it.newRetailCents })
        } else skipped.push({ listingNo: it.l.publicNo, reason: 'VERSION_CHANGED' })
      }
      await writeAudit(tx, {
        actorKind: 'TENANT',
        actorUserId: userId,
        tenantId,
        action: 'listing.batch',
        targetType: 'listing',
        targetId: `batch:${n}`,
        diff: { mode: rule.mode, value: String(input.value).trim(), rounding: rule.rounding, updated: n, skipped: skipped.length, rows: changed },
        req,
      })
      return n
    },
    { timeout: 20_000 },
  )
  return { updated, skipped }
}
