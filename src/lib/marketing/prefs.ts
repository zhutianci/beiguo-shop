/**
 * 退订页 / 一键退订 / 个人中心订阅卡 的业务逻辑（公开端点与登录用户接口调用）。
 * 权限：减少来信的动作永远可用；增加来信（恢复订阅、打开主题、取消暂停）经 token 只在发送后 30 天内可用。
 * token='test' 是测试邮件用的演示 token：一切操作空转。
 *
 * 【实现方：同步与公开端】签名是契约。落库统一走 consent.ts 的 applyConsentChange。
 *
 * 【为什么「增加来信」要限 30 天】token 写在每一封营销邮件里，邮件会被转发、截图、
 * 躺在别人的收件箱里很多年。拿到一封旧信的人能替收件人「退订」无伤大雅（本来就该让退订更容易），
 * 但如果也能替他「恢复订阅」，就等于任何人都能伪造一次同意 —— 这正是管理办法 §13 要防的事。
 * 30 天以上的旧信只能减少来信；想恢复请登录后在个人中心自己操作。
 *
 * 【这里的 token 只在退订链接里】点击链接与打开像素用的是另一枚 trackToken（tracking.ts）：
 * 收件人分享出去的商品链接不带这枚凭证，拿到链接的人换个路径也改不了人家的订阅（审查 C5）。
 * 所以这里绝不能改成「token 或 trackToken 都认」。
 *
 * 【为什么退订不受「每天 10 次」限制】退订是幂等的（最多一次真实变更），而且是法定义务
 * （消保法实施条例 §24「立即停止」）。限流只拦恢复/主题/暂停这类可以来回切换、会刷留痕的动作。
 */
import { prisma } from '@/lib/db'
import { maskEmail } from '@/lib/mask'
import { applyConsentChange, getConsent, type ConsentChange, type ConsentView } from './consent'
import { getConfig } from './config'
import { bjDayStart } from './time'
import { TOPICS, clip, type AccountMarketingState, type PrefsState, type Topic } from './types'

export const TEST_TOKEN = 'test'

export interface RequestMeta {
  ip: string | null
  ua: string | null
}

/** 发送后多少天内允许经 token 做「增加来信」的动作 */
export const TOKEN_INCREASE_DAYS = 30
/** 同一 token 每个北京日至多几次状态变更（按留痕条数计，退订除外） */
export const TOKEN_DAILY_CHANGES = 10
/** 暂停天数上限（界面只给 30 天，接口多留一点余量） */
export const MAX_PAUSE_DAYS = 90

const TOKEN_RE = /^[0-9a-f]{32}$/
const DAY_MS = 86400_000

/** 演示页展示用的假邮箱（测试邮件的退订链接指向 /unsubscribe/test） */
const DEMO_EMAIL_MASKED = 'yo***@example.com'

/* ------------------------------ 纯函数（scripts/check-marketing-public.ts 断言） ------------------------------ */

/** 当前是否处于暂停中（过期的 pausedUntil 视同未暂停） */
function activePause(v: Pick<ConsentView, 'pausedUntil'>, now: Date): Date | null {
  return v.pausedUntil && v.pausedUntil.getTime() > now.getTime() ? v.pausedUntil : null
}

/**
 * 这个动作相对当前状态是否会「增加来信」。
 * 判断的是**效果**而不是动作名：已经在接收的人点「恢复订阅」是空操作，不算增加；
 * 暂停永远不算增加 —— consent.applyConsentChange 只会把暂停往后延、从不缩短。
 */
export function prefsActionIncreases(a: PrefsAction, cur: ConsentView, now: Date): boolean {
  switch (a.action) {
    case 'unsubscribe':
    case 'pause':
      return false
    case 'resubscribe':
      return cur.status === 'UNSUBSCRIBED'
    case 'topics': {
      const next = new Set<string>(a.topicsOff)
      // 当前关着、提交后变成开着的主题 = 打开主题
      return cur.topicsOff.some((t) => !next.has(t))
    }
    case 'resume':
      return !!activePause(cur, now)
  }
}

/** 发送时间在 30 天内（没有发送时间 → 不允许增加来信） */
export function canIncreaseBy(sentAt: Date | null, now: Date): boolean {
  if (!sentAt) return false
  const age = now.getTime() - sentAt.getTime()
  return age >= -DAY_MS && age <= TOKEN_INCREASE_DAYS * DAY_MS
}

function normalizeTopics(list: readonly string[]): Topic[] {
  return TOPICS.filter((t) => list.includes(t))
}

function toState(emailMasked: string, v: ConsentView, canIncrease: boolean, now: Date, test = false): PrefsState {
  const p = activePause(v, now)
  const s: PrefsState = {
    emailMasked,
    status: v.status,
    topicsOff: normalizeTopics(v.topicsOff),
    pausedUntil: p ? p.toISOString() : null,
    canIncrease,
  }
  if (test) s.test = true
  return s
}

