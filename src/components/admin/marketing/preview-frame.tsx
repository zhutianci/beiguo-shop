'use client'

/**
 * 邮件预览框：把渲染好的邮件 HTML 放进沙箱 iframe 展示。
 *
 * 【安全 —— 设计文档第 12 节第 12 条，不能改】
 * - sandbox 只给 allow-same-origin，**绝不给 allow-scripts**：邮件 HTML 里即使混进了脚本也不会执行，
 *   拿不到 localStorage 里的管理员凭据。
 * - allow-same-origin 是为了让父页面能读 contentDocument：量高度、做「点预览选中区块」。
 *   这些监听器是父页面的函数，在父页面的上下文里执行，不需要 iframe 能跑脚本。
 * - 用 srcdoc，不用 dangerouslySetInnerHTML：邮件样式直接进后台页面会互相污染，也绕开了沙箱。
 * - 预览里的链接一律拦掉（preventDefault）：不让 iframe 被导航到任何地方。
 *
 * 【双缓冲】每次内容变化都换 srcdoc 会让 iframe 整个重载，打字时预览一闪一闪。
 * 这里放两个 iframe：新内容先在隐藏的那个里加载、量好高度，再一次性切换显示，肉眼看不到白屏。
 *
 * 【高度】父页面测量：隐藏的缓冲框先设成很矮，文档内容溢出后 scrollHeight 就是真实内容高度；
 * 切换显示后用 ResizeObserver + 图片 load 事件跟踪后续变高（图片加载完才撑开）。
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface PreviewFrameProps {
  html: string
  /** iframe 宽度（px），默认 600 */
  width?: number
  /** 点击预览里的区块（最近的 [data-bid]）时回调该区块 id */
  onSelectBlock?: (id: string) => void
  className?: string
  /** 最小高度（px），默认 200 */
  minHeight?: number
  /**
   * 以下为可选扩展（契约之外，不传即不启用）：
   * focusBlockId + focusToken：token 变化时，把最近的可滚动祖先滚到该区块可见（左栏选中 → 预览跟随）
   */
  focusBlockId?: string | null
  focusToken?: number
  /** 注入到预览文档 <head> 的额外样式（例如暗色模拟时给图片反向滤镜）。只影响预览，不进邮件 */
  extraCss?: string
  /** 加到预览文档 <html> 上的类名（例如渲染器约定的 mk-sim-dark：按邮件自带的暗色样式显示）。切换时不重载 */
  rootClassName?: string
  /** iframe 的无障碍标题 */
  title?: string
}

/** 缓冲框在测量时的高度：足够矮，保证文档内容溢出，scrollHeight 才等于内容高度 */
const MEASURE_HEIGHT = 80

/** 可点选时的指针样式（悬停描边由渲染器的 preview 样式负责）。只在预览文档里，不影响邮件本身 */
const INTERACTIVE_CSS = '[data-bid]{cursor:pointer}'

interface Slot {
  html: string | null
  width: number
}

function hasClosest(t: unknown): t is Element {
  return !!t && typeof (t as Element).closest === 'function'
}

/**
 * 量文档内容高度（px）。viewport = iframe 当前高度。
 * - 内容比视口高：scrollHeight 就是完整内容高度，最准。
 * - 内容比视口矮（显示中的框内容变少了）：scrollHeight 不会小于视口，改取 body 子元素的实际底边，
 *   否则高度只会涨不会缩。
 */
function measureDoc(doc: Document, viewport: number): number {
  const root = doc.documentElement
  const body = doc.body
  if (!root || !body) return 0
  const sh = Math.max(root.scrollHeight, body.scrollHeight)
  if (sh > viewport + 1) return Math.ceil(sh)
  let bottom = 0
  const kids = body.children
  for (let i = 0; i < kids.length; i++) {
    const r = kids[i].getBoundingClientRect()
    if (r.bottom > bottom) bottom = r.bottom
  }
  if (bottom <= 0) return Math.ceil(sh)
  const cs = doc.defaultView?.getComputedStyle(body)
  const extra = cs ? (parseFloat(cs.marginBottom) || 0) + (parseFloat(cs.paddingBottom) || 0) : 0
  const scrollY = doc.defaultView?.scrollY || 0
  return Math.ceil(Math.min(sh, bottom + scrollY + extra))
}

