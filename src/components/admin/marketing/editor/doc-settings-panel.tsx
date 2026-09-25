'use client'

/**
 * 全局样式：内置配色主题一键套用 + 自定义颜色、字体、圆角、暗色策略。
 */
import { Check, Palette, Sparkles } from 'lucide-react'
import type { DocSettings } from '@/lib/marketing/types'
import { THEMES } from '@/lib/marketing/render'
import { cn } from '@/lib/utils'
import { ColorField, Field, Hint, Section, Segmented, SliderField } from './fields'

const COLOR_KEYS: { key: keyof DocSettings; label: string; hint?: string }[] = [
  { key: 'brand', label: '品牌色', hint: '页眉、按钮等主色' },
  { key: 'accent', label: '强调色', hint: '渐变第二色、价格高亮' },
  { key: 'text', label: '正文文字' },
  { key: 'muted', label: '次要文字' },
  { key: 'link', label: '链接颜色' },
  { key: 'canvas', label: '内容底色' },
  { key: 'backdrop', label: '外框背景' },
]

function sameColors(a: DocSettings, b: DocSettings): boolean {
  return (['backdrop', 'canvas', 'brand', 'accent', 'text', 'muted', 'link'] as const).every(
    (k) => String(a[k]).toLowerCase() === String(b[k]).toLowerCase()
  )
}

function ThemeCard({ name, s, active, onClick }: { name: string; s: DocSettings; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-lg border text-left transition-all',
        active ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
    >
      <div className="px-2.5 pb-2 pt-2.5" style={{ backgroundColor: s.backdrop }}>
        <div className="overflow-hidden rounded-md shadow-sm" style={{ backgroundColor: s.canvas }}>
          <div className="h-4" style={{ background: `linear-gradient(90deg, ${s.brand}, ${s.accent})` }} />
          <div className="space-y-1 px-2 py-1.5">
            <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: s.text, opacity: 0.85 }} />
            <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: s.muted, opacity: 0.7 }} />
            <div className="mt-1 h-2.5 w-10 rounded" style={{ backgroundColor: s.brand, borderRadius: Math.min(s.radius, 8) }} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-white px-2.5 py-1.5">
        <span className="text-xs font-medium text-gray-700">{name}</span>
        {active && <Check className="h-3.5 w-3.5 text-primary-600" />}
      </div>
    </button>
  )
}

export function DocSettingsPanel({
  settings,
  onChange,
  onApplyTheme,
}: {
  settings: DocSettings
  onChange: (s: DocSettings, key?: string) => void
  onApplyTheme: (s: DocSettings) => void
}) {
  const set = <K extends keyof DocSettings>(k: K, v: DocSettings[K]) => onChange({ ...settings, [k]: v }, `settings:${String(k)}`)
  const themes = Array.isArray(THEMES) ? THEMES : []

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Sparkles className="h-3.5 w-3.5 text-primary-500" />
          配色主题
        </div>
        {themes.length ? (
          <div className="grid grid-cols-2 gap-2.5">
            {themes.map((t) => (
              <ThemeCard key={t.key} name={t.name} s={t.settings} active={sameColors(settings, t.settings)} onClick={() => onApplyTheme(t.settings)} />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-gray-400">暂无内置主题</p>
        )}
        <Hint>套用主题时，区块里跟着旧主题走的颜色（品牌色、强调色、正文色及其浅色）会一起换掉；自己挑的其他颜色保留。</Hint>
      </div>

      <Section title="自定义颜色" icon={<Palette className="h-3.5 w-3.5" />} defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          {COLOR_KEYS.map(({ key, label, hint }) => (
            <ColorField
              key={key}
              label={label}
              hint={hint}
              value={settings[key] as string}
              onChange={(v) => v && set(key, v as DocSettings[typeof key])}
              contrastWith={key === 'text' || key === 'muted' || key === 'link' ? settings.canvas : undefined}
              contrastLabel="内容底色"
            />
          ))}
        </div>
      </Section>

      <Section title="字体与形状" defaultOpen>
        <Field label="字体">
          <Segmented
            value={settings.font}
            options={[
              { value: 'sans' as const, label: '无衬线（黑体）' },
              { value: 'serif' as const, label: '衬线（宋体）' },
            ]}
            onChange={(v) => set('font', v)}
          />
        </Field>
        <SliderField
          label="圆角"
          unit="px"
          min={0}
          max={24}
          value={settings.radius}
          onChange={(v) => set('radius', v ?? 0)}
          hint="按钮、卡片、券面的圆角；Outlook 桌面版不支持圆角，会显示为直角"
        />
      </Section>

      <Section title="暗色模式" defaultOpen>
        <Segmented
          value={settings.darkMode}
          options={[
            { value: 'auto' as const, label: '跟随邮箱客户端' },
            { value: 'light-only' as const, label: '始终浅色' },
          ]}
          onChange={(v) => set('darkMode', v)}
        />
        <Hint>
          {settings.darkMode === 'auto'
            ? '支持暗色的客户端（如 Apple 邮件）会切换配色；Gmail/Outlook 手机版可能强制反色，可用预览里的「暗色」大致查看效果。'
            : '声明只支持浅色。部分客户端（如 Gmail 手机版）仍会强制反色，这一项只能尽量减少被改色。'}
        </Hint>
      </Section>
    </div>
  )
}
