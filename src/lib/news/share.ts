/**
 * 分享相关的纯函数（客户端与服务端都能 import，不碰 prisma / node 内置模块）。
 *
 * 几条不可协商的约束，改之前先读 .claude/skills/ai-news-pipeline/SKILL.md：
 *
 * 1. 【微信自定义分享卡片本期做不到】域名未备案，微信 JS-SDK 要求「JS 接口安全域名」
 *    必须已备案，拿不到 signature。而且自 JS-SDK 1.4.0 起微信已取消 H5 程序化调起分享，
 *    网页只能引导用户点右上角菜单。所以这里没有、也不要加任何 wx.config / wx.ready 代码。
 * 2. 【禁止一切利益诱导分享】微信外链规范禁止「分享得优惠/解锁/抽奖」，处罚是封禁域名。
 *    本站靠客服微信引流成交，域名被封是致命伤。所有分享文案必须干净，只描述内容本身。
 * 3. 【复制文案必须带「AI 摘要」字样】《人工智能生成合成内容标识办法》第五条要求标识
 *    覆盖复制/导出场景，这是 SKILL.md §6 六处标识里的第 5 处。
 * 4. 【渠道参数只用 1 个字符】海报二维码的模块密度直接决定朋友圈长按识别成功率，
 *    长 UTM 会把版本推高一两级。用 ?s=w|q|z|p|c。
 */
import { getAnonId } from '@/lib/forum-client'
import { AI_BADGE } from './constants'

/** 分享渠道。单字符编码，落在 URL 的 ?s= 上 */
export const SHARE_CHANNELS = {
  wechat: 'w',
  qq: 'q',
  weibo: 'z',
  poster: 'p',
  copy: 'c',
  system: 's',
} as const

export type ShareChannel = keyof typeof SHARE_CHANNELS

/** 合法的渠道代码集合。显式标成 string[]：这是拿来校验外部传入字符串的白名单，
 *  保留字面量联合类型只会让每个调用点都要先断言一次。 */
export const SHARE_CHANNEL_CODES: string[] = Object.keys(SHARE_CHANNELS).map(
  (k) => SHARE_CHANNELS[k as ShareChannel]
)

/** 把渠道标记拼到 URL 上（已有 ?s= 会被覆盖，不会越拼越长） */
export function withChannel(url: string, channel: ShareChannel): string {
  const code = SHARE_CHANNELS[channel]
  const [base, hash] = url.split('#')
  const [path, query] = base.split('?')
  const params = new URLSearchParams(query || '')
  params.set('s', code)
  const qs = params.toString()
  return `${path}${qs ? `?${qs}` : ''}${hash ? `#${hash}` : ''}`
}

/** 从 URL 反查渠道代码，用于落地页统计来源 */
export function readChannel(search: string): string | null {
  try {
    const s = new URLSearchParams(search).get('s')
    return s && SHARE_CHANNEL_CODES.indexOf(s) >= 0 ? s : null
  } catch {
    return null
  }
}

export interface ShareContent {
  headline: string
  summary?: string | null
  url: string
}

/** 截断到 n 个字符，超出补省略号（中文按字符数即可，不做视觉宽度换算） */
export function clamp(text: string, n: number): string {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

/**
 * 一键复制的分享文案。
 * 必须出现「AI 摘要」字样——这是法定标识的第 5 处，不是文案偏好，不要为了简洁删掉。
 * 同样不得出现任何「分享有奖」类利益诱导表述。
 */
export function buildShareText(c: ShareContent): string {
  const lines = [`【${AI_BADGE}】${c.headline}`]
  const s = clamp(c.summary || '', 90)
  if (s) lines.push(s)
  lines.push(`查看信源与全文：${withChannel(c.url, 'copy')}`)
  lines.push(`（本条为 ${AI_BADGE}，由 AI 依据公开信源自动整理，请以原文为准）`)
  return lines.join('\n')
}

/** QQ 分享（widget 页，无需 appid） */
export function qqShareUrl(c: ShareContent): string {
  const p = new URLSearchParams({
    url: withChannel(c.url, 'qq'),
    title: clamp(c.headline, 60),
    summary: `【${AI_BADGE}】${clamp(c.summary || '', 80)}`,
    desc: `【${AI_BADGE}】${clamp(c.summary || '', 80)}`,
  })
  return `https://connect.qq.com/widget/shareqq/index.html?${p.toString()}`
}

/** 微博分享 */
export function weiboShareUrl(c: ShareContent): string {
  const p = new URLSearchParams({
    url: withChannel(c.url, 'weibo'),
    title: `【${AI_BADGE}】${clamp(c.headline, 80)}`,
  })
  return `https://service.weibo.com/share/share.php?${p.toString()}`
}

/** 是否在微信内置浏览器（决定是否走「引导点右上角」的蒙层） */
export function isWeChat(): boolean {
  if (typeof navigator === 'undefined') return false
  return /micromessenger/i.test(navigator.userAgent)
}

/**
 * 复制到剪贴板。优先 navigator.clipboard（https 下可用），
 * 微信 X5 内核偶发拿不到该 API，回落到隐藏 textarea + execCommand。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 落到下面的兜底
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// ---- 上报 ----

/**
 * 浏览上报：前端停留 3 秒后调用一次。
 *
 * 【为什么 body 里必须带 k】sendBeacon 发不了自定义请求头，服务端拿不到 x-anon-id，
 * 缺了 k 就只能回落到「按 IP 去重」。而 (eventId, viewerKey, hourBucket) 是唯一约束——
 * 学校/公司/运营商 CGNAT 后面几十上百个真人共用一个出口 IP 时，
 * 一小时内只有第一个人会被计数，其余全被当成重复请求丢掉，浏览量会系统性地偏低一个数量级。
 * 所以匿名 id 走请求体，这不是可选优化。
 *
 * 【为什么用 sendBeacon 而不是 fetch】用户读完就关页面是常态，
 * fetch 会随页面卸载被取消，sendBeacon 由浏览器接管发送，不受页面生命周期影响。
 */
export function reportNewsView(eventId: number): void {
  try {
    const payload = JSON.stringify({ eventId, k: getAnonId() })
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/news/view', new Blob([payload], { type: 'application/json' }))
      return
    }
    // 少数内核没有 sendBeacon，退回 keepalive fetch
    fetch('/api/news/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 上报失败只影响热度信号的精度，不影响阅读，绝不向用户抛错
  }
}

/** 分享上报。服务端会按「同一读者 + 同一事件 24 小时」去重，这里不必自己防重复点 */
export function reportNewsShare(eventId: number, channel: ShareChannel): void {
  try {
    fetch('/api/news/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, channel: SHARE_CHANNELS[channel], k: getAnonId() }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 同上
  }
}

