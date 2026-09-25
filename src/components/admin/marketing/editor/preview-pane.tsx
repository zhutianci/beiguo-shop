'use client'

/**
 * 右栏：预览工具条（桌面/手机、暗色模拟、无图、以某用户预览、HTML 体积）+ 收件箱预览 + 邮件预览框 + 检查结果面板。
 */
import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Crosshair,
  ImageOff,
  Monitor,
  Moon,
  Smartphone,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import type { LintIssue } from '@/lib/marketing/types'
import { MAX_HTML_BYTES, MAX_IMAGES, WARN_HTML_BYTES } from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { PreviewFrame } from '../preview-frame'
import { formatBytes } from './util'

export type Device = 'desktop' | 'mobile'
/**
 * 暗色预览的两种近似：
 * - native：按邮件自带的暗色样式显示（Apple 邮件、iOS 邮件、Outlook.com 等支持 prefers-color-scheme 的客户端）。
 *   由渲染器的约定实现：给预览文档 <html> 加 mk-sim-dark 类；文档设为「始终浅色」时渲染器不输出暗色样式，保持浅色。
 * - invert：强制反色（Gmail / Outlook 手机 App 的做法）—— 整体反相再转回色相，图片再反一次恢复原样。
 */
export type DarkSim = 'off' | 'native' | 'invert'

export interface PreviewUser {
  id: number
  email: string
  nickname: string | null
}

/** 桌面预览框宽度：比 600 的邮件容器宽一些，能看到外框背景（真实桌面客户端都比 600 宽） */
const DESKTOP_WIDTH = 680
const MOBILE_WIDTH = 375

const DARK_FILTER = 'invert(1) hue-rotate(180deg)'
const DARK_IMG_CSS = 'img{filter:invert(1) hue-rotate(180deg)}'
/** 渲染器约定的「按自带暗色样式显示」开关类（见 lib/marketing/render.ts previewCss） */
const NATIVE_DARK_CLASS = 'mk-sim-dark'

function ToolToggle({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
        on ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  )
}

export interface PreviewPaneProps {
  html: string | null
  renderError: string | null
  sizeBytes: number
  imageCount: number
  device: Device
  onDevice: (d: Device) => void
  dark: DarkSim
  onDark: (v: DarkSim) => void
  /** 文档的暗色策略：决定点「暗色」时默认用哪种模拟、提示文字怎么写 */
  docDarkMode: 'auto' | 'light-only'
  imagesOff: boolean
  onImagesOff: (v: boolean) => void
  previewUsers: PreviewUser[]
  previewUserId: number | null
  onPreviewUser: (id: number | null) => void
  onSelectBlock: (id: string) => void
  focusBlockId: string | null
  focusToken: number
  inbox: { fromAlias: string; subject: string; preheader: string }
  issues: LintIssue[]
  lintUnavailable: boolean
  onIssueClick: (issue: LintIssue) => void
}

