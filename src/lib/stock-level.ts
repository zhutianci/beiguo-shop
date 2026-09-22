/**
 * 库存的对外表述。
 *
 * 【为什么前台不显示具体数量】两个原因，都不是审美问题：
 *   1. 同行盯着这个数就能算出你的备货节奏和上游放货量——和 referrerBasePrice 泄露是同一类问题。
 *   2. 对买家没用，还会造成误判：「余量 3」看着像快没了，其实这类商品随时补货。
 * 所以只给档位，不给数字。
 *
 * 【档位口径】-1 是「无限库存」的约定（模型里就这么定的，别改）：
 *   -1      不限量      走接码/人工交付的商品，本来就没有卡密池
 *    0      补货中      不能下单
 *    1      即将售罄
 *    2-5    少量
 *    6-10   充足
 *   11+     大量
 *
 * 【这个函数只管显示】能不能下单由服务端下单接口按真实库存判定
 * （api/orders/route.ts 里 `product.stock < quantity` 那一条），
 * 前台档位怎么显示都不影响那道校验，也**不要**拿这里的结果去做任何校验。
 */

export type StockTone = 'none' | 'low' | 'mid' | 'high' | 'unlimited'

export interface StockLevel {
  /** 给买家看的文案 */
  label: string
  /** 配色语义，交给调用方映射成具体颜色 */
  tone: StockTone
  /** 能不能买。等价于「不是 0」 */
  available: boolean
}

export function stockLevel(stock: number): StockLevel {
  if (stock === -1) return { label: '不限量', tone: 'unlimited', available: true }
  if (stock <= 0) return { label: '补货中', tone: 'none', available: false }
  if (stock === 1) return { label: '即将售罄', tone: 'low', available: true }
  if (stock <= 5) return { label: '少量', tone: 'low', available: true }
  if (stock <= 10) return { label: '充足', tone: 'mid', available: true }
  return { label: '大量', tone: 'high', available: true }
}

/** tone → Tailwind 类名。集中在这里，免得三个页面各调一套颜色 */
export const STOCK_TONE_CLASS: Record<StockTone, string> = {
  none: 'text-white/35 bg-white/5 border-white/10',
  low: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  mid: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  high: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  unlimited: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
}
