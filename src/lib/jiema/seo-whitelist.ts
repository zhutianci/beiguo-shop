/**
 * 短信接码的 SEO 白名单（docs/SEO-重构/SEO-重构设计.md §0.3 #33、#34、§1.2、§1.6，批 2 的 C / AJ / F1）。
 *
 * 【为什么是代码常量、不取后台 hotRank】首页和 /jiema 服务端直出的「热门服务」区块会被收录、被 AI 摘录。
 * 后台默认 hotServices 第 3 位是 Telegram（jiema-config-schema.ts），按 hotRank 直出就会在可收录页上推 Telegram、
 * 国内实名平台、金融 / 支付 / 加密货币服务。所以服务端直出的只有这份常量：
 *  · 排除 tg（Telegram）、services-cn.json 里的国内平台（wb、hw、za、zp、qf、kf、li、qq、xk、zs）、
 *    lf（名字里带「抖音」）、金融 / 支付 / 加密货币（ts、aon、re、md、bou）、ka（台湾语境）；
 *  · 后台 hotRank 只影响客户端目录排序与 cron 预热，与这里脱钩。
 *
 * 【slug 是本站自己的，不是上游代码】公开链接写 `/jiema?svc=<slug>`，客户端按这张表映射回上游代码（jiema-client 的 parseUrl）。
 * 上游代码（dr、go、wa…）是上游平台的代码体系，写进服务端直出的链接等于暴露上游（R5 §3.2）；
 * check-seo-copy 的 svc-upstream 规则把 1–3 位小写字母数字的 svc 值判为上游代码形态，所以 slug 一律 ≥4 个字符（x 写成 twitter）。
 * 旧的 `?s=<code>` 继续认（分享链接、登录回跳），站内不再生成。
 *
 * 【name 是本站写的展示名】不取库里的 nameCn（后台可改，改出国内平台名就会进可收录页）。
 * 「中国台湾 / 中国香港 / 中国澳门」的地区命名规则（D44）在这里用不到：只是服务名。
 *
 * 纯常量，不 import 任何服务端模块：客户端组件（jiema-client）要 import 它。
 */

export interface JiemaSeoService {
  /** 本站 slug（URL 里的 svc 值），≥4 个字符、全小写 */
  slug: string
  /** 上游服务代码（只在服务端 / 客户端内部映射时用，不进任何 href） */
  code: string
  /** 展示名 */
  name: string
  /** 一句话场景（如实写：只说「接收验证码」，不承诺能通过平台验证） */
  use: string
}

export const JIEMA_SEO_SERVICES: readonly JiemaSeoService[] = [
  { slug: 'openai', code: 'dr', name: 'OpenAI（ChatGPT）', use: 'ChatGPT、OpenAI 平台的手机验证码' },
  { slug: 'claude', code: 'acz', name: 'Claude', use: 'Claude 注册与登录的手机验证码' },
  { slug: 'google', code: 'go', name: '谷歌（Gmail）', use: '谷歌、Gmail 注册时的手机验证码' },
  { slug: 'whatsapp', code: 'wa', name: 'WhatsApp', use: 'WhatsApp 注册验证码' },
  { slug: 'instagram', code: 'ig', name: 'Instagram', use: 'Instagram 注册与安全验证码' },
  { slug: 'facebook', code: 'fb', name: 'Facebook', use: 'Facebook 注册与登录验证码' },
  { slug: 'twitter', code: 'tw', name: 'X（推特）', use: 'X 账号注册验证码' },
  { slug: 'discord', code: 'ds', name: 'Discord', use: 'Discord 手机验证' },
  { slug: 'microsoft', code: 'mm', name: '微软（Outlook）', use: '微软账号、Outlook 注册验证码' },
  { slug: 'amazon', code: 'am', name: '亚马逊（Amazon）', use: '亚马逊账号注册验证码' },
] as const

const BY_SLUG = new Map(JIEMA_SEO_SERVICES.map((s) => [s.slug, s]))

/** svc=<slug> → 上游代码；不在白名单里返回 null（客户端当作没有预选） */
export function jiemaCodeForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null
  return BY_SLUG.get(slug.trim().toLowerCase())?.code ?? null
}

/** 站内预选链接：/jiema?svc=<slug>（不在白名单里的服务不生成服务端链接，§1.2 第 3 条） */
export function jiemaSvcHref(slug: string): string {
  return `/jiema?svc=${encodeURIComponent(slug)}`
}
