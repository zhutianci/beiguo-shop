/**
 * 零依赖 QR 码编码（字节模式，版本 1–10，纠错等级 L / M）。
 *
 * 为什么自己写：上一轮刚把 `qrcode` 依赖删掉，1.8G 内存的机器上每个运行时依赖都要算账，
 * 而海报只需要把一条 60~90 字符的 https 链接编成矩阵——用不到完整库的 40 个版本、
 * 数字/汉字模式与解码能力。风格与 lib/aliyun.ts 手搓签名、lib/news/feed.ts 手搓 RSS 一致。
 *
 * 输出的是纯 boolean 矩阵，由调用方决定怎么画（canvas fillRect / SVG / DOM 都行）。
 * 这里刻意不产出 <img>，因为海报 canvas 绝不能 drawImage 任何外部图片：
 * 一旦污染 canvas，toDataURL 会直接抛 SecurityError，整张海报就废了。
 *
 * 算法按 ISO/IEC 18004 实现，掩码按标准罚分逐一评估后取最优——
 * 掩码选得差会明显降低朋友圈长按识别的成功率，不能图省事写死 mask 0。
 */

export type QrEcl = 'L' | 'M'

/** 格式信息里的纠错等级编码（注意不是 0/1 的顺序） */
const ECL_FORMAT_BITS: Record<QrEcl, number> = { L: 1, M: 0 }

/** 每个块的纠错码字数，下标 = 版本号（1–10） */
const ECC_PER_BLOCK: Record<QrEcl, number[]> = {
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
}

/** 纠错块数量，下标 = 版本号（1–10） */
const NUM_BLOCKS: Record<QrEcl, number[]> = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
}

/** 总码字数（数据 + 纠错），下标 = 版本号 */
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346]

/** 校正图形中心坐标，下标 = 版本号 */
const ALIGN_POS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const MAX_VERSION = 10

// ---- GF(256) 运算（生成多项式 0x11D） ----

function gfMul(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

/** 生成 degree 次的 Reed-Solomon 除数多项式 */
function rsDivisor(degree: number): number[] {
  const result: number[] = new Array(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root)
      if (j + 1 < degree) result[j] ^= result[j + 1]
    }
    root = gfMul(root, 0x02)
  }
  return result
}

/** 计算数据的 Reed-Solomon 余数（即纠错码字） */
function rsRemainder(data: number[], divisor: number[]): number[] {
  const result: number[] = new Array(divisor.length).fill(0)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ (result.shift() as number)
    result.push(0)
    for (let j = 0; j < divisor.length; j++) result[j] ^= gfMul(divisor[j], factor)
  }
  return result
}

const getBit = (x: number, i: number): boolean => ((x >>> i) & 1) !== 0

// ---- 数据编码 ----

function utf8Bytes(text: string): number[] {
  // TextEncoder 在浏览器与 Node 18+ 都有；退路是手写 UTF-8（海报里可能出现中文）
  if (typeof TextEncoder !== 'undefined') {
    const arr = new TextEncoder().encode(text)
    const out: number[] = []
    for (let i = 0; i < arr.length; i++) out.push(arr[i])
    return out
  }
  const out: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
  }
  return out
}

/** 字符计数指示符位宽：版本 1–9 为 8 位，10 及以上为 16 位（字节模式） */
const charCountBits = (version: number): number => (version <= 9 ? 8 : 16)

/** 该版本 + 纠错等级下可用的数据码字数 */
function dataCodewords(version: number, ecl: QrEcl): number {
  return TOTAL_CODEWORDS[version] - ECC_PER_BLOCK[ecl][version] * NUM_BLOCKS[ecl][version]
}

/** 按纠错块切分、逐块算纠错码、再交错回一条码字流 */
function addEccAndInterleave(data: number[], version: number, ecl: QrEcl): number[] {
  const numBlocks = NUM_BLOCKS[ecl][version]
  const blockEccLen = ECC_PER_BLOCK[ecl][version]
  const rawCodewords = TOTAL_CODEWORDS[version]
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks)
  const shortBlockLen = Math.floor(rawCodewords / numBlocks)

  const divisor = rsDivisor(blockEccLen)
  const blocks: number[][] = []
  let k = 0
  for (let i = 0; i < numBlocks; i++) {
    const len = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1)
    const dat = data.slice(k, k + len)
    k += len
    const ecc = rsRemainder(dat, divisor)
    // 短块补一个占位字节，让所有块等长，交错时再跳过它
    if (i < numShortBlocks) dat.push(0)
    blocks.push(dat.concat(ecc))
  }

  const result: number[] = []
  for (let i = 0; i < blocks[0].length; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(blocks[j][i])
    }
  }
  return result
}

// ---- 矩阵构建 ----

