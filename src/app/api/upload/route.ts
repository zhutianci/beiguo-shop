export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { success, error } from '@/lib/api'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

// 图片上传：保存到 public/uploads/forum，返回可访问 URL
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) return error('未找到上传文件')

    const ext = ALLOWED[file.type]
    if (!ext) return error('仅支持 JPG / PNG / GIF / WebP 图片')
    if (file.size > MAX_SIZE) return error('图片不能超过 5MB')

    const bytes = Buffer.from(await file.arrayBuffer())
    const dir = path.join(process.cwd(), 'public', 'uploads', 'forum')
    await mkdir(dir, { recursive: true })

    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`
    await writeFile(path.join(dir, name), bytes)

    const url = `/uploads/forum/${name}`
    return success({ url }, '上传成功')
  } catch (err) {
    console.error('Upload error:', err)
    return error('上传失败')
  }
}
