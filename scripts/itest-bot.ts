/**
 * 微信机器人 · 端到端集成测试（console 适配器，不碰微信；会建数据、最后清掉自己建的）。
 *
 *   DATABASE_URL="mysql://root:***@localhost:3306/beiguo_dev_wxbot" npx tsx scripts/itest-bot.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 直接拒绝。
 * 覆盖 docs/微信机器人-设计.md §17 itest 行：认领管理员；三道闸（非管理员 / 文本里的 @ / 重复回调）；设管理群、创建分站群；
 * **A 站事件永不进 B 群**；渠道通知回扫（whtest: / mailcap: 不进群）；分站群黑名单；发送器（console 适配器真发）、
 * 失败退避与连续失败标 UNREACHABLE；锁定后 T2 / T3 被拒、群里没有「解锁」；分站群里不能提卡；合并、过期、租约回收；免打扰。
 * 提卡 / 补货 / 改价 / 补发的细节在 scripts/itest-bot-ops.ts；日报在 scripts/check-bot-report.ts 与下面的日报段。
 */
import { createHash } from 'crypto'
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(2)
}
process.env.BOT_ENABLED = '1'
process.env.BOT_ADAPTER = 'console'
process.env.BOT_CONSOLE_WXID = 'wxid_bot_itest'
process.env.CARDKEY_SECRET ||= 'itest-bot-cardkey-secret-0123456789'
process.env.JWT_SECRET ||= 'itest-bot-jwt-secret-0123456789abcdef0123456789'

const prisma = new PrismaClient()
const BOT = 'wxid_bot_itest'

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

const TAG = `itb${Date.now().toString(36)}`
const ADMIN_WXID = `wxid_${TAG}_admin`
const STRANGER = `wxid_${TAG}_x`
const G_MGMT = `${TAG}1@chatroom`
const G_A = `${TAG}2@chatroom`
const G_B = `${TAG}3@chatroom`
const G_NEW = `${TAG}4@chatroom`