function InboxPreview({ fromAlias, subject, preheader, width }: { fromAlias: string; subject: string; preheader: string; width: number }) {
  return (
    <div className="mx-auto mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm" style={{ width, maxWidth: '100%' }}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
          {(fromAlias || '贝').slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-gray-900">{fromAlias || '贝果科技'}</span>
            <span className="shrink-0 text-[11px] text-gray-400">收件箱预览</span>
          </div>
          <div className="truncate text-sm font-medium text-gray-800">{subject || <span className="text-gray-400">（还没有主题）</span>}</div>
          <div className="truncate text-xs text-gray-500">{preheader || <span className="text-gray-400">（没有预览文字：客户端会截取正文开头）</span>}</div>
        </div>
      </div>
    </div>
  )
}

function IssuesPanel({
  issues,
  unavailable,
  onIssueClick,
}: {
  issues: LintIssue[]
  unavailable: boolean
  onIssueClick: (i: LintIssue) => void
}) {
  const [open, setOpen] = useState(false)
  const errors = issues.filter((i) => i.level === 'error')
  const warns = issues.filter((i) => i.level !== 'error')
  const sorted = errors.concat(warns)
  return (
    <div className="shrink-0 border-t border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-2 px-4 text-left text-sm hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-700">检查</span>
        {unavailable ? (
          <span className="text-xs text-gray-400">暂不可用</span>
        ) : issues.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <CircleCheck className="h-3.5 w-3.5" />
            没有发现问题
          </span>
        ) : (
          <>
            {errors.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                <CircleAlert className="h-3 w-3" />
                {errors.length} 个错误
              </span>
            )}
            {warns.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <TriangleAlert className="h-3 w-3" />
                {warns.length} 个警告
              </span>
            )}
            {errors.length > 0 && <span className="hidden text-xs text-gray-400 xl:inline">有错误不能测试或发送</span>}
          </>
        )}
        <span className="ml-auto text-gray-400">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</span>
      </button>
      {open && !unavailable && issues.length > 0 && (
        <ul className="max-h-[32vh] divide-y divide-gray-100 overflow-y-auto overscroll-contain border-t border-gray-100">
          {sorted.map((i, idx) => (
            <li key={`${i.code}-${i.blockId || ''}-${idx}`} className="flex items-start gap-2 px-4 py-2">
              {i.level === 'error' ? (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span className={cn('flex-1 text-sm', i.level === 'error' ? 'text-red-700' : 'text-amber-800')}>{i.message}</span>
              {i.blockId && (
                <button
                  type="button"
                  onClick={() => onIssueClick(i)}
                  className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-primary-600 hover:bg-primary-50"
                >
                  <Crosshair className="h-3 w-3" />
                  定位
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PreviewPane(p: PreviewPaneProps) {
  const width = p.device === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH
  const sizeTone = p.sizeBytes > MAX_HTML_BYTES ? 'text-red-600 bg-red-50' : p.sizeBytes > WARN_HTML_BYTES ? 'text-amber-700 bg-amber-50' : 'text-gray-600 bg-gray-100'
  const imgTone = p.imageCount > MAX_IMAGES ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-100'

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gray-100">
      {/* 工具条 */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
        <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
          {(
            [
              { d: 'desktop' as Device, icon: Monitor, label: '桌面', title: '桌面客户端（邮件宽 600px）' },
              { d: 'mobile' as Device, icon: Smartphone, label: '手机', title: '手机（375px 宽）' },
            ] as const
          ).map(({ d, icon: Icon, label, title }) => (
            <button
              key={d}
              type="button"
              title={title}
              aria-pressed={p.device === d}
              onClick={() => p.onDevice(d)}
              className={cn(
                'inline-flex h-7 items-center gap-1 rounded px-2.5 text-xs font-medium',
                p.device === d ? 'bg-white text-primary-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center">
          <ToolToggle
            on={p.dark !== 'off'}
            onClick={() => p.onDark(p.dark !== 'off' ? 'off' : p.docDarkMode === 'auto' ? 'native' : 'invert')}
            title="暗色模式预览（近似）"
          >
            <Moon className="h-3.5 w-3.5" />
            暗色
          </ToolToggle>
          {p.dark !== 'off' && (
            <select
              value={p.dark}
              onChange={(e) => p.onDark(e.target.value as DarkSim)}
              className="-ml-px h-8 rounded-r-md border border-primary-300 bg-primary-50 py-0 pl-2 pr-7 text-xs text-primary-700 focus:outline-none focus:ring-0"
              title="不同邮箱客户端处理暗色的方式不同"
            >
              <option value="native">邮件自带暗色（Apple 邮件等）</option>
              <option value="invert">强制反色（Gmail / Outlook App）</option>
            </select>
          )}
        </div>
        <ToolToggle on={p.imagesOff} onClick={() => p.onImagesOff(!p.imagesOff)} title="无图模式：QQ 邮箱、Outlook 默认不加载图片时的样子">
          <ImageOff className="h-3.5 w-3.5" />
          无图
        </ToolToggle>
        <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white pl-2 text-xs text-gray-600" title="用某个收件人的昵称等变量渲染预览">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={p.previewUserId ?? ''}
            onChange={(e) => p.onPreviewUser(e.target.value ? Number(e.target.value) : null)}
            className="h-full max-w-[180px] cursor-pointer rounded-md border-0 bg-transparent py-0 pl-0 pr-7 text-xs focus:outline-none focus:ring-0"
          >
            <option value="">示例收件人</option>
            {p.previewUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nickname ? `${u.nickname}（${u.email}）` : u.email}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={cn('rounded-md px-2 py-1 text-xs tabular-nums', imgTone)} title={`单封邮件最多 ${MAX_IMAGES} 张图片`}>
            图片 {p.imageCount}/{MAX_IMAGES}
          </span>
          <span
            className={cn('rounded-md px-2 py-1 text-xs tabular-nums', sizeTone)}
            title="HTML 体积：超过 60KB 警告，超过 80KB 不能发送（Gmail 超过 102KB 会截断邮件）"
          >
            HTML {formatBytes(p.sizeBytes)}
          </span>
        </div>
      </div>

      {/* 预览 */}
      <div className="mkt-scroll min-h-0 flex-1 overflow-auto overscroll-contain px-6 py-5">
        {p.dark !== 'off' && (
          <p className="mx-auto mb-2 text-center text-[11px] text-gray-500" style={{ width, maxWidth: '100%' }}>
            {p.dark === 'native'
              ? p.docDarkMode === 'auto'
                ? '按邮件自带的暗色样式显示（近似 Apple 邮件、iOS 邮件）；各客户端实际效果不同'
                : '邮件声明「始终浅色」，支持该声明的客户端（如 Apple 邮件）保持浅色；Gmail 等仍可能强制反色'
              : '强制反色为近似模拟（Gmail / Outlook 手机 App 的做法）；各客户端实际效果不同'}
          </p>
        )}
        <InboxPreview {...p.inbox} width={width} />
        {p.renderError ? (
          <div className="mx-auto rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700" style={{ width, maxWidth: '100%' }}>
            预览渲染失败：{p.renderError}
            <div className="mt-1 text-xs text-red-500">内容仍会自动保存；修正后预览会自动恢复</div>
          </div>
        ) : p.html ? (
          <div
            className={cn(
              'mx-auto overflow-hidden bg-white shadow-lg',
              p.device === 'mobile' ? 'rounded-[28px] border-[10px] border-gray-900' : 'rounded-md ring-1 ring-black/5'
            )}
            style={{ width: p.device === 'mobile' ? width + 20 : width, maxWidth: '100%', filter: p.dark === 'invert' ? DARK_FILTER : undefined }}
          >
            {p.device === 'mobile' && <div className="h-5 bg-gray-900" aria-hidden />}
            <PreviewFrame
              html={p.html}
              width={width}
              minHeight={320}
              onSelectBlock={p.onSelectBlock}
              focusBlockId={p.focusBlockId}
              focusToken={p.focusToken}
              extraCss={p.dark === 'invert' ? DARK_IMG_CSS : ''}
              rootClassName={p.dark === 'native' ? NATIVE_DARK_CLASS : ''}
            />
          </div>
        ) : (
          <div className="mx-auto h-80 animate-pulse rounded-md bg-white/70" style={{ width, maxWidth: '100%' }} />
        )}
        <p className="mx-auto mt-3 text-center text-[11px] text-gray-400" style={{ width, maxWidth: '100%' }}>
          点预览里的区块可在左侧直接编辑 · 链接在预览中不会跳转 · 页脚（退订、主体信息）由系统自动添加
        </p>
      </div>

      <IssuesPanel issues={p.issues} unavailable={p.lintUnavailable} onIssueClick={p.onIssueClick} />
    </div>
  )
}
