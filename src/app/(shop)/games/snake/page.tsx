'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, RotateCcw, Trophy } from 'lucide-react'
import { GameLeaderboard } from '@/components/game-leaderboard'
import { useUserStore } from '@/store/user'

const GRID_SIZE = 20
const CELL_SIZE = 20 // px
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 0, y: 0 }
const SPEEDS = [180, 140, 100, 70] // 难度对应速度（毫秒）

type Point = { x: number; y: number }

function generateFood(snake: Point[]): Point {
  while (true) {
    const food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    if (!snake.some((s) => s.x === food.x && s.y === food.y)) return food
  }
}

export default function SnakePage() {
  const { user } = useUserStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Point>(() => generateFood(INITIAL_SNAKE))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedLevel, setSpeedLevel] = useState(1)
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [highlightId, setHighlightId] = useState<number | undefined>()
  const startTimeRef = useRef<number>(0)
  const dirRef = useRef(direction)

  useEffect(() => {
    dirRef.current = direction
  }, [direction])

  // 绘制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // 食物
    const fx = food.x * CELL_SIZE
    const fy = food.y * CELL_SIZE
    const fg = ctx.createRadialGradient(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, 2, fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2)
    fg.addColorStop(0, '#fbbf24')
    fg.addColorStop(1, '#dc2626')
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.fill()

    // 蛇
    snake.forEach((seg, i) => {
      const x = seg.x * CELL_SIZE
      const y = seg.y * CELL_SIZE
      const isHead = i === 0
      ctx.fillStyle = isHead ? '#a855f7' : `rgba(168, 85, 247, ${0.9 - i * 0.02})`
      ctx.beginPath()
      ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4)
      ctx.fill()
      if (isHead) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }, [snake, food])

  // 游戏循环
  useEffect(() => {
    if (!isPlaying || gameOver) return

    const interval = setInterval(() => {
      setSnake((prev) => {
        const d = dirRef.current
        if (d.x === 0 && d.y === 0) return prev

        const head = { x: prev[0].x + d.x, y: prev[0].y + d.y }

        // 撞墙
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true)
          setIsPlaying(false)
          return prev
        }

        // 撞自己
        if (prev.some((s) => s.x === head.x && s.y === head.y)) {
          setGameOver(true)
          setIsPlaying(false)
          return prev
        }

        const newSnake = [head, ...prev]

        // 吃到食物
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10 * speedLevel)
          setFood(generateFood(newSnake))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, SPEEDS[speedLevel - 1])

    return () => clearInterval(interval)
  }, [isPlaying, gameOver, food, speedLevel])

  // 键盘控制
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const d = dirRef.current
      if ((key === 'arrowup' || key === 'w') && d.y === 0) setDirection({ x: 0, y: -1 })
      else if ((key === 'arrowdown' || key === 's') && d.y === 0) setDirection({ x: 0, y: 1 })
      else if ((key === 'arrowleft' || key === 'a') && d.x === 0) setDirection({ x: -1, y: 0 })
      else if ((key === 'arrowright' || key === 'd') && d.x === 0) setDirection({ x: 1, y: 0 })
      else if (key === ' ') {
        e.preventDefault()
        if (gameOver) resetGame()
        else setIsPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameOver])

  const startGame = () => {
    if (gameOver) resetGame()
    if (direction.x === 0 && direction.y === 0) setDirection({ x: 1, y: 0 })
    setIsPlaying(true)
    if (startTimeRef.current === 0) startTimeRef.current = Date.now()
  }

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setFood(generateFood(INITIAL_SNAKE))
    setScore(0)
    setGameOver(false)
    setSubmitted(false)
    startTimeRef.current = 0
  }

  const handleSubmit = async () => {
    if (submitted || score === 0) return
    setSubmitting(true)
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const res = await fetch('/api/games/snake/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          duration,
          playerName: playerName || undefined,
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

  const handleDirButton = useCallback((dx: number, dy: number) => {
    const d = dirRef.current
    if (dx !== 0 && d.x !== 0) return
    if (dy !== 0 && d.y !== 0) return
    setDirection({ x: dx, y: dy })
  }, [])

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />

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
                  <h1 className="text-2xl font-bold">🐍 贪吃蛇</h1>
                  <p className="text-white/40 text-sm">方向键 / WASD 控制，空格暂停</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40">当前得分</div>
                  <div className="text-3xl font-bold gradient-text-accent">{score}</div>
                </div>
              </div>

              {/* 难度 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-white/50">难度：</span>
                {[1, 2, 3, 4].map((lv) => (
                  <button
                    key={lv}
                    disabled={isPlaying}
                    onClick={() => setSpeedLevel(lv)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all ${
                      speedLevel === lv
                        ? 'bg-emerald-500 text-white'
                        : 'glass hover:bg-white/10 text-white/60'
                    } disabled:opacity-40`}
                  >
                    Lv {lv}
                  </button>
                ))}
              </div>

              <div className="relative inline-block mx-auto" style={{ width: GRID_SIZE * CELL_SIZE }}>
                <canvas
                  ref={canvasRef}
                  width={GRID_SIZE * CELL_SIZE}
                  height={GRID_SIZE * CELL_SIZE}
                  className="rounded-xl border border-white/10 mx-auto block"
                />

                {!isPlaying && !gameOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                    <button
                      onClick={startGame}
                      className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
                    >
                      <Play className="w-4 h-4" />
                      开始游戏
                    </button>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl gap-4">
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
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
                          />
                        )}
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-medium hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          {submitting ? '提交中...' : '提交分数'}
                        </button>
                      </div>
                    )}

                    {submitted && (
                      <div className="text-sm text-emerald-400">已提交到排行榜 🎉</div>
                    )}

                    <button
                      onClick={resetGame}
                      className="px-6 py-2 rounded-full glass hover:bg-white/10 text-sm flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      再玩一次
                    </button>
                  </div>
                )}
              </div>

              {/* 方向控制（移动端） */}
              <div className="md:hidden mt-6 grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
                <div />
                <button onClick={() => handleDirButton(0, -1)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">↑</button>
                <div />
                <button onClick={() => handleDirButton(-1, 0)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">←</button>
                <button onClick={() => setIsPlaying((p) => !p)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">⏯</button>
                <button onClick={() => handleDirButton(1, 0)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">→</button>
                <div />
                <button onClick={() => handleDirButton(0, 1)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">↓</button>
                <div />
              </div>
            </div>
          </div>

          <GameLeaderboard gameId="snake" refreshKey={refreshKey} highlightId={highlightId} />
        </div>
      </div>
    </div>
  )
}
