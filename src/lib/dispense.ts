import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { error } from './api'
import { decryptCardContent, syncAutoStock } from './cardkey'

// ============ 对外发卡（共用库存）核心逻辑 ============
// 外部站点付款成功后调用本模块领卡：与本站自动发货共用同一批 CardKey。
// 两道保证：
//  ① 绝不超卖——按卡原子条件更新（status=UNUSED → USED）保证一张卡只会被一处领走。
//  ② 一单不重复/超发——ExternalDispense 的 @@unique(client, externalNo) 保证同一外部订单只有一行，
//     再靠该行 status 的原子翻转（PENDING/PARTIAL → PROCESSING）选出唯一「持锁者」串行化领卡，
//     并发重放的其余请求不领卡、只读回或让其重试。

export class DispenseError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export interface DispenseInput {
  client: string
  orderNo: string
  sku?: string
  productId?: number
  quantity: number
}

export interface DispenseResult {
  productId: number
  sku: string | null
  requested: number
  delivered: number
  status: 'FULFILLED' | 'PARTIAL'
  cards: string[]
  reused: boolean // 幂等重放（此前已发过）
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

// 服务器间鉴权：仅接受 Authorization: Bearer <DISPENSE_API_SECRET>。
// 刻意不支持 ?secret= 查询串，避免长期密钥随 URL 落入反代 access log / Referer。未配置密钥则整个接口关闭。
export function requireDispenseAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.DISPENSE_API_SECRET
  if (!secret || secret.length < 16) {
    return error('库存 API 未启用（服务端未配置 DISPENSE_API_SECRET，至少 16 位）', 503)
  }
  const authHeader = req.headers.get('authorization') || ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!provided || !safeEqual(provided, secret)) return error('无权限', 401)
  return null
}

async function resolveProduct(input: DispenseInput) {
  let product: { id: number; apiSku: string | null; deliveryType: string } | null = null
  if (input.sku) {
    product = await prisma.product.findUnique({
      where: { apiSku: input.sku },
      select: { id: true, apiSku: true, deliveryType: true },
    })
  } else if (input.productId) {
    product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, apiSku: true, deliveryType: true },
    })
  }
  if (!product) throw new DispenseError('商品不存在（sku / productId 未匹配）', 404)
  if (product.deliveryType !== 'AUTO') {
    throw new DispenseError('该商品非自动发货（卡密），无法通过库存 API 领卡', 400)
  }
  // apiSku 是「是否对外共享库存」的开关：留空即不共享。productId 分支也须遵守，
  // 否则可用可枚举的数字 id 领走管理员未开放共享的商品卡密。
  if (!product.apiSku) {
    throw new DispenseError('该商品未开启对外发卡（后台未配置对外发卡 SKU）', 403)
  }
  return product
}

// 原子领取 need 张未使用卡密，标记 externalRef（不占用本地 orderId）。返回实际领到的数量。
// 占用前先验证可解密：坏卡（密文损坏 / 曾换过密钥）直接隔离为 DISABLED 并跳过，
// 绝不占用「发不出去」的卡，避免占卡后解密失败导致订单卡死、卡被静默消耗。
async function claimCards(productId: number, externalRef: string, need: number): Promise<number> {
  let claimed = 0
  for (let attempt = 0; claimed < need && attempt < need * 2 + 20; attempt++) {
    const card = await prisma.cardKey.findFirst({
      where: { productId, status: 'UNUSED' },
      orderBy: { id: 'asc' },
      select: { id: true, content: true },
    })
    if (!card) break // 无库存
    try {
      decryptCardContent(card.content)
    } catch {
      // 坏卡隔离，跳过（下次不再选中），避免卡在同一张坏卡上
      await prisma.cardKey.updateMany({
        where: { id: card.id, status: 'UNUSED' },
        data: { status: 'DISABLED', remark: '解密失败自动停用' },
      })
      continue
    }
    const r = await prisma.cardKey.updateMany({
      where: { id: card.id, status: 'UNUSED' }, // 条件更新：被并发（本站或他站）抢走则 count=0
      data: { status: 'USED', externalRef, usedAt: new Date() },
    })
    if (r.count === 1) claimed++
  }
  return claimed
}

// 处理中锁的陈旧阈值：持锁者若超过该时长未完成（进程崩溃/重启），允许后续重试接管。
const PROCESSING_STALE_MS = 30_000

// 读取某外部订单当前已归属的可交付卡密（解密返回）。
// 正常情况下这些卡在占用前已验证过可解密；万一仍遇到解密失败（如历史脏数据），
// 则释放该卡（隔离为 DISABLED 并清空归属）并跳过——令后续重试补发一张好卡，
// 而不是抛 500 造成「卡被占死 + 外部站无限重试」的黑洞。
async function loadCards(productId: number, ref: string): Promise<{ ids: number[]; cards: string[] }> {
  const rows = await prisma.cardKey.findMany({
    where: { productId, externalRef: ref, status: 'USED' },
    orderBy: { id: 'asc' },
    select: { id: true, content: true },
  })
  const ids: number[] = []
  const cards: string[] = []
  for (const c of rows) {
    try {
      const plain = decryptCardContent(c.content)
      cards.push(plain)
      ids.push(c.id)
    } catch {
      await prisma.cardKey.updateMany({
        where: { id: c.id, externalRef: ref, status: 'USED' },
        data: { status: 'DISABLED', externalRef: null, remark: '解密失败自动停用' },
      })
    }
  }
  return { ids, cards }
}

