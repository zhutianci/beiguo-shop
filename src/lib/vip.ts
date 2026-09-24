/**
 * 会员等级 —— 纯函数部分（不连库，scripts/check-vip.ts 直接断言）。
 *
 * 【等级怎么来】按「已付款订单的商品货款（Order.amount，不含开票税费）累计」自动定级；
 * 管理员在后台用户详情里设的 vipLevel 可以把人往上调（取两者较高者），不会把人往下调。
 * 用货款而不是实付：Order.amount 是全站唯一的计费基准（见 schema 注释），
 * 税费是代收代付性质，把它算进消费等于「开票的人升级更快」，说不通。
 *
 * 【权益文案只写做得到的】交接文档反复记录过「页面承诺与代码行为对不上」的事故。
 * 默认档位的权益只列全站现有、代码里真实存在的能力；更高档位默认只有等级标识，
 * 站长在后台「系统设置 → 会员等级」里自行填写真正要兑现的权益。
 */
import { z } from 'zod'

export interface VipTier {
  /** 档位序号，0 起，按门槛升序自动编号 */
  level: number
  name: string
  /** 累计消费门槛（元，含两位小数） */
  minSpend: number
  /** 权益说明，逐条展示 */
  benefits: string[]
}

export const DEFAULT_VIP_TIERS: VipTier[] = [
  {
    level: 0,
    name: '普通会员',
    minSpend: 0,
    benefits: [
      '支付宝付款，自动发货商品付款后即时发卡',
      '订单内与客服在线沟通',
      '可随单开具增值税发票（标价不含税，开票另付 6% 税费）',
      '推荐有奖：分享专属链接，好友下单完成后返现到余额',
    ],
  },
  { level: 1, name: '白银会员', minSpend: 500, benefits: ['享普通会员全部权益', '白银会员等级标识'] },
  { level: 2, name: '黄金会员', minSpend: 2000, benefits: ['享普通会员全部权益', '黄金会员等级标识'] },
  { level: 3, name: '钻石会员', minSpend: 5000, benefits: ['享普通会员全部权益', '钻石会员等级标识'] },
]

export const MAX_TIERS = 8

export const vipTiersSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1, '请填写等级名称').max(20, '等级名称最多 20 字'),
      minSpend: z.number().min(0, '门槛不能为负数').max(10_000_000, '门槛过大'),
      benefits: z.array(z.string().trim().min(1).max(100, '每条权益最多 100 字')).max(12, '每个等级最多 12 条权益'),
    })
  )
  .min(1, '至少保留一个等级')
  .max(MAX_TIERS, `最多 ${MAX_TIERS} 个等级`)
  .superRefine((arr, ctx) => {
    const seen = new Set<number>()
    arr.forEach((t, i) => {
      const c = Math.round(t.minSpend * 100)
      if (seen.has(c)) ctx.addIssue({ code: 'custom', path: [i, 'minSpend'], message: '两个等级的门槛不能相同' })
      seen.add(c)
    })
    if (!arr.some((t) => Math.round(t.minSpend * 100) === 0)) {
      ctx.addIssue({ code: 'custom', path: [0, 'minSpend'], message: '必须有一个门槛为 0 的基础等级' })
    }
  })

/**
 * 把任意输入（库里存的 JSON、后台提交的数组）整理成可用的档位表：
 * 按门槛升序、重新编号、门槛归一到分。坏数据回落默认表 —— 会员页不能因为一行配置坏了就 500。
 */
export function normalizeTiers(raw: unknown): VipTier[] {
  const parsed = vipTiersSchema.safeParse(raw)
  if (!parsed.success) return DEFAULT_VIP_TIERS.map((t) => ({ ...t, benefits: [...t.benefits] }))
  return parsed.data
    .map((t) => ({
      name: t.name,
      minSpend: Math.round(t.minSpend * 100) / 100,
      benefits: t.benefits.filter(Boolean),
    }))
    .sort((a, b) => a.minSpend - b.minSpend)
    .map((t, i) => ({ ...t, level: i }))
}

export interface VipStatus {
  current: VipTier
  next: VipTier | null
  /** 累计消费（元） */
  spent: number
  /** 距下一级还差多少（元）；已是最高级为 0 */
  remaining: number
  /** 当前档到下一档的进度 0~100（整数）；最高级为 100 */
  progress: number
  /** true = 当前等级来自管理员手工调整（高于按消费算出来的等级） */
  byAdmin: boolean
}

/** 按累计消费与后台手工等级算出当前档位。全部按分比较，避免 499.99 + 0.01 这类边界误判 */
export function vipStatusOf(tiersIn: VipTier[], spent: number, adminLevel = 0): VipStatus {
  const tiers = tiersIn.length ? tiersIn : DEFAULT_VIP_TIERS
  const spentC = Math.max(0, Math.round((Number.isFinite(spent) ? spent : 0) * 100))
  let bySpend = 0
  tiers.forEach((t, i) => {
    if (spentC >= Math.round(t.minSpend * 100)) bySpend = i
  })
  const admin = Math.max(0, Math.min(Math.trunc(Number(adminLevel) || 0), tiers.length - 1))
  const idx = Math.max(bySpend, admin)
  const current = tiers[idx]
  const next = idx + 1 < tiers.length ? tiers[idx + 1] : null
  let progress = 100
  let remaining = 0
  if (next) {
    const lo = Math.round(current.minSpend * 100)
    const hi = Math.round(next.minSpend * 100)
    remaining = Math.max(0, hi - spentC) / 100
    progress = hi > lo ? Math.max(0, Math.min(100, Math.floor(((spentC - lo) * 100) / (hi - lo)))) : 0
  }
  return { current, next, spent: spentC / 100, remaining, progress, byAdmin: admin > bySpend }
}
