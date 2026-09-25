/**
 * 营销邮件：渲染器 / 富文本规范化 / 发送前检查 / 逐封个性化 / 内置模板 —— 自测（纯函数，不碰数据库）。
 *
 *   npx tsx scripts/check-marketing-render.ts
 *
 * 这些函数错了是「静默」的：邮件照样能发，只是退订链接被转义坏了、昵称注入了 HTML、
 * Outlook 里按钮塌成一行字、或者禁发词混进了商品名导致整场活动被阿里云拒发。
 * 设计文档 7.2（渲染硬规则）、7.4（检查规则）、5.9（个性化与转义）逐条在这里钉住。
 *
 * 注意：零宽/双向控制字符一律用 String.fromCharCode 构造，不在源码里直接写（编辑器与工具链会吞掉或改写它们）。
 */
import { emailDocSchema, blockSchema, richDocSchema, audienceSpecSchema, DEFAULT_CONFIG, type AudienceSpec, type Block, type EmailDoc, type ProductCard, type RenderCtx, type FooterConfig } from '../src/lib/marketing/types'
import {
  renderEmail,
  couponViewFor,
  blockSummary,
  THEMES,
  DEFAULT_SETTINGS,
  applyTheme,
  fmtMoney,
  contrastRatio,
  mixHex,
  FONT_SANS,
} from '../src/lib/marketing/render'
import { normalizeRichDoc, normalizeDoc, richToPlain, emptyRichDoc, normalizeColor, utf8Bytes, escapeHtml } from '../src/lib/marketing/richtext'
import {
  lintContent,
  lintRendered,
  findBannedWord,
  findAbsoluteTerm,
  findAbsoluteWarnTerm,
  safeNickname,
  hasErrors,
  checkImageUrl,
  checkLinkUrl,
  safeBodyEmail,
  visibleTextOf,
} from '../src/lib/marketing/lint'
import { personalizeHtml, personalizeText, personalizeSubject, FIRST_NOTICE_TEXT, type PersonalizeVars } from '../src/lib/marketing/personalize'
import { PRESETS, getPreset, newBlock, PLACEHOLDER_PRODUCT_ID, type Preset } from '../src/lib/marketing/presets'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  ok(name, g === w, `got=${g} want=${w}`)
}
const codes = (issues: { code: string }[]) => issues.map((i) => i.code)
const has = (issues: { code: string; level?: string }[], code: string, level?: string) => issues.some((i) => i.code === code && (!level || i.level === level))

const ch = (n: number) => String.fromCharCode(n)
const ZWSP = ch(0x200b)
const RLO = ch(0x202e)
const BOM = ch(0xfeff)
const LS = ch(0x2028)

/* ============================== 夹具 ============================== */

const ORIGIN = 'https://bigolab.com'
const FOOTER: FooterConfig = {
  companyName: DEFAULT_CONFIG.companyName,
  brandName: '贝果科技',
  contactEmail: 'service@bigolab.com',
  footerNote: '',
  subjectPrefix: '(AD)',
}
const P = (id: number, over: Partial<ProductCard> = {}): ProductCard => ({
  id,
  name: `Claude Pro 月卡 ${id}`,
  price: '139.00',
  originalPrice: '159.00',
  image: null,
  features: ['Claude Pro 会员 1 个月', '付款后卡密即时发到邮箱'],
  url: `${ORIGIN}/products/${id}`,
  status: 1,
  ...over,
})
const PRODUCTS: Record<number, ProductCard> = {
  4: P(4),
  5: P(5, { name: 'ChatGPT Plus 月卡', price: '149.90', originalPrice: null, image: `${ORIGIN}/uploads/p/5.png` }),
  6: P(6, { name: 'Grok 会员', image: `${ORIGIN}/uploads/p/6.webp` }),
  7: P(7, { status: 0 }),
  8: P(8, { image: '/uploads/p/8.jpg' }),
}

const rich = (...paras: string[]) => ({ type: 'doc' as const, content: paras.map((t) => ({ type: 'paragraph' as const, content: t ? [{ type: 'text' as const, text: t }] : undefined })) })

function kitchenSink(): EmailDoc {
  return {
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    blocks: [
      { id: 'hdr', type: 'header', logo: true, title: '贝果科技', bg: '#7c3aed', bg2: '#db2777', color: '#ffffff', align: 'left' },
      {
        id: 'hero',
        type: 'hero',
        title: '国庆特惠',
        subtitle: '副标题文字',
        bg: '#f6f1fe',
        color: '#1f2937',
        align: 'center',
        image: '/uploads/hero.png',
        imageAlt: '头图',
        button: { label: '查看新品', href: '/products', bg: '#7c3aed', color: '#ffffff' },
      },
      { id: 'h2', type: 'heading', content: rich('小标题'), level: 2, align: 'left' },
      {
        id: 'txt',
        type: 'text',
        size: 16,
        align: 'left',
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '{{nickname|朋友}}，你好：' }] },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '请看' },
                { type: 'text', text: '服务条款', marks: [{ type: 'bold' }, { type: 'link', attrs: { href: '/terms' } }] },
                { type: 'text', text: '，或写信到' },
                { type: 'text', text: '客服邮箱', marks: [{ type: 'link', attrs: { href: 'mailto:help@bigolab.com' } }] },
                { type: 'hardBreak' },
                { type: 'text', text: '红色文字', marks: [{ type: 'textStyle', attrs: { color: '#dc2626' } }] },
              ],
            },
            { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表一' }] }] }] },
            { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '步骤一' }] }] }] },
          ],
        },
      },
      { id: 'img', type: 'image', src: 'https://cdn.example.org/a.jpg', alt: '活动图', width: 60, align: 'center', href: 'https://example.org/landing' },
      { id: 'btn', type: 'button', label: '立即查看', href: '/products?x=1&y=2', bg: '#7c3aed', color: '#ffffff', radius: 10, align: 'center', fullWidth: false, size: 'md' },
      { id: 'prod', type: 'product', productId: 4, layout: 'card', ctaLabel: '立即购买', showOriginalPrice: true, showFeatures: true },
      { id: 'prodRow', type: 'product', productId: 8, layout: 'row', ctaLabel: '去看看', showOriginalPrice: false, showFeatures: true },
      { id: 'grid', type: 'productGrid', productIds: [4, 5, 6], ctaLabel: '立即购买', showFeatures: true },
      {
        id: 'cp',
        type: 'coupon',
        mode: 'grant',
        title: '邮件专享券',
        note: '每个账户一张',
        ctaLabel: '去使用',
        bg: '#7c3aed',
        color: '#ffffff',
        grant: { kind: 'THRESHOLD', discount: 30, minAmount: 199, productIds: [], validity: { mode: 'days', days: 7 } },
      },
      { id: 'co', type: 'callout', tone: 'warning', content: rich('注意事项') },
      { id: 'div', type: 'divider', color: '#e5e7eb', thickness: 1, widthPct: 60 },
      { id: 'sp', type: 'spacer', height: 24 },
    ],
  }
}

function ctxFor(mode: RenderCtx['mode'], doc: EmailDoc, extra: Partial<RenderCtx> = {}): RenderCtx & { registered: { url: string; label: string }[] } {
  const registered: { url: string; label: string }[] = []
  const cb = doc.blocks.find((b) => b.type === 'coupon') as Extract<Block, { type: 'coupon' }> | undefined
  return {
    mode,
    subject: '{{nickname|朋友}}，国庆特惠',
    preheader: '付款后即时发卡',
    origin: ORIGIN,
    footer: FOOTER,
    products: PRODUCTS,
    coupon: cb ? couponViewFor(cb, ORIGIN, { productNames: [] }) : null,
    linkWrap:
      mode === 'send'
        ? (url: string, label: string) => {
            registered.push({ url, label })
            return `{{mkt_link:${registered.length}}}`
          }
        : undefined,
    registered,
    ...extra,
  }
}

const VARS: PersonalizeVars = {
  nickname: '小明',
  email: 'a@b.com',
  couponExpires: '2026年10月7日',
  linkBase: `${ORIGIN}/api/mkt/c/0123456789abcdef0123456789abcdef/`,
  unsubscribeUrl: `${ORIGIN}/unsubscribe/0123456789abcdef0123456789abcdef`,
  prefsUrl: `${ORIGIN}/unsubscribe/0123456789abcdef0123456789abcdef?v=prefs`,
  openPixelUrl: `${ORIGIN}/api/mkt/o/0123456789abcdef0123456789abcdef`,
  notice: FIRST_NOTICE_TEXT,
}

