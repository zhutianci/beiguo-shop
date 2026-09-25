'use client'

/**
 * 每种区块的属性表单（区块形状见 lib/marketing/types.ts 的 blockSchema）。
 *
 * 约定：onChange(next, key) —— key 是合并撤销步用的「字段标识」（区块 id + 字段名），
 * 连续打字/拖滑块/拖取色器在 1 秒内的改动并成一步撤销。
 * 表单只负责「输入时就提示」；最终是否能发由 lint（同构）与服务端检查决定。
 */
import { useEffect, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import type { Align, Block, BlockOf, Box, CouponGrantSpec, DocSettings } from '@/lib/marketing/types'
import { TOPIC_LABEL } from '@/lib/marketing/types'
import { bjDateKey, addBjDays } from '@/lib/marketing/time'
import { cn } from '@/lib/utils'
import { useEditorCtx } from './editor-context'
import { ColorField, Field, Hint, Row, Section, Segmented, SliderField, TextField, Toggle, UrlField } from './fields'
import { ImageField } from './image-field'
import { ClaimCouponPicker, ProductMultiPicker, ProductPicker, couponRuleText } from './pickers'
import { RichTextField } from './rich-text-field'
import { contrastRatio, parseMoney } from './util'

/** 各表单都以整块替换的方式回写（区块是不可变对象，撤销历史靠引用比较判断有没有变化） */
type Change = (next: Block, key?: string) => void

interface FormProps<B> {
  block: B
  onChange: Change
  settings: DocSettings
}

/** 生成「改一个字段」的函数；key = 区块 id + 字段名，用于合并撤销步 */
function setter<B extends Block>(block: B, onChange: Change) {
  return <K extends keyof B>(k: K, v: B[K]) => onChange({ ...block, [k]: v } as B, `${block.id}:${String(k)}`)
}

const ALIGN_OPTIONS = [
  { value: 'left' as Align, label: <AlignLeft className="h-3.5 w-3.5" />, title: '左对齐' },
  { value: 'center' as Align, label: <AlignCenter className="h-3.5 w-3.5" />, title: '居中' },
  { value: 'right' as Align, label: <AlignRight className="h-3.5 w-3.5" />, title: '右对齐' },
]

function AlignField({ value, onChange, disabled }: { value: Align; onChange: (a: Align) => void; disabled?: boolean }) {
  return (
    <Field label="对齐">
      <Segmented value={value} options={ALIGN_OPTIONS} onChange={onChange} disabled={disabled} ariaLabel="对齐" />
    </Field>
  )
}

/* ============================== 金额输入 ============================== */

function MoneyField({
  label,
  value,
  onChange,
  hint,
  error,
  suffix = '元',
}: {
  label: React.ReactNode
  value: number
  onChange: (v: number) => void
  hint?: React.ReactNode
  error?: React.ReactNode
  suffix?: string
}) {
  const [text, setText] = useState(String(value))
  const [bad, setBad] = useState(false)
  useEffect(() => {
    setText(String(value))
    setBad(false)
  }, [value])
  const commit = () => {
    const n = parseMoney(text)
    if (n === null) {
      setBad(true)
      return
    }
    setBad(false)
    setText(String(n))
    if (n !== value) onChange(n)
  }
  return (
    <Field label={label} hint={hint} error={bad ? '请输入金额，最多两位小数' : error}>
      <div className="relative">
        <input
          value={text}
          inputMode="decimal"
          onChange={(e) => setText(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          className={cn(
            'w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm tabular-nums focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            (bad || error) && 'border-red-400'
          )}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      </div>
    </Field>
  )
}

/* ============================== 各区块 ============================== */

function HeaderForm({ block: b, onChange }: FormProps<BlockOf<'header'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <Toggle label="显示 Logo" checked={b.logo} onChange={(v) => set('logo', v)} hint="使用站点 Logo（放在有底色的页眉里，暗色模式下也清楚）" />
      <TextField label="标题文字" value={b.title} maxLength={40} placeholder="贝果科技" onChange={(v) => set('title', v)} />
      <Row>
        <ColorField label="背景色" value={b.bg} onChange={(v) => v && set('bg', v)} />
        <ColorField label="渐变第二色" optional placeholder="不渐变" value={b.bg2} onChange={(v) => set('bg2', v)} />
      </Row>
      <Row>
        <ColorField label="文字颜色" value={b.color} onChange={(v) => v && set('color', v)} contrastWith={b.bg} />
        <AlignField value={b.align} onChange={(v) => set('align', v)} />
      </Row>
    </>
  )
}

function HeroForm({ block: b, onChange, settings }: FormProps<BlockOf<'hero'>>) {
  const set = setter(b, onChange)
  const btn = b.button
  const setBtn = (patch: Partial<NonNullable<typeof btn>>) => {
    if (!btn) return
    onChange({ ...b, button: { ...btn, ...patch } }, `${b.id}:button:${Object.keys(patch)[0]}`)
  }
  return (
    <>
      <TextField label="大标题" value={b.title} maxLength={80} multiline rows={2} placeholder="国庆特惠 · 全场限时" onChange={(v) => set('title', v)} />
      <TextField
        label="副标题"
        value={b.subtitle || ''}
        maxLength={200}
        multiline
        rows={2}
        placeholder="一句话说明优惠力度或新品亮点（可不填）"
        onChange={(v) => set('subtitle', v || undefined)}
      />
      <Row>
        <ColorField label="背景色" value={b.bg} onChange={(v) => v && set('bg', v)} />
        <ColorField label="渐变第二色" optional placeholder="不渐变" value={b.bg2} onChange={(v) => set('bg2', v)} />
      </Row>
      <Row>
        <ColorField label="文字颜色" value={b.color} onChange={(v) => v && set('color', v)} contrastWith={b.bg} />
        <AlignField value={b.align} onChange={(v) => set('align', v)} />
      </Row>
      <ImageField label="配图（可选）" optional value={b.image} onChange={(v) => set('image', v || undefined)} />
      {b.image && (
        <TextField
          label="配图说明（alt）"
          value={b.imageAlt || ''}
          maxLength={120}
          placeholder="图片被屏蔽时显示的文字"
          onChange={(v) => set('imageAlt', v || undefined)}
          error={!b.imageAlt?.trim() ? '请填写图片说明：QQ 邮箱等默认不显示图片，这段文字就是收件人看到的内容' : undefined}
        />
      )}
      <div className="rounded-lg border border-gray-200 p-3">
        <Toggle
          label="显示按钮"
          checked={!!btn}
          onChange={(on) =>
            onChange(
              { ...b, button: on ? { label: '立即查看', href: '/', bg: '#ffffff', color: settings.brand } : undefined },
              undefined
            )
          }
        />
        {btn && (
          <div className="mt-3 space-y-3">
            <TextField label="按钮文字" value={btn.label} maxLength={40} onChange={(v) => setBtn({ label: v })} error={!btn.label.trim() ? '请填写按钮文字' : undefined} />
            <UrlField label="按钮链接" required value={btn.href} onChange={(v) => setBtn({ href: v || '' })} />
            <Row>
              <ColorField label="按钮底色" value={btn.bg} onChange={(v) => v && setBtn({ bg: v })} contrastWith={b.bg} contrastLabel="横幅背景" />
              <ColorField label="按钮文字" value={btn.color} onChange={(v) => v && setBtn({ color: v })} contrastWith={btn.bg} contrastLabel="按钮底色" />
            </Row>
          </div>
        )}
      </div>
    </>
  )
}

function HeadingForm({ block: b, onChange }: FormProps<BlockOf<'heading'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <RichTextField variant="heading" label="标题内容" placeholder="输入标题…" value={b.content} onChange={(v) => set('content', v)} />
      <Row>
        <Field label="级别">
          <Segmented
            value={b.level}
            options={[
              { value: 1 as const, label: '大' },
              { value: 2 as const, label: '中' },
              { value: 3 as const, label: '小' },
            ]}
            onChange={(v) => set('level', v)}
          />
        </Field>
        <AlignField value={b.align} onChange={(v) => set('align', v)} />
      </Row>
    </>
  )
}

function TextForm({ block: b, onChange }: FormProps<BlockOf<'text'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <RichTextField label="正文" placeholder="写点什么…可用「插入昵称」称呼收件人" value={b.content} onChange={(v) => set('content', v)} />
      <Row>
        <Field label="字号" warn={b.size < 15 ? '正文建议 ≥15px，手机上 14px 偏小' : undefined}>
          <Segmented
            value={b.size}
            options={[
              { value: 14 as const, label: '14' },
              { value: 15 as const, label: '15' },
              { value: 16 as const, label: '16' },
              { value: 18 as const, label: '18' },
            ]}
            onChange={(v) => set('size', v)}
          />
        </Field>
        <AlignField value={b.align} onChange={(v) => set('align', v)} />
      </Row>
    </>
  )
}

