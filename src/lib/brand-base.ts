/**
 * 店面品牌：类型、主站默认值、回退规则与字段格式（docs/多渠道分销-渠道品牌与公告.md）。
 *
 * 【与 contact-base 同样的拆法】本文件进客户端包（storefront-provider 的 FALLBACK、public.ts 的类型），所以**零依赖**；
 * 需要禁发词库（marketing/lint）的写入校验放在 src/lib/brand.ts（服务端），它 re-export 本文件。
 *
 * 【主站逐字不变】主站店面的 brand = PLATFORM_BRAND：name 是「贝果科技」，其余展示字段一律 null。
 * 组件的约定是「字段为 null → 渲染原来写死的那一套」，所以主站的 HTML 与改造前逐字相同，也不读 tenants 表。
 *
 * 【渠道回退】每个字段各自回退：渠道没填（或库里的值读出来不合规）→ null → 用主站原样。
 * 唯一例外是 name：没填时为「贝果科技」（字符串，永不为空），custom=false。
 *
 * 【白标与经营主体】（站长 10-05 拍板）渠道改了站名或 logo（whiteLabel=true）时，页脚最底下多一行小字
 * 「技术与支付服务：益阳市赫山区必高科技有限公司」：支付宝收款方、发票开具方始终是必高，买家付款时看到的主体能对上。
 * 服务条款、隐私政策正文里的主体不改。
 */

/** 店面品牌（公开数据，会进 HTML 与 RSC payload） */
export interface StoreBrand {
  /** 站名：主站与未设置的渠道 =「贝果科技」 */
  name: string
  /** name 是不是渠道自己设的 */
  custom: boolean
  /** 站标图片站内路径（/uploads/brand/<名>.<ext>）；null = 用主站原来的 logo 文件 */
  logoUrl: string | null
  /** 页脚简介；null = 主站原文 */
  intro: string | null
  /** 首页大标题；null = 主站原来的标题区 */
  heroTitle: string | null
  /** 首页副标题；null = 主站原文 */
  heroSubtitle: string | null
  /** 浏览器标题（首页 <title> 与分享标题）；null = 主站原文 */
  seoTitle: string | null
  /** 搜索 / 分享摘要；null = 主站原文 */
  seoDescription: string | null
}

export const PLATFORM_BRAND_NAME = '贝果科技'
/** 白标时页脚底部的经营主体小字（收款方、开票方） */
export const OPERATOR_LINE = '技术与支付服务：益阳市赫山区必高科技有限公司'

export const PLATFORM_BRAND: Readonly<StoreBrand> = Object.freeze({
  name: PLATFORM_BRAND_NAME,
  custom: false,
  logoUrl: null,
  intro: null,
  heroTitle: null,
  heroSubtitle: null,
  seoTitle: null,
  seoDescription: null,
})

/** 改了站名或 logo：页面上要换掉贝果的字样与图标，并在页脚底部保留经营主体小字 */
export function isWhiteLabel(b: StoreBrand | null | undefined): boolean {
  return !!b && (b.custom || !!b.logoUrl)
}

