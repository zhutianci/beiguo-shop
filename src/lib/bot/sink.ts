/**
 * 机器人旁路（docs/微信机器人-设计.md §5.1）：把站内动态记成 bot_events，交给路由投到群里。
 *
 * 【绝不影响业务】与 notify() 同一个约定：不返回 Promise 给调用方、不抛异常、不阻塞；BOT_ENABLED 未开时直接返回。
 * 【叶子模块】只静态 import db 与本目录的纯函数 / 常量（scripts/check-bot-boundary.mjs 钉着）——
 *  它会被 notify.ts → vmq.ts / 钱包 / 接码间接引用，反向引用业务模块会造成循环依赖。
 *  落库后用动态 import 唤醒路由与发送器（运行时才加载，不进模块初始化的依赖图）。
 * 【落库即脱敏】邮箱打码、手机号打码、买家可控字段再打码疑似卡密并中性化网址（§5.4），库里不留明文。
 */
import { prisma } from '../db'
import { botEnabledByEnv } from './config'
import { DIRECT_EVENT_DEFS, NOTIFY_EVENT_DEFS, type DirectEventType } from './events/catalog'
import { multiLine, maskEmails, maskPhones, oneLine, sanitizeSystemValue, sanitizeUserText } from './mask'
import type { BotLine } from './types'
import type { NotifyEvent } from '../notify'

/** notify() 的一行（与 notify.ts 的 NotifyRow 同形，这里只取用到的字段，避免反向 import） */
interface NotifyRowLike {
  label: string
  value: string
  raw?: boolean
}

interface NotifyOptsLike {
  link?: string
  linkText?: string
  extraTitle?: string
  site?: string | null
}

