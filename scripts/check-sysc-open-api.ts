/**
 * sysc / sysd 走对方官方开放 API 的行为自测。**不发真实请求**，全部打桩。
 *
 *   npx tsx scripts/check-sysc-open-api.ts
 *
 * 对方文档：https://pz.maiofa.com/store-apidoc.html。下面用到的错误报文都是 2026-10-31 实抓的。
 * 重点钉死：发出去的字段、Key 不外泄、买家凭据不外泄、每个错误码的去向、老接口不受影响。
 */
import { __test as C, createStore } from '../src/lib/redeem/providers/sysc'

let pass = 0
let fail = 0
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
const eq = (name: string, a: unknown, b: unknown) =>
  ok(name, JSON.stringify(a) === JSON.stringify(b), `实际 ${JSON.stringify(a)}，期望 ${JSON.stringify(b)}`)

const KEY = 'sk_store_TESTKEY0000000000'
const ORG = '83ab95a8-d5fe-4ea1-bd88-4230ea0a2a50'
const USER_ID = '11111111-2222-4333-8444-555555555555'
const jwt = (plan: string) =>
  `h.${Buffer.from(JSON.stringify({ 'https://api.openai.com/auth': { chatgpt_plan_type: plan } })).toString('base64url')}.s`
const session = (plan = 'free', structure = 'personal') =>
  JSON.stringify({
    accessToken: jwt(plan),
    sessionToken: 'SECRET-SESSION-TOKEN',
    user: { id: USER_ID, email: 'buyer@example.com' },
    account: { id: ORG, structure, planType: plan },
  })

interface Call {
  method: string
  path: string
  search: string
  headers: Record<string, string>
  body: Record<string, unknown> | null
}
const calls: Call[] = []
type Reply = { status: number; body: unknown; headers?: Record<string, string> } | 'throw'
let replies: { products?: Reply; status: Reply[]; redeem?: Reply } = { status: [] }

const PRODUCTS: Reply = {
  status: 200,
  body: {
    store: { slug: 'chuanwen', brand_name: '兑换中心' },
    products: [
      { product_id: 5, name: 'GPT5x', platform: 'gpt', recharge_method: null, sale_price: null, stock: null },
      { product_id: 8, name: 'Claude Pro', platform: 'claude', recharge_method: null, sale_price: null, stock: null },
      { product_id: 12, name: 'SuperGrok1个月', platform: 'grok', recharge_method: null, sale_price: null, stock: null },
    ],
  },
}
const active = (product = 'GPT5x'): Reply => ({ status: 200, body: { status: 'active', task_status: null, product_name: product } })
const ACCEPTED: Reply = {
  status: 200,
  body: { ok: true, cdk: 'VCK-X', status: 'redeeming', task_id: 'R20261031000000AB12CD', account_id: ORG, email: 'buyer@example.com', message: '已受理' },
}
const err = (status: number, code: string, message: string, extra: object = {}): Reply => ({ status, body: { detail: { code, message, ...extra } } })

function stub() {
  ;(globalThis as { fetch: unknown }).fetch = async (url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) => {
    const u = new URL(url)
    calls.push({
      method: init?.method || 'GET',
      path: u.pathname,
      search: u.search,
      headers: init?.headers || {},
      body: init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : null,
    })
    const send = (r: Reply) => {
      if (r === 'throw') throw new Error('connect timeout')
      return new Response(JSON.stringify(r.body), { status: r.status, headers: r.headers })
    }
    if (u.pathname.endsWith('/products') || u.pathname === '/api/store/site') return send(replies.products ?? PRODUCTS)
    if (u.pathname.endsWith('/redeem/status')) {
      const r = replies.status.length > 1 ? replies.status.shift()! : replies.status[0]
      return send(r)
    }
    if (u.pathname.endsWith('/redeem')) return send(replies.redeem ?? ACCEPTED)
    throw new Error(`没打桩的路径 ${u.pathname}`)
  }
}

let seq = 0
const mk = () =>
  createStore({
    key: 'sysc',
    adminLabel: 'test',
    base: `https://t${++seq}.example.com`,
    ref: 'chuanwen',
    productMapEnv: 'TEST_MAP',
    tracePrefix: 'TT',
    fallbackEnv: 'TEST_FALLBACK_URL',
    apiKeyEnv: 'TEST_API_KEY',
  })

