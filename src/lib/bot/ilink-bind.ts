/**
 * iLink 扫码绑定（docs/微信机器人-设计.md 附录 E）。
 *
 * 后台为「某位管理员」或「某个分站」生成二维码 → 用要绑定的那个微信扫码确认（或把链接发给对方、在微信里点开）→
 * 本进程在后台长轮询扫码状态 → 确认后：建 / 复用会话（adapter = ilink，external_id = ilink_bot_id）、加密保存凭据、
 * （管理员绑定）把这个微信登记成该管理员的身份 → 立刻起收消息循环（不等下一次 tick）。
 *
 * - 绑定流程（session）只在进程内存里（globalThis），8 分钟过期；二维码过期自动换新，最多 3 次（与腾讯插件一致）。
 * - 服务端要求「配对码」时（need_verifycode），页面让输入手机微信上显示的数字，下一轮轮询带上；输错三次换码。
 * - 同一个微信再扫（我们上送了本站已有绑定的 token）→ 服务端回 binded_redirect，不会重复建。
 * - 管理员绑定可以同时开「允许提卡补货」（只有扫码的这个微信能用）；之后也能在「会话」里改。
 * - 每次绑定成功写审计（bot.admin.ilink_bind）并抄送企业微信（bot.sensitive）：万一二维码被别人先扫了，站长马上能看到。
 */
import { randomBytes } from 'crypto'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { notify } from '../notify'
import { fetchBindQr, ilinkBase, ilinkBaseOverridden, pollBindStatus, type BindStatusResult } from './adapters/ilink-api'
import { recentBindingTokens, writeBinding } from './adapters/ilink-store'
import { qrSvgDataUrl } from './qr-svg'

const SESSION_TTL_MS = 8 * 60_000
const MAX_QR_REFRESH = 3
const MAX_ACTIVE_SESSIONS = 3
/** 结束后的绑定流程再留 10 分钟给页面取结果 */
const KEEP_FINISHED_MS = 10 * 60_000

export type IlinkBindState = 'WAITING' | 'SCANNED' | 'NEED_CODE' | 'DONE' | 'ALREADY' | 'EXPIRED' | 'ERROR' | 'CANCELLED'

export interface IlinkBindTarget {
  kind: 'MGMT' | 'TENANT'
  /** MGMT：绑成这位管理员的微信身份 */
  adminId: number | null
  /** TENANT：绑给这个分站 */
  tenantId: number | null
  /** MGMT 才有意义：允许在这个微信里提卡、补货 */
  allowT3: boolean
  /** 会话名（后台展示）与审计里的「绑定给谁」 */
  name: string
  actorUserId: number | null
}

interface Session extends IlinkBindTarget {
  id: string
  qrcode: string
  link: string
  qr: string
  base: string
  state: IlinkBindState
  message: string | null
  pendingCode: string | null
  codeWrong: boolean
  refreshes: number
  errors: number
  startedAt: number
  expiresAt: number
  finishedAt: number | null
  conversationId: number | null
  abort: AbortController
}

export interface IlinkBindView {
  id: string
  kind: 'MGMT' | 'TENANT'
  name: string
  state: IlinkBindState
  /** 二维码图片（SVG data URL）；结束后不再给 */
  qr: string | null
  /** 在微信里点开即可绑定的链接；结束后不再给 */
  link: string | null
  message: string | null
  codeWrong: boolean
  conversationId: number | null
  expiresAt: string
}

const g = globalThis as unknown as { __botIlinkBind?: Map<string, Session> }
const sessions = (g.__botIlinkBind ||= new Map<string, Session>())

const FINAL: readonly IlinkBindState[] = ['DONE', 'ALREADY', 'EXPIRED', 'ERROR', 'CANCELLED']

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(t)
      signal.removeEventListener('abort', done)
      resolve()
    }
    const t = setTimeout(done, ms)
    t.unref?.()
    signal.addEventListener('abort', done, { once: true })
  })
}

function purge(now = Date.now()): void {
  Array.from(sessions.entries()).forEach(([id, s]) => {
    if (s.finishedAt && now - s.finishedAt > KEEP_FINISHED_MS) sessions.delete(id)
    else if (!s.finishedAt && now > s.expiresAt + 60_000) {
      s.abort.abort()
      sessions.delete(id)
    }
  })
}

/** 腾讯给的地址只认 https + qq.com 域名，别的一律不用（凭据会发到这个地址去） */
export function safeIlinkBase(raw: string | undefined | null): string | null {
  if (!raw) return null
  const v = raw.trim().replace(/\/+$/, '')
  return /^https:\/\/([a-z0-9-]+\.)+qq\.com(:\d{2,5})?(\/[A-Za-z0-9._\-/]*)?$/i.test(v) ? v : null
}

