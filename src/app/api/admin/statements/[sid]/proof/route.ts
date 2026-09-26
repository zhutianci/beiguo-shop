export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { prisma } from '@/lib/db'
import { writeAudit } from '@/lib/audit'
import { adminFail, currentAdminId, failJson, parseIdParam, statementHeadOr404 } from '@/lib/tenant/admin-tenants'
import { ProofFileError, proofStatementId, removeProof, saveProof, streamProof } from '@/lib/tenant/private-files'

/**
 * 打款凭证（设计 10.10）：只经这个 adminGuard 接口流式下发，文件在私有目录（不在 /uploads，nginx 发不出去）。
 *  · GET：下载 / 预览；核对「文件键里的结算单 id = 这张单」再发，库里的值被改成别的单的文件也发不出去；
 *  · POST（multipart proof）：登记打款时没传凭证，事后补传；只在还没有凭证时生效（CAS proofFile IS NULL）。
 */

export async function GET(_req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  try {
    const head = await statementHeadOr404(sid)
    const p = await prisma.tenantPayout.findUnique({ where: { statementId: sid }, select: { proofFile: true } })
    if (!p?.proofFile || proofStatementId(p.proofFile) !== sid) return failJson(404, '这张结算单没有上传凭证')
    const adminId = await currentAdminId()
    await writeAudit(null, { actorUserId: adminId, actorKind: 'PLATFORM', tenantId: head.tenantId, action: 'statement.proof_view', targetType: 'statement', targetId: head.statementNo })
    return await streamProof(p.proofFile)
  } catch (e) {
    return adminFail(e, '下载凭证')
  }
}

export async function POST(req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  const len = Number(req.headers.get('content-length') || '0')
  if (len > 6 * 1024 * 1024) return failJson(400, '凭证不能超过 5MB')
  let key: string | null = null
  try {
    const head = await statementHeadOr404(sid)
    let file: File | null = null
    try {
      const form = await req.formData()
      const v = form.get('proof')
      if (v && typeof v !== 'string') file = v as File
    } catch {
      return failJson(400, '请用表单上传凭证文件')
    }
    if (!file) return failJson(400, '请选择凭证文件')
    const adminId = await currentAdminId()
    key = await saveProof(sid, file)
    const r = await prisma.tenantPayout.updateMany({ where: { statementId: sid, proofFile: null }, data: { proofFile: key } })
    if (r.count !== 1) {
      await removeProof(key)
      key = null
      return failJson(409, '这张结算单尚未登记打款，或已经有凭证', 'CONFLICT')
    }
    await writeAudit(null, { actorUserId: adminId, actorKind: 'PLATFORM', tenantId: head.tenantId, action: 'statement.proof', targetType: 'statement', targetId: head.statementNo })
    return success(null, '凭证已上传')
  } catch (e) {
    if (key) await removeProof(key)
    if (e instanceof ProofFileError) return failJson(400, e.message)
    return adminFail(e, '上传凭证')
  }
}
