/**
 * 测试发送：只发给管理员账号邮箱 ∪ 配置里的测试收件人（≤5 个/次）；24 小时内总计 ≤30 封（按审计计数）；
 * 先跑内容检查（有错误不发）；抑制名单里的跳过；测试结果只记录，不触发暂停/急停。
 * 至少一封成功才把 campaign.testedHash 更新为当前内容指纹。
 *
 * 【实现方：后台接口】签名是契约。
 *
 * 【为什么收件人要限死】v1 审查（安全/合规）：不限收件人的「测试发送」就是一门绕过全部治理
 * （退订、抑制、频控、预热、熔断）的发信炮 —— 拿到后台会话的人可以借营销通道给任意地址发任意内容。
 * 所以收件人只能是「管理员自己的账号邮箱」或站长在设置页预先登记的测试邮箱，并且按库里的审计记录限量。
 *
 * 【为什么测试结果不触发暂停/急停】测试发给的是自己的邮箱，一次 InvalidToAddress（比如管理员账号是
 * 测试域名）不代表营销队列有问题；让它去停掉正在发的活动或全局急停，是用测试噪声干扰生产发送。
 * 分类（classifySend）只用来把阿里云的错误码翻译成一句人话。
 */
import { prisma } from '@/lib/db'
import { siteOrigin } from '@/lib/news/format'
import {
  type LintIssue,
  type MarketingConfig,
  type SuppressionReason,
  type Topic,
  SUPPRESSION_REASON_LABEL,
  TOPICS,
} from './types'
import { getConfig, senderReady } from './config'
import { lintContent, hasErrors, safeNickname } from './lint'
import { buildTestEmail } from './snapshot'
import { sendMarketingMail, type SendAttempt } from './transport'
import { classifySend } from './policy'
import { loadSuppressed } from './consent'
import { contentHash } from './hash'
import { MarketingHttpError, parseStoredDoc } from './campaign-repo'

export interface TestSendResult {
  sent: { email: string; ok: boolean; note: string | null }[]
  issues: LintIssue[]
  testedCurrent: boolean
  remainingToday: number
}

/** 单次最多发几个地址 */
export const TEST_SEND_MAX_PER_CALL = 5
/** 滚动 24 小时内最多发几封（所有活动、所有管理员合计） */
export const TEST_SEND_CAP_24H = 30
const DAY_MS = 24 * 3600_000

const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/

function normEmail(s: string): string {
  return String(s || '').trim().toLowerCase()
}

function uniq(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of list) {
    if (s && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}

/* ============================== 允许的收件人 ============================== */

async function allowedFrom(config: Pick<MarketingConfig, 'testRecipients'>): Promise<string[]> {
  // 只认「当前可用」的管理员：被禁用或降级的账号邮箱不再是合法的测试收件人
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', status: 1, email: { not: null } },
    select: { email: true },
    orderBy: { id: 'asc' },
  })
  const list = admins.map((a) => normEmail(a.email || '')).concat((config.testRecipients || []).map(normEmail))
  return uniq(list.filter((e) => e.length <= 191 && EMAIL_RE.test(e)))
}

/** 允许的测试收件人（管理员账号邮箱 ∪ 配置 testRecipients），小写去重 */
export async function allowedTestRecipients(): Promise<string[]> {
  // 列表展示用非严格读：配置读不出来时仍能列出管理员邮箱（真正发送时会严格重读）
  const config = await getConfig()
  return allowedFrom(config)
}

/* ============================== 24 小时用量（按审计计数） ============================== */

/**
 * 滚动 24 小时内已经发出（含预占）的测试封数。
 * 审计 detail 是本模块写的 {count, ok}；解析不了的行按单次上限计 —— 宁可少发几封测试，不让上限失效。
 */
async function testSendsWithin24h(now: Date): Promise<number> {
  const rows = await prisma.marketingAudit.findMany({
    where: { action: 'TEST_SEND', createdAt: { gte: new Date(now.getTime() - DAY_MS) } },
    select: { detail: true },
  })
  let total = 0
  for (const r of rows) {
    let n = TEST_SEND_MAX_PER_CALL
    try {
      const d = r.detail ? JSON.parse(r.detail) : null
      const c = Number(d?.count)
      if (Number.isFinite(c) && c >= 0) n = Math.floor(c)
    } catch {
      /* 按上限计 */
    }
    total += n
  }
  return total
}

