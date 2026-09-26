/**
 * 超管：商品授权与进货价（WP5，设计 5.3、7.1、7.3）。逐个（setListingAdmin）与批量（previewSupply → commitSupply）。
 *
 * 【只给超管】本文件读卡密成本、写 granted / supplyCents / 售价上下限——渠道层绝不能 import（边界检查规则 3 禁止清单）。
 * 渠道能写的只有 retailCents / status / sortOrder（WP6 partner-services/listings.ts）。
 *
 * 【并发：supplyVersion】每次改进货价 supplyVersion + 1。渠道改售价 / 上架按它 CAS（WP6），站长这边也按它 CAS：
 *  · 批量：预览时记下每行的 [listingId, supplyVersion]，提交时 `updateMany where { id, tenantId, supplyVersion }`，
 *    版本不符（另一个窗口刚改过）的行跳过并返回 VERSION_CHANGED（W5-2）；
 *  · 渠道在预览之后改了售价不影响（售价不动版本号；自动下架按提交时的最新售价判断）。
 *  · 但也正因为渠道改售价 / 上架不动版本号，只靠版本 CAS 会漏掉「读到之后、写入之前渠道刚上架 / 刚改价」：
 *    commitSupply 与 setListingAdmin 在事务第一条语句 `SELECT … FOR UPDATE` 锁住上架行，再读、判定（自动下架）、写；
 *    setListingAdmin 只写真正变了的字段，并且改售价上下限 / 授权也让版本 +1（渠道基于旧前提的上架按 CAS 失败）。
 *
 * 【永远从基准重算】（acg #874 滚雪球）批量规则每次都从「成本 / 主站价 / 一口价」算，不在当前进货价上叠加；
 * 同一规则提交多少次结果都一样。基准快照进 supplyBaseKind / supplyBaseCents（仅超管可见：COST 基准就是成本）。
 *
 * 【取整之后 ≤ 0 不写】该行跳过（NON_POSITIVE），绝不写入 0；低于成本只标红（marginCents < 0），站长可能有意亏本引流。
 *
 * 【自动下架】进货价调到高于该渠道当前售价的上架行，同一事务 status=0、delistedReason='SUPPLY_ABOVE_RETAIL'，
 * 按渠道合并发 AUTO_DELISTED；只改价未下架的合并发 SUPPLY_CHANGED（设计 7.3）。通知正文只含新旧进货价。
 *
 * 【审计 publicDiff】（设计 5.8）listing.supply / listing.batch_supply 只含 [{ listingNo, productName, oldSupplyCents, newSupplyCents }]；
 * 规则、基准、成本、毛利、预览行只进 diff（仅超管）。未授权的上架行渠道看不到，也不进 publicDiff 与通知。
 */
import { createHash, createHmac, hkdfSync, timingSafeEqual } from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { getJwtSecret } from '../jwt-secret'
import { mulBps, roundCents, type RoundingMode } from './math'
import { emitTenantNotice } from './notice'
import { newPublicNo } from './public-no'
import { checkRetail, checkSellable } from './sellable'
import { LIMITS } from './types'
import type { TenantNoticeKind } from './types'
import { TenantAdminError, decToCents } from './admin-tenants'
import { isTxAbortingError } from './ledger'

type Tx = Prisma.TransactionClient

/**
 * 未授权（渠道看不见）上架行的审计 targetType。渠道操作日志按它整行排除（partner-services/audit.ts 的 HIDDEN_TARGET_TYPES），
 * 超管审计照常可查。字面量与那边保持一致——渠道层不能 import 本文件（边界规则 3），所以两处各写一份。
 */
export const HIDDEN_LISTING_TARGET = 'listing_hidden'

export type SupplyBase = 'COST' | 'MAIN_PRICE' | 'MANUAL'
export type SupplyRule =
  | { base: 'COST'; mode: 'PCT' | 'ADD'; value: number }
  | { base: 'MAIN_PRICE'; mode: 'PCT' | 'SUB'; value: number }
  | { base: 'MANUAL'; cents: number }

export interface SupplyPreviewRow {
  productId: number
  productName: string
  oldSupplyCents: number | null
  newSupplyCents: number | null
  baseCents: number | null
  costCents: number | null
  marginCents: number | null
  retailCents: number | null
  willDelist: boolean
  skipReason?: 'NO_COST' | 'NON_POSITIVE'
}

export type SupplySkipReason = 'VERSION_CHANGED' | 'PRODUCT_OFF'

/**
 * 规则取值的单位（全部整数）：
 *  · COST + PCT：加价比例，bp（280 = 2.8%）；COST + ADD：加价金额，分
 *  · MAIN_PRICE + PCT：主站价的比例，bp（8500 = 85%）；MAIN_PRICE + SUB：减去的金额，分
 *  · MANUAL：一口价，分
 */
export const SUPPLY_RULE_LIMITS = Object.freeze({ costPctMaxBp: 100_000, mainPctMaxBp: 20_000, amountMaxCents: 100_000_000 })
/** 预览令牌有效期 */
const PREVIEW_TTL_MS = 30 * 60_000
const MAX_SUPPLY_CENTS = 100_000_000

