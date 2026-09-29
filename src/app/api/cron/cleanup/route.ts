export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { assertCronAuth } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'

/**
 * 流量数据的保留期清理。每天跑一次。
 *
 * 【为什么必须有这个】page_views 是这个库里唯一一张**只增不减**的明细表。
 * 没有清理的话，一年之后它会比其他所有业务表加起来还大，
 * 而这台机器只有 1.8G 内存、磁盘也只剩十几个 G——
 * 真撑爆的时候挂掉的是整个站，不是统计功能。
 *
 * 【90 天这个数字不是随便定的】隐私政策里对买家承诺的是
 * 「技术日志一般保留 90 天以内」，这里必须与那句话一致。
 * 改这个数之前先去改 /privacy，别让条款和实际行为对不上。
 *
 * 【visitors 表不按 90 天删】它记的是「这个人第一次是什么时候来的」，
 * 删掉就再也算不出回访率。只清理长期不活跃的：一年没来过的访客，
 * 留着他的首访时间对任何分析都没有意义了。
 *
 * 【分批删】一次 deleteMany 几十万行会长时间持锁，在这台机器上足以让前台超时。
 * 每批 5000 行、最多 20 批，删不完就下一轮接着删——反正每天都跑。
 */

const PAGE_VIEW_RETENTION_DAYS = 90
const VISITOR_INACTIVE_DAYS = 365
// 营销邮件：事件明细 90 天、发送记录 2 年（/privacy 四、保存多久；docs/营销推广-设计.md 第 12 节第 9 条）
const MKT_EVENT_RETENTION_DAYS = 90
const MKT_MESSAGE_RETENTION_DAYS = 730
// 短信接码（docs/短信接码-设计.md §10.4、§6.6 第 32 条）：短信的 code / text 30 天后清空（写 purgedAt，行与收码时间留着对账和售后用）、
// 尝试的上游原文 raw 90 天后清空、事件流水 180 天后删除；订单与尝试的结构化字段长期保留；**余额流水与预扣永不清理**（资金凭证）。
// 保留期要与 /privacy 对买家的说法一致（隐私政策那一页的改动在 S2b，与号码页一起上线；上线前先改那一页）
const SMS_TEXT_RETENTION_DAYS = 30
const SMS_RAW_RETENTION_DAYS = 90
const SMS_EVENT_RETENTION_DAYS = 180
const BATCH = 5000
const MAX_BATCHES = 20

