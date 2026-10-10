import type { Storefront } from './resolve'

/**
 * 内容模块下放（docs/多渠道分销-内容模块下放.md）：内容页里给顾客带走的绝对地址（分享链接、海报二维码）在渠道站换成渠道自己的域名。
 * 只换协议 + 域名，路径、查询串原样保留；主站、没有店面、地址解析不了时原样返回（主站逐字不变）。
 * 零依赖（只 import 类型），客户端也能用。
 */
export function channelUrl(sf: Pick<Storefront, 'kind' | 'origin'> | null | undefined, absolute: string): string {
  if (!sf || sf.kind !== 'CHANNEL' || !sf.origin) return absolute
  try {
    const u = new URL(absolute)
    const o = new URL(sf.origin)
    return `${o.origin}${u.pathname}${u.search}${u.hash}`
  } catch {
    return absolute
  }
}
