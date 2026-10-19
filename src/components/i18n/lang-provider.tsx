'use client'

import { createContext, useContext } from 'react'
import type { SiteLang } from '@/lib/i18n/lang'

/**
 * 当前请求的站点版本（简体 / 繁体香港），由根布局按请求头 x-bg-lang 给出（docs/繁体香港版/设计.md §6）。
 * 服务端渲染与浏览器水合拿到的是同一个值（作为 prop 进了 RSC），所以按它渲染不会出现水合不一致。
 * 用途只有「站内链接加不加 /zh-hk」与语言切换按钮——文字本身由转换代理在输出层统一转繁体，组件里照常写简体。
 */
const LangContext = createContext<SiteLang>('zh-CN')

export function LangProvider({ lang, children }: { lang: SiteLang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useLang(): SiteLang {
  return useContext(LangContext)
}
