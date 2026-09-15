/**
 * 最小 xlsx 生成器（只做「一张表 + 表头 + 数据行」这一件事）。
 *
 * 【为什么不装 exceljs / xlsx】这台机器 1.8G 内存，exceljs 装完 20MB+、
 * 运行时把整个工作簿对象图建在内存里；而我们要的只是一张平表。
 * fflate 已经是项目依赖（发票导出在用），xlsx 本质就是一个 zip 装几个 XML，
 * 手写这几个 XML 比拖一个大包进来划算得多。
 *
 * 【为什么必须是 xlsx 而不是 csv】卡密长这样：`1234567890123456`、`0012-3456`、
 * `2024-1-1-ABCD`。csv 交给 Excel 打开时，这三种会分别变成 `1.23457E+15`、
 * 丢掉前导零、以及**被识别成日期**——卡密一旦被改写就是废卡，而且肉眼不一定看得出来。
 * xlsx 里每个单元格自带类型，写成 inlineStr 就永远是那串字符，Excel 不会自作主张。
 *
 * 【为什么用 inlineStr 而不是共享字符串表】共享表要先全量扫一遍去重、再建索引，
 * 对「导出一次就扔」的场景是纯粹的额外内存与复杂度。inlineStr 文件大一点，但流程直白。
 */

import { zipSync, type Zippable } from 'fflate'

export type XlsxValue = string | number | null | undefined

export interface XlsxColumn {
  header: string
  /** 列宽（Excel 的字符宽度单位），不填按表头长度估一个 */
  width?: number
  /**
   * 'number' 才会写成数值单元格（Excel 里能求和）。
   * 默认 'text' —— 卡密、订单号、批次号这些**看起来像数字但不是数字**的列，
   * 一旦按数值写就会被改写，所以默认必须是文本。
   */
  type?: 'text' | 'number'
}

