/**
 * 日报类指令：今日、昨日、日报 [日期]、本周、本月（docs/微信机器人-设计.md §6.4、§7.3）。都是 T1（读经营数据）。
 *
 * 数据范围由会话决定（§7.2 T1、附录 B 第 2 条）：
 *  - 管理群 / 私聊：主站日报口径（含各分站汇总、站长利润），report/main.ts；
 *  - 分站群：只有本站——用 ctx.scopeTenantId 调 report/tenant.ts（渠道视角，不出现站长成本与利润、别的分站）。
 *    本周 / 本月只在管理群与私聊（§7.3 的 TENANT 清单里只有今日 / 昨日）；「日报 [日期]」在分站群里同样只看本站。
 * 本文件不查库（边界检查 B4），只调 report/*。
 *
 * 回复一条：核心数据 + 明细（超长按 render.fitLines 截断）。「今日」窗口是 [今天 0 点, 现在)，对比昨日 / 上周同日的同一时段；
 * 「昨日」「日报 <日期>」是那一整天，余额与待办只有当前值（库里没有按日的快照），回复末尾注明，并提示浏览数据只保留 90 天（§6.4）。
 */
import { collectMainReport } from '../report/main'
import { collectTenantReport } from '../report/tenant'
import { renderMainReply, renderTenantReply } from '../report/text'
import { isReportDateSyntax, monthWindow, parseReportDate, todayWindow, weekWindow, windowForDay, yesterdayWindow, type ReportWindow } from '../report/window'
import { noArgs, type BotCommandDef, type BotContext, type BotReply } from './types'

/** 按会话出报表：分站群 = 本站（渠道视角）；管理群 / 私聊 = 主站 */
async function reportReply(ctx: BotContext, w: ReportWindow): Promise<BotReply> {
  // 今日是实时值；整天的窗口（昨日、补看）里余额与待办是当前值，要注明
  const historical = w.kind === 'day'
  if (ctx.conv.kind === 'TENANT') {
    const tenantId = ctx.scopeTenantId
    if (!tenantId || tenantId < 2) return { text: '本群还没有绑定分站，无法查看本站数据', summary: 'no tenant' }
    const r = await collectTenantReport(tenantId, w, { historical })
    return { text: renderTenantReply(r), summary: `tenant ${tenantId} ${w.kind} ${w.dayFrom}` }
  }
  const r = await collectMainReport(w, { issueUserId: ctx.config.issueUserId, historical, now: ctx.now })
  return { text: renderMainReply(r), summary: `main ${w.kind} ${w.dayFrom}` }
}

export const todayCmd: BotCommandDef<null> = {
  name: '今日',
  aliases: ['today', '今天'],
  scopes: ['MGMT', 'DM', 'TENANT'],
  tier: 1,
  parse: noArgs('用法：今日'),
  run: (ctx) => reportReply(ctx, todayWindow(ctx.now)),
  help: { summary: '今天 0 点到现在的经营数据（分站群里只看本站）', usage: '今日' },
}

export const yesterdayCmd: BotCommandDef<null> = {
  name: '昨日',
  aliases: ['yesterday', '昨天'],
  scopes: ['MGMT', 'DM', 'TENANT'],
  tier: 1,
  parse: noArgs('用法：昨日'),
  run: (ctx) => reportReply(ctx, yesterdayWindow(ctx.now)),
  help: { summary: '昨天一整天的日报（分站群里只看本站）', usage: '昨日' },
}

const DAILY_USAGE = '用法：日报 [日期]，例：日报 10-03、日报 2026-10-03（不写日期 = 昨日）'

export const dailyCmd: BotCommandDef<{ date: string | null }> = {
  name: '日报',
  aliases: ['daily'],
  scopes: ['MGMT', 'DM', 'TENANT'],
  tier: 1,
  parse: (args) => {
    if (args.length === 0) return { ok: true, value: { date: null } }
    if (args.length === 1 && isReportDateSyntax(args[0])) return { ok: true, value: { date: args[0] } }
    return { ok: false, usage: DAILY_USAGE }
  },
  async run(ctx, a) {
    if (!a.date) return reportReply(ctx, yesterdayWindow(ctx.now))
    const p = parseReportDate(a.date, ctx.now)
    if (!p.ok) return { text: `日期不对：${p.error}。${DAILY_USAGE}`, summary: 'bad date' }
    // 写的是今天：今天还没过完，按「今日」的实时窗口出
    return reportReply(ctx, windowForDay(p.key, ctx.now))
  },
  help: { summary: '补看某一天的日报（不写日期 = 昨日；分站群里只看本站）', usage: '日报 [日期]', example: '日报 10-03' },
}

export const weekCmd: BotCommandDef<null> = {
  name: '本周',
  aliases: ['week'],
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: noArgs('用法：本周'),
  run: (ctx) => reportReply(ctx, weekWindow(ctx.now)),
  help: { summary: '本周（周一起）到现在的经营汇总，含各分站', usage: '本周' },
}

export const monthCmd: BotCommandDef<null> = {
  name: '本月',
  aliases: ['month'],
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: noArgs('用法：本月'),
  run: (ctx) => reportReply(ctx, monthWindow(ctx.now)),
  help: { summary: '本月 1 日到现在的经营汇总，含各分站', usage: '本月' },
}

/** 主会话把它展开进 commands/index.ts 的 COMMANDS */
export const REPORT_COMMANDS: readonly BotCommandDef<any>[] = [todayCmd, yesterdayCmd, dailyCmd, weekCmd, monthCmd]
