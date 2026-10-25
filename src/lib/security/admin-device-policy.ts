/**
 * 「管理员会话必须绑受信设备」的开关口径（2026-10-25 第三轮加固，docs/安全-第三轮加固-1025.md）。
 * 纯函数、零依赖：middleware（Edge）与 lib/auth（Node）共用同一份判断。
 *
 * 以前受信设备 cookie（adm_dev）只在登录那一刻看一眼，之后后台接口只认登录 token：token 被偷（XSS、借用电脑、
 * 恶意扩展、日志泄露）就能在任何地方用 12 小时，而且不会产生任何登录事件。现在后台页面与每个后台接口都要求
 * 同一浏览器里有这个管理员、这个会话版本签发的 adm_dev（httpOnly + SameSite=Strict，前端脚本读不到）。
 *
 * 只在「新设备要邮箱验证码」这套机制本身开着时才要求（否则 adm_dev 根本发不出来，会把站长锁在门外）：
 *   ADMIN_LOGIN_2FA≠0、邮件服务已配置、ADMIN_DEVICE_BIND≠0（应急开关，改 .env.production 后 up -d app 即生效）。
 */
export function adminDeviceRequired(): boolean {
  if (process.env.ADMIN_LOGIN_2FA === '0') return false
  if (process.env.ADMIN_DEVICE_BIND === '0') return false
  const mail = !!(
    process.env.ALIYUN_ACCESS_KEY_ID &&
    process.env.ALIYUN_ACCESS_KEY_SECRET &&
    (process.env.ALIYUN_DM_NOREPLY || process.env.ALIYUN_DM_ACCOUNT)
  )
  return mail
}

export const ADMIN_DEVICE_COOKIE_NAME = 'adm_dev'
