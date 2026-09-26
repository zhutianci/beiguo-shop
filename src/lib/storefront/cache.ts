/**
 * 按店面的进程内缓存——全仓**唯一允许**做跨请求缓存的地方（设计 4.8「缓存纪律」、边界检查第 9 条）。
 *
 * 【为什么要收口】仓库目前 Next 的数据缓存、ISR 重新验证、静态参数生成、强制静态渲染都是 0 处（边界检查规则 9 禁止新增）。
 * 多店面之后，任何忘了把店面放进缓存键的缓存都会让渠道站读到主站价（或反过来）。所以：
 *  · 缓存键**强制**以 sfId 开头（函数签名第一个参数就是 sfId，调用方没法漏）；
 *  · 不用 Next 的 unstable_cache（它的键由调用方拼，漏一项就串店；数据缓存还会跨部署残留），
 *    用单进程 Map + TTL：单容器部署下足够，重启即清空，失败方向只是多查一次库。
 *
 * 用法：
 *   const cachedCards = storefrontCached('home-cards', async (sfId: number, cat: number) => …, 30_000)
 *   await cachedCards(sf.id, 3)
 * 其余参数会被 JSON 序列化进键，只放数字 / 字符串这类稳定值。结果被所有请求共享，调用方不要修改返回对象。
 */

const MAX_ENTRIES_PER_NAME = 500
const stores = new Map<string, Map<string, { exp: number; value: Promise<unknown> }>>()

export function storefrontCached<A extends unknown[], T>(
  name: string,
  fn: (sfId: number, ...args: A) => Promise<T>,
  ttlMs: number,
): (sfId: number, ...args: A) => Promise<T> {
  if (!name || !(ttlMs > 0)) throw new Error('[storefrontCached] name 与 ttlMs 必填')
  let store = stores.get(name)
  if (!store) {
    store = new Map()
    stores.set(name, store)
  }
  const s = store
  return (sfId: number, ...args: A) => {
    if (!Number.isInteger(sfId) || sfId < 1) return Promise.reject(new Error('[storefrontCached] sfId 非法'))
    const key = `${sfId}|${JSON.stringify(args)}`
    const now = Date.now()
    const hit = s.get(key)
    if (hit && hit.exp > now) return hit.value as Promise<T>
    if (hit) s.delete(key)
    while (s.size >= MAX_ENTRIES_PER_NAME) {
      const oldest = s.keys().next()
      if (oldest.done) break
      s.delete(oldest.value)
    }
    const value = fn(sfId, ...args)
    s.set(key, { exp: now + ttlMs, value })
    // 失败的结果不缓存：下一次调用重新查
    value.catch(() => {
      if (s.get(key)?.value === value) s.delete(key)
    })
    return value
  }
}

/** 清掉某个名字（或全部）的缓存：后台改价、改上架后调用 */
export function clearStorefrontCache(name?: string): void {
  if (name) stores.get(name)?.clear()
  else stores.forEach((m) => m.clear())
}
