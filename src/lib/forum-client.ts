// 客户端论坛工具：匿名身份标识 + 带身份头的 fetch
export function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('forum_anon_id')
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('forum_anon_id', id)
  }
  return id
}

export async function forumFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('x-anon-id', getAnonId())
  return fetch(input, { ...init, headers })
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date).getTime()
  const diff = Date.now() - d
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} 天前`
  return new Date(date).toLocaleDateString('zh-CN')
}
