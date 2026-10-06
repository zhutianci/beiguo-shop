/**
 * SimHash 查重（内容平台 P2，设计 §6.2）。纯函数，scripts/check-content-policy.ts 直接测。
 *
 * 中文没有空格，按「字二元组 + 英文单词」切特征；64 位 FNV-1a 哈希；海明距离 ≤ NEAR_DUP_DISTANCE 视为近重复。
 * 只用来「转人工」：命中的内容进待审并在审核备注里写明与哪一条相似，不直接拒绝。
 */
// tsconfig 的 target 低于 ES2020，不能写 BigInt 字面量（1n），一律用 BigInt(…)
const MASK = (BigInt(1) << BigInt(64)) - BigInt(1)
const FNV_OFFSET = BigInt('0xcbf29ce484222325')
const FNV_PRIME = BigInt('0x100000001b3')

function fnv1a64(s: string): bigint {
  let h = FNV_OFFSET
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i))
    h = (h * FNV_PRIME) & MASK
  }
  return h
}

/** 特征：去掉标点与空白后的汉字二元组 + 小写英文单词 / 数字串 */
export function features(text: string): string[] {
  const out: string[] = []
  const lower = text.toLowerCase()
  for (const w of lower.match(/[a-z0-9]{2,}/g) ?? []) out.push(w)
  const han = lower.replace(/[^一-鿿]/g, '')
  for (let i = 0; i + 1 < han.length; i++) out.push(han.slice(i, i + 2))
  return out
}

/** 64 位 SimHash，16 位十六进制；特征太少（< 8）返回 null——短文本谈不上「重复」 */
export function simhash(text: string): string | null {
  const feats = features(text)
  if (feats.length < 8) return null
  const v = new Array<number>(64).fill(0)
  for (const f of feats) {
    const h = fnv1a64(f)
    for (let i = 0; i < 64; i++) v[i] += (h >> BigInt(i)) & BigInt(1) ? 1 : -1
  }
  let out = BigInt(0)
  for (let i = 0; i < 64; i++) if (v[i] > 0) out |= BigInt(1) << BigInt(i)
  return out.toString(16).padStart(16, '0')
}

export function hamming(a: string, b: string): number {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`)
  let n = 0
  while (x) {
    n += Number(x & BigInt(1))
    x >>= BigInt(1)
  }
  return n
}

// 设计稿写的是 ≤3（长文档的经验值）；提示词与短文实测：几乎相同的两段距离 7、无关的两段约 18（随机期望 32），所以取 8
export const NEAR_DUP_DISTANCE = 8
