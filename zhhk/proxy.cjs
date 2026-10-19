'use strict'
/**
 * 繁体香港版的「转换代理」（docs/繁体香港版/设计.md §2、§5）。
 *
 * 在 app 容器里与 Next 同进程运行（zhhk/entry.cjs），监听 3001，上游是本机 Next（3000）。
 * nginx 只把三类请求送到这里，**简体站的流量完全不经过它**：
 *   1. /zh-hk、/zh-hk/…        繁体页面（含客户端导航的 RSC 请求）：去掉前缀转给 Next，并带 x-bg-lang: zh-HK；
 *                                响应里的 HTML / RSC / JSON 逐字转成繁体（zhhk/convert.cjs，字节数不变）
 *   2. /_next-hk/<词典版本>/…  繁体页面加载的 JS 分块：取 Next 的 /_next/… 原件，转繁体后返回（内存缓存）
 *   3. /api/…（带 x-bg-lang: zh-HK）繁体页面里发出的接口请求（auth-fetch-patch 自动加头）：JSON 响应转繁体
 * 其余请求（本地开发直接访问 3001 时会碰到）原样透传，所以本地可以用一个端口同时看简繁两版。
 *
 * 【安全边界】这里**只改响应、不改请求体**：买家在繁体页填的内容按原样落库（发票抬头、留言等）。
 * 【失败方式】任何异常只影响这一个繁体请求（回 503 文本），不抛到进程层面——它和 Next 同进程，抛出去会把简体站一起带走。
 */

const http = require('http')
const zlib = require('zlib')
const { StringDecoder } = require('string_decoder')
const { loadDefault } = require('./convert.cjs')

const PREFIX = '/zh-hk'
/** 主站 Host 默认名单：与 src/lib/storefront/hosts.ts 的 DEFAULT_PLATFORM_HOSTS 逐项相同（scripts/check-zhhk.ts 对照） */
const DEFAULT_HOSTS = ['bigolab.com', 'www.bigolab.com', 'app', 'localhost', '127.0.0.1']
const HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade',
])
/** 繁体站不提供的路径：后台、渠道后台、带令牌的票据页（收据/开票链接是法律凭证，保持简体原文），以及站点地图等 */
const HK_BLOCK = /^\/(?:admin|partner|api\/admin|receipt|invoice-request|finance|reply|bot|unsubscribe)(?:\/|$)/
/** 这些路径前缀不是「页面」，链接与跳转不加 /zh-hk */
const NON_PAGE = /^\/(?:api|_next|_next-hk|uploads|zh-hk|admin|partner|receipt|invoice-request|finance|reply|bot|unsubscribe|cdn-cgi)(?:\/|$|\?)/

function log(...a) {
  console.error('[zhhk]', ...a)
}

