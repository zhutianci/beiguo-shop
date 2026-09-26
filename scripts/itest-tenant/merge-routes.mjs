#!/usr/bin/env node
/**
 * 渠道分站 · 路由总表合并与核对（WP8，实施分包 11.4）。
 *
 *   node scripts/itest-tenant/merge-routes.mjs            # 合并 routes/wp*.json → scripts/itest-tenant.routes.json（生成物，入库）
 *   node scripts/itest-tenant/merge-routes.mjs --check    # 只核对不写：总表与各包清单 / 实际目录不一致即失败（run-all 与发布前用）
 *   node scripts/itest-tenant/merge-routes.mjs --selftest # W8-3：内存里新增一个未登记的 partner 路由 / 删掉一条登记，都必须失败
 *
 * 【为什么要和实际目录比】各包的 routes/wpN.json 是手写的；新增一个 partner 路由而忘了登记，
 * 跨租户总扫描（cross-tenant.ts 的 T1 矩阵）就不会覆盖它——越权漏洞恰好会出在「没人测的那个新接口」上。
 * 所以比对是双向的：
 *   ① 清单里每一行：文件存在、路径与文件位置一致、文件确实导出了这个 HTTP 方法；
 *   ② 下列范围内的每个实际路由（每个导出的方法）都必须登记（分包 11.4）：
 *      src/app/api/partner/**、src/app/api/admin/{tenants,statements,after-sales,audit,redeem-logs}/**、
 *      src/app/api/admin/orders/[id]/resettle、src/app/api/admin/users/[id]/sites/**。
 * 范围外的登记（例如 WP4 登记的 vmq/complete GET）允许，只做 ① 的核对。
 *
 * 纯文本脚本（规则 10：不 import src/）；输出不带时间戳，重复生成字节不变，方便 --check 与代码审查。
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..')
const OUT_REL = 'scripts/itest-tenant.routes.json'
const SRC_DIR_REL = 'scripts/itest-tenant/routes'
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

/** 必须全部登记的实际路由范围（相对 src/app） */
const SCOPE = [
  /^api\/partner(\/|$)/,
  /^api\/admin\/(tenants|statements|after-sales|audit|redeem-logs)(\/|$)/,
  /^api\/admin\/orders\/\[id\]\/resettle$/,
  /^api\/admin\/users\/\[id\]\/sites(\/|$)/,
]

function walkRoutes(root, rel, out) {
  let ents
  try {
    ents = fs.readdirSync(path.join(root, rel), { withFileTypes: true })
  } catch {
    return
  }
  for (const e of ents) {
    const r = `${rel}/${e.name}`
    if (e.isDirectory()) walkRoutes(root, r, out)
    else if (e.name === 'route.ts' || e.name === 'route.js') out.push(r)
  }
}

/** 去掉注释后找导出的方法（export async function GET / export const GET =） */
function exportedMethods(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
  const set = new Set()
  const re = new RegExp(`\\bexport\\s+(?:async\\s+)?(?:function|const)\\s+(${METHODS.join('|')})\\b`, 'g')
  let m
  while ((m = re.exec(code))) set.add(m[1])
  return set
}

/**
 * 读取输入。overlay 用于自测：{ 'src/app/api/partner/x/route.ts': '源码' | null, 'scripts/itest-tenant/routes/wp9.json': 'JSON' | null }
 */
export function loadInputs(root, overlay = {}) {
  const routeFiles = new Map()
  const list = []
  walkRoutes(root, 'src/app/api', list)
  for (const f of list) routeFiles.set(f, fs.readFileSync(path.join(root, f), 'utf8'))
  const lists = new Map()
  let names = []
  try {
    names = fs.readdirSync(path.join(root, SRC_DIR_REL)).filter((n) => /^wp\d+\.json$/.test(n))
  } catch {
    names = []
  }
  for (const n of names) lists.set(`${SRC_DIR_REL}/${n}`, fs.readFileSync(path.join(root, SRC_DIR_REL, n), 'utf8'))
  for (const [k, v] of Object.entries(overlay)) {
    const target = k.startsWith(SRC_DIR_REL + '/') ? lists : routeFiles
    if (v === null) target.delete(k)
    else target.set(k, v)
  }
  let existing = null
  try {
    existing = fs.readFileSync(path.join(root, OUT_REL), 'utf8')
  } catch {
    existing = null
  }
  return { routeFiles, lists, existing }
}

