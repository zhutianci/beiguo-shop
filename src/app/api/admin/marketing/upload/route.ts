export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { rateLimited } from '@/lib/news/rate-limit'
import { siteOrigin } from '@/lib/news/format'
import { sniffImage, storeUpload } from '@/lib/upload-store'

/**
 * 营销邮件图片上传（仅管理员）→ public/uploads/mail/<服务端生成的文件名>，返回**绝对** https URL
 * （邮件客户端里没有「站内相对路径」这回事）。
 *
 * - 先看 Content-Length 再 formData()：formData() 会把整个请求体读进内存，先卡住体积才不会被一个大包拖垮
 * - 只收 JPG / PNG / GIF，按文件头判断（不信客户端的 Content-Type）；WebP / SVG 很多邮箱显示不出来，
 *   SVG 还能带脚本，一律拒绝
 * - 单张 ≤1MB（编辑器会先在浏览器里缩到 ≤1200px 宽、JPEG q≈0.82）
 * - 与 /api/upload 共用 lib/upload-store.ts 的磁盘配额：写满磁盘会连带打挂同机的 MySQL
 */

const MAX_FILE = 1024 * 1024 // 1MB
// multipart 的边界与字段头有少量开销，按 1.1MB 卡请求体
const MAX_BODY = Math.floor(1.1 * 1024 * 1024)

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const declared = Number(request.headers.get('content-length') || '')
    if (!Number.isFinite(declared) || declared <= 0) return error('请求缺少 Content-Length', 411)
    if (declared > MAX_BODY) return error('图片不能超过 1MB', 413)

    // 管理员也限一下：编辑器一次最多十几张图，每 10 分钟 60 张绰绰有余；防的是脚本失控把配额写满
    if (rateLimited(`mkt-upload:${me.id}`, { windowMs: 10 * 60_000, max: 60 })) {
      return error('上传过于频繁，请稍后再试', 429)
    }

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return error('上传内容格式不正确')
    }
    const file = form.get('file')
    if (!file || !(file instanceof File)) return error('未找到上传文件')
    if (file.size > MAX_FILE) return error('图片不能超过 1MB')

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length > MAX_FILE) return error('图片不能超过 1MB')
    // 以真实文件头为准，而不是客户端声明的 Content-Type
    const ext = sniffImage(bytes)
    if (ext === 'webp') return error('邮件图片不支持 WebP（很多邮箱显示不出来），请用 JPG / PNG / GIF')
    if (ext !== 'jpg' && ext !== 'png' && ext !== 'gif') return error('只支持 JPG / PNG / GIF 图片')

    const stored = await storeUpload('mail', bytes, ext)
    if (!stored.ok) return error('图片存储空间已满，请联系管理员', 507)

    console.log(`[admin/marketing] 管理员 #${me.id} 上传邮件图片 ${stored.name}（${bytes.length} 字节）`)
    return success({ url: `${siteOrigin()}${stored.url}` }, '上传成功')
  } catch (err) {
    console.error('[admin/marketing] 邮件图片上传失败:', err)
    return error('上传失败')
  }
}
