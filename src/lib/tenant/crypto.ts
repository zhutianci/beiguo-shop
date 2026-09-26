/**
 * 渠道分站的对称加密（设计 5.1、4.7、6.5.3）：收款账号（payee）、企业微信 webhook（webhook）的落库加密，
 * 以及将来的委托令牌签名（tenant-reply、viewas）。
 *
 * 【两类密钥，来源不同】（主会话 D8）
 *  · 落库数据（payee、webhook）：HKDF-SHA256(ikm = TENANT_DATA_KEY, salt = 固定字符串, info = 用途)。
 *    TENANT_DATA_KEY 是**专用**环境变量（≥32 字节随机，hex 或 base64），与 JWT_SECRET 解耦：站长会轮换 JWT_SECRET
 *    （让所有会话失效），而已录入的收款账号、webhook 不能因此变成解不开的密文。这把钥匙生成一次、永不更换（见部署说明）。
 *    缺失或过短时 **fail closed**：抛 DataKeyMissingError（name='DataKeyMissingError'、code='DATA_KEY_MISSING'），
 *    调用方（admin-tenants）转成「未配置数据密钥」提示；绝不退回 JWT_SECRET 或任何固定值，也绝不存明文。
 *  · 令牌签名（tenant-reply、viewas）：仍从 JWT_SECRET 派生（D8 允许）。它们是短时凭证，随 JWT_SECRET 轮换一起失效正是想要的。
 *  · 用途隔离：拿到 webhook 密文与明文也推不出 payee 的密钥；委托令牌不能被当成密文解。
 *
 * 【格式】`v1.<iv>.<tag>.<cipher>`（base64url，AES-256-GCM，12 字节随机 IV）；用途同时作为 AAD，
 *  payee 的密文换到 webhook 列上解密会直接失败。首段 `v1` 是密钥版本：将来真要换数据密钥时，
 *  新密文写 `v2.`，openText 按前缀选钥匙，旧密文照常能解，后台逐行重新加密后再下线旧钥匙。
 *  （本期只有 v1；渠道功能尚未上线，库里没有按旧口径——JWT_SECRET 派生——加密的数据，所以沿用 v1 不会混淆。）
 *
 * 【谁能 import】只有平台侧与 partner-facade（WP3）、admin-tenants（WP5）。partner-services / handlers 不许 import 本文件
 * （边界检查规则 3），渠道设置 webhook 经 facade 的 setTenantWebhook 完成。
 * 用途 viewas 的派生只允许出现在 src/lib/tenant/view-as.ts（P1，边界检查规则 9）。
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'crypto'
import { getJwtSecret } from '../jwt-secret'

export type KeyPurpose = 'payee' | 'webhook' | 'tenant-reply' | 'viewas'
export type SealPurpose = 'payee' | 'webhook'

/** 落库数据密钥的 HKDF salt（与令牌签名用的 salt 不同：两类 ikm 本就不同，salt 再分开一层） */
const DATA_SALT = 'bigolab-tenant-data-v1'
const TOKEN_SALT = 'bigolab-tenant-kdf-v1'
const PURPOSES: ReadonlySet<string> = new Set(['payee', 'webhook', 'tenant-reply', 'viewas'])
const DATA_PURPOSES: ReadonlySet<string> = new Set(['payee', 'webhook'])
/** TENANT_DATA_KEY 解码后至少 32 字节（256 位） */
const MIN_DATA_KEY_BYTES = 32

/** 数据密钥缺失或不合规。按 name / code 识别（跨模块实例、tsx 与 next 各自的模块副本都认得出） */
export class DataKeyMissingError extends Error {
  readonly code = 'DATA_KEY_MISSING'
  constructor(detail: string) {
    super(`[tenant/crypto] 未配置数据密钥（TENANT_DATA_KEY）：${detail}`)
    this.name = 'DataKeyMissingError'
  }
}

/**
 * 解析 TENANT_DATA_KEY：先按 hex（偶数长度、全是十六进制字符），否则按 base64 / base64url。
 * 解码后不足 32 字节、或含 hex / base64 以外的字符，一律视为未配置——宁可录不进，也不用一把弱钥匙。
 */
export function parseDataKey(raw: string | undefined): Buffer {
  const v = (raw ?? '').trim()
  if (!v) throw new DataKeyMissingError('环境变量为空')
  let key: Buffer
  if (/^[0-9a-f]+$/i.test(v) && v.length % 2 === 0) {
    key = Buffer.from(v, 'hex')
  } else if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(v)) {
    key = Buffer.from(v.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  } else {
    throw new DataKeyMissingError('既不是 hex 也不是 base64')
  }
  if (key.length < MIN_DATA_KEY_BYTES) throw new DataKeyMissingError(`解码后只有 ${key.length} 字节，至少要 ${MIN_DATA_KEY_BYTES} 字节`)
  return key
}

export function deriveKey(purpose: KeyPurpose): Buffer {
  if (!PURPOSES.has(purpose)) throw new Error('[tenant/crypto] 未知的密钥用途')
  if (DATA_PURPOSES.has(purpose)) {
    // 每次调用都读环境变量（便宜）：测试里会临时清空它验证 fail closed；生产上它永不变化
    const ikm = parseDataKey(process.env.TENANT_DATA_KEY)
    return Buffer.from(hkdfSync('sha256', ikm, Buffer.from(DATA_SALT, 'utf8'), Buffer.from(`tenant:${purpose}`, 'utf8'), 32))
  }
  const secret = getJwtSecret()
  // fail closed：没有密钥就不签也不验，绝不退回某个固定值
  if (!secret) throw new Error('[tenant/crypto] JWT_SECRET 未配置，无法派生令牌密钥')
  return Buffer.from(hkdfSync('sha256', Buffer.from(secret, 'utf8'), Buffer.from(TOKEN_SALT, 'utf8'), Buffer.from(`tenant:${purpose}`, 'utf8'), 32))
}

function b64u(b: Buffer): string {
  return b.toString('base64url')
}

export function sealText(purpose: SealPurpose, plain: string): string {
  if (purpose !== 'payee' && purpose !== 'webhook') throw new Error('[tenant/crypto] sealText 只用于 payee / webhook')
  if (typeof plain !== 'string') throw new Error('[tenant/crypto] 明文必须是字符串')
  const key = deriveKey(purpose)
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key, iv)
  c.setAAD(Buffer.from(purpose, 'utf8'))
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return `v1.${b64u(iv)}.${b64u(c.getAuthTag())}.${b64u(enc)}`
}

export function openText(purpose: SealPurpose, sealed: string): string {
  if (purpose !== 'payee' && purpose !== 'webhook') throw new Error('[tenant/crypto] openText 只用于 payee / webhook')
  const parts = typeof sealed === 'string' ? sealed.split('.') : []
  if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('[tenant/crypto] 密文格式不对')
  const [, iv, tag, enc] = parts
  const d = createDecipheriv('aes-256-gcm', deriveKey(purpose), Buffer.from(iv, 'base64url'))
  d.setAAD(Buffer.from(purpose, 'utf8'))
  d.setAuthTag(Buffer.from(tag, 'base64url'))
  // 篡改、用途不符、密钥轮换都会在 final() 抛错
  return Buffer.concat([d.update(Buffer.from(enc, 'base64url')), d.final()]).toString('utf8')
}
