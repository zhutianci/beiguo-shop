/**
 * Next 内部控制流错误的识别与重抛（设计 4.4 第 7 条、实施分包第 0 节第 8 条）。
 *
 * notFound()、redirect()、以及构建期 headers() / cookies() 抛出的 DynamicServerError 都是「用异常实现的控制流」。
 * 被业务代码的 catch 吞掉的后果：
 *  · DynamicServerError 被吞 → 页面按主站结果在构建期被预渲染，之后同一份 HTML 发给所有 Host（渠道站显示主站价）；
 *  · notFound / redirect 被吞 → 该 404 的变 200、该跳登录的直接渲染。
 * 所以店面解析、notFound、redirect 一律不包进 try；确需 try 时，catch 的第一行写 `rethrowNextInternal(e)`。
 *
 * 判定按 Next 14.2 源码里的 digest 常量（next/dist/client/components/*）：
 *   NEXT_NOT_FOUND、NEXT_REDIRECT;…、DYNAMIC_SERVER_USAGE、BAILOUT_TO_CLIENT_SIDE_RENDERING、NEXT_STATIC_GEN_BAILOUT，
 *   以及 React postpone（$$typeof = Symbol.for('react.postpone')）。不 import next 的内部模块，避免跟随 Next 小版本变路径。
 */

const EXACT_DIGESTS: ReadonlySet<string> = new Set([
  'NEXT_NOT_FOUND',
  'DYNAMIC_SERVER_USAGE',
  'BAILOUT_TO_CLIENT_SIDE_RENDERING',
  'NEXT_STATIC_GEN_BAILOUT',
])

export function isNextInternalError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const rec = e as { digest?: unknown; $$typeof?: unknown }
  if (rec.$$typeof === Symbol.for('react.postpone')) return true
  const d = rec.digest
  if (typeof d !== 'string') return false
  return EXACT_DIGESTS.has(d) || d.startsWith('NEXT_REDIRECT')
}

/** catch 块第一行调用：是 Next 内部控制流错误就原样重抛，否则什么都不做 */
export function rethrowNextInternal(e: unknown): void {
  if (isNextInternalError(e)) throw e
}
