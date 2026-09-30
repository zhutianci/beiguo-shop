export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson, setPrimaryDomain, tenantDetail, upsertDomain } from '@/lib/tenant/admin-tenants'

/**
 * 渠道域名（设计 4.4；docs/多渠道分销-自定义域名.md 第 3 节）。两类域名：*.bigolab.com 一级子域名，以及客户自己的自定义域名（tibo.pw）；
 * 拒绝主站域名、IP、内网名、多级子域。停用的域名解析返回 404、绝不回落主站。
 *  · { host, status: 0|1 }            添加 / 启用 / 停用（主域名不能停用）
 *  · { action: 'primary', host }      设为主域名：同步 Tenant.origin，写审计与站内通知（只能选已启用的域名）。
 *                                      自定义域名先经公网校验接到本站（契约第 9 节，不通过 400、不改任何东西）；对已是主域名的自定义域名
 *                                      再调一次 = 立即重新校验并刷新记录（后台「重新校验」按钮）
 * 授权：adminGuard（主站店面 + ADMIN 查库复核 + 同源）；校验与写库全在 admin-tenants.ts。
 */

const hostField = z.string().trim().min(3).max(120)
// 两种动作分开写 schema。设主域名用 strict：同时带 status 的请求意图不明（是要顺便启停？），整体 400；
// 启停保持原来的宽松解析（老调用方不带 action，多余字段照旧忽略）
const bodySchema = z.union([
  z.object({ action: z.literal('primary'), host: hostField }).strict(),
  z.object({ action: z.literal('status').optional(), host: hostField, status: z.union([z.literal(0), z.literal(1)]) }),
])

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success((await tenantDetail(id)).domains)
  } catch (e) {
    return adminFail(e, '域名列表')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, bodySchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    if (body.action === 'primary') {
      const r = await setPrimaryDomain(id, body.host, adminId)
      return success(r, r.changed ? `主域名已改为 ${r.origin}` : '已经是主域名')
    }
    await upsertDomain(id, body.host, body.status, adminId)
    return success(null, '已保存')
  } catch (e) {
    return adminFail(e, body.action === 'primary' ? '设为主域名' : '保存域名')
  }
}
