/**
 * 批量开票导出的自测。**不连数据库**，照 scripts/check-coupon.ts 的形式。
 *   npx tsx scripts/check-invoice-export.ts
 *
 * 这些值会原样印在**真实增值税发票**上，错一个字就是要去税局作废重开的事故，
 * 而 tsc 和 next build 一个都拦不住。
 *
 * 另外会真的打开 templates/ 下的官方模板做结构校验：列头、下拉选项、数据起始行
 * 全部与代码里的常量对齐。模板换版（比如 V260401 → 下一版）时，这里会先响。
 */
import fs from 'fs'
import path from 'path'
import { unzipSync, zipSync } from 'fflate'
import {
  BASE_COL,
  BASE_COL_COUNT,
  ITEM_COL,
  ITEM_COL_COUNT,
  specModel,
  shouldShowBuyerInfo,
  baseRow,
  itemRow,
  money,
  colName,
  escapeXml,
  rowXml,
  injectRows,
  发票类型_普通,
  是否含税_是,
  展示购买方信息,
  销售方开户行,
  销售方银行账号,
  项目名称,
  税收编码,
  税率,
  单位_月,
  数量_1,
  type ExportInvoice,
} from '../src/lib/invoice-export'

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
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  ok(name, a === b, `实际 ${a}，期望 ${b}`)
}

console.log('\n【规格型号：商品名 → 发票上印的字】')
// 下面这些输入全部取自线上 invoices 表的真实 subscription_type
eq('竖线右边的发货方式要切掉', specModel('Claude pro 自助充值 | iOS订阅'), 'Claude pro会员订阅')
eq('括号补充说明要切掉', specModel('ChatGPT Pro 20x 自助充值 | 信用卡充值（无法覆盖plus和5x）'), 'ChatGPT Pro 20x会员订阅')
eq('没有空格的「自助充值」', specModel('ChatGPT Plus自助充值 | 信用卡冲'), 'ChatGPT Plus会员订阅')
eq('成品号也是销售话术', specModel('Claude Max 20x成品号 | 自动发货'), 'Claude Max 20x会员订阅')
eq('括号在结尾', specModel('Claude MAX 5x自助充值（测试中）'), 'Claude MAX 5x会员订阅')
eq('本来就干净的商品名', specModel('Claude Max 5x'), 'Claude Max 5x会员订阅')
eq('代充', specModel('Claude MAX 5x 代充'), 'Claude MAX 5x会员订阅')
eq('尾部空格', specModel('ChatGPT Pro 5x 自助充值 '), 'ChatGPT Pro 5x会员订阅')
eq('已经带订阅字样也不会重复', specModel('Claude Pro 订阅'), 'Claude Pro会员订阅')
/*
 * 这一条是有意为之，不是漏网：线上真的有「Codex验证码-美区实体手机卡-单次接码」这种
 * 根本不是订阅的商品。拼成「…单次接码会员订阅」会印在真发票上。
 * 规格型号在模板里是**非必填**，留空完全合法；编一个假的则不然。
 */
eq('认不出的商品留空，不瞎编', specModel('Codex验证码-美区实体手机卡-单次接码'), '')
eq('空值', specModel(''), '')
eq('null', specModel(null), '')
eq('只有话术、去干净后为空', specModel('自助充值'), '')

console.log('\n【是否展示购买方地址电话银行账号】')
ok('四项全空 → 不展示', !shouldShowBuyerInfo({}))
ok('只填了地址 → 展示', shouldShowBuyerInfo({ address: '湖南益阳' }))
ok('只填了卡号 → 展示', shouldShowBuyerInfo({ bankAccount: '6222' }))
ok('全是空白字符 → 不展示', !shouldShowBuyerInfo({ address: '   ', phone: '\t' }))

console.log('\n【金额】—— 一律两位小数的文本')
eq('整数补两位', money(100), '100.00')
eq('字符串也能进', money('88.5'), '88.50')
eq('四舍五入到分', money(1.005), '1.00') // 浮点本相，钉住当前行为，避免以后悄悄变
eq('null → 空', money(null), '')
eq('非数字 → 空', money('abc'), '')

