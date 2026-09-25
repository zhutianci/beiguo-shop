import { prisma } from './db'
import { getNumber, getStatus, cancelActivation, finishActivation, HEROSMS_TIMEOUT_MIN, heroSmsConfigured } from './herosms'
import { settleReferral } from './referral'

/** Order.remark 是 VarChar(255)（按字符计）。MySQL 严格模式下超长直接报错，不会自动截断 */
const REMARK_MAX = 255

/**
 * 往订单备注末尾追加一段（lib/vmq.ts 的缺货备注也用它）。
 *
 * 【为什么要截断】备注是「运维流水」，会被反复追加：换号、超时、补发仍缺货……
 * 原来不截断，追加十几次就超过 255，order.update 报错 —— 缺货补发会变成「补发失败」，
 * 超时分支会卡在 WAITING 每分钟重试一次。超长时丢最早的内容、保留最新的，
 * 客服排查看的是最近发生了什么。按码点切，避免切出半个代理对（emoji）写进库变乱码。
 */
export function appendRemark(old: string | null, msg: string): string {
  const s = old ? `${old} | ${msg}` : msg
  const cps = Array.from(s)
  return cps.length > REMARK_MAX ? cps.slice(-REMARK_MAX).join('') : s
}

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002'

async function addOrderRemark(orderId: number, msg: string) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, select: { remark: true } })
  await prisma.order.update({ where: { id: orderId }, data: { remark: appendRemark(o?.remark ?? null, msg) } })
}

/**
 * 付款成功后为 SMS 接码订单取号。
 *
 * 【并发】付款那一刻，fulfillOrder 和买家订单页 GET /sms 的自愈可能同时走到这里：
 * 两边都查到「还没有记录」、各自向上游买一个号，后写的一方撞 orderId 唯一约束。
 * 原来撞了就抛出去，它买到的号没人管（白占余额直到上游过期）。现在撞约束就把自己这个号放掉，
 * 返回先写进去的那条记录。
 */
