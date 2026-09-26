'use client'

/**
 * /admin/tenants/[id]：渠道详情（设计 12.2）。状态机、payoutHold、结算参数、风控上限、主体与收款信息、域名、成员与邀请、预览账号。
 * 所有写操作都在服务端校验与审计（admin-tenants.ts）；这里只做输入与提示。
 * 二期（docs/多渠道分销-二期改动.md 3.2、4.3）：推送方式只读（企业微信已配置 / 已开、邮箱已开 + 掩码地址）；
 * 客服信息可改（与渠道设置中心同一组字段；二维码先经 /api/upload scope=contact 上传拿到地址，再 PATCH supportQrUrl）。
 */
import { useEffect, useRef, useState } from 'react'
import { isValidContactQrUrl } from '@/lib/contact-base'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Badge,
  Field,
  Modal,
  Notice,
  STATUS_LABEL,
  StatusBadge,
  SubmitRow,
  TenantTabs,
  Triple,
  api,
  centsToInput,
  fmtTime,
  inputCls,
  parseYuan,
  pct,
  useApi,
  yuan,
} from './common'

interface Detail {
  tenant: {
    id: number
    code: string
    name: string
    status: string
    origin: string
    feeRateBp: number
    invoiceShareRateBp: number
    holdDays: number
    minPayoutCents: number
    requestIntervalDays: number
    payoutHold: boolean
    payoutHoldReason: string | null
    pendingOrderCap: number
    maxOrderQty: number
    partyType: string | null
    legalName: string | null
    requirePartnerInvoice: boolean
    payeeName: string | null
    payeeMethod: string | null
    payeeAccountMasked: string | null
    hasPayeeAccount: boolean
    payeeChangedAt: string | null
    payeeCooldownUntil: string | null
    hasWebhook: boolean
    /** 二期：推送方式（只读） */
    noticeWecomOn: boolean
    noticeEmailOn: boolean
    noticeEmailMasked: string | null
    /** 二期：客服信息（渠道原值，不回退；未设 = null） */
    supportWechat: string | null
    supportQrUrl: string | null
    supportEmail: string | null
    supportHours: string | null
    previewUserIds: number[]
    createdAt: string
  }
  transitions: string[]
  domains: { host: string; isPrimary: boolean; status: number; createdAt: string }[]
  members: { userId: number; email: string | null; nickname: string | null; role: string; status: number; createdAt: string }[]
  invites: { id: number; email: string | null; role: string; createdAt: string; expiresAt: string; state: string }[]
  balances: {
    available: { balanceCents: number; feeCents: number; payoutCents: number }
    pending: { balanceCents: number; feeCents: number; payoutCents: number }
    inPayoutCents: number
    depositCents: number
    paidTotalCents: number
    withheldTotalCents: number
    negative: boolean
  }
  previewUsers: { id: number; email: string | null; nickname: string | null }[]
}

const METHOD_LABEL: Record<string, string> = { ALIPAY: '支付宝', BANK: '银行卡', WECHAT: '微信' }
const PARTY_LABEL: Record<string, string> = { COMPANY: '公司', INDIVIDUAL_BIZ: '个体户', PERSON: '个人' }
const INVITE_STATE: Record<string, string> = { PENDING: '待接受', USED: '已接受', REVOKED: '已作废', EXPIRED: '已过期' }

export default function TenantDetail({ id }: { id: string }) {
  const { data, error, reload } = useApi<Detail>(`/api/admin/tenants/${id}`)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const done = (r: { success: boolean; message?: string; error?: string }) => {
    setMsg(r.success ? { kind: 'ok', text: r.message || '已保存' } : { kind: 'error', text: r.error || '操作失败' })
    reload()
  }
  if (error && !data) return <Notice kind="error">{error}</Notice>
  if (!data) return <div className="py-12 text-center text-gray-400">加载中...</div>
  const t = data.tenant
  return (
    <div className="space-y-6">
      <TenantTabs id={id} active="detail" title={`${t.name}（${t.code}）`} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusCard d={data} onDone={done} />
        <BalanceCard d={data} />
      </div>
      <ConfigCard d={data} onDone={done} />
      <div className="grid gap-6 lg:grid-cols-2">
        <DomainCard d={data} onDone={done} id={id} />
        <PayeeCard d={data} onDone={done} id={id} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ContactCard d={data} onDone={done} id={id} />
        <NoticeTransportCard d={data} />
      </div>
      <MemberCard d={data} onDone={done} id={id} />
    </div>
  )
}

