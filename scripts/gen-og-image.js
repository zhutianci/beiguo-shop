/**
 * 离线生成站点分享底图（一次性跑，产物提交进 public/，运行时零成本）。
 *
 *   node scripts/gen-og-image.js
 *
 * 【为什么不用 next/og】standalone 模式下 next/og 有已知内存泄漏，satori 的 WASM
 * 还会把 CPU 打到 300%——1.8G 内存 + 单核的机器上这是直接把站点打死的操作。
 * 【为什么不装图形库】不引入任何新 npm 依赖。这里只用 Node 自带的 zlib：
 * PNG = IHDR + zlib 压缩的扫描线 + IEND，手写编码器 60 行就够，
 * 与 lib/aliyun.ts 手搓签名、lib/news/feed.ts 手搓 RSS 解析是同一个思路。
 *
 * 【局限：只能画拉丁字母】没有字体文件就无法排版中文，所以底图上是英文字标。
 * 中文的分享标题由 <title> / og:title 承载（微信本来就只读 <title>），
 * 图片在这里只负责「有一张干净的品牌图」，不承载信息。
 *
 * 产物：
 *   public/og-default.png   1200x630  站点默认分享底图。/news 有按分类的底图
 *                                     （public/news-og/*.png），这张是它们的兜底，
 *                                     也是首页/商品页等非新闻页的 og:image。
 *   public/logo-square.png   512x512  方形站标：favicon、JSON-LD publisher.logo，
 *                                     以及微信取正文缩略图时的兜底（≥300x300 是硬门槛）。
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ---- PNG 编码 ----

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** rgb: Buffer，长度 w*h*3，逐像素 RGB */
function encodePng(w, h, rgb) {
  const stride = w * 3
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0 // 过滤器类型 0（None）：图小，不值得为压缩率做逐行选优
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // 位深
  ihdr[9] = 2 // 颜色类型 2 = 真彩色 RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- 画布 ----

function canvas(w, h) {
  const buf = Buffer.alloc(w * h * 3)
  const px = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const i = (y * w + x) * 3
    if (a === undefined || a >= 1) {
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
    } else {
      buf[i] = Math.round(buf[i] * (1 - a) + r * a)
      buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a)
      buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a)
    }
  }
  return { w, h, buf, px }
}

/** 对角线性渐变，顺带叠一层轻微的暗角，避免大色块显得平 */
function gradient(c, from, to) {
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const t = (x / c.w) * 0.55 + (y / c.h) * 0.45
      c.px(
        x,
        y,
        Math.round(from[0] + (to[0] - from[0]) * t),
        Math.round(from[1] + (to[1] - from[1]) * t),
        Math.round(from[2] + (to[2] - from[2]) * t)
      )
    }
  }
}

function rect(c, x, y, w, h, color, alpha) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) c.px(x + i, y + j, color[0], color[1], color[2], alpha)
}

function roundRect(c, x, y, w, h, r, color, alpha) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const dx = i < r ? r - i : i >= w - r ? i - (w - r - 1) : 0
      const dy = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0
      if (dx * dx + dy * dy > r * r) continue
      c.px(x + i, y + j, color[0], color[1], color[2], alpha)
    }
  }
}

// ---- 5x7 点阵字模（只收底图上真正用到的字符） ----

const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
}

/** 画一行字，scale 是每个点阵格子的像素边长 */
function text(c, str, x, y, scale, color, alpha) {
  let cx = x
  for (let k = 0; k < str.length; k++) {
    const g = FONT[str[k]]
    if (!g) {
      cx += scale * 6
      continue
    }
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '#') rect(c, cx + col * scale, y + r * scale, scale, scale, color, alpha)
      }
    }
    cx += scale * 6
  }
  return cx - x - scale // 返回实际宽度，方便居中
}

function textWidth(str, scale) {
  return str.length * scale * 6 - scale
}

// ---- 具体两张图 ----

const BRAND_FROM = [15, 23, 42] // slate-900
const BRAND_TO = [12, 74, 110] // primary-900
const ACCENT = [56, 189, 248] // primary-400
const WHITE = [255, 255, 255]

/** 品牌标块：圆角方块 + 反白的 B */
function logoTile(c, x, y, size) {
  roundRect(c, x, y, size, size, Math.round(size * 0.22), ACCENT)
  const s = Math.round(size / 9)
  const gw = 5 * s
  const gh = 7 * s
  text(c, 'B', x + Math.round((size - gw) / 2), y + Math.round((size - gh) / 2), s, BRAND_FROM)
}

