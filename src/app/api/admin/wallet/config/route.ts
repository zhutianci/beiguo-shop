export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import {
  FACTORY_WALLET_CONFIG,
  MAX_TOPUP_CENTS,
  readWalletConfig,
  saveWalletConfig,
  WalletConfigConflict,
  type WalletConfig,
} from '@/lib/wallet/config'

/**
 * wallet_config（docs/短信接码-设计.md §5.3、§7.8 设置）。GET 当前值（读不到给原因）+ 出厂值；
 * PUT { config, expectVersion, confirmLatepay? }：zod 保存校验（不合法 400 + 逐项 errors）；latepayAuto 开 ↔ 关要二次确认（confirmLatepay）；
 * 乐观并发（版本号对不上 409）；每次保存写审计（前后全文）。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const r = await readWalletConfig()
    return success({
      config: r.ok ? r.config : null,
      reason: r.ok ? null : r.reason,
      factory: FACTORY_WALLET_CONFIG,
      maxTopupCents: MAX_TOPUP_CENTS,
    })
  } catch (e) {
    console.error('[wallet] config GET 失败', e)
    return error('读取配置失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as { config?: Partial<WalletConfig>; expectVersion?: unknown; confirmLatepay?: unknown } | null
    if (!body?.config || typeof body.config !== 'object') return error('缺少配置')
    const expectVersion = Number(body.expectVersion)
    if (!Number.isSafeInteger(expectVersion) || expectVersion < 0) return error('缺少版本号')
    const { version: _ignored, ...rest } = body.config as WalletConfig
    const cur = await readWalletConfig()
    const prevLatepay = cur.ok ? cur.config.latepayAuto : null
    if (prevLatepay !== null && typeof rest.latepayAuto === 'boolean' && rest.latepayAuto !== prevLatepay && body.confirmLatepay !== true) {
      return Response.json(
        {
          success: false,
          error: rest.latepayAuto
            ? '打开「迟到付款自动退入」后，能验证归属的迟到付款会自动退进买家的充值余额，确认要打开吗？'
            : '关闭「迟到付款自动退入」后，「付完马上取消」等迟到付款全部要你核对账单后手动退入，确认要关闭吗？',
          needConfirm: 'latepayAuto',
        },
        { status: 409 },
      )
    }
    const r = await saveWalletConfig(rest, expectVersion)
    if (!r.ok) return Response.json({ success: false, error: '配置不合法，未保存', errors: r.errors }, { status: 400 })
    const admin = await getCurrentUser()
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'wallet.config',
      targetType: 'setting',
      targetId: 'wallet_config',
      diff: { before: r.before, after: r.config },
      req: request,
    })
    return success({ config: r.config }, '已保存')
  } catch (e) {
    if (e instanceof WalletConfigConflict) return error(e.message, 409)
    console.error('[wallet] config PUT 失败', e)
    return error('保存配置失败', 500)
  }
}
