import { LearnPage, MasonrySkeleton } from '@/components/learn/ui'

/** 路由切换时立即出现的骨架屏：点下去马上有反馈，而不是停在旧页面上等服务端（「流畅」的大半来自这里） */
export default function Loading() {
  return (
    <LearnPage>
      <div className="learn-skeleton mb-6 h-4 w-40" />
      <div className="learn-skeleton mb-4 h-14 w-full max-w-xl" />
      <div className="learn-skeleton mb-12 h-5 w-full max-w-2xl" />
      <MasonrySkeleton />
    </LearnPage>
  )
}
