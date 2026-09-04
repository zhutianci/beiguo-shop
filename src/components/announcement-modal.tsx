'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, AlertTriangle, PartyPopper, X } from 'lucide-react'

interface Announcement {
  id: number
  title: string
  content: string
  level: string // INFO | WARN | SUCCESS
  pinned: boolean
  updatedAt: string
}

const LEVEL_STYLES: Record<
  string,
  { icon: typeof Megaphone; ring: string; glow: string; chip: string; label: string }
> = {
  INFO: {
    icon: Megaphone,
    ring: 'border-purple-500/40',
    glow: 'from-purple-600/20 to-blue-600/20',
    chip: 'bg-purple-500/15 text-purple-200 border-purple-500/30',
    label: '公告',
  },
  WARN: {
    icon: AlertTriangle,
    ring: 'border-amber-500/50',
    glow: 'from-amber-600/20 to-orange-600/20',
    chip: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    label: '重要提醒',
  },
  SUCCESS: {
    icon: PartyPopper,
    ring: 'border-emerald-500/40',
    glow: 'from-emerald-600/20 to-teal-600/20',
    chip: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    label: '好消息',
  },
}

const seenKey = (id: number) => `announce_seen_${id}`

// localStorage 在无痕模式 / 站点数据被禁用时读写都可能抛异常，全部包 try/catch，
// 取不到值时按「没读过」处理（宁可多弹一次，也不要整个组件崩掉）。
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
    /* 忽略：记不住就下次再弹 */
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

export function AnnouncementModal() {
  const [data, setData] = useState<Announcement | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/announcement')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.success || !d.data) return
        const a: Announcement = d.data
        setData(a)
        // pinned（强提醒）忽略已读记录，每次进站都弹；普通公告读过就不再打扰。
        // 公告内容被编辑后 updatedAt 变化，会重新弹给读过旧版本的买家。
        if (a.pinned || !hasSeen(a)) setOpen(true)
      })
      .catch(() => {
        /* 公告拿不到不影响主流程，静默失败 */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const close = () => {
    setOpen(false)
    if (data && !data.pinned) markSeen(data)
  }

  if (!data) return null
  const style = LEVEL_STYLES[data.level] || LEVEL_STYLES.INFO
  const Icon = style.icon

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg rounded-3xl glass-strong border ${style.ring} overflow-hidden`}
          >
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
                    <h3 className="mt-1 text-lg font-bold text-white break-words">{data.title}</h3>
                  </div>
                </div>
                <button
                  onClick={close}
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
                onClick={close}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
              >
                我知道了
              </button>
              <p className="mt-2 text-center text-[11px] text-white/30">
                {data.pinned ? '这是一条强提醒公告，每次进入都会展示' : '关闭后不再重复提示，公告更新时会再次展示'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
