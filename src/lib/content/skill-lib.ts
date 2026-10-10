/**
 * Skill 库目录（/skills，2026-10-10）的规则。纯函数，不 import prisma / next/*，scripts/check-content-policy.ts 直接测。
 *
 * 「Skill 库」不是新的内容类型：它就是一条 AI 应用（type=APP + app_specs），多挂一个主题标签 agent-skills。
 *   · 列表：/skills 只列挂了这个标签的应用；/apps 默认不列它们（两个目录各管各的）。
 *   · 详情：仍在 /apps/{id}-{slug}（地址不变、不用迁移），面包屑、标题、安装命令区块按 Skill 库的样子出。
 *   · app_specs 的字段复用：name = 库名，url = GitHub 仓库或项目主页，pricing = 授权与价格（如「开源免费（MIT）」），
 *     platforms = 适用的 Agent（如「Claude Code / claude.ai / Claude API / Codex」），trialNote = 一行安装命令或最短的上手方式。
 * 作者自荐（selfPromo）的 Skill 库不进 /skills：推广内容与普通分享隔离（设计 §9.1），留在 /apps/showcase。
 */

/** 主题标签的 slug（lib/content/tags.ts 的 DEFAULT_TAGS 里登记；没有 facet，不出现在提示词的筛选条里） */
export const SKILL_TAG_SLUG = 'agent-skills'
export const SKILLS_PATH = '/skills'
export const SKILLS_NAME = 'Skill 库'
export const SKILL_PAGE_SIZE = 24

export function isSkillLibrary(p: { type: string; selfPromo: boolean; tagSlugs: readonly string[] }): boolean {
  return p.type === 'APP' && !p.selfPromo && p.tagSlugs.includes(SKILL_TAG_SLUG)
}

// ─────────────────────────────── 按平台分组 ───────────────────────────────

export const SKILL_PLATFORMS = [
  { key: 'claude-code', label: 'Claude Code' },
  { key: 'claude-ai', label: 'claude.ai' },
  { key: 'codex', label: 'Codex' },
  { key: 'general', label: '通用' },
] as const
export type SkillPlatform = (typeof SKILL_PLATFORMS)[number]['key']

export function skillPlatformParam(v: string | string[] | undefined): SkillPlatform | null {
  const s = Array.isArray(v) ? v[0] : v
  return SKILL_PLATFORMS.find((p) => p.key === s)?.key ?? null
}

/** Claude、Codex 之外的 Agent：出现在 platforms 里就多算一家（凑够三家算「通用」） */
const OTHER_AGENTS = ['cursor', 'gemini', 'copilot', 'opencode', 'windsurf', 'cline', 'goose', 'amp', 'chatgpt', 'kiro', 'trae', 'roo', 'antigravity', 'qwen', 'openclaw', 'hermes', 'vs code', 'vscode', 'jetbrains', 'zed']
/** 明说了「哪家都能用」的写法 */
const GENERAL_RE = /通用|任意|任何|所有|多种|多个|跨平台|跨 ?agent|兼容 ?agent ?skills|agent ?skills ?(?:标准|规范)|agentskills\.io|any agent|universal/i

/**
 * 一个 Skill 库归到哪几个平台分组（一个库可以同时在几组里）。只看 platforms 这一行字，认不出来时才退到产品标签。
 *   · Claude Code：出现「Claude Code」
 *   · claude.ai：出现「claude.ai」「Claude 桌面版 / 网页版 / App / Cowork」，或单写一个「Claude」（「Claude API」不算，它不是给人点的界面）
 *   · Codex：出现「Codex」
 *   · 通用：明说通用 / 任意 Agent，或点名的 Agent 家数 ≥ 3（Claude 系算一家）；上面三组一个都没对上的也归这里，免得哪个筛选都找不到它
 */
