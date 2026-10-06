import { prisma } from '@/lib/db'
import { siteOrigin } from '@/lib/news/format'
import { absUrl } from '@/lib/news/seo'
import { indexNowConfigured, submitUrls } from '@/lib/indexnow'
import { landingForProduct } from '@/lib/product-intro'
import { landingPath } from '@/lib/landing/registry'

/**
 * 后台保存商品之后（docs/SEO-重构/SEO-重构设计.md §6.2 lastmod 第 3 条、§6.4 第 3 条，批 2 的 G 包）：
 *  1. 记下 Setting `product_edited_<id>` = 当前时间：sitemap 商品段的 lastmod 只认它（Product.updatedAt 每笔付款都会刷新，是噪声）；
 *  2. 把 /products/<id> 与它的主落地页推给 IndexNow（Bing、Yandex 等；Google 不支持这个协议）。
 *
 * 【只挂在后台保存上，成交不触发】调用方只有 api/admin/products 的新建与更新。
 * 【fire-and-forget】任何异常就地吞掉只留日志，绝不影响「保存商品」本身的结果；submitUrls 自带 8 秒超时。
 * 【推哪些】保存后在售，或这次是从在售改成下架（下架的地址推过去让 Bing 尽快读到 404）；一直下架的商品改了也不推。
 * Setting.key 是 VarChar(50)：`product_edited_` + 数字 id 远不到上限。不改表结构。
 */
export async function onProductSaved(productId: number, opts: { wasListed: boolean }): Promise<void> {
  try {
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, status: true, category: { select: { name: true } } } })
    if (!p) return
    const key = `product_edited_${p.id}`
    const now = new Date().toISOString()
    await prisma.setting.upsert({ where: { key }, create: { key, value: now }, update: { value: now } })
    if (!indexNowConfigured() || (p.status !== 1 && !opts.wasListed)) return
    const urls = [absUrl(`/products/${p.id}`)]
    const home = landingForProduct({ name: p.name, categoryName: p.category?.name ?? null })
    if (home && home.direct) urls.push(absUrl(landingPath(home.def.slug)))
    await submitUrls(urls, siteOrigin())
  } catch (e) {
    console.warn('[seo] onProductSaved', productId, e instanceof Error ? e.message : String(e))
  }
}
