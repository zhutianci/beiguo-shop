'use client'

/**
 * 「设置」标签（docs/微信机器人-设计.md §14「设置」、§5.6、§8.6）：编辑 bot_config 里后台可调的那部分（EditableConfig）。
 *  · 数字先在页面里只核对「是不是数字」，范围以接口为准（接口按 normalizeBotConfig 的范围逐项校验，错了按字段标红）；
 *  · 乐观并发：提交带读到的 version，期间有人改过（包括锁定 / 解锁）→ 409，提示刷新后再改，不会覆盖别人的修改；
 *  · 锁定状态与提卡专用账号只读：前者只能经「概览」的锁定 / 解锁，后者只由种子 SQL 写；
 *  · 环境项（BOT_ENABLED、协议服务密钥、同城代理）只显示「配没配」，值在服务器的环境变量里。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, RotateCcw, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CommandInfoDTO, EditableConfig, SettingsDTO } from '../types'
import { api, Badge, bjTime, FlashNote, hhmm, inputCls, minuteOf, Note, SCOPE_LABEL, TIER_TEXT, type Flash } from './shared'

interface FormState {
  enabled: boolean
  issuePerDay: string
  issueAmountPerDay: string
  issuePerCommand: string
  belowRatio: string
  aboveRatio: string
  perConvSeconds: string
  jitterSeconds: string
  perMinute: string
  perHour: string
  quietOn: boolean
  quietFrom: string
  quietTo: string
  linkOrigin: string
  tenantReplyTtlDays: string
  newAccountQuietHours: string
  disabled: string[]
}

/** 表单字段 → 接口字段路径（接口 failFields 的键），用来把接口的错误标到对应输入框上 */
const FIELD_PATH: Partial<Record<keyof FormState, string>> = {
  enabled: 'enabled',
  issuePerDay: 'caps.issuePerDay',
  issueAmountPerDay: 'caps.issueAmountPerDay',
  issuePerCommand: 'caps.issuePerCommand',
  belowRatio: 'priceWarn.belowRatio',
  aboveRatio: 'priceWarn.aboveRatio',
  perConvSeconds: 'pacing.perConvSeconds',
  jitterSeconds: 'pacing.jitterSeconds',
  perMinute: 'pacing.perMinute',
  perHour: 'pacing.perHour',
  quietFrom: 'quietDefault',
  linkOrigin: 'linkOrigin',
  tenantReplyTtlDays: 'tenantReplyTtlDays',
  newAccountQuietHours: 'newAccountQuietHours',
  disabled: 'disabledCommands',
}

function toForm(c: EditableConfig): FormState {
  return {
    enabled: c.enabled,
    issuePerDay: String(c.caps.issuePerDay),
    issueAmountPerDay: String(c.caps.issueAmountPerDay),
    issuePerCommand: String(c.caps.issuePerCommand),
    belowRatio: String(c.priceWarn.belowRatio),
    aboveRatio: String(c.priceWarn.aboveRatio),
    perConvSeconds: String(c.pacing.perConvSeconds),
    jitterSeconds: String(c.pacing.jitterSeconds),
    perMinute: String(c.pacing.perMinute),
    perHour: String(c.pacing.perHour),
    quietOn: !!c.quietDefault,
    quietFrom: hhmm(c.quietDefault?.from ?? 23 * 60),
    quietTo: hhmm(c.quietDefault?.to ?? 8 * 60),
    linkOrigin: c.linkOrigin,
    tenantReplyTtlDays: String(c.tenantReplyTtlDays),
    newAccountQuietHours: String(c.newAccountQuietHours),
    disabled: c.disabledCommands.slice(),
  }
}

