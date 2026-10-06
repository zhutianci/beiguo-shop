'use client'

/**
 * 作者页上的管理员操作（内容平台 P2）：设为 / 取消 L3 共建者、手工调整积分；P3 加了授予 / 撤销创作者认证。
 * 只有管理员看得到（挂载后问一次 /api/auth/me）；操作走 /api/admin/content/creators（adminGuard）。
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreatorAdmin({ handle, coBuilder, certTitle = null }: { handle: string; coBuilder: boolean; certTitle?: string | null }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setIsAdmin(d?.data?.role === 'ADMIN' || d?.data?.user?.role === 'ADMIN'))
      .catch(() => {})
  }, [])
  if (!isAdmin) return null
  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/content/creators', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle, ...body }) })
    const d = await res.json()
    if (d.success) router.refresh()
    else alert(d.error || '操作失败')
  }
  return (
    <div className="-mt-6 mb-10 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-white/12 p-2.5 text-xs">
      <span className="px-1.5 text-white/35">管理</span>
      <button type="button" onClick={() => patch({ coBuilder: !coBuilder })} className="rounded-full bg-white/[0.06] px-3 py-1.5 text-white/70 hover:bg-white/10">
        {coBuilder ? '取消共建者' : '设为共建者（L3）'}
      </button>
      <button
        type="button"
        onClick={() => {
          const v = Number(prompt('调整积分（正数加、负数减）：') || 0)
          if (v) patch({ adjust: v })
        }}
        className="rounded-full bg-white/[0.06] px-3 py-1.5 text-white/70 hover:bg-white/10"
      >
        调整积分
      </button>
      <button
        type="button"
        onClick={() => {
          if (certTitle) {
            if (confirm(`撤销「${certTitle}」认证？`)) patch({ certTitle: null })
            return
          }
          const t = (prompt('认证头衔（例如：AI 绘画创作者）：') || '').trim()
          if (t) patch({ certTitle: t })
        }}
        className="rounded-full bg-white/[0.06] px-3 py-1.5 text-white/70 hover:bg-white/10"
      >
        {certTitle ? '撤销认证' : '授予认证'}
      </button>
    </div>
  )
}
