/**
 * 营销推广后台页面的纯逻辑自测。**不连数据库、不起浏览器**。
 *   npx tsx scripts/check-marketing-admin-ui.ts
 *
 * 钉住的是界面里「算错了会出事」的几处：
 *  - 定时发送的 datetime-local 一律按北京时间解释（与浏览器时区无关）
 *  - 「发送」按钮的闸门 launchBlockers：检查没过 / 结果过期 / 券没确认 / 人数没打对 / 受众没存成功 都不许提交；
 *    存盘失败后「重试」与切换立即/定时不能绕过存盘直接检查（审查 C20）
 *  - 草稿页：离开页面时补发没发出去的受众改动（C22）；测试状态变化清掉第 ③ 步的旧检查结果（C24）
 *  - 优惠券后台：营销直发「到账后 N 天」批次不显示「长期有效」（C25）
 *  - 受众预设的判等与规则清洗（预设芯片高亮、保存前去掉空条件）
 *  - 模板 key → 新建活动参数的换算
 *  - 比率、金额、时间的展示口径（分母为 0 显示「—」而不是 NaN%）
 *  - 内置模板缩略图（浏览器端同构渲染）每个都能渲染、不含脚本
 *  - 服务端渲染冒烟：报表各状态（发送中/定时未到/自动暂停/已完成/已取消）、检查结果、模板卡片、
 *    受众三种形态、草稿三步页 —— 用假数据渲染一遍，确认不崩、该有的按钮在、不该有的按钮不在
 * 真正的交互（点击、保存、409 冲突）由浏览器验收覆盖。
 */
import { fmtMoney, fmtPct, fmtShortTime, fmtTime, parseBjLocalInput, ratio, toBjLocalInput } from '../src/components/admin/marketing/api'
import {
  autoRecheckAllowed,
  launchBlockers,
  typedMatches,
  TYPE_CONFIRM_OVER,
  UNSAVED_BLOCKER,
  type LaunchGateInput,
} from '../src/components/admin/marketing/launch-dialog'
import { AudienceBuilder, cleanRules, rulesKey } from '../src/components/admin/marketing/audience-builder'
import { DraftCampaign, audienceUnmountSave, checkKeyOf } from '../src/components/admin/marketing/draft-campaign'
import { TemplateCard, templateCreateBody, templateIdOf } from '../src/components/admin/marketing/template-gallery'
import { presetPreviewHtml } from '../src/components/admin/marketing/content-preview'
import { ReportBody } from '../src/components/admin/marketing/campaign-report'
import { CheckResultView } from '../src/components/admin/marketing/check-result'
import { PRESETS } from '../src/lib/marketing/presets'
import { SEGMENT_PRESETS, type AudienceSpec, type CampaignDetail, type CampaignReport, type CheckResult, type TemplateItem } from '../src/lib/marketing/types'
import * as React from 'react'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { transformSync } from 'esbuild'

const ROOT = join(__dirname, '..')
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8').replace(/\r\n/g, '\n')

// tsx 按经典 JSX 运行时编译组件（React.createElement），Next 构建时才是自动运行时；脚本里补一个全局 React
;(globalThis as unknown as { React: typeof React }).React = React

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  ok(name, a === e, `实际 ${a}，期望 ${e}`)
}

