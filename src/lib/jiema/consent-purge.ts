/**
 * 短信接码 · 到期同意记录的 IP 与浏览器标识清除（隐私政策「四、保存多久」：自下单之日起保存 3 年，到期清除；docs/短信接码-设计.md §8.6、§10.4）。
 *
 * api/cron/cleanup 每天调一次。只改 TERMS_AGREED 事件的 detail（ip / ua 清成 null），不删行：条款版本与同意时间（created_at）随订单记录保存。
 * 分批：每批按主键圈定 BATCH 行、逐行改（每天到期的只有三年前那一天的下单量，量很小）；清过的行不再带特征（stripConsentMeta 保证），
 * 下一批不会重复圈到。
 */
import { prisma } from '../db'
import { CONSENT_META_MARKERS, CONSENT_META_RETENTION_DAYS, TERMS_AGREED_EVENT, stripConsentMeta } from './consent'

const BATCH = 500
const MAX_BATCHES = 20

/** 清除 now 往前 CONSENT_META_RETENTION_DAYS 天之前的同意记录里的 IP 与浏览器标识；返回改了几行 */
export async function purgeExpiredConsentMeta(now: number = Date.now()): Promise<number> {
  const cutoff = new Date(now - CONSENT_META_RETENTION_DAYS * 86400000)
  let n = 0
  for (let i = 0; i < MAX_BATCHES; i++) {
    const rows = await prisma.smsEvent.findMany({
      where: { type: TERMS_AGREED_EVENT, createdAt: { lt: cutoff }, OR: CONSENT_META_MARKERS.map((m) => ({ detail: { contains: m } })) },
      select: { id: true, detail: true },
      orderBy: { id: 'asc' },
      take: BATCH,
    })
    if (!rows.length) break
    for (const r of rows) await prisma.smsEvent.update({ where: { id: r.id }, data: { detail: stripConsentMeta(r.detail) } })
    n += rows.length
    if (rows.length < BATCH) break
  }
  return n
}
