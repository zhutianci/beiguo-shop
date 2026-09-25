/**
 * 论坛限流闸门（lib/forum-throttle.ts）自测。**不连数据库**，照 scripts/check-rate-limit.ts 的形式。
 *   npx tsx scripts/check-forum-throttle.ts
 *
 * 钉住 2026-09-26 审计 G44 的几件事：发帖/评论有上限且管理员不限；换 x-anon-id 刷不了赞；
 * 取消赞归还名额（净增 ≤ 1）；浏览数同一读者 1 小时只计 1 次；同一身份的点赞切换串行。
 * 时间用替换 Date.now 的方式快进，不真等。
 */
import {
  forumWriteGate,
  forumLikeGate,
  anonLikeBlocked,
  anonLikeRelease,
  forumViewCounted,
  likeLockKey,
  acquireLikeLock,
  releaseLikeLock,
} from '../src/lib/forum-throttle'
import type { Actor } from '../src/lib/forum'

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
const HOUR = 60 * MIN

const hdr = (ip: string) => new Headers({ 'cf-connecting-ip': ip })
const anon = (anonId = 'a1'): Actor => ({ userId: null, isAdmin: false, nickname: null, anonId })
const member = (userId: number): Actor => ({ userId, isAdmin: false, nickname: 'x', anonId: null })
const admin: Actor = { userId: 1, isAdmin: true, nickname: 'admin', anonId: null }

console.log('\n发帖：')
{
  const h = hdr('1.1.1.1')
  const r = [1, 2, 3, 4].map(() => forumWriteGate(h, anon(), 'post'))
  ok('匿名同 IP 每小时 3 帖，第 4 帖拒绝', r.slice(0, 3).every((x) => x === null) && !!r[3], JSON.stringify(r))
  ok('换 x-anon-id 也没用（按 IP 计）', !!forumWriteGate(h, anon('other'), 'post'))
  ok('另一个 IP 不受影响', forumWriteGate(hdr('2.2.2.2'), anon(), 'post') === null)
  const u = [1, 2, 3, 4, 5, 6].map(() => forumWriteGate(h, member(42), 'post'))
  ok('登录用户按 userId 计：每小时 5 帖，第 6 帖拒绝（不受 IP 额度影响）', u.slice(0, 5).every((x) => x === null) && !!u[5], JSON.stringify(u))
  ok('管理员不限', Array.from({ length: 50 }, () => forumWriteGate(h, admin, 'post')).every((x) => x === null))
  advance(HOUR)
  ok('窗口过后恢复', forumWriteGate(h, anon(), 'post') === null)
}

console.log('\n评论：')
{
  const h = hdr('3.3.3.3')
  const r = Array.from({ length: 11 }, () => forumWriteGate(h, anon(), 'comment'))
  ok('匿名同 IP 10 分钟 10 条，第 11 条拒绝', r.slice(0, 10).every((x) => x === null) && !!r[10])
  ok('IPv6 首条放行', forumWriteGate(hdr('2001:db8:1:2::1'), anon(), 'comment') === null)
  const v6 = Array.from({ length: 10 }, (_, i) => forumWriteGate(hdr(`2001:db8:1:2::${i + 10}`), anon(), 'comment'))
  ok('……同 /64 换地址第 11 条被拒', !!v6[9], JSON.stringify(v6))
}

console.log('\n全站匿名熔断：')
{
  let denied: string | null = null
  for (let i = 0; i < 40 && !denied; i++) denied = forumWriteGate(hdr(`9.9.${i}.1`), anon(), 'post')
  ok('换 IP 刷发帖，最终撞上全站熔断', !!denied && denied.includes('登录'), String(denied))
  ok('熔断时登录用户不受影响', forumWriteGate(hdr('9.9.99.1'), member(7), 'post') === null)
}

console.log('\n点赞：')
{
  const h = hdr('4.4.4.4')
  // 同一出口 IP 对同一目标每天 3 个赞（CGNAT 下一个出口 IP 后面有很多真实用户）
  ok('匿名第一次赞 p1 放行', anonLikeBlocked(h, 'p1') === false)
  ok('同 IP 第二、三个赞 p1 放行', anonLikeBlocked(h, 'p1') === false && anonLikeBlocked(h, 'p1') === false)
  ok('同 IP 第四个赞 p1 拒绝', anonLikeBlocked(h, 'p1') === true)
  ok('同 IP 赞另一个目标不受影响', anonLikeBlocked(h, 'p2') === false)
  anonLikeRelease(h, 'p1')
  ok('取消赞归还名额后可再赞（净增仍 ≤ 3）', anonLikeBlocked(h, 'p1') === false)
  ok('另一个 IP 可以赞 p1', anonLikeBlocked(hdr('5.5.5.5'), 'p1') === false)
  const g = Array.from({ length: 121 }, () => forumLikeGate(h, anon()))
  ok('匿名同 IP 10 分钟最多切换 120 次', g.slice(0, 120).every((x) => x === null) && !!g[120])
  const gu = Array.from({ length: 61 }, () => forumLikeGate(h, member(9)))
  ok('登录用户 10 分钟最多切换 60 次', gu.slice(0, 60).every((x) => x === null) && !!gu[60])
  ok('管理员不限', forumLikeGate(h, admin) === null)
}

console.log('\n点赞串行锁：')
{
  const k = likeLockKey(member(3), 'p9')
  ok('第一次拿到锁', acquireLikeLock(k) === true)
  ok('并发的第二个请求拿不到', acquireLikeLock(k) === false)
  ok('别的目标不受影响', acquireLikeLock(likeLockKey(member(3), 'p10')) === true)
  releaseLikeLock(k)
  ok('释放后可再拿', acquireLikeLock(k) === true)
  releaseLikeLock(k)
}

console.log('\n浏览计数：')
{
  const h = hdr('6.6.6.6')
  ok('第一次计数', forumViewCounted(h, anon(), 100) === true)
  ok('1 小时内刷新不计', [1, 2, 3].every(() => forumViewCounted(h, anon('x'), 100) === false))
  ok('别的帖子照常计数', forumViewCounted(h, anon(), 101) === true)
  ok('登录用户按 userId 计', forumViewCounted(h, member(5), 100) === true && forumViewCounted(hdr('7.7.7.7'), member(5), 100) === false)
  advance(HOUR)
  ok('1 小时后再计一次', forumViewCounted(h, anon(), 100) === true)
  ok('拿不到 IP 的匿名读者不计数', forumViewCounted(new Headers(), anon(), 100) === false)
}

console.log(`\n${pass} 通过，${fail} 失败`)
process.exit(fail ? 1 : 0)
