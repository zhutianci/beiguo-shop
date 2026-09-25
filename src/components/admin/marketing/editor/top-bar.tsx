'use client'

/**
 * 编辑器顶栏：返回、活动名（行内编辑）、分类、保存状态、撤销/重做、外部动作插槽、完成；
 * 第二行：邮件主题（带强制前缀与字数）与预览文字。
 */
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Cloud, CloudOff, Loader2, Lock, Redo2, TriangleAlert, Undo2, UserRound } from 'lucide-react'
import type { Topic } from '@/lib/marketing/types'
import { TOPICS, TOPIC_LABEL } from '@/lib/marketing/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SaveStatus } from './use-autosave'
import { estimateSubjectLength } from './util'

/** 主题建议长度（lint 警告线）与上限（按 12 字昵称估算、含前缀） */
const SUBJECT_WARN = 30
const SUBJECT_MAX = 100

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (status.kind !== 'retrying' && status.kind !== 'saved') return
    const t = setInterval(() => tick((n) => n + 1), status.kind === 'retrying' ? 1000 : 30000)
    return () => clearInterval(t)
  }, [status.kind])

  const base = 'inline-flex h-8 max-w-[260px] items-center gap-1.5 rounded-md px-2 text-xs'
  switch (status.kind) {
    case 'saved': {
      let when = ''
      if (status.at) {
        const s = Math.round((Date.now() - status.at) / 1000)
        when = s < 10 ? '刚刚' : s < 60 ? `${s} 秒前` : `${Math.floor(s / 60)} 分钟前`
      }
      return (
        <span className={cn(base, 'text-gray-500')} title={when ? `${when}保存` : '内容与服务器一致'}>
          <Cloud className="h-3.5 w-3.5" />
          已保存
        </span>
      )
    }
    case 'dirty':
      return (
        <button type="button" onClick={onRetry} className={cn(base, 'text-amber-700 hover:bg-amber-50')} title="有未保存的修改，1.5 秒后自动保存（Ctrl+S 立即保存）">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          未保存
        </button>
      )
    case 'saving':
      return (
        <span className={cn(base, 'text-gray-500')}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          保存中…
        </span>
      )
    case 'retrying': {
      const s = Math.max(0, Math.ceil((status.nextAt - Date.now()) / 1000))
      return (
        <button type="button" onClick={onRetry} className={cn(base, 'text-amber-700 hover:bg-amber-50')} title="点击立即重试">
          <CloudOff className="h-3.5 w-3.5" />
          <span className="truncate">网络异常，{s} 秒后重试</span>
        </button>
      )
    }
    case 'error':
      return (
        <button type="button" onClick={onRetry} className={cn(base, 'bg-red-50 text-red-700 hover:bg-red-100')} title={`${status.message}（点击重试）`}>
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">保存失败：{status.message}</span>
        </button>
      )
    case 'conflict':
      return (
        <span className={cn(base, 'bg-red-50 text-red-700')}>
          <TriangleAlert className="h-3.5 w-3.5" />
          保存冲突
        </span>
      )
    case 'locked':
      return (
        <span className={cn(base, 'bg-gray-100 text-gray-600')} title={status.message}>
          <Lock className="h-3.5 w-3.5" />
          <span className="truncate">{status.message}</span>
        </span>
      )
  }
}

