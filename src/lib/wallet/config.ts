/**
 * wallet_config（settings.key = 'wallet_config'，docs/短信接码-设计.md §5.3、D36、附录 B 第 9 条）。
 *
 * 【读取失败的处理分两类】
 *   · 充值、「新单选余额」、自动退入：fail-closed —— 读不到、校验不过、行不存在，一律当关闭；
 *   · 释放、确认、退款、提现、返现入账、手动退入：**一律不读这份配置**（hold.ts / ledger.ts 不 import 本文件）——
 *     欠买家的钱在任何配置状态下都必须能退回去。
 * 读坏了推一次 wallet.alert（进程内 1 小时节流，E53）。
 *
 * 【保存校验（zod）】`100 ≤ minCents ≤ maxCents ≤ MAX_TOPUP_CENTS`、上下限与每个档位都是整数元、档位 1–8 个、
 * 升序不重复、落在 [minCents, maxCents] 内、pendingTopupPerUser 1–3。不合法拒绝保存（接口 400，页面逐项标红）。
 * 于是出厂之外的任何配置都不会出现「档位按钮点下去必然 400」或「上限高于迟到退入的金额上界」。
 *
 * 【MAX_TOPUP_CENTS 是代码常量】迟到付款退入的金额上界（MAX_TOPUP_CENTS + 49，§2.7）依赖它、且不读配置；
 * 配置只能在它之下调低（D36：支付宝风控时调低上限不用发版）。
 */
import { z } from 'zod'
import { prisma } from '../db'
import { notify } from '../notify'
// 零依赖的共享模块（只依赖 zod，不在 lib/jiema/ 下）：规则 17 不许 lib/wallet 静态 import lib/jiema
import { SMS_CONFIG_KEY, JIEMA_ORDER_AVAILABLE, jiemaPublicOpen, parseSmsConfigRaw } from '../jiema-config-schema'

/** 单笔充值的硬上界 ¥1,000（D36）。wallet_config.maxCents 不得超过它 */
export const MAX_TOPUP_CENTS = 100_000
export const WALLET_CONFIG_KEY = 'wallet_config'

/**
 * 充值功能（/wallet/topup 页面与 POST /api/wallet/topup）已经交付了吗。B0 = false，**B1 交付后为 true**。
 * false 时：topupOpenFor 恒为 false（钱包页不出 [充值]、不下发只有充值才用得上的说法），
 * 后台「设置」不许打开充值开关（saveWalletConfig 拒绝 topupEnabled=true）。只写代码做得到的（交接文档 1816）。
 * 它**不**进读取时的 zod 校验：库里万一是 topupEnabled=true（手改库），读取照常成功、只是按关闭处理，
 * 不会把「余额支付」等其它开关一起 fail-closed。
 * 回滚到 B0 镜像时它自然回到 false；充值开关本身（wallet_config.topupEnabled）出厂仍是关、受众仍是「仅管理员」。
 */
export const TOPUP_AVAILABLE = true

export interface WalletConfig {
  version: number
  /** 余额支付急停：关掉后新单不能选余额；已预扣的单照常确认或释放，退款照常入余额 */
  balancePayEnabled: boolean
  topupEnabled: boolean
  topupAudience: 'ADMIN_ONLY' | 'ALL'
  tiersCents: number[]
  minCents: number
  maxCents: number
  pendingTopupPerUser: number
  latepayAuto: boolean
}

/** 出厂值（站长 09-29 确认，Q5）。部署时由种子 SQL 写入；读不到时**不**回落到它（fail-closed） */
export const FACTORY_WALLET_CONFIG: WalletConfig = Object.freeze({
  version: 1,
  balancePayEnabled: true,
  topupEnabled: false,
  topupAudience: 'ADMIN_ONLY',
  tiersCents: [500, 1000, 1500, 2000, 5000],
  minCents: 100,
  maxCents: 100_000,
  pendingTopupPerUser: 2,
  latepayAuto: true,
}) as WalletConfig

const yuanInt = (label: string) =>
  z
    .number({ invalid_type_error: `${label}必须是数字` })
    .int(`${label}必须是整数分`)
    .refine((v) => v % 100 === 0, `${label}必须是整数元`)

/** 纯函数用的 zod：字段级规则 + 跨字段规则（superRefine 带 path，页面按 path 逐项标红） */
export const walletConfigSchema = z
  .object({
    version: z.number().int().min(1),
    balancePayEnabled: z.boolean(),
    topupEnabled: z.boolean(),
    topupAudience: z.enum(['ADMIN_ONLY', 'ALL']),
    tiersCents: z.array(yuanInt('档位')).min(1, '至少一个档位').max(8, '档位最多 8 个'),
    minCents: yuanInt('单笔下限').refine((v) => v >= 100, '单笔下限不能低于 ¥1'),
    maxCents: yuanInt('单笔上限').refine((v) => v <= MAX_TOPUP_CENTS, `单笔上限不能高于 ¥${MAX_TOPUP_CENTS / 100}`),
    pendingTopupPerUser: z.number().int('必须是整数').min(1, '最少 1').max(3, '最多 3（每人待付款收款单总共 ≤3）'),
    latepayAuto: z.boolean(),
  })
  .superRefine((c, ctx) => {
    if (c.minCents > c.maxCents) ctx.addIssue({ code: 'custom', path: ['minCents'], message: '单笔下限不能高于上限' })
    for (let i = 0; i < c.tiersCents.length; i++) {
      const t = c.tiersCents[i]
      if (t < c.minCents || t > c.maxCents) ctx.addIssue({ code: 'custom', path: ['tiersCents', i], message: `档位 ¥${t / 100} 不在单笔上下限之内` })
      if (i > 0 && t <= c.tiersCents[i - 1]) ctx.addIssue({ code: 'custom', path: ['tiersCents', i], message: '档位必须升序且不重复' })
    }
  })

