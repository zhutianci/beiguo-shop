/**
 * 兑换的服务端编排：鉴权边界、限流、日志。适配器只管翻译协议，安全策略全在这里。
 *
 * ================== 两条不能破的线 ==================
 *
 * 【一】只代理我们自己卖出去的卡密。
 * 上游的 /api/check 与 /api/activate **不需要任何认证**，谁都能调。
 * 如果我们的接口对任意字符串都往上游转发，我们就成了一台公开的撞库跳板：
 * 别人用我们的域名去枚举上游卡密，上游看到的是**我们服务器的 IP**。
 * 轻则被上游封，重则直接失去货源。
 * 所以每次兑换都先用 cardContentHash 反查 card_keys：不是我们发出去的卡，直接拒。
 *
 * 【二】买家的账号凭据只过路，不留痕。
 * session_key 是 Claude 的 sessionKey、session_json 里含 ChatGPT 的 accessToken ——
 * 这些等价于账号密码。本文件保证：
 *   · 不写数据库（RedeemLog 里没有任何凭据字段）
 *   · 不进日志（console 只打状态码与卡密 id）
 *   · 不回显给前端
 * 它们从请求体进来，转发给上游，然后随请求上下文一起消失。
 */
import { prisma } from '@/lib/db'
import { cardContentHash, cardKeyConfigured } from '@/lib/cardkey'
import { rateLimited } from '@/lib/news/rate-limit'
import { getProvider } from './registry'
import { RedeemError, type RedeemActivateResult, type RedeemCheckResult } from './types'

/** 卡密长度上限。超过这个长度的输入根本不可能是卡密，早拒早省事 */
const MAX_CDK_LEN = 200

export interface ResolvedCard {
  id: number
  productId: number
  /** 本站商品名。sysb 用它自动判断该走哪条充值渠道，免得让买家自己选 */
  productName: string
  /** 导入时标注的充值系统；可能为空 —— 空不影响兑换，见 resolveCard 的说明 */
  provider: string | null
  status: string
}

export type ResolveFailure =
  | { ok: false; reason: 'NOT_CONFIGURED'; message: string }
  | { ok: false; reason: 'NOT_OURS'; message: string }
  | { ok: false; reason: 'NOT_DELIVERED'; message: string }
  | { ok: false; reason: 'DISABLED'; message: string }
  | { ok: false; reason: 'ORDER_VOID'; message: string }

/**
 * 确认这张卡密确实是本站发出的。
 *
 * 【只管「是不是我们的」，不管「属于哪个充值系统」】
 * 曾经这里还要求 card.redeemProvider 必须等于当前路由的平台，不匹配就拒。
 * 那一层是错的：判断「这张卡能不能在这个系统里充」的权威是**上游自己**，
 * 我们库里那个字段只是导入时的人工标注 —— 漏标、标错、或者旧卡根本没标，
 * 都会让一张完全正常的卡在自家页面上被拒掉，而买家什么也做不了。
 * 现在的规则是：是我们发出的卡就放行，能不能充由上游的查询结果说了算。
 *
 * 【防滥用的那道闸没有松】真正拦住「拿我们当撞库跳板」的是「必须在
 * card_keys 里且已发出」这两条，它们原样保留。平台绑定从来不是安全边界。
 *
 * 【为什么用哈希查而不是解密比对】card_keys.content 是 AES 加密的，
 * 要比对就得把整表解密一遍。contentHash 是 sha256(盐|明文) 的确定性哈希，
 * 一次索引查询就能定位 —— 这也是 schema 里为它单独加索引的原因。
 */
