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

/** 单笔充值的硬上界 ¥1,000（D36）。wallet_config.maxCents 不得超过它 */
export const MAX_TOPUP_CENTS = 100_000
export const WALLET_CONFIG_KEY = 'wallet_config'

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

export type WalletConfigRead = { ok: true; config: WalletConfig } | { ok: false; reason: 'MISSING' | 'INVALID' | 'ERROR' }

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

/** 读当前配置。行不存在 / JSON 坏 / 校验不过 / 查库出错都返回 ok:false，调用方按「关闭」处理（fail-closed） */
export async function readWalletConfig(): Promise<WalletConfigRead> {
  let raw: string | null
  try {
    raw = (await prisma.setting.findUnique({ where: { key: WALLET_CONFIG_KEY } }))?.value ?? null
  } catch (e) {
    console.error('[wallet] 读取 wallet_config 失败', e)
    alertBroken('读取失败', (e as Error)?.message ?? String(e))
    return { ok: false, reason: 'ERROR' }
  }
  if (raw == null) return { ok: false, reason: 'MISSING' }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    alertBroken('不是合法 JSON', raw)
    return { ok: false, reason: 'INVALID' }
  }
  const c = checkWalletConfig(parsed)
  if (!c.ok) {
    alertBroken('校验不通过', JSON.stringify(c.errors))
    return { ok: false, reason: 'INVALID' }
  }
  return { ok: true, config: c.config }
}

export class WalletConfigConflict extends Error {
  constructor() {
    super('配置已被别人改过，请刷新后再保存')
    this.name = 'WalletConfigConflict'
  }
}

/**
 * 保存（后台「余额与充值 → 设置」）。乐观并发：expectVersion 必须等于库里当前版本（行不存在时为 0），
 * 保存后 version + 1。返回保存后的配置；校验不过返回 errors（不写库）。
 */
export async function saveWalletConfig(
  input: Omit<WalletConfig, 'version'>,
  expectVersion: number,
): Promise<{ ok: true; config: WalletConfig; before: WalletConfig | null } | { ok: false; errors: Record<string, string> }> {
  const check = checkWalletConfig({ ...input, version: Math.max(expectVersion, 0) + 1 })
  if (!check.ok) return check
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ value: string }[]>`SELECT value FROM settings WHERE \`key\` = ${WALLET_CONFIG_KEY} FOR UPDATE`
    let before: WalletConfig | null = null
    let curVersion = 0
    if (rows[0]) {
      try {
        const prev = JSON.parse(rows[0].value) as Partial<WalletConfig>
        curVersion = Number.isSafeInteger(prev.version) ? Number(prev.version) : 0
        const pc = checkWalletConfig(prev)
        before = pc.ok ? pc.config : null
      } catch {
        curVersion = 0
      }
    }
    if (curVersion !== expectVersion) throw new WalletConfigConflict()
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

/** 充值对这个用户开放吗（topupEnabled 且受众覆盖他）。配置读不到时调用方按 false 处理 */
export function topupOpenFor(cfg: WalletConfig | null, isAdmin: boolean): boolean {
  if (!cfg || !cfg.topupEnabled) return false
  return cfg.topupAudience === 'ALL' || isAdmin
}

/**
 * 「余额能付接码」的文案与 [去接码] 按钮开关（§1.15、§6.6 第 4 条）：
 *   sms_config.enabled && sms_config.audience === 'ALL' && wallet_config.balancePayEnabled
 * 任一份配置读取失败都按 false（B0 时 sms_config 还不存在 → false，保留旧口径）。管理员在灰度期看到的与普通用户一致。
 * sms_config 的完整校验在 S1 的 lib/jiema/config.ts；这里只读两个字段，不 import 接码代码（规则 17）。
 */
export async function canUseForJiema(walletRead?: WalletConfigRead): Promise<boolean> {
  try {
    const [w, s] = await Promise.all([walletRead ?? readWalletConfig(), prisma.setting.findUnique({ where: { key: 'sms_config' } })])
    if (!w.ok || !w.config.balancePayEnabled || !s?.value) return false
    const sms = JSON.parse(s.value) as { enabled?: unknown; audience?: unknown }
    return sms?.enabled === true && sms?.audience === 'ALL'
  } catch {
    return false
  }
}
