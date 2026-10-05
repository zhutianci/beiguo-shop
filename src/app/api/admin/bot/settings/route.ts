export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { adapterName, wxpadEnvStatus } from '@/lib/bot/adapters'
import {
  BotConfigConflict,
  DEFAULT_BOT_CONFIG,
  botEnabledByEnv,
  linkOrigin,
  readBotConfig,
  updateBotConfig,
  type BotConfig,
} from '@/lib/bot/config'
import { auditSoft, currentActor, failFields, intIn, numIn, readBody } from '@/app/api/admin/bot/_lib/common'
import type { CommandInfoDTO, EditableConfig, SettingsDTO } from '@/app/admin/bot/types'

/** 不能关掉的指令：「锁定」是紧急刹车，任何时候都得能用；「帮助」是其余一切指令的入口 */
const PROTECTED_COMMANDS = new Set(['锁定', '帮助'])

/** 链接域名：只收 https:// + 主机名（可带端口），不带路径、查询串——推送里的链接是「域名 + 代码拼的路径」 */
const ORIGIN_RE = /^https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?$/

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

/** 完整配置 → 后台可调的那部分（locked 系列只能经「锁定 / 解锁」，issueUserId 只由种子 SQL 写） */
function editableOf(c: Readonly<BotConfig>): EditableConfig {
  return {
    enabled: c.enabled,
    caps: { ...c.caps },
    priceWarn: { ...c.priceWarn },
    pacing: { ...c.pacing },
    quietDefault: c.quietDefault ? { ...c.quietDefault } : null,
    linkOrigin: c.linkOrigin,
    tenantReplyTtlDays: c.tenantReplyTtlDays,
    disabledCommands: c.disabledCommands.slice(),
    newAccountQuietHours: c.newAccountQuietHours,
  }
}

/**
 * 指令注册表 → 设置页的一览。注册表在模块加载时自检（assertRegistry），自检不过会抛：
 * 这里动态 import，抛了就把原因交给页面（此时「单指令开关」只能保留或去掉已有的关闭项，不能新增）。
 */
async function loadCommands(): Promise<{ list: CommandInfoDTO[]; error: string | null }> {
  try {
    const { COMMANDS } = await import('@/lib/bot/commands')
    const list: CommandInfoDTO[] = COMMANDS.map((c) => ({
      name: c.name,
      aliases: Array.from(c.aliases ?? []),
      tier: c.tier,
      scopes: Array.from(c.scopes),
      summary: c.help.summary,
      protected: PROTECTED_COMMANDS.has(c.name),
    }))
    return { list, error: null }
  } catch (e) {
    console.error('[bot-admin] 指令注册表加载失败', (e as Error)?.message)
    return { list: [], error: `指令注册表加载失败：${(e as Error)?.message || '未知原因'}` }
  }
}

async function buildSettings(): Promise<SettingsDTO> {
  const [cfg, cmds] = await Promise.all([readBotConfig({ fresh: true }), loadCommands()])
  const config = cfg.ok ? cfg.config : null
  return {
    ok: cfg.ok,
    reason: cfg.ok ? null : cfg.reason,
    config: config ? editableOf(config) : null,
    version: config ? config.version : null,
    readonly: config ? { locked: config.locked, lockedAt: config.lockedAt, lockedBy: config.lockedBy, issueUserId: config.issueUserId } : null,
    defaults: editableOf(DEFAULT_BOT_CONFIG),
    effectiveLinkOrigin: linkOrigin(config ?? undefined),
    env: { botEnabled: botEnabledByEnv(), adapter: adapterName(), ...wxpadEnvStatus() },
    commands: cmds.list,
    commandsError: cmds.error,
  }
}

/**
 * 逐项校验后台提交的 EditableConfig。范围与 lib/bot/config.ts 的 normalizeBotConfig 的夹取范围一致——
 * 那边是「读的时候把越界值悄悄夹回去」，这里是「写的时候越界直接拒绝并指出字段」，免得站长以为存进去的是自己填的数。
 * 字段缺失也算错（页面每次都提交完整的一份）。
 */