/** 表单 → EditableConfig。这里只拦「不是数字」这类明显的错，范围由接口校验 */
function fromForm(f: FormState): { config: EditableConfig; errors: null } | { config: null; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const num = (k: keyof FormState): number => {
    const s = String(f[k]).trim()
    const n = s === '' ? NaN : Number(s)
    if (!Number.isFinite(n)) errors[FIELD_PATH[k] ?? k] = '请填数字'
    return n
  }
  const issuePerDay = num('issuePerDay')
  const issueAmountPerDay = num('issueAmountPerDay')
  const issuePerCommand = num('issuePerCommand')
  const belowRatio = num('belowRatio')
  const aboveRatio = num('aboveRatio')
  const perConvSeconds = num('perConvSeconds')
  const jitterSeconds = num('jitterSeconds')
  const perMinute = num('perMinute')
  const perHour = num('perHour')
  const tenantReplyTtlDays = num('tenantReplyTtlDays')
  const newAccountQuietHours = num('newAccountQuietHours')
  let quietDefault: EditableConfig['quietDefault'] = null
  if (f.quietOn) {
    const from = minuteOf(f.quietFrom)
    const to = minuteOf(f.quietTo)
    if (from === null || to === null) errors.quietDefault = '时间格式不对'
    else if (from === to) errors.quietDefault = '开始与结束不能相同'
    else quietDefault = { from, to }
  }
  if (Object.keys(errors).length) return { config: null, errors }
  return {
    config: {
      enabled: f.enabled,
      caps: { issuePerDay, issueAmountPerDay, issuePerCommand },
      priceWarn: { belowRatio, aboveRatio },
      pacing: { perConvSeconds, jitterSeconds, perMinute, perHour },
      quietDefault,
      linkOrigin: f.linkOrigin.trim(),
      tenantReplyTtlDays,
      disabledCommands: f.disabled.slice(),
      newAccountQuietHours,
    },
    errors: null,
  }
}