console.log('\n【表一：39 列，固定值一个字都不能错】')
const full: ExportInvoice = {
  invoiceNo: 'INV20260910001',
  title: '某某科技有限公司',
  taxNumber: '91430900MA4L2R3X8K',
  address: '湖南省益阳市',
  phone: '0737-1234567',
  bankName: '工行益阳分行',
  bankAccount: '1912021009200394667',
  email: 'buyer@example.com',
  showAiWording: true,
  subscriptionType: 'Claude pro 自助充值 | iOS订阅',
  invoiceAmount: 106,
}
const b = baseRow(full)
eq('列数', b.length, BASE_COL_COUNT)
eq('A 发票流水号 = 系统发票号', b[BASE_COL.流水号], 'INV20260910001')
eq('B 发票类型', b[BASE_COL.发票类型], '普通发票')
eq('B 与常量一致', b[BASE_COL.发票类型], 发票类型_普通)
eq('D 是否含税', b[BASE_COL.是否含税], '是')
eq('D 与常量一致', b[BASE_COL.是否含税], 是否含税_是)
eq('F 购买方名称 = 抬头', b[BASE_COL.购买方名称], '某某科技有限公司')
eq('G 购买方税号', b[BASE_COL.购买方税号], '91430900MA4L2R3X8K')
eq('K 购买方地址', b[BASE_COL.购买方地址], '湖南省益阳市')
eq('Q 购买方电话', b[BASE_COL.购买方电话], '0737-1234567')
eq('R 购买方开户银行', b[BASE_COL.购买方开户银行], '工行益阳分行')
eq('S 购买方银行账号', b[BASE_COL.购买方银行账号], '1912021009200394667')
eq('T 展示购买方信息', b[BASE_COL.是否展示购买方信息], 展示购买方信息)
eq('T 原文', b[BASE_COL.是否展示购买方信息], '展示地址、电话、开户银行及银行账号')
eq('AB 销售方开户行', b[BASE_COL.销售方开户行], '工行益阳桃花仑支行')
eq('AC 销售方银行账号', b[BASE_COL.销售方银行账号], '1912021009200394667')
eq('AE 购买方邮箱 = 接收邮箱', b[BASE_COL.购买方邮箱], 'buyer@example.com')

const bare: ExportInvoice = { invoiceNo: 'INV2', title: '张三', taxNumber: '', invoiceAmount: 50 }
const b2 = baseRow(bare)
eq('没填四项时 T 留空', b2[BASE_COL.是否展示购买方信息], '')
eq('没填时地址列留空', b2[BASE_COL.购买方地址], '')
eq('销售方信息始终填', b2[BASE_COL.销售方开户行], 销售方开户行)
ok(
  '其余列全部为空',
  b2.every((v, i) =>
    i === BASE_COL.流水号 ||
    i === BASE_COL.发票类型 ||
    i === BASE_COL.是否含税 ||
    i === BASE_COL.购买方名称 ||
    i === BASE_COL.销售方开户行 ||
    i === BASE_COL.销售方银行账号
      ? true
      : v === ''
  )
)

console.log('\n【表二：14 列】')
const i1 = itemRow(full)
eq('列数', i1.length, ITEM_COL_COUNT)
eq('A 流水号与表一一致', i1[ITEM_COL.流水号], b[BASE_COL.流水号])
eq('B 项目名称', i1[ITEM_COL.项目名称], '技术咨询服务')
eq('B 与常量一致', i1[ITEM_COL.项目名称], 项目名称)
eq('C 税收编码', i1[ITEM_COL.税收编码], '3040102000000000000')
eq('C 与常量一致', i1[ITEM_COL.税收编码], 税收编码)
eq('H 金额 = 开票金额(含税)', i1[ITEM_COL.金额], '106.00')
eq('I 税率', i1[ITEM_COL.税率], '0.01')
eq('I 与常量一致', i1[ITEM_COL.税率], 税率)
eq('展示时 D 规格型号', i1[ITEM_COL.规格型号], 'Claude pro会员订阅')
eq('展示时 E 单位', i1[ITEM_COL.单位], 单位_月)
eq('展示时 E 原文', i1[ITEM_COL.单位], '月')
eq('展示时 F 数量', i1[ITEM_COL.数量], 数量_1)

const hide = itemRow({ ...full, showAiWording: false })
eq('不展示时 D 留空', hide[ITEM_COL.规格型号], '')
eq('不展示时 E 留空', hide[ITEM_COL.单位], '')
eq('不展示时 F 留空', hide[ITEM_COL.数量], '')
eq('不展示时金额照填', hide[ITEM_COL.金额], '106.00')
eq('不展示时项目名称照填', hide[ITEM_COL.项目名称], 项目名称)

