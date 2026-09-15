/**
 * xlsx 生成器的自测。**不连数据库、不发网络请求**，照 scripts/check-invoice-export.ts 的形式。
 *   npx tsx scripts/check-xlsx.ts
 *
 * 为什么值得单开一个自测：卡密导出是 src/lib/xlsx.ts 的第一个使用方，而这个模块
 * 的两类失败**都是静默的**，tsc 和 next build 一个都拦不住：
 *
 *  ① 结构写错 → Excel 弹「文件已损坏，是否修复」，或者干脆打不开。
 *     OOXML 对元素顺序、count 属性、部件引用极其挑剔，而报错信息毫无指向性。
 *  ② 类型写错 → 文件能打开，但**卡密被悄悄改写**：`1234567890123456` 变成
 *     `1.23457E+15`、`0012-3456` 丢前导零、`2024-1-1-ABCD` 被当成日期。
 *     运营照着这份表去发货，买家拿到的是废卡，而且对着表看不出哪里不对。
 *
 * 这里把生成的 zip 拆开、逐个 XML 断言，覆盖的就是上面这两类。
 */
import { unzipSync } from 'fflate'
import { buildXlsx, xlsxTime, type XlsxColumn, type XlsxValue } from '../src/lib/xlsx'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}

const dec = new TextDecoder('utf-8')
function partsOf(bytes: Uint8Array): Record<string, string> {
  const zip = unzipSync(bytes)
  const out: Record<string, string> = {}
  Object.keys(zip).forEach((k) => {
    out[k] = dec.decode(zip[k])
  })
  return out
}

// ---------------- ① 结构完整性 ----------------
console.log('\n【结构】六个部件与交叉引用')

const basic = buildXlsx({
  sheetName: '卡密明细',
  columns: [{ header: 'A' }, { header: 'B', type: 'number' }],
  rows: [['x', 1]],
})
const p = partsOf(basic)

;[
  '[Content_Types].xml',
  '_rels/.rels',
  'xl/workbook.xml',
  'xl/_rels/workbook.xml.rels',
  'xl/styles.xml',
  'xl/worksheets/sheet1.xml',
].forEach((name) => ok(`部件存在：${name}`, !!p[name]))

ok('Content_Types 覆盖 workbook', p['[Content_Types].xml'].includes('/xl/workbook.xml'))
ok('Content_Types 覆盖 sheet1', p['[Content_Types].xml'].includes('/xl/worksheets/sheet1.xml'))
ok('Content_Types 覆盖 styles', p['[Content_Types].xml'].includes('/xl/styles.xml'))
ok('根 rels 指向 workbook', p['_rels/.rels'].includes('Target="xl/workbook.xml"'))
ok('workbook rels 指向 sheet1', p['xl/_rels/workbook.xml.rels'].includes('Target="worksheets/sheet1.xml"'))
ok('workbook rels 指向 styles', p['xl/_rels/workbook.xml.rels'].includes('Target="styles.xml"'))
ok('workbook 里 sheet 用 rId1', p['xl/workbook.xml'].includes('r:id="rId1"'))

// styles 的 count 必须与实际子元素数一致，对不上 Excel 直接判损坏
const styles = p['xl/styles.xml']
const countOf = (tag: string) => Number(styles.match(new RegExp(`<${tag} count="(\\d+)"`))?.[1] ?? -1)
const childOf = (tag: string, child: string) =>
  (styles.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1].match(new RegExp(`<${child}[ />]`, 'g')) || [])
    .length
ok('fonts count 与实际一致', countOf('fonts') === childOf('fonts', 'font'), `count=${countOf('fonts')} 实际=${childOf('fonts', 'font')}`)
ok('fills count 与实际一致', countOf('fills') === childOf('fills', 'fill'), `count=${countOf('fills')} 实际=${childOf('fills', 'fill')}`)
ok('borders count 与实际一致', countOf('borders') === childOf('borders', 'border'))
ok('cellXfs count 与实际一致', countOf('cellXfs') === childOf('cellXfs', 'xf'))
// 缺了它 openpyxl 会告警「没有默认样式」，各家读取方只能自己猜
ok('有 cellStyles 默认样式', styles.includes('<cellStyles count="1">'))

