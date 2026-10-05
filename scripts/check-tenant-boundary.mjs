#!/usr/bin/env node
/**
 * 渠道分站 · 构建期边界检查（WP8，设计 6.5.5 的 12 条规则 + 各包报告请求的补充规则）。
 *
 *   node scripts/check-tenant-boundary.mjs              # 扫当前工作区；有违规退出码 1（package.json 的 prebuild 挂的就是这条）
 *   node scripts/check-tenant-boundary.mjs --root <dir> # 扫另一棵源码树（例如 git archive 解出来的 HEAD，做基线）
 *   node scripts/check-tenant-boundary.mjs --selftest   # W8-1：在内存里给真实源码树逐类注入违规，每类都必须被拦下
 *   node scripts/check-tenant-boundary.mjs --strict     # 「待他包处理的已知例外」也按违规算（集成收尾时用）
 *   node scripts/check-tenant-boundary.mjs --doc-paths  # W8-9：设计里「改造 / 改为 / 加」语境的 src/ 路径必须在分包第 13 节有所有者
 *
 * 【为什么是纯文本扫描、不 import src/】这是运维 / 构建脚本（实施分包规则 10）：Dockerfile 里 `npm run build` 之前由
 * prebuild 自动执行，那一刻依赖可能还没生成（prisma client）、也不该让任何业务模块的副作用在构建机上跑。
 * 所以只读源码文本，靠正则 + 一个很小的词法器（去注释、识别字符串）判定。
 *
 * 【为什么要有「阳性对照」（规则 11）】正则写错一个字符就会静默变成「永远零命中」，构建照样绿。
 * 所以每次运行先拿内置样例把每条规则跑一遍，任何一条样例没命中就直接失败退出，不再往下扫。
 *
 * 【规则 16、17 属于短信接码 / 钱包的构建前检查】（docs/短信接码-设计.md §6.6 第 9 条、§6.1、§10.2）挂在同一套规则集里：
 *   16 写余额只经过 src/lib/wallet/ledger.ts（预扣行只经过 hold.ts）；17 依赖方向（wallet 是叶子、vmq.ts 对接码只用动态 import；
 *      S0 起 lib/jiema/** 不得以任何形式 import 旧单品链路 lib/herosms、lib/sms，D18、附录 B 第 6 条）；
 *   18（B1）钱包 / 充值 / 接码只在主站：买家接口每个 handler 第一句 denyOnChannel()、页面组的 layout 调 notFoundOnChannel()
 *      （设计 D11、附录 B 第 11 条、§6.6 第 20 条「把 /api/wallet/* 加进渠道 Host 必须 404 的遍历」的静态那一半；
 *      运行时那一半在 scripts/itest-tenant/cross-tenant.ts 的 T12 与 wp1.ts 的 CLOSED_API）。
 *
 * 【已知例外】EXCEPTIONS 表里每一行都写了：哪条规则、哪个文件、匹配什么、为什么、归谁处理、是临时（PENDING）还是永久（PERMANENT）。
 *   - PERMANENT：规则本身的合法用法（例如 jwt-secret.ts 里拿 'your-secret-key' 做拒绝名单）。
 *   - PENDING：违规成立、等所属包修；默认只打印 WARN 不让构建失败（否则整条发布线被一处在途改动卡死），
 *     `--strict` 时按违规算。例外不再命中任何东西时报「过期例外」并失败——修好了就必须把例外删掉，防止例外表越积越大。
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const REPO_ROOT = path.resolve(path.dirname(__filename), '..')

// ======================================================================
// 1. 词法：去注释（保留换行与长度，行号不变）、字符串内容置空（结构分析用）
// ======================================================================

const REGEX_PREV = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^'])
const REGEX_KEYWORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await'])

/**
 * 返回 { code, skel }：
 *   code = 注释换成空格的源码（字符串原样保留）——查字面量（'force-dynamic'、'USED'、'x-forwarded-host'）用；
 *   skel = 在 code 基础上再把字符串 / 模板 / 正则字面量的内容换成空格——数括号、切语句、找 `import(` 这类结构用，
 *          防止字符串里的括号、分号、关键字干扰。
 * 单双引号字符串与正则遇到换行即结束（JSX 文本里的撇号 `don't` 会被当成字符串开头，限定在一行内，损害不扩散）。
 */
export function lex(src) {
  const n = src.length
  const code = src.split('')
  const skel = src.split('')
  let i = 0
  let lastSig = '' // 上一个有意义的字符（判定 / 是除号还是正则）
  let lastWord = ''
  const blank = (arr, a, b) => {
    for (let k = a; k < b; k++) if (arr[k] !== '\n' && arr[k] !== '\r') arr[k] = ' '
  }
  const tplStack = [] // 模板字面量里 ${ 的花括号深度
  let inTpl = false
  while (i < n) {
    const c = src[i]
    const d = src[i + 1]
    if (inTpl) {
      // 模板字面量正文
      const start = i
      while (i < n) {
        if (src[i] === '\\') {
          i += 2
          continue
        }
        if (src[i] === '`') break
        if (src[i] === '$' && src[i + 1] === '{') break
        i++
      }
      blank(skel, start, i)
      if (i >= n) break
      if (src[i] === '`') {
        inTpl = false
        i++
        lastSig = '`'
        continue
      }
      // ${
      tplStack.push(0)
      inTpl = false
      i += 2
      lastSig = '{'
      continue
    }
    if (c === '/' && d === '/') {
      const start = i
      while (i < n && src[i] !== '\n') i++
      blank(code, start, i)
      blank(skel, start, i)
      continue
    }
    if (c === '/' && d === '*') {
      const start = i
      const end = src.indexOf('*/', i + 2)
      i = end < 0 ? n : end + 2
      blank(code, start, i)
      blank(skel, start, i)
      continue
    }
    if (c === "'" || c === '"') {
      const start = i
      i++
      while (i < n && src[i] !== c && src[i] !== '\n') {
        if (src[i] === '\\') i++
        i++
      }
      blank(skel, start + 1, Math.min(i, n))
      i++
      lastSig = c
      lastWord = ''
      continue
    }
    if (c === '`') {
      inTpl = true
      i++
      continue
    }
    if (c === '/') {
      const isRegex = lastSig === '' || REGEX_PREV.has(lastSig) || REGEX_KEYWORDS.has(lastWord)
      if (isRegex) {
        const start = i
        i++
        let inClass = false
        while (i < n && src[i] !== '\n') {
          if (src[i] === '\\') {
            i += 2
            continue
          }
          if (src[i] === '[') inClass = true
          else if (src[i] === ']') inClass = false
          else if (src[i] === '/' && !inClass) break
          i++
        }
        blank(skel, start + 1, Math.min(i, n))
        i++
        while (i < n && /[a-z]/i.test(src[i])) i++
        lastSig = '/'
        lastWord = ''
        continue
      }
    }
    if (tplStack.length) {
      if (c === '{') tplStack[tplStack.length - 1]++
      else if (c === '}') {
        if (tplStack[tplStack.length - 1] === 0) {
          tplStack.pop()
          inTpl = true
          i++
          continue
        }
        tplStack[tplStack.length - 1]--
      }
    }
    if (/[A-Za-z_$0-9]/.test(c)) {
      const start = i
      while (i < n && /[A-Za-z_$0-9]/.test(src[i])) i++
      lastWord = src.slice(start, i)
      lastSig = 'w'
      continue
    }
    if (!/\s/.test(c)) {
      lastSig = c
      lastWord = ''
    }
    i++
  }
  return { code: code.join(''), skel: skel.join('') }
}

function lineOf(text, idx) {
  let line = 1
  for (let k = 0; k < idx && k < text.length; k++) if (text.charCodeAt(k) === 10) line++
  return line
}

/**
 * 函数参数表收括号之后，找函数体的 {：跳过返回类型注解里的对象类型（`: Promise<{ a: T } | { b: U }>`）。
 * 判据：尖括号深度为 0、且前一个有意义字符不是 : | & , < ( 的那个 { 才是函数体。
 */
function bodyOpenAfter(skel, from) {
  let angle = 0
  let prev = ')'
  for (let k = from + 1; k < skel.length; k++) {
    const ch = skel[k]
    if (/\s/.test(ch)) continue
    if (ch === '<') angle++
    else if (ch === '>' && skel[k - 1] !== '=') angle = Math.max(0, angle - 1)
    else if (ch === '{') {
      if (angle === 0 && !':|&,<('.includes(prev)) return k
      k = matchBracket(skel, k)
      prev = '}'
      continue
    } else if (ch === '(' || ch === '[') {
      k = matchBracket(skel, k)
      prev = ch === '(' ? ')' : ']'
      continue
    }
    prev = ch
  }
  return -1
}

/** 从 openIdx（指向 ( { [ 之一）找到配对的收括号下标（在 skel 上数） */
function matchBracket(skel, openIdx) {
  const open = skel[openIdx]
  const close = open === '(' ? ')' : open === '{' ? '}' : ']'
  let depth = 0
  for (let k = openIdx; k < skel.length; k++) {
    const ch = skel[k]
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return k
    }
  }
  return skel.length - 1
}

// ======================================================================
// 2. import 解析
// ======================================================================

const IMPORT_RES = [
  /\bimport\s+(?:type\s+)?[\w*{}\s,$]+?\s+from\s*(['"])([^'"\n]+)\1/g,
  /\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*(?:as\s+\w+\s*)?from\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
  /\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
]

/** 规范化模块号：@/x → src/x；相对路径按文件目录解析；去扩展名与 /index；裸模块原样 */
function resolveSpec(fromFile, spec) {
  let p
  if (spec.startsWith('@/')) p = 'src/' + spec.slice(2)
  else if (spec.startsWith('.')) p = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec))
  else return spec
  p = p.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '').replace(/\/index$/, '')
  return p
}

