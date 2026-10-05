/**
 * 指令注册表（docs/微信机器人-设计.md §7.6）。新增指令：新建文件导出 BotCommandDef，再加进下面的 COMMANDS。
 * 模块加载时 assertRegistry() 校验（名字与别名全局唯一、tier ≥ 2 有审计名、UNBOUND 只给「帮助」「创建」「设为管理群」「绑定」、
 * T3 只在管理群与私聊），scripts/check-bot-core.ts 再校验一遍。
 */
import { bindCmd, createCmd, pushCmd, quietCmd, setMgmtCmd, subscribeCmd, unbindCmd, unsubscribeCmd } from './binding'
import { listCmd, lockCmd, statusCmd } from './core'
import { DATA_COMMANDS } from './data'
import { OPS_COMMANDS } from './ops'
import type { BotCommandDef, CmdScope } from './types'

const helpCmd: BotCommandDef<{ name?: string }> = {
  name: '帮助',
  aliases: ['help', '菜单', '?', '？'],
  scopes: ['MGMT', 'DM', 'TENANT', 'UNBOUND'],
  tier: 0,
  allowWhenLocked: true,
  parse: (args) => (args.length <= 1 ? { ok: true, value: { name: args[0] } } : { ok: false, usage: '用法：帮助 [指令名]' }),
  async run(ctx, a) {
    const scope: CmdScope = ctx.conv.kind ?? 'UNBOUND'
    if (a.name) {
      const c = findCommand(a.name)
      if (!c || !c.scopes.includes(scope)) return { text: `没有「${a.name}」这个指令（在这里不可用）`, summary: 'help' }
      return { text: `「${c.name}」：${c.help.summary}\n用法：@贝果助手 ${c.help.usage}${c.help.example ? `\n例：@贝果助手 ${c.help.example}` : ''}`, summary: 'help' }
    }
    const usable = COMMANDS.filter((c) => c.scopes.includes(scope) && c.tier <= ctx.admin.maxTier && !ctx.config.disabledCommands.includes(c.name))
    const lines = usable.map((c) => `· ${c.help.usage} —— ${c.help.summary}`)
    const where = scope === 'MGMT' ? '管理群' : scope === 'TENANT' ? '分站群' : scope === 'DM' ? '私聊' : '未登记的群'
    return { text: `🤖 贝果助手 · ${where}可用指令（发送时先 @贝果助手）\n${lines.join('\n')}`, summary: 'help' }
  },
  help: { summary: '查看可用指令', usage: '帮助 [指令名]' },
}

export const COMMANDS: readonly BotCommandDef<any>[] = [
  helpCmd,
  statusCmd,
  listCmd,
  lockCmd,
  setMgmtCmd,
  createCmd,
  bindCmd,
  unbindCmd,
  pushCmd,
  subscribeCmd,
  unsubscribeCmd,
  quietCmd,
  ...DATA_COMMANDS,
  ...OPS_COMMANDS,
]

const UNBOUND_ALLOWED = new Set(['帮助', '创建', '设为管理群', '绑定'])

export function assertRegistry(list: readonly BotCommandDef<any>[] = COMMANDS): void {
  const seen = new Map<string, string>()
  for (const c of list) {
    for (const n of [c.name, ...(c.aliases ?? [])]) {
      const key = n.toLowerCase()
      if (seen.has(key)) throw new Error(`[bot] 指令名或别名重复：「${n}」（${seen.get(key)} 与 ${c.name}）`)
      seen.set(key, c.name)
    }
    if (c.tier >= 2 && !c.auditAction) throw new Error(`[bot] T${c.tier} 指令「${c.name}」缺审计名`)
    if (c.scopes.includes('UNBOUND') && !UNBOUND_ALLOWED.has(c.name)) throw new Error(`[bot] 「${c.name}」不能在未登记的群里用`)
    if (!c.help?.summary || !c.help?.usage) throw new Error(`[bot] 「${c.name}」缺帮助`)
    if (c.allowWhenLocked && c.tier >= 3) throw new Error(`[bot] T3 指令「${c.name}」不能在锁定时可用`)
    if (c.tier >= 3 && c.scopes.some((s) => s === 'TENANT' || s === 'UNBOUND')) throw new Error(`[bot] T3 指令「${c.name}」只能在管理群与私聊里用`)
    if (!c.scopes.length) throw new Error(`[bot] 「${c.name}」没有可用范围`)
  }
}

assertRegistry()

const BY_NAME = new Map<string, BotCommandDef<any>>()
for (const c of COMMANDS) for (const n of [c.name, ...(c.aliases ?? [])]) BY_NAME.set(n.toLowerCase(), c)

export function findCommand(name: string): BotCommandDef<any> | undefined {
  return BY_NAME.get(name.toLowerCase())
}
