'use client'

import { usePathname as useNextPathname } from 'next/navigation'
import { stripHkPrefix } from '@/lib/i18n/lang'

/**
 * 去掉 /zh-hk 前缀的 usePathname（docs/繁体香港版/设计.md §6.3）。
 * 繁体页面在服务端看到的是去掉前缀的路径（转换代理已剥掉），浏览器里 Next 读的是地址栏（带前缀）——
 * 直接用 next/navigation 的 usePathname 会让导航高亮、按路径显隐的组件在服务端与水合后算出不同结果。
 * 前台按路径判断的组件一律用这个；只有「要记录真实地址」的场景（流量埋点）才用原版。
 */
export function usePathname(): string {
  const p = useNextPathname()
  return p ? stripHkPrefix(p) : p
}
