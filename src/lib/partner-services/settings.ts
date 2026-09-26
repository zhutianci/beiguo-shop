/**
 * 渠道后台：设置（WP7，设计 6.2「渠道配置 / 企业微信 webhook」、11.4、12.1）。settings.write 仅 OWNER。
 *
 * 【只读】费率、冻结期、最低结算额、申请间隔、收款信息掩码、主体类型（PARTNER_TENANT_SELECT；payoutHold 只给布尔，
 * 不给原因；payeeAccountEnc / wecomWebhookEnc / previewUserIds / payoutHoldReason 根本不选）。
 * 【可改】通知偏好（Tenant.noticePrefs：{ [kind]: boolean }，缺省 = 开）、企业微信 webhook。
 *
 * 【webhook 只写不读回】地址本身就是凭据（泄露了任何人都能往群里发、也能读到推送），所以：
 *  · 保存经 facade 的 setTenantWebhook（只接受 https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key= 前缀，加密在 facade 内完成，
 *    渠道层不 import tenant/crypto）；
 *  · 读取只给 webhookConfigured 布尔（用 count 判断非空，连密文都不选出来）；
 *  · 审计只记「配置 / 清除」，不记地址。
 * 【发送测试】写一条站内通知（TENANT_STATUS 类，标题「企业微信推送测试」），由 WP0 的通知通道在提交后推送到群里：
 * 推送载荷只有标题、类型、编号与后台链接，邮箱一律被替换（scrubForPush），不含卡密。每小时 5 次（路由限频）。
 * 测试消息借用 TENANT_STATUS 类型（通知类型是封闭枚举，归 WP0；另开一个 WEBHOOK_TEST 类型要改 types.ts），该类型推送被关掉时直接 400 提示。
 *
 * 【二期：推送方式（docs/多渠道分销-二期改动.md 3.2）】企业微信与邮箱两种，可同时开；noticePrefs 对两种都生效。
 *  · 开关：Tenant.noticeWecomOn（默认开）/ noticeEmailOn（默认关，没有通知邮箱不能开）；
 *  · 通知邮箱：等于当前操作人的登录邮箱直接保存，否则要 NOTICE 验证码（发码、验码、保存都在 facade 里，渠道层不碰 mail / verify-code）；
 *  · 各自的「发送测试」：企业微信测试只推企业微信（pushVia），邮件测试由 facade 同步发一封、当场告诉结果（文案不含「微信」）。
 * 读取时推送方式与客服信息按库里原值放在 transport / contact 两个外层键里（客服卡片归客服信息那一包），tenant 块保持一期的字段不变。
 */
import { prisma } from '../db'
import { writeAudit } from '../audit'
import {
  lockTenantRowForUpdate,
  sendTenantNoticeEmailCode,
  sendTenantNoticeTestEmail,
  setTenantNoticeEmail,
  setTenantNoticeTransport,
  setTenantWebhook,
} from '../tenant/partner-facade'
import { emitTenantNotice } from '../tenant/notice'
import { TENANT_NOTICE_KINDS, type PartnerContactDTO, type PartnerNoticeTransportDTO, type TenantNoticeKind } from '../tenant/types'
import { newPublicNo } from '../tenant/public-no'
import { assertTenantId } from './_scope'
import { PARTNER_TENANT_SELECT } from './selects'
import { PartnerServiceError } from './orders'

export type NoticePrefs = Record<TenantNoticeKind, boolean>

export interface PartnerSettings {
  tenant: {
    code: string
    status: string
    feeRateBp: number
    invoiceShareRateBp: number
    holdDays: number
    minPayoutCents: number
    requestIntervalDays: number
    payoutHold: boolean
    partyType: string | null
    payeeName: string | null
    payeeMethod: string | null
    payeeAccountMasked: string | null
    noticePrefs: NoticePrefs
  }
  webhookConfigured: boolean
  noticePrefs: NoticePrefs
  /** 二期：推送方式（noticeEmail 是店主自己填、已验证归属的完整地址；本接口只给 OWNER） */
  transport: PartnerNoticeTransportDTO
  /** 二期：客服信息原值（未设为 null，不做回退；前台回退主站见 contact-base.resolveStoreContact） */
  contact: PartnerContactDTO
}

/** 库里的 noticePrefs（可能缺项、可能是旧格式）→ 全量布尔表；缺省 = 开；只认已知类型 */
export function normalizeNoticePrefs(raw: unknown): NoticePrefs {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const out = {} as NoticePrefs
  for (const k of TENANT_NOTICE_KINDS) out[k] = src[k] !== false
  return out
}

async function webhookConfigured(tenantId: number): Promise<boolean> {
  return (await prisma.tenant.count({ where: { id: tenantId, wecomWebhookEnc: { not: null } } })) > 0
}

