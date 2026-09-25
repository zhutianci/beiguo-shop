export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
// 魔数识别、上传目录总量配额（含「论坛只能用到 90%」那条线）、落盘都在 lib/upload-store.ts：
// 后台营销邮件图片上传与这里共用同一份用量计数，否则两条通道各守各的上限，合起来照样能写满磁盘
import { sniffImage, storeUpload } from '@/lib/upload-store'

const MAX_SIZE = 5 * 1024 * 1024 // 单文件 5MB
// 单个身份的频率限制（进程内计数，重启即清零；配合总量上限已足够挡住滥用）
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 12

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
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
 * 代码目录甚至覆盖掉构建产物。白名单是这里唯一可接受的做法，多一个业务就在这里加一行
 * （同时在 lib/upload-store.ts 的 STORE_SCOPES 登记目录）。
 *
 * 营销邮件图片（mail）刻意不在这里：它只许管理员传，走 /api/admin/marketing/upload。
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
    const ext = sniffImage(bytes)
    if (!ext) return error('文件内容不是有效的图片')

    const scope = SCOPES[String(form.get('scope') || 'forum')] || 'forum'

    // 用量按 uploads 根目录统计、论坛只能用到 90% 的线（理由见 lib/upload-store.ts 的 quotaForScope）；
    // 超线时 storeUpload 会打一条 [upload] 告警日志
    const stored = await storeUpload(scope, bytes, ext)
    if (!stored.ok) return error('图片存储空间已满，请联系管理员', 507)

    return success({ url: stored.url }, '上传成功')
  } catch (err) {
    console.error('Upload error:', err)
    return error('上传失败')
  }
}
