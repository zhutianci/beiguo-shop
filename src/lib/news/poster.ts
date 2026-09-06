/**
 * 分享海报的绘制逻辑。与 React 解耦放在 lib 里，理由有两条：
 * 一是它是纯函数（给一个 2d context 就能画），可以在浏览器里单独跑起来看效果，
 * 不必启整个应用；二是组件那边只剩交互与降级，读起来清楚得多。
 *
 * 【硬约束，改之前先读】
 * 1. 尺寸只能 750×1334，不要用 2x 的 1500×2668：后者是 16MB 位图，
 *    低端安卓微信 X5 内核上直接 OOM 白屏。宁可稍糊也不能崩。
 * 2. 绝不 drawImage 任何外部图片。一旦污染 canvas，toDataURL 会抛 SecurityError，
 *    整张海报作废。所以这里只有渐变、文字和手绘二维码——
 *    这条技术约束跟「绝不使用原文配图」的版权结论（SKILL.md §1.1）正好互相加固。
 * 3. AI 标识出现两处：顶部徽章 + 底部脚注。这是《标识办法》要求的法定位置
 *    （SKILL.md §6 第 6 处），少一处都不合规。
 */
// 只依赖常量与 QR 编码这两个纯模块。刻意不 import share.ts——
// 那边会拉进 forum-client（localStorage/navigator），绘制逻辑不该背上浏览器依赖。
import { AI_BADGE, AI_DISCLAIMER, AI_NOTICE, AUTHOR_NAME, categoryLabel } from './constants'
import { drawQr, qrMatrix } from './qr'

export const POSTER_W = 750
export const POSTER_H = 1334

export interface PosterData {
  headline: string
  summary?: string | null
  whyItMatters?: string | null
  category?: string | null
  /** 信源媒体名，只画文字 */
  sources?: string[]
  happenedAt?: string | null
  /** 二维码扫出来的地址（应当已带渠道标记 ?s=p） */
  url: string
}

const FONT_STACK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
const font = (size: number, weight = 400) => `${weight} ${size}px ${FONT_STACK}`

const PAD = 64
const CW = POSTER_W - PAD * 2

/** 拉丁词内字符：字母、数字，以及会出现在型号里的 . - / +（"GPT-4.1"、"Llama-3-70B"、"1.8x"） */
const WORD_CHAR = /[0-9A-Za-z._\-/+]/

/**
 * 按像素宽度断行，中英混排逐字符量宽。
 *
 * 中文没有词边界，逐字断开天经地义；但英文不行——AI 资讯里到处是
 * 「FlashAttention-3」「SWE-bench」「Llama-3-70B」这类型号，
 * 逐字符断会切成「Fla / shAttention-3」，读者第一眼认不出是什么东西，
 * 海报的说服力直接归零。所以遇到拉丁词就整词挪到下一行。
 *
 * 只对「不长于 16 个字符」的词回退：更长的词（罕见）宁可切开，
 * 也好过为了它在上一行留一大片空白。
 */
