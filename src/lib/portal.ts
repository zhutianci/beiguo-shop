/**
 * 门户站（docs/门户站-bigoai.md）的站点信息：站名、备案号、联系邮箱。全部来自环境变量，每次调用现读（改完重启 app 即生效，不用构建）。
 *
 *  · PORTAL_SITE_NAME  站名（页头、页脚、关于页）。**必须与 ICP 备案里填的「网站名称」一字不差**；未设置 = 「贝果科技」
 *  · PORTAL_ICP_NO     ICP 备案号，如「湘ICP备2026000000号-1」；未设置 = 页脚不显示（备案下来之前）
 *  · PORTAL_PSB_NO     公安联网备案号，如「湘公网安备43090000000000号」；未设置 = 不显示（ICP 下来后 30 天内办）
 *  · PORTAL_EMAIL      页脚与关于页的联系邮箱；未设置 = 不显示
 *
 * 服务端专用（读 process.env）；客户端组件由外壳把值作为 props 传下去。
 * 新环境变量要同时加进 docker-compose.yml 的 environment（只写进 .env.production 容器里读不到）。
 */
export const OPERATOR_NAME = '益阳市赫山区必高科技有限公司'

export interface PortalFiling {
  icp: string | null
  psb: string | null
  /** 公安备案号里的数字串（查询链接要用）；解析不出为 null */
  psbCode: string | null
  email: string | null
}

function env(name: string, max: number): string | null {
  const v = (process.env[name] || '').trim()
  return v && v.length <= max ? v : null
}

export function portalSiteName(): string {
  return env('PORTAL_SITE_NAME', 20) ?? '贝果科技'
}

export function portalFiling(): PortalFiling {
  const psb = env('PORTAL_PSB_NO', 60)
  const email = env('PORTAL_EMAIL', 120)
  return {
    icp: env('PORTAL_ICP_NO', 60),
    psb,
    psbCode: psb?.match(/\d{8,}/)?.[0] ?? null,
    email: email && /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(email) ? email : null,
  }
}
