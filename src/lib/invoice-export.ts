import { normalizeTaxNumber } from './invoice'

/**
 * 批量开票导出：把「待开发票」写进税局官方的批量导入模板。
 *
 * 【为什么是往官方模板里塞行，而不是自己生成一个 xlsx】
 * 模板里有一个隐藏表 `excelVersion`，A4 写着 `pt:20260401`，导入端会校验它；
 * 另外 39 列里有 17 处下拉数据验证（发票类型、是否含税、是否展示购买方信息……）。
 * 自己拼一个「看起来一样」的工作簿，是在赌对方只读值不校验版本 ——
 * 赌输了就是一整批发票开不出来。所以这里只做一件事：
 * 把 `<row>` 追加到两张表的 `</sheetData>` 之前，其余字节原样不动。
 *
 * 两张表的结构（模板 V260401）：
 *   「1-发票基本信息」第 1 行填表说明、第 2 行必填提示、第 3 行表头 → **数据从第 4 行开始**，A..AM 共 39 列
 *   「2-发票明细信息」同样 **从第 4 行开始**，A..N 共 14 列
 * 数据验证的范围都是 4..1001，所以超过 998 行会掉出验证区（模板自己也写明：
 * 明细超过 2000 行可能导致开票异常、超过 5000 行无法开具）。
 */

/** 表一列序（A=0）。只列出我们会写的列，其余留空 */
export const BASE_COL = {
  流水号: 0, // A
  发票类型: 1, // B
  是否含税: 3, // D
  购买方名称: 5, // F
  购买方税号: 6, // G
  购买方地址: 10, // K
  购买方电话: 16, // Q
  购买方开户银行: 17, // R
  购买方银行账号: 18, // S
  是否展示购买方信息: 19, // T
  销售方开户行: 27, // AB
  销售方银行账号: 28, // AC
  购买方邮箱: 30, // AE
} as const
export const BASE_COL_COUNT = 39 // A..AM

/** 表二列序（A=0） */
export const ITEM_COL = {
  流水号: 0, // A
  项目名称: 1, // B
  税收编码: 2, // C
  规格型号: 3, // D
  单位: 4, // E
  数量: 5, // F
  金额: 7, // H
  税率: 8, // I
} as const
export const ITEM_COL_COUNT = 14 // A..N

/** 固定值。全部取自模板的下拉选项原文，一个字都不能改，改了导入端会判非法值 */
export const 发票类型_普通 = '普通发票'
export const 是否含税_是 = '是'
export const 展示购买方信息 = '展示地址、电话、开户银行及银行账号'
export const 销售方开户行 = '工行益阳桃花仑支行'
export const 销售方银行账号 = '1912021009200394667'
export const 项目名称 = '技术咨询服务'
export const 税收编码 = '3040102000000000000'
export const 税率 = '0.01'
export const 单位_月 = '月'
export const 数量_1 = '1'

/** 模板自己写明的行数红线 */
export const ROW_SOFT_LIMIT = 998 // 数据验证只覆盖到第 1001 行
export const ROW_HARD_LIMIT = 2000 // 超过可能导致开票异常

/**
 * 商品名 → 规格型号。
 *
 * 【只在买家选了「展示 ChatGPT/Claude 字眼」时才会用到】没选就整列留空。
 *
 * 商品名是运营在后台随手起的，线上实际存在这些形态（都来自 invoices 表）：
 *   Claude pro 自助充值 | iOS订阅                             → Claude pro会员订阅
 *   ChatGPT Pro 20x 自助充值 | 信用卡充值（无法覆盖plus和5x）  → ChatGPT Pro 20x会员订阅
 *   ChatGPT Plus自助充值 | 信用卡冲                            → ChatGPT Plus会员订阅
 *   Claude Max 20x成品号 | 自动发货                            → Claude Max 20x会员订阅
 *   Claude MAX 5x自助充值（测试中）                            → Claude MAX 5x会员订阅
 *   Claude Max 5x                                              → Claude Max 5x会员订阅
 *
 * 规则：竖线右边是发货方式，与商品无关，先切掉；再抹掉「自助充值/代充/成品号/充值」
 * 这类销售话术和括号补充说明；剩下的就是商品本体，补上「会员订阅」。
 */
