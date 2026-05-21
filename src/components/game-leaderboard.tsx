'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  id: number
  playerName: string
  isLoggedIn: boolean
  score: number
  duration: number | null
  createdAt: string
}

interface GameLeaderboardProps {
  gameId: string
  refreshKey?: number
  highlightId?: number
  className?: string
}

export function GameLeaderboard({ gameId, refreshKey, highlightId, className = '' }: GameLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/games/${gameId}/leaderboard?limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEntries(data.data.list)
      })
      .finally(() => setLoading(false))
  }, [gameId, refreshKey])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />
    if (rank === 3) return <Award className="w-4 h-4 text-orange-400" />
    return <span className="w-4 h-4 inline-flex items-center justify-center text-xs text-white/40">{rank}</span>
  }

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold">全网排行榜</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-white/40 text-sm">加载中...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">还没有人上榜，快来抢首位！</div>
      ) : (
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  highlightId === entry.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40'
                    : entry.rank <= 3
                      ? 'bg-white/5'
                      : 'hover:bg-white/5'
                }`}
              >
                <div className="w-7 flex items-center justify-center">{getRankIcon(entry.rank)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{entry.playerName}</span>
                    {entry.isLoggedIn && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300">VIP</span>
                    )}
                  </div>
                  {entry.duration != null && (
                    <div className="text-xs text-white/30">
                      用时 {entry.duration}s
                    </div>
                  )}
                </div>
                <div className="font-bold text-lg">
                  {entry.score.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
