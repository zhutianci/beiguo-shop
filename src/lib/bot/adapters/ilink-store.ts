/**
 * iLink 绑定的凭据与收消息游标（docs/微信机器人-设计.md 附录 E）。
 *
 * 每个绑定 = 一个 bot_conversations 行（adapter = 'ilink'，external_id = ilink_bot_id）+ 一行 settings（key = bot_ilink:<会话 id>）。
 * 用 settings 而不是新表：不做 DDL，绑定数量也就几个到几十个。
 * bot_token（谁拿到它谁就能以这个绑定收发消息）与 context_token 用 CARDKEY_SECRET 加密存放（与卡密、提卡回执同一把密钥）；
 * 只有本目录（适配器、收消息循环、绑定流程）读写明文，后台接口只拿「有没有 / 什么时候」。
 *
 * 写入者：绑定流程（新建）、收消息循环（游标、context_token、失效标记）、解绑（删除）。发送器只读。
 */
import { prisma } from '../../db'
import { decryptCardContent, encryptCardContent } from '../../cardkey'

export const ILINK_KEY_PREFIX = 'bot_ilink:'

export interface IlinkBinding {
  convId: number
  /** ilink_bot_id（会话 external_id） */
  botId: string
  /** 扫码绑定的那个微信（ilink_user_id，xxx@im.wechat）：只认它发来的消息，也只发给它 */
  userId: string
  /** 扫码确认时服务端给的接口地址；空 = 默认 */
  baseUrl: string | null
  token: string
  /** getupdates 的游标（get_updates_buf），每轮更新；空串 = 从头 */
  cursor: string
  /** 对方最近一条消息带来的 context_token；回消息、推送都要带它（约 24 小时内有效） */
  ctxToken: string | null
  ctxAt: string | null
  lastInboundAt: string | null
  boundAt: string
  /** 服务端回 -14（token 失效）的时间；非空 = 这个绑定废了，只能重新扫码 */
  staleAt: string | null
}

interface Stored {
  v: 1
  botId: string
  userId: string
  baseUrl: string | null
  token: string
  cursor: string
  ctx: string | null
  ctxAt: string | null
  lastInboundAt: string | null
  boundAt: string
  staleAt: string | null
}

const keyOf = (convId: number) => `${ILINK_KEY_PREFIX}${convId}`

function decode(convId: number, raw: string): IlinkBinding | null {
  try {
    const s = JSON.parse(raw) as Stored
    if (!s || s.v !== 1 || !s.botId || !s.userId || !s.token) return null
    return {
      convId,
      botId: s.botId,
      userId: s.userId,
      baseUrl: s.baseUrl ?? null,
      token: decryptCardContent(s.token),
      cursor: s.cursor || '',
      ctxToken: s.ctx ? decryptCardContent(s.ctx) : null,
      ctxAt: s.ctxAt ?? null,
      lastInboundAt: s.lastInboundAt ?? null,
      boundAt: s.boundAt,
      staleAt: s.staleAt ?? null,
    }
  } catch (e) {
    // 解不开（CARDKEY_SECRET 换了）或内容坏了：这个绑定当作不可用，只能重新扫码
    console.error(`[bot] iLink 绑定 #${convId} 读取失败`, (e as Error)?.message)
    return null
  }
}

function encode(b: IlinkBinding): string {
  const s: Stored = {
    v: 1,
    botId: b.botId,
    userId: b.userId,
    baseUrl: b.baseUrl,
    token: encryptCardContent(b.token),
    cursor: b.cursor,
    ctx: b.ctxToken ? encryptCardContent(b.ctxToken) : null,
    ctxAt: b.ctxAt,
    lastInboundAt: b.lastInboundAt,
    boundAt: b.boundAt,
    staleAt: b.staleAt,
  }
  return JSON.stringify(s)
}

export async function readBinding(convId: number): Promise<IlinkBinding | null> {
  const row = await prisma.setting.findUnique({ where: { key: keyOf(convId) } })
  return row ? decode(convId, row.value) : null
}

export async function writeBinding(b: IlinkBinding): Promise<void> {
  const value = encode(b)
  await prisma.setting.upsert({ where: { key: keyOf(b.convId) }, create: { key: keyOf(b.convId), value }, update: { value } })
}

/** 读-改-写（同一个绑定只有它自己的收消息循环会频繁写，没有并发写者） */
export async function patchBinding(convId: number, patch: Partial<Omit<IlinkBinding, 'convId'>>): Promise<IlinkBinding | null> {
  const cur = await readBinding(convId)
  if (!cur) return null
  const next: IlinkBinding = { ...cur, ...patch, convId }
  await writeBinding(next)
  return next
}

export async function deleteBinding(convId: number): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: keyOf(convId) } })
}

/** 本站已有绑定的 token（新的在前，最多 limit 个）：扫码时上送，同一个微信再扫会回 binded_redirect */
export async function recentBindingTokens(limit = 10): Promise<string[]> {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: ILINK_KEY_PREFIX } }, orderBy: { updatedAt: 'desc' }, take: 50, select: { key: true, value: true } })
  const out: string[] = []
  for (const r of rows) {
    const b = decode(Number(r.key.slice(ILINK_KEY_PREFIX.length)), r.value)
    if (b && !b.staleAt) out.push(b.token)
    if (out.length >= limit) break
  }
  return out
}