export async function testSendRemaining(now: Date = new Date()): Promise<number> {
  return Math.max(0, TEST_SEND_CAP_24H - (await testSendsWithin24h(now)))
}

/** GET /api/admin/marketing/campaigns/[id]/test 用 */
export async function testSendStatus(): Promise<{ allowed: string[]; remainingToday: number }> {
  const [allowed, remainingToday] = await Promise.all([allowedTestRecipients(), testSendRemaining()])
  return { allowed, remainingToday }
}

/**
 * 「查余量 + 预占」必须是一步：两个标签页同时点「发测试」，各自查到还剩 5 封、各自发 5 封，上限就被穿透了。
 * 单进程部署（app 容器只有一个），进程内串行足够；预占行先落库，发送中途进程被杀也照样算数。
 */
let capChain: Promise<unknown> = Promise.resolve()
function withCapLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = capChain.then(fn, fn)
  capChain = run.catch(() => undefined)
  return run
}

/* ============================== 发送 ============================== */

function issueKey(i: LintIssue): string {
  return `${i.level}|${i.code}|${i.blockId || ''}|${i.message}`
}

function mergeIssues(...lists: LintIssue[][]): LintIssue[] {
  const seen = new Set<string>()
  const out: LintIssue[] = []
  for (const list of lists) {
    for (const i of list) {
      const k = issueKey(i)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(i)
      }
    }
  }
  // 错误排在警告前面，界面上第一眼看到的是「为什么没发」
  return out.filter((i) => i.level === 'error').concat(out.filter((i) => i.level !== 'error'))
}

function firstError(issues: LintIssue[]): string {
  return issues.find((i) => i.level === 'error')?.message || '内容检查未通过'
}

