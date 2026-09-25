export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { aliyunKeysConfigured } from '@/lib/aliyun'
import {
  DEFAULT_CONFIG,
  EMPTY_HALT,
  EMPTY_SYNC,
  marketingConfigSchema,
  type AccountState,
  type ConfigResponse,
  type HaltState,
  type MarketingConfig,
  type SyncState,
} from '@/lib/marketing/types'
import {
  MarketingConfigError,
  clearHalt,
  dryRunRefused,
  freshDailyQuota,
  getAccountState,
  getConfig,
  getHalt,
  getSyncState,
  isDryRun,
  isHalted,
  marketingSender,
  saveConfig,
  senderReady,
} from '@/lib/marketing/config'
import { todayUsage, type TodayUsage } from '@/lib/marketing/budget'
import { findAbsoluteTerm, findBannedWord } from '@/lib/marketing/lint'
import { bjDateKey, bjDateTime, inSendWindow } from '@/lib/marketing/time'
import { knownErrorResponse, readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 发送设置：策略配置 + 发信地址 + 急停 + 阿里云账户 + 回执同步 + 今日用量/额度拆解 + 上线前检查清单。
 *
 * GET 是展示用的：各块分别容错（某一块读失败只让那一块显示异常，设置页照样能打开、能改配置、能解除急停）。
 * worker / sync 自己严格读配置（fail closed），与这里无关。
 *
 * PUT 两种：{config} 保存策略（saveConfig 负责校验与审计，含开关 / defaultEligible 的切换）；
 * {action:'clearHalt'} 解除急停（写审计 CLEAR_HALT）。
 */

/** 回执同步多久没成功算「中断」—— 与 worker 的急停阈值（设计 5.3 第 6 步）一致 */
const SYNC_STALE_MS = 60 * 60 * 1000

async function buildResponse(): Promise<ConfigResponse> {
  const now = new Date()
  const config = await getConfig()

  const [halt, account, sync] = await Promise.all([
    getHalt().catch((e): HaltState => {
      console.error('[admin/marketing/config] 读取急停状态失败:', (e as Error)?.message || e)
      return EMPTY_HALT
    }),
    getAccountState().catch((e): AccountState | null => {
      console.error('[admin/marketing/config] 读取阿里云账户状态失败:', (e as Error)?.message || e)
      return null
    }),
    getSyncState().catch((e): SyncState => {
      console.error('[admin/marketing/config] 读取同步状态失败:', (e as Error)?.message || e)
      return EMPTY_SYNC
    }),
  ])

  let usage: TodayUsage | null = null
  try {
    usage = await todayUsage(config, now)
  } catch (e) {
    console.error('[admin/marketing/config] 统计今日用量失败:', (e as Error)?.message || e)
  }

  const sender = marketingSender()
  const dryRun = isDryRun()
  const refused = dryRunRefused()
  const keys = aliyunKeysConfigured()
  const quota = freshDailyQuota(account, now)
  const lastOk = sync.lastOkAt ? new Date(sync.lastOkAt) : null
  const syncFresh = !!lastOk && !Number.isNaN(lastOk.getTime()) && now.getTime() - lastOk.getTime() <= SYNC_STALE_MS

  const checklist: ConfigResponse['checklist'] = [
    {
      key: 'sender',
      ok: dryRun || !!sender,
      text: sender
        ? `营销发信地址已配置：${sender}`
        : dryRun
          ? '营销发信地址未配置（dry-run 下不需要）'
          : '营销发信地址未配置（服务器环境变量 ALIYUN_DM_MARKETING），不能发送',
    },
    {
      key: 'accessKey',
      ok: dryRun || keys,
      text: keys ? '阿里云 AccessKey 已配置' : dryRun ? '阿里云 AccessKey 未配置（dry-run 下不需要）' : '阿里云 AccessKey 未配置，不能发送',
    },
    {
      key: 'contactEmail',
      ok: !!config.contactEmail,
      text: config.contactEmail
        ? `联系邮箱已填写：${config.contactEmail}`
        : '联系邮箱未填写：页脚必须有能收信的联系方式，不填不能发送',
    },
    {
      key: 'sync',
      ok: dryRun || syncFresh,
      text: syncFresh
        ? `回执同步最近成功：${bjDateTime(lastOk as Date)}`
        : lastOk && !Number.isNaN(lastOk.getTime())
          ? `回执同步已超过 60 分钟没有成功（最近成功 ${bjDateTime(lastOk)}）${sync.lastError ? `：${sync.lastError}` : ''}；发送中会自动急停`
          : `回执同步还没有成功运行过${sync.lastError ? `（最近错误：${sync.lastError}）` : ''}`,
    },
    {
      key: 'account',
      ok: dryRun || (!!account && account.userStatus === 0 && quota != null),
      text: !account
        ? '还没有取到阿里云账户信息（按日额度 500 估算）'
        : account.userStatus !== 0
          ? `阿里云账户状态异常（UserStatus=${account.userStatus}），发送会被急停`
          : quota == null
            ? `阿里云账户信息已超过 24 小时未更新（上次 ${bjDateTime(new Date(account.fetchedAt))}），按日额度 500 估算`
            : `阿里云账户状态正常，日额度 ${account.dailyQuota}${account.quotaLevel != null ? `，信誉等级 ${account.quotaLevel}` : ''}`,
    },
    {
      key: 'dryRun',
      ok: !dryRun && !refused,
      text: dryRun
        ? '当前是 dry-run：不会真正发信（只应出现在本地 / 预发）'
        : refused
          ? 'MARKETING_DRY_RUN 已设置但被拒绝（数据库名不含 dev/test），按真实发送处理 —— 生产环境不该有这个变量'
          : '真实发送模式',
    },
  ]
  if (!usage) checklist.push({ key: 'usage', ok: false, text: '今日用量统计读取失败，下方数字不可信' })

  return {
    config,
    defaults: DEFAULT_CONFIG,
    sender: { address: sender, configured: senderReady(), dryRun },
    halt: { ...halt, active: isHalted(halt, now) },
    account,
    sync,
    today: usage
      ? {
          date: usage.date,
          used: usage.used,
          limit: usage.limit,
          parts: usage.parts,
          warmupLevel: usage.warmupLevel,
          inWindow: usage.inWindow,
        }
      : {
          date: bjDateKey(now),
          used: 0,
          limit: 0,
          parts: { dailyCap: config.dailyCap, quotaCap: 0, warmupCap: null, quota: 0, quotaAssumed: true },
          warmupLevel: 0,
          inWindow: inSendWindow(config.sendWindow, now),
        },
    checklist,
  }
}

export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success(await buildResponse())
  } catch (err) {
    console.error('[admin/marketing/config] 读取发送设置失败:', err)
    return error('读取发送设置失败')
  }
}

