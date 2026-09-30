'use client'

/**
 * 渠道非主域名 → 主域名的跳转（docs/多渠道分销-自定义域名.md 第 4 节）。
 *
 * 一个渠道可以同时登记子域名（lulu.bigolab.com）与自定义域名（tibo.pw），其中一个是主域名（Tenant.origin）。
 * 在其他域名上打开前台或渠道后台页面时，用 location.replace 换到主域名的同一路径（保留查询串与锚点；replace 不留历史记录，
 * 返回键不会又回到旧域名再被跳一次）。
 *
 * 【为什么放在客户端】Next 14 的服务端布局拿不到当前路径；middleware 的 matcher 是写死的静态四项（/admin、/api/admin、
 * /partner、/api/partner），不覆盖前台页面。跳转只是展示层的便利，安全边界不靠它：店面解析、权限、JWT aud、同源校验
 * 与哪个域名是主域名无关。
 *
 * 【挂在哪】只由 (shop)/layout.tsx 与 partner/layout.tsx 挂载，而且只在服务端判定「当前 Host ≠ 主域名」时才挂
 * （resolve.ts 的 primaryRedirectOrigin）：主站、只有子域名的渠道（lulu、shop）永远不渲染它，页面 DOM 与改造前相同。
 * /api/*、收银台 /pay/*、收据、开票链接、退订、财务台、快捷回复都不在这两个布局之下——带令牌的链接照常在原域名打开，
 * 打开着的旧页面照样能下单、付款。
 *
 * 【防循环】origin 解析失败、不是 http(s)、或主机名已经相同（忽略端口：本地开发带 :3000 也不会误跳）→ 什么都不做。
 * 渲染一个隐藏的空 span（带目标 origin），给 live-channel 测试在 HTML 里确认「旧域名页面挂了跳转、目标是新主域名」。
 */
import { useEffect } from 'react'

export function PrimaryHostRedirect({ origin }: { origin: string }) {
  useEffect(() => {
    let target: URL
    try {
      target = new URL(origin)
    } catch {
      return
    }
    if (target.protocol !== 'https:' && target.protocol !== 'http:') return
    const here = window.location.hostname.toLowerCase().replace(/\.$/, '')
    if (!target.hostname || target.hostname === here) return
    const { pathname, search, hash } = window.location
    window.location.replace(target.origin + pathname + search + hash)
  }, [origin])
  return <span hidden data-primary-host-redirect={origin} />
}
