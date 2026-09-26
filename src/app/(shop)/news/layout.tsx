import { notFoundOnChannel } from '@/lib/storefront/resolve'

/**
 * 新闻（AI 圈大事记）：渠道站关闭（设计 11.2、实施分包 WP1）。
 *
 * 这一层 layout 只为在渠道 Host 上把整组页面（含子路由）变成 404 而存在：第一行 notFoundOnChannel()，不包进 try。
 * 刻意**不写 metadata**：layout 的 metadata 会被所有子路由继承，写了就会改变主站现有页面的标题 / canonical。
 * 主站（含休眠期的任何 Host）照常渲染，页面行为与改造前相同。
 */
export default async function NewsLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
