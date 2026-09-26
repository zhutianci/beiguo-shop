'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, MessageCircle, Clock, Sparkles, Mail } from 'lucide-react'
import { useStorefront } from '@/components/storefront-provider'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 服务时间的展示写法（二期改动 4.2）。
 * 客服信息收成了店面上的一个值（主站常量 PLATFORM_CONTACT.hours = '9:00-22:00'，渠道自己填的），
 * 而各展示点历来的写法不一样：弹窗 / 浮窗 / 列表页写「9:00 - 22:00」，客服中心公告条写「9:00~22:00」。
 * 用同一个值按展示点推出写法，只改「数字-数字」之间的连接符，主站渲染逐字不变；渠道填的「周一至周五 9:00~18:00」同样适用。
 * 放在这里（'use client' 模块导出的普通函数）：只有客户端组件用它；服务端文案（product-intro）照原样用原值。
 */
export function hoursText(hours: string, sep: ' - ' | '~' = ' - '): string {
  return hours.replace(/(\d)\s*[-~]\s*(\d)/g, `$1${sep}$2`)
}

/**
 * 联系客服弹窗：二维码、微信号、客服邮箱、服务时间都取当前店面的客服信息（useStorefront().contact，二期改动 4.1）。
 * 主站 = PLATFORM_CONTACT（与改造前写死的值逐字相同）；渠道按回退规则：微信号与二维码成组、没设二维码就不显示二维码区。
 * 所有值都是 React 文本节点 / 属性，不用 dangerouslySetInnerHTML；二维码地址在店面解析时已按
 * /uploads/contact/<名>.(png|jpg|webp) 校验过（contact-base.ts），这里不会拿到外站地址。
 */
export function ContactModal({ open, onClose }: ContactModalProps) {
  const { contact } = useStorefront()
  const wechat = contact.wechat
  const qrUrl = contact.qrUrl
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleCopy = () => {
    if (!wechat) return
    navigator.clipboard.writeText(wechat)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md"
          >
            {/* 发光边框 */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-md opacity-60" />

            <div className="relative glass-strong rounded-3xl p-8 overflow-hidden">
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative">
                {/* 头部 */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4"
                  >
                    <MessageCircle className="w-7 h-7" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">联系客服</h2>
                  {/* 副标题跟着实际有的联系方式走：渠道可能只设了微信号或只传了二维码（主站两样都有，文案不变） */}
                  <p className="text-white/50 text-sm">
                    {wechat && qrUrl ? '扫码或添加微信，开启专属服务' : qrUrl ? '微信扫码添加，开启专属服务' : '添加客服微信，开启专属服务'}
                  </p>
                </div>

                {/* 二维码（渠道没传二维码时整块不显示） */}
                {qrUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative mb-6"
                >
                  <div className="relative bg-white rounded-2xl p-4">
                    <div className="relative aspect-square w-full max-w-xs mx-auto">
                      <Image
                        src={qrUrl}
                        alt="微信二维码"
                        fill
                        className="object-contain rounded-lg"
                        priority
                      />
                    </div>
                  </div>
                  <div className="text-center mt-3 text-xs text-white/40">
                    使用微信扫一扫添加好友
                  </div>
                </motion.div>
                )}

                {/* 微信号（渠道只传了二维码、没填微信号时不显示） */}
                {wechat && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-2xl p-4 mb-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/40 mb-1">微信号</div>
                      <div className="font-mono font-bold text-lg">{wechat}</div>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        copied
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
                )}

                {/* 客服邮箱（二期新增；主站没有客服邮箱，不渲染这一块） */}
                {contact.email && (
                  <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-white/40 mb-1">客服邮箱</div>
                      <a href={`mailto:${contact.email}`} className="font-mono text-sm break-all hover:text-purple-300">
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* 服务时间 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-6 text-sm text-white/60"
                >
                  {contact.hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{hoursText(contact.hours)}</span>
                  </div>
                  )}
                  {contact.hours && <div className="w-px h-4 bg-white/10" />}
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>专属服务</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