function ImageForm({ block: b, onChange }: FormProps<BlockOf<'image'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <ImageField value={b.src || undefined} onChange={(v) => set('src', v || '')} />
      <TextField
        label="图片说明（alt）"
        value={b.alt}
        maxLength={120}
        placeholder="例：国庆特惠海报，全场 8 折"
        onChange={(v) => set('alt', v)}
        warn={!b.alt.trim() ? 'QQ 邮箱等默认不显示图片，收件人看到的是这段文字；也不要把重要信息只放在图里' : undefined}
      />
      <SliderField label="宽度" unit="%" min={20} max={100} value={b.width} onChange={(v) => set('width', v ?? 100)} />
      <UrlField label="点击跳转（可选）" value={b.href} onChange={(v) => set('href', v)} />
      <AlignField value={b.align} onChange={(v) => set('align', v)} disabled={b.width >= 100} />
      <SliderField label="圆角" unit="px" min={0} max={24} allowDefault defaultValue={0} value={b.radius} onChange={(v) => set('radius', v)} />
    </>
  )
}

function ButtonForm({ block: b, onChange }: FormProps<BlockOf<'button'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <TextField label="按钮文字" value={b.label} maxLength={40} placeholder="立即查看" onChange={(v) => set('label', v)} error={!b.label.trim() ? '请填写按钮文字' : undefined} />
      <UrlField label="链接" required value={b.href} onChange={(v) => set('href', v || '')} />
      <Row>
        <ColorField label="按钮底色" value={b.bg} onChange={(v) => v && set('bg', v)} />
        <ColorField label="文字颜色" value={b.color} onChange={(v) => v && set('color', v)} contrastWith={b.bg} contrastLabel="按钮底色" />
      </Row>
      <Row>
        <Field label="尺寸">
          <Segmented
            value={b.size}
            options={[
              { value: 'sm' as const, label: '小' },
              { value: 'md' as const, label: '中' },
              { value: 'lg' as const, label: '大' },
            ]}
            onChange={(v) => set('size', v)}
          />
        </Field>
        <AlignField value={b.align} onChange={(v) => set('align', v)} disabled={b.fullWidth} />
      </Row>
      <Toggle label="通栏（撑满宽度）" checked={b.fullWidth} onChange={(v) => set('fullWidth', v)} hint="手机上更好点" />
      <SliderField label="圆角" unit="px" min={0} max={40} value={b.radius} onChange={(v) => set('radius', v ?? 0)} />
    </>
  )
}

