/**
 * 全站 /api 写请求的同源校验（middleware 用，2026-10-07 安全加固）。纯函数：Edge 安全、scripts/check-* 可直接测。
 *
 * 【为什么】SameSite=Lax 按注册域判断：lulu.bigolab.com、shop.bigolab.com（同行运营的渠道站）、view.bigolab.com
 *  对 bigolab.com 都是 same-site，登录 cookie 照样带上。原来只有后台 / 论坛 / 内容平台 / 上传 / 充值 / 接码下单
 *  在路由里校验，买家侧其余写接口没有——兄弟子域一处 XSS 就能借访客身份下单占收款金额、领券抽奖、改资料、
 *  改绑定、发起接码退款等。
 *
 * 【规则】只管写方法（GET / HEAD / OPTIONS 不管）；判定复用 lib/same-origin 的 crossSiteReason
 *  （跨站或兄弟子域的 Origin / Sec-Fetch-Site 才拒；两个头都没有 = 非浏览器调用，放行）。
 *
 * 【豁免】机器调用与邮件客户端进来的入口。它们本来就不带浏览器头、校验也会放行，列出来是双保险：
 *  收款回调错拒一次就是真金白银的到账不发货（lib/same-origin 文件头的「绝不能加到」清单）。
 */
import { crossSiteReason, type HeaderLike } from './same-origin'

const EXEMPT_PREFIXES = [
  '/api/pay/sms-notify', // SmsForwarder 收款回调
  '/api/cron/', // cron 容器直连
  '/api/bot/wxpad/', // 机器人回调（令牌在路径里）
  '/api/inventory/', // 外部发卡 API（API Key）
  '/api/mkt/unsubscribe/', // RFC 8058 一键退订：邮件服务商的服务器发 POST
]

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** 返回 null = 放行；字符串 = 拒绝原因（只写日志） */
export function apiWriteCrossSite(method: string, pathname: string, h: HeaderLike): string | null {
  if (SAFE_METHODS.has(method.toUpperCase())) return null
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return null
  return crossSiteReason(h)
}