function validate(raw: Record<string, unknown>, known: { names: Set<string> | null; current: string[] }): { config: EditableConfig | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const caps: Record<string, unknown> = isObj(raw.caps) ? raw.caps : {}
  const pw: Record<string, unknown> = isObj(raw.priceWarn) ? raw.priceWarn : {}
  const pacing: Record<string, unknown> = isObj(raw.pacing) ? raw.pacing : {}

  if (typeof raw.enabled !== 'boolean') errors.enabled = '推送运行开关必须是开 / 关'
  const issuePerDay = intIn(caps.issuePerDay, 0, 1000)
  if (issuePerDay === null) errors['caps.issuePerDay'] = '每日提卡张数上限：0–1000 的整数'
  const issueAmountPerDay = numIn(caps.issueAmountPerDay, 0, 1_000_000, 2)
  if (issueAmountPerDay === null) errors['caps.issueAmountPerDay'] = '每日提卡金额上限：0–1,000,000 元，最多两位小数'
  const issuePerCommand = intIn(caps.issuePerCommand, 1, 50)
  if (issuePerCommand === null) errors['caps.issuePerCommand'] = '单次提卡最多张数：1–50 的整数'
  const belowRatio = numIn(pw.belowRatio, 0, 1, 2)
  if (belowRatio === null) errors['priceWarn.belowRatio'] = '低价提示倍数：0–1，最多两位小数'
  const aboveRatio = numIn(pw.aboveRatio, 1, 100, 2)
  if (aboveRatio === null) errors['priceWarn.aboveRatio'] = '高价提示倍数：1–100，最多两位小数'
  const perConvSeconds = numIn(pacing.perConvSeconds, 1, 120, 1)
  if (perConvSeconds === null) errors['pacing.perConvSeconds'] = '同一个群两条之间的间隔：1–120 秒，最多一位小数'
  const jitterSeconds = numIn(pacing.jitterSeconds, 0, 60, 1)
  if (jitterSeconds === null) errors['pacing.jitterSeconds'] = '随机抖动：0–60 秒，最多一位小数'
  const perMinute = intIn(pacing.perMinute, 1, 40)
  if (perMinute === null) errors['pacing.perMinute'] = '每分钟最多条数：1–40 的整数'
  const perHour = intIn(pacing.perHour, 1, 2000)
  if (perHour === null) errors['pacing.perHour'] = '每小时最多条数：1–2000 的整数'

  let quietDefault: EditableConfig['quietDefault'] = null
  if (raw.quietDefault !== null) {
    const q = isObj(raw.quietDefault) ? raw.quietDefault : null
    const from = q ? intIn(q.from, 0, 1439) : null
    const to = q ? intIn(q.to, 0, 1439) : null
    if (from === null || to === null) errors.quietDefault = '默认免打扰：开始与结束都要是 00:00–23:59'
    else if (from === to) errors.quietDefault = '默认免打扰的开始与结束不能相同（不想设请选「不设」）'
    else quietDefault = { from, to }
  }

  let origin = ''
  if (typeof raw.linkOrigin !== 'string') errors.linkOrigin = '推送链接域名必须是文字（留空 = 用环境变量）'
  else {
    origin = raw.linkOrigin.trim().replace(/\/+$/, '')
    if (origin && (origin.length > 200 || !ORIGIN_RE.test(origin))) {
      errors.linkOrigin = '推送链接域名：https:// 开头的站点根地址，不带路径，例如 https://bigolab.com；留空 = 用环境变量'
    }
  }

  const tenantReplyTtlDays = intIn(raw.tenantReplyTtlDays, 1, 30)
  if (tenantReplyTtlDays === null) errors.tenantReplyTtlDays = '分站快速回复有效期：1–30 天的整数'
  const newAccountQuietHours = intIn(raw.newAccountQuietHours, 0, 240)
  if (newAccountQuietHours === null) errors.newAccountQuietHours = '新号保护小时数：0–240 的整数（0 = 不保护）'

  let disabled: string[] = []
  if (!Array.isArray(raw.disabledCommands) || raw.disabledCommands.some((x) => typeof x !== 'string' || !x.trim())) {
    errors.disabledCommands = '关闭的指令必须是指令名列表'
  } else {
    disabled = Array.from(new Set((raw.disabledCommands as string[]).map((x) => x.trim())))
    const prot = disabled.filter((n) => PROTECTED_COMMANDS.has(n))
    if (disabled.length > 50) errors.disabledCommands = '最多关闭 50 个指令'
    else if (prot.length) errors.disabledCommands = `「${prot.join('」「')}」不能关闭`
    else if (known.names) {
      const names = known.names
      const unknown = disabled.filter((n) => !names.has(n))
      if (unknown.length) errors.disabledCommands = `没有这些指令：${unknown.join('、')}（请写指令的正式名称，不是别名）`
    } else {
      const added = disabled.filter((n) => known.current.indexOf(n) < 0)
      if (added.length) errors.disabledCommands = `指令注册表加载失败，现在只能保留或去掉已有的关闭项，不能新增（${added.join('、')}）`
    }
  }

  if (Object.keys(errors).length) return { config: null, errors }
  return {
    config: {
      enabled: raw.enabled as boolean,
      caps: { issuePerDay: issuePerDay!, issueAmountPerDay: issueAmountPerDay!, issuePerCommand: issuePerCommand! },
      priceWarn: { belowRatio: belowRatio!, aboveRatio: aboveRatio! },
      pacing: { perConvSeconds: perConvSeconds!, jitterSeconds: jitterSeconds!, perMinute: perMinute!, perHour: perHour! },
      quietDefault,
      linkOrigin: origin,
      tenantReplyTtlDays: tenantReplyTtlDays!,
      disabledCommands: disabled,
      newAccountQuietHours: newAccountQuietHours!,
    },
    errors,
  }
}