function ProductForm({ block: b, onChange }: FormProps<BlockOf<'product'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <ProductPicker value={b.productId} onChange={(id) => set('productId', id)} />
      <Row>
        <Field label="版式">
          <Segmented
            value={b.layout}
            options={[
              { value: 'card' as const, label: '卡片' },
              { value: 'row' as const, label: '横排' },
            ]}
            onChange={(v) => set('layout', v)}
          />
        </Field>
        <TextField label="按钮文字" value={b.ctaLabel} maxLength={20} placeholder="立即购买" onChange={(v) => set('ctaLabel', v)} />
      </Row>
      <Toggle label="显示商品卖点" checked={b.showFeatures} onChange={(v) => set('showFeatures', v)} />
      <Toggle
        label="显示划线原价"
        checked={b.showOriginalPrice}
        onChange={(v) => set('showOriginalPrice', v)}
        hint={
          b.showOriginalPrice ? (
            <span className="text-amber-600">划线价必须是近期真实成交过的价格，否则属于价格欺诈（《明码标价和禁止价格欺诈规定》）</span>
          ) : undefined
        }
      />
      <Hint>价格自动取商品当前售价，并附「价格不含税」小字</Hint>
    </>
  )
}

function ProductGridForm({ block: b, onChange }: FormProps<BlockOf<'productGrid'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <ProductMultiPicker
        label="商品（两列排列，手机上自动一列）"
        value={b.productIds}
        min={2}
        max={6}
        onChange={(ids) => onChange({ ...b, productIds: ids }, undefined)}
      />
      <TextField label="按钮文字" value={b.ctaLabel} maxLength={20} placeholder="去看看" onChange={(v) => set('ctaLabel', v)} />
      <Toggle label="显示商品卖点" checked={b.showFeatures} onChange={(v) => set('showFeatures', v)} />
    </>
  )
}

