'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Plus, RefreshCw, Save, Undo2, X, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ZodIssue } from 'zod'
import { marketingConfigSchema, SUBJECT_PREFIXES, type ConfigResponse, type MarketingConfig } from '@/lib/marketing/types'
import { fmtInt, fmtTime, isAbortError, mktFetch } from '@/components/admin/marketing/api'
import { HaltBanner } from '@/components/admin/marketing/halt-banner'
import { ProgressBar } from '@/components/admin/marketing/stat-tile'
import { cn } from '@/lib/utils'

/**
 * 营销推广 · 发送设置：上线检查清单、阿里云账户状态、今日额度拆解、回执同步状态、急停，以及全部策略配置。
 *
 * 这些数字直接决定「发多快、发多少、发给谁」，每一项都写清楚含义与默认值；
 * 改动保存时服务端会记审计（CONFIG）。
 */

/** 字段中文名（校验失败时把 zod 的路径翻成人话） */
const FIELD_LABEL: Record<string, string> = {
  enabled: '总开关',
  defaultEligible: '默认可接收',
  fromAlias: '发件人名称',
  subjectPrefix: '主题前缀',
  companyName: '经营主体全称',
  brandName: '品牌名',
  contactEmail: '联系邮箱',
  footerNote: '页脚补充说明',
  testRecipients: '测试收件人',
  ratePerSec: '发送速度',
  dailyCap: '每日上限',
  maxQuotaShare: '阿里云额度占比',
  sendWindow: '发送时段',
  'sendWindow.start': '发送时段开始',
  'sendWindow.end': '发送时段结束',
  'warmup.enabled': '预热开关',
  'warmup.schedule': '预热阶梯',
  canarySize: '每日试探封数',
  'freq.minHours': '两封最短间隔',
  'freq.max7d': '7 天内最多',
  'freq.max30d': '30 天内最多',
  'sunset.enabled': '长期未互动自动停发',
  includeTextBody: '附带纯文本版',
  attributionDays: '归因天数',
}

function fieldLabel(path: (string | number)[]): string {
  const key = path.filter((p) => typeof p === 'string').join('.')
  return FIELD_LABEL[key] || FIELD_LABEL[String(path[0])] || key
}

/** zod 的默认报错是英文，翻成站长看得懂的话；schema 里自带中文说明的（refine）原样用 */
function issueText(e: ZodIssue): string {
  switch (e.code) {
    case 'invalid_type':
      return '请填写有效的值'
    case 'too_small':
      return e.type === 'array' ? `至少要有 ${e.minimum} 项` : e.type === 'string' ? '不能为空' : `不能小于 ${e.minimum}`
    case 'too_big':
      return e.type === 'array' ? `最多 ${e.maximum} 项` : e.type === 'string' ? `最多 ${e.maximum} 个字` : `不能大于 ${e.maximum}`
    case 'invalid_string':
    case 'invalid_union':
      return '格式不正确'
    case 'invalid_enum_value':
      return '只能从给定的选项里选'
    default:
      return e.message
  }
}

