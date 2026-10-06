'use client'

import { useStorefront } from '@/components/storefront-provider'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Megaphone, AlertTriangle, PartyPopper, X } from 'lucide-react'

/*
 * 站点公告：页面底部的可关闭提示条 + 点开看全文的弹层（SEO 重构 B 包，docs/SEO-重构/SEO-重构设计.md §0.3 #18、§6.6-2、§9.4 #8）。
 *
 * 【为什么不再首访全屏弹窗】原来买家第一次进任何前台页面，都先看到一个全屏遮罩的公告弹窗。
 * PSI 移动端实测 4 个代表页的 LCP 元素都是这个弹窗的正文（docs/SEO-重构/baseline/psi.md），
 * 它要等挂载后请求 /api/announcement 才渲染，LCP 被拖到 3.2~3.5 秒；从搜索、ChatGPT 点进来的人第一眼也只看到遮罩。
 *
 * 【为什么放底部、只放标题】公告正文最长 5000 字（lib/announcement.ts），顶部横条放不下；
 * 放顶部要么压在固定页头上，要么在客户端拉取之后把内容往下推（CLS 从 0 变差）。
 * 底部 fixed 的提示条不占文档流、不推动任何已有内容；正文照旧在弹层里看。
 *
 * 语义不变：
 *  · 普通公告：关掉提示条（或看完全文点「我知道了」）即记已读，沿用 localStorage 的 announce_seen_<id> = updatedAt；
 *    公告内容被编辑后 updatedAt 变化，会重新提示读过旧版本的买家。
 *  · 强提醒（pinned）：忽略已读记录，每次进站（整页加载）都出现提示条；关掉只在本次浏览内不再出现。
 *    强提醒也只以提示条出现，不再全屏弹。
 *
 * 和其他悬浮组件避让：提示条出现时把自身高度写进 <html> 的 CSS 变量 --announce-bar-h，
 * 右下角客服（floating-contact.tsx）据此上抬；页面末尾同时补一段等高的占位，页脚最后一行不会被压住。
 * /jiema/* 底部钉着下单确认条，提示条在那里让位（同 lib/floating-widgets.ts 的做法）。
 *
 * 不用 framer-motion：这个组件挂在每一个前台页面上，入场动效用 globals.css 的 ui-* keyframes（设计 §6.6-5）。
 *
 * 挂载点 (shop)/layout.tsx 的注释「买家进入前台任意页面即弹窗展示」已过时，以本文件为准；
 * 那是营销会话的文件，本包不改，列在设计 §6.6-1「B 包遗留」里随挂载点一起清理。
 */

interface Announcement {
  /** 主站是自增 id；渠道站是公开编号（字符串，docs/多渠道分销-渠道品牌与公告.md 第 5 节）。只用来记「已读」 */
  id: number | string
  title: string
  content: string
  level: string // INFO | WARN | SUCCESS
  pinned: boolean
  updatedAt: string
}

const LEVEL_STYLES: Record<
  string,
  { icon: typeof Megaphone; ring: string; glow: string; chip: string; iconTone: string; label: string }
> = {
  INFO: {
    icon: Megaphone,
    ring: 'border-purple-500/40',
    glow: 'from-purple-600/20 to-blue-600/20',
    chip: 'bg-purple-500/15 text-purple-200 border-purple-500/30',
    iconTone: 'text-purple-300',
    label: '公告',
  },
  WARN: {
    icon: AlertTriangle,
    ring: 'border-amber-500/50',
    glow: 'from-amber-600/20 to-orange-600/20',
    chip: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    iconTone: 'text-amber-300',
    label: '重要提醒',
  },
  SUCCESS: {
    icon: PartyPopper,
    ring: 'border-emerald-500/40',
    glow: 'from-emerald-600/20 to-teal-600/20',
    chip: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    iconTone: 'text-emerald-300',
    label: '好消息',
  },
}

/** 提示条高度写在 <html> 上的 CSS 变量名（floating-contact.tsx 读它） */
export const ANNOUNCE_BAR_VAR = '--announce-bar-h'

const under = (p: string, base: string) => p === base || p.startsWith(`${base}/`)

/**
 * 公告提示条在哪些页面让位。纯函数（检查脚本也调它）。
 * /jiema/* 底部钉着「下一步 / 去支付」确认条，提示条压上去就挡住了下单按钮。
 */
export function hideAnnouncementBarOn(pathname: string | null | undefined): boolean {
  return under(pathname ?? '', '/jiema')
}

const seenKey = (id: number | string) => `announce_seen_${id}`

// localStorage 在无痕模式 / 站点数据被禁用时读写都可能抛异常，全部包 try/catch，
// 取不到值时按「没读过」处理（宁可多提示一次，也不要整个组件崩掉）。
function hasSeen(a: Announcement): boolean {
  try {
    return localStorage.getItem(seenKey(a.id)) === a.updatedAt
  } catch {
    return false
  }
}
function markSeen(a: Announcement) {
  try {
    localStorage.setItem(seenKey(a.id), a.updatedAt)
  } catch {
    /* 忽略：记不住就下次再提示 */
  }
}

