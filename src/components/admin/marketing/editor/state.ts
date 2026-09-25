/**
 * 编辑器的纯状态逻辑：草稿形状、文档级撤销/重做、区块增删移。
 *
 * 【为什么单独成文件、且不 import React】这些是编辑器里最容易出「丢稿 / 撤销撤错」的地方，
 * 写成纯函数才能用 tsx 脚本直接断言（editor/__checks__/editor-state.check.ts），不必起浏览器。
 * 这里只依赖 types.ts（同构、仅 zod）与 presets.ts 的 id 生成器。
 */
import type { Block, CampaignDetail, DocSettings, EmailDoc, Topic } from '@/lib/marketing/types'
import { MAX_BLOCKS } from '@/lib/marketing/types'
import { newBlockId } from '@/lib/marketing/presets'

/* ============================== 草稿 ============================== */

/** 编辑器能改、自动保存会 PUT 的全部字段（受众不在编辑器里改） */
export interface DraftState {
  name: string
  topic: Topic
  subject: string
  preheader: string
  doc: EmailDoc
}

export function draftFromCampaign(c: CampaignDetail): DraftState {
  return {
    name: c.name ?? '',
    topic: c.topic,
    subject: c.subject ?? '',
    preheader: c.preheader ?? '',
    doc: c.doc,
  }
}

/**
 * 草稿指纹：判断「有没有未保存的改动」用。
 * 用 JSON 序列化而不是引用比较：撤销回到已保存的样子时，状态应当显示「已保存」而不是「未保存」。
 * 文档上限 200KB，一次序列化是亚毫秒级，只在草稿对象变化时算一次（调用方 useMemo）。
 */
export function draftKey(d: DraftState): string {
  return JSON.stringify([d.name, d.topic, d.subject, d.preheader, d.doc])
}

/* ============================== 撤销 / 重做 ============================== */

/** 文档级历史最多 50 个快照（含当前） */
export const HISTORY_LIMIT = 50
/** 同一处连续输入：两次改动间隔 < 1 秒并入同一步 */
export const COALESCE_IDLE_MS = 1000
/** 但一步最长 4 秒：一口气打一大段字，撤销时也不至于整段消失 */
export const COALESCE_MAX_MS = 4000

export interface HistoryState {
  past: DraftState[]
  present: DraftState
  future: DraftState[]
  /** 当前可合并的输入组（同一个 key 的连续改动） */
  group: { key: string; start: number; last: number } | null
}

export type HistoryAction =
  /** 普通改动。key 相同且在合并窗口内的连续改动并成一步（打字、拖颜色、拖滑块） */
  | { type: 'update'; fn: (d: DraftState) => DraftState; key?: string; now: number }
  | { type: 'undo' }
  | { type: 'redo' }
  /** 整体换成另一份草稿，且可撤销（冲突时「使用服务器版本」：点错了还能 Ctrl+Z 找回自己的） */
  | { type: 'load'; draft: DraftState }
  /** 丢弃全部历史（换了一个活动） */
  | { type: 'reset'; draft: DraftState }
  /** 结束当前输入组：下一次改动一定是新的一步（例如切换选中的区块后） */
  | { type: 'breakGroup' }

export function initHistory(draft: DraftState): HistoryState {
  return { past: [], present: draft, future: [], group: null }
}

function pushPast(past: DraftState[], d: DraftState): DraftState[] {
  const next = past.concat([d])
  // past + present ≤ HISTORY_LIMIT
  return next.length > HISTORY_LIMIT - 1 ? next.slice(next.length - (HISTORY_LIMIT - 1)) : next
}

export function historyReducer(s: HistoryState, a: HistoryAction): HistoryState {
  switch (a.type) {
    case 'update': {
      const next = a.fn(s.present)
      // 没变就什么都不做：不产生空的历史步，也不打断正在进行的输入组
      if (next === s.present) return s
      const g = s.group
      const canMerge =
        !!a.key &&
        !!g &&
        g.key === a.key &&
        a.now - g.last < COALESCE_IDLE_MS &&
        a.now - g.start < COALESCE_MAX_MS
      if (canMerge && g) {
        return { past: s.past, present: next, future: [], group: { key: g.key, start: g.start, last: a.now } }
      }
      return {
        past: pushPast(s.past, s.present),
        present: next,
        future: [],
        group: a.key ? { key: a.key, start: a.now, last: a.now } : null,
      }
    }
    case 'undo': {
      if (!s.past.length) return s
      const prev = s.past[s.past.length - 1]
      return { past: s.past.slice(0, -1), present: prev, future: [s.present].concat(s.future), group: null }
    }
    case 'redo': {
      if (!s.future.length) return s
      const [next, ...rest] = s.future
      return { past: pushPast(s.past, s.present), present: next, future: rest, group: null }
    }
    case 'load': {
      if (a.draft === s.present) return s
      return { past: pushPast(s.past, s.present), present: a.draft, future: [], group: null }
    }
    case 'reset':
      return initHistory(a.draft)
    case 'breakGroup':
      return s.group ? { ...s, group: null } : s
    default:
      return s
  }
}

/* ============================== 区块操作（纯函数） ============================== */

export function findBlock(doc: EmailDoc, id: string | null | undefined): Block | null {
  if (!id) return null
  return doc.blocks.find((b) => b.id === id) || null
}

export function blockIndex(doc: EmailDoc, id: string): number {
  return doc.blocks.findIndex((b) => b.id === id)
}

