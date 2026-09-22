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
      numberAt: new Date(),
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

/* ------------------------------------------------------------------ *
 * 买家主动换号
 * ------------------------------------------------------------------ */

/** 最多换几次。每换一次都是一次真实的取号请求，不能无限点 */
export const SMS_MAX_RETRY = 3
/** 两次换号之间的冷却（秒）。上游对「刚取号就取消」通常是拒绝的，
 *  而且不给冷却的话，买家会在号码还没来得及收到短信时就把它换掉 */
export const SMS_RETRY_COOLDOWN_SEC = 120

export interface RetryResult {
  ok: boolean
  error?: string
  /** 还能换几次 */
  remaining?: number
}

/**
 * 换一个号码。
 *
 * 【为什么要有这个功能】号码取到手不代表收得到码：目标平台可能把这个号段拉黑、
 * 这个号可能刚被别人用过、运营商可能压根不转发。买家干等 15 分钟超时、
 * 再去找客服退款，是最差的体验——而重取一个号对上游来说成本几乎为零
 * （旧号没收到码时取消是退费的，见 herosms.ts 的 setStatus 8）。
 *
 * 【顺序：先取新号，再取消旧号】反过来写更省事，但如果取消成功而取新号失败，
 * 买家手上就什么都没有了——他点的是「换一个」，不是「不要了」。
 * 先拿到新号再放掉旧号，最坏情况是原地不动并提示失败，买家不会更糟。
 *
 * 【三道闸】都不是为了刁难买家，是为了别把钱和号白白烧掉：
 *   1. 只在 WAITING 时可换。已收到码（CODE）没有换的理由；
 *      已超时（TIMEOUT）的订单已经挂上【待退款】走客服流程，
 *      在那之后换号会让退款口径变得说不清。
 *   2. 冷却 120 秒。上游对刚取的号通常不允许立刻取消，
 *      而且短信本来就可能要等一两分钟。
 *   3. 最多 3 次。换到第 4 次基本可以断定是账号侧或平台侧的问题，
 *      继续换只是烧钱，这时候该走客服。
 */
export async function retryActivation(orderId: number): Promise<RetryResult> {
  const a = await prisma.smsActivation.findUnique({ where: { orderId } })
  if (!a) return { ok: false, error: '还没有取号记录' }
  if (a.status !== 'WAITING') {
    return { ok: false, error: a.status === 'CODE' ? '已经收到验证码了' : '当前状态不能换号，请联系客服' }
  }
  if (a.retryCount >= SMS_MAX_RETRY) {
    return { ok: false, error: `最多换 ${SMS_MAX_RETRY} 次，请联系客服处理`, remaining: 0 }
  }
  const issuedAt = a.numberAt ?? a.createdAt
  const waited = (Date.now() - issuedAt.getTime()) / 1000
  if (waited < SMS_RETRY_COOLDOWN_SEC) {
    return { ok: false, error: `请再等 ${Math.ceil(SMS_RETRY_COOLDOWN_SEC - waited)} 秒`, remaining: SMS_MAX_RETRY - a.retryCount }
  }
  if (!heroSmsConfigured()) return { ok: false, error: '接码服务未配置' }

  // 换号前再查一次：有可能就在这几秒里码到了，那就不该把它换掉
  try {
    const s = await getStatus(a.activationId)
    if (s.state === 'CODE' && s.code) {
      await pollActivation(orderId) // 交给正常流程去落库、完成订单
      return { ok: false, error: '验证码刚刚到了，请查看' }
    }
  } catch {
    // 查不动就继续换，不因为一次查询失败卡住买家
  }

  const product = await prisma.order.findUnique({
    where: { id: orderId },
    select: { product: { select: { smsMaxPrice: true } } },
  })
  const maxPrice = product?.product?.smsMaxPrice != null ? Number(product.product.smsMaxPrice) : null

  // 先取新号
  const r = await getNumber(a.service, a.country, maxPrice)
  if (!r.ok) {
    return { ok: false, error: r.error || '暂时取不到新号码，请稍后再试', remaining: SMS_MAX_RETRY - a.retryCount }
  }

  // 新号到手，再放掉旧号（未收码会退费）。失败只记日志：
  // 旧号最多白占一会儿，不能因此让买家拿不到已经取到的新号
  const oldId = a.activationId
  const oldPhone = a.phone
  try {
    await cancelActivation(oldId)
  } catch (e) {
    console.error('[sms] cancel old activation failed', oldId, e)
  }

  const now = new Date()
  await prisma.smsActivation.update({
    where: { id: a.id },
    data: {
      activationId: r.activationId!,
      phone: r.phone!,
      cost: r.cost ?? null,
      raw: (r.raw || '').slice(0, 2000),
      retryCount: a.retryCount + 1,
      numberAt: now,
      // 重新计时：新号应该有完整的等待时长，而不是继承旧号剩下的那点时间
      expireAt: new Date(now.getTime() + HEROSMS_TIMEOUT_MIN * 60_000),
    },
  })

  // 在订单备注里留痕，客服排查时能看到换过几次、换掉的是哪个号
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { remark: true } })
  await prisma.order.update({
    where: { id: orderId },
    data: {
      remark: appendRemark(order?.remark ?? null, `接码换号 ${a.retryCount + 1}/${SMS_MAX_RETRY}（旧号 ${oldPhone} 已取消）`),
    },
  })

  return { ok: true, remaining: SMS_MAX_RETRY - (a.retryCount + 1) }
}
