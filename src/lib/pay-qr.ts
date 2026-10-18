/**
 * 收银台收款码的读写（格式与纯函数在 pay-qr-base.ts，文件落盘在 upload-store.ts）。支付宝与微信各一行配置（PAY_QR_SETTING_KEYS）。
 *
 *  · 读：收银台状态接口每 3 秒轮询一次，这里带 3 秒的进程内缓存（按渠道）；本进程里的写操作会立刻清掉它，
 *    所以后台一点「切换」，正开着的收银台下一次轮询就换成新码。
 *  · 写：只有 api/admin/vmq/qr（超管 + 复核登录密码）会调。整行 JSON 读出 → 改 → 按 updatedAt 条件写回（CAS），
 *    两个后台页面同时操作时后写的一方重读再改，不会互相覆盖。
 *  · 配置读坏（PayQrError CORRUPT）不回落内置码：收银台不显示这个渠道的收款码，后台提示并给出「恢复为初始状态」。
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import {
  PAY_QR_SETTING_KEYS,
  PayQrError,
  activatePayQr,
  activePayQrUrlFor,
  addPayQr,
  emptyPayQrState,
  parsePayQrState,
  removePayQr,
  type PayQrItem,
  type PayQrState,
} from './pay-qr-base'
import { PAY_CHANNELS, type PayChannel } from './pay-channel'
import { deletePayQrUpload } from './upload-store'

const CACHE_MS = 3_000
const cached = new Map<PayChannel, { url: string | null; at: number }>()

export async function getPayQrState(channel: PayChannel = 'alipay'): Promise<PayQrState> {
  const row = await prisma.setting.findUnique({ where: { key: PAY_QR_SETTING_KEYS[channel] }, select: { value: true } })
  return parsePayQrState(row?.value)
}

/**
 * 收银台现在该显示哪一张。null = 这个渠道没启用（微信还没上传 / 设成了「未启用」），或配置读坏了（已记日志）——
 * 读坏时绝不悄悄换回内置码（理由见 pay-qr-base.ts 文件头）。数据库读不到则照常抛给调用方。
 */
export async function currentPayQrUrl(channel: PayChannel = 'alipay'): Promise<string | null> {
  const now = Date.now()
  const c = cached.get(channel)
  if (c && now - c.at < CACHE_MS) return c.url
  let url: string | null
  try {
    url = activePayQrUrlFor(await getPayQrState(channel), channel)
  } catch (e) {
    if (!(e instanceof PayQrError)) throw e
    console.error(`[pay-qr] ${channel} 收款码配置读不出来，收银台暂不显示这个渠道的收款码：`, e.message)
    url = null
  }
  cached.set(channel, { url, at: now })
  return url
}

/** 两个渠道各自的当前收款码（null = 不可用）。收银台、结算弹窗据此决定显示哪些支付方式 */
export async function currentPayQrUrls(): Promise<Record<PayChannel, string | null>> {
  const [alipay, wechat] = await Promise.all(PAY_CHANNELS.map((c) => currentPayQrUrl(c)))
  return { alipay, wechat }
}

/** 读 → 改 → 条件写回；被别的写抢先就重读再来（最多 3 次） */
async function mutate<T>(channel: PayChannel, fn: (s: PayQrState) => { state: PayQrState; result: T }): Promise<T> {
  const key = PAY_QR_SETTING_KEYS[channel]
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await prisma.setting.findUnique({ where: { key } })
    const { state, result } = fn(parsePayQrState(row?.value))
    const value = JSON.stringify(state)
    try {
      if (!row) {
        await prisma.setting.create({ data: { key, value } })
      } else {
        const r = await prisma.setting.updateMany({ where: { key, updatedAt: row.updatedAt }, data: { value } })
        if (r.count !== 1) continue
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
    cached.delete(channel)
    return result
  }
  throw new Error('[pay-qr] 收款码配置被并发修改，请重试')
}

/** 新增一张已经落盘的收款码（不改变当前生效的） */
export async function addPayQrItem(
  channel: PayChannel,
  input: { label: string; url: string; by: number | null },
): Promise<{ state: PayQrState; item: PayQrItem }> {
  const item: PayQrItem = { id: crypto.randomBytes(6).toString('hex'), label: input.label, url: input.url, addedAt: Date.now(), addedBy: input.by }
  const state = await mutate(channel, (s) => {
    const next = addPayQr(s, item)
    return { state: next, result: next }
  })
  return { state, item }
}

/** 切换当前生效的收款码。changed=false：本来就是这一张（不记历史） */
export async function switchPayQr(channel: PayChannel, id: string, by: number | null): Promise<{ state: PayQrState; changed: boolean; from: string }> {
  return mutate(channel, (s) => {
    const r = activatePayQr(s, id, by, Date.now(), channel)
    return { state: r.state, result: { state: r.state, changed: r.changed, from: s.activeId } }
  })
}

/** 删除一张（不能删 builtin、不能删正在用的）。配置先改、文件后删：删文件失败只留一个孤儿文件 */
export async function deletePayQrItem(channel: PayChannel, id: string): Promise<{ state: PayQrState; removed: PayQrItem }> {
  const r = await mutate(channel, (s) => {
    const x = removePayQr(s, id)
    return { state: x.state, result: x }
  })
  await deletePayQrUpload(r.removed.url).catch((e) => console.error('[pay-qr] 删除收款码文件失败', r.removed.url, e))
  return r
}

/** 配置读坏时的唯一出路：整行重置为初始状态（支付宝 = 内置码；微信 = 未启用），列表清空（已上传的图片文件留在盘上） */
export async function resetPayQr(channel: PayChannel): Promise<PayQrState> {
  const key = PAY_QR_SETTING_KEYS[channel]
  const state = emptyPayQrState()
  const value = JSON.stringify(state)
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
  cached.delete(channel)
  return state
}
