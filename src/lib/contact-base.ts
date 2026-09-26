/**
 * 店面客服信息：常量、类型、回退规则与字段格式（二期改动 4.1、4.4）。
 *
 * 【为什么拆成 contact-base 与 contact 两个文件】本文件要进客户端包（storefront-provider 的 FALLBACK、public.ts 的类型），
 * 所以**零依赖**：不 import prisma、zod、marketing/lint。邮箱的「阿里云禁发词」校验要用 marketing/lint（连带 marketing/types、
 * richtext 两千多行），放进来会让每个前台页面的 JS 都背上营销编辑器的代码——那部分放在 src/lib/contact.ts（服务端与校验用），
 * 它 re-export 本文件的全部内容。**服务端代码一律从 '@/lib/contact' import；客户端组件从 useStorefront().contact 取值，
 * 确需常量时从 '@/lib/contact-base' import。**
 *
 * 【主站零查库、渲染逐字不变】主站客服信息就是 PLATFORM_CONTACT 这个常量（原来散落在 floating-contact / contact-modal /
 * product-intro 等处的 'GenuineMarxist'、'/wechat-qr.jpg'、'9:00-22:00'），主站店面直接用它，不读 tenants 表。
 *
 * 【渠道回退规则】（resolveStoreContact）
 *  · 微信号与二维码**作为一组**：渠道设了其中任意一项就整组用渠道的（没设二维码 → qrUrl=null，页面隐藏二维码）；
 *    两项都没设才整组用主站的。这样不会出现「渠道微信号 + 主站二维码」的错配（买家扫码加到的是站长）。
 *  · 邮箱、服务时间各自回退：渠道的，未设则主站的（主站当前没有客服邮箱 → null，不显示）。
 *  · 库里的值**读出来再校验一遍**：不合规的按「未设置」处理（二维码地址尤其如此——渲染进 <img src> 的只能是
 *    /uploads/contact/ 下服务端生成的文件名，杜绝 javascript:、外站跟踪像素）。
 */

/** 店面客服信息（公开数据，会进 HTML 与 RSC payload）。null = 不显示该项 */
export interface StoreContact {
  /** 微信号或昵称（可复制）；null → 不显示微信号 */
  wechat: string | null
  /** 二维码图片站内路径（主站 /wechat-qr.jpg，渠道 /uploads/contact/<名>.<ext>）；null → 隐藏二维码 */
  qrUrl: string | null
  /** 客服邮箱；null → 不显示 */
  email: string | null
  /** 服务时间，如「9:00-22:00」；null → 不显示 */
  hours: string | null
}

/** 主站客服信息（常量；改这里 = 改主站所有展示点）。email 为 null：主站当前没有客服邮箱 */
export const PLATFORM_CONTACT: Readonly<StoreContact> = Object.freeze({
  wechat: 'GenuineMarxist',
  qrUrl: '/wechat-qr.jpg',
  email: null,
  hours: '9:00-22:00',
})

/** tenants 行里的四列（均可缺省：wp0 的假库、旧代码的 select 不带这些列时按「未设置」处理） */
export interface TenantContactRow {
  supportWechat?: string | null
  supportQrUrl?: string | null
  supportEmail?: string | null
  supportHours?: string | null
}

/** 四个字段名（审计 publicDiff 只写「哪些字段变了」，用这里的名字） */
export const CONTACT_FIELDS = ['supportWechat', 'supportQrUrl', 'supportEmail', 'supportHours'] as const
export type ContactField = (typeof CONTACT_FIELDS)[number]

// ------------------------------ 字段格式（读写两端共用） ------------------------------

/** 客服二维码地址：只认服务端生成的文件名（upload-store 的 `<时间36进制>-<12位hex>.<ext>`），不收 gif / svg */
export const CONTACT_QR_URL_RE = /^\/uploads\/contact\/[0-9a-z-]+\.(png|jpg|webp)$/
/** 微信号 / 昵称：字母数字、下划线、横线、汉字，1–30 个字符；不接受 URL、@、<> */
export const CONTACT_WECHAT_RE = /^[A-Za-z0-9_\-一-龥]{1,30}$/
/** 服务时间：≤40 字，只允许数字、空格、`:`、`-`、`~`、「至」与汉字（「至」本身在汉字区间里） */
export const CONTACT_HOURS_RE = /^[0-9 :\-~一-龥]{1,40}$/
/** 邮箱长度上限（与列宽 VarChar(120) 一致） */
export const CONTACT_EMAIL_MAX = 120
/**
 * 邮箱的**语法**检查（客户端安全的近似版）：与 zod email() 同样拒绝空白、引号、尖括号。
 * 完整校验（含阿里云禁发词）用 src/lib/contact.ts 的 checkContactEmail；这里只给读路径兜底和前端即时提示用。
 */
export const CONTACT_EMAIL_SYNTAX_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

export function isValidContactQrUrl(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 160 && CONTACT_QR_URL_RE.test(v)
}
export function isValidContactWechat(v: unknown): v is string {
  return typeof v === 'string' && CONTACT_WECHAT_RE.test(v)
}
export function isValidContactHours(v: unknown): v is string {
  // 不能全是空格（正则允许空格）
  return typeof v === 'string' && CONTACT_HOURS_RE.test(v) && v.trim().length > 0
}
export function isContactEmailSyntax(v: unknown): v is string {
  return typeof v === 'string' && v.length <= CONTACT_EMAIL_MAX && CONTACT_EMAIL_SYNTAX_RE.test(v)
}

/** 读路径：库里的值不合规 → null（按未设置处理，由回退规则接手） */
function readOrNull(v: unknown, ok: (x: unknown) => boolean): string | null {
  return typeof v === 'string' && ok(v) ? v : null
}

/**
 * 店面客服信息的唯一回退实现（二期改动 4.1）。
 *  · row 为 null / undefined（主站、或调用方没有 tenants 行）→ 主站常量的副本；
 *  · 否则按文件头的回退规则。
 * 返回新对象：调用方改了也不影响常量。
 */
export function resolveStoreContact(row: TenantContactRow | null | undefined): StoreContact {
  if (!row) return { ...PLATFORM_CONTACT }
  const wechat = readOrNull(row.supportWechat, isValidContactWechat)
  const qrUrl = readOrNull(row.supportQrUrl, isValidContactQrUrl)
  const email = readOrNull(row.supportEmail, isContactEmailSyntax)
  const hours = readOrNull(row.supportHours, isValidContactHours)
  const ownGroup = wechat !== null || qrUrl !== null
  return {
    wechat: ownGroup ? wechat : PLATFORM_CONTACT.wechat,
    qrUrl: ownGroup ? qrUrl : PLATFORM_CONTACT.qrUrl,
    email: email ?? PLATFORM_CONTACT.email,
    hours: hours ?? PLATFORM_CONTACT.hours,
  }
}

/** 审计 publicDiff 用：哪些字段变了（只给字段名，不给值） */
export function changedContactFields(before: TenantContactRow, after: TenantContactRow): ContactField[] {
  return CONTACT_FIELDS.filter((k) => (before[k] ?? null) !== (after[k] ?? null))
}
