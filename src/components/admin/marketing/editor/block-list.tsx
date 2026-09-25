'use client'

/**
 * 左栏的区块列表：折叠成一行摘要，选中的展开属性表单；拖动手柄排序（framer-motion Reorder）、
 * 上移/下移/复制/删除；块与块之间、列表末尾可「＋ 添加区块」。
 *
 * 【拖动】Reorder 在拖动中会连续回调新顺序：这期间只改本地顺序（动画要用），松手才提交一次到文档，
 * 否则一次拖动会在撤销历史里留下十几步。拖动时所有表单收起，行高一致、拖起来不跳。
 * layout="position"：只对位置做动画，不对尺寸做（尺寸动画靠 scale 实现，展开表单时文字会被拉伸）。
 */
import { useEffect, useRef, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2, X } from 'lucide-react'
import type { Block, BlockType, DocSettings, EmailDoc } from '@/lib/marketing/types'
import { BLOCK_TYPE_LABEL, MAX_BLOCKS } from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { BLOCK_DESC, BLOCK_ICON, PALETTE_GROUPS, safeSummary } from './block-meta'
import { BlockForm } from './block-forms'
import { canDuplicate, hasCouponBlock } from './state'

export interface BlockIssueCount {
  errors: number
  warns: number
}

interface BlockListProps {
  doc: EmailDoc
  selectedId: string | null
  onSelect: (id: string | null) => void
  onBlockChange: (b: Block, key?: string) => void
  onReorder: (ids: string[]) => void
  onMove: (id: string, delta: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onInsert: (index: number, type: BlockType) => void
  issuesByBlock: Map<string, BlockIssueCount>
  /** 从预览点选时：展开并滚到该区块 */
  scrollRequest: { id: string; nonce: number } | null
  readOnly: boolean
}

/** 尊重系统「减弱动态效果」设置 */
function scrollBehavior(): ScrollBehavior {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  } catch {
    return 'auto'
  }
}

/* ============================== 区块面板 ============================== */

