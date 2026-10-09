import type { Metadata } from 'next'
import { LearnPage } from '@/components/learn/ui'
import { MeClient } from '@/components/learn/me-client'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { moduleMetadata } from '@/lib/storefront/module-meta'

// 我的学习空间（内容平台 P2）：个人数据，不收录
const metadata: Metadata = privatePageMetadata('学习空间')

export default function LearnMePage() {
  return (
    <LearnPage>
      <MeClient />
    </LearnPage>
  )
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(): Promise<Metadata> {
  return moduleMetadata(metadata)
}
