/**
 * 「本店暂停营业」横幅（设计 6.7 SUSPENDED）。
 *
 * 由 (shop)/layout.tsx 在店面 status=SUSPENDED 时挂载；主站永远不是 SUSPENDED（平台店面是常量 ACTIVE），
 * 所以主站不会渲染它。横幅只是告知，**拒绝新下单在服务端**（WP2 的下单接口按店面状态拒绝），这里不承担拦截。
 *
 * 【为什么是固定在页头下沿的一条】前台各页面的顶部留白统一由 .page-top 按 --header-h 推导（globals.css），
 * 在文档流里插一条横幅会让每一页的首屏再多出一截或被固定页头压住；挂在页头正下方（top: --header-h）
 * 不改动任何页面的排版，滚动时与页头一起留在视口顶部，买家在哪一页都能看到。
 * 纯展示、无交互、无客户端代码，服务端组件即可。
 */
export function SuspendedBanner() {
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ top: 'var(--header-h, 7rem)' }}
    >
      <div className="pointer-events-auto max-w-2xl rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-1.5 text-center text-xs leading-5 text-amber-200 backdrop-blur-md sm:text-sm">
        本店暂停营业，暂不接受新订单；已下单的订单可照常付款、查看与取卡。
      </div>
    </div>
  )
}
