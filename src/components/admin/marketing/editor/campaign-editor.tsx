'use client'

/**
 * 营销邮件全屏编辑器（设计文档 7.3）。
 *
 * 布局：顶栏（返回 / 活动名 / 分类 / 保存状态 / 撤销重做 / 外部动作 / 完成 + 主题与预览文字）
 *      左栏 ~440px（区块列表 + 属性表单 | 全局样式）  右栏（预览工具条 + 实时预览 + 检查结果）
 *
 * 【不能改的约束】
 * - 覆盖层是 .admin-area 里的 fixed inset-0 z-50，不用 portal：portal 会落到 body 下的暗色全局样式里
 * - 预览在浏览器里用同构渲染器 renderEmail（mode='preview'）现算，所见即所发；iframe 只给 allow-same-origin
 * - 自动保存带 baseUpdatedAt；测试/检查/发送前调用方要先 flush()（renderActions 里拿得到）
 *
 * 页面用 next/dynamic({ ssr:false }) 加载本组件：TipTap 与 framer-motion 只进编辑器这一个包。
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Blocks, Lock, Paintbrush, RotateCcw, TriangleAlert, Undo2, X } from 'lucide-react'
import type {
  Block,
  BlockOf,
  BlockType,
  CampaignDetail,
  CatalogResponse,
  CouponView,
  DocSettings,
  EmailDoc,
  LintIssue,
  MergeTag,
  ProductCard,
  RenderCtx,
  RenderResult,
  Topic,
} from '@/lib/marketing/types'
import { BLOCK_ID_RE, CAMPAIGN_STATUS_LABEL, MAX_BLOCKS } from '@/lib/marketing/types'
import { DEFAULT_SETTINGS, applyTheme, couponViewFor, renderEmail } from '@/lib/marketing/render'
import { newBlock } from '@/lib/marketing/presets'
import { lintContent, lintRendered, safeNickname } from '@/lib/marketing/lint'
import { cn } from '@/lib/utils'
import { BlockList, type BlockIssueCount } from './block-list'
import { safeSummary } from './block-meta'
import { ConfirmDialog, ConflictDialog } from './dialogs'
import { DocSettingsPanel } from './doc-settings-panel'
import { EditorProvider, useCatalog, useMarketingConfig, useProductMap, useRecentColors, type EditorContextValue } from './editor-context'
import { EditorStyles } from './editor-styles'
import { PreviewPane, type DarkSim, type Device } from './preview-pane'
import {
  cloneBlock,
  draftFromCampaign,
  findBlock,
  historyReducer,
  initHistory,
  insertBlock,
  moveBlock,
  remapThemeColors,
  removeBlock,
  reorderBlocks,
  uniqueBlockId,
  updateBlock,
  type DraftState,
} from './state'
import { TopBar } from './top-bar'
import { useAutosave, type SaveStatus } from './use-autosave'
import { applySampleVars, isEditableTarget, sampleCouponExpires } from './util'

export interface CampaignEditorProps {
  /** 必须是草稿（DRAFT）；不是草稿时只读展示 */
  campaign: CampaignDetail
  /** 每次保存成功后回调（含冲突时选择「使用服务器版本」） */
  onSaved?: (c: CampaignDetail) => void
  /** 关闭全屏编辑器（编辑器内部会先 flush 未保存的内容） */
  onClose: () => void
  /** 顶栏额外按钮（例如「发测试」）。点之前请先 await flush() */
  renderActions?: (api: { flush: () => Promise<CampaignDetail | null>; dirty: boolean; saving: boolean }) => React.ReactNode
  /** 「以某用户预览」的候选（受众样本） */
  previewUsers?: { id: number; email: string; nickname: string | null }[]
}

/* ============================== 小工具 ============================== */

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

type RenderOutcome = { ok: true; result: RenderResult } | { ok: false; error: string }

