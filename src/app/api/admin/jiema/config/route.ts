export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { readSmsConfig, saveSmsConfig, SmsConfigConflict } from '@/lib/jiema/config'
import { invalidateCatalogSnapshot } from '@/lib/jiema/catalog'
import { FACTORY_SMS_CONFIG, JIEMA_ORDER_AVAILABLE, checkSmsConfig, smsConfigWarnings, type SmsConfig } from '@/lib/jiema-config-schema'

/**
 * sms_config（docs/短信接码-设计.md §5.3、§7.3 定价、§7.6 设置）。
 * GET：当前值（读不到给原因与逐项错误）+ 出厂值 + storedVersion（坏配置也能从页面修好）+ orderAvailable（S2 之前 false：受众不能选「全部用户」）。
 * PUT { config, expectVersion, confirmLowCoef? }：zod 校验（不合法 400 + 逐项 errors）；售价系数低于成本汇率要二次确认（409 needConfirm）；
 * 乐观并发（版本号对不上 409）；保存后版本 +1、只影响之后的单（锁价快照 §4.4）；每次保存写审计（前后全文）。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const r = await readSmsConfig()
    return success({
      config: r.ok ? r.config : null,
      reason: r.ok ? null : r.reason,
      errors: r.ok ? null : (r.errors ?? null),
      storedVersion: r.storedVersion,
      factory: FACTORY_SMS_CONFIG,
      orderAvailable: JIEMA_ORDER_AVAILABLE,
      warnings: r.ok ? smsConfigWarnings(r.config).warnings : [],
    })
  } catch (e) {
    console.error('[jiema] config GET 失败', e)
    return error('读取配置失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as { config?: Partial<SmsConfig>; expectVersion?: unknown; confirmLowCoef?: unknown } | null
    if (!body?.config || typeof body.config !== 'object') return error('缺少配置')
    const expectVersion = Number(body.expectVersion)
    if (!Number.isSafeInteger(expectVersion) || expectVersion < 0) return error('缺少版本号')
    const { version: _ignored, ...rest } = body.config as SmsConfig
    void _ignored
    // 先校验（不合法 400 逐项标红），再问二次确认：填错位置的成本汇率不该先弹「x 低于成本汇率」
    const pre = checkSmsConfig({ ...rest, version: expectVersion + 1 })
    if (!pre.ok) return Response.json({ success: false, error: '配置不合法，未保存', errors: pre.errors }, { status: 400 })
    const w = smsConfigWarnings(pre.config)
    if (w.needConfirm.length && body.confirmLowCoef !== true) {
      return Response.json({ success: false, error: w.needConfirm[0], needConfirm: 'lowCoef' }, { status: 409 })
    }
    const r = await saveSmsConfig(rest, expectVersion)
    if (!r.ok) return Response.json({ success: false, error: '配置不合法，未保存', errors: r.errors }, { status: 400 })
    invalidateCatalogSnapshot()
    const admin = await getCurrentUser()
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'jiema.config',
      targetType: 'setting',
      targetId: 'sms_config',
      diff: { before: r.before, after: r.config },
      req: request,
    })
    return success({ config: r.config, warnings: smsConfigWarnings(r.config).warnings }, `已保存（版本 ${r.config.version}）`)
  } catch (e) {
    if (e instanceof SmsConfigConflict) return Response.json({ success: false, error: e.message, conflict: e.storedBroken ? 'BROKEN' : 'VERSION' }, { status: 409 })
    console.error('[jiema] config PUT 失败', e)
    return error('保存配置失败', 500)
  }
}