/** 把预览文档 <html> 的「预览专用类」换成 cls（只动自己加过的类，不碰邮件自带的） */
function applyRootClass(doc: Document, cls: string | undefined) {
  const root = doc.documentElement
  if (!root) return
  const prev = (root.getAttribute('data-mkt-root-class') || '').split(/\s+/).filter(Boolean)
  for (const c of prev) root.classList.remove(c)
  const next = (cls || '').split(/\s+/).filter(Boolean)
  for (const c of next) root.classList.add(c)
  root.setAttribute('data-mkt-root-class', next.join(' '))
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement || null
  while (p) {
    const cs = getComputedStyle(p)
    if (/(auto|scroll|overlay)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) return p
    p = p.parentElement
  }
  return null
}

export function PreviewFrame({
  html,
  width = 600,
  onSelectBlock,
  className,
  minHeight = 200,
  focusBlockId,
  focusToken,
  extraCss,
  rootClassName,
  title = '邮件预览',
}: PreviewFrameProps) {
  const frame0 = useRef<HTMLIFrameElement>(null)
  const frame1 = useRef<HTMLIFrameElement>(null)
  // 两个 ref 对象本身是稳定的；包一层 useMemo 让数组引用也稳定，回调可以正常声明依赖
  const frames = useMemo(() => [frame0, frame1], [])
  const [slots, setSlots] = useState<[Slot, Slot]>([
    { html, width },
    { html: null, width },
  ])
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)
  const [height, setHeight] = useState(minHeight)

  // 用 ref 保存最新值，给挂在 iframe 文档上的监听器用（它们只绑定一次）
  const onSelectRef = useRef(onSelectBlock)
  onSelectRef.current = onSelectBlock
  const extraCssRef = useRef(extraCss)
  extraCssRef.current = extraCss
  const rootClassRef = useRef(rootClassName)
  rootClassRef.current = rootClassName
  const minHeightRef = useRef(minHeight)
  minHeightRef.current = minHeight
  const activeRef = useRef(0)
  activeRef.current = active
  const readyRef = useRef(false)
  readyRef.current = ready
  /** 正在等待加载完成的缓冲框下标 */
  const pendingRef = useRef<number | null>(0)
  const latestRef = useRef<Slot>({ html, width })
  const observerRef = useRef<ResizeObserver | null>(null)
  const detachRef = useRef<(() => void) | null>(null)
  const handledFocusRef = useRef<number | undefined>(undefined)
  const focusRef = useRef({ id: focusBlockId, token: focusToken })
  focusRef.current = { id: focusBlockId, token: focusToken }

  /** 隐藏框里已经是要显示的内容时（srcdoc 不变就不会重载、也就没有 load 事件），提交后直接切换 */
  const [flipReq, setFlipReq] = useState<{ idx: number; nonce: number } | null>(null)

  // 内容或宽度变化 → 装进隐藏的缓冲框（首次加载前直接复用当前框）
  useEffect(() => {
    const target: Slot = { html, width }
    latestRef.current = target
    if (!readyRef.current) {
      const idx = activeRef.current
      pendingRef.current = idx
      setSlots((s) => {
        const next: [Slot, Slot] = [s[0], s[1]]
        next[idx] = target
        return next
      })
      return
    }
    const a = activeRef.current
    const cur = slots[a]
    if (cur.html === html && cur.width === width) {
      // 又回到正在显示的内容（例如取消选中又选回来）：作废进行中的装载即可
      pendingRef.current = null
      return
    }
    const idx = 1 - a
    pendingRef.current = idx
    if (slots[idx].html === html) {
      // 隐藏框里就是这份内容（来回切换选中状态时很常见）：srcdoc 不变不会重载，宽度更新后直接切换
      if (slots[idx].width !== width) {
        setSlots((s) => {
          const next: [Slot, Slot] = [s[0], s[1]]
          next[idx] = target
          return next
        })
      }
      setFlipReq({ idx, nonce: Date.now() })
      return
    }
    setSlots((s) => {
      const next: [Slot, Slot] = [s[0], s[1]]
      next[idx] = target
      return next
    })
    // slots 故意不进依赖：只在外部输入变化时装载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, width])

  const applyHeight = useCallback((h: number) => {
    const v = Math.max(minHeightRef.current, h)
    setHeight((old) => (Math.abs(old - v) > 1 ? v : old))
  }, [])

  /** 在当前显示的文档里定位 focus 区块并滚到可见 */
  const revealFocus = useCallback(() => {
    const { id, token } = focusRef.current
    if (token === undefined || handledFocusRef.current === token || !id) return
    const iframe = frames[activeRef.current].current
    const doc = iframe?.contentDocument
    if (!iframe || !doc || !readyRef.current) return
    let el: Element | null = null
    try {
      el = doc.querySelector(`[data-bid="${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id}"]`)
    } catch {
      el = null
    }
    if (!el) return
    handledFocusRef.current = token
    const scroller = findScrollParent(iframe)
    if (!scroller) return
    const fr = iframe.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    const sr = scroller.getBoundingClientRect()
    const top = fr.top + er.top
    const bottom = fr.top + er.bottom
    const pad = 24
    let delta = 0
    if (top < sr.top + pad) delta = top - sr.top - pad
    else if (bottom > sr.bottom - pad) delta = Math.min(bottom - sr.bottom + pad, top - sr.top - pad)
    if (delta) {
      let behavior: ScrollBehavior = 'smooth'
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) behavior = 'auto'
      } catch {
        /* 老浏览器没有 matchMedia：用平滑滚动 */
      }
      scroller.scrollBy({ top: delta, behavior })
    }
  }, [frames])

  useEffect(() => {
    revealFocus()
  }, [focusToken, focusBlockId, revealFocus])

  /** 给新显示的文档挂监听、注入样式、开始跟踪高度 */
  const attach = useCallback(
    (iframe: HTMLIFrameElement) => {
      detachRef.current?.()
      detachRef.current = null
      observerRef.current?.disconnect()
      observerRef.current = null
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      if (!doc || !win) return

      // 同一个文档可能被再次挂载（隐藏框内容没变、直接切回来）：样式复用，不重复插入
      let style = doc.querySelector<HTMLStyleElement>('style[data-mkt-preview]')
      if (!style) {
        style = doc.createElement('style')
        style.setAttribute('data-mkt-preview', '1')
        ;(doc.head || doc.documentElement).appendChild(style)
      }
      style.textContent = (onSelectRef.current ? INTERACTIVE_CSS : '') + (extraCssRef.current || '')
      applyRootClass(doc, rootClassRef.current)

      const onClick = (e: MouseEvent) => {
        const t = e.target
        if (!hasClosest(t)) return
        // 预览里的链接一律不跳（沙箱也不许弹窗，但同框导航仍可能发生）
        if (t.closest('a')) e.preventDefault()
        const el = t.closest('[data-bid]')
        const id = el?.getAttribute('data-bid')
        if (id && onSelectRef.current) onSelectRef.current(id)
      }
      const remeasure = () => applyHeight(measureDoc(doc, iframe.clientHeight))
      // 图片是异步加载的，加载完才撑开高度；load 事件不冒泡，用捕获阶段
      const onAssetLoad = remeasure
      const onSubmit = (e: Event) => e.preventDefault()
      doc.addEventListener('click', onClick, true)
      doc.addEventListener('auxclick', onClick, true)
      doc.addEventListener('load', onAssetLoad, true)
      doc.addEventListener('error', onAssetLoad, true)
      doc.addEventListener('submit', onSubmit, true)

      // ResizeObserver 用父页面的构造器：回调在父页面上下文执行，不受沙箱「禁止脚本」影响
      // body 若是 height:100% 只跟视口走，所以连同 body 的直接子元素（邮件外层表格）一起观察
      if (typeof ResizeObserver !== 'undefined' && doc.body) {
        const ro = new ResizeObserver(remeasure)
        ro.observe(doc.body)
        const kids = doc.body.children
        for (let i = 0; i < kids.length && i < 8; i++) ro.observe(kids[i])
        observerRef.current = ro
      }

      detachRef.current = () => {
        doc.removeEventListener('click', onClick, true)
        doc.removeEventListener('auxclick', onClick, true)
        doc.removeEventListener('load', onAssetLoad, true)
        doc.removeEventListener('error', onAssetLoad, true)
        doc.removeEventListener('submit', onSubmit, true)
      }
    },
    [applyHeight]
  )

  const handleLoad = useCallback(
    (idx: number) => {
      const iframe = frames[idx].current
      if (!iframe) return
      // about:blank 的初始加载、或期间又来了新内容的过期加载：srcdoc 已不是最新内容，忽略。
      // 不用 pendingRef 判断：极端时序下（旧内容的 load 晚到）切换到的是旧文档，
      // 随后同一个框加载完新内容还会再进来一次，此时它已是显示中的框，重新挂载即可自愈。
      const want = latestRef.current
      if (want.html === null || iframe.getAttribute('srcdoc') !== want.html) return
      const doc = iframe.contentDocument
      // 还在加载中（切换请求比 load 事件先到）：等 load 事件再来
      if (!doc || !doc.body || doc.readyState !== 'complete') return
      const h = measureDoc(doc, iframe.clientHeight)
      pendingRef.current = null
      applyHeight(h)
      setActive(idx)
      activeRef.current = idx
      setReady(true)
      readyRef.current = true
      attach(iframe)
      revealFocus()
    },
    [frames, applyHeight, attach, revealFocus]
  )

  // DOM（含新宽度）提交后再切换，量到的高度才是新宽度下的
  useLayoutEffect(() => {
    if (flipReq && pendingRef.current === flipReq.idx) handleLoad(flipReq.idx)
  }, [flipReq, handleLoad])

  // extraCss / rootClassName 变化（例如切换暗色模拟）时直接改当前文档，不必重载
  const interactive = !!onSelectBlock
  useLayoutEffect(() => {
    const doc = frames[active].current?.contentDocument
    if (!doc) return
    const style = doc.querySelector('style[data-mkt-preview]')
    if (style) style.textContent = (interactive ? INTERACTIVE_CSS : '') + (extraCss || '')
    applyRootClass(doc, rootClassName)
    // 高度可能随样式变化（例如暗色样式改了字号）：量一次
    const iframe = frames[active].current
    if (iframe && readyRef.current) applyHeight(measureDoc(doc, iframe.clientHeight))
  }, [frames, extraCss, rootClassName, active, interactive, applyHeight])

  useEffect(
    () => () => {
      detachRef.current?.()
      observerRef.current?.disconnect()
    },
    []
  )

  return (
    <div
      // overflow-hidden：切回桌面宽度时，正在加载的隐藏框（600px）比外框宽，不能撑出横向滚动条
      className={cn('relative mx-auto overflow-hidden', className)}
      // 宽度跟着「正在显示的」那一框走：切换桌面/手机时，新宽度的框加载好之前不让旧框被挤压
      style={{ width: ready ? slots[active].width : width, maxWidth: '100%', minHeight: ready ? undefined : minHeight }}
    >
      {!ready && (
        <div
          className="absolute inset-0 animate-pulse rounded-md bg-gray-100"
          style={{ minHeight }}
          aria-hidden
        />
      )}
      {[0, 1].map((i) => {
        const slot = slots[i]
        const isActive = ready && i === active
        return (
          <iframe
            key={i}
            ref={frames[i]}
            title={title}
            // 【不能改】只给 allow-same-origin，不给 allow-scripts（设计文档第 12 节）
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            srcDoc={slot.html ?? undefined}
            onLoad={() => handleLoad(i)}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            className="block border-0 bg-white"
            style={
              isActive
                ? { width: slot.width, maxWidth: '100%', height, position: 'relative', visibility: 'visible' }
                : {
                    // 隐藏的缓冲框不设 maxWidth：从手机切回桌面时外框还是 375，限宽会让它按错的宽度排版、量错高度
                    width: slot.width,
                    height: MEASURE_HEIGHT,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                  }
            }
          />
        )
      })}
    </div>
  )
}

export default PreviewFrame
