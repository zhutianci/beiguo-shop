'use client'

/**
 * 把当前店面的公开 DTO 交给客户端组件（设计 11.1）。根布局（WP1）：
 *   <StorefrontProvider value={toPublicStorefront(sf)}>…</StorefrontProvider>
 * 客户端组件：const { features } = useStorefront()，按 features 决定渲染哪些入口。
 *
 * value 只含 code / kind / origin / features（lib/storefront/public.ts），不含费率、进货价、tenantId。
 * features 只控制显示；真正的拦截全在服务端。
 *
 * 【没有 Provider 时的回退】回退为「主站、全开」：WP1 把根布局包上之前，现有页面的显示必须与今天逐字相同（休眠，设计 4.10）。
 * 这不构成绕过——渠道站的关闭模块由服务端 404，客户端显示错了最多是一个点进去 404 的入口。
 */
import { createContext, useContext } from 'react'
import { storefrontFeatures, type PublicStorefront } from '@/lib/storefront/public'

const FALLBACK: PublicStorefront = { code: 'main', kind: 'PLATFORM', origin: '', features: storefrontFeatures({ kind: 'PLATFORM' }) }

const StorefrontContext = createContext<PublicStorefront | null>(null)

export function StorefrontProvider(props: { value: PublicStorefront; children: React.ReactNode }): JSX.Element {
  return <StorefrontContext.Provider value={props.value}>{props.children}</StorefrontContext.Provider>
}

export function useStorefront(): PublicStorefront {
  return useContext(StorefrontContext) ?? FALLBACK
}
