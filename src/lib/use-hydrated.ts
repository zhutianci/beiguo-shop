'use client'

import { useEffect, useState } from 'react'

/**
 * 组件是否已在客户端挂载完成（水合之后）。
 *
 * 【为什么需要它】登录态存在 zustand persist（localStorage），而 zustand 4.5 的 useStore
 * 在**水合那一次渲染**里返回的是 store 的初始值（user = null）——
 * 它把 getInitialState 当作 useSyncExternalStore 的 server snapshot，为的是和服务端 HTML 对齐。
 * 于是「我的订单 / 个人中心」这类页面在**整页刷新或从外部链接打开**时，
 * 第一轮 effect 看到的永远是 user=null，立刻 router.push('/login')：
 * 已登录的买家一刷新就被踢到登录页（从站内点链接过去不会，因为那时 store 早已就绪）。
 *
 * 用法：登录态判断的 effect 先等 hydrated 为 true 再看 user。挂载后的那次重渲染里
 * useStore 已经读的是 localStorage 里的真实值。
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}
