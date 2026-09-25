/**
 * 邮件图片的浏览器端预处理（设计文档 7.3「图片」）：上传前先缩到 ≤1200px 宽、JPEG q≈0.82。
 *
 * 为什么在浏览器里做：邮件里的图片每个收件人都要下载一次，手机流量下 1MB 的图要好几秒；
 * 服务端只做魔数识别与大小上限（≤1MB），不做转码（不想在 app 容器里引图像库、吃内存）。
 *
 * 规则：
 * - 只收 JPG / PNG / GIF；WebP、SVG、HEIC 等邮箱不认的格式直接拒绝并说明原因
 * - GIF 原样上传（重新编码会丢动画）
 * - PNG 无透明 → 转 JPEG（照片类 PNG 转完通常小 5–10 倍）；有透明 → 保留 PNG（只在超宽时缩放）
 * - JPEG：超宽或偏大才重新编码；重新编码反而更大就用原图
 * - 结果 >1MB 拒绝（服务端上限）；>300KB 给警告
 *
 * 决策部分（planImage）是纯函数，便于脚本断言；解码/画布部分只能在浏览器里跑。
 */

export const MAX_WIDTH = 1200
export const JPEG_QUALITY = 0.82
export const WARN_BYTES = 300 * 1024
export const MAX_BYTES = 1024 * 1024
/** 解码上限：再大的图在低内存机器上画布会直接失败 */
const MAX_PIXELS = 40_000_000

export type ImageKind = 'jpeg' | 'png' | 'gif'

export class ImageRejectError extends Error {}

/** 按文件头识别真实格式（文件扩展名/MIME 都可能是错的，例如把 .webp 改名成 .jpg） */
export function sniffImage(head: Uint8Array): ImageKind | 'webp' | 'svg' | 'heic' | 'avif' | 'bmp' | null {
  const b = head
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'gif'
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return 'webp'
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'bmp'
  if (b.length >= 12) {
    const brand = String.fromCharCode(b[4], b[5], b[6], b[7], b[8], b[9], b[10], b[11])
    if (brand.startsWith('ftyp')) {
      const t = brand.slice(4)
      if (/^(avif|avis)/.test(t)) return 'avif'
      if (/^(heic|heix|hevc|mif1|msf1)/.test(t)) return 'heic'
    }
  }
  const text = Array.from(b.slice(0, 64))
    .map((c) => String.fromCharCode(c))
    .join('')
    .trimStart()
    .toLowerCase()
  if (text.startsWith('<svg') || text.startsWith('<?xml')) return 'svg'
  return null
}

export function rejectReason(kind: ReturnType<typeof sniffImage>, fileName: string): string | null {
  switch (kind) {
    case 'jpeg':
    case 'png':
    case 'gif':
      return null
    case 'webp':
      return 'WebP 图片在 QQ 邮箱、Outlook 里显示不出来。请另存为 JPG 或 PNG 再上传'
    case 'svg':
      return 'SVG 会被绝大多数邮箱屏蔽。请导出成 PNG 再上传'
    case 'heic':
      return 'HEIC（苹果照片格式）邮箱无法显示。请在手机上「导出为 JPG」或截图后再上传'
    case 'avif':
      return 'AVIF 格式邮箱无法显示。请另存为 JPG 或 PNG 再上传'
    case 'bmp':
      return 'BMP 格式太大且邮箱支持差。请另存为 JPG 或 PNG 再上传'
    default:
      return `无法识别「${fileName.slice(0, 40)}」的图片格式，只支持 JPG、PNG、GIF`
  }
}

export interface ImagePlan {
  /** 'keep' = 原文件直接上传；'encode' = 画到画布后按 format 重新编码 */
  action: 'keep' | 'encode'
  format: ImageKind
  width: number
  height: number
}

/**
 * 纯函数：给定原图格式、尺寸、大小与是否有透明像素，决定怎么处理。
 * hasAlpha 只对 PNG 有意义（调用方对 PNG 才去扫描透明度）。
 */
export function planImage(input: { kind: ImageKind; width: number; height: number; bytes: number; hasAlpha: boolean }): ImagePlan {
  const { kind, width, height, bytes, hasAlpha } = input
  const scale = width > MAX_WIDTH ? MAX_WIDTH / width : 1
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  if (kind === 'gif') return { action: 'keep', format: 'gif', width, height }
  if (kind === 'png') {
    if (hasAlpha) {
      // 透明 PNG：不超宽就原样（画布重编码的 PNG 往往比原图还大）
      return scale < 1 ? { action: 'encode', format: 'png', width: w, height: h } : { action: 'keep', format: 'png', width, height }
    }
    return { action: 'encode', format: 'jpeg', width: w, height: h }
  }
  // JPEG：不超宽且不大，原样上传（避免二次压缩损失）
  if (scale === 1 && bytes <= WARN_BYTES) return { action: 'keep', format: 'jpeg', width, height }
  return { action: 'encode', format: 'jpeg', width: w, height: h }
}

export interface PreparedImage {
  blob: Blob
  fileName: string
  width: number
  height: number
  bytes: number
  /** 给人看的处理说明，如「已从 3024px 缩到 1200px，PNG → JPG」 */
  note: string | null
  warn: string | null
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageRejectError('图片无法解析，文件可能已损坏'))
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageRejectError('图片压缩失败，请换一张试试'))), type, quality)
  })
}

