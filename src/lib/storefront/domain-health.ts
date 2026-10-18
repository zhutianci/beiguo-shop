/**
 * 渠道自定义主域名的「连通校验」记录（docs/多渠道分销-自定义域名.md 第 9 节）：纯函数 + 常量，不查库、不发请求。
 *
 * 【为什么要有】子域名（lulu.bigolab.com）的 DNS 在站长手里，而自定义域名（tibo.pw）的注册商账号在客户手里：客户随时可以把
 * DNS 服务器改回去、让域名过期，或者指到自己的服务器。自定义域名一旦是主域名（Tenant.origin），平台生成的所有链接——交易邮件、
 * 收据 / 邀请 / 开票这些带令牌的链接、收银台回跳——以及旧域名页面上的跳转，都会把买家送过去；买家账号又是两站通用的，
 * 假登录页收走的密码在 bigolab.com 上同样能用。所以「自定义域名是主域名」必须建立在**持续通过**的连通校验上：
 *  · 设为主域名之前当场校验一次（admin-tenants.setPrimaryDomain，不通过拒绝）；
 *  · cron 每 10 分钟复验一次（tenant/domain-verify.runDomainHealthCheck），结果写进 settings 表；
 *  · 店面解析（resolve.ts）读这份记录：不健康时 origin / canonicalHost 改用该渠道启用中的子域名——邮件与链接改走子域名、
 *    旧子域名不再跳走、自定义域名上的页面反过来跳回子域名；恢复后自动切回。数据库里的 Tenant.origin 不动。
 *
 * 【存哪】不改 schema（契约第 0 节第 5 条）：settings 表一个渠道一行，key = `tenant_domain_health:<tenantId>`（≤ 50 字符），
 * value = JSON。记录里带 host：主域名换了，旧记录自然作废（host 对不上 = 没有记录）。
 *
 * 【健康的定义】记录的 host = 当前主域名、没有处于降级状态（down）、最近一次成功在 HEALTH_OK_TTL_MS 以内、连续失败 < 阈值。
 *  · 没有记录 / 记录损坏 / host 对不上 → 不健康（fail closed：宁可暂时用子域名，也不把买家送到没验证过的地方）；
 *  · 降级要**连续三趟**失败（cron 每趟内部重试共 3 次、每次等 15 秒）：Cloudflare 抖一下不降级（2026-10-18 由两趟改三趟，见下面「静默」）；
 *  · 恢复同样要**连续两趟**成功（2026-10-01）：晚高峰时通时断的域名不会每 10 分钟在「自定义域名 / 子域名」之间来回跳——
 *    每跳一次，邮件链接与跳转目标就换一次，买家与告警群都受不了。所以用 down 这个「闩」记住降级状态，成功一趟不解除；
 *  · cron 停了（最近成功超过 50 分钟）同样不健康——没人复验，就不能再假定域名还在我们手里（这种不置 down，cron 恢复后一趟成功即切回，
 *    因为这不是域名本身出问题；resolve.ts 发现这种情况会给站长群告警一次，提示检查 cron）。
 *
 * 【静默：短时失联只切换、不告警】（2026-10-18 站长：「老是弹窗很烦」）实测失败的主因不是客户域名，而是**测量路径本身**：
 * 校验从阿里云北京经公网绕到海外 Cloudflare 再经隧道回本机，晚间 TLS 握手常要 5 秒、整次超时——连站长自己的子域名
 * tiboshop.bigolab.com 同一时刻也一样慢。所以：
 *  · 降级 / 恢复（改用子域名生成链接、停止跳转）照常自动进行，但**不通知任何人**；
 *  · 只有**连续失联满 2 小时**（failSince 起算，ALERT_AFTER_DOWN_MS）才算真出事：站长群一条「降级」告警 + 渠道一条「暂时无法访问」；
 *    之后仍失联、且本趟仍失败，站长群每 24 小时提醒一次（DOWN_REALERT_MS）；
 *  · 「已恢复」只在这次失联告警过时才发（站长群看 downAlertAt ≥ failSince；渠道看 told）。没告警过的失联恢复了，同样静默。
 *
 * 【渠道站内通知只跟状态走】记录里的 told 记住渠道最近一条通知说的是什么（down =「暂时无法访问」、up =「已恢复」）：
 * 失联满 2 小时且 told ≠ down → 发「暂时无法访问」；已恢复且 told = down → 发「已恢复」。渠道是唯一能去修 DNS 的人，
 * 它最新一条通知必须是真实状态（2026-10-01 复核的结论不变，只是加了「满 2 小时」的门槛）。
 */

