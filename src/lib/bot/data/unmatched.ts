/**
 * 「未匹配」指令的取数（docs/微信机器人-设计.md §7.3）：收款监控里「已到账但没匹配到订单」、还没人处理的记录。只读、只给管理群与私聊。
 *
 * 记录的写法与「待处理」的判定都在 src/lib/vmq.ts（listUnmatched：未处理的全部取出、上限 500，已处理的只取最新 limit 条）。这里只包一层：
 *  · 指令层不许 import vmq（边界检查 B3），经这里取；
 *  · 动态 import：vmq.ts 牵着履约、钱包、邮件一大串模块，只在真有人发「未匹配」时才加载（指令注册表与自测脚本不为它付加载成本）；
 *  · 只回指令要显示的字段：不回通知原文 raw（里面可能有付款人姓名）、不回待支付金额列表等内部字段。
 */
import { centsOrNull, requirePlatformScope, type BotScope } from './scope'

export interface UnmatchedItem {
  at: Date
  /** 到账金额（分）；记录里没有可用金额为 null */
  cents: number | null
  /** UnmatchedReason：no_pending_match / closed_while_matching / maybe_duplicate / … */
  reason: string
  /** 原文与 1 分钟内的通知一字不差（多半是重复转发） */
  repeatForward: boolean
  /** 相关的业务单号（订单号 / 发票号）；没有为 null */
  outTradeNo: string | null
  /** 通知来源 App（只对「来源不是支付宝」有意义）；没有为 null */
  from: string | null
}

export interface UnmatchedList {
  /** 待核实的总笔数 */
  total: number
  /** 待核实的到账合计（分；只加有金额的） */
  totalCents: number
  /** 新的在前，最多 limit 条 */
  items: UnmatchedItem[]
}

export async function openUnmatched(scope: BotScope, limit = 10): Promise<UnmatchedList> {
  requirePlatformScope(scope, '未匹配到账')
  const { listUnmatched } = await import('../../vmq')
  // 已处理的历史只要 1 条（下面还会再滤掉）；未处理的 listUnmatched 全部给出
  const open = (await listUnmatched(1)).filter((e) => !e.handledAt)
  let totalCents = 0
  const items = open.map((e): UnmatchedItem => {
    const cents = typeof e.cents === 'number' && Number.isSafeInteger(e.cents) ? e.cents : centsOrNull(e.price)
    if (cents !== null) totalCents += cents
    return {
      at: new Date(e.at),
      cents,
      reason: String(e.reason ?? ''),
      repeatForward: e.repeatForward === true,
      outTradeNo: e.outTradeNo ? String(e.outTradeNo).slice(0, 40) : null,
      from: e.from ? String(e.from).slice(0, 40) : null,
    }
  })
  return { total: items.length, totalCents, items: items.slice(0, Math.min(Math.max(1, Math.trunc(limit)), 30)) }
}
