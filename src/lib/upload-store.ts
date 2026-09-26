/**
 * 图片上传的公共底座：魔数识别、上传目录总量配额、落盘。
 *
 * 从 api/upload/route.ts 原样抽出来，给后台「营销邮件图片」上传（api/admin/marketing/upload）共用。
 *
 * 【为什么必须共用同一份，而不是营销那边自己写一个】总量上限的意义是「磁盘写满会连带打挂同机的 MySQL」。
 * 如果营销上传另起一套计数，两条通道各自守着自己的上限，合起来照样能把磁盘写满 —— 上限就形同虚设。
 * 这里的用量缓存是模块级单例，两个接口在同一进程里读写的是同一个数；即使哪天不在同一进程，
 * 每 10 分钟也会按目录实际大小重算一次，偏差有上界。
 *
 * 只做「存」这件事：准入（谁能传、传到哪个业务目录、单文件多大、允许哪些格式）是各接口自己的规矩。
 */
import { writeFile, mkdir, readdir, stat, statfs, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { CONTACT_QR_URL_RE } from './contact-base'
import { prisma } from './db'

// 上传目录总量上限：磁盘被写满会连带打挂同机的 MySQL，这是最要命的失败模式。
// 论坛允许匿名发帖带图，所以不能简单地要求登录，只能把「写爆磁盘」这条路堵死。
export const MAX_TOTAL_BYTES = Number(process.env.UPLOAD_MAX_TOTAL_MB || 1536) * 1024 * 1024

export type SniffedImage = 'jpg' | 'png' | 'gif' | 'webp'

/**
 * 按文件头判断真实类型。Content-Type 是客户端说了算的，
 * 只信它等于允许任何人往 public 目录里塞任意内容（脚本、大文件）。
 */
export function sniffImage(buf: Buffer): SniffedImage | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.subarray(0, 6).toString('latin1') === 'GIF87a' || buf.subarray(0, 6).toString('latin1') === 'GIF89a') return 'gif'
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  return null
}

/**
 * 允许落盘的业务子目录（目录名 → 目录名）。
 *
 * 【为什么不能直接用调用方传来的目录名】那就是任意路径写入：`../../` 能把图片写到
 * 代码目录甚至覆盖掉构建产物。这里是落盘前的最后一道白名单 —— 各接口自己还有一层
 * 「请求参数 → 目录」的映射（如 /api/upload 的 SCOPES），这一层防的是调用方写错。
 * 多一个业务就在这里加一行（nginx 的 location /uploads/ 按整个目录发文件，不用改）。
 */
const STORE_SCOPES: Record<string, string> = {
  forum: 'forum', // 论坛发帖配图（允许匿名）
  links: 'links', // 友链 / 招商位的站点 logo（后台录入）
  products: 'products', // 商品主图（后台录入，展示在商品列表与详情页）
  mail: 'mail', // 营销邮件里的图片（后台录入，邮件里引用绝对 URL）
  contact: 'contact', // 店面客服二维码（二期改动 4.4：渠道站长在设置中心上传、超管经 /api/upload scope=contact 上传）
}

export function isStoreScope(scope: string): boolean {
  return Object.prototype.hasOwnProperty.call(STORE_SCOPES, scope)
}

/** uploads 根目录（各业务子目录共用同一块磁盘，用量按根目录统计） */
export function uploadRoot(): string {
  return path.join(process.cwd(), 'public', 'uploads')
}

/**
 * 某个业务目录可用到的总量线。
 *
 * 用量按 uploads 根目录统计（各子目录共用同一块磁盘），但**不共用同一条线**：
 * 论坛允许匿名传图，任由它涨到 100% 就会连带把后台的友链 logo 一起堵死。
 * 给匿名来源留 90% 的线，后台来源可以用满——这样先撑爆的一定是匿名那一侧，
 * 而管理员仍有空间处理善后（清图、调大 UPLOAD_MAX_TOTAL_MB）。
 */
export function quotaForScope(scope: string): number {
  // contact 与 forum 同一条 90% 线：渠道站长不是站长本人，渠道那一侧也不能挤占给后台留的最后 10%（二期改动 4.4）
  return scope === 'forum' || scope === 'contact' ? Math.floor(MAX_TOTAL_BYTES * 0.9) : MAX_TOTAL_BYTES
}

