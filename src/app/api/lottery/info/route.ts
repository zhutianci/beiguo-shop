export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { publicLotteryInfo } from '@/lib/lottery-server'

/**
 * 「下单有奖」的公开信息：活动开关、参与门槛、规则说明、奖池（奖项名与券面额）。
 * **不含概率** —— publicLotteryInfo 本身就没查概率列，这里也不要自己再补。
 *
 * 不缓存：后台改了奖池/规则要立即生效，否则买家弹窗里看到的奖池与实际抽的对不上。
 */
export async function GET() {
  try {
    const res = success(await publicLotteryInfo())
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  } catch (err) {
    console.error('Lottery info error:', err)
    return error('获取活动信息失败', 500)
  }
}
