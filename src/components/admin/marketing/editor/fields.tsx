'use client'

/**
 * 属性表单的基础控件：标签行、文字、分段按钮、开关、滑块、颜色、链接、折叠分组、浮层。
 * 统一紧凑尺寸（左栏只有 ~440px 宽），浅色后台配色（primary = sky）。
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Info, TriangleAlert, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useEditorCtx } from './editor-context'
import { clamp, contrastRatio, linkProblem, normalizeHex, readableOn } from './util'

/* ============================== 标签与提示 ============================== */

export function Hint({ tone = 'muted', children, className }: { tone?: 'muted' | 'warn' | 'error' | 'info'; children: React.ReactNode; className?: string }) {
  const cls =
    tone === 'error'
      ? 'text-red-600'
      : tone === 'warn'
        ? 'text-amber-600'
        : tone === 'info'
          ? 'text-primary-700'
          : 'text-gray-500'
  const Icon = tone === 'error' || tone === 'warn' ? TriangleAlert : tone === 'info' ? Info : null
  return (
    <p className={cn('mt-1 flex items-start gap-1 text-xs leading-5', cls, className)}>
      {Icon && <Icon className="mt-[3px] h-3.5 w-3.5 shrink-0" />}
      <span>{children}</span>
    </p>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  warn,
  right,
  children,
  className,
}: {
  label?: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  warn?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {(label || right) && (
        <div className="mb-1 flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={htmlFor} className="text-xs font-medium text-gray-600">
              {label}
            </label>
          ) : (
            <span />
          )}
          {right && <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">{right}</div>}
        </div>
      )}
      {children}
      {error ? <Hint tone="error">{error}</Hint> : warn ? <Hint tone="warn">{warn}</Hint> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  )
}

/** 两列栅格（颜色、对齐这类短控件并排放） */
export function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3', className)}>{children}</div>
}

/* ============================== 文字 ============================== */

const inputCls = 'rounded-md px-3 py-1.5 text-sm'

function Counter({ value, max }: { value: string; max?: number }) {
  if (!max) return null
  // 与 zod 的 max 同口径（UTF-16 长度）
  const n = (value || '').length
  if (n < max * 0.7) return null
  return <span className={cn('tabular-nums', n > max ? 'text-red-500' : 'text-gray-400')}>{n}/{max}</span>
}

export function TextField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  hint,
  error,
  warn,
  multiline,
  rows = 3,
  right,
  onBlur,
  autoFocus,
}: {
  label?: React.ReactNode
  value: string
  onChange: (v: string) => void
  maxLength?: number
  placeholder?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  warn?: React.ReactNode
  multiline?: boolean
  rows?: number
  right?: React.ReactNode
  onBlur?: () => void
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      warn={warn}
      right={
        <>
          {right}
          <Counter value={value} max={maxLength} />
        </>
      }
    >
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
          className={cn(
            'w-full resize-y rounded-md border border-gray-300 px-3 py-1.5 text-sm leading-6',
            'placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            error && 'border-red-400'
          )}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
          className={cn(inputCls, error && 'border-red-400')}
        />
      )}
    </Field>
  )
}

/* ============================== 分段按钮 / 开关 ============================== */

export interface SegOption<T> {
  value: T
  label: React.ReactNode
  title?: string
  disabled?: boolean
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  full = true,
  disabled,
  ariaLabel,
}: {
  value: T
  options: SegOption<T>[]
  onChange: (v: T) => void
  full?: boolean
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5', full && 'flex w-full', disabled && 'opacity-50')}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            disabled={disabled || o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded px-2 py-1 text-xs font-medium transition-colors',
              on ? 'bg-white text-primary-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900',
              (disabled || o.disabled) && 'cursor-not-allowed'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  hint?: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div>
      <label className={cn('flex cursor-pointer items-center justify-between gap-3', disabled && 'cursor-not-allowed opacity-50')}>
        <span className="text-sm text-gray-700">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
            checked ? 'bg-primary-600' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5'
            )}
          />
        </button>
      </label>
      {hint && <Hint>{hint}</Hint>}
    </div>
  )
}

/* ============================== 数值 ============================== */

