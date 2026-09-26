export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, failJson, parseIdParam, readPayoutRequest, statementHeadOr404 } from '@/lib/tenant/admin-tenants'
import { ProofFileError, removeProof, saveProof } from '@/lib/tenant/private-files'
import { registerPayout } from '@/lib/tenant/statement'

/**
 * 登记打款：PAYING → PAID（设计 10.9、10.10）。multipart：amountCents, withholdCents, method, externalTradeNo, paidAt, voucherType,
 * partnerInvoiceNo?, partnerInvoiceAmountCents?, proof?（png / jpg / pdf ≤ 5MB，存私有目录，不在 /uploads）。
 *  · 金额守恒：amount + withhold = 结算单 net，否则 400；
 *  · 流水号全局唯一：重复 409（一笔转账不能挂两张单）；
 *  · 合作方要求发票（requirePartnerInvoice）时必须填发票号，且发票金额 = 实际打款额（含代扣），否则 400。
 * 凭证先落盘再登记；登记没成功就把刚写的文件删掉（不留孤儿文件）。
 */

const FAIL: Record<string, [number, string]> = {
  CONFLICT: [409, '结算单不在「打款中」状态（请先认领）'],
  AMOUNT_MISMATCH: [400, '打款金额 + 代扣金额必须等于结算单的打款额'],
  DUP_TRADE_NO: [409, '这个转账流水号已经登记过'],
  INVOICE_REQUIRED: [400, '该渠道要求发票：请填写渠道开具的发票号，且发票金额等于打款额（含代扣）'],
}

export async function POST(req: NextRequest, { params }: { params: { sid: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const sid = parseIdParam(params.sid)
  if (!sid) return error('结算单不存在', 404)
  const p = await readPayoutRequest(req)
  if (p instanceof Response) return p
  let proofKey: string | null = null
  try {
    await statementHeadOr404(sid)
    const adminId = await currentAdminId()
    if (p.proof) proofKey = await saveProof(sid, p.proof)
    const r = await registerPayout(sid, adminId, {
      amountCents: p.amountCents,
      withholdCents: p.withholdCents,
      method: p.method,
      externalTradeNo: p.externalTradeNo,
      paidAt: p.paidAt,
      proofFile: proofKey,
      voucherType: p.voucherType,
      partnerInvoiceNo: p.partnerInvoiceNo,
      partnerInvoiceAmountCents: p.partnerInvoiceAmountCents,
    })
    if (r !== 'OK') {
      if (proofKey) await removeProof(proofKey)
      const [status, text] = FAIL[r] ?? [400, r]
      return failJson(status, text, r)
    }
    return success(null, '已登记打款')
  } catch (e) {
    if (proofKey) await removeProof(proofKey)
    if (e instanceof ProofFileError) return failJson(400, e.message)
    return adminFail(e, '登记打款')
  }
}
