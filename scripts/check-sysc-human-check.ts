/**
 * sysc / sysd 人机校验（2026-10-30 对方新增 Turnstile）的行为自测。**不发真实请求**，全部打桩。
 *
 *   npx tsx scripts/check-sysc-human-check.ts
 *
 * 钉死四件事：
 *   1. 对方要校验时，check() 不出表单，买家不用白填账号，文案不让他「核对账号」
 *   2. activate() 不占锁、不发真实提交；已经被拒的那种情况不给重试入口，并且把锁放掉
 *   3. 对方一放行（或者关掉校验）就自动恢复，不用改配置
 *   4. 探测用的卡密不可能是真卡；网络抖动不能把通道说成不可用
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
const eq = (name: string, a: unknown, b: unknown) => ok(name, a === b, `实际 ${JSON.stringify(a)}，期望 ${JSON.stringify(b)}`)

const REJECT = '人机校验还没完成,请等方框打上勾再点(网络连不上 Cloudflare 时会一直转)'
const SESSION = JSON.stringify({
  user: { email: 'buyer@example.com' },
  account: { id: '83ab95a8-d5fe-4ea1-bd88-4230ea0a2a50', structure: 'personal', planType: 'free' },
})

interface Upstream {
  siteKey?: string
  /** 真卡提交时的回应 */
  redeem: { status: number; body: Record<string, unknown> } | 'throw'
  /** 假卡探测的回应；不设 = 与真卡一样 */
  probe?: { status: number; body: Record<string, unknown> } | 'throw'
  status?: Record<string, unknown>
}

const calls: { path: string; cdk?: string }[] = []
let up: Upstream

function stub() {
  ;(globalThis as { fetch: unknown }).fetch = async (url: string, init?: { method?: string; body?: string }) => {
    const path = new URL(url).pathname
    const body = init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : {}
    calls.push({ path, cdk: typeof body.cdk === 'string' ? body.cdk : undefined })
    const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status })
    if (path === '/api/store/site') {
      return json(200, {
        slug: 't',
        turnstile_site_key: up.siteKey ?? '',
        products: [{ product_id: 8, name: 'Claude Pro', platform: 'claude', sku: null, recharge_method: null, upstream_pool: 'main' }, { product_id: 5, name: 'GPT5x', platform: 'gpt', sku: null, recharge_method: null, upstream_pool: 'main' }],
      })
    }
    if (path === '/api/store/redeem/status') {
      return json(200, up.status ?? { status: 'active', task_status: null, product_name: 'GPT5x' })
    }
    if (path === '/api/store/redeem') {
      const r = body.cdk === C.HUMAN_CHECK_PROBE_CDK && up.probe !== undefined ? up.probe : up.redeem
      if (r === 'throw') throw new Error('connect timeout')
      return json(r.status, r.body)
    }
    if (path === '/api/store/remedy') {
      const r = up.redeem
      if (r === 'throw') throw new Error('connect timeout')
      return json(r.status, r.body)
    }
    throw new Error(`没打桩的路径 ${path}`)
  }
}

let seq = 0
const store = () =>
  createStore({
    key: 'sysc',
    adminLabel: 'test',
    base: `https://t${++seq}.example.com`,
    ref: 't',
    productMapEnv: 'TEST_MAP',
    tracePrefix: 'TT',
    fallbackEnv: 'TEST_FALLBACK_URL',
  }).provider

const realCardPosts = () => calls.filter((c) => c.path === '/api/store/redeem' && c.cdk === 'VCK-REAL-CARD-0001').length
const probes = () => calls.filter((c) => c.path === '/api/store/redeem' && c.cdk === C.HUMAN_CHECK_PROBE_CDK).length

const activateArgs = () => {
  const log = { claimed: 0, released: 0 }
  return {
    log,
    args: {
      cdk: 'VCK-REAL-CARD-0001',
      values: { session_json: SESSION },
      cardKeyId: 1,
      productName: 'ChatGPT Pro 5x',
      claimIrreversible: async () => {
        log.claimed++
        return true
      },
      releaseIrreversible: async () => {
        log.released++
      },
      saveOrderRef: async () => undefined,
    },
  }
}

const HUMAN = { status: 400, body: { detail: REJECT } }
const CDK_BAD = { status: 404, body: { detail: 'CDK 无效' } }

