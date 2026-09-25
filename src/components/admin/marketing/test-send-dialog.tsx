'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LintIssue } from '@/lib/marketing/types'
// 只取类型：test-send.ts 的实现是服务端代码，import type 在编译时会被擦掉，不会进浏览器包
import type { TestSendResult } from '@/lib/marketing/test-send'
import { isAbortError, mktFetch } from './api'
import { Modal } from './modal'
import { IssueList } from './check-result'

const MAX_PER_SEND = 5
const LS_KEY = 'mkt:test-recipients'

function readRemembered(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}
function remember(list: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* 无痕模式等写不进去就算了，只是个便利 */
  }
}

/**
 * 测试发送弹窗。收件人只能从「管理员账号邮箱 ∪ 发送设置里的测试收件人」里勾（服务端同样校验），
 * 这是为了不让测试发送变成「给任意地址发广告」的口子（设计 16 节安全审查）。
 *
 * beforeSend：发之前先让编辑器/受众把没存的改动存掉 —— 测过的必须是最新内容，
 * 否则「testedHash 对得上」就是假的。返回 false 表示保存失败，不发。
 */
export function TestSendDialog({
  campaignId,
  open,
  onClose,
  beforeSend,
  onTested,
}: {
  campaignId: number
  open: boolean
  onClose: () => void
  beforeSend?: () => Promise<boolean>
  onTested?: (r: TestSendResult) => void
}) {
  const [allowed, setAllowed] = useState<string[] | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<TestSendResult | null>(null)
  const [sendErr, setSendErr] = useState('')
  const [blockIssues, setBlockIssues] = useState<LintIssue[]>([])
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    setResult(null)
    setSendErr('')
    setBlockIssues([])
    setLoadErr('')
    setAllowed(null)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    ;(async () => {
      try {
        const r = await mktFetch<{ allowed: string[]; remainingToday: number }>(
          `/api/admin/marketing/campaigns/${campaignId}/test`,
          { signal: ctrl.signal }
        )
        if (abortRef.current !== ctrl) return
        if (!r.ok || !r.data) {
          setLoadErr(r.error || '加载测试收件人失败')
          return
        }
        setAllowed(r.data.allowed)
        setRemaining(r.data.remainingToday)
        // 默认勾上上次用过的（仍在允许名单里的）；没有就勾第一个
        const prev = readRemembered().filter((e) => r.data!.allowed.includes(e)).slice(0, MAX_PER_SEND)
        setPicked(new Set(prev.length ? prev : r.data.allowed.slice(0, 1)))
      } catch (e) {
        if (!isAbortError(e)) setLoadErr('加载测试收件人失败')
      }
    })()
    return () => ctrl.abort()
  }, [open, campaignId])

  const toggle = (email: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else if (next.size < MAX_PER_SEND) next.add(email)
      return next
    })
  }

  const send = async () => {
    if (picked.size === 0) return
    setSending(true)
    setSendErr('')
    setBlockIssues([])
    setResult(null)
    try {
      if (beforeSend) {
        const ok = await beforeSend()
        if (!ok) {
          setSendErr('内容还没保存成功，先解决保存问题再发测试（测试的必须是最新内容）。')
          return
        }
      }
      const emails = Array.from(picked)
      const r = await mktFetch<TestSendResult & { issues?: LintIssue[] }>(`/api/admin/marketing/campaigns/${campaignId}/test`, {
        body: { emails },
      })
      if (!r.ok || !r.data) {
        // 接口在内容检查不通过时可能以 400 + data.issues 返回
        const payload = r.data as { issues?: LintIssue[]; remainingToday?: number } | null
        if (payload?.issues?.length) setBlockIssues(payload.issues)
        if (typeof payload?.remainingToday === 'number') setRemaining(payload.remainingToday)
        setSendErr(r.error || '发送失败')
        return
      }
      remember(emails)
      setResult(r.data)
      setRemaining(r.data.remainingToday)
      onTested?.(r.data)
    } finally {
      setSending(false)
    }
  }

  const blockingErrors = result ? result.issues.filter((i) => i.level === 'error') : []
  const anyOk = result?.sent.some((s) => s.ok)

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={sending}
      title="测试发送"
      subtitle="把当前内容发一封到你自己的邮箱，看看真实效果"
      width="max-w-xl"
      footer={
        <>
          {remaining != null && <span className="mr-auto text-xs text-gray-500">24 小时内还能发 {remaining} 封测试</span>}
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {result ? '完成' : '取消'}
          </Button>
          <Button onClick={send} loading={sending} disabled={!allowed || picked.size === 0 || remaining === 0}>
            <Send className="mr-1 h-4 w-4" />
            {result ? '再发一次' : `发送测试（${picked.size}）`}
          </Button>
        </>
      }
    >
      {loadErr ? (
        <p className="py-8 text-center text-sm text-red-600">{loadErr}</p>
      ) : !allowed ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {allowed.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
              没有可用的测试收件人。请到
              <Link href="/admin/marketing/settings" className="mx-1 font-medium text-amber-900 underline">
                发送设置
              </Link>
              里添加「测试收件人」（管理员账号的邮箱也会自动出现在这里）。
            </p>
          ) : (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">
                发给谁 <span className="text-xs font-normal text-gray-400">（一次最多 {MAX_PER_SEND} 个）</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {allowed.map((e) => {
                  const on = picked.has(e)
                  const full = !on && picked.size >= MAX_PER_SEND
                  return (
                    <label
                      key={e}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        on ? 'border-primary-400 bg-primary-50/60' : 'border-gray-200'
                      } ${full ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input type="checkbox" className="h-4 w-4" checked={on} disabled={full} onChange={() => toggle(e)} />
                      <span className="min-w-0 truncate">{e}</span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                想加别的邮箱？到
                <Link href="/admin/marketing/settings" className="mx-0.5 text-primary-600 hover:underline">
                  发送设置
                </Link>
                添加测试收件人。建议 QQ、163、Gmail 各备一个，排版差异很大。
              </p>
            </div>
          )}

          <ul className="space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-500">
            <li>· 主题会带「[测试]」前缀；链接直接打开原网址（不计入点击统计）。</li>
            <li>· 退订链接指向演示页，点了不会改变任何人的订阅状态。</li>
            <li>· 直发优惠券不会真的发到账户，邮件里会标注「测试邮件，未实际发券」。</li>
            <li>· 内容改过之后要重新测试一次才能提交发送。</li>
          </ul>

          {sendErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{sendErr}</p>}
          {blockIssues.length > 0 && <IssueList issues={blockIssues} />}

          {result && (
            <div className="space-y-3">
              {blockingErrors.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-red-700">内容检查没通过，没有发出：</p>
                  <IssueList issues={result.issues} />
                </div>
              )}
              {result.sent.length > 0 && (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {result.sent.map((s) => (
                    <li key={s.email} className="flex items-start gap-2 px-3 py-2 text-sm">
                      {s.ok ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-gray-900">{s.email}</div>
                        <div className={`text-xs ${s.ok ? 'text-gray-500' : 'text-red-600'}`}>
                          {s.ok ? s.note || '已交给阿里云发出，通常 1 分钟内到达（没收到先看垃圾箱）' : s.note || '发送失败'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {anyOk && result.testedCurrent && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  ✓ 已记为「测试过当前内容」，可以去第 ③ 步检查并发送了。
                </p>
              )}
              {anyOk && !result.testedCurrent && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  测试发出了，但内容在测试期间又被修改过 —— 需要再测一次最新内容。
                </p>
              )}
              {result.issues.filter((i) => i.level === 'warn').length > 0 && blockingErrors.length === 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">检查提示（不影响发送）：</p>
                  <IssueList issues={result.issues.filter((i) => i.level === 'warn')} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
