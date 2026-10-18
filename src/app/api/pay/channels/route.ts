export const dynamic = 'force-dynamic'

import { success, error } from '@/lib/api'
import { currentPayQrUrls } from '@/lib/pay-qr'

/**
 * 现在能用哪些支付方式（结算弹窗据此决定显示「支付宝 / 微信支付」哪几个）。公开、只读。
 * 一个渠道「可用」= 后台给它设了当前收款码（微信没上传 / 设为「未启用」就是不可用）。
 * 只回布尔值，不回收款码地址：码只在收银台给待支付单的买家看。
 */
export async function GET() {
  try {
    const q = await currentPayQrUrls()
    return success({ alipay: !!q.alipay, wechat: !!q.wechat })
  } catch (e) {
    console.error('[pay/channels] 读取失败', e)
    return error('读取失败', 500)
  }
}