function assertRule(rule: SupplyRule): void {
  const bad = (m: string) => {
    throw new TenantAdminError(400, m)
  }
  if (!rule || typeof rule !== 'object') bad('规则不能为空')
  if (rule.base === 'MANUAL') {
    if (!Number.isSafeInteger(rule.cents) || rule.cents <= 0 || rule.cents > SUPPLY_RULE_LIMITS.amountMaxCents) bad('一口价必须是大于 0 的金额')
    return
  }
  if (rule.base === 'COST') {
    if (rule.mode !== 'PCT' && rule.mode !== 'ADD') bad('按成本加价只支持 加百分比 / 加固定金额')
    const max = rule.mode === 'PCT' ? SUPPLY_RULE_LIMITS.costPctMaxBp : SUPPLY_RULE_LIMITS.amountMaxCents
    if (!Number.isSafeInteger(rule.value) || rule.value < 0 || rule.value > max) bad('加价数值超出范围')
    return
  }
  if (rule.base === 'MAIN_PRICE') {
    if (rule.mode !== 'PCT' && rule.mode !== 'SUB') bad('按主站售价只支持 乘百分比 / 减固定金额')
    const max = rule.mode === 'PCT' ? SUPPLY_RULE_LIMITS.mainPctMaxBp : SUPPLY_RULE_LIMITS.amountMaxCents
    const min = rule.mode === 'PCT' ? 1 : 0
    if (!Number.isSafeInteger(rule.value) || rule.value < min || rule.value > max) bad('比例 / 金额超出范围')
    return
  }
  bad('未知的基准')
}

const ROUNDINGS: ReadonlySet<string> = new Set(['NONE', 'JIAO', 'YUAN', 'YUAN_UP'])

/**
 * 纯函数：按规则从基准算进货价（取整之后）。返回 null = 不写（NO_COST / NON_POSITIVE 由调用方判定原因）。
 * 导出给 scripts/check-* 与 itest 断言。
 */
export function applySupplyRule(rule: SupplyRule, base: { costCents: number | null; mainPriceCents: number }, rounding: RoundingMode): { baseCents: number | null; cents: number | null; reason?: 'NO_COST' | 'NON_POSITIVE' } {
  let baseCents: number | null
  let raw: number
  if (rule.base === 'MANUAL') {
    baseCents = null
    raw = rule.cents
  } else if (rule.base === 'COST') {
    baseCents = base.costCents
    if (baseCents == null || baseCents <= 0) return { baseCents: null, cents: null, reason: 'NO_COST' }
    raw = rule.mode === 'PCT' ? mulBps(baseCents, 10_000 + rule.value) : baseCents + rule.value
  } else {
    baseCents = base.mainPriceCents
    raw = rule.mode === 'PCT' ? mulBps(baseCents, rule.value) : baseCents - rule.value
  }
  if (!Number.isSafeInteger(raw) || raw <= 0) return { baseCents, cents: null, reason: 'NON_POSITIVE' }
  const cents = roundCents(raw, rounding)
  if (cents <= 0) return { baseCents, cents: null, reason: 'NON_POSITIVE' }
  if (cents > MAX_SUPPLY_CENTS) return { baseCents, cents: null, reason: 'NON_POSITIVE' }
  return { baseCents, cents }
}

// =====================================================================================
// 成本基准（设计 7.1：未售卡加权平均 cost；没有未售卡取最近一批导入的 cost；都没有 → 无成本数据）
// =====================================================================================

/**
 * cost ≤ 0 视为「未知」：历史卡回填为 0（schema 注释），把 0 当成本会算出一个 0 元进货价。
 * 平均值按分计算、四舍五入到分（Σ 分 / 张数）。
 */
export async function costBasisCents(productIds: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>()
  const ids = Array.from(new Set(productIds.filter((n) => Number.isSafeInteger(n) && n > 0)))
  if (!ids.length) return out
  const unsold = await prisma.$queryRaw<{ pid: number; s: unknown; n: unknown }[]>`
    SELECT product_id AS pid, SUM(ROUND(cost * 100)) AS s, COUNT(*) AS n
      FROM card_keys
     WHERE product_id IN (${Prisma.join(ids)}) AND status = 'UNUSED' AND cost IS NOT NULL AND cost > 0
     GROUP BY product_id`
  for (const r of unsold) {
    const n = Number(r.n)
    if (n > 0) out.set(Number(r.pid), Math.floor((2 * Number(r.s) + n) / (2 * n)))
  }
  for (const pid of ids) {
    if (out.has(pid)) continue
    const last = await prisma.cardKey.findFirst({
      where: { productId: pid, cost: { gt: 0 } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { cost: true, batch: true },
    })
    if (!last) continue
    if (last.batch) {
      const b = await prisma.$queryRaw<{ s: unknown; n: unknown }[]>`
        SELECT SUM(ROUND(cost * 100)) AS s, COUNT(*) AS n FROM card_keys
         WHERE product_id = ${pid} AND batch = ${last.batch} AND cost IS NOT NULL AND cost > 0`
      const n = Number(b[0]?.n ?? 0)
      if (n > 0) {
        out.set(pid, Math.floor((2 * Number(b[0].s) + n) / (2 * n)))
        continue
      }
    }
    const c = decToCents(last.cost)
    if (c && c > 0) out.set(pid, c)
  }
  return out
}

// =====================================================================================
// 预览令牌：HMAC 签名（超管侧，内容本身可见无妨；只防篡改——改一个字节提交即 400）
// =====================================================================================

function tokenKey(): Buffer {
  const s = getJwtSecret()
  if (!s) throw new Error('[supply-pricing] JWT_SECRET 未配置')
  // 与 tenant/crypto 的四个用途隔离的独立子密钥（info 不同），拿到这里的签名推不出别的密钥
  return Buffer.from(hkdfSync('sha256', Buffer.from(s, 'utf8'), Buffer.from('bigolab-supply-preview-v1', 'utf8'), Buffer.from('tenant:supply-preview', 'utf8'), 32))
}

/** 令牌里的一行：[productId, listingId（0 = 预览时还没有上架行）, supplyVersion（-1 = 无）, 新进货价, 基准值] */
type TokenRow = [number, number, number, number, number | null]
interface TokenBody {
  v: 1
  t: number
  kind: SupplyBase
  rule: SupplyRule
  rd: RoundingMode
  exp: number
  rows: TokenRow[]
}

function signToken(body: TokenBody): string {
  const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url')
  const mac = createHmac('sha256', tokenKey()).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

function openToken(token: string, tenantId: number): TokenBody {
  const bad = () => new TenantAdminError(400, '预览已失效，请重新预览')
  if (typeof token !== 'string' || token.length > 200_000) throw bad()
  const dot = token.lastIndexOf('.')
  if (dot <= 0) throw bad()
  const payload = token.slice(0, dot)
  const mac = Buffer.from(token.slice(dot + 1), 'base64url')
  const want = createHmac('sha256', tokenKey()).update(payload).digest()
  if (mac.length !== want.length || !timingSafeEqual(mac, want)) throw bad()
  let body: TokenBody
  try {
    body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenBody
  } catch {
    throw bad()
  }
  if (body.v !== 1 || body.t !== tenantId || !Array.isArray(body.rows) || typeof body.exp !== 'number' || body.exp < Date.now()) throw bad()
  return body
}

// =====================================================================================
// 批量：预览
// =====================================================================================

export interface SupplyScope {
  productIds?: number[]
  categoryId?: number
  all?: boolean
}

async function channelTenant(tenantId: number) {
  if (!Number.isInteger(tenantId) || tenantId < 2) throw new TenantAdminError(404, '渠道不存在')
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, kind: true, code: true, feeRateBp: true, status: true } })
  if (!t || t.kind !== 'CHANNEL') throw new TenantAdminError(404, '渠道不存在')
  return t
}