function importsOf(file, code) {
  const out = []
  const seen = new Set()
  for (const re of IMPORT_RES) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(code))) {
      const key = `${m.index}:${m[2]}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ spec: m[2], mod: resolveSpec(file, m[2]), line: lineOf(code, m.index) })
    }
  }
  return out
}

/** allow 表：以 / 结尾 = 目录前缀；以 /* 结尾 = 裸模块前缀（next/*）；其余 = 精确匹配 */
function allowed(mod, list) {
  return list.some((a) => {
    if (a.endsWith('/*')) return mod.startsWith(a.slice(0, -1))
    if (a.endsWith('/')) return mod.startsWith(a)
    return mod === a
  })
}

// ======================================================================
// 3. 规则表
// ======================================================================

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const PARTNER_UI = [/^src\/app\/partner\//, /^src\/app\/api\/partner\//, /^src\/components\/partner\//]
const PARTNER_ANY = [...PARTNER_UI, /^src\/lib\/partner-handlers\//, /^src\/lib\/partner-services\//]
const inAny = (file, res) => res.some((r) => r.test(file))

const RULE1_ALLOW = [
  'src/app/partner/',
  'src/app/api/partner/',
  'src/components/partner/',
  'src/lib/partner-handlers/',
  'src/lib/tenant/partner-route',
  'src/lib/tenant/partner-page',
  'src/lib/tenant/perms',
  'src/lib/tenant/types',
  'src/lib/storefront/public',
  'src/components/storefront-provider',
  // 渠道自定义域名（docs/多渠道分销-自定义域名.md 第 4 节）：partner/layout.tsx 在非主域名上挂的跳转组件。
  // 纯客户端组件，只 import react、只读 props 里的 origin（服务端从 Tenant.origin 给），不碰任何平台能力；精确到文件，不放行整个目录
  'src/components/storefront/primary-host-redirect',
  // 二期：店面客服信息的常量 / 类型 / 格式正则（零依赖纯函数，不查库；设置页做即时格式提示用）
  'src/lib/contact-base',
  // 渠道品牌与公告：店面品牌的常量 / 类型 / 格式校验（同 contact-base：零依赖纯函数；设置页做即时格式提示用）
  'src/lib/brand-base',
  'src/lib/api',
  'src/lib/utils',
  'next/*',
  'react',
  'zod',
  'lucide-react',
  'clsx',
  'tailwind-merge',
]
const RULE2_ALLOW = [
  'src/lib/partner-handlers/',
  'src/lib/partner-services/',
  'src/lib/tenant/types',
  'src/lib/tenant/perms',
  'src/lib/tenant/math',
  // 二期：客服字段的 zod 校验（partnerContactInputSchema 等）。纯函数（zod + marketing/lint 词表），不查库、不发信
  'src/lib/contact',
  'src/lib/contact-base',
  'src/lib/api',
  'next/server',
  'zod',
  'server-only',
]
// 规则 3：tenant/public-no（公开编号的生成与形状校验，WP6 / WP7 请求）与 Node 自带 crypto（令牌哈希，与禁止的 tenant/crypto 无关）
// 按原样匹配 'crypto' / 'node:crypto'——resolveSpec 对裸模块不做任何改写，所以 '../tenant/crypto' 解析成 src/lib/tenant/crypto，不会被这两项放行
const RULE3_ALLOW = [
  'src/lib/partner-services/',
  ...['partner-facade', 'types', 'perms', 'math', 'sellable', 'customer', 'notice', 'platform-alert', 'public-names', 'public-no'].map((x) => `src/lib/tenant/${x}`),
  'src/lib/audit',
  // 二期：客服字段校验与回退规则（纯函数）。写库、上传、发信、验证码仍只能经 partner-facade
  'src/lib/contact',
  'src/lib/contact-base',
  'src/lib/stock-level',
  'src/lib/db',
  'src/lib/money',
  '@prisma/client',
  'zod',
  'server-only',
  'crypto',
  'node:crypto',
]
const RULE3_ORDER_CARDS_EXTRA = ['src/lib/cardkey']
/** 规则 3 点名禁止的（经 facade）：出现即违规，报错信息更明确 */
const RULE3_NAMED_FORBIDDEN = ['ledger', 'statement', 'balances', 'reconcile', 'buyer-notify', 'crypto', 'admin-tenants', 'supply-pricing', 'private-files'].map(
  (x) => `src/lib/tenant/${x}`,
)

const ORDER_CARDS = 'src/lib/partner-services/order-cards.ts'
const RULE7_ALLOWED_FILES = new Set(['src/lib/order/create-shop-order.ts'])
const RULE12_ALLOWED_FILES = new Set(['src/lib/order-invoice.ts', 'src/lib/order-billing.ts', 'src/app/api/admin/invoices/by-order/[externalOrderId]/route.ts'])
// 规则 8：设计 6.5.5 点名的 4 个 + 6.5.3「不复用平台 lib 里无归属校验或带额外敏感字段的函数」
const RULE8_FORBIDDEN = [
  'fulfillOrder',
  'manualComplete',
  'markPaidByAmount',
  'retryActivation',
  'invoicesByOrderIds',
  'shopOrdersForInvoices',
  'submitInvoiceForExternalOrder',
  'notifyBuyerMessage',
  'quickReplyUrl',
]

/**
 * 规则说明（id → 标题）。13 起是各包报告请求 WP8 加的补充规则。
 */
export const RULES = {
  1: 'partner 页面 / 接口 / 组件的 import 白名单',
  2: 'partner-handlers 的 import 白名单',
  3: 'partner-services 的 import 白名单、禁原生 SQL 与 include、order-cards 行范围',
  4: 'api/partner 的 route.ts 只允许 dynamic + partnerRoute(…)（invite/accept 用 inviteRoute）',
  5: 'partner 页面不得 use client，必须 requirePartnerPage（login / invite 用 requireChannelStorefrontPage）',
  6: 'api/admin 每个 handler 必须 adminGuard / requireAdmin',
  7: 'order.create 只在 create-shop-order.ts',
  8: '站长专用履约 / 票据函数不得出现在 partner 目录',
  9: '全仓缓存 / Host / x-forwarded-host / cookie Domain / 公开默认密钥 / viewas 密钥',
  10: '每个 partner 路由都登记在 scripts/itest-tenant.routes.json',
  11: '阳性对照（内置样例必须命中）',
  12: 'invoice.create / receipt.create 只在三个建票点',
  13: 'getCurrentUserUnscoped 不得出现在 src/app/api/**（WP1）',
  14: 'lib/auth 的 signToken 只能在 login / register 两个路由签发（WP1）',
  15: 'partner-services 不手写 select（只用 selects.ts 白名单，设计 6.5.3；WP7 审查）',
  16: '写余额只经过 src/lib/wallet/ledger.ts 的 postInTx、预扣行只经过 hold.ts（短信接码设计 §6.6 第 9 条）',
  17: '依赖方向：lib/wallet/** 不静态 import lib/vmq、lib/jiema；lib/vmq.ts 不静态 import lib/jiema；lib/jiema/** 不 import 旧单品链路 lib/herosms、lib/sms（短信接码设计 §6.1、D18、附录 B 第 6 条）',
  18: '钱包 / 充值 / 接码只在主站：/api/wallet/**、/api/account/wallet、/api/jiema/** 每个 handler 第一句 denyOnChannel()（不包进 try）；(shop)/wallet、(shop)/jiema 页面组的 layout 调 notFoundOnChannel()（短信接码设计 D11、附录 B 第 11 条）',
}

/**
 * 已知例外。match：在命中消息 / 命中文本里出现的子串（精确到一处，防止一条例外把同文件的新违规一起放过）。
 */
export const EXCEPTIONS = [
  {
    rule: 9,
    file: 'src/lib/jwt-secret.ts',
    match: "'your-secret-key'",
    kind: 'PERMANENT',
    owner: '—',
    why: '这是拒绝名单本身：JWT_SECRET 等于这个公开默认值时一律拒绝（P0 前置 G06），不是兜底值',
  },
  // 集成阶段（2026-09-26）已清空全部 PENDING 例外：same-origin.ts 不再读 x-forwarded-host；settings.ts 的行锁改经
  // partner-facade 的 lockTenantRowForUpdate；7 处手写 select 收进 selects.ts 的 PARTNER_INTERNAL_*（主会话 D15）。
  // 以后新增 PENDING 例外必须写明归属与移除条件；--strict 下它们按违规算。
]

// ----------------------------------------------------------------------
// 各规则的判定函数：(ctx) => [{ rule, file, line, msg, text }]
// ctx = { file, src, code, skel, all(文件表), routesJson }
// ----------------------------------------------------------------------

function hit(rule, file, code, idx, msg, text = '') {
  return { rule, file, line: idx >= 0 ? lineOf(code, idx) : 0, msg, text }
}

function ruleImports(ctx) {
  const { file, code } = ctx
  const out = []
  let rule = 0
  let allow = null
  if (inAny(file, PARTNER_UI)) {
    rule = 1
    allow = RULE1_ALLOW
  } else if (file.startsWith('src/lib/partner-handlers/')) {
    rule = 2
    allow = RULE2_ALLOW
  } else if (file.startsWith('src/lib/partner-services/')) {
    rule = 3
    allow = file === ORDER_CARDS ? [...RULE3_ALLOW, ...RULE3_ORDER_CARDS_EXTRA] : RULE3_ALLOW
  } else return out
  for (const im of importsOf(file, code)) {
    if (allowed(im.mod, allow)) continue
    const named = rule === 3 && RULE3_NAMED_FORBIDDEN.includes(im.mod) ? '（设计点名禁止，须经 partner-facade）' : ''
    out.push({ rule, file, line: im.line, msg: `import 不在白名单：'${im.spec}' → ${im.mod}${named}`, text: im.spec })
  }
  return out
}

function rule3Body(ctx) {
  const { file, code, skel } = ctx
  if (!file.startsWith('src/lib/partner-services/')) return []
  const out = []
  for (const re of [/\$(queryRaw|executeRaw)(Unsafe)?\b/g, /\binclude\s*:/g]) {
    let m
    while ((m = re.exec(skel))) out.push(hit(3, file, code, m.index, `禁止 ${m[0].replace(/\s+/g, '')}（渠道层只用 selects.ts 白名单查询）`, m[0]))
  }
  // order-cards 行范围：每个 cardKey 查询都必须带 status:'USED' 与 orderId；且本文件必须经 findTenantOrder(tenantId…) 取本渠道订单
  // （设计原文 order:{ tenantId } 因 CardKey 与 Order 无 Prisma 关系无法照字面实现，WP0 报告偏差 2 的等价写法）
  if (file === ORDER_CARDS) {
    const re = /\bcardKey\s*\.\s*(findMany|findFirst|findUnique|findFirstOrThrow|findUniqueOrThrow|count|aggregate|groupBy)\s*\(/g
    let m
    let n = 0
    while ((m = re.exec(skel))) {
      n++
      const open = m.index + m[0].length - 1
      const arg = code.slice(open, matchBracket(skel, open) + 1)
      if (!/status\s*:\s*['"]USED['"]/.test(arg) || !/\borderId\b/.test(arg)) {
        out.push(hit(3, file, code, m.index, `order-cards 的 cardKey.${m[1]} 必须同时带 status:'USED' 与 orderId（行范围）`, 'cardKey'))
      }
    }
    if (n > 0 && !/findTenantOrder\s*\(\s*tenantId\b/.test(code)) out.push(hit(3, file, code, 0, 'order-cards 必须先 findTenantOrder(tenantId, …) 取本渠道订单再查卡', 'findTenantOrder'))
  } else {
    // 除 order-cards 外，渠道层不得解密卡密（import 白名单已挡住 cardkey；这里再挡一次按名字调用）
    const m = /\bdecryptCardContent\s*\(/.exec(skel)
    if (m) out.push(hit(3, file, code, m.index, '只有 order-cards.ts 可以解密卡密', 'decryptCardContent'))
  }
  return out
}

/** 顶层语句切分（skel 上数括号；遇到深度 0 的 ; 或「换行 + 下一行是新语句开头」即断） */
function topStatements(code, skel) {
  const out = []
  let depth = 0
  let start = 0
  for (let k = 0; k < skel.length; k++) {
    const ch = skel[k]
    if (ch === '(' || ch === '{' || ch === '[') depth++
    else if (ch === ')' || ch === '}' || ch === ']') depth--
    else if (depth === 0 && (ch === ';' || ch === '\n')) {
      const piece = code.slice(start, k + 1)
      if (ch === ';' || /^\s*(export|import|const|let|var|function|async|class|type|interface|if|for|while|try|return|await|\w+\s*\()/.test(skel.slice(k + 1).replace(/^[ \t\r]*\n?/, '').slice(0, 40)) || k === skel.length - 1) {
        if (piece.trim()) out.push({ text: piece.trim(), index: start + piece.search(/\S/) })
        start = k + 1
      }
    }
  }
  const tail = code.slice(start)
  if (tail.trim()) out.push({ text: tail.trim(), index: start + tail.search(/\S/) })
  return out
}

function rule4(ctx) {
  const { file, code, skel } = ctx
  if (!/^src\/app\/api\/partner\/.*\/route\.(ts|js)$/.test(file)) return []
  const wrapper = file === 'src/app/api/partner/invite/accept/route.ts' ? 'inviteRoute' : 'partnerRoute'
  const okDynamic = /^export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]\s*;?$/
  const okHandler = new RegExp(`^export\\s+const\\s+(${HTTP_METHODS.join('|')})\\s*=\\s*${wrapper}\\s*\\([\\s\\S]*\\)\\s*;?$`)
  const out = []
  let handlers = 0
  for (const st of topStatements(code, skel)) {
    if (/^import\b/.test(st.text)) continue
    if (okDynamic.test(st.text)) continue
    if (okHandler.test(st.text)) {
      handlers++
      continue
    }
    out.push(hit(4, file, code, st.index, `route.ts 只允许 dynamic 与 ${wrapper}(…)，这里是：${st.text.slice(0, 80).replace(/\s+/g, ' ')}`, st.text.slice(0, 40)))
  }
  if (handlers === 0) out.push(hit(4, file, code, 0, `没有任何 export const <METHOD> = ${wrapper}(…)`, wrapper))
  return out
}

function rule5(ctx) {
  const { file, code } = ctx
  if (!/^src\/app\/partner\/.*page\.(tsx|ts|jsx|js)$/.test(file)) return []
  const out = []
  const directive = /^\s*(['"])use client\1/.exec(code)
  if (directive) out.push(hit(5, file, code, directive.index, "partner 页面不得 'use client'（守卫必须在服务端执行）", 'use client'))
  const exceptions = new Set(['src/app/partner/login/page.tsx', 'src/app/partner/invite/[token]/page.tsx'])
  const need = exceptions.has(file) ? 'requireChannelStorefrontPage' : 'requirePartnerPage'
  if (!new RegExp(`\\b${need}\\s*\\(`).test(code)) out.push(hit(5, file, code, 0, `partner 页面必须调用 ${need}(…)`, need))
  return out
}

/** 取出 route.ts 里每个导出的 HTTP handler 的源码片段（函数体或赋值表达式） */
function exportedHandlers(code, skel) {
  const out = []
  const reFn = new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+(${HTTP_METHODS.join('|')})\\s*\\(`, 'g')
  let m
  while ((m = reFn.exec(skel))) {
    const pOpen = m.index + m[0].length - 1
    const pClose = matchBracket(skel, pOpen)
    const bOpen = bodyOpenAfter(skel, pClose)
    const bClose = bOpen < 0 ? skel.length - 1 : matchBracket(skel, bOpen)
    out.push({ method: m[1], index: m.index, body: code.slice(m.index, bClose + 1) })
  }
  const reConst = new RegExp(`\\bexport\\s+const\\s+(${HTTP_METHODS.join('|')})\\s*(?::[^=]+)?=`, 'g')
  while ((m = reConst.exec(skel))) {
    let depth = 0
    let k = m.index + m[0].length
    for (; k < skel.length; k++) {
      const ch = skel[k]
      if (ch === '(' || ch === '{' || ch === '[') depth++
      else if (ch === ')' || ch === '}' || ch === ']') depth--
      else if (depth === 0 && (ch === ';' || (ch === '\n' && /^\s*(export|import|const|async|function)\b/.test(skel.slice(k + 1, k + 40))))) break
    }
    out.push({ method: m[1], index: m.index, body: code.slice(m.index, k) })
  }
  return out
}

