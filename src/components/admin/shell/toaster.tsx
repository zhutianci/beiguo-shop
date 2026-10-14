'use client'

/**
 * 后台的全局消息提示（控制台改版 2026-10-13）。
 *
 * 后台各页面里有 150 多处 `alert('已保存')` / `alert(data.error || '操作失败')`：浏览器原生弹窗会打断操作、
 * 必须点一下才能继续，样式也和后台完全不搭。这里在后台挂载期间把 window.alert 换成页面右上角的消息条——
 * 各页面一行代码不用改，行为上唯一的区别是「不再阻塞」（alert 没有返回值，没有代码依赖它的阻塞）。
 *
 *  · 成功 / 失败 / 普通三种样式按文案判断（含「失败 / 错误 / 无法…」的算失败，含「成功 / 已保存 / 已…」的算成功）。
 *  · 短消息 3.5 秒自动消失（失败的 6 秒）；**长消息或多行消息不自动消失**，要手动关：
 *    导入结果、批量操作明细这类内容原来靠 alert 的阻塞保证「看过了」，不能悄悄溜走。
 *  · confirm() 不动：它要同步返回是 / 否，换成页面内对话框得逐处改调用方。
 *  · 离开后台（卸载）时把原来的 alert 还回去，前台不受影响。
 */

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  text: string
  tone: Tone
  sticky: boolean
}

const ERROR_RE = /失败|错误|无法|不能|不存在|异常|不合法|无效|超过|不足|请先|请输入|请选择|请填写|未找到|没有权限|已过期|冲突|不允许|不支持/
const SUCCESS_RE = /成功|已保存|已复制|已发|已更新|已删除|已补|已导入|已提交|已取消|已恢复|已启用|已停用|已生效|已同步|已记录|完成/

export function toastTone(text: string): Tone {
  if (ERROR_RE.test(text)) return 'error'
  if (SUCCESS_RE.test(text)) return 'success'
  return 'info'
}

const STYLE: Record<Tone, { icon: typeof Info; iconCls: string; bar: string }> = {
  success: { icon: CheckCircle2, iconCls: 'text-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: AlertCircle, iconCls: 'text-rose-500', bar: 'bg-rose-500' },
  info: { icon: Info, iconCls: 'text-sky-500', bar: 'bg-sky-500' },
}

export function AdminToaster() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  useEffect(() => {
    const original = window.alert
    const timers = new Set<number>()
    const dismiss = (id: number) => setToasts((list) => list.filter((t) => t.id !== id))
    window.alert = (message?: unknown) => {
      const text = String(message ?? '').trim()
      if (!text) return
      const tone = toastTone(text)
      const sticky = text.length > 60 || text.includes('\n')
      const id = ++seq.current
      // 同一句话连着弹（比如连点两次保存）：只留最新的一条
      setToasts((list) => [...list.filter((t) => t.text !== text).slice(-3), { id, text, tone, sticky }])
      if (!sticky) {
        const timer = window.setTimeout(
          () => {
            timers.delete(timer)
            dismiss(id)
          },
          tone === 'error' ? 6000 : 3500
        )
        timers.add(timer)
      }
    }
    return () => {
      window.alert = original
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end" role="status" aria-live="polite">
      {toasts.map((t) => {
        const s = STYLE[t.tone]
        return (
          <div
            key={t.id}
            className="admin-toast pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white py-3 pl-4 pr-3 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)]"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} aria-hidden />
            <s.icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${s.iconCls}`} />
            <div className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{t.text}</div>
            <button
              onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
              className="-mr-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="关闭提示"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
