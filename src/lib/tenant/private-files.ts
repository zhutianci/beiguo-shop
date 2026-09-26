/**
 * 超管私有文件（WP5，设计 10.10）：打款凭证。**不放 public/uploads**——那个目录由 nginx 按整个目录直接发文件，
 * 谁拿到文件名谁就能下载；打款凭证带渠道收款账号、金额、流水号，只能经 adminGuard 的接口流式下发。
 *
 * 【目录】生产 /app/private/payout/（Dockerfile 预建并 chown 给 nextjs，compose 另挂命名卷，WP8）。
 *  根目录 = PRIVATE_FILES_DIR 环境变量，未设置时 = <cwd>/private（容器里 cwd 就是 /app）。itest 把它指到临时目录。
 *
 * 【库里只存相对键】`payout/<sid>-<16 位随机 hex>.<ext>`，不存绝对路径：
 *  · 换机器 / 换挂载点不用改数据；
 *  · streamProof 只接受这个形状的键（正则 + 解析后必须仍在根目录下），库里的值被篡改成 `../../.env` 也读不出去。
 *
 * 【只收 png / jpg / pdf，≤ 5 MB】按文件头魔数判定真实类型（Content-Type 与扩展名都是客户端说了算）。
 * 下发时 pdf 一律 attachment（浏览器内置 PDF 阅读器里的脚本与本站同源执行的风险不值得冒），图片 inline；
 * 统一加 nosniff 与 CSP sandbox。
 */
import { randomBytes } from 'crypto'
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises'
import path from 'path'

export const PROOF_MAX_BYTES = 5 * 1024 * 1024
const KEY_RE = /^payout\/(\d{1,10})-([0-9a-f]{16})\.(png|jpg|pdf)$/

type ProofExt = 'png' | 'jpg' | 'pdf'
const MIME: Record<ProofExt, string> = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' }

export class ProofFileError extends Error {}

export function privateRoot(): string {
  const env = (process.env.PRIVATE_FILES_DIR || '').trim()
  return path.resolve(env || path.join(process.cwd(), 'private'))
}

/** 按魔数识别：png / jpg / pdf，其余一律 null */
export function sniffProof(buf: Buffer): ProofExt | null {
  if (buf.length < 8) return null
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf'
  return null
}

/** 键 → 绝对路径；键不合规或解析后跑出根目录一律 null */
function resolveKey(key: string): { abs: string; ext: ProofExt; statementId: number } | null {
  if (typeof key !== 'string') return null
  const m = KEY_RE.exec(key)
  if (!m) return null
  const root = privateRoot()
  const abs = path.resolve(root, key)
  const rel = path.relative(root, abs)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null
  return { abs, ext: m[3] as ProofExt, statementId: Number(m[1]) }
}

/** 键里的结算单 id（下发前核对「这个文件属于这张结算单」用） */
export function proofStatementId(key: string): number | null {
  return resolveKey(key)?.statementId ?? null
}

/**
 * 保存一张打款凭证，返回相对键（写进 TenantPayout.proofFile）。
 * 类型 / 大小不合规抛 ProofFileError（路由转 400）；落盘失败（EACCES 等）原样抛（路由转 500，运维看日志）。
 */
export async function saveProof(statementId: number, file: File): Promise<string> {
  if (!Number.isSafeInteger(statementId) || statementId <= 0) throw new ProofFileError('结算单编号非法')
  if (!file || typeof (file as { arrayBuffer?: unknown }).arrayBuffer !== 'function') throw new ProofFileError('请选择凭证文件')
  if (file.size <= 0) throw new ProofFileError('凭证文件为空')
  if (file.size > PROOF_MAX_BYTES) throw new ProofFileError('凭证文件不能超过 5MB')
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length > PROOF_MAX_BYTES) throw new ProofFileError('凭证文件不能超过 5MB')
  const ext = sniffProof(buf)
  if (!ext) throw new ProofFileError('凭证只支持 PNG、JPG、PDF')
  const key = `payout/${statementId}-${randomBytes(8).toString('hex')}.${ext}`
  const r = resolveKey(key)
  if (!r) throw new ProofFileError('凭证路径非法')
  await mkdir(path.dirname(r.abs), { recursive: true })
  // wx：同名存在就失败（16 位随机名撞上的概率可以忽略；真撞上宁可报错也不覆盖别人的凭证）
  await writeFile(r.abs, buf, { flag: 'wx', mode: 0o600 })
  return key
}

/** 删除（登记打款失败时回收刚写下的文件）。不存在不报错 */
export async function removeProof(key: string): Promise<void> {
  const r = resolveKey(key)
  if (!r) return
  await unlink(r.abs).catch(() => undefined)
}

/** 流式下发。键不合规或文件不存在 → 404 */
export async function streamProof(key: string): Promise<Response> {
  const r = resolveKey(key)
  const notFound = () => new Response(JSON.stringify({ success: false, error: '凭证不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  if (!r) return notFound()
  try {
    const st = await stat(r.abs)
    if (!st.isFile() || st.size > PROOF_MAX_BYTES) return notFound()
    const buf = await readFile(r.abs)
    const name = path.basename(r.abs)
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': MIME[r.ext],
        'Content-Length': String(buf.length),
        'Content-Disposition': `${r.ext === 'pdf' ? 'attachment' : 'inline'}; filename="${name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; sandbox",
      },
    })
  } catch {
    return notFound()
  }
}
