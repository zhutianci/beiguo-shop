/**
 * sysc（对方的「兑换中心」）联调探针。**只读** —— 这个脚本不会消耗任何卡密。
 *
 *   npx tsx scripts/probe-sysc.ts site                 # 拉商品清单
 *   npx tsx scripts/probe-sysc.ts status <卡密>         # 查单张（走兑换链路同一个接口）
 *   npx tsx scripts/probe-sysc.ts batch <卡密,卡密,…>   # 批量查，一次最多 100 张
 *   npx tsx scripts/probe-sysc.ts skew                 # 试 X-ASP-Timestamp 能偏多少
 *
 * 【为什么没有「下单」命令】下单不可逆，会真的扣掉一张卡。
 * 真要走通写链路，请走正规路径：后台导入一张卡 → 打开 /redeem/sysc → 提交。
 * 那条路才完整覆盖了并发锁、「下单前先查状态」、日志落库这些保护，
 * 而一个 CLI 开关只会给自己留一个手滑烧卡的口子。
 *
 * 协议见 docs/sysc-充值系统-协议逆向说明.md。
 */
import crypto from 'crypto'
import { sysc, syscStatusBatch, __test } from '../src/lib/redeem/providers/sysc'

const BASE = (process.env.SYSC_BASE || 'https://chuanwen.applelll.com').replace(/\/+$/, '')
const REF = (process.env.SYSC_STORE_REF || 'chuanwen').trim()

function head(t: string) {
  console.log(`\n${'='.repeat(60)}\n${t}\n${'='.repeat(60)}`)
}

async function cmdSite() {
  head(`商品清单  ref=${REF}`)
  const r = await fetch(`${BASE}/api/store/site?ref=${encodeURIComponent(REF)}`, { cache: 'no-store' })
  if (!r.ok) {
    console.error(`HTTP ${r.status}`)
    return
  }
  const d = (await r.json()) as {
    slug?: string
    brand_name?: string
    claude_sessionkey_enabled?: boolean
    products?: { product_id: number; name: string; platform: string; sku: string | null; recharge_method: number | null; upstream_pool: string | null }[]
  }
  console.log(`slug=${d.slug}  brand=${d.brand_name}  claude_sessionkey=${d.claude_sessionkey_enabled}`)
  console.log('\nproduct_id | platform | name | sku | recharge_method | pool')
  console.log('-'.repeat(60))
  for (const p of d.products || []) {
    const pf = __test.normPlatform(p.platform)
    console.log(
      `${String(p.product_id).padStart(6)} | ${(p.platform || '').padEnd(7)} | ${p.name} | ${p.sku ?? '-'} | ${p.recharge_method ?? '-'} | ${p.upstream_pool ?? '-'}` +
        (pf ? '' : '   ← 这个 platform 我们不认识，适配器会拒绝下单')
    )
  }
  const unknown = (d.products || []).filter((p) => !__test.normPlatform(p.platform))
  if (unknown.length) {
    console.log(`\n⚠ 有 ${unknown.length} 个商品的 platform 不在 gpt/claude/grok 里。`)
    console.log('  适配器对它们会报「渠道未配置」而不是乱猜 —— 真要卖，先在 sysc.ts 的 normPlatform 里加。')
  }
}