/**
 * 客服信息（二期改动 4.3）：与渠道设置中心同一组字段，超管可代改。前台回退规则：微信号与二维码作为一组——两项都没设才显示主站客服；
 * 邮箱、服务时间各自回退。客服邮箱会进渠道交易邮件页脚（服务端拦阿里云禁发词），微信号 / 二维码永远不进邮件。
 */
function ContactCard({ d, onDone, id }: { d: Detail; onDone: Done; id: string }) {
  const t = d.tenant
  const init = () => ({ wechat: t.supportWechat ?? '', email: t.supportEmail ?? '', hours: t.supportHours ?? '' })
  const [f, setF] = useState(init)
  const [busy, setBusy] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => setF(init()), [t.supportWechat, t.supportEmail, t.supportHours]) // eslint-disable-line react-hooks/exhaustive-deps
  const qr = isValidContactQrUrl(t.supportQrUrl) ? t.supportQrUrl : null
  const patch = async (body: Record<string, string | null>) => onDone(await api(`/api/admin/tenants/${id}`, { method: 'PATCH', body }))
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('save')
    // 空串 = 清空（服务端 zod 归一为 null）
    await patch({ supportWechat: f.wechat.trim(), supportEmail: f.email.trim(), supportHours: f.hours.trim() })
    setBusy('')
  }
  const upload = async (file: File) => {
    setBusy('qr')
    const form = new FormData()
    form.append('scope', 'contact')
    form.append('file', file)
    const r = await api<{ url: string }>('/api/upload', { form })
    if (fileRef.current) fileRef.current.value = ''
    if (!r.success) {
      setBusy('')
      return onDone(r)
    }
    await patch({ supportQrUrl: r.data.url })
    setBusy('')
  }
  const clearQr = async () => {
    if (!confirm('清除该渠道的客服二维码？（微信号也没设时，前台回退显示主站客服）')) return
    setBusy('clear')
    await patch({ supportQrUrl: null })
    setBusy('')
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>客服信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-gray-500">
          渠道自己在设置中心填写，这里可代改。没填的项前台回退主站：微信号与二维码作为一组（两项都没设才显示主站的），邮箱、服务时间各自回退。
          {!t.supportWechat && !qr ? ' 当前前台显示的是主站客服微信与二维码。' : ''}
        </p>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
          <Field label="微信号或昵称" hint="≤30 字，字母数字下划线横线或汉字">
            <input className={inputCls} value={f.wechat} maxLength={30} onChange={(e) => setF({ ...f, wechat: e.target.value })} placeholder="未设置" />
          </Field>
          <Field label="客服邮箱" hint="会进该渠道交易邮件页脚">
            <input className={inputCls} value={f.email} maxLength={120} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="未设置" />
          </Field>
          <Field label="服务时间" hint="如 9:00-22:00">
            <input className={inputCls} value={f.hours} maxLength={40} onChange={(e) => setF({ ...f, hours: e.target.value })} placeholder="未设置" />
          </Field>
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" size="sm" loading={busy === 'save'}>
              保存文字信息
            </Button>
          </div>
        </form>
        <div className="flex items-start gap-4 border-t border-gray-100 pt-3">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
            {qr ? <img src={qr} alt="客服二维码" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-400">未上传</span>}
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">客服二维码：PNG / JPG / WebP，≤2MB。换图或清除后旧文件会删除（仍被其他渠道引用时保留）。</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) upload(file)
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" loading={busy === 'qr'} onClick={() => fileRef.current?.click()}>
                {qr ? '更换二维码' : '上传二维码'}
              </Button>
              {qr && (
                <Button size="sm" variant="outline" loading={busy === 'clear'} onClick={clearQr}>
                  清除
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** 推送方式（二期改动 3.2）：渠道在自己的设置中心选，超管只读。企业微信地址是凭据不回显，通知邮箱只给掩码 */
function NoticeTransportCard({ d }: { d: Detail }) {
  const t = d.tenant
  const on = (v: boolean) => (v ? <Badge tone="bg-green-100 text-green-700">已开</Badge> : <Badge tone="bg-gray-200 text-gray-600">已关</Badge>)
  return (
    <Card>
      <CardHeader>
        <CardTitle>推送方式（只读）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-gray-500">渠道的订单、留言、注册等纯通知只推给渠道站长（不再推站长群）；需要站长处理的事项照推站长。推送方式由渠道在设置中心自选。</p>
        <div className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
          <span>企业微信机器人</span>
          <span className="flex items-center gap-2">
            {t.hasWebhook ? <Badge tone="bg-blue-100 text-blue-700">已配置</Badge> : <Badge tone="bg-gray-200 text-gray-600">未配置</Badge>}
            {on(t.noticeWecomOn)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
          <span>邮箱{t.noticeEmailMasked ? `（${t.noticeEmailMasked}）` : '（未设置地址）'}</span>
          {on(t.noticeEmailOn)}
        </div>
      </CardContent>
    </Card>
  )
}

type Done = (r: { success: boolean; message?: string; error?: string }) => void

function StatusCard({ d, onDone }: { d: Detail; onDone: Done }) {
  const t = d.tenant
  const [holdReason, setHoldReason] = useState(t.payoutHoldReason ?? '')
  useEffect(() => setHoldReason(t.payoutHoldReason ?? ''), [t.payoutHoldReason])
  const move = async (to: string) => {
    const tip: Record<string, string> = {
      ACTIVE: '开业后买家即可下单。确认已授权商品、渠道主已接受邀请、预览账号已走通一单？',
      SUSPENDED: '暂停后前台拒绝新订单、渠道后台只读；已付订单的售后与结算照常。确认暂停？',
      TERMINATED:
        '停业是终态，不能恢复，渠道此后登录不了渠道后台、看不到对账。要求：无未付款订单、无待处理售后申请、没有未完结的结算单；' +
        '可结算 / 冻结中 / 结算中余额与保证金都应已结清（先出最后一期手动结算单并打款，负余额回款或用保证金抵扣）。确认停业？',
    }
    if (!confirm(tip[to] ?? `确认改为「${STATUS_LABEL[to] ?? to}」？`)) return
    const r = await api(`/api/admin/tenants/${t.id}`, { method: 'PATCH', body: { status: to } })
    // 终止前的结清由状态机把关（D7）：余额未结清时服务端返回 UNSETTLED，站长看过明细仍要终止 → 显式 forceUnsettled（写进审计）
    if (!r.success && r.reason === 'UNSETTLED' && to === 'TERMINATED') {
      if (!confirm(`${r.error}\n\n仍要强制停业？（会记入审计；剩余款项需线下另行结清）`)) return onDone(r)
      return onDone(await api(`/api/admin/tenants/${t.id}`, { method: 'PATCH', body: { status: to, forceUnsettled: true } }))
    }
    onDone(r)
  }
  const hold = async (on: boolean) => {
    if (on && !holdReason.trim()) return alert('请填写暂停打款的原因（只有超管可见）')
    onDone(await api(`/api/admin/tenants/${t.id}`, { method: 'PATCH', body: { payoutHold: on, payoutHoldReason: holdReason.trim() || null } }))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <StatusBadge status={t.status} />
          <span className="text-gray-500">站点 {t.origin}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.transitions.length === 0 && <span className="text-gray-400">已停业（终态）：订单、账本、审计永久保留，买家订单入口照常</span>}
          {d.transitions.map((to) => (
            <Button key={to} size="sm" variant={to === 'TERMINATED' ? 'danger' : 'outline'} onClick={() => move(to)}>
              改为「{STATUS_LABEL[to] ?? to}」
            </Button>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-medium">暂停打款</span>
            {t.payoutHold ? <Badge tone="bg-red-100 text-red-700">已暂停</Badge> : <Badge tone="bg-green-100 text-green-700">正常</Badge>}
          </div>
          <p className="mb-2 text-xs text-gray-500">只停出结算单与认领打款，不影响买家下单。原因只有超管可见，渠道只看到「已暂停」。每日对账钱类失败会自动置上。</p>
          <input className={inputCls} value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="原因（仅超管可见）" maxLength={200} />
          <div className="mt-2 flex gap-2">
            {t.payoutHold ? (
              <Button size="sm" variant="outline" onClick={() => hold(false)}>
                解除暂停
              </Button>
            ) : (
              <Button size="sm" variant="danger" onClick={() => hold(true)}>
                暂停打款
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BalanceCard({ d }: { d: Detail }) {
  const b = d.balances
  return (
    <Card>
      <CardHeader>
        <CardTitle>余额</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Triple label="可结算" t={b.available} />
        <Triple label="冻结中" t={b.pending} />
        <div className="grid grid-cols-2 gap-2 text-gray-600">
          <div>结算中：{yuan(b.inPayoutCents)}</div>
          <div>保证金：{yuan(b.depositCents)}</div>
          <div>累计已打款：{yuan(b.paidTotalCents)}</div>
          <div>累计代扣：{yuan(b.withheldTotalCents)}</div>
        </div>
        <p className="text-xs text-gray-400">余额 = 货款 + 发票分成 − 进货款 ± 售后与调整；预计打款 = 余额 − 手续费；手续费 = （货款 + 发票分成）× {pct(d.tenant.feeRateBp)}，逐单四舍五入</p>
      </CardContent>
    </Card>
  )
}

function ConfigCard({ d, onDone }: { d: Detail; onDone: Done }) {
  const t = d.tenant
  const init = () => ({
    name: t.name,
    feeRate: (t.feeRateBp / 100).toString(),
    shareRate: (t.invoiceShareRateBp / 100).toString(),
    holdDays: String(t.holdDays),
    minPayout: centsToInput(t.minPayoutCents),
    requestIntervalDays: String(t.requestIntervalDays),
    pendingOrderCap: String(t.pendingOrderCap),
    maxOrderQty: String(t.maxOrderQty),
    partyType: t.partyType ?? '',
    legalName: t.legalName ?? '',
    requirePartnerInvoice: t.requirePartnerInvoice,
    preview: t.previewUserIds.join(', '),
  })
  const [f, setF] = useState(init)
  useEffect(() => setF(init()), [d]) // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false)
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const patch: Record<string, unknown> = {}
    const num = (s: string) => Number(s.trim())
    const bp = (s: string) => Math.round(Number(s.trim()) * 100)
    if (f.name.trim() !== t.name) patch.name = f.name.trim()
    if (bp(f.feeRate) !== t.feeRateBp) patch.feeRateBp = bp(f.feeRate)
    if (bp(f.shareRate) !== t.invoiceShareRateBp) patch.invoiceShareRateBp = bp(f.shareRate)
    if (num(f.holdDays) !== t.holdDays) patch.holdDays = num(f.holdDays)
    const mp = parseYuan(f.minPayout)
    if (mp == null || Number.isNaN(mp) || mp < 0) return alert('最低结算额格式不对')
    if (mp !== t.minPayoutCents) patch.minPayoutCents = mp
    if (num(f.requestIntervalDays) !== t.requestIntervalDays) patch.requestIntervalDays = num(f.requestIntervalDays)
    if (num(f.pendingOrderCap) !== t.pendingOrderCap) patch.pendingOrderCap = num(f.pendingOrderCap)
    if (num(f.maxOrderQty) !== t.maxOrderQty) patch.maxOrderQty = num(f.maxOrderQty)
    if (f.partyType && f.partyType !== t.partyType) patch.partyType = f.partyType
    if (f.legalName.trim() !== (t.legalName ?? '')) patch.legalName = f.legalName.trim()
    if (f.requirePartnerInvoice !== t.requirePartnerInvoice) patch.requirePartnerInvoice = f.requirePartnerInvoice
    const ids = f.preview
      .split(/[,\s，]+/)
      .filter(Boolean)
      .map(Number)
    if (ids.some((n) => !Number.isInteger(n) || n <= 0)) return alert('预览账号请填用户 id，逗号分隔')
    if (ids.join(',') !== t.previewUserIds.join(',')) patch.previewUserIds = ids
    if (!Object.keys(patch).length) return alert('没有改动')
    if (('feeRateBp' in patch || 'invoiceShareRateBp' in patch || 'holdDays' in patch) && !confirm('费率与冻结期只影响之后的新订单（下单时快照），已有订单不变。确认保存？')) return
    setBusy(true)
    onDone(await api(`/api/admin/tenants/${t.id}`, { method: 'PATCH', body: patch }))
    setBusy(false)
  }
  const set = (k: keyof ReturnType<typeof init>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <Card>
      <CardHeader>
        <CardTitle>结算参数与风控</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-4">
          <Field label="内部名称">
            <input className={inputCls} value={f.name} onChange={set('name')} />
          </Field>
          <Field label="手续费率 %" hint="0–20；只影响新订单">
            <input className={inputCls} value={f.feeRate} onChange={set('feeRate')} />
          </Field>
          <Field label="发票分成率 %" hint="0–6">
            <input className={inputCls} value={f.shareRate} onChange={set('shareRate')} />
          </Field>
          <Field label="冻结期（天）">
            <input className={inputCls} value={f.holdDays} onChange={set('holdDays')} />
          </Field>
          <Field label="最低结算额（元）" hint="周期出单与渠道申请受限；手动出单不受限">
            <input className={inputCls} value={f.minPayout} onChange={set('minPayout')} />
          </Field>
          <Field label="申请结算间隔（天）">
            <input className={inputCls} value={f.requestIntervalDays} onChange={set('requestIntervalDays')} />
          </Field>
          <Field label="未付订单上限" hint="本店 20 分钟内未付单并发">
            <input className={inputCls} value={f.pendingOrderCap} onChange={set('pendingOrderCap')} />
          </Field>
          <Field label="单笔数量上限">
            <input className={inputCls} value={f.maxOrderQty} onChange={set('maxOrderQty')} />
          </Field>
          <Field label="主体类型">
            <select className={inputCls} value={f.partyType} onChange={set('partyType')}>
              <option value="">未设置</option>
              {Object.entries(PARTY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="主体名称">
            <input className={inputCls} value={f.legalName} onChange={set('legalName')} />
          </Field>
          <Field label="打款要求渠道开票" hint="公司 / 个体户：登记打款前必须填渠道开给我们的发票号">
            <select className={inputCls} value={f.requirePartnerInvoice ? '1' : '0'} onChange={(e) => setF({ ...f, requirePartnerInvoice: e.target.value === '1' })}>
              <option value="1">要求</option>
              <option value="0">不要求</option>
            </select>
          </Field>
          <Field label="预览账号（用户 id）" hint="筹备期可在前台浏览下单的测试买家，逗号分隔">
            <input className={inputCls} value={f.preview} onChange={set('preview')} />
          </Field>
          <div className="md:col-span-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              预览账号：{d.previewUsers.length ? d.previewUsers.map((u) => `${u.id} ${u.email ?? ''}`).join('；') : '无'}
            </div>
            <Button type="submit" loading={busy}>
              保存
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function DomainCard({ d, onDone, id }: { d: Detail; onDone: Done; id: string }) {
  const [host, setHost] = useState('')
  const put = async (h: string, status: 0 | 1) => onDone(await api(`/api/admin/tenants/${id}/domains`, { body: { host: h, status } }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>域名</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-gray-500">只接受 *.bigolab.com 的一级子域。停用后该域名返回 404，绝不回落主站。Cloudflare 与 nginx 的配置另行处理（部署说明）。</p>
        {d.domains.map((x) => (
          <div key={x.host} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
            <span>
              {x.host} {x.isPrimary && <Badge>主域名</Badge>} {x.status === 1 ? <Badge tone="bg-green-100 text-green-700">启用</Badge> : <Badge tone="bg-gray-200 text-gray-600">停用</Badge>}
            </span>
            <Button size="sm" variant="outline" onClick={() => (x.status === 1 ? confirm(`停用 ${x.host}？停用后该站立即 404`) && put(x.host, 0) : put(x.host, 1))}>
              {x.status === 1 ? '停用' : '启用'}
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className={inputCls} value={host} onChange={(e) => setHost(e.target.value)} placeholder="lulu2.bigolab.com" />
          <Button onClick={() => host.trim() && put(host.trim(), 1)}>添加</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PayeeCard({ d, onDone, id }: { d: Detail; onDone: Done; id: string }) {
  const t = d.tenant
  const [open, setOpen] = useState(false)
  const [plain, setPlain] = useState<string | null>(null)
  const reveal = async () => {
    const r = await api<{ account: string }>(`/api/admin/tenants/${id}/payee`, { body: { action: 'reveal' } })
    if (r.success) setPlain(r.data.account)
    else alert(r.error)
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>收款信息</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t.hasPayeeAccount ? '变更' : '录入'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {t.payeeName ? (
          <>
            <div>
              {t.payeeName} · {METHOD_LABEL[t.payeeMethod ?? ''] ?? t.payeeMethod} · {plain ?? t.payeeAccountMasked}
              {!plain && t.hasPayeeAccount && (
                <button className="ml-2 text-xs text-primary-600 hover:underline" onClick={reveal}>
                  查看明文（记审计）
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">最近变更：{fmtTime(t.payeeChangedAt)}</div>
            {t.payeeCooldownUntil && <Notice kind="warn">冷静期至 {fmtTime(t.payeeCooldownUntil)}，期间不能出结算单</Notice>}
          </>
        ) : (
          <div className="text-gray-400">未录入（出结算单前必须录入）</div>
        )}
        <div className="text-xs text-gray-500">企业微信 webhook：{t.hasWebhook ? '渠道已设置' : '未设置'}（渠道在自己后台设置，只写不读回）</div>
      </CardContent>
      {open && (
        <PayeeDialog
          id={id}
          onClose={() => setOpen(false)}
          onDone={(r) => {
            setOpen(false)
            setPlain(null)
            onDone(r)
          }}
        />
      )}
    </Card>
  )
}

function PayeeDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: Done }) {
  const [f, setF] = useState({ name: '', method: 'ALIPAY', account: '' })
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const r = await api(`/api/admin/tenants/${id}/payee`, { method: 'PUT', body: f })
    setBusy(false)
    onDone(r)
  }
  return (
    <Modal title="录入 / 变更收款信息" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Notice kind="warn">变更后 72 小时内不能出结算单（冷静期），平台群会收到一条提醒。已生成的结算单按出单时的收款人快照打款。</Notice>
        <Field label="收款人（户名）">
          <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </Field>
        <Field label="收款方式">
          <select className={inputCls} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {Object.entries(METHOD_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="账号" hint="加密存储；渠道只看到掩码">
          <input className={inputCls} value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} required />
        </Field>
        <SubmitRow onCancel={onClose} loading={busy} />
      </form>
    </Modal>
  )
}

function MemberCard({ d, onDone, id }: { d: Detail; onDone: Done; id: string }) {
  const [email, setEmail] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const invite = async () => {
    if (!email.trim()) return
    setBusy(true)
    const r = await api<{ link: string; mailed: boolean; mailError?: string }>(`/api/admin/tenants/${id}/invites`, { body: { email: email.trim() } })
    setBusy(false)
    if (r.success) {
      setEmail('')
      setLink(r.data.mailed ? null : r.data.link)
    }
    onDone(r)
  }
  const setStatus = async (userId: number, status: 0 | 1) => {
    if (status === 0 && !confirm('停用后该成员立即被强制下线（主站会话也会失效，重新登录即可），发给他的未用邀请一并作废。确认？')) return
    onDone(await api(`/api/admin/tenants/${id}/members`, { method: 'PATCH', body: { userId, status } }))
  }
  const revoke = async (inviteId: number) => {
    if (!confirm('作废这张邀请？')) return
    onDone(await api(`/api/admin/tenants/${id}/invites`, { method: 'PATCH', body: { inviteId, action: 'revoke' } }))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>成员与邀请</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm lg:grid-cols-2">
        <div>
          <div className="mb-2 font-medium">成员</div>
          {d.members.length === 0 && <div className="text-gray-400">还没有成员。开业前至少要有一位渠道主（OWNER）接受邀请。</div>}
          {d.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between border-b border-gray-50 py-2">
              <span>
                {m.email ?? `#${m.userId}`} <Badge>{m.role}</Badge> {m.status === 1 ? <Badge tone="bg-green-100 text-green-700">正常</Badge> : <Badge tone="bg-gray-200 text-gray-600">已停用</Badge>}
              </span>
              <Button size="sm" variant="outline" onClick={() => setStatus(m.userId, m.status === 1 ? 0 : 1)}>
                {m.status === 1 ? '停用' : '启用'}
              </Button>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 font-medium">邀请渠道主（24 小时有效）</div>
          <div className="flex gap-2">
            <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="对方的登录邮箱" />
            <Button onClick={invite} loading={busy}>
              发邀请
            </Button>
          </div>
          {link && (
            <Notice kind="warn">
              邮件没有发出去，请把下面的链接手动发给对方（对方需要在渠道站用这个邮箱登录后打开）：
              <div className="mt-1 break-all font-mono text-xs">{link}</div>
            </Notice>
          )}
          <div className="mt-3 space-y-1">
            {d.invites.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {iv.email ?? '（邮箱未知）'} · {INVITE_STATE[iv.state] ?? iv.state} · 发于 {fmtTime(iv.createdAt)}
                </span>
                {iv.state === 'PENDING' && (
                  <button className="text-red-600 hover:underline" onClick={() => revoke(iv.id)}>
                    作废
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