/** 连续失败多少趟 cron 就降级（每趟内部共试 3 次） */
export const HEALTH_FAIL_THRESHOLD = 3
/** 降级后连续成功多少趟才恢复（防晚高峰抖动来回跳） */
export const HEALTH_RECOVER_THRESHOLD = 2
/** 最近一次成功的有效期：cron 每 10 分钟一趟；降级要连续失败三趟（约 30 分钟），这里留出余量，别让 cron 停摆误报先于降级 */
export const HEALTH_OK_TTL_MS = 50 * 60_000
/** resolve.ts「cron 停摆」告警的节流（与域名失联告警无关） */
export const ALERT_THROTTLE_MS = 6 * 3_600_000
/** 连续失联满这么久才告警（站长群 + 渠道）；更短的失联只静默切换（见文件头「静默」） */
export const ALERT_AFTER_DOWN_MS = 2 * 3_600_000
/** 失联告警之后仍未恢复，站长群隔多久再提醒一次 */
export const DOWN_REALERT_MS = 24 * 3_600_000

const KEY_PREFIX = 'tenant_domain_health:'

export function domainHealthKey(tenantId: number): string {
  return `${KEY_PREFIX}${tenantId}`
}

export interface DomainHealth {
  /** 被校验的主域名（规范化主机名） */
  host: string
  /** 最近一次校验通过的时间（ISO）；从未通过为 null */
  okAt: string | null
  /** 最近一次校验的时间（ISO） */
  checkedAt: string
  /** 连续失败趟数（通过即清零） */
  fails: number
  /** 连续成功趟数（失败即清零）；降级状态下攒够 HEALTH_RECOVER_THRESHOLD 才恢复 */
  oks: number
  /** 是否处于降级状态（连续失败达阈值置位，连续成功达阈值或站长手动重新校验通过才清除） */
  down: boolean
  /** 最近一次失败的归类原因（解析不到 / 指向了非公网地址 / 连接失败 / 证书错误 / 返回内容不符）；这是给渠道与告警群看的口径 */
  reason: string | null
  /** 最近一次失败的技术细节（HTTP 状态码、连接错误码等），**只给超管看**，不进渠道通知与告警 */
  detail: string | null
  /** 最近一次降级 / 仍未恢复告警的时间（ISO）；恢复后保留，用于 6 小时节流 */
  downAlertAt: string | null
  /** 最近一次「已恢复」告警的时间（ISO）；用于 6 小时节流 */
  upAlertAt: string | null
  /** 渠道最近一条站内通知说的状态：down =「暂时无法访问」，up =「已恢复」，null = 还没通知过（见文件头「渠道站内通知」） */
  told: DomainTenantNotice | null
  /** 这次失联从哪一趟开始（ISO）：连续失败的第一趟；降级中通过一趟不清，完全恢复才清为 null。告警门槛从这里算 */
  failSince: string | null
}

/** 渠道站内通知：down =「自定义域名暂时无法访问」，up =「已恢复」 */
export type DomainTenantNotice = 'down' | 'up'

const isoOrNull = (v: unknown): string | null => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null)
const clip = (v: unknown, n: number): string | null => (typeof v === 'string' && v ? v.slice(0, n) : null)
const nonNegInt = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null)

/**
 * told 字段：写了就信（'down' / 'up' / null）；没有这个字段的旧记录（told 上线前写的）按两个告警时间戳推断——
 * 当时渠道通知与降级 / 恢复告警同时发，哪个新就说明渠道最后听到的是哪个。推断错了的代价只是多发或少发一条对齐状态的通知。
 */
function parseTold(r: Record<string, unknown>, downAlertAt: string | null, upAlertAt: string | null): DomainTenantNotice | null {
  if (r.told === 'down' || r.told === 'up') return r.told
  if ('told' in r) return null
  if (downAlertAt && (!upAlertAt || Date.parse(downAlertAt) > Date.parse(upAlertAt))) return 'down'
  return upAlertAt ? 'up' : null
}

