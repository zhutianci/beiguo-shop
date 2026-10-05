/**
 * 查数据类指令（T1）：今日 / 昨日 / 日报、本周 / 本月（report.ts）；分站、订单、查卡、待办、货号、库存、利润、结算、未匹配、提卡记录（query.ts）。
 * 实现见各文件；这里只汇总注册。分站群里能用的只有今日 / 昨日 / 日报与「订单 <订单号>」，都按 ctx.scopeTenantId 收窄。
 */
import { QUERY_COMMANDS } from './query'
import { REPORT_COMMANDS } from './report'
import type { BotCommandDef } from './types'

export const DATA_COMMANDS: readonly BotCommandDef<any>[] = [...REPORT_COMMANDS, ...QUERY_COMMANDS]
