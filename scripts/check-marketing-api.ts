/**
 * 营销推广 · 后台接口层自测（campaign-repo / test-send / upload-store 的纯函数 + 本地库集成）。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/check-marketing-api.ts
 *
 * ⚠️ 会在库里建数据再删掉：库名不含 dev / test 时直接拒绝执行。
 * 测试发送走 dry-run（脚本自己设 MARKETING_DRY_RUN=1；dry-run 只在 dev/test 库生效），不会调阿里云。
 *
 * 钉住的点：
 *   · 保存草稿的乐观锁：旧 baseUpdatedAt → 冲突并附服务器版本；两个标签页同时保存只有一个成功；没改动不写库
 *   · 显式写 updatedAt 能压住 Prisma 的 @updatedAt（测试发送写 testedHash 不许让编辑器下一次保存撞 409）
 *   · 落库的 doc 是 zod 规范形态：JSON.parse(库里的字符串) 算出的指纹 = 详情里的 contentHash（lifecycle 同口径）
 *   · 只有草稿能删；复制带内容与受众；模板增删改；内置模板不可改删
 *   · 测试发送：收件人白名单、24 小时 30 封上限、内容错误拒发、成功后 testedCurrent 且 updatedAt 不变
 *   · 内置模板自带受众（老客召回只发给付过款的人；请求里给了受众以请求为准，审查 C13）
 */
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(2)
}
// 测试发送只走 dry-run：lib/marketing/config 的 isDryRun 还会再核对库名
process.env.MARKETING_DRY_RUN = '1'

const prisma = new PrismaClient()
let pass = 0
let fail = 0
let skip = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function skipped(name: string, why: string) {
  skip++
  console.log(`  - 跳过 ${name}（${why}）`)
}
const isNotImplemented = (e: unknown) => /not implemented/i.test(String((e as Error)?.message || e))

const TAG = `imkapi${Date.now().toString(36)}`