/** 生成文档内不重复的区块 id（newBlockId 是 8 位随机 base36，碰撞概率极低，但兜住它不花什么） */
export function uniqueBlockId(doc: EmailDoc): string {
  const used = new Set(doc.blocks.map((b) => b.id))
  for (let i = 0; i < 20; i++) {
    const id = newBlockId()
    if (!used.has(id)) return id
  }
  // 极端兜底：带时间戳，仍满足 ^[A-Za-z0-9_-]{1,32}$
  return ('b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 32)
}

/** 深拷贝一个区块（区块是纯 JSON）并换新 id */
export function cloneBlock(b: Block, id: string): Block {
  const copy = JSON.parse(JSON.stringify(b)) as Block
  copy.id = id
  return copy
}

export function updateBlock(doc: EmailDoc, id: string, fn: (b: Block) => Block): EmailDoc {
  let changed = false
  const blocks = doc.blocks.map((b) => {
    if (b.id !== id) return b
    const nb = fn(b)
    if (nb !== b) changed = true
    return nb
  })
  return changed ? { ...doc, blocks } : doc
}

export function insertBlock(doc: EmailDoc, index: number, block: Block): EmailDoc {
  if (doc.blocks.length >= MAX_BLOCKS) return doc
  const i = Math.max(0, Math.min(index, doc.blocks.length))
  const blocks = doc.blocks.slice()
  blocks.splice(i, 0, block)
  return { ...doc, blocks }
}

export function removeBlock(doc: EmailDoc, id: string): { doc: EmailDoc; removed: Block | null; index: number } {
  const index = blockIndex(doc, id)
  if (index < 0) return { doc, removed: null, index: -1 }
  const blocks = doc.blocks.slice()
  const [removed] = blocks.splice(index, 1)
  return { doc: { ...doc, blocks }, removed, index }
}

/** 上移（delta=-1）/ 下移（delta=1）；到头了原样返回 */
export function moveBlock(doc: EmailDoc, id: string, delta: number): EmailDoc {
  const i = blockIndex(doc, id)
  if (i < 0) return doc
  const j = i + delta
  if (j < 0 || j >= doc.blocks.length) return doc
  const blocks = doc.blocks.slice()
  const [b] = blocks.splice(i, 1)
  blocks.splice(j, 0, b)
  return { ...doc, blocks }
}

/**
 * 按 id 顺序重排（拖动结束时提交）。
 * ids 必须恰好是现有区块 id 的一个排列；不是（例如拖动期间另一个操作删了块）就不动，免得把块弄丢。
 */
export function reorderBlocks(doc: EmailDoc, ids: string[]): EmailDoc {
  if (ids.length !== doc.blocks.length) return doc
  const map = new Map(doc.blocks.map((b) => [b.id, b]))
  const blocks: Block[] = []
  for (const id of ids) {
    const b = map.get(id)
    if (!b) return doc
    blocks.push(b)
    map.delete(id)
  }
  if (map.size) return doc
  if (blocks.every((b, i) => b === doc.blocks[i])) return doc
  return { ...doc, blocks }
}

/** 每封邮件至多一个优惠券区块：渲染器只为第一个券区块准备展示数据，launch 也只建一个券批次 */
export function hasCouponBlock(doc: EmailDoc): boolean {
  return doc.blocks.some((b) => b.type === 'coupon')
}

export function canDuplicate(doc: EmailDoc, b: Block): boolean {
  return doc.blocks.length < MAX_BLOCKS && b.type !== 'coupon'
}

export function duplicateBlock(doc: EmailDoc, id: string): { doc: EmailDoc; newId: string | null } {
  const i = blockIndex(doc, id)
  if (i < 0) return { doc, newId: null }
  const src = doc.blocks[i]
  if (!canDuplicate(doc, src)) return { doc, newId: null }
  const newId = uniqueBlockId(doc)
  return { doc: insertBlock(doc, i + 1, cloneBlock(src, newId)), newId }
}

/* ============================== 主题换色 ============================== */

/** 换主题时跟着一起换的「主题色」键。文字色/底色不跟：按钮上的白字不能因为换了深色主题变成深色字 */
const THEME_FOLLOW_KEYS: (keyof DocSettings)[] = ['brand', 'accent', 'link']

/**
 * 套用新主题时，把区块里「正好等于旧主题某个主题色」的颜色换成新主题的对应色。
 * 不这样做的话，页眉、按钮、券卡片的颜色都是写死在区块上的，换主题只换了背景，看起来像没生效。
 * 只换完全相等的颜色：用户手工调过的颜色原样保留。
 */
export function remapThemeColors(doc: EmailDoc, from: DocSettings, to: DocSettings): EmailDoc {
  const table = new Map<string, string>()
  for (const k of THEME_FOLLOW_KEYS) {
    const a = String(from[k]).toLowerCase()
    const b = String(to[k]).toLowerCase()
    if (!table.has(a)) table.set(a, b)
  }
  const map = (c: string | undefined): string | undefined => {
    if (!c) return c
    const hit = table.get(c.toLowerCase())
    return hit ?? c
  }
  const req = (c: string): string => map(c) ?? c
  const blocks = doc.blocks.map((b): Block => {
    const box = b.box?.bg ? { ...b.box, bg: map(b.box.bg) } : b.box
    switch (b.type) {
      case 'header':
        return { ...b, box, bg: req(b.bg), bg2: map(b.bg2), color: req(b.color) }
      case 'hero':
        return {
          ...b,
          box,
          bg: req(b.bg),
          bg2: map(b.bg2),
          color: req(b.color),
          button: b.button ? { ...b.button, bg: req(b.button.bg), color: req(b.button.color) } : b.button,
        }
      case 'button':
      case 'coupon':
        return { ...b, box, bg: req(b.bg), color: req(b.color) }
      case 'divider':
        return { ...b, box, color: req(b.color) }
      default:
        return box === b.box ? b : { ...b, box }
    }
  })
  return { ...doc, settings: to, blocks }
}
