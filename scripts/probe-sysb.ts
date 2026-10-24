/**
 * sysb（HongyunAI V2）联调探针。**只读** —— 这个脚本只发 GET 和只读查询，不会消耗任何卡密。
 *
 *   SYSB_API_TOKEN=hyv2_… npx tsx scripts/probe-sysb.ts account            # 代理账户与接单状态
 *   SYSB_API_TOKEN=hyv2_… npx tsx scripts/probe-sysb.ts products           # 当前开通的产品
 *   SYSB_API_TOKEN=hyv2_… npx tsx scripts/probe-sysb.ts order <order_id>   # 查一笔原单
 *                         npx tsx scripts/probe-sysb.ts lookup <卡密>       # 只读查卡（V1 卡密查询，不带 Token）
 *   SYSB_API_TOKEN=hyv2_… npx tsx scripts/probe-sysb.ts check <卡密> [本站商品名]  # 走适配器 check()
 *
 * Token 只从环境变量读，**不要写进命令行参数**（会进 shell 历史）。脚本不打印 Token。
 *
 * 【为什么没有「下单」命令】POST /orders 不可逆，会真的扣掉一张卡。
 * 真要走通写链路，请走正规路径：后台导入一张卡 → 打开 /redeem/sysb → 提交。
 * 那条路才覆盖了「先查原单」、订单号先落库、凭据不落库这些保护。
 *
 * 接入说明见 docs/sysb-接入说明-2026-10-24.md。
 */
import { sysb, __test } from '../src/lib/redeem/providers/sysb'
import { lookupSysbCard } from '../src/lib/redeem/providers/sysb-lookup'

const BASE = 'https://hongyunai.pro/api/v2'

function head(t: string) {
  console.log(`\n${'='.repeat(60)}\n${t}\n${'='.repeat(60)}`)
}

async function get(path: string) {
  const t = (process.env.SYSB_API_TOKEN || '').trim()
  if (!t) throw new Error('先在环境变量里设 SYSB_API_TOKEN')
  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${t}`, 'User-Agent': __test.USER_AGENT },
    cache: 'no-store',
  })
  const text = await r.text()
  head(`GET ${path}  →  HTTP ${r.status}${r.headers.get('retry-after') ? `  Retry-After=${r.headers.get('retry-after')}` : ''}`)
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2))
  } catch {
    console.log(`（不是 JSON）${text.slice(0, 200)}`)
  }
}

async function cmdLookup(cdk: string) {
  head(`只读查卡  ${cdk}`)
  const hit = await lookupSysbCard(cdk, null)
  console.log(hit ? JSON.stringify(hit, null, 2) : 'null —— 三条通道都没给出确定答复（不代表卡是坏的，check() 会退回按商品名兜底）')
}

async function cmdCheck(cdk: string, productName?: string) {
  head(`适配器 check()${productName ? `  本站商品名=${productName}` : ''}`)
  const r = await sysb.check(cdk, { productName })
  console.log(`  state         ${r.state}`)
  console.log(`  文案          ${r.message}`)
  if (r.variants?.length) {
    console.log(`  可选渠道      ${r.variants.map((v) => `${v.code}（${v.label}）`).join(' / ')}`)
    console.log(`  默认渠道      ${r.variantDefault ?? '（无，买家自己选）'}`)
  }
  if (r.fields.length) console.log(`  要填的字段    ${r.fields.map((f) => f.name).join(', ')}`)
  if (r.notice) console.log(`  横幅          ${r.notice.text}`)
  const leak = /hongyun|鸿运|288群/i.test(JSON.stringify(r))
  console.log(`\n  泄漏自检：${leak ? '✗ 响应里出现了上游标识！' : '响应里没有任何上游标识 ✓'}`)
}

async function main() {
  const [cmd, arg] = process.argv.slice(2)
  switch (cmd) {
    case 'account':
      return get('/account')
    case 'products':
      return get('/products')
    case 'order':
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysb.ts order <order_id>')
      return get(`/orders/${encodeURIComponent(arg)}`)
    case 'lookup':
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysb.ts lookup <卡密>')
      return cmdLookup(arg)
    case 'check':
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysb.ts check <卡密> [本站商品名]')
      return cmdCheck(arg, process.argv[4])
    default:
      console.log('用法见文件头：account | products | order <id> | lookup <卡密> | check <卡密> [本站商品名]')
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
