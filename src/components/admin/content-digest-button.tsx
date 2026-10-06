'use client'

/** 后台：一键生成「本周 AI 学习精选」营销邮件草稿（内容平台 P2）。生成后跳到营销邮件编辑页，发送仍走原流程 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ContentDigestButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/content/digest', { method: 'POST' })
      const d = await res.json()
      if (d.success) router.push(d.data.href)
      else alert(d.error || '生成失败')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm text-gray-700">
      <span>每周精选邮件：从近 7 天的精选与热门内容生成一封营销邮件草稿，预览、测试、发送都在「营销邮件」里照常操作。</span>
      <Button size="sm" onClick={run} loading={busy}>生成本周精选草稿</Button>
    </div>
  )
}