export function skillPlatformsOf(platforms: string | null | undefined, productSlugs: readonly string[] = []): SkillPlatform[] {
  const text = (platforms ?? '').toLowerCase()
  const tokens = text.split(/[/,，、;；|+]/).map((s) => s.trim()).filter(Boolean)
  const out = new Set<SkillPlatform>()
  const families = new Set<string>()
  for (const t of tokens) {
    if (/claude/.test(t)) families.add('claude')
    if (/claude\s*code/.test(t)) out.add('claude-code')
    else if (/claude\.ai/.test(t) || /claude\s*(?:desktop|桌面|网页|app|应用|客户端|cowork)/.test(t) || t === 'claude') out.add('claude-ai')
    if (/codex/.test(t)) {
      out.add('codex')
      families.add('codex')
    }
    for (const a of OTHER_AGENTS) if (t.includes(a)) families.add(a === 'vscode' ? 'vs code' : a)
  }
  // platforms 没写出能认的平台：退到产品标签（claude → Claude Code：Skill 库绝大多数是装在 Claude Code 里的）
  if (!out.size) {
    if (productSlugs.includes('claude')) out.add('claude-code')
    if (productSlugs.includes('codex')) out.add('codex')
  }
  if (GENERAL_RE.test(text) || families.size >= 3 || !out.size) out.add('general')
  return SKILL_PLATFORMS.map((p) => p.key).filter((k) => out.has(k))
}

// ─────────────────────────────── 安装命令 ───────────────────────────────

/** 一看就是命令的开头（Claude Code 的斜杠命令、常见包管理器与 CLI）。区分大小写：命令都是小写，「Claude 桌面版里……」这种句子不算 */
const CMD_RE = /^(?:\$\s+)?(?:\/[a-z][\w:-]*(?:\s|$)|(?:npx|npm|pnpm|yarn|bunx|bun|git|gh|curl|wget|pip3?|pipx|uvx|uv|brew|claude|codex|gemini|docker|cargo|go)\s)/
const CJK_RE = /[㐀-鿿]/

export interface SkillInstall {
  /** 可以原样复制执行的命令（按先后顺序，一行一条）；trialNote 写的不是命令时为空 */
  commands: string[]
  /** 命令之外的说明；trialNote 整句都不是命令时就是它本身 */
  note: string | null
}

/**
 * 从 trialNote（≤200 字的一行）里认出安装命令：
 *   1. 有反引号：每一段反引号里的都是命令（「`A` 然后 `B`」= 两条）；剩下的字太短（只是「然后」「再」这类连接词）就不要了；
 *   2. 没有反引号、整句以命令开头：到第一个中文说明之前算命令（「npx x add y（需要 Node 18）」→ 命令 + 说明）；
 *   3. 都不是：没有命令，整句当「上手方式」显示（例如「在 claude.ai 的 Customize → Skills 里上传 ZIP」）。
 */
export function parseInstall(trialNote: string | null | undefined): SkillInstall {
  const s = (trialNote ?? '').trim()
  if (!s) return { commands: [], note: null }
  const spans = Array.from(s.matchAll(/`([^`\n]{2,})`/g)).map((m) => m[1].trim()).filter(Boolean)
  if (spans.length) {
    const rest = s.replace(/`[^`\n]{2,}`/g, ' ').replace(/\s+/g, ' ').trim()
    const meaningful = rest.replace(/[\s，,。；;：:、（）()]/g, '')
    return { commands: spans, note: meaningful.length > 4 ? rest.replace(/^[，,。；;：:、\s]+|[，,；;：:、\s]+$/g, '') : null }
  }
  if (!CMD_RE.test(s)) return { commands: [], note: s }
  const stripPrompt = (c: string) => c.replace(/^\$\s+/, '').trim()
  if (!CJK_RE.test(s)) return { commands: [stripPrompt(s)], note: null }
  // 命令后面跟了中文说明：从第一个中文字或全角括号处切开
  const cut = s.search(/\s*[（(]?\s*[㐀-鿿]|\s*[，。；]/)
  const cmd = stripPrompt(s.slice(0, cut))
  const tail = s.slice(cut).replace(/^[\s（(，。；]+|[\s）)。]+$/g, '').trim()
  // 切完只剩一个词（「claude 里输入……」）就不是命令
  return cmd.startsWith('/') || /\s/.test(cmd) ? { commands: [cmd], note: tail || null } : { commands: [], note: s }
}

/** 外链按钮上写什么：GitHub 仓库写「GitHub 仓库」，其余写「项目主页」（不写「官网」：check-seo-copy 的冒充官方词表） */
export function repoLabelOf(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'github.com' || host.endsWith('.github.com') ? 'GitHub 仓库' : host === 'gitee.com' ? 'Gitee 仓库' : '项目主页'
  } catch {
    return '项目主页'
  }
}