/** 演示 token：按动作算出「如果生效会怎样」，不碰数据库 */
function simulate(a: PrefsAction | null, now: Date): PrefsState {
  const v: ConsentView = { status: 'DEFAULT', topicsOff: [], pausedUntil: null }
  if (a) {
    if (a.action === 'unsubscribe') v.status = 'UNSUBSCRIBED'
    else if (a.action === 'topics') v.topicsOff = normalizeTopics(a.topicsOff)
    else if (a.action === 'pause') v.pausedUntil = new Date(now.getTime() + a.days * DAY_MS)
  }
  return toState(DEMO_EMAIL_MASKED, v, true, now, true)
}

function toChange(a: PrefsAction): ConsentChange {
  switch (a.action) {
    case 'unsubscribe':
      return { kind: 'unsubscribe' }
    case 'resubscribe':
      return { kind: 'resubscribe' }
    case 'topics':
      return { kind: 'topics', topicsOff: normalizeTopics(a.topicsOff) }
    case 'pause':
      return { kind: 'pause', days: a.days }
    case 'resume':
      return { kind: 'resume' }
  }
}

function cleanMeta(meta: RequestMeta): RequestMeta {
  return {
    ip: meta.ip && meta.ip !== 'unknown' ? clip(meta.ip, 64) : null,
    ua: meta.ua ? clip(meta.ua, 255) : null,
  }
}

/* ------------------------------ 取数 ------------------------------ */

interface TokenMessage {
  id: number
  campaignId: number
  userId: number | null
  email: string
  sentAt: Date | null
  unsubscribedAt: Date | null
}

async function findMessage(token: string): Promise<TokenMessage | null> {
  if (!TOKEN_RE.test(token)) return null
  return prisma.marketingMessage.findUnique({
    where: { token },
    select: { id: true, campaignId: true, userId: true, email: true, sentAt: true, unsubscribedAt: true },
  })
}

/**
 * token 对应的用户。偏好是按用户存的，邮件行上的 userId 为主；
 * 取不到（账户已不存在）时按收件邮箱找 —— 拿着这封信的就是这个邮箱的主人。
 * 两样都没有 → null：这个地址今后不会再收到营销邮件（只发给注册用户），退订按成功处理即可。
 */
async function resolveUserId(msg: TokenMessage): Promise<number | null> {
  if (msg.userId) {
    const u = await prisma.user.findUnique({ where: { id: msg.userId }, select: { id: true } })
    if (u) return u.id
  }
  const byEmail = await prisma.user.findUnique({ where: { email: msg.email }, select: { id: true } })
  return byEmail?.id ?? null
}

/**
 * 把本封信记为「从这封信退订」：报表的退订数、UNSUB 事件都以它为准。只在第一次写。
 *
 * applyConsentChange 在状态真的变成已退订时，会在同一事务里顺手写掉这封信的 unsubscribedAt ——
 * 那种情况下这里的条件更新是 0 行，所以要靠 consentMarked（= 事前为空 且 偏好确实变了）补上事件。
 * 偏好本来就是已退订（比如先在个人中心关了、又点了旧邮件的退订）时，由这里的条件更新写。
 */
async function markMessageUnsubscribed(msg: TokenMessage, now: Date, consentMarked = false): Promise<void> {
  const { count } = await prisma.marketingMessage.updateMany({
    where: { id: msg.id, unsubscribedAt: null },
    data: { unsubscribedAt: now },
  })
  if (count === 1 || consentMarked) {
    await prisma.marketingEvent.create({
      data: { campaignId: msg.campaignId, messageId: msg.id, type: 'UNSUB', createdAt: now },
    })
  }
}

const GONE_STATE = (msg: TokenMessage, now: Date): PrefsState =>
  toState(maskEmail(msg.email), { status: 'UNSUBSCRIBED', topicsOff: [], pausedUntil: null }, false, now)

/* ------------------------------ 对外接口 ------------------------------ */

/** GET /api/mkt/prefs/[token]；token 无效返回 null */
export async function getPrefsByToken(token: string): Promise<PrefsState | null> {
  const now = new Date()
  if (token === TEST_TOKEN) return simulate(null, now)
  const msg = await findMessage(token)
  if (!msg) return null
  const userId = await resolveUserId(msg)
  if (!userId) return GONE_STATE(msg, now)
  const view = await getConsent(userId)
  return toState(maskEmail(msg.email), view, canIncreaseBy(msg.sentAt, now), now)
}

export type PrefsAction =
  | { action: 'unsubscribe' }
  | { action: 'resubscribe' }
  | { action: 'topics'; topicsOff: Topic[] }
  | { action: 'pause'; days: number }
  | { action: 'resume' }

export type PrefsResult =
  | { ok: true; state: PrefsState }
  | { ok: false; status: 403 | 404 | 429; message: string }