function tryRender(doc: EmailDoc, ctx: RenderCtx): RenderOutcome {
  try {
    const result = renderEmail(doc, ctx)
    if (!result || typeof result.html !== 'string') return { ok: false, error: '渲染器没有返回内容' }
    return { ok: true, result }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** 文档里第一个券区块的展示数据（与服务端快照同一个 couponViewFor，口径一致） */
function couponFor(doc: EmailDoc, origin: string, catalog: CatalogResponse, productMap: Map<number, ProductCard>): CouponView | null {
  const b = doc.blocks.find((x): x is BlockOf<'coupon'> => x.type === 'coupon')
  if (!b) return null
  try {
    if (b.mode === 'grant') {
      const names = (b.grant?.productIds || []).map((id) => productMap.get(id)?.name).filter((n): n is string => !!n)
      return couponViewFor(b, origin, { productNames: names })
    }
    const c = b.claimCode ? catalog.coupons.find((x) => x.code === b.claimCode) : undefined
    return couponViewFor(b, origin, {
      claim: c ? { code: c.code, kind: c.kind, discount: c.discount, minAmount: c.minAmount, endAt: c.endAt } : null,
      productNames: [],
    })
  } catch {
    return null
  }
}

/** 预览 HTML 里的 data-bid 是编辑器专用标记，扫禁发词前去掉（随机 id 里可能恰好含 qq/vx 之类的字母组合） */
function stripPreviewMarkers(html: string): string {
  return html.replace(/\sdata-bid="[^"]*"/g, '')
}

/**
 * 合并两路检查结果。成品扫描（lintRendered）与内容检查（lintContent）会对同一个问题各报一次
 * （例如正文里写了禁发词：内容检查带区块定位，成品扫描只说「邮件正文含…」）。
 * 这几类代码内容检查已经报了，就不再显示成品扫描那条；内容检查没报的（来自商品文字、页脚配置）照常显示。
 */
const OVERLAP_CODES = new Set(['BANNED_WORD', 'ABSOLUTE_TERM', 'ABSOLUTE_WARN', 'TOO_MANY_IMAGES'])

function mergeIssues(content: LintIssue[], rendered: LintIssue[]): LintIssue[] {
  const contentCodes = new Set(content.map((i) => i?.code))
  const seen = new Set<string>()
  const out: LintIssue[] = []
  const push = (i: LintIssue) => {
    if (!i || typeof i.message !== 'string') return
    const k = `${i.level}|${i.code}|${i.blockId || ''}|${i.message}`
    if (seen.has(k)) return
    seen.add(k)
    out.push(i)
  }
  content.forEach(push)
  for (const i of rendered) if (!(OVERLAP_CODES.has(i?.code) && contentCodes.has(i.code))) push(i)
  return out
}

function safeNick(raw: string | null): string | undefined {
  if (!raw) return undefined
  try {
    const v = safeNickname(raw, '')
    return v || undefined
  } catch {
    return undefined
  }
}

/** 服务端给的 doc 万一不完整（旧数据/手工改库），补成能编辑的形状，别让整个编辑器白屏 */
function sanitizeCampaign(c: CampaignDetail): CampaignDetail {
  const doc = c.doc as Partial<EmailDoc> | null | undefined
  if (doc && Array.isArray(doc.blocks) && doc.settings) return c
  return {
    ...c,
    doc: {
      v: 1,
      settings: { ...DEFAULT_SETTINGS, ...(doc?.settings || {}) } as DocSettings,
      blocks: Array.isArray(doc?.blocks) ? (doc!.blocks as Block[]) : [],
    },
  }
}

type Toast =
  | { id: number; kind: 'deleted'; block: Block; index: number }
  | { id: number; kind: 'message'; text: string; tone: 'info' | 'error' }

/* ============================== 组件 ============================== */

export default function CampaignEditor(props: CampaignEditorProps) {
  // 换了活动就整个重建（历史、保存状态都属于某一个活动）
  return <EditorInner key={props.campaign.id} {...props} />
}

function EditorInner({ campaign: rawCampaign, onSaved, onClose, renderActions, previewUsers = [] }: CampaignEditorProps) {
  const campaign = useMemo(() => sanitizeCampaign(rawCampaign), [rawCampaign])
  // 只读：只看首次打开时的状态（之后父组件传入的新对象不改变编辑模式；保存 409 会切到「锁定」）
  const [readOnly] = useState(() => rawCampaign.status !== 'DRAFT')

  const [hist, dispatch] = useReducer(historyReducer, campaign, (c: CampaignDetail) => initHistory(draftFromCampaign(c)))
  const draft = hist.present
  const draftRef = useRef(draft)
  draftRef.current = draft

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId
  const [tab, setTab] = useState<'blocks' | 'style'>('blocks')
  const [scrollReq, setScrollReq] = useState<{ id: string; nonce: number } | null>(null)
  const [focus, setFocus] = useState<{ id: string | null; token: number }>({ id: null, token: 0 })
  const [device, setDevice] = useState<Device>('desktop')
  const [dark, setDark] = useState<DarkSim>('off')
  const [imagesOff, setImagesOff] = useState(false)
  const [previewUserId, setPreviewUserId] = useState<number | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [closing, setClosing] = useState(false)
  const [confirmClose, setConfirmClose] = useState<string | null>(null)

  const [recentColors, pushRecentColor] = useRecentColors()
  const { catalog, state: catalogState, reload: reloadCatalog } = useCatalog()
  const productMap = useProductMap(catalog)
  const cfg = useMarketingConfig()
  const subjectPrefix = cfg.footer.subjectPrefix || '(AD)'

  const autosave = useAutosave({ campaign, draft, enabled: !readOnly, onSaved })
  // flush / getStatus 是稳定引用（useCallback），回调与快捷键监听依赖它们而不是每次渲染都变的 autosave 对象
  const { flush, getStatus } = autosave
  const locked = readOnly || autosave.status.kind === 'locked'

  /* ---------- 改动入口（全部经过历史栈） ---------- */

  const update = useCallback((fn: (d: DraftState) => DraftState, key?: string) => {
    dispatch({ type: 'update', fn, key, now: Date.now() })
  }, [])
  const updateDoc = useCallback(
    (fn: (doc: EmailDoc) => EmailDoc, key?: string) =>
      update((d) => {
        const nd = fn(d.doc)
        return nd === d.doc ? d : { ...d, doc: nd }
      }, key),
    [update]
  )

  const notify = useCallback((text: string, tone: 'info' | 'error' = 'info') => {
    setToast({ id: Date.now(), kind: 'message', text, tone })
  }, [])

  // 提示条自动消失（删除提示给 6 秒反悔时间）
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast((cur) => (cur && cur.id === toast.id ? null : cur)), toast.kind === 'deleted' ? 6000 : 4000)
    return () => clearTimeout(t)
  }, [toast])

  const selectFromList = useCallback((id: string | null) => {
    setSelectedId(id)
    if (id) setFocus((f) => ({ id, token: f.token + 1 }))
  }, [])

  const selectFromPreview = useCallback((id: string) => {
    if (!findBlock(draftRef.current.doc, id)) return
    setTab('blocks')
    setSelectedId(id)
    setScrollReq({ id, nonce: Date.now() })
  }, [])

  const revealBlock = useCallback((id: string) => {
    if (!findBlock(draftRef.current.doc, id)) return
    setTab('blocks')
    setSelectedId(id)
    setScrollReq({ id, nonce: Date.now() })
    setFocus((f) => ({ id, token: f.token + 1 }))
  }, [])

  // 撤销/重做后选中的块可能已不存在
  useEffect(() => {
    if (selectedId && !findBlock(draft.doc, selectedId)) setSelectedId(null)
  }, [draft.doc, selectedId])

  const onBlockChange = useCallback(
    (b: Block, key?: string) => updateDoc((doc) => updateBlock(doc, b.id, () => b), key),
    [updateDoc]
  )

  const onMove = useCallback(
    (id: string, delta: number) => {
      updateDoc((doc) => moveBlock(doc, id, delta))
      setFocus((f) => ({ id, token: f.token + 1 }))
    },
    [updateDoc]
  )

  const onReorder = useCallback((ids: string[]) => updateDoc((doc) => reorderBlocks(doc, ids)), [updateDoc])

  const onDuplicate = useCallback(
    (id: string) => {
      const doc = draftRef.current.doc
      const src = findBlock(doc, id)
      if (!src) return
      if (src.type === 'coupon') return notify('每封邮件只能有一个优惠券区块', 'error')
      if (doc.blocks.length >= MAX_BLOCKS) return notify(`最多 ${MAX_BLOCKS} 个区块`, 'error')
      const newId = uniqueBlockId(doc)
      updateDoc((d) => {
        const i = d.blocks.findIndex((b) => b.id === id)
        if (i < 0 || d.blocks.some((b) => b.id === newId)) return d
        return insertBlock(d, i + 1, cloneBlock(d.blocks[i], newId))
      })
      setSelectedId(newId)
      setScrollReq({ id: newId, nonce: Date.now() })
      setFocus((f) => ({ id: newId, token: f.token + 1 }))
    },
    [updateDoc, notify]
  )

  const onDelete = useCallback(
    (id: string) => {
      const doc = draftRef.current.doc
      if (doc.blocks.length <= 1) return notify('至少保留一个区块', 'error')
      const { removed, index } = removeBlock(doc, id)
      if (!removed) return
      updateDoc((d) => removeBlock(d, id).doc)
      if (selectedRef.current === id) setSelectedId(null)
      setToast({ id: Date.now(), kind: 'deleted', block: removed, index })
    },
    [updateDoc, notify]
  )

  const undoDelete = useCallback(
    (block: Block, index: number) => {
      setToast(null)
      // 用户可能已经 Ctrl+Z 恢复过了：已存在就不再插
      if (findBlock(draftRef.current.doc, block.id)) return revealBlock(block.id)
      updateDoc((d) => (d.blocks.some((b) => b.id === block.id) ? d : insertBlock(d, index, block)))
      setTimeout(() => revealBlock(block.id), 0)
    },
    [updateDoc, revealBlock]
  )

  const onInsert = useCallback(
    (index: number, type: BlockType) => {
      const doc = draftRef.current.doc
      if (doc.blocks.length >= MAX_BLOCKS) return notify(`最多 ${MAX_BLOCKS} 个区块`, 'error')
      if (type === 'coupon' && doc.blocks.some((b) => b.type === 'coupon')) return notify('每封邮件只能有一个优惠券区块', 'error')
      let b: Block
      try {
        b = newBlock(type, doc.settings)
      } catch (e) {
        return notify(`新建区块失败：${e instanceof Error ? e.message : '未知错误'}`, 'error')
      }
      if (!b || !BLOCK_ID_RE.test(b.id) || doc.blocks.some((x) => x.id === b.id)) b = { ...b, id: uniqueBlockId(doc) }
      // 需要「选择」的字段先用目录里的商品填上，作者一眼能看到效果再换（选择器里清楚显示当前是哪个）
      if (b.type === 'product' && !productMap.has(b.productId) && catalog.products.length) {
        b = { ...b, productId: catalog.products[0].id }
      }
      // 商品组的占位是重复的同一个 id：按「不重复且在售」的个数判断
      if (b.type === 'productGrid' && new Set(b.productIds.filter((x) => productMap.has(x))).size < 2 && catalog.products.length >= 2) {
        b = { ...b, productIds: catalog.products.slice(0, Math.min(4, catalog.products.length)).map((p) => p.id) }
      }
      const nb = b
      updateDoc((d) => insertBlock(d, index, nb))
      setTab('blocks')
      setSelectedId(nb.id)
      setScrollReq({ id: nb.id, nonce: Date.now() })
      setFocus((f) => ({ id: nb.id, token: f.token + 1 }))
    },
    [updateDoc, notify, productMap, catalog.products]
  )

  const onSettings = useCallback(
    (s: DocSettings, key?: string) => updateDoc((doc) => ({ ...doc, settings: s }), key),
    [updateDoc]
  )
  const onApplyTheme = useCallback(
    (s: DocSettings) =>
      updateDoc((doc) => {
        // 渲染器的 applyTheme 连模板用到的品牌浅色一起换（口径与内置模板一致）；万一抛错退回编辑器自己的简单换色
        try {
          return applyTheme(doc, s)
        } catch {
          return remapThemeColors(doc, doc.settings, s)
        }
      }),
    [updateDoc]
  )

  const setTopic = useCallback((t: Topic) => update((d) => (d.topic === t ? d : { ...d, topic: t })), [update])

  /* ---------- 保存 / 关闭 ---------- */

  const saveNow = useCallback(async () => {
    if (locked) return
    await flush()
  }, [flush, locked])

  const handleClose = useCallback(async () => {
    if (closing) return
    if (locked) return onClose()
    // await 之后要读「此刻」的保存状态：闭包里的 autosave.status 是旧的
    const readStatus = (): SaveStatus => getStatus()
    if (readStatus().kind === 'conflict') return // 冲突对话框已打开，先解决冲突
    setClosing(true)
    const saved = await flush()
    setClosing(false)
    if (saved) return onClose()
    const st = readStatus()
    if (st.kind === 'conflict') return
    if (st.kind === 'locked') return onClose()
    setConfirmClose(
      st.kind === 'error'
        ? `保存失败：${st.message}`
        : st.kind === 'retrying'
          ? '网络异常，最近的修改还没保存到服务器。'
          : '最近的修改还没保存到服务器。'
    )
  }, [closing, locked, onClose, flush, getStatus])

  const conflictServer = autosave.status.kind === 'conflict' ? autosave.status.server : null
  const modalOpen = !!conflictServer || !!confirmClose
  const modalRef = useRef(modalOpen)
  modalRef.current = modalOpen
  const rootRef = useRef<HTMLDivElement>(null)

  /* ---------- 快捷键 ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const k = (e.key || '').toLowerCase()
      // Ctrl+S 在任何地方都拦下（包括输入框里），否则浏览器会弹「另存网页」
      if (mod && !e.altKey && !e.shiftKey && k === 's') {
        e.preventDefault()
        void saveNow()
        return
      }
      if (modalRef.current || locked || e.defaultPrevented) return
      // 焦点在编辑器外（例如从顶栏打开的「发测试」弹窗，z-[60] 压在编辑器上面）：不抢它的按键
      const t = e.target as Node | null
      if (t && t !== document.body && t !== document.documentElement && !rootRef.current?.contains(t)) return
      // 正在输入：撤销/重做等交给输入框或 TipTap 自己
      if (isEditableTarget(e.target)) return
      if (mod && !e.altKey && k === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' })
        return
      }
      if (mod && !e.altKey && !e.shiftKey && k === 'y') {
        e.preventDefault()
        dispatch({ type: 'redo' })
        return
      }
      const sel = selectedRef.current
      if (!sel) return
      if (e.altKey && !mod && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        onMove(sel, e.key === 'ArrowUp' ? -1 : 1)
        return
      }
      if (mod && !e.altKey && !e.shiftKey && k === 'd') {
        e.preventDefault()
        onDuplicate(sel)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveNow, locked, onMove, onDuplicate])

  // 全屏期间锁住背后页面的滚动
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  /* ---------- 预览渲染与检查（防抖，打字不卡） ---------- */

  const deb = useDebounced(draft, 150)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const productsRecord = useMemo(() => {
    const r: Record<number, ProductCard> = {}
    for (const p of catalog.products) r[p.id] = p
    return r
  }, [catalog.products])
  const coupon = useMemo(() => couponFor(deb.doc, origin, catalog, productMap), [deb.doc, origin, catalog, productMap])
  const previewUser = previewUsers.find((u) => u.id === previewUserId) || null
  const baseVars = useMemo(() => {
    const v: Partial<Record<MergeTag, string>> = {}
    const exp = sampleCouponExpires(deb.doc)
    if (exp) v.coupon_expires = exp
    return v
  }, [deb.doc])
  const userVars = useMemo(() => {
    if (!previewUser) return baseVars
    const v: Partial<Record<MergeTag, string>> = { ...baseVars, email: previewUser.email }
    const nick = safeNick(previewUser.nickname)
    if (nick) v.nickname = nick
    return v
  }, [baseVars, previewUser])

  // 检查用的渲染：不带选中描边、不开无图、用默认尊称（与发送内容最接近）
  const lintRender = useMemo(
    () =>
      tryRender(deb.doc, {
        mode: 'preview',
        subject: deb.subject,
        preheader: deb.preheader,
        origin,
        footer: cfg.footer,
        products: productsRecord,
        coupon,
        vars: baseVars,
        selectedBlockId: null,
        imagesOff: false,
      }),
    [deb.doc, deb.subject, deb.preheader, origin, cfg.footer, productsRecord, coupon, baseVars]
  )
  const plainDisplay = !selectedId && !imagesOff && !previewUser
  const displayRender = useMemo(
    () =>
      plainDisplay
        ? lintRender
        : tryRender(deb.doc, {
            mode: 'preview',
            subject: deb.subject,
            preheader: deb.preheader,
            origin,
            footer: cfg.footer,
            products: productsRecord,
            coupon,
            vars: userVars,
            selectedBlockId: selectedId,
            imagesOff,
          }),
    [plainDisplay, lintRender, deb.doc, deb.subject, deb.preheader, origin, cfg.footer, productsRecord, coupon, userVars, selectedId, imagesOff]
  )

  const lint = useMemo((): { issues: LintIssue[]; unavailable: boolean } => {
    let content: LintIssue[]
    try {
      content = lintContent({ subject: deb.subject, preheader: deb.preheader, topic: deb.topic, doc: deb.doc, subjectPrefix })
    } catch {
      return { issues: [], unavailable: true }
    }
    let rendered: LintIssue[] = []
    if (lintRender.ok) {
      try {
        rendered = lintRendered({
          html: stripPreviewMarkers(lintRender.result.html),
          text: lintRender.result.text,
          subject: subjectPrefix + deb.subject,
          sizeBytes: lintRender.result.sizeBytes,
          imageCount: lintRender.result.imageCount,
        })
      } catch {
        rendered = []
      }
    }
    return { issues: mergeIssues(content, rendered), unavailable: false }
  }, [deb.subject, deb.preheader, deb.topic, deb.doc, subjectPrefix, lintRender])

  const issuesByBlock = useMemo(() => {
    const m = new Map<string, BlockIssueCount>()
    for (const i of lint.issues) {
      if (!i.blockId) continue
      const c = m.get(i.blockId) || { errors: 0, warns: 0 }
      if (i.level === 'error') c.errors++
      else c.warns++
      m.set(i.blockId, c)
    }
    return m
  }, [lint.issues])

  /* ---------- 上下文 ---------- */

  const ctx: EditorContextValue = useMemo(
    () => ({
      catalog,
      catalogState,
      reloadCatalog,
      productMap,
      settings: draft.doc.settings,
      recentColors,
      pushRecentColor,
      topic: draft.topic,
      setTopic,
      readOnly: locked,
      notify,
    }),
    [catalog, catalogState, reloadCatalog, productMap, draft.doc.settings, recentColors, pushRecentColor, draft.topic, setTopic, locked, notify]
  )

  const statusLabel = CAMPAIGN_STATUS_LABEL[rawCampaign.status] || rawCampaign.status
  const actions = renderActions?.({ flush, dirty: autosave.dirty, saving: autosave.saving })

  return (
    <EditorProvider value={ctx}>
      <div
        ref={rootRef}
        className="mkt-editor fixed inset-0 z-50 flex flex-col bg-gray-50 text-gray-800"
        role="dialog"
        aria-modal="true"
        aria-label="编辑营销邮件"
      >
        <EditorStyles />
        <TopBar
          name={draft.name}
          onName={(v) => update((d) => ({ ...d, name: v }), 'name')}
          topic={draft.topic}
          onTopic={setTopic}
          subject={draft.subject}
          onSubject={(v) => update((d) => ({ ...d, subject: v }), 'subject')}
          preheader={draft.preheader}
          onPreheader={(v) => update((d) => ({ ...d, preheader: v }), 'preheader')}
          subjectPrefix={subjectPrefix}
          status={autosave.status}
          onSaveNow={() => void saveNow()}
          canUndo={hist.past.length > 0}
          canRedo={hist.future.length > 0}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          actions={actions}
          onClose={() => void handleClose()}
          closing={closing}
          readOnly={locked}
        />

        {(readOnly || autosave.status.kind === 'locked') && (
          <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <Lock className="h-4 w-4" />
            {readOnly
              ? `这个活动当前是「${statusLabel}」状态，内容已冻结，只能查看。需要修改请先撤回定时，或复制为新草稿。`
              : autosave.status.kind === 'locked'
                ? `${autosave.status.message}。之后的修改不会保存。`
                : null}
          </div>
        )}
        {catalogState === 'error' && (
          <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-700">
            <TriangleAlert className="h-3.5 w-3.5" />
            商品与优惠券目录加载失败，商品卡片和券区块暂时无法预览。
            <button type="button" onClick={reloadCatalog} className="inline-flex items-center gap-1 font-medium underline">
              <RotateCcw className="h-3 w-3" />
              重试
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* 左栏 */}
          <aside className="relative flex w-[400px] shrink-0 flex-col border-r border-gray-200 bg-gray-50 xl:w-[440px]">
            <div className="flex shrink-0 gap-1 border-b border-gray-200 bg-white px-3 pt-2">
              {(
                [
                  { k: 'blocks' as const, label: '内容区块', icon: Blocks, extra: `${draft.doc.blocks.length}/${MAX_BLOCKS}` },
                  { k: 'style' as const, label: '全局样式', icon: Paintbrush, extra: '' },
                ] as const
              ).map(({ k, label, icon: Icon, extra }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={cn(
                    '-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition-colors',
                    tab === k ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {extra && <span className="text-xs font-normal tabular-nums text-gray-400">{extra}</span>}
                </button>
              ))}
            </div>
            <motion.div layoutScroll className="mkt-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-16 pt-2">
              {/* fieldset disabled：只读时一次性禁用所有原生表单控件 */}
              <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
                {tab === 'blocks' ? (
                  <>
                    {draft.doc.blocks.length === 0 && (
                      <div className="mb-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                        还没有内容。点下面的「添加区块」开始，或返回后套用一个内置模板。
                      </div>
                    )}
                    <BlockList
                      doc={draft.doc}
                      selectedId={selectedId}
                      onSelect={selectFromList}
                      onBlockChange={onBlockChange}
                      onReorder={onReorder}
                      onMove={onMove}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onInsert={onInsert}
                      issuesByBlock={issuesByBlock}
                      scrollRequest={scrollReq}
                      readOnly={locked}
                    />
                  </>
                ) : (
                  <div className="pt-2">
                    <DocSettingsPanel settings={draft.doc.settings} onChange={onSettings} onApplyTheme={onApplyTheme} />
                  </div>
                )}
              </fieldset>
            </motion.div>
            {toast && (
              <div className="pointer-events-none absolute inset-x-0 bottom-9 z-20 px-3">
                <div
                  role="status"
                  className={cn(
                    'pointer-events-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-lg',
                    toast.kind === 'message' && toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
                  )}
                >
                  {toast.kind === 'deleted' ? (
                    <>
                      <span className="min-w-0 flex-1 truncate">已删除 · {safeSummary(toast.block)}</span>
                      <button
                        type="button"
                        onClick={() => undoDelete(toast.block, toast.index)}
                        className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 font-medium text-sky-300 hover:bg-white/10"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        撤销
                      </button>
                    </>
                  ) : (
                    <span className="min-w-0 flex-1">{toast.text}</span>
                  )}
                  <button type="button" onClick={() => setToast(null)} className="shrink-0 rounded p-0.5 text-white/60 hover:text-white" aria-label="关闭提示">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex h-8 shrink-0 items-center justify-center border-t border-gray-200 bg-white px-3 text-[11px] text-gray-400">
              {locked ? '只读' : 'Ctrl+Z 撤销 · Ctrl+S 保存 · Alt+↑↓ 移动区块 · Ctrl+D 复制区块'}
            </div>
          </aside>

          {/* 右栏：预览 */}
          <PreviewPane
            html={displayRender.ok ? displayRender.result.html : null}
            renderError={displayRender.ok ? null : displayRender.error}
            sizeBytes={lintRender.ok ? lintRender.result.sizeBytes : 0}
            imageCount={lintRender.ok ? lintRender.result.imageCount : 0}
            device={device}
            onDevice={setDevice}
            dark={dark}
            onDark={setDark}
            docDarkMode={draft.doc.settings.darkMode}
            imagesOff={imagesOff}
            onImagesOff={setImagesOff}
            previewUsers={previewUsers}
            previewUserId={previewUserId}
            onPreviewUser={setPreviewUserId}
            onSelectBlock={selectFromPreview}
            focusBlockId={focus.id}
            focusToken={focus.token}
            inbox={{
              fromAlias: cfg.fromAlias,
              subject: subjectPrefix + applySampleVars(draft.subject, userVars),
              preheader: applySampleVars(draft.preheader, userVars),
            }}
            issues={lint.issues}
            lintUnavailable={lint.unavailable}
            onIssueClick={(i) => i.blockId && revealBlock(i.blockId)}
          />
        </div>

        {conflictServer && (
          <ConflictDialog
            server={conflictServer}
            onUseServer={() => {
              const d = autosave.resolveConflict('server')
              if (d) dispatch({ type: 'load', draft: d })
            }}
            onOverwrite={() => {
              autosave.resolveConflict('mine')
            }}
          />
        )}
        {confirmClose && (
          <ConfirmDialog
            title="还有修改没保存"
            message={
              <>
                <p>{confirmClose}</p>
                <p className="mt-1">现在关闭会丢失这些修改。</p>
              </>
            }
            confirmText="放弃修改并关闭"
            danger
            onCancel={() => setConfirmClose(null)}
            onConfirm={() => {
              setConfirmClose(null)
              autosave.discard()
              onClose()
            }}
          />
        )}
      </div>
    </EditorProvider>
  )
}