/** 把一条查卡结果按适配器的判定打印出来 —— 看的就是「我们会怎么判」 */
function show(d: Parameters<typeof __test.classify>[0], label: string) {
  const c = __test.classify(d)
  console.log(`\n【${label}】`)
  console.log(`  上游原始      status=${d.status ?? 'null'}  task_status=${d.task_status ?? 'null'}  found=${d.found ?? '-'}`)
  console.log(`  我们判成      ${c.state}`)
  console.log(`  给买家的文案  ${c.message}`)
  console.log(`  商品名(上游)  ${d.product_name ?? 'null'}${d.product_name ? '' : '   ← 为 null 时必须靠 SYSC_PRODUCT_MAP 兜底'}`)
  console.log(`  充到的账号    ${d.redeem_account_id ?? '-'} / ${d.redeem_email ?? '-'}`)
  console.log(`  完成时间      ${d.redeemed_at ?? '-'}（UTC 裸时间，+8 才是北京时间）`)
  console.log(`  重试          attempt=${d.attempt ?? '-'}  retried=${d.retried ?? false}`)
  if (d.message) console.log(`  上游原因原文  ${d.message}   ← 只给客服看，绝不透传给买家`)
  for (const h of d.history || []) {
    console.log(`    · 第 ${h.attempt} 次 ${h.status} ${h.message ?? ''} ${h.updated_at ?? ''}`)
  }
  if (c.state === 'READY') {
    console.log('  → 兑换页会渲染提交表单')
  } else if (c.state === 'PROCESSING') {
    console.log('  → 兑换页会自动轮询，不渲染表单（买家无法重复提交）')
  }
}

async function cmdStatus(cdk: string) {
  head(`单张查询  ref=${REF}`)
  const r = await fetch(
    `${BASE}/api/store/redeem/status?ref=${encodeURIComponent(REF)}&cdk=${encodeURIComponent(cdk)}`,
    { cache: 'no-store' }
  )
  console.log(`HTTP ${r.status}`)
  const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
  if (r.status === 404) {
    console.log(`上游 detail: ${body.detail}`)
    show({ found: false }, '查不到')
    return
  }
  show({ found: true, ...body }, '查到了')
}

/**
 * 走**适配器自己的 check()**，而不是裸打接口。
 *
 * 【和 status 命令的区别，别混用】`status` 只证明「对方的接口通」；
 * 这个命令证明「我们生产环境那条代码路径通」—— 它真的会去拉商品清单、
 * 把 product_name 翻成 product_id、挑出该让买家填哪些字段。
 * 判不出 product_id 这类问题只有这条命令才会暴露出来。仍然是只读的。
 */
async function cmdCheck(cdk: string, ourName?: string) {
  head(`适配器 check()  ref=${REF}${ourName ? `  本站商品名=${ourName}` : ''}`)
  const r = await sysc.check(cdk, { productName: ourName })
  console.log(`  state         ${r.state}`)
  console.log(`  文案          ${r.message}`)
  console.log(`  商品名(对外)  ${r.productName ?? '(未传本站商品名，所以为空)'}`)
  console.log(`  已充到的账号  ${r.account ?? '-'}`)
  if (r.state === 'READY') {
    console.log(`\n  买家要填 ${r.fields.length} 个字段：`)
    for (const f of r.fields) {
      console.log(`    · ${f.name}  [${f.kind}]  ${f.required ? '必填' : '选填'}  —— ${f.label}`)
    }
    console.log(`\n  取号指引 ${r.guide?.length ?? 0} 步：${r.guideIntro ?? ''}`)
    ;(r.guide || []).forEach((s, i) => {
      console.log(`    ${i + 1}. ${s.title}${s.link ? `  → ${s.link.url}` : ''}`)
    })
    const names = r.fields.map((f) => f.name).join(',')
    console.log(
      `\n  → 判定出的平台：${names.includes('session_json') ? 'gpt' : names.includes('session_key') ? 'claude' : 'grok'}`
    )
  } else {
    console.log('\n  state 不是 READY，兑换页不会渲染提交表单。')
  }
  const dump = JSON.stringify(r)
  console.log(
    `\n  泄漏自检：响应里${/applelll|chuanwen|兑换中心/i.test(dump) ? '**出现了上游标识，这是 bug**' : '没有任何上游标识 ✓'}`
  )
}

