'use client'

/**
 * 设置（设计 12.1）：只读的结算配置与收款信息（账号掩码）；可改通知偏好与推送方式。
 * webhook 只写不读回：保存后页面只显示「已配置」，不会再显示地址（地址本身就是凭据）。
 * 收款信息、费率、冻结期如需调整请联系站长（收款信息变更有 72 小时冷静期）。
 *
 * 二期（docs/多渠道分销-二期改动.md 3.2）：「推送方式」卡片——企业微信群机器人与邮箱两种，可同时开，各自有开关与「发送测试」；
 * 通知偏好对两种方式都生效。通知邮箱要验证归属：等于登录邮箱直接保存，否则先收验证码。
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { PartnerNoticeTransportDTO, TenantNoticeKind } from '@/lib/tenant/types'
import { gotoLogin, partnerApi } from '../common/api'
import { bpText, yuan } from '../common/format'
import { Badge, Button, Card, ErrorBox, Field, inputCls, Loading, Notice, PageTitle } from '../common/ui'
import { NOTICE_KIND_TEXT } from '../notices/notices-view'

type Prefs = Record<TenantNoticeKind, boolean>
interface Settings {
  tenant: {
    code: string
    status: string
    feeRateBp: number
    invoiceShareRateBp: number
    holdDays: number
    minPayoutCents: number
    requestIntervalDays: number
    payoutHold: boolean
    partyType: string | null
    payeeName: string | null
    payeeMethod: string | null
    payeeAccountMasked: string | null
    noticePrefs: Prefs
  }
  webhookConfigured: boolean
  noticePrefs: Prefs
  transport: PartnerNoticeTransportDTO
}

const STATUS_TEXT: Record<string, string> = { DRAFT: '筹备中', ACTIVE: '营业中', SUSPENDED: '暂停营业', TERMINATED: '已停业' }
const PARTY_TEXT: Record<string, string> = { COMPANY: '公司', INDIVIDUAL_BIZ: '个体工商户', PERSON: '个人' }
const METHOD_TEXT: Record<string, string> = { ALIPAY: '支付宝', BANK: '银行卡', WECHAT: '微信' }
const PREFIX = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key='
/** 与服务端 tenant/notice.ts 的 TENANT_NOTICE_MAIL_LIMITS 同值（那边改了这里同步） */
const MAIL_LIMIT_TEXT = '每小时最多 20 封、每天最多 100 封'