/** 标签 + style 解析（够用即可：我们自己生成的 HTML，属性一律双引号） */
function tags(html: string, name?: string): { tag: string; attrs: string; style: string }[] {
  const out: { tag: string; attrs: string; style: string }[] = []
  const re = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase()
    if (name && tag !== name) continue
    const style = /\sstyle="([^"]*)"/.exec(m[2])?.[1] || ''
    out.push({ tag, attrs: m[2], style })
  }
  return out
}
const hasFont = (style: string) => /font-family:/.test(style) && /font-size:\d+px/.test(style) && /line-height:\d+px/.test(style) && /(^|;)color:#[0-9a-f]{6}/.test(style)
/** 去掉 preview 专用标记，得到「发出去的样子」 */
function stripPreview(html: string): string {
  return html
    .replace(/\sdata-bid="[^"]*"/g, '')
    .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
    .replace(/<style>\[data-bid\][\s\S]*?<\/style>/, '')
    .replace(/outline:2px solid #0ea5e9;outline-offset:-2px;/g, '')
}

/* ============================== 渲染：骨架 ============================== */

console.log('\n[渲染] 骨架（7.2）')
{
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  const h = r.html
  ok('DOCTYPE 开头', h.startsWith('<!DOCTYPE html>'))
  ok('lang="zh-CN"', h.includes('<html lang="zh-CN"'))
  ok('VML / Office 命名空间', h.includes('xmlns:v="urn:schemas-microsoft-com:vml"') && h.includes('xmlns:o="urn:schemas-microsoft-com:office:office"'))
  ok('charset utf-8', h.includes('<meta charset="utf-8">'))
  ok('viewport', h.includes('<meta name="viewport" content="width=device-width,initial-scale=1">'))
  ok('x-apple-disable-message-reformatting', h.includes('<meta name="x-apple-disable-message-reformatting">'))
  ok('format-detection', /<meta name="format-detection" content="telephone=no[^"]*">/.test(h))
  ok('mso OfficeDocumentSettings（AllowPNG / 96dpi）', /<!--\[if mso\]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG\/><o:PixelsPerInch>96<\/o:PixelsPerInch>/.test(h))
  ok('mso 条件注释强制微软雅黑', /<!--\[if mso\]><style>[^<]*font-family:'Microsoft YaHei'/.test(h))
  ok('auto → color-scheme light dark', h.includes('<meta name="color-scheme" content="light dark">'))
  ok('auto → 暗色媒体查询 + data-ogsc', h.includes('@media (prefers-color-scheme:dark)') && h.includes('[data-ogsc] .mk-tx'))
  const lo = renderEmail({ ...doc, settings: { ...doc.settings, darkMode: 'light-only' } }, ctxFor('send', doc))
  ok('light-only → color-scheme light only', lo.html.includes('<meta name="color-scheme" content="light only">'))
  ok('light-only → 不输出暗色规则', !lo.html.includes('prefers-color-scheme') && !lo.html.includes('data-ogsc'))
  ok('有 <body>', /<body[^>]*>/.test(h) && h.endsWith('</body></html>'))
  ok('不出现 undefined / NaN / [object Object]', !/undefined|NaN|\[object Object\]/.test(h) && !/undefined|NaN|\[object Object\]/.test(r.text))
  const styleBytes = (h.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).reduce((n, s) => n + s.length, 0)
  ok('<style> 总量 ≤ 16KB', styleBytes <= 16 * 1024, `${styleBytes}`)
}

console.log('\n[渲染] 布局与内联样式')
{
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  const h = r.html
  const tables = tags(h, 'table')
  ok('所有 <table> 都是 role=presentation + cellpadding/cellspacing/border=0', tables.length > 20 && tables.every((t) => /role="presentation" cellpadding="0" cellspacing="0" border="0"/.test(t.attrs)), `${tables.length} 个`)
  ok('600px 容器：max-width div', h.includes('<div style="max-width:600px;margin:0 auto;">'))
  ok('600px 容器：mso 幽灵表', /<!--\[if mso\]><table role="presentation"[^>]*width="600"><tr><td><!\[endif\]-->/.test(h))
  ok('两列商品：inline-block 列', /class="mk-col" style="display:inline-block;width:100%;max-width:270px;vertical-align:top;"/.test(h))
  ok('两列商品：mso 幽灵 <td width=270>', h.includes('<!--[if mso]><td width="270" valign="top"><![endif]-->'))
  ok('两列商品：第三个换行（mso </tr><tr>）', h.includes('<!--[if mso]></tr><tr><![endif]-->'))
  ok('不出现 flex / grid / position', !/display\s*:\s*(inline-)?(flex|grid)|grid-template|(^|[;"\s])position\s*:/i.test(h))
  const ps = [...tags(h, 'p'), ...tags(h, 'h1'), ...tags(h, 'h2'), ...tags(h, 'h3')]
  ok('<p>/<h*> 全部 margin:0', ps.length > 10 && ps.every((t) => t.style.startsWith('margin:0;')))
  ok('<p>/<h*> 全部内联 font-family/size/line-height/color', ps.every((t) => hasFont(t.style)), ps.filter((t) => !hasFont(t.style)).map((t) => t.style).slice(0, 2).join(' | '))
  const textTds: string[] = []
  const tdRe = /<td\b([^>]*)>([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = tdRe.exec(h))) if (m[2].trim() && m[2].trim() !== '&nbsp;') textTds.push(m[1])
  ok('直接带字的 <td> 也内联 font 四件套', textTds.length > 0 && textTds.every((a) => hasFont(/style="([^"]*)"/.exec(a)?.[1] || '')), `${textTds.length} 个`)
  const badPad = tags(h).filter((t) => {
    if (t.tag === 'td' || t.tag === 'a') return false
    return t.style.split(';').some((d) => {
      const [k, v] = d.split(':').map((s) => (s || '').trim())
      return /^padding/.test(k) && !/^0(px)?(\s+0(px)?)*$/.test(v)
    })
  })
  ok('padding 只出现在 <td>（与防弹按钮 <a>）', badPad.length === 0, badPad.map((t) => t.tag).join(','))
  ok('字体栈与设计文档一致', h.includes(`font-family:${FONT_SANS};`) && FONT_SANS === "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','微软雅黑','Helvetica Neue',Arial,sans-serif")
  const bodyP = tags(h, 'p').filter((t) => t.style.includes('font-size:16px;line-height:28px'))
  ok('正文 16px / 行高 28px（1.75）', bodyP.length >= 2)
  const tbHtml = renderEmail({ ...doc, blocks: [doc.blocks[3]] }, ctxFor('send', doc)).html
  const textBlockPs = tags(tbHtml.slice(0, tbHtml.indexOf('{{mkt_notice}}')), 'p').filter((t) => t.attrs.includes('mk-tx')).slice(0, -1) // 去掉页脚首封告知那一段
  ok('正文区块所有段落 ≥15px 且行高 ≥1.7', textBlockPs.length > 0 && textBlockPs.every((t) => {
    const fs = Number(/font-size:(\d+)px/.exec(t.style)?.[1])
    const lh = Number(/line-height:(\d+)px/.exec(t.style)?.[1])
    return fs >= 15 && lh / fs >= 1.7
  }))
  const bgs = tags(h).filter((t) => ['td', 'table', 'body'].includes(t.tag) && /background-color:#/.test(t.style))
  ok('有底色的 td/table/body 都同时写 bgcolor', bgs.length > 5 && bgs.every((t) => {
    const c = /background-color:(#[0-9a-f]{6})/.exec(t.style)?.[1]
    return c && t.attrs.includes(`bgcolor="${c}"`)
  }), bgs.filter((t) => !/bgcolor=/.test(t.attrs)).map((t) => t.tag + ':' + t.style.slice(0, 60)).slice(0, 2).join(' | '))
  const grads = tags(h).filter((t) => t.style.includes('linear-gradient'))
  ok('渐变只叠在纯色上（同元素有 background-color + bgcolor）', grads.length >= 2 && grads.every((t) => /background-color:#/.test(t.style) && /bgcolor="#/.test(t.attrs)))
  const anchors = tags(h, 'a')
  ok('每个 <a> 内联颜色与下划线设置', anchors.length > 5 && anchors.every((t) => /(^|;)color:#/.test(t.style) && /text-decoration:/.test(t.style)))
  const buttons = anchors.filter((t) => t.style.includes('mso-padding-alt:0'))
  ok('防弹按钮：<a> 内联底色 + padding + mso-padding-alt', buttons.length >= 5 && buttons.every((t) => /padding:\d+px \d+px/.test(t.style) && /background-color:#/.test(t.style)))
  ok('防弹按钮：高 ≥ 44px（2×上下内边距 + 行高）', buttons.every((t) => {
    const py = Number(/padding:(\d+)px/.exec(t.style)?.[1])
    const lh = Number(/line-height:(\d+)px/.exec(t.style)?.[1])
    return py * 2 + lh >= 44
  }))
  ok('防弹按钮：mso 字宽技巧', h.includes('mso-font-width:-100%') && /mso-text-raise:\d+pt/.test(h))
  ok('logo：<origin>/logo-mark.png，40px，放在有底色的芯片里', /<td width="52" height="52" align="center" valign="middle" bgcolor="#ffffff"[^>]*><a [^>]*><img src="https:\/\/bigolab\.com\/logo-mark\.png" width="40" height="40"/.test(h))
  ok('callout warning 色调', h.includes('bgcolor="#fffbeb"') && h.includes('border-left:4px solid #d97706'))
  ok('分割线 60% 居中', h.includes('width="60%" align="center"'))
  ok('留白块定高', h.includes('<td height="24"'))
}

console.log('\n[渲染] 图片（7.2）')
{
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  const imgs = tags(r.html, 'img').filter((t) => !t.attrs.includes('{{mkt_open}}'))
  ok('所有图片都是绝对 https', imgs.length >= 4 && imgs.every((t) => /src="https:\/\//.test(t.attrs)))
  ok('所有图片都是 jpg/png/gif', imgs.every((t) => /src="[^"]+\.(jpe?g|png|gif)"/.test(t.attrs)))
  ok('所有图片都有 width 属性 + 流式 style', imgs.every((t) => /width="\d+"/.test(t.attrs) && /width:100%;max-width:\d+px/.test(t.style)))
  ok('所有图片都有 alt', imgs.every((t) => /\salt="/.test(t.attrs)))
  ok('相对路径商品图补成绝对', r.html.includes('src="https://bigolab.com/uploads/p/8.jpg"'))
  ok('头图相对路径补成绝对', r.html.includes('src="https://bigolab.com/uploads/hero.png"'))
  ok('webp 商品图不输出，改品牌色占位', !r.html.includes('.webp') && r.html.includes('>Grok</p>'))
  ok('无图商品用品牌渐变占位', /linear-gradient\(135deg,#7c3aed 0%,#db2777 100%\)/.test(r.html))
  eq('imageCount（logo + 头图 + 图片块 + 两张可用商品图；占位与像素不算）', r.imageCount, 5)
  const bad = (src: string) => {
    const d: EmailDoc = { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: [{ id: 'i', type: 'image', src, alt: 'x', width: 100, align: 'center' }] }
    return renderEmail(d, ctxFor('send', d))
  }
  ok('图片块 webp 发送时不输出', !bad('https://x.org/a.webp').html.includes('a.webp'))
  ok('图片块 svg 发送时不输出', !bad('https://x.org/a.svg').html.includes('a.svg'))
  ok('图片块 http:// 发送时不输出', !bad('http://x.org/a.png').html.includes('x.org/a.png'))
  ok('图片块含变量发送时不输出', !bad('https://x.org/{{email}}.png').html.includes('x.org/'))
  const pv = renderEmail(bad('https://x.org/a.webp') && { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: [{ id: 'i', type: 'image', src: 'https://x.org/a.webp', alt: 'x', width: 100, align: 'center' }] }, ctxFor('preview', kitchenSink()))
  ok('图片块 webp 在预览里显示提示占位', pv.html.includes('图片地址不可用'))
  const off = renderEmail(kitchenSink(), ctxFor('preview', kitchenSink(), { imagesOff: true }))
  ok('无图模式：img 换成说明文字块', !tags(off.html, 'img').length && off.html.includes('[图片] 活动图'))
  const on = renderEmail(kitchenSink(), ctxFor('preview', kitchenSink()))
  ok('无图模式：体积按真图计（与有图模式一致）', off.sizeBytes === on.sizeBytes, `${off.sizeBytes} vs ${on.sizeBytes}`)
}

console.log('\n[渲染] 链接白名单与转义（7.2）')
{
  const evil = {
    v: 1,
    settings: { ...DEFAULT_SETTINGS, brand: 'red;background:url(//x)' },
    blocks: [
      { id: 'h', type: 'header', logo: false, title: '<script>alert(1)</script>', bg: '#000000;x:url(1)', color: '#ffffff', align: 'left' },
      { id: 'b1', type: 'button', label: 'A"B<i>', href: 'javascript:alert(1)', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' },
      { id: 'b2', type: 'button', label: 'proto', href: '//evil.com/x', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' },
      { id: 'b3', type: 'button', label: 'data', href: 'data:text/html,<b>', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' },
      { id: 'b4', type: 'button', label: 'quote', href: 'https://x.org/a"onmouseover="alert(1)', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' },
      { id: 'im', type: 'image', src: 'https://x.org/a.png', alt: '" onerror="alert(1)', width: 100, align: 'center' },
      {
        id: 't',
        type: 'text',
        size: 16,
        align: 'left',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '<img src=x onerror=alert(1)> & "quote"' },
                { type: 'text', text: 'js', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)', onclick: 'steal()', target: '_self' } }] },
                { type: 'text', text: 'rel', marks: [{ type: 'link', attrs: { href: '/coupons' } }] },
              ],
            },
          ],
        },
      },
    ],
  } as unknown as EmailDoc
  const pv = renderEmail(evil, ctxFor('preview', evil))
  const h = pv.html
  ok('标题里的 <script> 被转义', !h.includes('<script>') && h.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  ok('正文里的 <img onerror> 被转义', !h.includes('<img src=x') && h.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quote&quot;'))
  ok('按钮文字引号/尖括号被转义', h.includes('A&quot;B&lt;i&gt;'))
  ok('alt 里的引号被转义，不能拆出新属性', !/\sonerror="/.test(h) && h.includes('alt="&quot; onerror=&quot;alert(1)"'))
  ok('javascript: 链接被丢弃', !/javascript:/i.test(h))
  ok('协议相对 //evil.com 被丢弃', !h.includes('//evil.com'))
  ok('data: 链接被丢弃', !/href="data:/i.test(h))
  ok('含引号的地址整条拒绝（不拆属性）', !h.includes('onmouseover'))
  ok('不展开链接的其他 attrs（onclick/target=_self）', !h.includes('onclick') && !h.includes('_self'))
  ok('站内相对链接补成绝对', h.includes('href="https://bigolab.com/coupons"'))
  ok('非法颜色不进 style（CSS 注入）', !h.includes('url(//x)') && !h.includes('url(1)') && !h.includes('red;'))
  ok('非法颜色回落默认品牌色', h.includes('#7c3aed'))
  const s = renderEmail(evil, ctxFor('send', evil))
  ok('send 模式同样不输出 javascript:', !/javascript:/i.test(s.html) && !/javascript:/i.test(s.text))
}

console.log('\n[渲染] send 模式：占位与链接登记（5.9）')
{
  const doc = kitchenSink()
  const ctx = ctxFor('send', doc)
  const r = renderEmail(doc, ctx)
  const hrefs = tags(r.html, 'a').map((t) => /href="([^"]*)"/.exec(t.attrs)?.[1] || '')
  ok('每个 href 都是 {{mkt_link:N}} / {{mkt_unsub}} / {{mkt_prefs}} / mailto:', hrefs.length > 5 && hrefs.every((u) => /^\{\{mkt_link:\d+\}\}$|^\{\{mkt_unsub\}\}$|^\{\{mkt_prefs\}\}$|^mailto:/.test(u)), hrefs.filter((u) => !/^\{\{mkt_|^mailto:/.test(u)).join(','))
  ok('不出现任何未经登记的 http 链接 href', !/href="https?:/.test(r.html))
  ok('linkWrap 收到的都是绝对地址', ctx.registered.length > 0 && ctx.registered.every((l) => /^https?:\/\//.test(l.url)))
  ok('相对路径 /products?x=1&y=2 以原样绝对地址登记', ctx.registered.some((l) => l.url === 'https://bigolab.com/products?x=1&y=2'))
  ok('mailto 不经 linkWrap', !ctx.registered.some((l) => l.url.startsWith('mailto:')) && r.html.includes('href="mailto:help@bigolab.com"'))
  ok('同一链接连续文字只登记一次（粗体+链接合并为一个 <a>）', ctx.registered.filter((l) => l.url === 'https://bigolab.com/terms').length === 1)
  eq('links 与 linkWrap 登记一一对应', r.links.map((l) => l.idx), ctx.registered.map((_l, i) => i + 1))
  ok('links 带 label（按钮文字）', r.links.some((l) => l.label === '立即查看'))
  ok('商品链接 label 带商品名', r.links.some((l) => l.label.startsWith('商品：')))
  ok('退订链接 {{mkt_unsub}}', r.html.includes('href="{{mkt_unsub}}"'))
  ok('偏好链接 {{mkt_prefs}}', r.html.includes('href="{{mkt_prefs}}"'))
  ok('{{mkt_notice}} 占位', r.html.includes('>{{mkt_notice}}</p>'))
  ok('打开像素在 </body> 前', r.html.endsWith('<img src="{{mkt_open}}" width="1" height="1" alt="" border="0" style="display:block;width:1px;height:1px;border:0;margin:0;"></body></html>'))
  ok('昵称变量原样保留（逐封替换）', r.html.includes('{{nickname|朋友}}，你好：') && r.text.includes('{{nickname|朋友}}，你好：'))
  ok('直发券有效期用 {{coupon_expires}} 占位', r.html.includes('券已放入你的账户，{{coupon_expires}}前有效'))
  ok('send 模式不带任何 preview 标记', !r.html.includes('data-bid') && !r.html.includes('Content-Security-Policy') && !r.html.includes('outline:2px'))
  ok('send 模式忽略 selectedBlockId / imagesOff', !renderEmail(doc, { ...ctxFor('send', doc), selectedBlockId: 'txt', imagesOff: true }).html.includes('outline:2px'))
  ok('send 模式忽略样例变量（不代入）', renderEmail(doc, { ...ctxFor('send', doc), vars: { nickname: '样例' } }).html.includes('{{nickname|朋友}}'))
  const userSys: EmailDoc = { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: [{ id: 't', type: 'text', size: 16, align: 'left', content: rich('X{{mkt_open}}Y{{mkt_link:3}}Z') }] }
  const us = renderEmail(userSys, ctxFor('send', userSys))
  ok('作者手写的 {{mkt_*}} 被抹掉（不会被展开成像素/跟踪链接）', us.html.includes('>XYZ</p>'))
  let threw = false
  try {
    renderEmail(doc, { ...ctxFor('send', doc), origin: 'not-a-url' })
  } catch {
    threw = true
  }
  ok('send 模式 origin 不合法直接抛错', threw)
}

console.log('\n[渲染] test / preview 模式（5.9 测试发送）')
{
  const doc = kitchenSink()
  const t = renderEmail(doc, ctxFor('test', doc, { vars: { nickname: '小明', email: 'x@y.com', coupon_expires: '2026年10月2日' } }))
  ok('test：退订链接 → /unsubscribe/test', t.html.includes('href="https://bigolab.com/unsubscribe/test"'))
  ok('test：偏好链接 → /unsubscribe/test?v=prefs', t.html.includes('href="https://bigolab.com/unsubscribe/test?v=prefs"'))
  ok('test：没有任何 {{mkt_*}} 占位', !t.html.includes('{{mkt_') && !t.text.includes('{{mkt_'))
  ok('test：无打开像素', !t.html.includes('mkt_open') && !t.html.includes('width="1" height="1"'))
  ok('test：直发券标注「（测试邮件，未实际发券）」', t.html.includes('（测试邮件，未实际发券）') && t.text.includes('（测试邮件，未实际发券）'))
  ok('test：券到期日代入', t.html.includes('券已放入你的账户，2026年10月2日前有效'))
  ok('test：昵称代入', t.html.includes('小明，你好：') && t.html.includes('<title>小明，国庆特惠</title>'))
  ok('test：首封告知显示示例文字', t.html.includes(escapeHtml(FIRST_NOTICE_TEXT)))
  eq('test：不登记链接', t.links, [])
  ok('test：链接直达原地址', t.html.includes('href="https://bigolab.com/products?x=1&amp;y=2"'))
  const tw = renderEmail(doc, ctxFor('test', doc, { linkWrap: (u) => u + (u.includes('?') ? '&' : '?') + 'utm_source=bigolab' }))
  ok('test：调用方给了 linkWrap（加 UTM）就用它的结果', tw.html.includes('href="https://bigolab.com/products?x=1&amp;y=2&amp;utm_source=bigolab"'))

  const p = renderEmail(doc, ctxFor('preview', doc))
  ok('preview：没有昵称 → 用占位默认值', p.html.includes('朋友，你好：'))
  ok('preview：退订链接 → /unsubscribe/test', p.html.includes('href="https://bigolab.com/unsubscribe/test"'))
  ok('preview：CSP meta', p.html.includes(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'">`))
  ok('preview：每块都有 data-bid', doc.blocks.every((b) => p.html.includes(`data-bid="${b.id}"`)))
  ok('preview：无打开像素', !p.html.includes('mkt_open'))
  ok('preview：直发券不标注测试字样', !p.html.includes('未实际发券'))
  const sel = renderEmail(doc, ctxFor('preview', doc, { selectedBlockId: 'btn' }))
  ok('preview：选中块描边', /<tr data-bid="btn"><td[^>]*outline:2px solid #0ea5e9;outline-offset:-2px;/.test(sel.html))
  ok('preview：描边只加在选中块上', (sel.html.match(/outline:2px solid/g) || []).length === 1)
  eq('preview：sizeBytes 不含 preview 标记', sel.sizeBytes, utf8Bytes(stripPreview(sel.html)))
  ok('preview：体积与选不选中无关', sel.sizeBytes === p.sizeBytes)

  // 所见即所发：同一份文档，预览去掉标记后应与测试邮件逐字节一致（直发券的「测试」字样除外，所以用没有券的文档）
  const noCoupon: EmailDoc = { ...doc, blocks: doc.blocks.filter((b) => b.type !== 'coupon') }
  const pv2 = renderEmail(noCoupon, ctxFor('preview', noCoupon, { vars: { nickname: '小明' } }))
  const ts2 = renderEmail(noCoupon, ctxFor('test', noCoupon, { vars: { nickname: '小明' } }))
  ok('所见即所发：预览去掉标记 ≡ 测试邮件', stripPreview(pv2.html) === ts2.html)
  eq('所见即所发：两者纯文本一致', pv2.text, ts2.text)
  const devPv = renderEmail(doc, ctxFor('preview', doc, { origin: 'http://localhost:3000' }))
  ok('preview：本地 http 源时 CSP 放行该源的图片', devPv.html.includes("img-src https: data: http://localhost:3000;"))
}

console.log('\n[渲染] 页脚（D3 / 7.1）')
{
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  ok('页脚：退订营销邮件', /<a href="\{\{mkt_unsub\}\}"[^>]*>退订营销邮件<\/a>/.test(r.html))
  ok('页脚：调整订阅', /<a href="\{\{mkt_prefs\}\}"[^>]*>调整订阅<\/a>/.test(r.html))
  ok('页脚：经营主体全称', r.html.includes(DEFAULT_CONFIG.companyName))
  ok('页脚：联系邮箱 mailto', r.html.includes('联系邮箱：<a href="mailto:service@bigolab.com"'))
  ok('页脚：原因文字', r.html.includes('你收到这封邮件，是因为你用本邮箱注册了贝果科技（bigolab.com）账户。'))
  ok('页脚：交易邮件不受影响', r.html.includes('订单、验证码、发票等交易邮件不受影响。'))
  ok('页脚：{{mkt_notice}} 在退订链接之前', r.html.indexOf('{{mkt_notice}}') < r.html.indexOf('{{mkt_unsub}}'))
  const noContact = renderEmail(doc, { ...ctxFor('send', doc), footer: { ...FOOTER, contactEmail: '' } })
  ok('联系邮箱为空 → 在线客服 bigolab.com/support（经 linkWrap）', /在线客服：<a href="\{\{mkt_link:\d+\}\}"[^>]*>bigolab\.com\/support<\/a>/.test(noContact.html))
  const noted = renderEmail(doc, { ...ctxFor('send', doc), footer: { ...FOOTER, footerNote: '<b>备注</b>{{email}}' } })
  ok('footerNote 被转义且不参与模板', noted.html.includes('&lt;b&gt;备注&lt;/b&gt;email') && !noted.html.includes('{{email}}'))
  ok('纯文本页脚：退订/偏好/主体/联系/交易邮件', ['退订营销邮件：{{mkt_unsub}}', '调整订阅：{{mkt_prefs}}', DEFAULT_CONFIG.companyName, '联系邮箱：service@bigolab.com', '交易邮件不受影响', '{{mkt_notice}}'].every((s) => r.text.includes(s)))
  const muted = /<p class="mk-mu" style="margin:0;[^"]*color:(#[0-9a-f]{6});/.exec(r.html)?.[1] || ''
  ok('页脚小字在外底色上对比度 ≥ 4.5（自动加深）', contrastRatio(muted, DEFAULT_SETTINGS.backdrop) >= 4.5, muted)
}

console.log('\n[渲染] 预览文字 / 纯文本版（7.2）')
{
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  ok('预览文字紧跟 <body>', /<body[^>]*><div style="display:none;[^"]*mso-hide:all;[^"]*">付款后即时发卡/.test(r.html))
  ok('预览文字后有填充字符', r.html.includes('付款后即时发卡&#847;&zwnj;&nbsp;'))
  const noPre = renderEmail(doc, { ...ctxFor('send', doc), preheader: '' })
  ok('没填预览文字 → 不输出隐藏块', !/<body[^>]*><div style="display:none/.test(noPre.html))
  const esc = renderEmail(doc, { ...ctxFor('send', doc), preheader: '<b>&' })
  ok('预览文字被转义', esc.html.includes('>&lt;b&gt;&amp;&#847;'))
  const t = r.text
  ok('纯文本：没有 HTML 标签', !/<[a-z/][^>]*>/i.test(t))
  ok('纯文本：页眉/头图/标题/段落', ['贝果科技', '国庆特惠', '副标题文字', '小标题', '{{nickname|朋友}}，你好：'].every((s) => t.includes(s)))
  ok('纯文本：按钮「文字：URL」', /立即查看：\{\{mkt_link:\d+\}\}/.test(t))
  ok('纯文本：行内链接「文字（URL）」', /服务条款（\{\{mkt_link:\d+\}\}）/.test(t))
  ok('纯文本：列表符号', t.includes('• 列表一') && t.includes('1. 步骤一'))
  ok('纯文本：商品名、价格、价格不含税、原价', t.includes('Claude Pro 月卡 4') && t.includes('¥139（价格不含税） 原价 ¥159'))
  ok('纯文本：券说明', t.includes('【邮件专享券】¥30 · 满199可用') && t.includes('券已放入你的账户，{{coupon_expires}}前有效'))
  ok('纯文本：没有三个以上连续空行', !/\n{3,}/.test(t))
}

console.log('\n[渲染] 商品卡片 / 券票（7.3 / 第 9 节）')
{
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  ok('价格 ¥139 + 价格不含税小字', /<span style="font-size:\d+px;">¥<\/span>139<\/span>/.test(r.html) && r.html.includes('>价格不含税</span>'))
  ok('showOriginalPrice → 划线原价', r.html.includes('text-decoration:line-through;">¥159</span>'))
  ok('卖点 ✓ 列表', r.html.includes('>✓</td>') && r.html.includes('付款后卡密即时发到邮箱'))
  ok('小数价格保留两位', r.html.includes('149.90'))
  ok('下架商品（status≠1）发送时不输出', !renderEmail({ ...doc, blocks: [{ id: 'p', type: 'product', productId: 7, layout: 'card', ctaLabel: '买', showOriginalPrice: false, showFeatures: false }] }, ctxFor('send', doc)).html.includes('月卡 7'))
  const miss = renderEmail({ ...doc, blocks: [{ id: 'p', type: 'product', productId: 999, layout: 'card', ctaLabel: '买', showOriginalPrice: false, showFeatures: false }] }, ctxFor('preview', doc))
  ok('不存在的商品在预览里提示重新选择', miss.html.includes('商品 #999 未找到或已下架'))
  ok('券票：¥30 大字 + 满199可用', r.html.includes('<span style="font-size:26px;letter-spacing:0;">¥</span>30</p>') && r.html.includes('>满199可用</p>'))
  ok('券票：齿孔虚线 + 两侧缺口', r.html.includes('border-bottom:2px dashed') && r.html.includes('border-radius:0 14px 14px 0') && r.html.includes('border-radius:14px 0 0 14px'))
  const cv = (grant: object, mode: 'grant' | 'claim' = 'grant', claim: object | null = null) =>
    couponViewFor({ id: 'c', type: 'coupon', mode, title: 't', ctaLabel: 'x', bg: '#7c3aed', color: '#ffffff', grant: grant as never, claimCode: 'spring' }, ORIGIN, { claim: claim as never, productNames: ['Claude Pro'] })
  const g1 = cv({ kind: 'THRESHOLD', discount: 30, minAmount: 199, productIds: [], validity: { mode: 'days', days: 7 } })
  eq('couponViewFor grant days', g1 && { d: g1.discount, m: g1.minAmount, v: g1.validityText, u: g1.url }, { d: '30.00', m: '199.00', v: '到账后 7 天内有效', u: 'https://bigolab.com/coupons' })
  const g2 = cv({ kind: 'PRODUCT', discount: 10, minAmount: 0, productIds: [4], validity: { mode: 'until', date: '2026-10-07' } })
  eq('couponViewFor grant until', g2 && [g2.kind, g2.validityText], ['PRODUCT', '2026年10月7日前有效'])
  eq('couponViewFor claim 找不到 → null', cv({}, 'claim', null), null)
  const c1 = cv({}, 'claim', { code: 'spring100', kind: 'THRESHOLD', discount: '20', minAmount: '0', endAt: '2026-10-07T15:59:59.000Z' })
  eq('couponViewFor claim', c1 && [c1.url, c1.validityText, c1.discount], ['https://bigolab.com/coupon/spring100', '2026年10月7日前有效', '20.00'])
  const c2 = cv({}, 'claim', { code: 'x', kind: 'THRESHOLD', discount: '5', minAmount: '0', endAt: null })
  eq('couponViewFor claim 无截止 → 长期有效', c2?.validityText, '长期有效')
  const renderCoupon = (view: ReturnType<typeof cv>, mode: 'send' | 'preview' = 'send', blockMode: 'grant' | 'claim' = view?.mode || 'claim') => {
    const d: EmailDoc = { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: [{ id: 'c', type: 'coupon', mode: blockMode, title: '券', ctaLabel: '领', bg: '#7c3aed', color: '#ffffff', claimCode: 'spring100' }] }
    return renderEmail(d, { ...ctxFor(mode, d), coupon: view })
  }
  ok('无门槛券显示「无门槛」', renderCoupon(cv({ kind: 'THRESHOLD', discount: 5, minAmount: 0, productIds: [], validity: { mode: 'days', days: 3 } })).html.includes('>无门槛</p>'))
  ok('商品券显示「指定商品可用」+ 适用商品', renderCoupon(g2).html.includes('>指定商品可用</p>') && renderCoupon(g2).html.includes('适用商品：Claude Pro'))
  const cl = renderCoupon(c1)
  ok('领取券：有效期文字 + 领取链接登记', cl.html.includes('2026年10月7日前有效') && cl.links.some((l) => l.url === 'https://bigolab.com/coupon/spring100'))
  ok('领取券不出现 {{coupon_expires}}', !cl.html.includes('coupon_expires'))
  ok('领取券找不到批次：预览提示、发送不输出', renderCoupon(null, 'preview').html.includes('请选择一个可领取的券批次') && !renderCoupon(null).html.includes('券</p>'))
  eq('fmtMoney', [fmtMoney('30.00'), fmtMoney('29.9'), fmtMoney(0.1 + 0.2), fmtMoney('abc')], ['30', '29.90', '0.30', 'abc'])
}

console.log('\n[渲染] 体积')
{
  const big: EmailDoc = {
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    blocks: Array.from({ length: 40 }, (_x, i) => ({ id: `t${i}`, type: 'text' as const, size: 16 as const, align: 'left' as const, content: rich('长'.repeat(900)) })),
  }
  const r = renderEmail(big, ctxFor('send', big))
  ok('40 个大段落 → 体积 > 80KB', r.sizeBytes > 80 * 1024, `${r.sizeBytes}`)
  ok('lintRendered 报 HTML_TOO_LARGE（错误）', has(lintRendered({ html: r.html, text: r.text, subject: '(AD)x', sizeBytes: r.sizeBytes, imageCount: r.imageCount }), 'HTML_TOO_LARGE', 'error'))
  ok('sizeBytes 是 UTF-8 字节（中文 3 字节）', r.sizeBytes === utf8Bytes(r.html) && utf8Bytes('长') === 3 && utf8Bytes('😀') === 4)
  const base = { html: '<p>x</p>', text: 'x', subject: '(AD)x', imageCount: 1 }
  ok('61KB → HTML_LARGE 警告', has(lintRendered({ ...base, sizeBytes: 61 * 1024 }), 'HTML_LARGE', 'warn'))
  ok('50KB → 无体积问题', !has(lintRendered({ ...base, sizeBytes: 50 * 1024 }), 'HTML_LARGE') && !has(lintRendered({ ...base, sizeBytes: 50 * 1024 }), 'HTML_TOO_LARGE'))
  ok('图片 13 张 → 错误', has(lintRendered({ ...base, sizeBytes: 1000, imageCount: 13 }), 'TOO_MANY_IMAGES', 'error'))
  ok('<style> > 16KB → 错误', has(lintRendered({ ...base, html: `<style>${'a'.repeat(17 * 1024)}</style>`, sizeBytes: 20000 }), 'STYLE_TOO_LARGE', 'error'))
}

/* ============================== 富文本规范化 ============================== */

console.log('\n[富文本] normalizeRichDoc（TipTap / 粘贴的脏数据）')
{
  const messy = {
    type: 'doc',
    attrs: { foo: 1 },
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '标题' }] },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center', class: 'x' },
        content: [
          { type: 'text', text: 'a' + ZWSP + 'b' + RLO + 'c' + BOM, marks: [{ type: 'strong' }, { type: 'em' }, { type: 'textStyle', attrs: { color: 'rgb(255, 0, 0)', fontFamily: 'Comic Sans' } }] },
          { type: 'text', text: '链接', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)', target: '_blank', onclick: 'x' } }] },
          { type: 'text', text: '好链接', marks: [{ type: 'link', attrs: { href: 'www.example.com/x', rel: 'nofollow' } }] },
          { type: 'text', text: '坏链接', marks: [{ type: 'link', attrs: { href: '//evil.com' } }] },
          { type: 'text', text: '', marks: [{ type: 'bold' }] },
          { type: 'mention', attrs: { id: 'u1', label: '@小明' } },
          { type: 'image', attrs: { src: 'x.png' } },
          { type: 'text', text: '半透明', marks: [{ type: 'textStyle', attrs: { color: 'rgba(0, 0, 0, 0.5)' } }, { type: 'highlight', attrs: { color: '#ff0' } }] },
          { type: 'text', text: '短色', marks: [{ type: 'textStyle', attrs: { color: '#ABC' } }] },
          { type: 'text', text: '无色', marks: [{ type: 'textStyle', attrs: { color: 'transparent' } }] },
          { type: 'text', text: '空格色', marks: [{ type: 'textStyle', attrs: { color: 'rgb(0 128 255)' } }] },
        ],
      },
      { type: 'horizontalRule' },
      { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '引用' }] }] },
      { type: 'codeBlock', content: [{ type: 'text', text: 'line1\nline2' }] },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: '外层' }] },
              { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '内层' }] }, { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '更深' }] }] }] }] }] },
            ],
          },
        ],
      },
      { type: 'weirdWidget', content: [{ type: 'text', text: '未知节点里的字' }] },
      { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '单元格' }] }] }] }] },
      'raw string',
    ],
  }
  const n = normalizeRichDoc(messy)
  ok('结果通过严格 zod', richDocSchema.safeParse(n).success, JSON.stringify(richDocSchema.safeParse(n).error?.errors?.[0] || ''))
  const plain = richToPlain(n)
  ok('heading → 段落，文字保留', n.content[0].type === 'paragraph' && plain.startsWith('标题'))
  ok('零宽 / 双向覆盖 / BOM 被去掉', plain.includes('abc') && !plain.includes(ZWSP) && !plain.includes(RLO) && !plain.includes(BOM))
  const p1 = n.content[1]
  const inl = p1.type === 'paragraph' ? p1.content || [] : []
  const first = inl[0]
  eq('strong/em → bold/italic，rgb() → #hex，fontFamily 丢弃', first && first.type === 'text' ? first.marks : null, [{ type: 'bold' }, { type: 'italic' }, { type: 'textStyle', attrs: { color: '#ff0000' } }])
  // 规范化会合并相邻同样式文字（丢掉链接后的「坏链接」会和后面的 mention 文字并成一个节点），所以按包含查找
  const byText = (t: string) => inl.find((x) => x.type === 'text' && x.text.includes(t))
  const marksOf = (t: string) => {
    const x = byText(t)
    return x && x.type === 'text' ? x.marks || [] : null
  }
  eq('javascript: 链接 → 丢掉链接、保留文字', marksOf('链接'), [])
  eq('裸域名补 https://，丢弃 rel/target', marksOf('好链接'), [{ type: 'link', attrs: { href: 'https://www.example.com/x' } }])
  eq('协议相对 //evil.com 丢弃', marksOf('坏链接'), [])
  ok('空文字节点丢弃', !inl.some((x) => x.type === 'text' && x.text === ''))
  ok('mention → 文字', !!byText('@小明'))
  ok('行内图片丢弃', !JSON.stringify(n).includes('x.png'))
  eq('rgba 半透明按白底折算', marksOf('半透明'), [{ type: 'textStyle', attrs: { color: '#808080' } }])
  eq('#abc → #aabbcc；highlight 丢弃', marksOf('短色'), [{ type: 'textStyle', attrs: { color: '#aabbcc' } }])
  eq('transparent 颜色丢弃', marksOf('无色'), [])
  eq('rgb(空格分隔) 也识别', marksOf('空格色'), [{ type: 'textStyle', attrs: { color: '#0080ff' } }])
  ok('horizontalRule 丢弃', !JSON.stringify(n).includes('horizontalRule'))
  ok('blockquote 拆成段落', plain.includes('引用'))
  ok('codeBlock 换行 → hardBreak', JSON.stringify(n).includes('"text":"line1"},{"type":"hardBreak"},{"type":"text","text":"line2"'))
  const list = n.content.find((x) => x.type === 'bulletList')
  eq('嵌套列表压平成同一层', list && list.type === 'bulletList' ? list.content.map((i) => richToPlain({ type: 'doc', content: i.content })) : null, ['外层', '内层', '更深'])
  ok('未知节点拆成文字', plain.includes('未知节点里的字'))
  ok('表格拆成段落', plain.includes('单元格'))
  ok('块级散落字符串并成段落', plain.includes('raw string'))
  ok('未知 attrs 不保留', !JSON.stringify(n).includes('textAlign') && !JSON.stringify(n).includes('onclick'))

  let deep: Record<string, unknown> = { type: 'paragraph', content: [{ type: 'text', text: '底' }] }
  for (let i = 0; i < 200; i++) deep = { type: 'blockquote', content: [deep] }
  let threw = false
  try {
    normalizeRichDoc({ type: 'doc', content: [deep] })
  } catch {
    threw = true
  }
  ok('200 层嵌套不抛错', !threw)
  const long = normalizeRichDoc({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '字'.repeat(6000) }] }] })
  const lp = long.content[0]
  const lens = lp.type === 'paragraph' ? (lp.content || []).map((x) => (x.type === 'text' ? x.text.length : 0)) : []
  ok('超长文字拆成 ≤5000 的节点、一字不丢', lens.every((l) => l <= 5000) && lens.reduce((a, b) => a + b, 0) === 6000 && richDocSchema.safeParse(long).success)
  eq('纯文字输入 → 每行一段', normalizeRichDoc('第一行\n第二行').content.length, 2)
  eq('JSON 字符串输入被解析', richToPlain(normalizeRichDoc(JSON.stringify(emptyRichDoc('你好')))), '你好')
  eq('垃圾输入 → 一个空段落', normalizeRichDoc(42), { type: 'doc', content: [{ type: 'paragraph' }] })
  eq('U+2028 行分隔符 → 换行', JSON.stringify(normalizeRichDoc({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' + LS + 'b' }] }] })).includes('hardBreak'), true)
  eq('normalizeColor 颜色名 / 非法', [normalizeColor('White'), normalizeColor('var(--x)'), normalizeColor('#12345678')], ['#ffffff', null, '#123456'])
}

console.log('\n[富文本] normalizeDoc（整篇）')
{
  const good = normalizeDoc(getPreset('new-product')!.doc)
  ok('内置模板通过', good.ok)
  const dup = normalizeDoc({ v: 1, settings: { ...DEFAULT_SETTINGS, brand: '#ABC' }, blocks: [newBlock('spacer'), { ...newBlock('divider'), id: 'x' }, { ...newBlock('spacer'), id: 'x' }, { ...newBlock('spacer'), id: 'bad id!' }] })
  ok('重复 / 非法 id 被重新生成且唯一', dup.ok && new Set(dup.doc.blocks.map((b) => b.id)).size === 4 && dup.doc.blocks.every((b) => /^[A-Za-z0-9_-]{1,32}$/.test(b.id)))
  ok('#ABC → #aabbcc', dup.ok && dup.doc.settings.brand === '#aabbcc')
  const unk = normalizeDoc({ v: 1, settings: DEFAULT_SETTINGS, blocks: [{ id: 'a', type: 'carousel' }] })
  ok('未知区块类型 → 中文错误', !unk.ok && unk.error.includes('未知的区块类型'), unk.ok ? '' : unk.error)
  const empty = normalizeDoc({ v: 1, settings: DEFAULT_SETTINGS, blocks: [] })
  ok('没有区块 → 至少要有一个区块', !empty.ok && empty.error.includes('至少要有一个区块'))
  const badColor = normalizeDoc({ v: 1, settings: DEFAULT_SETTINGS, blocks: [{ ...newBlock('button'), bg: 'not-a-color' }] })
  ok('非法颜色 → 指出第几个区块', !badColor.ok && badColor.error.startsWith('第 1 个区块（按钮）'), badColor.ok ? '' : badColor.error)
  ok('非 JSON 字符串 → 错误', !normalizeDoc('{oops').ok)
  ok('v≠1 → 错误', !normalizeDoc({ v: 2, settings: DEFAULT_SETTINGS, blocks: [newBlock('spacer')] }).ok)
  const huge = normalizeDoc({ v: 1, settings: DEFAULT_SETTINGS, blocks: Array.from({ length: 40 }, () => ({ ...newBlock('text'), content: rich('字'.repeat(4900), '字'.repeat(4900)) })) })
  ok('文档 JSON > 200KB → 错误', !huge.ok && huge.error.includes('文档太大'), huge.ok ? '' : huge.error)
  const clamp = normalizeDoc({ v: 1, settings: DEFAULT_SETTINGS, blocks: [{ ...newBlock('spacer'), height: 500, box: { padTop: 999 } }, { ...newBlock('text'), content: '<b>粘贴</b>的纯文字' }] })
  ok('数值夹到合法范围、字符串 content 转富文本', clamp.ok && (clamp.doc.blocks[0] as { height: number }).height === 96 && clamp.doc.blocks[0].box?.padTop === 64 && richToPlain((clamp.doc.blocks[1] as Extract<Block, { type: 'text' }>).content) === '<b>粘贴</b>的纯文字')
  const again = normalizeDoc(JSON.stringify(dup.ok ? dup.doc : {}))
  ok('规范化幂等（二次规范化结果不变）', again.ok && dup.ok && JSON.stringify(again.doc) === JSON.stringify(dup.doc))
  eq('richToPlain 列表', richToPlain({ type: 'doc', content: [{ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }] }, { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }] }] }] }), '1. a\n2. b')
}