async function scopeProducts(scope: SupplyScope) {
  const given = [scope.productIds !== undefined, scope.categoryId !== undefined, scope.all === true].filter(Boolean).length
  if (given !== 1) throw new TenantAdminError(400, '请选择范围：勾选商品、按分类或全部在售商品（三选一）')
  const max = LIMITS.batchSupplyMax
  const select = { id: true, name: true, price: true, status: true, categoryId: true } as const
  let where: Prisma.ProductWhereInput
  if (scope.productIds !== undefined) {
    const ids = Array.from(new Set(scope.productIds))
    if (!ids.length) throw new TenantAdminError(400, '请至少勾选一个商品')
    if (ids.length > max || ids.some((n) => !Number.isSafeInteger(n) || n <= 0)) throw new TenantAdminError(400, `单次最多 ${max} 个商品`)
    where = { id: { in: ids } }
  } else if (scope.categoryId !== undefined) {
    // 分类与「全部」只取在售商品（设计 5.3：授权只对在售商品；批量范围「全部在售商品」同理）
    where = { categoryId: scope.categoryId, status: 1 }
  } else {
    where = { status: 1 }
  }
  const n = await prisma.product.count({ where })
  if (n > max) throw new TenantAdminError(400, `命中 ${n} 个商品，超过单次上限 ${max}，请缩小范围`)
  return prisma.product.findMany({ where, select, orderBy: { id: 'asc' } })
}

export async function previewSupply(
  tenantId: number,
  scope: SupplyScope,
  rule: SupplyRule,
  rounding: RoundingMode,
): Promise<{ rows: SupplyPreviewRow[]; previewToken: string }> {
  assertRule(rule)
  if (!ROUNDINGS.has(rounding)) throw new TenantAdminError(400, '取整方式不对')
  const t = await channelTenant(tenantId)
  const products = await scopeProducts(scope)
  if (!products.length) throw new TenantAdminError(400, '范围内没有商品')
  const pids = products.map((p) => p.id)
  const listings = await prisma.tenantListing.findMany({
    where: { tenantId, productId: { in: pids } },
    select: { id: true, productId: true, supplyCents: true, supplyVersion: true, retailCents: true, status: true },
  })
  const lOf = new Map(listings.map((l) => [l.productId, l]))
  const costs = await costBasisCents(pids)

  const rows: SupplyPreviewRow[] = []
  const tokenRows: TokenRow[] = []
  for (const p of products) {
    const l = lOf.get(p.id)
    const mainPriceCents = decToCents(p.price) ?? 0
    const costCents = costs.get(p.id) ?? null
    const r = applySupplyRule(rule, { costCents, mainPriceCents }, rounding)
    const retail = l?.retailCents ?? null
    const row: SupplyPreviewRow = {
      productId: p.id,
      productName: p.name,
      oldSupplyCents: l?.supplyCents ?? null,
      newSupplyCents: r.cents,
      baseCents: r.baseCents,
      costCents,
      // 毛利预估（仅超管）= 进货价 − 成本 + 手续费估算（按渠道当前费率 × 当前售价；没定价按 0）
      marginCents: r.cents != null && costCents != null ? r.cents - costCents + (retail != null ? mulBps(retail, t.feeRateBp) : 0) : null,
      retailCents: retail,
      willDelist: r.cents != null && !!l && l.status === 1 && retail != null && retail < r.cents,
    }
    if (r.reason) row.skipReason = r.reason
    rows.push(row)
    if (r.cents != null) tokenRows.push([p.id, l?.id ?? 0, l ? l.supplyVersion : -1, r.cents, r.baseCents])
  }
  const previewToken = signToken({ v: 1, t: tenantId, kind: rule.base, rule, rd: rounding, exp: Date.now() + PREVIEW_TTL_MS, rows: tokenRows })
  return { rows, previewToken }
}

// =====================================================================================
// 批量：提交
// =====================================================================================

const yuan = (c: number | null) => (c == null ? '未设' : `¥${(c / 100).toFixed(2)}`)

interface PublicSupplyRow {
  listingNo: string
  productName: string
  oldSupplyCents: number | null
  newSupplyCents: number
}