export function merge({ routeFiles, lists }) {
  const errors = []
  const routes = []
  const sources = []
  const seen = new Map()
  const sortedLists = Array.from(lists.keys()).sort((a, b) => Number(/wp(\d+)/.exec(a)[1]) - Number(/wp(\d+)/.exec(b)[1]))
  for (const lf of sortedLists) {
    let j
    try {
      j = JSON.parse(lists.get(lf))
    } catch (e) {
      errors.push(`${lf} 不是合法 JSON：${e.message}`)
      continue
    }
    const pkg = j.package || path.basename(lf, '.json').toUpperCase()
    if (!Array.isArray(j.routes)) {
      errors.push(`${lf} 缺少 routes 数组`)
      continue
    }
    sources.push({ package: pkg, file: lf, count: j.routes.length })
    for (const r of j.routes) {
      const method = String(r.method || '').toUpperCase()
      const where = `${lf} · ${method} ${r.path}`
      if (!METHODS.includes(method)) errors.push(`${where}：method 不合法`)
      if (typeof r.path !== 'string' || !r.path.startsWith('/api/')) {
        errors.push(`${where}：path 必须以 /api/ 开头`)
        continue
      }
      const expectFile = `src/app${r.path}/route.ts`
      if (r.file && r.file !== expectFile) errors.push(`${where}：file 与 path 不一致（应为 ${expectFile}）`)
      const src = routeFiles.get(expectFile) ?? routeFiles.get(expectFile.replace(/\.ts$/, '.js'))
      if (src == null) errors.push(`${where}：文件不存在（${expectFile}）`)
      else if (!exportedMethods(src).has(method)) errors.push(`${where}：${expectFile} 没有导出 ${method}`)
      const key = `${method} ${r.path}`
      if (seen.has(key)) errors.push(`${where}：与 ${seen.get(key)} 重复登记`)
      seen.set(key, lf)
      routes.push({ package: pkg, ...r, method, file: expectFile })
    }
  }
  // ② 实际目录 → 必须登记
  for (const [f, src] of routeFiles) {
    const rel = f.replace(/^src\/app\//, '').replace(/\/route\.(ts|js)$/, '')
    if (!SCOPE.some((re) => re.test(rel))) continue
    const ms = exportedMethods(src)
    if (ms.size === 0) errors.push(`${f}：范围内的路由没有导出任何 HTTP 方法（无法核对）`)
    for (const m of ms) if (!seen.has(`${m} /${rel}`)) errors.push(`未登记：${m} /${rel}（${f}）——在所属包的 ${SRC_DIR_REL}/wpN.json 里加一行`)
  }
  routes.sort((a, b) => (a.path === b.path ? METHODS.indexOf(a.method) - METHODS.indexOf(b.method) : a.path < b.path ? -1 : 1))
  const out = {
    note: '生成物，勿手改：node scripts/itest-tenant/merge-routes.mjs 由 scripts/itest-tenant/routes/wp*.json 合并并与实际目录比对后写出。边界检查规则 10 与 cross-tenant.ts 的 T1 矩阵读它。',
    sources,
    routes,
  }
  return { errors, json: JSON.stringify(out, null, 2) + '\n', routes }
}

function selftest(root) {
  const base = merge(loadInputs(root))
  let ok = base.errors.length === 0
  console.log(`[merge-routes selftest] 基线：${base.routes.length} 条登记，错误 ${base.errors.length}`)
  const cases = [
    {
      name: '新增一个 partner 路由但不登记',
      overlay: { 'src/app/api/partner/zz-selftest/route.ts': "export const dynamic = 'force-dynamic'\nexport const GET = partnerRoute('dashboard.read', h)\n" },
      expect: /未登记：GET \/api\/partner\/zz-selftest/,
    },
    {
      name: '已有路由新增一个方法但不登记',
      overlay: { 'src/app/api/partner/dashboard/route.ts': "export const dynamic = 'force-dynamic'\nexport const GET = partnerRoute('dashboard.read', h)\nexport const DELETE = partnerRoute('dashboard.read', h)\n" },
      expect: /未登记：DELETE \/api\/partner\/dashboard/,
    },
    {
      name: '新增超管渠道路由但不登记',
      overlay: { 'src/app/api/admin/tenants/[id]/zz-selftest/route.ts': 'export async function POST(req) { await adminGuard(req) }\n' },
      expect: /未登记：POST \/api\/admin\/tenants\/\[id\]\/zz-selftest/,
    },
    {
      name: '登记了不存在的路由',
      overlay: { 'scripts/itest-tenant/routes/wp99.json': JSON.stringify({ package: 'WP99', routes: [{ method: 'GET', path: '/api/partner/nope' }] }) },
      expect: /文件不存在/,
    },
  ]
  for (const c of cases) {
    const r = merge(loadInputs(root, c.overlay))
    const good = r.errors.some((e) => c.expect.test(e))
    ok = ok && good
    console.log(`  ${good ? '✓' : '✗'} ${c.name} → ${good ? '失败（符合预期）' : `没有报错：${r.errors.join('；') || '无错误'}`}`)
  }
  console.log(`[merge-routes selftest] ${ok ? '✅ 全过' : '❌ 有用例没拦下'}`)
  return ok
}

function main() {
  const argv = process.argv.slice(2)
  const rootArg = argv.indexOf('--root')
  const root = rootArg >= 0 ? path.resolve(argv[rootArg + 1]) : REPO_ROOT
  if (argv.includes('--selftest')) process.exit(selftest(root) ? 0 : 1)
  const inputs = loadInputs(root)
  const r = merge(inputs)
  console.log(`[merge-routes] ${inputs.lists.size} 份清单、${r.routes.length} 条登记（partner ${r.routes.filter((x) => x.path.startsWith('/api/partner/')).length} 条）`)
  if (r.errors.length) {
    for (const e of r.errors) console.log('  ✗ ' + e)
    console.log(`[merge-routes] ❌ ${r.errors.length} 处不一致`)
    process.exit(1)
  }
  if (argv.includes('--check')) {
    if (inputs.existing !== r.json) {
      console.log(`[merge-routes] ❌ ${OUT_REL} 与各包清单不一致（过期或被手改）：重新运行 node scripts/itest-tenant/merge-routes.mjs 并提交`)
      process.exit(1)
    }
    console.log(`[merge-routes] ✅ ${OUT_REL} 与各包清单、实际目录一致`)
    return
  }
  fs.writeFileSync(path.join(root, OUT_REL), r.json)
  console.log(`[merge-routes] ✅ 已写出 ${OUT_REL}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main()
