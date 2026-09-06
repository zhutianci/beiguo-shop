/**
 * 默认信源清单。
 *
 * 可达性全部在 2026-09-04 从阿里云北京 ECS 实测过（见 SKILL.md §2.2）。
 * 新增信源前必须先实测，不要凭印象加：
 *   curl -sL -o /dev/null -w "%{http_code} %{time_total}s" -m 12 -A "Mozilla/5.0 (compatible; BigoLabBot/1.0)" <URL>
 *
 * viaRelay=true 的源境内直连不通，需要经 Cloudflare Worker 中继（NEWS_RELAY_URL）。
 */

export interface SeedSource {
  key: string
  name: string
  feedUrl: string
  homepage?: string
  kind?: 'RSS' | 'ATOM' | 'JSON' | 'HN' | 'GITHUB' | 'X'
  lang?: 'zh' | 'en'
  tier: 1 | 2 | 3
  role?: 'feed' | 'signal' | 'both'
  weight?: number
  viaRelay?: boolean
  enabled?: boolean
}

export const SEED_SOURCES: SeedSource[] = [
  // ---------- 中文 · 专业媒体（境内直连，实测均 200） ----------
  { key: 'jiqizhixin', name: '机器之心', feedUrl: 'https://www.jiqizhixin.com/rss', homepage: 'https://www.jiqizhixin.com', lang: 'zh', tier: 2 },
  { key: 'qbitai', name: '量子位', feedUrl: 'https://www.qbitai.com/feed', homepage: 'https://www.qbitai.com', lang: 'zh', tier: 2 },
  { key: 'infoq-cn', name: 'InfoQ 中文', feedUrl: 'https://www.infoq.cn/feed', homepage: 'https://www.infoq.cn', lang: 'zh', tier: 2 },
  { key: '36kr', name: '36氪', feedUrl: 'https://36kr.com/feed', homepage: 'https://36kr.com', lang: 'zh', tier: 2, weight: 0.9 },
  { key: 'aibase', name: 'AIbase', feedUrl: 'https://www.aibase.com/zh/news', homepage: 'https://www.aibase.com/zh', lang: 'zh', tier: 2, weight: 0.8 },
  { key: 'sspai', name: '少数派', feedUrl: 'https://sspai.com/feed', homepage: 'https://sspai.com', lang: 'zh', tier: 3, weight: 0.7 },
  { key: 'oschina', name: '开源中国', feedUrl: 'https://www.oschina.net/news/rss', homepage: 'https://www.oschina.net', lang: 'zh', tier: 3, weight: 0.7 },

  // ---------- 中文 · 一手官方 ----------
  { key: 'qwen', name: '通义千问官方博客', feedUrl: 'https://qwen.ai/blog', homepage: 'https://qwen.ai', lang: 'zh', tier: 1, weight: 1.5 },

  // ---------- 英文 · 一手官方（境内直连可达） ----------
  { key: 'openai', name: 'OpenAI 官方博客', feedUrl: 'https://openai.com/news/rss.xml', homepage: 'https://openai.com/news', lang: 'en', tier: 1, weight: 1.5 },
  { key: 'anthropic', name: 'Anthropic 官方', feedUrl: 'https://www.anthropic.com/news', homepage: 'https://www.anthropic.com/news', lang: 'en', tier: 1, weight: 1.5 },
  { key: 'msr', name: '微软研究院', feedUrl: 'https://www.microsoft.com/en-us/research/feed/', homepage: 'https://www.microsoft.com/en-us/research/', lang: 'en', tier: 1, weight: 1.2 },
  { key: 'arxiv-ai', name: 'arXiv cs.AI', feedUrl: 'https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=25', homepage: 'https://arxiv.org/list/cs.AI/recent', kind: 'ATOM', lang: 'en', tier: 1, weight: 1.1 },

  // ---------- 英文 · 专业媒体 ----------
  { key: 'techcrunch', name: 'TechCrunch', feedUrl: 'https://techcrunch.com/feed/', homepage: 'https://techcrunch.com', lang: 'en', tier: 2 },
  { key: 'verge', name: 'The Verge', feedUrl: 'https://www.theverge.com/rss/index.xml', homepage: 'https://www.theverge.com', kind: 'ATOM', lang: 'en', tier: 2 },
  { key: 'arstechnica', name: 'Ars Technica', feedUrl: 'https://feeds.arstechnica.com/arstechnica/index', homepage: 'https://arstechnica.com', lang: 'en', tier: 2 },
  { key: 'mit-tr', name: 'MIT Technology Review', feedUrl: 'https://www.technologyreview.com/feed/', homepage: 'https://www.technologyreview.com', lang: 'en', tier: 2 },

  // ---------- 英文 · 从业者与社区 ----------
  { key: 'simonw', name: 'Simon Willison', feedUrl: 'https://simonwillison.net/atom/everything/', homepage: 'https://simonwillison.net', kind: 'ATOM', lang: 'en', tier: 3, weight: 0.9 },
  // HN 只做热度信号，不产时间轴条目，否则时间轴会被英文技术贴稀释
  { key: 'hn', name: 'Hacker News', feedUrl: 'https://hnrss.org/frontpage?points=100', homepage: 'https://news.ycombinator.com', kind: 'HN', lang: 'en', tier: 3, role: 'signal', weight: 0.7 },

  // ---------- 需中继（境内直连不通，实测超时） ----------
  // X 上的研究者与官方账号是英文圈最快的一手信源，但大陆 ECS 连不上，
  // 必须经 Cloudflare Worker 中继。未配置 NEWS_RELAY_URL 时这些源保持禁用。
  { key: 'x-openai', name: 'X：OpenAI 官方', feedUrl: 'x:OpenAI', kind: 'X', lang: 'en', tier: 1, weight: 1.5, viaRelay: true, enabled: false },
  { key: 'x-anthropic', name: 'X：Anthropic 官方', feedUrl: 'x:AnthropicAI', kind: 'X', lang: 'en', tier: 1, weight: 1.5, viaRelay: true, enabled: false },
  { key: 'x-sama', name: 'X：Sam Altman（OpenAI CEO）', feedUrl: 'x:sama', kind: 'X', lang: 'en', tier: 1, weight: 1.4, viaRelay: true, enabled: false },
  { key: 'x-karpathy', name: 'X：Andrej Karpathy', feedUrl: 'x:karpathy', kind: 'X', lang: 'en', tier: 3, weight: 1.0, viaRelay: true, enabled: false },
  { key: 'huggingface', name: 'Hugging Face 每日论文', feedUrl: 'https://huggingface.co/api/daily_papers', kind: 'JSON', lang: 'en', tier: 1, weight: 1.2, viaRelay: true, enabled: false },
  { key: 'deepmind', name: 'Google DeepMind', feedUrl: 'https://deepmind.google/blog/rss.xml', lang: 'en', tier: 1, weight: 1.5, viaRelay: true, enabled: false },
  { key: 'reddit-llm', name: 'Reddit r/LocalLLaMA', feedUrl: 'https://www.reddit.com/r/LocalLLaMA/top.json?limit=25&t=day', kind: 'JSON', lang: 'en', tier: 3, role: 'signal', weight: 0.7, viaRelay: true, enabled: false },
]

/** 境外中继：把原始 URL 包装成 Worker 地址。未配置则原样返回。 */
export function relayUrl(rawUrl: string): string {
  const base = process.env.NEWS_RELAY_URL
  if (!base) return rawUrl
  return `${base.replace(/\/$/, '')}/fetch?url=${encodeURIComponent(rawUrl)}`
}

export function relayConfigured(): boolean {
  return !!process.env.NEWS_RELAY_URL
}
