/**
 * 消息渲染（docs/微信机器人-设计.md §5.4，附录 A）：纯函数，scripts/check-bot-core.ts 逐字比对样例。
 *
 * 格式：
 *   <图标 标题>｜<站名>
 *   <标签>：<值>
 *   …
 *   <链接文字>：<绝对链接>
 * 值在落库（sink / scan）时已经脱敏；这里只负责拼接、补全链接域名、控制长度。
 */
import { truncate } from './mask'
import type { BotLine } from './types'

/** 单条消息的长度上限（字）；超了按行截断，最后一行留给链接 */
export const MAX_MESSAGE_CHARS = 900

export interface RenderableEvent {
  title: string
  lines: BotLine[]
  link: string | null
  linkText: string | null
}

export function absoluteLink(link: string | null, origin: string): string | null {
  if (!link) return null
  if (/^https?:\/\//i.test(link)) return link
  if (!link.startsWith('/')) return null
  return `${origin}${link}`
}

export function renderEventText(ev: RenderableEvent, ctx: { siteLabel: string; origin: string }): string {
  const head = `${ev.title}｜${ctx.siteLabel}`
  const body = ev.lines.filter((l) => l.value !== '').map((l) => `${l.label}：${l.value}`)
  const url = absoluteLink(ev.link, ctx.origin)
  const tail = url ? `${ev.linkText || '查看'}：${url}` : null
  return fitLines([head, ...body], tail)
}

const MORE_LINE = '……（其余见后台）'

/** 第 idx 行占的字数（除第一行外都要算上前面的换行） */
function lineCost(line: string, idx: number): number {
  return Array.from(line).length + (idx > 0 ? 1 : 0)
}

/**
 * 按行装进上限：装不下的行丢掉并在末尾注明「……（其余见后台）」。
 * 截断提示本身也算进上限（装不下就再退掉前面的行，标题行保留），整条恒 ≤ max。
 */
export function fitLines(lines: string[], tail: string | null, max = MAX_MESSAGE_CHARS): string {
  const budget = max - (tail ? Array.from(tail).length + 1 : 0)
  const out: string[] = []
  let used = 0
  for (let i = 0; i < lines.length; i++) {
    const line = truncate(lines[i], 300)
    const len = lineCost(line, out.length)
    if (used + len > budget) {
      while (out.length > 1 && used + lineCost(MORE_LINE, out.length) > budget) {
        used -= lineCost(out[out.length - 1], out.length - 1)
        out.pop()
      }
      out.push(MORE_LINE)
      break
    }
    out.push(line)
    used += len
  }
  if (tail) out.push(tail)
  return out.join('\n')
}

/** 合并消息里的一行摘要：时间 + 标题（去掉图标）+ 第一条有内容的值 */
export function summaryLine(ev: RenderableEvent, at: Date): string {
  const hhmm = new Date(at.getTime() + 8 * 3600_000).toISOString().slice(11, 16)
  const title = ev.title.replace(/^\S+\s/, '') // 去掉开头的图标
  const first = ev.lines.find((l) => l.value && !/订单号|编号/.test(l.label))
  return truncate(`${hhmm} ${title}${first ? ` ${first.value}` : ''}`, 60)
}

/** 多条普通动态合成一条（§5.6）。items 按时间升序 */
export function renderDigest(siteLabel: string, items: string[], more: number): string {
  const head = `🧾 最近 ${items.length + more} 条动态｜${siteLabel}`
  const lines = items.map((s) => `· ${s}`)
  if (more > 0) lines.push(`· 另有 ${more} 条，见后台`)
  return fitLines([head, ...lines], null)
}

/** 北京时间 MM-DD HH:mm */
export function bjMinute(d: Date): string {
  const s = new Date(d.getTime() + 8 * 3600_000).toISOString()
  return `${s.slice(5, 10)} ${s.slice(11, 16)}`
}

/** 金额 ¥1,234.00 */
export function yuan(n: unknown): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `¥${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
