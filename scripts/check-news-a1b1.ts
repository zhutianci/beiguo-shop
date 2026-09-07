/**
 * 本轮改造的纯函数自测。**不连数据库**，照 scripts/check-money.ts 的形式写。
 *   npx tsx scripts/check-news-a1b1.ts
 *
 * 为什么值得单独写：下面这些东西一旦错了，tsc 和 next build 都不会报错，
 * 页面也不会崩，只会静默地做错事 —— 归档正则多吃一种形状、月份边界差 8 小时、
 * 授权边界上把对方的摘要放进来。这类错误只能靠断言拦。
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  ARCHIVE_MONTH_RE,
  NEWS_PAGE_SIZE,
  monthKey,
  monthStartUtc,
  monthEndUtc,
  formatMonthHeading,
  isBackfilled,
  parseDetail,
} from '../src/lib/news/format'
import { parseAihotLeads, AIHOT_LICENSE } from '../src/lib/news/aihot'
import { forbiddenHit, blocklistHit } from '../src/lib/news/score'

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

console.log('\n【归档路由的月份正则】—— 写错会让全部新闻详情页被当成归档页')
ok('接受 2026-09', ARCHIVE_MONTH_RE.test('2026-09'))
ok('接受 2026-12', ARCHIVE_MONTH_RE.test('2026-12'))
ok('拒绝 2026-13（月份越界）', !ARCHIVE_MONTH_RE.test('2026-13'))
ok('拒绝 2026-00', !ARCHIVE_MONTH_RE.test('2026-00'))
ok('拒绝 2026-9（月份未补零）', !ARCHIVE_MONTH_RE.test('2026-9'))
// 这一条是核心：事件 slug 形如 2026-09-06-a1b2c3d4e5，绝不能被归档正则吃掉
ok('拒绝事件 slug 2026-09-06-a1b2c3d4e5', !ARCHIVE_MONTH_RE.test('2026-09-06-a1b2c3d4e5'))
ok('拒绝带前缀 x2026-09', !ARCHIVE_MONTH_RE.test('x2026-09'))
ok('拒绝带后缀 2026-09x', !ARCHIVE_MONTH_RE.test('2026-09x'))
ok('拒绝换行绕过 "2026-09\\n恶意"', !ARCHIVE_MONTH_RE.test('2026-09\n恶意'))

console.log('\n【月份边界用东八区，不是 UTC】—— 差 8 小时会让每月 1 号凌晨归错月')
// 2026-09-01 00:00 北京 = 2026-08-31 16:00 UTC
eq('9 月起点是 UTC 8/31 16:00', monthStartUtc('2026-09').toISOString(), '2026-08-31T16:00:00.000Z')
eq('9 月终点是 UTC 9/30 16:00', monthEndUtc('2026-09').toISOString(), '2026-09-30T16:00:00.000Z')
eq('跨年：12 月终点落到次年 1 月', monthEndUtc('2026-12').toISOString(), '2026-12-31T16:00:00.000Z')
// 北京时间 2026-09-01 00:30 的事件必须归到 9 月，而不是 8 月
eq('北京 9/1 00:30 归 9 月', monthKey(new Date('2026-08-31T16:30:00.000Z')), '2026-09')
eq('北京 8/31 23:30 归 8 月', monthKey(new Date('2026-08-31T15:30:00.000Z')), '2026-08')
eq('月份标题文案', formatMonthHeading('2026-09'), '2026 年 9 月')

console.log('\n【补录判定】—— 判据是「事件很旧但刚发布」')
const h = new Date('2026-09-01T00:00:00Z')
ok('相隔 3 天算补录', isBackfilled(h, new Date('2026-09-04T00:00:00Z')))
ok('相隔 2 小时不算补录', !isBackfilled(h, new Date('2026-09-01T02:00:00Z')))
ok('从未发布不算补录', !isBackfilled(h, null))

console.log('\n【全文层解析】—— 任何脏数据都只能退化成「没有全文」，不能抛错')
eq('null → 空数组', parseDetail(null), [])
eq('非法 JSON → 空数组', parseDetail('{坏数据'), [])
eq('不是数组 → 空数组', parseDetail('{"a":1}'), [])
eq('缺字段的段落被剔除', parseDetail('[{"heading":"标题"},{"heading":"a","body":"b"}]'), [
  { heading: 'a', body: 'b' },
])
eq('空白正文被剔除', parseDetail('[{"heading":"a","body":"   "}]'), [])

console.log('\n【AIHOT 授权边界】—— 对方的 summary / reason 绝不能出现在解析结果里')
const sample = JSON.stringify({
  schemaVersion: 1,
  items: [
    {
      id: 'cmtq5pxc10275roiufscxyie4',
      title: '某公司发布新模型',
      originalTitle: 'Company ships a new model',
      summary: '【这是对方写的摘要，一个字都不该出现在我们的解析结果里】',
      reason: '【这是对方写的推荐理由，同样不该出现】',
      source: { name: '公众号：某某' },
      links: {
        aihot: 'https://aihot.virxact.com/items/cmtq5pxc10275roiufscxyie4',
        original: 'https://blog.google/some-post',
      },
      publishedAt: '2026-09-06T18:23:14.000Z',
      category: 'tip',
      score: 81,
      selected: true,
      attribution: { name: 'AIHOT', url: 'https://aihot.virxact.com/items/cmtq5pxc10275roiufscxyie4' },
    },
  ],
})
const leads = parseAihotLeads(sample)
eq('解析出 1 条线索', leads.length, 1)
const serialized = JSON.stringify(leads)
ok('结果里没有对方的 summary', !serialized.includes('对方写的摘要'), serialized.slice(0, 200))
ok('结果里没有对方的 reason', !serialized.includes('对方写的推荐理由'))
ok('结果里没有 summary 这个键', !Object.prototype.hasOwnProperty.call(leads[0], 'summary'))
ok('结果里没有 reason 这个键', !Object.prototype.hasOwnProperty.call(leads[0], 'reason'))
ok('结果里没有 score 这个键（用了等于让第三方判断决定我们的排序）', !Object.prototype.hasOwnProperty.call(leads[0], 'score'))
eq('取到原发布者名', leads[0].originSourceName, '公众号：某某')
eq('取到原文地址', leads[0].url, 'https://blog.google/some-post')
eq('回链指向对方站点', leads[0].leadUrl, 'https://aihot.virxact.com/items/cmtq5pxc10275roiufscxyie4')

console.log('\n【AIHOT 域名过滤】—— 抓不到正文的线索必须在入口就丢掉')
const mk = (original: string) =>
  JSON.stringify({
    items: [
      {
        id: 'x1',
        title: 't',
        source: { name: 's' },
        links: { aihot: 'https://aihot.virxact.com/items/x1', original },
        publishedAt: '2026-09-06T18:00:00.000Z',
      },
    ],
  })
eq('丢弃 x.com', parseAihotLeads(mk('https://x.com/a/status/1')).length, 0)
eq('丢弃微信公众号', parseAihotLeads(mk('https://mp.weixin.qq.com/s?__biz=abc')).length, 0)
eq('丢弃 huggingface', parseAihotLeads(mk('https://huggingface.co/papers/1')).length, 0)
eq('保留 blog.google', parseAihotLeads(mk('https://blog.google/post')).length, 1)
eq('保留 claude.com', parseAihotLeads(mk('https://claude.com/news/x')).length, 1)

console.log('\n【回链地址必须真的指向对方】—— 不校验就等于把任意 URL 存库再原样渲染成 <a href>')
const evil = JSON.stringify({
  items: [
    {
      id: 'x2',
      title: 't',
      source: { name: 's' },
      links: { aihot: 'https://evil.example.com/phish', original: 'https://blog.google/post' },
      publishedAt: '2026-09-06T18:00:00.000Z',
      attribution: { name: 'AIHOT', url: 'https://evil.example.com/phish' },
    },
  ],
})
eq('非对方域名的回链被置空', parseAihotLeads(evil)[0].leadUrl, null)
const lookalike = JSON.stringify({
  items: [
    {
      id: 'x3',
      title: 't',
      source: { name: 's' },
      links: { aihot: 'https://aihot.virxact.com.evil.com/p', original: 'https://blog.google/post' },
      publishedAt: '2026-09-06T18:00:00.000Z',
    },
  ],
})
eq('后缀仿冒域名也被置空', parseAihotLeads(lookalike)[0].leadUrl, null)

console.log('\n【响应形状变了要静默返回 0 条，不是抛错】—— 抛错会让这个源被熔断禁用')
eq('空 JSON', parseAihotLeads('{}').length, 0)
eq('坏 JSON', parseAihotLeads('not json').length, 0)
eq('items 不是数组', parseAihotLeads('{"items":"x"}').length, 0)
eq('缺 links.original 的条目被跳过', parseAihotLeads(JSON.stringify({ items: [{ id: 'a', title: 't', links: {} }] })).length, 0)

console.log('\n【SKILL §1.1 禁词 / §1.2 选题黑名单的落库前兜底】')
eq('摘要出现「记者」被抓到', forbiddenHit('本报记者从现场了解到'), '记者')
eq('出现「独家」被抓到', forbiddenHit('独家获悉该公司'), '独家')
eq('正常摘要不误伤', forbiddenHit('该模型上下文扩到 100 万 token，定价不变'), null)
eq('出口管制被拦', blocklistHit('美国商务部收紧芯片出口管制'), '出口管制')
eq('大规模裁员被拦', blocklistHit('该公司宣布大规模裁员'), '大规模裁员')
eq('正常技术内容不误伤', blocklistHit('模型在 MMLU 上提升 3 个百分点'), null)

console.log('\n【分页大小必须只有一个来源】—— 两边各写一个数会静默重复渲染 + 尾部条目永远拿不到')
// 这是本轮真踩过的坑：归档页首屏 take 30、而 /api/news/list 用 skip/take 20，
// 点一次「加载更多」就重复 10 条；某月 41-50 条时尾部几条永远渲染不到，
// 页面还显示「已全部列出」。全程不报错、不进日志，只能靠断言拦。
const SRC_ROOT = join(__dirname, '..')
const readSrc = (rel: string) => readFileSync(join(SRC_ROOT, rel), 'utf-8')
for (const f of [
  'src/app/api/news/list/route.ts',
  'src/app/(shop)/news/page.tsx',
  'src/app/(shop)/news/archive/[month]/page.tsx',
]) {
  ok(
    `${f} 用 NEWS_PAGE_SIZE 而不是写死数字`,
    readSrc(f).includes('const PAGE_SIZE = NEWS_PAGE_SIZE'),
    '出现写死的页大小，迟早与另外两处漂移'
  )
}
eq('NEWS_PAGE_SIZE', NEWS_PAGE_SIZE, 20)

console.log('\n【线索条目绝不能只拿标题去分诊】—— 素材退化成「（无）」等于放松黑名单判定')
// collect 把线索的 summaryRaw 写死 null。超出抓取名额的线索若仍被放行，
// 素材就恒为「（无）」，等于只拿标题做合规判定 —— 必须推迟到下一轮。
const pipelineSrc = readSrc('src/lib/news/pipeline.ts')
ok(
  'fetchLeadBodies 把超名额的线索推迟到下一轮',
  pipelineSrc.includes('const deferred = new Set(allLeads.slice(LEAD_BODY_MAX)'),
  '超出 LEAD_BODY_MAX 的线索没被推迟，会带着空素材进分诊'
)
ok(
  '分诊批次同时排除「抓不到正文」与「本轮推迟」两类',
  pipelineSrc.includes('!leadBodies.skip.has(it.id)'),
  '批次过滤没有用合并后的 skip 集合'
)
ok(
  'collect 的线索分支把 summaryRaw 写死 null',
  pipelineSrc.includes('summaryRaw: null,'),
  '线索条目的 summaryRaw 不是写死 null，授权边界失守'
)

console.log('\n【授权号常量】')
eq('授权号', AIHOT_LICENSE, 'AIHOTAPI20260907001')

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