// ---- 上传目录用量缓存：每次上传都遍历目录会越来越慢，这里增量累加、定期重算 ----
let cachedBytes = -1
let cachedAt = 0
const RECHECK_MS = 10 * 60 * 1000

/**
 * 统计 uploads 根目录下的总用量（含各业务子目录）。
 *
 * 【为什么要递归一层】以前只有 uploads/forum 一个目录，直接数文件就够了。
 * 加了 uploads/links 之后，若仍只数 forum，总量上限就形同虚设——
 * 两个目录各自逼近上限，磁盘照样会被写满，而写满磁盘会连带打挂同机的 MySQL。
 * 子目录只可能是上面 STORE_SCOPES 里列的那几个，一层足够，不做无限递归。
 */
async function dirSize(dir: string): Promise<number> {
  let total = 0
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return 0 // 目录还不存在
  }
  for (const name of entries) {
    const full = path.join(dir, name)
    try {
      const s = await stat(full)
      if (s.isFile()) {
        total += s.size
      } else if (s.isDirectory()) {
        const sub = await readdir(full)
        for (const f of sub) {
          try {
            const fs2 = await stat(path.join(full, f))
            if (fs2.isFile()) total += fs2.size
          } catch {
            /* 文件刚被删掉之类，忽略 */
          }
        }
      }
    } catch {
      /* 文件刚被删掉之类，忽略 */
    }
  }
  return total
}

async function usedBytes(dir: string): Promise<number> {
  const now = Date.now()
  if (cachedBytes < 0 || now - cachedAt > RECHECK_MS) {
    cachedBytes = await dirSize(dir)
    cachedAt = now
  }
  return cachedBytes
}

// 磁盘真实剩余空间底线：低于它一律拒收，不管配额还剩多少。配额只管得住 uploads 目录自己，
// 管不住镜像、日志、binlog 先把盘吃满、uploads 再补上最后一刀的情况（uploads 卷与 MySQL 同盘）。
// 容器里 statfs 读到的是宿主机上卷所在文件系统的剩余空间，正是要看的那个数。
// docker build 期间剩余空间可能短暂低于底线，这时上传返回 507，属于预期（先保 MySQL）。
const MIN_FREE_BYTES = Number(process.env.UPLOAD_MIN_FREE_MB || 2048) * 1024 * 1024

/**
 * 所有「读用量 → 判断 → 写文件 → 回写用量」串行执行，必须是一个整体。
 *
 * 【出过的问题】以前中间隔着 await writeFile：并发请求读到同一个旧用量，都能通过检查、都能落盘，
 * 最后互相覆盖计数，每批只涨一个文件的量（本地实测：论坛线 9MB，分批并发传 100 个 1MB 文件，
 * 100 个全被接受，计数只记了 5.5MB）。配合 nginx 默认先缓冲完整请求体再转发，攻击者同时开 N 个连接，
 * 这 N 个请求几乎同时到达，正好撞进同一个窗口 —— 总量上限形同虚设，能把与 MySQL 同盘的磁盘写满。
 *
 * 单文件不超过 5MB、本地盘写入是毫秒级，串行的开销可以忽略。
 * 某次写入失败（ENOSPC 之类）会被 then(fn, fn) / then(ok, ok) 吞掉，锁照样释放，不会卡死后面的上传。
 */
let lock: Promise<unknown> = Promise.resolve()
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn)
  lock = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

/** 上传目录所在文件系统的可用字节数；读不到（平台不支持之类）返回 null，只靠配额 */
async function freeBytes(dir: string): Promise<number | null> {
  try {
    const s = await statfs(dir)
    return Number(s.bavail) * Number(s.bsize)
  } catch {
    return null
  }
}

/**
 * 当前 uploads 总用量（带缓存；给后台展示或预检用）。
 * 也走串行锁：锁外触发的重算会和锁内的增量累加互相覆盖计数。
 */
export function usedUploadBytes(): Promise<number> {
  return serialized(() => usedBytes(uploadRoot()))
}