/** 按渠道合并的一条通知（正文只含新旧进货价，设计 5.8 / 7.3） */
async function emitSupplyNotices(tx: Tx, tenantId: number, dedupe: string, changed: PublicSupplyRow[], delisted: PublicSupplyRow[]): Promise<void> {
  const body = (rows: PublicSupplyRow[]) => {
    const lines = rows.slice(0, 8).map((r) => `${r.productName}：${yuan(r.oldSupplyCents)} → ${yuan(r.newSupplyCents)}`)
    if (rows.length > 8) lines.push(`等共 ${rows.length} 个商品`)
    return lines.join('；')
  }
  const emit = (kind: TenantNoticeKind, title: string, rows: PublicSupplyRow[], suffix: string) =>
    emitTenantNotice(tx, {
      tenantId,
      kind,
      title,
      body: body(rows),
      refType: 'listing',
      refKey: rows.length === 1 ? rows[0].listingNo : undefined,
      dedupeKey: `${dedupe}:${suffix}`,
    })
  if (changed.length) await emit('SUPPLY_CHANGED', `平台调整了 ${changed.length} 个商品的进货价`, changed, 'c')
  if (delisted.length) await emit('AUTO_DELISTED', `${delisted.length} 个商品因进货价高于售价已自动下架`, delisted, 'd')
}

export interface CommitSupplyResult {
  updated: number
  skipped: { productId: number; reason: SupplySkipReason }[]
  delisted: number
  /** 目标值与现值相同、无需改动的行（重复提交同一份预览时全部落在这里：幂等） */
  unchanged: number
  granted: number
}

/**
 * 提交批量进货价。一个事务，逐行 CAS supplyVersion；令牌只能用在签发它的渠道上。
 * grant=true 时顺带授权：只对 Product.status=1 的商品（其余行整行跳过并返回 PRODUCT_OFF）。
 * 同一份预览重复提交：第一次写入并把版本 +1；第二次 CAS 不中，但现值已等于目标值 → 计入 unchanged，数据库不变（W5-2 幂等）。
 */
