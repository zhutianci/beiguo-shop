'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react'
import { GameLeaderboard } from '@/components/game-leaderboard'
import { useUserStore } from '@/store/user'

const SIZE = 4

type Board = number[][]

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-white/5', text: 'text-transparent' },
  2: { bg: 'bg-amber-100', text: 'text-amber-900' },
  4: { bg: 'bg-amber-200', text: 'text-amber-900' },
  8: { bg: 'bg-orange-400', text: 'text-white' },
  16: { bg: 'bg-orange-500', text: 'text-white' },
  32: { bg: 'bg-orange-600', text: 'text-white' },
  64: { bg: 'bg-red-500', text: 'text-white' },
  128: { bg: 'bg-yellow-400', text: 'text-white' },
  256: { bg: 'bg-yellow-500', text: 'text-white' },
  512: { bg: 'bg-purple-500', text: 'text-white' },
  1024: { bg: 'bg-purple-600', text: 'text-white' },
  2048: { bg: 'bg-gradient-to-br from-purple-500 to-pink-500', text: 'text-white' },
  4096: { bg: 'bg-gradient-to-br from-pink-500 to-rose-500', text: 'text-white' },
  8192: { bg: 'bg-gradient-to-br from-cyan-500 to-blue-500', text: 'text-white' },
}

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function addRandom(board: Board): Board {
  const empty: [number, number][] = []
  board.forEach((row, r) => row.forEach((v, c) => v === 0 && empty.push([r, c])))
  if (empty.length === 0) return board
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const newBoard = board.map((row) => [...row])
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4
  return newBoard
}

function initBoard(): Board {
  return addRandom(addRandom(emptyBoard()))
}

// 单行向左合并，返回新行和合并产生的分数
function moveLine(line: number[]): { line: number[]; score: number } {
  const filtered = line.filter((v) => v !== 0)
  const result: number[] = []
  let score = 0
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      score += merged
      i += 2
    } else {
      result.push(filtered[i])
      i++
    }
  }
  while (result.length < SIZE) result.push(0)
  return { line: result, score }
}

function rotateClockwise(board: Board): Board {
  return board[0].map((_, c) => board.map((row) => row[c]).reverse())
}

function rotateCounter(board: Board): Board {
  return board[0].map((_, c) => board.map((row) => row[SIZE - 1 - c]))
}

type Direction = 'left' | 'right' | 'up' | 'down'

function move(board: Board, dir: Direction): { board: Board; score: number; moved: boolean } {
  let working = board
  let rotations = 0
  if (dir === 'up') {
    working = rotateCounter(board)
    rotations = 1
  } else if (dir === 'right') {
    working = rotateClockwise(rotateClockwise(board))
    rotations = 2
  } else if (dir === 'down') {
    working = rotateClockwise(board)
    rotations = 3
  }

  let totalScore = 0
  const newBoard = working.map((row) => {
    const { line, score } = moveLine(row)
    totalScore += score
    return line
  })

  let result = newBoard
  // 反向旋转回去
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result = rotateClockwise(result)
  }

  // 是否发生移动
  const moved = JSON.stringify(board) !== JSON.stringify(result)
  return { board: result, score: totalScore, moved }
}

function isGameOver(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return false
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return false
    }
  }
  return true
}

export default function Game2048Page() {
  const { user } = useUserStore()
  const [board, setBoard] = useState<Board>(initBoard)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [highlightId, setHighlightId] = useState<number | undefined>()
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    const stored = localStorage.getItem('best-2048')
    if (stored) setBest(parseInt(stored))
  }, [])

  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem('best-2048', String(score))
    }
  }, [score, best])

  const handleMove = (dir: Direction) => {
    if (gameOver) return
    const result = move(board, dir)
    if (!result.moved) return

    const next = addRandom(result.board)
    setBoard(next)
    setScore((s) => s + result.score)
    if (isGameOver(next)) setGameOver(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        a: 'left',
        d: 'right',
        w: 'up',
        s: 'down',
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        handleMove(dir)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // 触屏滑动
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else {
      handleMove(dy > 0 ? 'down' : 'up')
    }
    touchStart.current = null
  }

  const reset = () => {
    setBoard(initBoard())
    setScore(0)
    setGameOver(false)
    setSubmitted(false)
    startTimeRef.current = Date.now()
  }

  const handleSubmit = async () => {
    if (submitted || score === 0) return
    setSubmitting(true)
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const max = Math.max(...board.flat())
      const res = await fetch('/api/games/2048/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          duration,
          playerName: playerName || undefined,
          metadata: JSON.stringify({ maxTile: max }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        setHighlightId(data.data.id)
        setRefreshKey((k) => k + 1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative max-w-6xl">
        <Link href="/games" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          返回游戏列表
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">🎯 2048</h1>
                  <p className="text-white/40 text-sm">方向键 / WASD 滑动合并相同数字</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-center">
                    <div className="text-xs text-amber-300">得分</div>
                    <div className="text-xl font-bold text-amber-100">{score}</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-xs text-white/40">最佳</div>
                    <div className="text-xl font-bold">{best}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="mb-4 px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新开始
              </button>

              <div
                className="relative inline-block mx-auto"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-black/30 border border-white/10">
                  {board.flat().map((value, i) => (
                    <motion.div
                      key={i + '-' + value}
                      initial={{ scale: value === 0 ? 1 : 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center font-bold ${
                        TILE_COLORS[value]?.bg || 'bg-gradient-to-br from-pink-600 to-rose-600'
                      } ${TILE_COLORS[value]?.text || 'text-white'} ${
                        value >= 1024 ? 'text-base md:text-lg' : value >= 128 ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'
                      }`}
                    >
                      {value !== 0 && value}
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {gameOver && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl gap-4 p-6"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">游戏结束</div>
                        <div className="text-4xl font-bold gradient-text-accent">{score}</div>
                        <div className="text-xs text-white/40 mt-1">最终得分</div>
                      </div>

                      {!submitted && score > 0 && (
                        <div className="flex flex-col gap-2 w-64">
                          {!user && (
                            <input
                              type="text"
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              placeholder="输入你的昵称（选填）"
                              maxLength={20}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                            />
                          )}
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-medium hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Trophy className="w-4 h-4" />
                            {submitting ? '提交中...' : '提交分数'}
                          </button>
                        </div>
                      )}

                      {submitted && <div className="text-sm text-amber-400">已提交到排行榜 🎉</div>}

                      <button onClick={reset} className="px-6 py-2 rounded-full glass hover:bg-white/10 text-sm flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        再玩一次
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <GameLeaderboard gameId="2048" refreshKey={refreshKey} highlightId={highlightId} />
        </div>
      </div>
    </div>
  )
}
