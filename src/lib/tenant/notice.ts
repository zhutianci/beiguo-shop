/**
 * 渠道站内通知 + 企业微信推送（设计 11.4、5.8）。唯一写入口。
 *
 * 【写库】TenantNotice 一行；dedupeKey 唯一 = 同一事件只通知一次。用 createMany({ skipDuplicates })（MySQL 的 INSERT IGNORE）
 * 而不是 create + 捕获 P2002：调用方多在业务事务里（计提、售后处理），Prisma 交互式事务里一条语句报错之后事务能否继续
 * 在 MySQL 上没有验证过（设计 17），不能拿业务事务去赌。
 *
 * 【推送在提交之后】拿不到事务的提交钩子，所以写库之后异步轮询「这一行在库里看得见了没有」（按随机 publicNo 查，
 * 事务外的连接只能看到已提交的数据）：看见了才推；业务事务回滚了就永远看不见，放弃推送——不会推出一条不存在的通知。
 * 推送失败重试 3 次，成功写 pushedAt。整个推送过程不阻塞、不抛。
 *
 * 【载荷】只放标题、正文、公开编号、事件类型与后台链接；**正文里的邮箱一律替换掉**（webhook 地址一旦泄露就是第三方可读，S16）。
 * 卡密不应该出现在任何通知里，调用方负责不传。
 * 【偏好】Tenant.noticePrefs[kind] === false 时不推企业微信（站内通知照写）。
 * 【主站】tenantId === 1 直接返回（平台没有渠道通知）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { openText } from './crypto'
import { newPublicNo } from './public-no'
import type { TenantNoticeKind } from './types'

export const WECOM_WEBHOOK_PREFIX = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key='

export interface TenantNoticeInput {
  tenantId: number
  kind: TenantNoticeKind
  title: string
  body?: string
  refType?: 'order' | 'statement' | 'listing' | 'after_sale'
  refKey?: string
  dedupeKey?: string
}

const KIND_LABEL: Record<TenantNoticeKind, string> = {
  ORDER_PAID: '订单已支付',
  BUYER_MESSAGE: '买家留言',
  AFTER_SALE_RESULT: '售后处理结果',
  ORDER_REFUNDED: '平台退款',
  STATEMENT: '结算单',
  PAYOUT: '打款',
  SUPPLY_CHANGED: '进货价调整',
  PLATFORM_LISTING: '平台调价 / 新授权',
  AUTO_DELISTED: '商品自动下架',
  PRODUCT_WITHDRAWN: '商品停止供货',
  TENANT_STATUS: '店铺状态变更',
  NEGATIVE_BALANCE: '余额为负',
}

// ---------------------------------------------------------------------------
// 推送通道：默认 fetch；itest 可替换成计数桩（W0-7：同一 dedupeKey 两次只推一次）
// ---------------------------------------------------------------------------
export type NoticeTransport = (url: string, payload: unknown) => Promise<boolean>

const fetchTransport: NoticeTransport = async (url, payload) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  })
  const text = await res.text().catch(() => '')
  let errcode: number | undefined
  try {
    errcode = JSON.parse(text)?.errcode
  } catch {
    /* 非 JSON */
  }
  return res.ok && (errcode === undefined || errcode === 0)
}

let transport: NoticeTransport = fetchTransport
/** 仅供 scripts/itest-tenant：替换推送通道（null 恢复默认） */
export function setTenantNoticeTransportForTest(t: NoticeTransport | null): void {
  transport = t ?? fetchTransport
}

// 等提交：先短后长，总计约 22 秒；推送重试：3 次
const VISIBLE_POLL_MS = [200, 800, 3000, 8000, 10000]
const PUSH_RETRY_MS = [0, 2000, 8000]
const pending = new Set<Promise<void>>()

