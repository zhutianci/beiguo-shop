/**
 * 上传图片去元数据（内容平台 P0，设计 §6.6）。零依赖，纯函数，scripts/check-image-meta.ts 直接测。
 *
 * 【为什么要去】手机拍的照片 EXIF 里带 GPS 坐标、设备型号、拍摄时间。论坛配图是公开的，
 * 买家随手传一张截图以外的照片，就可能把住址挂给所有访客和爬虫。
 *
 * 【为什么不用 sharp】sharp 带原生二进制，服务器构建内存本来就紧（交接文档：本机构建必 OOM、
 * 服务器构建堆有上限），为了「删几个段」引入它不划算。这里只做容器层的剪裁：
 * 不解码、不重编码像素，所以不会降画质，也几乎不耗 CPU。压缩成 WebP 是 P1 的事（另行评估）。
 *
 * 【方向（Orientation）必须保留】手机竖拍的 JPEG，像素是横着存的、靠 EXIF Orientation=6 告诉浏览器转 90°。
 * 把 EXIF 整段删掉，图片就会躺倒。所以先读出 Orientation，删完再补一段**只含这一个标签**的最小 EXIF。
 *
 * 各格式的处理：
 *  - JPEG：删 APP1（Exif / XMP）、APP3–APP13、APP15、COM；保留 APP0（JFIF）、APP2（ICC 色彩配置）、APP14（Adobe 色彩变换）
 *  - PNG ：删 eXIf / tEXt / zTXt / iTXt / tIME 块
 *  - WebP：删 EXIF / XMP 块，并清掉 VP8X 头里对应的标志位、改写 RIFF 长度
 *  - GIF ：不处理（GIF 没有 EXIF；注释扩展块极少见，P0 不管）
 * 任何一步解析不通都**原样返回** stripped=false：宁可这一张没剥干净（调用方会记日志），也不能把图写坏。
 */

export interface StripResult {
  buf: Buffer
  stripped: boolean
}

export function stripImageMetadata(buf: Buffer, ext: string): StripResult {
  try {
    if (ext === 'jpg') return stripJpeg(buf)
    if (ext === 'png') return stripPng(buf)
    if (ext === 'webp') return stripWebp(buf)
  } catch {
    /* 解析失败：原样返回 */
  }
  return { buf, stripped: false }
}

// ─────────────────────────────── JPEG ───────────────────────────────

/** 保留的 APPn：APP0 JFIF、APP2 ICC_PROFILE、APP14 Adobe */
const JPEG_KEEP_APP = new Set([0xe0, 0xe2, 0xee])

function stripJpeg(buf: Buffer): StripResult {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return { buf, stripped: false }
  const kept: Buffer[] = [buf.subarray(0, 2)]
  let orientation = 1
  let i = 2
  let afterApp0 = -1 // 最小 EXIF 插在 APP0 之后（没有 APP0 就插在 SOI 之后）

  while (i < buf.length) {
    if (buf[i] !== 0xff) return { buf, stripped: false } // 段结构坏了
    // 跳过填充字节 0xFF 0xFF …
    let m = i + 1
    while (m < buf.length && buf[m] === 0xff) m++
    if (m >= buf.length) return { buf, stripped: false }
    const marker = buf[m]
    const segStart = i
    // 无长度的独立标记：TEM、RST0–7
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(buf.subarray(segStart, m + 1))
      i = m + 1
      continue
    }
    if (marker === 0xd9) {
      kept.push(buf.subarray(segStart, m + 1))
      i = m + 1
      break
    }
    if (m + 2 >= buf.length) return { buf, stripped: false }
    const len = buf.readUInt16BE(m + 1) // 含长度字段自身的 2 字节
    if (len < 2) return { buf, stripped: false }
    const segEnd = m + 1 + len
    if (segEnd > buf.length) return { buf, stripped: false }

    if (marker === 0xda) {
      // SOS：之后是熵编码数据直到 EOI，整段原样保留
      kept.push(buf.subarray(segStart))
      i = buf.length
      break
    }

    const isApp = marker >= 0xe0 && marker <= 0xef
    if (marker === 0xe1) {
      const o = readExifOrientation(buf.subarray(m + 3, segEnd))
      if (o) orientation = o
    }
    const drop = (isApp && !JPEG_KEEP_APP.has(marker)) || marker === 0xfe
    if (!drop) {
      kept.push(buf.subarray(segStart, segEnd))
      if (marker === 0xe0 && afterApp0 < 0) afterApp0 = kept.length
    }
    i = segEnd
  }

  if (orientation !== 1) {
    const at = afterApp0 > 0 ? afterApp0 : 1
    kept.splice(at, 0, minimalExifApp1(orientation))
  }
  return { buf: Buffer.concat(kept), stripped: true }
}

