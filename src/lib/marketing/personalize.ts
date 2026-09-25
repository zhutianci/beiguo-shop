/**
 * 发送时的逐封个性化：对冻结的快照做一次正则替换（回调式，替换出来的值不会被再次扫描）。
 * 分语境转义：HTML 正文转义、纯文本原文、主题原文去掉 \r\n\t。占位符语法见设计文档 5.9。
 *
 * 同构纯函数（worker 与单测都用）。【实现方：渲染器】签名是契约。
 *
 * 【为什么必须单趟回调】如果按变量逐个 replaceAll，先替换进去的昵称若恰好是「{{mkt_unsub}}」，
 * 下一轮就会被展开成真实退订链接 —— 用户文字变成了我们生成的链接/HTML。回调式单趟替换里，
 * 回调的返回值不会再被正则看到，从根上杜绝二次展开。
 */
import { escapeHtml } from './richtext'
import { DEFAULT_GREETING_NAME } from './types'
import { FIRST_NOTICE_SENTENCE, mergeTagRe, safeBodyEmail, safeNickname, tagDefault } from './lint'

export interface PersonalizeVars {
  /** 已经过 safeNickname 的昵称；null → 用占位里的默认值，再没有就用「朋友」 */
  nickname: string | null
  email: string
  /** 直发券到期日展示文字（如「2026年10月7日」）；没有券时为空串 */
  couponExpires: string
  /** 形如 https://bigolab.com/api/mkt/c/<token>/ —— 后面直接拼 idx */
  linkBase: string
  unsubscribeUrl: string
  prefsUrl: string
  openPixelUrl: string
  /** 首次收到营销邮件的说明句；非首次为空串 */
  notice: string
}

type Ctx = 'html' | 'text' | 'subject'

/** 昵称：占位里的默认值（合法才用）→ 再回落「朋友」。再过一遍 safeNickname（幂等），调用方漏洗也兜得住 */
function nicknameFor(v: Pick<PersonalizeVars, 'nickname'>, rawDefault: string | undefined): string {
  const def = tagDefault(rawDefault) || DEFAULT_GREETING_NAME
  return safeNickname(v.nickname, def)
}

function run(src: string, ctx: Ctx, v: Partial<PersonalizeVars> & Pick<PersonalizeVars, 'nickname'>): string {
  if (!src) return ''
  const out = (s: string) => (ctx === 'html' ? escapeHtml(s) : s)
  return src.replace(mergeTagRe(), (whole: string, name: string, idx: string | undefined, def: string | undefined) => {
    if (ctx === 'subject') {
      // 主题只认昵称；其余一律抹掉 —— 宁可主题少几个字，也不把邮箱/链接塞进主题
      if (name !== 'nickname' || idx !== undefined) return ''
      return nicknameFor(v, def).replace(/[\r\n\t]+/g, ' ')
    }
    if (idx !== undefined) {
      if (name === 'mkt_link') return out(`${v.linkBase ?? ''}${Number(idx)}`)
      return whole
    }
    switch (name) {
      case 'nickname':
        return out(nicknameFor(v, def))
      case 'email':
        // QQ 号邮箱原样代入 = 正文里出现 QQ 号，发送前的禁发词扫描看不到（只扫过模板占位），阿里云会拒发（审查 C7）
        return out(safeBodyEmail(v.email))
      case 'coupon_expires':
        return out(v.couponExpires ?? '')
      case 'mkt_unsub':
        return out(v.unsubscribeUrl ?? '')
      case 'mkt_prefs':
        return out(v.prefsUrl ?? '')
      case 'mkt_open':
        return ctx === 'html' ? out(v.openPixelUrl ?? '') : ''
      case 'mkt_notice':
        return out(v.notice ?? '')
      default:
        // 未知变量原样保留：lint 已阻断，这里不猜
        return whole
    }
  })
}

export function personalizeHtml(html: string, v: PersonalizeVars): string {
  return run(html, 'html', v)
}

export function personalizeText(text: string, v: PersonalizeVars): string {
  return run(text, 'text', v)
}

export function personalizeSubject(subject: string, v: Pick<PersonalizeVars, 'nickname'>): string {
  return run(subject, 'subject', v).replace(/[\r\n\t]+/g, ' ')
}

export const FIRST_NOTICE_TEXT = FIRST_NOTICE_SENTENCE