export async function resolveCard(
  /** 当前路由的平台。**不参与放行判断**，只用于日志归属；别因为「没用到」就删掉 */
  providerKey: string,
  cdk: string
): Promise<{ ok: true; card: ResolvedCard } | ResolveFailure> {
  if (!cardKeyConfigured()) {
    return { ok: false, reason: 'NOT_CONFIGURED', message: '兑换服务暂未配置，请联系客服' }
  }

  const card = await prisma.cardKey.findFirst({
    where: { contentHash: cardContentHash(cdk) },
    select: {
      id: true,
      productId: true,
      redeemProvider: true,
      status: true,
      orderId: true,
      product: { select: { name: true } },
    },
  })

  if (!card) {
    /*
     * 【文案刻意不区分「卡密不存在」和「不是本站的卡」】
     * 说破了等于告诉试探者「这串在库里」，是一个可枚举的信号。
     * 真买家看到这句会去核对复制是否完整，够用了。
     */
    return { ok: false, reason: 'NOT_OURS', message: '未找到该卡密，请确认是否从本站购买、且已完整复制' }
  }
  if (card.status === 'DISABLED') {
    return { ok: false, reason: 'DISABLED', message: '该卡密已停用，请联系客服' }
  }
  if (card.status !== 'USED') {
    // UNUSED = 还躺在库存里没发出去。买家手上不该有这张卡
    return { ok: false, reason: 'NOT_DELIVERED', message: '该卡密尚未发出，请确认是否从本站购买' }
  }
  /*
   * 【所属订单已取消 / 已退款 → 不再代理兑换】后台没有退款按钮，线下退款后是把已付款订单改成
   * 「已取消」；已发出的卡密状态又改不回来（已发出的卡不可改状态），原来买家拿了退款还能在站内照常兑换。
   * 读时判断、不改卡状态：管理员撤回取消后自动恢复可兑换。
   * 外部站发的卡 orderId 为空，不受影响；查不到订单时按原逻辑放行，避免误伤。
   * 局限：上游兑换站是公开的，这里只能挡住站内这一条路（后台取消时会提示站长核对）。
   */
  if (card.orderId != null) {
    const o = await prisma.order.findUnique({
      where: { id: card.orderId },
      select: { payStatus: true, deliveryStatus: true },
    })
    if (o && (o.payStatus !== 'PAID' || o.deliveryStatus === 'CANCELLED')) {
      return { ok: false, reason: 'ORDER_VOID', message: '这张卡密所属的订单已取消或退款，无法兑换；如有疑问请联系客服' }
    }
  }
  return {
    ok: true,
    card: {
      id: card.id,
      productId: card.productId,
      productName: card.product?.name || '',
      provider: card.redeemProvider,
      status: card.status,
    },
  }
}

/** 规范化买家粘贴进来的卡密：去首尾空白。**不做其它改写** —— 上游明确要求原样传 */
export function normalizeCdk(raw: string): string {
  return (raw || '').trim()
}

export function validCdkShape(cdk: string): boolean {
  return cdk.length > 0 && cdk.length <= MAX_CDK_LEN && !/[\s\u0000-\u001f]/.test(cdk)
}

/**
 * 限流。三层：单卡、单 IP、全站。
 *
 * 单卡那层是防买家对着一张卡狂点（上游本身也有冷却，但我们不该把这些请求都转上去）；
 * 单 IP 那层是防有人拿我们当跳板批量试卡；
 * 全站那层是最后的闸门，上游限流我们的 IP 之前先自己刹车。
 */
export function redeemRateLimited(action: string, cardId: number | null, ip: string): string | null {
  if (cardId !== null && rateLimited(`rd:${action}:${cardId}`, { windowMs: 60_000, max: 6 })) {
    return '操作过于频繁，请稍后再试'
  }
  if (rateLimited(`rd-ip:${ip}`, { windowMs: 60_000, max: 20 })) {
    return '操作过于频繁，请稍后再试'
  }
  if (rateLimited('rd-all', { windowMs: 60_000, max: 300 })) {
    return '当前兑换人数较多，请稍后再试'
  }
  return null
}

/**
 * 写一条兑换日志。**绝不接收凭据参数** —— 函数签名里根本没有这个位置，
 * 是防止以后有人「顺手」把 values 传进来落库。
 */
export async function logRedeem(input: {
  cardKeyId: number | null
  provider: string
  action: 'CHECK' | 'ACTIVATE' | 'REBIND'
  state: string
  message?: string
  requestId?: string
  orderRef?: string
  ip?: string
}): Promise<void> {
  try {
    await prisma.redeemLog.create({
      data: {
        cardKeyId: input.cardKeyId,
        provider: input.provider.slice(0, 20),
        action: input.action,
        state: input.state.slice(0, 20),
        message: input.message?.slice(0, 255) || null,
        requestId: input.requestId?.slice(0, 64) || null,
        orderRef: input.orderRef?.slice(0, 64) || null,
        ip: input.ip?.slice(0, 64) || null,
      },
    })
  } catch (err) {
    // 日志写不进去绝不能挡住兑换本身 —— 买家的钱已经花了，落不了日志是我们的问题
    console.error('[redeem] 写日志失败:', err)
  }
}