export type StoreResult =
  | { ok: true; name: string; url: string }
  | { ok: false; reason: 'quota'; used: number; quota: number }
  | { ok: false; reason: 'disk'; free: number }

/**
 * 把已经验过类型的图片写进 public/uploads/<scope>/，文件名由服务端生成。
 * 返回站内相对 URL（/uploads/<scope>/<name>）；超出总量线返回 {ok:false, reason:'quota'}，
 * 磁盘剩余空间低于底线返回 {ok:false, reason:'disk'}（调用方都回 507）。
 *
 * scope 不在白名单里直接抛错 —— 这是编程错误，不是用户输入错误。
 */
export async function storeUpload(scope: string, bytes: Buffer, ext: string): Promise<StoreResult> {
  if (!isStoreScope(scope)) throw new Error(`upload-store: 未登记的上传目录 ${JSON.stringify(scope)}`)
  // 扩展名只可能来自 sniffImage 的结果；这里再卡一次，防止调用方把客户端给的扩展名传进来
  if (!/^(jpg|png|gif|webp)$/.test(ext)) throw new Error(`upload-store: 非法扩展名 ${JSON.stringify(ext)}`)

  // 上面两条是编程错误，同步抛、不进锁；下面整段在锁里（理由见 serialized）
  return serialized(async (): Promise<StoreResult> => {
    const dirName = STORE_SCOPES[scope]
    const root = uploadRoot()
    const dir = path.join(root, dirName)
    await mkdir(dir, { recursive: true })

    const quota = quotaForScope(scope)
    const used = await usedBytes(root)
    if (used + bytes.length > quota) {
      console.warn(`[upload] 上传目录已达上限：${used} / ${quota}（scope=${scope}，总上限 ${MAX_TOTAL_BYTES}）`)
      return { ok: false, reason: 'quota', used, quota }
    }

    const free = await freeBytes(root)
    if (free !== null && free - bytes.length < MIN_FREE_BYTES) {
      console.warn(`[upload] 磁盘剩余 ${free} 字节，低于底线 ${MIN_FREE_BYTES}，拒收（scope=${scope}）`)
      return { ok: false, reason: 'disk', free }
    }

    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`
    // wx：文件已存在就失败而不是覆盖（文件名带随机数，正常不会撞；撞了宁可报错也不覆盖别人的图）
    await writeFile(path.join(dir, name), bytes, { flag: 'wx' })
    cachedBytes = used + bytes.length // 增量累加，下次重算前保持准确

    return { ok: true, name, url: `/uploads/${dirName}/${name}` }
  })
}

// ---------------------------------------------------------------------------
// 店面客服二维码（二期改动 4.4）
// ---------------------------------------------------------------------------

/** 客服二维码单文件上限 2MB（二维码图本来就小；比通用上传的 5MB 收紧） */
export const CONTACT_QR_MAX_BYTES = 2 * 1024 * 1024

export type ContactQrStoreResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'size' | 'type' }
  | { ok: false; reason: 'quota' | 'disk' }

/**
 * 校验并落盘一张客服二维码：≤ 2MB；**按文件头**只收 png / jpg / webp（gif 与 SVG 一律拒绝——SVG 能带脚本，
 * gif 没有必要且可做动图广告）；文件名由 storeUpload 随机生成，返回的 url 必然匹配 CONTACT_QR_URL_RE。
 * 渠道设置中心（经 tenant/partner-facade.ts 的 saveTenantContactQr）与超管 /api/upload scope=contact 共用这一个入口。
 * 调用方负责鉴权与限频；reason: size / type → 400，quota / disk → 507。
 */
export async function storeContactQr(bytes: Buffer): Promise<ContactQrStoreResult> {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > CONTACT_QR_MAX_BYTES) return { ok: false, reason: 'size' }
  const ext = sniffImage(bytes)
  if (ext !== 'png' && ext !== 'jpg' && ext !== 'webp') return { ok: false, reason: 'type' }
  const r = await storeUpload('contact', bytes, ext)
  if (!r.ok) return { ok: false, reason: r.reason }
  // 双保险：落盘结果必须满足读写两端共用的格式（文件名规则将来若改了，这里立刻暴露，而不是写进库后前台不显示）
  if (!CONTACT_QR_URL_RE.test(r.url)) throw new Error(`upload-store: 客服二维码地址不符合约定格式 ${r.url}`)
  return { ok: true, url: r.url }
}

/**
 * 删除一张客服二维码文件（换图 / 清除时删旧图）。**只删 public/uploads/contact/ 下的单个文件**：
 *  · url 必须匹配 CONTACT_QR_URL_RE（文件名只含 [0-9a-z-] 与固定扩展名，不可能带 ../ 或子目录）；
 *  · 再按解析后的绝对路径核对「父目录正好是 uploads/contact」，任何一条不满足都不删；
 *  · 「是库里记录过的那个文件名」由调用方保证：只传刚从 tenants 行（锁内）读出的旧值，绝不传客户端给的值。
 * 返回是否真的删了文件（文件不存在 → false，不抛）。与落盘共用串行锁，删除后同步扣减用量缓存。
 */
export async function deleteContactUpload(url: string | null | undefined): Promise<boolean> {
  if (typeof url !== 'string' || !CONTACT_QR_URL_RE.test(url)) return false
  const dir = path.join(uploadRoot(), STORE_SCOPES.contact)
  const name = url.slice('/uploads/contact/'.length)
  const full = path.resolve(dir, name)
  if (path.dirname(full) !== path.resolve(dir) || path.basename(full) !== name) return false
  return serialized(async () => {
    try {
      const s = await stat(full)
      if (!s.isFile()) return false
      await unlink(full)
      if (cachedBytes >= 0) cachedBytes = Math.max(0, cachedBytes - s.size)
      return true
    } catch (e) {
      if ((e as { code?: string })?.code !== 'ENOENT') console.error('[upload] 删除客服二维码失败', url, (e as Error)?.message || e)
      return false
    }
  })
}

/**
 * 「换图 / 清除后删旧图」的唯一入口：**只有当没有任何渠道（tenants.support_qr_url）还指向这个文件时才删**。
 *
 * 【为什么不直接 deleteContactUpload】deleteContactUpload 只保证「删的是 contact/ 下的一个合规文件」，
 * 不保证「这个文件只属于当前渠道」。超管 PATCH 可以手填 supportQrUrl（只校验格式），一旦把 lulu 的
 * /uploads/contact/xxx.png 填给了另一个渠道，lulu 下次换图就会把对方店面的二维码删成 404 —— 跨渠道的破坏。
 * 所以删之前按「整张 tenants 表」数一次引用：还有人用就留着（留一个孤儿文件的代价远小于删掉别站的二维码）。
 *
 * 调用时机：**必须在把旧值从本渠道行上改掉的事务提交之后**（否则数到的还是自己，永远不删）。
 * 剩余的竞态（数完引用、unlink 之前，恰好有超管把同一地址填给别的渠道）窗口极小，且超管 PATCH 会先用
 * contactUploadOwnedByOtherTenant 拒掉已被占用的地址，属于可接受的残余。
 * 返回是否真的删了文件。放在这里而不是 partner-facade：渠道层不能 import 本文件（边界检查规则 3），
 * 删除能力不暴露给渠道。
 */
export async function releaseContactUpload(url: string | null | undefined): Promise<boolean> {
  if (typeof url !== 'string' || !CONTACT_QR_URL_RE.test(url)) return false
  const refs = await prisma.tenant.count({ where: { supportQrUrl: url } })
  if (refs > 0) return false
  return deleteContactUpload(url)
}

/**
 * 超管 PATCH 写 supportQrUrl 前的归属检查（供 admin-tenants 调用）：这张图是否已被**别的**渠道使用。
 * 返回 true 就应拒绝（400「该二维码已被其他渠道使用，请重新上传」），保证一个二维码文件只归一个渠道所有，
 * 这样 releaseContactUpload 的引用计数才是「本渠道放手 = 没人用」。传入 tx 时在调用方事务里读（配合行锁）。
 */
export async function contactUploadOwnedByOtherTenant(
  url: string,
  tenantId: number,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<boolean> {
  const n = await db.tenant.count({ where: { supportQrUrl: url, id: { not: tenantId } } })
  return n > 0
}
