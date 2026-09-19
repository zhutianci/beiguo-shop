/**
 * 薄新闻页的索引策略。
 *
 * 【问题】截至 2026-09，已发布事件里约三分之二只有一段 147 字左右的摘要，
 * 没有全文层（detail）。这些页的共同特征是：AI 自动撰写 + 每小时批量发布 +
 * 单页正文极短。sitemap 里 771 条 URL 有 749 条是新闻页——
 * **搜索引擎看到的这个站，97% 是这种页面。**
 *
 * 【为什么这不只是「没流量」那么简单】Google 2024 年把 scaled content abuse
 * 写进垃圾内容政策，判定看的不是「是不是 AI 写的」，而是「是不是为了排名批量生产、
 * 且对用户没有增量价值」。上面那组特征正好落在描述里。
 * 关键在于**这类判定是站点级的**：真被判定，跟着一起掉下去的是商品页和落地页——
 * 也就是这个站唯一赚钱的部分。为了保住 749 个几乎不带流量的页面而赌上 15 个商品页，
 * 账怎么算都不划算。
 *
 * 【处置】没有全文层的事件加 noindex，但**保留 follow**：
 *   · noindex —— 不进索引，不再参与「这个站是不是批量生产内容」的判断；
 *   · follow  —— 页面上指向商品页与其他事件的链接仍然被跟随，站内权重不断流；
 *   · 页面本身照常可访问，站内浏览、分享、微信卡片一切不变。
 * 补齐了全文层的事件会自动恢复可索引（这个判断是每次请求实时算的，不需要回填脚本）。
 *
 * 【开关】NEWS_THIN_NOINDEX=0 可以整体关掉，恢复成全部可索引。
 * 默认开启：这是一个站点级风险的缓解措施，默认值应该站在保守一侧。
 * 注意它是服务端环境变量（不是 NEXT_PUBLIC_），改完要重启容器才生效，
 * 而且必须在 docker-compose.yml 的 app 服务 environment: 里列出来——
 * --env-file 只做 compose 文件里的变量替换，不会自动注入容器（交接文档第十九节第 6 条）。
 */

/** 全文层至少要有这么多段，才算「这一页有实质内容」 */
const MIN_DETAIL_SECTIONS = 1

export function thinNoindexEnabled(): boolean {
  return (process.env.NEWS_THIN_NOINDEX || '1').trim() !== '0'
}

/**
 * 这一条事件是不是「薄页」。
 *
 * 判据只看全文层有没有写出来，不看摘要字数：摘要是 LLM 按 120–260 字的模板产出的，
 * 长度几乎恒定，拿它当质量阈值区分不出任何东西。全文层是「有没有人/模型
 * 真的为这条事件多写了 600–1200 字」的唯一硬证据。
 */
export function isThinEvent(detailSections: { heading: string; body: string }[]): boolean {
  return detailSections.length < MIN_DETAIL_SECTIONS
}

/** 该不该给这一页加 noindex */
export function shouldNoindexEvent(detailSections: { heading: string; body: string }[]): boolean {
  return thinNoindexEnabled() && isThinEvent(detailSections)
}
