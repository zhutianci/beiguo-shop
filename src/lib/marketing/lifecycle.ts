/**
 * 活动生命周期：检查、发送（launch）、暂停/继续/取消/撤回定时/重新排队。
 * **所有活动状态写入都是 CAS**（updateMany where status in 允许的来源态，检查 count），见设计文档 5.1。
 *
 * 【实现方：发送引擎】签名是契约。后台接口只做参数校验与鉴权，然后调这里。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { notifyMarketing, fmtTime } from '@/lib/notify'
import { audit } from './audit'
import { previewAudience } from './audience'
import { estimateEta } from './budget'
import { dryRunRefused, getConfig, getHalt, isDryRun, isHalted, senderReady } from './config'
import { couponExposure, createCampaignCouponBatch, retireEmptyBatch } from './coupon'
import { contentHash } from './hash'
import { hasErrors } from './lint'
import { REQUEUEABLE_FAILED_CODES, UNKNOWN_NOT_FOUND_CODE } from './policy'
import { freezeSnapshot, grantBlockOf, renderForAdminPreview } from './snapshot'
import { bjDateToEnd } from './time'
import {
  CAMPAIGN_STATUS_LABEL,
  TOPICS,
  audienceSpecSchema,
  clip,
  emailDocSchema,
  type AudiencePreview,
  type AudienceSpec,
  type CampaignStatus,
  type CheckResult,
  type EmailDoc,
  type LintIssue,
  type Topic,
} from './types'

export class LifecycleError extends Error {
  /** HTTP 状态码建议：400 参数/检查不通过，404 不存在，409 状态冲突或人数/内容指纹变了 */
  status: number
  /** 409 时附带的最新数据（如新的可发人数、最新 contentHash） */
  payload?: unknown
  constructor(message: string, status = 400, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

/** 条件更新活动状态；返回是否成功（count===1） */
export async function transitionCampaign(
  id: number,
  from: CampaignStatus[],
  to: CampaignStatus,
  data: Record<string, unknown> = {}
): Promise<boolean> {
  const r = await prisma.marketingCampaign.updateMany({
    where: { id, status: { in: from } },
    data: { ...data, status: to } as Prisma.MarketingCampaignUpdateManyMutationInput,
  })
  return r.count === 1
}

/* ============================== 解析活动行 ============================== */

interface CampaignRow {
  id: number
  name: string
  topic: string
  subject: string
  preheader: string | null
  doc: string
  audience: string
  status: string
  testedHash: string | null
}

interface ParsedCampaign {
  doc: EmailDoc | null
  spec: AudienceSpec | null
  topic: Topic | null
  issues: LintIssue[]
  /** zod 规范化后的文档算出的指纹（对外给出的就是这个） */
  hash: string | null
  /** 按库里原样 JSON 算出的指纹（旧数据可能不是 zod 输出顺序，两种都认） */
  rawHash: string | null
}

function parseCampaign(c: CampaignRow): ParsedCampaign {
  const issues: LintIssue[] = []
  let raw: unknown = null
  let doc: EmailDoc | null = null
  try {
    raw = JSON.parse(c.doc)
    const r = emailDocSchema.safeParse(raw)
    if (r.success) doc = r.data
    else issues.push({ level: 'error', code: 'DOC_INVALID', message: `邮件内容不完整：${r.error.errors[0].message}` })
  } catch {
    issues.push({ level: 'error', code: 'DOC_INVALID', message: '邮件内容格式损坏，请在编辑器里重新保存' })
  }
  let spec: AudienceSpec | null = null
  try {
    const r = audienceSpecSchema.safeParse(JSON.parse(c.audience))
    if (r.success) spec = r.data
    else issues.push({ level: 'error', code: 'AUDIENCE_INVALID', message: `受众设置不正确：${r.error.errors[0].message}` })
  } catch {
    issues.push({ level: 'error', code: 'AUDIENCE_INVALID', message: '受众设置格式损坏，请重新选择受众' })
  }
  const topic = (TOPICS as readonly string[]).includes(c.topic) ? (c.topic as Topic) : null
  if (!topic) issues.push({ level: 'error', code: 'TOPIC_INVALID', message: '邮件主题分类不正确' })
  const base = { topic: c.topic, subject: c.subject, preheader: c.preheader }
  const hash = doc ? contentHash({ ...base, doc }) : null
  const rawHash = raw && typeof raw === 'object' ? contentHash({ ...base, doc: raw as EmailDoc }) : null
  return { doc, spec, topic, issues, hash, rawHash }
}

function hashMatches(p: ParsedCampaign, h: string | null | undefined): boolean {
  if (!h) return false
  return h === p.hash || h === p.rawHash
}

/** 活动当前内容的指纹（后台详情 / 测试发送写 testedHash 时应与这里同口径：zod 规范化后的文档） */
export function campaignContentHash(c: { topic: string; subject: string; preheader: string | null; doc: string }): string | null {
  try {
    const r = emailDocSchema.safeParse(JSON.parse(c.doc))
    return r.success ? contentHash({ topic: c.topic, subject: c.subject, preheader: c.preheader, doc: r.data }) : null
  } catch {
    return null
  }
}

const EMPTY_AUDIENCE: AudiencePreview = { matched: 0, eligible: 0, excluded: {}, freqCapEstimate: 0, sample: [] }

function sortIssues(list: LintIssue[]): LintIssue[] {
  const seen = new Set<string>()
  const out: LintIssue[] = []
  for (const i of list) {
    const k = `${i.level}|${i.code}|${i.blockId ?? ''}|${i.message}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(i)
  }
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

const UNTIL_AFTER_FINISH_MS = 72 * 3600_000

/* ============================== 检查 ============================== */

/** 完整检查（lint + 服务端解析 + 受众预估 + ETA + 券让利 + 是否已测试最新内容） */
export async function checkCampaign(id: number, opts: { scheduledAt?: Date | null } = {}): Promise<CheckResult> {
  const c = await prisma.marketingCampaign.findUnique({ where: { id } })
  if (!c) throw new LifecycleError('活动不存在', 404)
  const now = new Date()
  const cfg = await getConfig()
  const p = parseCampaign(c)
  const issues: LintIssue[] = [...p.issues]

  if (c.status !== 'DRAFT') {
    const label = CAMPAIGN_STATUS_LABEL[c.status as CampaignStatus] || c.status
    issues.push({ level: 'error', code: 'NOT_DRAFT', message: `活动当前是「${label}」，只有草稿可以发送` })
  }

  const s = opts.scheduledAt
  const at = s && !Number.isNaN(s.getTime()) && s.getTime() > now.getTime() ? s : now

  let audience: AudiencePreview = EMPTY_AUDIENCE
  if (p.spec && p.topic) audience = await previewAudience(p.spec, p.topic, { at })

  if (p.doc && p.topic) {
    // 与冻结快照同一套检查：内容 lint + 商品/券解析 + 渲染后产物扫描（禁发词、体积、图片数）。
    // sendFrom = 实际开始发送的时刻（定时就按定时算）：领取券要在那一刻已经开始（审查 C12）
    const prev = await renderForAdminPreview({ doc: p.doc, subject: c.subject, preheader: c.preheader || '', topic: p.topic, sendFrom: at })
    issues.push(...prev.issues)
  }

  // —— 服务端补充（设计 7.4 最后两行错误）——
  if (!cfg.contactEmail) {
    issues.push({ level: 'error', code: 'NO_CONTACT_EMAIL', message: '发送设置里还没有填写能收信的联系邮箱（页脚法定联系方式，也用作回复地址）' })
  }
  if (!senderReady()) {
    issues.push({ level: 'error', code: 'NO_SENDER', message: '营销发信地址（ALIYUN_DM_MARKETING）或阿里云 AccessKey 未配置' })
  }
  if (dryRunRefused()) {
    issues.push({ level: 'warn', code: 'DRY_RUN_REFUSED', message: 'MARKETING_DRY_RUN 已设置但数据库不是开发/测试库，演练模式未生效：会真实发送' })
  } else if (isDryRun()) {
    issues.push({ level: 'warn', code: 'DRY_RUN', message: '当前为演练模式（MARKETING_DRY_RUN）：不会真的发出邮件' })
  }
  const testedCurrent = hashMatches(p, c.testedHash)
  if (!testedCurrent) {
    issues.push({
      level: 'error',
      code: 'NOT_TESTED',
      message: c.testedHash ? '内容改过之后还没有重新发送测试邮件' : '还没有发送过测试邮件：请先发一封给自己看看效果',
    })
  }
  if (p.spec && audience.eligible === 0) {
    issues.push({ level: 'error', code: 'NO_RECIPIENTS', message: '可发人数为 0：请调整受众' })
  }
  if (!cfg.enabled) {
    issues.push({ level: 'warn', code: 'DISABLED', message: '营销发送总开关已关闭：发送后会排队，打开开关才会真正发出' })
  }
  const halt = await getHalt()
  if (isHalted(halt, now)) {
    issues.push({
      level: 'warn',
      code: 'HALTED',
      message: `全局急停中（${halt.reason || '原因未知'}）${halt.until && !Number.isNaN(Date.parse(halt.until)) ? `，至 ${fmtTime(halt.until)}` : ''}`,
    })
  }

  const eta = await estimateEta(cfg, audience.eligible, at, c.id)

  let coupon: CheckResult['coupon'] = null
  const grant = p.doc ? grantBlockOf(p.doc) : null
  if (grant) {
    coupon = couponExposure(grant, audience.eligible)
    // 设计 7.4 警告行：直发券面额 ≥ 适用商品最低价的 30%（审查 C10）。
    // 无门槛 ¥20 券 + ¥19.9 的商品 = 人人 0.01 元拿走；只提醒不拦（有时就是要送），放在这里是因为 lint 是纯函数、查不了库
    const g = grant.grant
    if (g && Number.isFinite(g.discount) && g.discount > 0) {
      const where: Prisma.ProductWhereInput =
        g.kind === 'PRODUCT'
          ? { id: { in: g.productIds.length ? g.productIds : [-1] }, status: 1 }
          : { status: 1, ...(g.minAmount > 0 ? { price: { gte: g.minAmount } } : {}) }
      const cheapest = await prisma.product.findFirst({ where, orderBy: { price: 'asc' }, select: { name: true, price: true } })
      // 按分比较，避免 0.1 + 0.2 之类的浮点误差
      const minCents = cheapest ? Math.round(Number(cheapest.price) * 100) : 0
      const discountCents = Math.round(g.discount * 100)
      if (cheapest && minCents > 0 && discountCents * 10 >= minCents * 3) {
        issues.push({
          level: 'warn',
          code: 'COUPON_GENEROUS',
          message: `券面额 ¥${(discountCents / 100).toFixed(2)} 已达适用商品最低价「${cheapest.name}」¥${(minCents / 100).toFixed(2)} 的 ${Math.round((discountCents / minCents) * 100)}%（≥30%），请确认优惠力度`,
          blockId: grant.id,
        })
      }
    }
    const v = grant.grant?.validity
    if (v?.mode === 'until' && audience.eligible > 0) {
      const end = bjDateToEnd(v.date)
      if (eta.finishAt) {
        const finish = Date.parse(eta.finishAt)
        if (!Number.isNaN(end.getTime()) && end.getTime() < finish + UNTIL_AFTER_FINISH_MS) {
          issues.push({
            level: 'error',
            code: 'COUPON_UNTIL_TOO_EARLY',
            message: `券截止日期太早：预计 ${fmtTime(eta.finishAt)} 才能发完，截止日期至少要再晚 72 小时（或改用「到账后 N 天有效」）`,
            blockId: grant.id,
          })
        }
      } else {
        issues.push({
          level: 'warn',
          code: 'COUPON_UNTIL_NO_ETA',
          message: '估算不出发完时间，无法核对券截止日期是否够用；建议改用「到账后 N 天有效」',
          blockId: grant.id,
        })
      }
    }
  }

  const sorted = sortIssues(issues)
  return {
    issues: sorted,
    audience,
    eta,
    coupon,
    contentHash: p.hash || '',
    testedCurrent,
    canLaunch: c.status === 'DRAFT' && !!p.hash && !hasErrors(sorted),
  }
}

/* ============================== 发送 ============================== */

export interface LaunchInput {
  scheduledAt: Date | null
  expectedCount: number
  expectedContentHash: string
}

const MAX_SCHEDULE_AHEAD_MS = 90 * 86400_000

/**
 * 发送：重跑检查（有 error 就 400）→ 人数与 expectedCount 不符 / 内容指纹不符 → 409（payload 带新值）
 * → 事务内：建券批次（若有直发券）、冻结快照、写 links、CAS DRAFT→SCHEDULED；写审计 LAUNCH。
 */
export async function launchCampaign(id: number, input: LaunchInput, actorId: number): Promise<void> {
  const now = new Date()
  let scheduledAt = now
  if (input.scheduledAt) {
    const t = input.scheduledAt.getTime()
    if (Number.isNaN(t)) throw new LifecycleError('定时时间不正确')
    if (t < now.getTime() - 5 * 60_000) throw new LifecycleError('定时时间已经过去，请重新选择')
    if (t > now.getTime() + MAX_SCHEDULE_AHEAD_MS) throw new LifecycleError('定时最多提前 90 天')
    scheduledAt = t > now.getTime() ? input.scheduledAt : now
  }

  // 先把「要冻结的那一版」读出来：后面的检查、快照、CAS 都钉在这一版的 updatedAt 上，
  // 中途有人改稿（或点了测试）→ CAS 失败 → 409，绝不会冻结一版没检查过的内容
  const c = await prisma.marketingCampaign.findUnique({ where: { id } })
  if (!c) throw new LifecycleError('活动不存在', 404)
  if (c.status !== 'DRAFT') throw new LifecycleError('活动已经发送或状态已变化，请刷新页面', 409)
  const p = parseCampaign(c)
  if (!p.doc || !p.spec || !p.topic || !p.hash) {
    throw new LifecycleError(p.issues[0]?.message || '活动内容不完整', 400, { issues: p.issues })
  }

  const check = await checkCampaign(id, { scheduledAt })
  if (check.contentHash !== p.hash) {
    throw new LifecycleError('内容刚刚被修改，请重新检查后再发送', 409, { eligible: check.audience.eligible, contentHash: check.contentHash })
  }
  const firstError = check.issues.find((i) => i.level === 'error')
  if (firstError) throw new LifecycleError(firstError.message, 400, { issues: check.issues })
  if (check.audience.eligible !== input.expectedCount || !hashMatches(p, input.expectedContentHash)) {
    throw new LifecycleError('可发人数或邮件内容已变化，请重新检查后再发送', 409, {
      eligible: check.audience.eligible,
      contentHash: check.contentHash,
    })
  }

  const snap = await freezeSnapshot(
    { id, topic: p.topic, subject: c.subject, preheader: c.preheader, doc: p.doc },
    null,
    { sendFrom: scheduledAt }
  )
  const snapError = snap.issues.find((i) => i.level === 'error')
  if (snapError) throw new LifecycleError(snapError.message, 400, { issues: snap.issues })

  const grant = grantBlockOf(p.doc)
  let couponId: number | null = null
  await prisma.$transaction(
    async (tx) => {
      if (grant) couponId = await createCampaignCouponBatch(tx, id, grant, scheduledAt)
      // 之前撤回定时时已清过；再清一次保证 (campaignId, idx) 与这次快照一一对应
      await tx.marketingLink.deleteMany({ where: { campaignId: id } })
      // 草稿一封都没发过，它名下的行全是残留（上一次物化到一半进程被杀、随后撤回定时）：不删的话，
      // 下一次物化 skipDuplicates 会让旧受众的行压过新受众，发给不该收的人（审查 C3）
      await tx.marketingMessage.deleteMany({ where: { campaignId: id } })
      if (snap.links.length) {
        await tx.marketingLink.createMany({
          data: snap.links.map((l) => ({ campaignId: id, idx: l.idx, url: l.url, label: clip(l.label, 120) || null })),
        })
      }
      const r = await tx.marketingCampaign.updateMany({
        where: { id, status: 'DRAFT', updatedAt: c.updatedAt },
        data: {
          status: 'SCHEDULED',
          scheduledAt,
          html: snap.html,
          text: snap.text,
          finalSubject: clip(snap.finalSubject, 255),
          refs: JSON.stringify({ ...snap.refs, couponId }),
          contentHash: p.hash,
          couponId,
          statusNote: null,
          materializedAt: null,
          startedAt: null,
          completedAt: null,
          recipientCount: 0,
          breakerResetAt: null,
          canaryDay: null,
          failStreak: 0,
        },
      })
      // 事务回滚会把刚建的券批次与 links 一起撤掉
      if (r.count !== 1) throw new LifecycleError('活动刚刚被修改或已经发送，请刷新后重试', 409)
    },
    { timeout: 20_000 }
  )

  await audit('LAUNCH', {
    actorId,
    campaignId: id,
    detail: {
      scheduledAt: scheduledAt.toISOString(),
      eligible: check.audience.eligible,
      contentHash: p.hash,
      couponId,
      links: snap.links.length,
    },
  })
}

/* ============================== 控制 ============================== */

export type ControlAction = 'pause' | 'resume' | 'cancel' | 'unschedule' | 'requeue'

function statusLabel(s: string): string {
  return CAMPAIGN_STATUS_LABEL[s as CampaignStatus] || s
}

/** 后台控制动作（规则见设计 5.1 表格）。返回给界面看的一句话结果 */
export async function controlCampaign(id: number, action: ControlAction, actorId: number): Promise<{ message: string }> {
  const c = await prisma.marketingCampaign.findUnique({
    where: { id },
    select: { id: true, status: true, materializedAt: true, couponId: true },
  })
  if (!c) throw new LifecycleError('活动不存在', 404)
  const now = new Date()

  switch (action) {
    case 'pause': {
      const ok = await transitionCampaign(id, ['SCHEDULED', 'SENDING'], 'PAUSED', { statusNote: '管理员手动暂停' })
      if (!ok) throw new LifecycleError(`活动当前是「${statusLabel(c.status)}」，不能暂停`, 409)
      await audit('PAUSE', { actorId, campaignId: id })
      return { message: '已暂停：正在发送的那一封发完后即停止' }
    }

    case 'resume': {
      if (c.status !== 'PAUSED') throw new LifecycleError(`活动当前是「${statusLabel(c.status)}」，不需要继续`, 409)
      // 已物化 → 回到发送中；没物化（定时还没到就暂停了）→ 回到待发送，到点由 worker 物化。
      // 熔断统计从现在重新起算、今日试探重新做、失败计数清零 —— 否则一恢复就被同一批旧数据再次熔断
      const to: CampaignStatus = c.materializedAt ? 'SENDING' : 'SCHEDULED'
      const ok = await transitionCampaign(id, ['PAUSED'], to, {
        statusNote: null,
        breakerResetAt: now,
        canaryDay: null,
        failStreak: 0,
      })
      if (!ok) throw new LifecycleError('活动状态刚刚变化，请刷新后重试', 409)
      await audit('RESUME', { actorId, campaignId: id, detail: { to } })
      return { message: to === 'SENDING' ? '已继续发送' : '已恢复为待发送，到点后自动开始' }
    }

    case 'cancel': {
      const cancelled = await prisma.$transaction(async (tx) => {
        const r = await tx.marketingCampaign.updateMany({
          where: { id, status: { in: ['SCHEDULED', 'SENDING', 'PAUSED'] } },
          data: { status: 'CANCELLED', statusNote: '管理员取消' },
        })
        if (r.count !== 1) throw new LifecycleError(`活动当前是「${statusLabel(c.status)}」，不能取消`, 409)
        // 同事务把还没发的行全部取消；正在 SENDING 的那一封（至多一封）照常落定。
        // worker 每趟还会再扫一次（防物化中途被取消时新插入的行）
        const rows = await tx.marketingMessage.updateMany({
          where: { campaignId: id, status: { in: ['QUEUED', 'CLAIMED'] } },
          data: { status: 'CANCELLED' },
        })
        return rows.count
      })
      // 一张都没发出去的直发券批次置 ENDED（已发出的券是买家的，不动）
      if (c.couponId) await retireEmptyBatch(c.couponId, 'end').catch(() => {})
      await audit('CANCEL', { actorId, campaignId: id, detail: { cancelledRows: cancelled } })
      return { message: cancelled ? `已取消，${cancelled} 封未发出的邮件不会再发送` : '已取消' }
    }

    case 'unschedule': {
      if (c.status !== 'SCHEDULED' || c.materializedAt) {
        throw new LifecycleError('只有还没开始发送的定时活动可以撤回为草稿', 409)
      }
      await prisma.$transaction(async (tx) => {
        const r = await tx.marketingCampaign.updateMany({
          where: { id, status: 'SCHEDULED', materializedAt: null },
          data: {
            status: 'DRAFT',
            scheduledAt: null,
            html: null,
            text: null,
            finalSubject: null,
            refs: null,
            contentHash: null,
            couponId: null,
            statusNote: null,
            recipientCount: 0,
            // testedHash 保留：内容没改的话不用重新测试
          },
        })
        if (r.count !== 1) throw new LifecycleError('活动已经开始发送或状态已变化，无法撤回', 409)
        await tx.marketingLink.deleteMany({ where: { campaignId: id } })
        // 没物化完的活动一封都没发过：物化到一半留下的 QUEUED/SKIPPED 行一并删掉，草稿不带行（审查 C3）
        await tx.marketingMessage.deleteMany({ where: { campaignId: id } })
      })
      if (c.couponId) await retireEmptyBatch(c.couponId, 'delete').catch(() => {})
      await audit('UNSCHEDULE', { actorId, campaignId: id })
      return { message: '已撤回为草稿，可以继续编辑' }
    }

    case 'requeue': {
      if (!['SENDING', 'PAUSED', 'COMPLETED'].includes(c.status)) {
        throw new LifecycleError('只有发送中、已暂停或已完成的活动可以重新排队', 409)
      }
      // 只重排「确定没被阿里云受理」的两类：连接失败/临时错误重试耗尽的 FAILED，
      // 以及 sync 对账 2 小时仍查无记录的 UNKNOWN。其他 UNKNOWN 阿里云可能已受理，重排会双发
      const count = await prisma.$transaction(async (tx) => {
        // 锁住活动行再读状态（审查 C2）：普通读不加锁，worker 的「完成检测」可能恰好在读之后、改行之前把活动
        // 提交成 COMPLETED，这边却按读到的 SENDING 不做回退 → 已完成的活动里留下永远没人发的 QUEUED 行。
        // 两边都先锁活动行、再碰消息行，顺序一致不会死锁：worker 先提交 → 这里读到 COMPLETED 走回退；
        // 这里先拿到锁 → worker 的 UPDATE 等本事务提交后再看 NOT EXISTS，看到新排队的行就不会完成
        const locked = await tx.$queryRaw<{ status: string }[]>`SELECT status FROM marketing_campaigns WHERE id = ${id} FOR UPDATE`
        const cur = locked[0]
        if (!cur || !['SENDING', 'PAUSED', 'COMPLETED'].includes(cur.status)) {
          throw new LifecycleError('活动状态刚刚变化，请刷新后重试', 409)
        }
        const r = await tx.marketingMessage.updateMany({
          where: {
            campaignId: id,
            OR: [
              { status: 'FAILED', errorCode: { in: REQUEUEABLE_FAILED_CODES } },
              { status: 'UNKNOWN', errorCode: UNKNOWN_NOT_FOUND_CODE },
            ],
          },
          data: {
            status: 'QUEUED',
            attempts: 0,
            nextAttemptAt: null,
            claimedAt: null,
            sentAt: null,
            subjectSent: null,
            sender: null,
            envId: null,
            errorCode: null,
            errorMsg: null,
            delivery: null,
            deliveryDetail: null,
            deliveryAt: null,
          },
        })
        if (r.count > 0 && cur.status === 'COMPLETED') {
          const back = await tx.marketingCampaign.updateMany({
            where: { id, status: 'COMPLETED' },
            data: { status: 'SENDING', completedAt: null, statusNote: null },
          })
          if (back.count !== 1) throw new LifecycleError('活动状态刚刚变化，请刷新后重试', 409)
        }
        return r.count
      })
      if (!count) {
        return { message: '没有可以重新排队的邮件（只有连接失败类的失败、以及阿里云查无记录的「结果未知」可以重排）' }
      }
      await audit('REQUEUE', { actorId, campaignId: id, detail: { count } })
      return { message: `已重新排队 ${count} 封${c.status === 'PAUSED' ? '（活动仍处于暂停，继续发送后才会发出）' : ''}` }
    }

    default:
      throw new LifecycleError('未知操作')
  }
}

/** 系统自动暂停（熔断、内容错误、券失效、商品变更）：仅对 SCHEDULED/SENDING 生效；写审计 AUTO_PAUSE；发通知 */
export async function autoPauseCampaign(id: number, reason: string): Promise<boolean> {
  const note = clip(reason, 500) || '系统自动暂停'
  const ok = await transitionCampaign(id, ['SCHEDULED', 'SENDING'], 'PAUSED', { statusNote: note })
  if (!ok) return false
  await audit('AUTO_PAUSE', { campaignId: id, detail: { reason: note } })
  const c = await prisma.marketingCampaign.findUnique({ where: { id }, select: { name: true } }).catch(() => null)
  notifyMarketing('paused', { campaignId: id, campaignName: c?.name ?? null, reason: note })
  return true
}
