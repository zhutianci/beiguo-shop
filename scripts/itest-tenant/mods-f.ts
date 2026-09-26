/**
 * 渠道分站二期 · 地基包 F 集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-f.ts
 *
 * 覆盖 docs/多渠道分销-二期改动.md 里地基包负责的部分：
 *   F-1 客服信息回退规则（contact-base resolveStoreContact）：微信号 + 二维码成组回退、邮箱 / 服务时间各自回退、库里不合规值按未设置
 *   F-2 字段校验（contact.ts check* 与 zod 形状）：微信号、邮箱（含禁发词）、服务时间、二维码地址；渠道输入不收 qrUrl
 *   F-3 店面解析带 contact：主站零查库、渠道每请求取四列、假库不带四列时回退主站；toPublicStorefront 显式五个键
 *   F-4 tenantMailOpts：主站 undefined 且不查库；渠道 { origin[, supportEmail] }；不合规客服邮箱不给；租户不存在抛错
 *   F-5 upload-store：storeContactQr 只收 png/jpg/webp ≤2MB；deleteContactUpload 只删 contact/ 下合规文件名；
 *        releaseContactUpload 只在没有任何渠道引用时才删（F-6b2，防跨渠道删图）
 *   F-6 facade：客服字段 / 二维码（换图删旧图、审计失败回滚并删新图、限频 10 次/小时）/ 清除；推送开关；通知邮箱验证（NOTICE 码）
 *   F-7 schema 默认值、selects 白名单（允许键含新字段、与禁用键不相交）、通知类型与中文名
 *
 * 【不发真实邮件】开头删掉阿里云相关环境变量，发信路径断言 MAIL_UNCONFIGURED；万一环境里仍配置了发信，相关断言整段跳过。
 * 【测试数据】租户 / 用户走 _harness 的前缀（ITEST / @itest-tenant.local），结束时**只删本脚本建的行**（不调 cleanupAll：
 * 二期多包并行跑 itest，全量清理会误删别的包正在用的夹具）；落盘的测试图片逐个删除。
 */
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) {
  delete process.env[k]
}

import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'
import path from 'path'
import { prisma, check, section, summary, setChannelsMode, createTenant, createUser, type WorldTenant, type WorldUser } from './_harness'


