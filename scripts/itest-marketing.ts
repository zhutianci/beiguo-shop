/**
 * 营销推广 · 发送引擎集成测试（会建数据、会删数据）。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-marketing.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 时直接拒绝执行。
 * 传输层用假的（runSendTick({ transport })），不碰阿里云；MARKETING_DRY_RUN=1 让 senderReady 成立、跳过回执同步健康检查。
 * 库里若已有别人的「待发送 / 发送中」活动，worker 会一并处理它们 —— 所以开跑前先检查，有就拒绝（ITEST_MKT_FORCE=1 可强制）。
 *
 * 覆盖（设计文档第 12 节「不能改错的地方」与 14 节集成测试清单）：
 *   物化可重入 · 两趟并发不双发 · 取消（物化前/后/途中残留）即时生效 · 暂停/继续即时生效 · 发送中途退订被跳过 ·
 *   CLAIMED/SENDING 回收 · UNKNOWN 不重发 + 连续 2 次急停 · 连接失败退避重试 + 耗尽后 requeue · 限流不占次数 ·
 *   无效地址 FAILED + 抑制 · 反垃圾拒发暂停活动 + 连续两次急停 24h · 额度用尽急停到次日 · 配置错误急停 ·
 *   直发券（launch 建批次、按收券时刻计有效期、幂等、until 剩余不足 48h、批次失效暂停）· 撤回定时删空批次 ·
 *   跨活动频控（含 UNKNOWN，延后 vs 跳过）· SUNSET · 今日额度用完即停 · 时段/急停/总开关/配置坏了 ·
 *   物化失败自动暂停 · 改价自动暂停 · 试探批次闸门 · 账户级熔断与手动解除 · 完成通知恰好一次
 *   审查修复：当天继续后重做试探（C0）· 账户级熔断起点不被别的急停冲掉/挪动（C1）· 重新排队锁活动行（C2）·
 *   撤回/重新发送清残留行（C3）· 限速等待期间的退订/取消（C4）· trackToken 与退订 token 分开（C5）·
 *   券限定商品复核（C9）· 面额 ≥30% 警告（C10）· 测试邮件带 UTM 与 via=mail（C11）· 领取券未开始（C12）·
 *   记下发信地址（C15）· 发信方失败率熔断（C19）· 拦截投递上的投诉不计（C16 第 3 条）
 */
import crypto from 'crypto'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(2)
}
process.env.MARKETING_DRY_RUN = '1'
// 发信地址要记到每封信上（审查 C15）：给一个假的，传输层是假的，不会真用它
const ITEST_SENDER = 'marketing@mail.bigolab-itest.com'
process.env.ALIYUN_DM_MARKETING = ITEST_SENDER
// 绝不往真的企业微信群里推测试通知
delete process.env.WECOM_WEBHOOK_URL
delete process.env.ORDER_MSG_WEBHOOK_URL

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  ok(name, a === e, `期望 ${e}，实际 ${a}`)
}
const T = (s: string) => console.log(`\n[${s}]`)

const TAG = `imkt${Date.now().toString(36)}`
const DOMAINS = ['qq-itest.com', 'gmail-itest.com', '163-itest.com']
const SETTING_KEYS_ALL = ['marketing_config', 'mkt_halt', 'mkt_account', 'mkt_sync']