export async function GET(request: NextRequest) {
  try {
    const auth = assertCronAuth(request)
    if (!auth.ok) return error(auth.message, auth.status)

    const now = Date.now()
    const pvCutoff = new Date(now - PAGE_VIEW_RETENTION_DAYS * 86400000)
    const visitorCutoff = new Date(now - VISITOR_INACTIVE_DAYS * 86400000)

    let pageViews = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      // Prisma 的 deleteMany 不支持 limit，用一次 id 查询圈定这一批再删
      const batch = await prisma.pageView.findMany({
        where: { createdAt: { lt: pvCutoff } },
        select: { id: true },
        take: BATCH,
      })
      if (!batch.length) break
      const { count } = await prisma.pageView.deleteMany({
        where: { id: { in: batch.map((r) => r.id) } },
      })
      pageViews += count
      if (batch.length < BATCH) break
    }

    /*
     * visitors 同样分批。上面刚写了「一次删几十万行会长时间持锁」，
     * 这里再来一发不分批的 deleteMany 就是自相矛盾——
     * 一年不活跃的访客积累起来同样可能是几十万行。
     * 主键是 key（字符串）不是自增 id，除此之外和上面对称。
     */
    let visitors = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const batch = await prisma.visitor.findMany({
        where: { lastSeen: { lt: visitorCutoff } },
        select: { key: true },
        take: BATCH,
      })
      if (!batch.length) break
      const { count } = await prisma.visitor.deleteMany({
        where: { key: { in: batch.map((r) => r.key) } },
      })
      visitors += count
      if (batch.length < BATCH) break
    }

    /*
     * 营销邮件的保留期（与 /privacy「四、保存多久」逐字对应，改之前先改那一页）：
     *   · marketing_events（每次打开/点击的时间与 UA）90 天
     *   · marketing_messages（发给了谁、是否送达、首次打开/点击时间）2 年
     * 【绝不删】marketing_consent_logs（告知/退订留痕）与 marketing_suppressions（不再发送名单）：
     * 那是「依法处理、不再打扰」的证据，隐私政策写明长期保存；删掉抑制名单还会让退过信、投诉过的地址重新收到邮件。
     *
     * 删发送记录意味着两年前那封信里的退订链接会失效 —— 退订页对无效链接会引导去个人中心退订。
     * 两步都按主键分批，同上面的理由；按 created_at 圈定（保留期以天计，差几个小时的时区无所谓）。
     */
    const mktEventCutoff = new Date(now - MKT_EVENT_RETENTION_DAYS * 86400000)
    const mktMessageCutoff = new Date(now - MKT_MESSAGE_RETENTION_DAYS * 86400000)
    let marketingEvents = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const batch = await prisma.marketingEvent.findMany({
        where: { createdAt: { lt: mktEventCutoff } },
        select: { id: true },
        take: BATCH,
      })
      if (!batch.length) break
      const { count } = await prisma.marketingEvent.deleteMany({ where: { id: { in: batch.map((r) => r.id) } } })
      marketingEvents += count
      if (batch.length < BATCH) break
    }

    let marketingMessages = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const batch = await prisma.marketingMessage.findMany({
        where: { createdAt: { lt: mktMessageCutoff } },
        select: { id: true },
        take: BATCH,
      })
      if (!batch.length) break
      const { count } = await prisma.marketingMessage.deleteMany({ where: { id: { in: batch.map((r) => r.id) } } })
      marketingMessages += count
      if (batch.length < BATCH) break
    }

    // 短信接码：分批（按主键圈定每一批），同上面的理由
    const smsTextCutoff = new Date(now - SMS_TEXT_RETENTION_DAYS * 86400000)
    const smsRawCutoff = new Date(now - SMS_RAW_RETENTION_DAYS * 86400000)
    const smsEventCutoff = new Date(now - SMS_EVENT_RETENTION_DAYS * 86400000)
    let smsPurged = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const batch = await prisma.smsMessage.findMany({ where: { receivedAt: { lt: smsTextCutoff }, purgedAt: null }, select: { id: true }, take: BATCH })
      if (!batch.length) break
      const { count } = await prisma.smsMessage.updateMany({ where: { id: { in: batch.map((r) => r.id) } }, data: { code: null, text: null, purgedAt: new Date() } })
      smsPurged += count
      if (batch.length < BATCH) break
    }
    let smsRawCleared = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const batch = await prisma.smsAttempt.findMany({ where: { createdAt: { lt: smsRawCutoff }, raw: { not: null } }, select: { id: true }, take: BATCH })
      if (!batch.length) break
      const { count } = await prisma.smsAttempt.updateMany({ where: { id: { in: batch.map((r) => r.id) } }, data: { raw: null } })
      smsRawCleared += count
      if (batch.length < BATCH) break
    }
    let smsEvents = 0
    for (let i = 0; i < MAX_BATCHES; i++) {
      const batch = await prisma.smsEvent.findMany({ where: { createdAt: { lt: smsEventCutoff } }, select: { id: true }, take: BATCH })
      if (!batch.length) break
      const { count } = await prisma.smsEvent.deleteMany({ where: { id: { in: batch.map((r) => r.id) } } })
      smsEvents += count
      if (batch.length < BATCH) break
    }

    return success({ pageViews, visitors, marketingEvents, marketingMessages, smsPurged, smsRawCleared, smsEvents, pvCutoff, visitorCutoff })
  } catch (err) {
    console.error('Cleanup cron error:', err)
    return error('清理失败')
  }
}
