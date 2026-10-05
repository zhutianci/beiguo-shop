/**
 * 微信机器人 · 提卡 / 补货 / 改价 / 补发 —— 数据库集成测试（会建数据、最后清掉自己建的）。
 *
 *   DATABASE_URL="mysql://root:***@localhost:3306/beiguo_dev_wxbot" npx tsx scripts/itest-bot-ops.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 直接拒绝（它会建订单、领卡、改 bot_config）。
 * 覆盖 docs/微信机器人-设计.md §17 itest 行里提卡与补货的部分：
 *  提卡建单字段（PAID / DELIVERED / 不写 payments / payMethod 为空）、坏卡隔离、售价与利润、销量与库存、审计、回执格式；
 *  单次 / 每日上限；库存不足整单回滚（不留订单）；T3 锁下并发两条只成一条；与付款式事务、syncAutoStock 并发不死锁；
 *  改价（只限提卡单）；补货令牌：GET 不消费、导入 0 张不作废、成功提交后作废、锁定后拒绝；补发：按货号补齐等卡的单。
 */
import { Prisma, PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(2)
}
process.env.CARDKEY_SECRET ||= 'itest-bot-ops-cardkey-secret-0123456789'
process.env.JWT_SECRET ||= 'itest-bot-ops-jwt-secret-0123456789abcdef0123456789'

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

const TAG = `itb${Date.now().toString(36)}`
const CODE = TAG.slice(-8).toUpperCase()

