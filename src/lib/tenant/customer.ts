/**
 * 站点客户关系 TenantCustomer 的唯一写入口（设计 5.5）。
 *
 * 【只在两处调用】「渠道 Host 注册」「渠道 Host 建单」，与业务在同一个事务里。**登录、浏览不调用**（T26）：
 * 主站老用户在 lulu 登录那一刻还没在 lulu 发生交易，不能因此把他的邮箱给渠道。
 *
 * 【并发与锁】同一买家并发下多单时，每个事务都会走到这里，而且设计 8.1 的顺序是**先 createShopOrder、后调本函数**。
 * 两种直觉写法在这个顺序下都会死锁（MySQL 1213，一单直接失败）：
 *  · 「INSERT IGNORE + 条件 UPDATE」：重复键的 INSERT IGNORE 在已有行上拿 S 锁，随后 UPDATE 要升级成 X 锁，两个事务互等；
 *  · 「先 SELECT … FROM users FOR UPDATE 串行化」：插订单时 orders.user_id 外键已经给 users 行加了 S 锁，
 *    再 FOR UPDATE 又是 S→X 升级，只是换到了 users 行上（审查 W0 #1 实测复现，itest W0-6「下单链路」）。
 * 所以这里**一条** `INSERT … ON DUPLICATE KEY UPDATE`：遇到重复键时 InnoDB 直接对已有行拿 X 锁（不经过 S），
 * 同一买家的并发写入在这一行上排队、不互等；不碰 users 行的 X 锁，因此**与调用顺序无关**——调用方在同一事务里
 * 先插订单、支付等引用 users 的行也没问题。本函数只对 users 行做普通快照读（取 role），不加锁。
 *
 * 【快照】调用方事务里此前已有普通读（RR 下快照已建立），别的事务刚提交的客户关系行对普通 SELECT 不可见。
 * 所以写入后的存在性复查用**锁定读**（FOR UPDATE 读最新提交版本；本行 X 锁已在手，不会新增等待），不用 count()。
 *
 * 【publicNo 冲突】ON DUPLICATE KEY 对任何唯一键冲突都生效，包括 60 bit 随机编号撞上**别人**那一行（极小概率）。
 * UPDATE 子句里每个赋值都用 `IF(tenant_id = ? AND user_id = ?, 新值, 原值)` 守住，撞到别人时是空操作；
 * 复查发现本行仍不存在就换编号重试，最多 3 次，仍失败则抛错（交给调用方回滚，不留下「没有客户关系的渠道单」，对账 A11）。
 *
 * 与设计 5.5 字面（createMany skipDuplicates + 两次 updateMany）的差异只在实现手段，语义相同：
 * 已有行不改 joinedVia / noticeVersion；firstOrderAt 取最早、lastOrderAt 取最晚；REGISTER 不写下单时间。
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { PRIVACY_UPDATED_AT } from '../legal'
import { newPublicNo } from './public-no'

const PLATFORM_TENANT_ID = 1

// 仅供 itest 注入固定编号以覆盖「编号撞上别人那一行」分支（真实概率约 2^-60，无法自然触发）
let publicNoGen: () => string = newPublicNo
export function setCustomerPublicNoForTest(fn: (() => string) | null): void {
  publicNoGen = fn ?? newPublicNo
}

export async function ensureTenantCustomer(
  tx: Prisma.TransactionClient,
  a: { tenantId: number; userId: number; via: 'REGISTER' | 'ORDER'; at?: Date },
): Promise<void> {
  if (a.tenantId === PLATFORM_TENANT_ID) return // 主站零改动：不建行
  if (!Number.isInteger(a.tenantId) || a.tenantId < 2) throw new Error(`[tenant/customer] tenantId 非法：${a.tenantId}`)
  if (!Number.isInteger(a.userId) || a.userId <= 0) throw new Error(`[tenant/customer] userId 非法：${a.userId}`)
  if (a.via !== 'REGISTER' && a.via !== 'ORDER') throw new Error('[tenant/customer] via 非法')
  if (a.at !== undefined && !(a.at instanceof Date && Number.isFinite(a.at.getTime()))) throw new Error('[tenant/customer] at 非法')

  // 普通快照读，不加锁（见文件头「并发与锁」）。同一事务里刚建的用户（注册）对本事务可见
  const u = await tx.user.findUnique({ where: { id: a.userId }, select: { role: true } })
  if (!u) throw new Error(`[tenant/customer] 用户 ${a.userId} 不存在`)
  // 超管邮箱永不进渠道客户列表（设计 4.7、S23）
  if (u.role === 'ADMIN') return

  const { tenantId, userId, via } = a
  const now = new Date()
  // REGISTER 传 NULL：插入时两列为空；命中已有行时下面的 CASE 第一支保持原值
  const at: Date | null = via === 'ORDER' ? (a.at ?? now) : null

  for (let attempt = 0; attempt < 3; attempt++) {
    // 时间一律以参数传入（Prisma 按 UTC 写，与 ORM 写入的列口径一致），不用库里的 NOW()（会话时区不一定是 UTC）
    await tx.$executeRaw`
      INSERT INTO tenant_customers (public_no, tenant_id, user_id, joined_via, notice_version, first_order_at, last_order_at, created_at, updated_at)
      VALUES (${publicNoGen()}, ${tenantId}, ${userId}, ${via}, ${PRIVACY_UPDATED_AT}, ${at}, ${at}, ${now}, ${now})
      ON DUPLICATE KEY UPDATE
        first_order_at = IF(tenant_id = ${tenantId} AND user_id = ${userId},
          CASE WHEN ${at} IS NULL THEN first_order_at WHEN first_order_at IS NULL OR first_order_at > ${at} THEN ${at} ELSE first_order_at END,
          first_order_at),
        last_order_at = IF(tenant_id = ${tenantId} AND user_id = ${userId},
          CASE WHEN ${at} IS NULL THEN last_order_at WHEN last_order_at IS NULL OR last_order_at < ${at} THEN ${at} ELSE last_order_at END,
          last_order_at),
        updated_at = IF(tenant_id = ${tenantId} AND user_id = ${userId} AND ${at} IS NOT NULL, ${now}, updated_at)`
    // 不按影响行数判断：驱动若开了 CLIENT_FOUND_ROWS，「撞了别人编号、值没变」也返回 1，与「新插入」分不开。一律锁定读复查
    const hit = await tx.$queryRaw<{ n: bigint | number }[]>`
      SELECT COUNT(*) AS n FROM tenant_customers WHERE tenant_id = ${tenantId} AND user_id = ${userId} FOR UPDATE`
    if (Number(hit[0]?.n ?? 0) > 0) return
  }
  throw new Error('[tenant/customer] 写入客户关系失败（编号连续冲突）')
}

/**
 * 该用户是否被本站拉黑（渠道或平台设的都算；只影响该渠道的新下单，设计 6.2）。主站恒为 false（主站没有站点拉黑）。
 * 可以在下单事务内传 tx 调用（下单事务内只用 tx，Dujiao #271）。
 */
export async function isBlockedInTenant(db: Prisma.TransactionClient | PrismaClient, tenantId: number, userId: number): Promise<boolean> {
  if (tenantId === PLATFORM_TENANT_ID) return false
  // 非法入参只可能是 bug：抛错（下单随之失败）而不是返回「未拉黑」放行
  if (!Number.isInteger(tenantId) || tenantId < 2 || !Number.isInteger(userId) || userId <= 0) {
    throw new Error(`[tenant/customer] isBlockedInTenant 入参非法：${tenantId}/${userId}`)
  }
  const c = await db.tenantCustomer.findUnique({ where: { tenantId_userId: { tenantId, userId } }, select: { blockedAt: true } })
  return !!c?.blockedAt
}
