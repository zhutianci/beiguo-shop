import type { Metadata } from 'next'
import { LearnPage } from '@/components/learn/ui'
import { MeClient } from '@/components/learn/me-client'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 我的学习空间（内容平台 P2）：个人数据，不收录
export const metadata: Metadata = privatePageMetadata('学习空间')

export default function LearnMePage() {
  return (
    <LearnPage>
      <MeClient />
    </LearnPage>
  )
}
