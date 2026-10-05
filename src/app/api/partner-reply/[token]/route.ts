export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { getStorefront, type Storefront } from '@/lib/storefront/resolve'
import { tenantReplyEnabled, verifyTenantReplyToken, type TenantReplyClaim } from '@/lib/bot/tenant-reply'
import { partnerQuickReplyPost, partnerQuickReplyView, QUICK_REPLY_MAX_LEN } from '@/lib/partner-services/messages'

/**
 * 渠道快速回复接口（docs/微信机器人-设计.md §5.5，站长 Q10）。分站群里的买家留言推送带 <渠道 origin>/partner-reply/<令牌>，
 * 代理点开就能读这一单的留言、以「本店」身份回一条（买家看到的是「客服」）。
 *
 * 令牌即凭证（默认 7 天），middleware 不经过这条路径（matcher 的 /api/partner/:path* 按路径段匹配，命中不了独立的一级路径
 * /api/partner-reply），partnerRoute 也不管它，鉴权全在这里：
 *  1. 店面解析放第一句、不包进 try（getStorefront 在构建期靠抛异常转动态，写法同 api/track/view）；
 *  2. BOT_TENANT_REPLY 没开 → 404（功能整体不存在）；
 *  3. 只在渠道自己的域名上可用：店面必须是 CHANNEL 且 = 令牌里的分站。主站 Host、别的渠道的 Host、休眠期（任何 Host 都是主站）一律 404；
 *     店面状态与渠道后台的留言接口同一口径（partnerRoute）：停业（TERMINATED）、筹备中（DRAFT，order.message 不是 DRAFT 可用点）404，
 *     暂停营业（SUSPENDED）只读——能看、不能回（403，否则这条链接就成了绕开暂停营业的口子）；
 *  4. 令牌验不过 → 404，不区分原因（格式、签名、过期、分站不符都是同一个响应）；
 *  5. 订单按 (订单号, 分站) 取（partner-services/messages），不是本站的单与不存在一样 404。
 * 能力被刻意限死：只读这一单的订单摘要（无买家邮箱、无卡密与交付信息）与最近 100 条留言，只能回一条（≤ 1000 字）。
 * 回复与渠道后台同一流程：senderRole='PARTNER'、买家留言标渠道已读、审计（actorUserId 留空、via:'partner-reply'）、买家「客服已回复」提醒。
 *
 * 与平台快捷回复（api/quick-reply）刻意分开：那边的令牌只发平台群、渠道 Host 上一律 404；这里反过来，主站 Host 上一律 404。
 * 不做同源校验（同平台快捷回复）：凭证是 URL 里的令牌，没有任何 cookie 身份，跨站页面拿不到令牌就什么也做不了。
 * 所有响应 no-store：里面有留言原文。
 */

/** 限频（进程内，lib/news/rate-limit；前缀写死）：读按 IP；回复按令牌（设计 §5.5：10 分钟 20 条）、再按 IP（挡一个来源拿多条链接轮着刷） */
const VIEW_PER_IP = { windowMs: 60_000, max: 60 }
const REPLY_PER_TOKEN = { windowMs: 10 * 60_000, max: 20 }
const REPLY_PER_IP = { windowMs: 10 * 60_000, max: 60 }

function noStore<T extends NextResponse>(res: T): T {
  res.headers.set('Cache-Control', 'no-store')
  return res
}

/** 一切「没有这回事」的情况共用同一个响应（与 denyOnChannel 的 404 同体） */
const notFound404 = () => noStore(error('资源不存在', 404))

/**
 * 第 2–4 步：功能开关、店面状态、令牌（含「令牌的分站 = 当前店面」）。任何一步不过都返回 null，调用方统一 404。
 * 与页面 src/app/partner-reply/[token]/page.tsx 同一口径，改一处要同时改另一处。
 */
function claimOn(sf: Storefront | null, token: string): TenantReplyClaim | null {
  if (!tenantReplyEnabled()) return null
  if (!sf || sf.kind !== 'CHANNEL' || sf.status === 'TERMINATED' || sf.status === 'DRAFT') return null
  const claim = verifyTenantReplyToken(String(token || ''))
  return claim && claim.tenantId === sf.id ? claim : null
}

/** 读这一单：订单摘要 + 最近 100 条留言（只读，不标已读） */
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const sf = await getStorefront() // 第一句、不包进 try
  const claim = claimOn(sf, params.token)
  if (!sf || !claim) return notFound404()
  try {
    if (rateLimited(`preply-view:${clientIp(request.headers)}`, VIEW_PER_IP)) return noStore(error('访问太频繁，请稍后再试', 429))
    const view = await partnerQuickReplyView(sf.id, claim.orderNo)
    if (!view) return notFound404()
    return noStore(success({ ...view, expiresAt: claim.expiresAt.toISOString() }))
  } catch (err) {
    console.error('[partner-reply] 读取失败', (err as Error)?.message || err)
    return noStore(error('加载失败，请稍后再试', 500))
  }
}

const replySchema = z.object({
  content: z.string().trim().min(1, '请输入回复内容').max(QUICK_REPLY_MAX_LEN, `回复不能超过 ${QUICK_REPLY_MAX_LEN} 字`),
})

/** 以「本店」身份回一条 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const sf = await getStorefront() // 第一句、不包进 try
  const claim = claimOn(sf, params.token)
  if (!sf || !claim) return notFound404()
  if (sf.status === 'SUSPENDED') return noStore(error('店铺暂停营业中，暂时只能查看留言、不能回复', 403))
  try {
    if (
      rateLimited(`preply-post-ip:${clientIp(request.headers)}`, REPLY_PER_IP) ||
      rateLimited(`preply-post:${params.token}`, REPLY_PER_TOKEN)
    ) {
      return noStore(error('回复过于频繁，请稍后再试', 429))
    }
    const parsed = replySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return noStore(error(parsed.error.errors[0].message))

    const row = await partnerQuickReplyPost(sf.id, claim.orderNo, parsed.data.content, request)
    if (!row) return notFound404()
    return noStore(success({ row }, '已回复，买家在订单页即可看到'))
  } catch (err) {
    console.error('[partner-reply] 回复失败', (err as Error)?.message || err)
    return noStore(error('回复失败，请稍后再试', 500))
  }
}