/**
 * 读回这张卡上一次的上游订单号。
 *
 * 【这是防重复扣卡的关键一环】异步下单的平台（sysb）要求「超时后先查原订单，
 * 不能换新订单号重下」。没有这个函数，买家多点一次提交就可能被扣两张卡。
 * 取最近一条非空的，因为失败后允许用新内容再下一单，那时会写入新的订单号。
 */
export async function loadOrderRef(cardKeyId: number, provider: string): Promise<string | null> {
  const row = await prisma.redeemLog.findFirst({
    where: { cardKeyId, provider, orderRef: { not: null } },
    orderBy: { id: 'desc' },
    select: { orderRef: true },
  })
  return row?.orderRef ?? null
}

/**
 * 这张卡在这个平台上一共下过几笔**不同的**上游订单。
 * 用来给「失败后重试」封顶：连着失败几次就该转人工，而不是让买家无限点下去。
 */
export async function countOrderRefs(cardKeyId: number, provider: string): Promise<number> {
  const rows = await prisma.redeemLog.findMany({
    where: { cardKeyId, provider, orderRef: { not: null } },
    distinct: ['orderRef'],
    select: { orderRef: true },
  })
  return rows.length
}

/** 记下上游订单号。**下单之前就要写**，否则 POST 超时后无从查起 */
export async function saveOrderRef(
  cardKeyId: number,
  provider: string,
  orderRef: string,
  ip?: string
): Promise<void> {
  await logRedeem({
    cardKeyId,
    provider,
    action: 'ACTIVATE',
    state: 'SUBMITTING',
    message: '已生成上游订单号，准备提交',
    orderRef,
    ip,
  })
}

/**
 * 原子占位：宣告「这张卡要被提交给上游了，可能会被消耗」。
 *
 * 【为什么必须是一条 UPDATE】卡付走 V1 之后没有任何幂等键（V2 靠 order_id 去重，
 * V1 什么都没有），同一张卡并发提交两次就是两笔真实扣款。
 * 先读再写的写法挡不住并发 —— 两个请求会同时读到「没锁」。
 * 这里靠 `WHERE redeem_lock_at IS NULL` 让数据库来裁决，只有一个请求能改到那一行。
 *
 * 【为什么给过期时间】万一我们在 precheck 与 redeem 之间崩了，锁会永远留在那儿。
 * 15 分钟后允许再抢一次：上游的 activation_token 只活 15 分钟（实测 exp-iat=900 秒），
 * 那时候原来那笔无论如何都已经结束了。
 *
 * 返回 false = 没抢到，**绝对不能继续往上游提交**。
 */
export async function claimForIrreversibleRedeem(cardKeyId: number): Promise<boolean> {
  const staleBefore = new Date(Date.now() - 15 * 60_000)
  const r = await prisma.cardKey.updateMany({
    where: {
      id: cardKeyId,
      OR: [{ redeemLockAt: null }, { redeemLockAt: { lt: staleBefore } }],
    },
    data: { redeemLockAt: new Date() },
  })
  /*
   * 【这里可以放心用 count】MySQL 返回的是 changed-rows 而不是 matched-rows
   * （踩过这个坑），但我们每次都写一个新的时间戳，值必然变化，
   * 所以「匹配到」等价于「改动了」。
   */
  return r.count === 1
}

/** 把适配器抛出的异常收敛成可展示的结果，避免上游的原始异常泄漏到前端 */
export function toCheckFailure(e: unknown): RedeemCheckResult {
  if (e instanceof RedeemError) {
    return { state: e.state, message: e.message, fields: [] }
  }
  console.error('[redeem] check 异常:', e)
  return { state: 'ERROR', message: '兑换服务暂时不可用，请稍后再试', fields: [] }
}

export function toActivateFailure(e: unknown): RedeemActivateResult {
  if (e instanceof RedeemError) {
    /*
     * 【COMPLETED / PROCESSING 不能压成 ERROR】适配器在提交前查出「这张卡已经
     * 充完了」「上游还在处理」时，走的也是抛异常这条路。压成 ERROR 会把一条
     * 好消息染成红色报错，买家看了以为充失败，转头就来开工单。
     */
    const state: RedeemActivateResult['state'] =
      e.state === 'COMPLETED' || e.state === 'PROCESSING' || e.state === 'COOLDOWN' ? e.state : 'ERROR'
    return { state, message: e.message, retriable: e.retriable }
  }
  console.error('[redeem] activate 异常:', e)
  return { state: 'ERROR', message: '兑换服务暂时不可用，请稍后再试', retriable: true }
}

export { getProvider }
