/**
 * 前台悬浮组件在哪些页面让位（docs/短信接码-设计.md §1.4「悬浮组件让位」、§6.6 第 31 条）。纯函数，零依赖（客户端组件与检查脚本共用）。
 *
 *  · 左下角成交弹窗（LiveOrderNotification）：/jiema/*、/wallet/* 不渲染——手机上它每隔几秒遮住确认条的价格摘要与充值页底部；
 *  · 右下角客服按钮（FloatingContact）：**只在 /jiema/*** 隐藏（号码页有「联系客服」抽屉、主页面底部钉着确认条，圆按钮正好压在「下一步 / 去支付」上）；
 *    /wallet、/wallet/topup 没有钉在底部的操作条，保留——付了款没到账的买家在那两页就能找到客服。
 */
const under = (p: string, base: string) => p === base || p.startsWith(`${base}/`)

export function hideLiveOrdersOn(pathname: string | null | undefined): boolean {
  const p = pathname ?? ''
  return under(p, '/jiema') || under(p, '/wallet')
}

export function hideFloatingContactOn(pathname: string | null | undefined): boolean {
  return under(pathname ?? '', '/jiema')
}
