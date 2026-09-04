// 金额转人民币大写。单独成文件（不 import node:crypto），以便客户端组件也能直接引用做实时预览。
//
// 规则（财务惯例）：
//   - 零只在「非零数字之间」读出，末尾的零不读：1430 → 壹仟肆佰叁拾元整（不是 …叁拾零元整）
//   - 分组之间缺高位要补零：10001 → 壹万零壹元整（不是 壹万壹元整）
//   - 连续多个零只读一个：1004 → 壹仟零肆
// 自测：npx tsx scripts/check-money.ts

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const INT_UNITS = ['', '拾', '佰', '仟']
const BIG_UNITS = ['', '万', '亿', '兆']

/** 把一个 0 < g < 10000 的分组转成大写，末尾零丢弃、内部连续零合并成一个 */
function groupToChinese(g: number): string {
  let s = ''
  let pos = 0
  let zeroRun = false
  while (g > 0) {
    const d = g % 10
    if (d === 0) {
      zeroRun = true
    } else {
      // s 为空说明还没有更低位的非零数字，此处的零属于「末尾零」，不读
      if (zeroRun && s) s = '零' + s
      s = DIGITS[d] + INT_UNITS[pos] + s
      zeroRun = false
    }
    g = Math.floor(g / 10)
    pos++
  }
  return s
}

export function rmbCapital(n: number): string {
  if (!isFinite(n)) return ''

  const neg = n < 0
  const cents = Math.abs(Math.round(n * 100)) // 统一按「分」算，规避浮点误差
  const fen = cents % 10
  const jiao = Math.floor(cents / 10) % 10
  const intPart = Math.floor(cents / 100)

  // ---- 整数部分：先按万进制拆组（低位在前），再从高位往低位拼 ----
  let intStr = ''
  if (intPart === 0) {
    intStr = '零'
  } else {
    const groups: number[] = []
    let rest = intPart
    while (rest > 0) {
      groups.push(rest % 10000)
      rest = Math.floor(rest / 10000)
    }

    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i]
      // 整组为 0：本身不产生字符，它造成的断档由上一组末尾补的「零」表达
      if (g === 0) continue

      intStr += groupToChinese(g) + BIG_UNITS[i]

      // 紧邻的低一组不足四位（高位缺失）且低位还有内容 → 组间补零，如 壹万零壹
      if (i > 0 && groups[i - 1] < 1000) {
        const lowerNonZero = groups.slice(0, i).some((x) => x > 0)
        if (lowerNonZero) intStr += '零'
      }
    }
  }

  let result = intStr + '元'
  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) result += DIGITS[jiao] + '角'
    else if (fen > 0) result += '零' // 有分无角，中间要读零
    if (fen > 0) result += DIGITS[fen] + '分'
  }

  return (neg ? '负' : '') + result
}
