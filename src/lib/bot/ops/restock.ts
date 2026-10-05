/**
 * 补货（一次性网页，docs/微信机器人-设计.md §9、附录 B 第 6、7 条）。
 *
 *  1. 管理群 / 私聊：@贝果助手 补货 [货号] → createRestockLink：32 字节随机令牌（base64url，43 字符），**库里只存 SHA-256**，
 *     绑定动作 RESTOCK、商品（可空）、会话、管理员、指令；5 分钟有效。链接只回发起会话，回复在出队里加密存放。
 *  2. GET /bot/x/<令牌> → peekRestockToken：**只读**校验（微信的链接预览、腾讯的安全扫描都会预取链接），不改任何状态。
 *  3. POST /api/bot/x/restock → submitRestock：事务里锁令牌行（FOR UPDATE）→ 仍可用？→ importCardKeys(tx, …) →
 *     **真的导进去了（inserted > 0）才作废令牌**（used_at）并写审计 bot.card.restock；导入 0 张（全是空行或重复）不作废，可以改了再交。
 *     提交之后：syncAutoStock、群里回执（还有几单在等卡，提示「补发 <货号>」）、抄送企业微信。
 *  锁定（§10）时全部未用令牌已被作废；提交时再核一次配置：锁定 / 配置读不到 → 拒绝。
 */
import { createHash, randomBytes } from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { cardKeyConfigured, syncAutoStock } from '../../cardkey'
import { importCardKeys, splitCardLines } from '../../cardkey-import'
import { writeAudit } from '../../audit'
import { notify } from '../../notify'
import { bjDateKey, bjMinuteString } from '../../marketing/time'
import { readBotConfig } from '../config'
import { enqueueReply } from '../outbox'
import { kickSender } from '../sender'
import { countAwaitingCards } from './products'

export const RESTOCK_TTL_MS = 5 * 60_000
export const RESTOCK_MAX_LINES = 2000
export const RESTOCK_MAX_BYTES = 200 * 1024
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

export class RestockError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'RestockError'
    this.status = status
  }
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

function productIdOfParams(params: unknown): number | null {
  const v = params && typeof params === 'object' && !Array.isArray(params) ? (params as Record<string, unknown>).productId : null
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null
}

/** 开一个补货链接（指令「补货」调用；调用方已在 T3 锁里） */
export async function createRestockLink(input: {
  commandId: number
  adminId: number
  conversationId: number
  productId: number | null
  origin: string
  now?: Date
}): Promise<{ url: string; expiresAt: Date }> {
  // 链接要在出队里加密存放（与卡密同一把密钥）；没有密钥就别开出一个发不出去的链接
  if (!cardKeyConfigured()) throw new RestockError('服务器没有配置卡密密钥（CARDKEY_SECRET），不能补货')
  const now = input.now ?? new Date()
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + RESTOCK_TTL_MS)
  await prisma.botActionToken.create({
    data: {
      tokenHash: sha256(token),
      action: 'RESTOCK',
      params: { productId: input.productId },
      conversationId: input.conversationId,
      adminId: input.adminId,
      commandId: input.commandId,
      expiresAt,
    },
  })
  return { url: `${input.origin}/bot/x/${token}`, expiresAt }
}

export type RestockPeek =
  | { ok: true; tokenId: number; productId: number | null; expiresAt: Date; adminName: string | null }
  | { ok: false; reason: 'NOT_FOUND' | 'USED' | 'REVOKED' | 'EXPIRED' }

/** 页面 GET：只读校验令牌（不改任何状态） */
export async function peekRestockToken(token: string, now: Date = new Date()): Promise<RestockPeek> {
  if (!TOKEN_RE.test(token)) return { ok: false, reason: 'NOT_FOUND' }
  const row = await prisma.botActionToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, action: true, params: true, adminId: true, expiresAt: true, usedAt: true, revokedAt: true },
  })
  if (!row || row.action !== 'RESTOCK') return { ok: false, reason: 'NOT_FOUND' }
  if (row.usedAt) return { ok: false, reason: 'USED' }
  if (row.revokedAt) return { ok: false, reason: 'REVOKED' }
  if (row.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'EXPIRED' }
  const admin = await prisma.botAdmin.findUnique({ where: { id: row.adminId }, select: { name: true } })
  return { ok: true, tokenId: row.id, productId: productIdOfParams(row.params), expiresAt: row.expiresAt, adminName: admin?.name ?? null }
}

export interface RestockSubmit {
  token: string
  productId: number
  content: string
  cost?: number
  batch?: string | null
  redeemProvider?: string | null
  redeemUrl?: string | null
}

export interface RestockOutcome {
  productId: number
  productName: string
  total: number
  created: number
  skipped: number
  inserted: number
  /** 令牌是否已作废（真的导进去了才作废） */
  consumed: boolean
  stock: number | null
  awaiting: number
}

/** 默认批次名 bot-20261005-1432（北京时间） */
export function defaultRestockBatch(now: Date = new Date()): string {
  // bjMinuteString = 「YYYY-MM-DD HH:mm」（北京时间）
  return `bot-${bjDateKey(now).replace(/-/g, '')}-${bjMinuteString(now).slice(11).replace(':', '')}`
}

interface LockedTokenRow {
  id: number
  action: string
  params: unknown
  conversation_id: number
  admin_id: number
  command_id: number | null
  expires_at: Date
  used_at: Date | null
  revoked_at: Date | null
}