/** settings.value → 记录；格式不对一律 null（按「没有记录」处理，即不健康）。新增字段缺省时按「未降级、0 次、未告警」补齐 */
export function parseDomainHealth(raw: string | null | undefined): DomainHealth | null {
  if (!raw) return null
  let o: unknown
  try {
    o = JSON.parse(raw)
  } catch {
    return null
  }
  if (!o || typeof o !== 'object') return null
  const r = o as Record<string, unknown>
  if (typeof r.host !== 'string' || !r.host) return null
  if (typeof r.checkedAt !== 'string') return null
  if (r.okAt !== null && typeof r.okAt !== 'string') return null
  const fails = nonNegInt(r.fails)
  if (fails === null) return null
  const downAlertAt = isoOrNull(r.downAlertAt)
  const upAlertAt = isoOrNull(r.upAlertAt)
  return {
    host: r.host,
    okAt: (r.okAt as string | null) ?? null,
    checkedAt: r.checkedAt,
    fails,
    oks: nonNegInt(r.oks) ?? 0,
    // down 必须是明确的 true 才算降级；但连续失败已达阈值的记录无论 down 写成什么都按降级处理（脏数据不能把失联域名放行）
    down: r.down === true || fails >= HEALTH_FAIL_THRESHOLD,
    reason: clip(r.reason, 60),
    detail: clip(r.detail, 120),
    downAlertAt,
    upAlertAt,
    told: parseTold(r, downAlertAt, upAlertAt),
    // 旧记录（10-18 之前写的）没有 failSince：按 null 读，下一趟失败从那一刻起算（宁可晚告警，也不因旧数据立刻弹）
    failSince: isoOrNull(r.failSince),
  }
}

export function serializeDomainHealth(h: DomainHealth): string {
  return JSON.stringify({
    host: h.host,
    okAt: h.okAt,
    checkedAt: h.checkedAt,
    fails: h.fails,
    oks: h.oks,
    down: h.down,
    reason: h.reason ? h.reason.slice(0, 60) : null,
    detail: h.detail ? h.detail.slice(0, 120) : null,
    downAlertAt: h.downAlertAt,
    upAlertAt: h.upAlertAt,
    told: h.told,
    failSince: h.failSince,
  })
}

/** 这条记录能不能证明 host 此刻仍接在本站（定义见文件头） */
export function isDomainHealthy(h: DomainHealth | null, host: string, now = Date.now()): boolean {
  if (!h || h.host !== host || !h.okAt || h.down) return false
  const okAt = Date.parse(h.okAt)
  if (!Number.isFinite(okAt) || now - okAt > HEALTH_OK_TTL_MS) return false
  return h.fails < HEALTH_FAIL_THRESHOLD
}

/**
 * 不健康**只是因为**最近一次成功过期（记录属于这个 host、没降级、连续失败没到阈值）——也就是没人复验：cron 停了。
 * resolve.ts 据此给站长群告警一次（提示检查 cron 容器），与「域名本身失联」的告警分开。
 */
export function isDomainHealthStale(h: DomainHealth | null, host: string, now = Date.now()): boolean {
  if (!h || h.host !== host || h.down || h.fails >= HEALTH_FAIL_THRESHOLD) return false
  const okAt = h.okAt ? Date.parse(h.okAt) : NaN
  return Number.isFinite(okAt) && now - okAt > HEALTH_OK_TTL_MS
}

export type DomainHealthEvent = 'degraded' | 'recovered' | 'realert'
export type ProbeOutcome = { ok: true } | { ok: false; reason: string; detail: string | null }

const ms = (iso: string | null): number => (iso ? Date.parse(iso) : NaN)

/** 失联已满告警门槛（down 且 failSince 至今 ≥ 2 小时） */
function longDown(h: DomainHealth, now: number): boolean {
  const t = ms(h.failSince)
  return h.down && Number.isFinite(t) && now - t >= ALERT_AFTER_DOWN_MS
}

/** 这次失联告警过站长群没有（downAlertAt 不早于 failSince） */
function alertedThisOutage(h: { downAlertAt: string | null; failSince: string | null }): boolean {
  const a = ms(h.downAlertAt)
  const f = ms(h.failSince)
  return Number.isFinite(a) && Number.isFinite(f) && a >= f
}

/**
 * 要补发哪条渠道通知（一致为 null）：失联满 2 小时且渠道没听过 → down；已恢复且渠道最后听到的是 down → up。
 * cron 停摆那种「过期」不是域名本身的问题，不通知渠道
 */