// worksheet 子元素顺序是 schema 规定死的，顺序错了 Excel 不会给任何有用提示
const sheet = p['xl/worksheets/sheet1.xml']
const order = ['<dimension', '<sheetViews', '<sheetFormatPr', '<cols', '<sheetData', '<autoFilter']
const positions = order.map((t) => sheet.indexOf(t))
ok('worksheet 子元素齐全', positions.every((i) => i >= 0), JSON.stringify(positions))
ok(
  'worksheet 子元素顺序符合 schema',
  positions.every((v, i) => i === 0 || v > positions[i - 1]),
  JSON.stringify(positions)
)
ok('冻结首行', sheet.includes('state="frozen"') && sheet.includes('ySplit="1"'))
ok('开了自动筛选', /<autoFilter ref="A1:B2"/.test(sheet))
ok('表头用加粗样式 s="1"', /<c r="A1" s="1"/.test(sheet))

// ---------------- ② 值不被改写 ----------------
console.log('\n【取值】看起来像数字/日期的卡密，必须原样保留')

const columns: XlsxColumn[] = [
  { header: 'ID', type: 'number' },
  { header: '卡密' },
  { header: '金额', type: 'number' },
]
const tricky: XlsxValue[][] = [
  [1, '1234567890123456', 12.5],
  [2, '0012-3456-7890', 0],
  [3, '2024-1-1-ABCD', null],
  [4, 'a&b<c>d"e', null],
  [5, '  两端有空格  ', null],
  [6, '1E5', null],
]
const t = partsOf(buildXlsx({ sheetName: 'x', columns, rows: tricky }))['xl/worksheets/sheet1.xml']

ok('长数字串写成 inlineStr 而不是数值', t.includes('>1234567890123456</t>') && !t.includes('<v>1234567890123456</v>'))
ok('前导零保留', t.includes('>0012-3456-7890</t>'))
ok('类日期串没被转成日期', t.includes('>2024-1-1-ABCD</t>'))
ok('XML 特殊字符被转义', t.includes('a&amp;b&lt;c&gt;d"e'))
ok('保留两端空格（xml:space）', t.includes('xml:space="preserve"') && t.includes('>  两端有空格  </t>'))
ok('科学计数法样式的字符串仍是文本', t.includes('>1E5</t>'))
ok('数值列写成 <v>', t.includes('<v>12.5</v>'))
// 「未知」和「零」在成本利润表上是两件事，null 必须是空格子而不是 0
ok('null 是空格子不是 0', /<c r="C4"\/>/.test(t), t.match(/<c r="C4"[^>]*\/?>/)?.[0] || '(未找到 C4)')
ok('数值 0 照常写 0', t.includes('<v>0</v>'))