console.log('\n[北京时间输入框]')
{
  const d = parseBjLocalInput('2026-10-07T09:00')
  eq('北京 10-07 09:00 = UTC 10-07 01:00', d?.toISOString(), '2026-10-07T01:00:00.000Z')
  const midnight = parseBjLocalInput('2026-10-08T00:30')
  eq('北京凌晨 00:30 = UTC 前一天 16:30（跨日）', midnight?.toISOString(), '2026-10-07T16:30:00.000Z')
  eq('往返：toBjLocalInput(parse(x)) === x', d ? toBjLocalInput(d) : null, '2026-10-07T09:00')
  eq('往返（跨日）', midnight ? toBjLocalInput(midnight) : null, '2026-10-08T00:30')
  eq('带秒也能解析', parseBjLocalInput('2026-10-07T09:00:30')?.toISOString(), '2026-10-07T01:00:00.000Z')
  eq('空串 → null', parseBjLocalInput(''), null)
  eq('乱写 → null', parseBjLocalInput('明天九点'), null)
  eq('月份越界 → null', parseBjLocalInput('2026-13-01T09:00'), null)
  eq('小时越界 → null', parseBjLocalInput('2026-10-07T24:00'), null)
  // 与进程时区无关：同一个输入在任何 TZ 下都得到同一个瞬时值（这里只能在当前 TZ 下验证实现不调用本地时区函数）
  const src = parseBjLocalInput.toString() + toBjLocalInput.toString()
  ok('实现里不用 getHours / setHours / toLocaleString', !/getHours|setHours|toLocale|getTimezoneOffset/.test(src))
}

console.log('\n[展示格式]')
{
  eq('ratio 分母 0 → null', ratio(3, 0), null)
  eq('ratio 正常', ratio(1, 4), 0.25)
  eq('fmtPct(null) → —', fmtPct(null), '—')
  eq('fmtPct(NaN) → —', fmtPct(NaN), '—')
  eq('fmtPct(0.1234) → 12.3%', fmtPct(0.1234), '12.3%')
  eq('fmtPct 两位小数', fmtPct(0.00123, 2), '0.12%')
  eq('fmtMoney 字符串', fmtMoney('12.5'), '¥12.50')
  eq('fmtMoney 空', fmtMoney(null), '¥0.00')
  eq('fmtMoney 非数', fmtMoney('abc'), '¥0.00')
  eq('fmtTime 北京时间', fmtTime('2026-10-07T01:05:00.000Z'), '2026-10-07 09:05')
  eq('fmtTime 空 → —', fmtTime(null), '—')
  eq('fmtTime 坏值 → —', fmtTime('not-a-date'), '—')
  eq('fmtShortTime 去掉年份', fmtShortTime('2026-10-07T01:05:00.000Z'), '10-07 09:05')
}