/** tenants 行里的品牌列（均可缺省：itest 假库、旧 select 不带这些列时按「未设置」处理） */
export interface TenantBrandRow {
  brandName?: string | null
  brandLogoUrl?: string | null
  brandIntro?: string | null
  heroTitle?: string | null
  heroSubtitle?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

/** 可编辑的文字字段（审计只写「哪些字段变了」用这里的名字；logo 另算 brandLogoUrl） */
export const BRAND_TEXT_FIELDS = ['brandName', 'brandIntro', 'heroTitle', 'heroSubtitle', 'seoTitle', 'seoDescription'] as const
export type BrandTextField = (typeof BRAND_TEXT_FIELDS)[number]
export type BrandField = BrandTextField | 'brandLogoUrl'

/** 每个文字字段的长度上限（字符数，按码点算）与给人看的名字 */
export const BRAND_TEXT_LIMITS: Readonly<Record<BrandTextField, { min: number; max: number; label: string }>> = Object.freeze({
  brandName: { min: 2, max: 12, label: '网站名称' },
  brandIntro: { min: 4, max: 200, label: '页脚简介' },
  heroTitle: { min: 2, max: 20, label: '首页大标题' },
  heroSubtitle: { min: 2, max: 80, label: '首页副标题' },
  seoTitle: { min: 2, max: 40, label: '浏览器标题' },
  seoDescription: { min: 4, max: 120, label: '分享摘要' },
})

/** 站标地址：只认服务端生成的文件名（upload-store 的 `<时间36进制>-<12位hex>.<ext>`），不收 gif / svg */
export const BRAND_LOGO_URL_RE = /^\/uploads\/brand\/[0-9a-z-]+\.(png|jpg|webp)$/

/** 站名允许的字符：汉字、字母、数字、空格与 · - _ & （ ） ( ) */
export const BRAND_NAME_RE = /^[A-Za-z0-9一-龥 ·\-_&（）()]+$/

/**
 * 站名禁用词（不分大小写）：冒充官方、冒充 AI 厂商与支付机构、冒用平台名。
 * 目的是挡「ChatGPT 官方充值」「OpenAI 授权店」这类会误导买家、也会给平台招来投诉的名字。
 */
export const BRAND_NAME_BANNED = [
  '官方', '官网', '旗舰', '授权', '直营',
  'openai', 'chatgpt', 'gpt', 'claude', 'anthropic', 'gemini', 'google', '谷歌', '微软', 'microsoft', 'apple', '苹果',
  '支付宝', 'alipay', '微信支付', '财付通', '银联',
  'bigolab', '必高',
]
/** 其余文字字段的禁用词：冒充官方 / 授权（可以写 ChatGPT、Claude——那是在卖的东西） */
export const BRAND_TEXT_BANNED = ['官方', '官网', '旗舰店', '官方授权', '授权经销', '授权代理', '直营']

/** 码点长度（emoji、生僻字按一个字算） */
export function charLen(s: string): number {
  return Array.from(s).length
}

export type BrandFieldCheck = { ok: true; value: string | null } | { ok: false; error: string }

/**
 * 文字字段的格式校验（读写两端共用；写入端在 brand.ts 里另加阿里云禁发词）。
 * null / 空串 = 清空（返回 value:null）。只做格式，不做业务（是否锁定由 facade 管）。
 */
export function checkBrandTextFormat(field: BrandTextField, v: unknown): BrandFieldCheck {
  if (v === null || v === undefined) return { ok: true, value: null }
  if (typeof v !== 'string') return { ok: false, error: `${BRAND_TEXT_LIMITS[field].label}格式不正确` }
  // 折叠空白：换行、制表都变成一个空格（这些字段都是单行展示）
  const s = v.replace(/\s+/g, ' ').trim()
  if (!s) return { ok: true, value: null }
  const { min, max, label } = BRAND_TEXT_LIMITS[field]
  const n = charLen(s)
  if (n < min || n > max) return { ok: false, error: `${label}要 ${min}–${max} 个字` }
  // 控制字符、尖括号、零宽字符：这些字段会进 <title>、<meta>、邮件标题，一律不收
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f<>\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/.test(s)) return { ok: false, error: `${label}含有不允许的字符` }
  const lower = s.toLowerCase()
  // 不收网址：页面上的链接只指向本站，不能借简介把买家引去别处
  if (/https?:|www\.|\.(com|cn|net|org|top|xyz|pw|cc|io|me)\b/.test(lower)) return { ok: false, error: `${label}不能包含网址` }
  if (field === 'brandName') {
    if (!BRAND_NAME_RE.test(s)) return { ok: false, error: '网站名称只能包含汉字、字母、数字、空格和 · - _ & （ ）' }
    const hit = BRAND_NAME_BANNED.find((w) => lower.includes(w))
    if (hit) return { ok: false, error: `网站名称不能包含「${hit}」（避免冒充官方、AI 厂商或支付机构）` }
  } else {
    const hit = BRAND_TEXT_BANNED.find((w) => lower.includes(w))
    if (hit) return { ok: false, error: `${label}不能包含「${hit}」（避免让买家误以为是官方渠道）` }
  }
  return { ok: true, value: s }
}

/** 读出来的值再校验一遍：不合规按「未设置」处理（与 contact-base 同一口径） */
function readText(field: BrandTextField, v: string | null | undefined): string | null {
  const r = checkBrandTextFormat(field, v)
  return r.ok ? r.value : null
}

/** 回退规则的唯一实现（渠道行 → 店面品牌）。主站不调用它：主站直接用 PLATFORM_BRAND */
export function resolveStoreBrand(row: TenantBrandRow): StoreBrand {
  const name = readText('brandName', row.brandName)
  const logo = typeof row.brandLogoUrl === 'string' && BRAND_LOGO_URL_RE.test(row.brandLogoUrl) ? row.brandLogoUrl : null
  return {
    name: name ?? PLATFORM_BRAND_NAME,
    custom: name !== null,
    logoUrl: logo,
    intro: readText('brandIntro', row.brandIntro),
    heroTitle: readText('heroTitle', row.heroTitle),
    heroSubtitle: readText('heroSubtitle', row.heroSubtitle),
    seoTitle: readText('seoTitle', row.seoTitle),
    seoDescription: readText('seoDescription', row.seoDescription),
  }
}

/**
 * 没有 logo 的白标站用的浏览器图标：一个圆角方块写站名首字（SVG data URL，不落盘、不查库）。
 * 只取站名第一个码点并做 XML 转义；站名本身已经过 BRAND_NAME_RE（没有尖括号与引号）。
 */
export function initialIconDataUrl(name: string): string {
  const ch = (Array.from(name.trim())[0] || '店').replace(/[&<>"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#7c3aed"/><text x="32" y="44" font-size="34" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff">${ch}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
