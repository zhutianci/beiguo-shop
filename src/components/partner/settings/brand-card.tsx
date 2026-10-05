'use client'

/**
 * 设置中心「店铺品牌」卡片（docs/多渠道分销-渠道品牌与公告.md 第 3 节）：网站名称、logo、页脚简介、首页大标题与副标题、浏览器标题与分享摘要。
 * 仅 OWNER（settings.write）；暂停营业时只读；平台锁定时只读并提示（服务端同样拒绝）。
 *
 *  · 读写 /api/partner/settings/brand（JSON）；logo 走 /api/partner/settings/brand-logo（multipart 上传 / DELETE 清除）。
 *  · 显示渠道自己填的原值（不回退）；没填的项前台显示平台默认。
 *  · 格式提示用 brand-base 的同一套校验（零依赖），以服务端校验为准（站名另过邮件禁发词）。
 *  · logo 只用服务端返回、且匹配 /uploads/brand/<名>.(png|jpg|webp) 的地址做 <img src>；客户端从不提交 URL。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { BRAND_LOGO_URL_RE, BRAND_TEXT_FIELDS, BRAND_TEXT_LIMITS, checkBrandTextFormat, OPERATOR_LINE, type BrandTextField } from '@/lib/brand-base'
import { gotoLogin, partnerApi } from '../common/api'
import { Button, Card, ErrorBox, Field, inputCls, Loading, Notice } from '../common/ui'

interface BrandDTO {
  brandName: string | null
  brandLogoUrl: string | null
  brandIntro: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  seoTitle: string | null
  seoDescription: string | null
  locked: boolean
}

type Form = Record<BrandTextField, string>

const LOGO_MAX_BYTES = 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const PLACEHOLDER: Record<BrandTextField, string> = {
  brandName: '贝果科技（未设置）',
  brandIntro: '未设置：显示平台默认简介（站名换成你的网站名称）',
  heroTitle: '未设置：显示「ChatGPT、Claude 充值与代充」',
  heroSubtitle: '未设置：显示平台默认副标题',
  seoTitle: '未设置：显示平台默认标题（站名换成你的网站名称）',
  seoDescription: '未设置：显示平台默认摘要（站名换成你的网站名称）',
}

const HINT: Record<BrandTextField, string> = {
  brandName: '页头、页脚、浏览器标签、买家收到的订单邮件都会用它。不能包含「官方」「OpenAI」「ChatGPT」「Claude」「支付宝」等字样',
  brandIntro: '页脚 logo 下面那段话',
  heroTitle: '首页最上方的大字，建议 10 个字以内',
  heroSubtitle: '大标题下面的一句说明',
  seoTitle: '浏览器标签与分享链接的标题（首页）',
  seoDescription: '分享链接时显示的那段介绍',
}

function toForm(d: BrandDTO): Form {
  return {
    brandName: d.brandName ?? '',
    brandIntro: d.brandIntro ?? '',
    heroTitle: d.heroTitle ?? '',
    heroSubtitle: d.heroSubtitle ?? '',
    seoTitle: d.seoTitle ?? '',
    seoDescription: d.seoDescription ?? '',
  }
}

export function BrandCard({ readOnly }: { readOnly?: boolean }) {
  const [d, setD] = useState<BrandDTO | null>(null)
  const [f, setF] = useState<Form | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [busy, setBusy] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const apply = (x: BrandDTO) => {
    setD(x)
    setF(toForm(x))
  }

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ brand: BrandDTO }>('/api/partner/settings/brand')
    if (r.ok) apply(r.data.brand)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!d || !f) return <Loading />

  const writable = !readOnly && !d.locked
  const errors: Partial<Record<BrandTextField, string>> = {}
  for (const k of BRAND_TEXT_FIELDS) {
    const r = checkBrandTextFormat(k, f[k])
    if (!r.ok) errors[k] = r.error
  }
  const hasError = Object.keys(errors).length > 0
  const logo = d.brandLogoUrl && BRAND_LOGO_URL_RE.test(d.brandLogoUrl) ? d.brandLogoUrl : null

  const save = async () => {
    setBusy('save')
    setMsg(null)
    const body: Record<string, string> = {}
    for (const k of BRAND_TEXT_FIELDS) body[k] = f[k].trim()
    const r = await partnerApi<{ brand: BrandDTO }>('/api/partner/settings/brand', { method: 'PUT', body })
    setBusy('')
    if (r.ok) {
      apply(r.data.brand)
      setMsg({ tone: 'green', text: '已保存，前台刷新后生效' })
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  const upload = async (file: File) => {
    setMsg(null)
    if (!LOGO_TYPES.includes(file.type)) return setMsg({ tone: 'red', text: '只支持 PNG / JPG / WebP 格式的 logo 图片' })
    if (file.size > LOGO_MAX_BYTES) return setMsg({ tone: 'red', text: 'logo 图片不能超过 1MB' })
    setBusy('logo')
    const fd = new FormData()
    fd.append('file', file)
    let res: Response | null = null
    try {
      res = await fetch('/api/partner/settings/brand-logo', { method: 'POST', body: fd, credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } })
    } catch {
      res = null
    }
    setBusy('')
    if (fileRef.current) fileRef.current.value = ''
    if (!res) return setMsg({ tone: 'red', text: '网络异常，请稍后重试' })
    if (res.status === 401) return gotoLogin()
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: { brand: BrandDTO }; error?: string } | null
    if (res.ok && json?.success !== false && json?.data?.brand) {
      apply(json.data.brand)
      setMsg({ tone: 'green', text: 'logo 已更新，前台刷新后生效' })
    } else {
      setMsg({ tone: 'red', text: json?.error || (res.status === 413 ? 'logo 图片不能超过 1MB' : res.status === 429 ? '操作过于频繁，请稍后再试' : '上传失败，请稍后重试') })
    }
  }

  const clearLogo = async () => {
    if (!confirm('清除 logo？清除后前台显示网站名称首字（没设网站名称时显示平台 logo）。')) return
    setBusy('clear')
    setMsg(null)
    // 带空 JSON 体，理由见 contact-card.tsx 的 clearQr
    const r = await partnerApi<{ brand: BrandDTO }>('/api/partner/settings/brand-logo', { method: 'DELETE', body: {} })
    setBusy('')
    if (r.ok) {
      apply(r.data.brand)
      setMsg({ tone: 'green', text: 'logo 已清除' })
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  const field = (k: BrandTextField, multiline = false) => {
    const lim = BRAND_TEXT_LIMITS[k]
    const n = Array.from(f[k].trim()).length
    const hint = errors[k] ?? `${HINT[k]}（${n}/${lim.max}）`
    const common = {
      className: inputCls + (multiline ? ' min-h-[72px]' : ''),
      value: f[k],
      disabled: !writable,
      placeholder: PLACEHOLDER[k],
      onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }),
    }
    return (
      <Field label={lim.label} hint={<span className={errors[k] ? 'text-red-600' : undefined}>{hint}</span>}>
        {multiline ? <textarea {...common} maxLength={lim.max * 2} /> : <input {...common} maxLength={lim.max * 2} />}
      </Field>
    )
  }

  return (
    <Card
      title="店铺品牌"
      extra={
        writable ? (
          <Button size="sm" variant="primary" onClick={save} loading={busy === 'save'} disabled={hasError}>
            保存
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          可以把本店前台的网站名称、logo、简介与首页标题换成你自己的。没填的项显示平台默认；改了网站名称或 logo 后，页面上不再出现「贝果科技」的名字和图标。
          收款与开票仍由平台主体完成，所以页脚最底部会保留一行小字「{OPERATOR_LINE}」，服务条款与隐私政策里的主体也不变。
        </p>
        {d.locked && <Notice tone="amber">平台已锁定本店品牌设置：现有设置保留，暂时不能修改。如需修改请联系平台。</Notice>}
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {logo ? <img src={logo} alt="店铺 logo" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-400">未上传</span>}
          </div>
          <div className="space-y-2 text-sm text-gray-500">
            <div>logo：建议正方形、透明底，PNG / JPG / WebP，不超过 1MB；用于页头、页脚、浏览器标签图标与分享图。每小时最多上传 10 次。</div>
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
                <Button size="sm" onClick={() => fileRef.current?.click()} loading={busy === 'logo'}>
                  {logo ? '更换 logo' : '上传 logo'}
                </Button>
                {logo && (
                  <Button size="sm" variant="danger" onClick={clearLogo} loading={busy === 'clear'}>
                    清除 logo
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {field('brandName')}
          {field('heroTitle')}
          {field('heroSubtitle')}
          {field('seoTitle')}
        </div>
        {field('brandIntro', true)}
        {field('seoDescription', true)}
      </div>
    </Card>
  )
}
