import { prisma } from './db'
import { getNumber, getStatus, cancelActivation, finishActivation, HEROSMS_TIMEOUT_MIN, heroSmsConfigured } from './herosms'
import { settleReferral } from './referral'

function appendRemark(old: string | null, msg: string): string {
  return old ? `${old} | ${msg}` : msg
}

// 付款成功后为 SMS 接码订单取号
export async function acquireForOrder(orderId: number, service: string, country: string, maxPrice?: number | null) {
  const exists = await prisma.smsActivation.findUnique({ where: { orderId } })
  if (exists) return exists

  const expireAt = new Date(Date.now() + HEROSMS_TIMEOUT_MIN * 60_000)

  if (!heroSmsConfigured()) {
    return prisma.smsActivation.create({
      data: { orderId, activationId: '', phone: '', service, country, status: 'FAILED', raw: '未配置 HEROSMS_API_KEY', expireAt },
    })
  }

  const r = await getNumber(service, country, maxPrice)
  if (!r.ok) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { remark: true } })
    await prisma.order.update({
      where: { id: orderId },
      data: { remark: appendRemark(order?.remark ?? null, `接码取号失败(${r.error || ''})，待客服处理`) },
    })
    return prisma.smsActivation.create({
      data: { orderId, activationId: '', phone: '', service, country, status: 'FAILED', raw: (r.raw || '').slice(0, 2000), expireAt },
    })
  }

  return prisma.smsActivation.create({
    data: {
      orderId,
      activationId: r.activationId!,
      phone: r.phone!,
      service,
      country,
      status: 'WAITING',
      cost: r.cost ?? null,
      raw: (r.raw || '').slice(0, 2000),
      expireAt,
    },
  })
}

// 轮询单个订单的接码状态（买家页面/定时器调用），返回最新记录
export async function pollActivation(orderId: number) {
  const a = await prisma.smsActivation.findUnique({ where: { orderId } })
  if (!a || a.status !== 'WAITING' || !a.activationId) return a

  // 超时：取消取号（退号费）+ 标记待退款
  if (Date.now() > a.expireAt.getTime()) {
    try { await cancelActivation(a.activationId) } catch (e) { console.error('[sms] cancel failed', e) }
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { remark: true } })
    await prisma.order.update({
      where: { id: orderId },
      data: { remark: appendRemark(order?.remark ?? null, '【待退款】接码超时未收到验证码') },
    })
    return prisma.smsActivation.update({ where: { id: a.id }, data: { status: 'TIMEOUT' } })
  }

  let s
  try {
    s = await getStatus(a.activationId)
  } catch (e) {
    console.error('[sms] getStatus failed', e)
    return a
  }

  if (s.state === 'CODE' && s.code) {
    const updated = await prisma.smsActivation.update({
      where: { id: a.id },
      data: { status: 'CODE', code: s.code, codeAt: new Date(), raw: s.raw.slice(0, 2000) },
    })
    try { await finishActivation(a.activationId) } catch { /* ignore */ }
    // 订单完成
    await prisma.order.update({ where: { id: orderId }, data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() } })
    try { await settleReferral(orderId) } catch (e) { console.error('[sms] settle referral failed', e) }
    return updated
  }

  if (s.state === 'CANCELLED') {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { remark: true } })
    await prisma.order.update({
      where: { id: orderId },
      data: { remark: appendRemark(order?.remark ?? null, '【待退款】接码被取消') },
    })
    return prisma.smsActivation.update({ where: { id: a.id }, data: { status: 'CANCELLED', raw: s.raw.slice(0, 2000) } })
  }

  // 仍在等待
  return prisma.smsActivation.update({ where: { id: a.id }, data: { raw: s.raw.slice(0, 2000) } })
}

// 定时轮询全部等待中的接码（兜底，买家不在页面时也能收码/超时取消）
export async function pollAllWaiting(): Promise<number> {
  const list = await prisma.smsActivation.findMany({
    where: { status: 'WAITING', NOT: { activationId: '' } },
    select: { orderId: true },
  })
  for (const a of list) {
    try {
      await pollActivation(a.orderId)
    } catch (e) {
      console.error('[sms] poll order failed', a.orderId, e)
    }
  }
  return list.length
}
