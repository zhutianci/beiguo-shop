/**
 * 收银台「付款成功后去哪」（docs/短信接码-设计.md §6.6 第 13 条、§10.2「跳转」）。
 * 状态接口对载体单多返回 next；收银台只接受这两种格式（接码号码页、钱包充值结果页），其余一律按原逻辑走，防开放重定向。
 * 纯函数、零依赖，客户端与 scripts/check-wallet-b1.ts 共用（page 文件不能导出任意函数）。
 */
export function safeNext(v: unknown): string | null {
  if (typeof v !== 'string') return null
  if (/^\/jiema\/order\/[0-9A-Za-z]{8,32}$/.test(v)) return v
  if (/^\/wallet\?topup=[0-9A-Za-z]{8,32}$/.test(v)) return v
  return null
}
