/**
 * 渠道分站 · 测试总入口（WP8，实施分包 11.4）：**串行**跑全部渠道相关的检查与集成测试，任何一步失败即整体失败。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/run-all.ts
 *   （或 npm run itest:tenant；参数原样传给 cross-tenant.ts，例如 -- --no-nginx）
 *
 * 顺序：边界检查（含自测、W8-9 文档路径核对）→ 路由总表核对（含自测）→ check-tenant-math → check-tenant-ledger → itest wp0..wp7 → cross-tenant。
 * 为什么必须串行（主会话 D10）：每个 itest 开头都 cleanupAll()（按 ITEST 前缀删全部测试数据），并行会互相清掉对方的夹具，
 * 表现为「订单 / 上架行找不到」之类与改动无关的偶发失败。
 *
 * 【库名门禁】DATABASE_URL 的库名不含 dev / test 拒绝运行（与 scripts/seed-local-demo.ts、_harness.ts 同口径）——
 * 这些测试会建数据、删数据，绝不能指向生产库。本文件自己先判一次，免得前面几步不连库的检查跑完才在 itest 里被拦。
 * 不 import src/（只起子进程），所以门禁判定之前不会有任何模块连库。
 */
import { spawnSync } from 'child_process'
import path from 'path'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName || '(未设置 DATABASE_URL)'}」看起来不是一次性开发库（库名须含 dev 或 test）`)
  process.exit(2)
}

const ROOT = path.resolve(__dirname, '../..')
const passThrough = process.argv.slice(2)

interface Step {
  name: string
  cmd: string
  args: string[]
}
// 直接用 node 跑 tsx 的 CLI（不经 npx / shell：Windows 上 .cmd 需要 shell，而仓库路径里有空格）
const TSX_CLI = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const tsx = (file: string, extra: string[] = []): Step => ({ name: file, cmd: process.execPath, args: [TSX_CLI, file, ...extra] })
const node = (file: string, extra: string[] = []): Step => ({ name: `${file} ${extra.join(' ')}`.trim(), cmd: process.execPath, args: [file, ...extra] })

const STEPS: Step[] = [
  node('scripts/check-tenant-boundary.mjs'),
  node('scripts/check-tenant-boundary.mjs', ['--selftest']),
  node('scripts/check-tenant-boundary.mjs', ['--doc-paths']),
  node('scripts/itest-tenant/merge-routes.mjs', ['--check']),
  node('scripts/itest-tenant/merge-routes.mjs', ['--selftest']),
  tsx('scripts/check-tenant-math.ts'),
  tsx('scripts/check-tenant-ledger.ts'),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((n) => tsx(`scripts/itest-tenant/wp${n}.ts`)),
  tsx('scripts/itest-tenant/cross-tenant.ts', passThrough),
]

const results: { name: string; code: number; ms: number; tail: string }[] = []
for (const s of STEPS) {
  const t0 = Date.now()
  console.log(`\n==================== ${s.name} ====================`)
  const r = spawnSync(s.cmd, s.args, { cwd: ROOT, env: process.env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const out = `${r.stdout || ''}${r.stderr || ''}`
  process.stdout.write(out)
  const code = r.status ?? 1
  // 优先取标准汇总行（「✅ 通过 N，失败 M」）：业务日志里也会出现「失败」二字（注入故障的告警），不能拿最后一个含「失败」的行
  const lines = out.trim().split('\n')
  const tail =
    lines.filter((l) => /^\s*(✅|❌) 通过 \d+，失败 \d+/.test(l)).slice(-1)[0] ||
    lines.filter((l) => /^\[(tenant-boundary|selftest|doc-paths|merge-routes|merge-routes selftest)\] (✅|❌)/.test(l)).slice(-1)[0] ||
    `退出码 ${code}`
  results.push({ name: s.name, code, ms: Date.now() - t0, tail: tail.trim() })
}

console.log('\n==================== 汇总 ====================')
for (const r of results) console.log(`${r.code === 0 ? '✅' : '❌'} ${r.name}（${(r.ms / 1000).toFixed(1)}s）：${r.tail}`)
const failed = results.filter((r) => r.code !== 0)
console.log(failed.length ? `\n❌ ${failed.length} 步失败：${failed.map((f) => f.name).join('、')}` : `\n✅ 全部 ${results.length} 步通过`)
process.exit(failed.length ? 1 : 0)
