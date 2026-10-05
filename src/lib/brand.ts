/**
 * 店面品牌：服务端与写入校验入口。re-export src/lib/brand-base.ts，再加上要用 marketing/lint 的禁发词校验
 * （为什么拆两个文件见 brand-base.ts 文件头）。服务端代码一律从 '@/lib/brand' import。
 *
 * 【站名要过阿里云禁发词】站名会进交易邮件的标题、发件人名和正文（mail.ts）：带「微信」「QQ群」之类的词，
 * 一次投诉就可能冻结整个发信账号（含验证码 no-reply）。其余文字字段只出现在网页上，只做格式与冒充官方的检查。
 */
import { findBannedWord } from './marketing/lint'
import { checkBrandTextFormat, type BrandFieldCheck, type BrandTextField } from './brand-base'

export * from './brand-base'

export function checkBrandText(field: BrandTextField, v: unknown): BrandFieldCheck {
  const r = checkBrandTextFormat(field, v)
  if (!r.ok || r.value === null || field !== 'brandName') return r
  const hit = findBannedWord(r.value)
  if (hit) return { ok: false, error: `网站名称不能包含「${hit}」（会进系统邮件标题，邮件服务禁止）` }
  return r
}
