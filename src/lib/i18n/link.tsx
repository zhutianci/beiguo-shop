'use client'

/**
 * 全站 `import Link from 'next/link'` 实际拿到的是这个组件（next.config.js 的 webpack 别名 `next/link$`，
 * docs/繁体香港版/设计.md §6.3）：繁体页面上把站内页面链接加上 /zh-hk 前缀，简体页面上与原版 next/link 完全相同。
 *
 * 【为什么用别名而不是逐个改 import】全仓 117 个文件引 next/link，还有 40 个并行分支；别名一处生效、零冲突。
 * 类型检查仍走真正的 next/link（别名只作用于 webpack），所以调用方的写法、属性、ref 都不变。
 * 这里必须从 next/dist/client/link 取原组件——写 'next/link' 会被别名指回自己。
 *
 * 【预取改成「快点了才取」（2026-10-30，线上实测）】前台页面没有 loading.tsx（route-progress.tsx 注释说明了原因），
 * Next 默认的视口内预取每个链接只拿回约 430B、不含页面数据，点击时还要完整请求一次；这些白费的请求却占了
 * nginx 日志的一半，全都要走跨境隧道。所以关掉默认预取，改成鼠标停留 65ms 或手指按下时完整预取这一个链接：
 * 页面数据和 JS 分块提前下载，点击时能少等一段。爬虫由 router.prefetch 自己跳过。
 * 后台、渠道后台不预取（管理页不必为划过鼠标多打接口）。
 */
import { forwardRef, useContext, useRef } from 'react'
import NextLink from 'next/dist/client/link'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types'
import type { LinkProps } from 'next/link'
import type { UrlObject } from 'url'
import { useLang } from '@/components/i18n/lang-provider'
import { localizePath } from '@/lib/i18n/lang'

type Href = LinkProps['href']

function localizeHref(href: Href): Href {
  if (typeof href === 'string') return localizePath(href, 'zh-HK')
  if (href && typeof href === 'object' && typeof (href as UrlObject).pathname === 'string') {
    const u = href as UrlObject
    return { ...u, pathname: localizePath(u.pathname as string, 'zh-HK') }
  }
  return href
}

type Props = React.ComponentPropsWithoutRef<typeof NextLink>

const HOVER_INTENT_MS = 65

/** 这个链接值不值得预取：只取站内页面；后台、接口、新标签、下载、当前页、省流量模式一律不取 */
function prefetchablePath(href: Href, target?: string, download?: unknown): string | null {
  if (typeof href !== 'string' || (target && target !== '_self') || download !== undefined) return null
  if (!href.startsWith('/') || href.startsWith('//')) return null
  if (/^\/(api|admin|partner)(\/|\?|#|$)/.test(href)) return null
  const path = href.split('#')[0]
  if (path === location.pathname + location.search) return null
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return conn?.saveData ? null : path
}

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(props, ref) {
  const lang = useLang()
  const router = useContext(AppRouterContext)
  const hoverTimer = useRef<number>()
  const { onMouseEnter, onMouseLeave, onTouchStart, ...rest } = props
  const href = lang === 'zh-HK' ? localizeHref(props.href) : props.href
  const as = lang === 'zh-HK' && props.as !== undefined ? localizeHref(props.as) : props.as

  const prefetch = () => {
    const path = prefetchablePath(href, props.target, props.download)
    if (path) router?.prefetch(path, { kind: PrefetchKind.FULL })
  }
  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
      onMouseEnter?.(e)
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = window.setTimeout(prefetch, HOVER_INTENT_MS)
    },
    onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
      onMouseLeave?.(e)
      window.clearTimeout(hoverTimer.current)
    },
    onTouchStart: (e: React.TouchEvent<HTMLAnchorElement>) => {
      onTouchStart?.(e)
      prefetch()
    },
  }

  return <NextLink ref={ref} {...rest} {...handlers} href={href} as={as} prefetch={false} />
})

export default Link
