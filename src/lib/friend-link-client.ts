/**
 * 友链模块里**不碰数据库**的那一半：枚举、标签、地址归一化、rel 计算。
 *
 * 【为什么要拆成两个文件】friend-link.ts 里 `import { prisma }`，
 * 任何 'use client' 组件对它做值导入（不是 import type）都会把 @prisma/client
 * 拖进客户端 bundle。而恰恰是客户端组件最需要这些标签与常量——
 * 不拆的话，后台页面和弹窗只能各自把 'FRIEND' / 'PENDING' 这些字面量再抄一遍，
 * 状态机很快就会有五六份真理来源。
 *
 * 仓库里 forum.ts / forum-client.ts 就是同一种拆法，这里沿用。
 */

// ---------------- 枚举 ----------------

/** 展示位：友链墙 / 招商位 */
export const LINK_SLOTS = ['FRIEND', 'SPONSOR'] as const
export type LinkSlot = (typeof LINK_SLOTS)[number]

/** 审核状态机：PENDING →（通过）APPROVED →（撤链/到期）OFFLINE；PENDING →（不合格）REJECTED */
export const LINK_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'OFFLINE'] as const
export type LinkStatus = (typeof LINK_STATUSES)[number]

export const SLOT_LABELS: Record<string, string> = {
  FRIEND: '友情链接',
  SPONSOR: '招商位',
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '展示中',
  REJECTED: '已拒绝',
  OFFLINE: '已下线',
}

// ---------------- 地址处理 ----------------

/**
 * 归一化站点地址：补协议、去掉末尾多余斜杠、丢掉 hash。
 * 返回 null 表示这不是一个能挂出去的公网地址。
 *
 * 【为什么要自己写而不是只用 z.string().url()】申请人十有八九填的是
 * 「www.example.com」这种不带协议的写法，zod 会直接判不合法，
 * 而这其实是最正常的输入。补一个 https:// 再校验，能省掉大量无意义的退回。
 */
export function normalizeUrl(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  const withProto = /^https?:\/\//i.test(s) ? s : 'https://' + s
  let u: URL
  try {
    u = new URL(withProto)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  // 带账号密码的地址（https://user:pass@host）不是给人访问的，直接拒
  if (u.username || u.password) return null
  if (!u.hostname.includes('.')) return null // localhost、内网主机名之类
  u.hash = ''
  // 只去 path 上的尾斜杠。在整串上 replace(/\/$/,'') 会削掉查询串结尾的字符：
  // https://site.com/?next=/docs/ 会被改写成另一个地址，而这是对方给的真实链接
  u.pathname = u.pathname.replace(/\/+$/, '')
  const out = u.toString()
  return out.length > 300 ? null : out
}

/**
 * 归一化 logo 地址。允许两种形态：本站上传的 /uploads/... 相对路径，或对方的 http(s) 外链。
 * 返回 undefined 表示「填了但不合法」，null 表示「没填」。
 *
 * 【为什么必须校验协议】logo 最终会落到 <img src={...}>、url 会落到 <a href={...}>，
 * 放任 javascript: / data: 进来，友链表单就是一个存储型 XSS 入口，
 * 而中招的往往是权限最大的后台管理员。
 */
export function normalizeLogo(raw: string | null | undefined): string | null | undefined {
  const s = (raw || '').trim()
  if (!s) return null
  // 本站上传的图片：只认 /uploads/ 开头，且不允许 ../ 之类的穿越写法
  if (s.startsWith('/uploads/')) {
    return s.includes('..') || s.length > 300 ? undefined : s
  }
  if (!/^https?:\/\//i.test(s)) return undefined
  const normalized = normalizeUrl(s)
  return normalized || undefined
}

/** 取主机名（去掉 www.），失败就原样返回，只用于展示与查重，不参与安全判断 */
export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./i, '').toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

/**
 * 出站链接的 rel。
 *
 * 【为什么招商位必须带 sponsored】Google 对「付费获得的链接」有明确要求：
 * 必须用 rel="sponsored"（或 nofollow）标注，否则算操纵排名，处罚的是我们自己的域名。
 * 这一条刻意不做成后台开关，就是不给「反正也查不到」的侥幸留口子。
 *
 * 【为什么招商位 sponsored 与 nofollow 同时写】百度不认 sponsored，会把它当普通链接处理。
 * 两个值可以共存，同时写才能让 Google 与百度都正确理解「这是付费位」。
 *
 * 【为什么只有 noopener、没有 noreferrer】两者常被一起抄，作用却完全不同：
 * 防 window.opener 劫持的是 noopener（现代浏览器 target=_blank 已默认隐含），
 * noreferrer 额外砍掉的是 Referer 头。而友链互挂里，对方唯一能量化的回报
 * 就是我们导过去的流量——把 Referer 抹掉，对方的统计里我们是「直接访问」，
 * 等于把自己付出的对价藏起来，续约和招商谈判时一句都说不清。
 */
export function outboundRel(slot: string, nofollow: boolean): string {
  const rels = ['noopener']
  if (slot === 'SPONSOR') rels.push('sponsored', 'nofollow')
  else if (nofollow) rels.push('nofollow')
  return rels.join(' ')
}

/** 后台 datetime-local 传上来的是本地时间字符串；空串要落成 null，而不是 Invalid Date */
export function parseDateInput(v: string | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

// ---------------- 前台数据契约 ----------------

/** 前台卡片需要的字段。contact / remark / applyIp 不在其中，压根不会离开服务端 */
export interface PublicLinkDto {
  id: number
  name: string
  url: string
  host: string
  logo: string | null
  description: string | null
  slot: string
  /** rel 在服务端算好（招商位强制 sponsored nofollow），前台原样输出 */
  rel: string
}