function rand(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 渠道 code 的规范化（同 notify.ts 的 siteTag：小写字母、数字、连字符，最长 20） */
function siteCodeOf(site: string | null | undefined): string | null {
  const code = String(site ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 20)
  return code && code !== 'main' ? code : null
}

/** 财务台免登录链接不经机器人推送（D10）：换成要登录的后台发票管理 */
function safeLink(link: string | undefined, linkText: string | undefined): { link: string | null; linkText: string | null } {
  if (!link) return { link: null, linkText: null }
  if (/\/finance\//i.test(link)) return { link: '/admin/invoices', linkText: '前往后台「发票管理」' }
  return { link: link.slice(0, 500), linkText: linkText ? oneLine(linkText, 30) : null }
}

function kickRuntime(): void {
  void import('./runtime')
    .then((m) => m.onNewEvents())
    .catch((e) => console.error('[bot] 唤醒路由失败', (e as Error)?.message))
}

function insertEvent(data: {
  source: string
  type: string
  category: string
  tenantId: number
  siteCode: string | null
  urgent: boolean
  title: string
  lines: BotLine[]
  link: string | null
  linkText: string | null
  refType?: string | null
  refKey?: string | null
  dedupeKey: string
}): void {
  prisma.botEvent
    .create({
      data: {
        source: data.source,
        type: data.type.slice(0, 40),
        category: data.category,
        tenantId: data.tenantId,
        siteCode: data.siteCode,
        urgent: data.urgent,
        title: oneLine(data.title, 120),
        lines: data.lines as unknown as object,
        link: data.link,
        linkText: data.linkText,
        refType: data.refType ?? null,
        refKey: data.refKey ? data.refKey.slice(0, 64) : null,
        dedupeKey: data.dedupeKey.slice(0, 80),
      },
    })
    .then(() => kickRuntime())
    .catch((e) => {
      if ((e as { code?: string })?.code === 'P2002') return // 同一事件已经记过
      console.error(`[bot] 记录事件失败 ${data.type}`, (e as Error)?.message)
    })
}

export const botSink = {
  /** notify() 第一行调用。meta 是 notify.ts 的 EVENT_LABELS[event]（标题与图标以现有推送为准） */
  fromNotify(event: NotifyEvent, rows: NotifyRowLike[], opts: NotifyOptsLike | undefined, meta: { emoji: string; title: string }): void {
    try {
      if (!botEnabledByEnv()) return
      if (event.startsWith('bot.')) return // 机器人自己的告警只走企业微信，不排进自己的队列
      const def = NOTIFY_EVENT_DEFS[event]
      if (!def) return
      const userText = new Set(def.userTextLabels ?? [])
      const site = siteCodeOf(opts?.site)
      const lines: BotLine[] = rows.slice(0, 30).map((r) => {
        const label = oneLine(r.label, 30)
        let value: string
        if (r.raw) value = maskPhones(maskEmails(multiLine(r.value)))
        else if (userText.has(label)) value = sanitizeUserText(r.value, { max: label === '内容' ? 100 : 60 })
        else value = sanitizeSystemValue(r.value)
        return { label, value }
      })
      const { link, linkText } = safeLink(opts?.link, opts?.linkText)
      const extra = opts?.extraTitle ? ` · ${oneLine(opts.extraTitle, 60)}` : ''
      insertEvent({
        source: 'notify',
        type: event,
        // 带 site 的是「渠道单里需要站长处理」的告警：一律按渠道告警路由到管理群（§5.3 第 2 条，站长 Q7）
        category: site ? 'channel_alert' : def.category,
        tenantId: 1,
        siteCode: site,
        urgent: site ? true : !!def.urgent,
        title: `${meta.emoji || def.emoji} ${meta.title}${extra}`,
        lines,
        link,
        linkText,
        dedupeKey: `n:${event}:${Date.now().toString(36)}:${rand()}`,
      })
    } catch (e) {
      console.error('[bot] fromNotify 失败', (e as Error)?.message)
    }
  },

  /** alertPlatform(text) 第一行调用。站点从文本里的「[code]」取 */
  fromPlatformAlert(text: string): void {
    try {
      if (!botEnabledByEnv()) return
      const s = String(text ?? '')
      const m = s.match(/\[([a-z0-9-]{1,20})\]/i)
      const def = DIRECT_EVENT_DEFS['platform.alert']
      insertEvent({
        source: 'platform_alert',
        type: 'platform.alert',
        category: def.category,
        tenantId: 1,
        siteCode: m ? siteCodeOf(m[1]) : null,
        urgent: true,
        title: `${def.emoji} ${def.title}`,
        lines: [{ label: '内容', value: sanitizeSystemValue(s, { max: 400 }) }],
        link: '/admin/orders',
        linkText: '前往后台处理',
        dedupeKey: `pa:${Date.now().toString(36)}:${rand()}`,
      })
    } catch (e) {
      console.error('[bot] fromPlatformAlert 失败', (e as Error)?.message)
    }
  },

  /**
   * 新补事件（渠道新订单、渠道开票、渠道收据，§5.2「新增」）。在业务事务**提交之后**调用。
   * lines 里的值由调用方给系统字段；这里统一再清洗一遍（分站事件一律去掉邮箱）。
   */
  emit(input: {
    type: DirectEventType
    tenantId: number
    title?: string
    lines: BotLine[]
    link?: string | null
    linkText?: string | null
    refType?: string | null
    refKey?: string | null
    dedupeKey: string
  }): void {
    try {
      if (!botEnabledByEnv()) return
      const def = DIRECT_EVENT_DEFS[input.type]
      if (!def) return
      const tenantScoped = input.tenantId !== 1
      insertEvent({
        source: 'direct',
        type: input.type,
        category: def.category,
        tenantId: input.tenantId,
        siteCode: null,
        urgent: !!def.urgent,
        title: `${def.emoji} ${input.title || def.title}`,
        lines: input.lines.slice(0, 20).map((l) => ({
          label: oneLine(l.label, 30),
          value: sanitizeSystemValue(l.value, { dropEmail: tenantScoped }),
        })),
        link: input.link ?? null,
        linkText: input.linkText ?? null,
        refType: input.refType,
        refKey: input.refKey,
        dedupeKey: input.dedupeKey,
      })
    } catch (e) {
      console.error('[bot] emit 失败', (e as Error)?.message)
    }
  },
}
