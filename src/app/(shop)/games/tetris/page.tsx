'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, RotateCcw, Trophy, Pause } from 'lucide-react'
import { GameLeaderboard } from '@/components/game-leaderboard'
import { useUserStore } from '@/store/user'

const COLS = 10
const ROWS = 20
const CELL = 26

type Cell = number // 0 空，1-7 形状颜色
type Shape = number[][]

const SHAPES: Shape[] = [
  // I
  [[1, 1, 1, 1]],
  // O
  [
    [2, 2],
    [2, 2],
  ],
  // T
  [
    [0, 3, 0],
    [3, 3, 3],
  ],
  // S
  [
    [0, 4, 4],
    [4, 4, 0],
  ],
  // Z
  [
    [5, 5, 0],
    [0, 5, 5],
  ],
  // L
  [
    [0, 0, 6],
    [6, 6, 6],
  ],
  // J
  [
    [7, 0, 0],
    [7, 7, 7],
  ],
]

const COLORS = ['', '#22d3ee', '#fbbf24', '#a855f7', '#10b981', '#ef4444', '#f97316', '#3b82f6']

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

function randomShape(): { shape: Shape; x: number; y: number } {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  return {
    shape: shape.map((row) => [...row]),
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  }
}

function rotate(shape: Shape): Shape {
  const rows = shape.length
  const cols = shape[0].length
  const result: Shape = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c]
    }
  }
  return result
}

function isValid(board: Cell[][], shape: Shape, x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue
      const nx = x + c
      const ny = y + r
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false
      if (ny >= 0 && board[ny][nx] !== 0) return false
    }
  }
  return true
}

function merge(board: Cell[][], shape: Shape, x: number, y: number): Cell[][] {
  const newBoard = board.map((row) => [...row])
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0 && y + r >= 0) {
        newBoard[y + r][x + c] = shape[r][c]
      }
    }
  }
  return newBoard
}

function clearLines(board: Cell[][]): { board: Cell[][]; lines: number } {
  const newBoard = board.filter((row) => row.some((c) => c === 0))
  const lines = ROWS - newBoard.length
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0))
  }
  return { board: newBoard, lines }
}

const SCORES = [0, 100, 300, 500, 800]

