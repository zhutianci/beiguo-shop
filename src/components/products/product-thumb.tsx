import { PRODUCT_GRADIENT } from './gradient'

/**
 * 商品缩略图。
 *
 * 【为什么要有兜底而不是留空】目前库里 20 个商品的 image 字段全是 null。
 * 列表模式如果遇到没图就留白，整列会参差不齐，比没有图更难看。
 * 兜底用「品牌渐变 + 商品名首字」——它在有图之前就是一个稳定的视觉锚点，
 * 而且同一个商品每次渲染出来的颜色是一样的（按 id 取模，不是随机）。
 *
 * 【为什么不用 next/image】这台机器只有 1.8G 内存，图片优化管线的开销
 * 不值得为列表里几十张小图付（同 gen-og-image.js 与站标的取舍）。
 * 宽高写死，避免图片加载时整行跳动。
 */
export function ProductThumb({
  id,
  name,
  image,
  size = 56,
  sizeClass,
  className = '',
}: {
  id: number
  name: string
  image?: string | null
  /** 固有尺寸。始终写进 width/height 属性用于防抖动（CLS），即使用 sizeClass 控制显示 */
  size?: number
  /** 给了就用 class 控制盒子大小（响应式用），不再写内联宽高 */
  sizeClass?: string
  className?: string
}) {
  const box = `${className} ${sizeClass || ''} shrink-0 overflow-hidden rounded-xl`
  if (image) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={`${box} bg-white/5 object-cover`}
        style={sizeClass ? undefined : { width: size, height: size }}
      />
    )
  }
  // 取第一个非空白字符：中文商品名取首字，英文名取首字母
  const glyph = (name.trim()[0] || '·').toUpperCase()
  return (
    <div
      aria-hidden="true"
      className={`${box} flex items-center justify-center bg-gradient-to-br ${PRODUCT_GRADIENT(id)} text-lg font-bold text-white/90`}
      style={sizeClass ? undefined : { width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {glyph}
    </div>
  )
}
