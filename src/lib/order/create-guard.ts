/**
 * 下单闸门（主站与渠道站共用；2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 1.3 / 3.1）。
 *
 * 【补的是哪个洞】以前下单只数「这个人名下有效的收款单」（countOpenOrderPayments）。10-15 那个脚本先下 1 单并付款，
 * 再 4 秒内连下 5 单——那一刻收款单只有 1 张，5 单全部放行；之后逐个发起付款，第 4 张起才被付款闸门 429。
 * 结果 6 笔待付单、3 个唯一金额被占。不直接数「未付订单」是因为没发起过付款的订单不会自动取消，
 * 数全部未付单会把放弃过订单的正常买家永久锁住——所以这里**按时间窗**数：最近 30 分钟内下的、仍未付未取消的单。
 *
 * 【顺序】先做不查库的（IP 封禁、频率），再查库。调用方必须在锁券之前调用（锁券之后不能再有 return）。
 */
import { prisma } from '../db'
import { rateLimited } from '../news/rate-limit'
import { countOpenOrderPayments, VMQ_MAX_OPEN_PER_USER, VMQ_TIMEOUT_MIN } from '../vmq'
import { ipBlocked, ipKeyOf, IP_BLOCKED_MSG } from '../security/ip-ban'
import { emailTier } from '../security/email-domain'

const MIN = 60_000
/** 「最近下的未付单」的时间窗 */
export const UNPAID_WINDOW_MIN = 30
/** 每人 10 分钟最多下几单（以前 20） */
export const ORDER_PER_USER_10MIN = 6
/** 同一出口（IPv6 按 /64）10 分钟最多下几单，跨账号合计 */
export const ORDER_PER_IP_10MIN = 10
/** 新号：注册不满 1 小时（任何邮箱），或不满 24 小时且不是主流邮箱 → 同时只能有 1 笔待付单 */
const NEW_ACCOUNT_MS = 60 * MIN
const NEW_OTHER_MAIL_MS = 24 * 60 * MIN

export interface GateReject {
  message: string
  status: number
}

/** 这个买家现在最多能同时挂几笔「最近的」待付单 */
export async function unpaidLimitFor(user: { createdAt: Date; email: string | null }, now = Date.now()): Promise<number> {
  const age = now - user.createdAt.getTime()
  if (age < NEW_ACCOUNT_MS) return 1
  if (age < NEW_OTHER_MAIL_MS && (await emailTier(user.email)) !== 'TRUSTED') return 1
  return VMQ_MAX_OPEN_PER_USER
}

export async function orderCreateGate(userId: number, headers: Headers, opts: { channel: boolean }): Promise<GateReject | null> {
  if (ipBlocked(headers)) return { message: IP_BLOCKED_MSG, status: 429 }
  // 防刷单、防新订单推送刷屏：正常买家 10 分钟不会下 6 单
  if (rateLimited(`order-create:${userId}`, { windowMs: 10 * MIN, max: ORDER_PER_USER_10MIN })) {
    return { message: '下单过于频繁，请稍后再试', status: 429 }
  }
  // 多个小号从同一出口刷：跨账号合计
  const ip = ipKeyOf(headers)
  if (ip && rateLimited(`order-create-ip:${ip}`, { windowMs: 10 * MIN, max: ORDER_PER_IP_10MIN })) {
    return { message: '当前网络下单过于频繁，请稍后再试', status: 429 }
  }

  // 原有的「有效收款单」上限（付款闸门 api/pay/vmq/create 也有同样一道）
  if ((await countOpenOrderPayments(userId)) >= VMQ_MAX_OPEN_PER_USER) {
    const where = opts.channel ? '「我的订单」' : '「我的订单」或「余额充值」页'
    return {
      message: `你已有 ${VMQ_MAX_OPEN_PER_USER} 笔订单在等待付款，请先在${where}完成支付，或等其超时（约 ${VMQ_TIMEOUT_MIN} 分钟）后再下单`,
      status: 429,
    }
  }

  // 新增：最近 30 分钟内下的、仍未付未取消的单（不论有没有发起付款）
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true, email: true } })
  if (!user) return { message: '请先登录', status: 401 }
  const limit = await unpaidLimitFor(user)
  const recent = await prisma.order.count({
    where: {
      userId,
      payStatus: 'UNPAID',
      deliveryStatus: { in: ['PENDING', 'PROCESSING'] },
      createdAt: { gte: new Date(Date.now() - UNPAID_WINDOW_MIN * MIN) },
    },
  })
  if (recent >= limit) {
    return {
      message:
        limit === 1 && limit < VMQ_MAX_OPEN_PER_USER
          ? `新注册账号暂时只能同时有 1 笔待付款订单，请先在「我的订单」完成支付，或 ${UNPAID_WINDOW_MIN} 分钟后再下单`
          : `你最近已有 ${recent} 笔订单未付款，请先在「我的订单」完成支付，或 ${UNPAID_WINDOW_MIN} 分钟后再下单`,
      status: 429,
    }
  }
  return null
}

/**
 * 新订单推送防刷屏：同一买家 5 分钟内前 2 单照常逐条推；第 3 单起不再逐条推，只推一条「疑似刷单」汇总。
 * 'SEND' 照常推；'SUMMARY' 本单改推汇总告警；'MUTE' 什么都不推。
 */
export function orderNotifyMode(userId: number): 'SEND' | 'SUMMARY' | 'MUTE' {
  if (!rateLimited(`order-notify:${userId}`, { windowMs: 5 * MIN, max: 2 })) return 'SEND'
  return rateLimited(`order-notify-sum:${userId}`, { windowMs: 5 * MIN, max: 1 }) ? 'MUTE' : 'SUMMARY'
}