// 对外发卡主流程：
// - 幂等：同一 (client, orderNo) 只发一次；重试返回同一批卡密。
// - 串行：靠 ExternalDispense.status 的原子翻转（PENDING/PARTIAL → PROCESSING）作为「发卡锁」，
//   保证任一时刻只有一个请求在为该订单领卡，杜绝并发重放导致一单超发。
// - 自愈：持锁者崩溃 → 锁陈旧后由后续重试接管；库存补足后同 orderNo 重试可补齐。
export async function dispense(input: DispenseInput): Promise<DispenseResult> {
  const { client, orderNo, quantity } = input
  const product = await resolveProduct(input)
  const ref = `${client}:${orderNo}`

  // 幂等键：首次插入 PENDING；已存在则读回（重放）。
  let log = await prisma.externalDispense.findUnique({
    where: { client_externalNo: { client, externalNo: orderNo } },
  })
  const reused = !!log
  if (!log) {
    try {
      log = await prisma.externalDispense.create({
        data: {
          client,
          externalNo: orderNo,
          productId: product.id,
          apiSku: product.apiSku ?? null,
          quantity,
          status: 'PENDING',
          cardIds: '',
          delivered: 0,
        },
      })
    } catch (e) {
      // 并发下另一个相同请求抢先建了记录 → 读回按重放处理
      if (isUniqueViolation(e)) {
        log = await prisma.externalDispense.findUnique({
          where: { client_externalNo: { client, externalNo: orderNo } },
        })
      } else {
        throw e
      }
    }
  }
  if (!log) throw new DispenseError('并发冲突，请稍后重试', 409)

  // 复用同一订单号必须指向同一商品、同一数量，否则是调用方 bug，拒绝以免错发。
  if (log.productId !== product.id) {
    throw new DispenseError('该订单号已用于其他商品，请勿复用', 409)
  }
  if (log.quantity !== quantity) {
    throw new DispenseError(`该订单号已存在且数量不一致（原 ${log.quantity}，本次 ${quantity}）`, 409)
  }

  const result = (delivered: number, status: DispenseResult['status'], cards: string[]): DispenseResult => ({
    productId: product.id,
    sku: product.apiSku ?? null,
    requested: log!.quantity,
    delivered,
    status,
    cards,
    reused,
  })

  // 已足额 → 快速幂等返回，无需抢锁。
  if (log.status === 'FULFILLED') {
    const { cards } = await loadCards(product.id, ref)
    return result(cards.length, 'FULFILLED', cards)
  }

  // 抢发卡锁：仅一个请求能把 PENDING/PARTIAL 原子翻转成 PROCESSING。
  const acquired = await prisma.externalDispense.updateMany({
    where: { id: log.id, status: { in: ['PENDING', 'PARTIAL'] } },
    data: { status: 'PROCESSING' },
  })
  if (acquired.count !== 1) {
    // 没抢到锁：要么正被其它请求处理中，要么已完成。
    const cur = await prisma.externalDispense.findUnique({ where: { id: log.id } })
    const loaded = await loadCards(product.id, ref)
    if (cur?.status === 'FULFILLED' || loaded.cards.length >= log.quantity) {
      return result(loaded.cards.length, 'FULFILLED', loaded.cards)
    }
    // 持锁者疑似崩溃（PROCESSING 超过阈值未完成）→ 原子接管：以 updatedAt 陈旧为条件续期，
    // 保证并发的多个重试里只有一个能接管成功，避免绕过锁导致并发双领。
    const staleBefore = new Date(Date.now() - PROCESSING_STALE_MS)
    const took = await prisma.externalDispense.updateMany({
      where: { id: log.id, status: 'PROCESSING', updatedAt: { lt: staleBefore } },
      data: { status: 'PROCESSING' }, // 触发 @updatedAt 续期，作为原子接管标记
    })
    if (took.count !== 1) {
      // 仍有活跃持锁者（或已被别的重试接管）→ 让调用方稍后用同一 orderNo 重试（幂等，绝不重复发）。
      throw new DispenseError('订单正在处理中，请稍后用同一订单号重试', 409)
    }
    // 已原子接管陈旧锁 → 落到下方发卡逻辑继续。
  }

  // 持锁者：缺量补发。以「可交付好卡数」为准（loadCards 会剔除并释放坏卡），只补差额；补货后重试可补齐。
  try {
    let loaded = await loadCards(product.id, ref) // 先清理历史坏卡并统计已发好卡
    if (loaded.cards.length < log.quantity) {
      await claimCards(product.id, ref, log.quantity - loaded.cards.length)
      loaded = await loadCards(product.id, ref)
    }
    const delivered = loaded.cards.length
    const status: DispenseResult['status'] = delivered >= log.quantity ? 'FULFILLED' : 'PARTIAL'
    await prisma.externalDispense.update({
      where: { id: log.id },
      data: { delivered, status, cardIds: loaded.ids.join(',') },
    })
    // 回写本站库存（product.stock = 未使用卡密数），使 beiguo 前台库存同步减少。
    await syncAutoStock(product.id)
    return result(delivered, status, loaded.cards)
  } catch (e) {
    // 领卡异常 → 释放锁回 PARTIAL，让重试能再次接管（已占用的卡靠 externalRef 归属，不会丢/不会重复）。
    await prisma.externalDispense
      .update({ where: { id: log.id }, data: { status: 'PARTIAL' } })
      .catch(() => {})
    throw e
  }
}
