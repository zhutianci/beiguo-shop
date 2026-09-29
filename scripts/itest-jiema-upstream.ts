/**
 * 短信接码 S0 集成测试：新上游客户端（src/lib/jiema/upstream.ts）× 本地假 hero-sms（scripts/mock-herosms.ts）。
 *   npx tsx scripts/itest-jiema-upstream.ts
 *
 * **不连任何数据库、不调用真实 hero-sms**：假服务只绑 127.0.0.1 的随机端口，HEROSMS_BASE / HEROSMS_V1_BASE 在本进程里指过去，
 * key 是每次随机生成的测试值。耗时约 60 秒（取号 15 秒超时、只读 8 秒超时、取号排队 3 秒上限各真实等几次）。
 *
 * 覆盖（docs/短信接码-设计.md §6.2、§3、§3.1、§11 S0 验收）：
 *  - 假服务的每个场景经过客户端 + 解析器 + 判定后的结果：没号、超时（其实买到了 → v1 活跃列表里能认领）、晚到的码、EARLY_CANCEL_DENIED、
 *    FREE_CANCELLATION_EXPIRED、NEW_OTP_RECEIVED、取消时已收码、402 / 403 / 404 / 429 / 1020、5xx、格式乱码、币种不是 840；
 *  - 超时（取号 15 秒、其余 8 秒）、写调用永不自动重试、只读调用网络错误重试 1 次、分页拉全（任何一页失败 → 整体失败，不给半截）；
 *  - 车道：总并发 ≤6、目录车道 ≤3、目录车道占满时查码不排队、总速率 ≤15/秒、目录 ≤7/秒、offers ≤1/秒、offers 429 按服务退避、取号串行；
 *  - 取号发出前最多等 3 秒（串行锁 + 车道合计，过了 NOT_SENT、事后也绝不补发）、取号在车道里插队、结果带 sentAt 且认领窗能框住真买到的号；
 *  - 分页途中有号结束：v1 列表按第一页 total 作废这一轮；兼容协议列表漏掉的号只会走到 history → 没有信息；
 *  - 没码不能完成（假服务按官网前端说法拒绝）→ 没有信息，号码不变；
 *  - 「日志里搜不到 key」：本进程的全部 console 输出、每个结果的 raw 里都没有 key（含上游把 URL 回显进报错页的情况）；
 *    假服务收到的**未脱敏原始请求**里，key 只出现在兼容协议的 api_key 参数或 v1 的 `Authorization: ApiKey` 头里。
 */
import { randomUUID } from 'crypto'
import { startMockHeroSms, type MockHandle } from './mock-herosms'
import * as up from '../src/lib/jiema/upstream'
import { classifyAcquire, judgeGetStatus, judgeGetStatusV2, judgeRelease, judgeFinish, judgeFromActiveList, judgeHistory, type Up } from '../src/lib/jiema/parse'

// ── 捕获本进程的全部 console 输出（最后检查里面没有 key） ──
const captured: string[] = []
const origLog = console.log.bind(console)
for (const k of ['log', 'warn', 'error', 'info', 'debug'] as const) {
  const orig = console[k].bind(console)
  console[k] = (...args: unknown[]) => {
    captured.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    if (k !== 'warn') orig(...args) // 客户端的 [jiema] 告警行只收集不打印，最后给节选
  }
}

let failed = 0
let passed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) {
    passed++
    origLog(`  ✓ ${name}`)
  } else {
    failed++
    origLog(`  ✗ ${name} ${detail}`)
  }
}
const results: Up<unknown>[] = []
function track<T extends Up<unknown>>(r: T): T {
  results.push(r)
  return r
}
const kindOf = (r: Up<unknown>) => (r.kind === 'err' ? `err:${r.code}` : r.kind === 'unknown' ? `unknown:${r.reason}` : r.kind)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const count = (m: MockHandle, action: string) => m.log.filter((e) => e.action === action).length

