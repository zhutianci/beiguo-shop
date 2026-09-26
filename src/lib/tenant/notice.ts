/**
 * 渠道站内通知 + 推送（设计 11.4、5.8；二期 docs/多渠道分销-二期改动.md 3.2）。唯一写入口。
 *
 * 【写库】TenantNotice 一行；dedupeKey 唯一 = 同一事件只通知一次。用 createMany({ skipDuplicates })（MySQL 的 INSERT IGNORE）
 * 而不是 create + 捕获 P2002：调用方多在业务事务里（计提、售后处理），Prisma 交互式事务里一条语句报错之后事务能否继续
 * 在 MySQL 上没有验证过（设计 17），不能拿业务事务去赌。
 *
 * 【推送在提交之后】拿不到事务的提交钩子，所以写库之后异步轮询「这一行在库里看得见了没有」（按随机 publicNo 查，
 * 事务外的连接只能看到已提交的数据）：看见了才推；业务事务回滚了就永远看不见，放弃推送——不会推出一条不存在的通知。
 * 整个推送过程不阻塞、不抛。
 *
 * 【两种推送方式，可同时开】（二期 3.2，渠道站长在设置中心自选）
 *  · 企业微信：Tenant.noticeWecomOn（默认开，与一期「配了 webhook 就推」一致）且配了 webhook。失败重试 3 次，成功写 pushedAt。
 *  · 邮箱：Tenant.noticeEmailOn 且有 noticeEmail（facade 保存时已验证归属）。发 mail.ts 的 sendTenantNoticeEmail，成功留 emailedAt。
 *    每个渠道限频：滚动 1 小时 20 封、北京时间自然日 100 封（按 emailedAt 计数）。渠道通知邮件和买家的验证码、交易邮件抢
 *    同一份阿里云日额度，不限死的话一个渠道批量调价（一次几十条 SUPPLY_CHANGED）就能把当天买家的验证码挤掉。
 *    超出不发（站内通知照写），当天第一次超出时在站内通知里留一条说明（不推送）。
 *  · 两种方式各自独立：企业微信重试时不拖慢邮件，邮件失败不影响企业微信。
 *
 * 【载荷】只放标题、正文、公开编号、事件类型与后台链接；**正文里的邮箱一律替换掉**（webhook 地址一旦泄露就是第三方可读，S16）。
 * 邮件另由 mail.ts 隐藏链接、过阿里云禁发词（命中整段降级为「请登录渠道后台查看」）。卡密、留言正文、交付内容不应该出现在
 * 任何通知里，调用方负责不传。
 * 【偏好】Tenant.noticePrefs[kind] === false 时两种方式都不推（站内通知照写）。
 * 【主站】tenantId === 1 直接返回（平台没有渠道通知）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { sendTenantNoticeEmail, systemEmailConfigured, type MailOpts, type TenantNoticeMailInfo } from '../mail'
import { openText } from './crypto'
import { newPublicNo } from './public-no'
import { TENANT_NOTICE_KIND_LABEL, type TenantNoticeKind } from './types'

export const WECOM_WEBHOOK_PREFIX = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key='

export interface TenantNoticeInput {
  tenantId: number
  kind: TenantNoticeKind
  title: string
  body?: string
  /** customer（二期 CUSTOMER_JOINED）→ 渠道后台客户详情页；refKey 是客户公开编号 */
  refType?: 'order' | 'statement' | 'listing' | 'after_sale' | 'customer'
  refKey?: string
  dedupeKey?: string
  /**
   * 只走其中一种推送方式（设置中心「发送测试」用：企业微信测试只推企业微信，免得顺带发一封测试标题带「微信」的邮件）。
   * 缺省 = 按渠道设置两种都推。只影响推送，站内通知照写。
   */
  pushVia?: 'wecom' | 'email'
}

/** 通知类型中文名（企业微信载荷、邮件主题、前台共用 types.ts 的一份） */
const KIND_LABEL: Readonly<Record<TenantNoticeKind, string>> = TENANT_NOTICE_KIND_LABEL

/** 邮件推送限频（每个渠道）。改这里要同步设置页文案（settings-view「推送方式」卡片） */
export const TENANT_NOTICE_MAIL_LIMITS = Object.freeze({ perHour: 20, perDay: 100 })

// ---------------------------------------------------------------------------
// 推送通道：默认 fetch / 阿里云；itest 可替换成计数桩（W0-7：同一 dedupeKey 两次只推一次）
// ---------------------------------------------------------------------------
export type NoticeTransport = (url: string, payload: unknown) => Promise<boolean>

const fetchTransport: NoticeTransport = async (url, payload) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  })
  const text = await res.text().catch(() => '')
  let errcode: number | undefined
  try {
    errcode = JSON.parse(text)?.errcode
  } catch {
    /* 非 JSON */
  }
  return res.ok && (errcode === undefined || errcode === 0)
}

