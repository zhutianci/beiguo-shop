/**
 * 邮箱归属证明的客户端兜底（服务端见 lib/email-proof.ts）。
 *
 * 正常浏览器靠 httpOnly cookie `lk` 就够了；但微信等 App 内置浏览器常常不保存 fetch 响应里下发的
 * httpOnly cookie（lib/auth-token.ts 记录过同一个坑），验码成功后接口仍然回「请先验证邮箱」、买家卡死。
 * 所以验证接口同时在响应体里给出同一张签名证明：存进 sessionStorage，调相关接口时用 X-Email-Proof 头带回。
 * 只存 sessionStorage（关页即失效），证明本身 30 分钟过期、只含邮箱摘要。
 */
const KEY = 'email-proof'

export function saveEmailProof(proof: unknown): void {
  if (typeof proof !== 'string' || !proof) return
  try {
    sessionStorage.setItem(KEY, proof)
  } catch {
    /* 隐私模式等存不了就算了，cookie 仍然生效 */
  }
}

export function clearEmailProof(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** 需要邮箱证明的接口，把这个展开进 fetch 的 headers */
export function emailProofHeaders(): Record<string, string> {
  try {
    const v = sessionStorage.getItem(KEY)
    return v ? { 'X-Email-Proof': v } : {}
  } catch {
    return {}
  }
}