/** 拍平成「字段路径 → 值」，用来比对与写审计（关闭的指令按名字排序后比，顺序不同不算变化） */
function flat(e: EditableConfig): Record<string, unknown> {
  return {
    enabled: e.enabled,
    'caps.issuePerDay': e.caps.issuePerDay,
    'caps.issueAmountPerDay': e.caps.issueAmountPerDay,
    'caps.issuePerCommand': e.caps.issuePerCommand,
    'priceWarn.belowRatio': e.priceWarn.belowRatio,
    'priceWarn.aboveRatio': e.priceWarn.aboveRatio,
    'pacing.perConvSeconds': e.pacing.perConvSeconds,
    'pacing.jitterSeconds': e.pacing.jitterSeconds,
    'pacing.perMinute': e.pacing.perMinute,
    'pacing.perHour': e.pacing.perHour,
    quietDefault: e.quietDefault ? [e.quietDefault.from, e.quietDefault.to] : null,
    linkOrigin: e.linkOrigin,
    tenantReplyTtlDays: e.tenantReplyTtlDays,
    disabledCommands: e.disabledCommands.slice().sort(),
    newAccountQuietHours: e.newAccountQuietHours,
  }
}

/** 只留变化了的字段：{ 路径: { from, to } } */
function diffEditable(a: EditableConfig, b: EditableConfig): Record<string, { from: unknown; to: unknown }> {
  const fa = flat(a)
  const fb = flat(b)
  const out: Record<string, { from: unknown; to: unknown }> = {}
  Object.keys(fb).forEach((k) => {
    if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) out[k] = { from: fa[k], to: fb[k] }
  })
  return out
}

/**
 * 读设置（docs/微信机器人-设计.md §14「设置」）：后台可调的那部分 bot_config、出厂默认值、当前生效的链接域名、
 * 环境项是否配置（只告诉「有没有」，值本身不出服务端：BOT_WXPAD_* 只许适配器读，这里调 wxpadEnvStatus()）、指令一览。
 * 配置读坏了（ok=false）时 config / version 为空，页面只能看不能改。
 */
export async function GET() {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const res = success(await buildSettings())
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] 读取设置失败', e)
    return error('读取设置失败', 500)
  }
}

/**
 * 改设置：body { version, config: EditableConfig }。
 *  · 逐项校验（见 validate），越界 400 并按字段给出原因（failFields）；
 *  · disabledCommands 只能是注册表里的正式指令名，「锁定」「帮助」不能关；
 *  · 乐观并发：version 是页面读到的 bot_config.version，与库里不一致 → 409（锁定 / 解锁也会让版本号 +1）；
 *    写入经 updateBotConfig（条件更新），中途被别人改了同样 409；
 *  · locked 系列与 issueUserId 不经这里改：只替换可调字段，其余保持库里的原值；
 *  · 没有任何变化时不写库（版本号不动）；审计 bot.admin.settings 只记变化了的字段。
 */
export async function PUT(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const version = intIn(body.version, 0, 2_000_000_000)
    if (version === null) return error('缺少配置版本号（version），请刷新页面后再改')
    if (!isObj(body.config)) return error('缺少配置内容（config）')

    const cur = await readBotConfig({ fresh: true })
    if (!cur.ok) return error(`机器人配置读取失败（${cur.reason}），不能在这里保存；请先排查 settings.bot_config`, 409)
    if (cur.config.version !== version) {
      return error(`配置已被修改（你看到的是版本 ${version}，现在是版本 ${cur.config.version}；锁定 / 解锁也会改版本），请刷新后重新修改`, 409)
    }

    const cmds = await loadCommands()
    const v = validate(body.config, { names: cmds.error ? null : new Set(cmds.list.map((c) => c.name)), current: cur.config.disabledCommands })
    if (!v.config) {
      const keys = Object.keys(v.errors)
      return failFields(keys.length > 1 ? `有 ${keys.length} 项不合法：${v.errors[keys[0]]} 等` : v.errors[keys[0]], v.errors)
    }
    const submitted = v.config
    if (!Object.keys(diffEditable(editableOf(cur.config), submitted)).length) return success(await buildSettings(), '没有变化')

    const seen: { before?: BotConfig } = {}
    let next: BotConfig
    try {
      next = await updateBotConfig((c) => {
        if (c.version !== version) throw new BotConfigConflict()
        seen.before = c
        // 只换后台可调的字段；locked / lockedAt / lockedBy / issueUserId 保持库里的原值（version 由 updateBotConfig 加一）
        return { ...c, ...submitted }
      })
    } catch (e) {
      if (e instanceof BotConfigConflict) return error('配置刚刚被修改（可能有人锁定 / 解锁，或在别处保存了设置），请刷新后重新修改', 409)
      throw e
    }

    const changes = diffEditable(editableOf(seen.before ?? cur.config), editableOf(next))
    const actor = await currentActor()
    await auditSoft(request, actor, 'bot.admin.settings', { type: 'bot', id: 'config' }, { version: { from: version, to: next.version }, changes })
    return success(await buildSettings(), `已保存（配置版本 ${next.version}）`)
  } catch (e) {
    console.error('[bot-admin] 保存设置失败', e)
    return error('保存设置失败', 500)
  }
}
