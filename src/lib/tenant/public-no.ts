/**
 * 渠道侧公开编号（设计 6.3）。全局自增 id 的号段间隙会暴露「其他渠道是否存在」及其客户、上架、通知规模，
 * 所以渠道 DTO 与 URL 里一律用这些随机编号寻址：
 *   listingNo / customerNo / noticeNo = 12 位随机 base32（60 bit）
 *   requestNo   = 'AS' + yyMMdd + 8 位随机 base32
 *   statementNo = 'ST' + yyMMdd + 8 位随机 base32
 * 都不含全局序号与 tenantId。日期按东八区（与站长对账口径一致）。
 *
 * 字母表用 Crockford base32（去掉 I L O U，避免人工抄写时 1/I/L、0/O 混淆）。
 * 每个字符取一个随机字节的低 5 位：256 是 32 的整数倍，分布严格均匀，无取模偏差。
 * 冲突概率极低但不为零：写入方都靠唯一约束兜底（P2002 / skipDuplicates 后复查并重试）。
 */
import { randomBytes } from 'crypto'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function randomBase32(len: number): string {
  const bytes = randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] & 31]
  return out
}

/** 东八区 yyMMdd */
function yymmddCn(d: Date): string {
  const t = new Date(d.getTime() + 8 * 3600 * 1000)
  const yy = String(t.getUTCFullYear() % 100).padStart(2, '0')
  const mm = String(t.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(t.getUTCDate()).padStart(2, '0')
  return yy + mm + dd
}

export const PUBLIC_NO_PATTERN = /^[0-9A-HJKMNP-TV-Z]{12}$/
export const REQUEST_NO_PATTERN = /^AS\d{6}[0-9A-HJKMNP-TV-Z]{8}$/
export const STATEMENT_NO_PATTERN = /^ST\d{6}[0-9A-HJKMNP-TV-Z]{8}$/

/** listingNo / customerNo / noticeNo */
export function newPublicNo(): string {
  return randomBase32(12)
}

export function newRequestNo(): string {
  return 'AS' + yymmddCn(new Date()) + randomBase32(8)
}

export function newStatementNo(): string {
  return 'ST' + yymmddCn(new Date()) + randomBase32(8)
}

/** 渠道从 URL / body 传来的编号先过格式（大小写不敏感地转大写），不合格直接按不存在处理，不去查库 */
export function parsePublicNo(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const s = raw.trim().toUpperCase()
  return PUBLIC_NO_PATTERN.test(s) ? s : null
}
