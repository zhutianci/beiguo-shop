/**
 * 站内内容链接的纯函数（不碰数据库，scripts/check-* 直接测）。用途与原因见 internal-links.ts。
 */
const LINK_RE = /\[([^\]\n]*)\]\(\/(guides|prompts|apps)\/(\d{1,9})(?:-[a-z0-9-]{1,120})?\)/g

/** 给定「已公开的 id 集合」，把指向其余 id 的站内链接降成纯文字 */
export function stripLinksExcept(content: string, publicIds: ReadonlySet<number>): string {
  return content.replace(LINK_RE, (all, text: string, _sec: string, id: string) => (publicIds.has(Number(id)) ? all : text))
}

/** 正文里引用到的站内内容 id（去重） */
export function linkedContentIds(content: string): number[] {
  const ids = new Set<number>()
  for (const m of Array.from(content.matchAll(LINK_RE))) ids.add(Number(m[3]))
  return Array.from(ids)
}