const DEFAULT_GRANT: CouponGrantSpec = {
  kind: 'THRESHOLD',
  discount: 10,
  minAmount: 0,
  productIds: [],
  validity: { mode: 'days', days: 7 },
}

function grantProblems(g: CouponGrantSpec): { discount?: string; minAmount?: string; products?: string } {
  const out: { discount?: string; minAmount?: string; products?: string } = {}
  if (!(g.discount > 0)) out.discount = '面额要大于 0'
  if (g.minAmount > 0 && g.minAmount < g.discount + 0.01) out.minAmount = `门槛要么填 0（无门槛），要么至少 ${(g.discount + 0.01).toFixed(2)} 元（比面额多一分钱）`
  if (g.kind === 'PRODUCT' && g.productIds.length === 0) out.products = '商品券至少要选一个适用商品'
  return out
}

function CouponForm({ block: b, onChange }: FormProps<BlockOf<'coupon'>>) {
  const { topic, setTopic, productMap } = useEditorCtx()
  const set = setter(b, onChange)
  const g = b.grant || DEFAULT_GRANT
  const setGrant = (patch: Partial<CouponGrantSpec>, key: string) => onChange({ ...b, grant: { ...g, ...patch } }, `${b.id}:grant:${key}`)
  const probs = grantProblems(g)
  const today = bjDateKey()
  const minUntil = addBjDays(today, 3)
  const names = g.productIds.map((id) => productMap.get(id)?.name).filter(Boolean) as string[]

  return (
    <>
      <Field label="发券方式">
        <Segmented
          value={b.mode}
          options={[
            { value: 'grant' as const, label: '直发到账户' },
            { value: 'claim' as const, label: '领取链接' },
          ]}
          onChange={(m) => onChange({ ...b, mode: m, grant: m === 'grant' ? b.grant || DEFAULT_GRANT : b.grant }, undefined)}
        />
      </Field>
      {b.mode === 'grant' ? (
        <Hint tone="info">发送时逐人把券放进账户（先发券后发信），收件人登录即可用；不受「同一网络限领」影响，转发给别人也用不了。</Hint>
      ) : (
        <Hint>按钮跳到公开领取页 /coupon/领取码，沿用该批次的数量与限领规则。</Hint>
      )}

      {b.mode === 'grant' && topic !== 'PROMO' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          含直发券的邮件分类必须是「{TOPIC_LABEL.PROMO}」（当前：{TOPIC_LABEL[topic]}）。
          <button type="button" onClick={() => setTopic('PROMO')} className="ml-1 font-medium underline">
            改为{TOPIC_LABEL.PROMO}
          </button>
        </div>
      )}

      <TextField label="券标题（买家可见）" value={b.title} maxLength={40} placeholder="邮件专享券" onChange={(v) => set('title', v)} hint="也是券在买家「我的优惠券」里显示的名字；不要写活动内部名称" />
      <TextField label="补充说明（可选）" value={b.note || ''} maxLength={120} placeholder="例：仅限 Claude 系列使用" onChange={(v) => set('note', v || undefined)} />
      <Row>
        <TextField label="按钮文字" value={b.ctaLabel} maxLength={20} placeholder={b.mode === 'grant' ? '去使用' : '立即领取'} onChange={(v) => set('ctaLabel', v)} />
        <div />
      </Row>
      <Row>
        <ColorField label="券面底色" value={b.bg} onChange={(v) => v && set('bg', v)} />
        <ColorField label="券面文字" value={b.color} onChange={(v) => v && set('color', v)} contrastWith={b.bg} contrastLabel="券面底色" />
      </Row>

      {b.mode === 'grant' ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
          <div className="text-xs font-semibold text-gray-700">券规则</div>
          <Field label="券类型">
            <Segmented
              value={g.kind}
              options={[
                { value: 'THRESHOLD' as const, label: '全场券' },
                { value: 'PRODUCT' as const, label: '指定商品券' },
              ]}
              onChange={(k) => setGrant({ kind: k, productIds: k === 'THRESHOLD' ? [] : g.productIds }, 'kind')}
            />
          </Field>
          <Row>
            <MoneyField label="面额" value={g.discount} onChange={(v) => setGrant({ discount: v }, 'discount')} error={probs.discount} />
            <MoneyField label="使用门槛" value={g.minAmount} onChange={(v) => setGrant({ minAmount: v }, 'minAmount')} hint={g.minAmount === 0 ? '0 = 无门槛' : undefined} />
          </Row>
          {probs.minAmount && <Hint tone="error">{probs.minAmount}</Hint>}
          {g.kind === 'PRODUCT' && (
            <ProductMultiPicker
              label="适用商品"
              value={g.productIds}
              min={1}
              max={50}
              onChange={(ids) => setGrant({ productIds: ids }, 'productIds')}
            />
          )}
          <Field label="有效期">
            <Segmented
              value={g.validity.mode}
              options={[
                { value: 'days' as const, label: '到账后 N 天' },
                { value: 'until' as const, label: '固定截止日' },
              ]}
              onChange={(m) =>
                setGrant({ validity: m === 'days' ? { mode: 'days', days: 7 } : { mode: 'until', date: addBjDays(today, 14) } }, 'validity-mode')
              }
            />
          </Field>
          {g.validity.mode === 'days' ? (
            <SliderField
              label="到账后有效天数"
              unit="天"
              min={1}
              max={60}
              value={g.validity.days}
              onChange={(v) => setGrant({ validity: { mode: 'days', days: v ?? 7 } }, 'days')}
              hint="按每个人实际收到券的那天起算（预热/分多天发送也不会提前过期）"
            />
          ) : (
            <Field
              label="截止日期（北京时间当天 23:59:59）"
              warn={g.validity.date < minUntil ? '截止日太近：发送前检查要求晚于「预计发完时间 + 72 小时」，剩余不足 48 小时会自动暂停发送' : undefined}
            >
              <input
                type="date"
                value={g.validity.date}
                min={addBjDays(today, 1)}
                onChange={(e) => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setGrant({ validity: { mode: 'until', date: e.target.value } }, 'until')
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </Field>
          )}
          <div className="rounded-md bg-white px-3 py-2 text-xs text-gray-600 ring-1 ring-gray-200">
            预览：<span className="font-medium text-gray-900">{couponRuleText(g)}</span>
            {g.kind === 'PRODUCT' && names.length > 0 && <span>（{names.slice(0, 3).join('、')}{names.length > 3 ? ` 等 ${names.length} 个` : ''}）</span>}
            <span className="text-gray-400"> · 发送前检查会显示「最多发出 N 张 · 最高让利 ¥X」</span>
          </div>
        </div>
      ) : (
        <ClaimCouponPicker value={b.claimCode} onChange={(code) => set('claimCode', code)} />
      )}
    </>
  )
}

