/**
 * 「已读」标记：只存在浏览器本地，不上报、不关联账号。
 * 时间流与详情页共用同一份键与形状——两处不一致的话，
 * 点进详情再回列表会发现卡片没变灰，这是最容易被用户察觉的小 bug。
 */

const READ_KEY = 'news:read:v1'
const READ_CAP = 400 // 只保留最近 400 条，避免 localStorage 无上限增长

export function loadReadIds(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const arr = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function saveReadIds(ids: number[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-READ_CAP)))
  } catch {
    // 隐私模式 / 存储写满：已读只是视觉降权，写不进去就当没有，不影响阅读
  }
}

/** 追加一个已读 id（详情页直接进入时也要写，回到列表才对得上） */
export function markReadLocal(id: number) {
  const ids = loadReadIds()
  if (ids.includes(id)) return
  ids.push(id)
  saveReadIds(ids)
}
