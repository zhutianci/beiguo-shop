'use client'

/**
 * 自动保存（设计文档 7.3「自动保存」）。
 *
 * 规则：
 * - 改动后防抖 1.5 秒 PUT /api/admin/marketing/campaigns/[id]，带 baseUpdatedAt（乐观锁）
 * - 同一时刻只有一个 PUT 在飞：保存期间又改了，等这次回来再补一次，避免乱序覆盖
 * - 409 且 data.server.status==='DRAFT' → 冲突（交给界面弹窗：用服务器版本 / 用我的覆盖）
 *   409 且服务器版本已不是草稿（被发出/排期了；或没附 server）→ 锁定，停止保存，显示服务端给的原因。
 *   服务端两种 409 都附 server（审查 C21）：以前只看「有没有 server」，已发出的活动被当成冲突，
 *   「用我的覆盖」必然再 409，弹窗无限循环。判定见 classify409
 * - 400/401/403/404/413 → 显示错误、保持「未保存」，同样的内容不再自动重试（重试也只会得到同样的错）；
 *   内容再变或手动保存（Ctrl+S / flush）时再试
 * - 网络错误 / 5xx / 429 → 指数退避重试（2s、4s、8s … 最长 30s），浏览器恢复联网时立即重试
 * - flush()：立即保存并等待结果，返回最新的 CampaignDetail；保存不成功返回 null。
 *   测试发送、检查、发送、关闭编辑器之前都要先 flush（「先等保存完成」）
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CampaignDetail } from '@/lib/marketing/types'
import { draftFromCampaign, draftKey, type DraftState } from './state'

export type SaveStatus =
  | { kind: 'saved'; at: number | null }
  | { kind: 'dirty' }
  | { kind: 'saving' }
  | { kind: 'retrying'; attempt: number; nextAt: number; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'conflict'; server: CampaignDetail }
  | { kind: 'locked'; message: string }

export const AUTOSAVE_DELAY_MS = 1500
const RETRY_BASE_MS = 2000
const RETRY_MAX_MS = 30000

interface Args {
  campaign: CampaignDetail
  draft: DraftState
  /** false = 只读（不是草稿），不保存 */
  enabled: boolean
  onSaved?: (c: CampaignDetail) => void
}

type Outcome = 'ok' | 'retry' | 'blocked'

export interface AutosaveApi {
  status: SaveStatus
  dirty: boolean
  saving: boolean
  /** 最近一次确认的服务器版本（updatedAt 用作下一次 baseUpdatedAt） */
  server: CampaignDetail
  flush: () => Promise<CampaignDetail | null>
  /** 冲突时二选一。'server'：返回服务器版本的草稿，由调用方换进编辑器；'mine'：带服务器 updatedAt 重新保存 */
  resolveConflict: (choice: 'server' | 'mine') => DraftState | null
  /** 用户明确选择「放弃修改」：之后不再保存（包括卸载时的最后一次尽力保存） */
  discard: () => void
  /** 读「此刻」的保存状态（await flush() 之后组件可能还没重渲染，state 里的 status 是旧的） */
  getStatus: () => SaveStatus
}

async function readJson(res: Response): Promise<{ success?: boolean; data?: unknown; error?: string } | null> {
  try {
    return (await res.json()) as { success?: boolean; data?: unknown; error?: string }
  } catch {
    return null
  }
}

function isCampaignDetail(x: unknown, id: number): x is CampaignDetail {
  const c = x as CampaignDetail | null
  return !!c && typeof c === 'object' && c.id === id && typeof c.updatedAt === 'string' && !!c.doc
}

export type Conflict409 = { kind: 'conflict'; server: CampaignDetail } | { kind: 'locked'; server: CampaignDetail | null }

/**
 * PUT 返回 409 时该怎么办（审查 C21）。服务端「内容被别处改过」与「已不是草稿」都回 409 并附 data.server：
 *  - 服务器版本仍是草稿 → conflict：可以二选一（用服务器的 / 用我的覆盖）
 *  - 服务器版本已不是草稿，或没附（附的不是这条活动）→ locked：内容已冻结，覆盖必然再 409，只能停止保存
 * 纯函数、单独导出，由 scripts/check-marketing-editor.ts 钉住。
 */
export function classify409(server: unknown, id: number): Conflict409 {
  if (!isCampaignDetail(server, id)) return { kind: 'locked', server: null }
  return server.status === 'DRAFT' ? { kind: 'conflict', server } : { kind: 'locked', server }
}

