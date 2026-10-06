/**
 * 内容页转化入口与作者内推返现（内容平台 P3，设计 §13.1；§18-5 默认：做，L2 及以上，CTA 由系统统一渲染）。
 *
 * CTA 链接 = 标签上登记的落地页 + `?from=c{内容 id}`；作者满足下面全部条件时再加 `&ref={作者内推码}`：
 *   · 作者是 L2 及以上（3 篇精选 / 积分 ≥300 / 共建者 / 认证创作者）—— 新人不能靠发帖拿返现，堵小号刷单；
 *   · 作者已经有内推码（在「我的 → 推广返现」里开通过；这里不替人生成，返现是作者自己选择参加的）；
 *   · 账号正常；不是管理员（站方编辑写的内容不该给编辑个人返现）；
 *   · 编辑没有对这一篇关闭（forum_posts.cta_ref_off）。
 * 落地页（/chongzhi/*）用 RefCapture 把 ref 存进 localStorage，之后在商品页下单时照现有内推规则成交与结算
 * （lib/pricing.ts → lib/referral.ts settleReferral），返现进作者的**可提现**返现格。内容平台这边不碰钱。
 * 作者不能自己写购买链接带 ref：正文里本站链接的 ref 参数会在渲染时剥掉（lib/markdown.ts stripSiteRef）。
 */
import { prisma } from '../db'
import { trustLevelOf } from '../forum-server'

export async function authorRefCode(post: { userId: number | null; ctaRefOff: boolean }): Promise<string | null> {
  if (!post.userId || post.ctaRefOff) return null
  try {
    const u = await prisma.user.findUnique({ where: { id: post.userId }, select: { id: true, role: true, status: true, referralCode: true } })
    if (!u?.referralCode || u.status !== 1 || u.role === 'ADMIN') return null
    return (await trustLevelOf(u)) >= 2 ? u.referralCode : null
  } catch (e) {
    console.error('[content cta ref]', e)
    return null
  }
}

/** 落地页地址加上来源（from=c{id}）与作者内推码 */
export function ctaHref(landingPath: string, postId: number, ref: string | null): string {
  const q = new URLSearchParams({ from: `c${postId}` })
  if (ref) q.set('ref', ref)
  return `${landingPath}${landingPath.includes('?') ? '&' : '?'}${q.toString()}`
}

/** 从 from 参数里取内容 id（c123 → 123） */
export function parseFrom(v: string | null | undefined): number | null {
  const m = /^c(\d{1,9})$/.exec(v ?? '')
  return m ? Number(m[1]) : null
}
