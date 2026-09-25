export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { closeExpired, VMQ_TIMEOUT_MIN } from '@/lib/vmq'

// 收银台轮询 / 初始化：返回订单展示信息与支付状态。
// 【不能加登录校验】/lookup 的匿名开票流程（邮箱证明、不登录）发起的税费收款单也用这个接口轮询。
export async function GET(request: NextRequest) {
  try {
    const orderId = new URL(request.url).searchParams.get('orderId')?.trim()
    if (!orderId) return error('缺少订单号')
    // 列宽 VarChar(40)，超长的不可能存在，不碰数据库
    if (orderId.length > 40) return error('订单不存在', 404)

    let o = await prisma.vmqOrder.findUnique({ where: { orderId } })
    if (!o) return error('订单不存在', 404)

    // 【只在「这张单自己已超时仍待支付」时顺带清理】以前每个请求（哪怕不带 orderId）都先跑
    // closeExpired + 券兜底清扫，匿名请求即可驱动这两组查询。过期清理本来就由 cron 每分钟跑
    // （/api/cron/vmq-close），发起支付时也会先清一次；这里只负责让正在看收银台的买家第一时间看到「已过期」。
    // 过期判定和 closeExpired 的 cutoff 等价，触发时这张单一定会被这次清理处理到；到账抢先的由 CAS 兜住。
    // 清理失败不能让收银台变成「订单不存在」：吞掉异常，按原状态返回，下一轮轮询 / cron 再来。
    if (o.state === 0 && o.createdAt.getTime() + VMQ_TIMEOUT_MIN * 60_000 < Date.now()) {
      await closeExpired().catch((e) => console.error('[vmq] status 内联过期清理失败', e))
      o = (await prisma.vmqOrder.findUnique({ where: { orderId } })) ?? o
    }

    return success({
      orderId: o.orderId,
      bizType: o.bizType,
      price: Number(o.price),
      reallyPrice: Number(o.reallyPrice),
      type: o.type,
      state: o.state, // 0 待支付 1 已支付 -1 已过期
      createdAt: o.createdAt,
      timeoutMin: VMQ_TIMEOUT_MIN,
      payDate: o.payDate,
    })
  } catch (err) {
    console.error('Vmq status error:', err)
    return error('查询失败')
  }
}