export async function commitSupply(tenantId: number, previewToken: string, adminId: number, grant?: boolean): Promise<CommitSupplyResult> {
  const t = await channelTenant(tenantId)
  const body = openToken(previewToken, tenantId)
  const dedupe = `sup:${createHash('sha256').update(previewToken).digest('hex').slice(0, 24)}`
  if (body.rows.length > LIMITS.batchSupplyMax) throw new TenantAdminError(400, `单次最多 ${LIMITS.batchSupplyMax} 个商品`)
  const kind = body.kind

  return prisma.$transaction(
    async (tx) => {
      // 【先锁预览里已有的上架行，且必须是事务里的第一条语句】渠道改售价 / 上架不递增 supplyVersion，
      // 版本 CAS 发现不了「预览之后渠道刚上架 / 刚改售价」——下面的自动下架判断必须基于锁住之后的最新 status / retailCents，
      // 否则会漏掉「在售且售价低于新进货价」的行（A2）。按主键锁（只锁记录、不加间隙锁）；预览时还没有上架行（listingId=0）
      // 的不锁：新建的行默认未上架，与渠道并发新建由唯一约束兜底。可重复读的快照在第一次普通读时建立，所以锁必须先于任何普通读。
      const lockIds = Array.from(new Set(body.rows.map((r) => r[1]).filter((v) => Number.isSafeInteger(v) && v > 0)))
      if (lockIds.length) {
        await tx.$queryRaw`SELECT id FROM tenant_listings WHERE id IN (${Prisma.join(lockIds)}) AND tenant_id = ${tenantId} ORDER BY id FOR UPDATE`
      }
      const pids = body.rows.map((r) => r[0])
      const products = await tx.product.findMany({ where: { id: { in: pids } }, select: { id: true, name: true, status: true } })
      const pOf = new Map(products.map((p) => [p.id, p]))
      const res: CommitSupplyResult = { updated: 0, skipped: [], delisted: 0, unchanged: 0, granted: 0 }
      const publicChanged: PublicSupplyRow[] = []
      const publicDelisted: PublicSupplyRow[] = []
      const publicGranted: { listingNo: string; productName: string; granted: true }[] = []
      const adminRows: unknown[] = []
      // 本次真正改到的行里渠道看得见的条数（已授权或本次授权）。审计 targetId 只能用它，不能用 res.updated：
      // res.updated 含未授权行，渠道拿「batch:N」减去 publicDiff 行数就知道有几条隐藏上架行被定过价（终审隔离 #1）
      let visibleUpdated = 0

      for (const [productId, listingId, version, cents, baseCents] of body.rows) {
        const p = pOf.get(productId)
        if (!p) {
          res.skipped.push({ productId, reason: 'PRODUCT_OFF' })
          continue
        }
        if (grant && p.status !== 1) {
          res.skipped.push({ productId, reason: 'PRODUCT_OFF' })
          continue
        }
        const cur = await tx.tenantListing.findUnique({
          where: { tenantId_productId: { tenantId, productId } },
          select: { id: true, publicNo: true, supplyCents: true, supplyVersion: true, supplyBaseKind: true, supplyBaseCents: true, retailCents: true, status: true, granted: true, delistedReason: true },
        })

        // —— 预览时还没有上架行：新建（并发下别人先建了 → 按版本变化处理）——
        if (listingId === 0) {
          if (cur) {
            if (cur.supplyCents === cents && (!grant || cur.granted)) res.unchanged++
            else res.skipped.push({ productId, reason: 'VERSION_CHANGED' })
            continue
          }
          let created: { publicNo: string } | null = null
          for (let i = 0; i < 3 && !created; i++) {
            const no = newPublicNo()
            const r = await tx.tenantListing.createMany({
              data: [{ publicNo: no, tenantId, productId, granted: grant === true, supplyCents: cents, supplyVersion: 1, supplyBaseKind: kind, supplyBaseCents: baseCents, updatedBy: adminId }],
              skipDuplicates: true,
            })
            if (r.count === 1) created = { publicNo: no }
            else if (await tx.tenantListing.count({ where: { tenantId, productId } })) break
          }
          if (!created) {
            res.skipped.push({ productId, reason: 'VERSION_CHANGED' })
            continue
          }
          res.updated++
          adminRows.push({ productId, listingNo: created.publicNo, old: null, new: cents, base: baseCents, created: true, granted: grant === true })
          if (grant) {
            visibleUpdated++
            res.granted++
            publicGranted.push({ listingNo: created.publicNo, productName: p.name, granted: true })
            publicChanged.push({ listingNo: created.publicNo, productName: p.name, oldSupplyCents: null, newSupplyCents: cents })
          }
          continue
        }

        if (!cur || cur.id !== listingId) {
          res.skipped.push({ productId, reason: 'VERSION_CHANGED' })
          continue
        }
        const needGrant = grant === true && !cur.granted
        if (cur.supplyVersion !== version) {
          // 版本变了：若现值已经就是目标值（同一份预览第二次提交），算作无需改动；否则跳过让站长重新预览
          if (cur.supplyCents === cents && cur.supplyBaseKind === kind && !needGrant) res.unchanged++
          else res.skipped.push({ productId, reason: 'VERSION_CHANGED' })
          continue
        }
        const supplyChanged = cur.supplyCents !== cents
        if (!supplyChanged && !needGrant) {
          // 进货价不变：只刷新基准快照（不动版本号，免得无谓地让渠道手里的改价预览失效）
          if (cur.supplyBaseKind !== kind || cur.supplyBaseCents !== baseCents) {
            await tx.tenantListing.updateMany({ where: { id: cur.id, tenantId, supplyVersion: version }, data: { supplyBaseKind: kind, supplyBaseCents: baseCents, updatedBy: adminId } })
          }
          res.unchanged++
          continue
        }
        const delist = supplyChanged && cur.status === 1 && cur.retailCents != null && cur.retailCents < cents
        const data: Prisma.TenantListingUpdateManyMutationInput = {
          supplyCents: cents,
          supplyBaseKind: kind,
          supplyBaseCents: baseCents,
          updatedBy: adminId,
          ...(supplyChanged ? { supplyVersion: { increment: 1 } } : {}),
          ...(delist ? { status: 0, delistedReason: 'SUPPLY_ABOVE_RETAIL' } : {}),
          ...(needGrant ? { granted: true, ...(cur.delistedReason === 'REVOKED' ? { delistedReason: null } : {}) } : {}),
        }
        const r = await tx.tenantListing.updateMany({ where: { id: cur.id, tenantId, supplyVersion: version }, data })
        if (r.count !== 1) {
          res.skipped.push({ productId, reason: 'VERSION_CHANGED' })
          continue
        }
        res.updated++
        if (cur.granted || needGrant) visibleUpdated++
        if (delist) res.delisted++
        if (needGrant) {
          res.granted++
          publicGranted.push({ listingNo: cur.publicNo, productName: p.name, granted: true })
        }
        adminRows.push({ productId, listingNo: cur.publicNo, old: cur.supplyCents, new: cents, base: baseCents, delist, granted: needGrant })
        // 渠道看得见的行（授权后）才进 publicDiff 与通知
        if ((cur.granted || needGrant) && supplyChanged) {
          const pub = { listingNo: cur.publicNo, productName: p.name, oldSupplyCents: cur.supplyCents, newSupplyCents: cents }
          if (delist) publicDelisted.push(pub)
          else publicChanged.push(pub)
        }
      }

      if (res.updated > 0) {
        await writeAudit(tx, {
          actorUserId: adminId,
          actorKind: 'PLATFORM',
          tenantId,
          action: 'listing.batch_supply',
          // 全是未授权行 → 整条记成 listing_hidden（渠道操作日志按 targetType 排除，见 partner-services/audit.ts）；
          // 否则 targetId 只写渠道看得见的条数，真实 updated 只进 diff（仅超管）
          targetType: visibleUpdated > 0 ? 'listing' : HIDDEN_LISTING_TARGET,
          targetId: `batch:${visibleUpdated > 0 ? visibleUpdated : res.updated}`,
          // 规则、基准、行明细（含基准值）只进 diff（仅超管，S20）
          diff: { rule: body.rule, rounding: body.rd, grant: grant === true, updated: res.updated, delisted: res.delisted, unchanged: res.unchanged, skipped: res.skipped, rows: adminRows },
          publicDiff: [...publicChanged, ...publicDelisted],
        })
        if (publicGranted.length) {
          await writeAudit(tx, {
            actorUserId: adminId,
            actorKind: 'PLATFORM',
            tenantId,
            action: 'listing.grant',
            targetType: 'listing',
            targetId: publicGranted.length === 1 ? publicGranted[0].listingNo : `batch:${publicGranted.length}`,
            diff: { rows: publicGranted },
            publicDiff: publicGranted,
          })
        }
        await emitSupplyNotices(tx, t.id, dedupe, publicChanged, publicDelisted)
      }
      return res
    },
    { maxWait: 10_000, timeout: 60_000 },
  )
}

// =====================================================================================
// 逐个：授权、进货价、售价上下限、代改售价
// =====================================================================================

export interface ListingAdminPatch {
  granted?: boolean
  supplyCents?: number | null
  minRetailCents?: number | null
  maxRetailCents?: number | null
  /** 代渠道改售价：记为平台操作并通知渠道 */
  retailCents?: number | null
}

function centsOrNull(name: string, v: number | null | undefined): void {
  if (v === undefined || v === null) return
  if (!Number.isSafeInteger(v) || v <= 0 || v > MAX_SUPPLY_CENTS) throw new TenantAdminError(400, `${name} 必须是大于 0 的金额`)
}

