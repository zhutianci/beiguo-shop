'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, Handshake, Loader2, X } from 'lucide-react'

interface ApplyModalProps {
  open: boolean
  onClose: () => void
  /** 打开时预选的位置：从招商区空位点进来就是 SPONSOR */
  defaultSlot?: 'FRIEND' | 'SPONSOR'
  requirements: string[]
}

const FIELD =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'

export function ApplyModal({ open, onClose, defaultSlot = 'FRIEND', requirements }: ApplyModalProps) {
  const [slot, setSlot] = useState<'FRIEND' | 'SPONSOR'>(defaultSlot)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [logo, setLogo] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [website, setWebsite] = useState('') // 蜜罐，真人看不到
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const firstFieldRef = useRef<HTMLInputElement>(null)

  // 每次打开都跟随入口重置：从「此位招商中」点进来就该默认选招商位。
  // 顺带把焦点挪进弹窗——不挪的话键盘用户按 Tab 还在背景页面里游走，
  // 读屏也不会念出弹窗内容。
  useEffect(() => {
    if (open) {
      setSlot(defaultSlot)
      setErr(null)
      setDone(false)
      const t = setTimeout(() => firstFieldRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [open, defaultSlot])

  // 锁滚动 + Esc 关闭。站内其它弹窗都漏了 Esc，这里补上（表单弹窗误触概率更高）
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const submit = async () => {
    setErr(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/links/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          logo: logo.trim() || null,
          description: description.trim(),
          contact: contact.trim(),
          slot,
          website,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDone(true)
        setName('')
        setUrl('')
        setLogo('')
        setDescription('')
        setContact('')
      } else {
        setErr(data.error || '提交失败，请稍后再试')
      }
    } catch {
      setErr('网络异常，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
            className="relative w-full max-w-lg"
          >
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-50 blur-md" />

            {/*
              面板底色刻意压到近乎不透明（而不是照搬 contact-modal 的裸 glass-strong）。
              glass-strong 是 bg-white/10 + backdrop-blur，背后那圈渐变光会被采样进来，
              整块面板泛成紫粉色 —— 联系弹窗只有大字和二维码，看不出问题；
              这里是一张有六个输入框的表单，白/10 的边框和 white/30 的占位符会被那层色雾吃掉。
              实测过：加上这层深色底之后，字段边界才重新看得清。

              滚动条挂在**内层**：关闭按钮若和内容一起滚，手机上翻到表单下半截就找不到出口了
              （移动端没有 Esc 键，遮罩又常常被键盘顶到屏幕外）。
            */}
            <div className="relative max-h-[85vh] overflow-hidden rounded-3xl glass-strong bg-[#0d0a16]/95">
              <button
                onClick={onClose}
                aria-label="关闭"
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full glass transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="max-h-[85vh] overflow-y-auto p-6 md:p-8">
              {done ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 id="apply-modal-title" className="mb-2 text-xl font-bold">已收到你的申请</h3>
                  <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-white/50">
                    我们会逐条人工查看，通过后会用你留的联系方式告知。一般 1~3 个工作日。
                  </p>
                  <button
                    onClick={onClose}
                    className="rounded-full border border-green-500/30 bg-green-500/20 px-6 py-2.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/30"
                  >
                    知道了
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Handshake className="h-7 w-7" />
                    </div>
                    <h3 id="apply-modal-title" className="mb-2 text-2xl font-bold">申请友链 / 招商位</h3>
                    <p className="text-sm text-white/50">填完提交即可，我们人工审核后与你联系</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-white/50">想申请哪个位置</label>
                      <div role="radiogroup" aria-label="想申请哪个位置" className="flex items-center gap-1 rounded-xl glass p-1">
                        {(
                          [
                            { key: 'FRIEND', label: '友情链接（免费互挂）' },
                            { key: 'SPONSOR', label: '招商位（商务合作）' },
                          ] as const
                        ).map((o) => (
                          <button
                            key={o.key}
                            type="button"
                            role="radio"
                            aria-checked={slot === o.key}
                            onClick={() => setSlot(o.key)}
                            className={`flex-1 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                              slot === o.key ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/50">站点名称 *</label>
                      <input
                        ref={firstFieldRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        placeholder="例如：贝果科技"
                        className={FIELD}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/50">站点地址 *</label>
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        maxLength={300}
                        placeholder="https://example.com"
                        className={FIELD}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/50">Logo 地址（选填）</label>
                      <input
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        maxLength={300}
                        placeholder="https://example.com/logo.png　留空则用站名首字生成图标"
                        className={FIELD}
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center justify-between text-sm text-white/50">
                        <span>一句话简介 *</span>
                        <span className="tabular-nums text-xs text-white/30">{description.length}/200</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                        rows={2}
                        placeholder="一句话说明你的站点是做什么的"
                        className={`${FIELD} resize-y`}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/50">联系方式 *</label>
                      <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        maxLength={100}
                        placeholder="邮箱 / 微信 / QQ，仅我们可见"
                        className={FIELD}
                      />
                    </div>

                    {/* 蜜罐：用 left:-9999px 而不是 display:none —— 部分脚本会跳过不可见元素，
                        但对「移出视口」的输入框照填不误 */}
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                    />

                    {requirements.length > 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-[13px] leading-relaxed text-white/45">
                        <div className="mb-2 font-medium text-white/60">申请前请确认</div>
                        <ul className="space-y-1">
                          {requirements.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-white/25">·</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {err && (
                      <p className="flex items-center gap-2 text-sm text-red-400">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {err}
                      </p>
                    )}

                    <button
                      onClick={submit}
                      disabled={submitting || !name.trim() || !url.trim() || !contact.trim() || !description.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 font-semibold transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {submitting ? '提交中...' : '提交申请'}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
