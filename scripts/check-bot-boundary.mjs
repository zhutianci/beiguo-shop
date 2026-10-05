#!/usr/bin/env node
/**
 * 微信机器人 · 构建前边界检查（docs/微信机器人-设计.md §7.6、§15，附录 B）。
 *
 *   node scripts/check-bot-boundary.mjs   # 有违规退出码 1（package.json 的 prebuild 挂着它）
 *
 * 纯文本扫描、不 import src/（理由同 check-tenant-boundary.mjs：构建机上依赖可能还没生成，也不该跑业务模块的副作用）；
 * 词法器直接复用 check-tenant-boundary.mjs 的 lex（去注释，字符串原样保留）。
 * 每次运行先用内置样例把每条规则跑一遍（阳性对照），哪条没命中就直接失败——正则写坏了不能静默空跑。
 *
 * 规则：
 *  B1 旁路 src/lib/bot/sink.ts 的运行时依赖闭包（静态 import，跟到 src/lib 里）不许含 notify.ts、bot/adapters、bot/sender、
 *     bot/commands、bot/inbound、bot/runtime：notify() 与 alertPlatform() 第一行就调它，闭包里有这些会形成循环依赖，
 *     或者把发送器、协议适配器拉进每一个调用 notify 的模块。**sink.ts 里也不许有任何 import(**：动态 import 会把整个机器人
 *     作为异步块挂到每个引用 notify 的路由入口上，2026-10-05 服务器 next build 因此撑爆 640MB 构建堆（改为 globalThis 钩子）。
 *  B2 src/lib/bot/** 不许写 payments、不许调 fulfillOrder：提卡不走支付与履约链路（§8.4，不发买家邮件、不触发返现 / 抽奖 / 券）。
 *  B3 src/lib/bot/commands/** 不许 import 支付、钱包、履约、退款、平台快速回复、财务令牌、渠道密钥模块。
 *  B4 指令层（src/lib/bot/commands/**）不直接查业务表（订单、用户、卡密、商品、发票、收据、留言……），只经收窄过的数据访问函数
 *     （src/lib/bot/data、report、ops 下，参数里显式带分站范围），§7.6「处理函数拿不到别的分站」。指令层自己只碰 bot_* 表与 tenants。
 *     真正的分站隔离验证在 itest：A 分站群里查不到 B 分站的任何东西。
 *  B5 协议服务的环境变量 BOT_WXPAD_* 只许 src/lib/bot/adapters/** 与 src/app/api/bot/wxpad/** 读（管理密钥不扩散）。
 * 后台接口必须 adminGuard 由 check-tenant-boundary.mjs 规则 6 管（覆盖 src/app/api/admin/**），这里不重复。
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { lex } from './check-tenant-boundary.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const REPO_ROOT = path.resolve(path.dirname(__filename), '..')

const rel = (p) => p.split(path.sep).join('/')

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|mjs|js)$/.test(e.name)) out.push(p)
  }
  return out
}

/** { 'src/lib/bot/x.ts': 去注释后的源码 } */
function loadFiles(root) {
  const files = {}
  for (const sub of ['src/lib', 'src/app']) {
    for (const p of walk(path.join(root, sub))) files[rel(path.relative(root, p))] = lex(fs.readFileSync(p, 'utf8')).code
  }
  return files
}

const lineOf = (code, idx) => code.slice(0, idx).split('\n').length

/** 静态 import / export-from（不含 import type、全是 type 的花括号）→ 模块说明符 */
function runtimeImports(code) {
  const out = []
  const re = /(?:^|\n)\s*(import|export)\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(code))) {
    if (m[2]) continue
    const spec = m[3].trim()
    if (m[1] === 'export' && !/^(\{|\*)/.test(spec)) continue
    const braces = spec.match(/\{([\s\S]*)\}/)
    const outside = braces ? spec.replace(braces[0], '').replace(/,/g, '').trim() : spec
    if (braces && !outside) {
      const names = braces[1].split(',').map((s) => s.trim()).filter(Boolean)
      if (names.length && names.every((n) => /^type\s/.test(n))) continue
    }
    out.push({ spec: m[4], index: m.index })
  }
  const side = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g
  while ((m = side.exec(code))) out.push({ spec: m[1], index: m.index })
  return out
}

function resolveSpec(fromFile, spec, files) {
  let base
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2)
  else if (spec.startsWith('.')) base = rel(path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec)))
  else return null // 包依赖
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) if (files[cand] !== undefined) return cand
  return null
}

function hit(rule, file, code, index, msg) {
  return { rule, file, line: index == null ? 0 : lineOf(code, index), msg }
}

// ---------------------------------------------------------------------------------------------
// 规则
// ---------------------------------------------------------------------------------------------

