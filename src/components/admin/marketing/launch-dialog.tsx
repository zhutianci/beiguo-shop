'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CampaignDetail, CheckResult, LintIssue } from '@/lib/marketing/types'
import { fmtInt, fmtMoney, fmtTime, isAbortError, mktFetch, parseBjLocalInput, toBjLocalInput } from './api'
import { CheckResultView, IssueList } from './check-result'
import { Modal } from './modal'

/** 超过这个人数就要手打人数确认 —— 防「手滑点了发送」 */
export const TYPE_CONFIRM_OVER = 100
const MAX_SCHEDULE_DAYS = 60

/** 手打的人数是否与检查结果一致（容忍千分位逗号与空格） */
export function typedMatches(typed: string, eligible: number): boolean {
  return typed.replace(/[,，\s]/g, '') === String(eligible)
}

export interface LaunchGateInput {
  check: Pick<CheckResult, 'canLaunch' | 'coupon'> & { audience: Pick<CheckResult['audience'], 'eligible'> } | null
  /** 检查结果不是按当前选择的发送时间算的 */
  stale: boolean
  checking: boolean
  launching: boolean
  scheduleErr: string
  typed: string
  couponOk: boolean
  /**
   * 打开弹窗时的存盘（beforeLaunch）是否成功了（审查 C20）。
   * 没存成功时服务端的检查与发送都按「上一次存上的旧受众」算，人数、内容指纹照样对得上 —— 只能在这里拦
   */
  saved: boolean
}

export const UNSAVED_BLOCKER = '受众还有未保存的改动'

/**
 * 「发送」按钮的闸门：返回还差哪些条件（空数组 = 可以提交）。
 * 纯函数、单独导出，由 scripts/check-marketing-admin-ui.ts 钉住 —— 这是整个模块里最不能放水的一个按钮。
 */
export function launchBlockers(i: LaunchGateInput): string[] {
  const out: string[] = []
  // 审查 C20：存盘没成功就不许提交，不管检查结果看起来多正常（那是按旧受众算的）
  if (!i.saved) out.push(UNSAVED_BLOCKER)
  if (!i.check) return out.length ? out : ['正在检查']
  if (i.checking || i.stale) out.push('正在按当前选择重新检查')
  if (!i.check.canLaunch) out.push('检查没有通过')
  if (i.check.audience.eligible <= 0) out.push('可发人数为 0')
  if (i.scheduleErr) out.push(i.scheduleErr)
  if (i.check.coupon && !i.couponOk) out.push('请勾选「我已核对优惠力度」')
  if (i.check.audience.eligible > TYPE_CONFIRM_OVER && !typedMatches(i.typed, i.check.audience.eligible)) out.push('请输入收件人数确认')
  if (i.launching) out.push('正在提交')
  return out
}

/**
 * 切换立即/定时、改时间后，要不要（防抖后）自动重新检查（审查 C20）。
 * 存盘没成功时不许：否则检查会按服务器上的旧受众算出一份「通过」的结果，绕过了打开时的存盘。
 */
export function autoRecheckAllowed(i: { saved: boolean; mode: 'now' | 'schedule'; scheduleErr: string }): boolean {
  if (!i.saved) return false
  return !(i.mode === 'schedule' && i.scheduleErr)
}

/** 默认定时：至少一小时之后的整点（北京时间与 UTC 整点对齐，setUTCMinutes 取整不受时区影响） */
function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 60 * 60_000)
  d.setUTCMinutes(0, 0, 0)
  return toBjLocalInput(new Date(d.getTime() + 60 * 60_000))
}

/**
 * 「发送」确认弹窗。
 *
 * 发送前再跑一次完整检查，把「发给多少人、哪些人不发、几天发完、券最多让利多少」摊在面前；
 * 提交时带上检查时的人数与内容指纹（expectedCount / expectedContentHash），服务端发现对不上就 409 ——
 * 这样「检查完之后又有人退订 / 另一个窗口改了内容」不会在站长不知情的情况下发出去。
 * 409 时自动重新检查，要求再确认一次。
 */
