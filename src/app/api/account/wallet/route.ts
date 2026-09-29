export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { buildWalletView } from '@/lib/wallet/dto'
import type { WalletLogCategory } from '@/lib/balance'

/**
 * 账户余额：两格余额 + 预扣 + 累计数 + 余额流水（分页）。docs/短信接码-设计.md §1.15、§6.4。
 *
 * 【一个余额分两格】（D29）充值余额 users.topup_cents（不可提现）+ 返现余额 users.balance（可提现，含义不变）；
 * 买家看到的「可用余额」= 两格之和，预扣中的钱已从格里扣走、不在可用余额里，有 HELD 预扣时单独一行。
 * 【写入方】只有 lib/wallet/ledger.ts 的 postInTx（返现结算、后台调整 / 提现、将来的预扣 / 退款 / 充值）。
 * 【累计数按流水类型算】（Q16）不再用「Σ delta>0」—— 公式在 lib/wallet/dto.ts 的 walletTotals。
 * 【备注与 bizKey 一律不回显】DTO 是白名单；反查订单只查本人（REFERRAL 带 referrerId，其余带 userId）。
 * 【「余额能付接码」的说法由服务端下发】canUseForJiema（B0 时 sms_config 还不存在 → false，页面保留旧口径）。
 *
 * query：page、pageSize、cat=all|topup|spend|back|referral|withdraw；brief=1 只返回余额。
 * 响应另外保留 balance（= 两格总额，元）字段兼容旧前端。
 */
const CATS: WalletLogCategory[] = ['all', 'topup', 'spend', 'back', 'referral', 'withdraw']

export async function GET(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 D11）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const sp = request.nextUrl.searchParams
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 50)
    const catRaw = (sp.get('cat') || 'all') as WalletLogCategory
    const cat = CATS.includes(catRaw) ? catRaw : 'all'
    const brief = sp.get('brief') === '1'

    const view = await buildWalletView({ id: user.id, role: user.role }, { page, pageSize, cat, brief })
    const res = success(view)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('[wallet] Get wallet error:', err)
    return error('获取余额明细失败')
  }
}