const SINK = 'src/lib/bot/sink.ts'
const B1_FORBIDDEN = [/^src\/lib\/notify\.ts$/, /^src\/lib\/bot\/adapters\//, /^src\/lib\/bot\/sender\.ts$/, /^src\/lib\/bot\/commands\//, /^src\/lib\/bot\/inbound\.ts$/, /^src\/lib\/bot\/runtime\.ts$/]

function ruleB1(files) {
  const out = []
  if (files[SINK] === undefined) return [hit('B1', SINK, '', null, '找不到旁路 sink.ts')]
  const dyn = /\bimport\s*\(/.exec(files[SINK])
  if (dyn) out.push(hit('B1', SINK, files[SINK], dyn.index, '旁路里不许动态 import（会把整个机器人挂到每个引用 notify 的路由入口上）'))
  const seen = new Map([[SINK, null]])
  const queue = [SINK]
  while (queue.length) {
    const f = queue.shift()
    for (const imp of runtimeImports(files[f])) {
      const target = resolveSpec(f, imp.spec, files)
      if (!target || seen.has(target)) continue
      seen.set(target, f)
      if (B1_FORBIDDEN.some((re) => re.test(target))) {
        const chain = [target]
        for (let p = f; p; p = seen.get(p)) chain.unshift(p)
        out.push(hit('B1', f, files[f], imp.index, `旁路的运行时依赖闭包里出现了 ${target}（${chain.join(' → ')}）`))
        continue
      }
      queue.push(target)
    }
  }
  return out
}

function ruleB2(files) {
  const out = []
  for (const [f, code] of Object.entries(files)) {
    if (!f.startsWith('src/lib/bot/')) continue
    let m
    const pay = /\b(?:prisma|tx|db)\s*\.\s*payment\s*\.\s*(create|createMany|update|updateMany|upsert|delete|deleteMany)\b/g
    while ((m = pay.exec(code))) out.push(hit('B2', f, code, m.index, `机器人不许写 payments（${m[0]}）`))
    const ful = /\bfulfillOrder\s*\(/g
    while ((m = ful.exec(code))) out.push(hit('B2', f, code, m.index, '机器人不许调 fulfillOrder（提卡自己发卡，不走履约链路）'))
  }
  return out
}

const B3_FORBIDDEN = /(^|\/)(payment|payments|alipay|wallet|fulfill|refund|quick-reply|action-token|tenant\/crypto|vmq)(\/|\.ts$|$)/

function ruleB3(files) {
  const out = []
  for (const [f, code] of Object.entries(files)) {
    if (!f.startsWith('src/lib/bot/commands/')) continue
    for (const imp of runtimeImports(code)) {
      const target = resolveSpec(f, imp.spec, files) || imp.spec
      if (B3_FORBIDDEN.test(target.replace(/\.tsx?$/, '.ts'))) out.push(hit('B3', f, code, imp.index, `指令层不许 import ${imp.spec}`))
    }
    const dyn = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    let m
    while ((m = dyn.exec(code))) {
      const target = resolveSpec(f, m[1], files) || m[1]
      if (B3_FORBIDDEN.test(target)) out.push(hit('B3', f, code, m.index, `指令层不许动态 import ${m[1]}`))
    }
  }
  return out
}

const BUSINESS_TABLES = /\b(?:prisma|tx|db)\s*\.\s*(order|user|invoice|receipt|orderMessage|cardKey|product|payment|tenantCustomer|tenantListing|externalOrder|pageView|visitor|tenantAfterSale|tenantNotice|tenantStatement|smsOrder|smsActivation|redeemLog|balanceLog|couponGrant|lotteryEntry)\s*\./g

function ruleB4(files) {
  const out = []
  for (const [f, code] of Object.entries(files)) {
    if (!f.startsWith('src/lib/bot/commands/')) continue
    BUSINESS_TABLES.lastIndex = 0
    let m
    while ((m = BUSINESS_TABLES.exec(code))) {
      out.push(hit('B4', f, code, m.index, `指令层直接查业务表（${m[0].replace(/\s+/g, '')}）：改用 src/lib/bot/data 等处带分站范围的数据访问函数`))
    }
  }
  return out
}

function ruleB5(files) {
  const out = []
  for (const [f, code] of Object.entries(files)) {
    if (f.startsWith('src/lib/bot/adapters/') || f.startsWith('src/app/api/bot/wxpad/')) continue
    const re = /process\.env\.BOT_WXPAD_[A-Z_]+|process\.env\[\s*['"]BOT_WXPAD_/g
    let m
    while ((m = re.exec(code))) out.push(hit('B5', f, code, m.index, `协议服务的环境变量只许适配器读（${m[0]}）`))
  }
  return out
}

const RULES = [ruleB1, ruleB2, ruleB3, ruleB4, ruleB5]

function scan(files) {
  return RULES.flatMap((r) => r(files))
}

// ---------------------------------------------------------------------------------------------
// 阳性对照：每条规则一个必须命中的样例，外加一组不得命中的阴性样例
// ---------------------------------------------------------------------------------------------

function selfCheck() {
  const problems = []
  const L = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, lex(v).code]))
  const cases = [
    { rule: 'B1', files: L({ [SINK]: "import { prisma } from '../db'\nvoid import('./runtime')\n", 'src/lib/db.ts': '' }) },
    {
      rule: 'B1',
      files: L({
        [SINK]: "import { prisma } from '../db'\nimport { x } from './helper'\n",
        'src/lib/db.ts': 'export const prisma = 1\n',
        'src/lib/bot/helper.ts': "import { notify } from '../notify'\nexport const x = 1\n",
        'src/lib/notify.ts': 'export function notify() {}\n',
      }),
    },
    { rule: 'B2', files: L({ 'src/lib/bot/x.ts': 'await tx.payment.create({ data: {} })\n' }) },
    { rule: 'B2', files: L({ 'src/lib/bot/x.ts': 'await fulfillOrder(1)\n' }) },
    { rule: 'B3', files: L({ 'src/lib/bot/commands/x.ts': "import { postInTx } from '../../wallet/ledger'\n", 'src/lib/wallet/ledger.ts': '' }) },
    { rule: 'B3', files: L({ 'src/lib/bot/commands/x.ts': "import {\n  quickReplyUrl,\n} from '@/lib/quick-reply'\n", 'src/lib/quick-reply.ts': '' }) },
    { rule: 'B4', files: L({ 'src/lib/bot/commands/x.ts': "export const c = { scopes: ['MGMT', 'TENANT'], run: (ctx) => prisma.order.findMany({ where: { tenantId: ctx.scopeTenantId } }) }\n" }) },
    { rule: 'B4', files: L({ 'src/lib/bot/commands/x.ts': "export const c = { scopes: ['MGMT'], run: () => prisma.cardKey.count() }\n" }) },
    { rule: 'B5', files: L({ 'src/lib/bot/sender.ts': 'const k = process.env.BOT_WXPAD_ADMIN_KEY\n' }) },
  ]
  for (const c of cases) {
    const files = { ...(c.rule === 'B1' ? {} : { [SINK]: '' }), ...c.files }
    const hits = scan(files).filter((h) => h.rule === c.rule)
    if (!hits.length) problems.push(`规则 ${c.rule} 的阳性样例没有命中`)
  }
  const negatives = L({
    [SINK]: "import { prisma } from '../db'\nimport type { NotifyEvent } from '../notify'\nimport { type X } from './sender'\nconst hook = globalThis.__botOnNewEvents\n",
    'src/lib/db.ts': '',
    'src/lib/notify.ts': '',
    'src/lib/bot/sender.ts': '',
    // 只读 payments、在注释里提到 fulfillOrder 不算
    'src/lib/bot/report/x.ts': 'const n = await prisma.payment.count()\n// 不调 fulfillOrder(\n',
    // 指令层碰 bot_* 表与 tenants 可以；业务数据经数据访问函数
    'src/lib/bot/commands/y.ts': "export const c = { scopes: ['TENANT'], run: (ctx) => findOrderForScope(ctx.scopeTenantId, '1') }\nconst n = prisma.botConversation.count()\nconst t = prisma.tenant.findUnique({ where: { id: 1 } })\n",
    // 数据访问函数本身可以查业务表
    'src/lib/bot/data/orders.ts': "export const f = (tenantId) => prisma.order.findMany({ where: { tenantId } })\n",
    'src/lib/bot/adapters/wxpad.ts': 'const k = process.env.BOT_WXPAD_ADMIN_KEY\n',
    'src/app/api/bot/wxpad/hook/[secret]/route.ts': 'const s = process.env.BOT_WXPAD_HOOK_SECRET\n',
  })
  for (const h of scan(negatives)) problems.push(`阴性样例被误报：规则 ${h.rule} ${h.file} ${h.msg}`)
  return problems
}

function main() {
  const problems = selfCheck()
  if (problems.length) {
    console.error('[bot-boundary] ❌ 阳性对照失败（规则写坏了，检查会静默空跑）：')
    for (const p of problems) console.error('  - ' + p)
    process.exit(1)
  }
  const files = loadFiles(REPO_ROOT)
  const botFiles = Object.keys(files).filter((f) => f.startsWith('src/lib/bot/')).length
  const hits = scan(files)
  console.log(`[bot-boundary] 扫描 ${Object.keys(files).length} 个文件（机器人 ${botFiles} 个）`)
  for (const h of hits) console.log(`  ✗ 规则${h.rule} ${h.file}${h.line ? ':' + h.line : ''} ${h.msg}`)
  if (hits.length) {
    console.log(`[bot-boundary] ❌ ${hits.length} 处违规。规则见本文件开头与 docs/微信机器人-设计.md §7.6`)
    process.exit(1)
  }
  console.log('[bot-boundary] ✅ 零违规')
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main()
