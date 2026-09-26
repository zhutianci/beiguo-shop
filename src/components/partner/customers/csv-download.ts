/**
 * 渠道后台下载 CSV（WP7：客户导出、对账单导出共用）。
 * 用 fetch 而不是直接跳链接：失败时（超限 429、无权 404、未登录 401）能在页面上给出原因，而不是下载到一个 JSON 错误文件。
 */
import { gotoLogin } from '../common/api'

export async function downloadCsv(url: string, fallbackName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!url.startsWith('/api/partner/')) throw new Error('downloadCsv 只能下载 /api/partner 下的文件')
  let res: Response
  try {
    res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
  } catch {
    return { ok: false, error: '网络异常，下载失败' }
  }
  if (!res.ok) {
    if (res.status === 401) {
      gotoLogin()
      return { ok: false, error: '请先登录' }
    }
    const j = (await res.json().catch(() => null)) as { error?: string } | null
    return { ok: false, error: j?.error || (res.status === 429 ? '今日次数已用完' : res.status === 404 ? '内容不存在或无权访问' : '下载失败') }
  }
  const blob = await res.blob()
  const cd = res.headers.get('content-disposition') || ''
  const name = /filename="([^"]+)"/.exec(cd)?.[1] || fallbackName
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  return { ok: true }
}
