/**
 * 进程内限流（lib/news/rate-limit.ts）自测。**不连数据库**，照 scripts/check-coupon.ts 的形式。
 *   npx tsx scripts/check-rate-limit.ts
 *
 * 重点钉三件事：计数语义没变；随便刷 key 撑不爆内存；刷一个桶清不掉另一个桶的计数。
 * 时间用替换 Date.now 的方式快进，不真等。
 */
import { rateLimited, rateLimitKeyCount, rateLimitScopeCount } from '../src/lib/news/rate-limit'

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

let clock = 1_700_000_000_000
Date.now = () => clock
const advance = (ms: number) => {
  clock += ms
}

const MIN = 60_000
const CAP = 5000

console.log('\n计数语义（与改动前一致）：')
{
  const rule = { windowMs: MIN, max: 3 }
  const r = [1, 2, 3, 4].map(() => rateLimited('t-basic:a', rule))
  ok('前 3 次放行、第 4 次拒绝', JSON.stringify(r) === '[false,false,false,true]', JSON.stringify(r))
  ok('不同 key 各算各的', rateLimited('t-basic:b', rule) === false)
  advance(MIN - 1)
  ok('窗口内仍拒绝', rateLimited('t-basic:a', rule) === true)
  advance(1)
  ok('窗口滑过后放行', rateLimited('t-basic:a', rule) === false)
}
{
  // 被拒的请求不计数：否则持续被拒的人窗口永远滑不走
  const rule = { windowMs: MIN, max: 1 }
  rateLimited('t-reject:a', rule)
  for (let i = 0; i < 10; i++) {
    advance(MIN / 20)
    rateLimited('t-reject:a', rule)
  }
  advance(MIN / 2)
  ok('被拒的请求不把窗口撑长', rateLimited('t-reject:a', rule) === false)
}

console.log('\n容量上限：')
{
  const rule = { windowMs: 10 * MIN, max: 40 }
  const started = performance.now()
  for (let i = 0; i < 200_000; i++) rateLimited(`t-flood:${i}`, rule)
  const cost = performance.now() - started
  const n = rateLimitKeyCount('t-flood')
  ok(`20 万个全在窗口内的随机 key 之后，桶里不超过 ${CAP} 个`, n <= CAP, `实际 ${n}`)
  ok('插入是均摊 O(1) 的（20 万次 < 2 秒）', cost < 2000, `实际 ${cost.toFixed(0)}ms`)
}
{
  // 平时不被刷的时候，过期条目也会被新请求顺手清掉，不是等到满了才动
  const rule = { windowMs: MIN, max: 5 }
  for (let i = 0; i < 1000; i++) rateLimited(`t-expire:${i}`, rule)
  ok('先放进 1000 个', rateLimitKeyCount('t-expire') === 1000)
  advance(MIN)
  rateLimited('t-expire:new', rule)
  ok('过了窗口再来一个新 key，旧的过期条目被清掉', rateLimitKeyCount('t-expire') === 1, `实际 ${rateLimitKeyCount('t-expire')}`)
}

console.log('\n桶之间互相隔离（刷满一个桶清不掉别的桶）：')
{
  const redeem = { windowMs: MIN, max: 20 }
  for (let i = 0; i < 20; i++) rateLimited('t-rd-ip:9.9.9.9', redeem)
  ok('兑换 IP 已打满', rateLimited('t-rd-ip:9.9.9.9', redeem) === true)
  // 攻击者拿随机 viewerKey 刷浏览计数
  for (let i = 0; i < 50_000; i++) rateLimited(`t-nv:${i}`, { windowMs: 10 * MIN, max: 40 })
  ok('刷 5 万个 nv key 之后，兑换 IP 仍然被拒', rateLimited('t-rd-ip:9.9.9.9', redeem) === true)
}
{
  // 同一个桶里：正在被打满的 key 每次命中都会挪回队尾，不会被新 key 先挤掉
  const rule = { windowMs: 10 * MIN, max: 3 }
  for (let i = 0; i < 3; i++) rateLimited('t-lru:attacker', rule)
  let stillLimited = true
  for (let i = 0; i < 3 * CAP; i++) {
    rateLimited(`t-lru:${i}`, rule)
    if (i % (CAP / 2) === 0) stillLimited = rateLimited('t-lru:attacker', rule) && stillLimited
  }
  ok('持续命中的 key 不会被淘汰（计数不被清零）', stillLimited && rateLimited('t-lru:attacker', rule) === true)
}

console.log('\n不同窗口的 key 不再互相误删（旧实现的 bug）：')
{
  // 旧实现：表超过 5000 条时，用「本次调用」的窗口（比如 60 秒）判断所有 key 过没过期，
  // 于是 24 小时窗口的分享去重计数，2 分钟后就会被一个 60 秒窗口的调用顺手删掉
  const day = { windowMs: 24 * 60 * MIN, max: 1 }
  rateLimited('t-ns:viewer:42', day)
  advance(2 * MIN)
  // 别的桶里大量 60 秒窗口的调用
  for (let i = 0; i < 6000; i++) rateLimited(`t-short:${i}`, { windowMs: MIN, max: 5 })
  // 同一个桶里（排在它后面）的 60 秒窗口调用：清理队头时按条目自己的 24 小时窗口判断，不会误删
  for (let i = 0; i < 100; i++) rateLimited(`t-ns:other:${i}`, { windowMs: MIN, max: 5 })
  ok('24 小时窗口的计数 2 分钟后仍然有效', rateLimited('t-ns:viewer:42', day) === true)
}

console.log('\n前缀的个数也有上限：')
{
  const rule = { windowMs: MIN, max: 1 }
  for (let i = 0; i < 1000; i++) rateLimited(`t-scope-${i}:x`, rule)
  const s = rateLimitScopeCount()
  ok('1000 个不同前缀之后，桶数不超过 201（200 + 溢出桶）', s <= 201, `实际 ${s}`)
  ok('溢出桶里的 key 也照常计数', rateLimited('t-scope-999:x', rule) === true)
}

console.log(`\n${pass} 通过，${fail} 失败`)
if (fail > 0) process.exit(1)