export async function partnerGetSettings(tenantId: number): Promise<PartnerSettings> {
  assertTenantId(tenantId)
  const [t, configured] = await Promise.all([prisma.tenant.findUnique({ where: { id: tenantId }, select: PARTNER_TENANT_SELECT }), webhookConfigured(tenantId)])
  if (!t) throw new Error(`[partner-settings] 渠道 ${tenantId} 不存在`)
  const prefs = normalizeNoticePrefs(t.noticePrefs)
  return {
    tenant: {
      code: t.code,
      status: t.status,
      feeRateBp: t.feeRateBp,
      invoiceShareRateBp: t.invoiceShareRateBp,
      holdDays: t.holdDays,
      minPayoutCents: t.minPayoutCents,
      requestIntervalDays: t.requestIntervalDays,
      payoutHold: t.payoutHold === true,
      partyType: t.partyType ?? null,
      payeeName: t.payeeName ?? null,
      payeeMethod: t.payeeMethod ?? null,
      payeeAccountMasked: t.payeeAccountMasked ?? null,
      noticePrefs: prefs,
    },
    webhookConfigured: configured,
    noticePrefs: prefs,
    transport: { noticeWecomOn: t.noticeWecomOn === true, noticeEmailOn: t.noticeEmailOn === true, noticeEmail: t.noticeEmail ?? null },
    contact: {
      supportWechat: t.supportWechat ?? null,
      supportQrUrl: t.supportQrUrl ?? null,
      supportEmail: t.supportEmail ?? null,
      supportHours: t.supportHours ?? null,
    },
  }
}

/**
 * 通知偏好：只接受已知类型的布尔值（未给的类型保持原值）；关掉的类型只是不推企业微信，站内通知照写。
 * 【并发】noticePrefs 是整块 JSON「读—合并—整块写回」：两个标签页同时各关一种类型时，REPEATABLE READ 的快照读会让后写的
 * 覆盖先写的（审计记了两次改动、库里只剩一次）。所以先对 tenants 行加 FOR UPDATE 再读：后到的请求等前一个提交后读到新值再合并。
 * 不用 JSON 等值做 CAS：库里可能是 NULL / 旧格式，JSON 比较在 MySQL 上对键序与 NULL 的语义不直观，行锁更可靠且只锁这一行。
 */
export async function partnerSetNoticePrefs(tenantId: number, userId: number, prefs: Partial<Record<TenantNoticeKind, boolean>>, req?: Request): Promise<NoticePrefs> {
  assertTenantId(tenantId)
  return prisma.$transaction(async (tx) => {
    // 行锁经 facade 取（渠道层禁原生 SQL，边界检查规则 3）
    await lockTenantRowForUpdate(tx, tenantId)
    // 加锁之后的读（InnoDB 下同事务内普通读仍走快照；快照在第一次一致性读时建立，而上面的 FOR UPDATE 是锁定读、不建快照，
    // 所以这里是本事务第一次一致性读，读到的是锁等待结束后已提交的最新值）
    const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: { noticePrefs: PARTNER_TENANT_SELECT.noticePrefs } })
    if (!t) throw new Error(`[partner-settings] 渠道 ${tenantId} 不存在`)
    const before = normalizeNoticePrefs(t.noticePrefs)
    const next = { ...before }
    const changed: Record<string, boolean> = {}
    for (const k of TENANT_NOTICE_KINDS) {
      const v = prefs[k]
      if (typeof v === 'boolean' && v !== before[k]) {
        next[k] = v
        changed[k] = v
      }
    }
    if (Object.keys(changed).length === 0) return next
    await tx.tenant.update({ where: { id: tenantId }, data: { noticePrefs: next } })
    await writeAudit(tx, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'settings.notice', targetType: 'settings', targetId: 'noticePrefs', diff: { changed }, req })
    return next
  })
}

/**
 * 设置 / 清除企业微信 webhook（只写不读回）。格式不合规 → 400（facade 抛 PartnerFacadeError）；
 * 数据密钥（TENANT_DATA_KEY）未配置 → 503（facade 抛 DataKeyMissingError，fail closed：不存明文）。
 * 保存与审计在同一事务里（主会话 D14：facade 的 setTenantWebhook 接受 tx）：审计写不进去就一起回滚，
 * 不会出现「设置生效了却没有留痕」；审计只记配置 / 清除，不记地址（地址即凭据）。
 */
