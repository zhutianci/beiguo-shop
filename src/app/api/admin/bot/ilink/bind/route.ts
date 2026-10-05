export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { cardKeyConfigured } from '@/lib/cardkey'
import { rateLimited } from '@/lib/news/rate-limit'
import { adapterName, ensureIlinkLoops } from '@/lib/bot/adapters'
import { handleInbound } from '@/lib/bot/inbound'
import { cancelIlinkBind, getIlinkBind, startIlinkBind } from '@/lib/bot/ilink-bind'
import { auditSoft, currentActor, parseId, readBody } from '@/app/api/admin/bot/_lib/common'

/**
 * 微信绑定（iLink，docs/微信机器人-设计.md 附录 E）：
 *  · POST { kind: 'MGMT', adminId, allowT3? } 把一个微信绑成某位管理员（收全站动态、能发指令）；
 *    POST { kind: 'TENANT', tenantId }           给某个分站绑一个接收推送的微信（代理用）。
 *    返回二维码图片与「在微信里点开」的链接；后台在本进程里轮询扫码状态。
 *  · GET ?id=  取这次绑定的进度（页面每 2 秒问一次）；DELETE ?id= 取消。
 * 二维码等同于绑定凭据（谁先扫绑到谁），响应带 no-store、不写日志。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    if (adapterName() !== 'ilink') return error('当前机器人不是 iLink 方式（.env.production 设 BOT_ADAPTER=ilink 后重启 app）', 409)
    if (!cardKeyConfigured()) return error('没有配置 CARDKEY_SECRET，无法加密保存绑定凭据', 503)
    if (rateLimited('botilink:start', { windowMs: 60_000, max: 5 })) return error('操作太频繁，请 1 分钟后再试', 429)
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const actor = await currentActor()
    let target: Parameters<typeof startIlinkBind>[0]
    if (body.kind === 'MGMT') {
      const adminId = typeof body.adminId === 'number' ? body.adminId : parseId(String(body.adminId ?? ''))
      const admin = adminId ? await prisma.botAdmin.findUnique({ where: { id: adminId } }) : null
      if (!admin) return error('请选择要绑定的管理员（没有的话先到「管理员」页添加）')
      if (!admin.enabled) return error('这位管理员已停用')
      target = { kind: 'MGMT', adminId: admin.id, tenantId: null, allowT3: body.allowT3 === true, name: `管理员「${admin.name}」的微信`, actorUserId: actor.userId }
    } else if (body.kind === 'TENANT') {
      const tenantId = typeof body.tenantId === 'number' ? body.tenantId : parseId(String(body.tenantId ?? ''))
      const t = tenantId && tenantId !== 1 ? await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, code: true, name: true, status: true } }) : null
      if (!t) return error('请选择分站')
      if (t.status === 'TERMINATED') return error('这个分站已停业，不能再绑定')
      target = { kind: 'TENANT', adminId: null, tenantId: t.id, allowT3: false, name: `分站 ${t.name}（${t.code}）的代理微信`, actorUserId: actor.userId }
    } else {
      return error('绑定类型只能是管理员（MGMT）或分站（TENANT）')
    }
    const r = await startIlinkBind(target, () => ensureIlinkLoops(handleInbound))
    // 424：取二维码是微信那边的失败（不用 502：经 Cloudflare 时 502 的响应体会被换掉，页面看不到原因）
    if (!r.ok) return error(r.error, 424)
    await auditSoft(request, actor, 'bot.admin.ilink_bind_start', { type: 'bot', id: 'ilink' }, { kind: target.kind, adminId: target.adminId, tenantId: target.tenantId, allowT3: target.allowT3 })
    const res = success(r.view)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] 开始微信绑定失败', e)
    return error('开始微信绑定失败', 500)
  }
}

export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  const id = request.nextUrl.searchParams.get('id') || ''
  const view = /^[0-9a-f]{24}$/.test(id) ? getIlinkBind(id) : null
  if (!view) return error('这次绑定已经结束很久或不存在，请重新生成二维码', 404)
  const res = success(view)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function DELETE(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  const id = request.nextUrl.searchParams.get('id') || ''
  if (!/^[0-9a-f]{24}$/.test(id) || !cancelIlinkBind(id)) return error('这次绑定已经结束或不存在', 404)
  return success({ ok: true }, '已取消')
}
