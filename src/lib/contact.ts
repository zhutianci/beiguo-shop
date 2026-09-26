/**
 * 店面客服信息（二期改动 4.1、4.4）：服务端与校验入口。re-export src/lib/contact-base.ts 的全部内容，
 * 再加上要用 zod / marketing/lint 的完整字段校验——为什么拆两个文件见 contact-base.ts 文件头。
 *
 * 【谁用】
 *  · 店面解析（storefront/resolve.ts）：resolveStoreContact(tenantRow)；
 *  · 渠道设置中心（经 tenant/partner-facade.ts 的 setTenantContact，facade 内调用这里的 check*）；
 *  · 超管渠道详情 PATCH（zod：contactPatchShape）；
 *  · 服务端页面、product-intro、support-faq、legal-page：PLATFORM_CONTACT 与 StoreContact 类型。
 *
 * 【写入规则】（二期改动 4.4）
 *  · 微信号：CONTACT_WECHAT_RE；
 *  · 邮箱：zod email()、≤120 字、且 findBannedWord(email) === null——「5 位以上数字@qq.com」「wechat…@」这类邮箱会进交易邮件页脚，
 *    命中阿里云禁发规则一次投诉就可能冻结整个发信账号（含验证码 no-reply）；
 *  · 服务时间：CONTACT_HOURS_RE；
 *  · 二维码地址：只由服务端写入（上传落盘后拿到的相对路径），CONTACT_QR_URL_RE；客户端提交的 URL 一律不收。
 *  · 输入 null / 空串 / 全空白 = 清空该项（返回 value:null）。
 */
import { z } from 'zod'
import { findBannedWord } from './marketing/lint'
import {
  CONTACT_EMAIL_MAX,
  isValidContactHours,
  isValidContactQrUrl,
  isValidContactWechat,
} from './contact-base'

export * from './contact-base'

export type ContactFieldCheck = { ok: true; value: string | null } | { ok: false; error: string }

/** 统一的「清空」判定：null / undefined / 空串 / 全空白 → 清空 */
function blank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

export function checkContactWechat(v: unknown): ContactFieldCheck {
  if (blank(v)) return { ok: true, value: null }
  if (typeof v !== 'string') return { ok: false, error: '微信号格式不正确' }
  const s = v.trim()
  if (!isValidContactWechat(s)) return { ok: false, error: '微信号只能包含字母、数字、下划线、横线或汉字，最多 30 个字符' }
  return { ok: true, value: s }
}

const zEmail = z.string().email()

/** 客服邮箱：语法（zod email）+ 长度 + 禁发词。统一转小写存储（库的排序规则大小写不敏感，展示也统一） */
export function checkContactEmail(v: unknown): ContactFieldCheck {
  if (blank(v)) return { ok: true, value: null }
  if (typeof v !== 'string') return { ok: false, error: '客服邮箱格式不正确' }
  const s = v.trim().toLowerCase()
  if (s.length > CONTACT_EMAIL_MAX || !zEmail.safeParse(s).success) return { ok: false, error: '客服邮箱格式不正确' }
  // 尖括号、引号即使 zod 放过也不收：这个值会进邮件页脚与页面
  if (/[<>"'`\s]/.test(s)) return { ok: false, error: '客服邮箱格式不正确' }
  const hit = findBannedWord(s)
  if (hit) return { ok: false, error: `该邮箱会被邮件服务商判为违规内容（命中「${hit}」），请换一个邮箱（例如不以长数字开头的 QQ 邮箱别名）` }
  return { ok: true, value: s }
}

export function checkContactHours(v: unknown): ContactFieldCheck {
  if (blank(v)) return { ok: true, value: null }
  if (typeof v !== 'string') return { ok: false, error: '服务时间格式不正确' }
  const s = v.trim().replace(/\s+/g, ' ')
  if (!isValidContactHours(s)) return { ok: false, error: '服务时间最多 40 个字，只能包含数字、空格、冒号、横线、波浪线和汉字（如「9:00-22:00」）' }
  return { ok: true, value: s }
}

/** 二维码地址（只给服务端写入路径与超管 PATCH 复核用；客户端提交的上传结果也必须过这一关） */
export function checkContactQrUrl(v: unknown): ContactFieldCheck {
  if (blank(v)) return { ok: true, value: null }
  if (!isValidContactQrUrl(v)) return { ok: false, error: '二维码地址不合法（只接受本站上传的客服二维码）' }
  return { ok: true, value: v }
}

/** 把 check* 包成 zod 字段：输出 string | null，校验失败的提示原样作为 zod 错误信息 */
function zField(check: (v: unknown) => ContactFieldCheck) {
  return z
    .union([z.string().max(200), z.null()])
    .transform((v, ctx) => {
      const r = check(v)
      if (!r.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.error })
        return z.NEVER
      }
      return r.value
    })
}

export const contactWechatSchema = zField(checkContactWechat)
export const contactEmailSchema = zField(checkContactEmail)
export const contactHoursSchema = zField(checkContactHours)
export const contactQrUrlSchema = zField(checkContactQrUrl)

/**
 * 超管 PATCH /api/admin/tenants/[id] 的客服字段（展开进现有 strict 的 patchSchema）：
 *   const patchSchema = z.object({ …现有字段, ...contactPatchShape }).strict()
 * 每项可缺省（不改）；null 或空串 = 清空。supportQrUrl 只接受 CONTACT_QR_URL_RE（/api/upload scope=contact 的返回值）。
 * 格式之外的归属约束这里做不了（本文件纯函数、不查库），调用方必须在事务里补两步：
 *   · 写入前 upload-store 的 contactUploadOwnedByOtherTenant(url, id, tx) 为 true → 拒绝（一个二维码文件只归一个渠道）；
 *   · 提交后若旧值被换掉 / 清空 → releaseContactUpload(旧值)（仍有渠道引用就不删，绝不直接 deleteContactUpload）。
 */
export const contactPatchShape = {
  supportWechat: contactWechatSchema.optional(),
  supportQrUrl: contactQrUrlSchema.optional(),
  supportEmail: contactEmailSchema.optional(),
  supportHours: contactHoursSchema.optional(),
}

/**
 * 渠道 PUT /api/partner/settings/contact 的请求体（JSON）：{ wechat?, email?, hours? }，**没有 qrUrl**（二维码只走上传接口）。
 * 每项可缺省（不改）；null 或空串 = 清空。strict：多给字段（例如 qrUrl）直接 400。
 */
export const partnerContactInputSchema = z
  .object({
    wechat: contactWechatSchema.optional(),
    email: contactEmailSchema.optional(),
    hours: contactHoursSchema.optional(),
  })
  .strict()
export type PartnerContactInput = z.input<typeof partnerContactInputSchema>
