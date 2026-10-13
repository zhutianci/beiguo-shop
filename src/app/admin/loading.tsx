/**
 * 后台页面切换时的占位（性能优化 2026-10-13）。
 *
 * 根布局是按请求渲染的（force-dynamic），后台每个页面又都没有 loading 边界：点侧边栏之后，
 * 在服务端把新页面的外壳发回来之前，旧页面原样停着不动——这台机器内存紧、还隔着一层隧道，常常要等上一秒多，
 * 感觉就是「点了没反应」。有了这一层，点击的同一帧就换成骨架，新页面一到再替换；
 * 侧边栏对各菜单的预取也因此有东西可缓存（没有 loading 边界时，动态页面的预取什么都留不下）。
 *
 * 只是几块灰条，不取数、不带任何客户端代码。后台不被搜索引擎收录，不存在前台那种「流式隐藏块影响收录」的顾虑。
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="页面加载中">
      <div className="h-9 w-56 rounded-xl bg-gray-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-gray-200/70 bg-white" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6">
        <div className="mb-5 h-5 w-40 rounded bg-gray-200/80" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