let transport: NoticeTransport = fetchTransport
/** 仅供 scripts/itest-tenant：替换推送通道（null 恢复默认） */
export function setTenantNoticeTransportForTest(t: NoticeTransport | null): void {
  transport = t ?? fetchTransport
}

export type NoticeMailer = (to: string, n: TenantNoticeMailInfo, opts: MailOpts) => Promise<{ ok: boolean; detail?: string }>
let mailer: NoticeMailer | null = null
/** 仅供 scripts/itest-tenant：替换发信函数（null 恢复默认的 sendTenantNoticeEmail）。替换后不再检查阿里云是否配置 */
export function setTenantNoticeMailerForTest(m: NoticeMailer | null): void {
  mailer = m
}

// 等提交：先短后长，总计约 22 秒；推送重试：3 次
const VISIBLE_POLL_MS = [200, 800, 3000, 8000, 10000]
const PUSH_RETRY_MS = [0, 2000, 8000]
const pending = new Set<Promise<void>>()

/** 仅供测试：等所有在途推送结束 */
export async function waitTenantNoticePushesForTest(): Promise<void> {
  while (pending.size) await Promise.allSettled(Array.from(pending))
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function clip(s: string | null | undefined, max: number): string | null {
  if (s == null) return null
  const t = String(s)
  return t.length > max ? t.slice(0, max) : t
}

/** 推送前的脱敏：邮箱替换掉（通知正文可能由调用方拼了买家信息） */
export function scrubForPush(s: string): string {
  return s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[邮箱已隐藏]')
}

function partnerPath(refType: string | null, refKey: string | null): string {
  const k = refKey ? encodeURIComponent(refKey) : ''
  switch (refType) {
    case 'order':
      return k ? `/partner/orders/${k}` : '/partner/orders'
    case 'statement':
      return k ? `/partner/finance/statements/${k}` : '/partner/finance/statements'
    case 'listing':
      return '/partner/products'
    case 'after_sale':
      return '/partner/after-sales'
    case 'customer':
      return k ? `/partner/customers/${k}` : '/partner/customers'
    default:
      return '/partner/notices'
  }
}

type NoticeRow = { tenantId: number; kind: string; title: string; body: string | null; refType: string | null; refKey: string | null }
type TenantPushCfg = {
  wecomWebhookEnc: string | null
  noticePrefs: Prisma.JsonValue
  origin: string | null
  noticeWecomOn: boolean
  noticeEmailOn: boolean
  noticeEmail: string | null
}

async function pushWecom(publicNo: string, row: NoticeRow, t: TenantPushCfg): Promise<void> {
  let url: string
  try {
    url = openText('webhook', t.wecomWebhookEnc as string)
  } catch {
    console.error(`[tenant-notice] 租户 ${row.tenantId} 的 webhook 解密失败（TENANT_DATA_KEY 未配置或与加密时不符？），跳过推送`)
    return
  }
  if (!url.startsWith(WECOM_WEBHOOK_PREFIX)) {
    console.error(`[tenant-notice] 租户 ${row.tenantId} 的 webhook 不是企业微信地址，跳过推送`)
    return
  }

  const label = KIND_LABEL[row.kind as TenantNoticeKind] ?? row.kind
  const link = `${(t.origin || '').replace(/\/+$/, '')}${partnerPath(row.refType, row.refKey)}`
  const lines = [`## ${scrubForPush(row.title)}`, `**类型**：${label}`]
  if (row.refKey) lines.push(`**编号**：${scrubForPush(row.refKey)}`)
  if (row.body) lines.push(scrubForPush(row.body))
  if (t.origin) lines.push(`[前往渠道后台](${link})`)
  const payload = { msgtype: 'markdown', markdown: { content: lines.join('\n') } }

  for (const wait of PUSH_RETRY_MS) {
    if (wait) await sleep(wait)
    let ok = false
    try {
      ok = await transport(url, payload)
    } catch (e) {
      console.error('[tenant-notice] 推送异常', (e as Error)?.message || e)
    }
    if (ok) {
      await prisma.tenantNotice.updateMany({ where: { publicNo }, data: { pushedAt: new Date() } })
      return
    }
  }
  console.error(`[tenant-notice] 通知 ${publicNo} 推送 3 次均失败`)
}

// ---------------------------------------------------------------------------
// 邮件推送：限频（占位 CAS）→ 发信 → 失败释放占位
// ---------------------------------------------------------------------------
const HOUR_MS = 3600_000
const BJ_OFFSET_MS = 8 * HOUR_MS

/** 北京时间自然日的起点（UTC 时刻）与日期串（YYYYMMDD，当天第一次超限说明的去重键用） */
function bjDay(now: Date): { start: Date; key: string } {
  const bj = new Date(now.getTime() + BJ_OFFSET_MS)
  const startUtc = Date.UTC(bj.getUTCFullYear(), bj.getUTCMonth(), bj.getUTCDate()) - BJ_OFFSET_MS
  const key = `${bj.getUTCFullYear()}${String(bj.getUTCMonth() + 1).padStart(2, '0')}${String(bj.getUTCDate()).padStart(2, '0')}`
  return { start: new Date(startUtc), key }
}

type MailClaim = { kind: 'ok'; at: Date } | { kind: 'capped'; which: 'hour' | 'day' } | { kind: 'taken' }

/**
 * 占一个发信名额：锁渠道行 → 数最近 1 小时 / 当天已发（emailedAt 非空）→ 没超就把本条的 emailedAt 从 NULL 写成现在（CAS）。
 * 【为什么先占位再发】「先数、发完再写 emailedAt」在并发下会超发：一次批量调价同时写几十条通知，几十个推送协程同时数到 19，
 * 全都去发。锁渠道行让数与占位串行（只锁这一行，持锁只有两条 count 与一条 update）；emailedAt 从 NULL 起跳的 CAS 保证同一条
 * 通知只发一封。发信失败再把占位清掉（按占位时刻做 CAS，不会误清别人的）。
 * 进程恰好在占位与发信之间崩掉：这条算作已发（占了名额没发出去），只影响限频计数，不会重发、不会漏发别的通知。
 * 【锁后的 count 能看到别人刚提交的占位】FOR UPDATE 是锁定读、不建快照；之后第一次普通读才建快照（锁等待结束之后），
 * 与 partner-services/settings.ts 的 noticePrefs 读—合并—写同一道理。
 */
async function claimMailSlot(tenantId: number, publicNo: string): Promise<MailClaim> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const now = new Date()
    const hour = await tx.tenantNotice.count({ where: { tenantId, emailedAt: { gte: new Date(now.getTime() - HOUR_MS) } } })
    if (hour >= TENANT_NOTICE_MAIL_LIMITS.perHour) return { kind: 'capped', which: 'hour' } as const
    const day = await tx.tenantNotice.count({ where: { tenantId, emailedAt: { gte: bjDay(now).start } } })
    if (day >= TENANT_NOTICE_MAIL_LIMITS.perDay) return { kind: 'capped', which: 'day' } as const
    const r = await tx.tenantNotice.updateMany({ where: { publicNo, tenantId, emailedAt: null }, data: { emailedAt: now } })
    return r.count === 1 ? ({ kind: 'ok', at: now } as const) : ({ kind: 'taken' } as const)
  })
}

