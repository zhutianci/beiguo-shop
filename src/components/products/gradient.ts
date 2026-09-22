/**
 * 商品配色。按 id 取模，所以同一个商品在列表、卡片、缩略图里永远是同一个颜色，
 * 不会因为排序变了就换一身皮——这是「同一件东西看起来是同一件」的最低要求。
 *
 * 【为什么单独成文件】原来这份数组抄在 products-client、home-client、
 * product-client 三个文件里，改一处就会漂。
 */
const GRADIENTS = [
  'from-violet-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-600',
  'from-cyan-600 to-blue-600',
  'from-amber-600 to-orange-600',
] as const

export function PRODUCT_GRADIENT(id: number): string {
  // 取绝对值：id 理论上不会是负数，但真是负数时不能让它取到 undefined
  return GRADIENTS[Math.abs(id) % GRADIENTS.length]
}

/** 商品名里的档位标签。纯展示，认不出来就不显示，别硬塞一个「NEW」 */
export function productTag(name: string): string | null {
  const n = name.toLowerCase()
  if (n.includes('20x')) return 'ULTIMATE'
  if (n.includes('5x')) return '5X'
  if (n.includes('pro') && n.includes('chatgpt')) return 'PRO'
  if (n.includes('plus')) return 'PLUS'
  if (n.includes('max')) return 'MAX'
  if (n.includes('pro')) return 'PRO'
  return null
}

/** 交付方式的展示口径。三种交付差别很大，买家下单前必须看得见 */
export function deliveryBadge(t?: string): { label: string; cls: string } {
  if (t === 'AUTO') {
    return { label: '⚡ 自动发卡', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  }
  if (t === 'SMS') {
    return { label: '📱 短信接码', cls: 'bg-teal-500/15 text-teal-300 border-teal-500/30' }
  }
  return { label: '👤 人工交付', cls: 'bg-white/10 text-white/60 border-white/15' }
}