/**
 * 超管逐个改一条上架行（没有就新建）。一个事务，按 supplyVersion CAS：读到之后被别人改过 → 409 请刷新。
 *  · granted=true 要求 Product.status=1（否则 400）；granted=false：status=0、delistedReason='REVOKED'、通知 PRODUCT_WITHDRAWN；
 *  · supplyCents 变化：supplyVersion + 1、基准记为 MANUAL；售价低于新进货价的上架行同事务自动下架并通知 AUTO_DELISTED，
 *    否则通知 SUPPLY_CHANGED；
 *  · 售价上下限变化后，若上架行的售价不再满足上下限 → 同样自动下架（delistedReason='OUT_OF_RANGE'），A2 不留在售的不可售行；
 *  · retailCents（代改）：必须满足 checkRetail；记 listing.price 审计（publicDiff 只含新旧售价）并通知渠道。
 * publicDiff 按设计 5.8：listing.supply → [{ listingNo, productName, oldSupplyCents, newSupplyCents }]；
 * listing.grant / listing.revoke → { listingNo, productName, granted }；listing.price → { listingNo, oldRetailCents, newRetailCents }；
 * 售价上下限（listing.range）不在白名单，不写 publicDiff。
 */
export async function setListingAdmin(tenantId: number, productId: number, patch: ListingAdminPatch, adminId: number): Promise<{ listingNo: string; delisted: boolean }> {
  const pt = patch ?? {}
  centsOrNull('进货价', pt.supplyCents)
  centsOrNull('售价下限', pt.minRetailCents)
  centsOrNull('售价上限', pt.maxRetailCents)
  centsOrNull('售价', pt.retailCents)
  if (pt.granted !== undefined && typeof pt.granted !== 'boolean') throw new TenantAdminError(400, '授权开关只能是开或关')
  if (![pt.granted, pt.supplyCents, pt.minRetailCents, pt.maxRetailCents, pt.retailCents].some((v) => v !== undefined)) throw new TenantAdminError(400, '没有要修改的内容')
  await channelTenant(tenantId)
  if (!Number.isSafeInteger(productId) || productId <= 0) throw new TenantAdminError(404, '商品不存在')

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 【先锁行，且必须是事务里的第一条语句】渠道改售价 / 上架不递增 supplyVersion（WP6 listings.ts），光靠版本号 CAS
        // 发现不了「站长读到之后、写入之前渠道刚改了售价或刚上架」：会把渠道的新售价用旧值写回、按旧 status 判断要不要自动下架，
        // 留下「在售但售价低于进货价」的行（A2）。FOR UPDATE 让渠道的 updateMany 等本事务提交；
        // 放在第一条是因为 InnoDB 可重复读的快照在「第一次普通读」时建立——先做任何普通读再加锁，后面的 findUnique 读到的仍是旧快照。
        await lockListingRow(tx, tenantId, productId)
        const p = await tx.product.findUnique({ where: { id: productId }, select: { id: true, name: true, status: true } })
        if (!p) throw new TenantAdminError(404, '商品不存在')
        if (pt.granted === true && p.status !== 1) throw new TenantAdminError(400, '只能授权在售商品（该商品已下架）')

        let cur = await tx.tenantListing.findUnique({ where: { tenantId_productId: { tenantId, productId } } })
        if (!cur) {
          // 没有上架行：新建一行空白的（未授权、无进货价、未上架），再按同一套逻辑改。publicNo 冲突与并发新建都靠唯一约束兜底；
          // 两个管理员同时新建同一行可能在间隙锁上死锁——外层按「整事务重来一次」处理
          const r = await tx.tenantListing.createMany({ data: [{ publicNo: newPublicNo(), tenantId, productId, granted: false, updatedBy: adminId }], skipDuplicates: true })
          await lockListingRow(tx, tenantId, productId)
          cur = await tx.tenantListing.findUnique({ where: { tenantId_productId: { tenantId, productId } } })
          if (!cur) throw new TenantAdminError(409, r.count === 0 ? '请重试' : '新建上架行失败')
        }

        const next = {
          granted: pt.granted ?? cur.granted,
          supplyCents: pt.supplyCents !== undefined ? pt.supplyCents : cur.supplyCents,
          minRetailCents: pt.minRetailCents !== undefined ? pt.minRetailCents : cur.minRetailCents,
          maxRetailCents: pt.maxRetailCents !== undefined ? pt.maxRetailCents : cur.maxRetailCents,
          retailCents: pt.retailCents !== undefined ? pt.retailCents : cur.retailCents,
        }
        if (next.minRetailCents != null && next.maxRetailCents != null && next.minRetailCents > next.maxRetailCents) throw new TenantAdminError(400, '售价下限不能高于上限')
        if (pt.retailCents !== undefined && pt.retailCents !== null) {
          const why = checkRetail(next, pt.retailCents)
          if (why) throw new TenantAdminError(400, `售价不合规（${RETAIL_REASON[why] ?? why}）`)
        }

        const supplyChanged = next.supplyCents !== cur.supplyCents
        const grantChanged = next.granted !== cur.granted
        const rangeChanged = next.minRetailCents !== cur.minRetailCents || next.maxRetailCents !== cur.maxRetailCents
        const retailChanged = next.retailCents !== cur.retailCents
        if (!supplyChanged && !grantChanged && !rangeChanged && !retailChanged) return { listingNo: cur.publicNo, delisted: false }

        // 自动下架：撤销授权 → REVOKED；上架中但按新配置不再合规 → SUPPLY_ABOVE_RETAIL / OUT_OF_RANGE
        let delistReason: string | null = null
        if (cur.status === 1) {
          if (grantChanged && !next.granted) delistReason = 'REVOKED'
          else {
            const why = checkRetail(next, next.retailCents)
            if (why === 'BELOW_SUPPLY' || why === 'NO_SUPPLY') delistReason = 'SUPPLY_ABOVE_RETAIL'
            else if (why === 'OUT_OF_RANGE') delistReason = 'OUT_OF_RANGE'
            else if (why === 'NOT_PRICED') delistReason = 'NOT_PRICED'
          }
        } else if (grantChanged && !next.granted) {
          delistReason = 'REVOKED'
        }

        // 只写这次真正变了的字段：没改售价就不碰 retailCents（行锁之外再加一层保险，绝不把渠道的售价用读到的值写回）。
        // 版本号：进货价、授权、售价上下限任一变化都 +1——这三样都是渠道「能不能按某售价上架」的前提，
        // 渠道手里基于旧前提的改价 / 上架（含批量改价预览令牌）按版本 CAS 失败、重新读，不会把不合规的行重新上架（A2）。
        // 站长代改售价不动版本号（与渠道改售价同口径）。
        const bumpVersion = supplyChanged || grantChanged || rangeChanged
        const data: Prisma.TenantListingUpdateManyMutationInput = {
          updatedBy: adminId,
          ...(grantChanged ? { granted: next.granted } : {}),
          ...(supplyChanged ? { supplyCents: next.supplyCents, supplyBaseKind: next.supplyCents == null ? null : 'MANUAL', supplyBaseCents: null } : {}),
          ...(rangeChanged ? { minRetailCents: next.minRetailCents, maxRetailCents: next.maxRetailCents } : {}),
          ...(retailChanged ? { retailCents: next.retailCents } : {}),
          ...(bumpVersion ? { supplyVersion: { increment: 1 } } : {}),
          ...(delistReason ? { status: 0, delistedReason: delistReason } : {}),
          ...(grantChanged && next.granted && cur.delistedReason === 'REVOKED' ? { delistedReason: null } : {}),
        }
        // 已持行锁，CAS 条件理论上必中；保留 supplyVersion / status / retailCents 作为第二道保险（任一与读到的不同 → 409 请刷新）
        const r = await tx.tenantListing.updateMany({
          where: { id: cur.id, tenantId, supplyVersion: cur.supplyVersion, status: cur.status, retailCents: cur.retailCents },
          data,
        })
        if (r.count !== 1) throw new TenantAdminError(409, '这条上架记录刚被修改过，请刷新后重试')

        const visible = cur.granted || next.granted
        // 渠道从没看得见过的行（授权前 → 授权后都是 false）：审计整条记成 listing_hidden，渠道操作日志里不出现，
        // 否则渠道能从日志里看到隐藏上架行的 listingNo 与「平台给它定过价」（设计 5.3 / 6.3，终审隔离 #1）
        const base = { actorUserId: adminId, actorKind: 'PLATFORM' as const, tenantId, targetType: visible ? 'listing' : HIDDEN_LISTING_TARGET, targetId: cur.publicNo }
        if (grantChanged) {
          await writeAudit(tx, {
            ...base,
            action: next.granted ? 'listing.grant' : 'listing.revoke',
            diff: { productId, from: cur.granted, to: next.granted },
            publicDiff: { listingNo: cur.publicNo, productName: p.name, granted: next.granted },
          })
        }
        if (supplyChanged) {
          await writeAudit(tx, {
            ...base,
            action: 'listing.supply',
            diff: { productId, from: cur.supplyCents, to: next.supplyCents, baseKindFrom: cur.supplyBaseKind, baseCentsFrom: cur.supplyBaseCents },
            publicDiff: visible ? [{ listingNo: cur.publicNo, productName: p.name, oldSupplyCents: cur.supplyCents, newSupplyCents: next.supplyCents }] : undefined,
          })
        }
        if (rangeChanged) {
          await writeAudit(tx, {
            ...base,
            action: 'listing.range',
            diff: { productId, min: { from: cur.minRetailCents, to: next.minRetailCents }, max: { from: cur.maxRetailCents, to: next.maxRetailCents } },
            // 售价上下限渠道在商品池里本来就看得到（设计 5.8，D16 补齐）；未授权过的行渠道看不见，不给
            publicDiff: visible
              ? { listingNo: cur.publicNo, oldMinRetailCents: cur.minRetailCents, newMinRetailCents: next.minRetailCents, oldMaxRetailCents: cur.maxRetailCents, newMaxRetailCents: next.maxRetailCents }
              : undefined,
          })
        }
        if (retailChanged) {
          await writeAudit(tx, {
            ...base,
            action: 'listing.price',
            diff: { productId, from: cur.retailCents, to: next.retailCents },
            publicDiff: visible ? { listingNo: cur.publicNo, oldRetailCents: cur.retailCents, newRetailCents: next.retailCents } : undefined,
          })
        }

        // —— 通知渠道（只对渠道看得见的行）。dedupeKey：同一上架行的同一次改动只发一次 ——
        const ver = cur.supplyVersion + (bumpVersion ? 1 : 0)
        const dk = `lst:${cur.publicNo}:v${ver}:${Date.now().toString(36)}`
        if (grantChanged && !next.granted) {
          if (cur.granted) {
            await emitTenantNotice(tx, { tenantId, kind: 'PRODUCT_WITHDRAWN', title: `商品「${p.name}」已停止供货`, body: '平台已撤销该商品的授权，商品已下架', refType: 'listing', refKey: cur.publicNo, dedupeKey: `${dk}:w` })
          }
        } else if (grantChanged && next.granted) {
          await emitTenantNotice(tx, { tenantId, kind: 'PLATFORM_LISTING', title: `新增可售商品「${p.name}」`, body: `进货价 ${yuan(next.supplyCents)}；请在商品池设置售价后上架`, refType: 'listing', refKey: cur.publicNo, dedupeKey: `${dk}:g` })
        } else if (visible && delistReason) {
          await emitTenantNotice(tx, {
            tenantId,
            kind: 'AUTO_DELISTED',
            title: `商品「${p.name}」已自动下架`,
            body: supplyChanged ? `进货价 ${yuan(cur.supplyCents)} → ${yuan(next.supplyCents)}，当前售价低于进货价` : '当前售价不满足平台设置的售价范围，请调整售价后重新上架',
            refType: 'listing',
            refKey: cur.publicNo,
            dedupeKey: `${dk}:d`,
          })
        } else if (visible && supplyChanged) {
          await emitTenantNotice(tx, { tenantId, kind: 'SUPPLY_CHANGED', title: `商品「${p.name}」进货价调整`, body: `进货价 ${yuan(cur.supplyCents)} → ${yuan(next.supplyCents)}`, refType: 'listing', refKey: cur.publicNo, dedupeKey: `${dk}:c` })
        }
        if (visible && next.granted && retailChanged) {
          // 站长代改售价与新授权归「平台调价 / 新授权」一类（PLATFORM_LISTING，主会话 D16），与进货价调整分开，渠道可单独关推送
          await emitTenantNotice(tx, { tenantId, kind: 'PLATFORM_LISTING', title: `平台代为调整了「${p.name}」的售价`, body: `售价 ${yuan(cur.retailCents)} → ${yuan(next.retailCents)}`, refType: 'listing', refKey: cur.publicNo, dedupeKey: `${dk}:p` })
        }
        return { listingNo: cur.publicNo, delisted: !!delistReason && cur.status === 1 }
      })
    } catch (e) {
      // 并发新建同一商品的上架行（唯一约束），或两个事务在该行的间隙锁上死锁 / 锁等待超时（整个事务已被 InnoDB 回滚）：
      // 整事务重来一次，第二次会读到别人刚建的行
      const retryable = (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') || isTxAbortingError(e)
      if (retryable && attempt === 0) continue
      if (retryable) throw new TenantAdminError(409, '这条上架记录正被同时修改，请稍后重试')
      throw e
    }
  }
  throw new TenantAdminError(409, '请重试')
}

