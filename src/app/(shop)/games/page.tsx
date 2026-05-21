'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Trophy, Gamepad2 } from 'lucide-react'
import { TiltCard } from '@/components/tilt-card'

const games = [
  {
    id: 'snake',
    name: '贪吃蛇',
    description: '经典街机，用方向键控制蛇吃食物长大',
    emoji: '🐍',
    gradient: 'from-emerald-500 to-teal-500',
    difficulty: '简单',
    color: 'text-emerald-400',
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    description: '世界级经典，旋转方块消除整行得分',
    emoji: '🧱',
    gradient: 'from-purple-500 to-pink-500',
    difficulty: '中等',
    color: 'text-purple-400',
  },
  {
    id: '2048',
    name: '2048',
    description: '滑动合并相同数字，挑战 2048 大关',
    emoji: '🎯',
    gradient: 'from-amber-500 to-orange-500',
    difficulty: '中等',
    color: 'text-amber-400',
  },
]

export default function GamesPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">休闲一刻</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">来玩点</span>
            <span className="gradient-text-accent"> 小游戏</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            上线全网排行榜，看你能登顶哪个？
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link href={`/games/${game.id}`}>
                <TiltCard maxTilt={10} scale={1.04} className="group h-full">
                  <div
                    className={`absolute -inset-[1px] bg-gradient-to-r ${game.gradient} rounded-2xl opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500`}
                  />

                  <div className="relative h-full glass rounded-2xl p-8">
                    <div className="text-7xl mb-6">{game.emoji}</div>

                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold">{game.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${game.color}`}>
                        {game.difficulty}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mb-8">{game.description}</p>

                    <div
                      className={`flex items-center justify-between py-3 px-4 rounded-xl bg-gradient-to-r ${game.gradient} font-medium`}
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        开始挑战
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </TiltCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass text-sm text-white/60">
            <Sparkles className="w-4 h-4 text-purple-400" />
            登录后可在排行榜显示你的昵称，分数永久保存
          </div>
        </motion.div>
      </div>
    </div>
  )
}