// showAiWording 为 null 是历史数据/管理员补录的空壳，等同不展示 —— 绝不能当成展示
const nullWording = itemRow({ ...full, showAiWording: null })
eq('showAiWording=null 视为不展示', nullWording[ITEM_COL.规格型号], '')
eq('showAiWording=undefined 视为不展示', itemRow({ ...full, showAiWording: undefined })[ITEM_COL.规格型号], '')

// 展示，但商品名认不出来 → 三列一起留空，不能只留规格型号空着而单位数量还在
const weird = itemRow({ ...full, showAiWording: true, subscriptionType: 'Codex验证码-单次接码' })
eq('认不出商品时 D 空', weird[ITEM_COL.规格型号], '')
eq('认不出商品时 E 也空', weird[ITEM_COL.单位], '')
eq('认不出商品时 F 也空', weird[ITEM_COL.数量], '')

console.log('\n【xlsx 行拼装】')
eq('A 列', colName(0), 'A')
eq('Z 列', colName(25), 'Z')
eq('AA 列', colName(26), 'AA')
eq('表一最后一列是 AM', colName(BASE_COL_COUNT - 1), 'AM')
eq('表二最后一列是 N', colName(ITEM_COL_COUNT - 1), 'N')
eq('转义 &', escapeXml('A&B'), 'A&amp;B')
eq('转义尖括号', escapeXml('<x>'), '&lt;x&gt;')
eq('剔除控制字符', escapeXml('a bc'), 'abc')
ok('空单元格不写 <c>', !rowXml(4, ['', '', 'x']).includes('r="A4"'))
ok('写成 inlineStr 而不是数字', rowXml(4, ['123']).includes('t="inlineStr"'))
ok(
  '长数字串不会被当成数值',
  rowXml(4, ['1912021009200394667']).includes('<t xml:space="preserve">1912021009200394667</t>')
)
eq('行号正确', rowXml(7, ['x']).match(/<row r="(\d+)"/)?.[1], '7')

const injected = injectRows('<worksheet><sheetData><row r="3"/></sheetData><x/></worksheet>', [['a'], ['b']])
ok('插在 </sheetData> 之前', injected.indexOf('r="4"') < injected.indexOf('</sheetData>'))
ok('第一行是 4', injected.includes('<row r="4">'))
ok('第二行是 5', injected.includes('<row r="5">'))
ok('原有内容不动', injected.includes('<row r="3"/>') && injected.includes('<x/>'))