function CalloutForm({ block: b, onChange }: FormProps<BlockOf<'callout'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <RichTextField variant="compact" label="提示内容" placeholder="例：活动截止 10 月 7 日，数量有限" value={b.content} onChange={(v) => set('content', v)} />
      <Field label="样式">
        <Segmented
          value={b.tone}
          options={[
            { value: 'brand' as const, label: '品牌' },
            { value: 'info' as const, label: '信息' },
            { value: 'success' as const, label: '成功' },
            { value: 'warning' as const, label: '提醒' },
          ]}
          onChange={(v) => set('tone', v)}
        />
      </Field>
    </>
  )
}

function DividerForm({ block: b, onChange }: FormProps<BlockOf<'divider'>>) {
  const set = setter(b, onChange)
  return (
    <>
      <ColorField label="颜色" value={b.color} onChange={(v) => v && set('color', v)} />
      <Row>
        <Field label="粗细">
          <Segmented
            value={b.thickness}
            options={[
              { value: 1 as const, label: '1px' },
              { value: 2 as const, label: '2px' },
            ]}
            onChange={(v) => set('thickness', v)}
          />
        </Field>
        <Field label="长度">
          <Segmented
            value={b.widthPct}
            options={[
              { value: 30 as const, label: '短' },
              { value: 60 as const, label: '中' },
              { value: 100 as const, label: '通栏' },
            ]}
            onChange={(v) => set('widthPct', v)}
          />
        </Field>
      </Row>
    </>
  )
}