/** 页面 POST：校验、导入、作废令牌（见文件头）。业务性拒绝抛 RestockError / CardImportError（message 原样给页面） */
export async function submitRestock(input: RestockSubmit, ip: string | null, now: Date = new Date()): Promise<RestockOutcome> {
  if (!TOKEN_RE.test(input.token)) throw new RestockError('链接已失效', 410)
  const cfg = await readBotConfig({ fresh: true })
  if (!cfg.ok) throw new RestockError('机器人配置读取失败，补货暂停；请到后台「微信机器人」检查', 503)
  if (cfg.config.locked) throw new RestockError('机器人已锁定，补货暂停（解锁只能在后台）', 423)
  if (Buffer.byteLength(input.content || '', 'utf8') > RESTOCK_MAX_BYTES) throw new RestockError(`一次最多 ${RESTOCK_MAX_BYTES / 1024} KB，请分批提交`)
  const lines = splitCardLines(input.content || '')
  if (lines.length > RESTOCK_MAX_LINES) throw new RestockError(`一次最多 ${RESTOCK_MAX_LINES} 张，请分批提交`)

  const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true, name: true, deliveryType: true, botCode: true } })
  if (!product || product.deliveryType !== 'AUTO') throw new RestockError('请选择一个自动发货商品')

  const hash = sha256(input.token)
  const result = await prisma.$transaction(
    async (tx) => {
      // 锁令牌行：同一个链接被同时提交两次时，后到的排队，等前一个提交后再看「是否已作废」
      const rows = await tx.$queryRaw<LockedTokenRow[]>`
        SELECT id, action, params, conversation_id, admin_id, command_id, expires_at, used_at, revoked_at
          FROM bot_action_tokens WHERE token_hash = ${hash} FOR UPDATE`
      const t = rows[0]
      if (!t || t.action !== 'RESTOCK' || t.used_at || t.revoked_at || new Date(t.expires_at).getTime() <= now.getTime()) {
        throw new RestockError('链接已失效（已用过、已作废或已过期），请在群里重新发「@贝果助手 补货」', 410)
      }
      const r = await importCardKeys(tx, {
        productId: product.id,
        content: input.content,
        batch: input.batch ?? null,
        remark: null,
        cost: input.cost,
        redeemUrl: input.redeemUrl ?? null,
        redeemProvider: input.redeemProvider ?? null,
      })
      const consumed = r.inserted > 0
      if (consumed) {
        const summary = { productId: product.id, total: r.total, created: r.created, skipped: r.skipped, inserted: r.inserted }
        await tx.botActionToken.update({ where: { id: t.id }, data: { usedAt: now, usedIp: ip ? ip.slice(0, 45) : null, result: summary } })
        const admin = await tx.botAdmin.findUnique({ where: { id: t.admin_id }, select: { name: true, siteUserId: true } })
        // 审计写不进去 → 整批回滚，令牌也不作废（可以再交一次）
        await writeAudit(tx, {
          actorUserId: admin?.siteUserId ?? null,
          actorKind: 'PLATFORM',
          action: 'bot.card.restock',
          targetType: 'product',
          targetId: String(product.id),
          diff: {
            via: 'wechat-bot',
            tokenId: t.id,
            commandId: t.command_id,
            admin: admin?.name ?? null,
            conversationId: t.conversation_id,
            ...summary,
            batch: input.batch ?? null,
            cost: input.cost ?? 0,
            redeemProvider: input.redeemProvider ?? null,
            redeemUrl: input.redeemUrl ?? null,
            ip,
          },
        })
      }
      return { r, consumed, conversationId: t.conversation_id, adminId: t.admin_id }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10_000, timeout: 30_000 }
  )

  let stock: number | null = null
  let awaiting = 0
  if (result.consumed) {
    await syncAutoStock(product.id).catch((e) => console.error('[bot] 补货后同步库存失败', product.id, (e as Error)?.message))
    stock = (await prisma.product.findUnique({ where: { id: product.id }, select: { stock: true } }).catch(() => null))?.stock ?? null
    awaiting = await countAwaitingCards(product.id).catch(() => 0)
    const code = product.botCode || `P${product.id}`
    const text =
      `📦 补货完成｜${product.name}：导入 ${result.r.inserted} 张${result.r.skipped ? `（重复跳过 ${result.r.skipped} 张）` : ''}` +
      `${stock !== null ? `，当前库存 ${stock} 张` : ''}` +
      (awaiting ? `；还有 ${awaiting} 单付了款在等卡，发送「@贝果助手 补发 ${code}」即可补发` : '')
    const conv = await prisma.botConversation.findUnique({ where: { id: result.conversationId }, select: { status: true } }).catch(() => null)
    if (conv?.status === 'ACTIVE') {
      await enqueueReply(result.conversationId, text, `restock:${hash.slice(0, 16)}`).catch((e) => console.error('[bot] 补货回执入队失败', (e as Error)?.message))
      kickSender()
    }
    const admin = await prisma.botAdmin.findUnique({ where: { id: result.adminId }, select: { name: true } }).catch(() => null)
    notify(
      'bot.sensitive',
      [
        { label: '操作', value: '机器人补货（一次性网页）' },
        { label: '商品', value: product.name },
        { label: '导入', value: `${result.r.inserted} 张（重复跳过 ${result.r.skipped} 张）` },
        { label: '发起人', value: admin?.name ?? '—' },
        { label: '提交 IP', value: ip || '—' },
      ],
      { link: '/admin/bot', linkText: '前往后台核对' }
    )
  }

  return {
    productId: product.id,
    productName: product.name,
    total: result.r.total,
    created: result.r.created,
    skipped: result.r.skipped,
    inserted: result.r.inserted,
    consumed: result.consumed,
    stock,
    awaiting,
  }
}