/**
 * 页脚 / 发件人里出现的配置文字同样要过禁发词与绝对化用语：它们会出现在每一封邮件里，
 * 存进去了就是让之后所有活动都过不了检查（或者更糟，漏检发出去）。在保存时就拦下来，提示更直接。
 */
function configTextIssue(c: MarketingConfig): string | null {
  const fields: [string, string][] = [
    ['发件人名称', c.fromAlias],
    ['经营主体', c.companyName],
    ['品牌名', c.brandName],
    ['页脚附加文字', c.footerNote],
  ]
  for (const [label, value] of fields) {
    if (!value) continue
    const banned = findBannedWord(value)
    if (banned) return `「${label}」里有阿里云禁发的内容「${banned}」`
    const absolute = findAbsoluteTerm(value)
    if (absolute) return `「${label}」里有广告法禁止的绝对化用语「${absolute}」`
  }
  return null
}

/** zod 默认的报错是英文且不带字段名；设置页一次提交十几个字段，得告诉管理员是哪一个 */
const FIELD_LABEL: Record<string, string> = {
  enabled: '全局发送开关',
  defaultEligible: '默认可接收',
  fromAlias: '发件人名称',
  subjectPrefix: '主题前缀',
  companyName: '经营主体',
  brandName: '品牌名',
  contactEmail: '联系邮箱',
  footerNote: '页脚附加文字',
  testRecipients: '测试收件人',
  ratePerSec: '发送速率',
  dailyCap: '每日上限',
  maxQuotaShare: '阿里云额度占比上限',
  sendWindow: '发送时段',
  warmup: '预热',
  canarySize: '每日试探封数',
  freq: '频控',
  sunset: '长期未互动排除',
  includeTextBody: '纯文本版',
  attributionDays: '归因窗口',
}