async function main() {
  const repo = await import('../src/lib/marketing/campaign-repo')
  const store = await import('../src/lib/upload-store')
  const { contentHash } = await import('../src/lib/marketing/hash')
  const { LifecycleError } = await import('../src/lib/marketing/lifecycle')
  const types = await import('../src/lib/marketing/types')

  /* ============================== 纯函数 ============================== */
  console.log('\n【parseId / parsePaging / parseTemplateRef】')
  ok("parseId('12') = 12", repo.parseId('12') === 12)
  ok("parseId('0' / '-1' / '1e3' / '' / 10 位) = null", [
    repo.parseId('0'),
    repo.parseId('-1'),
    repo.parseId('1e3'),
    repo.parseId(''),
    repo.parseId('1234567890'),
  ].every((v) => v === null))
  {
    const p = repo.parsePaging(new URLSearchParams('page=0&pageSize=1000'), 20, 100)
    ok('parsePaging 夹到 page≥1、pageSize≤100', p.page === 1 && p.pageSize === 100)
    const q = repo.parsePaging(new URLSearchParams('page=abc'), 20, 100)
    ok('parsePaging 非数字回落默认', q.page === 1 && q.pageSize === 20)
  }
  {
    const a = repo.parseTemplateRef('tpl:12')
    const b = repo.parseTemplateRef('tpl%3A12')
    const c = repo.parseTemplateRef('12')
    ok("parseTemplateRef 接受 'tpl:12' / 编码后的 / '12'", [a, b, c].every((r) => r.kind === 'saved' && r.id === 12))
    ok("parseTemplateRef('preset:blank') = builtin", repo.parseTemplateRef('preset:blank').kind === 'builtin')
    ok("parseTemplateRef('abc' / '%E0%A4%A') = invalid", repo.parseTemplateRef('abc').kind === 'invalid' && repo.parseTemplateRef('%E0%A4%A').kind === 'invalid')
  }

  console.log('\n【主题清洗 / 默认活动名（北京时间）/ 受众去重】')
  ok('cleanSubjectLine 去掉换行制表与控制字符', repo.cleanSubjectLine('a\r\nb\tc\u0000d\u007f') === 'a b c d ')
  ok('cleanSubjectLine 不 trim（编辑器输入中的尾部空格保留）', repo.cleanSubjectLine('国庆 ') === '国庆 ')
  ok('北京 9/25 00:30 → 9月25日', repo.defaultCampaignName(new Date('2026-09-24T16:30:00Z')) === '未命名活动 9月25日')
  ok('北京 9/25 23:59 → 9月25日', repo.defaultCampaignName(new Date('2026-09-25T15:59:59Z')) === '未命名活动 9月25日')
  ok('北京 9/26 00:00 → 9月26日', repo.defaultCampaignName(new Date('2026-09-25T16:00:00Z')) === '未命名活动 9月26日')
  {
    const a = repo.canonicalAudience({ type: 'USERS', userIds: [3, 1, 3, 2, 1] })
    ok('USERS 受众去重且保持顺序', a.type === 'USERS' && JSON.stringify(a.userIds) === '[3,1,2]')
  }

  console.log('\n【upload-store：魔数识别与配额线】')
  {
    const pad = (h: number[]) => Buffer.concat([Buffer.from(h), Buffer.alloc(16)])
    ok('JPEG', store.sniffImage(pad([0xff, 0xd8, 0xff, 0xe0])) === 'jpg')
    ok('PNG', store.sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) === 'png')
    ok('GIF89a', store.sniffImage(Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16)])) === 'gif')
    ok('WEBP', store.sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)])) === 'webp')
    ok('SVG / 文本 → null', store.sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')) === null)
    ok('不足 12 字节 → null', store.sniffImage(Buffer.from([0xff, 0xd8, 0xff])) === null)
    ok('论坛只能用到 90%', store.quotaForScope('forum') === Math.floor(store.MAX_TOTAL_BYTES * 0.9))
    ok('mail / products 用满', store.quotaForScope('mail') === store.MAX_TOTAL_BYTES && store.quotaForScope('products') === store.MAX_TOTAL_BYTES)
    ok('mail 是登记过的目录、../ 不是', store.isStoreScope('mail') && !store.isStoreScope('../x') && !store.isStoreScope('constructor'))
    let threw = false
    try {
      await store.storeUpload('../../etc', Buffer.alloc(20), 'jpg')
    } catch {
      threw = true
    }
    ok('storeUpload 拒绝未登记的目录', threw)
    threw = false
    try {
      await store.storeUpload('mail', Buffer.alloc(20), 'svg')
    } catch {
      threw = true
    }
    ok('storeUpload 拒绝非法扩展名', threw)
  }

  console.log('\n【canonicalDoc：规范化后指纹稳定】')
  {
    const blank = repo.fallbackBlankDoc()
    ok('兜底空白文档本身合法', types.emailDocSchema.safeParse(blank).success)
    // 同一份文档，键顺序打乱、URL 带空格 → 规范化后 JSON 完全一致
    const shuffled = JSON.parse(JSON.stringify({ blocks: blank.blocks, settings: blank.settings, v: 1 }))
    const a = repo.canonicalDoc(blank)
    const b = repo.canonicalDoc(shuffled)
    ok('键顺序不同的同一文档 → 同一 JSON', a.ok && b.ok && a.json === b.json)
    if (a.ok) {
      const again = repo.canonicalDoc(JSON.parse(a.json))
      ok('规范化幂等（再过一遍不变）', again.ok && again.json === a.json)
    }
    const big = { ...blank, blocks: Array.from({ length: 40 }, (_, i) => ({ ...blank.blocks[0], id: `b${i}`, content: { type: 'doc', content: Array.from({ length: 2 }, () => ({ type: 'paragraph', content: [{ type: 'text', text: '长'.repeat(4000) }] })) } })) }
    const r = repo.canonicalDoc(big)
    ok('超过 200KB 的文档被拒', !r.ok, r.ok ? '竟然通过了' : '')
    ok('非法文档被拒并给中文原因', (() => {
      const x = repo.canonicalDoc({ v: 1, blocks: 'x' })
      return !x.ok && /[一-龥]/.test(x.error)
    })())
  }

  console.log('\n【readJsonBody / knownErrorResponse】')
  {
    const mk = (body: string, len?: number) =>
      new Request('http://x/', { method: 'POST', body, headers: len != null ? { 'content-length': String(len) } : {} })
    const r1 = await repo.readJsonBody(mk('{"a":1}'), 100)
    ok('正常 JSON', r1.ok && (r1.body as { a: number }).a === 1)
    const r2 = await repo.readJsonBody(mk('{"a":1}', 5000), 100)
    ok('Content-Length 超限 → 413', !r2.ok && r2.status === 413)
    const r3 = await repo.readJsonBody(mk('x'.repeat(200)), 100)
    ok('实际字节超限 → 413', !r3.ok && r3.status === 413)
    const r4 = await repo.readJsonBody(mk('{oops'), 100)
    ok('坏 JSON → 400', !r4.ok && r4.status === 400)
    const r5 = await repo.readJsonBody(mk(''), 100)
    ok('空体 → {}', r5.ok && JSON.stringify(r5.body) === '{}')

    const e1 = repo.knownErrorResponse(new repo.MarketingHttpError('没找到', 404))
    ok('MarketingHttpError → 对应状态码', !!e1 && e1.status === 404 && (await e1.json()).error === '没找到')
    const e2 = repo.knownErrorResponse(new LifecycleError('人数变了', 409, { eligible: 3 }))
    const j2 = e2 ? await e2.json() : null
    ok('LifecycleError → 409 且 payload 放 data', !!e2 && e2.status === 409 && j2?.data?.eligible === 3 && j2?.success === false)
    ok('其他错误 → null', repo.knownErrorResponse(new Error('x')) === null)
  }

  /* ============================== 本地库集成 ============================== */
  const admin = await prisma.user.create({
    data: { email: `${TAG}-admin@test.local`, passwordHash: 'x', role: 'ADMIN', status: 1, nickname: '测试管理员' },
  })
  const createdCampaigns: number[] = []
  const createdTemplates: number[] = []
  const configBackup = await prisma.setting.findUnique({ where: { key: types.SETTING_KEYS.config } })

  try {
    console.log('\n【Prisma：显式 updatedAt 能压住 @updatedAt】')
    {
      const c = await prisma.marketingCampaign.create({
        data: { name: `${TAG}-probe`, subject: 's', doc: '{}', audience: '{}', createdBy: admin.id },
      })
      createdCampaigns.push(c.id)
      await new Promise((r) => setTimeout(r, 15))
      const r = await prisma.marketingCampaign.updateMany({
        where: { id: c.id, updatedAt: c.updatedAt },
        data: { testedHash: 'x'.repeat(64), updatedAt: c.updatedAt },
      })
      const after = await prisma.marketingCampaign.findUnique({ where: { id: c.id } })
      ok('updateMany 按 updatedAt 精确匹配（毫秒）', r.count === 1)
      ok('显式写回的 updatedAt 原样保留', after?.updatedAt.getTime() === c.updatedAt.getTime())
      await new Promise((r2) => setTimeout(r2, 15))
      await prisma.marketingCampaign.updateMany({ where: { id: c.id }, data: { statusNote: 'x' } })
      const after2 = await prisma.marketingCampaign.findUnique({ where: { id: c.id } })
      ok('不显式写时 @updatedAt 照常刷新', (after2?.updatedAt.getTime() || 0) > c.updatedAt.getTime())
    }

    console.log('\n【新建 / 详情 / 指纹口径】')
    const d1 = await repo.createDraft({ name: `${TAG}-a`, audience: { type: 'USERS', userIds: [admin.id, admin.id] } }, admin.id)
    createdCampaigns.push(d1.id)
    ok('新建是 DRAFT', d1.status === 'DRAFT')
    ok('受众去重后落库', d1.audience.type === 'USERS' && d1.audience.userIds.length === 1)
    ok('新草稿未测试', d1.testedCurrent === false)
    {
      const row = await prisma.marketingCampaign.findUnique({ where: { id: d1.id } })
      const h = contentHash({ topic: row!.topic, subject: row!.subject, preheader: row!.preheader, doc: JSON.parse(row!.doc) })
      ok('JSON.parse(库里的 doc) 算出的指纹 = 详情 contentHash', h === d1.contentHash)
      const audits = await prisma.marketingAudit.count({ where: { campaignId: d1.id, action: 'CREATE' } })
      ok('写了 CREATE 审计', audits === 1)
    }
    const dName = await repo.createDraft({}, admin.id)
    createdCampaigns.push(dName.id)
    ok('缺省名称「未命名活动 M月D日」', /^未命名活动 \d{1,2}月\d{1,2}日$/.test(dName.name))
    ok('缺省受众 = 全部活跃用户', dName.audience.type === 'ALL' && dName.audience.excludeInactive === true)
    {
      let code = 0
      try {
        await repo.createDraft({ preset: 'no-such-preset' }, admin.id)
      } catch (e) {
        code = (e as { status?: number }).status || -1
      }
      ok('不存在的内置模板 → 404', code === 404)
    }

    console.log('\n【内置模板自带默认受众（审查 C13）】')
    {
      const presets = await import('../src/lib/marketing/presets')
      const wb = presets.getPreset('winback')
      ok('老客召回模板带默认受众（只发给付过款的人）', !!wb?.audience && wb.audience.type === 'SEGMENT' && wb.audience.rules.paid === 'yes', JSON.stringify(wb?.audience))
      const d = await repo.createDraft({ preset: 'winback' }, admin.id)
      createdCampaigns.push(d.id)
      const expected = wb?.audience ? repo.canonicalAudience(types.audienceSpecSchema.parse(wb.audience)) : null
      ok('用老客召回新建：受众 = 模板受众（不是「全部活跃用户」）', !!expected && JSON.stringify(d.audience) === JSON.stringify(expected), JSON.stringify(d.audience))
      const d2 = await repo.createDraft({ preset: 'preset:winback', audience: { type: 'ALL', excludeInactive: false } }, admin.id)
      createdCampaigns.push(d2.id)
      ok('请求里给了受众 → 以请求为准', d2.audience.type === 'ALL' && d2.audience.excludeInactive === false, JSON.stringify(d2.audience))
      const plain = presets.PRESETS.find((p) => !p.audience && p.key !== 'winback')
      if (plain) {
        const d3 = await repo.createDraft({ preset: plain.key }, admin.id)
        createdCampaigns.push(d3.id)
        ok(`不带受众的模板（${plain.key}）→ 仍是默认「全部活跃用户」`, d3.audience.type === 'ALL' && d3.audience.excludeInactive === true, JSON.stringify(d3.audience))
      } else {
        skipped('不带受众的模板', '所有内置模板都带了受众')
      }
    }

    console.log('\n【保存草稿：乐观锁 / 无改动不写 / 非法内容】')
    {
      const base = d1.updatedAt
      const r0 = await repo.updateDraft(d1.id, { baseUpdatedAt: base, name: d1.name }, admin.id)
      ok('没改动：不写库、updatedAt 不变', r0.kind === 'ok' && r0.detail.updatedAt === base)

      const r1 = await repo.updateDraft(d1.id, { baseUpdatedAt: base, subject: '国庆\n特惠 {{nickname|朋友}}' }, admin.id)
      ok('保存成功', r1.kind === 'ok')
      const u1 = r1.kind === 'ok' ? r1.detail : null
      ok('主题里的换行被换成空格', u1?.subject === '国庆 特惠 {{nickname|朋友}}')
      ok('updatedAt 严格递增', !!u1 && new Date(u1.updatedAt).getTime() > new Date(base).getTime())

      const r2 = await repo.updateDraft(d1.id, { baseUpdatedAt: base, subject: '旧标签页' }, admin.id)
      ok('旧 baseUpdatedAt → conflict 并附服务器版本', r2.kind === 'conflict' && r2.detail.subject === u1?.subject)

      const r3 = await repo.updateDraft(d1.id, { baseUpdatedAt: u1!.updatedAt, doc: { v: 1, blocks: 'bad' } }, admin.id)
      ok('非法 doc → invalid（中文原因）', r3.kind === 'invalid' && /[一-龥]/.test(r3.message))

      const r4 = await repo.updateDraft(d1.id, { baseUpdatedAt: u1!.updatedAt, name: '   ' }, admin.id)
      ok('空活动名 → invalid', r4.kind === 'invalid')

      // 两个标签页拿着同一个 base 同时保存：恰好一个成功
      const [x, y] = await Promise.all([
        repo.updateDraft(d1.id, { baseUpdatedAt: u1!.updatedAt, preheader: '甲' }, admin.id),
        repo.updateDraft(d1.id, { baseUpdatedAt: u1!.updatedAt, preheader: '乙' }, admin.id),
      ])
      const kinds = [x.kind, y.kind].sort().join(',')
      ok('并发保存：一个 ok 一个 conflict', kinds === 'conflict,ok', kinds)

      await prisma.marketingCampaign.update({ where: { id: d1.id }, data: { status: 'SCHEDULED' } })
      const cur = await repo.loadCampaignDetail(d1.id)
      const r5 = await repo.updateDraft(d1.id, { baseUpdatedAt: cur!.updatedAt, subject: 'x' }, admin.id)
      ok('非草稿 → not_draft', r5.kind === 'not_draft')
      const del1 = await repo.deleteDraft(d1.id, admin.id)
      ok('非草稿不能删', del1 === 'not_draft')
      await prisma.marketingCampaign.update({ where: { id: d1.id }, data: { status: 'DRAFT' } })
    }

    console.log('\n【复制 / 模板】')
    {
      const src = (await repo.loadCampaignDetail(d1.id))!
      const dup = await repo.createDraft({ fromCampaignId: d1.id }, admin.id)
      createdCampaigns.push(dup.id)
      ok('复制：名称「副本」', dup.name === `${src.name} 副本`)
      ok('复制：内容指纹相同', dup.contentHash === src.contentHash)
      ok('复制：受众相同', JSON.stringify(dup.audience) === JSON.stringify(src.audience))
      ok('复制：写 DUPLICATE 审计', (await prisma.marketingAudit.count({ where: { campaignId: dup.id, action: 'DUPLICATE' } })) === 1)

      const t = await repo.saveCampaignAsTemplate(d1.id, `${TAG}-模板`, admin.id)
      createdTemplates.push(t.id)
      const items = await repo.listTemplateItems()
      ok('模板列表里有 tpl:<id>', items.some((i) => i.key === `tpl:${t.id}` && !i.builtIn))
      const fromTpl = await repo.createDraft({ preset: `tpl:${t.id}` }, admin.id)
      createdCampaigns.push(fromTpl.id)
      ok("用 'tpl:<id>' 新建：内容与原活动一致（受众不带）", fromTpl.contentHash === src.contentHash && fromTpl.audience.type === 'ALL')
      const fromTpl2 = await repo.createDraft({ templateId: t.id }, admin.id)
      createdCampaigns.push(fromTpl2.id)
      ok('用 templateId 新建同样可以', fromTpl2.contentHash === src.contentHash)
      ok('改名', (await repo.renameTemplate(t.id, '新名字', admin.id)) === true)
      ok('删除', (await repo.deleteTemplate(t.id, admin.id)) === true)
      ok('再删 → false', (await repo.deleteTemplate(t.id, admin.id)) === false)
    }

    console.log('\n【删除草稿】')
    {
      const tmp = await repo.createDraft({ name: `${TAG}-del` }, admin.id)
      await prisma.marketingLink.create({ data: { campaignId: tmp.id, idx: 0, url: 'https://bigolab.com/' } })
      ok('草稿可删', (await repo.deleteDraft(tmp.id, admin.id)) === 'ok')
      ok('残留 links 一并删除', (await prisma.marketingLink.count({ where: { campaignId: tmp.id } })) === 0)
      ok('再删 → not_found', (await repo.deleteDraft(tmp.id, admin.id)) === 'not_found')
    }

    console.log('\n【测试发送（dry-run）】')
    {
      const ts = await import('../src/lib/marketing/test-send')
      // 测试发送要求联系邮箱已配置：临时写一份（结束时还原）
      const { DEFAULT_CONFIG } = types
      await prisma.setting.upsert({
        where: { key: types.SETTING_KEYS.config },
        create: { key: types.SETTING_KEYS.config, value: JSON.stringify({ ...DEFAULT_CONFIG, contactEmail: 'service@bigolab.com' }) },
        update: { value: JSON.stringify({ ...DEFAULT_CONFIG, contactEmail: 'service@bigolab.com' }) },
      })
      const adminEmail = admin.email!.toLowerCase()
      try {
        const allowed = await ts.allowedTestRecipients()
        ok('允许的收件人含当前管理员邮箱', allowed.includes(adminEmail))

        let status = 0
        try {
          await ts.sendCampaignTest(d1.id, ['stranger@example.org'], admin.id)
        } catch (e) {
          status = (e as { status?: number }).status || -1
        }
        ok('白名单外的地址 → 400', status === 400)

        status = 0
        try {
          await ts.sendCampaignTest(d1.id, ['a@x.test', 'b@x.test', 'c@x.test', 'd@x.test', 'e@x.test', 'f@x.test'], admin.id)
        } catch (e) {
          status = (e as { status?: number }).status || -1
        }
        ok('一次超过 5 个 → 400', status === 400)

        // 能过检查的内容：有尊称、有主题
        const good = (await repo.loadCampaignDetail(d1.id))!
        const saved = await repo.updateDraft(d1.id, { baseUpdatedAt: good.updatedAt, subject: '{{nickname|朋友}}，国庆快乐', preheader: '一封测试' }, admin.id)
        const before = saved.kind === 'ok' ? saved.detail : good
        try {
          const r = await ts.sendCampaignTest(d1.id, [adminEmail], admin.id)
          const after = (await repo.loadCampaignDetail(d1.id))!
          ok('dry-run 发送成功', r.sent.length === 1 && r.sent[0].ok, JSON.stringify(r.sent))
          ok('成功后 testedCurrent', r.testedCurrent === true && after.testedCurrent === true)
          ok('写 testedHash 不改 updatedAt（编辑器不会撞 409）', after.updatedAt === before.updatedAt)
          const a = await prisma.marketingAudit.findFirst({ where: { campaignId: d1.id, action: 'TEST_SEND' }, orderBy: { id: 'desc' } })
          const detail = a?.detail ? JSON.parse(a.detail) : null
          ok('审计 TEST_SEND {count:1, ok:1}，不含地址', detail?.count === 1 && detail?.ok === 1 && !String(a?.detail).includes('@'))

          // 改内容后测试标记失效
          const s2 = await repo.updateDraft(d1.id, { baseUpdatedAt: after.updatedAt, preheader: '改过了' }, admin.id)
          ok('改内容后 testedCurrent=false', s2.kind === 'ok' && s2.detail.testedCurrent === false)

          // 24 小时上限：塞满审计（只算本脚本自己加的行，结束时删掉）
          const used = 30 - (await ts.testSendRemaining())
          const fill = Math.max(0, 30 - used)
          if (fill > 0) {
            await prisma.marketingAudit.create({
              data: { action: 'TEST_SEND', campaignId: d1.id, actorId: admin.id, detail: JSON.stringify({ count: fill, ok: 0, tag: TAG }), createdAt: new Date() },
            })
          }
          status = 0
          try {
            await ts.sendCampaignTest(d1.id, [adminEmail], admin.id)
          } catch (e) {
            status = (e as { status?: number }).status || -1
          }
          ok('24 小时 30 封用完 → 429', status === 429)
        } catch (e) {
          if (isNotImplemented(e)) skipped('dry-run 发送链路', '渲染器 / 发送引擎尚未实现')
          else throw e
        }

        // 内容检查不通过（没有尊称）→ 400，payload 带 issues
        const cur = (await repo.loadCampaignDetail(d1.id))!
        const bad = repo.fallbackBlankDoc()
        ;(bad.blocks[0] as { content: unknown }).content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '没有尊称的一段话' }] }] }
        await repo.updateDraft(d1.id, { baseUpdatedAt: cur.updatedAt, subject: '没有尊称', doc: bad }, admin.id)
        try {
          let payload: { issues?: { level: string }[] } | undefined
          status = 0
          try {
            await ts.sendCampaignTest(d1.id, [adminEmail], admin.id)
          } catch (e) {
            status = (e as { status?: number }).status || -1
            payload = (e as { payload?: { issues?: { level: string }[] } }).payload
          }
          ok('缺尊称 → 400 且带 issues（有 error）', status === 400 && !!payload?.issues?.some((i) => i.level === 'error'), `status=${status}`)
        } catch (e) {
          if (isNotImplemented(e)) skipped('内容检查拒发', 'lint 尚未实现')
          else throw e
        }
      } finally {
        if (configBackup) {
          await prisma.setting.update({ where: { key: types.SETTING_KEYS.config }, data: { value: configBackup.value } })
        } else {
          await prisma.setting.deleteMany({ where: { key: types.SETTING_KEYS.config } })
        }
      }
    }
  } finally {
    // 清理：本脚本建的活动、模板、审计、管理员
    await prisma.marketingAudit.deleteMany({ where: { OR: [{ campaignId: { in: createdCampaigns } }, { actorId: admin.id }] } })
    await prisma.marketingLink.deleteMany({ where: { campaignId: { in: createdCampaigns } } })
    await prisma.marketingCampaign.deleteMany({ where: { id: { in: createdCampaigns } } })
    await prisma.marketingTemplate.deleteMany({ where: { OR: [{ id: { in: createdTemplates } }, { createdBy: admin.id }] } })
    await prisma.user.delete({ where: { id: admin.id } })
  }
}

main()
  .catch((e) => {
    console.error(e)
    fail++
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log(`\n通过 ${pass}，失败 ${fail}${skip ? `，跳过 ${skip}` : ''}`)
    process.exit(fail === 0 ? 0 : 1)
  })