/** 同文件内一层间接：handler 体里调用的本地函数（function x / const x =）若含守卫也算 */
function localFunctionBodies(code, skel) {
  const map = new Map()
  const re = /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/g
  let m
  while ((m = re.exec(skel))) {
    const name = m[1] || m[2]
    const bOpen = skel.indexOf('{', m.index + m[0].length - (m[1] ? 1 : 0))
    if (bOpen < 0) continue
    const bClose = matchBracket(skel, bOpen)
    map.set(name, code.slice(m.index, bClose + 1))
  }
  return map
}

function rule6(ctx) {
  const { file, code, skel, guardAliases } = ctx
  if (!/^src\/app\/api\/admin\/.*\/?route\.(ts|js)$/.test(file)) return []
  const guards = ['adminGuard', 'requireAdmin', ...guardAliases]
  const guardRe = new RegExp(`\\b(${guards.join('|')})\\s*\\(`)
  const locals = localFunctionBodies(code, skel)
  const out = []
  // `export { handler as GET }` 这类写法这里切不出函数体，一律要求改成直接导出（否则守卫核对会静默跳过）
  const reExportList = new RegExp(`\\bexport\\s*\\{[^}]*\\b(${HTTP_METHODS.join('|')})\\b[^}]*\\}`, 'g')
  let em
  while ((em = reExportList.exec(skel))) out.push(hit(6, file, code, em.index, `${em[1]} 用 export { … } 导出，无法核对守卫；请改成 export async function ${em[1]}`, em[1]))
  const hs = exportedHandlers(code, skel)
  for (const h of hs) {
    if (guardRe.test(h.body)) continue
    // 一层间接
    const called = Array.from(h.body.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)).map((x) => x[1])
    if (called.some((c) => locals.has(c) && guardRe.test(locals.get(c)))) continue
    out.push(hit(6, file, code, h.index, `${h.method} 没有 adminGuard( / requireAdmin(`, h.method))
  }
  return out
}

function ruleRegexAll(rule, re, msg) {
  return (ctx) => {
    const out = []
    re.lastIndex = 0
    let m
    while ((m = re.exec(ctx.skel))) out.push(hit(rule, ctx.file, ctx.code, m.index, msg(m), m[0]))
    return out
  }
}

