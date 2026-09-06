'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, MessageCircle, Share2, X } from 'lucide-react'
import { AI_BADGE } from '@/lib/news/constants'
import {
  buildShareText,
  copyText,
  isWeChat,
  qqShareUrl,
  reportNewsShare,
  weiboShareUrl,
  withChannel,
} from '@/lib/news/share'
import { SharePoster } from './share-poster'

/**
 * 分享面板。
 *
 * 【为什么没有一行微信 JS-SDK 代码】域名未备案 → 拿不到「JS 接口安全域名」→
 * 拿不到 wx.config 的 signature；而且微信自 JS-SDK 1.4.0 起已取消 H5 程序化调起分享。
 * 两条路都堵死，网页能做的只有「引导用户点右上角 ···」。任何声称能自定义微信卡片的
 * 实现在本站都跑不起来，不要再加。
 *
 * 【文案红线】微信外链规范禁止一切利益诱导分享（「分享得优惠/解锁/抽奖」），
 * 违规处罚是封禁域名。本站靠客服微信引流成交，域名被封会连带废掉整条获客链路。
 * 所以这里所有按钮文案只描述动作本身，一个字的诱导都不能加。
 *
 * 【AI 标识】复制出去的文案必须带「AI 摘要」字样（《标识办法》第五条覆盖复制/导出场景，
 * SKILL.md §6 第 5 处）——由 buildShareText() 统一保证，不要在这里另拼一份文案。
 */

interface Props {
  eventId: number
  slug: string
  headline: string
  summary?: string | null
  whyItMatters?: string | null
  category?: string | null
  sources?: string[]
  happenedAt?: string | null
  /** 详情页绝对地址（含协议与域名） */
  url: string
  className?: string
}

const BTN =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.09]'

export function ShareBar(props: Props) {
  const [copied, setCopied] = useState(false)
  const [wxOpen, setWxOpen] = useState(false)

  const content = { headline: props.headline, summary: props.summary, url: props.url }

  /*
   * 【为什么要 mounted 而不是直接调 isWeChat()】
   * 这是客户端组件，但 Next 仍会在服务端把它渲染一遍。服务端没有 navigator，
   * isWeChat() 恒为 false、'share' in navigator 也恒为 false，
   * 于是服务端 HTML 里有 QQ/微博按钮、客户端首帧却可能没有——React 报 hydration 失配，
   * 整棵子树会被丢弃重渲。用 mounted 让首帧与服务端一致，第二帧再按环境调整。
   */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const inWeChat = mounted && isWeChat()
  const hasSystemShare = mounted && typeof navigator !== 'undefined' && 'share' in navigator

  // 刻意不整个 {...props} 透传：props.className 是这一排按钮的容器样式，
  // 传进海报按钮会把按钮变成 flex 容器。只传海报真正需要的字段。
  const posterProps = {
    eventId: props.eventId,
    slug: props.slug,
    headline: props.headline,
    summary: props.summary,
    whyItMatters: props.whyItMatters,
    category: props.category,
    sources: props.sources,
    happenedAt: props.happenedAt,
    url: props.url,
  }

  const handleCopy = async () => {
    const ok = await copyText(buildShareText(content))
    if (ok) {
      reportNewsShare(props.eventId, 'copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  /** 系统分享：必须同步调用，不能 await 任何东西（transient activation） */
  const handleSystemShare = () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (!nav.share) return
    reportNewsShare(props.eventId, 'system')
    nav
      .share({
        title: `【${AI_BADGE}】${props.headline}`,
        text: buildShareText(content),
        url: withChannel(props.url, 'system'),
      })
      .catch(() => {
        // 用户取消分享也会 reject，不当作错误
      })
  }

  const openExternal = (href: string, channel: 'qq' | 'weibo') => {
    reportNewsShare(props.eventId, channel)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={props.className || 'flex flex-wrap items-center gap-2'}>
      {/* 微信：不调任何 API，只弹引导蒙层 */}
      <button type="button" onClick={() => setWxOpen(true)} className={BTN}>
        <MessageCircle className="h-4 w-4" />
        微信
      </button>

      {/* 系统分享面板（移动端优先，能直接唤起微信/QQ 等已安装应用） */}
      {hasSystemShare && (
        <button type="button" onClick={handleSystemShare} className={BTN}>
          <Share2 className="h-4 w-4" />
          分享
        </button>
      )}

      {/* 微信内置浏览器里跳 QQ/微博 会被拦成空白页，所以只在站外浏览器显示 */}
      {!inWeChat && (
        <>
          <button type="button" onClick={() => openExternal(qqShareUrl(content), 'qq')} className={BTN}>
            QQ
          </button>
          <button
            type="button"
            onClick={() => openExternal(weiboShareUrl(content), 'weibo')}
            className={BTN}
          >
            微博
          </button>
        </>
      )}

      <SharePoster {...posterProps} />

      <button type="button" onClick={handleCopy} className={BTN}>
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        {copied ? `已复制（含 ${AI_BADGE} 标识）` : '复制链接'}
      </button>

      {wxOpen && (
        <WeChatGuide
          onClose={() => setWxOpen(false)}
          inWeChat={inWeChat}
          posterProps={posterProps}
        />
      )}
    </div>
  )
}

/**
 * 微信分享引导蒙层。
 * 微信内：指右上角「···」。微信外：告知需在微信里打开，并给出海报与复制两条可行路径。
 * 全程不出现任何奖励性表述。
 */
function WeChatGuide(props: {
  onClose: () => void
  inWeChat: boolean
  posterProps: Omit<Props, 'className'>
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 p-6 backdrop-blur-sm"
      onClick={props.onClose}
      role="dialog"
      aria-modal="true"
    >
      {props.inWeChat && (
        // 指向右上角菜单的引导箭头。用纯 SVG 画，不引入图片资源
        <svg
          className="pointer-events-none absolute right-6 top-4 h-24 w-24 text-white/80"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M78 14 C 60 26, 46 44, 38 66"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="7 7"
          />
          <path d="M78 14 l-16 3 M78 14 l3 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      <div
        className="mx-auto mt-32 max-w-sm rounded-2xl bg-slate-900 p-5 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-white/80">分享到微信</span>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-white/70">
          {props.inWeChat
            ? '点击右上角「···」菜单，选择「发送给朋友」或「分享到朋友圈」。'
            : '在微信中打开本页后，点击右上角「···」即可分享；也可以直接生成海报或复制文案。'}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <SharePoster
            {...props.posterProps}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500"
          />
        </div>
      </div>
    </div>
  )
}
