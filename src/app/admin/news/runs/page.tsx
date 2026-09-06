'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, PlayCircle, RefreshCw, XCircle } from 'lucide-react'

/**
 * 管线状态与成本（SKILL.md §9）。
 *
 * 这页要能回答三个问题：
 *   哪一段没跑 / 今天烧了多少钱、还剩多少 / 现在到底在用哪个模型。
 * 第三个尤其不能省：qwen-flash、deepseek-chat 这类是别名不是快照，
 * 供应商可以静默把它重指到新版本并涨价，只看配置文件是看不出来的。
 */

interface RunStatus {
  stage: string
  label: string
  desc: string
  key: string | null
  at: string | null
  ok: boolean | null
  message: string | null
  detail: Record<string, unknown> | null
  raw: string | null
  /** setting = 有确切的运行记录；inferred = 从库里的数据痕迹倒推 */
  source: 'setting' | 'inferred' | 'none'
}

interface StageCost {
  stage: string
  calls: number
  ok: number
  failed: number
  costMilli: number
  tokens: number
  avgMs: number
  okRate: number
}

interface Failure {
  id: number
  stage: string
  provider: string
  model: string
  ms: number
  error: string | null
  createdAt: string
}

interface RunsData {
  llm: {
    provider: string
    fastModel: string
    writeModel: string
    baseUrl: string
    configured: boolean
    spentMilli: number
    budgetMilli: number
    remainingMilli: number
    usedPct: number
    exhausted: boolean
    callsToday: number
    tokensToday: number
    costWeekMilli: number
    callsWeek: number
  }
  byStage: StageCost[]
  failures: Failure[]
  runs: RunStatus[]
  pipeline: {
    itemsTotal: number
    itemsRaw: number
    itemsBlocked: number
    itemsUnclustered: number
    eventsTotal: number
    eventsRaw: number
    eventsReview: number
    eventsPublished: number
  }
  sources: { total: number; enabled: number; failing: number; autoDisabled: number }
  relay: { configured: boolean; sources: number; degraded: boolean }
  settings: { key: string; value: string; updatedAt: string }[]
  tz: { offsetMinutes: number; label: string; dayStart: string }
}

/** costMilli 是「毫分」（千分之一分），换算成元要除 100000 */
function yuan(milli: number) {
  return `¥${(milli / 100000).toFixed(4)}`
}
function fmt(s: string | null) {
  if (!s) return '从未运行'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}
