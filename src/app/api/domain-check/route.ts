export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { error } from '@/lib/api'
import { getStorefront, normalizeHost } from '@/lib/storefront/resolve'
import { DOMAIN_CHECK_NONCE_RE, domainProof } from '@/lib/tenant/domain-verify'

/**
 * 自定义域名连通校验的应答端（docs/多渠道分销-自定义域名.md 第 9 节；发起方是 lib/tenant/domain-verify.ts）。
 *
 * 平台自己经公网请求 https://<自定义域名>/api/domain-check?n=<nonce>，这里回 { proof: HMAC(host | 渠道代号 | nonce) }。
 * 只有请求真的经 Cloudflare → 隧道 → nginx 容器 80 口落到本应用、并且 Host 解析成这个渠道，发起方才能核对通过。
 * nginx 的公网 IP 直连入口（容器 8080）对本路径一律 404：客户把域名 A 记录直接指到服务器 IP、绕开站长的 Cloudflare 时，校验不能通过。
 *
 * 【为什么不鉴权】发起方就是平台自己（服务端 fetch，不带任何凭证），而且这一步本来就要走公网、经过 nginx 的渠道 /api 白名单。
 * 应答只有一个与 nonce 绑定的签名：不回渠道代号、状态、配置；签名的密钥用途只有这一项（tenant/crypto 用途 domain-verify），
 * 拿到了也不能当任何令牌用。
 * 【只在渠道店面应答】主站、未知 Host、停用的域名 → 404（主站没有需要校验的自定义域名）；渠道的任何营业状态都应答——
 * 校验的是「这个域名还接在本站」，与店铺开没开门无关，否则暂停营业期间会被误判成域名失联。
 * getStorefront() 在任何 try 之外调用（resolve.ts 文件头第 7 条）。
 */
export async function GET(request: NextRequest) {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'CHANNEL') return error('资源不存在', 404)
  // 与 getStorefront 同一口径：只读 host 头，规范化后参与签名（发起方用登记的规范化 host 计算期望值）
  const host = normalizeHost(headers().get('host'))
  const nonce = request.nextUrl.searchParams.get('n') ?? ''
  if (!host || !DOMAIN_CHECK_NONCE_RE.test(nonce)) return error('参数不对', 400)
  let proof: string
  try {
    proof = domainProof(host, sf.code, nonce)
  } catch (e) {
    // JWT_SECRET 缺失时 deriveKey 抛：fail closed，发起方按校验失败处理
    console.error('[domain-check] 无法计算校验值', (e as Error)?.message || e)
    return error('暂不可用', 503)
  }
  return NextResponse.json({ success: true, data: { proof } }, { headers: { 'Cache-Control': 'no-store' } })
}