/* ============================== 检查 ============================== */

console.log('\n[检查] 禁发词（阿里云）')
{
  const hits: [string, string | null][] = [
    ['加我微信领取', '微信'],
    ['WeChat group', 'wechat'],
    ['ＷＥＣＨＡＴ', 'wechat'],
    ['weixin.qq.com', 'weixin'],
    ['加我 vx 咨询', 'vx'],
    ['VX:abc', 'vx'],
    ['进QQ群', 'QQ群'],
    ['Ｑ Ｑ 号 123', 'QQ号'],
    ['扣扣联系', '扣扣'],
    ['扫二维码', '二维码'],
    ['二 维 码', '二维码'],
    ['微' + ZWSP + '信', '微信'],
    ['微-信', '微信'],
    ['欢迎加群', '加群'],
    ['群聊见', '群聊'],
    ['百度云链接', '百度云'],
    ['夸克网盘资源', '夸克网盘'],
    ['阿里云盘', '阿里云盘'],
    ['网盘下载', '网盘'],
    ['联系 123456@qq.com', 'QQ号邮箱'],
    ['威信', '威信'],
  ]
  for (const [s, w] of hits) eq(`命中：${s}`, findBannedWord(s), w)
  const misses = ['service@qq.com', 'devxyz 与 vxe', 'weibo', '二维平面', '群发', '云计算', '阿里云邮件', 'https://bigolab.com/x', 'Claude Pro 月卡']
  for (const s of misses) eq(`不误报：${s}`, findBannedWord(s), null)
}