console.log('\n[发送按钮闸门]')
{
  const good: LaunchGateInput = {
    check: { canLaunch: true, coupon: null, audience: { eligible: 50 } },
    stale: false,
    checking: false,
    launching: false,
    scheduleErr: '',
    typed: '',
    couponOk: false,
    saved: true,
  }
  eq('一切就绪（≤100 人、无券）→ 可提交', launchBlockers(good), [])
  // 审查 C20：打开弹窗时存盘失败，检查结果是按服务器上的旧受众算的 —— 看起来再正常也不许提交
  ok('受众没存成功（检查却通过了）→ 不可提交', launchBlockers({ ...good, saved: false }).includes(UNSAVED_BLOCKER))
  ok('受众没存成功且还没检查 → 报「未保存」而不是「正在检查」', launchBlockers({ ...good, saved: false, check: null }).includes(UNSAVED_BLOCKER))
  ok('存盘成功时不报「未保存」', !launchBlockers({ ...good, check: null }).includes(UNSAVED_BLOCKER))
  eq('存盘没成功时不自动重查（立即）', autoRecheckAllowed({ saved: false, mode: 'now', scheduleErr: '' }), false)
  eq('存盘没成功时不自动重查（定时、时间合法）', autoRecheckAllowed({ saved: false, mode: 'schedule', scheduleErr: '' }), false)
  eq('存盘成功后切换立即 → 自动重查', autoRecheckAllowed({ saved: true, mode: 'now', scheduleErr: '' }), true)
  eq('存盘成功后切到定时、时间合法 → 自动重查', autoRecheckAllowed({ saved: true, mode: 'schedule', scheduleErr: '' }), true)
  eq('定时时间不合法 → 不查', autoRecheckAllowed({ saved: true, mode: 'schedule', scheduleErr: '请选择发送时间' }), false)
  // 组件里的接线：runCheck 只能从 prepare（先存盘）与受 autoRecheckAllowed 把关的防抖分支调；「重试」与 409 走 prepare
  {
    const src = readSrc('src/components/admin/marketing/launch-dialog.tsx')
    const calls = src.split('\n').filter((l) => /runCheck\(/.test(l) && !/const runCheck/.test(l))
    eq('runCheck 只有两处调用', calls.length, 2)
    ok('其一在 prepare 里、存盘成功之后', calls.some((l) => /await runCheck\(s\.mode/.test(l)))
    const lines = src.split('\n')
    const di = lines.findIndex((l) => /setTimeout\(\(\) => runCheck\(/.test(l))
    ok('其二是防抖分支，且前一行由 autoRecheckAllowed({ saved, … }) 把关', di > 0 && /if \(!autoRecheckAllowed\(\{ saved,/.test(lines[di - 1]))
    ok('「重试」按钮走 prepareNow（重新存盘）', /onClick=\{\(\) => void prepareNow\(\)\}/.test(src))
    ok('「重试」按钮不再直接 runCheck', !/onClick=\{\(\) => runCheck\(/.test(src))
    ok('提交 409 后先存盘再重查', /r\.status === 409\)[\s\S]{0,300}await prepareNow\(\)/.test(src))
    ok('闸门收到 saved', /launchBlockers\(\{[^}]*\bsaved\b[^}]*\}\)/.test(src))
  }
  ok('还没检查 → 不可提交', launchBlockers({ ...good, check: null }).length > 0)
  ok('检查没通过 → 不可提交', launchBlockers({ ...good, check: { ...good.check!, canLaunch: false } }).length > 0)
  ok('检查结果过期（切换了定时）→ 不可提交', launchBlockers({ ...good, stale: true }).length > 0)
  ok('检查进行中 → 不可提交', launchBlockers({ ...good, checking: true }).length > 0)
  ok('正在提交 → 不可再点', launchBlockers({ ...good, launching: true }).length > 0)
  ok('定时时间不合法 → 不可提交', launchBlockers({ ...good, scheduleErr: '定时发送的时间要晚于现在' }).includes('定时发送的时间要晚于现在'))
  ok('可发 0 人 → 不可提交', launchBlockers({ ...good, check: { ...good.check!, audience: { eligible: 0 } } }).length > 0)

  const withCoupon: LaunchGateInput = { ...good, check: { ...good.check!, coupon: { maxCount: 50, maxGiveaway: '500.00' } } }
  ok('有直发券但没勾确认 → 不可提交', launchBlockers(withCoupon).some((s) => s.includes('优惠力度')))
  eq('有直发券且勾了确认 → 可提交', launchBlockers({ ...withCoupon, couponOk: true }), [])

  const many: LaunchGateInput = { ...good, check: { ...good.check!, audience: { eligible: 1234 } } }
  ok(`超过 ${TYPE_CONFIRM_OVER} 人没打人数 → 不可提交`, launchBlockers(many).some((s) => s.includes('人数')))
  ok('打错人数 → 不可提交', launchBlockers({ ...many, typed: '1233' }).length > 0)
  eq('打对人数 → 可提交', launchBlockers({ ...many, typed: '1234' }), [])
  eq('带千分位逗号也算对', launchBlockers({ ...many, typed: '1,234' }), [])
  eq('全角逗号与空格也算对', launchBlockers({ ...many, typed: ' 1，234 ' }), [])
  const exactly100: LaunchGateInput = { ...good, check: { ...good.check!, audience: { eligible: TYPE_CONFIRM_OVER } } }
  eq(`恰好 ${TYPE_CONFIRM_OVER} 人不要求打人数`, launchBlockers(exactly100), [])
  ok('typedMatches 不接受带前导 0 的写法', !typedMatches('01234', 1234))
}

console.log('\n[受众规则]')
{
  const p = SEGMENT_PRESETS.find((x) => x.key === 'vip-silver')!
  eq('预设与自己相等', rulesKey(p.rules), rulesKey({ ...p.rules }))
  eq('数组顺序不影响判等', rulesKey({ vipLevels: [3, 1, 2] }), rulesKey({ vipLevels: [1, 2, 3] }))
  eq('excludeInactive 不参与判等（预设芯片仍高亮）', rulesKey({ ...p.rules, excludeInactive: true }), rulesKey(p.rules))
  eq('undefined 与空数组不参与判等', rulesKey({ lastPaidWithinDays: 90, boughtProductIds: [], spendMin: undefined }), rulesKey({ lastPaidWithinDays: 90 }))
  ok('不同预设不相等', rulesKey(SEGMENT_PRESETS[0].rules) !== rulesKey(SEGMENT_PRESETS[1].rules))
  eq('cleanRules 去掉空条件', cleanRules({ paid: undefined, boughtCategoryIds: [], registeredWithinDays: 30, excludeInactive: undefined }), {
    registeredWithinDays: 30,
  })
  eq('cleanRules 保留 false 与 0', cleanRules({ excludeInactive: false, spendMin: 0 }), { excludeInactive: false, spendMin: 0 })
}

console.log('\n[模板 key]')
{
  eq('内置模板 → preset', templateCreateBody('preset:blank'), { preset: 'blank' })
  eq('自存模板 → templateId', templateCreateBody('tpl:12'), { templateId: 12 })
  eq('非法 id → null', templateCreateBody('tpl:abc'), null)
  eq('负数 id → null', templateCreateBody('tpl:-3'), null)
  eq('未知前缀 → null', templateCreateBody('foo:1'), null)
  eq('templateIdOf 内置 → null', templateIdOf('preset:blank'), null)
  eq('templateIdOf 自存', templateIdOf('tpl:7'), 7)
}

console.log('\n[草稿页：离开时补发受众（C22） / 检查结果失效键（C24）]')
{
  const c = { id: 42, updatedAt: '2026-09-30T10:00:00.000Z' }
  eq('没有待存改动 → 不补发', audienceUnmountSave(null, c), null)
  const spec: AudienceSpec = { type: 'SEGMENT', rules: { lastPaidWithinDays: 90, excludeInactive: true } }
  const req = audienceUnmountSave(spec, c)
  ok('有待存改动 → 补发 PUT 到这条活动', !!req && req.url === '/api/admin/marketing/campaigns/42' && req.init.method === 'PUT')
  eq('补发的内容 = 乐观锁基准 + 受众（只带受众，不碰内容字段）', req ? JSON.parse(String(req.init.body)) : null, { baseUpdatedAt: c.updatedAt, audience: spec })
  eq('小请求体用 keepalive（页面卸载后也能发出去）', req?.init.keepalive, true)
  // 手工指定最多 5000 人（约 35KB），实际总在上限内；这里只验证阈值本身
  const huge = audienceUnmountSave({ type: 'USERS', userIds: Array.from({ length: 12000 }, (_, i) => 100000 + i) }, c)
  eq('超过 keepalive 上限（约 64KB）的改走普通请求', huge?.init.keepalive, false)
  {
    const src = readSrc('src/components/admin/marketing/draft-campaign.tsx')
    // 卸载清理里真的用它发出去了（以前只 clearTimeout）
    ok('卸载时补发：清理函数里取 pending 并 fetch', /const spec = pending\.current[\s\S]{0,600}audienceUnmountSave\(spec, campaignRef\.current\)[\s\S]{0,200}fetch\(req\.url, req\.init\)/.test(src))
  }

  const base = { updatedAt: '2026-09-30T10:00:00.000Z', testedAt: null as string | null, testedCurrent: false }
  eq('同一份活动 → 键相同（不误清）', checkKeyOf(base), checkKeyOf({ ...base }))
  ok('测试发送成功（testedAt 变、updatedAt 不变）→ 键变，旧检查结果被清掉', checkKeyOf(base) !== checkKeyOf({ ...base, testedAt: '2026-09-30T10:05:00.000Z', testedCurrent: true }))
  ok('只有 testedCurrent 变 → 键也变', checkKeyOf(base) !== checkKeyOf({ ...base, testedCurrent: true }))
  ok('内容/受众变了（updatedAt 变）→ 键变', checkKeyOf(base) !== checkKeyOf({ ...base, updatedAt: '2026-09-30T10:06:00.000Z' }))
  ok('与测试无关的字段（名称等）不参与', checkKeyOf({ ...base, name: '别的名字' } as typeof base) === checkKeyOf(base))
}

console.log('\n[优惠券后台：营销直发券有效期（C25）]')
{
  // route.ts 只能导出 HTTP 处理函数，解析文档的 grantDaysOfDoc 不导出：从源码里取出来单独编译执行
  const route = readSrc('src/app/api/admin/coupons/route.ts')
  const m = route.match(/function grantDaysOfDoc\([\s\S]*?\n\}\n/)
  let grantDaysOfDoc: ((doc: string) => number | null) | null = null
  try {
    if (m) grantDaysOfDoc = new Function(`${transformSync(m[0], { loader: 'ts' }).code}; return grantDaysOfDoc`)() as (doc: string) => number | null
  } catch (e) {
    ok('grantDaysOfDoc 可编译', false, (e as Error).message)
  }
  ok('route.ts 里有 grantDaysOfDoc', !!grantDaysOfDoc)
  if (grantDaysOfDoc) {
    const couponPreset = PRESETS.find((p) => p.doc.blocks.some((b) => b.type === 'coupon' && b.mode === 'grant' && b.grant?.validity.mode === 'days'))
    ok('有内置模板带「到账后 N 天」直发券', !!couponPreset)
    if (couponPreset) {
      const blk = couponPreset.doc.blocks.find((b) => b.type === 'coupon' && b.mode === 'grant')
      const days = blk && blk.type === 'coupon' && blk.grant?.validity.mode === 'days' ? blk.grant.validity.days : -1
      eq('内置模板的直发券 → 取到天数', grantDaysOfDoc(JSON.stringify(couponPreset.doc)), days)
    }
    const doc = (validity: unknown, mode = 'grant') =>
      JSON.stringify({ v: 1, blocks: [{ id: 'a', type: 'text' }, { id: 'c', type: 'coupon', mode, grant: { kind: 'THRESHOLD', discount: 5, validity } }] })
    eq('days 模式 → N', grantDaysOfDoc(doc({ mode: 'days', days: 14 })), 14)
    eq('until 模式 → null（批次有 endAt，按日期显示）', grantDaysOfDoc(doc({ mode: 'until', date: '2026-10-07' })), null)
    eq('领取券（mode=claim）→ null', grantDaysOfDoc(doc({ mode: 'days', days: 7 }, 'claim')), null)
    eq('天数不合法 → null', grantDaysOfDoc(doc({ mode: 'days', days: 0 })), null)
    eq('没有券区块 → null', grantDaysOfDoc(JSON.stringify({ v: 1, blocks: [{ id: 'a', type: 'text' }] })), null)
    eq('坏 JSON → null（不抛错拖垮列表）', grantDaysOfDoc('{oops'), null)
  }
  ok('接口只给 CAMPAIGN 行返回 grantDays', /grantDays: r\.source === 'CAMPAIGN' \? grantDaysByCoupon\.get\(r\.id\) \?\? null : null/.test(route))
  const page = readSrc('src/app/admin/coupons/page.tsx')
  ok('页面：营销直发批次显示「到账后 N 天内有效（按张计算）」', page.includes('`到账后 ${r.grantDays} 天内有效（按张计算）`'))
  ok('页面：「长期有效」只在非营销批次的分支里', /r\.forever \?[\s\S]{0,200}fromCampaign \?[\s\S]{0,300}\) : \(\s*<span className="text-emerald-600">长期有效<\/span>/.test(page))
}

console.log('\n[内置模板缩略图（浏览器端同构渲染）]')
{
  ok('至少 5 个内置模板', PRESETS.length >= 5, `实际 ${PRESETS.length}`)
  for (const p of PRESETS) {
    let html = ''
    let err = ''
    try {
      html = presetPreviewHtml(p, 'https://bigolab.com')
    } catch (e) {
      err = (e as Error).message
    }
    ok(`「${p.name}」缩略图能渲染`, !!html && html.includes('<body'), err)
    ok(`「${p.name}」预览不含脚本`, !/<script/i.test(html))
    ok(`「${p.name}」key 能换成新建参数`, !!templateCreateBody(`preset:${p.key}`))
  }
}

console.log('\n[服务端渲染冒烟：报表 / 检查结果 / 模板卡片]')
{
  // 静默 SSR 下 useLayoutEffect 的无害告警，免得刷屏
  const origError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect')) return
    origError(...args)
  }
  const render = (name: string, el: ReactElement, mustContain: string[] = []) => {
    try {
      const html = renderToStaticMarkup(el)
      const missing = mustContain.filter((t) => !html.includes(t))
      ok(name, missing.length === 0, missing.length ? `缺少：${missing.join('、')}` : '')
      return html
    } catch (e) {
      ok(name, false, (e as Error).stack?.split('\n').slice(0, 3).join(' | ') || String(e))
      return ''
    }
  }

  const doc = PRESETS.find((p) => p.key === 'notice')?.doc || PRESETS[0].doc
  const baseCampaign: CampaignDetail = {
    id: 42,
    name: '国庆特惠',
    topic: 'PROMO',
    status: 'SENDING',
    statusNote: null,
    subject: '{{nickname|朋友}}，国庆快乐',
    preheader: '给老朋友的一点心意',
    doc,
    audience: { type: 'ALL', excludeInactive: true },
    scheduledAt: null,
    materializedAt: '2026-10-01T01:00:00.000Z',
    startedAt: '2026-10-01T01:00:00.000Z',
    completedAt: null,
    testedAt: '2026-09-30T10:00:00.000Z',
    testedCurrent: true,
    contentHash: 'h',
    couponId: 9,
    recipientCount: 1200,
    createdAt: '2026-09-29T10:00:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z',
  }
  const baseReport: CampaignReport = {
    campaign: baseCampaign,
    waiting: { code: 'window', text: '不在发送时段（9:00–21:00），明天 9:00 继续', until: '2026-10-02T01:00:00.000Z' },
    progress: { total: 1200, done: 600, queued: 600, percent: 50 },
    funnel: {
      recipients: 1200,
      sent: 580,
      delivered: 550,
      invalid: 12,
      spam: 3,
      failed: 4,
      unknown: 2,
      skipped: 14,
      uniqueOpens: 200,
      uniqueClicks: 60,
      botClicks: 5,
      unsubscribes: 3,
      complaints: 1,
      orders: 4,
      revenue: '396.00',
      influencedOrders: 2,
      influencedRevenue: '198.00',
    },
    rates: { deliveryRate: 0.97, clickRate: 0.109, clickToOpen: 0.3, unsubscribeRate: 0.0055, complaintRate: 0.0018, invalidRate: 0.021 },
    skipReasons: { UNSUBSCRIBED: 5, FREQ_CAP: 9 },
    links: [
      { idx: 0, url: 'https://bigolab.com/products/4?utm_source=bigolab', label: '立即选购', clicks: 40 },
      { idx: 1, url: 'https://bigolab.com/coupons', label: null, clicks: 20 },
    ],
    orders: [{ orderNo: 'AI20261001X', userId: 7, email: 'a@qq.com', productName: 'ChatGPT Plus', amount: '99.00', paidAt: '2026-10-01T03:00:00.000Z', clickedAt: '2026-10-01T02:00:00.000Z' }],
    timeline: [{ at: '2026-09-30T10:00:00.000Z', action: 'LAUNCH', actor: '站长', detail: '1200 人' }],
    coupon: { id: 9, code: 'mk-abc', granted: 580, used: 4 },
  }
  const noop = () => {}
  const body = (r: CampaignReport, extra: Partial<Parameters<typeof ReportBody>[0]> = {}) =>
    createElement(ReportBody, {
      report: r,
      campaignId: r.campaign.id,
      busy: null,
      flash: null,
      refreshing: false,
      live: r.campaign.status === 'SENDING' || r.campaign.status === 'SCHEDULED',
      lastLoadedAt: Date.now(),
      onControl: noop,
      onRefresh: noop,
      ...extra,
    })

  const sending = render('发送中报表', body(baseReport), ['暂停', '取消活动', '重新排队', '不在发送时段', '直发券 已发 / 已用', 'source=CAMPAIGN&amp;keyword=mk-abc', '¥396.00', '立即选购'])
  ok('发送中不显示「继续发送」', !sending.includes(' 继续发送</button>'))
  const scheduled = render(
    '定时未到（未生成名单）报表',
    body({
      ...baseReport,
      campaign: { ...baseCampaign, status: 'SCHEDULED', materializedAt: null, startedAt: null, scheduledAt: '2026-10-05T01:00:00.000Z', recipientCount: 0 },
      progress: { total: 0, done: 0, queued: 0, percent: 0 },
      funnel: { ...baseReport.funnel, recipients: 0, sent: 0, delivered: 0, failed: 0, unknown: 0 },
      links: [],
      orders: [],
      coupon: null,
    }),
    ['撤回定时', '到点后生成收件人名单']
  )
  // 按钮文字前面是图标，所以用「 重新排队</button>」精确匹配按钮（「结果未知」的说明文字里也有这四个字）
  ok('未物化的定时活动不显示「重新排队」按钮', !scheduled.includes(' 重新排队</button>'))
  ok('发送中且有失败/未知时显示「重新排队」按钮', sending.includes(' 重新排队</button>'))
  const paused = render(
    '自动暂停报表',
    body({ ...baseReport, campaign: { ...baseCampaign, status: 'PAUSED', statusNote: '熔断：无效率 6.1% 超过 5%' } }, { flash: { ok: false, text: '操作失败' } }),
    ['继续发送', '熔断：无效率', '操作失败']
  )
  ok('发送中有「暂停」按钮', sending.includes(' 暂停</button>'))
  ok('暂停中不显示「暂停」按钮', !paused.includes(' 暂停</button>'))
  const done = render('已完成报表', body({ ...baseReport, campaign: { ...baseCampaign, status: 'COMPLETED', completedAt: '2026-10-02T01:00:00.000Z' }, waiting: { code: 'none', text: '' } }), ['重新排队'])
  ok('已完成不显示「取消活动」', !done.includes(' 取消活动</button>'))
  ok('已完成显示「重新排队」按钮', done.includes(' 重新排队</button>'))
  render(
    '已取消且数据为空的报表',
    body({
      ...baseReport,
      campaign: { ...baseCampaign, status: 'CANCELLED', couponId: null },
      rates: { deliveryRate: null, clickRate: null, clickToOpen: null, unsubscribeRate: null, complaintRate: null, invalidRate: null },
      skipReasons: {},
      links: [],
      orders: [],
      timeline: [],
      coupon: null,
    }),
    ['没有被跳过的收件人', '还没有归因到本活动的订单']
  )

  const check: CheckResult = {
    issues: [
      { level: 'warn', code: 'NO_PREHEADER', message: '没填预览文字' },
      { level: 'error', code: 'NOT_TESTED', message: '内容改过之后还没有重新发送测试邮件', blockId: 'b1' },
    ],
    audience: { matched: 1500, eligible: 1200, excluded: { UNSUBSCRIBED: 100, SUPPRESSED: 200 }, freqCapEstimate: 30, sample: [] },
    eta: { startAt: '2026-10-01T01:00:00.000Z', finishAt: '2026-10-03T08:00:00.000Z', perDay: [{ date: '2026-10-01', count: 200 }, { date: '2026-10-02', count: 500 }, { date: '2026-10-03', count: 500 }], blockedBy: ['warmup', 'unknown-code'] },
    coupon: { maxCount: 1200, maxGiveaway: '12000.00' },
    contentHash: 'h',
    testedCurrent: false,
    canLaunch: false,
  }
  const cr = render('检查结果', createElement(CheckResultView, { check }), ['还有 1 个问题', '要分 3 天发完', '预热爬坡', 'unknown-code', '最高让利 ¥12000.00'])
  ok('错误排在警告前面', cr.indexOf('还没有重新发送测试邮件') < cr.indexOf('没填预览文字'))

  const builtIn: TemplateItem = { key: 'preset:notice', name: '简洁通知', description: '适合 QQ 邮箱的文字信', topic: 'NEWS', builtIn: true, updatedAt: null }
  render('内置模板卡片', createElement(TemplateCard, { item: builtIn, selected: true }), ['简洁通知', 'iframe'])
  render('自存模板卡片（无缩略图数据）', createElement(TemplateCard, { item: { ...builtIn, key: 'tpl:3', builtIn: false, updatedAt: '2026-09-25T01:00:00.000Z' } }), ['我保存的模板'])

  // 受众三种形态的初始渲染（选项数据与预估在 effect 里拉，SSR 下是加载态，这里只验证表单本身不崩）
  const aud = (value: AudienceSpec) => createElement(AudienceBuilder, { value, topic: 'PROMO', onChange: noop })
  render('受众：全部活跃用户', aud({ type: 'ALL', excludeInactive: true }), ['排除长期不活跃的用户'])
  render('受众：全部（关闭排除）', aud({ type: 'ALL', excludeInactive: false }), ['已关闭排除'])
  const seg = render(
    '受众：条件筛选（含矛盾条件）',
    aud({ type: 'SEGMENT', rules: { registeredWithinDays: 30, registeredBeforeDays: 60, paid: 'no', spendMin: 100, vipLevels: [1] } }),
    ['一键预设', '最近 90 天付过款', '要大于']
  )
  ok('矛盾条件给出提示', seg.includes('结果会是 0 人'))
  render('受众：条件筛选（空）', aud({ type: 'SEGMENT', rules: {} }), ['还没有设置任何条件'])
  render('受众：手工指定（空）', aud({ type: 'USERS', userIds: [] }), ['还没有选人'])
  render('受众：手工指定（200 人，只显示前一部分）', aud({ type: 'USERS', userIds: Array.from({ length: 200 }, (_, i) => i + 1) }), ['已选', '…等 200 人'])

  const draft = render(
    '草稿三步引导页',
    createElement(DraftCampaign, {
      campaign: { ...baseCampaign, status: 'DRAFT', materializedAt: null, startedAt: null, testedCurrent: false, testedAt: null },
      onCampaignChange: noop,
      reload: async () => null,
      flushRef: { current: null },
      config: null,
    }),
    ['内容', '受众', '检查并发送', '还没有测试发送过', '(AD)']
  )
  ok('草稿页不直接塞邮件 HTML（只用 iframe 预览）', !draft.includes('dangerouslySetInnerHTML') && !/<table role="presentation"/.test(draft))

  console.error = origError
}

console.log(`\n通过 ${pass}，失败 ${fail}`)
if (fail > 0) process.exit(1)
