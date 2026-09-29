/**
 * 短信接码 · 只追加的事件流水 sms_events（docs/短信接码-设计.md §5.2、§10.5）。后台时间线与排障用，保留 180 天。
 *
 * detail 里只放 id、金额、状态、错误码这类结构化信息，**不放号码全文与短信内容**（§10.5：日志不打号码全文和短信内容），
 * 截断到列宽 1000。写事件失败不能挡业务：事务外的写一律吞错（只记日志）；事务里的写跟着事务走。
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../db'

type Db = Prisma.TransactionClient | PrismaClient

export type EvActor = 'SYSTEM' | 'BUYER' | 'ADMIN' | 'CRON'

export interface EvInput {
  smsOrderId: number
  attemptId?: number | null
  type: string
  actor?: EvActor
  actorId?: number | null
  detail?: string | Record<string, unknown> | null
}

function detailOf(d: EvInput['detail']): string | null {
  if (d == null) return null
  const s = typeof d === 'string' ? d : JSON.stringify(d)
  return s.length > 1000 ? `${s.slice(0, 999)}…` : s
}

/** 事务里写一条（跟着事务提交 / 回滚） */
export async function logEvent(db: Db, e: EvInput): Promise<void> {
  await db.smsEvent.create({
    data: {
      smsOrderId: e.smsOrderId,
      attemptId: e.attemptId ?? null,
      type: e.type.slice(0, 32),
      actor: e.actor ?? 'SYSTEM',
      actorId: e.actorId ?? null,
      detail: detailOf(e.detail),
      // 应用写的时刻（§5.1：比较大小的时间一律由应用写；REPLACING 卡住的恢复拿最近一次 REPLACE_REQ 的时刻判 60 秒）
      createdAt: new Date(),
    },
  })
}

/** 事务外写一条，失败只记日志（事件是排障用的，不能因为它让业务报错） */
export async function logEventQuiet(e: EvInput): Promise<void> {
  try {
    await logEvent(prisma, e)
  } catch (err) {
    console.error('[jiema] 写事件失败', e.smsOrderId, e.type, (err as Error)?.message)
  }
}