/**
 * 干跑：把「如果现在提交，会往对方发什么」整个算出来并打印，**但绝不发出去**。
 *
 *   npx tsx scripts/probe-sysc.ts dryrun <卡密> < session.json
 *   cat session.json | npx tsx scripts/probe-sysc.ts dryrun <卡密>
 *
 * 【为什么 session 走 stdin 而不是命令行参数】参数会落进 shell 历史、
 * 也会出现在 ps 的进程列表里。session 里有 accessToken，等价于账号密码，
 * 不该因为「测一下」就被持久化到任何地方。
 *
 * 【它覆盖了写链路除 HTTP 那一下之外的全部】查卡 → 判 product_id →
 * 解析凭据 → 拼 body。真正会扣卡的 POST 不在这里，一行都没有。
 */
async function cmdDryrun(cdk: string, sessionRaw: string) {
  head('干跑：算出会提交什么，但不提交')

  const st = await fetchStatusRaw(cdk)
  show(st, '这张卡现在的状态')
  const c = __test.classify(st)
  if (c.state !== 'READY') {
    console.log(`\n✗ state=${c.state}，真实提交会在这里就被拦下，不会发出任何请求。`)
    return
  }

  const pf = __test.normPlatform(
    (await (async () => {
      const r = await fetch(`${BASE}/api/store/site?ref=${encodeURIComponent(REF)}`, { cache: 'no-store' })
      const d = (await r.json()) as { products?: { product_id: number; name: string; platform: string }[] }
      return (d.products || []).find((p) => p.name.trim().toLowerCase() === (st.product_name || '').trim().toLowerCase())
    })())?.platform
  )
  if (!pf) {
    console.log(`\n✗ 判不出 platform（上游商品名 ${st.product_name ?? 'null'}），真实提交会报「渠道未配置」。`)
    return
  }

  // Team / 企业号判据：命中就在本地拒，一个请求都不会发
  const ev = __test.teamEvidence(sessionRaw)
  console.log(`\nTeam/企业号判据：${ev ?? '没有命中 → 放行 ✓'}`)
  if (ev) {
    console.log('✗ 真实提交会在本地被拒（省下这张卡），不会发出任何请求。')
    return
  }

  const args = __test.pickAccountArgs(pf, pf === 'gpt' ? { session_json: sessionRaw } : { uid: sessionRaw })

  console.log('\n解析结果（这就是会发给对方的全部账号信息）：')
  for (const [k, v] of Object.entries(args)) {
    console.log(`  ${k.padEnd(16)} ${v ?? '(未带)'}`)
  }

  /*
   * 【最重要的一条断言】对方只该收到 UUID 和邮箱。
   * accessToken / sessionToken 是账号密码等价物，一个字都不该出去。
   */
  const body = JSON.stringify({ ref: REF, cdk, product_id: '…', ...args })
  const leaked = ['accessToken', 'sessionToken', 'access_token', 'session_token', 'eyJ'].filter((k) => body.includes(k))
  console.log(`\n凭据泄漏自检：${leaked.length ? `**泄漏了 ${leaked.join('/')}，这是 bug**` : '只有 UUID 与邮箱，没有任何 token ✓'}`)
  console.log(`\n会 POST /api/store/redeem 的 body（本次**没有**发出）：\n  ${body}`)
  console.log('\n→ 干跑结束。没有向对方发出任何写请求，这张卡仍然是未使用。')
}

/** 单条查状态的裸实现（probe 自己用，不经过适配器，便于对比） */
type RawStatus = Parameters<typeof __test.classify>[0]
async function fetchStatusRaw(cdk: string): Promise<RawStatus> {
  const r = await fetch(
    `${BASE}/api/store/redeem/status?ref=${encodeURIComponent(REF)}&cdk=${encodeURIComponent(cdk)}`,
    { cache: 'no-store' }
  )
  if (r.status === 404) return { found: false }
  const body = (await r.json().catch(() => ({}))) as RawStatus
  return { found: true, ...body }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let buf = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (d) => (buf += d))
    process.stdin.on('end', () => resolve(buf.trim()))
  })
}