export function specModel(subscriptionType: string | null | undefined): string {
  const raw = (subscriptionType || '').trim()
  if (!raw) return ''

  // 竖线右边是「iOS订阅 / 信用卡充值 / 自动发货」这类发货方式，不属于商品描述
  let s = raw.split('|')[0]
  // 括号里一律是补充说明（（测试中）、（可覆盖plus）……），不进发票
  s = s.replace(/[（(][^）)]*[）)]/g, ' ')
  // 销售话术。「充值」放在最后，避免先把「自助充值」里的「充值」吃掉留下孤零零的「自助」
  s = s.replace(/自助充值|自助|代充|成品号|充值|订阅/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  if (!s) return ''

  /*
   * 【认不出来的商品宁可留空，也不要瞎编一个】
   * 线上有「Codex验证码-美区实体手机卡-单次接码」这种根本不是订阅的商品，
   * 直接拼成「……-单次接码会员订阅」会印在真实发票上，是要出事的。
   * 规格型号在模板里是**非必填**，留空完全合法；编错则不然。
   */
  if (!/(claude|chatgpt|gpt|codex\s*(pro|plus))/i.test(s)) return ''

  return `${s}会员订阅`
}

/** 是否需要在表一 T 列标注「展示地址、电话、开户银行及银行账号」 */
export function shouldShowBuyerInfo(inv: {
  address?: string | null
  phone?: string | null
  bankName?: string | null
  bankAccount?: string | null
}): boolean {
  return !!(inv.address?.trim() || inv.phone?.trim() || inv.bankName?.trim() || inv.bankAccount?.trim())
}

export interface ExportInvoice {
  invoiceNo: string
  title?: string | null
  taxNumber?: string | null
  /** 'MANUAL' = 管理员手动录入的站外客户发票，开票内容是人手打的，不走商品名清洗 */
  source?: string | null
  address?: string | null
  phone?: string | null
  bankName?: string | null
  bankAccount?: string | null
  email?: string | null
  showAiWording?: boolean | null
  subscriptionType?: string | null
  invoiceAmount?: unknown // Prisma Decimal | number | string | null
}

