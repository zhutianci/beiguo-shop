'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { CheckCircle2, Circle, ClipboardCheck, Loader2, Pencil, Rocket, Send, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AudiencePreview, AudienceSpec, CampaignDetail, CheckResult, ConfigResponse } from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { fmtBytes, fmtTime, isAbortError, mktFetch } from './api'
import { AudienceBuilder } from './audience-builder'
import { CheckResultView, IssueList, issueCounts } from './check-result'
import { ContentPreview, type RenderResponse } from './content-preview'
import { LaunchDialog } from './launch-dialog'
import { TestSendDialog } from './test-send-dialog'
import { TopicBadge } from './status-badge'

// 编辑器体积大（TipTap + framer-motion），只在点「编辑内容」时才加载；ssr:false —— 它直接操作 iframe 与 DOM
const CampaignEditor = dynamic(() => import('@/components/admin/marketing/editor/campaign-editor'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> 正在打开编辑器…
      </div>
    </div>
  ),
})

const AUDIENCE_SAVE_DELAY = 800

type SaveState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'saving' } | { kind: 'saved'; at: number } | { kind: 'error'; message: string }

/**
 * 离开页面（卸载）时还没发出去的受众改动 → 最后一次尽力保存的请求（审查 C22）。
 * 与编辑器 use-autosave 卸载时的补发同一个做法：keepalive（请求体上限约 64KB，超过就普通发送）。
 * 纯函数、单独导出，由 scripts/check-marketing-admin-ui.ts 钉住。
 */
export function audienceUnmountSave(
  spec: AudienceSpec | null,
  c: Pick<CampaignDetail, 'id' | 'updatedAt'>
): { url: string; init: RequestInit } | null {
  if (!spec) return null
  const body = JSON.stringify({ baseUpdatedAt: c.updatedAt, audience: spec })
  return {
    url: `/api/admin/marketing/campaigns/${c.id}`,
    init: { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body, keepalive: body.length < 60000, cache: 'no-store' },
  }
}

/**
 * 第 ③ 步检查结果的失效键（审查 C24）：内容 / 受众变了（updatedAt 变）或测试状态变了都作废。
 * 测试发送故意不改 updatedAt（test-send 写回原值），只看 updatedAt 的话测试成功后仍挂着「还没测试」的旧结果。
 */
export function checkKeyOf(c: Pick<CampaignDetail, 'updatedAt' | 'testedAt' | 'testedCurrent'>): string {
  return `${c.updatedAt}|${c.testedAt ?? ''}|${c.testedCurrent}`
}

/**
 * 草稿活动的三步引导页：① 内容 ② 受众 ③ 检查并发送。
 *
 * 【保存只有一条管道】编辑器与受众都 PUT 同一条活动、都带 baseUpdatedAt。为了不互相 409：
 *  · 打开编辑器、测试发送、检查、发送之前，先把受众的待存改动存掉（flush）
 *  · 编辑器每次保存成功回传最新 CampaignDetail，这里用它更新 updatedAt
 *  · 关掉编辑器后再从服务器拉一次，确保基准是最新的
 */