function buildOg() {
  const c = canvas(1200, 630)
  gradient(c, BRAND_FROM, BRAND_TO)

  // 顶部一条高亮细线，给纯色背景一点结构
  rect(c, 0, 0, 1200, 8, ACCENT)

  logoTile(c, 96, 150, 132)

  text(c, 'BIGOLAB', 268, 158, 11, WHITE)
  // 刻意不用 "NEWS"：这是全站唯一一处会随分享扩散的自我标称，
  // 而我们的定性是「行业动态聚合工具」而非新闻信息服务（见 SKILL.md §1）。
  text(c, 'AI INDUSTRY DIGEST', 270, 258, 5, ACCENT)

  // 分隔线
  rect(c, 96, 400, 1008, 2, WHITE, 0.18)

  const foot = 'BIGOLAB.COM'
  text(c, foot, 96, 452, 6, WHITE, 0.85)

  // 右下角三个圆点做视觉配重
  for (let i = 0; i < 3; i++) roundRect(c, 1040 + i * 26, 462, 16, 16, 8, ACCENT, 0.9 - i * 0.25)

  return encodePng(c.w, c.h, c.buf)
}

function buildLogo() {
  // 512x512：favicon 与 JSON-LD publisher.logo 通吃；也满足微信取图的 ≥300x300 门槛
  const c = canvas(512, 512)
  gradient(c, BRAND_FROM, BRAND_TO)
  rect(c, 0, 0, 512, 6, ACCENT)

  logoTile(c, 190, 120, 132)

  const w1 = textWidth('BIGOLAB', 6)
  text(c, 'BIGOLAB', Math.round((512 - w1) / 2), 292, 6, WHITE)
  const w2 = textWidth('AI NEWS', 4)
  text(c, 'AI NEWS', Math.round((512 - w2) / 2), 356, 4, ACCENT)

  rect(c, 136, 412, 240, 2, WHITE, 0.18)
  const w3 = textWidth('BIGOLAB.COM', 3)
  text(c, 'BIGOLAB.COM', Math.round((512 - w3) / 2), 440, 3, WHITE, 0.75)

  return encodePng(c.w, c.h, c.buf)
}

/**
 * 六张分类底图：public/news-og/<slug>.png，由 lib/news/format.ts 的 ogImageForCategory() 取用，
 * 取不到时回落 og-default.png。分类固定 6 个（SKILL.md §4），加一个分类就在这里加一行。
 *
 * 每类换一个强调色：微信/朋友圈里一排分享卡片挨着时，颜色是唯一能一眼分开它们的信号。
 * 底图上刻意只放品牌与分类，不放标题——标题由 og:title 承载，
 * 而且底图是静态产物，放标题就得每条内容生成一张图，那是另一套成本。
 */
const CATEGORY_OG = [
  { slug: 'ai-models', word: 'MODELS', to: [46, 16, 101], accent: [167, 139, 250] },
  { slug: 'ai-products', word: 'PRODUCTS', to: [8, 51, 68], accent: [34, 211, 238] },
  { slug: 'industry', word: 'INDUSTRY', to: [69, 26, 3], accent: [251, 191, 36] },
  { slug: 'paper', word: 'PAPERS', to: [6, 44, 38], accent: [52, 211, 153] },
  { slug: 'tool', word: 'TOOLS', to: [30, 27, 75], accent: [129, 140, 248] },
  { slug: 'opinion', word: 'OPINION', to: [80, 7, 36], accent: [244, 114, 182] },
]

function buildCategoryOg(word, to, accent) {
  const c = canvas(1200, 630)
  gradient(c, BRAND_FROM, to)
  rect(c, 0, 0, 1200, 8, accent)

  // 品牌标块沿用同一个形状，只换颜色，保证六张图与默认图是一家人
  roundRect(c, 96, 132, 96, 96, 21, accent)
  const s = Math.round(96 / 9)
  text(c, 'B', 96 + Math.round((96 - 5 * s) / 2), 132 + Math.round((96 - 7 * s) / 2), s, BRAND_FROM)

  text(c, 'BIGOLAB', 224, 148, 7, WHITE, 0.92)

  // 分类词是画面主体，字号按词长自适应，保证长词（PRODUCTS）也不出血
  const scale = word.length > 7 ? 13 : 16
  text(c, word, 96, 300, scale, accent)

  rect(c, 96, 470, 1008, 2, WHITE, 0.16)
  text(c, 'BIGOLAB.COM', 96, 520, 5, WHITE, 0.8)
  for (let i = 0; i < 3; i++) roundRect(c, 1040 + i * 26, 526, 16, 16, 8, accent, 0.9 - i * 0.25)

  return encodePng(c.w, c.h, c.buf)
}

const outDir = path.join(__dirname, '..', 'public')
fs.writeFileSync(path.join(outDir, 'og-default.png'), buildOg())
fs.writeFileSync(path.join(outDir, 'logo-square.png'), buildLogo())

const newsOgDir = path.join(outDir, 'news-og')
fs.mkdirSync(newsOgDir, { recursive: true })
for (const cat of CATEGORY_OG) {
  fs.writeFileSync(path.join(newsOgDir, `${cat.slug}.png`), buildCategoryOg(cat.word, cat.to, cat.accent))
}

console.log('生成完成：public/og-default.png (1200x630)、public/logo-square.png (512x512)')
console.log(`生成完成：public/news-og/*.png ${CATEGORY_OG.length} 张 (1200x630)`)