/**
 * 当天第一次超限：在站内通知里留一条说明（dedupeKey 按渠道 + 北京日期唯一，当天只留一条）。
 * 直接写行、**不推送**：说明本身再推一遍没有意义（邮件已经超限，企业微信那边本来就收到了原通知）。
 * 类型借用 TENANT_STATUS（通知类型是封闭枚举；标题写明是推送说明，不会被误读成店铺状态变了）。
 */
async function noteMailCapped(tenantId: number, which: 'hour' | 'day'): Promise<void> {
  const { key } = bjDay(new Date())
  const { perHour, perDay } = TENANT_NOTICE_MAIL_LIMITS
  await prisma.tenantNotice.createMany({
    data: [
      {
        publicNo: newPublicNo(),
        tenantId,
        kind: 'TENANT_STATUS',
        title: '通知邮件已达发送上限',
        body: `${which === 'hour' ? `最近 1 小时已发 ${perHour} 封` : `今天已发 ${perDay} 封`}通知邮件（每小时最多 ${perHour} 封、每天最多 ${perDay} 封），超出部分不再发邮件；全部通知仍可在通知中心查看。`,
        dedupeKey: `mailcap:${tenantId}:${key}`,
      },
    ],
    skipDuplicates: true,
  })
}

/** 通知邮箱的最低校验（facade 保存时已严格校验并验证归属；这里只防库里被手改成奇怪的值） */
function noticeEmailOf(v: string | null): string | null {
  const e = (v || '').trim().toLowerCase()
  if (!e || e.length > 120 || !/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e)) return null
  return e
}