export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = []
  let cur = ''

  /** 收尾：超出行数上限时给最后一行加省略号 */
  const truncated = (): string[] => {
    const last = lines[maxLines - 1]
    lines[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1)).replace(/\s+$/, '')}…`
    return lines
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') {
      lines.push(cur)
      cur = ''
      if (lines.length >= maxLines) return lines
      continue
    }
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      // 若断点落在一个拉丁词中间，把整个词挪到下一行
      let cut = cur.length
      if (WORD_CHAR.test(ch)) {
        let k = cur.length
        while (k > 0 && WORD_CHAR.test(cur[k - 1])) k--
        if (k > 0 && cur.length - k <= 16) cut = k
      }
      lines.push(cur.slice(0, cut).replace(/\s+$/, ''))
      cur = cur.slice(cut) + ch
      if (lines.length >= maxLines) return truncated()
    } else {
      // 行首不留空格，否则整段左边缘会参差
      cur = cur === '' && ch === ' ' ? '' : cur + ch
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, maxLines)
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number
): number {
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lineHeight)
  return y + lines.length * lineHeight
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 固定东八区偏移，不依赖运行环境时区（与 format.ts / cardkeys 分析同一套口径） */
function formatDate(iso: string): string {
  const t = new Date(iso)
  if (isNaN(t.getTime())) return ''
  const d = new Date(t.getTime() + 8 * 3600000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

/**
 * 把整张海报画进给定的 2d context（画布须为 750×1334）。
 * 全程同步、不加载任何外部资源，因此调用方 toDataURL 时 canvas 一定是干净的。
 */
export function paintPoster(ctx: CanvasRenderingContext2D, p: PosterData): void {
  const W = POSTER_W
  const H = POSTER_H

  // ---- 背景 ----
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1220')
  bg.addColorStop(0.55, '#0f2740')
  bg.addColorStop(1, '#0c4a6e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 一团柔和高光，避免大面积纯色显得平
  const glow = ctx.createRadialGradient(W * 0.85, 120, 20, W * 0.85, 120, 420)
  glow.addColorStop(0, 'rgba(56,189,248,0.26)')
  glow.addColorStop(1, 'rgba(56,189,248,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 560)

  ctx.textBaseline = 'top'

  // 页脚分割线的位置。它是整张海报的排版基准：以上是正文（可压缩），以下是
  // 二维码与法定脚注（尺寸固定，不让）。
  const FOOT_TOP = H - 300

  // ---- 顶部：站点标识 + AI 徽章（法定标识第一处） ----
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = font(26, 600)
  ctx.fillText('贝果科技 · AI圈大事记', PAD, 70)

  ctx.font = font(24, 700)
  const badgeW = ctx.measureText(AI_BADGE).width + 36
  roundRectPath(ctx, W - PAD - badgeW, 62, badgeW, 44, 22)
  ctx.fillStyle = 'rgba(56,189,248,0.18)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(56,189,248,0.55)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = '#7dd3fc'
  ctx.fillText(AI_BADGE, W - PAD - badgeW + 18, 72)

  // ---- 分类 · 日期 ----
  let y = 170
  ctx.font = font(24, 500)
  ctx.fillStyle = 'rgba(125,211,252,0.9)'
  const meta = [categoryLabel(p.category), p.happenedAt ? formatDate(p.happenedAt) : '']
    .filter(Boolean)
    .join('   ·   ')
  ctx.fillText(meta, PAD, y)
  y += 54

  // ---- 标题 ----
  // 最多 3 行：摘要提示词里 headline 已限 ≤40 字，46px 下 3 行放得下。
  // 早期版本给了 4 行、正文又是自由流的，长标题 + 长摘要会一路压到二维码上，
  // 整个下半张糊成一团。行数与下面的高度预算是配套的，不要单独调。
  ctx.fillStyle = '#ffffff'
  ctx.font = font(46, 700)
  y = drawLines(ctx, wrapLines(ctx, p.headline, CW, 3), PAD, y, 66) + 24

  // ---- 推荐理由 ----
  if (p.whyItMatters) {
    ctx.font = font(27, 500) // 先定字号再量宽，否则断行按的是上一段的字号
    const whyLines = wrapLines(ctx, p.whyItMatters, CW - 56, 2)
    const boxH = whyLines.length * 42 + 40
    roundRectPath(ctx, PAD, y, CW, boxH, 16)
    ctx.fillStyle = 'rgba(56,189,248,0.10)'
    ctx.fill()
    ctx.fillStyle = '#38bdf8'
    ctx.fillRect(PAD, y + 12, 6, boxH - 24)
    ctx.fillStyle = 'rgba(186,230,253,0.95)'
    drawLines(ctx, whyLines, PAD + 28, y + 20, 42)
    y += boxH + 26
  }

  /*
   * 下面这段是自下而上排的，不是顺着往下流。
   *
   * 海报是固定 750×1334 的画布，装不下的内容没有「往下顶」这个选项——
   * 顺着流的写法在标题长、摘要也长的时候，会把 AI 提示条、信源、二维码
   * 全叠在一起。而 AI 提示条是法定标识，被盖住就是合规问题，不只是难看。
   *
   * 所以先给「必须出现」的三块（提示条、信源、页脚）算出它们能被压到的最低位置，
   * 剩下多少高度才决定摘要放几行。摘要是唯一可以被截短的部分，也应该是。
   * （内容短时提示条会往上跟着正文走，见下面的 noticeTop。）
   */
  ctx.font = font(21, 400)
  const noticeLines = wrapLines(ctx, AI_NOTICE, CW, 2)
  const noticeH = noticeLines.length * 32

  const sources = (p.sources || []).slice(0, 6)
  ctx.font = font(23, 400)
  const sourceLines = sources.length ? wrapLines(ctx, sources.join('  ·  '), CW, 1) : []
  const sourcesH = sources.length ? 30 + sourceLines.length * 34 : 0

  // 提示条与信源能压到的最低位置：摘要就是按这个余量算行数的
  const pinnedSourcesTop = FOOT_TOP - 30 - sourcesH
  const pinnedNoticeTop = pinnedSourcesTop - (sources.length ? 20 : 0) - noticeH

  // ---- 摘要：能放几行放几行，放不下就截断（宁可少说，不能压住下面的标识） ----
  const LH = 46
  const maxSummaryLines = Math.max(0, Math.min(10, Math.floor((pinnedNoticeTop - 24 - y) / LH)))
  let summaryLines: string[] = []
  if (p.summary && maxSummaryLines > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = font(28, 400)
    summaryLines = wrapLines(ctx, p.summary, CW, maxSummaryLines)
    drawLines(ctx, summaryLines, PAD, y, LH)
  }

  // 内容短的时候提示条跟着正文走，别悬在半空——钉死的位置只是上限不是固定位。
  // （早期版本一律钉死，短摘要的海报中间会空出一大片，看着像渲染没画完。）
  const noticeTop = Math.min(y + summaryLines.length * LH + 26, pinnedNoticeTop)
  const sourcesTop = noticeTop + noticeH + 20

  // ---- 正文内的 AI 提示条（与详情页开头那条同文案，法定标识之一） ----
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = font(21, 400)
  drawLines(ctx, noticeLines, PAD, noticeTop, 32)

  // ---- 信源：只有媒体名，没有任何图标或图片 ----
  if (sources.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = font(21, 500)
    ctx.fillText('信源', PAD, sourcesTop)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = font(23, 400)
    drawLines(ctx, sourceLines, PAD, sourcesTop + 30, 34)
  }

  // ---- 底部：分割线 + 二维码 + 脚注 ----
  // 固定贴底，不跟随正文流——正文长短不一，浮动的话二维码位置会跳，
  // 用户在朋友圈里长按的落点就不稳定
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, FOOT_TOP)
  ctx.lineTo(W - PAD, FOOT_TOP)
  ctx.stroke()

  // 页脚这 300px 是排死的：二维码 1068–1238，左侧三行文字 1074–1186，
  // 脚注 1256–1316。改任何一个数字都要重新对一遍，别让脚注压到码上——
  // 二维码被文字盖住一角就扫不出来了。
  const qrSize = 170
  const qrX = W - PAD - qrSize
  const qrY = FOOT_TOP + 34
  const matrix = qrMatrix(p.url, 'M')
  if (matrix) {
    // 深色背景上直接放码会掉识别率，垫一块白底
    roundRectPath(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    drawQr(ctx, matrix, qrX, qrY, qrSize, { dark: '#0b1220', light: '#ffffff', quietZone: 2 })
  } else {
    // 走不到这里（URL 远短于版本 10 的容量），留个兜底免得底部开天窗
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = font(22, 400)
    ctx.fillText('访问 bigolab.com', qrX - 20, qrY + 76)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = font(30, 600)
  ctx.fillText('长按识别二维码', PAD, FOOT_TOP + 40)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = font(24, 400)
  ctx.fillText('查看全文与全部信源原文', PAD, FOOT_TOP + 84)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = font(22, 400)
  ctx.fillText(AUTHOR_NAME, PAD, FOOT_TOP + 126)

  // 底部脚注：海报上 AI 标识的第二处，整段不截断——截半句的法定告知等于没告知
  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  ctx.font = font(20, 400)
  drawLines(ctx, wrapLines(ctx, AI_DISCLAIMER, CW, 2), PAD, H - 78, 30)
}
