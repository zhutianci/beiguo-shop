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

// scryptSync 是刻意设计成慢的（本机实测约 22ms/次）。密钥只由 SECRET+SALT 决定、进程内恒定，
// 每次加解密都重算会让「列表 200 行逐条解密」变成数秒的同步阻塞，期间 Node 单线程整站无响应。
let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (!cardKeyConfigured()) throw new Error('CARDKEY_SECRET 未配置（至少 8 位）')
  if (!cachedKey) cachedKey = crypto.scryptSync(SECRET, SALT, 32)
  return cachedKey
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

/**
 * 导出文件专用的强脱敏：一个明文字符都不给，只留长度。
 *
 * 【为什么不复用 maskSecret】maskSecret 露前 4 + 后 4，是给管理员自己屏幕上做视觉提示的
 * ——只停留一瞬。而「脱敏版」导出文件的定位是「可以发给财务 / 合作方」的那一份，
 * 露 8 个字符就成了实打实的凭据片段：12 位兑换码只剩 4 位未知（36^4≈168 万，可枚举），
 * 账号密码型卡还会把账号开头和密码结尾漏出去。导出文件里必须一个字符都不留。
 */
export function maskSecretForExport(plain: string): string {
  // 用 .length（UTF-16 长度）而不是展开成码点：tsconfig target 低，展开字符串会触发
  // downlevelIteration 报错（见交接文档踩过的坑）；卡密都是 ASCII/base64，长度显示没差别
  const n = (plain || '').length
  return n > 0 ? `****（共 ${n} 位）` : ''
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
  /*
   * 单语句「数 + 写」：原来 count 和 update 分两步，并发发卡 / 导入时晚到的旧计数会盖掉新的，
   * 前台库存短暂偏高（可能多卖）。delivery_type 条件等价于原来的「非 AUTO 直接返回」。
   * updated_at 手写：@updatedAt 由 Prisma 客户端维护，原生 SQL 不会自动刷新（sitemap 用它做商品 lastmod，保持原行为）；
   * 传 JS Date 的写法同 lib/marketing/worker.ts。
   */
  await prisma.$executeRaw`
    UPDATE products
       SET stock = (SELECT COUNT(*) FROM card_keys WHERE product_id = ${productId} AND status = 'UNUSED'),
           updated_at = ${new Date()}
     WHERE id = ${productId} AND delivery_type = 'AUTO'`
}