/**
 * 锁住（tenantId, productId）的上架行：`SELECT … FOR UPDATE`（走唯一索引，行存在时只锁这一条记录）。
 * 行不存在时 InnoDB 加的是间隙锁，随后本事务 INSERT 不受影响；两个事务同时对同一间隙加锁再插入会死锁，由调用方重试。
 */
async function lockListingRow(tx: Tx, tenantId: number, productId: number): Promise<void> {
  await tx.$queryRaw`SELECT id FROM tenant_listings WHERE tenant_id = ${tenantId} AND product_id = ${productId} FOR UPDATE`
}

const RETAIL_REASON: Record<string, string> = {
  NO_SUPPLY: '尚未设置进货价',
  NOT_PRICED: '售价必须大于 0',
  BELOW_SUPPLY: '低于进货价',
  OUT_OF_RANGE: '超出售价上下限',
}

// =====================================================================================
// 超管商品授权表（/admin/tenants/[id]/listings）
// =====================================================================================

export interface AdminListingRow {
  productId: number
  productName: string
  categoryName: string | null
  productStatus: number
  deliveryType: string
  mainPriceCents: number
  stock: number
  costCents: number | null
  listing: null | {
    listingNo: string
    granted: boolean
    supplyCents: number | null
    supplyBaseKind: string | null
    supplyBaseCents: number | null
    minRetailCents: number | null
    maxRetailCents: number | null
    retailCents: number | null
    status: number
    sales: number
    delistedReason: string | null
    sellableReason: string | null
  }
}