async function main() {
  // 被测模块在删完环境变量之后再加载（aliyun.ts 在加载时读发信配置）
  const contact = await import('../../src/lib/contact')
  const resolve = await import('../../src/lib/storefront/resolve')
  const pub = await import('../../src/lib/storefront/public')
  const origin = await import('../../src/lib/storefront/origin')
  const upload = await import('../../src/lib/upload-store')
  const facade = await import('../../src/lib/tenant/partner-facade')
  const verify = await import('../../src/lib/verify-code')
  const mail = await import('../../src/lib/mail')
  const selects = await import('../../src/lib/partner-services/selects')
  const types = await import('../../src/lib/tenant/types')

  const { PLATFORM_CONTACT, resolveStoreContact } = contact
  const createdFiles: string[] = []
  let tenant: WorldTenant | null = null
  let tenant2: WorldTenant | null = null
  let owner: WorldUser | null = null
  const decoy = path.join(upload.uploadRoot(), 'forum', `itest-f-decoy-${Date.now().toString(36)}.png`)

  try {
    // =======================================================================
    section('F-1 回退规则（resolveStoreContact）')
    {
      const p = resolveStoreContact(null)
      check('无行 → 主站四项', p.wechat === 'GenuineMarxist' && p.qrUrl === '/wechat-qr.jpg' && p.email === null && p.hours === '9:00-22:00')
      p.wechat = 'changed'
      check('返回副本（改了不影响常量）', PLATFORM_CONTACT.wechat === 'GenuineMarxist' && resolveStoreContact(undefined).wechat === 'GenuineMarxist')
      const none = resolveStoreContact({})
      check('渠道四项都没设 → 与主站完全相同（lulu 今天的表现，零回归）', JSON.stringify(none) === JSON.stringify({ ...PLATFORM_CONTACT }))
      const onlyWx = resolveStoreContact({ supportWechat: 'lulu_kefu' })
      check('只设微信号 → 用渠道微信号、隐藏二维码（不配主站二维码）', onlyWx.wechat === 'lulu_kefu' && onlyWx.qrUrl === null)
      check('只设微信号 → 邮箱 / 服务时间回退主站', onlyWx.email === null && onlyWx.hours === '9:00-22:00')
      const onlyQr = resolveStoreContact({ supportQrUrl: '/uploads/contact/abc-0123456789ab.png' })
      check('只设二维码 → 用渠道二维码、不显示主站微信号', onlyQr.qrUrl === '/uploads/contact/abc-0123456789ab.png' && onlyQr.wechat === null)
      const other = resolveStoreContact({ supportEmail: 'kf@lulu-shop.com', supportHours: '10:00-20:00' })
      check('只设邮箱与时间 → 微信组整组回退主站，邮箱 / 时间用渠道的', other.wechat === 'GenuineMarxist' && other.qrUrl === '/wechat-qr.jpg' && other.email === 'kf@lulu-shop.com' && other.hours === '10:00-20:00')
      const badQrs = ['javascript:alert(1)', 'https://evil.com/x.png', '/uploads/contact/../forum/x.png', '/uploads/contact/a.gif', '/uploads/contact/a.svg', '/uploads/forum/a.png', '/uploads/contact/A.png', '//evil.com/uploads/contact/a.png']
      check('库里不合规的二维码地址按未设置（整组回退主站）', badQrs.every((q) => resolveStoreContact({ supportQrUrl: q }).qrUrl === '/wechat-qr.jpg'))
      const badWx = ['<script>', 'http://x.com', 'a@b', 'x'.repeat(31), '']
      check('库里不合规的微信号按未设置', badWx.every((w) => resolveStoreContact({ supportWechat: w }).wechat === 'GenuineMarxist'))
      check('库里不合规的邮箱 / 时间按未设置', resolveStoreContact({ supportEmail: 'x"<@a.com', supportHours: '<b>9</b>' }).email === null && resolveStoreContact({ supportHours: 'http://a' }).hours === '9:00-22:00')
      check('changedContactFields 只给字段名', JSON.stringify(contact.changedContactFields({ supportWechat: 'a', supportEmail: null }, { supportWechat: 'b', supportEmail: null, supportHours: undefined })) === '["supportWechat"]')
    }

    // =======================================================================
    section('F-2 字段校验（写入端）')
    {
      const w = contact.checkContactWechat
      check('微信号：字母数字下划线横线汉字', w('lulu_kf-01').ok && w('露露客服').ok && w('  lulu  ').ok && (w('  lulu  ') as { value: string }).value === 'lulu')
      check('微信号：拒绝 URL / @ / <> / 超 30 字', !w('http://a.com').ok && !w('a@b').ok && !w('<b>').ok && !w('x'.repeat(31)).ok && !w(123).ok)
      check('微信号：null / 空串 / 全空白 = 清空', [null, '', '   ', undefined].every((v) => { const r = w(v); return r.ok && r.value === null }))
      const e = contact.checkContactEmail
      check('邮箱：合法 → 小写', (e('KF@Lulu-Shop.com') as { value: string }).value === 'kf@lulu-shop.com')
      check('邮箱：5 位以上数字@qq.com 被拒（禁发词）', !e('123456@qq.com').ok && e('abc@qq.com').ok)
      check('邮箱：含 wechat / weixin 被拒', !e('wechat01@gmail.com').ok && !e('weixin@a.com').ok)
      check('邮箱：格式 / 长度 / 引号', !e('not-an-email').ok && !e(`${'x'.repeat(115)}@a.com`).ok && !e('a"b@c.com').ok && !e('a b@c.com').ok)
      const h = contact.checkContactHours
      check('服务时间：常见写法', h('9:00-22:00').ok && h('周一至周五 9:00~18:00').ok && h('全天').ok)
      check('服务时间：拒绝 URL / 标签 / 超 40 字 / 全角冒号外的符号', !h('http://a').ok && !h('<b>9</b>').ok && !h('9'.repeat(41)).ok && !h('9:00-22:00！').ok)
      const q = contact.checkContactQrUrl
      check('二维码地址：只认 /uploads/contact/<名>.(png|jpg|webp)', q('/uploads/contact/mg1x2y3-0123456789ab.webp').ok && !q('/uploads/contact/a.gif').ok && !q('https://a/b.png').ok && !q('/wechat-qr.jpg').ok)
      const s = contact.partnerContactInputSchema
      check('渠道 PUT 请求体：合法', s.safeParse({ wechat: 'lulu', email: '', hours: null }).success)
      check('渠道 PUT 请求体：多给 qrUrl → 拒（二维码只走上传）', !s.safeParse({ qrUrl: '/uploads/contact/a-0.png' }).success)
      check('渠道 PUT 请求体：不合规字段带中文提示', (() => { const r = s.safeParse({ wechat: 'http://x' }); return !r.success && /微信号/.test(r.error.errors[0].message) })())
      const { z } = await import('zod')
      const admin = z.object({ ...contact.contactPatchShape }).strict()
      check('超管 PATCH：qrUrl 只收合规地址', admin.safeParse({ supportQrUrl: '/uploads/contact/a-0123.png' }).success && !admin.safeParse({ supportQrUrl: 'https://evil.com/a.png' }).success)
      check('超管 PATCH：null 清空、缺省不改', (() => { const r = admin.safeParse({ supportWechat: null }); return r.success && r.data.supportWechat === null && !('supportEmail' in r.data) })())
    }

    // =======================================================================
    section('F-7a schema 默认值（db push 已生效）')
    owner = await createUser('fown')
    tenant = await createTenant('x')
    await prisma.tenantMember.create({ data: { tenantId: tenant.id, userId: owner.id, role: 'OWNER', status: 1 } }).catch(() => null)
    {
      const t = await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { noticeWecomOn: true, noticeEmailOn: true, noticeEmail: true, supportWechat: true, supportQrUrl: true, supportEmail: true, supportHours: true } })
      check('新渠道：企业微信推送默认开、邮箱推送默认关', t?.noticeWecomOn === true && t?.noticeEmailOn === false)
      check('新渠道：通知邮箱与客服四列默认 null', !!t && t.noticeEmail === null && t.supportWechat === null && t.supportQrUrl === null && t.supportEmail === null && t.supportHours === null)
      const n = await prisma.tenantNotice.create({ data: { publicNo: `ITF${Date.now().toString(36).toUpperCase()}`.slice(0, 16), tenantId: tenant.id, kind: 'CUSTOMER_JOINED', title: 'x' }, select: { emailedAt: true, id: true } })
      check('TenantNotice.emailedAt 默认 null；新类型 CUSTOMER_JOINED 可写（VarChar(24)）', n.emailedAt === null)
      await prisma.tenantNotice.delete({ where: { id: n.id } })
    }

    // =======================================================================
    section('F-3 店面解析带 contact')
    {
      setChannelsMode('observe')
      const throwing = {
        findDomain: async () => {
          throw new Error('itest: 主站路径不应查库')
        },
        findTenant: async () => {
          throw new Error('itest: 主站路径不应查库')
        },
      }
      resolve.setStorefrontDbForTest(throwing)
      const p1 = await resolve.storefrontById(1)
      check('storefrontById(1) 不查库且 contact = 主站常量', !!p1 && JSON.stringify(p1.contact) === JSON.stringify({ ...PLATFORM_CONTACT }))
      const p2 = await resolve.resolveStorefrontForHost('www.bigolab.com')
      check('主站 Host 不查库且 contact = 主站常量', p2?.kind === 'PLATFORM' && p2.contact.wechat === 'GenuineMarxist')
      resolve.setStorefrontDbForTest(null)

      const s0 = await resolve.storefrontById(tenant.id)
      check('渠道未设客服 → contact 与主站相同', !!s0 && JSON.stringify(s0.contact) === JSON.stringify({ ...PLATFORM_CONTACT }))
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportWechat: 'itf_kefu', supportEmail: 'kf@itf-shop.com', supportHours: '10:00-20:00' } })
      const s1 = await resolve.resolveStorefrontForHost(tenant.host)
      check('渠道 Host：改完下一次解析立即看到（每请求查 tenants 行）', s1?.kind === 'CHANNEL' && s1.contact.wechat === 'itf_kefu' && s1.contact.qrUrl === null && s1.contact.email === 'kf@itf-shop.com' && s1.contact.hours === '10:00-20:00')
      // wp0 的假库只 select 前五列：缺省按未设置回退主站（兼容）
      resolve.setStorefrontDbForTest({
        findDomain: (host: string) => prisma.tenantDomain.findUnique({ where: { host }, select: { tenantId: true, status: true } }),
        findTenant: (id: number) => prisma.tenant.findUnique({ where: { id }, select: { id: true, code: true, kind: true, status: true, origin: true } }),
      })
      const s2 = await resolve.storefrontById(tenant.id)
      check('假库不带客服列 → contact 回退主站（wp0 注入兼容）', !!s2 && s2.contact.wechat === 'GenuineMarxist')
      resolve.setStorefrontDbForTest(null)

      const dto = pub.toPublicStorefront(s1)
      check('toPublicStorefront 只有五个键（含 contact）', JSON.stringify(Object.keys(dto).sort()) === JSON.stringify(['code', 'contact', 'features', 'kind', 'origin']))
      check('contact 只有四个键', JSON.stringify(Object.keys(dto.contact).sort()) === JSON.stringify(['email', 'hours', 'qrUrl', 'wechat']))
      check('toPublicStorefront 不含 id / status', !('id' in dto) && !('status' in dto))
      const nul = pub.toPublicStorefront(null)
      check('无店面 → 主站客服（与二期前一致）', nul.contact.wechat === 'GenuineMarxist' && nul.features.coupon === false)
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportWechat: null, supportEmail: null, supportHours: null } })
    }

    // =======================================================================
    section('F-4 tenantMailOpts')
    {
      resolve.setStorefrontDbForTest({
        findDomain: async () => {
          throw new Error('itest: 不应查库')
        },
        findTenant: async () => {
          throw new Error('itest: 不应查库')
        },
      })
      check('主站 → undefined，不查库', (await origin.tenantMailOpts(1)) === undefined)
      resolve.setStorefrontDbForTest(null)
      const o0 = await origin.tenantMailOpts(tenant.id)
      check('渠道未设客服邮箱 → 只有 origin', !!o0 && o0.origin === tenant.origin && !('supportEmail' in o0))
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportEmail: 'kf@itf-shop.com' } })
      const o1 = await origin.tenantMailOpts(tenant.id)
      check('渠道设了客服邮箱 → { origin, supportEmail }', o1?.origin === tenant.origin && o1?.supportEmail === 'kf@itf-shop.com')
      const html = mail.renderOrderReplyEmail({ orderNo: 'IT1', productName: 'x' }, o1).html
      check('页脚出现「客服邮箱：kf@itf-shop.com」', html.includes('客服邮箱：kf@itf-shop.com'))
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportWechat: 'itf_kefu', supportQrUrl: '/uploads/contact/a-0123456789ab.png' } })
      const o2 = await origin.tenantMailOpts(tenant.id)
      const html2 = mail.renderOrderPaidEmail({ orderNo: 'IT1', productName: 'x', amount: 1, deliveryType: 'MANUAL' }, o2).html
      check('微信号与二维码永远不进邮件', !html2.includes('itf_kefu') && !html2.includes('/uploads/contact/') && !html2.includes('GenuineMarxist'))
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportEmail: '123456@qq.com' } })
      const o3 = await origin.tenantMailOpts(tenant.id)
      const html3 = mail.renderOrderReplyEmail({ orderNo: 'IT1', productName: 'x' }, o3).html
      check('库里被写进禁发邮箱（绕过校验）→ 页脚也不出', !html3.includes('客服邮箱') && !html3.includes('123456@qq.com'))
      let threw = false
      try {
        await origin.tenantMailOpts(999999999)
      } catch {
        threw = true
      }
      check('渠道不存在 → 抛错（不回落主站）', threw)
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportEmail: null, supportWechat: null, supportQrUrl: null } })
    }

    // =======================================================================
    section('F-5 upload-store：客服二维码落盘与删除边界')
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)])
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 2)])
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(64, 3)])
    const gif = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(64, 4)])
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    const fileOf = (url: string) => path.join(upload.uploadRoot(), url.replace(/^\/uploads\//, ''))
    {
      const results = [await upload.storeContactQr(png), await upload.storeContactQr(jpg), await upload.storeContactQr(webp)]
      for (const r of results) if (r.ok) createdFiles.push(r.url)
      check('png / jpg / webp 都收，地址符合 CONTACT_QR_URL_RE', results.every((r) => r.ok && contact.CONTACT_QR_URL_RE.test(r.url)))
      check('落盘文件存在', results.every((r) => r.ok && existsSync(fileOf(r.url))))
      check('扩展名按文件头（jpg 字节 → .jpg）', results[1].ok && results[1].url.endsWith('.jpg'))
      const g = await upload.storeContactQr(gif)
      const s = await upload.storeContactQr(svg)
      check('gif / SVG 拒绝（type）', !g.ok && g.reason === 'type' && !s.ok && s.reason === 'type')
      const big = await upload.storeContactQr(Buffer.concat([png, Buffer.alloc(upload.CONTACT_QR_MAX_BYTES)]))
      check('超过 2MB 拒绝（size）', !big.ok && big.reason === 'size')
      check('空文件拒绝', (await upload.storeContactQr(Buffer.alloc(0))).ok === false)
      check('contact 与 forum 同一条 90% 配额线', upload.quotaForScope('contact') === upload.quotaForScope('forum') && upload.quotaForScope('contact') < upload.quotaForScope('products'))

      mkdirSync(path.dirname(decoy), { recursive: true })
      writeFileSync(decoy, png)
      const decoyName = path.basename(decoy)
      const bad = [`/uploads/forum/${decoyName}`, `/uploads/contact/../forum/${decoyName}`, '/wechat-qr.jpg', `/uploads/contact/..%2fforum%2f${decoyName}`, '', null, undefined]
      let anyTrue = false
      for (const b of bad) anyTrue = anyTrue || (await upload.deleteContactUpload(b as string))
      check('不合规地址一律不删（返回 false）', !anyTrue)
      check('contact/ 之外的文件原样还在', existsSync(decoy))
      const first = results[0]
      if (first.ok) {
        check('合规地址 → 删除成功', (await upload.deleteContactUpload(first.url)) === true && !existsSync(fileOf(first.url)))
        check('再删一次 → false（不抛）', (await upload.deleteContactUpload(first.url)) === false)
      }
      for (const r of results.slice(1)) if (r.ok) await upload.deleteContactUpload(r.url)
      check('测试落盘文件已清理', results.every((r) => !r.ok || !existsSync(fileOf(r.url))))
    }

    // =======================================================================
    section('F-6a facade：客服字段')
    {
      const r = await facade.setTenantContact(tenant.id, { wechat: 'itf_kefu', email: 'KF@ITF-shop.com', hours: '10:00-20:00' })
      check('保存成功，邮箱转小写', r.contact.supportWechat === 'itf_kefu' && r.contact.supportEmail === 'kf@itf-shop.com' && r.contact.supportHours === '10:00-20:00')
      check('changed 只给字段名', JSON.stringify([...r.changed].sort()) === JSON.stringify(['supportEmail', 'supportHours', 'supportWechat']))
      const same = await facade.setTenantContact(tenant.id, { wechat: 'itf_kefu' })
      check('值没变 → changed 为空', same.changed.length === 0)
      let err = null as { name?: string; code?: string; detail?: string } | null
      try {
        await facade.setTenantContact(tenant.id, { wechat: 'ok_one', email: '123456@qq.com' })
      } catch (e) {
        err = e as typeof err
      }
      check('不合规 → PartnerFacadeError(BAD_CONTACT) 带中文提示', err?.name === 'PartnerFacadeError' && err?.code === 'BAD_CONTACT' && /邮箱/.test(err?.detail || ''))
      const t = await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { supportWechat: true } })
      check('校验失败整笔不写（微信号没被改成 ok_one）', t?.supportWechat === 'itf_kefu')
      const cl = await facade.setTenantContact(tenant.id, { email: '', hours: null })
      check('空串 / null = 清空', cl.contact.supportEmail === null && cl.contact.supportHours === null && cl.contact.supportWechat === 'itf_kefu')
      const viaTx = await prisma.$transaction((tx) => facade.setTenantContact(tenant!.id, { hours: '全天' }, tx))
      check('传 tx 时在调用方事务里完成', viaTx.contact.supportHours === '全天')
    }

    // =======================================================================
    section('F-6b facade：客服二维码（换图删旧图、审计回滚、清除、限频）')
    {
      let audits = 0
      const a = await facade.saveTenantContactQr(tenant.id, png, async (tx) => {
        audits++
        await tx.tenant.findUnique({ where: { id: tenant!.id }, select: { id: true } })
      })
      check('上传成功，库里写入服务端生成的地址', a.ok && contact.CONTACT_QR_URL_RE.test(a.supportQrUrl) && audits === 1)
      const firstUrl = a.ok ? a.supportQrUrl : ''
      const b = await facade.saveTenantContactQr(tenant.id, webp)
      const secondUrl = b.ok ? b.supportQrUrl : ''
      check('换图：新地址入库、旧文件被删', b.ok && secondUrl !== firstUrl && !existsSync(fileOf(firstUrl)) && existsSync(fileOf(secondUrl)))
      const before = (await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { supportQrUrl: true } }))?.supportQrUrl
      let rolled = false
      try {
        await facade.saveTenantContactQr(tenant.id, jpg, async () => {
          throw new Error('itest: 审计失败')
        })
      } catch {
        rolled = true
      }
      const after = (await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { supportQrUrl: true } }))?.supportQrUrl
      check('审计失败 → 整笔回滚：库里仍是旧图、旧图文件还在', rolled && after === before && existsSync(fileOf(secondUrl)))
      const bt = await facade.saveTenantContactQr(tenant.id, gif)
      check('gif → BAD_TYPE；SVG → BAD_TYPE', !bt.ok && bt.reason === 'BAD_TYPE' && (await facade.saveTenantContactQr(tenant.id, svg)).ok === false)
      const sf = await resolve.storefrontById(tenant.id)
      check('店面立即显示渠道二维码 + 渠道微信号（成组）', sf?.contact.qrUrl === secondUrl && sf?.contact.wechat === 'itf_kefu')
      let clearAudits = 0
      const c1 = await facade.clearTenantContactQr(tenant.id, async () => {
        clearAudits++
      })
      check('清除：库置空、文件删除、审计一次', c1.cleared && clearAudits === 1 && !existsSync(fileOf(secondUrl)))
      const c2 = await facade.clearTenantContactQr(tenant.id, async () => {
        clearAudits++
      })
      check('再清除：cleared=false、不写审计', !c2.cleared && clearAudits === 1)
      // 已经用了 5 次（2 成功 + 1 回滚 + gif + svg）；再用 5 次到 10 次，第 11 次限频
      const urls: string[] = []
      for (let i = 0; i < 5; i++) {
        const r = await facade.saveTenantContactQr(tenant.id, png)
        if (r.ok) urls.push(r.supportQrUrl)
      }
      const limited = await facade.saveTenantContactQr(tenant.id, png)
      check('每渠道每小时 10 次，第 11 次 TOO_FREQUENT', !limited.ok && limited.reason === 'TOO_FREQUENT')
      check('连续换图只留最后一张（其余旧图都删了）', urls.slice(0, -1).every((u) => !existsSync(fileOf(u))) && urls.length > 0 && existsSync(fileOf(urls[urls.length - 1])))
      await facade.clearTenantContactQr(tenant.id)
      check('收尾清除后没有残留文件', urls.every((u) => !existsSync(fileOf(u))))
    }

    // =======================================================================
    section('F-6b2 共用二维码：别的渠道还引用时不删（审查意见：删旧图不能跨渠道）')
    {
      // 模拟超管 PATCH 把同一张图填给了两个渠道（PATCH 只校验格式；P3 会用 contactUploadOwnedByOtherTenant 拦，这里验兜底）
      tenant2 = await createTenant('z')
      const shared = await upload.storeContactQr(png)
      const sharedUrl = shared.ok ? shared.url : ''
      if (shared.ok) createdFiles.push(sharedUrl)
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportQrUrl: sharedUrl } })
      await prisma.tenant.update({ where: { id: tenant2.id }, data: { supportQrUrl: sharedUrl } })
      check('归属检查：对 A 而言 B 占用着 → true', (await upload.contactUploadOwnedByOtherTenant(sharedUrl, tenant.id)) === true)
      check('releaseContactUpload：仍有引用 → 不删（false）、文件还在', (await upload.releaseContactUpload(sharedUrl)) === false && existsSync(fileOf(sharedUrl)))
      const r2 = await facade.saveTenantContactQr(tenant2.id, png)
      const b2New = r2.ok ? r2.supportQrUrl : ''
      check('B 换图：A 仍引用旧图 → 旧图文件保留', r2.ok && existsSync(fileOf(sharedUrl)) && existsSync(fileOf(b2New)))
      check('B 换走后：对 A 而言没人占用 → false；对 B 而言 A 占用 → true', (await upload.contactUploadOwnedByOtherTenant(sharedUrl, tenant.id)) === false && (await upload.contactUploadOwnedByOtherTenant(sharedUrl, tenant2.id)) === true)
      const cA = await facade.clearTenantContactQr(tenant.id)
      check('A 清除：已无人引用 → 文件删除', cA.cleared && !existsSync(fileOf(sharedUrl)))
      await prisma.tenant.update({ where: { id: tenant.id }, data: { supportQrUrl: b2New } })
      const cB = await facade.clearTenantContactQr(tenant2.id)
      check('B 清除自己的图，但 A 仍引用 → 文件保留', cB.cleared && existsSync(fileOf(b2New)))
      const cA2 = await facade.clearTenantContactQr(tenant.id)
      check('A 再清除 → 最后一个引用放手，文件删除', cA2.cleared && !existsSync(fileOf(b2New)))
      check('非法地址 → releaseContactUpload 返回 false 不查库不删', (await upload.releaseContactUpload('/uploads/forum/x.png')) === false && (await upload.releaseContactUpload(null)) === false)
    }

    // =======================================================================
    section('F-6c facade：推送开关与通知邮箱')
    {
      let err = null as { code?: string } | null
      try {
        await facade.setTenantNoticeTransport(tenant.id, { emailOn: true })
      } catch (e) {
        err = e as { code?: string }
      }
      check('没有通知邮箱时打开邮箱推送 → NO_NOTICE_EMAIL', err?.code === 'NO_NOTICE_EMAIL')
      const w = await facade.setTenantNoticeTransport(tenant.id, { wecomOn: false })
      check('关企业微信推送', w.noticeWecomOn === false && w.noticeEmailOn === false)
      const self = await facade.setTenantNoticeEmail(tenant.id, owner.id, owner.email.toUpperCase())
      check('等于登录邮箱 → 不要验证码直接保存（小写）', self.ok && self.noticeEmail === owner.email.toLowerCase())
      const on = await facade.setTenantNoticeTransport(tenant.id, { emailOn: true, wecomOn: true })
      check('有邮箱后可以打开邮箱推送；两种可同时开', on.noticeEmailOn && on.noticeWecomOn)
      const other = `itf-notice-${Date.now().toString(36)}@itest-tenant.local`
      const need = await facade.setTenantNoticeEmail(tenant.id, owner.id, other)
      check('非登录邮箱不带码 → NEED_CODE（不写库）', !need.ok && need.reason === 'NEED_CODE')
      const wrong = await facade.setTenantNoticeEmail(tenant.id, owner.id, other, '000000')
      check('没有有效码 / 码错 → BAD_CODE', !wrong.ok && wrong.reason === 'BAD_CODE')
      const code = await verify.createCode(other, 'NOTICE')
      check('NOTICE 码不能拿去注册（用途隔离）', (await verify.consumeCode(other, 'REGISTER', code)) === 'INVALID')
      const good = await facade.setTenantNoticeEmail(tenant.id, owner.id, other, code)
      check('正确 NOTICE 码 → 保存', good.ok && good.noticeEmail === other)
      const reuse = await facade.setTenantNoticeEmail(tenant.id, owner.id, other, code)
      check('同一张码不能再用', !reuse.ok && reuse.reason === 'BAD_CODE')
      const bad = await facade.setTenantNoticeEmail(tenant.id, owner.id, 'not an email')
      check('格式错 → BAD_EMAIL', !bad.ok && bad.reason === 'BAD_EMAIL')
      const t1 = await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { noticeEmail: true, noticeEmailOn: true } })
      check('库里是验证过的地址，邮箱推送仍开', t1?.noticeEmail === other && t1?.noticeEmailOn === true)
      const qqOk = await facade.setTenantNoticeEmail(tenant.id, owner.id, '1234567@qq.com')
      check('通知邮箱不做禁发词拦截（QQ 数字邮箱是收件人、不进正文）→ 走验证码流程', !qqOk.ok && qqOk.reason === 'NEED_CODE')
      const cleared = await facade.setTenantNoticeEmail(tenant.id, owner.id, null)
      const t2 = await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { noticeEmail: true, noticeEmailOn: true } })
      check('清空邮箱 → 同时关掉邮箱推送', cleared.ok && t2?.noticeEmail === null && t2?.noticeEmailOn === false)

      if (mail.systemEmailConfigured()) {
        console.log('  · 跳过发信断言：环境里配置了发信（本测试绝不发真实邮件）')
      } else {
        const s1 = await facade.sendTenantNoticeEmailCode(tenant.id, owner.id, owner.email)
        check('发码：登录邮箱 → needCode=false、不发信', s1.ok && s1.needCode === false)
        const s2 = await facade.sendTenantNoticeEmailCode(tenant.id, owner.id, other)
        check('发码：发信未配置 → MAIL_UNCONFIGURED', !s2.ok && s2.reason === 'MAIL_UNCONFIGURED')
        const s3 = await facade.sendTenantNoticeEmailCode(tenant.id, owner.id, 'bad')
        check('发码：格式错 → BAD_EMAIL', !s3.ok && s3.reason === 'BAD_EMAIL')
        const t0 = await facade.sendTenantNoticeTestEmail(tenant.id)
        check('测试邮件：没有通知邮箱 → NO_NOTICE_EMAIL', !t0.ok && t0.reason === 'NO_NOTICE_EMAIL')
        await facade.setTenantNoticeEmail(tenant.id, owner.id, owner.email)
        const t3 = await facade.sendTenantNoticeTestEmail(tenant.id)
        check('测试邮件：发信未配置 → MAIL_UNCONFIGURED', !t3.ok && t3.reason === 'MAIL_UNCONFIGURED')
      }
      const tm = mail.renderTenantNoticeEmail({ kind: 'TEST', title: '邮件推送测试', body: '这是一条测试消息：收到即表示店铺后台的通知可以推送到本邮箱。', path: '/partner/settings' }, { origin: tenant.origin })
      check('测试邮件文案不含「微信」', !tm.html.includes('微信') && !tm.subject.includes('微信'))
    }

    // =======================================================================
    section('F-7b selects 白名单与通知类型')
    {
      const allowed = selects.PARTNER_ALLOWED_KEYS
      const newKeys = ['globalSales', 'noticeWecomOn', 'noticeEmailOn', 'noticeEmail', 'supportWechat', 'supportQrUrl', 'supportEmail', 'supportHours', 'needCode', 'sent', 'transport', 'contact']
      check('新键都在允许键表', newKeys.every((k) => allowed.has(k)), newKeys.filter((k) => !allowed.has(k)).join(','))
      const clash = Array.from(allowed).filter((k) => selects.PARTNER_FORBIDDEN_KEYS.has(k))
      check('允许键与禁用键不相交', clash.length === 0, clash.join(','))
      const ts = selects.PARTNER_TENANT_SELECT as Record<string, unknown>
      check('PARTNER_TENANT_SELECT 带推送方式与客服四列，仍不带密文 / 原因', ['noticeWecomOn', 'noticeEmailOn', 'noticeEmail', 'supportWechat', 'supportQrUrl', 'supportEmail', 'supportHours'].every((k) => ts[k] === true) && !('wecomWebhookEnc' in ts) && !('payoutHoldReason' in ts) && !('payeeAccountEnc' in ts))
      check('PARTNER_PRODUCT_SELECT 带 sales（全站销量），不带成本', (selects.PARTNER_PRODUCT_SELECT as Record<string, unknown>).sales === true && !('cost' in selects.PARTNER_PRODUCT_SELECT))
      check('PARTNER_NOTICE_SELECT 不带 emailedAt / pushedAt（渠道不需要）', !('emailedAt' in selects.PARTNER_NOTICE_SELECT) && !('pushedAt' in selects.PARTNER_NOTICE_SELECT))
      check('通知类型含 CUSTOMER_JOINED / ORDER_DELIVERED', types.TENANT_NOTICE_KINDS.includes('CUSTOMER_JOINED') && types.TENANT_NOTICE_KINDS.includes('ORDER_DELIVERED'))
      check('每种类型都有中文名', types.TENANT_NOTICE_KINDS.every((k) => typeof types.TENANT_NOTICE_KIND_LABEL[k] === 'string' && types.TENANT_NOTICE_KIND_LABEL[k].length > 0))
      check('新类型也在通知偏好允许键里（noticePrefs 的键）', allowed.has('CUSTOMER_JOINED') && allowed.has('ORDER_DELIVERED'))
    }
  } finally {
    // 只删本脚本建的数据与文件（不调 cleanupAll，理由见文件头）
    resolve.setStorefrontDbForTest(null)
    for (const u of createdFiles) await upload.deleteContactUpload(u).catch(() => false)
    try {
      if (existsSync(decoy)) unlinkSync(decoy)
    } catch {
      /* 忽略 */
    }
    if (tenant) {
      const tq = await prisma.tenant.findUnique({ where: { id: tenant.id }, select: { supportQrUrl: true } })
      if (tq?.supportQrUrl) await upload.deleteContactUpload(tq.supportQrUrl).catch(() => false)
      await prisma.auditEvent.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.tenantNotice.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.tenantMember.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.tenantDomain.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => null)
    }
    if (tenant2) {
      const tq = await prisma.tenant.findUnique({ where: { id: tenant2.id }, select: { supportQrUrl: true } })
      if (tq?.supportQrUrl) await upload.deleteContactUpload(tq.supportQrUrl).catch(() => false)
      await prisma.auditEvent.deleteMany({ where: { tenantId: tenant2.id } })
      await prisma.tenantDomain.deleteMany({ where: { tenantId: tenant2.id } })
      await prisma.tenant.delete({ where: { id: tenant2.id } }).catch(() => null)
    }
    if (owner) {
      await prisma.emailCode.deleteMany({ where: { email: { endsWith: '@itest-tenant.local' }, purpose: 'NOTICE' } })
      await prisma.user.delete({ where: { id: owner.id } }).catch(() => null)
    }
  }
}

main()
  .then(async () => {
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail ? 1 : 0)
  })
  .catch(async (e) => {
    console.error(e)
    summary()
    await prisma.$disconnect()
    process.exit(1)
  })