console.log('\n【取值】边界')
const edge = partsOf(
  buildXlsx({
    sheetName: 'x',
    columns: [{ header: 'v' }, { header: 'n', type: 'number' }],
    rows: [
      ['x'.repeat(40000), Number.NaN],
      // 控制字符用转义写，绝不往源码里写字面 NUL/BEL —— 那会让 git 把整个文件当二进制
      [String.fromCharCode(0, 7) + 'ctrl' + String.fromCharCode(0x1f), Number.POSITIVE_INFINITY],
    ],
  })
)['xl/worksheets/sheet1.xml']
const longCell = edge.match(/<t xml:space="preserve">(x+…?)<\/t>/)?.[1] || ''
ok('超长截断到 32767 以内', longCell.length > 0 && longCell.length <= 32767, `实际 ${longCell.length}`)
ok('控制字符被剔除', edge.includes('>ctrl</t>'))
// U+FFFE / U+FFFF 是 XML 1.0 Char production 之外的码点，漏剔一个整份 sheet1.xml 就非良构
const nc = partsOf(
  buildXlsx({ sheetName: 'x', columns: [{ header: 'v' }], rows: [['X￾Y'], ['A￿B']] })
)['xl/worksheets/sheet1.xml']
ok('U+FFFE 被剔除', nc.includes('>XY</t>') && !nc.includes('￾'))
ok('U+FFFF 被剔除', nc.includes('>AB</t>') && !nc.includes('￿'))
// U+FDD0 是 noncharacter 但 XML 1.0 允许，不能误杀（误杀=改写数据）
const keep = partsOf(buildXlsx({ sheetName: 'x', columns: [{ header: 'v' }], rows: [['A﷐B']] }))['xl/worksheets/sheet1.xml']
ok('U+FDD0 保留（不误杀）', keep.includes('A﷐B'))
// NaN/Infinity 写进 <v> 会让 Excel 判文件非法，必须退回文本
ok('NaN 不写进数值格', !edge.includes('<v>NaN</v>'))
ok('Infinity 不写进数值格', !edge.includes('<v>Infinity</v>'))

// ---------------- ③ 列名进位 ----------------
console.log('\n【列名】26 进位边界')
const wide = partsOf(
  buildXlsx({
    sheetName: 'x',
    columns: Array.from({ length: 703 }, (_, i) => ({ header: `c${i}` })),
    rows: [Array.from({ length: 703 }, () => 'v')],
  })
)['xl/worksheets/sheet1.xml']
ok('第 26 列是 Z', wide.includes('<c r="Z1"'))
ok('第 27 列是 AA', wide.includes('<c r="AA1"'))
ok('第 52 列是 AZ', wide.includes('<c r="AZ1"'))
ok('第 53 列是 BA', wide.includes('<c r="BA1"'))
ok('第 703 列是 AAA', wide.includes('<c r="AAA1"'))

// ---------------- ④ 表名与空表 ----------------
console.log('\n【其它】表名清洗与空数据')
const named = partsOf(buildXlsx({ sheetName: 'a/b[c]:d*e?f', columns: [{ header: 'x' }], rows: [['1']] }))
ok('表名里的非法字符被替换', !/[[\]:*?/\\]/.test(named['xl/workbook.xml'].match(/name="([^"]*)"/)?.[1] || 'x'))
const longName = partsOf(buildXlsx({ sheetName: '名'.repeat(50), columns: [{ header: 'x' }], rows: [['1']] }))
ok('表名截到 31 字符', (longName['xl/workbook.xml'].match(/name="([^"]*)"/)?.[1] || '').length <= 31)

const empty = partsOf(buildXlsx({ sheetName: 'x', columns: [{ header: 'a' }, { header: 'b' }], rows: [] }))[
  'xl/worksheets/sheet1.xml'
]
ok('零行时 dimension 仍合法', /<dimension ref="A1:B1"/.test(empty), empty.match(/<dimension[^>]*>/)?.[0] || '')
ok('零行时只有表头', (empty.match(/<row /g) || []).length === 1)

// ---------------- ⑤ 时间 ----------------
console.log('\n【时间】固定按北京时间输出，不受容器时区影响')
ok('UTC 06:30 → 北京 14:30', xlsxTime(new Date('2026-09-15T06:30:00Z')) === '2026-09-15 14:30:00', xlsxTime(new Date('2026-09-15T06:30:00Z')))
ok('跨日：UTC 16:00 → 次日 00:00', xlsxTime(new Date('2026-09-15T16:00:00Z')) === '2026-09-16 00:00:00', xlsxTime(new Date('2026-09-15T16:00:00Z')))
ok('null 给空串', xlsxTime(null) === '')
ok('非法日期给空串', xlsxTime('not-a-date') === '')
// 这个格式按字典序排就等于按时间排，导出的表才能直接在 Excel 里排序
ok('字典序 == 时间序', xlsxTime(new Date('2026-01-02T00:00:00Z')) < xlsxTime(new Date('2026-10-02T00:00:00Z')))

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