/** 发送结果 → 给管理员看的一句话。只翻译，不做任何暂停 / 急停 */
function describeOutcome(r: SendAttempt): string | null {
  if (r.kind === 'ok') return r.dryRun ? 'dry-run：未实际发出（本地/预发环境）' : null
  let cls: { errorCode: string | null; note: string | null } | null = null
  try {
    cls = classifySend(r)
  } catch {
    cls = null
  }
  if (r.kind === 'unknown_error') return '结果未知：请求可能已被阿里云受理，请先查看收件箱，不要立刻重发'
  if (r.kind === 'connect_error') return '没有连上阿里云，邮件未发出，可稍后重试'
  const code = cls?.errorCode || r.code || 'Error'
  const note = cls?.note || r.message || ''
  const s = note ? `${code}：${note}` : code
  return s.length > 200 ? s.slice(0, 200) + '…' : s
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendCampaignTest(campaignId: number, emails: string[], actorId: number): Promise<TestSendResult> {
  const want = uniq((emails || []).map(normEmail).filter(Boolean))
  if (!want.length) throw new MarketingHttpError('请至少选择一个测试收件人')
  if (want.length > TEST_SEND_MAX_PER_CALL) throw new MarketingHttpError(`一次最多发给 ${TEST_SEND_MAX_PER_CALL} 个地址`)

  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, topic: true, subject: true, preheader: true, doc: true, testedHash: true, updatedAt: true },
  })
  if (!campaign) throw new MarketingHttpError('活动不存在', 404)

  // 真的要往外发信：配置必须严格读到（读不到就不发，不拿默认值凑合 —— 默认值里没有联系邮箱）
  let config: MarketingConfig
  try {
    config = await getConfig({ strict: true })
  } catch (e) {
    console.error(`[marketing/test] 活动 #${campaignId} 读取营销配置失败:`, (e as Error)?.message || e)
    throw new MarketingHttpError('读取营销配置失败，暂时不能测试发送', 503)
  }
  if (!senderReady()) {
    throw new MarketingHttpError('营销发信地址或阿里云 AccessKey 未配置（环境变量 ALIYUN_DM_MARKETING），不能发送')
  }
  // 页脚的联系邮箱是法律义务（广告法 §43、管理办法 §14），测试邮件同样是一封带广告的真邮件
  if (!config.contactEmail) {
    throw new MarketingHttpError('请先在「发送设置」里填写联系邮箱：页脚必须有能收信的联系方式')
  }

  const allowed = new Set(await allowedFrom(config))
  const notAllowed = want.filter((e) => !allowed.has(e))
  if (notAllowed.length) {
    throw new MarketingHttpError(
      `只能发给管理员账号邮箱或「发送设置」里登记的测试收件人，这些地址不在其中：${notAllowed.join('、')}`
    )
  }

  const parsed = parseStoredDoc(campaign.doc, `活动 #${campaign.id}`)
  if (!parsed.ok) throw new MarketingHttpError('活动内容已损坏，无法测试发送', 400)
  const doc = parsed.doc
  // 指纹按发送时读到的这一版内容算；发送期间内容被改了，下面的条件写入会自动落空
  const hash = contentHash({ topic: campaign.topic, subject: campaign.subject, preheader: campaign.preheader, doc })
  const topic: Topic = (TOPICS as readonly string[]).includes(campaign.topic) ? (campaign.topic as Topic) : 'PROMO'
  const content = {
    // 链接按真实发送的口径带 UTM（utm_campaign=mkt<id>）与 via=mail（审查 C11）
    id: campaign.id,
    topic,
    subject: campaign.subject,
    preheader: campaign.preheader,
    doc,
  }
  const testedBefore = !!campaign.testedHash && campaign.testedHash === hash

  // 1) 作者可控内容的检查（与编辑器同一套同构规则）
  const contentIssues = lintContent({
    subject: campaign.subject,
    preheader: campaign.preheader || '',
    topic: content.topic,
    doc,
    subjectPrefix: config.subjectPrefix,
  })
  if (hasErrors(contentIssues)) {
    const issues = mergeIssues(contentIssues)
    const remainingToday = await testSendRemaining()
    throw new MarketingHttpError(`内容检查未通过：${firstError(issues)}`, 400, {
      sent: [],
      issues,
      testedCurrent: testedBefore,
      remainingToday,
    } satisfies TestSendResult)
  }

  // 2) 抑制名单里的地址跳过（测试也不例外：投诉 / 无效地址再发只会伤信誉）
  const suppressed: Map<string, SuppressionReason> = await loadSuppressed(want)
  const toSend = want.filter((e) => !suppressed.has(e))

  // 3) 逐个收件人渲染（昵称取该邮箱对应用户，经 safeNickname；不安全的昵称交给占位默认值）
  const users = toSend.length
    ? await prisma.user.findMany({ where: { email: { in: toSend } }, select: { email: true, nickname: true } })
    : []
  const nickByEmail = new Map<string, string | null>()
  users.forEach((u) => {
    if (u.email) nickByEmail.set(normEmail(u.email), u.nickname)
  })

  const built: { email: string; subject: string; html: string; text: string }[] = []
  let renderIssues: LintIssue[] = []
  for (const email of toSend) {
    let nickname: string | null = null
    const raw = nickByEmail.get(email)
    if (raw) {
      try {
        nickname = safeNickname(raw, '') || null
      } catch {
        nickname = null
      }
    }
    const b = await buildTestEmail(content, { email, nickname })
    renderIssues = renderIssues.concat(b.issues || [])
    built.push({ email, subject: b.subject, html: b.html, text: b.text })
  }
  const issues = mergeIssues(contentIssues, renderIssues)
  if (hasErrors(issues)) {
    const remainingToday = await testSendRemaining()
    throw new MarketingHttpError(`内容检查未通过：${firstError(issues)}`, 400, {
      sent: [],
      issues,
      testedCurrent: testedBefore,
      remainingToday,
    } satisfies TestSendResult)
  }

  const skippedRows = want
    .filter((e) => suppressed.has(e))
    .map((e) => {
      const reason = suppressed.get(e) as SuppressionReason
      return { email: e, ok: false, note: `在抑制名单（${SUPPRESSION_REASON_LABEL[reason] || reason}），已跳过` }
    })

  if (!built.length) {
    return { sent: skippedRows, issues, testedCurrent: testedBefore, remainingToday: await testSendRemaining() }
  }

  // 4) 查余量 + 预占（串行）。预占行就是最终的审计行，发完再把结果补进去
  const reservation = await withCapLock(async () => {
    const now = new Date()
    const used = await testSendsWithin24h(now)
    const remaining = Math.max(0, TEST_SEND_CAP_24H - used)
    if (built.length > remaining) {
      throw new MarketingHttpError(
        remaining > 0
          ? `24 小时内测试发送最多 ${TEST_SEND_CAP_24H} 封，现在还能发 ${remaining} 封，请减少收件人`
          : `24 小时内测试发送已达上限（${TEST_SEND_CAP_24H} 封），请稍后再试`,
        429
      )
    }
    const row = await prisma.marketingAudit.create({
      data: {
        actorId,
        action: 'TEST_SEND',
        campaignId,
        detail: JSON.stringify({ count: built.length, ok: 0, pending: true }),
        createdAt: now,
      },
      select: { id: true },
    })
    return { auditId: row.id, remainingAfter: remaining - built.length }
  })

  // 5) 逐封发送。间隔按配置的速率（最多 1 秒），测试也不突发
  const origin = siteOrigin()
  const gapMs = Math.min(1000, Math.ceil(1000 / (config.ratePerSec > 0 ? config.ratePerSec : 1)))
  const results: { email: string; ok: boolean; note: string | null }[] = []
  let okCount = 0
  let dryRun = false
  for (let i = 0; i < built.length; i++) {
    const m = built[i]
    if (i > 0) await sleep(gapMs)
    try {
      const r = await sendMarketingMail({
        to: m.email,
        subject: m.subject,
        html: m.html,
        text: config.includeTextBody ? m.text : null,
        // 测试邮件的一键退订指向空操作端点：点了不改任何人的订阅状态
        unsubscribeUrl: `${origin}/api/mkt/unsubscribe/test`,
        fromAlias: config.fromAlias,
        replyTo: config.contactEmail || null,
      })
      if (r.dryRun) dryRun = true
      if (r.kind === 'ok') okCount++
      results.push({ email: m.email, ok: r.kind === 'ok', note: describeOutcome(r) })
    } catch (e) {
      console.error(`[marketing/test] 活动 #${campaignId} 第 ${i + 1} 封发送异常:`, (e as Error)?.name || 'Error')
      results.push({ email: m.email, ok: false, note: '发送异常，结果未知：请先查看收件箱' })
    }
  }

  // 6) 补审计（只记数量，不记地址）
  try {
    await prisma.marketingAudit.update({
      where: { id: reservation.auditId },
      data: { detail: JSON.stringify({ count: built.length, ok: okCount, ...(dryRun ? { dryRun: true } : {}) }) },
    })
  } catch (e) {
    console.error(`[marketing/test] 活动 #${campaignId} 补写审计失败:`, (e as Error)?.message || e)
  }

  // 7) 至少一封成功 → 记下「测过的是这一版」。
  //    条件：内容自读取以来没被改过（updatedAt 未变）。updatedAt 原样写回 —— 它是编辑器乐观锁的版本号，
  //    测试发送不改内容，不能让正开着编辑器的人下一次自动保存平白撞上 409。
  let testedCurrent = testedBefore
  if (okCount > 0) {
    const r = await prisma.marketingCampaign.updateMany({
      where: { id: campaignId, updatedAt: campaign.updatedAt },
      data: { testedHash: hash, testedAt: new Date(), updatedAt: campaign.updatedAt },
    })
    testedCurrent = r.count === 1
  }

  console.log(`[marketing/test] 活动 #${campaignId} 测试发送 ${built.length} 封，成功 ${okCount}${dryRun ? '（dry-run）' : ''}`)

  // 按管理员勾选的顺序返回（被跳过的也在原位置），界面逐行对得上
  const byEmail = new Map<string, { email: string; ok: boolean; note: string | null }>()
  results.concat(skippedRows).forEach((r) => byEmail.set(r.email, r))
  return {
    sent: want.map((e) => byEmail.get(e) || { email: e, ok: false, note: '未发送' }),
    issues,
    testedCurrent,
    remainingToday: Math.max(0, reservation.remainingAfter),
  }
}
