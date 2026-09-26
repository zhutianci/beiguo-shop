/**
 * 「超管接口只在主站店面生效」的专用错误（设计 4.7、6.5.4）。
 *
 * requireAdmin()（src/lib/auth.ts，WP1）第一步取店面，非 PLATFORM 就抛它；adminGuard() 把它映射为 404
 * （其余错误仍 403）。这样只调 requireAdmin、不经 adminGuard 的 20 个超管路由在渠道 Host 上同样失效。
 * 休眠时店面恒为主站，永远不会抛出，主站行为不变。
 *
 * 判定请用 isAdminHostError：Next 的不同编译层可能各持一份模块实例，instanceof 不一定可靠，所以同时认 name。
 */
export class AdminHostError extends Error {
  constructor(message = '超管接口只在主站店面生效') {
    super(message)
    this.name = 'AdminHostError'
  }
}

export function isAdminHostError(e: unknown): boolean {
  return e instanceof AdminHostError || (typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AdminHostError')
}
