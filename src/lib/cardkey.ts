import crypto from 'crypto'
import { prisma } from './db'

// ============ 卡密加密（AES-256-GCM）============
// 卡密内容静态加密存库：即使数据库泄露，没有 CARDKEY_SECRET 也无法还原卡密。
// 存储格式：base64(iv).base64(authTag).base64(ciphertext)

const SECRET = process.env.CARDKEY_SECRET || ''
// 固定盐用于派生密钥与去重哈希（与 SECRET 一起才有意义）
const SALT = 'beiguo-cardkey-v1'

export function cardKeyConfigured(): boolean {
  return SECRET.length >= 8
}

function getKey(): Buffer {
  if (!cardKeyConfigured()) throw new Error('CARDKEY_SECRET 未配置（至少 8 位）')
  return crypto.scryptSync(SECRET, SALT, 32)
}

export function encryptCardContent(plain: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decryptCardContent(stored: string): string {
  const key = getKey()
  const [ivB64, tagB64, dataB64] = stored.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('卡密密文格式错误')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}

// 去重哈希：同商品内同一卡密只导入一次（不可逆，泄露也无法还原）
export function cardContentHash(plain: string): string {
  return crypto.createHash('sha256').update(`${SALT}|${plain}`).digest('hex')
}

// 列表展示用的脱敏（不解密也能给个提示；这里对已解密明文做掩码）
export function maskSecret(plain: string): string {
  if (!plain) return ''
  if (plain.length <= 4) return '****'
  if (plain.length <= 10) return plain.slice(0, 2) + '****' + plain.slice(-2)
  return plain.slice(0, 4) + '****' + plain.slice(-4)
}

// 自动发货商品：库存 = 未使用卡密数量
export async function syncAutoStock(productId: number) {
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { deliveryType: true } })
  if (!p || p.deliveryType !== 'AUTO') return
  const unused = await prisma.cardKey.count({ where: { productId, status: 'UNUSED' } })
  await prisma.product.update({ where: { id: productId }, data: { stock: unused } })
}