console.log('\n【真·官方模板结构校验】—— 模板换版时这里先响')
const tpl = path.join(process.cwd(), 'templates', 'invoice-batch-import-v260401.xlsx')
if (!fs.existsSync(tpl)) {
  fail++
  console.error(`  ✗ 找不到模板 ${tpl}`)
} else {
  const zip = unzipSync(new Uint8Array(fs.readFileSync(tpl)))
  const dec = new TextDecoder('utf-8')
  const base = dec.decode(zip['xl/worksheets/sheet1.xml'] || new Uint8Array())
  const item = dec.decode(zip['xl/worksheets/sheet6.xml'] || new Uint8Array())
  const book = dec.decode(zip['xl/workbook.xml'] || new Uint8Array())
  const ver = dec.decode(zip['xl/worksheets/sheet3.xml'] || new Uint8Array())

  ok('sheet1 就是「1-发票基本信息」', book.includes('name="1-发票基本信息" r:id="rId3"'))
  ok('sheet6 就是「2-发票明细信息」', book.includes('name="2-发票明细信息" r:id="rId8"'))
  ok('模板版本仍是 pt:20260401', ver.includes('pt:20260401'))

  // 表头在第 3 行 → 数据必须从第 4 行开始
  ok('表一数据起始行 = 4（下拉验证从 B4 开始）', base.includes('sqref="B4:B1001"'))
  ok('表二数据起始行 = 4', item.includes('sqref="K4:K1001"'))
  ok('两张表都还没有数据行', !base.includes('<row r="4"') && !item.includes('<row r="4"'))

  // 固定值必须是下拉里的原文，差一个顿号导入端就判非法
  ok('「普通发票」在 B 列下拉选项里', base.includes(`"增值税专用发票,${发票类型_普通}"`))
  ok('「是」在 D 列下拉选项里', base.includes('<formula1>"是,否"</formula1>'))
  ok('T 列展示选项原文一致', base.includes(展示购买方信息))

  // 表头文字与我们假设的列位置对齐（用带列号的单元格直接比对）
  // 用 [\s\S] 而不是 s 标志：tsconfig 的 target 低于 es2018，s 标志编译不过
  const headerAt = (xml: string, ref: string) => {
    const m = xml.match(new RegExp(`<c r="${ref}3"[^>]*>([\\s\\S]*?)</c>`))
    if (!m) return ''
    const t = m[1].match(/<t[^>]*>([\s\S]*?)<\/t>/)
    return t ? t[1] : ''
  }
  const decodeEnt = (s: string) => s.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
  eq('A3 = 发票流水号', decodeEnt(headerAt(base, 'A')), '发票流水号')
  eq('B3 = 发票类型', decodeEnt(headerAt(base, 'B')), '发票类型')
  eq('D3 = 是否含税', decodeEnt(headerAt(base, 'D')), '是否含税')
  eq('F3 = 购买方名称', decodeEnt(headerAt(base, 'F')), '购买方名称')
  eq('G3 = 购买方纳税人识别号', decodeEnt(headerAt(base, 'G')), '购买方纳税人识别号')
  eq('K3 = 购买方地址', decodeEnt(headerAt(base, 'K')), '购买方地址')
  eq('Q3 = 购买方电话', decodeEnt(headerAt(base, 'Q')), '购买方电话')
  eq('R3 = 购买方开户银行', decodeEnt(headerAt(base, 'R')), '购买方开户银行')
  eq('S3 = 购买方银行账号', decodeEnt(headerAt(base, 'S')), '购买方银行账号')
  eq('T3 = 是否展示购买方地址电话银行账号', decodeEnt(headerAt(base, 'T')), '是否展示购买方地址电话银行账号')
  eq('AB3 = 销售方开户行', decodeEnt(headerAt(base, 'AB')), '销售方开户行')
  eq('AC3 = 销售方银行账号', decodeEnt(headerAt(base, 'AC')), '销售方银行账号')
  eq('AE3 = 购买方邮箱', decodeEnt(headerAt(base, 'AE')), '购买方邮箱')
  eq('明细 A3 = 发票流水号', decodeEnt(headerAt(item, 'A')), '发票流水号')
  eq('明细 B3 = 项目名称', decodeEnt(headerAt(item, 'B')), '项目名称')
  eq('明细 C3 = 商品和服务税收编码', decodeEnt(headerAt(item, 'C')), '商品和服务税收编码')
  eq('明细 D3 = 规格型号', decodeEnt(headerAt(item, 'D')), '规格型号')
  eq('明细 E3 = 单位', decodeEnt(headerAt(item, 'E')), '单位')
  eq('明细 F3 = 数量', decodeEnt(headerAt(item, 'F')), '数量')
  eq('明细 H3 = 金额', decodeEnt(headerAt(item, 'H')), '金额')
  eq('明细 I3 = 税率', decodeEnt(headerAt(item, 'I')), '税率')

  console.log('\n【端到端：真的生成一个 xlsx 并读回来】')
  const samples: ExportInvoice[] = [full, { ...bare, showAiWording: false }]
  const z2: Record<string, Uint8Array> = { ...zip }
  const encoder = new TextEncoder()
  z2['xl/worksheets/sheet1.xml'] = encoder.encode(injectRows(base, samples.map(baseRow)))
  z2['xl/worksheets/sheet6.xml'] = encoder.encode(injectRows(item, samples.map(itemRow)))
  const outBuf = zipSync(z2, { level: 6 })
  ok('生成的文件非空', outBuf.length > 0)

  const back = unzipSync(outBuf)
  const backBase = dec.decode(back['xl/worksheets/sheet1.xml'])
  const backItem = dec.decode(back['xl/worksheets/sheet6.xml'])
  ok('回读后有两条发票行', backBase.includes('<row r="4">') && backBase.includes('<row r="5">'))
  ok('抬头写进去了', backBase.includes('某某科技有限公司'))
  ok('销售方账号写进去了', backBase.includes(销售方银行账号))
  ok('明细里有税率', backItem.includes('>0.01<'))
  ok('隐藏的 excelVersion 原样保留', dec.decode(back['xl/worksheets/sheet3.xml']).includes('pt:20260401'))
  eq('zip 条目数不变', Object.keys(back).length, Object.keys(zip).length)
  ok(
    '未改动的大表字节完全一致',
    Buffer.compare(Buffer.from(back['xl/worksheets/sheet5.xml']), Buffer.from(zip['xl/worksheets/sheet5.xml'])) === 0
  )
}

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
