import { articleJsonLd, type ArticleJsonLdInput } from '@/lib/news/seo'

/**
 * 新闻详情页的结构化数据。**Server Component**，不要加 'use client'——
 * JSON-LD 必须出现在首屏 HTML 里，客户端注入的搜索引擎大概率抓不到。
 *
 * 类型是 Article 而不是 NewsArticle，这是法律定性决定的，不是 SEO 偏好：
 * 我们刻意不让内容落入《互联网新闻信息服务管理规定》第二条的「新闻信息」定义
 * （SKILL.md §1）。改这一处之前必须先读 SKILL.md §10。
 */
export function ArticleJsonLd(props: ArticleJsonLdInput) {
  const json = JSON.stringify(articleJsonLd(props))
  return (
    <script
      type="application/ld+json"
      // 摘要与标题来自 LLM，理论上可能含 "</script>"。转义 < 是唯一必要的一步——
      // 少了它就是一个可注入的 XSS 口子，而 JSON 里的 < 语义完全等价。
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  )
}
