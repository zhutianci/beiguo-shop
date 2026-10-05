/**
 * 微信机器人 · iLink 适配器集成测试（docs/微信机器人-设计.md 附录 E）。真库 + 本地假 iLink 服务（node http），不连腾讯。
 *
 *   DATABASE_URL="mysql://root:***@localhost:3306/beiguo_dev_wxbot" npx tsx scripts/itest-bot-ilink.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 直接拒绝。跑完删掉自己建的数据、还原改过的设置。
 * 覆盖：扫码绑定（配对码、确认、凭据加密落库、管理员身份）、请求格式（头、base_info、取码不带 base_info）、
 * 一对一指令（帮助不带 @、不列群指令）、只认扫码人、uint64 消息 ID 无损、推送窗口关闭 → 搁置不计失败 → 对方来消息补发并说明过期条数、
 * 窗口将尽的提醒、分站代理的说明（6 小时一次）、-14 失效 → 会话发不出去、重复绑定（binded_redirect）、解绑删凭据、地址白名单、二维码图片。
 */
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('?')[0].split('/').pop() || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(1)
}
process.env.BOT_ENABLED = '1'
process.env.BOT_ADAPTER = 'ilink'
process.env.CARDKEY_SECRET ||= 'itest-bot-cardkey-secret-0123456789'
process.env.JWT_SECRET ||= 'itest-bot-jwt-secret-0123456789abcdef0123456789'

const prisma = new PrismaClient()
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function waitFor(cond: () => Promise<boolean> | boolean, ms = 15_000, step = 200): Promise<boolean> {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await cond()) return true
    await sleep(step)
  }
  return false
}

const TAG = `itl${Date.now().toString(36)}`
const U_ADMIN = `${TAG}-admin@im.wechat`
const U_AGENT = `${TAG}-agent@im.wechat`
const U_STRANGER = `${TAG}-x@im.wechat`
const BOT_A = `${TAG}-a@im.bot`
const BOT_B = `${TAG}-b@im.bot`
const TOK_A = `tokA-${TAG}-secret`
const TOK_B = `tokB-${TAG}-secret`

// ───────────────────────── 假 iLink 服务 ─────────────────────────

type Json = Record<string, any>
interface Sent {
  token: string
  to: string
  ctx: string
  text: string
  type: number
  state: number
}
const fake = {
  qrSeq: 0,
  /** qrcode → 状态处理（按收到的 verify_code 决定返回什么） */
  status: new Map<string, (verify: string | null, n: number) => Json>(),
  statusCalls: new Map<string, number>(),
  /** 下一次取码时用哪个状态处理 */
  nextScenario: null as null | ((verify: string | null, n: number) => Json),
  pending: new Map<string, string[]>(), // token → 原样 JSON 文本片段（为了测 uint64 不加引号）
  cursor: new Map<string, number>(),
  stale: new Set<string>(),
  sent: [] as Sent[],
  qrBodies: [] as Json[],
  updatesBodies: [] as Json[],
  updatesHeaders: [] as http.IncomingHttpHeaders[],
  notifyStart: 0,
}

