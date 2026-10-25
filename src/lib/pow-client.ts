/**
 * 无感人机验证的浏览器端（服务端与协议见 lib/security/pow.ts）。
 *
 * 用法：提交登录 / 注册 / 发码 / 找回密码 / 邮箱查订阅之前
 *   const pow = await powHeaders('login')
 *   fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...pow }, body })
 * 取题 → 在 Web Worker 里算（不卡页面）→ 返回请求头 { 'x-pow': ... }。任何一步失败都返回 {}，
 * 让服务端回「安全校验未通过，请刷新页面后重试」，不在前端吞掉错误。
 */
export type PowPurpose = 'login' | 'register' | 'send' | 'reset' | 'lookup'

/**
 * 求解：找 nonce 使 SHA-256(challenge + "." + nonce) 的前 bits 位为 0。从 start 起试 count 个，找不到返回 null。
 * **必须自包含**（不引用外部变量）：它会被 toString() 塞进 Web Worker 里运行。
 * 纯 JS 的 SHA-256，challenge 的整块前缀先算成中间状态（midstate），每个 nonce 只再算最后一两块。
 */
export function powSolve(challenge: string, bits: number, start: number, count: number): string | null {
  const K = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ])
  const W = new Int32Array(64)
  const compress = (H: Int32Array, block: Uint8Array, off: number) => {
    let t = 0
    for (t = 0; t < 16; t++) {
      const p = off + 4 * t
      W[t] = (block[p] << 24) | (block[p + 1] << 16) | (block[p + 2] << 8) | block[p + 3]
    }
    for (t = 16; t < 64; t++) {
      const x = W[t - 15]
      const y = W[t - 2]
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10)
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0
    }
    let a = H[0]
    let b = H[1]
    let c = H[2]
    let d = H[3]
    let e = H[4]
    let f = H[5]
    let g = H[6]
    let h = H[7]
    for (t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[t] + W[t]) | 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) | 0
      h = g
      g = f
      f = e
      e = (d + t1) | 0
      d = c
      c = b
      b = a
      a = (t1 + t2) | 0
    }
    H[0] = (H[0] + a) | 0
    H[1] = (H[1] + b) | 0
    H[2] = (H[2] + c) | 0
    H[3] = (H[3] + d) | 0
    H[4] = (H[4] + e) | 0
    H[5] = (H[5] + f) | 0
    H[6] = (H[6] + g) | 0
    H[7] = (H[7] + h) | 0
  }
  const pre = challenge + '.'
  const plen = pre.length
  const pb = new Uint8Array(plen)
  for (let i = 0; i < plen; i++) pb[i] = pre.charCodeAt(i) & 0xff
  const full = Math.floor(plen / 64) * 64
  const mid = new Int32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  for (let o = 0; o < full; o += 64) compress(mid, pb, o)
  const tail = pb.subarray(full)
  const tailLen = plen - full
  const buf = new Uint8Array(128)
  const H = new Int32Array(8)
  for (let n = start; n < start + count; n++) {
    const nonce = n.toString(36)
    const rem = tailLen + nonce.length
    const blocks = rem + 9 <= 64 ? 1 : 2
    const end = blocks * 64
    buf.fill(0, 0, end)
    buf.set(tail, 0)
    for (let j = 0; j < nonce.length; j++) buf[tailLen + j] = nonce.charCodeAt(j)
    buf[rem] = 0x80
    const bitLen = (plen + nonce.length) * 8
    buf[end - 4] = (bitLen >>> 24) & 0xff
    buf[end - 3] = (bitLen >>> 16) & 0xff
    buf[end - 2] = (bitLen >>> 8) & 0xff
    buf[end - 1] = bitLen & 0xff
    H.set(mid)
    compress(H, buf, 0)
    if (blocks === 2) compress(H, buf, 64)
    let z = 0
    for (let w = 0; w < 8; w++) {
      const v = H[w] >>> 0
      if (v === 0) {
        z += 32
        continue
      }
      z += Math.clz32(v)
      break
    }
    if (z >= bits) return nonce
  }
  return null
}

const CHUNK = 1 << 18
const MAX_TRIES = 1 << 27 // 远超期望值（难题 2^21）：算到这里还没找到说明出了问题，放弃交给服务端报错

function solveInWorker(challenge: string, bits: number): Promise<string | null> {
  return new Promise((resolve) => {
    let worker: Worker | null = null
    let url = ''
    try {
      const src = `var solve=(${powSolve.toString()});self.onmessage=function(e){var d=e.data;self.postMessage(solve(d.c,d.b,d.s,d.n))}`
      url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))
      worker = new Worker(url)
    } catch {
      if (url) URL.revokeObjectURL(url)
      resolve(solveOnMainThread(challenge, bits))
      return
    }
    let start = 0
    const done = (r: string | null) => {
      worker?.terminate()
      URL.revokeObjectURL(url)
      resolve(r)
    }
    worker.onmessage = (e: MessageEvent<string | null>) => {
      if (e.data) return done(e.data)
      start += CHUNK
      if (start >= MAX_TRIES) return done(null)
      worker!.postMessage({ c: challenge, b: bits, s: start, n: CHUNK })
    }
    worker.onerror = () => {
      worker?.terminate()
      URL.revokeObjectURL(url)
      resolve(solveOnMainThread(challenge, bits))
    }
    worker.postMessage({ c: challenge, b: bits, s: 0, n: CHUNK })
  })
}

/** 不支持 Worker 的环境：主线程分段算，每段之间让出一下，页面不至于卡死 */
async function solveOnMainThread(challenge: string, bits: number): Promise<string | null> {
  const step = 1 << 15
  for (let s = 0; s < MAX_TRIES; s += step) {
    const r = powSolve(challenge, bits, s, step)
    if (r) return r
    await new Promise((res) => setTimeout(res, 0))
  }
  return null
}

export async function powHeaders(purpose: PowPurpose): Promise<Record<string, string>> {
  try {
    const res = await fetch(`/api/auth/pow?p=${purpose}`, { cache: 'no-store' })
    const j = await res.json()
    if (!j?.success || j.data?.off) return {}
    const { challenge, bits } = j.data as { challenge: string; bits: number }
    if (typeof challenge !== 'string' || typeof bits !== 'number') return {}
    const nonce = await solveInWorker(challenge, bits)
    return nonce ? { 'x-pow': `${challenge}.${nonce}` } : {}
  } catch {
    return {}
  }
}