/**
 * 滑块 + 数字框。数字框允许临时输入非法值（例如删空后再打），失焦时夹到 [min,max]。
 * allowDefault：值可以是 undefined（= 用渲染器默认值），显示「默认」并提供「恢复默认」。
 */
export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  allowDefault,
  defaultValue,
  hint,
  warn,
}: {
  label: React.ReactNode
  value: number | undefined
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number | undefined) => void
  allowDefault?: boolean
  /** allowDefault 时滑块在「默认」状态下的位置 */
  defaultValue?: number
  hint?: React.ReactNode
  warn?: React.ReactNode
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  useEffect(() => {
    setText(value === undefined ? '' : String(value))
  }, [value])
  const commitText = () => {
    if (text.trim() === '') {
      if (allowDefault) onChange(undefined)
      else setText(String(value ?? min))
      return
    }
    const n = Number(text)
    if (!Number.isFinite(n)) {
      setText(value === undefined ? '' : String(value))
      return
    }
    const v = clamp(Math.round(n / step) * step, min, max)
    setText(String(v))
    if (v !== value) onChange(v)
  }
  const pos = value ?? defaultValue ?? min
  return (
    <Field
      label={label}
      hint={hint}
      warn={warn}
      right={
        allowDefault && value !== undefined ? (
          <button type="button" className="text-primary-600 hover:underline" onClick={() => onChange(undefined)}>
            恢复默认
          </button>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={pos}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn('h-1.5 flex-1 cursor-pointer accent-primary-600', value === undefined && allowDefault && 'opacity-50')}
          aria-label={typeof label === 'string' ? label : undefined}
        />
        <div className="relative w-[72px] shrink-0">
          <input
            type="text"
            inputMode="numeric"
            value={text}
            placeholder={allowDefault ? '默认' : undefined}
            onChange={(e) => setText(e.target.value.replace(/[^\d.-]/g, ''))}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="w-full rounded-md border border-gray-300 py-1 pl-2 pr-7 text-right text-sm tabular-nums focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {unit && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>}
        </div>
      </div>
    </Field>
  )
}

/* ============================== 浮层 ============================== */

/** 点外面 / 按 Esc 关闭。不用 portal：编辑器必须留在 .admin-area 里（设计文档 7.3） */
export function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement>) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
    }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, ref])
}

/* ============================== 颜色 ============================== */

