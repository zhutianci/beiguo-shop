export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error, notFound } from '@/lib/api'
import { adminOrResponse } from '@/lib/admin/source-site'
import { RefillError, refillOrder } from '@/lib/order/refill'

// 补发卡密：自动发货订单在付款时若库存不足会停在 PROCESSING（remark 标注「待人工补发」），
// 补货之后需要一个入口把缺口补齐。原先只能绕到「收款监控 → 补单」，这里给订单页一个直接入口。
// 逻辑在 lib/order/refill.ts（与微信机器人「补发」指令共用，docs/微信机器人-设计.md §7.3），这里只做鉴权与响应，
// 校验文案、返回字段、成功提示与抽出之前逐字相同。fulfillOrder 幂等：只补该订单「尚缺」的张数，不会重复记账、不会超发。
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // 路由内再验一次管理员（CVE-2025-29927，见交接文档第二十三节）：补发会从卡池里领卡；渠道 Host → 404
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const id = parseInt(params.id)
    if (!id) return error('订单无效')

    const r = await refillOrder(id, { userId: auth.user.id, req: request })
    return success(
      {
        added: r.added,
        owned: r.owned,
        quantity: r.quantity,
        due: r.due,
        deliveryStatus: r.deliveryStatus,
      },
      r.message
    )
  } catch (err) {
    if (err instanceof RefillError) return err.status === 404 ? notFound(err.message) : error(err.message, err.status)
    console.error('Refill order cards error:', err)
    return error('补发失败')
  }
}