export async function acquireForOrder(orderId: number, service: string, country: string, maxPrice?: number | null) {
  const exists = await prisma.smsActivation.findUnique({ where: { orderId } })
  if (exists) return exists

  const expireAt = new Date(Date.now() + HEROSMS_TIMEOUT_MIN * 60_000)

  if (!heroSmsConfigured()) {
    try {
      return await prisma.smsActivation.create({
        data: { orderId, activationId: '', phone: '', service, country, status: 'FAILED', raw: '未配置 HEROSMS_API_KEY', expireAt },
      })
    } catch (e) {
      if (isUniqueViolation(e)) return prisma.smsActivation.findUnique({ where: { orderId } })
      throw e
    }
  }

  const r = await getNumber(service, country, maxPrice)
  if (!r.ok) {
    try {
      const row = await prisma.smsActivation.create({
        data: { orderId, activationId: '', phone: '', service, country, status: 'FAILED', raw: (r.raw || '').slice(0, 2000), expireAt },
      })
      // 备注写在建记录成功之后：并发里输掉的一方不再重复写一遍「取号失败」。
      // 错误信息截短：上游返回 5xx HTML 页时 r.error 是整页原文，塞进备注会超长
      await addOrderRemark(orderId, `接码取号失败(${(r.error || '').slice(0, 60)})，待客服处理`)
      return row
    } catch (e) {
      if (isUniqueViolation(e)) return prisma.smsActivation.findUnique({ where: { orderId } })
      throw e
    }
  }

  try {
    return await prisma.smsActivation.create({
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
  } catch (e) {
    // 号已经买到手却没落库（并发的另一方先写了，或数据库异常）：立刻放掉，否则没有任何人管它
    try {
      await cancelActivation(r.activationId!)
    } catch (ce) {
      console.error('[sms] release orphan number failed', r.activationId, ce)
    }
    if (isUniqueViolation(e)) return prisma.smsActivation.findUnique({ where: { orderId } })
    throw e
  }
}

/**
 * 轮询单个订单的接码状态（买家页面/定时器调用），返回最新记录。
 *
 * 【所有写入都是 CAS】条件钉住「读到的这个号 + 仍在 WAITING」。原来按 id 无条件写：
 *  - 买家点「换一个号」时，换号先在上游取消旧号、再改库；这期间一次轮询读到旧号、
 *    上游答 STATUS_CANCEL，就把记录写成 CANCELLED 并给订单挂【待退款】——
 *    结果是「新号码 + 已取消」，正常买家被误判成退款单（约一成的换号会踩中）。
 *  - 买家页 5 秒一次和 cron 每分钟一次可能同时进来，超时分支会重复追加【待退款】。
 * CAS 落空说明记录已被别人改过（换号 / 另一路轮询 / 超时），直接重读返回，不再写任何东西。
 */
export async function pollActivation(orderId: number) {
  const a = await prisma.smsActivation.findUnique({ where: { orderId } })
  if (!a || a.status !== 'WAITING' || !a.activationId) return a

  const cas = { id: a.id, activationId: a.activationId, status: 'WAITING' }
  const reread = () => prisma.smsActivation.findUnique({ where: { orderId } })

  /*
   * 【订单已取消 / 已退款 → 不再等码，放掉号码】后台没有退款按钮，线下退款后是把已付款订单改成
   * 「已取消」。原来轮询照常进行，迟到的验证码会把这张已取消的订单无条件翻回「已交付」，
   * settleReferral 看到 PAID+DELIVERED 还会给推广人入账，取消时减掉的销量也对不上。
   * 注意：超时取消后又晚到付款的订单，fulfillOrder 是先置 PROCESSING、再 acquireForOrder 取号
   * （lib/vmq.ts fulfillOrder 里 else if (won) 那段在「SMS 接码」那段之前），所以正常付款的单
   * 走到这里时一定不是 CANCELLED。以后调整那边的顺序必须保持这一点，否则会误放正常单的号。
   */
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { payStatus: true, deliveryStatus: true } })
  if (!order || order.payStatus !== 'PAID' || order.deliveryStatus === 'CANCELLED') {
    const c = await prisma.smsActivation.updateMany({ where: cas, data: { status: 'CANCELLED', raw: '订单已取消/退款，号码已释放' } })
    if (c.count === 1) {
      try {
        await cancelActivation(a.activationId)
      } catch (e) {
        console.error('[sms] release on cancelled order failed', orderId, e)
      }
    }
    return reread()
  }

  // 超时：取消取号（退号费）+ 标记待退款。先抢状态再动上游和备注：并发的两路只有一路会追加备注
  if (Date.now() > a.expireAt.getTime()) {
    const c = await prisma.smsActivation.updateMany({ where: cas, data: { status: 'TIMEOUT' } })
    if (c.count !== 1) return reread()
    try { await cancelActivation(a.activationId) } catch (e) { console.error('[sms] cancel failed', e) }
    await addOrderRemark(orderId, '【待退款】接码超时未收到验证码')
    return reread()
  }

  let s
  try {
    s = await getStatus(a.activationId)
  } catch (e) {
    console.error('[sms] getStatus failed', e)
    return a
  }

  if (s.state === 'CODE' && s.code) {
    const c = await prisma.smsActivation.updateMany({
      where: cas,
      data: { status: 'CODE', code: s.code, codeAt: new Date(), raw: s.raw.slice(0, 2000) },
    })
    if (c.count !== 1) return reread()
    try { await finishActivation(a.activationId) } catch { /* ignore */ }
    // 订单完成：只推进「已付款、还在等交付」的订单。已取消 / 已退款的单不能被迟到的验证码翻回已交付；
    // 只有真正把它翻成已交付的这一次才结算返现（settleReferral 自己也复核 PAID+DELIVERED、按唯一约束幂等）
    const done = await prisma.order.updateMany({
      where: { id: orderId, payStatus: 'PAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
      data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() },
    })
    if (done.count === 1) {
      try { await settleReferral(orderId) } catch (e) { console.error('[sms] settle referral failed', e) }
    }
    return reread()
  }

  if (s.state === 'CANCELLED') {
    const c = await prisma.smsActivation.updateMany({ where: cas, data: { status: 'CANCELLED', raw: s.raw.slice(0, 2000) } })
    if (c.count === 1) await addOrderRemark(orderId, '【待退款】接码被取消')
    return reread()
  }

  // 仍在等待
  await prisma.smsActivation.updateMany({ where: cas, data: { raw: s.raw.slice(0, 2000) } })
  return reread()
}

