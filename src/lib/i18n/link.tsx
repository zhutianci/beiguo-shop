'use client'

/**
 * 全站 `import Link from 'next/link'` 实际拿到的是这个组件（next.config.js 的 webpack 别名 `next/link$`，
 * docs/繁体香港版/设计.md §6.3）：繁体页面上把站内页面链接加上 /zh-hk 前缀，简体页面上与原版 next/link 完全相同。
 *
 * 【为什么用别名而不是逐个改 import】全仓 117 个文件引 next/link，还有 40 个并行分支；别名一处生效、零冲突。
 * 类型检查仍走真正的 next/link（别名只作用于 webpack），所以调用方的写法、属性、ref 都不变。
 * 这里必须从 next/dist/client/link 取原组件——写 'next/link' 会被别名指回自己。
 */
import { forwardRef } from 'react'
import NextLink from 'next/dist/client/link'
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

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(props, ref) {
  const lang = useLang()
  if (lang !== 'zh-HK') return <NextLink ref={ref} {...props} />
  const { href, as, ...rest } = props
  return <NextLink ref={ref} {...rest} href={localizeHref(href)} as={as === undefined ? undefined : localizeHref(as)} />
})

export default Link
