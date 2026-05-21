'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Copy, Check } from 'lucide-react'
import { ContactModal } from './contact-modal'

const WECHAT_ID = 'GenuineMarxist'

export function FloatingContact() {
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(WECHAT_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* 展开的联系卡片 */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-md opacity-60" />
              <div className="relative glass-strong rounded-2xl p-5 w-72 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold">在线客服</span>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>

                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  贝果科技专属客服为你服务<br />
                  9:00 - 22:00 在线响应
                </p>

                {/* 微信号 */}
                <div className="bg-white/5 rounded-xl p-3 mb-3">
                  <div className="text-xs text-white/40 mb-1">客服微信</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm">{WECHAT_ID}</span>
                    <button
                      onClick={handleCopy}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        copied
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setExpanded(false)
                    setModalOpen(true)
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                >
                  查看二维码
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 浮动按钮 */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', bounce: 0.4 }}
          onClick={() => setExpanded(!expanded)}
          className="group relative"
        >
          {/* 脉冲光环 */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-30" />

          {/* 按钮 */}
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 hover:scale-110 transition-transform">
            {expanded ? (
              <X className="w-6 h-6" />
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </div>

          {/* 提示文字 */}
          {!expanded && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full glass text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              联系客服
            </div>
          )}
        </motion.button>
      </div>

      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