interface Grid {
  size: number
  modules: boolean[][]
  isFunction: boolean[][]
}

function newGrid(size: number): Grid {
  const modules: boolean[][] = []
  const isFunction: boolean[][] = []
  for (let i = 0; i < size; i++) {
    modules.push(new Array(size).fill(false))
    isFunction.push(new Array(size).fill(false))
  }
  return { size, modules, isFunction }
}

function setFn(g: Grid, x: number, y: number, dark: boolean): void {
  if (x < 0 || y < 0 || x >= g.size || y >= g.size) return
  g.modules[y][x] = dark
  g.isFunction[y][x] = true
}

function drawFinder(g: Grid, x: number, y: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy))
      setFn(g, x + dx, y + dy, dist !== 2 && dist !== 4)
    }
  }
}

function drawAlignment(g: Grid, x: number, y: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      setFn(g, x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  }
}

function drawFormatBits(g: Grid, ecl: QrEcl, mask: number): void {
  const data = (ECL_FORMAT_BITS[ecl] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = (((data << 10) | rem) ^ 0x5412) & 0x7fff
  const size = g.size

  for (let i = 0; i <= 5; i++) setFn(g, 8, i, getBit(bits, i))
  setFn(g, 8, 7, getBit(bits, 6))
  setFn(g, 8, 8, getBit(bits, 7))
  setFn(g, 7, 8, getBit(bits, 8))
  for (let i = 9; i < 15; i++) setFn(g, 14 - i, 8, getBit(bits, i))

  for (let i = 0; i < 8; i++) setFn(g, size - 1 - i, 8, getBit(bits, i))
  for (let i = 8; i < 15; i++) setFn(g, 8, size - 15 + i, getBit(bits, i))
  setFn(g, 8, size - 8, true) // 固定的黑模块
}

function drawFunctionPatterns(g: Grid, version: number, ecl: QrEcl): void {
  const size = g.size
  // 定时图形
  for (let i = 0; i < size; i++) {
    setFn(g, 6, i, i % 2 === 0)
    setFn(g, i, 6, i % 2 === 0)
  }
  // 三个定位图形（连带分隔符）
  drawFinder(g, 3, 3)
  drawFinder(g, size - 4, 3)
  drawFinder(g, 3, size - 4)

  // 校正图形：跳过与定位图形重叠的三个角
  const pos = ALIGN_POS[version]
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const corner =
        (i === 0 && j === 0) ||
        (i === 0 && j === pos.length - 1) ||
        (i === pos.length - 1 && j === 0)
      if (!corner) drawAlignment(g, pos[i], pos[j])
    }
  }

  // 先用 mask 0 占位，选定掩码后再重画
  drawFormatBits(g, ecl, 0)

  // 版本信息（版本 7 及以上才有）
  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const dark = getBit(bits, i)
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFn(g, a, b, dark)
      setFn(g, b, a, dark)
    }
  }
}

/** 按之字形把码字铺进非功能模块 */
function drawCodewords(g: Grid, data: number[]): void {
  const size = g.size
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5 // 第 6 列是定时图形，整列跳过
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vert : vert
        if (!g.isFunction[y][x] && i < data.length * 8) {
          g.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7))
          i++
        }
      }
    }
  }
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
}

function applyMask(g: Grid, mask: number): void {
  for (let y = 0; y < g.size; y++) {
    for (let x = 0; x < g.size; x++) {
      if (!g.isFunction[y][x] && maskBit(mask, x, y)) g.modules[y][x] = !g.modules[y][x]
    }
  }
}

// ---- 掩码罚分（ISO 18004 的四条规则） ----

function finderPenaltyCountPatterns(g: Grid, h: number[]): number {
  const n = h[1]
  const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n
  return (
    (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0)
  )
}

function finderPenaltyAddHistory(g: Grid, runLength: number, h: number[]): void {
  if (h[0] === 0) runLength += g.size // 首段前面补上浅色边框
  h.pop()
  h.unshift(runLength)
}

function finderPenaltyTerminate(g: Grid, runColor: boolean, runLength: number, h: number[]): number {
  if (runColor) {
    finderPenaltyAddHistory(g, runLength, h)
    runLength = 0
  }
  finderPenaltyAddHistory(g, runLength + g.size, h)
  return finderPenaltyCountPatterns(g, h)
}