export function useAutosave({ campaign, draft, enabled, onSaved }: Args): AutosaveApi {
  const id = campaign.id
  const key = useMemo(() => draftKey(draft), [draft])

  const serverRef = useRef<CampaignDetail>(campaign)
  const savedKeyRef = useRef<string>(draftKey(draftFromCampaign(campaign)))
  const draftRef = useRef(draft)
  draftRef.current = draft
  const keyRef = useRef(key)
  keyRef.current = key
  const onSavedRef = useRef(onSaved)
  onSavedRef.current = onSaved
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  /** 被什么挡住了：conflict / locked 需要人处理；error 只挡「同一份内容」的自动重试 */
  const blockRef = useRef<{ kind: 'conflict' | 'locked' | 'error'; key: string } | null>(null)
  const inflightRef = useRef<Promise<Outcome> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const mountedRef = useRef(true)

  const [status, setStatusState] = useState<SaveStatus>({ kind: 'saved', at: null })
  const statusRef = useRef<SaveStatus>(status)
  const setStatus = useCallback((s: SaveStatus) => {
    statusRef.current = s
    if (mountedRef.current) setStatusState(s)
  }, [])
  const [server, setServer] = useState<CampaignDetail>(campaign)

  const clearTimers = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (retryRef.current) clearTimeout(retryRef.current)
    debounceRef.current = null
    retryRef.current = null
  }, [])

  // 前向声明：保存完成后可能需要再排一次
  const scheduleRef = useRef<(delay: number) => void>(() => {})

  const saveOnce = useCallback((): Promise<Outcome> => {
    if (inflightRef.current) return inflightRef.current
    const run = async (): Promise<Outcome> => {
      const d = draftRef.current
      const k = draftKey(d)
      if (k === savedKeyRef.current) {
        blockRef.current = null
        if (statusRef.current.kind !== 'saved') setStatus({ kind: 'saved', at: Date.now() })
        return 'ok'
      }
      const block = blockRef.current
      if (block && (block.kind !== 'error' || block.key === k)) return 'blocked'
      blockRef.current = null
      if (!enabledRef.current) return 'blocked'

      setStatus({ kind: 'saving' })
      let res: Response
      try {
        res = await fetch(`/api/admin/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUpdatedAt: serverRef.current.updatedAt,
            name: d.name,
            topic: d.topic,
            subject: d.subject,
            preheader: d.preheader,
            doc: d.doc,
          }),
        })
      } catch {
        return 'retry'
      }
      const body = await readJson(res)

      if (res.ok && body?.success && isCampaignDetail(body.data, id)) {
        const saved = body.data
        serverRef.current = saved
        savedKeyRef.current = k
        attemptRef.current = 0
        if (mountedRef.current) setServer(saved)
        try {
          onSavedRef.current?.(saved)
        } catch {
          // 父组件回调出错不影响保存结果
        }
        if (keyRef.current === k) setStatus({ kind: 'saved', at: Date.now() })
        else setStatus({ kind: 'dirty' })
        return 'ok'
      }

      if (res.status === 409) {
        const c = classify409((body?.data as { server?: unknown } | undefined)?.server, id)
        if (c.kind === 'conflict') {
          blockRef.current = { kind: 'conflict', key: k }
          setStatus({ kind: 'conflict', server: c.server })
        } else {
          // 审查 C21：已不是草稿（被发送/排期了）→ 内容冻结，停止保存并说明原因（不是「冲突」）。
          // 不调 onSaved：状态变 locked 后编辑器只读，关闭时父组件 reload() 会切到非草稿视图，不在编辑中途被卸载
          if (c.server) {
            serverRef.current = c.server
            if (mountedRef.current) setServer(c.server)
          }
          blockRef.current = { kind: 'locked', key: k }
          setStatus({ kind: 'locked', message: body?.error || '活动已不是草稿，不能再修改' })
        }
        return 'blocked'
      }

      // 服务端临时故障 / 限流 / 网关超时：退避重试
      if (res.status >= 500 || res.status === 429 || res.status === 408) return 'retry'

      blockRef.current = { kind: 'error', key: k }
      const msg =
        body?.error ||
        (res.status === 401 || res.status === 403
          ? '登录已失效或没有权限，请在新标签页重新登录后按 Ctrl+S 重试'
          : res.status === 413
            ? '内容太大，保存失败（请减少区块或图片）'
            : `保存失败（HTTP ${res.status}）`)
      setStatus({ kind: 'error', message: msg })
      return 'blocked'
    }
    const p = run()
      .catch((): Outcome => 'retry')
      .then((o) => {
        inflightRef.current = null
        if (o === 'retry') {
          const attempt = ++attemptRef.current
          const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * Math.pow(2, attempt - 1))
          setStatus({ kind: 'retrying', attempt, nextAt: Date.now() + delay, message: '网络异常，稍后自动重试' })
          scheduleRef.current(delay)
        } else if (o === 'ok' && keyRef.current !== savedKeyRef.current && !blockRef.current) {
          // 保存期间又有改动：按正常防抖再排一次
          scheduleRef.current(AUTOSAVE_DELAY_MS)
        }
        return o
      })
    inflightRef.current = p
    return p
  }, [id, setStatus])

  const schedule = useCallback(
    (delay: number) => {
      if (!enabledRef.current) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void saveOnce()
      }, delay)
    },
    [saveOnce]
  )
  scheduleRef.current = schedule

  // 草稿变了 → 标「未保存」并防抖保存；撤销回到已保存的样子 → 直接回到「已保存」
  useEffect(() => {
    if (!enabled) return
    if (key === savedKeyRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = null
      const k = statusRef.current.kind
      if (!inflightRef.current && (k === 'dirty' || k === 'error' || k === 'retrying')) {
        if (retryRef.current) clearTimeout(retryRef.current)
        blockRef.current = null
        setStatus({ kind: 'saved', at: Date.now() })
      }
      return
    }
    const k = statusRef.current.kind
    if (k === 'conflict' || k === 'locked') return
    if (k !== 'saving' && k !== 'retrying') setStatus({ kind: 'dirty' })
    // 重试等待中的内容变化也照常防抖（下一次保存会带上最新内容）
    schedule(AUTOSAVE_DELAY_MS)
  }, [key, enabled, schedule, setStatus])

  // 浏览器恢复联网：立刻重试，不等退避
  useEffect(() => {
    const onOnline = () => {
      if (statusRef.current.kind === 'retrying') {
        attemptRef.current = 0
        schedule(0)
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [schedule])

  const flush = useCallback(async (): Promise<CampaignDetail | null> => {
    clearTimers()
    if (!enabledRef.current) return keyRef.current === savedKeyRef.current ? serverRef.current : null
    // 手动保存：清掉「同内容不重试」的挡板（例如在别的标签页重新登录了）
    if (blockRef.current?.kind === 'error') blockRef.current = null
    for (let i = 0; i < 4; i++) {
      if (inflightRef.current) {
        await inflightRef.current
        clearTimers() // 保存期间排的补存由这里接手
      }
      if (draftKey(draftRef.current) === savedKeyRef.current) return serverRef.current
      if (blockRef.current) return null
      const o = await saveOnce()
      if (o === 'retry' || o === 'blocked') {
        // retry 已由 saveOnce 排上退避；flush 本身不死等网络
        return null
      }
    }
    return draftKey(draftRef.current) === savedKeyRef.current ? serverRef.current : null
  }, [clearTimers, saveOnce])

  const resolveConflict = useCallback(
    (choice: 'server' | 'mine'): DraftState | null => {
      const st = statusRef.current
      if (st.kind !== 'conflict') return null
      const srv = st.server
      serverRef.current = srv
      setServer(srv)
      if (choice === 'mine' && srv.status !== 'DRAFT') {
        // 审查 C21 兜底：服务器版本已不是草稿，覆盖必然再 409 —— 直接锁定，不再重存（classify409 正常不会走到这）
        blockRef.current = { kind: 'locked', key: keyRef.current }
        setStatus({ kind: 'locked', message: '活动已提交发送，内容已冻结，不能再修改' })
        return null
      }
      blockRef.current = null
      attemptRef.current = 0
      if (choice === 'server') {
        const d = draftFromCampaign(srv)
        savedKeyRef.current = draftKey(d)
        setStatus({ kind: 'saved', at: Date.now() })
        try {
          onSavedRef.current?.(srv)
        } catch {
          /* 忽略父组件回调异常 */
        }
        return d
      }
      // 用我的覆盖：以服务器的 updatedAt 为基准立即重存
      setStatus({ kind: 'dirty' })
      schedule(0)
      return null
    },
    [schedule, setStatus]
  )

  // 离开页面前：有未保存内容时让浏览器弹「确定离开？」
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!enabledRef.current) return
      const dirtyNow = keyRef.current !== savedKeyRef.current || !!inflightRef.current
      if (!dirtyNow) return
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // 卸载：清定时器；若还有没存的内容（例如用浏览器「后退」离开了），尽力发最后一次保存（不等结果）
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimers()
      if (!enabledRef.current || blockRef.current || inflightRef.current) return
      const d = draftRef.current
      if (draftKey(d) === savedKeyRef.current) return
      const body = JSON.stringify({
        baseUpdatedAt: serverRef.current.updatedAt,
        name: d.name,
        topic: d.topic,
        subject: d.subject,
        preheader: d.preheader,
        doc: d.doc,
      })
      try {
        void fetch(`/api/admin/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
          // keepalive 的请求体上限约 64KB；超过就普通发送（页面内卸载时通常仍能发出去）
          keepalive: body.length < 60000,
        }).catch(() => {})
      } catch {
        /* 尽力而为 */
      }
    }
  }, [id, clearTimers])

  const discard = useCallback(() => {
    clearTimers()
    enabledRef.current = false
    blockRef.current = { kind: 'locked', key: keyRef.current }
  }, [clearTimers])

  const dirty = key !== savedKeyRef.current
  const saving = status.kind === 'saving'
  const getStatus = useCallback(() => statusRef.current, [])

  return { status, dirty, saving, server, flush, resolveConflict, discard, getStatus }
}