export function DraftCampaign({
  campaign,
  onCampaignChange,
  reload,
  flushRef,
  config,
}: {
  campaign: CampaignDetail
  onCampaignChange: (c: CampaignDetail) => void
  /** 从服务器重新拉活动（状态可能已变） */
  reload: () => Promise<CampaignDetail | null>
  /** 页面头部的「复制」「另存为模板」要先存盘：这里把 flush 挂上去 */
  flushRef: React.MutableRefObject<(() => Promise<boolean>) | null>
  config: ConfigResponse | null
}) {
  const campaignRef = useRef(campaign)
  campaignRef.current = campaign

  /* ============================== 受众自动保存 ============================== */
  const [audience, setAudience] = useState<AudienceSpec>(campaign.audience)
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })
  const pending = useRef<AudienceSpec | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inflight = useRef<Promise<boolean> | null>(null)
  /** 409 冲突时站长选了「放弃我的修改，载入最新版本」：卸载时的补发不能再把更早的本地改动推上去 */
  const mineDiscarded = useRef(false)

  // 服务器版本的受众变了（冲突后载入、重新拉取）且本地没有待存改动 → 同步到界面
  const serverAudienceKey = JSON.stringify(campaign.audience)
  useEffect(() => {
    if (!pending.current && !inflight.current) setAudience(campaign.audience)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverAudienceKey])

  const putAudience = useCallback(
    async (spec: AudienceSpec, base: string): Promise<boolean> => {
      setSaveState({ kind: 'saving' })
      const r = await mktFetch<CampaignDetail & { server?: CampaignDetail }>(`/api/admin/marketing/campaigns/${campaignRef.current.id}`, {
        method: 'PUT',
        body: { baseUpdatedAt: base, audience: spec },
      })
      if (r.ok && r.data) {
        onCampaignChange(r.data)
        campaignRef.current = r.data
        setSaveState({ kind: 'saved', at: Date.now() })
        return true
      }
      const server = (r.data as { server?: CampaignDetail } | null)?.server
      // 409 有两种：内容被别处改过（服务器版本仍是草稿）、已不是草稿（也附了服务器版本）。
      // 后者不能问「覆盖吗」—— 覆盖必然再 409，会无限弹窗
      if (r.status === 409 && server && server.status === 'DRAFT') {
        // 另一个窗口（或编辑器）先存了。受众是整体替换的，问站长留哪一份
        const overwrite = confirm(
          '受众设置已在别处被修改（可能开着另一个窗口）。\n\n' + '「确定」：用我现在的设置覆盖\n「取消」：放弃我的修改，载入最新版本'
        )
        if (overwrite) return putAudience(spec, server.updatedAt)
        mineDiscarded.current = true
        onCampaignChange(server)
        campaignRef.current = server
        setAudience(server.audience)
        setSaveState({ kind: 'saved', at: Date.now() })
        return true
      }
      if (r.status === 409) {
        // 不再是草稿（例如另一个窗口已经提交发送）→ 整页刷新到最新状态
        setSaveState({ kind: 'error', message: r.error || '活动状态已变化' })
        await reload()
        return false
      }
      setSaveState({ kind: 'error', message: r.error || '保存失败' })
      return false
    },
    [onCampaignChange, reload]
  )

  /** 把待存的受众立即存掉；没有待存改动时直接成功 */
  const flushAudience = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (inflight.current) {
      const ok = await inflight.current
      if (!ok && !pending.current) return false
    }
    const spec = pending.current
    if (!spec) return true
    pending.current = null
    const p = putAudience(spec, campaignRef.current.updatedAt)
    inflight.current = p
    try {
      const ok = await p
      if (!ok) pending.current = pending.current ?? spec // 保存失败：留着，下次重试
      return ok
    } finally {
      inflight.current = null
    }
  }, [putAudience])

  useEffect(() => {
    flushRef.current = flushAudience
    return () => {
      flushRef.current = null
    }
  }, [flushRef, flushAudience])

  const onAudienceChange = (spec: AudienceSpec) => {
    setAudience(spec)
    pending.current = spec
    mineDiscarded.current = false
    setSaveState({ kind: 'pending' })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      void flushAudience()
    }, AUDIENCE_SAVE_DELAY)
  }

  // 有没存的改动时离开页面要提示
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current || inflight.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
  // 卸载（点面包屑 / 标签页 / 侧栏等站内跳转，beforeunload 管不到）：还有没发出去的受众改动就尽力补发一次（审查 C22）。
  // 以前只清定时器，0.8 秒防抖窗口里离开页面，改动悄悄丢了，回来看到的是旧受众
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      const spec = pending.current
      if (!spec) return
      pending.current = null
      const send = () => {
        // 发送那一刻再取 updatedAt：前面在飞的 PUT 成功后会把 campaignRef 换成新版本
        const req = audienceUnmountSave(spec, campaignRef.current)
        if (!req) return
        try {
          void fetch(req.url, req.init).catch(() => {})
        } catch {
          /* 尽力而为 */
        }
      }
      // 还有一个 PUT 在飞（它卸载后照样会跑完）：等它回来再补发这份更新的改动 —— 同时发的话两个 PUT 带同一个
      // baseUpdatedAt，后到的必然 409。它若撞了冲突且站长选了「放弃我的修改」，就不再补发
      const f = inflight.current
      if (f)
        void f.then(
          () => {
            if (!mineDiscarded.current) send()
          },
          send
        )
      else send()
    },
    []
  )

  /* ============================== 编辑器 ============================== */
  const [editorOpen, setEditorOpen] = useState(false)
  const [opening, setOpening] = useState(false)
  const editorFlush = useRef<(() => Promise<CampaignDetail | null>) | null>(null)
  const [sample, setSample] = useState<AudiencePreview['sample']>([])

  const openEditor = async () => {
    setOpening(true)
    try {
      const ok = await flushAudience()
      if (!ok) {
        alert('受众设置还没保存成功，先解决保存问题再编辑内容。')
        return
      }
      setEditorOpen(true)
    } finally {
      setOpening(false)
    }
  }

  const closeEditor = async () => {
    setEditorOpen(false)
    editorFlush.current = null
    // 编辑器关闭前已自行存盘；这里再拉一次最新版本当基准（测试发送也会更新活动）
    await reload()
  }

  /* ============================== 内容摘要（服务端渲染 + 检查） ============================== */
  const [render, setRender] = useState<RenderResponse | null>(null)
  const prefix = config?.config.subjectPrefix || '(AD)'
  const renderCounts = render ? issueCounts(render.issues) : null

  /* ============================== 测试 / 检查 / 发送 ============================== */
  const [testOpen, setTestOpen] = useState(false)
  const [launchOpen, setLaunchOpen] = useState(false)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkErr, setCheckErr] = useState('')
  const checkAbort = useRef<AbortController | null>(null)

  const beforeTest = useCallback(async (): Promise<boolean> => {
    if (editorOpen && editorFlush.current) {
      const c = await editorFlush.current()
      if (!c) return false
      onCampaignChange(c)
      return true
    }
    return flushAudience()
  }, [editorOpen, flushAudience, onCampaignChange])

  const runCheck = async () => {
    const ok = await flushAudience()
    if (!ok) {
      setCheckErr('受众设置还没保存成功，先解决保存问题再检查。')
      return
    }
    checkAbort.current?.abort()
    const ctrl = new AbortController()
    checkAbort.current = ctrl
    setChecking(true)
    setCheckErr('')
    try {
      const r = await mktFetch<CheckResult>(`/api/admin/marketing/campaigns/${campaign.id}/check`, {
        body: { scheduledAt: null },
        signal: ctrl.signal,
      })
      if (checkAbort.current !== ctrl) return
      if (r.ok && r.data) setCheck(r.data)
      else setCheckErr(r.error || '检查失败')
    } catch (e) {
      if (!isAbortError(e)) setCheckErr('检查失败')
    } finally {
      if (checkAbort.current === ctrl) setChecking(false)
    }
  }
  useEffect(() => () => checkAbort.current?.abort(), [])

  // 内容、受众或测试状态变了，上一次的检查结果就过期了（不自动重跑：检查要扫全体用户，按需点）。
  // 审查 C24：键里带上测试状态 —— 测试发送成功不改 updatedAt，只看 updatedAt 会留着「还没测试」的旧结果
  const checkKey = checkKeyOf(campaign)
  const checkedAt = useRef<string | null>(null)
  useEffect(() => {
    if (check && checkedAt.current && checkedAt.current !== checkKey) setCheck(null)
    checkedAt.current = checkKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkKey])

  const halted = !!config?.halt.active
  const disabled = config ? !config.config.enabled : false
  const launchNotice =
    halted || disabled ? (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {halted ? '全局急停中' : '营销发送总开关已关闭'}：可以提交，但要等{halted ? '急停解除' : '开关打开'}后才会真正开始发送。
      </div>
    ) : null

  const subjectEmpty = !campaign.subject.trim()

  return (
    <div className="space-y-6">
      {/* ① 内容 */}
      <StepCard n={1} title="内容" done={!!render && renderCounts?.errors === 0 && !subjectEmpty} desc="排版邮件、写主题；改完先发一封测试给自己看看">
        <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
          {/* 用 div 而不是 button：里面有 iframe，按钮里不能放交互内容 */}
          <div
            role="button"
            tabIndex={0}
            onClick={openEditor}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                void openEditor()
              }
            }}
            className="group relative block w-[300px] max-w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            title="点击编辑内容"
          >
            <ContentPreview
              doc={campaign.doc}
              subject={campaign.subject}
              preheader={campaign.preheader}
              topic={campaign.topic}
              scale={0.5}
              height={400}
              onRendered={setRender}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow">
                <Pencil className="mr-1 inline h-3.5 w-3.5" />
                编辑内容
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[88px_minmax(0,1fr)]">
              <dt className="text-gray-500">邮件主题</dt>
              <dd className="min-w-0 break-all">
                {subjectEmpty ? (
                  <span className="text-red-600">还没填写</span>
                ) : (
                  <>
                    <span className="text-gray-400">{prefix}</span>
                    <span className="text-gray-900">{campaign.subject}</span>
                  </>
                )}
              </dd>
              <dt className="text-gray-500">预览文字</dt>
              <dd className="min-w-0 break-all">
                {campaign.preheader ? (
                  <span className="text-gray-700">{campaign.preheader}</span>
                ) : (
                  <span className="text-amber-600">未填写（建议填：收件箱列表里主题后面那行灰字）</span>
                )}
              </dd>
              <dt className="text-gray-500">内容分类</dt>
              <dd>
                <TopicBadge topic={campaign.topic} />
                <span className="ml-2 text-xs text-gray-400">用户可以按分类退订；带直发券的只能选「优惠活动」</span>
              </dd>
              <dt className="text-gray-500">测试发送</dt>
              <dd>
                {campaign.testedCurrent ? (
                  <span className="text-emerald-700">✓ 已测试当前内容{campaign.testedAt && `（${fmtTime(campaign.testedAt)}）`}</span>
                ) : campaign.testedAt ? (
                  <span className="text-amber-700">内容在上次测试（{fmtTime(campaign.testedAt)}）后改过，需要重新测试</span>
                ) : (
                  <span className="text-amber-700">还没有测试发送过（发送前必须测试一次）</span>
                )}
              </dd>
              {render && (
                <>
                  <dt className="text-gray-500">体积</dt>
                  <dd className="text-gray-700">
                    {fmtBytes(render.sizeBytes)} · 图片 {render.imageCount} 张
                    {render.sizeBytes > 60 * 1024 && <span className="ml-1 text-amber-600">（偏大，Gmail 超过约 100KB 会折叠）</span>}
                  </dd>
                </>
              )}
            </dl>

            {render && render.issues.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-medium text-gray-500">
                  内容检查：
                  {renderCounts!.errors > 0 && <span className="text-red-600">{renderCounts!.errors} 个错误（必须改）</span>}
                  {renderCounts!.errors > 0 && renderCounts!.warns > 0 && '，'}
                  {renderCounts!.warns > 0 && <span className="text-amber-600">{renderCounts!.warns} 条提示</span>}
                </div>
                <IssueList issues={render.issues} max={6} />
              </div>
            )}
            {render && render.issues.length === 0 && <p className="text-sm text-emerald-700">✓ 内容检查没有发现问题</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={openEditor} loading={opening}>
                <Pencil className="mr-1 h-4 w-4" />
                编辑内容
              </Button>
              <Button variant="outline" onClick={() => setTestOpen(true)}>
                <Send className="mr-1 h-4 w-4" />
                发测试
              </Button>
            </div>
          </div>
        </div>
      </StepCard>

      {/* ② 受众 */}
      <StepCard
        n={2}
        title="受众"
        desc="发给谁。只会发给有邮箱、没退订、不在抑制名单里的注册用户"
        right={<SaveIndicator state={saveState} onRetry={() => void flushAudience()} />}
      >
        <AudienceBuilder value={audience} topic={campaign.topic} onChange={onAudienceChange} onPreview={(p) => p && setSample(p.sample)} />
      </StepCard>

      {/* ③ 检查并发送 */}
      <StepCard n={3} title="检查并发送" desc="检查通过、测试过当前内容后才能发送；发送前会再核对一次人数与内容">
        <div className="space-y-4">
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            <Req ok={!subjectEmpty && (renderCounts ? renderCounts.errors === 0 : null)} text="内容检查没有错误" />
            <Req ok={campaign.testedCurrent} text="已测试发送当前内容" />
            <Req ok={check ? check.audience.eligible > 0 : null} text={check ? `可发 ${check.audience.eligible} 人` : '可发人数 > 0（点「检查」确认）'} />
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTestOpen(true)}>
              <Send className="mr-1 h-4 w-4" />
              测试发送
            </Button>
            <Button variant="outline" onClick={runCheck} loading={checking}>
              <ClipboardCheck className="mr-1 h-4 w-4" />
              检查
            </Button>
            <Button onClick={() => setLaunchOpen(true)}>
              <Rocket className="mr-1 h-4 w-4" />
              发送…
            </Button>
            {!check && !checking && <span className="text-xs text-gray-400">「检查」会给出完整问题清单、排除原因和预计几天发完</span>}
          </div>

          {launchNotice}
          {checkErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{checkErr}</p>}
          {check && (
            <div className={checking ? 'opacity-60' : ''}>
              <CheckResultView check={check} />
            </div>
          )}
        </div>
      </StepCard>

      <TestSendDialog
        campaignId={campaign.id}
        open={testOpen}
        onClose={() => setTestOpen(false)}
        beforeSend={beforeTest}
        onTested={() => {
          // 测试成功会更新活动（testedHash），重新拉一次拿到新的 testedCurrent 与 updatedAt
          void reload()
        }}
      />

      <LaunchDialog
        campaign={campaign}
        open={launchOpen}
        onClose={() => setLaunchOpen(false)}
        beforeLaunch={flushAudience}
        notice={launchNotice}
        onLaunched={async (msg) => {
          setLaunchOpen(false)
          await reload()
          alert(msg)
        }}
      />

      {editorOpen && (
        <CampaignEditor
          campaign={campaign}
          onSaved={(c) => onCampaignChange(c)}
          onClose={() => void closeEditor()}
          previewUsers={sample}
          renderActions={(api) => {
            editorFlush.current = api.flush
            return (
              <Button
                size="sm"
                variant="outline"
                disabled={api.saving}
                onClick={async () => {
                  const c = await api.flush()
                  if (!c) {
                    alert('内容还没保存成功，先解决保存问题再发测试（测试的必须是最新内容）。')
                    return
                  }
                  onCampaignChange(c)
                  setTestOpen(true)
                }}
              >
                <Send className="mr-1 h-3.5 w-3.5" />
                发测试
              </Button>
            )
          }}
        />
      )}
    </div>
  )
}

function StepCard({
  n,
  title,
  desc,
  done,
  right,
  children,
}: {
  n: number
  title: string
  desc: string
  done?: boolean
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              done ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700'
            )}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : n}
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
          </div>
        </div>
        {right}
      </div>
      <CardContent className="py-5">{children}</CardContent>
    </Card>
  )
}

function Req({ ok, text }: { ok: boolean | null; text: string }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2',
        ok === true ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : ok === false ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'
      )}
    >
      {ok === true ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : ok === false ? <XCircle className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
      <span className="min-w-0">{text}</span>
    </li>
  )
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state.kind === 'pending') return <span className="text-xs text-gray-400">有改动，稍后自动保存…</span>
  if (state.kind === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> 保存中…
      </span>
    )
  if (state.kind === 'saved') return <span className="text-xs text-emerald-600">✓ 已自动保存</span>
  if (state.kind === 'error')
    return (
      <span className="flex items-center gap-2 text-xs text-red-600">
        保存失败：{state.message}
        <button onClick={onRetry} className="underline">
          重试
        </button>
      </span>
    )
  return null
}