console.log('\n[检查] 广告法用语')
{
  eq('最佳 → 错误级', findAbsoluteTerm('最佳选择'), '最佳')
  eq('全网最低价 → 错误级', findAbsoluteTerm('全网最低价'), '全网最低')
  eq('顶 级（插空格）→ 错误级', findAbsoluteTerm('顶 级会员'), '顶级')
  eq('史上最 → 错误级', findAbsoluteTerm('史上最划算'), '史上最')
  eq('国家级 → 错误级', findAbsoluteTerm('国家级认证'), '国家级')
  eq('最近 / 最高 不误报', [findAbsoluteTerm('最近收到'), findAbsoluteTerm('最高 5 倍用量')], [null, null])
  eq('第一 / 独家 / 唯一 / 首个 → 警告级', [findAbsoluteWarnTerm('第一'), findAbsoluteWarnTerm('独家'), findAbsoluteWarnTerm('唯一'), findAbsoluteWarnTerm('首个')], ['第一', '独家', '唯一', '首个'])
  eq('警告词不算错误级', findAbsoluteTerm('独家首发'), null)
}

console.log('\n[检查] lintContent（7.4）')
{
  const base = (): EmailDoc => ({
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    blocks: [
      { id: 'h', type: 'header', logo: true, title: '贝果科技', bg: '#7c3aed', color: '#ffffff', align: 'left' },
      { id: 't', type: 'text', size: 16, align: 'left', content: rich('{{nickname|朋友}}，你好：', '这是一段足够长的正文文字，用来确保「文字过少」的提示不会出现，内容关于 AI 会员订阅与使用说明，再多写几个字凑够五十字。') },
      { id: 'b', type: 'button', label: '立即查看', href: '/products', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' },
    ],
  })
  const L = (doc: EmailDoc, over: Partial<Parameters<typeof lintContent>[0]> = {}) =>
    lintContent({ subject: '国庆特惠', preheader: '付款后即时发卡', topic: 'PROMO', doc, subjectPrefix: '(AD)', ...over })
  eq('干净文档没有任何问题', codes(L(base())), [])
  const withBlocks = (...blocks: Block[]) => ({ ...base(), blocks: [...base().blocks, ...blocks] })
  const noGreet = base()
  noGreet.blocks[1] = { ...noGreet.blocks[1], content: rich('你好：', '这是一段足够长的正文文字，用来确保「文字过少」的提示不会出现，内容关于 AI 会员订阅与使用说明。') } as Block
  ok('缺尊称 → 错误', has(L(noGreet), 'NO_GREETING', 'error'))
  ok('尊称只在主题里 → 仍然报缺', has(L(noGreet, { subject: '{{nickname}}，国庆特惠' }), 'NO_GREETING', 'error'))
  ok('主题为空 → 错误', has(L(base(), { subject: '  ' }), 'SUBJECT_EMPTY', 'error'))
  ok('主题 + 前缀 + 12 字昵称估算 > 100 → 错误', has(L(base(), { subject: '{{nickname}}' + '长'.repeat(85) }), 'SUBJECT_TOO_LONG', 'error'))
  ok('主题 90 字（无昵称）不超', !has(L(base(), { subject: '长'.repeat(90) }), 'SUBJECT_TOO_LONG'))
  ok('主题 > 30 字 → 警告', has(L(base(), { subject: '长'.repeat(31) }), 'SUBJECT_LONG', 'warn'))
  ok('主题换行 → 错误', has(L(base(), { subject: '国庆\n特惠' }), 'SUBJECT_NEWLINE', 'error'))
  ok('没填预览文字 → 警告', has(L(base(), { preheader: '' }), 'NO_PREHEADER', 'warn'))
  ok('主题里 {{email}} → 错误', has(L(base(), { subject: '{{email}} 你好' }), 'VAR_NOT_ALLOWED', 'error'))
  const tx = (s: string) => withBlocks({ id: 'x', type: 'text', size: 16, align: 'left', content: rich(s) })
  ok('未知变量 {{name}} → 错误', has(L(tx('{{name}}')), 'UNKNOWN_VAR', 'error'))
  ok('手写 {{mkt_unsub}} → 错误', has(L(tx('点 {{mkt_unsub}}')), 'SYSTEM_VAR', 'error'))
  ok('默认值非法 {{nickname|<b>}} → 错误', has(L(tx('{{nickname|<b>}}')), 'BAD_DEFAULT', 'error'))
  ok('默认值超 20 字 → 错误', has(L(tx(`{{nickname|${'长'.repeat(21)}}}`)), 'BAD_DEFAULT', 'error'))
  ok('{{ nickname | 老朋友 }}（带空格）合法', !hasErrors(L(tx('{{ nickname | 老朋友 }}'))))
  const split = withBlocks({ id: 's', type: 'text', size: 16, align: 'left', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '{{nick' }, { type: 'text', text: 'name}}', marks: [{ type: 'bold' }] }] }] } })
  ok('变量被加粗拆开 → 错误', has(L(split), 'BROKEN_VAR', 'error'))
  const btn = (href: string) => withBlocks({ id: 'bb', type: 'button', label: '看', href, bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' })
  ok('链接里放变量 → 错误', has(L(btn('https://x.org/?e={{email}}')), 'VAR_IN_URL', 'error'))
  ok('短链 t.cn → 错误', has(L(btn('https://t.cn/abc')), 'SHORT_LINK', 'error'))
  ok('短链 bit.ly → 错误', has(L(btn('http://bit.ly/x')), 'SHORT_LINK', 'error'))
  ok('短链子域 w.url.cn → 错误', has(L(btn('https://w.url.cn/s/x')), 'SHORT_LINK', 'error'))
  ok('javascript: 按钮 → 错误', has(L(btn('javascript:void(0)')), 'BAD_LINK', 'error'))
  ok('空链接 → 错误', has(L(btn('')), 'BAD_LINK', 'error'))
  ok('mailto 合法', !hasErrors(L(btn('mailto:a@b.com'))))
  ok('站内相对路径合法', !hasErrors(L(btn('/coupons'))))
  const im = (src: string) => withBlocks({ id: 'im', type: 'image', src, alt: '图', width: 100, align: 'center' })
  ok('webp 图片 → 错误', has(L(im('https://x.org/a.webp')), 'BAD_IMAGE', 'error'))
  ok('svg 图片 → 错误', has(L(im('https://x.org/a.svg')), 'BAD_IMAGE', 'error'))
  ok('http 图片 → 错误', has(L(im('http://x.org/a.png')), 'BAD_IMAGE', 'error'))
  ok('图片地址带变量 → 错误', has(L(im('https://x.org/{{email}}.png')), 'VAR_IN_URL', 'error'))
  ok('站内上传图片 /uploads/a.jpg 合法', !hasErrors(L(im('/uploads/a.jpg'))))
  ok('带查询串的 png 合法', !hasErrors(L(im('https://x.org/a.png?v=2'))))
  ok('图片未上传 → 错误', has(L(im('')), 'IMAGE_EMPTY', 'error'))
  ok('图片缺 alt → 警告', has(L(withBlocks({ id: 'im', type: 'image', src: '/uploads/a.jpg', alt: '', width: 100, align: 'center' })), 'IMAGE_NO_ALT', 'warn'))
  ok('13 张图 → 错误', has(L(withBlocks(...Array.from({ length: 13 }, (_x, i) => ({ id: `i${i}`, type: 'image' as const, src: '/uploads/a.jpg', alt: '图', width: 100, align: 'center' as const })))), 'TOO_MANY_IMAGES', 'error'))
  const grant = (topic: 'PROMO' | 'NEWS', extra: Partial<Extract<Block, { type: 'coupon' }>> = {}) =>
    L(withBlocks({ id: 'c', type: 'coupon', mode: 'grant', title: '券', ctaLabel: '用', bg: '#7c3aed', color: '#ffffff', grant: { kind: 'THRESHOLD', discount: 10, minAmount: 0, productIds: [], validity: { mode: 'days', days: 7 } }, ...extra }), { topic })
  ok('直发券 + 主题 PROMO 合法', !hasErrors(grant('PROMO')))
  ok('直发券 + 主题 NEWS → 错误', has(grant('NEWS'), 'COUPON_TOPIC', 'error'))
  ok('直发券没设参数 → 错误', has(grant('PROMO', { grant: undefined }), 'COUPON_NO_GRANT', 'error'))
  ok('领取券没选批次 → 错误', has(grant('PROMO', { mode: 'claim', grant: undefined }), 'COUPON_NO_CODE', 'error'))
  const two = withBlocks(
    { id: 'c1', type: 'coupon', mode: 'claim', title: '券', ctaLabel: '领', bg: '#7c3aed', color: '#ffffff', claimCode: 'abc' },
    { id: 'c2', type: 'coupon', mode: 'claim', title: '券', ctaLabel: '领', bg: '#7c3aed', color: '#ffffff', claimCode: 'abd' }
  )
  ok('两个券区块 → 错误', has(L(two), 'MULTI_COUPON', 'error'))
  ok('{{coupon_expires}} 但没有直发券 → 错误', has(L(tx('{{coupon_expires}} 前有效')), 'COUPON_EXPIRES_NO_GRANT', 'error'))
  ok('按钮文字含禁发词 → 错误且定位到区块', L(btn('/x')).length === 0 && L(withBlocks({ id: 'bw', type: 'button', label: '加微信', href: '/x', bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' })).some((i) => i.code === 'BANNED_WORD' && i.blockId === 'bw'))
  ok('主题含禁发词 → 错误', has(L(base(), { subject: '扫二维码领券' }), 'BANNED_WORD', 'error'))
  ok('链接地址含 weixin → 错误', has(L(btn('https://weixin.qq.com/x')), 'BANNED_WORD', 'error'))
  ok('头图含绝对化用语 → 错误', has(L(withBlocks({ id: 'hr', type: 'hero', title: '全网最低价', bg: '#f6f1fe', color: '#1f2937', align: 'center' })), 'ABSOLUTE_TERM', 'error'))
  ok('「独家」→ 警告', has(L(tx('独家渠道')), 'ABSOLUTE_WARN', 'warn'))
  ok('显示划线原价 → 警告', has(L(withBlocks({ id: 'p', type: 'product', productId: 4, layout: 'card', ctaLabel: '买', showOriginalPrice: true, showFeatures: false })), 'ORIGINAL_PRICE', 'warn'))
  ok('商品卡 + 主题 NEWS → 警告', has(L(withBlocks({ id: 'p', type: 'product', productId: 4, layout: 'card', ctaLabel: '买', showOriginalPrice: false, showFeatures: false }), { topic: 'NEWS' }), 'PRODUCT_TOPIC', 'warn'))
  ok('按钮白字浅底 → 对比度警告', has(L(withBlocks({ id: 'lc', type: 'button', label: '看', href: '/x', bg: '#fde68a', color: '#ffffff', radius: 8, align: 'center', fullWidth: false, size: 'md' })), 'LOW_CONTRAST', 'warn'))
  ok('只有页眉 → 没有内容区块', has(L({ ...base(), blocks: [base().blocks[0]] }), 'NO_CONTENT', 'error'))
  const onlyText = { ...base(), blocks: [base().blocks[1]] }
  ok('没有按钮 → 警告', has(L(onlyText), 'NO_BUTTON', 'warn'))
  ok('文字 < 50 字 → 警告', has(L({ ...base(), blocks: [{ id: 't', type: 'text', size: 16, align: 'left', content: rich('{{nickname}}，你好') }, base().blocks[2]] }), 'LITTLE_TEXT', 'warn'))
  ok('链接 > 15 个 → 警告', has(L(withBlocks(...Array.from({ length: 16 }, (_x, i) => ({ id: `l${i}`, type: 'button' as const, label: '看', href: `/p/${i}`, bg: '#7c3aed', color: '#ffffff', radius: 8, align: 'center' as const, fullWidth: false, size: 'md' as const })))), 'MANY_LINKS', 'warn'))
  ok('正文 14px → 警告', has(L(withBlocks({ id: 'sm', type: 'text', size: 14, align: 'left', content: rich('小字') })), 'SMALL_TEXT', 'warn'))
  ok('单块文字 > 5000 字 → 错误', has(L(withBlocks({ id: 'lg', type: 'text', size: 16, align: 'left', content: rich('字'.repeat(4000), '字'.repeat(1500)) })), 'TEXT_TOO_LONG', 'error'))

  // 审查 C8：券标题会原样存成 Coupon.name（买家「我的优惠券」里的券名），邮件里能逐封替换、券名不能 → 标题里不许放变量
  const titled = (title: string, extra: Partial<Extract<Block, { type: 'coupon' }>> = {}) =>
    L(withBlocks({ id: 'ct', type: 'coupon', mode: 'grant', title, ctaLabel: '去使用', bg: '#7c3aed', color: '#ffffff', grant: { kind: 'THRESHOLD', discount: 10, minAmount: 0, productIds: [], validity: { mode: 'days', days: 7 } }, ...extra }))
  const tagInTitle = titled('{{nickname|朋友}}的回归券')
  ok('券标题里放 {{nickname|朋友}} → VAR_NOT_ALLOWED 错误并定位到券区块', tagInTitle.some((i) => i.code === 'VAR_NOT_ALLOWED' && i.level === 'error' && i.blockId === 'ct' && i.message.includes('我的优惠券')), JSON.stringify(tagInTitle))
  ok('券标题里放 {{coupon_expires}} / {{email}} 同样报错', has(titled('{{coupon_expires}}到期券'), 'VAR_NOT_ALLOWED', 'error') && has(titled('{{email}} 专享'), 'VAR_NOT_ALLOWED', 'error'))
  const onlyTitleGreet = L({ ...base(), blocks: [base().blocks[0], { id: 'ct', type: 'coupon', mode: 'grant', title: '{{nickname}}券', ctaLabel: '用', bg: '#7c3aed', color: '#ffffff', grant: { kind: 'THRESHOLD', discount: 10, minAmount: 0, productIds: [], validity: { mode: 'days', days: 7 } } }] })
  ok('券标题里的 {{nickname}} 不算尊称（不会顺带满足 NO_GREETING）', has(onlyTitleGreet, 'NO_GREETING', 'error') && has(onlyTitleGreet, 'VAR_NOT_ALLOWED', 'error'))
  eq('券标题纯文字：无任何问题', codes(titled('回归专享券')), [])
  ok('券备注 / 券按钮里的 {{nickname}} 仍然允许（只进邮件、不存券名）', !hasErrors(titled('回归专享券', { note: '{{nickname|朋友}}专享', ctaLabel: '{{nickname|朋友}}去使用' })))
  ok('其他区块标题（头图）里的 {{nickname}} 仍然允许', !hasErrors(L(withBlocks({ id: 'hr', type: 'hero', title: '{{nickname|朋友}}，好久不见', bg: '#f6f1fe', color: '#1f2937', align: 'center' }))))
}

console.log('\n[检查] lintRendered（最终产物）')
{
  const doc = getPreset('new-product')!.doc
  const productsBad = { ...PRODUCTS, 4: P(4, { name: 'Claude 会员（加微信优惠）' }) }
  const r = renderEmail(doc, { ...ctxFor('send', doc), products: productsBad })
  ok('商品名里的禁发词在最终 HTML 里被查出', has(lintRendered({ html: r.html, text: r.text, subject: '(AD)x', sizeBytes: r.sizeBytes, imageCount: r.imageCount }), 'BANNED_WORD', 'error'))
  const r2 = renderEmail(doc, { ...ctxFor('send', doc), footer: { ...FOOTER, footerNote: '全网最低价保障' } })
  ok('页脚备注里的绝对化用语被查出', has(lintRendered({ html: r2.html, text: r2.text, subject: '(AD)x', sizeBytes: r2.sizeBytes, imageCount: r2.imageCount }), 'ABSOLUTE_TERM', 'error'))
  const r3 = renderEmail(doc, { ...ctxFor('send', doc), footer: { ...FOOTER, contactEmail: '12345678@qq.com' } })
  ok('联系邮箱是 QQ 号邮箱 → 禁发', has(lintRendered({ html: r3.html, text: r3.text, subject: '(AD)x', sizeBytes: r3.sizeBytes, imageCount: r3.imageCount }), 'BANNED_WORD', 'error'))
  const pv = renderEmail(doc, ctxFor('preview', doc))
  eq('首封告知里的「第一」不触发用语提示', codes(lintRendered({ html: pv.html, text: pv.text, subject: '(AD)x', sizeBytes: pv.sizeBytes, imageCount: pv.imageCount })), [])
  ok('HTML 里残留未知变量 → 错误', has(lintRendered({ html: '<p>{{foo}}</p>', text: '', subject: '(AD)x', sizeBytes: 10, imageCount: 0 }), 'UNKNOWN_VAR', 'error'))
  ok('系统占位不算未知变量', !has(lintRendered({ html: '<a href="{{mkt_link:3}}">{{nickname|朋友}}</a>{{mkt_notice}}', text: '{{mkt_unsub}}', subject: '(AD)x', sizeBytes: 10, imageCount: 0 }), 'UNKNOWN_VAR'))
  ok('多出来的系统占位（拼出来的 {{mkt_open}}）→ 错误', has(lintRendered({ html: '<p>{{mkt_open}}</p><img src="{{mkt_open}}">', text: '', subject: '(AD)x', sizeBytes: 10, imageCount: 0 }), 'SYSTEM_VAR', 'error'))
  const splitSys: EmailDoc = { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: [{ id: 't', type: 'text', size: 16, align: 'left', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '{' }, { type: 'text', text: '{mkt_unsub}}' }] }] } }] }
  const ss = renderEmail(splitSys, ctxFor('send', splitSys))
  ok('两段文字拼成 {{mkt_unsub}}：内容检查与渲染后检查都拦住', has(lintContent({ subject: 'x', preheader: 'y', topic: 'PROMO', doc: splitSys, subjectPrefix: '(AD)' }), 'BROKEN_VAR', 'error') && has(lintRendered({ html: ss.html, text: ss.text, subject: '(AD)x', sizeBytes: ss.sizeBytes, imageCount: ss.imageCount }), 'SYSTEM_VAR', 'error'))
  ok('最终主题里 {{email}} → 错误', has(lintRendered({ html: '', text: '', subject: '(AD){{email}}', sizeBytes: 0, imageCount: 0 }), 'VAR_NOT_ALLOWED', 'error'))
  ok('被标签拆开的禁发词也能查出（微<b>信</b>）', has(lintRendered({ html: '<body><p>加微<b>信</b></p></body>', text: '', subject: '(AD)x', sizeBytes: 10, imageCount: 0 }), 'BANNED_WORD'))
  ok('实体编码的禁发词也能查出（&#24494;信）', has(lintRendered({ html: '<body><p>&#24494;信</p></body>', text: '', subject: '(AD)x', sizeBytes: 10, imageCount: 0 }), 'BANNED_WORD'))
  ok('&amp;lt; 不会被二次解码成标签', !has(lintRendered({ html: '<body><p>&amp;lt;微</p></body>', text: '', subject: '(AD)x', sizeBytes: 10, imageCount: 0 }), 'BANNED_WORD'))
  ok('图片 alt 里的禁发词被查出', has(lintRendered({ html: '<body><img src="https://x.org/a.png" alt="扫二维码"></body>', text: '', subject: '(AD)x', sizeBytes: 10, imageCount: 1 }), 'BANNED_WORD'))
  eq('checkLinkUrl / checkImageUrl', [checkLinkUrl('https://a.b'), checkLinkUrl('ftp://x'), checkImageUrl('/u/a.GIF'), checkImageUrl('https://a.b/x')], [null, 'scheme', null, 'format'])
}