async function pushEmail(publicNo: string, row: NoticeRow, t: TenantPushCfg): Promise<void> {
  const to = noticeEmailOf(t.noticeEmail)
  if (!to) return
  // 没配发信：不占名额、不刷日志（开发环境、或站长暂时停了发信账号）
  if (!mailer && !systemEmailConfigured()) return
  const claim = await claimMailSlot(row.tenantId, publicNo)
  if (claim.kind === 'capped') {
    await noteMailCapped(row.tenantId, claim.which)
    return
  }
  if (claim.kind !== 'ok') return
  let ok = false
  try {
    const info: TenantNoticeMailInfo = {
      kind: row.kind as TenantNoticeKind,
      title: row.title,
      body: row.body,
      refKey: row.refKey,
      path: partnerPath(row.refType, row.refKey),
    }
    // 只传渠道 origin（按钮链到渠道后台）；不带客服邮箱页脚——收件人是店主自己
    const opts: MailOpts = { origin: t.origin || undefined }
    const r = await (mailer ?? sendTenantNoticeEmail)(to, info, opts)
    ok = r.ok
    if (!ok) console.error(`[tenant-notice] 通知 ${publicNo} 邮件发送失败`, r.detail ?? '')
  } catch (e) {
    console.error(`[tenant-notice] 通知 ${publicNo} 邮件发送异常`, (e as Error)?.message || e)
  }
  // 不重试：阿里云接口超时可能其实已发出，重试会重复发信并多占额度；站内通知与企业微信照常，店主不会漏看
  if (!ok) await prisma.tenantNotice.updateMany({ where: { publicNo, emailedAt: claim.at }, data: { emailedAt: null } })
}

async function pushWhenCommitted(publicNo: string, alreadyCommitted: boolean, via: TenantNoticeInput['pushVia']): Promise<void> {
  try {
    let row: NoticeRow | null = null
    for (const wait of alreadyCommitted ? [0] : VISIBLE_POLL_MS) {
      if (wait) await sleep(wait)
      row = await prisma.tenantNotice.findUnique({
        where: { publicNo },
        select: { tenantId: true, kind: true, title: true, body: true, refType: true, refKey: true },
      })
      if (row) break
    }
    if (!row) return // 业务事务回滚了：这条通知不存在，不推

    const t = await prisma.tenant.findUnique({
      where: { id: row.tenantId },
      select: { wecomWebhookEnc: true, noticePrefs: true, origin: true, noticeWecomOn: true, noticeEmailOn: true, noticeEmail: true },
    })
    if (!t) return
    const prefs = t.noticePrefs
    if (prefs && typeof prefs === 'object' && !Array.isArray(prefs) && (prefs as Record<string, unknown>)[row.kind] === false) return

    const jobs: Promise<void>[] = []
    if (via !== 'email' && t.noticeWecomOn && t.wecomWebhookEnc) jobs.push(pushWecom(publicNo, row, t))
    if (via !== 'wecom' && t.noticeEmailOn && t.noticeEmail) jobs.push(pushEmail(publicNo, row, t))
    const rs = await Promise.allSettled(jobs)
    for (const r of rs) if (r.status === 'rejected') console.error('[tenant-notice] 推送流程异常', (r.reason as Error)?.message || r.reason)
  } catch (e) {
    console.error('[tenant-notice] 推送流程异常', (e as Error)?.message || e)
  }
}

/**
 * 写一条渠道通知；提交后异步按渠道设置推企业微信 / 发邮件。
 *  · tx 非空：与业务同事务写入（事务回滚则通知也不存在、也不会被推送）。写库异常原样抛给调用方。
 *  · tx 为空：独立写入；写库异常只记日志、不抛（通知不是业务的一部分）。
 * 同一 dedupeKey 第二次调用什么都不做（不重复写、不重复推）。
 */
export async function emitTenantNotice(tx: Prisma.TransactionClient | null, n: TenantNoticeInput): Promise<void> {
  if (n.tenantId === 1) return
  const run = async () => {
    if (!Number.isInteger(n.tenantId) || n.tenantId < 2) throw new Error(`[tenant-notice] tenantId 非法：${n.tenantId}`)
    const db = tx ?? prisma
    const dedupeKey = clip(n.dedupeKey, 64)
    for (let attempt = 0; attempt < 3; attempt++) {
      const publicNo = newPublicNo()
      const r = await db.tenantNotice.createMany({
        data: [
          {
            publicNo,
            tenantId: n.tenantId,
            kind: n.kind,
            title: clip(n.title, 120) || KIND_LABEL[n.kind] || n.kind,
            body: clip(n.body, 500),
            refType: n.refType ?? null,
            refKey: clip(n.refKey, 40),
            dedupeKey,
          },
        ],
        skipDuplicates: true,
      })
      if (r.count === 1) {
        const p = pushWhenCommitted(publicNo, tx === null, n.pushVia)
        pending.add(p)
        p.finally(() => pending.delete(p))
        return
      }
      // count=0：dedupeKey 已存在（已发过，正常结束），或随机编号撞了（换一个再试）
      if (dedupeKey && (await db.tenantNotice.count({ where: { dedupeKey } })) > 0) return
    }
    throw new Error('[tenant-notice] 写入通知失败（编号连续冲突）')
  }
  if (tx) return run()
  try {
    await run()
  } catch (e) {
    console.error('[tenant-notice] 写入通知失败', (e as Error)?.message || e)
  }
}