/**
 * 已付款订单被后台取消 / 标退款时调用：停掉还在等码的取号（上游未收码会退号费），
 * 并让定时轮询不再碰它。幂等：没有记录或已不在 WAITING 时什么都不做。
 * （pollActivation 下一次轮询时也会放号，这里是让后台保存那一刻就生效）
 */
export async function cancelActivationForOrder(orderId: number): Promise<void> {
  const a = await prisma.smsActivation.findUnique({ where: { orderId } })
  if (!a || a.status !== 'WAITING') return
  const r = await prisma.smsActivation.updateMany({
    where: { id: a.id, activationId: a.activationId, status: 'WAITING' },
    data: { status: 'CANCELLED', raw: '订单已取消/退款，号码已释放' },
  })
  if (r.count !== 1 || !a.activationId) return
  try {
    await cancelActivation(a.activationId)
  } catch (e) {
    console.error('[sms] 取消订单时退号失败', orderId, e)
  }
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
 * 【顺序：先取新号，再把记录切到新号，最后放掉旧号】
 * 先拿到新号再放旧号：如果取消成功而取新号失败，买家手上就什么都没有了——
 * 他点的是「换一个」，不是「不要了」。最坏情况是原地不动并提示失败。
 * 「切记录」必须排在「放旧号」之前：放掉旧号后上游对它答 STATUS_CANCEL，
 * 这时如果库里还是旧号，并发的一次轮询会把记录写成已取消、给订单挂【待退款】。
 * 先切过去，轮询的 CAS（钉住旧 activationId）就必然落空。
 *
 * 【四道闸】都不是为了刁难买家，是为了别把钱和号白白烧掉：
 *   0. 订单已取消 / 已退款不能换（线下退款后换号等于继续花接码余额）。
 *   1. 只在 WAITING 时可换。已收到码（CODE）没有换的理由；
 *      已超时（TIMEOUT）的订单已经挂上【待退款】走客服流程，
 *      在那之后换号会让退款口径变得说不清。
 *   2. 冷却 120 秒。上游对刚取的号通常不允许立刻取消，
 *      而且短信本来就可能要等一两分钟。
 *   3. 最多 3 次。换到第 4 次基本可以断定是账号侧或平台侧的问题，
 *      继续换只是烧钱，这时候该走客服。次数写入是 CAS（钉住读到的 retryCount），
 *      脚本并发连打也只有一个能写进去，上限绕不过去。
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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { payStatus: true, deliveryStatus: true, product: { select: { smsMaxPrice: true } } },
  })
  if (!order || order.payStatus !== 'PAID' || order.deliveryStatus === 'CANCELLED') {
    return { ok: false, error: '订单已取消，不能换号' }
  }
  const maxPrice = order.product?.smsMaxPrice != null ? Number(order.product.smsMaxPrice) : null

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

  // 先取新号
  const r = await getNumber(a.service, a.country, maxPrice)
  if (!r.ok) {
    return { ok: false, error: r.error || '暂时取不到新号码，请稍后再试', remaining: SMS_MAX_RETRY - a.retryCount }
  }

  // 再用 CAS 把记录切到新号：同时钉住旧号、等码状态和读到的次数
  const now = new Date()
  const sw = await prisma.smsActivation.updateMany({
    where: { id: a.id, activationId: a.activationId, status: 'WAITING', retryCount: a.retryCount },
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
  if (sw.count !== 1) {
    // 没抢到（另一个换号请求先写了、这期间收到码了、已超时或订单被取消）：新号用不上，放掉
    try {
      await cancelActivation(r.activationId!)
    } catch (e) {
      console.error('[sms] release unused new number failed', r.activationId, e)
    }
    return { ok: false, error: '号码状态刚刚有变化，请刷新后查看' }
  }

  // 记录已切到新号，最后放掉旧号（未收码会退费）。失败只记日志：旧号最多白占一会儿
  const oldId = a.activationId
  const oldPhone = a.phone
  try {
    await cancelActivation(oldId)
  } catch (e) {
    console.error('[sms] cancel old activation failed', oldId, e)
  }

  // 在订单备注里留痕，客服排查时能看到换过几次、换掉的是哪个号
  await addOrderRemark(orderId, `接码换号 ${a.retryCount + 1}/${SMS_MAX_RETRY}（旧号 ${oldPhone} 已取消）`)

  return { ok: true, remaining: SMS_MAX_RETRY - (a.retryCount + 1) }
}