function penaltyScore(g: Grid): number {
  const size = g.size
  let result = 0

  // 规则 1 + 3：同色连段、以及类定位图形
  for (let y = 0; y < size; y++) {
    let runColor = false
    let runLen = 0
    const hist = [0, 0, 0, 0, 0, 0, 0]
    for (let x = 0; x < size; x++) {
      if (g.modules[y][x] === runColor) {
        runLen++
        if (runLen === 5) result += 3
        else if (runLen > 5) result++
      } else {
        finderPenaltyAddHistory(g, runLen, hist)
        if (!runColor) result += finderPenaltyCountPatterns(g, hist) * 40
        runColor = g.modules[y][x]
        runLen = 1
      }
    }
    result += finderPenaltyTerminate(g, runColor, runLen, hist) * 40
  }
  for (let x = 0; x < size; x++) {
    let runColor = false
    let runLen = 0
    const hist = [0, 0, 0, 0, 0, 0, 0]
    for (let y = 0; y < size; y++) {
      if (g.modules[y][x] === runColor) {
        runLen++
        if (runLen === 5) result += 3
        else if (runLen > 5) result++
      } else {
        finderPenaltyAddHistory(g, runLen, hist)
        if (!runColor) result += finderPenaltyCountPatterns(g, hist) * 40
        runColor = g.modules[y][x]
        runLen = 1
      }
    }
    result += finderPenaltyTerminate(g, runColor, runLen, hist) * 40
  }

  // 规则 2：2x2 同色块
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = g.modules[y][x]
      if (c === g.modules[y][x + 1] && c === g.modules[y + 1][x] && c === g.modules[y + 1][x + 1]) {
        result += 3
      }
    }
  }

  // 规则 4：黑白比例偏离 50%
  let dark = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) if (g.modules[y][x]) dark++
  }
  const total = size * size
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1
  result += k * 10
  return result
}

/**
 * 把文本编成 QR 矩阵。返回 boolean[行][列]，true = 深色模块。
 * 内容过长（超过版本 10 的容量）返回 null，由调用方降级为「复制链接」。
 */
export function qrMatrix(text: string, ecl: QrEcl = 'M'): boolean[][] | null {
  const bytes = utf8Bytes(text)

  // 选能装下的最小版本
  let version = 0
  for (let v = 1; v <= MAX_VERSION; v++) {
    const capacityBits = dataCodewords(v, ecl) * 8
    if (4 + charCountBits(v) + bytes.length * 8 <= capacityBits) {
      version = v
      break
    }
  }
  if (version === 0) return null

  // 位流：模式指示符(0100) + 字符计数 + 数据
  const bits: number[] = []
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1)
  }
  appendBits(0b0100, 4)
  appendBits(bytes.length, charCountBits(version))
  for (let i = 0; i < bytes.length; i++) appendBits(bytes[i], 8)

  const capacityBits = dataCodewords(version, ecl) * 8
  // 结束符最多 4 个 0，然后补到字节边界
  appendBits(0, Math.min(4, capacityBits - bits.length))
  appendBits(0, (8 - (bits.length % 8)) % 8)
  // 交替填充字节 0xEC / 0x11
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) appendBits(pad, 8)

  const codewords: number[] = new Array(bits.length >>> 3).fill(0)
  for (let i = 0; i < bits.length; i++) codewords[i >>> 3] |= bits[i] << (7 - (i & 7))

  const allCodewords = addEccAndInterleave(codewords, version, ecl)

  const g = newGrid(version * 4 + 17)
  drawFunctionPatterns(g, version, ecl)
  drawCodewords(g, allCodewords)

  // 逐个掩码试，取罚分最低的
  let bestMask = 0
  let bestPenalty = Infinity
  for (let mask = 0; mask < 8; mask++) {
    applyMask(g, mask)
    drawFormatBits(g, ecl, mask)
    const p = penaltyScore(g)
    if (p < bestPenalty) {
      bestPenalty = p
      bestMask = mask
    }
    applyMask(g, mask) // 异或两次即还原
  }
  applyMask(g, bestMask)
  drawFormatBits(g, ecl, bestMask)

  return g.modules
}

/**
 * 直接把 QR 画进 canvas 上下文。纯 fillRect，不涉及任何图片资源，
 * 因此不会污染 canvas（这正是海报能 toDataURL 的前提）。
 */
export function drawQr(
  ctx: CanvasRenderingContext2D,
  matrix: boolean[][],
  x: number,
  y: number,
  size: number,
  opts: { dark?: string; light?: string; quietZone?: number } = {}
): void {
  const dark = opts.dark || '#0f172a'
  const light = opts.light || '#ffffff'
  const quiet = opts.quietZone ?? 3 // 静默区少于 3 个模块会明显拉低识别率
  const n = matrix.length + quiet * 2
  const scale = size / n

  ctx.fillStyle = light
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = dark
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (!matrix[r][c]) continue
      // 向上取整并多画 1px，避免缩放留下白缝导致识别失败
      ctx.fillRect(
        x + Math.floor((c + quiet) * scale),
        y + Math.floor((r + quiet) * scale),
        Math.ceil(scale) + 1,
        Math.ceil(scale) + 1
      )
    }
  }
}
