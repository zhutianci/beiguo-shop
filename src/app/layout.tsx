import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '贝果科技 - Claude & ChatGPT AI 订阅服务',
  description: '贝果科技 - 专业的 AI 服务代开平台，提供 Claude Pro、Claude MAX、ChatGPT Plus、ChatGPT Pro 等订阅服务',
  keywords: '贝果科技,Claude,ChatGPT,AI,代开,订阅,Pro,MAX,Plus',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
