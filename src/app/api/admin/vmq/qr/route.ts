export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin, verifyPassword } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { notifyPayQrChanged } from '@/lib/notify'
import { storePayQr, deletePayQrUpload, PAY_QR_MAX_BYTES } from '@/lib/upload-store'
import {
  BUILTIN_QR_ID,
  PAY_QR_MAX_ITEMS,
  PayQrError,
  builtinQrLabel,
  builtinQrUrl,
  normalizePayQrLabel,
  payQrLabel,
  type PayQrState,
} from '@/lib/pay-qr-base'
import { addPayQrItem, deletePayQrItem, getPayQrState, resetPayQr, switchPayQr } from '@/lib/pay-qr'
import { CHANNEL_LABEL, parseChannel, type PayChannel } from '@/lib/pay-channel'

/**
 * 收银台收款码管理（仅超管）：GET 列表 / POST 上传一张 / PUT 切换当前生效的（或重置）/ DELETE 删除一张。
 * 支付宝与微信各一组：GET 带 ?channel=wechat，写操作在请求体（上传是表单字段）带 channel；不带 = 支付宝（与原来一致）。
 * 微信没有内置码，那一项叫「未启用」：设为当前 = 收银台不再出现微信支付。
 *
 * 【每个写操作都要再输一次登录密码】收款码决定买家的钱付给谁——拿到一个还没过期的后台会话，不该就能把收款码换成别人的。
 * 按管理员限频（10 分钟 12 次写操作，含输错密码的）。每次变更写审计并推送（notifyPayQrChanged），不是站长本人做的能第一时间发现。
 * 上传只是把图存进列表，**不会**自动生效：要再点一次「设为当前」，给站长一次核对图片的机会。
 */

// multipart 的边界与字段头有少量开销
const MAX_BODY = PAY_QR_MAX_BYTES + 64 * 1024

function view(s: PayQrState, channel: PayChannel) {
  return {
    channel,
    activeId: s.activeId,
    switchedAt: s.switchedAt,
    max: PAY_QR_MAX_ITEMS,
    items: [
      // 微信的这一项没有图（url = null）
      { id: BUILTIN_QR_ID, label: builtinQrLabel(channel), url: builtinQrUrl(channel), addedAt: null as number | null, builtin: true },
      ...s.items.map((i) => ({ id: i.id, label: i.label, url: i.url as string | null, addedAt: i.addedAt as number | null, builtin: false })),
    ],
    history: s.history
      .slice()
      .reverse()
      .map((h) => ({ at: h.at, by: h.by, from: h.fromLabel ?? payQrLabel(s, h.from, channel), to: h.toLabel ?? payQrLabel(s, h.to, channel) })),
  }
}

/** 没带 = 支付宝；带了但不认识 → null（调用方回 400） */
function channelArg(v: unknown): PayChannel | null {
  return v === undefined || v === null || v === '' ? 'alipay' : parseChannel(v)
}

function fail(e: unknown, fallback: string) {
  if (e instanceof PayQrError) return error(e.message, e.code === 'CORRUPT' ? 409 : 400)
  console.error('[admin/vmq/qr]', fallback, e)
  return error(fallback, 500)
}

/** 当前管理员 + 复核登录密码。返回 Response = 已拒绝 */
async function adminWithPassword(password: unknown): Promise<{ id: number } | Response> {
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  if (typeof password !== 'string' || !password) return error('请输入当前登录密码')
  if (rateLimited(`payqr-pw:${me.id}`, { windowMs: 10 * 60_000, max: 12 })) return error('操作过于频繁，请 10 分钟后再试', 429)
  const u = await prisma.user.findUnique({ where: { id: me.id }, select: { passwordHash: true } })
  if (!u || !(await verifyPassword(password, u.passwordHash))) return error('登录密码不正确', 403)
  return me
}

async function audit(request: NextRequest, adminId: number, action: string, targetId: string, diff: unknown) {
  await writeAudit(null, { actorUserId: adminId, actorKind: 'PLATFORM', action, targetType: 'setting', targetId, diff, req: request }).catch((e) =>
    console.error('[admin/vmq/qr] 审计写入失败', action, e)
  )
}

