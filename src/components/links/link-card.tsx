'use client'

import { ArrowUpRight, Crown, Plus } from 'lucide-react'
import { SiteLogo } from './site-logo'
import type { PublicLinkDto } from '@/lib/friend-link-client'

/** 前台拿到的友链数据。contact / remark / applyIp 不在其中，服务端就没发出来 */
export type PublicLink = PublicLinkDto

/**
 * 点击打点。keepalive 是关键：用户点完立刻跳走，普通 fetch 会被浏览器直接取消。
 * 统计不准无所谓，绝不能因为打点而拦住跳转，所以既不 await 也不 preventDefault。
 */
function beacon(id: number) {
  try {
    fetch(`/api/links/${id}/click`, { method: 'POST', keepalive: true }).catch(() => {})
  } catch {
    /* 老浏览器不支持 keepalive 就算了，跳转不能受影响 */
  }
}

/** 友链墙的标准卡片 */
export function LinkCard({ item, index }: { item: PublicLink; index: number }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel={item.rel}
      onClick={() => beacon(item.id)}
      // 入场动画走 CSS 而不是 framer-motion：友链数量会随合作方增长，
      // 低端安卓上几十个 motion 实例的开销远大于一条 keyframes（globals.css 有记录）
      className="rise-in group relative flex flex-col rounded-2xl p-5 glass transition-all duration-300 hover:bg-white/[0.07] md:hover:-translate-y-1"
      style={{ animationDelay: `${Math.min(index, 20) * 0.03}s` }}
    >
      <div className="mb-3 flex items-start gap-3">
        <SiteLogo name={item.name} host={item.host} logo={item.logo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold">{item.name}</h3>
            <ArrowUpRight className="w-4 h-4 flex-shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-300" />
          </div>
          <span className="mt-1 block truncate font-mono text-[11px] text-white/30">{item.host}</span>
        </div>
      </div>
      {/* 简介必须静态可读：hover 才出现的信息在触屏上等于不存在 */}
      <p className="line-clamp-2 text-[13px] leading-relaxed text-white/45">
        {item.description || '这个站点还没有写简介'}
      </p>
    </a>
  )
}

/**
 * 招商位卡片。
 *
 * 差异化靠尺寸阶梯（rounded-3xl / p-8 / 64px logo / 大标题 / 整行独占）而不是颜色浓度，
 * 金色只做到「amber/25 的边 + 顶部一条金线 + 10% 暖光」。在纯黑玻璃站里上实色金底，
 * 看起来就是一张贴片广告。
 */
export function SponsorCard({ item }: { item: PublicLink }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel={item.rel}
      onClick={() => beacon(item.id)}
      className="group relative block overflow-hidden rounded-3xl border border-amber-300/25 glass-strong p-6 md:p-8"
    >
      {/* 顶边一条 1px 金线：比整圈金边克制得多，也是这张卡「贵而不俗」的关键 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/10 blur-[80px]" />
      <div className="pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-gradient-to-r from-amber-400/40 via-orange-400/30 to-purple-500/30 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        {/* w-fit 不能省：flex-col 下子项默认 stretch，托盘会被拉成整行的方框，
            64px 的 logo 孤零零漂在中间 —— 手机上一眼就能看出来 */}
        <div className="w-fit shrink-0 rounded-2xl ring-1 ring-amber-300/20">
          <SiteLogo name={item.name} host={item.host} logo={item.logo} size="lg" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-amber-200">
              <Crown className="h-3 w-3" /> 合作伙伴
            </span>
            {/* 付费展位的可见标注。rel="sponsored" 是给搜索引擎看的，这两个字是给人看的 */}
            {/* 付费展位的可见标注。white/25 实测只有 2.3:1 的对比度，等于没标；
                广告标识是合规要求，必须真的能看见 */}
            <span className="text-[11px] text-white/50">广告</span>
          </div>
          <h3 className="mb-1.5 truncate text-xl font-bold md:text-2xl">{item.name}</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-white/50 md:text-[15px]">
            {item.description || '合作伙伴'}
          </p>
          <span className="mt-2 inline-block font-mono text-xs text-white/30">{item.host}</span>
        </div>

        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-medium transition-shadow group-hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]">
            前往
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </a>
  )
}

/**
 * 招商位的次级卡片（第二位及之后）。
 *
 * 只有一家赞助时用整行大卡最有气势；有三四家时全用大卡，页面会变成一列广告，
 * 首屏直接被挤掉。所以第一位保留大卡，其余降一档到两列——
 * 仍然比普通友链显眼（金边、赞助徽章、更大的卡），但不会喧宾夺主。
 */
export function SponsorMiniCard({ item }: { item: PublicLink }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel={item.rel}
      onClick={() => beacon(item.id)}
      className="group relative overflow-hidden rounded-2xl border border-amber-300/15 glass p-5 transition-all duration-300 hover:border-amber-300/30 hover:bg-white/[0.07] md:hover:-translate-y-1"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/[0.07] blur-[60px]" />
      <div className="relative flex items-start gap-3">
        <SiteLogo name={item.name} host={item.host} logo={item.logo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{item.name}</h3>
            <span className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-200/90">
              赞助
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 flex-shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-300" />
          </div>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/45">
            {item.description || '合作伙伴'}
          </p>
          <span className="mt-2 block truncate font-mono text-[11px] text-white/30">{item.host}</span>
        </div>
      </div>
    </a>
  )
}

/**
 * 空招商位。
 *
 * 【为什么空位也要画出来】留白等于告诉访客「这里没人要」。一张同样精致的
 * 「此位招商中」卡片既把版面补齐，本身又是转化入口——稀缺感来自看得见的空位。
 */
export function SponsorSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center transition-colors hover:border-amber-300/40 hover:bg-white/[0.03]"
    >
      <Plus className="h-6 w-6 text-white/25 transition-colors group-hover:text-amber-300" />
      <span className="text-sm text-white/50 transition-colors group-hover:text-white/80">此位招商中 · 点击洽谈</span>
      <span className="text-xs text-white/25">面向 AI 订阅 / 开发者人群</span>
    </button>
  )
}