/** 把纯文本里的链接变成可点击的 a 标签（不用 dangerouslySetInnerHTML，避免公告内容成为 XSS 入口） */
function renderContent(text: string) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g)
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a
        key={i}
        href={p}
        target="_blank"
        rel="noreferrer noopener"
        className="text-purple-300 underline underline-offset-2 hover:text-purple-200 break-all"
      >
        {p}
      </a>
    ) : (
      <span key={i}>{p}</span>
    )
  )
}

function AnnouncementBarInner() {
  const pathname = usePathname()
  const [data, setData] = useState<Announcement | null>(null)
  const [barOpen, setBarOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [barH, setBarH] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/announcement')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.success || !d.data) return
        const a: Announcement = d.data
        setData(a)
        // pinned（强提醒）忽略已读记录，每次进站都提示；普通公告读过就不再打扰
        if (a.pinned || !hasSeen(a)) setBarOpen(true)
      })
      .catch(() => {
        /* 公告拿不到不影响主流程，静默失败 */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const showBar = !!data && barOpen && !hideAnnouncementBarOn(pathname)

  // 把提示条的实际高度（标题折行、安全区都算上）发布成 CSS 变量；提示条消失时撤掉
  useEffect(() => {
    const root = document.documentElement
    const el = barRef.current
    if (!showBar || !el) {
      root.style.removeProperty(ANNOUNCE_BAR_VAR)
      setBarH(0)
      return
    }
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      setBarH(h)
      root.style.setProperty(ANNOUNCE_BAR_VAR, `${h}px`)
    }
    apply()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null
    ro?.observe(el)
    return () => {
      ro?.disconnect()
      root.style.removeProperty(ANNOUNCE_BAR_VAR)
    }
  }, [showBar])

  // 弹层：打开时把焦点放到关闭按钮上，Esc 关闭
  useEffect(() => {
    if (!detailOpen) return
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailOpen])

  /** 关掉提示条（或看完全文后关闭弹层）= 读过：普通公告记已读，强提醒只在本次浏览内不再出现 */
  function dismiss() {
    setDetailOpen(false)
    setBarOpen(false)
    if (data && !data.pinned) markSeen(data)
  }

  if (!data) return null
  const style = LEVEL_STYLES[data.level] || LEVEL_STYLES.INFO
  const Icon = style.icon

  return (
    <>
      {showBar && (
        <>
          {/* 文档流末尾的等高占位：滚到底时页脚最后一行不被提示条压住。加在页面最末，不推动任何已有内容 */}
          <div aria-hidden="true" style={{ height: barH }} />
          <div
            ref={barRef}
            role="region"
            aria-label="站点公告"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 sm:px-6 ui-slide-up"
            // 底边距至少 12px；iPhone 有 Home 指示条时让到安全区之上
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div
              className={`pointer-events-auto mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border ${style.ring} bg-neutral-950/95 py-1.5 pl-3 pr-1.5 shadow-2xl backdrop-blur-xl sm:gap-3 sm:pl-4`}
            >
              <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 sm:hidden ${style.iconTone}`} />
              <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] sm:inline-flex ${style.chip}`}>
                {style.label}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-white/90">{data.title}</p>
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                aria-haspopup="dialog"
                className="h-10 shrink-0 whitespace-nowrap rounded-full bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                查看详情
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="关闭公告"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {detailOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
        >
          {/* 手机端轻量模式（2026-10-01，站长要求电脑端不变）：遮罩不做毛玻璃（globals.css 在触屏设备上统一去掉 backdrop-filter），
              改成更深的纯色 lite:bg-black/85。整屏 3 倍分辨率的模糊在 iOS WebKit 上每帧都要重算，是实测最贵的一块 */}
          <div onClick={dismiss} className="absolute inset-0 bg-black/75 backdrop-blur-md ui-fade-in lite:bg-black/85" />
          <div className={`relative w-full max-w-lg rounded-3xl glass-strong border ${style.ring} overflow-hidden ui-pop-in`}>
            <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${style.glow} pointer-events-none`} />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${style.chip}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${style.chip}`}>
                      {style.label}
                    </span>
                    <h3 id="announcement-title" className="mt-1 text-lg font-bold text-white break-words">
                      {data.title}
                    </h3>
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={dismiss}
                  aria-label="关闭公告"
                  className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                  {renderContent(data.content)}
                </p>
              </div>

              <button
                type="button"
                onClick={dismiss}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
              >
                我知道了
              </button>
              <p className="mt-2 text-center text-[11px] text-white/30">
                {data.pinned
                  ? '这是一条强提醒公告，每次进入本站都会在页面底部提示'
                  : '关闭后不再重复提示，公告更新时会再次提示'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 渠道分站（实施分包 WP1）：原来公告在渠道站关闭（设计 11.1：公告常含主站券与活动）。
 * 2026-10-05 起（docs/多渠道分销-渠道品牌与公告.md 第 5 节）渠道站也挂：同一个接口 /api/announcement 在渠道 Host 上
 * 只返回本渠道自己发布的公告（主站公告不会出现在渠道站），nginx 渠道白名单同步放行。
 * 主站恒为渲染，行为不变。
 * 导出名沿用 AnnouncementModal：挂载点在 (shop)/layout.tsx（营销会话的文件，本方案不改），itest-tenant 也按这个名字找它。
 */
export function AnnouncementModal() {
  const { features, kind } = useStorefront()
  if (!(features.announcement || kind === 'CHANNEL')) return null
  return <AnnouncementBarInner />
}
