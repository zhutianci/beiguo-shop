'use client'

/**
 * 富文本字段（TipTap v3，锁定 3.31.3）。
 *
 * 【输出必须过严格 zod】TipTap 的 getJSON() 带着各种 attrs（link 的 target/rel/class、textStyle 的其它键…），
 * 粘贴进来的网页/Word 内容还可能有嵌套列表、rgb() 颜色。每次变更都先 normalizeRichDoc() 洗成白名单形状，
 * 再写进区块 —— 否则一次粘贴就会让整篇自动保存 400、丢稿（设计文档第 16 节「TipTap 输出过不了严格 zod」）。
 *
 * 【StarterKit 裁剪】标题/引用/代码/分割线都关掉：邮件渲染器不支持，留着只会让作者做出发不出去的格式。
 * 标题区块（variant=heading）再关掉列表。trailingNode 也关：它会在列表后自动补空段落，渲染出来多一截空白。
 *
 * 【与文档级撤销的关系】焦点在这里时 Ctrl+Z 由 TipTap 自己处理（只撤这个字段）；
 * 焦点在外面时由编辑器的文档级历史处理，内容从外部变化后这里用 setContent 同步（不触发 onUpdate，避免回环）。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import {
  Baseline,
  Bold,
  ChevronDown,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Unlink,
  UserRound,
} from 'lucide-react'
import type { RichDoc } from '@/lib/marketing/types'
import { MERGE_TAG_LABEL } from '@/lib/marketing/types'
import { normalizeRichDoc } from '@/lib/marketing/richtext'
import { cn } from '@/lib/utils'
import { useEditorCtx } from './editor-context'
import { ColorPalette, useDismiss } from './fields'
import { linkProblem } from './util'

export interface RichTextFieldProps {
  value: RichDoc
  onChange: (doc: RichDoc) => void
  /** full：正文（含列表）；heading：标题（无列表、字号大）；compact：提示框 */
  variant?: 'full' | 'heading' | 'compact'
  placeholder?: string
  label?: React.ReactNode
  autoFocus?: boolean
}

/** 单块文字上限 5000 字（设计文档 7.1），超过 4000 开始显示计数 */
const TEXT_LIMIT = 5000

const VARIABLES: { text: string; label: string }[] = [
  { text: '{{nickname|朋友}}', label: `${MERGE_TAG_LABEL.nickname}（没有昵称时显示「朋友」）` },
  { text: '{{coupon_expires}}', label: `${MERGE_TAG_LABEL.coupon_expires}（直发券到期日）` },
  { text: '{{email}}', label: MERGE_TAG_LABEL.email },
]

let warnedNormalize = false

function toRich(raw: JSONContent): RichDoc {
  try {
    return normalizeRichDoc(raw)
  } catch (e) {
    // 规范化器由渲染器模块实现；万一抛错，宁可原样保存（服务端还会再校验）也不丢用户刚输入的字
    if (!warnedNormalize) {
      warnedNormalize = true
      console.warn('[marketing-editor] normalizeRichDoc 失败，暂存原始内容', e instanceof Error ? e.message : e)
    }
    return raw as unknown as RichDoc
  }
}

function ToolButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // mousedown 时阻止默认：不让按钮抢走编辑区的焦点与选区
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 min-w-[26px] items-center justify-center rounded px-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900',
        active && 'bg-primary-50 text-primary-700 hover:bg-primary-100',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {children}
    </button>
  )
}