export async function partnerSetWebhook(tenantId: number, userId: number, url: string | null, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  try {
    await prisma.$transaction(async (tx) => {
      await setTenantWebhook(tenantId, url, tx)
      await writeAudit(tx, {
        actorKind: 'TENANT',
        actorUserId: userId,
        tenantId,
        action: 'settings.webhook',
        targetType: 'settings',
        targetId: 'webhook',
        diff: { configured: url !== null },
        req,
      })
    })
  } catch (e) {
    const name = (e as { name?: unknown })?.name
    if (name === 'PartnerFacadeError') {
      throw new PartnerServiceError(400, '只支持企业微信群机器人地址（https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=…）')
    }
    if (name === 'DataKeyMissingError' || (e as { code?: unknown })?.code === 'DATA_KEY_MISSING') {
      throw new PartnerServiceError(503, '平台尚未配置数据密钥，暂不能保存企业微信 webhook，请联系平台')
    }
    throw e
  }
}

/**
 * 发送测试消息：未配置 → 400；否则写一条测试通知，提交后由通知通道推送到群里（异步，结果看群里是否收到）。
 * 二期：只推企业微信（pushVia）——测试标题带「微信」，进了邮件会命中阿里云禁发词；企业微信推送被关掉时直接 400（否则渠道干等）。
 */
export async function partnerTestWebhook(tenantId: number, userId: number, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  if (!(await webhookConfigured(tenantId))) throw new PartnerServiceError(400, '尚未配置企业微信 webhook')
  // 测试消息走「店铺状态变更」类型的通道；该类型被关掉时通知通道不会推送，直接告诉渠道而不是让他干等
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { noticePrefs: PARTNER_TENANT_SELECT.noticePrefs, noticeWecomOn: PARTNER_TENANT_SELECT.noticeWecomOn },
  })
  if (t && t.noticeWecomOn === false) throw new PartnerServiceError(400, '企业微信推送已关闭，请先在「推送方式」里打开再发送测试')
  if (!normalizeNoticePrefs(t?.noticePrefs).TENANT_STATUS) throw new PartnerServiceError(400, '请先在通知偏好里打开「店铺状态变更」的推送，再发送测试')
  await emitTenantNotice(null, {
    tenantId,
    kind: 'TENANT_STATUS',
    title: '企业微信推送测试',
    body: '这是一条测试消息：收到即表示渠道后台的通知可以推送到本群。',
    dedupeKey: `whtest:${tenantId}:${newPublicNo()}`,
    pushVia: 'wecom',
  })
  await writeAudit(null, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'settings.webhook_test', targetType: 'settings', targetId: 'webhook', req })
}

// =====================================================================================
// 二期：推送方式与通知邮箱（docs/多渠道分销-二期改动.md 3.2）。全部 settings.write（仅 OWNER），暂停营业时只读（路由不给 readOnlySafe）。
// 写库、验证码、发信都在 facade（边界规则 3）；这里负责审计，并把 facade 的结果翻成给用户看的 HTTP 错误。
// 审计不写邮箱地址：diff 只记开关与「已设置 / 已清除」（操作日志渠道成员都看得到，地址没必要在那里再出现一次）。
// =====================================================================================

/** 按名字与 code 识别 facade 的输入错误（不只靠 instanceof：同一模块在不同路由包里可能各有一份类定义） */
function isFacadeError(e: unknown, code: string): e is { code: string; detail?: string } {
  return (e as { name?: unknown })?.name === 'PartnerFacadeError' && (e as { code?: unknown })?.code === code
}

/**
 * 推送方式开关：只改传了布尔值的那一项。打开邮箱推送要求已设通知邮箱（facade 条件更新，否则 NO_NOTICE_EMAIL → 400）。
 * 行锁后读旧值 → 改 → 审计，同一事务；没有任何变化不写审计。
 */
export async function partnerSetNoticeTransport(
  tenantId: number,
  userId: number,
  input: { wecomOn?: boolean; emailOn?: boolean },
  req?: Request,
): Promise<PartnerNoticeTransportDTO> {
  assertTenantId(tenantId)
  try {
    return await prisma.$transaction(async (tx) => {
      await lockTenantRowForUpdate(tx, tenantId)
      const before = await tx.tenant.findUnique({ where: { id: tenantId }, select: { noticeWecomOn: PARTNER_TENANT_SELECT.noticeWecomOn, noticeEmailOn: PARTNER_TENANT_SELECT.noticeEmailOn } })
      if (!before) throw new Error(`[partner-settings] 渠道 ${tenantId} 不存在`)
      const after = await setTenantNoticeTransport(tenantId, input, tx)
      const changed: Record<string, boolean> = {}
      if (after.noticeWecomOn !== before.noticeWecomOn) changed.wecomOn = after.noticeWecomOn
      if (after.noticeEmailOn !== before.noticeEmailOn) changed.emailOn = after.noticeEmailOn
      if (Object.keys(changed).length) {
        await writeAudit(tx, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'settings.notice_transport', targetType: 'settings', targetId: 'transport', diff: { changed }, req })
      }
      return after
    })
  } catch (e) {
    if (isFacadeError(e, 'NO_NOTICE_EMAIL')) throw new PartnerServiceError(400, e.detail || '请先设置并验证通知邮箱，再打开邮箱推送')
    throw e
  }
}

