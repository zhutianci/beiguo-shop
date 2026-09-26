'use client'

/**
 * 设置中心「客服信息」卡片（二期改动 4.3）：微信号或昵称、客服邮箱、服务时间，以及客服二维码上传 / 清除。仅 OWNER（settings.write），
 * 暂停营业时只读（readOnly：输入框禁用、不显示按钮；服务端 partnerRoute 同样拒绝写请求）。
 *
 *  · 读写 /api/partner/settings/contact（JSON，partnerApi）；二维码走 /api/partner/settings/contact-qr：
 *    上传是 multipart（partnerApi 只发 JSON，这里单独发 FormData；同源校验放行 multipart），清除是 DELETE。
 *  · 显示的是渠道自己填的原值（不回退）；没填的项在提示里说明前台正在显示什么（回退规则见 src/lib/contact-base.ts）。
 *  · 格式提示只是即时反馈（contact-base 的正则，零依赖）；以服务端校验为准（含客服邮箱的阿里云禁发词检查）。
 *  · 二维码只用服务端返回、且匹配 /uploads/contact/<名>.(png|jpg|webp) 的地址做 <img src>；客户端从不提交 URL。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { isContactEmailSyntax, isValidContactHours, isValidContactQrUrl, isValidContactWechat } from '@/lib/contact-base'
import { gotoLogin, partnerApi } from '../common/api'
import { Button, Card, ErrorBox, Field, inputCls, Loading, Notice } from '../common/ui'

interface ContactDTO {
  supportWechat: string | null
  supportQrUrl: string | null
  supportEmail: string | null
  supportHours: string | null
}

/** 与服务端 CONTACT_QR_MAX_BYTES 一致；这里只是提前提示，服务端按真实字节与文件头再判 */
const QR_MAX_BYTES = 2 * 1024 * 1024
const QR_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function ContactCard({ readOnly }: { readOnly?: boolean }) {
  const [c, setC] = useState<ContactDTO | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [f, setF] = useState({ wechat: '', email: '', hours: '' })
  const [busy, setBusy] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const writable = !readOnly

  const apply = (d: ContactDTO) => {
    setC(d)
    setF({ wechat: d.supportWechat ?? '', email: d.supportEmail ?? '', hours: d.supportHours ?? '' })
  }

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ contact: ContactDTO }>('/api/partner/settings/contact')
    if (r.ok) apply(r.data.contact)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setBusy('save')
    setMsg(null)
    // 空串 = 清空（服务端按 null 处理，该项前台回退主站）
    const r = await partnerApi<{ contact: ContactDTO }>('/api/partner/settings/contact', {
      method: 'PUT',
      body: { wechat: f.wechat.trim(), email: f.email.trim(), hours: f.hours.trim() },
    })
    setBusy('')
    if (r.ok) {
      apply(r.data.contact)
      setMsg({ tone: 'green', text: '客服信息已保存，前台刷新后生效' })
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  const upload = async (file: File) => {
    setMsg(null)
    if (!QR_TYPES.includes(file.type)) return setMsg({ tone: 'red', text: '只支持 PNG / JPG / WebP 格式的二维码图片' })
    if (file.size > QR_MAX_BYTES) return setMsg({ tone: 'red', text: '二维码图片不能超过 2MB' })
    setBusy('qr')
    const fd = new FormData()
    fd.append('file', file)
    let res: Response | null = null
    try {
      res = await fetch('/api/partner/settings/contact-qr', { method: 'POST', body: fd, credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } })
    } catch {
      res = null
    }
    setBusy('')
    if (fileRef.current) fileRef.current.value = ''
    if (!res) return setMsg({ tone: 'red', text: '网络异常，请稍后重试' })
    if (res.status === 401) return gotoLogin()
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: { contact: ContactDTO }; error?: string } | null
    if (res.ok && json?.success !== false && json?.data?.contact) {
      apply(json.data.contact)
      setMsg({ tone: 'green', text: '二维码已更新，前台刷新后生效' })
    } else {
      setMsg({ tone: 'red', text: json?.error || (res.status === 413 ? '二维码图片不能超过 2MB' : res.status === 429 ? '操作过于频繁，请稍后再试' : '上传失败，请稍后重试') })
    }
  }

  const clearQr = async () => {
    if (!confirm('清除客服二维码？清除后前台不再显示二维码（微信号也没填时，前台显示平台客服）。')) return
    setBusy('clear')
    setMsg(null)
    /*
     * 带一个空 JSON 体：浏览器发无体 DELETE 时不带 Content-Length（Fetch 规范只给 POST / PUT 补 0），
     * 而 Next 仍给这个请求挂了 body 流，渠道同源校验（tenant/same-origin.ts requestHasBody）会按「有请求体」处理、
     * 要求 Content-Type 为 JSON，否则 404。集成阶段 live-channel 按浏览器的发法实测复现过。
     * 终审已在服务端修正（按 Content-Length / Transfer-Encoding 判断有无请求体，裸 DELETE 也放行），
     * 这里仍保留空体：两种发法服务端都接受，换镜像的窗口里旧前端对新服务端、新前端对旧服务端都不出错。
     */
    const r = await partnerApi<{ contact: ContactDTO }>('/api/partner/settings/contact-qr', { method: 'DELETE', body: {} })
    setBusy('')
    if (r.ok) {
      apply(r.data.contact)
      setMsg({ tone: 'green', text: '二维码已清除' })
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!c) return <Loading />

  const wx = f.wechat.trim()
  const em = f.email.trim()
  const hr = f.hours.trim()
  const wxBad = !!wx && !isValidContactWechat(wx)
  const emBad = !!em && !isContactEmailSyntax(em.toLowerCase())
  const hrBad = !!hr && !isValidContactHours(hr.replace(/\s+/g, ' '))
  const qr = isValidContactQrUrl(c.supportQrUrl) ? c.supportQrUrl : null
  const ownGroup = !!c.supportWechat || !!qr

  return (
    <Card
      title="客服信息"
      extra={
        writable ? (
          <Button size="sm" variant="primary" onClick={save} loading={busy === 'save'} disabled={wxBad || emBad || hrBad}>
            保存
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          显示在本店前台的客服浮窗、客服中心、商品页与订单页。没填的项前台显示平台客服的信息：
          微信号与二维码作为一组——两项都没填时显示平台客服的微信号和二维码，填了其中任一项就只显示你自己的（没传二维码则不显示二维码）；
          客服邮箱、服务时间各自回退。
        </p>
        <Notice tone="blue">
          客服邮箱会出现在发给买家的订单邮件页脚；微信号与二维码不会出现在邮件里。
          {ownGroup ? '' : ' 当前前台显示的是平台客服的微信号与二维码。'}
        </Notice>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="微信号或昵称" hint={wxBad ? '只能包含字母、数字、下划线、横线或汉字，最多 30 个字符' : '最多 30 个字符，不能是网址'}>
            <input className={inputCls} value={f.wechat} maxLength={30} disabled={!writable} onChange={(e) => setF({ ...f, wechat: e.target.value })} placeholder="未设置" />
          </Field>
          <Field label="客服邮箱" hint={emBad ? '邮箱格式不正确' : '会进订单邮件页脚；以长串数字开头的 QQ 邮箱可能被邮件服务商判为违规，建议用别名'}>
            <input className={inputCls} type="email" value={f.email} maxLength={120} disabled={!writable} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="未设置" />
          </Field>
          <Field label="服务时间" hint={hrBad ? '只能包含数字、空格、冒号、横线、波浪线和汉字' : '如「9:00-22:00」「周一至周五 9:00~18:00」'}>
            <input className={inputCls} value={f.hours} maxLength={40} disabled={!writable} onChange={(e) => setF({ ...f, hours: e.target.value })} placeholder="未设置" />
          </Field>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {qr ? <img src={qr} alt="客服二维码" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-400">未上传二维码</span>}
          </div>
          <div className="space-y-2 text-sm text-gray-500">
            <div>客服二维码：PNG / JPG / WebP，不超过 2MB；每小时最多上传 10 次。</div>
            {writable && (
              <div className="flex flex-wrap gap-2">
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
                <Button size="sm" onClick={() => fileRef.current?.click()} loading={busy === 'qr'}>
                  {qr ? '更换二维码' : '上传二维码'}
                </Button>
                {qr && (
                  <Button size="sm" variant="danger" onClick={clearQr} loading={busy === 'clear'}>
                    清除二维码
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
