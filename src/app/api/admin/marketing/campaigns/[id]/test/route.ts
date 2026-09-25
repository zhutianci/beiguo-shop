export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error, notFound } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendCampaignTest, testSendStatus, TEST_SEND_MAX_PER_CALL } from '@/lib/marketing/test-send'
import { knownErrorResponse, parseId, readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 测试发送。收件人只能是管理员账号邮箱 ∪ 设置页登记的测试邮箱（≤5 个/次，24 小时 ≤30 封），
 * 规则全在 lib/marketing/test-send.ts；这里只做鉴权与参数校验。
 *
 * GET 给弹窗用：可选的收件人与剩余额度。
 */

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const exists = await prisma.marketingCampaign.count({ where: { id } })
    if (!exists) return notFound('活动不存在')
    return success(await testSendStatus())
  } catch (err) {
    console.error(`[admin/marketing] 读取活动 #${params.id} 的测试收件人失败:`, err)
    return error('读取测试收件人失败')
  }
}

const postSchema = z
  .object({
    emails: z
      .array(z.string().trim().toLowerCase().email('收件人邮箱格式不正确').max(191))
      .min(1, '请至少选择一个测试收件人')
      .max(TEST_SEND_MAX_PER_CALL, `一次最多发给 ${TEST_SEND_MAX_PER_CALL} 个地址`),
  })
  .strip()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    const id = parseId(params.id)
    if (!id) return notFound('活动不存在')
    const body = await readJsonBody(request, 16 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = postSchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const result = await sendCampaignTest(id, parsed.data.emails, me.id)
    const okCount = result.sent.filter((s) => s.ok).length
    const message =
      okCount === result.sent.length
        ? `已发送 ${okCount} 封测试邮件`
        : okCount > 0
          ? `成功 ${okCount} 封，失败或跳过 ${result.sent.length - okCount} 封`
          : '测试邮件没有发出去，请看每个地址后面的说明'
    return success(result, message)
  } catch (err) {
    // 内容检查不通过时 payload 是完整的 TestSendResult（含 issues），放在 data 里给弹窗逐条展示
    const known = knownErrorResponse(err)
    if (known) return known
    console.error(`[admin/marketing] 活动 #${params.id} 测试发送失败:`, err)
    return error('测试发送失败')
  }
}