function SpacerForm({ block: b, onChange }: FormProps<BlockOf<'spacer'>>) {
  const set = setter(b, onChange)
  return <SliderField label="高度" unit="px" min={8} max={96} step={4} value={b.height} onChange={(v) => set('height', v ?? 24)} />
}

/* ============================== 间距与背景（所有区块通用） ============================== */

function cleanBox(box: Box): Box | undefined {
  const out: Box = {}
  if (box.padTop !== undefined) out.padTop = box.padTop
  if (box.padBottom !== undefined) out.padBottom = box.padBottom
  if (box.bg) out.bg = box.bg
  return Object.keys(out).length ? out : undefined
}

export function BoxForm({ block, onChange, settings }: { block: Block; onChange: (b: Block, key?: string) => void; settings: DocSettings }) {
  const box = block.box || {}
  const setBox = (patch: Box, key: string) => onChange({ ...block, box: cleanBox({ ...box, ...patch }) } as Block, `${block.id}:box:${key}`)
  const custom = box.padTop !== undefined || box.padBottom !== undefined || !!box.bg
  return (
    <Section title="间距与背景" defaultOpen={false} right={custom ? <span className="rounded bg-primary-50 px-1.5 text-[10px] font-medium text-primary-700">已自定义</span> : undefined}>
      <Row>
        <SliderField label="上边距" unit="px" min={0} max={64} step={4} allowDefault defaultValue={16} value={box.padTop} onChange={(v) => setBox({ padTop: v }, 'padTop')} />
        <SliderField label="下边距" unit="px" min={0} max={64} step={4} allowDefault defaultValue={16} value={box.padBottom} onChange={(v) => setBox({ padBottom: v }, 'padBottom')} />
      </Row>
      <ColorField
        label="区块背景"
        optional
        placeholder="透明（跟随内容底色）"
        value={box.bg}
        onChange={(v) => setBox({ bg: v }, 'bg')}
      />
      {box.bg && contrastRatio(settings.text, box.bg) < 4.5 && (
        <Hint tone="warn">正文颜色在这个背景上对比度不足 4.5:1，可能看不清</Hint>
      )}
    </Section>
  )
}

/* ============================== 分发 ============================== */

export function BlockForm({
  block,
  onChange,
  settings,
}: {
  block: Block
  onChange: (b: Block, key?: string) => void
  settings: DocSettings
}) {
  const ch = onChange
  let body: React.ReactNode
  switch (block.type) {
    case 'header':
      body = <HeaderForm block={block} onChange={ch} settings={settings} />
      break
    case 'hero':
      body = <HeroForm block={block} onChange={ch} settings={settings} />
      break
    case 'heading':
      body = <HeadingForm block={block} onChange={ch} settings={settings} />
      break
    case 'text':
      body = <TextForm block={block} onChange={ch} settings={settings} />
      break
    case 'image':
      body = <ImageForm block={block} onChange={ch} settings={settings} />
      break
    case 'button':
      body = <ButtonForm block={block} onChange={ch} settings={settings} />
      break
    case 'product':
      body = <ProductForm block={block} onChange={ch} settings={settings} />
      break
    case 'productGrid':
      body = <ProductGridForm block={block} onChange={ch} settings={settings} />
      break
    case 'coupon':
      body = <CouponForm block={block} onChange={ch} settings={settings} />
      break
    case 'callout':
      body = <CalloutForm block={block} onChange={ch} settings={settings} />
      break
    case 'divider':
      body = <DividerForm block={block} onChange={ch} settings={settings} />
      break
    case 'spacer':
      body = <SpacerForm block={block} onChange={ch} settings={settings} />
      break
    default:
      body = <Hint tone="error">未知的区块类型</Hint>
  }
  return (
    <div className="space-y-3">
      {body}
      <BoxForm block={block} onChange={onChange} settings={settings} />
    </div>
  )
}