function ago(s: string | null) {
  if (!s) return ''
  const min = Math.floor((Date.now() - new Date(s).getTime()) / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

export default function AdminNewsRunsPage() {
  const [data, setData] = useState<RunsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/news/runs')
      const d = await res.json()
      if (d.success) setData(d.data as RunsData)
      else alert(d.error || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const trigger = async (stage: string, label: string, type?: 'DAILY' | 'WEEKLY') => {
    if (!confirm(`确认立即执行「${label}」？\n该段会照常走自己的抢锁逻辑，不会和整点任务并发跑。`)) return
    setRunning(type ? `${stage}:${type}` : stage)
    try {
      const res = await fetch('/api/admin/news/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, ...(type ? { type } : {}) }),
      })
      const d = await res.json()
      alert(d.success ? d.message || '已执行' : d.error || '触发失败')
      load()
    } finally {
      setRunning(null)
    }
  }

  if (loading && !data) {
    return <div className="py-16 text-center text-gray-400">加载中...</div>
  }
  if (!data) {
    return <div className="py-16 text-center text-gray-400">暂无数据</div>
  }

  const { llm, pipeline } = data
  const budgetPct = Math.min(llm.usedPct, 100)

  return (
    <div className="space-y-6">
      {/* 告警条 */}
      {!llm.configured && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>LLM_API_KEY 未配置，triage / cluster / compose 三段全部无法工作，条目只会停在 RAW 状态。</span>
        </div>
      )}
      {llm.exhausted && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            今日 LLM 预算已用尽，管线已自动降级为「只去重、不写摘要」。想恢复请调高 NEWS_DAILY_BUDGET_CENTS，
            或等到明天（按 {data.tz.label} 日切）。
          </span>
        </div>
      )}
      {data.relay.degraded && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>有 {data.relay.sources} 个启用中的信源依赖境外中继，但 NEWS_RELAY_URL 未配置——这些源当前全部失联。</span>
        </div>
      )}

      {/* 供应商与预算 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">当前生效的供应商与模型</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="供应商" v={llm.provider} />
            <Row k="判断题模型（triage / cluster）" v={llm.fastModel} mono />
            <Row k="写作题模型（compose / digest）" v={llm.writeModel} mono />
            <Row k="baseURL" v={llm.baseUrl} mono />
            <Row
              k="API Key"
              v={llm.configured ? '已配置' : '未配置'}
              cls={llm.configured ? 'text-green-600' : 'text-red-600'}
            />
            <p className="pt-1 text-xs text-gray-400">
              这里显示的是环境变量里实际生效的值。别名（qwen-flash / deepseek-chat）会被供应商静默重指到新版本并可能涨价，
              生产环境建议在 LLM_FAST_MODEL / LLM_WRITE_MODEL 里写死带版本号的快照名。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">今日 LLM 花费与预算</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold text-gray-900">{yuan(llm.spentMilli)}</div>
                <div className="text-xs text-gray-500">
                  预算 {yuan(llm.budgetMilli)} · 余量{' '}
                  <span className={llm.exhausted ? 'text-red-600' : 'text-green-600'}>{yuan(llm.remainingMilli)}</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                今日调用 {llm.callsToday} 次 · {llm.tokensToday.toLocaleString()} tokens
                <div>近 7 天 {yuan(llm.costWeekMilli)} / {llm.callsWeek} 次</div>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${budgetPct >= 100 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              日切按固定 {data.tz.label} 偏移计算（起点 {fmt(data.tz.dayStart)}）。超预算当天自动降级为「只去重、不写摘要」，
              不会继续烧钱。
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 各段状态与手动触发 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>管线各段</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              五段各自独立、可重入，任何一段失败都不影响其他段。手动触发走的是同一个 cron 入口，带抢锁。
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.runs.map((r) => (
              <div
                key={r.stage}
                className={`rounded-lg border p-4 ${
                  r.ok === false ? 'border-red-200 bg-red-50/50' : r.at ? 'border-gray-200' : 'border-dashed border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      {r.ok === true && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {r.ok === false && <XCircle className="h-4 w-4 text-red-600" />}
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">{r.desc}</div>
                  </div>
                  {r.stage === 'digest' ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={running === 'digest:DAILY'}
                        onClick={() => trigger(r.stage, `${r.label}（日报）`, 'DAILY')}
                      >
                        日报
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={running === 'digest:WEEKLY'}
                        onClick={() => trigger(r.stage, `${r.label}（周报）`, 'WEEKLY')}
                      >
                        周报
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={running === r.stage}
                      onClick={() => trigger(r.stage, r.label)}
                    >
                      <PlayCircle className="mr-1 h-4 w-4" />
                      执行
                    </Button>
                  )}
                </div>
                <div className="mt-3 text-xs">
                  <div className={r.at ? 'text-gray-700' : 'text-gray-400'}>
                    最近运行：{fmt(r.at)} {r.at && <span className="text-gray-400">（{ago(r.at)}）</span>}
                    {r.source === 'inferred' && (
                      <span className="ml-1 rounded bg-gray-100 px-1 text-gray-500">推断</span>
                    )}
                  </div>
                  {r.message && (
                    <div className={`mt-1 break-words ${r.ok === false ? 'text-red-600' : 'text-gray-500'}`}>
                      {r.message}
                    </div>
                  )}
                  {r.detail && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500">
                      {Object.entries(r.detail)
                        .filter(([k, v]) => typeof v === 'number' && !['at', 'ts'].includes(k))
                        .slice(0, 8)
                        .map(([k, v]) => (
                          <span key={k}>
                            {k} <span className="font-mono text-gray-800">{String(v)}</span>
                          </span>
                        ))}
                    </div>
                  )}
                  {!r.key && r.source !== 'inferred' && (
                    <div className="mt-1 text-gray-400">尚未写入运行状态（Setting 里没有 news_run_{r.stage}）</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 积压与健康 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="原始条目" value={pipeline.itemsTotal} sub={`待分诊 ${pipeline.itemsRaw} · 已拦截 ${pipeline.itemsBlocked}`} warn={pipeline.itemsRaw > 200} />
        <StatCard label="待聚类条目" value={pipeline.itemsUnclustered} sub="分诊通过但还没归入事件" warn={pipeline.itemsUnclustered > 100} />
        <StatCard label="事件" value={pipeline.eventsTotal} sub={`已发布 ${pipeline.eventsPublished} · 待摘要 ${pipeline.eventsRaw}`} warn={pipeline.eventsRaw > 30} />
        <StatCard label="待人工复核" value={pipeline.eventsReview} sub="全自动发布下唯一的人工闸口" warn={pipeline.eventsReview > 20} />
      </div>

      {/* 按 stage 的调用记账 */}
      <Card>
        <CardHeader>
          <CardTitle>今日 LLM 调用（按管线段）</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byStage.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">今天还没有 LLM 调用</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3">阶段</th>
                    <th className="pb-2 pr-3">调用数</th>
                    <th className="pb-2 pr-3">成功 / 失败</th>
                    <th className="pb-2 pr-3">成功率</th>
                    <th className="pb-2 pr-3">tokens</th>
                    <th className="pb-2 pr-3">平均耗时</th>
                    <th className="pb-2">花费</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byStage.map((s) => (
                    <tr key={s.stage} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3 font-medium">{s.stage}</td>
                      <td className="py-2 pr-3">{s.calls}</td>
                      <td className="py-2 pr-3">
                        <span className="text-green-600">{s.ok}</span>
                        <span className="text-gray-400"> / </span>
                        <span className={s.failed ? 'text-red-600' : 'text-gray-400'}>{s.failed}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={s.okRate < 90 ? 'font-semibold text-amber-600' : 'text-gray-700'}>
                          {s.okRate}%
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{s.tokens.toLocaleString()}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{s.avgMs}ms</td>
                      <td className="py-2 font-mono text-xs">{yuan(s.costMilli)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近失败 */}
      <Card>
        <CardHeader>
          <CardTitle>最近 20 条 LLM 失败记录</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            结构化输出的三级降级都失败才会记在这里。频繁出现「结构校验失败」说明提示词或 schema 该调了。
          </p>
        </CardHeader>
        <CardContent>
          {data.failures.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">没有失败记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3 whitespace-nowrap">时间</th>
                    <th className="pb-2 pr-3">阶段</th>
                    <th className="pb-2 pr-3">模型</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">耗时</th>
                    <th className="pb-2">错误</th>
                  </tr>
                </thead>
                <tbody>
                  {data.failures.map((f) => (
                    <tr key={f.id} className="border-b align-top hover:bg-gray-50/60">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-gray-500">{fmt(f.createdAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{f.stage}</td>
                      <td className="py-2 pr-3 whitespace-nowrap font-mono text-xs text-gray-600">
                        {f.provider} / {f.model}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap font-mono text-xs">{f.ms}ms</td>
                      <td className="py-2 text-xs text-red-600 break-all">{f.error || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 原始 Setting */}
      <Card>
        <CardHeader>
          <CardTitle>news_ 配置项原文</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            管线写进 Setting 的原始值（含表体积告警等）。Setting.key 是 VarChar(50)，新增键名别超长。
          </p>
        </CardHeader>
        <CardContent>
          {data.settings.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">还没有 news_ 开头的配置项</div>
          ) : (
            <div className="space-y-1">
              {data.settings.map((s) => (
                <div key={s.key} className="flex gap-3 border-b border-gray-50 py-1.5 text-xs last:border-0">
                  <span className="w-56 shrink-0 font-mono text-gray-600">{s.key}</span>
                  <span className="min-w-0 flex-1 break-all text-gray-800">{s.value}</span>
                  <span className="w-36 shrink-0 text-right text-gray-400">{fmt(s.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ k, v, mono, cls }: { k: string; v: string; mono?: boolean; cls?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-gray-500">{k}</span>
      <span className={`min-w-0 break-all text-right ${mono ? 'font-mono text-xs' : ''} ${cls || 'text-gray-900'}`}>{v}</span>
    </div>
  )
}

function StatCard({ label, value, sub, warn }: { label: string; value: number; sub: string; warn?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${warn ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
        <div className="mt-1 text-xs text-gray-400">{sub}</div>
      </CardContent>
    </Card>
  )
}
