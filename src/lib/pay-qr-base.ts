/**
 * 收银台收款码（支付宝 / 微信各一组）：后台可以存多张、随时切换，切换后收银台立即显示新的一张（不用重新构建镜像）。
 *
 * 【两个渠道各一行配置】支付宝 key = vmq_payqr（2026-10-12 起就是这一行）、微信 key = vmq_payqr_wechat（2026-10-18 新增），格式相同。
 *  · 支付宝的 'builtin' = 镜像自带的 public/vmq-alipay-qr.png；
 *  · 微信没有内置码：'builtin' 表示「未启用」—— 收银台与结算弹窗都不出现微信支付，直到站长上传一张并「设为当前」。
 * 本文件只有格式约定与纯函数（不碰数据库 / 文件），服务端与 scripts/check-pay-qr.ts 共用；读写在 lib/pay-qr.ts。
 *
 * 【存在哪】settings 表一行（key = vmq_payqr），JSON：
 *   { activeId, items: [{ id, label, url, addedAt, addedBy }], switchedAt, history: [{ at, from, to, by }] }
 *   · activeId = 'builtin'：用镜像里自带的 public/vmq-alipay-qr.png（没配置过、或切回内置时）；
 *   · 其余 activeId 必须是 items 里某一张的 id；图片在 public/uploads/payqr/ 下，文件名由服务端随机生成。
 *
 * 【读坏了怎么办】这一行决定「买家的钱付给谁」。JSON 损坏 / 整行结构不对 → parsePayQrState 抛错，不回落内置码：
 * 站长切走内置码多半是因为那个号收不了款，悄悄切回去等于把钱引到一个不该收的号上。
 * 单张条目不合规（地址不符合约定格式等）只丢掉那一张；当前生效的那张被丢掉同样抛错。
 */

import type { PayChannel } from './pay-channel'

export const PAY_QR_SETTING_KEY = 'vmq_payqr'
export const BUILTIN_QR_ID = 'builtin'
export const BUILTIN_QR_URL = '/vmq-alipay-qr.png'

/** 每个渠道一行配置 */
export const PAY_QR_SETTING_KEYS: Record<PayChannel, string> = { alipay: PAY_QR_SETTING_KEY, wechat: 'vmq_payqr_wechat' }
/** 「builtin」对应的图片：支付宝是镜像自带的码；微信没有（= 未启用） */
export function builtinQrUrl(channel: PayChannel): string | null {
  return channel === 'alipay' ? BUILTIN_QR_URL : null
}
/** 「builtin」在后台叫什么 */
export function builtinQrLabel(channel: PayChannel): string {
  return channel === 'alipay' ? '内置收款码' : '未启用（不收微信）'
}
/** 只认服务端生成的文件名（upload-store 的 `<时间36进制>-<12位hex>.<ext>`），不收 gif / svg */
export const PAY_QR_URL_RE = /^\/uploads\/payqr\/[0-9a-z]+-[0-9a-f]{12}\.(png|jpg|webp)$/
export const PAY_QR_ID_RE = /^[0-9a-f]{12}$/
export const PAY_QR_MAX_ITEMS = 10
export const PAY_QR_LABEL_MAX = 30
export const PAY_QR_HISTORY_MAX = 30

export interface PayQrItem {
  id: string
  /** 站长自己起的名字（例如「主号 尾号 1234」），只在后台显示 */
  label: string
  url: string
  addedAt: number
  addedBy: number | null
}

export interface PayQrSwitch {
  at: number
  from: string
  to: string
  by: number | null
  /** 切换那一刻两张码的名字（之后码被删了，记录里仍看得出是哪一张） */
  fromLabel?: string
  toLabel?: string
}

export interface PayQrState {
  activeId: string
  items: PayQrItem[]
  switchedAt: number | null
  history: PayQrSwitch[]
}

export class PayQrError extends Error {
  constructor(
    public code: 'CORRUPT' | 'NOT_FOUND' | 'ACTIVE' | 'FULL' | 'BAD_LABEL' | 'BUILTIN',
    message: string,
  ) {
    super(message)
    this.name = 'PayQrError'
  }
}

export function emptyPayQrState(): PayQrState {
  return { activeId: BUILTIN_QR_ID, items: [], switchedAt: null, history: [] }
}

export function isValidPayQrUrl(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 160 && PAY_QR_URL_RE.test(v)
}

/** 收银台（浏览器端）拿到的地址再收一道：只可能是内置码或 uploads/payqr 下的一张 */
export function isCashierQrUrl(v: unknown): v is string {
  return v === BUILTIN_QR_URL || isValidPayQrUrl(v)
}

/** 名字：去掉首尾空白，1–30 个字符，不收控制字符与尖括号 */
export function normalizePayQrLabel(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s || s.length > PAY_QR_LABEL_MAX) return null
  if (/[\u0000-\u001f\u007f<>]/.test(s)) return null
  return s
}

function isItem(v: unknown): v is PayQrItem {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    PAY_QR_ID_RE.test(o.id) &&
    normalizePayQrLabel(o.label) !== null &&
    isValidPayQrUrl(o.url) &&
    typeof o.addedAt === 'number' &&
    (o.addedBy === null || typeof o.addedBy === 'number')
  )
}