/** POST /api/mkt/prefs/[token] */
export async function applyPrefsByToken(token: string, a: PrefsAction, meta: RequestMeta): Promise<PrefsResult> {
  const now = new Date()
  if (a.action === 'pause' && !(Number.isInteger(a.days) && a.days >= 1 && a.days <= MAX_PAUSE_DAYS)) {
    return { ok: false, status: 403, message: '暂停天数不合法' }
  }
  if (token === TEST_TOKEN) return { ok: true, state: simulate(a, now) }

  const msg = await findMessage(token)
  if (!msg) return { ok: false, status: 404, message: '链接无效或已过期' }

  const canIncrease = canIncreaseBy(msg.sentAt, now)
  const userId = await resolveUserId(msg)
  if (!userId) {
    // 账户已不存在：退订 / 减少来信照常「成功」（本来就不会再发），增加来信无从谈起
    if (a.action === 'unsubscribe') {
      await markMessageUnsubscribed(msg, now)
      return { ok: true, state: GONE_STATE(msg, now) }
    }
    return { ok: false, status: 403, message: '请登录后在个人中心操作' }
  }

  const cur = await getConsent(userId)
  if (prefsActionIncreases(a, cur, now) && !canIncrease) {
    return { ok: false, status: 403, message: '这封邮件已超过 30 天，请登录后在个人中心操作' }
  }

  if (a.action !== 'unsubscribe') {
    const changesToday = await prisma.marketingConsentLog.count({
      where: { messageId: msg.id, createdAt: { gte: bjDayStart(now) } },
    })
    if (changesToday >= TOKEN_DAILY_CHANGES) {
      return { ok: false, status: 429, message: '今天的修改次数太多了，请明天再试，或登录后在个人中心操作' }
    }
  }

  const m = cleanMeta(meta)
  const { changed, state } = await applyConsentChange(userId, toChange(a), {
    source: 'token_page',
    email: msg.email,
    campaignId: msg.campaignId,
    messageId: msg.id,
    ip: m.ip,
    ua: m.ua,
  })
  if (a.action === 'unsubscribe') await markMessageUnsubscribed(msg, now, changed && msg.unsubscribedAt == null)
  return { ok: true, state: toState(maskEmail(msg.email), state, canIncrease, now) }
}

/** RFC 8058 一键退订：token 有效即退订全部；幂等；返回是否识别到有效 token */
export async function oneClickUnsubscribe(token: string, meta: RequestMeta): Promise<boolean> {
  if (token === TEST_TOKEN) return true
  const msg = await findMessage(token)
  if (!msg) return false
  const now = new Date()
  const userId = await resolveUserId(msg)
  let changed = false
  if (userId) {
    const m = cleanMeta(meta)
    const r = await applyConsentChange(
      userId,
      { kind: 'unsubscribe' },
      { source: 'one_click', email: msg.email, campaignId: msg.campaignId, messageId: msg.id, ip: m.ip, ua: m.ua }
    )
    changed = r.changed
  }
  await markMessageUnsubscribed(msg, now, changed && msg.unsubscribedAt == null)
  return true
}

/** 个人中心 GET /api/account/marketing */
export async function getAccountMarketing(userId: number): Promise<AccountMarketingState> {
  const now = new Date()
  const [user, view, config] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    getConsent(userId),
    // 展示用，读失败回落默认值即可（fail closed 只针对 worker / sync）
    getConfig(),
  ])
  const p = activePause(view, now)
  return {
    status: view.status,
    topicsOff: normalizeTopics(view.topicsOff),
    pausedUntil: p ? p.toISOString() : null,
    defaultEligible: config.defaultEligible,
    email: user?.email ?? null,
  }
}

export type AccountAction =
  | { action: 'subscribe' }
  | { action: 'unsubscribe' }
  | { action: 'topics'; topicsOff: Topic[] }
  | { action: 'pause'; days: number }
  | { action: 'resume' }

/** 个人中心 PUT /api/account/marketing（本人登录，可做任何方向的变更） */
export async function applyAccountMarketing(userId: number, a: AccountAction, meta: RequestMeta): Promise<AccountMarketingState> {
  if (a.action === 'pause' && !(Number.isInteger(a.days) && a.days >= 1 && a.days <= MAX_PAUSE_DAYS)) {
    throw new Error('暂停天数不合法')
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  const change: ConsentChange =
    a.action === 'subscribe'
      ? { kind: 'subscribe' }
      : a.action === 'unsubscribe'
        ? { kind: 'unsubscribe' }
        : a.action === 'topics'
          ? { kind: 'topics', topicsOff: normalizeTopics(a.topicsOff) }
          : a.action === 'pause'
            ? { kind: 'pause', days: a.days }
            : { kind: 'resume' }
  const m = cleanMeta(meta)
  await applyConsentChange(userId, change, {
    source: 'profile',
    // 留痕的 email 列非空：没有邮箱的账户（手机号注册）本来也收不到营销邮件，记空串即可
    email: (user?.email || '').toLowerCase(),
    ip: m.ip,
    ua: m.ua,
  })
  return getAccountMarketing(userId)
}