const COMMON_COLORS = ['#ffffff', '#f3f4f6', '#111827', '#374151', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

function Swatch({ color, active, onPick, title }: { color: string; active?: boolean; onPick: (c: string) => void; title?: string }) {
  return (
    <button
      type="button"
      title={title || color}
      onClick={() => onPick(color)}
      className={cn(
        'relative h-6 w-6 rounded-md border border-black/10 transition-transform hover:scale-110',
        active && 'ring-2 ring-primary-500 ring-offset-1'
      )}
      style={{ backgroundColor: color }}
    >
      {active && <Check className="absolute inset-0 m-auto h-3.5 w-3.5" style={{ color: readableOn(color) }} />}
    </button>
  )
}

/** 主题色 + 常用色 + 最近用色 的色板（颜色字段与富文本共用） */
export function ColorPalette({ value, onPick }: { value?: string | null; onPick: (c: string) => void }) {
  const { settings, recentColors } = useEditorCtx()
  const theme = Array.from(
    new Set([settings.brand, settings.accent, settings.text, settings.muted, settings.link, settings.canvas, settings.backdrop].map((c) => c.toLowerCase()))
  )
  const cur = value?.toLowerCase()
  const group = (title: string, colors: string[]) =>
    colors.length ? (
      <div key={title}>
        <div className="mb-1 text-[11px] font-medium text-gray-400">{title}</div>
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => (
            <Swatch key={title + c} color={c} active={cur === c} onPick={onPick} />
          ))}
        </div>
      </div>
    ) : null
  return (
    <div className="space-y-2">
      {group('主题色', theme)}
      {group('常用', COMMON_COLORS)}
      {group('最近使用', recentColors)}
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
  optional,
  placeholder = '不设置',
  contrastWith,
  contrastLabel = '背景',
  hint,
}: {
  label: React.ReactNode
  value: string | undefined
  onChange: (v: string | undefined) => void
  /** 可清空（例如渐变第二色、区块背景） */
  optional?: boolean
  placeholder?: string
  /** 与之比较对比度的底色；<4.5:1 给警告（设计文档 7.3「对比度 <4.5:1 给警告」） */
  contrastWith?: string
  contrastLabel?: string
  hint?: React.ReactNode
}) {
  const { pushRecentColor, readOnly } = useEditorCtx()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(value || '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const openedWith = useRef<string | undefined>(undefined)
  useEffect(() => setText(value || ''), [value])

  const close = useCallback(() => {
    setOpen(false)
    if (value && value !== openedWith.current) pushRecentColor(value)
  }, [value, pushRecentColor])
  useDismiss(open, close, wrapRef)

  const commitText = () => {
    if (!text.trim()) {
      if (optional) onChange(undefined)
      else setText(value || '')
      return
    }
    const hex = normalizeHex(text)
    if (hex) {
      setText(hex)
      if (hex !== value) onChange(hex)
    } else {
      setText(value || '')
    }
  }

  const ratio = value && contrastWith ? contrastRatio(value, contrastWith) : 21
  const low = ratio < 4.5

  return (
    <Field
      label={label}
      hint={hint}
      warn={low ? `与${contrastLabel}对比度 ${ratio.toFixed(1)}:1，低于 4.5:1，可能看不清` : undefined}
    >
      <div ref={wrapRef} className="relative">
        <div className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white py-1 pl-1 pr-1.5 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (!open) openedWith.current = value
              setOpen((o) => !o)
            }}
            className="h-6 w-7 shrink-0 rounded border border-black/10"
            style={
              value
                ? { backgroundColor: value }
                : { backgroundImage: 'linear-gradient(135deg,#fff 45%,#ef4444 45%,#ef4444 55%,#fff 55%)' }
            }
            aria-label="选择颜色"
          />
          <input
            value={text}
            placeholder={optional ? placeholder : '#RRGGBB'}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-xs uppercase text-gray-800 focus:outline-none focus:ring-0"
            spellCheck={false}
          />
          {optional && value && (
            <button type="button" title="清除" onClick={() => onChange(undefined)} className="text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-[248px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="color"
                value={value || '#ffffff'}
                onChange={(e) => onChange(e.target.value.toLowerCase())}
                className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                aria-label="自定义颜色"
              />
              <div className="text-xs text-gray-500">拖动取色，或点下面的色块</div>
            </div>
            <ColorPalette
              value={value}
              onPick={(c) => {
                onChange(c)
                pushRecentColor(c)
              }}
            />
            {optional && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined)
                  setOpen(false)
                }}
                className="mt-3 w-full rounded-md border border-gray-200 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                {placeholder}
              </button>
            )}
          </div>
        )}
      </div>
    </Field>
  )
}

/* ============================== 链接 ============================== */

export function UrlField({
  label,
  value,
  onChange,
  required,
  placeholder = 'https://… 或 /products/1',
  hint,
}: {
  label: React.ReactNode
  value: string | undefined
  onChange: (v: string | undefined) => void
  required?: boolean
  placeholder?: string
  hint?: React.ReactNode
}) {
  const [touched, setTouched] = useState(false)
  const problem = linkProblem(value || '', { required })
  // 必填为空的提示等用户动过再出，刚插入区块时不要一片红
  const show = problem && (touched || (value || '').trim() !== '')
  return (
    <TextField
      label={label}
      value={value || ''}
      placeholder={placeholder}
      onChange={(v) => onChange(v === '' && !required ? undefined : v)}
      onBlur={() => {
        setTouched(true)
        const t = (value || '').trim()
        if (t !== (value || '')) onChange(t || (required ? '' : undefined))
      }}
      error={show ? problem : undefined}
      hint={hint ?? '站内页面写路径（/products/1）；发送时自动加统计参数'}
    />
  )
}

/* ============================== 折叠分组 ============================== */

export function Section({
  title,
  icon,
  defaultOpen = false,
  children,
  right,
}: {
  title: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  right?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {icon}
        <span className="flex-1">{title}</span>
        {right}
      </button>
      {open && <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-3">{children}</div>}
    </div>
  )
}