/** raw = settings 行的 value；null（从没配置过）→ 空状态（用内置码）。结构损坏 / 生效的那张不在了 → 抛 CORRUPT */
export function parsePayQrState(raw: string | null | undefined): PayQrState {
  if (raw === null || raw === undefined) return emptyPayQrState()
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    throw new PayQrError('CORRUPT', '收款码配置已损坏（不是合法 JSON）')
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new PayQrError('CORRUPT', '收款码配置已损坏（结构不对）')
  const o = v as Record<string, unknown>
  if (typeof o.activeId !== 'string' || !Array.isArray(o.items)) throw new PayQrError('CORRUPT', '收款码配置已损坏（缺少 activeId / items）')
  const seen = new Set<string>()
  const items: PayQrItem[] = []
  for (const it of o.items) {
    if (!isItem(it) || seen.has(it.id)) continue
    seen.add(it.id)
    items.push({ id: it.id, label: it.label.trim(), url: it.url, addedAt: it.addedAt, addedBy: it.addedBy })
  }
  if (o.activeId !== BUILTIN_QR_ID && !seen.has(o.activeId)) {
    throw new PayQrError('CORRUPT', '收款码配置已损坏（当前生效的收款码不在列表里）')
  }
  const history: PayQrSwitch[] = Array.isArray(o.history)
    ? (o.history as unknown[]).flatMap((h) => {
        const x = h as Record<string, unknown> | null
        if (!x || typeof x.at !== 'number' || typeof x.from !== 'string' || typeof x.to !== 'string') return []
        const fromLabel = normalizePayQrLabel(x.fromLabel)
        const toLabel = normalizePayQrLabel(x.toLabel)
        return [{ at: x.at, from: x.from, to: x.to, by: typeof x.by === 'number' ? x.by : null, ...(fromLabel ? { fromLabel } : {}), ...(toLabel ? { toLabel } : {}) }]
      })
    : []
  return {
    activeId: o.activeId,
    items,
    switchedAt: typeof o.switchedAt === 'number' ? o.switchedAt : null,
    history: history.slice(-PAY_QR_HISTORY_MAX),
  }
}

/** 当前生效的收款码地址（收银台显示的那一张；支付宝） */
export function activePayQrUrl(s: PayQrState): string {
  return activePayQrUrlFor(s, 'alipay') as string
}

/** 当前生效的收款码地址；null = 这个渠道没启用（只有微信会这样） */
export function activePayQrUrlFor(s: PayQrState, channel: PayChannel): string | null {
  if (s.activeId === BUILTIN_QR_ID) return builtinQrUrl(channel)
  const it = s.items.find((i) => i.id === s.activeId)
  if (!it) throw new PayQrError('CORRUPT', '当前生效的收款码不在列表里')
  return it.url
}

/** 名字（builtin 按渠道叫「内置收款码」/「未启用」；已删掉的显示 id） */
export function payQrLabel(s: PayQrState, id: string, channel: PayChannel = 'alipay'): string {
  if (id === BUILTIN_QR_ID) return builtinQrLabel(channel)
  return s.items.find((i) => i.id === id)?.label ?? `已删除（${id}）`
}

/** 新增一张（不改变当前生效的）。满 10 张 / 名字不合规 → 抛错 */
export function addPayQr(s: PayQrState, item: PayQrItem): PayQrState {
  if (!isItem(item)) throw new PayQrError('BAD_LABEL', '收款码名称须为 1–30 个字符')
  if (s.items.length >= PAY_QR_MAX_ITEMS) throw new PayQrError('FULL', `最多保存 ${PAY_QR_MAX_ITEMS} 张收款码，请先删除不用的`)
  if (s.items.some((i) => i.id === item.id)) throw new PayQrError('NOT_FOUND', '收款码编号重复，请重试')
  return { ...s, items: [...s.items, { ...item, label: item.label.trim() }] }
}

/** 切换当前生效的收款码；changed=false 表示本来就是这一张 */
export function activatePayQr(
  s: PayQrState,
  id: string,
  by: number | null,
  now: number,
  channel: PayChannel = 'alipay',
): { state: PayQrState; changed: boolean } {
  if (id !== BUILTIN_QR_ID && !s.items.some((i) => i.id === id)) throw new PayQrError('NOT_FOUND', '这张收款码不存在（可能已被删除）')
  if (s.activeId === id) return { state: s, changed: false }
  const entry: PayQrSwitch = { at: now, from: s.activeId, to: id, by, fromLabel: payQrLabel(s, s.activeId, channel), toLabel: payQrLabel(s, id, channel) }
  const history = [...s.history, entry].slice(-PAY_QR_HISTORY_MAX)
  return { state: { ...s, activeId: id, switchedAt: now, history }, changed: true }
}

/** 删除一张：内置码不能删、正在用的不能删（先切到别的再删）。返回被删的那一张（调用方据此删文件） */
export function removePayQr(s: PayQrState, id: string): { state: PayQrState; removed: PayQrItem } {
  if (id === BUILTIN_QR_ID) throw new PayQrError('BUILTIN', '这一项不能删除')
  const removed = s.items.find((i) => i.id === id)
  if (!removed) throw new PayQrError('NOT_FOUND', '这张收款码不存在（可能已被删除）')
  if (s.activeId === id) throw new PayQrError('ACTIVE', '这张收款码正在使用，请先切换到另一张再删除')
  return { state: { ...s, items: s.items.filter((i) => i.id !== id) }, removed }
}
