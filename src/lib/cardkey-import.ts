/**
 * 卡密批量导入（docs/微信机器人-设计.md §9.3）：后台「卡密管理 → 导入」（POST /api/admin/cardkeys）与机器人补货页
 * （POST /api/bot/x/restock）共用这一份，从原后台路由里逐行抽出，行为不变：
 *   去首尾空白 → 跳空行 → 输入内去重 → 库内同商品同哈希跳过 → 加密 → createMany({ skipDuplicates: true })，
 *   返回 { total, created, skipped }（与原接口的响应字段、口径完全相同：created = 本次判定为新卡的张数）。
 *   另带 inserted = createMany 实际插入的行数——只给机器人补货判断「到底导进去几张」（并发导入同一张卡时 inserted 可能小于 created）。
 *
 * 【tx】传了 tx：全部读写走调用方事务，**函数里绝不调 syncAutoStock**——它走全局连接，会被本事务未提交的插入挡住，
 *  等满锁超时后失败（附录 B 第 6 条）；由调用方在提交之后再调。tx 为空（后台现有用法）时照旧在最后同步库存。
 * 【错误】业务性拒绝抛 CardImportError（message 就是原接口回给前端的那句原文，status 同原接口），其余异常原样抛。
 * 【不写审计】审计由调用方写（后台路由写 cardkey.import；补货页在自己的事务里写 bot.card.restock）。
 */
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from './db'
import { hasProvider } from './redeem/registry'
import { cardContentHash, cardKeyConfigured, encryptCardContent, syncAutoStock } from './cardkey'

/** 导入参数校验（原样搬自 POST /api/admin/cardkeys，报错文案不变） */
export const cardImportSchema = z.object({
  productId: z.number().int().positive(),
  content: z.string().min(1, '请粘贴卡密，每行一条'),
  batch: z.string().trim().max(40).optional().nullable(),
  remark: z.string().trim().max(255).optional().nullable(),
  // 本批进货成本（元/张）；不填按 0 记，保证历史口径一致
  cost: z.number().min(0, '成本不能为负').max(999999).optional(),
  // 本批专属兑换地址；留空则买家侧回落到 Product.cardRedeemUrl
  redeemUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), '兑换地址需以 http:// 或 https:// 开头')
    .optional()
    .nullable(),
  // 本批走站内兑换时的充值平台标识（lib/redeem/registry.ts 的 key）。
  // 留空 = 不走站内兑换，回落到 redeemUrl / 商品默认链接的跳转方式
  redeemProvider: z.string().trim().max(20).optional().nullable(),
})

export type CardImportInput = z.infer<typeof cardImportSchema>

export class CardImportError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'CardImportError'
    this.status = status
  }
}

export interface CardImportResult {
  /** 输入里有效（非空、去重后）的行数 */
  total: number
  /** 判定为新卡的张数（= total − skipped；原接口口径） */
  created: number
  /** 输入里与库内已有卡重复而跳过的张数 */
  skipped: number
  /** createMany 实际插入的行数 */
  inserted: number
}

/** 拆行 + 去空 + 输入内部去重（纯函数，导出给补货页数行数用） */
export function splitCardLines(content: string): { plain: string; hash: string }[] {
  const seen = new Set<string>()
  const items: { plain: string; hash: string }[] = []
  for (const line of content.split(/\r?\n/)) {
    const plain = line.trim()
    if (!plain) continue
    const hash = cardContentHash(plain)
    if (seen.has(hash)) continue
    seen.add(hash)
    items.push({ plain, hash })
  }
  return items
}

export async function importCardKeys(tx: Prisma.TransactionClient | null, input: CardImportInput): Promise<CardImportResult> {
  // 后台路由在解析请求之前已经先判过一次（原顺序不变）；这里是给其它调用方的自我保护
  if (!cardKeyConfigured()) throw new CardImportError('未配置 CARDKEY_SECRET，无法安全存储卡密', 500)
  const db = tx ?? prisma
  const { productId, content, batch, remark, cost, redeemUrl, redeemProvider } = input

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) throw new CardImportError('商品不存在')

  // 拆行 + 去空 + 输入内部去重
  const items = splitCardLines(content)
  if (items.length === 0) throw new CardImportError('没有有效卡密')

  // 跳过已存在
  const existing = await db.cardKey.findMany({
    where: { productId, contentHash: { in: items.map((i) => i.hash) } },
    select: { contentHash: true },
  })
  const existsSet = new Set(existing.map((e) => e.contentHash))
  const fresh = items.filter((i) => !existsSet.has(i.hash))

  // 成本按批录入，落库为定点小数；未填按 0（与历史卡回填口径一致）
  const batchCost = new Prisma.Decimal((cost ?? 0).toFixed(2))
  const batchRedeemUrl = redeemUrl?.trim() || null

  /*
   * 【必须校验平台存在】这个字符串会原样进数据库并决定兑换页去找哪个适配器。
   * 写进一个没有适配器的 key，整批卡密的兑换页会永远报「充值系统不存在」，
   * 而且要等买家投诉才会被发现。宁可在导入这一步就拒掉。
   */
  const batchProvider = redeemProvider?.trim() || null
  if (batchProvider && !hasProvider(batchProvider)) {
    throw new CardImportError('所选充值系统不存在，请刷新页面后重试')
  }

  let inserted = 0
  if (fresh.length > 0) {
    const res = await db.cardKey.createMany({
      data: fresh.map((i) => ({
        productId,
        content: encryptCardContent(i.plain),
        contentHash: i.hash,
        status: 'UNUSED',
        batch: batch || null,
        redeemProvider: batchProvider,
        remark: remark || null,
        cost: batchCost,
        redeemUrl: batchRedeemUrl,
      })),
      skipDuplicates: true,
    })
    inserted = res.count
  }

  // 传了 tx 时由调用方提交后再同步（见文件头）
  if (!tx) await syncAutoStock(productId)

  return { total: items.length, created: fresh.length, skipped: items.length - fresh.length, inserted }
}
