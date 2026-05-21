'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, MessageCircle, Clock, Sparkles } from 'lucide-react'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

const WECHAT_ID = 'GenuineMarxist'

export function ContactModal({ open, onClose }: ContactModalProps) {
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
    navigator.clipboard.writeText(WECHAT_ID)
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
                  <p className="text-white/50 text-sm">扫码或添加微信，开启专属服务</p>
                </div>

                {/* 二维码 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative mb-6"
                >
                  <div className="relative bg-white rounded-2xl p-4">
                    <div className="relative aspect-square w-full max-w-xs mx-auto">
                      <Image
                        src="/wechat-qr.jpg"
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

                {/* 微信号 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-2xl p-4 mb-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/40 mb-1">微信号</div>
                      <div className="font-mono font-bold text-lg">{WECHAT_ID}</div>
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

                {/* 服务时间 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-6 text-sm text-white/60"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>9:00 - 22:00</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
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