function BlockPalette({
  onPick,
  onClose,
  doc,
}: {
  onPick: (t: BlockType) => void
  onClose: () => void
  doc: EmailDoc
}) {
  const full = doc.blocks.length >= MAX_BLOCKS
  const hasCoupon = hasCouponBlock(doc)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  // 只在打开时滚到可见一次（父组件每次重渲染都会给新的 onClose，不能拿它当依赖反复滚动）
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div ref={ref} className="my-1.5 rounded-xl border border-primary-200 bg-white p-3 shadow-lg ring-4 ring-primary-50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">添加区块</span>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="关闭（Esc）">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {full ? (
        <p className="py-2 text-center text-xs text-amber-600">已达上限 {MAX_BLOCKS} 个区块</p>
      ) : (
        <div className="space-y-2.5">
          {PALETTE_GROUPS.map((g) => (
            <div key={g.title}>
              <div className="mb-1 text-[11px] font-medium text-gray-400">{g.title}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {g.types.map((t) => {
                  const Icon = BLOCK_ICON[t]
                  const disabled = t === 'coupon' && hasCoupon
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      title={disabled ? '每封邮件只能有一个优惠券区块' : BLOCK_DESC[t]}
                      onClick={() => onPick(t)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border border-gray-200 px-1 py-2 text-xs text-gray-700 transition-colors',
                        disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{BLOCK_TYPE_LABEL[t]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================== 行 ============================== */

function InsertZone({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  if (disabled) return <div className="h-2" />
  return (
    <div className="group/ins relative flex h-2 items-center">
      <button
        type="button"
        onClick={onClick}
        title="在这里插入区块"
        className="absolute inset-x-0 -top-1 z-10 flex h-4 items-center opacity-0 transition-opacity focus:opacity-100 group-hover/ins:opacity-100"
      >
        <span className="h-px flex-1 bg-primary-300" />
        <span className="mx-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-white shadow">
          <Plus className="h-3 w-3" />
        </span>
        <span className="h-px flex-1 bg-primary-300" />
      </button>
    </div>
  )
}

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'rounded p-1 text-gray-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30',
        danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-gray-100 hover:text-gray-700'
      )}
    >
      {children}
    </button>
  )
}

interface RowProps {
  block: Block
  index: number
  count: number
  doc: EmailDoc
  settings: DocSettings
  selected: boolean
  collapsed: boolean
  issues?: BlockIssueCount
  readOnly: boolean
  paletteHere: boolean
  onOpenPalette: () => void
  onClosePalette: () => void
  onPick: (t: BlockType) => void
  onSelect: (id: string | null) => void
  onBlockChange: (b: Block, key?: string) => void
  onMove: (id: string, delta: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onDragStart: () => void
  onDragEnd: () => void
  registerRef: (id: string, el: HTMLDivElement | null) => void
}

function BlockRow(p: RowProps) {
  const { block: b, selected, collapsed } = p
  const controls = useDragControls()
  const Icon = BLOCK_ICON[b.type]
  const open = selected && !collapsed
  const summary = safeSummary(b)
  return (
    <Reorder.Item
      as="div"
      value={b.id}
      dragListener={false}
      dragControls={controls}
      layout="position"
      onDragStart={p.onDragStart}
      onDragEnd={p.onDragEnd}
      className="relative"
      style={{ position: 'relative' }}
    >
      <InsertZone onClick={p.onOpenPalette} disabled={p.readOnly} />
      {p.paletteHere && <BlockPalette doc={p.doc} onPick={p.onPick} onClose={p.onClosePalette} />}
      <div
        ref={(el) => p.registerRef(b.id, el)}
        className={cn(
          'scroll-mt-3 rounded-lg border bg-white transition-shadow',
          selected ? 'border-primary-400 shadow-md ring-2 ring-primary-500/15' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        )}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={() => p.onSelect(selected ? null : b.id)}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              p.onSelect(selected ? null : b.id)
            }
          }}
          className="group flex h-11 cursor-pointer items-center gap-1.5 pl-1 pr-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          <span
            onPointerDown={(e) => {
              if (p.readOnly) return
              // 只在真正拖起来时（Reorder.Item 的 onDragStart）才收起表单：单击手柄不应该收起正在编辑的区块。
              // 拖动中行高变化由 framer 的布局投影补偿，被拖的块仍跟着指针走
              e.preventDefault()
              controls.start(e)
            }}
            onClick={(e) => e.stopPropagation()}
            title="按住拖动排序"
            className={cn(
              'flex h-8 w-5 shrink-0 touch-none items-center justify-center rounded text-gray-300',
              p.readOnly ? 'cursor-default' : 'cursor-grab hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing'
            )}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              selected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-gray-800" title={summary}>
            {summary}
          </span>
          {p.issues && (p.issues.errors > 0 || p.issues.warns > 0) && (
            <span
              title={`${p.issues.errors ? `${p.issues.errors} 个错误` : ''}${p.issues.errors && p.issues.warns ? '，' : ''}${p.issues.warns ? `${p.issues.warns} 个警告` : ''}`}
              className={cn('h-2 w-2 shrink-0 rounded-full', p.issues.errors ? 'bg-red-500' : 'bg-amber-400')}
            />
          )}
          {!p.readOnly && (
            <span className={cn('flex shrink-0 items-center transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100')}>
              <IconBtn title="上移（Alt+↑）" disabled={p.index === 0} onClick={() => p.onMove(b.id, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="下移（Alt+↓）" disabled={p.index === p.count - 1} onClick={() => p.onMove(b.id, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn
                title={b.type === 'coupon' ? '优惠券区块每封只能有一个' : '复制（Ctrl+D）'}
                disabled={!canDuplicate(p.doc, b)}
                onClick={() => p.onDuplicate(b.id)}
              >
                <Copy className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title={p.count <= 1 ? '至少保留一个区块' : '删除'} danger disabled={p.count <= 1} onClick={() => p.onDelete(b.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          )}
        </div>
        {open && (
          <div className="border-t border-gray-100 px-3 pb-3 pt-3" onClick={(e) => e.stopPropagation()}>
            <BlockForm block={b} onChange={p.onBlockChange} settings={p.settings} />
          </div>
        )}
      </div>
    </Reorder.Item>
  )
}

/* ============================== 列表 ============================== */

export function BlockList(props: BlockListProps) {
  const { doc, selectedId, readOnly } = props
  const [order, setOrder] = useState<string[] | null>(null)
  const orderRef = useRef<string[] | null>(null)
  const [dragging, setDragging] = useState(false)
  const [paletteAt, setPaletteAt] = useState<number | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

  const docIds = doc.blocks.map((b) => b.id)
  // 拖动期间文档若被别的操作改了（极少见），本地顺序作废
  const ids = order && order.length === docIds.length && order.every((id) => docIds.includes(id)) ? order : docIds
  const byId = new Map(doc.blocks.map((b) => [b.id, b]))

  const registerRef = (id: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }

  useEffect(() => {
    const req = props.scrollRequest
    if (!req) return
    const raf = requestAnimationFrame(() => {
      rowRefs.current.get(req.id)?.scrollIntoView({ block: 'start', behavior: scrollBehavior() })
    })
    return () => cancelAnimationFrame(raf)
  }, [props.scrollRequest])

  const endDrag = () => {
    const o = orderRef.current
    orderRef.current = null
    setOrder(null)
    setDragging(false)
    if (o) props.onReorder(o)
  }

  const pick = (index: number) => (t: BlockType) => {
    setPaletteAt(null)
    props.onInsert(index, t)
  }

  return (
    <div>
      <Reorder.Group
        as="div"
        axis="y"
        values={ids}
        onReorder={(next: string[]) => {
          orderRef.current = next
          setOrder(next)
        }}
      >
        {ids.map((id, i) => {
          const b = byId.get(id)
          if (!b) return null
          return (
            <BlockRow
              key={id}
              block={b}
              index={i}
              count={ids.length}
              doc={doc}
              settings={doc.settings}
              selected={id === selectedId}
              collapsed={dragging}
              issues={props.issuesByBlock.get(id)}
              readOnly={readOnly}
              paletteHere={paletteAt === i && !dragging}
              onOpenPalette={() => setPaletteAt(i)}
              onClosePalette={() => setPaletteAt(null)}
              onPick={pick(i)}
              onSelect={props.onSelect}
              onBlockChange={props.onBlockChange}
              onMove={props.onMove}
              onDuplicate={props.onDuplicate}
              onDelete={props.onDelete}
              onDragStart={() => setDragging(true)}
              onDragEnd={endDrag}
              registerRef={registerRef}
            />
          )
        })}
      </Reorder.Group>

      {!readOnly && (
        <div className="mt-3">
          {paletteAt === ids.length && !dragging ? (
            <BlockPalette doc={doc} onPick={pick(ids.length)} onClose={() => setPaletteAt(null)} />
          ) : (
            <button
              type="button"
              disabled={doc.blocks.length >= MAX_BLOCKS}
              onClick={() => setPaletteAt(ids.length)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {doc.blocks.length >= MAX_BLOCKS ? `已达上限 ${MAX_BLOCKS} 个区块` : '添加区块'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