function finish(s: Session, state: IlinkBindState, message: string | null): void {
  s.state = state
  s.message = message
  s.finishedAt = Date.now()
}

export function viewOf(s: Session): IlinkBindView {
  const done = FINAL.includes(s.state)
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    state: s.state,
    qr: done ? null : s.qr,
    link: done ? null : s.link,
    message: s.message,
    codeWrong: s.codeWrong,
    conversationId: s.conversationId,
    expiresAt: new Date(s.expiresAt).toISOString(),
  }
}

/** 开始一次绑定：取二维码、起后台轮询。onBound：绑定落库后调（路由传「立刻起收消息循环」进来，免得这里 import 入站） */
export async function startIlinkBind(target: IlinkBindTarget, onBound: () => Promise<unknown>): Promise<{ ok: true; view: IlinkBindView } | { ok: false; error: string }> {
  purge()
  const active = Array.from(sessions.values()).filter((s) => !s.finishedAt)
  if (active.length >= MAX_ACTIVE_SESSIONS) return { ok: false, error: `同时进行中的绑定最多 ${MAX_ACTIVE_SESSIONS} 个，请先完成或取消已有的` }
  const qr = await fetchBindQr(await recentBindingTokens(10))
  if (!qr.ok) return { ok: false, error: qr.error }
  const now = Date.now()
  const s: Session = {
    ...target,
    id: randomBytes(12).toString('hex'),
    qrcode: qr.qrcode,
    link: qr.link,
    qr: qrSvgDataUrl(qr.link),
    base: ilinkBase(),
    state: 'WAITING',
    message: null,
    pendingCode: null,
    codeWrong: false,
    refreshes: 1,
    errors: 0,
    startedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    finishedAt: null,
    conversationId: null,
    abort: new AbortController(),
  }
  sessions.set(s.id, s)
  void pollLoop(s, onBound).catch((e) => {
    console.error('[bot] iLink 绑定轮询异常', (e as Error)?.message)
    if (!s.finishedAt) finish(s, 'ERROR', '绑定过程出错，请重新生成二维码')
  })
  return { ok: true, view: viewOf(s) }
}

export function getIlinkBind(id: string): IlinkBindView | null {
  purge()
  const s = sessions.get(id)
  return s ? viewOf(s) : null
}

export function submitIlinkBindCode(id: string, code: string): { ok: true } | { ok: false; error: string } {
  const s = sessions.get(id)
  if (!s || s.finishedAt) return { ok: false, error: '这次绑定已经结束或过期，请重新生成二维码' }
  if (s.state !== 'NEED_CODE') return { ok: false, error: '现在不需要输入数字' }
  if (!/^\d{4,8}$/.test(code)) return { ok: false, error: '请输入手机微信上显示的数字' }
  s.pendingCode = code
  s.codeWrong = false
  s.message = '已提交，正在核对…'
  return { ok: true }
}

export function cancelIlinkBind(id: string): boolean {
  const s = sessions.get(id)
  if (!s || s.finishedAt) return false
  s.abort.abort()
  finish(s, 'CANCELLED', '已取消')
  return true
}

async function refreshQr(s: Session): Promise<boolean> {
  if (s.refreshes >= MAX_QR_REFRESH) return false
  const qr = await fetchBindQr(await recentBindingTokens(10))
  if (!qr.ok) return false
  s.refreshes++
  s.qrcode = qr.qrcode
  s.link = qr.link
  s.qr = qrSvgDataUrl(qr.link)
  s.state = 'WAITING'
  s.pendingCode = null
  return true
}

async function pollLoop(s: Session, onBound: () => Promise<unknown>): Promise<void> {
  while (!s.abort.signal.aborted && Date.now() < s.expiresAt) {
    if (s.state === 'NEED_CODE' && !s.pendingCode) {
      await sleep(1000, s.abort.signal) // 等页面上输入数字
      continue
    }
    const r = await pollBindStatus(s.base, s.qrcode, s.pendingCode, s.abort.signal)
    if (s.abort.signal.aborted) return
    switch (r.status) {
      case 'wait':
        break
      case 'scaned':
        s.state = 'SCANNED'
        s.message = '已扫码，请在手机微信上确认'
        s.pendingCode = null
        break
      case 'need_verifycode':
        if (s.pendingCode) s.codeWrong = true // 带着数字来的还要数字：上次输错了
        s.pendingCode = null
        s.state = 'NEED_CODE'
        s.message = s.codeWrong ? '数字不对，请重新输入手机微信上显示的数字' : '请输入手机微信上显示的数字'
        break
      case 'verify_code_blocked':
        if (!(await refreshQr(s))) return finish(s, 'ERROR', '数字多次输错，请稍后重新生成二维码')
        s.message = '数字多次输错，已换了一个新二维码，请重新扫码'
        break
      case 'expired':
        if (!(await refreshQr(s))) return finish(s, 'EXPIRED', '二维码多次过期，请重新生成')
        s.message = '二维码过期了，已自动换新，请扫新的'
        break
      case 'scaned_but_redirect': {
        const host = r.redirectHost && /^([a-z0-9-]+\.)+qq\.com$/i.test(r.redirectHost) ? `https://${r.redirectHost}` : null
        if (host && !ilinkBaseOverridden()) s.base = host
        break
      }
      case 'binded_redirect':
        return finish(s, 'ALREADY', '这个微信已经绑定过本站了（在「会话」列表里），不需要重复绑定')
      case 'confirmed':
        return finalize(s, r, onBound)
      case 'error':
        s.errors++
        if (s.errors >= 5) return finish(s, 'ERROR', `查询扫码状态一直失败：${r.error || '未知错误'}`)
        await sleep(2000, s.abort.signal)
        break
    }
    await sleep(1000, s.abort.signal)
  }
  if (!s.finishedAt && !s.abort.signal.aborted) finish(s, 'EXPIRED', '超过 8 分钟没有完成，请重新生成二维码')
}