async function main() {
  const { prisma } = await import('../src/lib/db')
  const { runSendTick } = await import('../src/lib/marketing/worker')
  const { DEFAULT_CONFIG, EMPTY_HALT } = await import('../src/lib/marketing/types')
  const { getHalt, isHalted, setHalt, clearHalt, acctBreakerSince, ACCT_BREAKER_KIND } = await import('../src/lib/marketing/config')
  const snapshot = await import('../src/lib/marketing/snapshot')
  const { applyConsentChange, suppressEmail, unsuppressEmail } = await import('../src/lib/marketing/consent')
  const { grantCampaignCoupon, createCampaignCouponBatch } = await import('../src/lib/marketing/coupon')
  const lifecycle = await import('../src/lib/marketing/lifecycle')
  const { todayUsage } = await import('../src/lib/marketing/budget')
  const { bjDateKey, bjHour, nextDayWindowStart, addBjDays, bjDateToEnd } = await import('../src/lib/marketing/time')
  const { DEFAULT_SETTINGS } = await import('../src/lib/marketing/render')
  type MarketingConfig = import('../src/lib/marketing/types').MarketingConfig
  type EmailDoc = import('../src/lib/marketing/types').EmailDoc
  type SendAttempt = import('../src/lib/marketing/transport').SendAttempt
  type MarketingMailInput = import('../src/lib/marketing/transport').MarketingMailInput
  type CouponBlock = import('../src/lib/marketing/types').BlockOf<'coupon'>

  // —— 开跑前：库里不能有别人的活动在排队（worker 会连带处理它们）——
  const foreign = await prisma.marketingCampaign.findMany({
    where: { status: { in: ['SCHEDULED', 'SENDING'] }, NOT: { name: { startsWith: 'imkt' } } },
    select: { id: true, name: true, status: true },
  })
  if (foreign.length && process.env.ITEST_MKT_FORCE !== '1') {
    console.error(`拒绝执行：库里有 ${foreign.length} 个别人的待发送/发送中活动（${foreign.map((c) => `#${c.id}`).join(', ')}），worker 会一并处理它们。`)
    console.error('先在后台取消/暂停它们，或设 ITEST_MKT_FORCE=1 强制运行。')
    await prisma.$disconnect()
    process.exit(3)
  }

  const t0 = new Date()
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: SETTING_KEYS_ALL } } })
  const campaignIds: number[] = []
  const userIds: number[] = []
  const extraCouponIds: number[] = []
  const extraProductIds: number[] = []
  const extraCategoryIds: number[] = []
  let productId: number | null = null
  let categoryId: number | null = null

  // —— 假传输层 ——
  type Call = { to: string; subject: string; html: string; text: string | null; unsub: string; replyTo: string | null; at: number }
  const calls: Call[] = []
  let seq = 0
  const OK = (): SendAttempt => ({ kind: 'ok', httpStatus: 200, requestId: 'itest', envId: `fake-${++seq}`, dryRun: true })
  const UNKNOWN = (): SendAttempt => ({ kind: 'unknown_error', errName: 'TimeoutError', message: 'timeout', envId: null, dryRun: false })
  const CONNECT = (): SendAttempt => ({ kind: 'connect_error', errName: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND', envId: null, dryRun: false })
  const API = (code: string): SendAttempt => ({ kind: 'api_error', httpStatus: 400, code, message: `${code} (itest)`, envId: null, dryRun: false })
  let behave: (input: MarketingMailInput, n: number) => SendAttempt | Promise<SendAttempt> = () => OK()
  const fake = async (input: MarketingMailInput): Promise<SendAttempt> => {
    calls.push({ to: input.to, subject: input.subject, html: input.html, text: input.text, unsub: input.unsubscribeUrl, replyTo: input.replyTo, at: Date.now() })
    return behave(input, calls.length)
  }
  const callsFor = (email: string) => calls.filter((c) => c.to === email).length
  const tick = (extra: Record<string, unknown> = {}) =>
    runSendTick({ transport: fake, sleep: async () => {}, deadlineMs: 25_000, ...extra })

  // —— 配置 ——
  let cfg: MarketingConfig = {
    ...DEFAULT_CONFIG,
    enabled: true,
    contactEmail: 'support@bigolab-itest.com',
    sendWindow: { start: 0, end: 24 },
    warmup: { enabled: false, schedule: [200] },
    canarySize: 500,
    ratePerSec: 2,
    dailyCap: 100000,
    maxQuotaShare: 0.9,
    freq: { minHours: 0, max7d: 20, max30d: 60 },
    sunset: { enabled: false },
  }
  const putSetting = (key: string, value: string) =>
    prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
  const setCfg = async (patch: Partial<MarketingConfig>) => {
    cfg = { ...cfg, ...patch }
    await putSetting('marketing_config', JSON.stringify(cfg))
  }
  const resetHalt = () => putSetting('mkt_halt', JSON.stringify(EMPTY_HALT))

  // —— 数据工厂 ——
  let uSeq = 0
  const mkUsers = async (n: number, opts: { nickname?: string } = {}) => {
    const out: { id: number; email: string }[] = []
    for (let i = 0; i < n; i++) {
      uSeq++
      const email = `${TAG}-u${uSeq}@${DOMAINS[uSeq % DOMAINS.length]}`
      const u = await prisma.user.create({
        data: { email, passwordHash: 'x', nickname: opts.nickname ?? `测试${uSeq}` },
        select: { id: true, email: true },
      })
      userIds.push(u.id)
      out.push({ id: u.id, email: u.email! })
    }
    return out
  }
  const HTML =
    '<html><body><p>{{nickname|朋友}}，你好</p><a href="{{mkt_link:1}}">去看看</a><p>{{mkt_notice}}</p>' +
    '<p>券到期：{{coupon_expires}}</p><a href="{{mkt_unsub}}">退订营销邮件</a><img src="{{mkt_open}}" alt=""></body></html>'
  const TEXT = '{{nickname|朋友}}，你好。退订：{{mkt_unsub}}'
  const DOC: EmailDoc = {
    v: 1,
    settings: DEFAULT_SETTINGS,
    blocks: [
      {
        id: 'intro',
        type: 'text',
        align: 'left',
        size: 16,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '{{nickname|朋友}}，你好！感谢你一直以来对贝果科技的支持。本月我们准备了一张邮件专享优惠券，已经放入你的账户，下单时可直接抵扣，欢迎回来看看新上架的服务。',
                },
              ],
            },
          ],
        },
      },
      { id: 'btn', type: 'button', label: '去看看', href: '/products', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' },
    ],
  }
  const newCampaign = async (name: string, ids: number[], extra: Record<string, unknown> = {}) => {
    const c = await prisma.marketingCampaign.create({
      data: {
        name: `${TAG}-${name}`,
        topic: 'PROMO',
        subject: '{{nickname}}，测试',
        doc: JSON.stringify(DOC),
        audience: JSON.stringify({ type: 'USERS', userIds: ids }),
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() - 1000),
        html: HTML,
        text: TEXT,
        finalSubject: '(AD){{nickname|朋友}}，测试',
        refs: JSON.stringify({ products: [], couponId: null, claimCode: null }),
        contentHash: 'itest',
        ...extra,
      },
    })
    campaignIds.push(c.id)
    return c
  }
  const rowsOf = (campaignId: number) =>
    prisma.marketingMessage.findMany({ where: { campaignId }, orderBy: { id: 'asc' } })
  const campaign = (id: number) => prisma.marketingCampaign.findUniqueOrThrow({ where: { id } })
  const close = async (id: number) => {
    await prisma.marketingCampaign.updateMany({ where: { id, status: { notIn: ['COMPLETED', 'CANCELLED'] } }, data: { status: 'CANCELLED' } })
    await prisma.marketingMessage.updateMany({ where: { campaignId: id, status: { in: ['QUEUED', 'CLAIMED'] } }, data: { status: 'CANCELLED' } })
  }
  const byEmail = <R extends { email: string }>(rows: R[], email: string) => rows.find((r) => r.email === email)

  try {
    await setCfg({})
    await resetHalt()
    await putSetting(
      'mkt_account',
      JSON.stringify({ dailyQuota: 1_000_000, monthQuota: null, quotaLevel: 9, maxQuotaLevel: 9, userStatus: 0, ipChannelType: null, remainFreeQuota: null, fetchedAt: new Date().toISOString() })
    )
    await putSetting('mkt_sync', JSON.stringify({ lastOkAt: new Date().toISOString(), lastRunAt: null, lastError: null, blockCursor: null, invalidCursor: null, domainBackoff: {} }))
    const [actor] = await mkUsers(1)

    /* ---------------------------------------------------------------- */
    T('1. 物化可重入 + 发送 + 完成恰好一次')
    {
      const us = await mkUsers(6)
      const testAddr = await prisma.user.create({ data: { email: `${TAG}-t@itest-mkt.test`, passwordHash: 'x' }, select: { id: true, email: true } })
      userIds.push(testAddr.id)
      const [sup] = await mkUsers(1)
      await suppressEmail(sup.email, 'MANUAL', 'admin', 'itest')
      const c = await newCampaign('c1', [...us.map((u) => u.id), testAddr.id, sup.id])
      // 模拟「上一趟物化到一半被杀」：先插入两行
      const pre = [crypto.randomBytes(16).toString('hex'), crypto.randomBytes(16).toString('hex')]
      await prisma.marketingMessage.createMany({
        data: us.slice(0, 2).map((u, i) => ({ campaignId: c.id, userId: u.id, email: u.email, domain: u.email.split('@')[1], token: pre[i], status: 'QUEUED', sortKey: 0 })),
      })
      const s = await tick()
      const rows = await rowsOf(c.id)
      eq('行数 = 8（6 可发 + 测试域 + 抑制），无重复', rows.length, 8)
      ok('预先插入的行原样保留（token 不变）', pre.every((t) => rows.some((r) => r.token === t)))
      eq('新插入 6 行（重跑只补缺）', s.materialized, 6)
      eq('6 封 SENT', rows.filter((r) => r.status === 'SENT').length, 6)
      ok('每个可发收件人恰好调用 1 次', us.every((u) => callsFor(u.email) === 1))
      eq('测试域 → SKIPPED TEST_ADDRESS', byEmail(rows, testAddr.email!)?.skipReason, 'TEST_ADDRESS')
      eq('抑制名单 → SKIPPED SUPPRESSED', byEmail(rows, sup.email)?.skipReason, 'SUPPRESSED')
      eq('被排除的 0 次调用', callsFor(testAddr.email!) + callsFor(sup.email), 0)
      const sent = rows.find((r) => r.status === 'SENT')!
      ok('SENT 行有 sentAt / envId / subjectSent', !!sent.sentAt && !!sent.envId && !!sent.subjectSent)
      const call = calls.find((x) => x.to === sent.email)!
      ok('正文里的退订链接带本行 token', call.html.includes(`/unsubscribe/${sent.token}`))
      ok('List-Unsubscribe 指向一键退订接口', call.unsub.endsWith(`/api/mkt/unsubscribe/${sent.token}`))
      // 审查 C5：点击 / 打开用另一枚 trackToken，拿到商品链接的人不能凭它进退订页
      ok('trackToken 自动生成且与 token 不同', !!sent.trackToken && sent.trackToken !== sent.token)
      ok('点击链接改写为 /api/mkt/c/<trackToken>/1', call.html.includes(`/api/mkt/c/${sent.trackToken}/1`))
      ok('打开像素用 trackToken', call.html.includes(`/api/mkt/o/${sent.trackToken}`))
      ok('点击 / 打开链接里不出现退订 token', !call.html.includes(`/api/mkt/c/${sent.token}`) && !call.html.includes(`/api/mkt/o/${sent.token}`))
      ok('trackToken 不出现在退订链接与 List-Unsubscribe 里', !call.html.includes(`/unsubscribe/${sent.trackToken}`) && !call.unsub.includes(sent.trackToken))
      // 审查 C15：翻 SENDING 的同一条写入记下发信地址
      eq('SENT 行记下了发信地址', sent.sender, ITEST_SENDER)
      ok('没发的行（SKIPPED）不记发信地址', rows.filter((r) => r.status === 'SKIPPED').every((r) => r.sender === null))
      ok('首次收到营销邮件 → 带首封说明', call.html.includes('第一次'))
      ok('主题昵称已替换、带前缀', call.subject.startsWith('(AD)测试'))
      eq('回复地址 = contactEmail', call.replyTo, cfg.contactEmail)
      ok('纯文本版也做了个性化', !!call.text && call.text.includes(`/unsubscribe/${sent.token}`))
      const cc = await campaign(c.id)
      eq('活动已完成', cc.status, 'COMPLETED')
      eq('recipientCount = 可发人数 6', cc.recipientCount, 6)
      ok('completedAt / materializedAt / startedAt 都写了', !!cc.completedAt && !!cc.materializedAt && !!cc.startedAt)
      const before = calls.length
      const s2 = await tick()
      eq('再跑一趟：不再调用', calls.length, before)
      eq('再跑一趟：没有物化', s2.materialized, null)
      eq('COMPLETE 审计恰好 1 条', await prisma.marketingAudit.count({ where: { campaignId: c.id, action: 'COMPLETE' } }), 1)
      eq('START 审计恰好 1 条', await prisma.marketingAudit.count({ where: { campaignId: c.id, action: 'START' } }), 1)
      // 第二场活动发给同一个人：不再有首封说明
      const c1b = await newCampaign('c1b', [us[2].id])
      await tick()
      const second = calls.filter((x) => x.to === us[2].email)
      ok('第二封不再带首封说明', second.length === 2 && !second[1].html.includes('第一次'))
    }

    /* ---------------------------------------------------------------- */
    T('2. 两趟并发不双发 + 收件域名交错')
    {
      const us = await mkUsers(9)
      const c = await newCampaign('c2', us.map((u) => u.id))
      const [a, b] = await Promise.all([tick(), tick()])
      ok('其中一趟因锁跳过（或都跑完而不重叠）', a.skipped === 'locked' || b.skipped === 'locked' || a.sent + b.sent === 9)
      await Promise.all([tick(), tick(), tick()])
      ok('每人恰好 1 次', us.every((u) => callsFor(u.email) === 1), us.map((u) => callsFor(u.email)).join(','))
      const mine = calls.filter((x) => us.some((u) => u.email === x.to))
      const doms = mine.map((x) => x.to.split('@')[1])
      ok('前 3 封来自 3 个不同域名', new Set(doms.slice(0, 3)).size === 3, doms.join(','))
      ok('相邻两封不同域名', doms.every((d, i) => i === 0 || d !== doms[i - 1]), doms.join(','))
      eq('活动完成', (await campaign(c.id)).status, 'COMPLETED')
    }

    /* ---------------------------------------------------------------- */
    T('3. 取消：物化前 / 物化后 / 物化途中残留')
    {
      const us = await mkUsers(3)
      const c0 = await newCampaign('c3-before', us.map((u) => u.id))
      await lifecycle.controlCampaign(c0.id, 'cancel', actor.id)
      await tick()
      eq('物化前取消：不物化', (await rowsOf(c0.id)).length, 0)
      eq('物化前取消：0 次调用', us.reduce((s, u) => s + callsFor(u.email), 0), 0)

      const vs = await mkUsers(3)
      await setCfg({ enabled: false })
      const c1 = await newCampaign('c3-after', vs.map((u) => u.id))
      const s = await tick()
      eq('总开关关着：仍会物化', s.materialized, 3)
      eq('总开关关着：不发', s.stoppedBy, 'disabled')
      const r = await lifecycle.controlCampaign(c1.id, 'cancel', actor.id)
      ok('取消返回说明', r.message.includes('3'))
      await setCfg({ enabled: true })
      await tick()
      eq('物化后取消：0 次调用', vs.reduce((acc, u) => acc + callsFor(u.email), 0), 0)
      ok('行全部 CANCELLED', (await rowsOf(c1.id)).every((x) => x.status === 'CANCELLED'))

      // 物化途中取消：取消事务先提交，物化随后又插入了行 → worker 下一趟扫掉
      const ws = await mkUsers(2)
      const c2 = await newCampaign('c3-during', ws.map((u) => u.id), { status: 'CANCELLED', materializedAt: new Date() })
      await prisma.marketingMessage.createMany({
        data: ws.map((u) => ({ campaignId: c2.id, userId: u.id, email: u.email, domain: u.email.split('@')[1], token: crypto.randomBytes(16).toString('hex'), status: 'QUEUED' })),
      })
      await tick()
      eq('残留行被扫成 CANCELLED', (await rowsOf(c2.id)).map((x) => x.status), ['CANCELLED', 'CANCELLED'])
      eq('残留行 0 次调用', ws.reduce((acc, u) => acc + callsFor(u.email), 0), 0)
      // 撤回定时途中：worker 的 CAS 失败、活动已回到草稿 → 这批行必须删掉（不能留成 CANCELLED，否则重发时被永久跳过）
      const xs = await mkUsers(2)
      const c3 = await newCampaign('c3-unsched', xs.map((u) => u.id), { status: 'SCHEDULED', scheduledAt: new Date(Date.now() + 3600_000) })
      const un = await lifecycle.controlCampaign(c3.id, 'unschedule', actor.id)
      ok('撤回定时成功', un.message.includes('草稿'))
      const d = await campaign(c3.id)
      ok('撤回后回到草稿、快照已清', d.status === 'DRAFT' && d.html === null && d.finalSubject === null && d.contentHash === null)
    }

    /* ---------------------------------------------------------------- */
    T('4. 暂停 / 继续即时生效')
    {
      const us = await mkUsers(4)
      await setCfg({ enabled: false })
      const c = await newCampaign('c4', us.map((u) => u.id))
      await tick()
      await setCfg({ enabled: true })
      await lifecycle.controlCampaign(c.id, 'pause', actor.id)
      await tick()
      eq('暂停后 0 次调用', us.reduce((s, u) => s + callsFor(u.email), 0), 0)
      await lifecycle.controlCampaign(c.id, 'resume', actor.id)
      const cc = await campaign(c.id)
      ok('继续 → SENDING（已物化）且重置风控起点', cc.status === 'SENDING' && !!cc.breakerResetAt && cc.canaryDay === null && cc.failStreak === 0)
      // 发送途中暂停：第一封发出时管理员点了暂停 → 后面的一封都不再发
      behave = async (input) => {
        if (us.some((u) => u.email === input.to)) {
          await lifecycle.controlCampaign(c.id, 'pause', actor.id).catch(() => {})
        }
        return OK()
      }
      await tick()
      behave = () => OK()
      eq('途中暂停：本趟只发出 1 封', us.reduce((s, u) => s + callsFor(u.email), 0), 1)
      eq('活动已暂停', (await campaign(c.id)).status, 'PAUSED')
      eq('其余行放回 QUEUED', (await rowsOf(c.id)).filter((r) => r.status === 'QUEUED').length, 3)
      await lifecycle.controlCampaign(c.id, 'resume', actor.id)
      await tick()
      ok('继续后发完、每人 1 次', us.every((u) => callsFor(u.email) === 1))
      let threw = false
      try {
        await lifecycle.controlCampaign(c.id, 'resume', actor.id)
      } catch (e) {
        threw = (e as { status?: number }).status === 409
      }
      ok('已完成的活动不能「继续」（409）', threw)
    }

    /* ---------------------------------------------------------------- */
    T('5. 发送中途退订 / 抑制 → 跳过')
    {
      const us = await mkUsers(3)
      await setCfg({ enabled: false })
      const c = await newCampaign('c5', us.map((u) => u.id))
      await tick()
      await setCfg({ enabled: true })
      // 发出第一封时，另外两人一个退订、一个被投诉抑制
      behave = async (input) => {
        if (input.to === us[0].email || input.to === us[1].email || input.to === us[2].email) {
          const others = us.filter((u) => u.email !== input.to)
          await applyConsentChange(others[0].id, { kind: 'unsubscribe' }, { source: 'one_click', email: others[0].email })
          await suppressEmail(others[1].email, 'COMPLAINT', 'aliyun_sync', 'itest')
        }
        return OK()
      }
      await tick()
      behave = () => OK()
      const rows = await rowsOf(c.id)
      eq('只发出 1 封', us.reduce((s, u) => s + callsFor(u.email), 0), 1)
      const reasons = rows.filter((r) => r.status === 'SKIPPED').map((r) => r.skipReason).sort()
      eq('另外两人按原因跳过', reasons, ['SUPPRESSED', 'UNSUBSCRIBED'])
      const unsubUser = us.find((u) => rows.find((r) => r.email === u.email)?.skipReason === 'UNSUBSCRIBED')!
      const again = await applyConsentChange(unsubUser.id, { kind: 'unsubscribe' }, { source: 'one_click', email: unsubUser.email })
      eq('重复退订：状态未变不写库', again.changed, false)
      eq('留痕只有 1 条', await prisma.marketingConsentLog.count({ where: { userId: unsubUser.id } }), 1)
      const compl = us.find((u) => rows.find((r) => r.email === u.email)?.skipReason === 'SUPPRESSED')!
      eq('投诉抑制不能被管理员解除', await unsuppressEmail(compl.email, actor.id), false)
      await suppressEmail(compl.email, 'MANUAL', 'admin', 'x')
      eq('已是投诉的不会被降级成 MANUAL', (await prisma.marketingSuppression.findUnique({ where: { email: compl.email } }))?.reason, 'COMPLAINT')
    }

    /* ---------------------------------------------------------------- */
    T('6. CLAIMED / SENDING 回收')
    {
      const us = await mkUsers(4)
      const c = await newCampaign('c6', us.map((u) => u.id), { status: 'SENDING', materializedAt: new Date(), startedAt: new Date() })
      const now = Date.now()
      const mk = (u: { id: number; email: string }, status: string, claimedAt: Date) =>
        prisma.marketingMessage.create({
          data: { campaignId: c.id, userId: u.id, email: u.email, domain: u.email.split('@')[1], token: crypto.randomBytes(16).toString('hex'), status, claimedAt },
        })
      const oldClaim = await mk(us[0], 'CLAIMED', new Date(now - 3 * 60_000))
      const oldSending = await mk(us[1], 'SENDING', new Date(now - 6 * 60_000))
      const freshClaim = await mk(us[2], 'CLAIMED', new Date(now - 30_000))
      const freshSending = await mk(us[3], 'SENDING', new Date(now - 60_000))
      await setCfg({ enabled: false })
      const s = await tick()
      ok('回收计数', s.recovered.claimed >= 1 && s.recovered.sending >= 1, JSON.stringify(s.recovered))
      const get = (id: number) => prisma.marketingMessage.findUniqueOrThrow({ where: { id } })
      const a = await get(oldClaim.id)
      eq('CLAIMED 超 2 分钟 → QUEUED', [a.status, a.claimedAt], ['QUEUED', null])
      const b = await get(oldSending.id)
      eq('SENDING 超 5 分钟 → UNKNOWN(INTERRUPTED)', [b.status, b.errorCode], ['UNKNOWN', 'INTERRUPTED'])
      ok('UNKNOWN 的 sentAt = claimedAt', !!b.sentAt && b.sentAt.getTime() === oldSending.claimedAt!.getTime())
      eq('新鲜的 CLAIMED 不动', (await get(freshClaim.id)).status, 'CLAIMED')
      eq('新鲜的 SENDING 不动', (await get(freshSending.id)).status, 'SENDING')
      await setCfg({ enabled: true })
      await tick()
      eq('回收的 CLAIMED 行随后正常发出', callsFor(us[0].email), 1)
      eq('被判 UNKNOWN 的行绝不重发', callsFor(us[1].email), 0)
      await prisma.marketingMessage.updateMany({ where: { id: { in: [freshClaim.id, freshSending.id] } }, data: { status: 'CANCELLED' } })
      await close(c.id)
    }

    /* ---------------------------------------------------------------- */
    T('7. 结果未知：不重发、连续 2 次急停 15 分钟')
    {
      const us = await mkUsers(3)
      const c = await newCampaign('c7', us.map((u) => u.id))
      behave = () => UNKNOWN()
      const s = await tick()
      behave = () => OK()
      eq('连续 2 次未知 → 本趟停止', s.stoppedBy, 'unknown_streak')
      const rows = await rowsOf(c.id)
      const unk = rows.filter((r) => r.status === 'UNKNOWN')
      eq('2 行 UNKNOWN', unk.length, 2)
      ok('UNKNOWN 行 sentAt = claimedAt', unk.every((r) => r.sentAt && r.claimedAt && r.sentAt.getTime() === r.claimedAt.getTime()))
      const h = await getHalt()
      ok('已急停约 15 分钟', isHalted(h) && Math.abs(Date.parse(h.until!) - Date.now() - 15 * 60_000) < 60_000, JSON.stringify(h))
      const s2 = await tick()
      eq('急停中：不发', s2.stoppedBy, 'halted')
      await clearHalt(actor.id)
      eq('解除后急停状态清空', isHalted(await getHalt()), false)
      await tick()
      ok('解除急停后：剩下那封发出', callsFor(us.find((u) => !unk.some((r) => r.email === u.email))!.email) === 1)
      ok('UNKNOWN 的两封绝不重发', unk.every((r) => callsFor(r.email) === 1))
      const req = await lifecycle.controlCampaign(c.id, 'requeue', actor.id)
      ok('普通 UNKNOWN 不许重排', req.message.includes('没有可以重新排队'))
      await prisma.marketingMessage.update({ where: { id: unk[0].id }, data: { errorCode: 'UNKNOWN_NOT_FOUND' } })
      const req2 = await lifecycle.controlCampaign(c.id, 'requeue', actor.id)
      ok('UNKNOWN_NOT_FOUND 可以重排', req2.message.includes('1'))
      eq('已完成的活动重排后回到发送中', (await campaign(c.id)).status, 'SENDING')
      await tick()
      eq('重排的那封再发一次', callsFor(unk[0].email), 2)
      eq('重排发完后再次完成', (await campaign(c.id)).status, 'COMPLETED')
      eq('完成审计 2 条（两次完成各一次）', await prisma.marketingAudit.count({ where: { campaignId: c.id, action: 'COMPLETE' } }), 2)
    }

    /* ---------------------------------------------------------------- */
    T('8. 连接失败：退避重试；耗尽 → FAILED(CONNECT) → 可 requeue')
    {
      const [u] = await mkUsers(1)
      const c = await newCampaign('c8', [u.id])
      behave = () => CONNECT()
      const s = await tick()
      eq('连接失败 → 本趟结束', s.stoppedBy, 'connect_error')
      let r = (await rowsOf(c.id))[0]
      eq('行放回 QUEUED、attempts=1', [r.status, r.attempts, r.errorCode], ['QUEUED', 1, 'CONNECT'])
      eq('放回队列的行清掉发信地址（下次发时重记）', r.sender, null)
      ok('退避 1 分钟', !!r.nextAttemptAt && Math.abs(r.nextAttemptAt.getTime() - Date.now() - 60_000) < 15_000)
      behave = () => OK()
      await tick()
      eq('退避期内不重试', callsFor(u.email), 1)
      await prisma.marketingMessage.update({ where: { id: r.id }, data: { nextAttemptAt: new Date(Date.now() - 1000) } })
      await tick()
      r = (await rowsOf(c.id))[0]
      eq('到点重试成功', [r.status, callsFor(u.email)], ['SENT', 2])

      const [v] = await mkUsers(1)
      const c2 = await newCampaign('c8b', [v.id])
      await setCfg({ enabled: false })
      await tick()
      await setCfg({ enabled: true })
      await prisma.marketingMessage.updateMany({ where: { campaignId: c2.id }, data: { attempts: 4 } })
      behave = () => CONNECT()
      await tick()
      behave = () => OK()
      r = (await rowsOf(c2.id))[0]
      eq('第 5 次失败 → FAILED(CONNECT)', [r.status, r.errorCode, r.attempts], ['FAILED', 'CONNECT', 5])
      await tick()
      eq('活动完成', (await campaign(c2.id)).status, 'COMPLETED')
      const m = await lifecycle.controlCampaign(c2.id, 'requeue', actor.id)
      ok('FAILED(CONNECT) 可以重排', m.message.includes('1'))
      r = (await rowsOf(c2.id))[0]
      eq('重排后 attempts 清零、QUEUED', [r.status, r.attempts, r.errorCode], ['QUEUED', 0, null])
      await tick()
      eq('重排后发出', (await rowsOf(c2.id))[0].status, 'SENT')
    }

    /* ---------------------------------------------------------------- */
    T('9. 限流：放回队列、不占次数、+2 分钟')
    {
      const [u] = await mkUsers(1)
      const c = await newCampaign('c9', [u.id])
      behave = () => API('Throttling.User')
      const s = await tick()
      behave = () => OK()
      eq('本趟结束', s.stoppedBy, 'throttled')
      const r = (await rowsOf(c.id))[0]
      eq('QUEUED、attempts 仍为 0', [r.status, r.attempts], ['QUEUED', 0])
      ok('+2 分钟', !!r.nextAttemptAt && Math.abs(r.nextAttemptAt.getTime() - Date.now() - 120_000) < 15_000)
      await close(c.id)
    }

    /* ---------------------------------------------------------------- */
    T('10. 收件人无效 → FAILED + 抑制 INVALID')
    {
      const us = await mkUsers(2)
      const c = await newCampaign('c10', us.map((u) => u.id))
      behave = (input) => (input.to === us[0].email ? API('InvalidToAddress') : OK())
      await tick()
      behave = () => OK()
      const r = byEmail(await rowsOf(c.id), us[0].email)!
      eq('FAILED(InvalidToAddress)', [r.status, r.errorCode], ['FAILED', 'InvalidToAddress'])
      eq('进了抑制名单（INVALID）', (await prisma.marketingSuppression.findUnique({ where: { email: us[0].email } }))?.reason, 'INVALID')
      eq('另一个人照常发出', byEmail(await rowsOf(c.id), us[1].email)?.status, 'SENT')
      eq('不影响活动（已完成）', (await campaign(c.id)).status, 'COMPLETED')
      eq('无效地址可以被管理员解除抑制', await unsuppressEmail(us[0].email, actor.id), true)
    }

    /* ---------------------------------------------------------------- */
    T('11. 反垃圾拒发 → FAILED(SPAM_REJECT) + 暂停活动；10 分钟内第二次 → 急停 24h')
    {
      const us = await mkUsers(3)
      const c = await newCampaign('c11', us.slice(0, 2).map((u) => u.id))
      behave = () => API('InvalidSendMail.Spam')
      await tick()
      const rows = await rowsOf(c.id)
      eq('只调用了 1 次', us.slice(0, 2).reduce((s, u) => s + callsFor(u.email), 0), 1)
      eq('那封 FAILED(SPAM_REJECT)', rows.filter((r) => r.status === 'FAILED').map((r) => r.errorCode), ['SPAM_REJECT'])
      const cc = await campaign(c.id)
      ok('活动已暂停并写明原因', cc.status === 'PAUSED' && !!cc.statusNote && cc.statusNote.includes('反垃圾'))
      eq('第一次不急停', isHalted(await getHalt()), false)
      const c2 = await newCampaign('c11b', [us[2].id])
      await tick()
      behave = () => OK()
      const h = await getHalt()
      ok('10 分钟内第二次 → 急停约 24 小时', isHalted(h) && Date.parse(h.until!) - Date.now() > 23 * 3600_000)
      eq('第二场活动也暂停', (await campaign(c2.id)).status, 'PAUSED')
      await resetHalt()
      await close(c.id)
      await close(c2.id)
    }

    /* ---------------------------------------------------------------- */
    T('12. 额度用尽 → 行原样放回、急停到次日发送时段；配置错误 → 急停 24h')
    {
      const [u] = await mkUsers(1)
      const c = await newCampaign('c12', [u.id])
      behave = () => API('InvalidQuota')
      const s = await tick()
      behave = () => OK()
      eq('本趟停止（quota）', s.stoppedBy, 'quota')
      const r = (await rowsOf(c.id))[0]
      eq('行放回 QUEUED、attempts 不变', [r.status, r.attempts], ['QUEUED', 0])
      const h = await getHalt()
      eq('急停到次日发送时段开始', h.until, nextDayWindowStart(cfg.sendWindow, new Date()).toISOString())
      await resetHalt()
      behave = () => API('InvalidMailAddress.NotFound')
      const s2 = await tick()
      behave = () => OK()
      eq('配置错误 → 本趟停止（config）', s2.stoppedBy, 'config')
      const h2 = await getHalt()
      ok('急停约 24 小时', isHalted(h2) && Date.parse(h2.until!) - Date.now() > 23 * 3600_000)
      eq('行仍 QUEUED', (await rowsOf(c.id))[0].status, 'QUEUED')
      await resetHalt()
      behave = () => API('InvalidHtmlBody.Malformed')
      await tick()
      behave = () => OK()
      const cc = await campaign(c.id)
      ok('内容被拒 → 活动暂停、行放回', cc.status === 'PAUSED' && (await rowsOf(c.id))[0].status === 'QUEUED')
      await close(c.id)
    }

    /* ---------------------------------------------------------------- */
    T('13. 直发券：launch 建批次、收券时刻计有效期、幂等、撤回定时删空批次')
    {
      const us = await mkUsers(2)
      const doc: EmailDoc = {
        ...DOC,
        blocks: [
          ...DOC.blocks,
          {
            id: 'cp',
            type: 'coupon',
            mode: 'grant',
            title: '邮件专享券',
            ctaLabel: '去使用',
            bg: '#fff7ed',
            color: '#9a3412',
            grant: { kind: 'THRESHOLD', discount: 5, minAmount: 0, productIds: [], validity: { mode: 'days', days: 7 } },
          },
        ],
      }
      const draft = await prisma.marketingCampaign.create({
        data: {
          name: `${TAG}-c13`,
          topic: 'PROMO',
          subject: '{{nickname}}，送你一张券',
          preheader: '邮件专享',
          doc: JSON.stringify(doc),
          audience: JSON.stringify({ type: 'USERS', userIds: us.map((u) => u.id) }),
          status: 'DRAFT',
        },
      })
      campaignIds.push(draft.id)
      const hash = lifecycle.campaignContentHash(draft)!
      await prisma.marketingCampaign.update({ where: { id: draft.id }, data: { testedHash: hash, testedAt: new Date() } })
      const chk = await lifecycle.checkCampaign(draft.id)
      const errs = chk.issues.filter((i) => i.level === 'error')
      ok('检查通过（可发送）', chk.canLaunch, errs.map((e) => `${e.code}:${e.message}`).join(' | '))
      eq('可发人数 2', chk.audience.eligible, 2)
      eq('券让利 2 × ¥5', chk.coupon, { maxCount: 2, maxGiveaway: '10.00' })
      ok('给出了预计完成时间', !!chk.eta.finishAt)

      let e409: { status?: number; payload?: unknown } | null = null
      try {
        await lifecycle.launchCampaign(draft.id, { scheduledAt: null, expectedCount: 99, expectedContentHash: hash }, actor.id)
      } catch (e) {
        e409 = e as { status?: number; payload?: unknown }
      }
      ok('人数对不上 → 409 且带新值', e409?.status === 409 && (e409.payload as { eligible?: number })?.eligible === 2)

      // 定时到 1 小时后 → 撤回 → 空批次被删除
      await lifecycle.launchCampaign(draft.id, { scheduledAt: new Date(Date.now() + 3600_000), expectedCount: 2, expectedContentHash: chk.contentHash }, actor.id)
      let cc = await campaign(draft.id)
      const batch1 = cc.couponId
      ok('launch：SCHEDULED + 建了券批次 + 冻结快照', cc.status === 'SCHEDULED' && !!batch1 && !!cc.html && cc.finalSubject === '(AD){{nickname}}，送你一张券')
      const b1 = await prisma.coupon.findUnique({ where: { id: batch1! } })
      ok('批次：CAMPAIGN / mk- / 买家可见名 / 0 张', !!b1 && b1.source === 'CAMPAIGN' && b1.code.startsWith('mk-') && b1.name === '邮件专享券' && b1.total === 0 && b1.endAt === null)
      eq('批次备注带活动号、不带活动名', b1?.note, `营销活动 #${draft.id}`)
      const links = await prisma.marketingLink.findMany({ where: { campaignId: draft.id } })
      ok('登记了链接且带 UTM 与 via=mail', links.length > 0 && links.every((l) => l.url.includes(`utm_campaign=mkt${draft.id}`)) && links.some((l) => l.url.includes('via=mail')), links.map((l) => l.url).join(' '))
      ok('快照里的链接是占位符', !!cc.html && cc.html.includes('{{mkt_link:1}}'))
      eq('LAUNCH 审计', await prisma.marketingAudit.count({ where: { campaignId: draft.id, action: 'LAUNCH' } }), 1)
      await tick()
      eq('定时未到：不物化', (await rowsOf(draft.id)).length, 0)
      await lifecycle.controlCampaign(draft.id, 'unschedule', actor.id)
      cc = await campaign(draft.id)
      ok('撤回：DRAFT、快照清空、testedHash 保留', cc.status === 'DRAFT' && cc.html === null && cc.couponId === null && cc.testedHash === hash)
      eq('撤回：空批次已删除', await prisma.coupon.count({ where: { id: batch1! } }), 0)
      eq('撤回：links 已删除', await prisma.marketingLink.count({ where: { campaignId: draft.id } }), 0)

      // 立即发送
      const chk2 = await lifecycle.checkCampaign(draft.id)
      await lifecycle.launchCampaign(draft.id, { scheduledAt: null, expectedCount: chk2.audience.eligible, expectedContentHash: chk2.contentHash }, actor.id)
      cc = await campaign(draft.id)
      const couponId = cc.couponId!
      const tSend = Date.now()
      await tick()
      const rows = await rowsOf(draft.id)
      eq('两封都发出', rows.map((r) => r.status), ['SENT', 'SENT'])
      const grants = await prisma.couponGrant.findMany({ where: { couponId } })
      eq('每人一张券', grants.length, 2)
      ok('有效期 = 收券时刻 + 7 天', grants.every((g) => !!g.expiresAt && Math.abs(g.expiresAt.getTime() - tSend - 7 * 86400_000) < 120_000))
      ok('message.couponGrantId 记下了', rows.every((r) => r.couponGrantId && grants.some((g) => g.id === r.couponGrantId)))
      const b2 = await prisma.coupon.findUniqueOrThrow({ where: { id: couponId } })
      eq('批次 total/claimed = 2/2', [b2.total, b2.claimed], [2, 2])
      const call = calls.filter((x) => x.to === us[0].email).pop()!
      ok('正文里的券到期日已替换', !call.html.includes('{{coupon_expires}}'))
      const again = await grantCampaignCoupon(couponId, us[0].id, new Date(Date.now() + 86400_000))
      ok('重复发券幂等（同一张、有效期不变）', again.ok && again.grantId === grants.find((g) => g.userId === us[0].id)!.id)
      eq('批次计数不变', (await prisma.coupon.findUniqueOrThrow({ where: { id: couponId } })).total, 2)
      const later = new Date(Date.now() + 3 * 86400_000)
      const [w] = await mkUsers(1)
      const g3 = await grantCampaignCoupon(couponId, w.id, later)
      ok('晚 3 天收券 → 有效期晚 3 天', g3.ok && !!g3.expiresAt && g3.expiresAt.getTime() === later.getTime() + 7 * 86400_000)

      // until 模式：剩余不足 48 小时不发
      const tomorrow = addBjDays(bjDateKey(new Date()), 1)
      const shortId = await prisma.$transaction((tx) =>
        createCampaignCouponBatch(tx, draft.id, { ...(doc.blocks[2] as CouponBlock), grant: { kind: 'THRESHOLD', discount: 3, minAmount: 0, productIds: [], validity: { mode: 'until', date: tomorrow } } }, new Date())
      )
      extraCouponIds.push(shortId)
      const gs = await grantCampaignCoupon(shortId, w.id, new Date())
      ok('until 剩余 <48h → VALIDITY_TOO_SHORT', !gs.ok && gs.reason === 'VALIDITY_TOO_SHORT')
      const farDate = addBjDays(bjDateKey(new Date()), 10)
      const longId = await prisma.$transaction((tx) =>
        createCampaignCouponBatch(tx, draft.id, { ...(doc.blocks[2] as CouponBlock), grant: { kind: 'THRESHOLD', discount: 3, minAmount: 0, productIds: [], validity: { mode: 'until', date: farDate } } }, new Date())
      )
      extraCouponIds.push(longId)
      const gl = await grantCampaignCoupon(longId, w.id, new Date())
      ok('until 模式有效期 = 该日 23:59:59（北京）', gl.ok && gl.expiresAt?.getTime() === bjDateToEnd(farDate).getTime())
      // 审查 C8：券标题里的变量不能原样进买家可见的券名
      const tagId = await prisma.$transaction((tx) =>
        createCampaignCouponBatch(tx, draft.id, { ...(doc.blocks[2] as CouponBlock), title: '{{nickname|朋友}}的回归券' }, new Date())
      )
      extraCouponIds.push(tagId)
      eq('券名去掉标题里的变量', (await prisma.coupon.findUniqueOrThrow({ where: { id: tagId } })).name, '的回归券')
      await prisma.coupon.update({ where: { id: longId }, data: { status: 'ENDED' } })
      const [z] = await mkUsers(1)
      const ge = await grantCampaignCoupon(longId, z.id, new Date())
      ok('批次已结束 → BATCH_NOT_ACTIVE', !ge.ok && ge.reason === 'BATCH_NOT_ACTIVE')

      // 发送中批次失效：refs 复核 / 发券前复核 → 暂停，行放回，0 封
      const [y] = await mkUsers(1)
      const cz = await newCampaign('c13-ended', [y.id], { couponId: longId, doc: JSON.stringify(doc), refs: JSON.stringify({ products: [], couponId: null, claimCode: null }) })
      await tick()
      const czr = await campaign(cz.id)
      ok('券批次失效 → 活动暂停、0 封', czr.status === 'PAUSED' && callsFor(y.email) === 0, czr.statusNote || '')
      await close(cz.id)
    }

    /* ---------------------------------------------------------------- */
    T('14. 跨活动频控（含 UNKNOWN）：延后 vs 跳过；SUNSET')
    {
      await setCfg({ freq: { minHours: 24, max7d: 2, max30d: 4 } })
      const [f, g, h] = await mkUsers(3)
      // 每条历史记录放在各自的旧活动里：(campaignId, email) 唯一
      let histSeq = 0
      const hist = async (u: { id: number; email: string }, status: string, ago: number) => {
        const old = await newCampaign(`c14-old${++histSeq}`, [], { status: 'COMPLETED', materializedAt: new Date() })
        return prisma.marketingMessage.create({
          data: {
            campaignId: old.id,
            userId: u.id,
            email: u.email,
            domain: u.email.split('@')[1],
            token: crypto.randomBytes(16).toString('hex'),
            status,
            claimedAt: new Date(Date.now() - ago),
            sentAt: status === 'SENT' || status === 'UNKNOWN' ? new Date(Date.now() - ago) : null,
          },
        })
      }
      const unkRow = await hist(f, 'UNKNOWN', 2 * 3600_000) // 2 小时前一封「结果未知」
      await hist(g, 'SENT', 3 * 86400_000)
      await hist(g, 'UNKNOWN', 2 * 86400_000) // 7 天内 2 封（含 UNKNOWN）
      const c = await newCampaign('c14', [f.id, g.id, h.id])
      await tick()
      const rows = await rowsOf(c.id)
      const rf = byEmail(rows, f.email)!
      eq('F：2 小时前刚收过（UNKNOWN 也算）→ 延后，不跳过', rf.status, 'QUEUED')
      ok('F：延后到上一封 + 24 小时', !!rf.nextAttemptAt && rf.nextAttemptAt.getTime() === unkRow.sentAt!.getTime() + 24 * 3600_000)
      eq('G：7 天内已 2 封 → FREQ_CAP 跳过', [byEmail(rows, g.email)?.status, byEmail(rows, g.email)?.skipReason], ['SKIPPED', 'FREQ_CAP'])
      eq('H：没有历史 → 发出', byEmail(rows, h.email)?.status, 'SENT')
      eq('F、G 0 次调用', callsFor(f.email) + callsFor(g.email), 0)
      eq('还有延后的行 → 活动未完成', (await campaign(c.id)).status, 'SENDING')
      await close(c.id)
      await setCfg({ freq: { minHours: 0, max7d: 20, max30d: 60 } })

      // SUNSET：DEFAULT 用户已收 3 封、近 90 天无点击无付款 → 物化时跳过
      await setCfg({ sunset: { enabled: true } })
      const [s] = await mkUsers(1)
      for (let i = 0; i < 3; i++) await hist(s, 'SENT', (10 + i) * 86400_000)
      const cs = await newCampaign('c14-sunset', [s.id])
      await tick()
      eq('SUNSET 跳过', (await rowsOf(cs.id))[0]?.skipReason, 'SUNSET')
      await setCfg({ sunset: { enabled: false } })
    }

    /* ---------------------------------------------------------------- */
    T('15. 今日额度用完即停')
    {
      const us = await mkUsers(3)
      const usage = await todayUsage(cfg)
      await setCfg({ dailyCap: usage.used + 1 })
      const c = await newCampaign('c15', us.map((u) => u.id))
      const s = await tick()
      eq('只发 1 封', us.reduce((acc, u) => acc + callsFor(u.email), 0), 1)
      eq('停在 budget', s.stoppedBy, 'budget')
      await setCfg({ dailyCap: 100000 })
      await tick()
      ok('放开额度后发完', us.every((u) => callsFor(u.email) === 1))
      eq('活动完成', (await campaign(c.id)).status, 'COMPLETED')
    }

    /* ---------------------------------------------------------------- */
    T('16. 闸门：发送时段 / 急停 / 联系邮箱 / 配置坏了')
    {
      const us = await mkUsers(2)
      await setCfg({ enabled: false })
      const c = await newCampaign('c16', us.map((u) => u.id))
      await tick()
      const h = bjHour(new Date())
      const outside = h <= 21 ? { start: h + 1, end: h + 2 } : { start: 0, end: h }
      await setCfg({ enabled: true, sendWindow: outside })
      eq('时段外 → window', (await tick()).stoppedBy, 'window')
      await setCfg({ sendWindow: { start: 0, end: 24 } })
      await setHalt(new Date(Date.now() + 600_000), 'itest 急停', 'itest')
      eq('急停中 → halted', (await tick()).stoppedBy, 'halted')
      await setHalt(new Date(Date.now() + 60_000), '更早的急停', 'itest')
      ok('已有更晚的急停时保留更晚的', Date.parse((await getHalt()).until!) - Date.now() > 5 * 60_000)
      await clearHalt(actor.id)
      await setCfg({ contactEmail: '' })
      eq('联系邮箱被清空 → 不发', (await tick()).stoppedBy, 'no_contact')
      await setCfg({ contactEmail: 'support@bigolab-itest.com' })
      await putSetting('marketing_config', '{bad json')
      const bad = await tick()
      eq('配置坏了 → 本趟中止（fail closed）', bad.skipped, 'config_unreadable')
      await putSetting('mkt_halt', '{"until": "not-a-date"}')
      await setCfg({})
      eq('急停状态坏了 → 本趟中止', (await tick()).skipped, 'config_unreadable')
      await resetHalt()
      eq('以上都没有发出', us.reduce((acc, u) => acc + callsFor(u.email), 0), 0)
      await tick()
      ok('恢复后发完', us.every((u) => callsFor(u.email) === 1))
    }

    /* ---------------------------------------------------------------- */
    T('17. 物化失败 → 自动暂停；改价 → 自动暂停')
    {
      const c = await newCampaign('c17', [], { audience: '{"type":"NOPE"}' })
      await tick()
      const cc = await campaign(c.id)
      ok('物化失败 → PAUSED + 原因', cc.status === 'PAUSED' && !!cc.statusNote && cc.statusNote.includes('物化'), cc.statusNote || '')
      eq('AUTO_PAUSE 审计', await prisma.marketingAudit.count({ where: { campaignId: c.id, action: 'AUTO_PAUSE' } }), 1)
      await close(c.id)

      const cat = await prisma.category.create({ data: { name: `${TAG}-cat` } })
      categoryId = cat.id
      const p = await prisma.product.create({ data: { categoryId: cat.id, name: `${TAG}-p`, price: '100.00', status: 1 } })
      productId = p.id
      const us = await mkUsers(2)
      const c2 = await newCampaign('c17b', us.map((u) => u.id), { refs: JSON.stringify({ products: [{ id: p.id, price: '99.00' }], couponId: null, claimCode: null }) })
      await tick()
      const c2r = await campaign(c2.id)
      ok('改价 → 暂停、0 封', c2r.status === 'PAUSED' && (c2r.statusNote || '').includes('改价') && us.every((u) => callsFor(u.email) === 0), c2r.statusNote || '')
      await prisma.product.update({ where: { id: p.id }, data: { price: '99.00' } })
      await lifecycle.controlCampaign(c2.id, 'resume', actor.id)
      await tick()
      ok('恢复原价后继续 → 发完', us.every((u) => callsFor(u.email) === 1))
      await prisma.product.update({ where: { id: p.id }, data: { status: 0 } })
      const [v] = await mkUsers(1)
      const c3 = await newCampaign('c17c', [v.id], { refs: JSON.stringify({ products: [{ id: p.id, price: '99.00' }], couponId: null, claimCode: null }) })
      await tick()
      ok('下架 → 暂停', (await campaign(c3.id)).status === 'PAUSED' && callsFor(v.email) === 0)
      await close(c3.id)
    }

    /* ---------------------------------------------------------------- */
    T('18. 试探闸门：发满 canarySize 后等回执，≥80% 有回执再放行')
    {
      await setCfg({ canarySize: 10 })
      const us = await mkUsers(12)
      const c = await newCampaign('c18', us.map((u) => u.id))
      await tick()
      const sent1 = us.filter((u) => callsFor(u.email) === 1)
      eq('第一趟只发试探批次 10 封', sent1.length, 10)
      await tick()
      eq('回执不足：继续等待', us.filter((u) => callsFor(u.email) === 1).length, 10)
      const rows = await rowsOf(c.id)
      const sentRows = rows.filter((r) => r.status === 'SENT').slice(0, 8)
      await prisma.marketingMessage.updateMany({ where: { id: { in: sentRows.map((r) => r.id) } }, data: { delivery: 'DELIVERED', deliveryAt: new Date() } })
      await tick()
      ok('80% 有回执 → 放行、发完', us.every((u) => callsFor(u.email) === 1))
      eq('canaryDay = 今天', (await campaign(c.id)).canaryDay, bjDateKey(new Date()))
      await setCfg({ canarySize: 500 })
    }

    /* ---------------------------------------------------------------- */
    T('19. 账户级熔断 → 急停到次日窗口；手动解除后不被同一批旧回执再次熔断')
    {
      const holder = await newCampaign('c19-hist', [], { status: 'COMPLETED', materializedAt: new Date() })
      const bad = await mkUsers(30)
      await prisma.marketingMessage.createMany({
        data: bad.map((u, i) => ({
          campaignId: holder.id,
          userId: u.id,
          email: u.email,
          domain: u.email.split('@')[1],
          token: crypto.randomBytes(16).toString('hex'),
          status: 'SENT',
          claimedAt: new Date(),
          sentAt: new Date(),
          delivery: i < 3 ? 'INVALID' : 'DELIVERED', // 10% 无效
          deliveryAt: new Date(),
        })),
      })
      const [u] = await mkUsers(1)
      const c = await newCampaign('c19', [u.id])
      const s = await tick()
      eq('账户级熔断', s.stoppedBy, 'breaker')
      eq('急停到次日发送时段', (await getHalt()).until, nextDayWindowStart(cfg.sendWindow, new Date()).toISOString())
      eq('0 封', callsFor(u.email), 0)
      await clearHalt(actor.id)
      await tick()
      eq('手动解除后：旧回执不再触发，照常发出', callsFor(u.email), 1)
      await prisma.marketingMessage.deleteMany({ where: { campaignId: holder.id } })
      await close(c.id)
    }

    /* ================================================================ */
    /* 审查修复（C0–C19 里发送引擎这一份）的回归钉子                          */
    /* ================================================================ */

    // 直接造「有回执的已发行」（熔断统计用）；userId 为空即可，熔断只看 delivery / deliveryAt / complainedAt
    let rSeq = 0
    type Receipt = { delivery: string; detail?: string | null; complained?: boolean }
    const many = (n: number, r: Receipt): Receipt[] => Array.from({ length: n }, () => r)
    const receipts = async (campaignId: number, list: Receipt[]) => {
      const now = new Date()
      await prisma.marketingMessage.createMany({
        data: list.map((x) => {
          rSeq++
          const email = `${TAG}-r${rSeq}@${DOMAINS[rSeq % DOMAINS.length]}`
          return {
            campaignId,
            email,
            domain: email.split('@')[1],
            token: crypto.randomBytes(16).toString('hex'),
            status: 'SENT',
            claimedAt: now,
            sentAt: now,
            delivery: x.delivery,
            deliveryDetail: x.detail ?? null,
            deliveryAt: now,
            complainedAt: x.complained ? now : null,
          }
        }),
      })
    }
    const queueFor = (campaignId: number, u: { id: number; email: string }) =>
      prisma.marketingMessage.create({
        data: { campaignId, userId: u.id, email: u.email, domain: u.email.split('@')[1], token: crypto.randomBytes(16).toString('hex'), status: 'QUEUED' },
      })
    const sendingCampaign = (name: string, ids: number[] = []) =>
      newCampaign(name, ids, { status: 'SENDING', materializedAt: new Date(), startedAt: new Date() })
    const sumCalls = (us: { email: string }[]) => us.reduce((acc, u) => acc + callsFor(u.email), 0)
    const mkDraft = async (name: string, doc: EmailDoc, ids: number[]) => {
      const d = await prisma.marketingCampaign.create({
        data: {
          name: `${TAG}-${name}`,
          topic: 'PROMO',
          subject: '{{nickname}}，测试',
          preheader: '一封测试',
          doc: JSON.stringify(doc),
          audience: JSON.stringify({ type: 'USERS', userIds: ids }),
          status: 'DRAFT',
        },
      })
      campaignIds.push(d.id)
      return d
    }
    const couponBlock = (extra: Partial<CouponBlock>): CouponBlock => ({
      id: 'cp',
      type: 'coupon',
      mode: 'grant',
      title: '邮件专享券',
      ctaLabel: '去使用',
      bg: '#fff7ed',
      color: '#9a3412',
      ...extra,
    })
    const withCoupon = (b: CouponBlock): EmailDoc => ({ ...DOC, blocks: [...DOC.blocks, b] })

    /* ---------------------------------------------------------------- */
    T('21. 试探闸门：当天「继续」后重新做一批试探（审查 C0）')
    {
      await setCfg({ canarySize: 10 }) // 配置下限 10
      const us = await mkUsers(30)
      const c = await newCampaign('c21', us.map((u) => u.id))
      await tick()
      eq('第一趟只发试探 10 封', sumCalls(us), 10)
      await prisma.marketingMessage.updateMany({ where: { campaignId: c.id, status: 'SENT' }, data: { delivery: 'DELIVERED', deliveryAt: new Date() } })
      // 放行之后发到第 15 封，管理员暂停（比如看到了什么不对）
      behave = async (input) => {
        if (us.some((u) => u.email === input.to) && sumCalls(us) >= 15) await lifecycle.controlCampaign(c.id, 'pause', actor.id).catch(() => {})
        return OK()
      }
      await tick()
      behave = () => OK()
      eq('放行后发到第 15 封被暂停', sumCalls(us), 15)
      // 暂停前的 15 封回执全部到齐：旧实现下「今日已发 15 ≥ 10、回执 100%、熔断样本 0」→ 一恢复就直接放完剩下 15 封
      await prisma.marketingMessage.updateMany({ where: { campaignId: c.id, status: 'SENT' }, data: { delivery: 'DELIVERED', deliveryAt: new Date() } })
      await lifecycle.controlCampaign(c.id, 'resume', actor.id)
      await tick()
      eq('继续后先发新的一批试探 10 封（不是直接放完剩下 15 封）', sumCalls(us), 25)
      eq('新一批试探没回执之前 canaryDay 仍为空', (await campaign(c.id)).canaryDay, null)
      await tick()
      eq('新一批的回执不足：继续等（暂停前的旧回执不算数）', sumCalls(us), 25)
      await prisma.marketingMessage.updateMany({ where: { campaignId: c.id, status: 'SENT', delivery: null }, data: { delivery: 'DELIVERED', deliveryAt: new Date() } })
      await tick()
      eq('新一批回执到齐 → 放行、发完', sumCalls(us), 30)
      eq('canaryDay = 今天', (await campaign(c.id)).canaryDay, bjDateKey(new Date()))

      // 同一趟里被暂停又继续：试探计数的缓存按窗口起点区分，要按新窗口重数
      const vs = await mkUsers(20)
      const c2 = await newCampaign('c21b', vs.map((u) => u.id))
      behave = async (input) => {
        if (vs.some((u) => u.email === input.to) && sumCalls(vs) === 2) {
          await lifecycle.controlCampaign(c2.id, 'pause', actor.id)
          await lifecycle.controlCampaign(c2.id, 'resume', actor.id)
        }
        return OK()
      }
      await tick()
      behave = () => OK()
      // 第 2 封在「继续」之后才落 sentAt，算新窗口的第 1 封 → 新窗口再发 9 封凑满 10 封；旧缓存会只再发 8 封
      eq('同一趟暂停又继续：按新窗口重数（共 11 封，不是 10 封）', sumCalls(vs), 11)
      await close(c2.id)
      await setCfg({ canarySize: 500 })
    }

    /* ---------------------------------------------------------------- */
    T('22. 账户级熔断起点：别的急停冲不掉，解除别的急停也不挪（审查 C1）')
    {
      await resetHalt()
      const holder = await newCampaign('c22-hist', [], { status: 'COMPLETED', materializedAt: new Date() })
      // 一半无效：前面各节今天已经攒了几十条正常回执，比例要压得过它们
      const bad = () => receipts(holder.id, [...many(15, { delivery: 'INVALID' }), ...many(15, { delivery: 'DELIVERED' })])
      await bad()
      const [u] = await mkUsers(1)
      await newCampaign('c22', [u.id])
      eq('账户级熔断', (await tick()).stoppedBy, 'breaker')
      eq('急停带 kind = acct_breaker', (await getHalt()).kind, ACCT_BREAKER_KIND)
      await clearHalt(actor.id)
      const h2 = await getHalt()
      ok('解除账户级熔断 → acctSince = 解除时刻', !!h2.acctSince && h2.acctSince === h2.at, JSON.stringify(h2))
      const since = h2.acctSince
      // (a) 之后来了一个无关急停（结果未知 15 分钟之类）并自然过期：解除过的旧回执不能重新计入
      await setHalt(new Date(Date.now() + 300), '无关急停（itest）', 'itest')
      const h3 = await getHalt()
      ok('无关急停：带过 acctSince、kind 为空', h3.acctSince === since && !h3.kind && isHalted(h3), JSON.stringify(h3))
      await new Promise((r) => setTimeout(r, 400))
      const s3 = await tick()
      ok('无关急停过期后：旧回执不再触发熔断，照常发出', s3.stoppedBy !== 'breaker' && callsFor(u.email) === 1, `stoppedBy=${s3.stoppedBy}`)
      // (b) 解除一个无关急停：统计起点不能挪到解除时刻（否则之后的坏回执被悄悄清零）
      await bad()
      await setHalt(new Date(Date.now() + 600_000), '另一个无关急停（itest）', 'itest')
      await new Promise((r) => setTimeout(r, 20))
      await clearHalt(actor.id)
      const h4 = await getHalt()
      eq('解除无关急停：acctSince 不动', h4.acctSince, since)
      eq('acctBreakerSince 解析出同一时刻', acctBreakerSince(h4)?.toISOString(), since)
      const [v] = await mkUsers(1)
      await newCampaign('c22b', [v.id])
      eq('acctSince 之后的 30 条坏回执照样熔断', (await tick()).stoppedBy, 'breaker')
      eq('0 封', callsFor(v.email), 0)
      await clearHalt(actor.id)
      ok('再次解除账户级熔断 → acctSince 挪到这次解除', (await getHalt()).acctSince !== since)
      await tick()
      eq('解除后照常发出', callsFor(v.email), 1)
      ok('EMPTY_HALT / 旧 JSON 没有 acctSince → null（回落今日零点）', acctBreakerSince(EMPTY_HALT) === null && acctBreakerSince({ until: null, reason: null, at: null, by: null }) === null)
      await prisma.marketingMessage.deleteMany({ where: { campaignId: holder.id } })
    }

    /* ---------------------------------------------------------------- */
    T('23. 重新排队 vs 完成检测：先锁活动行（审查 C2）')
    {
      const [u] = await mkUsers(1)
      const c = await sendingCampaign('c23', [u.id])
      await prisma.marketingMessage.create({
        data: { campaignId: c.id, userId: u.id, email: u.email, domain: u.email.split('@')[1], token: crypto.randomBytes(16).toString('hex'), status: 'FAILED', errorCode: 'CONNECT', attempts: 5, claimedAt: new Date() },
      })
      // 模拟 worker 的完成检测：另一个事务把活动改成 COMPLETED 并持有行锁，这时管理员点了「重新排队」
      let release!: () => void
      const gate = new Promise<void>((r) => (release = r))
      let markLocked!: () => void
      const lockedP = new Promise<void>((r) => (markLocked = r))
      const holderTx = prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`UPDATE marketing_campaigns SET status = 'COMPLETED', completed_at = ${new Date()} WHERE id = ${c.id} AND status = 'SENDING'`
          markLocked()
          await gate
        },
        { timeout: 20_000 }
      )
      await lockedP
      let requeueDone = false
      const rq = lifecycle.controlCampaign(c.id, 'requeue', actor.id).then((r) => {
        requeueDone = true
        return r
      })
      await new Promise((r) => setTimeout(r, 400))
      ok('requeue 等在活动行锁上（SELECT … FOR UPDATE），没有拿旧快照往下走', !requeueDone)
      release()
      await holderTx
      const r = await rq
      ok('requeue 成功', r.message.includes('1'), r.message)
      eq('完成检测先提交 → requeue 读到 COMPLETED 并退回发送中', (await campaign(c.id)).status, 'SENDING')
      eq('行已排队', (await rowsOf(c.id))[0].status, 'QUEUED')
      await tick()
      eq('随后发出并再次完成', [callsFor(u.email), (await campaign(c.id)).status], [1, 'COMPLETED'])
    }

    /* ---------------------------------------------------------------- */
    T('24. 撤回定时 / 重新发送清掉物化到一半的残留行（审查 C3）')
    {
      const olds = await mkUsers(3)
      const fresh = await mkUsers(2)
      // 定时活动物化到一半进程被杀：留下旧受众的 QUEUED 行，materializedAt 仍为空
      const c = await newCampaign('c24', olds.map((u) => u.id), { scheduledAt: new Date(Date.now() + 3600_000), preheader: '一封测试' })
      const stale = (users: { id: number; email: string }[], status: 'QUEUED' | 'SKIPPED') =>
        prisma.marketingMessage.createMany({
          data: users.map((u) => ({
            campaignId: c.id,
            userId: u.id,
            email: u.email,
            domain: u.email.split('@')[1],
            token: crypto.randomBytes(16).toString('hex'),
            status,
            skipReason: status === 'SKIPPED' ? 'INACTIVE' : null,
          })),
        })
      await stale(olds, 'QUEUED')
      await lifecycle.controlCampaign(c.id, 'unschedule', actor.id)
      eq('撤回定时：残留行一并删掉', (await rowsOf(c.id)).length, 0)
      // 撤回与一个随后被杀的物化赛跑：草稿上又留下旧行（旧受众 QUEUED + 新受众里一人被旧规则判了 SKIPPED）
      await stale(olds, 'QUEUED')
      await stale([fresh[0]], 'SKIPPED')
      await prisma.marketingCampaign.update({ where: { id: c.id }, data: { audience: JSON.stringify({ type: 'USERS', userIds: fresh.map((u) => u.id) }) } })
      const cur = await campaign(c.id)
      await prisma.marketingCampaign.update({ where: { id: c.id }, data: { testedHash: lifecycle.campaignContentHash(cur), testedAt: new Date() } })
      const chk = await lifecycle.checkCampaign(c.id)
      ok('检查通过', chk.canLaunch, chk.issues.filter((i) => i.level === 'error').map((i) => i.code).join(','))
      await lifecycle.launchCampaign(c.id, { scheduledAt: null, expectedCount: chk.audience.eligible, expectedContentHash: chk.contentHash }, actor.id)
      eq('launch：草稿名下的残留行全部删掉', (await rowsOf(c.id)).length, 0)
      await tick()
      eq('旧受众 0 封', sumCalls(olds), 0)
      ok('新受众各 1 封（被旧规则判 SKIPPED 的人也发到了）', fresh.every((u) => callsFor(u.email) === 1), fresh.map((u) => callsFor(u.email)).join(','))
      eq('recipientCount = 新受众人数', (await campaign(c.id)).recipientCount, 2)
    }

    /* ---------------------------------------------------------------- */
    T('25. 限速等待期间退订 / 取消：等待放在复核之前（审查 C4）')
    {
      await setCfg({ ratePerSec: 0.2 }) // 间隔 5 秒：等待期间足够发生退订/取消
      const us = await mkUsers(3)
      const c = await newCampaign('c25', us.map((u) => u.id))
      let sleeps = 0
      let target: string | null = null
      await tick({
        sleep: async () => {
          sleeps++
          // 等待中的这一行此刻必须还是 CLAIMED（还没翻成 SENDING）
          const claimed = await prisma.marketingMessage.findFirst({ where: { campaignId: c.id, status: 'CLAIMED' } })
          if (claimed?.userId && !target) {
            target = claimed.email
            await applyConsentChange(claimed.userId, { kind: 'unsubscribe' }, { source: 'one_click', email: claimed.email })
          }
        },
      })
      ok('确实按间隔等了', sleeps >= 1, `sleeps=${sleeps}`)
      ok('等待时这一行还是 CLAIMED', !!target)
      if (target) {
        eq('等待期间退订的人：0 封', callsFor(target), 0)
        eq('…按退订跳过', byEmail(await rowsOf(c.id), target)?.skipReason, 'UNSUBSCRIBED')
        ok('其余两人照常发出（等待没有吞掉正常发送）', us.filter((u) => u.email !== target).every((u) => callsFor(u.email) === 1))
      }

      const vs = await mkUsers(3)
      const c2 = await newCampaign('c25b', vs.map((u) => u.id))
      let waitingRow: string | null = null
      await tick({
        sleep: async () => {
          const claimed = await prisma.marketingMessage.findFirst({ where: { campaignId: c2.id, status: 'CLAIMED' } })
          if (claimed && !waitingRow) {
            waitingRow = claimed.email
            await lifecycle.controlCampaign(c2.id, 'cancel', actor.id)
          }
        },
      })
      ok('等待时取消了活动', !!waitingRow)
      const rows2 = await rowsOf(c2.id)
      ok('等待期间取消：取消之后一封都没再发（发出的只有等待前那些）', sumCalls(vs) <= 1 && rows2.filter((r) => r.status === 'SENT').length === sumCalls(vs), `calls=${sumCalls(vs)}`)
      if (waitingRow) eq('等待中的那一行 → CANCELLED、0 封', [byEmail(rows2, waitingRow)?.status, callsFor(waitingRow)], ['CANCELLED', 0])
      await setCfg({ ratePerSec: 2 })
    }

    /* ---------------------------------------------------------------- */
    T('26. 券限定商品：冻结进 refs、下架即暂停（审查 C9）；面额 ≥30% 警告（C10）；领取券未开始（C12）；测试邮件链接（C11）')
    {
      const cat = await prisma.category.create({ data: { name: `${TAG}-cat2` } })
      extraCategoryIds.push(cat.id)
      const p = await prisma.product.create({ data: { categoryId: cat.id, name: `${TAG}-cp`, price: '10.00', status: 1 } })
      extraProductIds.push(p.id)
      const grantDoc = withCoupon(
        couponBlock({ grant: { kind: 'PRODUCT', discount: 2, minAmount: 0, productIds: [p.id], validity: { mode: 'days', days: 7 } } })
      )
      const frozen = await snapshot.freezeSnapshot({ id: 999999, topic: 'PROMO', subject: '{{nickname}}，测试', preheader: 'x', doc: grantDoc }, null)
      eq('C9 冻结：直发商品券的适用商品写进 refs.couponProducts', frozen.refs.couponProducts, [p.id])
      eq('C9 冻结：只写在「适用商品」里的商品不进 refs.products', frozen.refs.products, [])
      const claimCode = `${TAG}-cp`
      const cl = await prisma.coupon.create({ data: { code: claimCode, name: `${TAG} 领取商品券`, kind: 'PRODUCT', discount: '2.00', productIds: String(p.id), total: 100, status: 'ACTIVE' } })
      extraCouponIds.push(cl.id)
      const claimDoc = withCoupon(couponBlock({ mode: 'claim', title: '领券', ctaLabel: '立即领取', claimCode }))
      const frozenClaim = await snapshot.freezeSnapshot({ id: 999999, topic: 'PROMO', subject: '{{nickname}}，测试', preheader: 'x', doc: claimDoc }, null)
      eq('C9 冻结：领取型商品券的适用商品也写进 refs', [frozenClaim.refs.claimCode, frozenClaim.refs.couponProducts], [claimCode, [p.id]])
      ok('C9 在售时没有 COUPON_PRODUCT_OFFLINE', !frozenClaim.issues.some((i) => i.code === 'COUPON_PRODUCT_OFFLINE'))

      const us = await mkUsers(2)
      const refs = JSON.stringify({ products: [], couponId: null, claimCode: null, couponProducts: [p.id] })
      await newCampaign('c26-ok', [us[0].id], { refs })
      await tick()
      eq('C9 适用商品在售 → 照常发出', callsFor(us[0].email), 1)
      await prisma.product.update({ where: { id: p.id }, data: { status: 0 } })
      const cOff = await newCampaign('c26-off', [us[1].id], { refs })
      await tick()
      const co = await campaign(cOff.id)
      ok('C9 适用商品下架 → 暂停、0 封', co.status === 'PAUSED' && (co.statusNote || '').includes('券适用的商品') && callsFor(us[1].email) === 0, co.statusNote || '')
      const frozenOff = await snapshot.freezeSnapshot({ id: 999999, topic: 'PROMO', subject: '{{nickname}}，测试', preheader: 'x', doc: claimDoc }, null)
      ok('C9 领取型商品券的适用商品已下架 → 冻结时报 COUPON_PRODUCT_OFFLINE', frozenOff.issues.some((i) => i.code === 'COUPON_PRODUCT_OFFLINE' && i.level === 'error'))
      await close(cOff.id)
      await prisma.product.update({ where: { id: p.id }, data: { status: 1 } })

      // C10：直发券面额 ≥ 适用商品最低价 30% → 警告（只提醒不拦）
      const [du] = await mkUsers(1)
      const generous = (grant: CouponBlock['grant']) => mkDraft('c26-gen', withCoupon(couponBlock({ grant })), [du.id])
      const gen = async (grant: CouponBlock['grant']) => (await lifecycle.checkCampaign((await generous(grant)).id)).issues.find((i) => i.code === 'COUPON_GENEROUS')
      const g30 = await gen({ kind: 'PRODUCT', discount: 3, minAmount: 0, productIds: [p.id], validity: { mode: 'days', days: 7 } })
      ok('C10 ¥3 券 / 适用商品 ¥10（30%）→ COUPON_GENEROUS 警告', g30?.level === 'warn' && g30.message.includes('30%') && g30.blockId === 'cp', JSON.stringify(g30))
      ok('C10 ¥2.99（29.9%）→ 不警告', !(await gen({ kind: 'PRODUCT', discount: 2.99, minAmount: 0, productIds: [p.id], validity: { mode: 'days', days: 7 } })))
      const big = await prisma.product.create({ data: { categoryId: cat.id, name: `${TAG}-big`, price: '300000.00', status: 1 } })
      extraProductIds.push(big.id)
      const gT = await gen({ kind: 'THRESHOLD', discount: 100000, minAmount: 300000, productIds: [], validity: { mode: 'days', days: 7 } })
      ok('C10 满减券：按「价格 ≥ 门槛」的在售商品里最低价算（¥100000 / ¥300000）→ 警告', gT?.level === 'warn', JSON.stringify(gT))
      ok('C10 门槛之上没有在售商品 → 不警告', !(await gen({ kind: 'THRESHOLD', discount: 100000, minAmount: 1000000, productIds: [], validity: { mode: 'days', days: 7 } })))

      // C12：领取券 2 小时后才开始
      const futureCode = `${TAG}-fs`
      const fut = await prisma.coupon.create({
        data: { code: futureCode, name: `${TAG} 未开始`, kind: 'THRESHOLD', discount: '1.00', total: 100, status: 'ACTIVE', startAt: new Date(Date.now() + 2 * 3600_000), endAt: new Date(Date.now() + 10 * 86400_000) },
      })
      extraCouponIds.push(fut.id)
      const futDoc = withCoupon(couponBlock({ mode: 'claim', title: '领券', ctaLabel: '立即领取', claimCode: futureCode }))
      const fd = await mkDraft('c26-fut', futDoc, [du.id])
      await prisma.marketingCampaign.update({ where: { id: fd.id }, data: { testedHash: lifecycle.campaignContentHash(fd), testedAt: new Date() } })
      const k1 = await lifecycle.checkCampaign(fd.id)
      const ns = k1.issues.find((i) => i.code === 'COUPON_CLAIM_NOT_STARTED')
      ok('C12 立即发送 + 领取券 2 小时后才开始 → error、不能发送', ns?.level === 'error' && !k1.canLaunch, JSON.stringify(ns))
      ok('C12 …给的是「尚未开始」而不是笼统的「不可领取」', !k1.issues.some((i) => i.code === 'COUPON_CLAIM_INVALID'))
      const k2 = await lifecycle.checkCampaign(fd.id, { scheduledAt: new Date(Date.now() + 3 * 3600_000) })
      ok('C12 定时到开始时间之后 → 没有这条', !k2.issues.some((i) => i.code === 'COUPON_CLAIM_NOT_STARTED' || i.code === 'COUPON_CLAIM_INVALID'))
      const pv = await snapshot.renderForAdminPreview({ doc: futDoc, subject: '{{nickname}}，测试', preheader: 'x', topic: 'PROMO' })
      eq('C12 编辑器预览（还不知道何时发）→ 只是警告', pv.issues.find((i) => i.code === 'COUPON_CLAIM_NOT_STARTED')?.level, 'warn')
      ok('C12 预览仍按开始后的样子渲染出领取券', pv.html.includes(`/coupon/${futureCode}`))
      ok('C12 目录里保留未开始的批次（定时发送可用）', (await snapshot.loadCatalog()).coupons.some((c) => c.code === futureCode))
      let launchErr = ''
      try {
        await lifecycle.launchCampaign(fd.id, { scheduledAt: null, expectedCount: k1.audience.eligible, expectedContentHash: k1.contentHash }, actor.id)
      } catch (e) {
        launchErr = (e as Error).message
      }
      ok('C12 立即发送被拒', launchErr.includes('才开始'), launchErr)
      const [w] = await mkUsers(1)
      const cw = await newCampaign('c26-fut-send', [w.id], { refs: JSON.stringify({ products: [], couponId: null, claimCode: futureCode }) })
      await tick()
      const cwr = await campaign(cw.id)
      ok('C12 发送中领取券的开始时间在后面 → 暂停、0 封', cwr.status === 'PAUSED' && (cwr.statusNote || '').includes('尚未开始') && callsFor(w.email) === 0, cwr.statusNote || '')
      await prisma.coupon.update({ where: { id: fut.id }, data: { startAt: new Date(Date.now() - 60_000) } })
      await lifecycle.controlCampaign(cw.id, 'resume', actor.id)
      await tick()
      eq('C12 开始之后继续 → 发出', callsFor(w.email), 1)

      // C11：测试邮件的链接直达原 URL，但带 UTM 与 via=mail（与真实发送一致），不登记 links
      const td = await mkDraft('c26-test', DOC, [du.id])
      const te = await snapshot.buildTestEmail({ id: td.id, topic: 'PROMO', subject: '{{nickname}}，测试', preheader: 'x', doc: DOC }, { email: du.email, nickname: '测试' })
      const hrefs = Array.from(te.html.matchAll(/href="([^"]+)"/g)).map((m) => m[1].replace(/&amp;/g, '&'))
      const productsLink = hrefs.find((h) => /\/products(\?|$)/.test(h))
      ok('C11 按钮链接带 utm_campaign=mkt<id> 与 via=mail', !!productsLink && productsLink.includes(`utm_campaign=mkt${td.id}`) && productsLink.includes('utm_medium=email') && productsLink.includes('via=mail'), productsLink || hrefs.join(' '))
      ok('C11 测试邮件不走跳转、不留占位', !te.html.includes('/api/mkt/c/') && !te.html.includes('{{mkt_link'))
      ok('C11 mailto 链接不加 UTM', hrefs.filter((h) => h.startsWith('mailto:')).every((h) => !h.includes('utm_')))
      eq('C11 不登记 links', await prisma.marketingLink.count({ where: { campaignId: td.id } }), 0)
    }

    /* ---------------------------------------------------------------- */
    T('27. 发信方问题失败率熔断（审查 C19）；被阿里云拦截的投递上的投诉不算（C16 第 3 条）')
    {
      await resetHalt()
      // 账户级有 100 条正常回执稀释：只有问题活动自己被熔断
      const clean = await newCampaign('c27-clean', [], { status: 'COMPLETED', materializedAt: new Date() })
      await receipts(clean.id, many(100, { delivery: 'DELIVERED' }))
      const [a, b] = await mkUsers(2)
      const ca = await sendingCampaign('c27-auth', [a.id])
      await receipts(ca.id, [
        ...many(3, { delivery: 'FAILED', detail: 'SmtpDmaFail 550 5.7.1 DMARC policy reject' }),
        { delivery: 'FAILED', detail: 'SmtpMfBad' }, // 只有分类、没有原文
        ...many(26, { delivery: 'DELIVERED' }),
      ])
      await queueFor(ca.id, a)
      const cb = await sendingCampaign('c27-conn', [b.id])
      await receipts(cb.id, [...many(4, { delivery: 'FAILED', detail: 'SysOutConnError connect timeout' }), ...many(26, { delivery: 'DELIVERED' })])
      await queueFor(cb.id, b)
      const s = await tick()
      ok('账户级（160 条里 4 条发信方失败 2.5%）不熔断', s.stoppedBy !== 'breaker', `stoppedBy=${s.stoppedBy}`)
      const car = await campaign(ca.id)
      ok('活动 30 条里 4 条 SPF/DKIM/DMARC/拉黑类失败（13%）→ 活动熔断暂停', car.status === 'PAUSED' && (car.statusNote || '').includes('发信方'), car.statusNote || '')
      eq('被熔断的活动 0 封', callsFor(a.email), 0)
      eq('收件方连接失败（不是发信方问题）不算 → 照常发出', callsFor(b.email), 1)
      await close(ca.id)
      await prisma.marketingMessage.deleteMany({ where: { campaignId: { in: [clean.id, ca.id, cb.id] }, userId: null } })

      // 投诉：阿里云因为「之前投诉过」直接拦下的投递（delivery=FAILED）不是这封信招来的新投诉
      const [x, y] = await mkUsers(2)
      const cx = await sendingCampaign('c27-blocked', [x.id])
      await receipts(cx.id, [...many(2, { delivery: 'FAILED', detail: 'SysOutRecipientReportedSpam 560 reported', complained: true }), ...many(28, { delivery: 'DELIVERED' })])
      await queueFor(cx.id, x)
      const s2 = await tick()
      ok('拦截投递上的「投诉」不计：不熔断、照常发出', s2.stoppedBy !== 'breaker' && callsFor(x.email) === 1, `stoppedBy=${s2.stoppedBy}`)
      const cy = await sendingCampaign('c27-real', [y.id])
      await receipts(cy.id, [...many(2, { delivery: 'DELIVERED', complained: true }), ...many(28, { delivery: 'DELIVERED' })])
      await queueFor(cy.id, y)
      eq('送达后的真投诉 2 次照样熔断', (await tick()).stoppedBy, 'breaker')
      eq('0 封', callsFor(y.email), 0)
      await clearHalt(actor.id)
      await close(cy.id)
      await prisma.marketingMessage.deleteMany({ where: { campaignId: { in: [cx.id, cy.id] }, userId: null } })
    }

    /* ---------------------------------------------------------------- */
    T('20. 已知限制复核：审计与 PII')
    {
      const audits = await prisma.marketingAudit.findMany({ where: { campaignId: { in: campaignIds } }, select: { detail: true } })
      ok('审计 detail 里没有收件人邮箱', audits.every((a) => !a.detail || !a.detail.includes(`@${DOMAINS[0]}`)))
      ok('锁已释放', (await prisma.vmqLock.count({ where: { lockKey: 'mkt:send' } })) === 0)
    }
  } finally {
    // —— 清理：只删本次建的数据，恢复改过的 Setting ——
    try {
      const ids = campaignIds
      const emails = (await prisma.user.findMany({ where: { id: { in: userIds } }, select: { email: true } })).map((u) => u.email!).filter(Boolean)
      const campaignCoupons = (await prisma.marketingCampaign.findMany({ where: { id: { in: ids } }, select: { couponId: true } }))
        .map((c) => c.couponId)
        .filter((x): x is number => x != null)
      const noteCoupons = (await prisma.coupon.findMany({ where: { source: 'CAMPAIGN', note: { in: ids.map((id) => `营销活动 #${id}`) } }, select: { id: true } })).map((c) => c.id)
      const couponIds = Array.from(new Set([...campaignCoupons, ...noteCoupons, ...extraCouponIds]))
      await prisma.marketingMessage.deleteMany({ where: { campaignId: { in: ids } } })
      await prisma.marketingLink.deleteMany({ where: { campaignId: { in: ids } } })
      await prisma.marketingEvent.deleteMany({ where: { campaignId: { in: ids } } })
      await prisma.marketingAudit.deleteMany({ where: { campaignId: { in: ids } } })
      await prisma.marketingAudit.deleteMany({ where: { action: { in: ['HALT', 'CLEAR_HALT', 'UNSUPPRESS'] }, createdAt: { gte: t0 } } })
      await prisma.marketingCampaign.deleteMany({ where: { id: { in: ids } } })
      await prisma.couponGrant.deleteMany({ where: { couponId: { in: couponIds } } })
      await prisma.coupon.deleteMany({ where: { id: { in: couponIds } } })
      await prisma.marketingConsentLog.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.marketingConsent.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.marketingSuppression.deleteMany({ where: { email: { in: emails } } })
      await prisma.couponGrant.deleteMany({ where: { userId: { in: userIds } } })
      await prisma.user.deleteMany({ where: { id: { in: userIds } } })
      if (productId) await prisma.product.deleteMany({ where: { id: productId } })
      if (extraProductIds.length) await prisma.product.deleteMany({ where: { id: { in: extraProductIds } } })
      if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } })
      if (extraCategoryIds.length) await prisma.category.deleteMany({ where: { id: { in: extraCategoryIds } } })
      await prisma.vmqLock.deleteMany({ where: { lockKey: 'mkt:send' } })
      for (const key of SETTING_KEYS_ALL) {
        const old = savedSettings.find((s) => s.key === key)
        if (old) await prisma.setting.update({ where: { key }, data: { value: old.value } })
        else await prisma.setting.deleteMany({ where: { key } })
      }
      console.log('\n清理完成')
    } catch (e) {
      console.error('清理失败（请手工检查 TAG 数据）:', TAG, e)
      fail++
    }
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    fail++
    console.error('异常中止:', e)
  })
  .finally(() => {
    console.log(`\n通过 ${pass}，失败 ${fail}（TAG=${TAG}）`)
    process.exit(fail ? 1 : 0)
  })