async function main() {
  stub()

  console.log('\n【认得出对方的拒绝】')
  ok('线上实抓的原文', C.isHumanCheckRejection(REJECT))
  ok('英文的 turnstile 也认', C.isHumanCheckRejection('turnstile token expired'))
  ok('普通拒绝不算', !C.isHumanCheckRejection('CDK 无效'))
  ok('账号问题不算', !C.isHumanCheckRejection('账号不存在'))
  ok('空的不算', !C.isHumanCheckRejection(undefined))
  ok('文案不让买家去核对账号', !/核对账号/.test(C.COPY.humanCheck))
  ok('文案说清卡没被消耗', /没有被消耗/.test(C.COPY.humanCheck))
  ok('文案不出现上游标识', !/applelll|chuanwen|niuniu|兑换中心|turnstile|cloudflare/i.test(C.COPY.humanCheck))
  ok('探测卡密不是对方的卡密格式', !/^VCK-/.test(C.HUMAN_CHECK_PROBE_CDK))

  console.log('\n【要校验时：check 不出表单】')
  calls.length = 0
  up = { siteKey: '0xKEY', redeem: HUMAN }
  let p = store()
  const c1 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('状态是 COOLDOWN（黄色提示，不是红色报错）', c1.state, 'COOLDOWN')
  eq('不出表单', c1.fields.length, 0)
  eq('文案', c1.message, C.COPY.humanCheck)
  eq('真卡一次都没提交', realCardPosts(), 0)
  eq('探测了一次', probes(), 1)
  await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('5 分钟内不重复探测', probes(), 1)

  console.log('\n【要校验时：activate 不占锁、不提交】')
  calls.length = 0
  p = store()
  let a = activateArgs()
  let r = await p.activate(a.args as never)
  eq('返回错误态', r.state, 'ERROR')
  eq('不给重试入口', r.retriable, false)
  eq('没占锁', a.log.claimed, 0)
  eq('真卡没有提交', realCardPosts(), 0)

  console.log('\n【预判没拦住（对方刚开校验）：被拒之后也要处理好】')
  calls.length = 0
  up = { siteKey: '0xKEY', redeem: HUMAN, probe: CDK_BAD }
  p = store()
  a = activateArgs()
  r = await p.activate(a.args as never)
  eq('真卡发出去了一次', realCardPosts(), 1)
  eq('错误态', r.state, 'ERROR')
  eq('文案是人机校验那句，不是「核对账号」', r.message, C.COPY.humanCheck)
  eq('不给重试入口', r.retriable, false)
  eq('锁放掉了（卡还是 active）', a.log.released, 1)
  const c2 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('之后的 check 不用等缓存过期，直接不出表单', c2.state, 'COOLDOWN')

  console.log('\n【对方放行我们：自动恢复】')
  calls.length = 0
  up = { siteKey: '0xKEY', redeem: { status: 200, body: { account_id: 'x', email: 'buyer@example.com' } }, probe: CDK_BAD, status: { status: 'active', task_status: null, product_name: 'GPT5x' } }
  p = store()
  const c3 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('site key 还在，但探测说放行了 → READY', c3.state, 'READY')
  ok('出表单', c3.fields.length > 0)
  eq('探测了一次', probes(), 1)

  console.log('\n【对方关掉校验：不探测】')
  calls.length = 0
  up = { siteKey: '', redeem: HUMAN }
  p = store()
  const c4 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('READY', c4.state, 'READY')
  eq('site key 为空就不发探测', probes(), 0)

  console.log('\n【网络抖动不能把通道说成不可用】')
  calls.length = 0
  up = { siteKey: '0xKEY', redeem: HUMAN, probe: 'throw' }
  p = store()
  const c5 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('探测超时 → 正常出表单', c5.state, 'READY')
  up = { siteKey: '0xKEY', redeem: HUMAN, probe: { status: 503, body: {} } }
  const c6 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('探测 503 → 不下结论', c6.state, 'READY')
  up = { siteKey: '0xKEY', redeem: HUMAN }
  const c7 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('抖动不缓存：下一次能问到真实结果', c7.state, 'COOLDOWN')

  console.log('\n【已完成的卡不受影响，也不探测】')
  calls.length = 0
  up = { siteKey: '0xKEY', redeem: HUMAN, status: { status: 'redeemed', task_status: 'success', product_name: 'GPT5x' } }
  p = store()
  const c8 = await p.check('VCK-REAL-CARD-0001', { productName: 'ChatGPT Pro 5x' })
  eq('仍然显示已完成', c8.state, 'COMPLETED')
  eq('不发探测', probes(), 0)

  console.log('\n【备用按钮：默认没有，配了才有】')
  up = { siteKey: '0xKEY', redeem: HUMAN }
  delete process.env.TEST_FALLBACK_URL
  p = store()
  ok('默认不给（等于不把货源站告诉买家）', (await p.check('VCK-REAL-CARD-0001', { productName: 'x GPT5x' })).fallback === undefined)
  process.env.TEST_FALLBACK_URL = 'https://shop.example.com/'
  const fb = (await p.check('VCK-REAL-CARD-0001', { productName: 'x GPT5x' })).fallback
  eq('配了就给', fb?.url, 'https://shop.example.com/')
  eq('按钮写域名', fb?.label, '前往 shop.example.com 充值')
  a = activateArgs()
  r = await p.activate(a.args as never)
  eq('activate 被拦时也带上', r.fallback?.url, 'https://shop.example.com/')
  process.env.TEST_FALLBACK_URL = 'javascript:alert(1)'
  ok('不是 https 的一律不给', (await p.check('VCK-REAL-CARD-0001', { productName: 'x GPT5x' })).fallback === undefined)
  delete process.env.TEST_FALLBACK_URL

  console.log('\n【强刷（Claude remedy）同样处理】')
  up = { siteKey: '0xKEY', redeem: HUMAN }
  p = store()
  r = await p.rebind!({ cdk: 'VCK-REAL-CARD-0001', values: { session_key: 'sk-ant-sid01-test' } } as never)
  eq('文案是人机校验那句', r.message, C.COPY.humanCheck)
  eq('不给重试入口', r.retriable, false)

  console.log(`\n${'='.repeat(46)}\n通过 ${pass} 条，失败 ${fail} 条\n${'='.repeat(46)}`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