/** 金额统一按两位小数的字符串写出。模板要求「所有内容输入均为文本格式」 */
export function money(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

const blank = (n: number) => new Array<string>(n).fill('')

/** 一条发票 → 表一的一行（39 列） */
export function baseRow(inv: ExportInvoice): string[] {
  const r = blank(BASE_COL_COUNT)
  r[BASE_COL.流水号] = inv.invoiceNo
  r[BASE_COL.发票类型] = 发票类型_普通
  r[BASE_COL.是否含税] = 是否含税_是
  r[BASE_COL.购买方名称] = (inv.title || '').trim()
  // 【税号在这里再去一次空格】登记侧已经过滤过（lib/invoice-input.assertTaxNumber），
  // 但库里还躺着改造之前存进去的「9111 0108 MAER 0M7A 3L」这类历史数据，
  // 而税局导入就是在这一列上报「购买方纳税人识别号长度不能超过20」——
  // 且是整批退回，不是只退这一行。导出这一侧必须自己兜住。
  r[BASE_COL.购买方税号] = normalizeTaxNumber(inv.taxNumber)
  r[BASE_COL.购买方地址] = (inv.address || '').trim()
  r[BASE_COL.购买方电话] = (inv.phone || '').trim()
  r[BASE_COL.购买方开户银行] = (inv.bankName || '').trim()
  r[BASE_COL.购买方银行账号] = (inv.bankAccount || '').trim()
  // 四项一个都没填就留空 —— 模板里这一列非必填，填了反而要求下面四项齐全
  r[BASE_COL.是否展示购买方信息] = shouldShowBuyerInfo(inv) ? 展示购买方信息 : ''
  r[BASE_COL.销售方开户行] = 销售方开户行
  r[BASE_COL.销售方银行账号] = 销售方银行账号
  r[BASE_COL.购买方邮箱] = (inv.email || '').trim()
  return r
}

/** 一条发票 → 表二的一行（14 列）。流水号与表一一致，导入端靠它把明细挂到发票上 */
export function itemRow(inv: ExportInvoice): string[] {
  const r = blank(ITEM_COL_COUNT)
  r[ITEM_COL.流水号] = inv.invoiceNo
  r[ITEM_COL.项目名称] = 项目名称
  r[ITEM_COL.税收编码] = 税收编码

  // 买家选了「不展示」就三列全空，发票上只剩「技术咨询服务」，看不出买的是什么
  if (inv.showAiWording === true) {
    /*
     * 【手动录入的直接用原文，不过 specModel】specModel 里有一道
     * 「不含 claude/chatgpt/gpt/codex 就返回空」的守卫 —— 那是为了挡住
     * 运营在后台随手起的、其实不是订阅的商品名。但站外客户的开票内容是管理员
     * 在弹窗里亲手打的（「企业订阅服务」「技术服务费」），过那道守卫会被整个丢掉：
     * 管理员明明选了「展示」，开出来的票上却只有「技术咨询服务」，前后台都没有提示。
     */
    const spec =
      inv.source === 'MANUAL' ? (inv.subscriptionType || '').trim() : specModel(inv.subscriptionType)
    if (spec) {
      r[ITEM_COL.规格型号] = spec
      r[ITEM_COL.单位] = 单位_月
      r[ITEM_COL.数量] = 数量_1
    }
  }

  r[ITEM_COL.金额] = money(inv.invoiceAmount)
  r[ITEM_COL.税率] = 税率
  return r
}

// ---- 最小 xlsx 行拼装 ----

const COL_LETTERS: string[] = (() => {
  const out: string[] = []
  for (let i = 0; i < 64; i++) {
    let n = i
    let s = ''
    do {
      s = String.fromCharCode(65 + (n % 26)) + s
      n = Math.floor(n / 26) - 1
    } while (n >= 0)
    out.push(s)
  }
  return out
})()

export function colName(index: number): string {
  return COL_LETTERS[index]
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // 控制字符在 XML 1.0 里非法，混进去整个 xlsx 都打不开。
    // 抬头/地址是买家自己填的，粘进不可见字符完全可能，这一条是兜底
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

/**
 * 一行数据 → `<row>` XML。
 *
 * 【一律写成 inlineStr，不写数字】税号、银行账号都是十几二十位的纯数字串，
 * 一旦被当成数值，Excel 会转成科学计数法（1.91202E+18），银行账号就废了。
 * 模板的填表说明第 6 条也写着「所有内容输入均为文本格式输入」。
 */
export function rowXml(rowNumber: number, cells: string[]): string {
  const parts: string[] = []
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i]
    if (!v) continue // 空单元格直接不写，文件更小，语义等价
    parts.push(
      `<c r="${colName(i)}${rowNumber}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(v)}</t></is></c>`
    )
  }
  return `<row r="${rowNumber}">${parts.join('')}</row>`
}

/** 把若干行插到 sheet XML 的 </sheetData> 之前。其余字节一个不动 */
export function injectRows(sheetXml: string, rows: string[][], startRow = 4): string {
  const marker = '</sheetData>'
  const at = sheetXml.indexOf(marker)
  if (at < 0) throw new Error('模板损坏：sheet 里找不到 </sheetData>')
  const xml = rows.map((cells, i) => rowXml(startRow + i, cells)).join('')
  return sheetXml.slice(0, at) + xml + sheetXml.slice(at)
}