async function finalize(s: Session, r: BindStatusResult, onBound: () => Promise<unknown>): Promise<void> {
  if (!r.botId || !r.botToken || !r.userId) return finish(s, 'ERROR', '微信确认了，但没有返回完整的绑定凭据，请重试')
  const now = new Date()
  if (s.kind === 'MGMT') {
    const taken = await prisma.botAdminIdentity.findUnique({ where: { adapter_wxid: { adapter: 'ilink', wxid: r.userId } } })
    if (taken && taken.adminId !== s.adminId) return finish(s, 'ERROR', '这个微信已经登记成另一位管理员的身份了；如要改绑，先在「管理员」页停用那条身份')
  }
  const allowT3 = s.kind === 'MGMT' && s.allowT3
  const conv = await prisma.botConversation.upsert({
    where: { adapter_externalId: { adapter: 'ilink', externalId: r.botId } },
    create: { adapter: 'ilink', externalId: r.botId, name: s.name.slice(0, 100), kind: s.kind, tenantId: s.tenantId, status: 'ACTIVE', allowT3, boundBy: s.adminId, boundAt: now },
    update: { name: s.name.slice(0, 100), kind: s.kind, tenantId: s.tenantId, status: 'ACTIVE', allowT3, boundBy: s.adminId, boundAt: now, failStreak: 0 },
  })
  await writeBinding({
    convId: conv.id,
    botId: r.botId,
    userId: r.userId,
    baseUrl: safeIlinkBase(r.baseUrl),
    token: r.botToken,
    cursor: '',
    ctxToken: null,
    ctxAt: null,
    lastInboundAt: null,
    boundAt: now.toISOString(),
    staleAt: null,
  })
  if (s.kind === 'MGMT' && s.adminId) {
    await prisma.botAdminIdentity.upsert({
      where: { adapter_wxid: { adapter: 'ilink', wxid: r.userId } },
      create: { adminId: s.adminId, adapter: 'ilink', wxid: r.userId, nickname: null },
      update: { adminId: s.adminId, enabled: true },
    })
  }
  s.conversationId = conv.id
  finish(
    s,
    'DONE',
    s.kind === 'MGMT'
      ? '绑定成功！请在微信里打开刚绑定的 ClawBot 对话，发一句「帮助」——微信规定要你先发一条消息，之后推送和指令就都通了。'
      : '绑定成功！请让对方在微信里给刚绑定的 ClawBot 发一句话（任意内容），之后就会收到本分站的推送。'
  )
  await writeAudit(null, {
    actorUserId: s.actorUserId,
    actorKind: 'PLATFORM',
    action: 'bot.admin.ilink_bind',
    targetType: 'bot_conversation',
    targetId: String(conv.id),
    diff: { kind: s.kind, adminId: s.adminId, tenantId: s.tenantId, allowT3, name: s.name },
  }).catch((e) => console.error('[bot] 写审计失败', (e as Error)?.message))
  notify('bot.sensitive', [
    { label: '操作', value: s.kind === 'MGMT' ? '后台把一个微信绑定成了管理员身份（iLink）' : '后台给分站绑定了一个接收推送的微信（iLink）' },
    { label: '绑定给', value: s.name },
    ...(s.kind === 'MGMT' ? [{ label: '提卡补货', value: allowT3 ? '允许' : '不允许' }] : []),
    { label: '提示', value: '不是你本人操作的，请立刻到后台「微信机器人 → 会话」解绑' },
  ])
  await onBound().catch((e) => console.error('[bot] 绑定后起收消息循环失败', (e as Error)?.message))
}
