export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { unzipSync, zipSync } from 'fflate'
import { prisma } from '@/lib/db'
import { error } from '@/lib/api'
import {
  baseRow,
  itemRow,
  injectRows,
  ROW_HARD_LIMIT,
  type ExportInvoice,
} from '@/lib/invoice-export'

/**
 * 批量开票导出：把当前所有「待开发票」写进税局官方模板，直接下载。
 *
 * 【「待开」= status SUBMITTED 且 payStatus PAID】不是只看 status。
 * 税费已到账、申请正式成立、但还没开出去的那些才叫待开 ——
 * 口径与财务台 `api/finance/invoices/[token]` 完全一致，两处必须一样，
 * 否则财务台显示「待开 3 张」而导出来 5 张，没人知道该信哪个。
 * 排序也照抄财务台的「先付先开」。
 *
 * 【鉴权靠 middleware】`/api/admin/*` 由 src/middleware.ts 统一拦截校验 ADMIN 角色，
 * 路由内不再自查（全站后台接口都是这个写法，这里不要另起一套）。
 * 注意 middleware 只认 cookie，所以前端必须用同源 fetch 带 cookie，不能用 Bearer。
 *
 * 【返回的是二进制，不能走 lib/api 的 success()】那个helper 只会 JSON.stringify。
 * 但**出错时仍然返回 JSON**，前端据此区分成功与失败。
 */

/** 模板放在仓库 templates/ 下，Dockerfile 里有显式 COPY（standalone 追踪不到 fs 读的文件）*/
const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'invoice-batch-import-v260401.xlsx')

/** 官方模板里两张要填的表在 zip 内的路径。名字是 sheetN.xml，与工作表顺序无关，别按序号猜 */
const SHEET_BASE = 'xl/worksheets/sheet1.xml' // 「1-发票基本信息」
const SHEET_ITEM = 'xl/worksheets/sheet6.xml' // 「2-发票明细信息」

const SELECT = {
  invoiceNo: true,
  title: true,
  taxNumber: true,
  address: true,
  phone: true,
  bankName: true,
  bankAccount: true,
  email: true,
  showAiWording: true,
  subscriptionType: true,
  invoiceAmount: true,
} as const

export async function GET(_request: NextRequest) {
  try {
    const rows = await prisma.invoice.findMany({
      where: { status: 'SUBMITTED', payStatus: 'PAID' },
      orderBy: { paidAt: 'asc' }, // 先付先开，与财务台一致
      select: SELECT,
    })

    if (rows.length === 0) return error('当前没有待开的发票')
    if (rows.length > ROW_HARD_LIMIT) {
      // 模板自己写明：明细超过 2000 行可能导致开票系统异常、超过 5000 行无法开具。
      // 与其导出一个对方吃不下的文件，不如在这里就拦住并说清楚
      return error(`待开发票 ${rows.length} 张，超过官方模板单次 ${ROW_HARD_LIMIT} 行的上限，请先开掉一部分再导出`)
    }

    const invoices: ExportInvoice[] = rows.map((r) => ({
      ...r,
      invoiceAmount: r.invoiceAmount == null ? null : Number(r.invoiceAmount),
    }))

    let file: Buffer
    try {
      file = await fs.readFile(TEMPLATE_PATH)
    } catch {
      return error('服务器上找不到开票模板文件，请联系技术处理', 500)
    }

    const zip = unzipSync(new Uint8Array(file))
    if (!zip[SHEET_BASE] || !zip[SHEET_ITEM]) {
      return error('开票模板结构异常（缺少发票基本信息或明细信息工作表）', 500)
    }

    const dec = new TextDecoder('utf-8')
    const enc = new TextEncoder()

    // 只改这两张表，其余条目（隐藏的 excelVersion、下拉数据源、样式）原样带走
    zip[SHEET_BASE] = enc.encode(injectRows(dec.decode(zip[SHEET_BASE]), invoices.map(baseRow)))
    zip[SHEET_ITEM] = enc.encode(injectRows(dec.decode(zip[SHEET_ITEM]), invoices.map(itemRow)))

    const out = zipSync(zip, { level: 6 })

    const stamp = new Date()
      .toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
      .replace(/[^\d]/g, '')
      .slice(0, 12) // YYYYMMDDHHmm
    const filename = `待开发票批量导入-${stamp}-${invoices.length}张.xlsx`

    return new NextResponse(Buffer.from(out), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // filename 只能是 ASCII，中文必须走 RFC 5987 的 filename*；两个都给，老浏览器落到前者
        'Content-Disposition': `attachment; filename="invoices-${stamp}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(out.length),
        'Cache-Control': 'no-store',
        // 前端拿不到中文文件名时用它兜底（跨域时需要 Expose-Headers，同源不用）
        'X-Invoice-Count': String(invoices.length),
      },
    })
  } catch (err) {
    console.error('Admin invoice export error:', err)
    return error('导出失败')
  }
}
