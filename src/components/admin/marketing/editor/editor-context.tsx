'use client'

/**
 * 编辑器内部共享的上下文：商品/券目录、当前文档配色（色板用）、最近用色、分类、只读状态。
 * 属性表单层级较深，靠 props 一路传会把每个表单的签名撑得很长。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CatalogResponse, ConfigResponse, DocSettings, FooterConfig, MarketingConfig, ProductCard, Topic } from '@/lib/marketing/types'
import { DEFAULT_CONFIG } from '@/lib/marketing/types'
import { normalizeHex } from './util'

export type LoadState = 'loading' | 'ready' | 'error'

export interface EditorContextValue {
  catalog: CatalogResponse
  catalogState: LoadState
  reloadCatalog: () => void
  productMap: Map<number, ProductCard>
  settings: DocSettings
  recentColors: string[]
  pushRecentColor: (c: string) => void
  topic: Topic
  setTopic: (t: Topic) => void
  readOnly: boolean
  /** 上传/处理中的异步提示（例如图片上传失败）；由编辑器外壳统一展示 */
  notify: (msg: string, tone?: 'info' | 'error') => void
}

const Ctx = createContext<EditorContextValue | null>(null)

export function EditorProvider({ value, children }: { value: EditorContextValue; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useEditorCtx(): EditorContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEditorCtx 必须在 <EditorProvider> 内使用')
  return v
}

/* ============================== 最近用色（每个管理员浏览器各自记，仅为便利） ============================== */

const RECENT_KEY = 'mkt-editor-recent-colors'
const RECENT_MAX = 10

export function useRecentColors(): [string[], (c: string) => void] {
  const [list, setList] = useState<string[]>([])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY)
      const arr = raw ? (JSON.parse(raw) as unknown) : []
      if (Array.isArray(arr)) {
        setList(
          arr
            .map((x) => (typeof x === 'string' ? normalizeHex(x) : null))
            .filter((x): x is string => !!x)
            .slice(0, RECENT_MAX)
        )
      }
    } catch {
      // 隐私模式 / 存储被禁用：没有最近用色而已
    }
  }, [])
  const push = useCallback((c: string) => {
    const hex = normalizeHex(c)
    if (!hex) return
    setList((old) => {
      const next = [hex, ...old.filter((x) => x !== hex)].slice(0, RECENT_MAX)
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        /* 同上 */
      }
      return next
    })
  }, [])
  return [list, push]
}

/* ============================== 目录与配置加载 ============================== */

export const EMPTY_CATALOG: CatalogResponse = { products: [], coupons: [] }

export function useCatalog(): { catalog: CatalogResponse; state: LoadState; reload: () => void } {
  const [catalog, setCatalog] = useState<CatalogResponse>(EMPTY_CATALOG)
  const [state, setState] = useState<LoadState>('loading')
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    const ac = new AbortController()
    setState('loading')
    fetch('/api/admin/marketing/catalog', { signal: ac.signal })
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: CatalogResponse }) => {
        if (d?.success && d.data && Array.isArray(d.data.products)) {
          setCatalog({ products: d.data.products, coupons: Array.isArray(d.data.coupons) ? d.data.coupons : [] })
          setState('ready')
        } else {
          setState('error')
        }
      })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setState('error')
      })
    return () => ac.abort()
  }, [nonce])
  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { catalog, state, reload }
}

export function useProductMap(catalog: CatalogResponse): Map<number, ProductCard> {
  return useMemo(() => new Map(catalog.products.map((p) => [p.id, p])), [catalog])
}

/**
 * 预览页脚与主题前缀要用的配置。后台页面读失败回落默认值（设计文档第 4 节「后台页面读失败才回落默认值」），
 * 只影响预览展示；真正发送时由服务端严格读取。
 */
export interface PreviewConfig {
  footer: FooterConfig
  fromAlias: string
  loaded: LoadState
}

export function useMarketingConfig(): PreviewConfig {
  const [cfg, setCfg] = useState<PreviewConfig>(() => ({
    footer: pickFooter(DEFAULT_CONFIG),
    fromAlias: DEFAULT_CONFIG.fromAlias,
    loaded: 'loading',
  }))
  useEffect(() => {
    const ac = new AbortController()
    fetch('/api/admin/marketing/config', { signal: ac.signal })
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: ConfigResponse }) => {
        const c = d?.success ? d.data?.config : null
        if (c && typeof c === 'object') {
          const merged: MarketingConfig = { ...DEFAULT_CONFIG, ...c }
          setCfg({ footer: pickFooter(merged), fromAlias: merged.fromAlias || DEFAULT_CONFIG.fromAlias, loaded: 'ready' })
        } else {
          setCfg((old) => ({ ...old, loaded: 'error' }))
        }
      })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        setCfg((old) => ({ ...old, loaded: 'error' }))
      })
    return () => ac.abort()
  }, [])
  return cfg
}

function pickFooter(c: MarketingConfig): FooterConfig {
  return {
    companyName: c.companyName,
    brandName: c.brandName,
    contactEmail: c.contactEmail,
    footerNote: c.footerNote,
    subjectPrefix: c.subjectPrefix,
  }
}