/**
 * 给通知邮箱发验证码。等于当前操作人的登录邮箱时不发信，返回 needCode=false（前端直接保存）。
 * 路由另有限频；facade 内还有按邮箱 / 按渠道的限频（这个接口会往任意地址发信，不限死就成了垃圾邮件中转）。
 */
export async function partnerSendNoticeEmailCode(tenantId: number, userId: number, email: string): Promise<{ needCode: boolean; sent: boolean }> {
  assertTenantId(tenantId)
  const r = await sendTenantNoticeEmailCode(tenantId, userId, email)
  if (r.ok) return { needCode: r.needCode, sent: r.needCode }
  switch (r.reason) {
    case 'BAD_EMAIL':
      throw new PartnerServiceError(400, '邮箱格式不正确')
    case 'TOO_FREQUENT':
      throw new PartnerServiceError(429, '发送太频繁，请稍后再试（同一邮箱 60 秒一次）')
    case 'MAIL_UNCONFIGURED':
      throw new PartnerServiceError(503, '平台暂未开通邮件服务，暂不能设置通知邮箱，请联系平台')
    default:
      throw new PartnerServiceError(503, '验证码邮件发送失败，请稍后重试或换一个邮箱')
  }
}

/**
 * 保存 / 清除通知邮箱。email=null 清除（facade 同时关掉邮箱推送）；非登录邮箱须带验证码。保存与审计同事务。
 * 验证码在 facade 里先于保存消费（CAS）；事务若因审计失败回滚，这张码已用掉，重新获取即可（宁可多要一次码，不能不留痕）。
 */
export async function partnerSetNoticeEmail(
  tenantId: number,
  userId: number,
  email: string | null,
  code: string | null,
  req?: Request,
): Promise<PartnerNoticeTransportDTO> {
  assertTenantId(tenantId)
  return prisma.$transaction(async (tx) => {
    await lockTenantRowForUpdate(tx, tenantId)
    const r = await setTenantNoticeEmail(tenantId, userId, email, code, tx)
    if (!r.ok) {
      switch (r.reason) {
        case 'NEED_CODE':
          throw new PartnerServiceError(400, '该邮箱不是你的登录邮箱，请先获取验证码并填写')
        case 'BAD_CODE':
          throw new PartnerServiceError(400, '验证码错误或已过期')
        case 'TOO_MANY':
          throw new PartnerServiceError(400, '验证码错误次数过多，请重新获取')
        default:
          throw new PartnerServiceError(400, '邮箱格式不正确')
      }
    }
    await writeAudit(tx, {
      actorKind: 'TENANT',
      actorUserId: userId,
      tenantId,
      action: 'settings.notice_email',
      targetType: 'settings',
      targetId: 'noticeEmail',
      diff: { configured: r.noticeEmail !== null },
      req,
    })
    const t = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        noticeWecomOn: PARTNER_TENANT_SELECT.noticeWecomOn,
        noticeEmailOn: PARTNER_TENANT_SELECT.noticeEmailOn,
        noticeEmail: PARTNER_TENANT_SELECT.noticeEmail,
      },
    })
    if (!t) throw new Error(`[partner-settings] 渠道 ${tenantId} 不存在`)
    return { noticeWecomOn: t.noticeWecomOn, noticeEmailOn: t.noticeEmailOn, noticeEmail: t.noticeEmail }
  })
}

/** 邮件推送「发送测试」：facade 同步发一封到通知邮箱（未打开邮箱推送也能测），结果当场返回；成功写审计 */
export async function partnerTestNoticeEmail(tenantId: number, userId: number, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  const r = await sendTenantNoticeTestEmail(tenantId)
  if (!r.ok) {
    switch (r.reason) {
      case 'NO_NOTICE_EMAIL':
        throw new PartnerServiceError(400, '尚未设置通知邮箱')
      case 'TOO_FREQUENT':
        throw new PartnerServiceError(429, '测试太频繁，请稍后再试（每小时 5 次）')
      case 'MAIL_UNCONFIGURED':
        throw new PartnerServiceError(503, '平台暂未开通邮件服务，请联系平台')
      default:
        throw new PartnerServiceError(503, '测试邮件发送失败，请稍后重试')
    }
  }
  await writeAudit(null, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'settings.notice_email_test', targetType: 'settings', targetId: 'noticeEmail', req })
}