/* ============================== 昵称 ============================== */

console.log('\n[昵称] safeNickname（5.9）')
{
  eq('null → 默认值', safeNickname(null, '老朋友'), '老朋友')
  eq('正常昵称', safeNickname('小明', '朋友'), '小明')
  eq('截断到 12 字', safeNickname('一二三四五六七八九十甲乙丙丁', '朋友'), '一二三四五六七八九十甲乙')
  eq('网址 → 默认值', safeNickname('http://evil.cn', '朋友'), '朋友')
  eq('www → 默认值', safeNickname('www.x', '朋友'), '朋友')
  eq('裸域名 → 默认值', safeNickname('来 evil.com 领钱', '朋友'), '朋友')
  eq('全角句点域名 → 默认值', safeNickname('evil。com', '朋友'), '朋友')
  eq('@ → 默认值', safeNickname('a@b', '朋友'), '朋友')
  eq('全角＠ → 默认值（NFKC）', safeNickname('a＠b', '朋友'), '朋友')
  eq('连续 5 位数字 → 默认值', safeNickname('小明12345', '朋友'), '朋友')
  eq('全角数字也算', safeNickname('１２３４５', '朋友'), '朋友')
  eq('带空格的号码 → 默认值', safeNickname('123 456 78', '朋友'), '朋友')
  eq('4 位数字可以', safeNickname('Tom1990', '朋友'), 'Tom1990')
  eq('禁发词 → 默认值', safeNickname('加微信送会员', '朋友'), '朋友')
  eq('零宽字符夹在禁发词里也拦住', safeNickname('微' + ZWSP + '信', '朋友'), '朋友')
  eq('去掉零宽 / 双向覆盖字符', safeNickname('小' + ZWSP + '明' + RLO, '朋友'), '小明')
  eq('全角字母折叠（NFKC）', safeNickname('ＡＢＣ', '朋友'), 'ABC')
  eq('控制字符 → 空格并压缩', safeNickname('小\n\t明', '朋友'), '小 明')
  eq('去掉花括号（不像变量）', safeNickname('{{email}}', '朋友'), 'email')
  eq('空白 → 默认值', safeNickname('   ', '朋友'), '朋友')
  eq('默认值非法 → 朋友', safeNickname(null, '<b>'), '朋友')
  eq('默认值传空串 → 不可用时返回空串', [safeNickname('http://x', ''), safeNickname(null, '')], ['', ''])
  eq('emoji 按字符截断不切坏代理对', safeNickname('😀'.repeat(15), '朋友'), '😀'.repeat(12))
  ok('HTML 尖括号保留（由输出语境负责转义）', safeNickname('<b>小明</b>', '朋友') === '<b>小明</b>')
}