export function SettingsTab() {
  const [data, setData] = useState<SettingsDTO | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<Flash>(null)
  const [conflict, setConflict] = useState(false)
  const [busy, setBusy] = useState(false)

  /** 用接口返回的最新设置整体替换页面状态（读取、保存成功都走这里） */
  const apply = useCallback((d: SettingsDTO) => {
    setData(d)
    setForm(d.config ? toForm(d.config) : null)
    setDirty(false)
    setErrors({})
    setConflict(false)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const r = await api<SettingsDTO>('/api/admin/bot/settings')
    setLoading(false)
    if (r.ok && r.data) {
      apply(r.data)
      setLoadErr(null)
    } else setLoadErr(r.error || '读取设置失败')
  }, [apply])

  useEffect(() => {
    void load()
  }, [load])

  const reload = () => {
    if (dirty && !window.confirm('放弃还没保存的修改，重新加载？')) return
    setFlash(null)
    void load()
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f))
    setDirty(true)
  }

  // 注册表里已经没有的关闭项（指令改名 / 删除后留下的）：保存时去掉
  const registryNames = useMemo(() => new Set((data?.commands ?? []).map((c) => c.name)), [data])
  const stale = data && !data.commandsError && form ? form.disabled.filter((n) => !registryNames.has(n)) : []

  const save = async () => {
    if (!data || !form || data.version === null) return
    const built = fromForm(form)
    if (!built.config) {
      setErrors(built.errors)
      setFlash({ tone: 'err', text: '有填写不对的地方，已标红' })
      return
    }
    const config = built.config
    if (!data.commandsError) config.disabledCommands = config.disabledCommands.filter((n) => registryNames.has(n))
    setBusy(true)
    setFlash(null)
    const r = await api<SettingsDTO>('/api/admin/bot/settings', { method: 'PUT', body: { version: data.version, config } })
    setBusy(false)
    if (r.ok && r.data) {
      apply(r.data)
      setFlash({ tone: 'ok', text: r.message || '已保存' })
      return
    }
    if (r.status === 409) setConflict(true)
    setErrors(r.errors ?? {})
    setFlash({ tone: 'err', text: r.error || '保存失败' })
  }

  const resetDefaults = () => {
    if (!data) return
    if (!window.confirm('把下面的表单填回出厂默认值？（只是填进表单，点「保存」才生效）')) return
    setForm(toForm(data.defaults))
    setDirty(true)
    setErrors({})
  }

  const err = (k: keyof FormState) => errors[FIELD_PATH[k] ?? k]

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-gray-400">
          {loadErr ? (
            <div className="space-y-3">
              <Note tone="err">{loadErr}</Note>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                重试
              </Button>
            </div>
          ) : (
            '加载中...'
          )}
        </CardContent>
      </Card>
    )
  }

  const d = data.defaults

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-gray-500">
          配置版本 {data.version ?? '—'}
          {dirty && <span className="ml-2 text-amber-600">有未保存的修改</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={busy}>
            <RefreshCw className={cn('mr-1 h-4 w-4', loading && 'animate-spin')} /> 重新加载
          </Button>
          {form && (
            <>
              <Button variant="outline" size="sm" onClick={resetDefaults} disabled={busy}>
                <RotateCcw className="mr-1 h-4 w-4" /> 填回出厂默认
              </Button>
              <Button size="sm" onClick={save} loading={busy} disabled={busy || !dirty}>
                <Save className="mr-1 h-4 w-4" /> 保存
              </Button>
            </>
          )}
        </div>
      </div>

      {!data.ok && (
        <Note tone="err">
          机器人配置（settings.bot_config）读取失败：{data.reason}。读取失败期间提卡、补货与改设置的指令一律拒绝、推送按出厂默认照常；这里不能编辑，需要先在数据库里排查这一行。
        </Note>
      )}
      {conflict && (
        <Note tone="err" className="flex flex-wrap items-center justify-between gap-2">
          <span>配置在你编辑期间被修改过（有人锁定 / 解锁，或在别处保存了设置）。请重新加载最新配置后再改。</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFlash(null)
              void load()
            }}
          >
            重新加载
          </Button>
        </Note>
      )}
      <FlashNote flash={flash} onClose={() => setFlash(null)} />

      {form && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>提卡上限与价格提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                每日上限按北京时间自然日、按提卡记录统计。目的不是挡站长自己，而是万一管理员微信被盗、或协议服务被动了手脚时，把损失封顶。价格异常只在回执里提醒，不拦。
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumField label="每日提卡张数上限" unit="张" hint={`0–1000，默认 ${d.caps.issuePerDay}`} value={form.issuePerDay} onChange={(v) => set('issuePerDay', v)} error={err('issuePerDay')} />
                <NumField label="每日提卡金额上限" unit="元" hint={`0–1,000,000，默认 ${d.caps.issueAmountPerDay}`} value={form.issueAmountPerDay} onChange={(v) => set('issueAmountPerDay', v)} error={err('issueAmountPerDay')} step="0.01" />
                <NumField label="单次提卡最多" unit="张" hint={`1–50，默认 ${d.caps.issuePerCommand}`} value={form.issuePerCommand} onChange={(v) => set('issuePerCommand', v)} error={err('issuePerCommand')} />
                <NumField label="低价提示：低于站价的" unit="倍" hint={`0–1，默认 ${d.priceWarn.belowRatio}（= 站价的 ${Math.round(d.priceWarn.belowRatio * 100)}%）`} value={form.belowRatio} onChange={(v) => set('belowRatio', v)} error={err('belowRatio')} step="0.05" />
                <NumField label="高价提示：高于站价的" unit="倍" hint={`1–100，默认 ${d.priceWarn.aboveRatio}`} value={form.aboveRatio} onChange={(v) => set('aboveRatio', v)} error={err('aboveRatio')} step="0.1" />
              </div>
              <p className="text-xs text-gray-400">单价低于发出那几张卡的成本时也会提醒（不受这里的倍数影响）。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>推送</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />
                <span>
                  推送运行开关<span className="ml-1 text-xs text-gray-400">（环境变量 BOT_ENABLED 之外的第二道开关，后台可临时停推送；默认开）</span>
                  {err('enabled') && <span className="block text-xs text-red-600">{err('enabled')}</span>}
                </span>
              </label>
              <div>
                <div className="text-sm font-medium text-gray-700">发送节奏</div>
                <p className="text-xs text-gray-400">发得少、发得慢、合并发，是降低封号风险的主要手段（短时大量、多群同内容最容易触发风控）。</p>
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <NumField label="同一个群两条之间至少" unit="秒" hint={`1–120，默认 ${d.pacing.perConvSeconds}`} value={form.perConvSeconds} onChange={(v) => set('perConvSeconds', v)} error={err('perConvSeconds')} step="0.5" />
                  <NumField label="另加随机抖动最多" unit="秒" hint={`0–60，默认 ${d.pacing.jitterSeconds}`} value={form.jitterSeconds} onChange={(v) => set('jitterSeconds', v)} error={err('jitterSeconds')} step="0.5" />
                  <NumField label="全局每分钟最多" unit="条" hint={`1–40，默认 ${d.pacing.perMinute}`} value={form.perMinute} onChange={(v) => set('perMinute', v)} error={err('perMinute')} />
                  <NumField label="全局每小时最多" unit="条" hint={`1–2000，默认 ${d.pacing.perHour}`} value={form.perHour} onChange={(v) => set('perHour', v)} error={err('perHour')} />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">新建分站群的默认免打扰（北京时间）</div>
                <p className="text-xs text-gray-400">只影响之后新绑定的分站群；已有的群在「会话」里逐个改。免打扰时段里的普通动态推迟到结束后合并成一条，紧急消息与日报不受限。主站管理群不设免打扰。</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={form.quietOn} onChange={() => set('quietOn', true)} /> 设
                  </label>
                  <input type="time" step={60} value={form.quietFrom} onChange={(e) => set('quietFrom', e.target.value)} disabled={!form.quietOn} className={inputCls} />
                  <span>到</span>
                  <input type="time" step={60} value={form.quietTo} onChange={(e) => set('quietTo', e.target.value)} disabled={!form.quietOn} className={inputCls} />
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={!form.quietOn} onChange={() => set('quietOn', false)} /> 不设
                  </label>
                  <span className="text-xs text-gray-400">默认 {d.quietDefault ? `${hhmm(d.quietDefault.from)}–${hhmm(d.quietDefault.to)}` : '不设'}</span>
                </div>
                {err('quietFrom') && <div className="mt-1 text-xs text-red-600">{err('quietFrom')}</div>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumField
                  label="新号保护：登录后多少小时内只发管理群"
                  unit="小时"
                  hint={`0–240，0 = 不保护，默认 ${d.newAccountQuietHours}`}
                  value={form.newAccountQuietHours}
                  onChange={(v) => set('newAccountQuietHours', v)}
                  error={err('newAccountQuietHours')}
                />
                <NumField
                  label="分站群里的「快速回复」链接有效期"
                  unit="天"
                  hint={`1–30，默认 ${d.tenantReplyTtlDays}（只影响之后发出的链接）`}
                  value={form.tenantReplyTtlDays}
                  onChange={(v) => set('tenantReplyTtlDays', v)}
                  error={err('tenantReplyTtlDays')}
                />
              </div>
              <label className="block text-sm">
                <span className="text-gray-700">推送链接域名</span>
                <input
                  value={form.linkOrigin}
                  onChange={(e) => set('linkOrigin', e.target.value)}
                  placeholder="留空 = 用环境变量 BOT_LINK_ORIGIN / APP_URL"
                  className={cn(inputCls, 'mt-1 w-full max-w-md font-mono', err('linkOrigin') && 'border-red-500')}
                />
                {err('linkOrigin') ? (
                  <span className="mt-0.5 block text-xs text-red-600">{err('linkOrigin')}</span>
                ) : (
                  <span className="mt-0.5 block text-xs text-gray-400">
                    现在生效：<span className="font-mono">{data.effectiveLinkOrigin}</span>。主域名在微信里被拦截时，换成备用的独立域名（https:// 开头、不带路径）。
                  </span>
                )}
              </label>
            </CardContent>
          </Card>

          <CommandsCard
            commands={data.commands}
            commandsError={data.commandsError}
            disabled={form.disabled}
            stale={stale}
            error={err('disabled')}
            onChange={(next) => set('disabled', next)}
          />
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>只读信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <EnvRow ok={data.env.botEnabled} label="BOT_ENABLED=1（机器人总开关）" />
            <div className="text-gray-700">
              适配器：<span className="font-mono">{data.env.adapter}</span>
              {data.env.adapter === 'console' && <span className="text-xs text-gray-400">（本地测试，不连微信）</span>}
            </div>
            <EnvRow ok={data.env.adminKeyConfigured} label="BOT_WXPAD_ADMIN_KEY（协议服务管理密钥）" />
            <EnvRow ok={data.env.hookSecretConfigured} label="BOT_WXPAD_HOOK_SECRET（回调密钥，至少 32 位）" />
            <EnvRow
              ok={data.env.proxyConfigured}
              optional
              label={`BOT_WXPAD_PROXY（同城代理）：${data.env.proxyConfigured ? '已启用，扫码登录时协议服务经它出网' : '未启用（默认不配；扫码后频繁被要求重新登录时再考虑）'}`}
            />
          </div>
          <p className="text-xs text-gray-400">环境变量的值只在服务器上，这里只显示「配没配」；改了要重建 app 容器才生效。</p>
          {data.readonly && (
            <div className="grid gap-x-6 gap-y-1.5 border-t border-gray-100 pt-3 sm:grid-cols-2">
              <div className="text-gray-700">
                锁定状态：
                {data.readonly.locked ? (
                  <Badge tone="red">
                    已锁定 · {data.readonly.lockedBy || '—'} · {bjTime(data.readonly.lockedAt)}
                  </Badge>
                ) : (
                  <Badge tone="green">未锁定</Badge>
                )}
                <span className="ml-1 text-xs text-gray-400">（在「概览」锁定 / 解锁）</span>
              </div>
              <div className="text-gray-700">
                提卡专用账号：
                {data.readonly.issueUserId ? (
                  <span className="font-mono">用户 #{data.readonly.issueUserId}</span>
                ) : (
                  <span className="text-red-600">未设置（提卡不可用，需要执行种子 SQL）</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NumField({
  label,
  unit,
  hint,
  value,
  onChange,
  error,
  step,
}: {
  label: string
  unit?: string
  hint?: string
  value: string
  onChange: (v: string) => void
  error?: string
  step?: string
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step ?? '1'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'w-32', error && 'border-red-500')}
        />
        {unit && <span className="text-gray-500">{unit}</span>}
      </span>
      {error ? <span className="mt-0.5 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-0.5 block text-xs text-gray-400">{hint}</span> : null}
    </label>
  )
}

function EnvRow({ ok, label, optional }: { ok: boolean; label: string; optional?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-gray-700">
      <span className={cn('mt-0.5 shrink-0 text-xs font-bold', ok ? 'text-green-600' : optional ? 'text-gray-400' : 'text-red-500')}>{ok ? '✓' : optional ? '—' : '✗'}</span>
      <span>{label}</span>
    </div>
  )
}

/** 单指令开关：勾掉 = 临时关闭（群里再发会回「已在后台临时关闭」）。「锁定」「帮助」不能关 */
function CommandsCard({
  commands,
  commandsError,
  disabled,
  stale,
  error,
  onChange,
}: {
  commands: CommandInfoDTO[]
  commandsError: string | null
  disabled: string[]
  stale: string[]
  error?: string
  onChange: (next: string[]) => void
}) {
  const toggle = (name: string, on: boolean) => {
    const set = new Set(disabled)
    if (on) set.delete(name)
    else set.add(name)
    onChange(Array.from(set))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>单指令开关</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-gray-500">临时关掉某个指令（例如提卡出了问题先关掉「提卡」）；比「锁定」范围小，不影响其它指令。每个管理员能用到哪一级在「管理员」里设。</p>
        {error && <Note tone="err">{error}</Note>}
        {commandsError ? (
          <>
            <Note tone="err">{commandsError}。现在只能保留或去掉已有的关闭项，不能新增。</Note>
            {disabled.length === 0 ? (
              <div className="text-gray-400">当前没有关闭任何指令</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {disabled.map((n) => (
                  <span key={n} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
                    {n}（已关闭）
                    <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => toggle(n, true)}>
                      重新打开
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : commands.length === 0 ? (
          <div className="text-gray-400">注册表里还没有指令</div>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {commands.map((c) => {
              const on = !disabled.includes(c.name)
              return (
                <label
                  key={c.name}
                  className={cn('flex items-start gap-2 rounded-lg border px-3 py-2', on ? 'border-gray-200' : 'border-amber-200 bg-amber-50', c.protected && 'bg-gray-50')}
                >
                  <input type="checkbox" className="mt-1" checked={on || c.protected} disabled={c.protected} onChange={(e) => toggle(c.name, e.target.checked)} />
                  <span className="min-w-0">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    {c.aliases.length > 0 && <span className="ml-1 text-xs text-gray-400">（{c.aliases.join('、')}）</span>}
                    <span className="ml-2 text-xs text-gray-500">{TIER_TEXT[c.tier] ?? `T${c.tier}`}</span>
                    {c.protected && <span className="ml-2 text-xs text-gray-400">不能关闭</span>}
                    {!on && !c.protected && <span className="ml-2 text-xs font-medium text-amber-700">已关闭</span>}
                    <span className="block text-xs text-gray-500">{c.summary}</span>
                    <span className="block text-[11px] text-gray-400">可用于：{c.scopes.map((s) => SCOPE_LABEL[s] ?? s).join('、')}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
        {stale.length > 0 && <div className="text-xs text-amber-700">这些关闭项在指令注册表里已经不存在，保存时会去掉：{stale.join('、')}</div>}
      </CardContent>
    </Card>
  )
}