function rule7(ctx) {
  if (RULE7_ALLOWED_FILES.has(ctx.file)) return []
  return ruleRegexAll(7, /\border\s*\.\s*(create|createMany|upsert)\s*\(/g, (m) => `order.${m[1]}( 只允许在 src/lib/order/create-shop-order.ts（唯一建单点，快照与租户在那里写）`)(ctx)
}

function rule8(ctx) {
  if (!inAny(ctx.file, PARTNER_ANY)) return []
  return ruleRegexAll(8, new RegExp(`\\b(${RULE8_FORBIDDEN.join('|')})\\b`, 'g'), (m) => `${m[1]} 是站长专用函数，不得出现在 partner 目录`)(ctx)
}

function rule9(ctx) {
  const { file, code, skel } = ctx
  const out = []
  const push = (re, msg, onCode = false) => {
    re.lastIndex = 0
    let m
    while ((m = re.exec(onCode ? code : skel))) out.push(hit(9, file, code, m.index, typeof msg === 'function' ? msg(m) : msg, m[0]))
  }
  push(/(['"])force-static\1/g, "禁止 'force-static'（会把按店面渲染的页面固化成一份发给所有 Host）", true)
  push(/\bexport\s+const\s+revalidate\b/g, '禁止 export const revalidate（ISR 缓存不带店面）')
  push(/\bgenerateStaticParams\b/g, '禁止 generateStaticParams（构建期静态化）')
  if (file !== 'src/lib/storefront/cache.ts') push(/\bunstable_cache\b/g, 'unstable_cache 只能在 src/lib/storefront/cache.ts（缓存键必须带 sfId）')
  push(/\bnextUrl\s*\.\s*(host|hostname|origin)\b/g, (m) => `禁止 nextUrl.${m[1]}（standalone 下是 0.0.0.0:3000；店面只认 host 头）`)
  push(/x-forwarded-host/gi, '禁止读取 x-forwarded-host（不可信；nginx 已置空）', true)
  push(/(['"])your-secret-key\1/g, "禁止公开默认密钥 'your-secret-key'", true)
  if (file !== 'src/lib/tenant/view-as.ts') push(/\bderiveKey\s*\(\s*(['"])viewas\1/g, "deriveKey('viewas') 只允许在 src/lib/tenant/view-as.ts", true)
  // cookie Domain：只看 cookie 设置语句附近（该行起 10 行）里的 domain:，营销模块普通对象键 domain: 不误报
  const lines = code.split('\n')
  const skelLines = skel.split('\n')
  for (let i = 0; i < skelLines.length; i++) {
    if (!/cookies\s*\(\s*\)\s*\.\s*set\s*\(|\.cookies\s*\.\s*set\s*\(|\bauthCookieOptions\b/.test(skelLines[i])) continue
    for (let j = i; j < Math.min(i + 11, skelLines.length); j++) {
      if (/\bdomain\s*:/.test(skelLines[j])) {
        out.push({ rule: 9, file, line: j + 1, msg: 'cookie 不得设置 Domain（两站 host-only 各自登录，设计 4.6 C1）', text: lines[j].trim().slice(0, 60) })
        break
      }
    }
  }
  return out
}

function rule12(ctx) {
  if (RULE12_ALLOWED_FILES.has(ctx.file)) return []
  return ruleRegexAll(12, /\b(invoice|receipt)\s*\.\s*(create|createMany|upsert)\s*\(/g, (m) => `${m[1]}.${m[2]}( 只允许在三个建票点（新增建票点必须同时写 tenantId / shopOrderId，设计 5.5）`)(ctx)
}

function rule13(ctx) {
  if (!ctx.file.startsWith('src/app/api/')) return []
  return ruleRegexAll(13, /\bgetCurrentUserUnscoped\b/g, () => 'getCurrentUserUnscoped 不按店面校验 aud，路由里一律用 getCurrentUser()')(ctx)
}

const SIGN_TOKEN_FILES = new Set(['src/app/api/auth/login/route.ts', 'src/app/api/auth/register/route.ts'])
function rule14(ctx) {
  const { file, code } = ctx
  if (SIGN_TOKEN_FILES.has(file) || file === 'src/lib/auth.ts') return []
  const out = []
  for (const im of importsOf(file, code)) {
    if (im.mod !== 'src/lib/auth') continue
    // 找到这条 import 语句里的具名列表
    const stmt = code.split('\n').slice(im.line - 1, im.line + 8).join('\n')
    const m = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"][^'"]*auth['"]/.exec(stmt)
    if (m && /\bsignToken\b/.test(m[1])) out.push({ rule: 14, file, line: im.line, msg: 'signToken 只允许 login / register 两个路由签发（设计 4.6 C3）', text: 'signToken' })
  }
  return out
}

function rule15(ctx) {
  const { file, code, skel } = ctx
  if (!file.startsWith('src/lib/partner-services/') || file === 'src/lib/partner-services/selects.ts') return []
  const out = []
  let m
  // const X = { a: true, … } [as const] [satisfies Prisma.*Select]：对象体里有「键: true」且（名字以 SELECT 结尾或带 satisfies …Select）。
  // 只由白名单常量展开拼成的（{ ...PARTNER_X, ...PARTNER_INTERNAL_Y }）不算手写
  const reConst = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g
  while ((m = reConst.exec(skel))) {
    const open = m.index + m[0].length - 1
    const close = matchBracket(skel, open)
    const body = code.slice(open, close + 1)
    const after = skel.slice(close + 1, close + 80)
    const isSelect = /SELECT$/i.test(m[1]) || /^\s*(as\s+const\s+)?satisfies\s+Prisma\.\w+Select\b/.test(after)
    if (isSelect && /[\w$]\s*:\s*true\b/.test(body)) out.push(hit(15, file, code, m.index, `手写 select 常量 ${m[1]}（应收进 selects.ts 的 PARTNER_INTERNAL_* 并引用）`, m[1]))
  }
  const reInline = /\bselect\s*:\s*\{/g
  while ((m = reInline.exec(skel))) {
    const open = m.index + m[0].length - 1
    const body = code.slice(open, matchBracket(skel, open) + 1)
    if (/:\s*true\b/.test(body)) out.push(hit(15, file, code, m.index, `手写内联 select ${body.replace(/\s+/g, ' ').slice(0, 60)}（应引用 selects.ts）`, `select: ${body.replace(/\s+/g, ' ').slice(0, 40)}`))
  }
  return out
}

// ----------------------------------------------------------------------
// 规则 16：写余额只经过 ledger（docs/短信接码-设计.md 附录 B 第 14 条：调用方另写 UPDATE users 就是双扣）
// ----------------------------------------------------------------------
const LEDGER_FILE = 'src/lib/wallet/ledger.ts'
const HOLD_FILE = 'src/lib/wallet/hold.ts'
function rule16(ctx) {
  const { file, code, skel } = ctx
  if (!file.startsWith('src/')) return []
  const out = []
  const push = (re, msg, onCode = false) => {
    re.lastIndex = 0
    let m
    while ((m = re.exec(onCode ? code : skel))) out.push(hit(16, file, code, m.index, typeof msg === 'function' ? msg(m) : msg, m[0]))
  }
  if (file !== LEDGER_FILE) {
    // (a)(b) 设计原文点名的两种写法：topupCents 写成对象（increment / decrement / set…）、balance 的 increment / decrement
    push(/\btopupCents\s*:\s*\{/g, 'topupCents: { … } 只允许在 src/lib/wallet/ledger.ts（写余额只经 postInTx）')
    push(/\bbalance\s*:\s*\{\s*(increment|decrement)\b/g, (m) => `balance: { ${m[1]} } 只允许在 src/lib/wallet/ledger.ts（写余额只经 postInTx）`)
    // (c) user 的写调用里出现 balance / topupCents 键（值不是 true/false，排除 select）
    const reUser = /\buser\s*\.\s*(update|updateMany|upsert|create|createMany)\s*\(/g
    let m
    while ((m = reUser.exec(skel))) {
      const open = m.index + m[0].length - 1
      const arg = skel.slice(open, matchBracket(skel, open) + 1)
      if (/\b(balance|topupCents)\s*:(?!\s*(?:true|false)\b)/.test(arg)) out.push(hit(16, file, code, m.index, `user.${m[1]}( 里写了 balance / topupCents：写余额只经 src/lib/wallet/ledger.ts 的 postInTx`, `user.${m[1]}`))
    }
    // (d) 流水表的任何写调用
    push(/\bbalanceLog\s*\.\s*(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g, (m) => `balanceLog.${m[1]}( 只允许在 src/lib/wallet/ledger.ts（一事件一行一个 bizKey）`)
    // (e) 原生 SQL 写 users / 流水 / 预扣（查 code：字符串保留、注释已去掉；原生 SQL 查不出来的双扣最危险）
    push(/\bUPDATE\s+`?(users|balance_logs|balance_holds)`?\s/gi, (m) => `原生 SQL「UPDATE ${m[1]}」只允许经 src/lib/wallet/ledger.ts / hold.ts`, true)
    push(/\b(INSERT\s+(?:IGNORE\s+)?INTO|DELETE\s+FROM|REPLACE\s+INTO)\s+`?(balance_logs|balance_holds)`?/gi, (m) => `原生 SQL 写 ${m[2]} 只允许经 src/lib/wallet/ledger.ts / hold.ts`, true)
  }
  if (file !== HOLD_FILE) {
    push(/\bbalanceHold\s*\.\s*(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/g, (m) => `balanceHold.${m[1]}( 只允许在 src/lib/wallet/hold.ts（预扣状态 CAS 与记账同一事务）`)
  }
  return out
}

// ----------------------------------------------------------------------
// 规则 17：依赖方向（防循环依赖：冷启动时偶发「fulfillOrder is not a function」，§6.1）
// ----------------------------------------------------------------------
const STATIC_IMPORT_RES = [IMPORT_RES[0], IMPORT_RES[1], IMPORT_RES[2], IMPORT_RES[4]]
function staticImportsOf(file, code) {
  const out = []
  for (const re of STATIC_IMPORT_RES) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(code))) out.push({ spec: m[2], mod: resolveSpec(file, m[2]), line: lineOf(code, m.index) })
  }
  return out
}
/** 任何形式的 import（静态、动态、require）：新接码引擎连动态引用旧链路都不行 */
function allImportsOf(file, code) {
  const out = []
  for (const re of IMPORT_RES) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(code))) out.push({ spec: m[2], mod: resolveSpec(file, m[2]), line: lineOf(code, m.index) })
  }
  return out
}
const LEGACY_SMS_MODS = new Set(['src/lib/herosms', 'src/lib/sms'])
function rule17(ctx) {
  const { file, code } = ctx
  const inWallet = file.startsWith('src/lib/wallet/')
  const isVmq = file === 'src/lib/vmq.ts'
  const inJiema = file.startsWith('src/lib/jiema/')
  if (!inWallet && !isVmq && !inJiema) return []
  const isJiema = (mod) => mod === 'src/lib/jiema' || mod.startsWith('src/lib/jiema/')
  const out = []
  if (inJiema) {
    // S0：新板块有自己的上游客户端（jiema/upstream.ts）；旧 Codex / Claude 单品的 herosms.ts / sms.ts 零改动、也不被新引擎引用（D18、附录 B 第 6 条）
    for (const im of allImportsOf(file, code)) {
      if (LEGACY_SMS_MODS.has(im.mod)) out.push({ rule: 17, file, line: im.line, msg: `lib/jiema 不得引用旧单品链路 '${im.spec}'（${im.mod}；新板块用 jiema/upstream.ts，旧链路零改动）`, text: im.spec })
    }
    return out
  }
  for (const im of staticImportsOf(file, code)) {
    if (inWallet && (im.mod === 'src/lib/vmq' || isJiema(im.mod))) {
      out.push({ rule: 17, file, line: im.line, msg: `lib/wallet 是叶子，不得静态 import '${im.spec}'（${im.mod}）`, text: im.spec })
    }
    if (isVmq && isJiema(im.mod)) out.push({ rule: 17, file, line: im.line, msg: `lib/vmq.ts 对接码引擎只能动态 import（await import('./jiema/…')），这里是静态 import '${im.spec}'`, text: im.spec })
  }
  return out
}

// ----------------------------------------------------------------------
// 规则 18：钱包 / 充值 / 接码只在主站（D11、附录 B 第 11 条）
// 买家接口：每个导出的 handler 里必须调用 denyOnChannel(，而且出现在第一个 try { 之前（不包进 try：包进去的话店面解析出错会被
// catch 吞掉，按主站继续）。页面：这两个页面组的 layout 必须调 notFoundOnChannel(（整组页面在渠道 Host 404）。
// ----------------------------------------------------------------------
const RULE18_ROUTE_RE = /^src\/app\/api\/(wallet|jiema)\/(.*\/)?route\.(ts|js)$|^src\/app\/api\/account\/wallet\/route\.(ts|js)$/
const RULE18_PAGE_RE = /^src\/app\/\(shop\)\/(wallet|jiema)(\/.*)?\/page\.(tsx|ts|jsx|js)$/
function rule18(ctx) {
  const { file, code, skel } = ctx
  if (!RULE18_ROUTE_RE.test(file)) return []
  const out = []
  const hs = exportedHandlers(code, skel)
  if (!hs.length) out.push(hit(18, file, code, 0, '钱包 / 接码买家接口没有可核对的导出 handler（请用 export async function GET/POST…）', 'handler'))
  for (const h of hs) {
    const hSkel = lex(h.body).skel
    const d = hSkel.search(/\bdenyOnChannel\s*\(/)
    const t = hSkel.search(/\btry\s*\{/)
    if (d < 0) out.push(hit(18, file, code, h.index, `${h.method} 没有调用 denyOnChannel()（渠道 Host 必须 404）`, h.method))
    else if (t >= 0 && t < d) out.push(hit(18, file, code, h.index, `${h.method} 的 denyOnChannel() 包进了 try（店面解析出错会被吞掉），要放在 try 之前`, h.method))
  }
  return out
}
function rule18Tree(files) {
  const out = []
  const groups = new Set()
  for (const f of files.keys()) {
    const m = RULE18_PAGE_RE.exec(f)
    if (m) groups.add(m[1])
  }
  for (const g of groups) {
    const layout = [`src/app/(shop)/${g}/layout.tsx`, `src/app/(shop)/${g}/layout.ts`].find((x) => files.has(x))
    if (!layout) {
      out.push({ rule: 18, file: `src/app/(shop)/${g}`, line: 0, msg: `页面组 (shop)/${g} 没有 layout.tsx（必须在 layout 里调 notFoundOnChannel()，渠道 Host 整组 404）`, text: g })
      continue
    }
    const { code, skel } = lex(files.get(layout))
    const d = skel.search(/\bnotFoundOnChannel\s*\(/)
    const t = skel.search(/\btry\s*\{/)
    if (d < 0) out.push(hit(18, layout, code, 0, `${layout} 没有调用 notFoundOnChannel()（渠道 Host 必须 404）`, 'notFoundOnChannel'))
    else if (t >= 0 && t < d) out.push(hit(18, layout, code, d, `${layout} 的 notFoundOnChannel() 包进了 try`, 'notFoundOnChannel'))
  }
  return out
}

const PER_FILE_RULES = [ruleImports, rule3Body, rule4, rule5, rule6, rule7, rule8, rule9, rule12, rule13, rule14, rule15, rule16, rule17, rule18]

// 规则 10：partner 路由都要登记
function partnerRoutesOf(files) {
  const routes = []
  for (const [file, src] of files) {
    const m = /^src\/app\/(api\/partner\/.*)\/route\.(ts|js)$/.exec(file)
    if (!m) continue
    const { code, skel } = lex(src)
    const methods = new Set()
    for (const h of exportedHandlers(code, skel)) methods.add(h.method)
    for (const meth of methods) routes.push({ method: meth, path: '/' + m[1], file })
  }
  return routes
}

function rule10(files, routesJsonText) {
  const out = []
  let reg = []
  try {
    reg = JSON.parse(routesJsonText ?? 'null')?.routes ?? null
  } catch {
    reg = null
  }
  if (!Array.isArray(reg)) {
    out.push({ rule: 10, file: 'scripts/itest-tenant.routes.json', line: 0, msg: '路由总表缺失或不是合法 JSON（先跑 node scripts/itest-tenant/merge-routes.mjs）', text: 'routes.json' })
    return out
  }
  const set = new Set(reg.map((r) => `${String(r.method).toUpperCase()} ${r.path}`))
  for (const r of partnerRoutesOf(files)) {
    if (!set.has(`${r.method} ${r.path}`)) out.push({ rule: 10, file: r.file, line: 0, msg: `partner 路由 ${r.method} ${r.path} 未登记在 scripts/itest-tenant.routes.json`, text: `${r.method} ${r.path}` })
  }
  return out
}

/** 规则 6 的等价守卫：在 src/lib/** 里导出、且函数体里调用了 adminGuard( / requireAdmin( 的函数（逐个核对，不信名字） */
function guardAliasesOf(files) {
  const out = []
  const src = files.get('src/lib/admin/source-site.ts')
  if (!src) return out
  const { code, skel } = lex(src)
  const re = /\bexport\s+async\s+function\s+(adminOrResponse)\s*\(/g
  let m
  while ((m = re.exec(skel))) {
    const pClose = matchBracket(skel, m.index + m[0].length - 1)
    const bOpen = bodyOpenAfter(skel, pClose)
    if (bOpen < 0) continue
    const body = code.slice(bOpen, matchBracket(skel, bOpen) + 1)
    if (/\b(requireAdmin|adminGuard)\s*\(/.test(body)) out.push(m[1])
  }
  return out
}

// ======================================================================
// 4. 扫描
// ======================================================================

const EXTS = /\.(ts|tsx|js|jsx|mjs|cjs)$/

function walk(root, rel, out) {
  const abs = path.join(root, rel)
  let ents
  try {
    ents = fs.readdirSync(abs, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of ents) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue
      walk(root, r, out)
    } else if (EXTS.test(e.name)) out.push(r)
  }
}

/** 读一棵树（overlay: { relPath: string | null } 覆盖或删除，给自测注入违规用） */
export function loadTree(root, overlay = {}) {
  const list = []
  walk(root, 'src', list)
  const files = new Map()
  for (const f of list) files.set(f, fs.readFileSync(path.join(root, f), 'utf8'))
  let routesJson = null
  try {
    routesJson = fs.readFileSync(path.join(root, 'scripts/itest-tenant.routes.json'), 'utf8')
  } catch {
    routesJson = null
  }
  for (const [k, v] of Object.entries(overlay)) {
    if (k === 'scripts/itest-tenant.routes.json') routesJson = v
    else if (v === null) files.delete(k)
    else files.set(k, v)
  }
  return { files, routesJson }
}

export function scan({ files, routesJson }) {
  const guardAliases = guardAliasesOf(files)
  const hits = []
  for (const [file, src] of files) {
    const { code, skel } = lex(src)
    const ctx = { file, src, code, skel, guardAliases }
    for (const r of PER_FILE_RULES) hits.push(...r(ctx))
  }
  hits.push(...rule10(files, routesJson))
  hits.push(...rule18Tree(files))
  // 例外归类
  const used = new Set()
  const violations = []
  const pending = []
  const permanent = []
  for (const h of hits) {
    const ex = EXCEPTIONS.findIndex((e) => e.rule === h.rule && e.file === h.file && (h.text.includes(e.match) || h.msg.includes(e.match)))
    if (ex < 0) violations.push(h)
    else {
      used.add(ex)
      ;(EXCEPTIONS[ex].kind === 'PERMANENT' ? permanent : pending).push({ ...h, exception: EXCEPTIONS[ex] })
    }
  }
  const stale = EXCEPTIONS.filter((e, i) => !used.has(i) && files.has(e.file))
  const counts = {}
  for (const id of Object.keys(RULES)) counts[id] = 0
  for (const h of hits) counts[h.rule] = (counts[h.rule] || 0) + 1
  return { fileCount: files.size, hits, violations, pending, permanent, stale, counts }
}

// ======================================================================
// 5. 阳性对照（规则 11）：内置样例逐条必须命中；另有一组「不得命中」的阴性样例防误报
// ======================================================================

const POSITIVE = [
  { rule: 1, file: 'src/app/partner/orders/page.tsx', src: "import { prisma } from '@/lib/db'\nimport { requirePartnerPage } from '@/lib/tenant/partner-page'\nexport default async function P(){ await requirePartnerPage('order.read'); return null }" },
  { rule: 1, file: 'src/components/partner/x/y.tsx', src: "import { getStorefront } from '../../../lib/storefront/resolve'\nexport const a = 1" },
  { rule: 2, file: 'src/lib/partner-handlers/x.ts', src: "import { setListingAdmin } from '../tenant/supply-pricing'\nexport const a = 1" },
  { rule: 3, file: 'src/lib/partner-services/x.ts', src: "import { applyRefund } from '../tenant/ledger'\nexport const a = 1" },
  { rule: 3, file: 'src/lib/partner-services/x.ts', src: "import { sealText } from '../tenant/crypto'\nexport const a = 1" },
  { rule: 3, file: 'src/lib/partner-services/x.ts', src: 'export async function f(tx){ return tx.$queryRaw`SELECT 1` }' },
  { rule: 3, file: 'src/lib/partner-services/x.ts', src: 'export async function f(p){ return p.order.findMany({ where: { tenantId: 2 }, include: { user: true } }) }' },
  { rule: 3, file: 'src/lib/partner-services/order-cards.ts', src: "import { findTenantOrder } from './_scope'\nexport async function f(tenantId){ await findTenantOrder(tenantId, 'x', {}); return prisma.cardKey.findMany({ where: { orderId: 1 } }) }" },
  { rule: 4, file: 'src/app/api/partner/x/route.ts', src: "import { NextResponse } from 'next/server'\nexport async function GET(){ return NextResponse.json({}) }" },
  { rule: 4, file: 'src/app/api/partner/x/route.ts', src: "export const dynamic = 'force-dynamic'\nexport const GET = partnerRoute('a', h)\nexport const helper = 1" },
  { rule: 5, file: 'src/app/partner/x/page.tsx', src: "'use client'\nexport default function P(){ requirePartnerPage('x'); return null }" },
  { rule: 5, file: 'src/app/partner/login/page.tsx', src: 'export default async function P(){ return null }' },
  { rule: 6, file: 'src/app/api/admin/x/route.ts', src: "import { prisma } from '@/lib/db'\nexport async function GET(){ return Response.json(await prisma.user.findMany()) }" },
  { rule: 7, file: 'src/app/api/orders/x/route.ts', src: 'export async function POST(){ await tx.order.create({ data: {} }) }' },
  { rule: 8, file: 'src/lib/partner-handlers/x.ts', src: "import { fulfillOrder } from '../vmq'\nexport const a = fulfillOrder" },
  { rule: 9, file: 'src/app/x/page.tsx', src: "export const dynamic = 'force-static'\nexport default function P(){ return null }" },
  { rule: 9, file: 'src/app/x/page.tsx', src: 'export const revalidate = 60' },
  { rule: 9, file: 'src/app/x/route.ts', src: "export function GET(req){ return new Response(req.headers.get('x-forwarded-host')) }" },
  { rule: 9, file: 'src/app/x/route.ts', src: "export function GET(req){ return new Response(req.nextUrl.host) }" },
  { rule: 9, file: 'src/app/x/route.ts', src: "export function POST(){ const r = new Response(''); r.cookies.set('token', 't', {\n  httpOnly: true,\n  domain: '.bigolab.com',\n}); return r }" },
  { rule: 9, file: 'src/lib/x.ts', src: "const s = process.env.JWT_SECRET || 'your-secret-key'" },
  { rule: 9, file: 'src/lib/x.ts', src: "import { unstable_cache } from 'next/cache'\nexport const f = unstable_cache(async () => 1)" },
  { rule: 12, file: 'src/lib/x.ts', src: 'export async function f(){ await prisma.invoice.create({ data: {} }) }' },
  { rule: 12, file: 'src/lib/x.ts', src: 'export async function f(tx){ await tx.receipt.create({ data: {} }) }' },
  { rule: 13, file: 'src/app/api/x/route.ts', src: "import { getCurrentUserUnscoped } from '@/lib/auth'\nexport async function GET(){ return Response.json(await getCurrentUserUnscoped()) }" },
  { rule: 14, file: 'src/app/api/x/route.ts', src: "import { signToken, getCurrentUser } from '@/lib/auth'\nexport async function POST(){ return Response.json(signToken({}, {})) }" },
  { rule: 15, file: 'src/lib/partner-services/x.ts', src: 'const X_SELECT = { cost: true } as const satisfies Prisma.CardKeySelect\nexport const f = () => prisma.cardKey.findMany({ select: { cost: true } })' },
  { rule: 16, file: 'src/lib/referral.ts', src: 'export async function f(tx){ await tx.user.update({ where: { id: 1 }, data: { balance: { increment: 5 } } }) }' },
  { rule: 16, file: 'src/app/api/x/route.ts', src: 'export async function f(tx){ await tx.user.updateMany({ where: { id: 1 }, data: { topupCents: { decrement: 5 } } }) }' },
  { rule: 16, file: 'src/lib/x.ts', src: 'export async function f(tx){ await tx.user.update({ where: { id: 1 }, data: { balance: 0 } }) }' },
  { rule: 16, file: 'src/lib/x.ts', src: "export async function f(tx){ await tx.balanceLog.create({ data: { userId: 1, delta: 1, balanceAfter: 1, type: 'ADJUST' } }) }" },
  { rule: 16, file: 'src/lib/x.ts', src: 'export async function f(tx){ await tx.$executeRaw`UPDATE users SET topup_cents = topup_cents + 1 WHERE id = 1` }' },
  { rule: 16, file: 'src/lib/x.ts', src: "export async function f(tx){ await tx.$executeRawUnsafe('INSERT INTO balance_logs (user_id) VALUES (1)') }" },
  { rule: 16, file: 'src/lib/wallet/dto.ts', src: "export async function f(tx){ await tx.balanceHold.updateMany({ where: { orderId: 1 }, data: { state: 'RELEASED' } }) }" },
  { rule: 17, file: 'src/lib/wallet/topup.ts', src: "import { fulfillOrder } from '../vmq'\nexport const a = fulfillOrder" },
  { rule: 17, file: 'src/lib/wallet/x.ts', src: "import { onPaid } from '@/lib/jiema/engine'\nexport const a = onPaid" },
  { rule: 17, file: 'src/lib/vmq.ts', src: "import { onPaid } from './jiema/engine'\nexport const a = onPaid" },
  { rule: 17, file: 'src/lib/jiema/engine.ts', src: "import { getNumber } from '../herosms'\nexport const a = getNumber" },
  { rule: 17, file: 'src/lib/jiema/x.ts', src: "export async function f(){ const { acquireForOrder } = await import('@/lib/sms'); return acquireForOrder }" },
  { rule: 18, file: 'src/app/api/wallet/topup/route.ts', src: 'export async function GET(){ const u = await getCurrentUser(); return Response.json(u) }' },
  { rule: 18, file: 'src/app/api/jiema/orders/route.ts', src: 'export async function POST(){ try { const d = await denyOnChannel(); if (d) return d } catch {} return new Response(null) }' },
  { rule: 18, file: 'src/app/(shop)/wallet/topup/page.tsx', src: 'export default function P(){ return null }' },
]

/** 阴性样例：合法写法不得命中（营销模块的 domain: 对象键、注释里的违规字样、字符串里的括号、tenant/public-no 与 node:crypto 放行等） */
const NEGATIVE = [
  { file: 'src/lib/marketing/audience.ts', src: "const stats = { domain: 'qq.com', count: 3 }\nexport const x = stats" },
  { file: 'src/lib/marketing/sync.ts', src: "res.cookies.set('a', 'b', { httpOnly: true })\n" + '\n'.repeat(12) + "const row = { domain: 'x.com' }" },
  { file: 'src/lib/x.ts', src: "// 以前是 'your-secret-key'，x-forwarded-host 也读过\n/* export const revalidate = 1 */\nexport const a = 1" },
  { file: 'src/lib/partner-services/y.ts', src: "import { createHash } from 'node:crypto'\nimport { randomBytes } from 'crypto'\nimport { parsePublicNo } from '../tenant/public-no'\nimport { PARTNER_ORDER_LIST_SELECT } from './selects'\nexport const f = () => prisma.order.findMany({ where: { tenantId: 2 }, select: PARTNER_ORDER_LIST_SELECT })" },
  { file: 'src/app/api/partner/y/route.ts', src: "export const dynamic = 'force-dynamic'\n\nimport { partnerRoute } from '@/lib/tenant/partner-route'\nimport { h } from '@/lib/partner-handlers/orders'\n\nexport const GET = partnerRoute('order.read', h, { readOnlySafe: true })\nexport const POST = partnerRoute('order.message', h, {\n  rate: { key: 'k', max: 30, windowMs: 60_000 },\n})\n" },
  { file: 'src/app/api/admin/y/route.ts', src: "export async function GET(req: Request) {\n  const g = await adminGuard(req)\n  if (g) return g\n  return Response.json({ a: '(' })\n}\nexport const PATCH = async (req: Request) => { await requireAdmin(); return new Response(null) }" },
  { file: 'src/app/x/page.tsx', src: "export default function P(){ return <div className=\"a\">don't / 50% </div> }" },
  { file: 'src/lib/tenant/supply-pricing.ts', src: 'function signToken(b){ return b }\nexport const t = signToken(1)' },
  // 规则 16：ledger.ts 本身可以写；读余额（select / where 的布尔、groupBy 的 _sum）不算写；「FOR UPDATE」不是 UPDATE users
  { file: 'src/lib/wallet/ledger.ts', src: 'export async function f(tx, w, d){ w.topupCents = { gte: 1 }; await tx.user.updateMany({ where: w, data: { balance: { increment: 1 } } }); await tx.balanceLog.create({ data: {} }) }' },
  { file: 'src/lib/wallet/hold.ts', src: 'export async function f(tx, id){ await tx.$queryRaw`SELECT id FROM balance_holds WHERE order_id = ${id} FOR UPDATE`; await tx.balanceHold.create({ data: { topupCents: 1 } }) }' },
  { file: 'src/app/api/x/route.ts', src: 'export async function f(tx){ await tx.user.update({ where: { id: 1 }, data: { nickname: null }, select: { balance: true, topupCents: true } }); return tx.balanceLog.groupBy({ by: ["type"], _sum: { topupDeltaCents: true } }) }' },
  // 规则 17：vmq.ts 动态 import 接码引擎是规定写法；wallet 引用 db / money 正常
  { file: 'src/lib/vmq.ts', src: "export async function after(id){ const { onPaid } = await import('./jiema/engine'); return onPaid(id) }" },
  { file: 'src/lib/wallet/ledger.ts', src: "import { prisma } from '../db'\nimport { toCents } from '../money'\nexport const a = [prisma, toCents]" },
  // 规则 17：jiema 引用自己的 parse / upstream、引用 vmq 都正常；sms-view 这类名字不是旧链路
  { file: 'src/lib/jiema/upstream.ts', src: "import { parseBalance } from './parse'\nimport { fulfillOrder } from '../vmq'\nimport { x } from './sms-view'\nexport const a = [parseBalance, fulfillOrder, x]" },
  // 规则 18：第一句 denyOnChannel、之后才 try —— 合法
  { file: 'src/app/api/wallet/topup/[orderNo]/route.ts', src: 'export async function GET(){\n  const d = await denyOnChannel()\n  if (d) return d\n  try { return Response.json({}) } catch { return new Response(null) }\n}' },
]

export function selfCheck() {
  const problems = []
  for (const s of POSITIVE) {
    const files = new Map([[s.file, s.src]])
    const r = scan({ files, routesJson: '{"routes":[]}' })
    if (!r.hits.some((h) => h.rule === s.rule)) problems.push(`规则 ${s.rule} 的阳性样例没有命中：${s.file}`)
  }
  for (const s of NEGATIVE) {
    const files = new Map([[s.file, s.src]])
    const r = scan({ files, routesJson: JSON.stringify({ routes: [{ method: 'GET', path: '/api/partner/y' }, { method: 'POST', path: '/api/partner/y' }] }) })
    if (r.hits.length) problems.push(`阴性样例误报：${s.file} → ${r.hits.map((h) => `规则${h.rule} ${h.msg}`).join('；')}`)
  }
  const covered = new Set(POSITIVE.map((p) => p.rule))
  for (const id of Object.keys(RULES).map(Number)) if (id !== 10 && id !== 11 && !covered.has(id)) problems.push(`规则 ${id} 没有阳性样例`)
  // 规则 10：未登记的 partner 路由必须被抓
  const r10 = scan({ files: new Map([['src/app/api/partner/zzz/route.ts', "export const dynamic = 'force-dynamic'\nexport const GET = partnerRoute('a', h)"]]), routesJson: '{"routes":[]}' })
  if (!r10.hits.some((h) => h.rule === 10)) problems.push('规则 10 的阳性样例没有命中')
  return problems
}

// ======================================================================
// 6. W8-1 自测：在真实源码树上逐类注入一处违规（内存覆盖，不碰磁盘），每类都必须让检查失败并指出该文件
// ======================================================================

function mutations(tree) {
  const get = (f) => {
    const s = tree.files.get(f)
    if (s == null) throw new Error(`自测需要的文件不存在：${f}`)
    return s
  }
  const append = (f, extra) => ({ [f]: get(f) + '\n' + extra + '\n' })
  const replace = (f, a, b) => {
    const s = get(f)
    if (!s.includes(a)) throw new Error(`自测替换锚点不存在：${f} 里没有 ${a}`)
    return { [f]: s.replace(a, b) }
  }
  const routes = JSON.parse(tree.routesJson || '{"routes":[]}')
  return [
    { rule: 1, name: 'partner 页面 import prisma', file: 'src/app/partner/orders/page.tsx', overlay: append('src/app/partner/orders/page.tsx', "import { prisma } from '@/lib/db'\nexport const __leak = prisma") },
    { rule: 2, name: 'handlers import supply-pricing', file: 'src/lib/partner-handlers/listings.ts', overlay: append('src/lib/partner-handlers/listings.ts', "import { setListingAdmin } from '../tenant/supply-pricing'\nexport const __x = setListingAdmin") },
    { rule: 3, name: 'partner-services import ledger', file: 'src/lib/partner-services/finance.ts', overlay: append('src/lib/partner-services/finance.ts', "import { applyRefund } from '../tenant/ledger'\nexport const __x = applyRefund") },
    { rule: 3, name: 'order-cards 去掉 USED', file: ORDER_CARDS, overlay: replace(ORDER_CARDS, "where: { orderId: o.id, status: 'USED' }", 'where: { orderId: o.id }') },
    { rule: 4, name: 'partner route 直接写 handler', file: 'src/app/api/partner/dashboard/route.ts', overlay: append('src/app/api/partner/dashboard/route.ts', 'export async function POST() { return new Response(null) }') },
    { rule: 5, name: 'login 页不调 requireChannelStorefrontPage', file: 'src/app/partner/login/page.tsx', overlay: replace('src/app/partner/login/page.tsx', 'await requireChannelStorefrontPage()', 'void 0') },
    { rule: 5, name: '成员页改成 use client', file: 'src/app/partner/orders/page.tsx', overlay: { 'src/app/partner/orders/page.tsx': "'use client'\n" + get('src/app/partner/orders/page.tsx') } },
    { rule: 6, name: '超管路由漏守卫', file: 'src/app/api/admin/tenants/overview/route.ts', overlay: append('src/app/api/admin/tenants/overview/route.ts', 'export async function DELETE() { return new Response(null) }') },
    { rule: 7, name: '别处 order.create', file: 'src/lib/vmq.ts', overlay: append('src/lib/vmq.ts', 'export async function __mk(tx: any) { return tx.order.create({ data: {} }) }') },
    { rule: 8, name: 'partner 目录调用 fulfillOrder', file: 'src/lib/partner-services/orders.ts', overlay: append('src/lib/partner-services/orders.ts', 'export const __f = (x: any) => x.fulfillOrder') },
    { rule: 9, name: '读 x-forwarded-host', file: 'src/app/api/track/view/route.ts', overlay: append('src/app/api/track/view/route.ts', "export const __h = (r: Request) => r.headers.get('x-forwarded-host')") },
    { rule: 9, name: 'cookie 设 Domain', file: 'src/app/api/auth/login/route.ts', overlay: append('src/app/api/auth/login/route.ts', "export const __c = (res: any) => res.cookies.set('token', 'x', {\n  httpOnly: true,\n  domain: '.bigolab.com',\n})") },
    { rule: 9, name: 'force-static', file: 'src/app/(shop)/about/page.tsx', overlay: { 'src/app/(shop)/about/page.tsx': "export const dynamic = 'force-static'\nexport default function P() { return null }\n" } },
    {
      rule: 10,
      name: '新增 partner 路由未登记',
      file: 'src/app/api/partner/zz-unregistered/route.ts',
      overlay: { 'src/app/api/partner/zz-unregistered/route.ts': "export const dynamic = 'force-dynamic'\nimport { partnerRoute } from '@/lib/tenant/partner-route'\nimport { dashboard } from '@/lib/partner-handlers/dashboard'\nexport const GET = partnerRoute('dashboard.read', dashboard as any)\n" },
    },
    { rule: 10, name: '路由总表删掉一行', file: 'src/app/api/partner/dashboard/route.ts', overlay: { 'scripts/itest-tenant.routes.json': JSON.stringify({ ...routes, routes: routes.routes.filter((r) => r.path !== '/api/partner/dashboard') }) } },
    { rule: 12, name: '新增一处 invoice.create', file: 'src/app/api/invoices/route.ts', overlay: append('src/app/api/invoices/route.ts', 'export async function __mk(p: any) { return p.invoice.create({ data: {} }) }') },
    { rule: 13, name: '路由里用 getCurrentUserUnscoped', file: 'src/app/api/orders/recent/route.ts', overlay: append('src/app/api/orders/recent/route.ts', "import { getCurrentUserUnscoped } from '@/lib/auth'\nexport const __u = getCurrentUserUnscoped") },
    { rule: 14, name: '别处签发 token', file: 'src/app/api/account/overview/route.ts', overlay: append('src/app/api/account/overview/route.ts', "import { signToken } from '@/lib/auth'\nexport const __s = signToken") },
    { rule: 15, name: 'partner-services 手写 select', file: 'src/lib/partner-services/catalog.ts', overlay: append('src/lib/partner-services/catalog.ts', 'const LEAK_SELECT = { cost: true } as const satisfies Prisma.CardKeySelect\nexport const __l = LEAK_SELECT') },
    { rule: 16, name: '返现结算绕开 ledger 直接加余额', file: 'src/lib/referral.ts', overlay: append('src/lib/referral.ts', 'export async function __x(tx: any) { await tx.user.update({ where: { id: 1 }, data: { balance: { increment: 1 } } }) }') },
    { rule: 16, name: '后台接口直接写流水', file: 'src/app/api/admin/wallet/adjust/route.ts', overlay: append('src/app/api/admin/wallet/adjust/route.ts', 'export async function __x(tx: any) { await tx.balanceLog.create({ data: {} }) }') },
    { rule: 16, name: '原生 SQL 改充值格', file: 'src/lib/wallet/reconcile.ts', overlay: append('src/lib/wallet/reconcile.ts', 'export async function __x(tx: any) { await tx.$executeRaw`UPDATE users SET topup_cents = 0 WHERE id = 1` }') },
    { rule: 17, name: 'wallet 静态 import vmq', file: 'src/lib/wallet/ledger.ts', overlay: append('src/lib/wallet/ledger.ts', "import { fulfillOrder } from '../vmq'\nexport const __v = fulfillOrder") },
    { rule: 17, name: '新上游客户端引用旧 herosms.ts', file: 'src/lib/jiema/upstream.ts', overlay: append('src/lib/jiema/upstream.ts', "import { getNumber as __legacy } from '../herosms'\nexport const __h = __legacy") },
    { rule: 18, name: '充值接口漏掉 denyOnChannel', file: 'src/app/api/wallet/topup/route.ts', overlay: replace('src/app/api/wallet/topup/route.ts', 'const channelDenied = await denyOnChannel()', 'const channelDenied = null as Response | null') },
    { rule: 18, name: '钱包页面组 layout 不调 notFoundOnChannel', file: 'src/app/(shop)/wallet/layout.tsx', overlay: replace('src/app/(shop)/wallet/layout.tsx', 'await notFoundOnChannel()', 'void 0') },
  ]
}

function selftest(root) {
  const tree = loadTree(root)
  const base = scan(tree)
  const baseKeys = new Set(base.violations.map((h) => `${h.rule}|${h.file}|${h.line}|${h.msg}`))
  let ok = true
  console.log(`[selftest] 基线：${base.fileCount} 个文件，违规 ${base.violations.length}（自测要求基线为 0）`)
  if (base.violations.length) ok = false
  const muts = mutations(tree)
  for (const m of muts) {
    const t = { files: new Map(tree.files), routesJson: tree.routesJson }
    for (const [k, v] of Object.entries(m.overlay)) {
      if (k === 'scripts/itest-tenant.routes.json') t.routesJson = v
      else t.files.set(k, v)
    }
    const r = scan(t)
    const fresh = r.violations.filter((h) => !baseKeys.has(`${h.rule}|${h.file}|${h.line}|${h.msg}`))
    const good = fresh.some((h) => h.rule === m.rule && h.file === m.file)
    ok = ok && good
    console.log(`  ${good ? '✓' : '✗'} 规则 ${m.rule}「${m.name}」→ ${good ? `构建失败并指出 ${m.file}` : `没有拦下（新增命中：${fresh.map((h) => `${h.rule}@${h.file}`).join(', ') || '无'}）`}`)
  }
  const covered = new Set(muts.map((m) => m.rule))
  const missing = Object.keys(RULES)
    .map(Number)
    .filter((id) => id !== 11 && !covered.has(id))
  if (missing.length) {
    ok = false
    console.log(`  ✗ 这些规则没有注入用例：${missing.join(', ')}`)
  }
  console.log(`[selftest] ${ok ? '✅ 全部类别都被拦下' : '❌ 有类别没被拦下'}（${muts.length} 个注入）`)
  return ok
}

// ======================================================================
// 6. W8-9 文档路径核对（--doc-paths；只读两份 docs，不进 prebuild——docs/ 不在 Docker 构建上下文里）
// ======================================================================
//
// 【为什么要核对】实施分包规则 1：设计里提到「要改造」的每个现有文件都必须在分包第 13 节有唯一所有者。
// 漏登记的文件没人负责改，渠道站就会在那一处回落成主站行为（例如某个平台 lib 没带 tenantId）。
// 口径（分包 11.5 W8-9）：从设计提取所有 `src/…` 路径，凡出现在「改造 / 改为 / 加」语境（同一行）的，
// 必须能在第 13 节索引里找到；找不到的列成差集，逐条人工确认后写进 DOC_PATH_NOTES（注明「只读引用」及理由）。
// 差集里有未注明的路径 → 退出码 1。

const DESIGN_DOC = 'docs/多渠道分销-设计.md'
const PLAN_DOC = 'docs/多渠道分销-实施分包.md'
const DOC_CONTEXT = /改造|改为|改成|加/

/**
 * 差集的人工确认结果：路径 → 为什么不需要第 13 节的所有者。
 * 「只读引用」= 设计在这一行提到它，但本期不改它（被 import、被当作反例、或是别的文件的改造对象）。
 */
export const DOC_PATH_NOTES = {
  'src/lib/sms.ts': '只读引用（设计 5.4 备注双写）：描述它现在往 Order.remark 追加内部说明；渠道 DTO 只读 buyerRemark，sms.ts 本身不改',
  'src/lib/marketing/sync.ts': '只读引用（设计 6.5.5 规则 9）：说明这里的 domain: 是普通对象键、规则只扫 cookie 设置语句；文件不改',
  'src/lib/marketing/worker.ts': '只读引用（设计 6.5.5 规则 9）：同上，domain: 是普通对象键；文件不改',
  'src/lib/tenant/view-as.ts': '只读引用（设计 6.5.5 规则 9）：deriveKey("viewas") 的唯一合法位置，属 P1「以渠道身份查看」，本期不建',
  'src/lib/stock-level': '只读引用（设计附录 P9）：规则 3 的 import 白名单项；src/lib/stock-level.ts 是 P0 前置已上线的文件，本期不改',
  // 二期（docs/多渠道分销-二期改动.md）的文件由二期各包所有，不在一期分包第 13 节；设计文档修订时引用了它
  'src/lib/contact-base.ts': '二期新建文件（地基包 F，二期改动 4.1）：客服常量与回退规则的唯一实现；设计 11.1 修订时引用，所有者见二期改动文档',
}

function braceExpand(s) {
  const m = s.match(/\{([^{}]*)\}/)
  if (!m) return [s]
  return m[1].split(',').flatMap((x) => braceExpand(s.slice(0, m.index) + x.trim() + s.slice(m.index + m[0].length)))
}

function globRe(g) {
  const esc = g.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')
  return new RegExp('^' + esc + '$')
}

/** 行里的 src/ 路径（ASCII 字符为止：中文标点、反引号、空格、冒号都会截断；`sms.ts:81` 的行号随之丢掉） */
function pathsInLine(line) {
  const out = []
  for (const m of line.matchAll(/src\/[A-Za-z0-9_\-./[\]()*{},@]*/g)) {
    let p = m[0]
    // 去掉句末标点、多余的右括号（「（见 src/lib/x.ts）」里的全角括号已被截断；半角的按配对判断）
    for (;;) {
      if (/[.,]$/.test(p)) p = p.slice(0, -1)
      else if (p.endsWith(')') && (p.match(/\(/g) || []).length < (p.match(/\)/g) || []).length) p = p.slice(0, -1)
      else break
    }
    if (p.length > 4) out.push(p)
  }
  return out
}

/** 第 13 节索引 → 模式表（每个元素是可 glob 匹配的绝对路径模式） */
function indexPatterns(planSrc) {
  const start = planSrc.indexOf('## 13.')
  const end = planSrc.indexOf('**跨包签名依赖**', start)
  if (start < 0 || end < 0) throw new Error(`${PLAN_DOC} 里找不到第 13 节索引`)
  const pats = []
  for (const row of planSrc.slice(start, end).split('\n')) {
    if (!row.startsWith('| `')) continue
    const cell = row.split('|')[1]
    let lastAbs = ''
    for (const [, tok] of cell.matchAll(/`([^`]+)`/g)) {
      for (const t of braceExpand(tok.trim())) {
        if (t.startsWith('src/') || !t.includes('/') && !lastAbs) {
          pats.push(t)
          if (t.startsWith('src/')) lastAbs = t
          continue
        }
        if (!lastAbs) {
          pats.push(t)
          continue
        }
        // 相对写法（同一行里「`src/app/admin/cardkeys/page.tsx`、`invoices/page.tsx`、`page.tsx`」）：
        // 依次挂到上一个绝对路径的各级父目录下（不高于 src/x），都算登记
        const segs = lastAbs.split('/')
        for (let k = segs.length - 1; k >= 2; k--) pats.push(segs.slice(0, k).join('/') + '/' + t)
      }
    }
  }
  return pats
}

function docPaths(root) {
  const design = fs.readFileSync(path.join(root, DESIGN_DOC), 'utf8')
  const plan = fs.readFileSync(path.join(root, PLAN_DOC), 'utf8')
  const pats = indexPatterns(plan)
  const res = pats.map((p) => ({ p, re: globRe(p) }))
  const covered = (p) => {
    if (p.includes('*')) {
      const prefix = p.slice(0, p.indexOf('*'))
      return pats.some((x) => x.startsWith(prefix))
    }
    const q = p.replace(/\/$/, '')
    const variants = [q, `${q}.ts`, `${q}.tsx`, `${q}/route.ts`, `${q}/page.tsx`]
    if (res.some(({ re }) => variants.some((v) => re.test(v)))) return true
    // 目录引用（`src/lib/partner-handlers/`、`src/lib/storefront/public` 这类 import 说明符）：索引里有它下面的文件即算
    return pats.some((x) => x.startsWith(q + '/'))
  }
  const all = new Set()
  const ctx = new Map() // 路径 → 第一次出现在改造语境的行号
  design.split('\n').forEach((line, i) => {
    for (const raw of pathsInLine(line)) {
      for (const p of braceExpand(raw)) {
        all.add(p)
        if (DOC_CONTEXT.test(line) && !ctx.has(p)) ctx.set(p, i + 1)
      }
    }
  })
  const diff = [...ctx.keys()].filter((p) => p !== 'src/' && !covered(p)).sort()
  const noted = diff.filter((p) => DOC_PATH_NOTES[p])
  const open = diff.filter((p) => !DOC_PATH_NOTES[p])
  const staleNotes = Object.keys(DOC_PATH_NOTES).filter((p) => !diff.includes(p))
  console.log(`[doc-paths] 设计提到 src/ 路径 ${all.size} 个，其中出现在「改造 / 改为 / 加」语境的 ${ctx.size} 个；第 13 节索引模式 ${pats.length} 条`)
  console.log(`[doc-paths] 差集 ${diff.length} 个：已逐条注明 ${noted.length} 个，未注明 ${open.length} 个`)
  for (const p of noted) console.log(`  · ${p}（设计第 ${ctx.get(p)} 行）—— ${DOC_PATH_NOTES[p]}`)
  for (const p of open) console.log(`  ✗ ${p}（设计第 ${ctx.get(p)} 行）：不在第 13 节索引，也没有注明只读引用`)
  for (const p of staleNotes) console.log(`  ⚠ DOC_PATH_NOTES 里的 ${p} 已不在差集（已登记或设计不再提到），请删掉这条注明`)
  // 参考信息（不判失败）：不在改造语境、也不在索引的路径——大多是 import 说明符或反例，人工扫一眼即可
  const other = [...all].filter((p) => p !== 'src/' && !ctx.has(p) && !covered(p)).sort()
  if (other.length) console.log(`[doc-paths] 参考：非改造语境且不在索引的 ${other.length} 个（不判失败）：${other.join('、')}`)
  const ok = open.length === 0
  console.log(`[doc-paths] ${ok ? '✅ 差集为空或逐条注明' : '❌ 有未注明的路径：登记进分包第 13 节，或确认后写进 DOC_PATH_NOTES'}`)
  return ok
}

// ======================================================================
// 7. 入口
// ======================================================================

function main() {
  const argv = process.argv.slice(2)
  const rootArg = argv.indexOf('--root')
  const root = rootArg >= 0 ? path.resolve(argv[rootArg + 1]) : REPO_ROOT
  const strict = argv.includes('--strict')

  const problems = selfCheck()
  if (problems.length) {
    console.error('[tenant-boundary] ❌ 阳性对照失败（规则写坏了，检查会静默空跑）：')
    for (const p of problems) console.error('  - ' + p)
    process.exit(1)
  }
  if (argv.includes('--selftest')) process.exit(selftest(root) ? 0 : 1)
  if (argv.includes('--doc-paths')) process.exit(docPaths(root) ? 0 : 1)

  const tree = loadTree(root)
  const r = scan(tree)
  const countLine = Object.keys(RULES)
    .map((id) => `R${id}=${id === '11' ? 'ok' : r.counts[id] || 0}`)
    .join(' ')
  // 首行：扫描文件数 + 每条规则在这棵树上的命中数（含已知例外），作为基线对照
  console.log(`[tenant-boundary] 扫描 ${r.fileCount} 个文件；各规则命中（含已知例外）：${countLine}`)
  for (const h of r.permanent) console.log(`  · 永久例外 规则${h.rule} ${h.file}:${h.line} —— ${h.exception.why}`)
  for (const h of r.pending) console.log(`  ⚠ 待处理例外 规则${h.rule} ${h.file}:${h.line} ${h.msg}（归 ${h.exception.owner}：${h.exception.why}）`)
  for (const e of r.stale) console.log(`  ✗ 过期例外：规则${e.rule} ${e.file}「${e.match}」已不再命中——请从 EXCEPTIONS 删掉这一行`)
  for (const h of r.violations) console.log(`  ✗ 规则${h.rule} ${h.file}${h.line ? ':' + h.line : ''} ${h.msg}`)
  const failed = r.violations.length + r.stale.length + (strict ? r.pending.length : 0)
  if (failed) {
    console.log(`[tenant-boundary] ❌ ${r.violations.length} 处违规${r.stale.length ? `、${r.stale.length} 条过期例外` : ''}${strict && r.pending.length ? `、${r.pending.length} 处待处理例外（--strict）` : ''}。规则见设计 6.5.5`)
    process.exit(1)
  }
  console.log(`[tenant-boundary] ✅ 零违规${r.pending.length ? `（${r.pending.length} 处待他包处理的已知例外，--strict 时按违规算）` : ''}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main()
