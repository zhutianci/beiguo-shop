export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

const MAX_SIZE = 5 * 1024 * 1024 // 单文件 5MB
// 上传目录总量上限：磁盘被写满会连带打挂同机的 MySQL，这是最要命的失败模式。
// 论坛允许匿名发帖带图，所以不能简单地要求登录，只能把「写爆磁盘」这条路堵死。
const MAX_TOTAL_BYTES = Number(process.env.UPLOAD_MAX_TOTAL_MB || 1536) * 1024 * 1024
// 单个身份的频率限制（进程内计数，重启即清零；配合总量上限已足够挡住滥用）
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 12

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

/**
 * 按文件头判断真实类型。Content-Type 是客户端说了算的，
 * 只信它等于允许任何人往 public 目录里塞任意内容（脚本、大文件）。
 */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.subarray(0, 6).toString('latin1') === 'GIF87a' || buf.subarray(0, 6).toString('latin1') === 'GIF89a') return 'gif'
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  return null
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
 * 子目录只可能是这里 SCOPES 里列的那几个，一层足够，不做无限递归。
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

// ---- 频率限制 ----
const hits = new Map<string, number[]>()
function rateLimited(key: string): boolean {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (arr.length >= RATE_MAX) {
    hits.set(key, arr)
    return true
  }
  arr.push(now)
  hits.set(key, arr)
  // 顺手清理，避免 Map 无限增长（tsconfig target 较低，用 forEach 而非 for..of 遍历 Map）
  if (hits.size > 5000) {
    const stale: string[] = []
    hits.forEach((v, k) => {
      if (!v.some((t: number) => now - t < RATE_WINDOW_MS)) stale.push(k)
    })
    stale.forEach((k) => hits.delete(k))
  }
  return false
}

/**
 * 业务子目录白名单。
 *
 * 【为什么不能直接用表单传来的目录名】那就是任意路径写入：`../../` 能把图片写到
 * 代码目录甚至覆盖掉构建产物。白名单是这里唯一可接受的做法，多一个业务就在这里加一行。
 */
const SCOPES: Record<string, string> = {
  forum: 'forum', // 论坛发帖配图（允许匿名）
  links: 'links', // 友链 / 招商位的站点 logo（后台录入）
  products: 'products', // 商品主图（后台录入，展示在商品列表与详情页）
}

// 图片上传：保存到 public/uploads/<scope>，返回可访问 URL
export async function POST(request: NextRequest) {
  try {
    // 身份：登录用户优先，其次匿名 id，最后回落到 IP。仅用于限流，不做准入。
    const user = await getCurrentUser().catch(() => null)
    const anonId = request.headers.get('x-anon-id') || ''
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown'
    const identity = user ? `u:${user.id}` : anonId ? `a:${anonId}` : `i:${ip}`

    if (rateLimited(identity)) return error('上传过于频繁，请稍后再试', 429)

    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) return error('未找到上传文件')

    if (!ALLOWED[file.type]) return error('仅支持 JPG / PNG / GIF / WebP 图片')
    if (file.size > MAX_SIZE) return error('图片不能超过 5MB')

    const bytes = Buffer.from(await file.arrayBuffer())
    // 以真实文件头为准，而不是客户端声明的 Content-Type
    const ext = sniff(bytes)
    if (!ext) return error('文件内容不是有效的图片')

    const scope = SCOPES[String(form.get('scope') || 'forum')] || 'forum'
    const root = path.join(process.cwd(), 'public', 'uploads')
    const dir = path.join(root, scope)
    await mkdir(dir, { recursive: true })

    // 用量按 uploads 根目录统计（各子目录共用同一块磁盘），但**不共用同一条线**：
    // 论坛允许匿名传图，任由它涨到 100% 就会连带把后台的友链 logo 一起堵死。
    // 给匿名来源留 90% 的线，后台来源可以用满——这样先撑爆的一定是匿名那一侧，
    // 而管理员仍有空间处理善后（清图、调大 UPLOAD_MAX_TOTAL_MB）。
    const quota = scope === 'forum' ? Math.floor(MAX_TOTAL_BYTES * 0.9) : MAX_TOTAL_BYTES
    const used = await usedBytes(root)
    if (used + bytes.length > quota) {
      console.warn(`[upload] 上传目录已达上限：${used} / ${quota}（scope=${scope}，总上限 ${MAX_TOTAL_BYTES}）`)
      return error('图片存储空间已满，请联系管理员', 507)
    }

    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`
    await writeFile(path.join(dir, name), bytes)
    cachedBytes = used + bytes.length // 增量累加，下次重算前保持准确

    const url = `/uploads/${scope}/${name}`
    return success({ url }, '上传成功')
  } catch (err) {
    console.error('Upload error:', err)
    return error('上传失败')
  }
}
