/**
 * 注册与下单 IP 留痕（2026-10-31）：主站记、渠道站不记；到期清除。
 *   POW_MODE=off DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/ip-record.ts
 */
import React from 'react'
import { callRoute, check, cleanupAll, createUser, createWorld, prisma, section, setChannelsMode, summary, RUN, TEST_PASSWORD, type RouteFn } from './_harness'

// React.cache 只在 Next 的 react-server 构建里有，lib/content/queries.ts 在模块顶层调用它
;(React as unknown as { cache: unknown }).cache = (fn: unknown) => fn

const MAIN_HOST = 'bigolab.com'
const IP = { 'cf-connecting-ip': '203.0.113.9', 'cf-ipcity': 'Beijing' }

async function main() {
  await cleanupAll()
  setChannelsMode('observe')
  const w = await createWorld()
  const emails = [`ipm${RUN}@qq.com`, `ipl${RUN}@qq.com`]
  try {
    const reg = (await import('../../src/app/api/auth/register/route')) as unknown as { POST: RouteFn }
    const orders = (await import('../../src/app/api/orders/route')) as unknown as { POST: RouteFn }
    const cleanup = (await import('../../src/app/api/cron/cleanup/route')) as unknown as { GET: RouteFn }

    section('注册')
    const signUp = (host: string, email: string) => callRoute(reg.POST, { host, method: 'POST', path: '/api/auth/register', headers: IP, body: { email, password: TEST_PASSWORD } })
    const r1 = await signUp(MAIN_HOST, emails[0])
    check('主站注册成功', r1.status === 200, r1.text.slice(0, 160))
    const u1 = await prisma.user.findUnique({ where: { email: emails[0] }, select: { registerIp: true } })
    check('主站注册记 IP', u1?.registerIp === IP['cf-connecting-ip'], String(u1?.registerIp))
    check('注册响应不带 IP', !r1.text.includes('203.0.113.9'))
    const r2 = await signUp(w.lulu.host, emails[1])
    check('渠道站注册成功', r2.status === 200, r2.text.slice(0, 160))
    const u2 = await prisma.user.findUnique({ where: { email: emails[1] }, select: { registerIp: true } })
    check('渠道站注册不记 IP', u2 !== null && u2.registerIp === null, String(u2?.registerIp))

    section('下单')
    const buyer = await createUser('ip-buyer', { registeredTenantId: 1 })
    await prisma.user.update({ where: { id: buyer.id }, data: { createdAt: new Date(Date.now() - 90 * 86400000) } })
    const place = (host: string, t: typeof w.lulu | { code: string }) =>
      callRoute(orders.POST, { host, token: w.token(buyer, t as never), method: 'POST', path: '/api/orders', headers: IP, body: { productId: w.products.manual, quantity: 1 } })
    const main = await prisma.tenant.findUniqueOrThrow({ where: { id: 1 }, select: { id: true, code: true } })
    const om = await place(MAIN_HOST, { ...main, host: MAIN_HOST } as never)
    check('主站下单成功', om.status === 200, om.text.slice(0, 160))
    const mo = om.json?.data?.order ? await prisma.order.findUnique({ where: { orderNo: om.json.data.order.orderNo } }) : null
    check('主站单记 IP 和城市', mo?.createIp === IP['cf-connecting-ip'] && mo?.createCity === '北京', `${mo?.createIp} ${mo?.createCity}`)
    check('下单响应不带 IP', !om.text.includes('203.0.113.9'))
    const ol = await place(w.lulu.host, w.lulu)
    check('渠道下单成功', ol.status === 200, ol.text.slice(0, 160))
    const lo = ol.json?.data?.order ? await prisma.order.findUnique({ where: { orderNo: ol.json.data.order.orderNo } }) : null
    check('渠道单不记 IP 和城市', !!lo && lo.createIp === null && lo.createCity === null, String(lo?.createIp))

    section('成交弹窗的时间地点')
    if (mo) await prisma.order.update({ where: { id: mo.id }, data: { payStatus: 'PAID', deliveryStatus: 'DELIVERED' } })
    const recent = (await import('../../src/app/api/orders/recent/route')) as unknown as { GET: RouteFn }
    const feed = await callRoute(recent.GET, { host: w.lulu.host, path: '/api/orders/recent' })
    const row = ((feed.json?.data || []) as Record<string, string>[]).find((x) => x.city === '北京')
    check('渠道站弹窗拿到主站单的真实城市和相对时间，不带 IP', row?.timeLabel === '刚刚' && !feed.text.includes('203.0.113.9'), feed.text.slice(0, 200))

    section('3 年到期清除')
    const old = new Date(Date.now() - 1100 * 86400000)
    await prisma.user.updateMany({ where: { email: emails[0] }, data: { createdAt: old } })
    if (mo) await prisma.order.update({ where: { id: mo.id }, data: { createdAt: old } })
    process.env.CRON_SECRET = process.env.CRON_SECRET || 'itest'
    const c = await callRoute(cleanup.GET, { host: MAIN_HOST, path: `/api/cron/cleanup?secret=${process.env.CRON_SECRET}`, headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })
    check('清理任务成功', c.status === 200, c.text.slice(0, 160))
    const u3 = await prisma.user.findUnique({ where: { email: emails[0] }, select: { id: true, registerIp: true } })
    const m3 = mo ? await prisma.order.findUnique({ where: { id: mo.id }, select: { createIp: true, createCity: true, amount: true } }) : null
    check('到期后 IP 清空、账号和订单保留', !!u3 && u3.registerIp === null && !!m3 && m3.createIp === null && m3.createCity === null, JSON.stringify(u3))
  } finally {
    setChannelsMode('dormant')
    await prisma.user.deleteMany({ where: { email: { in: emails } } }).catch(() => {})
    await cleanupAll().catch(() => {})
  }
}

main()
  .catch((e) => {
    console.error(e)
    check('itest 未抛出异常', false, String((e as Error)?.message).slice(0, 300))
  })
  .finally(async () => {
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail ? 1 : 0)
  })
