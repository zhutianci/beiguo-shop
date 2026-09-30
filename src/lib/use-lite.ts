'use client'

import { useSyncExternalStore } from 'react'

/**
 * 手机端轻量模式（2026-10-01，站长要求电脑端不变）。
 *
 * 【为什么要有】iPhone 上的 Safari / Chrome（内核都是 iOS WebKit）进首页后卡一分钟左右、滑动时出现黑块：
 * 页面上常驻的动画（hero 两个一直在转的框、Scroll 提示、打字机、成交弹窗进度条、pulse-glow / ping）
 * 每秒逼出四十来帧，WebKit 每帧都要重算样式、重绘，还要把压在上面的二十多块毛玻璃（backdrop-filter）
 * 和 128px 的大模糊光斑重新模糊一遍。主线程和 GPU 一直占满，来不及画的区域就是黑块。
 * 轻量模式在手机上关掉这些常驻动画、把毛玻璃换成近似的半透明底色，版式与文案不变。
 *
 * 【判定：按设备，不按宽度】(hover: none) and (pointer: coarse) = 主输入是手指、没有悬停。
 *   · 横屏 iPhone 有 844~932px 宽，按宽度判会漏掉；电脑把窗口拖窄也不该变样子（站长：不影响电脑端）。
 *   · iPad / 安卓平板同样是触屏 WebKit/移动 GPU，一起走轻量；带触摸屏的 Windows 笔记本主指针是鼠标，仍是电脑版。
 *   · 报不出这两个媒体特性的老设备 / 老 WebView 判为 false，照旧走现在的版本：不变差，只是没有收益。
 *
 * 【三处必须逐字相同】这条媒体查询同时写在：
 *   1. 这里的 LITE_QUERY（JS 里的开关：停掉 framer-motion 常驻动画、打字机、鼠标光晕等）；
 *   2. tailwind.config.ts 的 `lite:` 变体（类名里的 lite:hidden、lite:bg-black/90 …）；
 *   3. src/app/globals.css 里的 @media 块（.glass / .glass-strong 去毛玻璃、.lite-blob、整站去 backdrop-filter）。
 * 以后要调整范围（比如把某类平板排除），三处一起改。
 */
export const LITE_QUERY = '(hover: none) and (pointer: coarse)'

/** 此刻是否处于轻量模式。只能在 effect / 事件回调里用（服务端恒为 false）。 */
export function isLiteNow(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(LITE_QUERY).matches
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mql = window.matchMedia(LITE_QUERY)
  // iOS 14 以前的 MediaQueryList 没有 addEventListener，只有（已废弃的）addListener
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }
  mql.addListener(onChange)
  return () => mql.removeListener(onChange)
}

/**
 * 组件里用的轻量模式开关。
 *
 * 【水合安全】服务端快照恒为 false：服务端 HTML 与水合那一次渲染完全相同（都是电脑版的 JSX），
 * 不会有水合不一致。手机上水合完成后 React 立刻用真实值（true）再渲染一次，这时才把常驻动画换成静态版本；
 * 水合之后才挂载的组件（成交弹窗、接口回来后的商品卡片）第一次渲染就拿到真实值。
 * 首屏的样子靠 CSS（`lite:` 变体与 globals.css 的 @media 块）保证，从服务端 HTML 第一帧起就是轻量版，
 * 所以这次切换没有版式跳动。
 *
 * 不用全局 <MotionConfig reducedMotion>：framer-motion 在元素挂载时就定死了是否减弱动画，水合后再切换
 * 停不掉已经在跑的无限动画；而 'always' 又会把成交弹窗的滑入和进度条变成瞬间完成（站长要求弹窗行为不变）。
 * 所以逐个组件用这个 hook 判断。
 */
export function useLite(): boolean {
  return useSyncExternalStore(subscribe, isLiteNow, () => false)
}