function ipOf(request: NextRequest): string | null {
  const ip = clientIp(request.headers)
  return ip && ip !== 'unknown' ? ip : null
}

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  const channel = channelArg(new URL(request.url).searchParams.get('channel'))
  if (!channel) return error('channel 只能是 alipay / wechat')
  try {
    return success(view(await getPayQrState(channel), channel))
  } catch (e) {
    // 配置读坏：收银台此刻不显示收款码。把原因带回页面，由站长点「恢复为内置收款码」
    if (e instanceof PayQrError && e.code === 'CORRUPT') return success({ corrupt: true, message: e.message })
    return fail(e, '获取收款码失败')
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const declared = Number(request.headers.get('content-length') || '')
    if (!Number.isFinite(declared) || declared <= 0) return error('请求缺少 Content-Length', 411)
    if (declared > MAX_BODY) return error('收款码图片不能超过 2MB', 413)

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return error('上传内容格式不正确')
    }
    const me = await adminWithPassword(form.get('password'))
    if (me instanceof Response) return me
    const channel = channelArg(form.get('channel'))
    if (!channel) return error('channel 只能是 alipay / wechat')
    const ch = CHANNEL_LABEL[channel]

    const label = normalizePayQrLabel(form.get('label'))
    if (!label) return error('请填写收款码名称（1–30 个字符，例如「主号 尾号 1234」）')
    const file = form.get('file')
    if (!file || !(file instanceof File)) return error('未找到上传文件')
    if (file.size > PAY_QR_MAX_BYTES) return error('收款码图片不能超过 2MB')
    // 满了就别落盘（addPayQrItem 里还会再判一次，这里只是少写一个孤儿文件）
    if ((await getPayQrState(channel)).items.length >= PAY_QR_MAX_ITEMS) return error(`最多保存 ${PAY_QR_MAX_ITEMS} 张收款码，请先删除不用的`)

    const stored = await storePayQr(Buffer.from(await file.arrayBuffer()))
    if (!stored.ok) {
      if (stored.reason === 'size') return error('收款码图片不能超过 2MB')
      if (stored.reason === 'type') return error('只支持 PNG / JPG / WebP 格式的收款码图片')
      return error('图片存储空间已满，请先清理', 507)
    }
    let r: Awaited<ReturnType<typeof addPayQrItem>>
    try {
      r = await addPayQrItem(channel, { label, url: stored.url, by: me.id })
    } catch (e) {
      await deletePayQrUpload(stored.url).catch(() => {})
      throw e
    }
    await audit(request, me.id, 'vmq.qr.add', r.item.id, { channel, label, url: stored.url })
    notifyPayQrChanged({ action: '新增', detail: `${ch}：新增「${label}」（尚未生效，需再点「设为当前」）`, adminId: me.id, ip: ipOf(request) })
    return success(view(r.state, channel), '已上传，核对无误后点「设为当前」')
  } catch (e) {
    return fail(e, '上传失败')
  }
}

const channelSchema = z.enum(['alipay', 'wechat']).optional()
const putSchema = z.union([
  z.object({ id: z.string().min(1).max(20), password: z.string().min(1).max(200), channel: channelSchema }).strict(),
  z.object({ reset: z.literal(true), password: z.string().min(1).max(200), channel: channelSchema }).strict(),
])

export async function PUT(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = putSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error('参数不正确')
    const me = await adminWithPassword(parsed.data.password)
    if (me instanceof Response) return me
    const channel: PayChannel = parsed.data.channel ?? 'alipay'
    const ch = CHANNEL_LABEL[channel]

    if ('reset' in parsed.data) {
      const state = await resetPayQr(channel)
      await audit(request, me.id, 'vmq.qr.reset', BUILTIN_QR_ID, { channel, activeId: BUILTIN_QR_ID })
      notifyPayQrChanged({
        action: '重置',
        detail: `${ch}收款码配置已重置：${channel === 'alipay' ? '收银台改用内置收款码' : '收银台不再显示微信支付'}，已上传的列表清空`,
        adminId: me.id,
        ip: ipOf(request),
      })
      return success(view(state, channel), channel === 'alipay' ? '已恢复为内置收款码' : '已恢复为未启用')
    }

    const r = await switchPayQr(channel, parsed.data.id, me.id)
    if (!r.changed) return success(view(r.state, channel), '当前已经是这一项')
    const from = payQrLabel(r.state, r.from, channel)
    const to = payQrLabel(r.state, r.state.activeId, channel)
    await audit(request, me.id, 'vmq.qr.switch', r.state.activeId, { channel, from: r.from, to: r.state.activeId, fromLabel: from, toLabel: to })
    notifyPayQrChanged({ action: '切换', detail: `${ch}：「${from}」→「${to}」，收银台已立即生效`, adminId: me.id, ip: ipOf(request) })
    return success(view(r.state, channel), `已切换到「${to}」`)
  } catch (e) {
    return fail(e, '切换失败')
  }
}

const deleteSchema = z.object({ id: z.string().min(1).max(20), password: z.string().min(1).max(200), channel: channelSchema }).strict()

export async function DELETE(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = deleteSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error('参数不正确')
    const me = await adminWithPassword(parsed.data.password)
    if (me instanceof Response) return me

    const channel: PayChannel = parsed.data.channel ?? 'alipay'
    const r = await deletePayQrItem(channel, parsed.data.id)
    await audit(request, me.id, 'vmq.qr.delete', r.removed.id, { channel, label: r.removed.label, url: r.removed.url })
    notifyPayQrChanged({ action: '删除', detail: `${CHANNEL_LABEL[channel]}：删除「${r.removed.label}」`, adminId: me.id, ip: ipOf(request) })
    return success(view(r.state, channel), '已删除')
  } catch (e) {
    return fail(e, '删除失败')
  }
}
