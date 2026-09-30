'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostForm } from '@/components/forum/post-form'

export default function NewPostPage() {
  return (
    <div className="min-h-screen page-top pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {/* lite-blob：手机端轻量模式（2026-10-01，站长要求电脑端不变）下大模糊光斑换成渐变遮罩（iOS WebKit 画大模糊太贵，滑动出黑块），规则见 globals.css 末尾 */}
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />
      <div className="container relative max-w-3xl">
        <Link href="/forum" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回论坛
        </Link>
        <h1 className="text-3xl font-bold mb-6">
          <span className="gradient-text">发布</span>
          <span className="gradient-text-accent">新帖</span>
        </h1>
        <PostForm />
      </div>
    </div>
  )
}
