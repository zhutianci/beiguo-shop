/**
 * 分站 PV/UV 的独立开关（docs/微信机器人-设计.md §6.5）：TRACK_CHANNEL_VIEWS=1 时
 *  · (shop)/layout.tsx 在正常营业（ACTIVE）的渠道店面也挂埋点；
 *  · /api/track/view 接收渠道 Host 的上报：page_views / visitors 写 tenant_id = 店面 id，viewer_key 加站点前缀再哈希。
 * 没开时两处与改造前逐字相同（渠道站不挂埋点、/api/track/view 在渠道 Host 404）。主站不受这个开关影响。
 *
 * 只在服务端读（不是 NEXT_PUBLIC_*）。单独成文件，是因为 analytics/classify.ts 也被客户端埋点组件引用，不放环境变量读取。
 * 打开前 nginx 渠道 Host 的 /api 白名单要放行 track/view（nginx/nginx.conf），否则请求在 nginx 就 404。
 */
export function trackChannelViewsEnabled(): boolean {
  return (process.env.TRACK_CHANNEL_VIEWS || '').trim() === '1'
}
