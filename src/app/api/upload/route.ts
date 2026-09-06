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

async function dirSize(dir: string): Promise<number> {
  let total = 0
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return 0 // 目录还不存在
  }
  for (const name of entries) {
    try {
      const s = await stat(path.join(dir, name))
      if (s.isFile()) total += s.size
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

// 图片上传：保存到 public/uploads/forum，返回可访问 URL
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

    const dir = path.join(process.cwd(), 'public', 'uploads', 'forum')
    await mkdir(dir, { recursive: true })

    const used = await usedBytes(dir)
    if (used + bytes.length > MAX_TOTAL_BYTES) {
      console.warn(`[upload] 上传目录已达上限：${used} / ${MAX_TOTAL_BYTES}`)
      return error('图片存储空间已满，请联系管理员', 507)
    }

    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`
    await writeFile(path.join(dir, name), bytes)
    cachedBytes = used + bytes.length // 增量累加，下次重算前保持准确

    const url = `/uploads/forum/${name}`
    return success({ url }, '上传成功')
  } catch (err) {
    console.error('Upload error:', err)
    return error('上传失败')
  }
}