function IconButton({ title, disabled, onClick, children }: { title: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export interface TopBarProps {
  name: string
  onName: (v: string) => void
  topic: Topic
  onTopic: (t: Topic) => void
  subject: string
  onSubject: (v: string) => void
  preheader: string
  onPreheader: (v: string) => void
  subjectPrefix: string
  status: SaveStatus
  onSaveNow: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  actions?: React.ReactNode
  onClose: () => void
  closing: boolean
  readOnly: boolean
}

export function TopBar(p: TopBarProps) {
  const subjectRef = useRef<HTMLInputElement>(null)
  const n = estimateSubjectLength(p.subject)
  const total = Array.from(p.subjectPrefix).length + n
  const subjectTone = total > SUBJECT_MAX ? 'text-red-600' : n > SUBJECT_WARN ? 'text-amber-600' : 'text-gray-400'

  const insertNickname = () => {
    const el = subjectRef.current
    const tag = '{{nickname|朋友}}'
    const v = p.subject
    const start = el?.selectionStart ?? v.length
    const end = el?.selectionEnd ?? v.length
    const next = (v.slice(0, start) + tag + v.slice(end)).slice(0, 200)
    p.onSubject(next)
    requestAnimationFrame(() => {
      el?.focus()
      const pos = Math.min(next.length, start + tag.length)
      el?.setSelectionRange(pos, pos)
    })
  }

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center gap-2 px-3">
        <Button variant="ghost" size="sm" onClick={p.onClose} disabled={p.closing} className="gap-1 px-2 text-gray-600" title="保存并返回">
          {p.closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
          返回
        </Button>
        <span className="h-6 w-px bg-gray-200" />
        <input
          value={p.name}
          onChange={(e) => p.onName(e.target.value.slice(0, 100))}
          onBlur={() => {
            if (!p.name.trim()) p.onName('未命名活动')
          }}
          disabled={p.readOnly}
          placeholder="活动名称（仅后台可见）"
          title="活动名称只在后台显示，不会出现在邮件、券名或统计参数里"
          className="h-9 w-[min(320px,28vw)] min-w-[140px] rounded-md border border-transparent px-2 text-base font-semibold text-gray-900 hover:border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          分类
          <select
            value={p.topic}
            disabled={p.readOnly}
            onChange={(e) => p.onTopic(e.target.value as Topic)}
            className="h-8 rounded-md border border-gray-300 bg-white py-0 pl-2 pr-7 text-sm text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            title="收件人可按分类退订；含直发券的邮件必须是「优惠活动」"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {TOPIC_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex-1" />

        <SaveIndicator status={p.status} onRetry={p.onSaveNow} />
        <div className="flex items-center">
          <IconButton title="撤销（Ctrl+Z）" disabled={!p.canUndo || p.readOnly} onClick={p.onUndo}>
            <Undo2 className="h-4 w-4" />
          </IconButton>
          <IconButton title="重做（Ctrl+Shift+Z / Ctrl+Y）" disabled={!p.canRedo || p.readOnly} onClick={p.onRedo}>
            <Redo2 className="h-4 w-4" />
          </IconButton>
        </div>
        {p.actions && (
          <>
            <span className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">{p.actions}</div>
          </>
        )}
        <Button size="sm" onClick={p.onClose} disabled={p.closing} loading={p.closing}>
          完成
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-gray-100 px-4 py-2">
        <div className="min-w-[320px] flex-[3]">
          <div className="flex items-center gap-2">
            <span className="w-[52px] shrink-0 text-xs font-medium text-gray-500">邮件主题</span>
            <div className="flex min-w-0 flex-1 items-center rounded-md border border-gray-300 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
              <span
                className="ml-1 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500"
                title="广告邮件主题前必须标注（互联网电子邮件服务管理办法 §13），发送时自动加上，不能去掉"
              >
                {p.subjectPrefix}
              </span>
              <input
                ref={subjectRef}
                value={p.subject}
                disabled={p.readOnly}
                onChange={(e) => p.onSubject(e.target.value.slice(0, 200))}
                placeholder="例：{{nickname|朋友}}，国庆 ChatGPT Plus 限时 8 折"
                className="h-8 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-gray-900 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={insertNickname}
                disabled={p.readOnly}
                title="插入收件人昵称 {{nickname|朋友}}"
                className="mr-1 inline-flex h-6 shrink-0 items-center gap-1 rounded px-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <UserRound className="h-3.5 w-3.5" />
                昵称
              </button>
            </div>
            <span
              className={cn('w-[64px] shrink-0 text-right text-xs tabular-nums', subjectTone)}
              title={`按昵称 12 字估算：主题 ${n} 字，加前缀共 ${total} 字。建议 ≤${SUBJECT_WARN} 字（手机收件箱只显示前 20 字左右），上限 ${SUBJECT_MAX}`}
            >
              {n} 字{n > SUBJECT_WARN ? ' · 偏长' : ''}
            </span>
          </div>
        </div>
        <div className="min-w-[260px] flex-[2]">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-gray-500" title="收件箱里主题后面显示的一行灰字">
              预览文字
            </span>
            <input
              value={p.preheader}
              disabled={p.readOnly}
              onChange={(e) => p.onPreheader(e.target.value.slice(0, 200))}
              placeholder="收件箱里主题后面的一行灰字，建议 30–80 字"
              className="h-8 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {p.preheader.length > 150 && <span className="shrink-0 text-xs tabular-nums text-gray-400">{p.preheader.length}/200</span>}
          </div>
        </div>
      </div>
    </header>
  )
}