export type WalletConfigCheck = { ok: true; config: WalletConfig } | { ok: false; errors: Record<string, string> }

/** 纯函数：校验一份配置（保存前、读取时共用）。errors 的键是字段路径（tiersCents.2 这种） */
export function checkWalletConfig(input: unknown): WalletConfigCheck {
  const r = walletConfigSchema.safeParse(input)
  if (r.success) return { ok: true, config: r.data }
  const errors: Record<string, string> = {}
  for (const i of r.error.issues) {
    const k = i.path.join('.') || '_'
    if (!errors[k]) errors[k] = i.message
  }
  return { ok: false, errors }
}

/**
 * 读失败时也给出库里那一行的版本号（storedVersion），后台「设置」拿它做乐观并发的 expectVersion——
 * 否则「合法 JSON、带 version、但校验不过」的行（手改库、以后的包给 zod 加了必填字段、调低了 MAX_TOPUP_CENTS）
 * 在页面上永远保存不了：页面只能发 0，库里是 N，每次都 409。
 */
export type WalletConfigRead =
  | { ok: true; config: WalletConfig; storedVersion: number }
  | { ok: false; reason: 'MISSING' | 'INVALID' | 'ERROR'; storedVersion: number }

/**
 * 纯函数：库里一行 wallet_config 的版本号（乐观并发用）。行不存在、不是合法 JSON、没有 version、
 * version 不是 [0, 2^31) 的整数，一律按 0。读取、保存、后台 GET 共用这一个口径。
 */
export function storedVersionOf(raw: string | null | undefined): number {
  if (raw == null) return 0
  try {
    const v = (JSON.parse(raw) as { version?: unknown } | null)?.version
    return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v < 2 ** 31 ? v : 0
  } catch {
    return 0
  }
}

let lastAlertAt = 0
function alertBroken(reason: string, detail: string): void {
  const now = Date.now()
  if (now - lastAlertAt < 3600_000) return
  lastAlertAt = now
  notify('wallet.alert', [
    { label: '问题', value: `wallet_config ${reason}`, color: 'warning' },
    { label: '影响', value: '充值、新单选余额、迟到付款自动退入已按关闭处理；释放、确认、退款、提现、返现入账不受影响' },
    { label: '详情', value: detail.slice(0, 200) },
  ], { link: '/admin/wallet?tab=settings', extraTitle: '配置读取失败' })
}

/**
 * 读当前配置。行不存在 / JSON 坏 / 校验不过 / 查库出错都返回 ok:false，调用方按「关闭」处理（fail-closed）。
 * 四种失败都推 wallet.alert（进程内 1 小时节流）：行不存在多半是部署时种子没跑，同样要让站长知道。
 */
export async function readWalletConfig(): Promise<WalletConfigRead> {
  let raw: string | null
  try {
    raw = (await prisma.setting.findUnique({ where: { key: WALLET_CONFIG_KEY } }))?.value ?? null
  } catch (e) {
    console.error('[wallet] 读取 wallet_config 失败', e)
    alertBroken('读取失败', (e as Error)?.message ?? String(e))
    return { ok: false, reason: 'ERROR', storedVersion: 0 }
  }
  if (raw == null) {
    alertBroken('行不存在', 'settings 里没有 wallet_config（部署种子 scripts/ops/wallet-b0-seed.sql 没跑？）；到后台「余额与充值 → 设置」保存一次即可')
    return { ok: false, reason: 'MISSING', storedVersion: 0 }
  }
  const storedVersion = storedVersionOf(raw)
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    alertBroken('不是合法 JSON', raw)
    return { ok: false, reason: 'INVALID', storedVersion }
  }
  const c = checkWalletConfig(parsed)
  if (!c.ok) {
    alertBroken('校验不通过', JSON.stringify(c.errors))
    return { ok: false, reason: 'INVALID', storedVersion }
  }
  return { ok: true, config: c.config, storedVersion }
}

export class WalletConfigConflict extends Error {
  constructor(public readonly storedBroken = false) {
    super(
      storedBroken
        ? '库里的配置已损坏，而且版本号与页面上的不一致（可能刚被别人改过），请刷新后再保存'
        : '配置已被别人改过，请刷新后再保存',
    )
    this.name = 'WalletConfigConflict'
  }
}

