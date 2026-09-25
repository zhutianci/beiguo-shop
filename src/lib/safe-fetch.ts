/**
 * 服务端请求「外部可控地址」专用的 GET（防 SSRF）。**凡是服务端去请求别人给的 URL，一律走这里，禁止裸 fetch。**
 *
 * 【为什么不用全局 fetch】（2026-09-26 审计 G32 / G33）
 *  - 入口只查字面量挡不住域名：127.0.0.1.nip.io、localtest.me、A 记录指向 100.100.100.200 的自有域名，
 *    在 docker 内置 DNS 下连 `app.` 这种结尾带点的写法都能解析到容器。
 *  - redirect:'follow' 由 undici 自己跟完整条跳转链，「公网 302 → http://100.100.100.200/」那一跳
 *    在我们复查 res.url 之前就已经发出去了。
 *  - 先解析校验、再交给 fetch 去连，中间还有 DNS rebinding 的时间差。
 * 这里改用 node:http(s) 的 `lookup` 钩子：在建连那一刻校验解析结果，而且 net 直接用这里返回的地址去连，
 * 校验的和连的是同一个 IP；跳转手动跟，每一跳重新校验。不需要装 undici（node_modules 里本来就没有）。
 * 顺带一点：node:http 不经过 Next 打过补丁的 fetch，所以也不会被写进 .next/cache/fetch-cache
 * （lib/news/feed.ts 顶部 9-09 事故的那个坑）。
 *
 * 只能在服务端 import（用了 http/https/dns/zlib）。客户端组件不能值引用本文件及引用它的 friend-link.ts / news/feed.ts。
 */
import http from 'http'
import https from 'https'
import dns from 'dns'
import zlib from 'zlib'
import type { Readable } from 'stream'
import { isPrivateAddress, publicUrlProblem } from './net-guard'

export class UnsafeTargetError extends Error {
  code = 'ESSRF'
  constructor(msg: string) {
    super(msg)
    this.name = 'UnsafeTargetError'
  }
}

export class SafeFetchError extends Error {
  status: number
  constructor(msg: string, status = 0) {
    super(msg)
    this.name = 'SafeFetchError'
    this.status = status
  }
}

export const TIMEOUT_MESSAGE = '超时'

/** 字面量预检：协议、账号密码、IP 字面量、localhost / 容器名。不通过抛 UnsafeTargetError */
export function assertPublicUrl(raw: string | URL): URL {
  let u: URL
  try {
    u = typeof raw === 'string' ? new URL(raw) : raw
  } catch {
    throw new UnsafeTargetError('地址格式不正确')
  }
  const problem = publicUrlProblem(u)
  if (problem) throw new UnsafeTargetError(problem)
  return u
}

/**
 * 建连时的 DNS 钩子：任何一个解析结果落在内网就拒绝。
 * Node 20 默认 autoSelectFamily=true，net 调 lookup 时会带 all:true、要求回调给数组；
 * 不带 all 时给 (address, family)。两种都要处理。
 */
function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  cb: (err: NodeJS.ErrnoException | null, address?: string | dns.LookupAddress[], family?: number) => void
): void {
  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err)
    const list = addrs as unknown as dns.LookupAddress[]
    if (!list.length) {
      return cb(Object.assign(new Error('ENOTFOUND ' + hostname), { code: 'ENOTFOUND' }))
    }
    if (list.some((a) => isPrivateAddress(a.address))) {
      return cb(new UnsafeTargetError('域名解析到了内网地址'))
    }
    if ((options as { all?: boolean }).all) return cb(null, list)
    cb(null, list[0].address, list[0].family)
  })
}

export interface SafeGetOptions {
  timeoutMs: number
  /** 按解压后的字节数截断（顺带防压缩炸弹）。截断不报错，返回前 maxBytes 字节 */
  maxBytes: number
  headers?: Record<string, string>
  /** 默认 5。undici 默认 20，正常站点 1~2 跳 */
  maxRedirects?: number
}

export interface SafeGetResult {
  status: number
  /** 最终地址（跟完跳转后） */
  url: string
  body: string
  headers: http.IncomingHttpHeaders
  /** 是否在 maxBytes 处截断 */
  truncated: boolean
}