function pushMsg(token: string, m: { from: string; text: string; ctx?: string; id?: string; groupId?: string; type?: number }) {
  const id = m.id ?? String(Date.now()) + String(Math.floor(Math.random() * 1000))
  const obj: Json = {
    seq: 1,
    message_id: `__ID__${id}__`,
    from_user_id: m.from,
    to_user_id: 'bot',
    create_time_ms: Date.now(),
    message_type: m.type ?? 1,
    message_state: 2,
    item_list: [{ type: 1, text_item: { text: m.text } }],
    ...(m.ctx ? { context_token: m.ctx } : {}),
    ...(m.groupId ? { group_id: m.groupId } : {}),
  }
  // message_id 以不带引号的大整数出现在 JSON 里（与真服务一致）
  const raw = JSON.stringify(obj).replace(`"__ID__${id}__"`, id)
  const list = fake.pending.get(token) ?? []
  list.push(raw)
  fake.pending.set(token, list)
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let s = ''
    req.on('data', (c) => (s += c))
    req.on('end', () => resolve(s))
  })
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || '/', 'http://x')
  const send = (obj: Json | string) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(typeof obj === 'string' ? obj : JSON.stringify(obj))
  }
  const body = req.method === 'POST' ? await readBody(req) : ''
  const json = (() => {
    try {
      return body ? JSON.parse(body) : {}
    } catch {
      return {}
    }
  })()
  const token = String(req.headers.authorization || '').replace(/^Bearer /, '')
  if (u.pathname === '/ilink/bot/get_bot_qrcode') {
    fake.qrBodies.push(json)
    const qrcode = `q${++fake.qrSeq}${TAG}`
    if (fake.nextScenario) fake.status.set(qrcode, fake.nextScenario)
    return send({ qrcode, qrcode_img_content: `https://liteapp.weixin.qq.com/q/x?qrcode=${qrcode}&bot_type=3`, ret: 0 })
  }
  if (u.pathname === '/ilink/bot/get_qrcode_status') {
    const q = u.searchParams.get('qrcode') || ''
    const n = (fake.statusCalls.get(q) ?? 0) + 1
    fake.statusCalls.set(q, n)
    const h = fake.status.get(q)
    return send(h ? h(u.searchParams.get('verify_code'), n) : { ret: 0, status: 'wait' })
  }
  if (u.pathname === '/ilink/bot/getupdates') {
    fake.updatesBodies.push(json)
    fake.updatesHeaders.push(req.headers)
    if (fake.stale.has(token)) return send({ ret: -14, errcode: -14, errmsg: 'session timeout' })
    const list = fake.pending.get(token) ?? []
    if (!list.length) await sleep(300)
    const msgs = (fake.pending.get(token) ?? []).splice(0)
    const c = (fake.cursor.get(token) ?? 0) + (msgs.length ? 1 : 0)
    fake.cursor.set(token, c)
    return send(`{"ret":0,"msgs":[${msgs.join(',')}],"get_updates_buf":"buf${c}","longpolling_timeout_ms":5000}`)
  }
  if (u.pathname === '/ilink/bot/sendmessage') {
    const m = json.msg || {}
    fake.sent.push({ token, to: m.to_user_id, ctx: m.context_token, text: m.item_list?.[0]?.text_item?.text ?? '', type: m.message_type, state: m.message_state })
    return send({ ret: 0 })
  }
  if (u.pathname === '/ilink/bot/msg/notifystart') {
    fake.notifyStart++
    return send({ ret: 0 })
  }
  res.writeHead(404)
  res.end()
})

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
  const port = (server.address() as AddressInfo).port
  process.env.BOT_ILINK_BASE = `http://127.0.0.1:${port}`

  const { handleInbound, ILINK_TENANT_HINT } = await import('../src/lib/bot/inbound')
  const { ensureIlinkLoops, ilinkLoopSnapshot, stopIlinkLoop } = await import('../src/lib/bot/adapters')
  const { kickSender } = await import('../src/lib/bot/sender')
  const { enqueueMany } = await import('../src/lib/bot/outbox')
  const { BOT_CONFIG_KEY, invalidateBotConfig } = await import('../src/lib/bot/config')
  const { BOT_STATE_KEY } = await import('../src/lib/bot/state')
  const { startIlinkBind, getIlinkBind, submitIlinkBindCode, safeIlinkBase } = await import('../src/lib/bot/ilink-bind')
  const { ILINK_KEY_PREFIX, patchBinding, readBinding } = await import('../src/lib/bot/adapters/ilink-store')
  const { KEEPALIVE_HINT } = await import('../src/lib/bot/adapters/ilink-shared')
  const { parseIlinkJson } = await import('../src/lib/bot/adapters/ilink-api')
  const { qrSvgDataUrl } = await import('../src/lib/bot/qr-svg')

  const evMax = (await prisma.botEvent.aggregate({ _max: { id: true } }))._max.id ?? 0
  const saved = await prisma.setting.findMany({ where: { key: { in: [BOT_CONFIG_KEY, BOT_STATE_KEY] } } })
  const cfgValue = JSON.stringify({ version: Date.now(), quietDefault: null, pacing: { perConvSeconds: 1, jitterSeconds: 0, perMinute: 60, perHour: 2000 }, newAccountQuietHours: 0 })
  await prisma.setting.upsert({ where: { key: BOT_CONFIG_KEY }, create: { key: BOT_CONFIG_KEY, value: cfgValue }, update: { value: cfgValue } })
  invalidateBotConfig()
  await prisma.vmqLock.deleteMany({ where: { lockKey: { startsWith: 'bot:' } } })

  const mainExisted = !!(await prisma.tenant.findUnique({ where: { id: 1 } }))
  if (!mainExisted) await prisma.tenant.create({ data: { id: 1, code: `main${TAG}`.slice(0, 20), kind: 'PLATFORM', name: '主站', status: 'ACTIVE', origin: 'https://bigolab.com' } })
  const tA = await prisma.tenant.create({ data: { code: `${TAG}a`.slice(-20), kind: 'CHANNEL', name: `${TAG}-A`, status: 'ACTIVE', origin: `https://a-${TAG}.test`, brandName: '甲店' } })
  const admin = await prisma.botAdmin.create({ data: { name: `${TAG}-站长`, maxTier: 3 } })
  const handle = (list: Parameters<typeof handleInbound>[0]) => handleInbound(list)
  const onBound = () => ensureIlinkLoops(handle)
  const sentTo = (token: string) => fake.sent.filter((s) => s.token === token)

  try {
    console.log('\n纯函数')
    ok('uint64 消息 ID 无损解析', (parseIlinkJson('{"msgs":[{"message_id":9007199254740993,"text":"x\\"message_id\\":1"}]}') as Json | null)?.msgs?.[0]?.message_id === '9007199254740993')
    ok('接口地址白名单：只认 https + qq.com', safeIlinkBase('https://ilinkai.weixin.qq.com') === 'https://ilinkai.weixin.qq.com' && safeIlinkBase('https://evil.com') === null && safeIlinkBase('http://ilinkai.weixin.qq.com') === null && safeIlinkBase('https://x.qq.com.evil.io') === null)
    const svg = qrSvgDataUrl('https://liteapp.weixin.qq.com/q/x?qrcode=abc&bot_type=3')
    const svgText = Buffer.from(svg.split(',')[1], 'base64').toString('utf8')
    ok('二维码图片：SVG data URL、有方块、无脚本', svg.startsWith('data:image/svg+xml;base64,') && /<path d="M\d/.test(svgText) && !/<script/i.test(svgText))

    console.log('\n管理员绑定（含配对码）')
    fake.nextScenario = (verify, n) => {
      if (verify === '2468') return { ret: 0, status: 'confirmed', bot_token: TOK_A, ilink_bot_id: BOT_A, ilink_user_id: U_ADMIN, baseurl: 'https://ilinkai.weixin.qq.com' }
      if (n === 1) return { ret: 0, status: 'scaned' }
      return { ret: 0, status: 'need_verifycode' }
    }
    const s1 = await startIlinkBind({ kind: 'MGMT', adminId: admin.id, tenantId: null, allowT3: true, name: `管理员「${admin.name}」的微信`, actorUserId: null }, onBound)
    ok('生成二维码', s1.ok && !!s1.view.qr && !!s1.view.link?.startsWith('https://liteapp.weixin.qq.com/'), s1.ok ? '' : s1.error)
    ok('取码请求不带 base_info、带 local_token_list', fake.qrBodies.length === 1 && !('base_info' in fake.qrBodies[0]) && Array.isArray(fake.qrBodies[0].local_token_list))
    const id1 = s1.ok ? s1.view.id : ''
    ok('要求配对码时进入 NEED_CODE', await waitFor(() => getIlinkBind(id1)?.state === 'NEED_CODE'))
    ok('提交配对码', submitIlinkBindCode(id1, '2468').ok)
    ok('确认后 DONE', await waitFor(() => getIlinkBind(id1)?.state === 'DONE'), JSON.stringify(getIlinkBind(id1)))
    const convA = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter: 'ilink', externalId: BOT_A } } })
    ok('建了 MGMT 会话、允许提卡补货', convA?.kind === 'MGMT' && convA.status === 'ACTIVE' && convA.allowT3 && getIlinkBind(id1)?.conversationId === convA.id)
    const rawA = convA ? await prisma.setting.findUnique({ where: { key: `${ILINK_KEY_PREFIX}${convA.id}` } }) : null
    ok('凭据落库且加密（库里看不到 token 明文）', !!rawA && !rawA.value.includes(TOK_A) && (await readBinding(convA!.id))?.token === TOK_A)
    const idn = await prisma.botAdminIdentity.findUnique({ where: { adapter_wxid: { adapter: 'ilink', wxid: U_ADMIN } } })
    ok('扫码的微信登记成这位管理员的身份', idn?.adminId === admin.id && idn.enabled)
    ok('收消息循环已起', await waitFor(() => ilinkLoopSnapshot().some((l) => l.convId === convA!.id && l.running)))

    console.log('\n一对一指令与请求格式')
    pushMsg(TOK_A, { from: U_ADMIN, text: '帮助', ctx: 'ctx1', id: '9007199254740993' })
    ok('「帮助」回复发出、带对方的 context_token', await waitFor(() => sentTo(TOK_A).some((s) => s.ctx === 'ctx1' && s.text.includes('管理员绑定可用指令'))))
    const help = sentTo(TOK_A).find((s) => s.text.includes('管理员绑定可用指令'))
    ok('帮助里不提 @、不列群指令', !!help && !help.text.includes('@贝果助手') && !help.text.includes('设为管理群') && !help.text.includes('创建 '))
    ok('发给扫码人、消息类型 BOT / FINISH', !!help && help.to === U_ADMIN && help.type === 2 && help.state === 2)
    const cmd = await prisma.botCommand.findFirst({ where: { adapter: 'ilink', convExternalId: BOT_A }, orderBy: { id: 'desc' } })
    ok('uint64 消息 ID 原样记录（不丢精度）', cmd?.msgId === 'il:9007199254740993', cmd?.msgId)
    const hdr = fake.updatesHeaders[fake.updatesHeaders.length - 1] || {}
    const uinOk = /^\d+$/.test(Buffer.from(String(hdr['x-wechat-uin'] || ''), 'base64').toString('utf8'))
    ok('收消息请求头与 base_info', hdr['authorizationtype'] === 'ilink_bot_token' && hdr['ilink-app-id'] === 'bot' && uinOk && fake.updatesBodies.some((b) => b.base_info?.channel_version === '2.4.9' && /^BeiguoShop\//.test(b.base_info?.bot_agent)))
    ok('上线通知 notifystart', fake.notifyStart >= 1)
    const nCmd = await prisma.botCommand.count({ where: { adapter: 'ilink' } })
    const nSent = fake.sent.length
    pushMsg(TOK_A, { from: U_STRANGER, text: '帮助', ctx: 'ctx-x' })
    pushMsg(TOK_A, { from: U_ADMIN, text: '帮助', ctx: 'ctx-g', groupId: 'g1' })
    pushMsg(TOK_A, { from: U_ADMIN, text: '帮助', ctx: 'ctx-bot', type: 2 })
    await sleep(2500)
    ok('别人、群里、机器人自己的消息一律不处理', (await prisma.botCommand.count({ where: { adapter: 'ilink' } })) === nCmd && fake.sent.length === nSent)
    ok('它们的 context_token 也不采用', (await readBinding(convA!.id))?.ctxToken === 'ctx1')

    console.log('\n推送窗口：关闭 → 搁置 → 对方来消息补发')
    await patchBinding(convA!.id, { ctxAt: new Date(Date.now() - 25 * 3600_000).toISOString() })
    await prisma.botOutbox.create({ data: { conversationId: convA!.id, kind: 'EVENT', priority: 10, text: '过期的', dedupeKey: `${TAG}-exp`, status: 'EXPIRED', notBefore: new Date(), expiresAt: new Date() } })
    await enqueueMany([{ conversationId: convA!.id, kind: 'EVENT', text: `${TAG} 搁置的动态`, dedupeKey: `${TAG}-ev1` }])
    kickSender()
    const deferredOk = await waitFor(async () => {
      const r = await prisma.botOutbox.findFirst({ where: { conversationId: convA!.id, dedupeKey: `${TAG}-ev1` } })
      return r?.status === 'PENDING' && r.lastError === 'NO_CONTEXT' && r.notBefore.getTime() > Date.now() + 60_000
    })
    ok('窗口关着：消息搁置（PENDING + NO_CONTEXT），没有发', deferredOk && !fake.sent.some((s) => s.text.includes('搁置的动态')))
    const convA2 = await prisma.botConversation.findUnique({ where: { id: convA!.id } })
    ok('搁置不算失败（failStreak 0、会话仍在用）', convA2?.failStreak === 0 && convA2.status === 'ACTIVE')
    pushMsg(TOK_A, { from: U_ADMIN, text: '1', ctx: 'ctx2' })
    ok('对方来消息：搁置的动态用新 token 补发', await waitFor(() => fake.sent.some((s) => s.text.includes('搁置的动态') && s.ctx === 'ctx2')))
    ok('并说明期间过期了几条', await waitFor(() => fake.sent.some((s) => s.text.includes('推送已恢复') && s.text.includes('1 条'))))
    ok('那条「1」按未知指令回复（不带 @）', await waitFor(() => fake.sent.some((s) => s.text === '没看懂，发送「帮助」查看可用指令')))

    console.log('\n窗口将尽的提醒')
    await patchBinding(convA!.id, { ctxAt: new Date(Date.now() - 21 * 3600_000).toISOString() })
    await enqueueMany([{ conversationId: convA!.id, kind: 'EVENT', text: `${TAG} 快到期`, dedupeKey: `${TAG}-ev2` }])
    kickSender()
    ok('超过 20 小时：消息末尾带「回复任意一个字」提醒', await waitFor(() => fake.sent.some((s) => s.text.startsWith(`${TAG} 快到期`) && s.text.endsWith(KEEPALIVE_HINT))))

    console.log('\n分站代理绑定')
    fake.nextScenario = () => ({ ret: 0, status: 'confirmed', bot_token: TOK_B, ilink_bot_id: BOT_B, ilink_user_id: U_AGENT, baseurl: 'https://evil.example.com' })
    const s2 = await startIlinkBind({ kind: 'TENANT', adminId: null, tenantId: tA.id, allowT3: false, name: `分站 ${tA.name}（${tA.code}）的代理微信`, actorUserId: null }, onBound)
    const id2 = s2.ok ? s2.view.id : ''
    ok('取码时上送已有绑定的 token', fake.qrBodies[fake.qrBodies.length - 1]?.local_token_list?.includes(TOK_A))
    ok('分站绑定完成', await waitFor(() => getIlinkBind(id2)?.state === 'DONE'))
    const convB = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter: 'ilink', externalId: BOT_B } } })
    ok('TENANT 会话、绑到这个分站、不能提卡', convB?.kind === 'TENANT' && convB.tenantId === tA.id && !convB.allowT3)
    ok('服务端给的可疑地址不采用', (await readBinding(convB!.id))?.baseUrl === null)
    ok('代理不登记成管理员', !(await prisma.botAdminIdentity.findUnique({ where: { adapter_wxid: { adapter: 'ilink', wxid: U_AGENT } } })))
    await waitFor(() => ilinkLoopSnapshot().some((l) => l.convId === convB!.id && l.running))
    pushMsg(TOK_B, { from: U_AGENT, text: '你好', ctx: 'b1' })
    ok('代理发消息：回一句说明（含 24 小时规则）', await waitFor(() => sentTo(TOK_B).some((s) => s.text === ILINK_TENANT_HINT && s.ctx === 'b1')))
    pushMsg(TOK_B, { from: U_AGENT, text: '在吗', ctx: 'b2' })
    await sleep(3000)
    ok('6 小时内不重复说明', sentTo(TOK_B).filter((s) => s.text === ILINK_TENANT_HINT).length === 1)
    const agentCmd = await prisma.botCommand.findFirst({ where: { adapter: 'ilink', convExternalId: BOT_B }, orderBy: { id: 'desc' } })
    ok('代理的消息不执行指令（IGNORED NOT_ADMIN）', agentCmd?.decision === 'IGNORED' && agentCmd.reasonCode === 'NOT_ADMIN')

    console.log('\n重复绑定、失效、解绑')
    fake.nextScenario = () => ({ ret: 0, status: 'binded_redirect' })
    const s3 = await startIlinkBind({ kind: 'TENANT', adminId: null, tenantId: tA.id, allowT3: false, name: 'x', actorUserId: null }, onBound)
    const id3 = s3.ok ? s3.view.id : ''
    ok('同一个微信再扫：已绑定过（不重复建）', await waitFor(() => getIlinkBind(id3)?.state === 'ALREADY'))
    fake.stale.add(TOK_B)
    ok('-14：会话改成发不出去', await waitFor(async () => (await prisma.botConversation.findUnique({ where: { id: convB!.id } }))?.status === 'UNREACHABLE'))
    ok('-14：凭据标记失效、循环结束', !!(await readBinding(convB!.id))?.staleAt && (await waitFor(() => !ilinkLoopSnapshot().some((l) => l.convId === convB!.id && l.running))))
    await prisma.botConversation.update({ where: { id: convA!.id }, data: { status: 'REVOKED' } })
    await ensureIlinkLoops(handle)
    ok('解绑后：凭据删除、循环停止', !(await prisma.setting.findUnique({ where: { key: `${ILINK_KEY_PREFIX}${convA!.id}` } })) && !ilinkLoopSnapshot().some((l) => l.convId === convA!.id))
  } finally {
    ilinkLoopSnapshot().forEach((l) => stopIlinkLoop(l.convId))
    const convs = await prisma.botConversation.findMany({ where: { adapter: 'ilink', externalId: { startsWith: TAG } }, select: { id: true } })
    const ids = convs.map((c) => c.id)
    await prisma.botOutbox.deleteMany({ where: { conversationId: { in: ids } } })
    await prisma.setting.deleteMany({ where: { key: { in: ids.map((i) => `${ILINK_KEY_PREFIX}${i}`) } } })
    await prisma.botCommand.deleteMany({ where: { adapter: 'ilink', convExternalId: { startsWith: TAG } } })
    await prisma.botConversation.deleteMany({ where: { id: { in: ids } } })
    await prisma.botAdminIdentity.deleteMany({ where: { adapter: 'ilink', wxid: { startsWith: TAG } } })
    await prisma.botAdmin.deleteMany({ where: { id: admin.id } })
    await prisma.botEvent.deleteMany({ where: { id: { gt: evMax } } })
    await prisma.tenant.deleteMany({ where: { id: tA.id } })
    if (!mainExisted) await prisma.tenant.deleteMany({ where: { id: 1 } })
    await prisma.setting.deleteMany({ where: { key: { in: [BOT_CONFIG_KEY, BOT_STATE_KEY] } } })
    for (const s of saved) await prisma.setting.create({ data: { key: s.key, value: s.value } })
    await prisma.vmqLock.deleteMany({ where: { lockKey: { startsWith: 'bot:' } } })
    server.close()
  }
  console.log(`\n${fail ? '❌' : '✅'} 通过 ${pass}，失败 ${fail}`)
  await prisma.$disconnect()
  process.exit(fail ? 1 : 0)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
