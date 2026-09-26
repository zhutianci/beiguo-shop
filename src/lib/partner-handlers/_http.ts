/**
 * 渠道 handler 层的 HTTP 小工具（设计 6.5.4；边界检查规则 2：本目录只能 import 自身、partner-services、
 * tenant/{types,perms,math}、src/lib/api、next/server、zod、server-only）。
 *
 *  · parseBody：body 只经 zod 解析出写死的字段——zod 默认丢弃未知键，渠道塞 tenantId / supplyCents / granted 进 body
 *    也到不了服务函数（T8）；
 *  · parseUploadFile：multipart 上传（二期改动 4.3 客服二维码）——先查 Content-Length 再读请求体，只取一个文件字段的字节；
 *  · pageParams：分页上限 100（LIMITS.pageMax）；
 *  · toCsv：导出（首行水印、公式注入防护）；
 *  · notFound404：与 partnerRoute 的「无权」同一响应体（PARTNER_NOT_FOUND_BODY），不存在与不是你的无法区分。
 */
import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { LIMITS, PARTNER_NOT_FOUND_BODY } from '../tenant/types'

/** 渠道接口的请求体都很小（改价、备注、申请）；64 KB 足够，防大 body 占内存 */
const MAX_BODY_BYTES = 64 * 1024

function badRequest(message: string): Response {
  return NextResponse.json({ success: false, error: message }, { status: 400 })
}

/**
 * 解析 JSON 请求体并按 schema 校验。成功返回数据；失败返回 400 Response（调用方 `if (b instanceof Response) return b`）。
 * 要求 Content-Type 为 application/json（同源校验之外的第二道，挡 text/plain 表单）。
 */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T | Response> {
  const ct = (req.headers.get('content-type') || '').toLowerCase()
  if (!ct.startsWith('application/json')) return badRequest('请求格式不正确')
  const len = Number(req.headers.get('content-length') || '0')
  if (len > MAX_BODY_BYTES) return badRequest('请求体过大')
  let text: string
  try {
    text = await req.text()
  } catch {
    return badRequest('请求体读取失败')
  }
  if (text.length > MAX_BODY_BYTES) return badRequest('请求体过大')
  let raw: unknown
  try {
    raw = text ? JSON.parse(text) : {}
  } catch {
    return badRequest('请求体不是合法 JSON')
  }
  const r = schema.safeParse(raw)
  if (!r.success) {
    const first = r.error.issues[0]
    const where = first?.path?.length ? `${first.path.join('.')}：` : ''
    return badRequest(`参数不正确（${where}${first?.message ?? '格式错误'}）`)
  }
  return r.data
}

/** multipart 里除文件字节之外的开销（边界、字段头、文件名）；与 /api/upload 同一估算 */
const MULTIPART_OVERHEAD = 64 * 1024

/**
 * 解析 multipart 上传，取出 field 字段的文件字节（二期改动 4.3：渠道客服二维码）。
 * 成功返回 Buffer；失败返回 Response（400 / 411 / 413，调用方 `if (b instanceof Response) return b`）。
 *
 * 【为什么先查 Content-Length】req.formData() 会把整个请求体读进内存：不先卡长度，一批并发的大请求就能把 app 顶到 mem_limit
 * （/api/upload 的同一教训）。所以：
 *  · 必须是 multipart/form-data（同源校验放行的另一种类型只有 JSON）；
 *  · 必须带 Content-Length（浏览器 FormData 上传一定带，nginx 缓冲后转发也带；分块传输一律 411），且 ≤ maxBytes + 64KB；
 *  · 读完再按真实字节数复核一次 ≤ maxBytes（声明的长度与实际不符也挡得住）。
 * 只返回字节：文件名、客户端声明的 MIME 一概不用——类型由服务端按文件头判断（upload-store 的 sniffImage）。
 */
export async function parseUploadFile(req: Request, field: string, maxBytes: number): Promise<Buffer | Response> {
  const ct = (req.headers.get('content-type') || '').toLowerCase()
  if (!ct.startsWith('multipart/form-data')) return badRequest('请求格式不正确')
  const declared = Number(req.headers.get('content-length') || '')
  if (!Number.isFinite(declared) || declared <= 0) return NextResponse.json({ success: false, error: '请求缺少 Content-Length' }, { status: 411 })
  const tooLarge = () => NextResponse.json({ success: false, error: `文件不能超过 ${Math.floor(maxBytes / 1024 / 1024)}MB` }, { status: 413 })
  if (declared > maxBytes + MULTIPART_OVERHEAD) return tooLarge()
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return badRequest('上传内容格式不正确')
  }
  const file = form.get(field)
  if (!file || typeof file === 'string' || typeof (file as Blob).arrayBuffer !== 'function') return badRequest('未找到上传文件')
  const blob = file as Blob
  if (blob.size <= 0) return badRequest('文件为空')
  if (blob.size > maxBytes) return tooLarge()
  const bytes = Buffer.from(await blob.arrayBuffer())
  if (bytes.length > maxBytes) return tooLarge()
  return bytes
}

/** ?page=&pageSize=：page ≥ 1，pageSize 1..100（默认 20）；非法值按默认处理，不报错 */
export function pageParams(url: URL): { page: number; pageSize: number } {
  const p = Number.parseInt(url.searchParams.get('page') || '', 10)
  const s = Number.parseInt(url.searchParams.get('pageSize') || '', 10)
  const page = Number.isFinite(p) && p >= 1 ? Math.min(p, 100_000) : 1
  const pageSize = Number.isFinite(s) && s >= 1 ? Math.min(s, LIMITS.pageMax) : 20
  return { page, pageSize }
}

/** CSV 单元格：以 = + - @ 制表符 回车 开头的前置单引号（防 Excel 公式注入）；含逗号、引号、换行的整体加引号 */
function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  let s = typeof v === 'number' ? String(v) : String(v)
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * 生成 CSV 文本（带 UTF-8 BOM，Excel 直接打开不乱码）：
 *   第 1 行：水印（导出人、时间、「仅用于本站售后」，设计 6.4.3）
 *   第 2 行：header（列名，同时是 rows 的键，按这个顺序取值）
 *   其后：数据行。单次行数由调用方按 LIMITS.exportMaxRows 截断；这里再兜一次底，超出直接抛错（不静默截断）。
 */
export function toCsv(rows: Record<string, string | number | null>[], header: string[], watermark: string): string {
  if (rows.length > LIMITS.exportMaxRows) throw new Error(`[partner-csv] 导出行数超过上限 ${LIMITS.exportMaxRows}`)
  const lines: string[] = [csvCell(watermark), header.map((h) => csvCell(h)).join(',')]
  for (const r of rows) lines.push(header.map((h) => csvCell(r[h] ?? null)).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** 与 partnerRoute 拒绝时同一响应体：不存在 = 无权 */
export const notFound404 = (): Response => NextResponse.json(PARTNER_NOT_FOUND_BODY, { status: 404 })