export function SettingsView({ readOnly }: { readOnly?: boolean }) {
  const [s, setS] = useState<Settings | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState('')
  // 通知邮箱编辑：输入框、验证码（needCode 后才显示）
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeFor, setCodeFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<Settings>('/api/partner/settings')
    if (r.ok) {
      setS(r.data)
      setPrefs(r.data.noticePrefs)
    } else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const result = (r: { ok: boolean; needLogin?: boolean; error?: string }, okText: string) => {
    if (r.ok) setMsg({ tone: 'green', text: okText })
    else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error || '操作失败' })
    return r.ok
  }

  const savePrefs = async () => {
    if (!prefs) return
    setBusy('prefs')
    const r = await partnerApi('/api/partner/settings/notice', { method: 'PUT', body: { prefs } })
    setBusy('')
    if (result(r, '通知偏好已保存')) load()
  }
  const saveWebhook = async (value: string | null) => {
    setBusy('webhook')
    const r = await partnerApi('/api/partner/settings/webhook', { method: 'PUT', body: { url: value } })
    setBusy('')
    if (result(r, value ? 'webhook 已保存（出于安全考虑，保存后不再显示地址）' : 'webhook 已清除')) {
      setUrl('')
      load()
    }
  }
  const test = async () => {
    setBusy('test')
    const r = await partnerApi('/api/partner/settings/webhook/test', { method: 'POST' })
    setBusy('')
    result(r, '测试消息已发出，请到群里查看（1 分钟内未收到请检查地址是否正确）')
  }

  // ---------------- 二期：推送方式 ----------------
  const setTransport = async (patch: { wecomOn?: boolean; emailOn?: boolean }) => {
    setBusy('transport')
    const r = await partnerApi('/api/partner/settings/transport', { method: 'PUT', body: patch })
    setBusy('')
    const text =
      patch.wecomOn !== undefined ? (patch.wecomOn ? '已打开企业微信推送' : '已关闭企业微信推送') : patch.emailOn ? '已打开邮箱推送' : '已关闭邮箱推送'
    if (result(r, text)) load()
  }
  const saveNoticeEmail = async (value: string | null, withCode?: string) => {
    setBusy('email')
    const r = await partnerApi('/api/partner/settings/notice-email', { method: 'PUT', body: { email: value, code: withCode || null } })
    setBusy('')
    if (result(r, value ? '通知邮箱已保存' : '通知邮箱已清除，邮箱推送已关闭')) {
      setEmail('')
      setCode('')
      setCodeFor(null)
      load()
    }
  }
  /** 第一步：登录邮箱直接保存；其他邮箱发验证码、显示验证码输入框 */
  const startNoticeEmail = async () => {
    const e = email.trim()
    if (!e) return
    setBusy('code')
    const r = await partnerApi<{ needCode: boolean; sent: boolean }>('/api/partner/settings/notice-email/code', { method: 'POST', body: { email: e } })
    setBusy('')
    if (!r.ok) {
      result(r, '')
      return
    }
    if (!r.data.needCode) {
      await saveNoticeEmail(e)
      return
    }
    setCodeFor(e)
    setCode('')
    setMsg({ tone: 'green', text: `验证码已发送到 ${e}，10 分钟内有效` })
  }
  const testEmail = async () => {
    setBusy('etest')
    const r = await partnerApi('/api/partner/settings/notice-email/test', { method: 'POST' })
    setBusy('')
    result(r, '测试邮件已发出，请到邮箱查看（几分钟内未收到请检查垃圾邮件箱）')
  }

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!s || !prefs) return <Loading />
  const t = s.tenant
  const tr = s.transport
  const writable = !readOnly

  return (
    <div className="space-y-4">
      <PageTitle title="设置" desc="结算配置与收款信息由站长设置；如需调整请联系站长。" />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Card title="店铺与结算配置（只读）">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Item label="店铺状态" value={STATUS_TEXT[t.status] ?? t.status} />
          <Item label="手续费率" value={bpText(t.feeRateBp)} />
          <Item label="发票分成率" value={bpText(t.invoiceShareRateBp)} />
          <Item label="冻结期" value={`${t.holdDays} 天`} />
          <Item label="最低结算额" value={yuan(t.minPayoutCents)} />
          <Item label="申请结算间隔" value={`${t.requestIntervalDays} 天`} />
          <Item label="结算状态" value={t.payoutHold ? <Badge tone="red">已暂停（请联系站长）</Badge> : <Badge tone="green">正常</Badge>} />
          <Item label="主体类型" value={t.partyType ? PARTY_TEXT[t.partyType] ?? t.partyType : '—'} />
          <Item
            label="收款信息"
            value={t.payeeName ? `${t.payeeName} · ${t.payeeMethod ? METHOD_TEXT[t.payeeMethod] ?? t.payeeMethod : ''} · ${t.payeeAccountMasked ?? ''}` : '未设置（请联系站长）'}
          />
        </dl>
      </Card>

      <Card
        title="通知偏好"
        extra={
          writable ? (
            <Button size="sm" variant="primary" onClick={savePrefs} loading={busy === 'prefs'}>
              保存
            </Button>
          ) : null
        }
      >
        <p className="mb-3 text-sm text-gray-500">勾选的类型会按下方「推送方式」推送（企业微信与邮箱都按这里的设置）；关掉的类型不推送，站内通知照常记录。</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(prefs) as TenantNoticeKind[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={prefs[k]} disabled={!writable} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
              {NOTICE_KIND_TEXT[k] ?? k}
            </label>
          ))}
        </div>
      </Card>

      <Card title="推送方式">
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            两种方式可以同时打开。推送内容只有标题、订单号 / 结算单号、摘要与后台链接，不含买家邮箱、卡密与留言正文。
          </p>

          {/* 企业微信群机器人 */}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                企业微信群机器人
                <span className="ml-2">{s.webhookConfigured ? <Badge tone="green">已配置</Badge> : <Badge>未配置</Badge>}</span>
                <span className="ml-1">{tr.noticeWecomOn ? <Badge tone="green">推送已开</Badge> : <Badge>推送已关</Badge>}</span>
              </h3>
              {writable && (
                <Button size="sm" onClick={() => setTransport({ wecomOn: !tr.noticeWecomOn })} loading={busy === 'transport'}>
                  {tr.noticeWecomOn ? '关闭企业微信推送' : '打开企业微信推送'}
                </Button>
              )}
            </div>
            {writable && (
              <>
                <Field label="webhook 地址" hint={`只支持企业微信群机器人地址（${PREFIX}…）；保存后不再显示`}>
                  <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={PREFIX} maxLength={300} autoComplete="off" />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => saveWebhook(url.trim())} disabled={!url.trim().startsWith(PREFIX)} loading={busy === 'webhook'}>
                    保存地址
                  </Button>
                  {s.webhookConfigured && (
                    <>
                      <Button onClick={test} loading={busy === 'test'} disabled={!tr.noticeWecomOn} title={tr.noticeWecomOn ? undefined : '请先打开企业微信推送'}>
                        发送测试
                      </Button>
                      <Button variant="ghost" onClick={() => window.confirm('确定清除 webhook？清除后不再推送到群里。') && saveWebhook(null)}>
                        清除
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </section>

          {/* 邮箱 */}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                邮箱
                <span className="ml-2">{tr.noticeEmail ? <Badge tone="green">已设置</Badge> : <Badge>未设置</Badge>}</span>
                <span className="ml-1">{tr.noticeEmailOn ? <Badge tone="green">推送已开</Badge> : <Badge>推送已关</Badge>}</span>
              </h3>
              {writable && (
                <Button
                  size="sm"
                  onClick={() => setTransport({ emailOn: !tr.noticeEmailOn })}
                  loading={busy === 'transport'}
                  disabled={!tr.noticeEmailOn && !tr.noticeEmail}
                  title={!tr.noticeEmailOn && !tr.noticeEmail ? '请先设置通知邮箱' : undefined}
                >
                  {tr.noticeEmailOn ? '关闭邮箱推送' : '打开邮箱推送'}
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              当前通知邮箱：<span className="font-mono">{tr.noticeEmail ?? '—'}</span>
              <span className="ml-2 text-xs text-gray-400">{MAIL_LIMIT_TEXT}，超出的只在通知中心显示。</span>
            </p>
            {writable && (
              <>
                <Field label={tr.noticeEmail ? '更换通知邮箱' : '设置通知邮箱'} hint="填你的登录邮箱可直接保存；其他邮箱需要先收验证码确认是你的">
                  <input
                    className={inputCls}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (codeFor && e.target.value.trim() !== codeFor) setCodeFor(null)
                    }}
                    placeholder="name@example.com"
                    maxLength={120}
                    autoComplete="email"
                  />
                </Field>
                {codeFor && (
                  <Field label="验证码" hint={`已发送到 ${codeFor}`}>
                    <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="6 位数字" autoComplete="one-time-code" />
                  </Field>
                )}
                <div className="flex flex-wrap gap-2">
                  {codeFor ? (
                    <>
                      <Button variant="primary" onClick={() => saveNoticeEmail(codeFor, code)} disabled={code.length !== 6} loading={busy === 'email'}>
                        验证并保存
                      </Button>
                      <Button onClick={startNoticeEmail} loading={busy === 'code'}>
                        重新发送
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" onClick={startNoticeEmail} disabled={!email.trim()} loading={busy === 'code' || busy === 'email'}>
                      保存 / 获取验证码
                    </Button>
                  )}
                  {tr.noticeEmail && (
                    <>
                      <Button onClick={testEmail} loading={busy === 'etest'}>
                        发送测试邮件
                      </Button>
                      <Button variant="ghost" onClick={() => window.confirm('确定清除通知邮箱？清除后邮箱推送会一并关闭。') && saveNoticeEmail(null)}>
                        清除
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </Card>
    </div>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value}</dd>
    </div>
  )
}