export default function TetrisPage() {
  const { user } = useUserStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Cell[][]>(emptyBoard)
  const [current, setCurrent] = useState(randomShape)
  const [next, setNext] = useState(randomShape)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [highlightId, setHighlightId] = useState<number | undefined>()
  const startTimeRef = useRef(0)

  const stateRef = useRef({ board, current, isPlaying, gameOver })
  useEffect(() => {
    stateRef.current = { board, current, isPlaying, gameOver }
  }, [board, current, isPlaying, gameOver])

  // 绘制主画板
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL, 0)
      ctx.lineTo(i * CELL, ROWS * CELL)
      ctx.stroke()
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * CELL)
      ctx.lineTo(COLS * CELL, i * CELL)
      ctx.stroke()
    }

    // 已固定的方块
    board.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v !== 0) drawBlock(ctx, c, r, COLORS[v])
      })
    })

    // 当前方块
    current.shape.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v !== 0) drawBlock(ctx, current.x + c, current.y + r, COLORS[v])
      })
    })
  }, [board, current])

  // 绘制下一个方块预览
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const cellSize = 16
    const offsetX = (canvas.width - next.shape[0].length * cellSize) / 2
    const offsetY = (canvas.height - next.shape.length * cellSize) / 2

    next.shape.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v !== 0) {
          ctx.fillStyle = COLORS[v]
          ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize - 1, cellSize - 1)
        }
      })
    })
  }, [next])

  function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 3)
    ctx.fillRect(x * CELL + 1, y * CELL + 1, 3, CELL - 2)
  }

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameOver) return

    const speed = Math.max(100, 800 - (level - 1) * 80)
    const interval = setInterval(() => {
      moveDown()
    }, speed)
    return () => clearInterval(interval)
  }, [isPlaying, gameOver, level])

  const moveDown = useCallback(() => {
    const { board: b, current: cur } = stateRef.current
    if (isValid(b, cur.shape, cur.x, cur.y + 1)) {
      setCurrent({ ...cur, y: cur.y + 1 })
    } else {
      // 落定
      const merged = merge(b, cur.shape, cur.x, cur.y)
      const { board: cleared, lines: clearedLines } = clearLines(merged)
      setBoard(cleared)

      if (clearedLines > 0) {
        setScore((s) => s + SCORES[clearedLines] * level)
        setLines((l) => {
          const total = l + clearedLines
          setLevel(Math.floor(total / 10) + 1)
          return total
        })
      }

      // 生成下一个
      const newCurrent = next
      if (!isValid(cleared, newCurrent.shape, newCurrent.x, newCurrent.y)) {
        setGameOver(true)
        setIsPlaying(false)
        return
      }
      setCurrent(newCurrent)
      setNext(randomShape())
    }
  }, [next, level])

  const moveHorizontal = (dx: number) => {
    const { board: b, current: cur } = stateRef.current
    if (isValid(b, cur.shape, cur.x + dx, cur.y)) {
      setCurrent({ ...cur, x: cur.x + dx })
    }
  }

  const rotateShape = () => {
    const { board: b, current: cur } = stateRef.current
    const rotated = rotate(cur.shape)
    if (isValid(b, rotated, cur.x, cur.y)) {
      setCurrent({ ...cur, shape: rotated })
    }
  }

  const hardDrop = () => {
    const { board: b, current: cur } = stateRef.current
    let y = cur.y
    while (isValid(b, cur.shape, cur.x, y + 1)) y++
    setCurrent({ ...cur, y })
    setTimeout(() => moveDown(), 0)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!stateRef.current.isPlaying || stateRef.current.gameOver) return
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault()
      }
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          moveHorizontal(-1)
          break
        case 'ArrowRight':
        case 'd':
          moveHorizontal(1)
          break
        case 'ArrowDown':
        case 's':
          moveDown()
          break
        case 'ArrowUp':
        case 'w':
          rotateShape()
          break
        case ' ':
          hardDrop()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [moveDown])

  const startGame = () => {
    if (gameOver) reset()
    setIsPlaying(true)
    if (startTimeRef.current === 0) startTimeRef.current = Date.now()
  }

  const reset = () => {
    setBoard(emptyBoard())
    setCurrent(randomShape())
    setNext(randomShape())
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setIsPlaying(false)
    setSubmitted(false)
    startTimeRef.current = 0
  }

  const handleSubmit = async () => {
    if (submitted || score === 0) return
    setSubmitting(true)
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const res = await fetch('/api/games/tetris/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          duration,
          playerName: playerName || undefined,
          metadata: JSON.stringify({ lines, level }),
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
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

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
                  <h1 className="text-2xl font-bold">🧱 俄罗斯方块</h1>
                  <p className="text-white/40 text-sm">← → 移动 · ↑ 旋转 · ↓ 加速 · 空格直落</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative" style={{ width: COLS * CELL }}>
                  <canvas
                    ref={canvasRef}
                    width={COLS * CELL}
                    height={ROWS * CELL}
                    className="rounded-xl border border-white/10"
                  />

                  {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                      <button
                        onClick={startGame}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
                      >
                        <Play className="w-4 h-4" />
                        开始游戏
                      </button>
                    </div>
                  )}

                  {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl gap-4 p-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">游戏结束</div>
                        <div className="text-4xl font-bold gradient-text-accent">{score}</div>
                        <div className="text-xs text-white/40 mt-1">最终得分 · 消除 {lines} 行</div>
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
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                            />
                          )}
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Trophy className="w-4 h-4" />
                            {submitting ? '提交中...' : '提交分数'}
                          </button>
                        </div>
                      )}

                      {submitted && <div className="text-sm text-purple-400">已提交到排行榜 🎉</div>}

                      <button onClick={reset} className="px-6 py-2 rounded-full glass hover:bg-white/10 text-sm flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        再玩一次
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-1">得分</div>
                    <div className="text-2xl font-bold gradient-text-accent">{score}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-1">行数</div>
                    <div className="text-2xl font-bold">{lines}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-1">等级</div>
                    <div className="text-2xl font-bold">{level}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-2">下一个</div>
                    <canvas ref={previewRef} width={80} height={80} className="rounded-lg border border-white/10" />
                  </div>
                  {isPlaying && (
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="glass rounded-xl p-3 hover:bg-white/10 flex items-center justify-center gap-2 text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      暂停
                    </button>
                  )}
                </div>
              </div>

              {/* 移动端控制 */}
              <div className="md:hidden mt-6 grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                <div />
                <button onClick={rotateShape} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">↻</button>
                <div />
                <button onClick={() => moveHorizontal(-1)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">←</button>
                <button onClick={hardDrop} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10 text-xs">直落</button>
                <button onClick={() => moveHorizontal(1)} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">→</button>
                <div />
                <button onClick={moveDown} className="aspect-square glass rounded-lg flex items-center justify-center hover:bg-white/10">↓</button>
                <div />
              </div>
            </div>
          </div>

          <GameLeaderboard gameId="tetris" refreshKey={refreshKey} highlightId={highlightId} />
        </div>
      </div>
    </div>
  )
}