/** 仅供测试：等所有在途推送结束 */
export async function waitTenantNoticePushesForTest(): Promise<void> {
  while (pending.size) await Promise.allSettled(Array.from(pending))
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function clip(s: string | null | undefined, max: number): string | null {
  if (s == null) return null
  const t = String(s)
  return t.length > max ? t.slice(0, max) : t
}

/** 推送前的脱敏：邮箱替换掉（通知正文可能由调用方拼了买家信息） */
export function scrubForPush(s: string): string {
  return s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[邮箱已隐藏]')
}

function partnerPath(refType: string | null, refKey: string | null): string {
  const k = refKey ? encodeURIComponent(refKey) : ''
  switch (refType) {
    case 'order':
      return k ? `/partner/orders/${k}` : '/partner/orders'
    case 'statement':
      return k ? `/partner/finance/statements/${k}` : '/partner/finance/statements'
    case 'listing':
      return '/partner/products'
    case 'after_sale':
      return '/partner/after-sales'
    default:
      return '/partner/notices'
  }
}

async function pushWhenCommitted(publicNo: string, alreadyCommitted: boolean): Promise<void> {
  try {
    let row: { tenantId: number; kind: string; title: string; body: string | null; refType: string | null; refKey: string | null } | null = null
    for (const wait of alreadyCommitted ? [0] : VISIBLE_POLL_MS) {
      if (wait) await sleep(wait)
      row = await prisma.tenantNotice.findUnique({
        where: { publicNo },
        select: { tenantId: true, kind: true, title: true, body: true, refType: true, refKey: true },
      })
      if (row) break
    }
    if (!row) return // 业务事务回滚了：这条通知不存在，不推

    const t = await prisma.tenant.findUnique({
      where: { id: row.tenantId },
      select: { wecomWebhookEnc: true, noticePrefs: true, origin: true },
    })
    if (!t?.wecomWebhookEnc) return
    const prefs = t.noticePrefs
    if (prefs && typeof prefs === 'object' && !Array.isArray(prefs) && (prefs as Record<string, unknown>)[row.kind] === false) return

    let url: string
    try {
      url = openText('webhook', t.wecomWebhookEnc)
    } catch {
      console.error(`[tenant-notice] 租户 ${row.tenantId} 的 webhook 解密失败（TENANT_DATA_KEY 未配置或与加密时不符？），跳过推送`)
      return
    }
    if (!url.startsWith(WECOM_WEBHOOK_PREFIX)) {
      console.error(`[tenant-notice] 租户 ${row.tenantId} 的 webhook 不是企业微信地址，跳过推送`)
      return
    }

    const label = KIND_LABEL[row.kind as TenantNoticeKind] ?? row.kind
    const link = `${(t.origin || '').replace(/\/+$/, '')}${partnerPath(row.refType, row.refKey)}`
    const lines = [`## ${scrubForPush(row.title)}`, `**类型**：${label}`]
    if (row.refKey) lines.push(`**编号**：${scrubForPush(row.refKey)}`)
    if (row.body) lines.push(scrubForPush(row.body))
    if (t.origin) lines.push(`[前往渠道后台](${link})`)
    const payload = { msgtype: 'markdown', markdown: { content: lines.join('\n') } }

    for (const wait of PUSH_RETRY_MS) {
      if (wait) await sleep(wait)
      let ok = false
      try {
        ok = await transport(url, payload)
      } catch (e) {
        console.error('[tenant-notice] 推送异常', (e as Error)?.message || e)
      }
      if (ok) {
        await prisma.tenantNotice.updateMany({ where: { publicNo }, data: { pushedAt: new Date() } })
        return
      }
    }
    console.error(`[tenant-notice] 通知 ${publicNo} 推送 3 次均失败`)
  } catch (e) {
    console.error('[tenant-notice] 推送流程异常', (e as Error)?.message || e)
  }
}

/**
 * 写一条渠道通知；提交后异步推企业微信。
 *  · tx 非空：与业务同事务写入（事务回滚则通知也不存在、也不会被推送）。写库异常原样抛给调用方。
 *  · tx 为空：独立写入；写库异常只记日志、不抛（通知不是业务的一部分）。
 * 同一 dedupeKey 第二次调用什么都不做（不重复写、不重复推）。
 */
export async function emitTenantNotice(tx: Prisma.TransactionClient | null, n: TenantNoticeInput): Promise<void> {
  if (n.tenantId === 1) return
  const run = async () => {
    if (!Number.isInteger(n.tenantId) || n.tenantId < 2) throw new Error(`[tenant-notice] tenantId 非法：${n.tenantId}`)
    const db = tx ?? prisma
    const dedupeKey = clip(n.dedupeKey, 64)
    for (let attempt = 0; attempt < 3; attempt++) {
      const publicNo = newPublicNo()
      const r = await db.tenantNotice.createMany({
        data: [
          {
            publicNo,
            tenantId: n.tenantId,
            kind: n.kind,
            title: clip(n.title, 120) || KIND_LABEL[n.kind] || n.kind,
            body: clip(n.body, 500),
            refType: n.refType ?? null,
            refKey: clip(n.refKey, 40),
            dedupeKey,
          },
        ],
        skipDuplicates: true,
      })
      if (r.count === 1) {
        const p = pushWhenCommitted(publicNo, tx === null)
        pending.add(p)
        p.finally(() => pending.delete(p))
        return
      }
      // count=0：dedupeKey 已存在（已发过，正常结束），或随机编号撞了（换一个再试）
      if (dedupeKey && (await db.tenantNotice.count({ where: { dedupeKey } })) > 0) return
    }
    throw new Error('[tenant-notice] 写入通知失败（编号连续冲突）')
  }
  if (tx) return run()
  try {
    await run()
  } catch (e) {
    console.error('[tenant-notice] 写入通知失败', (e as Error)?.message || e)
  }
}