/** XML 转义 + 剔除 XML 1.0 Char production 之外的码点（出现即整份 sheet1.xml 非良构，Excel 判损坏） */
function esc(s: string): string {
  return s
    // C0 控制符（保留 \t \n \r）+ U+FFFE/U+FFFF。漏掉后两个的话，只要一个字符落进来，
    // 整份 sheet1.xml 就非良构、Excel 判损坏、修复后整张表被丢空 —— 全有全无，不是单格乱码。
    // 刻意不含 U+FDD0-FDEF（是 noncharacter 但 XML 1.0 允许，误杀会改写数据），
    // 也不含代理区（孤立代理对已被 TextEncoder 换成 U+FFFD，到不了这里）。
    .replace(new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]', 'g'), '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 0 → A，25 → Z，26 → AA */
function colName(index: number): string {
  let n = index
  let s = ''
  for (;;) {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
    if (n < 0) break
  }
  return s
}

/** Excel 单元格上限 32767 字符，超了整份文件打不开 */
const CELL_MAX = 32767

function cellXml(ref: string, v: XlsxValue, type: 'text' | 'number', styleIdx: number): string {
  const s = styleIdx ? ` s="${styleIdx}"` : ''
  if (v === null || v === undefined || v === '') return `<c r="${ref}"${s}/>`

  if (type === 'number') {
    const n = typeof v === 'number' ? v : Number(v)
    // 拿不到有限数就退回文本，绝不写一个 NaN 进去让 Excel 报错
    if (Number.isFinite(n)) return `<c r="${ref}"${s}><v>${n}</v></c>`
  }

  let text = String(v)
  if (text.length > CELL_MAX) text = text.slice(0, CELL_MAX - 1) + '…'
  // xml:space="preserve"：卡密两端万一带空格，不保留就会被 Excel 吃掉，那是另一种「卡密被改写」
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(text)}</t></is></c>`
}

/** 工作表名的硬限制：≤31 字符，且不能含 []:*?/\ */
function safeSheetName(name: string): string {
  // 连双引号一起剥：sheetName 写在 workbook.xml 的 name="..." 属性位，带引号会提前闭合属性
  const cleaned = (name || 'Sheet1').replace(/[[\]:*?/\\"]/g, ' ').trim() || 'Sheet1'
  return cleaned.slice(0, 31)
}

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

/**
 * 生成一份单表 xlsx。
 *
 * 表头加粗并冻结首行、开启自动筛选 —— 导出来的表运营是要真的拿去筛选排序的，
 * 这三样是「能用」和「好用」的分界线，成本只有几十字节。
 */
export function buildXlsx(opts: { sheetName: string; columns: XlsxColumn[]; rows: XlsxValue[][] }): Uint8Array {
  const { columns, rows } = opts
  const sheetName = safeSheetName(opts.sheetName)
  const lastCol = colName(Math.max(columns.length - 1, 0))
  const lastRow = rows.length + 1 // +1 是表头行

  const cols = columns
    .map((c, i) => {
      const w = c.width ?? Math.min(Math.max(String(c.header).length * 2 + 4, 10), 60)
      return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
    })
    .join('')

  const headerXml =
    `<row r="1">` +
    columns.map((c, i) => cellXml(`${colName(i)}1`, c.header, 'text', 1)).join('') +
    `</row>`

  const bodyXml = rows
    .map((row, ri) => {
      const r = ri + 2
      const cells = columns
        .map((c, ci) => cellXml(`${colName(ci)}${r}`, row[ci], c.type === 'number' ? 'number' : 'text', 0))
        .join('')
      return `<row r="${r}">${cells}</row>`
    })
    .join('')

  // 元素顺序是 schema 规定死的：dimension → sheetViews → cols → sheetData → autoFilter，
  // 顺序错了 Excel 直接判文件损坏（不会给任何有用的提示）
  const sheet =
    `${XML_HEAD}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="A1:${lastCol}${Math.max(lastRow, 1)}"/>` +
    `<sheetViews><sheetView workbookViewId="0">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${headerXml}${bodyXml}</sheetData>` +
    `<autoFilter ref="A1:${lastCol}${Math.max(lastRow, 1)}"/>` +
    `</worksheet>`

  const workbook =
    `${XML_HEAD}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`

  // 两个 cellXfs：0 = 普通，1 = 加粗（表头）。
  // fonts/fills/borders 即使用不到也必须存在且 count 对得上，少一个 Excel 就不认。
  // fills 前两项（none / gray125）是规范要求的固定占位，不能省。
  const styles =
    `${XML_HEAD}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border/></borders>` +
    `<cellStyleXfs count="1"><xf/></cellStyleXfs>` +
    `<cellXfs count="2"><xf xfId="0"/><xf xfId="0" fontId="1" applyFont="1"/></cellXfs>` +
    // cellStyles 少了不会让 Excel 打不开，但会让读取方认为「这份文件没有默认样式」
    // 而各自补一个（openpyxl 实测会告警）。补齐它，别给下游留判断空间
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `<dxfs count="0"/>` +
    `</styleSheet>`

  const contentTypes =
    `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`

  const rels =
    `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`

  const wbRels =
    `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`

  const enc = new TextEncoder()
  const files: Zippable = {
    '[Content_Types].xml': enc.encode(contentTypes),
    '_rels/.rels': enc.encode(rels),
    'xl/workbook.xml': enc.encode(workbook),
    'xl/_rels/workbook.xml.rels': enc.encode(wbRels),
    'xl/styles.xml': enc.encode(styles),
    'xl/worksheets/sheet1.xml': enc.encode(sheet),
  }

  return zipSync(files, { level: 6 })
}

/** 北京时间的 YYYY-MM-DD HH:mm:ss。写成文本而不是 Excel 日期序列号：
 *  序列号要配 numFmt 样式，而这个格式本身按字典序排就等于按时间排，够用且不会有时区歧义 */
export function xlsxTime(d: Date | string | null | undefined): string {
  if (!d) return ''
  const t = typeof d === 'string' ? new Date(d) : d
  if (isNaN(t.getTime())) return ''
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(t)
  const get = (k: string) => parts.find((p) => p.type === k)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}