export function LaunchDialog({
  campaign,
  open,
  onClose,
  beforeLaunch,
  onLaunched,
  notice,
}: {
  campaign: CampaignDetail
  open: boolean
  onClose: () => void
  /** 先把没存的改动存掉；返回 false 表示没存成功 */
  beforeLaunch?: () => Promise<boolean>
  onLaunched: (message: string) => void
  /** 顶部额外提示（例如总开关关闭中） */
  notice?: React.ReactNode
}) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [when, setWhen] = useState(defaultScheduleValue)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkErr, setCheckErr] = useState('')
  const [couponOk, setCouponOk] = useState(false)
  const [typed, setTyped] = useState('')
  const [launching, setLaunching] = useState(false)
  const [launchErr, setLaunchErr] = useState('')
  const [serverIssues, setServerIssues] = useState<LintIssue[]>([])
  const [changedNote, setChangedNote] = useState('')
  /** 当前检查结果是针对哪个发送时间算的（'now' 或定时的 ISO）；与界面选择不一致时不许提交 */
  const [checkedFor, setCheckedFor] = useState<string | null>(null)
  /** 审查 C20：本次打开后 beforeLaunch 存盘成功了没有；没成功之前不检查、不许提交 */
  const [saved, setSaved] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  /** 第几次打开：关掉弹窗就作废进行中的「存盘 → 检查」（不能靠 effect 的清理函数：切换立即/定时也会触发清理） */
  const openGen = useRef(0)
  /** 界面上此刻的选择。prepare 在 await 存盘之后读它 —— 存盘期间切换了立即/定时，按切换后的算 */
  const selRef = useRef({ mode, when })
  selRef.current = { mode, when }

  const scheduledAt = mode === 'schedule' ? parseBjLocalInput(when) : null
  const scheduleErr = (() => {
    if (mode !== 'schedule') return ''
    if (!scheduledAt) return '请选择发送时间'
    if (scheduledAt.getTime() < Date.now() + 60_000) return '定时发送的时间要晚于现在'
    if (scheduledAt.getTime() > Date.now() + MAX_SCHEDULE_DAYS * 86400_000) return `最多只能定 ${MAX_SCHEDULE_DAYS} 天以内`
    return ''
  })()

  const runCheck = useCallback(
    async (at: Date | null) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setChecking(true)
      setCheckErr('')
      try {
        const r = await mktFetch<CheckResult>(`/api/admin/marketing/campaigns/${campaign.id}/check`, {
          body: { scheduledAt: at ? at.toISOString() : null },
          signal: ctrl.signal,
        })
        if (abortRef.current !== ctrl) return
        if (r.ok && r.data) {
          setCheck(r.data)
          setCheckedFor(at ? at.toISOString() : 'now')
          // 人数或券变了，之前的确认一律作废
          setCouponOk(false)
          setTyped('')
        } else {
          setCheckErr(r.error || '检查失败')
        }
      } catch (e) {
        if (!isAbortError(e)) setCheckErr('检查失败')
      } finally {
        if (abortRef.current === ctrl) setChecking(false)
      }
    },
    [campaign.id]
  )

  /**
   * 先存盘（beforeLaunch），存成功了才检查（审查 C20）。打开弹窗、「重试」、提交遇到 409 都走这里 ——
   * 以前「重试」和切换立即/定时直接调 runCheck，存盘失败后照样能按服务器上的旧受众检查通过并发出去。
   */
  const prepare = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      if (beforeLaunch) {
        setChecking(true)
        setCheckErr('')
        const ok = await beforeLaunch()
        if (isCancelled()) return
        if (!ok) {
          // 进行中的检查（按旧受众算的）也作废，免得它回来后又摆出一份「通过」
          abortRef.current?.abort()
          abortRef.current = null
          setSaved(false)
          setChecking(false)
          setCheckErr('受众或内容还没保存成功，请先解决保存问题（第 ② 步会显示原因）再重试。')
          return
        }
      }
      setSaved(true)
      const s = selRef.current
      await runCheck(s.mode === 'schedule' ? parseBjLocalInput(s.when) : null)
    },
    [beforeLaunch, runCheck]
  )
  /** 绑定到当前这次打开的 prepare（关掉弹窗后回来的结果丢弃） */
  const prepareNow = () => {
    const gen = openGen.current
    return prepare(() => openGen.current !== gen)
  }

  /*
   * 打开时：先存盘，再检查。之后切换立即/定时、改时间 —— 预计完成时间与「券截止日够不够」都跟着变，
   * 防抖后重新检查。检查结果里的人数与内容指纹就是提交时的 expected*，所以任何变化都必须重查。
   * 存盘没成功（saved=false）时不自动重查：只能点「重试」重新存盘（审查 C20）。
   */
  const initialized = useRef(false)
  useEffect(() => {
    if (!open) {
      initialized.current = false
      openGen.current++
      abortRef.current?.abort()
      return
    }
    if (!initialized.current) {
      initialized.current = true
      openGen.current++
      setCheck(null)
      setCheckedFor(null)
      setCheckErr('')
      setLaunchErr('')
      setServerIssues([])
      setChangedNote('')
      setCouponOk(false)
      setTyped('')
      setSaved(false)
      void prepareNow()
      return
    }
    if (!autoRecheckAllowed({ saved, mode, scheduleErr })) return
    const t = setTimeout(() => runCheck(mode === 'schedule' ? parseBjLocalInput(when) : null), 400)
    return () => clearTimeout(t)
    // beforeLaunch / runCheck / scheduleErr / saved 由 open、mode、when 决定，不单独作为触发条件
    // （saved 变 true 时 prepare 自己会接着检查）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, when])

  useEffect(() => () => abortRef.current?.abort(), [])

  const wantFor = mode === 'schedule' ? (scheduledAt ? scheduledAt.toISOString() : '') : 'now'
  const stale = checkedFor !== wantFor
  const eligible = check?.audience.eligible ?? 0
  const needType = eligible > TYPE_CONFIRM_OVER
  const typedOk = !needType || typedMatches(typed, eligible)
  const needCoupon = !!check?.coupon
  const blockers = launchBlockers({ check, stale, checking, launching, scheduleErr, typed, couponOk, saved })
  const canSubmit = blockers.length === 0

  const launch = async () => {
    if (!check || !canSubmit) return
    setLaunching(true)
    setLaunchErr('')
    setServerIssues([])
    setChangedNote('')
    try {
      const r = await mktFetch<unknown>(`/api/admin/marketing/campaigns/${campaign.id}/launch`, {
        body: {
          scheduledAt: mode === 'schedule' && scheduledAt ? scheduledAt.toISOString() : null,
          expectedCount: check.audience.eligible,
          expectedContentHash: check.contentHash,
        },
      })
      if (r.ok) {
        onLaunched(r.message || (r.data as { message?: string } | null)?.message || '已提交发送')
        return
      }
      if (r.status === 409) {
        // 检查之后人数或内容变了：重新检查，让站长看着新数字再确认一次。
        // 走 prepare —— 先把可能还没存的受众存掉再查（审查 C20），不直接 runCheck
        setChangedNote(`${r.error || '发送前数据有变化'}。已按最新数据重新检查，请核对后再确认一次。`)
        await prepareNow()
        return
      }
      const issues = (r.data as { issues?: LintIssue[] } | null)?.issues
      if (issues?.length) setServerIssues(issues)
      setLaunchErr(r.error || '提交失败')
    } finally {
      setLaunching(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={launching}
      width="max-w-3xl"
      title="发送活动"
      subtitle={<span className="break-all">「{campaign.name}」</span>}
      footer={
        <>
          {check && (
            <span className="mr-auto text-xs">
              {blockers.length > 0 && !launching ? (
                <span className="text-amber-700">还差：{blockers.join('、')}</span>
              ) : (
                <span className="text-gray-500">
                  {mode === 'now' ? '提交后下一分钟开始发送' : scheduledAt ? `将于 ${fmtTime(scheduledAt.toISOString())} 开始` : ''}
                </span>
              )}
            </span>
          )}
          <Button variant="outline" onClick={onClose} disabled={launching}>
            取消
          </Button>
          <Button onClick={launch} loading={launching} disabled={!canSubmit}>
            <Rocket className="mr-1 h-4 w-4" />
            {mode === 'now' ? `立即发送给 ${fmtInt(eligible)} 人` : `定时发送给 ${fmtInt(eligible)} 人`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {notice}

        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { k: 'now', title: '立即发送', desc: '下一分钟开始，按发送速度与每日额度匀速发出' },
              { k: 'schedule', title: '定时发送', desc: '到点自动开始（北京时间）；开始前可以撤回修改' },
            ] as const
          ).map((o) => (
            <button
              key={o.k}
              type="button"
              disabled={launching}
              onClick={() => setMode(o.k)}
              className={`rounded-lg border px-3 py-2 text-left ${
                mode === o.k ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{o.title}</div>
              <div className="mt-0.5 text-xs text-gray-500">{o.desc}</div>
            </button>
          ))}
        </div>

        {mode === 'schedule' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">发送时间（北京时间）</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {scheduleErr ? (
              <p className="mt-1 text-xs text-red-600">{scheduleErr}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">按北京时间理解，与你电脑的时区设置无关。不在发送时段内的话，会等到时段开始再发。</p>
            )}
          </div>
        )}

        {changedNote && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{changedNote}</p>}
        {launchErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{launchErr}</p>}
        {serverIssues.length > 0 && (
          <div className="rounded-lg border border-red-200 p-3">
            <p className="mb-2 text-sm font-medium text-red-700">服务端检查没通过：</p>
            <IssueList issues={serverIssues} />
          </div>
        )}

        {checkErr ? (
          <div className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">
            {checkErr}
            {/* 重试 = 重新存盘再检查（审查 C20：以前直接 runCheck，存盘失败也能按旧受众查过） */}
            <button className="ml-2 underline" onClick={() => void prepareNow()}>
              重试
            </button>
          </div>
        ) : !check ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> 正在检查…
          </div>
        ) : (
          <div className={checking || stale ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
            <CheckResultView check={check} />

            {check.canLaunch && (
              <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm leading-relaxed text-gray-700">
                  将向 <span className="font-semibold text-gray-900">{fmtInt(eligible)}</span> 人发送营销邮件
                  {check.eta.finishAt && <>，预计 {fmtTime(check.eta.finishAt)} 发完</>}。
                  主题前的广告标识、退订链接、经营主体与联系邮箱会自动加上。提交后内容就冻结了，不能再改（可以暂停或取消）。
                </p>
                {needCoupon && check.coupon && (
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4" checked={couponOk} onChange={(e) => setCouponOk(e.target.checked)} />
                    <span className="text-gray-800">
                      我已核对优惠力度：最多发出 <b>{fmtInt(check.coupon.maxCount)}</b> 张，最高让利 <b>{fmtMoney(check.coupon.maxGiveaway)}</b>
                    </span>
                  </label>
                )}
                {needType && (
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">
                      收件人较多，请输入收件人数 <b className="tabular-nums">{eligible}</b> 以确认：
                    </label>
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      inputMode="numeric"
                      placeholder={String(eligible)}
                      className={`w-40 rounded-lg border px-3 py-1.5 text-sm tabular-nums ${
                        typed && !typedOk ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