async function main() {
  const { importCardKeys } = await import('../src/lib/cardkey-import')
  const { cardContentHash } = await import('../src/lib/cardkey')
  const { hasProvider } = await import('../src/lib/redeem/registry')
  const { issueCards, IssueError, renderIssueReceipt } = await import('../src/lib/bot/ops/issue')
  const { T3BusyError } = await import('../src/lib/bot/ops/t3-lock')
  const { repriceIssuedOrder, RepriceError } = await import('../src/lib/bot/ops/reprice')
  const { createRestockLink, peekRestockToken, submitRestock, RestockError } = await import('../src/lib/bot/ops/restock')
  const { refillByProduct } = await import('../src/lib/bot/ops/refill')
  const { createShopOrder } = await import('../src/lib/order/create-shop-order')
  const { syncAutoStock } = await import('../src/lib/cardkey')
  const { normalizeBotConfig, invalidateBotConfig, BOT_CONFIG_KEY } = await import('../src/lib/bot/config')

  const prevCfg = await prisma.setting.findUnique({ where: { key: BOT_CONFIG_KEY } })
  const created = { orderIds: [] as number[], userIds: [] as number[] }

  // ---------- 准备 ----------
  const cat = await prisma.category.create({ data: { name: `${TAG}-cat` } })
  const product = await prisma.product.create({
    data: { categoryId: cat.id, name: `${TAG}-卡`, price: new Prisma.Decimal('100.00'), deliveryType: 'AUTO', botCode: CODE, stock: 0 },
  })
  const issueUser = await prisma.user.create({ data: { passwordHash: '!bot-issue-disabled', nickname: '机器人提卡', status: 0 } })
  const buyer = await prisma.user.create({ data: { email: `${TAG}@test.local`, passwordHash: 'x' } })
  created.userIds.push(issueUser.id, buyer.id)
  const admin = await prisma.botAdmin.create({ data: { name: `${TAG}-站长`, maxTier: 3 } })
  const conv = await prisma.botConversation.create({ data: { adapter: 'console', externalId: `${TAG}@chatroom`, kind: 'MGMT', status: 'ACTIVE', allowT3: true, name: '管理群' } })

  async function setCfg(patch: Record<string, unknown>) {
    const base = { version: 1, issueUserId: issueUser.id, caps: { issuePerDay: 6, issueAmountPerDay: 2000, issuePerCommand: 3 }, ...patch }
    const value = JSON.stringify(base)
    await prisma.setting.upsert({ where: { key: BOT_CONFIG_KEY }, create: { key: BOT_CONFIG_KEY, value }, update: { value } })
    invalidateBotConfig()
    return normalizeBotConfig(base)
  }
  let cfg = await setCfg({})

  const provider = hasProvider('sysa') ? 'sysa' : null
  // 坏卡：id 最小、解不开 → 提卡时应被隔离成 DISABLED，不占用
  const bad = await prisma.cardKey.create({
    data: { productId: product.id, content: 'not.a.validcipher', contentHash: cardContentHash(`${TAG}-bad`), status: 'UNUSED', cost: new Prisma.Decimal('80.00') },
  })
  await importCardKeys(null, { productId: product.id, content: [1, 2, 3, 4].map((i) => `${TAG}-CARD-${i}`).join('\n'), cost: 80, redeemProvider: provider })

  let cmdSeq = 900_000_000 + Math.floor(Math.random() * 1_000_000)
  const issue = (price: number, qty: number, config = cfg) =>
    issueCards({ commandId: cmdSeq++, admin: { id: admin.id, name: admin.name, siteUserId: null }, conversation: { id: conv.id, kind: 'MGMT', name: '管理群' }, code: CODE.toLowerCase(), unitPrice: price, quantity: qty, config })

  console.log('\n出队加密存放')
  {
    const { sealOutboxText, openOutboxText } = await import('../src/lib/bot/outbox')
    const sealed = sealOutboxText('核销：https://bigolab.com/redeem/sysa?cdk=AAAA')
    ok('加密后不含明文、带 enc: 前缀', sealed.startsWith('enc:') && !sealed.includes('AAAA'))
    ok('解开还原', openOutboxText(sealed) === '核销：https://bigolab.com/redeem/sysa?cdk=AAAA')
    ok('普通消息原样', openOutboxText('普通消息') === '普通消息')
  }

  console.log('\n提卡：建单与领卡')
  const r1 = await issue(150, 1)
  created.orderIds.push(r1.orderId)
  const o1 = await prisma.order.findUnique({ where: { id: r1.orderId } })
  ok('订单已付款、已交付', o1?.payStatus === 'PAID' && o1?.deliveryStatus === 'DELIVERED' && !!o1?.paidAt && !!o1?.deliveredAt)
  ok('订单属于提卡账号、主站、payMethod 为空', o1?.userId === issueUser.id && o1?.tenantId === 1 && o1?.payMethod === null)
  ok('订单金额不含税、无开票', Number(o1?.amount) === 150 && o1?.invoiceTaxFee === null)
  ok('不写 payments', (await prisma.payment.count({ where: { orderId: r1.orderId } })) === 0)
  const badAfter = await prisma.cardKey.findUnique({ where: { id: bad.id } })
  ok('解不开的卡被隔离成 DISABLED、没被占用', badAfter?.status === 'DISABLED' && badAfter.orderId === null)
  const c1 = await prisma.cardKey.findMany({ where: { orderId: r1.orderId } })
  ok('领到 1 张、售价 150、利润 70', c1.length === 1 && c1[0].status === 'USED' && Number(c1[0].soldPrice) === 150 && Number(c1[0].profit) === 70)
  const p1 = await prisma.product.findUnique({ where: { id: product.id } })
  ok('销量 +1、库存同步成未用卡数 3', p1?.sales === 1 && p1?.stock === 3, `sales=${p1?.sales} stock=${p1?.stock}`)
  ok('bot_card_issues 一行', (await prisma.botCardIssue.count({ where: { orderId: r1.orderId } })) === 1)
  ok('审计 bot.card.issue 一行且不含卡密', await (async () => {
    const a = await prisma.auditEvent.findFirst({ where: { action: 'bot.card.issue', targetId: r1.orderNo } })
    return !!a && !JSON.stringify(a.diff).includes(`${TAG}-CARD`)
  })())
  const text = renderIssueReceipt(r1)
  ok('回执首行与库存行', text.startsWith(`✅ 提卡成功｜${TAG}-卡 ×1\n单价 ¥150.00 · 成本 ¥80.00 · 利润 ¥70.00\n订单号 ${r1.orderNo} · 剩余库存 3 张`), text)
  ok('回执给核销链接或卡密', provider ? /\/redeem\/sysa\?cdk=/.test(text) : text.includes(`卡密：${TAG}-CARD-`), text)
  ok('价格高于站价 300% 才提示：150 不提示', !text.includes('⚠️'))

  console.log('\n提卡：上限与库存不足')
  const before = await prisma.order.count({ where: { userId: issueUser.id } })
  await issue(100, 4).then(
    () => ok('单次超过 3 张被拒', false),
    (e) => ok('单次超过 3 张被拒', e instanceof IssueError && /单次最多提 3 张/.test(e.message), String(e))
  )
  cfg = await setCfg({ caps: { issuePerDay: 2, issueAmountPerDay: 2000, issuePerCommand: 3 } })
  await issue(100, 2).then(
    () => ok('今日张数上限（已提 1、上限 2、再要 2）被拒且标记抄送', false),
    (e) => ok('今日张数上限（已提 1、上限 2、再要 2）被拒且标记抄送', e instanceof IssueError && e.alert && /今日提卡张数上限/.test(e.message), String(e))
  )
  cfg = await setCfg({ caps: { issuePerDay: 50, issueAmountPerDay: 200, issuePerCommand: 3 } })
  await issue(100, 1).then(
    () => ok('今日金额上限（已 150、上限 200、再要 100）被拒', false),
    (e) => ok('今日金额上限（已 150、上限 200、再要 100）被拒', e instanceof IssueError && /金额上限/.test(e.message), String(e))
  )
  cfg = await setCfg({ caps: { issuePerDay: 50, issueAmountPerDay: 100000, issuePerCommand: 5 } })
  await issue(100, 5).then(
    () => ok('库存不足（未用 3、要 5）被拒', false),
    (e) => ok('库存不足（未用 3、要 5）被拒', e instanceof IssueError && /库存不足/.test(e.message), String(e))
  )
  ok('被拒的都没有留下订单', (await prisma.order.count({ where: { userId: issueUser.id } })) === before)

  console.log('\n提卡：并发')
  // 两条并发：T3 锁非阻塞，只能有一条执行，另一条回「正在处理其他操作」
  const both = await Promise.allSettled([issue(120, 1), issue(120, 1)])
  const okOnes = both.filter((x) => x.status === 'fulfilled') as PromiseFulfilledResult<Awaited<ReturnType<typeof issue>>>[]
  okOnes.forEach((x) => created.orderIds.push(x.value.orderId))
  const busy = both.filter((x) => x.status === 'rejected' && (x as PromiseRejectedResult).reason instanceof T3BusyError).length
  ok('并发两条：成功 1 + 忙 1（或依次都成功，但绝不重复发同一张卡）', (okOnes.length === 1 && busy === 1) || okOnes.length === 2, `ok=${okOnes.length} busy=${busy}`)
  const usedIds = (await prisma.cardKey.findMany({ where: { productId: product.id, status: 'USED' }, select: { id: true, orderId: true } }))
  ok('没有一张卡被发给两张单', new Set(usedIds.map((c) => c.id)).size === usedIds.length && usedIds.every((c) => c.orderId !== null))
  // 与「付款式」事务（先 products 后 card_keys）和 syncAutoStock 并发：不死锁
  const payLike = prisma.$transaction(
    async (tx) => {
      await tx.product.update({ where: { id: product.id }, data: { sales: { increment: 0 } } })
      const c = await tx.cardKey.findFirst({ where: { productId: product.id, status: 'UNUSED' }, orderBy: { id: 'asc' }, select: { id: true } })
      if (c) await tx.cardKey.updateMany({ where: { id: c.id, status: 'UNUSED' }, data: { remark: 'itest touch' } })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
  )
  const mixed = await Promise.allSettled([issue(130, 1), payLike, syncAutoStock(product.id), syncAutoStock(product.id)])
  const deadlock = mixed.some((x) => x.status === 'rejected' && /deadlock|1213|lock wait/i.test(String((x as PromiseRejectedResult).reason)))
  ok('与付款式事务、syncAutoStock 并发不死锁', !deadlock, JSON.stringify(mixed.map((x) => x.status)))
  if (mixed[0].status === 'fulfilled') created.orderIds.push((mixed[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof issue>>>).value.orderId)
  await syncAutoStock(product.id)
  const unusedNow = await prisma.cardKey.count({ where: { productId: product.id, status: 'UNUSED' } })
  ok('库存 = 未用卡数', (await prisma.product.findUnique({ where: { id: product.id } }))?.stock === unusedNow)

  console.log('\n改价')
  const rp = await repriceIssuedOrder({ commandId: cmdSeq++, admin: { id: admin.id, name: admin.name, siteUserId: null }, conversationId: conv.id, orderNo: r1.orderNo, unitPrice: 120, config: cfg })
  const c1b = await prisma.cardKey.findFirst({ where: { orderId: r1.orderId } })
  ok('改价：订单金额 150 → 120，卡售价 120、利润 40', rp.toAmount === 120 && Number((await prisma.order.findUnique({ where: { id: r1.orderId } }))?.amount) === 120 && Number(c1b?.soldPrice) === 120 && Number(c1b?.profit) === 40)
  ok('改价：提卡记录同步', Number((await prisma.botCardIssue.findFirst({ where: { orderId: r1.orderId } }))?.amount) === 120)
  ok('改价：写审计', (await prisma.auditEvent.count({ where: { action: 'bot.order.reprice', targetId: r1.orderNo } })) === 1)
  // 普通买家的单不能改
  const normal = await prisma.$transaction((tx) =>
    createShopOrder(tx, { tenantId: 1, userId: buyer.id, productId: product.id, productName: product.name, productPrice: 100, quantity: 1, amount: 100, invoiceTaxFee: null, invoiceInfo: null, remark: null })
  )
  created.orderIds.push(normal.id)
  await repriceIssuedOrder({ commandId: cmdSeq++, admin: { id: admin.id, name: admin.name, siteUserId: null }, conversationId: conv.id, orderNo: normal.orderNo, unitPrice: 1, config: cfg }).then(
    () => ok('改价：普通买家的单被拒', false),
    (e) => ok('改价：普通买家的单被拒', e instanceof RepriceError, String(e))
  )

  console.log('\n补货令牌')
  const link = await createRestockLink({ commandId: cmdSeq++, adminId: admin.id, conversationId: conv.id, productId: product.id, origin: 'https://bigolab.com' })
  const token = link.url.split('/').pop()!
  ok('链接形如 /bot/x/<43 位令牌>', /^https:\/\/bigolab\.com\/bot\/x\/[A-Za-z0-9_-]{43}$/.test(link.url), link.url)
  const row = await prisma.botActionToken.findFirst({ where: { conversationId: conv.id, action: 'RESTOCK' }, orderBy: { id: 'desc' } })
  ok('库里只存哈希', !!row && row.tokenHash.length === 64 && row.tokenHash !== token)
  const peek1 = await peekRestockToken(token)
  const peek2 = await peekRestockToken(token)
  ok('GET（peek）两次都可用、不消费', peek1.ok && peek2.ok && !(await prisma.botActionToken.findUnique({ where: { id: row!.id } }))?.usedAt)
  const dup = await submitRestock({ token, productId: product.id, content: `${TAG}-CARD-1\n\n${TAG}-CARD-2\n` }, '127.0.0.1')
  ok('全是重复：导入 0 张、不作废', dup.inserted === 0 && !dup.consumed && (await peekRestockToken(token)).ok)
  const stockBefore = await prisma.cardKey.count({ where: { productId: product.id, status: 'UNUSED' } })
  const good = await submitRestock({ token, productId: product.id, content: `${TAG}-NEW-1\n${TAG}-NEW-2\n${TAG}-CARD-3`, cost: 90, batch: 'itest' }, '127.0.0.1')
  ok('成功导入 2 张（跳过 1 张重复）并作废', good.inserted === 2 && good.skipped === 1 && good.consumed)
  ok('提交后库存同步（+2）', (await prisma.product.findUnique({ where: { id: product.id } }))?.stock === stockBefore + 2)
  ok('审计 bot.card.restock', (await prisma.auditEvent.count({ where: { action: 'bot.card.restock', targetId: String(product.id) } })) >= 1)
  ok('群里有补货回执入队', (await prisma.botOutbox.count({ where: { conversationId: conv.id, dedupeKey: { startsWith: 'restock:' } } })) === 1)
  await submitRestock({ token, productId: product.id, content: `${TAG}-NEW-3` }, '127.0.0.1').then(
    () => ok('再次提交：链接已失效', false),
    (e) => ok('再次提交：链接已失效', e instanceof RestockError && e.status === 410, String(e))
  )
  const peek3 = await peekRestockToken(token)
  ok('作废后 GET 显示已用过', !peek3.ok && peek3.reason === 'USED')
  const link2 = await createRestockLink({ commandId: cmdSeq++, adminId: admin.id, conversationId: conv.id, productId: null, origin: 'https://bigolab.com' })
  cfg = await setCfg({ locked: true, lockedBy: 'itest' })
  await submitRestock({ token: link2.url.split('/').pop()!, productId: product.id, content: `${TAG}-NEW-4` }, null).then(
    () => ok('锁定后补货被拒', false),
    (e) => ok('锁定后补货被拒', e instanceof RestockError && e.status === 423, String(e))
  )
  cfg = await setCfg({})

  console.log('\n补发')
  // 一张付了款、在等卡的普通单（付款时库存不足的样子）
  const waiting = await prisma.$transaction((tx) =>
    createShopOrder(tx, { tenantId: 1, userId: buyer.id, productId: product.id, productName: product.name, productPrice: 100, quantity: 1, amount: 100, invoiceTaxFee: null, invoiceInfo: null, remark: null })
  )
  created.orderIds.push(waiting.id)
  await prisma.order.update({ where: { id: waiting.id }, data: { payStatus: 'PAID', paidAt: new Date(), deliveryStatus: 'PROCESSING' } })
  const rf = await refillByProduct(product.id, null)
  ok('按货号补发：补齐等卡的单', rf.waiting === 1 && rf.completed === 1 && rf.added === 1, JSON.stringify(rf))
  ok('补发后订单已交付', (await prisma.order.findUnique({ where: { id: waiting.id } }))?.deliveryStatus === 'DELIVERED')

  // ---------- 清理 ----------
  const orderIds = created.orderIds
  await prisma.cardKey.deleteMany({ where: { productId: product.id } })
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.botCardIssue.deleteMany({ where: { productId: product.id } })
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
  await prisma.order.deleteMany({ where: { productId: product.id } })
  await prisma.botActionToken.deleteMany({ where: { conversationId: conv.id } })
  await prisma.botOutbox.deleteMany({ where: { conversationId: conv.id } })
  await prisma.botConversation.delete({ where: { id: conv.id } })
  await prisma.botAdmin.delete({ where: { id: admin.id } })
  await prisma.product.delete({ where: { id: product.id } })
  await prisma.category.delete({ where: { id: cat.id } })
  await prisma.user.deleteMany({ where: { id: { in: created.userIds } } })
  if (prevCfg) await prisma.setting.update({ where: { key: BOT_CONFIG_KEY }, data: { value: prevCfg.value } })
  else await prisma.setting.deleteMany({ where: { key: BOT_CONFIG_KEY } })
  invalidateBotConfig()
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
