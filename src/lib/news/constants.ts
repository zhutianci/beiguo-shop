/**
 * 【AI圈大事记】固定常量。改动前先读 .claude/skills/ai-news-pipeline/SKILL.md。
 * 分类一旦定下会影响 og 底图、URL、订阅，改动成本高。
 */

export const CATEGORIES = [
  { slug: 'ai-models', label: '模型', hint: '模型发布、版本更新、能力评测' },
  { slug: 'ai-products', label: '产品', hint: '产品功能上线、订阅与定价变化' },
  { slug: 'industry', label: '行业', hint: '融资并购、公司动态、生态合作' },
  { slug: 'paper', label: '论文', hint: '论文、技术方法、基准测试' },
  { slug: 'tool', label: '工具', hint: '开源项目、开发者工具与实践' },
  { slug: 'opinion', label: '观点', hint: '从业者公开观点与分析' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as CategorySlug[]

export function categoryLabel(slug: string | null | undefined): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label || '动态'
}

/**
 * 选题黑名单。这些看起来是 AI 垂类、实际属于《互联网新闻信息服务管理规定》第二条
 * 定义的「社会公共事务」，命中即拦，不进队列。判断从严：拿不准就拦。
 */
export const TOPIC_BLOCKLIST = [
  'AI 监管立法、AI 法案、算法备案、行政处罚、合规罚款',
  '芯片出口管制、实体清单、制裁、贸易战、技术封锁',
  '国家级 AI 战略、政府采购、军事与国防应用、情报用途',
  '大规模裁员、罢工、集体诉讼、劳资纠纷',
  '数据泄露的监管处罚、平台被约谈、应用被下架',
  '具体政治人物、地缘冲突、领土主权相关表述',
] as const

/** 标签白名单。允许 AI 自由造词会在三个月内长出几千个只有 1 条内容的话题页。 */
export const TAG_WHITELIST = [
  // 公司与机构
  'OpenAI', 'Anthropic', 'Google', 'DeepMind', 'Meta', 'Microsoft', '英伟达', '苹果', 'xAI',
  '阿里', '腾讯', '字节', '百度', '智谱', '月之暗面', 'DeepSeek', 'MiniMax', '零一万物',
  'Mistral', 'Hugging Face', 'Stability AI', 'Midjourney', 'Perplexity', 'Cursor',
  // 模型与产品
  'GPT', 'Claude', 'Gemini', 'Llama', 'Qwen', '文心', '豆包', 'Sora', 'DALL·E', 'Stable Diffusion',
  // 技术主题
  '大模型', '多模态', '推理模型', '智能体', 'RAG', '微调', '强化学习', '蒸馏', '量化',
  '上下文长度', '模型评测', '幻觉', '对齐', '安全', '开源模型', '端侧模型', 'MoE',
  '文生图', '文生视频', '语音', '代码生成', '数学能力', 'Agent 框架', 'MCP',
  // 产业
  '融资', '收购', '估值', 'IPO', '算力', '数据中心', 'GPU', '芯片', '定价', '开发者生态',
  'API', '订阅', '基准测试', '论文', '数据集', '编程助手', '企业应用',
] as const

/** 事件时间轴的可见状态 */
export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  UNLISTED: 'UNLISTED',
} as const

/** 作者署名固定，后台不可改。署真人名等于自证在做采编发布。 */
export const AUTHOR_NAME = '贝果科技 AI 资讯助手'

/** AI 标识文案（法定义务，6 处都要出现，见 SKILL.md §6） */
export const AI_BADGE = 'AI 摘要'
export const AI_NOTICE =
  '本条为 AI 依据下方公开信源自动整理生成的摘要，不构成转载，可能存在偏差，请以原文为准。'
export const AI_DISCLAIMER =
  '本页内容由 AI 自动聚合公开信源生成，仅供了解行业动态参考，不构成任何投资或决策建议。如需引用请以原文出处为准。'

/** 摘要与原文的重合率健康带：过低可能是编造，过高可能是抄袭 */
export const OVERLAP_MIN = 0.15
export const OVERLAP_MAX = 0.55