/** 从 APP1 的数据部分（"Exif\0\0" 起）读 IFD0 里的 Orientation（0x0112）。读不到返回 0 */
export function readExifOrientation(app1: Buffer): number {
  if (app1.length < 14 || app1.subarray(0, 6).toString('latin1') !== 'Exif\0\0') return 0
  const t = app1.subarray(6) // TIFF 头
  const order = t.subarray(0, 2).toString('latin1')
  const le = order === 'II'
  if (!le && order !== 'MM') return 0
  const u16 = (o: number) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o))
  const u32 = (o: number) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o))
  if (u16(2) !== 0x2a) return 0
  const ifd = u32(4)
  if (ifd + 2 > t.length) return 0
  const n = u16(ifd)
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + k * 12
    if (e + 12 > t.length) return 0
    if (u16(e) === 0x0112) {
      const v = u16(e + 8) // SHORT，值直接放在 value 字段的前 2 字节
      return v >= 1 && v <= 8 ? v : 0
    }
  }
  return 0
}

/** 只含 Orientation 一个标签的 APP1 段（大端），共 36 字节 */
export function minimalExifApp1(orientation: number): Buffer {
  const b = Buffer.alloc(36)
  b[0] = 0xff
  b[1] = 0xe1
  b.writeUInt16BE(34, 2) // 段长：2（长度字段）+ 6（Exif\0\0）+ 8（TIFF 头）+ 2 + 12 + 4
  b.write('Exif\0\0', 4, 'latin1')
  b.write('MM', 10, 'latin1')
  b.writeUInt16BE(0x2a, 12)
  b.writeUInt32BE(8, 14) // IFD0 偏移
  b.writeUInt16BE(1, 18) // 1 个条目
  b.writeUInt16BE(0x0112, 20) // Orientation
  b.writeUInt16BE(3, 22) // SHORT
  b.writeUInt32BE(1, 24) // count
  b.writeUInt16BE(orientation, 28)
  b.writeUInt16BE(0, 30)
  b.writeUInt32BE(0, 32) // 没有下一个 IFD
  return b
}

// ─────────────────────────────── PNG ───────────────────────────────

const PNG_DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME'])

function stripPng(buf: Buffer): StripResult {
  if (buf.length < 8) return { buf, stripped: false }
  const kept: Buffer[] = [buf.subarray(0, 8)]
  let i = 8
  while (i < buf.length) {
    if (i + 12 > buf.length) return { buf, stripped: false }
    const len = buf.readUInt32BE(i)
    const type = buf.subarray(i + 4, i + 8).toString('latin1')
    const end = i + 12 + len
    if (end > buf.length) return { buf, stripped: false }
    if (!PNG_DROP.has(type)) kept.push(buf.subarray(i, end))
    i = end
    if (type === 'IEND') break
  }
  return { buf: Buffer.concat(kept), stripped: true }
}

// ─────────────────────────────── WebP ───────────────────────────────

function stripWebp(buf: Buffer): StripResult {
  if (buf.length < 12 || buf.subarray(0, 4).toString('latin1') !== 'RIFF' || buf.subarray(8, 12).toString('latin1') !== 'WEBP') {
    return { buf, stripped: false }
  }
  const chunks: Buffer[] = []
  let i = 12
  let vp8xIndex = -1
  while (i < buf.length) {
    if (i + 8 > buf.length) return { buf, stripped: false }
    const fourcc = buf.subarray(i, i + 4).toString('latin1')
    const size = buf.readUInt32LE(i + 4)
    const end = i + 8 + size + (size & 1) // 块按偶数对齐
    if (i + 8 + size > buf.length) return { buf, stripped: false }
    const chunk = buf.subarray(i, Math.min(end, buf.length))
    if (fourcc !== 'EXIF' && fourcc !== 'XMP ') {
      if (fourcc === 'VP8X') vp8xIndex = chunks.length
      chunks.push(Buffer.from(chunk)) // 复制一份：下面要改 VP8X 的标志位
    }
    i = end
  }
  if (vp8xIndex >= 0) {
    // VP8X 负载第一个字节的标志位：0x08 = 有 EXIF、0x04 = 有 XMP
    chunks[vp8xIndex][8] &= ~(0x08 | 0x04)
  }
  const body = Buffer.concat(chunks)
  const head = Buffer.alloc(12)
  head.write('RIFF', 0, 'latin1')
  head.writeUInt32LE(4 + body.length, 4)
  head.write('WEBP', 8, 'latin1')
  return { buf: Buffer.concat([head, body]), stripped: true }
}
