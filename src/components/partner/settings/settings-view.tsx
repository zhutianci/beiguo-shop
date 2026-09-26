'use client'

/**
 * 设置（设计 12.1）：只读的结算配置与收款信息（账号掩码）；可改通知偏好与企业微信群机器人 webhook。
 * webhook 只写不读回：保存后页面只显示「已配置」，不会再显示地址（地址本身就是凭据）。
 * 收款信息、费率、冻结期如需调整请联系站长（收款信息变更有 72 小时冷静期）。
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { TenantNoticeKind } from '@/lib/tenant/types'
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
}

const STATUS_TEXT: Record<string, string> = { DRAFT: '筹备中', ACTIVE: '营业中', SUSPENDED: '暂停营业', TERMINATED: '已停业' }
const PARTY_TEXT: Record<string, string> = { COMPANY: '公司', INDIVIDUAL_BIZ: '个体工商户', PERSON: '个人' }
const METHOD_TEXT: Record<string, string> = { ALIPAY: '支付宝', BANK: '银行卡', WECHAT: '微信' }
const PREFIX = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key='

export function SettingsView({ readOnly }: { readOnly?: boolean }) {
  const [s, setS] = useState<Settings | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState('')

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

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!s || !prefs) return <Loading />
  const t = s.tenant
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
        title="通知偏好（企业微信推送）"
        extra={
          writable ? (
            <Button size="sm" variant="primary" onClick={savePrefs} loading={busy === 'prefs'}>
              保存
            </Button>
          ) : null
        }
      >
        <p className="mb-3 text-sm text-gray-500">关掉的类型只是不推送到企业微信群，站内通知照常记录。</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(prefs) as TenantNoticeKind[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={prefs[k]} disabled={!writable} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
              {NOTICE_KIND_TEXT[k] ?? k}
            </label>
          ))}
        </div>
      </Card>

      <Card title="企业微信群机器人">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            当前：{s.webhookConfigured ? <Badge tone="green">已配置</Badge> : <Badge>未配置</Badge>}
            <span className="ml-2 text-xs text-gray-400">推送内容只有标题、订单号 / 结算单号、金额与后台链接，不含买家邮箱与卡密。</span>
          </p>
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
                    <Button onClick={test} loading={busy === 'test'}>
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