/** 页面路径（可带查询串）是否要加繁体前缀。与 src/lib/i18n/lang.ts 的 isLocalizablePath 同一规则（scripts/check-zhhk.ts 对照） */
function isPagePath(p) {
  if (!p || p[0] !== '/' || p.startsWith('//')) return false
  if (NON_PAGE.test(p)) return false
  // 带扩展名的是文件（/favicon.ico、/logo.png、/sitemap.xml）
  const pathOnly = p.split(/[?#]/)[0]
  const last = pathOnly.slice(pathOnly.lastIndexOf('/') + 1)
  return !last.includes('.')
}

/** 简繁切换链接（?hl=…）：目标版本已经写在地址里，HTML 后处理不能再给它补前缀 */
function isSwitchLink(p) {
  return /[?&]hl=/.test(p)
}

/** 收录范围与香港版标题（zhhk/policy.json，站点地图那边读同一份） */
const POLICY = require('./policy.json')
const INDEX_EXACT = new Set(POLICY.indexExact || [])
const INDEX_PREFIXES = POLICY.indexPrefixes || []
function hkIndexable(innerPath) {
  const p = (innerPath || '/').split(/[?#]/)[0]
  return INDEX_EXACT.has(p) || INDEX_PREFIXES.some((x) => p.startsWith(x))
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

// 香港版标题会被原样塞进 RSC 的 JSON 字符串里（下面的 metaSwap），所以不许含引号、反斜杠、尖括号
for (const [k, t] of Object.entries(POLICY.titles || {})) {
  for (const v of [t.title, t.description]) {
    if (v !== undefined && /["\\<>]/.test(v)) throw new Error(`[zhhk] policy.json 的 ${k} 含不允许的字符（引号 / 反斜杠 / 尖括号）`)
  }
}

/**
 * 把 RSC 数据里的 <title> / og / twitter 标题与描述换成香港版（policy.json 的 titles）。
 * 不换的话，浏览器水合后 Next 会按 RSC 里的值把 document.title 改回自动转换的标题，而 Google 是渲染 JS 之后取标题的。
 * 两种写法都要认：HTML 里内联的 self.__next_f.push("…") 是转义过的（\"title\"），RSC 响应里是原样的（"title"）。
 * 这些都在普通 JSON 行里（不在带字节数前缀的 T 行里），字符串变长变短不影响解析。
 */
// (?:\\)?" = 可选的反斜杠 + 引号；[^"\\]* = 字符串内容（标题里不会有引号、反斜杠）
const RSC_TITLE = /((?:\\)?"title(?:\\)?",(?:\\)?"\d+(?:\\)?",\{(?:\\)?"children(?:\\)?":(?:\\)?")[^"\\]*((?:\\)?")/g
const RSC_OG_TITLE = /((?:\\)?"(?:og|twitter):title(?:\\)?",(?:\\)?"content(?:\\)?":(?:\\)?")[^"\\]*((?:\\)?")/g
const RSC_DESC = /((?:\\)?"(?:description|og:description|twitter:description)(?:\\)?",(?:\\)?"content(?:\\)?":(?:\\)?")[^"\\]*((?:\\)?")/g

function metaSwap(s, t) {
  if (!t) return s
  if (t.title) {
    s = s.replace(RSC_TITLE, (m, a, b) => a + t.title + b).replace(RSC_OG_TITLE, (m, a, b) => a + t.title + b)
  }
  if (t.description) s = s.replace(RSC_DESC, (m, a, b) => a + t.description + b)
  return s
}

/**
 * 接口响应：哪些不转、哪些字段不转（设计 §5.3）。
 * 原则：只转「给人看的文案」，凡是**凭据**或**会被原样提交回服务器的数据**都保持原文——
 *  · 卡密、密码、令牌、验证码、邮箱、手机号：转了就是一个用不了的凭据；
 *  · 发票抬头 / 税号 / 收据、个人资料、绑定账户：前端会把接口给的值填进表单再提交，转了就会把繁体写进发票（法律主体名称必须与登记一致）。
 */
const API_NO_CONVERT = /^\/api\/(?:invoice-titles|invoices|receipts|invoice-requests|account\/(?:profile|bindings)|redeem|orders\/[^/]+\/sms)(?:\/|\?|$)/
const API_PROTECT_KEYS = new Set([
  'secret', 'secrets', 'cards', 'cardItems', 'password', 'token', 'code', 'phone', 'email', 'accountEmail',
  'taxNumber', 'bankAccount', 'bankName', 'address', 'nickname', 'buyerRemark', 'redeemUrl', 'url', 'href', 'slug',
])

/**
 * 按 JSON 结构转换：只转「值」字符串里的汉字，键名不转，受保护的键（及其下整棵子树）原样。
 * 直接扫原文、不 parse 再 stringify——大整数、数字格式、键顺序都不受影响；转义序列是 ASCII，逐字转换碰不到。
 */
function convertJsonText(text, convert) {
  let out = ''
  let i = 0
  const n = text.length
  const stack = [] // { obj, expectKey, key, prot }
  while (i < n) {
    const c = text[i]
    if (c === '"') {
      let j = i + 1
      while (j < n && text[j] !== '"') j += text[j] === '\\' ? 2 : 1
      const tok = text.slice(i, j + 1)
      const top = stack[stack.length - 1]
      if (top && top.obj && top.expectKey) {
        try {
          top.key = JSON.parse(tok)
        } catch {
          top.key = null
        }
        out += tok
      } else {
        const prot = !!top && (top.prot || (top.obj && API_PROTECT_KEYS.has(top.key)))
        out += prot ? tok : convert(tok)
      }
      i = j + 1
      continue
    }
    if (c === '{' || c === '[') {
      const top = stack[stack.length - 1]
      const prot = !!top && (top.prot || (top.obj && API_PROTECT_KEYS.has(top.key)))
      stack.push({ obj: c === '{', expectKey: c === '{', key: null, prot })
    } else if (c === '}' || c === ']') {
      stack.pop()
    } else if (c === ':') {
      const top = stack[stack.length - 1]
      if (top) top.expectKey = false
    } else if (c === ',') {
      const top = stack[stack.length - 1]
      if (top && top.obj) top.expectKey = true
    }
    out += c
    i++
  }
  return out
}

function addPrefix(p) {
  if (p === '/' || p.startsWith('/?') || p.startsWith('/#')) return PREFIX + p // → /zh-hk/ 、/zh-hk/?x
  return PREFIX + p
}

function stripPrefix(url) {
  // /zh-hk → /，/zh-hk/x → /x，/zh-hk?q → /?q
  const rest = url.slice(PREFIX.length)
  if (rest === '' || rest[0] === '?' || rest[0] === '#') return '/' + rest
  return rest
}

function createProxy(opts = {}) {
  const upstream = new URL(opts.upstream || 'http://127.0.0.1:3000')
  const conv = opts.converter || loadDefault()
  const VER = conv.version
  const hkStatic = `/_next-hk/${VER}/`
  const dev = !!opts.dev
  const hosts = opts.hosts || null // Set<string>：允许繁体版的 Host（不含端口）；null = 不限
  const agent = new http.Agent({ keepAlive: true, maxSockets: 128 })

  /** 已转换的 JS 分块：key = /_next/ 之后的路径。只在生产缓存（开发模式同一地址内容会变） */
  const chunkCache = new Map()
  let chunkCacheBytes = 0
  const CHUNK_CACHE_MAX = 96 * 1024 * 1024
  const inflight = new Map()

  function hostOf(req) {
    return String(req.headers.host || '').toLowerCase().replace(/:\d+$/, '')
  }

  function upstreamHeaders(req, extra) {
    const h = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (HOP.has(k)) continue
      h[k] = v
    }
    // 要原文（不压缩）才能转换；nginx 对外会重新 gzip
    delete h['accept-encoding']
    Object.assign(h, extra || {})
    return h
  }

  function sendText(res, status, text) {
    if (res.headersSent) {
      res.destroy()
      return
    }
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
    res.end(text)
  }

  function copyResponseHeaders(up, { transformed }) {
    const h = {}
    for (const [k, v] of Object.entries(up.headers)) {
      if (HOP.has(k)) continue
      if (transformed && (k === 'content-length' || k === 'content-encoding' || k === 'etag' || k === 'last-modified')) continue
      h[k] = v
    }
    return h
  }

  /** 响应体解压流（上游理论上不会压缩，因为没发 accept-encoding；防御一下） */
  function bodyStream(up) {
    const enc = String(up.headers['content-encoding'] || '').toLowerCase()
    if (enc === 'gzip' || enc === 'x-gzip') return up.pipe(zlib.createGunzip())
    if (enc === 'br') return up.pipe(zlib.createBrotliDecompress())
    if (enc === 'deflate') return up.pipe(zlib.createInflate())
    return up
  }

  function kindOf(ct) {
    ct = String(ct || '').toLowerCase()
    if (ct.startsWith('text/html')) return 'html'
    if (ct.startsWith('text/x-component')) return 'rsc'
    if (ct.includes('json') || ct.startsWith('text/plain') || ct.includes('javascript')) return 'text'
    return 'binary'
  }

  /** 页面 Location 头：同站页面路径加前缀（Next 的 redirect('/login') 等），其余不动 */
  function rewriteLocation(loc, req) {
    if (!loc) return loc
    try {
      if (loc.startsWith('/')) return isPagePath(loc) ? addPrefix(loc) : loc
      const u = new URL(loc)
      if (u.host.toLowerCase() === String(req.headers.host || '').toLowerCase()) {
        const p = u.pathname + u.search + u.hash
        if (isPagePath(p)) return u.origin + addPrefix(p)
      }
    } catch {
      /* 非法地址原样返回 */
    }
    return loc
  }

  // ---------------------------------------------------------------------------
  // HTML 后处理（转繁体之后做）：
  //  · 脚本地址 /_next/static/ → /_next-hk/<版本>/static/（只改 HTML 属性 `="/_next/static/chunks/`，内联 RSC 里是 \" 转义，碰不到）
  //  · 站内页面链接 href="/x" → href="/zh-hk/x"（给爬虫和没水合时的点击用；Next 的 <Link> 已由 lib/i18n/link 加好前缀）
  //  · <head>：canonical / og:url 补前缀（Next 已按 metadataBase 处理相对地址，这里兜底绝对地址），可收录页面补 hreflang
  //  · 页面语言声明 zh-CN → zh-HK（JSON-LD 的 inLanguage、og:locale、<html lang>；等长，RSC 里一起换也安全）
  // ---------------------------------------------------------------------------
  const ATTR_SCRIPT = /(=")\/_next\/static\/chunks\//g
  const ATTR_HREF = /(\shref=")(\/[^"]*)"/g

  function rewriteAttrs(s) {
    return s
      .replace(ATTR_SCRIPT, `$1${hkStatic}static/chunks/`)
      .replace(ATTR_HREF, (m, a, p) => {
        const raw = p.replace(/&amp;/g, '&')
        return isPagePath(raw) && !isSwitchLink(raw) ? `${a}${addPrefix(p)}"` : m
      })
  }

  // 只换三处「声明页面语言」的地方（等长替换，RSC 里一起换也安全）；不做全局 zh-CN → zh-HK，
  // 否则切换按钮的 lang="zh-CN"、业务里的语言代码也会被改掉
  function localeSwap(s) {
    return s
      .replace(/(inLanguage\\?"\s*:\s*\\?")zh-CN/g, '$1zh-HK')
      .replace(/(property="og:locale" content=")zh_CN/g, '$1zh_HK')
      .replace(/<html lang="zh-CN"/, '<html lang="zh-HK"')
  }

  function processHead(head, req) {
    const reqHost = String(req.headers.host || '').toLowerCase()
    const own = (u) => {
      try {
        const x = new URL(u)
        return x.host.toLowerCase() === reqHost || (hosts && hosts.has(x.hostname.toLowerCase())) ? x : null
      } catch {
        return null
      }
    }
    const fixAbs = (u) => {
      const x = own(u)
      if (!x) return u
      const p = x.pathname + x.search
      return p.startsWith(PREFIX + '/') || p === PREFIX || !isPagePath(p) ? u : x.origin + addPrefix(p)
    }
    head = head.replace(/(<link[^>]*rel="canonical"[^>]*href=")([^"]+)"/, (m, a, u) => `${a}${fixAbs(u)}"`)
    head = head.replace(/(<meta[^>]*property="og:url"[^>]*content=")([^"]+)"/, (m, a, u) => `${a}${fixAbs(u)}"`)

    // 香港版标题（policy.json 的 titles，已是繁体，替换在转换之后，不会被二次转换）
    const inner = (req.zhhkInner || '/').split(/[?#]/)[0]
    const t = POLICY.titles && POLICY.titles[inner]
    if (t && t.title) {
      head = head.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(t.title)}</title>`)
      head = head.replace(/(<meta[^>]*(?:property="og:title"|name="twitter:title")[^>]*content=")[^"]*"/g, `$1${escAttr(t.title)}"`)
    }
    if (t && t.description) {
      head = head.replace(
        /(<meta[^>]*(?:name="description"|property="og:description"|name="twitter:description")[^>]*content=")[^"]*"/g,
        `$1${escAttr(t.description)}"`,
      )
    }

    // 收录范围（policy.json）：名单外的繁体页一律 noindex,follow（可看、可跟链接、不进索引），也不写 hreflang
    let noindex = /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(head)
    if (!noindex && !hkIndexable(inner)) {
      noindex = true
      if (/<meta[^>]*name="robots"[^>]*>/.test(head)) {
        head = head.replace(/(<meta[^>]*name="robots"[^>]*content=")[^"]*"/, '$1noindex, follow"')
      } else {
        head = head.replace('</head>', '<meta name="robots" content="noindex, follow"/></head>')
      }
      head = head.replace(/(<meta[^>]*name="googlebot"[^>]*content=")[^"]*"/, '$1noindex, follow"')
    }
    const canon = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(head)
    if (!noindex && canon) {
      const x = own(canon[1])
      if (x && (x.pathname === PREFIX + '/' || x.pathname.startsWith(PREFIX + '/') || x.pathname === PREFIX)) {
        let hansPath = x.pathname.slice(PREFIX.length) || '/'
        if (hansPath === '') hansPath = '/'
        const hans = x.origin + hansPath + x.search
        const hant = x.origin + x.pathname + x.search
        const esc = (u) => u.replace(/&(?!amp;)/g, '&amp;')
        const tags =
          `<link rel="alternate" hreflang="zh-Hans" href="${esc(hans)}"/>` +
          `<link rel="alternate" hreflang="zh-CN" href="${esc(hans)}"/>` +
          `<link rel="alternate" hreflang="zh-Hant" href="${esc(hant)}"/>` +
          `<link rel="alternate" hreflang="zh-HK" href="${esc(hant)}"/>` +
          `<link rel="alternate" hreflang="zh-MO" href="${esc(hant)}"/>` +
          `<link rel="alternate" hreflang="zh-TW" href="${esc(hant)}"/>` +
          `<link rel="alternate" hreflang="x-default" href="${esc(hans)}"/>`
        head = head.replace('</head>', tags + '</head>')
      }
    }
    return head
  }

  /** 流式处理 HTML：先攒到 </head> 一次性处理头部，之后边转边发；属性替换留 256 字符尾巴防跨块 */
  function pipeHtml(src, res, req) {
    const dec = new StringDecoder('utf8')
    const st = conv.createStream()
    const meta = titleFor(req)
    // 头部之后的正文：属性替换 + 页面语言声明 + RSC 里的香港版标题（内联脚本不会被切开：切点总在 '<' 处，见下）
    const body = (x) => metaSwap(localeSwap(rewriteAttrs(x)), meta)
    let headDone = false
    let pending = '' // 已转繁体、尚未做属性替换的文本
    const TAIL = 256

    const flush = (final) => {
      if (!headDone) {
        const i = pending.indexOf('</head>')
        if (i < 0 && !final) return
        const cut = i < 0 ? pending.length : i + '</head>'.length
        const head = localeSwap(rewriteAttrs(pending.slice(0, cut)))
        res.write(processHead(head, req))
        pending = pending.slice(cut)
        headDone = true
      }
      if (final) {
        if (pending) res.write(body(pending))
        pending = ''
        return
      }
      if (pending.length > TAIL) {
        // 在 '<' 处切，标签不会被切断（属性替换只看标签内部）
        let cut = pending.lastIndexOf('<', pending.length - 1)
        if (cut <= 0) cut = pending.length - TAIL
        const out = pending.slice(0, cut)
        pending = pending.slice(cut)
        if (out) res.write(body(out))
      }
    }

    src.on('data', (buf) => {
      try {
        pending += st.push(dec.write(buf))
        flush(false)
      } catch (e) {
        log('html 转换失败', e && e.message)
        res.destroy()
      }
    })
    src.on('end', () => {
      try {
        pending += st.push(dec.end()) + st.end()
        flush(true)
        res.end()
      } catch (e) {
        log('html 收尾失败', e && e.message)
        res.destroy()
      }
    })
    src.on('error', () => res.destroy())
  }

  /**
   * RSC / JSON / 文本：流式逐字转换（字节数不变）。
   * 页面的 RSC（客户端导航）另做页面语言声明与香港版标题替换；有标题要换时按整行输出（RSC 一行一条记录，标题不会被切开）。
   */
  function pipeText(src, res, { swap, meta }) {
    const dec = new StringDecoder('utf8')
    const st = conv.createStream()
    let carry = ''
    const post = (x) => (swap ? metaSwap(localeSwap(x), meta) : x)
    const emit = (out, final) => {
      if (!meta || !swap) return post(out)
      carry += out
      const cut = final ? carry.length : carry.lastIndexOf('\n') + 1
      const ready = carry.slice(0, cut)
      carry = carry.slice(cut)
      return ready ? post(ready) : ''
    }
    src.on('data', (buf) => {
      try {
        const out = emit(st.push(dec.write(buf)), false)
        if (out) res.write(out)
      } catch (e) {
        log('文本转换失败', e && e.message)
        res.destroy()
      }
    })
    src.on('end', () => {
      try {
        res.end(emit(st.push(dec.end()) + st.end(), true))
      } catch (e) {
        res.destroy()
      }
    })
    src.on('error', () => res.destroy())
  }

  /** 接口 JSON：攒齐后按结构转换（受保护字段原样，见 convertJsonText）。超过 8MB 的不转（站内没有这么大的接口，防内存） */
  function pipeJson(src, res) {
    const chunks = []
    let size = 0
    let over = false
    src.on('data', (b) => {
      if (over) return res.write(b)
      size += b.length
      if (size > 8 * 1024 * 1024) {
        over = true
        for (const c of chunks) res.write(c)
        res.write(b)
        return
      }
      chunks.push(b)
    })
    src.on('end', () => {
      if (over) return res.end()
      try {
        res.end(convertJsonText(Buffer.concat(chunks).toString('utf8'), conv.convert))
      } catch (e) {
        log('JSON 转换失败', e && e.message)
        res.end(Buffer.concat(chunks))
      }
    })
    src.on('error', () => res.destroy())
  }

  function titleFor(req) {
    const inner = (req.zhhkInner || '').split(/[?#]/)[0]
    return (inner && POLICY.titles && POLICY.titles[inner]) || null
  }

  function forward(req, res, { path, headers, mode }) {
    const upReq = http.request(
      {
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: upstream.port,
        method: req.method,
        path,
        headers,
        agent,
      },
      (up) => {
        try {
          const kind = kindOf(up.headers['content-type'])
          const noBody = req.method === 'HEAD' || up.statusCode === 204 || up.statusCode === 304
          const convert = mode !== 'pass' && !noBody && kind !== 'binary'
          const h = copyResponseHeaders(up, { transformed: convert })
          // middleware 的简繁跳转（lib/i18n/middleware-lang.ts）已经算好目标版本，带着标记头：不能再补前缀，否则「切回简体」会被补回繁体
          const langRedirect = !!h['x-bg-lang-redirect']
          delete h['x-bg-lang-redirect']
          if (mode === 'page' && h.location && !langRedirect) h.location = rewriteLocation(String(h.location), req)
          if (mode === 'page' && h.link) {
            h.link = String(h.link).replace(/<\/_next\/static\/chunks\//g, `<${hkStatic}static/chunks/`)
          }
          if (convert) h['x-zhhk'] = VER
          res.writeHead(up.statusCode || 502, h)
          if (!convert) {
            up.pipe(res)
            return
          }
          const src = bodyStream(up)
          const isJson = String(up.headers['content-type'] || '').toLowerCase().includes('json')
          if (kind === 'html' && mode === 'page') pipeHtml(src, res, req)
          else if (mode === 'api' && isJson) pipeJson(src, res)
          else pipeText(src, res, { swap: mode === 'page', meta: mode === 'page' ? titleFor(req) : null })
        } catch (e) {
          log('响应处理失败', e && e.message)
          sendText(res, 503, '繁體頁面暫時無法顯示，請稍後再試')
        }
      },
    )
    upReq.on('error', (e) => {
      log('上游错误', req.method, path, e && e.code)
      sendText(res, 503, '繁體頁面暫時無法顯示，請稍後再試')
    })
    req.pipe(upReq)
  }

  // ---------------------------------------------------------------------------
  // /_next-hk/<版本>/static/… —— 繁体 JS 分块
  // ---------------------------------------------------------------------------
  function fetchUpstreamText(p, req) {
    return new Promise((resolve, reject) => {
      const r = http.request(
        { hostname: upstream.hostname, port: upstream.port, path: p, method: 'GET', agent, headers: { host: req.headers.host || 'localhost' } },
        (up) => {
          const chunks = []
          const src = bodyStream(up)
          src.on('data', (c) => chunks.push(c))
          src.on('end', () => resolve({ status: up.statusCode, headers: up.headers, body: Buffer.concat(chunks) }))
          src.on('error', reject)
        },
      )
      r.on('error', reject)
      r.end()
    })
  }

  function convertChunk(js) {
    // 只改 webpack 运行时的 publicPath（生产是压缩后的 `d.p="/_next/"`，开发是 `__webpack_require__.p = "/_next/"`）：
    // 之后按需加载的分块都从繁体路径取。别的 "/_next/" 字面量不碰——如 next/dynamic 输出 CSS <link> 的
    // `assetPrefix+"/_next/"`，改了会和服务端渲染的 href 不一致（同一份 CSS 换个地址再下一遍）
    return conv.convert(js).replace(/(\.p\s*=\s*)"\/_next\/"/g, `$1"${hkStatic}"`)
  }

  async function serveHkStatic(req, res, url) {
    // url: /_next-hk/<ver>/static/...
    const m = /^\/_next-hk\/([0-9a-z]+)\/(.*)$/.exec(url)
    if (!m) return sendText(res, 404, 'Not Found')
    const [, ver, rest] = m
    const restPath = rest.split('?')[0]
    const isJs = /\.(?:m?js)$/.test(restPath)
    const upPath = '/_next/' + rest
    if (!isJs) {
      // CSS、字体、图片：原样（不转换，不缓存）
      return forward(req, res, { path: upPath, headers: upstreamHeaders(req, {}), mode: 'pass' })
    }
    const key = restPath
    try {
      let hit = !dev && chunkCache.get(key)
      if (!hit) {
        let p = inflight.get(key)
        if (!p) {
          p = fetchUpstreamText(upPath, req).then((r) => {
            if (r.status !== 200) return { status: r.status, body: r.body, headers: r.headers }
            const body = Buffer.from(convertChunk(r.body.toString('utf8')), 'utf8')
            const out = { status: 200, body, headers: r.headers }
            if (!dev && chunkCacheBytes + body.length < CHUNK_CACHE_MAX) {
              chunkCache.set(key, out)
              chunkCacheBytes += body.length
            }
            return out
          })
          inflight.set(key, p)
          p.finally(() => inflight.delete(key))
        }
        hit = await p
      }
      const headers = {
        'content-type': hit.headers['content-type'] || 'application/javascript; charset=UTF-8',
        'content-length': hit.body.length,
        'x-zhhk': VER,
      }
      // 版本对得上才允许长缓存；对不上（部署前后的旧页面）只给短缓存，避免旧地址长期挂着新词典的内容
      headers['cache-control'] =
        hit.status === 200 && ver === VER && !dev
          ? hit.headers['cache-control'] || 'public, max-age=31536000, immutable'
          : 'no-store'
      res.writeHead(hit.status, headers)
      res.end(req.method === 'HEAD' ? undefined : hit.body)
    } catch (e) {
      log('分块转换失败', key, e && e.message)
      sendText(res, 503, 'chunk unavailable')
    }
  }

  // ---------------------------------------------------------------------------
  function handle(req, res) {
    try {
      const url = req.url || '/'
      if (hosts && !hosts.has(hostOf(req)) && (url === PREFIX || url.startsWith(PREFIX + '/') || url.startsWith(PREFIX + '?'))) {
        return sendText(res, 404, 'Not Found')
      }
      if (url.startsWith('/_next-hk/')) return serveHkStatic(req, res, url)

      if (url === PREFIX || url.startsWith(PREFIX + '/') || url.startsWith(PREFIX + '?')) {
        const inner = stripPrefix(url)
        const innerPath = inner.split('?')[0]
        // 繁体站不提供的：后台等 404；票据类跳回简体原文
        if (/^\/(?:admin|partner|api\/admin)(?:\/|$)/.test(innerPath)) return sendText(res, 404, 'Not Found')
        if (HK_BLOCK.test(innerPath)) {
          res.writeHead(302, { location: inner, 'cache-control': 'no-store' })
          return res.end()
        }
        // 站点地图、robots、IndexNow 密钥只在根路径提供
        if (/\.(?:xml|txt)$/.test(innerPath)) return sendText(res, 404, 'Not Found')
        const extra = { 'x-bg-lang': 'zh-HK' }
        // 客户端导航时 Next 会带当前地址（拦截路由用），同样去掉前缀，保持与服务端看到的路径一致
        const nu = req.headers['next-url']
        if (typeof nu === 'string' && (nu === PREFIX || nu.startsWith(PREFIX + '/'))) extra['next-url'] = stripPrefix(nu)
        const headers = upstreamHeaders(req, extra)
        // 页面要整页转换，上游不能回 304（没有正文可转）
        delete headers['if-none-match']
        delete headers['if-modified-since']
        req.zhhkInner = inner
        return forward(req, res, { path: inner, headers, mode: 'page' })
      }

      if (url.startsWith('/api/') && String(req.headers['x-bg-lang'] || '').toLowerCase() === 'zh-hk') {
        const headers = upstreamHeaders(req, { 'x-bg-lang': 'zh-HK' })
        // 票据、个人资料、兑换、接码验证码：原样透传（理由见 API_NO_CONVERT）
        if (API_NO_CONVERT.test(url)) return forward(req, res, { path: url, headers, mode: 'pass' })
        delete headers['if-none-match']
        delete headers['if-modified-since']
        return forward(req, res, { path: url, headers, mode: 'api' })
      }

      // 其他：原样透传（生产上 nginx 不会把它们送到这里；本地开发用一个端口看两版时需要）
      const headers = {}
      for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v
      return forward(req, res, { path: url, headers, mode: 'pass' })
    } catch (e) {
      log('请求处理失败', e && e.message)
      sendText(res, 503, '繁體頁面暫時無法顯示，請稍後再試')
    }
  }

  /** WebSocket（只有本地开发的 HMR 用得到）：原样转发 */
  function upgrade(req, socket, head) {
    const net = require('net')
    const up = net.connect(Number(upstream.port) || 80, upstream.hostname, () => {
      let raw = `${req.method} ${req.url} HTTP/1.1\r\n`
      for (let i = 0; i < req.rawHeaders.length; i += 2) raw += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`
      up.write(raw + '\r\n')
      if (head && head.length) up.write(head)
      up.pipe(socket)
      socket.pipe(up)
    })
    up.on('error', () => socket.destroy())
    socket.on('error', () => up.destroy())
  }

  return { handle, upgrade, version: VER, isPagePath, rewriteLocation, processHead, rewriteAttrs }
}

function start(opts = {}) {
  const port = Number(opts.port || process.env.ZHHK_PORT || 3001)
  const host = opts.host || process.env.ZHHK_HOST || '0.0.0.0'
  // 允许繁体版的 Host：ZHHK_HOSTS → PLATFORM_HOSTS → 与 src/lib/storefront/hosts.ts 相同的主站默认名单（渠道站暂不提供繁体版）。
  // 【不能「都没配 = 不限」】生产上 PLATFORM_HOSTS 本来就不设（应用用内置默认值）：2026-10-20 上线时代理因此对所有 Host 放行，
  // 渠道站 lulu 的 /zh-hk/ 被转成繁体、还套上了主站的香港版标题（zhhk/policy.json 的 titles）。只有显式传 opts.hosts=null（本地调试）才不限
  const hostsEnv = opts.hosts !== undefined ? opts.hosts : process.env.ZHHK_HOSTS || process.env.PLATFORM_HOSTS || DEFAULT_HOSTS.join(',')
  const hosts = hostsEnv
    ? new Set(
        String(hostsEnv)
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      )
    : null
  const p = createProxy({ ...opts, hosts })
  const server = http.createServer(p.handle)
  server.on('upgrade', p.upgrade)
  server.on('clientError', (e, socket) => socket.destroy())
  server.keepAliveTimeout = 65000
  server.listen(port, host, () => log(`繁体转换代理已启动 ${host}:${port} → ${opts.upstream || 'http://127.0.0.1:3000'}，词典 ${p.version}`))
  return server
}

module.exports = { createProxy, start, isPagePath, isSwitchLink, stripPrefix, hkIndexable, metaSwap, convertJsonText, API_NO_CONVERT, DEFAULT_HOSTS }

// 本地开发：node zhhk/proxy.cjs --upstream http://127.0.0.1:3000 --port 3101 --dev
if (require.main === module) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(k)
    return i > 0 ? process.argv[i + 1] : d
  }
  start({
    upstream: arg('--upstream', 'http://127.0.0.1:3000'),
    port: Number(arg('--port', 3101)),
    host: '127.0.0.1',
    dev: process.argv.includes('--dev'),
    hosts: arg('--hosts', ''),
  })
}
