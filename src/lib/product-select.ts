/**
 * 公开商品接口的字段白名单。
 *
 * 【为什么必须是白名单而不是「排除几个字段」】
 * 2026-09-21 实测，`/api/products` 与 `/api/products/[id]` 用的是 Prisma 的
 * `include`，也就是**把整行吐给外网**。任何人 curl 一下就拿到：
 *
 *   curl https://bigolab.com/api/products/4
 *   → "price":"135", "referrerBasePrice":"132", "cardRedeemUrl":"https://hongyunai.pro/"
 *
 * 卖价 135、内推底价 132（毛利 3 元）、以及上游货源站，同时公开。
 * 另外还带着 apiSku、smsService、smsMaxPrice（接码通道与成本上限）和 cardUsage
 * （内部发货说明，正文里含上游域名和明文 IP:端口）。
 *
 * 黑名单写法在这里是错的：Product 模型以后每加一个字段，都会默认漏出去，
 * 而且没有任何报错。白名单反过来——新字段默认不出现，要出现必须有人明确加一行。
 *
 * 【这份清单是怎么定的】取前台三个消费方 interface 的并集，不是拍脑袋：
 *   home-client.tsx        id / name / description / price / originalPrice / features / stock / sales
 *   products-client.tsx    以上 + categoryId / deliveryType / category
 *   product-client.tsx     以上 + category
 * image 也留着：它本来就要出现在页面和 og:image 里，不敏感。
 * 加字段前先问一句「这个值同行看到会怎样」。
 */
export const PUBLIC_PRODUCT_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  description: true,
  price: true,
  originalPrice: true,
  features: true,
  stock: true,
  sales: true,
  deliveryType: true,
  image: true,
  category: { select: { id: true, name: true } },
} as const