/** 跨源跳转时只保留这两个头：调用方带的授权类头（如 AIHOT 的 X-License）不能随跳转送给第三方 */
const CROSS_ORIGIN_KEEP = new Set(['user-agent', 'accept'])

/**
 * GET 一个外部地址。非 2xx 不抛错（由调用方看 status）；
 * 抛错的情形：UnsafeTargetError（指向内网）、SafeFetchError（超时 / 跳转过多 / 连接中断）、网络错误。
 */
export async function safeGet(rawUrl: string, opt: SafeGetOptions): Promise<SafeGetResult> {
  const deadline = Date.now() + opt.timeoutMs
  const maxRedirects = opt.maxRedirects ?? 5
  let url = assertPublicUrl(rawUrl)
  let headers: Record<string, string> = { ...(opt.headers || {}) }
  for (let hop = 0; ; hop++) {
    const r = await requestOnce(url, headers, opt.maxBytes, deadline)
    if (r.status >= 300 && r.status < 400 && r.location) {
      if (hop >= maxRedirects) throw new SafeFetchError('跳转次数过多', r.status)
      let next: URL
      try {
        next = new URL(r.location, url)
      } catch {
        throw new SafeFetchError('跳转地址不合法', r.status)
      }
      // 每一跳重新做字面量校验；域名解析在 safeLookup 里再校验一次
      next = assertPublicUrl(next)
      if (next.origin !== url.origin) {
        headers = Object.fromEntries(Object.entries(headers).filter(([k]) => CROSS_ORIGIN_KEEP.has(k.toLowerCase())))
      }
      url = next
      continue
    }
    return { status: r.status, url: url.toString(), body: r.body, headers: r.headers, truncated: r.truncated }
  }
}

interface OnceResult {
  status: number
  location?: string
  body: string
  headers: http.IncomingHttpHeaders
  truncated: boolean
}

function requestOnce(url: URL, headers: Record<string, string>, maxBytes: number, deadline: number): Promise<OnceResult> {
  return new Promise<OnceResult>((resolve, reject) => {
    const remaining = deadline - Date.now()
    if (remaining <= 0) return reject(new SafeFetchError(TIMEOUT_MESSAGE))
    let settled = false
    let timer: NodeJS.Timeout | undefined
    const ok = (v: OnceResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(v)
    }
    const fail = (e: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(e)
    }

    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(
      url,
      {
        method: 'GET',
        agent: false, // 不复用连接：连接池里的 socket 可能是别的域名解析出来的，绕过本次 lookup 校验
        lookup: safeLookup as unknown as typeof dns.lookup,
        headers: { 'Accept-Encoding': 'gzip, deflate, br', ...headers },
      },
      (res) => {
        res.on('error', fail)
        const status = res.statusCode || 0
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume()
          return ok({ status, location: String(res.headers.location), body: '', headers: res.headers, truncated: false })
        }
        const enc = String(res.headers['content-encoding'] || '').toLowerCase().trim()
        let stream: Readable = res
        if (enc === 'gzip' || enc === 'x-gzip') stream = res.pipe(zlib.createGunzip())
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate())
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress())

        // 与 Response.text() 一致：固定按 UTF-8 解码并去掉 BOM；stream 模式保留跨块的半个字符
        const decoder = new TextDecoder('utf-8', { fatal: false })
        let body = ''
        let got = 0
        let truncated = false
        const finish = () => {
          body += decoder.decode()
          ok({ status, body, headers: res.headers, truncated })
        }
        stream.on('data', (chunk: Buffer) => {
          if (settled) return
          const room = maxBytes - got
          const part = chunk.length > room ? chunk.subarray(0, room) : chunk
          got += part.length
          body += decoder.decode(part, { stream: true })
          if (got >= maxBytes) {
            truncated = true
            finish()
            req.destroy()
          }
        })
        stream.on('end', finish)
        stream.on('error', fail)
        // 对端提前断开：没有 end 就 close。已经 finish 过的这里是空操作
        stream.on('close', () => fail(new SafeFetchError('连接中断', status)))
      }
    )
    timer = setTimeout(() => {
      fail(new SafeFetchError(TIMEOUT_MESSAGE))
      req.destroy()
    }, remaining)
    req.on('error', fail)
    req.end()
  })
}