/** 逐级减半缩放：一步从 4000px 缩到 1200px 会有明显锯齿 */
function drawScaled(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  let src: CanvasImageSource = img
  let sw = img.naturalWidth
  let sh = img.naturalHeight
  while (sw / 2 >= w * 1.2) {
    const c = document.createElement('canvas')
    c.width = Math.round(sw / 2)
    c.height = Math.round(sh / 2)
    const ctx = c.getContext('2d')
    if (!ctx) break
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src, 0, 0, c.width, c.height)
    src = c
    sw = c.width
    sh = c.height
  }
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) throw new ImageRejectError('浏览器不支持图片处理（画布不可用）')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, w, h)
  return out
}

function canvasHasAlpha(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return true
  try {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true
    return false
  } catch {
    return true // 读不了像素就当有透明，保守地保留 PNG
  }
}

function baseName(name: string): string {
  const b = name.replace(/\.[^.]+$/, '').replace(/[^\w一-龥-]+/g, '_').slice(0, 40)
  return b || 'image'
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const head = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  const kind = sniffImage(head)
  const reason = rejectReason(kind, file.name || '图片')
  if (reason) throw new ImageRejectError(reason)
  const k = kind as ImageKind

  if (k === 'gif') {
    if (file.size > MAX_BYTES) {
      throw new ImageRejectError(`GIF 动图有 ${(file.size / 1024).toFixed(0)} KB，超过 1MB 上限。请减少帧数或尺寸后再上传`)
    }
    return {
      blob: file,
      fileName: `${baseName(file.name)}.gif`,
      width: 0,
      height: 0,
      bytes: file.size,
      note: 'GIF 原样上传（保留动画）',
      warn: file.size > WARN_BYTES ? `动图 ${(file.size / 1024).toFixed(0)} KB，偏大，手机上加载会慢` : null,
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) throw new ImageRejectError('图片尺寸无效')
    if (nw * nh > MAX_PIXELS) throw new ImageRejectError(`图片太大（${nw}×${nh}），请先缩小到 4000 像素以内`)

    let hasAlpha = false
    let canvas: HTMLCanvasElement | null = null
    const scaled = nw > MAX_WIDTH
    const tw = scaled ? MAX_WIDTH : nw
    const th = scaled ? Math.max(1, Math.round((nh * MAX_WIDTH) / nw)) : nh
    if (k === 'png') {
      canvas = drawScaled(img, tw, th)
      hasAlpha = canvasHasAlpha(canvas)
    }
    const plan = planImage({ kind: k, width: nw, height: nh, bytes: file.size, hasAlpha })

    let blob: Blob = file
    let note: string | null = null
    if (plan.action === 'encode') {
      if (!canvas) canvas = drawScaled(img, plan.width, plan.height)
      if (plan.format === 'jpeg') {
        // 透明像素转 JPEG 会变黑：先铺白底（无透明时这一步没有视觉影响）
        const c2 = document.createElement('canvas')
        c2.width = canvas.width
        c2.height = canvas.height
        const ctx = c2.getContext('2d')
        if (!ctx) throw new ImageRejectError('浏览器不支持图片处理（画布不可用）')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, c2.width, c2.height)
        ctx.drawImage(canvas, 0, 0)
        blob = await canvasToBlob(c2, 'image/jpeg', JPEG_QUALITY)
      } else {
        blob = await canvasToBlob(canvas, 'image/png')
      }
      // JPEG 原图不超宽、重新编码反而更大：用原图
      if (k === 'jpeg' && !scaled && blob.size >= file.size) blob = file
      const parts: string[] = []
      if (scaled) parts.push(`已从 ${nw}px 缩到 ${plan.width}px 宽`)
      if (k === 'png' && plan.format === 'jpeg') parts.push('PNG 无透明，已转为 JPG')
      if (blob !== file) parts.push(`${(file.size / 1024).toFixed(0)} KB → ${(blob.size / 1024).toFixed(0)} KB`)
      note = parts.length ? parts.join('，') : null
    }

    if (blob.size > MAX_BYTES) {
      throw new ImageRejectError(`处理后仍有 ${(blob.size / 1024).toFixed(0)} KB，超过 1MB 上限。请换一张更小的图`)
    }
    const ext = plan.format === 'jpeg' ? 'jpg' : plan.format
    return {
      blob,
      fileName: `${baseName(file.name)}.${ext}`,
      width: plan.width,
      height: plan.height,
      bytes: blob.size,
      note,
      warn: blob.size > WARN_BYTES ? `图片 ${(blob.size / 1024).toFixed(0)} KB，超过建议的 300 KB，手机上加载会慢` : null,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** 上传到后台专用接口，返回绝对 https 地址 */
export async function uploadImage(p: PreparedImage, signal?: AbortSignal): Promise<string> {
  const fd = new FormData()
  fd.append('file', p.blob, p.fileName)
  let res: Response
  try {
    res = await fetch('/api/admin/marketing/upload', { method: 'POST', body: fd, signal })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') throw e
    throw new ImageRejectError('网络异常，上传失败')
  }
  let body: { success?: boolean; data?: { url?: string }; error?: string } | null = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  if (!res.ok || !body?.success) throw new ImageRejectError(body?.error || `上传失败（HTTP ${res.status}）`)
  const url = body.data?.url
  if (!url || !/^https:\/\//i.test(url)) throw new ImageRejectError('上传接口没有返回 https 地址')
  return url
}