/** 文字里有没有汉字（判断 zod 报错是不是我们自己写的中文文案） */
function hasCjk(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c >= 0x4e00 && c <= 0x9fa5) return true
  }
  return false
}

/** 把常见的 zod 校验失败翻成中文（数值范围、长度、邮箱、枚举、类型） */
function issueText(i: z.ZodIssue): string {
  switch (i.code) {
    case z.ZodIssueCode.too_small:
      return i.type === 'string'
        ? `至少 ${Number(i.minimum)} 个字`
        : i.type === 'array'
          ? `至少 ${Number(i.minimum)} 项`
          : `不能小于 ${Number(i.minimum)}`
    case z.ZodIssueCode.too_big:
      return i.type === 'string'
        ? `最多 ${Number(i.maximum)} 个字`
        : i.type === 'array'
          ? `最多 ${Number(i.maximum)} 项`
          : `不能大于 ${Number(i.maximum)}`
    case z.ZodIssueCode.invalid_string:
      return i.validation === 'email' ? '邮箱格式不正确' : '格式不正确'
    case z.ZodIssueCode.invalid_enum_value:
      return `只能是 ${i.options.map((o) => String(o)).join(' / ')}`
    case z.ZodIssueCode.invalid_type:
      return i.received === 'undefined' ? '不能为空' : '类型不正确'
    default:
      return hasCjk(i.message) ? i.message : '取值不正确'
  }
}

function configErrorMessage(e: z.ZodError): string {
  const first = e.errors[0]
  if (!first) return '配置格式不正确'
  const label = FIELD_LABEL[String(first.path?.[0] ?? '')]
  // 自定义过中文文案的（如发送时段的 refine）直接用；其余按错误类型翻译
  const text = hasCjk(first.message) ? first.message : issueText(first)
  return label ? `「${label}」${text}` : text
}

const putSchema = z.union([
  z.object({ action: z.literal('clearHalt') }).strip(),
  z.object({ config: z.unknown() }).strip(),
])

export async function PUT(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const body = await readJsonBody(request, 32 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = putSchema.safeParse(body.body)
    if (!parsed.success) return error('请求参数不正确')

    if ('action' in parsed.data) {
      await clearHalt(me.id)
      return success(await buildResponse(), '已解除急停')
    }

    const incoming = parsed.data.config
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return error('缺少配置内容')
    // 设置页提交的是完整配置；也允许只提交改动的键（如只切换 enabled）—— 那时按顶层浅合并「当前配置」。
    // 合并用严格读：读失败时如果拿默认值去补，会把没提交的键（每日上限、频控…）悄悄重置成默认值
    let cfg = marketingConfigSchema.safeParse(incoming)
    if (!cfg.success) {
      let current: MarketingConfig
      try {
        current = await getConfig({ strict: true })
      } catch (e) {
        console.error('[admin/marketing/config] 严格读取当前配置失败:', (e as Error)?.message || e)
        return error(configErrorMessage(cfg.error))
      }
      cfg = marketingConfigSchema.safeParse({ ...current, ...(incoming as Record<string, unknown>) })
    }
    if (!cfg.success) return error(configErrorMessage(cfg.error))
    const c = cfg.data

    // 联系邮箱要能收信，且不要用「QQ 号@qq.com」这种纯数字邮箱：正文里出现 QQ 号会触发阿里云禁发规则
    if (c.contactEmail && /^\d{5,}@/.test(c.contactEmail)) {
      return error('联系邮箱不要用纯数字（QQ 号）邮箱：正文出现 QQ 号会触发阿里云禁发规则，请换一个能收信的邮箱')
    }
    let textIssue: string | null = null
    try {
      textIssue = configTextIssue(c)
    } catch (e) {
      // 检查器本身出错不挡保存：发送前检查会对最终 HTML（含页脚）再扫一遍
      console.error('[admin/marketing/config] 配置文字检查出错:', (e as Error)?.message || e)
    }
    if (textIssue) return error(textIssue)

    await saveConfig(c, me.id)
    return success(await buildResponse(), '已保存')
  } catch (err) {
    // saveConfig 自己也校验一遍（与上面同一个 schema），它的报错是给人看的中文
    if (err instanceof MarketingConfigError) return error(err.message, 400)
    const known = knownErrorResponse(err)
    if (known) return known
    console.error('[admin/marketing/config] 保存发送设置失败:', err)
    return error('保存失败')
  }
}