export default function MarketingSettingsPage() {
  const [data, setData] = useState<ConfigResponse | null>(null)
  const [form, setForm] = useState<MarketingConfig | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (opts: { keepForm?: boolean } = {}) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRefreshing(true)
    try {
      const r = await mktFetch<ConfigResponse>('/api/admin/marketing/config', { signal: ctrl.signal })
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        setData(r.data)
        // 刷新状态面板时不覆盖正在编辑、还没保存的表单
        if (!opts.keepForm) setForm(r.data.config)
        setLoadErr('')
      } else setLoadErr(r.error || '加载失败')
    } catch (e) {
      if (!isAbortError(e)) setLoadErr('加载失败')
    } finally {
      if (abortRef.current === ctrl) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const dirty = useMemo(() => !!data && !!form && JSON.stringify(form) !== JSON.stringify(data.config), [data, form])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set = <K extends keyof MarketingConfig>(k: K, v: MarketingConfig[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f))
    setSavedMsg('')
  }

  const save = async () => {
    if (!form || !data) return
    setSaveErr('')
    const parsed = marketingConfigSchema.safeParse(form)
    if (!parsed.success) {
      const e = parsed.error.errors[0]
      setSaveErr(`「${fieldLabel(e.path)}」不正确：${issueText(e)}`)
      return
    }
    // 总开关与默认可接收的切换在控件上已经确认过；这里只对「contactEmail 为空却打开总开关」再提醒一次
    if (parsed.data.enabled && !parsed.data.contactEmail) {
      if (!confirm('联系邮箱还没填 —— 没有联系邮箱时活动一封都发不出去（法律要求页脚有能收信的联系方式）。仍然保存？')) return
    }
    setSaving(true)
    try {
      const r = await mktFetch<ConfigResponse>('/api/admin/marketing/config', { method: 'PUT', body: { config: parsed.data } })
      if (!r.ok || !r.data) {
        setSaveErr(r.error || '保存失败')
        return
      }
      setData(r.data)
      setForm(r.data.config)
      setSavedMsg('已保存（已记入审计）')
    } finally {
      setSaving(false)
    }
  }

  if (!data || !form) {
    return loadErr ? (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
          {loadErr}
          <button className="ml-2 underline" onClick={() => load()}>
            重试
          </button>
        </CardContent>
      </Card>
    ) : (
      <div className="flex justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const defaults = data.defaults

  return (
    <div className="space-y-6 pb-20">
      <HaltBanner enabled={data.config.enabled} halt={data.halt} dryRun={data.sender.dryRun} onChanged={() => load({ keepForm: true })} showSettingsLink={false} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChecklistCard data={data} onRefresh={() => load({ keepForm: true })} refreshing={refreshing} />
        <AccountCard data={data} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TodayCard data={data} />
        <SyncCard data={data} />
      </div>

      {/* ====================== 配置表单 ====================== */}
      <Card>
        <CardHeader>
          <CardTitle>总开关与接收规则</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SwitchRow
            checked={form.enabled}
            onChange={(v) => {
              if (!v && !confirm('关闭总开关后，所有活动停止发送（排队中的保留，打开后接着发）。\n\n点页面底部「保存设置」后生效。确定关闭？')) return
              set('enabled', v)
            }}
            title="营销发送总开关"
            desc="关闭 = 所有活动都不发（排队保留）；可以照常编辑、测试、提交。部署或排查问题时先关掉它。"
          />
          <div className="border-t border-gray-100 pt-5">
            <SwitchRow
              checked={form.defaultEligible}
              onChange={(v) => {
                if (v) {
                  const ok = confirm(
                    '开启「默认可接收」？\n\n开启后，没有明确点过「订阅」的注册用户也会收到营销邮件（只要没退订）。\n\n' +
                      '法律风险：广告法第 43 条、《互联网电子邮件服务管理办法》第 13 条、消费者权益保护法第 29 条都要求发送商业性邮件前取得同意；' +
                      'QQ 邮箱群发指南也点名禁止「不加选择地给所有注册用户发送商业性邮件」。\n\n' +
                      '一键退订、(AD) 标识、频控、预热、熔断能降低风险，但不能消除它。\n\n点页面底部「保存设置」后生效。确定开启？'
                  )
                  if (!ok) return
                } else {
                  const ok = confirm(
                    '切换为「仅发给明确订阅的用户」？\n\n只有亲手点过「确认订阅」的用户会收到营销邮件，其余用户（通常是大多数）都会被跳过，包括已排队的。\n\n点页面底部「保存设置」后生效。确定？'
                  )
                  if (!ok) return
                }
                set('defaultEligible', v)
              }}
              title="默认可接收（opt-out）"
              desc={form.defaultEligible ? '当前：没表态的注册用户也会收到，退订后不再发。' : '当前：只发给明确订阅的用户。'}
            />
            {form.defaultEligible && (
              <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <b>已知法律风险</b>：向未明确同意的用户发送商业性邮件，与广告法 §43、电子邮件服务管理办法 §13(二)、消保法 §29「事先同意」的要求存在冲突。
                  这是站长的经营决定（设计文档 D1）；系统已强制 (AD) 标识、页脚退订与身份信息、首封说明、频控、预热、熔断，不能再省。
                  随时可以关掉这个开关，改为只发给明确订阅的用户。
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>发件信息与页脚</CardTitle>
          <p className="mt-1 text-sm text-gray-500">页脚的经营主体、联系邮箱、退订链接是法律义务，渲染器自动加在每封邮件末尾，编辑器里删不掉。</p>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <TextField label="发件人名称" hint={`收件箱里显示的发件人，最多 14 个字符（默认「${defaults.fromAlias}」）`} value={form.fromAlias} maxLength={14} onChange={(v) => set('fromAlias', v)} />
          <div>
            <FieldLabel label="主题前缀" hint="法律要求商业邮件主题标明广告，只能三选一，不能去掉" />
            <div className="flex gap-2">
              {SUBJECT_PREFIXES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('subjectPrefix', p)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm',
                    form.subjectPrefix === p ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
                  )}
                >
                  {p.trim()}
                  {p === '(AD)' && <span className="ml-1 text-xs text-gray-400">推荐</span>}
                </button>
              ))}
            </div>
          </div>
          <TextField label="经营主体全称" hint="与营业执照一致" value={form.companyName} maxLength={60} onChange={(v) => set('companyName', v)} />
          <TextField label="品牌名" value={form.brandName} maxLength={20} onChange={(v) => set('brandName', v)} />
          <div className="md:col-span-2">
            <TextField
              label="联系邮箱（必填）"
              hint="必须是能收信的邮箱，同时作为回复地址。不要用 QQ 号邮箱 —— 正文出现 QQ 号会触发阿里云禁发规则。不填则所有活动都不能发送"
              value={form.contactEmail}
              maxLength={100}
              placeholder="如 service@bigolab.com"
              invalid={!form.contactEmail}
              onChange={(v) => set('contactEmail', v.trim())}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel label="页脚补充说明" hint="可选，最多 300 字；同样会过禁发词检查" />
            <textarea
              value={form.footerNote}
              maxLength={300}
              rows={2}
              onChange={(e) => set('footerNote', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>测试收件人</CardTitle>
          <p className="mt-1 text-sm text-gray-500">测试发送只能发给这些邮箱与管理员账号的邮箱（防止测试功能被当成群发口子）。最多 10 个，建议 QQ / 163 / Gmail / Outlook 各一个。</p>
        </CardHeader>
        <CardContent>
          <TestRecipientsEditor value={form.testRecipients} onChange={(v) => set('testRecipients', v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>发送节奏与额度</CardTitle>
          <p className="mt-1 text-sm text-gray-500">每天实际能发的量 = 下面三者取最小：每日上限、阿里云日额度 × 占比、预热阶梯。</p>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <NumField label="发送速度（封/秒）" hint={`0.2–2，默认 ${defaults.ratePerSec}。越慢越稳`} value={form.ratePerSec} min={0.2} max={2} step={0.1} onChange={(v) => set('ratePerSec', v)} />
          <NumField label="每日上限（封）" hint={`默认 ${defaults.dailyCap}`} value={form.dailyCap} min={1} max={100000} integer onChange={(v) => set('dailyCap', v)} />
          <NumField
            label="阿里云日额度占比（%）"
            hint={`10–90，默认 ${Math.round(defaults.maxQuotaShare * 100)}。额度是验证码、订单邮件共用的，要留余量`}
            value={Math.round(form.maxQuotaShare * 100)}
            min={10}
            max={90}
            integer
            onChange={(v) => set('maxQuotaShare', Number.isFinite(v) ? Math.round(v) / 100 : v)}
          />
          <div>
            <FieldLabel label="发送时段（北京时间）" hint={`默认 ${defaults.sendWindow.start}:00–${defaults.sendWindow.end}:00，时段外排队`} />
            <div className="flex items-center gap-2 text-sm">
              <select
                value={form.sendWindow.start}
                onChange={(e) => set('sendWindow', { ...form.sendWindow, start: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 bg-white px-2 py-2"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
              至
              <select
                value={form.sendWindow.end}
                onChange={(e) => set('sendWindow', { ...form.sendWindow, end: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 bg-white px-2 py-2"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
            {form.sendWindow.end <= form.sendWindow.start && <p className="mt-1 text-xs text-red-600">结束时间要晚于开始时间</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预热与试探</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            新发信地址要「养」信誉：前一个发送日表现达标（无效 &lt;3%、垃圾 &lt;1%、零投诉）才升一级；超过 45 天没发就回到第一级。
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <SwitchRow checked={form.warmup.enabled} onChange={(v) => set('warmup', { ...form.warmup, enabled: v })} title="启用预热" desc="关闭后不受预热阶梯限制（不建议，除非发信地址已经稳定发送很久）" />
            <ScheduleField value={form.warmup.schedule} disabled={!form.warmup.enabled} defaults={defaults.warmup.schedule} onChange={(v) => set('warmup', { ...form.warmup, schedule: v })} />
          </div>
          <NumField
            label="每日试探封数"
            hint={`10–500，默认 ${defaults.canarySize}。每个活动每天先发这么多，等回执正常再放量；回执异常自动暂停`}
            value={form.canarySize}
            min={10}
            max={500}
            integer
            onChange={(v) => set('canarySize', v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>频率控制</CardTitle>
          <p className="mt-1 text-sm text-gray-500">同一个邮箱跨所有活动计算。太频繁是投诉的头号原因。</p>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <NumField
            label="两封之间最短间隔（小时）"
            hint={`默认 ${defaults.freq.minHours}。不够间隔的会推迟，不会跳过`}
            value={form.freq.minHours}
            min={0}
            max={720}
            integer
            onChange={(v) => set('freq', { ...form.freq, minHours: v })}
          />
          <NumField label="7 天内最多（封）" hint={`默认 ${defaults.freq.max7d}，超出的跳过`} value={form.freq.max7d} min={1} max={20} integer onChange={(v) => set('freq', { ...form.freq, max7d: v })} />
          <NumField label="30 天内最多（封）" hint={`默认 ${defaults.freq.max30d}，超出的跳过`} value={form.freq.max30d} min={1} max={60} integer onChange={(v) => set('freq', { ...form.freq, max30d: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>其他</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <SwitchRow
            checked={form.sunset.enabled}
            onChange={(v) => set('sunset', { enabled: v })}
            title="长期未互动自动停发"
            desc="默认状态的用户已收 3 封以上、近 90 天没点过也没付过款，就不再发（保护发信信誉）"
          />
          <SwitchRow
            checked={form.includeTextBody}
            onChange={(v) => set('includeTextBody', v)}
            title="附带纯文本版"
            desc="多数邮箱更信任同时带纯文本的邮件。如果测试时报 TextBody 相关错误，关掉它再继续"
          />
          <NumField
            label="订单归因天数"
            hint={`1–30，默认 ${defaults.attributionDays}。点击邮件后这么多天内付款算作邮件带来的订单`}
            value={form.attributionDays}
            min={1}
            max={30}
            integer
            onChange={(v) => set('attributionDays', v)}
          />
        </CardContent>
      </Card>

      {/* 保存栏：有改动时贴底 */}
      <div
        className={cn(
          'sticky bottom-0 z-20 -mx-6 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-white/95 px-6 py-3 backdrop-blur transition-opacity',
          dirty || saveErr || savedMsg ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {saveErr && <span className="mr-auto text-sm text-red-600">{saveErr}</span>}
        {!saveErr && savedMsg && !dirty && <span className="mr-auto text-sm text-emerald-700">✓ {savedMsg}</span>}
        {!saveErr && dirty && <span className="mr-auto text-sm text-amber-700">有未保存的修改</span>}
        <Button
          variant="outline"
          disabled={!dirty || saving}
          onClick={() => {
            setForm(data.config)
            setSaveErr('')
          }}
        >
          <Undo2 className="mr-1 h-4 w-4" />
          放弃修改
        </Button>
        <Button onClick={save} loading={saving} disabled={!dirty}>
          <Save className="mr-1 h-4 w-4" />
          保存设置
        </Button>
      </div>
    </div>
  )
}

/* ============================== 状态面板 ============================== */

function ChecklistCard({ data, onRefresh, refreshing }: { data: ConfigResponse; onRefresh: () => void; refreshing: boolean }) {
  const failed = data.checklist.filter((c) => !c.ok).length
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>上线检查</CardTitle>
          <p className="mt-1 text-sm text-gray-500">{failed ? `还有 ${failed} 项没就绪` : '全部就绪'}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={refreshing} title="刷新状态">
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {data.checklist.map((c) => (
            <li key={c.key} className="flex items-start gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
              <span className={c.ok ? 'text-gray-700' : 'text-red-700'}>{c.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-500">
          发信地址：
          {data.sender.address ? <span className="font-mono text-gray-700">{data.sender.address}</span> : <span className="text-red-600">未配置（ALIYUN_DM_MARKETING）</span>}
          {data.sender.dryRun && <span className="ml-2 text-violet-700">演示模式：不会真的发信</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function ageText(iso: string | null | undefined): string {
  if (!iso) return '从未'
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return '—'
  if (ms < 60_000) return '刚刚'
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)} 分钟前`
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)} 小时前`
  return `${Math.floor(ms / 86400_000)} 天前`
}

function AccountCard({ data }: { data: ConfigResponse }) {
  const a = data.account
  const stale = !a || Date.now() - new Date(a.fetchedAt).getTime() > 24 * 3600_000
  return (
    <Card>
      <CardHeader>
        <CardTitle>阿里云账户</CardTitle>
        <p className="mt-1 text-sm text-gray-500">由回执同步每小时拉取一次（DescAccountSummary）</p>
      </CardHeader>
      <CardContent>
        {!a ? (
          <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
            还没同步到账户信息。同步任务每 5 分钟运行、每小时取一次账户；在此之前日额度按 500 封（信誉 1 级）估算。
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <KV k="账户状态" v={a.userStatus === 0 ? <span className="text-emerald-700">正常</span> : <span className="text-red-600">异常（{a.userStatus}）</span>} />
            <KV k="信誉等级" v={a.quotaLevel != null ? `${a.quotaLevel}${a.maxQuotaLevel != null ? ` / 最高 ${a.maxQuotaLevel}` : ''}` : '—'} />
            <KV k="日额度" v={`${fmtInt(a.dailyQuota)} 封`} />
            <KV k="月额度" v={a.monthQuota != null ? `${fmtInt(a.monthQuota)} 封` : '—'} />
            <KV k="免费额度剩余" v={a.remainFreeQuota != null ? `${fmtInt(a.remainFreeQuota)} 封` : '—'} />
            <KV k="IP 通道" v={a.ipChannelType || '—'} />
            <div className="col-span-full text-xs text-gray-400">
              更新于 {fmtTime(a.fetchedAt)}（{ageText(a.fetchedAt)}）
              {stale && <span className="ml-1 text-amber-600">超过 24 小时未更新，额度按 500 封估算</span>}
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}

function TodayCard({ data }: { data: ConfigResponse }) {
  const t = data.today
  const p = t.parts
  const pct = t.limit > 0 ? (t.used / t.limit) * 100 : 0
  const cap = Math.min(p.dailyCap, p.quotaCap, p.warmupCap ?? Infinity)
  const rows: { k: string; v: string; active: boolean; note?: string }[] = [
    { k: '每日上限', v: `${fmtInt(p.dailyCap)} 封`, active: cap === p.dailyCap },
    {
      k: '阿里云额度 × 占比',
      v: `${fmtInt(p.quotaCap)} 封`,
      active: cap === p.quotaCap,
      note: `日额度 ${fmtInt(p.quota)}${p.quotaAssumed ? '（估算）' : ''} × ${Math.round(data.config.maxQuotaShare * 100)}%`,
    },
    {
      k: '预热阶梯',
      v: p.warmupCap == null ? '不限' : `${fmtInt(p.warmupCap)} 封`,
      active: p.warmupCap != null && cap === p.warmupCap,
      note: !data.config.warmup.enabled
        ? '预热已关闭'
        : p.warmupCap == null
          ? `已走完全部 ${data.config.warmup.schedule.length} 级阶梯`
          : `当前第 ${t.warmupLevel + 1} 级（共 ${data.config.warmup.schedule.length} 级；前一个发送日表现达标才升级）`,
    },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>今天（{t.date}）</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          {t.inWindow ? <span className="text-emerald-700">现在在发送时段内</span> : <span className="text-amber-700">现在不在发送时段内（{data.config.sendWindow.start}:00–{data.config.sendWindow.end}:00）</span>}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-gray-600">
              已用 <span className="font-semibold tabular-nums text-gray-900">{fmtInt(t.used)}</span> / 可用 <span className="tabular-nums">{fmtInt(t.limit)}</span>
            </span>
            <span className="text-xs text-gray-400">含今天的测试发送</span>
          </div>
          <ProgressBar percent={pct} tone={pct >= 100 ? 'warn' : 'brand'} />
        </div>
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-b border-gray-50">
                <td className="py-1.5 text-gray-600">
                  {r.k}
                  {r.note && <div className="text-xs text-gray-400">{r.note}</div>}
                </td>
                <td className={cn('py-1.5 text-right tabular-nums', r.active ? 'font-semibold text-primary-700' : 'text-gray-700')}>
                  {r.v}
                  {r.active && <span className="ml-1 text-xs font-normal">← 今天卡在这里</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function SyncCard({ data }: { data: ConfigResponse }) {
  const s = data.sync
  const backoff = Object.entries(s.domainBackoff || {}).filter(([, until]) => new Date(until).getTime() > Date.now())
  const lagging = !s.lastOkAt || Date.now() - new Date(s.lastOkAt).getTime() > 60 * 60_000
  return (
    <Card>
      <CardHeader>
        <CardTitle>回执同步</CardTitle>
        <p className="mt-1 text-sm text-gray-500">每 5 分钟从阿里云拉投递回执、投诉/退订屏蔽名单、无效地址。同步中断超过 1 小时，发送会自动急停。</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <KV k="上次成功" v={<span className={lagging ? 'text-amber-700' : 'text-gray-900'}>{s.lastOkAt ? `${fmtTime(s.lastOkAt)}（${ageText(s.lastOkAt)}）` : '从未'}</span>} />
          <KV k="上次运行" v={s.lastRunAt ? `${fmtTime(s.lastRunAt)}（${ageText(s.lastRunAt)}）` : '从未'} />
        </div>
        {s.lastError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <span className="font-medium">最近一次错误：</span>
            <span className="break-all">{s.lastError}</span>
          </div>
        )}
        {backoff.length > 0 && (
          <div>
            <div className="mb-1 text-xs text-gray-500">这些收件域名被对方限流，暂缓发送：</div>
            <ul className="space-y-0.5 text-xs text-gray-700">
              {backoff.map(([d, until]) => (
                <li key={d}>
                  <span className="font-mono">{d}</span> 到 {fmtTime(until)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{k}</dt>
      <dd className="mt-0.5 truncate font-medium text-gray-900">{v}</dd>
    </div>
  )
}

/* ============================== 表单控件 ============================== */

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {hint && <div className="mt-0.5 text-xs leading-relaxed text-gray-400">{hint}</div>}
    </div>
  )
}

function SwitchRow({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-emerald-500' : 'bg-gray-300')}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">
          {title}
          <span className={cn('ml-2 text-xs font-normal', checked ? 'text-emerald-600' : 'text-gray-400')}>{checked ? '已开启' : '已关闭'}</span>
        </div>
        {desc && <div className="mt-0.5 text-xs leading-relaxed text-gray-500">{desc}</div>}
      </div>
    </div>
  )
}

function TextField({
  label,
  hint,
  value,
  onChange,
  maxLength,
  placeholder,
  invalid,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  maxLength?: number
  placeholder?: string
  invalid?: boolean
}) {
  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn('w-full rounded-lg border px-3 py-2 text-sm', invalid ? 'border-red-400 bg-red-50/40' : 'border-gray-300')}
      />
    </div>
  )
}

/**
 * 数字输入：本地保留原始文字，合法才上报数字，否则上报 NaN（保存时 zod 会拦住并指出是哪一项）。
 * 直接绑数字会让清空重打的中间态被夹回去。
 */
function NumField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  integer,
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  integer?: boolean
}) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : '')
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current && !(Number.isNaN(value) && Number.isNaN(last.current))) {
      last.current = value
      setText(Number.isFinite(value) ? String(value) : '')
    }
  }, [value])
  const n = Number(text)
  const invalid = text.trim() === '' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))
  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <input
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step ?? (integer ? 1 : 'any')}
        onChange={(e) => {
          const t = e.target.value
          setText(t)
          const v = Number(t)
          const ok = t.trim() !== '' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isInteger(v))
          const out = ok ? v : NaN
          last.current = out
          onChange(out)
        }}
        className={cn('w-full rounded-lg border px-3 py-2 text-sm tabular-nums', invalid ? 'border-red-400 bg-red-50/40' : 'border-gray-300')}
      />
      {invalid && <p className="mt-1 text-xs text-red-600">请输入 {min}–{max} 之间的{integer ? '整数' : '数字'}</p>}
    </div>
  )
}

function ScheduleField({ value, onChange, disabled, defaults }: { value: number[]; onChange: (v: number[]) => void; disabled?: boolean; defaults: number[] }) {
  const [text, setText] = useState(value.join(', '))
  const last = useRef(value.join(','))
  useEffect(() => {
    const k = value.join(',')
    if (k !== last.current) {
      last.current = k
      setText(value.join(', '))
    }
  }, [value])
  const parts = text.split(/[,，\s]+/).filter(Boolean)
  const nums = parts.map(Number)
  const invalid = parts.length === 0 || parts.length > 10 || nums.some((n) => !Number.isInteger(n) || n < 10 || n > 100000)
  return (
    <div>
      <FieldLabel label="预热阶梯（每级每天最多封数）" hint={`逗号分隔，1–10 级，每级 10–100000。默认 ${defaults.join(', ')}；走完最后一级后不再受预热限制`} />
      <input
        value={text}
        disabled={disabled}
        onChange={(e) => {
          const t = e.target.value
          setText(t)
          const ps = t.split(/[,，\s]+/).filter(Boolean)
          const ns = ps.map(Number)
          const ok = ps.length >= 1 && ps.length <= 10 && ns.every((n) => Number.isInteger(n) && n >= 10 && n <= 100000)
          // 不合法时上报一个 zod 必然拒绝的值（空数组），保存时会指出「预热阶梯」有问题
          const out = ok ? ns : []
          last.current = out.join(',')
          onChange(out)
        }}
        className={cn('w-full rounded-lg border px-3 py-2 font-mono text-sm disabled:bg-gray-50 disabled:text-gray-400', invalid ? 'border-red-400 bg-red-50/40' : 'border-gray-300')}
      />
      {invalid && <p className="mt-1 text-xs text-red-600">格式不对：用逗号分隔 1–10 个整数，每个 10–100000</p>}
      {!invalid && nums.some((n, i) => i > 0 && n < nums[i - 1]) && <p className="mt-1 text-xs text-amber-600">阶梯一般应逐级递增</p>}
    </div>
  )
}

function TestRecipientsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  const add = () => {
    const email = input.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) return setErr('邮箱格式不正确')
    if (value.includes(email)) return setErr('已经在名单里了')
    if (value.length >= 10) return setErr('最多 10 个')
    onChange([...value, email])
    setInput('')
    setErr('')
  }
  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-gray-400">还没有测试收件人（管理员账号的邮箱始终可以收测试邮件）。</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map((e) => (
            <span key={e} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-sm text-gray-800">
              {e}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== e))} className="text-gray-400 hover:text-red-600" aria-label="移除">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex max-w-md items-center gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setErr('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="输入邮箱后回车"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={value.length >= 10}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          添加
        </Button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <p className="text-xs text-gray-400">改完记得点页面底部「保存设置」。</p>
    </div>
  )
}