async function main() {
  const key = `itest-${randomUUID()}`
  const m = await startMockHeroSms({ key, captureRaw: true })
  process.env.HEROSMS_BASE = m.baseUrl
  process.env.HEROSMS_V1_BASE = m.v1Url
  process.env.HEROSMS_API_KEY = key
  if (!/^http:\/\/127\.0\.0\.1:\d+\//.test(process.env.HEROSMS_BASE) || !/^http:\/\/127\.0\.0\.1:\d+\//.test(process.env.HEROSMS_V1_BASE)) throw new Error('只能指向本地假服务')
  up.resetUpstreamStateForTest()
  const t0All = Date.now()

  try {
    console.log('\n[基础] 余额、取号、查码、取全文、列表')
    {
      const b = track(await up.getBalance())
      ok(b.kind === 'ok' && b.data.balanceMicro === 12_442_200, 'getBalance → 12,442,200 微美元')
      const n = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      const c = classifyAcquire(n)
      ok(c.c === 'ACTIVE' && c.data.costMicro === 660_000 && c.data.dialCode === '1' && c.data.canGetAnotherSms === true, '取号成功：成本 0.66 → 660,000、区号 1、canGetAnotherSms')
      const last = m.log.filter((e) => e.action === 'getNumberV2').pop()
      ok(!!last && last.path.includes('maxPrice=0.8250') && last.path.includes('api_key=***') && !last.path.includes('fixedPrice'), '传给上游 maxPrice=0.8250（4 位小数），不传 fixedPrice（D6）')
      if (c.c !== 'ACTIVE') throw new Error('取号失败，后面没法测')
      const id = c.data.activationId
      const span = (c.data.activationEndTime?.getTime() ?? 0) - (c.data.activationTime?.getTime() ?? 0)
      ok(span === 20 * 60_000, 'activationEndTime = 取号 + 20 分钟（带时区，能算截止时间）')
      const w = track(await up.getStatus(id))
      ok(judgeGetStatus(w, { hasSms: false }).v === 'WAIT', 'getStatus：STATUS_WAIT_CODE → 无变化')
      const w2 = track(await up.getStatusV2(id))
      ok(w2.kind === 'noinfo' && judgeGetStatusV2(w2).v === 'NOINFO', 'getStatusV2 等码时的形态认不出 → noinfo（不据它判状态）')
      m.pushSms(id, { code: '482917' })
      const s = track(await up.getStatus(id))
      const sv = judgeGetStatus(s, { hasSms: false })
      ok(sv.v === 'RECEIVED' && sv.code === '482917', 'push 一条短信 → STATUS_OK:482917 → 收到码')
      const all = track(await up.getAllSms(id))
      ok(all.kind === 'ok' && all.data.items.length === 1 && all.data.items[0].code === '482917' && all.data.items[0].date instanceof Date, 'getAllSms：全文与带时区的时间')
      const list = track(await up.getAllActiveActivations())
      ok(list.kind === 'ok' && list.data.pages === 1 && judgeFromActiveList(list, id, { lastCode: '482917', lastText: 'Your verification code is 482917' }).v === 'WAIT', '活跃列表里有它、码没变 → 无变化')
      const v1 = track(await up.v1AllActivations())
      const it = v1.kind === 'ok' ? v1.data.items.find((x) => x.id === id) : undefined
      ok(!!it && it.priceMicro === 660_000 && it.operator === 'any' && !!it.createdAt && Math.abs(it.createdAt.getTime() - Date.now()) < 10_000, 'v1 活跃列表：价格、运营商、带时区的 createdAt（认领用）')
      const v2 = track(await up.getStatusV2(id))
      ok(v2.kind === 'ok' && v2.data.s === 'SMS' && v2.data.sms.code === '482917' && judgeGetStatusV2(v2).v === 'NOINFO', 'getStatusV2 有短信：能解析，但不据它判状态（§3.1 判定表只收它的 STATUS_CANCEL）')
      const eff = track(await up.getNumberV2({ service: 'ot', country: 6, maxPriceMicro: 5000 }))
      const effLog = m.log.filter((e) => e.action === 'getNumberV2').pop()
      const ce = classifyAcquire(eff)
      ok(!!effLog && effLog.path.includes('maxPrice=0.0067') && ce.c === 'WRONG_MAX_PRICE' && ce.minMicro === 24_000, 'cap 5,000 → 传 0.0067（eff）；价 0.024 → 400 WRONG_MAX_PRICE，minMicro 24,000（E2）')
      const op = track(await up.getNumberV2({ service: 'dr', country: 187, operator: 'verizon', maxPriceMicro: 825_000 }))
      ok(op.kind === 'ok' && op.data.operator === 'verizon', '指定运营商取号')
    }

    console.log('\n[放号] EARLY_CANCEL_DENIED → 满 120 秒取消 → STATUS_CANCEL → history 定终态；getAllSms 409')
    {
      m.reset()
      const n = track(await up.getNumberV2({ service: 'dr', country: 52, maxPriceMicro: 200_000 }))
      if (n.kind !== 'ok') throw new Error('取号失败')
      const id = n.data.activationId
      const e = track(await up.cancelActivation(id))
      const ev = judgeRelease(e)
      ok(ev.v === 'EARLY_DENIED' && ev.minSec === 120, '取号后马上取消 → 409 EARLY_CANCEL_DENIED（E15）')
      m.advance(121)
      const c = track(await up.cancelActivation(id))
      ok(judgeRelease(c).v === 'CANCELLED' && m.balanceMicro() === 12_442_200, '满 120 秒 → ACCESS_CANCEL → CANCELLED，上游退费')
      const s = track(await up.getStatus(id))
      ok(judgeGetStatus(s, { hasSms: false }).v === 'CHECK_HISTORY', 'getStatus → STATUS_CANCEL → 查 history')
      const h = track(await up.v1HistoryAll({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000), services: ['dr'], countries: [52] }))
      ok(judgeHistory(h, id).v === 'CANCELLED', 'history：状态 8、无码 → CANCELLED')
      const hl = m.log.filter((x) => x.action === 'v1:/activations/history').pop()
      ok(!!hl && hl.path.includes('services%5B%5D=dr') && hl.path.includes('countries%5B%5D=52') && /from=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}Z/.test(hl.path), 'history 查询带 services[] / countries[] 过滤、from/to 是 ISO 秒级 UTC')
      const a = track(await up.getAllSms(id))
      ok(kindOf(a) === 'err:ACTIVATION_NOT_ACTIVE', '取消后 getAllSms → 409 ACTIVATION_NOT_ACTIVE')
      const again = track(await up.cancelActivation(id))
      ok(judgeRelease(again).v === 'CHECK_HISTORY', '重复取消 → ACTIVATION_NOT_ACTIVE → 查 history（安全）')
      const v2 = track(await up.getStatusV2(id))
      ok(judgeGetStatusV2(v2).v === 'CHECK_HISTORY', 'getStatusV2 已取消 → 纯文本 STATUS_CANCEL → 查 history')
    }

    console.log('\n[放号 / 完成] NEW_OTP_RECEIVED、取消时已收码、FREE_CANCELLATION_EXPIRED、204 写法')
    {
      m.reset()
      const n = track(await up.getNumberV2({ service: 'acz', country: 187, maxPriceMicro: 500_000 }))
      if (n.kind !== 'ok') throw new Error('取号失败')
      const id = n.data.activationId
      m.advance(121)
      m.setFaults([{ action: 'setStatus', kind: 'otp_on_release', status: 8 }])
      const r1 = track(await up.cancelActivation(id))
      const v1 = judgeRelease(r1)
      ok(v1.v === 'RECEIVED' && v1.sms.length === 1 && !!v1.sms[0].id && !!v1.sms[0].code, '放号瞬间来码 → 409 NEW_OTP_RECEIVED → 收到码，info.data 带短信（E14 ③）')
      const r2 = track(await up.cancelActivation(id))
      ok(kindOf(r2) === 'err:OTP_RECEIVED' && judgeRelease(r2).v === 'RECEIVED', '再取消 → 409 OTP_RECEIVED → 收到码（取消时已收码）')
      m.pushSms(id, { code: '777001' })
      const f1 = track(await up.finishActivation(id))
      const fv = judgeFinish(f1)
      ok(fv.v === 'RECEIVED' && fv.again === true && fv.sms.some((x) => x.code === '777001'), '完成时又来了新码 → NEW_OTP_RECEIVED → 入库、下一轮再调 finish（T14）')
      const f2 = track(await up.finishActivation(id))
      ok(judgeFinish(f2).v === 'FINISHED', '下一轮 finish → ACCESS_ACTIVATION → FINISHED')
      const h = track(await up.v1HistoryAll({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000) }))
      const hv = judgeHistory(h, id)
      ok(hv.v === 'RECEIVED' && hv.ended === true && !!hv.code, 'history：状态 6 + moreCodes → 收到码（ended）')

      // 取消时已收码（场景 otp-on-cancel）
      const n2 = track(await up.getNumberV2({ service: 'acz', country: 187, maxPriceMicro: 500_000 }))
      if (n2.kind !== 'ok') throw new Error('取号失败')
      m.advance(121)
      m.scenario('otp-on-cancel')
      ok(judgeRelease(track(await up.cancelActivation(n2.data.activationId))).v === 'RECEIVED', '场景 otp-on-cancel → OTP_RECEIVED → 收到码')

      // 例外时长号：20 分钟后取消 → FREE_CANCELLATION_EXPIRED（规则页说法，调研 §3.4 第 7 条）
      const n3 = track(await up.getNumberV2({ service: 'ig', country: 6, maxPriceMicro: 100_000 }))
      if (n3.kind !== 'ok') throw new Error('取号失败')
      const life = (n3.data.activationEndTime?.getTime() ?? 0) - (n3.data.activationTime?.getTime() ?? 0)
      ok(life === 60 * 60_000, '例外时长组合 ig/6：取号返回的有效期 60 分钟（D42 按它判定）')
      m.advance(20 * 60 + 5)
      const x = track(await up.cancelActivation(n3.data.activationId))
      ok(kindOf(x) === 'err:FREE_CANCELLATION_EXPIRED' && judgeRelease(x).v === 'EXPIRED_CHARGE', '20 分钟后取消 → 409 FREE_CANCELLATION_EXPIRED → E55（没码但被扣费）')

      // 场景 free-cancel-expired（普通号也注入）
      const n4 = track(await up.getNumberV2({ service: 'acz', country: 187, maxPriceMicro: 500_000 }))
      if (n4.kind !== 'ok') throw new Error('取号失败')
      m.advance(121)
      m.scenario('free-cancel-expired')
      ok(judgeRelease(track(await up.cancelActivation(n4.data.activationId))).v === 'EXPIRED_CHARGE', '场景 free-cancel-expired → EXPIRED_CHARGE')
      m.clearFaults()

      // 204 写法
      m.config = { ...m.config, cancelStyle: '204', finishStyle: '204' }
      const n5 = track(await up.getNumberV2({ service: 'acz', country: 187, maxPriceMicro: 500_000 }))
      const n6 = track(await up.getNumberV2({ service: 'acz', country: 187, maxPriceMicro: 500_000 }))
      if (n5.kind !== 'ok' || n6.kind !== 'ok') throw new Error('取号失败')
      m.advance(121)
      const c5 = track(await up.cancelActivation(n5.data.activationId))
      ok(c5.kind === 'ok' && c5.data.result === 'NO_CONTENT' && judgeRelease(c5).v === 'CANCELLED', 'setStatus 8 回 204 → CANCELLED')
      m.pushSms(n6.data.activationId)
      await up.getAllSms(n6.data.activationId)
      const f6 = track(await up.finishActivation(n6.data.activationId))
      ok(f6.kind === 'ok' && f6.data.result === 'NO_CONTENT' && judgeFinish(f6).v === 'FINISHED', 'setStatus 6 回 204 → FINISHED')
      m.config = { ...m.config, cancelStyle: 'text', finishStyle: 'text' }
    }

    console.log('\n[查码] 晚到的码、上游先结束（不在列表 → history）、到期自动退款')
    {
      m.reset({ codeAfterSec: 30 })
      const n = track(await up.getNumberV2({ service: 'tg', country: 6, maxPriceMicro: 300_000 }))
      if (n.kind !== 'ok') throw new Error('取号失败')
      const id = n.data.activationId
      ok(judgeGetStatus(track(await up.getStatus(id)), { hasSms: false }).v === 'WAIT', '场景 late-code：刚取号 → 等码')
      m.advance(31)
      const l = track(await up.getAllActiveActivations())
      ok(judgeFromActiveList(l, id).v === 'RECEIVED', '30 秒后码到了 → 活跃列表里有 smsCode → 收到码')
      m.reset()
      // wa/6 是普通 20 分钟号（tg/6 在假服务里是 45 分钟的例外时长组合）
      const a = track(await up.getNumberV2({ service: 'wa', country: 6, maxPriceMicro: 300_000 }))
      const b = track(await up.getNumberV2({ service: 'wa', country: 6, maxPriceMicro: 300_000 }))
      if (a.kind !== 'ok' || b.kind !== 'ok') throw new Error('取号失败')
      m.endActivation(a.data.activationId, 8)
      const l2 = track(await up.getAllActiveActivations())
      ok(judgeFromActiveList(l2, a.data.activationId).v === 'CHECK_HISTORY' && judgeFromActiveList(l2, b.data.activationId).v === 'WAIT', '上游先取消了 A → A 不在拉全的列表里 → 查 history；B 照常等码')
      const h = track(await up.v1HistoryAll({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000), services: ['wa'] }))
      ok(judgeHistory(h, a.data.activationId).v === 'CANCELLED' && judgeHistory(h, b.data.activationId).v === 'NOINFO', 'history：A 状态 8 → CANCELLED；B 还没结束、history 里没有 → 没有信息')
      m.advance(20 * 60 + 1)
      const l3 = track(await up.getAllActiveActivations())
      const h3 = track(await up.v1HistoryAll({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000), statuses: [10] }))
      ok(judgeFromActiveList(l3, b.data.activationId).v === 'CHECK_HISTORY' && judgeHistory(h3, b.data.activationId).v === 'CANCELLED', '20 分钟到期没码 → 上游自动退款（10）→ history → CANCELLED')
      m.reset({ activeShape: 'rows' })
      const r = track(await up.getNumberV2({ service: 'tg', country: 6, maxPriceMicro: 300_000 }))
      const lr = track(await up.getAllActiveActivations())
      ok(r.kind === 'ok' && lr.kind === 'ok' && lr.data.items.some((x) => x.activationId === r.data.activationId), '活跃列表的第二种形状（activeActivations.rows）照样认')
    }

    console.log('\n[分页] 拉全才算数；任何一页失败 → 整体失败（绝不给半截列表）')
    {
      m.reset()
      m.buy({ service: 'ot', country: 6, count: 150 })
      const all = track(await up.getAllActiveActivations())
      ok(all.kind === 'ok' && all.data.items.length === 150 && all.data.pages === 2, '150 个激活：翻 2 页（100 + 50）拉全')
      m.setFaults([{ action: 'getActiveActivations', kind: 'http500', skip: 1 }])
      const f = track(await up.getAllActiveActivations())
      ok(kindOf(f) === 'unknown:http5xx' && judgeFromActiveList(f, '900000001').v === 'NOINFO', '第 2 页 500 → 整体 unknown，判定为「没有信息」（不是 CHECK_HISTORY）')
      m.setFaults([{ action: 'getActiveActivations', kind: 'garbled', skip: 1 }])
      const g = track(await up.getAllActiveActivations())
      ok(g.kind === 'noinfo' && judgeFromActiveList(g, '900000001').v === 'NOINFO', '第 2 页乱码 → noinfo')
      const v1 = track(await up.v1AllActivations())
      ok(v1.kind === 'ok' && v1.data.items.length === 150 && v1.data.pages === 7, 'v1 活跃列表每页 25：翻 7 页拉全')
      m.setFaults([{ action: 'v1:activations', kind: 'rate_limit', skip: 3 }])
      const v1f = track(await up.v1AllActivations())
      ok(kindOf(v1f) === 'err:RATE_LIMIT', 'v1 第 4 页 429 → 这一轮作废（§2.4：既不认领，也不计「没有候选」）')
    }

    console.log('\n[超时与重试] 取号 15 秒超时 → UNKNOWN（其实买到了，扫描器能在 v1 列表里找到）；写调用不重试；只读网络错误重试 1 次')
    {
      m.reset()
      m.scenario('timeout')
      const t0 = Date.now()
      const r = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      const el = Date.now() - t0
      ok(kindOf(r) === 'unknown:timeout' && classifyAcquire(r).c === 'UNKNOWN' && el >= 14_500 && el < 17_000, `取号超时 → unknown(timeout)（用时 ${el}ms ≈ 15 秒）`)
      ok(count(m, 'getNumberV2') === 1, '取号超时不重试（只发了 1 次）')
      const v1 = track(await up.v1AllActivations())
      const cand = v1.kind === 'ok' ? v1.data.items.filter((x) => x.service === 'dr' && x.country === 187) : []
      ok(cand.length === 1 && !!cand[0].createdAt && cand[0].createdAt.getTime() >= t0 - 3000 && cand[0].createdAt.getTime() <= t0 + 18_000 && (cand[0].priceMicro ?? Infinity) <= 825_000, '号码其实买到了：v1 活跃列表恰好 1 个候选，createdAt 落在 [请求 − 3 秒, 请求 + 18 秒]、价格 ≤ cap（§2.4 认领条件）')
      const bc = up.breakerCounts()
      ok(bc.bad >= 1, `熔断计数：取号超时算 1 次坏调用（bad=${bc.bad}、total=${bc.total}）`)

      m.setFaults([{ action: 'getStatus', kind: 'hang', delayMs: 10_000 }])
      const t1 = Date.now()
      const s = track(await up.getStatus(cand[0]?.id ?? '1'))
      const el2 = Date.now() - t1
      ok(kindOf(s) === 'unknown:timeout' && el2 >= 7_500 && el2 < 9_500 && count(m, 'getStatus') === 1, `只读调用 8 秒超时 → unknown(timeout)，超时不重试（用时 ${el2}ms）`)
      ok(judgeGetStatus(s, { hasSms: false }).v === 'NOINFO', '→ 没有信息')

      const before8 = count(m, 'setStatus')
      m.setFaults([{ action: 'setStatus', kind: 'reset' }])
      const w = track(await up.cancelActivation(cand[0]?.id ?? '1'))
      ok(kindOf(w) === 'unknown:network' && count(m, 'setStatus') === before8 + 1, '写调用（放号）遇到断连 → unknown(network)，**不自动重试**（只发了 1 次）')
      const beforeS = count(m, 'getStatus')
      m.setFaults([{ action: 'getStatus', kind: 'reset' }])
      const rs = track(await up.getStatus(cand[0]?.id ?? '1'))
      ok(rs.kind === 'ok' && count(m, 'getStatus') === beforeS + 2, '只读调用断连一次 → 自动重试 1 次成功（发了 2 次）')
      m.setFaults([{ action: 'getStatus', kind: 'reset', times: 2 }])
      const rs2 = track(await up.getStatus(cand[0]?.id ?? '1'))
      ok(kindOf(rs2) === 'unknown:network' && count(m, 'getStatus') === beforeS + 4, '连续断连两次 → unknown(network)（只重试 1 次）')
      const beforeN = count(m, 'getNumberV2')
      const actsBefore = m.activations.length
      m.setFaults([{ action: 'getNumberV2', kind: 'reset' }])
      const rn = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      ok(kindOf(rn) === 'unknown:network' && classifyAcquire(rn).c === 'UNKNOWN' && count(m, 'getNumberV2') === beforeN + 1 && m.activations.length === actsBefore + 1, '取号断连 → UNKNOWN、不重试；假服务那边号码其实买到了')
    }

    console.log('\n[错误码] 402 / 403 / 404 / 429 / 1020 / 5xx / 乱码 / 币种 / 文本形态')
    {
      m.reset()
      const acq = async (kind: Parameters<MockHandle['setFaults']>[0][number]['kind']) => {
        m.setFaults([{ action: 'getNumberV2', kind }], true)
        return classifyAcquire(track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 })))
      }
      ok((await acq('no_numbers')).c === 'NO_NUMBERS', '没号（场景 no-numbers）→ E1')
      const wm = await acq('wrong_max_price_text')
      ok(wm.c === 'WRONG_MAX_PRICE' && wm.minMicro === 25_000, 'WRONG_MAX_PRICE:0.025 文本 → E2')
      ok((await acq('no_balance')).c === 'NO_BALANCE', '402 NO_BALANCE → E3')
      const bg = await acq('banned_global')
      ok(bg.c === 'BANNED' && bg.scope === 'global' && !!bg.untilMs && bg.untilMs > Date.now() && bg.retryAfterSec === 3600, '403 BANNED 全局 → E4（解封时刻、retry_after_seconds）')
      const bs = await acq('banned_specific')
      ok(bs.c === 'BANNED' && bs.scope === 'specific', '403 BANNED 组合 → E4 specific')
      const bt = await acq('banned_text')
      ok(bt.c === 'BANNED' && bt.untilMs === null, "BANNED:'…' 文本 → E4（解封时刻未知）")
      const cl = await acq('channels_limit')
      ok(cl.c === 'CHANNELS_LIMIT' && cl.currentThreads === 10 && cl.maxAllowed === 10, '403 CHANNELS_LIMIT → E5（current_threads / max_allowed）')
      ok((await acq('service_na')).c === 'UNAVAILABLE', '403 SERVICE_NOT_AVAILABLE → E6')
      ok((await acq('account_inactive')).c === 'KEY_INVALID' && (await acq('bad_key')).c === 'KEY_INVALID', '403 ACCOUNT_INACTIVE、401 BAD_KEY → E7')
      const h403 = await acq('html403')
      const c1020 = await acq('cf1020')
      const h400 = await acq('http400')
      ok(h403.c === 'REJECTED' && h403.cause === 'html403' && c1020.c === 'REJECTED' && c1020.cause === '1020' && h400.c === 'REJECTED', 'HTML 403、1020、认不出的 400 → REJECTED（E58）')
      ok((await acq('bad_action')).c === 'REJECTED', '404 BAD_ACTION → REJECTED')
      const n500 = m.activations.length
      ok((await acq('http500')).c === 'UNKNOWN' && m.activations.length === n500, '500 → UNKNOWN（这次假服务没买到；扫描器会确认 NOT_BOUGHT）')
      ok((await acq('html502')).c === 'UNKNOWN', 'HTML 502 → UNKNOWN')
      const ng = m.activations.length
      const g = await acq('garbled')
      ok(g.c === 'UNKNOWN' && g.reason === 'parse' && m.activations.length === ng + 1, '乱码（场景 garbled）→ UNKNOWN(parse)，号码其实买到了')
      ok((await acq('empty')).c === 'UNKNOWN', '200 空体 → UNKNOWN')
      const nm = m.activations.length
      ok((await acq('missing_id')).c === 'UNKNOWN' && m.activations.length === nm + 1, '200 缺 activationId → UNKNOWN（号码其实买到了）')
      const tn = await acq('text_number')
      ok(tn.c === 'ACTIVE' && tn.data.textForm && tn.data.costMicro === null, '文本形态 ACCESS_NUMBER → 取到号（没有成本）')
      const cur = await acq('currency')
      ok(cur.c === 'CURRENCY' && cur.currency === 978 && !!cur.data && !!m.get(cur.data.activationId), '币种 978（场景 currency）→ CURRENCY，号码带出来、假服务里确实有这个激活（E56）')
      m.clearFaults()
      const n = track(await up.getNumberV2({ service: 'dr', country: 52, maxPriceMicro: 200_000 }))
      if (n.kind !== 'ok') throw new Error('取号失败')
      const id = n.data.activationId
      const st = async (kind: Parameters<MockHandle['setFaults']>[0][number]['kind']) => {
        m.setFaults([{ action: 'getStatus', kind }], true)
        return judgeGetStatus(track(await up.getStatus(id)), { hasSms: false })
      }
      const v402 = await st('no_balance')
      ok(v402.v === 'NOINFO' && v402.recheckBalance === true, '查码 402 → 没有信息 + 复核余额（不改状态）')
      const vban = await st('banned_global')
      ok(vban.v === 'NOINFO' && vban.stopNew === 'BANNED_GLOBAL' && vban.backoffSec === 3600, '查码 403 BANNED → 没有信息 + 停售新单，不判取消')
      ok((await st('not_found')).v === 'CHECK_HISTORY', '查码 404 NOT_FOUND → 查 history')
      const v429 = await st('rate_limit')
      const v1020 = await st('cf1020')
      ok(v429.v === 'NOINFO' && v429.backoffSec === 60 && v1020.v === 'NOINFO' && v1020.backoffSec === 60, '查码 429 / 1020 → 没有信息，退避 60 秒')
      const v503 = await st('http503')
      ok(v503.v === 'NOINFO' && v503.breaker === true, '查码 503 → 没有信息，计入熔断')
      const vg = await st('garbled')
      ok(vg.v === 'NOINFO' && vg.breaker === false, '查码乱码 → noinfo，不计熔断')
      m.setFaults([{ action: 'getStatus', kind: 'quoted' }], true)
      ok(judgeGetStatus(track(await up.getStatus(id)), { hasSms: false }).v === 'WAIT', '文本被 JSON 引号包住 → 照样认')
      m.setFaults([{ action: 'setStatus', kind: 'not_active', status: 8 }], true)
      ok(judgeRelease(track(await up.cancelActivation(id))).v === 'CHECK_HISTORY', '放号 409 ACTIVATION_NOT_ACTIVE → 查 history')
      m.setFaults([{ action: 'setStatus', kind: 'early_cancel_denied', status: 8 }], true)
      ok(judgeRelease(track(await up.cancelActivation(id))).v === 'EARLY_DENIED', '场景 early-cancel-denied → EARLY_DENIED')
      m.clearFaults()
      m.setBalanceUsd(0.01)
      ok(classifyAcquire(track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))).c === 'NO_BALANCE', '上游余额真的不够 → 402 NO_BALANCE（E3）')
      m.reset()
      ok(classifyAcquire(track(await up.getNumberV2({ service: 'dr', country: 999, maxPriceMicro: 825_000 }))).c === 'NO_NUMBERS', '没有这个组合 → NO_NUMBERS')
    }

    console.log('\n[目录] offers / getPrices / 服务 / 国家 / 运营商 / stats / custom-durations')
    {
      m.reset()
      const o = track(await up.v1Offers({ services: ['tg'], countries: [48] }))
      ok(o.kind === 'ok' && o.data.offers.tg[48].defaultCount === 0 && o.data.offers.tg[48].tiers[0][0] === 1_048_300, 'offers tg/48：起价档 0、第一档 1.0483')
      const o2 = track(await up.v1Offers({ services: ['zz'] }))
      ok(kindOf(o2) === 'err:OFFER_NOT_FOUND', '没货的组合 → 404 OFFER_NOT_FOUND')
      const p = track(await up.getPrices())
      ok(p.kind === 'ok' && p.data[187].dr.costMicro === 660_000, 'getPrices 全量：dr/187 = 0.66')
      ok(kindOf(track(await up.getPrices({ service: 'zzz' }))) === 'err:BAD_SERVICE', 'getPrices 错的服务 → BAD_SERVICE')
      const sl = track(await up.getServicesList())
      ok(sl.kind === 'ok' && sl.data.some((x) => x.code === 'acz' && x.name === 'Claude') && sl.data.some((x) => x.code === 'full'), 'getServicesList：acz 名字去掉尾部空格；full 原样给出（过滤在 S1 目录同步）')
      const cs = track(await up.getCountries())
      ok(cs.kind === 'ok' && cs.data.some((x) => x.id === 187 && x.eng === 'USA'), 'getCountries（对象形态）')
      const op = track(await up.getOperators({ country: 6 }))
      const opn = track(await up.getOperators({ country: 999 }))
      ok(op.kind === 'ok' && op.data.byCountry[6].includes('telkomsel') && opn.kind === 'ok' && opn.data.notFound, 'getOperators：有列表 / OPERATORS_NOT_FOUND')
      const n = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      if (n.kind === 'ok') m.pushSms(n.data.activationId)
      const today = new Date(m.now()).toISOString().slice(0, 10)
      const stt = track(await up.v1Stats(today))
      ok(stt.kind === 'ok' && stt.data[187]?.dr?.count === 1 && stt.data[187].dr.success === 1, 'v1 stats：当天 dr/187 1 个号 1 个收码')
      const cd = track(await up.v1CustomDurations())
      ok(cd.kind === 'ok' && cd.data.ig[6] === 60 && cd.data.tg[6] === 45, 'custom-durations（免鉴权）')
    }

    console.log('\n[key] 没配 key 不发请求；错 key → E7；上游把 URL 回显进报错页也不泄露')
    {
      m.reset()
      process.env.HEROSMS_API_KEY = ''
      const before = m.log.length
      const r = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      ok(kindOf(r) === 'err:NO_KEY' && r.kind === 'err' && r.http === 0 && m.log.length === before && classifyAcquire(r).c === 'KEY_INVALID', '没配 key → err(NO_KEY)，一个请求都不发')
      ok(up.upstreamConfigured() === false, 'upstreamConfigured() = false')
      const sl = track(await up.getServicesList())
      ok(sl.kind === 'ok', '目录的免 key 接口没配 key 照样能用')
      process.env.HEROSMS_API_KEY = 'wrong-key-value'
      const b = track(await up.getBalance())
      ok(kindOf(b) === 'err:BAD_KEY', '错 key → 401 BAD_KEY')
      const v1 = track(await up.v1ListActivations())
      ok(kindOf(v1) === 'err:BAD_API_KEY' && judgeFromActiveList(v1 as Up<never>, '1').v === 'NOINFO', 'v1 错 key → 403 BAD_API_KEY（调研 §1.6 第 6 条）→ 没有信息')
      process.env.HEROSMS_API_KEY = key
      m.setFaults([{ action: 'getStatus', kind: 'echo_key' }])
      const e = track(await up.getStatus('123'))
      ok(e.kind === 'err' && e.code === 'REJECTED' && !e.raw.includes(key) && e.raw.includes('api_key=***'), '上游 400 页回显了请求 URL → raw 里 key 已换成 ***')
    }

    console.log('\n[车道] 并发槽、速率、优先级、offers 1 RPS 与 429 退避、取号串行')
    {
      m.reset()
      up.resetUpstreamStateForTest()
      // 目录车道最多 3 个并发；占满时查码不排队
      m.setFaults([{ action: 'getPrices', kind: 'hang', delayMs: 800, times: 5 }])
      m.resetStats()
      const t0 = Date.now()
      const prices = Array.from({ length: 5 }, () => up.getPrices())
      await sleep(50)
      const ts = Date.now()
      const st = track(await up.getBalance())
      const stMs = Date.now() - ts
      await Promise.all(prices)
      const el = Date.now() - t0
      ok(m.stats.maxInflight.getPrices === 3, `目录车道同时最多 3 个（假服务看到的并发峰值 ${m.stats.maxInflight.getPrices}）`)
      ok(st.kind === 'ok' && stMs < 400, `目录车道占满时，写与查码车道不排队（getBalance 用时 ${stMs}ms）`)
      ok(el >= 1500, `5 个 800ms 的目录请求分两批（总用时 ${el}ms）`)
      // 总共 6 个并发槽
      m.setFaults([{ action: 'getStatus', kind: 'hang', delayMs: 500, times: 10 }], true)
      m.resetStats()
      const n = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      const id = n.kind === 'ok' ? n.data.activationId : '1'
      const t1 = Date.now()
      await Promise.all(Array.from({ length: 10 }, () => up.getStatus(id)))
      const el1 = Date.now() - t1
      ok(m.stats.maxInflight.getStatus === 6 && m.stats.maxInflightTotal <= 6, `总并发最多 6 个（getStatus 峰值 ${m.stats.maxInflight.getStatus}）`)
      ok(el1 >= 1000, `10 个 500ms 的查码分两批（用时 ${el1}ms）`)
      // 总速率 ≤15 / 秒
      m.clearFaults()
      await sleep(1100)
      const logStart = m.log.length
      await Promise.all(Array.from({ length: 20 }, () => up.getBalance()))
      const bal = m.log.slice(logStart).filter((e) => e.action === 'getBalance').map((e) => e.at)
      const inFirst = bal.filter((x) => x - bal[0] < 900).length
      ok(bal.length === 20 && inFirst <= 15 && bal[15] - bal[0] >= 900, `总速率 ≤15 / 秒（第一秒内发了 ${inFirst} 个，第 16 个在 ${bal[15] - bal[0]}ms 后）`)
      // 目录车道 ≤7 / 秒
      await sleep(1100)
      const logC = m.log.length
      await Promise.all(Array.from({ length: 9 }, () => up.getCountries()))
      const ct = m.log.slice(logC).filter((e) => e.action === 'getCountries').map((e) => e.at)
      ok(ct.length === 9 && ct[7] - ct[0] >= 900, `目录车道 ≤7 / 秒（第 8 个在 ${ct[7] - ct[0]}ms 后）`)
      // offers 全局 ≤1 / 秒
      await sleep(1100)
      const logO = m.log.length
      const offs = await Promise.all([up.v1Offers({ services: ['dr'] }), up.v1Offers({ services: ['acz'] }), up.v1Offers({ services: ['tg'] })])
      offs.forEach(track)
      const ot = m.log.slice(logO).filter((e) => e.action === 'v1:/activations/offers/sms').map((e) => e.at)
      ok(offs.every((x) => x.kind === 'ok') && ot.length === 3 && ot[1] - ot[0] >= 900 && ot[2] - ot[1] >= 900, `offers 全局 ≤1 / 秒（间隔 ${ot[1] - ot[0]}ms、${ot[2] - ot[1]}ms）`)
      // offers 429 → 按服务退避
      m.setFaults([{ action: 'v1:offers', kind: 'rate_limit' }])
      const r429 = track(await up.v1Offers({ services: ['dr'] }))
      const logB = count(m, 'v1:/activations/offers/sms')
      const again = track(await up.v1Offers({ services: ['dr'] }))
      ok(kindOf(r429) === 'err:RATE_LIMIT' && kindOf(again) === 'err:NOT_SENT' && again.kind === 'err' && (again.retryAfterSec ?? 0) >= 55 && count(m, 'v1:/activations/offers/sms') === logB, `offers 429 → 这个服务退避 60 秒，期间本进程不发（NOT_SENT，retryAfterSec=${again.kind === 'err' ? again.retryAfterSec : '-'}）`)
      const other = track(await up.v1Offers({ services: ['acz'] }))
      ok(other.kind === 'ok' && up.upstreamSnapshot().offersBackoff.some((b) => b.key === 'dr'), '别的服务不受影响')
      // 取号串行
      m.reset()
      m.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 700, bought: true, times: 3 }])
      m.resetStats()
      const t2 = Date.now()
      const three = await Promise.all([0, 1, 2].map(() => up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 })))
      three.forEach(track)
      const el2 = Date.now() - t2
      ok(three.every((x) => x.kind === 'ok') && m.stats.maxInflight.getNumberV2 === 1 && el2 >= 2000, `取号串行：同时 3 个，上游同一时刻只有 1 个（峰值 ${m.stats.maxInflight.getNumberV2}，用时 ${el2}ms）`)
    }

    console.log('\n[取号排队] 发出前最多等 3 秒（过了 NOT_SENT、事后绝不补发）；取号在车道里插队；结果带 sentAt（§2.4 认领窗的锚）')
    {
      // 评审复现：上游慢，A 的取号挂着；B 在串行锁后面排队。以前 B 最多排 25 秒才发出，真买到的号 createdAt 落在 [requestedAt − 3, +18] 窗外
      m.reset()
      up.resetUpstreamStateForTest()
      m.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 5000, bought: true }])
      const reqA = Date.now()
      const pA = up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 })
      await sleep(50)
      const reqB = Date.now()
      const rB = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      const waitedB = Date.now() - reqB
      ok(kindOf(rB) === 'err:NOT_SENT' && rB.kind === 'err' && rB.http === 0 && rB.sentAt === undefined && classifyAcquire(rB).c === 'REJECTED', `B 在串行锁后排了 ${waitedB}ms → err(NOT_SENT)、没有 sentAt → REJECTED（E58，不占首次取号次数）`)
      ok(waitedB >= 2900 && waitedB < 3600, `B 最多只等 3 秒（实际 ${waitedB}ms；以前是 25 秒）`)
      ok(count(m, 'getNumberV2') === 1, '这时上游只收到 A 一个取号请求')
      const rA = track(await pA)
      ok(rA.kind === 'ok' && typeof rA.sentAt === 'number' && rA.sentAt - reqA < 200, `A 真买到了：结果带 sentAt（调用后 ${rA.kind === 'ok' ? (rA.sentAt ?? 0) - reqA : -1}ms 发出）`)
      await sleep(300)
      ok(count(m, 'getNumberV2') === 1 && m.activations.length === 1, 'A 回来之后 B 也没有被补发（上游始终只有 A 一个号，不会多买）')
      const v1 = track(await up.v1AllActivations())
      const cand = v1.kind === 'ok' ? v1.data.items.find((x) => rA.kind === 'ok' && x.id === rA.data.activationId) : undefined
      const win = up.acquireClaimWindow({ requestedAtMs: reqA, sentAtMs: rA.sentAt })
      const created = cand?.createdAt?.getTime() ?? -1
      ok(created >= win.fromMs && created <= win.toMs, 'A 的号在 v1 列表里的 createdAt 落在 acquireClaimWindow 算出的认领窗里')

      // 车道被查码占满：取号插队（排在已经排队的查码前面），不用等它们
      m.reset()
      up.resetUpstreamStateForTest()
      const n = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      const id = n.kind === 'ok' ? n.data.activationId : '1'
      // 6 个槽：1 个 0.8 秒后空出来、5 个要挂 3.5 秒；另有 2 个查码先排着队。取号不插队的话，0.8 秒空出来的槽给了排队的查码，
      // 取号要等到 3.5 秒 → 超过 3 秒上限 → NOT_SENT；插队的话 0.8 秒就发出
      m.setFaults(
        [
          { action: 'getStatus', kind: 'hang', delayMs: 800, times: 1 },
          { action: 'getStatus', kind: 'hang', delayMs: 3500, times: 5 },
          { action: 'getStatus', kind: 'hang', delayMs: 300, times: 2 },
        ],
        true,
      )
      const logStart = m.log.length
      const reads = Array.from({ length: 8 }, () => up.getStatus(id))
      await sleep(100)
      const reqC = Date.now()
      const rC = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      await Promise.all(reads)
      const order = m.log.slice(logStart).map((e) => e.action)
      const posC = order.indexOf('getNumberV2')
      const statusBeforeC = order.slice(0, posC).filter((a) => a === 'getStatus').length
      ok(rC.kind === 'ok' && statusBeforeC === 6 && order.filter((a) => a === 'getStatus').length === 8, `6 个槽被查码占满、另有 2 个查码在排队：取号排在那 2 个前面（它之前只发了 ${statusBeforeC} 个查码）`)
      ok(rC.kind === 'ok' && typeof rC.sentAt === 'number' && rC.sentAt - reqC < 1500, `取号等到第一个槽空出来就发（等了 ${rC.kind === 'ok' ? (rC.sentAt ?? 0) - reqC : -1}ms，不用等排在它前面的查码）`)

      // 车道被占满超过 3 秒：取号不发（NOT_SENT），槽空出来以后也不补发
      m.setFaults([{ action: 'getStatus', kind: 'hang', delayMs: 4000, times: 6 }], true)
      const before = count(m, 'getNumberV2')
      const slow = Array.from({ length: 6 }, () => up.getStatus(id))
      await sleep(100)
      const reqD = Date.now()
      const rD = track(await up.getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 }))
      const waitedD = Date.now() - reqD
      await Promise.all(slow)
      await sleep(200)
      ok(kindOf(rD) === 'err:NOT_SENT' && waitedD < 3600 && count(m, 'getNumberV2') === before, `车道占满 4 秒：取号 ${waitedD}ms 后 NOT_SENT，槽空出来之后也没有补发`)
      m.clearFaults()
    }

    console.log('\n[分页途中有号结束] v1 列表按第一页 total 作废这一轮；兼容协议列表漏掉的号只会走到 history → 没有信息')
    {
      m.reset()
      m.buy({ service: 'ot', country: 6, count: 30 })
      const whole = track(await up.v1AllActivations())
      ok(whole.kind === 'ok' && whole.data.items.length === 30 && whole.data.pages === 2, '30 个激活：v1 翻 2 页拉全，条数与 total 一致')
      // 读第 2 页之前，第 1 页最新的那个号结束了：原来第 2 页的第一条挪到第 1 页、被漏掉
      m.setFaults([{ action: 'v1:activations', kind: 'end_top', skip: 1 }])
      const shifted = track(await up.v1AllActivations())
      ok(shifted.kind === 'noinfo' && /total/.test(shifted.raw), '翻页途中有号结束（可能漏了一行）→ noinfo，这一轮作废（既不认领、也不计「没有候选」）')
      const again = track(await up.v1AllActivations())
      ok(again.kind === 'ok' && again.data.items.length === 29, '下一轮列表没再变 → 正常拉全（29 条）')
      for (const a of m.activations) if (a.status === 'ACTIVE') m.endActivation(a.id, 8)
      const hist = track(await up.v1HistoryAll({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000), services: ['ot'] }))
      ok(hist.kind === 'ok' && hist.data.rows.length === 30 && hist.data.pages === 2, 'history 翻 2 页拉全 30 行，条数与 total 一致')

      // 兼容协议的活跃列表没有 total：漏掉的号 → CHECK_HISTORY → history 里没有（号还活着）→ 没有信息，不会被误判结束
      m.reset()
      m.buy({ service: 'ot', country: 6, count: 150 })
      const sorted = m.activations.filter((a) => a.status === 'ACTIVE').sort((x, y) => Number(y.id) - Number(x.id))
      const skippedId = sorted[100].id
      m.setFaults([{ action: 'getActiveActivations', kind: 'end_top', skip: 1 }])
      const l = track(await up.getAllActiveActivations())
      ok(l.kind === 'ok' && !l.data.items.some((x) => x.activationId === skippedId) && m.get(skippedId)?.status === 'ACTIVE', '兼容协议活跃列表翻页途中有号结束：原第 101 条被漏掉（它其实还活着）')
      const jv = judgeFromActiveList(l, skippedId)
      const hv = judgeHistory(track(await up.v1HistoryAll({ from: new Date(Date.now() - 3600_000), to: new Date(Date.now() + 3600_000), services: ['ot'], countries: [6] })), skippedId)
      ok(jv.v === 'CHECK_HISTORY' && hv.v === 'NOINFO', '→ 查 history：还活着的号不在 history 里 → 没有信息（不会被判成取消或完成）')
      m.clearFaults()
    }

    console.log('\n[完成] 没收到码不能完成（假服务按官网前端说法拒绝；API 形态是推断）')
    {
      m.reset()
      const n = track(await up.getNumberV2({ service: 'acz', country: 187, maxPriceMicro: 500_000 }))
      if (n.kind !== 'ok') throw new Error('取号失败')
      const id = n.data.activationId
      const bal = m.balanceMicro()
      const f = track(await up.finishActivation(id))
      ok(judgeFinish(f).v === 'NOINFO' && m.get(id)?.status === 'ACTIVE' && m.balanceMicro() === bal, `没码就完成 → 被拒（${kindOf(f)}）→ 没有信息；号码仍在进行中、不扣不退`)
      m.pushSms(id)
      await up.getAllSms(id)
      ok(judgeFinish(track(await up.finishActivation(id))).v === 'FINISHED' && m.get(id)?.status === 'FINISHED', '收到码之后再完成 → FINISHED')
    }

    console.log('\n[日志里搜不到 key]（§11 S0 验收）')
    {
      const joined = captured.join('\n')
      ok(captured.some((l) => l.includes('[jiema] upstream')), `客户端确实打了告警日志（共 ${captured.filter((l) => l.includes('[jiema] upstream')).length} 行）`)
      ok(!joined.includes(key), '本进程全部 console 输出里没有 key')
      ok(!joined.includes('api_key=') && !joined.includes(m.baseUrl) && !/ApiKey\s+\S/.test(joined), '日志里没有 URL、没有 api_key=、没有 ApiKey 头')
      ok(results.length > 50 && results.every((r) => !r.raw.includes(key)), `全部 ${results.length} 个结果的 raw 里都没有 key`)
      // 假服务收到的**未脱敏**原始请求：key 只能出现在兼容协议的 api_key 参数、或 v1 的 Authorization: ApiKey 头里，别处（路径、其他参数、其他头）一律没有
      const raws = m.rawRequests
      const misplaced = raws.filter((r) => {
        const u = new URL(r.url, 'http://127.0.0.1')
        const isV1 = r.action.startsWith('v1:')
        if (isV1 && u.searchParams.has('api_key')) return true
        u.searchParams.delete('api_key')
        if (`${u.pathname}${u.search}`.includes(key)) return true
        return Object.entries(r.headers).some(([h, val]) => h !== 'authorization' && String(val ?? '').includes(key)) || (!isV1 && String(r.headers.authorization ?? '').includes(key))
      })
      const compatWithKey = raws.filter((r) => !r.action.startsWith('v1:') && new URL(r.url, 'http://127.0.0.1').searchParams.get('api_key') === key).length
      const v1WithKey = raws.filter((r) => r.action.startsWith('v1:') && r.headers.authorization === `ApiKey ${key}`).length
      ok(raws.length > 50 && misplaced.length === 0, `假服务收到的 ${raws.length} 个原始请求里，key 只出现在 api_key 参数（兼容协议）或 Authorization 头（v1）里（放错地方的 ${misplaced.length} 个）`)
      ok(compatWithKey > 20 && v1WithKey > 5, `这条断言不是空的：${compatWithKey} 个兼容协议请求带了 api_key=key，${v1WithKey} 个 v1 请求带了 ApiKey 头`)
      const warn = captured.filter((l) => l.startsWith('[jiema] upstream')).slice(0, 5)
      origLog('  （客户端日志节选）')
      for (const l of warn) origLog(`    ${l}`)
    }
  } finally {
    await m.close()
  }
  origLog(`\n用时 ${Math.round((Date.now() - t0All) / 1000)} 秒`)
  origLog(`通过 ${passed} 条，失败 ${failed} 条`)
  if (failed) {
    origLog('❌ 有失败')
    process.exit(1)
  }
  origLog('全部通过 ✅')
  process.exit(0)
}

main().catch((e) => {
  origLog('❌ 异常：', (e as Error).stack || String(e))
  process.exit(1)
})
