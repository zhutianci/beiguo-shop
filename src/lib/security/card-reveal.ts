/**
 * 后台查看卡密明文的统一闸门（2026-10-24 第二轮加固，docs/安全-第二轮加固-1024.md 第三节 #1）。
 *
 * 【为什么】导出接口早就有「每分钟 3 次 + 推送」，但列表带 reveal=1（每页 200 张）和单张明文接口什么都没有：
 * 偷到一个后台登录态就能循环翻完整个卡池（含未售库存），不留任何痕迹。现在三件事一起做：
 *  ① 二次验证（lib/security/sudo.ts，10 分钟内输过登录密码）；
 *  ② 同一管理员 10 分钟最多 30 次明文请求（正常对账翻几页用不完）；
 *  ③ 每次写 audit_events（card.reveal），后台「系统设置 → 安全」能看到。
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '../auth'
import { rateLimited } from '../news/rate-limit'
import { writeAudit } from '../audit'
import { requireSudo } from './sudo'

export async function cardRevealGate(req: Request, what: string): Promise<NextResponse | null> {
  const sudo = await requireSudo()
  if (sudo) return sudo
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  if (rateLimited(`cardkey-reveal:${user.id}`, { windowMs: 10 * 60_000, max: 30 })) {
    return NextResponse.json({ success: false, error: '查看卡密明文过于频繁，请 10 分钟后再试' }, { status: 429 })
  }
  void writeAudit(null, {
    actorKind: 'PLATFORM',
    actorUserId: user.id,
    action: 'card.reveal',
    targetType: 'cardkey',
    targetId: what.slice(0, 40),
    req,
  }).catch((e) => console.error('[card-reveal] 审计写入失败', (e as Error)?.message))
  return null
}
