export const dynamic = 'force-dynamic'

import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { latepayOverview, carrierFlags } from '@/lib/wallet/latepay'
import { listUnmatched } from '@/lib/vmq'

/**
 * 「余额与充值 → 迟到付款」（docs/短信接码-设计.md §7.8）：最近的 LATEPAY 流水（自动 / 手动、对应条目、订单、手动的支付宝交易号）、
 * 待核实列表里涉及接码 / 充值订单、可以退入的条目数（链接到 /admin/vmq）、标为 OFFLINE / IGNORE 的载体单条目（只读列出）。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const [ov, open] = await Promise.all([latepayOverview(50), listUnmatched(0)])
    const pending = open.filter((u) => !u.handledAt)
    // 一批一起判（固定至多 3 条查询），不再逐条顺序查（B1 评审修复）
    const flags = await carrierFlags(pending).catch(() => pending.map(() => false))
    const carrierOpen = flags.filter(Boolean).length
    return success({ ...ov, carrierOpen, openTotal: pending.length })
  } catch (e) {
    console.error('[wallet] latepay 概览失败', e)
    return error('获取失败', 500)
  }
}
