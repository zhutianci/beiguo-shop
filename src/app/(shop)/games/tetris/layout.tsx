import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'

// 三个游戏页各自一份标题：内容完全不同，共用父页标题只会互相稀释。
// 【不写 canonical】这一层虽然没有子路由，但跟着 games/layout.tsx 的规矩走：
// 带层级的 layout 一律不写 canonical，省得以后有人照着上一层抄出问题。
export const metadata: Metadata = {
  title: `俄罗斯方块 - 在线免费玩 - ${SITE_NAME}`,
  description: '在线玩经典俄罗斯方块，无需下载注册，打开即玩，支持键盘与触屏操作。',
}

export default function TetrisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
