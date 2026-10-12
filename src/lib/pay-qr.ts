/**
 * 收银台收款码的读写（格式与纯函数在 pay-qr-base.ts，文件落盘在 upload-store.ts）。
 *
 *  · 读：收银台状态接口每 3 秒轮询一次，这里带 3 秒的进程内缓存；本进程里的写操作会立刻清掉它，
 *    所以后台一点「切换」，正开着的收银台下一次轮询就换成新码。
 *  · 写：只有 api/admin/vmq/qr（超管 + 复核登录密码）会调。整行 JSON 读出 → 改 → 按 updatedAt 条件写回（CAS），
 *    两个后台页面同时操作时后写的一方重读再改，不会互相覆盖。
 *  · 配置读坏（PayQrError CORRUPT）不回落内置码：收银台不显示收款码，后台提示并给出「恢复为内置收款码」。
 */
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import {
  PAY_QR_SETTING_KEY,
  PayQrError,
  activatePayQr,
  activePayQrUrl,
  addPayQr,
  emptyPayQrState,
  parsePayQrState,
  removePayQr,
  type PayQrItem,
  type PayQrState,
} from './pay-qr-base'
import { deletePayQrUpload } from './upload-store'

const CACHE_MS = 3_000
let cached: { url: string | null; at: number } | null = null

export async function getPayQrState(): Promise<PayQrState> {
  const row = await prisma.setting.findUnique({ where: { key: PAY_QR_SETTING_KEY }, select: { value: true } })
  return parsePayQrState(row?.value)
}

/**
 * 收银台现在该显示哪一张。null = 配置读坏了（已记日志），收银台不显示收款码、提示联系客服——
 * 绝不悄悄换回内置码（理由见 pay-qr-base.ts 文件头）。数据库读不到则照常抛给调用方。
 */
export async function currentPayQrUrl(): Promise<string | null> {
  const now = Date.now()
  if (cached && now - cached.at < CACHE_MS) return cached.url
  let url: string | null
  try {
    url = activePayQrUrl(await getPayQrState())
  } catch (e) {
    if (!(e instanceof PayQrError)) throw e
    console.error('[pay-qr] 收款码配置读不出来，收银台暂不显示收款码：', e.message)
    url = null
  }
  cached = { url, at: now }
  return url
}

/** 读 → 改 → 条件写回；被别的写抢先就重读再来（最多 3 次） */
async function mutate<T>(fn: (s: PayQrState) => { state: PayQrState; result: T }): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await prisma.setting.findUnique({ where: { key: PAY_QR_SETTING_KEY } })
    const { state, result } = fn(parsePayQrState(row?.value))
    const value = JSON.stringify(state)
    try {
      if (!row) {
        await prisma.setting.create({ data: { key: PAY_QR_SETTING_KEY, value } })
      } else {
        const r = await prisma.setting.updateMany({ where: { key: PAY_QR_SETTING_KEY, updatedAt: row.updatedAt }, data: { value } })
        if (r.count !== 1) continue
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
    cached = null
    return result
  }
  throw new Error('[pay-qr] 收款码配置被并发修改，请重试')
}

/** 新增一张已经落盘的收款码（不改变当前生效的） */
export async function addPayQrItem(input: { label: string; url: string; by: number | null }): Promise<{ state: PayQrState; item: PayQrItem }> {
  const item: PayQrItem = { id: crypto.randomBytes(6).toString('hex'), label: input.label, url: input.url, addedAt: Date.now(), addedBy: input.by }
  const state = await mutate((s) => {
    const next = addPayQr(s, item)
    return { state: next, result: next }
  })
  return { state, item }
}

/** 切换当前生效的收款码。changed=false：本来就是这一张（不记历史） */
export async function switchPayQr(id: string, by: number | null): Promise<{ state: PayQrState; changed: boolean; from: string }> {
  return mutate((s) => {
    const r = activatePayQr(s, id, by, Date.now())
    return { state: r.state, result: { state: r.state, changed: r.changed, from: s.activeId } }
  })
}

/** 删除一张（不能删内置码、不能删正在用的）。配置先改、文件后删：删文件失败只留一个孤儿文件 */
export async function deletePayQrItem(id: string): Promise<{ state: PayQrState; removed: PayQrItem }> {
  const r = await mutate((s) => {
    const x = removePayQr(s, id)
    return { state: x.state, result: x }
  })
  await deletePayQrUpload(r.removed.url).catch((e) => console.error('[pay-qr] 删除收款码文件失败', r.removed.url, e))
  return r
}

/** 配置读坏时的唯一出路：整行重置为「用内置收款码、列表清空」（已上传的图片文件留在盘上，不自动删） */
export async function resetPayQr(): Promise<PayQrState> {
  const state = emptyPayQrState()
  const value = JSON.stringify(state)
  await prisma.setting.upsert({ where: { key: PAY_QR_SETTING_KEY }, create: { key: PAY_QR_SETTING_KEY, value }, update: { value } })
  cached = null
  return state
}