/* ============================== 个性化 ============================== */

console.log('\n[个性化] 单趟替换、分语境转义（5.9）')
{
  const v = { ...VARS, nickname: '<b>&"' }
  eq('HTML：昵称被转义', personalizeHtml('<p>{{nickname|朋友}}，你好</p>', v), '<p>&lt;b&gt;&amp;&quot;，你好</p>')
  eq('纯文本：昵称原文', personalizeText('{{nickname|朋友}}，你好', v), '<b>&"，你好')
  eq('主题：原文、去 \\r\\n\\t', personalizeSubject('(AD){{nickname}}的专属券', { nickname: '小\t明' }), '(AD)小 明的专属券')
  eq('主题：{{email}} / {{mkt_*}} 抹掉', personalizeSubject('(AD){{email}}券{{mkt_unsub}}', { nickname: 'x' }), '(AD)券')
  eq('昵称为空 → 占位默认值', personalizeHtml('{{nickname|老朋友}}', { ...VARS, nickname: null }), '老朋友')
  eq('昵称为空且无默认 → 朋友', personalizeText('{{nickname}}', { ...VARS, nickname: null }), '朋友')
  eq('默认值非法 → 朋友', personalizeText('{{nickname|a&amp;b}}', { ...VARS, nickname: null }), '朋友')
  eq('带空格的变量写法', personalizeText('{{ nickname | 老朋友 }}', { ...VARS, nickname: null }), '老朋友')
  eq('昵称再过一遍 safeNickname（调用方漏洗也兜住）', personalizeText('{{nickname|朋友}}', { ...VARS, nickname: '加微信 xx' }), '朋友')
  eq('{{email}} HTML 转义', personalizeHtml('{{email}}', { ...VARS, email: 'a&b@x.com' }), 'a&amp;b@x.com')
  eq('{{coupon_expires}}', personalizeText('{{coupon_expires}}前有效', VARS), '2026年10月7日前有效')
  eq('{{mkt_link:N}} → linkBase + N', personalizeHtml('<a href="{{mkt_link:12}}">x</a>', VARS), `<a href="${VARS.linkBase}12">x</a>`)
  eq('{{mkt_link:N}} 纯文本同样', personalizeText('{{mkt_link:3}}', VARS), `${VARS.linkBase}3`)
  eq('{{mkt_unsub}} / {{mkt_prefs}}', personalizeHtml('{{mkt_unsub}}|{{mkt_prefs}}', VARS), `${VARS.unsubscribeUrl}|${VARS.prefsUrl.replace('&', '&amp;')}`)
  eq('{{mkt_open}}：HTML 有、纯文本无', [personalizeHtml('{{mkt_open}}', VARS), personalizeText('[{{mkt_open}}]', VARS)], [VARS.openPixelUrl, '[]'])
  eq('{{mkt_notice}} 转义', personalizeHtml('{{mkt_notice}}', { ...VARS, notice: '<i>首封</i>' }), '&lt;i&gt;首封&lt;/i&gt;')
  eq('非首封 {{mkt_notice}} → 空', personalizeText('[{{mkt_notice}}]', { ...VARS, notice: '' }), '[]')
  eq('未知变量原样保留', personalizeHtml('{{foo}}', VARS), '{{foo}}')
  eq('不再扫描替换结果：券到期字段里的 {{mkt_unsub}} 原样输出', personalizeText('{{coupon_expires}}', { ...VARS, couponExpires: '{{mkt_unsub}}' }), '{{mkt_unsub}}')
  eq('不再扫描替换结果：邮箱里的 {{mkt_prefs}} 原样输出', personalizeHtml('{{email}}', { ...VARS, email: '{{mkt_prefs}}' }), '{{mkt_prefs}}')
  eq('不再扫描替换结果：notice 里的 {{nickname}} 原样输出', personalizeText('{{mkt_notice}}', { ...VARS, notice: '{{nickname}}' }), '{{nickname}}')
  eq('昵称长得像变量 → 去掉花括号', personalizeText('{{nickname}}', { ...VARS, nickname: '{{mkt_unsub}}' }), 'mkt_unsub')
  eq('同一段多个变量一次替换', personalizeText('{{nickname}}/{{email}}/{{nickname|x}}', VARS), '小明/a@b.com/小明')

  // 端到端：send 快照 → 逐封个性化后不留任何占位
  const doc = kitchenSink()
  const r = renderEmail(doc, ctxFor('send', doc))
  const html = personalizeHtml(r.html, VARS)
  const text = personalizeText(r.text, VARS)
  ok('端到端：HTML 不留任何 {{…}}', !/\{\{/.test(html))
  ok('端到端：纯文本不留任何 {{…}}', !/\{\{/.test(text))
  ok('端到端：跟踪链接、退订链接、像素都就位', html.includes(`href="${VARS.linkBase}1"`) && html.includes(`href="${VARS.unsubscribeUrl}"`) && html.includes(`<img src="${VARS.openPixelUrl}"`))
  ok('端到端：昵称、券到期、首封告知', html.includes('小明，你好：') && html.includes('2026年10月7日前有效') && html.includes(escapeHtml(FIRST_NOTICE_TEXT)))
  ok('端到端：<title> 与 aria-label 里的昵称也替换', html.includes('<title>小明，国庆特惠</title>') && html.includes('aria-label="小明，国庆特惠"'))
  ok('端到端：lintRendered 对快照无错误', !hasErrors(lintRendered({ html: r.html, text: r.text, subject: '(AD){{nickname|朋友}}，国庆特惠', sizeBytes: r.sizeBytes, imageCount: r.imageCount })))
}

console.log('\n[个性化] {{email}} 代入正文不能带出 QQ 号（审查 C7）')
{
  const QQ = '123456789@qq.com'
  eq('safeBodyEmail：QQ 号邮箱遮成「前两位 + ***」', safeBodyEmail(QQ), '12***@qq.com')
  eq('safeBodyEmail：大写域名 / 夹在字母后的号码同样遮', [safeBodyEmail('987654321@QQ.COM'), safeBodyEmail('ab12345678@qq.com')], ['98***@QQ.COM', 'ab***@qq.com'])
  eq('safeBodyEmail：普通地址、字母 QQ 邮箱、4 位数字原样', [safeBodyEmail('a@b.com'), safeBodyEmail('abc@qq.com'), safeBodyEmail('1234@qq.com'), safeBodyEmail('12345@163.com')], ['a@b.com', 'abc@qq.com', '1234@qq.com', '12345@163.com'])
  eq('safeBodyEmail：本地部分含禁发词也遮', safeBodyEmail('weixin123@163.com'), 'we***@163.com')
  eq('safeBodyEmail：遮完仍命中（域名带禁发词）/ 不像地址 / 空 → 空串', [safeBodyEmail('ab@weixin.com'), safeBodyEmail('weixin'), safeBodyEmail(''), safeBodyEmail(null)], ['', '', '', ''])
  ok('safeBodyEmail 的结果永远过得了 findBannedWord', [QQ, '987654321@QQ.COM', 'weixin123@163.com', 'ab@weixin.com', 'x@wechat.qq.com', 'a@b.com'].every((e) => findBannedWord(safeBodyEmail(e)) === null))

  const tplHtml = '<body><p>{{nickname|朋友}}，本邮件发送至 {{email}}</p></body>'
  const tplText = '{{nickname|朋友}}，本邮件发送至 {{email}}'
  eq('前提：模板本身不含禁发词（检查与上线都会放行）', [findBannedWord(tplHtml), findBannedWord(tplText)], [null, null])
  eq('反例：原样代入 QQ 号地址就会命中「QQ号邮箱」', findBannedWord(tplText.replace('{{email}}', QQ)), 'QQ号邮箱')
  const h = personalizeHtml(tplHtml, { ...VARS, email: QQ })
  const tx = personalizeText(tplText, { ...VARS, email: QQ })
  ok('personalizeHtml：QQ 号收件人的正文里没有 QQ 号地址', !h.includes('123456789') && h.includes('12***@qq.com'), h)
  eq('personalizeHtml：个性化结果 findBannedWord(visibleTextOf) 为 null', findBannedWord(visibleTextOf(h)), null)
  ok('personalizeText：同样遮掩且不命中禁发词', !tx.includes('123456789') && findBannedWord(tx) === null, tx)
  eq('personalizeText：普通地址照常代入', personalizeText(tplText, { ...VARS, email: 'abc@qq.com' }), '小明，本邮件发送至 abc@qq.com')

  // 端到端：send 快照 → 逐封个性化 → 对「最终发出去的那一封」做渲染后检查
  const d: EmailDoc = { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: [{ id: 't', type: 'text', size: 16, align: 'left', content: rich('{{nickname|朋友}}，本邮件发送至 {{email}}', '这是一段足够长的正文文字，内容关于 AI 会员订阅与使用说明。') }] }
  const snap = renderEmail(d, ctxFor('send', d))
  ok('快照里 {{email}} 仍是占位（真实地址发送时才代入）', snap.html.includes('{{email}}'))
  const fh = personalizeHtml(snap.html, { ...VARS, email: QQ })
  const ft = personalizeText(snap.text, { ...VARS, email: QQ })
  const finalIssues = lintRendered({ html: fh, text: ft, subject: '(AD)x', sizeBytes: utf8Bytes(fh), imageCount: snap.imageCount })
  ok('端到端：QQ 号收件人的最终 HTML / 纯文本没有禁发词', !has(finalIssues, 'BANNED_WORD'), JSON.stringify(finalIssues))

  // 预览 / 测试与真发同一口径：测试发给 QQ 号邮箱不再被「可能来自商品文字或页脚设置」误拦
  const tr = renderEmail(d, ctxFor('test', d, { vars: { nickname: '小明', email: QQ } }))
  ok('test：QQ 号测试收件人看到遮掩后的地址', tr.html.includes('12***@qq.com') && !tr.html.includes('123456789') && !tr.text.includes('123456789'))
  ok('test：渲染后检查不再报禁发词', !has(lintRendered({ html: tr.html, text: tr.text, subject: '(AD)x', sizeBytes: tr.sizeBytes, imageCount: tr.imageCount }), 'BANNED_WORD'))
  ok('test：普通测试地址原样显示', renderEmail(d, ctxFor('test', d, { vars: { nickname: '小明', email: 'x@y.com' } })).html.includes('本邮件发送至 x@y.com'))
  ok('preview：没给地址用样例 you@example.com', renderEmail(d, ctxFor('preview', d)).html.includes('本邮件发送至 you@example.com'))
}

/* ============================== 模板与工厂 ============================== */

console.log('\n[模板] 内置模板（7.3）')
{
  eq('5 个模板、key 与顺序', PRESETS.map((p) => p.key), ['new-product', 'coupon', 'winback', 'notice', 'blank'])
  eq('模板名称', PRESETS.map((p) => p.name), ['新品上架', '限时优惠券', '老客召回', '简洁通知', '空白'])
  eq('主题分类', PRESETS.map((p) => p.topic), ['PRODUCT', 'PROMO', 'PROMO', 'NEWS', 'PROMO'])
  for (const p of PRESETS) {
    ok(`${p.name}：文档通过严格 zod`, emailDocSchema.safeParse(p.doc).success)
    ok(`${p.name}：内置 {{nickname|朋友}} 尊称`, JSON.stringify(p.doc).includes('{{nickname|朋友}}'))
    const all = JSON.stringify(p)
    ok(`${p.name}：不含禁发词 / 绝对化用语`, !findBannedWord(all) && !findAbsoluteTerm(all) && !findAbsoluteWarnTerm(all.replace(/"key":"[^"]*"/g, '')))
    const products = p.doc.blocks.filter((b) => b.type === 'product') as Extract<Block, { type: 'product' }>[]
    ok(`${p.name}：商品区块用占位商品 #${PLACEHOLDER_PRODUCT_ID}`, products.every((b) => b.productId === PLACEHOLDER_PRODUCT_ID))
    const issues = lintContent({ subject: p.subject, preheader: p.preheader, topic: p.topic, doc: p.doc, subjectPrefix: '(AD)' })
    if (p.key === 'blank') ok('空白：只差主题（需要作者自己写）', codes(issues.filter((i) => i.level === 'error')).join() === 'SUBJECT_EMPTY')
    else eq(`${p.name}：lintContent 零问题`, codes(issues), [])
    for (const mode of ['send', 'test'] as const) {
      const cb = p.doc.blocks.find((b) => b.type === 'coupon') as Extract<Block, { type: 'coupon' }> | undefined
      const r = renderEmail(p.doc, { ...ctxFor(mode, p.doc), subject: p.subject, preheader: p.preheader, coupon: cb ? couponViewFor(cb, ORIGIN, { productNames: [] }) : null })
      const li = lintRendered({ html: r.html, text: r.text, subject: '(AD)' + p.subject, sizeBytes: r.sizeBytes, imageCount: r.imageCount })
      ok(`${p.name}：${mode} 渲染后检查无错误`, !hasErrors(li), codes(li).join())
      if (mode === 'send') ok(`${p.name}：体积 < 60KB`, r.sizeBytes < 60 * 1024, `${r.sizeBytes}`)
    }
  }
  const coupon = PRESETS.find((p) => p.key === 'coupon')!
  ok('限时优惠券：含直发券区块', coupon.doc.blocks.some((b) => b.type === 'coupon' && b.mode === 'grant' && !!b.grant))
  const wb = PRESETS.find((p) => p.key === 'winback')!
  ok('老客召回：含直发券区块', wb.doc.blocks.some((b) => b.type === 'coupon' && b.mode === 'grant'))
  const nt = PRESETS.find((p) => p.key === 'notice')!
  ok('简洁通知：文字信（无头图/商品/券）', !nt.doc.blocks.some((b) => ['hero', 'product', 'productGrid', 'coupon', 'image'].includes(b.type)))
  ok('模板主题/预览文字不写死券面额与天数', PRESETS.every((p) => !/¥\s*\d|\d+\s*天/.test(p.subject + p.preheader)))

  /* ---- 审查 C6：交付承诺只能限定「自动发货的商品」 ----
   * 只扫 PRESETS 的产出：本脚本自己的夹具里合法地写着「付款后即时发卡」（ctxFor 的预览文字、商品卖点）。 */
  // 收件人能看到的全部文字：主题、预览文字、各区块的文字字段（富文本按段落拼成纯文本，粗体拆开的也连上）
  const presetPlain = (p: Pick<Preset, 'subject' | 'preheader' | 'doc'>): string => {
    const out: string[] = [p.subject, p.preheader]
    const walk = (v: unknown, key = ''): void => {
      if (typeof v === 'string') out.push(v)
      else if (Array.isArray(v)) v.forEach((x) => walk(x))
      else if (v && typeof v === 'object') {
        if (key === 'content' && (v as { type?: string }).type === 'doc') out.push(richToPlain(v as Parameters<typeof richToPlain>[0]))
        else for (const [k, x] of Object.entries(v)) walk(x, k)
      }
    }
    walk(p.doc.blocks)
    return out.join('\n')
  }
  // 笼统的「付款即发卡」说法：SMS 商品只给号码、MANUAL 商品客服处理，对它们都是假话
  const BLANKET_DELIVERY_RE = /即时发卡|卡密即时|即时发(到|送)|立即发(卡|到)|秒发|马上发(卡|到)/
  const deliveryProblems = (text: string): string[] => {
    const bad: string[] = []
    const m = BLANKET_DELIVERY_RE.exec(text)
    if (m) bad.push(`笼统承诺「${m[0]}」`)
    for (const s of text.split(/[。；;！!？?\n]/))
      if (s.includes('卡密') && /发到|发送到|发至/.test(s) && !s.includes('自动发货')) bad.push(`没限定自动发货：${s}`)
    return bad
  }
  for (const p of PRESETS) {
    eq(`${p.name}：没有笼统的交付承诺（卡密发邮箱只对自动发货商品说）`, deliveryProblems(presetPlain(p)), [])
    ok(`${p.name}：主题+预览文字+文档 JSON 不含「即时发卡 / 卡密即时」`, !/即时发卡|卡密即时/.test(JSON.stringify([p.subject, p.preheader, p.doc])))
  }
  ok('反例：旧文案「付款后即时发卡」被识别', deliveryProblems('和往常一样：支付宝付款，付款后即时发卡。').length > 0)
  ok('反例：旧文案「卡密会即时发到…账号邮箱」被识别', deliveryProblems('付款成功后，卡密会即时发到你登录本站所用的账号邮箱，也可以在「我的订单」里查看。').length > 0)
  ok('反例：没写「即时」但没限定自动发货的「卡密发送到账号邮箱」也被识别', deliveryProblems('卡密发送到你登录本站所用的账号邮箱，也可以在「我的订单」里查看。').length > 0)
  eq('正例：限定自动发货的说法放行', deliveryProblems('自动发货的商品，卡密会发到你的账号邮箱；各商品的交付方式以商品页说明为准。'), [])
  const ntPlain = presetPlain(nt)
  ok('简洁通知：分别说明接码商品看订单详情、人工商品由客服处理', ntPlain.includes('短信接码商品请在「我的订单 → 订单详情」查看号码与验证码') && ntPlain.includes('人工服务类商品由客服处理'))
  ok('限时优惠券：怎么用只说「交付方式以商品页说明为准」', presetPlain(coupon).includes('交付方式以商品页说明为准'))

  /* ---- 审查 C13：文案默认读者「买过」的模板，默认受众只能是付过款的人 ---- */
  const PRIOR_PURCHASE_RE = /上次.{0,12}下单|好久不见|回归|一直以来|老客户|再次光临/
  const assumesBuyer = (p: Pick<Preset, 'subject' | 'preheader' | 'doc'>) => PRIOR_PURCHASE_RE.test(presetPlain(p))
  const paidOnly = (a: AudienceSpec | undefined) => a?.type === 'SEGMENT' && a.rules.paid === 'yes'
  eq('老客召回：默认受众 = 付过款且 90 天未再付款、排除长期不活跃', wb.audience, { type: 'SEGMENT', rules: { paid: 'yes', noPaidWithinDays: 90, excludeInactive: true } })
  ok('老客召回：默认受众通过 audienceSpecSchema', audienceSpecSchema.safeParse(wb.audience).success)
  eq('getPreset 深拷贝同样带受众', getPreset('winback')!.audience, wb.audience)
  ok('老客召回的文案确实默认读者买过（受众限定不是摆设）', assumesBuyer(wb))
  for (const p of PRESETS) if (assumesBuyer(p)) ok(`${p.name}：文案默认读者买过 → 默认受众只含付过款的人`, paidOnly(p.audience))
  ok('其余模板的文案不默认读者买过（它们默认发给全部活跃用户）', PRESETS.filter((p) => p.key !== 'winback').every((p) => !assumesBuyer(p)), PRESETS.filter((p) => p.key !== 'winback' && assumesBuyer(p)).map((p) => p.key).join())
  ok('其余模板不带受众（沿用默认「全部活跃用户」）', PRESETS.filter((p) => p.key !== 'winback').every((p) => p.audience === undefined))
  ok('反例：写了「上次下单」却没限定受众的模板会被识别', assumesBuyer({ subject: 'x', preheader: '', doc: { ...wb.doc } }) && !paidOnly(undefined) && !paidOnly({ type: 'ALL', excludeInactive: true }))
  const a = getPreset('coupon')!
  a.doc.blocks.length = 0
  ok('getPreset 返回深拷贝（改它不污染内置模板）', getPreset('coupon')!.doc.blocks.length > 0)
  eq('getPreset 不存在 → null', getPreset('nope'), null)
}

console.log('\n[工厂] newBlock / blockSummary / 主题')
{
  const types = ['header', 'hero', 'heading', 'text', 'image', 'button', 'product', 'productGrid', 'coupon', 'callout', 'divider', 'spacer'] as const
  for (const t of types) {
    const b = newBlock(t)
    ok(`newBlock(${t}) 通过 zod`, blockSchema.safeParse(b).success && b.type === t)
  }
  ok('newBlock 用传入配色', (newBlock('button', THEMES[1].settings) as { bg: string }).bg === THEMES[1].settings.brand)
  ok('newBlock id 各不相同', new Set(Array.from({ length: 50 }, () => newBlock('spacer').id)).size === 50)
  eq('摘要：标题', blockSummary({ id: 'a', type: 'heading', content: rich('国庆特惠活动今天开始，欢迎大家踊跃参加，名额有限先到先得'), level: 2, align: 'left' }), '标题：国庆特惠活动今天开始，欢迎大家踊跃参加，名额有限…')
  eq('摘要：商品', blockSummary(newBlock('product')), `商品卡片 #${PLACEHOLDER_PRODUCT_ID}`)
  eq('摘要：直发券', blockSummary(newBlock('coupon')), '优惠券（直发）：¥20 · 满99')
  eq('摘要：留白', blockSummary(newBlock('spacer')), '留白 24px')
  eq('摘要：图片未上传', blockSummary(newBlock('image')), '图片：（未上传）')
  eq('4 套主题', THEMES.map((t) => t.name), ['品牌紫粉', '深空蓝', '清新绿', '简约黑白'])
  eq('DEFAULT_SETTINGS 未被改动', [DEFAULT_SETTINGS.brand, DEFAULT_SETTINGS.accent, DEFAULT_SETTINGS.backdrop], ['#7c3aed', '#db2777', '#f4f5f7'])
  for (const t of THEMES) {
    const s = t.settings
    ok(
      `主题「${t.name}」对比度：正文/链接/次要字 ≥4.5，白字在品牌色 ≥4.5，白字在强调色 ≥3`,
      contrastRatio(s.text, s.canvas) >= 4.5 && contrastRatio(s.link, s.canvas) >= 4.5 && contrastRatio(s.muted, s.canvas) >= 4.5 && contrastRatio('#ffffff', s.brand) >= 4.5 && contrastRatio('#ffffff', s.accent) >= 3
    )
  }
  const themed = applyTheme(getPreset('new-product')!.doc, THEMES[2].settings)
  const cta = themed.blocks.find((b) => b.id === 'cta') as { bg: string }
  ok('applyTheme：按钮品牌色跟着换', cta.bg === THEMES[2].settings.brand)
  const hero = themed.blocks.find((b) => b.id === 'hero') as { bg: string }
  ok('applyTheme：模板里的品牌浅色也跟着换', hero.bg === mixHex(THEMES[2].settings.brand, '#ffffff', 0.93))
  ok('applyTheme：结果仍通过 zod', emailDocSchema.safeParse(themed).success)
}

console.log('\n[健壮性] 编辑中的半成品文档不能让预览/检查白屏')
{
  const broken = {
    v: 1,
    settings: {},
    blocks: [
      { id: 'a', type: 'image' },
      { id: 'b', type: 'button' },
      { id: 'c', type: 'text' },
      { id: 'd', type: 'productGrid' },
      { id: 'e', type: 'hero' },
      { id: 'f', type: 'coupon', mode: 'grant' },
      { id: 'g', type: 'header' },
      null,
      { id: 'h', type: 'heading', content: 'x' },
      { id: 'i', type: 'spacer' },
      { id: 'j', type: 'nonsense' },
    ],
  } as unknown as EmailDoc
  const tryIt = (fn: () => unknown) => {
    try {
      fn()
      return true
    } catch (e) {
      console.error('    ', (e as Error).message)
      return false
    }
  }
  const lintIt = () => lintContent({ subject: 'x', preheader: '', topic: 'PROMO', doc: broken, subjectPrefix: '(AD)' })
  ok('lintContent 不抛错', tryIt(lintIt))
  ok('renderEmail(preview) 不抛错', tryIt(() => renderEmail(broken, ctxFor('preview', kitchenSink()))))
  ok('blockSummary 不抛错', tryIt(() => broken.blocks.forEach((b) => blockSummary(b as Block))))
  const pv = renderEmail(broken, ctxFor('preview', kitchenSink()))
  ok('半成品文档预览：每个区块都能点选（有 data-bid）', ['a', 'b', 'c', 'e', 'f', 'g', 'h', 'i'].every((id) => pv.html.includes(`data-bid="${id}"`)))
  ok('缺失的配色回落默认主题', pv.html.includes(`bgcolor="${DEFAULT_SETTINGS.backdrop}"`))
  ok('半成品 lint 报出结构错误', hasErrors(lintIt()))
  eq('留白缺高度时摘要回落 24px', blockSummary({ id: 'i', type: 'spacer' } as unknown as Block), '留白 24px')
}

console.log(`\n${fail ? '✗' : '✓'} 通过 ${pass}，失败 ${fail}`)
process.exit(fail ? 1 : 0)
