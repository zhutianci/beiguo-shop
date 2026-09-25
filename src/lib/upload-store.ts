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
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

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
  return scope === 'forum' ? Math.floor(MAX_TOTAL_BYTES * 0.9) : MAX_TOTAL_BYTES
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

/** 当前 uploads 总用量（带缓存；给后台展示或预检用） */
export function usedUploadBytes(): Promise<number> {
  return usedBytes(uploadRoot())
}

export type StoreResult =
  | { ok: true; name: string; url: string }
  | { ok: false; reason: 'quota'; used: number; quota: number }

/**
 * 把已经验过类型的图片写进 public/uploads/<scope>/，文件名由服务端生成。
 * 返回站内相对 URL（/uploads/<scope>/<name>）；超出总量线返回 {ok:false, reason:'quota'}（调用方回 507）。
 *
 * scope 不在白名单里直接抛错 —— 这是编程错误，不是用户输入错误。
 */
export async function storeUpload(scope: string, bytes: Buffer, ext: string): Promise<StoreResult> {
  if (!isStoreScope(scope)) throw new Error(`upload-store: 未登记的上传目录 ${JSON.stringify(scope)}`)
  // 扩展名只可能来自 sniffImage 的结果；这里再卡一次，防止调用方把客户端给的扩展名传进来
  if (!/^(jpg|png|gif|webp)$/.test(ext)) throw new Error(`upload-store: 非法扩展名 ${JSON.stringify(ext)}`)

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

  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`
  await writeFile(path.join(dir, name), bytes)
  cachedBytes = used + bytes.length // 增量累加，下次重算前保持准确

  return { ok: true, name, url: `/uploads/${dirName}/${name}` }
}