function tenantNoticeFor(h: DomainHealth, now: number): DomainTenantNotice | null {
  if (h.down) return longDown(h, now) && h.told !== 'down' ? 'down' : null
  return h.told === 'down' ? 'up' : null
}

/**
 * cron 一趟校验之后的新记录与要发的告警 / 通知（纯函数）。prev 是读到的旧记录（host 不同视为没有）。
 *  · 失败：fails+1、oks 清零、failSince 没有就记本趟；fails 达阈值 → down（静默切子域名）；
 *  · 成功：fails 清零、oks+1、okAt 刷新；原本 down 的要 oks 达阈值才解除；完全恢复时 failSince 清空；
 *  · event（站长群）：失联满 2 小时、本趟仍失败、这次失联还没告警过 → degraded；已告警过、本趟仍失败、距上次 ≥ 24 小时 → realert；
 *    刚从 down 解除且这次失联告警过 → recovered。其余一律 null（短时失联静默）；
 *  · notice（渠道站内通知）：见 tenantNoticeFor 与文件头。
 */
export function nextDomainHealth(
  prev: DomainHealth | null,
  host: string,
  r: ProbeOutcome,
  now = Date.now(),
): { next: DomainHealth; event: DomainHealthEvent | null; notice: DomainTenantNotice | null } {
  const same = prev && prev.host === host ? prev : null
  const wasDown = !!same?.down
  const at = new Date(now).toISOString()
  const base = { host, checkedAt: at, downAlertAt: same?.downAlertAt ?? null, upAlertAt: same?.upAlertAt ?? null, told: same?.told ?? null }
  let next: DomainHealth
  if (r.ok) {
    const oks = (same?.oks ?? 0) + 1
    const down = wasDown && oks < HEALTH_RECOVER_THRESHOLD
    // 仍在降级中：保留上次失败的原因与失联起点，超管页面据此显示「已通过 1 次，再通过 1 次切回」
    next = {
      ...base,
      okAt: at,
      fails: 0,
      oks,
      down,
      reason: down ? (same?.reason ?? null) : null,
      detail: down ? (same?.detail ?? null) : null,
      failSince: down ? (same?.failSince ?? null) : null,
    }
  } else {
    const fails = (same?.fails ?? 0) + 1
    next = {
      ...base,
      okAt: same?.okAt ?? null,
      fails,
      oks: 0,
      down: wasDown || fails >= HEALTH_FAIL_THRESHOLD,
      reason: r.reason,
      detail: r.detail,
      failSince: same?.failSince ?? at,
    }
  }
  let event: DomainHealthEvent | null = null
  if (next.down) {
    if (!r.ok && longDown(next, now)) {
      if (!alertedThisOutage(next)) event = 'degraded'
      else if (now - ms(next.downAlertAt) >= DOWN_REALERT_MS) event = 'realert'
      if (event) next.downAlertAt = at
    }
  } else if (wasDown && same && alertedThisOutage(same)) {
    event = 'recovered'
    next.upAlertAt = at
  }
  const notice = tenantNoticeFor(next, now)
  if (notice) next.told = notice
  return { next, event, notice }
}

/**
 * 站长手动校验通过（设为主域名 / 「重新校验」）后的新记录：立即解除降级（站长当场看过结果，不必再等一趟），
 * 同一 host 的告警时间戳保留。原本 down 且这次失联告警过站长群 → event=recovered（站长群）；
 * 渠道最近听到的是「暂时无法访问」→ notice=up（渠道，不节流，理由同 nextDomainHealth）。
 */
export function manualVerifiedHealth(
  prev: DomainHealth | null,
  host: string,
  now = Date.now(),
): { next: DomainHealth; event: 'recovered' | null; notice: DomainTenantNotice | null } {
  const same = prev && prev.host === host ? prev : null
  const at = new Date(now).toISOString()
  const next: DomainHealth = {
    host,
    okAt: at,
    checkedAt: at,
    fails: 0,
    oks: HEALTH_RECOVER_THRESHOLD,
    down: false,
    reason: null,
    detail: null,
    downAlertAt: same?.downAlertAt ?? null,
    upAlertAt: same?.upAlertAt ?? null,
    told: same?.told ?? null,
    failSince: null,
  }
  let event: 'recovered' | null = null
  if (same?.down && alertedThisOutage(same)) {
    next.upAlertAt = at
    event = 'recovered'
  }
  const notice = tenantNoticeFor(next, now)
  if (notice) next.told = notice
  return { next, event, notice }
}