export function RichTextField({ value, onChange, variant = 'full', placeholder, label, autoFocus }: RichTextFieldProps) {
  const { readOnly, pushRecentColor } = useEditorCtx()
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const lastJsonRef = useRef<string>(JSON.stringify(value))
  const openLinkRef = useRef<() => void>(() => {})
  const lists = variant !== 'heading'

  // 扩展只在创建时读取一次（variant 对一个实例是固定的）
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        trailingNode: false,
        ...(lists ? {} : { bulletList: false, orderedList: false, listItem: false, listKeymap: false }),
        link: {
          openOnClick: false,
          autolink: false,
          protocols: ['http', 'https', 'mailto'],
          defaultProtocol: 'https',
          // 编辑器里不需要 target/rel；即使带上，normalizeRichDoc 也会丢掉
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      TextStyle,
      Color,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const editor = useEditor({
    extensions,
    content: value as unknown as JSONContent,
    immediatelyRender: false,
    editable: !readOnly,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: { class: 'mkt-rte-content', spellcheck: 'false' },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          openLinkRef.current()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      const doc = toRich(ed.getJSON())
      const j = JSON.stringify(doc)
      if (j === lastJsonRef.current) return
      lastJsonRef.current = j
      onChangeRef.current(doc)
    },
  })

  // 外部改了内容（文档级撤销/重做、冲突时换成服务器版本）→ 同步进编辑器，不回调 onChange
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const j = JSON.stringify(value)
    if (j === lastJsonRef.current) return
    lastJsonRef.current = j
    // 不进 TipTap 自己的撤销栈：否则在框里按 Ctrl+Z 会把文档级撤销「撤回去」，两套历史互相打架
    editor
      .chain()
      .setMeta('addToHistory', false)
      .setContent(value as unknown as JSONContent, { emitUpdate: false })
      .run()
  }, [editor, value])

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!readOnly)
  }, [editor, readOnly])

  const st = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            link: e.isActive('link'),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            color: ((e.getAttributes('textStyle') as { color?: string | null }).color as string | null | undefined) || null,
            empty: e.isEmpty,
            focused: e.isFocused,
            chars: e.state.doc.textContent.length,
          }
        : null,
  })

  /* ---------- 链接 ---------- */
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const [linkErr, setLinkErr] = useState<string | null>(null)
  const linkRef = useRef<HTMLDivElement>(null)
  useDismiss(linkOpen, () => setLinkOpen(false), linkRef)

  openLinkRef.current = () => {
    if (!editor || readOnly) return
    const cur = (editor.getAttributes('link') as { href?: string }).href || ''
    setLinkHref(cur)
    setLinkErr(null)
    setLinkOpen(true)
  }

  const applyLink = () => {
    if (!editor) return
    const href = linkHref.trim()
    const problem = linkProblem(href, { required: true })
    if (problem) {
      setLinkErr(problem)
      return
    }
    const { empty } = editor.state.selection
    if (empty && !editor.isActive('link')) {
      // 没选中文字：把网址本身作为链接文字插入
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
        .run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkOpen(false)
  }

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
  }

  /* ---------- 颜色 / 变量菜单 ---------- */
  const [colorOpen, setColorOpen] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  useDismiss(colorOpen, () => setColorOpen(false), colorRef)
  const [varOpen, setVarOpen] = useState(false)
  const varRef = useRef<HTMLDivElement>(null)
  useDismiss(varOpen, () => setVarOpen(false), varRef)

  const insertVar = (text: string) => {
    editor?.chain().focus().insertContent({ type: 'text', text }).run()
    setVarOpen(false)
  }

  const disabled = !editor || readOnly
  const chars = st?.chars ?? 0

  return (
    <div className="min-w-0">
      {label && <div className="mb-1 text-xs font-medium text-gray-600">{label}</div>}
      <div
        className={cn(
          'mkt-rte relative rounded-md border border-gray-300 bg-white transition-shadow',
          st?.focused && 'border-primary-500 ring-2 ring-primary-500/20'
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-1 py-1">
          <ToolButton title="加粗（Ctrl+B）" active={st?.bold} disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton title="斜体（Ctrl+I）" active={st?.italic} disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            title="下划线（Ctrl+U）"
            active={st?.underline}
            disabled={disabled}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton title="删除线" active={st?.strike} disabled={disabled} onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolButton>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />

          <div className="relative" ref={linkRef}>
            <ToolButton title="链接（Ctrl+K）" active={st?.link} disabled={disabled} onClick={() => (linkOpen ? setLinkOpen(false) : openLinkRef.current())}>
              <Link2 className="h-3.5 w-3.5" />
            </ToolButton>
            {linkOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-[300px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
                <div className="mb-1.5 text-xs font-medium text-gray-600">链接地址</div>
                <input
                  autoFocus
                  value={linkHref}
                  onChange={(e) => {
                    setLinkHref(e.target.value)
                    setLinkErr(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyLink()
                    }
                  }}
                  placeholder="https://… / /products/1 / mailto:…"
                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                {linkErr ? (
                  <p className="mt-1 text-xs text-red-600">{linkErr}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">站内页面写路径即可，发送时会自动补全并加统计参数</p>
                )}
                <div className="mt-2.5 flex items-center justify-between">
                  {st?.link ? (
                    <button type="button" onClick={removeLink} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                      <Unlink className="h-3.5 w-3.5" />
                      移除链接
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLinkOpen(false)}
                      className="rounded-md px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={applyLink}
                      className="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700"
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={colorRef}>
            <ToolButton title="文字颜色" active={!!st?.color} disabled={disabled} onClick={() => setColorOpen((o) => !o)}>
              <span className="flex flex-col items-center">
                <Baseline className="h-3.5 w-3.5" />
                <span className="-mt-0.5 h-[3px] w-3.5 rounded-sm" style={{ backgroundColor: st?.color || '#9ca3af' }} />
              </span>
            </ToolButton>
            {colorOpen && (
              <div
                className="absolute left-0 top-full z-30 mt-1 w-[248px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
                onMouseDown={(e) => {
                  // 点色块不抢编辑区焦点（原生取色器除外，它需要焦点）
                  if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault()
                }}
              >
                <ColorPalette
                  value={st?.color}
                  onPick={(c) => {
                    editor?.chain().focus().setColor(c).run()
                    pushRecentColor(c)
                    setColorOpen(false)
                  }}
                />
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={st?.color || '#333333'}
                    onChange={(e) => editor?.chain().setColor(e.target.value.toLowerCase()).run()}
                    onBlur={(e) => pushRecentColor(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                    aria-label="自定义颜色"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      editor?.chain().focus().unsetColor().run()
                      setColorOpen(false)
                    }}
                    className="flex-1 rounded-md border border-gray-200 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    默认颜色
                  </button>
                </div>
              </div>
            )}
          </div>

          {lists && (
            <>
              <span className="mx-0.5 h-4 w-px bg-gray-200" />
              <ToolButton title="无序列表" active={st?.bullet} disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                <List className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                title="有序列表"
                active={st?.ordered}
                disabled={disabled}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolButton>
            </>
          )}
          <span className="mx-0.5 h-4 w-px bg-gray-200" />

          <div className="relative flex items-center" ref={varRef}>
            <button
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertVar(VARIABLES[0].text)}
              title="插入收件人昵称：{{nickname|朋友}}"
              className="inline-flex h-7 items-center gap-1 rounded-l px-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
            >
              <UserRound className="h-3.5 w-3.5" />
              昵称
            </button>
            <button
              type="button"
              disabled={disabled}
              title="更多变量"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVarOpen((o) => !o)}
              className="inline-flex h-7 items-center rounded-r px-0.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            {varOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-[240px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
                {VARIABLES.map((v) => (
                  <button
                    key={v.text}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertVar(v.text)}
                    className="block w-full px-3 py-1.5 text-left hover:bg-gray-50"
                  >
                    <div className="font-mono text-xs text-primary-700">{v.text}</div>
                    <div className="text-[11px] text-gray-500">{v.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <ToolButton
            title="清除格式"
            disabled={disabled}
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </ToolButton>
        </div>

        <div className="relative">
          {st?.empty && placeholder && (
            <div className="pointer-events-none absolute left-3 top-2 text-sm text-gray-400">{placeholder}</div>
          )}
          <EditorContent
            editor={editor}
            className={cn(
              'mkt-rte-body px-3 py-2 text-gray-800',
              variant === 'heading' ? 'text-base font-semibold' : 'text-sm',
              variant === 'full' ? 'min-h-[96px]' : 'min-h-[44px]'
            )}
          />
          {!editor && <div className="px-3 py-2 text-sm text-gray-400">加载编辑器…</div>}
        </div>
      </div>
      {chars > TEXT_LIMIT * 0.8 && (
        <p className={cn('mt-1 text-right text-xs tabular-nums', chars > TEXT_LIMIT ? 'text-red-600' : 'text-amber-600')}>
          {chars}/{TEXT_LIMIT} 字{chars > TEXT_LIMIT ? '（超出上限，保存会失败）' : ''}
        </p>
      )}
    </div>
  )
}

export default RichTextField