async function main() {
  const { handleInbound } = await import('../src/lib/bot/inbound')
  const { consoleSent, consoleFailFor } = await import('../src/lib/bot/adapters/console')
  const { routePendingEvents } = await import('../src/lib/bot/route')
  const { botSink } = await import('../src/lib/bot/sink')
  const { scanTenantNotices, TN_WATERMARK_KEY } = await import('../src/lib/bot/scan')
  const { kickSender } = await import('../src/lib/bot/sender')
  const { expireOld, mergeDigest, recoverLeases } = await import('../src/lib/bot/outbox')
  const { BOT_CONFIG_KEY, invalidateBotConfig } = await import('../src/lib/bot/config')
  const { BOT_STATE_KEY } = await import('../src/lib/bot/state')
  const { notify } = await import('../src/lib/notify')
  const { emitTenantNotice } = await import('../src/lib/tenant/notice')

  // 先存下会被改动的设置，结束时还原；记下事件表当前最大 id，结束时删掉本次测试产生的事件（含主站 notify 旁路记下的）
  const evMax = (await prisma.botEvent.aggregate({ _max: { id: true } }))._max.id ?? 0
  const startedAt = new Date()
  const saved = await prisma.setting.findMany({ where: { key: { in: [BOT_CONFIG_KEY, TN_WATERMARK_KEY, BOT_STATE_KEY] } } })
  const setCfg = async (patch: Record<string, unknown>) => {
    const value = JSON.stringify({ version: Date.now(), quietDefault: null, pacing: { perConvSeconds: 1, jitterSeconds: 0, perMinute: 40, perHour: 2000 }, newAccountQuietHours: 0, ...patch })
    await prisma.setting.upsert({ where: { key: BOT_CONFIG_KEY }, create: { key: BOT_CONFIG_KEY, value }, update: { value } })
    invalidateBotConfig()
  }
  await setCfg({})
  await prisma.setting.deleteMany({ where: { key: BOT_STATE_KEY } })
  // 上一次测试进程退出时发送器可能还拿着 bot:send（60 秒后才算陈旧）：本地库上直接清掉机器人的锁
  await prisma.vmqLock.deleteMany({ where: { lockKey: { startsWith: 'bot:' } } })

  // 主站行（id = 1，平台约定）：新建的空库里没有它，渠道分站就会拿到 id 1、被当成主站
  const mainExisted = !!(await prisma.tenant.findUnique({ where: { id: 1 } }))
  if (!mainExisted) await prisma.tenant.create({ data: { id: 1, code: `main${TAG}`.slice(0, 20), kind: 'PLATFORM', name: '主站', status: 'ACTIVE', origin: 'https://bigolab.com' } })
  // 两个渠道分站
  const tA = await prisma.tenant.create({ data: { code: `${TAG}a`.slice(-20), kind: 'CHANNEL', name: `${TAG}-A`, status: 'ACTIVE', origin: `https://a-${TAG}.test`, brandName: '甲店' } })
  const tB = await prisma.tenant.create({ data: { code: `${TAG}b`.slice(-20), kind: 'CHANNEL', name: `${TAG}-B`, status: 'ACTIVE', origin: `https://b-${TAG}.test`, brandName: '乙店' } })

  const CLAIM = 'ABCD2345'
  const admin = await prisma.botAdmin.create({
    data: { name: `${TAG}-站长`, maxTier: 3, claimCodeHash: createHash('sha256').update(CLAIM).digest('hex'), claimExpiresAt: new Date(Date.now() + 600_000) },
  })

  const cleanup: (() => Promise<unknown>)[] = []
  try {
  let seq = 0
  const msg = (p: { conv: string; sender: string; text: string; at?: boolean; group?: boolean; msgId?: string }) => ({
    kind: 'MESSAGE' as const,
    msgId: p.msgId ?? `${TAG}-${++seq}`,
    convExternalId: p.conv,
    isGroup: p.group ?? p.conv.endsWith('@chatroom'),
    senderWxid: p.sender,
    senderName: p.sender === ADMIN_WXID ? '站长' : '路人',
    text: p.text,
    atWxids: p.at === false ? [] : [BOT],
    atAll: false,
    ts: new Date(),
  })
  const convOf = (ext: string) => prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter: 'console', externalId: ext } } })
  const cmdCount = () => prisma.botCommand.count({ where: { convExternalId: { startsWith: TAG } } })

  console.log('\n认领与三道闸')
  await handleInbound([msg({ conv: ADMIN_WXID, sender: ADMIN_WXID, text: `认领 ${CLAIM}`, at: false })])
  const ident = await prisma.botAdminIdentity.findUnique({ where: { adapter_wxid: { adapter: 'console', wxid: ADMIN_WXID } } })
  ok('私聊认领：登记微信身份', ident?.adminId === admin.id && ident.enabled)
  ok('认领码只能用一次（已清空）', !(await prisma.botAdmin.findUnique({ where: { id: admin.id } }))?.claimCodeHash)
  const dm = await convOf(ADMIN_WXID)
  ok('私聊会话自动登记、允许 T3', dm?.kind === 'DM' && dm.allowT3)

  const n0 = await cmdCount()
  await handleInbound([msg({ conv: G_MGMT, sender: STRANGER, text: '@贝果助手 设为管理群' })])
  ok('非管理员：只记一行 IGNORED，不登记会话', (await cmdCount()) === n0 + 1 && !(await convOf(G_MGMT)))
  const stranger = await prisma.botCommand.findFirst({ where: { senderWxid: STRANGER }, orderBy: { id: 'desc' } })
  ok('非管理员那行不记指令内容', stranger?.decision === 'IGNORED' && stranger.reasonCode === 'NOT_ADMIN' && !stranger.argsText && !stranger.name)
  await handleInbound([msg({ conv: G_MGMT, sender: ADMIN_WXID, text: '@贝果助手 设为管理群', at: false })])
  ok('文本里写 @ 但被 @ 列表里没有机器人：直接丢弃、不落库', (await cmdCount()) === n0 + 1 && !(await convOf(G_MGMT)))

  const setMgmt = msg({ conv: G_MGMT, sender: ADMIN_WXID, text: `@贝果助手${String.fromCharCode(0x2005)}设为管理群` })
  await handleInbound([setMgmt])
  const mgmt = await convOf(G_MGMT)
  ok('管理员在新群「设为管理群」', mgmt?.kind === 'MGMT' && mgmt.status === 'ACTIVE')
  const n1 = await cmdCount()
  await handleInbound([setMgmt])
  ok('同一条消息重复回调只执行一次', (await cmdCount()) === n1)

  await handleInbound([msg({ conv: G_A, sender: ADMIN_WXID, text: `@贝果助手 创建 【${tA.code}】` })])
  await handleInbound([msg({ conv: G_B, sender: ADMIN_WXID, text: `@贝果助手 创建 ${tB.code}` })])
  const ca = await convOf(G_A)
  const cb = await convOf(G_B)
  ok('创建分站群 A、B', ca?.kind === 'TENANT' && ca.tenantId === tA.id && cb?.kind === 'TENANT' && cb.tenantId === tB.id)
  ok('分站群不能提卡（T3 不进分站群）', await (async () => {
    await handleInbound([msg({ conv: G_A, sender: ADMIN_WXID, text: '@贝果助手 提卡 X 1' })])
    const c = await prisma.botCommand.findFirst({ where: { convExternalId: G_A, name: '提卡' }, orderBy: { id: 'desc' } })
    return c?.decision === 'REJECTED' && c.reasonCode === 'SCOPE'
  })())
  if (!mgmt || !ca || !cb || !dm) throw new Error('会话没建起来，后面无法继续')

  console.log('\n事件路由与分站隔离')
  const waitEvent = async (key: string) => {
    for (let i = 0; i < 50; i++) {
      const e = await prisma.botEvent.findUnique({ where: { dedupeKey: key } })
      if (e) return e
      await sleep(100)
    }
    return null
  }
  botSink.emit({ type: 'channel.order_created', tenantId: tA.id, lines: [{ label: '订单号', value: `${TAG}A1` }, { label: '买家', value: 'buyer@qq.com' }], link: `https://a-${TAG}.test/partner/orders/${TAG}A1`, linkText: '渠道后台查看', dedupeKey: `co:${TAG}A1` })
  botSink.emit({ type: 'channel.order_created', tenantId: tB.id, lines: [{ label: '订单号', value: `${TAG}B1` }], dedupeKey: `co:${TAG}B1` })
  // 分站事件里混进平台后台链接 → 黑名单拦下
  botSink.emit({ type: 'channel.receipt_created', tenantId: tA.id, lines: [{ label: '收据号', value: `${TAG}R1` }], link: 'https://bigolab.com/admin/receipts', dedupeKey: `cr:${TAG}R1` })
  const evA = await waitEvent(`co:${TAG}A1`)
  const evB = await waitEvent(`co:${TAG}B1`)
  const evBad = await waitEvent(`cr:${TAG}R1`)
  ok('分站事件落库时邮箱已去掉', !!evA && !JSON.stringify(evA.lines).includes('buyer@qq.com'))
  notify('order.created', [{ label: '订单号', value: `${TAG}M1` }, { label: '用户', value: 'mainbuyer@qq.com' }], { link: '/admin/orders' })
  await sleep(600)
  await routePendingEvents(500)
  const rowsFor = (convId: number) => prisma.botOutbox.findMany({ where: { conversationId: convId }, select: { text: true, dedupeKey: true, kind: true } })
  const [inM, inA, inB] = await Promise.all([rowsFor(mgmt.id), rowsFor(ca.id), rowsFor(cb.id)])
  ok('A 站事件只进 A 群', inA.some((r) => r.text.includes(`${TAG}A1`)) && !inB.some((r) => r.text.includes(`${TAG}A1`)) && !inM.some((r) => r.text.includes(`${TAG}A1`)))
  ok('B 站事件只进 B 群', inB.some((r) => r.text.includes(`${TAG}B1`)) && !inA.some((r) => r.text.includes(`${TAG}B1`)))
  ok('主站事件只进管理群、邮箱打码', inM.some((r) => r.text.includes(`${TAG}M1`) && r.text.includes('ma***@qq.com')) && !inA.some((r) => r.text.includes(`${TAG}M1`)))
  ok('分站群黑名单：含平台后台链接的拦下，管理群收告警', !!evBad && !inA.some((r) => r.text.includes(`${TAG}R1`)) && inM.some((r) => r.dedupeKey === `blk:${evBad.id}`))

  console.log('\n渠道通知回扫')
  await scanTenantNotices(new Date()) // 第一次只记水位
  await emitTenantNotice(null, { tenantId: tA.id, kind: 'ORDER_PAID', title: '订单已付款', body: `订单 ${TAG}A2 已付款`, refType: 'order', refKey: `${TAG}A2`, dedupeKey: `paid:${TAG}A2` })
  await emitTenantNotice(null, { tenantId: tA.id, kind: 'ORDER_PAID', title: '发送测试', body: '测试', dedupeKey: `whtest:${TAG}` })
  await emitTenantNotice(null, { tenantId: tA.id, kind: 'ORDER_PAID', title: '邮件超限', body: '超限', dedupeKey: `mailcap:${TAG}` })
  const scanned = await scanTenantNotices(new Date())
  const tnEvents = await prisma.botEvent.findMany({ where: { tenantId: tA.id, source: 'tenant_notice' } })
  ok('渠道通知回扫成事件，whtest: / mailcap: 不进', scanned === 1 && tnEvents.length === 1 && tnEvents[0].refKey === `${TAG}A2`, `scanned=${scanned} events=${tnEvents.length}`)
  ok('再扫一遍不重复', (await scanTenantNotices(new Date())) === 0)
  await routePendingEvents(500)
  ok('回扫的渠道通知进 A 群', (await rowsFor(ca.id)).some((r) => r.text.includes(`${TAG}A2`)))

  console.log('\n发送器')
  const sentBefore = consoleSent().length
  const waitIdle = async (convIds: number[], ms = 45_000) => {
    const end = Date.now() + ms
    while (Date.now() < end) {
      const n = await prisma.botOutbox.count({ where: { conversationId: { in: convIds }, status: { in: ['PENDING', 'SENDING'] }, notBefore: { lte: new Date() } } })
      if (!n) return true
      kickSender()
      await sleep(700)
    }
    return false
  }
  kickSender()
  const idle = await waitIdle([mgmt.id, ca.id, cb.id, dm.id])
  ok('待发消息全部发出', idle)
  if (!idle) {
    const rows = await prisma.botOutbox.findMany({ where: { conversationId: { in: [mgmt.id, ca.id, cb.id, dm.id] } }, select: { id: true, conversationId: true, kind: true, status: true, attempts: true, lastError: true, notBefore: true, expiresAt: true } })
    console.error('    出队现状：', JSON.stringify(rows))
    console.error('    锁：', JSON.stringify(await prisma.vmqLock.findMany({ where: { lockKey: { startsWith: 'bot:' } } })))
  }
  const sent = consoleSent().slice(sentBefore)
  ok('A 群收到的消息里没有 B 站的单', sent.filter((s) => s.externalId === G_A).every((s) => !s.text.includes(`${TAG}B1`)) && sent.some((s) => s.externalId === G_A && s.text.includes(`${TAG}A1`)))
  ok('B 群收到的消息里没有 A 站的单', sent.filter((s) => s.externalId === G_B).every((s) => !s.text.includes(`${TAG}A`)))
  ok('出队行都已 SENT', (await prisma.botOutbox.count({ where: { conversationId: { in: [mgmt.id, ca.id, cb.id] }, status: 'SENT' } })) > 0)

  // 失败：先退避回 PENDING；连续失败到第 5 次 → UNREACHABLE + 管理群告警
  consoleFailFor(G_B, true)
  await prisma.botConversation.update({ where: { id: cb.id }, data: { failStreak: 4 } })
  botSink.emit({ type: 'channel.order_created', tenantId: tB.id, lines: [{ label: '订单号', value: `${TAG}B2` }], dedupeKey: `co:${TAG}B2` })
  await waitEvent(`co:${TAG}B2`)
  await routePendingEvents(500)
  kickSender()
  await sleep(3000)
  const cb2 = await convOf(G_B)
  const failedRow = await prisma.botOutbox.findFirst({ where: { conversationId: cb.id, text: { contains: `${TAG}B2` } } })
  ok('发送失败：回 PENDING、退避、计一次', failedRow?.status === 'PENDING' && failedRow.attempts === 1 && failedRow.notBefore.getTime() > Date.now())
  ok('连续失败 5 次：标 UNREACHABLE、管理群告警', cb2?.status === 'UNREACHABLE' && (await prisma.botOutbox.count({ where: { conversationId: mgmt.id, dedupeKey: { startsWith: 'unr:' } } })) === 1)
  consoleFailFor(G_B, false)

  console.log('\n锁定')
  await handleInbound([msg({ conv: G_MGMT, sender: ADMIN_WXID, text: '@贝果助手 锁定' })])
  invalidateBotConfig()
  const cfgRow = await prisma.setting.findUnique({ where: { key: BOT_CONFIG_KEY } })
  ok('群里锁定生效', JSON.parse(cfgRow?.value || '{}').locked === true)
  await handleInbound([msg({ conv: G_MGMT, sender: ADMIN_WXID, text: '@贝果助手 推送 暂停 全部' })])
  const pausedTry = await prisma.botCommand.findFirst({ where: { convExternalId: G_MGMT, name: '推送' }, orderBy: { id: 'desc' } })
  ok('锁定后 T2 被拒', pausedTry?.decision === 'REJECTED' && pausedTry.reasonCode === 'LOCKED')
  await handleInbound([msg({ conv: G_MGMT, sender: ADMIN_WXID, text: '@贝果助手 解锁' })])
  invalidateBotConfig()
  ok('群里没有「解锁」（只能在后台）', JSON.parse((await prisma.setting.findUnique({ where: { key: BOT_CONFIG_KEY } }))?.value || '{}').locked === true)
  await handleInbound([msg({ conv: G_MGMT, sender: ADMIN_WXID, text: '@贝果助手 状态' })])
  const st = await prisma.botCommand.findFirst({ where: { convExternalId: G_MGMT, name: '状态' }, orderBy: { id: 'desc' } })
  ok('锁定时 T0 照常', st?.decision === 'OK')
  await setCfg({})

  console.log('\n推送运行开关（bot_config.enabled）')
  await setCfg({ enabled: false })
  botSink.emit({ type: 'channel.order_created', tenantId: tA.id, lines: [{ label: '订单号', value: `${TAG}OFF` }], dedupeKey: `co:${TAG}OFF` })
  const offEv = await waitEvent(`co:${TAG}OFF`)
  await routePendingEvents(500)
  ok('停用时事件标已路由、不入队', !!offEv && !!(await prisma.botEvent.findUnique({ where: { id: offEv.id } }))?.routedAt && !(await rowsFor(ca.id)).some((r) => r.text.includes(`${TAG}OFF`)))
  await prisma.botOutbox.create({ data: { conversationId: mgmt.id, kind: 'EVENT', priority: 10, text: `${TAG}-off-event`, dedupeKey: `${TAG}-off-ev`, status: 'PENDING', notBefore: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 3600_000) } })
  await prisma.botOutbox.create({ data: { conversationId: mgmt.id, kind: 'REPLY', priority: 30, text: `${TAG}-off-reply`, dedupeKey: `${TAG}-off-rp`, status: 'PENDING', notBefore: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 600_000) } })
  for (let i = 0; i < 20; i++) {
    kickSender()
    await sleep(500)
    if ((await prisma.botOutbox.findFirst({ where: { dedupeKey: `${TAG}-off-rp` } }))?.status === 'SENT') break
  }
  ok('停用时指令回复照发', (await prisma.botOutbox.findFirst({ where: { dedupeKey: `${TAG}-off-rp` } }))?.status === 'SENT')
  ok('停用时普通动态留在队里不发', (await prisma.botOutbox.findFirst({ where: { dedupeKey: `${TAG}-off-ev` } }))?.status === 'PENDING')
  await prisma.botOutbox.updateMany({ where: { dedupeKey: `${TAG}-off-ev` }, data: { status: 'CANCELLED' } })
  await setCfg({})

  console.log('\n出队：合并、过期、租约回收、免打扰')
  await prisma.botConversation.update({ where: { id: cb.id }, data: { status: 'ACTIVE', failStreak: 0 } })
  const old = new Date(Date.now() - 120_000)
  await prisma.botOutbox.updateMany({ where: { conversationId: cb.id, status: 'PENDING' }, data: { status: 'CANCELLED' } })
  for (let i = 0; i < 3; i++) {
    await prisma.botOutbox.create({ data: { conversationId: cb.id, kind: 'EVENT', priority: 10, text: `动态 ${i}`, summary: `14:3${i} 动态 ${i}`, dedupeKey: `${TAG}-m${i}`, status: 'PENDING', notBefore: old, createdAt: old, expiresAt: new Date(Date.now() + 3600_000) } })
  }
  const merged = await mergeDigest(cb.id, '乙店')
  const digest = await prisma.botOutbox.findFirst({ where: { conversationId: cb.id, kind: 'DIGEST' } })
  ok('3 条普通动态合成 1 条', merged && !!digest && (await prisma.botOutbox.count({ where: { conversationId: cb.id, status: 'MERGED' } })) === 3, digest?.text)
  await prisma.botOutbox.create({ data: { conversationId: cb.id, kind: 'EVENT', priority: 10, text: 'x', dedupeKey: `${TAG}-exp`, status: 'PENDING', notBefore: old, expiresAt: new Date(Date.now() - 1000) } })
  await expireOld(new Date())
  ok('过期作废', (await prisma.botOutbox.findFirst({ where: { dedupeKey: `${TAG}-exp` } }))?.status === 'EXPIRED')
  await prisma.botOutbox.create({ data: { conversationId: cb.id, kind: 'EVENT', priority: 10, text: 'y', dedupeKey: `${TAG}-lease`, status: 'SENDING', leaseUntil: new Date(Date.now() - 1000), notBefore: old, expiresAt: new Date(Date.now() + 3600_000) } })
  await recoverLeases(new Date())
  const leased = await prisma.botOutbox.findFirst({ where: { dedupeKey: `${TAG}-lease` } })
  ok('租约过期收回成 PENDING 并计一次', leased?.status === 'PENDING' && leased.attempts === 1)
  // 免打扰：A 群设成覆盖现在的区间 → 普通动态顺延，紧急不顺延
  const nowMin = (new Date().getUTCHours() * 60 + new Date().getUTCMinutes() + 480) % 1440
  await prisma.botConversation.update({ where: { id: ca.id }, data: { quietFrom: (nowMin + 1430) % 1440, quietTo: (nowMin + 30) % 1440 } })
  botSink.emit({ type: 'channel.order_created', tenantId: tA.id, lines: [{ label: '订单号', value: `${TAG}A3` }], dedupeKey: `co:${TAG}A3` })
  botSink.fromPlatformAlert(`[${tA.code}] 测试告警`) // 渠道告警只进管理群
  await waitEvent(`co:${TAG}A3`)
  await sleep(300)
  await routePendingEvents(500)
  const quietRow = await prisma.botOutbox.findFirst({ where: { conversationId: ca.id, text: { contains: `${TAG}A3` } } })
  ok('免打扰：普通动态顺延到区间结束', !!quietRow && quietRow.notBefore.getTime() > Date.now() + 20 * 60_000)
  ok('渠道告警进管理群、不进分站群', (await rowsFor(mgmt.id)).some((r) => r.text.includes('测试告警')) && !(await rowsFor(ca.id)).some((r) => r.text.includes('测试告警')))

  console.log('\n查询类指令（走真实入站：MGMT 全部指令、分站群只能查本站）')
  {
    // 两张订单：A 站一张、B 站一张（直接建行，itest 夹具，不经下单接口）
    const buyerA = await prisma.user.create({ data: { email: `${TAG}-qa@test.local`, passwordHash: 'x' } })
    cleanup.push(() => prisma.user.deleteMany({ where: { id: buyerA.id } }))
    const cat = await prisma.category.create({ data: { name: `${TAG}-qcat` } })
    const prod = await prisma.product.create({ data: { categoryId: cat.id, name: `${TAG}-q商品`, price: 100, deliveryType: 'AUTO', botCode: `Q${TAG.slice(-6).toUpperCase()}` } })
    const mkOrder = (tenantId: number, no: string) =>
      prisma.order.create({ data: { orderNo: no, tenantId, userId: buyerA.id, productId: prod.id, productName: prod.name, productPrice: 100, quantity: 1, amount: 100, payStatus: 'PAID', paidAt: new Date(), deliveryStatus: 'PROCESSING' } })
    const day = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '')
    const oA = await mkOrder(tA.id, `${day}QA${TAG.slice(-5).toUpperCase()}`.slice(0, 32))
    const oB = await mkOrder(tB.id, `${day}QB${TAG.slice(-5).toUpperCase()}`.slice(0, 32))
    cleanup.push(async () => {
      await prisma.order.deleteMany({ where: { id: { in: [oA.id, oB.id] } } })
      await prisma.product.deleteMany({ where: { id: prod.id } })
      await prisma.category.deleteMany({ where: { id: cat.id } })
    })
    const { rateClear } = await import('../src/lib/news/rate-limit')
    // 入站每群每分钟 10 条（§7.5）：这里一口气发几十条，每条之前清掉计数；按消息 ID 找对应的指令行，不会错拿上一条的
    const run = async (conv: string, text: string) => {
      rateClear(`botin:${conv}`)
      const m = msg({ conv, sender: ADMIN_WXID, text: `@贝果助手 ${text}` })
      await handleInbound([m])
      const c = await prisma.botCommand.findUnique({ where: { adapter_msgId: { adapter: 'console', msgId: m.msgId } } })
      const reply = c ? await prisma.botOutbox.findFirst({ where: { dedupeKey: `r:${c.id}` } }) : null
      return { c, text: reply?.text ?? '' }
    }
    {
      rateClear(`botin:${G_MGMT}`)
      const burst = Array.from({ length: 11 }, () => msg({ conv: G_MGMT, sender: ADMIN_WXID, text: '@贝果助手 状态' }))
      await handleInbound(burst)
      const got = await prisma.botCommand.count({ where: { msgId: { in: burst.map((b) => b.msgId) } } })
      ok('入站限频：同一个群一分钟内第 11 条直接丢弃', got === 10, String(got))
    }
    const mgmtCmds = [
      '帮助', '状态', '群列表', '今日', '昨日', '日报 昨天', '本周', '本月', '分站', `分站 ${tA.code}`,
      `订单 ${oA.orderNo}`, `订单 ${buyerA.email}`, `订单 ${oA.orderNo.slice(-6)}`, `查卡 ${oA.orderNo}`, '待办', '货号', '库存', `库存 ${prod.botCode}`,
      '利润', '利润 本周', '结算', '未匹配', '提卡记录',
    ]
    for (const t of mgmtCmds) {
      const r = await run(G_MGMT, t)
      ok(`管理群「${t}」执行成功`, r.c?.decision === 'OK' && r.text.length > 0, `${r.c?.decision}/${r.c?.reasonCode} ${r.c?.resultSummary ?? ''}`)
    }
    const qa = await run(G_MGMT, `订单 ${oA.orderNo}`)
    ok('管理群查单：邮箱打码、带后台链接', qa.text.includes('***@test.local') && !qa.text.includes(`${TAG}-qa@`) && qa.text.includes(`/admin/orders?orderId=${oA.id}`), qa.text)
    const ta = await run(G_A, `订单 ${oA.orderNo}`)
    ok('分站群查本站单：成功、不出现邮箱、只给渠道后台链接', ta.c?.decision === 'OK' && ta.text.includes(oA.orderNo) && !ta.text.includes('@test.local') && !ta.text.includes('/admin') && ta.text.includes('/partner/orders/'), ta.text)
    const tb = await run(G_A, `订单 ${oB.orderNo}`)
    ok('分站群查别站的单：查不到', !tb.text.includes(oB.orderNo) || /找不到|没有|不存在/.test(tb.text), tb.text)
    const te = await run(G_A, `订单 ${buyerA.email}`)
    ok('分站群不能按邮箱查', !te.text.includes(oA.orderNo), te.text)
    const tt = await run(G_A, '今日')
    ok('分站群「今日」只有本站：不出现乙店', tt.c?.decision === 'OK' && !tt.text.includes('乙店'), tt.text)
    const tq = await run(G_A, '待办')
    ok('分站群不能用「待办」（只在管理群）', tq.c?.decision === 'REJECTED' && tq.c.reasonCode === 'SCOPE')
  }

  console.log('\n日报')
  try {
    const { runDailyReports } = await import('../src/lib/bot/report/daily')
    const r1 = await runDailyReports(new Date())
    const reports = await prisma.botOutbox.findMany({ where: { conversationId: { in: [mgmt.id, ca.id, cb.id] }, kind: 'REPORT' } })
    ok('日报：管理群与分站群都有', reports.some((r) => r.conversationId === mgmt.id) && reports.some((r) => r.conversationId === ca.id), JSON.stringify(r1))
    ok('日报：分站群的日报不含别的分站名', reports.filter((r) => r.conversationId === ca.id).every((r) => !r.text.includes('乙店')))
    const before = reports.length
    await runDailyReports(new Date())
    ok('日报：重跑不重复', (await prisma.botOutbox.count({ where: { conversationId: { in: [mgmt.id, ca.id, cb.id] }, kind: 'REPORT' } })) === before)
  } catch (e) {
    ok('日报可运行', false, (e as Error)?.message)
  }

  } finally {
  // ---------- 清理（中途失败也要跑）----------
  const convIds = (await prisma.botConversation.findMany({ where: { OR: [{ externalId: { startsWith: TAG } }, { externalId: ADMIN_WXID }] }, select: { id: true } })).map((c) => c.id)
  await prisma.botOutbox.deleteMany({ where: { conversationId: { in: convIds } } })
  await prisma.botActionToken.deleteMany({ where: { conversationId: { in: convIds } } })
  await prisma.botCommand.deleteMany({ where: { OR: [{ convExternalId: { startsWith: TAG } }, { convExternalId: ADMIN_WXID }] } })
  await prisma.botEvent.deleteMany({ where: { OR: [{ tenantId: { in: [tA.id, tB.id] } }, { id: { gt: evMax } }] } })
  await prisma.auditEvent.deleteMany({ where: { action: { startsWith: 'bot.' }, at: { gte: startedAt } } })
  await prisma.botConversation.deleteMany({ where: { id: { in: convIds } } })
  await prisma.botAdminIdentity.deleteMany({ where: { adminId: admin.id } })
  await prisma.botAdmin.delete({ where: { id: admin.id } })
  await prisma.tenantNotice.deleteMany({ where: { tenantId: { in: [tA.id, tB.id] } } })
  await prisma.tenant.deleteMany({ where: { id: { in: [tA.id, tB.id] } } })
  if (!mainExisted) await prisma.tenant.deleteMany({ where: { id: 1 } })
  await prisma.setting.deleteMany({ where: { key: { in: [BOT_CONFIG_KEY, TN_WATERMARK_KEY, BOT_STATE_KEY] } } })
  for (const s of saved) await prisma.setting.create({ data: { key: s.key, value: s.value } })
  invalidateBotConfig()
  for (const f of cleanup) await f().catch(() => {})
  }
}

main()
  .catch((e) => {
    fail++
    console.error('itest 异常：', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log(`\n${fail ? '❌' : '✅'} 通过 ${pass}，失败 ${fail}`)
    process.exit(fail ? 1 : 0)
  })