async function cmdBatch(list: string) {
  const cdks = list
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  head(`批量查询  ${cdks.length} 张  ref=${REF}`)
  const rows = await syscStatusBatch(cdks)
  let ready = 0
  let done = 0
  let other = 0
  for (const d of rows) {
    show(d, d.found === false ? `${d.product_name ?? ''} 查不到` : `${d.product_name ?? '?'}`)
    const s = __test.classify(d).state
    if (s === 'READY') ready++
    else if (s === 'COMPLETED') done++
    else other++
  }
  console.log(`\n小结：可充 ${ready} 张，已充 ${done} 张，其它 ${other} 张`)
}

/**
 * 试 X-ASP-Timestamp 的容忍窗口。这是 docs 里「还没确认的事」第 4 条。
 * 用一个不存在的卡密打批量接口 —— 只读，不碰任何真卡。
 */
async function cmdSkew() {
  head('X-ASP-Timestamp 偏移容忍度（拿不存在的卡密试，只读）')
  const fake = 'ZZZZ-PROBE-ONLY-' + crypto.randomBytes(4).toString('hex')
  for (const delta of [0, -60, -300, -3600, 300, 3600]) {
    const nonce = crypto.randomBytes(18).toString('base64url')
    try {
      const r = await fetch(`${BASE}/api/store/redeem/status-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ASP-Timestamp': String(Math.floor(Date.now() / 1000) + delta),
          'X-ASP-Nonce': nonce,
          'Idempotency-Key': nonce,
        },
        body: JSON.stringify({ ref: REF, cdks: [fake] }),
        cache: 'no-store',
      })
      const t = await r.text()
      console.log(`  偏移 ${String(delta).padStart(6)} 秒 → HTTP ${r.status}  ${t.slice(0, 90)}`)
    } catch (e) {
      console.log(`  偏移 ${String(delta).padStart(6)} 秒 → 请求失败 ${(e as Error).message}`)
    }
  }
  console.log('\n全是 200 = 对方没卡时间戳；某些偏移被拒 = 我们的服务器时钟必须同步（ECS 默认是同步的）。')
}

async function main() {
  const [cmd, arg] = process.argv.slice(2)
  console.log(`BASE=${BASE}  REF=${REF}`)
  switch (cmd) {
    case 'site':
      return cmdSite()
    case 'dryrun': {
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysc.ts dryrun <卡密> < session.json')
      const sess = await readStdin()
      if (!sess) throw new Error('没有从 stdin 读到 session —— 用 < session.json 或管道传入')
      return cmdDryrun(arg, sess)
    }
    case 'check':
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysc.ts check <卡密> [本站商品名]')
      return cmdCheck(arg, process.argv[4])
    case 'status':
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysc.ts status <卡密>')
      return cmdStatus(arg)
    case 'batch':
      if (!arg) throw new Error('用法：npx tsx scripts/probe-sysc.ts batch <卡密,卡密,…>')
      return cmdBatch(arg)
    case 'skew':
      return cmdSkew()
    default:
      console.log(
        [
          '',
          '用法（全部只读，不会消耗卡密）：',
          '  npx tsx scripts/probe-sysc.ts site',
          '  npx tsx scripts/probe-sysc.ts status <卡密>',
          '  npx tsx scripts/probe-sysc.ts check  <卡密> [本站商品名]   # 走适配器自己的 check()',
          '  npx tsx scripts/probe-sysc.ts dryrun <卡密> < session.json  # 算出会提交什么，但不提交',
          '  npx tsx scripts/probe-sysc.ts batch <卡密,卡密,…>',
          '  npx tsx scripts/probe-sysc.ts skew',
          '',
          '写链路（会真的扣卡）请走正规路径：后台导入 → /redeem/sysc → 提交。',
        ].join('\n')
      )
  }
}

main().catch((e) => {
  console.error('\n✗', e instanceof Error ? e.message : e)
  process.exit(1)
})