/** 全部商品 × 本渠道上架行（超管视角，含成本基准）。only='listed' 只看已有上架行的商品 */
export async function adminListings(tenantId: number, q: { keyword?: string; categoryId?: number; only?: 'all' | 'listed' | 'granted' } = {}): Promise<AdminListingRow[]> {
  const t = await channelTenant(tenantId)
  const listings = await prisma.tenantListing.findMany({ where: { tenantId } })
  const lOf = new Map(listings.map((l) => [l.productId, l]))
  const kw = (q.keyword ?? '').trim().slice(0, 64)
  const where: Prisma.ProductWhereInput = {
    ...(q.categoryId !== undefined ? { categoryId: q.categoryId } : {}),
    ...(kw ? { name: { contains: kw } } : {}),
    ...(q.only === 'listed' ? { id: { in: listings.map((l) => l.productId) } } : {}),
    ...(q.only === 'granted' ? { id: { in: listings.filter((l) => l.granted).map((l) => l.productId) } } : {}),
  }
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ status: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    take: 1000,
    select: { id: true, name: true, status: true, price: true, stock: true, deliveryType: true, category: { select: { name: true } } },
  })
  const costs = await costBasisCents(products.map((p) => p.id))
  return products.map((p) => {
    const l = lOf.get(p.id)
    return {
      productId: p.id,
      productName: p.name,
      categoryName: p.category?.name ?? null,
      productStatus: p.status,
      deliveryType: p.deliveryType,
      mainPriceCents: decToCents(p.price) ?? 0,
      stock: p.stock,
      costCents: costs.get(p.id) ?? null,
      listing: l
        ? {
            listingNo: l.publicNo,
            granted: l.granted,
            supplyCents: l.supplyCents,
            supplyBaseKind: l.supplyBaseKind,
            supplyBaseCents: l.supplyBaseCents,
            minRetailCents: l.minRetailCents,
            maxRetailCents: l.maxRetailCents,
            retailCents: l.retailCents,
            status: l.status,
            sales: l.sales,
            delistedReason: l.delistedReason,
            // 与渠道商品池同一口径（WP6 catalog.listingReason）：先看这一行自身的问题，行本身没问题再看店铺状态
            sellableReason: checkSellable({ tenantStatus: 'ACTIVE', preview: false, listing: l, productStatus: p.status }) ?? (t.status === 'ACTIVE' ? null : 'TENANT_INACTIVE'),
          }
        : null,
    }
  })
}