/**
 * 保存（后台「余额与充值 → 设置」）。乐观并发：expectVersion 必须等于库里那一行的版本号（storedVersionOf：
 * 行不存在、JSON 坏、没有合法 version 时为 0；**校验不过但带 version 的行按它自己的 version**——后台 GET 把它
 * 作为 storedVersion 交给页面），保存后 version = expectVersion + 1。于是坏掉的配置总能从页面修好。
 * 返回保存后的配置；校验不过返回 errors（不写库）。B1 之前（TOPUP_AVAILABLE=false）不许打开充值开关。
 */
export async function saveWalletConfig(
  input: Omit<WalletConfig, 'version'>,
  expectVersion: number,
): Promise<{ ok: true; config: WalletConfig; before: WalletConfig | null } | { ok: false; errors: Record<string, string> }> {
  const check = checkWalletConfig({ ...input, version: Math.max(expectVersion, 0) + 1 })
  if (!check.ok) return check
  if (!TOPUP_AVAILABLE && check.config.topupEnabled) return { ok: false, errors: { topupEnabled: '充值功能在 B1 上线后才能打开' } }
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ value: string }[]>`SELECT value FROM settings WHERE \`key\` = ${WALLET_CONFIG_KEY} FOR UPDATE`
    let before: WalletConfig | null = null
    const curVersion = storedVersionOf(rows[0]?.value)
    if (rows[0]) {
      try {
        const pc = checkWalletConfig(JSON.parse(rows[0].value))
        before = pc.ok ? pc.config : null
      } catch {
        before = null
      }
    }
    if (curVersion !== expectVersion) throw new WalletConfigConflict(!!rows[0] && before === null)
    const value = JSON.stringify(check.config)
    await tx.setting.upsert({ where: { key: WALLET_CONFIG_KEY }, create: { key: WALLET_CONFIG_KEY, value }, update: { value } })
    return { ok: true as const, config: check.config, before }
  })
}

/**
 * 充值金额校验（纯函数，D36、§1.16、附录 A 的 AMOUNT）：整数元、在当前配置的 [minCents, maxCents] 内，
 * 与充值格现有余额无关（不设总额上限，Q5）。返回 null = 通过，否则是给买家看的文案（按配置拼，不写死 1–1000）。
 */
export function validateTopupAmount(amountCents: unknown, cfg: Pick<WalletConfig, 'minCents' | 'maxCents'>): string | null {
  const msg = `请输入 ${cfg.minCents / 100}–${cfg.maxCents / 100} 之间的整数金额`
  if (typeof amountCents !== 'number' || !Number.isSafeInteger(amountCents)) return msg
  if (amountCents % 100 !== 0) return msg
  if (amountCents < cfg.minCents || amountCents > cfg.maxCents) return msg
  return null
}

/**
 * 充值对这个用户开放吗（充值功能已交付、topupEnabled、受众覆盖他）。配置读不到时调用方按 false 处理。
 * available 默认取代码常量 TOPUP_AVAILABLE（B0 恒 false）；这个参数只给纯函数测试用。
 */
export function topupOpenFor(cfg: WalletConfig | null, isAdmin: boolean, available: boolean = TOPUP_AVAILABLE): boolean {
  if (!available || !cfg || !cfg.topupEnabled) return false
  return cfg.topupAudience === 'ALL' || isAdmin
}

/**
 * 「余额能付接码」的文案与 [去接码] 按钮开关（§1.15、§6.6 第 4 条）：
 *   jiemaPublicOpen(sms_config)（整份 zod 校验通过 && 接码下单已交付 && enabled && audience=ALL）&& wallet_config.balancePayEnabled
 * 任一份配置读取失败都按 false（B0 时 sms_config 还不存在 → false，保留旧口径）。管理员在灰度期看到的与普通用户一致。
 *
 * 【S1 已收口 B0 的已知限制】原来只读 enabled / audience 两个字段，sms_config「这两个字段对、其余字段坏」时接码已 fail-closed 停售、
 * 这里却仍返回 true。现在 schema 在零依赖的共享模块 lib/jiema-config-schema.ts（不 import lib/jiema 的其余部分，规则 17 照样成立），
 * 这里与导航、sitemap 用同一个 jiemaPublicOpen 判定：sms_config 校验不过 → false；S2 交付前（JIEMA_ORDER_AVAILABLE=false）恒为 false。
 * orderAvailable 默认取代码常量（与 jiemaPublicOpen、topupOpenFor 同一做法）；这个参数只给测试用：常量为 false 时，
 * 「余额支付急停 / 受众仅管理员 / 配置坏了 → false」这些断言要在 orderAvailable=true 下测，否则全被常量短路、测不到东西（S1 评审修复）。
 */
export async function canUseForJiema(walletRead?: WalletConfigRead, orderAvailable: boolean = JIEMA_ORDER_AVAILABLE): Promise<boolean> {
  try {
    const [w, s] = await Promise.all([walletRead ?? readWalletConfig(), prisma.setting.findUnique({ where: { key: SMS_CONFIG_KEY } })])
    if (!w.ok || !w.config.balancePayEnabled || !s?.value) return false
    return jiemaPublicOpen(parseSmsConfigRaw(s.value), orderAvailable)
  } catch {
    return false
  }
}