const activate = async (p: ReturnType<typeof mk>['provider'], values: Record<string, string>, productName = 'ChatGPT Pro 5x') => {
  const log = { claimed: 0, released: 0, refs: [] as string[] }
  let threw: { state?: string; message: string; retriable?: boolean } | null = null
  let res: Awaited<ReturnType<typeof p.activate>> | null = null
  try {
    res = await p.activate({
      cdk: 'VCK-REAL-CARD-0001',
      values,
      cardKeyId: 7,
      productName,
      claimIrreversible: async () => {
        log.claimed++
        return true
      },
      releaseIrreversible: async () => {
        log.released++
      },
      saveOrderRef: async (r: string) => {
        log.refs.push(r)
      },
    } as never)
  } catch (e) {
    threw = e as { state?: string; message: string; retriable?: boolean }
  }
  return { res, threw, log }
}
const posts = () => calls.filter((c) => c.method === 'POST' && c.path.endsWith('/redeem'))

async function main() {
  stub()
  const logs: string[] = []
  const realError = console.error
  console.error = (...a: unknown[]) => void logs.push(a.join(' '))
  process.env.TEST_API_KEY = KEY

  console.log('\n【check：走开放 API，不碰网页接口】')
  calls.length = 0
  replies = { status: [active()] }
  let s = mk()
  ok('配了 Key 就是开放 API 模式', s.openApi())
  const c1 = await s.provider.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('READY', c1.state, 'READY')
  const st = calls.find((c) => c.path.endsWith('/redeem/status'))!
  eq('状态接口路径', st.path, '/api/store/open/v1/redeem/status')
  eq('只带 cdk，不带 ref', st.search, '?cdk=VCK-REAL-CARD-0001')
  eq('带 X-API-Key', st.headers['X-API-Key'], KEY)
  ok('商品清单走开放 API', calls.some((c) => c.path === '/api/store/open/v1/products'))
  ok('没有碰网页接口', !calls.some((c) => c.path === '/api/store/site' || c.path === '/api/store/redeem/status'))
  eq('绝不发探测 POST（卡号无效会计入封禁）', posts().length, 0)
  eq('GPT 字段不变', c1.fields.map((f) => f.name), ['session_json', 'uid', 'force'])

  console.log('\n【Claude：只能填 Organization ID（开放 API 不收 session_key）】')
  replies = { status: [active('Claude Pro')] }
  s = mk()
  const c2 = await s.provider.check('VCK-REAL-CARD-0001', { productName: 'Claude pro 自助充值 | iOS订阅充值' })
  eq('只有一个字段', c2.fields.map((f) => f.name), ['uid'])
  eq('必填', c2.fields[0].required, true)
  ok('表单里没有 SessionKey', !JSON.stringify(c2.fields).toLowerCase().includes('sessionkey'))
  ok('指引里也没有 F12 / Cookie 那一套', !/F12|Cookie|sessionKey/i.test(JSON.stringify(c2.guide)))
  ok('指引指向 claude.ai/settings', JSON.stringify(c2.guide).includes('https://claude.ai/settings'))
  ok('提醒填错无法撤回', /无法撤回/.test(c2.fields[0].help))

  calls.length = 0
  replies = { status: [active('Claude Pro')] }
  let r = await activate(s.provider, { uid: ORG }, 'Claude pro 自助充值')
  eq('Org ID 正常提交', posts().length, 1)
  eq('发的就是 Org ID', posts()[0].body?.account_id, ORG)
  calls.length = 0
  r = await activate(s.provider, { session_key: 'sk-ant-sid01-xxx' }, 'Claude pro 自助充值')
  eq('老页面传 session_key：不提交', posts().length, 0)
  eq('也不占锁', r.log.claimed, 0)
  ok('文案说清要的是 Organization ID', /Organization ID/.test(r.threw?.message || ''))
  r = await activate(s.provider, { uid: 'sk-ant-sid01-xxx' }, 'Claude pro 自助充值')
  eq('SessionKey 粘进 ID 框：不提交', posts().length, 0)
  ok('文案说清不是 SessionKey', /不是 SessionKey/.test(r.threw?.message || ''))
  r = await activate(s.provider, { uid: 'not-a-uuid' }, 'Claude pro 自助充值')
  eq('不是 UUID：不提交', posts().length, 0)

  console.log('\n【下单：发出去的内容】')
  calls.length = 0
  replies = { status: [active()], redeem: ACCEPTED }
  s = mk()
  r = await activate(s.provider, { session_json: session() })
  const p = posts()[0]
  eq('路径', p.path, '/api/store/open/v1/redeem')
  eq('只有文档列出的字段', Object.keys(p.body!).sort(), ['account_id', 'acct_structure', 'cdk', 'email'])
  eq('account_id 是 account.id，不是 user.id', p.body!.account_id, ORG)
  eq('带 Key', p.headers['X-API-Key'], KEY)
  eq('Content-Type', p.headers['Content-Type'], 'application/json')
  ok('不带防重放头', !('X-ASP-Nonce' in p.headers) && !('Idempotency-Key' in p.headers))
  const wire = JSON.stringify(p.body)
  ok('整段 session 没发出去', !wire.includes('SECRET-SESSION-TOKEN') && !wire.includes('accessToken'))
  ok('Key 不在请求体里', !wire.includes(KEY))
  eq('占了锁', r.log.claimed, 1)
  eq('锁没放（已受理）', r.log.released, 0)
  eq('结果是处理中', r.res?.state, 'PROCESSING')
  eq('单号记对方的任务号', r.res?.orderRef, 'R20261031000000AB12CD')
  eq('不给重试入口（等结果）', r.res?.retriable, false)

  console.log('\n【下单后的结果】')
  replies = {
    status: [active(), { status: 200, body: { status: 'redeemed', task_status: 'success', product_name: 'GPT5x', redeem_email: 'buyer@example.com', redeemed_at: '2026-10-31T00:00:00' } }],
    redeem: ACCEPTED,
  }
  s = mk()
  r = await activate(s.provider, { session_json: session() })
  eq('成功', r.res?.state, 'COMPLETED')
  eq('单号', r.res?.orderRef, 'R20261031000000AB12CD')
  replies = {
    status: [active(), { status: 200, body: { status: 'active', task_status: 'failed', product_name: 'GPT5x', message: '内部原因' } }, { status: 200, body: { status: 'active', task_status: 'failed', product_name: 'GPT5x' } }],
    redeem: ACCEPTED,
  }
  s = mk()
  r = await activate(s.provider, { session_json: session() })
  eq('失败已回滚 → 错误态', r.res?.state, 'ERROR')
  eq('可以重新提交', r.res?.retriable, true)
  eq('锁放掉了', r.log.released, 1)
  ok('不透传对方原文', !/内部原因/.test(r.res?.message || ''))

  console.log('\n【错误码】')
  const run = async (reply: Reply, statusAfter: Reply[] = [active()]) => {
    calls.length = 0
    replies = { status: [active(), ...statusAfter], redeem: reply }
    s = mk()
    return activate(s.provider, { session_json: session() })
  }
  r = await run(err(409, 'CDK_USED', '该 CDK 已兑换'), [{ status: 200, body: { status: 'redeemed', task_status: 'success', product_name: 'GPT5x' } }])
  eq('CDK_USED：查状态后显示已完成', r.res?.state, 'COMPLETED')
  ok('CDK_USED：不说卡没被消耗', !/没有被消耗/.test(r.res?.message || ''))
  eq('CDK_USED：只提交一次', posts().length, 1)
  r = await run(err(409, 'CDK_RESERVED', '兑换中'), [{ status: 200, body: { status: 'redeeming', task_status: 'processing', product_name: 'GPT5x' } }])
  eq('CDK_RESERVED：处理中', r.res?.state, 'PROCESSING')
  eq('CDK_RESERVED：锁不放', r.log.released, 0)
  r = await run(err(409, 'NO_STOCK', '无库存'))
  eq('NO_STOCK：错误态', r.res?.state, 'ERROR')
  ok('NO_STOCK：文案说缺货且卡没动', /缺货/.test(r.res?.message || '') && /没有被消耗/.test(r.res?.message || ''))
  eq('NO_STOCK：可以再试', r.res?.retriable, true)
  eq('NO_STOCK：锁放掉', r.log.released, 1)
  r = await run(err(404, 'CDK_NOT_FOUND', 'CDK 无效'))
  eq('CDK_NOT_FOUND：不给重试', r.res?.retriable, false)
  eq('CDK_NOT_FOUND：文案', r.res?.message, C.COPY.notFound)
  r = await run(err(403, 'INVALID_API_KEY', 'Key 无效或已禁用'))
  eq('Key 失效：凭据文案', r.res?.message, C.COPY.credential)
  eq('Key 失效：不给重试', r.res?.retriable, false)
  r = await run(err(403, 'STORE_CLOSED', '店铺关闭'))
  eq('店铺关闭：凭据文案', r.res?.message, C.COPY.credential)
  r = await run({ status: 429, body: { detail: { code: 'RATE_LIMITED', message: '限流', retryAfterSeconds: 45 } } })
  eq('限流：繁忙文案', r.res?.message, C.COPY.busy)
  eq('限流：把等待秒数带出去', r.res?.retryAfter, 45)
  eq('限流：可以再试', r.res?.retriable, true)
  r = await run({ status: 429, body: { detail: { code: 'TOO_MANY_REQUESTS', message: '限流' } }, headers: { 'Retry-After': '30' } })
  eq('限流：没有 retryAfterSeconds 就读 Retry-After 头', r.res?.retryAfter, 30)
  r = await run(err(400, 'BAD_REQUEST', 'cdk 与 account_id 均不能为空'))
  eq('400：错误态', r.res?.state, 'ERROR')
  ok('400：不透传对方原文', !/均不能为空/.test(r.res?.message || ''))
  eq('400：锁放掉', r.log.released, 1)
  r = await run({ status: 200, body: { ok: false, detail: { code: 'X', message: 'y' } } })
  eq('200 但 ok=false：不算受理', r.res?.state, 'ERROR')
  r = await run({ status: 500, body: {} })
  eq('500：服务不可用文案', r.res?.message, C.COPY.unavailable)

  console.log('\n【POST 超时绝不重发】')
  r = await run('throw', [{ status: 200, body: { status: 'redeeming', task_status: 'processing', product_name: 'GPT5x' } }])
  eq('已落地 → 处理中', r.res?.state, 'PROCESSING')
  eq('只发了一次', posts().length, 1)
  eq('锁不放', r.log.released, 0)
  r = await run('throw')
  eq('状态还是 active：也只发一次', posts().length, 1)
  ok('抛错，不是成功', !!r.threw)
  eq('锁不放（说不清有没有落地）', r.log.released, 0)

  console.log('\n【读对方的错误格式】')
  eq('结构化', C.detailOf({ detail: { code: 'CDK_NOT_FOUND', message: 'CDK 无效' } }), { code: 'CDK_NOT_FOUND', text: 'CDK 无效' })
  eq('网页接口的字符串', C.detailOf({ detail: '人机校验' }), { text: '人机校验' })
  eq('什么都没有', C.detailOf({}), {})
  const v = C.detailOf({
    detail: [{ type: 'missing', loc: ['body', 'cdk'], msg: 'Field required', input: { account_id: ORG, email: 'buyer@example.com' } }],
  })
  eq('校验错误：只取 loc 和 msg', v.text, 'body.cdk: Field required')
  ok('校验错误：回显的请求体不进结果', !JSON.stringify(v).includes(ORG) && !JSON.stringify(v).includes('buyer@example.com'))

  console.log('\n【已有订阅、Team 号的本地门照旧】')
  calls.length = 0
  replies = { status: [active()] }
  s = mk()
  r = await activate(s.provider, { session_json: session('plus') })
  eq('已有订阅没勾强制：不提交', posts().length, 0)
  eq('也不占锁', r.log.claimed, 0)
  r = await activate(s.provider, { session_json: session('plus'), force: '1' })
  eq('勾了强制：提交', posts().length, 1)
  ok('force 不发给对方', !('force' in posts()[0].body!))
  calls.length = 0
  r = await activate(s.provider, { session_json: session('free', 'workspace') })
  eq('Team 号：不提交', posts().length, 0)

  console.log('\n【卡不可充时不提交】')
  for (const [name, body] of [
    ['已完成', { status: 'redeemed', task_status: 'success', product_name: 'GPT5x' }],
    ['处理中', { status: 'redeeming', task_status: 'processing', product_name: 'GPT5x' }],
    ['可能成功', { status: 'active', task_status: 'possible_success', product_name: 'GPT5x' }],
    ['已退回', { status: 'refunded', task_status: null, product_name: 'GPT5x' }],
  ] as const) {
    calls.length = 0
    replies = { status: [{ status: 200, body }] }
    s = mk()
    r = await activate(s.provider, { session_json: session() })
    eq(`${name}：不提交`, posts().length, 0)
  }
  calls.length = 0
  replies = { status: [err(404, 'CDK_NOT_FOUND', 'CDK 无效')] }
  s = mk()
  const c3 = await s.provider.check('VCK-REAL-CARD-0001', {})
  eq('卡不属于这家店：查不到', c3.state, 'NOT_FOUND')
  r = await activate(s.provider, { session_json: session() })
  eq('查不到的卡绝不发 POST（无效卡号会计入封禁）', posts().length, 0)
  replies = { status: [err(403, 'INVALID_API_KEY', 'Key 无效或已禁用')] }
  s = mk()
  const c4 = await s.provider.check('VCK-REAL-CARD-0001', {}).catch((e: Error) => ({ state: 'THROW', message: e.message }))
  eq('Key 失效时查卡：说凭据异常', c4.message, C.COPY.credential)

  console.log('\n【商品不在清单里也能出表单】')
  replies = { status: [active('Claude 5x')], products: { status: 200, body: { store: {}, products: [] } } }
  s = mk()
  const c5 = await s.provider.check('VCK-REAL-CARD-0001', {})
  eq('按对方商品名判平台', c5.state, 'READY')
  eq('是 Claude 的表单', c5.fields.map((f) => f.name), ['uid'])
  replies = { status: [active('神秘商品')], products: { status: 200, body: { store: {}, products: [] } } }
  s = mk()
  const c6 = await s.provider.check('VCK-REAL-CARD-0001', { productName: '神秘' })
  eq('实在判不出就转人工，不猜', c6.message, C.COPY.unmapped)
  eq('平台关键词', [C.platformByName('ChatGPT Plus'), C.platformByName('Claude Pro'), C.platformByName('SuperGrok'), C.platformByName('x')], ['gpt', 'claude', 'grok', null])

  console.log('\n【强刷：开放 API 没有这个动作】')
  s = mk()
  ok('配了 Key：没有 rebind（兑换页不显示入口）', typeof s.provider.rebind !== 'function')
  ok('配了 Key：也没有 rebindFields', typeof s.provider.rebindFields !== 'function')

  console.log('\n【Key 不外泄】')
  ok('日志里没有 Key', !logs.some((l) => l.includes(KEY)), logs.find((l) => l.includes(KEY)))
  ok('日志里没有买家账号', !logs.some((l) => l.includes(ORG)), logs.find((l) => l.includes(ORG)))
  ok('日志里没有买家邮箱', !logs.some((l) => l.includes('buyer@example.com')))
  ok('配置里只有变量名，没有值', !JSON.stringify(mk().config).includes(KEY))

  console.log('\n【没配 Key：老接口原样（sysd 现在就是这样）】')
  delete process.env.TEST_API_KEY
  calls.length = 0
  replies = { status: [active()], redeem: ACCEPTED }
  s = mk()
  ok('不是开放 API 模式', !s.openApi())
  const c7 = await s.provider.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('READY', c7.state, 'READY')
  ok('走网页状态接口，带 ref', calls.some((c) => c.path === '/api/store/redeem/status' && c.search.includes('ref=chuanwen')))
  ok('走网页商品接口', calls.some((c) => c.path === '/api/store/site'))
  ok('不带 Key 头', !calls.some((c) => 'X-API-Key' in c.headers))
  r = await activate(s.provider, { session_json: session() })
  const old = posts()[0]
  eq('下单走网页接口', old.path, '/api/store/redeem')
  eq('带 ref', old.body?.ref, 'chuanwen')
  eq('带 product_id', old.body?.product_id, 5)
  ok('带防重放头', 'X-ASP-Nonce' in old.headers)
  ok('有 rebind', typeof s.provider.rebind === 'function')
  replies = { status: [active('Claude Pro')] }
  s = mk()
  const c8 = await s.provider.check('VCK-REAL-CARD-0001', {})
  eq('Claude 还是两条通道', c8.fields.map((f) => f.name), ['session_key', 'uid'])

  console.error = realError
  console.log(`\n${'='.repeat(46)}\n通过 ${pass} 条，失败 ${fail} 条\n${'='.repeat(46)}`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
