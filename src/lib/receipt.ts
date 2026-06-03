import crypto from 'crypto'

// 收款人（固定）
export const PAYEE = '益阳市赫山区必高科技有限公司'

export function genReceiptNo(): string {
  return 'SJ' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase()
}

// 不可枚举的公开访问令牌（128-bit）
export function genReceiptToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// 金额转人民币大写
export function rmbCapital(n: number): string {
  if (!isFinite(n)) return ''
  if (n === 0) return '零元整'
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const intUnits = ['', '拾', '佰', '仟']
  const bigUnits = ['', '万', '亿', '兆']
  const neg = n < 0
  let num = Math.abs(Math.round(n * 100)) // 以分为单位
  const fen = num % 10
  const jiao = Math.floor(num / 10) % 10
  let intPart = Math.floor(num / 100)

  let intStr = ''
  if (intPart === 0) {
    intStr = '零'
  } else {
    let unitIdx = 0
    while (intPart > 0) {
      const group = intPart % 10000
      if (group > 0) {
        let groupStr = ''
        let g = group
        let pos = 0
        let zeroFlag = false
        while (g > 0) {
          const d = g % 10
          if (d === 0) {
            zeroFlag = true
          } else {
            if (zeroFlag) groupStr = '零' + groupStr
            groupStr = digits[d] + intUnits[pos] + groupStr
            zeroFlag = false
          }
          g = Math.floor(g / 10)
          pos++
        }
        intStr = groupStr + bigUnits[unitIdx] + intStr
      } else {
        // 该组为 0，且后面还有更高位 → 补零（避免重复）
        if (intStr && !intStr.startsWith('零')) intStr = '零' + intStr
      }
      intPart = Math.floor(intPart / 10000)
      unitIdx++
    }
  }

  let result = intStr + '元'
  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) result += digits[jiao] + '角'
    else if (fen > 0) result += '零'
    if (fen > 0) result += digits[fen] + '分'
  }
  return (neg ? '负' : '') + result
}
